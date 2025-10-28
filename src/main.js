import fs from 'fs';
import axios from 'axios';
import { SITEMAP_DIR, SITE_URL, SITEMAP_SECRET } from './config.js';
import { fetchEvents } from './service/event.js';
import { fetchExternalVenues, fetchVenues } from './service/venue.js';
import { setAsIndexed } from './service/utils.js';
import { generateAllSitemaps } from './sitemap/generator.js';
import { createSitemapIndex } from './sitemap/index.js';
import { isExternal } from 'util/types';

axios.defaults.headers.common['x-sitemap-secret'] = SITEMAP_SECRET;

async function main() {
  if (!fs.existsSync(SITEMAP_DIR)) {
    fs.mkdirSync(SITEMAP_DIR, { recursive: true });
  }

  console.log('📦 Fetching events & venues in parallel...');
  const [events, venues, externalVenues] = await Promise.all([
    fetchEvents(),
    fetchVenues(),
    fetchExternalVenues(),
  ]);
  console.log(`Found ${events.length} events`);
  console.log(`Found ${venues.length} venues`);
  console.log(`Found ${externalVenues.length} external venues`);

  console.log('🛠 Generating sitemaps in parallel...');
  const sitemapGroups = await generateAllSitemaps([
    { prefix: 'sitemap_events', type: 'events', urls: events },
    { prefix: 'sitemap_venues', type: 'venues', urls: venues },
    { prefix: 'sitemap_externalVenues', type: 'venues', urls: externalVenues, queryParams: '?external=true' },
  ]);

  console.log('🛠 Generating sitemap index...');
  await createSitemapIndex(sitemapGroups);

  console.log('✅ All sitemaps updated');

  if (events.length + venues.length > 0) {
    console.log('Setting venues and events as indexed...');
    await setAsIndexed([
      ...events.map(({ id }) => id,),
      ...venues.map(({ id }) => id,),
      ...externalVenues.map(({ id }) => id,),
    ])
  }

  console.log(`Execution Datetime: ${new Date().toISOString()}`);

}

main().catch(console.error);
