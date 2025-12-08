import { Component, OnInit } from '@angular/core';
import { DoctorService } from '../../core/services/doctor.service';
import { Doctor } from '../../core/models/doctor.model';

import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

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
    MatOptionModule
  ]
})
export class DoctorsComponent implements OnInit {
  doctors: Doctor[] = [];
  loading = true;
  filterText = '';

  constructor(private doctorService: DoctorService) { }

  ngOnInit(): void {
    this.loadDoctors();
  }

  loadDoctors(): void {
    this.loading = true;
    this.doctorService.getAllDoctors().subscribe({
      next: (data) => {
        this.doctors = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading doctors', err);
        this.loading = false;
      }
    });
  }

  get filteredDoctors(): Doctor[] {
    if (!this.filterText) {
      return this.doctors;
    }
    const filter = this.filterText.toLowerCase();
    return this.doctors.filter(doctor =>
      doctor.full_name.toLowerCase().includes(filter) ||
      doctor.specialization.toLowerCase().includes(filter) ||
      doctor.clinic_name.toLowerCase().includes(filter)
    );
  }
}
