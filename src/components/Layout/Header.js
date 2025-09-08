import React from 'react';
import { useAuth } from '../../hooks/useAuth';

export default function Header() {
  const { user, logout } = useAuth();
  return (
    <header className="bg-blue-600 text-white p-4 flex justify-between items-center">
      <h1 className="text-xl font-semibold">Emergency Intervention System</h1>
      {user && (
        <div className="flex items-center space-x-4">
          <span>Hello, {user.name}</span>
          <button
            onClick={logout}
            className="bg-blue-800 hover:bg-blue-700 text-white px-3 py-1 rounded"
          >
            Logout
          </button>
        </div>
      )}
    </header>
  );
}