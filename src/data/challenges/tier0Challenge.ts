import type { Challenge } from "../../types/game";

export const tier0Challenges: Challenge[] = [
  {
    id: "mb0",
    name: "Morning Basics",
    tier: 0,
    duration: 21,
    category: "Bonus",
    description:
      "Establish a simple but powerful morning routine that touches all five health categories: Mindset, Sleep, Nutrition, Exercise and Biohacking. (Unlocks Tier 1 Expert Challenges)",
    expertReference:
      "Health Rocket Team - Gamifying Health to Increase HealthSpan",
    learningObjectives: [
      "Establish morning routine fundamentals",
      "Build cross-category consistency",
      "Develop daily consistency",
    ],
    requirements: [
      {
        description: "Complete at least 3 of 5 morning actions each day",
        verificationMethod: "daily_actions",
      },
      {
        description: "Check off completed actions in the challenge interface",
        verificationMethod: "action_tracking",
      },
      {
        description: "Complete all 21 days to unlock Tier 1 Challenges",
        verificationMethod: "completion_tracking",
      },
    ],
    implementationProtocol: {
      week1:
        "Complete at least 3 of these 5 actions within 2 hours of waking each day:\n- Mindset: 2-minute gratitude reflection\n- Sleep: Track sleep time or sleep score\n- Exercise: 5-minute stretch\n- Nutrition: Glass of water\n- Biohacking: 5 minutes of morning sunlight exposure",
      week2:
        "Continue completing at least 3 daily actions and check them off in the challenge interface",
      week3:
        "Maintain your routine and track your progress toward 21 completed days",
    },
    verificationMethods: [
      {
        type: "daily_actions",
        description: "Check off completed actions in the challenge interface",
        requiredFrequency: "daily",
      },
    ],
    successMetrics: [
      "Complete at least 3 of 5 actions for 21 days",
      "Track your progress in the challenge interface",
      "Complete all 21 days to unlock Tier 1 Challenges",
    ],
    expertTips: [
      "Morning gratitude practice improves mood, reduces stress hormones, and sets a positive tone for the day",
      "Tracking sleep metrics increases awareness and helps identify patterns for better sleep quality",
      "Morning stretching increases blood flow, improves mobility, and activates your nervous system",
      "Morning hydration jumpstarts metabolism, improves cognitive function, and supports detoxification",
      "Morning sunlight exposure regulates circadian rhythm, improves sleep quality, and boosts vitamin D production",
    ],
    fuelPoints: 50,
    status: "available",
  },
  {
    id: "custom_challenge",
    name: "Custom Challenge",
    tier: 0,
    duration: 21,
    category: "Bonus",
    description:
      "Create your own personalized 21-completion challenge with actions that fit your lifestyle",
    expertReference:
      "Health Rocket Team - Gamifying Health to Increase HealthSpan",
    learningObjectives: [
      "Design personalized daily actions",
      "Build consistency with your own routine",
      "Track progress across all health categories",
    ],
    requirements: [
      {
        description: "Create 3-12 custom daily actions",
        verificationMethod: "action_creation",
      },
      {
        description:
          "Set your daily minimum (how many actions to complete each day)",
        verificationMethod: "minimum_setting",
      },
      {
        description: "Complete your minimum daily actions 21 times",
        verificationMethod: "completion_tracking",
      },
    ],
    implementationProtocol: {
      week1:
        "Design your custom actions and complete your daily minimum each day",
      week2: "Continue completing your daily minimum and track your progress",
      week3: "Maintain your routine and reach 21 total completions",
    },
    verificationMethods: [
      {
        type: "daily_logs",
        description: "Check off completed actions in the challenge interface",
        requiredFrequency: "daily",
      },
    ],
    successMetrics: [
      "Complete your daily minimum 21 times",
      "Track your progress in the challenge interface",
      "Earn escalating FP rewards for each completed custom challenge",
    ],
    expertTips: [
      "Start with actions that are easy to incorporate into your existing routine",
      "Balance actions across different health categories for holistic improvement",
      "Set a realistic daily minimum that you can consistently achieve",
      "Use the expert guidance feature for personalized recommendations",
      "Track patterns in which actions you complete most consistently",
    ],
    fuelPoints: 100,
    status: "available",
  },
];

export const tier0Challenge = tier0Challenges[0];
