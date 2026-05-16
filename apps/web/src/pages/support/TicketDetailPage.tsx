import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Send, Paperclip, CheckCircle2, User, ShieldCheck } from 'lucide-react';
import { Button, Card, Badge } from '../../design-system/components';
import { cn } from '../../utils/styles';
import styles from './Ticketing.module.css';

export function TicketDetailPage() {
  const { id } = useParams();
  const [reply, setReply] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const messages = [
    {
      id: 'm1',
      sender: 'You',
      role: 'USER',
      time: 'May 5, 2025 at 3:42 PM',
      content: "Hi, I'm trying to generate a video using Runway ML but getting the error 'provider unavailable'. I've verified my API key is correct. Screenshot attached.",
      attachments: ['screenshot.png']
    },
    {
      id: 'm2',
      sender: 'Support Team',
      role: 'ADMIN',
      time: 'May 6, 2025 at 9:15 AM',
      content: "Hi! Thanks for reaching out. We've been experiencing intermittent issues with the Runway ML integration. Our team is working on a fix, expected resolution by today EOD. In the meantime, you can try Kling as an alternative provider. Let us know if that helps!"
    }
  ];

  const handleReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reply.trim()) return;
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setReply('');
      alert('Reply submitted!');
    }, 1000);
  };

  return (
    <div className={cn(styles.container, 'animate-fade-in')}>
      <div className="mb-8">
        <Link to="/support/tickets" className="flex items-center gap-2 text-sm text-hint hover:text-brand-500 transition-colors mb-4">
          <ArrowLeft size={16} />
          <span>Back to My Tickets</span>
        </Link>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-black mb-2">Ticket #{id} · Video generation not working</h1>
            <div className="flex items-center gap-4 text-xs text-hint">
              <Badge variant="info">Open</Badge>
              <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider">
                <span className="text-danger-500">High Priority</span>
                <span className="opacity-30">•</span>
                <span>Technical</span>
              </div>
            </div>
          </div>
          <Button variant="outline" size="sm" iconLeft={<CheckCircle2 size={14} />}>Mark as Resolved</Button>
        </div>
      </div>

      <div className={styles.thread}>
        {messages.map((m) => (
          <div key={m.id} className={cn(styles.message, m.role === 'USER' ? styles.userMessage : styles.adminMessage)}>
            <div className={styles.messageHeader}>
              <div className="flex items-center gap-2">
                <div className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center text-[10px] text-white",
                  m.role === 'USER' ? "bg-brand-500" : "bg-surface-800"
                )}>
                  {m.role === 'USER' ? <User size={12} /> : <ShieldCheck size={12} />}
                </div>
                <span className="font-bold text-sm">{m.sender}</span>
              </div>
              <span className="text-[10px] font-bold text-hint uppercase tracking-wider">{m.time}</span>
            </div>
            <div className={styles.messageBody}>
              {m.content}
            </div>
            {m.attachments && (
              <div className="mt-4 flex gap-2">
                {m.attachments.map((a) => (
                  <div key={a} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-surface-200 rounded-lg text-xs font-medium cursor-pointer hover:bg-surface-50 transition-colors">
                    <Paperclip size={12} className="text-hint" />
                    <span>{a}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        <div className="py-4 text-center">
          <div className="inline-block px-4 py-1.5 bg-surface-100 rounded-full text-[10px] font-bold text-hint uppercase tracking-widest border border-surface-200">
            System: Ticket status updated to OPEN · May 5
          </div>
        </div>
      </div>

      <form onSubmit={handleReply} className={styles.replyArea}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center text-white">
            <User size={16} />
          </div>
          <span className="font-bold text-sm">Write a reply...</span>
        </div>
        
        <textarea 
          className="w-full bg-surface-50 border border-surface-200 rounded-xl p-4 text-sm focus:ring-2 focus:ring-brand-400 outline-none min-h-[120px] mb-4"
          placeholder="Type your message here..."
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          required
        />

        <div className="flex justify-between items-center">
          <Button variant="ghost" size="sm" iconLeft={<Paperclip size={16} />}>Attach Files</Button>
          <Button 
            variant="primary" 
            size="lg" 
            iconLeft={<Send size={18} />} 
            isLoading={isSubmitting}
            type="submit"
          >
            Submit Reply
          </Button>
        </div>
      </form>
    </div>
  );
}
