import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ToastService } from '../../core/services/toast.service';
import { TmdbService } from '../../core/services/tmdb.service';
import { MovieStore } from '../../core/services/movie-store.service';
import { MovieRow } from '../../core/models/movie.model';
import { SiteSettings } from '../../core/models/site-settings.model';
import { ToggleSwitchComponent } from '../../shared/components/toggle-switch/toggle-switch.component';
import { LoadingStateComponent } from '../../shared/components/loading-state/loading-state.component';
import { PosterComponent } from '../../shared/components/poster/poster.component';
import { RatingBadgeComponent } from '../../shared/components/rating-badge/rating-badge.component';

type SectionSwitch = { key: keyof Pick<SiteSettings, 'showHeroBanner' | 'showPopular' | 'showUpcoming' | 'showLatest'>; label: string; hint: string };

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [RouterLink, ToggleSwitchComponent, LoadingStateComponent, RatingBadgeComponent, PosterComponent],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent implements OnInit {
  store = inject(MovieStore);
  tmdb = inject(TmdbService);
  private toast = inject(ToastService);

  keyDraft = signal('');

  readonly sections: SectionSwitch[] = [
    { key: 'showHeroBanner', label: 'Hero banner', hint: 'The featured trailer at the top of the home page.' },
    { key: 'showPopular', label: 'Popular movies', hint: 'The "Popular Movies" grid.' },
    { key: 'showUpcoming', label: 'Upcoming movies', hint: 'The "Upcoming" grid.' },
    { key: 'showLatest', label: 'Now playing', hint: 'The "Now playing" grid.' }
  ];

  /** A real, rated movie for the preview card, so it looks like the site does. */
  sample = computed<MovieRow | undefined>(() => this.store.movies().find((m) => m.poster_path && m.vote_average > 0) ?? this.store.movies()[0]);

  ngOnInit(): void {
    this.store.load();
  }

  setSection(key: SectionSwitch['key'], value: boolean, label: string): void {
    this.store.updateSettings({ [key]: value }, `${label} ${value ? 'shown' : 'hidden'}`);
  }

  onKeyInput(event: Event): void {
    this.keyDraft.set((event.target as HTMLInputElement).value);
  }

  saveKey(): void {
    this.tmdb.setKey(this.keyDraft());
    this.keyDraft.set('');
    this.toast.show('TMDB key saved in this browser');
  }

  removeKey(): void {
    this.tmdb.setKey('');
    this.toast.show('TMDB key removed');
  }

  clearOverrides(): void {
    this.store.updateSettings({ hiddenRatingIds: [] }, 'Per-movie overrides cleared');
  }
}
