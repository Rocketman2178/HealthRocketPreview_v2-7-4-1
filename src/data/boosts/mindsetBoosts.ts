import type { Boost } from '../../types/game';

export const mindsetBoosts: Boost[] = [
  {
    id: 'mindset-t1-1',
    name: '5 Minute Meditation',
    description: 'Complete a short mindfulness meditation focusing on breath awareness.',
    category: 'mindset',
    tier: 1,
    fuelPoints: 1,
    expertReference: {
      name: 'Dr. Joe Dispenza',
      expertise: 'Neuroscience, Meditation, Mind-Body Connection'
    },
    healthImpact: 'Even brief meditation reduces stress hormones, lowers blood pressure, and improves focus by activating the parasympathetic nervous system and strengthening neural connections in the prefrontal cortex.',
    verificationMethod: 'Screenshot of meditation app timer or selfie during meditation practice'
  },
  {
    id: 'mindset-t1-2',
    name: 'Gratitude Journaling',
    description: 'Write down three specific things you feel grateful for today.',
    category: 'mindset',
    tier: 1,
    fuelPoints: 2,
    expertReference: {
      name: 'Tony Robbins',
      expertise: 'Peak Performance Psychology'
    },
    healthImpact: 'Practicing gratitude increases happiness hormones like dopamine and serotonin, reduces stress hormones like cortisol, and strengthens neural pathways associated with positive thinking.',
    verificationMethod: 'Photo of written journal entry or digital note with timestamp'
  },
  {
    id: 'mindset-t1-3',
    name: 'Morning Intention Setting',
    description: 'Take 5 minutes to set a clear intention for your day and visualize success.',
    category: 'mindset',
    tier: 1,
    fuelPoints: 3,
    expertReference: {
      name: 'Dr. Carol Dweck',
      expertise: 'Growth Mindset Research'
    },
    healthImpact: 'Setting intentions activates the brain\'s goal-oriented pathways, reducing decision fatigue throughout the day and strengthening neural connections that support focused attention.',
    verificationMethod: 'Written intention statement with timestamp or voice memo recording'
  },
  {
    id: 'mindset-t1-4',
    name: 'Deep Breathing Exercise',
    description: 'Complete 10 cycles of deep diaphragmatic breathing (4 counts in, 6 counts out).',
    category: 'mindset',
    tier: 1,
    fuelPoints: 4,
    expertReference: {
      name: 'Dr. Andrew Huberman',
      expertise: 'Neuroscience, Stress Management'
    },
    healthImpact: 'Deep breathing activates the vagus nerve, reduces cortisol levels, improves heart rate variability, and increases oxygenation throughout the body, promoting mental clarity and emotional regulation.',
    verificationMethod: 'Heart rate monitor data showing reduced heart rate or selfie during practice'
  },
  {
    id: 'mindset-t1-5',
    name: 'Positive Affirmations',
    description: 'Recite or write 5 positive affirmations focused on growth and resilience.',
    category: 'mindset',
    tier: 1,
    fuelPoints: 5,
    expertReference: {
      name: 'Sam Harris',
      expertise: 'Meditation, Consciousness'
    },
    healthImpact: 'Positive affirmations strengthen neural pathways associated with self-confidence and resilience, reducing stress responses and improving immune system function through reduced cortisol production.',
    verificationMethod: 'Written or recorded affirmations with timestamp'
  },
  {
    id: 'mindset-t1-6',
    name: 'Digital Detox Break',
    description: 'Take a 5-minute break from all digital devices and practice present moment awareness.',
    category: 'mindset',
    tier: 1,
    fuelPoints: 6,
    expertReference: {
      name: 'Dr. Andrew Huberman',
      expertise: 'Neuroscience, Focus, Attention'
    },
    healthImpact: 'Brief digital detox periods reduce cognitive load, decrease attention fragmentation, lower stress hormones, and allow for neural network reset that improves subsequent focus and creativity.',
    verificationMethod: 'Before/after photos showing device set aside or screen time app data'
  },
  {
    id: 'mindset-t2-1',
    name: '15 Minute Guided Meditation',
    description: 'Complete a 15-minute guided meditation focused on presence and awareness.',
    category: 'mindset',
    tier: 2,
    fuelPoints: 7,
    expertReference: {
      name: 'Dr. Joe Dispenza',
      expertise: 'Neuroscience, Meditation, Mind-Body Connection'
    },
    healthImpact: 'Extended meditation increases gray matter density in brain regions responsible for focus and emotional regulation, while reducing activity in the default mode network associated with mind-wandering and anxiety.',
    verificationMethod: 'Screenshot of completed meditation app session or video time-lapse'
  },
  {
    id: 'mindset-t2-2',
    name: 'Focused Reading Session',
    description: 'Spend 15 minutes reading material that develops your knowledge or mindset.',
    category: 'mindset',
    tier: 2,
    fuelPoints: 8,
    expertReference: {
      name: 'Dr. Carol Dweck',
      expertise: 'Growth Mindset Research'
    },
    healthImpact: 'Focused reading strengthens neural pathways associated with concentration, expands working memory capacity, and fosters neuroplasticity while reducing stress markers when the material promotes positive thinking.',
    verificationMethod: 'Photo of book with progress markers or reading app screenshot'
  },
  {
    id: 'mindset-t2-3',
    name: 'Visualization Practice',
    description: 'Conduct a detailed visualization session about achieving your goals or improving performance.',
    category: 'mindset',
    tier: 2,
    fuelPoints: 9,
    expertReference: {
      name: 'Tony Robbins',
      expertise: 'Peak Performance Psychology'
    },
    healthImpact: 'Visualization activates the same neural networks as physical practice, strengthening neural pathways for skill execution, reducing performance anxiety, and increasing motivation through dopamine release.',
    verificationMethod: 'Written description of visualization or voice recording of the experience'
  }
];