import { ChangeDetectorRef, Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  imports: [FormsModule, CommonModule, HttpClientModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
})
export class Dashboard implements OnInit {
  critiques = 0;
  moyennes = 0;
  totalScans = 0;
  totalCve = 0;
  recentScans: any[] = [];

  private apiUrl = 'http://127.0.0.1:8000/api';

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.loadStats();
  }

  loadStats() {
    this.http.get<any[]>(`${this.apiUrl}/scans/`).subscribe({
      next: (scans) => {
        this.totalScans = scans.length;
        this.critiques = scans.filter((s) => s.score_risque_ia >= 7).length;
        this.moyennes = scans.filter((s) => s.score_risque_ia >= 4 && s.score_risque_ia < 7).length;
        this.totalCve = scans.reduce((sum, s) => sum + (s.cves?.length || 0), 0);
        this.recentScans = scans.slice(0, 5);
        this.cdr.detectChanges();
      },
      error: () => {},
    });
  }
}
