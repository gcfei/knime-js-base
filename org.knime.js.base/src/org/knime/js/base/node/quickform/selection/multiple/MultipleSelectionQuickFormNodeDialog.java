package org.knime.js.base.node.quickform.selection.multiple;

import java.awt.Dimension;
import java.awt.GridBagConstraints;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import javax.swing.JComboBox;
import javax.swing.JList;
import javax.swing.JPanel;
import javax.swing.JScrollPane;
import javax.swing.JTextArea;
import javax.swing.ListModel;
import javax.swing.ListSelectionModel;
import javax.swing.event.DocumentEvent;
import javax.swing.event.DocumentListener;

import org.apache.commons.lang.ArrayUtils;
import org.apache.commons.lang.StringUtils;
import org.knime.core.node.InvalidSettingsException;
import org.knime.core.node.NodeSettingsRO;
import org.knime.core.node.NodeSettingsWO;
import org.knime.core.node.NotConfigurableException;
import org.knime.core.node.port.PortObjectSpec;
import org.knime.js.base.node.quickform.QuickFormNodeDialog;

/**
 * @author Patrick Winter, KNIME.com, Zurich, Switzerland
 */
public class MultipleSelectionQuickFormNodeDialog extends QuickFormNodeDialog {

    private final JList<String> m_defaultField;

    private final JList<String> m_valueField;

    private final JTextArea m_possibleChoicesField;

    private final JComboBox<String> m_type;

    /**
     * Constructors, inits fields calls layout routines.
     */
    MultipleSelectionQuickFormNodeDialog() {
        m_defaultField = new JList<String>();
        m_defaultField.setSelectionMode(ListSelectionModel.MULTIPLE_INTERVAL_SELECTION);
        m_valueField = new JList<String>();
        m_valueField.setSelectionMode(ListSelectionModel.MULTIPLE_INTERVAL_SELECTION);
        m_possibleChoicesField = new JTextArea();
        m_possibleChoicesField.getDocument().addDocumentListener(new DocumentListener() {
            @Override
            public void removeUpdate(final DocumentEvent e) {
                refreshChoices();
            }
            @Override
            public void insertUpdate(final DocumentEvent e) {
                refreshChoices();
            }
            @Override
            public void changedUpdate(final DocumentEvent e) {
                refreshChoices();
            }
        });
        m_type = new JComboBox<String>(MultipleSelectionType.getAllTypes());
        createAndAddTab();
    }

    /**
     * {@inheritDoc}
     */
    @Override
    protected final void fillPanel(final JPanel panelWithGBLayout, final GridBagConstraints gbc) {
        Dimension prefSize = new Dimension(DEF_TEXTFIELD_WIDTH, 70);
        JScrollPane defaultPane = new JScrollPane(m_defaultField);
        defaultPane.setPreferredSize(prefSize);
        addPairToPanel("Default Variable Values: ", defaultPane, panelWithGBLayout, gbc);
        JScrollPane valuePane = new JScrollPane(m_valueField);
        valuePane.setPreferredSize(prefSize);
        addPairToPanel("Variable Values: ", valuePane, panelWithGBLayout, gbc);
        GridBagConstraints gbc2 = (GridBagConstraints)gbc.clone();
        gbc2.fill = GridBagConstraints.BOTH;
        gbc2.weighty = 1;
        JScrollPane choicesPane = new JScrollPane(m_possibleChoicesField);
        choicesPane.setPreferredSize(prefSize);
        addPairToPanel("Possible Choices: ", choicesPane, panelWithGBLayout, gbc2);
        addPairToPanel("Selection Type: ", m_type, panelWithGBLayout, gbc);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    protected void loadSettingsFrom(final NodeSettingsRO settings, final PortObjectSpec[] specs)
            throws NotConfigurableException {
        MultipleSelectionQuickFormRepresentation representation = new MultipleSelectionQuickFormRepresentation();
        representation.loadFromNodeSettingsInDialog(settings);
        loadSettingsFrom(representation);
        m_possibleChoicesField.setText(representation.getPossibleChoices().replace(",", "\n"));
        m_type.setSelectedItem(representation.getType());
        MultipleSelectionQuickFormValue value = new MultipleSelectionQuickFormValue();
        value.loadFromNodeSettingsInDialog(settings);
        setSelections(m_defaultField, Arrays.asList(representation.getDefaultValue().split(",")));
        setSelections(m_valueField, Arrays.asList(value.getVariableValue().split(",")));
    }

    /**
     * {@inheritDoc}
     */
    @Override
    protected void saveSettingsTo(final NodeSettingsWO settings) throws InvalidSettingsException {
        MultipleSelectionQuickFormRepresentation representation = new MultipleSelectionQuickFormRepresentation();
        saveSettingsTo(representation);
        representation.setDefaultValue(StringUtils.join(m_defaultField.getSelectedValuesList(), ","));
        representation.setPossibleChoices(m_possibleChoicesField.getText().replace("\n", ","));
        representation.setType(m_type.getItemAt(m_type.getSelectedIndex()));
        representation.saveToNodeSettings(settings);
        MultipleSelectionQuickFormValue value = new MultipleSelectionQuickFormValue();
        value.setVariableValue(StringUtils.join(m_valueField.getSelectedValuesList(), ","));
        value.saveToNodeSettings(settings);
    }
    
    /**
     * Refreshes the default and value fields based on changes in the current
     * choices, while keeping the selection.
     */
    private void refreshChoices() {
        refreshChoices(m_defaultField);
        refreshChoices(m_valueField);
    }

    /**
     * Refreshes the given list based on changes in the current
     * choices, while keeping the selection.
     * 
     * @param list The list that will be refreshed
     */
    private void refreshChoices(final JList<String> list) {
        List<String> selections = list.getSelectedValuesList();
        list.setListData(m_possibleChoicesField.getText().split("\n"));
        setSelections(list, selections);
    }
    
    /**
     * Sets the selections in the given list to the given selections.
     * 
     * @param list The list where the selections will be applied
     * @param selections The new selections
     */
    private void setSelections(final JList<String> list, final List<String> selections) {
        List<Integer> indices = new ArrayList<Integer>(selections.size());
        ListModel<String> model = list.getModel();
        for (int i = 0; i < model.getSize(); i++) {
            if (selections.contains(model.getElementAt(i))) {
                indices.add(i);
            }
        }
        list.setSelectedIndices(ArrayUtils.toPrimitive(indices.toArray(new Integer[indices.size()])));
    }

}
