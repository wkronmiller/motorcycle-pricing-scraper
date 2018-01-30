//import request from 'request-promise-native';
import fs from 'fs';
import scrapeIt from 'scrape-it';
import json2csv from 'json2csv';

const baseUrl = 'https://www.cycletrader.com/search-results?make=Ducati&model=monster';
const numPages = 45;
const firstPage = 1;

const urls = Array(numPages).fill(baseUrl).map((url, page) => `${url}?page=${page + firstPage}`);

const scrapeOpts = {
  article: {
    listItem: '.searchResultsMid',
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
      year: {
        selector: '.listing-info-title',
        convert: (text) => parseInt(text.match(/[0-9]{4}/)[0]),
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
};

const data = Promise.all(urls.map(url => 
  scrapeIt(url, scrapeOpts)
    .then(({ article }) => article)))

data
  .then(entries => entries.reduce((a,b) => a.concat(b)))
  .then(data => JSON.stringify(data, null, 2))
  .then(json => fs.writeFileSync('ducati.json', json))
  .then(console.log)
