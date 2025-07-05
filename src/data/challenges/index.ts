import { contestChallenges } from './contestChallenges';
import { tier0Challenge, tier0Challenges } from './tier0Challenge';

// Export contest challenges separately
export { contestChallenges };

// Export tier0Challenge separately
export { tier0Challenge };

// Export tier0Challenges array
export { tier0Challenges };

// Note: We no longer export a combined challenges array
// All challenges are now fetched from the database using useChallengeLibrary