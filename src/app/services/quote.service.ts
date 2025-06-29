import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class QuoteService {
  private quotes = [
    "Success is the sum of small efforts repeated day in and day out.",
    "We are what we repeatedly do. Excellence, then, is not an act, but a habit.",
    "The secret of getting ahead is getting started.",
    "Small daily improvements over time lead to stunning results.",
    "Don't wait for opportunity. Create it.",
    "The best time to plant a tree was 20 years ago. The second best time is now.",
    "Progress, not perfection, is the goal.",
    "Every expert was once a beginner.",
    "A journey of a thousand miles begins with a single step.",
    "Discipline is the bridge between goals and accomplishment.",
    "You don't have to be great to get started, but you have to get started to be great.",
    "The only impossible journey is the one you never begin.",
    "Success is built sequentially. It's one thing at a time.",
    "Consistency is the mother of mastery.",
    "What we do today matters tomorrow."
  ];

  getDailyQuote(): Observable<string> {
    const today = new Date().toDateString();
    const hash = this.simpleHash(today);
    const index = hash % this.quotes.length;
    return of(this.quotes[index]);
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
}