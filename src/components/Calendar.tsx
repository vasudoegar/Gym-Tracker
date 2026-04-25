/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
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
import { motion } from 'motion/react';

interface CalendarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  highlightDates?: string[]; // ISO strings
}

export const Calendar: React.FC<CalendarProps> = ({ selectedDate, onDateSelect, highlightDates = [] }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const days = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentMonth]);

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const weekDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 h-fit sticky top-24 backdrop-blur-sm shadow-xl">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <div className="flex gap-1">
          <button
            onClick={prevMonth}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-slate-200 transition-colors"
            id="prev-month-btn"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={nextMonth}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-slate-200 transition-colors"
            id="next-month-btn"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center mb-4">
        {weekDays.map((day, idx) => (
          <div key={idx} className="text-[10px] font-mono font-bold text-slate-600 uppercase tracking-widest">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day, idx) => {
          const isSelected = isSameDay(day, selectedDate);
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isToday = isSameDay(day, new Date());
          const dateStr = format(day, 'yyyy-MM-dd');
          const hasLog = highlightDates.includes(dateStr);

          return (
            <motion.button
              key={idx}
              whileTap={{ scale: 0.9 }}
              onClick={() => onDateSelect(day)}
              id={`calendar-day-${dateStr}`}
              className={cn(
                "relative h-10 w-full flex items-center justify-center rounded-lg text-xs font-mono transition-all duration-200",
                !isCurrentMonth && "text-slate-800 pointer-events-none",
                isCurrentMonth && "text-slate-400 hover:bg-slate-800 hover:text-slate-100",
                isSelected && "bg-lime-400 text-slate-950 hover:bg-lime-300 font-black shadow-[0_0_15px_rgba(163,230,53,0.3)]",
                isToday && !isSelected && "text-lime-400 ring-1 ring-lime-400/30"
              )}
            >
              {format(day, 'd')}
              {hasLog && !isSelected && (
                <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-slate-600" />
              )}
            </motion.button>
          );
        })}
      </div>
      
      <div className="mt-8 pt-6 border-t border-slate-800/50">
        <h3 className="text-[10px] uppercase font-black tracking-widest text-slate-500 mb-4">Legend</h3>
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-lime-400 shadow-[0_0_8px_rgba(163,230,53,0.5)]" />
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-tight">Active Workout</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-600" />
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-tight">Logged session</span>
          </div>
        </div>
      </div>
    </div>
  );
};
