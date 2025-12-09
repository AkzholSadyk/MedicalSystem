import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-profile-dialog',
  templateUrl: './profile-dialog.component.html',
  styleUrls: ['./profile-dialog.component.css']
})
export class ProfileDialogComponent implements OnInit {
  profileForm!: FormGroup;
  editing = false;
  loading = false;
  isDoctor = false;

  clinics = [
    'QAMQOR CLINIC',
    'EMIRMED',
    'DOSTAR MED'
  ];

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

  departments = [
    'General',
    'Surgery',
    'Cardiology Dept',
    'Oncology Dept',
    'Pediatrics',
    'ENT Dept',
    'Orthopedics'
  ];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private dialogRef: MatDialogRef<ProfileDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  ngOnInit(): void {
    this.isDoctor = this.data?.role === 'doctor' || this.data?.user?.role === 'doctor';

    this.profileForm = this.fb.group({
      first_name: [this.data?.first_name || '', Validators.required],
      last_name: [this.data?.last_name || '', Validators.required],
      patronymic: [this.data?.patronymic || ''],
      gender: [this.data?.gender || ''],
      phone: [this.data?.phone || ''],
      date_of_birth: [this.data?.date_of_birth || ''],
      city: [this.data?.city || '']
    });

    if (this.isDoctor) {
      this.profileForm.addControl('clinic_name', this.fb.control(this.data?.clinic_name || this.data?.doctor?.clinic_name || '', []));
      this.profileForm.addControl('specialization', this.fb.control(this.data?.specialization || this.data?.doctor?.specialization || '', []));
      this.profileForm.addControl('department_name', this.fb.control(this.data?.department_name || this.data?.doctor?.department_name || '', []));
    }
  }

  toggleEdit(): void {
    this.editing = !this.editing;
  }

  save(): void {
    if (this.profileForm.invalid) {
      return;
    }
    this.loading = true;
    this.authService.updateProfile(this.profileForm.value).subscribe({
      next: () => {
        this.loading = false;
        this.dialogRef.close(true);
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  close(): void {
    this.dialogRef.close(false);
  }
}
