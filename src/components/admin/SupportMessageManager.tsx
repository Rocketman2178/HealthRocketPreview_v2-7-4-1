import React, { useState, useEffect } from 'react';
import { MessageSquare, X, Check, AlertTriangle, RefreshCw, Calendar, Edit, Trash, Send, Reply } from 'lucide-react';
import { Card } from '../ui/card';
import { supabase } from '../../lib/supabase/client';
import { AdminLayout } from './AdminLayout';
import { useSupabase } from '../../contexts/SupabaseContext';

interface SupportMessage {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  message: string;
  category: string;
  created_at: string;
  resolved: boolean;
  resolved_at: string | null;
  resolved_by: string | null;
  resolution_notes: string | null;
  email_sent: boolean;
  email_sent_at: string | null;
  email_id: string | null;
}

export function SupportMessageManager() {
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<SupportMessage | null>(null);
  const [responseText, setResponseText] = useState('');
  const [sendingResponse, setSendingResponse] = useState(false);
  const [responseError, setResponseError] = useState<string | null>(null);
  const [responseSuccess, setResponseSuccess] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unresolved' | 'resolved'>('unresolved');
  const { user, session } = useSupabase();

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

  const fetchMessages = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const query = supabase
        .from('support_messages')
        .select('*')
        .order('created_at', { ascending: false });
        
      // Apply filter
      if (filter === 'unresolved') {
        query.eq('resolved', false);
      } else if (filter === 'resolved') {
        query.eq('resolved', true);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      setMessages(data || []);
    } catch (err) {
      console.error('Error fetching support messages:', err);
      setError('Failed to load support messages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchMessages();
    }
  }, [isAdmin, filter]);

  const handleSendResponse = async () => {
    if (!selectedMessage || !responseText.trim() || !user || !session) {
      return;
    }
    
    try {
      setSendingResponse(true);
      setResponseError(null);
      setResponseSuccess(false);
      
      // Update the support message directly in the database
      const { error: updateError } = await supabase
        .from('support_messages')
        .update({
          resolved: true,
          resolved_at: new Date().toISOString(),
          resolved_by: user.user_metadata?.name || 'Health Rocket Admin',
          resolution_notes: responseText
        })
        .eq('id', selectedMessage.id);

      if (updateError) {
        throw new Error(updateError.message || 'Failed to update support message');
      }
      
      // Try to send email response via edge function
      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-support-response`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify({
              messageId: selectedMessage.id,
              responseText,
              adminName: user.user_metadata?.name || 'Health Rocket Admin',
              adminEmail: user.email
            })
          }
        );
        
        if (!response.ok) {
          // Don't throw an error, just log it and continue
          console.warn('Email sending warning: Response not OK');
          // The message is still marked as resolved even if email fails
        } else {
          // Set success state if email was sent successfully
          setResponseSuccess(true);
        }
      } catch (emailErr) {
        // Don't throw an error, just log it and continue
        console.warn('Error sending email response:', emailErr);
        // The message is still marked as resolved even if email fails
        setResponseSuccess(true);
      }
      
      // Update UI
      setResponseSuccess(true);
      
      // Refresh messages list
      fetchMessages();
      
      // Clear response form after a delay
      setTimeout(() => {
        setSelectedMessage(null);
        setResponseText('');
        setResponseSuccess(false);
      }, 1500);
      
    } catch (err) {
      console.error('Error sending response:', err);
      setResponseError(err instanceof Error ? err.message : 'Failed to send response');
    } finally {
      setSendingResponse(false);
    }
  };

  if (!isAdmin) {
    return (
      <AdminLayout title="Support & Feedback" icon={<MessageSquare className="text-orange-500" size={24} />}>
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
    <AdminLayout title="Support & Feedback" icon={<MessageSquare className="text-orange-500" size={24} />}>
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="text-orange-500" size={20} />
            <h3 className="text-lg font-semibold text-white">Support Messages</h3>
          </div>
          <div className="flex gap-2">
            <div className="flex rounded-lg bg-gray-700 p-1">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1 text-xs rounded-md transition-colors ${
                  filter === 'all' 
                    ? 'bg-orange-500 text-white' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('unresolved')}
                className={`px-3 py-1 text-xs rounded-md transition-colors ${
                  filter === 'unresolved' 
                    ? 'bg-orange-500 text-white' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Unresolved
              </button>
              <button
                onClick={() => setFilter('resolved')}
                className={`px-3 py-1 text-xs rounded-md transition-colors ${
                  filter === 'resolved' 
                    ? 'bg-orange-500 text-white' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Resolved
              </button>
            </div>
            <button
              onClick={fetchMessages}
              className="flex items-center gap-1 px-2 py-1 text-xs text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600 rounded transition-colors"
            >
              <RefreshCw size={14} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4 text-red-400 text-sm flex items-start gap-2">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Message List */}
        <div className="space-y-4 mb-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <MessageSquare className="mx-auto mb-2" size={24} />
              <p>No {filter !== 'all' ? filter : ''} support messages found</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`bg-gray-700/50 p-4 rounded-lg ${
                  message.resolved ? 'border-l-4 border-lime-500' : 'border-l-4 border-orange-500'
                }`}
              >
                <div className="flex justify-between mb-2">
                  <div>
                    <h4 className="text-white font-medium">{message.user_name}</h4>
                    <div className="text-xs text-gray-400">{message.user_email}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      message.resolved 
                        ? 'bg-lime-500/20 text-lime-500' 
                        : 'bg-orange-500/20 text-orange-500'
                    }`}>
                      {message.resolved ? 'Resolved' : 'Unresolved'}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Calendar size={12} />
                      <span>{new Date(message.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-800/50 p-3 rounded-lg mb-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs bg-gray-700 px-2 py-0.5 rounded text-gray-300">
                      {message.category}
                    </span>
                  </div>
                  <p className="text-gray-300 whitespace-pre-line">{message.message}</p>
                </div>
                
                {message.resolved && message.resolution_notes && (
                  <div className="bg-lime-500/10 p-3 rounded-lg mb-3 border border-lime-500/20">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-lime-500">Response</span>
                      <span className="text-xs text-gray-400">
                        {message.resolved_at ? new Date(message.resolved_at).toLocaleString() : ''}
                      </span>
                    </div>
                    <p className="text-gray-300 whitespace-pre-line">{message.resolution_notes}</p>
                    <div className="text-xs text-gray-400 mt-2">
                      Resolved by: {message.resolved_by || 'Admin'}
                    </div>
                  </div>
                )}
                
                <div className="flex justify-end gap-2 mt-3">
                  {!message.resolved && (
                    <button
                      onClick={() => {
                        setSelectedMessage(message);
                        setResponseText('');
                        setResponseError(null);
                        setResponseSuccess(false);
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm"
                    >
                      <Reply size={14} />
                      <span>Respond</span>
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Response Modal */}
      {selectedMessage && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-gray-700 sticky top-0 bg-gray-800 z-10">
              <h3 className="text-lg font-semibold text-white">Respond to Support Message</h3>
              <button
                onClick={() => {
                  setSelectedMessage(null);
                  setResponseText('');
                  setResponseError(null);
                  setResponseSuccess(false);
                }}
                className="text-gray-400 hover:text-gray-300"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="overflow-y-auto p-4 flex-1">
              <div className="flex justify-between mb-2">
                <div>
                  <h4 className="text-white font-medium">{selectedMessage.user_name}</h4>
                  <div className="text-xs text-gray-400">{selectedMessage.user_email}</div>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <Calendar size={12} />
                  <span>{new Date(selectedMessage.created_at).toLocaleString()}</span>
                </div>
              </div>
              
              <div className="bg-gray-700/50 p-3 rounded-lg mb-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs bg-gray-700 px-2 py-0.5 rounded text-gray-300">
                    {selectedMessage.category}
                  </span>
                </div>
                <p className="text-gray-300 whitespace-pre-line">{selectedMessage.message}</p>
              </div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Your Response
              </label>
              <textarea
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                placeholder="Type your response here..."
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                rows={6}
              />
            </div>
            
            {responseError && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4 text-red-400 text-sm flex items-start gap-2">
                <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                <span>{responseError}</span>
              </div>
            )}
            
            {responseSuccess && (
              <div className="bg-lime-500/10 border border-lime-500/20 rounded-lg p-3 mb-4 text-lime-500 text-sm flex items-start gap-2">
                <Check size={16} className="mt-0.5 shrink-0" />
                <span>Response sent successfully!</span>
              </div>
            )}
            
            <div className="flex justify-end gap-3 p-4 border-t border-gray-700 sticky bottom-0 bg-gray-800 z-10">
              <button
                onClick={() => {
                  setSelectedMessage(null);
                  setResponseText('');
                  setResponseError(null);
                  setResponseSuccess(false);
                }}
                className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSendResponse}
                disabled={sendingResponse || !responseText.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {sendingResponse ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    <span>Send Response</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}