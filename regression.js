import Matrix from 'ml-matrix';
import LogisticRegression from 'ml-logistic-regression';
import * as ss from 'simple-statistics';
import { PLS } from 'ml-pls';
import { Regression } from 'smr';
const data = require('./ducati.json');

console.log('Num original datapoints', data.length);

const models = ['monster', 'multistrada', 'supersport', 'panigale', ];

const filteredData = data
  .filter(({ displacement }) => displacement)
  .filter(({ price }) => price)
  .filter(({ year }) => year)
  .filter(({ model }) => model)
  .filter(({ location: { state } }) => state)
  //.filter(({ mileage }) => mileage);

console.log('num filtered datapoints', filteredData.length)

const configPrices = filteredData
  .reduce((obj, { displacement, year, mileage, model, price, location: { state }, }) => {
    mileage = mileage || 0;
    const configStr = JSON.stringify({ model, displacement, year, state });
    const prices = (obj[configStr] || {});
    const minPrice = ss.min([(prices[mileage] || price), price]);
    obj[configStr] = Object.assign(prices, { [mileage]: minPrice });
    return obj;
  }, {})

console.log('num configs', Object.keys(configPrices).length)

const configPricesArray = Object.keys(configPrices).map(config => ({[config]: configPrices[config]}));
configPricesArray.sort((a,b) => Object.keys(a) > Object.keys(b) ? 1 : -1);
console.log(configPricesArray)
