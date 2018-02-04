import rp from 'request-promise-native';

export const camelCase = text => text
  .replace(/[()\-/]/g, ' ')
  .trim()
  .replace(/\s+[a-z-A-Z]/g, match => match.trim().toUpperCase())
  .replace(/^[A-Z]/, match => match.toLowerCase());

export function getVinInfo({ vin, year }) {
  if (!vin) {
    return Promise.resolve({});
  }
  return rp({ uri: `https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/${vin}?modelyear=${year}&format=json`, json: true })
    .then(({ Results }) => (Results || [])
      .reduce((obj, { Variable, Value }) => {
        if (Value) {
          return Object.assign(obj, { [camelCase(Variable)]: Value.toLowerCase() });
        }
        return obj;
      }, {}));
}

/**
 * Convert string to int or float as appropriate
 */
export function convertType(str) {
  if (/^[0-9,.]+$/.test(str)) {
    const noCommas = str.replace(/,/g, '');
    if (noCommas.indexOf('.') >= 0) {
      return parseFloat(noCommas);
    }
    return parseInt(noCommas, 10);
  }
  return str;
}

