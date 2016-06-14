/*
 * ------------------------------------------------------------------------
 *
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
 * ---------------------------------------------------------------------
 *
 * History
 *   Apr 28, 2016 (albrecht): created
 */
package org.knime.js.base.node.viz.pagedTable;

import java.awt.Dimension;
import java.awt.GridBagConstraints;
import java.awt.GridBagLayout;
import java.awt.Insets;
import java.util.LinkedHashSet;

import javax.swing.JCheckBox;
import javax.swing.JLabel;
import javax.swing.JPanel;
import javax.swing.JSpinner;
import javax.swing.JTextField;
import javax.swing.SpinnerNumberModel;
import javax.swing.border.TitledBorder;
import javax.swing.event.ChangeEvent;
import javax.swing.event.ChangeListener;

import org.knime.core.data.DataTableSpec;
import org.knime.core.node.InvalidSettingsException;
import org.knime.core.node.NodeDialogPane;
import org.knime.core.node.NodeSettingsRO;
import org.knime.core.node.NodeSettingsWO;
import org.knime.core.node.NotConfigurableException;
import org.knime.core.node.defaultnodesettings.DialogComponentStringSelection;
import org.knime.core.node.defaultnodesettings.SettingsModelString;
import org.knime.core.node.port.PortObjectSpec;
import org.knime.core.node.util.StringHistory;
import org.knime.core.node.util.filter.column.DataColumnSpecFilterConfiguration;
import org.knime.core.node.util.filter.column.DataColumnSpecFilterPanel;

/**
 *
 * @author Christian Albrecht, KNIME.com GmbH, Konstanz, Germany
 */
public class PagedTableViewNodeDialogPane extends NodeDialogPane {

    /**
     * Key for the string history to re-use user entered date formats.
     */
    public static final String FORMAT_HISTORY_KEY = "momentjs-date-formats";
    /** Set of predefined date and time formats for JavaScript processing with moment.js. */
    public static final LinkedHashSet<String> PREDEFINED_FORMATS = createPredefinedFormats();
    private static final int TEXT_FIELD_SIZE = 20;

    private final JCheckBox m_hideInWizardCheckBox;
    private final JSpinner m_maxRowsSpinner;
    private final JCheckBox m_enablePagingCheckBox;
    private final JSpinner m_initialPageSizeSpinner;
    private final JTextField m_allowedPageSizesField;
    private final JCheckBox m_enableShowAllCheckBox;
    private final JCheckBox m_enableJumpToPageCheckBox;
    private final JCheckBox m_displayRowColorsCheckBox;
    private final JCheckBox m_displayRowIdsCheckBox;
    private final JCheckBox m_displayColumnHeadersCheckBox;
    private final JCheckBox m_displayRowIndexCheckBox;
    private final JTextField m_titleField;
    private final JTextField m_subtitleField;
    private final DataColumnSpecFilterPanel m_columnFilterPanel;
    private final JCheckBox m_enableSelectionCheckbox;
    private final JTextField m_selectionColumnNameField;
    private final JCheckBox m_enableSearchCheckbox;
    private final JCheckBox m_enableColumnSearchCheckbox;
    private final JCheckBox m_enableSortingCheckBox;
    private final DialogComponentStringSelection m_globalDateFormatChooser;
    private final JCheckBox m_enableGlobalNumberFormatCheckbox;
    private final JSpinner m_globalNumberFormatDecimalSpinner;

