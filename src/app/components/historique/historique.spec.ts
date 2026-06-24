import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { Historique } from './historique';

describe('Historique', () => {
  let component: Historique;
  let fixture: ComponentFixture<Historique>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Historique],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(Historique);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    await fixture.whenStable();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load scans without search parameter when search is empty', () => {
    component.search = '';

    component.loadScans();

    const req = httpMock.expectOne((request) => request.url === 'http://127.0.0.1:8000/api/scans/');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('page')).toBe('1');
    expect(req.request.params.get('page_size')).toBe('5');
    expect(req.request.params.has('search')).toBeFalse();

    req.flush({ results: [], total: 0, total_pages: 1, page: 1 });
  });
});
