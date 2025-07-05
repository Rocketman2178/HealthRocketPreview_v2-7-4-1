import React, { useState, useEffect } from 'react';
import { X, Save, Trash, Plus, Award, Target, Calendar, Zap } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useChallengeLibrary } from '../../hooks/useChallengeLibrary';

interface QuestEditorProps {
  questId?: string;
  onClose: () => void;
  onSave: () => void;
}

export function QuestEditor({ questId, onClose, onSave }: QuestEditorProps) {
  const [quest, setQuest] = useState({
    id: '',
    name: '',
    category: 'Sleep',
    tier: 1,
    duration: 90,
    description: '',
    expert_ids: [''],
    challenge_ids: [''],
    requirements: {
      challengesRequired: 2,
      dailyBoostsRequired: 45,
      prerequisites: []
    },
    verification_methods: [''],
    fuel_points: 150,
    is_active: true
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isNew, setIsNew] = useState(true);
  const { challenges } = useChallengeLibrary();

  // Fetch quest data if editing existing quest
  useEffect(() => {
    if (questId) {
      setIsNew(false);
      fetchQuest(questId);
    } else {
      setIsNew(true);
      // Generate a unique ID for new quests
      setQuest(prev => ({
        ...prev,
        id: `${prev.category.toLowerCase().substring(0, 1)}q${Math.floor(Math.random() * 10000)}`
      }));
    }
  }, [questId]);

  const fetchQuest = async (id: string) => {
    if (!id || id === 'undefined') {
      console.error('fetchQuest called with invalid id:', id);
      setError('Invalid quest ID provided');
      return;
    }
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('quest_library')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        setError('Quest not found');
        return;
      }
      setQuest(data);
    } catch (err) {
      console.error('Error fetching quest:', err);
      setError('Failed to load quest data');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setQuest(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleArrayChange = (index: number, field: string, value: string) => {
    setQuest(prev => {
      const newArray = [...prev[field as keyof typeof prev] as string[]];
      newArray[index] = value;
      return {
        ...prev,
        [field]: newArray
      };
    });
  };

  const handleRequirementChange = (key: string, value: any) => {
    setQuest(prev => ({
      ...prev,
      requirements: {
        ...prev.requirements,
        [key]: value
      }
    }));
  };

  const addArrayItem = (field: string) => {
    setQuest(prev => {
      const newArray = [...prev[field as keyof typeof prev] as string[]];
      newArray.push('');
      return {
        ...prev,
        [field]: newArray
      };
    });
  };

  const removeArrayItem = (field: string, index: number) => {
    setQuest(prev => {
      const newArray = [...prev[field as keyof typeof prev] as string[]];
      newArray.splice(index, 1);
      return {
        ...prev,
        [field]: newArray
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      
      // Validate required fields
      if (!quest.id || !quest.name || !quest.description) {
        setError('ID, name, and description are required');
        return;
      }
      
      // Format the data for database
      const formattedQuest = {
        ...quest,
        // Remove empty strings from arrays
        expert_ids: quest.expert_ids.filter(item => item.trim() !== ''),
        challenge_ids: quest.challenge_ids.filter(item => item.trim() !== ''),
        verification_methods: quest.verification_methods.filter(item => item.trim() !== '')
      };
      
      // Insert or update
      const { error } = await supabase
        .from('quest_library')
        .upsert(formattedQuest);
        
      if (error) throw error;
      
      setSuccess(true);
      setTimeout(() => {
        onSave();
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Error saving quest:', err);
      setError('Failed to save quest');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-gray-800 rounded-lg p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gray-800 z-10 p-4 border-b border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Target className="text-orange-500" size={24} />
            {isNew ? 'Create New Quest' : 'Edit Quest'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-300"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {success && (
            <div className="bg-lime-500/10 border border-lime-500/20 p-4 rounded-lg text-lime-500">
              Quest saved successfully!
            </div>
          )}
          
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-lg text-red-400">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Quest ID
                </label>
                <input
                  type="text"
                  name="id"
                  value={quest.id}
                  onChange={handleChange}
                  disabled={!isNew}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-60"
                  placeholder="e.g., sq1, mq2, etc."
                />
                {!isNew && (
                  <p className="text-xs text-gray-400 mt-1">Quest ID cannot be changed after creation</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Quest Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={quest.name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Quest Name"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Category
                  </label>
                  <select
                    name="category"
                    value={quest.category}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="Sleep">Sleep</option>
                    <option value="Mindset">Mindset</option>
                    <option value="Exercise">Exercise</option>
                    <option value="Nutrition">Nutrition</option>
                    <option value="Biohacking">Biohacking</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Tier
                  </label>
                  <select
                    name="tier"
                    value={quest.tier}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value={1}>Tier 1 (Basic)</option>
                    <option value={2}>Tier 2 (Advanced)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Duration (Days)
                  </label>
                  <input
                    type="number"
                    name="duration"
                    value={quest.duration}
                    onChange={handleChange}
                    min={1}
                    max={180}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Fuel Points
                  </label>
                  <input
                    type="number"
                    name="fuel_points"
                    value={quest.fuel_points}
                    onChange={handleChange}
                    min={1}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Status
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    name="is_active"
                    checked={quest.is_active}
                    onChange={(e) => setQuest(prev => ({ ...prev, is_active: e.target.checked }))}
                    className="rounded border-gray-600 text-orange-500 focus:ring-orange-500"
                  />
                  <label htmlFor="is_active" className="text-sm text-gray-300">
                    Active
                  </label>
                </div>
              </div>
            </div>

            {/* Description and Requirements */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={quest.description}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                  placeholder="Detailed description of the quest"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Challenges Required
                  </label>
                  <input
                    type="number"
                    value={quest.requirements.challengesRequired}
                    onChange={(e) => handleRequirementChange('challengesRequired', parseInt(e.target.value))}
                    min={1}
                    max={3}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Daily Boosts Required
                  </label>
                  <input
                    type="number"
                    value={quest.requirements.dailyBoostsRequired}
                    onChange={(e) => handleRequirementChange('dailyBoostsRequired', parseInt(e.target.value))}
                    min={1}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Expert IDs */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-medium text-white flex items-center gap-2">
                <Award className="text-orange-500" size={20} />
                <span>Expert IDs</span>
              </h3>
              <button
                type="button"
                onClick={() => addArrayItem('expert_ids')}
                className="text-sm text-orange-500 hover:text-orange-400 flex items-center gap-1"
              >
                <Plus size={14} />
                <span>Add Expert</span>
              </button>
            </div>
            <div className="space-y-2 bg-gray-700/30 p-4 rounded-lg">
              {quest.expert_ids.map((expertId, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={expertId}
                    onChange={(e) => handleArrayChange(index, 'expert_ids', e.target.value)}
                    className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Expert ID (e.g., walker, huberman, etc.)"
                  />
                  <button
                    type="button"
                    onClick={() => removeArrayItem('expert_ids', index)}
                    className="text-gray-400 hover:text-red-400"
                  >
                    <Trash size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Challenge IDs */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-medium text-white flex items-center gap-2">
                <Target className="text-orange-500" size={20} />
                <span>Challenge IDs</span>
              </h3>
              <button
                type="button"
                onClick={() => addArrayItem('challenge_ids')}
                className="text-sm text-orange-500 hover:text-orange-400 flex items-center gap-1"
              >
                <Plus size={14} />
                <span>Add Challenge</span>
              </button>
            </div>
            <div className="space-y-2 bg-gray-700/30 p-4 rounded-lg">
              {quest.challenge_ids.map((challengeId, index) => (
                <div key={index} className="flex items-center gap-2">
                  <select
                    value={challengeId}
                    onChange={(e) => handleArrayChange(index, 'challenge_ids', e.target.value)}
                    className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">Select a challenge</option>
                    {challenges
                      .filter(c => c.category === quest.category)
                      .map(challenge => (
                        <option key={challenge.id} value={challenge.id}>
                          {challenge.name} ({challenge.id})
                        </option>
                      ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => removeArrayItem('challenge_ids', index)}
                    className="text-gray-400 hover:text-red-400"
                  >
                    <Trash size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Verification Methods */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-medium text-white flex items-center gap-2">
                <Target className="text-orange-500" size={20} />
                <span>Verification Methods</span>
              </h3>
              <button
                type="button"
                onClick={() => addArrayItem('verification_methods')}
                className="text-sm text-orange-500 hover:text-orange-400 flex items-center gap-1"
              >
                <Plus size={14} />
                <span>Add Method</span>
              </button>
            </div>
            <div className="space-y-2 bg-gray-700/30 p-4 rounded-lg">
              {quest.verification_methods.map((method, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={method}
                    onChange={(e) => handleArrayChange(index, 'verification_methods', e.target.value)}
                    className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Verification method"
                  />
                  <button
                    type="button"
                    onClick={() => removeArrayItem('verification_methods', index)}
                    className="text-gray-400 hover:text-red-400"
                  >
                    <Trash size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span>Save Quest</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}