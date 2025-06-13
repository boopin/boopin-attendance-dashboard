'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';

// Types
interface DailySummary {
  id?: string;
  date: string;
  total_employees_present: number;
  early_count: number;
  ontime_count: number;
  acceptable_count: number;
  late_count: number;
  ontime_rate: number;
  earliest_checkin?: string;
  latest_checkin?: string;
  sync_timestamp?: string;
}

interface WeeklySummary {
  id?: string;
  week_start: string;
  week_end: string;
  total_employees: number;
  perfect_attendance_count: number;
  perfect_attendance_rate: number;
  sync_timestamp?: string;
}

interface EmployeeRecord {
  emp_code: string;
  name: string;
  date: string;
  check_in?: string;
  check_out?: string;
  work_hours?: number;
  total_punches?: number;
  status?: string;
  time_category?: string;
}

interface Employee {
  emp_code: string;
  name: string;
  is_active: boolean;
}

interface WeeklyEmployeeData {
  emp_code: string;
  name: string;
  days: EmployeeRecord[];
  totalDays: number;
  presentDays: number;
  leaveDays: number;
  totalHours: number;
  onTimeDays: number;
  lateDays: number;
  dailyBreakdown?: { [date: string]: EmployeeRecord };
}

type TabType = 'summary' | 'employees' | 'weekly' | 'monthly';
type ExportType = 'daily' | 'weekly' | 'monthly' | 'employee' | 'weeklyDetails';
type WeeklyViewMode = 'summary' | 'details';

// Configuration - Move these to environment variables in production
const SUPABASE_CONFIG = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xfemrztsdacozjxqjjko.supabase.co',
  // WARNING: Never expose service role key in client-side code in production
  // Use anon key with proper RLS policies instead
  key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmZW1yenRzZGFjb3pqeHFqamtvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTQ1Mzg5MCwiZXhwIjoyMDY1MDI5ODkwfQ.T-jwWHkR5i_V0j6BljQyFIhc3ELEfS5fWH0O8LnkEoE'
} as const;

