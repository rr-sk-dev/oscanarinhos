import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

export type YouTubePlayerSize = 'small' | 'medium' | 'large' | 'full';

export interface YouTubePlayerOptions {
  autoplay?: boolean;
  controls?: boolean;
  loop?: boolean;
  mute?: boolean;
  modestBranding?: boolean;
  playsinline?: boolean;
  rel?: boolean;
  enablePrivacyMode?: boolean;
}

@Component({
  selector: 'cui-youtube-player',
  imports: [],
  templateUrl: './youtube-player.html',
  styleUrl: './youtube-player.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class YoutubePlayer {
  private sanitizer = inject(DomSanitizer);
  private platformId = inject(PLATFORM_ID);

  // Required: Video ID or full URL
  videoId = input.required<string>();

  // Optional: Player configuration
  size = input<YouTubePlayerSize>('medium');
  aspectRatio = input<'16:9' | '4:3'>('16:9');
  title = input<string>('YouTube video player');
  options = input<YouTubePlayerOptions>({
    autoplay: false,
    controls: true,
    loop: false,
    mute: false,
    modestBranding: true,
    playsinline: true,
    rel: false,
    enablePrivacyMode: true,
  });

  // Loading state
  protected isLoading = signal(true);
  protected hasError = signal(false);

  // Extract video ID from various YouTube URL formats
  private extractVideoId = computed(() => {
    const input = this.videoId();

    // Already a video ID (11 characters)
    if (/^[a-zA-Z0-9_-]{11}$/.test(input)) {
      return input;
    }

    // Extract from various YouTube URL formats
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/,
    ];

    for (const pattern of patterns) {
      const match = input.match(pattern);
      if (match) {
        return match[1];
      }
    }

    // Invalid format
    this.hasError.set(true);
    return null;
  });

  // Build YouTube embed URL with parameters
  protected embedUrl = computed((): SafeResourceUrl | null => {
    const videoId = this.extractVideoId();
    if (!videoId) {
      return null;
    }

    const opts = this.options();
    const domain = opts.enablePrivacyMode
      ? 'https://www.youtube-nocookie.com'
      : 'https://www.youtube.com';

    const params = new URLSearchParams();

    if (opts.autoplay) params.set('autoplay', '1');
    if (!opts.controls) params.set('controls', '0');
    if (opts.loop) {
      params.set('loop', '1');
      params.set('playlist', videoId); // Required for loop
    }
    if (opts.mute) params.set('mute', '1');
    if (opts.modestBranding) params.set('modestbranding', '1');
    if (opts.playsinline) params.set('playsinline', '1');
    if (!opts.rel) params.set('rel', '0');

    const url = `${domain}/embed/${videoId}?${params.toString()}`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  });

  // Size classes
  protected sizeClasses = computed(() => {
    const sizeMap: Record<YouTubePlayerSize, string> = {
      small: 'max-w-sm',
      medium: 'max-w-2xl',
      large: 'max-w-4xl',
      full: 'w-full',
    };
    return sizeMap[this.size()];
  });

  // Aspect ratio padding
  protected aspectRatioPadding = computed(() => {
    const ratio = this.aspectRatio();
    return ratio === '16:9' ? '56.25%' : '75%'; // 9/16 = 0.5625, 3/4 = 0.75
  });

  // Check if running in browser
  protected isBrowser = isPlatformBrowser(this.platformId);

  // Handle iframe load
  protected onLoad(): void {
    this.isLoading.set(false);
  }

  // Handle iframe error
  protected onError(): void {
    this.isLoading.set(false);
    this.hasError.set(true);
  }
}
