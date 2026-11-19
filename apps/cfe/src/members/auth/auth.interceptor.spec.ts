import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from './auth.service';

describe('authInterceptor', () => {
  let http: HttpClient;
  let controller: HttpTestingController;
  let router: Router;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
  });

  afterEach(() => localStorage.clear());

  function signIn(): AuthService {
    const auth = TestBed.inject(AuthService);
    auth.storeToken('abc');
    return auth;
  }

  it('adds the bearer header to API requests', () => {
    signIn();
    http.get(`${environment.apiUrl}/api/me`).subscribe();

    const request = controller.expectOne(`${environment.apiUrl}/api/me`);
    expect(request.request.headers.get('Authorization')).toBe('Bearer abc');
    request.flush({});
  });

  it('does not add the header to other hosts', () => {
    signIn();
    http.get('https://example.com/data').subscribe();

    const request = controller.expectOne('https://example.com/data');
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush({});
  });

  it('clears the token and goes to sign-in on a 401', () => {
    const auth = signIn();
    http.get(`${environment.apiUrl}/api/me`).subscribe({ error: () => undefined });

    controller
      .expectOne(`${environment.apiUrl}/api/me`)
      .flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(auth.isSignedIn()).toBe(false);
    expect(localStorage.getItem('canarinhos.accessToken')).toBeNull();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/members/sign-in');
  });

  it('leaves the page alone when a 401 comes from the sign-in calls', () => {
    http.post(`${environment.apiUrl}/api/auth/verify`, {}).subscribe({ error: () => undefined });

    controller
      .expectOne(`${environment.apiUrl}/api/auth/verify`)
      .flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });
});
