import { generateSitemapForType } from './utils.js';

export async function generateAllSitemaps(sitemapData) {
    const results = await Promise.all(
        sitemapData.map(({ prefix, type, urls }) =>
            generateSitemapForType(prefix, type, urls)
        )
    );

    return sitemapData.map((item, index) => ({
        prefix: item.prefix,
        count: results[index]
    }));
}

