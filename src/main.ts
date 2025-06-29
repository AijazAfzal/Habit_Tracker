import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { bootstrapApplication } from '@angular/platform-browser';
import { HeaderComponent } from './app/components/header/header.component';
import { HabitFormComponent } from './app/components/habit-form/habit-form.component';
import { HabitListComponent } from './app/components/habit-list/habit-list.component';
import { CalendarComponent } from './app/components/calendar/calendar.component';
import { StatisticsComponent } from './app/components/statistics/statistics.component';
import { QuoteComponent } from './app/components/quote/quote.component';
import { HabitService } from './app/services/habit.service';
import { ThemeService } from './app/services/theme.service';
import { Habit } from './app/models/habit.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    HeaderComponent,
    HabitFormComponent,
    HabitListComponent,
    CalendarComponent,
    StatisticsComponent,
    QuoteComponent
  ],
  template: `
    <div class="app">
      <app-header></app-header>
      
      <main class="main-content">
        <div class="container">
          <!-- Motivational Quote -->
          <app-quote></app-quote>
          
          <!-- Quick Actions -->
          <div class="quick-actions">
            <button class="btn btn-primary add-habit-btn" (click)="showHabitForm()">
              <span class="btn-icon">+</span>
              Add New Habit
            </button>
            <button class="btn btn-outline view-toggle" (click)="toggleView()">
              <span class="btn-icon">{{ currentView === 'list' ? '📅' : '📋' }}</span>
              {{ currentView === 'list' ? 'Calendar View' : 'List View' }}
            </button>
          </div>
          
          <!-- Habit Form Modal -->
          <div class="modal-overlay" *ngIf="showForm" (click)="closeHabitForm()">
            <div class="modal-content" (click)="$event.stopPropagation()">
              <app-habit-form
                [editingHabit]="editingHabit"
                [showForm]="showForm"
                (habitSubmitted)="onHabitSubmitted($event)"
                (formClosed)="closeHabitForm()">
              </app-habit-form>
            </div>
          </div>
          
          <!-- Main Content Area -->
          <div class="content-grid">
            <!-- Left Column: Habits and Calendar -->
            <div class="main-column">
              <app-habit-list *ngIf="currentView === 'list'"></app-habit-list>
              <app-calendar *ngIf="currentView === 'calendar'"></app-calendar>
            </div>
            
            <!-- Right Column: Statistics -->
            <div class="sidebar-column">
              <app-statistics></app-statistics>
            </div>
          </div>
        </div>
      </main>
      
      <!-- Footer -->
      <footer class="footer">
        <div class="container">
          <p>&copy; 2025 Daily Habit Tracker. Built with ❤️ for better habits.</p>
        </div>
      </footer>
    </div>
  `,
  styleUrls: ['./main.scss']
})
export class App implements OnInit {
  showForm = false;
  editingHabit: Habit | null = null;
  currentView: 'list' | 'calendar' = 'list';

  constructor(
    private habitService: HabitService,
    private themeService: ThemeService
  ) {}

  ngOnInit(): void {}

  showHabitForm(): void {
    this.editingHabit = null;
    this.showForm = true;
  }

  closeHabitForm(): void {
    this.showForm = false;
    this.editingHabit = null;
  }

  onHabitSubmitted(habitData: Omit<Habit, 'id' | 'createdAt'>): void {
    if (this.editingHabit) {
      this.habitService.updateHabit(this.editingHabit.id, habitData);
    } else {
      this.habitService.addHabit(habitData);
    }
    this.closeHabitForm();
  }

  toggleView(): void {
    this.currentView = this.currentView === 'list' ? 'calendar' : 'list';
  }
}

bootstrapApplication(App);