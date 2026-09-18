import { supabase } from '../lib/supabase/client';
export interface Entitlement { plan:'trial'|'pro'|'expired'; status:string; trialStart:string|null; trialEnd:string|null; currentPeriodEnd:string|null; reportsGenerated:number; dataProcessedBytes:number; storageBytes:number; }
export async function getEntitlement():Promise<Entitlement|null>{ const {data:{session}}=await supabase.auth.getSession(); if(!session)return null; const r=await fetch('/.netlify/functions/entitlement',{headers:{Authorization:`Bearer ${session.access_token}`}}); if(!r.ok)return null; return r.json(); }
