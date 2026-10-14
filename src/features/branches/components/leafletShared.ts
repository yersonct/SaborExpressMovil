export type Coords = { latitude: number; longitude: number };

export type MapMarker = {
  id: string;
  latitude: number;
  longitude: number;
  title?: string;
  description?: string;
  color?: string;
  draggable?: boolean;
};

export type LeafletMapProps = {
  markers: MapMarker[];
  route?: Coords[];
  // Cuando cambia este valor, el mapa se vuelve a encuadrar para ver todo.
  fitKey?: string;
  // Para centrar el mapa en un punto (cambia "nonce" para repetirlo).
  focus?: (Coords & { nonce: number }) | null;
  onPress?: (c: Coords) => void;
  onMarkerDragEnd?: (id: string, c: Coords) => void;
};

// Funciona dentro de un WebView (móvil) y dentro de un iframe (web):
// post() detecta dónde está corriendo y manda el mensaje por el canal correcto.
export const LEAFLET_HTML = `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>html,body,#map{height:100%;margin:0;padding:0;background:#e5e7eb}</style>
</head>
<body>
<div id="map"></div>
<script>
var map = L.map('map').setView([2.9273, -75.2819], 13);
L.tileLayer('https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=4MD748DSh1hxGOF9NqM7', {
  maxZoom: 20,
  attribution: '&copy; MapTiler &copy; OpenStreetMap contributors'
}).addTo(map);
var layer = L.layerGroup().addTo(map);

function post(o) {
  var s = JSON.stringify(o);
  if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(s);
  else window.parent.postMessage(s, '*');
}

map.on('click', function (e) {
  post({ type: 'tap', lat: e.latlng.lat, lng: e.latlng.lng });
});

window.updateMap = function (d) {
  layer.clearLayers();
  var pts = [];

  if (d.route && d.route.length > 1) {
    var line = d.route.map(function (c) { return [c.latitude, c.longitude]; });
    L.polyline(line, { color: '#2563EB', weight: 5 }).addTo(layer);
    pts = pts.concat(line);
  }

  d.markers.forEach(function (m) {
    var icon = L.divIcon({
      className: '',
      iconSize: [24, 24],
      iconAnchor: [12, 12],
      html: '<div style="width:24px;height:24px;border-radius:50%;background:' +
        (m.color || '#E61C24') +
        ';border:3px solid #fff;box-shadow:0 1px 5px rgba(0,0,0,.55)"></div>'
    });
    var mk = L.marker([m.latitude, m.longitude], { icon: icon, draggable: !!m.draggable }).addTo(layer);
    if (m.title) {
      mk.bindPopup('<b>' + m.title + '</b>' + (m.description ? '<br>' + m.description : ''));
    }
    if (m.draggable) {
      mk.on('dragend', function (e) {
        var p = e.target.getLatLng();
        post({ type: 'drag', id: m.id, lat: p.lat, lng: p.lng });
      });
    }
    pts.push([m.latitude, m.longitude]);
  });

  if (d.fit && pts.length) {
    if (pts.length === 1) map.setView(pts[0], 15);
    else map.fitBounds(pts, { padding: [50, 50] });
  }
};

// Solo web: la página padre le manda órdenes al iframe por postMessage.
window.addEventListener('message', function (e) {
  if (window.ReactNativeWebView) return;
  try {
    var m = JSON.parse(e.data);
    if (m.cmd === 'update') window.updateMap(m.payload);
    else if (m.cmd === 'focus') map.setView([m.lat, m.lng], 16);
  } catch (err) {}
});

post({ type: 'ready' });
</script>
</body>
</html>`;
