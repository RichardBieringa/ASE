const axios = require("axios");
const axiosRetry = require("axios-retry");

const { wrapper } = require("axios-cookiejar-support");
const { CookieJar } = require("tough-cookie");

/**
 * Returns a HTTP client to request web pages
 * CookieJar solves issues for ACM, but causes issues on arxiv
 * @param {Boolean} cookieJar Use Tough Cookie Jar
 * @returns AxiosClient
 */
const getAxiosClient = (cookieJar = false) => {
  let client;

  if (cookieJar) {
    // Use Cookie Jar (for redirect cookie support)
    // No retry mechanism
    client = axios.create({
      jar: new CookieJar(),
      withCredentials: true,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.81 Safari/537.36",
      },
    });

    return wrapper(client);
  } else {
    // Regular Axios settings
    // With retry suppose
    client = axios.create({
      jar: new CookieJar(),
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
    return client;
  }
}

module.exports = getAxiosClient;
