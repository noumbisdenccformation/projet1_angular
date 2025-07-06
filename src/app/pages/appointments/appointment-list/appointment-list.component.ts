import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Appointment, AppointmentStatus, AppointmentType } from '../../../models/appointment.model';
import { AppointmentService } from '../../../services/appointment.service';
import { AuthService } from '../../../services/auth.service';
import { UserRole } from '../../../models/user.model';

@Component({
  selector: 'app-appointment-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './appointment-list.component.html',
  styleUrl: './appointment-list.component.css'
})
export class AppointmentListComponent implements OnInit {
  appointments: Appointment[] = [];
  filteredAppointments: Appointment[] = [];
  displayedColumns: string[] = ['date', 'time', 'patientName', 'doctorName', 'type', 'status', 'room', 'actions'];
  
  // Pagination
  pageSize = 10;
  pageSizeOptions = [5, 10, 25, 50];
  currentPage = 0;
  totalItems = 0;
  
  // Filtres
  filterForm: FormGroup;
  statusOptions = Object.values(AppointmentStatus);
  typeOptions = Object.values(AppointmentType);
  
  // Tri
  currentSort: Sort = { active: 'date', direction: 'asc' };
  
  // États de chargement
  loading = false;
  
  // Rôles
  UserRole = UserRole;

  constructor(
    private appointmentService: AppointmentService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private fb: FormBuilder
  ) {
    this.filterForm = this.fb.group({
      search: [''],
      status: [''],
      type: [''],
      dateFrom: [''],
      dateTo: [''],
      doctorId: ['']
    });
  }

  ngOnInit(): void {
    this.loadAppointments();
    this.setupFilters();
  }

  private loadAppointments(): void {
    this.loading = true;
    this.appointmentService.getAppointments().subscribe({
      next: (appointments) => {
        this.appointments = appointments;
        this.applyFilters();
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des rendez-vous:', error);
        this.snackBar.open('Erreur lors du chargement des rendez-vous', 'Fermer', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  private setupFilters(): void {
    this.filterForm.valueChanges.subscribe(() => {
      this.currentPage = 0;
      this.applyFilters();
    });
  }

  private applyFilters(): void {
    let filtered = [...this.appointments];
    const filters = this.filterForm.value;

    // Filtre de recherche
    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(appointment =>
        appointment.patientName.toLowerCase().includes(search) ||
        appointment.doctorName.toLowerCase().includes(search) ||
        appointment.room.toLowerCase().includes(search)
      );
    }

    // Filtre par statut
    if (filters.status) {
      filtered = filtered.filter(appointment => appointment.status === filters.status);
    }

    // Filtre par type
    if (filters.type) {
      filtered = filtered.filter(appointment => appointment.type === filters.type);
    }

    // Filtre par date
    if (filters.dateFrom) {
      filtered = filtered.filter(appointment => appointment.date >= new Date(filters.dateFrom));
    }
    if (filters.dateTo) {
      filtered = filtered.filter(appointment => appointment.date <= new Date(filters.dateTo));
    }

    // Filtre par médecin (si l'utilisateur est un médecin)
    if (this.authService.isDoctor() && this.authService.currentUser) {
      filtered = filtered.filter(appointment => appointment.doctorId === this.authService.currentUser!.id);
    }

    // Appliquer le tri
    this.sortData(this.currentSort, filtered);

    this.filteredAppointments = filtered;
    this.totalItems = filtered.length;
    this.updatePaginatedData();
  }

  private updatePaginatedData(): void {
    const startIndex = this.currentPage * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.filteredAppointments = this.filteredAppointments.slice(startIndex, endIndex);
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.updatePaginatedData();
  }

  onSortChange(sort: Sort): void {
    this.currentSort = sort;
    this.applyFilters();
  }

  private sortData(sort: Sort, data: Appointment[]): void {
    if (!sort.active || sort.direction === '') {
      return;
    }

    data.sort((a, b) => {
      const isAsc = sort.direction === 'asc';
      switch (sort.active) {
        case 'date':
          return this.compare(a.date, b.date, isAsc);
        case 'time':
          return this.compare(a.startTime, b.startTime, isAsc);
        case 'patientName':
          return this.compare(a.patientName, b.patientName, isAsc);
        case 'doctorName':
          return this.compare(a.doctorName, b.doctorName, isAsc);
        case 'type':
          return this.compare(a.type, b.type, isAsc);
        case 'status':
          return this.compare(a.status, b.status, isAsc);
        case 'room':
          return this.compare(a.room, b.room, isAsc);
        default:
          return 0;
      }
    });
  }

  private compare(a: any, b: any, isAsc: boolean): number {
    return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
  }

  deleteAppointment(id: number): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce rendez-vous ?')) {
      this.appointmentService.deleteAppointment(id).subscribe({
        next: () => {
          this.snackBar.open('Rendez-vous supprimé avec succès', 'Fermer', { duration: 3000 });
          this.loadAppointments();
        },
        error: (error) => {
          console.error('Erreur lors de la suppression:', error);
          this.snackBar.open(error.message || 'Erreur lors de la suppression', 'Fermer', { duration: 3000 });
        }
      });
    }
  }

  updateStatus(id: number, newStatus: AppointmentStatus): void {
    this.appointmentService.updateAppointment(id, { status: newStatus }).subscribe({
      next: () => {
        this.snackBar.open('Statut mis à jour avec succès', 'Fermer', { duration: 3000 });
        this.loadAppointments();
      },
      error: (error) => {
        console.error('Erreur lors de la mise à jour:', error);
        this.snackBar.open(error.message || 'Erreur lors de la mise à jour', 'Fermer', { duration: 3000 });
      }
    });
  }

  getStatusColor(status: AppointmentStatus): string {
    switch (status) {
      case AppointmentStatus.CONFIRMED:
        return 'accent';
      case AppointmentStatus.SCHEDULED:
        return 'primary';
      case AppointmentStatus.IN_PROGRESS:
        return 'warn';
      case AppointmentStatus.COMPLETED:
        return 'primary';
      case AppointmentStatus.CANCELLED:
        return 'warn';
      case AppointmentStatus.NO_SHOW:
        return 'warn';
      default:
        return 'primary';
    }
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

  getStatusDisplayName(status: AppointmentStatus): string {
    switch (status) {
      case AppointmentStatus.SCHEDULED:
        return 'Programmé';
      case AppointmentStatus.CONFIRMED:
        return 'Confirmé';
      case AppointmentStatus.IN_PROGRESS:
        return 'En cours';
      case AppointmentStatus.COMPLETED:
        return 'Terminé';
      case AppointmentStatus.CANCELLED:
        return 'Annulé';
      case AppointmentStatus.NO_SHOW:
        return 'Absent';
      default:
        return status;
    }
  }

  clearFilters(): void {
    this.filterForm.reset();
  }

  canEdit(appointment: Appointment): boolean {
    return this.authService.hasAnyRole([UserRole.ADMIN, UserRole.SECRETARY]) ||
           (this.authService.isDoctor() && appointment.doctorId === this.authService.currentUser?.id);
  }

  canDelete(appointment: Appointment): boolean {
    return this.authService.hasAnyRole([UserRole.ADMIN, UserRole.SECRETARY]) ||
           (this.authService.isDoctor() && appointment.doctorId === this.authService.currentUser?.id);
  }

  getTodayAppointmentsCount(): number {
    const today = new Date().toDateString();
    return this.appointments.filter(a => new Date(a.date).toDateString() === today).length;
  }
}
