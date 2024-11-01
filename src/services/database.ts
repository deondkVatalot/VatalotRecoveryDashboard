import { createClient } from '@supabase/supabase-js';
import { DataRecord, DataImport, UserWithPassword } from '../types';
import { config } from '../config';

class DatabaseService {
  private supabase;

  constructor() {
    this.supabase = createClient(
      config.database.supabase.url,
      config.database.supabase.key
    );
  }

  // User Management
  async saveUser(user: UserWithPassword): Promise<void> {
    const { error } = await this.supabase
      .from('users')
      .upsert({ 
        id: user.id,
        first_name: user.firstName,
        last_name: user.lastName,
        email: user.email,
        company: user.company,
        role: user.role,
        status: user.status,
        theme: user.theme,
        created_at: user.createdAt,
        updated_at: new Date().toISOString()
      });

    if (error) throw error;
  }

  async getUsers(): Promise<UserWithPassword[]> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching users:', error);
      return [];
    }

    return data.map(user => ({
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      company: user.company,
      role: user.role,
      status: user.status,
      theme: user.theme,
      createdAt: user.created_at
    }));
  }

  async deleteUser(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Data Management
  async saveData(userId: string, data: DataRecord[]): Promise<void> {
    const { error } = await this.supabase
      .from('data')
      .insert(
        data.map(record => ({
          ...record,
          created_by: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }))
      );

    if (error) throw error;
  }

  async getData(userId: string): Promise<DataRecord[]> {
    const { data, error } = await this.supabase
      .from('data')
      .select('*')
      .eq('created_by', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching data:', error);
      return [];
    }

    return data || [];
  }

  async saveDataHistory(userId: string, historyData: DataImport): Promise<void> {
    const { error } = await this.supabase
      .from('data_imports')
      .insert({
        id: historyData.id,
        user_id: userId,
        filename: historyData.filename,
        data: historyData.data,
        record_count: historyData.recordCount,
        imported_by: historyData.importedBy,
        imported_at: historyData.importedAt
      });

    if (error) throw error;
  }

  async getDataHistory(userId: string): Promise<DataImport[]> {
    const { data, error } = await this.supabase
      .from('data_imports')
      .select('*')
      .eq('user_id', userId)
      .order('imported_at', { ascending: false });

    if (error) {
      console.error('Error fetching history:', error);
      return [];
    }

    return data.map(row => ({
      id: row.id,
      filename: row.filename,
      data: row.data,
      recordCount: row.record_count,
      importedBy: row.imported_by,
      importedAt: row.imported_at
    }));
  }

  async deleteHistoryItem(userId: string, id: string): Promise<void> {
    const { error } = await this.supabase
      .from('data_imports')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
  }

  async clearData(userId: string): Promise<void> {
    const { error } = await this.supabase
      .from('data')
      .delete()
      .eq('created_by', userId);

    if (error) throw error;
  }
}

export const databaseService = new DatabaseService();