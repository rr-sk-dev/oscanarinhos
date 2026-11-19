import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { Role } from '@canarinhos/shared-types';
import { environment } from '../../environments/environment';
import { managerGuard } from './role.guard';

@Component({ template: 'page' })
class Page {}

describe('managerGuard', () => {
  async function navigateAs(role: Role): Promise<string> {
    localStorage.setItem('canarinhos.accessToken', 'tok');
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'members/events/new', canActivate: [managerGuard], component: Page },
          { path: 'members', component: Page },
        ]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    const http = TestBed.inject(HttpTestingController);
    const harness = await RouterTestingHarness.create();
    const navigation = harness.navigateByUrl('/members/events/new');
    await new Promise((resolve) => setTimeout(resolve));
    TestBed.tick();
    http.expectOne((req) => req.url.endsWith('/details')).flush({ id: 't1' });
    http.expectOne(`${environment.apiUrl}/api/me`).flush({
      user: {},
      memberships: [{ teamId: 't1', teamName: 'T', role, membershipId: 'm1' }],
    });
    await new Promise((resolve) => setTimeout(resolve));
    TestBed.tick();
    await navigation;
    return TestBed.inject(Router).url;
  }

  afterEach(() => localStorage.clear());

  it.each<Role>(['PLAYER', 'STAFF'])('redirects a %s to the calendar', async (role) => {
    expect(await navigateAs(role)).toBe('/members');
  });

  it.each<Role>(['ADMIN', 'COACH'])('lets a %s through', async (role) => {
    expect(await navigateAs(role)).toBe('/members/events/new');
  });
});
