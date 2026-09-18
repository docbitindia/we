import type { ProcessedReport } from '../types/processed';
import type { RawDataset } from '../types/dataset';
import type { ReportBranding, ReportConfig } from '../types/report';
import { displayCell } from '../utils/format';
import { getReportTemplate } from './templates';

const DEFAULT_W=842, DEFAULT_H=595;
type Obj={body:string|Uint8Array;stream?:Uint8Array};
const esc=(v:unknown)=>String(v??'').replace(/[\u0000-\u001f\u007f-\uffff]/g,'?').replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)');
const rgb=(hex:string)=>{const m=/^#([0-9a-f]{6})$/i.exec(hex);return m?[0,2,4].map(i=>parseInt(m[1].slice(i,i+2),16)/255):[.145,.388,.922]};
const txt=(x:number,y:number,size:number,text:string,color=[.1,.13,.2])=>`${color[0]} ${color[1]} ${color[2]} rg BT /F1 ${size} Tf 1 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)} Tm (${esc(text)}) Tj ET`;
const rect=(x:number,y:number,w:number,h:number,fill:number[])=>`${fill[0]} ${fill[1]} ${fill[2]} rg ${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re f`;
const line=(x1:number,y1:number,x2:number,y2:number,color=[.87,.89,.92])=>`${color[0]} ${color[1]} ${color[2]} RG .5 w ${x1.toFixed(2)} ${y1.toFixed(2)} m ${x2.toFixed(2)} ${y2.toFixed(2)} l S`;
const DEFAULT_DOCBIT_LOGO='https://res.cloudinary.com/dlesei0kn/image/upload/v1787478477/file_000000005a44820885c9d29411b18ee4_rsbyqc.png';
async function logoJpeg(url:string){
 if(!url)return null;
 try{let src=url.trim();
  if(src.startsWith('/'))src=new URL(src,typeof window!=='undefined'?window.location.origin:'https://docbit.in').href;
  let blob:Blob;
  if(src.startsWith('data:')){const m=/^data:([^;,]+)?(;base64)?,(.*)$/s.exec(src);if(!m)return null;const mime=m[1]||'image/png';const data=m[2]?atob(m[3]):decodeURIComponent(m[3]);const bytes=new Uint8Array(data.length);for(let i=0;i<data.length;i++)bytes[i]=data.charCodeAt(i);blob=new Blob([bytes],{type:mime});}
  else{const r=await fetch(src,{mode:'cors',credentials:'omit'});if(!r.ok)return null;blob=await r.blob();}
  const u=URL.createObjectURL(blob);try{const img=await new Promise<HTMLImageElement>((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=rej;i.src=u});const iw=img.naturalWidth||img.width,ih=img.naturalHeight||img.height;const scale=Math.min(1,700/Math.max(iw,ih));const c=document.createElement('canvas');c.width=Math.max(1,Math.round(iw*scale));c.height=Math.max(1,Math.round(ih*scale));const ctx=c.getContext('2d');if(!ctx)return null;ctx.fillStyle='#ffffff';ctx.fillRect(0,0,c.width,c.height);ctx.drawImage(img,0,0,c.width,c.height);const d=c.toDataURL('image/jpeg',.92).split(',')[1],bin=atob(d),bytes=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);return{bytes,width:c.width,height:c.height};}finally{URL.revokeObjectURL(u)}}catch{return null}}

