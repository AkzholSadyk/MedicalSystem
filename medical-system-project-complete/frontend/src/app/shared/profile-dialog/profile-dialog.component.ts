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
  // face-api loader state
  private faceModelsLoaded = false;
  profileForm!: FormGroup;
  editing = false;
  loading = false;
  isDoctor = false;
  selectedFile: File | null = null;
  // Camera dialog state
  showCameraDialog = false;
  dialogFaceMessage = '';
  private dialogMediaStream: MediaStream | null = null;
  // auto-stop timer for dialog camera
  private dialogCameraTimeoutId: number | null = null;

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

  // Camera-based face registration from dialog
  async startFaceRegistration(): Promise<void> {
    this.dialogFaceMessage = '';
    try {
      this.showCameraDialog = true;
      this.dialogMediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      const vid = document.querySelector('#dialogVideo') as HTMLVideoElement | null;
      if (vid && this.dialogMediaStream) vid.srcObject = this.dialogMediaStream;
      // start auto-stop timer (10s)
      if (this.dialogCameraTimeoutId) { clearTimeout(this.dialogCameraTimeoutId); this.dialogCameraTimeoutId = null; }
      this.dialogCameraTimeoutId = window.setTimeout(() => {
        this.dialogFaceMessage = 'Camera timeout - stopped';
        this.stopCameraDialog();
      }, 10000);
  // start detection overlay loop
  this.loadFaceModelsIfNeeded().then(() => this.runDialogDetectionLoop());
    } catch (err: any) {
      this.dialogFaceMessage = 'Unable to access camera';
      this.showCameraDialog = false;
    }
  }

  stopCameraDialog(): void {
    if (this.dialogMediaStream) {
      this.dialogMediaStream.getTracks().forEach(t => t.stop());
      this.dialogMediaStream = null;
    }
  if (this.dialogCameraTimeoutId) { clearTimeout(this.dialogCameraTimeoutId); this.dialogCameraTimeoutId = null; }
    this.showCameraDialog = false;
  }

  captureFaceDialog(): void {
    const video = document.querySelector('#dialogVideo') as HTMLVideoElement | null;
    const canvas = document.querySelector('#dialogCanvas') as HTMLCanvasElement | null;
    if (!video || !canvas) {
      this.dialogFaceMessage = 'Camera not available';
      return;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // If face-api is loaded, detect face and crop; otherwise capture full frame
    if ((window as any).faceapi && this.faceModelsLoaded) {
      const options = new (window as any).faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 });
      (async () => {
        const det = await (window as any).faceapi.detectSingleFace(video, options);
        if (!det) {
          this.dialogFaceMessage = 'No face detected';
          return;
        }
        const box = det.box;
        const w = Math.round(box.width);
        const h = Math.round(box.height);
        const cropCanvas = document.createElement('canvas');
        cropCanvas.width = w;
        cropCanvas.height = h;
        const cctx = cropCanvas.getContext('2d')!;
        cctx.drawImage(video, box.x, box.y, box.width, box.height, 0, 0, w, h);
        const blob = await new Promise<Blob | null>((resolve) => cropCanvas.toBlob((b) => resolve(b), 'image/jpeg', 0.95));
        if (!blob) {
          this.dialogFaceMessage = 'Failed to capture image';
          return;
        }

        const file = new File([blob], 'photo.jpg', { type: 'image/jpeg' });

        // Use PromTech-compatible verify endpoint to ensure same flow and validation
        this.authService.faceVerifyFile(file).subscribe({
          next: (res) => {
            // If backend responded with success and included token/user, act accordingly
            this.dialogFaceMessage = res?.message || 'Face verification completed';
            this.stopCameraDialog();
            if (this.dialogCameraTimeoutId) { clearTimeout(this.dialogCameraTimeoutId); this.dialogCameraTimeoutId = null; }
          },
          error: (err) => {
            this.dialogFaceMessage = err?.error?.detail || 'Face registration failed';
          }
        });
      })();
      return;
    }

    // fallback: capture full frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/png');

    const username = this.data?.username || this.data?.user?.username || '';
    if (!username) {
      this.dialogFaceMessage = 'Username unknown';
      return;
    }

    this.authService.faceRegister(username, dataUrl).subscribe({
      next: (res) => {
        this.dialogFaceMessage = res?.message || 'Face login enabled';
  this.stopCameraDialog();
  if (this.dialogCameraTimeoutId) { clearTimeout(this.dialogCameraTimeoutId); this.dialogCameraTimeoutId = null; }
      },
      error: (err) => {
        this.dialogFaceMessage = err?.error?.detail || 'Face registration failed';
      }
    });
  }

  private async loadFaceModelsIfNeeded() {
    if (this.faceModelsLoaded) return;
    try {
      // models should be placed under /assets/models or loaded from a URL
      await (window as any).faceapi.nets.tinyFaceDetector.loadFromUri('/assets/models');
      await (window as any).faceapi.nets.faceLandmark68Net.loadFromUri('/assets/models');
      this.faceModelsLoaded = true;
    } catch (e) {
      console.warn('face-api models not loaded', e);
      this.faceModelsLoaded = false;
    }
  }

  private runDialogDetectionLoop() {
    const video = document.querySelector('#dialogVideo') as HTMLVideoElement | null;
    const overlay = document.querySelector('#dialogOverlay') as HTMLCanvasElement | null;
    if (!video || !overlay) return;
    overlay.width = video.videoWidth || 320;
    overlay.height = video.videoHeight || 240;
    const ctx = overlay.getContext('2d')!;

    const loop = async () => {
      if (!this.showCameraDialog || video.paused || video.ended) return;
      ctx.clearRect(0,0,overlay.width, overlay.height);
      if (this.faceModelsLoaded && (window as any).faceapi) {
        const det = await (window as any).faceapi.detectSingleFace(video, new (window as any).faceapi.TinyFaceDetectorOptions({ inputSize: 320 }));
        if (det) {
          const box = det.box;
          ctx.strokeStyle = '#00FF00'; ctx.lineWidth = 3; ctx.strokeRect(box.x, box.y, box.width, box.height);
        }
      }
      requestAnimationFrame(loop);
    };
    loop();
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
