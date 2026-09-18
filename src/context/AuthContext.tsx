import React,{createContext,useCallback,useContext,useEffect,useMemo,useState} from 'react';
import type { AuthProfile as CloudUser } from '../services/authProfile';
import { supabase,toAuthSession,readOAuthHash,readOAuthError,clearOAuthHash,initializeSupabase,type AuthSession } from '../lib/supabase/client';
import { getProfile,updateProfileData } from '../services/authProfile';
import { getAuthRedirectUrl,isSupabaseConfigured } from '../config/env';

interface AuthContextValue { session:AuthSession|null; user:CloudUser|null; loading:boolean; configured:boolean; signIn:(email:string,password:string)=>Promise<void>; signUp:(name:string,email:string,password:string)=>Promise<void>; signInWithGoogle:()=>Promise<void>; resetPassword:(email:string)=>Promise<void>; updateName:(name:string)=>Promise<void>; updatePhoto:(url:string)=>Promise<void>; changePassword:(current:string,next:string)=>Promise<void>; setNewPassword:(next:string)=>Promise<void>; signOut:()=>Promise<void>; pendingProfileSetup:boolean; completeProfileSetup:(name:string)=>Promise<void>; deactivatedAccount:boolean; recoverAccount:(changePassword:boolean)=>Promise<void>; }
const AuthContext=createContext<AuthContextValue|null>(null);
function profileFallback(session:AuthSession,stored?:any):CloudUser{return {uid:session.localId,email:stored?.email||session.email,displayName:stored?.display_name??stored?.displayName??session.displayName??session.email.split('@')[0],photoURL:stored?.photo_url??stored?.photoURL??session.photoURL,createdAt:stored?.created_at??stored?.createdAt??new Date().toISOString(),status:stored?.status||'active',onboardingComplete:stored?.onboarding_complete??stored?.onboardingComplete};}

async function ensureServerProfile(session:AuthSession):Promise<CloudUser|null>{
  try {
    const response=await fetch('/.netlify/functions/account-actions',{method:'POST',headers:{Authorization:`Bearer ${session.accessToken}`,'Content-Type':'application/json'},body:JSON.stringify({action:'ensure-profile'})});
    if(!response.ok) return null;
    const data=await response.json();
    return data?.profile||null;
  } catch { return null; }
}

