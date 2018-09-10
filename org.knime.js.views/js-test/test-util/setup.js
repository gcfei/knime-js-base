const fs = require('fs');

const chalk = require('chalk');
const rfr = require('rfr');


let warn = text => console.warn(chalk.yellow(text));

let additionalKeys = [];
let originalGlobal;

/**
* Load legacy code that works by defining variables on the global namespace
*/

global.requireLegacy = (path, varName) => {
    let resolvedPath = rfr.resolve(path);
    let jsCode = fs.readFileSync(resolvedPath, 'utf-8');

    // cleanup previous globals
    additionalKeys.forEach(key => { delete global[key]; });
    additionalKeys = [];

    if (originalGlobal) {
        Object.keys(originalGlobal).forEach(key => {
            global[key] = originalGlobal[key];
        });
    } else {
        originalGlobal = Object.assign({}, global);
    }

    eval(jsCode);

    let logPath = path.replace(/^.\//, '').replace(/(\.js)?$/, '.js');
    Object.keys(global).forEach(key => {
        if (!originalGlobal.hasOwnProperty(key)) {
            additionalKeys.push(key);
        } else if (global[key] !== originalGlobal[key]) {
            warn(`File ${logPath} overwrites global variable ${key}`);
        }
    });
    switch (additionalKeys.length) {
    case 0:
        throw new Error(`File ${logPath} defines no global variables`);
    case 1:
        return global[additionalKeys[0]];
    default:
        warn(`File ${logPath} defines multiple global variables: ${additionalKeys.join(', ')}.`);
        if (varName && additionalKeys.includes(varName)) {
            return global[varName];
        }
        return 'This method does not return anything. Use the global variable you want explicitly.';
    }
};

global.cleanupLegacy = () => {};

global.chai = require('chai');
global.assert = global.chai.assert;
global.expect = global.chai.expect;
