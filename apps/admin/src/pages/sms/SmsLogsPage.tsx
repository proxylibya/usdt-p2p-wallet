import { useState, useEffect } from 'react';
import { RefreshCw, Smartphone } from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import { useToast } from '../../context/ToastContext';
import { SmsLog } from '../../types/sms';
import { format } from 'date-fns';

export default function SmsLogsPage() {
  const { success, error } = useToast();
  const [logs, setLogs] = useState<SmsLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Test SMS state
  const [testPhone, setTestPhone] = useState('');
  const [testMessage, setTestMessage] = useState('This is a test message from USDT Wallet.');
  const [sendingTest, setSendingTest] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, [page]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get<{ data: SmsLog[], totalPages: number }>(`/sms/logs?page=${page}&limit=20`);
      if (response.success && response.data) {
        setLogs(response.data.data);
        setTotalPages(response.data.totalPages);
      } else {
        error('Error', response.error || 'Failed to fetch logs');
      }
    } catch (err) {
      error('Error', 'Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testPhone) return;

    setSendingTest(true);
    try {
      const response = await apiClient.post('/sms/test', {
        phone: testPhone,
        message: testMessage,
      });

      if (response.success) {
        success('Success', 'Test SMS sent (check status in logs)');
        setTestPhone('');
        fetchLogs(); // Refresh logs to see new entry
      } else {
        error('Error', response.error || 'Failed to send test SMS');
      }
    } catch (err) {
      error('Error', 'Network error');
    } finally {
      setSendingTest(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">SMS Logs</h1>
          <p className="text-text-secondary">History of all sent messages and delivery status</p>
        </div>
        <button
          onClick={fetchLogs}
          className="p-2 hover:bg-background-secondary rounded-lg transition-colors"
          title="Refresh"
        >
          <RefreshCw className="w-5 h-5 text-text-secondary" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Logs List */}
        <div className="lg:col-span-2 card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-background-secondary text-text-secondary text-sm">
                <tr>
                  <th className="px-6 py-3 text-left">Time</th>
                  <th className="px-6 py-3 text-left">Recipient</th>
                  <th className="px-6 py-3 text-left">Provider</th>
                  <th className="px-6 py-3 text-left">Status</th>
                  <th className="px-6 py-3 text-left">Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-divider">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-text-secondary">
                      Loading...
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-text-secondary">
                      No logs found
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-background-secondary/50 transition-colors">
                      <td className="px-6 py-4 text-sm text-text-secondary">
                        {format(new Date(log.sentAt), 'MMM d, HH:mm:ss')}
                      </td>
                      <td className="px-6 py-4 font-mono text-sm text-text-primary">
                        {log.recipient}
                      </td>
                      <td className="px-6 py-4 text-sm text-text-secondary">
                        {log.provider?.name || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${
                          log.status === 'SENT' || log.status === 'DELIVERED'
                            ? 'bg-status-success/10 text-status-success'
                            : log.status === 'FAILED'
                            ? 'bg-status-error/10 text-status-error'
                            : 'bg-status-warning/10 text-status-warning'
                        }`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-text-secondary">
                        {log.cost ? `$${Number(log.cost).toFixed(4)}` : '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-4 border-t border-border-divider flex justify-center gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="px-3 py-1 rounded hover:bg-background-secondary disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-3 py-1 text-text-secondary">
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
              className="px-3 py-1 rounded hover:bg-background-secondary disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>

        {/* Test SMS Tool */}
        <div className="card p-6 h-fit space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Smartphone className="w-5 h-5 text-brand-primary" />
            <h3 className="font-semibold text-text-primary">Test SMS</h3>
          </div>
          
          <form onSubmit={handleSendTest} className="space-y-4">
            <div className="space-y-2">
              <label className="label">Phone Number</label>
              <input
                type="text"
                required
                className="input w-full"
                placeholder="+218..."
                value={testPhone}
                onChange={e => setTestPhone(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <label className="label">Message</label>
              <textarea
                required
                className="input w-full h-24 resize-none"
                value={testMessage}
                onChange={e => setTestMessage(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={sendingTest || !testPhone}
              className="btn-primary w-full"
            >
              {sendingTest ? 'Sending...' : 'Send Test SMS'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
