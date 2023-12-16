const json = require('../data/jobs.json');

/**
 * 
 * @param {*} json // a json object 
 * @param {*} criteria // an object of key value pairs
 * @returns the path of all found objects
 */
function findAllPaths(json, criteria) {
    let paths = [];

    if (typeof json !== 'object' || json === null) {
        const errorMessage = "passed json is not an object";
        return { paths, errorMessage };
    }

    function search(currentJson, currentPath) {
        if (typeof currentJson === 'object' && currentJson !== null) {
            // Check if all keys in criteria are present in currentJson and have matching values
            const meetsCriteria = Object.keys(criteria).every(key => 
                currentJson.hasOwnProperty(key) && currentJson[key] === criteria[key]
            );
    
            if (meetsCriteria && currentPath) {
                paths.push(currentPath);
            }
    
            for (const key in currentJson) {
                const value = currentJson[key];
                // Construct newPath based on whether the currentJson is an array or an object
                const newPath = Array.isArray(currentJson) ? `${currentPath}[${key}]` : (currentPath ? `${currentPath}.${key}` : key);
                if (typeof value === 'object' && value !== null) {
                    search(value, newPath);
                }
            }
        }
    }
    

    search(json, '');

    return paths;
}
// Example usage
// const json = {
//     a: { __ID: "XYZ", _custID: "ABC", details: {} },
//     b: { __ID: "XYZ", otherDetails: {} },
//     c: { __ID: "XYZ", _custID: "ABC" }
// };
// const criteria = { __ID: "XYZ", _custID: "ABC" };
// const paths = findAllPaths(json, criteria);
// console.log(paths);

/**
 * 
 * @param {*} json // a json object 
 * @param {*} criteria // an object of key value pairs
 * @returns the data of all found objects matching the criteria (array of object)
 */
function findAllMatchingData(json, criteria) {
    let matchingData = [];

    if (typeof json !== 'object' || json === null) {
        const errorMessage = "passed json is not an object";
        return { matchingData, errorMessage };
    }

    function search(currentJson) {
        if (typeof currentJson === 'object' && currentJson !== null) {
            const meetsCriteria = Object.keys(criteria).every(key => currentJson[key] === criteria[key]);

            if (meetsCriteria) {
                matchingData.push(currentJson);
            }

            for (const key in currentJson) {
                const value = currentJson[key];
                if (typeof value === 'object' && value !== null) {
                    search(value);
                }
            }
        }
    }

    search(json);

    return matchingData;
}






function findAllPathsToValue(json, targetValue, currentPath = '') {
    let paths = [];

    if (json === null) {
        // Return empty array if input is not an object
        const errorMessage = "passed json cannot be null"
        return {paths, errorMessage};
    }

    if (Array.isArray(json)) {
        json.forEach((value, index) => {
            const path = `${currentPath}[${index}]`;
            if (value === targetValue) {
                paths.push(path);
            } else if (typeof value === 'object' && value !== null) {
                paths = paths.concat(findAllPathsToValue(value, targetValue, path));
            }
        });
    } else if (typeof objOrArr === 'object' && objOrArr !== null) {
        for (const key in objOrArr) {
            const path = currentPath ? `${currentPath}.${key}` : key;
            if (objOrArr[key] === targetValue) {
                paths.push(path);
            } else if (typeof objOrArr[key] === 'object' && objOrArr[key] !== null) {
                paths = paths.concat(findAllPathsToValue(objOrArr[key], targetValue, path));
            }
        }
    }

    return paths;
}
// Example usage
// const data = { a: [1, 2, { b: 3, c: [4, 3] }], d: 3 };
// const allPaths = findAllPathsToValue(data, 3);
// OUTPUT
// [
//     "a[2].b", // Path to the '3' inside the nested object in array 'a'
//     "a[2].c[1]", // Path to the '3' inside the nested array 'c' in the object in array 'a'
//     "d" // Path to the '3' at the top level of the object
// ]

function deleteObjectPaths(json, paths) {
    if (typeof json !== 'object' || json === null) {
        // Return empty array if input is not an object
        const errorMessage = "passed json is not an object"
        return {paths, errorMessage};
    }
    paths.forEach(path => {
        let parts = path.split(/\.|\[|\]/).filter(p => p !== '');
        let current = json;
        for (let i = 0; i < parts.length; i++) {
            let part = parts[i];
            if (i === parts.length - 1) {
                if (Array.isArray(current)) {
                    current.splice(part, 1);
                } else {
                    delete current[part];
                }
            } else {
                current = current[part];
            }
        }
    });
}
// Example usage
// const data = { a: [1, 2, { b: 3, c: [4, 3] }], d: 3 };
// const pathsToDelete = ["a[2].b", "a[2].c[1]", "d"];
// deletePathsFromObject(data, pathsToDelete);
// console.log(data);
// OUTPUT
// {
//     a: [1, 2, { c: [4] }]
// }


