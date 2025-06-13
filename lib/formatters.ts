// lib/formatters.ts
// 📅 Date, time, and data formatting utilities

import type { TimeCategory, AttendanceStatus } from './types';

/**
 * Format time string to user-friendly format
 * Handles various time formats including ISO datetime and time-only strings
 */
export const formatTime = (timeString: string | null | undefined): string => {
  if (!timeString) return 'N/A';
  
  try {
    // Handle different time formats
    if (timeString.includes('T')) {
      // ISO datetime format
      return new Date(timeString).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: 'UTC' // Adjust based on your timezone needs
      });
    } else if (timeString.includes(':')) {
      // Time only format (HH:MM or HH:MM:SS)
      const [hours, minutes] = timeString.split(':');
      const date = new Date();
      date.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    }
    return timeString;
  } catch (error) {
    console.warn('Time formatting error:', error);
    return timeString;
  }
};

/**
 * Format date string to user-friendly format
 */
export const formatDate = (dateString: string): string => {
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    console.warn('Date formatting error:', error);
    return dateString;
  }
};

/**
 * Format date string to long format (e.g., "January 15, 2025")
 */
export const formatDateLong = (dateString: string): string => {
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    console.warn('Date formatting error:', error);
    return dateString;
  }
};

/**
 * Format month string (YYYY-MM) to readable format
 */
export const formatMonthYear = (monthString: string): string => {
  try {
    const [year, month] = monthString.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long'
    });
  } catch (error) {
    console.warn('Month formatting error:', error);
    return monthString;
  }
};

/**
 * Format work hours with appropriate precision
 */
export const formatHours = (hours: number | null | undefined): string => {
  if (hours == null) return 'N/A';
  return `${roundHours(hours)}h`;
};

/**
 * Round hours to one decimal place
 */
export const roundHours = (hours: number): number => {
  return Math.round(hours * 10) / 10;
};

/**
 * Format percentage with one decimal place
 */
export const formatPercentage = (value: number): string => {
  return `${Math.round(value * 10) / 10}%`;
};

/**
 * Format employee name and code
 */
export const formatEmployeeDisplay = (name: string, empCode: string): string => {
  return `${name} (${empCode})`;
};

/**
 * Get current month in YYYY-MM format
 */
export const getCurrentMonth = (): string => {
  return new Date().toISOString().slice(0, 7);
};

/**
 * Get date range for a month
 */
export const getMonthDateRange = (monthString: string): { startDate: string; endDate: string } => {
  const [year, month] = monthString.split('-');
  const yearNum = parseInt(year);
  const monthNum = parseInt(month);
  
  if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
    throw new Error('Invalid month format');
  }
  
  // Get the last day of the month properly
  const lastDay = new Date(yearNum, monthNum, 0).getDate();
  const startDate = `${monthString}-01`;
  const endDate = `${monthString}-${lastDay.toString().padStart(2, '0')}`;
  
  return { startDate, endDate };
};

/**
 * Get week days between two dates (Monday-Friday only)
 */
export const getWeekDays = (weekStart: string, weekEnd: string) => {
  const start = new Date(weekStart);
  const end = new Date(weekEnd);
  const days = [];
  
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    // Only include weekdays (Monday-Friday)
    if (d.getDay() >= 1 && d.getDay() <= 5) {
      days.push({
        date: d.toISOString().split('T')[0],
        dayName: d.toLocaleDateString('en-US', { weekday: 'long' }),
        shortDate: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      });
    }
  }
  
  return days;
};

/**
 * Format relative time (e.g., "2 hours ago")
 */
export const formatRelativeTime = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  } catch (error) {
    console.warn('Relative time formatting error:', error);
    return 'Unknown';
  }
};

/**
 * Format duration in seconds to human readable format
 */
export const formatDuration = (seconds: number): string => {
  if (seconds < 60) {
    return `${seconds}s`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ${seconds % 60}s`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }
};