import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HabitService } from '../../services/habit.service';
import { Habit, HabitProgress } from '../../models/habit.model';
import { Observable, combineLatest, map } from 'rxjs';

interface CalendarDay {
  date: Date;
  dateString: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  habits: Array<{
    habit: Habit;
    progress?: HabitProgress;
  }>;
}

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="calendar-container">
      <div class="calendar-header">
        <button class="nav-btn" (click)="previousMonth()" aria-label="Previous month">‹</button>
        <h2 class="month-title">{{ currentMonthName }} {{ currentYear }}</h2>
        <button class="nav-btn" (click)="nextMonth()" aria-label="Next month">›</button>
      </div>
      
      <div class="calendar-grid">
        <div class="day-header" *ngFor="let day of dayHeaders">{{ day }}</div>
        
        <div 
          *ngFor="let day of calendarDays"
          class="calendar-day"
          [class.other-month]="!day.isCurrentMonth"
          [class.today]="day.isToday">
          
          <div class="day-number">{{ day.date.getDate() }}</div>
          
          <div class="habits-indicator" *ngIf="day.habits.length > 0">
            <div 
              *ngFor="let habitProgress of day.habits"
              class="habit-dot"
              [style.background-color]="habitProgress.habit.color"
              [class.completed]="habitProgress.progress?.completed"
              [title]="habitProgress.habit.name + (habitProgress.progress?.completed ? ' (Completed)' : ' (Not completed)')">
            </div>
          </div>
        </div>
      </div>
      
      <div class="calendar-legend">
        <div class="legend-item">
          <div class="legend-dot completed"></div>
          <span>Completed</span>
        </div>
        <div class="legend-item">
          <div class="legend-dot"></div>
          <span>Not completed</span>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./calendar.component.scss']
})
export class CalendarComponent implements OnInit {
  currentDate = new Date();
  currentYear = this.currentDate.getFullYear();
  currentMonth = this.currentDate.getMonth();
  currentMonthName = '';
  
  dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  calendarDays: CalendarDay[] = [];
  
  habits$: Observable<Habit[]>;
  progress$: Observable<HabitProgress[]>;

  constructor(private habitService: HabitService) {
    this.habits$ = this.habitService.getHabits();
    this.progress$ = this.habitService.getProgress();
  }

  ngOnInit(): void {
    this.updateCurrentMonthName();
    this.generateCalendar();
  }

  previousMonth(): void {
    this.currentMonth--;
    if (this.currentMonth < 0) {
      this.currentMonth = 11;
      this.currentYear--;
    }
    this.updateCurrentMonthName();
    this.generateCalendar();
  }

  nextMonth(): void {
    this.currentMonth++;
    if (this.currentMonth > 11) {
      this.currentMonth = 0;
      this.currentYear++;
    }
    this.updateCurrentMonthName();
    this.generateCalendar();
  }

  private updateCurrentMonthName(): void {
    const date = new Date(this.currentYear, this.currentMonth);
    this.currentMonthName = date.toLocaleDateString('en-US', { month: 'long' });
  }

  private generateCalendar(): void {
    combineLatest([this.habits$, this.progress$]).subscribe(([habits, progress]) => {
      const firstDay = new Date(this.currentYear, this.currentMonth, 1);
      const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);
      const today = new Date();
      
      // Get first day of the week (Sunday = 0)
      const startDate = new Date(firstDay);
      startDate.setDate(startDate.getDate() - firstDay.getDay());
      
      // Get last day of the week
      const endDate = new Date(lastDay);
      endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()));
      
      this.calendarDays = [];
      const currentDate = new Date(startDate);
      
      while (currentDate <= endDate) {
        const dateString = currentDate.toISOString().split('T')[0];
        const isCurrentMonth = currentDate.getMonth() === this.currentMonth;
        const isToday = currentDate.toDateString() === today.toDateString();
        
        // Get habits and their progress for this date
        const dayHabits = habits
          .filter(habit => habit.isActive && new Date(habit.createdAt) <= currentDate)
          .map(habit => ({
            habit,
            progress: progress.find(p => p.habitId === habit.id && p.date === dateString)
          }));
        
        this.calendarDays.push({
          date: new Date(currentDate),
          dateString,
          isCurrentMonth,
          isToday,
          habits: dayHabits
        });
        
        currentDate.setDate(currentDate.getDate() + 1);
      }
    });
  }
}