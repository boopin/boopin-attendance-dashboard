// components/dashboard/DailySummaryTab.tsx
// 📊 Daily Summary Tab Component

'use client';

import React from 'react';
import type { DailySummary } from '../../lib/types';
import { formatDate, formatTime } from '../../lib/formatters';
import { useDataExport } from '../../hooks/useDataExport';

interface DailySummaryTabProps {
  dailyData: DailySummary[];
  loading: boolean;
  error: string;
  summaryStats: {
    totalDays: number;
    totalWeeks: number;
    avgAttendance: number;
    avgOnTimeRate: number;
    totalEmployees: number;
  };
}

export const DailySummaryTab: React.FC<DailySummaryTabProps> = ({
  dailyData,
  loading,
  error,
  summaryStats
}) => {
  const { exporting, exportData } = useDataExport();

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading daily summaries...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">Error loading daily summaries: {error}</p>
      </div>
    );
  }

  if (!dailyData || dailyData.length === 0) {
    return (
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
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Statistics Cards */}
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
          <p className="text-2xl font-bold text-yellow-600">{summaryStats.totalDays}</p>
          <p className="text-sm text-yellow-800">Days Tracked</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-2xl font-bold text-purple-600">{summaryStats.avgAttendance}</p>
          <p className="text-sm text-purple-800">Avg Daily Attendance</p>
        </div>
      </div>

      {/* Recent Attendance Data */}
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
            <div key={day.id || day.date || index} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">{formatDate(day.date)}</h4>
                    <div className="text-right">
                      <p className="text-xl font-bold text-blue-600">{day.ontime_rate}%</p>
                      <p className="text-xs text-gray-500">on-time rate</p>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3">{day.total_employees_present} employees present</p>
                  
                  {/* Statistics Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-green-50 p-2 rounded text-center">
                      <p className="text-lg font-bold text-green-600">{day.ontime_count}</p>
                      <p className="text-xs text-green-800">On-time</p>
                    </div>
                    <div className="bg-yellow-50 p-2 rounded text-center">
                      <p className="text-lg font-bold text-yellow-600">{day.acceptable_count}</p>
                      <p className="text-xs text-yellow-800">Acceptable</p>
                    </div>
                    <div className="bg-red-50 p-2 rounded text-center">
                      <p className="text-lg font-bold text-red-600">{day.late_count}</p>
                      <p className="text-xs text-red-800">Late</p>
                    </div>
                    <div className="bg-blue-50 p-2 rounded text-center">
                      <p className="text-lg font-bold text-blue-600">{day.early_count}</p>
                      <p className="text-xs text-blue-800">Early</p>
                    </div>
                  </div>
                  
                  {/* Time Range */}
                  {day.earliest_checkin && day.latest_checkin && (
                    <div className="mt-3 flex justify-between text-xs text-gray-500">
                      <span>Earliest: {formatTime(day.earliest_checkin)}</span>
                      <span>Latest: {formatTime(day.latest_checkin)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Show more button if there are many records */}
        {dailyData.length >= 10 && (
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-500">
              Showing {dailyData.length} most recent days
            </p>
          </div>
        )}
      </div>
    </div>
  );
};