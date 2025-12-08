import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { AppointmentService } from '../../core/services/appointment.service';
import { Appointment } from '../../core/models/appointment.model';

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

  constructor(private appointmentService: AppointmentService) { }

  ngOnInit(): void {
    this.loadAppointments();
  }

  loadAppointments(): void {
    this.loading = true;
    this.appointmentService.getDoctorAppointments().subscribe({
      next: (data) => {
        this.dataSource = new MatTableDataSource(data);
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading appointments', err);
        this.loading = false;
      }
    });
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
