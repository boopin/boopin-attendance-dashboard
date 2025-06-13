// app/page.tsx
// 🎯 Main Dashboard Component - Final Clean Version (Step 2B Complete)
// Reduced from 1500+ lines to ~100 lines using components and hooks

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import type { TabType } from '../lib/types';
import { DASHBOARD_CONFIG, LOADING_STATES } from '../constants/config';

// Import our custom hooks
import { useAttendanceData } from '../hooks/useAttendanceData';
import { useEmployeeData } from '../hooks/useEmployeeData';

// Import tab components
import { DailySummaryTab } from '../components/dashboard/DailySummaryTab';
import { EmployeeDetailsTab } from '../components/dashboard/EmployeeDetailsTab';
import { WeeklyReportsTab } from '../components/dashboard/WeeklyReportsTab';
import { MonthlyReportsTab } from '../components/dashboard/MonthlyReportsTab';

export default function Dashboard() {
  // UI State
  const [activeTab, setActiveTab] = useState<TabType>(DASHBOARD_CONFIG.defaultTab);
  const [selectedDate, setSelectedDate] = useState('');

  // Custom hooks for data management
  const {
    dailyData,
    weeklyData,
    loading: attendanceLoading,
    error: attendanceError,
    refreshData,
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

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    await refreshData();
    await loadEmployees();
    if (selectedDate) {
      await loadEmployeeData(selectedDate);
    }
  }, [refreshData, loadEmployees, loadEmployeeData, selectedDate]);

  // Get statistics
  const summaryStats = getSummaryStats();
  const attendanceStats = getAttendanceStats();

  // Tab configuration
  const tabs = [
    { id: 'summary', label: '📊 Daily Summary', icon: '📊' },
    { id: 'employees', label: '👥 Employee Details', icon: '👥' },
    { id: 'weekly', label: '📈 Weekly Reports', icon: '📈' },
    { id: 'monthly', label: '📊 Monthly Reports', icon: '📊' }
  ];

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
        {loading && !dailyData.length ? (
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
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as TabType)}
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

            {/* Global Error Display */}
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

            {/* Tab Content */}
            {activeTab === 'summary' && (
              <DailySummaryTab
                dailyData={dailyData}
                loading={attendanceLoading}
                error={attendanceError}
                summaryStats={summaryStats}
              />
            )}
            
            {activeTab === 'employees' && (
              <EmployeeDetailsTab
                dailyData={dailyData}
                employeeRecords={employeeRecords}
                selectedDate={selectedDate}
                loading={employeeLoading}
                error={employeeError}
                attendanceStats={attendanceStats}
                onDateChange={handleDateChange}
              />
            )}
            
            {activeTab === 'weekly' && (
              <WeeklyReportsTab
                weeklyData={weeklyData}
                loading={attendanceLoading}
                error={attendanceError}
              />
            )}
            
            {activeTab === 'monthly' && (
              <MonthlyReportsTab
                employees={employees}
                loading={employeeLoading}
                error={employeeError}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}