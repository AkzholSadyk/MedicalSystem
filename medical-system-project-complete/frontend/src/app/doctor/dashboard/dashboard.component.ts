import { Component, OnInit } from '@angular/core';
import { DashboardService, DashboardStats } from '../../core/services/dashboard.service';



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
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
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
export class DashboardComponent implements OnInit {
  stats: DashboardStats | null = null;
  loading = true;

  constructor(private dashboardService: DashboardService) { }

  ngOnInit(): void {
    this.dashboardService.getDoctorStats().subscribe({
      next: (data) => {
        this.stats = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching doctor stats', err);
        this.loading = false;
      }
    });
  }
}
