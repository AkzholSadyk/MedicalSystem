import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { Appointment } from '../../core/models/appointment.model';
import { AppointmentService } from '../../core/services/appointment.service';
import { AuthService } from '../../core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-appointment-dialog',
  template: `
    <h2 mat-dialog-title>Appointment</h2>
    <mat-dialog-content class="dialog-content">
      <p><strong>Date:</strong> {{ appt.appointment_date }} {{ appt.appointment_time }}</p>
      <p><strong>Reason:</strong> {{ appt.notes || appt.reason }}</p>
      <p *ngIf="role === 'doctor' && appt.patient"><strong>Patient:</strong> {{ appt.patient.first_name }} {{ appt.patient.last_name }}</p>
      <p *ngIf="role === 'doctor' && appt.patient"><strong>Phone:</strong> {{ appt.patient.phone }}</p>
      <p *ngIf="role === 'patient' && appt.doctor"><strong>Doctor:</strong> {{ appt.doctor.first_name }} {{ appt.doctor.last_name }} — {{ appt.doctor.specialization || '' }}</p>
      <p><strong>Status:</strong> {{ appt.status }}</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Close</button>
      <button *ngIf="canCancel" mat-stroked-button color="warn" (click)="cancel()">Cancel</button>
      <button *ngIf="canComplete" mat-flat-button color="primary" (click)="markComplete()">Mark completed</button>
      <button *ngIf="role === 'doctor'" mat-button (click)="viewPatient()">View Patient Profile</button>
    </mat-dialog-actions>
  `,
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatDialogModule],
})
export class AppointmentDialogComponent {
  appt: Appointment;
  role: string | null = null;
  canCancel = false;
  canComplete = false;

  constructor(
    public dialogRef: MatDialogRef<AppointmentDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { appointment: Appointment },
    private apptService: AppointmentService,
    private auth: AuthService,
    private router: Router
  ) {
    this.appt = data.appointment;
    this.role = auth.userRole;
    const apptDate = new Date(this.appt.appointment_date + 'T' + (this.appt.appointment_time || '00:00'));
    const now = new Date();
    this.canCancel = apptDate > now; // future
    this.canComplete = this.role === 'doctor' && this.appt.status === 'scheduled';
  }

  onCancel() { this.dialogRef.close(); }

  cancel() {
  this.apptService.cancelAppointment(this.appt.id).subscribe({ next: () => this.dialogRef.close() });
  }

  markComplete() {
    this.apptService.updateAppointmentStatus(this.appt.id, 'completed').subscribe({ next: () => this.dialogRef.close() });
  }

  viewPatient() {
    if (this.appt.patient && (this.appt.patient as any).id) {
      this.dialogRef.close();
      this.router.navigate([`/patient/${(this.appt.patient as any).id}`]);
    }
  }
}
