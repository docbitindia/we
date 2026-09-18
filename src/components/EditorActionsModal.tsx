import React, { useState } from 'react';
import { Download, FileSpreadsheet, Loader2 } from 'lucide-react';
import { FileTypeIcon } from './FileTypeIcon';
import { Modal } from './Modal';
import type { ProcessedReport } from '../types/processed';
import type { ReportConfig } from '../types/report';
import type { DatasetSchema, RawDataset } from '../types/dataset';
import { exportCsv, exportExcel, exportJson } from '../export';

export function EditorActionsModal({open,onClose,raw,schema,report,config}:{open:boolean;onClose:()=>void;onGenerate?:()=>void;raw:RawDataset;schema:DatasetSchema;report:ProcessedReport;config:ReportConfig}){
 const [busy,setBusy]=useState<string|null>(null);
 const run=async(id:'excel'|'csv'|'json')=>{if(busy)return;setBusy(id);try{if(id==='excel')exportExcel(report,config.design);if(id==='csv')exportCsv(report,config.design);if(id==='json')exportJson(report,config.design);}finally{setBusy(null)}};
 return <Modal open={open} onClose={onClose} title="Export data" description="Download the current prepared dataset. PDF generation is available from the dedicated report action." size="md"><div className="grid gap-2.5 sm:grid-cols-3">
  <Action icon={<FileSpreadsheet size={19}/>} title="Export as Excel" text="Download .xlsx" busy={busy==='excel'} onClick={()=>void run('excel')} />
  <Action icon={<FileTypeIcon type="csv" size={19}/>} title="Export as CSV" text="Download .csv" busy={busy==='csv'} onClick={()=>void run('csv')} />
  <Action icon={<FileTypeIcon type="json" size={19}/>} title="Export as JSON" text="Download .json" busy={busy==='json'} onClick={()=>void run('json')} />
 </div><div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/60 p-3 text-xs leading-5 text-blue-900/75">Exports use the current columns, filters, sorting, grouping and calculations. Use the PDF / Report action in the toolbar or mobile bar for branded PDF generation.</div></Modal>
}
function Action({icon,title,text,busy,primary,onClick}:{icon:React.ReactNode;title:string;text:string;busy?:boolean;primary?:boolean;onClick:()=>void}){return <button type="button" onClick={onClick} disabled={busy} className={`action-card ${primary?'action-card-primary':''}`}><span className="action-card-icon">{busy?<Loader2 className="animate-spin" size={19}/>:icon}</span><span className="min-w-0 text-left"><strong>{title}</strong><small>{busy?'Preparing…':text}</small></span><Download size={14} className="ml-auto shrink-0 opacity-40"/></button>}
