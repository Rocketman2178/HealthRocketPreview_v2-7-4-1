// Chat navigation utilities
export const getChatPath = (challengeId: string | undefined) => {
  if (!challengeId) {
    console.warn('Attempted to get chat path with undefined challenge ID');
    return '/';
  }
  
  // Only allow chat for contests
  if (!isContestChatId(challengeId)) {
    console.warn('Attempted to get chat path for non-contest challenge'); 
    return '/';
  }
  
  return `/chat/c_${challengeId}`;
};

export const getChatId = (challengeId: string | undefined) => {
  if (!challengeId) {
    console.warn('Attempted to get chat ID with undefined challenge ID');
    return '';
  }
  
  return `c_${challengeId}`;
};

// Check if a challenge ID is for a contest
export const isContestChatId = (challengeId: string | undefined): boolean => {
  if (!challengeId) return false;
  
  // Contest IDs start with 'cn_' or 'tc_'
  return challengeId.startsWith('cn_') || challengeId.startsWith('tc_'); 
};