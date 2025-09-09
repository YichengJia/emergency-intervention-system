import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Pill, Calendar, AlertTriangle, LogOut, User } from 'lucide-react';

export default function Navigation({ patient }) {
  const location = useLocation();

  const getPatientName = () => {
    if (patient?.name && patient.name[0]) {
      const name = patient.name[0];
      return `${name.given?.join(' ')} ${name.family}`;
    }
    return 'Patient';
  };

  const handleLogout = () => {
    // In a real SMART app, this would close the app or return to EHR
    if (window.confirm('Are you sure you want to logout?')) {
      window.location.href = '/';
    }
  };

  const navItems = [
    { path: '/', label: 'Dashboard', icon: Home },
    { path: '/medications', label: 'Medications', icon: Pill },
    { path: '/appointments', label: 'Appointments', icon: Calendar },
    { path: '/emergency-tracker', label: 'ED Tracker', icon: AlertTriangle }
  ];

  return (
    <nav className="bg-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <span className="text-xl font-bold text-blue-600">
              Emergency Intervention System
            </span>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex space-x-4">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <User className="h-5 w-5" />
              <span className="hidden md:inline">{getPatientName()}</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden md:inline">Logout</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden border-t border-gray-200">
          <div className="flex justify-around py-2">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex flex-col items-center gap-1 px-3 py-2 text-xs ${
                    isActive ? 'text-blue-600' : 'text-gray-600'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}