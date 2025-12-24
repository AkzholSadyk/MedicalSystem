import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { LoginData } from '../../core/models/user.model';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  private faceModelsLoaded = false;
  loginForm!: FormGroup;
  loading = false;
  error = '';
  // Face login demo state
  showLoginCamera = false;
  loginFaceMessage = '';
  private loginMediaStream: MediaStream | null = null;
  // auto-stop timer id (ms)
  private loginCameraTimeoutId: number | null = null;
  // Store username selected before running camera flow so we don't prompt again
  private faceLoginUsername: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  async onFaceIdLogin(): Promise<void> {
    // Start camera for login
    this.loginFaceMessage = '';
    try {

      // Ensure username is present before face login flow starts
      const username = this.loginForm.get('username')?.value || '';
      if (!username) {
        this.loginFaceMessage = 'Username required for face login';
        return;
      }
      // Save username so capture won't ask again
      this.faceLoginUsername = username;

      this.showLoginCamera = true;
      this.loginMediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      const vid = document.querySelector('#loginVideo') as HTMLVideoElement | null;
      if (vid && this.loginMediaStream) vid.srcObject = this.loginMediaStream;
      // auto-stop camera after 10 seconds
      if (this.loginCameraTimeoutId) {
        clearTimeout(this.loginCameraTimeoutId);
        this.loginCameraTimeoutId = null;
      }
      this.loginCameraTimeoutId = window.setTimeout(() => {
        this.loginFaceMessage = 'Camera timeout - stopped';
        this.stopLoginCamera();
      }, 10000);
      this.loadFaceModelsIfNeeded().then(() => this.runLoginDetectionLoop());
    } catch (err: any) {
      this.error = 'Unable to access camera for face login';
      this.showLoginCamera = false;
    }
  }

  stopLoginCamera(): void {
    if (this.loginMediaStream) {
      this.loginMediaStream.getTracks().forEach(t => t.stop());
      this.loginMediaStream = null;
    }
    if (this.loginCameraTimeoutId) {
      clearTimeout(this.loginCameraTimeoutId);
      this.loginCameraTimeoutId = null;
    }
    this.showLoginCamera = false;
  }

  captureFaceLogin(): void {
    const video = document.querySelector('#loginVideo') as HTMLVideoElement | null;
    const canvas = document.querySelector('#loginCanvas') as HTMLCanvasElement | null;
    if (!video || !canvas) {
      this.loginFaceMessage = 'Camera not available';
      return;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    if ((window as any).faceapi && this.faceModelsLoaded) {
      (async () => {
        const det = await (window as any).faceapi.detectSingleFace(video, new (window as any).faceapi.TinyFaceDetectorOptions({ inputSize: 320 }));
        if (!det) {
          this.loginFaceMessage = 'No face detected';
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
          this.loginFaceMessage = 'Failed to capture image';
          return;
        }
  const file = new File([blob], 'photo.jpg', { type: 'image/jpeg' });

  // Use PromTech-compatible verify endpoint (multipart/form-data file field)
  // Include username so backend can verify against that specific user first
        const usernameToUse = this.faceLoginUsername || this.loginForm.get('username')?.value || '';
        if (!usernameToUse) {
          this.loginFaceMessage = 'Username required for face login';
          return;
        }
        this.authService.faceVerifyFile(file, true, usernameToUse).subscribe({
          next: (res) => {
            if (res?.token?.access_token) {
              localStorage.setItem('access_token', res.token.access_token);
              this.authService.fetchCurrentUser().subscribe({ next: (u) => this.router.navigate([`/${u.role}/dashboard`]) });
            } else {
              this.loginFaceMessage = res?.message || 'Face login failed';
            }
          },
          error: (err) => {
            this.loginFaceMessage = err?.error?.detail || 'Face login error';
          }
        });
      })();
      return;
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/png');

    const usernameToUse = this.faceLoginUsername || this.loginForm.get('username')?.value || '';
    if (!usernameToUse) {
      this.loginFaceMessage = 'Username required';
      return;
    }

    this.authService.faceLogin(usernameToUse, dataUrl).subscribe({
      next: (res) => {
        if (res?.access_token) {
          localStorage.setItem('access_token', res.access_token);
          this.authService.fetchCurrentUser().subscribe({ next: (u) => this.router.navigate([`/${u.role}/dashboard`]) });
        } else {
          this.loginFaceMessage = 'Face login failed';
        }
      },
      error: (err) => {
        this.loginFaceMessage = err?.error?.detail || 'Face login error';
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

  private runLoginDetectionLoop() {
    const video = document.querySelector('#loginVideo') as HTMLVideoElement | null;
    const overlay = document.querySelector('#loginOverlay') as HTMLCanvasElement | null;
    if (!video || !overlay) return;
    overlay.width = video.videoWidth || 320;
    overlay.height = video.videoHeight || 240;
    const ctx = overlay.getContext('2d')!;

    const loop = async () => {
      if (!this.showLoginCamera || video.paused || video.ended) return;
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
  // removed previous WebAuthn-based handler; using camera-based face login below

  onSubmit(): void {
    if (this.loginForm.invalid) {
      return;
    }

    this.loading = true;
    this.error = '';

    const loginData: LoginData = this.loginForm.value;

    this.authService.login(loginData).subscribe({
      next: (token) => {
        this.loading = false;
        const role = token.user.role;
        this.router.navigate([`/${role}/dashboard`]);
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error.detail || 'Login failed. Please check your credentials.';
      }
    });
  }
}
