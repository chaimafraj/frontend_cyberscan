import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ScannerService {
  private apiUrl = 'http://127.0.0.1:8000/api/scans/';

  constructor(private http: HttpClient) {}

  // 🆕 1. Hadhi l blassa el s7i7a mta3 getDashboardStats dakhil el class!
  getDashboardStats(): Observable<any> {
    return this.http.get<any>('http://127.0.0.1:8000/api/dashboard-stats/');
  }

  // 2. El HTTP POST call mta3 el scan
  demarrerScan(url: string): Observable<any> {
    return this.http.post<any>(this.apiUrl, { url: url });
  }

  getVulnTemplates(): Observable<any> {
    return this.http.get<any>('http://127.0.0.1:8000/api/vuln-templates/');
  }

  getVulnManuelles(scanId: number): Observable<any[]> {
    return this.http.get<any[]>(`http://127.0.0.1:8000/api/scans/${scanId}/vulnerabilites/`);
  }

  addVulnManuelle(scanId: number, data: any): Observable<any> {
    return this.http.post(`http://127.0.0.1:8000/api/scans/${scanId}/vulnerabilites/`, data);
  }

  deleteVulnManuelle(id: number): Observable<any> {
    return this.http.delete(`http://127.0.0.1:8000/api/vulnerabilites/${id}/`);
  }
}
