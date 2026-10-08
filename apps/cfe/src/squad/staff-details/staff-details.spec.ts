import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { StaffRole } from '@canarinhos/shared-types';
import { aStaffMember } from '../../shared/testing/people.fixture';
import { StaffDetails } from './staff-details';

describe('StaffDetails', () => {
  let fixture: ComponentFixture<StaffDetails>;
  let http: HttpTestingController;

  function render(id: string): void {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(StaffDetails);
    fixture.componentRef.setInput('id', id);
    TestBed.tick();
  }

  it('shows the member, their role and age, and titles the page', async () => {
    render('s1');
    http
      .expectOne((req) => req.url.endsWith('/api/team-staff'))
      .flush([
        aStaffMember({
          role: StaffRole.ASSISTANT_COACH,
          dateOfBirth: '1980-03-04T00:00:00.000Z',
        }),
      ]);
    await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;

    expect(element.querySelector('h1')!.textContent).toContain('Rui');
    expect(element.textContent).toContain('Treinador Adjunto');
    expect(element.textContent).toContain('04/03/1980');
    expect(TestBed.inject(Title).getTitle()).toBe('Rui Costa | Os Canarinhos');
  });

  it('reports an unknown member without offering a retry', async () => {
    render('missing');
    http.expectOne((req) => req.url.endsWith('/api/team-staff')).flush([aStaffMember()]);
    await fixture.whenStable();

    const alert: HTMLElement = fixture.nativeElement.querySelector('[role="alert"]');
    expect(alert.textContent).toContain('Membro não encontrado');
    expect(alert.querySelector('button')).toBeNull();
  });

  it('offers a retry when the staff list fails to load', async () => {
    render('s1');
    http
      .expectOne((req) => req.url.endsWith('/api/team-staff'))
      .flush(null, { status: 500, statusText: 'Server Error' });
    await fixture.whenStable();

    fixture.nativeElement.querySelector('[role="alert"] button').click();
    TestBed.tick();
    http.expectOne((req) => req.url.endsWith('/api/team-staff')).flush([aStaffMember()]);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('h1').textContent).toContain('Rui');
  });
});
