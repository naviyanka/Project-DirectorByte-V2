import React, { useState } from 'react';
import { Search, MessageSquare, Clock, User, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button, Card, Badge, Input } from '../../../design-system/components';
import { adminService } from '../../../services/admin.service';
import { cn } from '../../../utils/styles';

export function AdminTicketListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['adminTickets', { search }],
    queryFn: () => adminService.getTickets({ search, status: 'OPEN' }),
  });

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'URGENT': return <Badge variant="danger">Urgent</Badge>;
      case 'HIGH': return <Badge variant="warning">High</Badge>;
      default: return <Badge variant="info">Normal</Badge>;
    }
  };

  if (isLoading) return <div className="p-8 text-center animate-pulse">Loading support inbox...</div>;

  const tickets = data?.items || [];

  return (
    <div className="animate-fade-in">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black">Support Inbox</h1>
          <p className="text-sm text-hint mt-1">{data?.totalOpen || 0} open tickets · Platform support</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm">Canned Responses</Button>
          <Button variant="outline" size="sm">Metrics</Button>
        </div>
      </header>

      <Card className="mb-6 p-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <Input 
              placeholder="Search by ticket ID, subject, or user..." 
              fullWidth 
              leftIcon={<Search size={18} />} 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">Priority: All</Button>
            <Button variant="outline" size="sm">Status: Open</Button>
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        {tickets.map((ticket: any) => (
          <Card 
            key={ticket.id} 
            className="group hover:border-warning-500 transition-colors cursor-pointer"
            onClick={() => navigate(`/admin/support/tickets/${ticket.id}`)}
          >
            <div className="flex items-start gap-6">
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
                ticket.priority === 'URGENT' ? "bg-danger-50 text-danger-500" : "bg-surface-100 text-surface-400 group-hover:bg-warning-50 group-hover:text-warning-500"
              )}>
                {ticket.priority === 'URGENT' ? <ShieldAlert size={24} /> : <MessageSquare size={24} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-xs font-bold text-hint">#{ticket.id}</span>
                  <h3 className="font-bold text-lg truncate">{ticket.subject || ticket.title}</h3>
                  {getPriorityBadge(ticket.priority)}
                </div>
                
                <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-hint">
                  <div className="flex items-center gap-1.5 font-bold text-secondary">
                    <User size={14} />
                    <span>{ticket.user?.name || ticket.userEmail} ({ticket.user?.plan?.name || 'Free'})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock size={14} />
                    <span>Created: {new Date(ticket.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="self-center">Assign</Button>
            </div>
          </Card>
        ))}
        {tickets.length === 0 && (
          <div className="p-12 text-center text-hint italic">No open tickets found.</div>
        )}
      </div>
    </div>
  );
}
