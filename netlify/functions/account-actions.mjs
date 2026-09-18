import { createClient } from '@supabase/supabase-js';
const supabaseUrl=()=>(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL)||'';
const admin=()=>createClient(supabaseUrl(),process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{autoRefreshToken:false,persistSession:false}});
async function collect(a,bucket,prefix='',out=[]){const {data,error}=await a.storage.from(bucket).list(prefix,{limit:1000});if(error)throw error;for(const item of data||[]){const full=prefix?`${prefix}/${item.name}`:item.name;if(item.id)out.push(full);else await collect(a,bucket,full,out)}return out;}
function profileFrom(row){return row?{uid:row.id,email:row.email||'',displayName:row.display_name||row.email?.split('@')[0]||'DocBit user',photoURL:row.photo_url||undefined,createdAt:row.created_at,status:row.status||'active',onboardingComplete:Boolean(row.onboarding_complete)}:null;}
export default async request=>{if(request.method!=='POST')return new Response('Method not allowed',{status:405});const token=(request.headers.get('authorization')||'').replace(/^Bearer\s+/i,'');if(!token)return Response.json({error:'Authentication required.'},{status:401});try{if(!supabaseUrl()||!process.env.SUPABASE_SERVICE_ROLE_KEY)return Response.json({error:'Server authentication is not configured.'},{status:503});const a=admin();const {data:{user},error}=await a.auth.getUser(token);if(error||!user)return Response.json({error:'Authentication required.'},{status:401});const body=await request.json().catch(()=>({}));const action=body?.action;
if(action==='ensure-profile'){
 const metadata=user.user_metadata||{};
 const displayName=(metadata.full_name||metadata.name||user.email?.split('@')[0]||'DocBit user').trim();
 const photoUrl=metadata.avatar_url||metadata.picture||null;
 const {data:existing}=await a.from('profiles').select('*').eq('id',user.id).maybeSingle();
 let profileRow;
 if(existing){
   const patch={email:user.email||existing.email||'',display_name:existing.display_name||displayName,photo_url:existing.photo_url||photoUrl};
   const {data:updated,error:e}=await a.from('profiles').update(patch).eq('id',user.id).select('*').single();
   if(e)throw e; profileRow=updated;
 } else {
   const {data:created,error:e}=await a.from('profiles').insert({id:user.id,email:user.email||'',display_name:displayName,photo_url:photoUrl,status:'active',onboarding_complete:true}).select('*').single();
   if(e)throw e; profileRow=created;
 }
 // Ensure 7-day free trial subscription for every user
 const {data:sub}=await a.from('subscriptions').select('id').eq('user_id',user.id).maybeSingle();
 if(!sub){
   const now=new Date();
   const trialEnd=new Date(now.getTime()+7*24*60*60*1000);
   await a.from('subscriptions').insert({
     user_id:user.id,
     plan:'trial',
     status:'active',
     trial_start:now.toISOString(),
     trial_end:trialEnd.toISOString(),
     current_period_end:trialEnd.toISOString()
   });
 }
 // Ensure usage counters
 const {data:usage}=await a.from('usage_counters').select('id').eq('user_id',user.id).maybeSingle();
 if(!usage){
   await a.from('usage_counters').insert({user_id:user.id,reports_generated:0,data_processed_bytes:0,storage_bytes:0});
 }
 return Response.json({ok:true,profile:profileFrom(profileRow)});
}
if(action==='recover'||action==='deactivate'){const status=action==='recover'?'active':'deactivated';const {error:e}=await a.from('profiles').update({status}).eq('id',user.id);if(e)throw e;return Response.json({ok:true,action});}if(action==='delete'){const avatars=await collect(a,'profile-media',`avatars/${user.id}`).catch(()=>[]);for(let i=0;i<avatars.length;i+=100){const {error:e}=await a.storage.from('profile-media').remove(avatars.slice(i,i+100));if(e)throw e;}const {error:e}=await a.auth.admin.deleteUser(user.id);if(e)throw e;return Response.json({ok:true,action:'delete'});}return Response.json({error:'Invalid account action.'},{status:400});}catch(e){return Response.json({error:e?.message||'Account action failed.'},{status:400});}};
