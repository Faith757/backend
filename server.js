require('dotenv').config()

const express = require('express')
const app = express()
const bcrypt = require("bcrypt");
const JWT = require("jsonwebtoken");
const path = require('path')
const connectdb = require('./db')
const User = require("./models/user");
const cors = require('cors');
// const frontendPath = path.join(__dirname, '..', 'frontend')
app.use(express.urlencoded({ extended: true}));
app.use(cors());
app.use(express.json())
// app.use(express.static(frontendPath))
connectdb()

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
      feels_like: data.main.feels_like,
      speed: data.wind.speed,
      pressure: data.main.pressure,
      humidity: data.main.humidity,
      temp_min: data.main.temp_min,
      temp_max: data.main.temp_max,
      visibility: data.visibility
    })
  } catch (error) {
    console.log(error.message)
    return res.status(500).json({ message: `can't fetch weather` })
  }
})
app.post("/user/registration", async (req, res) => {
  const { email, password, confirmPassword } = req.body;
  try {
    if (!email || !password || !confirmPassword) {
      return res.status(400).json({ message: "all fields required!" });
    }
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ message: "email already exist!" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hashedPassword, confirmPassword: hashedPassword });
    await user.save();
    return res.status(201).json({ message: "user created successfully!" });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ message: error.message });
  }
});
app.post("/user/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "email and password are required!" });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "invalid email or password!" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "invalid email or password!" });
    }
    const token = JWT.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    return res.status(200).json({
      message: "login successfully!",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: error.message || "Internal server error" });
  }
});
app.listen(PORT, () => {
  console.log(`server is running on http://localhost:${PORT}`)
})
