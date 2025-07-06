import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Appointment, AppointmentStatus, AppointmentType, AppointmentFormData } from '../../../models/appointment.model';
import { AppointmentService } from '../../../services/appointment.service';
import { PatientService } from '../../../services/patient.service';
import { AuthService } from '../../../services/auth.service';
import { Patient } from '../../../models/patient.model';
import { UserRole } from '../../../models/user.model';

@Component({
  selector: 'app-appointment-form',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './appointment-form.component.html',
  styleUrl: './appointment-form.component.css'
})
export class AppointmentFormComponent implements OnInit {
  appointmentForm: FormGroup;
  isEditMode = false;
  appointmentId: number | null = null;
  loading = false;
  submitting = false;
  
  // Options
  statusOptions = Object.values(AppointmentStatus);
  typeOptions = Object.values(AppointmentType);
  patients: Patient[] = [];
  doctors: any[] = [
    { id: 1, name: 'Dr. Martin', specialty: 'Médecine générale' },
    { id: 2, name: 'Dr. Dubois', specialty: 'Cardiologie' },
    { id: 3, name: 'Dr. Bernard', specialty: 'Dermatologie' }
  ];
  rooms = ['Salle 1', 'Salle 2', 'Salle 3', 'Salle 4', 'Salle d\'urgence'];
  
  // Validation des conflits
  hasConflict = false;
  conflictMessage = '';
  
  // Rôles
  UserRole = UserRole;

