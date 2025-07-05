import { X, Info } from "lucide-react";
import { HealthSpanCard } from "./HealthSpanCard";
import { HealthScoreCard } from "./HealthScoreCard";
import { HealthGoalsCard } from "./HealthGoalsCard";
import { HealthUpdateTimer } from "./HealthUpdateTimer";
import { DashboardGuide } from "./DashboardGuide";
import { Tooltip } from "../ui/tooltip";
import { useUser } from "../../hooks/useUser";
import { useHealthAssessment } from "../../hooks/useHealthAssessment";
import { useSupabase } from "../../contexts/SupabaseContext";
import type { HealthUpdateData } from "../../lib/health/types";
import { calculateHealthScore } from "../../lib/health/calculators/score";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import type { HealthAssessment } from "../../types/health";
import LoadingSpinner from "../common/LoadingSpinner";
import { VitalSetup } from "./VitalSetup";

interface HealthDashboardProps {
  healthSpanYears: number;
  healthScore: number;
  nextLevelFP: number;
  onClose: () => void;
}

export function HealthDashboard({
  healthSpanYears,
  healthScore,
  nextLevelFP,
  onClose,
}: HealthDashboardProps) {
  const { user } = useSupabase();
  const navigate = useNavigate();
  const [showVitalSetup, setShowVitalSetup] = useState(false);
  const [assessmentHistory, setAssessmentHistory] = useState<HealthAssessment[]>([]);
  const { healthData } = useUser(user?.id);
  const [getVitalUserLoading, setGetVitalUserLoading] = useState(false);
  const [currentVitalUserId, setCurrentVitalUserId] = useState(null);
  const { submitAssessment, daysUntilUpdate, checkEligibility, canUpdate, assessmentHistory: historyData, historyLoading } =
    useHealthAssessment(user?.id);

  // CHECK EXISTING VITAL USER
  const checkExistingVitalUser = async () => {
    if (!user) return null;

    try {
      setGetVitalUserLoading(true);
      // Get current vital user details
      const { data: vitalData, error: vitalError } = await supabase.rpc(
        "get_vital_user",
        {
          p_user_id: user.id,
        }
      );

      if (vitalError) throw vitalError;

      // If user has vital_user_id, return it
      if (vitalData?.vital_user_id) {
        setCurrentVitalUserId(vitalData?.vital_user_id);
      }

      // Try to sync vital user
      const { error: syncError } = await supabase.rpc("sync_vital_user", {
        p_user_id: user.id,
      });

      if (syncError) throw syncError;
    } catch (err) {
      setCurrentVitalUserId(null);
    } finally {
      setGetVitalUserLoading(false);
    }
  };

  useEffect(() => {
    checkExistingVitalUser();
    
    // Fetch assessment history
    const fetchAssessmentHistory = async () => {
      if (!user?.id) return;
      
      try {
        const { data, error } = await supabase
          .from('health_assessments')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true });
          
        if (error) throw error;
        setAssessmentHistory(data || []);
      } catch (err) {
        console.error('Error fetching assessment history:', err);
      }
    };
    
    fetchAssessmentHistory();
  }, [user?.id]);

  const handleDataTrackingClick = () => {
    if (!currentVitalUserId) {
      setShowVitalSetup(true);
    } else {
      // Disabled - do nothing
    }
  };

  const handleUpdate = async (data: HealthUpdateData) => {
    try {
      // Check if update is allowed based on cooldown period
      if (!canUpdate && !healthData?.onboarding_completed) {
        throw new Error(`Must wait ${daysUntilUpdate} days before next health assessment`);
      }

      await submitAssessment(data);

      // Success - assessment was updated
      // Force refresh health data
      try {
        await checkEligibility();
        window.dispatchEvent(new CustomEvent("dashboardUpdate"));
      } catch (refreshErr) {
        console.warn("Error refreshing data after assessment:", refreshErr);
        // Don't show this error to the user
      }
    } catch (err) {
      console.error("Error updating health assessment:", err);
      throw err; // Rethrow to let the form handle the error display
    }
  };

  // Get projected milestones
  const projectedMilestones = {
    projectedTotalYears: 15,
    willReachTarget: false,
    estimatedTimeToTarget: 6.5,
    projectedMilestones: [
      { years: 5, projected: new Date(Date.now() + 7776000000) },
      { years: 10, projected: new Date(Date.now() + 15552000000) },
      { years: 15, projected: new Date(Date.now() + 23328000000) },
      { years: 20, projected: new Date(Date.now() + 31104000000) },
    ],
  };

  const categoryScores = {
    mindset: healthData?.mindset_score || 7.8,
    sleep: healthData?.sleep_score || 7.8,
    exercise: healthData?.exercise_score || 7.8,
    nutrition: healthData?.nutrition_score || 7.8,
    biohacking: healthData?.biohacking_score || 7.8,
  };

  const now = new Date();
  const daysAgo = 45;
  const lastUpdate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

  if (getVitalUserLoading) return <LoadingSpinner />;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 overflow-y-auto">
      <div className="min-h-full flex items-start justify-center p-4">
        <div className="w-full max-w-2xl bg-gray-800 rounded-lg shadow-xl my-8">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-700 relative">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white">Player Health</h2>
              <Tooltip content={<DashboardGuide />}>
                <Info size={16} className="text-gray-400 hover:text-gray-300" />
              </Tooltip>
              <button
                disabled
                className="ml-4 px-3 py-1.5 text-sm bg-gray-600 text-gray-400 rounded-lg cursor-not-allowed"
              >
                Coming Soon
              </button>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-300 transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          <div className="p-4 space-y-6">
            <HealthUpdateTimer
              lastUpdate={lastUpdate}
              nextLevelFP={nextLevelFP}
              onUpdate={handleUpdate}
              canUpdate={canUpdate}
              daysUntilUpdate={daysUntilUpdate}
            />

            <HealthSpanCard
              years={healthSpanYears}
              monthlyGain={0.3}
              totalPotential={20}
              daysUntilUpdate={daysUntilUpdate}
              projectedHealthspan={healthData?.expected_healthspan || 85}
              projectedMilestones={projectedMilestones}
            />

            <HealthScoreCard
              score={healthScore}
              categoryScores={categoryScores}
              assessmentHistory={assessmentHistory}
              daysUntilUpdate={daysUntilUpdate}
              recommendedFocus={[]}
            />
            
            <HealthGoalsCard
              healthGoals={healthData?.health_goals}
              canUpdate={canUpdate}
              assessmentHistory={assessmentHistory}
              daysUntilUpdate={daysUntilUpdate}
            />
          </div>
        </div>
      </div>

      {/* Vital Setup Modal */}
      {showVitalSetup && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-gray-800 rounded-lg max-w-4xl w-full my-8 shadow-xl">
            <VitalSetup
              onComplete={() => {
                setShowVitalSetup(false);
              }}
              onClose={() => setShowVitalSetup(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}