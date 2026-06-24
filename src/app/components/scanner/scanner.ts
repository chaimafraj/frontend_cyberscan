import { Component, OnInit, OnDestroy, ViewEncapsulation, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-scanner',
  imports: [FormsModule, CommonModule, HttpClientModule],
  templateUrl: './scanner.html',
  styleUrl: './scanner.scss',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
})
export class Scanner implements OnInit, OnDestroy {
  targetUrl = '';
  port = '443';
  scanning = false;
  scanResult: any = null;
  errorMsg = '';
  private matrixInterval: any;
  private apiUrl = 'http://127.0.0.1:8000/api';

  options = [
    { id: 'sslscan', label: 'SSLSCAN', checked: true },
    { id: 'nmap', label: 'NMAP SSL', checked: true },
    { id: 'openssl', label: 'OPENSSL', checked: true },
    { id: 'ssllabs', label: 'SSL LABS API', checked: false },
  ];

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.startMatrix();
  }

  ngOnDestroy() {
    if (this.matrixInterval) clearInterval(this.matrixInterval);
  }

  lancerScan() {
    if (!this.targetUrl) return;
    this.scanning = true;
    this.scanResult = null;
    this.errorMsg = '';

    this.http.post<any>(`${this.apiUrl}/scans/`, { url: this.targetUrl }).subscribe({
      next: (result) => {
        this.scanning = false;
        this.scanResult = result;
        this.cdr.detectChanges();
      },
      error: () => {
        this.scanning = false;
        this.errorMsg = 'Erreur lors du scan. Vérifiez la connexion VM/SSH.';
        this.cdr.detectChanges();
      }
    });
  }

  startMatrix() {
    setTimeout(() => {
      const canvas = document.getElementById('scanner-matrix') as HTMLCanvasElement;
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
          const ch = String.fromCharCode(0x30A0 + Math.random() * 96);
          ctx.fillText(ch, i * 14, y * 14);
          if (y * 14 > canvas.height && Math.random() > 0.975) drops[i] = 0;
          drops[i]++;
        });
      }, 50);
    }, 100);
  }
}
