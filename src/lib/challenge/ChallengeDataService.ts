import { supabase } from '../supabase';
import type { Challenge } from '../../types/dashboard';

export class ChallengeDataService {
  /**
   * Fetches a challenge by ID from the database
   */
  static async getChallengeById(challengeId: string): Promise<Challenge | null> {
    try {
      const { data, error } = await supabase
        .from('challenge_library')
        .select('*')
        .eq('id', challengeId)
        .maybeSingle();
        
      if (error) {
        throw error;
      }
      
      if (!data) return null;
      
      // Transform to Challenge type
      return {
        id: data.id,
        challenge_id: data.id,
        name: data.name,
        category: data.category,
        description: data.description,
        expertReference: data.expert_reference,
        learningObjectives: data.learning_objectives,
        requirements: data.requirements,
        implementationProtocol: data.implementation_protocol,
        verificationMethod: data.verification_method,
        successMetrics: data.success_metrics,
        expertTips: data.expert_tips,
        fuelPoints: data.fuel_points,
        duration: data.duration,
        status: 'available',
        progress: 0,
        daysRemaining: data.duration,
        tier: data.tier
      };
    } catch (err) {
      console.error('Error fetching challenge:', err);
      return null;
    }
  }
  
  /**
   * Fetches challenges by category from the database
   */
  static async getChallengesByCategory(category: string): Promise<Challenge[]> {
    try {
      const { data, error } = await supabase
        .from('challenge_library')
        .select('*')
        .eq('category', category)
        .eq('is_active', true)
        .order('tier')
        .order('name');
        
      if (error) throw error;
      
      if (!data || data.length === 0) return [];
      
      // Transform to Challenge type
      return data.map(challenge => ({
        id: challenge.id,
        challenge_id: challenge.id,
        name: challenge.name,
        category: challenge.category,
        description: challenge.description,
        expertReference: challenge.expert_reference,
        learningObjectives: challenge.learning_objectives,
        requirements: challenge.requirements,
        implementationProtocol: challenge.implementation_protocol,
        verificationMethod: challenge.verification_method,
        successMetrics: challenge.success_metrics,
        expertTips: challenge.expert_tips,
        fuelPoints: challenge.fuel_points,
        duration: challenge.duration,
        status: 'available',
        progress: 0,
        daysRemaining: challenge.duration,
        tier: challenge.tier
      }));
    } catch (err) {
      console.error('Error fetching challenges by category:', err);
      return [];
    }
  }
  
  /**
   * Fetches all challenges from the database
   */
  static async getAllChallenges(): Promise<Challenge[]> {
    try {
      const { data, error } = await supabase
        .from('challenge_library')
        .select('*')
        .eq('is_active', true)
        .order('category')
        .order('tier')
        .order('name');
        
      if (error) throw error;
      
      if (!data || data.length === 0) return [];
      
      // Transform to Challenge type
      return data.map(challenge => ({
        id: challenge.id,
        challenge_id: challenge.id,
        name: challenge.name,
        category: challenge.category,
        description: challenge.description,
        expertReference: challenge.expert_reference,
        learningObjectives: challenge.learning_objectives,
        requirements: challenge.requirements,
        implementationProtocol: challenge.implementation_protocol,
        verificationMethod: challenge.verification_method,
        successMetrics: challenge.success_metrics,
        expertTips: challenge.expert_tips,
        fuelPoints: challenge.fuel_points,
        duration: challenge.duration,
        status: 'available',
        progress: 0,
        daysRemaining: challenge.duration,
        tier: challenge.tier
      }));
    } catch (err) {
      console.error('Error fetching all challenges:', err);
      return [];
    }
  }
}