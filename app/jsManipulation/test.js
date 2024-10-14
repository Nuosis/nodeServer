const json = require('../data/jobs.json');
const { findAllPaths, findAllMatchingData, findAllPathsToValue, deleteObjectPaths, updateObject, filterFileMakerData } = require('./jsManipulation');

/* FIND SCENARIO*/
// findSimple
const criteria = { 'Workorder Type': 'New Build' }; // Adjust this based on your JSON structure// findComplex
//const criteria = { 'Workorder Type': 'New Build', "id_customer": "13DF9081-2E70-D140-BA0E-0A5D70CA0E1B"} // Adjust this based on your JSON structure
const paths = findAllPaths(json, criteria);
console.log('Found Paths', paths);

const data = filterFileMakerData(json, paths);
//console.log('Returned Data', JSON.stringify(data, null, 2));
return {data}

