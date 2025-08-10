import { generateSitemapIndex } from './utils.js';

export async function createSitemapIndex(groups, siteUrl) {
  // groups = [{ prefix, count }]
  await generateSitemapIndex(groups, siteUrl);
}
