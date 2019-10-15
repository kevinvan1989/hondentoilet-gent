// import packages
import axios from 'axios';
import {
  getDistance
} from 'geolib';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// import styles
import 'bootstrap/dist/css/bootstrap.min.css';
import '../styles/index.scss';

let map, stdMarker, nearestMarker, userMarker;
const generateMap = () => {
  map = L.map('myMap', {
    //Where the map is centered (location)
    center: [51.051123, 3.713242],
    //Zoom ratio
    zoom: 13
  });

  //Generates the map
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: 'Hondentoilet in Gent'
  }).addTo(map);
};

//Create the custom markers
const generateMarkers = () => {
  //Create standard marker
  stdMarker = L.icon({
    iconUrl: './public/icons/pin-blue.png',
    iconSize: [50, 68], // size of the icon
    iconAnchor: [25, 68], // point of the icon which will correspond to marker's location 
    popupAnchor: [-3, -76] // point from which the popup should open relative to the iconAnchor
  });

  //Create nearest marker
  nearestMarker = L.icon({
    iconUrl: './public/icons/pin-red.png',
    iconSize: [50, 68], // size of the icon
    iconAnchor: [25, 68], // point of the icon which will correspond to marker's location 
    popupAnchor: [-3, -76] // point from which the popup should open relative to the iconAnchor
  });

  //Create user marker
  userMarker = L.icon({
    iconUrl: './public/icons/pin-user.png',
    iconSize: [50, 68], // size of the icon
    iconAnchor: [25, 68], // point of the icon which will correspond to marker's location 
    popupAnchor: [-3, -76] // point from which the popup should open relative to the iconAnchor
  });
};

const setMarkers = (lat, long, marker) => {
  L.marker([lat, long], {
    icon: marker
  }).addTo(map);
};

//Generate the map and markers
let coordsToilets;
const accessToiletDb = () =>{
axios.get('https://datatank.stad.gent/4/infrastructuur/hondenvoorzieningen.geojson')
  .then(function (response) {
    // handle success
    coordsToilets = response.data.coordinates;
    coordsToilets.forEach((el) => {
      setMarkers(el[1], el[0], stdMarker);
    });

    calculateDistance();
  })
  .catch(function (error) {
    // handle error
    console.log(error);
  })
  .finally(function () {
    // always executed
  });
};

let userPosition;
const success = (pos) => {
  userPosition = {
    lat: pos.coords.latitude,
    long: pos.coords.longitude
  };

  //Set custom marker on users position & center
  setMarkers(userPosition.lat, userPosition.long, userMarker);
  map.panTo(new L.LatLng(userPosition.lat, userPosition.long));
  calculateDistance();
  console.log(userPosition);

};

const getUserPosition = () => {
  navigator.geolocation.getCurrentPosition(success);
};

let distanceToilets = [];
const calculateDistance = () => {
  if (userPosition && coordsToilets) {
    coordsToilets.forEach((el) => {
      let dist = getDistance([userPosition.lat, userPosition.long], [el[1], el[0]]);
      dist = (dist / 1000).toFixed(2);

      const toilet = {
        lat: el[1],
        long: el[0],
        distance: dist
      };
      distanceToilets.push(toilet);
    });

    sortArrayDistance(distanceToilets);
    fillData(distanceToilets);
    console.log(distanceToilets);
  }
};

const sortArrayDistance = (x) => {
  x.sort(function (a, b) {
    if (a.distance < b.distance) {
      return -1;
    };
    if (a.distance > b.distance) {
      return 1;
    };
    return 0;
  });
};

const fillData = (data) => {
  const listGroup = document.querySelector('#data');
  for (let i = 0; i < 5; i++) {
    const listLink = document.createElement('a');
    listLink.setAttribute('href', '#');
    listLink.setAttribute('data-id', `link${i+1}`);
    listLink.setAttribute('class', 'list-group-item list-group-item-action');
    listLink.innerHTML =
      `<div class="d-flex w-100 justify-content-between">
          <h5 class="mb-1">Hondentoilet ${i+1}</h5>
          <small class="text-muted">${data[i].distance} km</small>
       </div>
       <p class="mb-1">Position: <br>Latitude: ${data[i].lat} <br>Longitude: ${data[i].long}</p>
       <small class="text-muted">Donec id elit non mi porta.</small>`;
    listGroup.appendChild(listLink);
  };
};

generateMap();
generateMarkers();
accessToiletDb();
getUserPosition();