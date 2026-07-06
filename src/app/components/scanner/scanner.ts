import { Component, OnInit, OnDestroy, ViewEncapsulation, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { ScannerService } from '../../services/scanner.service'; // 🆕 Import el service mte3ik s7i7!

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

  options = [
    { id: 'sslscan', label: 'SSLSCAN', checked: true },
    { id: 'nmap', label: 'NMAP SSL', checked: true },
    { id: 'openssl', label: 'OPENSSL', checked: true },
    { id: 'ssllabs', label: 'SSL LABS API', checked: false },
  ];

  // 🆕 Injecti el ScannerService hna (na3mlo remove lil HttpClient mel component direct)
  constructor(
    private scannerService: ScannerService,
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

    this.scannerService.demarrerScan(this.targetUrl).subscribe({
      next: (result) => {
        this.scanning = false;

        // 🟢 Extraction s7i7a mta3 el rapport global khater Django wraps it in 'rapport'
        if (result && result.rapport && result.rapport.length > 0) {
          this.scanResult = result.rapport[0]; // Na9raw el site results direkt kima y7eb el html
        } else {
          this.scanResult = result; // Fallback filter
        }

        console.log('Rapport CYBERSCAN chargé avec succès:', this.scanResult);
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.scanning = false;
        console.error('Erreur scan:', err);
        this.errorMsg = 'Erreur lors du scan. Vérifiez la connexion VM/SSH.';
        this.cdr.detectChanges();
      },
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
          const ch = String.fromCharCode(0x30a0 + Math.random() * 96);
          ctx.fillText(ch, i * 14, y * 14);
          if (y * 14 > canvas.height && Math.random() > 0.975) drops[i] = 0;
          drops[i]++;
        });
      }, 50);
    }, 100);
  }
}
