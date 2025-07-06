import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { PatientService } from '../../../services/patient.service';
import { AuthService } from '../../../services/auth.service';
import { Patient, PatientFormData } from '../../../models/patient.model';
import { UserRole } from '../../../models/user.model';

@Component({
  selector: 'app-patient-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatDividerModule
  ],
  templateUrl: './patient-form.component.html',
  styleUrl: './patient-form.component.css'
})
export class PatientFormComponent implements OnInit {
  patientForm: FormGroup;
  isEditMode = false;
  patientId: number | null = null;
  isLoading = false;
  isSubmitting = false;
  
  // Options pour les selects
  genderOptions = [
    { value: 'MALE', label: 'Homme' },
    { value: 'FEMALE', label: 'Femme' },
    { value: 'OTHER', label: 'Autre' }
  ];

  relationshipOptions = [
    { value: 'Époux', label: 'Époux' },
    { value: 'Épouse', label: 'Épouse' },
    { value: 'Père', label: 'Père' },
    { value: 'Mère', label: 'Mère' },
    { value: 'Fils', label: 'Fils' },
    { value: 'Fille', label: 'Fille' },
    { value: 'Frère', label: 'Frère' },
    { value: 'Sœur', label: 'Sœur' },
    { value: 'Autre', label: 'Autre' }
  ];

  UserRole = UserRole;

