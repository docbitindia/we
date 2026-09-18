import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Modal } from './Modal';
import { navigate } from '../router/useRoute';

interface Props {
  open: boolean;
  onClose: () => void;
  reason?: string;
}

export function UpgradePrompt({ open, onClose, reason }: Props) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Upgrade required"
      description="Your free trial has ended or this feature needs a Professional plan."
      size="sm"
    >
      <div className="space-y-3 text-sm text-slate-600">
        <div className="flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2.5 text-amber-900">
          <Sparkles size={16} className="mt-0.5 shrink-0" />
          <p>{reason || 'This action is available on the Professional plan (₹299/month).'}</p>
        </div>
        <p>
          Subscription checkout is coming soon. Your data and workspace stay safe — you can review usage and try again
          once billing is live.
        </p>
        <div className="flex flex-wrap justify-end gap-2 pt-1">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Not now
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              onClose();
              navigate('/billing');
            }}
          >
            View plans <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </Modal>
  );
}
