import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../services/theme.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="header">
      <div class="container">
        <div class="header-content">
          <div class="logo">
            <h1>📋 Daily Habits</h1>
            <p>Build better habits, one day at a time</p>
          </div>
          
          <div class="header-actions">
            <button 
              class="theme-toggle btn-outline"
              (click)="toggleTheme()"
              [attr.aria-label]="(isDarkMode$ | async) ? 'Switch to light mode' : 'Switch to dark mode'"
            >
              <span class="theme-icon">
                {{ (isDarkMode$ | async) ? '☀️' : '🌙' }}
              </span>
              <span class="theme-text">
                {{ (isDarkMode$ | async) ? 'Light' : 'Dark' }}
              </span>
            </button>
          </div>
        </div>
      </div>
    </header>
  `,
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  isDarkMode$: Observable<boolean>;

  constructor(private themeService: ThemeService) {
    this.isDarkMode$ = this.themeService.isDarkMode;
  }

  ngOnInit(): void {}

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}