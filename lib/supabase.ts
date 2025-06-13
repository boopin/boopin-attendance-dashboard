// lib/supabase.ts
// 🔧 Supabase configuration and client setup

import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const SUPABASE_CONFIG = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xfemrztsdacozjxqjjko.supabase.co',
  // Note: In production, use anon key with proper RLS policies instead of service role key
  key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmZW1yenRzZGFjb3pqeHFqamtvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTQ1Mzg5MCwiZXhwIjoyMDY1MDI5ODkwfQ.T-jwWHkR5i_V0j6BljQyFIhc3ELEfS5fWH0O8LnkEoE'
} as const;

// Create and export Supabase client
export const supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.key);

// Export config for use in other files if needed
export { SUPABASE_CONFIG };

// Database table names (for consistency)
export const TABLES = {
  DAILY_SUMMARIES: 'daily_summaries',
  DAILY_EMPLOYEE_RECORDS: 'daily_employee_records',
  WEEKLY_SUMMARIES: 'weekly_summaries',
  MONTHLY_SUMMARIES: 'monthly_summaries',
  EMPLOYEES: 'employees',
  WEEKLY_EMPLOYEE_RECORDS: 'weekly_employee_records',
  SYNC_LOGS: 'sync_logs',
  UNIQUE_EMPLOYEES: 'unique_employees',
  CURRENT_WEEK_SUMMARY: 'current_week_summary',
  LATEST_DAILY_SUMMARIES: 'latest_daily_summaries'
} as const;

// Common query configurations
export const QUERY_LIMITS = {
  DAILY_SUMMARIES: 10,
  WEEKLY_SUMMARIES: 10,
  EMPLOYEE_RECORDS: 1000,
  MONTHLY_RECORDS: 100
} as const;

// Helper function to handle Supabase errors
export const handleSupabaseError = (error: any, context: string): string => {
  console.error(`❌ Supabase Error in ${context}:`, error);
  
  if (error?.message) {
    return `${context}: ${error.message}`;
  }
  
  if (typeof error === 'string') {
    return `${context}: ${error}`;
  }
  
  return `${context}: Unknown error occurred`;
};

// Type-safe query builder helpers
export const createQuery = {
  dailySummaries: () => supabase.from(TABLES.DAILY_SUMMARIES),
  employeeRecords: () => supabase.from(TABLES.DAILY_EMPLOYEE_RECORDS),
  weeklySummaries: () => supabase.from(TABLES.WEEKLY_SUMMARIES),
  monthlySummaries: () => supabase.from(TABLES.MONTHLY_SUMMARIES),
  employees: () => supabase.from(TABLES.EMPLOYEES),
  weeklyEmployeeRecords: () => supabase.from(TABLES.WEEKLY_EMPLOYEE_RECORDS),
  syncLogs: () => supabase.from(TABLES.SYNC_LOGS),
};

// Common query patterns
export const commonQueries = {
  // Get recent daily summaries
  getRecentDailySummaries: (limit: number = QUERY_LIMITS.DAILY_SUMMARIES) =>
    createQuery.dailySummaries()
      .select('*')
      .order('date', { ascending: false })
      .limit(limit),

  // Get employee records for a specific date
  getEmployeeRecordsByDate: (date: string) =>
    createQuery.employeeRecords()
      .select('*')
      .eq('date', date)
      .order('check_in', { ascending: true, nullsFirst: false }),
  
  // Get active employees
  getActiveEmployees: () =>
    createQuery.employees()
      .select('emp_code, name, department, position, is_active')
      .eq('is_active', true)
      .order('name', { ascending: true }),

  // Get weekly summaries
  getRecentWeeklySummaries: (limit: number = QUERY_LIMITS.WEEKLY_SUMMARIES) =>
    createQuery.weeklySummaries()
      .select('*')
      .order('week_start', { ascending: false })
      .limit(limit),

  // Get employee monthly data
  getEmployeeMonthlyData: (empCode: string, startDate: string, endDate: string) =>
    createQuery.employeeRecords()
      .select('*')
      .eq('emp_code', empCode)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true }),

  // Get weekly employee data
  getWeeklyEmployeeData: (weekStart: string, weekEnd: string) =>
    createQuery.employeeRecords()
      .select('*')
      .gte('date', weekStart)
      .lte('date', weekEnd)
      .order('emp_code', { ascending: true })
      .order('date', { ascending: true }),
};
