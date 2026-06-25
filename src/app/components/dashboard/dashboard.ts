import { ChangeDetectorRef, Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule, HttpParams } from '@angular/common/http';
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
    const params = new HttpParams().set('page_size', 1000);

    this.http.get<any>(`${this.apiUrl}/scans/`, { params }).subscribe({
      next: (data) => {
        const scans = Array.isArray(data) ? data : (data.results ?? []);

        this.totalScans = data.total ?? data.count ?? scans.length;
        this.critiques = scans.filter((s) => s.score_risque_ia >= 7).length;
        this.moyennes = scans.filter((s) => s.score_risque_ia >= 4 && s.score_risque_ia < 7).length;
        this.totalCve = scans.reduce((sum, scan) => sum + this.countScanCves(scan), 0);
        this.recentScans = scans.slice(0, 5);
        this.cdr.detectChanges();
      },
      error: () => {
        this.critiques = 0;
        this.moyennes = 0;
        this.totalScans = 0;
        this.totalCve = 0;
        this.recentScans = [];
        this.cdr.detectChanges();
      },
    });
  }

  private countScanCves(scan: any): number {
    const cves = scan.cves ?? scan.cve ?? scan.resultats_ssl?.cves ?? scan.resultats_ssl?.vulnerabilities ?? scan.vulnerabilities;

    if (Array.isArray(cves)) return cves.length;
    if (cves && typeof cves === 'object') return Object.keys(cves).length;
    return 0;
  }
}
