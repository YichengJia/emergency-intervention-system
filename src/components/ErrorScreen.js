import React from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

export default function ErrorScreen({ error }) {
  const handleRefresh = () => {
    window.location.reload();
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <div className="flex flex-col items-center text-center">
          <div className="bg-red-100 rounded-full p-3 mb-4">
            <AlertCircle className="h-12 w-12 text-red-600" />
          </div>

          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Connection Error
          </h1>

          <p className="text-gray-600 mb-6">
            {error || 'Unable to connect to the health record system. Please try again.'}
          </p>

          <div className="flex gap-4">
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </button>

            <button
              onClick={handleGoHome}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Home className="h-4 w-4" />
              Go Home
            </button>
          </div>

          <div className="mt-8 p-4 bg-gray-50 rounded-lg w-full">
            <p className="text-sm text-gray-600 mb-2">
              <strong>Troubleshooting Tips:</strong>
            </p>
            <ul className="text-sm text-gray-500 text-left space-y-1">
              <li>• Ensure you launched the app from your EHR system</li>
              <li>• Check your internet connection</li>
              <li>• Try clearing your browser cache</li>
              <li>• Contact IT support if the problem persists</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}