
// ========================================
// GLOBAL WEATHER DASHBOARD
// ========================================

// DEFAULT LOCATION: SEMARANG

let currentLocation = {
    name: "Semarang",
    country: "Indonesia",
    latitude: -6.9667,
    longitude: 110.4167
};

let weatherMap;
let locationMarker;
let radarLayer = null;
let radarEnabled = false;


// ========================================
// WEATHER CODE TRANSLATOR
// ========================================

function getWeatherInfo(code) {

    const weatherCodes = {
        0: ["Cerah", "☀️"],
        1: ["Cerah berawan", "🌤️"],
        2: ["Berawan sebagian", "⛅"],
        3: ["Mendung", "☁️"],
        45: ["Berkabut", "🌫️"],
        48: ["Kabut tebal", "🌫️"],
        51: ["Gerimis ringan", "🌦️"],
        53: ["Gerimis", "🌦️"],
        55: ["Gerimis lebat", "🌧️"],
        56: ["Gerimis beku ringan", "🌧️"],
        57: ["Gerimis beku lebat", "🌧️"],
        61: ["Hujan ringan", "🌧️"],
        63: ["Hujan sedang", "🌧️"],
        65: ["Hujan lebat", "🌧️"],
        66: ["Hujan beku ringan", "🌧️"],
        67: ["Hujan beku lebat", "🌧️"],
        71: ["Salju ringan", "🌨️"],
        73: ["Salju sedang", "🌨️"],
        75: ["Salju lebat", "❄️"],
        77: ["Butiran salju", "❄️"],
        80: ["Hujan lokal ringan", "🌦️"],
        81: ["Hujan lokal sedang", "🌧️"],
        82: ["Hujan lokal lebat", "⛈️"],
        85: ["Salju lokal ringan", "🌨️"],
        86: ["Salju lokal lebat", "❄️"],
        95: ["Badai petir", "⛈️"],
        96: ["Badai petir dan hujan es", "⛈️"],
        99: ["Badai petir dan hujan es lebat", "⛈️"]
    };

    return weatherCodes[code] || ["Tidak diketahui", "🌡️"];
}


// ========================================
// FETCH WEATHER DATA
// ========================================

async function getWeather(lat, lon) {

    const url = new URL(
        "https://api.open-meteo.com/v1/forecast"
    );

    url.search = new URLSearchParams({
        latitude: lat,
        longitude: lon,

        current: [
            "temperature_2m",
            "relative_humidity_2m",
            "apparent_temperature",
            "is_day",
            "precipitation",
            "rain",
            "weather_code",
            "cloud_cover",
            "pressure_msl",
            "wind_speed_10m",
            "wind_direction_10m",
            "wind_gusts_10m"
        ].join(","),

        hourly: [
            "temperature_2m",
            "precipitation_probability",
            "weather_code"
        ].join(","),

        daily: [
            "weather_code",
            "temperature_2m_max",
            "temperature_2m_min",
            "precipitation_probability_max",
            "sunrise",
            "sunset"
        ].join(","),

        forecast_days: 7,
        timezone: "auto"
    });

    try {

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error("Gagal mengambil data cuaca.");
        }

        const data = await response.json();

        displayCurrentWeather(data);
        displayHourlyForecast(data);
        displayDailyForecast(data);

    } catch (error) {

        console.error(error);

        document.getElementById("weatherDescription")
            .textContent = "Gagal memuat data cuaca.";

    }
}


// ========================================
// DISPLAY CURRENT WEATHER
// ========================================

