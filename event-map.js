var eventsMap = function() {
  var map,
    markers = [],
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
        currentLocation = [center.lat, center.lng];
        eventsApp.doSearch(center.lat, center.lng, miles/2);
      });

      var geocoder = L.Mapzen.geocoder('search-Ff4Gs8o', { focus : false });
      geocoder.addTo(map);

      geocoder.on('select', function (e) {
        currentLocation = [e.latlng.lat, e.latlng.lng];
        eventsApp.doSearch(e.latlng.lat, e.latlng.lng, eventsApp.getRadius());
      });
    },
    addMarkers : function(features) {
      markers = [];
      features.forEach(function(f){
        var marker = L.marker(L.latLng(f.locations[0].latitude, f.locations[0].longitude));
        marker.bindPopup("<h2>"+f.name+"</h2><p>"+f.description+"</p>");
        markers.push(marker);
        marker.addTo(map);
      });

      // zoom to fit markers if the "update map button" is unchecked
      if (document.getElementById('move-update').checked) return;
      var group = new L.featureGroup(markers);
        map.fitBounds(group.getBounds());
    },
    setUpEventHandlers : function() {
      d3.select("#radius-select").on("change",function(){
        eventsApp.doSearch(currentLocation[0],currentLocation[1], eventsApp.getRadius());
      });
      d3.select("#move-update").on("change",function(){
        d3.select(".radius-wrapper")
          .classed("disabled",document.getElementById('move-update').checked);
      });
    },
    getRadius : function() {
      var sel = document.getElementById('radius-select');
      return sel.options[sel.selectedIndex].value;
    },
    formatDate : function(startDate, endDate) {
      var start = iso.parse(startDate),
        end = iso.parse(endDate);
      if (end && dateFormat(start) == dateFormat(end))
        return dateFormat(start) + ", " + hourFormat(start) + " - " + hourFormat(end);
      else
        return wholeDate(start) + (end ?  (" - " + wholeDate(end)) : ""); 
    },
    doSearch : function(lat, lng, radius) {
      d3.json("https://www.hillaryclinton.com/api/events/events?lat="+lat+"&lng="+lng+"&radius="+radius+"&earliestTime="+earliestTime+"&status=confirmed&visibility=public&perPage=50&onepage=1&_=1457303591599", function(error, json){

        markers.forEach(function(m){
          map.removeLayer(m);
        });
        eventsApp.addMarkers(json.events);

        d3.select("#events").attr("class",json.events.length ? "event" : "error");

        json.events.sort(function(a,b){ return iso.parse(a.startDate) - iso.parse(b.startDate); });
        var events = json.events.filter(function(a){ return a.guestsCanInviteOthers; });

        var events = d3.select(".event-list").selectAll(".list-event").data(events);
        var entering = events.enter().append("div").attr("class","list-event");
        entering.append("h3");
        entering.append("p").attr("class","time");
        entering.append("p").attr("class","location");
        entering.append("p").attr("class","description");
        events.exit().remove();
        events.select("h3").text(function(d){ return d.name; });
        events.select(".time").text(function(d){
          return eventsApp.formatDate(d.startDate, d.endDate);
        });
        events.select(".location").text(function(d){
          var p = d.locations[0];
          return (p.name ? p.name + ", " : "") + p.address1 + " " + p.address2 + " " + p.city + " " + p.postalCode;
        });
        events.select(".description").text(function(d){ return d.description; });
      });
    }
  };
  return eventsApp;
}
eventsMap().init();