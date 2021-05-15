'use strict';

class Workout {
  date = new Date();
  // creating a unique ID WITH timestamp -Date.now() - returns the number of milliseconds since midnight 01 January, 1970 UTC
  id = (Date.now() + '').slice(-10);
  // data common for cycling and running
  constructor(coords, distance, duration) {
    // this.coords is equal as the coords that we get as the input
    this.coords = coords; //[lat, lng]
    this.distance = distance; //in km
    this.duration = duration; //in min
  }
  // when the new object is createD a description is set
  _setDescription() {
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
}

// child classes of workout:
class Running extends Workout {
  type = 'running';
  // it takes the same data as the parent class plus additional properties that we want to set on the running object
  constructor(coords, distance, duration, cadence) {
    // calling super class with common properties to the parent class
    // super creates an object {} and links this
    super(coords, distance, duration);
    this.cadence = cadence;
    // calling pace method
    this.calcPace();
    // when the new object is create a description is set
    this._setDescription();
  }
  // creating a method for calculating the pace
  calcPace() {
    // min/km
    // adding new property pace
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  type = 'cycling';
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._setDescription();
  }
  // method
  calcSpeed() {
    // km/h
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

//TESTING MY CLASSES

// const run1 = new Running([39, -12], 5.2, 24, 178);
// const cycling1 = new Cycling([39, -15], 77, 180, 1000);

// console.log(run1, cycling1);

/////////////////////////////////////////
// APPLICATION ARCHITECTURE

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class App {
  // ES2019 -#-  private instance properties which are present for all instances (new objects created through the class App) in the class
  #map;
  #mapZoomLevel = 13;
  #mapEvent;
  #workouts = [];
  constructor() {
    // this.workouts = [];
    // to call this method as soon as we rereive the position ( provide any custom initialization that must be done before any other methods can be called on an instantiated object.)
    // Get user position
    this._getPosition();

    // Get data from local storage
    this._getLocalStorage();
    // _newWorkout is an event handler function which will always have the this keyword of the DOM element that it is attached, so its gonna be the form element and no longer to the App object, so need to fix that using bind() as want to point to the object itself - the app object bind(this) is pointing to it now
    form.addEventListener('submit', this._newWorkout.bind(this));

    inputType.addEventListener('change', this._toggleElevationField);

    // when clicked on the poput goes to the localization. The method is called by the eventlistener method so need to bind 'this' here
    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
  }
  //method
  _getPosition() {
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        // this points to the current object
        this._loadMap.bind(this),
        // fisrt position - success, second argument - if fails to get the position
        function () {
          alert('could not get your position');
        }
      );
  }
  _loadMap(position) {
    // function (position) {
    // latitude goes first (szerokosc), then longitude (dlugosc geogr)
    console.log(position);
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    console.log(latitude, longitude);
    console.log(`https://www.google.com/maps/@${latitude},${longitude}`);

    const coords = [latitude, longitude];
    console.log(this);
    //CODE TAKEN FROM LEAFLET AND ADAPTED TO OUR APP
    //second value represents the level of zoom of the map - 13, ''map'' its an id from html (last line in html file), const map is showing the result of creating the map, and on that map we will add the event listener to add the marker
    this.#map = L.map('map').setView(coords, this.#mapZoomLevel);
    //L is a global variable inside the script that comes from leaflet, has a couple methods to use and its connected with the script, and we can access it with other scripts
    //the theme of them map comes from that link below but if I google I can edit that theme with a different link, btw ma p is made of tiles
    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    ///Handling clicks on the map - when we click our form wil show up
    //adding our marker -we are adding the event handler here but instead of adding eventlistener form JS we use on() coming from Leaflet library which is created and inherited - a special object with extra methods and properties
    //also when the user clicks the form will show us, distance input will be focused and when he clickes enter - it will be submitted
    this.#map.on('click', this._showForm.bind(this));

    this.#workouts.forEach(work => {
      this._renderWorkoutMarker(work);
    });
    // },
  }
  _showForm(mapE) {
    //       we do it like this because we didnt have to have the the access to it as the event
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    // to make input Distance already focued and ready to type
    inputDistance.focus();
  }

