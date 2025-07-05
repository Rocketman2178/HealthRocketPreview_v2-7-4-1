import React, { useState, useEffect, useRef } from "react";
import { X, Heart, Activity, Info, Brain, Moon, Apple, Database } from "lucide-react";
import { Card } from "../ui/card";
import type { CategoryScores, Gender } from "../../lib/health/types";
import { Tooltip } from "../ui/tooltip";
import { CategoryScoreTooltip } from "./CategoryScoreTooltips";

interface HealthUpdateFormProps {
  onClose: () => void;
  onSubmit: (data: HealthUpdateData) => void;
  loading?: boolean;
  setLoading?: (loading: boolean) => void;
  error?: Error | null;
  isOnboarding?: boolean;
  buttonText?: string;
  showBackButton?: boolean;
  canUpdate?: boolean;
  daysUntilUpdate?: number;
  previousAssessment?: {
    expected_lifespan: number;
    expected_healthspan: number;
    mindset_score: number;
    sleep_score: number;
    exercise_score: number;
    nutrition_score: number;
    biohacking_score: number;
    health_goals?: string;
    gender?: string;
  };
}

interface HealthUpdateData {
  expectedLifespan: number;
  expectedHealthspan: number;
  gender: Gender;
  categoryScores: CategoryScores;
  healthGoals: string;
}

