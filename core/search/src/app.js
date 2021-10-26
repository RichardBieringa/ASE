const { getPapersBySearchQuery } = require("./scraper");


const main = async () => {
  // Usage check
  if (process.argv.length < 3) {
    console.error("Usage: node app.js <SEARCH QUERY>");
    console.error("exiting...")
    process.exit(1);
  }

  // Set up mongodb connection
  await require("./db.js");

  // Gets the program's arguments and joins them seperated by spaces
  // node app.js test query -> "test query"
  const query = process.argv.slice(2).join(' ');
  const papers = await getPapersBySearchQuery(query);

  return 0;
}

main();

module.exports = {};