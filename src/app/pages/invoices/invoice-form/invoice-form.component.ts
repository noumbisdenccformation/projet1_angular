import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { InvoiceService } from '../../../services/invoice.service';
import { PatientService } from '../../../services/patient.service';
import { Invoice, InvoiceItem } from '../../../models/invoice.model';
import { Patient } from '../../../models/patient.model';

@Component({
  selector: 'app-invoice-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './invoice-form.component.html',
  styleUrls: ['./invoice-form.component.css']
})
export class InvoiceFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private invoiceService = inject(InvoiceService);
  private patientService = inject(PatientService);

  invoiceForm!: FormGroup;
  patients: Patient[] = [];
  isEditMode = false;
  invoiceId: string | null = null;
  loading = false;
  errorMessage = '';

  ngOnInit(): void {
    this.loadPatients();
    this.initializeForm();
    this.checkEditMode();
  }

  private loadPatients(): void {
    this.patientService.getPatients().subscribe({
      next: (patients) => {
        this.patients = patients;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des patients:', error);
        this.errorMessage = 'Erreur lors du chargement des patients';
      }
    });
  }

  private initializeForm(): void {
    this.invoiceForm = this.fb.group({
      patientId: ['', Validators.required],
      invoiceNumber: ['', Validators.required],
      issueDate: ['', Validators.required],
      dueDate: ['', Validators.required],
      status: ['DRAFT', Validators.required],
      notes: [''],
      lines: this.fb.array([])
    });

    // Ajouter une ligne par défaut
    this.addInvoiceLine();
  }

  private checkEditMode(): void {
    this.invoiceId = this.route.snapshot.paramMap.get('id');
    if (this.invoiceId) {
      this.isEditMode = true;
      this.loadInvoice();
    }
  }

  private loadInvoice(): void {
    if (!this.invoiceId) return;

    this.loading = true;
    this.invoiceService.getInvoiceById(+this.invoiceId).subscribe({
      next: (invoice) => {
        if (invoice) {
          this.populateForm(invoice);
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

  private populateForm(invoice: Invoice | undefined): void {
    if (!invoice) {
      this.errorMessage = 'Facture non trouvée';
      return;
    }
    // Vider le tableau des lignes
    while (this.invoiceLines.length !== 0) {
      this.invoiceLines.removeAt(0);
    }

    // Remplir le formulaire
    this.invoiceForm.patchValue({
      patientId: invoice.patientId,
      invoiceNumber: invoice.invoiceNumber,
      issueDate: this.formatDateForInput(invoice.createdAt),
      dueDate: this.formatDateForInput(invoice.dueDate),
      status: invoice.status,
      notes: invoice.notes
    });

    // Ajouter les lignes
    invoice.items.forEach(item => {
      this.invoiceLines.push(this.fb.group({
        description: [item.description, Validators.required],
        quantity: [item.quantity, [Validators.required, Validators.min(1)]],
        unitPrice: [item.unitPrice, [Validators.required, Validators.min(0)]],
        total: [item.total, Validators.required]
      }));
    });
  }

  private formatDateForInput(date: Date | string): string {
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  }

  get invoiceLines(): FormArray {
    return this.invoiceForm.get('lines') as FormArray;
  }

  addInvoiceLine(): void {
    const lineGroup = this.fb.group({
      description: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      unitPrice: [0, [Validators.required, Validators.min(0)]],
      total: [0, Validators.required]
    });

    this.invoiceLines.push(lineGroup);
  }

  removeInvoiceLine(index: number): void {
    if (this.invoiceLines.length > 1) {
      this.invoiceLines.removeAt(index);
    }
  }

  calculateLineTotal(index: number): void {
    const line = this.invoiceLines.at(index);
    const quantity = line.get('quantity')?.value || 0;
    const unitPrice = line.get('unitPrice')?.value || 0;
    const total = quantity * unitPrice;
    line.patchValue({ total: total });
  }

  calculateInvoiceTotal(): number {
    return this.invoiceLines.controls.reduce((total, line) => {
      return total + (line.get('total')?.value || 0);
    }, 0);
  }

  onSubmit(): void {
    if (this.isFormValid()) {
      this.loading = true;
      this.errorMessage = '';

      const formValue = this.invoiceForm.value;
      const invoice: Invoice = {
        id: this.invoiceId ? parseInt(this.invoiceId) : 0,
        patientId: formValue.patientId,
        invoiceNumber: formValue.invoiceNumber,
        issueDate: new Date(formValue.issueDate),
        dueDate: new Date(formValue.dueDate),
        status: formValue.status,
        notes: formValue.notes,
        items: formValue.lines.map((line: any, index: number) => ({
          id: index + 1,
          description: line.description,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          total: line.total
        })),
        subtotal: this.calculateInvoiceTotal(),
        tax: 0,
        discount: 0,
        patientName: this.getPatientName(formValue.patientId),
        total: this.calculateInvoiceTotal(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const operation = this.isEditMode 
        ? this.invoiceService.updateInvoice(invoice.id, invoice)
        : this.invoiceService.createInvoice(invoice);

      operation.subscribe({
        next: () => {
          this.router.navigate(['/invoices']);
        },
        error: (error) => {
          console.error('Erreur lors de la sauvegarde:', error);
          this.errorMessage = 'Erreur lors de la sauvegarde de la facture';
          this.loading = false;
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.invoiceForm.controls).forEach(key => {
      const control = this.invoiceForm.get(key);
      control?.markAsTouched();
    });
  }

  getPatientName(patientId: number): string {
    const patient = this.patients.find(p => p.id === patientId);
    return patient ? `${patient.firstName} ${patient.lastName}` : '';
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.invoiceForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  isLineFieldInvalid(lineIndex: number, fieldName: string): boolean {
    const line = this.invoiceLines.at(lineIndex);
    const field = line.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  // Validation personnalisée pour les champs essentiels
  isFormValid(): boolean {
    const requiredFields = ['patientId', 'invoiceNumber', 'issueDate', 'dueDate', 'status'];
    
    // Vérifier les champs principaux
    const mainFieldsValid = requiredFields.every(field => {
      const control = this.invoiceForm.get(field);
      if (!control || !control.value) return false;
      
      if (typeof control.value === 'string') {
        return control.value.trim() !== '';
      }
      
      return true;
    });

    // Vérifier qu'il y a au moins une ligne valide
    const linesValid = this.invoiceLines.length > 0 && 
      this.invoiceLines.controls.every(line => {
        const description = line.get('description')?.value;
        const quantity = line.get('quantity')?.value;
        const unitPrice = line.get('unitPrice')?.value;
        
        return description && 
               (typeof description === 'string' ? description.trim() !== '' : true) && 
               quantity > 0 && unitPrice >= 0;
      });

    return mainFieldsValid && linesValid;
  }
}
