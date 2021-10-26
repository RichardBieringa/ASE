const cheerio = require("cheerio");
const axios = require("../axiosWrapper.js");
const Article = require("../../models/article");

// SOURCE SPECIFIC SETTINGS/DEFAULTS
const SOURCE = "ACM";
const PAGE_SIZE = 25;
const TIMEOUT = 1000;
const HOSTNAME = "https://dl.acm.org";


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

  console.log(`Queried ${page} pages, got ${articles.length} articles`);

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
  const endpoint = `${HOSTNAME}/action/doSearch`;

  // Build the request
  const url = `${endpoint}/?AllField=${encodeURIComponent(searchQuery)}&startPage=${page}&pageSize=${pageSize}`

  console.log(`GET - ${url}`);
  try {
    const response = await axios.get(url);
    const result = parseResultPage(response.data);
    return result;
  } catch(err) {
    console.error(err.message);
    console.error("Exiting...");
    process.exit(1);
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
  const searchEntries = $(".search__item .issue-item__title a");
  for (let entry of searchEntries) {
    const path = $(entry).attr("href");
    const url = `${HOSTNAME}${path}`
    result.articleUrls.push(url);
  }

  // Check if there is another page of search results after this one
  const next = $(".pagination__btn--next");
  if (next.length) result.hasNext = true;

  return result;
}

/**
 * Requests a single article page and parses it
 * @param {String} url URL obtained by the search result page
 * @returns Article
 */
const getArticle = async (url) => {
  console.log(`GET - ${url}`);
  try {
    const response = await axios.get(url);
    const result = parseArticlePage(response.data, url);
    return result;
  } catch(err) {
    console.error(err.message);
    console.error("exiting...")
    process.exit(1);
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
  const doi = url.split("/doi/").pop();
  const title = $(".citation .issue-heading").text();
  const type = $(".citation .citation__title").text();
  const venue = $(".citation .epub-section__title").text();
  const authors = [];
  $(".citation .loa__author-info .loa__author-name").each((i, el) => authors.push($(el).text()));
  const abstract = $(".article__body .article__abstract .abstractInFull p").text();
  const publicationDate = new Date($(".citation .CitationCoverDate").text());

  const article = new Article({
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

  try {
    // Save it to DB
    await article.save();
  } catch(err) {
    // Skip if duplicate
    if (err.code === 11000) {
      console.error("Duplicate entry, skipping...")
    } else {
      throw err;
    }
  }

  return article;
}

module.exports = query;