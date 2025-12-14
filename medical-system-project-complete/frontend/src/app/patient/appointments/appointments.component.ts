import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { forkJoin, of, take } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { AppointmentService } from '../../core/services/appointment.service';
import { ActivatedRoute, Router } from '@angular/router';
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
  dataSource!: MatTableDataSource<any>;
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
  public dialog: MatDialog,
  private route: ActivatedRoute,
  private router: Router
  ) { }

  ngOnInit(): void {
    this.loadAppointments();
    this.loadDoctors();
    this.appointmentForm = this.fb.group({
      doctor_id: ['', Validators.required],
      appointment_date: ['', Validators.required],
  appointment_time: ['', Validators.required],
  duration: [30],
  reason: ['', Validators.required]
    });

    // If navigated with a doctor_id query param (from doctors list), open create form and preselect
    this.route.queryParams.subscribe(params => {
      const did = params['doctor_id'];
      if (did) {
        // Open create form and preselect doctor
        this.isCreating = true;
        // ensure doctors are loaded before setting value
        if (this.doctors && this.doctors.length > 0) {
          this.appointmentForm.patchValue({ doctor_id: +did });
        } else {
          // If doctors not loaded yet, request and take 1 result then patch
          this.doctorService.getAllDoctors().pipe(take(1)).subscribe({
            next: () => {
              this.appointmentForm.patchValue({ doctor_id: +did });
            },
            error: () => { /* ignore */ }
          });
        }
        // remove query param from URL after handling
        this.router.navigate([], { queryParams: { doctor_id: null }, queryParamsHandling: 'merge' });
      }
    });
  }

  loadAppointments(): void {
    this.loading = true;
    this.appointmentService.getPatientAppointments().subscribe({
      next: (data) => {
        const appointments = data || [];

        // collect unique doctor ids
        const doctorIds = Array.from(new Set(appointments.map(a => a.doctor_id).filter(id => id != null))) as number[];

        if (doctorIds.length === 0) {
          this.dataSource = new MatTableDataSource(appointments);
          this.dataSource.sortingDataAccessor = (item: any, property: string) => {
            switch (property) {
              case 'doctor_name':
                return (item.doctor_name || (item.doctor ? `${item.doctor.first_name || ''} ${item.doctor.last_name || ''}` : '')).toLowerCase();
              case 'appointment_date':
                try { return new Date((item.appointment_date || '') + 'T' + (item.appointment_time || '00:00')).getTime(); } catch (e) { return 0; }
              case 'status':
                return (item.status || '').toLowerCase();
              default:
                return item[property];
            }
          };
          this.dataSource.paginator = this.paginator;
          this.dataSource.sort = this.sort;
          this.loading = false;
          return;
        }

        // fetch doctor objects in parallel
        const calls = doctorIds.map(id => this.doctorService.getDoctorById(id).pipe(catchError(() => of(null))));
        forkJoin(calls).subscribe((doctors: any[]) => {
          const map = new Map<number, any>();
          doctors.forEach((d: any) => { if (d && d.id) map.set(d.id, d); });

          // attach doctor object to each appointment
          const enriched = appointments.map(a => ({ ...a, doctor: map.get(a.doctor_id) }));

          this.dataSource = new MatTableDataSource(enriched);
          this.dataSource.sortingDataAccessor = (item: any, property: string) => {
            switch (property) {
              case 'doctor_name':
                return (item.doctor_name || (item.doctor ? `${item.doctor.first_name || ''} ${item.doctor.last_name || ''}` : '')).toLowerCase();
              case 'appointment_date':
                try { return new Date((item.appointment_date || '') + 'T' + (item.appointment_time || '00:00')).getTime(); } catch (e) { return 0; }
              case 'status':
                return (item.status || '').toLowerCase();
              default:
                return item[property];
            }
          };
          this.dataSource.paginator = this.paginator;
          this.dataSource.sort = this.sort;
          this.loading = false;
        }, (err: any) => {
          console.warn('Failed fetching doctors, using raw appointments', err);
          this.dataSource = new MatTableDataSource(appointments);
          this.dataSource.sortingDataAccessor = (item: any, property: string) => {
            switch (property) {
              case 'doctor_name':
                return (item.doctor_name || (item.doctor ? `${item.doctor.first_name || ''} ${item.doctor.last_name || ''}` : '')).toLowerCase();
              case 'appointment_date':
                try { return new Date((item.appointment_date || '') + 'T' + (item.appointment_time || '00:00')).getTime(); } catch (e) { return 0; }
              case 'status':
                return (item.status || '').toLowerCase();
              default:
                return item[property];
            }
          };
          this.dataSource.paginator = this.paginator;
          this.dataSource.sort = this.sort;
          this.loading = false;
        });
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
  appointment_time: formValue.appointment_time,
  duration: formValue.duration,
  // backend prefers `notes` field; include both for compatibility
  notes: formValue.reason,
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
