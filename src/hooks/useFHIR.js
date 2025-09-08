import { useState, useEffect, useCallback } from 'react';
import { FHIR_BASE_URL } from '../utils/constants';

/**
 * Custom hook to fetch resources from a FHIR server.
 * Accepts the resource type (e.g. 'Patient', 'Observation') and optional query params.
 */
export function useFHIR(resourceType, query = '') {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchResource = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = `${FHIR_BASE_URL}/${resourceType}${query ? '?' + query : ''}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${resourceType}`);
      }
      const json = await response.json();
      setData(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [resourceType, query]);

  useEffect(() => {
    fetchResource();
  }, [fetchResource]);

  return { data, loading, error, refetch: fetchResource };
}