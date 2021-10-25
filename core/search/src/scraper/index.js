const { acm } = require("./sources");

const getPapersBySearchQuery = async (searchQuery) => {
  console.log(`getPapersBySearchQuery`);
  const acmPapers = await acm(searchQuery);
}

const getPapersByKeyWords = (keywords = []) => {
  console.log(`QUERY - [${keywords.join(",")}]`)
}

module.exports = {
  getPapersBySearchQuery,
  getPapersByKeyWords,
};