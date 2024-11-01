import { create } from 'zustand';
import { DataRecord, DataImport } from '../types';
import { useAuthStore } from './authStore';
import { supabase } from '../utils/supabase';

interface DataState {
  getCurrentData: () => Promise<DataRecord[]>;
  getOriginalData: () => Promise<DataRecord[]>;
  getDataHistory: () => Promise<DataImport[]>;
  setCurrentData: (data: DataRecord[]) => Promise<void>;
  setOriginalData: (data: DataRecord[]) => Promise<void>;
  addToHistory: (importData: Omit<DataImport, 'id'>) => Promise<void>;
  deleteHistoryItem: (id: string) => Promise<void>;
  clearData: () => Promise<void>;
}

export const useDataStore = create<DataState>()((set, get) => ({
  getCurrentData: async () => {
    try {
      const user = useAuthStore.getState().user;
      if (!user) return [];

      const { data, error } = await supabase
        .from('data')
        .select('*')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error in getCurrentData:', error);
      return [];
    }
  },

  getOriginalData: async () => {
    try {
      const user = useAuthStore.getState().user;
      if (!user) return [];

      const { data, error } = await supabase
        .from('data')
        .select('*')
        .eq('created_by', user.id)
        .eq('is_original', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error in getOriginalData:', error);
      return [];
    }
  },

  getDataHistory: async () => {
    try {
      const user = useAuthStore.getState().user;
      if (!user) return [];

      const { data, error } = await supabase
        .from('data_imports')
        .select('*')
        .eq('user_id', user.id)
        .order('imported_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error in getDataHistory:', error);
      return [];
    }
  },

  setCurrentData: async (data: DataRecord[]) => {
    try {
      const user = useAuthStore.getState().user;
      if (!user) throw new Error('User not authenticated');

      // Clear existing data
      const { error: deleteError } = await supabase
        .from('data')
        .delete()
        .eq('created_by', user.id);

      if (deleteError) throw deleteError;

      // Insert new data in batches
      const batchSize = 1000;
      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize).map(record => ({
          id: record.id,
          date: record.date,
          trans_id: record.trans_id,
          account: record.account,
          aname: record.aname,
          reference: record.reference,
          description: record.description,
          amount: record.amount,
          vat: record.vat,
          flag: record.flag,
          verified: record.verified,
          status: record.status,
          notes: record.notes,
          created_by: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));

        const { error: insertError } = await supabase
          .from('data')
          .insert(batch);

        if (insertError) throw insertError;
      }
    } catch (error) {
      console.error('Error in setCurrentData:', error);
      throw error;
    }
  },

  setOriginalData: async (data: DataRecord[]) => {
    try {
      const user = useAuthStore.getState().user;
      if (!user) throw new Error('User not authenticated');

      // Insert original data in batches
      const batchSize = 1000;
      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize).map(record => ({
          id: record.id,
          date: record.date,
          trans_id: record.trans_id,
          account: record.account,
          aname: record.aname,
          reference: record.reference,
          description: record.description,
          amount: record.amount,
          vat: record.vat,
          flag: record.flag,
          verified: record.verified,
          status: record.status,
          notes: record.notes,
          created_by: user.id,
          is_original: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));

        const { error } = await supabase
          .from('data')
          .insert(batch);

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error in setOriginalData:', error);
      throw error;
    }
  },

  addToHistory: async (importData: Omit<DataImport, 'id'>) => {
    try {
      const user = useAuthStore.getState().user;
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('data_imports')
        .insert({
          user_id: user.id,
          filename: importData.filename,
          data: importData.data || [],
          record_count: importData.recordCount,
          imported_by: importData.importedBy,
          imported_at: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error in addToHistory:', error);
      throw error;
    }
  },

  deleteHistoryItem: async (id: string) => {
    try {
      const user = useAuthStore.getState().user;
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('data_imports')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error in deleteHistoryItem:', error);
      throw error;
    }
  },

  clearData: async () => {
    try {
      const user = useAuthStore.getState().user;
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('data')
        .delete()
        .eq('created_by', user.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error in clearData:', error);
      throw error;
    }
  }
}));