function displayCurrentWeather(data) {

    const weather = data.current;

    const info = getWeatherInfo(weather.weather_code);

    document.getElementById("cityName").textContent =
        currentLocation.name;

    document.getElementById("countryName").textContent =
        currentLocation.country;

    document.getElementById("temperature").textContent =
        Math.round(weather.temperature_2m) + "°";

    document.getElementById("weatherDescription").textContent =
        info[0];

    document.getElementById("weatherIcon").textContent =
        weather.is_day ? info[1] : "🌙";

    document.getElementById("feelsLike").textContent =
        weather.apparent_temperature + "°C";

    document.getElementById("humidity").textContent =
        weather.relative_humidity_2m + "%";

    document.getElementById("windSpeed").textContent =
        weather.wind_speed_10m + " km/h";

    document.getElementById("rainfall").textContent =
        weather.precipitation + " mm";

    document.getElementById("cloudCover").textContent =
        weather.cloud_cover + "%";

    document.getElementById("pressure").textContent =
        weather.pressure_msl + " hPa";

    document.getElementById("windDirection").textContent =
        weather.wind_direction_10m + "°";

    const localTime = new Date(data.current.time);

    document.getElementById("updatedAt").textContent =
        "Waktu lokal: " +
        localTime.toLocaleString("id-ID", {
            dateStyle: "medium",
            timeStyle: "short"
        });
}


// ========================================
// DISPLAY HOURLY FORECAST
// ========================================

function displayHourlyForecast(data) {

    const container =
        document.getElementById("hourlyForecast");

    container.innerHTML = "";

    const hourly = data.hourly;

    const currentHour = new Date(data.current.time)
        .getTime();

    let startIndex = hourly.time.findIndex(time => {
        return new Date(time).getTime() >= currentHour;
    });

    if (startIndex < 0) startIndex = 0;

    for (let i = startIndex;
         i < Math.min(startIndex + 24, hourly.time.length);
         i++) {

        const info = getWeatherInfo(hourly.weather_code[i]);

        const time = new Date(hourly.time[i]);

        const hour = time.toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit"
        });

        const item = document.createElement("div");

        item.className = "hourly-item";

        const timeElement = document.createElement("p");
        timeElement.textContent = hour;

        const iconElement = document.createElement("div");
        iconElement.className = "icon";
        iconElement.textContent = info[1];

        const temperature = document.createElement("h3");
        temperature.textContent =
            Math.round(hourly.temperature_2m[i]) + "°";

        const rain = document.createElement("p");
        rain.textContent =
            "🌧️ " +
            (hourly.precipitation_probability[i] ?? 0) +
            "%";

        item.append(timeElement, iconElement, temperature, rain);

        container.appendChild(item);
    }
}


// ========================================
// DISPLAY DAILY FORECAST
// ========================================

function displayDailyForecast(data) {

    const container =
        document.getElementById("dailyForecast");

    container.innerHTML = "";

    const daily = data.daily;

    for (let i = 0; i < daily.time.length; i++) {

        const info = getWeatherInfo(daily.weather_code[i]);

        const date = new Date(daily.time[i]);

        const day = date.toLocaleDateString("id-ID", {
            weekday: "long",
            day: "numeric",
            month: "short"
        });

        const item = document.createElement("div");

        item.className = "daily-item";

        const dayElement = document.createElement("strong");
        dayElement.textContent = day;

        const icon = document.createElement("span");
        icon.className = "icon";
        icon.textContent = info[1];

        const description = document.createElement("p");
        description.textContent = info[0];

        const temperature = document.createElement("strong");

        temperature.textContent =
            Math.round(daily.temperature_2m_max[i]) +
            "° / " +
            Math.round(daily.temperature_2m_min[i]) +
            "°";

        const rain = document.createElement("p");
        rain.className = "rain-chance";

        rain.textContent =
            "🌧️ " +
            (daily.precipitation_probability_max[i] ?? 0) +
            "%";

        item.append(
            dayElement,
            icon,
            description,
            temperature,
            rain
        );

        container.appendChild(item);
    }
}


// ========================================
// CITY SEARCH - GEOCODING API
// ========================================


 // ========================================
 // LIVE CITY AUTOCOMPLETE
 // ========================================

let searchResults = [];
let activeSuggestion = -1;
let searchTimeout = null;

const cityInput = document.getElementById("cityInput");
const suggestionsBox = document.getElementById("citySuggestions");


// Mencari kota secara otomatis

async function getCitySuggestions(query) {

    if (query.length < 2) {
        closeSuggestions();
        return;
    }

    try {

        const url = new URL(
            "https://geocoding-api.open-meteo.com/v1/search"
        );

        url.search = new URLSearchParams({
            name: query,
            count: 10,
            language: "en",
            format: "json"
        });

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error("Geocoding API error");
        }

        const data = await response.json();

        // Abaikan hasil pencarian lama
        if (cityInput.value.trim() !== query) return;

        searchResults = data.results || [];

        displaySuggestions();

    } catch (error) {

        console.error("Autocomplete error:", error);

        closeSuggestions();

    }
}


