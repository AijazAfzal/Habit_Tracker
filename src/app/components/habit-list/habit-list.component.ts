import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HabitService } from '../../services/habit.service';
import { Habit, HabitProgress, HabitStats } from '../../models/habit.model';
import { Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';

interface HabitWithStats extends Habit {
  stats: HabitStats;
  todayProgress: HabitProgress | undefined;
}

@Component({
  selector: 'app-habit-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="habit-list">
      <div class="list-header">
        <h2>Today's Habits</h2>
        <div class="date">{{ today | date:'fullDate' }}</div>
      </div>
      
      <div class="empty-state" *ngIf="(habitsWithStats$ | async)?.length === 0">
        <div class="empty-icon">🎯</div>
        <h3>No habits yet</h3>
        <p>Start building better habits by adding your first one!</p>
      </div>
      
      <div class="habits-grid" *ngIf="(habitsWithStats$ | async)?.length! > 0">
        <div 
          class="habit-card"
          [class.completed]="habit.todayProgress?.completed"
          *ngFor="let habit of habitsWithStats$ | async; trackBy: trackByHabit"
        >
          <div class="habit-header">
            <div class="habit-info">
              <h3 class="habit-name">{{ habit.name }}</h3>
              <div class="habit-category">{{ habit.category }}</div>
              <p class="habit-description" *ngIf="habit.description">{{ habit.description }}</p>
            </div>
            
            <div class="completion-actions">
              <button 
                class="complete-btn quick-complete"
                [class.completed]="habit.todayProgress?.completed"
                (click)="markComplete(habit.id)"
                title="Mark as 100% complete"
              >
                <span class="check-icon">{{ habit.todayProgress?.completed ? '✓' : '' }}</span>
              </button>
              
              <button 
                class="complete-btn progress-btn"
                (click)="openProgressDialog(habit)"
                title="Set custom completion percentage"
              >
                <span class="progress-icon">%</span>
              </button>
            </div>
          </div>
          
          <div class="habit-stats">
            <div class="stat">
              <span class="stat-value">{{ habit.todayProgress?.completionPercentage || 0 }}%</span>
              <span class="stat-label">Today</span>
            </div>
            <div class="stat">
              <span class="stat-value">{{ habit.stats.currentStreak }}</span>
              <span class="stat-label">Streak</span>
            </div>
            <div class="stat">
              <span class="stat-value">{{ habit.stats.completionRate | number:'1.0-0' }}%</span>
              <span class="stat-label">Success</span>
            </div>
          </div>
          
          <div class="habit-actions">
            <button 
              class="action-btn edit" 
              (click)="editHabit(habit)"
              title="Edit habit"
            >
              ✏️
            </button>
            <button 
              class="action-btn delete" 
              (click)="deleteHabit(habit.id)"
              title="Delete habit"
            >
              🗑️
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Progress Dialog -->
    <div class="modal-overlay" *ngIf="showProgressDialog" (click)="closeProgressDialog()">
      <div class="progress-dialog" (click)="$event.stopPropagation()">
        <div class="dialog-header">
          <h3>Update Progress</h3>
          <button class="close-btn" (click)="closeProgressDialog()">×</button>
        </div>
        
        <div class="dialog-content">
          <div class="habit-info">
            <h4>{{ selectedHabit?.name }}</h4>
            <p>{{ todayString | date:'mediumDate' }}</p>
          </div>
          
          <div class="progress-input">
            <label>Completion Percentage</label>
            <div class="slider-container">
              <input 
                type="range" 
                min="0" 
                max="100" 
                step="5"
                [(ngModel)]="progressPercentage"
                class="progress-slider"
              >
              <span class="percentage-display">{{ progressPercentage }}%</span>
            </div>
            
            <div class="quick-percentages">
              <button 
                class="quick-btn" 
                *ngFor="let percent of quickPercentages"
                (click)="setQuickPercentage(percent)"
                [class.active]="progressPercentage === percent"
              >
                {{ percent }}%
              </button>
            </div>
          </div>
          
          <div class="notes-input">
            <label>Notes (optional)</label>
            <textarea 
              [(ngModel)]="progressNotes"
              placeholder="Add any notes about your progress..."
              rows="3"
            ></textarea>
          </div>
        </div>
        
        <div class="dialog-actions">
          <button class="btn btn-outline" (click)="closeProgressDialog()">Cancel</button>
          <button class="btn btn-primary" (click)="saveProgress()">Save Progress</button>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./habit-list.component.scss']
})
export class HabitListComponent implements OnInit {
  @Output() editHabitEvent = new EventEmitter<Habit>();
  
  today = new Date();
  todayString = this.today.toISOString().split('T')[0];
  
  habitsWithStats$: Observable<HabitWithStats[]> = new Observable();
  
  // Progress dialog properties
  showProgressDialog = false;
  selectedHabit: Habit | null = null;
  progressPercentage = 0;
  progressNotes = '';
  quickPercentages = [0, 25, 50, 75, 100];

  constructor(private habitService: HabitService) {}

  ngOnInit(): void {
    this.habitsWithStats$ = combineLatest([
      this.habitService.getHabits(),
      this.habitService.getProgress()
    ]).pipe(
      map(([habits, progress]) => {
        return habits
          .filter(habit => habit.isActive)
          .map(habit => ({
            ...habit,
            stats: this.habitService.getHabitStats(habit.id),
            todayProgress: this.habitService.getHabitProgress(habit.id, this.todayString)
          }));
      })
    );
  }

  trackByHabit(index: number, habit: HabitWithStats): string {
    return habit.id;
  }

  markComplete(habitId: string): void {
    this.habitService.markHabitComplete(habitId, this.todayString);
  }

  openProgressDialog(habit: Habit): void {
    this.selectedHabit = habit;
    const currentProgress = this.habitService.getHabitProgress(habit.id, this.todayString);
    this.progressPercentage = currentProgress?.completionPercentage || 0;
    this.progressNotes = currentProgress?.notes || '';
    this.showProgressDialog = true;
  }

  closeProgressDialog(): void {
    this.showProgressDialog = false;
    this.selectedHabit = null;
    this.progressPercentage = 0;
    this.progressNotes = '';
  }

  setQuickPercentage(percentage: number): void {
    this.progressPercentage = percentage;
  }

  saveProgress(): void {
    if (this.selectedHabit) {
      this.habitService.updateHabitProgress(
        this.selectedHabit.id,
        this.todayString,
        this.progressPercentage,
        this.progressNotes
      );
      this.closeProgressDialog();
    }
  }

  editHabit(habit: Habit): void {
    this.editHabitEvent.emit(habit);
  }

  deleteHabit(habitId: string): void {
    if (confirm('Are you sure you want to delete this habit? This action cannot be undone.')) {
      this.habitService.deleteHabit(habitId);
    }
  }
}