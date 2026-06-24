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
  searchActive = '';
  filterRisk = '';
  scans: any[] = [];
  selectedScan: any = null;
  editMode = false;
  editDomaine = '';
  loading = true;
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

  loadScans(search = '', risk = '') {
    this.loading = true;
    let params = new HttpParams();

    if (this.search) {
      params = params.set('search', this.search);
    }

    if (this.filterRisk) {
      params = params.set('risk', this.filterRisk);
    }

    this.http.get<any[]>(`${this.apiUrl}/scans`, { params }).subscribe({
      next: (data) => {
        this.scans = data.map((s) => ({
          ...s,
          riskClass: s.score_risque_ia >= 7 ? 'danger' : s.score_risque_ia >= 4 ? 'warn' : 'ok',
          statut: s.score_risque_ia >= 7 ? 'CRITIQUE' : s.score_risque_ia >= 4 ? 'MOYEN' : 'FAIBLE',
        }));
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  get filteredScans() {
    return this.scans.filter((s) => {
      const matchSearch = s.domaine.toLowerCase().includes(this.searchActive.toLowerCase());
      const matchRisk =
        !this.filterRisk ||
        (this.filterRisk === 'high' && s.score_risque_ia >= 7) ||
        (this.filterRisk === 'medium' && s.score_risque_ia >= 4 && s.score_risque_ia < 7) ||
        (this.filterRisk === 'low' && s.score_risque_ia < 4);
      return matchSearch && matchRisk;
    });
  }

  lancerRecherche() {
    this.searchActive = this.search;
    this.loadScans(this.search, this.filterRisk);
  }
  onFilterChange() {
    this.loadScans(this.search, this.filterRisk);
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
          this.loadScans();
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
      },
      error: () => alert('Erreur lors de la suppression'),
    });
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
  selectedProtocol: any = null;

  protocolDescriptions: any = {
    'TLSv1.0': {
      titre: 'TLS 1.0 — VULNÉRABLE',
      description:
        'Protocole obsolète depuis 2020. Vulnérable aux attaques POODLE et BEAST. Désactivé par la plupart des navigateurs modernes.',
      risque: 'ÉLEVÉ',
      solution: 'Désactiver TLS 1.0 sur le serveur et migrer vers TLS 1.2 ou TLS 1.3.',
    },
    'TLSv1.1': {
      titre: 'TLS 1.1 — OBSOLÈTE',
      description:
        'Protocole déprécié en 2021 par le RFC 8996. Vulnérable aux attaques par rétrogradation de protocole.',
      risque: 'MOYEN',
      solution: 'Désactiver TLS 1.1 et utiliser uniquement TLS 1.2 et TLS 1.3.',
    },
    'TLSv1.2': {
      titre: 'TLS 1.2 — SÉCURISÉ',
      description: 'Protocole largement supporté et sécurisé. Recommandé comme minimum acceptable.',
      risque: 'FAIBLE',
      solution:
        'Aucune action requise. Continuer à supporter TLS 1.2 avec des cipher suites sécurisées.',
    },
    'TLSv1.3': {
      titre: 'TLS 1.3 — OPTIMAL',
      description: 'Dernière version du protocole TLS. Offre la meilleure sécurité et performance.',
      risque: 'AUCUN',
      solution: 'Configuration optimale. Aucune action requise.',
    },
    SSLv2: {
      titre: 'SSL 2.0 — CRITIQUE',
      description: 'Protocole extrêmement dangereux. Vulnérable à de nombreuses attaques connues.',
      risque: 'CRITIQUE',
      solution: 'Désactiver immédiatement SSL 2.0 sur le serveur.',
    },
    SSLv3: {
      titre: 'SSL 3.0 — CRITIQUE',
      description: "Vulnérable à l'attaque POODLE. Déprécié depuis 2015 par le RFC 7568.",
      risque: 'CRITIQUE',
      solution: 'Désactiver immédiatement SSL 3.0 sur le serveur.',
    },
  };

  showProtocolDetail(protocol: any) {
    this.selectedProtocol = this.protocolDescriptions[protocol.name] || {
      titre: protocol.name,
      description: 'Aucune information disponible pour ce protocole.',
      risque: 'INCONNU',
      solution: 'Analyser manuellement ce protocole.',
    };
  }

  closeProtocolDetail() {
    this.selectedProtocol = null;
  }
}

export {Historique};

