import React, { useState, useEffect } from 'react';
import { Target, Plus, X, Edit, Trash, RefreshCw, AlertTriangle, Search, Filter } from 'lucide-react';
import { Card } from '../ui/card';
import { supabase } from '../../lib/supabase';
import { useSupabase } from '../../contexts/SupabaseContext';
import { QuestEditor } from './QuestEditor';
import { AdminLayout } from './AdminLayout';

export function QuestManager() {
  const [quests, setQuests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [selectedQuest, setSelectedQuest] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const { user } = useSupabase();

  // Check if user is admin
  const [isAdmin, setIsAdmin] = useState(false);
  
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) return;
      
      // For demo purposes, we'll consider specific users as admins
      const adminEmails = ['admin@healthrocket.app', 'clay@healthrocket.life', 'clay@healthrocket.app', 'derek@healthrocket.life'];
      setIsAdmin(adminEmails.includes(user.email || ''));
    };
    
    checkAdminStatus();
  }, [user]);

  const fetchQuests = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('quest_library')
        .select('*')
        .order('category')
        .order('tier')
        .order('name');
      
      if (error) throw error;
      
      setQuests(data || []);
    } catch (err) {
      console.error('Error fetching quests:', err);
      setError('Failed to load quests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchQuests();
    }
  }, [isAdmin]);

  const handleEditQuest = (id: string) => {
    setSelectedQuest(id);
    setShowEditor(true);
  };

  const handleCreateQuest = () => {
    setSelectedQuest(null);
    setShowEditor(true);
  };

  const handleDeleteQuest = async (id: string) => {
    if (!confirm('Are you sure you want to delete this quest?')) return;
    
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('quest_library')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      // Refresh quests list
      fetchQuests();
    } catch (err) {
      console.error('Error deleting quest:', err);
      setError('Failed to delete quest');
    } finally {
      setLoading(false);
    }
  };

  const filteredQuests = quests.filter(quest => {
    const matchesSearch = quest.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         quest.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || quest.category === categoryFilter;
    const matchesTier = tierFilter === 'all' || quest.tier.toString() === tierFilter;
    
    return matchesSearch && matchesCategory && matchesTier;
  });

  const categories = ['all', 'Mindset', 'Sleep', 'Exercise', 'Nutrition', 'Biohacking'];
  const tiers = ['all', '1', '2'];

  if (!isAdmin) {
    return (
      <AdminLayout title="Quest Management\" icon={<Target className="text-orange-500\" size={24} />}>
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
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Quest Management" icon={<Target className="text-orange-500\" size={24} />}>
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Target className="text-orange-500" size={20} />
            <h3 className="text-lg font-semibold text-white">Quests</h3>
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchQuests}
              className="flex items-center gap-1 px-2 py-1 text-xs text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600 rounded transition-colors"
            >
              <RefreshCw size={14} />
              <span>Refresh</span>
            </button>
            <button
              onClick={handleCreateQuest}
              className="flex items-center gap-2 px-3 py-1.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
            >
              <Plus size={16} />
              <span>Create Quest</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4 text-red-400 text-sm flex items-start gap-2">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search quests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          
          <div className="flex gap-2">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="pl-9 pr-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </option>
                ))}
              </select>
            </div>
            
            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              {tiers.map(tier => (
                <option key={tier} value={tier}>
                  {tier === 'all' ? 'All Tiers' : `Tier ${tier}`}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quests Table */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500" />
          </div>
        ) : filteredQuests.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Target className="mx-auto mb-2" size={24} />
            <p>No quests found</p>
            <p className="text-sm text-gray-500 mt-2">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="text-xs text-gray-400 uppercase">
                <tr>
                  <th className="px-4 py-2">ID</th>
                  <th className="px-4 py-2">Name</th>
                  <th className="px-4 py-2">Category</th>
                  <th className="px-4 py-2">Tier</th>
                  <th className="px-4 py-2">Duration</th>
                  <th className="px-4 py-2">FP</th>
                  <th className="px-4 py-2">Challenges</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filteredQuests.map((quest) => (
                  <tr key={quest.id} className="hover:bg-gray-700/50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-300">{quest.id}</td>
                    <td className="px-4 py-3 font-medium text-white">{quest.name}</td>
                    <td className="px-4 py-3 text-gray-300">{quest.category}</td>
                    <td className="px-4 py-3 text-gray-300">{quest.tier}</td>
                    <td className="px-4 py-3 text-gray-300">{quest.duration} days</td>
                    <td className="px-4 py-3 text-orange-500">+{quest.fuel_points}</td>
                    <td className="px-4 py-3 text-gray-300">{quest.challenge_ids?.length || 0}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        quest.is_active 
                          ? 'bg-lime-500/20 text-lime-500' 
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {quest.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditQuest(quest.id)}
                          className="p-1 text-gray-400 hover:text-white rounded"
                          title="Edit Quest"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteQuest(quest.id)}
                          className="p-1 text-gray-400 hover:text-red-400 rounded"
                          title="Delete Quest"
                        >
                          <Trash size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {showEditor && (
        <QuestEditor
          questId={selectedQuest}
          onClose={() => setShowEditor(false)}
          onSave={fetchQuests}
        />
      )}
    </AdminLayout>
  );
}