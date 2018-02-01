import CycleTraderScraper from './CycleTraderScraper';

export default {
  cycleTrader: {
    ducati: new CycleTraderScraper({
      outFile: 'ducati-cycle-trader.json',
      customScrapeOpts: {
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
      },
      urls: {
        baseUrl: 'https://www.cycletrader.com/search-results?make=Ducati&model=monster',
        numPages: 45,
        firstPage: 1,
      },
    }),
    bmw: new CycleTraderScraper({
      outFile: 'bmw-cycle-trader.json',
      customScrapeOpts: {
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
      },
      urls: {
        baseUrl: 'https://www.cycletrader.com/BMW-Motorcycles/search-results?make=BMW',
        numPages: 299,
        firstPage: 1,
      }
    }),
  },
};
