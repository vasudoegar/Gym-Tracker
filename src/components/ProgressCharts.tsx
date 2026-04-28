/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  Legend,
  Area,
  PieChart,
  Pie
} from 'recharts';
import { LineChart as LineChartIcon, ChevronDown, Search, X, Activity, BarChart3, Target, TrendingUp } from 'lucide-react';
import { WorkoutLog, ExerciseEntry } from '../types';
import { format, parseISO, startOfWeek, endOfWeek } from 'date-fns';
import { cn } from '../lib/utils';

interface ProgressChartsProps {
  logs: WorkoutLog[];
  exerciseNames: string[];
  mode?: 'exercise' | 'daily';
}

export const ProgressCharts: React.FC<ProgressChartsProps> = ({ logs, exerciseNames, mode = 'exercise' }) => {
  const [selectedExercise, setSelectedExercise] = useState(exerciseNames[0] || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!selectedExercise && exerciseNames.length > 0) {
      setSelectedExercise(exerciseNames[0]);
    }
  }, [exerciseNames, selectedExercise]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredExercises = useMemo(() => {
    return exerciseNames.filter(name => 
      name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [exerciseNames, searchQuery]);

  const dailyData = useMemo(() => {
    return logs
      .map(log => {
        const totalVolume = log.exercises.reduce((acc, ex) => {
          return acc + ex.sets.reduce((setAcc, s) => setAcc + (s.weight * s.reps), 0);
        }, 0);

        const totalSets = log.exercises.reduce((acc, ex) => acc + ex.sets.length, 0);

        return {
          date: log.date,
          displayDate: format(parseISO(log.date), 'MMM dd'),
          totalVolume,
          totalSets,
          label: log.label
        };
      })
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [logs]);

  const labelDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    logs.forEach(log => {
      let label = (log.label || 'CUSTOM').toUpperCase();
      if (label.includes('PUSH') || label.includes('CHEST') || label.includes('SHOULDER') || label.includes('TRICEP')) {
        label = 'PUSH';
      } else if (label.includes('PULL') || label.includes('BACK') || label.includes('BICEP')) {
        label = 'PULL';
      } else if (label.includes('LEGS') || label.includes('LOWER') || label.includes('QUAD') || label.includes('HAM')) {
        label = 'LEGS';
      }
      counts[label] = (counts[label] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [logs]);

  const pplVolumeRatio = useMemo(() => {
    const volumes = { PUSH: 0, PULL: 0, LEGS: 0, OTHER: 0 };
    
    logs.forEach(log => {
      const logVolume = log.exercises.reduce((acc, ex) => {
        return acc + ex.sets.reduce((setAcc, s) => setAcc + (s.weight * s.reps), 0);
      }, 0);

      const label = (log.label || 'CUSTOM').toUpperCase();
      
      if (label.includes('PUSH') || label.includes('CHEST') || label.includes('SHOULDER') || label.includes('TRICEP')) {
        volumes.PUSH += logVolume;
      } else if (label.includes('PULL') || label.includes('BACK') || label.includes('BICEP')) {
        volumes.PULL += logVolume;
      } else if (label.includes('LEGS') || label.includes('LOWER') || label.includes('QUAD') || label.includes('HAM')) {
        volumes.LEGS += logVolume;
      } else {
        volumes.OTHER += logVolume;
      }
    });

    return Object.entries(volumes)
      .filter(([_, value]) => value > 0)
      .map(([name, value]) => ({ name, value }));
  }, [logs]);

  const data = useMemo(() => {
    if (!selectedExercise) return [];

    return logs
      .filter(log => log.exercises.some(ex => ex.name === selectedExercise))
      .map(log => {
        const exercise = log.exercises.find(ex => ex.name === selectedExercise);
        const maxWeight = exercise ? Math.max(...exercise.sets.map(s => s.weight)) : 0;
        const totalVolume = exercise ? exercise.sets.reduce((acc, s) => acc + (s.weight * s.reps), 0) : 0;
        const totalReps = exercise ? exercise.sets.reduce((acc, s) => acc + s.reps, 0) : 0;
        const avgWeightPerRep = totalReps > 0 ? totalVolume / totalReps : 0;
        
        // Brzycki Formula for E1RM: Weight / (1.0278 - (0.0278 * Reps))
        const e1rms = exercise ? exercise.sets.map(s => s.weight / (1.0278 - (0.0278 * s.reps))) : [0];
        const maxE1RM = Math.max(...e1rms);

        return {
          date: log.date,
          displayDate: format(parseISO(log.date), 'MMM dd'),
          maxWeight,
          totalVolume,
          totalReps,
          avgWeightPerRep: Number(avgWeightPerRep.toFixed(1)),
          e1rm: Number(maxE1RM.toFixed(1)),
          label: log.label
        };
      })
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [logs, selectedExercise]);

  if (exerciseNames.length === 0) {
    return (
      <div className="glass-card p-10 border-white/5 space-y-12">
        <div className="h-[400px] flex flex-col items-center justify-center glass-card border-dashed bg-slate-900/10 border-white/5 p-12">
          <div className="w-16 h-16 bg-slate-950 border border-white/5 rounded-2xl flex items-center justify-center text-slate-800 mb-6 font-mono text-2xl font-black italic">!</div>
          <p className="text-slate-600 font-black text-[10px] uppercase tracking-[0.3em] text-center max-w-[200px] leading-relaxed">Insufficient committed data for analytics.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-4 sm:p-6 md:p-10 border-white/5 space-y-6 md:space-y-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 md:gap-10">
        <div>
          <h2 className="text-xl md:text-2xl font-display font-black text-white tracking-tight uppercase italic mb-1 md:mb-2">
            {mode === 'exercise' ? 'Exercise Performance Analytics' : 'Daily Force Metrics'}
          </h2>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em]">
            Module: {mode === 'exercise' ? 'Kinetic Evolution Tracking' : 'Holistic Protocol Analysis'}
          </p>
        </div>
        
        {mode === 'exercise' && (
          <div className="relative w-full md:w-[400px]" ref={dropdownRef}>
            <div 
              className={cn(
                "relative bg-slate-900 border border-white/5 rounded-2xl transition-all shadow-2xl overflow-hidden pt-7 pb-2 px-6",
                isOpen && "ring-1 ring-lime-400 border-lime-400/20 bg-slate-800"
              )}
            >
              <div className="absolute top-2.5 left-6 text-[8px] font-black text-lime-400 uppercase tracking-widest pointer-events-none opacity-50">
                Select Exercise Entry
              </div>
              <div className="flex items-center gap-3">
                <Search className="w-3.5 h-3.5 text-lime-400/50" />
                <input
                  type="text"
                  placeholder="Find protocol..."
                  value={isOpen ? searchQuery : selectedExercise}
                  onFocus={() => {
                    setIsOpen(true);
                    setSearchQuery('');
                  }}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent border-none outline-none font-black text-[11px] uppercase tracking-wider text-white placeholder:text-slate-700"
                />
                <button 
                  onClick={() => setIsOpen(!isOpen)}
                  className="text-slate-600 hover:text-white transition-colors"
                >
                  <ChevronDown className={cn("w-4 h-4 transition-transform duration-300", isOpen && "rotate-180")} />
                </button>
              </div>
            </div>

            {isOpen && (
              <div className="absolute top-full left-0 right-0 mt-3 bg-slate-900 border border-white/10 rounded-2xl shadow-[0_30px_60px_-12px_rgba(0,0,0,0.8)] z-50 overflow-hidden backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="max-h-[300px] overflow-y-auto py-2 custom-scrollbar">
                  {filteredExercises.length > 0 ? (
                    filteredExercises.map(name => (
                      <button
                        key={name}
                        onClick={() => {
                          setSelectedExercise(name);
                          setIsOpen(false);
                        }}
                        className={cn(
                          "w-full text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest transition-all border-l-2",
                          selectedExercise === name 
                            ? "bg-lime-400/10 border-lime-400 text-lime-400" 
                            : "border-transparent text-slate-500 hover:bg-white/5 hover:text-white"
                        )}
                      >
                        {name}
                      </button>
                    ))
                  ) : (
                    <div className="px-6 py-8 text-center text-slate-700 text-[9px] font-black uppercase tracking-widest italic">
                      No matching protocol found
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-12">
        {mode === 'exercise' ? (
          <>
            {/* Theoretical Peak (E1RM) */}
            <div className="glass-card p-5 sm:p-8 bg-slate-950/20 border-white/5 transform hover:scale-[1.01] hover:bg-slate-900/40 transition-all duration-500">
              <h3 className="text-[9px] font-black text-lime-400 uppercase tracking-[0.4em] mb-6 md:mb-10 flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-lime-400 rounded-full animate-ping" />
                Theoretical Peak (E1RM)
              </h3>
              <div className="h-[250px] md:h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                    <XAxis dataKey="displayDate" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#475569', fontWeight: 900 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#475569', fontWeight: 900 }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', padding: '12px 16px' }}
                      itemStyle={{ color: '#A3E635', fontSize: '10px', fontWeight: '900' }}
                      labelStyle={{ display: 'none' }}
                    />
                    <Line type="monotone" dataKey="e1rm" stroke="#A3E635" strokeWidth={4} dot={{ r: 4, fill: '#030712', stroke: '#A3E635' }} />
                    <Line type="monotone" dataKey="maxWeight" stroke="#4a5568" strokeDasharray="5 5" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <p className="text-[8px] text-slate-600 font-bold mt-4 uppercase tracking-widest text-center">Protocol: Brzycki Intensity Projection</p>
            </div>

            {/* Max Weight Lifted */}
            <div className="glass-card p-5 sm:p-8 bg-slate-950/20 border-white/5 transform hover:scale-[1.01] hover:bg-slate-900/40 transition-all duration-500">
              <h3 className="text-[9px] font-black text-amber-400 uppercase tracking-[0.4em] mb-6 md:mb-10 flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                Max Weight Lifted (kg)
              </h3>
              <div className="h-[250px] md:h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                    <XAxis dataKey="displayDate" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#475569', fontWeight: 900 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#475569', fontWeight: 900 }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', padding: '12px 16px' }}
                      itemStyle={{ color: '#FBBF24', fontSize: '10px', fontWeight: '900' }}
                      labelStyle={{ display: 'none' }}
                      cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }}
                    />
                    <Bar dataKey="maxWeight" fill="#FBBF24" radius={[8, 8, 0, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Total Exercise Volume */}
            <div className="glass-card p-5 sm:p-8 bg-slate-950/20 border-white/5 transform hover:scale-[1.01] hover:bg-slate-900/40 transition-all duration-500">
              <h3 className="text-[9px] font-black text-lime-400 uppercase tracking-[0.4em] mb-6 md:mb-10 flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-lime-400 rounded-full" />
                Total Exercise Volume (kg)
              </h3>
              <div className="h-[250px] md:h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                    <XAxis dataKey="displayDate" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#475569', fontWeight: 900 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#475569', fontWeight: 900 }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', padding: '12px 16px' }}
                      itemStyle={{ color: '#A3E635', fontSize: '10px', fontWeight: '900' }}
                      labelStyle={{ display: 'none' }}
                    />
                    <Line type="monotone" dataKey="totalVolume" stroke="#A3E635" strokeWidth={4} dot={{ r: 4, fill: '#030712', stroke: '#A3E635' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Total Repetitions */}
            <div className="glass-card p-5 sm:p-8 bg-slate-950/20 border-white/5 transform hover:scale-[1.01] hover:bg-slate-900/40 transition-all duration-500">
              <h3 className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.4em] mb-6 md:mb-10 flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                Total Repetitions
              </h3>
              <div className="h-[250px] md:h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                    <XAxis dataKey="displayDate" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#475569', fontWeight: 900 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#475569', fontWeight: 900 }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', padding: '12px 16px' }}
                      itemStyle={{ color: '#818CF8', fontSize: '10px', fontWeight: '900' }}
                      labelStyle={{ display: 'none' }}
                    />
                    <Line type="monotone" dataKey="totalReps" stroke="#818CF8" strokeWidth={4} dot={{ r: 4, fill: '#030712', stroke: '#818CF8' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Intensity Tracker */}
            <div className="glass-card p-5 sm:p-8 bg-slate-950/20 border-white/5 transform hover:scale-[1.01] hover:bg-slate-900/40 transition-all duration-500 lg:col-span-2">
              <h3 className="text-[9px] font-black text-cyan-400 uppercase tracking-[0.4em] mb-6 md:mb-10 flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full" />
                Intensity Coefficient (Avg Weight/Rep)
              </h3>
              <div className="h-[250px] md:h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                    <XAxis dataKey="displayDate" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#475569', fontWeight: 900 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#475569', fontWeight: 900 }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', padding: '12px 16px' }}
                      itemStyle={{ color: '#22D3EE', fontSize: '10px', fontWeight: '900' }}
                      labelStyle={{ display: 'none' }}
                      cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }}
                    />
                    <Bar dataKey="avgWeightPerRep" fill="#22D3EE" radius={[8, 8, 0, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Daily Volume Analytics */}
            <div className="glass-card p-5 sm:p-8 bg-slate-950/20 border-white/5 transform hover:scale-[1.01] hover:bg-slate-900/40 transition-all duration-500 lg:col-span-2">
              <h3 className="text-[9px] font-black text-rose-400 uppercase tracking-[0.4em] mb-6 md:mb-10 flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" />
                Daily Workload (Total kg)
              </h3>
              <div className="h-[250px] md:h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dailyData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                    <XAxis dataKey="displayDate" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#475569', fontWeight: 900 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#475569', fontWeight: 900 }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', padding: '12px 16px' }}
                      itemStyle={{ color: '#FB7185', fontSize: '10px', fontWeight: '900' }}
                      labelFormatter={(v, p) => `${p?.[0]?.payload.displayDate} - ${p?.[0]?.payload.label || 'Session'}`}
                    />
                    <Line type="monotone" dataKey="totalVolume" stroke="#FB7185" strokeWidth={4} dot={{ r: 4, fill: '#030712', stroke: '#FB7185' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* PPL Volume Ratio */}
            <div className="glass-card p-5 sm:p-8 bg-slate-950/20 border-white/5 transform hover:scale-[1.01] hover:bg-slate-900/40 transition-all duration-500">
               <h3 className="text-[9px] font-black text-lime-400 uppercase tracking-[0.4em] mb-6 md:mb-10 flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-lime-400 rounded-full" />
                Force Vector Distribution (PPL Ratio)
              </h3>
              <div className="h-[250px] md:h-[300px] w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pplVolumeRatio}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pplVolumeRatio.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={[ '#A3E635', '#818CF8', '#FB7185', '#FACC15'][index % 4]} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', padding: '12px 16px' }}
                      itemStyle={{ fontSize: '10px', fontWeight: '900', color: '#fff' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute flex flex-col items-center">
                   <div className="text-[8px] text-slate-500 font-bold uppercase tracking-[0.2em]">PPL SPLIT</div>
                   <div className="text-sm font-display font-black text-white italic">RATIO</div>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {pplVolumeRatio.map((entry, index) => (
                  <div key={entry.name} className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-colors">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: [ '#A3E635', '#818CF8', '#FB7185', '#FACC15'][index % 4] }} />
                    <div className="text-[8px] font-black uppercase tracking-widest text-slate-400">{entry.name}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Set Density & Protocol Split */}
            <div className="glass-card p-5 sm:p-8 bg-slate-950/20 border-white/5 transform hover:scale-[1.01] hover:bg-slate-900/40 transition-all duration-500">
              <h3 className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.4em] mb-6 md:mb-10 flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                Protocol Distribution (Total Sessions)
              </h3>
              <div className="h-[250px] md:h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={labelDistribution} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#ffffff05" />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 8, fill: '#A3E635', fontWeight: 900 }} width={60} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', padding: '12px 16px' }}
                      itemStyle={{ color: '#818CF8', fontSize: '10px', fontWeight: '900' }}
                      cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }}
                    />
                    <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={20}>
                      {labelDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={['#A3E635', '#22D3EE', '#818CF8', '#FB7185', '#FACC15'][index % 5]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-8 grid grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                  <div className="text-[8px] text-slate-500 font-bold uppercase tracking-wider mb-1">Total Force Days</div>
                  <div className="text-xl font-display font-black text-white italic">{logs.length}</div>
                </div>
                <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                  <div className="text-[8px] text-slate-500 font-bold uppercase tracking-wider mb-1">Avg Force Intensity</div>
                  <div className="text-xl font-display font-black text-white italic">
                    {(dailyData.reduce((acc, d) => acc + d.totalVolume, 0) / (logs.length || 1)).toFixed(0)}kg
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