// Menampilkan pilihan kota

function displaySuggestions() {

    suggestionsBox.innerHTML = "";
    activeSuggestion = -1;

    if (searchResults.length === 0) {

        suggestionsBox.innerHTML =
            '<div class="suggestions-empty">Kota tidak ditemukan.</div>';

        suggestionsBox.classList.add("show");

        return;
    }

    searchResults.forEach((city, index) => {

        const button = document.createElement("button");

        button.className = "suggestion-item";
        button.type = "button";

        const name = document.createElement("strong");
        name.textContent = city.name;

        const details = document.createElement("small");

        details.textContent = [
            city.admin1,
            city.country
        ].filter(Boolean).join(", ");

        button.append(name, details);

        button.addEventListener("click", () => {
            selectCity(index);
        });

        suggestionsBox.appendChild(button);

    });

    suggestionsBox.classList.add("show");
}


// Memilih kota

async function selectCity(index) {

    const city = searchResults[index];

    if (!city) return;

    currentLocation = {
        name: city.name,
        country: city.country || "Unknown",
        latitude: city.latitude,
        longitude: city.longitude
    };

    cityInput.value = city.name;

    closeSuggestions();

    updateMap(
        city.latitude,
        city.longitude
    );

    await getWeather(
        city.latitude,
        city.longitude
    );

}


// Menutup daftar pilihan

function closeSuggestions() {

    suggestionsBox.classList.remove("show");

    activeSuggestion = -1;

}


// Memperbarui pilihan keyboard

function updateActiveSuggestion() {

    const items = suggestionsBox.querySelectorAll(
        ".suggestion-item"
    );

    items.forEach((item, index) => {

        item.classList.toggle(
            "active",
            index === activeSuggestion
        );

    });

}


// Input event dengan debounce

cityInput.addEventListener("input", function() {

    const query = this.value.trim();

    clearTimeout(searchTimeout);

    if (query.length < 2) {

        closeSuggestions();
        return;

    }

    searchTimeout = setTimeout(() => {

        getCitySuggestions(query);

    }, 300);

});


// Navigasi keyboard

cityInput.addEventListener("keydown", function(event) {

    if (!suggestionsBox.classList.contains("show")) {

        if (event.key === "Enter") {
            event.preventDefault();
            searchCity();
        }

        return;
    }

    if (event.key === "ArrowDown") {

        event.preventDefault();

        activeSuggestion = Math.min(
            activeSuggestion + 1,
            searchResults.length - 1
        );

        updateActiveSuggestion();

    }

    else if (event.key === "ArrowUp") {

        event.preventDefault();

        activeSuggestion = Math.max(
            activeSuggestion - 1,
            0
        );

        updateActiveSuggestion();

    }

    else if (event.key === "Enter") {

        event.preventDefault();

        if (activeSuggestion >= 0) {

            selectCity(activeSuggestion);

        } else if (searchResults.length > 0) {

            selectCity(0);

        } else {

            searchCity();

        }

    }

    else if (event.key === "Escape") {

        closeSuggestions();

    }

});


// Pencarian melalui tombol

async function searchCity() {

    if (searchResults.length > 0) {

        selectCity(
            activeSuggestion >= 0 ? activeSuggestion : 0
        );

        return;
    }

    const query = cityInput.value.trim();

    if (!query) return;

    await getCitySuggestions(query);

    if (searchResults.length > 0) {

        selectCity(0);

    } else {

        alert("Kota tidak ditemukan.");

    }

}


// Menutup dropdown ketika klik di luar

document.addEventListener("click", function(event) {

    if (!event.target.closest(".autocomplete-wrapper")) {

        closeSuggestions();

    }

});


// Tombol pencarian

document.getElementById("searchBtn")
    .addEventListener("click", searchCity);


// ========================================
// INITIALIZE MAP
// ========================================




