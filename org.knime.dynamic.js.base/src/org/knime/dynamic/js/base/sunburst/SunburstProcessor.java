package org.knime.dynamic.js.base.sunburst;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.stream.Stream;

import org.knime.core.data.DataRow;
import org.knime.core.data.container.DataContainer;
import org.knime.core.data.sort.BufferedDataTableSorter;
import org.knime.core.node.BufferedDataTable;
import org.knime.core.node.ExecutionContext;
import org.knime.core.node.InvalidSettingsException;
import org.knime.core.node.defaultnodesettings.SettingsModelBoolean;
import org.knime.core.node.defaultnodesettings.SettingsModelColumnFilter2;
import org.knime.core.node.defaultnodesettings.SettingsModelString;
import org.knime.core.node.port.PortObject;
import org.knime.dynamic.js.v30.DynamicJSConfig;
import org.knime.dynamic.js.v30.DynamicJSProcessor;
import org.knime.base.data.filter.column.FilterColumnTable;

public class SunburstProcessor implements DynamicJSProcessor {
             
    @Override
    public Object[] processInputObjects(PortObject[] inObjects,
            ExecutionContext exec, DynamicJSConfig config) throws Exception {
    	
        BufferedDataTable dt = (BufferedDataTable)inObjects[0];

        // Get columns selected for path.
        String[] pathColumns = ((SettingsModelColumnFilter2)config.getModel("pathColumns")).applyTo(dt.getDataTableSpec()).getIncludes();
        
        // Get column selected for frequency.
        String freqColumn = ((SettingsModelString)config.getModel("freqColumn")).getStringValue();
               
        // Concatenate y-axis and x-axis columns, but only include columns that exist.
        String[] includeColumns = Stream
        		.concat(Arrays.stream(pathColumns), Stream.of(freqColumn))
        		.filter(p -> p != null)
        		.distinct()
                .toArray(String[]::new);

        FilterColumnTable ft = new FilterColumnTable(dt, includeColumns);
        //int filteredCount = 0;
        DataContainer dc = exec.createDataContainer(ft.getDataTableSpec());
        for (DataRow row : ft) {
            // Filter out rows with missing values.

        	if (row.stream().allMatch(cell -> !cell.isMissing())) {
        		dc.addRowToTable(row);
        		//filteredCount++;
        	}
        }
        dc.close();

        /*
         * TODO: Show warning message
        if (filteredCount > 0) {
            setWarningMessage(filteredCount + " rows contain missing values and are ignored.");
        }
        */

        return new Object[] {dc.getTable(), inObjects[1]};
    }

}
