import { sleepBoosts } from './sleepBoosts';
import { mindsetBoosts } from './mindsetBoosts';
import { exerciseBoosts } from './exerciseBoosts';
import { nutritionBoosts } from './nutritionBoosts';
import { biohackingBoosts } from './biohackingBoosts';

// Combine all boosts into a single collection
export const boosts = [
  ...sleepBoosts,
  ...mindsetBoosts,
  ...exerciseBoosts,
  ...nutritionBoosts,
  ...biohackingBoosts
];