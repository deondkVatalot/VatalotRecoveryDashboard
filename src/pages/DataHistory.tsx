import React, { useState, useEffect, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Eye, FileDown, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import DataGrid from '../components/DataGrid';
import { DataImport, DataRecord } from '../types';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../utils/supabase';

export default function DataHistory() {
  const { user } = useAuthStore();
  const [dataHistory, setDataHistory] = useState<DataImport[]>([]);
  const [selectedImport, setSelectedImport] = useState<DataImport | null>(null);
  const [previewData, setPreviewData] = useState<DataRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHistory = async () => {
      if (!user?.id) return;

      try {
        const { data, error } = await supabase
          .from('data_imports')
          .select('*')
          .eq('user_id', user.id)
          .order('imported_at', { ascending: false });

        if (error) throw error;
        setDataHistory(data || []);
      } catch (error) {
        console.error('Error loading history:', error);
        toast.error('Failed to load import history');
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, [user?.id]);

  const handlePreview = async (importData: DataImport) => {
    try {
      const { data, error } = await supabase
        .from('data')
        .select('*')
        .eq('import_id', importData.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const transformedData = (data || []).map(record => ({
        id: record.id,
        Date: record.date,
        TransID: record.trans_id,
        Account: record.account,
        Aname: record.aname,
        Reference: record.reference,
        Description: record.description,
        Amount: record.amount,
        VAT: record.vat,
        Flag: record.flag,
        Verified: record.verified,
        Status: record.status,
        Notes: record.notes
      }));

      setSelectedImport(importData);
      setPreviewData(transformedData);
    } catch (error) {
      console.error('Error loading preview data:', error);
      toast.error('Failed to load preview data');
    }
  };

  const handleExport = async (importData: DataImport) => {
    try {
      const { data, error } = await supabase
        .from('data')
        .select('*')
        .eq('import_id', importData.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      if (!data || data.length === 0) {
        toast.error('No data available for export');
        return;
      }

      const transformedData = data.map(record => ({
        Date: record.date,
        TransID: record.trans_id,
        Account: record.account,
        Aname: record.aname,
        Reference: record.reference,
        Description: record.description,
        Amount: record.amount,
        VAT: record.vat,
        Flag: record.flag,
        Verified: record.verified,
        Status: record.status,
        Notes: record.notes
      }));

      const ws = XLSX.utils.json_to_sheet(transformedData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Historical Data');
      XLSX.writeFile(wb, `${importData.filename}-${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success('Data exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data');
    }
  };

  const handleDelete = async (importData: DataImport) => {
    if (!window.confirm('Are you sure you want to delete this import? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('data_imports')
        .delete()
        .eq('id', importData.id)
        .eq('user_id', user?.id);

      if (error) throw error;

      setDataHistory(prev => prev.filter(item => item.id !== importData.id));
      if (selectedImport?.id === importData.id) {
        setSelectedImport(null);
        setPreviewData([]);
      }
      toast.success('Import deleted successfully');
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete import');
    }
  };

  const columns: ColumnDef<DataImport>[] = [
    {
      accessorKey: 'filename',
      header: 'Filename'
    },
    {
      accessorKey: 'imported_at',
      header: 'Imported At',
      cell: ({ getValue }) => new Date(getValue() as string).toLocaleString()
    },
    {
      accessorKey: 'record_count',
      header: 'Records'
    },
    {
      accessorKey: 'imported_by',
      header: 'Imported By'
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <button 
            onClick={() => handlePreview(row.original)}
            className="text-indigo-600 hover:text-indigo-900"
            title="Preview"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleExport(row.original)}
            className="text-indigo-600 hover:text-indigo-900"
            title="Export"
          >
            <FileDown className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(row.original)}
            className="text-red-600 hover:text-red-900"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  const previewColumns = useMemo(() => {
    if (previewData.length === 0) return [];
    
    return Object.keys(previewData[0]).map((key) => ({
      accessorKey: key,
      header: key.charAt(0).toUpperCase() + key.slice(1),
      cell: ({ getValue }) => {
        const value = getValue();
        if (key === 'Amount' || key === 'VAT') {
          return new Intl.NumberFormat('en-ZA', {
            style: 'currency',
            currency: 'ZAR'
          }).format(value as number);
        }
        return value as string;
      }
    }));
  }, [previewData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading history...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Data Import History</h1>
      
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        {dataHistory.length > 0 ? (
          <DataGrid 
            data={dataHistory} 
            columns={columns}
            title="Import History"
          />
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No import history available.
          </div>
        )}
      </div>

      {selectedImport && previewData.length > 0 && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mt-6">
          <h2 className="text-xl font-semibold mb-4 dark:text-white">
            Preview: {selectedImport.filename}
          </h2>
          <DataGrid 
            data={previewData} 
            columns={previewColumns}
            title={`Preview - ${selectedImport.filename}`}
          />
        </div>
      )}
    </div>
  );
}