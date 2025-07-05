export interface Medication {
  id?: number;
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  quantity: number;
  unit: string;
}

export interface Prescription {
  id: number;
  appointmentId: number;
  patientId: number;
  doctorId: number;
  patientName: string;
  doctorName: string;
  prescriptionDate: Date;
  medications: Medication[];
  diagnosis: string;
  notes?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PrescriptionFormData {
  appointmentId: number;
  patientId: number;
  doctorId: number;
  diagnosis: string;
  notes?: string;
  medications: Medication[];
} 