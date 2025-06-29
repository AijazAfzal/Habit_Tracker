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
    const existing = this.progress$.value.find(p => p.habitId === habitId && p.date === date);
    let progress = [...this.progress$.value];
    
    if (existing) {
      progress = progress.map(p => 
        p.habitId === habitId && p.date === date 
          ? { ...p, completed: !p.completed, completedAt: !p.completed ? new Date() : undefined }
          : p
      );
    } else {
      progress.push({
        habitId,
        date,
        completed: true,
        completedAt: new Date()
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
    
    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0];
      const dayProgress = progress.find(p => p.date === dateStr);
      
      if (dayProgress?.completed) {
        currentStreak++;
        if (!lastCompletedDate) lastCompletedDate = dateStr;
      } else if (currentStreak > 0) {
        break;
      }
      
      checkDate.setDate(checkDate.getDate() - 1);
      
      // Prevent infinite loop
      if (checkDate < new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)) break;
    }
    
    // Calculate longest streak
    for (const p of progress) {
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
      this.progress$.next(JSON.parse(progress));
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