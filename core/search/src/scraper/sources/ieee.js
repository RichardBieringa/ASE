const { logger, dateRe, createDate } = require("../utils.js");
const axios = require("../axiosWrapper.js")(true);
const Article = require("../../models/article");

const config = require("./config.js")["ieee"];

// SOURCE INFO
const SOURCE = "IEEE";
const HOST = "https://ieeexplore.ieee.org";

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
    page++;
  } while (searchResults && searchResults.hasNext);

  logger.info(`${SOURCE}: Queried ${page} pages, got ${articles.length} articles`);

  return articles;
};

/**
 * Make a GET request for a single search result page
 * @param {String} searchQuery The query to search the library for
 * @param {Number} startPage Which page to start on
 * @param {Number} pageSize Amount of results to retrieve per page
 * @returns Object { articleUrls: [String], hasNext: Boolean}
 */
const getSearchResults = async (searchQuery, page, pageSize) => {
  // The API endpoint for querying papers
  const endpoint = `${HOST}/rest/search`;

  // Build the request
  const data = {
    highlight: true,
    matchPubs: true,
    queryText: searchQuery,
    returnFacets: ["ALL"],
    pageNumber: page,
    newSearch: page === 0,
    refinements: ["ContentType:Conferences","ContentType:Journals"],
    returnType: "SEARCH",
  };

  try {
    logger.debug(`POST - ${endpoint} | page: ${page}`);
    // Makes a request to the public IEEE API (not the one where you need an API key for)
    // These headers are required, otherwise they are mad
    const response = await axios.post(endpoint, JSON.stringify(data), {
      headers: {
        "accept": "application/json, text/plain, */*",
        "content-type": "application/json",
        "Referer": `https://ieeexplore.ieee.org/search/searchresult.jsp?queryText=${searchQuery}`,
      }
    });

    const { records, totalRecords, endRecord } = response.data

    const articles = records.map((record) => parseArticle(record));

    const result = {
      articles,
      hasNext: endRecord < totalRecords,
    }

    return result;
  } catch (err) {
    logger.error(`${SOURCE}: query error: ${error.message}`)
    return null;
  }
};

/**
 * Parse and insert article into the database
 * @param {Object} articleRecord a record returned by the IEEE api
 */
const parseArticle = async (articleRecord) => {
  const { authors, doi, documentLink, publicationTitle, publicationDate, abstract, displayContentType, citationCount } = articleRecord 

  const title = publicationTitle;
  const url = `${SOURCE}/${documentLink}`;
  const type = displayContentType;
  const venue = null;
  const formattedAuthors = authors.map(a => a.normalizedName);


  try {
    // Create Article entry
    const article = new Article({
      source: SOURCE,
      doi,
      url,
      title,
      type,
      venue,
      authors: formattedAuthors,
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
