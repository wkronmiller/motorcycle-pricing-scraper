import merge from 'deepmerge';

import ArticleScraper from './ArticleScraper';

const mkScrapeOpts = (customOpts) => {
  const commonScrapeOpts = {
    article: {
      listItem: '#gridView > .listingContainer',
      data: {
        year: {
          selector: '.listing-info-title',
          convert: (text) => {
            const yearMatch = text.match(/[0-9]{4}/);
            if (!yearMatch) { return null; }
            return parseInt(yearMatch[0], 10);
          },
        },
        price: {
          selector: '.price-span',
          convert: text => parseInt(text.split(/\s+/)[0].replace(/[$,]/g, ''), 10),
        },
        mileage: {
          how: 'html',
          selector: '.mileage',
          convert: text => (text) ? parseInt(text.split(' ')[0], 10) : null,
        },
        seller: {
          selector: '.seller-name',
        },
        location: {
          selector: '.seller-title span',
          convert: (text) => {
            const cityState = text.match(/([a-zA-Z]+)\s*,\s+([A-Z]{2})/);
            if (cityState) {
              const [city, state] = cityState.slice(1);
              return { city, state };
            }
            return null;
          },
          eq: 2,
        },
      },
    },
  };

  return merge(customOpts, commonScrapeOpts);
};

const mkUrls = ({ firstPage, baseUrl, numPages }) =>
  Array(numPages)
    .fill(baseUrl)
    .map((url, page) => `${url}&page=${page + firstPage}`);

export default class CycleTraderScraper extends ArticleScraper {
  constructor({ customScrapeOpts, urls: { baseUrl, numPages, firstPage }, outFile }) {
    super({
      urls: mkUrls({ firstPage, baseUrl, numPages }),
      scrapeOpts: mkScrapeOpts(customScrapeOpts),
      outFile,
    });
  }
}
