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

window.knimeService = {
    version: '1.0.0',
    CLOSE: 0b1,
    OK: 0b10,
    CANCEL: 0b100,
    LINK: 0b1000,
    SMALL_ICON: 0b10000,
    addButton: function () {},
    addMenuDivider: function () {},
    addMenuItem: function () {},
    addNavSpacer: function () {},
    addRowsToFilter: function () {},
    addRowsToSelection: function () {},
    addToFilter: function () {},
    allowFullscreen: function () {},
    clearAllWarningMessages: function () {},
    clearWarningMessage: function () {},
    createInlineMenuRadioButtons: function () {},
    createMenuCheckbox: function () {},
    createMenuNumberField: function () {},
    createMenuRadioButton: function () {},
    createMenuSelect: function () {},
    createMenuTextField: function () {},
    createStackedIcon: function () {},
    floatingHeader: function () {},
    getAllPartiallySelectedRows: function () {},
    getAllRowsForSelection: function () {},
    getGlobalService: function () {},
    headerHeight: function () {},
    inlineSvgStyles: function () {},
    isInteractivityAvailable: function () {},
    isRowPartiallySelected: function () {},
    isRowSelected: function () {},
    isRunningInWebportal: function () { return true; },
    isViewRequestsSupported: function () {},
    log: function () {},
    logError: function () {},
    publishFilter: function () {},
    publishSelection: function () {},
    removeFromFilter: function () {},
    removeRowsFromFilter: function () {},
    removeRowsFromSelection: function () {},
    setFilteredRows: function () {},
    setSelectedRows: function () {},
    setWarningMessage: function () {},
    subscribeToFilter: function () {},
    subscribeToSelection: function () {},
    unsubscribeFilter: function () {},
    unsubscribeSelection: function () {}
};
