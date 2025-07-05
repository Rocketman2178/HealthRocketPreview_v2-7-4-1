import { CommunityLeaderboard } from './CommunityLeaderboard';
import { useCommunity } from '../../../hooks/useCommunity';
import { useSupabase } from '../../../contexts/SupabaseContext';
export function RankStatus() {
  const { user } = useSupabase();
  const { primaryCommunity} = useCommunity(user?.id);

  return (
      <CommunityLeaderboard 
        communityId={primaryCommunity?.id || ''}
        userId={user?.id}
        key={`${primaryCommunity?.id}`} 
      />
   
  );
}