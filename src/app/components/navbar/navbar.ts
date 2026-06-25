import { Component, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive, CommonModule, HttpClientModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class Navbar implements OnInit {
  isDark = true;
  backendOnline = false;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    const savedTheme = sessionStorage.getItem('theme') || 'dark';
    this.isDark = savedTheme === 'dark';
    document.body.setAttribute('data-theme', savedTheme);
  }

  toggleTheme() {
    this.isDark = !this.isDark;
    const theme = this.isDark ? 'dark' : 'light';
    sessionStorage.setItem('theme', theme);
    document.body.setAttribute('data-theme', theme);
  }
}
