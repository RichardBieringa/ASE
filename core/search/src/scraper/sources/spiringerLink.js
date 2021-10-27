
const cheerio = require("cheerio");

const { logger, dateRe, createDate } = require("../utils.js");
const axios = require("../axiosWrapper.js")(true);
const Article = require("../../models/article");

const config = require("./config.js")["springerLink"];

// SOURCE INFO
const SOURCE = "Springer Link";
const HOST = "https://link.springer.com";

// SOURCE SETTINGS
const PAGE_SIZE = config.pageSize;
const TIMEOUT = config.timeout;


/**
 * Queries the digital libary
 * @param {String} searchQuery The query to search the library for
 * @param {Number} startPage Which page to start on
 * @param {Number} pageSize Amount of results to retrieve per page
 * @returns [Articles]
 */
const query = async (searchQuery, startPage = 0, pageSize = PAGE_SIZE) => {
  const articles = [];

  let page = startPage;
  let searchResults = null;

  // Crawl the search result pages until finished
  do {
    // Gets all articles from a single search result page
    // also checks if there is another result page after it
    searchResults = await getSearchResults(searchQuery, page, pageSize);
    const { articleUrls } = searchResults;

    // Request a single result page and parse the article metadata
    // Not parallel to prevent IP blocks
    for (let url of articleUrls) {
      const article = await getArticle(url);
      articles.push(article)

      // synchronous sleep
      await new Promise(resolve => setTimeout(resolve, TIMEOUT));
    }

    page++;
  } while (searchResults && searchResults.hasNext)

  logger.info(`${SOURCE}: Queried ${page} pages, got ${articles.length} articles`);

  return articles;
}

/**
 * Make a GET request for a single search result page
 * @param {String} searchQuery The query to search the library for
 * @param {Number} startPage Which page to start on
 * @param {Number} pageSize Amount of results to retrieve per page
 * @returns Object { articleUrls: [String], hasNext: Boolean}
 */
const getSearchResults = async (searchQuery, page, pageSize) => {
  // The API endpoint for querying papers
  const endpoint = `${HOST}/search`;

  // Build the request
  // https://link.springer.com/search/page/1?query=Kubernetes
  const url = `${endpoint}/page/${page}?query=${encodeURIComponent(searchQuery)}&facet-content-type="ConferencePaper"`

  logger.debug(`GET - ${url}`);
  try {
    const response = await axios.get(url, {
      maxRedirects: 20
    });
    const result = parseResultPage(response.data);
    return result;
  } catch(err) {
    logger.error(`${SOURCE} query error: ${error.message}`)
    return null;
  }
}

/**
 * Parses a single search result page and retrieves the entries
 * also checks if there is another page of results after this
 * @param {String} pageHTML The HTML content of the search page
 * @returns Object { articleUrls: [String], hasNext: Boolean}
 */
const parseResultPage = (pageHTML) => {
  const result = {
    articleUrls: [],
    hasNext: false,
  }

  // Parse the Page HTML
  const $ = cheerio.load(pageHTML);

  // Extracts the urls for each search result
  const searchEntries = $(".content-item-list  > li a.title");
  for (let entry of searchEntries) {
    const path = $(entry).attr("href");
    const url = `${HOST}${path}`
    result.articleUrls.push(url);
  }

  // Check if there is another page of search results after this one
  const next = $(".pagination a.next");
  if (next.length) result.hasNext = true;

  return result;
}

/**
 * Requests a single article page and parses it
 * @param {String} url URL obtained by the search result page
 * @returns Article
 */
const getArticle = async (url) => {
  logger.info(`GET - ${url}`);
  try {
    const response = await axios.get(url);
    const result = parseArticlePage(response.data, url);
    return result;
  } catch(err) {
    logger.error(`${SOURCE}: query error: ${error.message}`)
    return null;
  }
}


/**
 * Parses a single article page and retrieves the metadata
 * @param {String} pageHTML The HTML content of the search page
 * @returns Article
 */
const parseArticlePage = async (pageHTML, url) => {
  // Parse the Page HTML
  const $ = cheerio.load(pageHTML);

  // Web scraping the DOM contents
  const doi = $("meta[name='citation_doi']").attr("content");
  const title = $(".MainTitleSection > h1").text();
  const type = "Conference paper";
  const venue = $(".ConfSeriesName").text();
  const authors = [];
  $(".authors__list ul li .authors__name").each((i, el) => authors.push($(el).text()));
  const abstract = $(".Abstract > p").text();
  
  const dateString = $(".article-dates__first-online > time").attr("datetime");
  const publicationDate = new Date(dateString);

  try {
    // Create Article entry
    const article = new Article({
      source: SOURCE,
      doi,
      url,
      title,
      type,
      venue,
      authors,
      abstract,
      publicationDate: createDate(publicationDate),
    });

    // Save it to DB
    await article.save();
    return article;

  } catch(err) {
    // Skip if duplicate
    if (err.code === 11000) {
      logger.warn(`${SOURCE}: Article with ${doi} already exists, skipping`);
    } else {
      logger.error(`${SOURCE}: Article parsing error: ${err.message}`);
    }

    return null;
  }
}

module.exports = query;