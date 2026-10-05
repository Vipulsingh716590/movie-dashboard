import { Injectable, signal } from '@angular/core';

export type ToastKind = 'success' | 'error';

export interface Toast {
  id: number;
  message: string;
  kind: ToastKind;
}

const TOAST_MS = 4000;

@Injectable({ providedIn: 'root' })
export class ToastService {
  private nextId = 1;
  private state = signal<Toast[]>([]);
  readonly toasts = this.state.asReadonly();

  show(message: string, kind: ToastKind = 'success'): void {
    const toast: Toast = { id: this.nextId++, message, kind };
    this.state.update((list) => [...list, toast]);
    setTimeout(() => this.dismiss(toast.id), TOAST_MS);
  }

  dismiss(id: number): void {
    this.state.update((list) => list.filter((t) => t.id !== id));
  }
}
