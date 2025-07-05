import React, { useState, useEffect } from 'react';
import { Target, Users, ChevronRight } from 'lucide-react';
import { useInviteCode } from '../../../hooks/useInviteCode';
import { useSupabase } from '../../../contexts/SupabaseContext';
import type { Community } from '../../../types/community';
import { supabase } from '../../../lib/supabase';
import { useUser } from '../../../hooks/useUser';

interface CommunitySelectProps {
  onContinue: () => void;
  onBack: () => void;
}

export function CommunitySelect({ onContinue, onBack }: CommunitySelectProps) {
  const [inviteCode, setInviteCode] = useState('');
  const [communities, setCommunities] = useState<Community[]>([]);
  const [selectedCommunityId, setSelectedCommunityId] = useState<string>('');
  const [community, setCommunity] = useState<Community | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { validateCode, joinCommunity, validating, joining } = useInviteCode();
  const { user } = useSupabase();
  const { userData } = useUser(user?.id);
  const [updating, setUpdating] = useState(false);

  // Check if user already has a community (auto-enrolled via launch code)
  useEffect(() => {
    const checkExistingCommunity = async () => {
      if (!user?.id) return;
      
     // Check if user used EOPREVIEW or EMERGEPREVIEW launch code
     const { data: launchCodeData, error: launchCodeError } = await supabase
       .from('launch_code_usages')
       .select('launch_codes(code)')
       .eq('user_id', user.id)
       .maybeSingle();
       
     if (!launchCodeError && launchCodeData?.launch_codes?.code) {
       const code = launchCodeData.launch_codes.code;
       if (code === 'EOPREVIEW' || code === 'EMERGEPREVIEW') {
         console.log(`User used ${code} launch code, checking for auto-enrollment`);
         
         // Check if user is already in a community
         const { data, error } = await supabase
           .from('community_memberships')
           .select('community_id')
           .eq('user_id', user.id)
           .maybeSingle();
           
         if (!error && data?.community_id) {
           console.log('User already auto-enrolled in community, skipping step');
           onContinue();
         }
       }
     }
     
      try {
       setUpdating(true);
        const { data, error } = await supabase
          .from('community_memberships')
          .select('community_id')
          .eq('user_id', user.id)
          .maybeSingle();
          
        if (!error && data?.community_id) {
         console.log('User already has a community (auto-enrolled via launch code), skipping community selection step');
          // User already has a community, skip this step
          onContinue();
        }
       setUpdating(false);
      } catch (err) {
        console.error('Error checking existing community:', err);
       setUpdating(false);
      }
    };
    
    checkExistingCommunity();
  }, [user?.id, onContinue]);

  // Fetch available communities
  React.useEffect(() => {
    async function fetchCommunities() {
      try {
        setUpdating(true);
        const { data, error } = await supabase
          .from('communities')
          .select('*')
          .eq('is_active', true)
          .order('name');

        if (error) throw error;
        setCommunities(data);
      } catch (err) {
        console.error('Error fetching communities:', err);
        setError('Failed to load communities');
        setUpdating(false);
      }
    }

    fetchCommunities();
  }, []);

  const handleValidate = async () => {
    if (!inviteCode.trim() || !selectedCommunityId) return;
    
    try {
      setError(null);
      const response = await validateCode(inviteCode.trim());
      
      if (!response.isValid) {
        setError(response.error || 'Invalid invite code');
        return;
      }

      // Verify code matches selected community
      if (response.community?.id !== selectedCommunityId) {
        setError('Invite code does not match selected community');
        return;
      }

      setCommunity(response.community);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to validate code');
    }
  };

  const handleJoin = async () => {
    if (!user || !inviteCode || !community) return;

    try {
      setError(null);
      const response = await joinCommunity(user.id, inviteCode, true);
      
      if (!response.success) {
        setError(response.error || 'Failed to join community');
        return;
      }

      onContinue();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join community');
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 shadow-xl">
      <div className="flex justify-center mb-6">
        <div className="w-20 h-20 bg-orange-500/20 rounded-full flex items-center justify-center">
          <Users className="text-orange-500" size={32} />
        </div>
      </div>

      <h2 className="text-2xl font-bold text-white text-center mb-2">
        Join Your Community
      </h2>
      
      <p className="text-gray-300 text-center mb-6">
        Select your community and enter your invite code to get started
      </p>

      <div className="space-y-4">
        {/* Community Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Select Community
          </label>
          <select
            value={selectedCommunityId}
            onChange={(e) => setSelectedCommunityId(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
          >
            <option value="">Select a community...</option>
            {communities.map((community) => (
              <option key={community.id} value={community.id}>
                {community.name}
              </option>
            ))}
          </select>
        </div>

        {/* Invite Code */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Enter Invite Code
          </label>
          <input
            type="text"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            placeholder="Enter invite code"
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        {error && (
          <div className="text-sm text-red-400 text-center">{error}</div>
        )}

        {community && (
          <div className="bg-gray-700/50 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <Target className="text-orange-500" size={20} />
              <h3 className="text-lg font-medium text-white">{community.name}</h3>
            </div>
            {community.description && (
              <p className="text-sm text-gray-400 mb-3">{community.description}</p>
            )}
            <div className="text-sm text-gray-400">
              {community.memberCount} {community.memberCount === 1 ? 'Member' : 'Members'}
            </div>
          </div>
        )}

        <div className="flex justify-between gap-3">
          <button
            onClick={onBack}
            className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg font-medium hover:bg-gray-600 transition-colors"
          >
            Back
          </button>
          {!community ? (
            <button
              onClick={handleValidate}
              disabled={validating || !inviteCode.trim() || !selectedCommunityId}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <span>Validate Code</span>
              <ChevronRight size={16} />
            </button>
          ) : (
            <button
              onClick={handleJoin}
              disabled={joining}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <span>Join Community</span>
              <ChevronRight size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}