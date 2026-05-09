import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search, Filter, UserPlus, ShieldCheck, Edit, Trash2, Power, User, Clock, Loader2, Package } from 'lucide-react';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import api from '../../utils/api';
import { getDealers } from '../../services/ownerService';
import { getProviderWarrantyCodes } from '../../services/warrantyCodeService';

export function ActivityLogs() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchActivityLogs();
  }, []);

  const fetchActivityLogs = async () => {
    setIsLoading(true);
    try {
      // Fetch all data sources in parallel
      const [dealersRes, codesRes, customersRes] = await Promise.allSettled([
        getDealers(),
        getProviderWarrantyCodes(),
        api.get('/e-warranty/warranty-customer/get-registered-customers')
      ]);

      const activityLogs = [];
      let logId = 1;

      // Process dealer activities
      if (dealersRes.status === 'fulfilled') {
        const dealersData = dealersRes.value?.data?.dealers || dealersRes.value?.data || [];
        const dealers = Array.isArray(dealersData) ? dealersData : [];

        dealers.forEach(dealer => {
          const dealerName = dealer.name || dealer.shop_name || 'Unknown Dealer';
          const dealerEmail = dealer.email || '';
          const dealerPhone = dealer.phone_number || '';

          // Dealer creation activity
          if (dealer.created_at) {
            activityLogs.push({
              id: String(logId++),
              type: 'dealer_added',
              action: 'Dealer Added',
              description: `New dealer "${dealerName}" added to network`,
              user: 'Owner',
              timestamp: dealer.created_at,
              details: [dealerEmail && `Email: ${dealerEmail}`, dealerPhone && `Phone: ${dealerPhone}`].filter(Boolean).join(', ') || undefined,
            });
          }

          // Dealer update activity
          if (dealer.updated_at && dealer.updated_at !== dealer.created_at) {
            activityLogs.push({
              id: String(logId++),
              type: 'dealer_edited',
              action: 'Dealer Updated',
              description: `Dealer "${dealerName}" information updated`,
              user: 'Owner',
              timestamp: dealer.updated_at,
            });
          }

          // Dealer activation/deactivation
          if (dealer.is_active === false) {
            activityLogs.push({
              id: String(logId++),
              type: 'dealer_deactivated',
              action: 'Dealer Deactivated',
              description: `Dealer "${dealerName}" deactivated`,
              user: 'Owner',
              timestamp: dealer.updated_at || dealer.created_at,
            });
          }
        });
      }

      // Process warranty code activities
      if (codesRes.status === 'fulfilled') {
        const codesData = codesRes.value?.data?.warranty_codes || codesRes.value?.data || [];
        const codes = Array.isArray(codesData) ? codesData : [];

        // Group codes by batch (same created_at timestamp within 1 second range)
        const batchMap = {};
        codes.forEach(code => {
          if (!code.created_at) return;
          // Round to nearest minute to group batch uploads
          const batchKey = new Date(code.created_at).toISOString().substring(0, 16);
          if (!batchMap[batchKey]) {
            batchMap[batchKey] = { count: 0, timestamp: code.created_at, productName: code.product_name };
          }
          batchMap[batchKey].count++;
        });

        Object.entries(batchMap).forEach(([, batch]) => {
          activityLogs.push({
            id: String(logId++),
            type: 'warranty_created',
            action: batch.count > 1 ? 'Warranty Codes Generated' : 'Warranty Code Created',
            description: `${batch.count} warranty code${batch.count > 1 ? 's' : ''} generated${batch.productName ? ` for ${batch.productName}` : ''}`,
            user: 'Owner',
            timestamp: batch.timestamp,
            details: `Batch of ${batch.count} codes`,
          });
        });
      }

      // Process customer registration activities
      if (customersRes.status === 'fulfilled') {
        const custData = customersRes.value?.data?.data?.registered_customers || customersRes.value?.data?.data || [];
        const customers = Array.isArray(custData) ? custData : [];

        customers.forEach(customer => {
          const customerName = `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || 'Customer';
          const productName = customer.product_name || customer.provider_warranty_code?.product_name || 'Product';
          const dealerName = customer.dealer?.name || customer.dealership_installer_name || '';

          if (customer.created_at) {
            activityLogs.push({
              id: String(logId++),
              type: 'customer_registered',
              action: 'Customer Registered',
              description: `Customer "${customerName}" registered warranty${dealerName ? ` by ${dealerName}` : ''}`,
              user: dealerName || 'Direct Registration',
              timestamp: customer.created_at,
              details: `Product: ${productName}${customer.warranty_code ? `, Code: ${customer.warranty_code}` : ''}`,
            });
          }

          // Check if warranty was approved (is_active = true and updated_at differs)
          if (customer.is_active && customer.updated_at && customer.updated_at !== customer.created_at) {
            activityLogs.push({
              id: String(logId++),
              type: 'warranty_approved',
              action: 'Warranty Approved',
              description: `Warranty for "${customerName}" approved`,
              user: 'Owner',
              timestamp: customer.updated_at,
              details: `Product: ${productName}`,
            });
          }
        });
      }

      // Sort all logs by timestamp (most recent first)
      activityLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      setLogs(activityLogs);
    } catch (error) {
      console.warn('Error fetching activity logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'dealer_added':
        return <UserPlus className="w-5 h-5 text-green-600" />;
      case 'dealer_edited':
        return <Edit className="w-5 h-5 text-blue-600" />;
      case 'dealer_deleted':
        return <Trash2 className="w-5 h-5 text-red-600" />;
      case 'dealer_activated':
        return <Power className="w-5 h-5 text-green-600" />;
      case 'dealer_deactivated':
        return <Power className="w-5 h-5 text-slate-400" />;
      case 'warranty_created':
        return <ShieldCheck className="w-5 h-5 text-purple-600" />;
      case 'warranty_approved':
        return <ShieldCheck className="w-5 h-5 text-green-600" />;
      case 'customer_registered':
        return <User className="w-5 h-5 text-cyan-600" />;
      default:
        return <Clock className="w-5 h-5 text-slate-400" />;
    }
  };

  const getActivityBg = (type) => {
    switch (type) {
      case 'dealer_added':
      case 'dealer_activated':
      case 'warranty_approved':
        return 'bg-green-100';
      case 'dealer_edited':
        return 'bg-blue-100';
      case 'dealer_deleted':
        return 'bg-red-100';
      case 'dealer_deactivated':
        return 'bg-slate-100';
      case 'warranty_created':
        return 'bg-purple-100';
      case 'customer_registered':
        return 'bg-cyan-100';
      default:
        return 'bg-slate-100';
    }
  };

  const getTimeAgo = (timestamp) => {
    const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
    
    if (seconds < 0) return 'Just now';
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.user.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filterType === 'all' || log.type.includes(filterType);
    
    return matchesSearch && matchesFilter;
  });

  const todayLogs = logs.filter(l => new Date(l.timestamp).toDateString() === new Date().toDateString()).length;
  const weekLogs = logs.filter(l => (Date.now() - new Date(l.timestamp).getTime()) < 7 * 24 * 60 * 60 * 1000).length;

  if (isLoading) {
    return (
      <div className="p-4 lg:p-6 flex items-center justify-center min-h-[200px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto" />
          <p className="mt-4 text-slate-600">Loading activity logs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Search and Filter */}
        <div className="bg-white rounded-2xl p-4 shadow-md space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search activities..."
              className="pl-10"
            />
          </div>
          
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none z-10" />
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="pl-10">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Activities</SelectItem>
                <SelectItem value="dealer">Dealer Activities</SelectItem>
                <SelectItem value="warranty">Warranty Activities</SelectItem>
                <SelectItem value="customer">Customer Activities</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-4 shadow-md text-center">
            <p className="text-slate-500 text-sm mb-1">Today</p>
            <p className="text-slate-900 text-2xl">{todayLogs}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-md text-center">
            <p className="text-slate-500 text-sm mb-1">This Week</p>
            <p className="text-purple-600 text-2xl">{weekLogs}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-md text-center">
            <p className="text-slate-500 text-sm mb-1">Total</p>
            <p className="text-slate-900 text-2xl">{logs.length}</p>
          </div>
        </div>

        {/* Activity Timeline */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredLogs.map((log, index) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.03 }}
              className="bg-white rounded-2xl p-5 shadow-md"
            >
              <div className="flex gap-4">
                <div className={`w-12 h-12 rounded-xl ${getActivityBg(log.type)} flex items-center justify-center flex-shrink-0`}>
                  {getActivityIcon(log.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="text-slate-900">{log.action}</h3>
                    <span className="text-slate-400 text-xs flex items-center gap-1 flex-shrink-0 ml-2">
                      <Clock className="w-3 h-3" />
                      {getTimeAgo(log.timestamp)}
                    </span>
                  </div>
                  
                  <p className="text-slate-600 text-sm mb-2">
                    {log.description}
                  </p>
                  
                  {log.details && (
                    <p className="text-slate-400 text-xs">
                      {log.details}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-2 mt-2 text-slate-500 text-xs">
                    <User className="w-3 h-3" />
                    {log.user}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}

          {filteredLogs.length === 0 && (
            <div className="col-span-full text-center py-12">
              <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-400">{logs.length === 0 ? 'No activity yet' : 'No activities match your search'}</p>
            </div>
          )}
        </div>

        {/* Table View */}
        {filteredLogs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-8 bg-white rounded-2xl shadow-md overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="text-slate-900 font-semibold">Activity Logs Table View</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Action</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Description</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Details</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">User</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLogs.map((log) => (
                    <tr key={`table-${log.id}`} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className={`w-8 h-8 rounded-lg ${getActivityBg(log.type)} flex items-center justify-center`}>
                          {getActivityIcon(log.type)}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-900 font-medium">{log.action}</td>
                      <td className="px-4 py-3 text-sm text-slate-600 max-w-xs truncate">{log.description}</td>
                      <td className="px-4 py-3 text-sm text-slate-400 max-w-xs truncate">{log.details || "—"}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {log.user}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-400">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {getTimeAgo(log.timestamp)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
