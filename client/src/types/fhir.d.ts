// Basic FHIR type definitions to prevent TypeScript errors
declare module 'fhir/r4' {
  export interface Resource {
    resourceType: string;
    id?: string;
    meta?: any;
  }

  export interface Patient extends Resource {
    resourceType: 'Patient';
    name?: Array<{
      given?: string[];
      family?: string;
      text?: string;
    }>;
  }

  export interface Practitioner extends Resource {
    resourceType: 'Practitioner';
    name?: Array<{
      given?: string[];
      family?: string;
      text?: string;
    }>;
  }

  export interface Communication extends Resource {
    resourceType: 'Communication';
    subject?: {
      reference?: string;
      display?: string;
    };
    recipient?: Array<{
      reference?: string;
      display?: string;
    }>;
    payload?: Array<{
      contentString?: string;
    }>;
    sent?: string;
    status?: string;
  }
}