import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfirmationDialogContainer } from './confirmation-dialog-container';

describe('ConfirmationDialogContainer', () => {
  let component: ConfirmationDialogContainer;
  let fixture: ComponentFixture<ConfirmationDialogContainer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmationDialogContainer]
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmationDialogContainer);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
