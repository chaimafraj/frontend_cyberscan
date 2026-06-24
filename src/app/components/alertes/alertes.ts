import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-alertes',
  imports: [CommonModule],
  templateUrl: './alertes.html',
  styleUrl: './alertes.scss',
})
export class Alertes implements OnInit, OnDestroy {
  private matrixInterval: any;

  alertes = [
    {
      icon: '⚠',
      titre: 'TLSv1.0 DÉTECTÉ — google.com',
      message: 'Protocole obsolète détecté. Vulnérable aux attaques BEAST et POODLE.',
      date: '2026-06-19 10:32',
      niveau: 'CRITIQUE',
      type: 'danger',
    },
    {
      icon: '⚠',
      titre: 'CVE-2016-2183 — google.com',
      message: "Cipher 3DES vulnérable à l'attaque SWEET32 (CVSS 7.5).",
      date: '2026-06-19 10:32',
      niveau: 'CRITIQUE',
      type: 'danger',
    },
    {
      icon: '!',
      titre: 'TLSv1.1 DÉTECTÉ — example.com',
      message: 'Protocole déprécié. Recommandé: désactiver TLSv1.1.',
      date: '2026-06-17 09:00',
      niveau: 'MOYEN',
      type: 'warn',
    },
    {
      icon: '!',
      titre: 'Certificat expire bientôt — stackoverflow.com',
      message: 'Certificat SSL expire dans 15 jours. Renouvellement recommandé.',
      date: '2026-06-16 16:45',
      niveau: 'MOYEN',
      type: 'warn',
    },
    {
      icon: '⚠',
      titre: 'CVE-2014-3566 POODLE — example.com',
      message: 'Vulnérabilité POODLE détectée sur SSLv3 (CVSS 3.4).',
      date: '2026-06-17 09:00',
      niveau: 'CRITIQUE',
      type: 'danger',
    },
    {
      icon: 'i',
      titre: 'Scan terminé — github.com',
      message: 'Aucune vulnérabilité critique détectée. Score IA: 3.2/10.',
      date: '2026-06-18 14:15',
      niveau: 'FAIBLE',
      type: 'ok',
    },
    {
      icon: 'i',
      titre: 'Scan terminé — mozilla.org',
      message: 'Configuration SSL excellente. TLSv1.3 uniquement. Score: 1.2/10.',
      date: '2026-06-15 11:20',
      niveau: 'FAIBLE',
      type: 'ok',
    },
  ];

  ngOnInit() {
    this.startMatrix();
  }

  ngOnDestroy() {
    if (this.matrixInterval) clearInterval(this.matrixInterval);
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