export function AuthProvider({children}:{children:React.ReactNode}){
 const [session,setSession]=useState<AuthSession|null>(null); const [user,setUser]=useState<CloudUser|null>(null); const [loading,setLoading]=useState(true); const [configured,setConfigured]=useState(isSupabaseConfigured()); const [pendingProfileSetup,setPendingProfileSetup]=useState(false); const [deactivatedAccount,setDeactivatedAccount]=useState(false);
 const hydrate=useCallback(async(rawSession:any)=>{
  const next=toAuthSession(rawSession);
  setSession(next);
  if(!next){setUser(null);setPendingProfileSetup(false);setDeactivatedAccount(false);return;}
  try{
    let p=await getProfile(next);
    if(!p){
      p=await ensureServerProfile(next);
      if(p) setUser(p);
    }
    const profile=p||profileFallback(next);
    setUser(profile);
    if(profile.status==='deactivated'){setDeactivatedAccount(true);setPendingProfileSetup(false);return;}
    setDeactivatedAccount(false);
    setPendingProfileSetup(false);
  }catch{
    const serverProfile=await ensureServerProfile(next);
    setUser(serverProfile||profileFallback(next));
    setDeactivatedAccount(serverProfile?.status==='deactivated');
    setPendingProfileSetup(false);
  }
 },[]);
 useEffect(()=>{
  let alive=true;
  let subscription:{unsubscribe:()=>void}|null=null;
  void (async()=>{
    try{
      const ready=await initializeSupabase();
      if(!ready){if(alive)setConfigured(false);return;}
      if(alive)setConfigured(true);
      // Subscribe before consuming an OAuth callback so no auth event can be missed.
      const authState=supabase.auth.onAuthStateChange((_event,s)=>{
        window.setTimeout(()=>{if(alive)void hydrate(s);},0);
      });
      subscription=authState.data.subscription;
      const oauthError=readOAuthError();
      if(oauthError){clearOAuthHash();throw new Error(oauthError.replace(/\+/g,' '));}
      const oauth=readOAuthHash();
      if(oauth){
        const {data,error}=await supabase.auth.setSession({access_token:oauth.accessToken,refresh_token:oauth.refreshToken});
        clearOAuthHash();
        if(error) throw error;
        if(alive) await hydrate(data.session);
      } else {
        const {data,error}=await supabase.auth.getSession();
        if(error) throw error;
        if(alive) await hydrate(data.session);
      }
    }catch{
      if(alive){setSession(null);setUser(null);clearOAuthHash();}
    }finally{if(alive)setLoading(false);}
  })();
  return()=>{alive=false;subscription?.unsubscribe()};
 },[hydrate]);
 const signIn=useCallback(async(email:string,password:string)=>{const {data,error}=await supabase.auth.signInWithPassword({email:email.trim(),password});if(error)throw new Error(error.message);await hydrate(data.session);},[hydrate]);
 const signUp=useCallback(async(name:string,email:string,password:string)=>{const {data,error}=await supabase.auth.signUp({email:email.trim(),password,options:{data:{full_name:name.trim(),name:name.trim()}}});if(error)throw new Error(error.message);if(!data.user)throw new Error('Account could not be created. Please try again.');if(!data.session)throw new Error('Account created. Check your email to confirm your DocBit account before signing in.');await hydrate(data.session);},[hydrate]);
 const signInWithGoogle=useCallback(async()=>{const redirectTo=getAuthRedirectUrl('/auth/callback');const {error}=await supabase.auth.signInWithOAuth({provider:'google',options:{redirectTo,queryParams:{access_type:'offline',prompt:'select_account'}}});if(error)throw new Error(error.message);},[]);
 const resetPassword=useCallback(async(email:string)=>{const {error}=await supabase.auth.resetPasswordForEmail(email.trim(),{redirectTo:getAuthRedirectUrl('/password/reset')});if(error)throw new Error(error.message);},[]);
 const updateName=useCallback(async(name:string)=>{if(!session)throw new Error('You are not signed in.');const {error}=await supabase.auth.updateUser({data:{full_name:name.trim(),name:name.trim()}});if(error)throw new Error(error.message);const p=await updateProfileData(session,{displayName:name.trim()});setUser(profileFallback(session,p));},[session]);
 const updatePhoto=useCallback(async(url:string)=>{if(!session)throw new Error('You are not signed in.');const p=await updateProfileData(session,{photoURL:url});setUser(profileFallback(session,p));},[session]);
 const changePassword=useCallback(async(current:string,next:string)=>{if(!session)throw new Error('You are not signed in.');const {error:re}=await supabase.auth.signInWithPassword({email:session.email,password:current});if(re)throw new Error('Current password is incorrect.');const {error}=await supabase.auth.updateUser({password:next});if(error)throw new Error(error.message);},[session]);
 const setNewPassword=useCallback(async(next:string)=>{const {error}=await supabase.auth.updateUser({password:next});if(error)throw new Error(error.message);},[]);
 const signOut=useCallback(async()=>{await supabase.auth.signOut();setSession(null);setUser(null);setPendingProfileSetup(false);setDeactivatedAccount(false);},[]);
 const completeProfileSetup=useCallback(async(name:string)=>{if(!session)throw new Error('Session expired.');await updateName(name);const {error}=await supabase.from('profiles').update({onboarding_complete:true}).eq('id',session.localId);if(error)throw new Error(error.message);setPendingProfileSetup(false);},[session,updateName]);
 const recoverAccount=useCallback(async(change:boolean)=>{if(!session||!user)throw new Error('Account information is unavailable.');const response=await fetch('/.netlify/functions/account-actions',{method:'POST',headers:{Authorization:`Bearer ${session.idToken}`,'Content-Type':'application/json'},body:JSON.stringify({action:'recover'})});const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data?.error||'Could not recover the account.');setDeactivatedAccount(false);setUser(u=>u?{...u,status:'active'}:u);if(change)await supabase.auth.resetPasswordForEmail(user.email,{redirectTo:getAuthRedirectUrl('/password/reset')});},[session,user]);
 const value=useMemo(()=>({session,user,loading,configured,signIn,signUp,signInWithGoogle,resetPassword,updateName,updatePhoto,changePassword,setNewPassword,signOut,pendingProfileSetup,completeProfileSetup,deactivatedAccount,recoverAccount}),[session,user,loading,signIn,signUp,signInWithGoogle,resetPassword,updateName,updatePhoto,changePassword,setNewPassword,signOut,pendingProfileSetup,completeProfileSetup,deactivatedAccount,recoverAccount]);
 return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth(){const c=useContext(AuthContext);if(!c)throw new Error('useAuth must be used inside AuthProvider');return c;}
