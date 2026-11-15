import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { IconComponent } from '../../shared/ui/icon.component';

@Component({
  selector: 'app-account-settings',
  imports: [ReactiveFormsModule, IconComponent],
  template: `
    <div class="min-h-screen bg-ink px-5 pb-16 pt-6 text-text sm:px-8 sm:pt-8 lg:px-10">
      <p class="text-[9px] font-semibold tracking-[0.18em] text-faint">PERSONAL ARCHIVE / ACCOUNT</p>
      <h1 class="mt-2 text-[30px] font-semibold leading-tight text-text">Account settings</h1>
      <p class="mt-3 text-[12px] text-muted">
        Manage the personal details associated with your archive.
      </p>

      <h2 class="mt-10 text-[18px] font-semibold text-text">Profile details</h2>
      <p class="mt-1 text-[11px] text-muted">
        Your name and email address are used for your account.
      </p>
      <div class="mt-4 h-px w-full max-w-[880px] bg-line" aria-hidden="true"></div>

      <form
        class="mt-7 flex w-full max-w-[720px] flex-col"
        [formGroup]="form"
        (ngSubmit)="submit()"
        novalidate
      >
        <label for="firstName" class="text-[9px] font-semibold tracking-[0.18em] text-faint"
          >FIRST NAME</label
        >
        <input
          id="firstName"
          type="text"
          autocomplete="given-name"
          formControlName="firstName"
          placeholder="First name"
          class="mt-2 h-[46px] rounded-[10px] border border-line bg-surface px-4 text-[12px] text-text placeholder-faint focus:border-accent focus:outline-none"
        />

        <label for="lastName" class="mt-6 text-[9px] font-semibold tracking-[0.18em] text-faint"
          >LAST NAME</label
        >
        <input
          id="lastName"
          type="text"
          autocomplete="family-name"
          formControlName="lastName"
          placeholder="Last name"
          class="mt-2 h-[46px] rounded-[10px] border border-line bg-surface px-4 text-[12px] text-text placeholder-faint focus:border-accent focus:outline-none"
        />

        <label for="email" class="mt-6 text-[9px] font-semibold tracking-[0.18em] text-faint"
          >EMAIL ADDRESS</label
        >
        <input
          id="email"
          type="email"
          autocomplete="email"
          formControlName="email"
          placeholder="name@example.com"
          class="mt-2 h-[46px] rounded-[10px] border border-line bg-surface px-4 text-[12px] text-text placeholder-faint focus:border-accent focus:outline-none"
          [attr.aria-invalid]="showEmailError()"
        />
        @if (showEmailError()) {
          <p class="mt-2 text-[11px] text-accent">Enter a valid email address.</p>
        }

        @if (successMessage()) {
          <div
            class="mt-6 flex items-center gap-2 rounded-[3px] border border-line bg-surface px-4 py-3 text-[12px] text-text"
            role="status"
          >
            <app-icon name="check" [size]="16" />
            <span>{{ successMessage() }}</span>
          </div>
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
          class="mt-8 inline-flex h-[38px] w-fit items-center justify-center gap-2 rounded-[4px] bg-accent px-5 text-[12px] font-semibold text-ink transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          @if (submitting()) {
            <app-icon name="spinner" [size]="16" />
            Saving…
          } @else {
            Save changes
          }
        </button>
      </form>

      <div class="mt-10 h-px w-full max-w-[880px] bg-line" aria-hidden="true"></div>

      <h2 class="mt-8 text-[16px] font-semibold text-text">Account privacy</h2>
      <p class="mt-2 max-w-[830px] text-[11px] text-muted">
        Your bookmarks are private. Only your authenticated account can access them.
      </p>
      <p class="mt-2 max-w-[830px] text-[10px] text-faint">
        Authentication sessions use expiring access tokens.
      </p>
    </div>
  `,
})
export class AccountSettingsComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);

  readonly submitting = signal(false);
  readonly successMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    firstName: ['', [Validators.maxLength(100)]],
    lastName: ['', [Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email]],
  });

  constructor() {
    const user = this.auth.currentUser();
    if (user) {
      this.form.patchValue({
        firstName: user.firstName ?? '',
        lastName: user.lastName ?? '',
        email: user.email,
      });
    }
  }

  showEmailError(): boolean {
    const c = this.form.controls.email;
    return c.invalid && (c.touched || c.dirty);
  }

  submit(): void {
    this.successMessage.set(null);
    this.errorMessage.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { firstName, lastName, email } = this.form.getRawValue();
    this.submitting.set(true);
    this.auth
      .updateProfile({
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
        email: email.trim(),
      })
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: () => this.successMessage.set('Your changes have been saved.'),
        error: () => this.errorMessage.set('Could not save your changes. Please try again.'),
      });
  }
}