function initializeMap() {

    // Membuat peta
    weatherMap = L.map("map", {
        minZoom: 3,
        maxZoom: 19,
        maxBounds: [
            [-85, -180],
            [85, 180]
        ],
        maxBoundsViscosity: 1
    }).setView(
        [
            currentLocation.latitude,
            currentLocation.longitude
        ],
        5
    );

    // Peta Esri
    L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
        {
            attribution:
                "Tiles &copy; Esri &mdash; Sources: Esri, HERE, Garmin, OpenStreetMap contributors",

            maxZoom: 19,
            minZoom: 3,

            // Mencegah pengulangan peta
            noWrap: true,

            bounds: [
                [-85, -180],
                [85, 180]
            ]
        }
    ).addTo(weatherMap);

    // Marker lokasi
    locationMarker = L.marker([
        currentLocation.latitude,
        currentLocation.longitude
    ]).addTo(weatherMap);

    locationMarker.bindPopup(
        "<b>Semarang, Indonesia</b>"
    ).openPopup();

    // Klik peta untuk memilih lokasi
    weatherMap.on("click", async function(event) {

        const lat = event.latlng.lat;
        const lon = event.latlng.lng;

        currentLocation = {
            name: "Lokasi pilihan",
            country: lat.toFixed(3) + ", " + lon.toFixed(3),
            latitude: lat,
            longitude: lon
        };

        updateMap(lat, lon);

        await getWeather(lat, lon);
    });

    setTimeout(function() {
        weatherMap.invalidateSize();
    }, 300);
}




// ========================================
// UPDATE MAP LOCATION
// ========================================

function updateMap(lat, lon) {

    weatherMap.flyTo([lat, lon], 7);

    locationMarker.setLatLng([lat, lon]);

    locationMarker.setPopupContent(
        "<b>" +
        currentLocation.name +
        "</b><br>" +
        currentLocation.country
    );

    locationMarker.openPopup();
}


// ========================================
// RAINVIEWER RADAR
// ========================================

async function toggleRadar() {

    const button = document.getElementById("radarBtn");

    if (!radarEnabled) {

        button.textContent = "Memuat radar...";

        try {

            const response = await fetch(
                "https://api.rainviewer.com/public/weather-maps.json"
            );

            if (!response.ok) {
                throw new Error("Radar tidak tersedia.");
            }

            const data = await response.json();

            const frames = data.radar.past;

            if (!frames || frames.length === 0) {
                throw new Error("Tidak ada data radar.");
            }

            // Frame terbaru

            const latestFrame = frames[frames.length - 1];

            const radarURL =
                data.host +
                latestFrame.path +
                "/256/{z}/{x}/{y}/2/1_1.png";

            radarLayer = L.tileLayer(radarURL, {
                opacity: 0.65,
                maxNativeZoom: 7,
                maxZoom: 19,
                attribution: "Radar &copy; RainViewer"
            });

            radarLayer.addTo(weatherMap);

            radarEnabled = true;

            button.textContent = "🌧️ Radar Hujan: ON";
            button.classList.add("active");

        } catch (error) {

            console.error(error);

            button.textContent = "🌧️ Radar Hujan: OFF";

            alert("Radar gagal dimuat. Coba lagi nanti.");

        }

    } else {

        if (radarLayer) {
            weatherMap.removeLayer(radarLayer);
            radarLayer = null;
        }

        radarEnabled = false;

        button.textContent = "🌧️ Radar Hujan: OFF";
        button.classList.remove("active");

    }
}


// ========================================
// EVENT LISTENERS
// ========================================

document.getElementById("searchBtn")
    .addEventListener("click", searchCity);

document.getElementById("cityInput")
    .addEventListener("keydown", function(event) {

        if (event.key === "Enter") {
            searchCity();
        }

    });

document.getElementById("radarBtn")
    .addEventListener("click", toggleRadar);


// ========================================
// START APPLICATION
// ========================================

initializeMap();

getWeather(
    currentLocation.latitude,
    currentLocation.longitude
);

// Refresh weather every 15 minutes

setInterval(() => {

    getWeather(
        currentLocation.latitude,
        currentLocation.longitude
    );

}, 15 * 60 * 1000);
