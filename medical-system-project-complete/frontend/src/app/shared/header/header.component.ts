import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { User } from '../../core/models/user.model';
import { MatDialog } from '@angular/material/dialog';
import { ProfileDialogComponent } from '../profile-dialog/profile-dialog.component';
import { TranslateService } from '@ngx-translate/core';
import { ThemeService } from '../../core/services/theme.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  @Output() toggleSidenav = new EventEmitter<void>();
  currentUser: User | null = null;
  currentLang = localStorage.getItem('lang') || 'en';
  languages = [
    { code: 'en', label: 'EN' },
    { code: 'kk', label: 'KZ' },
    { code: 'ru', label: 'RU' }
  ];
  isDark = false;
  private subs = new Subscription();

  constructor(private authService: AuthService, private dialog: MatDialog, private translate: TranslateService, private theme: ThemeService) {
    // Устанавливаем язык из localStorage или используем язык по умолчанию
    const savedLang = localStorage.getItem('lang') || 'en';
    this.currentLang = savedLang;
    this.translate.setDefaultLang('en');
    this.translate.use(savedLang);
  }

  setLanguage(lang: string): void {
    this.currentLang = lang;
    localStorage.setItem('lang', lang);
    this.translate.use(lang);
  }

  ngOnInit(): void {
    
    const savedLang = localStorage.getItem('lang') || 'en';
    if (savedLang !== this.currentLang) {
      this.currentLang = savedLang;
      this.translate.use(savedLang);
    }
    
    this.authService.currentUser.subscribe(user => {
      this.currentUser = user;
    });

  this.subs.add(this.theme.isDark$.subscribe((value: boolean) => this.isDark = value));
  }

  onLogout(): void {
    this.authService.logout();
  }

  openProfileDialog(): void {
    if (!this.currentUser) { return; }
    const dialogRef = this.dialog.open(ProfileDialogComponent, {
      width: '360px',
      data: this.currentUser
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.authService.fetchCurrentUser().subscribe();
      }
    });
  }

  toggleTheme(): void {
    this.theme.toggleTheme();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}
