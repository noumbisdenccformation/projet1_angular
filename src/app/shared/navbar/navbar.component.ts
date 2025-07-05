import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '../../services/auth.service';
import { User, UserRole } from '../../models/user.model';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatBadgeModule,
    MatDividerModule
  ],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent implements OnInit {
  currentUser: User | null = null;
  UserRole = UserRole; // Pour l'utiliser dans le template

  constructor(
    public authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  getDisplayName(): string {
    if (!this.currentUser) return '';
    return `${this.currentUser.firstName} ${this.currentUser.lastName}`;
  }

  getRoleDisplayName(role: UserRole): string {
    switch (role) {
      case UserRole.ADMIN: return 'Administrateur';
      case UserRole.DOCTOR: return 'Médecin';
      case UserRole.SECRETARY: return 'Secrétaire';
      default: return role;
    }
  }
} 