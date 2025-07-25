import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import { Invoice, InvoiceItem, InvoiceStatus, InvoiceFormData } from '../models/invoice.model';

@Injectable({
  providedIn: 'root'
})
export class InvoiceService {
  private invoices: Invoice[] = [
    {
      id: 1,
      invoiceNumber: 'INV-2024-001',
      patientId: 1,
      patientName: 'Marie Dubois',
      appointmentId: 1,
      items: [
        {
          id: 1,
          description: 'Consultation cardiologie',
          quantity: 1,
          unitPrice: 50000,
          total: 50000
        },
        {
          id: 2,
          description: 'Électrocardiogramme',
          quantity: 1,
          unitPrice: 30000,
          total: 30000
        }
      ],
      subtotal: 80000,
      tax: 15400,
      discount: 0,
      total: 95400,
      status: InvoiceStatus.PAID,
      issueDate: new Date('2024-01-15'),
      dueDate: new Date('2024-01-20'),
      paidDate: new Date('2024-01-18'),
      notes: 'Paiement par carte bancaire',
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-18')
    },
    {
      id: 2,
      invoiceNumber: 'INV-2024-002',
      patientId: 2,
      patientName: 'Pierre Martin',
      appointmentId: 2,
      items: [
        {
          id: 3,
          description: 'Consultation diabétologie',
          quantity: 1,
          unitPrice: 60000,
          total: 60000
        },
        {
          id: 4,
          description: 'Analyse glycémique',
          quantity: 1,
          unitPrice: 25000,
          total: 25000
        },
        {
          id: 5,
          description: 'Médicaments (Metformine)',
          quantity: 1,
          unitPrice: 15000,
          total: 15000
        }
      ],
      subtotal: 100000,
      tax: 19250,
      discount: 5000,
      total: 114250,
      status: InvoiceStatus.PENDING,
      issueDate: new Date('2024-01-15'),
      dueDate: new Date('2024-02-15'),
      notes: 'Remboursement mutuelle possible',
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-15')
    },
    {
      id: 3,
      invoiceNumber: 'INV-2024-003',
      patientId: 3,
      patientName: 'Sophie Bernard',
      appointmentId: 3,
      items: [
        {
          id: 6,
          description: 'Consultation dermatologie',
          quantity: 1,
          unitPrice: 45000,
          total: 45000
        },
        {
          id: 7,
          description: 'Biopsie cutanée',
          quantity: 1,
          unitPrice: 75000,
          total: 75000
        }
      ],
      subtotal: 120000,
      tax: 23100,
      discount: 0,
      total: 143100,
      status: InvoiceStatus.OVERDUE,
      issueDate: new Date('2024-01-05'),
      dueDate: new Date('2024-01-10'),
      notes: 'Relance envoyée le 15/01',
      createdAt: new Date('2024-01-05'),
      updatedAt: new Date('2024-01-15')
    }
  ];

  private nextInvoiceId = 4;
  private nextItemId = 8;
  private currentInvoiceNumber = 4;

  constructor() { }

  // Récupérer toutes les factures
  getInvoices(): Observable<Invoice[]> {
    return of([...this.invoices]).pipe(delay(500));
  }

  // Récupérer une facture par ID
  getInvoiceById(id: number): Observable<Invoice | undefined> {
    const invoice = this.invoices.find(i => i.id === id);
    return of(invoice).pipe(delay(300));
  }

  // Récupérer les factures d'un patient
  getInvoicesByPatient(patientId: number): Observable<Invoice[]> {
    const patientInvoices = this.invoices.filter(i => i.patientId === patientId);
    return of(patientInvoices).pipe(delay(300));
  }

  // Récupérer les factures par statut
  getInvoicesByStatus(status: InvoiceStatus): Observable<Invoice[]> {
    const statusInvoices = this.invoices.filter(i => i.status === status);
    return of(statusInvoices).pipe(delay(300));
  }

  // Récupérer les factures en retard
  getOverdueInvoices(): Observable<Invoice[]> {
    const today = new Date();
    const overdueInvoices = this.invoices.filter(invoice => 
      invoice.status === InvoiceStatus.PENDING && 
      new Date(invoice.dueDate) < today
    );
    return of(overdueInvoices).pipe(delay(300));
  }

