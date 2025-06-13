// lib/types.ts
// 📋 All TypeScript interfaces and types for the Boopin Attendance Dashboard

export interface DailySummary {
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
  created_at?: string;
  updated_at?: string;
}

export interface WeeklySummary {
  id?: string;
  week_start: string;
  week_end: string;
  total_employees: number;
  perfect_attendance_count: number;
  perfect_attendance_rate: number;
  sync_timestamp?: string;
  created_at?: string;
  updated_at?: string;
}

export interface MonthlySummary {
  id?: string;
  year: number;
  month: number;
  total_employees: number;
  early_count: number;
  ontime_count: number;
  acceptable_count: number;
  late_count: number;
  average_ontime_rate: number;
  sync_timestamp?: string;
  created_at?: string;
  updated_at?: string;
}

export interface EmployeeRecord {
  id?: number;
  date: string;
  emp_code: string;
  name: string;
  check_in?: string;
  check_out?: string;
  work_hours?: number;
  total_punches?: number;
  status?: string;
  time_category?: string;
  created_at?: string;
}

export interface Employee {
  emp_code: string;
  name: string;
  department?: string;
  position?: string;
  hire_date?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface WeeklyEmployeeRecord {
  id?: number;
  week_start: string;
  week_end: string;
  emp_code: string;
  name: string;
  days_worked: number;
  total_hours?: number;
  daily_details?: any; // JSONB field
  is_perfect_attendance?: boolean;
  created_at?: string;
}

export interface WeeklyEmployeeData {
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

export interface SyncLog {
  id?: number;
  sync_type: string;
  sync_date: string;
  status: string;
  records_processed?: number;
  error_message?: string;
  sync_duration_seconds?: number;
  created_at?: string;
}

export interface UniqueEmployee {
  emp_code?: string;
  name?: string;
  is_active?: boolean;
  last_seen_date?: string;
}

// Tab and UI Types
export type TabType = 'summary' | 'employees' | 'weekly' | 'monthly';
export type ExportType = 'daily' | 'weekly' | 'monthly' | 'employee' | 'weeklyDetails';
export type WeeklyViewMode = 'summary' | 'details';

// Dashboard State Types
export interface DashboardState {
  loading: boolean;
  error: string;
  activeTab: TabType;
}

export interface DataState {
  dailyData: DailySummary[];
  employeeData: EmployeeRecord[];
  weeklyData: WeeklySummary[];
  employeeMonthlyData: EmployeeRecord[];
  allEmployees: Employee[];
  weeklyEmployeeData: WeeklyEmployeeData[];
  availableWeeks: WeeklySummary[];
}

export interface SelectionState {
  selectedEmployee: string;
  selectedMonth: string;
  selectedDate: string;
  selectedWeek: string;
  weeklyViewMode: WeeklyViewMode;
  expandedEmployee: string | null;
}

// Utility Types
export interface WeekDay {
  date: string;
  dayName: string;
  shortDate: string;
}

export interface AttendanceStats {
  totalEmployees: number;
  presentEmployees: number;
  absentEmployees: number;
  onTimeEmployees: number;
  lateEmployees: number;
  onTimeRate: number;
}

export interface ExportConfig {
  data: any[];
  filename: string;
  type: ExportType;
}

// API Response Types
export interface SupabaseResponse<T> {
  data: T[] | null;
  error: any;
}

export interface ApiError {
  message: string;
  details?: string;
  hint?: string;
  code?: string;
}

// Time Category Constants
export type TimeCategory = 
  | 'Early Check-in' 
  | 'On Time' 
  | 'On-time Check-in'
  | 'Acceptable' 
  | 'Acceptable Check-in'
  | 'Late' 
  | 'Late Check-in'
  | 'Invalid Time'
  | 'N/A';

export type AttendanceStatus = 'Present' | 'Absent' | 'Leave' | 'N/A';

// Component Props Types
export interface TableProps {
  data: any[];
  loading?: boolean;
  onExport?: () => void;
}

export interface SelectorProps {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string; }>;
  placeholder?: string;
  disabled?: boolean;
}

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'gray';
  icon?: string;
}

// Hook Return Types
export interface UseAttendanceDataReturn {
  // Data
  dailyData: DailySummary[];
  weeklyData: WeeklySummary[];
  loading: boolean;
  error: string;
  
  // Actions
  refreshData: () => Promise<any>;
  loadDailyData: (limit?: number) => Promise<any>;
  loadWeeklyData: (limit?: number) => Promise<any>;
  clearError: () => void;
  
  // Getters
  getLatestDaily: () => DailySummary | null;
  getLatestWeekly: () => WeeklySummary | null;
  getDailyByDate: (date: string) => DailySummary | null;
  getWeeklyByDates: (weekStart: string, weekEnd: string) => WeeklySummary | null;
  getSummaryStats: () => {
    totalDays: number;
    totalWeeks: number;
    avgAttendance: number;
    avgOnTimeRate: number;
    totalEmployees: number;
  };
}

export interface UseEmployeeDataReturn {
  // Data
  employees: Employee[];
  employeeRecords: EmployeeRecord[];
  loading: boolean;
  error: string;

  // Actions
  loadEmployees: () => Promise<any>;
  loadEmployeeData: (date: string) => Promise<any>;
  loadEmployeeMonthlyData: (empCode: string, month: string) => Promise<any>;
  loadWeeklyEmployeeData: (weekStart: string, weekEnd: string) => Promise<any>;
  clearError: () => void;

  // Getters
  getEmployeeByCode: (empCode: string) => Employee | null;
  getEmployeeName: (empCode: string) => string;
  getRecordsByStatus: () => Record<string, EmployeeRecord[]>;
  getRecordsByTimeCategory: () => Record<string, EmployeeRecord[]>;
  getAttendanceStats: () => {
    totalEmployees: number;
    presentCount: number;
    absentCount: number;
    onTimeCount: number;
    lateCount: number;
    earlyCount: number;
    acceptableCount: number;
    attendanceRate: number;
    onTimeRate: number;
  };
  getWorkHoursStats: () => {
    totalHours: number;
    averageHours: number;
    minHours: number;
    maxHours: number;
    employeesWithHours: number;
  };
}