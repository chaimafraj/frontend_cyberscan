import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VulnManuelleForm } from './vuln-manuelle-form';

describe('VulnManuelleForm', () => {
  let component: VulnManuelleForm;
  let fixture: ComponentFixture<VulnManuelleForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VulnManuelleForm],
    }).compileComponents();

    fixture = TestBed.createComponent(VulnManuelleForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
