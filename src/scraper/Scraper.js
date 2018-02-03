import fs from 'fs';

export default class Scraper {
  constructor({ urls, outFile }) {
    this.urls = urls;
    this.outFile = outFile;
  }

  save(json) {
    return fs.writeFileSync(this.outFile, json);
  }
  scrape() {
    throw 'Not implemented';
  }
}

