import { ComponentFixture, TestBed } from '@angular/core/testing';
import { YoutubePlayer, youtubeVideoId } from './youtube-player';

describe('youtubeVideoId', () => {
  it('accepts a bare id and the usual URL shapes', () => {
    expect(youtubeVideoId('ye78KU3lrq4')).toBe('ye78KU3lrq4');
    expect(youtubeVideoId('https://www.youtube.com/watch?v=ye78KU3lrq4')).toBe('ye78KU3lrq4');
    expect(youtubeVideoId('https://www.youtube.com/watch?t=5&v=ye78KU3lrq4')).toBe('ye78KU3lrq4');
    expect(youtubeVideoId('https://youtu.be/ye78KU3lrq4')).toBe('ye78KU3lrq4');
    expect(youtubeVideoId('https://www.youtube.com/embed/ye78KU3lrq4')).toBe('ye78KU3lrq4');
  });

  it('is null for anything else', () => {
    expect(youtubeVideoId('not a video')).toBeNull();
  });
});

describe('YoutubePlayer', () => {
  let fixture: ComponentFixture<YoutubePlayer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [YoutubePlayer],
    }).compileComponents();

    fixture = TestBed.createComponent(YoutubePlayer);
  });

  it('embeds the video in privacy mode, inline, with autoplay when asked', async () => {
    fixture.componentRef.setInput('videoId', 'ye78KU3lrq4');
    fixture.componentRef.setInput('autoplay', true);
    fixture.autoDetectChanges();
    await fixture.whenStable();

    const src = fixture.nativeElement.querySelector('iframe').getAttribute('src');
    expect(src).toContain('https://www.youtube-nocookie.com/embed/ye78KU3lrq4?');
    expect(src).toContain('playsinline=1');
    expect(src).toContain('autoplay=1');
  });

  it('shows an error for an invalid video instead of throwing', async () => {
    fixture.componentRef.setInput('videoId', 'not a video');
    fixture.autoDetectChanges();
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('iframe')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Não foi possível carregar o vídeo');
  });
});
