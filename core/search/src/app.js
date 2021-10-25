const { getPapersBySearchQuery } = require("./scraper");


const main = async () => {
  console.log(`MAIN`)
  const papers = await getPapersBySearchQuery("Kubernetes");
}

main();

module.exports = {};