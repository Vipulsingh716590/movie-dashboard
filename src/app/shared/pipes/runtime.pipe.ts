import { Pipe, PipeTransform } from '@angular/core';

/** 148 -> "2h 28m"; empty when the runtime is unknown. */
@Pipe({ name: 'runtime', standalone: true })
export class RuntimePipe implements PipeTransform {
  transform(minutes: number | undefined | null): string {
    if (!minutes) return '—';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h ? `${h}h ${m}m` : `${m}m`;
  }
}
