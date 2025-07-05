import React, { useState, useEffect } from 'react';
import { Mail, Calendar, Camera, LogOut, X, Trophy, MessageSquare, Shield, ChevronRight, Zap, FileText, Ticket, Radio as RadioIcon, Users } from 'lucide-react';
import { ProfileStats } from './ProfileStats';
import { PrizePointsCard } from './PrizePointsCard';
import { RankHistory } from './RankHistory';
import { SubscriptionManager } from './SubscriptionManager';
import { CodeManager } from '../admin/CodeManager';
import { EditableField } from './EditableField';
import { SupportForm } from './SupportForm';
import { TermsAndConditions } from '../auth/TermsAndConditions';
import { useSupabase } from '../../contexts/SupabaseContext';
import { useUser } from '../../hooks/useUser';
import { uploadProfileImage } from '../../lib/profile';
import { SessionKeyManager } from '../../lib/cosmo/SessionKeyManager';

// Helper function to get days since FP text
function getDaysSinceFPText(days: number | undefined): string {
  if (!days || days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
}

interface PlayerProfileProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PlayerProfile({ isOpen, onClose }: PlayerProfileProps) {
  const { user, signOut } = useSupabase();
  const { userData, healthData, isLoading } = useUser(user?.id);
  const [uploading, setUploading] = useState(false);
  const [showSubscriptionManager, setShowSubscriptionManager] = useState(false);
  const [showSupportForm, setShowSupportForm] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(userData?.avatar_url || null);
  const [showCosmoDebug, setShowCosmoDebug] = useState(false);
  const [isPaidSubscription, setIsPaidSubscription] = useState<boolean>(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isPreviewAccess, setIsPreviewAccess] = useState<boolean>(false);
  const [daysUntilExpiry, setDaysUntilExpiry] = useState<number | null>(null);
  const [previewExpiryDate, setPreviewExpiryDate] = useState<Date | null>(null);

  useEffect(() => {
    setAvatarUrl(userData?.avatar_url || null);
  }, [userData?.avatar_url]);

  // Check if user is admin
  useEffect(() => {
    if (user?.email) {
      // For demo purposes, we'll consider specific users as admins
      const adminEmails = ['admin@healthrocket.app', 'clay@healthrocket.life', 'clay@healthrocket.app', 'derek@healthrocket.life'];
      setIsAdmin(adminEmails.includes(user.email));
    }
  }, [user?.email]);

  // Check if user has an active paid subscription
  useEffect(() => {
    if (userData) {
      // Check if user has an active paid subscription based on plan_status
      const isActive = userData.plan_status === 'Active';
      setIsPaidSubscription(isActive);
      
      // Check if user has Preview Access plan
      const hasPreviewAccess = userData.plan === 'Preview Access' && userData.plan_status === 'Preview';
      setIsPreviewAccess(hasPreviewAccess);
      
      // Set preview expiry date
      if (hasPreviewAccess) {
        setPreviewExpiryDate(new Date('2025-07-30T23:59:59'));
        
        // Calculate days until expiry for Preview Access
        const expiryDate = new Date('2025-07-30T23:59:59');
        const now = new Date();
        const diffTime = expiryDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        setDaysUntilExpiry(diffDays > 0 ? diffDays : 0);
      }
    }
  }, [userData]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;
    event.target.value = ''; // Reset input to allow selecting same file again

    try {
      setUploading(true);
      const newAvatarUrl = await uploadProfileImage(file, user.id);
      setAvatarUrl(newAvatarUrl);
      
      // Add cache buster to force image refresh
      setAvatarUrl(`${newAvatarUrl}?t=${Date.now()}`);
    } catch (error) {
      console.error('Error uploading profile image:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleRotateCosmoKey = () => {
    const newKey = SessionKeyManager.forceRotateKey();
    alert(`Cosmo session key rotated. New key: ${newKey}`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[50] flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto hide-scrollbar relative">
        <div className="sticky top-0 bg-gray-900 p-4 border-b border-gray-800 z-[110]">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-white">Player Profile</h2>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowTerms(true)}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
              >
                <FileText size={18} />
                <span className="text-sm">Terms</span>
              </button>
              {isAdmin && (
                <button
                  onClick={() => window.location.href = '/admin'}
                  className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                >
                  <Shield size={18} />
                  <span className="text-sm">Admin</span>
                </button>
              )}
              <button
                onClick={() => setShowSupportForm(true)}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
              >
                <MessageSquare size={18} />
                <span className="text-sm">Support</span>
              </button>
              <button
                onClick={() => signOut()}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
              >
                <LogOut size={18} />
                <span className="text-sm">Logout</span>
              </button>
              <button 
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        </div>
        
         {/* Preview 100 Challenge Info Card */}
         {isPreviewAccess && (
           <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4 mt-4">
             <div className="flex items-start gap-3">
               <Trophy className="text-orange-500 mt-1" size={20} />
               <div>
                 <h3 className="text-lg font-medium text-white mb-2">Preview Challenge</h3>
                 <p className="text-sm text-gray-300 mb-3">
                   As a Preview participant, you have exclusive access to all Pro features until July 30, 2025.
                 </p>
                 <div className="space-y-2">
                   <div className="flex items-start gap-2">
                     <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-1.5"></div>
                     <p className="text-sm text-gray-300">Complete a 42-Day Burn Streak to earn 2,500 equity shares</p>
                   </div>
                   <div className="flex items-start gap-2">
                     <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-1.5"></div>
                     <p className="text-sm text-gray-300">Chance to win up to 100,000 additional shares</p>
                   </div>
                   <div className="flex items-start gap-2">
                     <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-1.5"></div>
                     <p className="text-sm text-gray-300">Access to all premium features during the preview period</p>
                   </div>
                 </div>
                 <div className="mt-3 pt-3 border-t border-orange-500/20">
                   <div className="flex items-center justify-between">
                     <span className="text-sm text-gray-300">Preview Access Expires:</span>
                     <span className="text-sm text-orange-500 font-medium">July 30, 2025</span>
                   </div>
                   <div className="flex items-center justify-between mt-1">
                     <span className="text-sm text-gray-300">Days Remaining:</span>
                     <span className="text-sm text-orange-500 font-medium">{daysUntilExpiry}</span>
                   </div>
                 </div>
               </div>
             </div>
           </div>
         )}
        <div className="p-4 space-y-6 relative z-10">
          <div className="flex items-start gap-4">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-orange-500 flex items-center justify-center overflow-hidden">
                {avatarUrl ? (
                  <img 
                    src={`${avatarUrl}?${Date.now()}`} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Trophy className="text-white" size={40} />
                )}
              </div>
              <label className={`absolute bottom-0 right-0 w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center cursor-pointer border border-gray-700 hover:bg-gray-700 transition-colors ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <Camera size={16} className="text-gray-300" />
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploading}
                />
              </label>
            </div>
            
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-white">
                {isLoading ? (
                  <div className="h-8 w-48 bg-gray-700 rounded animate-pulse"></div>
                ) : (
                  <div className="flex flex-col">
                    <span>{userData?.name || 'Player'}</span>
                  </div>
                )}
              </h3>
              <div className="flex flex-col mt-2">
                <div className="flex items-center gap-2 text-orange-500 font-medium">
                  <Shield size={16} />
                  <span>{userData?.plan || 'Free Plan'}</span>
                </div>
                
                {/* Trial days remaining indicator */}
                {userData?.plan === 'Pro Plan' && userData?.plan_status === 'Trial' && userData?.subscription_start_date && (
                  <div className="text-xs text-gray-400 mt-1">
                    {(() => {
                      const startDate = new Date(userData.subscription_start_date);
                      const trialEndDate = new Date(startDate);
                      trialEndDate.setDate(trialEndDate.getDate() + 60); // 60-day trial
                      
                      const now = new Date();
                      const daysLeft = Math.ceil((trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                      
                      return daysLeft > 0 ? (
                        <div className="flex items-center">
                          <span>{daysLeft} {daysLeft === 1 ? 'day' : 'days'} left in trial</span>
                          <button 
                            onClick={() => setShowSubscriptionManager(true)}
                            className="ml-2 px-3 py-1 text-xs bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors"
                          >
                            Upgrade Now
                          </button>
                        </div>
                      ) : null;
                    })()}
                  </div>
                )}
                
                {/* Preview Access expiry indicator */}
                {isPreviewAccess && daysUntilExpiry !== null && (
                  <div className="text-xs text-gray-400 mt-1">
                    <div className="flex items-center">
                      <span>Preview Access expires in {daysUntilExpiry} {daysUntilExpiry === 1 ? 'day' : 'days'}</span>
                    </div>
                  </div>
                )}
                
                <button
                  onClick={() => setShowSubscriptionManager(true)}
                  className="text-sm text-orange-500 hover:text-orange-400 mt-2 flex items-center gap-1"
                >
                  <span>Manage Subscription</span>
                  <ChevronRight size={14} />
                </button>
              </div>
              <div className="grid grid-cols-1 gap-2 text-sm mt-3">
                <EditableField
                  icon={Mail}
                  value={userData?.email || ''}
                  onChange={() => {}} // Email changes not supported
                  placeholder="Email address"
                />
                <div className="flex items-center gap-2 text-gray-400">
                  <Calendar size={16} />
                  <span>Member Since: {new Date(userData?.created_at || Date.now()).toLocaleDateString('en-US', {
                    month: '2-digit',
                    day: '2-digit',
                    year: 'numeric'
                  })}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <Zap size={16} className={userData?.days_since_fp === 0 ? 'text-lime-500' : 'text-orange-500'} />
                  <span>Last FP Earned: <span className={userData?.days_since_fp === 0 ? 'text-lime-500' : 'text-orange-500'}>
                    {getDaysSinceFPText(userData?.days_since_fp)}
                  </span></span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Section */}
          <ProfileStats userData={userData} healthData={healthData} />

         {/* Preview 100 Challenge Info Card */}
         {isPreviewAccess && (
           <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4 mt-4">
             <div className="flex items-start gap-3">
               <Trophy className="text-orange-500 mt-1" size={20} />
               <div>
                 <h3 className="text-lg font-medium text-white mb-2">Preview Challenge</h3>
                 <p className="text-sm text-gray-300 mb-3">
                   As a Preview participant, you have exclusive access to all Pro features until July 30, 2025.
                 </p>
                 <div className="space-y-2">
                   <div className="flex items-start gap-2">
                     <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-1.5"></div>
                     <p className="text-sm text-gray-300">Complete a 42-Day Burn Streak to earn 2,500 equity shares</p>
                   </div>
                   <div className="flex items-start gap-2">
                     <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-1.5"></div>
                     <p className="text-sm text-gray-300">Chance to win up to 100,000 additional shares</p>
                   </div>
                   <div className="flex items-start gap-2">
                     <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-1.5"></div>
                     <p className="text-sm text-gray-300">Access to all premium features during the preview period</p>
                   </div>
                 </div>
                 <div className="mt-3 pt-3 border-t border-orange-500/20">
                   <div className="flex items-center justify-between">
                     <span className="text-sm text-gray-300">Preview Access Expires:</span>
                     <span className="text-sm text-orange-500 font-medium">July 30, 2025</span>
                   </div>
                   <div className="flex items-center justify-between mt-1">
                     <span className="text-sm text-gray-300">Days Remaining:</span>
                     <span className="text-sm text-orange-500 font-medium">{daysUntilExpiry}</span>
                   </div>
                 </div>
               </div>
             </div>
           </div>
         )}
          <RankHistory />
          <PrizePointsCard />
          
          {/* Cosmo Debug Panel (Admin Only) - Moved to bottom */}
          {isAdmin && (
            <div className="mt-6 pt-6 border-t border-gray-700">
              <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Shield className="text-orange-500" size={20} />
                    Admin Panel
                  </h3>
                  <button
                    onClick={() => setShowCosmoDebug(!showCosmoDebug)}
                    className="text-sm text-gray-400 hover:text-white"
                  >
                    {showCosmoDebug ? 'Hide' : 'Show'}
                  </button>
                </div>
              
                {showCosmoDebug && (
                  <div className="space-y-4">
                    <div className="bg-gray-700/50 p-4 rounded-lg">
                      <h4 className="text-sm font-medium text-white mb-2">Session Key Management</h4>
                      <div className="flex items-center gap-2">
                        <div className="text-sm text-gray-300">
                          Current Key: <span className="text-orange-500 font-mono">{SessionKeyManager.getSessionKey()}</span>
                        </div>
                        <button
                          onClick={handleRotateCosmoKey}
                          className="px-3 py-1 bg-orange-500 text-white text-sm rounded hover:bg-orange-600"
                        >
                          Force Rotate Key
                        </button>
                      </div>
                      <p className="text-xs text-gray-400 mt-2">
                        Session keys automatically rotate every 3 hours. Last rotation: {
                          (() => {
                            const expiryTime = parseInt(localStorage.getItem('cosmo_session_expiry') || '0', 10);
                            if (isNaN(expiryTime)) return 'Unknown';
                            const rotationTime = new Date(expiryTime - (3 * 60 * 60 * 1000));
                            return rotationTime.toLocaleString();
                          })()
                        }
                      </p>
                    </div>
                    
                    <div className="bg-gray-700/50 p-4 rounded-lg">
                      <h4 className="text-sm font-medium text-white mb-2">Admin Tools</h4>
                      <div className="space-y-2">
                        <button
                          onClick={() => window.location.href = '/admin/users'}
                          className="w-full px-3 py-2 bg-gray-600 text-white text-sm rounded hover:bg-gray-500 flex items-center gap-2"
                        >
                          <Users size={16} className="text-orange-500" />
                          <span>User Management</span>
                        </button>
                        
                        <button
                          onClick={() => window.location.href = '/admin/contests'}
                          className="w-full px-3 py-2 bg-gray-600 text-white text-sm rounded hover:bg-gray-500 flex items-center gap-2"
                        >
                          <Trophy size={16} className="text-orange-500" />
                          <span>Contest Management</span>
                        </button>
                        
                        <button
                          onClick={() => window.location.href = '/admin/messages'}
                          className="w-full px-3 py-2 bg-gray-600 text-white text-sm rounded hover:bg-gray-500 flex items-center gap-2"
                        >
                          <MessageSquare size={16} className="text-orange-500" />
                          <span>Player Messages</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Support Form */}
        {showSupportForm && (
          <SupportForm onClose={() => setShowSupportForm(false)} />
        )}
        
        {/* Subscription Manager Modal */}
        {showSubscriptionManager && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-start justify-center p-4 overflow-y-auto">
            <div className="absolute inset-0 z-[201]" onClick={() => setShowSubscriptionManager(false)}></div>
            <SubscriptionManager 
              onClose={() => setShowSubscriptionManager(false)}
              userData={userData}
            />
          </div>
        )}
        
        {/* Terms and Conditions Modal */}
        {showTerms && (
          <TermsAndConditions onClose={() => setShowTerms(false)} />
        )}
      </div>
    </div>
  );
}