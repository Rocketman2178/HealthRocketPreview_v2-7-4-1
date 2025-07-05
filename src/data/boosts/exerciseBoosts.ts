import type { Boost } from '../../types/game';

export const exerciseBoosts: Boost[] = [
  {
    id: 'exercise-t1-1',
    name: 'Morning Movement',
    description: 'Complete 5 minutes of gentle movement immediately after waking.',
    category: 'exercise',
    tier: 1,
    fuelPoints: 1,
    expertReference: {
      name: 'Dr. Andy Galpin',
      expertise: 'Exercise Physiology, Performance Science'
    },
    healthImpact: 'Morning movement activates muscle glucose transporters, increases blood flow to brain and muscles, reduces morning stiffness, and triggers neurohormonal cascades that improve mental clarity and energy.',
    verificationMethod: 'Morning timestamp video clip or movement tracker data'
  },
  {
    id: 'exercise-t1-2',
    name: 'Posture Reset',
    description: 'Complete a 5-minute targeted posture correction routine.',
    category: 'exercise',
    tier: 1,
    fuelPoints: 2,
    expertReference: {
      name: 'Ben Patrick',
      expertise: 'Movement Optimization, Joint Health'
    },
    healthImpact: 'Posture correction reduces musculoskeletal stress, optimizes breathing mechanics, decreases pain-causing tension patterns, improves energy levels, and enhances long-term joint health and function.',
    verificationMethod: 'Before/after posture photos or video of correction exercises'
  },
  {
    id: 'exercise-t1-3',
    name: 'Walking Break',
    description: 'Take a 5-minute walking break to break up sedentary periods.',
    category: 'exercise',
    tier: 1,
    fuelPoints: 3,
    expertReference: {
      name: 'Dr. Peter Attia',
      expertise: 'Longevity, Exercise Science'
    },
    healthImpact: 'Brief walking breaks activate lipoprotein lipase, improve glucose regulation, reduce cardiovascular disease risk, enhance cognitive function, and counteract the negative metabolic effects of prolonged sitting.',
    verificationMethod: 'Step count data for the period or GPS track of short walk'
  },
  {
    id: 'exercise-t1-4',
    name: 'Micro-Workout',
    description: 'Complete a 5-minute high-intensity micro-workout (e.g., bodyweight exercises).',
    category: 'exercise',
    tier: 1,
    fuelPoints: 4,
    expertReference: {
      name: 'Eugene Trufkin',
      expertise: 'Fitness Optimization, Time-Efficient Training'
    },
    healthImpact: 'Brief high-intensity exercise triggers EPOC (excess post-exercise oxygen consumption), increases growth hormone production, improves insulin sensitivity, and enhances mitochondrial function and density.',
    verificationMethod: 'Video of workout completion or heart rate data showing intensity'
  },
  {
    id: 'exercise-t1-5',
    name: 'Joint Mobility',
    description: 'Complete a 5-minute joint mobility routine for key joints.',
    category: 'exercise',
    tier: 1,
    fuelPoints: 5,
    expertReference: {
      name: 'Ben Patrick',
      expertise: 'Movement Optimization, Joint Health'
    },
    healthImpact: 'Regular joint mobility work increases synovial fluid production, improves collagen alignment in connective tissues, enhances proprioception, reduces injury risk, and maintains long-term movement capacity.',
    verificationMethod: 'Video clip of mobility routine or photo sequence of exercises'
  },
  {
    id: 'exercise-t1-6',
    name: 'Desk Mobility Break',
    description: 'Complete 5 minutes of targeted mobility exercises to counteract desk posture.',
    category: 'exercise',
    tier: 1,
    fuelPoints: 6,
    expertReference: {
      name: 'Dr. Kelly Starrett',
      expertise: 'Physical Therapy, Mobility Expert'
    },
    healthImpact: 'Regular mobility breaks reverse the negative effects of prolonged sitting, improve thoracic spine mobility, reduce neck and shoulder tension, enhance breathing mechanics, and prevent repetitive strain injuries.',
    verificationMethod: 'Video clip of desk mobility routine or before/after posture photos'
  },

  // Tier 2 (15 minute) Exercise Boosts
  {
    id: 'exercise-t2-1',
    name: 'Zone 2 Cardio',
    description: 'Complete 15 minutes of Zone 2 (conversational pace) cardiovascular exercise.',
    category: 'exercise',
    tier: 2,
    fuelPoints: 7,
    expertReference: {
      name: 'Dr. Peter Attia',
      expertise: 'Longevity, Exercise Science'
    },
    healthImpact: 'Zone 2 training increases mitochondrial density, improves fat oxidation capacity, enhances insulin sensitivity, reduces inflammatory markers, and builds cardiac stroke volume for improved cardiovascular health.',
    verificationMethod: 'Heart rate data showing Zone 2 maintenance or workout tracking app data'
  },
  {
    id: 'exercise-t2-2',
    name: 'Strength Circuit',
    description: 'Complete a 15-minute full-body strength training circuit.',
    category: 'exercise',
    tier: 2,
    fuelPoints: 8,
    expertReference: {
      name: 'Dr. Gabrielle Lyon',
      expertise: 'Muscle-Centric Medicine, Strength Training'
    },
    healthImpact: 'Regular strength training increases muscle mass (protective against age-related decline), improves insulin sensitivity, enhances bone density, regulates inflammation pathways, and supports metabolic health.',
    verificationMethod: 'Video clips of exercises or workout app tracking data'
  },
  {
    id: 'exercise-t2-3',
    name: 'Mobility Flow',
    description: 'Complete a 15-minute integrated mobility flow combining movement patterns.',
    category: 'exercise',
    tier: 2,
    fuelPoints: 9,
    expertReference: {
      name: 'Ben Patrick',
      expertise: 'Movement Optimization, Joint Health'
    },
    healthImpact: 'Integrated mobility flows improve fascial elasticity, enhance neural control of movement, optimize joint function through varied angles, reduce compensatory movement patterns, and build movement confidence.',
    verificationMethod: 'Video of mobility flow sequence or tracking app data with mobility elements'
  }
];