    PagedTableViewNodeDialogPane() {
        m_hideInWizardCheckBox = new JCheckBox("Hide in wizard");
        m_maxRowsSpinner = new JSpinner(new SpinnerNumberModel(0, 0, null, 1));
        m_enablePagingCheckBox = new JCheckBox("Enable pagination");
        m_enablePagingCheckBox.addChangeListener(new ChangeListener() {
            @Override
            public void stateChanged(final ChangeEvent e) {
                enablePagingFields();
            }
        });
        m_initialPageSizeSpinner = new JSpinner(new SpinnerNumberModel(1, 1, null, 1));
        m_allowedPageSizesField = new JTextField(20);
        m_enableShowAllCheckBox = new JCheckBox("Add \"All\" option to page sizes");
        m_enableJumpToPageCheckBox = new JCheckBox("Display field to jump to a page directly");
        m_displayRowColorsCheckBox = new JCheckBox("Display row colors");
        m_displayRowIdsCheckBox = new JCheckBox("Display row keys");
        m_displayColumnHeadersCheckBox = new JCheckBox("Display column headers");
        m_displayColumnHeadersCheckBox.addChangeListener(new ChangeListener() {

            @Override
            public void stateChanged(final ChangeEvent e) {
                enableColumnHeaderFields();
            }
        });
        m_displayRowIndexCheckBox = new JCheckBox("Dislay row indices");
        m_titleField = new JTextField(TEXT_FIELD_SIZE);
        m_subtitleField = new JTextField(TEXT_FIELD_SIZE);
        m_columnFilterPanel = new DataColumnSpecFilterPanel();
        m_enableSelectionCheckbox = new JCheckBox("Enable selection");
        m_enableSelectionCheckbox.addChangeListener(new ChangeListener() {
            @Override
            public void stateChanged(final ChangeEvent e) {
                enableSelectionFields();
            }
        });
        m_selectionColumnNameField = new JTextField(TEXT_FIELD_SIZE);
        m_enableSearchCheckbox = new JCheckBox("Enable searching");
        m_enableColumnSearchCheckbox = new JCheckBox("Enable search for individual columns");
        m_enableSortingCheckBox = new JCheckBox("Enable sorting on columns");
        m_globalDateFormatChooser =
            new DialogComponentStringSelection(new SettingsModelString(PagedTableViewConfig.CFG_GLOBAL_DATE_FORMAT,
                PagedTableViewConfig.DEFAULT_GLOBAL_DATE_FORMAT), "Global date format:", PREDEFINED_FORMATS, true);
        m_enableGlobalNumberFormatCheckbox = new JCheckBox("Enable global number format");
        m_enableGlobalNumberFormatCheckbox.addChangeListener(new ChangeListener() {
            @Override
            public void stateChanged(final ChangeEvent e) {
                enableFormatterFields();
            }
        });
        m_globalNumberFormatDecimalSpinner = new JSpinner(new SpinnerNumberModel(2, 0, null, 1));
        addTab("Options", initOptions());
        addTab("Interactivity", initInteractivity());
        addTab("Formatters", initFormatters());
    }

    /**
     * @return
     */
    private JPanel initOptions() {
        JPanel generalPanel = new JPanel(new GridBagLayout());
        generalPanel.setBorder(new TitledBorder("General Options"));
        GridBagConstraints gbcG = createConfiguredGridBagConstraints();
        gbcG.gridwidth = 2;
        gbcG.fill = GridBagConstraints.HORIZONTAL;
        generalPanel.add(m_hideInWizardCheckBox, gbcG);
        gbcG.gridy++;
        gbcG.gridwidth = 1;
        generalPanel.add(new JLabel("No. of rows to display: "), gbcG);
        gbcG.gridx++;
        m_maxRowsSpinner.setPreferredSize(new Dimension(100, TEXT_FIELD_SIZE));
        generalPanel.add(m_maxRowsSpinner, gbcG);

        JPanel titlePanel = new JPanel(new GridBagLayout());
        titlePanel.setBorder(new TitledBorder("Titles"));
        GridBagConstraints gbcT = createConfiguredGridBagConstraints();
        titlePanel.add(new JLabel("Title: "), gbcT);
        gbcT.gridx++;
        titlePanel.add(m_titleField, gbcT);
        gbcT.gridx = 0;
        gbcT.gridy++;
        titlePanel.add(new JLabel("Subtitle: "), gbcT);
        gbcT.gridx++;
        titlePanel.add(m_subtitleField, gbcT);

        JPanel displayPanel = new JPanel(new GridBagLayout());
        displayPanel.setBorder(new TitledBorder("Display Options"));
        GridBagConstraints gbcD = createConfiguredGridBagConstraints();
        gbcD.gridwidth = 1;
        gbcD.gridx = 0;
        displayPanel.add(m_displayRowColorsCheckBox, gbcD);
        gbcD.gridx++;
        displayPanel.add(m_displayRowIdsCheckBox, gbcD);
        gbcD.gridx = 0;
        gbcD.gridy++;
        displayPanel.add(m_displayRowIndexCheckBox, gbcD);
        gbcD.gridx++;
        displayPanel.add(m_displayColumnHeadersCheckBox, gbcD);
        gbcD.gridx = 0;
        gbcD.gridy++;
        displayPanel.add(new JLabel("Columns to display: "), gbcD);
        gbcD.gridy++;
        gbcD.gridwidth = 4;
        displayPanel.add(m_columnFilterPanel, gbcD);

        JPanel panel = new JPanel(new GridBagLayout());
        GridBagConstraints gbc = createConfiguredGridBagConstraints();
        gbc.fill = GridBagConstraints.HORIZONTAL;
        panel.add(generalPanel, gbc);
        gbc.gridy++;
        panel.add(titlePanel, gbc);
        gbc.gridy++;
        panel.add(displayPanel, gbc);
        return panel;
    }

