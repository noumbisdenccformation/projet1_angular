import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { roleGuard } from './guards/role.guard';
import { UserRole } from './models/user.model';
import { LoginComponent } from './pages/login/login.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { PatientListComponent } from './pages/patients/patient-list/patient-list.component';
import { PatientFormComponent } from './pages/patients/patient-form/patient-form.component';

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
      }
      // Autres routes patients à implémenter plus tard
    ]
  },
  
  // Routes pour les rendez-vous (à implémenter)
  /*
  {
    path: 'appointments',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        component: () => import('./pages/appointments/appointment-list/appointment-list.component').then(m => m.AppointmentListComponent),
        canActivate: [roleGuard],
        data: { roles: [UserRole.ADMIN, UserRole.DOCTOR, UserRole.SECRETARY] }
      },
      {
        path: 'new',
        component: () => import('./pages/appointments/appointment-form/appointment-form.component').then(m => m.AppointmentFormComponent),
        canActivate: [roleGuard],
        data: { roles: [UserRole.ADMIN, UserRole.SECRETARY] }
      },
      {
        path: ':id',
        component: () => import('./pages/appointments/appointment-detail/appointment-detail.component').then(m => m.AppointmentDetailComponent),
        canActivate: [roleGuard],
        data: { roles: [UserRole.ADMIN, UserRole.DOCTOR, UserRole.SECRETARY] }
      },
      {
        path: ':id/edit',
        component: () => import('./pages/appointments/appointment-form/appointment-form.component').then(m => m.AppointmentFormComponent),
        canActivate: [roleGuard],
        data: { roles: [UserRole.ADMIN, UserRole.SECRETARY] }
      }
    ]
  },
  */
  
  // Routes pour le calendrier (à implémenter)
  /*
  {
    path: 'calendar',
    component: () => import('./pages/calendar/calendar.component').then(m => m.CalendarComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: [UserRole.ADMIN, UserRole.DOCTOR, UserRole.SECRETARY] }
  },
  */
  
  // Routes pour les prescriptions (à implémenter)
  /*
  {
    path: 'prescriptions',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        component: () => import('./pages/prescriptions/prescription-list/prescription-list.component').then(m => m.PrescriptionListComponent),
        canActivate: [roleGuard],
        data: { roles: [UserRole.ADMIN, UserRole.DOCTOR] }
      },
      {
        path: 'new',
        component: () => import('./pages/prescriptions/prescription-form/prescription-form.component').then(m => m.PrescriptionFormComponent),
        canActivate: [roleGuard],
        data: { roles: [UserRole.DOCTOR] }
      },
      {
        path: ':id',
        component: () => import('./pages/prescriptions/prescription-detail/prescription-detail.component').then(m => m.PrescriptionDetailComponent),
        canActivate: [roleGuard],
        data: { roles: [UserRole.ADMIN, UserRole.DOCTOR] }
      }
    ]
  },
  */
  
  // Routes pour les factures (à implémenter)
  /*
  {
    path: 'invoices',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        component: () => import('./pages/invoices/invoice-list/invoice-list.component').then(m => m.InvoiceListComponent),
        canActivate: [roleGuard],
        data: { roles: [UserRole.ADMIN, UserRole.SECRETARY] }
      },
      {
        path: 'new',
        component: () => import('./pages/invoices/invoice-form/invoice-form.component').then(m => m.InvoiceFormComponent),
        canActivate: [roleGuard],
        data: { roles: [UserRole.ADMIN, UserRole.SECRETARY] }
      },
      {
        path: ':id',
        component: () => import('./pages/invoices/invoice-detail/invoice-detail.component').then(m => m.InvoiceDetailComponent),
        canActivate: [roleGuard],
        data: { roles: [UserRole.ADMIN, UserRole.SECRETARY] }
      }
    ]
  },
  */
  
  // Routes pour le chat (à implémenter)
  /*
  {
    path: 'chat',
    component: () => import('./pages/chat/chat.component').then(m => m.ChatComponent),
    canActivate: [authGuard]
  },
  */
  
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
