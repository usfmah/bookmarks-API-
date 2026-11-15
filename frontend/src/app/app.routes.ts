import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'sign-in',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/sign-in.component').then((m) => m.SignInComponent),
  },
  {
    path: 'sign-up',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/sign-up.component').then((m) => m.SignUpComponent),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./layouts/app-shell/app-shell.component').then((m) => m.AppShellComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'library' },
      {
        path: 'library',
        loadComponent: () =>
          import('./features/bookmarks/library.component').then((m) => m.LibraryComponent),
      },
      {
        path: 'bookmarks/new',
        loadComponent: () =>
          import('./features/bookmarks/bookmark-form.component').then((m) => m.BookmarkFormComponent),
      },
      {
        path: 'bookmarks/:id/edit',
        loadComponent: () =>
          import('./features/bookmarks/bookmark-form.component').then((m) => m.BookmarkFormComponent),
      },
      {
        path: 'account',
        loadComponent: () =>
          import('./features/account/account-settings.component').then(
            (m) => m.AccountSettingsComponent,
          ),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
