import React, { useEffect, useState } from 'react';
import { CreditCard, Database, FileText, ShieldCheck, Clock, Zap, ArrowRight, AlertTriangle } from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { useAuth } from '../context/AuthContext';
import { getEntitlement, type Entitlement } from '../services/entitlements';
import { formatFileSize } from '../utils/format';
import { navigate } from '../router/useRoute';
import { Modal } from '../components/Modal';

function Card({
  icon: Icon,
  title,
  value,
  hint
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="surface-card flex flex-col gap-3 p-5">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
        <Icon size={18} />
      </div>
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{title}</p>
        <p className="mt-1 text-xl font-bold tracking-tight text-slate-900">{value}</p>
        {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      </div>
    </div>
  );
}

export function UsageBillingPage() {
  const { user } = useAuth();
  const [e, setE] = useState<Entitlement | null>(null);
  const [loading, setLoading] = useState(true);
  const [comingSoon, setComingSoon] = useState(false);

  useEffect(() => {
    void getEntitlement()
      .then(setE)
      .finally(() => setLoading(false));
  }, []);

  const days =
    e?.trialEnd && e.plan === 'trial'
      ? Math.max(0, Math.ceil((new Date(e.trialEnd).getTime() - Date.now()) / 86400000))
      : null;
  const isExpired = e?.plan === 'expired' || (days !== null && days <= 0);
  const planLabel = e?.plan === 'pro' ? 'Professional' : isExpired ? 'Expired' : 'Free Trial';

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6">
          <p className="section-kicker">Account</p>
          <h1 className="section-title">Usage & Billing</h1>
          <p className="section-copy">
            Live entitlements and measured usage for {user?.email || 'your account'}.
          </p>
        </div>

        {isExpired && (
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <AlertTriangle size={18} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">Your free trial has ended</p>
              <p className="mt-0.5 text-amber-800/80">
                Upgrade to Professional to continue generating reports and using advanced features without limits.
              </p>
            </div>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card
            icon={CreditCard}
            title="Current plan"
            value={loading ? '…' : planLabel}
            hint={days !== null ? `${days} day${days === 1 ? '' : 's'} remaining` : e?.status || undefined}
          />
          <Card
            icon={FileText}
            title="Reports generated"
            value={loading || !e ? '—' : e.reportsGenerated.toLocaleString()}
          />
          <Card
            icon={Database}
            title="Data processed"
            value={loading || !e ? '—' : formatFileSize(e.dataProcessedBytes)}
          />
          <Card
            icon={ShieldCheck}
            title="Storage used"
            value={loading || !e ? '—' : formatFileSize(e.storageBytes)}
          />
        </div>

        <section className="surface-card mt-5 overflow-hidden">
          <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-5 py-4 sm:px-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Professional plan</h2>
                <p className="mt-0.5 text-sm text-slate-500">Unlock the full DocBit workflow.</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-slate-900">
                  ₹299<span className="text-sm font-medium text-slate-400">/mo</span>
                </p>
              </div>
            </div>
          </div>
          <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
            <ul className="grid gap-2.5 text-sm text-slate-600">
              {[
                'Unlimited professional PDF reports',
                'Priority processing for large datasets',
                'Custom branding & templates',
                'No advertising',
                'Server-side large-file pipeline'
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <Zap size={14} className="mt-0.5 shrink-0 text-blue-600" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="flex flex-col justify-end gap-3">
              <button
                type="button"
                className="btn-primary w-full justify-center"
                onClick={() => setComingSoon(true)}
              >
                Upgrade to Professional <ArrowRight size={15} />
              </button>
              <button
                type="button"
                className="btn-secondary w-full justify-center"
                onClick={() => setComingSoon(true)}
              >
                Yearly billing — Coming Soon
              </button>
              <p className="text-center text-[11px] text-slate-400">
                Secure payments will be enabled when the payment provider is configured.
              </p>
            </div>
          </div>
        </section>

        <section className="surface-card mt-5 p-5 sm:p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
            <Clock size={18} className="text-blue-600" /> Billing status
          </h2>
          <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
            <div className="rounded-xl bg-slate-50 px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Status</p>
              <p className="mt-1 font-semibold text-slate-800">{e?.status || 'Unavailable'}</p>
            </div>
            <div className="rounded-xl bg-slate-50 px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Trial start</p>
              <p className="mt-1 font-semibold text-slate-800">
                {e?.trialStart ? new Date(e.trialStart).toLocaleDateString() : '—'}
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Trial end</p>
              <p className="mt-1 font-semibold text-slate-800">
                {e?.trialEnd ? new Date(e.trialEnd).toLocaleDateString() : '—'}
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Next billing</p>
              <p className="mt-1 font-semibold text-slate-800">
                {e?.currentPeriodEnd ? new Date(e.currentPeriodEnd).toLocaleDateString() : '—'}
              </p>
            </div>
          </div>
        </section>
      </div>

      <Modal
        open={comingSoon}
        onClose={() => setComingSoon(false)}
        title="Subscription coming soon"
        description="Payment processing is being finalized."
        size="sm"
      >
        <div className="space-y-3 text-sm text-slate-600">
          <p>
            The Professional plan (₹299/month) is architected and ready. Live card payments and yearly billing will be
            enabled as soon as the payment provider is connected.
          </p>
          <p className="rounded-xl bg-blue-50 px-3 py-2 text-blue-800">
            Your current trial and usage data are already tracked. When billing goes live you can upgrade without losing
            any work.
          </p>
          <div className="flex justify-end pt-2">
            <button type="button" className="btn-primary" onClick={() => setComingSoon(false)}>
              Got it
            </button>
          </div>
        </div>
      </Modal>
    </AppShell>
  );
}
