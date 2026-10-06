import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  linkedSignal,
} from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

const VIDEO_ID = /^[a-zA-Z0-9_-]{11}$/;
const VIDEO_URL = /(?:youtube\.com\/(?:watch\?.*v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;

/** The 11-character id from a YouTube id or URL, or null when there is none. */
export function youtubeVideoId(idOrUrl: string): string | null {
  if (VIDEO_ID.test(idOrUrl)) {
    return idOrUrl;
  }
  return idOrUrl.match(VIDEO_URL)?.[1] ?? null;
}

/** Responsive 16:9 YouTube embed, in privacy mode (youtube-nocookie.com). */
@Component({
  selector: 'cui-youtube-player',
  imports: [],
  templateUrl: './youtube-player.html',
  styleUrl: './youtube-player.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class YoutubePlayer {
  private sanitizer = inject(DomSanitizer);

  /** Video id or YouTube URL. */
  videoId = input.required<string>();
  title = input<string>('Vídeo do YouTube');
  autoplay = input(false);

  // Loading state, reset whenever the video changes
  protected isLoading = linkedSignal({ source: this.videoId, computation: () => true });
  private loadFailed = linkedSignal({ source: this.videoId, computation: () => false });

  private id = computed(() => youtubeVideoId(this.videoId()));
  protected hasError = computed(() => this.id() === null || this.loadFailed());

  protected embedUrl = computed((): SafeResourceUrl | null => {
    const id = this.id();
    if (!id) {
      return null;
    }
    const params = new URLSearchParams({ modestbranding: '1', playsinline: '1', rel: '0' });
    if (this.autoplay()) {
      params.set('autoplay', '1');
    }
    return this.sanitizer.bypassSecurityTrustResourceUrl(
      `https://www.youtube-nocookie.com/embed/${id}?${params}`,
    );
  });

  protected onLoad(): void {
    this.isLoading.set(false);
  }

  protected onError(): void {
    this.isLoading.set(false);
    this.loadFailed.set(true);
  }
}
