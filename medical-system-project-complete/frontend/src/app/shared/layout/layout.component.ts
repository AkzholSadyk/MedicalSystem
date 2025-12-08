import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.css']
})
export class LayoutComponent implements OnInit {
  role: string | null = null;

  constructor(private authService: AuthService) { }

  ngOnInit(): void {
    this.role = this.authService.userRole;
  }
}
