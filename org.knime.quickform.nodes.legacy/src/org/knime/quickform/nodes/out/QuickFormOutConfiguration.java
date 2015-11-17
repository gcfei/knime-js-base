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
 *
 */
package org.knime.quickform.nodes.out;

import org.knime.core.node.InvalidSettingsException;
import org.knime.core.node.NodeSettingsRO;
import org.knime.core.node.NodeSettingsWO;

/**
 * Abstract configuration, contains fields for label, description etc.
 * @author Bernd Wiswedel, KNIME.com, Zurich, Switzerland
 */
public abstract class QuickFormOutConfiguration {

    private String m_label = "Label";
    private String m_description;
    private int m_weight;
    private boolean m_hideInWizard;

    /** @return the label */
    public String getLabel() {
        return m_label;
    }
    /** @param label the label to set
     * @throws InvalidSettingsException If label is empty or null.  */
    public void setLabel(final String label) throws InvalidSettingsException {
        if (label == null || label.length() == 0) {
            throw new InvalidSettingsException("No label provided");
        }
        m_label = label;
    }
    /** @return the weight */
    public int getWeight() {
        return m_weight;
    }
    /** @param weight the weight to set */
    public void setWeight(final int weight) {
        m_weight = weight;
    }
    /** @return the description */
    public String getDescription() {
        return m_description;
    }
    /** @param description the description to set */
    public void setDescription(final String description) {
        m_description = description;
    }

    /**
     * @return <code>true</code> if hidden in the wizard, otherwise <code>false</code>
     * @since 2.7
     */
    public boolean isHideInWizard() {
        return m_hideInWizard;
    }
    /**
     * @param hideInWizard set new state for this element to be hidden or not in the QuickForm execution wizard
     * @since 2.7
     */
    public void setHideInWizard(final boolean hideInWizard) {
        m_hideInWizard = hideInWizard;
    }

    /** Save config to argument.
     * @param settings To save to.
     */
    public void saveSettingsTo(final NodeSettingsWO settings) {
        settings.addString("label", m_label);
        settings.addString("description", m_description);
        settings.addInt("weight", m_weight);
        settings.addBoolean("hide_in_wizard", m_hideInWizard);
    }

    /** Load config in model.
     * @param settings To load from.
     * @throws InvalidSettingsException If that fails for any reason.
     */
    public void loadSettingsInModel(final NodeSettingsRO settings)
        throws InvalidSettingsException {
        m_label = settings.getString("label");
        if (m_label == null) {
            throw new InvalidSettingsException("Label must not be null");
        }
        m_description = settings.getString("description");
        m_weight = settings.getInt("weight");
        // new with 2.7
        m_hideInWizard = settings.getBoolean("hide_in_wizard", false);
    }

    /** Load settings in dialog, init defaults if that fails.
     * @param settings To load from.
     */
    public void loadSettingsInDialog(final NodeSettingsRO settings) {
        m_label = settings.getString("label", "Label");
        if (m_label == null) {
            m_label = "Label";
        }
        m_description = settings.getString("description", "Enter Description");
        m_weight = settings.getInt("weight", 1);
        // new with 2.7
        m_hideInWizard = settings.getBoolean("hide_in_wizard", false);
    }

}