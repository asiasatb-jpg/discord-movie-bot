export class YouTubeProvider {
  public readonly name = 'YouTube';

  /**
   * Generates safe official YouTube search link for trailers
   */
  public getSearchTrailerUrl(movieTitle: string, year?: number): string {
    const query = encodeURIComponent(`${movieTitle} ${year || ''} official trailer`);
    return `https://www.youtube.com/results?search_query=${query}`;
  }

  /**
   * Generates official watch URL from a YouTube video key/id
   */
  public getWatchUrl(videoKey: string): string {
    return `https://www.youtube.com/watch?v=${videoKey}`;
  }
}

export const youtubeProvider = new YouTubeProvider();
