var eventsMap = function() {
  var map,
    markers = [],
    keyIndex = -1,
    xhr,
    searchedLocation,
    currentDate = new Date(),
    earliestTime = encodeURIComponent(currentDate.toISOString());

  var iso = d3.time.format.utc("%Y-%m-%dT%H:%M:%SZ"),
    wholeDate = d3.time.format("%m/%d %I:%M %p"),
    dateFormat = d3.time.format("%m/%d"),
    hourFormat = d3.time.format("%I:%M%p");

  var eventsApp = {
    init : function() {
      this.setUpMap();
      this.setUpEventHandlers();
      this.tryForAutoLocation();
    },
    setUpMap : function() {
      map = L.Mapzen.map('map', {
        scrollWheelZoom : false,
        scene : L.Mapzen.HouseStyles.Refill
      });
      map.fitBounds([[48,-123], [28,-70]]);

      map.on("moveend",function(){
        if (!document.getElementById('move-update').checked) return;
        var meters = map.getBounds().getNorthEast().distanceTo(map.getBounds().getSouthWest()),
          miles = meters*0.000621371,
          center = map.getCenter();
        searchedLocation = [center.lat, center.lng];
        eventsApp.doEventSearch(center.lat, center.lng, miles/2);
      });
    },
    setUpEventHandlers : function() {
      d3.select("#radius-select").on("change",function(){
        eventsApp.doEventSearch(searchedLocation[0],searchedLocation[1], eventsApp.getRadius());
      });
      d3.select("#move-update").on("change",function(){
        d3.select(".radius-wrapper")
          .classed("disabled",document.getElementById('move-update').checked);
      });
      d3.select("#search-input").on("keyup",function(){
        eventsApp.processKeyup(d3.event);
      });
      d3.select(".clear-button").on("click",function(){
        eventsApp.clearSearchBox();
      });
    },
    tryForAutoLocation : function() {
      if (!navigator.geolocation) return;

      navigator.geolocation.getCurrentPosition(function(position) {
          searchedLocation = [position.coords.latitude, position.coords.longitude];
          eventsApp.doEventSearch(searchedLocation[0], searchedLocation[1], eventsApp.getRadius());
      }, function error(msg) {
          //do nothing
      },
      // if the browser has a cached location thats not more than one hour
      // old, we'll just use that to make the page go faster.
      {maximumAge: 1000 * 3600});
    },
    formatDate : function(startDate, endDate) {
      var start = iso.parse(startDate),
        end = endDate ? iso.parse(endDate) : null;
      if (end && dateFormat(start) == dateFormat(end))
        var dateString = dateFormat(start) + ", " + hourFormat(start) + " - " + hourFormat(end);
      else
        var dateString = wholeDate(start) + (end ?  (" - " + wholeDate(end)) : "");
      return '<svg class="icon icon-calendar" viewBox="0 0 14 16" version="1.1" width="14" height="16" aria-hidden="true"><path d="M13 2h-1v1.5c0 .28-.22.5-.5.5h-2c-.28 0-.5-.22-.5-.5V2H6v1.5c0 .28-.22.5-.5.5h-2c-.28 0-.5-.22-.5-.5V2H2c-.55 0-1 .45-1 1v11c0 .55.45 1 1 1h11c.55 0 1-.45 1-1V3c0-.55-.45-1-1-1zm0 12H2V5h11v9zM5 3H4V1h1v2zm6 0h-1V1h1v2zM6 7H5V6h1v1zm2 0H7V6h1v1zm2 0H9V6h1v1zm2 0h-1V6h1v1zM4 9H3V8h1v1zm2 0H5V8h1v1zm2 0H7V8h1v1zm2 0H9V8h1v1zm2 0h-1V8h1v1zm-8 2H3v-1h1v1zm2 0H5v-1h1v1zm2 0H7v-1h1v1zm2 0H9v-1h1v1zm2 0h-1v-1h1v1zm-8 2H3v-1h1v1zm2 0H5v-1h1v1zm2 0H7v-1h1v1zm2 0H9v-1h1v1z"></path></svg>' + dateString;
    },
    formatLocation: function(p) {
      return '<svg class="icon icon-location" viewBox="0 0 12 16" version="1.1" width="12" height="16" aria-hidden="true"><path d="M6 0C2.69 0 0 2.5 0 5.5 0 10.02 6 16 6 16s6-5.98 6-10.5C12 2.5 9.31 0 6 0zm0 14.55C4.14 12.52 1 8.44 1 5.5 1 3.02 3.25 1 6 1c1.34 0 2.61.48 3.56 1.36.92.86 1.44 1.97 1.44 3.14 0 2.94-3.14 7.02-5 9.05zM8 5.5c0 1.11-.89 2-2 2-1.11 0-2-.89-2-2 0-1.11.89-2 2-2 1.11 0 2 .89 2 2z"></path></svg>'
        + (p.name ? p.name + ", " : "") + p.address1 + " " + p.address2
        + " " + p.city + " " + p.postalCode;
    },
    addMarkers : function(features) {
      markers = [];
      features.forEach(function(f){
        var marker = L.marker(L.latLng(f.locations[0].latitude, f.locations[0].longitude));
        marker.bindPopup(
          "<h2>"+f.name+"</h2><p class='time'>"
          +eventsApp.formatDate(f.startDate, f.endDate)
          +"</p><p class='location'>"+eventsApp.formatLocation(f.locations[0])
          +"</p><p class='description'>"+f.description
          +"</p><p class='rsvp'><a href='https://www.hillaryclinton.com/events/view/'"+f.lookupId+">rsvp</a></p>"
        );
        markers.push(marker);
        marker.addTo(map);
      });

      // zoom to fit markers if the "update map button" is unchecked
      if (document.getElementById('move-update').checked || !markers.length) return;
      var group = new L.featureGroup(markers),
        bounds = group.getBounds();
      map.fitBounds(bounds, { maxZoom : 15});
    },
    getRadius : function() {
      var sel = document.getElementById('radius-select');
      return sel.options[sel.selectedIndex].value;
    },
    processKeyup : function(event) {
      var inputDiv = document.getElementById("search-input");
      var val = inputDiv.value;

      d3.select(".clear-button").style("display","inline-block");

      if (!val.length) {
        eventsApp.clearSearchBox();

      } else if (event.keyCode == 40) { //arrow down
        keyIndex = Math.min(keyIndex+1, d3.selectAll(".suggestion")[0].length-1);
        eventsApp.selectSuggestion();

      } else if (event.keyCode == 38) { //arrow up
        keyIndex = Math.max(keyIndex-1, 0);
        eventsApp.selectSuggestion();

      } else if (event.keyCode == 13) { //enter
        eventsApp.onSubmit(val);

      } else if (event.keyCode != 8 && (event.keyCode < 48 || event.keyCode > 90)) {
        // restrict autocomplete to 0-9,a-z character input, excluding delete
        return;

      } else {
        // general case of typing to filter list and get autocomplete suggestions
        keyIndex = -1;
        eventsApp.throttledDoSuggestion(val);
      }
    },
    selectSuggestion : function() {
      // for handling keyboard input on the autocomplete list
      var currentList = d3.selectAll(".suggestion");
      currentList.each(function(d, i){
        if (i == keyIndex) {
          document.getElementById("search-input").value = d.name ? d.name : d.properties.label;
        }
      }).classed("selected",function(d,i){ return i == keyIndex; });
    },
    doSuggestion : function(query) {
      if (xhr) xhr.abort();
      xhr = d3.json("https://search.mapzen.com/v1/autocomplete?text="+query+"&boundary.country=USA&api_key=search-Ff4Gs8o", function(err, results) {
        var events = results.features;
        // add a zip code result at the top
        if (Number(query) && query.length == 5) {
          events.unshift({
            properties : {
              label : "Zip Code: "+query
            },
            name : query
          });
        }
        eventsApp.showSuggestions(events);
      });
    },
    showSuggestions : function(data) {
      var suggestion = d3.select(".autocomplete")
        .selectAll(".suggestion").data(data);
      suggestion.enter().append("div").attr("class","suggestion");
      suggestion.exit().remove();
      suggestion.text(function(d){ return d.properties.label; })
        .on("click",function(d){
          var name = d.name ? d.name : d.properties.label;
          document.getElementById("search-input").value = name;
          eventsApp.onSubmit(name);
        });
    },
    clearSearchBox : function() {
      // triggered by "x" click or an empty search box
      document.getElementById("search-input").value = "";
      d3.select(".clear-button").style("display","none");
      d3.selectAll(".suggestion").remove();
    },
    onSubmit: function(query) {
      d3.selectAll(".suggestion").remove();
      if (Number(query) && query.length == 5) { // try to identify zip codes
        searchedLocation = zip_to_lat[query];
        if (!searchedLocation) {
          d3.select("#events").attr("class","search-error");
          return;
        }
        map.setView(searchedLocation, 12);
        eventsApp.doEventSearch(searchedLocation[0],searchedLocation[1], eventsApp.getRadius());
      } else
        d3.json("https://search.mapzen.com/v1/search?text="+query+"&boundary.country=USA&api_key=search-Ff4Gs8o", function(error, json) {
          if (!json.features.length) {
            d3.select("#events").attr("class","search-error");
            return;
          }

          var selected = json.features[0],
            searchedLocation = [selected.geometry.coordinates[1], selected.geometry.coordinates[0]];
          if (selected.bbox) {
            bbox = selected.bbox;
            map.fitBounds([[bbox[1],bbox[0]],[bbox[3], bbox[2]]]);
          } else {
            map.setView(searchedLocation, 12);
          }

          eventsApp.doEventSearch(searchedLocation[0],searchedLocation[1], eventsApp.getRadius());
        });
    },
    doEventSearch : function(lat, lng, radius) {
      // shameful hack to work around all the NYC City Hall events;
      // by retrieving 500 results and ignoring the NYC City Hall ones we get reasonable
      // behavior for Manhattan users.
      d3.json("https://www.hillaryclinton.com/api/events/events?lat="+lat+"&lng="+lng+"&radius="+radius+"&earliestTime="+earliestTime+"&status=confirmed&visibility=public&perPage=500&onepage=1&_=1457303591599", function(error, json){

        // events happening at NYC City Hall have a fake location, are not actually happening there, and should not be shown
        var eventsToShow = _.reject(json.events, function(event) { return event.locations[0].latitude == "40.7127837" && event.locations[0].longitude == "-74.0059413" } );

        markers.forEach(function(m){
          map.removeLayer(m);
        });
        eventsApp.addMarkers(eventsToShow);

        d3.select("#events").attr("class",eventsToShow.length ? "event" : "error");

        eventsToShow.sort(function(a,b){ return iso.parse(a.startDate) - iso.parse(b.startDate); });

        var events = d3.select(".event-list").selectAll(".list-event").data(eventsToShow);
        var entering = events.enter().append("div").attr("class","list-event");
        entering.append("a").attr("class","rsvp").text("RSVP");
        entering.append("h3");
        entering.append("p").attr("class","time");
        entering.append("p").attr("class","location");
        entering.append("p").attr("class","description");
        events.exit().remove();
        events.select("h3").text(function(d){ return d.name; });
        events.select(".time").html(function(d){
          return eventsApp.formatDate(d.startDate, d.endDate);
        });
        events.select(".location").html(function(d){
          return eventsApp.formatLocation(d.locations[0]);
        });
        events.select(".description").text(function(d){ return d.description; });
        events.select(".rsvp").attr("href",function(d){ return "https://www.hillaryclinton.com/events/view/"+d.lookupId; });
      });
    }
  };
  eventsApp.throttledDoSuggestion = _.throttle(eventsApp.doSuggestion, 50);
  return eventsApp;
}
