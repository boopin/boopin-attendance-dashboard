// components/dashboard/MonthlyReportsTab.tsx
// 📊 Monthly Reports Tab Component

'use client';

import React, { useState, useCallback } from 'react';
import type { Employee, EmployeeRecord } from '../../lib/types';
import { formatDate, formatMonthYear, getCurrentMonth } from '../../lib/formatters';
import { getStatusColor, getCategoryColor } from '../../lib/utils';
import { useEmployeeData } from '../../hooks/useEmployeeData';
import { useDataExport } from '../../hooks/useDataExport';

interface MonthlyReportsTabProps {
  employees: Employee[];
  loading: boolean;
  error: string;
}

export const MonthlyReportsTab: React.FC<MonthlyReportsTabProps> = ({
  employees,
  loading,
  error
}) => {
  const { exporting, exportData } = useDataExport();
  const { loadEmployeeMonthlyData, getEmployeeName } = useEmployeeData();
  
  // Local state
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [employeeMonthlyData, setEmployeeMonthlyData] = useState<EmployeeRecord[]>([]);
  const [monthlyLoading, setMonthlyLoading] = useState(false);

  // Handle employee selection
  const handleEmployeeSelect = useCallback(async (empCode: string) => {
    if (empCode === selectedEmployee) return;
    
    setSelectedEmployee(empCode);
    setEmployeeMonthlyData([]);
    
    if (empCode && selectedMonth) {
      setMonthlyLoading(true);
      try {
        const result = await loadEmployeeMonthlyData(empCode, selectedMonth);
        if (result.data) {
          setEmployeeMonthlyData(result.data);
        }
      } catch (err) {
        console.error('Error loading monthly data:', err);
      } finally {
        setMonthlyLoading(false);
      }
    }
  }, [selectedEmployee, selectedMonth, loadEmployeeMonthlyData]);

  // Handle month change
  const handleMonthChange = useCallback(async (month: string) => {
    if (month === selectedMonth) return;
    
    setSelectedMonth(month);
    setEmployeeMonthlyData([]);
    
    if (selectedEmployee && month) {
      setMonthlyLoading(true);
      try {
        const result = await loadEmployeeMonthlyData(selectedEmployee, month);
        if (result.data) {
          setEmployeeMonthlyData(result.data);
        }
      } catch (err) {
        console.error('Error loading monthly data:', err);
      } finally {
        setMonthlyLoading(false);
      }
    }
  }, [selectedMonth, selectedEmployee, loadEmployeeMonthlyData]);

  // Calculate monthly stats
  const monthlyStats = React.useMemo(() => {
    if (!employeeMonthlyData.length) {
      return {
        totalDays: 0,
        onTimeDays: 0,
        lateDays: 0,
        totalHours: 0,
        avgHours: 0,
        attendanceRate: 0
      };
    }

    const totalDays = employeeMonthlyData.length;
    const onTimeDays = employeeMonthlyData.filter(d => 
      ['On Time', 'On-time Check-in', 'Early Check-in'].includes(d.time_category || '')
    ).length;
    const lateDays = employeeMonthlyData.filter(d => 
      ['Late', 'Late Check-in'].includes(d.time_category || '')
    ).length;
    const totalHours = employeeMonthlyData.reduce((sum, d) => sum + (d.work_hours || 0), 0);
    const avgHours = totalDays > 0 ? totalHours / totalDays : 0;
    
    // Calculate attendance rate based on working days in the month
    const workingDaysInMonth = Math.ceil(totalDays * 1.4); // Rough estimate (5/7 ratio)
    const attendanceRate = Math.round((totalDays / workingDaysInMonth) * 100);

    return {
      totalDays,
      onTimeDays,
      lateDays,
      totalHours: Math.round(totalHours * 10) / 10,
      avgHours: Math.round(avgHours * 10) / 10,
      attendanceRate: Math.min(attendanceRate, 100) // Cap at 100%
    };
  }, [employeeMonthlyData]);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading employees...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">Error loading employees: {error}</p>
      </div>
    );
  }

  return (
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
            {employees && employees.map((emp) => (
              <option key={emp.emp_code} value={emp.emp_code}>
                {emp.name} (Code: {emp.emp_code})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Loading State */}
      {monthlyLoading && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading monthly data...</p>
          </div>
        </div>
      )}

      {/* Monthly Employee Data */}
      {!monthlyLoading && selectedEmployee && employeeMonthlyData && employeeMonthlyData.length > 0 ? (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-900">
              📊 Monthly Attendance for {getEmployeeName(selectedEmployee)} - {formatMonthYear(selectedMonth)}
            </h3>
            <button
              onClick={() => {
                const employeeName = getEmployeeName(selectedEmployee);
                exportData('monthly', employeeMonthlyData, employeeName, selectedMonth);
              }}
              disabled={exporting}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm transition-colors"
            >
              {exporting ? '⏳ Exporting...' : '📊 Export CSV'}
            </button>
          </div>

          {/* Monthly Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <p className="text-2xl font-bold text-blue-600">{monthlyStats.totalDays}</p>
              <p className="text-sm text-blue-800">Days Present</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <p className="text-2xl font-bold text-green-600">{monthlyStats.onTimeDays}</p>
              <p className="text-sm text-green-800">On-time Days</p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg text-center">
              <p className="text-2xl font-bold text-red-600">{monthlyStats.lateDays}</p>
              <p className="text-sm text-red-800">Late Days</p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg text-center">
              <p className="text-2xl font-bold text-yellow-600">{monthlyStats.totalHours}h</p>
              <p className="text-sm text-yellow-800">Total Hours</p>
            </div>
          </div>

          {/* Additional Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-50 p-3 rounded-lg text-center">
              <p className="text-lg font-bold text-gray-600">{monthlyStats.avgHours}h</p>
              <p className="text-xs text-gray-800">Avg Hours/Day</p>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg text-center">
              <p className="text-lg font-bold text-purple-600">{monthlyStats.attendanceRate}%</p>
              <p className="text-xs text-purple-800">Attendance Rate</p>
            </div>
            <div className="bg-indigo-50 p-3 rounded-lg text-center">
              <p className="text-lg font-bold text-indigo-600">
                {monthlyStats.totalDays > 0 ? Math.round((monthlyStats.onTimeDays / monthlyStats.totalDays) * 100) : 0}%
              </p>
              <p className="text-xs text-indigo-800">On-time Rate</p>
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
                        {day.check_in || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {day.check_out || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex flex-col">
                        <span className="font-medium">{day.work_hours ? `${Math.round(day.work_hours * 10) / 10}h` : 'N/A'}</span>
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
      ) : !monthlyLoading && selectedEmployee && employeeMonthlyData && employeeMonthlyData.length === 0 ? (
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
  );
};