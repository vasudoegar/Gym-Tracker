/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays, 
  eachDayOfInterval 
} from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '../lib/utils';

interface CalendarViewProps {
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  workoutData: Record<string, string>; // Mapping date to label
}

export const CalendarView: React.FC<CalendarViewProps> = ({ selectedDate, setSelectedDate, workoutData }) => {
  const [currentMonth, setCurrentMonth] = React.useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const workoutDates = Object.keys(workoutData);

  return (
    <div className="glass-card p-6 border-white/5">
      <div className="flex items-center justify-between mb-8">
        <h2 className="font-display font-black text-sm uppercase tracking-[0.3em] text-white flex items-center gap-3">
          <CalendarIcon className="w-3 h-3 text-lime-400" /> System Date
        </h2>
        <div className="flex gap-2">
          <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center hover:bg-white/5 rounded-lg transition-all border border-transparent hover:border-white/10">
            <ChevronLeft className="w-4 h-4 text-slate-500" />
          </button>
          <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center hover:bg-white/5 rounded-lg transition-all border border-transparent hover:border-white/10">
            <ChevronRight className="w-4 h-4 text-slate-500" />
          </button>
        </div>
      </div>

      <div className="text-center mb-6">
        <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.5em]">{format(currentMonth, 'MMMM yyyy')}</p>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center mb-4">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <div key={i} className="text-[9px] font-black text-slate-700 py-2">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {days.map((day, idx) => {
          const isSelected = isSameDay(day, selectedDate);
          const isCurrentMonth = isSameMonth(day, monthStart);
          const dateStr = format(day, 'yyyy-MM-dd');
          const label = workoutData[dateStr];
          const hasWorkout = !!label;

          return (
            <button
              key={idx}
              onClick={() => setSelectedDate(day)}
              className={cn(
                "h-12 w-full flex flex-col items-center justify-center rounded-xl text-xs font-black transition-all relative border border-transparent pb-1",
                !isCurrentMonth && "opacity-20",
                isSelected ? "bg-lime-400 text-black shadow-[0_0_20px_rgba(163,230,53,0.4)] scale-110 z-10" : "hover:bg-white/5 text-slate-400 hover:text-white",
                hasWorkout && !isSelected && "border-indigo-500/30 text-indigo-400"
              )}
            >
              <span className={cn(isSelected ? "text-black" : "text-inherit")}>{format(day, 'd')}</span>
              {hasWorkout && (
                <div className="absolute bottom-1 w-full flex justify-center overflow-hidden px-1">
                  <span className={cn(
                    "text-[6px] font-black uppercase tracking-tighter truncate max-w-full",
                    isSelected ? "text-black/60" : 
                    label === 'No Workout' ? "text-slate-700/40" : "text-lime-400/80"
                  )}>
                    {label}
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );

};
