/* global knimeService:false, d3:false, kt:false, nv:false */
(grouped_bar_chart_namespace = function () {

    var barchart = {};
    var layoutContainer;
    var MIN_HEIGHT = 100, MIN_WIDTH = 100;
    var _representation, _value;
    var chart, svg;
    var knimeTable;

    var plotData;
    var wrapedPlotData;
    var colorRange;
    var categories;
    var freqCols;
    var _translator;
    var _keyNameMap;

    /**
	 * 2d-array where for each category (indexing follows categories array) we
	 * store an array of those frequency columns, which have a missing value in
	 * the current category. This allows to exclude specific bars or even the
	 * whole category. Storing by category helps to group warnings also by
	 * category. Required for missing values handling.
	 */
    var missValInCat;

    /**
	 * Array where for each frequency column, which has in all other categories
	 * only missing values, we store whether it has a value in the Missing
	 * values category. This allows to decide, if we should keep this freq
	 * column (if it has a value in MissValCat and the option "include
	 * MissValCat" is on) or exclude it. Each item has the fields: col - name of
	 * freq column hasValueOnMissValCat - whether the column has a non-missing
	 * value in the Missing values category (true/false) Required for missing
	 * values handling.
	 */
    var freqColValueOnMissValCat;

    /**
	 * Array where for each frequency column, which has non-missing value in the
	 * Missing values category, we store this value. We need to store it
	 * separately to quickly add/remove them to the plot data, when the option
	 * "include MissValCat" is getting switched. Each item has the fields: col -
	 * name of freq column value - non-missing value, this freq column has in
	 * the Missing values category Required for missing values handling.
	 */
    var missValCatValues;

    /**
	 * Boolean flag - is the Missing values category present in the dataset.
	 * Required for missing values handling.
	 */
    var isMissValCat;

    /**
	 * Map where keys - frequency column names, values - array of those
	 * categories for which the bar, specified by the corresponding freq column
	 * and the category, was excluded from the view. There excluded bars
	 * actually specify those dummy null values, we have to add to the stacked
	 * chart to fix it. Choosing freq cols as keys helps adding dummy nulls
	 * since the plot dataset has to be key->values. Required for missing values
	 * handling.
	 */
    var excludeFreqColCatMap;
    
    var showWarnings;

    var MISSING_VALUES_LABEL = 'Missing values';
    var MISSING_VALUES_ONLY = 'missingValuesOnly';
    var FREQ_COLUMN_MISSING_VALUES_ONLY = 'freqColumnMissingValuesOnly';
    var CATEGORY_MISSING_VALUES_ONLY = 'categoryMissingValuesOnly';
    var NO_DATA_AVAILABLE = 'noDataAvailable';

    barchart.init = function (representation, value) {
        _value = value;
        _value.options['selection'] = _value.options['selection'] || [];
        _representation = representation;
        if(_representation.inObjects[0].translator) {
        	_translator = _representation.inObjects[0].translator;
        	_translator.sourceID = _representation.inObjects[0].uuid;
        	_translator.targetIDs = [_representation.tableIds[0]];
        	knimeService.registerSelectionTranslator(_translator, _translator.sourceID);
        	subscribeToSelection(_value.options.subscribeToSelection);
        	_keyNameMap = new KeyNameMap(getClusterToRowMapping());
        }
        
        showWarnings = _representation.options.showWarnings;

        if (_representation.warnMessage && showWarnings) {
            knimeService.setWarningMessage(_representation.warnMessage);
        }

        drawChart();
        if (_representation.options.enableViewControls) {
            drawControls();
        }
    };
    

    function drawChart(redraw) {

        d3.select('html').style('width', '100%').style('height', '100%');
        d3.select('body').style('width', '100%').style('height', '100%');
        /*
		 * Process options
		 */
        var viewControls = _representation.options.enableViewControls;
        var optWidth = _representation.options['width'];
        var optHeight = _representation.options['height'];

        var optTitle = _value.options['title'];
        var optSubtitle = _value.options['subtitle'];
        var optCatLabel = _value.options['catLabel'];
        var optFreqLabel = _value.options['freqLabel'];

        var optStaggerLabels = _representation.options['staggerLabels'];
        var optLegend = _representation.options['legend'];

        var optOrientation = _value.options['orientation'];

        var optFullscreen = _representation.options['svg']['fullscreen'] && _representation.runningInView;
        var optWidth = _representation.options['svg']['width'];
        var optHeight = _representation.options['svg']['height'];

        var isTitle = optTitle || optSubtitle;

        var body = d3.select('body');

        var width = optWidth + 'px';
        var height = optHeight + 'px';
        if (optFullscreen) {
            width = '100%';
            height = (isTitle) ? '100%' : 'calc(100% - ' + knimeService.headerHeight() + 'px)';
        }

        var div;
        if (redraw) {
            d3.select('svg').remove();
            div = d3.select('#svgContainer');
        } else {
            layoutContainer = body.append('div')
                .attr('id', 'layoutContainer')
                .attr('class', 'knime-layout-container')
                .style('width', width)
                .style('height', height)
                .style('min-width', MIN_WIDTH + 'px')
                .style('min-height', MIN_HEIGHT + 'px');

            div = layoutContainer.append('div')
                .attr('id', 'svgContainer')
                .attr('class', 'knime-svg-container')
                .style('min-width', MIN_WIDTH + 'px')
                .style('min-height', MIN_HEIGHT + 'px');
        }

        var svg1 = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        div[0][0].appendChild(svg1);

        svg = d3.select('svg')
            .style('display', 'block')
            .classed('colored', true);
        
        
        // handle clicks on background to deselect current selection
        svg.on("click", function() {
        	removeHilightBar("",true);
        	_value.options['selection'] = [];
        	publishSelection(true);
        });
        

        if (!optFullscreen) {
            if (optWidth > 0) {
                div.style('width', optWidth + 'px');
                svg.attr('width', optWidth);
                // Looks like the below doesn't work,
                // above does work...
                // chart.width(optWidth);
            }
            if (optHeight > 0) {
                svg.attr('height', optHeight);
                div.style('height', optHeight + 'px');
                // Looks like the below doesn't work,
                // above does work...
                // chart.height(optHeight);
            }
        } else {
            // Set full screen height/width
            div.style('width', '100%');
            div.style('height', height);

            svg.attr('width', '100%');
            svg.attr('height', '100%');
        }

        if (!redraw) {
            /*
			 * Process data
			 */
            knimeTable = new kt();
            // Add the data from the input port to the knimeTable.
            var port0dataTable = _representation.inObjects[0].table;
            knimeTable.setDataTable(port0dataTable);

            processData();
        }

        /*
		 * Plot chart
		 */
        nv.addGraph(function () {

            if (optOrientation) {
                chart = nv.models.multiBarHorizontalChart();
            } else {
                chart = nv.models.multiBarChart();
                chart.reduceXTicks(false);
            }

            chart.dispatch.on('renderEnd.css', setCssClasses);
            // tooltip is re-created every time therefore we need to assign
            // classes accordingly
            chart.multibar.dispatch.on('elementMouseover.tooltipCss', setTooltipCssClasses);
            chart.multibar.dispatch.on('elementMousemove.tooltipCss', setTooltipCssClasses);
            chart.legend.dispatch.on('legendClick', function(series, index) {
            	drawChart(true);
            });

            var stacked = _value.options.chartType == 'Stacked';
            if (stacked) {
                fixStackedData(true); // add dummy nulls
            }
            chart.stacked(stacked);

            chart
                .color(colorRange)
                .duration(0)
                .margin({ right: 20, top: 60 })
                .groupSpacing(0.1);

            updateTitles(false);

            chart.showControls(false); // all the controls moved to Settings menu
            chart.showLegend(optLegend);

            updateAxisLabels(false);
            svg.datum(plotData).transition().duration(0).call(chart);
            nv.utils.windowResize(function () { updateAxisLabels(true); updateLabels(); setCssClasses(); });
            
            // redraws selection
            redrawSelection();
            return chart;
        });
    }
    
    function registerClickHandler () {
    	d3.selectAll(".nv-bar").on('click',function(event) {
			handleHighlightClick(event);
			d3.event.stopPropagation();
    	});
    }
    
    function redrawSelection() {
    	for(var i = 0; i < _value.options['selection'].length; i++) {
    		createHilightBar(_keyNameMap.getNameFromKey(_value.options['selection'][i][0]), 
    				_value.options['selection'][i][1]);
    	}
    }
    
    function subscribeToSelection(subscribeBool) {
    	if(_representation.options.enableSelection) {
    		if(subscribeBool) {
    			knimeService.subscribeToSelection(_translator.sourceID, onSelectionChanged);
    		} else {
    			knimeService.unsubscribeSelection(_translator.sourceID, onSelectionChanged);
    		}
    	}
    }
    
    function publishSelection(shouldPublish){
    	if(shouldPublish) {
    		knimeService.setSelectedRows(_translator.sourceID, getSelectedRowIDs(), _translator.sourceID);
    	}
    }
    
	function checkClearSelectionButton(){
		var button = d3.select("#clearSelectionButton");
		if (button){
			button.classed("inactive", function(){return !_value.options['selection'].length > 0});
		}
	}
    
    function getSelectedRowIDs() {
    	var selectedRowIDs = [];
    	for (var i = 0; i< _value.options['selection'].length; i++) {
    		selectedRowIDs.push( _value.options['selection'][i][0]);
    	}
    	return selectedRowIDs;
    }
    
    // Removes the clusterName with the given cluster name. If "removeAll" is true all bars are removed
    function removeHilightBar(clusterName, removeAll) {
    	if(removeAll) {
    		var length = _value.options['selection'].length;
	  		for(var i = 0; i < length; i++) {
	  			let selectedEntry = _value.options['selection'][i];
	  			let bar = d3.select(".hilightBar_" + _keyNameMap.getNameFromKey(selectedEntry[0])); 
	  			let barParent = bar.select(function() { return this.parentNode; });
	  			barParent.select("text").classed(selectedEntry[1], false);
	  			d3.selectAll(".hilightBar_" + _keyNameMap.getNameFromKey(selectedEntry[0])).remove();
	  		}
    	} else {
	    	var barIndex = getSelectedRowIDs().indexOf(_keyNameMap.getKeyFromName(clusterName));
	    	if(barIndex > -1) {
		    	let selectedEntry = _value.options['selection'][barIndex];
		    	let bar = d3.select(".hilightBar_" + _keyNameMap.getNameFromKey(selectedEntry[0])); 
		    	let barParent = bar.select(function() { return this.parentNode; });
		    	barParent.select("text").classed(selectedEntry[1], false);
			  	d3.selectAll(".hilightBar_" + _keyNameMap.getNameFromKey(selectedEntry[0])).remove();
	    	}
    	}
    } 
    
    // Create a hilight-bar above the cluster with the given name and assigns the given css class to it
    function createHilightBar (clusterName, selectionClass) {
    	var optOrientation = _value.options['orientation'];
	  	for(var j = 0; j < _representation.inObjects[0].table.rows.length; j++) {
	  		if(_representation.inObjects[0].table.rows[j].data[0] === clusterName) {
	  			d3.selectAll(".knime-x text").each(function(d,i) {
	  				if(i==j) {
	  					d3.select(this).classed(selectionClass,true);
	  					var selectionTitle;
	  					if(selectionClass == "knime-selected") {
	  						selectionTitle = "Selected";
	  					} else {
	  						selectionTitle = "Partially selected";
	  					}
	  					var posX = 0;
	  					var posY = 0;
	  					var highlightHeight = 0;
	  					var highlightWidth = 5;
	  					if(optOrientation) {
	  						posY = -0.5*(d3.select(".nv-bar.positive").node().getBBox().height * plotData.length);
	  						posX = -1.5*highlightWidth;
	  						highlightHeight = (d3.select(".nv-bar.positive").node().getBBox().height) * plotData.length;
	  					} else {
	  							posX = -0.5*(d3.select(".nv-bar.positive").node().getBBox().width * plotData.length);
		  						highlightWidth = (d3.select(".nv-bar.positive").node().getBBox().width) * plotData.length;
		  						highlightHeight = 5;
		  						posY = 0.5*highlightHeight;
	  					}
    	  				d3.select(this.parentNode).append("rect").classed("hilightBar_"+ clusterName,true)
    	  				.classed(selectionClass, true)
    	  				.attr({ x: posX, y: posY, width: highlightWidth, height: highlightHeight})
    	  				.style('pointer-events', 'all')
    	  				.append("title")
    	  				.classed('knime-tooltip', true)
    	  				.text(selectionTitle);
	  				} 
  				});
	  		}
	  	}
    }
    
    function getClusterToRowMapping() {
    	var map = {};
    	for (var i = 0; i < _representation.inObjects[0].table.rows.length; i++) {
    		map[_representation.inObjects[0].table.rows[i].data[0]] = _representation.inObjects[0].table.rows[i].rowKey;
    	}
    	return map;
    }
    
    // Helper class to handle conversion from cluster name to row key
    class KeyNameMap{
    	constructor(map){
		   this.map = map;
		   this.reverseMap = {};
		   for(var key in map){
		      var value = map[key];
		      this.reverseMap[value] = key;   
		   }
    	}
		getKeyFromName(name){ 
			return this.map[name]; 
		};
		getNameFromKey(key){
			return this.reverseMap[key];
		};
    }
    
    function handleHighlightClick(event) {
    	var clusterName = event.x;
    	var clusterKey = _keyNameMap.getKeyFromName(clusterName);
    	var barIndex = getSelectedRowIDs().indexOf(clusterKey);
    	// Deselect already selected bar when clicking again on it
    	if((barIndex > -1 && (!d3.event.ctrlKey && !d3.event.shiftKey && !d3.event.metaKey) 
    			&& _value.options['selection'].length == 1)
    			|| (barIndex > -1 && (d3.event.ctrlKey || d3.event.shiftKey || d3.event.metaKey))){
    		if(_representation.options.enableSelection) {
        		if(_value.options.publishSelection) {
        			knimeService.removeRowsFromSelection(_translator.sourceID,[clusterKey], _translator.sourceID);
        		}
    		}
			removeHilightBar(clusterName, false);
			_value.options['selection'].splice(barIndex, 1);
    	} else if(!d3.event.ctrlKey && !d3.event.shiftKey && !d3.event.metaKey) {
    		// Deselect all previously selected bars and select the newly clicked one
    		if(_representation.options.enableSelection) {
        		if(_value.options.publishSelection) {
        			knimeService.setSelectedRows(_translator.sourceID,[clusterKey], _translator.sourceID);
        		}
    		}
			removeHilightBar(clusterName, true);
			_value.options['selection']= [];
    		createHilightBar(clusterName, "knime-selected");
    		_value.options['selection'].push([clusterKey, "knime-selected"]);
    	} else {
    		// Select the clicked bar, as it is either a new selection or a additional selection
    		if(_representation.options.enableSelection) {
        		if(_value.options.publishSelection) {
        			knimeService.addRowsToSelection(_translator.sourceID,[clusterKey], _translator.sourceID);
        		}
    		}
    		createHilightBar(clusterName, "knime-selected");
    		_value.options['selection'].push([clusterKey, "knime-selected"]);
    	}
    	checkClearSelectionButton();
    }
    
    function onSelectionChanged(data) {
    	if (data.reevaluate) {
    		removeHilightBar("", true);
    		var selectedRows = knimeService.getAllRowsForSelection(_translator.sourceID);
    		var partiallySelectedRows = knimeService.getAllPartiallySelectedRows(_translator.sourceID);
    		_value.options['selection'] = [];
    		for (let selectedRow in selectedRows) {
    			let length = _value.options['selection'].length;
    			_value.options['selection'][length] = [selectedRows[selectedRow], "knime-selected"];
    			createHilightBar(_keyNameMap.getNameFromKey(selectedRows[selectedRow]),
    					"knime-selected");
    		}
    		for (let partiallySelectedRow in partiallySelectedRows) {
    			let length = _value.options['selection'].length;
    			_value.options['selection'][length] = [partiallySelectedRows[partiallySelectedRow], "knime-partially-selected"];
    			createHilightBar(_keyNameMap.getNameFromKey(partiallySelectedRows[partiallySelectedRow]),
    					"knime-partially-selected");
    		}
        } else if (data.changeSet) {
        	if (data.changeSet.removed) {
        		data.changeSet.removed.map(function(rowId) {
        			var clusterName = rowId;
        			var index = getSelectedRowIDs().indexOf(clusterName);
        			if (index > -1) {
        				removeHilightBar(_keyNameMap.getNameFromKey(rowId), false);
        				_value.options['selection'].splice(index, 1);
        			}
        		});
        	}
        	if(data.changeSet.partialRemoved) {
        		data.changeSet.partialRemoved.map(function(rowId) {
        			var clusterName = rowId;
        			var index = getSelectedRowIDs().indexOf(clusterName);
        			if (index > -1) {
        				removeHilightBar(_keyNameMap.getNameFromKey(rowId), false);
        				_value.options['selection'].splice(index, 1);
        			}
        		});
        	}
	        if (data.changeSet.added) {
	            data.changeSet.added.map(function(rowId) {
	                var index = getSelectedRowIDs().indexOf(rowId);
	                if (index === -1) {
	                	_value.options['selection'].push([rowId, "knime-selected"]);
	                	createHilightBar(_keyNameMap.getNameFromKey(rowId), "knime-selected");
	                }
	            });
	        }
	        if(data.changeSet.partialAdded) {
	        	data.changeSet.partialAdded.map(function(rowId) {
	                var index = getSelectedRowIDs().indexOf(rowId);
	                if (index === -1) {
	                	_value.options['selection'].push([rowId, "knime-partially-selected"]);
	                    createHilightBar(_keyNameMap.getNameFromKey(rowId), "knime-partially-selected");
	                }
	            });
	        }
	     }
    	checkClearSelectionButton();
    }


    processData = function () {
        var optMethod = _representation.options['aggr'];
        var optFreqCol = _representation.options['freq'];
        var optCat = _representation.options['cat'];

        var customColors, colorScale;
        if (_representation.inObjects[1]) {
            // Custom color scale
            var colorTable = new kt();
            colorTable.setDataTable(_representation.inObjects[1]);
            if (colorTable.getColumnTypes()[0] == 'string') {
                customColors = {};
                var colorCol = colorTable.getColumn(0);
                for (var i = 0; i < colorCol.length; i++) {
                    customColors[colorCol[i]] = colorTable.getRowColors()[i];
                }
                colorScale = [];
            }
        }

        categories = knimeTable.getColumn(optCat);
        var numCat = categories.length;

        if (optMethod == 'Occurence\u00A0Count') {
            optFreqCol = [knimeTable.getColumnNames()[1]];
        }

        // Get the frequency columns
        var valCols = [];
        var isDuplicate = false;
        freqCols = [];

        for (var k = 0; k < optFreqCol.length; k++) {
            var valCol = knimeTable.getColumn(optFreqCol[k]);
            // ToDo: Add an isDuplicate test here...
            if (isDuplicate != true) {
                valCols.push(valCol);
                freqCols.push(optFreqCol[k]);
            }
        }

        plotData = [];
        freqColValueOnMissValCat = [];
        missValInCat = new Array(numCat);
        for (var i = 0; i < numCat; i++) {
            missValInCat[i] = [];
        }
        isMissValCat = false;
        missValCatValues = [];
        var numFreqColsNoMissVal = 0; // number of freq columns which have
        // non-missing values (needed for color
        // scale)
        if (valCols.length > 0) {
            var numDataPoints = valCols[0].length;
            for (var j = 0; j < freqCols.length; j++) {

                var col = freqCols[j];
                if (optMethod == 'Occurence\u00A0Count') {
                    col = 'Occurrence Count';
                }
                var values = [];
                var onlyMissValInCats = true; // whether the freq col has only
                // missing values in
                // non-"Missing values"
                // categories
                var hasValueOnMissValCat = false; // whether the freq col has
                // a non-missing value in
                // the Missing values
                // category

                for (var i = 0; i < numDataPoints; i++) {
                    if (categories != undefined) {
                        if (isDuplicate == true) {
                            alert('Duplicate categories found in column.');
                            return 'duplicate';
                        }

                        var cat = categories[i];
                        var val = valCols[j][i];

                        if (cat !== null) {
                            if (val !== null) {
                                // if both cat and value are not null - normal
                                // case, just add the value
                                onlyMissValInCats = false;
                                values.push({
                                    'x': cat,
                                    'y': val
                                });
                            }
                        } else {
                            // Missing values category
                            isMissValCat = true;
                            if (val !== null) {
                                // save the non-missing value for the
                                // corresponding freq col
                                missValCatValues.push({
                                    'col': col,
                                    'value': val
                                });
                                // this freq col has non-missing value in the
                                // Missing value category
                                hasValueOnMissValCat = true;
                            }
                        }

                        if (val === null) {
                            // this freq col has a missing value in the current
                            // category - save this info
                            missValInCat[i].push(col);
                        }
                    }
                }

                if (!onlyMissValInCats) {
                    // the freq col has non-missing values in normal categories
                    // - add this column to the view
                    var plotStream = {
                        'key': col,
                        'values': values
                    };
                    plotData.push(plotStream);

                    if (customColors) {
                        var color = customColors[col];
                        if (!color) {
                            color = '#7C7C7C';
                        }
                        colorScale.push(color);
                    }
                    numFreqColsNoMissVal++;
                } else {
                    // The freq col has only missing values in normal categories
                    // -
                    // we save whether it has a non-missing value in the Missing
                    // values category.
                    // Whether this column is going to be displayed in the view
                    // depends on the "includeMissValCat" option.
                    // So we don't add the column to the plot at this moment -
                    // wait for processMissingValues()
                    // Note: a non-missing value (if there is) is stored in
                    // missValCatValues - hence, enough to store only a boolean
                    // flag
                    freqColValueOnMissValCat.push({
                        'col': col,
                        'hasValueOnMissValCat': hasValueOnMissValCat
                    });
                    if (hasValueOnMissValCat) {
                        // If there is a non-missing value, then the presence of
                        // the column depends on the "includeMissValCat" option,
                        // which can be switched in the view on the fly.
                        // We do not want this switch to influence on the color
                        // scale, so we count it
                        numFreqColsNoMissVal++;
                    }
                }
            }
        } else {
            if (hasNull == false) {
                alert('No numeric columns detected.');
                return 'numeric';
            } else {
                alert('Numeric columns detected, but contains missing values.');
                return 'missing';
            }
        }

        if (customColors) {
            colorRange = colorScale;
        } else {
            // Default color scale
            if (numFreqColsNoMissVal > 10) {
                colorScale = d3.scale.category20();
            } else {
                colorScale = d3.scale.category10();
            }
            colorRange = colorScale.range();
        }

        processMissingValues();
    };

    /**
	 * switched - if the chart update was triggered by changing the "include
	 * 'Missing values' category" option in the view
	 */
    processMissingValues = function (switched) {
        // Make a list of freq columns to exclude
        var excludeCols = []; // column names to exclude
        // Go through the list of those freq cols which have only missing values
        // in normal categories
        // and exclude those which either 1) has a missing value in the Missing
        // values category, or
        // 2) has a non-missing value there but the option is set to Don't
        // include missing values
        for (var i = 0; i < freqColValueOnMissValCat.length; i++) {
            var col = freqColValueOnMissValCat[i];
            if (!col.hasValueOnMissValCat || col.hasValueOnMissValCat && !_value.options.includeMissValCat) {
                excludeCols.push(col.col);
            }
        }

        // Make a list of excluded bars per category or whole categories
        var excludeBars = []; // bars (in string representation) to exclude
        var excludeCats = []; // category names to exclude
        var numLeftCols = freqCols.length - excludeCols.length; // how many
        // columns left
        // after
        // excluded ones
        var missValCatBars; // bars for Missing values category we add to the
        // end, so we store them separately
        var excludeWholeMissValCat = false;
        excludeFreqColCatMap = {};
        // We group the warnings by category, so we iterate over categories
        for (var i = 0; i < missValInCat.length; i++) {
            var cat = categories[i];
            // take only those freq cols which have missing values in the
            // current category and were not whole excluded
            var cols = missValInCat[i].filter(function (x) {
                return excludeCols.indexOf(x) == -1;
            });
            if (cols.length > 0) {
                if (cols.length == numLeftCols) {
                    // if all the left freq cols have missing values - exclude
                    // the whole category
                    if (cat !== null) {
                        excludeCats.push(cat);
                    } else {
                        excludeWholeMissValCat = true; // Missing values
                        // category will be
                        // appended to the end
                    }
                } else {
                    // build a string of excluded bars (cat - col1, col2 ...)
                    var label = cat !== null ? cat : MISSING_VALUES_LABEL;
                    var str = label + ' - ' + cols.join(', ');
                    if (cat !== null) {
                        excludeBars.push(str);
                    } else {
                        missValCatBars = str; // Missing values category will
                        // be appended to the end
                    }
                    // for normal categories and also for the Missing values
                    // category (if it's included in the view)
                    // we fill the map of excluded bars (grouped by freq cols) -
                    // needed for Stacked plot
                    if (cat !== null || _value.options.includeMissValCat) {
                        cols.forEach(function (col) {
                            if (excludeFreqColCatMap[col] != undefined) {
                                excludeFreqColCatMap[col].push(cat);
                            } else {
                                excludeFreqColCatMap[col] = [cat];
                            }
                        });
                    }
                }
            }
        }
        // exclude smth from Missing values category, if it's included in the
        // view
        if (_value.options.includeMissValCat && _representation.options.reportOnMissingValues) {
            if (excludeWholeMissValCat) {
                excludeCats.push(MISSING_VALUES_LABEL);
            } else if (missValCatBars !== undefined) {
                excludeBars.push(missValCatBars);
            }
        }

        // Add or remove the non-missing values of the Missing values category
        for (var i = 0; i < missValCatValues.length; i++) {
            var item = missValCatValues[i];
            if (excludeCols.indexOf(item.col) != -1 && !(!_value.options.includeMissValCat && switched)) {
                // Fact that the freq col is in missValCatValues means it has a
                // non-missing value in Missing values category.
                // If this col was excluded, that means it has only missing
                // values in all other categories AND we "don't include
                // MissValCat".
                // In case it's the first time the plot is building, we don't
                // need to do anything - call continue.
                // But if a user switched the option "includeMissValCat" from
                // 'on' to 'off', we need to remove the value of MissValCat from
                // the plot further below.
                continue;
            }
            // find if the plot has already the data (key->values) for the
            // current freq col == key
            var data = undefined;
            var dataInd;
            for (var j = 0; j < plotData.length; j++) { // many thanks to IE -
                // we cannot use find()
                // or findIndex() here
                if (plotData[j].key == item.col) {
                    data = plotData[j];
                    dataInd = j;
                    break;
                }
            }
            if (_value.options.includeMissValCat && _representation.options.reportOnMissingValues) {
                // if we include Missing values category to the view, we need to
                // add its values
                var val = {
                    'x': MISSING_VALUES_LABEL,
                    'y': item.value
                };
                if (data !== undefined) {
                    data.values.push(val);
                } else {
                    plotData.push({
                        'key': item.col,
                        'values': [val]
                    });
                }
            } else if (switched) {
                // if we don't include Missing values category to the view AND
                // this option was switched in the view, we need to remove its
                // value
                if (data !== undefined) {
                    data.values.pop();
                    if (data.values.length == 0) {
                        plotData.splice(dataInd, 1);
                    }
                }
            }
        }

        // Set warning messages
        if (!showWarnings) {
            return;
        }
        if (plotData.length == 0) {
            // No data available warnings
            var str;
            if (missValCatValues.length != 0 && _representation.options.reportOnMissingValues) {
                str = 'No chart was generated since all frequency columns have only missing values.\nThere are values where the category name is missing.\nTo see them switch on the option "Include \'Missing values\' category" in the view settings.';
            } else {
                str = 'No chart was generated since all frequency columns have only missing values or empty.\nRe-run the workflow with different data.';
            }
            knimeService.setWarningMessage(str, NO_DATA_AVAILABLE);
        } else {
            knimeService.clearWarningMessage(NO_DATA_AVAILABLE);
            // All other warnings
            if (excludeCols.length > 0 && _representation.options.reportOnMissingValues) {
                knimeService.setWarningMessage(
                    'Following frequency columns are not present or contain only missing values and were excluded from the view:\n    '
					+ excludeCols.join(', '), FREQ_COLUMN_MISSING_VALUES_ONLY);
            } else {
                knimeService.clearWarningMessage(FREQ_COLUMN_MISSING_VALUES_ONLY);
            }

            if (excludeCats.length > 0 && _representation.options.reportOnMissingValues) {
                knimeService.setWarningMessage(
                    'Following categories contain only missing values and were excluded from the view:\n    '
					+ excludeCats.join(', '), CATEGORY_MISSING_VALUES_ONLY);
            } else {
                knimeService.clearWarningMessage(CATEGORY_MISSING_VALUES_ONLY);
            }

            if (excludeBars.length > 0 && _representation.options.reportOnMissingValues) {
                knimeService.setWarningMessage(
                    'Following bars contain only missing values in frequency column and were excluded from the view:\n    '
					+ excludeBars.join('\n    '), MISSING_VALUES_ONLY);
            } else {
                knimeService.clearWarningMessage(MISSING_VALUES_ONLY);
            }
        }
    };

    /**
	 * This is a workaround for the stacked plot problem coming from the nvd3
	 * library implementation. They do not really support missing values in the
	 * Stacked option: (https://github.com/novus/nvd3/issues/1941 - "The
	 * solution is to adjust your data before handing it to nvd3." - nice
	 * answer) The implementation uses a simple d3.layout.stack which requires
	 * all data have the same length
	 * (https://github.com/d3/d3-3.x-api-reference/blob/master/Stack-Layout.md#_stack)
	 * Missing values may lead to different lengths. A workaround here is to add
	 * dummy null values in place of excluded bars before drawing to Stacked
	 * plot. And remove them before switching to Grouped plot.
	 */
    fixStackedData = function (addDummy) {
        plotData.forEach(function (dataValues) {
            var excludeCats = excludeFreqColCatMap[dataValues.key];
            if (excludeCats == undefined) {
                // if this freq col does not have excluded bars at all - nothing
                // to do
                return;
            }
            if (addDummy) {
                // Another implementation thing is that the categories in every
                // freq col must follow the same order.
                // So we cannot simply append dummy nulls to the end.
                // Instead we need to replace the whole "values" array.
                // We go over the categories and add either a real value or a
                // dummy null depending on what's present.
                var i = 0, j = 0;
                var values = dataValues.values;
                var newValues = [];
                categories.forEach(function (cat) {
                    if (cat == null) {
                        return;
                    }
                    if (i < values.length && values[i].x == cat) {
                        newValues.push(values[i]);
                        i++;
                    } else if (j < excludeCats.length && excludeCats[j] == cat) {
                        newValues.push({
                            'x': cat,
                            'y': null
                        });
                        j++;
                    }
                });
                if (i < values.length && values[i].x == MISSING_VALUES_LABEL) {
                    newValues.push(values[i]);
                } else if (j < excludeCats.length && excludeCats[j] == null) {
                    newValues.push({
                        'x': MISSING_VALUES_LABEL,
                        'y': null
                    });
                }
                dataValues.values = newValues;
            } else {
                // remove dummy null values (basically any null values as there
                // can be no other nulls)
                dataValues.values = dataValues.values.filter(function (value) {
                    return value.y !== null;
                });
            }
        });
    };

    function updateTitles(updateChart) {
        if (chart) {
            var curTitle = d3.select('#title');
            var curSubtitle = d3.select('#subtitle');
            var chartNeedsUpdating = curTitle.empty() != !(_value.options.title)
				|| curSubtitle.empty() != !(_value.options.subtitle);
            if (!_value.options.title) {
                curTitle.remove();
            }
            if (_value.options.title) {
                if (curTitle.empty()) {
                    svg.append('text')
                        .attr('x', 20)
                        .attr('y', 30)
                        .attr('id', 'title')
                        .attr('class', 'knime-title')
                        .text(_value.options.title);
                } else {
                    curTitle.text(_value.options.title);
                }
            }
            if (!_value.options.subtitle) {
                curSubtitle.remove();
            }
            if (_value.options.subtitle) {
                if (curSubtitle.empty()) {
                    svg.append('text')
                        .attr('x', 20)
                        .attr('y', _value.options.title ? 46 : 20)
                        .attr('id', 'subtitle')
                        .attr('class', 'knime-subtitle')
                        .text(_value.options.subtitle);
                } else {
                    curSubtitle.text(_value.options.subtitle).attr('y', _value.options.title ? 46 : 20);
                }
            }

            var topMargin = 10;
            topMargin += _value.options.title ? 10 : 0;
            topMargin += _value.options.subtitle ? 8 : 0;
            chart.legend.margin({
                top: topMargin,
                bottom: topMargin
            });

            var isTitle = _value.options.title || _value.options.subtitle;
            knimeService.floatingHeader(isTitle);

            if (updateChart && chartNeedsUpdating) {
                if (_representation.options.svg.fullscreen && _representation.runningInView) {
                    var height = (isTitle) ? '100%' : 'calc(100% - ' + knimeService.headerHeight() + 'px)';
                    layoutContainer.style('height', height)
                    // two rows below force to invalidate the container which
                    // solves a weird problem with vertical scroll bar in IE
                        .style('display', 'none')
                        .style('display', 'block');
                    d3.select('#svgContainer').style('height', height);
                }
                chart.update();
            }
        }
    }

    /**
	 * Updates the axis labels after they have been wrapped. And add a title to
	 * show the full name. Additionally adjust the length of the maximum and
	 * minimum value on the y-axis.
	 */
    function updateLabels() {
        var optShowMaximum = _value.options.showMaximum;
        if (typeof optShowMaximum == 'undefined') {
            optShowMaximum = _representation.options.showMaximum;
        }
        var optOrientation = _value.options['orientation'];
        var texts = svg.select('.knime-x').selectAll('text');
        texts.each(function (d, i) {
            if (typeof wrapedPlotData[0].values[i] !== 'undefined') {
                var self = d3.select(this);
                self.text(wrapedPlotData[0].values[i].x);
                self.append('title').classed('knime-tooltip', true);
            }
        });
        

    	var minMaxValues = d3.extent(chart.yAxis.domain());
    	var maxValue = minMaxValues[0];
    	var minValue = minMaxValues[1];
    	
        var tickAmount = chart.yAxis.ticks();
        if (tickAmount < 2) {
            tickAmount = 2;
        }

        var scale = d3.scale.linear().domain([minValue, maxValue]);

        if (optShowMaximum) {
            if (optOrientation) {
                var textsYMin = svg.select('.nv-axisMin-x').selectAll('text');
                var textsYMax = svg.select('.nv-axisMax-x').selectAll('text');
            } else {
                var textsYMin = svg.select('.nv-axisMin-y').selectAll('text');
                var textsYMax = svg.select('.nv-axisMax-y').selectAll('text');
            }
            var ticks = scale.ticks(tickAmount);
            if(textsYMin !== null){
	            if (textsYMin.text().indexOf('.') > 0 && textsYMin.text().indexOf('e') < 0) {
	                var precision = Math.max((ticks[0].toString().length - 2), 1);
	                textsYMin.text((Math.floor(parseFloat(textsYMin.text()) * Math.pow(10, precision)) / Math.pow(10,
	                    precision)));
	            } else if (minValue < 0) {
	                textsYMin.text(minValue);
	            }
        	}
        }

        var labelTooltip = texts.selectAll('.knime-tooltip');
        var counter = 0;
        labelTooltip.each(function (d, i) {
            var self = d3.select(this);
            if (typeof plotData[0].values[counter] !== 'undefined') {
                self.text(plotData[0].values[counter].x);
            }
            counter++;
        });

        // Create titles for the Axis-Tooltips
        svg.select('.knime-y text.knime-axis-label').append('title').classed('knime-tooltip', true).text(
            _value.options['freqLabel']);
        svg.select('.knime-x text.knime-axis-label').append('title').classed('knime-tooltip', true).text(
            _value.options['catLabel']);
    }
    
    function getRoundedMaxValue(isStacked) {
     	var maxValue = 0;
     	var minValue = 0;
     	if(isStacked) {
        	var sumList = [];
	        for (var i = 0; i < plotData.length; i++) {
	        	for (var j = 0; j < plotData[i].values.length; j++) { 
		        	if(sumList.length < plotData[i].values.length) {
		        		sumList.push(0);
		        	}
	        		if(plotData[i].disabled !== true) {
	        			sumList[j] += plotData[i].values[j].y;
	        			if(plotData[i].values[j].y < minValue) {minValue = plotData[i].values[j].y;}
	        		} 
	        	}
	        }
	        maxValue = d3.max(sumList);
     	} else {
	        for (var i = 0; i < plotData.length; i++) {
	        	if(plotData[i].disabled !== true) {
		            var tempMaxValue = Math.max(d3.max(plotData[i].values, function (d) {
		                return parseFloat(d.y);
		            }), 0);
		            if(tempMaxValue > maxValue) {maxValue = tempMaxValue;}
		            var tempMinValue = Math.min(d3.min(plotData[i].values, function (d) {
		                return parseFloat(d.y);
		            }), 0);
		            if(tempMinValue < minValue) {minValue = tempMinValue;}
	        	}
	        }
     	}
     	
        var tickAmount = chart.yAxis.ticks();
        if (tickAmount < 2) {
        	tickAmount = 2;
        }

        var scale = d3.scale.linear().domain([minValue, maxValue]);
    	var ticks = scale.ticks(tickAmount);
    	if (ticks[ticks.length - 1].toString().indexOf('.') > 0) {
    		// +1 because the precision of the maximum should be one decimal more then the normal ticks
    		var precision = Math.max((ticks[ticks.length - 1].toString().split('.')[1].length)+1, 1);
    	} else if(ticks[ticks.length - 1].toString().indexOf('e') > 0) {
    		var precision = Math.max(Math.abs((ticks[ticks.length - 1].toString().split('e')[1])), 1);
    	} else {
    		precision = 1;
    	}
    	
    	var roundedMaxValue = Math.ceil(parseFloat(maxValue) * Math.pow(10, precision)) / Math.pow(10, precision);
    	var roundedMinValue = Math.floor(parseFloat(minValue) * Math.pow(10, precision)) / Math.pow(10, precision);
    	return [roundedMinValue,roundedMaxValue];
    }

    /**
	 * Find the max size of one element on the y-axis to see how much space is
	 * needed. To find out the max size, a temp-text object is created and
	 * measured. Afterwards that temp-text is deleted (is not visible in the
	 * view).
	 */
    function checkMaxSizeYAxis(number, optShowMaximum) {
    	var maxValue = 0, minValue = 0;
        for (var i = 0; i < number.length; i++) {
            var tempMaxValue = Math.max(d3.max(number[i].values, function (d) {
                return parseFloat(d.y);
            }), 0);
            if(tempMaxValue > maxValue) {maxValue = tempMaxValue;}
            var tempMinValue = Math.min(d3.min(number[i].values, function (d) {
                return parseFloat(d.y);
            }), 0);
            if(tempMinValue > minValue) {minValue = tempMinValue;}
        }
       
        var optChartTypeEdit = _value.options.chartType;
        var wrapFactor = 1;
        var svgHeight = parseInt(d3.select('svg').style('height'));
        var svgWidth = parseInt(d3.select('svg').style('width'));

        // Calculate values of the y-axis to get an impression about the
        // precision.
        var scale = d3.scale.linear().domain([minValue, maxValue]).range(
            [0, _representation.options['svg']['height']]);
        var ticks = scale.ticks(4);
        if (optShowMaximum) {
            if (maxValue.toString().indexOf('.') > 0 ) {
            	if(ticks[ticks.length-1].toString().indexOf('.') > 0) {
            		var decimalString = ticks[ticks.length - 1].toString().split('.')[1];
            		ticks.push(parseFloat((maxValue.toFixed(decimalString.length)+1)));            		
            	} else {
            		ticks.push(parseFloat(maxValue.toFixed(0)));
            	}
            } else {
                ticks.push(maxValue);
            }
            if (minValue < 0 && minValue.toString().indexOf('e') < 0) {
                ticks.push((minValue.toFixed(ticks[0].toString().length - 1)));
            } else if (minValue < 0) {
                ticks.push(minValue);
            }
        }
        var configObject = {
            container: document.querySelector('svg'),
            tempContainerClasses: 'knime-axis',
            maxWidth: svgWidth,
            maxHeight: svgHeight * 0.1,
        };

        var results = knimeService.measureAndTruncate(ticks, configObject);

        // Return the format to show the result and the space needed to the left
        // border.
        return results;
    }

    /**
	 * Find the max size of the biggest element on the x-Axis. Move the Graph so
	 * that this object is completely visible.
	 */
    function checkMaxSizeXAxis(number, staggerLabels) {
        var optOrientation = _value.options['orientation'];
        var svgHeight = parseInt(d3.select('svg').style('height'));
        var svgWidth = parseInt(d3.select('svg').style('width'));
        var amountOfBars = number[0].values.length;
        var amountOfDimensions = number.length;
        
        var spaceBetweenBars = 40; 
        var maxWidth;
        if(optOrientation) {
        	maxWidth = 0.5*svgWidth;
        } else {
        	var barWidth;
        	if((d3.select(".nv-groups").node()) !== null) {
        		barWidth = d3.select(".nv-groups").select("rect")[0][0].width.baseVal.value * amountOfDimensions;
        	} else {
        		barWidth = (svgWidth / amountOfBars) - spaceBetweenBars
        	}
        	if(staggerLabels) {
        		maxWidth = barWidth * 2;
        	} else {
        		maxWidth = barWidth;
        	}
        }

        var configObject = {
            container: document.querySelector('svg'),
            tempContainerClasses: 'knime-axis',
            maxWidth: maxWidth,
            maxHeight: svgHeight / amountOfBars,
            minimalChars: 1,
        };
        var xValues = [];
        for (var value in number[0].values) {
            xValues.push(number[0].values[value].x);
        }

        var results = knimeService.measureAndTruncate(xValues, configObject);
        
        var xExtremValues = [];
        xExtremValues.push(number[0].values[0].x);
        xExtremValues.push(number[0].values[number[0].values.length-1].x);
        
        if(staggerLabels) {
        	configObject.maxWidth = (svgWidth / amountOfBars) - spaceBetweenBars;
        }
        var extremResults = knimeService.measureAndTruncate(xExtremValues, configObject);

        // Update the cloned data array to contain the wrapped labels
        for (var group in number) {
            for (var value in number[group].values) {
            	if(value == 0) {
            		wrapedPlotData[group].values[value].x = extremResults.values[0].truncated;
            	} else if(value == number[group].values.length-1) {
            		wrapedPlotData[group].values[value].x = extremResults.values[1].truncated;
            	} else {
            		wrapedPlotData[group].values[value].x = results.values[parseInt(value)].truncated;
            	}
            }
        }
        return results;
    }

    function updateAxisLabels(updateChart) {

        if (chart) {
            var optOrientation = _value.options['orientation'];
            var optStaggerLabels = _value.options['staggerLabels'];
            var stacked = _value.options['chartType'];
            var optShowMaximum = _value.options.showMaximum;
            var curCatAxisLabel, curFreqAxisLabel;
            var curCatAxisLabelElement = d3.select('.nv-x.nv-axis .nv-axis-label');
            var curFreqAxisLabelElement = d3.select('.nv-y.nv-axis .nv-axis-label');
            var freqLabel = _value.options['freqLabel'];
            var catLabel = _value.options['catLabel'];
            var svgHeight = parseInt(d3.select('svg').style('height'));
            var svgWidth = parseInt(d3.select('svg').style('width'));

            if (typeof optShowMaximum == 'undefined') {
                optShowMaximum = _representation.options.showMaximum;
            }

            wrapedPlotData = JSON.parse(JSON.stringify(plotData));

            if (!curCatAxisLabelElement.empty()) {
                curCatAxisLabel = curCatAxisLabelElement.text();
            }

            if (!curFreqAxisLabelElement.empty()) {
                curFreqAxisLabel = curCatAxisLabelElement.text();
            }

            var chartNeedsUpdating = curCatAxisLabel != _value.options.catLabel
				|| curFreqAxisLabel != _value.options.freqLabel;
            if (!chartNeedsUpdating)
                return;

            var configObject = {
                container: document.querySelector('svg'),
                tempContainerClasses: 'knime-axis',
                maxWidth: svgWidth * 0.5,
                maxHeight: svgHeight * 0.5,
                minimalChars: 1,
            };
            optOrientation ? configObject.tempContainerAttributes = { transform: 'rotate(-90)' }
                : configObject.tempContainerAttributes = '';
            var catLabelSize = knimeService.measureAndTruncate(catLabel ? [catLabel] : [''], configObject);
            optOrientation ? configObject.tempContainerAttributes.transform = ''
                : configObject.tempContainerAttributes = { transform: 'rotate(-90)' };
            var freqLabelSize = knimeService.measureAndTruncate(freqLabel ? [freqLabel] : [''], configObject);

            var maxSizeYAxis = checkMaxSizeYAxis(wrapedPlotData, optShowMaximum);
            var maxSizeXAxis = checkMaxSizeXAxis(wrapedPlotData, optStaggerLabels);
            var svgSize = optOrientation ? parseInt(d3.select('svg').style('width')) : parseInt(d3.select('svg').style(
                'height'));

            freqLabel = freqLabelSize.values[0].truncated;
            catLabel = catLabelSize.values[0].truncated;

            // space between two labels
            var distanceBetweenLabels = 150;
            if (optOrientation) {
            	var tickAmount = parseInt((svgSize - maxSizeXAxis.max.maxWidth) / (maxSizeYAxis.max.maxWidth + distanceBetweenLabels));
                if (optShowMaximum) {
                	// extend the border of the svg to be able to see the complete maximum label 
                	// factor 0.6 is chosen to give the label a little space to the border
                	var rightMargin = 0.6 * maxSizeYAxis.max.maxWidth;
                }
            } else {
            	var tickAmount = parseInt((svgSize - maxSizeYAxis.max.maxHeight) / (maxSizeYAxis.max.maxHeight + distanceBetweenLabels));
            }
            
            // nvd3 sets the cat label 55 pixel away from the axis. As with changing font size this
            // is not enough, it is easier to calculate it ourselves
            var spacingCatLabel = 55;
            
            // nvd3 sets the freq label 20 pixel away from the axis. As with changing font size this
            // is not enough, it is easier to calculate it ourselves
            var spacingFreqLabel = 20;
            
            // add some empty space, so that two labels are not to close together
            var additionalEmptySpace = 15;

            var paddingAmount = 15;
            chart.xAxis
                .axisLabel(catLabel)
                .axisLabelDistance(optOrientation ? maxSizeXAxis.max.maxWidth - spacingCatLabel + additionalEmptySpace + paddingAmount
                		: optStaggerLabels ? maxSizeXAxis.max.maxHeight*2 -spacingCatLabel + additionalEmptySpace *2 + paddingAmount
                		: -spacingFreqLabel + maxSizeXAxis.max.maxHeight * 1.5)
                .tickPadding(paddingAmount)
                .showMaxMin(false);

            chart.yAxis.axisLabel(freqLabel)
                .axisLabelDistance(optOrientation ? -spacingFreqLabel + maxSizeYAxis.max.maxHeight
                		: (maxSizeYAxis.max.maxWidth - spacingCatLabel + additionalEmptySpace))
                .showMaxMin(optShowMaximum)
                .ticks(tickAmount)
                .tickFormat(d3.format('~.g'));
            
        	if(stacked == "Grouped") {
        		var extremValues = getRoundedMaxValue(false);
        	} else {
        		var extremValues = getRoundedMaxValue(true);
        	}
        	chart.yDomain([extremValues[0],extremValues[1]]);
            
        	var bottomMargin = optOrientation ? maxSizeYAxis.max.maxHeight + freqLabelSize.max.maxHeight + additionalEmptySpace
        			: maxSizeXAxis.max.maxHeight + catLabelSize.max.maxHeight + additionalEmptySpace;
        	var leftMargin = optOrientation ? maxSizeXAxis.max.maxWidth + catLabelSize.max.maxWidth + additionalEmptySpace + paddingAmount
        			: maxSizeYAxis.max.maxWidth + freqLabelSize.max.maxWidth + additionalEmptySpace;
            if (!_value.options.catLabel) {
                bottomMargin = optOrientation ? bottomMargin
                		: maxSizeXAxis.max.maxHeight + additionalEmptySpace;
                leftMargin = optOrientation ? leftMargin : maxSizeYAxis.max.maxWidth
                		+ freqLabelSize.max.maxWidth + additionalEmptySpace;
            }
            if (!_value.options.freqLabel) {
            	bottomMargin = optOrientation ? maxSizeXAxis.max.maxHeight + additionalEmptySpace : bottomMargin;
                leftMargin = optOrientation ? leftMargin + paddingAmount
                		: maxSizeYAxis.max.maxWidth + additionalEmptySpace;
            }
            if (!optOrientation) {
                chart.staggerLabels(optStaggerLabels);
                if (optStaggerLabels) {
                	bottomMargin += _value.options.catLabel ? 0.25 *maxSizeXAxis.max.maxHeight + paddingAmount
                        : 0.5 * maxSizeXAxis.max.maxHeight + paddingAmount;
                }
            }
            chart.margin({
                left: leftMargin,
                bottom: bottomMargin,
                right: rightMargin
            });

            if (updateChart) {
                chart.update();
            }
        }
    }

    function updateChartType() {
        if (this.value != _value.options.chartType) {
            _value.options.chartType = this.value;
            var stacked = this.value == 'Stacked';
            fixStackedData(stacked);
            chart.stacked(stacked);
            drawChart(true);
        }
    }

    drawControls = function () {
        if (!knimeService) {
            // TODO: error handling?
            return;
        }

        if (_representation.displayFullscreenButton) {
            knimeService.allowFullscreen();
        }

        if (!_representation.options.enableViewControls)
            return;

        var titleEdit = _representation.options.enableTitleEdit;
        var subtitleEdit = _representation.options.enableSubtitleEdit;
        var axisEdit = _representation.options.enableAxisEdit;
        var chartTypeEdit = _representation.options.enableStackedEdit;
        var orientationEdit = _representation.options.enableHorizontalToggle;
        var staggerLabels = _representation.options.enableStaggerToggle;
        var switchMissValCat = _representation.options.enableSwitchMissValCat;
        var showMaximum = _representation.options.enableMaximumValue;
        var enableSelection = _representation.options.enableSelection;
        var disableClearButton = _representation.options.displayClearSelectionButton;

        if (titleEdit || subtitleEdit) {
            if (titleEdit) {
                var chartTitleText = knimeService.createMenuTextField('chartTitleText', _value.options.title,
                    function () {
                        if (_value.options.title != this.value) {
                            _value.options.title = this.value;
                            updateTitles(true);
                        }
                    }, true);
                knimeService.addMenuItem('Chart Title:', 'header', chartTitleText);
            }
            if (subtitleEdit) {
                var chartSubtitleText = knimeService.createMenuTextField('chartSubtitleText', _value.options.subtitle,
                    function () {
                        if (_value.options.subtitle != this.value) {
                            _value.options.subtitle = this.value;
                            updateTitles(true);
                        }
                    }, true);
                var mi = knimeService.addMenuItem('Chart Subtitle:', 'header', chartSubtitleText, null,
                    knimeService.SMALL_ICON);
            }
            if (axisEdit || orientationEdit || staggerLabels) {
                knimeService.addMenuDivider();
            }
        }

        if (axisEdit) {
            var catAxisText = knimeService.createMenuTextField('catAxisText', _value.options.catLabel, function () {
                _value.options.catLabel = this.value;
                updateAxisLabels(true);
            }, true);
            knimeService.addMenuItem('Category axis label:', 'ellipsis-h', catAxisText);

            var freqAxisText = knimeService.createMenuTextField('freqAxisText', _value.options.freqLabel, function () {
                _value.options.freqLabel = this.value;
                updateAxisLabels(true);
            }, true);
            knimeService.addMenuItem('Frequency axis label:', 'ellipsis-v', freqAxisText);

            if (switchMissValCat || orientationEdit || staggerLabels || chartTypeEdit) {
                knimeService.addMenuDivider();
            }
        }

        if (switchMissValCat && isMissValCat && _representation.options.reportOnMissingValues) {
            var switchMissValCatCbx = knimeService.createMenuCheckbox('switchMissValCatCbx',
                _value.options.includeMissValCat, function () {
                    if (_value.options.includeMissValCat != this.checked) {
                        _value.options.includeMissValCat = this.checked;
                        var stacked = _value.options.chartType == 'Stacked';
                        if (stacked) {
                            fixStackedData(false);
                        }
                        processMissingValues(true);
                        if (stacked) {
                            fixStackedData(true);
                        }
                        chart.update();
                    }
                });
            knimeService.addMenuItem('Include \'Missing values\' category: ', 'question', switchMissValCatCbx);

            if (orientationEdit || staggerLabels || chartTypeEdit) {
                knimeService.addMenuDivider();
            }
        }

        if (chartTypeEdit) {
            var groupedRadio = knimeService.createMenuRadioButton('groupedRadio', 'chartType', 'Grouped',
                updateChartType);
            groupedRadio.checked = (_value.options.chartType == groupedRadio.value);
            knimeService.addMenuItem('Grouped:', 'align-left fa-rotate-270', groupedRadio);

            var stackedRadio = knimeService.createMenuRadioButton('stackedRadio', 'chartType', 'Stacked',
                updateChartType);
            stackedRadio.checked = (_value.options.chartType == stackedRadio.value);
            knimeService.addMenuItem('Stacked:', 'tasks fa-rotate-270', stackedRadio);

            if (orientationEdit || staggerLabels) {
                knimeService.addMenuDivider();
            }
        }

        if (orientationEdit) {
            var orientationCbx = knimeService.createMenuCheckbox('orientationCbx', _value.options.orientation,
                function () {
                    if (_value.options.orientation != this.checked) {
                        _value.options.orientation = this.checked;
                        d3.select('#staggerCbx').property('disabled', this.checked);
                        drawChart(true);
                    }
                });
            knimeService.addMenuItem('Plot horizontal bar chart:', 'align-left', orientationCbx);
        }

        if (staggerLabels) {
            var staggerCbx = knimeService.createMenuCheckbox('staggerCbx', _value.options.staggerLabels, function () {
                if (_value.options.staggerLabels != this.checked) {
                    _value.options.staggerLabels = this.checked;
                    drawChart(true);
                }
            });
            staggerCbx.disabled = _value.options.orientation;
            knimeService.addMenuItem('Stagger labels:', 'map-o', staggerCbx);
        }

        if (showMaximum) {
            var displayMaximumCbx = knimeService.createMenuCheckbox('displayMaximumCbx', _value.options.showMaximum,
                function () {
                    if (_value.options.showMaximum != this.checked) {
                        _value.options.showMaximum = this.checked;
                        drawChart(true);
                    }
                });
            knimeService.addMenuItem('Display maximum value:', 'arrows-v', displayMaximumCbx);
        }
        
        if (enableSelection) {
        	knimeService.addMenuDivider();
        	var subscribeToSelectionIcon = knimeService.createStackedIcon('check-square-o', 'angle-double-right', 'faded right sm', 'left bold');
        	var subscribeToSelectionMenu = knimeService.createMenuCheckbox('subscribeToSelection', 
        			_value.options.subscribeToSelection, function () {
        		if (_value.options.subscribeToSelection != this.checked) {
        			_value.options.subscribeToSelection = this.checked;
        			subscribeToSelection(_value.options.subscribeToSelection);
        		}
        	});
        	knimeService.addMenuItem('Subscribe to selection:', subscribeToSelectionIcon, subscribeToSelectionMenu);
        	
        	var publishSelectionIcon = knimeService.createStackedIcon('check-square-o', 'angle-right', 'faded left sm', 'right bold');
            var publishSelectionMenu = knimeService.createMenuCheckbox('publishSelection', _value.options.publishSelection,
                function () {
                    if (_value.options.publishSelection != this.checked) {
                        _value.options.publishSelection = this.checked;
                        publishSelection(this.checked);
                    }
                });
            knimeService.addMenuItem('Publish selection:', publishSelectionIcon, publishSelectionMenu);
        }
        
        if (disableClearButton &&  _representation.options.enableSelection) {
			knimeService.addButton("clearSelectionButton", "minus-square-o", "Clear selection", function(){
				d3.selectAll(".row").classed({"selected": false, "knime-selected": false, "unselected": false });
				removeHilightBar("",true);
				_value.options['selection'] = [];
				publishSelection(true);
			});
			d3.select("#clearSelectionButton").classed("inactive", true);
		}
    };

    function setCssClasses() {
        // axis
        var axis = d3.selectAll('.nv-axis')
            .classed('knime-axis', true);
        d3.selectAll('.nv-x')
            .classed('knime-x', true);
        d3.selectAll('.nv-y')
            .classed('knime-y', true);
        d3.selectAll('.nv-axislabel')
            .classed('knime-axis-label', true);
        axis.selectAll('path.domain')
            .classed('knime-axis-line', true);
        var axisMaxMin = d3.selectAll('.nv-axisMaxMin')
            .classed('knime-axis-max-min', true);
        axisMaxMin.selectAll('text')
            .classed('knime-tick-label', true);
        var tick = axis.selectAll('.knime-axis .tick')
            .classed('knime-tick', true);
        tick.selectAll('text')
            .classed('knime-tick-label', true);
        tick.selectAll('line')
            .classed('knime-tick-line', true);

        // legend
        d3.selectAll('.nv-legendWrap')
            .classed('knime-legend', true);
        d3.selectAll('.nv-legend-symbol')
            .classed('knime-legend-symbol', true);
        d3.selectAll('.nv-legend-text')
            .classed('knime-legend-label', true);

        // Tooltip for axis labels allows to receive all mouse events
        var axisToolTip = svg.selectAll('.knime-tick-label');
        var labelToolTip = svg.selectAll('.knime-axis-label');
        axisToolTip.style('pointer-events', 'all');
        labelToolTip.style('pointer-events', 'all');
        updateLabels();
        registerClickHandler();
    }

    function setTooltipCssClasses() {
        // tooltip
        var tooltip = d3.selectAll('.nvtooltip')
            .classed('knime-tooltip', true);
        tooltip.selectAll('.x-value')
            .classed('knime-tooltip-caption', true)
            .classed('knime-x', true);
        tooltip.selectAll('.legend-color-guide')
            .classed('knime-tooltip-color', true);
        tooltip.selectAll('.key')
            .classed('knime-tooltip-key', true);
        tooltip.selectAll('.value')
            .classed('knime-tooltip-value', true);

    }

    barchart.validate = function () {
        return true;
    };

    barchart.getComponentValue = function () {
        return _value;
    };

    barchart.getSVG = function () {
        var svgElement = d3.select('svg')[0][0];
        knimeService.inlineSvgStyles(svgElement);

        // Return the SVG as a string.
        return (new XMLSerializer()).serializeToString(svgElement);
    };

    return barchart;
}());