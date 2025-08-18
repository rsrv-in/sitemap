import { generateSitemapIndex } from './utils.js';

export async function createSitemapIndex(groups) {
  // groups = [{ prefix, count }]
  await generateSitemapIndex(groups);
}
