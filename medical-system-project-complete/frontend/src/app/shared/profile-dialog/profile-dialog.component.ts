import { Component, Inject, OnInit } from '@angular/core';
import { environment } from '../../../environments/environment';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { AuthService } from '../../core/services/auth.service';
import { AvatarPreviewComponent } from '../avatar-preview/avatar-preview.component';

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
  selectedFile: File | null = null;

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
  @Inject(MAT_DIALOG_DATA) public data: any,
  private matDialog: MatDialog
  ) { }

  openPreview(url?: string) {
    if (!url) return;
  const abs = this.absoluteAvatarUrl(url);
  this.matDialog.open(AvatarPreviewComponent, { data: { url: abs }, panelClass: 'avatar-preview-dialog', maxWidth: '100vw' });
  }

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

  onFile(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
    }
  }

  upload(): void {
    if (!this.selectedFile) return;
    this.authService.uploadProfileAvatar(this.selectedFile).subscribe({
      next: (updated) => {
        // update local data and close
        this.data = { ...this.data, ...updated };
        // ensure avatar_url is absolute
        if (this.data?.avatar_url) {
          this.data.avatar_url = this.absoluteAvatarUrl(this.data.avatar_url);
        }
        this.selectedFile = null;
      },
      error: (err) => console.error('Avatar upload failed', err)
    });
  }

  absoluteAvatarUrl(url?: string): string | undefined {
    if (!url) return undefined;
    // If already absolute, return as-is
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    // If path already includes backend base, return
    if (url.startsWith(environment.apiUrl)) return url;
    // If leading slash, join with apiUrl
    if (url.startsWith('/')) return `${environment.apiUrl}${url}`;
    // otherwise treat as relative to static
    return `${environment.apiUrl}/${url}`;
  }
}
