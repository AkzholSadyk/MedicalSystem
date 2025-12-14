import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DoctorService } from '../../core/services/doctor.service';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AvatarPreviewComponent } from '../../shared/avatar-preview/avatar-preview.component';

@Component({
  selector: 'app-doctor-profile',
  template: `
    <div class="doctor-profile" *ngIf="!loading; else loadingTpl">
      <mat-card class="profile-card">
        <div class="profile-top">
          <img *ngIf="doctor?.avatar_url; else placeholder" [src]="doctor.avatar_url" class="avatar-img" (click)="openPreview(doctor.avatar_url)" />
          <ng-template #placeholder>
            <div class="avatar-placeholder"><mat-icon>person</mat-icon></div>
          </ng-template>
          <div class="profile-info">
            <h2>{{ doctor?.first_name }} {{ doctor?.last_name }}</h2>
            <p class="muted">Doctor</p>
            <p *ngIf="doctor?.specialization"><strong>Specialization:</strong> {{ doctor.specialization }}</p>
            <p *ngIf="doctor?.clinic_name"><strong>Clinic:</strong> {{ doctor.clinic_name }}</p>
            <p *ngIf="doctor?.phone"><strong>Phone:</strong> {{ doctor.phone }}</p>
            <p *ngIf="doctor?.email"><strong>Email:</strong> {{ doctor.email }}</p>
          </div>
        </div>
      </mat-card>
    </div>
    <ng-template #loadingTpl>
      <div class="loading-wrapper"><mat-spinner></mat-spinner></div>
    </ng-template>

  `,
  styles: [
    `.doctor-profile { padding: 18px; }
     .profile-card { max-width:900px; margin: 0 auto; }
     .profile-top { display:flex; gap:16px; align-items:center; }
     .avatar-img { width:96px; height:96px; border-radius:50%; object-fit:cover; cursor:pointer; box-shadow:0 6px 20px rgba(0,0,0,0.12);} 
     .avatar-placeholder { width:96px; height:96px; display:flex; align-items:center; justify-content:center; border-radius:50%; background:#f3f3f3; color:#777; }
     .profile-info h2 { margin:0; }
     .muted { color: rgba(0,0,0,0.54); }
     .loading-wrapper { display:flex; align-items:center; justify-content:center; height:200px; }
    `
  ],
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule]
})
export class DoctorProfileComponent implements OnInit {
  doctor: any = null;
  loading = true;
  constructor(private route: ActivatedRoute, private router: Router, private doctorService: DoctorService) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) { this.loading = false; return; }
    this.doctorService.getPublicProfile(id).subscribe({ next: d => { 
      // normalize avatar url
      if (d?.avatar_url && !d.avatar_url.startsWith('http')) {
        d.avatar_url = `${(window as any).__env?.apiUrl || 'http://localhost:8000'}${d.avatar_url.startsWith('/') ? '' : '/'}${d.avatar_url}`;
      }
      this.doctor = d; this.loading = false; 
    }, error: e => { console.error(e); this.loading = false; } });
  }

  openPreview(url?: string) {
    if (!url) return;
    // open dialog using global MatDialog via AvatarPreviewComponent
    // We'll inject via dynamic import to avoid circular imports here - simple approach: create a new window overlay
    const w = window.open(url, '_blank');
    if (w) w.focus();
  }
}
