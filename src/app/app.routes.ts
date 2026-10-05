import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'Overview · MovieFlix Dashboard',
    loadChildren: () => import('./features/overview/overview.routes')
  },
  {
    path: 'movies',
    title: 'Movies · MovieFlix Dashboard',
    loadChildren: () => import('./features/movies/movies.routes')
  },
  {
    path: 'settings',
    title: 'Display settings · MovieFlix Dashboard',
    loadChildren: () => import('./features/settings/settings.routes')
  },
  {
    path: '**',
    redirectTo: ''
  }
];
