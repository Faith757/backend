require('dotenv').config()

const express = require('express')
const app = express()
const path = require('path')
const frontendPath = path.join(__dirname, '..', 'frontend')
app.use(express.json())
app.use(express.static(frontendPath))

const API_KEY = process.env.OPEN_WEATHER_API_KEY
if (!API_KEY) {
    console.error('please provide API_KEY')
    process.exit(1)
}
const PORT = process.env.PORT || 5000

app.get('/api/weather', async (req, res) => {
    const city = req.query.city
    if (!city) {
        return res.status(400).json({ message: 'provide a city' })
    }
    try {
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&unit=metric&appid=${API_KEY}`
        const weatherURL = await fetch(url)
        const data = await weatherURL.json();
        console.log(data)

        if (weatherURL.status === 404) {
            return res.status(404).json({ message: `${city} not found` })
        }
        if (weatherURL.status === 400) {
            return res.status(400).json({ message: `provide a city` })
        }
        if (weatherURL.status === 500) {
            return res.status(500).json({ message: `server error` })
        }

        if (!weatherURL.ok) {
            return res.status(weatherURL.status).json({ error: `server is down` })
        }
        res.json({
            city: data.name,
            country: data.sys.country,
            weather: data.weather[0].main,
            weatherIcon: data.weather[0].icon,
            description: data.weather[0].description,
            temp: data.main.temp,
            temp_min: data.main.temp_min,
            temp_max: data.main.temp_max,
            sea_level: data.main.sea_level,
            grnd_level: data.main.grnd_level,
            id: data.weather[0].id,
            speed: data.wind.speed,
            deg: data.wind.deg,
            pressure: data.main.pressure,
            humidity: data.main.humidity,
            sunrise: data.sys.sunrise,
            sunset: data.sys.sunset,
            timezone: data.timezone
        })
    } catch (error) {
        console.log(error.message)
        return res.status(500).json({ message: `can't fetch weather` })
    }
})

app.listen(PORT, () => {
    console.log(`server is running on http://localhost:${PORT}`)
})
