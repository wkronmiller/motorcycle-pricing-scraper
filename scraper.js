import fs from 'fs';
import merge from 'deepmerge';
import scrapeIt from 'scrape-it';
import rp from 'request-promise-native';

const mkUrls = ({ numPages, firstPage, baseUrl }) => Array(numPages).fill(baseUrl).map((url, page) => `${url}&page=${page + firstPage}`);

const ducatiUrls = (() => {
  const baseUrl = 'https://www.cycletrader.com/search-results?make=Ducati&model=monster';
  const numPages = 45;
  const firstPage = 1;
  return mkUrls({ numPages, firstPage, baseUrl });
})();

const bmwUrls = mkUrls({
  baseUrl: 'https://www.cycletrader.com/BMW-Motorcycles/search-results?make=BMW',
  numPages: 299,
  firstPage: 1,
});

const commonScrapeOpts = {
  article: {
    listItem: '#gridView > .listingContainer',
    data: {
      year: {
        selector: '.listing-info-title',
        convert: (text) => {
          const yearMatch = text.match(/[0-9]{4}/);
          if(!yearMatch) { return null; }
          return parseInt(yearMatch[0]);
        },
      },
      price: {
        selector: '.price-span',
        convert: (text) => parseInt(text.split(/\s+/)[0].replace(/[$,]/g, '')),
      },
      mileage: {
        how: 'html',
        selector: '.mileage',
        convert: (text) => (text) ? parseInt(text.split(' ')[0]) : null,
      },
      seller: {
        selector: '.seller-name',
      },
      location: {
        selector: '.seller-title span',
        convert: text => {
          const cityState = text.match(/([a-zA-Z]+)\s*,\s+([A-Z]{2})/);
          if(cityState) {
            const [substr, city, state, ...rest] = cityState;
            return { city, state };
          }
          return null;
        },
        eq: 2,
      },
    },
  },
}

const ducatiScrapeOpts = merge({
  article: {
    data: {
      name: {
        selector: '.listing-info-title',
        convert: (text) => text.replace(/[0-9]{4}\s+Ducati/, '').trim().toLowerCase(),
      },
      model: {
        selector: '.listing-info-title',
        convert: (text) => (text.toLowerCase().match(/(monster|panigale|supersport|multistrada|superleggera|scrambler)/) || [ null ])[0],
      },
      displacement: {
        selector: '.listing-info-title',
        convert: (text) => {
          const displacement = text.replace(/[0-9]{4}\s+Ducati/, '').trim().match(/[0-9]{3,4}/);
          if(displacement) {
            return parseInt(displacement[0]);
          }
          return null;
        },
      },
    },
  },
}, commonScrapeOpts);


const bmwScrapeOpts = merge({
  article: {
    //TODO: displacement? or just stick to model
    data: {
      name: {
        selector: '.listing-info-title',
        convert: (text) => text.replace(/[0-9]{4}\s+BMW/, '').trim().toLowerCase(),
      },
      model: {
        selector: '.listing-info-title',
        convert: (text) => { 
          const matches = text
            .replace(/[0-9]{4}\s+BMW/, '')
            .toLowerCase()
            .match(/[a-z]{0,2}\s*[0-9]{1,4}\s*(sport|race|[a-z]{1,2})/);
          if(!matches) {
            return null;
          }
          return matches[0].replace(/\s/g, '');
        },
      },
    },
  },
}, commonScrapeOpts);

function scrape(urls, scrapeOpts, outFile) {
  const data = Promise.all(urls.map(url => 
    scrapeIt(url, scrapeOpts)
      .then(({ article }) => article)))
      .then(articles => articles.reduce((a,b) => a.concat(b), []))
      .then(articles => articles.filter(({ name, model }) => (name || '').length > 0 && (model || '').length > 0))
      .then(articles => articles.filter(({ price }) => isNaN(price || NaN) === false))

  return data
    .then(data => JSON.stringify(data, null, 2))
    .then(json => fs.writeFileSync(outFile, json))
    .then(console.log)
}

scrape(bmwUrls, bmwScrapeOpts, 'bmw.json');