  constructor(
    private fb: FormBuilder,
    private appointmentService: AppointmentService,
    private patientService: PatientService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {
    this.appointmentForm = this.fb.group({
      patientId: ['', Validators.required],
      doctorId: ['', Validators.required],
      date: ['', Validators.required],
      startTime: ['', Validators.required],
      endTime: ['', Validators.required],
      type: ['', Validators.required],
      room: ['', Validators.required],
      notes: ['']
    });
  }

  ngOnInit(): void {
    this.loadPatients();
    this.setupFormValidation();
    this.checkEditMode();
  }

  private loadPatients(): void {
    this.loading = true;
    this.patientService.getPatients().subscribe({
      next: (patients) => {
        this.patients = patients;
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des patients:', error);
        this.snackBar.open('Erreur lors du chargement des patients', 'Fermer', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  private setupFormValidation(): void {
    // Validation de la date (pas dans le passé) - plus flexible
    this.appointmentForm.get('date')?.valueChanges.subscribe(date => {
      if (date) {
        const selectedDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        selectedDate.setHours(0, 0, 0, 0);
        
        // Permettre aujourd'hui et le futur
        if (selectedDate < today) {
          this.appointmentForm.get('date')?.setErrors({ pastDate: true });
        } else {
          // Supprimer l'erreur pastDate mais garder les autres erreurs
          const currentErrors = this.appointmentForm.get('date')?.errors;
          if (currentErrors && currentErrors['pastDate']) {
            delete currentErrors['pastDate'];
            const hasOtherErrors = Object.keys(currentErrors).length > 0;
            this.appointmentForm.get('date')?.setErrors(hasOtherErrors ? currentErrors : null);
          }
        }
      }
    });

    // Validation des heures
    this.appointmentForm.get('startTime')?.valueChanges.subscribe(() => {
      this.validateTimeRange();
    });

    this.appointmentForm.get('endTime')?.valueChanges.subscribe(() => {
      this.validateTimeRange();
    });

    // Vérification des conflits en temps réel
    this.appointmentForm.valueChanges.subscribe(() => {
      this.checkConflicts();
    });
  }

  private validateTimeRange(): void {
    const startTime = this.appointmentForm.get('startTime')?.value;
    const endTime = this.appointmentForm.get('endTime')?.value;
    
    if (startTime && endTime) {
      const start = new Date(`2000-01-01T${startTime}`);
      const end = new Date(`2000-01-01T${endTime}`);
      
      if (end <= start) {
        this.appointmentForm.get('endTime')?.setErrors({ invalidTimeRange: true });
      } else {
        this.appointmentForm.get('endTime')?.setErrors(null);
      }
    }
  }

  private checkConflicts(): void {
    if (this.appointmentForm.valid && !this.isEditMode) {
      const formData = this.appointmentForm.value;
      
      this.appointmentService.checkConflicts(formData).subscribe({
        next: (conflict) => {
          this.hasConflict = conflict.hasConflict;
          this.conflictMessage = conflict.message || '';
        },
        error: (error) => {
          console.error('Erreur lors de la vérification des conflits:', error);
        }
      });
    }
  }

  private checkEditMode(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.appointmentId = +id;
      this.loadAppointment(+id);
    }
  }

  private loadAppointment(id: number): void {
    this.loading = true;
    this.appointmentService.getAppointmentById(id).subscribe({
      next: (appointment) => {
        if (appointment) {
          this.populateForm(appointment);
        } else {
          this.snackBar.open('Rendez-vous non trouvé', 'Fermer', { duration: 3000 });
          this.router.navigate(['/appointments']);
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement du rendez-vous:', error);
        this.snackBar.open('Erreur lors du chargement du rendez-vous', 'Fermer', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  private populateForm(appointment: Appointment): void {
    this.appointmentForm.patchValue({
      patientId: appointment.patientId,
      doctorId: appointment.doctorId,
      date: appointment.date,
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      type: appointment.type,
      room: appointment.room,
      notes: appointment.notes || ''
    });
  }

  onSubmit(): void {
    if (this.isFormValid() && !this.hasConflict) {
      this.submitting = true;
      const formData: AppointmentFormData = this.appointmentForm.value;
      
      if (this.isEditMode && this.appointmentId) {
        this.updateAppointment(formData);
      } else {
        this.createAppointment(formData);
      }
    } else {
      this.markFormGroupTouched();
    }
  }

  // Validation personnalisée pour les champs essentiels
  isFormValid(): boolean {
    const requiredFields = ['patientId', 'doctorId', 'date', 'startTime', 'endTime', 'type', 'room'];
    
    const fieldsValid = requiredFields.every(field => {
      const control = this.appointmentForm.get(field);
      const value = control?.value;
      
      if (!value) return false;
      if (value === '') return false;
      if (value === null || value === undefined) return false;
      
      return true;
    });
    
    return fieldsValid && this.isDateValid() && this.isTimeRangeValid();
  }

  private isDateValid(): boolean {
    const dateControl = this.appointmentForm.get('date');
    if (!dateControl || !dateControl.value) return false;
    
    const selectedDate = new Date(dateControl.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);
    
    return selectedDate >= today;
  }

  private isTimeRangeValid(): boolean {
    const startTime = this.appointmentForm.get('startTime')?.value;
    const endTime = this.appointmentForm.get('endTime')?.value;
    
    if (!startTime || !endTime) return false;
    
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    
    return end > start;
  }

  private createAppointment(formData: AppointmentFormData): void {
    this.appointmentService.createAppointment(formData).subscribe({
      next: () => {
        this.snackBar.open('Rendez-vous créé avec succès', 'Fermer', { duration: 3000 });
        this.router.navigate(['/appointments']);
      },
      error: (error) => {
        console.error('Erreur lors de la création:', error);
        this.snackBar.open(error.message || 'Erreur lors de la création', 'Fermer', { duration: 3000 });
        this.submitting = false;
      }
    });
  }

  private updateAppointment(formData: AppointmentFormData): void {
    if (this.appointmentId) {
      const updates = {
        ...formData,
        date: new Date(formData.date)
      };
      this.appointmentService.updateAppointment(this.appointmentId, updates).subscribe({
        next: () => {
          this.snackBar.open('Rendez-vous mis à jour avec succès', 'Fermer', { duration: 3000 });
          this.router.navigate(['/appointments']);
        },
        error: (error) => {
          console.error('Erreur lors de la mise à jour:', error);
          this.snackBar.open(error.message || 'Erreur lors de la mise à jour', 'Fermer', { duration: 3000 });
          this.submitting = false;
        }
      });
    }
  }

  onCancel(): void {
    this.router.navigate(['/appointments']);
  }

  private markFormGroupTouched(): void {
    Object.keys(this.appointmentForm.controls).forEach(key => {
      const control = this.appointmentForm.get(key);
      control?.markAsTouched();
    });
  }

  getErrorMessage(controlName: string): string {
    const control = this.appointmentForm.get(controlName);
    
    if (control?.hasError('required')) {
      return 'Ce champ est requis';
    }
    
    if (control?.hasError('pastDate')) {
      return 'La date ne peut pas être dans le passé';
    }
    
    if (control?.hasError('invalidTimeRange')) {
      return 'L\'heure de fin doit être après l\'heure de début';
    }
    
    return '';
  }

  getTypeDisplayName(type: AppointmentType): string {
    switch (type) {
      case AppointmentType.CONSULTATION:
        return 'Consultation';
      case AppointmentType.FOLLOW_UP:
        return 'Suivi';
      case AppointmentType.EMERGENCY:
        return 'Urgence';
      case AppointmentType.SURGERY:
        return 'Chirurgie';
      case AppointmentType.LAB_TEST:
        return 'Analyse';
      case AppointmentType.IMAGING:
        return 'Imagerie';
      default:
        return type;
    }
  }

  getPatientDisplayName(patient: Patient): string {
    return `${patient.firstName} ${patient.lastName} (${patient.fileNumber})`;
  }

  getDoctorDisplayName(doctor: any): string {
    return `${doctor.name} - ${doctor.specialty}`;
  }

  getSelectedPatientName(): string {
    const patientId = this.appointmentForm.get('patientId')?.value;
    const patient = this.patients.find(p => p.id == patientId);
    return patient ? `${patient.firstName} ${patient.lastName}` : '';
  }

  getSelectedDoctorName(): string {
    const doctorId = this.appointmentForm.get('doctorId')?.value;
    const doctor = this.doctors.find(d => d.id == doctorId);
    return doctor ? doctor.name : '';
  }

  getSelectedDate(): string {
    const date = this.appointmentForm.get('date')?.value;
    return date ? new Date(date).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '';
  }

  getSelectedTimeRange(): string {
    const startTime = this.appointmentForm.get('startTime')?.value;
    const endTime = this.appointmentForm.get('endTime')?.value;
    return startTime && endTime ? `${startTime} - ${endTime}` : '';
  }

  getSelectedTypeDisplay(): string {
    const type = this.appointmentForm.get('type')?.value;
    return type ? this.getTypeDisplayName(type) : '';
  }

  getSelectedRoom(): string {
    return this.appointmentForm.get('room')?.value || '';
  }
}
