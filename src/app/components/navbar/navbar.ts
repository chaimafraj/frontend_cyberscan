import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { DataSyncService } from '../../services/data-sync.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
  standalone: true,
})
export class Navbar implements OnInit, OnDestroy {
  isDark = true;
  isMenuOpen = false;
  currentUser: any = null;
  unreadCount = 0;
  private unreadSub?: Subscription;
  private refreshSub?: Subscription;

  constructor(
    private authService: AuthService,
    private notifService: NotificationService,
    private dataSync: DataSyncService,
  ) {}

  ngOnInit() {
    const savedTheme = sessionStorage.getItem('theme') || 'dark';
    this.isDark = savedTheme === 'dark';
    document.body.setAttribute('data-theme', savedTheme);

    this.authService.currentUser$.subscribe((user) => {
      this.currentUser = user;
      if (user) {
        this.notifService.startPolling();
      } else {
        this.notifService.stopPolling();
        this.unreadCount = 0;
      }
    });

    this.unreadSub = this.notifService.unreadCount.subscribe((count) => {
      this.unreadCount = count;
    });
    this.refreshSub = this.dataSync.notificationsRefresh$.subscribe(() => {
      this.notifService.fetchUnreadCount(true);
    });
  }

  ngOnDestroy() {
    this.unreadSub?.unsubscribe();
    this.refreshSub?.unsubscribe();
  }

  toggleTheme() {
    this.isDark = !this.isDark;
    const theme = this.isDark ? 'dark' : 'light';
    sessionStorage.setItem('theme', theme);
    document.body.setAttribute('data-theme', theme);
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  closeMenu() {
    this.isMenuOpen = false;
  }

  logout() {
    this.authService.logout();
  }
}
