import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { IconComponent } from '../../shared/ui/icon.component';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, IconComponent],
  template: `
    <div class="min-h-screen bg-ink text-text">
      <!-- Mobile / tablet top bar -->
      <header
        class="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-panel px-4 lg:hidden"
      >
        <a routerLink="/library" class="text-[15px] font-bold tracking-wide text-text">FOLIO</a>
        <nav class="flex items-center gap-1" aria-label="Primary">
          <a
            routerLink="/library"
            class="rounded px-3 py-2 text-[13px] font-semibold text-muted transition-colors hover:text-text"
            routerLinkActive="text-text"
            aria-label="Library"
            >Library</a
          >
          <a
            routerLink="/account"
            class="rounded px-3 py-2 text-[13px] font-medium text-muted transition-colors hover:text-text"
            routerLinkActive="text-text"
            >Account</a
          >
          <button
            type="button"
            (click)="signOut()"
            class="rounded p-2 text-muted transition-colors hover:text-text focus-visible:outline-2 focus-visible:outline-accent"
            aria-label="Sign out"
            title="Sign out"
          >
            <app-icon name="logout" [size]="18" />
          </button>
        </nav>
      </header>

      <div class="lg:flex lg:min-h-screen">
        <!-- Desktop navigation rail -->
        <aside
          class="fixed inset-y-0 left-0 z-20 hidden w-56 flex-col border-r border-line bg-panel lg:flex"
        >
          <div class="px-7 pt-7">
            <a routerLink="/library" class="block text-lg font-bold tracking-wide text-text"
              >FOLIO</a
            >
            <div class="mt-2 h-0.5 w-4 bg-accent" aria-hidden="true"></div>
            <p class="mt-5 text-[9px] font-semibold tracking-[0.18em] text-faint">
              PERSONAL ARCHIVE
            </p>
          </div>

          <nav class="mt-2 flex flex-col gap-1 px-4" aria-label="Primary">
            <a
              routerLink="/library"
              routerLinkActive="bg-active text-text [&_.nav-icon]:text-accent [&_.nav-label]:font-semibold"
              class="flex h-[38px] items-center gap-3 rounded-[3px] px-3 text-[13px] font-normal text-muted transition-colors hover:bg-active hover:text-text"
            >
              <span class="nav-icon text-faint"><app-icon name="library" [size]="18" /></span>
              <span class="nav-label">Library</span>
            </a>
            <a
              routerLink="/account"
              routerLinkActive="bg-active text-text [&_.nav-icon]:text-accent [&_.nav-label]:font-semibold"
              class="flex h-[38px] items-center gap-3 rounded-[3px] px-3 text-[13px] font-normal text-muted transition-colors hover:bg-active hover:text-text"
            >
              <span class="nav-icon text-faint"><app-icon name="account" [size]="18" /></span>
              <span class="nav-label">Account</span>
            </a>
          </nav>

          <div class="mt-auto px-6 pb-6">
            <div class="h-px w-full bg-line" aria-hidden="true"></div>
            <p class="mt-5 truncate text-[12px] font-medium text-text">{{ displayName() }}</p>
            <p class="mt-1 truncate text-[9px] text-faint">{{ email() }}</p>
            <button
              type="button"
              (click)="signOut()"
              class="mt-4 inline-flex items-center gap-2 rounded-[3px] border border-line bg-surface px-3 py-2 text-[10px] font-semibold tracking-wide text-muted transition-colors hover:border-accent hover:text-accent focus-visible:outline-2 focus-visible:outline-accent"
            >
              <app-icon name="logout" [size]="14" />
              SIGN OUT
            </button>
          </div>
        </aside>

        <main class="min-w-0 flex-1 lg:pl-56">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
})
export class AppShellComponent {
  private readonly auth = inject(AuthService);

  readonly displayName = computed(() => {
    const user = this.auth.currentUser();
    if (!user) return 'Account';
    const name = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
    return name || user.email.split('@')[0];
  });

  readonly email = computed(() => this.auth.currentUser()?.email ?? '');

  signOut(): void {
    this.auth.logout();
  }
}
