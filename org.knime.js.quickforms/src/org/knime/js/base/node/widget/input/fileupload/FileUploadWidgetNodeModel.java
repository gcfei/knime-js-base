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
 *   Jun 3, 2019 (Daniel Bogenrieder): created
 */
package org.knime.js.base.node.widget.input.fileupload;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.MalformedURLException;
import java.net.SocketTimeoutException;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.URL;
import java.net.URLConnection;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Arrays;
import java.util.Vector;

import javax.net.ssl.HttpsURLConnection;

import org.apache.commons.io.FilenameUtils;
import org.apache.commons.io.IOUtils;
import org.apache.commons.lang.StringUtils;
import org.apache.commons.lang3.RandomStringUtils;
import org.knime.core.node.CanceledExecutionException;
import org.knime.core.node.ExecutionContext;
import org.knime.core.node.ExecutionMonitor;
import org.knime.core.node.InvalidSettingsException;
import org.knime.core.node.KNIMEConstants;
import org.knime.core.node.NodeLogger;
import org.knime.core.node.NodeSettings;
import org.knime.core.node.NodeSettingsRO;
import org.knime.core.node.port.PortObject;
import org.knime.core.node.port.PortObjectSpec;
import org.knime.core.node.port.flowvariable.FlowVariablePortObject;
import org.knime.core.node.port.flowvariable.FlowVariablePortObjectSpec;
import org.knime.core.node.port.inactive.InactiveBranchPortObject;
import org.knime.core.node.port.inactive.InactiveBranchPortObjectSpec;
import org.knime.core.node.util.CheckUtils;
import org.knime.core.node.web.ValidationError;
import org.knime.core.node.workflow.NodeContext;
import org.knime.core.node.workflow.WorkflowContext;
import org.knime.core.util.FileUtil;
import org.knime.core.util.KNIMEServerHostnameVerifier;
import org.knime.core.util.pathresolve.ResolverUtil;
import org.knime.js.base.node.base.input.fileupload.FileUploadNodeRepresentation;
import org.knime.js.base.node.base.input.fileupload.FileUploadNodeValue;
import org.knime.js.base.node.widget.WidgetFlowVariableNodeModel;

/**
 * The node model for the file upload widget node
 *
 * @author Daniel Bogenrieder, KNIME GmbH, Konstanz, Germany
 */