    private JPanel initInteractivity() {
        JPanel pagingPanel = new JPanel(new GridBagLayout());
        pagingPanel.setBorder(new TitledBorder("Paging"));
        GridBagConstraints gbcP = createConfiguredGridBagConstraints();
        gbcP.gridwidth = 2;
        pagingPanel.add(m_enablePagingCheckBox, gbcP);
        gbcP.gridy++;
        gbcP.gridwidth = 1;
        pagingPanel.add(new JLabel("Initial page size: "), gbcP);
        gbcP.gridx++;
        m_initialPageSizeSpinner.setPreferredSize(new Dimension(100, TEXT_FIELD_SIZE));
        pagingPanel.add(m_initialPageSizeSpinner, gbcP);
        gbcP.gridx = 0;
        gbcP.gridy++;
        pagingPanel.add(new JLabel("Selectable page sizes: "), gbcP);
        gbcP.gridx++;
        pagingPanel.add(m_allowedPageSizesField, gbcP);
        gbcP.gridx = 0;
        gbcP.gridy++;
        gbcP.gridwidth = 2;
        pagingPanel.add(m_enableShowAllCheckBox, gbcP);
        gbcP.gridy++;
        pagingPanel.add(m_enableJumpToPageCheckBox, gbcP);

        JPanel selectionPanel = new JPanel(new GridBagLayout());
        selectionPanel.setBorder(new TitledBorder("Selection"));
        GridBagConstraints gbcS = createConfiguredGridBagConstraints();
        gbcS.gridwidth = 2;
        selectionPanel.add(m_enableSelectionCheckbox, gbcS);
        gbcS.gridy++;
        gbcS.gridwidth = 1;
        selectionPanel.add(new JLabel("Selection column name: "), gbcS);
        gbcS.gridx++;
        selectionPanel.add(m_selectionColumnNameField, gbcS);

        JPanel searchPanel = new JPanel(new GridBagLayout());
        searchPanel.setBorder(new TitledBorder("Searching"));
        GridBagConstraints gbcSe = createConfiguredGridBagConstraints();
        searchPanel.add(m_enableSearchCheckbox, gbcSe);
        gbcSe.gridy++;
        searchPanel.add(m_enableColumnSearchCheckbox, gbcSe);

        JPanel sortingPanel = new JPanel(new GridBagLayout());
        sortingPanel.setBorder(new TitledBorder("Sorting"));
        GridBagConstraints gbcSo = createConfiguredGridBagConstraints();
        sortingPanel.add(m_enableSortingCheckBox, gbcSo);

        JPanel panel = new JPanel(new GridBagLayout());
        GridBagConstraints gbc = createConfiguredGridBagConstraints();
        gbc.fill = GridBagConstraints.HORIZONTAL;
        panel.add(pagingPanel, gbc);
        gbc.gridy++;
        panel.add(selectionPanel, gbc);
        gbc.gridy++;
        panel.add(searchPanel, gbc);
        gbc.gridy++;
        panel.add(sortingPanel, gbc);
        return panel;
    }

