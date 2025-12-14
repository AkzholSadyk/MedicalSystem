import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
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
      password: ['', [Validators.required, Validators.minLength(8), this.passwordComplexityValidator]],
      role: ['patient', Validators.required],
      patronymic: [''],
      gender: [''],
      phone: [''],
      date_of_birth: [''],
      city: ['']
    });
  }

  // Custom validator for password complexity - returns detailed error object
  passwordComplexityValidator(control: AbstractControl) {
    const value: string = control.value || '';
    const result = {
      requiredLength: value.length >= 8,
      hasNumber: /[0-9]/.test(value),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(value),
      hasUpper: /[A-Z]/.test(value)
    };
    const valid = result.requiredLength && result.hasNumber && result.hasSpecial && result.hasUpper;
    return valid ? null : { passwordComplexity: result };
  }

  // Shortcut for template: form controls
  get f() {
    return this.registerForm.controls;
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
