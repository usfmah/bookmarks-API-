import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { BookmarkService } from '../../core/services/bookmark.service';
import { Bookmark } from '../../core/models/models';
import {
  displayAddress,
  displayHost,
  formatLongDate,
  formatShortDate,
  monogram,
  siteName,
} from '../../core/utils/bookmark.utils';
import { IconComponent } from '../../shared/ui/icon.component';

@Component({
  selector: 'app-library',
  imports: [RouterLink, IconComponent],
  template: `
    <div class="flex min-h-screen flex-col bg-ink lg:flex-row">
      <!-- ================= Master — bookmark list ================= -->
      <section class="min-w-0 flex-1 px-5 pb-16 pt-6 sm:px-8 sm:pt-8 lg:px-10" aria-label="Bookmarks">
        <p class="text-[9px] font-semibold tracking-[0.18em] text-faint">PERSONAL ARCHIVE</p>
        <div class="mt-2 flex flex-wrap items-center justify-between gap-4">
          <h1 class="text-[30px] font-semibold leading-tight text-text">Your library</h1>
          <a
            routerLink="/bookmarks/new"
            class="inline-flex h-[38px] items-center gap-2 rounded-[4px] bg-accent px-4 text-[12px] font-semibold text-ink transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <app-icon name="plus" [size]="16" />
            Add bookmark
          </a>
        </div>
        <p class="mt-2 text-[10px] font-semibold tracking-[0.18em] text-faint">
          {{ countLabel() }}
        </p>

        <!-- Column headings -->
        <div
          class="mt-8 grid grid-cols-[1fr_2.5rem] items-center gap-2 border-b border-line pb-3 xl:grid-cols-[minmax(0,1fr)_220px_130px_2.5rem]"
          aria-hidden="true"
        >
          <p class="text-[9px] font-semibold tracking-[0.18em] text-faint">TITLE</p>
          <p class="hidden text-[9px] font-semibold tracking-[0.18em] text-faint xl:block">ADDRESS</p>
          <p class="hidden text-[9px] font-semibold tracking-[0.18em] text-faint xl:block">ADDED</p>
          <span></span>
        </div>

        @if (loading()) {
          <!-- Loading state -->
          <ul aria-label="Loading bookmarks" aria-busy="true">
            @for (row of skeletonRows; track row) {
              <li class="grid grid-cols-[2px_40px_1fr] items-center gap-3 border-b border-line py-5">
                <span class="h-full w-0.5 bg-line/50"></span>
                <span class="h-[30px] w-[30px] animate-pulse rounded-[4px] bg-surface"></span>
                <span class="flex flex-col gap-2">
                  <span class="h-3 w-2/3 animate-pulse rounded bg-surface"></span>
                  <span class="h-2.5 w-1/2 animate-pulse rounded bg-surface"></span>
                </span>
              </li>
            }
          </ul>
        } @else if (error()) {
          <!-- Error state -->
          <div class="mt-16 flex flex-col items-start gap-4" role="alert">
            <app-icon name="alert" [size]="28" />
            <div>
              <p class="text-[15px] font-semibold text-text">Couldn't load your bookmarks</p>
              <p class="mt-1 text-[12px] text-muted">Check your connection and try again.</p>
            </div>
            <button
              type="button"
              (click)="load()"
              class="inline-flex h-[38px] items-center rounded-[4px] border border-line bg-surface px-4 text-[12px] font-semibold text-text hover:border-accent hover:text-accent focus-visible:outline-2 focus-visible:outline-accent"
            >
              Retry
            </button>
          </div>
        } @else if (bookmarks().length === 0) {
          <!-- Empty state -->
          <div class="mt-20 flex max-w-md flex-col items-start gap-4">
            <span class="rounded-[4px] border border-line bg-surface p-3 text-accent">
              <app-icon name="bookmark" [size]="26" />
            </span>
            <div>
              <p class="text-[15px] font-semibold text-text">Nothing saved yet</p>
              <p class="mt-1 text-[12px] leading-relaxed text-muted">
                Your archive is empty. Save your first link and it will live here — private to your account.
              </p>
            </div>
            <a
              routerLink="/bookmarks/new"
              class="inline-flex h-[38px] items-center gap-2 rounded-[4px] bg-accent px-4 text-[12px] font-semibold text-ink hover:opacity-90 focus-visible:outline-2 focus-visible:outline-accent"
            >
              <app-icon name="plus" [size]="16" />
              Add your first bookmark
            </a>
          </div>
        } @else {
          <!-- List -->
          <ul>
            @for (bookmark of bookmarks(); track bookmark.id) {
              <li
                class="relative border-b border-line transition-colors"
                [class.bg-active]="selected()?.id === bookmark.id"
              >
                <span
                  class="absolute left-0 top-0 h-full w-0.5"
                  [class.bg-accent]="selected()?.id === bookmark.id"
                  aria-hidden="true"
                ></span>
                <button
                  type="button"
                  class="grid w-full grid-cols-[40px_minmax(0,1fr)] items-center gap-3 py-4 pl-4 pr-12 text-left transition-colors focus-visible:outline-2 focus-visible:outline-accent xl:grid-cols-[40px_minmax(0,1fr)_220px_130px_2.5rem] xl:pr-2"
                  (click)="select(bookmark)"
                  [attr.aria-pressed]="selected()?.id === bookmark.id"
                  [attr.aria-label]="'View ' + bookmark.title"
                >
                  <span
                    class="flex h-[30px] w-[30px] items-center justify-center rounded-[4px] border border-line bg-surface text-[11px] font-semibold text-accent"
                  >
                    {{ monogram(bookmark.link) }}
                  </span>
                  <span class="min-w-0">
                    <span class="block truncate text-[14px] font-medium text-text">{{
                      bookmark.title
                    }}</span>
                    <span class="mt-0.5 block truncate text-[10px] text-muted">
                      {{ bookmark.description || displayHost(bookmark.link) }}
                    </span>
                  </span>
                  <span class="hidden truncate text-[11px] text-muted xl:block">{{
                    displayAddress(bookmark.link)
                  }}</span>
                  <span class="hidden text-[10px] text-faint xl:block">{{
                    formatShortDate(bookmark.createdAt)
                  }}</span>
                </button>
                <div class="absolute right-1 top-1/2 -translate-y-1/2">
                  <button
                    type="button"
                    class="rounded-[3px] p-2 text-faint transition-colors hover:bg-surface hover:text-text focus-visible:outline-2 focus-visible:outline-accent"
                    (click)="toggleMenu(bookmark.id, $event)"
                    [attr.aria-label]="'Actions for ' + bookmark.title"
                    [attr.aria-expanded]="openMenuFor() === bookmark.id"
                    aria-haspopup="menu"
                  >
                    <app-icon name="more" [size]="17" />
                  </button>
                  @if (openMenuFor() === bookmark.id) {
                    <div
                      role="menu"
                      class="absolute right-0 top-full z-20 mt-1 w-44 overflow-hidden rounded-[4px] border border-line bg-panel py-1 shadow-lg"
                    >
                      <button
                        type="button"
                        role="menuitem"
                        class="flex w-full items-center gap-2 px-3 py-2 text-[12px] text-muted hover:bg-surface hover:text-text"
                        (click)="openLink(bookmark)"
                      >
                        <app-icon name="open" [size]="14" /> Open link
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        class="flex w-full items-center gap-2 px-3 py-2 text-[12px] text-muted hover:bg-surface hover:text-text"
                        (click)="editBookmark(bookmark)"
                      >
                        <app-icon name="edit" [size]="14" /> Edit
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        class="flex w-full items-center gap-2 px-3 py-2 text-[12px] text-muted hover:bg-surface hover:text-text"
                        (click)="requestDelete(bookmark)"
                      >
                        <app-icon name="trash" [size]="14" /> Delete
                      </button>
                    </div>
                  }
                </div>
              </li>
            }
          </ul>
        }
      </section>

      <!-- ================= Detail — inspector ================= -->
      <aside
        class="border-t border-line bg-panel px-6 py-6 sm:px-8 lg:w-[434px] lg:shrink-0 lg:border-l lg:border-t-0 lg:py-10 lg:pl-8 lg:pr-8"
        aria-label="Bookmark details"
      >
        @if (selected(); as bookmark) {
          <p class="text-[9px] font-semibold tracking-[0.18em] text-faint">SELECTED BOOKMARK</p>
          <h2 class="mt-6 text-[24px] font-semibold leading-snug text-text">{{ bookmark.title }}</h2>
          <a
            class="mt-4 inline-flex items-center gap-1 text-[12px] font-medium text-accent hover:underline"
            [href]="bookmark.link"
            target="_blank"
            rel="noopener noreferrer"
          >
            {{ siteName(bookmark.link) }}
            <app-icon name="external" [size]="12" />
          </a>

          <div class="mt-6 h-px w-full bg-line" aria-hidden="true"></div>

          <p class="mt-5 text-[9px] font-semibold tracking-[0.18em] text-faint">LINK</p>
          <a
            class="mt-2 block break-all text-[11px] text-text hover:text-accent"
            [href]="bookmark.link"
            target="_blank"
            rel="noopener noreferrer"
            >{{ bookmark.link }}</a
          >

          <p class="mt-6 text-[9px] font-semibold tracking-[0.18em] text-faint">DESCRIPTION</p>
          <p class="mt-2 text-[11px] leading-relaxed text-muted">
            {{ bookmark.description || 'No description provided.' }}
          </p>

          <div class="mt-6 h-px w-full bg-line" aria-hidden="true"></div>

          <p class="mt-5 text-[9px] font-semibold tracking-[0.18em] text-faint">CREATED</p>
          <p class="mt-2 text-[11px] text-text">{{ formatLongDate(bookmark.createdAt) }}</p>

          <p class="mt-5 text-[9px] font-semibold tracking-[0.18em] text-faint">LAST UPDATED</p>
          <p class="mt-2 text-[11px] text-text">{{ formatLongDate(bookmark.updatedAt) }}</p>

          <div class="mt-6 h-px w-full bg-line" aria-hidden="true"></div>

          <div class="mt-7 flex items-center gap-3">
            <button
              type="button"
              (click)="editBookmark(bookmark)"
              class="inline-flex h-[38px] items-center justify-center rounded-[4px] bg-accent px-5 text-[12px] font-semibold text-ink transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              Edit bookmark
            </button>
            <button
              type="button"
              (click)="requestDelete(bookmark)"
              class="inline-flex h-[38px] items-center justify-center rounded-[4px] border border-line bg-active px-5 text-[12px] font-semibold text-text transition-colors hover:border-line hover:bg-surface focus-visible:outline-2 focus-visible:outline-accent"
            >
              Delete
            </button>
          </div>
          <p class="mt-6 text-[9px] font-semibold tracking-[0.18em] text-faint">
            PRIVATE TO YOUR ACCOUNT
          </p>
        } @else {
          <p class="text-[9px] font-semibold tracking-[0.18em] text-faint">SELECTED BOOKMARK</p>
          <p class="mt-6 text-[15px] font-medium text-muted">Select a bookmark to see its details.</p>
        }
      </aside>
    </div>

    <!-- Delete confirmation -->
    @if (pendingDelete(); as bookmark) {
      <div
        class="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-6"
        role="presentation"
        (click)="cancelDelete()"
      >
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
          class="w-full max-w-md rounded-[4px] border border-line bg-panel p-6"
          (click)="$event.stopPropagation()"
        >
          <h2 id="delete-dialog-title" class="text-[16px] font-semibold text-text">Delete bookmark?</h2>
          <p class="mt-2 text-[12px] leading-relaxed text-muted">
            “{{ bookmark.title }}” will be permanently removed from your archive. This cannot be undone.
          </p>
          <div class="mt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              (click)="cancelDelete()"
              class="h-[38px] rounded-[4px] border border-line bg-surface px-4 text-[12px] font-semibold text-muted hover:text-text focus-visible:outline-2 focus-visible:outline-accent"
            >
              Cancel
            </button>
            <button
              type="button"
              (click)="confirmDelete()"
              class="inline-flex h-[38px] items-center gap-2 rounded-[4px] bg-accent px-4 text-[12px] font-semibold text-ink hover:opacity-90 focus-visible:outline-2 focus-visible:outline-accent"
            >
              <app-icon name="trash" [size]="14" />
              Delete bookmark
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class LibraryComponent {
  private readonly bookmarkService = inject(BookmarkService);
  private readonly router = inject(Router);

  readonly bookmarks = signal<Bookmark[]>([]);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly selectedId = signal<number | null>(null);
  readonly openMenuFor = signal<number | null>(null);
  readonly pendingDelete = signal<Bookmark | null>(null);

  readonly skeletonRows = [0, 1, 2, 3, 4];

  readonly selected = computed(
    () => this.bookmarks().find((b) => b.id === this.selectedId()) ?? this.bookmarks()[0] ?? null,
  );

  readonly countLabel = computed(() => {
    const n = this.bookmarks().length;
    return `${String(n).padStart(2, '0')} SAVED LINK${n === 1 ? '' : 'S'}`;
  });

  constructor() {
    this.load();
  }

  @HostListener('document:click')
  closeMenus(): void {
    this.openMenuFor.set(null);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.openMenuFor.set(null);
    this.pendingDelete.set(null);
  }

  load(): void {
    this.loading.set(true);
    this.error.set(false);
    this.bookmarkService
      .list()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (items) => {
          const sorted = [...items].sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          );
          this.bookmarks.set(sorted);
          if (this.selectedId() === null && sorted.length > 0) {
            this.selectedId.set(sorted[0].id);
          }
        },
        error: () => this.error.set(true),
      });
  }

  select(bookmark: Bookmark): void {
    this.selectedId.set(bookmark.id);
  }

  toggleMenu(id: number, event: MouseEvent): void {
    event.stopPropagation();
    this.openMenuFor.set(this.openMenuFor() === id ? null : id);
  }

  openLink(bookmark: Bookmark): void {
    this.openMenuFor.set(null);
    window.open(bookmark.link, '_blank', 'noopener,noreferrer');
  }

  editBookmark(bookmark: Bookmark): void {
    this.openMenuFor.set(null);
    void this.router.navigate(['/bookmarks', bookmark.id, 'edit']);
  }

  requestDelete(bookmark: Bookmark): void {
    this.openMenuFor.set(null);
    this.pendingDelete.set(bookmark);
  }

  cancelDelete(): void {
    this.pendingDelete.set(null);
  }

  confirmDelete(): void {
    const bookmark = this.pendingDelete();
    if (!bookmark) return;
    this.bookmarkService.delete(bookmark.id).subscribe({
      next: () => {
        this.pendingDelete.set(null);
        this.bookmarks.update((items) => items.filter((b) => b.id !== bookmark.id));
        if (this.selectedId() === bookmark.id) {
          this.selectedId.set(this.bookmarks()[0]?.id ?? null);
        }
      },
      error: () => {
        this.pendingDelete.set(null);
        this.error.set(true);
      },
    });
  }

  protected readonly displayAddress = displayAddress;
  protected readonly displayHost = displayHost;
  protected readonly formatShortDate = formatShortDate;
  protected readonly formatLongDate = formatLongDate;
  protected readonly monogram = monogram;
  protected readonly siteName = siteName;
}
