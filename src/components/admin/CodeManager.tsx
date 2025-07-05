import { useState, useEffect } from 'react';
import { Ticket, Plus, X, Check, AlertTriangle, RefreshCw, Calendar, Clipboard, Zap } from 'lucide-react';
import { Card } from '../ui/card';
import { supabase } from '../../lib/supabase';
import { useSupabase } from '../../contexts/SupabaseContext';

interface CodeBase {
  id: string;
  created_at: string;
  is_active: boolean;
  promotion: string | null;
}

interface LaunchCode extends CodeBase {
  code: string;
  max_uses: number;
  uses_count: number;
  type: 'launch';
}

interface BoostCode extends CodeBase {
  boost_code: string;
  fp_amount: number;
  type: 'boost';
}

type Code = LaunchCode | BoostCode;

export function CodeManager() {
  const [codes, setCodes] = useState<Code[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [redemptions, setRedemptions] = useState<any[]>([]);
  const [showRedemptions, setShowRedemptions] = useState(false);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [codeType, setCodeType] = useState<'launch' | 'boost'>('launch');
  const [newCode, setNewCode] = useState('');
  const [maxUses, setMaxUses] = useState(10);
  const [fpAmount, setFpAmount] = useState(10);
  const [promotion, setPromotion] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'launch' | 'boost'>('launch');
  const { user } = useSupabase();

  // Check if user is admin
  const [isAdmin, setIsAdmin] = useState(false);
  
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) return;
      
      // For demo purposes, we'll consider specific users as admins
      // In a real app, you'd check against a proper admin role
      const adminEmails = ['admin@healthrocket.app', 'clay@healthrocket.life', 'clay@healthrocket.app', 'derek@healthrocket.life'];
      setIsAdmin(adminEmails.includes(user.email || ''));
    };
    
    checkAdminStatus();
  }, [user]);

  const fetchCodes = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch launch codes
      const { data: launchCodesData, error: launchCodesError } = await supabase
        .from('launch_codes')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (launchCodesError) throw launchCodesError;
      
      // Fetch boost codes
      const { data: boostCodesData, error: boostCodesError } = await supabase
        .from('boost_codes')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (boostCodesError) throw boostCodesError;
      
      // Transform launch codes
      const launchCodes: LaunchCode[] = (launchCodesData || []).map(code => ({
        ...code,
        type: 'launch'
      }));
      
      // Transform boost codes
      const boostCodes: BoostCode[] = (boostCodesData || []).map(code => ({
        ...code,
        type: 'boost'
      }));
      
      // Combine all codes
      setCodes([...launchCodes, ...boostCodes]);
    } catch (err) {
      console.error('Error fetching codes:', err);
      setError('Failed to load codes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchCodes();
    }
  }, [isAdmin]);

  const handleCreateCode = async () => {
    try {
      setFormLoading(true);
      setFormError(null);
      
      if (!newCode.trim()) {
        setFormError('Code is required');
        return;
      }
      
      if (codeType === 'launch') {
        if (maxUses <= 0) {
          setFormError('Maximum uses must be greater than 0');
          return;
        }
        
        const { data, error } = await supabase
          .from('launch_codes')
          .insert({
            code: newCode.toUpperCase(),
            max_uses: maxUses,
            promotion: promotion || null,
            is_active: true
          })
          .select()
          .single();
        
        if (error) {
          if (error.code === '23505') { // Unique violation
            throw new Error('This launch code already exists');
          }
          throw error;
        }
        
        setCodes(prevCodes => [{...data, type: 'launch'}, ...prevCodes]);
      } else {
        if (fpAmount <= 0) {
          setFormError('FP amount must be greater than 0');
          return;
        }
        
        const { data, error } = await supabase
          .from('boost_codes')
          .insert({
            boost_code: newCode.toUpperCase(),
            fp_amount: fpAmount,
            promotion: promotion || null,
            is_active: true
          })
          .select()
          .single();
        
        if (error) {
          if (error.code === '23505') { // Unique violation
            throw new Error('This boost code already exists');
          }
          throw error;
        }
        
        setCodes(prevCodes => [{...data, type: 'boost'}, ...prevCodes]);
      }
      
      setShowCreateForm(false);
      setNewCode('');
      setMaxUses(10);
      setFpAmount(10);
      setPromotion('');
    } catch (err) {
      console.error('Error creating code:', err);
      setFormError(err instanceof Error ? err.message : 'Failed to create code');
    } finally {
      setFormLoading(false);
    }
  };

  const fetchRedemptions = async (boostCodeId: string) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('boost_code_redemptions')
        .select('*, users(name)')
        .eq('boost_code_id', boostCodeId)
        .order('redeemed_at', { ascending: false });
      
      if (error) throw error;
      
      setRedemptions(data || []);
      setSelectedCode(boostCodeId);
      setShowRedemptions(true);
    } catch (err) {
      console.error('Error fetching redemptions:', err);
      setError('Failed to load redemptions');
    } finally {
      setLoading(false);
    }
  };

  const toggleCodeStatus = async (id: string, currentStatus: boolean, type: 'launch' | 'boost') => {
    try {
      const table = type === 'launch' ? 'launch_codes' : 'boost_codes';
      
      const { error } = await supabase
        .from(table)
        .update({ is_active: !currentStatus })
        .eq('id', id);
      
      if (error) throw error;
      
      setCodes(codes.map(code => 
        code.id === id ? { ...code, is_active: !currentStatus } : code
      ));
    } catch (err) {
      console.error('Error toggling code status:', err);
      setError('Failed to update code');
    }
  };

  const copyToClipboard = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  const getFilteredCodes = () => {
    return codes.filter(code => 
      activeTab === 'launch' ? code.type === 'launch' : code.type === 'boost'
    );
  };

  if (!isAdmin) {
    return (
      <Card className="p-4">
        <div className="flex flex-col items-center justify-center gap-2 text-gray-400 p-8">
          <AlertTriangle size={32} className="text-orange-500 mb-2" />
          <h3 className="text-xl font-bold text-white">Admin Access Required</h3>
          <p className="text-gray-300 text-center mt-2">
            You need administrator privileges to access this page. Please contact support if you believe this is an error.
          </p>
          <button
            onClick={() => window.location.href = '/'}
            className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Ticket className="text-orange-500" size={20} />
          <h3 className="text-lg font-semibold text-white">Codes</h3>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchCodes}
            className="flex items-center gap-1 px-2 py-1 text-xs text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600 rounded transition-colors"
          >
            <RefreshCw size={14} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
          >
            <Plus size={16} />
            <span>Create Code</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4 text-red-400 text-sm flex items-start gap-2">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex mb-4 border-b border-gray-700">
        <button
          onClick={() => setActiveTab('launch')}
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === 'launch'
              ? 'text-orange-500 border-b-2 border-orange-500'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          Launch Codes
        </button>
        <button
          onClick={() => setActiveTab('boost')}
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === 'boost'
              ? 'text-orange-500 border-b-2 border-orange-500'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          Boost Codes
        </button>
      </div>

      {showCreateForm && (
        <div className="bg-gray-700/50 rounded-lg p-4 mb-4">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-white font-medium">Create New {activeTab === 'launch' ? 'Launch' : 'Boost'} Code</h4>
            <button
              onClick={() => setShowCreateForm(false)}
              className="text-gray-400 hover:text-gray-300"
            >
              <X size={16} />
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Code Type
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setCodeType('launch')}
                  className={`px-3 py-1.5 rounded-lg text-sm ${
                    codeType === 'launch'
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Launch Code
                </button>
                <button
                  type="button"
                  onClick={() => setCodeType('boost')}
                  className={`px-3 py-1.5 rounded-lg text-sm ${
                    codeType === 'boost'
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Boost Code
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                {codeType === 'launch' ? 'Launch Code' : 'Boost Code'}
              </label>
              <input
                type="text"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                placeholder={codeType === 'launch' ? "e.g. PREVIEW100" : "e.g. BOOST50"}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            
            {codeType === 'launch' ? (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Maximum Uses
                </label>
                <input
                  type="number"
                  value={maxUses}
                  onChange={(e) => setMaxUses(parseInt(e.target.value) || 0)}
                  min="1"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Fuel Points (FP) Amount
                </label>
                <input
                  type="number"
                  value={fpAmount}
                  onChange={(e) => setFpAmount(parseInt(e.target.value) || 0)}
                  min="1"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Promotion (Optional)
              </label>
              <input
                type="text"
                value={promotion}
                onChange={(e) => setPromotion(e.target.value)}
                placeholder="e.g. Preview Access"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            {formError && (
              <div className="text-sm text-red-400">{formError}</div>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowCreateForm(false)}
                className="px-3 py-1.5 text-gray-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCode}
                disabled={formLoading}
                className="px-3 py-1.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
              >
                {formLoading ? 'Creating...' : 'Create Code'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Redemptions Modal */}
      {showRedemptions && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h3 className="text-lg font-semibold text-white">Code Redemptions</h3>
              <button
                onClick={() => setShowRedemptions(false)}
                className="text-gray-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4">
              {redemptions.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <p>No redemptions found for this code</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="text-xs text-gray-400 uppercase">
                      <tr>
                        <th className="px-4 py-2">User</th>
                        <th className="px-4 py-2">Redeemed At</th>
                        <th className="px-4 py-2">FP Earned</th>
                        <th className="px-4 py-2">Boost Code</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {redemptions.map((redemption) => (
                        <tr key={redemption.id} className="hover:bg-gray-700/50">
                          <td className="px-4 py-3 text-white">
                            {redemption.user_name || redemption.users?.name || 'Unknown User'}
                          </td>
                          <td className="px-4 py-3 text-gray-300">
                            {new Date(redemption.redeemed_at).toLocaleString()}
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-orange-500">+{redemption.fp_earned} FP</span>
                          </td>
                          <td className="px-4 py-3 text-gray-300">
                            {redemption.boost_code_name || 'Unknown Code'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500" />
        </div>
      ) : getFilteredCodes().length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <Ticket className="mx-auto mb-2" size={24} />
          <p>No {activeTab === 'launch' ? 'launch' : 'boost'} codes found</p>
          <p className="text-sm text-gray-500 mt-2">Create your first code to get started</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="text-xs text-gray-400 uppercase">
              <tr>
                <th className="px-4 py-2">Code</th>
                {activeTab === 'launch' ? (
                  <th className="px-4 py-2">Uses</th>
                ) : (
                  <th className="px-4 py-2">FP Amount</th>
                )}
                <th className="px-4 py-2">Promotion</th>
                <th className="px-4 py-2">Created</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {getFilteredCodes().map((code) => {
                const isLaunchCode = code.type === 'launch';
                const codeText = isLaunchCode ? (code as LaunchCode).code : (code as BoostCode).boost_code;
                
                return (
                  <tr key={code.id} className="hover:bg-gray-700/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">{codeText}</span>
                        <button
                          onClick={() => copyToClipboard(codeText)}
                          className="text-gray-400 hover:text-white"
                          title="Copy code"
                        >
                          {copiedCode === codeText ? (
                            <Check size={14} className="text-lime-500" />
                          ) : (
                            <Clipboard size={14} />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {isLaunchCode ? (
                        <span className={(code as LaunchCode).uses_count >= (code as LaunchCode).max_uses ? 'text-red-400' : 'text-gray-300'}>
                          {(code as LaunchCode).uses_count} / {(code as LaunchCode).max_uses}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-orange-500">
                          <Zap size={14} />
                          <span>+{(code as BoostCode).fp_amount} FP</span>
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-300">
                      {code.promotion || '-'}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      <div className="flex items-center gap-1">
                        <Calendar size={12} />
                        <span>{new Date(code.created_at).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        code.is_active 
                          ? 'bg-lime-500/20 text-lime-500' 
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {code.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                     <span className="text-xs bg-gray-700 px-2 py-0.5 rounded text-gray-400">
                       {code.redemptions_count || 0} uses
                     </span>
                      <span className="text-xs bg-gray-700 px-2 py-0.5 rounded text-gray-400 cursor-pointer hover:bg-gray-600" onClick={() => fetchRedemptions(code.id)}>
                        View Uses
                      </span>
                      <button
                        onClick={() => toggleCodeStatus(code.id, code.is_active, code.type)}
                        className={`px-2 py-1 text-xs rounded ${
                          code.is_active
                            ? 'bg-gray-700 text-gray-300 hover:bg-red-500/20 hover:text-red-400'
                            : 'bg-gray-700 text-gray-300 hover:bg-lime-500/20 hover:text-lime-500'
                        }`}
                      >
                        {code.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}