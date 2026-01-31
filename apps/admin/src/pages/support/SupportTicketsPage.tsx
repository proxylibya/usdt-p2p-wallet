import { useState, useEffect } from 'react';
import {
  Search, Clock, User, MessageSquare,
  CheckCircle, Loader2, Send, ChevronRight
} from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import { useToast } from '../../context/ToastContext';

interface Ticket {
  id: string;
  subject: string;
  userId: string;
  userName: string;
  userEmail: string;
  category: 'general' | 'technical' | 'billing' | 'kyc' | 'dispute';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'waiting' | 'resolved' | 'closed';
  assignedTo?: string;
  messages: { id: string; content: string; sender: 'user' | 'admin'; createdAt: string }[];
  createdAt: string;
  updatedAt: string;
}

const priorityColors: Record<string, string> = {
  low: 'badge-info',
  medium: 'badge-warning',
  high: 'bg-orange-500/20 text-orange-400',
  urgent: 'badge-error',
};

const statusColors: Record<string, string> = {
  open: 'badge-info',
  in_progress: 'badge-warning',
  waiting: 'bg-purple-500/20 text-purple-400',
  resolved: 'badge-success',
  closed: 'bg-gray-500/20 text-gray-400',
};

const SupportTicketsPage: React.FC = () => {
  const { success, error } = useToast();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [replyText, setReplyText] = useState('');
  const [stats, setStats] = useState({ open: 0, inProgress: 0, resolved: 0, avgResponseTime: '2h 15m' });

  useEffect(() => {
    fetchTickets();
  }, [statusFilter, priorityFilter]);

  const fetchTickets = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get<{ tickets: Ticket[]; stats: typeof stats }>('/admin/support/tickets');
      if (response.success && response.data) {
        setTickets(response.data.tickets);
        setStats(response.data.stats);
      }
    } catch {
      setTickets([]);
    }
    setIsLoading(false);
  };

  const handleUpdateStatus = async (ticketId: string, newStatus: string) => {
    try {
      await apiClient.patch(`/admin/support/tickets/${ticketId}`, { status: newStatus });
      success('Status Updated', `Ticket marked as ${newStatus}`);
      fetchTickets();
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket({ ...selectedTicket, status: newStatus as Ticket['status'] });
      }
    } catch {
      error('Failed', 'Could not update ticket status');
    }
  };

  const handleSendReply = async () => {
    if (!selectedTicket || !replyText.trim()) return;
    try {
      await apiClient.post(`/admin/support/tickets/${selectedTicket.id}/reply`, { message: replyText });
      success('Reply Sent', 'Your response has been sent');
      setReplyText('');
      fetchTickets();
    } catch {
      error('Failed', 'Could not send reply');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Support Tickets</h1>
          <p className="text-text-secondary mt-1">Manage customer support requests</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-status-info/20 rounded-xl">
              <MessageSquare className="w-6 h-6 text-status-info" />
            </div>
            <div>
              <p className="text-text-secondary text-sm">Open</p>
              <p className="text-2xl font-bold text-text-primary">{stats.open}</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-status-warning/20 rounded-xl">
              <Clock className="w-6 h-6 text-status-warning" />
            </div>
            <div>
              <p className="text-text-secondary text-sm">In Progress</p>
              <p className="text-2xl font-bold text-text-primary">{stats.inProgress}</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-status-success/20 rounded-xl">
              <CheckCircle className="w-6 h-6 text-status-success" />
            </div>
            <div>
              <p className="text-text-secondary text-sm">Resolved Today</p>
              <p className="text-2xl font-bold text-text-primary">{stats.resolved}</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-brand-yellow/20 rounded-xl">
              <Clock className="w-6 h-6 text-brand-yellow" />
            </div>
            <div>
              <p className="text-text-secondary text-sm">Avg Response</p>
              <p className="text-2xl font-bold text-text-primary">{stats.avgResponseTime}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-background-secondary p-4 rounded-xl border border-border-divider flex flex-wrap gap-4">
        <div className="flex-1 min-w-64 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
          <input type="text" placeholder="Search tickets..." className="input-field pl-10" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input-field w-40">
          <option value="all">All Status</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="waiting">Waiting</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
        <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="input-field w-40">
          <option value="all">All Priority</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tickets List */}
        <div className="lg:col-span-1 bg-background-secondary rounded-xl border border-border-divider overflow-hidden">
          <div className="p-4 border-b border-border-divider">
            <h3 className="font-semibold text-text-primary">Tickets ({tickets.length})</h3>
          </div>
          <div className="max-h-[600px] overflow-y-auto">
            {isLoading ? (
              <div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-brand-yellow" /></div>
            ) : tickets.length === 0 ? (
              <div className="p-8 text-center text-text-secondary">No tickets found</div>
            ) : (
              tickets.map((ticket) => (
                <button
                  key={ticket.id}
                  onClick={() => setSelectedTicket(ticket)}
                  className={`w-full p-4 text-left border-b border-border-divider hover:bg-background-tertiary transition-colors ${selectedTicket?.id === ticket.id ? 'bg-background-tertiary' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="font-medium text-text-primary truncate flex-1">{ticket.subject}</h4>
                    <ChevronRight className="w-4 h-4 text-text-secondary flex-shrink-0" />
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`badge text-xs ${priorityColors[ticket.priority]}`}>{ticket.priority}</span>
                    <span className={`badge text-xs ${statusColors[ticket.status]}`}>{ticket.status.replace('_', ' ')}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-text-secondary">
                    <span>{ticket.userName}</span>
                    <span>{ticket.createdAt}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Ticket Detail */}
        <div className="lg:col-span-2 bg-background-secondary rounded-xl border border-border-divider">
          {selectedTicket ? (
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="p-4 border-b border-border-divider">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-text-primary">{selectedTicket.subject}</h3>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`badge text-xs ${priorityColors[selectedTicket.priority]}`}>{selectedTicket.priority}</span>
                      <span className={`badge text-xs ${statusColors[selectedTicket.status]}`}>{selectedTicket.status.replace('_', ' ')}</span>
                      <span className="text-xs text-text-secondary">#{selectedTicket.id.slice(0, 8)}</span>
                    </div>
                  </div>
                  <select
                    value={selectedTicket.status}
                    onChange={(e) => handleUpdateStatus(selectedTicket.id, e.target.value)}
                    className="input-field text-sm w-36"
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="waiting">Waiting</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border-divider">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-text-secondary" />
                    <span className="text-sm text-text-primary">{selectedTicket.userName}</span>
                  </div>
                  <span className="text-sm text-text-secondary">{selectedTicket.userEmail}</span>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 p-4 overflow-y-auto max-h-96 space-y-4">
                {selectedTicket.messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-3 rounded-lg ${msg.sender === 'admin' ? 'bg-brand-yellow/20 text-text-primary' : 'bg-background-tertiary text-text-primary'}`}>
                      <p className="text-sm">{msg.content}</p>
                      <p className="text-xs text-text-secondary mt-1">{msg.createdAt}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Reply Box */}
              <div className="p-4 border-t border-border-divider">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your reply..."
                    className="input-field flex-1"
                    onKeyDown={(e) => e.key === 'Enter' && handleSendReply()}
                  />
                  <button onClick={handleSendReply} className="btn-primary px-4">
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center p-8">
              <div className="text-center">
                <MessageSquare className="w-12 h-12 text-text-secondary mx-auto mb-2" />
                <p className="text-text-secondary">Select a ticket to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SupportTicketsPage;
