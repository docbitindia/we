import React, { useState } from 'react';
import { ArrowRight, Check, Sparkles } from 'lucide-react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { navigate } from '../router/useRoute';
import { usePageMeta } from '../hooks/usePageMeta';
import { Modal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';

export function PricingPage() {
  usePageMeta({
    path: '/pricing',
    title: 'Pricing — DocBit India',
    description: 'DocBit India pricing: 7-day free trial and ₹299 monthly professional plan.'
  });
  const { user } = useAuth();
  const [comingSoon, setComingSoon] = useState(false);

  const startTrial = () => {
    if (user) navigate('/workspace');
    else navigate('/auth/signup');
  };

  const buyPlan = () => setComingSoon(true);

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        <section className="pricing-hero">
          <p className="eyebrow">Pricing</p>
          <h1 className="public-title">Simple access. Clear billing.</h1>
          <p className="public-lead">
            Start with a real 7-day trial. Upgrade to ₹299/month when you need the professional report workflow. Annual
            billing is only offered when configured.
          </p>
        </section>
        <section className="mx-auto max-w-5xl px-5 pb-20 sm:px-8">
          <div className="grid gap-5 md:grid-cols-2">
            <Plan
              title="Free Trial"
              price="₹0"
              suffix="7 days"
              copy="Experience the actual DocBit workflow before paying."
              items={[
                'Data preparation and editing',
                'Professional PDF report workflow',
                'Advertising included',
                'Real account trial entitlement'
              ]}
              cta="Start free trial"
              onClick={startTrial}
            />
            <Plan
              dark
              title="Professional"
              price="₹299"
              suffix="/month"
              copy="For users who need repeatable, branded reporting."
              items={[
                'Professional report templates',
                'Branding and customization',
                'Server entitlement boundary',
                'Priority large-dataset processing',
                'Annual billing — Coming Soon'
              ]}
              cta="Buy plan"
              onClick={buyPlan}
            />
          </div>
        </section>
      </main>
      <Footer />

      <Modal
        open={comingSoon}
        onClose={() => setComingSoon(false)}
        title="Subscription coming soon"
        description="We're finishing payment integration."
        size="sm"
      >
        <div className="space-y-3 text-sm text-slate-600">
          <div className="flex items-center gap-2 rounded-xl bg-blue-50 px-3 py-2.5 text-blue-800">
            <Sparkles size={16} />
            <span className="font-semibold">Professional plan · ₹299/month</span>
          </div>
          <p>
            Live checkout will open here once the payment provider is connected. Your trial, usage and account remain
            fully available in the meantime.
          </p>
          <div className="flex flex-wrap justify-end gap-2 pt-1">
            <button type="button" className="btn-secondary" onClick={() => setComingSoon(false)}>
              Close
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                setComingSoon(false);
                startTrial();
              }}
            >
              Continue with trial
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function Plan({
  title,
  price,
  suffix,
  copy,
  items,
  onClick,
  cta,
  dark = false
}: {
  title: string;
  price: string;
  suffix: string;
  copy: string;
  items: string[];
  onClick: () => void;
  cta: string;
  dark?: boolean;
}) {
  return (
    <article className={`price-card ${dark ? 'price-card-dark' : ''}`}>
      <p className="text-xs font-bold uppercase tracking-[.14em] opacity-70">{title}</p>
      <div className="mt-5 flex items-end gap-2">
        <span className="text-4xl font-bold">{price}</span>
        <span className="pb-1 text-xs opacity-60">{suffix}</span>
      </div>
      <p className="mt-3 text-sm leading-6 opacity-70">{copy}</p>
      <ul className="mt-7 grid gap-3 text-sm">
        {items.map((x) => (
          <li key={x} className="flex items-start gap-2">
            <Check size={15} className="mt-0.5 shrink-0" />
            {x}
          </li>
        ))}
      </ul>
      <button
        onClick={onClick}
        className={dark ? 'btn-primary mt-8 w-full justify-center' : 'btn-secondary mt-8 w-full justify-center'}
      >
        {cta} <ArrowRight size={15} />
      </button>
    </article>
  );
}
