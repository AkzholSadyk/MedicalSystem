import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { User } from '../../core/models/user.model';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  @Output() toggleSidenav = new EventEmitter<void>();
  currentUser: User | null = null;

  constructor(private authService: AuthService) { }

  ngOnInit(): void {
    this.authService.currentUser.subscribe(user => {
      this.currentUser = user;
    });
  }

  onLogout(): void {
    this.authService.logout();
  }
}
