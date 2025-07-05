export interface Patient {
  id: number;
  fileNumber: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  phone: string;
  email?: string;
  address: string;
  city: string;
  postalCode: string;
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  medicalHistory: {
    allergies: string[];
    chronicDiseases: string[];
    surgeries: string[];
    medications: string[];
  };
  insuranceInfo?: {
    provider: string;
    policyNumber: string;
    groupNumber?: string;
  };
  assignedDoctorId?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PatientFormData {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  phone: string;
  email?: string;
  address: string;
  city: string;
  postalCode: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelationship: string;
  allergies: string[];
  chronicDiseases: string[];
  surgeries: string[];
  medications: string[];
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
  insuranceGroupNumber?: string;
} 