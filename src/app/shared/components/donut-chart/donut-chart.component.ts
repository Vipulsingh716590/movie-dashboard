import { Component, Input, computed, signal } from '@angular/core';
import { Datum } from '../../../core/utils/analytics';

const PALETTE = ['#e50914', '#f5c518', '#46d369', '#4aa3ff', '#b36bff', '#ff8a3d', '#6b6b6b'];
const RADIUS = 15.9155; // circumference of 100 so dash lengths equal percentages

/** Donut of the top slices plus an "Other" slice, with a legend that carries the exact numbers. */
@Component({
  selector: 'app-donut-chart',
  standalone: true,
  templateUrl: './donut-chart.component.html',
  styleUrl: './donut-chart.component.scss'
})
export class DonutChartComponent {
  private dataSignal = signal<Datum[]>([]);

  @Input({ required: true }) set data(value: Datum[]) {
    this.dataSignal.set(value ?? []);
  }

  @Input({ required: true }) label = '';
  /** Slices shown before the rest are merged into "Other". */
  @Input() maxSlices = 6;
  @Input() centerLabel = 'total';

  readonly radius = RADIUS;

  total = computed(() => this.dataSignal().reduce((s, d) => s + d.value, 0));

  slices = computed(() => {
    const sorted = [...this.dataSignal()].sort((a, b) => b.value - a.value);
    const head = sorted.slice(0, this.maxSlices);
    const rest = sorted.slice(this.maxSlices).reduce((s, d) => s + d.value, 0);
    const all = rest ? [...head, { label: 'Other', value: rest }] : head;
    const total = this.total() || 1;
    let offset = 0;
    return all.map((d, i) => {
      const pct = (d.value / total) * 100;
      const slice = { ...d, pct, offset, color: PALETTE[i % PALETTE.length] };
      offset += pct;
      return slice;
    });
  });
}
