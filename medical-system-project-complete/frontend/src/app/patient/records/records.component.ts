import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { RecordService } from '../../core/services/record.service';
import { MedicalRecord } from '../../core/models/record.model';
import { FormsModule } from '@angular/forms';  

@Component({
  selector: 'app-records',
  templateUrl: './records.component.html',
  styleUrls: ['./records.component.css'],
  
})
export class RecordsComponent implements OnInit {
  displayedColumns: string[] = ['created_at', 'doctor_name', 'diagnosis', 'actions'];
  dataSource!: MatTableDataSource<MedicalRecord>;
  loading = true;
  selectedRecord: MedicalRecord | null = null;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private recordService: RecordService) { }

  ngOnInit(): void {
    this.loadRecords();
  }

  loadRecords(): void {
    this.loading = true;
    this.recordService.getPatientRecords().subscribe({
      next: (data) => {
        this.dataSource = new MatTableDataSource(data);
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading medical records', err);
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

  viewDetails(record: MedicalRecord): void {
    this.selectedRecord = record;
  }

  closeDetails(): void {
    this.selectedRecord = null;
  }
}
