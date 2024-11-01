import { User, UserData } from '../types';

const USER_DATA_PREFIX = 'vatalot_user_';

export const saveUserData = (userId: string, data: UserData): void => {
  try {
    localStorage.setItem(`${USER_DATA_PREFIX}${userId}`, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving user data:', error);
  }
};

export const getUserData = (userId: string): UserData | null => {
  try {
    const data = localStorage.getItem(`${USER_DATA_PREFIX}${userId}`);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error loading user data:', error);
    return null;
  }
};

export const deleteUserData = (userId: string): void => {
  try {
    localStorage.removeItem(`${USER_DATA_PREFIX}${userId}`);
  } catch (error) {
    console.error('Error deleting user data:', error);
  }
};