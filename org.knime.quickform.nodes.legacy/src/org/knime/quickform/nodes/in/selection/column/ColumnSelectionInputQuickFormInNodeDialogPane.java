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
package org.knime.quickform.nodes.in.selection.column;

import java.awt.GridBagConstraints;

import javax.swing.JPanel;
import javax.swing.border.Border;

import org.knime.core.data.DataTableSpec;
import org.knime.core.data.DataValue;
import org.knime.core.node.InvalidSettingsException;
import org.knime.core.node.NodeSettingsRO;
import org.knime.core.node.NodeSettingsWO;
import org.knime.core.node.NotConfigurableException;
import org.knime.core.node.port.PortObjectSpec;
import org.knime.core.node.util.ColumnSelectionPanel;
import org.knime.quickform.nodes.in.QuickFormInNodeDialogPane;

/**
 * Dialog to node.
 *
 * @author Thomas Gabriel, KNIME AG, Zurich, Switzerland
 * @since 2.6
 */
final class ColumnSelectionInputQuickFormInNodeDialogPane
    extends QuickFormInNodeDialogPane
        <ColumnSelectionInputQuickFormInConfiguration> {

    private final ColumnSelectionPanel m_columnSelection;

    /** Constructors, inits fields calls layout routines. */
    @SuppressWarnings("unchecked")
    ColumnSelectionInputQuickFormInNodeDialogPane() {
        m_columnSelection = new ColumnSelectionPanel((Border) null,
               new Class[]{DataValue.class});
        createAndAddTab();
    }
    
    /** {@inheritDoc} */
    @Override
    protected void fillPanel(final JPanel panelWithGBLayout,
               final GridBagConstraints gbc) {
         addPairToPanel("Column Selection: ", m_columnSelection, 
                 panelWithGBLayout, gbc);
    }

    /** {@inheritDoc} */
    @Override
    protected ColumnSelectionInputQuickFormInConfiguration 
            createConfiguration() {
        return new ColumnSelectionInputQuickFormInConfiguration();
    }

    /** {@inheritDoc} */
    @Override
    protected void loadSettingsFrom(final NodeSettingsRO settings,
        final PortObjectSpec[] specs) throws NotConfigurableException {
        final DataTableSpec spec = (DataTableSpec) specs[0];
        m_columnSelection.update(spec, null);
        super.loadSettingsFrom(settings, specs);
    }
    
    /** {@inheritDoc} */
    @Override
    protected void saveSettingsTo(final NodeSettingsWO settings)
            throws InvalidSettingsException {
        super.saveSettingsTo(settings);
    }

    /** {@inheritDoc} */
    @Override
    protected void saveAdditionalSettings(
               final ColumnSelectionInputQuickFormInConfiguration config)
               throws InvalidSettingsException {
        final String value = m_columnSelection.getSelectedColumn();
        config.getValueConfiguration().setValue(value);
        final DataTableSpec spec = m_columnSelection.getDataTableSpec();
        config.setChoices(spec.getColumnNames());
    }

    /** {@inheritDoc} */
    @Override
    protected void loadAdditionalSettings(
               final ColumnSelectionInputQuickFormInConfiguration config) {
         final String value = config.getValueConfiguration().getValue();
         m_columnSelection.setSelectedColumn(value);
    }
}
