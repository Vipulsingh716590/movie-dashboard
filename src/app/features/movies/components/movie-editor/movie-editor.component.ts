import { Component, EventEmitter, HostListener, Input, OnInit, Output, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MovieEdit, MovieRow } from '../../../../core/models/movie.model';

/** Modal form for the fields an admin may change. Emits the validated values; the page decides how to save them. */
@Component({
  selector: 'app-movie-editor',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './movie-editor.component.html',
  styleUrl: './movie-editor.component.scss'
})
export class MovieEditorComponent implements OnInit {
  private fb = inject(FormBuilder);

  @Input({ required: true }) movie!: MovieRow;
  @Output() save = new EventEmitter<MovieEdit>();
  @Output() cancel = new EventEmitter<void>();

  form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(120)]],
    overview: ['', Validators.maxLength(1000)],
    release_date: ['', [Validators.required, Validators.pattern(/^\d{4}-\d{2}-\d{2}$/)]],
    vote_average: [0, [Validators.required, Validators.min(0), Validators.max(10)]]
  });

  ngOnInit(): void {
    const { title, overview, release_date, vote_average } = this.movie;
    this.form.setValue({ title, overview, release_date, vote_average });
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.cancel.emit();
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.save.emit(this.form.getRawValue());
  }
}
