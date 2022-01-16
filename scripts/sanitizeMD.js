module.exports = function(content) {
  return content
    .replaceAll("<br>", "<br/>")
    .replaceAll("<hr>", "<hr/>");
}
