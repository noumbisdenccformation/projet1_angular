import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PatientService } from '../../../services/patient.service';
import { AppointmentService } from '../../../services/appointment.service';
import { PrescriptionService } from '../../../services/prescription.service';
import { AuthService } from '../../../services/auth.service';
import { Patient } from '../../../models/patient.model';
import { Appointment } from '../../../models/appointment.model';
import { Prescription } from '../../../models/prescription.model';
import { UserRole } from '../../../models/user.model';

@Component({
  selector: 'app-patient-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTabsModule,
    MatTableModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './patient-detail.component.html',
  styleUrl: './patient-detail.component.css'
})
export class PatientDetailComponent implements OnInit {
  patient: Patient | null = null;
  appointments: Appointment[] = [];
  prescriptions: Prescription[] = [];
  loading = true;
  patientId: number;

  // Colonnes des tableaux
  appointmentColumns = ['date', 'time', 'doctor', 'type', 'status', 'actions'];
  prescriptionColumns = ['date', 'doctor', 'diagnosis', 'medications', 'actions'];

  UserRole = UserRole;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private patientService: PatientService,
    private appointmentService: AppointmentService,
    private prescriptionService: PrescriptionService,
    public authService: AuthService,
    private snackBar: MatSnackBar
  ) {
    this.patientId = +this.route.snapshot.paramMap.get('id')!;
  }

  ngOnInit(): void {
    this.loadPatientData();
  }

  private loadPatientData(): void {
    this.loading = true;
    
    // Charger les données du patient
    this.patientService.getPatientById(this.patientId).subscribe({
      next: (patient) => {
        if (patient) {
          this.patient = patient;
          this.loadAppointments();
          this.loadPrescriptions();
        } else {
          this.snackBar.open('Patient non trouvé', 'Fermer', { duration: 3000 });
          this.router.navigate(['/patients']);
        }
      },
      error: (error) => {
        console.error('Erreur lors du chargement du patient:', error);
        this.snackBar.open('Erreur lors du chargement du patient', 'Fermer', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  private loadAppointments(): void {
    this.appointmentService.getAppointmentsByPatient(this.patientId).subscribe({
      next: (appointments) => {
        this.appointments = appointments.sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        this.checkLoadingComplete();
      },
      error: (error) => {
        console.error('Erreur lors du chargement des rendez-vous:', error);
        this.checkLoadingComplete();
      }
    });
  }

  private loadPrescriptions(): void {
    this.prescriptionService.getPrescriptionsByPatient(this.patientId).subscribe({
      next: (prescriptions) => {
        this.prescriptions = prescriptions.sort((a, b) => 
          new Date(b.prescriptionDate).getTime() - new Date(a.prescriptionDate).getTime()
        );
        this.checkLoadingComplete();
      },
      error: (error) => {
        console.error('Erreur lors du chargement des prescriptions:', error);
        this.checkLoadingComplete();
      }
    });
  }

  private checkLoadingComplete(): void {
    // Vérifier si toutes les données sont chargées
    if (this.patient && this.appointments !== undefined && this.prescriptions !== undefined) {
      this.loading = false;
    }
  }

  getAge(): number {
    if (!this.patient) return 0;
    const today = new Date();
    const birthDate = new Date(this.patient.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  getGenderDisplay(): string {
    if (!this.patient) return '';
    switch (this.patient.gender) {
      case 'MALE': return 'Homme';
      case 'FEMALE': return 'Femme';
      case 'OTHER': return 'Autre';
      default: return this.patient.gender;
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'CONFIRMED': return 'bg-green-100 text-green-800';
      case 'SCHEDULED': return 'bg-blue-100 text-blue-800';
      case 'IN_PROGRESS': return 'bg-orange-100 text-orange-800';
      case 'COMPLETED': return 'bg-purple-100 text-purple-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      case 'NO_SHOW': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getStatusDisplay(status: string): string {
    switch (status) {
      case 'CONFIRMED': return 'Confirmé';
      case 'SCHEDULED': return 'Programmé';
      case 'IN_PROGRESS': return 'En cours';
      case 'COMPLETED': return 'Terminé';
      case 'CANCELLED': return 'Annulé';
      case 'NO_SHOW': return 'Absent';
      default: return status;
    }
  }

  getTypeDisplay(type: string): string {
    switch (type) {
      case 'CONSULTATION': return 'Consultation';
      case 'FOLLOW_UP': return 'Suivi';
      case 'EMERGENCY': return 'Urgence';
      case 'SURGERY': return 'Chirurgie';
      case 'LAB_TEST': return 'Analyse';
      case 'IMAGING': return 'Imagerie';
      default: return type;
    }
  }

  onEdit(): void {
    this.router.navigate(['/patients', this.patientId, 'edit']);
  }

  onNewAppointment(): void {
    this.router.navigate(['/appointments/new'], {
      queryParams: { patientId: this.patientId }
    });
  }

  onNewPrescription(): void {
    this.router.navigate(['/prescriptions/new'], {
      queryParams: { patientId: this.patientId }
    });
  }

  onViewAppointment(appointmentId: number): void {
    this.router.navigate(['/appointments', appointmentId]);
  }

  onViewPrescription(prescriptionId: number): void {
    this.router.navigate(['/prescriptions', prescriptionId]);
  }

  getMedicationsSummary(prescription: Prescription): string {
    return prescription.medications.map(med => med.name).join(', ');
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('fr-FR');
  }

  formatTime(time: string): string {
    return time.substring(0, 5);
  }
}