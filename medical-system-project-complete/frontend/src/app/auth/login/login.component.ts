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
  loginForm!: FormGroup;
  loading = false;
  error = '';

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
