import {normalizeUsername,validUsername,usernameIdentity} from './access-policy.js';

const config={apiKey:(import.meta.env.VITE_FIREBASE_API_KEY||"AIzaSyDxgz-kfKrMfInx0Zs2pVH6sMpO96_mzOQ"),authDomain:(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN||"hiflyguy.firebaseapp.com"),
  projectId:(import.meta.env.VITE_FIREBASE_PROJECT_ID||"hiflyguy"),appId:(import.meta.env.VITE_FIREBASE_APP_ID||"1:1049341776726:web:a60d2c348d67f63d4abcf7")};
export const firebaseConfigured=Object.values(config).every(Boolean);
export async function createAuthClient(onChange){
  if(!firebaseConfigured){onChange({user:null,profile:null,entitlement:null,verified:false,ready:true,configured:false});return null;}
  const [{initializeApp},{getAuth,onAuthStateChanged,createUserWithEmailAndPassword,signInWithEmailAndPassword,signOut,updatePassword,reauthenticateWithCredential,EmailAuthProvider},dbSDK]=await Promise.all([
    import('firebase/app'),import('firebase/auth'),import('firebase/firestore'),
  ]);
  const {getFirestore,doc,getDoc,runTransaction,onSnapshot,serverTimestamp,setDoc}=dbSDK;
  const app=initializeApp(config),auth=getAuth(app),db=getFirestore(app);
  let stopProfile=()=>{},stopEntitlement=()=>{},stopRole=()=>{},generation=0;
  let current={user:null,profile:null,entitlement:null,verified:false,ready:false,configured:true,creator:false};
  const emit=()=>onChange({...current});
  onAuthStateChanged(auth,async user=>{
    const g=++generation;stopProfile();stopEntitlement();stopRole();
    current={user,profile:null,entitlement:null,verified:false,creator:false,ready:true,configured:true};emit();
    if(!user)return;
    stopRole=onSnapshot(doc(db,'roles',user.uid),{includeMetadataChanges:true},snapshot=>{
      if(g!==generation)return;current.creator=!snapshot.metadata.fromCache&&!snapshot.metadata.hasPendingWrites&&snapshot.data()?.role==='godfather';emit();
    },()=>{if(g!==generation)return;current.creator=false;emit();});
    stopProfile=onSnapshot(doc(db,'profiles',user.uid),snapshot=>{if(g!==generation)return;current.profile=snapshot.data()??null;emit();},()=>{if(g!==generation)return;current.profile=null;current.error='Your account profile could not load. Please retry when connected.';emit();});
    stopEntitlement=onSnapshot(doc(db,'entitlements',user.uid),{includeMetadataChanges:true},snapshot=>{
      if(g!==generation)return;const data=snapshot.data();current.entitlement=data?{tier:data.tier,expiresAt:data.expiresAt?.toMillis?.()??0}:null;
      current.verified=!snapshot.metadata.fromCache&&!snapshot.metadata.hasPendingWrites;emit();
    },()=>{if(g!==generation)return;current.entitlement=null;current.verified=false;current.error='Membership could not be verified. Free access remains available.';emit();});
  },()=>{current={user:null,ready:true,configured:true,error:'Sign-in could not initialize. You can still explore as a visitor.'};emit();});
  async function claimUsername(value){
    const username=normalizeUsername(value),uid=auth.currentUser?.uid;
    if(!uid)throw new Error('Please sign in first.');
    if(auth.currentUser.email!==usernameIdentity(username))throw new Error('Use the username you registered with.');
    if(!validUsername(username))throw new Error('Use 3–20 characters: start with a letter, then letters, numbers or underscores.');
    await runTransaction(db,async tx=>{
      const profileRef=doc(db,'profiles',uid),nameRef=doc(db,'usernames',username);
      const [profile,name]=await Promise.all([tx.get(profileRef),tx.get(nameRef)]);
      if(profile.exists()){if(profile.data().username===username)return;throw new Error('This account already has a permanent username.');}
      if(name.exists())throw new Error('That username is already taken. Choose another.');
      tx.set(nameRef,{uid});tx.set(profileRef,{username,createdAt:serverTimestamp()});
    });
  }
  return {
    async signup(username,password){
      const identity=usernameIdentity(username);
      await createUserWithEmailAndPassword(auth,identity,password);
      await claimUsername(username);
    },
    login:(username,password)=>signInWithEmailAndPassword(auth,usernameIdentity(username),password),
    logout:()=>signOut(auth),claimUsername,
    async changePassword(previous,next){
      const user=auth.currentUser;if(!user)throw new Error('Sign in first.');
      await reauthenticateWithCredential(user,EmailAuthProvider.credential(user.email,previous));
      await updatePassword(user,next);
    },
    async refresh(){
      const user=auth.currentUser;if(!user)return;
      const snap=await getDoc(doc(db,'entitlements',user.uid));
      if(auth.currentUser?.uid!==user.uid)return;
      const data=snap.data();current.entitlement=data?{tier:data.tier,expiresAt:data.expiresAt?.toMillis?.()??0}:null;
      current.verified=!snap.metadata.fromCache;emit();
    },
    async checkout(tier,username){
      const user=auth.currentUser,normalized=normalizeUsername(username);
      if(!user||!['flyest','god'].includes(tier))throw new Error('Sign in and select a plan.');
      const profile=await getDoc(doc(db,'profiles',user.uid));
      if(!profile.exists()||profile.data().username!==normalized)throw new Error('Enter the username belonging to this signed-in account.');
      // This is a request, never an entitlement or proof of payment.
      await setDoc(doc(db,'profiles',user.uid,'checkoutRequests',tier),{username:normalized,tier,requestedAt:serverTimestamp()});
      return normalized;
    },
  };
}
