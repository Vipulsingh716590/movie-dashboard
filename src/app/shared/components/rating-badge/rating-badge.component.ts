import { Component, Input } from '@angular/core';

/** Same IMDb-style percentage and colour bands as the movie app's rating badge. */
@Component({
  selector: 'app-rating-badge',
  standalone: true,
  templateUrl: './rating-badge.component.html',
  styleUrl: './rating-badge.component.scss'
})
export class RatingBadgeComponent {
  @Input() rating = 0;

  get percentage(): number {
    return Math.round((this.rating ?? 0) * 10);
  }

  get band(): 'good' | 'mid' | 'low' {
    return this.percentage >= 70 ? 'good' : this.percentage >= 40 ? 'mid' : 'low';
  }
}
