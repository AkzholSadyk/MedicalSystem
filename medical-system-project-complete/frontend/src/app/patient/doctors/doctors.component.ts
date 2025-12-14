import { Component, OnInit } from '@angular/core';
import { environment } from '../../../environments/environment';
import { DoctorService } from '../../core/services/doctor.service';
import { Doctor } from '../../core/models/doctor.model';

import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { AvatarPreviewComponent } from '../../shared/avatar-preview/avatar-preview.component';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

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
import { MatChipsModule } from '@angular/material/chips';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-doctors',
  templateUrl: './doctors.component.html',
  styleUrls: ['./doctors.component.css'],
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
    MatOptionModule,
  MatChipsModule,
  TranslateModule,
  RouterModule
  ]
})
export class DoctorsComponent implements OnInit {
  doctors: Doctor[] = [];
  allDoctors: Doctor[] = []; // Store all for filter extraction
  loading = true;
  filterText = '';
  filterSpecialization = '';
  filterClinic = '';
  
  // Available specializations and clinics (extracted from loaded doctors)
  specializations: string[] = [];
  clinics: string[] = [];

  constructor(private doctorService: DoctorService, private matDialog: MatDialog) { }

  openPreview(url?: string) {
    if (!url) return;
    const abs = url.startsWith('http') ? url : `${environment.apiUrl}${url.startsWith('/') ? '' : '/'}${url}`;
    // open dialog
    (window as any).document && this._openDialog(abs);
  }

  private _openDialog(url: string) {
    // lazy access MatDialog via a temporary injection token would be ideal; use window['ngDialog'] fallback
    try {
      this.matDialog.open(AvatarPreviewComponent, { data: { url }, panelClass: 'avatar-preview-dialog', maxWidth: '100vw' });
    } catch (e) {
      const w = window.open(url, '_blank'); if (w) w.focus();
    }
  }

  ngOnInit(): void {
    this.loadDoctors();
  }

  loadDoctors(): void {
    this.loading = true;
    const specializationFilter = this.filterSpecialization || undefined;
    const clinicFilter = this.filterClinic || undefined;
    const searchFilter = this.filterText || undefined;
    
    this.doctorService.getAllDoctors(specializationFilter, clinicFilter, searchFilter).subscribe({
      next: (data) => {
        // Map backend doctor shape to the frontend `Doctor` interface expected by templates
        const mapped = data.map(d => ({
          id: d.id,
          user_id: d.user_id,
          first_name: d.first_name,
          avatar_url: d.avatar_url ? (d.avatar_url.startsWith('http') ? d.avatar_url : `${environment.apiUrl}${d.avatar_url.startsWith('/') ? '' : '/'}${d.avatar_url}`) : undefined,
          last_name: d.last_name,
          full_name: `${d.first_name} ${d.last_name}`.trim(),
          specialization: d.specialization || '',
          phone_number: d.phone || d.phone_number || '',
          // Use first clinic/department name when available
          clinic_name: (d.clinics && d.clinics.length > 0 && (d.clinics[0] as any).name) ? (d.clinics[0] as any).name : '',
          department_name: (d.departments && d.departments.length > 0 && (d.departments[0] as any).name) ? (d.departments[0] as any).name : '',
          created_at: d.created_at
        } as any));

        this.doctors = mapped;
        this.allDoctors = mapped;
        this.extractFilterOptions();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading doctors', err);
        this.loading = false;
      }
    });
  }
  
  /**
   * Extract unique specializations and clinics from loaded doctors
   */
  extractFilterOptions(): void {
    const specs = new Set<string>();
    const clinicNames = new Set<string>();
    
    this.allDoctors.forEach(doctor => {
      if (doctor.specialization) {
        specs.add(doctor.specialization);
      }
      if (doctor.clinic_name) {
        clinicNames.add(doctor.clinic_name);
      }
    });
    
    this.specializations = Array.from(specs).sort();
    this.clinics = Array.from(clinicNames).sort();
  }
  
  /**
   * Apply filters and reload doctors
   */
  applyFilters(): void {
    this.loadDoctors();
  }
  
  /**
   * Clear all filters
   */
  clearFilters(): void {
    this.filterText = '';
    this.filterSpecialization = '';
    this.filterClinic = '';
    this.loadDoctors();
  }
  
  /**
   * Handle Enter key press in search input
   */
  onSearchKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.applyFilters();
    }
  }
}
