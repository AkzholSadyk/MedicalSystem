import { Component, OnInit } from '@angular/core';
import { MedicationService } from '../../core/services/medication.service';
import { Medication } from '../../core/models/medication.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatChipsModule } from '@angular/material/chips';

@Component({
  selector: 'app-medications',
  templateUrl: './medications.component.html',
  styleUrls: ['./medications.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatOptionModule,
    MatChipsModule
  ]
})
export class MedicationsComponent implements OnInit {
  medications: Medication[] = [];
  loading = false;
  searchQuery = '';
  filterForm = '';
  filterGenericName = '';
  
  
  formOptions = [
    '', 'tablet', 'capsule', 'syrup', 'injection', 'cream', 'ointment', 
    'drops', 'spray', 'powder', 'solution', 'suspension'
  ];
  
  allMedications: Medication[] = []; 

  constructor(private medicationService: MedicationService) { }

  ngOnInit(): void {
  
  }
  
  
  private searchTimeout: any;
  onSearchInput(): void {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    
    
    this.searchTimeout = setTimeout(() => {
      if (this.searchQuery.trim()) {
        this.searchMedications();
      } else {
        this.medications = [];
      }
    }, 500);
  }

  
  loadMedications(): void {
    this.loading = true;
    const formFilter = this.filterForm || undefined;
    const genericFilter = this.filterGenericName || undefined;
    
    this.medicationService.getMedications(
      this.searchQuery || undefined, 
      0, 
      100,
      formFilter,
      genericFilter
    ).subscribe({
      next: (data) => {
        this.medications = data;
        this.allMedications = data; 
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading medications', err);
        this.loading = false;
        if (err.status === 0) {
          alert('Unable to connect to server. Please check your connection.');
        } else if (err.status === 401) {
          alert('Please login again.');
        } else {
          alert('Error loading medications. Please try again.');
        }
      }
    });
  }

  
  searchMedications(): void {
    this.loadMedications();
  }
  
  
  applyFilters(): void {
    this.loadMedications();
  }
  
  
  clearFilters(): void {
    this.searchQuery = '';
    this.filterForm = '';
    this.filterGenericName = '';
    this.loadMedications();
  }

  
  onSearchKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.searchMedications();
    }
  }
  
  
  onFilterKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.applyFilters();
    }
  }

  
  getImageUrl(medication: Medication): string {
    if (medication.image_url && !medication.image_url.includes('google.com/search')) {
      return medication.image_url;
    }
    
    return '/assets/med-placeholder.svg';
  }

  
  onImageError(event: Event, medication: Medication): void {
    const img = event.target as HTMLImageElement;
    if (img) {
      if (!img.dataset['fallback']) {
        img.dataset['fallback'] = '1';
        img.src = '/assets/med-placeholder.svg';
      }
    }
  }
}