    private JPanel initFormatters() {
        JPanel datePanel = new JPanel(new GridBagLayout());
        datePanel.setBorder(new TitledBorder("Date Formatter"));
        GridBagConstraints gbcD = createConfiguredGridBagConstraints();
        datePanel.add(m_globalDateFormatChooser.getComponentPanel(), gbcD);

        JPanel numberPanel = new JPanel(new GridBagLayout());
        numberPanel.setBorder(new TitledBorder("Number Formatter"));
        GridBagConstraints gbcN = createConfiguredGridBagConstraints();
        gbcN.gridwidth = 2;
        numberPanel.add(m_enableGlobalNumberFormatCheckbox, gbcN);
        gbcN.gridy++;
        gbcN.gridwidth = 1;
        numberPanel.add(new JLabel("Decimal places: "), gbcN);
        gbcN.gridx++;
        m_globalNumberFormatDecimalSpinner.setPreferredSize(new Dimension(100, TEXT_FIELD_SIZE));
        numberPanel.add(m_globalNumberFormatDecimalSpinner, gbcN);

        JPanel panel = new JPanel(new GridBagLayout());
        GridBagConstraints gbc = createConfiguredGridBagConstraints();
        gbc.fill = GridBagConstraints.HORIZONTAL;
        panel.add(datePanel, gbc);
        gbc.gridy++;
        panel.add(numberPanel, gbc);
        return panel;
    }

    private GridBagConstraints createConfiguredGridBagConstraints() {
        GridBagConstraints gbc = new GridBagConstraints();
        gbc.insets = new Insets(5, 5, 5, 5);
        gbc.anchor = GridBagConstraints.NORTHWEST;
        gbc.gridx = 0;
        gbc.gridy = 0;
        return gbc;
    }

    /**
     * {@inheritDoc}
     */
    @Override
    protected void loadSettingsFrom(final NodeSettingsRO settings, final PortObjectSpec[] specs) throws NotConfigurableException {
        PagedTableViewConfig config = new PagedTableViewConfig();
        config.loadSettingsForDialog(settings, (DataTableSpec)specs[0]);
        m_hideInWizardCheckBox.setSelected(config.getHideInWizard());
        m_maxRowsSpinner.setValue(config.getMaxRows());
        m_enablePagingCheckBox.setSelected(config.getEnablePaging());
        m_initialPageSizeSpinner.setValue(config.getIntialPageSize());
        m_allowedPageSizesField.setText(getAllowedPageSizesString(config.getAllowedPageSizes()));
        m_enableShowAllCheckBox.setSelected(config.getPageSizeShowAll());
        m_enableJumpToPageCheckBox.setSelected(config.getEnableJumpToPage());
        m_displayRowColorsCheckBox.setSelected(config.getDisplayRowColors());
        m_displayRowIdsCheckBox.setSelected(config.getDisplayRowIds());
        m_displayColumnHeadersCheckBox.setSelected(config.getDisplayColumnHeaders());
        m_displayRowIndexCheckBox.setSelected(config.getDisplayRowIndex());
        m_titleField.setText(config.getTitle());
        m_subtitleField.setText(config.getSubtitle());
        m_columnFilterPanel.loadConfiguration(config.getColumnFilterConfig(), (DataTableSpec)specs[0]);
        m_enableSelectionCheckbox.setSelected(config.getEnableSelection());
        m_selectionColumnNameField.setText(config.getSelectionColumnName());
        m_enableSearchCheckbox.setSelected(config.getEnableSearching());
        m_enableColumnSearchCheckbox.setSelected(config.getEnableColumnSearching());
        m_enableSortingCheckBox.setSelected(config.getEnableSorting());
        m_globalDateFormatChooser.replaceListItems(createPredefinedFormats(), config.getGlobalDateFormat());
        m_enableGlobalNumberFormatCheckbox.setSelected(config.getEnableGlobalNumberFormat());
        m_globalNumberFormatDecimalSpinner.setValue(config.getGlobalNumberFormatDecimals());
        enablePagingFields();
        enableSelectionFields();
        enableFormatterFields();
        enableColumnHeaderFields();
    }

