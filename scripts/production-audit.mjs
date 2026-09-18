import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const required=['src/App.tsx','src/report/pdf.ts','src/report/templates.ts','src/report/manifest.ts','src/report/preflight.ts','src/context/AuthContext.tsx','src/lib/supabase/client.ts','netlify/functions/account-actions.mjs','netlify/functions/entitlement.mjs','netlify/functions/report-jobs.mjs','public/manifest.webmanifest','public/sw.js'];
for(const f of required){if(!fs.existsSync(path.join(root,f)))throw new Error(`Missing ${f}`)}
const app=fs.readFileSync(path.join(root,'src/App.tsx'),'utf8');for(const r of ['/report','/profile','/billing','/settings','/auth/callback'])if(!app.includes(r))throw new Error(`Missing route ${r}`);
const auth=fs.readFileSync(path.join(root,'src/context/AuthContext.tsx'),'utf8');for(const term of ['signInWithOAuth','setSession','ensure-profile','getAuthRedirectUrl'])if(!auth.includes(term))throw new Error(`Authentication integration missing ${term}`);
const client=fs.readFileSync(path.join(root,'src/lib/supabase/client.ts'),'utf8');if(!client.includes('detectSessionInUrl: true'))throw new Error('Supabase URL session detection missing');
const templates=fs.readFileSync(path.join(root,'src/report/templates.ts'),'utf8');if((templates.match(/id:'/g)||[]).length<10)throw new Error('Expected ten report templates');
const pdf=fs.readFileSync(path.join(root,'src/report/pdf.ts'),'utf8');if(!pdf.includes('Page ${pi+1} of ${pagesData.length}'))throw new Error('Authoritative page footer missing');if(pdf.includes('MAX_ROWS'))throw new Error('Legacy PDF row cap remains');
console.log('Docbit production source audit: PASS');
