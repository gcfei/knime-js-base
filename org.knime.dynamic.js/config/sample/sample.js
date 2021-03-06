(sample_namespace = function() {
	
	var sample = {};
	var _representation, _value;
	
	sample.init = function(representation, value) {
		_representation = representation;
		_value = value;
		
		var body = document.getElementsByTagName('body')[0];
		var text = document.createElement("h1");
		body.appendChild(text);
		if (_representation.options["sample_checkbox_option"]) {
			text.appendChild(document.createTextNode("Checkbox was checked"));
		} else {
			text.appendChild(document.createTextNode("Checkbox was not checked"));
		}
		
		var p = document.createElement("p");
		body.appendChild(p);
		var string = "Checking dependencies: ";
		if (typeof d3 != 'undefined') {
			string += "D3 present (Local load). Check!";
			p.className = "success";
		} else {
			string += "D3 not loaded. FAILURE!";
			p.className = "failure";
		}
		p.appendChild(document.createTextNode(string));
		
		p = document.createElement("p");
		body.appendChild(p);
		if (typeof jQuery != 'undefined') {
			string = "jQuery present (URL load). Check!";
			p.className = "success";				
		} else {
			string = "jQuery not loaded. FAILURE!";
			p.className = "failure";
		}
		p.appendChild(document.createTextNode(string));
		
		p = document.createElement("p");
		body.appendChild(p);
		if (typeof d3.tip != 'undefined') {
			string = "D3-Tip present (URL load with dependency). Check!";
			p.className = "success";				
		} else {
			string = "D3-Tip not loaded. FAILURE!";
			p.className = "failure";
		}
		p.appendChild(document.createTextNode(string));
		
		p = document.createElement("p");
		body.appendChild(p);
		string = " Checking in port data: ";
		if (representation.inObjects.length > 0) {
			string += "Found " + representation.inObjects.length + " in objects. Check!";
			p.className = "success";
		} else {
			string += "No port objects found. FAILURE!";
			p.className = "failure";
		}
		p.appendChild(document.createTextNode(string));
	}
	
	sample.validate = function() {
		return true;
	}
	
	sample.getComponentValue = function() {
		return _value;
	}
	
	sample.getSVG = function() {
		var fill = 'red';
		if (typeof jQuery != 'undefined') {
			fill = 'yellow';
			if (typeof d3 != 'undefined') {
				fill = 'orange';
				if (typeof d3.tip != 'undefined') {
					fill = 'green';
				}
			}
		} 
		return '<svg width="200px" height="200px"><g transform="translate(50,50)"><rect x="0" y="0" width="150" height="50" style="fill:' + fill + ';" /></g></svg>';
	}
	
	return sample;
	
}());