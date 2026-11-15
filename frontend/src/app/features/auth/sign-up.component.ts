import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../core/auth/auth.service';
import { AuthLayoutComponent } from '../../layouts/auth-layout/auth-layout.component';
import { IconComponent } from '../../shared/ui/icon.component';

@Component({
  selector: 'app-sign-up',
  imports: [ReactiveFormsModule, RouterLink, AuthLayoutComponent, IconComponent],
  template: `
    <app-auth-layout
      statementLineOne="A quieter place for"
      statementLineTwo="everything worth"
      statementLineThree="keeping."
    >
      <p class="text-[9px] font-semibold tracking-[0.18em] text-accent">CREATE YOUR ACCOUNT</p>
      <h2 class="mt-6 text-[30px] font-semibold leading-tight text-text">Create your account</h2>
      <p class="mt-3 text-[12px] text-muted">Start building your personal link archive.</p>

      <form class="mt-8 flex flex-col" [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <label for="email" class="text-[11px] font-medium text-text">Email address</label>
        <input
          id="email"
          type="email"
          autocomplete="email"
          formControlName="email"
          placeholder="name@example.com"
          class="mt-2 h-12 rounded-[3px] border border-line bg-surface px-4 text-[12px] text-text placeholder-faint transition-colors focus:border-accent focus:outline-none"
          [attr.aria-invalid]="showError('email')"
        />
        @if (showError('email')) {
          <p class="mt-2 text-[11px] text-accent">Enter a valid email address.</p>
        }

        <label for="password" class="mt-6 text-[11px] font-medium text-text">Password</label>
        <input
          id="password"
          type="password"
          autocomplete="new-password"
          formControlName="password"
          placeholder="Enter a password"
          class="mt-2 h-12 rounded-[3px] border border-line bg-surface px-4 text-[12px] text-text placeholder-faint transition-colors focus:border-accent focus:outline-none"
          [attr.aria-invalid]="showError('password')"
        />
        @if (form.controls.password.touched && form.controls.password.invalid) {
          <p class="mt-2 text-[11px] text-accent">Password must be at least 8 characters.</p>
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
            Creating…
          } @else {
            Create account
          }
        </button>
      </form>

      <p class="mt-7 text-[11px] text-muted">
        Already have an account?
        <a routerLink="/sign-in" class="font-medium text-text underline-offset-4 hover:text-accent hover:underline"
          >Sign in</a
        >
      </p>
      <p class="mt-16 text-[10px] text-faint">Your bookmarks remain private to your account.</p>
    </app-auth-layout>
  `,
})
export class SignUpComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
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
      .signUp(email, password)
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: () => {
          this.auth.fetchMe().subscribe({
            next: () => void this.router.navigate(['/library']),
            error: () => void this.router.navigate(['/library']),
          });
        },
        error: (err: unknown) => {
          if (err instanceof HttpErrorResponse && err.status === 409) {
            this.errorMessage.set('An account with this email already exists.');
          } else {
            this.errorMessage.set('Could not create your account. Please try again.');
          }
        },
      });
  }
}
