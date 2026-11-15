import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { BookmarkService } from '../../core/services/bookmark.service';
import { normalizeLink, isValidHttpUrl } from '../../core/utils/bookmark.utils';
import { IconComponent } from '../../shared/ui/icon.component';

/** Add/Edit bookmark — same editorial form, edit mode when the route carries an :id. */
@Component({
  selector: 'app-bookmark-form',
  imports: [ReactiveFormsModule, RouterLink, IconComponent],
  template: `
    <div class="min-h-screen bg-ink px-5 pb-16 pt-6 text-text sm:px-8 sm:pt-8 lg:px-10">
      <p class="text-[9px] font-semibold tracking-[0.18em] text-faint">LIBRARY / BOOKMARKS</p>
      <h1 class="mt-2 text-[30px] font-semibold leading-tight text-text">
        {{ isEdit() ? 'Edit bookmark' : 'Add a bookmark' }}
      </h1>
      <p class="mt-14 text-[13px] text-muted">
        {{ isEdit() ? 'Update the details of this saved link.' : 'Save a useful link to your personal archive.' }}
      </p>

      @if (loadError()) {
        <div
          class="mt-8 flex max-w-[720px] items-start gap-2 rounded-[3px] border border-line bg-surface px-4 py-3 text-[12px] text-text"
          role="alert"
        >
          <app-icon name="alert" [size]="16" />
          <span>Couldn't load this bookmark. It may have been deleted.</span>
        </div>
      }

      <form
        class="mt-8 flex w-full max-w-[720px] flex-col"
        [formGroup]="form"
        (ngSubmit)="submit()"
        novalidate
      >
        <label for="title" class="text-[9px] font-semibold tracking-[0.18em] text-faint">TITLE</label>
        <input
          id="title"
          type="text"
          autocomplete="off"
          formControlName="title"
          placeholder="Enter a clear title"
          class="mt-2 h-[46px] rounded-[10px] border border-line bg-surface px-4 text-[12px] text-text placeholder-faint focus:border-accent focus:outline-none"
          [attr.aria-invalid]="showError('title')"
        />
        @if (showError('title')) {
          <p class="mt-2 text-[11px] text-accent">Give this bookmark a title.</p>
        }

        <label for="link" class="mt-6 text-[9px] font-semibold tracking-[0.18em] text-faint">LINK</label>
        <input
          id="link"
          type="url"
          inputmode="url"
          autocomplete="off"
          formControlName="link"
          placeholder="https://"
          class="mt-2 h-[46px] rounded-[10px] border border-line bg-surface px-4 text-[12px] text-text placeholder-faint focus:border-accent focus:outline-none"
          [attr.aria-invalid]="showError('link')"
        />
        @if (showError('link')) {
          <p class="mt-2 text-[11px] text-accent">Enter a valid URL, e.g. https://example.com.</p>
        }

        <label for="description" class="mt-6 text-[9px] font-semibold tracking-[0.18em] text-faint"
          >DESCRIPTION</label
        >
        <textarea
          id="description"
          formControlName="description"
          placeholder="Add a short description (optional)"
          rows="5"
          class="mt-2 resize-y rounded-[10px] border border-line bg-surface px-4 py-3 text-[12px] text-text placeholder-faint focus:border-accent focus:outline-none"
        ></textarea>

        @if (submitError()) {
          <div
            class="mt-6 flex items-start gap-2 rounded-[3px] border border-line bg-surface px-4 py-3 text-[12px] text-text"
            role="alert"
          >
            <app-icon name="alert" [size]="16" />
            <span>{{ submitError() }}</span>
          </div>
        }

        <div class="mt-10 h-px w-full bg-line" aria-hidden="true"></div>

        <div class="mt-8 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            [disabled]="submitting() || loading()"
            class="inline-flex h-[38px] items-center justify-center gap-2 rounded-[4px] bg-accent px-5 text-[12px] font-semibold text-ink transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            @if (submitting()) {
              <app-icon name="spinner" [size]="16" />
              Saving…
            } @else {
              {{ isEdit() ? 'Save changes' : 'Save bookmark' }}
            }
          </button>
          <a
            routerLink="/library"
            class="inline-flex h-[38px] items-center rounded-[4px] border border-line bg-active px-5 text-[12px] font-semibold text-text transition-colors hover:bg-surface focus-visible:outline-2 focus-visible:outline-accent"
          >
            Cancel
          </a>
        </div>
        <p class="mt-8 text-[11px] text-faint">Saved privately to your account.</p>
      </form>
    </div>
  `,
})
export class BookmarkFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly bookmarkService = inject(BookmarkService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  private readonly bookmarkId = signal<number | null>(null);
  readonly isEdit = computed(() => this.bookmarkId() !== null);

  readonly loading = signal(false);
  readonly submitting = signal(false);
  readonly loadError = signal(false);
  readonly submitError = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(200)]],
    link: ['', [Validators.required]],
    description: ['', [Validators.maxLength(1000)]],
  });

  constructor() {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam !== null) {
      const id = Number(idParam);
      if (Number.isInteger(id) && id > 0) {
        this.bookmarkId.set(id);
        this.loadBookmark(id);
      } else {
        this.loadError.set(true);
      }
    }
  }

  private loadBookmark(id: number): void {
    this.loading.set(true);
    this.bookmarkService
      .getById(id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (bookmark) =>
          this.form.patchValue({
            title: bookmark.title,
            link: bookmark.link,
            description: bookmark.description ?? '',
          }),
        error: () => this.loadError.set(true),
      });
  }

  showError(control: 'title' | 'link'): boolean {
    const c = this.form.controls[control];
    if (!(c.touched || c.dirty)) return false;
    if (control === 'title') return c.invalid;
    return c.hasError('required') || (c.value !== '' && !isValidHttpUrl(normalizeLink(c.value)));
  }

  submit(): void {
    this.submitError.set(null);
    const raw = this.form.getRawValue();
    const link = normalizeLink(raw.link);

    if (this.form.controls.title.invalid || !raw.link.trim() || !isValidHttpUrl(link)) {
      this.form.markAllAsTouched();
      return;
    }

    const payload = {
      title: raw.title.trim(),
      link,
      ...(raw.description.trim() ? { description: raw.description.trim() } : {}),
    };

    this.submitting.set(true);
    const id = this.bookmarkId();
    const request$ =
      id !== null ? this.bookmarkService.update(id, payload) : this.bookmarkService.create(payload);

    request$.pipe(finalize(() => this.submitting.set(false))).subscribe({
      next: () => void this.router.navigate(['/library']),
      error: () =>
        this.submitError.set(
          id !== null
            ? 'Could not save your changes. Please try again.'
            : 'Could not save this bookmark. Please try again.',
        ),
    });
  }
}
