// hooks/useAttendanceData.ts
// 📊 Custom hook for managing attendance data (daily & weekly summaries)

import { useState, useCallback } from 'react';
import type { DailySummary, WeeklySummary, UseAttendanceDataReturn } from '../lib/types';
import { commonQueries, handleSupabaseError } from '../lib/supabase';
import { handleAsyncOperation } from '../lib/utils';

export const useAttendanceData = (): UseAttendanceDataReturn => {
  const [dailyData, setDailyData] = useState<DailySummary[]>([]);
  const [weeklyData, setWeeklyData] = useState<WeeklySummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Clear error
  const clearError = useCallback(() => {
    setError('');
  }, []);

  // Load daily summaries
  const loadDailyData = useCallback(async (limit?: number) => {
    setLoading(true);
    clearError();

    const { data, error: loadError } = await handleAsyncOperation(
      Promise.resolve(commonQueries.getRecentDailySummaries(limit)).then(response => {
        if (response.error) throw response.error;
        return response.data;
      }),
      'Failed to load daily summaries'
    );

    if (loadError) {
      setError(handleSupabaseError(loadError, 'Daily Data Loading'));
      setDailyData([]);
    } else {
      setDailyData(data || []);
    }

    setLoading(false);
    return { data, error: loadError };
  }, [clearError]);

  // Load weekly summaries
  const loadWeeklyData = useCallback(async (limit?: number) => {
    setLoading(true);
    clearError();

    const { data, error: loadError } = await handleAsyncOperation(
      Promise.resolve(commonQueries.getRecentWeeklySummaries(limit)).then(response => {
        if (response.error) throw response.error;
        return response.data;
      }),
      'Failed to load weekly summaries'
    );

    if (loadError) {
      setError(handleSupabaseError(loadError, 'Weekly Data Loading'));
      setWeeklyData([]);
    } else {
      setWeeklyData(data || []);
    }

    setLoading(false);
    return { data, error: loadError };
  }, [clearError]);

  // Load both daily and weekly data
  const refreshData = useCallback(async () => {
    setLoading(true);
    clearError();

    try {
      const [dailyResult, weeklyResult] = await Promise.all([
        handleAsyncOperation(
          Promise.resolve(commonQueries.getRecentDailySummaries()).then(response => {
            if (response.error) throw response.error;
            return response.data;
          }),
          'Failed to load daily summaries'
        ),
        handleAsyncOperation(
          Promise.resolve(commonQueries.getRecentWeeklySummaries()).then(response => {
            if (response.error) throw response.error;
            return response.data;
          }),
          'Failed to load weekly summaries'
        )
      ]);

      // Handle daily data
      if (dailyResult.error) {
        setError(handleSupabaseError(dailyResult.error, 'Daily Data Loading'));
        setDailyData([]);
      } else {
        setDailyData(dailyResult.data || []);
      }

      // Handle weekly data
      if (weeklyResult.error) {
        setError(prev => prev + '; ' + handleSupabaseError(weeklyResult.error, 'Weekly Data Loading'));
        setWeeklyData([]);
      } else {
        setWeeklyData(weeklyResult.data || []);
      }

      return {
        dailyData: dailyResult.data,
        weeklyData: weeklyResult.data,
        error: dailyResult.error || weeklyResult.error
      };
    } catch (err: any) {
      const errorMsg = handleSupabaseError(err, 'Data Refresh');
      setError(errorMsg);
      return { dailyData: null, weeklyData: null, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, [clearError]);

  // Get latest daily summary
  const getLatestDaily = useCallback((): DailySummary | null => {
    return dailyData.length > 0 ? dailyData[0] : null;
  }, [dailyData]);

  // Get latest weekly summary
  const getLatestWeekly = useCallback((): WeeklySummary | null => {
    return weeklyData.length > 0 ? weeklyData[0] : null;
  }, [weeklyData]);

  // Get daily data for a specific date
  const getDailyByDate = useCallback((date: string): DailySummary | null => {
    return dailyData.find(day => day.date === date) || null;
  }, [dailyData]);

  // Get weekly data for a specific week
  const getWeeklyByDates = useCallback((weekStart: string, weekEnd: string): WeeklySummary | null => {
    return weeklyData.find(week => week.week_start === weekStart && week.week_end === weekEnd) || null;
  }, [weeklyData]);

  // Calculate summary statistics
  const getSummaryStats = useCallback(() => {
    const totalDays = dailyData.length;
    const totalWeeks = weeklyData.length;
    
    if (totalDays === 0) {
      return {
        totalDays: 0,
        totalWeeks: 0,
        avgAttendance: 0,
        avgOnTimeRate: 0,
        totalEmployees: 0
      };
    }

    const avgAttendance = Math.round(
      dailyData.reduce((sum, day) => sum + day.total_employees_present, 0) / totalDays
    );

    const avgOnTimeRate = Math.round(
      dailyData.reduce((sum, day) => sum + day.ontime_rate, 0) / totalDays * 10
    ) / 10;

    const totalEmployees = Math.max(
      ...dailyData.map(day => day.total_employees_present)
    );

    return {
      totalDays,
      totalWeeks,
      avgAttendance,
      avgOnTimeRate,
      totalEmployees
    };
  }, [dailyData, weeklyData]);

  return {
    // Data
    dailyData,
    weeklyData,
    loading,
    error,
    
    // Actions
    refreshData,
    loadDailyData,
    loadWeeklyData,
    clearError,
    
    // Getters
    getLatestDaily,
    getLatestWeekly,
    getDailyByDate,
    getWeeklyByDates,
    getSummaryStats
  };
};
