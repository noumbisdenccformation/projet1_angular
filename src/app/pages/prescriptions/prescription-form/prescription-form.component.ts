import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { Subject, takeUntil, switchMap } from 'rxjs';
import { PrescriptionService } from '../../../services/prescription.service';
import { AppointmentService } from '../../../services/appointment.service';
import { PatientService } from '../../../services/patient.service';
import { AuthService } from '../../../services/auth.service';
import { Prescription, PrescriptionFormData, Medication } from '../../../models/prescription.model';
import { Appointment } from '../../../models/appointment.model';
import { Patient } from '../../../models/patient.model';

@Component({
  selector: 'app-prescription-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './prescription-form.component.html',
  styleUrls: ['./prescription-form.component.css']
})
export class PrescriptionFormComponent implements OnInit, OnDestroy {
  prescriptionForm!: FormGroup;
  loading = false;
  saving = false;
  error = '';
  success = '';
  
  // Mode édition ou création
  isEditMode = false;
  prescriptionId?: number;
  
  // Données pour les sélecteurs
  appointments: Appointment[] = [];
  patients: Patient[] = [];
  doctors: any[] = [];
  
  // Vérification des interactions
  checkingInteractions = false;
  interactions: string[] = [];
  hasInteractions = false;
  
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private prescriptionService: PrescriptionService,
    private appointmentService: AppointmentService,
    private patientService: PatientService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.loadInitialData();
    this.setupRouteParams();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.prescriptionForm = this.fb.group({
      appointmentId: ['', Validators.required],
      patientId: ['', Validators.required],
      doctorId: ['', Validators.required],
      diagnosis: ['', [Validators.required, Validators.minLength(10)]],
      notes: [''],
      medications: this.fb.array([])
    });

