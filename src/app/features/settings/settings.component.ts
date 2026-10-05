import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MovieStore } from '../../core/services/movie-store.service';
import { SiteSettings } from '../../core/models/site-settings.model';
import { ToggleSwitchComponent } from '../../shared/components/toggle-switch/toggle-switch.component';
import { LoadingStateComponent } from '../../shared/components/loading-state/loading-state.component';
import { RatingBadgeComponent } from '../../shared/components/rating-badge/rating-badge.component';

type SectionSwitch = { key: keyof Pick<SiteSettings, 'showHeroBanner' | 'showPopular' | 'showUpcoming' | 'showLatest'>; label: string; hint: string };

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [RouterLink, ToggleSwitchComponent, LoadingStateComponent, RatingBadgeComponent],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent implements OnInit {
  store = inject(MovieStore);

  readonly sections: SectionSwitch[] = [
    { key: 'showHeroBanner', label: 'Hero banner', hint: 'The featured trailer at the top of the home page.' },
    { key: 'showPopular', label: 'Popular movies', hint: 'The "Popular Movies" grid.' },
    { key: 'showUpcoming', label: 'Upcoming movies', hint: 'The "Upcoming" grid.' },
    { key: 'showLatest', label: 'Now playing', hint: 'The "Now playing" grid.' }
  ];

  ngOnInit(): void {
    this.store.load();
  }

  setSection(key: SectionSwitch['key'], value: boolean, label: string): void {
    this.store.updateSettings({ [key]: value }, `${label} ${value ? 'shown' : 'hidden'}`);
  }

  clearOverrides(): void {
    this.store.updateSettings({ hiddenRatingIds: [] }, 'Per-movie overrides cleared');
  }
}
