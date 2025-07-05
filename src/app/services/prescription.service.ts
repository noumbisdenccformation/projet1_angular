import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay, switchMap } from 'rxjs/operators';
import { Prescription, Medication, PrescriptionFormData } from '../models/prescription.model';

@Injectable({
  providedIn: 'root'
})
export class PrescriptionService {
  private prescriptions: Prescription[] = [
    {
      id: 1,
      appointmentId: 1,
      patientId: 1,
      doctorId: 1,
      patientName: 'Marie Dubois',
      doctorName: 'Dr. Martin',
      prescriptionDate: new Date('2024-01-15'),
      diagnosis: 'Hypertension artérielle',
      notes: 'Surveillance tensionnelle recommandée',
      medications: [
        {
          id: 1,
          name: 'Amlodipine',
          dosage: '5mg',
          frequency: '1 fois par jour',
          duration: '30 jours',
          instructions: 'À prendre le matin',
          quantity: 30,
          unit: 'comprimés'
        },
        {
          id: 2,
          name: 'Lisinopril',
          dosage: '10mg',
          frequency: '1 fois par jour',
          duration: '30 jours',
          instructions: 'À prendre le soir',
          quantity: 30,
          unit: 'comprimés'
        }
      ],
      isActive: true,
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-15')
    },
    {
      id: 2,
      appointmentId: 2,
      patientId: 2,
      doctorId: 1,
      patientName: 'Pierre Martin',
      doctorName: 'Dr. Martin',
      prescriptionDate: new Date('2024-01-15'),
      diagnosis: 'Diabète de type 2',
      notes: 'Contrôle glycémique strict',
      medications: [
        {
          id: 3,
          name: 'Metformine',
          dosage: '500mg',
          frequency: '2 fois par jour',
          duration: '30 jours',
          instructions: 'À prendre avec les repas',
          quantity: 60,
          unit: 'comprimés'
        }
      ],
      isActive: true,
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-15')
    }
  ];

  private nextMedicationId = 4;

  constructor() { }

  // Récupérer toutes les prescriptions
  getPrescriptions(): Observable<Prescription[]> {
    return of([...this.prescriptions]).pipe(delay(500));
  }

  // Récupérer une prescription par ID
  getPrescriptionById(id: number): Observable<Prescription | undefined> {
    const prescription = this.prescriptions.find(p => p.id === id);
    return of(prescription).pipe(delay(300));
  }

  // Récupérer les prescriptions d'un patient
  getPrescriptionsByPatient(patientId: number): Observable<Prescription[]> {
    const patientPrescriptions = this.prescriptions.filter(p => p.patientId === patientId);
    return of(patientPrescriptions).pipe(delay(300));
  }

  // Récupérer les prescriptions d'un médecin
  getPrescriptionsByDoctor(doctorId: number): Observable<Prescription[]> {
    const doctorPrescriptions = this.prescriptions.filter(p => p.doctorId === doctorId);
    return of(doctorPrescriptions).pipe(delay(300));
  }

  // Récupérer les prescriptions actives
  getActivePrescriptions(): Observable<Prescription[]> {
    const activePrescriptions = this.prescriptions.filter(p => p.isActive);
    return of(activePrescriptions).pipe(delay(300));
  }

