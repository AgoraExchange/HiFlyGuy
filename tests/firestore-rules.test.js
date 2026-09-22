import test from 'node:test';
import fs from 'node:fs/promises';
// Run under the Firestore emulator after installing @firebase/rules-unit-testing.
// Kept separate from the ordinary unit suite so no production project is touched.
test('Firestore enforces username ownership and admin-only entitlements',{skip:!process.env.FIRESTORE_EMULATOR_HOST},async()=>{
  const {initializeTestEnvironment,assertSucceeds,assertFails}=await import('@firebase/rules-unit-testing');
  const {doc,writeBatch,setDoc,getDoc,serverTimestamp,Timestamp}=await import('firebase/firestore');
  const env=await initializeTestEnvironment({projectId:'demo-hiflyguy',firestore:{rules:await fs.readFile(new URL('../firestore.rules',import.meta.url),'utf8')}});
  try{
    const a=env.authenticatedContext('alice',{email:'alice_fly@accounts.hiflyguy.invalid'}).firestore(),b=env.authenticatedContext('bob',{email:'bob_fly@accounts.hiflyguy.invalid'}).firestore(),guest=env.unauthenticatedContext().firestore();
    const register=(db,uid,username)=>{const batch=writeBatch(db);batch.set(doc(db,'profiles',uid),{username,createdAt:serverTimestamp()});batch.set(doc(db,'usernames',username),{uid});return batch.commit();};
    await assertSucceeds(register(a,'alice','alice_fly'));
    await assertFails(register(b,'bob','alice_fly'));
    await assertSucceeds(register(b,'bob','bob_fly'));
    await assertFails(getDoc(doc(b,'profiles','alice')));
    await assertFails(getDoc(doc(guest,'usernames','alice_fly')));
    await assertFails(setDoc(doc(a,'profiles','alice'),{username:'new_name',createdAt:serverTimestamp()}));
    await assertFails(setDoc(doc(a,'roles','alice'),{role:'godfather'}));
    await assertFails(setDoc(doc(a,'entitlements','alice'),{tier:'god',expiresAt:Timestamp.fromMillis(Date.now()+100000)}));
    await assertSucceeds(setDoc(doc(a,'profiles','alice','checkoutRequests','flyest'),{username:'alice_fly',tier:'flyest',requestedAt:serverTimestamp()}));
    await assertFails(setDoc(doc(a,'profiles','alice','checkoutRequests','god'),{username:'bob_fly',tier:'god',requestedAt:serverTimestamp()}));
    await assertFails(setDoc(doc(b,'profiles','alice','checkoutRequests','flyest'),{username:'alice_fly',tier:'flyest',requestedAt:serverTimestamp()}));
    await env.withSecurityRulesDisabled(async context=>{await setDoc(doc(context.firestore(),'entitlements','alice'),{tier:'god',expiresAt:Timestamp.fromMillis(Date.now()+100000)});});
    await assertSucceeds(getDoc(doc(a,'entitlements','alice')));await assertFails(getDoc(doc(b,'entitlements','alice')));
  }finally{await env.cleanup();}
});
