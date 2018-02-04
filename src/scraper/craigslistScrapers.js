import CraigslistScraper from './CraigslistScraper';

export default {
  bmw: new CraigslistScraper({ searchTerm: 'bmw', outFile: 'bmw-craigslist.json' }),
};
