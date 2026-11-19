import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { SignIn } from './sign-in';

describe('SignIn', () => {
  let fixture: ComponentFixture<SignIn>;
  let http: HttpTestingController;
  let router: Router;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [SignIn],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    fixture = TestBed.createComponent(SignIn);
    fixture.componentRef.setInput('next', '/members/availability');
    fixture.autoDetectChanges();
    TestBed.tick();
    http.expectOne((req) => req.url.endsWith('/details')).flush({ id: 't1' });
    await fixture.whenStable();
  });

  afterEach(() => localStorage.clear());

  const root = (): HTMLElement => fixture.nativeElement;

  function type(selector: string, value: string): void {
    const input = root().querySelector<HTMLInputElement>(selector)!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
  }

  async function submitEmail(): Promise<void> {
    type('input[type="email"]', 'a@b.pt');
    root().querySelector('form')!.dispatchEvent(new Event('submit'));
    TestBed.tick();
    http
      .expectOne(`${environment.apiUrl}/api/auth/code`)
      .flush(null, { status: 204, statusText: 'No Content' });
    await settle();
  }

  // The component awaits promises: let them resolve, then let the view render.
  async function settle(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve));
    await fixture.whenStable();
  }

  it('asks for the code only after the email is submitted', async () => {
    expect(root().querySelector('input[inputmode="numeric"]')).toBeNull();

    await submitEmail();

    expect(root().querySelector('input[inputmode="numeric"]')).not.toBeNull();
  });

  it('shows a Portuguese error for a wrong code', async () => {
    await submitEmail();
    type('input[inputmode="numeric"]', '000000');
    root().querySelector('form')!.dispatchEvent(new Event('submit'));
    TestBed.tick();
    http
      .expectOne(`${environment.apiUrl}/api/auth/verify`)
      .flush(null, { status: 401, statusText: 'Unauthorized' });
    await settle();

    expect(root().querySelector('[role="alert"]')!.textContent).toContain(
      'Código inválido ou expirado.',
    );
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });

  it('navigates to next on success', async () => {
    await submitEmail();
    type('input[inputmode="numeric"]', '123456');
    root().querySelector('form')!.dispatchEvent(new Event('submit'));
    TestBed.tick();
    http.expectOne(`${environment.apiUrl}/api/auth/verify`).flush({ accessToken: 'tok' });
    await new Promise((resolve) => setTimeout(resolve));
    TestBed.tick();
    // Signing in starts loading the member's profile.
    http.expectOne(`${environment.apiUrl}/api/me`).flush({ user: {}, memberships: [] });
    await settle();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/members/availability');
  });
});
