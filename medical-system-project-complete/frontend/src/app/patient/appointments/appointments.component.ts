import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { AppointmentService } from '../../core/services/appointment.service';
import { Appointment } from '../../core/models/appointment.model';
import { MatDialog } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DoctorService } from '../../core/services/doctor.service';
import { Doctor } from '../../core/models/doctor.model';

@Component({
  selector: 'app-appointments',
  templateUrl: './appointments.component.html',
  styleUrls: ['./appointments.component.css']
})
export class AppointmentsComponent implements OnInit {
  displayedColumns: string[] = ['doctor_name', 'appointment_date', 'reason', 'status', 'actions'];
  dataSource!: MatTableDataSource<Appointment>;
  loading = true;
  isCreating = false;
  appointmentForm!: FormGroup;
  doctors: Doctor[] = [];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private appointmentService: AppointmentService,
    private doctorService: DoctorService,
    private fb: FormBuilder,
    public dialog: MatDialog
  ) { }

  ngOnInit(): void {
    this.loadAppointments();
    this.loadDoctors();
    this.appointmentForm = this.fb.group({
      doctor_id: ['', Validators.required],
      appointment_date: ['', Validators.required],
      reason: ['', Validators.required]
    });
  }

  loadAppointments(): void {
    this.loading = true;
    this.appointmentService.getPatientAppointments().subscribe({
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

  loadDoctors(): void {
    this.doctorService.getAllDoctors().subscribe({
      next: (data) => {
        this.doctors = data;
      },
      error: (err) => {
        console.error('Error loading doctors', err);
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

  toggleCreateForm(): void {
    this.isCreating = !this.isCreating;
    if (!this.isCreating) {
      this.appointmentForm.reset();
    }
  }

  createAppointment(): void {
    if (this.appointmentForm.invalid) {
      return;
    }

    const formValue = this.appointmentForm.value;
    const appointmentDate = new Date(formValue.appointment_date);
    const isoDate = appointmentDate.toISOString();

    const newAppointment = {
      doctor_id: formValue.doctor_id,
      appointment_date: isoDate,
      reason: formValue.reason
    };

    this.appointmentService.createAppointment(newAppointment).subscribe({
      next: () => {
        this.toggleCreateForm();
        this.loadAppointments();
      },
      error: (err) => {
        console.error('Error creating appointment', err);
      }
    });
  }

  cancelAppointment(id: number): void {
    if (confirm('Are you sure you want to cancel this appointment?')) {
      this.appointmentService.cancelAppointment(id).subscribe({
        next: () => {
          this.loadAppointments();
        },
        error: (err) => {
          console.error('Error cancelling appointment', err);
        }
      });
    }
  }
}
