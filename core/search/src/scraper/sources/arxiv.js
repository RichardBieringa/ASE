const cheerio = require("cheerio");

const { logger, dateRe, createArticle } = require("../utils.js");
const axios = require("../axiosWrapper.js")(false);

const config = require("./config.js")["arxiv"];

// SOURCE INFO
const SOURCE = "arxiv";
const HOST = "https://arxiv.org";

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
  // https://arxiv.org/search/?query=Kubernetes&searchtype=all&abstracts=hide&order=-announced_date_first&size=50&start=0
  const url = `${endpoint}/?query=${encodeURIComponent(searchQuery)}&size=${pageSize}&start=${page * pageSize}&abstracts=hide&searchtype=all&order=-announced_date_first`

  logger.info(`GET - ${url}`);
  try {
    const response = await axios.get(url);
    const result = parseResultPage(response.data);
    return result;
  } catch(err) {
    logger.error(`${SOURCE}: query error: ${err.message}`)
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
  const searchEntries = $(".arxiv-result .list-title > a");
  for (let entry of searchEntries) {
    const url = $(entry).attr("href");
    result.articleUrls.push(url);
  }

  // Check if there is another page of search results after this one
  const next = $(".pagination .pagination-next:not(.is-invisible)");
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
    logger.error(`${SOURCE}: query error: ${err.message}`)
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

  // Extracts the submission date
  const dateRe = /^\[Submitted on (\d+ \w+ \d{4}).*\]$/;

  // Web scraping the DOM contents
  const doi = $("a[data-doi]").attr("data-doi");
  const title = $(".title").text().split("Title:").pop();
  const type = "article";
  const venue = null;
  const authors = [];
  $(".authors a").each((i, el) => authors.push($(el).text()));
  const abstract = $(".abstract").text().split("Abstract: ").pop();
  
  const dateString = $(".dateline").text().trim();
  const publicationDate = new Date(dateString.match(dateRe).pop());

  // Create Article entry in DB
  const article = await createArticle({
    source: SOURCE,
    doi,
    url,
    title,
    type,
    venue,
    authors,
    abstract,
    publicationDate,
  });

  return article;
}

module.exports = query;