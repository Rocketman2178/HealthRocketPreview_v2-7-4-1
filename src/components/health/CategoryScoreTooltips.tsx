import React from 'react';
import { Brain, Moon, Activity, Apple, Database } from 'lucide-react';

interface CategoryScoreTooltipProps {
  category: string;
}

export function CategoryScoreTooltip({ category }: CategoryScoreTooltipProps) {
  const getContent = () => {
    switch (category.toLowerCase()) {
      case 'mindset':
        return (
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-white text-sm mb-1">Mindset Score Guide</h4>
              <p className="text-gray-300 text-xs">
                Rate your mental well-being, stress management, and cognitive performance on a scale of 1-10.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-white text-sm mb-1">Consider These Factors:</h4>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <div className="mt-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                  </div>
                  <div>
                    <div className="text-gray-300 font-medium text-xs">Stress Management</div>
                    <p className="text-gray-400 text-xs">How well you handle daily stressors and maintain emotional balance</p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <div className="mt-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                  </div>
                  <div>
                    <div className="text-gray-300 font-medium text-xs">Focus & Concentration</div>
                    <p className="text-gray-400 text-xs">Your ability to maintain attention and mental clarity</p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <div className="mt-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                  </div>
                  <div>
                    <div className="text-gray-300 font-medium text-xs">Emotional Resilience</div>
                    <p className="text-gray-400 text-xs">How quickly you recover from setbacks and challenges</p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <div className="mt-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                  </div>
                  <div>
                    <div className="text-gray-300 font-medium text-xs">Cognitive Performance</div>
                    <p className="text-gray-400 text-xs">Your mental processing speed and decision-making ability</p>
                  </div>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white text-sm mb-1">Expert Reference:</h4>
              <p className="text-gray-300 text-xs">
                Dr. Joe Dispenza recommends daily mindfulness practices and visualization techniques to optimize mental performance and resilience.
              </p>
            </div>
          </div>
        );
      
      case 'sleep':
        return (
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-white text-sm mb-1">Sleep Score Guide</h4>
              <p className="text-gray-300 text-xs">
                Evaluate your sleep quality, duration, and recovery effectiveness on a scale of 1-10.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-white text-sm mb-1">Consider These Factors:</h4>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <div className="mt-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                  </div>
                  <div>
                    <div className="text-gray-300 font-medium text-xs">Sleep Duration</div>
                    <p className="text-gray-400 text-xs">Consistently getting 7-9 hours of sleep per night</p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <div className="mt-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                  </div>
                  <div>
                    <div className="text-gray-300 font-medium text-xs">Sleep Quality</div>
                    <p className="text-gray-400 text-xs">Deep sleep percentage and minimal disruptions</p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <div className="mt-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                  </div>
                  <div>
                    <div className="text-gray-300 font-medium text-xs">Sleep Consistency</div>
                    <p className="text-gray-400 text-xs">Regular sleep/wake times and circadian rhythm alignment</p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <div className="mt-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                  </div>
                  <div>
                    <div className="text-gray-300 font-medium text-xs">Recovery Effectiveness</div>
                    <p className="text-gray-400 text-xs">Waking refreshed and maintaining energy throughout the day</p>
                  </div>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white text-sm mb-1">Expert Reference:</h4>
              <p className="text-gray-300 text-xs">
                Dr. Matthew Walker emphasizes that sleep quality is as important as quantity, with consistent sleep/wake times being crucial for optimal health.
              </p>
            </div>
          </div>
        );
      
      case 'exercise':
        return (
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-white text-sm mb-1">Exercise Score Guide</h4>
              <p className="text-gray-300 text-xs">
                Assess your physical activity level, strength, and endurance on a scale of 1-10.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-white text-sm mb-1">Consider These Factors:</h4>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <div className="mt-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                  </div>
                  <div>
                    <div className="text-gray-300 font-medium text-xs">Activity Frequency</div>
                    <p className="text-gray-400 text-xs">How often you engage in structured physical activity</p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <div className="mt-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                  </div>
                  <div>
                    <div className="text-gray-300 font-medium text-xs">Strength Capacity</div>
                    <p className="text-gray-400 text-xs">Your muscular strength relative to your goals</p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <div className="mt-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                  </div>
                  <div>
                    <div className="text-gray-300 font-medium text-xs">Cardiovascular Fitness</div>
                    <p className="text-gray-400 text-xs">Your endurance and aerobic capacity</p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <div className="mt-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                  </div>
                  <div>
                    <div className="text-gray-300 font-medium text-xs">Mobility & Flexibility</div>
                    <p className="text-gray-400 text-xs">Your range of motion and movement quality</p>
                  </div>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white text-sm mb-1">Expert Reference:</h4>
              <p className="text-gray-300 text-xs">
                Dr. Peter Attia recommends a balanced approach to exercise that includes strength training, cardiovascular work, and mobility/stability training for longevity.
              </p>
            </div>
          </div>
        );
      
      case 'nutrition':
        return (
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-white text-sm mb-1">Nutrition Score Guide</h4>
              <p className="text-gray-300 text-xs">
                Rate your diet quality, eating habits, and nutritional balance on a scale of 1-10.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-white text-sm mb-1">Consider These Factors:</h4>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <div className="mt-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                  </div>
                  <div>
                    <div className="text-gray-300 font-medium text-xs">Whole Food Consumption</div>
                    <p className="text-gray-400 text-xs">Percentage of diet from unprocessed, whole foods</p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <div className="mt-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                  </div>
                  <div>
                    <div className="text-gray-300 font-medium text-xs">Protein Adequacy</div>
                    <p className="text-gray-400 text-xs">Consistent consumption of quality protein sources</p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <div className="mt-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                  </div>
                  <div>
                    <div className="text-gray-300 font-medium text-xs">Vegetable Variety</div>
                    <p className="text-gray-400 text-xs">Regular intake of diverse plant foods</p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <div className="mt-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                  </div>
                  <div>
                    <div className="text-gray-300 font-medium text-xs">Meal Timing & Structure</div>
                    <p className="text-gray-400 text-xs">Consistent eating patterns that support metabolism</p>
                  </div>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white text-sm mb-1">Expert Reference:</h4>
              <p className="text-gray-300 text-xs">
                Dr. Mark Hyman recommends focusing on nutrient density and food quality rather than calorie counting, with emphasis on protein, healthy fats, and fiber-rich carbohydrates.
              </p>
            </div>
          </div>
        );
      
      case 'biohacking':
        return (
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-white text-sm mb-1">Biohacking Score Guide</h4>
              <p className="text-gray-300 text-xs">
                Evaluate your use of health optimization tools and technologies on a scale of 1-10.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-white text-sm mb-1">Consider These Factors:</h4>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <div className="mt-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                  </div>
                  <div>
                    <div className="text-gray-300 font-medium text-xs">Health Tracking</div>
                    <p className="text-gray-400 text-xs">Use of wearables and metrics to monitor health</p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <div className="mt-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                  </div>
                  <div>
                    <div className="text-gray-300 font-medium text-xs">Recovery Techniques</div>
                    <p className="text-gray-400 text-xs">Use of cold/heat exposure, red light therapy, etc.</p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <div className="mt-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                  </div>
                  <div>
                    <div className="text-gray-300 font-medium text-xs">Environmental Optimization</div>
                    <p className="text-gray-400 text-xs">Light, air, water, and EMF management</p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <div className="mt-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                  </div>
                  <div>
                    <div className="text-gray-300 font-medium text-xs">Supplementation Strategy</div>
                    <p className="text-gray-400 text-xs">Targeted use of supplements for specific health goals</p>
                  </div>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white text-sm mb-1">Expert Reference:</h4>
              <p className="text-gray-300 text-xs">
                Dave Asprey emphasizes the importance of tracking biomarkers and using technology to optimize sleep, recovery, and cognitive performance.
              </p>
            </div>
          </div>
        );
      
      default:
        return (
          <div className="text-gray-300 text-xs">
            Rate your health in this category on a scale of 1-10.
          </div>
        );
    }
  };

  return (
    <div className="max-w-md">
      {getContent()}
    </div>
  );
}