function updateObject(json, paths, newValue) {
    if (typeof json !== 'object' || json === null) {
        // Return empty array if input is not an object
        const errorMessage = "passed json is not an object"
        return {paths, errorMessage};
    }
    paths.forEach(path => {
        let parts = path.split(/\.|\[|\]/).filter(p => p !== '');
        let current = json;
        for (let i = 0; i < parts.length; i++) {
            let part = parts[i];
            if (i === parts.length - 1) {
                if (Array.isArray(current)) {
                    current[part] = newValue;
                } else {
                    current[part] = newValue;
                }
            } else {
                current = current[part];
            }
        }
    });
}

// Example usage
// const data = { a: [1, 2, { b: 3, c: [4, 3] }], d: 3 };
// const pathsToUpdate = ["a[2].b", "a[2].c[1]", "d"];
// updateObjectValue(data, pathsToUpdate, 'newValue');
// console.log(data);
// OUTPUT
// {
//     a: [1, 2, { b: 'newValue', c: [4, 'newValue'] }],
//     d: 'newValue'
// }


function getParentOfPaths(paths) {
    if (!Array.isArray(paths)) {
        const errorMessage = "passed paths is not an array";
        return { paths, errorMessage };
    }
    return paths.map(path => {
        // Split the path into segments and remove empty parts
        let parts = path.split(/\.|\[|\]/).filter(p => p !== '');

        // Remove the last segment to get the parent path
        if (parts.length > 1) {
            parts.pop();
            return parts.join('.').replace(/\.(?=\d+)/g, '[') + ']'.repeat((parts.join('.').match(/\[/g) || []).length);
        } else {
            // If there is only one segment, return it as is (top-level key)
            return parts[0];
        }
    });
}

// Example usage
// const paths = ["a[2].b", "a[2].c[1]", "d"];
// const parentPaths = getParentPaths(paths);
// console.log(parentPaths);
// OUTPUT
// ["a[2]", "a[2].c", "d"]

function getDataAtPath(jsonObject, path) {
    let currentElement = jsonObject;
    const parts = path.split('.');
    for (let part of parts) {
        if (part.includes('[')) {
            let [key, index] = part.split('[');
            index = parseInt(index.replace(']', ''), 10);
            currentElement = currentElement[key][index];
        } else {
            currentElement = currentElement[part];
        }
    }
    return currentElement;
}

function filterFileMakerData(originalJson, paths) {
    const newJson = { response: { data: [] } };

    paths.forEach((path, index) => {
        const data = getDataAtPath(originalJson, path);
        if (!newJson.response.data[index]) {
            newJson.response.data[index] = {};
        }
        newJson.response.data[index].fieldData = data;
    });

    return newJson;
}



module.exports = {
    findAllPaths,
    findAllMatchingData,
    findAllPathsToValue,
    deleteObjectPaths,
    updateObject,
    filterFileMakerData,
};

// Example usage
// const data = { a: [1, 2, { b: 3, c: [4, 3] }], d: 3 };
// const paths = ["a[2].b", "a[2].c[1]", "d", "a[5].b", "a[5].c[1]"];
// const newObj = createNewObjectFromPaths(data, paths);
// console.log(newObj);
// OUTPUT
// {
//     a: [
//         { b: 3, c: [3] },
//     ],
//     d: 3
// }


/**
 * WORKFLOWS
 * 
 * SCENARIO:    Delete/Update objects with __ID of "XYZ"
 *              1) findAllPaths { __ID: "XYZ"}
 *              2) deleteObjectPaths/updateObject
 *              3) return new object
 * 
 *              Delete/Update instances of value "XYZ"
 *              1) findAllPathsToValue
 *              2) deleteObjectPaths/updateObject
 *              3) return new object
 * 
 *              Return object where __ID is "XYZ"
 *              1) findAllPaths for { __ID: "XYZ"}
 *              2) filterFileMakerData
 *              3) return new object
 * 
 *              WORKING WITH MULTIPLE VALUES
 * 
 *              Return object where __ID is "XYZ" and _custID is "ABC"
 *              1) findAllPaths for { __ID: "XYZ", _custID: "ABC"}
 *              2) filterFileMakerData
 *              3) return new object
 */
