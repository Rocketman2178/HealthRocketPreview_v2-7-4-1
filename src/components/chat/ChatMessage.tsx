import React, { useEffect, useState } from "react";
import {
  User,
  Check,
  Image as ImageIcon,
  Trash2, 
  Reply,
  MessageSquare
} from "lucide-react";
import { useSupabase } from "../../contexts/SupabaseContext";
import { PlayerProfileModal } from "../dashboard/rank/PlayerProfileModal";
import type { ChatMessage as ChatMessageType } from "../../types/chat";
import { cn } from "../../lib/utils";
import { supabase } from "../../lib/supabase";
import { LeaderboardEntry } from "../../types/community";
import { ChatService } from "../../lib/chat/ChatService";
import { getChatId } from "../../lib/utils/chat";
import { ImageViewer } from "./ImageViewer";
import { MessageReactions } from "./MessageReactions";

interface ChatMessageProps {
  message: ChatMessageType;
  onDelete?: (message: ChatMessageType) => void;
  className?: string;
  onReply?: (message: ChatMessageType) => void;
  challengeId: string | undefined;
  onImageClick?: (url: string) => void;
}

export function ChatMessage({
  message,
  onDelete,
  className,
  onReply,
  challengeId,
  onImageClick
}: ChatMessageProps) {
  const { user } = useSupabase();
  const [showProfile, setShowProfile] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const isOwnMessage = user?.id === message.userId;
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [reactions, setReactions] = useState<any[]>(message.reactions || []);
  const [hasReacted, setHasReacted] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  const handleProfileClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const { data, error } = await supabase.rpc("test_challenge_players", {
      p_challenge_id: challengeId,
    });
    const mappedEntries: LeaderboardEntry[] = data.map((row) => ({
      userId: row.user_id,
      name: row.name,
      createdAt: row.created_at,
      level: row.level,
      burnStreak: row.burn_streak,
      avatarUrl: row.avatar_url,
      healthScore: Number(row.health_score),
      healthspanYears: Number(row.healthspan_years),
      plan: row.plan,
    }));

    // Set user's rank if they're in the list
    const userEntry = mappedEntries.find(
      (entry) => entry.userId === message.userId
    );
    setUserData(userEntry);
    setShowProfile(true);
  };

  // Check if current user has reacted to this message
  useEffect(() => {
    if (user && reactions.length > 0) {
      setHasReacted(reactions.some(reaction => reaction.user_id === user.id));
    }
  }, [reactions, user]);

  // Handle reaction click
  const handleReaction = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;

    try {
      const added = await ChatService.addReaction(user.id, message.id);
      
      // Update local state based on the result
      if (added) {
        // Add the new reaction
        const newReaction = {
          id: crypto.randomUUID(),
          message_id: message.id,
          user_id: user.id,
          created_at: new Date(),
          users: { name: user.user_metadata?.name || 'You' }
        };
        setReactions([...reactions, newReaction]);
        setHasReacted(true);
      } else {
        // Remove the reaction
        setReactions(reactions.filter(reaction => reaction.user_id !== user.id));
        setHasReacted(false);
      }
    } catch (err) {
      console.error('Error toggling reaction:', err);
    }
  };

  // Handle image click to show larger view
  const handleImageClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (message.mediaType === 'image' && message.mediaUrl && onImageClick) {
      onImageClick(message.mediaUrl);
    } else if (message.mediaType === 'image' && message.mediaUrl) {
      setShowImageViewer(true);
    }
  };

  return (
    <div 
      className={cn(
        "flex flex-col gap-1 mb-4", 
        message.parentMessageId ? "pl-4 border-l-2 border-gray-700" : "",
        className
      )}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Parent Message Preview (for replies) */}
      {message.parentMessage && (
        <div 
          className={cn(
            "flex items-center gap-2 mb-1 px-2 py-1 rounded-lg max-w-[75%] cursor-pointer",
            isOwnMessage ? "ml-auto bg-gray-800/50" : "bg-gray-700/50"
          )}
          onClick={(e) => {
            e.stopPropagation();
            // Scroll to parent message functionality would go here
            const parentElement = document.getElementById(`message-${message.parentMessage?.id}`);
            if (parentElement) {
              parentElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
              // Highlight the parent message briefly
              parentElement.classList.add('bg-orange-500/20');
              setTimeout(() => {
                parentElement.classList.remove('bg-orange-500/20');
              }, 1500);
            }
          }}
        >
          <Reply size={12} className="text-orange-500 shrink-0" />
          <div className="flex flex-col min-w-0">
            <span className="text-xs text-orange-500 font-medium truncate">
              {message.parentMessage.user_name || 'User'}
            </span>
            <span className="text-xs text-gray-400 truncate">
              {message.parentMessage.content || (message.parentMessage.mediaUrl ? '[Media]' : '')}
            </span>
          </div>
        </div>
      )}
      
      {/* Message Container */}
      <div
        id={`message-${message.id}`}
        className={cn(
          "flex items-end gap-2",
          isOwnMessage ? "flex-row-reverse" : "flex-row"
        )}
      >
        {/* Avatar - only show for other users */}
        {!isOwnMessage &&
          (message.user_avatar_url ? (
            <img
              onClick={handleProfileClick}
              src={message.user_avatar_url}
              alt={message.user_name}
              className="w-8 h-8 rounded-full object-cover cursor-pointer hover:ring-2 hover:ring-orange-500 transition-all"
            />
          ) : (
            <div
              onClick={handleProfileClick}
              className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-orange-500 transition-all"
            >
              <User className="text-gray-400" size={16} />
            </div>
          ))}

        {/* Message Content */}
        <div className="max-w-[75%] space-y-1">
          {/* Content */}
          <div
            className={cn(
              "px-3 py-2 rounded-lg break-words relative border border-orange-500/20",
              isOwnMessage
                ? "bg-gray-800 text-white rounded-tr-none"
                : "bg-gray-700 text-white rounded-tl-none"
            )}
          >
            <div>
              {/* Verification Badge */}
              {message.isVerification && (
                <div
                  className={cn(
                    "absolute -top-2 right-2 bg-lime-500/20 text-lime-500 px-1.5 py-0.5 rounded text-[10px] font-medium",
                    isOwnMessage ? "-right-2" : "-left-2"
                  )}
                >
                  <div className="flex items-center gap-1">
                    <Check size={10} />
                    <span>Verification</span>
                  </div>
                </div>
              )}

              {/* Name and Verification Badge */}
              {!isOwnMessage && (
                <div
                  onClick={handleProfileClick}
                  className="text-xs text-orange-500 font-bold mb-1 cursor-pointer hover:underline"
                >
                  {message.user_name || "Unknown User"}
                </div>
              )}

              {/* Media */}
              {message.mediaUrl && (
                <div 
                  className="mt-2 cursor-pointer" 
                  onClick={handleImageClick}
                  title="Click to view larger image"
                >
                  {message.mediaType === "image" ? (
                    <img
                      src={message.mediaUrl}
                      alt="Message attachment"
                      className="max-w-sm max-h-[200px] object-contain rounded-lg hover:opacity-90 transition-opacity border border-gray-700/50"
                      loading="lazy"
                    />
                  ) : message.mediaType === "video" ? (
                    <video
                      src={message.mediaUrl}
                      controls
                      className="max-w-sm max-h-[200px] object-contain rounded-lg hover:opacity-90 transition-opacity border border-gray-700/50"
                    />
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <ImageIcon size={16} />
                      <span>Media attachment</span>
                    </div>
                  )}
                </div>
              )}

              <div className="text-sm">{message.content}</div>
              
              {/* Reactions */}
              <div className="flex items-center justify-between mt-1">
                <div className="flex items-center gap-2">
                  {/* Timestamp */}
                  <span className="text-[10px] text-gray-400">
                    {new Date(message.createdAt).toLocaleString('en-US', {
                      month: "numeric",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    })}
                  </span>
                  
                  {/* Reactions */}
                  <MessageReactions 
                    reactions={reactions}
                    hasReacted={hasReacted} 
                    onReact={handleReaction} 
                    isOwnMessage={isOwnMessage}
                    isHovering={isHovering}
                  />
                  
                  {/* Reply Button */}
                  {onReply && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onReply(message);
                      }}
                      className={`text-gray-400 hover:text-orange-500 transition-colors ${isHovering ? 'opacity-100' : 'opacity-0'}`}
                    >
                      <Reply size={14} />
                    </button>
                  )}
                </div>
                
                <div>
                  {/* Reply Count */}
                  {message.replyCount && message.replyCount > 0 && (
                    <div className="flex items-center gap-1 text-xs text-gray-400 hover:text-orange-500 transition-colors cursor-pointer">
                      <MessageSquare size={12} />
                      <span>{message.replyCount} {message.replyCount === 1 ? 'reply' : 'replies'}</span>
                    </div>
                  )}
                  
                  {/* Delete Button */}
                  {isOwnMessage && onDelete && (
                    <button
                      onClick={() => onDelete(message)}
                      className="text-gray-400 hover:text-red-400"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Image Viewer Modal */}
      {showImageViewer && message.mediaUrl && (
        <ImageViewer 
          imageUrl={message.mediaUrl} 
          onClose={() => setShowImageViewer(false)} 
        />
      )}
      
      {/* Player Profile Modal */}
      {showProfile && userData && (
        <PlayerProfileModal
          player={userData}
          onClose={() => setShowProfile(false)}
        />
      )}
    </div>
  );
}