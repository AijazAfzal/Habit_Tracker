import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HabitService } from '../../services/habit.service';
import { Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { Habit, HabitStats } from '../../models/habit.model';

interface OverallStats {
  activeHabits: number;
  averageStreak: number;
  completionRate: number;
  bestStreak: number;
  totalHabitsCompleted: number;
  perfectDays: number;
}

interface HabitBreakdown extends Habit {
  stats: HabitStats;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  unlockedAt: Date;
  type: 'streak' | 'completion' | 'milestone' | 'consistency';
}

@Component({
  selector: 'app-statistics',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="statistics" *ngIf="overallStats$ | async as stats">
      <div class="stats-header">
        <h2>Your Progress</h2>
      </div>
      
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">🎯</div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.activeHabits }}</div>
            <div class="stat-label">Pending Today</div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">🔥</div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.averageStreak | number:'1.0-0' }}</div>
            <div class="stat-label">Avg. Streak</div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">📊</div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.completionRate | number:'1.0-0' }}%</div>
            <div class="stat-label">Completion Rate</div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">⭐</div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.bestStreak }}</div>
            <div class="stat-label">Best Streak</div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">✅</div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.totalHabitsCompleted }}</div>
            <div class="stat-label">Total Completed</div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">💎</div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.perfectDays }}</div>
            <div class="stat-label">Perfect Days</div>
          </div>
        </div>
      </div>
      
      <!-- Weekly Progress Chart -->
      <div class="weekly-progress">
        <h3>This Week</h3>
        <div class="week-grid">
          <div 
            class="day-cell" 
            *ngFor="let day of weekDays; let i = index"
            [class.completed]="isDateCompleted(day.date)"
            [class.partial]="isDatePartial(day.date)"
            [class.today]="isToday(day.date)"
          >
            <div class="day-name">{{ day.name }}</div>
            <div class="day-number">{{ day.date | date:'d' }}</div>
            <div class="completion-indicator" *ngIf="getDayCompletionRate(day.date) > 0">
              {{ getDayCompletionRate(day.date) }}%
            </div>
          </div>
        </div>
      </div>

      <!-- Habit Breakdown -->
      <div class="habit-breakdown" *ngIf="(habitBreakdown$ | async)?.length! > 0">
        <h3>Habit Breakdown</h3>
        <div class="breakdown-list">
          <div 
            class="breakdown-item" 
            *ngFor="let habit of habitBreakdown$ | async"
          >
            <div class="breakdown-header">
              <h4>{{ habit.name }}</h4>
              <span class="category">{{ habit.category }}</span>
            </div>
            <div class="breakdown-stats">
              <div class="stat-item">
                <span class="stat-number" [style.color]="habit.color">{{ habit.stats.currentStreak }}</span>
                <span class="stat-text">CURRENT</span>
              </div>
              <div class="stat-item">
                <span class="stat-number" [style.color]="habit.color">{{ habit.stats.longestStreak }}</span>
                <span class="stat-text">BEST</span>
              </div>
              <div class="stat-item">
                <span class="stat-number" [style.color]="habit.color">{{ habit.stats.completionRate | number:'1.0-0' }}%</span>
                <span class="stat-text">RATE</span>
              </div>
            </div>
            <div class="progress-bar">
              <div 
                class="progress-fill" 
                [style.width.%]="habit.stats.completionRate"
                [style.background-color]="habit.color"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Achievements -->
      <div class="recent-achievements">
        <h3>Recent Achievements</h3>
        <div class="achievements-list" *ngIf="(achievements$ | async)?.length! > 0; else noAchievements">
          <div 
            class="achievement-item" 
            *ngFor="let achievement of achievements$ | async"
          >
            <div class="achievement-icon" [style.background-color]="achievement.color">
              {{ achievement.icon }}
            </div>
            <div class="achievement-content">
              <h4>{{ achievement.title }}</h4>
              <p>{{ achievement.description }}</p>
            </div>
          </div>
        </div>
        <ng-template #noAchievements>
          <div class="no-achievements">
            <div class="empty-icon">🏆</div>
            <p>Complete habits to unlock achievements!</p>
          </div>
        </ng-template>
      </div>
    </div>
  `,
  styleUrls: ['./statistics.component.scss']
})
export class StatisticsComponent implements OnInit {
  overallStats$: Observable<OverallStats> = new Observable();
  habitBreakdown$: Observable<HabitBreakdown[]> = new Observable();
  achievements$: Observable<Achievement[]> = new Observable();
  weekDays: { name: string; date: Date }[] = [];

  constructor(private habitService: HabitService) {}

  ngOnInit(): void {
    this.generateWeekDays();
    
    this.overallStats$ = combineLatest([
      this.habitService.getHabits(),
      this.habitService.getProgress()
    ]).pipe(
      map(([habits, progress]) => {
        const activeHabits = habits.filter(h => h.isActive);
        const todayString = new Date().toISOString().split('T')[0];
        
        // Calculate pending habits for today (not completed yet)
        const pendingHabitsToday = activeHabits.filter(habit => {
          const todayProgress = this.habitService.getHabitProgress(habit.id, todayString);
          return !todayProgress?.completed;
        }).length;
        
        const allStats = activeHabits.map(habit => this.habitService.getHabitStats(habit.id));
        
        const averageStreak = activeHabits.length > 0 
          ? allStats.reduce((sum, stat) => sum + stat.currentStreak, 0) / activeHabits.length 
          : 0;
        const completionRate = activeHabits.length > 0
          ? allStats.reduce((sum, stat) => sum + stat.completionRate, 0) / activeHabits.length
          : 0;
        const bestStreak = allStats.length > 0 
          ? Math.max(...allStats.map(stat => stat.longestStreak))
          : 0;
        const totalHabitsCompleted = allStats.reduce((sum, stat) => sum + stat.completedDays, 0);
        const perfectDays = this.calculatePerfectDays(activeHabits, progress);
        
        return {
          activeHabits: pendingHabitsToday, // Show pending habits instead of total active
          averageStreak,
          completionRate,
          bestStreak,
          totalHabitsCompleted,
          perfectDays
        };
      })
    );

    this.habitBreakdown$ = combineLatest([
      this.habitService.getHabits(),
      this.habitService.getProgress()
    ]).pipe(
      map(([habits, progress]) => {
        return habits
          .filter(habit => habit.isActive)
          .map(habit => ({
            ...habit,
            stats: this.habitService.getHabitStats(habit.id)
          }))
          .sort((a, b) => b.stats.completionRate - a.stats.completionRate);
      })
    );

    this.achievements$ = combineLatest([
      this.habitService.getHabits(),
      this.habitService.getProgress()
    ]).pipe(
      map(([habits, progress]) => {
        return this.calculateAchievements(habits, progress);
      })
    );
  }

  private generateWeekDays(): void {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    
    this.weekDays = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      this.weekDays.push({
        name: date.toLocaleDateString('en-US', { weekday: 'short' }),
        date: new Date(date)
      });
    }
  }

  private calculatePerfectDays(habits: any[], progress: any[]): number {
    if (habits.length === 0) return 0;
    
    const dates = [...new Set(progress.map(p => p.date))];
    let perfectDays = 0;
    
    for (const date of dates) {
      const dayProgress = progress.filter(p => p.date === date);
      const completedHabits = dayProgress.filter(p => p.completed).length;
      
      if (completedHabits === habits.length) {
        perfectDays++;
      }
    }
    
    return perfectDays;
  }

  private calculateAchievements(habits: any[], progress: any[]): Achievement[] {
    const achievements: Achievement[] = [];
    const activeHabits = habits.filter(h => h.isActive);
    
    // Getting Started Achievement
    if (activeHabits.length > 0) {
      achievements.push({
        id: 'first-habit',
        title: 'Getting Started',
        description: 'Created your first habit!',
        icon: '🚀',
        color: '#10b981',
        unlockedAt: new Date(),
        type: 'milestone'
      });
    }

    // High Performer Achievement
    const overallCompletionRate = this.calculateOverallCompletionRate(activeHabits, progress);
    if (overallCompletionRate >= 80) {
      achievements.push({
        id: 'high-performer',
        title: 'High Performer',
        description: 'Achieved 80%+ completion rate!',
        icon: '⭐',
        color: '#f59e0b',
        unlockedAt: new Date(),
        type: 'completion'
      });
    }

    // Streak Master Achievement
    const bestStreak = this.getBestStreak(activeHabits);
    if (bestStreak >= 7) {
      achievements.push({
        id: 'streak-master',
        title: 'Streak Master',
        description: `Maintained a ${bestStreak}-day streak!`,
        icon: '🔥',
        color: '#ef4444',
        unlockedAt: new Date(),
        type: 'streak'
      });
    }

    // Consistency Champion Achievement
    const perfectDays = this.calculatePerfectDays(activeHabits, progress);
    if (perfectDays >= 5) {
      achievements.push({
        id: 'consistency-champion',
        title: 'Consistency Champion',
        description: `Achieved ${perfectDays} perfect days!`,
        icon: '💎',
        color: '#8b5cf6',
        unlockedAt: new Date(),
        type: 'consistency'
      });
    }

    // Habit Collector Achievement
    if (activeHabits.length >= 5) {
      achievements.push({
        id: 'habit-collector',
        title: 'Habit Collector',
        description: `Managing ${activeHabits.length} active habits!`,
        icon: '📚',
        color: '#06b6d4',
        unlockedAt: new Date(),
        type: 'milestone'
      });
    }

    return achievements.slice(0, 3); // Show only the 3 most recent
  }

  private calculateOverallCompletionRate(habits: any[], progress: any[]): number {
    if (habits.length === 0) return 0;
    
    const allStats = habits.map(habit => this.habitService.getHabitStats(habit.id));
    return allStats.reduce((sum, stat) => sum + stat.completionRate, 0) / allStats.length;
  }

  private getBestStreak(habits: any[]): number {
    if (habits.length === 0) return 0;
    
    const allStats = habits.map(habit => this.habitService.getHabitStats(habit.id));
    return Math.max(...allStats.map(stat => stat.longestStreak));
  }

  isDateCompleted(date: Date): boolean {
    return this.getDayCompletionRate(date) === 100;
  }

  isDatePartial(date: Date): boolean {
    const rate = this.getDayCompletionRate(date);
    return rate > 0 && rate < 100;
  }

  isToday(date: Date): boolean {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }

  getDayCompletionRate(date: Date): number {
    const dateStr = date.toISOString().split('T')[0];
    let totalHabits = 0;
    let completedHabits = 0;
    
    this.habitService.getHabits().subscribe(habitList => {
      const activeHabits = habitList.filter(h => h.isActive);
      totalHabits = activeHabits.length;
      
      activeHabits.forEach(habit => {
        const progress = this.habitService.getHabitProgress(habit.id, dateStr);
        if (progress?.completed) {
          completedHabits++;
        }
      });
    });
    
    return totalHabits > 0 ? Math.round((completedHabits / totalHabits) * 100) : 0;
  }
}