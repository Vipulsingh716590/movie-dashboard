import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);

  readonly hint = environment.mockUser;
  failed = signal(false);

  form = this.fb.nonNullable.group({
    username: ['', Validators.required],
    password: ['', Validators.required]
  });

  ngOnInit(): void {
    if (this.auth.loggedIn()) void this.router.navigateByUrl(this.returnUrl());
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { username, password } = this.form.getRawValue();
    if (this.auth.login(username, password)) {
      void this.router.navigateByUrl(this.returnUrl());
    } else {
      this.failed.set(true);
    }
  }

  /** Only in-app paths are accepted, so a crafted link can't send someone to another site after signing in. */
  private returnUrl(): string {
    const url = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/';
    return url.startsWith('/') && !url.startsWith('//') ? url : '/';
  }
}
