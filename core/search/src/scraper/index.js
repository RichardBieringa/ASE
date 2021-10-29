const query = require("./sources");
const { logger } = require("./utils.js");

const SOURCES = ["ACM", "arxiv", "IEEE", "ScienceDirect", "SpringerLink"];

const getPapersBySearchQuery = async (searchQuery, sources = SOURCES) => {
  const promises = [];
  for (let source of sources) {
    promises.push(query(source, searchQuery));
  }

  const articles = await Promise.all(promises);
  logger.info(`RESULTS:`)
  for (let i = 0; i < sources.length; i++) {
    const source = sources[i];
    const articlesForSource = articles[i];
    logger.info(`${source}: ${articlesForSource.length} articles`);
  }

  return articles;
};

const getPapersByKeyWords = (keywords = []) => {
  console.log(`QUERY - [${keywords.join(",")}]`);
};

module.exports = {
  getPapersBySearchQuery,
  getPapersByKeyWords,
};
