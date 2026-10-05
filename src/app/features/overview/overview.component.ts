import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MovieStore } from '../../core/services/movie-store.service';
import { StatCardComponent } from '../../shared/components/stat-card/stat-card.component';
import { BarChartComponent } from '../../shared/components/bar-chart/bar-chart.component';
import { DonutChartComponent } from '../../shared/components/donut-chart/donut-chart.component';
import { RatingBadgeComponent } from '../../shared/components/rating-badge/rating-badge.component';
import { ToggleSwitchComponent } from '../../shared/components/toggle-switch/toggle-switch.component';
import { LoadingStateComponent } from '../../shared/components/loading-state/loading-state.component';
import { RuntimePipe } from '../../shared/pipes/runtime.pipe';

@Component({
  selector: 'app-overview',
  standalone: true,
  imports: [
    RouterLink,
    StatCardComponent,
    BarChartComponent,
    DonutChartComponent,
    RatingBadgeComponent,
    ToggleSwitchComponent,
    LoadingStateComponent,
    RuntimePipe
  ],
  templateUrl: './overview.component.html',
  styleUrl: './overview.component.scss'
})
export class OverviewComponent implements OnInit {
  store = inject(MovieStore);

  ngOnInit(): void {
    this.store.load();
  }
}
