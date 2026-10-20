import site from '../data/site.json';

// Which conditional home sections have content to show (PLAN 5.6, 6.5, 6.8).
// Production shows only entries with placeholder:false; `astro dev` also shows placeholder samples.
export const visibleBeforeAfter = () => site.beforeAfter.filter((e) => !e.placeholder || import.meta.env.DEV);
export const visibleReviews = () => site.reviews.filter((r) => !r.placeholder || import.meta.env.DEV);
