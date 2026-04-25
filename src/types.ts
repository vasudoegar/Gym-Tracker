/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SetEntry {
  id: string;
  reps: number;
  weight: number;
  isPR?: boolean;
}

export interface ExerciseEntry {
  id: string;
  name: string;
  sets: SetEntry[];
}

export interface WorkoutLog {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  exercises: ExerciseEntry[];
  totalVolume?: number;
  label?: string;
}

export interface ExerciseTemplate {
  name: string;
  defaultWeight: number;
}
