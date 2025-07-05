import type { Boost } from '../../types/game';

export const sleepBoosts: Boost[] = [
  {
    id: 'sleep-t1-1',
    name: 'Morning Sunlight',
    description: 'Get 5 minutes of direct morning sunlight within 30-60 minutes of waking.',
    category: 'sleep',
    tier: 1,
    fuelPoints: 1,
    expertReference: {
      name: 'Dr. Andrew Huberman',
      expertise: 'Neuroscience, Circadian Biology'
    },
    healthImpact: 'Morning sunlight exposure sets your circadian clock by triggering suprachiasmatic nucleus activation, suppressing melatonin, and regulating cortisol timing for improved sleep onset 14-16 hours later.',
    verificationMethod: 'Outdoor selfie with timestamp or location data showing morning time'
  },
  {
    id: 'sleep-t1-2',
    name: 'Evening Screen Reduction',
    description: 'Avoid all screens for at least 30 minutes before bedtime.',
    category: 'sleep',
    tier: 1,
    fuelPoints: 2,
    expertReference: {
      name: 'Dr. Matthew Walker',
      expertise: 'Sleep Science, Neuroscience'
    },
    healthImpact: 'Reducing blue light exposure before bed increases natural melatonin production, improves sleep latency (time to fall asleep), and enhances sleep quality by allowing proper brain temperature reduction.',
    verificationMethod: 'Screen time app data or self-report with evening activity photo'
  },
  {
    id: 'sleep-t1-3',
    name: 'Consistent Sleep Schedule',
    description: 'Go to bed and wake up within 30 minutes of your target times.',
    category: 'sleep',
    tier: 1,
    fuelPoints: 3,
    expertReference: {
      name: 'Dr. Michael Breus',
      expertise: 'Clinical Psychology, Sleep Disorders'
    },
    healthImpact: 'Consistent sleep-wake timing strengthens circadian rhythms, improves sleep quality, optimizes hormone release patterns, and reduces risk of metabolic disorders by aligning biological functions with behavior.',
    verificationMethod: 'Sleep tracker data or manual sleep log with timestamps'
  },
  {
    id: 'sleep-t1-4',
    name: 'Bedroom Temperature',
    description: 'Sleep in a room with temperature between 65-68°F (18-20°C).',
    category: 'sleep',
    tier: 1,
    fuelPoints: 4,
    expertReference: {
      name: 'Dr. Kirk Parsley',
      expertise: 'Sleep Medicine, Performance Optimization'
    },
    healthImpact: 'Optimal sleep temperature facilitates core body temperature drop, which triggers deeper sleep stages, improves sleep maintenance, and enhances metabolic recovery processes during sleep.',
    verificationMethod: 'Photo of thermostat setting or temperature sensor data'
  },
  {
    id: 'sleep-t1-5',
    name: 'Sleep Tracker Review',
    description: 'Review your previous night\'s sleep data and identify one improvement.',
    category: 'sleep',
    tier: 1,
    fuelPoints: 5,
    expertReference: {
      name: 'Dan Pardi',
      expertise: 'Sleep Physiology, Behavior Design'
    },
    healthImpact: 'Sleep data review improves sleep behavior through increased awareness, enables identification of disruption patterns, and fosters iterative improvement of sleep hygiene practices for enhanced recovery quality.',
    verificationMethod: 'Screenshot of sleep tracker data with notes on improvements'
  },
  {
    id: 'sleep-t1-6',
    name: 'PM Caffeine Elimination',
    description: 'Avoid all caffeine sources after 12pm to improve sleep quality.',
    category: 'sleep',
    tier: 1,
    fuelPoints: 6,
    expertReference: {
      name: 'Dr. Matthew Walker',
      expertise: 'Sleep Science, Neuroscience'
    },
    healthImpact: 'Afternoon caffeine elimination allows for proper adenosine receptor clearance, improving sleep onset latency, deep sleep quality, and overall sleep architecture by reducing stimulant interference with natural sleep pressure.',
    verificationMethod: 'Self-report with beverage log or caffeine tracking app data'
  },
  {
    id: 'sleep-t2-1',
    name: 'Evening Wind-Down',
    description: 'Complete a 15-minute structured evening wind-down routine.',
    category: 'sleep',
    tier: 2,
    fuelPoints: 7,
    expertReference: {
      name: 'Dr. Matthew Walker',
      expertise: 'Sleep Science, Neuroscience'
    },
    healthImpact: 'A structured wind-down triggers parasympathetic nervous system activation, reduces cortisol and adrenaline levels, prepares the brain for sleep transitions, and significantly improves sleep quality and duration.',
    verificationMethod: 'Photos of wind-down activities or written checklist completion'
  },
  {
    id: 'sleep-t2-2',
    name: 'Sleep Environment Optimization',
    description: 'Spend 15 minutes optimizing your bedroom for light, sound, and comfort.',
    category: 'sleep',
    tier: 2,
    fuelPoints: 8,
    expertReference: {
      name: 'Dr. Kirk Parsley',
      expertise: 'Sleep Medicine, Performance Optimization'
    },
    healthImpact: 'Environmental optimization removes sleep disruption triggers, improves sleep continuity, increases deep sleep percentage, and enhances recovery hormone production during sleep cycles.',
    verificationMethod: 'Before/after photos of bedroom environment changes'
  },
  {
    id: 'sleep-t2-3',
    name: 'Progressive Relaxation',
    description: 'Complete a 15-minute progressive muscle relaxation protocol before sleep.',
    category: 'sleep',
    tier: 2,
    fuelPoints: 9,
    expertReference: {
      name: 'Dr. Michael Breus',
      expertise: 'Clinical Psychology, Sleep Disorders'
    },
    healthImpact: 'Progressive relaxation reduces physical tension, lowers sympathetic nervous system activity, decreases sleep-interfering pain signals, and creates physiological conditions conducive to deeper sleep stages.',
    verificationMethod: 'App completion data or self-report with relaxation position photo'
  }
];