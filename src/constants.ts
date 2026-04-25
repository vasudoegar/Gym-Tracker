/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ExerciseTemplate } from './types';

export const WORKOUT_SPLIT: Record<string, ExerciseTemplate[]> = {
  "Day 1 - Push (Flat Strength)": [
    { name: "Flat Barbell Bench Press", defaultWeight: 30 },
    { name: "Incline DB Bench Press", defaultWeight: 10 },
    { name: "Dumbbell Shoulder Press", defaultWeight: 11.5 },
    { name: "Weighted Dips", defaultWeight: 0 },
    { name: "Single DB Overhead Extension", defaultWeight: 16 },
    { name: "Lateral Raises", defaultWeight: 7.5 }
  ],
  "Day 2 - Pull (Width)": [
    { name: "Barbell Row", defaultWeight: 25 },
    { name: "Lat Pullovers", defaultWeight: 12.5 },
    { name: "Face Pulls", defaultWeight: 10 },
    { name: "Bicep Curl", defaultWeight: 22.5 },
    { name: "Hammer Curl", defaultWeight: 10 },
    { name: "Reverse Grip Row", defaultWeight: 20 }
  ],
  "Day 3 - Legs (Power)": [
    { name: "Barbell Squats", defaultWeight: 35 },
    { name: "Hamstring Curl", defaultWeight: 0 },
    { name: "Sumo Squat", defaultWeight: 17.5 },
    { name: "Seated Calf Raise", defaultWeight: 40 },
    { name: "Abs", defaultWeight: 0 }
  ],
  "Day 4 - Push (Incline/Shoulders)": [
    { name: "Incline Barbell Press", defaultWeight: 25 },
    { name: "Close Grip Bench Press", defaultWeight: 25 },
    { name: "Lateral Raises", defaultWeight: 7.5 },
    { name: "Skull Crushers", defaultWeight: 12.5 },
    { name: "Chest Flys", defaultWeight: 7.5 },
    { name: "Shoulder Shrugs", defaultWeight: 15 }
  ],
  "Day 5 - Pull (Thickness)": [
    { name: "T-Bar Row", defaultWeight: 25 },
    { name: "Chest Supported Row", defaultWeight: 12.5 },
    { name: "Single Arm DB Row", defaultWeight: 15 },
    { name: "Incline DB Curl", defaultWeight: 7.5 },
    { name: "Preacher Curl", defaultWeight: 17.5 },
    { name: "Forearm Curls", defaultWeight: 15 }
  ],
  "Day 6 - Legs (Definition)": [
    { name: "Bulgarian Split Squat", defaultWeight: 7.5 },
    { name: "Hip Thrust", defaultWeight: 35 },
    { name: "Romanian Deadlift", defaultWeight: 30 },
    { name: "Standing Calf Raise", defaultWeight: 0 },
    { name: "Tibialis Raise", defaultWeight: 5 },
    { name: "Abs", defaultWeight: 0 }
  ]
};
