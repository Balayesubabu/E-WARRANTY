import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Clock, CheckCircle, Mail, Phone, ChevronDown, ChevronUp, Loader2, Search, Ticket } from 'lucide-react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Input } from '../ui/input';
import { toast } from 'sonner';
import { getAllSupportTickets, updateSupportTicket, getSupportTicketHistory } from '../../services/staffService';

export function SupportTickets() {
  const [expandedId, setExpandedId] = useState(null);
  const [replyText, setReplyText] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [ticketHistory, setTicketHistory] = useState({});
  const [historyLoading, setHistoryLoading] = useState({});

  const fetchTickets = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await getAllSupportTickets();
      const ticketsData = response?.data || response || [];

      const mapStatus = (backendStatus) => {
        const statusMap = { 'New': 'open', 'OnGoing': 'in-progress', 'OnHold': 'in-progress', 'Resolved': 'resolved' };
        return statusMap[backendStatus] || backendStatus || 'open';
      };

      const transformedTickets = (Array.isArray(ticketsData) ? ticketsData : []).map(ticket => ({
        id: ticket.id,
        ticketNumber: `TKT-${ticket.id?.substring(0, 8) || 'N/A'}`,
        customerName: ticket.customer_name || ticket.name || ticket.staff_id || 'Customer',
        customerEmail: ticket.customer_email || ticket.email || '',
        customerPhone: ticket.customer_phone || ticket.phone || '',
        subject: ticket.subject || ticket.title || 'Support Request',
        description: ticket.description || ticket.message || '',
        category: ticket.category || 'general',
        priority: ticket.priority || 'medium',
        status: mapStatus(ticket.status),
        createdDate: ticket.created_at,
        lastUpdated: ticket.updated_at || ticket.created_at,
      }));
      setTickets(transformedTickets);
    } catch (error) {
      console.error('Error fetching support tickets:', error);
      if (error?.response?.status !== 404) toast.error('Failed to load support tickets');
      setTickets([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  const mapToBackendStatus = (frontendStatus) => {
    const statusMap = { 'open': 'New', 'in-progress': 'OnGoing', 'resolved': 'Resolved', 'closed': 'Resolved' };
    return statusMap[frontendStatus] || frontendStatus;
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      setIsUpdating(true);
      setTickets(tickets.map(t => t.id === id ? { ...t, status: newStatus, lastUpdated: new Date().toISOString().split('T')[0] } : t));
      await updateSupportTicket({ id, status: mapToBackendStatus(newStatus) });
      toast.success(`Ticket status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating ticket status:', error);
      toast.error('Failed to update ticket status');
      fetchTickets();
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReply = async (id) => {
    const reply = replyText[id];
    if (!reply || reply.trim() === '') { toast.error('Please enter a reply message'); return; }
    try {
      setIsUpdating(true);
      await updateSupportTicket({ id, reply: reply, status: 'OnGoing' });
      toast.success('Reply sent to customer!');
      setReplyText({ ...replyText, [id]: '' });
      setTicketHistory((prev) => { const next = { ...prev }; delete next[id]; return next; });
      loadTicketHistory(id);
      setTickets(tickets.map(t => t.id === id ? { ...t, status: 'in-progress', lastUpdated: new Date().toISOString().split('T')[0] } : t));
    } catch (error) {
      console.error('Error sending reply:', error);
      toast.error('Failed to send reply');
    } finally {
      setIsUpdating(false);
    }
  };

  const loadTicketHistory = useCallback(async (ticketId) => {
    if (ticketHistory[ticketId] || historyLoading[ticketId]) return;
    setHistoryLoading((prev) => ({ ...prev, [ticketId]: true }));
    try {
      const res = await getSupportTicketHistory(ticketId);
      const data = res?.data;
      const history = data?.SupportTicketHistory || [];
      setTicketHistory((prev) => ({ ...prev, [ticketId]: history }));
    } catch {
      setTicketHistory((prev) => ({ ...prev, [ticketId]: [] }));
    } finally {
      setHistoryLoading((prev) => ({ ...prev, [ticketId]: false }));
    }
  }, [ticketHistory, historyLoading]);

  const handleExpand = (ticketId) => {
    const next = expandedId === ticketId ? null : ticketId;
    setExpandedId(next);
    if (next) loadTicketHistory(next);
  };

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const searchedTickets = tickets.filter((t) => {
    if (!normalizedQuery) return true;
    return [t.customerName, t.customerEmail, t.subject, t.ticketNumber, t.description].some((v) => (v || '').toLowerCase().includes(normalizedQuery));
  });
  const filteredTickets = searchedTickets.filter((t) => statusFilter === 'all' || t.status === statusFilter);
  const openTickets = filteredTickets.filter(t => t.status === 'open' || t.status === 'in-progress');
  const resolvedTickets = filteredTickets.filter(t => t.status === 'resolved' || t.status === 'closed');

  const getStatusColor = (s) => {
    if (s === 'resolved' || s === 'closed') return 'bg-green-100 text-green-700';
    if (s === 'in-progress') return 'bg-blue-100 text-blue-700';
    if (s === 'open') return 'bg-amber-100 text-amber-700';
    return 'bg-slate-100 text-slate-700';
  };
  const getPriorityColor = (p) => {
    if (p === 'high') return 'bg-red-100 text-red-700';
    if (p === 'medium') return 'bg-amber-100 text-amber-700';
    return 'bg-slate-100 text-slate-700';
  };
  const getCategoryColor = (c) => {
    if (c === 'technical') return 'bg-purple-100 text-purple-700';
    if (c === 'billing') return 'bg-cyan-100 text-cyan-700';
    return 'bg-slate-100 text-slate-700';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-12 h-12 text-[#1A7FC1] animate-spin mx-auto" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div className="flex items-center gap-2">
        <Ticket className="w-5 h-5 text-[#1A7FC1]" />
        <h2 className="text-xl font-semibold text-slate-900">Support Tickets</h2>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm text-center">
          <p className="text-slate-500 text-sm mb-1">Open</p>
          <p className="text-amber-600 text-2xl font-bold">{tickets.filter(t => t.status === 'open').length}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm text-center">
          <p className="text-slate-500 text-sm mb-1">In Progress</p>
          <p className="text-[#1A7FC1] text-2xl font-bold">{tickets.filter(t => t.status === 'in-progress').length}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm text-center">
          <p className="text-slate-500 text-sm mb-1">Resolved</p>
          <p className="text-green-600 text-2xl font-bold">{tickets.filter(t => t.status === 'resolved').length}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm text-center">
          <p className="text-slate-500 text-sm mb-1">Closed</p>
          <p className="text-slate-600 text-2xl font-bold">{tickets.filter(t => t.status === 'closed').length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search by customer, subject, email, ticket ID..." className="pl-10" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {['all', 'open', 'in-progress', 'resolved', 'closed'].map((f) => (
              <button key={f} onClick={() => setStatusFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${statusFilter === f ? 'bg-[#1A7FC1] text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
                {f === 'all' ? 'All' : f === 'in-progress' ? 'In Progress' : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <p className="text-xs text-slate-500 mt-3">Showing {filteredTickets.length} of {tickets.length} tickets</p>
      </div>

      {/* Open Tickets */}
      {openTickets.length > 0 && (
        <div>
          <h3 className="text-slate-900 font-medium mb-4">Active Tickets</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {openTickets.map((ticket) => (
              <motion.div key={ticket.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="text-slate-900 font-medium">{ticket.customerName}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${getStatusColor(ticket.status)}`}>{ticket.status}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${getPriorityColor(ticket.priority)}`}>{ticket.priority}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${getCategoryColor(ticket.category)}`}>{ticket.category}</span>
                    </div>
                    <p className="text-slate-500 text-sm">{ticket.ticketNumber}</p>
                    <p className="text-slate-900 text-sm mt-1">{ticket.subject}</p>
                  </div>
                  <button onClick={() => handleExpand(ticket.id)} className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center">
                    {expandedId === ticket.id ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
                  </button>
                </div>

                <AnimatePresence>
                  {expandedId === ticket.id && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="space-y-4 mb-4">
                      <div className="bg-slate-50 rounded-lg p-3">
                        <p className="text-slate-600 text-sm">{ticket.description}</p>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm"><Mail className="w-4 h-4 text-slate-400" /><p className="text-slate-900">{ticket.customerEmail}</p></div>
                        <div className="flex items-center gap-2 text-sm"><Phone className="w-4 h-4 text-slate-400" /><p className="text-slate-900">{ticket.customerPhone}</p></div>
                        <div className="flex items-center gap-2 text-sm"><Clock className="w-4 h-4 text-slate-400" /><p className="text-slate-500">Created: {new Date(ticket.createdDate).toLocaleDateString()}</p></div>
                      </div>

                      {(ticketHistory[ticket.id]?.length > 0 || historyLoading[ticket.id]) && (
                        <div className="border border-slate-200 rounded-lg overflow-hidden">
                          <div className="px-3 py-2 bg-slate-50 border-b border-slate-200">
                            <p className="text-xs font-medium text-slate-600 uppercase tracking-wide">Conversation History</p>
                          </div>
                          {historyLoading[ticket.id] ? (
                            <div className="px-3 py-4 text-center"><Loader2 className="w-4 h-4 animate-spin mx-auto text-slate-400" /></div>
                          ) : (
                            <div className="max-h-48 overflow-y-auto divide-y divide-slate-100">
                              {ticketHistory[ticket.id].map((entry, idx) => (
                                <div key={entry.id || idx} className="px-3 py-2.5">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-medium text-slate-700">{entry.staff_id ? 'Staff' : 'System'}</span>
                                    <span className="text-xs text-slate-400">{new Date(entry.created_at).toLocaleString()}</span>
                                  </div>
                                  <p className="text-sm text-slate-600">{entry.message}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      <div className="space-y-2">
                        <label className="text-slate-700 text-sm">Reply to Customer</label>
                        <Textarea value={replyText[ticket.id] || ''} onChange={(e) => setReplyText({ ...replyText, [ticket.id]: e.target.value })} placeholder="Type your response here..." className="min-h-[80px]" />
                        <Button onClick={() => handleReply(ticket.id)} className="w-full bg-[#1A7FC1] hover:bg-[#166EA8] text-white">
                          <MessageSquare className="w-4 h-4 mr-2" /> Send Reply
                        </Button>
                      </div>

                      <div className="flex gap-2">
                        <Button onClick={() => handleStatusChange(ticket.id, 'resolved')} variant="outline" className="flex-1 border-green-200 text-green-600 hover:bg-green-50">
                          <CheckCircle className="w-4 h-4 mr-2" /> Resolve
                        </Button>
                        <Button onClick={() => handleStatusChange(ticket.id, 'closed')} variant="outline" className="flex-1">Close</Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {expandedId !== ticket.id && (
                  <p className="text-slate-400 text-xs mt-2">Last updated: {new Date(ticket.lastUpdated).toLocaleDateString()}</p>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Resolved Tickets */}
      {resolvedTickets.length > 0 && (
        <div>
          <h3 className="text-slate-900 font-medium mb-4">Resolved Tickets</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {resolvedTickets.map((ticket) => (
              <motion.div key={ticket.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="text-slate-900 font-medium">{ticket.customerName}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${getStatusColor(ticket.status)}`}>{ticket.status}</span>
                </div>
                <p className="text-slate-500 text-sm">{ticket.ticketNumber}</p>
                <p className="text-slate-900 text-sm mt-1">{ticket.subject}</p>
                <p className="text-slate-400 text-xs mt-2">Resolved on {new Date(ticket.lastUpdated).toLocaleDateString()}</p>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {filteredTickets.length === 0 && (
        <div className="text-center py-12">
          <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-400">{tickets.length === 0 ? 'No support tickets yet' : 'No tickets match the current filter'}</p>
        </div>
      )}
    </div>
  );
}
