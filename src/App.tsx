/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  collection, 
  onSnapshot, 
  query, 
  doc, 
  setDoc, 
  deleteDoc,
  where,
  orderBy
} from 'firebase/firestore';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { format, subMonths, addDays } from 'date-fns';
import { 
  Trophy, 
  TrendingUp, 
  Calendar as CalendarIcon, 
  LayoutDashboard,
  LayoutGrid,
  BarChart3,
  Flame,
  Plus,
  LogIn,
  LogOut
} from 'lucide-react';
import { db, auth } from './lib/firebase';
import { WorkoutLog, ExerciseEntry, SetEntry } from './types';
import { WORKOUT_SPLIT } from './constants';
import { CalendarView } from './components/CalendarView';
import { WorkoutLogger } from './components/WorkoutLogger';
import { ProgressCharts } from './components/ProgressCharts';
import { cn } from './lib/utils';

const googleProvider = new GoogleAuthProvider();

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [draftWorkout, setDraftWorkout] = useState<WorkoutLog | null>(null);
  const [activeTab, setActiveTab] = useState<'log' | 'exercise_stats' | 'daily_stats'>('log');
  const [previewTemplate, setPreviewTemplate] = useState<string | null>(null);

  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
  const currentLog = useMemo(() => {
    if (draftWorkout && draftWorkout.date === selectedDateStr) return draftWorkout;
    return logs.find(l => l.date === selectedDateStr) || null;
  }, [logs, selectedDateStr, draftWorkout]);

  const workoutData = useMemo(() => {
    const data: Record<string, string> = {};
    logs.forEach(l => {
      data[l.date] = l.label || 'Workout';
    });
    // Overlay draft
    if (draftWorkout) data[draftWorkout.date] = draftWorkout.label || 'Workout';

    // Mark past dates without logs as 'No Workout'
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Look back up to 3 months or since the first log
    let startVal = subMonths(new Date(), 3);
    const allLogs = draftWorkout ? [...logs, draftWorkout] : logs;
    if (allLogs.length > 0) {
      const firstLogDate = new Date(Math.min(...allLogs.map(l => new Date(l.date).getTime())));
      if (firstLogDate < startVal) startVal = firstLogDate;
    }
    startVal.setHours(0, 0, 0, 0);

    let current = new Date(startVal);
    while (current < today) {
      const dateStr = format(current, 'yyyy-MM-dd');
      if (!data[dateStr]) {
        data[dateStr] = 'No Workout';
      }
      current = addDays(current, 1);
    }

    return data;
  }, [logs, draftWorkout]);

  // Handle date change: clear draft if it matches a persisted log, or if moving away
  useEffect(() => {
    setDraftWorkout(null);
  }, [selectedDateStr]);

  const exerciseNames = useMemo(() => {
    const names = new Set<string>();
    
    // Add all exercises from default protocols
    Object.values(WORKOUT_SPLIT).forEach(protocol => {
      protocol.forEach(ex => names.add(ex.name));
    });

    // Add all exercises from logs (captures custom/dynamically added ones)
    logs.forEach(log => log.exercises.forEach(ex => names.add(ex.name)));
    if (draftWorkout) draftWorkout.exercises.forEach(ex => names.add(ex.name));
    
    return Array.from(names).sort();
  }, [logs, draftWorkout]);

  // Auth & Data Subscription
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user) {
        const q = query(
          collection(db, `users/${user.uid}/workouts`),
          orderBy('date', 'desc')
        );
        const unsub = onSnapshot(q, (snapshot) => {
          const fetchedLogs = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as WorkoutLog[];
          setLogs(fetchedLogs);
          setLoading(false);
        }, (error) => {
          console.error("Firestore error:", error);
          setLoading(false);
        });
        return unsub;
      } else {
        setLogs([]);
        setLoading(false);
      }
    });
    return unsubAuth;
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleLogout = () => signOut(auth);

  const handleSaveWorkout = async (workout: WorkoutLog) => {
    if (!user) return;
    // Use the date as the document ID to ensure strictly one workout session per day
    const docId = workout.date;
    const workoutDoc = doc(db, `users/${user.uid}/workouts`, docId);
    
    // Ensure the workout object has the correct ID and date
    const workoutToSave = {
      ...workout,
      id: docId
    };
    
    await setDoc(workoutDoc, workoutToSave);
    setDraftWorkout(null); // Clear draft after successful save
  };

  const handleDeleteWorkout = async (workoutId: string) => {
    if (!user) return;
    await deleteDoc(doc(db, `users/${user.uid}/workouts`, workoutId));
    setDraftWorkout(null); // Just in case
  };

  const handleAddExercise = async (name: string) => {
    if (!user) return;
    const newWorkout: WorkoutLog = currentLog ? JSON.parse(JSON.stringify(currentLog)) : {
      id: selectedDateStr,
      userId: user.uid,
      date: selectedDateStr,
      label: 'Custom',
      exercises: []
    };

    // Find the last session for this exercise to pre-fill
    const lastSession = logs.find(log => 
      log.exercises.some(ex => ex.name === name)
    )?.exercises.find(ex => ex.name === name);

    const defaultSets = lastSession ? lastSession.sets.map(s => ({
      id: Math.random().toString(36).substr(2, 9),
      weight: s.weight,
      reps: s.reps
    })) : [{ id: Math.random().toString(36).substr(2, 9), weight: 0, reps: 10 }];

    newWorkout.exercises.push({
      id: Math.random().toString(36).substr(2, 9),
      name,
      sets: defaultSets
    });

    setDraftWorkout(newWorkout);
  };

  const loadTemplate = async (templateName: string) => {
    if (!user) return;
    const template = WORKOUT_SPLIT[templateName];
    
    // Extract "Push", "Pull", or "Legs" from template name
    const match = templateName.match(/(Push|Pull|Legs)/i);
    const label = match ? match[0] : "Custom";

    const newWorkout: WorkoutLog = {
      id: selectedDateStr,
      userId: user.uid,
      date: selectedDateStr,
      label,
      exercises: template.map(t => {
        // Find the last session for this exercise to pre-fill weights/reps
        const lastSession = logs.find(log => 
          log.exercises.some(ex => ex.name === t.name)
        )?.exercises.find(ex => ex.name === t.name);

        const sets = lastSession ? lastSession.sets.map(s => ({
          id: Math.random().toString(36).substr(2, 9),
          weight: s.weight,
          reps: s.reps
        })) : Array.from({ length: 3 }, () => ({
          id: Math.random().toString(36).substr(2, 9),
          weight: t.defaultWeight,
          reps: 10
        }));

        return {
          id: Math.random().toString(36).substr(2, 9),
          name: t.name,
          sets
        };
      })
    };
    setDraftWorkout(newWorkout);
  };

  const personalBests = useMemo(() => {
    const pbs: Record<string, number> = {};
    logs.forEach(log => {
      log.exercises.forEach(ex => {
        const max = Math.max(...ex.sets.map(s => s.weight));
        if (!pbs[ex.name] || max > pbs[ex.name]) {
          pbs[ex.name] = max;
        }
      });
    });
    return pbs;
  }, [logs]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="font-bold text-gray-400 uppercase tracking-widest text-xs">Forging Interface...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full relative">
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-lime-400/10 blur-[100px] rounded-full" />
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-indigo-600/10 blur-[100px] rounded-full" />
          
          <div className="text-center space-y-12 relative z-10">
            <div className="w-24 h-24 bg-gradient-to-br from-lime-400 to-indigo-500 rounded-[2.5rem] flex items-center justify-center text-black shadow-[0_0_50px_-10px_rgba(163,230,53,0.5)] mx-auto transform -rotate-12 hover:rotate-0 transition-transform duration-700 cursor-pointer">
              <Flame className="w-12 h-12" />
            </div>
            
            <div className="space-y-4">
              <h1 className="text-6xl font-display font-black tracking-tighter uppercase leading-none text-white italic">
                Forge <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-500 to-gray-700 not-italic font-light">System</span>
              </h1>
              <p className="text-slate-500 font-medium text-sm max-w-[280px] mx-auto leading-relaxed">
                Architect your strength legacy. Professional grade tracking for the modern athlete.
              </p>
            </div>

            <div className="space-y-4">
              <button 
                onClick={handleLogin}
                className="w-full py-4.5 bg-white text-black rounded-3xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-4 hover:bg-lime-400 transition-all duration-300 shadow-[0_20px_40px_-15px_rgba(255,255,255,0.2)] active:scale-95 group"
              >
                <LogIn className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                Initialize Sync
              </button>
              
              <div className="flex items-center gap-4 px-8 opacity-20">
                <div className="h-px flex-1 bg-white" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em]">Quantum Secure</span>
                <div className="h-px flex-1 bg-white" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-[#030712] font-sans text-slate-300 pb-32 lg:pb-12 selection:bg-lime-400 selection:text-black">
      {/* Top Navigation */}
      <header className="bg-slate-950/50 backdrop-blur-md border-b border-white/5 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 md:h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="w-10 h-10 bg-lime-400 rounded-2xl flex items-center justify-center text-black shadow-[0_0_20px_-5px_rgba(163,230,53,0.5)]">
              <Flame className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-display font-black tracking-tight uppercase italic text-white leading-none">Forge <span className="text-slate-600 font-light not-italic">System</span></h1>
              <p className="text-[9px] font-black text-lime-400 uppercase tracking-[0.3em] mt-1">Status: Active Training</p>
            </div>
          </div>

          <div className="flex items-center gap-10">
            <div className="hidden lg:flex items-center gap-10">
              <div className="text-right">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Records Found</p>
                <div className="flex items-center gap-2 justify-end">
                  <Trophy className="w-3.5 h-3.5 text-lime-400" />
                  <span className="font-display font-black text-lg text-white">{Object.keys(personalBests).length}</span>
                </div>
              </div>
              <div className="w-px h-6 bg-white/5" />
              <div className="text-right">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Protocol Efficiency</p>
                <div className="flex items-center gap-2 justify-end">
                  <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="font-display font-black text-lg text-white">94%</span>
                </div>
              </div>
            </div>
            
            <button 
              onClick={handleLogout}
              className="w-10 h-10 rounded-xl border border-white/5 flex items-center justify-center text-slate-500 hover:text-red-400 hover:bg-red-500/5 hover:border-red-500/20 transition-all duration-300"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-12">
          {/* Dashboard Left */}
          <div className={cn("lg:col-span-4 space-y-6 md:space-y-12", activeTab !== 'log' && "hidden lg:block")}>
            <CalendarView 
              selectedDate={selectedDate} 
              setSelectedDate={setSelectedDate} 
              workoutData={workoutData} 
            />

            <div className="glass-card p-8">
              <h3 className="text-[10px] font-black text-lime-400 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                <LayoutGrid className="w-3 h-3" /> Training Protocols
              </h3>
              <div className="space-y-3">
                {Object.keys(WORKOUT_SPLIT).map(name => {
                  const isPreviewing = previewTemplate === name;
                  return (
                    <div key={name} className="space-y-3">
                      <button
                        onClick={() => setPreviewTemplate(isPreviewing ? null : name)}
                        className={cn(
                          "w-full p-4 text-left glass-card hover:bg-white/5 text-xs font-black uppercase tracking-widest transition-all group flex items-center justify-between border-white/5",
                          isPreviewing ? "bg-white/10 border-indigo-500/30 text-white" : "text-slate-400"
                        )}
                      >
                        {name}
                        {isPreviewing ? (
                          <div className="w-2 h-2 bg-lime-400 rounded-full animate-pulse" />
                        ) : (
                          <Plus className="w-3 h-3 translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all" />
                        )}
                      </button>

                      {isPreviewing && (
                        <div className="bg-slate-950/40 rounded-2xl p-6 border border-white/5 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                          <div className="space-y-2">
                            <p className="text-[8px] font-black text-slate-600 uppercase tracking-[0.2em] mb-3">Sequence Loadout</p>
                            {WORKOUT_SPLIT[name].map((ex, i) => (
                              <div key={i} className="flex items-center gap-3 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                <span className="text-slate-700 font-mono">0{i + 1}</span>
                                {ex.name}
                              </div>
                            ))}
                          </div>
                          <div className="flex gap-2 pt-2 border-t border-white/5">
                            <button 
                              onClick={() => {
                                loadTemplate(name);
                                setPreviewTemplate(null);
                                setActiveTab('log');
                              }}
                              className="flex-1 py-3 bg-lime-400 text-black text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-white transition-all shadow-[0_10px_20px_-5px_rgba(163,230,53,0.3)] active:scale-95"
                            >
                              Initialize Protocol
                            </button>
                            <button 
                              onClick={() => setPreviewTemplate(null)}
                              className="px-4 py-3 bg-slate-900 text-slate-500 text-[9px] font-black uppercase tracking-widest rounded-xl hover:text-white transition-all active:scale-95"
                            >
                              Abort
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Activity Center */}
          <div className="lg:col-span-8">
            <div className="hidden md:flex flex-wrap bg-slate-950/40 p-1.5 rounded-3xl border border-white/5 w-fit mb-12 backdrop-blur-lg gap-1.5">
              <button 
                onClick={() => setActiveTab('log')}
                className={cn(
                  "px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 transition-all duration-500",
                  activeTab === 'log' ? "bg-lime-400 text-black shadow-[0_10px_20px_-5px_rgba(163,230,53,0.3)]" : "text-slate-500 hover:text-white"
                )}
              >
                <LayoutDashboard className="w-4 h-4" /> Logger
              </button>
              <button 
                onClick={() => setActiveTab('exercise_stats')}
                className={cn(
                  "px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 transition-all duration-500",
                  activeTab === 'exercise_stats' ? "bg-indigo-500 text-white shadow-[0_10px_20px_-5px_rgba(99,102,241,0.3)]" : "text-slate-500 hover:text-white"
                )}
              >
                <BarChart3 className="w-4 h-4" /> Exercise Analytics
              </button>
              <button 
                onClick={() => setActiveTab('daily_stats')}
                className={cn(
                  "px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 transition-all duration-500",
                  activeTab === 'daily_stats' ? "bg-rose-500 text-white shadow-[0_10px_20px_-5px_rgba(244,63,94,0.3)]" : "text-slate-500 hover:text-white"
                )}
              >
                <TrendingUp className="w-4 h-4" /> Daily Analytics
              </button>
            </div>

            <div className="min-h-[600px]">
              {activeTab === 'log' ? (
                <WorkoutLogger 
                  workout={currentLog} 
                  isPersisted={!!logs.find(l => l.date === selectedDateStr)}
                  onSave={handleSaveWorkout}
                  onDelete={() => currentLog && handleDeleteWorkout(currentLog.id)}
                  onAddExercise={handleAddExercise}
                  personalBests={personalBests}
                />
              ) : activeTab === 'exercise_stats' ? (
                <ProgressCharts logs={logs} exerciseNames={exerciseNames} mode="exercise" />
              ) : (
                <ProgressCharts logs={logs} exerciseNames={exerciseNames} mode="daily" />
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Dock Interaction (Mobile Only) */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-950/80 backdrop-blur-2xl border border-white/10 px-3 py-2 flex lg:hidden items-center gap-1 rounded-[2rem] shadow-2xl z-50">
        <button 
          onClick={() => setActiveTab('log')} 
          className={cn(
            "p-4 md:p-5 rounded-2.5xl transition-all duration-500", 
            activeTab === 'log' ? "bg-lime-400 text-black shadow-[0_0_20px_rgba(163,230,53,0.3)]" : "text-slate-600"
          )}
        >
          <LayoutDashboard className="w-5 h-5 md:w-6 md:h-6" />
        </button>
        <button 
          onClick={() => setActiveTab('exercise_stats')} 
          className={cn(
            "p-4 md:p-5 rounded-2.5xl transition-all duration-500", 
            activeTab === 'exercise_stats' ? "bg-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.3)]" : "text-slate-600"
          )}
        >
          <BarChart3 className="w-5 h-5 md:w-6 md:h-6" />
        </button>
        <button 
          onClick={() => setActiveTab('daily_stats')} 
          className={cn(
            "p-4 md:p-5 rounded-2.5xl transition-all duration-500", 
            activeTab === 'daily_stats' ? "bg-rose-500 text-white shadow-[0_0_20px_rgba(244,63,94,0.3)]" : "text-slate-600"
          )}
        >
          <TrendingUp className="w-5 h-5 md:w-6 md:h-6" />
        </button>
      </nav>
    </div>
  );

}
