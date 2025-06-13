// constants/config.ts
// 🔧 Application configuration and constants

import type { TimeCategory, AttendanceStatus } from '../lib/types';

// Application metadata
export const APP_CONFIG = {
  name: 'Boopin Attendance Dashboard',
  description: 'Real-time employee attendance tracking and analytics',
  version: '1.0.0',
  author: 'Boopin',
  url: 'https://boopin-attendance-dashboard.vercel.app'
} as const;

// Time categories and their display names
export const TIME_CATEGORIES: Record<string, { label: string; color: string }> = {
  'Early Check-in': { label: 'Early', color: 'blue' },
  'On Time': { label: 'On Time', color: 'green' },
  'On-time Check-in': { label: 'On Time', color: 'green' },
  'Acceptable': { label: 'Acceptable', color: 'yellow' },
  'Acceptable Check-in': { label: 'Acceptable', color: 'yellow' },
  'Late': { label: 'Late', color: 'red' },
  'Late Check-in': { label: 'Late', color: 'red' },
  'Invalid Time': { label: 'Invalid', color: 'gray' },
  'N/A': { label: 'N/A', color: 'gray' }
} as const;

// Attendance status and their display properties
export const ATTENDANCE_STATUS: Record<string, { label: string; color: string }> = {
  'Present': { label: 'Present', color: 'green' },
  'Absent': { label: 'Absent', color: 'red' },
  'Leave': { label: 'Leave', color: 'yellow' },
  'N/A': { label: 'N/A', color: 'gray' }
} as const;

// Working hours configuration
export const WORK_SCHEDULE = {
  standardStart: '09:00',
  earlyThreshold: '09:00',
  onTimeThreshold: '09:30',
  acceptableThreshold: '10:00',
  standardEnd: '18:00',
  lunchBreakStart: '13:00',
  lunchBreakEnd: '14:00',
  minimumWorkHours: 8,
  workDays: [1, 2, 3, 4, 5] // Monday to Friday
} as const;

// Dashboard configuration
export const DASHBOARD_CONFIG = {
  defaultTab: 'summary' as const,
  refreshInterval: 300000, // 5 minutes in milliseconds
  maxRecordsPerPage: 50,
  exportFormats: ['csv', 'excel'] as const,
  dateFormat: 'YYYY-MM-DD',
  timeFormat: 'HH:mm:ss',
  timezone: 'Asia/Dubai'
} as const;

// Color palette for charts and UI elements
export const COLORS = {
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    900: '#1e3a8a'
  },
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    900: '#14532d'
  },
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    900: '#78350f'
  },
  danger: {
    50: '#fef2f2',
    100: '#fee2e2',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    900: '#7f1d1d'
  },
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    900: '#111827'
  }
} as const;

// Chart configuration
export const CHART_CONFIG = {
  colors: [
    COLORS.primary[500],
    COLORS.success[500],
    COLORS.warning[500],
    COLORS.danger[500],
    COLORS.gray[500]
  ],
  defaultHeight: 300,
  responsive: true,
  animations: {
    duration: 1000,
    easing: 'easeInOutQuart'
  }
} as const;

// API endpoints and configuration
export const API_CONFIG = {
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || '',
  timeout: 30000,
  retryAttempts: 3,
  retryDelay: 1000
} as const;

// File upload configuration
export const UPLOAD_CONFIG = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: ['image/jpeg', 'image/png', 'application/pdf', 'text/csv'],
  maxFiles: 5
} as const;

// Validation rules
export const VALIDATION_RULES = {
  employee: {
    codeMinLength: 1,
    codeMaxLength: 20,
    nameMinLength: 2,
    nameMaxLength: 100
  },
  attendance: {
    timeFormat: /^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/,
    dateFormat: /^\d{4}-\d{2}-\d{2}$/,
    maxWorkHours: 24,
    minWorkHours: 0
  }
} as const;

// Error messages
export const ERROR_MESSAGES = {
  generic: 'An unexpected error occurred. Please try again.',
  network: 'Network error. Please check your connection and try again.',
  timeout: 'Request timed out. Please try again.',
  notFound: 'The requested data was not found.',
  unauthorized: 'You are not authorized to perform this action.',
  validation: 'Please check your input and try again.',
  export: 'Failed to export data. Please try again.'
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  dataLoaded: 'Data loaded successfully',
  dataExported: 'Data exported successfully',
  dataSaved: 'Data saved successfully',
  dataDeleted: 'Data deleted successfully',
  syncCompleted: 'Sync completed successfully'
} as const;

// Loading states
export const LOADING_STATES = {
  initial: 'Loading dashboard...',
  refreshing: 'Refreshing data...',
  exporting: 'Exporting data...',
  saving: 'Saving changes...',
  deleting: 'Deleting data...',
  syncing: 'Syncing data...'
} as const;

// Feature flags
export const FEATURE_FLAGS = {
  enableRealTimeUpdates: true,
  enableDataExport: true,
  enableBulkOperations: true,
  enableAdvancedFilters: true,
  enableDarkMode: false,
  enableNotifications: true
} as const;

// Performance thresholds
export const PERFORMANCE_THRESHOLDS = {
  slowQueryTime: 3000, // 3 seconds
  largeDatasetSize: 1000,
  maxConcurrentRequests: 5,
  cacheExpiration: 300000 // 5 minutes
} as const;

// Pagination configuration
export const PAGINATION_CONFIG = {
  defaultPageSize: 25,
  pageSizeOptions: [10, 25, 50, 100],
  maxPageSize: 100,
  showSizeChanger: true,
  showQuickJumper: true
} as const;

// Date and time configuration
export const DATE_TIME_CONFIG = {
  defaultDateRange: 30, // days
  maxDateRange: 365, // days
  datePickerFormat: 'YYYY-MM-DD',
  timePickerFormat: 'HH:mm',
  displayDateFormat: 'MMM DD, YYYY',
  displayTimeFormat: 'h:mm A'
} as const;

// Export default configuration object
export default {
  APP_CONFIG,
  TIME_CATEGORIES,
  ATTENDANCE_STATUS,
  WORK_SCHEDULE,
  DASHBOARD_CONFIG,
  COLORS,
  CHART_CONFIG,
  API_CONFIG,
  UPLOAD_CONFIG,
  VALIDATION_RULES,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  LOADING_STATES,
  FEATURE_FLAGS,
  PERFORMANCE_THRESHOLDS,
  PAGINATION_CONFIG,
  DATE_TIME_CONFIG
} as const;