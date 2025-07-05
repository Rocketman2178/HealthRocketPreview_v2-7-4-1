import { useState, useEffect } from 'react';
import { Shield, X } from 'lucide-react';
import { useSupabase } from '../../contexts/SupabaseContext';
import { useUser } from '../../hooks/useUser';
import { useStripe } from '../../hooks/useStripe';
import { SubscriptionManager } from '../profile/SubscriptionManager';

export function SubscriptionNotification() {
  const { user } = useSupabase();
  const { userData } = useUser(user?.id);
  const [daysLeft, setDaysLeft] = useState<number | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [isSubscriptionOpen, setIsSubscriptionOpen] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [isPreviewAccess, setIsPreviewAccess] = useState(false);
  const [isFoundersLeague, setIsFoundersLeague] = useState(false);
  const [isPaidSubscription, setIsPaidSubscription] = useState(false);
  const { createSubscription, loading: stripeLoading } = useStripe();

  // Get current plan name
  const currentPlanName = userData?.plan || "Free Plan";

  // Check if user has an active subscription
  useEffect(() => {
    if (userData) {
      // Check if user has an active paid subscription based on plan_status
      const isActive = userData.plan_status === 'Active';
      setIsPaidSubscription(isActive);
      
      // Check if user is on Founders League plan
      setIsFoundersLeague(userData.plan === 'Founders League' || userData.plan_status === 'Founders League');
      
      // Check if user has Preview Access plan
      const hasPreviewAccess = userData.plan === 'Preview Access' && userData.plan_status === 'Preview';
      setIsPreviewAccess(hasPreviewAccess);
      
      // Set preview expiry date
      if (hasPreviewAccess) {
        setPreviewExpiryDate(new Date('2025-07-30T23:59:59'));
      }
    }
  }, [userData]);

  useEffect(() => {
    if (!userData) return;
    
    // Check if user is on Pro Plan and not Founders League or Preview Access
    const isProPlan = userData.plan === 'Pro Plan' && userData.plan_status !== 'Founders League' && userData.plan_status !== 'Preview';
    const hasPreviewAccess = userData.plan === 'Preview Access' && userData.plan_status === 'Preview';
    
    setIsPreviewAccess(hasPreviewAccess);
    setIsFoundersLeague(userData.plan === 'Founders League' || userData.plan_status === 'Founders League');
    
    // Only show trial notifications for regular Pro Plan users, not Founders League
    if (isProPlan && !isFoundersLeague && !hasPreviewAccess) {
      // Check if subscription has a trial period
      const subscriptionCreatedAt = new Date(userData.subscription_start_date || userData.created_at);
      const trialEndDate = new Date(subscriptionCreatedAt);
      trialEndDate.setDate(trialEndDate.getDate() + 60); // 60-day trial
      
      const now = new Date();
      const remainingDays = Math.ceil((trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      // Show notification if days remaining is 10 or less, or if it's exactly 30 or 45 days
      if (remainingDays > 0 && (remainingDays <= 10 || remainingDays === 30 || remainingDays === 45)) {
        setDaysLeft(remainingDays);
        setShowNotification(true);
        
        // Check if notification was dismissed today
        const lastDismissed = localStorage.getItem('trial_notification_dismissed');
        if (lastDismissed) {
          const dismissedDate = new Date(lastDismissed);
          const today = new Date();
          if (dismissedDate.toDateString() === today.toDateString()) {
            setDismissed(true);
          }
        }
      } else {
        setDaysLeft(null);
      }
    } else if (hasPreviewAccess) {
      // For Preview Access users, show notification when approaching expiry
      const previewEndDate = new Date('2025-07-30T23:59:59');
      const now = new Date();
      const remainingDays = Math.ceil((previewEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      // Show notification if 30 days or less remaining, or at 60 and 90 days
      if (remainingDays > 0 && (remainingDays <= 30 || remainingDays === 60 || remainingDays === 90)) {
        setDaysLeft(remainingDays);
        setShowNotification(true);
        
        // Check if notification was dismissed today
        const lastDismissed = localStorage.getItem('preview_notification_dismissed');
        if (lastDismissed) {
          const dismissedDate = new Date(lastDismissed);
          const today = new Date();
          if (dismissedDate.toDateString() === today.toDateString()) {
            setDismissed(true);
          }
        }
      } else {
        setDaysLeft(null);
      }
    }
  }, [userData]);

  const handleDismiss = () => {
    setDismissed(true);
    if (isPreviewAccess) {
      localStorage.setItem('preview_notification_dismissed', new Date().toISOString());
    } else {
      localStorage.setItem('trial_notification_dismissed', new Date().toISOString());
    }
  };

  if (!showNotification || dismissed) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md bg-gray-800 rounded-lg shadow-lg border border-orange-500/30 p-4 animate-[bounceIn_0.5s_ease-out]">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-orange-500/20 rounded-full">
          <Shield className="text-orange-500" size={20} />
        </div>
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <h3 className="text-white font-semibold">
              {isPreviewAccess ? 'Preview Access Ending Soon' : 'Pro Plan Trial Ending Soon'}
            </h3>
            <button 
              onClick={handleDismiss}
              className="text-gray-400 hover:text-gray-300"
            >
              <X size={16} />
            </button>
          </div>
          <p className="text-sm text-gray-300 mt-1">
            {isPreviewAccess ? (
              <>
                Your Preview Challenge access expires in <span className="text-orange-500 font-medium">{daysLeft} {daysLeft === 1 ? 'day' : 'days'}</span> on <span className="text-orange-500 font-medium">July 30, 2025</span>. 
                {daysLeft <= 30 ? 'Upgrade to Pro Plan to keep your premium benefits after expiry.' : 'Continue earning Fuel Points daily to complete the 42-Day Burn Streak!'}
              </>
            ) : (
              <>
                Your Pro Plan trial ends in <span className="text-orange-500 font-medium">{daysLeft} {daysLeft === 1 ? 'day' : 'days'}</span>. 
                {daysLeft <= 10 ? 'Upgrade now to keep your premium benefits.' : 'Enjoy your premium benefits!'}
              </>
            )}
          </p>
          <button
            onClick={() => setIsSubscriptionOpen(true)}
            className="ml-2 px-3 py-1 text-xs bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors"
          >
            Upgrade Now
          </button>
        </div>
      </div>
      
      {isSubscriptionOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[300] flex items-start justify-center p-4 overflow-y-auto">
          <div className="absolute inset-0 z-[301]" onClick={() => setIsSubscriptionOpen(false)}></div>
          <SubscriptionManager
            onClose={() => setIsSubscriptionOpen(false)}
            userData={userData}
          />
        </div>
      )}
    </div>
  );
}