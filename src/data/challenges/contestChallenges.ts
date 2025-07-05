import type { Challenge } from '../../types/game';

export const contestChallenges: Challenge[] = [
  {
    id: 'cn_oura_sleep_week_score',
    name: 'Oura Sleep Week Contest',
    tier: 1,
    duration: 7,
    category: 'Contests',
    description: `Achieve the highest average weekly Sleep Score from your Oura Ring app.`,
    expertReference: 'Health Rocket Team - Gamifying Health to Increase HealthSpan',
    learningObjectives: [
      'Master sleep optimization',
      'Develop consistent sleep tracking',
      'Build sleep-focused habits'
    ],
    requirements: [
      {
        description: 'Daily and Weekly sleep score screenshot posts (100% of score)',
        verificationMethod: 'verification_posts',
        weight: 100
      }
    ],
    implementationProtocol: {
      week1: 'Track and post your daily sleep score from the Oura Ring app each day. On the final day, post your weekly sleep score average from the Oura Ring app.'
    },
    howToPlay: {
      description: 'Join this Contest to compete for prizes while optimizing your sleep quality:',
      steps: [
        'Register with 1 Contest Entry Credit to secure your spot',
        'Post daily sleep score screenshots in the Challenge Chat',
        'Post your weekly sleep score average on the final day',
        'Track your progress on the leaderboard',
        'Top 10% share 75% of prize pool, top 50% get credit back'
      ]
    },
    relatedCategories: ["Sleep"],
    successMetrics: [
      'Daily verification posts (0/7 days)',
      'Weekly average verification post (0/1 final day)', 
      'Daily Sleep boosts (0/7)'
    ],
    expertTips: [
      'Maintain consistent sleep/wake times',
      'Optimize bedroom temperature (65-67°F)',
      'Limit blue light exposure before bed',
      'Practice relaxation techniques',
      'Track and optimize your sleep latency'
    ],
    fuelPoints: 150,
    status: 'available',
    isPremium: true,
    verifications_required: 8,
    entryFee: 1, 
    minPlayers: 4,
    startDate: '2025-06-08T04:00:00.000Z',  // June 8, 2025
   registrationEndDate: '2025-06-15T04:00:00.000Z', // June 15, 2025 (one week after start)
    requiresDevice: false, 
    challenge_id: 'cn_oura_sleep_week_score'
  },
  {
    id: 'cn_oura_sleep_week_score3',
    name: 'Oura Sleep Week Emerge',
    tier: 1,
    duration: 7,
    category: 'Contests',
    description: `Achieve the highest average weekly Sleep Score from your Oura Ring app.`,
    expertReference: 'Health Rocket Team - Gamifying Health to Increase HealthSpan',
    learningObjectives: [
      'Master sleep optimization',
      'Develop consistent sleep tracking',
      'Build sleep-focused habits'
    ],
    requirements: [
      {
        description: 'Daily and Weekly sleep score screenshot posts (100% of score)',
        verificationMethod: 'verification_posts',
        weight: 100
      }
    ],
    implementationProtocol: {
      week1: 'Track and post your daily sleep score from the Oura Ring app each day. On the final day, post your weekly sleep score average from the Oura Ring app.'
    },
    howToPlay: {
      description: 'Join this Contest to compete for prizes while optimizing your sleep quality:',
      steps: [
        'Register with 1 Contest Entry Credit to secure your spot',
        'Post daily sleep score screenshots in the Challenge Chat',
        'Post your weekly sleep score average on the final day',
        'Track your progress on the leaderboard',
        'Top 10% share 75% of prize pool, top 50% get credit back'
      ]
    },
    relatedCategories: ["Sleep"],
    successMetrics: [
      'Daily verification posts (0/7 days)',
      'Weekly average verification post (0/1 final day)', 
      'Daily Sleep boosts (0/7)'
    ],
    expertTips: [
      'Maintain consistent sleep/wake times',
      'Optimize bedroom temperature (65-67°F)',
      'Limit blue light exposure before bed',
      'Practice relaxation techniques',
      'Track and optimize your sleep latency'
    ],
    fuelPoints: 150,
    status: 'available',
    isPremium: true,
    verifications_required: 8,
    entryFee: 1, 
    minPlayers: 4,
    startDate: '2025-06-15T04:00:00.000Z',  // June 15, 2025
   registrationEndDate: '2025-06-22T04:00:00.000Z', // June 22, 2025 (one week after start)
    requiresDevice: false, 
    challenge_id: 'cn_oura_sleep_week_score3',
    community_id: 'c4ee186a-4182-4298-a9ad-3e101e532792', // Gobundance Emerge community ID
    community_name: 'Gobundance Emerge'
  },
  {
    id: 'cn_hoka_running_strava',
    name: 'HOKA Running Challenge',
    tier: 1,
    duration: 7,
    category: 'Contests',
    description: `Complete the most running distance tracked via Strava to win HOKA running gear.`,
    expertReference: 'Health Rocket Team - Gamifying Health to Increase HealthSpan',
    learningObjectives: [
      'Build consistent running habits',
      'Improve cardiovascular fitness',
      'Track running performance'
    ],
    requirements: [
      {
        description: 'Daily Strava running activity screenshots (100% of score)',
        verificationMethod: 'verification_posts',
        weight: 100
      }
    ],
    implementationProtocol: {
      week1: 'Track and post your daily running activities from Strava each day. Include distance, pace, and route screenshots.'
    },
    howToPlay: {
      description: 'Join this Contest to compete for HOKA running gear while building your running fitness:',
      steps: [
        'Register with 1 Contest Entry Credit to secure your spot',
        'Post daily Strava running activity screenshots in the Challenge Chat',
        'Track your cumulative distance on the leaderboard',
        'Complete at least 3 runs during the week to qualify',
        'Top 10% share 75% of prize pool, top 50% get credit back'
      ]
    },
    relatedCategories: ["Exercise"],
    successMetrics: [
      'Daily running verification posts (0/7 days)',
      'Minimum 3 qualifying runs completed',
      'Daily Exercise boosts (0/7)'
    ],
    expertTips: [
      'Start with comfortable distances and build gradually',
      'Focus on consistent pace rather than speed',
      'Include proper warm-up and cool-down',
      'Stay hydrated and listen to your body',
      'Track your progress and celebrate improvements'
    ],
    fuelPoints: 150,
    status: 'available',
    isPremium: true,
    verifications_required: 7,
    entryFee: 1,
    minPlayers: 4,
    startDate: '2025-06-22T04:00:00.000Z',  // June 22, 2025
    registrationEndDate: '2025-06-29T04:00:00.000Z', // June 29, 2025 (one week after start)
    requiresDevice: false,
    challenge_id: 'cn_hoka_running_strava'
  }
];