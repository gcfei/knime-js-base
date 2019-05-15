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
 *   3 Jun 2019 (albrecht): created
 */
package org.knime.js.base.node.configuration.input.filechooser;

import javax.json.Json;
import javax.json.JsonArray;
import javax.json.JsonArrayBuilder;
import javax.json.JsonException;
import javax.json.JsonObject;
import javax.json.JsonObjectBuilder;
import javax.json.JsonString;
import javax.json.JsonValue;

import org.knime.core.node.InvalidSettingsException;
import org.knime.core.node.NodeSettingsRO;
import org.knime.core.node.dialog.DialogNodeValue;
import org.knime.js.base.node.base.input.filechooser.FileChooserNodeValue;

import com.fasterxml.jackson.annotation.JsonIgnore;

/**
 * The value for the file chooser configuration node
 *
 * @author Christian Albrecht, KNIME GmbH, Konstanz, Germany
 */
public class FileChooserDialogNodeValue extends FileChooserNodeValue implements DialogNodeValue {

    /**
     * {@inheritDoc}
     */
    @Override
    @JsonIgnore
    public void loadFromNodeSettingsInDialog(final NodeSettingsRO settings) {
        setItems(new FileItem[0]);
        if (settings.containsKey(CFG_ITEMS)) {
            try {
                NodeSettingsRO itemSettings = settings.getNodeSettings(CFG_ITEMS);
                int numItems = itemSettings.getInt("num_items", 0);
                setItems(new FileItem[numItems]);
                FileItem[] items = getItems();
                for (int i = 0; i < numItems; i++) {
                    items[i] = new FileItem();
                    NodeSettingsRO singleItemSettings = itemSettings.getNodeSettings("item_" + i);
                    items[i].loadFromNodeSettingsInDialog(singleItemSettings);
                }
            } catch (InvalidSettingsException e) { /* do nothing */ }
        }
    }

    /**
     * {@inheritDoc}
     */
    @Override
    @JsonIgnore
    public void loadFromString(final String fromCmdLine) throws UnsupportedOperationException {
        FileItem item = new FileItem();
        item.setPath(fromCmdLine);
        setItems(new FileItem[]{item});
    }

    /**
     * {@inheritDoc}
     */
    @Override
    @JsonIgnore
    public void loadFromJson(final JsonValue json) throws JsonException {
        if (json instanceof JsonString) {
            loadFromString(((JsonString) json).getString());
        } else if (json instanceof JsonObject) {
            try {
                JsonValue val = ((JsonObject)json).get(CFG_ITEMS);
                if (JsonValue.NULL.equals(val)) {
                    setItems(new FileItem[0]);
                } else {
                    JsonArray itemsArray = ((JsonObject)json).getJsonArray(CFG_ITEMS);
                    setItems(new FileItem[itemsArray.size()]);
                    FileItem[] items = getItems();
                    for (int i = 0; i < itemsArray.size(); i++) {
                        if (JsonValue.NULL.equals(itemsArray.get(i))) {
                            items[i] = null;
                        } else {
                            JsonObject item = itemsArray.getJsonObject(i);
                            items[i] = new FileItem();
                            if (JsonValue.NULL.equals(item.get(FileItem.CFG_PATH))) {
                                items[i].setPath(null);
                            } else {
                                items[i].setPath(item.getString(FileItem.CFG_PATH));
                            }
                            if (JsonValue.NULL.equals(item.get(FileItem.CFG_TYPE))) {
                                items[i].setType((String)null);
                            } else {
                                items[i].setType(item.getString(FileItem.CFG_TYPE));
                            }
                        }
                    }
                }
            } catch (Exception e) {
                throw new JsonException("Expected item values for key '" + CFG_ITEMS + "'.", e);
            }
        }
    }

    /**
     * {@inheritDoc}
     */
    @Override
    @JsonIgnore
    public JsonValue toJson() {
        JsonObjectBuilder builder = Json.createObjectBuilder();
        if (getItems() == null) {
            builder.addNull(CFG_ITEMS);
        } else {
            JsonArrayBuilder itemsBuilder = Json.createArrayBuilder();
            for (FileItem item : getItems()) {
                if (item == null) {
                    itemsBuilder.addNull();
                } else {
                    JsonObjectBuilder itemBuilder = Json.createObjectBuilder();
                    String path = item.getPath();
                    if (path == null) {
                        itemBuilder.addNull(FileItem.CFG_PATH);
                    } else {
                        itemBuilder.add(FileItem.CFG_PATH, item.getPath());
                    }
                    String type = item.getType();
                    if (type == null) {
                        itemBuilder.addNull(FileItem.CFG_TYPE);
                    } else {
                        itemBuilder.add(FileItem.CFG_TYPE, item.getType());
                    }
                    itemsBuilder.add(itemBuilder);
                }
            }
            builder.add(CFG_ITEMS, itemsBuilder);
        }
        return builder.build();
    }

}