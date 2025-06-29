import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private isDarkMode$ = new BehaviorSubject<boolean>(false);

  constructor() {
    this.loadTheme();
  }

  get isDarkMode() {
    return this.isDarkMode$.asObservable();
  }

  toggleTheme(): void {
    const newTheme = !this.isDarkMode$.value;
    this.isDarkMode$.next(newTheme);
    this.applyTheme(newTheme);
    this.saveTheme(newTheme);
  }

  private loadTheme(): void {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = savedTheme ? savedTheme === 'dark' : prefersDark;
    
    this.isDarkMode$.next(isDark);
    this.applyTheme(isDark);
  }

  private applyTheme(isDark: boolean): void {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  }

  private saveTheme(isDark: boolean): void {
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }
}