  // Créer une nouvelle facture
  createInvoice(invoiceData: InvoiceFormData): Observable<Invoice> {
    const invoiceNumber = this.generateInvoiceNumber();
    const items = invoiceData.items.map(item => ({
      id: this.nextItemId++,
      ...item,
      total: item.quantity * item.unitPrice
    }));

    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const tax = subtotal * 0.1925; // 19.25% de TVA (Cameroun)
    const total = subtotal + tax - invoiceData.discount;

    const newInvoice: Invoice = {
      id: this.nextInvoiceId++,
      invoiceNumber,
      patientId: invoiceData.patientId,
      patientName: 'Patient à récupérer', // Sera mis à jour avec les vraies données
      appointmentId: invoiceData.appointmentId,
      items,
      subtotal,
      tax,
      discount: invoiceData.discount,
      total,
      status: InvoiceStatus.PENDING,
      issueDate: new Date(),
      dueDate: this.calculateDueDate(),
      notes: invoiceData.notes,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.invoices.push(newInvoice);
    return of(newInvoice).pipe(delay(500));
  }

  // Mettre à jour une facture
  updateInvoice(id: number, updates: Partial<Invoice>): Observable<Invoice> {
    const index = this.invoices.findIndex(i => i.id === id);
    if (index === -1) {
      return throwError(() => new Error('Facture non trouvée'));
    }

    // Recalculer les totaux si les items ont changé
    if (updates.items) {
      const subtotal = updates.items.reduce((sum, item) => sum + item.total, 0);
      const tax = subtotal * 0.1925;
      const discount = updates.discount || this.invoices[index].discount;
      const total = subtotal + tax - discount;

      updates.subtotal = subtotal;
      updates.tax = tax;
      updates.total = total;
    }

    this.invoices[index] = {
      ...this.invoices[index],
      ...updates,
      updatedAt: new Date()
    };

    return of(this.invoices[index]).pipe(delay(500));
  }

  // Supprimer une facture
  deleteInvoice(id: number): Observable<boolean> {
    const index = this.invoices.findIndex(i => i.id === id);
    if (index === -1) {
      return throwError(() => new Error('Facture non trouvée'));
    }

    this.invoices.splice(index, 1);
    return of(true).pipe(delay(300));
  }

  // Marquer comme payée
  markAsPaid(id: number): Observable<Invoice> {
    return this.updateInvoice(id, {
      status: InvoiceStatus.PAID,
      paidDate: new Date()
    });
  }

  // Marquer comme annulée
  markAsCancelled(id: number): Observable<Invoice> {
    return this.updateInvoice(id, {
      status: InvoiceStatus.CANCELLED
    });
  }

  // Envoyer un rappel
  sendReminder(id: number): Observable<boolean> {
    // Simulation d'envoi de rappel
    return of(true).pipe(delay(200));
  }

  // Générer le numéro de facture
  private generateInvoiceNumber(): string {
    const year = new Date().getFullYear();
    const number = this.currentInvoiceNumber.toString().padStart(3, '0');
    this.currentInvoiceNumber++;
    return `INV-${year}-${number}`;
  }

  // Calculer la date d'échéance (30 jours par défaut)
  private calculateDueDate(): Date {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);
    return dueDate;
  }

  // Récupérer les statistiques des factures
  getInvoiceStats(): Observable<any> {
    const today = new Date();
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    const stats = {
      total: this.invoices.length,
      pending: this.invoices.filter(i => i.status === InvoiceStatus.PENDING).length,
      paid: this.invoices.filter(i => i.status === InvoiceStatus.PAID).length,
      overdue: this.invoices.filter(i => i.status === InvoiceStatus.OVERDUE).length,
      cancelled: this.invoices.filter(i => i.status === InvoiceStatus.CANCELLED).length,
      totalAmount: this.invoices.reduce((sum, i) => sum + i.total, 0),
      paidAmount: this.invoices
        .filter(i => i.status === InvoiceStatus.PAID)
        .reduce((sum, i) => sum + i.total, 0),
      pendingAmount: this.invoices
        .filter(i => i.status === InvoiceStatus.PENDING)
        .reduce((sum, i) => sum + i.total, 0),
      overdueAmount: this.invoices
        .filter(i => i.status === InvoiceStatus.OVERDUE)
        .reduce((sum, i) => sum + i.total, 0),
      thisMonthInvoices: this.invoices.filter(i => 
        new Date(i.createdAt) >= thisMonth
      ).length,
      thisMonthAmount: this.invoices
        .filter(i => new Date(i.createdAt) >= thisMonth)
        .reduce((sum, i) => sum + i.total, 0)
    };

    return of(stats).pipe(delay(300));
  }

  // Rechercher des factures
  searchInvoices(query: string): Observable<Invoice[]> {
    const searchTerm = query.toLowerCase();
    const results = this.invoices.filter(invoice =>
      invoice.invoiceNumber.toLowerCase().includes(searchTerm) ||
      invoice.patientName.toLowerCase().includes(searchTerm) ||
      invoice.items.some(item => 
        item.description.toLowerCase().includes(searchTerm)
      )
    );
    
    return of(results).pipe(delay(300));
  }

  // Calculer les totaux pour un formulaire
  calculateTotals(items: any[], discount: number = 0): { subtotal: number; tax: number; total: number } {
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const tax = subtotal * 0.1925;
    const total = subtotal + tax - discount;
    
    return { subtotal, tax, total };
  }

  // Exporter en PDF (simulation)
  exportToPdf(invoiceId: number): Observable<string> {
    // Simulation de génération PDF
    return of(`invoice-${invoiceId}.pdf`).pipe(delay(1000));
  }

  // Envoyer par email (simulation)
  sendByEmail(invoiceId: number, email: string): Observable<boolean> {
    // Simulation d'envoi email
    return of(true).pipe(delay(500));
  }

  // Envoyer une facture par email
  sendInvoiceByEmail(invoiceId: number): Observable<boolean> {
    // Simulation d'envoi par email
    return of(true).pipe(delay(1000));
  }

  // Télécharger une facture en PDF
  downloadInvoicePDF(invoiceId: number): Observable<Blob> {
    // Simulation de génération PDF
    const blob = new Blob(['PDF content'], { type: 'application/pdf' });
    return of(blob).pipe(delay(1000));
  }
} 