  // Créer une nouvelle prescription
  createPrescription(prescriptionData: PrescriptionFormData): Observable<Prescription> {
    // Vérifier si une prescription existe déjà pour ce rendez-vous
    const existingPrescription = this.prescriptions.find(p => p.appointmentId === prescriptionData.appointmentId);
    if (existingPrescription) {
      return throwError(() => new Error('Une prescription existe déjà pour ce rendez-vous'));
    }

    const newPrescription: Prescription = {
      id: this.getNextId(),
      appointmentId: prescriptionData.appointmentId,
      patientId: prescriptionData.patientId,
      doctorId: prescriptionData.doctorId,
      patientName: 'Patient à récupérer', // Sera mis à jour avec les vraies données
      doctorName: 'Médecin à récupérer', // Sera mis à jour avec les vraies données
      prescriptionDate: new Date(),
      diagnosis: prescriptionData.diagnosis,
      notes: prescriptionData.notes,
      medications: prescriptionData.medications.map((med, index) => ({
        id: this.nextMedicationId++,
        ...med
      })),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.prescriptions.push(newPrescription);
    return of(newPrescription).pipe(delay(500));
  }

  // Mettre à jour une prescription
  updatePrescription(id: number, updates: Partial<Prescription>): Observable<Prescription> {
    const index = this.prescriptions.findIndex(p => p.id === id);
    if (index === -1) {
      return throwError(() => new Error('Prescription non trouvée'));
    }

    // Mettre à jour les IDs des médicaments si de nouveaux sont ajoutés
    if (updates.medications) {
      updates.medications = updates.medications.map(med => {
        if (!med.id) {
          return { ...med, id: this.nextMedicationId++ };
        }
        return med;
      });
    }

    this.prescriptions[index] = {
      ...this.prescriptions[index],
      ...updates,
      updatedAt: new Date()
    };

    return of(this.prescriptions[index]).pipe(delay(500));
  }

  // Supprimer une prescription
  deletePrescription(id: number): Observable<boolean> {
    const index = this.prescriptions.findIndex(p => p.id === id);
    if (index === -1) {
      return throwError(() => new Error('Prescription non trouvée'));
    }

    this.prescriptions.splice(index, 1);
    return of(true).pipe(delay(300));
  }

  // Désactiver une prescription
  deactivatePrescription(id: number): Observable<Prescription> {
    return this.updatePrescription(id, { isActive: false });
  }

  // Réactiver une prescription
  reactivatePrescription(id: number): Observable<Prescription> {
    return this.updatePrescription(id, { isActive: true });
  }

  // Vérifier les interactions médicamenteuses (simulation)
  checkDrugInteractions(medications: Medication[]): Observable<{ hasInteractions: boolean; interactions: string[] }> {
    // Simulation d'une vérification d'interactions
    const interactions: string[] = [];
    
    const medicationNames = medications.map(m => m.name.toLowerCase());
    
    // Exemples d'interactions simulées
    if (medicationNames.includes('aspirine') && medicationNames.includes('ibuprofène')) {
      interactions.push('Risque d\'augmentation des effets secondaires gastro-intestinaux');
    }
    
    if (medicationNames.includes('amiodarone') && medicationNames.includes('digoxine')) {
      interactions.push('Risque d\'augmentation de la concentration de digoxine');
    }

    return of({
      hasInteractions: interactions.length > 0,
      interactions
    }).pipe(delay(200));
  }

  // Générer le prochain ID
  private getNextId(): number {
    return Math.max(...this.prescriptions.map(p => p.id)) + 1;
  }

  // Récupérer les statistiques des prescriptions
  getPrescriptionStats(): Observable<any> {
    const today = new Date();
    const todayPrescriptions = this.prescriptions.filter(p => 
      p.prescriptionDate.toDateString() === today.toDateString()
    );

    const stats = {
      total: this.prescriptions.length,
      today: todayPrescriptions.length,
      active: this.prescriptions.filter(p => p.isActive).length,
      inactive: this.prescriptions.filter(p => !p.isActive).length,
      averageMedicationsPerPrescription: this.prescriptions.length > 0 
        ? Math.round(this.prescriptions.reduce((sum, p) => sum + p.medications.length, 0) / this.prescriptions.length * 10) / 10
        : 0
    };

    return of(stats).pipe(delay(300));
  }

  // Rechercher des prescriptions
  searchPrescriptions(query: string): Observable<Prescription[]> {
    const searchTerm = query.toLowerCase();
    const results = this.prescriptions.filter(prescription =>
      prescription.patientName.toLowerCase().includes(searchTerm) ||
      prescription.doctorName.toLowerCase().includes(searchTerm) ||
      prescription.diagnosis.toLowerCase().includes(searchTerm) ||
      prescription.medications.some(med => 
        med.name.toLowerCase().includes(searchTerm)
      )
    );
    
    return of(results).pipe(delay(300));
  }
} 