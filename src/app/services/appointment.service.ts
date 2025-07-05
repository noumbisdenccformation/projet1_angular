import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay, switchMap } from 'rxjs/operators';
import { Appointment, AppointmentStatus, AppointmentType, AppointmentFormData, AppointmentConflict } from '../models/appointment.model';

@Injectable({
  providedIn: 'root'
})
export class AppointmentService {
  private appointments: Appointment[] = [
    {
      id: 1,
      patientId: 1,
      doctorId: 1,
      patientName: 'Marie Dubois',
      doctorName: 'Dr. Martin',
      date: new Date('2024-01-15'),
      startTime: '09:00',
      endTime: '09:30',
      duration: 30,
      type: AppointmentType.CONSULTATION,
      status: AppointmentStatus.CONFIRMED,
      room: 'Salle 1',
      notes: 'Première consultation',
      createdAt: new Date('2024-01-10'),
      updatedAt: new Date('2024-01-10')
    },
    {
      id: 2,
      patientId: 2,
      doctorId: 1,
      patientName: 'Pierre Martin',
      doctorName: 'Dr. Martin',
      date: new Date('2024-01-15'),
      startTime: '10:00',
      endTime: '10:30',
      duration: 30,
      type: AppointmentType.FOLLOW_UP,
      status: AppointmentStatus.SCHEDULED,
      room: 'Salle 1',
      notes: 'Suivi post-opératoire',
      createdAt: new Date('2024-01-12'),
      updatedAt: new Date('2024-01-12')
    },
    {
      id: 3,
      patientId: 3,
      doctorId: 2,
      patientName: 'Sophie Bernard',
      doctorName: 'Dr. Dubois',
      date: new Date('2024-01-15'),
      startTime: '14:00',
      endTime: '15:00',
      duration: 60,
      type: AppointmentType.CONSULTATION,
      status: AppointmentStatus.SCHEDULED,
      room: 'Salle 2',
      notes: 'Consultation spécialisée',
      createdAt: new Date('2024-01-13'),
      updatedAt: new Date('2024-01-13')
    }
  ];

  constructor() { }

  // Récupérer tous les rendez-vous
  getAppointments(): Observable<Appointment[]> {
    return of([...this.appointments]).pipe(delay(500));
  }

  // Récupérer un rendez-vous par ID
  getAppointmentById(id: number): Observable<Appointment | undefined> {
    const appointment = this.appointments.find(a => a.id === id);
    return of(appointment).pipe(delay(300));
  }

  // Récupérer les rendez-vous d'un médecin
  getAppointmentsByDoctor(doctorId: number): Observable<Appointment[]> {
    const doctorAppointments = this.appointments.filter(a => a.doctorId === doctorId);
    return of(doctorAppointments).pipe(delay(300));
  }

  // Récupérer les rendez-vous d'un patient
  getAppointmentsByPatient(patientId: number): Observable<Appointment[]> {
    const patientAppointments = this.appointments.filter(a => a.patientId === patientId);
    return of(patientAppointments).pipe(delay(300));
  }

  // Récupérer les rendez-vous pour une date donnée
  getAppointmentsByDate(date: Date): Observable<Appointment[]> {
    const dateAppointments = this.appointments.filter(a => 
      a.date.toDateString() === date.toDateString()
    );
    return of(dateAppointments).pipe(delay(300));
  }

