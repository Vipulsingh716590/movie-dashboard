/** Display switches this dashboard edits; the movie app reads the same object from /settings. */
export interface SiteSettings {
  /** Master switch: false hides every rating badge in the movie app. */
  showRatings: boolean;
  /** Movie ids whose rating is hidden even when showRatings is true. */
  hiddenRatingIds: number[];
  showHeroBanner: boolean;
  showPopular: boolean;
  showUpcoming: boolean;
  showLatest: boolean;
}

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  showRatings: true,
  hiddenRatingIds: [],
  showHeroBanner: true,
  showPopular: true,
  showUpcoming: true,
  showLatest: true
};
