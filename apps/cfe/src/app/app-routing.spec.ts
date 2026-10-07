import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Component, input, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { provideRouter, Router, TitleStrategy, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { DetailLayout } from '../layouts/detail-layout/detail-layout';
import { AppTitleStrategy, injectPageTitle } from './app-title.strategy';
import { appRoutes } from './app.routes';

@Component({ template: 'match {{ id() }}' })
class StubMatchDetail {
  readonly id = input.required<string>();
}

@Component({ template: 'home' })
class StubHome {}

@Component({ template: 'article' })
class StubArticle {
  constructor() {
    injectPageTitle(signal('Vitória em casa'));
  }
}

describe('app routing', () => {
  async function setup(routes = appRoutes): Promise<RouterTestingHarness> {
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes, withComponentInputBinding()),
        { provide: TitleStrategy, useExisting: AppTitleStrategy },
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    return RouterTestingHarness.create();
  }

  it('suffixes route titles with the team name', async () => {
    const harness = await setup([{ path: 'news', title: 'Notícias', component: StubHome }]);

    await harness.navigateByUrl('/news');

    expect(TestBed.inject(Title).getTitle()).toBe('Notícias | Os Canarinhos');
  });

  it('lets a page replace the route title with one from its data', async () => {
    const harness = await setup([{ path: 'news/:slug', title: 'Notícia', component: StubArticle }]);

    await harness.navigateByUrl('/news/vitoria');
    await harness.fixture.whenStable();

    expect(TestBed.inject(Title).getTitle()).toBe('Vitória em casa | Os Canarinhos');
  });

  it('serves detail routes inside DetailLayout and binds the route param to an input', async () => {
    const harness = await setup([
      { path: 'home', component: StubHome },
      {
        path: '',
        component: DetailLayout,
        children: [{ path: 'matches/:id', component: StubMatchDetail }],
      },
    ]);

    await harness.navigateByUrl('/matches/42');

    expect(harness.routeNativeElement?.textContent).toContain('match 42');
    expect(harness.routeNativeElement?.querySelector('button[aria-label="Voltar"]')).toBeTruthy();
  });

  it('goes home from a deep-linked detail page instead of leaving the app', async () => {
    const harness = await setup([
      { path: 'home', component: StubHome },
      {
        path: '',
        component: DetailLayout,
        children: [{ path: 'matches/:id', component: StubMatchDetail }],
      },
    ]);
    await harness.navigateByUrl('/matches/42');

    harness.routeNativeElement?.querySelector<HTMLButtonElement>('button')?.click();
    await harness.fixture.whenStable();

    expect(TestBed.inject(Router).url).toBe('/home');
  });

  it('matches every detail URL in the real route config', async () => {
    await setup();
    const router = TestBed.inject(Router);
    const detailUrls = ['/live', '/squad/1', '/staff/1', '/news/a-slug', '/matches/1'];

    for (const url of detailUrls) {
      const tree = router.parseUrl(url);
      const recognized = await router.navigateByUrl(tree, { skipLocationChange: true });
      expect(recognized, url).toBe(true);
      expect(router.url, url).toBe(url);
    }
  });
});
