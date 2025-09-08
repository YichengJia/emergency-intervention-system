import { useContext } from 'react';
import { useAuthContext } from '../contexts/AuthContext';

/**
 * Custom hook to access authentication context.
 */
export function useAuth() {
  return useAuthContext();
}