  // Créer un nouveau rendez-vous
  createAppointment(appointmentData: AppointmentFormData): Observable<Appointment> {
    return this.checkConflicts(appointmentData).pipe(
      switchMap(conflict => {
        if (conflict.hasConflict) {
          return throwError(() => new Error(conflict.message || 'Conflit de rendez-vous détecté'));
        }
        
        const newAppointment: Appointment = {
          id: this.getNextId(),
          patientId: appointmentData.patientId,
          doctorId: appointmentData.doctorId,
          patientName: 'Patient à récupérer',
          doctorName: 'Médecin à récupérer',
          date: new Date(appointmentData.date),
          startTime: appointmentData.startTime,
          endTime: appointmentData.endTime,
          duration: this.calculateDuration(appointmentData.startTime, appointmentData.endTime),
          type: appointmentData.type,
          status: AppointmentStatus.SCHEDULED,
          room: appointmentData.room,
          notes: appointmentData.notes,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        this.appointments.push(newAppointment);
        return of(newAppointment);
      })
    );
  }

  // Mettre à jour un rendez-vous
  updateAppointment(id: number, updates: Partial<Appointment>): Observable<Appointment> {
    const index = this.appointments.findIndex(a => a.id === id);
    if (index === -1) {
      return throwError(() => new Error('Rendez-vous non trouvé'));
    }

    // Vérifier les conflits si la date/heure change
    if (updates.date || updates.startTime || updates.endTime) {
      const appointment = this.appointments[index];
      const formData: AppointmentFormData = {
        patientId: appointment.patientId,
        doctorId: appointment.doctorId,
        date: updates.date ? updates.date.toISOString().split('T')[0] : appointment.date.toISOString().split('T')[0],
        startTime: updates.startTime || appointment.startTime,
        endTime: updates.endTime || appointment.endTime,
        type: appointment.type,
        room: appointment.room,
        notes: appointment.notes
      };
      
      return this.checkConflicts(formData, id).pipe(
        switchMap(conflict => {
          if (conflict.hasConflict) {
            return throwError(() => new Error(conflict.message || 'Conflit de rendez-vous détecté'));
          }
          
          this.appointments[index] = {
            ...this.appointments[index],
            ...updates,
            updatedAt: new Date()
          };

          return of(this.appointments[index]);
        })
      );
    }

    this.appointments[index] = {
      ...this.appointments[index],
      ...updates,
      updatedAt: new Date()
    };

    return of(this.appointments[index]).pipe(delay(500));
  }

  // Supprimer un rendez-vous
  deleteAppointment(id: number): Observable<boolean> {
    const index = this.appointments.findIndex(a => a.id === id);
    if (index === -1) {
      return throwError(() => new Error('Rendez-vous non trouvé'));
    }

    // Vérifier le délai de prévenance (24h avant)
    const appointment = this.appointments[index];
    const appointmentDate = new Date(appointment.date);
    const now = new Date();
    const timeDiff = appointmentDate.getTime() - now.getTime();
    const hoursDiff = timeDiff / (1000 * 3600);

    if (hoursDiff < 24) {
      return throwError(() => new Error('Impossible d\'annuler un rendez-vous moins de 24h à l\'avance'));
    }

    this.appointments.splice(index, 1);
    return of(true).pipe(delay(300));
  }

  // Vérifier les conflits de rendez-vous
  checkConflicts(appointmentData: AppointmentFormData, excludeId?: number): Observable<AppointmentConflict> {
    const { doctorId, date, startTime, endTime } = appointmentData;
    
    // Récupérer tous les rendez-vous du médecin pour cette date
    const doctorAppointments = this.appointments.filter(a => 
      a.doctorId === doctorId && 
      a.date.toDateString() === new Date(date).toDateString() &&
      a.id !== excludeId
    );

    // Vérifier les chevauchements
    const conflicts = doctorAppointments.filter(existing => {
      return this.timesOverlap(
        startTime, endTime,
        existing.startTime, existing.endTime
      );
    });

    const result: AppointmentConflict = conflicts.length > 0 ? {
      hasConflict: true,
      conflictingAppointments: conflicts,
      message: `Conflit détecté avec ${conflicts.length} rendez-vous existant(s)`
    } : {
      hasConflict: false,
      conflictingAppointments: []
    };

    return of(result).pipe(delay(300));
  }

  // Vérifier si un patient a déjà un rendez-vous le même jour
  checkPatientConflict(patientId: number, date: Date, excludeId?: number): boolean {
    return this.appointments.some(a => 
      a.patientId === patientId && 
      a.date.toDateString() === date.toDateString() &&
      a.id !== excludeId
    );
  }

  // Calculer la durée en minutes
  private calculateDuration(startTime: string, endTime: string): number {
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    return Math.round((end.getTime() - start.getTime()) / (1000 * 60));
  }

  // Vérifier si deux plages horaires se chevauchent
  private timesOverlap(start1: string, end1: string, start2: string, end2: string): boolean {
    const s1 = new Date(`2000-01-01T${start1}`);
    const e1 = new Date(`2000-01-01T${end1}`);
    const s2 = new Date(`2000-01-01T${start2}`);
    const e2 = new Date(`2000-01-01T${end2}`);

    return s1 < e2 && s2 < e1;
  }

  // Générer le prochain ID
  private getNextId(): number {
    return Math.max(...this.appointments.map(a => a.id)) + 1;
  }

  // Récupérer les statistiques des rendez-vous
  getAppointmentStats(): Observable<any> {
    const today = new Date();
    const todayAppointments = this.appointments.filter(a => 
      a.date.toDateString() === today.toDateString()
    );

    const stats = {
      total: this.appointments.length,
      today: todayAppointments.length,
      confirmed: this.appointments.filter(a => a.status === AppointmentStatus.CONFIRMED).length,
      pending: this.appointments.filter(a => a.status === AppointmentStatus.SCHEDULED).length,
      cancelled: this.appointments.filter(a => a.status === AppointmentStatus.CANCELLED).length
    };

    return of(stats).pipe(delay(300));
  }
} 