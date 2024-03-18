const apiKey = '2c5ae2ebc8e0472a4476fb4f9220b1cb';
const BaseUrl = 'https://api.openweathermap.org/data/2.5';
const weatherEndpoint = 'weather';
const forecastEndpoint = 'forecast';

async function fetchWeather(city) {
    try {
        const [currentWeatherResponse, forecastResponse] = await Promise.all([
            fetch(`${BaseUrl}/${weatherEndpoint}?q=${city}&units=metric&appid=${apiKey}`),
            fetch(`${BaseUrl}/${forecastEndpoint}?q=${city}&units=metric&appid=${apiKey}`)
        ]);

        if (!currentWeatherResponse.ok || currentWeatherResponse.status === 404) {
            throw new Error(`City not found: ${city}`);
        }

        if (!forecastResponse.ok) {
            throw new Error('Failed to fetch weather forecast data');
        }

        const data = await currentWeatherResponse.json();
        const forecastData = await forecastResponse.json();

        updateWeather(data);
        displayWeatherForecast(forecastData);
    } catch (error) {
        console.log(error)
        errorElement.textContent = error.message;
    }
}

async function fetchCityNames() {
    try {
        const response = await fetch('city.list.json');
        const cities = await response.json();
        const cityNames = cities.map(city => city.name);
        console.log(cityNames); 
        return cityNames;
    } catch (error) {
        console.log('Error fetching city names:', error);
        return [];
    }
}
const cityElement = document.querySelector(".city");
const dateElement = document.querySelector(".date");
const temperature = document.querySelector(".temp");
const windSpeed = document.querySelector(".wind-speed");
const humidity = document.querySelector(".humidity");
const visibility = document.querySelector(".visibility-distance");

const descriptionText = document.querySelector(".description-text");
const descriptionIcon = document.querySelector(".description i");
const errorElement = document.querySelector(".error-message");
const forecastCity = document.querySelector(".f-City");

const formElement = document.querySelector(".search-form");
const inputElement = document.querySelector(".city-input");
const forecastDiv = document.querySelector(".f5");
const suggestionsList = document.querySelector(".suggestions-list");

function updateWeather(data) {
    cityElement.textContent = data.name;
    forecastCity.textContent = data.name;
    dateElement.textContent = new Date().toDateString();
    temperature.textContent = `${Math.round(data.main.temp)}`;
    windSpeed.textContent = `${data.wind.speed} km/h`;
    humidity.textContent = `${data.main.humidity}%`;
    visibility.textContent = `${data.visibility / 1000} km`;
    descriptionText.textContent = data.weather[0].description;

    const weatherIconName = getWeatherIconName(data.weather[0].main);
    descriptionIcon.innerHTML = `<i class="material-icons">${weatherIconName}</i>`;
}

function displayWeatherForecast(forecastData) {
    const tableBody = document.querySelector('tbody');
    tableBody.innerHTML = '';
    const dailyTemps = {};
    for (const forecast of forecastData.list) {
        const date = new Date(forecast.dt * 1000);
        const dateString = date.toDateString();
        const maxTemp = forecast.main.temp_max;
        const minTemp = forecast.main.temp_min;
        const weatherCondition = forecast.weather[0].main;

        if (!dailyTemps[dateString]) {
            dailyTemps[dateString] = {
                max: maxTemp,
                min: minTemp,
                condition: weatherCondition
            };
        } else {
            dailyTemps[dateString].max = Math.max(dailyTemps[dateString].max, maxTemp);
            dailyTemps[dateString].min = Math.min(dailyTemps[dateString].min, minTemp);
        }
    }

    for (const dateString in dailyTemps) {
        const maxTemp = dailyTemps[dateString].max;
        const minTemp = dailyTemps[dateString].min;
        const weatherCondition = dailyTemps[dateString].condition;
        const weatherSymbol = getWeatherSymbol(weatherCondition);

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${dateString}</td>
            <td>${weatherSymbol}</td>
            <td>${maxTemp}&deg;C</td>
            <td>${minTemp}&deg;C</td>
        `;

        tableBody.appendChild(row);
    }
}

function getWeatherSymbol(weatherCondition) {
    const symbolMap = {
        Clear: "☀️",
        Clouds: "☁️",
        Rain: "🌧️",
        Thunderstorm: "⛈️",
        Drizzle: "🌦️",
        Snow: "❄️",
        Mist: "🌫️",
        Smoke: "🌫️",
        Haze: "🌫️",
        Fog: "🌫️",
    };

    return symbolMap[weatherCondition] || "❓";
}

function getWeatherIconName(weatherCondition) {
    const iconMap = {
        Clear: "wb_sunny",
        Clouds: "wb_cloudy",
        Rain: "umbrella",
        Thunderstorm: "flash_on",
        Drizzle: "grain",
        Snow: "ac_unit",
        Mist: "cloud",
        Smoke: "cloud",
        Haze: "cloud",
        Fog: "cloud",
    };

    return iconMap[weatherCondition] || "help";
}

formElement.addEventListener("submit", function (e) {
    e.preventDefault();
    const city = inputElement.value;
    if (city !== "") {
        errorElement.textContent = "";
        fetchWeather(city); 
        inputElement.value = "";
        forecastDiv.style.display = "block";
        clearSuggestions();
    }
});

inputElement.addEventListener('input', async function(event) {
    const userInput = event.target.value.trim().toLowerCase();
    const cityNames = await fetchCityNames();

    if (userInput) {
        const suggestions = cityNames.filter(city => city.toLowerCase().startsWith(userInput));
        displaySuggestions(suggestions);
    } else {
        clearSuggestions();
    }
});

function displaySuggestions(suggestions) {
    suggestionsList.innerHTML = ''; 
    const limitedSuggestions = suggestions.slice(0, 17); 
    limitedSuggestions.forEach(suggestion => {
        const li = document.createElement('li');
        li.textContent = suggestion;
        li.addEventListener('click', async function() {
            inputElement.value = suggestion;
           await fetchWeather(suggestion);
           forecastDiv.style.display = "block";
            clearSuggestions();
        });
        suggestionsList.appendChild(li);
    });
    if (limitedSuggestions.length > 0) {
        suggestionsList.style.display = 'block';
    } else {
        suggestionsList.style.display = 'none'; 
    }
}
function clearSuggestions() {
    suggestionsList.innerHTML = '';
    suggestionsList.style.display = 'none';
}
