/**
 * Shared color mapping utility for consistent chart colors across the dashboard.
 * This ensures the same channel uses the same color in all visualizations.
 */

// Chart color palette from Tailwind config
export const CHART_COLORS = {
  teal: '#009392',        // series1 - Paid advertising (Google, Facebook Ads)
  mutedTeal: '#72aaa1',   // series2 - Social media (Instagram, Facebook, TikTok)
  sageGreen: '#b1c7b3',   // series3 - Organic/Direct/SEO
  cream: '#f1eac8',       // series4 - Unused/fallback
  dustyRose: '#e5b9ad',   // series5 - Default fallback
  mauve: '#d98994',       // series6 - Referral
  deepPink: '#d0587e',    // series7 - Email
} as const;

/**
 * Maps a traffic source/channel name to a consistent color.
 * Used across HorizontalBarChart, DonutChart, and VerticalBarChart.
 *
 * @param source - The traffic source name (e.g., "google", "facebook", "email")
 * @returns Hex color code
 */
export function getChannelColor(source: string): string {
  const lowerSource = source.toLowerCase();

  // Paid advertising - Teal
  if (lowerSource.includes('google') || lowerSource.includes('facebook ads')) {
    return CHART_COLORS.teal;
  }

  // Social media - Muted teal
  if (
    lowerSource.includes('instagram') ||
    lowerSource.includes('facebook') ||
    lowerSource.includes('tiktok') ||
    lowerSource.includes('twitter') ||
    lowerSource.includes('linkedin')
  ) {
    return CHART_COLORS.mutedTeal;
  }

  // Email - Deep pink
  if (lowerSource.includes('email')) {
    return CHART_COLORS.deepPink;
  }

  // Organic/Direct - Sage green
  if (
    lowerSource.includes('direct') ||
    lowerSource.includes('organic') ||
    lowerSource.includes('seo')
  ) {
    return CHART_COLORS.sageGreen;
  }

  // Referral - Mauve
  if (lowerSource.includes('referral') || lowerSource.includes('affiliate')) {
    return CHART_COLORS.mauve;
  }

  // Default - Dusty rose
  return CHART_COLORS.dustyRose;
}

/**
 * Gets an array of colors for multiple channels.
 * Useful for charts that need to assign colors to a list of sources.
 *
 * @param sources - Array of channel names
 * @returns Array of hex color codes matching the source order
 */
export function getChannelColors(sources: string[]): string[] {
  return sources.map(getChannelColor);
}
