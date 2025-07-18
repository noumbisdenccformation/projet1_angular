import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { roleGuard } from './guards/role.guard';
import { UserRole } from './models/user.model';
import { LoginComponent } from './pages/login/login.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { PatientListComponent } from './pages/patients/patient-list/patient-list.component';
import { PatientFormComponent } from './pages/patients/patient-form/patient-form.component';
import { AppointmentListComponent } from './pages/appointments/appointment-list/appointment-list.component';
import { AppointmentFormComponent } from './pages/appointments/appointment-form/appointment-form.component';
import { CalendarComponent } from './pages/calendar/calendar/calendar.component';
import { PrescriptionListComponent } from './pages/prescriptions/prescription-list/prescription-list.component';
import { PrescriptionFormComponent } from './pages/prescriptions/prescription-form/prescription-form.component';
import { InvoiceListComponent } from './pages/invoices/invoice-list/invoice-list.component';
import { InvoiceFormComponent } from './pages/invoices/invoice-form/invoice-form.component';
import { InvoiceDetailComponent } from './pages/invoices/invoice-detail/invoice-detail.component';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard]
  },
  
  // Routes pour les patients
  {
    path: 'patients',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        component: PatientListComponent,
        canActivate: [roleGuard],
        data: { roles: [UserRole.ADMIN, UserRole.DOCTOR, UserRole.SECRETARY] }
      },
      {
        path: 'new',
        component: PatientFormComponent,
        canActivate: [roleGuard],
        data: { roles: [UserRole.ADMIN, UserRole.DOCTOR, UserRole.SECRETARY] }
      },
      {
        path: ':id/edit',
        component: PatientFormComponent,
        canActivate: [roleGuard],
        data: { roles: [UserRole.ADMIN, UserRole.DOCTOR, UserRole.SECRETARY] }
      },
      {
        path: ':id',
        loadComponent: () => import('./pages/patients/patient-detail/patient-detail.component').then(m => m.PatientDetailComponent),
        canActivate: [roleGuard],
        data: { roles: [UserRole.ADMIN, UserRole.DOCTOR, UserRole.SECRETARY] }
      }
    ]
  },
  
  // Routes pour les rendez-vous
  {
    path: 'appointments',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        component: AppointmentListComponent,
        canActivate: [roleGuard],
        data: { roles: [UserRole.ADMIN, UserRole.DOCTOR, UserRole.SECRETARY] }
      },
      {
        path: 'new',
        component: AppointmentFormComponent,
        canActivate: [roleGuard],
        data: { roles: [UserRole.ADMIN, UserRole.SECRETARY] }
      },
      {
        path: ':id/edit',
        component: AppointmentFormComponent,
        canActivate: [roleGuard],
        data: { roles: [UserRole.ADMIN, UserRole.SECRETARY] }
      }
    ]
  },
  
  // Routes pour le calendrier
  {
    path: 'calendar',
    component: CalendarComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: [UserRole.ADMIN, UserRole.DOCTOR, UserRole.SECRETARY] }
  },
  
  // Routes pour les prescriptions
  {
    path: 'prescriptions',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        component: PrescriptionListComponent,
        canActivate: [roleGuard],
        data: { roles: [UserRole.ADMIN, UserRole.DOCTOR] }
      },
      {
        path: 'new',
        component: PrescriptionFormComponent,
        canActivate: [roleGuard],
        data: { roles: [UserRole.ADMIN, UserRole.DOCTOR] }
      },
      {
        path: ':id/edit',
        component: PrescriptionFormComponent,
        canActivate: [roleGuard],
        data: { roles: [UserRole.ADMIN, UserRole.DOCTOR] }
      }
    ]
  },
  
  // Routes pour les factures
  {
    path: 'invoices',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        component: InvoiceListComponent,
        canActivate: [roleGuard],
        data: { roles: [UserRole.ADMIN, UserRole.SECRETARY] }
      },
      {
        path: 'new',
        component: InvoiceFormComponent,
        canActivate: [roleGuard],
        data: { roles: [UserRole.ADMIN, UserRole.SECRETARY] }
      },
      {
        path: ':id/edit',
        component: InvoiceFormComponent,
        canActivate: [roleGuard],
        data: { roles: [UserRole.ADMIN, UserRole.SECRETARY] }
      },
      {
        path: ':id',
        component: InvoiceDetailComponent,
        canActivate: [roleGuard],
        data: { roles: [UserRole.ADMIN, UserRole.SECRETARY] }
      }
    ]
  },
  
  // Routes pour le chat
  {
    path: 'chat',
    loadComponent: () => import('./pages/chat/chat.component').then(m => m.ChatComponent),
    canActivate: [authGuard]
  },
  
  // Routes pour l'administration (à implémenter)
  /*
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard],
    data: { roles: [UserRole.ADMIN] },
    children: [
      {
        path: 'users',
        component: () => import('./pages/admin/user-management/user-management.component').then(m => m.UserManagementComponent)
      },
      {
        path: 'statistics',
        component: () => import('./pages/admin/statistics/statistics.component').then(m => m.StatisticsComponent)
      }
    ]
  },
  */
  
  { path: '**', redirectTo: '/login' }
];
