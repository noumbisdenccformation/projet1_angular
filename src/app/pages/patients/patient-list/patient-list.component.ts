import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PatientService } from '../../../services/patient.service';
import { AuthService } from '../../../services/auth.service';
import { Patient } from '../../../models/patient.model';
import { UserRole } from '../../../models/user.model';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-patient-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatMenuModule,
    MatSnackBarModule,
    MatDialogModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './patient-list.component.html',
  styleUrl: './patient-list.component.css'
})
export class PatientListComponent implements OnInit {
  patients: Patient[] = [];
  filteredPatients: Patient[] = [];
  displayedPatients: Patient[] = [];
  
  // Pagination
  pageSize = 10;
  pageSizeOptions = [5, 10, 25, 50];
  currentPage = 0;
  totalItems = 0;
  
  // Search
  searchControl = new FormControl('');
  
  // Table columns
  displayedColumns = [
    'fileNumber',
    'firstName',
    'lastName',
    'phone',
    'assignedDoctor',
    'createdAt',
    'actions'
  ];
  
  // Sorting
  currentSort: Sort = { active: 'createdAt', direction: 'desc' };
  
  // Loading state
  isLoading = false;
  
  UserRole = UserRole;

  constructor(
    private patientService: PatientService,
    public authService: AuthService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadPatients();
    this.setupSearch();
  }

  private loadPatients(): void {
    this.isLoading = true;
    this.patientService.getPatients().subscribe({
      next: (patients) => {
        this.patients = patients;
        this.filteredPatients = [...patients];
        this.applySortingAndPagination();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des patients:', error);
        this.snackBar.open('Erreur lors du chargement des patients', 'Fermer', {
          duration: 3000
        });
        this.isLoading = false;
      }
    });
  }

  private setupSearch(): void {
    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(value => {
        if (!value || value.trim() === '') {
          return of(this.patients);
        }
        return this.patientService.searchPatients(value);
      })
    ).subscribe(filteredPatients => {
      this.filteredPatients = filteredPatients;
      this.currentPage = 0;
      this.applySortingAndPagination();
    });
  }

  private applySortingAndPagination(): void {
    // Appliquer le tri
    let sortedPatients = [...this.filteredPatients];
    
    if (this.currentSort.direction) {
      sortedPatients.sort((a, b) => {
        const aValue = this.getSortValue(a, this.currentSort.active);
        const bValue = this.getSortValue(b, this.currentSort.active);
        
        if (this.currentSort.direction === 'asc') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });
    }
    
    // Appliquer la pagination
    this.totalItems = sortedPatients.length;
    const startIndex = this.currentPage * this.pageSize;
    this.displayedPatients = sortedPatients.slice(startIndex, startIndex + this.pageSize);
  }

  private getSortValue(patient: Patient, column: string): any {
    switch (column) {
      case 'fileNumber': return patient.fileNumber;
      case 'firstName': return patient.firstName.toLowerCase();
      case 'lastName': return patient.lastName.toLowerCase();
      case 'phone': return patient.phone;
      case 'createdAt': return new Date(patient.createdAt).getTime();
      default: return '';
    }
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.applySortingAndPagination();
  }

  onSortChange(sort: Sort): void {
    this.currentSort = sort;
    this.applySortingAndPagination();
  }

  deletePatient(patient: Patient): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Confirmer la suppression',
        message: `Êtes-vous sûr de vouloir supprimer le patient ${patient.firstName} ${patient.lastName} ?`,
        confirmText: 'Supprimer',
        cancelText: 'Annuler'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.patientService.deletePatient(patient.id).subscribe({
          next: (success) => {
            if (success) {
              this.snackBar.open('Patient supprimé avec succès', 'Fermer', {
                duration: 3000
              });
              this.loadPatients();
            } else {
              this.snackBar.open('Erreur lors de la suppression', 'Fermer', {
                duration: 3000
              });
            }
          },
          error: (error) => {
            console.error('Erreur lors de la suppression:', error);
            this.snackBar.open('Erreur lors de la suppression', 'Fermer', {
              duration: 3000
            });
          }
        });
      }
    });
  }

  getAge(dateOfBirth: Date): number {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  getGenderDisplay(gender: string): string {
    switch (gender) {
      case 'MALE': return 'Homme';
      case 'FEMALE': return 'Femme';
      case 'OTHER': return 'Autre';
      default: return gender;
    }
  }

  clearSearch(): void {
    this.searchControl.setValue('');
  }
}

// Composant de dialogue de confirmation
@Component({
  selector: 'app-confirm-dialog',
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content>{{ data.message }}</mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>{{ data.cancelText }}</button>
      <button mat-raised-button color="warn" [mat-dialog-close]="true">
        {{ data.confirmText }}
      </button>
    </mat-dialog-actions>
  `,
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule
  ]
})
export class ConfirmDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {}
}
