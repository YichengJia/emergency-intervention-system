import React from 'react';

export default function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-sm w-full">
        <div className="flex flex-col items-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200"></div>
            <div className="absolute top-0 animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent"></div>
          </div>
          <h2 className="mt-6 text-xl font-semibold text-gray-800">
            Loading Patient Data
          </h2>
          <p className="mt-2 text-sm text-gray-600 text-center">
            Connecting to your health records...
          </p>
        </div>
      </div>
    </div>
  );
}