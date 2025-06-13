// components/dashboard/WeeklyReportsTab.tsx
// 📈 Weekly Reports Tab Component

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import type { WeeklySummary, WeeklyEmployeeData } from '../../lib/types';
import { formatDate, getWeekDays } from '../../lib/formatters';
import { getCategoryColor, getStatusColor } from '../../lib/utils';
import { useEmployeeData } from '../../hooks/useEmployeeData';
import { useDataExport } from '../../hooks/useDataExport';

interface WeeklyReportsTabProps {
  weeklyData: WeeklySummary[];
  loading: boolean;
  error: string;
}

type WeeklyViewMode = 'summary' | 'details';

export const WeeklyReportsTab: React.FC<WeeklyReportsTabProps> = ({
  weeklyData,
  loading,
  error
}) => {
  const { exporting, exportData } = useDataExport();
  const { loadWeeklyEmployeeData } = useEmployeeData();
  
  // Local state
  const [viewMode, setViewMode] = useState<WeeklyViewMode>('summary');
  const [selectedWeek, setSelectedWeek] = useState('');
  const [weeklyEmployeeData, setWeeklyEmployeeData] = useState<WeeklyEmployeeData[]>([]);
  const [employeeLoading, setEmployeeLoading] = useState(false);
  const [expandedEmployee, setExpandedEmployee] = useState<string | null>(null);

  // Initialize selected week
  useEffect(() => {
    if (weeklyData && weeklyData.length > 0 && !selectedWeek) {
      setSelectedWeek(`${weeklyData[0].week_start}_${weeklyData[0].week_end}`);
    }
  }, [weeklyData, selectedWeek]);

  // Load weekly employee details
  const handleWeeklySelect = useCallback(async (weekKey: string) => {
    if (weekKey === selectedWeek) return;
    
    setSelectedWeek(weekKey);
    setEmployeeLoading(true);
    
    try {
      const [weekStart, weekEnd] = weekKey.split('_');
      if (weekStart && weekEnd) {
        const result = await loadWeeklyEmployeeData(weekStart, weekEnd);
        if (result.data) {
          setWeeklyEmployeeData(result.data);
        }
      }
    } catch (err) {
      console.error('Error loading weekly employee data:', err);
    } finally {
      setEmployeeLoading(false);
    }
  }, [selectedWeek, loadWeeklyEmployeeData]);

  // Load employee data when switching to details view
  useEffect(() => {
    if (viewMode === 'details' && selectedWeek && weeklyEmployeeData.length === 0) {
      handleWeeklySelect(selectedWeek);
    }
  }, [viewMode, selectedWeek, weeklyEmployeeData.length, handleWeeklySelect]);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading weekly reports...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">Error loading weekly reports: {error}</p>
      </div>
    );
  }

  if (!weeklyData || weeklyData.length === 0) {
    return (
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
    );
  }

  return (
    <div className="space-y-6">
      {/* View Mode Toggle */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-900">📈 Weekly Reports</h3>
          <div className="flex space-x-2">
            <button
              onClick={() => setViewMode('summary')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                viewMode === 'summary'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              📊 Summary View
            </button>
            <button
              onClick={() => setViewMode('details')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                viewMode === 'details'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              👥 Employee Details
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'summary' ? (
        // Weekly Summary View
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-900">📈 Weekly Performance Summary</h3>
            <button
              onClick={() => exportData('weekly', weeklyData)}
              disabled={exporting}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm transition-colors"
            >
              {exporting ? '⏳ Exporting...' : '📊 Export CSV'}
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
        // Weekly Employee Details View
        <div className="space-y-6">
          {/* Week Selector */}
          {weeklyData && weeklyData.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">📅 Select Week</h3>
              <select
                value={selectedWeek}
                onChange={(e) => handleWeeklySelect(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                {weeklyData.map((week) => (
                  <option key={`${week.week_start}_${week.week_end}`} value={`${week.week_start}_${week.week_end}`}>
                    {formatDate(week.week_start)} - {formatDate(week.week_end)} ({week.total_employees} employees)
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Weekly Employee Details */}
          {employeeLoading ? (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading weekly employee data...</p>
              </div>
            </div>
          ) : weeklyEmployeeData && weeklyEmployeeData.length > 0 ? (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-900">
                  👥 Weekly Employee Details - {selectedWeek ? formatDate(selectedWeek.split('_')[0]) : ''} to {selectedWeek ? formatDate(selectedWeek.split('_')[1]) : ''}
                </h3>
                <button
                  onClick={() => {
                    const weekRange = selectedWeek.split('_');
                    exportData('weeklyDetails', weeklyEmployeeData, `${weekRange[0]}-to-${weekRange[1]}`);
                  }}
                  disabled={exporting}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm transition-colors"
                >
                  {exporting ? '⏳ Exporting...' : '📊 Export CSV'}
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
                              <div className="font-medium">{Math.round(employee.totalHours * 10) / 10}h</div>
                              <div className="text-xs text-gray-500">
                                Avg: {employee.presentDays > 0 ? Math.round((employee.totalHours / employee.presentDays) * 10) / 10 : 0}h/day
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
                              <button
                                onClick={() => setExpandedEmployee(isExpanded ? null : employee.emp_code)}
                                className="text-blue-600 hover:text-blue-900 text-xs transition-colors"
                              >
                                {isExpanded ? '▼ Hide Details' : '▶ Show Details'}
                              </button>
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
                                                {dayData.check_in || 'N/A'}
                                              </p>
                                              <p className="text-sm text-gray-600">
                                                {dayData.check_out || 'N/A'}
                                              </p>
                                              <p className="text-xs text-gray-500">
                                                {dayData.work_hours ? `${Math.round(dayData.work_hours * 10) / 10}h` : 'N/A'}
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
              <h3 className="text-lg font-bold text-gray-900 mb-4">👥 Weekly Employee Details</h3>
              <p className="text-gray-600">No employee data found for the selected week.</p>
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
  );
};