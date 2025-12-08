import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { RegisterData } from '../../core/models/user.model';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
  loading = false;
  error = '';
  roles = ['patient', 'doctor'];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.registerForm = this.fb.group({
      username: ['', Validators.required],
      first_name: ['', Validators.required],   
      last_name: ['', Validators.required], 
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      role: ['patient', Validators.required]
    });
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      return;
    }

    this.loading = true;
    this.error = '';

    const registerData: RegisterData = this.registerForm.value;

    this.authService.register(registerData).subscribe({
      next: (token) => {
        this.loading = false;
        const role = token.user.role;
        this.router.navigate([`/${role}/dashboard`]);
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error.detail || 'Registration failed. Please try again.';
      }
    });
  }
}
