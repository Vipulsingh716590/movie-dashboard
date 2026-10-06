import { Component, Input, computed, signal } from '@angular/core';

/**
 * A movie poster that never leaves a hole: when the movie has no poster link, or the image fails to load, a tile with
 * the movie's first letter is shown instead (the movie app shows "No image" in the same situations).
 */
@Component({
  selector: 'app-poster',
  standalone: true,
  templateUrl: './poster.component.html',
  styleUrl: './poster.component.scss',
  host: { '[class.poster--lg]': "size === 'lg'" }
})
export class PosterComponent {
  private srcSignal = signal<string | undefined>(undefined);
  private failed = signal(false);

  @Input() set src(value: string | undefined | null) {
    this.srcSignal.set(value || undefined);
    this.failed.set(false);
  }

  @Input() title = '';
  @Input() size: 'sm' | 'lg' = 'sm';

  /** The link to show, or nothing when there is none or it already failed once. */
  url = computed(() => (this.failed() ? undefined : this.srcSignal()));

  get initial(): string {
    return (this.title.trim()[0] ?? '?').toUpperCase();
  }

  onError(): void {
    this.failed.set(true);
  }
}
