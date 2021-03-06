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
package org.knime.quickform.nodes.out.variable;

import java.awt.GridBagConstraints;

import javax.swing.DefaultComboBoxModel;
import javax.swing.JComboBox;
import javax.swing.JPanel;

import org.knime.core.node.InvalidSettingsException;
import org.knime.core.node.util.FlowVariableListCellRenderer;
import org.knime.core.node.workflow.FlowVariable;
import org.knime.quickform.nodes.out.QuickFormOutNodeDialogPane;

/**
 * Dialog for node that reads a flow variable and provides it
 * in a quickform output. It contains a selection box for the available flow
 * variables.
 *
 * @author Bernd Wiswedel, KNIME AG, Zurich, Switzerland
 */
public class VariableOutputQuickFormOutNodeDialogPane extends
        QuickFormOutNodeDialogPane<VariableOutputQuickFormOutConfiguration> {

    private final JComboBox m_variableNameCombo;

    /** Create new dialog.
     */
    public VariableOutputQuickFormOutNodeDialogPane() {
        m_variableNameCombo = new JComboBox(new DefaultComboBoxModel());
        m_variableNameCombo.setRenderer(new FlowVariableListCellRenderer());
        createAndAddTab();
    }

    /** {@inheritDoc} */
    @Override
    protected void fillPanel(
            final JPanel panelWithGBLayout, final GridBagConstraints gbc) {
        addPairToPanel("Variable Name", m_variableNameCombo,
                panelWithGBLayout, gbc);
    }

    /** {@inheritDoc} */
    @Override
    protected VariableOutputQuickFormOutConfiguration createConfiguration() {
        return new VariableOutputQuickFormOutConfiguration();
    }

    /** {@inheritDoc} */
    @Override
    protected void saveAdditionalSettings(
            final VariableOutputQuickFormOutConfiguration config)
            throws InvalidSettingsException {
        FlowVariable v = (FlowVariable)m_variableNameCombo.getSelectedItem();
        if (v != null) {
            config.setVariableName(v.getName());
        }
    }

    /** {@inheritDoc} */
    @Override
    protected void loadAdditionalSettings(
            final VariableOutputQuickFormOutConfiguration config) {
        DefaultComboBoxModel m =
            (DefaultComboBoxModel)m_variableNameCombo.getModel();
        String selectedName = config.getVariableName();
        FlowVariable selectedVar = null;
        m.removeAllElements();
        for (FlowVariable v : getAvailableFlowVariables().values()) {
            m.addElement(v);
            if (v.getName().equals(selectedName)) {
                selectedVar = v;
            }
        }
        if (selectedVar != null) {
            m_variableNameCombo.setSelectedItem(selectedVar);
        }
    }

}