    // Ajouter un premier médicament par défaut
    this.addMedication();
  }

  private setupRouteParams(): void {
    this.route.params.pipe(
      takeUntil(this.destroy$),
      switchMap(params => {
        const id = params['id'];
        if (id && id !== 'new') {
          this.isEditMode = true;
          this.prescriptionId = +id;
          return this.prescriptionService.getPrescriptionById(this.prescriptionId);
        }
        return [];
      })
    ).subscribe(prescription => {
      if (prescription) {
        this.loadPrescriptionData(prescription);
      }
    });
  }

  private loadInitialData(): void {
    this.loading = true;

    // Charger les rendez-vous
    this.appointmentService.getAppointments()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (appointments) => {
          this.appointments = appointments;
        },
        error: (error) => {
          this.error = 'Erreur lors du chargement des rendez-vous: ' + error.message;
        }
      });

    // Charger les patients
    this.patientService.getPatients()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (patients) => {
          this.patients = patients;
        },
        error: (error) => {
          this.error = 'Erreur lors du chargement des patients: ' + error.message;
        }
      });

    // Charger les médecins (simulation)
    this.doctors = [
      { id: 1, name: 'Dr. Martin', specialty: 'Cardiologie' },
      { id: 2, name: 'Dr. Dubois', specialty: 'Dermatologie' },
      { id: 3, name: 'Dr. Leroy', specialty: 'Pédiatrie' }
    ];

    this.loading = false;
  }

  private loadPrescriptionData(prescription: Prescription): void {
    // Vider le tableau des médicaments
    while (this.medicationsArray.length) {
      this.medicationsArray.removeAt(0);
    }

    // Remplir le formulaire
    this.prescriptionForm.patchValue({
      appointmentId: prescription.appointmentId,
      patientId: prescription.patientId,
      doctorId: prescription.doctorId,
      diagnosis: prescription.diagnosis,
      notes: prescription.notes
    });

    // Ajouter les médicaments
    prescription.medications.forEach(medication => {
      this.medicationsArray.push(this.fb.group({
        name: [medication.name, Validators.required],
        dosage: [medication.dosage, Validators.required],
        frequency: [medication.frequency, Validators.required],
        duration: [medication.duration, Validators.required],
        instructions: [medication.instructions, Validators.required],
        quantity: [medication.quantity, [Validators.required, Validators.min(1)]],
        unit: [medication.unit, Validators.required]
      }));
    });
  }

  get medicationsArray(): FormArray {
    return this.prescriptionForm.get('medications') as FormArray;
  }

  addMedication(): void {
    const medicationGroup = this.fb.group({
      name: ['', Validators.required],
      dosage: ['', Validators.required],
      frequency: ['', Validators.required],
      duration: ['', Validators.required],
      instructions: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      unit: ['comprimés', Validators.required]
    });

    this.medicationsArray.push(medicationGroup);
  }

  removeMedication(index: number): void {
    if (this.medicationsArray.length > 1) {
      this.medicationsArray.removeAt(index);
    }
  }

  onAppointmentChange(): void {
    const appointmentId = this.prescriptionForm.get('appointmentId')?.value;
    if (appointmentId) {
      const appointment = this.appointments.find(a => a.id === appointmentId);
      if (appointment) {
        this.prescriptionForm.patchValue({
          patientId: appointment.patientId,
          doctorId: appointment.doctorId
        });
      }
    }
  }

  checkDrugInteractions(): void {
    const medications = this.medicationsArray.value;
    if (medications.length === 0) return;

    this.checkingInteractions = true;
    this.hasInteractions = false;
    this.interactions = [];

    this.prescriptionService.checkDrugInteractions(medications)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.hasInteractions = result.hasInteractions;
          this.interactions = result.interactions;
          this.checkingInteractions = false;
        },
        error: (error) => {
          this.error = 'Erreur lors de la vérification des interactions: ' + error.message;
          this.checkingInteractions = false;
        }
      });
  }

  onSubmit(): void {
    if (!this.isFormValid()) {
      this.markFormGroupTouched();
      return;
    }

    this.saving = true;
    this.error = '';
    this.success = '';

    const formData: PrescriptionFormData = this.prescriptionForm.value;

    const serviceCall = this.isEditMode && this.prescriptionId
      ? this.prescriptionService.updatePrescription(this.prescriptionId, formData)
      : this.prescriptionService.createPrescription(formData);

    serviceCall.pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (prescription) => {
          this.success = this.isEditMode 
            ? 'Prescription mise à jour avec succès !'
            : 'Prescription créée avec succès !';
          
          this.saving = false;
          
          // Rediriger après un délai
          setTimeout(() => {
            this.router.navigate(['/prescriptions']);
          }, 1500);
        },
        error: (error) => {
          this.error = 'Erreur lors de la sauvegarde: ' + error.message;
          this.saving = false;
        }
      });
  }

  private markFormGroupTouched(): void {
    Object.keys(this.prescriptionForm.controls).forEach(key => {
      const control = this.prescriptionForm.get(key);
      control?.markAsTouched();

      if (control instanceof FormArray) {
        control.controls.forEach(group => {
          if (group instanceof FormGroup) {
            Object.keys(group.controls).forEach(subKey => {
              group.get(subKey)?.markAsTouched();
            });
          }
        });
      }
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.prescriptionForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  isMedicationFieldInvalid(index: number, fieldName: string): boolean {
    const medicationGroup = this.medicationsArray.at(index);
    const field = medicationGroup.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getFieldError(fieldName: string): string {
    const field = this.prescriptionForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) return 'Ce champ est requis';
      if (field.errors['minlength']) return `Minimum ${field.errors['minlength'].requiredLength} caractères`;
      if (field.errors['min']) return `Valeur minimum: ${field.errors['min'].min}`;
    }
    return '';
  }

  getMedicationFieldError(index: number, fieldName: string): string {
    const medicationGroup = this.medicationsArray.at(index);
    const field = medicationGroup.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) return 'Ce champ est requis';
      if (field.errors['min']) return `Valeur minimum: ${field.errors['min'].min}`;
    }
    return '';
  }

  cancel(): void {
    this.router.navigate(['/prescriptions']);
  }

  getPatientName(patientId: number): string {
    const patient = this.patients.find(p => p.id === patientId);
    return patient ? `${patient.firstName} ${patient.lastName}` : '';
  }

  getDoctorName(doctorId: number): string {
    const doctor = this.doctors.find(d => d.id === doctorId);
    return doctor ? doctor.name : '';
  }

  getAppointmentInfo(appointmentId: number): string {
    const appointment = this.appointments.find(a => a.id === appointmentId);
    if (appointment) {
      const patientName = this.getPatientName(appointment.patientId);
      const date = new Date(appointment.date).toLocaleDateString('fr-FR');
      return `${patientName} - ${date}`;
    }
    return '';
  }

  // Validation personnalisée pour les champs essentiels
  isFormValid(): boolean {
    const requiredFields = ['appointmentId', 'patientId', 'doctorId', 'diagnosis'];
    
    // Vérifier les champs principaux
    const mainFieldsValid = requiredFields.every(field => {
      const control = this.prescriptionForm.get(field);
      const value = control?.value;
      
      if (!value) return false;
      if (value === '') return false;
      if (value === null || value === undefined) return false;
      
      return true;
    });

    // Vérifier qu'il y a au moins un médicament valide
    const medicationsValid = this.medicationsArray.length > 0 && 
      this.medicationsArray.controls.every(group => {
        const requiredMedFields = ['name', 'dosage', 'frequency', 'duration', 'instructions'];
        return requiredMedFields.every(field => {
          const control = group.get(field);
          const value = control?.value;
          
          if (!value) return false;
          if (value === '') return false;
          if (value === null || value === undefined) return false;
          
          return true;
        });
      });

    return mainFieldsValid && medicationsValid;
  }
} 