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
 *   11.11.2016 (thor): created
 */
package org.knime.js.core;

import static org.hamcrest.core.Is.is;
import static org.junit.Assert.assertThat;

import org.junit.Test;
import org.knime.core.data.DataColumnSpecCreator;
import org.knime.core.data.DataTableSpec;
import org.knime.core.data.def.StringCell;

import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * Testcases for {@link JSONDataTableSpec}.
 *
 * @author Thorsten Meinl, KNIME.com, Zurich, Switzerland
 */
public class JSONDataTableSpecTest {
    /**
     * Checks that serialization of a {@link DataTableSpec} via a {@link JSONDataTableSpec} works as expected (see
     * also AP-6590).
     *
     * @throws Exception if an error occurs
     */
    @Test
    public void testSerialization() throws Exception {
        ObjectMapper mapper = new ObjectMapper();

        DataTableSpec expectedSpec = new DataTableSpec(new DataColumnSpecCreator("col1", StringCell.TYPE).createSpec());
        JSONDataTableSpec jsonSpec = new JSONDataTableSpec(expectedSpec, 0);
        String json = mapper.writer().writeValueAsString(jsonSpec);

        ClassLoader oldLoader = Thread.currentThread().getContextClassLoader();
        try {
            Thread.currentThread().setContextClassLoader(getClass().getClassLoader());
            JSONDataTableSpec deserializedJsonSpec = mapper.reader().forType(JSONDataTableSpec.class).readValue(json);
            DataTableSpec actualSpec = deserializedJsonSpec.createDataTableSpec();
            assertThat("Unexpected deserialized spec", actualSpec, is(expectedSpec));
        } finally {
            Thread.currentThread().setContextClassLoader(oldLoader);
        }
    }
}
