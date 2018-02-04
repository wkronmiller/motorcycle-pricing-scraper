import feedparser from 'feedparser-promised';
import rp from 'request-promise-native';
import cheerio from 'cheerio';
import chunk from 'chunk';
import Scraper from './Scraper';
import { camelCase, convertType, getVinInfo } from './utils';

const locations = require('./craigslistLocations.json');
const categories = [
  'mca', // Motorcycles
];

// e.g. https://frederick.craigslist.org/search/mca?format=rss&query=bmw
// https://baltimore.craigslist.org/search/mca?format=rss&query=bmw

const mkBaseUrl = ({ category, location }) => `https://${location}.craigslist.org/search/${category}?format=rss`;

const baseUrls =
  locations
    .map(location => categories.map(category => mkBaseUrl({ category, location })))
    .reduce((a, b) => a.concat(b), []);

const mkSearchUrls = ({ searchTerm }) => (searchTerm) ? baseUrls.map(url => `${url}&query=${searchTerm}`) : baseUrls;

const cleanText = text => text.toLowerCase().replace(/\s\s+/g, ' ').trim();

export default class CraigslistScraper extends Scraper {
  constructor({ searchTerm, outFile }) {
    super({
      urls: mkSearchUrls({ searchTerm }),
      outFile,
    });
  }

  loadBatch(urls) {
    return Promise.all(urls.map(url => feedparser.parse(url)))
      .then(feeds => feeds.reduce((a,b) => a.concat(b), []))
      .then(entry => Promise.all(entry.map(({ title, pubDate, guid }) => 
        rp(guid).then(body => cheerio.load(body, { normalizeWhitespace: true })).then($ => ({
          title: title.toLowerCase(),
          link: guid,
          pubDate: new Date(pubDate),
          posting: cleanText($('#postingbody').text()),
          // Convert attributes to object
          attributes: $('.attrgroup span')
            .map((index, element) => cleanText($(element).text()))
            .toArray()
            .map(elem => elem.split(':').map(cleanText))
            .map(([prop, value], index) => 
              // Either it's a named attribute or it's the model of the bike, else we don't care
              (value) ? 
                // Convert prop name to camel case
                ({ [camelCase(prop)] : value }) : 
                  (index === 0) ? ({ name: prop }) : null)
            // Remove null values
            .filter(kv => kv)
            .reduce((a, b) => Object.assign(a,b))
          ,
      })))))
      .then(entries => entries.map(({ attributes, ...rest }) => Object.assign({}, attributes, rest)))
      .then(entries => entries.map(({ title, ...rest }) => {
        const priceRe = /\&#x0024;([0-9,]{1,6})/;
        const price = (title.match(priceRe) || [null, null])[1];
        return Object.assign({}, rest, { price, title });
      }))
      .then(entries => entries.map(({ posting, ...rest }) => {
        const flags = posting.match(/dropped|damage|scuff|scratch|dent|project|rebuild|misfire/g) || [];
        const features = posting.match(/asc|abs|brembo|tpm|heated grips|certified pre-owned/g) || [];
        const [displacement] = (posting.match(/([0-9]{1,4})\s*cc/) || [null, null]).slice(1);
        const [mileage] = (posting.match(/([0-9,]{1,7})\s*mi/) || [null, null]).slice(1);
        return Object.assign({}, rest, { flags, features, mileage, displacement });
      }))
      .then(entries => entries.map(({ title, name, ...rest }) => {
        const [year] = ((name || title).match(/[0-9]{4}/) || [null]);
        return Object.assign({}, rest, { title, name, year });
      }))
      .then(entries => Promise.all(entries.map(({ vin, year, ...rest }) =>
        getVinInfo({ vin, year, }).then(vinInfo => Object.assign({}, rest, { vin, year }, vinInfo))
      )))
      .then(entries => 
        entries.map(entry => 
          Object.keys(entry).reduce((obj, key) => 
            Object.assign(obj, { [key]: convertType(entry[key]) }), {})
    ));
  }

  scrape() {
    const { urls } = this;
    const chunks = chunk(urls, 2);
    return chunks
      .reduce((resultsP, chunk) => 
        resultsP
          .then(results => new Promise(resolve => setTimeout(() => resolve(results), 2000)))
          .then(results => {
            console.log('running results', results);
            return results;
          })
          .then(results =>
            this.loadBatch(chunk).then(nextResults =>
              results.concat(nextResults))), Promise.resolve([]))
      .then(data => JSON.stringify(data, null, 2))
      .then(json => this.save(json))
      .then(console.log);
  }
}
