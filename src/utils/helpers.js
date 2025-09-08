// src/utils/helpers.js
export const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export const formatTime = (time) => {
  if (!time) return '';
  return time;
};

export const formatDateTime = (date, time) => {
  if (!date) return '';
  const dateStr = formatDate(date);
  const timeStr = time || '';
  return `${dateStr} at ${timeStr}`;
};

export const calculateAge = (birthDate) => {
  if (!birthDate) return null;
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age;
};

export const getRiskLevelBadgeClass = (riskLevel) => {
  const colors = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-orange-100 text-orange-800',
    critical: 'bg-red-100 text-red-800'
  };
  return colors[riskLevel] || colors.low;
};

export const getStatusBadgeClass = (status) => {
  const colors = {
    scheduled: 'bg-blue-100 text-blue-800',
    confirmed: 'bg-green-100 text-green-800',
    'in-progress': 'bg-yellow-100 text-yellow-800',
    completed: 'bg-gray-100 text-gray-800',
    cancelled: 'bg-red-100 text-red-800',
    'no-show': 'bg-orange-100 text-orange-800',
    rescheduled: 'bg-purple-100 text-purple-800'
  };
  return colors[status] || colors.scheduled;
};