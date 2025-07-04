import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Habit, HabitProgress, HabitStreak, HabitStats } from '../models/habit.model';

@Injectable({
  providedIn: 'root'
})
export class HabitService {
  private habits$ = new BehaviorSubject<Habit[]>([]);
  private progress$ = new BehaviorSubject<HabitProgress[]>([]);
  private streaks$ = new BehaviorSubject<HabitStreak[]>([]);

  constructor() {
    this.loadData();
  }

  // Habits
  getHabits(): Observable<Habit[]> {
    return this.habits$.asObservable();
  }

  getHabitById(id: string): Habit | undefined {
    return this.habits$.value.find(habit => habit.id === id);
  }

  addHabit(habit: Omit<Habit, 'id' | 'createdAt'>): void {
    const newHabit: Habit = {
      ...habit,
      id: this.generateId(),
      createdAt: new Date(),
      isActive: true
    };
    
    const habits = [...this.habits$.value, newHabit];
    this.habits$.next(habits);
    this.saveHabits(habits);
    
    // Initialize streak
    const streaks = [...this.streaks$.value, {
      habitId: newHabit.id,
      currentStreak: 0,
      longestStreak: 0
    }];
    this.streaks$.next(streaks);
    this.saveStreaks(streaks);
  }

  updateHabit(id: string, updates: Partial<Habit>): void {
    const habits = this.habits$.value.map(habit =>
      habit.id === id ? { ...habit, ...updates } : habit
    );
    this.habits$.next(habits);
    this.saveHabits(habits);
  }

  deleteHabit(id: string): void {
    const habits = this.habits$.value.filter(habit => habit.id !== id);
    this.habits$.next(habits);
    this.saveHabits(habits);
    
    // Remove related progress and streaks
    const progress = this.progress$.value.filter(p => p.habitId !== id);
    this.progress$.next(progress);
    this.saveProgress(progress);
    
    const streaks = this.streaks$.value.filter(s => s.habitId !== id);
    this.streaks$.next(streaks);
    this.saveStreaks(streaks);
  }

  // Progress
  getProgress(): Observable<HabitProgress[]> {
    return this.progress$.asObservable();
  }

  markHabitComplete(habitId: string, date: string): void {
    this.updateHabitProgress(habitId, date, 100);
  }

  updateHabitProgress(habitId: string, date: string, percentage: number, notes?: string): void {
    const existing = this.progress$.value.find(p => p.habitId === habitId && p.date === date);
    let progress = [...this.progress$.value];
    
    if (existing) {
      // Update existing progress
      progress = progress.map(p => 
        p.habitId === habitId && p.date === date 
          ? { 
              ...p, 
              completionPercentage: percentage,
              completed: percentage >= 100,
              completedAt: percentage >= 100 ? new Date() : (percentage > 0 ? new Date() : undefined),
              notes: notes || p.notes
            }
          : p
      );
    } else {
      // Create new progress entry
      progress.push({
        habitId,
        date,
        completed: percentage >= 100,
        completedAt: percentage > 0 ? new Date() : undefined,
        completionPercentage: percentage,
        notes
      });
    }
    
    this.progress$.next(progress);
    this.saveProgress(progress);
    this.updateStreaks(habitId);
  }

  getHabitProgress(habitId: string, date: string): HabitProgress | undefined {
    return this.progress$.value.find(p => p.habitId === habitId && p.date === date);
  }

  // Streaks
  getStreaks(): Observable<HabitStreak[]> {
    return this.streaks$.asObservable();
  }

  getHabitStreak(habitId: string): HabitStreak | undefined {
    return this.streaks$.value.find(s => s.habitId === habitId);
  }

  // Statistics
  getHabitStats(habitId: string): HabitStats {
    const progress = this.progress$.value.filter(p => p.habitId === habitId);
    const totalDays = progress.length;
    const completedDays = progress.filter(p => p.completed).length;
    const completionRate = totalDays > 0 ? (completedDays / totalDays) * 100 : 0;
    const streak = this.getHabitStreak(habitId);
    
    return {
      habitId,
      totalDays,
      completedDays,
      completionRate,
      currentStreak: streak?.currentStreak || 0,
      longestStreak: streak?.longestStreak || 0
    };
  }

  getAllStats(): HabitStats[] {
    return this.habits$.value.map(habit => this.getHabitStats(habit.id));
  }

  // Private methods
  private updateStreaks(habitId: string): void {
    const progress = this.progress$.value
      .filter(p => p.habitId === habitId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    let lastCompletedDate: string | undefined;
    
    // Calculate current streak from today backwards
    const today = new Date();
    let checkDate = new Date(today);
    
    // Check if today is completed first
    const todayStr = today.toISOString().split('T')[0];
    const todayProgress = progress.find(p => p.date === todayStr);
    
    if (todayProgress?.completed) {
      currentStreak = 1;
      lastCompletedDate = todayStr;
      checkDate.setDate(checkDate.getDate() - 1);
      
      // Continue checking backwards for consecutive days
      while (true) {
        const dateStr = checkDate.toISOString().split('T')[0];
        const dayProgress = progress.find(p => p.date === dateStr);
        
        if (dayProgress?.completed) {
          currentStreak++;
        } else {
          break;
        }
        
        checkDate.setDate(checkDate.getDate() - 1);
        
        // Prevent infinite loop - check last 365 days max
        if (checkDate < new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)) break;
      }
    }
    
    // Calculate longest streak
    for (const p of progress.reverse()) {
      if (p.completed) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
    }
    
    const streaks = this.streaks$.value.map(s =>
      s.habitId === habitId
        ? { ...s, currentStreak, longestStreak, lastCompletedDate }
        : s
    );
    
    this.streaks$.next(streaks);
    this.saveStreaks(streaks);
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private loadData(): void {
    const habits = localStorage.getItem('habits');
    const progress = localStorage.getItem('habitProgress');
    const streaks = localStorage.getItem('habitStreaks');
    
    if (habits) {
      this.habits$.next(JSON.parse(habits));
    }
    
    if (progress) {
      const parsedProgress = JSON.parse(progress);
      // Migrate old progress data to include completionPercentage
      const migratedProgress = parsedProgress.map((p: any) => ({
        ...p,
        completionPercentage: p.completionPercentage || (p.completed ? 100 : 0)
      }));
      this.progress$.next(migratedProgress);
    }
    
    if (streaks) {
      this.streaks$.next(JSON.parse(streaks));
    }
  }

  private saveHabits(habits: Habit[]): void {
    localStorage.setItem('habits', JSON.stringify(habits));
  }

  private saveProgress(progress: HabitProgress[]): void {
    localStorage.setItem('habitProgress', JSON.stringify(progress));
  }

  private saveStreaks(streaks: HabitStreak[]): void {
    localStorage.setItem('habitStreaks', JSON.stringify(streaks));
  }
}