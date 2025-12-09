import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  profileForm!: FormGroup;
  loading = false;
  error = '';
  isDoctor = false;

  clinics = [ 'QAMQOR CLINIC', 'EMIRMED', 'DOSTAR MED' ];
  specializations = [
    'Dermatology',
    'Plastic Surgery',
    'Neurosurgery',
    'Orthopedic Surgery',
    'Otolaryngology (ENT)',
    'Interventional Radiology',
    'Vascular Surgery',
    'Cardiology',
    'Cardiac and Thoracic Surgery',
    'Oncology',
    'Internal Medicine - Pediatrics'
  ];
  departments = [ 'General', 'Surgery', 'Cardiology Dept', 'Oncology Dept', 'Pediatrics', 'ENT Dept', 'Orthopedics' ];

  constructor(private fb: FormBuilder, private authService: AuthService) { }

  ngOnInit(): void {
    this.profileForm = this.fb.group({
      first_name: ['', Validators.required],
      last_name: ['', Validators.required],
      patronymic: [''],
      gender: [''],
      phone: [''],
      date_of_birth: [''],
      city: ['']
    });

    this.loadProfile();
  }

  loadProfile(): void {
    this.loading = true;
    this.authService.getProfile().subscribe({
      next: (data) => {
        this.loading = false;
        this.isDoctor = data?.role === 'doctor' || data?.user?.role === 'doctor' || data?.doctor;
        this.profileForm.patchValue(data);
        if (this.isDoctor) {
          this.profileForm.addControl('clinic_name', this.fb.control(data?.clinic_name || data?.doctor?.clinic_name || ''));
          this.profileForm.addControl('specialization', this.fb.control(data?.specialization || data?.doctor?.specialization || ''));
          this.profileForm.addControl('department_name', this.fb.control(data?.department_name || data?.doctor?.department_name || ''));
        }
      },
      error: (err) => {
        this.loading = false;
        this.error = 'Failed to load profile';
      }
    });
  }

  save(): void {
    if (this.profileForm.invalid) {
      return;
    }
    this.loading = true;
    this.authService.updateProfile(this.profileForm.value).subscribe({
      next: () => {
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.error = 'Failed to update profile';
      }
    });
  }
}
