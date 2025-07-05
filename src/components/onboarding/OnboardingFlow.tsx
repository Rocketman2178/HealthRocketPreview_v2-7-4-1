import React, { useState } from "react";
import { useSupabase } from "../../contexts/SupabaseContext";
import { OnboardingService } from "../../lib/onboarding/OnboardingService";
import { MissionIntro } from "./steps/MissionIntro";
import { PreviewAccess } from "./steps/PreviewAccess";
import { ArrowLeft } from "lucide-react";
import { CommunitySelect } from "./steps/CommunitySelect";
import { BurnStreakChallenge } from "./steps/BurnStreakChallenge";
import { HealthIntro } from "./steps/HealthIntro";
import { LaunchStep } from "./steps/GuidanceSteps";
import { HealthUpdate } from "./steps/HealthUpdate";
import { Logo } from "../ui/logo";
import { supabase } from "../../lib/supabase";
import { useUser } from "../../hooks/useUser";
import LoadingSpinner from "../common/LoadingSpinner";
export function OnboardingFlow() {
  const { user } = useSupabase();
  const { userData, userLoading, fetchUser } = useUser(user?.id);
  const [isNavigating, setIsNavigating] = React.useState(false);
  const [previousStep, setPreviousStep] = useState<string | null>(null);
  
  const handleLaunch = async () => {
    if (!user || isNavigating) return;
    setIsNavigating(true);
    try {
      await OnboardingService.completeOnboarding(user.id);
    } catch (err) {
      console.error("Error completing onboarding:", err);
      setIsNavigating(false);
      // Reset loading state on error
    }
  };
  
  const handleOnboardingstep = async (step: string) => {
    if (!user?.id) return;
    
    // Save current step as previous step before updating
    setPreviousStep(userData?.onboarding_step || null);
    
    const { error } = await supabase
      .from("users")
      .update({ onboarding_step: step })
      .eq("id", user.id);

    if (error) {
      console.error("Error updating onboarding step:", error.message);
      return;
    }
    await fetchUser();
  };
  
  const handleGoBack = async () => {
    if (!user?.id || !previousStep) return;
    
    // Map current step to previous step
    let stepToGoTo = null;
    
    switch (userData?.onboarding_step) {
      case "preview":
        stepToGoTo = "mission";
        break;
      case "burn-streak":
        stepToGoTo = "preview";
        break;
      case "community":
        stepToGoTo = "burn-streak";
        break;
      case "health-intro":
        stepToGoTo = userData?.plan === 'Preview Access' || 
                    (userData?.plan_status === 'Preview' && userData?.plan === 'Pro Plan') ? 
                    "burn-streak" : "community";
        break;
      case "health-assessment":
        stepToGoTo = "health-intro";
        break;
      case "launch":
        stepToGoTo = "health-assessment";
        break;
      default:
        stepToGoTo = null;
    }
    
    if (stepToGoTo) {
      await handleOnboardingstep(stepToGoTo);
    }
  };
  
  const renderStep = () => {
    switch (userData?.onboarding_step) {
      case "mission":
        return <MissionIntro onAccept={() => handleOnboardingstep("preview")} onBack={null} />;
      case "preview":
        return <PreviewAccess onContinue={() => handleOnboardingstep("burn-streak")} onBack={handleGoBack} />;
      case "burn-streak":
        return <BurnStreakChallenge onContinue={() => {
          // For PREVIEW100 users or EMERGEPREVIEW users, skip community step
          if (userData?.plan === 'Preview Access' || userData?.plan === 'Founders League' || 
              (userData?.plan_status === 'Preview' && userData?.plan === 'Pro Plan')) {
            handleOnboardingstep("health-intro");
          } else {
            handleOnboardingstep("community");
          }
        }} onBack={handleGoBack} />;
      case "community":
        return (
          <CommunitySelect
            onContinue={() => handleOnboardingstep("health-intro")}
            onBack={handleGoBack}
          />
        );
      case "health-intro":
        return (
          <HealthIntro
            onContinue={() => handleOnboardingstep("health-assessment")}
            onBack={handleGoBack}
          />
        );
      case "health-assessment":
        return (
          <HealthUpdate
            onComplete={() => handleOnboardingstep("launch")}
            onBack={handleGoBack}
          />
        );
      case "launch":
        return (
          <LaunchStep onContinue={handleLaunch} isLoading={isNavigating} onBack={handleGoBack} />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center px-4 relative">
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage:
            'url("https://images.unsplash.com/photo-1475274047050-1d0c0975c63e?auto=format&fit=crop&q=80")',
          backgroundPosition: "center",
          backgroundSize: "cover",
        }}
      >
        <div className="absolute inset-0 bg-black/30" />
        
        {/* Back Button - Only show if not on first step */}
        {userData?.onboarding_step !== "mission" && (
          <button 
            onClick={handleGoBack}
            className="absolute top-6 left-6 z-20 text-white bg-gray-800/50 hover:bg-gray-800/80 p-2 rounded-full transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
        )}
      </div>
      <div className="relative z-10 w-full max-w-[480px] pt-12 mb-8">
        <Logo />
      </div>
      <div className="relative z-10 w-full max-w-md">
        <div className="relative z-10 mt-0">
          {userLoading ? (
         <LoadingSpinner/>
          ) : (
            renderStep()
          )}
        </div>
      </div>
    </div>
  );
}
