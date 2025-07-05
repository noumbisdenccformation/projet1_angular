import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatGridListModule } from '@angular/material/grid-list';
import { AuthService } from '../../services/auth.service';
import { PatientService } from '../../services/patient.service';
import { UserRole } from '../../models/user.model';
import { Patient } from '../../models/patient.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatGridListModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  currentUser: any = null;
  UserRole = UserRole;
  currentDate = new Date();
  
  // Statistiques
  totalPatients = 0;
  todayAppointments = 0;
  pendingInvoices = 0;
  monthlyRevenue = 0;

  // Données pour les graphiques
  recentPatients: Patient[] = [];
  upcomingAppointments: any[] = [];

  constructor(
    public authService: AuthService,
    private patientService: PatientService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.loadDashboardData();
    });
  }

  private loadDashboardData(): void {
    // Charger les patients
    this.patientService.getPatients().subscribe(patients => {
      this.totalPatients = patients.length;
      this.recentPatients = patients.slice(-5); // 5 derniers patients
    });

    // Données mockées pour les autres statistiques
    this.todayAppointments = 8;
    this.pendingInvoices = 12;
    this.monthlyRevenue = 45000;

    // Rendez-vous à venir (mock)
    this.upcomingAppointments = [
      {
        id: 1,
        patientName: 'Marie Dubois',
        time: '09:00',
        type: 'Consultation',
        doctor: 'Dr. Martin'
      },
      {
        id: 2,
        patientName: 'Pierre Martin',
        time: '10:30',
        type: 'Suivi',
        doctor: 'Dr. Dubois'
      },
      {
        id: 3,
        patientName: 'Sophie Bernard',
        time: '14:00',
        type: 'Consultation',
        doctor: 'Dr. Martin'
      }
    ];
  }

  getWelcomeMessage(): string {
    const hour = new Date().getHours();
    let greeting = '';
    
    if (hour < 12) {
      greeting = 'Bonjour';
    } else if (hour < 18) {
      greeting = 'Bon après-midi';
    } else {
      greeting = 'Bonsoir';
    }

    return `${greeting}, ${this.currentUser?.firstName || 'Utilisateur'} !`;
  }

  getRoleDisplayName(): string {
    if (!this.currentUser) return '';
    
    switch (this.currentUser.role) {
      case UserRole.ADMIN: return 'Administrateur';
      case UserRole.DOCTOR: return 'Médecin';
      case UserRole.SECRETARY: return 'Secrétaire';
      default: return this.currentUser.role;
    }
  }
}
