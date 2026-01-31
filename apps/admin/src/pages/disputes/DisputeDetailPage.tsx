import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, MessageSquare, FileText, CheckCircle, AlertTriangle, Send } from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import { useToast } from '../../context/ToastContext';

interface DisputeDetail {
  id: string;
  tradeId: string;
  initiator: { id: string; name: string; email: string };
  respondent: { id: string; name: string; email: string };
  reason: string;
  description: string;
  status: 'open' | 'in_review' | 'resolved' | 'escalated';
  priority: 'low' | 'medium' | 'high' | 'critical';
  amount: number;
  asset: string;
  createdAt: string;
  evidence: { type: string; url: string; uploadedBy: string }[];
  messages: { id: string; sender: string; message: string; time: string; isAdmin: boolean }[];
}

const DisputeDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error } = useToast();
  const [dispute, setDispute] = useState<DisputeDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [resolution, setResolution] = useState<'buyer' | 'seller' | ''>('');

  useEffect(() => {
    fetchDispute();
  }, [id]);

  const fetchDispute = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get<DisputeDetail>(`/admin/disputes/${id}`);
      if (response.success && response.data) {
        setDispute(response.data);
      }
    } catch {
      error('Load Failed', 'Failed to load dispute details');
      navigate('/disputes');
    }
    setIsLoading(false);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    try {
      await apiClient.post(`/admin/disputes/${id}/message`, { message: newMessage });
      success('Message Sent', 'Your message has been sent');
      setNewMessage('');
      fetchDispute();
    } catch {
      error('Failed', 'Could not send message');
    }
  };

  const handleResolve = async () => {
    if (!resolution || !dispute) {
      error('Select Resolution', 'Please select who wins the dispute');
      return;
    }
    try {
      const response = await apiClient.post(`/admin/disputes/${dispute.tradeId}/resolve`, { 
        winner: resolution, 
        reason: 'Admin resolution based on evidence review' 
      });
      if (response.success) {
        success('Dispute Resolved', `Resolved in favor of ${resolution}`);
        navigate('/disputes');
      } else {
        error('Failed', response.error || 'Could not resolve dispute');
      }
    } catch {
      error('Failed', 'Could not resolve dispute');
    }
  };

  if (isLoading || !dispute) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-brand-yellow border-t-transparent rounded-full" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/disputes')} className="p-2 hover:bg-background-secondary rounded-lg">
          <ArrowLeft className="w-5 h-5 text-text-secondary" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-text-primary">Dispute {dispute.id}</h1>
          <p className="text-text-secondary">Trade: {dispute.tradeId} • {dispute.createdAt}</p>
        </div>
        <span className={`badge ${dispute.priority === 'critical' ? 'badge-error' : dispute.priority === 'high' ? 'bg-orange-500/20 text-orange-400' : 'badge-warning'}`}>
          {dispute.priority} priority
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Parties */}
          <div className="bg-background-secondary p-6 rounded-xl border border-border-divider">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Parties Involved</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-background-tertiary rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-status-error/20 flex items-center justify-center">
                    <User className="w-5 h-5 text-status-error" />
                  </div>
                  <div>
                    <p className="text-xs text-text-secondary">Initiator (Buyer)</p>
                    <p className="font-medium text-text-primary">{dispute.initiator.name}</p>
                  </div>
                </div>
                <p className="text-sm text-text-secondary">{dispute.initiator.email}</p>
              </div>
              <div className="p-4 bg-background-tertiary rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-status-success/20 flex items-center justify-center">
                    <User className="w-5 h-5 text-status-success" />
                  </div>
                  <div>
                    <p className="text-xs text-text-secondary">Respondent (Seller)</p>
                    <p className="font-medium text-text-primary">{dispute.respondent.name}</p>
                  </div>
                </div>
                <p className="text-sm text-text-secondary">{dispute.respondent.email}</p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="bg-background-secondary p-6 rounded-xl border border-border-divider">
            <h3 className="text-lg font-semibold text-text-primary mb-2">Reason: {dispute.reason}</h3>
            <p className="text-text-secondary">{dispute.description}</p>
          </div>

          {/* Chat */}
          <div className="bg-background-secondary rounded-xl border border-border-divider">
            <div className="p-4 border-b border-border-divider flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-text-secondary" />
              <h3 className="font-semibold text-text-primary">Discussion</h3>
            </div>
            <div className="p-4 h-64 overflow-y-auto space-y-3">
              {dispute.messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.isAdmin ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] p-3 rounded-lg ${msg.isAdmin ? 'bg-brand-yellow/20' : 'bg-background-tertiary'}`}>
                    <p className="text-xs text-text-secondary mb-1">{msg.sender} • {msg.time}</p>
                    <p className="text-text-primary">{msg.message}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-border-divider flex gap-2">
              <input
                type="text"
                placeholder="Type admin message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="input-field flex-1"
              />
              <button onClick={handleSendMessage} className="btn-primary flex items-center gap-2">
                <Send className="w-4 h-4" /> Send
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Trade Info */}
          <div className="bg-background-secondary p-6 rounded-xl border border-border-divider">
            <h3 className="font-semibold text-text-primary mb-4">Trade Details</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-text-secondary">Amount</span>
                <span className="font-medium text-text-primary">{dispute.amount} {dispute.asset}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Status</span>
                <span className="badge badge-warning">{dispute.status}</span>
              </div>
            </div>
          </div>

          {/* Evidence */}
          <div className="bg-background-secondary p-6 rounded-xl border border-border-divider">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-text-secondary" />
              <h3 className="font-semibold text-text-primary">Evidence</h3>
            </div>
            {dispute.evidence.length > 0 ? (
              <div className="space-y-2">
                {dispute.evidence.map((ev, idx) => (
                  <div key={idx} className="p-3 bg-background-tertiary rounded-lg flex items-center justify-between">
                    <span className="text-sm text-text-primary">{ev.type} - {ev.uploadedBy}</span>
                    <button className="text-brand-yellow text-sm">View</button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-text-secondary text-sm">No evidence uploaded</p>
            )}
          </div>

          {/* Resolution */}
          <div className="bg-background-secondary p-6 rounded-xl border border-border-divider">
            <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-status-warning" /> Resolve Dispute
            </h3>
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3 bg-background-tertiary rounded-lg cursor-pointer hover:bg-border-divider">
                <input type="radio" name="resolution" value="buyer" checked={resolution === 'buyer'} onChange={() => setResolution('buyer')} className="w-4 h-4" />
                <span className="text-text-primary">Release to Buyer</span>
              </label>
              <label className="flex items-center gap-3 p-3 bg-background-tertiary rounded-lg cursor-pointer hover:bg-border-divider">
                <input type="radio" name="resolution" value="seller" checked={resolution === 'seller'} onChange={() => setResolution('seller')} className="w-4 h-4" />
                <span className="text-text-primary">Return to Seller</span>
              </label>
              <button onClick={handleResolve} className="w-full btn-primary flex items-center justify-center gap-2">
                <CheckCircle className="w-4 h-4" /> Resolve Dispute
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DisputeDetailPage;
