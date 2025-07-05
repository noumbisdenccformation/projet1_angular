import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { InvoiceService } from '../../../services/invoice.service';
import { PatientService } from '../../../services/patient.service';
import { Invoice, InvoiceStatus } from '../../../models/invoice.model';
import { Patient } from '../../../models/patient.model';

@Component({
  selector: 'app-invoice-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './invoice-detail.component.html',
  styleUrls: ['./invoice-detail.component.css']
})
export class InvoiceDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private invoiceService = inject(InvoiceService);
  private patientService = inject(PatientService);

  invoice: Invoice | null = null;
  patient: Patient | null = null;
  loading = true;
  errorMessage = '';
  invoiceId: string = '';

  ngOnInit(): void {
    this.invoiceId = this.route.snapshot.paramMap.get('id') || '';
    if (this.invoiceId) {
      this.loadInvoice();
    }
  }

  private loadInvoice(): void {
    this.loading = true;
    this.invoiceService.getInvoiceById(+this.invoiceId).subscribe({
      next: (invoice) => {
        if (invoice) {
          this.invoice = invoice;
          this.loadPatient(invoice.patientId);
        } else {
          this.errorMessage = 'Facture non trouvée';
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement de la facture:', error);
        this.errorMessage = 'Erreur lors du chargement de la facture';
        this.loading = false;
      }
    });
  }

  private loadPatient(patientId: number): void {
    this.patientService.getPatientById(patientId).subscribe({
      next: (patient) => {
        this.patient = patient || null;
      },
      error: (error) => {
        console.error('Erreur lors du chargement du patient:', error);
      }
    });
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

  getStatusText(status: string): string {
    switch (status) {
      case 'PAID': return 'Payée';
      case 'SENT': return 'Envoyée';
      case 'OVERDUE': return 'En retard';
      case 'CANCELLED': return 'Annulée';
      case 'DRAFT': return 'Brouillon';
      default: return status;
    }
  }

  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('fr-FR');
  }

  onEdit(): void {
    this.router.navigate(['/invoices', this.invoiceId, 'edit']);
  }

  onDelete(): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette facture ?')) {
      this.invoiceService.deleteInvoice(parseInt(this.invoiceId)).subscribe({
        next: () => {
          this.router.navigate(['/invoices']);
        },
        error: (error: any) => {
          console.error('Erreur lors de la suppression:', error);
          this.errorMessage = 'Erreur lors de la suppression de la facture';
        }
      });
    }
  }

  onSendEmail(): void {
    if (this.invoice) {
      this.invoiceService.sendInvoiceByEmail(this.invoice.id).subscribe({
        next: () => {
          alert('Facture envoyée par email avec succès !');
        },
        error: (error: any) => {
          console.error('Erreur lors de l\'envoi:', error);
          this.errorMessage = 'Erreur lors de l\'envoi de la facture';
        }
      });
    }
  }

  onDownloadPDF(): void {
    if (this.invoice) {
      this.invoiceService.downloadInvoicePDF(this.invoice.id).subscribe({
        next: (blob: Blob) => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `facture-${this.invoice?.invoiceNumber}.pdf`;
          link.click();
          window.URL.revokeObjectURL(url);
        },
        error: (error: any) => {
          console.error('Erreur lors du téléchargement:', error);
          this.errorMessage = 'Erreur lors du téléchargement de la facture';
        }
      });
    }
  }

  onMarkAsPaid(): void {
    if (this.invoice) {
      const updatedInvoice = { ...this.invoice, status: InvoiceStatus.PAID };
      this.invoiceService.updateInvoice(this.invoice.id, { status: InvoiceStatus.PAID }).subscribe({
        next: () => {
          this.invoice = updatedInvoice;
          alert('Facture marquée comme payée !');
        },
        error: (error: any) => {
          console.error('Erreur lors de la mise à jour:', error);
          this.errorMessage = 'Erreur lors de la mise à jour du statut';
        }
      });
    }
  }
}
