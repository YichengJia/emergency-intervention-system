// backend/config/fhir.config.js
// FHIR Server Configuration
const fhirConfig = {
  serverUrl: process.env.FHIR_SERVER_URL || 'https://fhir.example.com',
  version: 'R4',

  // SMART on FHIR OAuth2 settings
  oauth: {
    clientId: process.env.SMART_CLIENT_ID,
    clientSecret: process.env.SMART_CLIENT_SECRET,
    redirectUri: process.env.SMART_REDIRECT_URI,
    scope: 'patient/Patient.read patient/Observation.read patient/MedicationRequest.read patient/Appointment.read launch',
    responseType: 'code',
    grantType: 'authorization_code'
  },

  // Resource mappings
  resourceMappings: {
    Patient: {
      fromInternal: (internalPatient) => ({
        resourceType: 'Patient',
        id: internalPatient._id.toString(),
        identifier: [{
          system: 'http://emergency-intervention.example.com/mrn',
          value: internalPatient.medicalRecordNumber
        }],
        name: [{
          use: 'official',
          text: internalPatient.userId.name,
          given: [internalPatient.userId.name.split(' ')[0]],
          family: internalPatient.userId.name.split(' ').slice(1).join(' ')
        }],
        gender: internalPatient.userId.profile?.gender || 'unknown',
        birthDate: internalPatient.userId.profile?.birthDate,
        telecom: [
          {
            system: 'email',
            value: internalPatient.userId.email,
            use: 'home'
          },
          {
            system: 'phone',
            value: internalPatient.userId.profile?.phone,
            use: 'mobile'
          }
        ],
        address: internalPatient.userId.profile?.address ? [{
          use: 'home',
          line: [internalPatient.userId.profile.address.street],
          city: internalPatient.userId.profile.address.city,
          state: internalPatient.userId.profile.address.state,
          postalCode: internalPatient.userId.profile.address.zipCode,
          country: internalPatient.userId.profile.address.country
        }] : []
      }),

      toInternal: (fhirPatient) => ({
        medicalRecordNumber: fhirPatient.identifier?.[0]?.value,
        // Map other fields as needed
      })
    },

    Observation: {
      fromInternal: (vital) => ({
        resourceType: 'Observation',
        id: vital._id?.toString(),
        status: 'final',
        category: [{
          coding: [{
            system: 'http://terminology.hl7.org/CodeSystem/observation-category',
            code: 'vital-signs',
            display: 'Vital Signs'
          }]
        }],
        effectiveDateTime: vital.recordedAt,
        component: [
          vital.bloodPressure && {
            code: {
              coding: [{
                system: 'http://loinc.org',
                code: '85354-9',
                display: 'Blood pressure'
              }]
            },
            component: [
              {
                code: {
                  coding: [{
                    system: 'http://loinc.org',
                    code: '8480-6',
                    display: 'Systolic blood pressure'
                  }]
                },
                valueQuantity: {
                  value: vital.bloodPressure.systolic,
                  unit: 'mmHg',
                  system: 'http://unitsofmeasure.org',
                  code: 'mm[Hg]'
                }
              },
              {
                code: {
                  coding: [{
                    system: 'http://loinc.org',
                    code: '8462-4',
                    display: 'Diastolic blood pressure'
                  }]
                },
                valueQuantity: {
                  value: vital.bloodPressure.diastolic,
                  unit: 'mmHg',
                  system: 'http://unitsofmeasure.org',
                  code: 'mm[Hg]'
                }
              }
            ]
          },
          vital.heartRate && {
            code: {
              coding: [{
                system: 'http://loinc.org',
                code: '8867-4',
                display: 'Heart rate'
              }]
            },
            valueQuantity: {
              value: vital.heartRate,
              unit: 'beats/minute',
              system: 'http://unitsofmeasure.org',
              code: '/min'
            }
          }
        ].filter(Boolean)
      })
    },

    MedicationRequest: {
      fromInternal: (medication) => ({
        resourceType: 'MedicationRequest',
        id: medication._id?.toString(),
        status: medication.isActive ? 'active' : 'stopped',
        intent: 'order',
        medicationCodeableConcept: {
          text: medication.name
        },
        subject: {
          reference: `Patient/${medication.patientId}`
        },
        authoredOn: medication.startDate,
        requester: {
          reference: `Practitioner/${medication.prescribedBy}`
        },
        dosageInstruction: [{
          text: `${medication.dosage} ${medication.frequency}`,
          timing: {
            repeat: {
              frequency: 1,
              period: 1,
              periodUnit: 'd'
            }
          },
          route: {
            coding: [{
              system: 'http://snomed.info/sct',
              code: medication.route === 'oral' ? '26643006' : '78421000',
              display: medication.route
            }]
          }
        }]
      })
    },

    Appointment: {
      fromInternal: (appointment) => ({
        resourceType: 'Appointment',
        id: appointment._id.toString(),
        status: appointment.status,
        serviceType: [{
          coding: [{
            display: appointment.type
          }]
        }],
        priority: appointment.priority === 'urgent' ? 1 :
                  appointment.priority === 'high' ? 2 :
                  appointment.priority === 'normal' ? 3 : 4,
        start: new Date(`${appointment.date.toISOString().split('T')[0]}T${appointment.startTime}`).toISOString(),
        end: new Date(`${appointment.date.toISOString().split('T')[0]}T${appointment.endTime}`).toISOString(),
        participant: [
          {
            actor: {
              reference: `Patient/${appointment.patientId}`,
              display: 'Patient'
            },
            required: 'required',
            status: 'accepted'
          },
          {
            actor: {
              reference: `Practitioner/${appointment.doctorId}`,
              display: 'Doctor'
            },
            required: 'required',
            status: 'accepted'
          }
        ]
      })
    }
  },

  // Error handling
  handleError: (error) => {
    console.error('FHIR Error:', error);
    return {
      resourceType: 'OperationOutcome',
      issue: [{
        severity: 'error',
        code: 'processing',
        diagnostics: error.message
      }]
    };
  }
};

module.exports = fhirConfig;