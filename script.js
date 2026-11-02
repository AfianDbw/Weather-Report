
const geoAPI =
    "https://geocoding-api.open-meteo.com/v1/search";

const weatherAPI =
    "https://api.open-meteo.com/v1/forecast";

const statusText = document.getElementById("status");
const searchBtn = document.getElementById("searchBtn");
const cityInput = document.getElementById("cityInput");

// Database kode cuaca WMO
function getWeatherInfo(code) {

    const weatherCodes = {
        0: ["Cerah", "☀️"],
        1: ["Cerah Berawan", "🌤️"],
        2: ["Berawan Sebagian", "⛅"],
        3: ["Mendung", "☁️"],
        45: ["Berkabut", "🌫️"],
        48: ["Kabut Tebal", "🌫️"],
        51: ["Gerimis Ringan", "🌦️"],
        53: ["Gerimis Sedang", "🌦️"],
        55: ["Gerimis Lebat", "🌧️"],
        61: ["Hujan Ringan", "🌧️"],
        63: ["Hujan Sedang", "🌧️"],
        65: ["Hujan Lebat", "🌧️"],
        71: ["Salju Ringan", "🌨️"],
        73: ["Salju Sedang", "🌨️"],
        75: ["Salju Lebat", "❄️"],
        80: ["Hujan Lokal", "🌦️"],
        81: ["Hujan Lokal Sedang", "🌧️"],
        82: ["Hujan Lokal Lebat", "⛈️"],
        85: ["Hujan Salju", "🌨️"],
        86: ["Hujan Salju Lebat", "❄️"],
        95: ["Badai Petir", "⛈️"],
        96: ["Petir dan Hujan Es", "⛈️"],
        99: ["Badai Petir Lebat", "⛈️"]
    };

    return weatherCodes[code] ||
        ["Tidak diketahui", "🌡️"];
}

// Mencari kota
async function searchCity() {

    const city = cityInput.value.trim();

    if (!city) {
        statusText.textContent =
            "Masukkan nama kota terlebih dahulu.";
        return;
    }

    searchBtn.disabled = true;
    statusText.textContent = "Mencari lokasi...";

    document.getElementById("locationResults").innerHTML = "";

    document.getElementById("weatherContent")
        .classList.add("hidden");

    try {

        const url =
            `${geoAPI}?name=${encodeURIComponent(city)}` +
            "&count=8&language=id&format=json";

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error("Gagal menghubungi layanan lokasi.");
        }

        const data = await response.json();

        if (!data.results || data.results.length === 0) {
            throw new Error("Kota tidak ditemukan.");
        }

        showLocationResults(data.results);

        statusText.textContent =
            "Pilih lokasi yang sesuai dengan pencarianmu.";

    } catch (error) {

        statusText.textContent = error.message;

    } finally {

        searchBtn.disabled = false;

    }
}

// Menampilkan pilihan lokasi
function showLocationResults(locations) {

    const resultContainer =
        document.getElementById("locationResults");

    resultContainer.innerHTML = "";

    locations.forEach(place => {

        const button = document.createElement("button");

        button.className = "location-option";

        button.textContent =
            `${place.name}, ${place.admin1 || ""} ` +
            `${place.country || ""}`;

        button.onclick = () => {
            getWeather(place);
        };

        resultContainer.appendChild(button);

    });
}

// Mengambil data cuaca
async function getWeather(place) {

    statusText.textContent = "Mengambil data cuaca...";
    searchBtn.disabled = true;

    try {

        const params = new URLSearchParams({

            latitude: place.latitude,
            longitude: place.longitude,

            current: [
                "temperature_2m",
                "relative_humidity_2m",
                "apparent_temperature",
                "precipitation",
                "weather_code",
                "wind_speed_10m"
            ].join(","),

            daily: [
                "weather_code",
                "temperature_2m_max",
                "temperature_2m_min",
                "precipitation_probability_max",
                "sunrise",
                "sunset"
            ].join(","),

            timezone: "auto",
            forecast_days: 7

        });

        const response = await fetch(
            `${weatherAPI}?${params}`
        );

        if (!response.ok) {
            throw new Error("Gagal mengambil data cuaca.");
        }

        const data = await response.json();

        displayWeather(place, data);

        statusText.textContent =
            "Data cuaca berhasil diperbarui.";

        document.getElementById("locationResults").innerHTML = "";

    } catch (error) {

        statusText.textContent = error.message;

    } finally {

        searchBtn.disabled = false;

    }
}

