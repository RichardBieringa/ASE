const axios = require("axios");
const axiosRetry = require("axios-retry");

const { wrapper } = require("axios-cookiejar-support");
const { CookieJar } = require("tough-cookie");


// Persistent Cookie Jar (required for ACM)
const jar = new CookieJar();


const client = axios.create({
  jar,
  withCredentials: true,
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.81 Safari/537.36",
  },
});

// Adds request interceptors that perform a retry on failed requests
axiosRetry(client, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
})

module.exports = wrapper(client);
