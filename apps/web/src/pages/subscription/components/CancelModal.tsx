import React, { useState } from 'react';
import { Frown, X, ArrowRight, Heart, ShieldAlert, AlertCircle } from 'lucide-react';
import { Button, Card, Badge } from '../../../design-system/components';
import { cn } from '../../../utils/styles';

interface CancelModalProps {
  onClose: () => void;
}

export function CancelModal({ onClose }: CancelModalProps) {
  const [step, setStep] = useState(1);
  const [reason, setReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const REASONS = [
    'Too expensive',
    'Not using it enough',
    'Missing features I need',
    'Technical issues',
    'Other'
  ];

  const handleCancel = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      onClose();
      alert('Subscription canceled. You still have access until May 31.');
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-surface-950/50 backdrop-blur-sm animate-fade-in">
      <Card className="max-w-md w-full p-8 relative animate-scale-up">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-hint hover:text-primary">
          <X size={20} />
        </button>

        {step === 1 && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center">
              <div className="w-16 h-16 bg-surface-200 text-hint rounded-full flex items-center justify-center mx-auto mb-4">
                <Frown size={32} />
              </div>
              <h2 className="text-2xl font-black">We're sorry to see you go</h2>
              <p className="text-sm text-hint mt-2">Could you tell us why you're canceling?</p>
            </div>

            <div className="space-y-2">
              {REASONS.map((r) => (
                <label key={r} className="flex items-center gap-3 p-3 bg-surface-100 border border-surface-200 rounded-lg cursor-pointer hover:bg-surface-200 transition-colors">
                  <input 
                    type="radio" 
                    name="reason" 
                    value={r} 
                    onChange={(e) => setReason(e.target.value)}
                    className="w-4 h-4 text-brand-500 border-surface-300 focus:ring-brand-400" 
                  />
                  <span className="text-sm font-medium">{r}</span>
                </label>
              ))}
            </div>

            <div className="pt-4 flex gap-3">
              <Button variant="ghost" fullWidth onClick={onClose}>Stay with us</Button>
              <Button 
                variant="primary" 
                fullWidth 
                disabled={!reason}
                onClick={() => setStep(2)}
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {step === 2 && reason === 'Too expensive' && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center">
              <div className="w-16 h-16 bg-success-100 text-success-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart size={32} />
              </div>
              <h2 className="text-2xl font-black">Wait! Here's a gift 🎁</h2>
              <p className="text-sm text-hint mt-2">We really want you to stay. How about 50% off next month?</p>
            </div>

            <div className="p-6 bg-gradient-to-br from-brand-500 to-brand-600 rounded-2xl text-white shadow-xl shadow-brand-500/20">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold uppercase tracking-widest opacity-80">Special Offer</span>
                <Badge variant="success">50% OFF</Badge>
              </div>
              <h3 className="text-xl font-black">Only $9.50 next month</h3>
              <p className="text-sm opacity-90 mt-1">Full Creator plan access. No restrictions.</p>
            </div>

            <div className="pt-4 flex flex-col gap-3">
              <Button variant="primary" size="lg" fullWidth onClick={() => { alert('Offer claimed! 🎉'); onClose(); }}>
                Claim 50% Off
              </Button>
              <Button variant="ghost" fullWidth onClick={() => setStep(3)}>No thanks, cancel anyway</Button>
            </div>
          </div>
        )}

        {(step === 3 || (step === 2 && reason !== 'Too expensive')) && (
          <div className="space-y-6 animate-fade-in text-center">
            <div className="w-16 h-16 bg-danger-50 text-danger-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldAlert size={32} />
            </div>
            <h2 className="text-2xl font-black">Confirm Cancellation</h2>
            
            <div className="p-4 bg-danger-50 rounded-xl border border-danger-100 text-left space-y-3">
              <p className="text-sm font-bold text-danger-700">You'll lose these on May 31:</p>
              <ul className="space-y-2">
                {['500 credits drops to 50', 'No Video/Audio stages', 'Watermark added to exports'].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs text-danger-600">
                    <AlertCircle size={12} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-4 flex gap-3">
              <Button variant="ghost" fullWidth onClick={onClose}>Keep Plan</Button>
              <Button 
                variant="outline" 
                fullWidth 
                className="text-danger-500 hover:bg-danger-50"
                onClick={handleCancel}
                isLoading={isProcessing}
              >
                Yes, Cancel
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
