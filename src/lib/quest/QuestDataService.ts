import { supabase } from '../supabase';
import type { Quest } from '../../types/game';

export class QuestDataService {
  static async getQuestDetails(questId: string): Promise<Quest | null> {
    try {
      const { data, error } = await supabase
        .from('quest_library')
        .select('*')
        .eq('id', questId)
        .maybeSingle();
        
      if (error) {
        throw error;
      }
      
      if (!data) return null;
      
      // Transform to Quest type
      const questDetails = {
        id: data.id,
        name: data.name,
        focus: data.category,
        category: data.category,
        description: data.description,
        expertIds: data.expert_ids,
        requirements: {
          challengesRequired: data.requirements.challengesRequired || 2,
          dailyBoostsRequired: data.requirements.dailyBoostsRequired || 45,
          prerequisites: data.requirements.prerequisites || []
        },
        verificationMethods: data.verification_methods,
        fuelPoints: data.fuel_points,
        status: 'available',
        duration: data.duration,
        tier: data.tier
      };
      
      return questDetails;
    } catch (err) {
      console.error('Error fetching quest:', err);
      return null;
    }
  }

  static async validateQuest(questId: string): Promise<boolean> {
    const quest = await this.getQuestDetails(questId);
    return quest !== null;
  }

  static getQuestProgress(
    challengesCompleted: number,
    boostsCompleted: number,
    duration: number
  ): number {
    const challengeWeight = 0.6;
    const boostWeight = 0.4;
    
    const challengeProgress = Math.min(challengesCompleted / 2, 1) * 100;
    const boostProgress = Math.min(boostsCompleted / 45, 1) * 100;
    
    return ((challengeProgress * challengeWeight) + (boostProgress * boostWeight)) / duration * 100;
  }
  
  static async getAllQuests(): Promise<Quest[]> {
    try {
      const { data, error } = await supabase
        .from('quest_library')
        .select('*')
        .eq('is_active', true)
        .order('category')
        .order('tier')
        .order('name');
        
      if (error) throw error;
      
      if (!data || data.length === 0) return [];
      
      // Transform to Quest type
      return data.map(quest => ({
        id: quest.id,
        name: quest.name,
        focus: quest.category,
        category: quest.category,
        description: quest.description,
        expertIds: quest.expert_ids,
        requirements: {
          challengesRequired: quest.requirements.challengesRequired || 2,
          dailyBoostsRequired: quest.requirements.dailyBoostsRequired || 45,
          prerequisites: quest.requirements.prerequisites || []
        },
        verificationMethods: quest.verification_methods,
        fuelPoints: quest.fuel_points,
        status: 'available',
        duration: quest.duration,
        tier: quest.tier
      }));
    } catch (err) {
      console.error('Error fetching all quests:', err);
      return [];
    }
  }
  
  static async getQuestsByCategory(category: string): Promise<Quest[]> {
    try {
      const { data, error } = await supabase
        .from('quest_library')
        .select('*')
        .eq('category', category)
        .eq('is_active', true)
        .order('tier')
        .order('name');
        
      if (error) throw error;
      
      if (!data || data.length === 0) return [];
      
      // Transform to Quest type
      return data.map(quest => ({
        id: quest.id,
        name: quest.name,
        focus: quest.category,
        category: quest.category,
        description: quest.description,
        expertIds: quest.expert_ids,
        requirements: {
          challengesRequired: quest.requirements.challengesRequired || 2,
          dailyBoostsRequired: quest.requirements.dailyBoostsRequired || 45,
          prerequisites: quest.requirements.prerequisites || []
        },
        verificationMethods: quest.verification_methods,
        fuelPoints: quest.fuel_points,
        status: 'available',
        duration: quest.duration,
        tier: quest.tier
      }));
    } catch (err) {
      console.error('Error fetching quests by category:', err);
      return [];
    }
  }
}