import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  private faceModelsLoaded = false;
  profileForm!: FormGroup;
  loading = false;
  error = '';
  isDoctor = false;
  // WebAuthn state
  webauthnEnabled = false;
  webauthnLoading = false;
  webauthnError = '';
  // Face login demo state
  showCamera = false;
  faceMessage = '';
  private mediaStream: MediaStream | null = null;
  // auto-stop timer
  private profileCameraTimeoutId: number | null = null;


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
  this.webauthnEnabled = !!data?.webauthn_enabled || !!data?.webauthnEnabled;
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

  // Helper: base64url -> Uint8Array
  private b64ToUint8(s: string): Uint8Array {
    s = s.replace(/-/g, '+').replace(/_/g, '/');
    const pad = s.length % 4;
    if (pad) s += '='.repeat(4 - pad);
    const str = window.atob(s);
    const bytes = new Uint8Array(str.length);
    for (let i = 0; i < str.length; i++) bytes[i] = str.charCodeAt(i);
    return bytes;
  }

  private uint8ToB64(u8: Uint8Array): string {
    let s = '';
    for (let i = 0; i < u8.length; i++) s += String.fromCharCode(u8[i]);
    return window.btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  async onEnableFaceId(): Promise<void> {
    // Confirmation dialog should be shown here; for minimal change we use confirm()
    if (!confirm('Face ID will be used for secure login on this device. Proceed?')) return;

    this.webauthnLoading = true;
    this.webauthnError = '';

    try {
      // 1) Get registration options from backend
      const username = this.profileForm.get('username')?.value || '';
  const opts: any = await this.authService.webauthnRegisterOptions(username).toPromise();

      // Prepare PublicKeyCredentialCreationOptions
      const publicKey: any = {
        ...opts,
        challenge: this.b64ToUint8(opts.challenge),
        user: {
          ...opts.user,
          id: this.b64ToUint8(opts.user.id),
        },
      };

      const cred: any = await navigator.credentials.create({ publicKey }) as any;

      // Send credential to backend for verification
      const rawId = this.uint8ToB64(new Uint8Array(cred.rawId));
      const response = {
        id: cred.id,
        rawId,
        response: {
          attestationObject: this.uint8ToB64(new Uint8Array(cred.response.attestationObject)),
          clientDataJSON: this.uint8ToB64(new Uint8Array(cred.response.clientDataJSON)),
        }
      };

  await this.authService.webauthnRegisterVerify(username, response).toPromise();

      this.webauthnEnabled = true;
    } catch (err: any) {
      console.error(err);
      this.webauthnError = err?.error?.detail || err?.message || 'Face ID registration failed';
    } finally {
      this.webauthnLoading = false;
    }
  }

  // Face registration (camera) demo
  async startFaceRegistration(): Promise<void> {
    this.faceMessage = '';
    try {
      this.showCamera = true;
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      const video: HTMLVideoElement | null = document.querySelector('video#profileVideo') as any;
      // if querySelector fails, select first video element in this template
      const vid = video || document.querySelector('video');
      if (vid && this.mediaStream) vid.srcObject = this.mediaStream;
      // start auto-stop timer (10s)
      if (this.profileCameraTimeoutId) { clearTimeout(this.profileCameraTimeoutId); this.profileCameraTimeoutId = null; }
      this.profileCameraTimeoutId = window.setTimeout(() => {
        this.faceMessage = 'Camera timeout - stopped';
        this.stopCamera();
      }, 10000);
  this.loadFaceModelsIfNeeded().then(() => this.runProfileDetectionLoop());
    } catch (err: any) {
      this.faceMessage = 'Unable to access camera';
      this.showCamera = false;
    }
  }

  stopCamera(): void {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(t => t.stop());
      this.mediaStream = null;
    }
  if (this.profileCameraTimeoutId) { clearTimeout(this.profileCameraTimeoutId); this.profileCameraTimeoutId = null; }
    this.showCamera = false;
  }

  captureFace(): void {
    const video: HTMLVideoElement | null = document.querySelector('video');
    const canvas: HTMLCanvasElement | null = document.querySelector('canvas');
    if (!video || !canvas) {
      this.faceMessage = 'Camera not available';
      return;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if ((window as any).faceapi && this.faceModelsLoaded) {
      (async () => {
        const det = await (window as any).faceapi.detectSingleFace(video, new (window as any).faceapi.TinyFaceDetectorOptions({ inputSize: 320 }));
        if (!det) {
          this.faceMessage = 'No face detected';
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
        const dataUrl = cropCanvas.toDataURL('image/png');

        const username = this.profileForm.get('username')?.value || '';
        this.authService.faceRegister(username, dataUrl).subscribe({
          next: (res) => {
            this.faceMessage = res?.message || 'Face login enabled';
              this.stopCamera();
              if (this.profileCameraTimeoutId) { clearTimeout(this.profileCameraTimeoutId); this.profileCameraTimeoutId = null; }
          },
          error: (err) => {
            this.faceMessage = err?.error?.detail || 'Face registration failed';
          }
        });
      })();
      return;
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/png');

    const username = this.profileForm.get('username')?.value || '';
    this.authService.faceRegister(username, dataUrl).subscribe({
      next: (res) => {
        this.faceMessage = res?.message || 'Face login enabled';
  this.stopCamera();
  if (this.profileCameraTimeoutId) { clearTimeout(this.profileCameraTimeoutId); this.profileCameraTimeoutId = null; }
      },
      error: (err) => {
        this.faceMessage = err?.error?.detail || 'Face registration failed';
      }
    });
  }

  private async loadFaceModelsIfNeeded() {
    if (this.faceModelsLoaded) return;
    try {
      await (window as any).faceapi.nets.tinyFaceDetector.loadFromUri('/assets/models');
      await (window as any).faceapi.nets.faceLandmark68Net.loadFromUri('/assets/models');
      this.faceModelsLoaded = true;
    } catch (e) {
      console.warn('face-api models not loaded', e);
      this.faceModelsLoaded = false;
    }
  }

  private runProfileDetectionLoop() {
    const video: HTMLVideoElement | null = document.querySelector('video#profileVideo') as any;
    const overlay = document.querySelector('#profileOverlay') as HTMLCanvasElement | null;
    if (!video || !overlay) return;
    overlay.width = video.videoWidth || 320;
    overlay.height = video.videoHeight || 240;
    const ctx = overlay.getContext('2d')!;

    const loop = async () => {
      if (!this.showCamera || video.paused || video.ended) return;
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
