import scrapeIt from 'scrape-it';
import rp from 'request-promise-native';

import Scraper from './Scraper';

export default class ArticleScraper extends Scraper {
  constructor({ urls, scrapeOpts, outFile }) {
    super({ urls, outFile });
    this.scrapeOpts = scrapeOpts;
  }

  scrape() {
    const { urls, scrapeOpts, outFile } = this;
    const data = Promise.all(urls.map(url => 
      scrapeIt(url, scrapeOpts)
        .then(({ article }) => article)))
        .then(articles => articles.reduce((a,b) => a.concat(b), []))
        .then(articles => articles.filter(({ name, model }) => (name || '').length > 0 && (model || '').length > 0))
        .then(articles => articles.filter(({ price }) => isNaN(price || NaN) === false))

    return data
      .then(data => JSON.stringify(data, null, 2))
      .then(json => this.save(json))
      .then(console.log)
  }
}
