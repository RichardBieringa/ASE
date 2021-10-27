const winston = require("winston");

const logger = winston.createLogger({
  transports: [new winston.transports.Console()],
  format: winston.format.combine(
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
}

module.exports = {
  dateRe,
  createDate,
  logger,
};
