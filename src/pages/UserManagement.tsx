import React, { useState, useEffect } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { UserPlus, Edit2, Trash2 } from 'lucide-react';
import DataGrid from '../components/DataGrid';
import UserModal from '../components/UserModal';
import toast from 'react-hot-toast';
import { User } from '../types';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../utils/supabase';
import bcrypt from 'bcryptjs';

export default function UserManagement() {
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;

      const transformedUsers = data.map(user => ({
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

      setUsers(transformedUsers);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = () => {
    setSelectedUser(null);
    setIsModalOpen(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleDeleteUser = async (user: User) => {
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', user.id);

      if (error) throw error;

      setUsers(prev => prev.filter(u => u.id !== user.id));
      toast.success('User deleted successfully');
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    }
  };

  const handleSaveUser = async (userData: any) => {
    try {
      if (selectedUser) {
        // Update existing user
        const updateData: any = {
          first_name: userData.firstName,
          last_name: userData.lastName,
          email: userData.email,
          company: userData.company,
          role: userData.role,
          status: userData.status,
          theme: userData.theme,
          updated_at: new Date().toISOString()
        };

        // If password is being changed, hash it
        if (userData.password) {
          const salt = await bcrypt.genSalt(10);
          updateData.password_hash = await bcrypt.hash(userData.password, salt);
        }

        const { error } = await supabase
          .from('users')
          .update(updateData)
          .eq('id', selectedUser.id);

        if (error) throw error;

        setUsers(prev => prev.map(user => 
          user.id === selectedUser.id ? { ...user, ...userData } : user
        ));
        toast.success('User updated successfully');
      } else {
        // Create new user with hashed password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(userData.password, salt);

        const { data, error } = await supabase
          .from('users')
          .insert({
            first_name: userData.firstName,
            last_name: userData.lastName,
            email: userData.email,
            company: userData.company,
            role: userData.role,
            status: userData.status,
            theme: userData.theme || 'light',
            password_hash: passwordHash,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (error) throw error;

        const newUser: User = {
          id: data.id,
          firstName: data.first_name,
          lastName: data.last_name,
          email: data.email,
          company: data.company,
          role: data.role,
          status: data.status,
          theme: data.theme,
          createdAt: data.created_at
        };

        setUsers(prev => [...prev, newUser]);
        toast.success('User added successfully');
      }

      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving user:', error);
      toast.error('Failed to save user');
    }
  };

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: 'firstName',
      header: 'First Name'
    },
    {
      accessorKey: 'lastName',
      header: 'Last Name'
    },
    {
      accessorKey: 'email',
      header: 'Email'
    },
    {
      accessorKey: 'company',
      header: 'Company'
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ getValue }) => (
        <span className={`capitalize ${getValue() === 'admin' ? 'text-indigo-600' : 'text-gray-600'}`}>
          {getValue() as string}
        </span>
      )
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ getValue }) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          getValue() === 'enabled' 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {getValue() as string}
        </span>
      )
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleEditUser(row.original)}
            className="text-indigo-600 hover:text-indigo-900"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDeleteUser(row.original)}
            className="text-red-600 hover:text-red-900"
            disabled={row.original.email === currentUser?.email}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h1>
        <button
          onClick={handleAddUser}
          className="flex items-center gap-2 px-4 py-2 rounded-lg btn-primary"
        >
          <UserPlus className="w-4 h-4" />
          Add User
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <DataGrid
          data={users}
          columns={columns}
          pageSize={10}
          title="User List"
        />
      </div>

      {isModalOpen && (
        <UserModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveUser}
          user={selectedUser}
        />
      )}
    </div>
  );
}