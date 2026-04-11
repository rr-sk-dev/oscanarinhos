import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ImageOverlay } from './image-overlay';

describe('ImageOverlay', () => {
  let component: ImageOverlay;
  let fixture: ComponentFixture<ImageOverlay>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImageOverlay],
    }).compileComponents();

    fixture = TestBed.createComponent(ImageOverlay);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
