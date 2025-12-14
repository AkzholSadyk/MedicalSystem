import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CalendarComponent } from '../shared/calendar/calendar.component';
import { TranslateModule } from '@ngx-translate/core';
import { AppointmentService } from '../core/services/appointment.service';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-doctor-calendar',
  template: `
  <h2>{{ 'CALENDAR.DOCTOR_TITLE' | translate }}</h2>
    <app-calendar [events]="events"></app-calendar>
  `,
  standalone: true,
  imports: [CommonModule, CalendarComponent, TranslateModule]
})
export class DoctorCalendarComponent implements OnInit {
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
        if (data && data.length > 0) {
          this.events = data.map(d => ({
            ...d,
            appointment_date: new Date(d.start_time).toISOString().slice(0,10),
            appointment_time: new Date(d.start_time).toTimeString().slice(0,5),
            patient_name: d.patient ? (d.patient.first_name + ' ' + d.patient.last_name) : undefined,
            doctor_name: d.doctor ? (d.doctor.first_name + ' ' + d.doctor.last_name) : undefined,
            patient: d.patient,
            doctor: d.doctor,
          }));
        } else {
          // fallback: fetch doctor's own appointments
          this.apptService.getDoctorAppointments().subscribe({
            next: (appts) => {
              this.events = appts.map(a => ({
                id: a.id,
                start_time: a.appointment_date + 'T' + (a.appointment_time || '00:00'),
                end_time: a.appointment_date + 'T' + (a.appointment_time || '00:00'),
                appointment_date: a.appointment_date,
                appointment_time: a.appointment_time,
                notes: a.notes || a.reason,
                status: a.status,
                patient_name: a.patient_name || (a.patient ? (a.patient.first_name + ' ' + a.patient.last_name) : undefined),
                doctor_name: a.doctor_name,
                patient: a.patient,
                doctor: a.doctor,
                duration: a.duration
              }));
            },
            error: (err) => console.error('Fallback calendar load error', err)
          });
        }
      },
      error: (err) => {
        console.error('Calendar load error', err);
        this.apptService.getDoctorAppointments().subscribe({
          next: (appts) => {
            this.events = appts.map(a => ({
              id: a.id,
              start_time: a.appointment_date + 'T' + (a.appointment_time || '00:00'),
              end_time: a.appointment_date + 'T' + (a.appointment_time || '00:00'),
              appointment_date: a.appointment_date,
              appointment_time: a.appointment_time,
              notes: a.notes || a.reason,
              status: a.status,
              patient_name: a.patient_name || (a.patient ? (a.patient.first_name + ' ' + a.patient.last_name) : undefined),
              doctor_name: a.doctor_name,
              patient: a.patient,
              doctor: a.doctor,
              duration: a.duration
            }));
          },
          error: (err) => console.error('Fallback calendar load error', err)
        });
      }
    });
  }

  onEvent(e:any) {
    // handled by CalendarComponent dialog; nothing else for now
  }
}
