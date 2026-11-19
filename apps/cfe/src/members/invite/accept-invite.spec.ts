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

  it('accepts a valid code once, reloads me and goes to /members', async () => {
    const accept = http.expectOne(`${environment.apiUrl}/api/invites/abc123/accept`);
    expect(accept.request.method).toBe('POST');
    accept.flush({ teamId: 't1' });
    // whenStable waits for open requests, so flush the reload of me before settling.
    await new Promise((resolve) => setTimeout(resolve));
    TestBed.tick();
    http.expectOne(`${environment.apiUrl}/api/me`).flush({ user: {}, memberships: [] });
    await settle();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/members');
    http.expectNone(`${environment.apiUrl}/api/invites/abc123/accept`);
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
