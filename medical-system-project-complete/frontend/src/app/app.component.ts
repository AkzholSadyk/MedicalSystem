import { Component, OnInit } from '@angular/core';
import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'medical-system-frontend';

  constructor(public theme: ThemeService) {}

  ngOnInit(): void {
    // Initialize theme from ThemeService (restores from localStorage)
    this.theme.setTheme(this.theme.isDark);
  }
}
