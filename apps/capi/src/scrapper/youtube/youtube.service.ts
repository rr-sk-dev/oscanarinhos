import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface YoutubeVideo {
  videoId: string;
  title: string;
  publishedAt: string;
}

interface SearchListResponse {
  items?: Array<{
    id: { videoId: string };
    snippet: { title: string; publishedAt: string };
  }>;
  nextPageToken?: string;
}

interface ChannelListResponse {
  items?: Array<{ id: string }>;
}

const MAX_RESULTS_PER_PAGE = 50;

@Injectable()
export class YoutubeService implements OnModuleInit {
  private readonly logger = new Logger(YoutubeService.name);
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly channelHandle: string;
  private channelId: string | null = null;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.getOrThrow('YOUTUBE_API_KEY');
    this.baseUrl = this.configService.getOrThrow('YOUTUBE_BASE_URL');
    this.channelHandle = this.configService.getOrThrow('YOUTUBE_CHANNEL_HANDLE');
  }

  async onModuleInit(): Promise<void> {
    await this.resolveChannelId();
  }

  /**
   * Returns all completed and upcoming live stream videos from the channel,
   * optionally filtered by a search query (e.g. a team name).
   */
  async getAllStreams(query?: string): Promise<YoutubeVideo[]> {
    const channelId = await this.resolveChannelId();
    const [completed, upcoming] = await Promise.all([
      this.searchLiveEvents(channelId, 'completed', query),
      this.searchLiveEvents(channelId, 'upcoming', query),
    ]);
    return [...completed, ...upcoming];
  }

  // ─── Private ─────────────────────────────────────────────────

  private async resolveChannelId(): Promise<string> {
    if (this.channelId) return this.channelId;

    const params = new URLSearchParams({
      part: 'id',
      forHandle: this.channelHandle,
      key: this.apiKey,
    });

    const data = await this.request<ChannelListResponse>(`${this.baseUrl}/channels?${params}`);
    const id = data.items?.[0]?.id;

    if (!id) throw new Error(`YouTube channel not found: @${this.channelHandle}`);

    this.channelId = id;
    this.logger.log(`Resolved channel @${this.channelHandle} → ${id}`);
    return id;
  }

  private async searchLiveEvents(
    channelId: string,
    eventType: 'completed' | 'upcoming' | 'live',
    query?: string,
  ): Promise<YoutubeVideo[]> {
    const results: YoutubeVideo[] = [];
    let pageToken: string | undefined;

    do {
      const params = new URLSearchParams({
        part: 'snippet',
        channelId,
        eventType,
        type: 'video',
        order: 'date',
        maxResults: String(MAX_RESULTS_PER_PAGE),
        key: this.apiKey,
      });

      if (query) params.set('q', query);
      if (pageToken) params.set('pageToken', pageToken);

      const data = await this.request<SearchListResponse>(`${this.baseUrl}/search?${params}`);

      for (const item of data.items ?? []) {
        results.push({
          videoId: item.id.videoId,
          title: item.snippet.title,
          publishedAt: item.snippet.publishedAt,
        });
      }

      pageToken = data.nextPageToken;
    } while (pageToken);

    return results;
  }

  private async request<T>(url: string): Promise<T> {
    const response = await fetch(url);

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`YouTube API ${response.status}: ${body}`);
    }

    return response.json() as Promise<T>;
  }
}
