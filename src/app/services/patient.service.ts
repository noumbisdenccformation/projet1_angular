import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Patient, PatientFormData } from '../models/patient.model';

@Injectable({
  providedIn: 'root'
})
export class PatientService {
  private patients: Patient[] = [
    {
      id: 1,
      fileNumber: 'P001',
      firstName: 'Marie',
      lastName: 'Dubois',
      dateOfBirth: new Date('1985-03-15'),
      gender: 'FEMALE',
      phone: '0123456789',
      email: 'marie.dubois@email.com',
      address: '123 Rue de la Paix',
      city: 'Paris',
      postalCode: '75001',
      emergencyContact: {
        name: 'Jean Dubois',
        phone: '0987654321',
        relationship: 'Époux'
      },
      medicalHistory: {
        allergies: ['Pénicilline'],
        chronicDiseases: ['Hypertension'],
        surgeries: ['Appendicectomie 2010'],
        medications: ['Amlodipine 5mg']
      },
      insuranceInfo: {
        provider: 'CPAM',
        policyNumber: '123456789',
        groupNumber: '001'
      },
      assignedDoctorId: 1,
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-15')
    },
    {
      id: 2,
      fileNumber: 'P002',
      firstName: 'Pierre',
      lastName: 'Martin',
      dateOfBirth: new Date('1978-07-22'),
      gender: 'MALE',
      phone: '0123456790',
      email: 'pierre.martin@email.com',
      address: '456 Avenue des Champs',
      city: 'Lyon',
      postalCode: '69001',
      emergencyContact: {
        name: 'Sophie Martin',
        phone: '0987654322',
        relationship: 'Épouse'
      },
      medicalHistory: {
        allergies: [],
        chronicDiseases: ['Diabète Type 2'],
        surgeries: [],
        medications: ['Metformine 500mg']
      },
      assignedDoctorId: 2,
      createdAt: new Date('2024-01-20'),
      updatedAt: new Date('2024-01-20')
    }
  ];

  constructor() {}

  getPatients(): Observable<Patient[]> {
    return of([...this.patients]);
  }

  getPatientById(id: number): Observable<Patient | undefined> {
    const patient = this.patients.find(p => p.id === id);
    return of(patient);
  }

  createPatient(patientData: PatientFormData): Observable<Patient> {
    const newPatient: Patient = {
      id: this.generateId(),
      fileNumber: this.generateFileNumber(),
      firstName: patientData.firstName,
      lastName: patientData.lastName,
      dateOfBirth: new Date(patientData.dateOfBirth),
      gender: patientData.gender,
      phone: patientData.phone,
      email: patientData.email,
      address: patientData.address,
      city: patientData.city,
      postalCode: patientData.postalCode,
      emergencyContact: {
        name: patientData.emergencyContactName,
        phone: patientData.emergencyContactPhone,
        relationship: patientData.emergencyContactRelationship
      },
      medicalHistory: {
        allergies: patientData.allergies,
        chronicDiseases: patientData.chronicDiseases,
        surgeries: patientData.surgeries,
        medications: patientData.medications
      },
      insuranceInfo: patientData.insuranceProvider ? {
        provider: patientData.insuranceProvider,
        policyNumber: patientData.insurancePolicyNumber || '',
        groupNumber: patientData.insuranceGroupNumber
      } : undefined,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.patients.push(newPatient);
    return of(newPatient);
  }

  updatePatient(id: number, patientData: PatientFormData): Observable<Patient | null> {
    const index = this.patients.findIndex(p => p.id === id);
    if (index === -1) {
      return of(null);
    }

    const updatedPatient: Patient = {
      ...this.patients[index],
      firstName: patientData.firstName,
      lastName: patientData.lastName,
      dateOfBirth: new Date(patientData.dateOfBirth),
      gender: patientData.gender,
      phone: patientData.phone,
      email: patientData.email,
      address: patientData.address,
      city: patientData.city,
      postalCode: patientData.postalCode,
      emergencyContact: {
        name: patientData.emergencyContactName,
        phone: patientData.emergencyContactPhone,
        relationship: patientData.emergencyContactRelationship
      },
      medicalHistory: {
        allergies: patientData.allergies,
        chronicDiseases: patientData.chronicDiseases,
        surgeries: patientData.surgeries,
        medications: patientData.medications
      },
      insuranceInfo: patientData.insuranceProvider ? {
        provider: patientData.insuranceProvider,
        policyNumber: patientData.insurancePolicyNumber || '',
        groupNumber: patientData.insuranceGroupNumber
      } : undefined,
      updatedAt: new Date()
    };

    this.patients[index] = updatedPatient;
    return of(updatedPatient);
  }

  deletePatient(id: number): Observable<boolean> {
    const index = this.patients.findIndex(p => p.id === id);
    if (index === -1) {
      return of(false);
    }

    this.patients.splice(index, 1);
    return of(true);
  }

  searchPatients(query: string): Observable<Patient[]> {
    const filtered = this.patients.filter(patient =>
      patient.firstName.toLowerCase().includes(query.toLowerCase()) ||
      patient.lastName.toLowerCase().includes(query.toLowerCase()) ||
      patient.fileNumber.includes(query) ||
      patient.phone.includes(query)
    );
    return of(filtered);
  }

  getPatientsByDoctor(doctorId: number): Observable<Patient[]> {
    const filtered = this.patients.filter(patient => patient.assignedDoctorId === doctorId);
    return of(filtered);
  }

  private generateId(): number {
    return Math.max(...this.patients.map(p => p.id), 0) + 1;
  }

  private generateFileNumber(): string {
    const nextId = this.generateId();
    return `P${nextId.toString().padStart(3, '0')}`;
  }
} 