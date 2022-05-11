import * as ds from "../../core/render/html/mod.ts";

export function htmlSyntaxHighlightContribs(
  contribs: ds.HtmlLayoutContributions,
  highlighter: "highlight.js",
): boolean {
  switch (highlighter) {
    case "highlight.js":
      contribs.stylesheets.aft
        `<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.2.0/styles/default.min.css">`;
      contribs.scripts.aft
        `<script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.2.0/highlight.min.js"></script>`;
      contribs.body.aft`<script>hljs.highlightAll();</script>`;
      return true;

    default:
      return false;
  }
}
