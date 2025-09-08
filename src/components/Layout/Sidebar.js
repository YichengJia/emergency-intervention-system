import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function Sidebar() {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <aside className="bg-gray-100 w-60 p-4 border-r border-gray-200 h-full">
      <nav className="flex flex-col space-y-2">
        {user.role === 'patient' && (
          <NavLink
            to="/dashboard/patient"
            className={({ isActive }) =>
              isActive
                ? 'text-blue-600 font-medium'
                : 'text-gray-700 hover:text-blue-600'
            }
          >
            My Dashboard
          </NavLink>
        )}
        {user.role === 'doctor' && (
          <NavLink
            to="/dashboard/doctor"
            className={({ isActive }) =>
              isActive
                ? 'text-blue-600 font-medium'
                : 'text-gray-700 hover:text-blue-600'
            }
          >
            Doctor Dashboard
          </NavLink>
        )}
      </nav>
    </aside>
  );
}