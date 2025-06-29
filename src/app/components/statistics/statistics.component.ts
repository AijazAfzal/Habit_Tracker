import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HabitService } from '../../services/habit.service';
import { HabitStats } from '../../models/habit.model';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-statistics',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="statistics-container">
      <h2 class="section-title">Your Progress</h2>
      
      <div class="stats-overview">
        <div class="stat-card">
          <div class="stat-icon">🎯</div>
          <div class="stat-content">
            <div class="stat-value">{{ (totalHabits$ | async) || 0 }}</div>
            <div class="stat-label">Active Habits</div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">🔥</div>
          <div class="stat-content">
            <div class="stat-value">{{ (averageStreak$ | async) || 0 }}</div>
            <div class="stat-label">Avg. Streak</div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">📊</div>
          <div class="stat-content">
            <div class="stat-value">{{ (overallCompletion$ | async) || 0 }}%</div>
            <div class="stat-label">Completion Rate</div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">⭐</div>
          <div class="stat-content">
            <div class="stat-value">{{ (longestStreak$ | async) || 0 }}</div>
            <div class="stat-label">Best Streak</div>
          </div>
        </div>
      </div>
      
      <div class="habits-breakdown" *ngIf="(habitStats$ | async)?.length as count">
        <h3>Habit Breakdown</h3>
        <div class="habit-stats-list">
          <div 
            *ngFor="let stat of habitStats$ | async; trackBy: trackByHabitId"
            class="habit-stat-item">
            <div class="habit-info">
              <div class="habit-name">{{ getHabitName(stat.habitId) }}</div>
              <div class="habit-category">{{ getHabitCategory(stat.habitId) }}</div>
            </div>
            
            <div class="habit-metrics">
              <div class="metric">
                <span class="metric-value">{{ stat.currentStreak }}</span>
                <span class="metric-label">Current</span>
              </div>
              <div class="metric">
                <span class="metric-value">{{ stat.longestStreak }}</span>
                <span class="metric-label">Best</span>
              </div>
              <div class="metric">
                <span class="metric-value">{{ stat.completionRate.toFixed(0) }}%</span>
                <span class="metric-label">Rate</span>
              </div>
            </div>
            
            <div class="progress-bar">
              <div 
                class="progress-fill"
                [style.width.%]="stat.completionRate"
                [style.background-color]="getHabitColor(stat.habitId)">
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="achievements" *ngIf="(achievements$ | async)?.length as count">
        <h3>Recent Achievements</h3>
        <div class="achievements-list">
          <div 
            *ngFor="let achievement of achievements$ | async"
            class="achievement-item animate-slide-in">
            <div class="achievement-icon">{{ achievement.icon }}</div>
            <div class="achievement-content">
              <div class="achievement-title">{{ achievement.title }}</div>
              <div class="achievement-description">{{ achievement.description }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./statistics.component.scss']
})
export class StatisticsComponent implements OnInit {
  habitStats$: Observable<HabitStats[]>;
  totalHabits$: Observable<number>;
  averageStreak$: Observable<number>;
  overallCompletion$: Observable<number>;
  longestStreak$: Observable<number>;
  achievements$: Observable<Array<{icon: string, title: string, description: string}>>;

  private habits: any[] = [];

  constructor(private habitService: HabitService) {
    this.habitStats$ = this.habitService.getHabits().pipe(
      map(habits => {
        this.habits = habits;
        return habits.filter(h => h.isActive).map(habit => this.habitService.getHabitStats(habit.id));
      })
    );

    this.totalHabits$ = this.habitService.getHabits().pipe(
      map(habits => habits.filter(h => h.isActive).length)
    );

    this.averageStreak$ = this.habitStats$.pipe(
      map(stats => {
        if (stats.length === 0) return 0;
        const totalStreak = stats.reduce((sum, stat) => sum + stat.currentStreak, 0);
        return Math.round(totalStreak / stats.length);
      })
    );

    this.overallCompletion$ = this.habitStats$.pipe(
      map(stats => {
        if (stats.length === 0) return 0;
        const totalRate = stats.reduce((sum, stat) => sum + stat.completionRate, 0);
        return Math.round(totalRate / stats.length);
      })
    );

    this.longestStreak$ = this.habitStats$.pipe(
      map(stats => {
        if (stats.length === 0) return 0;
        return Math.max(...stats.map(stat => stat.longestStreak));
      })
    );

    this.achievements$ = this.habitStats$.pipe(
      map(stats => this.generateAchievements(stats))
    );
  }

  ngOnInit(): void {}

  getHabitName(habitId: string): string {
    const habit = this.habits.find(h => h.id === habitId);
    return habit?.name || 'Unknown Habit';
  }

  getHabitCategory(habitId: string): string {
    const habit = this.habits.find(h => h.id === habitId);
    return habit?.category || 'Other';
  }

  getHabitColor(habitId: string): string {
    const habit = this.habits.find(h => h.id === habitId);
    return habit?.color || '#3B82F6';
  }

  trackByHabitId(index: number, stat: HabitStats): string {
    return stat.habitId;
  }

  private generateAchievements(stats: HabitStats[]): Array<{icon: string, title: string, description: string}> {
    const achievements = [];
    
    // First habit achievement
    if (stats.length >= 1) {
      achievements.push({
        icon: '🚀',
        title: 'Getting Started',
        description: 'Created your first habit!'
      });
    }
    
    // Consistency achievements
    const hasWeekStreak = stats.some(stat => stat.currentStreak >= 7);
    if (hasWeekStreak) {
      achievements.push({
        icon: '🔥',
        title: 'Week Warrior',
        description: 'Maintained a 7-day streak!'
      });
    }
    
    const hasMonthStreak = stats.some(stat => stat.currentStreak >= 30);
    if (hasMonthStreak) {
      achievements.push({
        icon: '🏆',
        title: 'Monthly Master',
        description: 'Achieved a 30-day streak!'
      });
    }
    
    // Completion rate achievements
    const highPerformer = stats.some(stat => stat.completionRate >= 80);
    if (highPerformer) {
      achievements.push({
        icon: '⭐',
        title: 'High Performer',
        description: 'Achieved 80%+ completion rate!'
      });
    }
    
    // Multiple habits
    if (stats.length >= 3) {
      achievements.push({
        icon: '🎯',
        title: 'Habit Collector',
        description: 'Managing 3+ active habits!'
      });
    }
    
    return achievements.slice(-3); // Show only the latest 3 achievements
  }
}