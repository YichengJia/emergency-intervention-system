// src/hooks/useFHIR.js
import { useState, useEffect } from 'react';
import { fhirService } from '../services/api';

export const useFHIR = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const authorize = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fhirService.authorize();
      setIsConnected(result.authorized);
      return result;
    } catch (err) {
      setError(err.message);
      setIsConnected(false);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getPatient = async (patientId) => {
    if (!isConnected) {
      throw new Error('FHIR client not connected');
    }
    return fhirService.getPatient(patientId);
  };

  const getObservations = async (patientId, code) => {
    if (!isConnected) {
      throw new Error('FHIR client not connected');
    }
    return fhirService.getObservations(patientId, code);
  };

  return {
    isConnected,
    loading,
    error,
    authorize,
    getPatient,
    getObservations
  };
};