// Create Supabase client
const supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.key);
export default function Dashboard() {
  // State management
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [activeTab, setActiveTab] = useState<TabType>('summary');
  
  // Data states
  const [dailyData, setDailyData] = useState<DailySummary[]>([]);
  const [employeeData, setEmployeeData] = useState<EmployeeRecord[]>([]);
  const [weeklyData, setWeeklyData] = useState<WeeklySummary[]>([]);
  const [employeeMonthlyData, setEmployeeMonthlyData] = useState<EmployeeRecord[]>([]);
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
  
  // Selection states
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  
  // Weekly states
  const [selectedWeek, setSelectedWeek] = useState<string>('');
  const [weeklyEmployeeData, setWeeklyEmployeeData] = useState<WeeklyEmployeeData[]>([]);
  const [availableWeeks, setAvailableWeeks] = useState<WeeklySummary[]>([]);
  const [weeklyViewMode, setWeeklyViewMode] = useState<WeeklyViewMode>('summary');
  
  // NEW: Expandable employee state
  const [expandedEmployee, setExpandedEmployee] = useState<string | null>(null);

  // Error handler
  const handleError = useCallback((error: any, context: string) => {
    console.error(`❌ Error in ${context}:`, error);
    const errorMessage = error?.message || error?.toString() || 'Unknown error occurred';
    setError(`${context}: ${errorMessage}`);
  }, []);

  // Clear error handler
  const clearError = useCallback(() => {
    setError('');
  }, []);

  // Initialize default month
  const currentMonth = useMemo(() => {
    return new Date().toISOString().slice(0, 7); // YYYY-MM format
  }, []);

  useEffect(() => {
    setSelectedMonth(currentMonth);
  }, [currentMonth]);

  useEffect(() => {
    loadData();
  }, []);
  // Main data loading function
  const loadData = useCallback(async () => {
    try {
      clearError();
      setLoading(true);
      console.log('📡 Loading dashboard data...');
      
      // Load daily summaries
      const { data: summaryData, error: summaryError } = await supabase
        .from('daily_summaries')
        .select('*')
        .order('date', { ascending: false })
        .limit(10);

      if (summaryError) {
        throw new Error(`Failed to load daily summaries: ${summaryError.message}`);
      }

      // Load weekly summaries
      const { data: weekData, error: weekError } = await supabase
        .from('weekly_summaries')
        .select('*')
        .order('week_start', { ascending: false })
        .limit(10);

      if (weekError) {
        console.warn('⚠️ Weekly data error:', weekError.message);
      } else if (weekData) {
        setWeeklyData(weekData);
        setAvailableWeeks(weekData);
        if (weekData.length > 0) {
          setSelectedWeek(`${weekData[0].week_start}_${weekData[0].week_end}`);
        }
      }

      // Load employees from attendance records
      console.log('📋 Loading employees from attendance records...');
      const { data: attendanceEmployees, error: attEmpError } = await supabase
        .from('daily_employee_records')
        .select('emp_code, name')
        .order('name', { ascending: true });

      if (attEmpError) {
        console.warn('⚠️ Employee data error:', attEmpError.message);
      } else if (attendanceEmployees) {
        // Create unique employee list
        const uniqueEmployeesMap = new Map<string, Employee>();
        
        attendanceEmployees.forEach(record => {
          if (!uniqueEmployeesMap.has(record.emp_code)) {
            uniqueEmployeesMap.set(record.emp_code, {
              emp_code: record.emp_code,
              name: record.name,
              is_active: true
            });
          }
        });

        const uniqueEmployees = Array.from(uniqueEmployeesMap.values())
          .sort((a, b) => a.name.localeCompare(b.name));
        
        setAllEmployees(uniqueEmployees);
        console.log(`✅ Loaded ${uniqueEmployees.length} employees`);
      }

      setDailyData(summaryData || []);

      // Load employee records for the most recent date if available
      if (summaryData && summaryData.length > 0) {
        const latestDate = summaryData[0].date;
        setSelectedDate(latestDate);
        await loadEmployeeData(latestDate);
      }

      console.log('✅ Data loaded successfully');
    } catch (error: any) {
      handleError(error, 'Data Loading');
    } finally {
      setLoading(false);
    }
  }, [handleError, clearError]);

  // Load employee data for a specific date
  const loadEmployeeData = useCallback(async (date: string) => {
    try {
      console.log(`📊 Loading employee data for ${date}...`);
      
      const { data: empData, error: empError } = await supabase
        .from('daily_employee_records')
        .select('*')
        .eq('date', date)
        .order('check_in', { ascending: true, nullsLast: true });

      if (empError) {
        throw new Error(`Failed to load employee data: ${empError.message}`);
      }

      console.log('✅ Employee data loaded:', empData?.length || 0, 'records');
      setEmployeeData(empData || []);
    } catch (error: any) {
      handleError(error, 'Employee Data Loading');
      setEmployeeData([]);
    }
  }, [handleError]);

  // Load monthly data for a specific employee
  const loadEmployeeMonthlyData = useCallback(async (empCode: string, month: string) => {
    try {
      console.log(`📊 Loading monthly data for employee ${empCode} in ${month}...`);
      
      // Calculate the correct date range for the month
      const year = parseInt(month.split('-')[0]);
      const monthNum = parseInt(month.split('-')[1]);
      
      if (isNaN(year) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
        throw new Error('Invalid month format');
      }
      
      // Get the last day of the month properly
      const lastDay = new Date(year, monthNum, 0).getDate();
      const startDate = `${month}-01`;
      const endDate = `${month}-${lastDay.toString().padStart(2, '0')}`;
      
      console.log(`🔍 Query: ${empCode} from ${startDate} to ${endDate}`);
      
      const { data: monthData, error: monthError } = await supabase
        .from('daily_employee_records')
        .select('*')
        .eq('emp_code', empCode)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true });

      if (monthError) {
        throw new Error(`Failed to load monthly data: ${monthError.message}`);
      }

      console.log(`✅ Monthly data loaded: ${monthData?.length || 0} records`);
      setEmployeeMonthlyData(monthData || []);
    } catch (error: any) {
      handleError(error, 'Monthly Data Loading');
      setEmployeeMonthlyData([]);
    }
  }, [handleError]);
  // Load weekly employee details with daily breakdown
  const loadWeeklyEmployeeData = useCallback(async (weekStart: string, weekEnd: string) => {
    try {
      console.log(`📊 Loading weekly employee data from ${weekStart} to ${weekEnd}...`);
      
      const { data: weekData, error: weekError } = await supabase
        .from('daily_employee_records')
        .select('*')
        .gte('date', weekStart)
        .lte('date', weekEnd)
        .order('emp_code', { ascending: true })
        .order('date', { ascending: true });

      if (weekError) {
        throw new Error(`Failed to load weekly employee data: ${weekError.message}`);
      }

      // Group by employee and calculate weekly stats
      const employeeMap = new Map<string, any>();
      
      weekData?.forEach(record => {
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
            dailyBreakdown: {} // NEW: Store daily details
          });
        }

        const employee = employeeMap.get(record.emp_code)!;
        employee.days.push(record);
        employee.totalDays++;
        
        // NEW: Store daily details by date
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
          
          if (record.time_category === 'On-time Check-in') {
            employee.onTimeDays++;
          } else if (record.time_category === 'Late Check-in') {
            employee.lateDays++;
          }
        } else {
          employee.leaveDays++;
        }
      });

      // Convert map to array and sort by name
      const employeeArray = Array.from(employeeMap.values())
        .sort((a, b) => a.name.localeCompare(b.name));

      console.log(`✅ Weekly employee data loaded: ${employeeArray.length} employees`);
      setWeeklyEmployeeData(employeeArray);
    } catch (error: any) {
      handleError(error, 'Weekly Employee Data Loading');
      setWeeklyEmployeeData([]);
    }
  }, [handleError]);

  // Event handlers
  const handleDateChange = useCallback(async (date: string) => {
    if (date === selectedDate) return;
    
    setSelectedDate(date);
    setEmployeeData([]);
    clearError();
    await loadEmployeeData(date);
  }, [selectedDate, loadEmployeeData, clearError]);

  const handleEmployeeSelect = useCallback(async (empCode: string) => {
    if (empCode === selectedEmployee) return;
    
    setSelectedEmployee(empCode);
    clearError();
    
    if (empCode && selectedMonth) {
      await loadEmployeeMonthlyData(empCode, selectedMonth);
    }
  }, [selectedEmployee, selectedMonth, loadEmployeeMonthlyData, clearError]);

  const handleMonthChange = useCallback(async (month: string) => {
    if (month === selectedMonth) return;
    
    setSelectedMonth(month);
    clearError();
    
    if (selectedEmployee && month) {
      await loadEmployeeMonthlyData(selectedEmployee, month);
    }
  }, [selectedMonth, selectedEmployee, loadEmployeeMonthlyData, clearError]);

  const handleWeeklySelect = useCallback(async (weekKey: string) => {
    if (weekKey === selectedWeek) return;
    
    setSelectedWeek(weekKey);
    clearError();
    
    if (weekKey && availableWeeks) {
      const [weekStart, weekEnd] = weekKey.split('_');
      if (weekStart && weekEnd) {
        await loadWeeklyEmployeeData(weekStart, weekEnd);
      }
    }
  }, [selectedWeek, availableWeeks, loadWeeklyEmployeeData, clearError]);

  const handleTabChange = useCallback((tab: TabType) => {
    setActiveTab(tab);
    clearError();
  }, [clearError]);
  // Utility functions
  const formatTime = useCallback((timeString: string | null | undefined): string => {
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
  }, []);

  const getStatusColor = useCallback((status: string | null | undefined): string => {
    if (!status) return 'text-gray-600 bg-gray-50';
    
    switch (status.toLowerCase()) {
      case 'present': return 'text-green-600 bg-green-50';
      case 'absent': return 'text-red-600 bg-red-50';
      case 'on-time': return 'text-green-600 bg-green-50';
      case 'late': return 'text-red-600 bg-red-50';
      case 'early': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  }, []);

  const getCategoryColor = useCallback((category: string | null | undefined): string => {
    if (!category) return 'text-gray-600 bg-gray-50';
    
    switch (category.toLowerCase()) {
      case 'early check-in': return 'text-blue-600 bg-blue-50';
      case 'on-time check-in': return 'text-green-600 bg-green-50';
      case 'late check-in': return 'text-red-600 bg-red-50';
      case 'acceptable check-in': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  }, []);

  const formatDate = useCallback((dateString: string): string => {
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
  }, []);

  const formatMonthYear = useCallback((monthString: string): string => {
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
  }, []);

  const roundHours = useCallback((hours: number): number => {
    return Math.round(hours * 10) / 10;
  }, []);

  // Find employee name by code
  const getEmployeeName = useCallback((empCode: string): string => {
    const employee = allEmployees.find(emp => emp.emp_code === empCode);
    return employee?.name || empCode;
  }, [allEmployees]);

  // Helper function to get week days
  const getWeekDays = useCallback((weekStart: string, weekEnd: string) => {
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
  }, []);
  // Enhanced CSV export function
  const exportToCSV = useCallback((
    data: any[], 
    filename: string, 
    type: ExportType
  ) => {
    if (!data || data.length === 0) {
      alert('No data to export');
      return;
    }

    try {
      let csvContent = '';
      let headers: string[] = [];

      // Escape CSV values
      const escapeCSV = (value: any): string => {
        if (value === null || value === undefined) return '';
        const stringValue = String(value);
        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      };

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
            const attendanceRate = row.totalDays > 0 ? Math.round((row.presentDays / row.totalDays) * 100) : 0;
            csvContent += [
              escapeCSV(row.emp_code),
              escapeCSV(row.name),
              escapeCSV(row.totalDays),
              escapeCSV(row.presentDays),
              escapeCSV(row.leaveDays),
              escapeCSV(roundHours(row.totalHours)),
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
  }, [roundHours]);
  // Main render
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="bg-blue-600 text-white px-3 py-1 rounded-lg font-bold mr-4">
                boopin
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Attendance Analytics</h1>
                <p className="text-sm text-gray-500">Real-time workforce insights</p>
              </div>
            </div>
            <button 
              onClick={loadData}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? '🔄 Loading...' : '🔄 Refresh'}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading dashboard...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Tab Navigation */}
            <div className="bg-white rounded-lg shadow">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex" role="tablist">
                  {[
                    { id: 'summary', label: '📊 Daily Summary', icon: '📊' },
                    { id: 'employees', label: '👥 Employee Details', icon: '👥' },
                    { id: 'weekly', label: '📈 Weekly Reports', icon: '📈' },
                    { id: 'monthly', label: '📊 Monthly Reports', icon: '📊' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id as TabType)}
                      className={`py-4 px-6 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                      role="tab"
                      aria-selected={activeTab === tab.id}
                    >
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <span className="text-red-600">⚠️</span>
                  </div>
                  <div className="ml-3 flex-1">
                    <h3 className="text-sm font-medium text-red-800">Error</h3>
                    <p className="mt-1 text-sm text-red-700">{error}</p>
                  </div>
                  <div className="ml-3 flex-shrink-0">
                    <button
                      onClick={clearError}
                      className="bg-red-50 rounded-md p-1.5 text-red-500 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 focus:ring-offset-red-50"
                    >
                      <span className="sr-only">Dismiss</span>
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Status Message */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {dailyData && dailyData.length > 0 ? '🎉 Boopin Dashboard is Live!' : '⚠️ No Data Found'}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`p-4 rounded-lg ${dailyData && dailyData.length > 0 ? 'bg-green-50' : 'bg-yellow-50'}`}>
                  <h3 className={`font-semibold ${dailyData && dailyData.length > 0 ? 'text-green-900' : 'text-yellow-900'}`}>
                    {dailyData && dailyData.length > 0 ? '✅ Connection Status' : '⚠️ Connection Status'}
                  </h3>
                  <p className={dailyData && dailyData.length > 0 ? 'text-green-700' : 'text-yellow-700'}>
                    {dailyData && dailyData.length > 0 
                      ? 'Successfully connected and data found!' 
                      : 'Connected but no historical data found'
                    }
                  </p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-900">📊 Data Status</h3>
                  <p className="text-blue-700">
                    {dailyData?.length || 0} daily reports, {weeklyData?.length || 0} weekly reports, {allEmployees?.length || 0} employees
                  </p>
                </div>
              </div>
            </div>
   {/* Tab Content */}
            {activeTab === 'summary' ? (
              // Daily Summary Tab
              dailyData && dailyData.length > 0 ? (
                <div className="space-y-6">
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-bold text-gray-900">📅 Recent Attendance Data</h3>
                      <button
                        onClick={() => exportToCSV(
                          dailyData, 
                          `daily-reports-${new Date().toISOString().slice(0, 10)}.csv`, 
                          'daily'
                        )}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm transition-colors"
                      >
                        📊 Export CSV
                      </button>
                    </div>
                    <div className="space-y-3">
                      {dailyData.map((day, index) => (
                        <div key={day.id || day.date || index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium">{formatDate(day.date)}</p>
                            <p className="text-sm text-gray-600">{day.total_employees_present} employees present</p>
                            <div className="flex space-x-4 text-xs text-gray-500 mt-1">
                              <span className="text-green-600">On-time: {day.ontime_count}</span>
                              <span className="text-yellow-600">Acceptable: {day.acceptable_count}</span>
                              <span className="text-red-600">Late: {day.late_count}</span>
                              <span className="text-blue-600">Early: {day.early_count}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-blue-600">{day.ontime_rate}%</p>
                            <p className="text-xs text-gray-500">on-time rate</p>
                            {day.earliest_checkin && (
                              <p className="text-xs text-gray-500">Earliest: {formatTime(day.earliest_checkin)}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Debug Info */}
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-2">🔍 Data Debug Info</h4>
                    <p className="text-sm text-blue-800">
                      If you don't see recent data, try running the historical data loader again or check if the sync service is running.
                    </p>
                    <div className="mt-2 text-xs text-blue-600">
                      Last updated: {new Date().toLocaleString()}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">📋 Need to Load Historical Data</h3>
                  <div className="space-y-4">
                    <p className="text-gray-600">
                      The database connection is working, but no historical attendance data was found. 
                    </p>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-blue-900 mb-2">📚 To load your historical data:</h4>
                      <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                        <li>Open Terminal and navigate to your sync service directory</li>
                        <li>Run: <code className="bg-blue-100 px-1 rounded">python3 historical_data_loader.py</code></li>
                        <li>Choose option 4 (load both week and month)</li>
                        <li>Refresh this dashboard</li>
                      </ol>
                    </div>
                  </div>
                </div>
              )
            ) : activeTab === 'employees' ? (
              // Employee Details Tab
              <div className="space-y-6">
                {/* Date Selector */}
                {dailyData && dailyData.length > 0 && (
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">📅 Select Date</h3>
                    <select
                      value={selectedDate}
                      onChange={(e) => handleDateChange(e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      {dailyData.map((day) => (
                        <option key={day.date} value={day.date}>
                          {formatDate(day.date)} - {day.total_employees_present} employees
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Employee Records */}
                {employeeData && employeeData.length > 0 ? (
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-bold text-gray-900">
                        👥 Employee Check-in/Check-out for {formatDate(selectedDate)}
                      </h3>
                      <button
                        onClick={() => exportToCSV(
                          employeeData, 
                          `employee-details-${selectedDate}.csv`, 
                          'employee'
                        )}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm transition-colors"
                      >
                        📊 Export CSV
                      </button>
                    </div>
                    
                    {/* Summary Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="bg-green-50 p-3 rounded-lg text-center">
                        <p className="text-lg font-bold text-green-600">
                          {employeeData.filter(emp => emp.status === 'Present').length}
                        </p>
                        <p className="text-xs text-green-800">Present</p>
                      </div>
                      <div className="bg-blue-50 p-3 rounded-lg text-center">
                        <p className="text-lg font-bold text-blue-600">
                          {employeeData.filter(emp => emp.time_category === 'On-time Check-in').length}
                        </p>
                        <p className="text-xs text-blue-800">On-time</p>
                      </div>
                      <div className="bg-yellow-50 p-3 rounded-lg text-center">
                        <p className="text-lg font-bold text-yellow-600">
                          {employeeData.filter(emp => emp.time_category === 'Acceptable Check-in').length}
                        </p>
                        <p className="text-xs text-yellow-800">Acceptable</p>
                      </div>
                      <div className="bg-red-50 p-3 rounded-lg text-center">
                        <p className="text-lg font-bold text-red-600">
                          {employeeData.filter(emp => emp.time_category === 'Late Check-in').length}
                        </p>
                        <p className="text-xs text-red-800">Late</p>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Employee
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Check In
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Check Out
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Hours
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {employeeData.map((employee, index) => (
                            <tr key={employee.emp_code || index} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {employee.name || 'Unknown'}
                                </div>
                                <div className="text-sm text-gray-500">
                                  Code: {employee.emp_code}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`text-sm font-medium ${getCategoryColor(employee.time_category).replace('bg-', '').replace('50', '700')}`}>
                                  {formatTime(employee.check_in)}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {formatTime(employee.check_out)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="space-y-1">
                                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(employee.status)}`}>
                                    {employee.status || 'N/A'}
                                  </span>
                                  {employee.time_category && (
                                    <div className="mt-1">
                                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(employee.time_category)}`}>
                                        {employee.time_category}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                <div className="space-y-1">
                                  <div>{employee.work_hours ? `${roundHours(employee.work_hours)}h` : 'N/A'}</div>
                                  {employee.total_punches && (
                                    <div className="text-xs text-gray-500">
                                      {employee.total_punches} punches
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : employeeData && employeeData.length === 0 ? (
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">👥 No Employee Data</h3>
                    <p className="text-gray-600">No employee records found for {formatDate(selectedDate)}.</p>
                  </div>
                ) : selectedDate ? (
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">⏳ Loading Employee Data</h3>
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="mt-2 text-gray-600">Loading employee records...</p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">👥 Employee Details</h3>
                    <p className="text-gray-600">Select a date to view employee check-in and check-out details.</p>
                  </div>
                )}
              </div>
       ) : activeTab === 'weekly' ? (
              // Enhanced Weekly Reports Tab
              <div className="space-y-6">
                {/* Weekly View Mode Toggle */}
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-gray-900">📈 Weekly Reports</h3>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setWeeklyViewMode('summary')}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                          weeklyViewMode === 'summary'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        📊 Summary View
                      </button>
                      <button
                        onClick={() => setWeeklyViewMode('details')}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                          weeklyViewMode === 'details'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        👥 Employee Details
                      </button>
                    </div>
                  </div>
                </div>

                {weeklyViewMode === 'summary' ? (
                  // Weekly Summary View
                  weeklyData && weeklyData.length > 0 ? (
                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-gray-900">📈 Weekly Performance Summary</h3>
                        <button
                          onClick={() => exportToCSV(
                            weeklyData, 
                            `weekly-reports-${new Date().toISOString().slice(0, 10)}.csv`, 
                            'weekly'
                          )}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm transition-colors"
                        >
                          📊 Export CSV
                        </button>
                      </div>
                      
                      {/* Weekly Summary Stats */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-blue-50 p-4 rounded-lg text-center">
                          <p className="text-2xl font-bold text-blue-600">{weeklyData.length}</p>
                          <p className="text-sm text-blue-800">Total Weeks</p>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg text-center">
                          <p className="text-2xl font-bold text-green-600">
                            {Math.round(weeklyData.reduce((sum, week) => sum + week.perfect_attendance_rate, 0) / weeklyData.length)}%
                          </p>
                          <p className="text-sm text-green-800">Avg Perfect Attendance</p>
                        </div>
                        <div className="bg-yellow-50 p-4 rounded-lg text-center">
                          <p className="text-2xl font-bold text-yellow-600">
                            {Math.max(...weeklyData.map(week => week.total_employees))}
                          </p>
                          <p className="text-sm text-yellow-800">Max Employees</p>
                        </div>
                        <div className="bg-purple-50 p-4 rounded-lg text-center">
                          <p className="text-2xl font-bold text-purple-600">
                            {weeklyData.reduce((sum, week) => sum + week.perfect_attendance_count, 0)}
                          </p>
                          <p className="text-sm text-purple-800">Total Perfect Days</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {weeklyData.map((week, index) => (
                          <div key={week.id || index} className="border rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <h4 className="font-semibold text-gray-900">
                                  Week of {formatDate(week.week_start)} - {formatDate(week.week_end)}
                                </h4>
                                <p className="text-sm text-gray-600">{week.total_employees} total employees</p>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold text-green-600">{week.perfect_attendance_rate}%</p>
                                <p className="text-xs text-gray-500">perfect attendance</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div className="bg-green-50 p-3 rounded">
                                <p className="text-green-700 font-medium">Perfect Attendance</p>
                                <p className="text-green-600">{week.perfect_attendance_count} employees</p>
                              </div>
                              <div className="bg-blue-50 p-3 rounded">
                                <p className="text-blue-700 font-medium">Last Sync</p>
                                <p className="text-blue-600">
                                  {week.sync_timestamp ? new Date(week.sync_timestamp).toLocaleString() : 'N/A'}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white rounded-lg shadow p-6">
                      <h3 className="text-lg font-bold text-gray-900 mb-4">📈 Weekly Reports</h3>
                      <p className="text-gray-600">No weekly reports found. Run the historical data loader to generate weekly summaries.</p>
                      <div className="bg-yellow-50 p-4 rounded-lg mt-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">📋 How to generate weekly reports:</h4>
                        <ol className="text-yellow-800 text-sm space-y-1 list-decimal list-inside">
                          <li>Ensure daily attendance data is loaded first</li>
                          <li>Run the historical data loader with weekly summary option</li>
                          <li>Refresh this dashboard to see the reports</li>
                        </ol>
                      </div>
                    </div>
                  )
                ) : (
                  // Weekly Employee Details View with Expandable Rows
                  <div className="space-y-6">
                    {/* Week Selector */}
                    {availableWeeks && availableWeeks.length > 0 && (
                      <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">📅 Select Week</h3>
                        <select
                          value={selectedWeek}
                          onChange={(e) => handleWeeklySelect(e.target.value)}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        >
                          {availableWeeks.map((week) => (
                            <option key={`${week.week_start}_${week.week_end}`} value={`${week.week_start}_${week.week_end}`}>
                              {formatDate(week.week_start)} - {formatDate(week.week_end)} ({week.total_employees} employees)
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
    {/* Weekly Employee Details with Expandable Rows */}
                    {weeklyEmployeeData && weeklyEmployeeData.length > 0 ? (
                      <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg font-bold text-gray-900">
                            👥 Employee Weekly Details - {selectedWeek ? formatDate(selectedWeek.split('_')[0]) : ''} to {selectedWeek ? formatDate(selectedWeek.split('_')[1]) : ''}
                          </h3>
                          <button
                            onClick={() => {
                              const weekRange = selectedWeek.split('_');
                              exportToCSV(
                                weeklyEmployeeData, 
                                `weekly-employee-details-${weekRange[0]}-to-${weekRange[1]}.csv`, 
                                'weeklyDetails'
                              );
                            }}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm transition-colors"
                          >
                            📊 Export CSV
                          </button>
                        </div>

                        {/* Weekly Summary Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                          <div className="bg-blue-50 p-4 rounded-lg text-center">
                            <p className="text-2xl font-bold text-blue-600">{weeklyEmployeeData.length}</p>
                            <p className="text-sm text-blue-800">Total Employees</p>
                          </div>
                          <div className="bg-green-50 p-4 rounded-lg text-center">
                            <p className="text-2xl font-bold text-green-600">
                              {weeklyEmployeeData.filter((emp) => emp.leaveDays === 0).length}
                            </p>
                            <p className="text-sm text-green-800">Perfect Attendance</p>
                          </div>
                          <div className="bg-red-50 p-4 rounded-lg text-center">
                            <p className="text-2xl font-bold text-red-600">
                              {weeklyEmployeeData.filter((emp) => emp.leaveDays > 0).length}
                            </p>
                            <p className="text-sm text-red-800">Had Leave Days</p>
                          </div>
                          <div className="bg-yellow-50 p-4 rounded-lg text-center">
                            <p className="text-2xl font-bold text-yellow-600">
                              {Math.round(weeklyEmployeeData.reduce((sum, emp) => sum + emp.totalHours, 0))}h
                            </p>
                            <p className="text-sm text-yellow-800">Total Hours</p>
                          </div>
                        </div>

                        {/* Employee Details Table with Expandable Rows */}
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Employee
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Attendance
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Leave Days
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Total Hours
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Performance
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Actions
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {weeklyEmployeeData.map((employee, index) => {
                                const attendanceRate = employee.totalDays > 0 ? Math.round((employee.presentDays / employee.totalDays) * 100) : 0;
                                const isExpanded = expandedEmployee === employee.emp_code;
                                const weekDays = selectedWeek ? getWeekDays(selectedWeek.split('_')[0], selectedWeek.split('_')[1]) : [];

                                return (
                                  <React.Fragment key={employee.emp_code || index}>
                                    {/* Main Employee Row */}
                                    <tr className="hover:bg-gray-50">
                                      <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">
                                          {employee.name}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                          Code: {employee.emp_code}
                                        </div>
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">
                                          {employee.presentDays}/{employee.totalDays} days
                                        </div>
                                        <div className={`text-xs font-medium ${
                                          attendanceRate >= 100 ? 'text-green-600' :
                                          attendanceRate >= 80 ? 'text-yellow-600' : 'text-red-600'
                                        }`}>
                                          {attendanceRate}% attendance
                                        </div>
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                          employee.leaveDays === 0 ? 'text-green-600 bg-green-50' : 
                                          employee.leaveDays <= 1 ? 'text-yellow-600 bg-yellow-50' : 'text-red-600 bg-red-50'
                                        }`}>
                                          {employee.leaveDays} days
                                        </span>
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        <div className="font-medium">{roundHours(employee.totalHours)}h</div>
                                        <div className="text-xs text-gray-500">
                                          Avg: {employee.presentDays > 0 ? roundHours(employee.totalHours / employee.presentDays) : 0}h/day
                                        </div>
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex space-x-1">
                                          <span className="inline-flex px-2 py-1 text-xs font-medium rounded bg-green-50 text-green-700">
                                            On-time: {employee.onTimeDays}
                                          </span>
                                          <span className="inline-flex px-2 py-1 text-xs font-medium rounded bg-red-50 text-red-700">
                                            Late: {employee.lateDays}
                                          </span>
                                        </div>
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <div className="flex space-x-2">
                                          <button
                                            onClick={() => setExpandedEmployee(isExpanded ? null : employee.emp_code)}
                                            className="text-blue-600 hover:text-blue-900 text-xs transition-colors"
                                          >
                                            {isExpanded ? '▼ Hide Details' : '▶ Show Details'}
                                          </button>
                                          <button
                                            onClick={() => {
                                              // Switch to monthly view for this employee
                                              handleTabChange('monthly');
                                              setSelectedEmployee(employee.emp_code);
                                              const weekStart = selectedWeek.split('_')[0];
                                              const month = weekStart.slice(0, 7);
                                              setSelectedMonth(month);
                                              loadEmployeeMonthlyData(employee.emp_code, month);
                                            }}
                                            className="text-blue-600 hover:text-blue-900 text-xs transition-colors"
                                          >
                                            Monthly →
                                          </button>
                                        </div>
                                      </td>
                                    </tr>

                                    {/* Expanded Daily Details Row */}
                                    {isExpanded && (
                                      <tr className="bg-blue-50">
                                        <td colSpan={6} className="px-6 py-4">
                                          <div className="bg-white rounded-lg p-4 shadow-sm">
                                            <h4 className="font-semibold text-gray-900 mb-3">
                                              📅 Daily Breakdown for {employee.name}
                                            </h4>
                                            <div className="grid grid-cols-5 gap-4">
                                              {weekDays.map(day => {
                                                const dayData = employee.dailyBreakdown?.[day.date];
                                                return (
                                                  <div key={day.date} className="text-center border rounded-lg p-3">
                                                    <h5 className="font-medium text-gray-900 text-sm">{day.dayName}</h5>
                                                    <p className="text-xs text-gray-500 mb-2">{day.shortDate}</p>
                                                    
                                                    {dayData ? (
                                                      <div className="space-y-1">
                                                        <p className="text-sm font-medium text-gray-900">
                                                          {formatTime(dayData.check_in)}
                                                        </p>
                                                        <p className="text-sm text-gray-600">
                                                          {formatTime(dayData.check_out)}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                          {dayData.work_hours ? `${roundHours(dayData.work_hours)}h` : 'N/A'}
                                                        </p>
                                                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(dayData.time_category)}`}>
                                                          {dayData.time_category === 'On-time Check-in' ? 'On-time' :
                                                           dayData.time_category === 'Late Check-in' ? 'Late' :
                                                           dayData.time_category === 'Early Check-in' ? 'Early' :
                                                           dayData.time_category === 'Acceptable Check-in' ? 'Acceptable' : 
                                                           dayData.time_category || 'N/A'}
                                                        </span>
                                                      </div>
                                                    ) : (
                                                      <div className="space-y-1">
                                                        <p className="text-sm font-medium text-red-600">Absent</p>
                                                        <p className="text-xs text-gray-400">No check-in</p>
                                                        <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-red-50 text-red-700">
                                                          Leave
                                                        </span>
                                                      </div>
                                                    )}
                                                  </div>
                                                );
                                              })}
                                            </div>
                                          </div>
                                        </td>
                                      </tr>
                                    )}
                                  </React.Fragment>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : selectedWeek ? (
                      <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">⏳ Loading Weekly Employee Data</h3>
                        <div className="text-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                          <p className="mt-2 text-gray-600">Loading employee records...</p>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">👥 Weekly Employee Details</h3>
                        <p className="text-gray-600">Select a week to view detailed employee attendance and leave information.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : activeTab === 'monthly' ? (
              // Monthly Reports Tab
              <div className="space-y-6">
                {/* Month and Employee Selectors */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">📅 Select Month</h3>
                    <input
                      type="month"
                      value={selectedMonth}
                      onChange={(e) => handleMonthChange(e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">👤 Select Employee</h3>
                    <select
                      value={selectedEmployee}
                      onChange={(e) => handleEmployeeSelect(e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Choose an employee...</option>
                      {allEmployees && allEmployees.map((emp) => (
                        <option key={emp.emp_code} value={emp.emp_code}>
                          {emp.name} (Code: {emp.emp_code})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Monthly Employee Data */}
                {selectedEmployee && employeeMonthlyData && employeeMonthlyData.length > 0 ? (
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-bold text-gray-900">
                        📊 Monthly Attendance for {getEmployeeName(selectedEmployee)} - {formatMonthYear(selectedMonth)}
                      </h3>
                      <button
                        onClick={() => {
                          const employeeName = getEmployeeName(selectedEmployee);
                          exportToCSV(
                            employeeMonthlyData, 
                            `${employeeName}-monthly-${selectedMonth}.csv`, 
                            'monthly'
                          );
                        }}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm transition-colors"
                      >
                        📊 Export CSV
                      </button>
                    </div>

                    {/* Monthly Summary Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="bg-blue-50 p-4 rounded-lg text-center">
                        <p className="text-2xl font-bold text-blue-600">{employeeMonthlyData.length}</p>
                        <p className="text-sm text-blue-800">Days Present</p>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg text-center">
                        <p className="text-2xl font-bold text-green-600">
                          {employeeMonthlyData.filter((d) => d.time_category === 'On-time Check-in').length}
                        </p>
                        <p className="text-sm text-green-800">On-time Days</p>
                      </div>
                      <div className="bg-red-50 p-4 rounded-lg text-center">
                        <p className="text-2xl font-bold text-red-600">
                          {employeeMonthlyData.filter((d) => d.time_category === 'Late Check-in').length}
                        </p>
                        <p className="text-sm text-red-800">Late Days</p>
                      </div>
                      <div className="bg-yellow-50 p-4 rounded-lg text-center">
                        <p className="text-2xl font-bold text-yellow-600">
                          {roundHours(employeeMonthlyData.reduce((sum, d) => sum + (d.work_hours || 0), 0))}h
                        </p>
                        <p className="text-sm text-yellow-800">Total Hours</p>
                      </div>
                    </div>

                    {/* Daily Records Table */}
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Check In
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Check Out
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Hours
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {employeeMonthlyData.map((day, index) => (
                            <tr key={day.date || index} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {formatDate(day.date)}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`text-sm font-medium ${getCategoryColor(day.time_category).replace('bg-', '').replace('50', '700')}`}>
                                  {formatTime(day.check_in)}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {formatTime(day.check_out)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                <div className="flex flex-col">
                                  <span className="font-medium">{day.work_hours ? `${roundHours(day.work_hours)}h` : 'N/A'}</span>
                                  {day.total_punches && (
                                    <span className="text-xs text-gray-500">{day.total_punches} punches</span>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="space-y-1">
                                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(day.status)}`}>
                                    {day.status || 'N/A'}
                                  </span>
                                  {day.time_category && (
                                    <div>
                                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(day.time_category)}`}>
                                        {day.time_category}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : selectedEmployee && employeeMonthlyData && employeeMonthlyData.length === 0 ? (
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">📊 No Monthly Data</h3>
                    <p className="text-gray-600">
                      No attendance records found for {getEmployeeName(selectedEmployee)} in {formatMonthYear(selectedMonth)}.
                    </p>
                  </div>
                ) : (
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">📊 Monthly Employee Reports</h3>
                    <p className="text-gray-600">
                      Select a month and employee to view detailed monthly attendance records with daily check-in/check-out times.
                    </p>
                    <div className="bg-blue-50 p-4 rounded-lg mt-4">
                      <h4 className="font-semibold text-blue-900 mb-2">📈 Features:</h4>
                      <ul className="text-blue-800 text-sm space-y-1">
                        <li>• View entire month of attendance for any employee</li>
                        <li>• See daily check-in/check-out times with color coding</li>
                        <li>• Monthly summary statistics (total hours, on-time days, etc.)</li>
                        <li>• Export individual employee monthly reports to CSV</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}                                