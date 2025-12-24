import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { RecordService } from '../../core/services/record.service';
import { DoctorService } from '../../core/services/doctor.service';
import { MedicalRecord } from '../../core/models/record.model';
import { FormsModule } from '@angular/forms';  
import { forkJoin, of } from 'rxjs';

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
  // No static title — templates use translate pipe so labels update automatically

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private recordService: RecordService, private doctorService: DoctorService) { }

  ngOnInit(): void {
    this.loadRecords();
  // Titles and labels are handled in the template via the translate pipe so they react to language changes.
  }

  loadRecords(): void {
    this.loading = true;
    this.recordService.getPatientRecords().subscribe({
      next: (data) => {
        // If records don't include doctor names, enrich by fetching doctor details
        const uniqueDoctorIds = Array.from(new Set(data.map(r => r.doctor_id).filter(Boolean)));

        if (uniqueDoctorIds.length === 0) {
          this.finalizeDataSource(data);
          return;
        }

        const doctorRequests = uniqueDoctorIds.map(id =>
          this.doctorService.getDoctorById(id).pipe(
            // In case a doctor fetch fails, return null so one failed fetch doesn't break everything
            // The caller will fallback to existing doctor_name
            // We wrap errors by mapping to null using catchError, but to avoid importing, use of(null) on error via subscribe below
            // Keeping simple: return the observable as-is and handle failure in forkJoin subscribe
            of
          )
        );

        // Instead of mapping to of (which is wrong above), we'll build proper observables
        const requests = uniqueDoctorIds.map(id => this.doctorService.getDoctorById(id));

        forkJoin(requests).subscribe({
          next: (doctors) => {
            const doctorMap: Record<number, any> = {};
            doctors.forEach(d => { if (d && (d as any).id) doctorMap[(d as any).id] = d; });

            // Attach doctor object and fallback doctor_name if missing
            const enriched = data.map(r => {
              const dr = doctorMap[r.doctor_id];
              if (dr) {
                return { ...r, doctor: { first_name: dr.first_name, last_name: dr.last_name, patronymic: dr.patronymic }, doctor_name: `${dr.first_name} ${dr.last_name}` };
              }
              return r;
            });

            this.finalizeDataSource(enriched);
          },
          error: (err) => {
            console.warn('Failed fetching doctor details, using raw records', err);
            this.finalizeDataSource(data);
          }
        });
      },
      error: (err) => {
        console.error('Error loading medical records', err);
        this.loading = false;
      }
    });
  }

  private finalizeDataSource(records: MedicalRecord[]) {
    this.dataSource = new MatTableDataSource(records);
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.loading = false;
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

  // Helper to safely compute doctor's display name
  getDoctorDisplayName(record: MedicalRecord): string {
    if (!record) return '';
    if (record.doctor && record.doctor.first_name) {
      return `${record.doctor.first_name} ${record.doctor.last_name || ''}`.trim();
    }
    return record.doctor_name || '';
  }
}
