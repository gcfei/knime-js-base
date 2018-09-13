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

// cf. org.knime.js.core.JSONDataTableSpec.JSTypes
const typeMap = {
    'SVG image': 'svg',
    'PNG Image': 'png',
    'Boolean value': 'boolean',
    List: 'undefined',
    'Date and Time': 'dateTime',
    'Number (integer)': 'number',
    'Number (long)': 'number',
    'Number (double)': 'number',
    Set: 'undefined',
    String: 'string',
    URI: 'string'
};

module.exports = (numRows, knimeTypes) => {
    let numColumns = knimeTypes.length;

    let rows, maxValues, minValues, table, colTypes;

    let generateRows = () => Array(numRows).fill().map((_, rowIndex) => {
        let data = Array(numColumns).fill().map((_, colIndex) => {
            switch (knimeTypes[colIndex]) {
            case 'SVG image':
                return '<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="-.55 -.65 1.1 1" width="550px" height="500px" xmlns:xlink="http://www.w3.org/1999/xlink"><rect fill="white" x="-.55" y="-.65" width="1.1" height="1"/><path id="triangle" fill="none" stroke="#FFD800" stroke-width=".042" d="M0,-0.57735L-0.5,0.288675h1z"/><use xlink:href="#triangle" transform="scale(.85) rotate(-3.85)"/><use xlink:href="#triangle" transform="scale(.7) rotate(-9.25)"/><use xlink:href="#triangle" transform="scale(.575) rotate(-17.4)"/><use xlink:href="#triangle" transform="scale(.45) rotate(-30)"/></svg>';
            case 'PNG image':
                throw new Error('not implemented');
            case 'Boolean value':
                return Math.random() < 0.5;
            case 'Number (long)':
            case 'Number (double)':
                return 2 * Math.random() - 1;
            case 'Number (integer)':
                if (colIndex === 0) {
                    if (rowIndex === 0) {
                        // this will provoke rounding errors
                        return 2 * Number.MAX_SAFE_INTEGER;
                    }
                    if (rowIndex === 1) {
                        // this will provoke rounding errors
                        return 2 * Number.MIN_SAFE_INTEGER;
                    }
                }
                return Math.floor(Number.MAX_SAFE_INTEGER * (2 * Math.random() - 1));
            default:
                return `foo ${rowIndex}-${colIndex}`;
            }
        });
        return {
            data,
            rowKey: `Row${rowIndex}`
        };
    });

    let colNames = Array(numColumns).fill().map((_, colIndex) => `Column_${colIndex}`);

    colTypes = knimeTypes.map(type => {
        if (!typeMap[type]) {
            throw new Error(`Invalid column type ${type}. Supported types: ${Object.keys(typeMap).join(', ')}.`);
        }
        return typeMap[type];
    });

    let getMaxValues = () => {
        return table.rows.map(row => row.data).reduce((max, row) => max.map((entry, i) => (entry > row[i]) ? entry : row[i]));
    };
    let getMinValues = () => {
        return table.rows.map(row => row.data).reduce((min, row) => min.map((entry, i) => (entry < row[i]) ? entry : row[i]));
    };

    let spec = {
        '@class': 'org.knime.js.core.JSONDataTableSpec',
        colNames,
        colorModels: [],
        colTypes,
        containsMissingValues: Array(numColumns).fill(false),
        extensionNames: [],
        extensionTypes: [],
        filterIds: Array(numColumns).fill(null),
        knimeTypes,
        get maxValues() {
            if (!maxValues) {
                maxValues = getMaxValues();
            }
            return maxValues;
        },
        get minValues() {
            if (!minValues) {
                minValues = getMinValues();
            }
            return minValues;
        },
        numColumns,
        numExtensions: 0,
        numRows,
        possibleValues: Array(numColumns).fill(null),
        rowColorValues: Array(numColumns).fill('#404040'),
        rowSizeValues: null
    };

    table = {
        '@class': 'org.knime.js.core.JSONDataTable',
        id: '12345678-abcd-ef01-2345-67890abc1234',
        extensions: null,
        get rows() {
            if (!rows) {
                rows =  generateRows();
            }
            return rows;
        },
        spec,
        dataHash: null
    };

    return table;
};
