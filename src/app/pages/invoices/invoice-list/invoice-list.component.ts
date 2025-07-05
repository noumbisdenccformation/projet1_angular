import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { InvoiceService } from '../../../services/invoice.service';
import { AuthService } from '../../../services/auth.service';
import { Invoice, InvoiceStatus } from '../../../models/invoice.model';

@Component({
  selector: 'app-invoice-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './invoice-list.component.html',
  styleUrls: ['./invoice-list.component.css']
})
export class InvoiceListComponent implements OnInit, OnDestroy {
  invoices: Invoice[] = [];
  filteredInvoices: Invoice[] = [];
  loading = false;
  error = '';
  searchTerm = '';
  statusFilter = 'all';
  sortBy = 'date';
  sortOrder: 'asc' | 'desc' = 'desc';
  
  currentPage = 1;
  pageSize = 10;
  totalPages = 1;
  
  canCreate = false;
  canEdit = false;
  canDelete = false;
  canView = true;
  
  stats: any = {};
  
  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  constructor(
    private invoiceService: InvoiceService,
    private authService: AuthService,
    private router: Router
  ) {
    this.setupSearch();
  }

  ngOnInit(): void {
    this.checkPermissions();
    this.loadInvoices();
    this.loadStats();
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
    this.canCreate = ['ADMIN', 'SECRETARY'].includes(userRole || '');
    this.canEdit = ['ADMIN', 'SECRETARY'].includes(userRole || '');
    this.canDelete = ['ADMIN'].includes(userRole || '');
  }

