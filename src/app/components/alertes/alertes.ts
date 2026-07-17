import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-alertes',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './alertes.html',
  styleUrl: './alertes.scss',
})
export class Alertes implements OnInit, OnDestroy {
  private matrixInterval: any;
  private apiUrl = 'http://127.0.0.1:8000/api/alertes/';

  alertes: any[] = [];
  stats = { critiques: 0, moyennes: 0, faibles: 0, total: 0 };
  loading = false;

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.startMatrix();
    this.loadAlertes();
  }

  ngOnDestroy() {
    if (this.matrixInterval) clearInterval(this.matrixInterval);
  }

  loadAlertes() {
    this.loading = true;
    this.http.get<any>(this.apiUrl).subscribe({
      next: (data) => {
        this.alertes = data.alertes || [];
        this.stats = data.stats || { critiques: 0, moyennes: 0, faibles: 0, total: 0 };
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur chargement alertes:', err);
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  startMatrix() {
    setTimeout(() => {
      const canvas = document.getElementById('alertes-matrix') as HTMLCanvasElement;
      if (!canvas) return;
      const ctx = canvas.getContext('2d')!;
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
