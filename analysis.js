import Matrix from 'ml-matrix';
import LogisticRegression from 'ml-logistic-regression';
import * as ss from 'simple-statistics';
import { PLS } from 'ml-pls';
import { Regression } from 'smr';
const data = require('./bmw.json');

console.log('Num original datapoints', data.length);

function getUnique(array, extractor) {
  return Object.keys(array.map(extractor).reduce((obj, value) => Object.assign(obj, { [ value ]: null }), {}))
}

const filteredData = data
  //.filter(({ displacement }) => displacement)
  .filter(({ price }) => price)
  .filter(({ year }) => year)
  .filter(({ model }) => model === 's1000rr')
  .filter(({ location }) => location)
  .filter(({ location: { state } }) => state)
  .filter(({ mileage }) => mileage);

console.log('num filtered datapoints', filteredData.length)

const configPrices = filteredData
  .reduce((obj, { year, model, price, location: { state }, mileage }) => {
    const approxMileage = Math.round(mileage / 100) * 100;
    const configStr = JSON.stringify({ model, year, state, approxMileage });
    const prices = (obj[configStr] || []).concat(price);
    prices.sort();
    return Object.assign(obj, { [configStr]: prices });
  }, {})

console.log(configPrices)
