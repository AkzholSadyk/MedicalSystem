import { Component, OnInit } from '@angular/core';
import { DashboardService, DashboardStats } from '../../core/services/dashboard.service';
import { AppointmentService } from '../../core/services/appointment.service';
import { Appointment } from '../../core/models/appointment.model';


import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatOptionModule } from '@angular/material/core';
import { TranslateModule } from '@ngx-translate/core';



@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,

    MatProgressSpinnerModule,
    MatExpansionModule,
    MatPaginatorModule,
    MatSortModule,
    MatTableModule,
    MatInputModule,

    ReactiveFormsModule,
    MatCardModule,
    MatIconModule,
    MatDividerModule,
    MatListModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatGridListModule,
    MatOptionModule
  ,
  TranslateModule
  ]
})
export class DashboardComponent implements OnInit {
  stats: DashboardStats | null = null;
  loading = true;
  upcoming: Appointment[] = [];
  past: Appointment[] = [];
  calendarDays: { date: Date; label: string; appointments: Appointment[] }[] = [];

  constructor(private dashboardService: DashboardService, private appointmentService: AppointmentService) { }

  ngOnInit(): void {
    this.dashboardService.getPatientStats().subscribe({
      next: (data) => {
        this.stats = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching patient stats', err);
        this.loading = false;
      }
    });

    // load appointments for dashboard (simple upcoming/past separation)
    this.appointmentService.getPatientAppointments().subscribe({
      next: (data: Appointment[]) => {
        const now = new Date();
        this.upcoming = data.filter(a => new Date(a.appointment_date) >= now);
        this.past = data.filter(a => new Date(a.appointment_date) < now).sort((a,b) => +new Date(b.appointment_date) - +new Date(a.appointment_date));

        // build a 7-day calendar starting today
        this.calendarDays = [];
        for (let i = 0; i < 7; i++) {
          const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
          const dayAppointments = this.upcoming.filter(a => new Date(a.appointment_date).toDateString() === d.toDateString());
          const label = d.toLocaleDateString(undefined, { weekday: 'short', day: '2-digit' });
          this.calendarDays.push({ date: d, label, appointments: dayAppointments });
        }
      },
      error: (err) => {
        console.error('Error loading appointments for dashboard', err);
      }
    });
  }
}
