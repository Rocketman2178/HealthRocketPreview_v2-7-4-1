import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Trophy, Target, ChevronRight, X } from 'lucide-react';
import { MessageCircle, ArrowLeft, Users, Clock, AlertTriangle, CheckCircle2, Reply } from "lucide-react";
import { getChatId, isContestChatId } from "../../lib/utils/chat"; 
import { ChatMessage } from "./ChatMessage";
import { ImageViewer } from "./ImageViewer";
import { MessageReactions } from "./MessageReactions";
import { ChatInput } from "./ChatInput";
import { ChatService } from "../../lib/chat/ChatService";
import { supabase } from "../../lib/supabase";
import type { ChatMessage as ChatMessageType } from "../../types/chat";
import type { LeaderboardEntry } from "../../types/community";
import { useSupabase } from "../../contexts/SupabaseContext";
import { ChallengePlayerList } from "./ChallengePlayerList";
import { PlayerProfileModal } from "../dashboard/rank/PlayerProfileModal";

interface Challenge {
  name: string;
  description: string;
  start_date: string;
  challenge_id: string;
}

export function ChatPage() {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const challengeId = chatId?.startsWith("c_")
    ? chatId.replace("c_", "")
    : chatId;
  const isContest = isContestChatId(challengeId);
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [playerCount, setPlayerCount] = useState<number>(0);
  const [verificationCount, setVerificationCount] = useState<number>(0);
  const [verificationsRequired, setVerificationsRequired] = useState<number>(8);
  const [showPlayerList, setShowPlayerList] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<LeaderboardEntry | null>(
    null
  );
  const [players, setPlayers] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isVerification, setIsVerification] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [sortedMessages, setSortedMessages] = useState<ChatMessageType[]>([]);
  const [joinDate, setJoinDate] = useState<Date | null>(null);
  const [contestStartDate, setContestStartDate] = useState<Date | null>(null);
  const [hasContestStarted, setHasContestStarted] = useState(true);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [daysUntilStart, setDaysUntilStart] = useState<number | null>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<ChatMessageType | null>(null);
  const messageSubscriptionRef = useRef<{ unsubscribe: () => void }>();
  const { user } = useSupabase();
  const retryTimeoutRef = useRef<NodeJS.Timeout>();
  const maxRetries = 3;
  const retryDelay = 2000; // 2 seconds

  // Redirect if not authenticated or missing challenge ID
  useEffect(() => {
    if (!loading && (!user || !challengeId)) { 
      console.warn("Redirecting to home: missing user or challenge ID"); 
      navigate("/");
      return;
    }
    
    // Redirect if not a contest chat
    if (!loading && !isContest) {
      console.warn("Redirecting to home: not a contest chat"); 
      navigate("/"); 
      return;
    }
  }, [user, loading, navigate, challengeId]);

  // Check if this is a contest and if it has started
  useEffect(() => {
    if (!challengeId) return;
    
    const checkContestStatus = async () => {
      // Check if this is a contest by checking if it starts with cn_ or tc_
      if (challengeId?.startsWith('cn_') || challengeId?.startsWith('tc_')) {
        // First get days info
        const { data: daysInfo, error: daysError } = await supabase.rpc(
          'get_contest_days_info',
          { p_challenge_id: challengeId }
        );
          
        if (!daysError && daysInfo?.success) {
          setDaysUntilStart(daysInfo.days_until_start);
          setHasContestStarted(daysInfo.has_started);
          if (daysInfo.start_date) {
            setContestStartDate(new Date(daysInfo.start_date));
          }
        }
        
        // Then get full contest details
        const { data: contestData, error: contestError } = await supabase.rpc(
          'get_contest_details',
          { p_challenge_id: challengeId }
        );
          
        if (!contestError && contestData?.success) {
          const startDate = new Date(contestData.start_date);
          setContestStartDate(startDate);
          // Use the more accurate days_until_start from above if available
          if (daysUntilStart === null) {
            const now = new Date();
            setHasContestStarted(startDate <= now);
            if (startDate > now) {
              const daysUntil = Math.ceil((startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
              setDaysUntilStart(daysUntil);
            }
          }
          setChallenge({
            name: contestData.name,
            description: contestData.description,
            start_date: contestData.start_date,
            challenge_id: contestData.challenge_id
          });
        }
      } else {
        // Not a contest, so it's always "started"
        setHasContestStarted(true);
      }
    };
    
    checkContestStatus();
  }, [challengeId]);

  // Cleanup retry timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      if (messageSubscriptionRef.current) {
        messageSubscriptionRef.current.unsubscribe();
      }
    };
  }, []);

  // Get user's join date for this challenge
  useEffect(() => {
    if (!challengeId || !user) return;

    const getJoinDate = async () => {
      try {
        const { data, error } = await supabase
          .from("challenges")
          .select("started_at")
          .eq("challenge_id", challengeId)
          .eq("user_id", user.id)
          .maybeSingle(); // Use maybeSingle() instead of single()

        if (error) throw error;

        // Only set the join date if we have data
        if (data?.started_at) {
          setJoinDate(new Date(data.started_at));
        }
      } catch (err) {
        console.error("Error getting join date:", err);
      }
    };

    getJoinDate();
  }, [challengeId, user]);

  // Fetch initial messages
  const fetchMessages = async (retryCount = 0) => {
    if (!challengeId || !user) return;

    try {
      setError(null);
      setLoading(true);

      // Get player count
      const { data: count, error: countError } = await supabase.rpc(
        "get_challenge_players_count",
        { p_challenge_id: challengeId }
      );

      if (countError) throw countError;
      setPlayerCount(count || 0);

      // Get verification count and requirements
      if (isContest) {
        const { data: contestData, error: contestError } = await supabase
          .from('active_contests')
          .select('verification_count, verifications_required')
          .eq('user_id', user.id)
          .eq('challenge_id', challengeId)
          .maybeSingle();

        if (!contestError && contestData) {
          setVerificationCount(contestData.verification_count || 0);
          setVerificationsRequired(contestData.verifications_required || 8);
        }
      }

      // Get messages
      const { data: messages, error } = await supabase.rpc(
        "get_challenge_messages",
        { p_chat_id: getChatId(challengeId) }
      );

      if (error) throw error;

      // Transform messages to match ChatMessage type
      let transformedMessages = [];
      
      if (messages && messages.length > 0) {
        transformedMessages = messages.map((msg) => {
          // Get reactions for this message
          const reactions = msg.reactions || [];
          
          return {
            id: msg.id,
            chatId: msg.chat_id || `c_${chatId}`,
            userId: msg.user_id || user.id,
            content: msg.content,
            mediaUrl: msg.media_url,
            mediaType: msg.media_type,
            isVerification: msg.is_verification,
            createdAt: new Date(msg.created_at),
            updatedAt: new Date(msg.updated_at),
            user_name: msg.user_name,
            user_avatar_url: msg.user_avatar_url,
            reactions: reactions
          };
        });
        
        // For contests, show all messages regardless of join date
        if (!isContest && joinDate) {
          const cutoffDate = new Date(joinDate);
          cutoffDate.setDate(cutoffDate.getDate() - 3);
          transformedMessages = transformedMessages.filter(msg => {
            const messageDate = new Date(msg.createdAt);
            return messageDate >= cutoffDate;
          });
        }
        
        // Sort messages by creation date (oldest first)
        transformedMessages.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      }

      setMessages(transformedMessages);
      setSortedMessages(transformedMessages);
      
      // Scroll to bottom after messages are loaded
      setTimeout(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
        }
      }, 100);
    } catch (err) {
      console.error("Error fetching messages:", err);
      setError(
        err instanceof Error ? err : new Error("Failed to fetch messages")
      );

      // Retry logic
      if (retryCount < maxRetries) {
        retryTimeoutRef.current = setTimeout(() => {
          fetchMessages(retryCount + 1);
        }, retryDelay * (retryCount + 1));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();

    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [chatId, user]);

  // Fetch players when player list is opened
  useEffect(() => {
    if (showPlayerList) {
      fetchPlayers();
    }
  }, [showPlayerList]);

  // Fetch players for the challenge or contest
  const fetchPlayers = async () => {
    if (!challengeId || !user) return;
    setLoading(true);

    try {
      // Check if this is a contest (starts with cn_ or tc_)
      const isContest = challengeId.startsWith('cn_') || challengeId.startsWith('tc_');
      
      if (isContest) {
        // For contests, use the get_contest_players function
        const { data: contestData, error: contestError } = await supabase.rpc(
          "get_contest_players",
          {
            p_challenge_id: challengeId
          }
        );

        if (contestError) throw contestError;

        if (contestData && contestData.length > 0) {
          // Map results to LeaderboardEntry format
          const mappedPlayers: LeaderboardEntry[] = contestData.map((player: any) => ({
            userId: player.user_id,
            name: player.name || 'Unknown Player',
            avatarUrl: player.avatar_url,
            level: player.level || 1,
            plan: player.plan || 'Free Plan',
            healthScore: player.health_score || 7.8,
            healthspanYears: player.healthspan_years || 0,
            createdAt: player.created_at || new Date().toISOString(),
            rank: 0,
            fuelPoints: 0,
            burnStreak: player.burn_streak || 0
          }));

          setPlayers(mappedPlayers);
        } else {
          // If no players found, at least include the current user
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('id, name, avatar_url, level, plan, health_score, healthspan_years, created_at, burn_streak')
            .eq('id', user.id)
            .single();

          if (!userError && userData) {
            setPlayers([{
              userId: userData.id,
              name: userData.name || 'You',
              avatarUrl: userData.avatar_url,
              level: userData.level || 1,
              plan: userData.plan || 'Free Plan',
              healthScore: userData.health_score || 7.8,
              healthspanYears: userData.healthspan_years || 0,
              createdAt: userData.created_at || new Date().toISOString(),
              rank: 0,
              fuelPoints: 0,
              burnStreak: userData.burn_streak || 0
            }]);
          }
        }
      } else {
        // For regular challenges, use the existing test_challenge_players function
        const { data: userData, error } = await supabase.rpc(
          "test_challenge_players",
          {
            p_challenge_id: challengeId,
          }
        );

        if (error) throw error;

        if (!userData?.length) {
          setPlayers([]);
          return;
        }

        // Map results to LeaderboardEntry format
        const mappedPlayers: LeaderboardEntry[] = userData.map((user: any) => ({
          userId: user.user_id,
          name: user.name,
          avatarUrl: user.avatar_url,
          level: user.level,
          plan: user.plan,
          healthScore: user.health_score || 7.8,
          healthspanYears: user.healthspan_years || 0,
          createdAt: user.created_at || new Date().toISOString(),
          rank: 0,
          fuelPoints: 0,
          burnStreak: user.burn_streak || 0
        }));

        setPlayers(mappedPlayers);
      }
    } catch (err) {
      console.error("Error fetching players:", err);
    } finally {
      setLoading(false);
    }
  };

  // Subscribe to new messages
  useEffect(() => {
    if (!user || !chatId) return;
    messageSubscriptionRef.current = ChatService.subscribeToMessages(
      `c_${chatId}`,
      (message) => {
        setMessages((prev) => [...prev, message]);
      }
    );

    return () => {
      if (messageSubscriptionRef.current) {
        messageSubscriptionRef.current.unsubscribe();
      }
    };
  }, [chatId, user]);

  // Update read status when window is focused
  useEffect(() => {
    if (!user || !chatId) return;

    const updateReadStatus = () => {
      ChatService.updateReadStatus(user.id, chatId);
    };

    // Update on mount and window focus
    updateReadStatus();
    window.addEventListener("focus", updateReadStatus);

    return () => {
      window.removeEventListener("focus", updateReadStatus);
    };
  }, [chatId, user]);

  // Scroll to bottom on new messages
  useEffect(() => {
    const scrollToBottom = () => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ 
          behavior: loading ? 'auto' : 'smooth', 
          block: 'end' 
        });
      }
    };

    scrollToBottom();
  }, [messages, loading]);

  // Update sorted messages when messages change
  useEffect(() => {
    // Sort messages by creation date (oldest first)
    const sorted = [...messages].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    setSortedMessages(sorted);
  }, [messages]);

  const handleSend = async (content: string, mediaFile?: File) => {
    if (!user || !chatId) return;

    const now = new Date();
    let optimisticMessage: ChatMessageType | null = null;
    
    try {
      // Create optimistic message
      optimisticMessage = {
        id: crypto.randomUUID(), 
        chatId: getChatId(challengeId),
        userId: user.id,
        content,
        isVerification,
        parentMessageId: replyingTo?.id,
        parentMessage: replyingTo ? {
          id: replyingTo.id,
          content: replyingTo.content,
          userId: replyingTo.userId,
          user_name: replyingTo.user_name,
          isVerification: replyingTo.isVerification,
          mediaUrl: replyingTo.mediaUrl,
          mediaType: replyingTo.mediaType
        } : undefined,
        createdAt: now,
        updatedAt: now,
        user_name: user.user_metadata?.name || user.email,
        user_avatar_url: user.user_metadata?.avatar_url,
        mediaUrl: undefined,
        mediaType: undefined,
      };

      setMessages((prev) => [...prev, optimisticMessage!]);
      let mediaUrl;
      let mediaType;

      if (mediaFile) {
        // Upload media file
        // Sanitize filename to remove invalid characters for Supabase Storage
        const sanitizedFileName = mediaFile.name
          .replace(/\s+/g, '-')  // Replace spaces with hyphens
          .replace(/[^a-zA-Z0-9.-]/g, '')  // Remove any characters that aren't alphanumeric, hyphens, or periods
          .toLowerCase();  // Convert to lowercase for consistency
        const path = `${user.id}/c_${chatId}/${Date.now()}_${sanitizedFileName}`;
        const { data: uploadData, error } = await ChatService.uploadMedia(
          path,
          mediaFile
        );
        if (error) throw error;
        mediaUrl = uploadData.publicUrl;
        mediaType = mediaFile.type.startsWith("image/") ? "image" : "video";
      }
      
      // Send message through ChatService
      await ChatService.sendMessage(
        user.id,
        content,
        getChatId(challengeId),
        isVerification,
        mediaUrl,
        mediaType,
        replyingTo?.id || null
      );

      // If this is a verification post, update the count
      if (isVerification) {
        setVerificationCount(prev => prev + 1);
      }

      // Update optimistic message with media info if needed
      if (mediaUrl) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === optimisticMessage!.id
              ? { ...msg, mediaUrl, mediaType }
              : msg
          )
        );
      }

      setIsVerification(false); // Reset verification flag after sending
      setReplyingTo(null); // Reset reply state
    } catch (err) {
      console.error("Error sending message:", err);
      // Remove optimistic message on error
      if (optimisticMessage) {
        setMessages((prev) => prev.filter((m) => m.id !== optimisticMessage!.id));
      }
    }
  };

  // Handle reply to message
  const handleReply = (message: ChatMessageType) => {
    setReplyingTo(message);
    // Focus the input field
    const inputElement = document.querySelector('textarea[placeholder="Type your message..."]') as HTMLTextAreaElement;
    if (inputElement) {
      inputElement.focus();
    }
  };

  const handleDelete = async (message: ChatMessageType) => {
    if (!user) return;
    try {
      await ChatService.deleteMessage(user.id, message.id);
      setMessages((prev) => prev.filter((m) => m.id !== message.id));
    } catch (err) {
      console.error("Error deleting message:", err);
    }
  };

  // If contest hasn't started, show a message and redirect
  if (!loading && !hasContestStarted && contestStartDate) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
        <div className="bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <div className="flex items-center gap-3">
              <Trophy className="text-orange-500\" size={24} />
              <h1 className="text-lg font-semibold text-white">{challenge?.name || "Contest Chat"}</h1>
            </div>
            <button
              onClick={() => navigate(`/challenge/${challengeId}`)}
              className="text-gray-400 hover:text-white"
            >
              <ArrowLeft size={20} />
            </button>
          </div>
          
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-orange-500/10 rounded-full flex items-center justify-center">
                  <Clock className="text-orange-500" size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Contest Starts Soon</h2>
                  <p className="text-sm text-gray-300">
                    {daysUntilStart !== null ? (
                      <>
                        Starting in <span className="text-orange-500 font-medium">{daysUntilStart} days</span> on <span className="text-orange-500 font-medium">{contestStartDate?.toLocaleDateString()}</span>
                      </>
                    ) : (
                      <>
                        Mark your calendar for <span className="text-orange-500 font-medium">{contestStartDate?.toLocaleDateString()}</span>
                      </>
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-700/20 rounded-lg p-4 border border-gray-700/30">
                <h3 className="text-white font-medium mb-3 flex items-center gap-2">
                  <Target size={18} className="text-orange-500" />
                  Contest Details
                </h3>
                <p className="text-sm text-gray-300 mb-4">
                  Review the contest requirements and prepare your strategy for maximum success.
                </p>
                <button
                  onClick={() => navigate(`/challenge/${challengeId}`)}
                  className="w-full px-4 py-2 bg-gray-700/50 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
                >
                  <span>View Contest Details</span>
                  <ChevronRight size={16} />
                </button>
              </div>
              
              <div className="bg-gray-700/20 rounded-lg p-4 border border-gray-700/30">
                <h3 className="text-white font-medium mb-3 flex items-center gap-2">
                  <Users size={18} className="text-orange-500" />
                  Registered Players
                </h3>
                <p className="text-sm text-gray-300 mb-4">
                  View other registered players, invite your friends to join before the Contest starts.
                </p>
                <button
                  onClick={() => setShowPlayerList(true)}
                  className="w-full px-4 py-2 bg-gray-700/50 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
                >
                  <span>View Players</span>
                  <Users size={16} />
                </button>
              </div>
            </div>
            
            <div className="bg-orange-500/10 rounded-lg p-4 border border-orange-500/20">
              <div className="flex items-start gap-3">
                <div className="text-orange-500 mt-1">
                  <Trophy size={20} />
                </div>
                <div>
                  <h3 className="text-white font-medium mb-1">Get Ready to Compete</h3>
                  <p className="text-sm text-gray-300">
                    The Contest chat will be available soon to connect with other players and begin posting your verification posts.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-center">
              <button
                onClick={() => navigate(`/challenge/${challengeId}`)}
                className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <span>Return to Contest</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
        
        {showPlayerList && (
          <ChallengePlayerList
            players={players}
            loading={loading}
            onClose={() => setShowPlayerList(false)}
            onPlayerSelect={(player) => {
              setSelectedPlayer(player);
              setShowPlayerList(false);
            }}
            isContest={challengeId?.startsWith('cn_') || challengeId?.startsWith('tc_')}
          />
        )}
        
        {selectedPlayer && (
          <PlayerProfileModal
            player={selectedPlayer}
            onClose={() => setSelectedPlayer(null)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 sticky top-0 z-50"> 
        <div className="max-w-6xl mx-auto px-4">
          <div className="h-16 flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <button
                onClick={() => {
                  // Navigate back to the challenge page
                  // If this is a contest, set the active tab first
                  if (challengeId?.startsWith('cn_') || challengeId?.startsWith('tc_')) {
                    window.dispatchEvent(new CustomEvent('setActiveTab', { detail: { tab: 'contests' } }));
                    setTimeout(() => {
                      navigate(`/challenge/${challengeId}`);
                    }, 50);
                  } else {
                    navigate(`/challenge/${challengeId}`);
                  }
                }}
                className="text-gray-400 hover:text-white"
              >
                <ArrowLeft size={20} />
              </button>
              <div className="flex items-center gap-2">
                <MessageCircle className="text-orange-500" size={20} />
                <h1 className="text-lg font-semibold text-white">
                  Contest Chat 
                </h1>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowPlayerList(true)}
                    className="flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors"
                  >
                    <Users size={14} />
                    <span>{playerCount} Players</span>
                  </button>
                  {isContest && (
                    <div className="flex items-center gap-1 text-xs text-lime-500 bg-lime-500/10 px-2 py-0.5 rounded">
                      <CheckCircle2 size={12} />
                      <span>{verificationCount} / {verificationsRequired} Verifications</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="max-w-6xl mx-auto px-4 py-6 flex-1 w-full">
        <div className="bg-gray-800/80 rounded-lg shadow-xl w-full mx-auto relative">
          <div className="h-[calc(100vh-13rem)] overflow-y-auto p-4 space-y-4 flex flex-col bg-gray-600/20" ref={messagesContainerRef}>
            <div className="flex-1" />
            {error ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <p className="text-red-400 mb-4">{error.message}</p>
                <button
                  onClick={() => fetchMessages()}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                  Retry
                </button>
              </div>
            ) : loading && sortedMessages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500" />
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                <MessageCircle className="mx-auto mb-2" size={24} />
                <p>No messages yet</p>
              </div>
            ) : (
              <>
                {sortedMessages.map((message) => (
                  <ChatMessage
                    key={message.id}
                    message={message}
                    onDelete={handleDelete}
                    onReply={handleReply}
                    challengeId={challengeId}
                    onImageClick={(url) => setSelectedImage(url)}
                  />
                ))}
              </>
            )}
            <div ref={messagesEndRef} className="h-0" />
          </div>

          {/* Input */}
          <ChatInput
            onSend={handleSend}
            isVerification={isVerification}
            replyingTo={replyingTo}
            onCancelReply={() => setReplyingTo(null)}
            onVerificationChange={setIsVerification}
            disabled={loading}
          />
        </div>
      </div>

      {showPlayerList && (
        <ChallengePlayerList
          players={players}
          loading={loading}
          onClose={() => setShowPlayerList(false)}
          onPlayerSelect={(player) => {
            setSelectedPlayer(player);
            setShowPlayerList(false);
          }}
          isContest={challengeId?.startsWith('cn_') || challengeId?.startsWith('tc_')}
        />
      )}

      {selectedPlayer && (
        <PlayerProfileModal
          player={selectedPlayer}
          onClose={() => setSelectedPlayer(null)}
        />
      )}
      
      {/* Image Viewer */}
      {selectedImage && (
        <ImageViewer 
          imageUrl={selectedImage} 
          onClose={() => setSelectedImage(null)} 
        />
      )}
    </div>
  );
}