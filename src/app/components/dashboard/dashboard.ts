import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
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
export class Dashboard implements OnInit, OnDestroy {
  critiques = 0;
  moyennes = 0;
  totalScans = 0;
  totalCve = 0;
  recentScans: any[] = [];

  private matrixInterval: any;
  private apiUrl = 'http://127.0.0.1:8000/api';

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.startMatrix();
    this.loadStats();
  }

  ngOnDestroy() {
    if (this.matrixInterval) clearInterval(this.matrixInterval);
  }

  loadStats() {
    const params = new HttpParams().set('page_size', '1000');

    this.http.get<any>(`${this.apiUrl}/scans/`, { params }).subscribe({
      next: (data) => {
        const scans = this.normalizeScans(data);

        this.totalScans = Array.isArray(data) ? scans.length : (data?.total ?? data?.count ?? scans.length);
        this.critiques = scans.filter((s) => s.score_risque_ia >= 7).length;
        this.moyennes = scans.filter((s) => s.score_risque_ia >= 4 && s.score_risque_ia < 7).length;
        this.totalCve = scans.reduce((sum, scan) => sum + this.countScanCves(scan), 0);
        this.recentScans = scans.slice(0, 5);
        this.cdr.detectChanges();
      },
      error: () => {
        this.resetStats();
        this.cdr.detectChanges();
      },
    });
  }

  private normalizeScans(data: any): any[] {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.results)) return data.results;
    if (Array.isArray(data?.scans)) return data.scans;
    return [];
  }

  private countScanCves(scan: any): number {
    const cves = scan.cves ?? scan.cve ?? scan.resultats_ssl?.cves ?? scan.resultats_ssl?.vulnerabilities ?? scan.vulnerabilities;

    if (Array.isArray(cves)) return cves.length;
    if (cves && typeof cves === 'object') return Object.keys(cves).length;
    return 0;
  }

  private resetStats() {
    this.critiques = 0;
    this.moyennes = 0;
    this.totalScans = 0;
    this.totalCve = 0;
    this.recentScans = [];
  }

  private startMatrix() {
    setTimeout(() => {
      const canvas = document.getElementById('matrix-canvas') as HTMLCanvasElement | null;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      const cols = Math.floor(canvas.width / 14);
      const drops = Array(cols).fill(1);

      this.matrixInterval = setInterval(() => {
        ctx.fillStyle = 'rgba(0,0,0,0.05)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#00FF41';
        ctx.font = '13px monospace';

        drops.forEach((y, i) => {
          const ch = String.fromCharCode(0x30a0 + Math.random() * 96);
          ctx.fillText(ch, i * 14, y * 14);
          if (y * 14 > canvas.height && Math.random() > 0.975) drops[i] = 0;
          drops[i]++;
        });
      }, 50);
    }, 100);
  }
}
