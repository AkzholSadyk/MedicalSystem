import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

const LIGHT_CLASS = 'light_mode';
const DARK_CLASS = 'dark_mode';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  // BehaviorSubject stores true when dark mode is active
  private _isDark$ = new BehaviorSubject<boolean>(localStorage.getItem('theme') === 'dark');
  readonly isDark$ = this._isDark$.asObservable();

  // Toggle theme
  toggleTheme(): void {
    this.setTheme(!this._isDark$.value);
  }

  // Set theme explicitly
  setTheme(isDark: boolean): void {
    this._isDark$.next(isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    this.applyClass(isDark);
  }

  // Apply CSS class at root element
  private applyClass(isDark: boolean): void {
    const root = document.documentElement || document.body;
    root.classList.remove(isDark ? LIGHT_CLASS : DARK_CLASS);
    root.classList.add(isDark ? DARK_CLASS : LIGHT_CLASS);
  }

  // Return current boolean
  get isDark(): boolean {
    return this._isDark$.value;
  }
}
