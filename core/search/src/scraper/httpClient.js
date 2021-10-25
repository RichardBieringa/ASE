const axios = require("axios");
const { wrapper } = require("axios-cookiejar-support");
const { CookieJar } = require("tough-cookie");

// Exports Axios client with HTTP redirect cookie support which is required for ACM
// Also masks User Agent by pretending to be Chrome on a Mac

axios.defaults.withCredentials = true;
axios.defaults.headers.common = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.81 Safari/537.36",
};

const jar = new CookieJar();
module.exports = wrapper(axios.create({jar}));