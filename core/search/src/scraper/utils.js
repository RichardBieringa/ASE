const winston = require("winston");
const Article = require("../models/article");

const logger = winston.createLogger({
  transports: [new winston.transports.Console()],
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.label({
      label: `ASE 🕷`,
    }),
    winston.format.timestamp({
      format: "MMM-DD-YYYY HH:mm:ss",
    }),
    winston.format.printf(
      (info) =>
        `${info.level}: ${info.label}: ${[info.timestamp]}: ${info.message}`
    )
    // winston.format.json(),
  ),
});

// Generic Date Regex
// matches:
// 30 August 2019
// August 2019
// 02 19 1994
// 19-10-1002
// 10/01/2001
const dateRe = /.*((?:\d{0,2}\s|-|\/)?(?:\w+|\d{2})(?:\s|-|\/)[0-9]{4}).*/;

// Check to see if Date object contains a valid date
const isValidDate = (d) => d instanceof Date && !isNaN(d);

const createDate = (dateString) => {
  const d = new Date(dateString);
  return isValidDate(d) ? d : null;
};

const createArticle = async ({
    source,
    added,
    doi,
    title,
    url,
    type,
    venue,
    authors,
    abstract,
    publicationDate,
    citationCount,
}) => {
  // Either returns Date Object or null
  const formattedDate = createDate(publicationDate);

  const article = {
    source,
    added, 
    doi,
    title,
    url,
    type,
    venue,
    authors: authors || [],
    abstract,
    publicationDate: formattedDate,
    citationCount,
  };

  return await insertArticle(article);
}

const insertArticle = async (articleObject) => {
  const { source, url } = articleObject;
  // Verify that it matches the defined DB model
  let article = null;
  try {
    article = new Article(articleObject);
  } catch(err) {
    logger.error(`MODEL ERROR: ${url}`);
    return article;
  }

  // Insert it to mongodb
  try {
    await article.save();
    logger.info(`DB: INSERT ${url}`);
    return article;
  } catch (err) {
    if (err.code === 11000) {
      logger.warn(`DB: ${source}:${url} already exists.`);
    } else {
      logger.warn(`DB ERROR: ${err.message}.`);
    }
    return null;
  }
};

module.exports = {
  dateRe,
  createDate,
  logger,
  createArticle,
  insertArticle,
};
