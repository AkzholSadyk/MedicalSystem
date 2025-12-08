import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { RecordService } from '../../core/services/record.service';
import { PatientService } from '../../core/services/patient.service';
import { Patient } from '../../core/models/patient.model';
import { MedicalRecord } from '../../core/models/record.model';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';



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
  selector: 'app-records',
  templateUrl: './records.component.html',
  styleUrls: ['./records.component.css'],
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
export class RecordsComponent implements OnInit {
  patients: Patient[] = [];
  selectedPatient: Patient | null = null;
  patientRecords: MedicalRecord[] = [];
  loadingPatients = true;
  loadingRecords = false;
  recordForm!: FormGroup;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private patientService: PatientService,
    private recordService: RecordService,
    private fb: FormBuilder
  ) { }

  ngOnInit(): void {
    this.loadPatients();
    this.recordForm = this.fb.group({
      patient_id: ['', Validators.required],
      diagnosis: ['', Validators.required],
      treatment: ['', Validators.required],
      notes: ['']
    });
  }

  loadPatients(): void {
    this.loadingPatients = true;
    this.patientService.getAllPatients().subscribe({
      next: (data) => {
        this.patients = data;
        this.loadingPatients = false;
      },
      error: (err) => {
        console.error('Error loading patients', err);
        this.loadingPatients = false;
      }
    });
  }

  onPatientSelect(patientId: number): void {
    this.selectedPatient = this.patients.find(p => p.id === patientId) || null;
    if (this.selectedPatient) {
      this.loadPatientRecords(this.selectedPatient.id);
      this.recordForm.patchValue({ patient_id: this.selectedPatient.id });
    } else {
      this.patientRecords = [];
    }
  }

  loadPatientRecords(patientId: number): void {
    this.loadingRecords = true;
    this.recordService.getPatientRecordsForDoctor(patientId).subscribe({
      next: (data) => {
        this.patientRecords = data;
        this.loadingRecords = false;
      },
      error: (err) => {
        console.error('Error loading patient records', err);
        this.loadingRecords = false;
      }
    });
  }

  createRecord(): void {
    if (this.recordForm.invalid) {
      return;
    }

    const newRecord = this.recordForm.value;

    this.recordService.createRecord(newRecord).subscribe({
      next: () => {
        alert('Medical record created successfully!');
        this.recordForm.reset({ patient_id: this.selectedPatient?.id });
        this.loadPatientRecords(this.selectedPatient!.id);
      },
      error: (err) => {
        console.error('Error creating record', err);
      }
    });
  }
}
