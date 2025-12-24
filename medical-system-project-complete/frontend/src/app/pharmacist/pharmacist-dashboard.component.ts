import { Component, OnInit } from '@angular/core';
import { MedicationService } from '../core/services/medication.service';
import { Medication } from '../core/models/medication.model';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-pharmacist-dashboard',
  templateUrl: './pharmacist-dashboard.component.html',
  styleUrls: ['./pharmacist-dashboard.component.css'],
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatListModule, RouterModule]
})
export class PharmacistDashboardComponent implements OnInit {
  medications: Medication[] = [];
  loading = false;

  constructor(private medicationService: MedicationService) {}

  ngOnInit(): void {
    this.loadMedications();
  }

  loadMedications(): void {
    this.loading = true;
  this.medicationService.getMedications(undefined, 0, 100).subscribe({
      next: (data) => {
        this.medications = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  deleteMed(id: number): void {
    if (!confirm('Delete this medication?')) return;
    this.medicationService.deleteMedication(id).subscribe({
      next: () => this.loadMedications(),
      error: (err) => alert('Failed to delete: ' + (err?.error?.detail || err.statusText))
    });
  }
}
