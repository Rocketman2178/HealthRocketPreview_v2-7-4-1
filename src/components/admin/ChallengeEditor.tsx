import React, { useState, useEffect } from 'react';
import { X, Save, Trash, Plus, Award, Target, Calendar, Zap, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ChallengeEditorProps {
  challengeId?: string;
  onClose: () => void;
  onSave: () => void;
}

export function ChallengeEditor({ challengeId, onClose, onSave }: ChallengeEditorProps) {
  const [challenge, setChallenge] = useState({
    id: '',
    name: '',
    category: 'Sleep',
    tier: 1,
    duration: 21,
    description: '',
    expert_reference: '',
    learning_objectives: ['', '', ''],
    requirements: [{ description: '', verificationMethod: '' }],
    implementation_protocol: {
      week1: '',
      week2: '',
      week3: ''
    },
    success_metrics: ['', '', ''],
    expert_tips: ['', '', ''],
    fuel_points: 50,
    is_active: true
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isNew, setIsNew] = useState(true);

  // Fetch challenge data if editing existing challenge
  useEffect(() => {
    if (challengeId) {
      setIsNew(false);
      fetchChallenge(challengeId);
    } else {
      setIsNew(true);
      // Generate a unique ID for new challenges
      setChallenge(prev => ({
        ...prev,
        id: `${prev.category.toLowerCase().substring(0, 1)}c${Math.floor(Math.random() * 10000)}`
      }));
    }
  }, [challengeId]);

  const fetchChallenge = async (id: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('challenge_library')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setChallenge(data);
    } catch (err) {
      console.error('Error fetching challenge:', err);
      setError('Failed to load challenge data');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setChallenge(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleArrayChange = (index: number, field: string, value: string) => {
    setChallenge(prev => {
      const newArray = [...prev[field as keyof typeof prev] as string[]];
      newArray[index] = value;
      return {
        ...prev,
        [field]: newArray
      };
    });
  };

  const handleRequirementChange = (index: number, key: string, value: string) => {
    setChallenge(prev => {
      const newRequirements = [...prev.requirements];
      newRequirements[index] = {
        ...newRequirements[index],
        [key]: value
      };
      return {
        ...prev,
        requirements: newRequirements
      };
    });
  };

  const handleProtocolChange = (week: string, value: string) => {
    setChallenge(prev => ({
      ...prev,
      implementation_protocol: {
        ...prev.implementation_protocol,
        [week]: value
      }
    }));
  };

  const addArrayItem = (field: string) => {
    setChallenge(prev => {
      const newArray = [...prev[field as keyof typeof prev] as string[]];
      newArray.push('');
      return {
        ...prev,
        [field]: newArray
      };
    });
  };

  const removeArrayItem = (field: string, index: number) => {
    setChallenge(prev => {
      const newArray = [...prev[field as keyof typeof prev] as string[]];
      newArray.splice(index, 1);
      return {
        ...prev,
        [field]: newArray
      };
    });
  };

  const addRequirement = () => {
    setChallenge(prev => ({
      ...prev,
      requirements: [...prev.requirements, { description: '', verificationMethod: '' }]
    }));
  };

  const removeRequirement = (index: number) => {
    setChallenge(prev => {
      const newRequirements = [...prev.requirements];
      newRequirements.splice(index, 1);
      return {
        ...prev,
        requirements: newRequirements
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      
      // Validate required fields
      if (!challenge.id || !challenge.name || !challenge.description) {
        setError('ID, name, and description are required');
        return;
      }
      
      // Format the data for database
      const formattedChallenge = {
        ...challenge,
        // Remove empty strings from arrays
        learning_objectives: challenge.learning_objectives.filter(item => item.trim() !== ''),
        success_metrics: challenge.success_metrics.filter(item => item.trim() !== ''),
        expert_tips: challenge.expert_tips.filter(item => item.trim() !== ''),
        // Remove empty requirements
        requirements: challenge.requirements.filter(req => req.description.trim() !== '')
      };
      
      // Insert or update
      const { error } = await supabase
        .from('challenge_library')
        .upsert(formattedChallenge);
        
      if (error) throw error;
      
      setSuccess(true);
      setTimeout(() => {
        onSave();
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Error saving challenge:', err);
      setError('Failed to save challenge');
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
            {isNew ? 'Create New Challenge' : 'Edit Challenge'}
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
              Challenge saved successfully!
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
                  Challenge ID
                </label>
                <input
                  type="text"
                  name="id"
                  value={challenge.id}
                  onChange={handleChange}
                  disabled={!isNew}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-60"
                  placeholder="e.g., sc1, mc2, etc."
                />
                {!isNew && (
                  <p className="text-xs text-gray-400 mt-1">Challenge ID cannot be changed after creation</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Challenge Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={challenge.name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Challenge Name"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Category
                  </label>
                  <select
                    name="category"
                    value={challenge.category}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="Sleep">Sleep</option>
                    <option value="Mindset">Mindset</option>
                    <option value="Exercise">Exercise</option>
                    <option value="Nutrition">Nutrition</option>
                    <option value="Biohacking">Biohacking</option>
                    <option value="Bonus">Bonus</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Tier
                  </label>
                  <select
                    name="tier"
                    value={challenge.tier}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value={0}>Tier 0 (Starter)</option>
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
                    value={challenge.duration}
                    onChange={handleChange}
                    min={1}
                    max={90}
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
                    value={challenge.fuel_points}
                    onChange={handleChange}
                    min={1}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Expert Reference
                </label>
                <input
                  type="text"
                  name="expert_reference"
                  value={challenge.expert_reference}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="e.g., Dr. Andrew Huberman - Focus enhancement and neural state optimization"
                />
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
                    checked={challenge.is_active}
                    onChange={(e) => setChallenge(prev => ({ ...prev, is_active: e.target.checked }))}
                    className="rounded border-gray-600 text-orange-500 focus:ring-orange-500"
                  />
                  <label htmlFor="is_active" className="text-sm text-gray-300">
                    Active
                  </label>
                </div>
              </div>
            </div>

            {/* Description and Learning Objectives */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={challenge.description}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                  placeholder="Detailed description of the challenge"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-300">
                    Learning Objectives
                  </label>
                  <button
                    type="button"
                    onClick={() => addArrayItem('learning_objectives')}
                    className="text-xs text-orange-500 hover:text-orange-400 flex items-center gap-1"
                  >
                    <Plus size={12} />
                    <span>Add Objective</span>
                  </button>
                </div>
                <div className="space-y-2">
                  {challenge.learning_objectives.map((objective, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={objective}
                        onChange={(e) => handleArrayChange(index, 'learning_objectives', e.target.value)}
                        className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        placeholder={`Objective ${index + 1}`}
                      />
                      <button
                        type="button"
                        onClick={() => removeArrayItem('learning_objectives', index)}
                        className="text-gray-400 hover:text-red-400"
                      >
                        <Trash size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Requirements */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-medium text-white flex items-center gap-2">
                <CheckCircle2 className="text-orange-500" size={20} />
                <span>Requirements</span>
              </h3>
              <button
                type="button"
                onClick={addRequirement}
                className="text-sm text-orange-500 hover:text-orange-400 flex items-center gap-1"
              >
                <Plus size={14} />
                <span>Add Requirement</span>
              </button>
            </div>
            <div className="space-y-3 bg-gray-700/30 p-4 rounded-lg">
              {challenge.requirements.map((req, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-2">
                    <input
                      type="text"
                      value={req.description}
                      onChange={(e) => handleRequirementChange(index, 'description', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="Requirement description"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={req.verificationMethod}
                      onChange={(e) => handleRequirementChange(index, 'verificationMethod', e.target.value)}
                      className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="Verification method"
                    />
                    <button
                      type="button"
                      onClick={() => removeRequirement(index)}
                      className="text-gray-400 hover:text-red-400"
                    >
                      <Trash size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Implementation Protocol */}
          <div>
            <h3 className="text-lg font-medium text-white flex items-center gap-2 mb-2">
              <Calendar className="text-orange-500" size={20} />
              <span>Implementation Protocol</span>
            </h3>
            <div className="space-y-3 bg-gray-700/30 p-4 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Week 1
                </label>
                <textarea
                  value={challenge.implementation_protocol.week1}
                  onChange={(e) => handleProtocolChange('week1', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                  placeholder="Week 1 protocol"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Week 2
                </label>
                <textarea
                  value={challenge.implementation_protocol.week2}
                  onChange={(e) => handleProtocolChange('week2', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                  placeholder="Week 2 protocol"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Week 3
                </label>
                <textarea
                  value={challenge.implementation_protocol.week3}
                  onChange={(e) => handleProtocolChange('week3', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                  placeholder="Week 3 protocol"
                />
              </div>
            </div>
          </div>

          {/* Success Metrics */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-medium text-white flex items-center gap-2">
                <Target className="text-orange-500" size={20} />
                <span>Success Metrics</span>
              </h3>
              <button
                type="button"
                onClick={() => addArrayItem('success_metrics')}
                className="text-sm text-orange-500 hover:text-orange-400 flex items-center gap-1"
              >
                <Plus size={14} />
                <span>Add Metric</span>
              </button>
            </div>
            <div className="space-y-2 bg-gray-700/30 p-4 rounded-lg">
              {challenge.success_metrics.map((metric, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={metric}
                    onChange={(e) => handleArrayChange(index, 'success_metrics', e.target.value)}
                    className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder={`Success Metric ${index + 1}`}
                  />
                  <button
                    type="button"
                    onClick={() => removeArrayItem('success_metrics', index)}
                    className="text-gray-400 hover:text-red-400"
                  >
                    <Trash size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Expert Tips */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-medium text-white flex items-center gap-2">
                <Award className="text-orange-500" size={20} />
                <span>Expert Tips</span>
              </h3>
              <button
                type="button"
                onClick={() => addArrayItem('expert_tips')}
                className="text-sm text-orange-500 hover:text-orange-400 flex items-center gap-1"
              >
                <Plus size={14} />
                <span>Add Tip</span>
              </button>
            </div>
            <div className="space-y-2 bg-gray-700/30 p-4 rounded-lg">
              {challenge.expert_tips.map((tip, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={tip}
                    onChange={(e) => handleArrayChange(index, 'expert_tips', e.target.value)}
                    className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder={`Expert Tip ${index + 1}`}
                  />
                  <button
                    type="button"
                    onClick={() => removeArrayItem('expert_tips', index)}
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
                  <span>Save Challenge</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}