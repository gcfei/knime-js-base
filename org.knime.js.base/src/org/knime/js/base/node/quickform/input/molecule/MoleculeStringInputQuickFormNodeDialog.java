/*
 * ------------------------------------------------------------------------
 *  Copyright by KNIME GmbH, Konstanz, Germany
 *  Website: http://www.knime.org; Email: contact@knime.org
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
 *  KNIME and ECLIPSE being a combined program, KNIME GMBH herewith grants
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
 */
package org.knime.js.base.node.quickform.input.molecule;

import java.awt.GridBagConstraints;

import javax.swing.JComboBox;
import javax.swing.JPanel;
import javax.swing.JScrollPane;
import javax.swing.JTextArea;

import org.knime.core.node.InvalidSettingsException;
import org.knime.core.node.NodeSettingsRO;
import org.knime.core.node.NodeSettingsWO;
import org.knime.core.node.NotConfigurableException;
import org.knime.core.node.port.PortObjectSpec;
import org.knime.js.base.node.quickform.QuickFormNodeDialog;

/**
 *
 * @author Christian Albrecht, KNIME.com AG, Zurich, Switzerland, University of
 *         Konstanz
 */
@SuppressWarnings("rawtypes")
public class MoleculeStringInputQuickFormNodeDialog extends QuickFormNodeDialog {

    private static final int TEXT_AREA_HEIGHT = 3;

    private final JComboBox m_formatBox;

    private final JTextArea m_defaultArea;

    private final JTextArea m_valueArea;

    private MoleculeStringInputQuickFormConfig m_config;

    /** Constructors, inits fields calls layout routines. */
    @SuppressWarnings("unchecked")
    MoleculeStringInputQuickFormNodeDialog(final MoleculeStringInputQuickFormConfig config) {
        m_config = config;
        m_formatBox = new JComboBox(MoleculeStringInputQuickFormRepresentation.DEFAULT_FORMATS);
        m_formatBox.setEditable(true);
        m_defaultArea = new JTextArea(TEXT_AREA_HEIGHT, DEF_TEXTFIELD_WIDTH);
        m_valueArea = new JTextArea(TEXT_AREA_HEIGHT, DEF_TEXTFIELD_WIDTH);
        createAndAddTab();
    }

    /**
     * {@inheritDoc}
     */
    @Override
    protected final void fillPanel(final JPanel panelWithGBLayout, final GridBagConstraints gbc) {
        addPairToPanel("Format: ", m_formatBox, panelWithGBLayout, gbc);
        addPairToPanel("Default Value: ", new JScrollPane(m_defaultArea), panelWithGBLayout, gbc);
        addPairToPanel("Molecule String: ", new JScrollPane(m_valueArea), panelWithGBLayout, gbc);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    protected void loadSettingsFrom(final NodeSettingsRO settings, final PortObjectSpec[] specs)
            throws NotConfigurableException {
        m_config.loadSettingsInDialog(settings);
        m_defaultArea.setText(m_config.getDefaultValue());
        m_formatBox.setSelectedItem(m_config.getFormat());
        m_valueArea.setText(m_config.getMoleculeString());
    }

    /**
     * {@inheritDoc}
     */
    @Override
    protected void saveSettingsTo(final NodeSettingsWO settings) throws InvalidSettingsException {
        saveSettingsTo(m_config);
        m_config.setFormat(m_formatBox.getSelectedItem().toString());
        m_config.setDefaultValue(m_defaultArea.getText());
        m_config.setMoleculeString(m_valueArea.getText());
        m_config.saveSettings(settings);
    }

}