function chunks<T>(a:T[],n:number){const out:T[][]=[];for(let i=0;i<a.length;i+=n)out.push(a.slice(i,i+n));return out.length?out:[[]]}
export async function buildReportPdf(raw:RawDataset,report:ProcessedReport,branding:ReportBranding,config?:ReportConfig):Promise<Blob>{
 const design=config?.design;const template=getReportTemplate(design?.template??'minimal');const portrait=design?.page.orientation==='portrait';const W=portrait?595:DEFAULT_W,H=portrait?842:DEFAULT_H;const margin=design?.page.margin??34;const headerH=design?.page.headerHeight??86,footerH=design?.page.footerHeight??28;const accent=rgb(branding.theme);const logo=await logoJpeg(branding.logoUrl || DEFAULT_DOCBIT_LOGO);const visible=report.columns;const columnPanels=chunks(visible,portrait?6:9);const rows=report.rows;const bodyH=H-margin-headerH-footerH;const headH=template.table==='lab'||template.table==='clinical'?34:26;const rowH=design?.density==='compact'?16:19;const rowsPerPage=Math.max(1,Math.floor((bodyH-headH)/rowH));
 const pagesData:Array<{panel:number;start:number;rows:any[]}> = [];for(let p=0;p<columnPanels.length;p++){for(let s=0;s<rows.length||s===0;s+=rowsPerPage){pagesData.push({panel:p,start:s,rows:rows.slice(s,s+rowsPerPage)});if(rows.length===0)break}}
 const objects:Obj[]=[]; objects[1]={body:''}; objects[2]={body:''}; objects[3]={body:'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'}; const pageIds:number[]=[];
 pagesData.forEach((pd,pi)=>{const cols=columnPanels[pd.panel];const available=W-margin*2;const base=cols.map((c:any)=>Math.max(55,c.settings.width));const scale=Math.min(1,available/base.reduce((a,b)=>a+b,0));const widths=base.map(w=>w*scale);const total=widths.reduce((a,b)=>a+b,0);const commands:string[]=[];const headerTop=H-margin;
  // One authoritative header region: centered logo, title and subtitle.
  const composition=template.composition;
  const headerBottom=headerTop-headerH;
  if(composition==='hero') commands.push(rect(margin,headerBottom,W-margin*2,headerH,accent));
  else { commands.push(rect(margin,headerBottom,W-margin*2,headerH,[.985,.99,1])); commands.push(rect(margin,headerBottom,W-margin*2,2,accent)); }
  const centerX=W/2;
  if(logo){ const logoMaxW=Math.min(92,W-margin*2-32),logoMaxH=Math.min(42,headerH*.34),logoScale=Math.min(logoMaxW/logo.width,logoMaxH/logo.height),iw=logo.width*logoScale,ih=logo.height*logoScale; commands.push(`q ${iw.toFixed(2)} 0 0 ${ih.toFixed(2)} ${(centerX-iw/2).toFixed(2)} ${(headerTop-ih-10).toFixed(2)} cm /Im${pi} Do Q`); }
  const title=branding.title||'DocBit Report',subtitle=branding.subtitle||'Prepared data report';
  const titleSize=Math.max(13,Math.min(20,design?.typography.headingSize??18));
  const titleWidth=Math.min(W-margin*2-24,title.length*titleSize*.48);
  const titleX=Math.max(margin+12,centerX-titleWidth/2);
  const titleY=headerBottom+24;
  const titleColor=composition==='hero'?[1,1,1]:[.05,.08,.14];
  commands.push(txt(titleX,titleY,titleSize,title.slice(0,110),titleColor));
  const subtitleWidth=Math.min(W-margin*2-24,subtitle.length*8*.42);
  commands.push(txt(Math.max(margin+12,centerX-subtitleWidth/2),titleY-16,8,subtitle.slice(0,150),composition==='hero'?[.88,.93,1]:[.4,.46,.54]));
  let x=margin,yTop=headerTop-headerH;const headerY=yTop-headH;const tableFill=composition==='ledger'?[.10,.13,.18]:composition==='transaction'?[.16,.20,.27]:composition==='academic'?[.86,.87,.85]:composition==='specimen'?[.12,.32,.52]:composition==='clinical'?[.18,.42,.52]:composition==='dashboard'?[.12,.22,.36]:accent;commands.push(rect(margin,headerY,total,headH,tableFill));cols.forEach((c:any,i)=>{commands.push(txt(x+5,headerY+headH-17,7.2,c.displayName.slice(0,30),[1,1,1]));x+=widths[i]});
  pd.rows.forEach((r:any,ri:number)=>{const yy=headerY-(ri+1)*rowH;if(design?.table.zebra!==false&&ri%2)commands.push(rect(margin,yy,total,rowH,[.975,.98,.985]));x=margin;cols.forEach((c:any,i:number)=>{const idx=report.columns.findIndex((cc:any)=>cc.key===c.key);const val=displayCell(r.values[idx],c.dataType,c.settings)||c.settings.nullDisplay||'—';const max=Math.max(8,Math.floor(widths[i]/4.4));const shown=val.length>max?val.slice(0,max-1)+'…':val;commands.push(txt(x+5,yy+5,design?.typography.bodySize??7,shown,[.12,.16,.22]));if(design?.table.borders!==false)commands.push(line(x,yy,x,yy+rowH));x+=widths[i]});if(design?.table.borders!==false)commands.push(line(margin,yy,x,yy))});
  if(pi===0&&report.summaries.length){const sy=headerY-(pd.rows.length+1)*rowH-4;commands.push(txt(margin,Math.max(footerH+8,sy),7.5,report.summaries.map(s=>`${s.label}: ${s.displayValue}`).join(' · ').slice(0,150),[.32,.38,.46]))}
  // Exactly one authoritative footer renderer: date left, page number right.
  commands.push(line(margin,footerH,W-margin,footerH));
  const footerDate=new Date().toLocaleDateString('en-IN');
  commands.push(txt(margin,12,7.5,footerDate,[.39,.45,.53]));
  const pageLabel=`Page ${pi+1} of ${pagesData.length}`;
  commands.push(txt(W-margin-82,12,7.5,pageLabel,[.39,.45,.53]));
  const content=commands.join('\n'),bytes=new TextEncoder().encode(content);let imageId=0;if(logo){imageId=objects.length;objects.push({body:`<< /Type /XObject /Subtype /Image /Width ${logo.width} /Height ${logo.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${logo.bytes.length} >>`,stream:logo.bytes})}
  const contentId=objects.length;objects.push({body:`<< /Length ${bytes.length} >>`,stream:bytes});const pageId=objects.length;objects.push({body:`<< /Type /Page /Parent 1 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << /F1 3 0 R >>${logo?` /XObject << /Im${pi} ${imageId} 0 R >>`:''} >> /Contents ${contentId} 0 R >>`});pageIds.push(pageId);
 });objects[1]={body:`<< /Type /Catalog /Pages 2 0 R >>`};objects[2]={body:`<< /Type /Pages /Count ${pageIds.length} /Kids [${pageIds.map(id=>`${id} 0 R`).join(' ')}] >>`};
 const out:Uint8Array[]=[new TextEncoder().encode('%PDF-1.4\n%DOCBIT\n')]; const offsets:number[]=[0]; let off=out[0].length; for(let i=1;i<objects.length;i++){const o=objects[i]; offsets[i]=off; if(o.stream){const h=new TextEncoder().encode(`${i} 0 obj\n${o.body}\nstream\n`),t=new TextEncoder().encode('\nendstream\nendobj\n');out.push(h,o.stream,t);off+=h.length+o.stream.length+t.length}else{const b=new TextEncoder().encode(`${i} 0 obj\n${o.body}\nendobj\n`);out.push(b);off+=b.length}} const startxref=off; let x=`xref\n0 ${objects.length}\n0000000000 65535 f \n`; for(let i=1;i<objects.length;i++)x+=`${String(offsets[i]).padStart(10,'0')} 00000 n \n`; x+=`trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${startxref}\n%%EOF`; out.push(new TextEncoder().encode(x)); return new Blob(out,{type:'application/pdf'});
}
