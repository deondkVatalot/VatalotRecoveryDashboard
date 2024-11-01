import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, UserWithPassword } from '../types';
import { supabase } from '../utils/supabase';
import bcrypt from 'bcryptjs';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  addUser: (user: UserWithPassword) => Promise<void>;
  updateUser: (id: string, updates: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,

      login: async (email, password) => {
        try {
          // Get user from database
          const { data: users, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('email', email);

          if (userError) throw userError;
          if (!users || users.length === 0) throw new Error('Invalid credentials');

          const userData = users[0];

          // Check if account is disabled
          if (userData.status === 'disabled') {
            throw new Error('Account is disabled');
          }

          // For demo users, check plain text password
          if (email === 'admin@vatalot.com' || email === 'user@vatalot.com') {
            if (password !== userData.password_hash) {
              throw new Error('Invalid credentials');
            }
          } else {
            // For regular users, verify hashed password
            const isValid = await bcrypt.compare(password, userData.password_hash);
            if (!isValid) {
              throw new Error('Invalid credentials');
            }
          }

          const user: User = {
            id: userData.id,
            firstName: userData.first_name,
            lastName: userData.last_name,
            email: userData.email,
            company: userData.company,
            role: userData.role,
            status: userData.status,
            theme: userData.theme,
            createdAt: userData.created_at
          };

          set({ user, isAuthenticated: true });
        } catch (error) {
          console.error('Login error:', error);
          throw error;
        }
      },

      logout: () => {
        set({ user: null, isAuthenticated: false });
      },

      addUser: async (userData) => {
        try {
          // Hash password for new users
          const salt = await bcrypt.genSalt(10);
          const passwordHash = await bcrypt.hash(userData.password, salt);

          // Create user
          const { data, error } = await supabase
            .from('users')
            .insert({
              first_name: userData.firstName,
              last_name: userData.lastName,
              email: userData.email,
              password_hash: passwordHash,
              company: userData.company,
              role: userData.role,
              status: userData.status,
              theme: userData.theme,
              created_at: new Date().toISOString()
            })
            .select()
            .single();

          if (error) throw error;
          if (!data) throw new Error('Failed to create user');

        } catch (error) {
          console.error('Error adding user:', error);
          throw error;
        }
      },

      updateUser: async (id, updates) => {
        try {
          const updateData: any = {
            first_name: updates.firstName,
            last_name: updates.lastName,
            email: updates.email,
            company: updates.company,
            role: updates.role,
            status: updates.status,
            theme: updates.theme,
            updated_at: new Date().toISOString()
          };

          // If password is being updated, hash it
          if ('password' in updates && updates.password) {
            const salt = await bcrypt.genSalt(10);
            updateData.password_hash = await bcrypt.hash(updates.password, salt);
          }

          const { error } = await supabase
            .from('users')
            .update(updateData)
            .eq('id', id);

          if (error) throw error;

          set(state => ({
            user: state.user?.id === id ? { ...state.user, ...updates } : state.user
          }));
        } catch (error) {
          console.error('Error updating user:', error);
          throw error;
        }
      },

      deleteUser: async (id) => {
        try {
          const { error } = await supabase
            .from('users')
            .delete()
            .eq('id', id);

          if (error) throw error;
        } catch (error) {
          console.error('Error deleting user:', error);
          throw error;
        }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);