import { Component, OnInit, OnDestroy, ViewEncapsulation, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { AuthService } from '../../services/auth.service';
import { ScannerService } from '../../services/scanner.service';
import { VulnManuelleForm } from '../vuln-manuelle-form/vuln-manuelle-form';

@Component({
  selector: 'app-historique',
  imports: [FormsModule, CommonModule, MatTableModule, MatPaginatorModule, VulnManuelleForm],
  templateUrl: './historique.html',
  styleUrl: './historique.scss',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
})
class Historique implements OnInit, OnDestroy {
  search = '';
  filterRisk = '';
  scans: any[] = [];
  dataSource = new MatTableDataSource<any>([]);
  displayedColumns: string[] = [];
  isAdmin = false;
  selectedScan: any = null;
  selectedProtocol: any = null;
  editMode = false;
  editDomaine = '';
  loading = false;

  vulnsManuelles: any[] = [];
  showVulnForm = false;

  /** Messages UI (succès / erreur) pour PDF et email */
  actionMessage: { type: 'success' | 'error'; text: string } | null = null;
  private actionMessageTimer: ReturnType<typeof setTimeout> | null = null;

  currentPage = 1;
  pageSize = 10;
  totalPages = 1;
  total = 0;

  private matrixInterval: any;
  private apiUrl = 'http://127.0.0.1:8000/api';

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private scannerService: ScannerService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.isAdmin = this.authService.getUserRole() === 'admin';
    this.displayedColumns = this.isAdmin
      ? ['client', 'domaine', 'date', 'protocols', 'score', 'statut', 'rapport', 'email', 'actions']
      : ['domaine', 'date', 'protocols', 'score', 'statut', 'rapport', 'email', 'actions'];
    this.startMatrix();
    this.loadScans();
  }

  ngOnDestroy() {
    if (this.matrixInterval) clearInterval(this.matrixInterval);
    if (this.actionMessageTimer) clearTimeout(this.actionMessageTimer);
  }

  loadScans(page = 1) {
    this.loading = true;
    const search = this.search.trim();
    let params = new HttpParams().set('page', page).set('page_size', this.pageSize);

    if (search) params = params.set('search', search);
    if (this.filterRisk) params = params.set('risk', this.filterRisk.toUpperCase());

    this.http.get<any>(`${this.apiUrl}/scans/`, { params }).subscribe({
      next: (data) => {
        const list = Array.isArray(data) ? data : (data.results ?? []);
        this.total = data.total ?? data.count ?? list.length;
        this.totalPages = data.total_pages ?? Math.max(1, Math.ceil(this.total / this.pageSize));
        this.currentPage = data.page ?? page;

        this.scans = list.map((s: any) => this.mapScanUi(s));
        this.dataSource.data = this.scans;
        this.loading = false;
      },
      error: (err) => {
        console.error('API Error:', err);
        this.loading = false;
      },
    });
  }

  /** Enrichit un scan avec les champs d'interface PDF / email */
  private mapScanUi(s: any) {
    const pdfReady = !!(s.pdf_disponible ?? s.has_rapport);
    return {
      ...s,
      riskClass: s.score_risque_ia >= 7 ? 'danger' : s.score_risque_ia >= 4 ? 'warn' : 'ok',
      statut: s.score_risque_ia >= 7 ? 'CRITIQUE' : s.score_risque_ia >= 4 ? 'MOYEN' : 'FAIBLE',
      // Statuts rapport : non_genere | generation | pret | erreur
      rapportStatus:
        s.rapport_status ?? s.rapportStatus ?? (pdfReady ? 'pret' : 'non_genere'),
      // Statuts email : non_envoye | envoi | envoye | erreur
      emailStatus: s.email_status ?? s.emailStatus ?? 'non_envoye',
      pdfGenerating: false,
      pdfDownloading: false,
      emailSending: false,
    };
  }

  getRapportStatusLabel(status: string): string {
    switch (status) {
      case 'generation':
        return 'GÉNÉRATION...';
      case 'pret':
        return 'PRÊT';
      case 'erreur':
        return 'ERREUR';
      default:
        return 'NON GÉNÉRÉ';
    }
  }

  getEmailStatusLabel(status: string): string {
    switch (status) {
      case 'envoi':
        return 'ENVOI...';
      case 'envoye':
        return 'ENVOYÉ';
      case 'erreur':
        return 'ERREUR';
      default:
        return 'NON ENVOYÉ';
    }
  }

  showActionMessage(type: 'success' | 'error', text: string) {
    if (this.actionMessageTimer) clearTimeout(this.actionMessageTimer);
    this.actionMessage = { type, text };
    this.actionMessageTimer = setTimeout(() => {
      this.actionMessage = null;
      this.actionMessageTimer = null;
      this.cdr.detectChanges();
    }, 4000);
    this.cdr.detectChanges();
  }

  clearActionMessage() {
    if (this.actionMessageTimer) clearTimeout(this.actionMessageTimer);
    this.actionMessage = null;
  }

  private refreshScanRow(scan: any) {
    this.dataSource.data = [...this.scans];
    this.cdr.detectChanges();
  }

  private extractErrorMessage(err: any, fallback: string): string {
    const body = err?.error;
    if (!body) return fallback;
    if (typeof body === 'string') return body;
    if (body.error) return String(body.error);
    if (body.detail) return String(body.detail);
    if (body.message) return String(body.message);
    return fallback;
  }

  private async blobErrorMessage(err: any, fallback: string): Promise<string> {
    try {
      if (err?.error instanceof Blob) {
        const text = await err.error.text();
        const parsed = JSON.parse(text);
        return parsed.error || parsed.detail || parsed.message || fallback;
      }
    } catch {
      /* ignore parse errors */
    }
    return this.extractErrorMessage(err, fallback);
  }

  /**
   * Génère si besoin puis télécharge le rapport PDF via l'API.
   * GET /api/scans/:id/rapport/download/
   */
  telechargerRapportPdf(scan: any, event?: Event) {
    event?.stopPropagation();
    if (scan.pdfGenerating || scan.pdfDownloading) return;

    this.clearActionMessage();
    scan.pdfGenerating = true;
    scan.rapportStatus = 'generation';
    this.refreshScanRow(scan);

    this.scannerService.downloadRapportPdf(scan.id).subscribe({
      next: (blob) => {
        scan.pdfGenerating = false;

        if (!(blob instanceof Blob) || blob.size === 0) {
          scan.rapportStatus = 'erreur';
          scan.pdfDownloading = false;
          this.showActionMessage('error', `Rapport PDF vide pour ${scan.domaine}.`);
          this.refreshScanRow(scan);
          return;
        }

        // Erreur JSON renvoyée en blob (ex. 500)
        if (blob.type && blob.type.includes('application/json')) {
          blob.text().then((text) => {
            let msg = `Échec du téléchargement du rapport PDF pour ${scan.domaine}.`;
            try {
              const parsed = JSON.parse(text);
              msg = parsed.error || parsed.detail || msg;
            } catch {
              /* keep default */
            }
            scan.rapportStatus = 'erreur';
            scan.pdfDownloading = false;
            this.showActionMessage('error', msg);
            this.refreshScanRow(scan);
          });
          return;
        }

        scan.pdfDownloading = true;
        this.refreshScanRow(scan);

        const filename = `rapport_cyberscan_${scan.id}_${(scan.domaine || 'scan').replace(/[^\w.-]+/g, '_')}.pdf`;
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        scan.pdfDownloading = false;
        scan.rapportStatus = 'pret';
        scan.pdf_disponible = true;
        scan.has_rapport = true;
        this.showActionMessage('success', `Rapport PDF de ${scan.domaine} téléchargé avec succès.`);
        this.refreshScanRow(scan);
      },
      error: async (err) => {
        scan.pdfGenerating = false;
        scan.pdfDownloading = false;
        scan.rapportStatus = 'erreur';
        const msg = await this.blobErrorMessage(
          err,
          `Échec du téléchargement du rapport PDF pour ${scan.domaine}.`,
        );
        this.showActionMessage('error', msg);
        this.refreshScanRow(scan);
      },
    });
  }

  /**
   * Envoie le rapport par email (API).
   * POST /api/scans/:id/rapport/email/
   * (L'envoi automatique post-scan reste géré côté backend via finalize_scan_report.)
   */
  envoyerRapportEmail(scan: any, event?: Event) {
    event?.stopPropagation();
    if (scan.emailSending) return;

    this.clearActionMessage();
    scan.emailSending = true;
    scan.emailStatus = 'envoi';
    this.refreshScanRow(scan);

    this.scannerService.sendRapportEmail(scan.id).subscribe({
      next: (res) => {
        scan.emailSending = false;
        scan.emailStatus = 'envoye';
        const recipients = (res?.recipients || []).join(', ');
        this.showActionMessage(
          'success',
          recipients
            ? `Rapport de ${scan.domaine} envoyé à ${recipients}.`
            : `Rapport de ${scan.domaine} envoyé par email avec succès.`,
        );
        this.refreshScanRow(scan);
      },
      error: (err) => {
        scan.emailSending = false;
        scan.emailStatus = 'erreur';
        const msg = this.extractErrorMessage(
          err,
          `Échec de l'envoi du rapport par email pour ${scan.domaine}.`,
        );
        this.showActionMessage('error', msg);
        this.refreshScanRow(scan);
      },
    });
  }

  isScanBusy(scan: any): boolean {
    return !!(scan?.pdfGenerating || scan?.pdfDownloading || scan?.emailSending);
  }

  lancerRecherche() {
    this.currentPage = 1;
    this.loadScans(1);
  }

  onFilterChange() {
    this.currentPage = 1;
    this.loadScans(1);
  }

  onPageChange(event: PageEvent) {
    this.pageSize = event.pageSize;
    this.currentPage = event.pageIndex + 1;
    this.loadScans(this.currentPage);
  }

  viewScan(scan: any) {
    this.selectedScan = scan;
    if (scan.score_risque_ia >= 7) {
      this.selectedScan.riskClass = 'risk-high';
    } else if (scan.score_risque_ia >= 4) {
      this.selectedScan.riskClass = 'risk-medium';
    } else {
      this.selectedScan.riskClass = 'risk-low';
    }
    this.loadVulnsManuelles(scan.id);
  }

  closeModal() {
    this.selectedScan = null;
    this.selectedProtocol = null;
  }

  deleteScan(scan: any, event: Event) {
    event.stopPropagation();
    this.http.delete(`${this.apiUrl}/scans/${scan.id}/`).subscribe({
      next: () => {
        this.scans = this.scans.filter((s) => s.id !== scan.id);
        this.dataSource.data = this.scans;
        if (this.selectedScan?.id === scan.id) this.closeModal();
        this.loadScans(this.currentPage);
      },
      error: () => alert('Erreur lors de la suppression'),
    });
  }

  loadVulnsManuelles(scanId: number) {
    this.http.get<any[]>(`${this.apiUrl}/scans/${scanId}/vulnerabilites/`).subscribe({
      next: (data) => (this.vulnsManuelles = data),
      error: () => (this.vulnsManuelles = []),
    });
  }

  openVulnForm() {
    this.showVulnForm = true;
  }

  onVulnFormClose() {
    this.showVulnForm = false;
  }

  onVulnAdded() {
    if (this.selectedScan) this.loadVulnsManuelles(this.selectedScan.id);
  }

  deleteVulnManuelle(id: number) {
    this.http.delete(`http://127.0.0.1:8000/api/vulnerabilites/${id}/`).subscribe({
      next: () => {
        this.vulnsManuelles = this.vulnsManuelles.filter((v) => v.id !== id);
      },
    });
  }

  showProtocolDetail(protocol: any) {
    const info: any = {
      'TLSv1.0': {
        titre: 'TLS 1.0 — VULNÉRABLE',
        description: 'Vulnérable aux attaques POODLE et BEAST.',
        risque: 'ÉLEVÉ',
        solution: 'Désactiver TLS 1.0 et migrer vers TLS 1.2+.',
      },
      'TLSv1.1': {
        titre: 'TLS 1.1 — OBSOLÈTE',
        description: 'Déprécié par RFC 8996 en 2021.',
        risque: 'MOYEN',
        solution: 'Désactiver TLS 1.1.',
      },
      'TLSv1.2': {
        titre: 'TLS 1.2 — SÉCURISÉ',
        description: 'Protocole sécurisé recommandé.',
        risque: 'FAIBLE',
        solution: 'Aucune action requise.',
      },
      'TLSv1.3': {
        titre: 'TLS 1.3 — OPTIMAL',
        description: 'Meilleure sécurité et performance.',
        risque: 'AUCUN',
        solution: 'Configuration optimale.',
      },
    };

    const baseInfo = info[protocol.name] ?? {
      titre: protocol.name,
      description: 'Protocole détecté.',
      risque: protocol.status,
      solution: 'Consulter la documentation.',
    };

    let aiSolution = '';

    if (this.selectedScan && this.selectedScan.cves) {
      const matchingCve = this.selectedScan.cves.find(
        (c: any) =>
          (protocol.name === 'TLSv1.0' && c.cve_id === 'CVE-2014-3566') ||
          (protocol.name === 'WEAK_CIPHER' && c.cve_id === 'CVE-2016-2183'),
      );

      if (matchingCve && matchingCve.recommandation_ia) {
        aiSolution = matchingCve.recommandation_ia;
      }
    }

    this.selectedProtocol = {
      ...baseInfo,
      recommandation_ia: aiSolution || baseInfo.solution,
    };
  }

  closeProtocolDetail() {
    this.selectedProtocol = null;
  }

  startMatrix() {
    setTimeout(() => {
      const canvas = document.getElementById('hist-matrix') as HTMLCanvasElement;
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

export { Historique };
