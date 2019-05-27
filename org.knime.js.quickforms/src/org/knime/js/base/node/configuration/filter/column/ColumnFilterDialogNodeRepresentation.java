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
 *   27 May 2019 (albrecht): created
 */
package org.knime.js.base.node.configuration.filter.column;

import org.knime.core.data.DataTableSpec;
import org.knime.core.node.dialog.DialogNodePanel;
import org.knime.core.quickform.QuickFormRepresentation;
import org.knime.js.base.node.base.filter.column.ColumnFilterNodeRepresentation;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;

/**
 * The dialog representation of the column filter configuration node
 *
 * @author Christian Albrecht, KNIME GmbH, Konstanz, Germany
 */
public class ColumnFilterDialogNodeRepresentation extends ColumnFilterNodeRepresentation<ColumnFilterDialogNodeValue>
    implements QuickFormRepresentation<ColumnFilterDialogNodeValue> {

    private final DataTableSpec m_spec;

    @JsonCreator
    private ColumnFilterDialogNodeRepresentation(@JsonProperty("label") final String label,
        @JsonProperty("description") final String description,
        @JsonProperty("required") final boolean required,
        @JsonProperty("defaultValue") final ColumnFilterDialogNodeValue defaultValue,
        @JsonProperty("currentValue") final ColumnFilterDialogNodeValue currentValue,
        @JsonProperty("possibleColumns") final String[] possibleColumns,
        @JsonProperty("type") final String type,
        @JsonProperty("limitNumberVisOptions") final boolean limitNumberVisOptions,
        @JsonProperty("numberVisOptions") final Integer numberVisOptions,
        @JsonProperty("spec") @JsonDeserialize(using = DataTableSpecDeserializer.class) final DataTableSpec spec) {
        super(label, description, required, defaultValue, currentValue, possibleColumns, type, limitNumberVisOptions,
            numberVisOptions);
        m_spec = spec;
    }

    /**
     * @param currentValue The value currently used by the node
     * @param config The config of the node
     * @param spec The current table spec
     */
    public ColumnFilterDialogNodeRepresentation(final ColumnFilterDialogNodeValue currentValue,
        final ColumnFilterDialogNodeConfig config, final DataTableSpec spec) {
        super(currentValue, config.getDefaultValue(), config.getColumnFilterConfig(), config.getLabelConfig());
        m_spec = spec;
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public DialogNodePanel<ColumnFilterDialogNodeValue> createDialogPanel() {
        return new ColumnFilterConfigurationPanel(this);
    }

    /**
     * @return Last known table spec
     */
    @JsonProperty("spec")
    @JsonSerialize(using = DataTableSpecSerializer.class)
    public DataTableSpec getSpec() {
        return m_spec;
    }
}
