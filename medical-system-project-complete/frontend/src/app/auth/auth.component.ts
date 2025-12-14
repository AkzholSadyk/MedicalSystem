import { Component, OnInit, OnDestroy } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ThemeService } from '../core/services/theme.service';
import { Subscription } from 'rxjs';


@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.css'
})
export class AuthComponent implements OnInit {
  currentLang = localStorage.getItem('lang') || 'en';
  languages = [
    { code: 'en', label: 'EN' },
    { code: 'kk', label: 'KZ' },
    { code: 'ru', label: 'RU' }
  ];
  isDark = false;
  private subs = new Subscription();

  constructor(private translate: TranslateService, private theme: ThemeService) {
    const saved = localStorage.getItem('lang') || 'en';
    this.currentLang = saved;
    this.translate.setDefaultLang('en');
    this.translate.use(saved);
  // subscribe to theme changes
  this.subs.add(this.theme.isDark$.subscribe((value: boolean) => this.isDark = value));
  }

  ngOnInit(): void {}

  setLanguage(lang: string): void {
    this.currentLang = lang;
    localStorage.setItem('lang', lang);
    this.translate.use(lang);
  }

  toggleTheme(): void {
    this.theme.toggleTheme();
  }

  // applyTheme is now handled by ThemeService globally

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

}
