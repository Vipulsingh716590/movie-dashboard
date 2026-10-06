import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environment';

interface NavItem {
  path: string;
  label: string;
  icon: string;
  exact: boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  readonly siteUrl = environment.siteUrl;
  readonly demo = environment.demo;
  auth = inject(AuthService);
  private router = inject(Router);

  logout(): void {
    this.auth.logout();
    void this.router.navigateByUrl('/login');
  }

  readonly items: NavItem[] = [
    { path: '/', label: 'Overview', icon: '▦', exact: true },
    { path: '/movies', label: 'Movies', icon: '🎬', exact: false },
    { path: '/trailers', label: 'Trailers', icon: '▶', exact: false },
    { path: '/settings', label: 'Display settings', icon: '⚙', exact: false }
  ];
}
