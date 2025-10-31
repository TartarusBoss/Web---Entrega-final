import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-star-rating',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="star-rating" [class.readonly]="readonly">
      <span
        *ngFor="let star of stars; let i = index"
        class="star"
        [class.filled]="i < rating"
        (click)="!readonly && onRatingChange(i + 1)"
        (mouseenter)="!readonly && onHover(i + 1)"
        (mouseleave)="!readonly && onHoverEnd()"
      >
        ⭐
      </span>
    </div>
  `,
  styles: [`
    .star-rating {
      display: inline-flex;
      gap: 4px;
    }

    .star {
      font-size: 24px;
      cursor: pointer;
      opacity: 0.3;
      transition: opacity 0.2s;

      &.filled {
        opacity: 1;
      }
    }

    .readonly {
      .star {
        cursor: default;
      }
    }
  `]
})
export class StarRatingComponent {
  @Input() rating: number = 0;
  @Input() readonly: boolean = false;
  @Input() size: 'small' | 'medium' | 'large' = 'medium';
  @Output() ratingChange = new EventEmitter<number>();

  stars = new Array(5);
  hoverRating: number | null = null;

  onRatingChange(rating: number): void {
    this.rating = rating;
    this.ratingChange.emit(rating);
  }

  onHover(rating: number): void {
    this.hoverRating = rating;
  }

  onHoverEnd(): void {
    this.hoverRating = null;
  }
}