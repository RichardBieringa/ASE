const cheerio = require("cheerio");
const axios = require("../axiosWrapper.js");

const PAGE_SIZE = 5;
const HOSTNAME = "https://dl.acm.org";

const query = async (searchQuery, pageSize = PAGE_SIZE) => {
  const articles = [];

  let page = 0;
  let searchResults = null;

  do {
    searchResults = await getSearchResults(searchQuery, page, pageSize);
    const { articleUrls } = searchResults;


    console.log("searchResults")
    console.log(searchResults)

    // Creates an array of promises to request the article page HTMl
    const promises = articleUrls.map(url => getArticle(url));
    const articles = await Promise.all(promises);
    console.log(articles)

    articles.push(...articles);
    page++;
  } while (searchResults && searchResults.hasNext)
  console.log(`Queried ${page} pages, got ${articles.length} articles`);

  return articles;
}

// Gets a single page of search results, returns the SERP results
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
    throw err;
  }
}

// Extracts the data from a query page
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

const getArticle = async (url) => {
  console.log(`GET - ${url}`);
  try {
    const response = await axios.get(url);
    const result = parseArticlePage(response.data);
    return result;
  } catch(err) {
    throw err;
  }
}


const parseArticlePage = async (pageHTML, url) => {
  const result = {
    url,
    title: null,
    type: null,
    venue: null,
    authors: [],
    abstract: null,
    publicationDate: null,
    citationCount: null,
  }

  // Parse the Page HTML
  const $ = cheerio.load(pageHTML);

  result.title = $(".citation .issue-heading").text();
  result.type = $(".citation .citation__title").text();
  result.venue = $(".epub-section__title").text();
  $(".citation .loa__author-info .loa__author-name").each((i, el) => result.authors.push($(el).text()));
  result.citationCount = parseInt($(".issue-item__footer .citation .icon-quote + span").text());
  result.abstract = $(".article__body .article__abstract .abstractInFull p").text();
  result.publicationDate = new Date($(".citation .CitationCoverDate").text());


  // Check if all values are populated
  let hasError = false;
  for (let [key, value] of Object.entries(result)) {
    if (value === null || Array.isArray(value) && value.length === 0) {
      console.error(`Article[${key}] not set or empty!`);
      hasError = true;
    }
  }


  // Exit on error
  if (hasError) throw new Error("HTML Parsing Error");

  return result;
}

module.exports = query;