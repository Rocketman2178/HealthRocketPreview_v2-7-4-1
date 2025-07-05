import type { Boost } from '../../types/game';

export const nutritionBoosts: Boost[] = [
  {
    id: 'nutrition-t1-1',
    name: 'Water First',
    description: 'Drink 16oz of water first thing in the morning before any food or caffeine.',
    category: 'nutrition',
    tier: 1,
    fuelPoints: 1,
    expertReference: {
      name: 'Dr. Rhonda Patrick',
      expertise: 'Nutritional Biochemistry, Aging'
    },
    healthImpact: 'Morning hydration jumpstarts metabolism, improves cognitive function, enhances detoxification pathways, supports mucous membrane health, and prepares the digestive system for optimal nutrient absorption.',
    verificationMethod: 'Photo with water container in morning setting or hydration tracking app'
  },
  {
    id: 'nutrition-t1-2',
    name: 'Protein-First Meal',
    description: 'Consume at least 30g of protein in your first meal of the day.',
    category: 'nutrition',
    tier: 1,
    fuelPoints: 2,
    expertReference: {
      name: 'Dr. Gabrielle Lyon',
      expertise: 'Muscle-Centric Medicine, Protein Metabolism'
    },
    healthImpact: 'Morning protein consumption triggers muscle protein synthesis, stabilizes blood glucose, improves satiety hormone release, provides essential amino acids for neurotransmitter production, and optimizes metabolic rate.',
    verificationMethod: 'Photo of protein-rich meal with estimated protein content'
  },
  {
    id: 'nutrition-t1-3',
    name: 'Daily Vegetable Intake',
    description: 'Include at least 3 different colored vegetables in your day\'s meals.',
    category: 'nutrition',
    tier: 1,
    fuelPoints: 3,
    expertReference: {
      name: 'Dr. Mark Hyman',
      expertise: 'Functional Medicine, Nutrition'
    },
    healthImpact: 'Varied vegetable consumption provides diverse phytonutrients that support detoxification pathways, reduce oxidative stress, support gut microbial diversity, enhance cellular protection mechanisms, and reduce inflammation.',
    verificationMethod: 'Photos of meals containing different colored vegetables'
  },
  {
    id: 'nutrition-t1-4',
    name: 'Hydration Tracking',
    description: 'Track your water intake to ensure you drink at least half your bodyweight (lbs) in ounces.',
    category: 'nutrition',
    tier: 1,
    fuelPoints: 4,
    expertReference: {
      name: 'Dr. Casey Means',
      expertise: 'Metabolism, Nutrition'
    },
    healthImpact: 'Proper hydration optimizes cellular function, improves cognitive performance, enhances metabolic processes, supports kidney function, improves exercise recovery, and promotes healthy skin aging.',
    verificationMethod: 'Hydration tracking app screenshot or daily water log'
  },
  {
    id: 'nutrition-t1-5',
    name: 'Meal Logging',
    description: 'Log all food intake for one full day with attention to macronutrients.',
    category: 'nutrition',
    tier: 1,
    fuelPoints: 5,
    expertReference: {
      name: 'Chris Kresser',
      expertise: 'Functional Medicine, Personalized Nutrition'
    },
    healthImpact: 'Meal tracking increases nutritional awareness, identifies potential deficiencies or imbalances, improves portion control, enhances mindful eating patterns, and creates accountability for food choices.',
    verificationMethod: 'Screenshot of food tracking app with full day\'s entries'
  },
  {
    id: 'nutrition-t1-6',
    name: 'Sugar Elimination',
    description: 'Go one full day without consuming any added sugars.',
    category: 'nutrition',
    tier: 1,
    fuelPoints: 6,
    expertReference: {
      name: 'Dr. Robert Lustig',
      expertise: 'Endocrinology, Sugar Metabolism'
    },
    healthImpact: 'Eliminating added sugars reduces insulin spikes, decreases inflammation markers, improves energy stability, enhances insulin sensitivity, reduces triglyceride formation, and supports brain health and clarity.',
    verificationMethod: 'Food log showing no added sugar items or grocery receipt with sugar-free choices'
  },

  // Tier 2 (15 minute) Nutrition Boosts
  {
    id: 'nutrition-t2-1',
    name: 'Meal Preparation',
    description: 'Spend 15 minutes preparing healthy food in advance for upcoming meals.',
    category: 'nutrition',
    tier: 2,
    fuelPoints: 7,
    expertReference: {
      name: 'Dr. Mark Hyman',
      expertise: 'Functional Medicine, Nutrition'
    },
    healthImpact: 'Meal preparation increases consumption of home-cooked nutrient-dense foods, reduces reliance on processed foods, improves dietary variety, supports portion control, and enhances overall metabolic health.',
    verificationMethod: 'Photos of prepared meals or meal prep process with ingredients'
  },
  {
    id: 'nutrition-t2-2',
    name: 'Mindful Eating',
    description: 'Eat one meal with complete mindfulness and no distractions for 15+ minutes.',
    category: 'nutrition',
    tier: 2,
    fuelPoints: 8,
    expertReference: {
      name: 'Dr. Mark Hyman',
      expertise: 'Functional Medicine, Nutrition'
    },
    healthImpact: 'Mindful eating improves vagal tone, enhances digestive enzyme secretion, improves nutrient absorption, reduces stress-related digestive issues, increases meal satisfaction, and supports healthy weight management.',
    verificationMethod: 'Written reflection on mindful eating experience or photo of dedicated eating space'
  },
  {
    id: 'nutrition-t2-3',
    name: 'Glucose Optimization',
    description: 'Implement specific strategies to keep post-meal glucose increase below 30mg/dL.',
    category: 'nutrition',
    tier: 2,
    fuelPoints: 9,
    expertReference: {
      name: 'Dr. Casey Means',
      expertise: 'Metabolism, Nutrition'
    },
    healthImpact: 'Glucose management reduces glycemic variability, improves insulin sensitivity, reduces inflammation, supports stable energy levels, enhances cognitive performance, and improves long-term metabolic health.',
    verificationMethod: 'CGM data showing minimal glucose spike or photos of glucose-optimized meal structure'
  }
];