import { Component, OnInit, OnDestroy, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule, HttpParams } from '@angular/common/http';

@Component({
  selector: 'app-historique',
  imports: [FormsModule, CommonModule, HttpClientModule],
  templateUrl: './historique.html',
  styleUrl: './historique.scss',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
})
class Historique implements OnInit, OnDestroy {
  search = '';
  filterRisk = '';
  scans: any[] = [];
  selectedScan: any = null;
  selectedProtocol: any = null;
  editMode = false;
  editDomaine = '';
  loading = false;

  // Pagination
  currentPage = 1;
  pageSize = 5;
  totalPages = 1;
  total = 0;

  private matrixInterval: any;
  private apiUrl = 'http://127.0.0.1:8000/api';

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.startMatrix();
    this.loadScans();
  }

  ngOnDestroy() {
    if (this.matrixInterval) clearInterval(this.matrixInterval);
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
        this.total = data.total ?? list.length;
        this.totalPages = data.total_pages ?? 1;
        this.currentPage = data.page ?? page;

        this.scans = list.map((s: any) => ({
          ...s,
          riskClass: s.score_risque_ia >= 7 ? 'danger' : s.score_risque_ia >= 4 ? 'warn' : 'ok',
          statut: s.score_risque_ia >= 7 ? 'CRITIQUE' : s.score_risque_ia >= 4 ? 'MOYEN' : 'FAIBLE',
        }));
        this.loading = false;
      },
      error: (err) => {
        console.error('API Error:', err);
        this.loading = false;
      },
    });
  }

  get filteredScans() {
    return this.scans;
  }

  lancerRecherche() {
    this.currentPage = 1;
    this.loadScans(1);
  }

  onFilterChange() {
    this.currentPage = 1;
    this.loadScans(1);
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.loadScans(page);
  }

  get pages(): number[] {
    const range: number[] = [];
    const start = Math.max(1, this.currentPage - 2);
    const end = Math.min(this.totalPages, this.currentPage + 2);
    for (let i = start; i <= end; i++) range.push(i);
    return range;
  }

  viewScan(scan: any) {
    this.selectedScan = scan;
    this.editMode = false;
  }

  closeModal() {
    this.selectedScan = null;
    this.editMode = false;
  }

  startEdit() {
    this.editDomaine = this.selectedScan.domaine;
    this.editMode = true;
  }

  saveEdit() {
    this.http
      .put<any>(`${this.apiUrl}/scans/${this.selectedScan.id}/`, {
        domaine: this.editDomaine,
      })
      .subscribe({
        next: (updated) => {
          this.selectedScan.domaine = updated.domaine;
          this.editMode = false;
          this.loadScans(this.currentPage);
        },
        error: () => alert('Erreur lors de la mise à jour'),
      });
  }

  deleteScan(scan: any, event: Event) {
    event.stopPropagation();
    if (!confirm(`Supprimer le scan de "${scan.domaine}" ?`)) return;
    this.http.delete(`${this.apiUrl}/scans/${scan.id}/`).subscribe({
      next: () => {
        this.scans = this.scans.filter((s) => s.id !== scan.id);
        if (this.selectedScan?.id === scan.id) this.closeModal();
        this.loadScans(this.currentPage);
      },
      error: () => alert('Erreur lors de la suppression'),
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
    this.selectedProtocol = info[protocol.name] ?? {
      titre: protocol.name,
      description: 'Protocole détecté.',
      risque: protocol.status,
      solution: 'Consulter la documentation.',
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
