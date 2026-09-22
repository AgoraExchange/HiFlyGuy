import {initializeApp,applicationDefault} from 'firebase-admin/app';
import {getFirestore,Timestamp,FieldValue} from 'firebase-admin/firestore';
import {createHash} from 'node:crypto';
import {normalizeUsername,validUsername,PLANS} from '../src/access-policy.js';

const args=process.argv.slice(2),arg=name=>{const i=args.indexOf(name);return i<0?undefined:args[i+1];};
if(args.includes('--help')||!args.length){
  console.log('Preview: npm run membership -- --username NAME --tier flyest|god --payment VERIFIED_SQUARE_REFERENCE [--until ISO_DATE]\nGrant: add --apply after reviewing the preview.\nRevoke: --username NAME --tier free --apply\nCreator access: --username YOUR_NAME --creator --apply\nRequires trusted Application Default Credentials or GOOGLE_APPLICATION_CREDENTIALS pointing to an admin key stored outside this repository.');process.exit(0);
}
const username=normalizeUsername(arg('--username')),tier=arg('--tier'),creator=args.includes('--creator'),apply=args.includes('--apply'),reference=arg('--payment');
if(!validUsername(username))throw new Error('A valid account username is required.');
if(!creator&&!['free',...Object.keys(PLANS)].includes(tier))throw new Error('Choose flyest, god or free.');
if(!creator&&tier!=='free'&&(!reference||reference.length<4))throw new Error('Supply the verified Square payment reference. This command does not verify payment for you.');
initializeApp({credential:applicationDefault(),projectId:process.env.FIREBASE_PROJECT_ID||'hiflyguy'});
const db=getFirestore(),name=await db.doc(`usernames/${username}`).get();
if(!name.exists)throw new Error('That username has not been registered.');
const uid=name.data().uid,profile=await db.doc(`profiles/${uid}`).get();
if(profile.data()?.username!==username)throw new Error('Username and profile do not match. No change made.');
if(creator){
  console.log(`Godfather owner access for @${username} (${uid}).`);
  if(apply){await db.doc(`roles/${uid}`).set({role:'godfather',updatedAt:FieldValue.serverTimestamp()});console.log('Godfather owner access granted. The open site will update automatically.');}else console.log('Preview only. Add --apply to grant.');
}else{
  const ref=db.doc(`entitlements/${uid}`),current=(await ref.get()).data();
  let expiresAt=new Date();
  if(tier!=='free'){
    const base=Math.max(Date.now(),current?.tier===tier?(current.expiresAt?.toMillis?.()??0):0);
    expiresAt=new Date(base);const day=expiresAt.getUTCDate();expiresAt.setUTCDate(1);
    expiresAt.setUTCMonth(expiresAt.getUTCMonth()+(tier==='god'?12:1));
    const last=new Date(Date.UTC(expiresAt.getUTCFullYear(),expiresAt.getUTCMonth()+1,0)).getUTCDate();expiresAt.setUTCDate(Math.min(day,last));
    if(arg('--until'))expiresAt=new Date(arg('--until'));
    if(!Number.isFinite(+expiresAt)||+expiresAt<=Date.now())throw new Error('Expiry must be a valid future date.');
  }
  console.log(JSON.stringify({username,uid,tier,expiresAt:expiresAt.toISOString(),paymentReference:reference??null,mode:apply?'APPLY':'PREVIEW'},null,2));
  if(apply){
    const receipt=reference?db.doc(`membershipPayments/${createHash('sha256').update(reference).digest('hex')}`):null;
    await db.runTransaction(async tx=>{
      const latest=(await tx.get(ref)).data();
      if(latest?.tier!==current?.tier||latest?.expiresAt?.toMillis?.()!==current?.expiresAt?.toMillis?.())throw new Error('Membership changed while preparing this grant. Rerun to calculate the correct expiry.');
      if(receipt&&(await tx.get(receipt)).exists)throw new Error('That payment was already applied. No duplicate extension made.');
      tx.set(ref,{tier,expiresAt:Timestamp.fromDate(expiresAt),updatedAt:FieldValue.serverTimestamp(),paymentReference:reference??null});
      if(receipt)tx.create(receipt,{uid,username,tier,reference,expiresAt:Timestamp.fromDate(expiresAt),appliedAt:FieldValue.serverTimestamp()});
    });
    console.log(tier==='free'?'Membership revoked.':'Membership activated. The open website will receive the update.');
  }else console.log('Preview only. Add --apply after confirming the payment and account.');
}
