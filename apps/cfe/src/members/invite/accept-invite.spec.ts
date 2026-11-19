import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { AcceptInvite } from './accept-invite';

describe('AcceptInvite', () => {
  let fixture: ComponentFixture<AcceptInvite>;
  let http: HttpTestingController;
  let router: Router;

  beforeEach(async () => {
    localStorage.setItem('canarinhos.accessToken', 'tok');
    await TestBed.configureTestingModule({
      imports: [AcceptInvite],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    fixture = TestBed.createComponent(AcceptInvite);
    fixture.componentRef.setInput('code', 'abc123');
    fixture.autoDetectChanges();
    TestBed.tick();
    http.expectOne((req) => req.url.endsWith('/details')).flush({ id: 't1' });
    http.expectOne(`${environment.apiUrl}/api/me`).flush({ user: {}, memberships: [] });
  });

  afterEach(() => localStorage.clear());

  async function settle(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve));
    TestBed.tick();
    await fixture.whenStable();
  }

  it('accepts a valid code once, reloads me and only then goes to /members', async () => {
    const accept = http.expectOne(`${environment.apiUrl}/api/invites/abc123/accept`);
    expect(accept.request.method).toBe('POST');
    accept.flush({ teamId: 't1' });
    await new Promise((resolve) => setTimeout(resolve));

    const reload = http.expectOne(`${environment.apiUrl}/api/me`);
    expect(router.navigateByUrl).not.toHaveBeenCalled();
    reload.flush({ user: {}, memberships: [{ teamId: 't1' }] });
    await settle();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/members');
    http.expectNone(`${environment.apiUrl}/api/invites/abc123/accept`);
  });

  it('still goes to /members when reloading me fails', async () => {
    http.expectOne(`${environment.apiUrl}/api/invites/abc123/accept`).flush({ teamId: 't1' });
    await new Promise((resolve) => setTimeout(resolve));
    http
      .expectOne(`${environment.apiUrl}/api/me`)
      .flush({}, { status: 500, statusText: 'Server Error' });
    await settle();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/members');
  });

  it('shows the error state without retry for an invalid code', async () => {
    http
      .expectOne(`${environment.apiUrl}/api/invites/abc123/accept`)
      .flush({ code: 'INVITE_INVALID' }, { status: 400, statusText: 'Bad Request' });
    await settle();

    const errorState = fixture.nativeElement.querySelector('cui-error-state');
    expect(errorState).not.toBeNull();
    expect(errorState.textContent).toContain('Convite inválido ou expirado');
    expect(errorState.querySelector('button')).toBeNull();
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });
});
