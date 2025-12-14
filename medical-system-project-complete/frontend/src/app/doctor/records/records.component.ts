import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { RecordService } from '../../core/services/record.service';
import { AuthService } from '../../core/services/auth.service';
import { PatientService } from '../../core/services/patient.service';
import { Patient } from '../../core/models/patient.model';
import { MedicalRecord } from '../../core/models/record.model';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';



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
import { TranslateModule } from '@ngx-translate/core';

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
  ,
  TranslateModule
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
    private authService: AuthService,
    private fb: FormBuilder,
    private translate: TranslateService
  ) { }

  ngOnInit(): void {
    this.loadPatients();
    this.recordForm = this.fb.group({
      patient_id: ['', Validators.required],
      doctor_id: [''],
      diagnosis: ['', Validators.required],
      treatment: ['', Validators.required],
      notes: [''],
      record_date: ['']
    });

    // Populate doctor_id and record_date defaults
    // record_date -> today (YYYY-MM-DD)
    const today = new Date().toISOString().slice(0,10);
    this.recordForm.patchValue({ record_date: today });

    // Try to fetch current user's profile to get doctor id (doctors route returns id)
    this.authService.getProfile().subscribe({
      next: (profile: any) => {
        if (profile && profile.id) {
          this.recordForm.patchValue({ doctor_id: profile.id });
        }
      },
      error: () => {
        // ignore; doctor_id may be set manually in UI later
      }
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

    const doCreate = (payload: any) => {
      this.recordService.createRecord(payload).subscribe({
        next: () => {
          alert(this.translate.instant('RECORDS.CREATE_SUCCESS'));
          this.recordForm.reset({ patient_id: this.selectedPatient?.id });
          this.loadPatientRecords(this.selectedPatient!.id);
        },
        error: (err) => {
          console.error('Error creating record', err);
          // Show backend validation errors when available
          const details = err?.error || err?.message || 'Unknown error';
          try {
            alert(this.translate.instant('ERRORS.CREATE_RECORD_FAILED', { details: JSON.stringify(details) }));
          } catch (e) {
            alert(this.translate.instant('ERRORS.CREATE_RECORD_FAILED', { details: 'Unknown error' }));
          }
        }
      });
    };

    // If doctor_id is missing, attempt to fetch current profile (doctor) then create
    if (!newRecord.doctor_id) {
      this.authService.getProfile().subscribe({
        next: (profile: any) => {
          if (profile && profile.id) {
            newRecord.doctor_id = profile.id;
            // ensure record_date exists
            if (!newRecord.record_date) {
              newRecord.record_date = new Date().toISOString().slice(0,10);
            }
            doCreate(newRecord);
          } else {
            alert(this.translate.instant('ERRORS.DOCTOR_ID_MISSING'));
          }
        },
        error: (err) => {
          console.error('Error fetching profile before create', err);
          alert(this.translate.instant('ERRORS.UNABLE_DETERMINE_DOCTOR'));
        }
      });
    } else {
      // ensure record_date exists
      if (!newRecord.record_date) {
        newRecord.record_date = new Date().toISOString().slice(0,10);
      }
      doCreate(newRecord);
    }
  }
}
