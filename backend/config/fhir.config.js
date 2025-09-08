/**
 * Configuration for connecting to a FHIR (Fast Healthcare Interoperability Resources) server.
 * The base URL should point at the FHIR API endpoint that your application will communicate with.
 */
const FHIR_BASE_URL = process.env.FHIR_BASE_URL || 'https://fhirserver.example.com';

/**
 * Returns the base URL for the FHIR server. This is separated into a function to
 * allow for future extension (e.g. injecting authentication tokens).
 */
function getFhirBaseUrl() {
  return FHIR_BASE_URL;
}

module.exports = {
  getFhirBaseUrl,
  FHIR_BASE_URL
};