(function ( $ ){

// Function Declarations
	
	// URL Parameters
	function getParam ( sname ) {
		var temp = '';
		var params = location.search.substr(location.search.indexOf("?")+1);
		var sval = "";
		params = params.split("&");
		for (var i=0; i<params.length; i++) {
			temp = params[i].split("=");
			if ( [temp[0]] == sname ) { sval = temp[1]; }
		}
		return sval;
	}

	// Graph Annotations
	function addAnnotation(force) {
		if (messages.length > 0 && (force || Math.random() >= 0.95)) {
			annotator.add(seriesData[2][seriesData[2].length-1].x, messages.shift());
		}
	}

	// Add One (1) Day to Date Object
	Date.prototype.addDays = function (d) {
		if (d) {
			var t = this.getTime();
			t = t + (d * 86400000);
			this.setTime(t);
		}
	};

	// Subtract One (1) Day to Date Object
	Date.prototype.subtractDays = function (d) {
		if (d) {
			var t = this.getTime();
			t = t - (d * 86400000);
			this.setTime(t);
		}
	};

	// Set Cosm API Key
	function setApiKey(key) {
		cosm.setKey(key);
		if(!cosm.feed.list()) {
			$('#invalidApiKey').removeClass('hidden');
			$('#welcome').addClass('hidden');
		} else {
			$('#invalidApiKey').addClass('hidden');
			$('#welcome').addClass('hidden');
		}
		return;
	}

	function updateFeed(id, duration, interval) {
		cosm.feed.history(id, {  duration: duration, interval: interval }, function (data) {
				
				data.datastreams.forEach(function(datastream) {
					var series = [];
					var points = [];

					// Create Datastream UI
					$('.datastream-' + datastream.id).remove();
					$('#feed-' + data.id + ' .datastream.hidden').clone().appendTo('#feed-' + data.id + ' .datastreams').addClass('datastream-' + datastream.id).removeClass('hidden');

					// Fill Datastream UI with Data
					$('#feed-' + data.id + ' .datastreams .datastream-' + datastream.id + ' .datastream-name').html(datastream.id);
					$('#feed-' + data.id + ' .datastreams .datastream-' + datastream.id + ' .datastream-value').html(datastream.current_value);
					
					// Include Datastream Unit (If Available)
					if(datastream.unit) {
						if(datastream.unit.symbol) {
							$('#feed-' + data.id + ' .datastreams .datastream-' + datastream.id + ' .datastream-value').html(datastream.current_value + datastream.unit.symbol);
						} else {
							$('#feed-' + data.id + ' .datastreams .datastream-' + datastream.id + ' .datastream-value').html(datastream.current_value);
						}
					} else {
						$('#feed-' + data.id + ' .datastreams .datastream-' + datastream.id + ' .datastream-value').html(datastream.current_value);
					}

					// Historical Datapoints
					if(datastream.datapoints) {
						// Add Each Datapoint to Array
						datastream.datapoints.forEach(function(datapoint) {
							points.push({x: new Date(datapoint.at).getTime()/1000.0, y: parseFloat(datapoint.value)});
						});

						// Add Datapoints Array to Graph Series Array
						series.push({
							name: datastream.id,
							data: points,
							color: '#0A1922'
						});
						console.log(points);

						// Initialize Graph DOM Element
						$('#feed-' + data.id + ' .datastreams .datastream-' + datastream.id + ' .graph').attr('id', 'graph-' + data.id + '-' + datastream.id);
			 			
			 			// Build Graph
						var graph = new Rickshaw.Graph( {
							element: document.querySelector('#graph-' + data.id + '-' + datastream.id),
							width: 600,
							height: 300,
							renderer: 'line',
							//stroke: true,
							//preserve: true,
							series: series
						});
						graph.render();

						var ticksTreatment = 'glow';

						// Define and Render X Axis (Time Values)
						var xAxis = new Rickshaw.Graph.Axis.Time( {
							graph: graph,
							ticksTreatment: ticksTreatment
						});
						xAxis.render();

						// Define and Render Y Axis (Datastream Values)
						var yAxis = new Rickshaw.Graph.Axis.Y( {
							graph: graph,
							tickFormat: Rickshaw.Fixtures.Number.formatKMBT,
							ticksTreatment: ticksTreatment
						});
						yAxis.render();

						// Enable Datapoint Hover Values
						var hoverDetail = new Rickshaw.Graph.HoverDetail({
							graph: graph,
							formatter: function(series, x, y) {
								var date = '<span class="date">' + new Date(x * 1000).toUTCString() + '</span>';
								var swatch = '<span class="detail_swatch" style="background-color: ' + series.color + '"></span>';
								var content = swatch + series.name + ": " + parseFloat(y) + '<br>' + date;
								return content;
							}
						});
					} else {
						$('#feed-' + data.id + ' .datastreams .datastream-' + datastream.id + ' .graphWrapper').addClass('hidden');
					}
					$('#loadingData').foundation('reveal', 'close');
				});
		});
	}

	function setFeeds(feeds) {
		feeds.forEach(function(id) {
			if($('#feed-' + id)) { $('#feed-' + id).remove(); }
		
			// Duplicate Example to Build Feed UI
			$('#exampleFeed').clone().appendTo('#feeds').attr('id', 'feed-' + id).removeClass('hidden');
			
			cosm.feed.history(id, {  duration: "30minutes", interval: 60 }, function (data) {
				// ID
				$('#feed-' + data.id + ' .title .value').html(data.title);

				// Title
				$('#feed-' + data.id + ' .id .value').html(data.id);
				
				// Description
				if(data.description) {
					$('#feed-' + data.id + ' .description .value').html(data.description);
				} else {
					$('#feed-' + data.id + ' .description').addClass('hidden');
				}

				// Link
				$('#feed-' + data.id + ' .link .value').html('<a href="https://next.cosm.com/feeds/' + data.id + '/">View on Xively &raquo;</a>');
				
				// Creator
				var creator = /[^/]*$/.exec(data.creator)[0];
				$('#feed-' + data.id + ' .creator .value').html('<a href="' + data.creator + '">' + creator + '</a>');
				
				// Date Updated
				$('#feed-' + data.id + ' .updated .value').html(data.updated);

				// Tags
				if(data.tags) {
					$('#feed-' + data.id + ' .tags .value').html('<span class="radius secondary label">' + data.tags.join('</span> <span class="radius secondary label">') + '</span>');
				} else {
					$('#feed-' + data.id + ' .tags').addClass('hidden');
				}

				// Location
				if(data.location) {
					if(data.location.name || data.location.lat || data.location.ele || data.location.disposition) {
						
						// Location Name
						if(data.location.name) {
							$('#feed-' + data.id + ' .location-name .value').html(data.location.name);
						} else {
							$('#feed-' + data.id + ' .location-name').addClass('hidden');
						}

						// Location Coordinates
						if(data.location.lat && data.location.lon) {
							$('#feed-' + data.id + ' .latitude .value').html(data.location.lat);
							$('#feed-' + data.id + ' .longitude .value').html(data.location.lon);
						} else {
							$('#feed-' + data.id + ' .latitude').addClass('hidden');
							$('#feed-' + data.id + ' .longitude').addClass('hidden');
						}

						// Location Elevation
						if(data.location.ele) {
							$('#feed-' + data.id + ' .elevation .value').html(data.location.ele);
						} else {
							$('#feed-' + data.id + ' .elevation').addClass('hidden');
						}

						// Location Disposition
						if(data.location.disposition) {
							$('#feed-' + data.id + ' .disposition .value').html(data.location.disposition);
						} else {
							$('#feed-' + data.id + ' .disposition').addClass('hidden');
						}

						// Location Map
						if(data.location.lat && data.location.lon) {
							$('#feed-' + data.id + ' .map .value').html('<a href="http://maps.google.com.au/maps?ll=' + data.location.lat + ',' + data.location.lon + '&spn=1,1">View on Google Maps &raquo;</a>');
						} else {
							$('#feed-' + data.id + ' .map').addClass('hidden');
						}
					} else {
						// Location Information Unavailable
						$('#feed-' + data.id + ' .no-location').removeClass('hidden');
							$('#feed-' + data.id + ' .location-name').addClass('hidden');
							$('#feed-' + data.id + ' .latitude').addClass('hidden');
							$('#feed-' + data.id + ' .longitude').addClass('hidden');
							$('#feed-' + data.id + ' .elevation').addClass('hidden');
							$('#feed-' + data.id + ' .disposition').addClass('hidden');
							$('#feed-' + data.id + ' .map').addClass('hidden');
					}
				} else {
					// Location Information Unavailable
					$('#feed-' + data.id + ' .no-location').removeClass('hidden');
						$('#feed-' + data.id + ' .location-name').addClass('hidden');
						$('#feed-' + data.id + ' .latitude').addClass('hidden');
						$('#feed-' + data.id + ' .longitude').addClass('hidden');
						$('#feed-' + data.id + ' .elevation').addClass('hidden');
						$('#feed-' + data.id + ' .disposition').addClass('hidden');
						$('#feed-' + data.id + ' .map').addClass('hidden');
				}
				
				$('#feed-' + data.id + ' .duration-hour').click(function() {
					$('#loadingData').foundation('reveal', 'open');
					updateFeed(data.id, '1hour', 0);
					return false;
				});
				
				$('#feed-' + data.id + ' .duration-day').click(function() {
					$('#loadingData').foundation('reveal', 'open');
					updateFeed(data.id, '1day', 60);
					return false;
				});
				
				$('#feed-' + data.id + ' .duration-week').click(function() {
					$('#loadingData').foundation('reveal', 'open');
					updateFeed(data.id, '1week', 900);
					return false;
				});
				
				$('#feed-' + data.id + ' .duration-month').click(function() {
					$('#loadingData').foundation('reveal', 'open');
					updateFeed(data.id, '1month', 1800);
					return false;
				});
				
				$('#feed-' + data.id + ' .duration-year').click(function() {
					$('#loadingData').foundation('reveal', 'open');
					updateFeed(data.id, '1year', 43200);
					return false;
				});

				// Handle Datastreams
				data.datastreams.forEach(function(datastream) {
					var series = [];
					var points = [];

					// Create Datastream UI
					$('#feed-' + data.id + ' .datastream.hidden').clone().appendTo('#feed-' + data.id + ' .datastreams').addClass('datastream-' + datastream.id).removeClass('hidden');

					// Fill Datastream UI with Data
					$('#feed-' + data.id + ' .datastreams .datastream-' + datastream.id + ' .datastream-name').html(datastream.id);
					$('#feed-' + data.id + ' .datastreams .datastream-' + datastream.id + ' .datastream-value').html(datastream.current_value);
					
					// Include Datastream Unit (If Available)
					if(datastream.unit) {
						if(datastream.unit.symbol) {
							$('#feed-' + data.id + ' .datastreams .datastream-' + datastream.id + ' .datastream-value').html(datastream.current_value + datastream.unit.symbol);
						} else {
							$('#feed-' + data.id + ' .datastreams .datastream-' + datastream.id + ' .datastream-value').html(datastream.current_value);
						}
					} else {
						$('#feed-' + data.id + ' .datastreams .datastream-' + datastream.id + ' .datastream-value').html(datastream.current_value);
					}

					// Historical Datapoints
					if(datastream.datapoints) {
						// Add Each Datapoint to Array
						datastream.datapoints.forEach(function(datapoint) {
							points.push({x: new Date(datapoint.at).getTime()/1000.0, y: parseFloat(datapoint.value)});
						});

						// Add Datapoints Array to Graph Series Array
						series.push({
							name: datastream.id,
							data: points,
							color: '#0A1922'
						});

						// Initialize Graph DOM Element
						$('#feed-' + data.id + ' .datastreams .datastream-' + datastream.id + ' .graph').attr('id', 'graph-' + data.id + '-' + datastream.id);
			 			
			 			// Build Graph
						var graph = new Rickshaw.Graph( {
							element: document.querySelector('#graph-' + data.id + '-' + datastream.id),
							width: 600,
							height: 100,
							renderer: 'line',
							stroke: true,
							preserve: true,
							series: series
						});
						graph.render();

						var ticksTreatment = 'glow';

						// Define and Render X Axis (Time Values)
						var xAxis = new Rickshaw.Graph.Axis.Time( {
							graph: graph,
							ticksTreatment: ticksTreatment
						});
						xAxis.render();

						// Define and Render Y Axis (Datastream Values)
						var yAxis = new Rickshaw.Graph.Axis.Y( {
							graph: graph,
							tickFormat: Rickshaw.Fixtures.Number.formatKMBT,
							ticksTreatment: ticksTreatment
						});
						yAxis.render();

						// Enable Datapoint Hover Values
						var hoverDetail = new Rickshaw.Graph.HoverDetail({
							graph: graph,
							formatter: function(series, x, y) {
								var date = '<span class="date">' + new Date(x * 1000).toUTCString() + '</span>';
								var swatch = '<span class="detail_swatch" style="background-color: ' + series.color + '"></span>';
								var content = swatch + series.name + ": " + parseFloat(y) + '<br>' + date;
								return content;
							}
						});
					} else {
						$('#feed-' + data.id + ' .datastreams .datastream-' + datastream.id + ' .graphWrapper').addClass('hidden');
					}
				});
			});
		});
	}
// END Function Declarations

// BEGIN Initialization
	var today = new Date();
	var yesterday = new Date(today.getTime()-1000*60*60*24*1);
	var lastWeek = new Date(today.getTime()-1000*60*60*24*7);

	var key = getParam('key');
	var feedString = getParam('feeds');
	var feeds = feedString.split(',');

	$('#apiKeyInput').val(key);
	$('#feedsInput').val(feedString);

	if(key != '' && feedString != '') {
		setApiKey($('#apiKeyInput').val());
		feeds = $('#feedsInput').val().replace(/\s+/g, '').split(',');
		setFeeds(feeds);
	} else if(key != '') {
		$('#feedsModal').foundation('reveal', 'open');
	} else {
		$('#apiKeyModal').foundation('reveal', 'open');
	}

	$('.openStart').click(function() {
		$('#apiKeyModal').foundation('reveal', 'open');
		return false;
	});

	$('#settings').click(function() {
		$('#infoModal').foundation('reveal', 'open');
		return false;
	});

	$('#enterApiKey').click(function() {
		$('#apiKeyModal').foundation('reveal', 'open');
		return false;
	});

	$('#chooseFeeds').click(function() {
		$('#feedsModal').foundation('reveal', 'open');
		return false;
	});

	$('#setFeeds').click(function() {
		$('#feedsModal').foundation('reveal', 'close');
		setApiKey($('#apiKeyInput').val());
		feeds = $('#feedsInput').val().replace(/\s+/g, '').split(',');
		setFeeds(feeds);
		return false;
	});
// END Initialization

})( jQuery );