import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LiveTransmission } from './live-transmission';

describe('LiveTransmission', () => {
  let component: LiveTransmission;
  let fixture: ComponentFixture<LiveTransmission>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LiveTransmission]
    }).compileComponents();

    fixture = TestBed.createComponent(LiveTransmission);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
