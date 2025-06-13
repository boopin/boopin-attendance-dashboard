// lib/utils.ts
// 🛠️ General utility functions and helpers

import type { 
  TimeCategory, 
  AttendanceStatus, 
  ExportType, 
  ExportConfig,
  Employee,
  EmployeeRecord
} from './types';

/**
 * Get CSS classes for attendance status styling
 */
export const getStatusColor = (status: string | null | undefined): string => {
  if (!status) return 'text-gray-600 bg-gray-50';
  
  switch (status.toLowerCase()) {
    case 'present': return 'text-green-600 bg-green-50';
    case 'absent': return 'text-red-600 bg-red-50';
    case 'on-time': return 'text-green-600 bg-green-50';
    case 'late': return 'text-red-600 bg-red-50';
    case 'early': return 'text-blue-600 bg-blue-50';
    default: return 'text-gray-600 bg-gray-50';
  }
};

/**
 * Get CSS classes for time category styling
 */
export const getCategoryColor = (category: string | null | undefined): string => {
  if (!category) return 'text-gray-600 bg-gray-50';
  
  switch (category.toLowerCase()) {
    case 'early check-in': return 'text-blue-600 bg-blue-50';
    case 'on-time check-in': 
    case 'on time': return 'text-green-600 bg-green-50';
    case 'late check-in': 
    case 'late': return 'text-red-600 bg-red-50';
    case 'acceptable check-in': 
    case 'acceptable': return 'text-yellow-600 bg-yellow-50';
    default: return 'text-gray-600 bg-gray-50';
  }
};

/**
 * Find employee name by employee code
 */
export const getEmployeeName = (empCode: string, employees: Employee[]): string => {
  const employee = employees.find(emp => emp.emp_code === empCode);
  return employee?.name || empCode;
};

/**
 * Calculate attendance rate
 */
export const calculateAttendanceRate = (presentDays: number, totalDays: number): number => {
  if (totalDays === 0) return 0;
  return Math.round((presentDays / totalDays) * 100);
};

/**
 * Escape CSV values to prevent injection and handle special characters
 */
export const escapeCSV = (value: any): string => {
  if (value === null || value === undefined) return '';
  const stringValue = String(value);
  // Escape quotes and wrap in quotes if contains comma, quote, or newline
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
};

/**
 * Export data to CSV file
 */
export const exportToCSV = (config: ExportConfig): void => {
  const { data, filename, type } = config;
  
  if (!data || data.length === 0) {
    alert('No data to export');
    return;
  }

  try {
    let csvContent = '';
    let headers: string[] = [];

    switch (type) {
      case 'daily':
        headers = [
          'Date', 
          'Total Employees', 
          'Early Count', 
          'On-time Count', 
          'Acceptable Count', 
          'Late Count', 
          'On-time Rate (%)', 
          'Earliest Check-in', 
          'Latest Check-in'
        ];
        csvContent = headers.join(',') + '\n';
        data.forEach(row => {
          csvContent += [
            escapeCSV(row.date),
            escapeCSV(row.total_employees_present),
            escapeCSV(row.early_count),
            escapeCSV(row.ontime_count),
            escapeCSV(row.acceptable_count),
            escapeCSV(row.late_count),
            escapeCSV(row.ontime_rate),
            escapeCSV(row.earliest_checkin || ''),
            escapeCSV(row.latest_checkin || '')
          ].join(',') + '\n';
        });
        break;

      case 'weekly':
        headers = [
          'Week Start', 
          'Week End', 
          'Total Employees', 
          'Perfect Attendance Count', 
          'Perfect Attendance Rate (%)'
        ];
        csvContent = headers.join(',') + '\n';
        data.forEach(row => {
          csvContent += [
            escapeCSV(row.week_start),
            escapeCSV(row.week_end),
            escapeCSV(row.total_employees),
            escapeCSV(row.perfect_attendance_count),
            escapeCSV(row.perfect_attendance_rate)
          ].join(',') + '\n';
        });
        break;

      case 'weeklyDetails':
        headers = [
          'Employee Code', 
          'Name', 
          'Total Days', 
          'Present Days', 
          'Leave Days', 
          'Total Hours', 
          'On-time Days', 
          'Late Days', 
          'Attendance Rate (%)'
        ];
        csvContent = headers.join(',') + '\n';
        data.forEach(row => {
          const attendanceRate = calculateAttendanceRate(row.presentDays, row.totalDays);
          csvContent += [
            escapeCSV(row.emp_code),
            escapeCSV(row.name),
            escapeCSV(row.totalDays),
            escapeCSV(row.presentDays),
            escapeCSV(row.leaveDays),
            escapeCSV(Math.round(row.totalHours * 10) / 10),
            escapeCSV(row.onTimeDays),
            escapeCSV(row.lateDays),
            escapeCSV(attendanceRate)
          ].join(',') + '\n';
        });
        break;

      case 'employee':
      case 'monthly':
        headers = [
          'Date', 
          'Employee Code', 
          'Name', 
          'Check In', 
          'Check Out', 
          'Work Hours', 
          'Total Punches', 
          'Status', 
          'Time Category'
        ];
        csvContent = headers.join(',') + '\n';
        data.forEach(row => {
          csvContent += [
            escapeCSV(row.date),
            escapeCSV(row.emp_code),
            escapeCSV(row.name),
            escapeCSV(row.check_in || ''),
            escapeCSV(row.check_out || ''),
            escapeCSV(row.work_hours || ''),
            escapeCSV(row.total_punches || ''),
            escapeCSV(row.status || ''),
            escapeCSV(row.time_category || '')
          ].join(',') + '\n';
        });
        break;

      default:
        throw new Error(`Unknown export type: ${type}`);
    }

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url); // Clean up
    } else {
      throw new Error('Browser does not support file downloads');
    }
  } catch (error: any) {
    console.error('Export error:', error);
    alert(`Failed to export data: ${error.message}`);
  }
};

