import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MedicationService } from '../core/services/medication.service';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-drug-form',
  templateUrl: './drug-form.component.html',
  styleUrls: ['./drug-form.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatCardModule]
})
export class DrugFormComponent implements OnInit {
  id: number | null = null;
  name = '';
  generic_name = '';
  form = '';
  description = '';
  imageFile: File | null = null;
  loading = false;

  // make router public so template can use it for navigation
  constructor(private medicationService: MedicationService, public router: Router, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.id = Number(this.route.snapshot.paramMap.get('id')) || null;
    if (this.id) this.loadMedication();
  }

  onFileChange(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    if (input.files && input.files.length) {
      this.imageFile = input.files[0];
    }
  }

  loadMedication(): void {
    if (!this.id) return;
    this.loading = true;
    this.medicationService.getMedicationById(this.id).subscribe({
      next: (m) => {
        this.name = m.name || '';
        this.generic_name = m.generic_name || '';
        this.form = m.form || '';
        this.description = m.description || '';
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  submit(): void {
    if (!this.name.trim()) { alert('Name is required'); return; }
    this.loading = true;
    const payload = { name: this.name, description: this.description, form: this.form, generic_name: this.generic_name, image: this.imageFile };
    if (this.id) {
      this.medicationService.updateMedication(this.id, payload).subscribe({ next: () => { this.loading = false; this.router.navigate(['/pharmacist']); }, error: (err) => { this.loading = false; alert('Error: ' + (err?.error?.detail || err.statusText)); } });
    } else {
      this.medicationService.createMedication(payload).subscribe({ next: () => { this.loading = false; this.router.navigate(['/pharmacist']); }, error: (err) => { this.loading = false; alert('Error: ' + (err?.error?.detail || err.statusText)); } });
    }
  }
}
