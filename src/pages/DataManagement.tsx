import React, { useState, useEffect, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Save, RotateCcw, Edit, FileDown, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import DataGrid from '../components/DataGrid';
import FileUpload from '../components/FileUpload';
import ProgressModal from '../components/ProgressModal';
import { DataRecord } from '../types';
import { useDataStore } from '../store/dataStore';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../utils/supabase';

const VERIFICATION_STATUS = {
  '0': 'Client to Verify',
  '1': 'Verified',
  '2': 'Not VAT Registered'
} as const;

export default function DataManagement() {
  const { user } = useAuthStore();
  const { getCurrentData, setCurrentData, addToHistory, clearData } = useDataStore();
  
  const [data, setData] = useState<DataRecord[]>([]);
  const [filteredData, setFilteredData] = useState<DataRecord[]>([]);
  const [currentFileName, setCurrentFileName] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [pageSize, setPageSize] = useState(50);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [importProgress, setImportProgress] = useState(0);
  const [isImporting, setIsImporting] = useState(false);
  const [showFlagged, setShowFlagged] = useState(false);

  const columns = useMemo<ColumnDef<DataRecord>[]>(() => [
    {
      accessorKey: 'Date',
      header: 'Date',
      cell: ({ getValue }) => getValue() as string
    },
    {
      accessorKey: 'TransID',
      header: 'Transaction ID',
      cell: ({ getValue }) => getValue() as string
    },
    {
      accessorKey: 'Account',
      header: 'Account',
      cell: ({ getValue }) => getValue() as string
    },
    {
      accessorKey: 'Aname',
      header: 'Account Name',
      cell: ({ getValue }) => getValue() as string
    },
    {
      accessorKey: 'Reference',
      header: 'Reference',
      cell: ({ getValue }) => getValue() as string
    },
    {
      accessorKey: 'Description',
      header: 'Description',
      cell: ({ getValue }) => getValue() as string
    },
    {
      accessorKey: 'Amount',
      header: 'Amount',
      cell: ({ getValue }) => {
        const value = getValue() as number;
        return new Intl.NumberFormat('en-ZA', {
          style: 'currency',
          currency: 'ZAR'
        }).format(value);
      }
    },
    {
      accessorKey: 'VAT',
      header: 'VAT',
      cell: ({ getValue }) => {
        const value = getValue() as number;
        return new Intl.NumberFormat('en-ZA', {
          style: 'currency',
          currency: 'ZAR'
        }).format(value);
      }
    },
    {
      accessorKey: 'Flag',
      header: 'Flag',
      cell: ({ getValue }) => getValue() as string
    },
    {
      accessorKey: 'Verified',
      header: 'Verified',
      cell: ({ getValue, row }) => {
        const value = getValue() as string;
        if (!isEditing) return value;

        return (
          <select
            value={value}
            onChange={(e) => {
              const newData = [...data];
              newData[row.index] = {
                ...newData[row.index],
                Verified: e.target.value,
                Status: VERIFICATION_STATUS[e.target.value as keyof typeof VERIFICATION_STATUS]
              };
              setData(newData);
              updateFilteredData(newData);
            }}
            className="w-full px-2 py-1 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="0">Client to Verify</option>
            <option value="1">Verified</option>
            <option value="2">Not VAT Registered</option>
          </select>
        );
      }
    },
    {
      accessorKey: 'Status',
      header: 'Status',
      cell: ({ getValue }) => getValue() as string
    },
    {
      accessorKey: 'Notes',
      header: 'Notes',
      cell: ({ getValue, row }) => {
        const value = getValue() as string;
        if (!isEditing) return value;

        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => {
              const newData = [...data];
              newData[row.index] = {
                ...newData[row.index],
                Notes: e.target.value
              };
              setData(newData);
              updateFilteredData(newData);
            }}
            className="w-full px-2 py-1 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        );
      }
    }
  ], [data, isEditing]);

  useEffect(() => {
    const loadData = async () => {
      if (!user?.id) return;

      try {
        const { data: currentData, error } = await supabase
          .from('data')
          .select('*')
          .eq('created_by', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (currentData) {
          const transformedData = currentData.map(record => ({
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
            Notes: record.notes,
            import_id: record.import_id
          }));
          setData(transformedData);
          setFilteredData(transformedData);
        }
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user?.id]);

  const updateFilteredData = (newData: DataRecord[]) => {
    if (showFlagged) {
      setFilteredData(newData.filter(record => 
        record.Verified === '0' || record.Verified === '2'
      ));
    } else {
      setFilteredData(newData);
    }
  };

  const handleSave = async () => {
    if (!user?.id || data.length === 0) {
      toast.error('No data to save or user not authenticated');
      return;
    }

    setIsSaving(true);
    try {
      // Create a new import record
      const { data: importData, error: importError } = await supabase
        .from('data_imports')
        .insert({
          user_id: user.id,
          filename: currentFileName || 'Untitled Import',
          record_count: data.length,
          imported_by: `${user.firstName} ${user.lastName}`,
          imported_at: new Date().toISOString()
        })
        .select('id')
        .single();

      if (importError) throw importError;

      // Transform the data
      const transformedData = data.map(record => ({
        date: record.Date || record.date || '',
        trans_id: record.TransID || record.trans_id || '',
        account: record.Account || record.account || '',
        aname: record.Aname || record.aname || '',
        reference: record.Reference || record.reference || '',
        description: record.Description || record.description || '',
        amount: parseFloat(String(record.Amount || record.amount || 0)),
        vat: parseFloat(String(record.VAT || record.vat || 0)),
        flag: record.Flag || record.flag || '',
        verified: String(record.Verified || record.verified || '0'),
        status: record.Status || record.status || VERIFICATION_STATUS['0'],
        notes: record.Notes || record.notes || '',
        created_by: user.id,
        import_id: importData.id
      }));

      // Insert data in batches
      const batchSize = 100;
      for (let i = 0; i < transformedData.length; i += batchSize) {
        const batch = transformedData.slice(i, i + batchSize);
        const { error: insertError } = await supabase
          .from('data')
          .insert(batch);

        if (insertError) throw insertError;
      }

      toast.success('Data saved successfully');
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save data');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    setIsImporting(true);
    setImportProgress(0);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet);

        const totalRecords = jsonData.length;
        const processedData: DataRecord[] = [];

        for (let i = 0; i < jsonData.length; i++) {
          const record = jsonData[i];
          processedData.push({
            id: crypto.randomUUID(),
            Date: record.Date || record.date || '',
            TransID: record.TransID || record.trans_id || '',
            Account: record.Account || record.account || '',
            Aname: record.Aname || record.aname || '',
            Reference: record.Reference || record.reference || '',
            Description: record.Description || record.description || '',
            Amount: parseFloat(String(record.Amount || record.amount || 0)),
            VAT: parseFloat(String(record.VAT || record.vat || 0)),
            Flag: record.Flag || record.flag || '',
            Verified: String(record.Verified || record.verified || '0'),
            Status: VERIFICATION_STATUS[String(record.Verified || record.verified || '0') as keyof typeof VERIFICATION_STATUS],
            Notes: record.Notes || record.notes || ''
          });

          if (i % 100 === 0 || i === jsonData.length - 1) {
            setImportProgress(Math.round((i + 1) / totalRecords * 100));
          }

          if (i % 1000 === 0) {
            await new Promise(resolve => setTimeout(resolve, 0));
          }
        }

        setData(processedData);
        setFilteredData(processedData);
        setCurrentFileName(file.name);
        toast.success('File imported successfully');
      } catch (error) {
        console.error('File parse error:', error);
        toast.error('Failed to parse file');
      } finally {
        setIsImporting(false);
        setImportProgress(0);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const handleReset = async () => {
    if (window.confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
      try {
        await clearData();
        setData([]);
        setFilteredData([]);
        setCurrentFileName('');
        setIsEditing(false);
        setShowFlagged(false);
        toast.success('Data cleared successfully');
      } catch (error) {
        console.error('Clear error:', error);
        toast.error('Failed to clear data');
      }
    }
  };

  const getRowClassName = (record: DataRecord) => {
    if (!record) return '';
    
    const verifiedStatus = record.Verified || record.verified;
    if (verifiedStatus === '0') return 'bg-red-50 dark:bg-red-900/10';
    if (verifiedStatus === '2') return 'bg-yellow-50 dark:bg-yellow-900/10';
    return '';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Data Management</h1>
        <div className="flex gap-4">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg btn-primary"
            disabled={data.length === 0}
          >
            <Edit className="w-4 h-4" />
            {isEditing ? 'Exit Edit Mode' : 'Edit Data'}
          </button>
          <button
            onClick={() => {
              setShowFlagged(!showFlagged);
              updateFilteredData(data);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              showFlagged ? 'bg-red-600 text-white' : 'btn-primary'
            }`}
            disabled={data.length === 0}
          >
            <AlertCircle className="w-4 h-4" />
            {showFlagged ? 'Show All Records' : 'Show Flagged Only'}
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 rounded-lg btn-primary"
            disabled={data.length === 0 || isSaving}
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 rounded-lg btn-secondary"
            disabled={data.length === 0}
          >
            <RotateCcw className="w-4 h-4" />
            Clear Data
          </button>
        </div>
      </div>

      <FileUpload onFileSelect={handleFileUpload} />

      {isImporting && (
        <ProgressModal
          progress={importProgress}
          message="Importing data, please wait..."
        />
      )}

      {data.length > 0 && (
        <DataGrid
          data={filteredData}
          columns={columns}
          pageSize={pageSize}
          onPageSizeChange={setPageSize}
          title="Current Data"
          getRowClassName={getRowClassName}
          onDataChange={(newData) => {
            setData(newData);
            updateFilteredData(newData);
          }}
        />
      )}
    </div>
  );
}