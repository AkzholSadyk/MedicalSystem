import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PatientService } from '../core/services/patient.service';

@Component({
  selector: 'app-patient-profile',
  template: `
    <div class="patient-profile" *ngIf="!loading; else loadingTpl">
      <div class="profile-card">
        <div class="profile-top">
          <img *ngIf="patient?.avatar_url" [src]="patient.avatar_url" class="avatar-img" />
          <div class="profile-info">
            <h2>{{ patient?.first_name }} {{ patient?.last_name }}</h2>
            <div class="muted">{{ patient?.phone }}</div>
            <div class="muted">DOB: {{ patient?.date_of_birth }}</div>
            <div class="muted">{{ patient?.address }}</div>
          </div>
        </div>
      </div>
    </div>
    <ng-template #loadingTpl><div class="loading-wrapper">Loading...</div></ng-template>
  `,
  standalone: true,
  imports: [CommonModule]
})
export class PatientProfileComponent implements OnInit {
  patient: any = null;
  loading = true;

  constructor(private route: ActivatedRoute, private patientService: PatientService) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.patientService.getPatientById(id).subscribe({
        next: (p) => { this.patient = p; this.loading = false; },
        error: () => { this.loading = false; }
      });
    } else {
      this.loading = false;
    }
  }
}
