export enum AppointmentStatus {
  SCHEDULED = 'SCHEDULED',
  CONFIRMED = 'CONFIRMED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW'
}

export enum AppointmentType {
  CONSULTATION = 'CONSULTATION',
  FOLLOW_UP = 'FOLLOW_UP',
  EMERGENCY = 'EMERGENCY',
  SURGERY = 'SURGERY',
  LAB_TEST = 'LAB_TEST',
  IMAGING = 'IMAGING'
}

export interface Appointment {
  id: number;
  patientId: number;
  doctorId: number;
  patientName: string;
  doctorName: string;
  date: Date;
  startTime: string;
  endTime: string;
  duration: number; // en minutes
  type: AppointmentType;
  status: AppointmentStatus;
  room: string;
  notes?: string;
  symptoms?: string;
  diagnosis?: string;
  prescription?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AppointmentFormData {
  patientId: number;
  doctorId: number;
  date: string;
  startTime: string;
  endTime: string;
  type: AppointmentType;
  room: string;
  notes?: string;
}

export interface AppointmentConflict {
  hasConflict: boolean;
  conflictingAppointments: Appointment[];
  message?: string;
} 