/*
 * ------------------------------------------------------------------------
 *
 *  Copyright (C) 2003 - 2013
 *  University of Konstanz, Germany and
 *  KNIME GmbH, Konstanz, Germany
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
 *  propagated with or for interoperation with KNIME. The owner of a Node
 *  may freely choose the license terms applicable to such Node, including
 *  when such Node is propagated with or for interoperation with KNIME.
 * ------------------------------------------------------------------------
 *
 * History
 *   13.05.2014 (Christian Albrecht, KNIME.com AG, Zurich, Switzerland): created
 */
package org.knime.js.base.node.viz.plotter.scatterSelectionAppender;

import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;

import org.apache.commons.lang.StringUtils;
import org.knime.base.data.xml.SvgCell;
import org.knime.base.data.xml.SvgImageContent;
import org.knime.core.data.DataCell;
import org.knime.core.data.DataColumnSpec;
import org.knime.core.data.DataColumnSpecCreator;
import org.knime.core.data.DataRow;
import org.knime.core.data.DataTableSpec;
import org.knime.core.data.DataType;
import org.knime.core.data.DoubleValue;
import org.knime.core.data.RowKey;
import org.knime.core.data.StringValue;
import org.knime.core.data.container.CellFactory;
import org.knime.core.data.container.CloseableRowIterator;
import org.knime.core.data.container.ColumnRearranger;
import org.knime.core.data.container.SingleCellFactory;
import org.knime.core.data.def.BooleanCell;
import org.knime.core.node.BufferedDataTable;
import org.knime.core.node.CanceledExecutionException;
import org.knime.core.node.ExecutionContext;
import org.knime.core.node.ExecutionMonitor;
import org.knime.core.node.InvalidSettingsException;
import org.knime.core.node.NodeLogger;
import org.knime.core.node.NodeModel;
import org.knime.core.node.NodeSettings;
import org.knime.core.node.NodeSettingsRO;
import org.knime.core.node.NodeSettingsWO;
import org.knime.core.node.port.PortObject;
import org.knime.core.node.port.PortObjectSpec;
import org.knime.core.node.port.PortType;
import org.knime.core.node.port.image.ImagePortObject;
import org.knime.core.node.port.image.ImagePortObjectSpec;
import org.knime.core.node.web.ValidationError;
import org.knime.core.node.wizard.WizardNode;
import org.knime.js.core.JSONDataTable;
import org.knime.js.core.JSONDataTable.JSONDataTableRow;
import org.knime.js.core.JSONDataTableSpec;
import org.knime.js.core.datasets.JSONKeyedValues2DDataset;
import org.knime.js.core.datasets.JSONKeyedValuesRow;

/**
 *
 * @author Christian Albrecht, KNIME.com AG, Zurich, Switzerland, University of Konstanz
 */
