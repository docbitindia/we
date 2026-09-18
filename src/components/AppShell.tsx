import React from 'react';
import { ChevronLeft, ChevronRight, FileSpreadsheet, History, LogOut, UserCircle, CreditCard, Settings } from 'lucide-react';
import { navigate, useRoute } from '../router/useRoute';
import { Logo } from './Logo';
import { useAuth } from '../context/AuthContext';

const primary=[{label:'Workspace',href:'/workspace',icon:FileSpreadsheet},{label:'History',href:'/history',icon:History}];
export function AppShell({children}:{children:React.ReactNode}){
 const [path]=useRoute(); const {user,loading,signOut}=useAuth(); const [collapsed,setCollapsed]=React.useState(false); const [mobileAccountOpen,setMobileAccountOpen]=React.useState(false);
 React.useEffect(()=>{if(!loading&&!user)navigate('/auth/login')},[loading,user]);
 React.useEffect(()=>{if(typeof window==='undefined')return;try{setCollapsed(localStorage.getItem('docbit.appSidebarCollapsed')==='1')}catch{}},[]);
 React.useEffect(()=>{if(typeof window==='undefined')return;try{localStorage.setItem('docbit.appSidebarCollapsed',collapsed?'1':'0')}catch{}},[collapsed]);
 React.useEffect(()=>{if(!mobileAccountOpen)return;const close=(e:PointerEvent)=>{const t=e.target as Element|null;if(!t?.closest('[data-mobile-account]'))setMobileAccountOpen(false)};document.addEventListener('pointerdown',close);return()=>document.removeEventListener('pointerdown',close)},[mobileAccountOpen]);
 if(loading)return <div className="min-h-screen bg-slate-50 p-6"><div className="skeleton h-8 w-32"/><div className="mt-10 skeleton h-64 w-full"/></div>; if(!user)return null;
 const initial=user.displayName?.slice(0,1).toUpperCase()||'D'; const active=(href:string)=>path===href||path.startsWith(href+'/');
 const title=path==='/workspace'?'Workspace':path==='/history'?'History':path==='/report'?'PDF Studio':path==='/billing'?'Usage & Billing':path==='/profile'?'Profile':path==='/settings'?'Settings':'DocBit';
 return <div className="app-shell">
  <aside className={`app-sidebar ${collapsed?'is-collapsed':''}`}>
   <div className="app-sidebar-brand"><Logo/><button type="button" onClick={()=>setCollapsed(v=>!v)} className="icon-button" aria-label={collapsed?'Expand sidebar':'Collapse sidebar'}>{collapsed?<ChevronRight size={17}/>:<ChevronLeft size={17}/>}</button></div>
   <nav className="app-sidebar-nav"><p className="sidebar-label">WORKSPACE</p>{primary.map(item=>{const I=item.icon;return <button key={item.href} onClick={()=>navigate(item.href)} className={`app-nav ${active(item.href)?'app-nav-active':''} ${collapsed?'justify-center px-0':''}`} title={collapsed?item.label:undefined}><I size={18}/>{!collapsed&&<span>{item.label}</span>}</button>})}<p className="sidebar-label mt-5">ACCOUNT</p>{[["/billing","Usage & Billing",CreditCard],["/settings","Settings",Settings]].map(([href,label,I])=>{const Icon=I as React.ComponentType<{size?:number}>;return <button key={String(href)} onClick={()=>navigate(String(href))} className={`app-nav ${active(String(href))?'app-nav-active':''} ${collapsed?'justify-center px-0':''}`} title={collapsed?String(label):undefined}><Icon size={18}/>{!collapsed&&<span>{String(label)}</span>}</button>})}</nav>
   <div className="app-sidebar-foot"><button type="button" onClick={()=>navigate('/profile')} className="account-mini w-full text-left hover:bg-slate-50 rounded-xl"><span className="avatar">{user.photoURL?<img src={user.photoURL} alt=""/>:initial}</span>{!collapsed&&<div className="min-w-0"><p className="truncate text-xs font-semibold">{user.displayName||'Account'}</p><p className="truncate text-[10px] text-slate-400">{user.email}</p></div>}</button><button onClick={()=>void signOut()} className={`app-nav text-slate-500 ${collapsed?'justify-center px-0':''}`} title="Logout"><LogOut size={18}/>{!collapsed&&<span>Logout</span>}</button></div>
  </aside>
  <div className={`app-main ${collapsed?'sidebar-collapsed':''}`}>
   <header className="app-topbar"><div className="lg:hidden app-mobile-brand"><Logo/></div><div className="hidden lg:block min-w-0"><p className="text-xs font-bold text-slate-900">{title}</p><p className="mt-0.5 text-[10px] text-slate-400">Professional data → report workspace</p></div><div className="lg:hidden relative" data-mobile-account><button type="button" onClick={()=>setMobileAccountOpen(v=>!v)} className="avatar-button app-mobile-profile" aria-label="Open account menu" aria-expanded={mobileAccountOpen}>{user.photoURL?<img src={user.photoURL} alt=""/>:initial}</button>{mobileAccountOpen&&<div className="profile-dropdown app-mobile-profile-menu"><button onClick={()=>{setMobileAccountOpen(false);navigate('/profile')}}><UserCircle size={15}/>Profile</button><button onClick={()=>{setMobileAccountOpen(false);navigate('/billing')}}><CreditCard size={15}/>Usage &amp; Billing</button><button onClick={()=>{setMobileAccountOpen(false);navigate('/settings')}}><Settings size={15}/>Settings</button><button onClick={()=>{setMobileAccountOpen(false);void signOut()}} className="!text-rose-600"><LogOut size={15}/>Logout</button></div>}</div></header>
   <main className="app-content">{children}</main>
  </div>
  <nav className="mobile-bottom-nav" aria-label="Mobile navigation"><button onClick={()=>navigate('/workspace')} className={active('/workspace')?'mobile-nav-active':''}><FileSpreadsheet size={17}/><span>Workspace</span></button><button onClick={()=>navigate('/history')} className={active('/history')?'mobile-nav-active':''}><History size={17}/><span>History</span></button></nav>
 </div>;
}