public class FileUploadWidgetNodeModel extends
    WidgetFlowVariableNodeModel<FileUploadNodeRepresentation<FileUploadNodeValue>, FileUploadNodeValue,
    FileUploadInputWidgetConfig> {

    private static final String KNIME_PROTOCOL = "knime";

    private static final String KNIME_WORKFLOW = "knime.workflow";

    private String m_id;

    /**
     * Creates a new file upload widget node model
     *
     * @param viewName the interactive view name
     */
    protected FileUploadWidgetNodeModel(final String viewName) {
        super(viewName);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public FileUploadNodeValue createEmptyViewValue() {
        return new FileUploadNodeValue();
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public String getJavascriptObjectID() {
        return "org.knime.js.base.node.widget.input.fileupload";
    }

    /**
     * {@inheritDoc}
     */
    @Override
    protected PortObjectSpec[] configure(final PortObjectSpec[] inSpecs) throws InvalidSettingsException {
        try {
            do {
                m_id = RandomStringUtils.randomAlphanumeric(12).toLowerCase();
            } while (computeFileName(m_id).exists());
            createAndPushFlowVariable(false);
        } catch (InvalidSettingsException e) {
            if (getConfig().getDisableOutput()) {
                setWarningMessage(e.getMessage());
                return new PortObjectSpec[]{InactiveBranchPortObjectSpec.INSTANCE};
            } else {
                throw e;
            }
        }
        return new PortObjectSpec[]{FlowVariablePortObjectSpec.INSTANCE};
    }

    /**
     * {@inheritDoc}
     */
    @Override
    protected PortObject[] performExecute(final PortObject[] inObjects, final ExecutionContext exec) throws Exception {
        try {
            createAndPushFlowVariable();
        } catch (InvalidSettingsException e) {
            getRelevantValue().setPathValid(false);
            if (getConfig().getDisableOutput()) {
                setWarningMessage(e.getMessage());
                return new PortObject[]{InactiveBranchPortObject.INSTANCE};
            } else {
                throw e;
            }
        }
        return new PortObject[]{FlowVariablePortObject.INSTANCE};
    }

    /**
     * {@inheritDoc}
     */
    @Override
    protected void createAndPushFlowVariable() throws InvalidSettingsException {
        createAndPushFlowVariable(true);
    }

    private void createAndPushFlowVariable(final boolean openStream) throws InvalidSettingsException {
        ValidationError error = validateViewValue(getRelevantValue());
        if (error != null) {
            throw new InvalidSettingsException(error.getError());
        }
        Vector<String> fileValues = getFileAndURL(openStream);
        String varIdentifier = getConfig().getFlowVariableName();
        if (fileValues.get(0) != null) {
            pushFlowVariableString(varIdentifier, fileValues.get(0));
        }
        pushFlowVariableString(varIdentifier + " (URL)", fileValues.get(1));
    }

    private Vector<String> getFileAndURL(final boolean openStream) throws InvalidSettingsException {
        String path = getRelevantValue().getPath();
        if (path == null || path.isEmpty()) {
            throw new InvalidSettingsException("No file or URL provided");
        }

        Vector<String> vector = new Vector<String>();
        try {
            URL url = new URL(path);
            if (!getConfig().isStoreInWfDir() && "file".equalsIgnoreCase(url.getProtocol())) {
                Path p = Paths.get(url.toURI());
                if (!Files.exists(p)) {
                    throw new InvalidSettingsException("No such file: \"" + p + "\"");
                }
                vector.add(p.toString());
                vector.add(url.toString());
            } else {
                if (openStream) {
                    // For a remote resource we always copy it locally first, because it may be accessed several times
                    // and if it's an upload from the WebPortal it requires special authentication.
                    final File tempFile = copyFileToTempLocation(path, url);
                    vector.add(tempFile.getAbsolutePath());
                    vector.add(getConfig().isStoreInWfDir()
                        ? new URL(KNIME_PROTOCOL, KNIME_WORKFLOW,
                            "/" + ResolverUtil.IN_WORKFLOW_TEMP_DIR + "/" + tempFile.getName()).toString()
                        : tempFile.toURI().toString());
                } else {
                    vector.add(null);
                    vector.add(url.toString());
                }
            }
        } catch (MalformedURLException ex) {
            File f = new File(path);
            if (!f.exists()) {
                StringBuilder b = new StringBuilder("No such file: \"");
                b.append(f.getAbsolutePath()).append("\"");
                throw new InvalidSettingsException(b.toString());
            }
            URL url;
            try {
                if (openStream && getConfig().isStoreInWfDir()) {
                    final File tempFile = copyFileToTempLocation(path, f.toURI().toURL());
                    url = new URL(KNIME_PROTOCOL, KNIME_WORKFLOW,
                        "/" + ResolverUtil.IN_WORKFLOW_TEMP_DIR + "/" + tempFile.getName());
                    path = tempFile.getAbsolutePath();
                } else {
                    url = f.toURI().toURL();
                }
            } catch (MalformedURLException e) {
                StringBuilder b = new StringBuilder("Unable to derive URL from ");
                b.append("file: \"").append(f.getAbsolutePath()).append("\"");
                b.append(" (file was set as part of quick form remote control)");
                throw new InvalidSettingsException(b.toString(), e);
            } catch (IOException e) {
                throw new InvalidSettingsException(
                    "Could not transfer uploaded file to workflow temp directory: " + e.getMessage(), e);
            }
            vector.add(path);
            vector.add(url.toString());
        } catch (URISyntaxException ex) {
            // shouldn't happen
            NodeLogger.getLogger(getClass()).debug("Invalid file URI encountered: " + ex.getMessage());
        } catch (IOException ex) {
            throw new InvalidSettingsException(
                "Could not download uploaded file to local temp directory: " + ex.getMessage(), ex);
        }
        return vector;
    }

    private File copyFileToTempLocation(final String path, final URL url) throws IOException, InvalidSettingsException {
        final String extension = FilenameUtils.getExtension(path);
        final String basename = FilenameUtils.getBaseName(path);
        File tempFile;
        if (getConfig().isStoreInWfDir()) {
            tempFile = computeFileName(m_id);
            tempFile.getParentFile().mkdir();
        } else {
            tempFile = FileUtil.createTempFile((basename.length() < 3) ? "prefix" + basename : basename,
                "." + (StringUtils.isEmpty(extension) ? "bin" : extension));
        }

        try (InputStream is = openStream(url); OutputStream os = Files.newOutputStream(tempFile.toPath())) {
            IOUtils.copyLarge(is, os);
        } catch (final Exception e) {
            final StringBuilder b = new StringBuilder("Connection to given URL: \"");
            b.append(url.toString());
            if (e instanceof SocketTimeoutException) {
                b.append("\" timed out. Check that the file is accessible from your network, "
                    + "and consider increasing the default timeout value.");
            } else {
                b.append("\" could not be achieved. ");
                b.append(e.getMessage());
            }
            throw new InvalidSettingsException(b.toString(), e);
        }
        return tempFile;
    }

    private File computeFileName(final String id) {
        File rootDir = null;
        // get the flow's tmp dir from its context
        final NodeContext nodeContext = NodeContext.getContext();
        if (nodeContext != null) {
            final WorkflowContext workflowContext = nodeContext.getWorkflowManager().getContext();
            if (workflowContext != null) {
                rootDir = new File(workflowContext.getCurrentLocation(), ResolverUtil.IN_WORKFLOW_TEMP_DIR);
                rootDir.mkdir();
            }
        }
        if (rootDir == null) {
            // use the standard tmp dir then.
            rootDir = new File(KNIMEConstants.getKNIMETempDir());
        }
        final String path = getRelevantValue().getPath();
        final String extension = FilenameUtils.getExtension(path);
        final String basename = FilenameUtils.getBaseName(path);
        return new File(rootDir, basename + id + "." + extension);
    }

    /** {@inheritDoc} */
    @Override
    protected void onDispose() {
        if (getConfig().isStoreInWfDir()) {
            deleteTmpFile();
        }
        super.onDispose();
    }

    /** {@inheritDoc} */
    @Override
    protected void performReset() {
        super.performReset();
        if (getConfig().isStoreInWfDir()) {
            deleteTmpFile();
        }
    }

    private void deleteTmpFile() {
        if (m_id == null) {
            return;
        }
        final File file = computeFileName(m_id);
        final StringBuilder debug = new StringBuilder();
        if (FileUtil.deleteRecursively(file)) {
            debug.append(getConfig().isStoreInWfDir() && file.getParentFile().delete()
                ? "Deleted temp directory " + file.getParentFile().getAbsolutePath()
                : "Deleted temp directory " + file.getAbsolutePath());
        }
    }

    private InputStream openStream(final URL url) throws IOException, URISyntaxException {
        if ("file".equalsIgnoreCase(url.getProtocol())) {
            return Files.newInputStream(Paths.get(url.toURI()));
        } else {
            final WorkflowContext wfContext = NodeContext.getContext().getWorkflowManager().getContext();
            final URLConnection conn = url.openConnection();

            if (wfContext.getRemoteRepositoryAddress().isPresent() && wfContext.getServerAuthToken().isPresent()) {
                // only pass on the auth token if it's the originating server, we don't want to send it to someone else
                final URI repoUri = wfContext.getRemoteRepositoryAddress().get();
                if (repoUri.getHost().equals(url.getHost()) && (repoUri.getPort() == url.getPort())
                    && repoUri.getScheme().equals(url.getProtocol())) {
                    conn.setRequestProperty("Authorization", "Bearer " + wfContext.getServerAuthToken().get());
                }
            }

            if (conn instanceof HttpsURLConnection) {
                ((HttpsURLConnection)conn).setHostnameVerifier(KNIMEServerHostnameVerifier.getInstance());
            }
            conn.setConnectTimeout(getConfig().getTimeout());
            conn.setReadTimeout(getConfig().getTimeout());

            return conn.getInputStream();
        }
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public ValidationError validateViewValue(final FileUploadNodeValue value) {
        // check for a valid file extension
        // no items in file types <=> any file type is valid
        if (getConfig().getFileTypes().length > 0) {
            String ext = "." + FilenameUtils.getExtension(value.getPath());
            if (!Arrays.asList(getConfig().getFileTypes()).contains(ext)) {
                return new ValidationError("File extension " + ext + " is not valid");
            }
        }
        return super.validateViewValue(value);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public FileUploadInputWidgetConfig createEmptyConfig() {
        return new FileUploadInputWidgetConfig();
    }

    /**
     * {@inheritDoc}
     */
    @Override
    protected FileUploadNodeRepresentation<FileUploadNodeValue> getRepresentation() {
        FileUploadInputWidgetConfig config = getConfig();
        return new FileUploadNodeRepresentation<FileUploadNodeValue>(getRelevantValue(), config.getDefaultValue(),
            config.getFileUploadConfig(), config.getLabelConfig());
    }

    /**
     * {@inheritDoc}
     */
    @Override
    protected void useCurrentValueAsDefault() {
        getConfig().getDefaultValue().setPath(getViewValue().getPath());
        getConfig().getDefaultValue().setPathValid(getViewValue().getPathValid());
    }

    private static final String INTERNAL_FILE_NAME = "file-id.xml";

    /** {@inheritDoc} */
    @Override
    protected void loadInternals(final File nodeInternDir, final ExecutionMonitor exec)
        throws IOException, CanceledExecutionException {
        super.loadInternals(nodeInternDir, exec);
        final File internalFile = new File(nodeInternDir, INTERNAL_FILE_NAME);
        boolean issueWarning;
        if (internalFile.exists()) {
            // in most standard cases this isn't reasonable as the folder gets deleted when the flow is closed.
            // however, it's useful if the node is run in a temporary workflow that is part of the streaming executor
            try (InputStream in = new FileInputStream(internalFile)) {
                final NodeSettingsRO s = NodeSettings.loadFromXML(in);
                m_id = CheckUtils.checkSettingNotNull(s.getString("upload-file-id"), "id must not be null");
                issueWarning = !computeFileName(m_id).exists();
            } catch (final InvalidSettingsException e) {
                throw new IOException(e.getMessage(), e);
            }
        } else {
            issueWarning = getConfig().isStoreInWfDir();
        }
        if (issueWarning) {
            setWarningMessage("Did not restore content; consider to re-execute!");
        }
    }

    /** {@inheritDoc} */
    @Override
    protected void saveInternals(final File nodeInternDir, final ExecutionMonitor exec)
        throws IOException, CanceledExecutionException {
        super.saveInternals(nodeInternDir, exec);
        if (m_id != null) {
            try (OutputStream w = new FileOutputStream(new File(nodeInternDir, INTERNAL_FILE_NAME))) {
                final NodeSettings s = new NodeSettings("file-upload-widget-node");
                s.addString("upload-file-id", m_id);
                s.saveToXML(w);
            }
        }
    }
}