export function HealthUpdateForm({
  onClose,
  onSubmit,
  loading = false,
  setLoading,
  error = null,
  isOnboarding = false,
  buttonText = "Complete Assessment",
  showBackButton = false,
  canUpdate = true,
  daysUntilUpdate = 0,
  previousAssessment,
}: HealthUpdateFormProps) {
  const [formData, setFormData] = useState<HealthUpdateData>({
    expectedLifespan: previousAssessment?.expected_lifespan || 85,
    expectedHealthspan: previousAssessment?.expected_healthspan || 75,
    gender: previousAssessment?.gender as Gender || 'Male',
    categoryScores: {
      mindset: previousAssessment?.mindset_score || 7.0,
      sleep: previousAssessment?.sleep_score || 7.0,
      exercise: previousAssessment?.exercise_score || 7.0,
      nutrition: previousAssessment?.nutrition_score || 7.0,
      biohacking: previousAssessment?.biohacking_score || 7.0,
    },
    healthGoals: previousAssessment?.health_goals || '',
  });
  
  // State for button press handling
  const [activeButton, setActiveButton] = useState<string | null>(null);
  const [buttonInterval, setButtonInterval] = useState<NodeJS.Timeout | null>(null);
  const [buttonSpeed, setButtonSpeed] = useState<number>(500);
  const speedIncreaseRef = useRef<NodeJS.Timeout | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      onSubmit(formData);
    } catch (err) {
      console.error("Form validation error:", err);
    } finally {
      setLoading?.(false);
    }
  };

  // Handle button press start
  const handleButtonDown = (action: string, increment: number, field: string, min: number, max: number) => {
    // Clear any existing intervals
    if (buttonInterval) {
      clearInterval(buttonInterval);
    }
    
    // Set the active button
    setActiveButton(action);
    
    // Initial speed
    setButtonSpeed(100); // Ultra-fast initial speed
    
    // Perform the action immediately
    updateValue(field, increment, min, max);
    
    // Set up an interval to repeat the action
    const interval = setInterval(() => {
      updateValue(field, increment, min, max);
    }, buttonSpeed);
    
    setButtonInterval(interval);
    
    // Set up speed increase
    speedIncreaseRef.current = setTimeout(() => {
      if (buttonInterval) {
        clearInterval(buttonInterval);
      }
      
      // Faster interval after initial delay
      const fasterInterval = setInterval(() => {
        updateValue(field, increment, min, max);
      }, 20); // Ultra-fast second stage
      
      setButtonInterval(fasterInterval);
      
      // Trigger dashboard update with FP earned
      window.dispatchEvent(new CustomEvent('dashboardUpdate', {
        detail: {
          fpEarned: data.fp_bonus || Math.round(nextLevelPoints * 0.1),
          updatedPart: 'health_assessment',
          category: 'general'
        }
      }));
      
      // Even faster after another delay
      setTimeout(() => {
        if (buttonInterval) {
          clearInterval(buttonInterval);
        }
        
        // Very fast interval
        const fastestInterval = setInterval(() => {
          updateValue(field, increment, min, max);
        }, 5); // Extremely fast third stage
        
        setButtonInterval(fastestInterval);
      }, 300); // Reach fastest stage much sooner
    }, 300); // Reach second stage much sooner
  };
  
  // Handle button release
  const handleButtonUp = () => {
    if (buttonInterval) {
      clearInterval(buttonInterval);
      setButtonInterval(null);
    }
    
    if (speedIncreaseRef.current) {
      clearTimeout(speedIncreaseRef.current);
      speedIncreaseRef.current = null;
    }
    
    setActiveButton(null);
  };
  
  // Update value based on field
  const updateValue = (field: string, increment: number, min: number, max: number) => {
    setFormData(prev => {
      if (field === 'expectedLifespan') {
        const newValue = Math.max(min, Math.min(max, prev.expectedLifespan + increment));
        return { ...prev, expectedLifespan: newValue };
      } else if (field === 'expectedHealthspan') {
        const newValue = Math.max(min, Math.min(Math.min(max, prev.expectedLifespan), prev.expectedHealthspan + increment));
        return { ...prev, expectedHealthspan: newValue };
      } else {
        // For category scores
        const categoryField = field as keyof CategoryScores;
        const currentValue = prev.categoryScores[categoryField];
        const newValue = Math.max(1, Math.min(10, currentValue + increment));
        
        return {
          ...prev,
          categoryScores: {
            ...prev.categoryScores,
            [categoryField]: newValue
          }
        };
      }
    });
  };

  const handleScoreChange = (category: keyof CategoryScores, value: number) => {
    setFormData((prev) => ({
      ...prev,
      categoryScores: {
        ...prev.categoryScores,
        [category]: value,
      },
    }));
  };

  const renderScoreTooltip = (category: string) => {
    const tooltips = {
      mindset: "Rate your mental well-being, stress management, and cognitive performance on a scale of 1-10",
      sleep: "Evaluate your sleep quality, duration, and recovery effectiveness on a scale of 1-10",
      exercise: "Assess your physical activity level, strength, and endurance on a scale of 1-10",
      nutrition: "Rate your diet quality, eating habits, and nutritional balance on a scale of 1-10",
      biohacking: "Evaluate your use of health optimization tools and technologies on a scale of 1-10",
    };
    return tooltips[category as keyof typeof tooltips];
  };

  // Clean up intervals on unmount
  useEffect(() => {
    return () => {
      if (buttonInterval) {
        clearInterval(buttonInterval);
      }
      if (speedIncreaseRef.current) {
        clearTimeout(speedIncreaseRef.current);
      }
    };
  }, [buttonInterval]);

  return (
    <div
      className={
        isOnboarding
          ? ""
          : "bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      }
    >
      <div
        className={`w-full max-w-lg bg-gray-800 rounded-lg shadow-xl ${
          isOnboarding ? "" : "flex flex-col"
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <Activity className="text-orange-500" size={24} />
            <h2 className="text-xl font-bold text-white mb-1">
              {isOnboarding
                ? "Complete Health Assessment"
                : "Update Health Profile"}
            </h2>
          </div>
          {!isOnboarding && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-300 transition-colors"
            >
              <X size={24} />
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-6">
          {/* Life Expectancy Section */}
          <Card className="p-4 bg-gray-700/50">
            <div className="flex flex-col gap-2 mb-4">
              <Heart className="text-orange-500" size={20} />
              <h3 className="text-lg font-bold text-white">
                Lifespan and HealthSpan
              </h3>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex flex-col gap-2 mb-2">
                  <label className="text-sm text-gray-300">
                    Expected Lifespan
                  </label>
                  <p className="text-xs text-gray-400">
                    Your estimated total lifespan based on current health
                    trajectory and family history. Enter a value of 50 or
                    greater.
                  </p>
                </div>
                <div className="flex items-center justify-center gap-4">
                  <button
                    type="button"
                    onMouseDown={() => handleButtonDown('lifespan-dec', -1, 'expectedLifespan', 50, 200)}
                    onMouseUp={handleButtonUp}
                    onMouseLeave={handleButtonUp}
                    onTouchStart={() => handleButtonDown('lifespan-dec', -1, 'expectedLifespan', 50, 200)}
                    onTouchEnd={handleButtonUp}
                    disabled={!canUpdate && !isOnboarding}
                    className={`w-12 h-12 rounded-full text-white text-2xl font-bold flex items-center justify-center transition-colors ${
                      !canUpdate && !isOnboarding
                        ? "bg-gray-600 cursor-not-allowed"
                        : "bg-orange-500 hover:bg-orange-600"
                    }`}
                  >
                    -
                  </button>
                  <span className="text-2xl font-bold text-white w-20 text-center">
                    {formData.expectedLifespan}
                  </span>
                  <button
                    type="button"
                    onMouseDown={() => handleButtonDown('lifespan-inc', 1, 'expectedLifespan', 50, 200)}
                    onMouseUp={handleButtonUp}
                    onMouseLeave={handleButtonUp}
                    onTouchStart={() => handleButtonDown('lifespan-inc', 1, 'expectedLifespan', 50, 200)}
                    onTouchEnd={handleButtonUp}
                    disabled={!canUpdate && !isOnboarding}
                    className={`w-12 h-12 rounded-full text-white text-2xl font-bold flex items-center justify-center transition-colors ${
                      !canUpdate && !isOnboarding
                        ? "bg-gray-600 cursor-not-allowed"
                        : "bg-orange-500 hover:bg-orange-600"
                    }`}
                  >
                    +
                  </button>
                </div>
              </div>

              <div>
                <div className="flex flex-col gap-2 mb-2">
                  <label className="text-sm text-gray-300">
                    Expected HealthSpan
                  </label>
                  <p className="text-xs text-gray-400">
                    The number of years you expect to maintain good health,
                    mobility, and independence. Enter a value of 50 or greater,
                    but less than your Expected Lifespan.
                  </p>
                </div>
                <div className="flex items-center justify-center gap-4">
                  <button
                    type="button"
                    onMouseDown={() => handleButtonDown('healthspan-dec', -1, 'expectedHealthspan', 50, formData.expectedLifespan)}
                    onMouseUp={handleButtonUp}
                    onMouseLeave={handleButtonUp}
                    onTouchStart={() => handleButtonDown('healthspan-dec', -1, 'expectedHealthspan', 50, formData.expectedLifespan)}
                    onTouchEnd={handleButtonUp}
                    disabled={!canUpdate && !isOnboarding}
                    className={`w-12 h-12 rounded-full text-white text-2xl font-bold flex items-center justify-center transition-colors ${
                      !canUpdate && !isOnboarding
                        ? "bg-gray-600 cursor-not-allowed"
                        : "bg-orange-500 hover:bg-orange-600"
                    }`}
                  >
                    -
                  </button>
                  <span className="text-2xl font-bold text-white w-20 text-center">
                    {formData.expectedHealthspan}
                  </span>
                  <button
                    type="button"
                    onMouseDown={() => handleButtonDown('healthspan-inc', 1, 'expectedHealthspan', 50, formData.expectedLifespan)}
                    onMouseUp={handleButtonUp}
                    onMouseLeave={handleButtonUp}
                    onTouchStart={() => handleButtonDown('healthspan-inc', 1, 'expectedHealthspan', 50, formData.expectedLifespan)}
                    onTouchEnd={handleButtonUp}
                    disabled={!canUpdate && !isOnboarding}
                    className={`w-12 h-12 rounded-full text-white text-2xl font-bold flex items-center justify-center transition-colors ${
                      !canUpdate && !isOnboarding
                        ? "bg-gray-600 cursor-not-allowed"
                        : "bg-orange-500 hover:bg-orange-600"
                    }`}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </Card>

          {/* Health Categories Section */}
          <Card className="p-4 bg-gray-700/50">
            <h3 className="text-lg font-bold text-white mb-4">
              Health Categories
            </h3>
            <div className="space-y-4">
              {Object.entries(formData.categoryScores).map(
                ([category, score]) => (
                  <div key={category}>
                    <div className="flex flex-col gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        {category === 'mindset' && <Brain size={16} className="text-orange-500" />}
                        {category === 'sleep' && <Moon size={16} className="text-orange-500" />}
                        {category === 'exercise' && <Activity size={16} className="text-orange-500" />}
                        {category === 'nutrition' && <Apple size={16} className="text-orange-500" />}
                        {category === 'biohacking' && <Database size={16} className="text-orange-500" />}
                        <label className="text-sm text-gray-300 capitalize font-medium">
                          {category}
                        </label>
                        <Tooltip content={<CategoryScoreTooltip category={category} />}>
                          <Info size={14} className="text-gray-400 hover:text-gray-300 cursor-pointer" />
                        </Tooltip>
                      </div>
                      <p className="text-xs text-gray-400">
                        {renderScoreTooltip(category)}
                      </p>
                    </div>
                    <div className="flex items-center justify-center gap-4">
                      <button
                        type="button"
                        onMouseDown={() => handleButtonDown(`${category}-dec`, -0.1, category, 1, 10)}
                        onMouseUp={handleButtonUp}
                        onMouseLeave={handleButtonUp}
                        onTouchStart={() => handleButtonDown(`${category}-dec`, -0.1, category, 1, 10)}
                        onTouchEnd={handleButtonUp}
                        disabled={!canUpdate && !isOnboarding}
                        className={`w-12 h-12 rounded-full text-white text-2xl font-bold flex items-center justify-center transition-colors ${
                          !canUpdate && !isOnboarding
                            ? "bg-gray-600 cursor-not-allowed"
                            : "bg-blue-500 hover:bg-blue-600"
                        }`}
                      >
                        -
                      </button>
                      <span className="text-2xl font-bold text-white w-20 text-center">
                        {score.toFixed(1)}
                      </span>
                      <button
                        type="button"
                        onMouseDown={() => handleButtonDown(`${category}-inc`, 0.1, category, 1, 10)}
                        onMouseUp={handleButtonUp}
                        onMouseLeave={handleButtonUp}
                        onTouchStart={() => handleButtonDown(`${category}-inc`, 0.1, category, 1, 10)}
                        onTouchEnd={handleButtonUp}
                        disabled={!canUpdate && !isOnboarding}
                        className={`w-12 h-12 rounded-full text-white text-2xl font-bold flex items-center justify-center transition-colors ${
                          !canUpdate && !isOnboarding
                            ? "bg-gray-600 cursor-not-allowed"
                            : "bg-blue-500 hover:bg-blue-600"
                        }`}
                      >
                        +
                      </button>
                    </div>
                  </div>
                )
              )}
            </div>
          </Card>

          {/* Health Goals Section */}
          <Card className="p-4 bg-gray-700/50">
            <h3 className="text-lg font-bold text-white mb-4">
              Health Goals
            </h3>
            <div className="space-y-2">
              <label className="text-sm text-gray-300">
                What are your primary health and wellness goals?
              </label>
              <p className="text-xs text-gray-400 mb-2">
                Share your health objectives and what you'd like to achieve. This helps us provide more personalized recommendations.
              </p>
              <textarea
                value={formData.healthGoals}
                onChange={(e) => setFormData(prev => ({ ...prev, healthGoals: e.target.value }))}
                placeholder="Example: Improve sleep quality, increase strength, reduce stress..."
                className="w-full h-32 px-3 py-2 bg-gray-900 text-white rounded-lg border border-gray-700 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none resize-none"
                disabled={!canUpdate && !isOnboarding}
              />
            </div>
          </Card>

          {/* Gender Selection */}
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-300 mb-2">Gender</h3>
            <div className="flex flex-wrap gap-3">
              {['Male', 'Female', 'Prefer Not To Say'].map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, gender: option as Gender }))}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    formData.gender === option
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                  disabled={!canUpdate && !isOnboarding}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-400 text-center">
              {error.message}
            </div>
          )}
          <div className="flex justify-end gap-3">
            {!isOnboarding && (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
            )}
            {isOnboarding && showBackButton && (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Back
              </button>
            )}
            <button
              type="submit"
              disabled={loading || (!canUpdate && !isOnboarding)}
              className="px-4 py-2 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              {loading
                ? "Processing..."
                : isOnboarding
                ? buttonText
                : "Update Profile"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}