import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { PrescriptionService } from '../../../services/prescription.service';
import { AuthService } from '../../../services/auth.service';
import { Prescription } from '../../../models/prescription.model';

@Component({
  selector: 'app-prescription-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './prescription-list.component.html',
  styleUrls: ['./prescription-list.component.css']
})
export class PrescriptionListComponent implements OnInit, OnDestroy {
  prescriptions: Prescription[] = [];
  filteredPrescriptions: Prescription[] = [];
  loading = false;
  error = '';
  searchTerm = '';
  statusFilter = 'all';
  sortBy = 'date';
  sortOrder: 'asc' | 'desc' = 'desc';
  
  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalPages = 1;
  
  // Permissions
  canCreate = false;
  canEdit = false;
  canDelete = false;
  canView = true;
  
  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  constructor(
    private prescriptionService: PrescriptionService,
    private authService: AuthService,
    private router: Router
  ) {
    this.setupSearch();
  }

  ngOnInit(): void {
    this.checkPermissions();
    this.loadPrescriptions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.searchSubject.complete();
  }

  private setupSearch(): void {
    this.searchSubject.pipe(
      takeUntil(this.destroy$),
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(searchTerm => {
      this.searchTerm = searchTerm;
      this.applyFilters();
    });
  }

  private checkPermissions(): void {
    const userRole = this.authService.getCurrentUser()?.role;
    
    this.canCreate = ['DOCTOR', 'ADMIN'].includes(userRole || '');
    this.canEdit = ['DOCTOR', 'ADMIN'].includes(userRole || '');
    this.canDelete = ['ADMIN'].includes(userRole || '');
  }

  loadPrescriptions(): void {
    this.loading = true;
    this.error = '';

    this.prescriptionService.getPrescriptions()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (prescriptions) => {
          this.prescriptions = prescriptions;
          this.applyFilters();
          this.loading = false;
        },
        error: (error) => {
          this.error = 'Erreur lors du chargement des prescriptions: ' + error.message;
          this.loading = false;
        }
      });
  }

  onSearchChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchSubject.next(value);
  }

  onStatusFilterChange(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  onSortChange(): void {
    this.applyFilters();
  }

  private applyFilters(): void {
    let filtered = [...this.prescriptions];

    // Filtre par statut
    if (this.statusFilter !== 'all') {
      const isActive = this.statusFilter === 'active';
      filtered = filtered.filter(p => p.isActive === isActive);
    }

    // Filtre par recherche
    if (this.searchTerm.trim()) {
      const searchTerm = this.searchTerm.toLowerCase();
      filtered = filtered.filter(prescription =>
        prescription.patientName.toLowerCase().includes(searchTerm) ||
        prescription.doctorName.toLowerCase().includes(searchTerm) ||
        prescription.diagnosis.toLowerCase().includes(searchTerm) ||
        prescription.medications.some(med => 
          med.name.toLowerCase().includes(searchTerm)
        )
      );
    }

    // Tri
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (this.sortBy) {
        case 'date':
          comparison = new Date(a.prescriptionDate).getTime() - new Date(b.prescriptionDate).getTime();
          break;
        case 'patient':
          comparison = a.patientName.localeCompare(b.patientName);
          break;
        case 'doctor':
          comparison = a.doctorName.localeCompare(b.doctorName);
          break;
        case 'diagnosis':
          comparison = a.diagnosis.localeCompare(b.diagnosis);
          break;
        case 'medications':
          comparison = a.medications.length - b.medications.length;
          break;
        default:
          comparison = 0;
      }

      return this.sortOrder === 'asc' ? comparison : -comparison;
    });

    this.filteredPrescriptions = filtered;
    this.calculatePagination();
  }

  private calculatePagination(): void {
    this.totalPages = Math.ceil(this.filteredPrescriptions.length / this.pageSize);
    this.currentPage = Math.min(this.currentPage, this.totalPages || 1);
  }

  get paginatedPrescriptions(): Prescription[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    return this.filteredPrescriptions.slice(startIndex, endIndex);
  }

  get pageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 5;
    
    if (this.totalPages <= maxVisiblePages) {
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      const start = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
      const end = Math.min(this.totalPages, start + maxVisiblePages - 1);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  createPrescription(): void {
    this.router.navigate(['/prescriptions/new']);
  }

  editPrescription(prescription: Prescription): void {
    this.router.navigate(['/prescriptions', prescription.id, 'edit']);
  }

  viewPrescription(prescription: Prescription): void {
    this.router.navigate(['/prescriptions', prescription.id]);
  }

  deletePrescription(prescription: Prescription): void {
    if (confirm(`Êtes-vous sûr de vouloir supprimer la prescription pour ${prescription.patientName} ?`)) {
      this.prescriptionService.deletePrescription(prescription.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.loadPrescriptions();
          },
          error: (error) => {
            this.error = 'Erreur lors de la suppression: ' + error.message;
          }
        });
    }
  }

  togglePrescriptionStatus(prescription: Prescription): void {
    const action = prescription.isActive ? 'désactiver' : 'réactiver';
    if (confirm(`Êtes-vous sûr de vouloir ${action} cette prescription ?`)) {
      const serviceCall = prescription.isActive 
        ? this.prescriptionService.deactivatePrescription(prescription.id)
        : this.prescriptionService.reactivatePrescription(prescription.id);

      serviceCall.pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.loadPrescriptions();
          },
          error: (error) => {
            this.error = `Erreur lors de la ${action}: ` + error.message;
          }
        });
    }
  }

  getMedicationSummary(medications: any[]): string {
    if (medications.length === 0) return 'Aucun médicament';
    if (medications.length === 1) return medications[0].name;
    return `${medications[0].name} + ${medications.length - 1} autre(s)`;
  }

  getStatusBadgeClass(isActive: boolean): string {
    return isActive ? 'badge-success' : 'badge-warning';
  }

  getStatusText(isActive: boolean): string {
    return isActive ? 'Active' : 'Inactive';
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('fr-FR');
  }

  getActivePrescriptionsCount(): number {
    return this.prescriptions.filter(p => p.isActive).length;
  }

  getMedicationsTitle(prescription: Prescription): string {
    return prescription.medications.map(m => m.name).join(', ');
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.statusFilter = 'all';
    this.sortBy = 'date';
    this.sortOrder = 'desc';
    this.currentPage = 1;
    this.applyFilters();
  }
} 