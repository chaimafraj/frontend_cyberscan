import { Routes } from '@angular/router';
import { Dashboard } from './components/dashboard/dashboard';
import { Scanner } from './components/scanner/scanner';
import { Historique } from './components/historique/historique';
import { Alertes } from './components/alertes/alertes';

let LoginComponent;
export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: Dashboard },
  { path: 'scanner', component: Scanner },
  { path: 'historique', component: Historique },
  { path: 'alertes', component: Alertes },

];
