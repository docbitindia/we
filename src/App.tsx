import React, { useEffect } from 'react';
import { useRoute, navigate } from './router/useRoute';
import { HomePage } from './pages/HomePage';
import { WorkspacePage } from './pages/WorkspacePage';
import { AnalyzePage } from './pages/AnalyzePage';
import { EditingPage } from './pages/EditingPage';
import { AuthPage } from './pages/AuthPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { SupportPage } from './pages/SupportPage';
import { HistoryPage } from './pages/HistoryPage';
import { DocumentationPage } from './pages/DocumentationPage';
import { ReportPage } from './pages/ReportPage';
import { AboutPage, TermsPage } from './pages/PublicPage';
import { ProfilePage } from './pages/ProfilePage';
import { UsageBillingPage } from './pages/UsageBillingPage';
import { SettingsPage } from './pages/SettingsPage';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PricingPage as PublicPricingPage } from './pages/PricingPage';

function RouteContent(){
 const [path]=useRoute(); const {user,loading,deactivatedAccount}=useAuth();
 useEffect(()=>{if(loading)return; const protectedPath=['/workspace','/history','/report','/profile','/billing','/settings'].some(p=>path===p||path.startsWith(`${p}/`)); if(path==='/'&&user&&!deactivatedAccount){navigate('/workspace');return;} if(protectedPath&&(!user||deactivatedAccount))navigate(`/auth/login?redirect=${encodeURIComponent(path)}`)},[path,user,loading]);
 if(path==='/') return <HomePage/>;
 if(path==='/auth/login') return <AuthPage mode="login"/>;
 if(path==='/auth/signup') return <AuthPage mode="signup"/>;
 if(path==='/auth/callback') return <AuthPage mode="callback"/>;
 if(path==='/password/reset') return <AuthPage mode="reset"/>;
 if(path==='/privacy') return <PrivacyPage/>;
 if(path==='/support') return <SupportPage/>;
 if(path==='/documentation'||path==='/docs') return <DocumentationPage/>;
 if(path==='/about') return <AboutPage/>;
 if(path==='/terms') return <TermsPage/>;
 if(path==='/pricing') return <PublicPricingPage/>;
 if(path==='/workspace') return <WorkspacePage/>;
 if(path==='/history') return <HistoryPage/>;
 if(path==='/profile') return <ProfilePage/>;
 if(path==='/billing'||path==='/usage-billing') return <UsageBillingPage/>;
 if(path==='/settings') return <SettingsPage/>;
 if(path==='/report') return <ReportPage/>;
 if(path==='/analyzing'||path.startsWith('/analyzing/')) return <AnalyzePage/>;
 if(path.startsWith('/editing/')) return <EditingPage filename={decodeURIComponent(path.slice('/editing/'.length))||'untitled'}/>;
 return <div className="min-h-screen flex items-center justify-center"><div className="text-center"><h1 className="text-2xl font-semibold">Page not found</h1><button onClick={()=>navigate('/')} className="btn-primary mt-5">Go home</button></div></div>;
}

export default function App(){return <ErrorBoundary onReset={()=>navigate('/')}><AuthProvider><RouteContent/></AuthProvider></ErrorBoundary>}