final class ScatterPlotNodeModel extends NodeModel implements
    WizardNode<ScatterPlotViewRepresentation, ScatterPlotViewValue> {

    private static final NodeLogger LOGGER = NodeLogger.getLogger(ScatterPlotNodeModel.class);

    private final Object m_lock = new Object();
    private final ScatterPlotViewConfig m_config;
    private BufferedDataTable m_table;
    private ScatterPlotViewRepresentation m_representation;
    private ScatterPlotViewValue m_viewValue;

    /**
     * Creates a new model instance.
     */
    ScatterPlotNodeModel() {
        super(new PortType[]{BufferedDataTable.TYPE}, new PortType[]{ImagePortObject.TYPE, BufferedDataTable.TYPE});
        m_config = new ScatterPlotViewConfig();
        m_representation = createEmptyViewRepresentation();
        m_viewValue = createEmptyViewValue();
    }

    /**
     * {@inheritDoc}
     */
    @Override
    protected PortObjectSpec[] configure(final PortObjectSpec[] inSpecs) throws InvalidSettingsException {
        List<String> allAllowedCols = new LinkedList<String>();

        DataTableSpec tableSpec = (DataTableSpec)inSpecs[0];

        for (DataColumnSpec colspec : tableSpec) {
            if (colspec.getType().isCompatible(DoubleValue.class)
                    || colspec.getType().isCompatible(StringValue.class)) {
                allAllowedCols.add(colspec.getName());
            }
        }

        if (tableSpec.getNumColumns() < 1
                || allAllowedCols.size() < 1) {
            throw new InvalidSettingsException("Data table must have"
                    + " at least one numerical or categorical column.");
        }

        ColumnRearranger rearranger = createColumnAppender(tableSpec, null);
        DataTableSpec out = rearranger.createSpec();

        ImagePortObjectSpec imageSpec = new ImagePortObjectSpec(SvgCell.TYPE);
        return new PortObjectSpec[]{imageSpec, out};
    }

    /**
     * {@inheritDoc}
     */
    @Override
    protected PortObject[] execute(final PortObject[] inData, final ExecutionContext exec)
            throws Exception {
        List<RowKey> selectionList = null;
        synchronized (m_lock) {
            m_table = (BufferedDataTable)inData[0];
            String xColumn = m_viewValue.getxColumn();
            if (m_representation.getKeyedDataset() == null || xColumn == null) {
                // create dataset for view
                copyConfigToView();
                m_representation.setKeyedDataset(createKeyedDataset(exec));
            }
            if (m_viewValue.getSelection() != null && m_viewValue.getSelection().length > 0) {
                // handle view selection
                List<String> selections = Arrays.asList(m_viewValue.getSelection());
                selectionList = new ArrayList<RowKey>();
                CloseableRowIterator iterator = m_table.iterator();
                try {
                    while (iterator.hasNext()) {
                        DataRow row = iterator.next();
                        if (selections.contains(row.getKey().getString())) {
                            selectionList.add(row.getKey());
                        }
                    }
                } finally {
                    iterator.close();
                }
            }
        }
        ColumnRearranger rearranger = createColumnAppender(m_table.getDataTableSpec(), selectionList);
        BufferedDataTable out = exec.createColumnRearrangeTable(m_table, rearranger, exec);
        exec.setProgress(1);

        String svgPrimer = "<?xml version=\"1.0\" encoding=\"utf-8\"?><!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 1.0//EN\" \"http://www.w3.org/TR/2001/REC-SVG-20010904/DTD/svg10.dtd\">";
        String svg = m_viewValue.getImage();
        if (svg == null || svg.isEmpty()) {
            svg = "<svg width=\"1px\" height=\"1px\"></svg>";
        }
        svg = svgPrimer + svg;
        InputStream is = new ByteArrayInputStream(svg.getBytes());
        ImagePortObjectSpec imageSpec = new ImagePortObjectSpec(SvgCell.TYPE);
        PortObject imagePort = new ImagePortObject(new SvgImageContent(is), imageSpec);
        return new PortObject[]{imagePort, out};
    }



    private ColumnRearranger createColumnAppender(final DataTableSpec spec, final List<RowKey> selectionList) {
        String newColName = "Selected (Scatter Plot)";
        DataColumnSpec outColumnSpec =
                new DataColumnSpecCreator(newColName, DataType.getType(BooleanCell.class)).createSpec();
        ColumnRearranger rearranger = new ColumnRearranger(spec);
        CellFactory fac = new SingleCellFactory(outColumnSpec) {
            @Override
            public DataCell getCell(final DataRow row) {
                if (selectionList != null && selectionList.contains(row.getKey())) {
                    return BooleanCell.TRUE;
                } else {
                    return BooleanCell.FALSE;
                }
            }
        };
        rearranger.append(fac);
        return rearranger;
    }

    private JSONKeyedValues2DDataset createKeyedDataset(final ExecutionContext exec) throws CanceledExecutionException {
        ColumnRearranger c = createNumericColumnRearranger(m_table.getDataTableSpec());
        BufferedDataTable filteredTable =
            exec.createColumnRearrangeTable(m_table, c, exec.createSubProgress(0.1));
        exec.setProgress(0.1);
        //construct dataset
        if (m_config.getMaxRows() < filteredTable.getRowCount()) {
            setWarningMessage("Only the first " + m_config.getMaxRows() + " rows are displayed.");
        }
        final JSONDataTable table =
            new JSONDataTable(filteredTable, 1, m_config.getMaxRows(), exec.createSubProgress(0.8));
        exec.setProgress(0.9);
        ExecutionMonitor datasetExecutionMonitor = exec.createSubProgress(0.1);
        final JSONDataTableSpec tableSpec = table.getSpec();
        int numColumns = tableSpec.getNumColumns();
        String[] rowKeys = new String[tableSpec.getNumRows()];
        JSONKeyedValuesRow[] rowValues = new JSONKeyedValuesRow[tableSpec.getNumRows()];
        JSONDataTableRow[] tableRows = table.getRows();
        for (int rowID = 0; rowID < rowValues.length; rowID++) {
            JSONDataTableRow currentRow = tableRows[rowID];
            rowKeys[rowID] = currentRow.getRowKey();
            double[] rowData = new double[numColumns];
            Object[] tableData = currentRow.getData();
            for (int colID = 0; colID < numColumns; colID++) {
                if (tableData[colID] instanceof Double) {
                    rowData[colID] = (double)tableData[colID];
                } else if (tableData[colID] instanceof String) {
                    rowData[colID] = getOrdinalFromStringValue((String)tableData[colID], table, colID);
                }
            }
            rowValues[rowID] = new JSONKeyedValuesRow(currentRow.getRowKey(), rowData);
            rowValues[rowID].setColor(tableSpec.getRowColorValues()[rowID]);
            datasetExecutionMonitor.setProgress(((double)rowID) / rowValues.length,
                "Creating dataset, processing row " + rowID + " of " + rowValues.length + ".");
        }

        JSONKeyedValues2DDataset dataset =
            new JSONKeyedValues2DDataset(tableSpec.getColNames(), rowValues);
        for (int col = 0; col < tableSpec.getNumColumns(); col++) {
            if (tableSpec.getColTypes()[col] == "string"
                && tableSpec.getPossibleValues().get(col) != null) {
                dataset.setSymbol(getSymbolMap(tableSpec.getPossibleValues().get(col)), col);
            }
        }

        final String xColumn = m_viewValue.getxColumn();
        if (StringUtils.isEmpty(xColumn) || !Arrays.asList(tableSpec.getColNames()).contains(xColumn)) {
            m_viewValue.setxColumn(tableSpec.getColNames()[0]);
        }
        final String yColumn = m_viewValue.getyColumn();
        if (StringUtils.isEmpty(yColumn) || !Arrays.asList(tableSpec.getColNames()).contains(yColumn)) {
            m_viewValue.setyColumn(tableSpec.getColNames()[tableSpec.getNumColumns() > 1 ? 1 : 0]);
        }

        return dataset;
    }

    private ColumnRearranger createNumericColumnRearranger(final DataTableSpec in) {
        ColumnRearranger c = new ColumnRearranger(in);
        for (DataColumnSpec colSpec : in) {
            DataType type = colSpec.getType();
            if (!type.isCompatible(DoubleValue.class) && !type.isCompatible(StringValue.class)) {
                c.remove(colSpec.getName());
            }
        }
        return c;
    }

    private int getOrdinalFromStringValue(final String stringValue, final JSONDataTable table, final int colID) {
        LinkedHashSet<Object> possibleValues = table.getSpec().getPossibleValues().get(colID);
        if (possibleValues != null) {
            int ordinal = 0;
            for (Object value : possibleValues) {
                if (value != null && value.equals(stringValue)) {
                    return ordinal;
                }
                ordinal++;
            }
        }
        return -1;
    }

    private Map<String, String> getSymbolMap(final LinkedHashSet<Object> linkedHashSet) {
        Map<String, String> symbolMap = new HashMap<String, String>();
        Integer ordinal = 0;
        for (Object value: linkedHashSet) {
            symbolMap.put(ordinal.toString(), value.toString());
            ordinal++;
        }
        return symbolMap;
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public ValidationError validateViewValue(final ScatterPlotViewValue viewContent) {
        synchronized (m_lock) {
            // validate value
        }
        return null;
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public void loadViewValue(final ScatterPlotViewValue viewValue, final boolean useAsDefault) {
        synchronized (m_lock) {
            m_viewValue = viewValue;
            if (useAsDefault) {
                copyValueToConfig();
            }
        }
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public ScatterPlotViewRepresentation getViewRepresentation() {
        synchronized (m_lock) {
            return m_representation;
        }
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public ScatterPlotViewValue getViewValue() {
        synchronized (m_lock) {
            return m_viewValue;
        }
    }

    private void copyConfigToView() {
        m_representation.setEnableViewConfiguration(m_config.getEnableViewConfiguration());
        m_representation.setEnableTitleChange(m_config.getEnableTitleChange());
        m_representation.setEnableSubtitleChange(m_config.getEnableSubtitleChange());
        m_representation.setEnableXColumnChange(m_config.getEnableXColumnChange());
        m_representation.setEnableYColumnChange(m_config.getEnableYColumnChange());
        m_representation.setEnableXAxisLabelEdit(m_config.getEnableXAxisLabelEdit());
        m_representation.setEnableYAxisLabelEdit(m_config.getEnableYAxisLabelEdit());
        m_representation.setEnableDotSizeChange(m_config.getEnableDotSizeChange());
        m_representation.setEnableZooming(m_config.getEnableZooming());
        m_representation.setEnableDragZooming(m_config.getEnableDragZooming());
        m_representation.setEnablePanning(m_config.getEnablePanning());
        m_representation.setShowZoomResetButton(m_config.getShowZoomResetButton());

        m_viewValue.setChartTitle(m_config.getChartTitle());
        m_viewValue.setChartSubtitle(m_config.getChartSubtitle());
        m_viewValue.setxColumn(m_config.getxColumn());
        m_viewValue.setyColumn(m_config.getyColumn());
        m_viewValue.setxAxisLabel(m_config.getxAxisLabel());
        m_viewValue.setyAxisLabel(m_config.getyAxisLabel());
        m_viewValue.setxAxisMin(m_config.getxAxisMin());
        m_viewValue.setxAxisMax(m_config.getxAxisMax());
        m_viewValue.setyAxisMin(m_config.getyAxisMin());
        m_viewValue.setyAxisMax(m_config.getyAxisMax());
        m_viewValue.setDotSize(m_config.getDotSize());
    }

    private void copyValueToConfig() {
        m_config.setChartTitle(m_viewValue.getChartTitle());
        m_config.setChartSubtitle(m_viewValue.getChartSubtitle());
        m_config.setxColumn(m_viewValue.getxColumn());
        m_config.setyColumn(m_viewValue.getyColumn());
        m_config.setxAxisLabel(m_viewValue.getxAxisLabel());
        m_config.setyAxisLabel(m_viewValue.getyAxisLabel());
        m_config.setxAxisMin(m_viewValue.getxAxisMin());
        m_config.setxAxisMax(m_viewValue.getxAxisMax());
        m_config.setyAxisMin(m_viewValue.getyAxisMin());
        m_config.setyAxisMax(m_viewValue.getyAxisMax());
        m_config.setDotSize(m_viewValue.getDotSize());
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public ScatterPlotViewRepresentation createEmptyViewRepresentation() {
        return new ScatterPlotViewRepresentation();
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public ScatterPlotViewValue createEmptyViewValue() {
        return new ScatterPlotViewValue();
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public String getJavascriptObjectID() {
        return "org.knime.js.base.node.viz.plotter.scatterSelectionAppender";
    }

    /**
     * {@inheritDoc}
     */
    @Override
    protected void loadInternals(final File nodeInternDir, final ExecutionMonitor exec) throws IOException,
        CanceledExecutionException {
        File repFile = new File(nodeInternDir, "representation.xml");
        File valFile = new File(nodeInternDir, "value.xml");
        NodeSettingsRO repSettings = NodeSettings.loadFromXML(new FileInputStream(repFile));
        NodeSettingsRO valSettings = NodeSettings.loadFromXML(new FileInputStream(valFile));
        m_representation = createEmptyViewRepresentation();
        m_viewValue = createEmptyViewValue();
        try {
            m_representation.loadFromNodeSettings(repSettings);
            m_viewValue.loadFromNodeSettings(valSettings);
        } catch (InvalidSettingsException e) {
            // what to do?
            LOGGER.error("Error loading internals: " + e.getMessage(), e);
        }
    }

    /**
     * {@inheritDoc}
     */
    @Override
    protected void saveInternals(final File nodeInternDir, final ExecutionMonitor exec) throws IOException,
        CanceledExecutionException {
        NodeSettings repSettings = new NodeSettings("scatterPlotViewRepresentation");
        NodeSettings valSettings = new NodeSettings("scatterPlotViewValue");
        if (m_representation != null) {
            m_representation.saveToNodeSettings(repSettings);
        }
        if (m_viewValue != null) {
            m_viewValue.saveToNodeSettings(valSettings);
        }
        File repFile = new File(nodeInternDir, "representation.xml");
        File valFile = new File(nodeInternDir, "value.xml");
        repSettings.saveToXML(new FileOutputStream(repFile));
        valSettings.saveToXML(new FileOutputStream(valFile));
    }

    /**
     * {@inheritDoc}
     */
    @Override
    protected void saveSettingsTo(final NodeSettingsWO settings) {
        m_config.saveSettings(settings);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    protected void validateSettings(final NodeSettingsRO settings) throws InvalidSettingsException {
        new ScatterPlotViewConfig().loadSettings(settings);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    protected void loadValidatedSettingsFrom(final NodeSettingsRO settings) throws InvalidSettingsException {
        m_config.loadSettings(settings);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    protected void reset() {
        synchronized (m_lock) {
            m_representation = createEmptyViewRepresentation();
            m_viewValue = createEmptyViewValue();
        }
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public boolean isHideInWizard() {
        // TODO Auto-generated method stub
        return false;
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public void saveCurrentValue(final NodeSettingsWO content) {
        // TODO Auto-generated method stub

    }

}