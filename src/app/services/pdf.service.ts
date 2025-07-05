import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Patient } from '../models/patient.model';
import { Appointment } from '../models/appointment.model';

@Injectable({
  providedIn: 'root'
})
export class PdfService {

  constructor() { }

  // Générer une prescription PDF
  generatePrescriptionPDF(prescription: any, patient: Patient, doctor: any): Observable<Blob> {
    // Simuler la génération d'un PDF
    const pdfContent = this.createPrescriptionContent(prescription, patient, doctor);
    const blob = new Blob([pdfContent], { type: 'application/pdf' });
    return of(blob);
  }

  // Générer une facture PDF
  generateInvoicePDF(invoice: any, patient: Patient): Observable<Blob> {
    const pdfContent = this.createInvoiceContent(invoice, patient);
    const blob = new Blob([pdfContent], { type: 'application/pdf' });
    return of(blob);
  }

  // Générer un rapport médical PDF
  generateMedicalReportPDF(patient: Patient, appointments: Appointment[]): Observable<Blob> {
    const pdfContent = this.createMedicalReportContent(patient, appointments);
    const blob = new Blob([pdfContent], { type: 'application/pdf' });
    return of(blob);
  }

  // Télécharger un PDF
  downloadPDF(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  // Prévisualiser un PDF
  previewPDF(blob: Blob): void {
    const url = window.URL.createObjectURL(blob);
    window.open(url, '_blank');
  }

  private createPrescriptionContent(prescription: any, patient: Patient, doctor: any): string {
    return `
%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
/Font <<
/F1 5 0 R
>>
>>
>>
endobj

4 0 obj
<<
/Length 1000
>>
stream
BT
/F1 12 Tf
50 750 Td
(PRESCRIPTION MEDICALE) Tj
0 -30 Td
(Date: ${new Date().toLocaleDateString('fr-FR')}) Tj
0 -20 Td
(Patient: ${patient.firstName} ${patient.lastName}) Tj
0 -20 Td
(Date de naissance: ${patient.dateOfBirth.toLocaleDateString('fr-FR')}) Tj
0 -20 Td
(Adresse: ${patient.address}, ${patient.city}) Tj
0 -40 Td
(Médecin: ${doctor.name || 'Dr. Exemple'}) Tj
0 -40 Td
(PRESCRIPTION:) Tj
0 -20 Td
(${prescription.medications || 'Médicaments prescrits'}) Tj
0 -40 Td
(Instructions: ${prescription.instructions || 'Suivre les indications'}) Tj
0 -40 Td
(Signature du médecin: ________________) Tj
ET
endstream
endobj

5 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj

xref
0 6
0000000000 65535 f 
0000000010 00000 n 
0000000079 00000 n 
0000000173 00000 n 
0000000301 00000 n 
0000001350 00000 n 
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
1408
%%EOF
    `;
  }

  private createInvoiceContent(invoice: any, patient: Patient): string {
    return `
%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
/Font <<
/F1 5 0 R
>>
>>
>>
endobj

4 0 obj
<<
/Length 1200
>>
stream
BT
/F1 12 Tf
50 750 Td
(FACTURE MEDICALE) Tj
0 -30 Td
(Numéro: ${invoice.number || 'FAC-001'}) Tj
0 -20 Td
(Date: ${new Date().toLocaleDateString('fr-FR')}) Tj
0 -40 Td
(PATIENT:) Tj
0 -20 Td
(${patient.firstName} ${patient.lastName}) Tj
0 -20 Td
(${patient.address}) Tj
0 -20 Td
(${patient.postalCode} ${patient.city}) Tj
0 -40 Td
(DETAILS DE LA FACTURE:) Tj
0 -20 Td
(Consultation: ${invoice.consultationFee || '50.00'} €) Tj
0 -20 Td
(Actes médicaux: ${invoice.medicalActs || '0.00'} €) Tj
0 -20 Td
(Médicaments: ${invoice.medications || '0.00'} €) Tj
0 -30 Td
(TOTAL: ${invoice.total || '50.00'} €) Tj
0 -40 Td
(Mode de paiement: ${invoice.paymentMethod || 'À définir'}) Tj
0 -20 Td
(Statut: ${invoice.status || 'En attente'}) Tj
ET
endstream
endobj

5 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj

xref
0 6
0000000000 65535 f 
0000000010 00000 n 
0000000079 00000 n 
0000000173 00000 n 
0000000301 00000 n 
0000001550 00000 n 
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
1608
%%EOF
    `;
  }

  private createMedicalReportContent(patient: Patient, appointments: Appointment[]): string {
    return `
%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
/Font <<
/F1 5 0 R
>>
>>
>>
endobj

4 0 obj
<<
/Length 1500
>>
stream
BT
/F1 12 Tf
50 750 Td
(RAPPORT MEDICAL) Tj
0 -30 Td
(Date: ${new Date().toLocaleDateString('fr-FR')}) Tj
0 -40 Td
(INFORMATIONS PATIENT:) Tj
0 -20 Td
(Nom: ${patient.firstName} ${patient.lastName}) Tj
0 -20 Td
(Date de naissance: ${patient.dateOfBirth.toLocaleDateString('fr-FR')}) Tj
0 -20 Td
(Numéro de dossier: ${patient.fileNumber}) Tj
0 -20 Td
(Téléphone: ${patient.phone}) Tj
0 -40 Td
(ANTECEDENTS MEDICAUX:) Tj
0 -20 Td
(Allergies: ${patient.medicalHistory.allergies.join(', ') || 'Aucune'}) Tj
0 -20 Td
(Maladies chroniques: ${patient.medicalHistory.chronicDiseases.join(', ') || 'Aucune'}) Tj
0 -20 Td
(Chirurgies: ${patient.medicalHistory.surgeries.join(', ') || 'Aucune'}) Tj
0 -20 Td
(Médicaments: ${patient.medicalHistory.medications.join(', ') || 'Aucun'}) Tj
0 -40 Td
(HISTORIQUE DES CONSULTATIONS:) Tj
0 -20 Td
(Nombre de consultations: ${appointments.length}) Tj
0 -20 Td
(Dernière consultation: ${appointments.length > 0 ? appointments[appointments.length - 1].date.toLocaleDateString('fr-FR') : 'Aucune'}) Tj
ET
endstream
endobj

5 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj

xref
0 6
0000000000 65535 f 
0000000010 00000 n 
0000000079 00000 n 
0000000173 00000 n 
0000000301 00000 n 
0000001850 00000 n 
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
1908
%%EOF
    `;
  }

  // Méthode utilitaire pour créer un PDF simple avec jsPDF (si installé)
  createSimplePDF(title: string, content: string[]): Observable<Blob> {
    // Cette méthode nécessiterait jsPDF pour une vraie implémentation
    // Pour l'instant, on simule avec du texte
    const pdfText = `${title}\n\n${content.join('\n')}`;
    const blob = new Blob([pdfText], { type: 'text/plain' });
    return of(blob);
  }

  // Générer un certificat médical
  generateMedicalCertificate(patient: Patient, doctor: any, reason: string, duration: string): Observable<Blob> {
    const content = `
CERTIFICAT MEDICAL

Je soussigné(e) ${doctor.name || 'Dr. Exemple'}, Docteur en Médecine,
certifie avoir examiné ce jour ${patient.firstName} ${patient.lastName},
né(e) le ${patient.dateOfBirth.toLocaleDateString('fr-FR')}.

Motif: ${reason}

Durée d'arrêt recommandée: ${duration}

Fait à ${patient.city}, le ${new Date().toLocaleDateString('fr-FR')}

Signature du médecin
    `;

    const blob = new Blob([content], { type: 'text/plain' });
    return of(blob);
  }
}