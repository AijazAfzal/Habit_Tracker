export interface Habit {
  id: string;
  name: string;
  description: string;
  category: string;
  color: string;
  createdAt: Date;
  targetDays?: number;
  isActive: boolean;
}

export interface HabitProgress {
  habitId: string;
  date: string; // YYYY-MM-DD format
  completed: boolean;
  completedAt?: Date;
  completionPercentage?: number; // Add optional percentage field
  notes?: string; // Add optional notes field
}

export interface HabitStreak {
  habitId: string;
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate?: string;
}

export interface HabitStats {
  habitId: string;
  totalDays: number;
  completedDays: number;
  completionRate: number;
  currentStreak: number;
  longestStreak: number;
}