/*
 * ------------------------------------------------------------------------
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
 * ------------------------------------------------------------------------
 *
 */
package org.knime.quickform.nodes.in.listbox;

import org.knime.core.node.InvalidSettingsException;
import org.knime.core.node.NodeSettingsRO;
import org.knime.core.node.NodeSettingsWO;
import org.knime.core.quickform.AbstractQuickFormConfiguration;

/**
 * Configuration to list box input node; separated by a specified string.
 *
 * @author Thomas Gabriel, KNIME AG, Zurich, Switzerland
 * @since 2.6
 */
final class ListBoxInputQuickFormInConfiguration
        extends AbstractQuickFormConfiguration<ListBoxInputQuickFormValueInConfiguration> {

    private String m_separator = ",";

    private boolean m_separateEachCharacter = false;

    /**
     * @return separator to split the value
     */
    String getSeparator() {
        return m_separator;
    }

    /**
     * @param separator to split the value by
     */
    void setSeparator(final String separator) {
        m_separator = separator;
    }

    /**
     * @return the separateEachCharacter
     */
    public boolean getSeparateEachCharacter() {
        return m_separateEachCharacter;
    }

    /**
     * @param separateEachCharacter the separateEachCharacter to set
     */
    public void setSeparateEachCharacter(final boolean separateEachCharacter) {
        m_separateEachCharacter = separateEachCharacter;
    }

    /** Save config to argument.
     * @param settings To save to.
     */
    @Override
    public void saveSettingsTo(final NodeSettingsWO settings) {
        super.saveSettingsTo(settings);
        settings.addString("separator", m_separator);
        settings.addBoolean("separateEachCharacter", m_separateEachCharacter);
    }

    /** Load config in model.
     * @param settings To load from.
     * @throws InvalidSettingsException If that fails for any reason.
     */
    @Override
    public void loadSettingsInModel(final NodeSettingsRO settings) throws InvalidSettingsException {
        super.loadSettingsInModel(settings);
        try {
            m_separator = Character.toString(settings.getChar("separator"));
        } catch (InvalidSettingsException ise) {
            // changed to string with 2.7
            m_separator = settings.getString("separator");
        }
        m_separateEachCharacter = settings.getBoolean("separateEachCharacter", false);
    }

    /** Load settings in dialog, init defaults if that fails.
     * @param settings To load from.
     */
    @Override
    public void loadSettingsInDialog(final NodeSettingsRO settings) {
        super.loadSettingsInDialog(settings);
        try {
            m_separator = Character.toString(settings.getChar("separator"));
        } catch (InvalidSettingsException ise) {
            // changed to string with 2.7
            m_separator = settings.getString("separator", ",");
        }
        m_separateEachCharacter = settings.getBoolean("separateEachCharacter", false);
    }

    /** {@inheritDoc} */
    @Override
    public ListBoxInputQuickFormPanel createController() {
        return new ListBoxInputQuickFormPanel(this);
    }

    /** {@inheritDoc} */
    @Override
    public ListBoxInputQuickFormValueInConfiguration
        createValueConfiguration() {
        return new ListBoxInputQuickFormValueInConfiguration();
    }

}