  constructor(
    private fb: FormBuilder,
    private patientService: PatientService,
    public authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.patientForm = this.createForm();
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.patientId = +params['id'];
        this.loadPatient(this.patientId);
      }
    });
  }

  private createForm(): FormGroup {
    return this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      dateOfBirth: ['', [Validators.required]],
      gender: ['', [Validators.required]],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9+\-\s()]+$/)]],
      email: ['', [Validators.email]],
      address: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(200)]],
      city: ['', [Validators.required]],
      postalCode: ['', [Validators.required, Validators.pattern(/^[0-9A-Za-z\+\-\s]{2,10}$/)]],
      
      // Contact d'urgence (optionnel pour débloquer le bouton)
      emergencyContactName: [''],
      emergencyContactPhone: ['', [Validators.pattern(/^[0-9+\-\s()]+$/)]],
      emergencyContactRelationship: [''],
      
      // Antécédents médicaux
      allergies: this.fb.array([]),
      chronicDiseases: this.fb.array([]),
      surgeries: this.fb.array([]),
      medications: this.fb.array([]),
      
      // Assurance (optionnel)
      insuranceProvider: [''],
      insurancePolicyNumber: [''],
      insuranceGroupNumber: [''],
      
      // Notes (optionnel)
      notes: ['', [Validators.maxLength(500)]]
    });
  }

  private loadPatient(id: number): void {
    this.isLoading = true;
    this.patientService.getPatientById(id).subscribe({
      next: (patient) => {
        if (patient) {
          this.populateForm(patient);
        } else {
          this.snackBar.open('Patient non trouvé', 'Fermer', { duration: 3000 });
          this.router.navigate(['/patients']);
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement du patient:', error);
        this.snackBar.open('Erreur lors du chargement du patient', 'Fermer', { duration: 3000 });
        this.isLoading = false;
      }
    });
  }

  private populateForm(patient: Patient): void {
    // Convertir les tableaux en FormArrays
    this.clearArrays();
    
    patient.medicalHistory.allergies.forEach(allergy => {
      this.addArrayItem('allergies', allergy);
    });
    
    patient.medicalHistory.chronicDiseases.forEach(disease => {
      this.addArrayItem('chronicDiseases', disease);
    });
    
    patient.medicalHistory.surgeries.forEach(surgery => {
      this.addArrayItem('surgeries', surgery);
    });
    
    patient.medicalHistory.medications.forEach(medication => {
      this.addArrayItem('medications', medication);
    });

    this.patientForm.patchValue({
      firstName: patient.firstName,
      lastName: patient.lastName,
      dateOfBirth: this.formatDateForInput(patient.dateOfBirth),
      gender: patient.gender,
      phone: patient.phone,
      email: patient.email,
      address: patient.address,
      city: patient.city,
      postalCode: patient.postalCode,
      emergencyContactName: patient.emergencyContact.name,
      emergencyContactPhone: patient.emergencyContact.phone,
      emergencyContactRelationship: patient.emergencyContact.relationship,
      insuranceProvider: patient.insuranceInfo?.provider || '',
      insurancePolicyNumber: patient.insuranceInfo?.policyNumber || '',
      insuranceGroupNumber: patient.insuranceInfo?.groupNumber || ''
    });
  }

  private clearArrays(): void {
    while (this.allergiesArray.length !== 0) {
      this.allergiesArray.removeAt(0);
    }
    while (this.chronicDiseasesArray.length !== 0) {
      this.chronicDiseasesArray.removeAt(0);
    }
    while (this.surgeriesArray.length !== 0) {
      this.surgeriesArray.removeAt(0);
    }
    while (this.medicationsArray.length !== 0) {
      this.medicationsArray.removeAt(0);
    }
  }

  private formatDateForInput(date: Date): string {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  onSubmit(): void {
    if (this.patientForm.valid) {
      this.isSubmitting = true;
      const formData: PatientFormData = this.patientForm.value;

      if (this.isEditMode && this.patientId) {
        this.patientService.updatePatient(this.patientId, formData).subscribe({
          next: (updatedPatient) => {
            if (updatedPatient) {
              this.snackBar.open('Patient modifié avec succès', 'Fermer', { duration: 3000 });
              this.router.navigate(['/patients', this.patientId]);
            } else {
              this.snackBar.open('Erreur lors de la modification', 'Fermer', { duration: 3000 });
            }
            this.isSubmitting = false;
          },
          error: (error) => {
            console.error('Erreur lors de la modification:', error);
            this.snackBar.open('Erreur lors de la modification', 'Fermer', { duration: 3000 });
            this.isSubmitting = false;
          }
        });
      } else {
        this.patientService.createPatient(formData).subscribe({
          next: (newPatient) => {
            this.snackBar.open('Patient créé avec succès', 'Fermer', { duration: 3000 });
            this.router.navigate(['/patients', newPatient.id]);
            this.isSubmitting = false;
          },
          error: (error) => {
            console.error('Erreur lors de la création:', error);
            this.snackBar.open('Erreur lors de la création', 'Fermer', { duration: 3000 });
            this.isSubmitting = false;
          }
        });
      }
    } else {
      this.markFormGroupTouched();
    }
  }

  onCancel(): void {
    this.router.navigate(['/patients']);
  }

  // Gestion des FormArrays
  get allergiesArray(): FormArray {
    return this.patientForm.get('allergies') as FormArray;
  }

  get chronicDiseasesArray(): FormArray {
    return this.patientForm.get('chronicDiseases') as FormArray;
  }

  get surgeriesArray(): FormArray {
    return this.patientForm.get('surgeries') as FormArray;
  }

  get medicationsArray(): FormArray {
    return this.patientForm.get('medications') as FormArray;
  }

  addArrayItem(arrayName: string, value: string = ''): void {
    const array = this.patientForm.get(arrayName) as FormArray;
    array.push(this.fb.control(value, [Validators.required]));
  }

  removeArrayItem(arrayName: string, index: number): void {
    const array = this.patientForm.get(arrayName) as FormArray;
    array.removeAt(index);
  }

  // Validation
  private markFormGroupTouched(): void {
    Object.keys(this.patientForm.controls).forEach(key => {
      const control = this.patientForm.get(key);
      if (control instanceof FormArray) {
        control.controls.forEach(c => c.markAsTouched());
      } else {
        control?.markAsTouched();
      }
    });
  }

  getErrorMessage(controlName: string): string {
    const control = this.patientForm.get(controlName);
    if (control?.hasError('required')) {
      return 'Ce champ est requis';
    }
    if (control?.hasError('email')) {
      return 'Format d\'email invalide';
    }
    if (control?.hasError('minlength')) {
      const requiredLength = control.errors?.['minlength'].requiredLength;
      if (controlName === 'address') {
        return `Adresse trop courte (minimum ${requiredLength} caractères)`;
      }
      return `Minimum ${requiredLength} caractères requis`;
    }
    if (control?.hasError('maxlength')) {
      const maxLength = control.errors?.['maxlength'].requiredLength;
      return `Maximum ${maxLength} caractères autorisés`;
    }
    if (control?.hasError('pattern')) {
      if (controlName === 'postalCode') {
        return 'Code postal invalide (2-10 caractères, lettres/chiffres/+/-)';
      }
      if (controlName === 'phone' || controlName === 'emergencyContactPhone') {
        return 'Numéro de téléphone invalide';
      }
    }
    return '';
  }

  getArrayErrorMessage(arrayName: string, index: number): string {
    const array = this.patientForm.get(arrayName) as FormArray;
    const control = array.at(index);
    if (control?.hasError('required')) {
      return 'Ce champ est requis';
    }
    return '';
  }
}
