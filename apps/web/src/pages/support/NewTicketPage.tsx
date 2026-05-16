import React, { useState, useEffect } from 'react';
import { ArrowLeft, Send, Upload, X, Search, FileText } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { Button, Card, Input, Select } from '../../design-system/components';
import { supportService } from '../../services/support.service';
import { cn } from '../../utils/styles';
import styles from './Ticketing.module.css';

export function NewTicketPage() {
  const navigate = useNavigate();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (subject.length > 5) {
      const timer = setTimeout(async () => {
        const results = await supportService.searchArticles(subject);
        setSuggestions(results.slice(0, 3));
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setSuggestions([]);
    }
  }, [subject]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      navigate('/support/tickets/42'); // Navigate to new ticket
    }, 1500);
  };

  return (
    <div className={cn(styles.container, 'animate-fade-in')}>
      <div className="mb-8">
        <Link to="/support" className="flex items-center gap-2 text-sm text-hint hover:text-brand-500 transition-colors mb-4">
          <ArrowLeft size={16} />
          <span>Back to Support</span>
        </Link>
        <h1 className="text-3xl font-black">Submit a Support Ticket</h1>
        <p className="text-sm text-hint">Our team typically responds within 4-12 hours.</p>
      </div>

      <form onSubmit={handleSubmit} className={styles.formGrid}>
        <div className="space-y-8">
          <Card className="p-8">
            <div className="space-y-6">
              <Input 
                label="Subject" 
                required 
                fullWidth 
                placeholder="Briefly describe your issue" 
                value={subject}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSubject(e.target.value)}
              />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-secondary">Category</label>
                  <select className="w-full bg-surface-100 border border-surface-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-brand-400 outline-none">
                    <option>Technical Issue</option>
                    <option>Billing & Subscription</option>
                    <option>Account Access</option>
                    <option>Feature Request</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-secondary">Priority</label>
                  <select className="w-full bg-surface-100 border border-surface-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-brand-400 outline-none">
                    <option>Normal</option>
                    <option>High</option>
                    <option>Urgent (Account Access)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-secondary">Message</label>
                <textarea 
                  className="w-full bg-surface-100 border border-surface-200 rounded-lg p-4 text-sm focus:ring-2 focus:ring-brand-400 outline-none min-h-[200px]"
                  placeholder="Explain your issue in detail. Include steps to reproduce if technical."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-secondary">Attachments (Optional)</label>
                <div className={styles.attachmentZone}>
                  <Upload className="mx-auto mb-2 opacity-50" />
                  <p className="text-xs font-bold uppercase tracking-wider">Drag & drop files or click to browse</p>
                  <p className="text-[10px] opacity-60 mt-1">PNG, JPG, PDF, MP4 (Max 20MB per file)</p>
                </div>
              </div>

              <div className="pt-6 border-t border-surface-200 flex justify-end gap-3">
                <Button variant="ghost" type="button" onClick={() => navigate('/support')}>Cancel</Button>
                <Button variant="primary" size="lg" iconLeft={<Send size={18} />} isLoading={isSubmitting} type="submit">
                  Submit Ticket
                </Button>
              </div>
            </div>
          </Card>
        </div>

        <aside className="space-y-6">
          {suggestions.length > 0 && (
            <Card className="bg-brand-50 border-brand-100 p-6">
              <div className="flex items-center gap-2 text-brand-600 mb-4">
                <Search size={18} />
                <h4 className="font-bold text-sm">Suggested Articles</h4>
              </div>
              <p className="text-xs text-brand-800 mb-4 leading-relaxed">These might help you resolve the issue faster:</p>
              <div className="space-y-3">
                {suggestions.map((s) => (
                  <Link key={s.id} to={`/support/article/${s.slug}`} className="flex items-start gap-2 group">
                    <FileText size={14} className="mt-0.5 opacity-50 group-hover:opacity-100" />
                    <span className="text-xs font-medium text-brand-700 group-hover:underline">{s.title}</span>
                  </Link>
                ))}
              </div>
            </Card>
          )}

          <Card className="p-6">
            <h4 className="font-bold text-sm mb-4">Submission Tips</h4>
            <ul className="space-y-3">
              {[
                'Be specific with error messages',
                'Include screenshots of the issue',
                'Mention your browser and OS',
                'One issue per ticket'
              ].map((tip, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-hint">
                  <span className="mt-1 w-1.5 h-1.5 rounded-full bg-brand-400 flex-shrink-0" />
                  {tip}
                </li>
              ))}
            </ul>
          </Card>
        </aside>
      </form>
    </div>
  );
}
