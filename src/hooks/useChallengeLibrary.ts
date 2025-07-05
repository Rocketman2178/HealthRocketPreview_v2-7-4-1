import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Challenge } from '../types/dashboard';

interface UseChallengeLibraryOptions {
  category?: string;
  tier?: number;
  isActive?: boolean;
  limit?: number;
}

export function useChallengeLibrary(options: UseChallengeLibraryOptions = {}) {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchChallenges = async () => {
      try {
        setLoading(true);
        setError(null);

        // Build query
        let query = supabase
          .from('challenge_library')
          .select('*');

        // Apply filters
        if (options.category) {
          query = query.eq('category', options.category);
        }
        
        if (options.tier !== undefined) {
          query = query.eq('tier', options.tier);
        }
        
        if (options.isActive !== undefined) {
          query = query.eq('is_active', options.isActive);
        } else {
          // Default to active challenges only
          query = query.eq('is_active', true);
        }
        
        // Apply limit if specified
        if (options.limit) {
          query = query.limit(options.limit);
        }
        
        // Order by tier and name
        query = query.order('tier').order('name');

        const { data, error: fetchError } = await query;

        if (fetchError) throw fetchError;

        // Transform data to match Challenge type
        const transformedChallenges: Challenge[] = data?.map(challenge => ({
          id: challenge.id,
          challenge_id: challenge.id,
          name: challenge.name,
          category: challenge.category,
          tier: challenge.tier,
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
          metadata: challenge.metadata
        })) || [];

        setChallenges(transformedChallenges);
      } catch (err) {
        console.error('Error fetching challenges:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch challenges'));
      } finally {
        setLoading(false);
      }
    };

    fetchChallenges();
  }, [options.category, options.tier, options.isActive, options.limit]);

  return { challenges, loading, error };
}