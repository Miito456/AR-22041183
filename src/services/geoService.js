const axios = require("axios");

async function getGeoData(ip) {
  try {

    const response = await axios.get(
      `http://ip-api.com/json/${ip}?fields=status,message,country,city,lat,lon,isp,org,as,asname,reverse,query`
    );

    if (response.data.status !== "success") {
      return null;
    }

    return {
      ip: response.data.query,
      country: response.data.country,
      city: response.data.city,
      lat: response.data.lat,
      lon: response.data.lon,
      isp: response.data.isp,
      org: response.data.org,
      as: response.data.as,
      asname: response.data.asname,
      reverse: response.data.reverse
    };

  } catch (error) {
    console.error("GeoService error:", error.message);
    return null;
  }
}

module.exports = { getGeoData };