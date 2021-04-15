let stop = {
    nr: 8,
    name: "Taiaroa Head",
    lat: -45.775,
    lng: 170.727778,
    user: "marcelharing",
    wikipedia: "https://en.wikipedia.org/wiki/Taiaroa_Head"
}

console.log(stop);
console.log(stop.name);

const map = L.map("map", {
    // center: [stop.lat, stop.lng],
    // zoom: 13,
    layers: [
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png")
    ]
});


let nav = document.querySelector("#navigation");

ROUTE.sort((stop1, stop2) => {
    return stop1.nr > stop2.nr
});

for (let entry of ROUTE) {
    // console.log(entry);

    nav.innerHTML += `
        <option value="${entry.user}">Stop ${entry.nr}: ${entry.name}</option>
        `;

    let mrk = L.marker([entry.lat, entry.lng]).addTo(map);
    mrk.bindPopup(`
        <h4>Stop ${entry.nr}: ${entry.name}</h4>
        <p><i class="fab fa-wikipedia-w marg_r3"></i><a href="${entry.wikipedia}">Read about stop on Wikipedia</a></p>
    `)

    if (entry.nr == 8) {
        map.setView([entry.lat, entry.lng], 13)
        mrk.openPopup();
    }
}

nav.options.selectedIndex = 8 -1;
nav.onchange = (evt) => {
    let selected = evt.target.selectedIndex;
    let options = evt.target.options;

    let username = options[selected].value;
    let link = `https://${username}.github.io/nz/index.html`;
    console.log(username, link);

    window.location.href = link;
};

//console.log(document.querySelector("#map"));
