import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
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

  constructor(
    private authService: AuthService,
    private notifService: NotificationService,
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
  }

  ngOnDestroy() {
    this.unreadSub?.unsubscribe();
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
