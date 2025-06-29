import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Habit } from '../../models/habit.model';

@Component({
  selector: 'app-habit-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="habit-form-container">
      <div class="form-header">
        <h3>{{ editingHabit ? 'Edit Habit' : 'Create New Habit' }}</h3>
        <button class="close-btn" (click)="closeForm()" aria-label="Close form">×</button>
      </div>
      
      <form (ngSubmit)="onSubmit()" #habitForm="ngForm" class="habit-form">
        <div class="form-group">
          <label for="name" class="form-label">Habit Name *</label>
          <input
            type="text"
            id="name"
            name="name"
            [(ngModel)]="formData.name"
            class="form-control"
            placeholder="e.g., Drink 8 glasses of water"
            required
            #nameField="ngModel">
          <div *ngIf="nameField.invalid && nameField.touched" class="error-message">
            Habit name is required
          </div>
        </div>

        <div class="form-group">
          <label for="description" class="form-label">Description</label>
          <textarea
            id="description"
            name="description"
            [(ngModel)]="formData.description"
            class="form-control"
            rows="3"
            placeholder="Describe your habit and why it's important to you..."></textarea>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="category" class="form-label">Category</label>
            <select id="category" name="category" [(ngModel)]="formData.category" class="form-control">
              <option value="Health">🏃‍♂️ Health & Fitness</option>
              <option value="Learning">📚 Learning & Growth</option>
              <option value="Productivity">⚡ Productivity</option>
              <option value="Mindfulness">🧘‍♀️ Mindfulness</option>
              <option value="Social">👥 Social & Family</option>
              <option value="Creative">🎨 Creative</option>
              <option value="Other">📌 Other</option>
            </select>
          </div>

          <div class="form-group">
            <label for="targetDays" class="form-label">Target Days (Optional)</label>
            <input
              type="number"
              id="targetDays"
              name="targetDays"
              [(ngModel)]="formData.targetDays"
              class="form-control"
              min="1"
              max="365"
              placeholder="30">
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Choose Color</label>
          <div class="color-picker">
            <button
              type="button"
              *ngFor="let color of colors"
              class="color-option"
              [class.selected]="formData.color === color"
              [style.background-color]="color"
              (click)="selectColor(color)"
              [attr.aria-label]="'Select color ' + color">
            </button>
          </div>
        </div>

        <div class="form-actions">
          <button type="button" class="btn btn-outline" (click)="closeForm()">
            Cancel
          </button>
          <button type="submit" class="btn btn-primary" [disabled]="!habitForm.form.valid">
            {{ editingHabit ? 'Update Habit' : 'Create Habit' }}
          </button>
        </div>
      </form>
    </div>
  `,
  styleUrls: ['./habit-form.component.scss']
})
export class HabitFormComponent implements OnInit {
  @Input() editingHabit: Habit | null = null;
  @Input() showForm = false;
  @Output() habitSubmitted = new EventEmitter<Omit<Habit, 'id' | 'createdAt'>>();
  @Output() formClosed = new EventEmitter<void>();

  formData = {
    name: '',
    description: '',
    category: 'Health',
    color: '#3B82F6',
    targetDays: undefined as number | undefined,
    isActive: true
  };

  colors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
    '#8B5CF6', '#06B6D4', '#84CC16', '#F97316',
    '#EC4899', '#6B7280'
  ];

  ngOnInit(): void {
    if (this.editingHabit) {
      this.formData = {
        name: this.editingHabit.name,
        description: this.editingHabit.description,
        category: this.editingHabit.category,
        color: this.editingHabit.color,
        targetDays: this.editingHabit.targetDays,
        isActive: this.editingHabit.isActive
      };
    }
  }

  selectColor(color: string): void {
    this.formData.color = color;
  }

  onSubmit(): void {
    if (this.formData.name.trim()) {
      this.habitSubmitted.emit({
        name: this.formData.name.trim(),
        description: this.formData.description.trim(),
        category: this.formData.category,
        color: this.formData.color,
        targetDays: this.formData.targetDays,
        isActive: this.formData.isActive
      });
      this.resetForm();
    }
  }

  closeForm(): void {
    this.resetForm();
    this.formClosed.emit();
  }

  private resetForm(): void {
    this.formData = {
      name: '',
      description: '',
      category: 'Health',
      color: '#3B82F6',
      targetDays: undefined,
      isActive: true
    };
  }
}