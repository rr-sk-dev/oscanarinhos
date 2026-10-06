import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { News } from './news';

describe('News', () => {
  let component: News;
  let fixture: ComponentFixture<News>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [News],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(News);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders the page header', () => {
    const header = fixture.nativeElement.querySelector('header');
    expect(header.textContent).toContain('Notícias');
    expect(header.textContent).toContain('Últimas Atualizações');
  });

  it('renders article cards linking to their slug', async () => {
    http
      .expectOne((req) => req.url.endsWith('/api/news'))
      .flush([
        { id: '1', slug: 'primeira', title: 'Primeira', publishedAt: '2026-10-02T00:00:00Z' },
        { id: '2', slug: 'segunda', title: 'Segunda', publishedAt: '2026-09-24T00:00:00Z' },
      ]);
    await fixture.whenStable();
    fixture.detectChanges();

    const cards: HTMLAnchorElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('a.news-card'),
    );
    expect(cards.length).toBe(2);
    expect(cards[0].getAttribute('href')).toBe('/news/primeira');
    expect(cards[0].querySelector('h2')!.classList).toContain('text-[17px]');
    expect(cards[1].querySelector('h2')!.classList).toContain('text-sm');
    expect(cards[0].textContent).toContain('Ler Mais');
  });
});
