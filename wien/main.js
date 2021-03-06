// OGD-Wien Beispiel

// Kartenhintergründe der basemap.at definieren
let baselayers = {
    standard: L.tileLayer.provider("BasemapAT.basemap"),
    grau: L.tileLayer.provider("BasemapAT.grau"),
    terrain: L.tileLayer.provider("BasemapAT.terrain"),
    surface: L.tileLayer.provider("BasemapAT.surface"),
    highdpi: L.tileLayer.provider("BasemapAT.highdpi"),
    ortho_overlay: L.layerGroup([
        L.tileLayer.provider("BasemapAT.orthofoto"),
        L.tileLayer.provider("BasemapAT.overlay")
    ]),
};

// Overlays für die Themen zum Ein- und Ausschalten definieren
let overlays = {
    busLines: L.featureGroup(),
    busStops: L.markerClusterGroup(),
    pedAreas: L.featureGroup(),
    sightseeing: L.featureGroup()
};

// Karte initialisieren und auf Wiens Wikipedia Koordinate blicken
let map = L.map("map", {
    fullscreenControl: true,
    center: [48.208333, 16.373056],
    zoom: 13,
    layers: [
        baselayers.grau
    ]
});

// Kartenhintergründe und Overlays zur Layer-Control hinzufügen
let layerControl = L.control.layers({
    "basemap.at Standard": baselayers.standard,
    "basemap.at grau": baselayers.grau,
    "basemap.at Relief": baselayers.terrain,
    "basemap.at Oberfläche": baselayers.surface,
    "basemap.at hochauflösend": baselayers.highdpi,
    "basemap.at Orthofoto beschriftet": baselayers.ortho_overlay
}, {
    "Liniennetz Vienna Sightseeing": overlays.busLines,
    "Haltestellen Vienna Sightseeing": overlays.busStops,
    "Fußgängerzonen": overlays.pedAreas,
    "Sehenswürdigkeiten": overlays.sightseeing
}).addTo(map);


// alle Overlays nach dem Laden anzeigen
overlays.busLines.addTo(map);
overlays.busStops.addTo(map);
overlays.pedAreas.addTo(map);


let drawBusStop = (geojsonData) => {
    L.geoJson(geojsonData, {
        onEachFeature: (feature, layer) => {
            layer.bindPopup(`<strong>Station: ${feature.properties.STAT_NAME}<hr></strong>
            Buslinie: ${feature.properties.LINE_NAME}`)
        },
        pointToLayer: (geoJsonPoint, latlng) => {
            return L.marker(latlng, {
                icon: L.icon({
                    iconUrl: 'icons/busstop.png',
                    iconSize: [34, 34]
                })
            })
        },
        attribution: '<a href=https://data.wien.gv.at>Stadt Wien</a> - <a href=https://mapicons.mapsmarker.com/> Mapsmarker</a>'
    }).addTo(overlays.busStops);

}

let drawBusLines = (geojsonData) => {
    L.geoJson(geojsonData, {
        style: (feature) => {
            let col = "red";
            col = COLORS.buslines[feature.properties.LINE_NAME]
            return {
                color: col
            }
        },
        onEachFeature: (feature, layer) => {
            layer.bindPopup(`Buslinie: ${feature.properties.LINE_NAME} <hr>
            von ${feature.properties.FROM_NAME}
            nach ${feature.properties.TO_NAME}`)
        },
        attribution: '<a href=https://data.wien.gv.at>Stadt Wien</a> - <a href=https://mapicons.mapsmarker.com/> Mapsmarker</a>'
    }).addTo(overlays.busLines);
}

let drawPedestrianAreas = (geojsonData) => {
    L.geoJson(geojsonData, {
        style: (feature) => {
            return {
                stroke: true,
                color: "silver",
                fillColor: "yellow",
                fillOpacity: 0.3
            }
        },
        onEachFeature: (feature, layer) => {
            layer.bindPopup(`<strong>Fußgängerzone: ${feature.properties.ADRESSE} </strong><hr>
             ${feature.properties.ZEITRAUM || ""}
             ${feature.properties.AUSN_TEXT || ""}`)
        },
        attribution: '<a href=https://data.wien.gv.at>Stadt Wien</a> - <a href=https://mapicons.mapsmarker.com/> Mapsmarker</a>'
    }).addTo(overlays.pedAreas);
}

let drawSightseeing = (geojsonData) => {
    L.geoJson(geojsonData, {
        onEachFeature: (feature, layer) => {
            layer.bindPopup(`<strong>${feature.properties.NAME}</strong> <br>
            <a href="${feature.properties.WEITERE_INF || ""}"> Weitere Infos</a> <br>
            <img width="100" src="${feature.properties.THUMBNAIL}" />`)
        },
        pointToLayer: (geoJsonPoint, latlng) => {
            return L.marker(latlng, {
                icon: L.icon({
                    iconUrl: 'icons/sehenswuerdigogd.png',
                    iconSize: [22, 22]
                })
            })
        },
        attribution: '<a href=https://data.wien.gv.at>Stadt Wien</a> - <a href=https://mapicons.mapsmarker.com/> Mapsmarker</a>'
    }).addTo(overlays.sightseeing);

}




for (let config of OGDWIEN) {
    console.log("Config: ", config.data);
    fetch(config.data)
        .then(response => response.json())
        .then(geojsonData => {
            console.log("Data: ", geojsonData);
            if (config.title == "Haltestellen Vienna Sightseeing") {
                drawBusStop(geojsonData);
            }
            if (config.title == "Liniennetz Vienna Sightseeing") {
                drawBusLines(geojsonData);
            }
            if (config.title == "Fußgängerzonen") {
                drawPedestrianAreas(geojsonData);
            }
            if (config.title == "Sehenswürdigkeiten Wien") {
                drawSightseeing(geojsonData);
            }
        })
}

// Leaflet Hash
L.hash(map);

// Leaflet Minimap
var miniMap = new L.Control.MiniMap(L.tileLayer.provider("BasemapAT.basemap"), {
    toggleDisplay : true,
    minimized: true,
}
).addTo(map);

//reachability plugin
let styleIntervals = (feature) => {
    let color = "";
    let range = feature.properties.Range;
    if (feature.properties.Measure === "time") {
        color = COLORS.minutes[range];
    } else if (feature.properties.Measure === "distance") {
        color = COLORS.kilometers[range];
    } else {
        color = "black";
    }
    return {
        color: color,
        opacity: 0.5,
        fillOpacity: 0.2
    }; 
};


L.control.reachability({
    apiKey: "5b3ce3597851110001cf6248c8dd4e5431a048b19580e80f41d71ddf",
    styleFn: styleIntervals,
    drawButtonContent: '',
    drawButtonStyleClass: 'fa fa-pencil-alt fa-2x',
    deleteButtonContent: '',
    deleteButtonStyleClass: 'fa fa-trash fa-2x',
    distanceButtonContent: '',
    distanceButtonStyleClass: 'fa fa-road fa-2x',
    timeButtonContent: '',
    timeButtonStyleClass: 'fa fa-clock fa-2x',
    travelModeButton1Content: '',
    travelModeButton1StyleClass: 'fa fa-car fa-2x',
    travelModeButton2Content: '',
    travelModeButton2StyleClass: 'fa fa-bicycle fa-2x',
    travelModeButton3Content: '',
    travelModeButton3StyleClass: 'fa fa-male fa-2x',
    travelModeButton4Content: '',
    travelModeButton4StyleClass: 'fa fa-wheelchair fa-2x',
    
}).addTo(map);

