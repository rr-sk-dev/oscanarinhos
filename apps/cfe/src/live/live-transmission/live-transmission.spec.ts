import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LiveTransmission } from './live-transmission';

describe('LiveTransmission', () => {
  let component: LiveTransmission;
  let fixture: ComponentFixture<LiveTransmission>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LiveTransmission],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(LiveTransmission);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
