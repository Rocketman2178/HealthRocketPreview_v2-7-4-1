import React, {
  useState,
  useRef,
  KeyboardEvent,
  useEffect
} from "react";
import { Send, Image as ImageIcon, X, Check, XIcon, Reply, Smile } from "lucide-react";
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';
import { ChatMessage } from "../../types/chat";

interface ChatInputProps {
  onSend: (content: string, mediaFile?: File) => void;
  isVerification?: boolean;
  onVerificationChange?: (isVerification: boolean) => void;
  disabled?: boolean;
  replyingTo?: ChatMessage | null;
  onCancelReply?: () => void;
}

export function ChatInput({
  onSend,
  disabled,
  isVerification,
  onVerificationChange,
  replyingTo,
  onCancelReply
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // For verification posts, require an image
    if (isVerification && !mediaFile) return;
    // For regular posts, require at least a message
    if (!isVerification && !message.trim()) return;

    // Pass the current verification state
    onSend(message, mediaFile || undefined);
    setMessage("");
    setMediaFile(null);
    setMediaPreview(null);
  };
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && e.shiftKey) {
      e.preventDefault();
      setMessage((prevMessage) => prevMessage + "\n");
    } else if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit(e);
    }
  };
  
  // Handle emoji selection
  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setMessage(prev => prev + emojiData.emoji);
  };
  
  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        emojiPickerRef.current && 
        emojiButtonRef.current && 
        !emojiPickerRef.current.contains(event.target as Node) &&
        !emojiButtonRef.current.contains(event.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (50MB limit)
    if (file.size > 50 * 1024 * 1024) {
      alert("File size must be less than 50MB");
      return;
    }

    // Check file type
    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
      alert("Only image and video files are supported");
      return;
    }

    setMediaFile(file);

    // Create object URL for preview
    const previewUrl = URL.createObjectURL(file);
    setMediaPreview(previewUrl);

    // Clean up object URL when preview changes
    return () => URL.revokeObjectURL(previewUrl);
  };

  return (
    <form
      className="border-t border-gray-700 bg-gray-800"
      onSubmit={handleSubmit}
    >
      {/* Verification Checkbox */}
      <div className="px-4 pt-3 flex items-center justify-between">
        {/* Reply Preview */}
        {replyingTo && (
          <div className="absolute top-0 left-0 right-0 bg-gray-700/80 p-2 border-t border-gray-600 flex items-center">
            <div className="flex-1 flex items-center gap-2">
              <Reply size={14} className="text-orange-500" />
              <div className="flex flex-col">
                <span className="text-xs font-medium text-orange-500">
                  {replyingTo.user_name || 'User'}
                </span>
                <span className="text-xs text-gray-300 truncate max-w-[200px]">
                  {replyingTo.content || (replyingTo.mediaUrl ? '[Media]' : '')}
                </span>
              </div>
            </div>
            <button
              onClick={onCancelReply}
              className="text-gray-400 hover:text-gray-300 p-1"
            >
              <X size={14} />
            </button>
          </div>
        )}
        
        <label className="flex items-center gap-2 text-sm text-gray-400">
          <input
            type="checkbox"
            checked={isVerification || false}
            onChange={(e) => onVerificationChange?.(e.target.checked)}
            className="rounded border-gray-600 text-orange-500 focus:ring-orange-500"
          />
          <span className="flex items-center gap-1 text-lime-500">
            <div className="w-4 h-4 rounded-full border border-lime-500 flex items-center justify-center">
              <Check size={12} className="text-lime-500" />
            </div>
            Verification Post <span className="text-xs text-gray-300">(Image required)</span>
          </span>
        </label>
        <span className="text-xs text-gray-500">(Max 50MB)</span>
      </div>

      {/* Media Preview */}
      {mediaPreview && (
        <div className="relative w-32 h-32 mx-4 my-2">
          {mediaFile?.type.startsWith("image/") ? (
            <img
              src={mediaPreview}
              alt="Upload preview"
              className="w-full h-full object-contain rounded-lg"
            />
          ) : (
            <video
              src={mediaPreview}
              className="w-full h-full object-contain rounded-lg"
            />
          )}
          <button
            type="button"
            onClick={() => {
              setMediaFile(null);
              setMediaPreview(null);
              if (mediaPreview) {
                URL.revokeObjectURL(mediaPreview);
              }
            }}
            className="absolute -top-2 -right-2 bg-gray-800 text-gray-400 hover:text-white rounded-full p-1"
          >
            <X size={14} />
          </button>
        </div>
      )}

      <div className="flex flex-col">
        <div className={`flex items-center gap-2 p-4 ${replyingTo ? 'mt-8' : ''}`}>
          <button
            ref={emojiButtonRef}
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-700/50"
          >
            <Smile size={20} />
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-700/50"
            disabled={disabled}
          >
            <ImageIcon size={20} />
          </button>
          <textarea
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className="flex-1 bg-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
            disabled={disabled}
          />
          <button
            type="submit"
            disabled={disabled || (isVerification && !mediaFile) || (!isVerification && !message.trim())}
            className="p-2 text-orange-500 hover:text-orange-400 rounded-lg hover:bg-gray-700/50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={20} />
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>
        
        {/* Emoji Picker */}
        {showEmojiPicker && (
          <div 
            ref={emojiPickerRef}
            className="absolute bottom-16 left-4 z-10"
          >
            <EmojiPicker 
              onEmojiClick={handleEmojiClick} 
              theme={Theme.DARK}
              searchPlaceHolder="Search emojis..."
              width={300}
              height={400}
            />
          </div>
        )}
      </div>
    </form>
  );
}
