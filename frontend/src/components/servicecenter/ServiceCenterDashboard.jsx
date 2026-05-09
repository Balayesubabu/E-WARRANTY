import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ClipboardCheck, Package, Wrench, CheckCircle2, RefreshCw, XCircle, Loader2, ArrowRight,
} from 'lucide-react';
import { getServiceCenterClaimStats } from '../../services/serviceCenterService';
import { toast } from 'sonner';

const CARD_CONFIG = [
  { key: 'assignedToServiceCenter', label: 'Assigned', icon: Package, color: 'bg-cyan-500' },
  { key: 'inProgress', label: 'In Progress', icon: Wrench, color: 'bg-violet-500' },
  { key: 'repaired', label: 'Repaired', icon: CheckCircle2, color: 'bg-emerald-500' },
  { key: 'replaced', label: 'Replaced', icon: RefreshCw, color: 'bg-teal-500' },
  { key: 'closed', label: 'Closed', icon: CheckCircle2, color: 'bg-slate-500' },
  { key: 'rejected', label: 'Rejected', icon: XCircle, color: 'bg-red-500' },
];

export function ServiceCenterDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await getServiceCenterClaimStats();
        setStats(res?.data ?? res ?? null);
      } catch (err) {
        toast.error(err?.response?.data?.message || 'Failed to load stats');
        setStats(null);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-12 h-12 animate-spin text-[#1A7FC1]" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
          <ClipboardCheck className="w-6 h-6 text-[#1A7FC1]" />
          Dashboard
        </h2>
        <p className="text-slate-500 text-sm mt-1">Overview of your assigned warranty claims</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {CARD_CONFIG.map(({ key, label, icon: Icon, color }) => (
          <div
            key={key}
            className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-center gap-4"
          >
            <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center text-white`}>
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-slate-900">{stats?.[key] ?? 0}</p>
              <p className="text-sm text-slate-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-slate-900">Assigned Claims</h3>
            <p className="text-sm text-slate-500 mt-0.5">View and manage your assigned warranty claims</p>
          </div>
          <button
            onClick={() => navigate('/service-center/claims')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1A7FC1] hover:bg-[#166EA8] text-white font-medium transition-colors"
          >
            View Claims <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
