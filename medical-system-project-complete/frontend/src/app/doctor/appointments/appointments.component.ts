import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { AppointmentService } from '../../core/services/appointment.service';
import { Appointment } from '../../core/models/appointment.model';
import { PatientService } from '../../core/services/patient.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-appointments',
  templateUrl: './appointments.component.html',
  styleUrls: ['./appointments.component.css']
})
export class AppointmentsComponent implements OnInit {
  displayedColumns: string[] = ['patient_name', 'appointment_date', 'reason', 'status', 'actions'];
  dataSource!: MatTableDataSource<Appointment>;
  loading = true;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private appointmentService: AppointmentService, private patientService: PatientService) { }

  ngOnInit(): void {
    this.loadAppointments();
  }

  loadAppointments(): void {
    this.loading = true;
    this.appointmentService.getDoctorAppointments().subscribe({
      next: (data) => {
        const uniquePatientIds = Array.from(new Set(data.map(a => a.patient_id).filter(Boolean)));
        if (uniquePatientIds.length === 0) {
          this.finalizeDataSource(data);
          return;
        }

        const requests = uniquePatientIds.map(id => this.patientService.getPatientById(id));
        forkJoin(requests).subscribe({
          next: (patients) => {
            const patientMap: Record<number, any> = {};
            patients.forEach(p => { if (p && (p as any).id) patientMap[(p as any).id] = p; });
            const enriched = data.map(a => {
              const p = patientMap[a.patient_id];
              if (p) return { ...a, patient: { first_name: p.first_name, last_name: p.last_name }, patient_name: `${p.first_name} ${p.last_name}` };
              return a;
            });
            this.finalizeDataSource(enriched);
          },
          error: (err) => {
            console.warn('Failed fetching patients, using raw appointments', err);
            this.finalizeDataSource(data);
          }
        });
      },
      error: (err) => {
        console.error('Error loading appointments', err);
        this.loading = false;
      }
    });
  }

  private finalizeDataSource(records: Appointment[]) {
    this.dataSource = new MatTableDataSource(records);
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.loading = false;
  }

  getPatientDisplayName(a: Appointment): string {
    if (!a) return '';
    // Prefer the nested patient object, then precomputed patient_name, then id
    if (a.patient && (a.patient.first_name || a.patient.last_name)) {
      return `${a.patient.first_name || ''} ${a.patient.last_name || ''}`.trim();
    }
  if (a.patient_name) return a.patient_name;
  return a.patient_id != null ? String(a.patient_id) : 'Unknown';
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  updateStatus(id: number, status: 'completed' | 'cancelled'): void {
    if (confirm(`Are you sure you want to mark this appointment as ${status}?`)) {
      this.appointmentService.updateAppointmentStatus(id, status).subscribe({
        next: () => {
          this.loadAppointments();
        },
        error: (err) => {
          console.error(`Error updating status to ${status}`, err);
        }
      });
    }
  }
}
