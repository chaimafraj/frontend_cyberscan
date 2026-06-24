import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from './components/navbar/navbar';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  title = 'frontend';

  ngOnInit() {
    const savedTheme = sessionStorage.getItem('theme') || 'dark';
    document.body.setAttribute('data-theme', savedTheme);
  }
}
