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
 *
 * History
 *   29 May 2019 (albrecht): created
 */
package org.knime.js.base.node.configuration.selection.column;

import java.awt.GridBagConstraints;
import java.util.List;

import javax.swing.JCheckBox;
import javax.swing.JComboBox;
import javax.swing.JPanel;
import javax.swing.JSpinner;
import javax.swing.SpinnerNumberModel;
import javax.swing.border.Border;

import org.knime.core.data.DataColumnSpec;
import org.knime.core.data.DataTableSpec;
import org.knime.core.data.DataValue;
import org.knime.core.node.InvalidSettingsException;
import org.knime.core.node.NodeSettingsRO;
import org.knime.core.node.NodeSettingsWO;
import org.knime.core.node.NotConfigurableException;
import org.knime.core.node.port.PortObjectSpec;
import org.knime.core.node.util.CheckUtils;
import org.knime.core.node.util.ColumnSelectionPanel;
import org.knime.js.base.dialog.selection.single.SingleSelectionComponentFactory;
import org.knime.js.base.node.base.selection.column.ColumnSelectionNodeConfig;
import org.knime.js.base.node.base.validation.InputSpecFilter;
import org.knime.js.base.node.configuration.FlowVariableDialogNodeNodeDialog;

/**
 * The dialog for the column selection configuration node
 *
 * @author Christian Albrecht, KNIME GmbH, Konstanz, Germany
 */
