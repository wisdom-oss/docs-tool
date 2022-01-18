/**
 * Function to sanitize file names for the docusaurus finder.
 * @param fileName The file name to sanitize
 * @returns {string} A sanitized version of the file name
 */
module.exports = function(fileName) {
  let split = fileName.split("/");
  split[split.length - 1] = split[split.length - 1]
    .replace(/^_*([^_].+)$/, "$1")
    .replace(/^(.+[^_])_*$/, "$1")
    .replace(/^(.+[^_])_*(\.\w+)$/, "$1$2");
  return split.join("/");
}
