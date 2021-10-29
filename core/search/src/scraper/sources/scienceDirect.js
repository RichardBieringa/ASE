const puppeteer = require("puppeteer");

const { logger, dateRe, createArticle } = require("../utils.js");
const Article = require("../../models/article");

const config = require("./config.js")["scienceDirect"];

// SOURCE INFO
const SOURCE = "Science Direct";
const HOST = "https://www.sciencedirect.com";

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

  let pageIndex = startPage;
  let searchResults = null;

  const browser = await puppeteer.launch({
    headless: false,
    args: ["--disable-setuid-sandbox"],
    ignoreHTTPSErrors: true,
  });

  const page = await browser.newPage();

  // Crawl the search result pages until finished
  do {
    // Gets all articles from a single search result page
    // also checks if there is another result page after it
    searchResults = await getSearchResults(page, searchQuery, pageIndex, pageSize);
    const { articleUrls } = searchResults;

    // Request a single result page and parse the article metadata
    // Not parallel to prevent IP blocks
    for (let url of articleUrls) {
      const article = await parseArticlePage(page, url);
      articles.push(article);

      // synchronous sleep
      await new Promise((resolve) => setTimeout(resolve, TIMEOUT));
    }

    pageIndex++;
  } while (searchResults && searchResults.hasNext);

  logger.info(`${SOURCE}: Queried ${pageIndex} pages, got ${articles.length} articles`);

  browser.close();
  return articles;
};

/**
 * Make a GET request for a single search result page
 * @param {Object} page Puppeteer page instance
 * @param {String} searchQuery The query to search the library for
 * @param {Number} startPage Which page to start on
 * @param {Number} pageSize Amount of results to retrieve per page
 * @returns Object { articleUrls: [String], hasNext: Boolean}
 */
const getSearchResults = async (page, searchQuery, pageIndex, pageSize) => {
  const offset = pageIndex * pageSize;

  const url = `${HOST}/search?qs=${searchQuery}&offset=${offset}&sortBy=date`
  logger.info(`PUPETTEER - ${url}`);

  try {
    // window.load
    await page.goto(url, {
      waitUntil: "networkidle2",
    });

    const result = await page.evaluate(() => {
      const result = {
        articleUrls: [],
        hasNext: false,
      };

      const entries = document.querySelectorAll(".result-item-content .result-list-title-link ");
      for (let entry of entries) {
        const path = entry.getAttribute("href");
        const url = `${location.protocol}//${location.hostname}${path}`
        result.articleUrls.push(url)
      }

      result.hasNext = document.querySelectorAll(".pagination-link.next-link").length > 0;
      return result;
    });

    return result;
  } catch (err) {
    logger.error(`${SOURCE}: query error: ${err.message}`)
    return null;
  }
};

/**
 * Parses a single article page and retrieves the metadata
 * @param {String} pageHTML The HTML content of the search page
 * @returns Article
 */
const parseArticlePage = async (page, url) => {
  logger.info(`PUPPETEER - ${url}`);

  // Window.load 
  await page.goto(url, {
    waitUntil: "networkidle2",
  });

  try {
    const result = await page.evaluate(() => {
      const articleData = {
        doi: null,
        url: null,
        title: null,
        type: null,
        venue: null,
        authors: [],
        abstract: null,
        publicationDate: null,
      }

      // Web scraping the DOM contents
      const doi = document.querySelector(".ArticleIdentifierLinks .doi");
      if (doi && doi.innerText) articleData.doi = doi.innerText.trim();

      const title = document.querySelector(".title-text");
      if (title && title.innerText) articleData.title = title.innerText.trim();

      const venue = document.querySelector(".article-dochead > span, .publication-title-link");
      if (venue && venue.innerText) articleData.venue = venue.innerText.trim();

      const authors = document.querySelectorAll(".author-group .author .content");
      for (let author of authors) {
        if (!author.innerText) continue;

        const firstName = author.querySelector(".given-name").innerText.trim();
        const lastName = author.querySelector(".surname").innerText.trim();
        articleData.authors.push(`${firstName} ${lastName}`);
      }

      const abstract = document.querySelector(".abstract.author p");
      if (abstract) articleData.abstract = abstract.innerText.trim();

      // Extracts the submission date
      const dateRe = /.*(\d{0,2}\s\w+\s\d{4}).*/;
      const dateEl = document.querySelector("#banner .wrapper p, .Publication .publication-volume .text-xs");
      if (dateEl && dateEl.innerText && dateRe.test(dateEl.innerText)) {
        const text = dateEl.innerText.trim();
        const matches = text.match(dateRe);
        const dateString = matches.pop().trim();
        articleData.publicationDate = dateString;
      }

      return articleData;
    });

    const { doi, title, type, venue, authors, abstract, publicationDate } = result;

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
  } catch(err) {
    logger.error(`${SOURCE} ERROR - ${err.message}`);
    return null;
  }
};

module.exports = query;
