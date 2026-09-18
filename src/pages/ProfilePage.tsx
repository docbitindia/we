import React, { useEffect, useState, useRef } from 'react';
import { Camera, Lock, LogOut, Mail, Shield, User, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { useAuth } from '../context/AuthContext';
import { getEntitlement, type Entitlement } from '../services/entitlements';
import { formatFileSize } from '../utils/format';

export function ProfilePage() {
  const { user, updateName, updatePhoto, changePassword, signOut } = useAuth();
  const [name, setName] = useState(user?.displayName || '');
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirmNext, setConfirmNext] = useState('');
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [entitlement, setEntitlement] = useState<Entitlement | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setName(user?.displayName || '');
  }, [user?.displayName]);

  useEffect(() => {
    void getEntitlement().then(setEntitlement);
  }, []);

  const show = (type: 'ok' | 'err', text: string) => {
    setMsg({ type, text });
    window.setTimeout(() => setMsg(null), 4000);
  };

  const saveProfile = async () => {
    if (!name.trim()) return show('err', 'Name cannot be empty.');
    setBusy(true);
    try {
      await updateName(name.trim());
      show('ok', 'Profile updated successfully.');
    } catch (e) {
      show('err', e instanceof Error ? e.message : 'Could not save profile.');
    } finally {
      setBusy(false);
    }
  };

  const savePassword = async () => {
    if (!current || !next) return show('err', 'Fill both password fields.');
    if (next.length < 8) return show('err', 'New password must be at least 8 characters.');
    if (next !== confirmNext) return show('err', 'New passwords do not match.');
    setBusy(true);
    try {
      await changePassword(current, next);
      setCurrent('');
      setNext('');
      setConfirmNext('');
      show('ok', 'Password changed successfully.');
    } catch (e) {
      show('err', e instanceof Error ? e.message : 'Could not change password.');
    } finally {
      setBusy(false);
    }
  };

  const onPhotoPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return show('err', 'Please choose an image file.');
    if (file.size > 2 * 1024 * 1024) return show('err', 'Image must be under 2 MB.');
    // For now store as data URL (production would upload to storage)
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        setBusy(true);
        const url = String(reader.result || '');
        await updatePhoto(url);
        show('ok', 'Profile photo updated.');
      } catch (err) {
        show('err', err instanceof Error ? err.message : 'Could not update photo.');
      } finally {
        setBusy(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const initial = (user?.displayName || user?.email || 'D').slice(0, 1).toUpperCase();
  const planLabel =
    entitlement?.plan === 'pro' ? 'Professional' : entitlement?.plan === 'expired' ? 'Expired' : 'Free Trial';
  const daysLeft =
    entitlement?.trialEnd && entitlement.plan === 'trial'
      ? Math.max(0, Math.ceil((new Date(entitlement.trialEnd).getTime() - Date.now()) / 86400000))
      : null;

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6">
          <p className="section-kicker">Account</p>
          <h1 className="section-title">Profile</h1>
          <p className="section-copy">Manage your identity, security and plan preferences.</p>
        </div>

        {msg && (
          <div
            className={`mb-5 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm ${
              msg.type === 'ok'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border-rose-200 bg-rose-50 text-rose-800'
            }`}
          >
            {msg.type === 'ok' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            {msg.text}
          </div>
        )}

        {/* Hero identity card */}
        <section className="surface-card mb-5 overflow-hidden">
          <div className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 px-6 py-8 sm:px-8">
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_20%,white,transparent_50%)]" />
            <div className="relative flex flex-col items-start gap-5 sm:flex-row sm:items-center">
              <div className="relative group">
                <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border-2 border-white/30 bg-white/10 text-2xl font-bold text-white shadow-lg backdrop-blur">
                  {user?.photoURL ? (
                    <img src={user.photoURL} alt="Profile" className="h-full w-full object-cover" />
                  ) : (
                    initial
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-blue-600 text-white shadow-md transition hover:bg-blue-500"
                  aria-label="Change photo"
                >
                  <Camera size={14} />
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPhotoPick} />
              </div>
              <div className="min-w-0 flex-1 text-white">
                <h2 className="truncate text-xl font-bold tracking-tight">{user?.displayName || 'DocBit user'}</h2>
                <p className="mt-0.5 flex items-center gap-1.5 text-sm text-blue-100">
                  <Mail size={13} /> {user?.email}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold backdrop-blur">
                    <Shield size={11} /> {planLabel}
                    {daysLeft !== null && ` · ${daysLeft}d left`}
                  </span>
                  {user?.createdAt && (
                    <span className="inline-flex items-center rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-medium text-blue-100">
                      Joined {new Date(user.createdAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-5 lg:grid-cols-2">
          {/* Profile details */}
          <section className="surface-card p-5 sm:p-6">
            <div className="flex items-center gap-2 text-blue-600">
              <User size={18} />
              <h3 className="text-base font-semibold text-slate-900">Profile details</h3>
            </div>
            <p className="mt-1 text-xs text-slate-500">Your display name is used across reports and account surfaces.</p>
            <label className="mt-5 grid gap-1.5 text-xs font-semibold text-slate-600">
              Display name
              <input
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={80}
                placeholder="Your name"
              />
            </label>
            <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/80 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Email</p>
              <p className="mt-0.5 text-sm font-medium text-slate-700">{user?.email}</p>
              <p className="mt-1 text-[11px] text-slate-400">Email is managed by your sign-in provider and cannot be changed here.</p>
            </div>
            <button className="btn-primary mt-5" onClick={saveProfile} disabled={busy || name.trim() === (user?.displayName || '')}>
              {busy ? <Loader2 size={15} className="animate-spin" /> : null}
              Save changes
            </button>
          </section>

          {/* Security */}
          <section className="surface-card p-5 sm:p-6">
            <div className="flex items-center gap-2 text-blue-600">
              <Lock size={18} />
              <h3 className="text-base font-semibold text-slate-900">Security</h3>
            </div>
            <p className="mt-1 text-xs text-slate-500">Change your password. Google-signed accounts may manage password via Google.</p>
            <label className="mt-5 grid gap-1.5 text-xs font-semibold text-slate-600">
              Current password
              <input type="password" className="input" value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" />
            </label>
            <label className="mt-3 grid gap-1.5 text-xs font-semibold text-slate-600">
              New password
              <input type="password" className="input" value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" />
            </label>
            <label className="mt-3 grid gap-1.5 text-xs font-semibold text-slate-600">
              Confirm new password
              <input type="password" className="input" value={confirmNext} onChange={(e) => setConfirmNext(e.target.value)} autoComplete="new-password" />
            </label>
            <button className="btn-secondary mt-5" onClick={savePassword} disabled={busy || !current || !next || !confirmNext}>
              Update password
            </button>
          </section>
        </div>

        {/* Quick plan / usage strip */}
        {entitlement && (
          <section className="surface-card mt-5 grid gap-3 p-5 sm:grid-cols-3 sm:p-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Plan</p>
              <p className="mt-1 text-sm font-semibold text-slate-800">{planLabel}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Reports generated</p>
              <p className="mt-1 text-sm font-semibold text-slate-800">{entitlement.reportsGenerated.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Data processed</p>
              <p className="mt-1 text-sm font-semibold text-slate-800">{formatFileSize(entitlement.dataProcessedBytes)}</p>
            </div>
          </section>
        )}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
          <button
            type="button"
            className="inline-flex items-center gap-2 text-sm font-semibold text-rose-600 hover:text-rose-700"
            onClick={() => void signOut()}
          >
            <LogOut size={16} /> Sign out
          </button>
          <p className="text-[11px] text-slate-400">Profile photos from Google are synced automatically on sign-in.</p>
        </div>
      </div>
    </AppShell>
  );
}