/**
 * Generate filename for exports
 */
export const generateExportFilename = (
  type: ExportType, 
  context?: string, 
  date?: string
): string => {
  const timestamp = new Date().toISOString().slice(0, 10);
  
  switch (type) {
    case 'daily':
      return `daily-reports-${timestamp}.csv`;
    case 'weekly':
      return `weekly-reports-${timestamp}.csv`;
    case 'monthly':
      return context ? `${context}-monthly-${date || timestamp}.csv` : `monthly-reports-${timestamp}.csv`;
    case 'employee':
      return `employee-details-${date || timestamp}.csv`;
    case 'weeklyDetails':
      return context ? `weekly-employee-details-${context}.csv` : `weekly-employee-details-${timestamp}.csv`;
    default:
      return `attendance-export-${timestamp}.csv`;
  }
};

/**
 * Debounce function for performance optimization
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Throttle function for performance optimization
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
) => {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

/**
 * Group array of objects by a key
 */
export const groupBy = <T>(array: T[], key: keyof T): Record<string, T[]> => {
  return array.reduce((groups, item) => {
    const groupKey = String(item[key]);
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(item);
    return groups;
  }, {} as Record<string, T[]>);
};

/**
 * Sort array by multiple keys
 */
export const sortBy = <T>(array: T[], ...keys: (keyof T)[]): T[] => {
  return [...array].sort((a, b) => {
    for (const key of keys) {
      const aVal = a[key];
      const bVal = b[key];
      
      if (aVal < bVal) return -1;
      if (aVal > bVal) return 1;
    }
    return 0;
  });
};

/**
 * Get unique values from array
 */
export const unique = <T>(array: T[]): T[] => {
  return [...new Set(array)];
};

/**
 * Check if value is empty (null, undefined, empty string, empty array)
 */
export const isEmpty = (value: any): boolean => {
  if (value == null) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
};

/**
 * Deep clone an object
 */
export const deepClone = <T>(obj: T): T => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as unknown as T;
  if (Array.isArray(obj)) return obj.map(item => deepClone(item)) as unknown as T;
  
  const cloned = {} as T;
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }
  return cloned;
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Capitalize first letter of each word
 */
export const capitalizeWords = (str: string): string => {
  return str.replace(/\b\w/g, char => char.toUpperCase());
};

/**
 * Generate a random ID
 */
export const generateId = (length: number = 8): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Format number with commas
 */
export const formatNumber = (num: number): string => {
  return num.toLocaleString();
};

/**
 * Clamp number between min and max
 */
export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

/**
 * Check if two date strings represent the same day
 */
export const isSameDay = (date1: string, date2: string): boolean => {
  return new Date(date1).toDateString() === new Date(date2).toDateString();
};

/**
 * Get the start and end of a week given a date
 */
export const getWeekBounds = (date: string): { start: string; end: string } => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  
  const monday = new Date(d.setDate(diff));
  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);
  
  return {
    start: monday.toISOString().split('T')[0],
    end: friday.toISOString().split('T')[0]
  };
};

/**
 * Calculate business days between two dates
 */
export const getBusinessDaysBetween = (startDate: string, endDate: string): number => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  let count = 0;
  
  const current = new Date(start);
  while (current <= end) {
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday or Saturday
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  
  return count;
};

/**
 * Handle async operations with error handling
 */
export const handleAsyncOperation = async <T>(
  operation: Promise<T>,
  errorMessage: string = 'Operation failed'
): Promise<{ data: T | null; error: string | null }> => {
  try {
    const data = await operation;
    return { data, error: null };
  } catch (error: any) {
    console.error(errorMessage, error);
    const errorMsg = error?.message || error?.toString() || errorMessage;
    return { data: null, error: errorMsg };
  }
};

/**
 * Create a delay/sleep function
 */
export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Retry an async operation with exponential backoff
 */
export const retryOperation = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  let lastError: any;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      const delay = baseDelay * Math.pow(2, attempt);
      await sleep(delay);
    }
  }
  
  throw lastError;
};