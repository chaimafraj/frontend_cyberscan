import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NEVER, of } from 'rxjs';

import { ScannerService } from '../../services/scanner.service';
import { Scanner } from './scanner';

describe('Scanner', () => {
  let component: Scanner;
  let fixture: ComponentFixture<Scanner>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Scanner],
    }).compileComponents();

    fixture = TestBed.createComponent(Scanner);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not display Nuclei as a scan option', () => {
    expect(component.options.some((option) => option.id === 'nuclei')).toBeFalsy();
  });

  it('should keep the progress state while an asynchronous scan is queued', () => {
    const scannerService = TestBed.inject(ScannerService);
    vi.spyOn(scannerService, 'demarrerScan').mockReturnValue(of({
      scans: [{
        scan_id: 42,
        task_id: 'task-42',
        domaine: 'google.com',
        status: 'PENDING',
        status_url: '/api/scans/42/',
      }],
      tracking_ids: [42],
    }));
    vi.spyOn(scannerService, 'getScan').mockReturnValue(NEVER);
    component.targetUrl = 'google.com';

    component.lancerScan();

    expect(component.scanning).toBe(true);
    expect(component.scanStatus).toBe('PENDING');
    expect(component.scanResult).toBeNull();
  });
});
