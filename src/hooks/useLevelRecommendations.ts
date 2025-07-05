import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface LevelRecommendation {
  id: string;
  title: string;
  description: string;
  priority: number;
  category: string;
  scroll_target: string;
  action?: string;
  level?: number;
}

export interface LevelInfo {
  level: number;
  title: string;
  description?: string;
}

export function useLevelRecommendations(level: number) {
  const [recommendations, setRecommendations] = useState<LevelRecommendation[]>([]);
  const [levelInfo, setLevelInfo] = useState<LevelInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get level recommendations directly from the table
        const { data: levelRecs, error: queryError } = await supabase
          .from('level_recommendations')
          .select('*')
          .eq('level', level)
          .eq('is_active', true)
          .order('priority', { ascending: true });

        if (queryError) throw queryError;

        // Set basic level info
        setLevelInfo({
          level,
          title: `Level ${level}`,
          description: 'Keep going to unlock more features and rewards!'
        });

        setRecommendations(levelRecs || []);

      } catch (err) {
        console.error('Error fetching recommendations:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch recommendations'));
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [level]);

  return { recommendations, levelInfo, loading, error };
}