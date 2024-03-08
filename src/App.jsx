import React from "react";
import PropTypes from "prop-types";

function getWeatherIcon(wmoCode) {
  const icons = new Map([
    [[0], "☀️"],
    [[1], "🌤"],
    [[2], "⛅️"],
    [[3], "☁️"],
    [[45, 48], "🌫"],
    [[51, 56, 61, 66, 80], "🌦"],
    [[53, 55, 63, 65, 57, 67, 81, 82], "🌧"],
    [[71, 73, 75, 77, 85, 86], "🌨"],
    [[95], "🌩"],
    [[96, 99], "⛈"],
  ]);
  const arr = [...icons.keys()].find((key) => key.includes(wmoCode));
  if (!arr) return "NOT FOUND";
  return icons.get(arr);
}

function convertToFlag(countryCode) {
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt());
  return String.fromCodePoint(...codePoints);
}

function formatDay(dateStr) {
  return new Intl.DateTimeFormat("en", {
    weekday: "short",
  }).format(new Date(dateStr));
}

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      location: "",
      isLoading: false,
      weather: null,
      displayableLocation: "",
    };
    this.fetchWeather = this.fetchWeather.bind(this);
  }

  async fetchWeather() {
    try {
      if (this.state.location.length < 2) return;
      this.setState({ isLoading: true });
      this.setState({ weather: null });
      // 1) Getting location (geocoding)
      const geoRes = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${this.state.location}`
      );

      const geoData = await geoRes.json();

      if (!geoData.results) throw new Error("Location not found");

      const { latitude, longitude, timezone, name, country_code } =
        geoData.results.at(0);
      this.setState({
        displayableLocation: `${name} ${convertToFlag(country_code)}`,
      });

      // 2) Getting actual weather
      const weatherRes = await fetch(
        `https://api.open-meteo.com/v1/dwd-icon?latitude=${latitude}&longitude=${longitude}&timezone=${timezone}&daily=weather_code,temperature_2m_max,temperature_2m_min,rain_sum,wind_speed_10m_max`
      );
      const weatherData = await weatherRes.json();
      this.setState({ weather: weatherData.daily });
    } catch (err) {
      console.error(err);
    } finally {
      this.setState({ isLoading: false });
    }
  }

  componentDidMount() {
    // this.fetchWeather();
    this.setState({ location: localStorage.getItem("location") || "" });
  }
  componentDidUpdate(prevProps, prevState) {
    if (prevState.location !== this.state.location) {
      this.fetchWeather();
      localStorage.setItem("location", this.state.location);
    }
  }

  render() {
    return (
      <div className="app">
        <h1>Classy weather</h1>
        <div>
          <Input
            location={this.state.location}
            onChange={(e) => this.setState({ location: e.target.value })}
          />
        </div>
        {/* <button onClick={this.fetchWeather}>Get Weather</button> */}
        {this.state.isLoading && <p>Loading...</p>}
        {this.state.weather?.weather_code && (
          <Weather
            weather={this.state.weather}
            location={this.state.displayableLocation}
          />
        )}
      </div>
    );
  }
}

export default App;

class Input extends React.Component {
  constructor(props) {
    super(props);
    this.inputEl = React.createRef();
  }
  static propTypes = {
    location: PropTypes.string,
    onChange: PropTypes.func,
  };

  componentDidUpdate() {
    document.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        if (this.inputEl.current !== document.activeElement) {
          this.inputEl.current.focus();
        }
      }
    });
  }
  render() {
    return (
      <input
        ref={this.inputEl}
        type="text"
        placeholder="Search for location"
        value={this.props.location}
        onChange={this.props.onChange}
      />
    );
  }
}

class Weather extends React.Component {
  //   componentWillUnmount() {
  //     console.log("Weather component unmounted");
  //   }

  static propTypes = {
    weather: PropTypes.shape({
      rain_sum: PropTypes.arrayOf(PropTypes.number),
      temperature_2m_max: PropTypes.arrayOf(PropTypes.number),
      temperature_2m_min: PropTypes.arrayOf(PropTypes.number),
      time: PropTypes.array,
      weather_code: PropTypes.array,
      wind_speed_10m_max: PropTypes.arrayOf(PropTypes.number),
    }),
    location: PropTypes.string,
  };

  render() {
    const {
      rain_sum: rain,
      temperature_2m_max: maxTemp,
      temperature_2m_min: minTemp,
      time: dates,
      weather_code: codes,
      wind_speed_10m_max: windSpeed,
    } = this.props.weather;
    return (
      <div>
        <h2>{this.props.location}</h2>
        <ul className="weather">
          {dates.map((date, i) => (
            <Day
              key={date}
              date={date}
              rain={rain[i]}
              maxTemp={maxTemp[i]}
              minTemp={minTemp[i]}
              weatherCode={codes[i]}
              windSpeed={windSpeed[i]}
              isToday={i === 0}
            />
          ))}
        </ul>
      </div>
    );
  }
}

class Day extends React.Component {
  static propTypes = {
    date: PropTypes.string,
    rain: PropTypes.number,
    maxTemp: PropTypes.number,
    minTemp: PropTypes.number,
    weatherCode: PropTypes.number,
    windSpeed: PropTypes.number,
    isToday: PropTypes.bool,
  };
  render() {
    const {
      date,
      rain,
      maxTemp,
      minTemp,
      weatherCode: code,
      isToday,
      windSpeed,
    } = this.props;
    return (
      <li className="day">
        <span>{getWeatherIcon(code)} </span>
        <p>{isToday ? "Today" : formatDay(date)} </p>
        <p>
          {Math.floor(minTemp)}°C &mdash;
          <strong> {Math.ceil(maxTemp)}°C</strong>
        </p>
        <p>🌢 {rain} mm </p>
        <p>
          <img
            src="https://cdnstatic.ventusky.com/images/icons/white-wind.svg"
            width="25px"
            height="25px"
            alt="Wind speed icon"
          />
          {windSpeed} km/h
        </p>
      </li>
    );
  }
}
