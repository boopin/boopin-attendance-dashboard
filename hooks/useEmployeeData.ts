// hooks/useEmployeeData.ts
// 👥 Custom hook for managing employee data and records - FIXED VERSION WITH TYPE COERCION

import { useState, useCallback } from 'react';
import type { Employee, EmployeeRecord, UseEmployeeDataReturn } from '../lib/types';
import { handleSupabaseError } from '../lib/supabase';
import { handleAsyncOperation, groupBy } from '../lib/utils';
import { getMonthDateRange } from '../lib/formatters';
import { supabase } from '../lib/supabase';

export const useEmployeeData = (): UseEmployeeDataReturn => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeeRecords, setEmployeeRecords] = useState<EmployeeRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Clear error
  const clearError = useCallback(() => {
    setError('');
  }, []);

  // Load all active employees - FIXED VERSION WITH PAGINATION AND MOST RECENT NAME
  const loadEmployees = useCallback(async () => {
    setLoading(true);
    clearError();

    try {
      console.log('🔍 Loading all unique employees...');
      
      // Load ALL records using pagination to avoid 1000 record limit
      // Order by date DESC to get most recent records first
      let allRecords: any[] = [];
      let rangeStart = 0;
      const rangeSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data: batch, error: loadError } = await supabase
          .from('daily_employee_records')
          .select('emp_code, name, date')
          .range(rangeStart, rangeStart + rangeSize - 1)
          .order('date', { ascending: false });  // Most recent first

        if (loadError) {
          console.error('❌ Supabase error:', loadError);
          throw loadError;
        }
        
        if (batch && batch.length > 0) {
          allRecords = [...allRecords, ...batch];
          rangeStart += rangeSize;
          console.log(`📈 Loaded ${allRecords.length} records so far...`);
          
          // If we got less than the range size, we've reached the end
          if (batch.length < rangeSize) {
            hasMore = false;
          }
        } else {
          hasMore = false;
        }
      }
      
      console.log(`📊 Total records loaded: ${allRecords.length}`);
      
      // Debug: Check for any null or empty values
      const recordsWithIssues = allRecords.filter(emp => 
        !emp.emp_code || !emp.name || String(emp.emp_code).trim() === '' || String(emp.name).trim() === ''
      );
      console.log(`⚠️ Records with missing data: ${recordsWithIssues.length}`);

      // Use Map for efficient deduplication - FIX: Use most recent name (first encountered since sorted by date DESC)
      const uniqueEmployeesMap = new Map<string, Employee>();
      let processedCount = 0;
      let skippedCount = 0;
      
      allRecords.forEach((emp) => {
        processedCount++;
        
        // FIX: Convert emp_code to string for consistent handling
        const empCodeStr = String(emp.emp_code || '').trim();
        const nameStr = String(emp.name || '').trim();
        
        if (empCodeStr && nameStr) {
          // Only set if not already in map (first = most recent due to date DESC ordering)
          if (!uniqueEmployeesMap.has(empCodeStr)) {
            uniqueEmployeesMap.set(empCodeStr, {
              emp_code: empCodeStr,
              name: nameStr,
              is_active: true
            });
            console.log(`✅ Added employee: ${nameStr} (Code: ${empCodeStr})`);
          }
        } else {
          skippedCount++;
          console.log(`⚠️ Skipped record: emp_code="${emp.emp_code}" (type: ${typeof emp.emp_code}), name="${emp.name}"`);
        }
      });

      console.log(`📋 Processing complete: ${processedCount} total records, ${skippedCount} skipped`);

      const uniqueEmployees = Array.from(uniqueEmployeesMap.values())
        .sort((a, b) => a.name.localeCompare(b.name));

      console.log(`✅ Found ${uniqueEmployees.length} unique employees`);
      console.log('📝 All unique employee codes:', uniqueEmployees.map(e => e.emp_code).sort((a, b) => {
        // Sort numerically if possible
        const numA = parseInt(a, 10);
        const numB = parseInt(b, 10);
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
        return a.localeCompare(b);
      }));
      
      // Check specifically for employee 14 (Randa)
      const hasEmployee14 = uniqueEmployees.some(e => e.emp_code === '14');
      console.log(`🔍 Employee 14 (Randa) found: ${hasEmployee14}`);
      if (hasEmployee14) {
        const randa = uniqueEmployees.find(e => e.emp_code === '14');
        console.log(`✅ Randa details: ${randa?.name} (Code: ${randa?.emp_code})`);
      } else {
        // Additional debug: check if 14 exists as a number
        const hasNumeric14 = allRecords.some(r => r.emp_code === 14 || r.emp_code === '14');
        console.log(`🔍 Raw records contain emp_code 14: ${hasNumeric14}`);
        if (hasNumeric14) {
          const sample = allRecords.find(r => r.emp_code === 14 || r.emp_code === '14');
          console.log(`📋 Sample record for 14:`, sample, `Type: ${typeof sample?.emp_code}`);
        }
      }
      
      setEmployees(uniqueEmployees);
      setLoading(false);
      return { data: uniqueEmployees, error: null };

    } catch (err: any) {
      console.error('❌ Error in loadEmployees:', err);
      const errorMsg = handleSupabaseError(err, 'Employee Loading');
      setError(errorMsg);
      setEmployees([]);
      setLoading(false);
      return { data: null, error: errorMsg };
    }
  }, [clearError]);

  // Load employee records for a specific date
  const loadEmployeeData = useCallback(async (date: string) => {
    setLoading(true);
    clearError();

    try {
      console.log(`🔍 Loading employee records for date: ${date}`);

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

      // FIX: Normalize emp_code to string in all records
      const normalizedData = (data || []).map(record => ({
        ...record,
        emp_code: String(record.emp_code || '').trim(),
        name: String(record.name || '').trim()
      }));

      setEmployeeRecords(normalizedData);
      setLoading(false);
      return { data: normalizedData, error: null };

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
      // FIX: Ensure empCode is a string for consistent querying
      const empCodeStr = String(empCode).trim();
      console.log(`🔍 Loading monthly data for employee ${empCodeStr} in ${month}`);
      
      const { startDate, endDate } = getMonthDateRange(month);
      
      // FIX: Try both string and numeric versions of emp_code
      const { data, error: loadError } = await supabase
        .from('daily_employee_records')
        .select('*')
        .or(`emp_code.eq.${empCodeStr},emp_code.eq.${parseInt(empCodeStr, 10) || empCodeStr}`)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true });

      if (loadError) throw loadError;

      console.log(`✅ Found ${data?.length || 0} monthly records for employee ${empCodeStr}`);

      // FIX: Normalize emp_code to string in all records
      const normalizedData = (data || []).map(record => ({
        ...record,
        emp_code: String(record.emp_code || '').trim(),
        name: String(record.name || '').trim()
      }));

      setEmployeeRecords(normalizedData);
      setLoading(false);
      return { data: normalizedData, error: null };

    } catch (err: any) {
      console.error('❌ Error in loadEmployeeMonthlyData:', err);
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
      console.log(`🔍 Loading weekly data from ${weekStart} to ${weekEnd}`);
      
      const { data, error: loadError } = await supabase
        .from('daily_employee_records')
        .select('*')
        .gte('date', weekStart)
        .lte('date', weekEnd)
        .order('emp_code')
        .order('date');

      if (loadError) throw loadError;

      console.log(`✅ Found ${data?.length || 0} weekly records`);

      // Process data into WeeklyEmployeeData format - FIX: Use string keys consistently
      const employeeMap = new Map<string, any>();
      
      data?.forEach(record => {
        // FIX: Convert emp_code to string for consistent Map keys
        const empCodeStr = String(record.emp_code || '').trim();
        const nameStr = String(record.name || '').trim();
        
        if (!empCodeStr) return; // Skip records without emp_code
        
        if (!employeeMap.has(empCodeStr)) {
          employeeMap.set(empCodeStr, {
            emp_code: empCodeStr,
            name: nameStr,
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

        const employee = employeeMap.get(empCodeStr)!;
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

      console.log(`✅ Processed ${processedData.length} employees for weekly report`);

      setLoading(false);
      return { data: processedData, error: null };

    } catch (err: any) {
      console.error('❌ Error in loadWeeklyEmployeeData:', err);
      const errorMsg = handleSupabaseError(err, 'Weekly Employee Data Loading');
      setError(errorMsg);
      setLoading(false);
      return { data: [], error: errorMsg };
    }
  }, [clearError]);

  // Get employee by code - FIX: Handle both string and number comparisons
  const getEmployeeByCode = useCallback((empCode: string): Employee | null => {
    const empCodeStr = String(empCode).trim();
    return employees.find(emp => String(emp.emp_code).trim() === empCodeStr) || null;
  }, [employees]);

  // Get employee name by code - FIX: Handle both string and number comparisons
  const getEmployeeName = useCallback((empCode: string): string => {
    const empCodeStr = String(empCode).trim();
    const employee = employees.find(emp => String(emp.emp_code).trim() === empCodeStr);
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
