import { Component, EventEmitter, HostListener, Input, Output, computed, inject, signal } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { youtubeWatchUrl } from '../../../core/utils/youtube';

const VIDEO_ID = /^[\w-]{11}$/;

/** Plays a trailer in a YouTube embed. Only a valid 11-character video id ever reaches the player's address. */
@Component({
  selector: 'app-trailer-preview',
  standalone: true,
  templateUrl: './trailer-preview.component.html',
  styleUrl: './trailer-preview.component.scss'
})
export class TrailerPreviewComponent {
  private sanitizer = inject(DomSanitizer);
  private keyState = signal('');

  @Input({ required: true }) set videoKey(value: string) {
    this.keyState.set(VIDEO_ID.test(value) ? value : '');
  }

  @Input() title = '';
  @Output() close = new EventEmitter<void>();

  readonly watchUrl = computed(() => (this.keyState() ? youtubeWatchUrl(this.keyState()) : ''));
  readonly embedUrl = computed(() =>
    this.keyState()
      ? this.sanitizer.bypassSecurityTrustResourceUrl(`https://www.youtube-nocookie.com/embed/${this.keyState()}?rel=0`)
      : null
  );

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.close.emit();
  }
}
