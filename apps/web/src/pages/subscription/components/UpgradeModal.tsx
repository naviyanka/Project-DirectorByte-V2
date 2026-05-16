import React, { useState } from 'react';
import { TrendingUp, Check, ShieldCheck, X } from 'lucide-react';
import { Button, Card, Badge } from '../../../design-system/components';
import { cn } from '../../../utils/styles';

interface UpgradeModalProps {
  onClose: () => void;
  targetPlan: 'BASIC' | 'PRO';
}

export function UpgradeModal({ onClose, targetPlan }: UpgradeModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const planInfo = targetPlan === 'PRO' ? {
    name: 'Studio',
    price: 49,
    currentPrice: 19,
    features: [
      'No watermark on exports',
      '2,000 AI credits/month',
      '100 GB cloud storage',
      'Unlimited exports',
      'Priority support',
    ],
    prorated: 18.67
  } : {
    name: 'Creator',
    price: 19,
    currentPrice: 0,
    features: [
      '500 AI credits/month',
      '20 GB cloud storage',
      'All studio modules',
      'Managed AI keys',
    ],
    prorated: 11.40
  };

  const handleUpgrade = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      onClose();
      alert('Upgraded successfully! 🎉');
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-surface-950/50 backdrop-blur-sm animate-fade-in">
      <Card className="max-w-md w-full p-8 relative animate-scale-up">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-hint hover:text-primary">
          <X size={20} />
        </button>

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-brand-500 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-brand-500/20">
            <TrendingUp size={32} />
          </div>
          <h2 className="text-2xl font-black">Upgrade to {planInfo.name} Plan</h2>
          <p className="text-sm text-hint mt-2">Unlock professional features and more power.</p>
        </div>

        <div className="space-y-6">
          <div className="p-4 bg-surface-100 rounded-xl border border-surface-200">
            <p className="text-xs font-bold text-hint uppercase tracking-widest mb-3">You'll unlock:</p>
            <ul className="space-y-2">
              {planInfo.features.map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-sm font-medium text-secondary">
                  <div className="text-success-500"><Check size={14} strokeWidth={3} /></div>
                  {f}
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-hint">Prorated charge today:</span>
              <span className="font-bold">${planInfo.prorated}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-hint">Then billing:</span>
              <span className="font-bold">${planInfo.price}/mo from June 1</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-hint">Payment method:</span>
              <span className="font-medium">Visa •••• 4242</span>
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <Button variant="ghost" fullWidth onClick={onClose}>Maybe Later</Button>
            <Button 
              variant="primary" 
              fullWidth 
              onClick={handleUpgrade}
              isLoading={isProcessing}
            >
              Upgrade Now
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
