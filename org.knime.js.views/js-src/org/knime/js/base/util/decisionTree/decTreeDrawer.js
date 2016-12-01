
/**
 * attributeName: name of attribute this panel describes
 * enter: function that creates panel content
 * update: function that updates panel content
 * width: function calculating width of panel
 * height: function calculating height of panel
 */
function Panel(attributeName, enter, update, width, height) {
    this.name = attributeName;
    this.enter = enter;
    this.update = update;
    this.width = width;
    this.height = height;
}


/**
 * decTree: the JSDecisionTree
 * nodeStatus: Integer Array containing for each node its status (can be null which means no status is specified for the node)
 */
function DecTreeDrawer(representation, value) {
    this.margin = [10,10];
    this.panels = [];
    this.addPanel = function(panel) {
        this.panels.push(panel);
    };
    
    var options = {
    		numberFormat: representation.numberFormat,
    		backgroundColor: representation.backgroundColor,
    		nodeBackgroundColor : representation.nodeBackgroundColor,
    		enableSelection: representation.enableSelection,
    		dataAreaColor: representation.dataAreaColor,
    		enableTitleChange: representation.enableTitleChange,
    		enableSubtitleChange: representation.enableSubtitleChange,
    		enableViewConfiguration: representation.enableViewConfiguration,
    		publishSelection: value.publishSelection,
    		subscribeSelection: value.subscribeSelection,
    		tableId: representation.tableId,
    		displayFullscreenButton: representation.displayFullscreenButton,
    		enableZooming : representation.enableZooming,
    		displaySelectionResetButton: representation.displaySelectionResetButton
    };
    var selection;
    var decTree = representation.tree;
    var nodeStatus = value.nodeStatus;
    var title = value.title;
    var subtitle = value.subtitle;
    
    if (value.selection) {
    	selection = d3.set(value.selection);
    } else {
    	selection = d3.set();
    }
    
    var leafs = [];

    
    this.createClassTableCreator = function(dx, dy) {
    	return new ClassTableCreator(decTree, dx, dy);
    }
    
    
    var duration = 2000;
    var halfDuration = duration / 2;
    var dtd = this;
    var numFormatter = wNumb(options.numberFormat);
    var translation = [0,0];
	var scale = 1;
	var scrollVector = [0,0];
    
    var fontsize = d3.select("svg");
    if (fontsize.empty()) {
    	fontsize = 10;
    } else {
    	fontsize = fontsize.style("font-size");
    	fontsize = parseInt(fontsize.replace("px", ""));
    }
    
    var appendixHeight = fontsize + dtd.margin[1] + 5;
    
    this.getValue = function() {
    	return {
    		selection : selection.values(),
    		nodeStatus : nodeStatus,
    		title : title,
    		subtitle: subtitle,
    		publishSelection: options.publishSelection,
    		subscribeSelection: options.subscribeSelection
    	};
    }
    
    
    unselect = function(d) {
    	var rows = containedRows(d, false);
    	// we are not sure if removing rows that are not in the selection messes with the knimeService
    	var removedRows = [];
    	rows.forEach(function(r) { 
    		if(selection.remove(r)) {
    			removedRows.push(r);
    		};
    	});
    	if (options.publishSelection && knimeService && knimeService.isInteractivityAvailable()) {
    		knimeService.removeRowsFromSelection(options.tableId, removedRows, selectionChanged);
    	}
    	notifyParent(d);
    }
    
    select = function(d) {
    	var rows = containedRows(d, true);
    	rows.forEach(function(r) { selection.add(r); });
    	if (options.publishSelection && knimeService && knimeService.isInteractivityAvailable()) {
    		knimeService.addRowsToSelection(options.tableId, rows, selectionChanged);
    	}
    	notifyParent(d);
    }
    
    function notifyParent(d) {
    	var parent = d.parent, i, children, sum, selected, childCount;
    	while (parent) {
    		sum = 0;
    		selected = 0;
    		children = getChildren(parent);
    		for (i = 0; i < children.length; i++) {
    			childCount = parent.numPerChild[i];
    			sum += childCount;
    			selected += children[i].fracSelected * childCount;
    		}
    		parent.fracSelected = selected / sum;
    		parent = parent.parent;
    	}
    }
    
    getSelection = function() {
    	return selection.values();
    }
    
    
    setupTree = function(d) {
    	if (d.children && !isExpanded(d)) {
    		d._children = d.children;
    		d.children = null;
    		d._children.forEach(setupTree);
    	} else if (d.children) {
    		d.children.forEach(setupTree);
    	}
    }
    
    function updateSelectionFractionFromChildren(d) {
    	var i, children = getChildren(d), nc = d.numPerChild.length, selected = 0, total = 0;
    	for (i = 0; i < nc; i++) {
    		selected += children[i].fracSelected * d.numPerChild[i];
    		total += d.numPerChild[i];
    	}
    	if (total > 0) {
    		d.fracSelected = selected / total;
    	} else {
    		d.fracSelected = 0;
    	}
    }
    
    setup = function(d, childCounts) {
    	// expand/collapse nodes according to nodeStatus
    	if (d.children && !isExpanded(d)) {
    		d._children = d.children;
    		d.children = null;
    	}
    	
    	// propagate fracSelected attribute
    	d.fracSelected = 0;
    	// count rows that ran through this node
    	if (hasChildren(d)) {
    		d.numPerChild = childCounts;
    		if (!selection.empty()) {
    			updateSelectionFractionFromChildren(d);
    		}
    		return d3.sum(childCounts);
    	} else {
    		if (!selection.empty() && d.rowKeys.length > 0) {
    			var i, selected = 0;
    			for (i = 0; i < d.rowKeys.length; i++) {
    				if (selection.has(d.rowKeys[i])) {
    					selected++;
    				}
    			}
    			d.fracSelected = selected / d.rowKeys.length;
    		}
    		leafs.push(d);
    		return d.rowKeys.length;
    	}
    }
    
    applySelectionFromLeafs = function() {
    	var j, nl = leafs.length, totalMatched = 0, nsel = selection.size();
    	for (j = 0; j < nl; j++) {
    		var i, selected = 0, d = leafs[j], nKeys = d.rowKeys.length;
    		if (totalMatched >= nsel) {
    			break;
    		}
    		for (i = 0; i < nKeys; i++) {
    			if (selection.has(d.rowKeys[i])) {
    				selected++;
    				totalMatched++;
    			}
    		}
    		// update fraction that is selected
    		var oldFrac = d.fracSelected;
    		if (nKeys == 0) {
    			d.fracSelected = 0;
    		} else {
    			d.fracSelected = selected / nKeys;
    		}
    		// only notify parent if selection fraction changed
    		if (oldFrac != d.fracSelected) {
    			notifyParent(d);
    		}
    	}
    }
    
    traverseAndCollect = function(d, apply) {
    	if (hasChildren(d)) {
    		var children = getChildren(d);
    		var childResults = [];
    		var i;
    		// traverse subtree and collect results
    		for (i = 0; i < children.length; i++) {
    			childResults.push(traverseAndCollect(children[i], apply));
    		}
    		return apply(d, childResults);
    	} else {
    		return apply(d, null);
    	}
    }
    
    traverseAndCollect(decTree.root, setup);
    
    function getNodeStatus(d) {
    	var nodeId = d.name;
    	if (nodeStatus == undefined || nodeStatus == null || nodeId >= nodeStatus.length
    			|| nodeStatus[nodeId] == undefined || nodeStatus[nodeId] == null) {
    		return 0;
    	} else {
    		return nodeStatus[nodeId];
    	}
    }
    
    function arraySum(a1, a2) {
    	var minLength = d3.min([a1.length, a2.length]), i, out = [];
    	for (i = 0; i < minLength; i++) {
    		out[i] = a1[i] + a2[i];
    	}
    	return out;
    }
    
    function scaledArray(array, scale) {
    	var l = array.length, i, out = [];
    	for (i = 0; i < l; i++) {
    		out[i] = scale * array[i];
    	}
    	return out;
    }
    
    function setNodeStatus(d, status) {
    	var nodeId = d.name;
    	if (nodeStatus === undefined || nodeStatus == null) {
    		nodeStatus = [];
    	}
    	nodeStatus[nodeId] = status;
    }
    
    function isExpanded(d) {
    	return getNodeStatus(d) & 1 == 1;
    }
    
    function hasChildren(d) {
    	return d.children || d._children;
    }
    
    function getChildren(d) {
    	if (hasChildren(d)) {
    		return d.children ? d.children : d._children;
    	}
    	return null;
    }
    
    containedRows = function(d, selected) {
    	var i, children, rowKeys;
    	// if parameter selected is specified set the selected fraction accordingly
    	if (selected !== undefined) {
    		d.fracSelected = selected ? 1 : 0;
    	}
    	// if leaf node return contained rowKeys
    	if (!hasChildren(d)) {
    		return d.rowKeys;
    	}
    	rowKeys = [];
    	children = getChildren(d);
    	// collect rowKeys from subtree
    	for (i = 0; i < children.length; i++) {
    		rowKeys = rowKeys.concat(containedRows(children[i], selected));
    	}
    	return rowKeys;
    }
    
    this.resize = function() {
    	drawTree;
    }
    
    this.getSVG = function() {
    	var svg = d3.select("svg");
    	svg.selectAll(".selection-checkbox").remove();
    	return svg.node();
    }
    
    this.init = init;
    function init() {
    	d3.selectAll("html, body")
	    	.style("width", "100%")
	    	.style("height", "100%")
	    	.style("padding", "0px")
	    	.style("margin", "0px");

    	var body = d3.select("body");

    	// Create container for our content
    	layoutContainer = body.append("div")
	    	.attr("id", "layoutContainer");
	//  	.style("min-width", MIN_WIDTH + "px")
	//  	.style("min-height", MIN_HEIGHT + "px");

    	// Size layout container based on sizing settings
//  	if (_representation.options.svg.fullscreen && _representation.runningInView) {
    	layoutContainer.style("width", "100%")
	    	.style("height", "100vh")
	    	.style("overflow", "auto");
//  	} else {
//  	layoutContainer.style("width", _representation.options.svg.width + "px")
//  	.style("height", _representation.options.svg.height + "px");
//  	}


    	// Add SVG element
    	var svg1 = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    	layoutContainer[0][0].appendChild(svg1);

    	var svg = d3.select("svg")
    		.style("display", "block")
    		.attr("font-family", "sans-serif")
    		.attr("font-size", "14px")
    		.attr("margin", "0px")
    		.attr("padding", "0px");
    	
    	var plot = svg
	    	.append("g")
	    	.attr("id", "plot");
    	
    	// Add rectangle for background color
    	plot.append("rect")
	    	.attr("id", "bgr")
	    	.attr("width", "100")
	    	.attr("height", "100")
	    	.attr("fill", options.backgroundColor);

    	var titleGroup = plot.append("g")
    		.attr("id", "titles");
    	
    	// Title
    	titleGroup.append("text")
	    	.attr("id", "title")
	    	.attr("font-size", 24)
	    	.attr("x", 20) 
	    	.attr("y", 30)
	    	.text(title);

    	// Subtitle
    	titleGroup.append("text")
	    	.attr("id", "subtitle")
	    	.attr("font-size", 12)
	    	.attr("x", 20)
	    	.attr("y", 46)
	    	.text(subtitle);
    	
    	
    	// Append a group for the plot and add a rectangle for the data area background
    	plot.append("g")
	    	.attr("id", "decTree")
	    	.append("rect")
	    	.attr("id", "da")
	    	.style("fill", options.dataAreaColor)
	    	.attr("width", "100")
	    	.attr("height", "100");

    	if (options.enableViewConfiguration) {
    		drawControls();
    	}
    	checkClearSelectionButton();
    	drawTree();
    	layout();
    }
    
    function drawControls() {
    	if (!knimeService) {
			// TODO: error handling?
			return;
		}
		
    	if (options.displayFullscreenButton) {
    		knimeService.allowFullscreen();
    	}
		
	    if (!options.enableViewConfiguration) return;
	    var pre = false;
	    	    
	    if (options.enableTitleChange || options.enableSubtitleChange) {
	    	pre = true;
	    	if (options.enableTitleChange) {
	    		var chartTitleText = knimeService.createMenuTextField('chartTitleText', title, updateTitle, true);
	    		knimeService.addMenuItem('Chart Title:', 'header', chartTitleText);
	    	}
	    	if (options.enableSubtitleChange) {
	    		var chartSubtitleText = knimeService.createMenuTextField('chartSubtitleText', subtitle, updateSubtitle, true);
	    		var mi = knimeService.addMenuItem('Chart Subtitle:', 'header', chartSubtitleText, null, knimeService.SMALL_ICON);
	    	}
	    }
	    
	    if (options.enableSelection && options.displaySelectionResetButton) {
	    	knimeService.addButton("dectree-selection-reset-button", "minus-square-o", "Reset Selection", function() {
	    		selectionChanged();
	    		if (options.publishSelection) {
	    			knimeService.setSelectedRows(options.tableId, getSelection(), selectionChanged);
	    		}
	    	});
	    	d3.select('#dectree-selection-reset-button').classed('inactive', true);
	    }
	    
	    if (knimeService.isInteractivityAvailable()) {
	    	if (pre) {
	    		knimeService.addMenuDivider();
	    	}
	    	if (options.enableSelection) {
	    		var pubSelIcon = knimeService.createStackedIcon('check-square-o', 'angle-right', 'faded left sm', 'right bold');
				var pubSelCheckbox = knimeService.createMenuCheckbox('publishSelectionCheckbox', options.publishSelection, function() {
					if (this.checked) {
						options.publishSelection = true;
						knimeService.setSelectedRows(options.tableId, getSelection(), selectionChanged);
					} else {
						options.publishSelection = false;
					}
				});
				knimeService.addMenuItem('Publish selection', pubSelIcon, pubSelCheckbox);
				
				// subscription
				var subSelIcon = knimeService.createStackedIcon('check-square-o', 'angle-double-right', 'faded right sm', 'left bold');
				var subSelCheckbox = knimeService.createMenuCheckbox('subscribeSelectionCheckbox', options.subscribeSelection, function() {
					if (this.checked) {
						knimeService.subscribeToSelection(options.tableId, selectionChanged);
					} else {
						knimeService.unsubscribeSelection(options.tableId, selectionChanged);
					}
				});
				knimeService.addMenuItem('Subscribe to selection', subSelIcon, subSelCheckbox);
				if (options.subscribeSelection) {
					knimeService.subscribeToSelection(options.tableId, selectionChanged);
				}
	    	}
	    }
	    
	}
    
    selectionChanged = function(data) {
    	if (data) {
    		if (data.changeSet) {
    			// incremental update
    			if (data.changeSet.removed) {
    				for (var i = 0; i < data.changeSet.removed.length; i++) {
    					selection.remove(data.changeSet.removed[i]);
    				}
    			}
    			if (data.changeSet.added) {
    				for (var i = 0; i < data.changeSet.added.length; i++) {
    					selection.add(data.changeSet.added[i]);
    				}
    			}
    		} else {
    			// reset selection
    			selection = d3.set();
    			for (var elId = 0; elId < data.elements.length; elId++) {
    				var element = data.elements[elId];
    				if (!element.rows) {
    					continue;
    				}
    				for (var rId = 0; rId < element.rows.length; rId++) {
    					selection.add(element.rows[rId]);
    				}
    			}
    		}
    	} else {
    		selection = d3.set();
    	}
    	traverseAndCollect(decTree.root, function(d) {
    		if (hasChildren(d)) {
    			// inner node
    			updateSelectionFractionFromChildren(d);
    		} else {
    			// leaf
    			var selected = 0;
    			for (var i = 0; i < d.rowKeys.length; i++) {
    				if (selection.has(d.rowKeys[i])) {
    					selected++;
    				}
    			}
    			
    			var frac = selected / d.rowKeys.length;
    			if (isNaN(frac)) {
    				d.fracSelected = 0;
    			} else {
    				d.fracSelected = frac;
    			}
    		}
    	});
    	dtd.update(decTree.root);
    	checkClearSelectionButton();
    }
    
    checkClearSelectionButton = function() {
		var button = d3.select("#dectree-selection-reset-button");
		if (!button.empty()){
			button.classed("inactive", function() {
				return selection.empty()
			});
		}
	}
    
    updateTitle = function() {
    	var hadTitle = (title.length > 0);
        title = document.getElementById("chartTitleText").value;
        var hasTitle = (title.length > 0);        
        if (hasTitle != hadTitle) {
        	// if the title appeared or disappeared, we need to resize the chart
        	d3.select("#subtitle").attr("y", hasTitle ? 46 : 20);
            layout();
        }
        d3.select("#title").text(title);
	};
	
	updateSubtitle = function() {
		var hadTitle = (subtitle.length > 0);
        subtitle = document.getElementById("chartSubtitleText").value;
        var hasTitle = (subtitle.length > 0);
        if (hasTitle != hadTitle) {
        	// if the subtitle appeared or disappeared, we need to resize the chart
            layout();
        }
        d3.select("#subtitle").text(subtitle)
        	.attr("y", title.length > 0 ? 46 : 20);
	};
	
	function layout() {
		var topMargin = 10;
        if (title && subtitle) {
        	topMargin += 50;        	
        } else if (title) {
        	topMargin += 36;
        } else if (subtitle) {
        	topMargin += 26;        	        	
        }
        
        var margin = {
    		top : topMargin,
			left : 40,
			bottom : 40,
			right : 10
    	};
        
//        translation[0] = margin.left;
//        translation[1] = margin.top;
		var bbox = d3.select("#titles").node().getBBox();	
		posTree = [10, topMargin];
//		d3.select("#titles").attr("transform", "translate(0, 24)");
		d3.select("#decTree")
			.attr("transform", "translate(" + posTree + ")");
		resizeSVG();
	}
	
	
	
	function updateScrollPosition(updateVec) {
		var scrollContainer = d3.select("#layoutContainer").node();
		scrollContainer.scrollLeft += updateVec[0];
		scrollContainer.scrollTop += updateVec[1];
	}
	
	function moveTreeToPositive() {
    	var t = d3.select("#decTree").select("g");
    	var bbox = t.node().getBBox();
    	if (bbox.x < 0) {
    		var oldTrans = translation.slice();
    		translation[0] = -bbox.x;
    		translation[1] = -bbox.y;
    		t.attr("transform", "translate(" + scaledArray(translation, scale) + ") scale(" + scale + ")");
    	}
    	return [translation[0] - oldTrans[0], translation[1] - oldTrans[1]];
    }
    
    function resizeSVG() {
    	var pxlsMoved = moveTreeToPositive();
    	d3.select("#bgr").attr("height", 0).attr("width", 0);
    	var tbox = d3.select("#decTree").select("g").node().getBBox();
    	d3.select("#da")
    		.attr("height", scale * tbox.height)
    		.attr("width", scale * tbox.width);
    	var bbox = d3.select("#plot").node().getBBox();
//		translation[0] = dtd.margin[0] - bbox.x; 
		d3.selectAll("svg, #bgr")
			.attr("height", 10+2*bbox.y + bbox.height)
			.attr("width", 10 + 2*bbox.x + bbox.width);
		updateScrollPosition(pxlsMoved);
    }
    
    function drawTree() {
    	
    	var svg = d3.select("#decTree");
        // zooming and panning
    	if (options.enableZooming) {
        var zoom = d3.behavior.zoom().on("zoom", function() {
//        	translation = arraySum(translation, d3.event.translate);
        	scale = d3.event.scale;
        	var panVec = d3.event.translate;
        	d3.select("#decTree").select("g").attr("transform", "translate(" + d3.event.translate + ") scale(" + scale + ")");
        	zoom.translate([0,0]);
//        	translation = calculatePanningVector(translation, d3.event.translate);
//        	updateScrollPosition(d3.event.translate);
//        	console.log(panVec);
        	panVec[0] = d3.max([0, panVec[0]]);
        	panVec[1] = d3.max([0, panVec[1]]);
            resizeSVG();
            });
//            .translate([width / 2, dtd.margin[1]]);
        	svg.call(zoom)
                .on("dblclick.zoom", null);
    	}
         svg = svg.append("g");
        
        d3.select("#da").style("stroke", options.dataAreaColor).style("stroke-width", "5px");
        
        // this is kind of fishy...
        dtd.update = update;
        var id = 0;
        var tree = d3.layout.flextree()
            .nodeSize(function(d) {
                return [calcNodeWidth(d), calcNodeHeight(d)];
            });
    
        tree.spacing(function(a, b) {
            return 20;
        });
        
        tree.setNodeSizes(true);
        
        var diagonal = d3.svg.diagonal()
            .projection(function(d) { return [d.x, d.y]; });

        root = decTree.root;    
        root.x0 = 0;
        root.y0 = 0;
        
  
        update(root);

        function update(source) {

            // Compute the new tree layout.
            var nodes = tree.nodes(root).reverse(),
                links = tree.links(nodes);

            // Normalize for fixed-depth.
            nodes.forEach(function(d) {
                var y, v;
                y = 0;
                v = d;
                while (v.parent) {
                    v = v.parent;
                    y += v.y_size + 50;
                }
                d.y = y;
            });

            // Update the nodes�
            var node = svg.selectAll("g.node")
                .data(nodes, function(d) { return d.id || (d.id = ++id); });

            // Enter any new nodes at the parent's previous position.
            var nodeEnter = node.enter().insert("g", "g.node")
                .attr("class", "node")
                .attr("opacity", "1e-6")
                .attr("transform", function(d) { return "translate(" + (source.x0) + "," + (source.y0) + ")" + " scale(1,1e-6)"; });

            // draw node rectangle
            nodeEnter.append("rect")
                .attr("x", function(d) { return -d.x_size / 2; })
                .attr("width", 1e-6)
                .attr("height", 1e-6)
                .attr("rx", 3)
                .attr("ry", 3)
                .style("fill", options.nodeBackgroundColor)
                .style("stroke", "steelblue")
                .style("stroke-width", "5px");
            
            
            // draw content
            var contentGroup = nodeEnter.append("g")
            	.attr("class", "content");
            
            var numAttributes = dtd.panels.length;
            var i = 0;
            // iterate over panels and draw if information is available
            for (i = 0; i < numAttributes; i++) {
                var panel = dtd.panels[i].enter(contentGroup);
                positionPanel(panel, i);
            }
            
            // draw selection panel
            if (options.enableSelection) {
            	var selGroup = nodeEnter.append("g")
            		.attr("class", "selection");
            	// caption
            	selGroup.append("text")
            		.attr("y", fontsize)
            		.text("Selection:");
            	var captionLength = getTextSize("Selection:");
            	// checkbox
            	selGroup.append("text")
            		.attr("class", "selection-checkbox")
            		.attr("cursor", "pointer")
            		.attr("y", fontsize)
            		.attr("x", captionLength.width + 3)
            		.attr('font-family', 'FontAwesome')
            		.text("\uf096")
            		.on("click", selectClick);
            	selGroup.append("rect")
            		.attr("class", "selection-outer-bar")
            		.attr("y", fontsize + 3)
            		.attr("width", function(d) {
            			return d.x_size - 2 * dtd.margin[0];
            		})
            		.attr("height", fontsize)
            		.attr("fill", options.nodeBackgroundColor)
            		.attr("fill-opacity", 0)
            		.attr("stroke", "black")
            		.attr("stroke-width", "1px");
            	selGroup.append("rect")
            		.attr("class", "selection-bar")
            		.attr("y", fontsize + 3)
            		.attr("width", 0)
            		.attr("height", fontsize)
            		.attr("fill", "#ffcc00")
            		.attr("stroke-width", "1px")
            		.attr("stroke-opacity", 0);
            }

            // draw button for collapsing/expanding
            var expandCollapseGroup = nodeEnter.append("g")
                .filter(hasChildren)
                .style("cursor", "pointer")
                .attr("class", "expandCollapseButton")
                .attr("transform", function(d) { return "translate(" + 0 + "," + (d.y_size - appendixHeight + fontsize /*+ fontsize + 10*/) + ")"; })
                .on("click", click);

            expandCollapseButton(expandCollapseGroup);
  
            var splitAttribute = function(d) {
            	var lc = d.children ? d.children[0] : d._children[0];
                return lc.condition.splitAttribute;
            };
            
            var splitGroup = nodeEnter.append("g")
                .filter(hasChildren)
                .attr("class", "split")
                .style("fill-opacity", 1e-6)
                .attr("transform", function(d) {
                    return "translate(" + 0 + "," + (d.y_size - appendixHeight) + ")"; 
                });
            splitGroup.append("rect")
            	.attr("height", fontsize)
            	.each(function(d) {
            		var width = getTextSize(splitAttribute(d)).width;
            		d3.select(this).attr("width", width)
            			.attr("transform", "translate(-" + width/2 + ",0)");
            	})
            	.style("fill", options.dataAreaColor)
            	.style("stroke", options.dataAreaColor);
            splitGroup.append("text")
                .style("text-anchor", "middle")
                .text(splitAttribute)
                .call(offsetText);

            var conditionGroup = nodeEnter.append("g")
                .filter(function(d) { return d.condition; })
                .attr("class", "condition")
                .attr("transform", "translate(0, -15)");
            conditionGroup.append("text")
                .style("text-anchor", "middle")
                .attr("title", conditionText)
                .text(briefCondText)
                .call(offsetText);
            
            function briefCondText(d) {
                var text = conditionText(d);
                    if (d.length > 10) {
                        text = text.substr(0, 7);
                        text += "...";
                    }
                    return text;
            }
            
            var conditionBackground = conditionGroup.insert("rect", "text")
                .attr("x", function(d) {
                    return -briefCondText(d).length * 6 / 2 + "px";
                })
                .attr("width", function(d) {
                    return briefCondText(d).length * 6 + "px";
                })
                .attr("height", fontsize)
                .style("fill", options.dataAreaColor)
                .style("stroke", options.dataAreaColor);

            // Transition nodes to their new position.
            var nodeUpdate = node.transition()
                .duration(halfDuration)
                .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")" + " scale(1,1)"; });
               
            nodeUpdate.duration(halfDuration)
            	.attr("opacity", "1");
            
            
            nodeUpdate.select("rect")
        	.attr("x", function(d) { return -d.x_size / 2; })
            .attr("width", function(d) { return d.x_size; })
            .attr("height", function(d) { return d.y_size - appendixHeight - dtd.margin[1]; });
//            .style("fill", function(d) { return /*d._children ? "lightsteelblue" :*/ "#fff"; });
            

    
            for(i = 0; i < numAttributes; i++) {
                var panel = dtd.panels[i].update(/*nodeUpdate*/node);
                positionPanel(panel, i);
            }
            if (options.enableSelection) {
            	var selG = nodeUpdate.selectAll(".selection");
            	selG.attr("transform", function(d) {
            		return "translate(" + (-d.x_size / 2 + dtd.margin[0]) + "," 
        			+ (d.y_size - 2*(2*fontsize + 3) - appendixHeight) + ")";
            	})
            	selG.selectAll(".selection-outer-bar")
            		.attr("width", function(d) {
            			return d.x_size - 2 * dtd.margin[0];
            		});
            	selG.selectAll(".selection-bar")
            		.attr("width", function(d) {
            			return d.fracSelected * (d.x_size - 2 * dtd.margin[0]);
            		});
            	selG.selectAll(".selection-checkbox")
            		.text(function(d) {
            			return d.fracSelected > 0 ? "\uf046" : "\uf096";
            		})
            }

            var expandCollapseButtonUpdate = nodeUpdate.select(".expandCollapseButton")
                .attr("transform", function(d) { return "translate(0," + (d.y_size - appendixHeight + fontsize + dtd.margin[1]) + ")"; })
            expandCollapseButtonUpdate.select(".plus")
                .style("stroke", function(d) {
                	return d._children ? "black" : "transparent"; });
            expandCollapseButtonUpdate.select(".minus")
                .style("stroke", function(d) { 
                	return d.children ? "black" : "transparent"; });
    
            nodeUpdate.select(".split")
                .attr("transform", function(d) { return "translate(0," + (calcNodeHeight(d) - appendixHeight) + ")"; })
                .style("fill-opacity", 1);
      

            // Transition exiting nodes to the parent's new position.
            var nodeExit = node.exit().transition()
                .duration(halfDuration)
                .attr("opacity", "1e-6")
                .duration(halfDuration)
                .attr("transform", function(d) { 
                	return "translate(" + source.x + "," + source.y + ")" + " scale(1,1e-6)";
                })
                .remove();

            // Update the links�  
            var link = svg.selectAll("path.link")
                .data(links, function(d) { return d.target.id; });
    
            // Enter any new links at the parent's previous position.
            link.enter().insert("path", "g")
                .attr("class", "link")
                .style("stroke-width", "2px")
                .style("fill", "none")
                .style("stroke", "#ccc")
                .attr("d", function(d) {
                    var o = {x: source.x0, y: source.y0};
                    return diagonal({source: o, target: o});
                });
               

            // Transition links to their new position.
            link.transition()
                .duration(halfDuration)
                .attr("d", diagonal);

            // Transition exiting nodes to the parent's new position.
            link.exit().transition()
                .duration(halfDuration)
                .attr("d", function(d) {
                    var o = {x: source.x, y: source.y};
                    return diagonal({source: o, target: o});
                })
                .remove();

            // Stash the old positions for transition.
            nodes.forEach(function(d) {
                d.x0 = d.x;
                d.y0 = d.y;
            });
            
            // update size of containing svg (assume that there is only one svg)
            d3.select("svg")
            	.transition()
//            	.delay(halfDuration)
            	.duration(halfDuration)
            	.tween("svgResize", function() {
            		return resizeSVG;
            	});
//            	.each("end", resizeSVG);
            	
        }
        
        // Toggle children on click.
        function click(d) {
        	var status = getNodeStatus(d);
            status ^= 1;
            setNodeStatus(d, status);
            if (d.children) {
            	d._children = d.children;
            	d.children = null;
            } else {
            	d.children = d._children;
            	d._children = null;
            }
            update(d);
        }
        
        function selectClick(d) {
        	if (d.fracSelected > 0) {
        		d.isSelected = false;
        		unselect(d);
        	} else {
        		d.isSelected = true;
        		select(d);
        	}
        	update(d);
        	checkClearSelectionButton();
        }
        
    }
    
    
    
    calcNodeWidth = function(d) {
        var i, att,
            numAttributes = dtd.panels.length,
            width = 0
            xMargin = dtd.margin[0];
        for (i = 0; i < numAttributes; i++) {
            att = dtd.panels[i];
            var attName = att.name;
            if (d.content[attName] || d.content["_" + attName]) {
                var nw = att.width(d) + 2*xMargin;
                width = d3.max([width, nw]);
            }
        }
        return width;
    }
    
    calcNodeHeight = function(d) {
        var i, att,
            numAttributes = dtd.panels.length,
            height = dtd.margin[1];
        // sum panel heights
        for (i = 0; i < numAttributes; i++) {
            att = dtd.panels[i];
            var attName = att.name;
            if (d.content[attName] || d.content["_" + attName]) {
                var attHeight = att.height(d);
                height += attHeight + dtd.margin[1];
            }
        }
        if (options.enableSelection) {
        	height += dtd.margin[1] + 2 * fontsize + 3;
        }
        height += dtd.margin[1];
        height += appendixHeight;
        return height;
    }
    
    function positionPanel(panel, idx) {
        panel.transition().duration(halfDuration).attr("transform", function(d) {
            var i, x, y;
            x = 0;
            y = dtd.margin[1];
            for (i = 0; i < idx; i++) {
                var p = dtd.panels[i];
                if (d.content[p.name] || d.content["_" + p.name]) {
                    y += p.height(d) + dtd.margin[1];
                }
            }
            var nw = calcNodeWidth(d);
            var w = dtd.panels[idx].width(d);
            var wDif = nw - w;
            x = -nw / 2 + wDif / 2;
            return "translate(" + x + "," + y + ")";
        });
    }
    
    
    
    
    function expandCollapseButton(group) {
        var radius = 5;
        group.attr("button", "pointer");
        group.append("circle")
            .attr("r", radius)
            .style("stroke", "black")
            .style("stroke-width", "1px")
            .style("fill", "white");

        var length = radius - 1;
        group.append("path")
            .attr("class", "plus")
            .style("stroke", "black")
            .attr("d", "M0 -" + length + " L0 " + length + " M-" + length + " 0 L" + length + " 0");

        group.append("path")
            .attr("class", "minus")
            .style("stroke", "black")
            .attr("d", "M-" + length + " 0 L" + length + " 0");
    }
    
    function resolveOperator(condition) {
    	var op;
    	if(condition.name == "SimpleSetPredicate") {
    		op = condition.setOperator;
    	} else if (condition.name == "SimplePredicate") {
    		op = condition.operator;
    	}
        switch (op) {
            case "equal":
                return "=";
            case "lessOrEqual":
                return "\u2264";
                break;
            case "greaterOrEqual":
                return "\u2265";
                break;
            case "greaterThan":
            	return ">";
            case "IS_IN":
                return "\u2208";
                break;
            case "IS_NOT_IN":
            	return "\u2209";
            	break;
            default:
                return "something went wrong!";
        }
    }   

    function printValue(condition) {
        var text = "";
        if (condition.name == "SimplePredicate") {
        	var val = numFormatter.to(Number(condition.threshold));
        	if (!val) {
        		val = condition.threshold;
        	}
            text += val;
        } else {
            text += "[";
            var numVals = condition.values.length;
            for (var i = 0; i < numVals; i++) {
                text += condition.values[i];
                if (i != numVals - 1) {
                    text += ", ";
                }
            }
            text += "]";
        }
        return text;
    }

    function conditionText(d) {
        var text = "";
        text += resolveOperator(d.condition);
        text += " ";
        text += printValue(d.condition);
        return text;
    }

    function offsetText(text) {
    	var dy = getOffset(text);
    	text.attr("y", dy);
    }
    
    function getOffset(text) {
    	var dy;
    	if (text.empty()) {
    		dy = 0;
    	} else {
    		dy = text.style("font-size");
    		dy = dy.replace("px", "");
    		// manipulate shift in order to simulate hanging
    		dy *= 0.7;
    	}
    	return dy;
    }
    
    /**
     * Makes metaData accessible for external functions.
     */
    function createFunctionWrapper(func) {
    	var metaData = decTree.metaData;
    	var wrappedFunction = function(d) {
    		var result = func(d, metaData);
    		return result;
    	}
    	return wrappedFunction;
    }
    
    this.createSimpleTextPanel = createSimpleTextPanel;
    function createSimpleTextPanel(attributeName, panelID, content) {
    	var panelName = attributeName + panelID;
    	var wrappedContent = createFunctionWrapper(content);
        var enter = function(node) {
            var panel = node.append("g")
                .filter(createFilter(attributeName))
                .attr("class", panelName);
            
            panel.append("text")
                .text(wrappedContent)
                .style("fill-opacity", 1e-6)
                .call(offsetText);
            return panel;
        };
        var update = function(node) {
            var panel = node.select("." + panelName)
            panel.select("text")
                .style("fill-opacity", 1);
            return panel;
        };
        var width = function(d) { return getTextSize(wrappedContent(d)).width; };
        var height = function(d) { return fontsize; };
        return new Panel(attributeName, enter, update, width, height);
    }
    
    this.createCollapsiblePanel = createCollapsiblePanel;
    /**
    * attributeName: name of the attribute the panel is supposed to display
    * header: header text (or function creating it)
    * content: function that adds content to collapsible panel
    */
    function createCollapsiblePanel(attributeName, panelID, header, enterContent, contentWidth, contentHeight) {
    
        var panelName = attributeName + panelID;
        var padding = 5;
        function drawTriangle(d) {
            if (panelActivated(d)) {
                return "M0,0 L9,0 L5,9 L0,0";
            } else {
                return "M0,0 L9,5 L0,9 L0,0";
            }
        }
        var toggleBody = function(d) {
            return panelActivated ? 1 : 1e-6;
        }
        var enter = function(node) {
            var panel = node.append("g")
                .filter(createFilter(attributeName))
                .attr("class", panelName);
        
            // border for body
            panel.append("rect")
                .attr("class", "collapsibleBorder")
                .attr("y", 5)
                .style("stroke-width", "0.3px")
                .style("stroke", "black")
//                .style("fill", "transparent")
                .style("fill-opacity", 1e-6);
        
            var symbol = d3.svg.symbol().size(50).type("triangle-up");
            var headerPanel = panel.append("g")
                .attr("class", "collapsibleHeader");
        
            // header background
            headerPanel.append("rect")
            	.attr("class", "in-node-text-background")
                .style("stroke", options.nodeBackgroundColor)
                .style("fill", options.nodeBackgroundColor)
                .attr("height", fontsize)
                .attr("x", 5)
                .attr("width", headerWidth);
            // dropdown button
            headerPanel.append("path")
                .attr("d", drawTriangle)
                .attr("transform", "translate(5, 0)")
                .style("cursor", "pointer")
                .style("fill-opacity", 1e-6)
                .on("click", createToggleAttribute(panelName, panelID));
            // header text
            var headerText = headerPanel.append("text")
                .text(header)
                .style("fill-opacity", 1e-6)
                .attr("x", 15)
                .call(offsetText);
            var body = panel.append("g")
                .attr("class", "collapsibleBody")
                .attr("transform", "translate(10,13)");
            
//            enterContent(body);
            return panel;
        };
    
        var update = function(node) {
            var panel = node.select("." + panelName);
            
            // enter new content
            panel.select(".collapsibleBody")
            	.filter(function(d) {
                	return panelActivated(d) && !this.hasChildNodes();
                })
                .append("g")
                .attr("class", "collapsibleBodyContent") // create group for content
                .attr("transform", "scale(1e-6, 1e-6)")
                .call(enterContent);
            
            var updatePanel = panel.transition().duration(halfDuration);

            // update header
            var headerPanel = updatePanel.select(".collapsibleHeader");
            // draw triangle according to status
            headerPanel.select("path")
                .style("fill-opacity", 1)
                .attr("d", drawTriangle);
            // make header text visible
            headerPanel.select("text")
                .style("fill-opacity", 1);
            
        
            updatePanel.select(".collapsibleBorder")
                .attr("height", function(d) {
                    return panelActivated(d) ? height(d) - 5 : 0;
                })
                .attr("width", width);
            
            
            updatePanel.filter(panelActivated) 
            	.select(".collapsibleBodyContent")
            	.attr("transform", "scale(1,1)");
            
            // roll up content for deactivated bodies
            updatePanel.filter(function(d) {
            		return !panelActivated(d);
//            		return d[panelName] === undefined || !d[panelName];
            	})
            	.select(".collapsibleBodyContent")
            	.attr("transform", "scale(1e-6, 1e-6)")
            	.remove();
        
            return panel;
        };
        
        function panelActivated(d) {
        	var panelMask = (1 << panelID);
        	var activated = getNodeStatus(d) & panelMask;
        	return activated == panelMask;
        }
        
        function headerWidth(d) {
            return getTextSize(header(d)).width + 10;
        }   
    
        var width = function(d) {
            var hw = headerWidth(d);
            var bw;
            if (panelActivated(d)) {
            	bw = contentWidth(d) + 10;
            } else {
            	bw = 0;
            }
            var w = d3.max([hw, bw]);
            return w + padding;
        };
    
        var height = function(d) {
            var hh = fontsize;
            if (panelActivated(d)) {
                return hh + contentHeight(d) + 2 * padding;  
            } else {
                return hh;
            }
        };
        return new Panel(attributeName, enter, update, width, height);
    }
    
    //******* Helper methods for panel creation *************
    function createToggleAttribute(name, id) {
        var toggle = function(d) {
        	var status = getNodeStatus(d);
        	status ^= (1 << id);
        	setNodeStatus(d, status);
            if (d[name]) {
                d[name] = false;
            } else {
                d[name] = true;
            }
            dtd.update(d);
        };
        return toggle;
    }

    function createFilter(attributeName) {
        return function(d) {
            return d.content[attributeName] || d.content["_" + attributeName];
        };
    }
    
    function getRoot(node) {
    	var cn = node;
    	while (cn.parent != null) {
    		cn = cn.parent;
    	}
    	return cn;
    }
    
    this.getTextSize = getTextSize;
    /**
     * Returns the size the text will take on in the svg.
     * Height and width are accessible by size.height and size.width
     */
    function getTextSize(text) {
    	var textElement = d3.select("svg")
    		.append("text")
    		.text(text);
    	var size = textElement.node().getBBox();
    	textElement.remove();
    	return {width : size.width, height : size.height};
    }
    
    
    function ClassTableCreator(decTree, dx, dy) {
    	var classNames = decTree.metaData.classNames;
        var nc = classNames.length;
        var catColLength = function() {
            var i, length;
            length = 50;
            for (i = 0; i < nc; i++) {
                length = d3.max([length, classNames[i].length * 7]);
            }
            return length;
        }();
        
        function tableWidth(d) {
            var width, maxNum, sum, i;
            // last term stands for the size of percentage column
            width = catColLength + 2*dx + 25;
            maxNum = 0;
            
            for (i = 0; i < nc; i++) {
                maxNum = d3.max([maxNum, ("" + d.content.classCounts[i]).length]);
                sum += maxNum;
            }
            
            width += getTextSize("" + sum).width;
            return width;
        }
        
        this.tableWidth = tableWidth;
        var fixedHeight = (nc + 2) * fontsize + (nc + 1) * dy;
        this.tableHeight = function(d) {
            return fixedHeight;
        }
        
        var xPerc = catColLength + dx;
        var xNum = xPerc + 25 + dx;
        
        this.createClassTable = createClassTable;
        
        function createClassTable(body) {
        
            // write header
        	var tableGroup = body.append("g");
            /* Chrome doesn't display tspan table correctly (likely a bug) so we have to use individual text elements
             * and position them via translate
             */
        	tableGroup.append("text")
        		.text("Category");
        	tableGroup.append("text")
        		.attr("transform", "translate(" + xPerc + ",0)")
        		.text("%");
        	tableGroup.append("text")
        		.attr("transform", "translate(" + xNum + ",0)")
        		.text("n");
            // write body
//            fillInClasses(table);
        	fillInClasses(tableGroup);
            // write total row
            var totalCount = getNumTotal(decTree.root);
            var yTotal = (nc + 1) * (dy + fontsize);
            tableGroup.append("text")
            	.attr("transform", "translate(0," + yTotal + ")")
            	.text("Total");
            tableGroup.append("text")
            	.attr("transform", "translate(" + xPerc + "," + yTotal + ")")
            	.text(function(d) {
            		var perc = 100* getNumTotal(d) / totalCount;
            		if (perc % 1 === 0) {
            			// percentage is integer -> add .0
            			return perc + ".0";
            		}
            		return Number((perc).toFixed(1));
            	});
            tableGroup.append("text")
            	.attr("transform", "translate(" + xNum + "," + yTotal + ")")
            	.text(getNumTotal);
            // position text below y coordinate
            tableGroup.attr("transform", "translate(0," + fontsize + ")");
                
            // add lines
            body.append("line")
                .attr("x1", 0)
                .attr("x2", tableWidth)
                .attr("y1", fontsize + dy / 2)
                .attr("y2", fontsize + dy / 2)
                .style("stroke-width", 0.3)
                .style("stroke", "black");
            body.append("line")
                .attr("x1", 0)
                .attr("x2", tableWidth)
                .attr("y1", fixedHeight - fontsize - dy / 2)
                .attr("y2", fixedHeight - fontsize - dy / 2)
                .style("stroke-width", 0.3)
                .style("stroke", "black");
            
            function fillInClasses(table) {
                var i;         
                for (i = 0; i < nc; i++) {
                	var cy = (i + 1) * (dy + fontsize);
                	table.append("text")
                		.attr("transform", "translate(0," + cy + ")")
                		.text(decTree.metaData.classNames[i]);
                	table.append("text")
                		.attr("transform", "translate(" + xPerc + "," + cy + ")")
                		.text(function(d) {
                			var perc = 100 * d.content.classCounts[i] / getNumTotal(d);
                			var num = Number((perc).toFixed(1));
                			if (num % 1 === 0) {
                    			// percentage is integer -> add .0
                    			return num + ".0";
                    		}
                			return num;
                		});
                	table.append("text")
                		.attr("transform", "translate(" + xNum + "," + cy + ")")
                		.text(function(d) {
                			return d.content.classCounts[i];
                		});
                }
            }
            
            function getNumTotal(d) {
                var i, numTotal;
                numTotal = 0;
                for (i = 0; i < nc; i++) {
                    numTotal += d.content.classCounts[i];
                }
                return numTotal;
            }
        }
        
        this.updateClassTable = updateClassTable;
        function updateClassTable(body, activation) {
            body.selectAll("text")
                .style("fill-opacity", function() {
                    return activation ? 1 : 1e-6;
                });
            body.selectAll("line")
                .style("stroke-width", function(d) {
                    return activation ? 0.3 : 1e-6;
                });
        }
    }
}