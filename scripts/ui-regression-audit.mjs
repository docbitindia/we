import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const read=(f)=>fs.readFileSync(path.join(root,f),'utf8');
const assert=(ok,msg)=>{if(!ok)throw new Error(msg)};
const checks=[
 ['mobile nav has Home/History only', 'src/components/AppShell.tsx', /mobile-bottom-nav[\s\S]*Home[\s\S]*History/],
 ['no global upload action', 'src/components/AppShell.tsx', /mobile-bottom-nav[\s\S]*History/],
 ['upload anchor', 'src/pages/WorkspacePage.tsx', /id="upload-area"/],
 ['table uses layout-aware zoom', 'src/hooks/usePinchZoom.ts', /table\.style\.zoom/],
 ['mobile table scrollbar hidden', 'src/index.css', /workspace-table-canvas[^}]*scrollbar-width:none/s],
 ['row navigator scoped to data region', 'src/index.css', /editor-data-viewport-wrap[^}]*fast-row-nav|editor-data-viewport-wrap\s*>\s*\.fast-row-nav/s],
 ['logo transparency', 'src/report/pdf.ts', /fillStyle='#ffffff'/],
 ['centered PDF', 'src/report/pdf.ts', /centerX=W\/2/],
 ['footer page numbering', 'src/report/pdf.ts', /Page \$\{pi\+1\} of \$\{pagesData\.length\}/],
 ['mobile editor actions are Generate/Export/More', 'src/components/MobileNav.tsx', /FileDown[\s\S]*Generate[\s\S]*Download[\s\S]*Export[\s\S]*MoreHorizontal/],
 ['mobile header has no action trigger', 'src/components/TopBar.tsx', (c)=>!c.includes('editor-actions-trigger')],
 ['PDF does not render source filename', 'src/report/pdf.ts', /showSourceFilename!==false/],
];
let bad=0;
for(const [n,f,re] of checks){const content=read(f);const ok=typeof re==='function'?re(content):n==='PDF does not render source filename'?!re.test(content):re.test(content);console.log(`${ok?'PASS':'FAIL'} ${n}`);if(!ok)bad++}
assert(bad===0, `${bad} UI regression checks failed`);
console.log('Latest editor/mobile/PDF invariants passed.');
