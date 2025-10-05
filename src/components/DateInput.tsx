'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { IconCalendar, IconChevronDown, IconChevronLeft, IconChevronRight } from '@tabler/icons-react';

interface DateInputProps {
  id?: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
  label?: string;
}

export const DateInput = ({
  id,
  name,
  value,
  onChange,
  placeholder = "Select date",
  required = false,
  className = "",
  label
}: DateInputProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(() => {
    return value ? new Date(value) : null;
  });
  
  const [viewDate, setViewDate] = useState(() => {
    if (selectedDate) return selectedDate;
    
    // Start from a reasonable birth date (25 years old)
    const defaultDate = new Date();
    defaultDate.setFullYear(defaultDate.getFullYear() - 25);
    return defaultDate;
  });

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync external value changes to internal state
  useEffect(() => {
    if (value && (!selectedDate || selectedDate.toISOString().split('T')[0] !== value)) {
      setSelectedDate(new Date(value));
    } else if (!value && selectedDate) {
      setSelectedDate(null);
    }
  }, [value]); // Only depend on value prop

  // Generate years (18-100 years old)
  const currentYear = new Date().getFullYear();
  const minYear = currentYear - 100;
  const maxYear = currentYear - 18;

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update parent when date changes
  useEffect(() => {
    if (selectedDate) {
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${day}`;
      
      // Only call onChange if the value actually changed
      if (dateString !== value) {
        onChange(dateString);
      }
    } else if (value) {
      // If selectedDate is null but value exists, clear it
      onChange('');
    }
  }, [selectedDate]); // Remove onChange from dependencies

  const formatDisplayDate = () => {
    if (!selectedDate) {
      return placeholder;
    }
    
    return selectedDate.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const handleDateClick = useCallback((date: Date) => {
    if (!isDateDisabled(date)) {
      setSelectedDate(date);
      setIsOpen(false);
    }
  }, []);

  const navigateMonth = useCallback((direction: 'prev' | 'next') => {
    setViewDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  }, []);

  const navigateYear = useCallback((direction: 'prev' | 'next') => {
    setViewDate(prev => {
      const newDate = new Date(prev);
      const targetYear = direction === 'prev' ? prev.getFullYear() - 1 : prev.getFullYear() + 1;
      
      // Allow navigation within reasonable birth date range
      if (targetYear >= minYear && targetYear <= maxYear) {
        newDate.setFullYear(targetYear);
      }
      return newDate;
    });
  }, [minYear, maxYear]);

  const isDateDisabled = (date: Date) => {
    const today = new Date();
    const year = date.getFullYear();
    const age = today.getFullYear() - year;
    
    const hasBirthdayOccurred = 
      today.getMonth() > date.getMonth() || 
      (today.getMonth() === date.getMonth() && today.getDate() >= date.getDate());
    
    const actualAge = hasBirthdayOccurred ? age : age - 1;
    
    return actualAge < 18 || actualAge > 100;
  };

  const isDateSelected = (date: Date) => {
    if (!selectedDate) return false;
    return date.toDateString() === selectedDate.toDateString();
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-slate-700 mb-2">
          {label}
        </label>
      )}
      
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full pl-10 pr-10 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 placeholder-slate-400 hover:border-slate-400 text-gray-600 text-left bg-white"
        >
          <span className={selectedDate ? 'text-gray-600' : 'text-slate-400'}>
            {formatDisplayDate()}
          </span>
        </button>
        
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <IconCalendar className="h-5 w-5 text-slate-400" />
        </div>
        
        <div className={`absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
          <IconChevronDown className="h-5 w-5 text-slate-400" />
        </div>

        {isOpen && (
          <div className="absolute z-50 w-80 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg animate-in slide-in-from-top-2 duration-200">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => navigateYear('prev')}
                    className="p-1 hover:bg-purple-50 rounded text-slate-600 hover:text-purple-600 transition-colors"
                    disabled={viewDate.getFullYear() <= minYear}
                  >
                    <IconChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => navigateMonth('prev')}
                    className="p-1 hover:bg-purple-50 rounded text-slate-600 hover:text-purple-600 transition-colors"
                  >
                    <IconChevronLeft className="h-3 w-3" />
                  </button>
                </div>
                
                <div className="text-center">
                  <div className="text-sm font-semibold text-slate-900">
                    {months[viewDate.getMonth()]} {viewDate.getFullYear()}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => navigateMonth('next')}
                    className="p-1 hover:bg-purple-50 rounded text-slate-600 hover:text-purple-600 transition-colors"
                  >
                    <IconChevronRight className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => navigateYear('next')}
                    className="p-1 hover:bg-purple-50 rounded text-slate-600 hover:text-purple-600 transition-colors"
                    disabled={viewDate.getFullYear() >= maxYear}
                  >
                    <IconChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1 mb-2">
                {daysOfWeek.map((day) => (
                  <div key={day} className="text-center text-xs font-medium text-slate-500 py-2">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {getDaysInMonth(viewDate).map((date, index) => {
                  if (!date) {
                    return <div key={index} className="h-8"></div>;
                  }

                  const disabled = isDateDisabled(date);
                  const selected = isDateSelected(date);
                  const today = isToday(date);

                  return (
                    <button
                      key={date.getTime()}
                      type="button"
                      onClick={() => !disabled && handleDateClick(date)}
                      disabled={disabled}
                      className={`
                        h-8 w-8 text-sm rounded-lg transition-all duration-150 font-medium
                        ${disabled 
                          ? 'text-slate-300 cursor-not-allowed' 
                          : 'text-slate-700 hover:bg-purple-50 hover:text-purple-600 cursor-pointer'
                        }
                        ${selected 
                          ? 'bg-purple-600 text-white hover:bg-purple-700' 
                          : ''
                        }
                        ${today && !selected 
                          ? 'bg-purple-100 text-purple-700 font-bold' 
                          : ''
                        }
                      `}
                    >
                      {date.getDate()}
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDate(null);
                    onChange('');
                  }}
                  className="text-xs text-slate-500 hover:text-slate-700 font-medium transition-colors duration-200"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="text-xs text-purple-600 hover:text-purple-700 font-medium transition-colors duration-200"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <input
        type="hidden"
        id={id}
        name={name}
        value={value}
        required={required}
      />
    </div>
  );
};
