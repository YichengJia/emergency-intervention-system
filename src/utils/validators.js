// src/utils/validators.js
export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validatePassword = (password) => {
  // At least 6 characters, one letter and one number
  const re = /^(?=.*[A-Za-z])(?=.*\d).{6,}$/;
  return re.test(password);
};

export const validatePhone = (phone) => {
  const re = /^[\d\s\-\(\)\+]+$/;
  return re.test(phone);
};

export const validateRequired = (value) => {
  return value !== null && value !== undefined && value !== '';
};

export const validateAge = (age) => {
  return age >= 0 && age <= 150;
};

export const validateBloodPressure = (systolic, diastolic) => {
  return (
    systolic >= 60 && systolic <= 250 &&
    diastolic >= 40 && diastolic <= 150 &&
    systolic > diastolic
  );
};

export const validateHeartRate = (rate) => {
  return rate >= 30 && rate <= 250;
};

export const validateOxygenSaturation = (saturation) => {
  return saturation >= 50 && saturation <= 100;
};