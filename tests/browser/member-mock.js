// This adapter is supplied only by Playwright network interception, never by app code.
export async function mockMembership(page,initial={user:{uid:'test-creator',email:'creator@example.test'},profile:{username:'test_creator'},creator:true}){
  await page.route('**/src/firebase-client.js',route=>route.fulfill({contentType:'application/javascript',body:`
    let state={ready:true,configured:true,verified:true,...${JSON.stringify(initial)}};
    export async function createAuthClient(notify){
      const emit=()=>notify({...state});window.testMembership={set(next){state={...state,...next};emit();},get state(){return state;}};emit();
      return {
        async login(username,password){if(password==='wrongpass')throw Object.assign(new Error('bad'),{code:'auth/invalid-credential'});state={...state,user:{uid:'test-member',email:username+'@accounts.hiflyguy.invalid'},profile:{username},creator:false,entitlement:null};emit();},
        async signup(username,password){state={...state,user:{uid:'test-member',email:username+'@accounts.hiflyguy.invalid'},profile:{username:username.toLowerCase()},creator:false,entitlement:null};emit();},
        async logout(){state={ready:true,configured:true,user:null,profile:null,entitlement:null,verified:false,creator:false};emit();},
        async changePassword(){},async claimUsername(username){state.profile={username};emit();},async refresh(){emit();},
        async checkout(tier,username){if(state.profile?.username!==username)throw new Error('Wrong account');window.checkoutRequest={tier,username};return username;}
      };
    }
  `}));
}
