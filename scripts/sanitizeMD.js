/**
 * Function to sanitize markdown files for the docusaurus renderer.
 * @param content The content of the markdown file
 * @returns {string} A sanitized version of the content
 */
module.exports = function(content) {
  return content
    // the renderer dislikes if a html tag is not closed somewhere
    .replaceAll("<br>", "<br/>")
    .replaceAll("<hr>", "<hr/>");
}
