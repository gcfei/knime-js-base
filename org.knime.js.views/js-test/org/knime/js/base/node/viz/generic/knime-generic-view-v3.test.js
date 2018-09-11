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

require('rfr')('js-test/test-util/setup');

describe('KNIME generic view v3', () => {


    let {subject: view, window} = loadInSandbox([
        'js-test/test-util/mocks/knimeServiceMock',
        'js-test/test-util/mocks/requireMock',
        'js-test/test-util/mocks/knimeTableMock',
        'js-src/org/knime/js/base/node/viz/generic/knime-generic-view-v3'
    ], 'knime_generic_view');

    describe('API', () => {
        it('has public methods', () => {
            const publicMethods = ['init', 'validate', 'setValidationError', 'getComponentValue', 'getSVG'];
            publicMethods.forEach(method => {
                expect(view[method]).to.be.a('function');
            });
            Object.keys(view).filter(m => !publicMethods.includes(m) && !/^_/.test(m)).forEach(key => {
                let msg = `Unexpected public method "${key}". Use "_" to mark private methods`;
                expect(view[key], msg).not.to.be.a('function');
            });
        });

        it('has no public attributes', () => {
            Object.keys(view).filter(a => !/^_/.test(a)).forEach(key => {
                let msg = `Unexpected public attribute "${key}". Use "_" to mark private fields, or use a closure.`;
                expect(view[key], msg).to.be.a('function');
            });

        });
    });

    describe('init', () => {
        it('renders an error message when no JS code is given', () => {
            view.init({}, null);
            expect(window.document.body.innerHTML).to.equal('Error: No script available.');
        });

        it('initializes correctly', done => {
            view.init({
                jsCode: 'document.write("Hello, World!");'
            }, {});
            setTimeout(() => {
                expect(window.document.body.textContent).to.equal('Hello, World!');
                done();
            }, 10);
        });
    });

    describe('SVG', () => {
        let svg = '<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="-.55 -.65 1.1 1" width="550px" height="500px" xmlns:xlink="http://www.w3.org/1999/xlink"><rect fill="white" x="-.55" y="-.65" width="1.1" height="1"/><path id="triangle" fill="none" stroke="#FFD800" stroke-width=".042" d="M0,-0.57735L-0.5,0.288675h1z"/><use xlink:href="#triangle" transform="scale(.85) rotate(-3.85)"/><use xlink:href="#triangle" transform="scale(.7) rotate(-9.25)"/><use xlink:href="#triangle" transform="scale(.575) rotate(-17.4)"/><use xlink:href="#triangle" transform="scale(.45) rotate(-30)"/></svg>';

        it('returns generated SVG', () => {
            view.init({jsSVGCode: `return '${svg}';`}, null);
            expect(view.getSVG()).to.equal(svg);
        });

        it('returns null if SVG code is invalid', () => {
            view.init({jsSVGCode: svg}, null);
            expect(view.getSVG()).to.be.null;
        });
    });
});
