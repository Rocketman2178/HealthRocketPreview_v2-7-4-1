import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useSupabase } from '../../../contexts/SupabaseContext';
import { scrollToSection } from '../../../lib/utils';

interface PlayerMessage {
  id: string;
  title: string;
  content: string;
  action_text: string;
  action_target: string;
  priority: number;
}

export function PlayerMessages() {
  const [messages, setMessages] = useState<PlayerMessage[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [completedActions, setCompletedActions] = useState<Set<string>>(new Set());
  const { user } = useSupabase();
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Fetch active messages for the user
  useEffect(() => {
    if (!user) return;

    const fetchMessages = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase.rpc('get_active_player_messages', {
          p_user_id: user.id
        });

        if (error) throw error;
        setMessages(data || []);
      } catch (err) {
        console.error('Error fetching player messages:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [user]);

  // Handle message action
  const handleAction = (message: PlayerMessage) => {
    // Special handling for Cosmo AI Guide
    if (message.action_target === 'cosmo') {
      window.dispatchEvent(new CustomEvent('setActiveTab', { 
        detail: { tab: 'cosmo' } 
      }));
    }
    // Special handling for Health Dashboard
    else if (message.action_target === 'health-dashboard') {
      window.dispatchEvent(new CustomEvent('showHealthDashboard', {}));
    }
    // Special handling for Health Dashboard
    else if (message.action_target === 'health-dashboard') {
      // Dispatch an event to show the health dashboard
      window.dispatchEvent(new CustomEvent('showHealthDashboard', {}));
    }
   // Special handling for Support & Feedback form
   else if (message.action_target === 'support' || message.action_target === 'feedback') {
     // Set state to show the support form
     window.dispatchEvent(new CustomEvent('showSupportForm', {}));
   }
    // For other targets, navigate to the appropriate section
    else if (['boosts', 'challenges', 'contests'].includes(message.action_target)) {
      window.dispatchEvent(new CustomEvent('setActiveTab', { 
        detail: { tab: message.action_target } 
      }));
      
      // Add a small delay before scrolling to ensure the tab change has been processed
      // Increase the delay to ensure the tab change and any state updates have completed
      setTimeout(() => {
        scrollToSection(message.action_target);
      }, 300);
    } else {
      // For other targets, just scroll directly
      scrollToSection(message.action_target);
    }
    
    // Mark as completed but don't dismiss
    setCompletedActions(prev => new Set(prev).add(message.id));
  };

  // Dismiss a message
  const dismissMessage = async (messageId: string) => {
    if (!user) return;
    
    try {
      // Remove from UI immediately
      setMessages(prev => prev.filter(m => m.id !== messageId));
      
      // Calculate expiry (next day at midnight)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      // Record dismissal in database
      const { error } = await supabase
        .from('player_message_dismissals')
        .upsert({
          user_id: user.id,
          message_id: messageId,
          dismissed_at: new Date().toISOString(),
          expires_at: tomorrow.toISOString()
        });
        
      if (error) throw error;
    } catch (err) {
      console.error('Error dismissing message:', err);
    }
  };

  // Navigate to previous message
  const prevMessage = () => {
    setCurrentIndex(prev => (prev > 0 ? prev - 1 : prev));
  };

  // Navigate to next message
  const nextMessage = () => {
    setCurrentIndex(prev => (prev < messages.length - 1 ? prev + 1 : prev));
  };

  // If no messages or loading, don't render anything
  if (loading || messages.length === 0) {
    return null;
  }

  return (
    <div className="w-full max-w-full mt-1 mb-1">
      <div className="relative">
        {/* Messages container with horizontal scroll */}
        <div 
          ref={messagesContainerRef}
          className="overflow-hidden relative max-w-full"
        >
          <div className="flex transition-transform duration-300 ease-in-out"
               style={{ transform: `translateX(-${currentIndex * 100}%)` }}>
            {messages.map((message, index) => (
              <div 
                key={message.id}
                className="w-full flex-shrink-0 px-2"
              >
                <div className="bg-gray-800/70 border border-orange-500/20 rounded-lg p-2 shadow-lg">
                  <div className="flex justify-between items-start">
                    <h3 className="text-white font-medium text-xs">{message.title}</h3>
                    <div className="flex items-center">
                      {completedActions.has(message.id) && (
                        <span className="text-lime-500 mr-1">✓</span>
                      )}
                      <button
                        onClick={() => dismissMessage(message.id)}
                        className="text-gray-400 hover:text-gray-300 p-1"
                        aria-label="Dismiss message"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                  <p className="text-gray-300 text-[10px] mb-1 line-clamp-2">{message.content}</p>
                  
                  <div className="flex items-center justify-between mt-1">
                    <button
                      onClick={() => handleAction(message)}
                      className={`px-2 py-0.5 text-white text-[10px] rounded transition-colors flex items-center gap-1 ${
                        completedActions.has(message.id) 
                          ? 'bg-lime-500 hover:bg-lime-600' 
                          : 'bg-orange-500 hover:bg-orange-600'
                      }`}
                    >
                      {completedActions.has(message.id) && (
                        <span className="text-white">✓</span>
                      )}
                      {completedActions.has(message.id) ? 'Go There Again' : message.action_text}
                    </button>
                    
                    {/* Navigation dots moved next to action button */}
                    {messages.length > 1 && (
                      <div className="flex items-center gap-0.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            prevMessage();
                          }}
                          disabled={currentIndex === 0}
                          className={`p-1 rounded-full ${
                            currentIndex === 0 
                              ? 'text-gray-500 cursor-not-allowed' 
                              : 'text-orange-500 hover:bg-gray-700/50'
                          }`}
                          aria-label="Previous message"
                        >
                          <ChevronLeft size={16} />
                        </button>
                        
                        <span className="text-xs text-gray-400 font-medium">
                          {currentIndex + 1}/{messages.length}
                        </span>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            nextMessage();
                          }}
                          disabled={currentIndex === messages.length - 1}
                          className={`p-1 rounded-full ${
                            currentIndex === messages.length - 1 
                              ? 'text-gray-500 cursor-not-allowed' 
                              : 'text-orange-500 hover:bg-gray-700/50'
                          }`}
                          aria-label="Next message"
                        >
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}