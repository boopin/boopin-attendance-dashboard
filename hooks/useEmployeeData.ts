// hooks/useEmployeeData.ts
// 👥 Custom hook for managing employee data and records - FIXED VERSION

import { useState, useCallback } from 'react';
import type { Employee, EmployeeRecord, UseEmployeeDataReturn } from '../lib/types';
import { handleSupabaseError } from '../lib/supabase';
import { handleAsyncOperation, groupBy } from '../lib/utils';
import { getMonthDateRange } from '../lib/formatters';
import { supabase } from '../lib/supabase'; // Direct import

export const useEmployeeData = (): UseEmployeeDataReturn => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeeRecords, setEmployeeRecords] = useState<EmployeeRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Clear error
  const clearError = useCallback(() => {
    setError('');
  }, []);

  // Load all active employees
  const loadEmployees = useCallback(async () => {
    setLoading(true);
    clearError();

    try {
      // Get unique employees from daily_employee_records
      const { data, error: loadError } = await supabase
        .from('daily_employee_records')
        .select('emp_code, name')
        .order('emp_code');

      if (loadError) throw loadError;

      // Remove duplicates and create employee objects
      const uniqueEmployees = Array.from(
        new Map(data?.map(emp => [emp.emp_code, emp]) || []).values()
      ).map(emp => ({
        emp_code: emp.emp_code,
        name: emp.name
      }));

      setEmployees(uniqueEmployees);
      setLoading(false);
      return { data: uniqueEmployees, error: null };

    } catch (err: any) {
      const errorMsg = handleSupabaseError(err, 'Employee Loading');
      setError(errorMsg);
      setEmployees([]);
      setLoading(false);
      return { data: null, error: errorMsg };
    }
  }, [clearError]);

  // Load employee records for a specific date - FIXED VERSION
  const loadEmployeeData = useCallback(async (date: string) => {
    setLoading(true);
    clearError();

    try {
      console.log(`🔍 Loading employee records for date: ${date}`);

      // Direct Supabase query - exactly what the test script showed works
      const { data, error: loadError } = await supabase
        .from('daily_employee_records')
        .select('emp_code, name, date, check_in, check_out, work_hours, time_category, status, total_punches')
        .eq('date', date)
        .order('check_in', { ascending: true });

      if (loadError) {
        console.error('❌ Supabase error:', loadError);
        throw loadError;
      }

      console.log(`✅ Found ${data?.length || 0} employee records for ${date}`);

      setEmployeeRecords(data || []);
      setLoading(false);
      return { data: data || [], error: null };

    } catch (err: any) {
      console.error('❌ Error in loadEmployeeData:', err);
      const errorMsg = handleSupabaseError(err, 'Employee Records Loading');
      setError(errorMsg);
      setEmployeeRecords([]);
      setLoading(false);
      return { data: null, error: errorMsg };
    }
  }, [clearError]);

  // Load monthly data for a specific employee
  const loadEmployeeMonthlyData = useCallback(async (empCode: string, month: string) => {
    setLoading(true);
    clearError();

    try {
      const { startDate, endDate } = getMonthDateRange(month);
      
      const { data, error: loadError } = await supabase
        .from('daily_employee_records')
        .select('*')
        .eq('emp_code', empCode)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true });

      if (loadError) throw loadError;

      setEmployeeRecords(data || []);
      setLoading(false);
      return { data: data || [], error: null };

    } catch (err: any) {
      const errorMsg = handleSupabaseError(err, 'Monthly Employee Data Loading');
      setError(errorMsg);
      setEmployeeRecords([]);
      setLoading(false);
      return { data: null, error: errorMsg };
    }
  }, [clearError]);

  // Load weekly employee data with daily breakdown
  const loadWeeklyEmployeeData = useCallback(async (weekStart: string, weekEnd: string) => {
    setLoading(true);
    clearError();

    try {
      const { data, error: loadError } = await supabase
        .from('daily_employee_records')
        .select('*')
        .gte('date', weekStart)
        .lte('date', weekEnd)
        .order('emp_code')
        .order('date');

      if (loadError) throw loadError;

      // Process data into WeeklyEmployeeData format
      const employeeMap = new Map<string, any>();
      
      data?.forEach(record => {
        if (!employeeMap.has(record.emp_code)) {
          employeeMap.set(record.emp_code, {
            emp_code: record.emp_code,
            name: record.name,
            days: [],
            totalDays: 0,
            presentDays: 0,
            leaveDays: 0,
            totalHours: 0,
            onTimeDays: 0,
            lateDays: 0,
            dailyBreakdown: {}
          });
        }

        const employee = employeeMap.get(record.emp_code)!;
        employee.days.push(record);
        employee.totalDays++;
        
        // Store daily details by date
        employee.dailyBreakdown[record.date] = {
          date: record.date,
          check_in: record.check_in,
          check_out: record.check_out,
          work_hours: record.work_hours,
          status: record.status,
          time_category: record.time_category
        };
        
        if (record.status === 'Present') {
          employee.presentDays++;
          employee.totalHours += record.work_hours || 0;
          
          if (['On Time', 'On-time Check-in', 'Early Check-in'].includes(record.time_category)) {
            employee.onTimeDays++;
          } else if (['Late Check-in', 'Late'].includes(record.time_category)) {
            employee.lateDays++;
          }
        } else {
          employee.leaveDays++;
        }
      });

      const processedData = Array.from(employeeMap.values())
        .sort((a, b) => a.name.localeCompare(b.name));

      setLoading(false);
      return { data: processedData, error: null };

    } catch (err: any) {
      const errorMsg = handleSupabaseError(err, 'Weekly Employee Data Loading');
      setError(errorMsg);
      setLoading(false);
      return { data: [], error: errorMsg };
    }
  }, [clearError]);

  // Get employee by code
  const getEmployeeByCode = useCallback((empCode: string): Employee | null => {
    return employees.find(emp => emp.emp_code === empCode) || null;
  }, [employees]);

  // Get employee name by code
  const getEmployeeName = useCallback((empCode: string): string => {
    const employee = employees.find(emp => emp.emp_code === empCode);
    return employee?.name || empCode;
  }, [employees]);

  // Get employee records grouped by status
  const getRecordsByStatus = useCallback(() => {
    return groupBy(employeeRecords, 'status');
  }, [employeeRecords]);

  // Get employee records grouped by time category
  const getRecordsByTimeCategory = useCallback(() => {
    return groupBy(employeeRecords, 'time_category');
  }, [employeeRecords]);

  // Calculate attendance statistics for current records
  const getAttendanceStats = useCallback(() => {
    const total = employeeRecords.length;
    if (total === 0) {
      return {
        totalEmployees: 0,
        presentCount: 0,
        absentCount: 0,
        onTimeCount: 0,
        lateCount: 0,
        earlyCount: 0,
        acceptableCount: 0,
        attendanceRate: 0,
        onTimeRate: 0
      };
    }

    const presentCount = employeeRecords.filter(r => r.status === 'Present').length;
    const absentCount = total - presentCount;
    
    const onTimeCount = employeeRecords.filter(r => 
      ['On Time', 'On-time Check-in'].includes(r.time_category || '')
    ).length;
    
    const lateCount = employeeRecords.filter(r => 
      ['Late', 'Late Check-in'].includes(r.time_category || '')
    ).length;
    
    const earlyCount = employeeRecords.filter(r => 
      r.time_category === 'Early Check-in'
    ).length;
    
    const acceptableCount = employeeRecords.filter(r => 
      ['Acceptable', 'Acceptable Check-in'].includes(r.time_category || '')
    ).length;

    const attendanceRate = Math.round((presentCount / total) * 100);
    const onTimeRate = Math.round(((onTimeCount + earlyCount) / total) * 100);

    return {
      totalEmployees: total,
      presentCount,
      absentCount,
      onTimeCount,
      lateCount,
      earlyCount,
      acceptableCount,
      attendanceRate,
      onTimeRate
    };
  }, [employeeRecords]);

  // Get work hours statistics
  const getWorkHoursStats = useCallback(() => {
    const recordsWithHours = employeeRecords.filter(r => r.work_hours && r.work_hours > 0);
    
    if (recordsWithHours.length === 0) {
      return {
        totalHours: 0,
        averageHours: 0,
        minHours: 0,
        maxHours: 0,
        employeesWithHours: 0
      };
    }

    const hours = recordsWithHours.map(r => r.work_hours!);
    const totalHours = hours.reduce((sum, h) => sum + h, 0);
    const averageHours = totalHours / hours.length;
    const minHours = Math.min(...hours);
    const maxHours = Math.max(...hours);

    return {
      totalHours: Math.round(totalHours * 10) / 10,
      averageHours: Math.round(averageHours * 10) / 10,
      minHours: Math.round(minHours * 10) / 10,
      maxHours: Math.round(maxHours * 10) / 10,
      employeesWithHours: recordsWithHours.length
    };
  }, [employeeRecords]);

  return {
    // Data
    employees,
    employeeRecords,
    loading,
    error,

    // Actions
    loadEmployees,
    loadEmployeeData,
    loadEmployeeMonthlyData,
    loadWeeklyEmployeeData,
    clearError,

    // Getters
    getEmployeeByCode,
    getEmployeeName,
    getRecordsByStatus,
    getRecordsByTimeCategory,
    getAttendanceStats,
    getWorkHoursStats
  };
};
