// Perth, WA, Australia
const LAT = -31.9523;
const LON = 115.8613;
const TIMEZONE = "Australia/Perth";

const WEATHER_CODES = {
  0: { desc: "Clear sky", icon: "☀️" },
  1: { desc: "Mainly clear", icon: "🌤️" },
  2: { desc: "Partly cloudy", icon: "⛅" },
  3: { desc: "Overcast", icon: "☁️" },
  45: { desc: "Fog", icon: "🌫️" },
  48: { desc: "Depositing fog", icon: "🌫️" },
  51: { desc: "Light drizzle", icon: "🌦️" },
  53: { desc: "Drizzle", icon: "🌦️" },
  55: { desc: "Dense drizzle", icon: "🌧️" },
  61: { desc: "Light rain", icon: "🌦️" },
  63: { desc: "Rain", icon: "🌧️" },
  65: { desc: "Heavy rain", icon: "🌧️" },
  71: { desc: "Light snow", icon: "🌨️" },
  73: { desc: "Snow", icon: "🌨️" },
  75: { desc: "Heavy snow", icon: "❄️" },
  80: { desc: "Rain showers", icon: "🌦️" },
  81: { desc: "Heavy showers", icon: "🌧️" },
  82: { desc: "Violent showers", icon: "⛈️" },
  95: { desc: "Thunderstorm", icon: "⛈️" },
  96: { desc: "Thunderstorm w/ hail", icon: "⛈️" },
  99: { desc: "Thunderstorm w/ hail", icon: "⛈️" },
};

function weatherInfo(code) {
  return WEATHER_CODES[code] || { desc: "Unknown", icon: "❓" };
}

