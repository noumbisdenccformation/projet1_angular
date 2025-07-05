import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule } from '@angular/forms';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, EventInput, DateSelectArg, EventClickArg, EventApi } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import frLocale from '@fullcalendar/core/locales/fr';
import { Appointment, AppointmentStatus, AppointmentType } from '../../../models/appointment.model';
import { AppointmentService } from '../../../services/appointment.service';
import { AuthService } from '../../../services/auth.service';
import { UserRole } from '../../../models/user.model';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    FormsModule,
    FullCalendarModule
  ],
  templateUrl: './calendar.component.html',
  styleUrl: './calendar.component.css'
})
export class CalendarComponent implements OnInit {
  @ViewChild('calendar') calendarComponent: any;

  // Configuration du calendrier
  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin],
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
    },
    initialView: 'timeGridWeek',
    locale: frLocale,
    height: 'auto',
    editable: true,
    selectable: true,
    selectMirror: true,
    dayMaxEvents: true,
    weekends: true,
    businessHours: {
      daysOfWeek: [1, 2, 3, 4, 5], // Lundi à vendredi
      startTime: '08:00',
      endTime: '18:00',
    },
    slotMinTime: '07:00:00',
    slotMaxTime: '20:00:00',
    slotDuration: '00:30:00',
    allDaySlot: false,
    select: this.handleDateSelect.bind(this),
    eventClick: this.handleEventClick.bind(this),
    eventDrop: this.handleEventDrop.bind(this),
    eventResize: this.handleEventResize.bind(this),
    eventDidMount: this.handleEventDidMount.bind(this),
    loading: (isLoading: boolean) => {
      this.loading = isLoading;
    }
  };

  // États
  loading = false;
  appointments: Appointment[] = [];
  selectedDoctor: number | null = null;
  selectedView: string = 'timeGridWeek';

  // Filtres
  doctors: any[] = [
    { id: 1, name: 'Dr. Martin', specialty: 'Médecine générale' },
    { id: 2, name: 'Dr. Dubois', specialty: 'Cardiologie' },
    { id: 3, name: 'Dr. Bernard', specialty: 'Dermatologie' }
  ];

  // Rôles
  UserRole = UserRole;

  constructor(
    private appointmentService: AppointmentService,
    public authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadAppointments();
    this.setupCalendarForUser();
  }

  private setupCalendarForUser(): void {
    // Si l'utilisateur est un médecin, filtrer automatiquement par son ID
    if (this.authService.isDoctor() && this.authService.currentUser) {
      this.selectedDoctor = this.authService.currentUser.id;
    }
  }

  private loadAppointments(): void {
    this.loading = true;
    this.appointmentService.getAppointments().subscribe({
      next: (appointments) => {
        this.appointments = appointments;
        this.updateCalendarEvents();
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des rendez-vous:', error);
        this.snackBar.open('Erreur lors du chargement des rendez-vous', 'Fermer', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  private updateCalendarEvents(): void {
    let filteredAppointments = this.appointments;

    // Filtrer par médecin si sélectionné
    if (this.selectedDoctor) {
      filteredAppointments = filteredAppointments.filter(a => a.doctorId === this.selectedDoctor);
    }

    // Convertir les rendez-vous en événements FullCalendar
    const events: EventInput[] = filteredAppointments.map(appointment => ({
      id: appointment.id.toString(),
      title: `${appointment.patientName} - ${this.getTypeDisplayName(appointment.type)}`,
      start: this.combineDateAndTime(appointment.date, appointment.startTime),
      end: this.combineDateAndTime(appointment.date, appointment.endTime),
      backgroundColor: this.getEventColor(appointment.status),
      borderColor: this.getEventColor(appointment.status),
      textColor: '#ffffff',
      extendedProps: {
        appointment: appointment,
        status: appointment.status,
        type: appointment.type,
        room: appointment.room,
        notes: appointment.notes
      }
    }));

    // Mettre à jour les événements du calendrier
    if (this.calendarComponent) {
      this.calendarComponent.getApi().removeAllEvents();
      this.calendarComponent.getApi().addEventSource(events);
    }
  }

  private combineDateAndTime(date: Date, time: string): string {
    const dateStr = date.toISOString().split('T')[0];
    return `${dateStr}T${time}:00`;
  }

  private getEventColor(status: AppointmentStatus): string {
    switch (status) {
      case AppointmentStatus.CONFIRMED:
        return '#4caf50'; // Vert
      case AppointmentStatus.SCHEDULED:
        return '#2196f3'; // Bleu
      case AppointmentStatus.IN_PROGRESS:
        return '#ff9800'; // Orange
      case AppointmentStatus.COMPLETED:
        return '#9c27b0'; // Violet
      case AppointmentStatus.CANCELLED:
        return '#f44336'; // Rouge
      case AppointmentStatus.NO_SHOW:
        return '#795548'; // Marron
      default:
        return '#607d8b'; // Gris
    }
  }

  private getTypeDisplayName(type: AppointmentType): string {
    switch (type) {
      case AppointmentType.CONSULTATION:
        return 'Consultation';
      case AppointmentType.FOLLOW_UP:
        return 'Suivi';
      case AppointmentType.EMERGENCY:
        return 'Urgence';
      case AppointmentType.SURGERY:
        return 'Chirurgie';
      case AppointmentType.LAB_TEST:
        return 'Analyse';
      case AppointmentType.IMAGING:
        return 'Imagerie';
      default:
        return type;
    }
  }

  // Gestionnaires d'événements FullCalendar
  handleDateSelect(selectInfo: DateSelectArg): void {
    // Ouvrir le formulaire de création de rendez-vous avec la date/heure pré-remplies
    const startDate = selectInfo.start;
    const endDate = selectInfo.end;
    
    // Calculer l'heure de fin (30 minutes par défaut)
    const defaultEnd = new Date(startDate);
    defaultEnd.setMinutes(defaultEnd.getMinutes() + 30);
    
    // Naviguer vers le formulaire avec les paramètres
    this.router.navigate(['/appointments/new'], {
      queryParams: {
        date: startDate.toISOString().split('T')[0],
        startTime: startDate.toTimeString().slice(0, 5),
        endTime: defaultEnd.toTimeString().slice(0, 5),
        doctorId: this.selectedDoctor || ''
      }
    });
  }

  handleEventClick(clickInfo: EventClickArg): void {
    const appointmentId = parseInt(clickInfo.event.id);
    
    // Vérifier les permissions
    if (this.canEditAppointment(appointmentId)) {
      this.router.navigate(['/appointments', appointmentId, 'edit']);
    } else {
      // Afficher les détails en lecture seule
      this.showAppointmentDetails(clickInfo.event);
    }
  }

  handleEventDrop(dropInfo: any): void {
    const appointmentId = parseInt(dropInfo.event.id);
    const newStart = dropInfo.event.start;
    const newEnd = dropInfo.event.end;
    
    // Vérifier les permissions
    if (!this.canEditAppointment(appointmentId)) {
      dropInfo.revert();
      this.snackBar.open('Vous n\'avez pas les permissions pour modifier ce rendez-vous', 'Fermer', { duration: 3000 });
      return;
    }

    // Mettre à jour le rendez-vous
    const updates = {
      date: newStart,
      startTime: newStart.toTimeString().slice(0, 5),
      endTime: newEnd.toTimeString().slice(0, 5)
    };

    this.appointmentService.updateAppointment(appointmentId, updates).subscribe({
      next: () => {
        this.snackBar.open('Rendez-vous mis à jour avec succès', 'Fermer', { duration: 3000 });
        this.loadAppointments();
      },
      error: (error) => {
        dropInfo.revert();
        console.error('Erreur lors de la mise à jour:', error);
        this.snackBar.open(error.message || 'Erreur lors de la mise à jour', 'Fermer', { duration: 3000 });
      }
    });
  }

  handleEventResize(resizeInfo: any): void {
    const appointmentId = parseInt(resizeInfo.event.id);
    const newStart = resizeInfo.event.start;
    const newEnd = resizeInfo.event.end;
    
    // Vérifier les permissions
    if (!this.canEditAppointment(appointmentId)) {
      resizeInfo.revert();
      this.snackBar.open('Vous n\'avez pas les permissions pour modifier ce rendez-vous', 'Fermer', { duration: 3000 });
      return;
    }

    // Mettre à jour le rendez-vous
    const updates = {
      startTime: newStart.toTimeString().slice(0, 5),
      endTime: newEnd.toTimeString().slice(0, 5)
    };

    this.appointmentService.updateAppointment(appointmentId, updates).subscribe({
      next: () => {
        this.snackBar.open('Rendez-vous mis à jour avec succès', 'Fermer', { duration: 3000 });
        this.loadAppointments();
      },
      error: (error) => {
        resizeInfo.revert();
        console.error('Erreur lors de la mise à jour:', error);
        this.snackBar.open(error.message || 'Erreur lors de la mise à jour', 'Fermer', { duration: 3000 });
      }
    });
  }

  handleEventDidMount(info: any): void {
    // Ajouter des tooltips ou des styles personnalisés si nécessaire
    const event = info.event;
    const appointment = event.extendedProps['appointment'];
    
    // Ajouter des informations supplémentaires au survol
    if (appointment.notes) {
      info.el.title = `${event.title}\nSalle: ${appointment.room}\nNotes: ${appointment.notes}`;
    } else {
      info.el.title = `${event.title}\nSalle: ${appointment.room}`;
    }
  }

  // Méthodes utilitaires
  onDoctorChange(): void {
    this.updateCalendarEvents();
  }

  onViewChange(): void {
    if (this.calendarComponent) {
      this.calendarComponent.getApi().changeView(this.selectedView);
    }
  }

  canEditAppointment(appointmentId: number): boolean {
    const appointment = this.appointments.find(a => a.id === appointmentId);
    if (!appointment) return false;

    return this.authService.hasAnyRole([UserRole.ADMIN, UserRole.SECRETARY]) ||
           (this.authService.isDoctor() && appointment.doctorId === this.authService.currentUser?.id);
  }

  showAppointmentDetails(event: EventApi): void {
    const appointment = event.extendedProps['appointment'];
    const message = `
      Patient: ${appointment.patientName}
      Médecin: ${appointment.doctorName}
      Type: ${this.getTypeDisplayName(appointment.type)}
      Salle: ${appointment.room}
      Statut: ${this.getStatusDisplayName(appointment.status)}
      ${appointment.notes ? `Notes: ${appointment.notes}` : ''}
    `;
    
    this.snackBar.open(message, 'Fermer', { duration: 5000 });
  }

  getStatusDisplayName(status: AppointmentStatus): string {
    switch (status) {
      case AppointmentStatus.SCHEDULED:
        return 'Programmé';
      case AppointmentStatus.CONFIRMED:
        return 'Confirmé';
      case AppointmentStatus.IN_PROGRESS:
        return 'En cours';
      case AppointmentStatus.COMPLETED:
        return 'Terminé';
      case AppointmentStatus.CANCELLED:
        return 'Annulé';
      case AppointmentStatus.NO_SHOW:
        return 'Absent';
      default:
        return status;
    }
  }

  // Navigation
  goToToday(): void {
    if (this.calendarComponent) {
      this.calendarComponent.getApi().today();
    }
  }

  goToNext(): void {
    if (this.calendarComponent) {
      this.calendarComponent.getApi().next();
    }
  }

  goToPrev(): void {
    if (this.calendarComponent) {
      this.calendarComponent.getApi().prev();
    }
  }
}
