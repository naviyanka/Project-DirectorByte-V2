import React from 'react';
import { AlertTriangle, ShieldAlert, ArrowUpCircle, X } from 'lucide-react';
import { Button } from '../../../design-system/components';
import { cn } from '../../../utils/styles';
import { useNavigate } from 'react-router-dom';

interface UsageBannerProps {
  type: 'WARNING' | 'EXHAUSTED';
  credits: number;
  total: number;
  onDismiss?: () => void;
}

export function UsageBanner({ type, credits, total, onDismiss }: UsageBannerProps) {
  const navigate = useNavigate();
  const percent = Math.round((credits / total) * 100);

  if (type === 'EXHAUSTED') {
    return (
      <div className="bg-danger-600 text-white p-3 flex items-center justify-center gap-6 animate-slide-down">
        <div className="flex items-center gap-2 font-bold">
          <ShieldAlert size={18} />
          <span>You've used all your AI credits ({credits}/{total}).</span>
        </div>
        <p className="text-sm hidden md:block">Upgrade now to continue generating masterpieces.</p>
        <Button 
          variant="primary" 
          size="sm" 
          className="bg-white text-danger-600 hover:bg-surface-100 border-none"
          onClick={() => navigate('/pricing')}
        >
          Upgrade Plan
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-warning-500 text-white p-2 flex items-center justify-center gap-4 animate-slide-down">
      <div className="flex items-center gap-2 text-sm font-medium">
        <AlertTriangle size={16} />
        <span>You've used {percent}% of your AI credits ({credits}/{total}).</span>
      </div>
      <Button 
        variant="ghost" 
        size="sm" 
        className="text-white hover:bg-white/10 p-0 h-auto text-xs underline font-bold"
        onClick={() => navigate('/pricing')}
      >
        Get more credits
      </Button>
      {onDismiss && (
        <button onClick={onDismiss} className="p-1 hover:bg-white/10 rounded ml-4">
          <X size={14} />
        </button>
      )}
    </div>
  );
}
