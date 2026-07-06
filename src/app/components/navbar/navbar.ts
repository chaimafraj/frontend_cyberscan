import { Component, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
  standalone: true,
})
export class Navbar implements OnInit {
  isDark = true;
  currentUser: any = null;

  constructor(private authService: AuthService) {}

  ngOnInit() {
    const savedTheme = sessionStorage.getItem('theme') || 'dark';
    this.isDark = savedTheme === 'dark';
    document.body.setAttribute('data-theme', savedTheme);

    this.authService.currentUser$.subscribe((user) => {
      this.currentUser = user;
    });
  }

  toggleTheme() {
    this.isDark = !this.isDark;
    const theme = this.isDark ? 'dark' : 'light';
    sessionStorage.setItem('theme', theme);
    document.body.setAttribute('data-theme', theme);
  }

  logout() {
    this.authService.logout();
  }
}
