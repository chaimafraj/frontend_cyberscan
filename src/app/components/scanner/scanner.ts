import { Component, OnInit, OnDestroy, ViewEncapsulation, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { ScannerService } from '../../services/scanner.service'; // 🆕 Import el service mte3ik s7i7!
import { ScanResponse, SiteReport, ZapFinding } from '../../models/scan.model';

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
  scanResult: SiteReport | null = null;
  zapFindings: ZapFinding[] = [];
  zapRequested = false;
  errorMsg = '';
  targetError = '';
  private matrixInterval: any;

  // Accepte : domaine (google.com), IPv4 (1.2.3.4), ou host:port (esprit.tn:8443)
  private readonly TARGET_REGEX =
    /^(?:(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}|(?:\d{1,3}\.){3}\d{1,3})(?::\d{1,5})?$/;

  options = [
    { id: 'sslscan', label: 'SSLSCAN', checked: true },
    { id: 'nmap', label: 'NMAP SSL', checked: true },
    { id: 'openssl', label: 'OPENSSL', checked: true },
    { id: 'ssllabs', label: 'SSL LABS API', checked: false },
    { id: 'nuclei', label: 'NUCLEI', checked: true },
    { id: 'whatweb', label: 'WHATWEB', checked: false },
    { id: 'zap', label: 'OWASP ZAP Baseline', checked: false },
    { id: 'nvd', label: 'NVD (National Vulnerability Database)', checked: true },
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

  // Valide le champ "Domaine cible" (domaine, IP, ou host:port). Renvoie true si vide/valide.
  validateTarget(): boolean {
    const value = (this.targetUrl || '').trim();
    if (!value) {
      this.targetError = '';
      return false;
    }
    if (!this.TARGET_REGEX.test(value)) {
      this.targetError = 'Format invalide. Exemples : google.com, 193.95.99.197, ou esprit.tn:8443';
      return false;
    }
    this.targetError = '';
    return true;
  }

  // Construit la cible envoyée au backend : "host" seul, ou "host:port" si le port != 443.
  // Le port saisi dans le champ domaine (host:port) prime sur le champ PORT séparé.
  private buildTarget(): string {
    const value = (this.targetUrl || '').trim();
    const [host, portInUrl] = value.split(':');
    const port = (portInUrl || this.port || '443').trim();
    return port && port !== '443' ? `${host}:${port}` : host;
  }

  lancerScan() {
    if (!this.validateTarget()) return;

    const target = this.buildTarget();
    this.scanning = true;
    this.scanResult = null;
    this.zapFindings = [];
    this.errorMsg = '';

    // On envoie l'état de toutes les cases (zap, nuclei, nvd, ...) dans options.<id>
    const options = this.options.reduce(
      (acc, opt) => {
        acc[opt.id] = opt.checked;
        return acc;
      },
      {} as Record<string, boolean>,
    );

    // OWASP ZAP pilote l'affichage de l'étape et de la carte dédiées
    this.zapRequested = options['zap'] ?? false;

    this.scannerService.demarrerScan(target, options).subscribe({
      next: (result: ScanResponse) => {
        this.scanning = false;

        // 🟢 Extraction s7i7a mta3 el rapport global khater Django wraps it in 'rapport'
        if (result && result.rapport && result.rapport.length > 0) {
          this.scanResult = result.rapport[0]; // Na9raw el site results direkt kima y7eb el html
        } else {
          this.scanResult = result as SiteReport; // Fallback filter
        }

        // 🟢 Récupération des alertes OWASP ZAP (racine ou à l'intérieur du rapport)
        this.zapFindings = this.extraireZapFindings(result, this.scanResult);

        console.log('Rapport CYBERSCAN chargé avec succès:', this.scanResult);
        console.log('Alertes OWASP ZAP:', this.zapFindings);
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

  // Cherche zap_findings dans la réponse racine puis dans le rapport site
  private extraireZapFindings(root: ScanResponse, site: SiteReport | null): ZapFinding[] {
    const findings = root?.zap_findings ?? site?.zap_findings ?? [];
    return Array.isArray(findings) ? findings : [];
  }

  // Normalise le niveau de risque pour le style CSS (high / medium / low / info)
  riskClass(risk: string): string {
    const r = (risk || '').toLowerCase();
    if (r.includes('high')) return 'high';
    if (r.includes('medium')) return 'medium';
    if (r.includes('low')) return 'low';
    return 'info';
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
