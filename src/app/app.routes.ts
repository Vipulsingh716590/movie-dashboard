import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    title: 'Sign in · MovieFlix Dashboard',
    loadChildren: () => import('./features/login/login.routes')
  },
  {
    path: '',
    title: 'Overview · MovieFlix Dashboard',
    canActivate: [authGuard],
    loadChildren: () => import('./features/overview/overview.routes')
  },
  {
    path: 'movies',
    title: 'Movies · MovieFlix Dashboard',
    canActivate: [authGuard],
    loadChildren: () => import('./features/movies/movies.routes')
  },
  {
    path: 'trailers',
    title: 'Trailers · MovieFlix Dashboard',
    canActivate: [authGuard],
    loadChildren: () => import('./features/trailers/trailers.routes')
  },
  {
    path: 'settings',
    title: 'Display settings · MovieFlix Dashboard',
    canActivate: [authGuard],
    loadChildren: () => import('./features/settings/settings.routes')
  },
  {
    path: '**',
    redirectTo: ''
  }
];
