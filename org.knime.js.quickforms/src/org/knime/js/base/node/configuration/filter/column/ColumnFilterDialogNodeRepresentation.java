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

import java.util.Arrays;

import org.apache.commons.lang.builder.EqualsBuilder;
import org.apache.commons.lang.builder.HashCodeBuilder;
import org.knime.core.data.DataTableSpec;
import org.knime.core.node.dialog.DialogNodePanel;
import org.knime.js.base.node.base.filter.column.ColumnFilterNodeConfig;
import org.knime.js.base.node.configuration.AbstractDialogNodeRepresentation;

/**
 * The dialog representation of the column filter configuration node
 *
 * @author Christian Albrecht, KNIME GmbH, Konstanz, Germany
 */
public class ColumnFilterDialogNodeRepresentation
    extends AbstractDialogNodeRepresentation<ColumnFilterDialogNodeValue, ColumnFilterDialogNodeConfig> {

    private final String[] m_possibleColumns;
    private final String m_type;
    private final boolean m_limitNumberVisOptions;
    private final Integer m_numberVisOptions;

    private final DataTableSpec m_spec;

    /**
     * @param currentValue The value currently used by the node
     * @param dConfig The config of the node
     * @param spec The current table spec
     */
    public ColumnFilterDialogNodeRepresentation(final ColumnFilterDialogNodeValue currentValue,
        final ColumnFilterDialogNodeConfig dConfig, final DataTableSpec spec) {
        super(currentValue, dConfig);
        ColumnFilterNodeConfig config = dConfig.getColumnFilterConfig();
        m_possibleColumns = config.getPossibleColumns();
        m_type = config.getType();
        m_limitNumberVisOptions = config.getLimitNumberVisOptions();
        m_numberVisOptions = config.getNumberVisOptions();
        m_spec = spec;
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public DialogNodePanel<ColumnFilterDialogNodeValue> createDialogPanel() {
        ColumnFilterConfigurationPanel panel = new ColumnFilterConfigurationPanel(this);
        fillDialogPanel(panel);
        return panel;
    }

    /**
     * @return Last known table spec
     */
    public DataTableSpec getSpec() {
        return m_spec;
    }

    /**
     * @return the possibleColumns
     */
    public String[] getPossibleColumns() {
        return m_possibleColumns;
    }

    /**
     * @return the type
     */
    public String getType() {
        return m_type;
    }

    /**
     * @return the limitNumberVisOptions
     */
    public boolean getLimitNumberVisOptions() {
        return m_limitNumberVisOptions;
    }

    /**
     * @return the numberVisOptions
     */
    public Integer getNumberVisOptions() {
        return m_numberVisOptions;
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public String toString() {
        StringBuilder sb = new StringBuilder();
        sb.append(super.toString());
        sb.append(", ");
        sb.append("possibleColumns=");
        sb.append(Arrays.toString(m_possibleColumns));
        sb.append(", ");
        sb.append("type=");
        sb.append(m_type);
        sb.append(", ");
        sb.append("limitNumberVisOptions=");
        sb.append(m_limitNumberVisOptions);
        sb.append(", ");
        sb.append("numberVisOptions=");
        sb.append(m_numberVisOptions);
        return sb.toString();
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public int hashCode() {
        return new HashCodeBuilder().appendSuper(super.hashCode())
                .append(m_possibleColumns)
                .append(m_type)
                .append(m_limitNumberVisOptions)
                .append(m_numberVisOptions)
                .toHashCode();
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public boolean equals(final Object obj) {
        if (obj == null) {
            return false;
        }
        if (obj == this) {
            return true;
        }
        if (obj.getClass() != getClass()) {
            return false;
        }
        ColumnFilterDialogNodeRepresentation other = (ColumnFilterDialogNodeRepresentation)obj;
        return new EqualsBuilder().appendSuper(super.equals(obj))
                .append(m_possibleColumns, other.m_possibleColumns)
                .append(m_type, other.m_type)
                .append(m_limitNumberVisOptions, other.m_limitNumberVisOptions)
                .append(m_numberVisOptions, other.m_numberVisOptions)
                .isEquals();
    }

}