import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Target,
  ChevronRight,
  ChevronLeft,
  Plus,
  Award,
  Radio,
  X,
  Info,
  Loader2,
} from "lucide-react";
import { useCustomChallenge } from "../../../hooks/useCustomChallenge";
import { useSupabase } from "../../../contexts/SupabaseContext";
import type {
  CustomChallengeFormAction,
  CustomChallengeFormData,
} from "../../../types/customChallenge";
import { CustomChallengeActionInput } from "./CustomChallengeActionInput";
const MIN_ACTIONS = 3;
const MAX_ACTIONS = 12;

const genericGuidance =
  "Focus on consistency with your custom actions. Start with the easiest actions to build momentum. Track your progress daily and celebrate small wins. Remember that this challenge is designed specifically for your needs and lifestyle. Stay committed to your 21 completions goal!";

export function CustomChallengeCreator() {
  const navigate = useNavigate();
  const { user } = useSupabase();
  const {
    loading,
    creating,
    completionCount,
    fpCompletionReward,
    fpDailyReward,
    createCustomChallenge,
  } = useCustomChallenge(user?.id);

  const [step, setStep] = useState<"intro" | "actions" | "guidance" | "review">(
    "intro"
  );
  const [formData, setFormData] = useState<CustomChallengeFormData>({
    name: "My Custom Challenge",
    daily_minimum: 1,
    actions: [
      { action_text: "", description: "", category: "Mindset" },
      { action_text: "", description: "", category: "Sleep" },
      { action_text: "", description: "", category: "Exercise" },
    ],
  });
  const [useAiGuidance, setUseAiGuidance] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // // Redirect if user can't create a challenge
  // useEffect(() => {
  //   if (!loading && !canCreate) {
  //     navigate('/');
  //   }
  // }, [loading, canCreate, navigate]);

  const handleAddAction = () => {
    if (formData.actions.length < MAX_ACTIONS) {
      setFormData({
        ...formData,
        actions: [
          ...formData.actions,
          { action_text: "", description: "", category: "Mindset" },
        ],
      });
    }
  };

  const handleRemoveAction = (index: number) => {
    if (formData.actions.length > MIN_ACTIONS) {
      const newActions = [...formData.actions];
      newActions.splice(index, 1);
      setFormData({
        ...formData,
        actions: newActions,
        daily_minimum: Math.min(formData.daily_minimum, newActions.length),
      });
    }
  };

  const handleActionChange = (
    index: number,
    field: keyof CustomChallengeFormAction,
    value: string
  ) => {
    const newActions = [...formData.actions];
    newActions[index] = {
      ...newActions[index],
      [field]: value,
    };
    setFormData({
      ...formData,
      actions: newActions,
    });
  };

  const handleDailyMinimumChange = (value: number) => {
    setFormData({
      ...formData,
      daily_minimum: Math.min(Math.max(1, value), formData.actions.length),
    });
  };

  const validateActions = () => {
    // Check if all actions have text and category
    const invalidActions = formData.actions.filter(
      (action) => !action.action_text.trim()
    );

    if (invalidActions.length > 0) {
      setError("Please provide a name for each action");
      return false;
    }

    setError(null);
    return true;
  };

  const areActionsFilled = () => {
    // Only check if action names are filled
    return formData.actions.every((action) => action.action_text.trim());
  };

  const handleNextStep = async () => {
    if (step === "intro") {
      setStep("actions");
    } else if (step === "actions") {
      if (!validateActions()) return;

      // Skip guidance step and go directly to review
      setStep("review");
    } else if (step === "guidance") {
      setStep("review");
    }
  };

  const handlePrevStep = () => {
    if (step === "actions") {
      setStep("intro");
    } else if (step === "guidance") {
      setStep("actions");
    } else if (step === "review") {
      setStep(useAiGuidance ? "guidance" : "actions");
    }
  };

  const handleSubmit = async () => {
    if (!user?.id) return;

    try {
      setError(null);
      // Create a clean copy of the form data with only the required fields
      const cleanFormData = {
        name: formData.name.trim(),
        daily_minimum: Math.min(
          formData.daily_minimum,
          formData.actions.length
        ),
        expert_guidance: formData.expert_guidance || genericGuidance,
        actions: formData.actions.map((action) => ({
          action_text: action.action_text.trim(),
          description: action.description || "",
          category: action.category,
        })),
      };
      const challengeId = await createCustomChallenge(cleanFormData);

      if (challengeId) {
        // Add a delay before navigation to ensure state updates are processed
        setTimeout(() => {
          // Trigger dashboard update
          window.dispatchEvent(new CustomEvent("dashboardUpdate"));

          // Navigate to the challenge page
          navigate(`/custom-challenge/${challengeId}`);
        }, 1000);
      } else {
        throw new Error("Failed to create challenge");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      // Show error for a few seconds, then clear it
      setTimeout(() => {
        if (error === err.message) {
          setError(null);
        }
      }, 5000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-gray-800 rounded-lg shadow-xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <Target className="text-orange-500" size={24} />
            <h2 className="text-xl font-bold text-white">
              Create Custom Challenge
            </h2>
          </div>
          <button
            onClick={() => navigate("/")}
            className="text-gray-400 hover:text-gray-300"
          >
            <X size={20} />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex justify-between">
            <div
              className={`flex flex-col items-center ${
                step === "intro" ? "text-orange-500" : "text-gray-400"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step === "intro" ? "bg-orange-500 text-white" : "bg-gray-700"
                }`}
              >
                1
              </div>
              <span className="text-xs mt-1">Intro</span>
            </div>
            <div
              className={`flex flex-col items-center ${
                step === "actions" ? "text-orange-500" : "text-gray-400"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step === "actions"
                    ? "bg-orange-500 text-white"
                    : "bg-gray-700"
                }`}
              >
                2
              </div>
              <span className="text-xs mt-1">Actions</span>
            </div>
            {useAiGuidance && (
              <div
                className={`flex flex-col items-center ${
                  step === "guidance" ? "text-orange-500" : "text-gray-400"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    step === "guidance"
                      ? "bg-orange-500 text-white"
                      : "bg-gray-700"
                  }`}
                >
                  3
                </div>
                <span className="text-xs mt-1">Guidance</span>
              </div>
            )}
            <div
              className={`flex flex-col items-center ${
                step === "review" ? "text-orange-500" : "text-gray-400"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step === "review" ? "bg-orange-500 text-white" : "bg-gray-700"
                }`}
              >
                {useAiGuidance ? 4 : 3}
              </div>
              <span className="text-xs mt-1">Review</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === "intro" && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-xl font-bold text-white mb-2">
                  Create Your Custom Challenge
                </h3>
                <p className="text-gray-300">
                  Design a personalized challenge with your own daily actions
                </p>
              </div>

              <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
                <h4 className="text-lg font-medium text-white mb-3 flex items-center gap-2">
                  <Award className="text-orange-500" size={20} />
                  <span>Your Rewards (Custom Challenge)</span>
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Challenge Completion:</span>
                    <span className="text-orange-500 font-medium">
                      +{fpCompletionReward} FP
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Daily Actions:</span>
                    <span className="text-orange-500 font-medium">
                      +{fpDailyReward} FP
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Completions Required:</span>
                    <span className="text-white font-medium">21</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">
                      Previous Custom Challenges:
                    </span>
                    <span className="text-white font-medium">
                      {completionCount}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-2 pt-2 border-t border-orange-500/20">
                    <span className="text-gray-300 font-medium">Note:</span>
                    <span className="text-white">
                      Doesn't count toward your 2-challenge limit
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-700/50 rounded-lg p-4">
                <h4 className="text-lg font-medium text-white mb-3">
                  How It Works
                </h4>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2 text-gray-300">
                    <div className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs text-white">1</span>
                    </div>
                    <span>
                      Create 3-12 daily actions across health categories
                    </span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-300">
                    <div className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs text-white">2</span>
                    </div>
                    <span>
                      Set your daily minimum (how many actions to complete each
                      day)
                    </span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-300">
                    <div className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs text-white">3</span>
                    </div>
                    <span>
                      Complete your minimum daily actions 21 times to finish
                    </span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-300">
                    <div className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs text-white">4</span>
                    </div>
                    <span>Earn daily FP and a completion bonus</span>
                  </li>
                </ul>
              </div>

              <div className="text-center">
                <p className="text-sm text-gray-400 mb-2">
                  Each completed challenge doubles your FP rewards for the next
                  one!
                </p>
              </div>
            </div>
          )}

          {step === "actions" && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Challenge Name
                  <span className="text-xs text-orange-500 ml-2">
                    * All fields required
                  </span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="My Custom Challenge"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-300">
                    Daily Actions ({formData.actions.length}/{MAX_ACTIONS})
                  </label>
                  <button
                    onClick={handleAddAction}
                    disabled={formData.actions.length >= MAX_ACTIONS}
                    className="text-xs text-orange-500 hover:text-orange-400 disabled:text-gray-500 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    <Plus size={12} />
                    <span>Add Action</span>
                  </button>
                </div>
                <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2">
                  {formData.actions.map((action, index) => (
                    <CustomChallengeActionInput
                      key={index}
                      action={action}
                      index={index}
                      onChange={handleActionChange}
                      onRemove={handleRemoveAction}
                      canRemove={formData.actions.length > MIN_ACTIONS}
                    />
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-300">
                    Daily Minimum
                  </label>
                  <div className="text-xs text-gray-400">
                    How many actions you need to complete each day
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min={1}
                    max={formData.actions.length}
                    value={formData.daily_minimum}
                    onChange={(e) =>
                      handleDailyMinimumChange(parseInt(e.target.value))
                    }
                    className="flex-1"
                  />
                  <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center text-white font-bold">
                    {formData.daily_minimum}
                  </div>
                </div>
              </div>

              <div className="bg-gray-700/50 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <Info className="text-orange-500" size={18} />
                  <div className="text-sm text-gray-300">
                    Your challenge will include generic expert guidance to help
                    you succeed.
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === "review" && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-xl font-bold text-white mb-2">
                  Review Your Challenge
                </h3>
                <p className="text-gray-300">
                  Make sure everything looks good before starting
                </p>
              </div>

              <div className="bg-gray-700/50 rounded-lg p-4">
                <h4 className="text-lg font-medium text-white mb-3">
                  {formData.name}
                </h4>
                <div className="flex justify-between items-center mb-4">
                  <div className="text-sm text-gray-300">
                    Daily Minimum:{" "}
                    <span className="text-white font-medium">
                      {formData.daily_minimum}
                    </span>
                  </div>
                  <div className="text-sm text-gray-300">
                    Total Actions:{" "}
                    <span className="text-white font-medium">
                      {formData.actions.length}
                    </span>
                  </div>
                </div>

                <div className="space-y-4 max-h-[30vh] overflow-y-auto pr-2">
                  {formData.actions.map((action, index) => (
                    <div key={index} className="bg-gray-800/50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-xs text-white">
                          {index + 1}
                        </div>
                        <span className="text-white font-medium">
                          {action.action_text}
                        </span>
                      </div>
                      <div className="ml-8">
                        <div className="text-xs text-gray-400 mb-1">
                          {action.description}
                        </div>
                        <div className="text-xs text-orange-500">
                          {action.category}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-700/50 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Radio className="text-orange-500 mt-1" size={20} />
                  <div>
                    <h4 className="text-white font-medium mb-2">
                      Expert Guidance
                    </h4>
                    <p className="text-gray-300 text-sm">
                      Focus on consistency with your custom actions. Start with
                      the easiest actions to build momentum. Track your progress
                      daily and celebrate small wins. Remember that this
                      challenge is designed specifically for your needs and
                      lifestyle. Stay committed to your 21 completions goal!
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
                <h4 className="text-lg font-medium text-white mb-3 flex items-center gap-2">
                  <Award className="text-orange-500" size={20} />
                  <span>Rewards</span>
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Daily Completion:</span>
                    <span className="text-orange-500 font-medium">
                      +{fpDailyReward} FP
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Challenge Completion:</span>
                    <span className="text-orange-500 font-medium">
                      +{fpCompletionReward} FP
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-6">
            {step !== "intro" ? (
              <button
                onClick={handlePrevStep}
                className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-2"
              >
                <ChevronLeft size={16} />
                <span>Back</span>
              </button>
            ) : (
              <button
                onClick={() => navigate("/")}
                className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            )}

            {step !== "review" ? (
              <button
                onClick={handleNextStep}
                disabled={step === "actions" && !areActionsFilled()}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed relative group"
              >
                <span>Next</span>
                <ChevronRight size={16} />
                {step === "actions" && !areActionsFilled() && (
                  <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-800 text-xs text-orange-500 px-3 py-1.5 rounded whitespace-nowrap border border-orange-500/20 opacity-0 group-hover:opacity-100 transition-opacity">
                    Please provide a name for each action
                  </div>
                )}
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={creating}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed min-w-[150px] justify-center"
              >
                {creating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <span>Start Challenge</span>
                    <ChevronRight size={16} />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
