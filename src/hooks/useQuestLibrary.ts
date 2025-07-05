import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Quest } from '../types/dashboard';

interface UseQuestLibraryOptions {
  category?: string;
  tier?: number;
  isActive?: boolean;
  limit?: number;
}

export function useQuestLibrary(options: UseQuestLibraryOptions = {}) {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchQuests = async () => {
      try {
        setLoading(true);
        setError(null);

        // Build query
        let query = supabase
          .from('quest_library')
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
          // Default to active quests only
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

        // Transform data to match Quest type
        const transformedQuests: Quest[] = data?.map(quest => ({
          id: quest.id,
          name: quest.name,
          category: quest.category,
          tier: quest.tier,
          description: quest.description,
          expertIds: quest.expert_ids,
          challengeIds: quest.challenge_ids,
          requirements: quest.requirements.challengesRequired || 2,
          verificationMethods: quest.verification_methods,
          fuelPoints: quest.fuel_points,
          duration: quest.duration,
          status: 'available',
          progress: 0,
          daysRemaining: quest.duration
        })) || [];

        setQuests(transformedQuests);
      } catch (err) {
        console.error('Error fetching quests:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch quests'));
      } finally {
        setLoading(false);
      }
    };

    fetchQuests();
  }, [options.category, options.tier, options.isActive, options.limit]);

  return { quests, loading, error };
}