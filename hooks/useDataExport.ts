// hooks/useDataExport.ts
// 📊 Custom hook for handling data export functionality

import { useState, useCallback } from 'react';
import type { ExportType } from '../lib/types';
import { exportToCSV, generateExportFilename } from '../lib/utils';

interface UseDataExportReturn {
  exporting: boolean;
  exportData: (type: ExportType, data: any[], context?: string, date?: string) => Promise<void>;
  exportWithCustomFilename: (data: any[], filename: string, type: ExportType) => Promise<void>;
}

export const useDataExport = (): UseDataExportReturn => {
  const [exporting, setExporting] = useState(false);

  // Main export function
  const exportData = useCallback(async (
    type: ExportType, 
    data: any[], 
    context?: string, 
    date?: string
  ) => {
    if (!data || data.length === 0) {
      alert('No data to export');
      return;
    }

    setExporting(true);
    
    try {
      const filename = generateExportFilename(type, context, date);
      
      // Small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 100));
      
      exportToCSV({ data, filename, type });
      
      // Track export success (could be extended with analytics)
      console.log(`✅ Export successful: ${filename}`);
      
    } catch (error: any) {
      console.error('❌ Export failed:', error);
      alert(`Export failed: ${error.message}`);
    } finally {
      setExporting(false);
    }
  }, []);

  // Export with custom filename
  const exportWithCustomFilename = useCallback(async (
    data: any[], 
    filename: string, 
    type: ExportType
  ) => {
    if (!data || data.length === 0) {
      alert('No data to export');
      return;
    }

    setExporting(true);
    
    try {
      // Small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 100));
      
      exportToCSV({ data, filename, type });
      
      console.log(`✅ Export successful: ${filename}`);
      
    } catch (error: any) {
      console.error('❌ Export failed:', error);
      alert(`Export failed: ${error.message}`);
    } finally {
      setExporting(false);
    }
  }, []);

  return {
    exporting,
    exportData,
    exportWithCustomFilename
  };
};