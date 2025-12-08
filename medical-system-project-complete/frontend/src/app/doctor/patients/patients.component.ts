import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { PatientService } from '../../core/services/patient.service';
import { Patient } from '../../core/models/patient.model';

@Component({
  selector: 'app-patients',
  templateUrl: './patients.component.html',
  styleUrls: ['./patients.component.css']
})
export class PatientsComponent implements OnInit {
  displayedColumns: string[] = ['full_name', 'date_of_birth', 'phone_number', 'actions'];
  dataSource!: MatTableDataSource<Patient>;
  loading = true;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private patientService: PatientService) { }

  ngOnInit(): void {
    this.loadPatients();
  }

  loadPatients(): void {
    this.loading = true;
    this.patientService.getAllPatients().subscribe({
      next: (data) => {
        this.dataSource = new MatTableDataSource(data);
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading patients', err);
        this.loading = false;
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

  viewPatientDetails(patient: Patient): void {
    // TODO: Implement navigation to patient details/records view
    console.log('View details for patient:', patient);
  }
}