    /**
     * {@inheritDoc}
     */
    @Override
    protected void saveSettingsTo(final NodeSettingsWO settings) throws InvalidSettingsException {
        PagedTableViewConfig config = new PagedTableViewConfig();
        config.setHideInWizard(m_hideInWizardCheckBox.isSelected());
        config.setMaxRows((Integer)m_maxRowsSpinner.getValue());
        config.setEnablePaging(m_enablePagingCheckBox.isSelected());
        config.setIntialPageSize((Integer)m_initialPageSizeSpinner.getValue());
        config.setAllowedPageSizes(getAllowedPageSizes());
        config.setPageSizeShowAll(m_enableShowAllCheckBox.isSelected());
        config.setEnableJumpToPage(m_enableJumpToPageCheckBox.isSelected());
        config.setDisplayRowColors(m_displayRowColorsCheckBox.isSelected());
        config.setDisplayRowIds(m_displayRowIdsCheckBox.isSelected());
        config.setDisplayColumnHeaders(m_displayColumnHeadersCheckBox.isSelected());
        config.setDisplayRowIndex(m_displayRowIndexCheckBox.isSelected());
        config.setTitle(m_titleField.getText());
        config.setSubtitle(m_subtitleField.getText());
        DataColumnSpecFilterConfiguration filterConfig = new DataColumnSpecFilterConfiguration(PagedTableViewConfig.CFG_COLUMN_FILTER);
        m_columnFilterPanel.saveConfiguration(filterConfig);
        config.setColumnFilterConfig(filterConfig);
        config.setEnableSelection(m_enableSelectionCheckbox.isSelected());
        config.setSelectionColumnName(m_selectionColumnNameField.getText());
        config.setEnableSorting(m_enableSortingCheckBox.isSelected());
        config.setEnableSearching(m_enableSearchCheckbox.isSelected());
        config.setEnableColumnSearching(m_enableColumnSearchCheckbox.isSelected());
        config.setGlobalDateFormat(((SettingsModelString)m_globalDateFormatChooser.getModel()).getStringValue());
        config.setEnableGlobalNumberFormat(m_enableGlobalNumberFormatCheckbox.isSelected());
        config.setGlobalNumberFormatDecimals((Integer)m_globalNumberFormatDecimalSpinner.getValue());
        config.saveSettings(settings);
    }

    private String getAllowedPageSizesString(final int[] sizes) {
        if (sizes.length < 1) {
            return "";
        }
        StringBuilder builder = new StringBuilder(String.valueOf(sizes[0]));
        for (int i = 1; i < sizes.length; i++) {
            builder.append(", ");
            builder.append(sizes[i]);
        }
        return builder.toString();
    }

    /**
     * @return
     */
    private int[] getAllowedPageSizes() throws InvalidSettingsException {
        String[] sizesArray = m_allowedPageSizesField.getText().split(",");
        int[] allowedPageSizes = new int[sizesArray.length];
        try {
            for (int i = 0; i < sizesArray.length; i++) {
                allowedPageSizes[i] = Integer.parseInt(sizesArray[i].trim());
            }
        } catch (NumberFormatException e) {
            throw new InvalidSettingsException(e.getMessage(), e);
        }
        return allowedPageSizes;
    }

    private void enablePagingFields() {
        boolean enable = m_enablePagingCheckBox.isSelected();
        m_initialPageSizeSpinner.setEnabled(enable);
        m_allowedPageSizesField.setEnabled(enable);
        m_enableShowAllCheckBox.setEnabled(enable);
        m_enableJumpToPageCheckBox.setEnabled(enable);
    }

    private void enableSelectionFields() {
        boolean enable = m_enableSelectionCheckbox.isSelected();
        m_selectionColumnNameField.setEnabled(enable);
    }

    private void enableFormatterFields() {
        boolean enableNumberFormat = m_enableGlobalNumberFormatCheckbox.isSelected();
        m_globalNumberFormatDecimalSpinner.setEnabled(enableNumberFormat);
    }

    private void enableColumnHeaderFields() {
        boolean enableFields = m_displayColumnHeadersCheckBox.isSelected();
        m_enableSortingCheckBox.setEnabled(enableFields);
    }

    /**
     * @return a list of predefined formats for use in a date format with moment.js
     */
    public static LinkedHashSet<String> createPredefinedFormats() {
        LinkedHashSet<String> formats = new LinkedHashSet<String>();
        formats.add("YYYY-MM-DD");
        formats.add("ddd MMM DD YYYY HH:mm:ss");
        formats.add("M/D/YY");
        formats.add("MMM D, YYYY");
        formats.add("MMMM D, YYYY");
        formats.add("dddd, MMM D, YYYY");
        formats.add("h:mm A");
        formats.add("h:mm:ss A");
        formats.add("HH:mm:ss");
        formats.add("YYYY-MM-DD;HH:mm:ss.SSS");
        // check also the StringHistory....
        String[] userFormats = StringHistory.getInstance(FORMAT_HISTORY_KEY).getHistory();
        for (String userFormat : userFormats) {
            formats.add(userFormat);
        }
        return formats;
    }
}