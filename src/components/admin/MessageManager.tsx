import React, { useState, useEffect } from 'react';
import { MessageSquare, Plus, X, Check, AlertTriangle, RefreshCw, Calendar, Edit, Trash, ArrowLeft } from 'lucide-react';
import { Card } from '../ui/card';
import { supabase } from '../../lib/supabase';
import { useSupabase } from '../../contexts/SupabaseContext';
import { useNavigate } from 'react-router-dom';

interface PlayerMessage {
  id: string;
  title: string;
  content: string;
  action_text: string;
  action_target: string;
  priority: number;
  condition_type: string;
  condition_value: any;
  is_admin: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function MessageManager() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<PlayerMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingMessage, setEditingMessage] = useState<PlayerMessage | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
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

  const fetchMessages = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('player_messages')
        .select('*')
        .order('priority', { ascending: false });
      
      if (error) throw error;
      
      setMessages(data || []);
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchMessages();
    }
  }, [isAdmin]);

  const handleCreateOrUpdateMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setFormLoading(true);
      setFormError(null);
      
      const form = e.target as HTMLFormElement;
      const formData = new FormData(form);
      
      const messageData = {
        title: formData.get('title') as string,
        content: formData.get('content') as string,
        action_text: formData.get('action_text') as string,
        action_target: formData.get('action_target') as string,
        priority: parseInt(formData.get('priority') as string),
        condition_type: formData.get('condition_type') as string,
        condition_value: formData.get('condition_value') 
          ? JSON.parse(formData.get('condition_value') as string) 
          : {},
        is_admin: true,
        is_active: formData.get('is_active') === 'on'
      };
      
      if (!messageData.title.trim() || !messageData.content.trim()) {
        setFormError('Title and content are required');
        return;
      }
      
      if (editingMessage) {
        // Update existing message
        const { error } = await supabase
          .from('player_messages')
          .update(messageData)
          .eq('id', editingMessage.id);
          
        if (error) throw error;
      } else {
        // Create new message
        const { error } = await supabase
          .from('player_messages')
          .insert(messageData);
          
        if (error) throw error;
      }
      
      // Refresh messages
      await fetchMessages();
      
      // Reset form
      setShowCreateForm(false);
      setEditingMessage(null);
      form.reset();
      
    } catch (err) {
      console.error('Error saving message:', err);
      setFormError(err instanceof Error ? err.message : 'Failed to save message');
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('player_messages')
        .update({ is_active: !currentStatus })
        .eq('id', id);
      
      if (error) throw error;
      
      // Update local state
      setMessages(messages.map(msg => 
        msg.id === id ? { ...msg, is_active: !currentStatus } : msg
      ));
    } catch (err) {
      console.error('Error toggling message status:', err);
      setError('Failed to update message');
    }
  };

  const handleDeleteMessage = async (id: string) => {
    if (!confirm('Are you sure you want to delete this message?')) return;
    
    try {
      const { error } = await supabase
        .from('player_messages')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // Update local state
      setMessages(messages.filter(msg => msg.id !== id));
    } catch (err) {
      console.error('Error deleting message:', err);
      setError('Failed to delete message');
    }
  };

  const handleEditMessage = (message: PlayerMessage) => {
    setEditingMessage(message);
    setShowCreateForm(true);
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
          <button
            onClick={() => navigate('/admin')}
            className="mr-2 text-gray-400 hover:text-white"
          >
            <ArrowLeft size={20} />
          </button>
          <MessageSquare className="text-orange-500" size={20} />
          <h3 className="text-lg font-semibold text-white">Player Messages</h3>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchMessages}
            className="flex items-center gap-1 px-2 py-1 text-xs text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600 rounded transition-colors"
          >
            <RefreshCw size={14} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => {
              setEditingMessage(null);
              setShowCreateForm(true);
            }}
            className="flex items-center gap-2 px-3 py-1.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
          >
            <Plus size={16} />
            <span>Create Message</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4 text-red-400 text-sm flex items-start gap-2">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {showCreateForm && (
        <div className="bg-gray-700/50 rounded-lg p-4 mb-4">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-white font-medium">{editingMessage ? 'Edit Message' : 'Create New Message'}</h4>
            <button
              onClick={() => {
                setShowCreateForm(false);
                setEditingMessage(null);
              }}
              className="text-gray-400 hover:text-gray-300"
            >
              <X size={16} />
            </button>
          </div>
          
          <form onSubmit={handleCreateOrUpdateMessage} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  name="title"
                  defaultValue={editingMessage?.title || ''}
                  placeholder="Message Title"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Action Target
                </label>
                <div className="relative">
                  <select
                    name="action_target"
                    defaultValue={editingMessage?.action_target || 'boosts'}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    id="action_target_select"
                  >
                    <option value="boosts">Boosts</option>
                    <option value="challenges">Challenges</option>
                    <option value="contests">Contests</option>
                    <option value="leaderboard">Leaderboard</option>
                    <option value="rocket">Health Metrics</option>
                    <option value="cosmo">Cosmo AI Guide</option>
                    <option value="profile">Profile</option>
                    <option value="connect-device">Connect Devices</option>
                    <option value="subscription">Subscription</option>
                    <option value="other">Other (Custom)</option>
                  </select>
                  
                  {/* Custom input for "other" option */}
                  <div id="custom_target_input" className="mt-2" style={{ display: 'none' }}>
                    <input
                      type="text"
                      id="custom_action_target_input"
                      name="custom_action_target"
                      placeholder="Enter custom target"
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Message Content
              </label>
              <textarea
                name="content"
                defaultValue={editingMessage?.content || ''}
                placeholder="Message content..."
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 h-20"
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Action Text
                </label>
                <input
                  type="text"
                  name="action_text"
                  defaultValue={editingMessage?.action_text || 'Go There'}
                  placeholder="Button Text"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Priority
                </label>
                <input
                  type="number"
                  name="priority"
                  defaultValue={editingMessage?.priority || 0}
                  min="0"
                  max="1000"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Condition Type
                </label>
                <div className="relative">
                  <select
                    name="condition_type"
                    defaultValue={editingMessage?.condition_type || 'admin'}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    id="condition_type_select"
                  >
                    <option value="admin">Admin Message</option>
                    <option value="no_boosts_today">No Boosts Today</option>
                    <option value="no_active_challenges">No Active Challenges</option>
                    <option value="no_active_contests">No Active Contests</option>
                    <option value="health_assessment_ready">Health Assessment Ready</option>
                    <option value="level_up">Level Up</option>
                    <option value="days_since_fp">Days Since FP</option>
                    <option value="burn_streak_milestone">Burn Streak Milestone</option>
                    <option value="new_user">New User</option>
                    <option value="always">Always Show</option>
                    <option value="other">Other (Custom)</option>
                  </select>
                  
                  {/* Custom input for "other" option */}
                  <div id="custom_condition_input" className="mt-2" style={{ display: 'none' }}>
                    <input
                      type="text"
                      id="custom_condition_type_input"
                      name="custom_condition_type"
                      placeholder="Enter custom condition type"
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Condition Value (JSON)
              </label>
              <input
                type="text"
                name="condition_value"
                defaultValue={editingMessage?.condition_value ? JSON.stringify(editingMessage.condition_value) : '{}'}
                placeholder="{}"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <p className="text-xs text-gray-400 mt-1">For level_up condition, use: {"{'level': 5}"}</p>
              <p className="text-xs text-gray-400 mt-1">For days_since_fp condition, use: {"{'days': 3}"}</p>
              <p className="text-xs text-gray-400 mt-1">For days_since_fp condition, use: {"{'days': 3}"}</p>
              <p className="text-xs text-gray-400 mt-1">For burn_streak_milestone condition, use: {"{'streak': 21}"}</p>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_active"
                name="is_active"
                defaultChecked={editingMessage?.is_active !== false}
                className="rounded border-gray-600 text-orange-500 focus:ring-orange-500"
              />
              <label htmlFor="is_active" className="ml-2 text-sm text-gray-300">
                Active
              </label>
            </div>

            {formError && (
              <div className="text-sm text-red-400">{formError}</div>
            )}

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setEditingMessage(null);
                }}
                className="px-3 py-1.5 text-gray-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={formLoading}
                className="px-3 py-1.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
              >
                {formLoading ? 'Saving...' : editingMessage ? 'Update Message' : 'Create Message'}
              </button>
            </div>
          </form>
        </div>
      )}
      
     {/* Add support as a valid action target */}
     <script dangerouslySetInnerHTML={{
       __html: `
         // Add support to the action target select options if not already there
         setTimeout(() => {
           const actionTargetSelect = document.getElementById('action_target_select');
           if (actionTargetSelect) {
             // Check if support option already exists
             let hasSupport = false;
             for (let i = 0; i < actionTargetSelect.options.length; i++) {
               if (actionTargetSelect.options[i].value === 'support') {
                 hasSupport = true;
                 break;
               }
             }
             
             // Add support option if it doesn't exist
             if (!hasSupport) {
               const supportOption = document.createElement('option');
               supportOption.value = 'support';
               supportOption.text = 'Support & Feedback';
               actionTargetSelect.add(supportOption, 7); // Add after Cosmo
             }
           }
         }, 100);
       `
     }} />
     
      {/* JavaScript to handle custom inputs */}
      <script dangerouslySetInnerHTML={{
        __html: `
          // Function to set up event listeners
          function setupCustomInputs() {
            setTimeout(() => {
              // Action target select
              const actionTargetSelect = document.getElementById('action_target_select');
              const customTargetInput = document.getElementById('custom_target_input');
              
              if (actionTargetSelect && customTargetInput) {
                actionTargetSelect.addEventListener('change', function() {
                  if (this.value === 'other') {
                    customTargetInput.style.display = 'block';
                  } else {
                    customTargetInput.style.display = 'none';
                  }
                });
                
                // Check initial value
                if (actionTargetSelect.value === 'other') {
                  customTargetInput.style.display = 'block';
                }
              }
              
              // Condition type select
              const conditionTypeSelect = document.getElementById('condition_type_select');
              const customConditionInput = document.getElementById('custom_condition_input');
              
              if (conditionTypeSelect && customConditionInput) {
                conditionTypeSelect.addEventListener('change', function() {
                  if (this.value === 'other') {
                    customConditionInput.style.display = 'block';
                  } else {
                    customConditionInput.style.display = 'none';
                  }
                });
                
                // Check initial value
                if (conditionTypeSelect.value === 'other') {
                  customConditionInput.style.display = 'block';
                }
              }
            }, 100);
          }
          
          // Set up on initial load
          document.addEventListener('DOMContentLoaded', setupCustomInputs);
          
          // Also set up when the form is shown
          if (document.readyState === 'complete') {
            setupCustomInputs();
          }
        `
      }} />

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500" />
        </div>
      ) : messages.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <MessageSquare className="mx-auto mb-2" size={24} />
          <p>No messages found</p>
          <p className="text-sm text-gray-500 mt-2">Create your first message to get started</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="text-xs text-gray-400 uppercase">
              <tr>
                <th className="px-4 py-2">Title</th>
                <th className="px-4 py-2">Condition</th>
                <th className="px-4 py-2">Priority</th>
                <th className="px-4 py-2">Created</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {messages.map((message) => (
                <tr key={message.id} className="hover:bg-gray-700/50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-white">{message.title}</div>
                    <div className="text-xs text-gray-400 mt-1">{message.content.substring(0, 50)}...</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-gray-700 px-2 py-1 rounded">
                      {message.condition_type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-300">
                    {message.priority}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    <div className="flex items-center gap-1">
                      <Calendar size={12} />
                      <span>{new Date(message.created_at).toLocaleDateString()}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      message.is_active 
                        ? 'bg-lime-500/20 text-lime-500' 
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {message.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditMessage(message)}
                        className="p-1 text-gray-400 hover:text-white rounded"
                        title="Edit Message"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleToggleActive(message.id, message.is_active)}
                        className={`p-1 rounded ${
                          message.is_active
                            ? 'text-lime-500 hover:text-lime-400'
                            : 'text-gray-500 hover:text-gray-400'
                        }`}
                        title={message.is_active ? 'Deactivate' : 'Activate'}
                      >
                        <Check size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteMessage(message.id)}
                        className="p-1 text-gray-400 hover:text-red-400 rounded"
                        title="Delete Message"
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
  );
}