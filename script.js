const cityForm = document.querySelector('#cityForm');
const cityInput = document.querySelector('#cityInput');
const message = document.querySelector('#message');
const card = document.querySelector('#card');
const recent = document.querySelector('#recent');

function cityUrl(city) {
  return `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`;
}

function weatherUrl(lat, lon) {
  return `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,windspeed_10m`;
}



function toText(data) {
  return JSON.stringify(data);
}

function fromText(text) {
  return JSON.parse(text);
}


function pickCity(data) {
  if (!data.results || data.results.length === 0) {
    return null;
  }

  const city = data.results[0];

  return {
    name: city.name,
    country: city.country,
    lat: city.latitude,
    lon: city.longitude
  };
}



function weatherText(code) {
  switch (code) {
    case 0:
      return 'Clear';

    case 1:
    case 2:
    case 3:
      return 'Cloudy';

    case 45:
    case 48:
      return 'Fog';

    case 61:
    case 63:
    case 65:
      return 'Rain';

    case 95:
      return 'Thunderstorm';

    default:
      return 'Unknown';
  }
}


function cardHtml(place) {
  return `
    <h2>${place.name}, ${place.country}</h2>
    <p class="temp">${place.temp}°C</p>
    <p>${place.text}</p>
    <p>Wind Speed: ${place.wind} km/h</p>
  `;
}



function saveRecentCity(city) {
  let cities = fromText(localStorage.getItem('recentCities')) || [];

  cities = cities.filter(function (item) {
    return item.toLowerCase() !== city.toLowerCase();
  });

  cities.unshift(city);

  cities = cities.slice(0, 5);

  localStorage.setItem('recentCities', toText(cities));
}


function showRecentCities() {
  let cities = fromText(localStorage.getItem('recentCities')) || [];

  recent.innerHTML = '';

  cities.forEach(function (city) {
    const li = document.createElement('li');

    li.textContent = city;

    li.addEventListener('click', function () {
      cityInput.value = city;
      searchCity(city);
    });

    recent.appendChild(li);
  });
}


async function searchCity(city) {

  message.textContent = 'Loading...';
  card.innerHTML = '';

  try {

    const r1 = await fetch(cityUrl(city));

    if (!r1.ok) {
      message.textContent = 'Something went wrong';
      return;
    }

    const found = pickCity(await r1.json());

    if (found === null) {
      message.textContent = 'City not found';
      return;
    }


    const r2 = await fetch(
      weatherUrl(found.lat, found.lon)
    );

    if (!r2.ok) {
      message.textContent = 'Something went wrong';
      return;
    }

    const weatherData = await r2.json();

    const place = {
      name: found.name,
      country: found.country,
      temp: weatherData.current.temperature_2m,
      wind: weatherData.current.windspeed_10m,
      text: 'Current Weather'
    };


    card.innerHTML = cardHtml(place);

    message.textContent = '';


    saveRecentCity(found.name);
    showRecentCities();

  } catch (error) {

    message.textContent = 'No internet. Try again.';

  }
}


cityForm.addEventListener('submit', function (event) {

  event.preventDefault();

  const city = cityInput.value.trim();

  if (city === '') {
    message.textContent = 'Enter a city name';
    return;
  }

  searchCity(city);

});

showRecentCities();