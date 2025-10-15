// Fetch inputs & submit button
const cityName = document.querySelector("#city-input");
const countryName = document.querySelector("#country-input");
const submitBtn = document.querySelector("#search-btn");
const noLocFound = document.querySelector("#no-loc-found");

// API Result elements
const apiResultDiv = document.querySelector('#api-result-main-div');
const weatherIconResult = document.querySelector('#weather-icon');
const weatherConditionResult = document.querySelector('#weather-condition');
const weatherTempResult = document.querySelector('#weather-temp');
const weatherFeelsLikeResult = document.querySelector('#weather-feels-like');
const weatherDescResult = document.querySelector('#api-result-summary');

const apiKey = import.meta.env.VITE_OPENWEATHER_KEY

submitBtn.addEventListener("click", async function() {
    console.log(cityName.value)
    console.log(countryName.value)

    const url = `https://api.openweathermap.org/geo/1.0/direct?q=${cityName.value},${countryName.value}&limit=5&appid=${apiKey}`;
    let lat = 0
    let long = 0

    try {
        // Make API call to Geocoding API with city and country data and receive lat and longitude data

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Error occurred. Response status: ${response.status}`)
        }
        
        const result = await response.json();

        if (result.length >= 1) {
            noLocFound.style.display = "none";
            apiResultDiv.style.display = "block";
            lat = result[0].lat;
            long = result[0].lon;
            console.log(`Latitude is: ${lat}, longitude is: ${long}`);
            const apiResult = await getWeatherData(lat, long);
            console.log(apiResult)

            setApiResultToView(apiResult)

        } else {
            noLocFound.style.display = "block";
            apiResultDiv.style.display = "none";
            noLocFound.innerHTML='No location found for that query';
            throw new Error('No location found for that query');
        }

    } catch (error) {
        console.log(error);
    }
})


// Make API call to 5 day / 3 hour forecast API with lat and long data and receive weather information
async function getWeatherData(lat, long) {
    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${long}&units=metric&appid=${apiKey}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Error occurred. Response status: ${response.status}`)
        }

        const result = await response.json();
        
        // Today's date
        const todayInMs = Date.now();
        const convToDateObj = new Date(todayInMs) // Tue Oct 14 2025 08:24:35 GMT+0530 (India Standard Time)
        const objToISOString = convToDateObj.toISOString() // 2025-10-14T02:58:18.414Z
        const objToDateString = convToDateObj.toDateString() // Tue Oct 14 2025
        const objToString = convToDateObj.toString() // Tue Oct 14 2025 08:36:57 GMT+0530 (India Standard Time)
        const objToLocaleString = convToDateObj.toLocaleDateString() // 14/10/2025
        const objToFullYear = convToDateObj.getFullYear() // 2025

        const todayDate = convToDateObj.toISOString().split('T')[0]

        // Convert timezone information into YYY-MM-DD format and then compare with today's date in YYY-MM-DD format to get only today's forecasts
        const allForecastToday = result.list.filter(entry => new Date(entry.dt*1000).toISOString().split('T')[0] === todayDate)
        console.log(allForecastToday)

        if (allForecastToday.length === 0) {
        console.log("error: No forecast entries for today in this city's local time.");
        }

        
        // Find average of temp, feels like temp, and figure out icon for it
        const allTemps = allForecastToday.map((entry) => entry.main.temp)
        const avgTemp = allTemps.reduce((total, curr) => total+curr, 0) / allTemps.length
        console.log(avgTemp)

        const allFeelsLikeTemps = allForecastToday.map((entry) => entry.main.feels_like)
        const avgFeelsLike = allFeelsLikeTemps.reduce((total, curr) => total+curr, 0) / allFeelsLikeTemps.length
        console.log(avgFeelsLike)

        // Find most frequent weather condition
        // Creating a map of weather condition, number of occurrences
        const condMap = new Map() // <condition, count>
        const iconMap = new Map() // <iconCode, count>
        const descMap = new Map() // <description, count>

        for (const val of allForecastToday) {
            const currCondition = val.weather[0].main
            const currIcon = val.weather[0].icon
            const currDesc = val.weather[0].description

            condMap.set(currCondition, (condMap.get(currCondition) || 0) + 1) // Easier way:  condMap[currCondition] = (condMap[currCondition] || 0) + 1
            iconMap.set(currIcon, (iconMap.get(currIcon) || 0) + 1)
            descMap.set(currDesc, (descMap.get(currDesc) || 0) + 1)
        
        }

        console.log(condMap)
        console.log(iconMap)
        console.log(descMap)

        // Find condition and icon with max occurrence
        let finalCondKey = null;
        let finalCondCount = -1;
        let finalIconKey = null;
        let finalIconCount = -1;
        let finalDescKey = null;
        let finalDescCount = -1;

        for (const [k, v] of condMap.entries()) {
            if (v > finalCondCount) {finalCondCount = v; finalCondKey = k}
        }

        for (const [k, v] of iconMap.entries()) {
            if (v > finalIconCount) {finalIconCount = v; finalIconKey = k}
        }

        for (const [k, v] of descMap.entries()) {
            if (v > finalDescCount) {finalDescCount = v; finalDescKey = k}
        }

        const iconUrl = `https://openweathermap.org/img/wn/${finalIconKey}@2x.png`

        return {
            "icon": iconUrl,
            "avgTemp": avgTemp,
            "avgFeelsLike": avgFeelsLike,
            "description": finalDescKey,
            "weatherCondition": finalCondKey
        }

    } catch(error) {
        console.log(error);
    }
    
}

function setApiResultToView(apiResult) {
    weatherIconResult.src = apiResult.icon
    weatherConditionResult.innerHTML = apiResult.weatherCondition
    weatherTempResult.innerHTML = `${Math.round(apiResult.avgTemp * 10) / 10}° C`
    weatherFeelsLikeResult.innerHTML = `${Math.round(apiResult.avgFeelsLike * 10) / 10}° C`
    weatherDescResult.innerHTML = `Today you can expect ${apiResult.description}`

    document.querySelector('#api-result-main-div').classList.remove('hide')
}