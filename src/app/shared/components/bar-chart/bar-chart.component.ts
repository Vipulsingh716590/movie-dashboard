import { Component, Input, computed, signal } from '@angular/core';
import { Datum } from '../../../core/utils/analytics';

/** Horizontal bars with the value at the end of each bar; bar length is relative to the largest value. */
@Component({
  selector: 'app-bar-chart',
  standalone: true,
  templateUrl: './bar-chart.component.html',
  styleUrl: './bar-chart.component.scss'
})
export class BarChartComponent {
  private dataSignal = signal<Datum[]>([]);

  @Input({ required: true }) set data(value: Datum[]) {
    this.dataSignal.set(value ?? []);
  }

  /** Accessible name for the chart. */
  @Input({ required: true }) label = '';
  @Input() color = 'var(--accent)';

  rows = computed(() => {
    const data = this.dataSignal();
    const max = Math.max(1, ...data.map((d) => d.value));
    return data.map((d) => ({ ...d, pct: (d.value / max) * 100 }));
  });
}
