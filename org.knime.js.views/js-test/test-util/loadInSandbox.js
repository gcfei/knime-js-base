#!/usr/bin/env node
/*
 * ------------------------------------------------------------------------
 *
 *  Copyright by KNIME AG, Zurich, Switzerland
 *  Website: http://www.knime.com; Email: contact@knime.com
 *
 *  This program is free software; you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License, Version 3, as
 *  published by the Free Software Foundation.
 *
 *  This program is distributed in the hope that it will be useful, but
 *  WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program; if not, see <http://www.gnu.org/licenses>.
 *
 *  Additional permission under GNU GPL version 3 section 7:
 *
 *  KNIME interoperates with ECLIPSE solely via ECLIPSE's plug-in APIs.
 *  Hence, KNIME and ECLIPSE are both independent programs and are not
 *  derived from each other. Should, however, the interpretation of the
 *  GNU GPL Version 3 ("License") under any applicable laws result in
 *  KNIME and ECLIPSE being a combined program, KNIME AG herewith grants
 *  you the additional permission to use and propagate KNIME together with
 *  ECLIPSE with only the license terms in place for ECLIPSE applying to
 *  ECLIPSE and the GNU GPL Version 3 applying for KNIME, provided the
 *  license terms of ECLIPSE themselves allow for the respective use and
 *  propagation of ECLIPSE together with KNIME.
 *
 *  Additional permission relating to nodes for KNIME that extend the Node
 *  Extension (and in particular that are based on subclasses of NodeModel,
 *  NodeDialog, and NodeView) and that only interoperate with KNIME through
 *  standard APIs ("Nodes"):
 *  Nodes are deemed to be separate and independent programs and to not be
 *  covered works.  Notwithstanding anything to the contrary in the
 *  License, the License does not apply to Nodes, you are not required to
 *  license Nodes under the License, and you are granted a license to
 *  prepare and propagate Nodes, in each case even if such Nodes are
 *  propagated with or for interoperation with KNIME.  The owner of a Node
 *  may freely choose the license terms applicable to such Node, including
 *  when such Node is propagated with or for interoperation with KNIME.
 * ---------------------------------------------------------------------
 */


const fs = require('fs');
const path = require('path');
const vm = require('vm');

const chalk = require('chalk');
const rfr = require('rfr');

let istanbulFilter = name => !/^(__coverage__$|cov_)/.test(name);

let warn = message => console.warn(chalk.yellow(message));

let prepareSandbox = () => {
    let sandbox = Object.create(null);

    let realGlobal = global;
    realGlobal.global = sandbox;
    require('jsdom-global')();
    realGlobal.global = realGlobal;

    vm.createContext(sandbox);
    return sandbox;
};

let findGlobal = (sandbox, snapshot, varName, fileName) => {
    let newStuff = Object.assign({}, sandbox);
    Object.keys(snapshot).forEach(key => {
        if (sandbox[key] !== snapshot[key]) {
            warn(`Global variable "${key}" overwritten by ${fileName}!`);
        }
        delete newStuff[key];
    });
    let newKeys = Object.keys(newStuff).filter(istanbulFilter);
    switch (newKeys.length) {
    case 0:
        throw new Error(`No new global variables created in ${fileName}!`);
    case 1:
        if (!varName) {
            return newStuff[newKeys[0]];
        }
        // else fallthrough
    default:
        if (!newKeys.includes(varName)) {
            throw new Error(`Global variable ${varName} was not created in ${fileName}!`);
        }
        if (newKeys.length > 1) {
            warn(`Multiple global variables created in ${fileName}! \n• ${newKeys.sort().join('\n• ')}`);
        }
        return newStuff[varName];
    }
};

/**
 * Load legacy code that works by defining variables on the global namespace
 * @param {Array|String} fileNames The file(s) to load, relative to the project root
 * @param {String} varName (optional) The name of the global variable to return.
 * @return {Object}
 * @return {{window: Object, subject: Object}}
 * `window` is the object that the JS code runs in, `subject` is the object that the loaded code produces.
 * If more than one global variable is created, the `varName` argument is required, and the loader uses
 *     it to determine the object to return. Otherwise this loader returns the value of the only global object created.
 * For example, if a script reads `foo = o1; bar = o2;`, then `loadInSandbox('script', 'foo').subject` will return `o1`,
 * and `loadInSandbox('script', 'bar').subject` will return `o2`.
 * If the script contains only `foo = o1`, then `requireLegacy('script').subject` will return `o1`;
 */
module.exports = (fileNames, varName) => {
    if (!Array.isArray(fileNames)) {
        fileNames = [fileNames];
    }

    let sandbox = prepareSandbox();
    let snapshot;

    for (let i = 0; i < fileNames.length; i++) {
        let fileName = fileNames[i];
        let lastIndex = i === fileNames.length - 1;
        if (lastIndex) {
            snapshot = Object.assign({}, sandbox);
        }
        let absPath = path.join(rfr.root, fileName.replace(/(\.js)?$/, '.js'));
        let jsCode = fs.readFileSync(absPath, 'utf-8');
        vm.runInContext(jsCode, sandbox, {filename: absPath});
        if (lastIndex) {
            let fileNameForLogging = path.relative(rfr.root, absPath);
            return {
                window: sandbox,
                subject: findGlobal(sandbox, snapshot, varName, fileNameForLogging)
            };
        }
    }
};
