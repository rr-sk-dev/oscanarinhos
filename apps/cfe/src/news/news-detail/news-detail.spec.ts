import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NewsDetail } from './news-detail';

describe('NewsDetail', () => {
  let fixture: ComponentFixture<NewsDetail>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewsDetail],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(NewsDetail);
    fixture.componentRef.setInput('slug', 'vitoria-em-casa');
    fixture.autoDetectChanges();
  });

  it('loads the article for the slug input', async () => {
    http
      .expectOne((req) => req.url.endsWith('/api/news/slug/vitoria-em-casa'))
      .flush({ title: 'Vitória em casa', content: 'Texto', image: null, publishedAt: null });
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('h1').textContent).toContain('Vitória em casa');
  });

  it('shows an error when the article fails to load', async () => {
    http
      .expectOne((req) => req.url.endsWith('/api/news/slug/vitoria-em-casa'))
      .flush(null, { status: 404, statusText: 'Not Found' });
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Erro ao carregar artigo');
  });
});
