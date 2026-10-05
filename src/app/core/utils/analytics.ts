import { MovieRow, SECTION_LABELS, SectionKey } from '../models/movie.model';

export interface Kpis {
  total: number;
  rated: number;
  averageRating: number;
  averageRuntime: number;
  genreCount: number;
}

export interface Datum {
  label: string;
  value: number;
}

const round1 = (n: number) => Math.round(n * 10) / 10;
const ratedOnly = (movies: MovieRow[]) => movies.filter((m) => m.vote_average > 0);

export function computeKpis(movies: MovieRow[]): Kpis {
  const rated = ratedOnly(movies);
  const withRuntime = movies.filter((m) => (m.runtime ?? 0) > 0);
  const genres = new Set(movies.flatMap((m) => (m.genres ?? []).map((g) => g.name)));
  return {
    total: movies.length,
    rated: rated.length,
    averageRating: rated.length ? round1(rated.reduce((s, m) => s + m.vote_average, 0) / rated.length) : 0,
    averageRuntime: withRuntime.length
      ? Math.round(withRuntime.reduce((s, m) => s + (m.runtime ?? 0), 0) / withRuntime.length)
      : 0,
    genreCount: genres.size
  };
}

/** Rated movies grouped by whole rating point: "5-6" holds 5.0 up to (not including) 6.0; "9-10" includes 10. */
export function ratingBuckets(movies: MovieRow[]): Datum[] {
  const buckets: Datum[] = [];
  for (let low = 4; low < 10; low++) buckets.push({ label: low === 4 ? '<5' : `${low}-${low + 1}`, value: 0 });
  for (const m of ratedOnly(movies)) {
    const i = Math.min(5, Math.max(0, Math.floor(m.vote_average) - 4));
    buckets[i].value++;
  }
  return buckets;
}

export function genreCounts(movies: MovieRow[]): Datum[] {
  const counts = new Map<string, number>();
  for (const m of movies) for (const g of m.genres ?? []) counts.set(g.name, (counts.get(g.name) ?? 0) + 1);
  return [...counts].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value || a.label.localeCompare(b.label));
}

export function decadeCounts(movies: MovieRow[]): Datum[] {
  const counts = new Map<number, number>();
  for (const m of movies) {
    const year = Number(m.release_date?.slice(0, 4));
    if (!year) continue;
    const decade = Math.floor(year / 10) * 10;
    counts.set(decade, (counts.get(decade) ?? 0) + 1);
  }
  return [...counts].sort((a, b) => a[0] - b[0]).map(([d, value]) => ({ label: `${d}s`, value }));
}

export function sectionCounts(movies: MovieRow[]): Datum[] {
  return (Object.keys(SECTION_LABELS) as SectionKey[]).map((key) => ({
    label: SECTION_LABELS[key],
    value: movies.filter((m) => m.sections.includes(key)).length
  }));
}

export function topRated(movies: MovieRow[], count = 5): MovieRow[] {
  return [...ratedOnly(movies)].sort((a, b) => b.vote_average - a.vote_average).slice(0, count);
}
