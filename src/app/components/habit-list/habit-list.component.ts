import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HabitService } from '../../services/habit.service';
import { Habit, HabitProgress } from '../../models/habit.model';
import { Observable, combineLatest, map } from 'rxjs';

interface HabitWithProgress extends Habit {
  todayProgress?: HabitProgress;
  currentStreak: number;
  completionRate: number;
}

@Component({
  selector: 'app-habit-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="habit-list">
      <div class="list-header">
        <h2>Today's Habits</h2>
        <p class="date">{{ today | date:'fullDate' }}</p>
      </div>
      
      <div *ngIf="(habitsWithProgress$ | async)?.length === 0" class="empty-state">
        <div class="empty-icon">📝</div>
        <h3>No habits yet</h3>
        <p>Create your first habit to get started on your journey!</p>
      </div>
      
      <div class="habits-grid" *ngIf="(habitsWithProgress$ | async)?.length as count">
        <div 
          *ngFor="let habit of habitsWithProgress$ | async; trackBy: trackByHabitId"
          class="habit-card"
          [class.completed]="habit.todayProgress?.completed"
          [style.border-left-color]="habit.color">
          
          <div class="habit-header">
            <div class="habit-info">
              <h3 class="habit-name">{{ habit.name }}</h3>
              <p class="habit-category">{{ getCategoryIcon(habit.category) }} {{ habit.category }}</p>
              <p *ngIf="habit.description" class="habit-description">{{ habit.description }}</p>
            </div>
            
            <button 
              class="complete-btn"
              [class.completed]="habit.todayProgress?.completed"
              (click)="toggleHabit(habit.id)"
              [attr.aria-label]="habit.todayProgress?.completed ? 'Mark as incomplete' : 'Mark as complete'">
              <span class="check-icon">{{ habit.todayProgress?.completed ? '✓' : '' }}</span>
            </button>
          </div>
          
          <div class="habit-stats">
            <div class="stat">
              <span class="stat-value">{{ habit.currentStreak }}</span>
              <span class="stat-label">Day Streak</span>
            </div>
            <div class="stat">
              <span class="stat-value">{{ habit.completionRate.toFixed(0) }}%</span>
              <span class="stat-label">Completion</span>
            </div>
            <div class="stat" *ngIf="habit.targetDays">
              <span class="stat-value">{{ habit.targetDays }}</span>
              <span class="stat-label">Target Days</span>
            </div>
          </div>
          
          <div class="habit-actions">
            <button class="action-btn edit" (click)="editHabit(habit)" aria-label="Edit habit">
              ✏️
            </button>
            <button class="action-btn delete" (click)="deleteHabit(habit)" aria-label="Delete habit">
              🗑️
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./habit-list.component.scss']
})
export class HabitListComponent implements OnInit {
  habitsWithProgress$: Observable<HabitWithProgress[]>;
  today = new Date();
  todayString = this.today.toISOString().split('T')[0];

  constructor(private habitService: HabitService) {
    this.habitsWithProgress$ = combineLatest([
      this.habitService.getHabits(),
      this.habitService.getProgress(),
      this.habitService.getStreaks()
    ]).pipe(
      map(([habits, progress, streaks]) => 
        habits
          .filter(habit => habit.isActive)
          .map(habit => {
            const todayProgress = progress.find(p => 
              p.habitId === habit.id && p.date === this.todayString
            );
            const streak = streaks.find(s => s.habitId === habit.id);
            const stats = this.habitService.getHabitStats(habit.id);
            
            return {
              ...habit,
              todayProgress,
              currentStreak: streak?.currentStreak || 0,
              completionRate: stats.completionRate
            };
          })
      )
    );
  }

  ngOnInit(): void {}

  toggleHabit(habitId: string): void {
    this.habitService.markHabitComplete(habitId, this.todayString);
  }

  editHabit(habit: Habit): void {
    // This would typically emit an event to parent component
    console.log('Edit habit:', habit);
  }

  deleteHabit(habit: Habit): void {
    if (confirm(`Are you sure you want to delete "${habit.name}"? This action cannot be undone.`)) {
      this.habitService.deleteHabit(habit.id);
    }
  }

  getCategoryIcon(category: string): string {
    const icons: { [key: string]: string } = {
      'Health': '🏃‍♂️',
      'Learning': '📚',
      'Productivity': '⚡',
      'Mindfulness': '🧘‍♀️',
      'Social': '👥',
      'Creative': '🎨',
      'Other': '📌'
    };
    return icons[category] || '📌';
  }

  trackByHabitId(index: number, habit: HabitWithProgress): string {
    return habit.id;
  }
}