  _hideForm() {
    // Empty inputs
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        '';
    // hide it
    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 1000);
  }
  _toggleElevationField() {
    // to unhide cycling, only one of them is visible Cadence or Elevation, but they share the same parent class: form__row so going to toggle this class on those items, using closest method which selects a parent  :) so its hidden for one item and visible for the second :)

    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }
  _newWorkout(e) {
    // (... ) The rest parameter syntax allows a function to accept an indefinite number of arguments as an array
    // it will loop through an array to check if the number is finite, then every() mathod will return true if every number  is finite
    const validInputs = (...inputs) =>
      inputs.every(inp => Number.isFinite(inp));

    const allPositive = (...inputs) => inputs.every(inp => inp > 0);
    // prevent from reload
    e.preventDefault();

    //Get data from the form
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;

    //Check if data is valid (is it a number, is it positive)
    // a guard clause - we are checking the opposite of what we are originally interested in: if the distance is not a number want to return immediately
    if (type === 'running') {
      const cadence = +inputCadence.value;
      // chek is data is valid,
      if (
        // if all of these are numbers, then it will become true
        !validInputs(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
        // if one of them is not a number
        // !Number.isFinite(distance) ||
        // !Number.isFinite(duration) ||
        // !Number.isFinite(cadence)
      )
        // if validInputs is not true(vaid is !False) (one number is not a number) then the alert will be shown
        return alert('Inputs have to be positive numbers!');

      workout = new Running([lat, lng], distance, duration, cadence);
    }

    // If workout running, create running object
    if (type === 'cycling') {
      // convert to number
      const elevation = +inputElevation.value;

      if (
        !validInputs(distance, duration, elevation) ||
        !allPositive(distance, duration)
      )
        return alert('Inputs have to be positive numbers!');
      workout = new Cycling([lat, lng], distance, duration, elevation);
    }
    //If workout cycling, create ccling object

    // Add new object to workout array
    this.#workouts.push(workout);
    console.log(workout);

    // Render workout on map as marker
    this._renderWorkoutMarker(workout);

    // Render workout on list - delegating the functionality to _renderWorkout
    this._renderWorkout(workout);

    // Hide and Clear input fields
    this._hideForm();
    // Display marker
    console.log(this.#mapEvent);

    // Set Local sotrage to all workouts
    this._setLocalStorage();
  }
  _renderWorkoutMarker(workout) {
    //those properties taken from documentation from Leaflet library
    // creates the marker
    // [lat, lng]
    L.marker(workout.coords)
      // adds marker to the map
      .addTo(this.#map)
      // poput created and connected with the marker
      .bindPopup(
        // a brand new poput which contains a couple of options - taken from documentation :)
        L.popup({
          // size
          maxWidth: 250,
          minWidth: 100,
          // dont close when other marker is created
          autoClose: false,
          closeOnClick: false,
          // assigning CSS class to the popus
          className: `${workout.type}-popup`,
        })
      )
      // sets the content
      .setPopupContent(
        `${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}`
      )
      .openPopup();
  }

  _renderWorkout(workout) {
    // DOM manipulation- creating markup HTML and then insert it into the DOM whenever there is new workout
    // custom data attribute : data-id, we add it to build the bridge between the user interface and the data that we have in our app
    let html = `<li class="workout workout--${workout.type}" data-id="${
      workout.id
    }">
    <h2 class="workout__title">${workout.description}</h2>
    <div class="workout__details">
      <span class="workout__icon">${
        workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
      }</span>
      <span class="workout__value">${workout.distance}</span>
      <span class="workout__unit">km</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">⏱</span>
      <span class="workout__value">${workout.duration}</span>
      <span class="workout__unit">min</span>
    </div>`;

    if (workout.type === 'running')
      html += ` <div class="workout__details">
      <span class="workout__icon">⚡️</span>
      <span class="workout__value">${workout.pace.toFixed(1)}</span>
      <span class="workout__unit">min/km</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">🦶🏼</span>
      <span class="workout__value">${workout.cadence}</span>
      <span class="workout__unit">spm</span>
    </div>
  </li>`;
    // rounding to 1 decimal
    if (workout.type === 'cycling')
      html += `<div class="workout__details">
      <span class="workout__icon">⚡️</span>
     
      <span class="workout__value">${workout.speed.toFixed(1)}</span>
      <span class="workout__unit">km/h</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">⛰</span>
      <span class="workout__value">${workout.elevationGain}</span>
      <span class="workout__unit">m</span>
    </div>
  </li>`;

    // inserting as a sibling element at the end of the form
    form.insertAdjacentHTML('afterend', html);
  }

  _moveToPopup(e) {
    // when clicked looking for the closes workout class
    const workoutEl = e.target.closest('.workout');
    console.log(workoutEl);
    // if we click on the background and the parent workout is not found
    // if (!workoutEl) return;
    // using data-id to find the workouton the map which was clicked on the list
    const workout = this.#workouts.find(
      work => work.id === workoutEl.dataset.id
    );
    console.log(workout);
    // taken from documentation form Leaflet
    this.#map.setView(workout.coords, this.#mapZoomLevel, {
      animate: true,
      pan: { duration: 1 },
    });
  }
  // local storage API which is provided by browser
  _setLocalStorage() {
    // name - workout, second argument - a string that we want to store and whih will be associated with this key. Json.stringify - converting any object in JS to a string
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }

  _getLocalStorage() {
    // using parse to go back to an array with objects
    const data = JSON.parse(localStorage.getItem('workouts'));
    console.log(data);

    // if there is no data in local storage dont do anything
    if (!data) return;
    this.#workouts = data;
    // rendering workouts in the list
    this.#workouts.forEach(work => {
      this._renderWorkout(work);
    });
  }
  // remove from local storage and reload the page
  // in console : app.reset()
  reset() {
    localStorage.removeItem('workouts');
    location.reload();
  }
}
// new instance -house based on blueprint - a new object created based on class App
const app = new App();

