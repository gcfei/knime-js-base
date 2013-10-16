package org.knime.js.base.node.quickform.input.dbl;

import java.awt.GridBagConstraints;

import javax.swing.JPanel;
import javax.swing.JSpinner;
import javax.swing.SpinnerNumberModel;

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
public class DoubleInputQuickFormNodeDialog extends QuickFormNodeDialog {

    private final JSpinner m_valueSpinner;

    /** Constructors, inits fields calls layout routines. */
    DoubleInputQuickFormNodeDialog() {
        m_valueSpinner =
                new JSpinner(new SpinnerNumberModel(0.0, Double.NEGATIVE_INFINITY, Double.POSITIVE_INFINITY, 0.1));
        createAndAddTab();
    }

    /**
     * {@inheritDoc}
     */
    @Override
    protected final void fillPanel(final JPanel panelWithGBLayout, final GridBagConstraints gbc) {
        addPairToPanel("Double Value: ", m_valueSpinner, panelWithGBLayout, gbc);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    protected void loadSettingsFrom(final NodeSettingsRO settings, final PortObjectSpec[] specs)
            throws NotConfigurableException {
        DoubleInputQuickFormRepresentation representation = new DoubleInputQuickFormRepresentation();
        representation.loadFromNodeSettingsInDialog(settings);
        loadSettingsFrom(representation);
        DoubleInputQuickFormValue value = new DoubleInputQuickFormValue();
        value.loadFromNodeSettingsInDialog(settings);
        m_valueSpinner.setValue(value.getDouble());
    }

    /**
     * {@inheritDoc}
     */
    @Override
    protected void saveSettingsTo(final NodeSettingsWO settings) throws InvalidSettingsException {
        DoubleInputQuickFormRepresentation representation = new DoubleInputQuickFormRepresentation();
        saveSettingsTo(representation);
        representation.saveToNodeSettings(settings);
        DoubleInputQuickFormValue value = new DoubleInputQuickFormValue();
        value.setDouble((Double)m_valueSpinner.getValue());
        value.saveToNodeSettings(settings);
    }

}
