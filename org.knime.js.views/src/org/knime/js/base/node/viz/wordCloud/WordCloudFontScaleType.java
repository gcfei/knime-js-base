/*
 * ------------------------------------------------------------------------
 *
 *  Copyright by KNIME GmbH, Konstanz, Germany
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
 *   3 Oct 2017 (albrecht): created
 */
package org.knime.js.base.node.viz.wordCloud;

import java.util.HashMap;
import java.util.Map;
import java.util.Map.Entry;

import org.apache.commons.lang3.StringUtils;

import com.fasterxml.jackson.annotation.JsonAutoDetect;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

/**
 *
 * @author Christian Albrecht, KNIME GmbH, Konstanz, Germany
 */
@JsonAutoDetect
public enum WordCloudFontScaleType {

    LINEAR,
    LOGARITHMIC,
    SQUARE_ROOT,
    EXPONENTIAL;

    private static Map<String, WordCloudFontScaleType> namesMap = new HashMap<String, WordCloudFontScaleType>(2);

    static {
        namesMap.put("linear", LINEAR);
        namesMap.put("logarithmic", LOGARITHMIC);
        namesMap.put("square root", SQUARE_ROOT);
        namesMap.put("exponential", EXPONENTIAL);
    }

    /**
     * @param value the string representation to retrieve an enum type for
     * @return an enum type for a given string, or null
     */
    @JsonCreator
    public static WordCloudFontScaleType forValue(final String value) {
        return namesMap.get(StringUtils.lowerCase(value));
    }

    /**
     * @return the string representation of this enum type
     */
    @JsonValue
    public String toValue() {
        for (Entry<String, WordCloudFontScaleType> entry : namesMap.entrySet()) {
            if (entry.getValue() == this) {
                return entry.getKey();
            }
        }
        // this does not happen, unless namesMap is not in synch with enum
        return null;
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public String toString() {
        return toValue();
    }

}
