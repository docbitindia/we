import React, { useEffect, useMemo, useState } from 'react';
import { Activity, ArrowUpRight, Clock3, FileOutput, History, Plus, Sparkles, UploadCloud } from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { Dropzone } from '../components/Dropzone';
import { FileTypeIcon } from '../components/FileTypeIcon';
import { navigate } from '../router/useRoute';
import { setPendingFile, getEditingSession } from '../state/editorSession';
import { listFileHistory, recordFileHistory, type FileHistoryEntry } from '../state/history';
import { usePageMeta } from '../hooks/usePageMeta';
import { PAGE_META } from '../seo/pageMeta';
import { useAuth } from '../context/AuthContext';

const MAX_TECHNICAL_FILE_SIZE = 1024 * 1024 * 1024;

export function WorkspacePage() {
  const { user } = useAuth();
  const [history, setHistory] = useState<FileHistoryEntry[]>([]);
  const [hasSession, setHasSession] = useState(false);
  usePageMeta(PAGE_META['/workspace']);
  useEffect(() => { setHistory(listFileHistory()); setHasSession(Boolean(getEditingSession())); }, []);
  const recent = useMemo(() => history.slice(0, 6), [history]);
  const openFile = (file: File) => {
    if (!user) { navigate('/auth/login'); return; }
    const ext = file.name.toLowerCase().split('.').pop();
    if (!['csv','json','xlsx','xls'].includes(ext || '')) return;
    recordFileHistory({ fileName: file.name, fileSize: file.size, fileType: ext as FileHistoryEntry['fileType'] });
    setPendingFile(file);
    navigate(`/analyzing/${encodeURIComponent(file.name.replace(/\.[^.]+$/, ''))}`);
  };
  return <AppShell>
    <div className="mx-auto max-w-[1320px] px-4 py-6 sm:px-7 sm:py-9">
      <section className="grid gap-5">
        <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="max-w-2xl"><div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[.14em] text-blue-700"><Sparkles size={12}/> Data workspace</div><h1 className="mt-4 text-3xl font-semibold tracking-[-.04em] text-slate-950 sm:text-4xl">Turn a file into work-ready data.</h1><p className="mt-3 max-w-xl text-sm leading-6 text-slate-500">Import Excel, CSV or JSON, inspect the structure, transform what you need, and export or generate a report without project-management overhead.</p></div>
          <div id="upload-area" className="mt-7 scroll-mt-20"><Dropzone onFile={openFile} maxFileSize={MAX_TECHNICAL_FILE_SIZE}/></div>
          <div className="mt-5 flex flex-wrap items-center gap-2 text-[11px] text-slate-500"><span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 font-semibold">CSV · XLS · XLSX · JSON</span><span>Processing stays in your browser where supported.</span></div>
        </div>

      </section>
      <section className="mt-6 grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="rounded-[22px] border border-slate-200 bg-white"><div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div><h2 className="text-sm font-semibold text-slate-900">Recent files</h2><p className="mt-0.5 text-[11px] text-slate-400">Files opened in this browser.</p></div><button onClick={()=>navigate('/history')} className="text-xs font-semibold text-blue-600 hover:text-blue-700">View history</button></div>{recent.length===0?<div className="px-5 py-12 text-center"><Clock3 className="mx-auto text-slate-300" size={28}/><p className="mt-3 text-sm font-medium text-slate-600">Your recent work will appear here.</p><p className="mt-1 text-xs text-slate-400">Upload a file to start your first session.</p></div>:<div className="divide-y divide-slate-100">{recent.map(item=><div key={item.id} className="flex items-center gap-3 px-5 py-3.5"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-50"><FileTypeIcon type={item.fileType==='xlsx'||item.fileType==='xls'?'excel':item.fileType} size={22}/></span><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold text-slate-800">{item.fileName}</p><p className="mt-0.5 text-[10px] text-slate-400">{item.fileType.toUpperCase()} · {new Date(item.openedAt).toLocaleString()}</p></div><span className="rounded-full bg-slate-50 px-2 py-1 text-[9px] font-semibold uppercase tracking-wide text-slate-500">{item.status}</span></div>)}</div>}</div>
        <div className="rounded-[22px] border border-slate-200 bg-white p-5"><div className="flex items-center gap-2"><Activity size={16} className="text-blue-600"/><h2 className="text-sm font-semibold">Workflow</h2></div><ol className="mt-5 space-y-4">{['Upload your source file','Analyze structure and quality','Edit, filter, sort or transform','Export data or generate a report'].map((x,i)=><li key={x} className="flex gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-600">{i+1}</span><span className="pt-0.5 text-xs leading-5 text-slate-600">{x}</span></li>)}</ol><div className="mt-5 rounded-xl bg-slate-50 p-3 text-[11px] leading-5 text-slate-500">Workspace is your authenticated DocBit home. It is intentionally not a multi-workspace management system.</div></div>
      </section>
    </div>
  </AppShell>;
}
