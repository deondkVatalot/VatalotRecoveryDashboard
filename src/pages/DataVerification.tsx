import React, { useState, useEffect, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Save, RotateCcw, Edit, FileDown, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import DataGrid from '../components/DataGrid';
import FileUpload from '../components/FileUpload';
import ProgressModal from '../components/ProgressModal';
import { DataRecord } from '../types';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../utils/supabase';
import { useTranslation } from 'react-i18next';

interface ValidationRecord extends DataRecord {
  hasError?: boolean;
  errorFields?: string[];
}

export default function DataVerification() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [data, setData] = useState<ValidationRecord[]>([]);
  const [currentFileName, setCurrentFileName] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [pageSize, setPageSize] = useState(50);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [importProgress, setImportProgress] = useState(0);
  const [isImporting, setIsImporting] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  const columns = useMemo<ColumnDef<ValidationRecord>[]>(() => [
    // ... your existing columns definition
  ], [isEditing]);

  useEffect(() => {
    const loadData = async () => {
      if (!user?.id) return;

      try {
        const { data: validationData, error } = await supabase
          .from('data_validation_records')
          .select('*')
          .eq('created_by', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (validationData) {
          const transformedData = validationData.map(record => ({
            id: record.id,
            Date: record.date,
            TransID: record.trans_id,
            Account: record.account,
            Aname: record.aname,
            Reference: record.reference,
            Description: record.description,
            Amount: record.amount,
            VAT: record.vat,
            hasError: record.has_error,
            errorFields: record.error_fields
          }));
          setData(transformedData);
        }
      } catch (error) {
        console.error('Error loading validation data:', error);
        toast.error(t('data.validation.error'));
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user?.id, t]);

  const handleValidate = async () => {
    if (data.length === 0) {
      toast.error(t('data.validation.noData'));
      return;
    }

    setIsValidating(true);
    try {
      const validatedData = data.map(record => {
        const errors: string[] = [];
        
        // Check required fields
        ['Date', 'TransID', 'Account', 'Amount', 'VAT'].forEach(field => {
          const value = record[field as keyof ValidationRecord];
          if (value === undefined || value === null || value === '') {
            errors.push(field);
          }
        });

        // Additional validation for Amount and VAT
        if (typeof record.Amount === 'number' && record.Amount <= 0) {
          errors.push('Amount must be positive');
        }
        if (typeof record.VAT === 'number' && record.VAT < 0) {
          errors.push('VAT cannot be negative');
        }
        if (typeof record.Amount === 'number' && typeof record.VAT === 'number' && record.VAT > record.Amount) {
          errors.push('VAT cannot exceed Amount');
        }

        return {
          ...record,
          hasError: errors.length > 0,
          errorFields: errors
        };
      });

      setData(validatedData);
      
      const hasErrors = validatedData.some(record => record.hasError);
      if (hasErrors) {
        toast.error(t('data.validation.hasErrors'));
      } else {
        toast.success(t('data.validation.noErrors'));
      }
    } catch (error) {
      console.error('Validation error:', error);
      toast.error(t('data.validation.error'));
    } finally {
      setIsValidating(false);
    }
  };

  const handleSave = async () => {
    if (!user?.id || data.length === 0) {
      toast.error(t('data.save.noData'));
      return;
    }

    setIsSaving(true);
    try {
      // Create validation batch
      const { data: validationBatch, error: batchError } = await supabase
        .from('data_validation')
        .insert({
          filename: currentFileName,
          record_count: data.length,
          created_by: user.id
        })
        .select('id')
        .single();

      if (batchError) throw batchError;

      // Save validation records
      const validationRecords = data.map(record => ({
        validation_id: validationBatch.id,
        date: record.Date,
        trans_id: record.TransID,
        account: record.Account,
        aname: record.Aname,
        reference: record.Reference,
        description: record.Description,
        amount: record.Amount,
        vat: record.VAT,
        has_error: record.hasError,
        error_fields: record.errorFields,
        created_by: user.id
      }));

      const { error: recordsError } = await supabase
        .from('data_validation_records')
        .insert(validationRecords);

      if (recordsError) throw recordsError;

      toast.success(t('data.save.success'));
    } catch (error) {
      console.error('Save error:', error);
      toast.error(t('data.save.error'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (window.confirm(t('data.clear.confirm'))) {
      setData([]);
      setCurrentFileName('');
      setIsEditing(false);
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
        const processedData: ValidationRecord[] = [];

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
            VAT: parseFloat(String(record.VAT || record.vat || 0))
          });

          if (i % 100 === 0 || i === jsonData.length - 1) {
            setImportProgress(Math.round((i + 1) / totalRecords * 100));
          }

          if (i % 1000 === 0) {
            await new Promise(resolve => setTimeout(resolve, 0));
          }
        }

        setData(processedData);
        setCurrentFileName(file.name);
        toast.success(t('data.import.success'));
      } catch (error) {
        console.error('File parse error:', error);
        toast.error(t('data.import.error'));
      } finally {
        setIsImporting(false);
        setImportProgress(0);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const getRowClassName = (record: ValidationRecord) => {
    if (!record) return '';
    
    // Check for empty required fields
    const hasEmptyRequired = [
      'Date',
      'TransID',
      'Account',
      'Amount',
      'VAT'
    ].some(field => {
      const value = record[field as keyof ValidationRecord];
      return value === undefined || value === null || value === '';
    });

    if (hasEmptyRequired) {
      return 'bg-red-50 dark:bg-red-900/10';
    }

    return '';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t('data.verification')}
        </h1>
        <div className="flex gap-4">
          <button
            onClick={handleValidate}
            disabled={data.length === 0 || isValidating}
            className="flex items-center gap-2 px-4 py-2 rounded-lg btn-primary"
          >
            <CheckCircle className="w-4 h-4" />
            {isValidating ? t('data.validation.inProgress') : t('data.validation.validate')}
          </button>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg btn-primary"
            disabled={data.length === 0}
          >
            <Edit className="w-4 h-4" />
            {isEditing ? t('data.edit.exit') : t('data.edit.start')}
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 rounded-lg btn-primary"
            disabled={data.length === 0 || isSaving}
          >
            <Save className="w-4 h-4" />
            {isSaving ? t('common.saving') : t('common.save')}
          </button>
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 rounded-lg btn-secondary"
            disabled={data.length === 0}
          >
            <RotateCcw className="w-4 h-4" />
            {t('data.clear.button')}
          </button>
        </div>
      </div>

      <FileUpload onFileSelect={handleFileUpload} />

      {isImporting && (
        <ProgressModal
          progress={importProgress}
          message={t('data.import.title')}
        />
      )}

      {data.length > 0 && (
        <DataGrid
          data={data}
          columns={columns}
          pageSize={pageSize}
          onPageSizeChange={setPageSize}
          title="Validation Data"
          getRowClassName={getRowClassName}
          onDataChange={setData}
        />
      )}
    </div>
  );
}