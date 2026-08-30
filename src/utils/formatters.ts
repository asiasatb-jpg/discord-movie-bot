/**
 * Formats minutes to hours and minutes (e.g. 169 -> 2h 49m)
 */
export function formatRuntime(minutes?: number): string {
  if (!minutes || minutes <= 0) return 'N/A';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

/**
 * Formats a rating with star emoji and 1 decimal place (e.g. 8.7/10)
 */
export function formatRating(rating?: number, voteCount?: number): string {
  if (rating === undefined || rating === null || rating === 0) return '⭐ N/A';
  const score = rating.toFixed(1);
  if (voteCount && voteCount > 0) {
    const formattedVotes = voteCount >= 1000 ? `${(voteCount / 1000).toFixed(1)}k` : voteCount.toString();
    return `⭐ ${score}/10 (${formattedVotes} votes)`;
  }
  return `⭐ ${score}/10`;
}

/**
 * Truncates text cleanly without cutting words in half
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text || '';
  const truncated = text.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  if (lastSpace > 0) {
    return `${truncated.slice(0, lastSpace)}...`;
  }
  return `${truncated}...`;
}

/**
 * Extracts year from a date string (YYYY-MM-DD)
 */
export function extractYear(dateString?: string): number | undefined {
  if (!dateString) return undefined;
  const year = parseInt(dateString.slice(0, 4), 10);
  return isNaN(year) ? undefined : year;
}

/**
 * Formats duration in seconds to human readable string (e.g. 3m 45s)
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs}s`;
}
