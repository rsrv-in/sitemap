import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import xml2js from 'xml2js';
import { SITEMAP_DIR, MAX_URLS_PER_FILE, SITE_URL, SITE_LANGS, SITEMAP_URL } from '../config.js';

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

// Include the alternate namespace
const parser = new xml2js.Parser();
const builder = new xml2js.Builder({
    xmldec: { version: '1.0', encoding: 'UTF-8' },
});

export function getLatestSitemapFile(prefix) {
    const files = fs.existsSync(SITEMAP_DIR) ? fs.readdirSync(SITEMAP_DIR) : [];
    const sitemapFiles = files
        .filter(f => f.startsWith(prefix) && f.endsWith('.xml') && f !== 'sitemap_index.xml')
        .sort((a, b) => {
            const aNum = parseInt(a.match(/_(\d+)\.xml$/)?.[1] || '1', 10);
            const bNum = parseInt(b.match(/_(\d+)\.xml$/)?.[1] || '1', 10);
            return aNum - bNum;
        });

    return sitemapFiles.length ? sitemapFiles[sitemapFiles.length - 1] : null;
}

export async function loadOrCreateSitemap(fileName) {
    try {
        const xmlData = await readFile(path.join(SITEMAP_DIR, fileName), 'utf8');
        return await parser.parseStringPromise(xmlData);
    } catch {
        return {
            urlset: {
                $: {
                    xmlns: 'http://www.sitemaps.org/schemas/sitemap/0.9',
                    'xmlns:xhtml': 'http://www.w3.org/1999/xhtml',
                },
                url: [],
            },
        };
    }
}

export async function saveSitemap(fileName, data) {
    const xml = builder.buildObject(data);
    await writeFile(path.join(SITEMAP_DIR, fileName), xml, 'utf8');
}

export async function generateSitemapIndex(groups) {
    const indexObj = {
        sitemapindex: {
            $: { xmlns: 'http://www.sitemaps.org/schemas/sitemap/0.9' },
            sitemap: [],
        },
    };

    for (const { prefix, count } of groups) {
        for (let i = 1; i <= count; i++) {
            indexObj.sitemapindex.sitemap.push({
                loc: [`${SITEMAP_URL}/${prefix}_${i}.xml`],
                lastmod: [new Date().toISOString()],
            });
        }
    }

    const xml = builder.buildObject(indexObj);
    await writeFile(path.join(SITEMAP_DIR, 'sitemap_index.xml'), xml, 'utf8');
}

export async function generateSitemapForType(prefix, type, items) {
    let latestFile = getLatestSitemapFile(prefix);
    let currentIndex = 1;
    let sitemapCount = 1;

    if (latestFile) {
        const match = latestFile.match(/_(\d+)\.xml$/);
        if (match) {
            currentIndex = parseInt(match[1], 10);
            sitemapCount = currentIndex;
        }
    }

    let fileName = latestFile || `${prefix}_1.xml`;
    let sitemap = await loadOrCreateSitemap(fileName);

    for (const { id, name } of items) {
        if (sitemap.urlset.url.length >= MAX_URLS_PER_FILE) {
            await saveSitemap(fileName, sitemap);
            currentIndex++;
            sitemapCount++;
            fileName = `${prefix}_${currentIndex}.xml`;
            sitemap = {
                urlset: {
                    $: {
                        xmlns: 'http://www.sitemaps.org/schemas/sitemap/0.9',
                        'xmlns:xhtml': 'http://www.w3.org/1999/xhtml',
                    },
                    url: [],
                },
            };
        }

        // Base (canonical) URL — English
        const canonicalLang = 'en';
        const canonicalUrl = `${SITE_URL}/${canonicalLang}/${type}/${id}-${encodeURIComponent(name)}`;

        const urlEntry = {
            loc: [canonicalUrl],
            lastmod: [new Date().toISOString()],
            changefreq: ['daily'],
            priority: ['0.8'],
            'xhtml:link': SITE_LANGS.map(lang => ({
                $: {
                    rel: 'alternate',
                    hreflang: lang,
                    href: `${SITE_URL}/${lang}/${type}/${id}-${encodeURIComponent(name)}`,
                },
            })).concat([
                {
                    $: {
                        rel: 'alternate',
                        hreflang: 'x-default',
                        href: `${SITE_URL}/en/${type}/${id}-${encodeURIComponent(name)}`,
                    },
                },
            ]),
        };

        sitemap.urlset.url.push(urlEntry);
    }

    await saveSitemap(fileName, sitemap);
    return sitemapCount;
}
