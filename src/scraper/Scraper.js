export default class Scraper {
  constructor({ urls, outFile }) {
    this.urls = urls;
    this.outFile = outFile;
  }

  scrape() {
    throw 'Not implemented';
  }
}

