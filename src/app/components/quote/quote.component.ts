import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QuoteService } from '../../services/quote.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-quote',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="quote-container">
      <div class="quote-content">
        <div class="quote-icon">💭</div>
        <blockquote class="quote-text">
          "{{ dailyQuote$ | async }}"
        </blockquote>
        <div class="quote-footer">
          <span class="quote-label">Daily Motivation</span>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./quote.component.scss']
})
export class QuoteComponent implements OnInit {
  dailyQuote$: Observable<string>;

  constructor(private quoteService: QuoteService) {
    this.dailyQuote$ = this.quoteService.getDailyQuote();
  }

  ngOnInit(): void {}
}