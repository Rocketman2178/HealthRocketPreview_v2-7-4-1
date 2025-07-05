import type { Boost } from '../../types/game';

export const biohackingBoosts: Boost[] = [
  {
    id: 'biohacking-t1-1',
    name: 'Cold Exposure',
    description: 'Complete 1-3 minutes of cold exposure (shower, plunge, etc.).',
    category: 'biohacking',
    tier: 1,
    fuelPoints: 1,
    expertReference: {
      name: 'Ben Greenfield',
      expertise: 'Performance Optimization, Recovery'
    },
    healthImpact: 'Brief cold exposure activates brown adipose tissue, triggers norepinephrine release, improves cold shock protein production, enhances mitochondrial biogenesis, reduces inflammation, and improves mood and alertness.',
    verificationMethod: 'Photo/video of cold exposure or temperature data verification'
  },
  {
    id: 'biohacking-t1-2',
    name: 'HRV Measurement',
    description: 'Take and record a morning Heart Rate Variability (HRV) measurement.',
    category: 'biohacking',
    tier: 1,
    fuelPoints: 2,
    expertReference: {
      name: 'Dr. Molly Maloof',
      expertise: 'Health Optimization, Personalized Medicine'
    },
    healthImpact: 'Regular HRV monitoring provides insight into autonomic nervous system balance, quantifies recovery status, enables personalized training decisions, tracks stress resilience, and guides lifestyle optimization.',
    verificationMethod: 'Screenshot of HRV reading from tracking device or app'
  },
  {
    id: 'biohacking-t1-3',
    name: 'Light Optimization',
    description: 'Spend 5 minutes optimizing your light environment for current time of day.',
    category: 'biohacking',
    tier: 1,
    fuelPoints: 3,
    expertReference: {
      name: 'Dave Asprey',
      expertise: 'Biohacking, Performance Optimization'
    },
    healthImpact: 'Strategic light exposure regulates circadian hormone production, improves alertness and focus during daytime, enhances melatonin production at night, reduces eye strain, and optimizes sleep-wake cycles.',
    verificationMethod: 'Before/after photos of light environment modifications'
  },
  {
    id: 'biohacking-t1-4',
    name: 'Breathwork Session',
    description: 'Complete a 5-minute structured breathing protocol (box breathing, Wim Hof, etc.).',
    category: 'biohacking',
    tier: 1,
    fuelPoints: 4,
    expertReference: {
      name: 'Siim Land',
      expertise: 'Metabolic Optimization, Biohacking'
    },
    healthImpact: 'Specific breathing techniques optimize autonomic nervous system balance, improve stress resilience, enhance immune function, increase energy production, optimize brain oxygenation, and improve focus and concentration.',
    verificationMethod: 'Video clip of breathing practice or breathing app completion data'
  },
  {
    id: 'biohacking-t1-5',
    name: 'Recovery Tracking',
    description: 'Record key recovery metrics and identify patterns (sleep, stress, soreness).',
    category: 'biohacking',
    tier: 1,
    fuelPoints: 5,
    expertReference: {
      name: 'Dr. Molly Maloof',
      expertise: 'Health Optimization, Personalized Medicine'
    },
    healthImpact: 'Recovery tracking enables personalized lifestyle optimization, identifies recovery-limiting factors, guides appropriate training intensity, helps establish sustainable routines, and maximizes adaptation to stressors.',
    verificationMethod: 'Screenshot of recovery tracking app or journal with metrics'
  },
  {
    id: 'biohacking-t1-6',
    name: 'EMF Reduction',
    description: 'Implement 5 minutes of electromagnetic field (EMF) reduction strategies.',
    category: 'biohacking',
    tier: 1,
    fuelPoints: 6,
    expertReference: {
      name: 'Dave Asprey',
      expertise: 'Biohacking, Environmental Optimization'
    },
    healthImpact: 'EMF reduction may improve sleep quality, reduce cognitive stress, enhance cellular function, support mitochondrial health, and potentially mitigate oxidative stress from excessive electronic device exposure.',
    verificationMethod: 'Before/after photos showing electronics turned off or device settings changes'
  },

  // Tier 2 (15 minute) Biohacking Boosts
  {
    id: 'biohacking-t2-1',
    name: 'Red Light Therapy',
    description: 'Complete a 15-minute targeted red light therapy session.',
    category: 'biohacking',
    tier: 2,
    fuelPoints: 7,
    expertReference: {
      name: 'Dave Asprey',
      expertise: 'Biohacking, Performance Optimization'
    },
    healthImpact: 'Red light therapy increases mitochondrial energy production, promotes tissue repair, reduces inflammation, supports collagen synthesis, improves cellular resilience, and enhances recovery from exercise and stress.',
    verificationMethod: 'Photo of red light therapy session or device timer completion'
  },
  {
    id: 'biohacking-t2-2',
    name: 'Heat Exposure',
    description: 'Complete a 15-minute heat exposure session (sauna, hot bath, etc.).',
    category: 'biohacking',
    tier: 2,
    fuelPoints: 8,
    expertReference: {
      name: 'Dr. Rhonda Patrick',
      expertise: 'Nutritional Biochemistry, Aging'
    },
    healthImpact: 'Heat exposure induces heat shock protein production, increases growth hormone levels, improves cardiovascular function through plasma volume expansion, enhances detoxification, and builds cellular stress resilience.',
    verificationMethod: 'Photo or timer data from sauna session or temperature reading for hot bath'
  },
  {
    id: 'biohacking-t2-3',
    name: 'Biomarker Review',
    description: 'Spend 15 minutes analyzing your health data and identifying improvement areas.',
    category: 'biohacking',
    tier: 2,
    fuelPoints: 9,
    expertReference: {
      name: 'Dr. Molly Maloof',
      expertise: 'Health Optimization, Personalized Medicine'
    },
    healthImpact: 'Regular biomarker analysis enables identification of suboptimal health patterns, guides personalized intervention strategies, tracks improvement over time, and helps prioritize health optimization efforts.',
    verificationMethod: 'Screenshot of biomarker review with notes on improvements or health dashboard data'
  }
];