function buildUrl() {
  const params = new URLSearchParams({
    latitude: LAT,
    longitude: LON,
    timezone: TIMEZONE,
    current_weather: "true",
    daily: [
      "weathercode",
      "temperature_2m_max",
      "temperature_2m_min",
      "precipitation_probability_max",
      "windspeed_10m_max",
      "uv_index_max",
    ].join(","),
    forecast_days: 6,
  });
  return `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
}

// Temperature bands drive both the text list AND the 3D avatar's colours/layers,
// so the two views can never disagree with each other.
const OUTFIT_BANDS = [
  {
    upper: 12,
    items: [
      "🧥 Wool overcoat or heavy jacket",
      "🧶 Knit sweater or jumper",
      "👔 Long-sleeve dress shirt",
      "👖 Wool-blend trousers",
      "🧣 Scarf",
      "👞 Leather dress shoes",
    ],
    visual: { shirtColor: 0xdbe9f4, shirtSleeve: "long", jacket: true, jacketColor: 0x1e3a5f, trouserColor: 0x36454f, shoeColor: 0x1a1a1a, scarf: true },
  },
  {
    upper: 16,
    items: [
      "🧥 Blazer or lightweight jacket",
      "👔 Long-sleeve dress shirt",
      "👖 Trousers or chinos",
      "👞 Leather dress shoes",
    ],
    visual: { shirtColor: 0xdbe9f4, shirtSleeve: "long", jacket: true, jacketColor: 0x3b3b3b, trouserColor: 0x555b66, shoeColor: 0x1a1a1a, scarf: false },
  },
  {
    upper: 21,
    items: [
      "👔 Long-sleeve shirt (sleeves rollable)",
      "🧥 Light cardigan or blazer, optional — pack it, don't wear it in",
      "👖 Chinos or trousers",
      "👞 Loafers or dress shoes",
    ],
    visual: { shirtColor: 0xcfe0f0, shirtSleeve: "long", jacket: false, jacketColor: 0x3b3b3b, trouserColor: 0xb79c73, shoeColor: 0x6b4423, scarf: false },
  },
  {
    upper: 26,
    items: ["👕 Short-sleeve or light long-sleeve shirt", "👖 Chinos", "👞 Loafers"],
    notes: ["Jacket not needed — carry one only if your office runs cold."],
    visual: { shirtColor: 0xf5f0e6, shirtSleeve: "short", jacket: false, jacketColor: 0x3b3b3b, trouserColor: 0xc2a878, shoeColor: 0x8a5a34, scarf: false },
  },
  {
    upper: 32,
    items: ["👕 Breathable short-sleeve shirt (cotton/linen blend)", "👖 Lightweight chinos", "👞 Breathable loafers, no socks needed with the right cut"],
    notes: ["Stick to light colours — they reflect heat and hide sweat better."],
    visual: { shirtColor: 0xf0e6d2, shirtSleeve: "short", jacket: false, jacketColor: 0x3b3b3b, trouserColor: 0xd8c7a1, shoeColor: 0xc9a876, scarf: false },
  },
  {
    upper: Infinity,
    items: ["👕 Lightest breathable short-sleeve shirt you own", "🩳 Linen trousers or tailored shorts if your office allows it"],
    notes: ["Heat is intense — avoid dark colours and synthetic fabrics."],
    visual: { shirtColor: 0xfaf6ee, shirtSleeve: "short", jacket: false, jacketColor: 0x3b3b3b, trouserColor: 0xe6dcc3, shoeColor: 0xd9c9a3, scarf: false },
  },
];

function pickBand(maxTemp) {
  return OUTFIT_BANDS.find((b) => maxTemp < b.upper) || OUTFIT_BANDS[OUTFIT_BANDS.length - 1];
}

// Outfit suggestion for a 30-year-old male office worker (business casual default)
function suggestOutfit({ maxTemp, minTemp, precipProb, windMax, uvMax }) {
  const band = pickBand(maxTemp);
  const items = [...band.items];
  const notes = [...(band.notes || [])];
  const visual = { ...band.visual, sunglasses: false, umbrella: false };

  // Rain
  if (precipProb >= 60) {
    items.push("☔ Umbrella — high chance of rain");
    items.push("🧥 Water-resistant jacket");
    notes.push("Skip suede shoes today; go with leather or synthetic soles.");
    visual.umbrella = true;
  } else if (precipProb >= 30) {
    items.push("☂️ Compact umbrella, just in case");
    visual.umbrella = true;
  }

  // Wind
  if (windMax >= 35) {
    notes.push("Strong winds expected — secure any loose tie or scarf, and a fitted jacket beats a loose one.");
  }

  // UV / sun
  if (uvMax >= 6 && maxTemp >= 18) {
    items.push("🕶️ Sunglasses");
    notes.push("High UV — consider sunscreen on face/neck for the commute.");
    visual.sunglasses = true;
  }

  // Cold morning / warm afternoon spread
  if (maxTemp - minTemp >= 10) {
    notes.push(`Big swing today (${Math.round(minTemp)}°–${Math.round(maxTemp)}°C) — layer up for the morning, shed layers by afternoon.`);
  }

  return { items, notes, visual };
}

function fmtDay(dateStr, index) {
  if (index === 0) return "Today";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-AU", { weekday: "short" });
}

async function loadWeather() {
  const currentCard = document.getElementById("currentCard");
  const outfitCard = document.getElementById("outfitCard");
  const forecastEl = document.getElementById("forecast");
  const dateLine = document.getElementById("dateLine");

  currentCard.innerHTML = `<p class="loading">Fetching current conditions…</p>`;
  outfitCard.innerHTML = "";
  forecastEl.innerHTML = "";

  const now = new Date();
  dateLine.textContent = now.toLocaleDateString("en-AU", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  try {
    const res = await fetch(buildUrl());
    if (!res.ok) throw new Error(`Weather API returned ${res.status}`);
    const data = await res.json();

    const cw = data.current_weather;
    const daily = data.daily;
    const todayInfo = weatherInfo(daily.weathercode[0]);
    const curInfo = weatherInfo(cw.weathercode);

    currentCard.innerHTML = `
      <div class="current-top">
        <div>
          <div class="current-temp">${Math.round(cw.temperature)}°C</div>
          <div class="current-desc">${curInfo.desc}, feels like Perth right now</div>
        </div>
        <div class="current-icon">${curInfo.icon}</div>
      </div>
      <div class="current-stats">
        <div class="stat">
          <span class="label">High / Low</span>
          <span class="value">${Math.round(daily.temperature_2m_max[0])}° / ${Math.round(daily.temperature_2m_min[0])}°</span>
        </div>
        <div class="stat">
          <span class="label">Rain chance</span>
          <span class="value">${daily.precipitation_probability_max[0]}%</span>
        </div>
        <div class="stat">
          <span class="label">Wind</span>
          <span class="value">${Math.round(daily.windspeed_10m_max[0])} km/h</span>
        </div>
      </div>
    `;

    const outfit = suggestOutfit({
      maxTemp: daily.temperature_2m_max[0],
      minTemp: daily.temperature_2m_min[0],
      precipProb: daily.precipitation_probability_max[0],
      windMax: daily.windspeed_10m_max[0],
      uvMax: daily.uv_index_max[0],
      code: daily.weathercode[0],
    });

    outfitCard.innerHTML = `
      <h2>👔 Today's outfit — office look</h2>
      <ul class="outfit-items">
        ${outfit.items.map((item) => `<li>${item}</li>`).join("")}
      </ul>
      ${outfit.notes.length ? `<div class="outfit-notes">${outfit.notes.join(" ")}</div>` : ""}
    `;

    // Hand the same outfit spec to the 3D avatar (avatar.js may still be loading,
    // so stash it on window and also fire an event — whichever arrives first wins).
    window.__lastOutfitSpec = outfit.visual;
    window.dispatchEvent(new CustomEvent("outfit-updated", { detail: outfit.visual }));

    const rowHtml = daily.time
      .map((dateStr, i) => {
        const info = weatherInfo(daily.weathercode[i]);
        return `
          <div class="forecast-day ${i === 0 ? "today" : ""}">
            <div class="day-name">${fmtDay(dateStr, i)}</div>
            <div class="day-icon">${info.icon}</div>
            <div class="day-temps">
              <span class="max">${Math.round(daily.temperature_2m_max[i])}°</span>
              <span class="min">${Math.round(daily.temperature_2m_min[i])}°</span>
            </div>
          </div>
        `;
      })
      .join("");

    forecastEl.innerHTML = `
      <h2>6-Day Outlook</h2>
      <div class="forecast-row">${rowHtml}</div>
    `;
  } catch (err) {
    currentCard.innerHTML = `<p class="error">Couldn't load weather: ${err.message}. Check your connection and hit refresh.</p>`;
  }
}

document.getElementById("refreshBtn").addEventListener("click", loadWeather);
loadWeather();
