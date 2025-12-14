import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CalendarComponent } from '../shared/calendar/calendar.component';
import { AppointmentService } from '../core/services/appointment.service';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-patient-calendar',
  template: `
    <h2>Patient Calendar</h2>
    <app-calendar [events]="events"></app-calendar>
  `,
  standalone: true,
  imports: [CommonModule, CalendarComponent]
})
export class PatientCalendarComponent implements OnInit {
  events: any[] = [];
  startDate = new Date();

  constructor(private apptService: AppointmentService, private auth: AuthService) {}

  ngOnInit(): void {
    const from = new Date();
    const to = new Date();
    to.setDate(from.getDate() + 30);
    const fromS = from.toISOString().slice(0,10);
    const toS = to.toISOString().slice(0,10);
    this.apptService.getCalendarAppointments(fromS, toS).subscribe({
      next: (data:any[]) => {
        this.events = data.map(d => ({
          ...d,
          appointment_date: new Date(d.start_time).toISOString().slice(0,10),
          appointment_time: new Date(d.start_time).toTimeString().slice(0,5),
          patient_name: d.patient ? (d.patient.first_name + ' ' + d.patient.last_name) : undefined,
          doctor_name: d.doctor ? (d.doctor.first_name + ' ' + d.doctor.last_name) : undefined,
          patient: d.patient,
          doctor: d.doctor,
        }));
      },
      error: (err) => console.error('Calendar load error', err)
    });
  }

  onEvent(e:any) {
    // handled by CalendarComponent dialog; nothing else for now
  }
}
