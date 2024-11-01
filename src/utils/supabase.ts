import { createClient } from '@supabase/supabase-js';
import { config } from '../config';
import toast from 'react-hot-toast';
import bcrypt from 'bcryptjs';

const supabase = createClient(config.database.supabase.url, config.database.supabase.key);

// Initialize database function
async function initializeDatabase() {
  try {
    // First, check if demo users exist
    const { data: existingUsers, error: checkError } = await supabase
      .from('users')
      .select('email')
      .in('email', ['admin@vatalot.com', 'user@vatalot.com']);

    if (checkError) {
      console.error('Error checking users:', checkError);
      return false;
    }

    // If no users exist, create them
    if (!existingUsers || existingUsers.length === 0) {
      const demoUsers = [
        {
          email: 'admin@vatalot.com',
          password: 'Vatalot2024',
          firstName: 'Admin',
          lastName: 'User',
          company: 'Vatalot',
          role: 'admin'
        },
        {
          email: 'user@vatalot.com',
          password: 'VatalotUser2024',
          firstName: 'Regular',
          lastName: 'User',
          company: 'Vatalot',
          role: 'user'
        }
      ];

      for (const user of demoUsers) {
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(user.password, salt);

        const { error: createError } = await supabase
          .from('users')
          .insert({
            first_name: user.firstName,
            last_name: user.lastName,
            email: user.email,
            password_hash: passwordHash,
            company: user.company,
            role: user.role,
            status: 'enabled',
            theme: 'light',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (createError) {
          console.error('Error creating user:', createError);
          return false;
        }
      }
    }

    return true;
  } catch (error) {
    console.error('Database initialization error:', error);
    toast.error('Failed to initialize database');
    return false;
  }
}

// Initialize the database when the module is imported
initializeDatabase().catch(console.error);

export { supabase };