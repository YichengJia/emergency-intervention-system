import { FHIR_BASE_URL } from '../utils/constants';

/**
 * A lightweight FHIR client using the Fetch API. Provides methods to read,
 * search and create resources. This can be expanded to include more FHIR
 * operations as needed.
 */
class FhirClient {
  constructor(baseUrl = FHIR_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  async read(resourceType, id) {
    const res = await fetch(`${this.baseUrl}/${resourceType}/${id}`);
    if (!res.ok) {
      throw new Error('Failed to read resource');
    }
    return res.json();
  }

  async search(resourceType, query = '') {
    const res = await fetch(`${this.baseUrl}/${resourceType}${query ? '?' + query : ''}`);
    if (!res.ok) {
      throw new Error('Failed to search resources');
    }
    return res.json();
  }

  async create(resourceType, body) {
    const res = await fetch(`${this.baseUrl}/${resourceType}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      throw new Error('Failed to create resource');
    }
    return res.json();
  }
}

export default new FhirClient();