public final class ColumnSelectionDialogNodeNodeDialog
    extends FlowVariableDialogNodeNodeDialog<ColumnSelectionDialogNodeValue> {

    private final ColumnSelectionPanel m_defaultField;

    private final JComboBox<String> m_type;

    private final JCheckBox m_limitNumberVisOptionsBox;

    private final JSpinner m_numberVisOptionSpinner;

    private final ColumnSelectionDialogNodeConfig m_config;

    private DataTableSpec m_unfilteredSpec;

    private final InputSpecFilter.Dialog m_inputSpecFilterDialog = new InputSpecFilter.Dialog();

    private String[] m_possibleColumns;

    /**
     * Constructor, inits fields calls layout routines
     */
    @SuppressWarnings("unchecked")
    public ColumnSelectionDialogNodeNodeDialog() {
        m_config = new ColumnSelectionDialogNodeConfig();
        m_type = new JComboBox<>(SingleSelectionComponentFactory.listSingleSelectionComponents());
        m_defaultField = new ColumnSelectionPanel((Border)null, new Class[]{DataValue.class});
        m_limitNumberVisOptionsBox = new JCheckBox();
        m_numberVisOptionSpinner = new JSpinner(new SpinnerNumberModel(10, 2, Integer.MAX_VALUE, 1));
        m_inputSpecFilterDialog.addListener(e -> updateDefaultField());
        createAndAddTab();
    }

    private void updateDefaultField() {
        final InputSpecFilter.Config tempConfig = new InputSpecFilter.Config();
        m_inputSpecFilterDialog.saveToConfig(tempConfig);
        final DataTableSpec filtered = tempConfig.createFilter().filter(m_unfilteredSpec);
        final String currentlySelected = m_defaultField.getSelectedColumn();
        try {
            m_defaultField.update(filtered, currentlySelected);
        } catch (NotConfigurableException e) {
            // TODO handle somehow.. Maybe with an error label?
        }
    }

    /**
     * {@inheritDoc}
     */
    @Override
    protected String getValueString(final NodeSettingsRO settings) throws InvalidSettingsException {
        ColumnSelectionDialogNodeValue value = new ColumnSelectionDialogNodeValue();
        value.loadFromNodeSettings(settings);
        return value.getColumn();
    }

    /**
     * {@inheritDoc}
     */
    @Override
    protected void fillPanel(final JPanel panelWithGBLayout, final GridBagConstraints gbc) {
        addPairToPanel("Selection Type: ", m_type, panelWithGBLayout, gbc);
        addPairToPanel("Type Filter:", m_inputSpecFilterDialog.getPanel(), panelWithGBLayout, gbc);
        addPairToPanel("Default Value: ", m_defaultField, panelWithGBLayout, gbc);

        m_type.addItemListener(e -> reactToTypeChange());
        addPairToPanel("Limit number of visible options: ", m_limitNumberVisOptionsBox, panelWithGBLayout, gbc);
        m_limitNumberVisOptionsBox
            .addChangeListener(e -> m_numberVisOptionSpinner.setEnabled(m_limitNumberVisOptionsBox.isSelected()));
        addPairToPanel("Number of visible options: ", m_numberVisOptionSpinner, panelWithGBLayout, gbc);
    }

    private void reactToTypeChange() {
        boolean enabled = SingleSelectionComponentFactory.LIST.equals(m_type.getSelectedItem());
        m_limitNumberVisOptionsBox.setEnabled(enabled);
        m_numberVisOptionSpinner.setEnabled(enabled && m_limitNumberVisOptionsBox.isSelected());
    }

    /**
     * {@inheritDoc}
     */
    @Override
    protected void loadSettingsFrom(final NodeSettingsRO settings, final PortObjectSpec[] specs)
        throws NotConfigurableException {
        m_config.loadSettingsInDialog(settings);
        super.loadSettingsFrom(m_config);
        DataTableSpec spec = (DataTableSpec)specs[0];
        m_unfilteredSpec = spec;

        final InputSpecFilter.Config inputSpecValidatorConfig = m_config.getInputSpecFilterConfig();
        m_inputSpecFilterDialog.loadFromConfig(inputSpecValidatorConfig, spec);
        final DataTableSpec filteredSpec = inputSpecValidatorConfig.createFilter().filter(spec);

        try {
            m_defaultField.update(filteredSpec, null);
        } catch (NotConfigurableException ex) {
            if (m_unfilteredSpec.getNumColumns() == 0) {
                throw ex;
            } else {
                // ignore since there are columns that could be selected if the input filter is changed
            }
        }
        m_possibleColumns = filteredSpec.getColumnNames();
        String selectedDefault = m_config.getDefaultValue().getColumn();
        if (selectedDefault.isEmpty()) {
            List<DataColumnSpec> cspecs = m_defaultField.getAvailableColumns();
            if (!cspecs.isEmpty()) {
                selectedDefault = cspecs.get(0).getName();
            }
        }
        m_defaultField.setSelectedColumn(selectedDefault);
        ColumnSelectionNodeConfig columnSelectionConfig = m_config.getColumnSelectionConfig();
        m_type.setSelectedItem(columnSelectionConfig.getType());
        m_limitNumberVisOptionsBox.setSelected(columnSelectionConfig.isLimitNumberVisOptions());
        m_numberVisOptionSpinner.setValue(columnSelectionConfig.getNumberVisOptions());
    }

    /**
     * {@inheritDoc}
     */
    @Override
    protected void saveSettingsTo(final NodeSettingsWO settings) throws InvalidSettingsException {
        CheckUtils.checkSetting(m_defaultField.getNrItemsInList() > 0, "No column is selectable.");
        saveSettingsTo(m_config);
        m_config.getDefaultValue().setColumn(m_defaultField.getSelectedColumn());
        ColumnSelectionNodeConfig columnSelectionConfig = m_config.getColumnSelectionConfig();
        columnSelectionConfig.setType((String)m_type.getSelectedItem());
        columnSelectionConfig.setPossibleColumns(m_possibleColumns);
        columnSelectionConfig.setLimitNumberVisOptions(m_limitNumberVisOptionsBox.isSelected());
        columnSelectionConfig.setNumberVisOptions((Integer)m_numberVisOptionSpinner.getValue());
        m_inputSpecFilterDialog.saveToConfig(m_config.getInputSpecFilterConfig());
        m_config.saveSettings(settings);
    }

}