  loadInvoices(): void {
    this.loading = true;
    this.error = '';

    this.invoiceService.getInvoices()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (invoices) => {
          this.invoices = invoices;
          this.applyFilters();
          this.loading = false;
        },
        error: (error) => {
          this.error = 'Erreur lors du chargement des factures: ' + error.message;
          this.loading = false;
        }
      });
  }

  loadStats(): void {
    this.invoiceService.getInvoiceStats()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (stats) => {
          this.stats = stats;
        },
        error: (error) => {
          console.error('Erreur lors du chargement des statistiques:', error);
        }
      });
  }

  onSearchChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchSubject.next(value);
  }

  onSearch(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  onFilter(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  onSort(): void {
    this.applyFilters();
  }

  toggleSortOrder(): void {
    this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    this.applyFilters();
  }

  onStatusFilterChange(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  onSortChange(): void {
    this.applyFilters();
  }

  private applyFilters(): void {
    let filtered = [...this.invoices];

    if (this.statusFilter !== 'all') {
      filtered = filtered.filter(i => i.status === this.statusFilter as InvoiceStatus);
    }

    if (this.searchTerm.trim()) {
      const searchTerm = this.searchTerm.toLowerCase();
      filtered = filtered.filter(invoice =>
        invoice.invoiceNumber.toLowerCase().includes(searchTerm) ||
        invoice.patientName.toLowerCase().includes(searchTerm) ||
        invoice.items.some(item => 
          item.description.toLowerCase().includes(searchTerm)
        )
      );
    }

    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (this.sortBy) {
        case 'date':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'dueDate':
          comparison = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
          break;
        case 'patient':
          comparison = a.patientName.localeCompare(b.patientName);
          break;
        case 'number':
          comparison = a.invoiceNumber.localeCompare(b.invoiceNumber);
          break;
        case 'amount':
          comparison = a.total - b.total;
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        default:
          comparison = 0;
      }

      return this.sortOrder === 'asc' ? comparison : -comparison;
    });

    this.filteredInvoices = filtered;
    this.calculatePagination();
  }

  private calculatePagination(): void {
    this.totalPages = Math.ceil(this.filteredInvoices.length / this.pageSize);
    this.currentPage = Math.min(this.currentPage, this.totalPages || 1);
  }

  get paginatedInvoices(): Invoice[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    return this.filteredInvoices.slice(startIndex, endIndex);
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

  createInvoice(): void {
    this.router.navigate(['/invoices/new']);
  }

  editInvoice(invoiceId: number): void {
    this.router.navigate(['/invoices', invoiceId, 'edit']);
  }

  viewInvoice(invoiceId: number): void {
    this.router.navigate(['/invoices', invoiceId]);
  }

  downloadPDF(invoiceId: number): void {
    this.invoiceService.downloadInvoicePDF(invoiceId).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `facture-${invoiceId}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (error: any) => {
        console.error('Erreur lors du téléchargement:', error);
        this.error = 'Erreur lors du téléchargement de la facture';
      }
    });
  }

  sendEmail(invoiceId: number): void {
    this.invoiceService.sendInvoiceByEmail(invoiceId).subscribe({
      next: () => {
        alert('Facture envoyée par email avec succès !');
      },
      error: (error: any) => {
        console.error('Erreur lors de l\'envoi:', error);
        this.error = 'Erreur lors de l\'envoi de la facture';
      }
    });
  }

  deleteInvoice(invoiceId: number): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette facture ?')) {
      this.invoiceService.deleteInvoice(invoiceId).subscribe({
        next: () => {
          this.loadInvoices();
        },
        error: (error) => {
          console.error('Erreur lors de la suppression:', error);
          this.error = 'Erreur lors de la suppression de la facture';
        }
      });
    }
  }



  markAsPaid(invoice: Invoice): void {
    if (confirm(`Marquer la facture ${invoice.invoiceNumber} comme payée ?`)) {
      this.invoiceService.markAsPaid(invoice.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.loadInvoices();
            this.loadStats();
          },
          error: (error) => {
            this.error = 'Erreur lors de la mise à jour: ' + error.message;
          }
        });
    }
  }

  markAsCancelled(invoice: Invoice): void {
    if (confirm(`Annuler la facture ${invoice.invoiceNumber} ?`)) {
      this.invoiceService.markAsCancelled(invoice.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.loadInvoices();
            this.loadStats();
          },
          error: (error) => {
            this.error = 'Erreur lors de l\'annulation: ' + error.message;
          }
        });
    }
  }

  sendReminder(invoice: Invoice): void {
    if (confirm(`Envoyer un rappel pour la facture ${invoice.invoiceNumber} ?`)) {
      this.invoiceService.sendReminder(invoice.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            const updatedInvoice = { ...invoice, notes: `${invoice.notes || ''}\nRappel envoyé le ${new Date().toLocaleDateString('fr-FR')}` };
            this.invoiceService.updateInvoice(invoice.id, updatedInvoice)
              .pipe(takeUntil(this.destroy$))
              .subscribe(() => {
                this.loadInvoices();
              });
          },
          error: (error) => {
            this.error = 'Erreur lors de l\'envoi du rappel: ' + error.message;
          }
        });
    }
  }

  exportToPdf(invoice: Invoice): void {
    this.invoiceService.exportToPdf(invoice.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (filename) => {
          console.log(`Téléchargement de ${filename}`);
        },
        error: (error) => {
          this.error = 'Erreur lors de l\'export PDF: ' + error.message;
        }
      });
  }

  getStatusBadgeClass(status: InvoiceStatus): string {
    switch (status) {
      case InvoiceStatus.PAID: return 'badge-success';
      case InvoiceStatus.PENDING: return 'badge-warning';
      case InvoiceStatus.OVERDUE: return 'badge-danger';
      case InvoiceStatus.CANCELLED: return 'badge-secondary';
      default: return 'badge-light';
    }
  }

  getStatusText(status: InvoiceStatus): string {
    switch (status) {
      case InvoiceStatus.PAID: return 'Payée';
      case InvoiceStatus.PENDING: return 'En attente';
      case InvoiceStatus.OVERDUE: return 'En retard';
      case InvoiceStatus.CANCELLED: return 'Annulée';
      default: return 'Inconnu';
    }
  }

  isOverdue(invoice: Invoice): boolean {
    return invoice.status === InvoiceStatus.PENDING && new Date(invoice.dueDate) < new Date();
  }

  getItemsSummary(items: any[]): string {
    if (items.length === 0) return 'Aucun article';
    if (items.length === 1) return items[0].description;
    return `${items[0].description} + ${items.length - 1} autre(s)`;
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('fr-FR');
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.statusFilter = 'all';
    this.sortBy = 'date';
    this.sortOrder = 'desc';
    this.currentPage = 1;
    this.applyFilters();
  }

  // Propriétés pour les statistiques
  get totalInvoices(): number {
    return this.invoices.length;
  }

  get paidInvoices(): number {
    return this.invoices.filter(invoice => invoice.status === 'PAID').length;
  }

  get pendingInvoices(): number {
    return this.invoices.filter(invoice => invoice.status === InvoiceStatus.PENDING).length;
  }

  get overdueInvoices(): number {
    return this.invoices.filter(invoice => invoice.status === 'OVERDUE').length;
  }

  get startIndex(): number {
    return (this.currentPage - 1) * this.pageSize;
  }

  get endIndex(): number {
    return Math.min(this.startIndex + this.pageSize, this.filteredInvoices.length);
  }

  get visiblePages(): number[] {
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

  getStatusClass(status: string): string {
    switch (status) {
      case 'PAID': return 'status-paid';
      case 'SENT': return 'status-sent';
      case 'OVERDUE': return 'status-overdue';
      case 'CANCELLED': return 'status-cancelled';
      default: return 'status-draft';
    }
  }
}