//LEAFLET - js library used for interactive map

//if navigator.geolocation exists do all of this: [if (navigator.geolocation)]
//this function takes as the input the callback functions- first one is called on success with a parameter - so whenever the browser successfully got the coordinates of the current position of the user, the second one is the error callback - when we get the error while getting the coordinates
// if (navigator.geolocation)
//   navigator.geolocation.getCurrentPosition(
//     function (position) {
//       // latitude goes first (szerokosc), then longitude (dlugosc geogr)
//       console.log(position);
//       const { latitude } = position.coords;
//       const { longitude } = position.coords;
//       console.log(latitude, longitude);
//       console.log(`https://www.google.com/maps/@${latitude},${longitude}`);

//       const coords = [latitude, longitude];

//CODE TAKEN FROM LEAFLET AND ADAPTED TO OUR APP
//second value represents the level of zoom of the map - 13, ''map'' its an id from html (last line in html file), const map is showing the result of creating the map, and on that map we will add the event listener to add the marker
// map = L.map('map').setView(coords, 13);
//L is a global variable inside the script that comes from leaflet, has a couple methods to use and its connected with the script, and we can access it with other scripts
//the theme of them map comes from that link below but if I google I can edit that theme with a different link, btw ma p is made of tiles
// L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
//   attribution:
//     '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
// }).addTo(map);

///Handling clicks on the map - when we click our form wil show up
//adding our marker -we are adding the event handler here but instead of adding eventlistener form JS we use on() coming from Leaflet library which is created and inherited - a special object with extra methods and properties
//also when the user clicks the form will show us, distance input will be focused and when he clickes enter - it will be submitted
// map.on('click', function (mapE) {
//       we do it like this because we didnt have to have the the access to it as the event
// mapEvent = mapE;
// form.classList.remove('hidden');
// to make input Distance already focued and ready to type
//     inputDistance.focus();
//   });
// },

// second argument - if fails to get the position
//   function () {
//     alert('could not get your position');
//   }
// );

//adding second eventlistener to display marker with the popup when submitted by the user
// form.addEventListener('submit', function (e) {
//   // prevent from reload
//   e.preventDefault();

//   // Clear input fields
//   inputDistance.value = inputDuration.value = inputCadence.value = inputElevation.value =
//     '';

//   // Display marker
//   console.log(mapEvent);
//   const { lat, lng } = mapEvent.latlng;
//   //those properties taken from documentation from Leaflet library
//   // creates the marker
//   L.marker([lat, lng])
//     // adds marker to the map
//     .addTo(map)
//     // poput created and connected with the marker
//     .bindPopup(
//       // a brand new poput which contains a couple of options - taken from documentation :)
//       L.popup({
//         // size
//         maxWidth: 250,
//         minWidth: 100,
//         // dont close when other marker is created
//         autoClose: false,
//         closeOnClick: false,
//         // assigning CSS class to the popus
//         className: 'running-popup',
//       })
//     )
//     // sets the content
//     .setPopupContent('Workout')
//     .openPopup();
// });
// // to unhide cycling, only one of them is visible Cadence or Elevation, but they share the same parent class: form__row so going to toggle this class on those items, using closest method which selects a parent  :) so its hidden for one item and visible for the second :)
// inputType.addEventListener('change', function () {
//   inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
//   inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
// });
