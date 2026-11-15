import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { AuthLayoutComponent } from '../../layouts/auth-layout/auth-layout.component';
import { IconComponent } from '../../shared/ui/icon.component';

@Component({
  selector: 'app-sign-in',
  imports: [ReactiveFormsModule, RouterLink, AuthLayoutComponent, IconComponent],
  template: `
    <app-auth-layout statementLineOne="Keep what matters." statementLineTwo="Find it when you need it.">
      <p class="text-[9px] font-semibold tracking-[0.18em] text-accent">WELCOME BACK</p>
      <h2 class="mt-6 text-[30px] font-semibold leading-tight text-text">Sign in to FOLIO</h2>
      <p class="mt-3 text-[12px] text-muted">Your saved links are right where you left them.</p>

      @if (sessionExpired()) {
        <div
          class="mt-6 flex items-start gap-2 rounded-[3px] border border-line bg-surface px-4 py-3 text-[12px] text-muted"
          role="status"
        >
          <app-icon name="alert" [size]="16" />
          <span>Your session expired. Sign in again to continue.</span>
        </div>
      }

      <form class="mt-8 flex flex-col" [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <label for="email" class="text-[11px] font-medium text-text">Email address</label>
        <input
          id="email"
          type="email"
          autocomplete="email"
          formControlName="email"
          placeholder="name@example.com"
          class="mt-2 h-12 rounded-[10px] border border-line bg-surface px-4 text-[12px] text-text placeholder-faint transition-colors focus:border-accent focus:outline-none"
          [attr.aria-invalid]="showError('email')"
        />
        @if (showError('email')) {
          <p class="mt-2 text-[11px] text-accent">Enter a valid email address.</p>
        }

        <label for="password" class="mt-6 text-[11px] font-medium text-text">Password</label>
        <input
          id="password"
          type="password"
          autocomplete="current-password"
          formControlName="password"
          placeholder="Enter your password"
          class="mt-2 h-12 rounded-[10px] border border-line bg-surface px-4 text-[12px] text-text placeholder-faint transition-colors focus:border-accent focus:outline-none"
          [attr.aria-invalid]="showError('password')"
        />
        @if (showError('password')) {
          <p class="mt-2 text-[11px] text-accent">Password is required.</p>
        }

        @if (errorMessage()) {
          <div
            class="mt-6 flex items-start gap-2 rounded-[3px] border border-line bg-surface px-4 py-3 text-[12px] text-text"
            role="alert"
          >
            <app-icon name="alert" [size]="16" />
            <span>{{ errorMessage() }}</span>
          </div>
        }

        <button
          type="submit"
          [disabled]="submitting()"
          class="mt-8 inline-flex h-[38px] items-center justify-center gap-2 rounded-[4px] bg-accent text-[12px] font-semibold text-ink transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          @if (submitting()) {
            <app-icon name="spinner" [size]="16" />
            Signing in…
          } @else {
            Sign in
          }
        </button>
      </form>

      <p class="mt-7 text-[11px] text-muted">
        New to FOLIO?
        <a routerLink="/sign-up" class="font-medium text-text underline-offset-4 hover:text-accent hover:underline"
          >Create an account</a
        >
      </p>
      <p class="mt-16 text-[10px] text-faint">Your bookmarks remain private to your account.</p>
    </app-auth-layout>
  `,
})
export class SignInComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly sessionExpired = signal(this.route.snapshot.queryParamMap.get('reason') === 'session-expired');

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  showError(control: 'email' | 'password'): boolean {
    const c = this.form.controls[control];
    return c.invalid && (c.touched || c.dirty);
  }

  submit(): void {
    this.errorMessage.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { email, password } = this.form.getRawValue();
    this.submitting.set(true);
    this.auth
      .signIn(email, password)
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: () => {
          // Load the profile before entering the authenticated shell.
          this.auth.fetchMe().subscribe({
            next: () => void this.router.navigate(['/library']),
            error: () => void this.router.navigate(['/library']),
          });
        },
        error: () => this.errorMessage.set("Those credentials don't match our records."),
      });
  }
}