// Menampilkan data cuaca
function displayWeather(place, data) {

    const current = data.current;
    const daily = data.daily;

    const info = getWeatherInfo(current.weather_code);

    document.getElementById("weatherContent")
        .classList.remove("hidden");

    document.getElementById("location").textContent =
        `${place.name}, ${place.country}`;

    document.getElementById("date").textContent =
        `Waktu lokal: ${current.time.replace("T", " ")}` +
        ` (${data.timezone})`;

    document.getElementById("temperature").textContent =
        `${Math.round(current.temperature_2m)}°C`;

    document.getElementById("description").textContent =
        info[0];

    document.getElementById("weatherIcon").textContent =
        info[1];

    document.getElementById("feels").textContent =
        `Terasa seperti ${Math.round(current.apparent_temperature)}°C`;

    document.getElementById("humidity").textContent =
        `${current.relative_humidity_2m}%`;

    document.getElementById("wind").textContent =
        `${current.wind_speed_10m} km/h`;

    document.getElementById("rain").textContent =
        `${current.precipitation} mm`;

    document.getElementById("rainChance").textContent =
        `${daily.precipitation_probability_max[0] ?? "--"}%`;

    document.getElementById("sunrise").textContent =
        daily.sunrise[0].split("T")[1];

    document.getElementById("sunset").textContent =
        daily.sunset[0].split("T")[1];

    displayForecast(daily);

}

// Menampilkan prakiraan 7 hari
function displayForecast(daily) {

    const forecastContainer =
        document.getElementById("forecast");

    forecastContainer.innerHTML = "";

    daily.time.forEach((date, index) => {

        const info =
            getWeatherInfo(daily.weather_code[index]);

        const day = new Date(date + "T12:00:00")
            .toLocaleDateString("id-ID", {
                weekday: "short",
                day: "numeric"
            });

        const card = document.createElement("div");

        card.className = "forecast-card";

        const dayElement = document.createElement("div");
        dayElement.className = "forecast-day";
        dayElement.textContent = day;

        const iconElement = document.createElement("div");
        iconElement.className = "forecast-icon";
        iconElement.textContent = info[1];
        iconElement.title = info[0];

        const tempElement = document.createElement("div");
        tempElement.className = "forecast-temp";
        tempElement.textContent =
            `${Math.round(daily.temperature_2m_max[index])}° / ` +
            `${Math.round(daily.temperature_2m_min[index])}°`;

        const rainElement = document.createElement("div");
        rainElement.className = "forecast-rain";
        rainElement.textContent =
            `Hujan ${daily.precipitation_probability_max[index] ?? "--"}%`;

        card.append(
            dayElement,
            iconElement,
            tempElement,
            rainElement
        );

        forecastContainer.appendChild(card);

    });

}

// Tombol Enter untuk mencari kota
cityInput.addEventListener("keydown", function(event) {

    if (event.key === "Enter") {
        searchCity();
    }

});

// Memuat cuaca Semarang saat website dibuka
async function initialize() {

    try {

        const response = await fetch(
            `${geoAPI}?name=Semarang&count=1&language=id&format=json`
        );

        if (!response.ok) {
            throw new Error("Gagal memuat lokasi awal.");
        }

        const data = await response.json();

        if (!data.results || data.results.length === 0) {
            throw new Error("Lokasi awal tidak ditemukan.");
        }

        await getWeather(data.results[0]);

    } catch (error) {

        statusText.textContent =
            "Tidak dapat memuat cuaca awal. Coba cari kota secara manual.";

    }

}

// Jalankan website
initialize();
