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

const vm = require('vm');
const fs = require('fs');

const chalk = require('chalk');
const rfr = require('rfr');
const jsdom = require('mocha-jsdom');


let warn = text => console.warn(chalk.yellow(text));


/**
 * Load legacy code that works by defining variables on the global namespace
 * @param {String} path The path to load, relative to the project root
 * @param {String} varName (optional) The name of the global variable to return.
 * @return {Object} If more than one global variable is created, the `varName` argument is required, and the loader uses
 *     it to determine the object to return. Otherwise this loader returns the value of the only global object created.
 * For example, if a script reads `foo = o1; bar = o2;`, then `requireLegacy('script', 'foo')` will return `o1`, and
 * `requireLegacy('script', 'bar')` will return `o2`.
 * If the script contains only `foo = o1`, then `requireLegacy('script')` will return `1`;
 */
global.requireLegacy = (() => {
    let additionalKeys = [];
    let originalGlobal;
    return (path, varName) => {
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

        vm.runInThisContext(jsCode, resolvedPath);

        let logPath = path.replace(/^.\//, '').replace(/(\.js)?$/, '.js');
        Object.keys(global).forEach(key => {
            if (!originalGlobal.hasOwnProperty(key)) {
                additionalKeys.push(key);
            } else if (global[key] !== originalGlobal[key]) {
                warn(`File ${logPath} overwrites global variable ${key}`);
            }
        });

        // FIXME: filter out istanbul __coverage__ and cov_*

        switch (additionalKeys.length) {
        case 0:
            throw new Error(`File ${logPath} defines no global variables`);
        case 1:
            return global[additionalKeys[0]];
        default:
            warn(`😱 File ${logPath} defines multiple global variables:\n• ${additionalKeys.sort().join('\n• ')}`);
            if (varName && additionalKeys.includes(varName)) {
                return global[varName];
            }
            return 'This method does not return anything. Use the global variable you want explicitly.';
        }
    };
})();

// chai

global.chai = require('chai');
global.assert = global.chai.assert;
global.expect = global.chai.expect;

// jsdom

jsdom({
    url: 'http://dummy.example'
});

