// components/dashboard/EmployeeDetailsTab.tsx
// 👥 Employee Details Tab Component

'use client';

import React, { useState, useCallback } from 'react';
import type { DailySummary, EmployeeRecord } from '../../lib/types';
import { formatDate, formatTime } from '../../lib/formatters';
import { getStatusColor, getCategoryColor } from '../../lib/utils';
import { useDataExport } from '../../hooks/useDataExport';

interface EmployeeDetailsTabProps {
  dailyData: DailySummary[];
  employeeRecords: EmployeeRecord[];
  selectedDate: string;
  loading: boolean;
  error: string;
  attendanceStats: {
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
  onDateChange: (date: string) => void;
}

export const EmployeeDetailsTab: React.FC<EmployeeDetailsTabProps> = ({
  dailyData,
  employeeRecords,
  selectedDate,
  loading,
  error,
  attendanceStats,
  onDateChange
}) => {
  const { exporting, exportData } = useDataExport();
  
  // Local state for UI
  const [showAllEmployees, setShowAllEmployees] = useState(false);
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState('');

  // Filter employees based on search term
  const filteredEmployees = employeeRecords.filter(employee => 
    employee.name.toLowerCase().includes(employeeSearchTerm.toLowerCase()) ||
    employee.emp_code.toLowerCase().includes(employeeSearchTerm.toLowerCase())
  );

  const displayedEmployees = showAllEmployees ? filteredEmployees : filteredEmployees.slice(0, 10);
  const remainingCount = filteredEmployees.length - displayedEmployees.length;

  // Handle date change
  const handleDateChange = useCallback((date: string) => {
    onDateChange(date);
    // Reset UI states when date changes
    setShowAllEmployees(false);
    setEmployeeSearchTerm('');
  }, [onDateChange]);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading employee data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">Error loading employee data: {error}</p>
      </div>
    );
  }

  return (
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
  );
};