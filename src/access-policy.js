export const PLANS={
  flyest:{name:'Flyest Guy',price:'$28.99',period:'month',url:'https://square.link/u/z7XqVcUJ'},
  god:{name:'Da God',price:'$299',period:'year',url:'https://square.link/u/u4wSCV1J'},
};
export const normalizeUsername=value=>String(value??'').trim().toLowerCase();
export const validUsername=value=>/^[a-z][a-z0-9_]{2,19}$/.test(value);
export function usernameIdentity(value){
  const username=normalizeUsername(value);if(!validUsername(username))throw new Error('Use 3?20 characters: letters, numbers or underscores, starting with a letter.');
  return username+'@accounts.hiflyguy.invalid';
}
export function membershipTier(state,now=Date.now()){
  if(!state?.user)return 'guest';
  if(state.creator===true)return 'godfather';
  const e=state.entitlement;
  return state.verified&&PLANS[e?.tier]&&Number.isFinite(e.expiresAt)&&e.expiresAt>now?e.tier:'free';
}
export function canAccess(state,action,room='habitat',now=Date.now()){
  const tier=membershipTier(state,now),paid=tier==='flyest'||tier==='god';
  if(['observe','brain','camera'].includes(action))return true;
  if(action==='director')return !!(state?.user&&state.creator===true);
  if(action==='food')return paid||!!(state?.user&&state.creator===true)||room==='habitat';
  return paid||!!(state?.user&&state?.creator);
}
export function scopedStorage(storage,uid='guest'){
  const prefix=`hiflyguy.account.${uid}.`;
  return {getItem:key=>storage?.getItem(prefix+key),setItem:(key,value)=>{if(!storage)throw new Error('Storage unavailable');storage.setItem(prefix+key,value);}};
}
