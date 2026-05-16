import React, { useState } from 'react';
import { Plus, Search, Filter, MessageSquare, Clock, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Badge, Input } from '../../design-system/components';
import { cn } from '../../utils/styles';
import styles from './Ticketing.module.css';

const MOCK_TICKETS = [
  { 
    id: '42', 
    title: 'Video generation not working', 
    status: 'OPEN', 
    priority: 'HIGH', 
    category: 'Technical',
    submittedAt: 'May 5, 2025',
    lastReply: '2 hours ago',
    lastReplyBy: 'Admin'
  },
  { 
    id: '38', 
    title: 'Billing question', 
    status: 'WAITING_USER', 
    priority: 'NORMAL', 
    category: 'Billing',
    submittedAt: 'Apr 28, 2025',
    lastReply: '3 days ago',
    lastReplyBy: 'You'
  },
  { 
    id: '31', 
    title: 'How to export to GIF', 
    status: 'RESOLVED', 
    priority: 'NORMAL', 
    category: 'Technical',
    submittedAt: 'Apr 20, 2025',
    lastReply: 'Apr 21, 2025',
    lastReplyBy: 'Admin'
  }
];

export function TicketListPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('ALL');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN': return <Badge variant="info">Open</Badge>;
      case 'IN_PROGRESS': return <Badge variant="brand">In Progress</Badge>;
      case 'WAITING_USER': return <Badge variant="warning">Waiting for you</Badge>;
      case 'RESOLVED': return <Badge variant="success">Resolved</Badge>;
      case 'CLOSED': return <Badge variant="default">Closed</Badge>;
      default: return null;
    }
  };

  return (
    <div className={cn(styles.container, 'animate-fade-in')}>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black">My Support Tickets</h1>
          <p className="text-sm text-hint">Manage and track your help requests.</p>
        </div>
        <Button 
          variant="primary" 
          iconLeft={<Plus size={18} />}
          onClick={() => navigate('/support/tickets/new')}
        >
          New Ticket
        </Button>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <Input placeholder="Search tickets..." leftIcon={<Search size={18} />} />
        </div>
        <div className="flex items-center gap-2 bg-surface-100 px-3 rounded-lg border border-surface-200">
          <Filter size={16} className="text-hint" />
          <select 
            className="bg-transparent border-none text-sm font-bold focus:ring-0 outline-none"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="ALL">All Tickets</option>
            <option value="OPEN">Open</option>
            <option value="RESOLVED">Resolved</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {MOCK_TICKETS.map((ticket) => (
          <Card 
            key={ticket.id} 
            className="group hover:border-brand-400 transition-colors cursor-pointer"
            onClick={() => navigate(`/support/tickets/${ticket.id}`)}
          >
            <div className="flex items-start gap-6">
              <div className="w-12 h-12 bg-surface-100 rounded-xl flex items-center justify-center text-surface-400 group-hover:bg-brand-50 group-hover:text-brand-500 transition-colors">
                <MessageSquare size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-xs font-bold text-hint">#{ticket.id}</span>
                  <h3 className="font-bold text-lg truncate">{ticket.title}</h3>
                  {getStatusBadge(ticket.status)}
                </div>
                
                <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-hint">
                  <div className="flex items-center gap-1.5">
                    <Clock size={14} />
                    <span>Submitted {ticket.submittedAt}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-surface-300" />
                    <span>Last reply: {ticket.lastReply} ({ticket.lastReplyBy})</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-1 h-1 rounded-full bg-surface-300" />
                    <span className="uppercase tracking-widest font-black text-[10px]">{ticket.category}</span>
                    <span className={cn(
                      "uppercase tracking-widest font-black text-[10px]",
                      ticket.priority === 'HIGH' ? "text-danger-500" : "text-hint"
                    )}>
                      {ticket.priority} Priority
                    </span>
                  </div>
                </div>
              </div>
              <ChevronRight className="self-center text-surface-300 group-hover:text-brand-500 transition-colors" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
