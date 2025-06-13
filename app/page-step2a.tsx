// app/page.tsx
// 🎯 Main Dashboard Component - Now using custom hooks (Step 2A)

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import type { TabType } from '../lib/types';
import { formatTime, formatDate } from '../lib/formatters';
import { getStatusColor, getCategoryColor } from '../lib/utils';
import { DASHBOARD_CONFIG, LOADING_STATES } from '../constants/config';

// Import our new custom hooks
import { useAttendanceData } from '../hooks/useAttendanceData';
import { useEmployeeData } from '../hooks/useEmployeeData';
import { useDataExport } from '../hooks/useDataExport';

export default function Dashboard() {
  // UI State
  const [activeTab, setActiveTab] = useState<TabType>(DASHBOARD_CONFIG.defaultTab);
  const [selectedDate, setSelectedDate] = useState('');

  // Employee Details state
  const [showAllEmployees, setShowAllEmployees] = useState(false);
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState('');

  // Custom hooks for data management
  const {
    dailyData,
    weeklyData,
    loading: attendanceLoading,
    error: attendanceError,
    refreshData,
    getLatestDaily,
    getSummaryStats
  } = useAttendanceData();

  const {
    employees,
    employeeRecords,
    loading: employeeLoading,
    error: employeeError,
    loadEmployees,
    loadEmployeeData,
    getAttendanceStats
  } = useEmployeeData();

  const { exporting, exportData } = useDataExport();

  // Combined loading and error states
  const loading = attendanceLoading || employeeLoading;
  const error = attendanceError || employeeError;

  // Initialize data on mount
  useEffect(() => {
    const initializeData = async () => {
      const result = await refreshData();
      await loadEmployees();
      
      // Set initial selected date
      if (result.dailyData && result.dailyData.length > 0) {
        setSelectedDate(result.dailyData[0].date);
        await loadEmployeeData(result.dailyData[0].date);
      }
    };

    initializeData();
  }, [refreshData, loadEmployees, loadEmployeeData]);

  // Handle date selection
  const handleDateChange = useCallback(async (date: string) => {
    if (date === selectedDate) return;
    setSelectedDate(date);
    await loadEmployeeData(date);
  }, [selectedDate, loadEmployeeData]);

  // Handle tab change
  const handleTabChange = useCallback((tab: TabType) => {
    setActiveTab(tab);
  }, []);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    await refreshData();
    await loadEmployees();
    if (selectedDate) {
      await loadEmployeeData(selectedDate);
    }
  }, [refreshData, loadEmployees, loadEmployeeData, selectedDate]);

  // Get summary statistics
  const summaryStats = getSummaryStats();
  const attendanceStats = getAttendanceStats();

  // Employee filtering logic
  const filteredEmployees = employeeRecords.filter(employee => 
    employee.name.toLowerCase().includes(employeeSearchTerm.toLowerCase()) ||
    employee.emp_code.toLowerCase().includes(employeeSearchTerm.toLowerCase())
  );

  const displayedEmployees = showAllEmployees ? filteredEmployees : filteredEmployees.slice(0, 10);
  const remainingCount = filteredEmployees.length - displayedEmployees.length;

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
              onClick={handleRefresh}
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
            <p className="mt-4 text-gray-600">{LOADING_STATES.initial}</p>
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
                    {summaryStats.totalDays} daily reports, {summaryStats.totalWeeks} weekly reports, {employees.length} employees
                  </p>
                </div>
              </div>
            </div>

            {/* Enhanced Status Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow p-4 text-center">
                <p className="text-2xl font-bold text-blue-600">{summaryStats.totalEmployees}</p>
                <p className="text-sm text-blue-800">Max Daily Attendance</p>
              </div>
              <div className="bg-white rounded-lg shadow p-4 text-center">
                <p className="text-2xl font-bold text-green-600">{summaryStats.avgOnTimeRate}%</p>
                <p className="text-sm text-green-800">Avg On-time Rate</p>
              </div>
              <div className="bg-white rounded-lg shadow p-4 text-center">
                <p className="text-2xl font-bold text-yellow-600">{attendanceStats.presentCount}</p>
                <p className="text-sm text-yellow-800">Present Today</p>
              </div>
              <div className="bg-white rounded-lg shadow p-4 text-center">
                <p className="text-2xl font-bold text-purple-600">{attendanceStats.onTimeCount}</p>
                <p className="text-sm text-purple-800">On-time Today</p>
              </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'summary' ? (
              // Daily Summary Tab - Enhanced with hooks
              dailyData && dailyData.length > 0 ? (
                <div className="space-y-6">
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-bold text-gray-900">📅 Recent Attendance Data</h3>
                      <button
                        onClick={() => exportData('daily', dailyData)}
                        disabled={exporting}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm transition-colors"
                      >
                        {exporting ? '⏳ Exporting...' : '📊 Export CSV'}
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
              // Employee Details Tab - Enhanced with hooks
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
                {employeeRecords && employeeRecords.length > 0 ? (
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-bold text-gray-900">
                        👥 Employee Details for {formatDate(selectedDate)}
                      </h3>
                      <button
                        onClick={() => exportData('employee', employeeRecords, undefined, selectedDate)}
                        disabled={exporting}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm transition-colors"
                      >
                        {exporting ? '⏳ Exporting...' : '📊 Export CSV'}
                      </button>
                    </div>
                    
                    {/* Summary Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="bg-green-50 p-3 rounded-lg text-center">
                        <p className="text-lg font-bold text-green-600">{attendanceStats.presentCount}</p>
                        <p className="text-xs text-green-800">Present</p>
                      </div>
                      <div className="bg-blue-50 p-3 rounded-lg text-center">
                        <p className="text-lg font-bold text-blue-600">{attendanceStats.onTimeCount}</p>
                        <p className="text-xs text-blue-800">On-time</p>
                      </div>
                      <div className="bg-yellow-50 p-3 rounded-lg text-center">
                        <p className="text-lg font-bold text-yellow-600">{attendanceStats.acceptableCount}</p>
                        <p className="text-xs text-yellow-800">Acceptable</p>
                      </div>
                      <div className="bg-red-50 p-3 rounded-lg text-center">
                        <p className="text-lg font-bold text-red-600">{attendanceStats.lateCount}</p>
                        <p className="text-xs text-red-800">Late</p>
                      </div>
                    </div>

                    {/* Search and Controls */}
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex-1 max-w-md">
                        <input
                          type="text"
                          placeholder="Search employees by name or code..."
                          value={employeeSearchTerm}
                          onChange={(e) => setEmployeeSearchTerm(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                        />
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <span className="text-sm text-gray-600">
                          Showing {displayedEmployees.length} of {filteredEmployees.length} employees
                        </span>
                        {filteredEmployees.length > 10 && (
                          <button
                            onClick={() => setShowAllEmployees(!showAllEmployees)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
                          >
                            {showAllEmployees ? 'Show Less' : 'Show All'}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Employee Table */}
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
                          {displayedEmployees.map((employee, index) => (
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
                                  <div>{employee.work_hours ? `${Math.round(employee.work_hours * 10) / 10}h` : 'N/A'}</div>
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

                    {/* Show All/Less Toggle at Bottom */}
                    {filteredEmployees.length > 10 && (
                      <div className="mt-4 text-center">
                        <button
                          onClick={() => setShowAllEmployees(!showAllEmployees)}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm transition-colors"
                        >
                          {showAllEmployees ? 
                            `Show Less (Hide ${remainingCount} employees)` : 
                            `Show All ${filteredEmployees.length} Employees`
                          }
                        </button>
                      </div>
                    )}

                    {/* No Results Message */}
                    {filteredEmployees.length === 0 && employeeSearchTerm && (
                      <div className="text-center py-8">
                        <p className="text-gray-500">No employees found matching "{employeeSearchTerm}"</p>
                        <button
                          onClick={() => setEmployeeSearchTerm('')}
                          className="text-blue-600 hover:text-blue-800 text-sm mt-2"
                        >
                          Clear search
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">👥 Employee Details</h3>
                    <p className="text-gray-600">
                      {selectedDate ? `No employee records found for ${formatDate(selectedDate)}.` : 'Select a date to view employee details.'}
                    </p>
                  </div>
                )}
              </div>
            ) : activeTab === 'weekly' ? (
              // Weekly Reports Tab - Enhanced placeholder
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">📈 Weekly Reports</h3>
                <p className="text-gray-600 mb-4">Weekly reports functionality will be implemented in Step 2B.</p>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">🚀 Coming Soon:</h4>
                  <ul className="text-blue-800 text-sm space-y-1">
                    <li>• Weekly attendance summaries</li>
                    <li>• Employee weekly performance</li>
                    <li>• Week-over-week comparisons</li>
                    <li>• Perfect attendance tracking</li>
                  </ul>
                </div>
              </div>
            ) : activeTab === 'monthly' ? (
              // Monthly Reports Tab - Enhanced placeholder
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">📊 Monthly Reports</h3>
                <p className="text-gray-600 mb-4">Monthly reports functionality will be implemented in Step 2B.</p>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-purple-900 mb-2">🚀 Coming Soon:</h4>
                  <ul className="text-purple-800 text-sm space-y-1">
                    <li>• Monthly attendance trends</li>
                    <li>• Individual employee monthly reports</li>
                    <li>• Month-over-month analysis</li>
                    <li>• Detailed work hours tracking</li>
                  </ul>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}