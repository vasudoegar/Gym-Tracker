/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Dumbbell, 
  Flame,
  LayoutGrid,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Trophy
} from 'lucide-react';
import { WorkoutLog, ExerciseEntry, SetEntry } from '../types';
import { cn } from '../lib/utils';

interface WorkoutLoggerProps {
  workout: WorkoutLog | null;
  onSave: (workout: WorkoutLog) => void;
  onDelete: () => void;
  onAddExercise: (name: string) => void;
  personalBests: Record<string, number>;
  isPersisted: boolean;
}

export const WorkoutLogger: React.FC<WorkoutLoggerProps> = ({ 
  workout: initialWorkout, 
  onSave, 
  onDelete, 
  onAddExercise,
  personalBests,
  isPersisted
}) => {
  const [localWorkout, setLocalWorkout] = React.useState<WorkoutLog | null>(initialWorkout);
  const [isAddingExercise, setIsAddingExercise] = React.useState(false);
  const [newExerciseName, setNewExerciseName] = React.useState('');
  const [isSyncing, setIsSyncing] = React.useState(false);
  const [showSuccess, setShowSuccess] = React.useState(false);

  // Sync with prop when date changes
  React.useEffect(() => {
    setLocalWorkout(initialWorkout);
  }, [initialWorkout?.date, initialWorkout?.exercises.length]); // exercise.length is a proxy for template loads

  const workoutLabels = ['PUSH', 'PULL', 'LEGS', 'UPPER', 'LOWER', 'CUSTOM'];

  const handleManualSave = async () => {
    if (!localWorkout) return;
    setIsSyncing(true);
    try {
      await onSave(localWorkout);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } finally {
      setIsSyncing(false);
    }
  };

  const updateLabel = (label: string) => {
    if (!localWorkout) return;
    setLocalWorkout({ ...localWorkout, label });
  };

  const addSet = (exerciseId: string) => {
    if (!localWorkout) return;
    const newWorkout = JSON.parse(JSON.stringify(localWorkout));
    const exercise = newWorkout.exercises.find((e: any) => e.id === exerciseId);
    if (exercise) {
      const lastSet = exercise.sets[exercise.sets.length - 1];
      exercise.sets.push({
        id: Math.random().toString(36).substr(2, 9),
        reps: lastSet?.reps || 10,
        weight: lastSet?.weight || 0
      });
      setLocalWorkout(newWorkout);
    }
  };

  const updateSet = (exerciseId: string, setId: string, updates: Partial<SetEntry>) => {
    if (!localWorkout) return;
    const newWorkout = JSON.parse(JSON.stringify(localWorkout));
    const exercise = newWorkout.exercises.find((e: any) => e.id === exerciseId);
    if (exercise) {
      exercise.sets = exercise.sets.map((s: any) => s.id === setId ? { ...s, ...updates } : s);
      setLocalWorkout(newWorkout);
    }
  };

  const deleteSet = (exerciseId: string, setId: string) => {
    if (!localWorkout) return;
    const newWorkout = JSON.parse(JSON.stringify(localWorkout));
    const exercise = newWorkout.exercises.find((e: any) => e.id === exerciseId);
    if (exercise && exercise.sets.length > 1) {
      exercise.sets = exercise.sets.filter((s: any) => s.id !== setId);
      setLocalWorkout(newWorkout);
    }
  };

  const deleteExercise = (exerciseId: string) => {
    if (!localWorkout) return;
    const newWorkout = JSON.parse(JSON.stringify(localWorkout));
    newWorkout.exercises = newWorkout.exercises.filter((e: any) => e.id !== exerciseId);
    if (newWorkout.exercises.length === 0) {
      onDelete();
    } else {
      setLocalWorkout(newWorkout);
    }
  };

  const calculateExerciseVolume = (sets: SetEntry[]) => {
    return sets.reduce((acc, set) => acc + (set.reps * set.weight), 0);
  };

  const totalVolume = localWorkout?.exercises.reduce((acc, ex) => acc + calculateExerciseVolume(ex.sets), 0) || 0;

  if (!localWorkout) {
    return (
      <div className="glass-card p-10 md:p-16 text-center border-dashed border-white/5 bg-slate-900/20">
        <div className="w-16 h-16 md:w-20 md:h-20 bg-slate-950 border border-white/5 rounded-[1.5rem] md:rounded-[2rem] flex items-center justify-center text-slate-700 mx-auto mb-6 md:mb-8 shadow-2xl">
          <Dumbbell className="w-6 h-6 md:w-8 md:h-8" />
        </div>
        <h3 className="text-lg md:text-xl font-display font-black text-white mb-2 uppercase tracking-[0.2em] italic">No Protocol Active</h3>
        <p className="text-slate-500 mb-8 md:mb-10 text-[10px] md:text-xs font-medium uppercase tracking-widest leading-relaxed">System awaiting input. Select a training split <br className="hidden md:block"/> or manually initialize a custom exercise.</p>
        <button 
          onClick={() => setIsAddingExercise(true)}
          className="px-8 md:px-10 py-3.5 md:py-4 bg-white text-black rounded-[1.2rem] md:rounded-[1.5rem] font-black text-[9px] md:text-[10px] uppercase tracking-[0.3em] shadow-[0_15px_30px_-5px_rgba(255,255,255,0.2)] hover:bg-lime-400 transition-all duration-300"
        >
          Initialize Unit
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap gap-2">
        {workoutLabels.map(label => (
          <button
            key={label}
            onClick={() => updateLabel(label)}
            className={cn(
              "px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all border",
              localWorkout.label?.toUpperCase() === label 
                ? "bg-lime-400 border-lime-400 text-black shadow-[0_5px_15px_rgba(163,230,53,0.2)]" 
                : "bg-slate-950/40 border-white/5 text-slate-500 hover:text-white hover:border-white/10"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="bg-gradient-to-br from-lime-400 to-indigo-500 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 text-black flex justify-between items-center shadow-[0_20px_50px_-20px_rgba(163,230,53,0.5)] relative overflow-hidden group">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/20 blur-[60px] rounded-full group-hover:scale-150 transition-transform duration-1000" />
        
        <div className="relative z-10">
          <p className="text-black/40 text-[8px] md:text-[9px] font-black uppercase tracking-[0.4em] mb-1 md:mb-2 text-center md:text-left">Total Output Volume</p>
          <div className="flex items-baseline gap-2 md:gap-3 justify-center md:justify-start">
            <h2 className="text-4xl md:text-6xl font-display font-black italic tracking-tighter">{totalVolume.toLocaleString()}</h2>
            <span className="text-sm md:text-xl font-black uppercase tracking-widest opacity-40">kg</span>
          </div>
        </div>
        <Flame className="w-12 h-12 md:w-20 md:h-20 text-black/10 absolute -right-3 md:-right-4 -bottom-3 md:-bottom-4 group-hover:scale-125 transition-transform duration-700 hover:rotate-12" />
      </div>

      <div className="space-y-6">
        {localWorkout.exercises.map((exercise) => {
          const pb = personalBests[exercise.name] || 0;
          return (
            <div key={exercise.id} className="glass-card overflow-hidden group/card border-white/5">
              <div className="bg-white/2 px-4 md:px-8 py-4 md:py-6 flex justify-between items-center border-b border-white/5">
                <div className="flex items-center gap-4 md:gap-6">
                  <div className="w-12 h-12 md:w-14 md:h-14 bg-slate-950 rounded-xl md:rounded-2xl border border-white/5 flex items-center justify-center text-lime-400 shadow-inner group-hover/card:border-lime-400/30 transition-colors shrink-0">
                    <Dumbbell className="w-5 h-5 md:w-6 md:h-6" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-display font-black text-base md:text-lg text-white uppercase tracking-tight italic truncate">{exercise.name}</h3>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-0.5 md:mt-1">
                      <div className="flex items-center gap-1.5">
                        <TrendingUp className="w-3 h-3 text-slate-600" />
                        <p className="text-[9px] md:text-[10px] text-slate-500 font-black uppercase tracking-widest">
                          {calculateExerciseVolume(exercise.sets).toLocaleString()} KG
                        </p>
                      </div>
                      {pb > 0 && (
                        <div className="flex items-center gap-1.5">
                          <Trophy className="w-3 h-3 text-lime-400" />
                          <p className="text-[9px] md:text-[10px] text-lime-400 font-black uppercase tracking-widest">
                            Best: {pb}KG
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => deleteExercise(exercise.id)}
                  className="w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center text-slate-700 hover:text-red-400 hover:bg-red-400/5 transition-all shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 md:p-8">
                <div className="grid grid-cols-12 gap-3 md:gap-6 mb-4 md:mb-6 text-[8px] md:text-[9px] font-black text-slate-600 uppercase tracking-[0.4em] px-2 md:px-4">
                  <div className="col-span-1 text-center md:text-left">#</div>
                  <div className="col-span-4 text-center">Load (kg)</div>
                  <div className="col-span-4 text-center">Units</div>
                  <div className="col-span-3 text-right pr-2 md:pr-0">Action</div>
                </div>

                <div className="space-y-3 md:space-y-4">
                  {exercise.sets.map((set, idx) => {
                    const isPR = pb > 0 && set.weight >= pb;
                    return (
                      <div key={set.id} className="grid grid-cols-12 gap-3 md:gap-6 items-center group/set">
                        <div className="col-span-1 font-mono font-black text-slate-800 text-[10px] md:text-xs text-center md:text-left">{idx + 1}</div>
                        <div className="col-span-4 relative">
                          <input 
                            type="number" 
                            step="0.5"
                            value={set.weight || ''} 
                            placeholder="0.0"
                            onChange={(e) => updateSet(exercise.id, set.id, { weight: parseFloat(e.target.value) || 0 })}
                            className={cn(
                              "w-full bg-slate-950/50 border border-white/5 rounded-xl md:rounded-2xl p-3 md:p-4 text-center font-mono font-black focus:ring-1 transition-all outline-none text-[11px] md:text-sm group-hover/set:border-white/10",
                              isPR ? "text-lime-400 border-lime-400/20 focus:ring-lime-400/50" : "text-white focus:ring-indigo-500/50"
                            )}
                          />
                          {isPR && (
                            <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-lime-400 text-black text-[6px] md:text-[7px] font-black px-1.5 md:px-2 py-0.5 rounded shadow-lg z-10 uppercase tracking-tighter whitespace-nowrap">
                              PB
                            </div>
                          )}
                        </div>
                        <div className="col-span-4">
                          <input 
                            type="number" 
                            value={set.reps || ''} 
                            placeholder="0"
                            onChange={(e) => updateSet(exercise.id, set.id, { reps: parseInt(e.target.value) || 0 })}
                            className="w-full bg-slate-950/50 border border-white/5 rounded-xl md:rounded-2xl p-3 md:p-4 text-center font-mono font-black focus:ring-1 focus:ring-indigo-500/50 transition-all outline-none text-[11px] md:text-sm group-hover/set:border-white/10 text-white"
                          />
                        </div>
                        <div className="col-span-3 flex justify-end">
                          <button 
                            onClick={() => deleteSet(exercise.id, set.id)}
                            className="w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center text-slate-800 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button 
                  onClick={() => addSet(exercise.id)}
                  className="mt-6 md:mt-10 w-full py-3.5 md:py-4 bg-slate-950/50 hover:bg-white/5 text-slate-500 hover:text-white rounded-xl md:rounded-2xl text-[8px] md:text-[9px] font-black uppercase tracking-[0.4em] transition-all flex items-center justify-center gap-3 border border-white/5 group"
                >
                  <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" /> Add Set Record
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 md:mt-12 flex flex-col gap-3 md:gap-4">
        {!isAddingExercise ? (
          <>
            <button 
              onClick={() => setIsAddingExercise(true)}
              className="w-full py-4.5 md:py-6 bg-slate-900 text-slate-400 rounded-2xl md:rounded-3xl font-black text-[10px] md:text-xs uppercase tracking-[0.4em] flex items-center justify-center gap-3 md:gap-4 hover:bg-slate-800 transition-all duration-300 border border-white/5 active:scale-95 group"
            >
              <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" /> Initialize Custom Movement
            </button>
            <div className="flex flex-col gap-3 md:gap-4">
              <button 
                onClick={handleManualSave}
                disabled={isSyncing}
                className={cn(
                  "w-full py-4.5 md:py-6 rounded-2xl md:rounded-3xl font-black text-[10px] md:text-xs uppercase tracking-[0.4em] flex items-center justify-center gap-3 md:gap-4 transition-all duration-500 shadow-2xl active:scale-95 group",
                  showSuccess 
                    ? "bg-emerald-500 text-white shadow-emerald-500/20" 
                    : "bg-white text-black hover:bg-lime-400 shadow-white/10"
                )}
              >
                {isSyncing ? (
                  <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                ) : showSuccess ? (
                  <CheckCircle2 className="w-5 h-5 animate-bounce" />
                ) : (
                  <div className="w-5 h-5 bg-black/5 rounded-full flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-black rounded-full group-hover:scale-150 transition-transform" />
                  </div>
                )}
                {showSuccess ? "Protocol Secured" : isSyncing ? "Syncing..." : "Commit Session to Core"}
              </button>

              {isPersisted && (
                <button 
                  onClick={onDelete}
                  className="w-full py-6 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-3xl font-black text-xs uppercase tracking-[0.4em] flex items-center justify-center gap-4 transition-all duration-300 active:scale-95"
                >
                  <Trash2 className="w-5 h-5" /> Delete Logged Session Entry
                </button>
              )}
            </div>
          </>
        ) : (
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              if (newExerciseName.trim()) {
                // If we already have a session, add it locally
                if (localWorkout) {
                  const newWorkout = JSON.parse(JSON.stringify(localWorkout));
                  newWorkout.exercises.push({
                    id: Math.random().toString(36).substr(2, 9),
                    name: newExerciseName.trim(),
                    sets: [{ id: Math.random().toString(36).substr(2, 9), weight: 0, reps: 10 }]
                  });
                  setLocalWorkout(newWorkout);
                } else {
                  // If no session, use the prop handler which initializes one
                  onAddExercise(newExerciseName.trim());
                }
                setNewExerciseName('');
                setIsAddingExercise(false);
              }
            }}
            className="glass-card p-10 border-lime-400/20 shadow-[0_0_50px_rgba(163,230,53,0.1)]"
          >
            <label className="block text-[10px] font-black text-lime-400 uppercase tracking-[0.4em] mb-4">Exercise Designation</label>
            <input 
              autoFocus
              value={newExerciseName}
              onChange={(e) => setNewExerciseName(e.target.value)}
              className="w-full p-6 bg-slate-950/50 border border-white/5 rounded-2xl mb-8 font-black focus:ring-1 focus:ring-lime-400/50 outline-none text-white tracking-widest placeholder:text-slate-800"
              placeholder="E.G. QUANTUM DEADLIFT"
            />
            <div className="flex gap-4">
              <button 
                type="submit"
                className="flex-1 py-4 bg-white text-black rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-lime-400 transition-all"
              >
                Confirm
              </button>
              <button 
                type="button"
                onClick={() => setIsAddingExercise(false)}
                className="px-10 py-4 bg-slate-900 text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] hover:text-white transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
