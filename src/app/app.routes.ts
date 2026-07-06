import { Routes } from '@angular/router';
import { Dashboard } from './components/dashboard/dashboard';
import { Scanner } from './components/scanner/scanner';
import { Historique } from './components/historique/historique';
import { Alertes } from './components/alertes/alertes';
import { Login } from './components/login/login';
import { Profile } from './components/profile/profile';
import { GestionClients } from './components/gestion-clients/gestion-clients';
import { ForcePassword } from './components/force-password/force-password';
import { authGuard } from './guards/auth-guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'force-password', component: ForcePassword, canActivate: [authGuard] },
  {
    path: 'dashboard',
    component: Dashboard,
    canActivate: [authGuard],
  },
  {
    path: 'scanner',
    component: Scanner,
    canActivate: [authGuard],
  },
  {
    path: 'historique',
    component: Historique,
    canActivate: [authGuard],
  },
  {
    path: 'alertes',
    component: Alertes,
    canActivate: [authGuard],
  },
  {
    path: 'profile',
    component: Profile,
    canActivate: [authGuard],
  },
  {
    path: 'clients',
    component: GestionClients,
    canActivate: [authGuard],
  },
  { path: '**', redirectTo: 'login' },
];
