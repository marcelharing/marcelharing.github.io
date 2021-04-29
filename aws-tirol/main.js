let basemapGray = L.tileLayer.provider('BasemapAT.grau')

//https://leafletjs.com/reference-1.7.1.html#map-l-map >>karte initialisieren
let map = L.map("map", {
    center: [47, 11],
    zoom: 9,
    layers: [
        basemapGray
    ]
});

// https://leafletjs.com/reference-1.7.1.html#control-layers >>Layercontrol erzeugen
// https://leafletjs.com/reference-1.7.1.html#tilelayer >>Layercontrol wird mit Tilelayer gefüllt, 
// Tilelayererzeugung mit providers extension https://github.com/leaflet-extras/leaflet-providers

let overlays = {
    stations: L.featureGroup(),
    temperature: L.featureGroup(),
    snowheight: L.featureGroup(),
    windspeed: L.featureGroup(),
    winddirection: L.featureGroup(),
    humidity: L.featureGroup()
};


let layerControl = L.control.layers({
    "BasemapAT.grau": basemapGray,
    "BasemapAT Orthofoto": L.tileLayer.provider('BasemapAT.orthofoto'),
    "Stamen Watercolor": L.tileLayer.provider('Stamen.Watercolor'),
    "OpenTopoMap": L.tileLayer.provider('OpenTopoMap'),
    "BasemapAT overlay": L.tileLayer.provider('BasemapAT.overlay'),
    "Basemap Overlay + Ortho": L.layerGroup([
        L.tileLayer.provider('BasemapAT.orthofoto'),
        L.tileLayer.provider('BasemapAT.overlay')
    ])
}, {
    "Wetterstationen Tirol": overlays.stations,
    "Temperatur (°C)": overlays.temperature,
    "Schneehöhe (cm)": overlays.snowheight,
    "Windgeschwindigkeit (km/h)": overlays.windspeed,
    "Windrichtung": overlays.winddirection,
    "Luftfeuchte": overlays.humidity
}, {
    collapsed: false
}, ).addTo(map);

L.control.scale({
    imperial: false,
    updateWhenIdle: false
}).addTo(map);

/* Rainfall Plugin */
L.control.rainviewer({
    position: 'bottomright',
    nextButtonText: '>',
    playStopButtonText: 'Start/Stop',
    prevButtonText: '<',
    positionSliderLabelText: "Zeit:",
    opacitySliderLabelText: "Transparenz:",
    animationInterval: 800,
    opacity: 0.7
}).addTo(map);



// Farbpaletten Funktion
let getColor = (value, colorRamp) => {
    //console.log("Wert:", value, "Palette:", colorRamp);
    for (let rule of colorRamp) {
        if (value >= rule.min && value < rule.max) {
            return rule.col;
        }
    }
    return "black";
};

// Funktion Windrichtung 
let getDirection = (value, windDirection) => {
    //console.log("Wert:", value, "Palette:", colorRamp);
    for (let rule of windDirection) {
        if (value >= rule.min && value < rule.max) {
            return rule.dir;
        }
    }
};

// newLabel Funktion stellt Wetterstationen dar
let newLabel = (coords, options) => {
    let color = getColor(options.value, options.colors);
    //console.log("Wert", options.value, "bekommt Farbe", color);
    let label = L.divIcon({
        html: `<div style="background-color:${color}">${options.value}</div>`,
        className: "text-label"
    })
    let marker = L.marker([coords[1], coords[0]], {
        icon: label,
        title: `${options.station} (${coords[2]}m)`
    });
    return marker;
};


let awsUrl = 'https://wiski.tirol.gv.at/lawine/produkte/ogd.geojson';


// https://leafletjs.com/reference-1.7.1.html#marker >> Marker mit dazugehörigem Icon auf Karte hinzufügen
// https://leafletjs.com/reference-1.7.1.html#divicon div element als Icon, erbt von Standardicon
fetch(awsUrl)
    .then(response => response.json())
    .then(json => {
        console.log('Daten konvertiert: ', json);
        for (station of json.features) {
            console.log('Station: ', station);
            let marker = L.marker([
                station.geometry.coordinates[1],
                station.geometry.coordinates[0]
            ]);
            let formattedDate = new Date(station.properties.date)
            marker.bindPopup(`
            <h3>${station.properties.name}</h3>
            <ul>
                <li>Datum: ${formattedDate.toLocaleString("de")}</li>
                <li>Temperatur: ${station.properties.LT} C°</li>
                <li>Schneehöhe: ${station.properties.HS || '?'} cm</li>
                <li>Luftfeuchte: ${station.properties.RH || '?'} %</li>
                <li>Windrichtung: ${getDirection(station.properties.WR, DIRECTIONS) || '?'}</li>
                <li>Seehöhe: ${station.geometry.coordinates[2]} Hm </li>
            </ul>
            <a target=" blank" href="https://wiski.tirol.gv.at/lawine/grafiken/1100/standard/tag/${station.properties.plot}.png">Grafik</a>
            `);
            marker.addTo(overlays.stations);

            // schneehöhen hervorheben
            if (typeof station.properties.HS == "number") {
                let marker = newLabel(station.geometry.coordinates, {
                    value: station.properties.HS.toFixed(0),
                    colors: COLORS.snowheight,
                    station: station.properties.name
                });
                marker.addTo(overlays.snowheight);
            }

            // windgeschwindigkeiten hervorheben
            if (typeof station.properties.WG == "number") {
                let marker = newLabel(station.geometry.coordinates, {
                    value: station.properties.WG.toFixed(0),
                    colors: COLORS.windspeed,
                    station: station.properties.name
                });
                marker.addTo(overlays.windspeed);
            }

            // Lufttemperatur hervorheben
            if (typeof station.properties.LT == "number") {
                let marker = newLabel(station.geometry.coordinates, {
                    value: station.properties.LT.toFixed(1),
                    colors: COLORS.temperature,
                    station: station.properties.name
                });
                marker.addTo(overlays.temperature);
            }

            // Luftfeuchte hervorheben
            if (typeof station.properties.RH == "number") {
                let marker = newLabel(station.geometry.coordinates, {
                    value: station.properties.RH.toFixed(1),
                    colors: COLORS.humidity,
                    station: station.properties.name
                });
                marker.addTo(overlays.humidity);
            }

            /* Windrichtung hervorheben   
            if (typeof station.properties.WR == "number") {
                let marker = newLabel(station.geometry.coordinates, {
                    value: station.properties.WR,
                    colors: COLORS.temperature,
                    station: station.properties.name
                });
                marker.addTo(overlays.winddirection); 
            }        */
        }
        // set map view to all stations
        map.fitBounds(overlays.stations.getBounds());
    });