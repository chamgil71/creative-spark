import { buildPresentationHtml } from "./scripts/build-presentation.mjs";

const { html } = buildPresentationHtml(["md_src/guides/Cursor.md"]);
// We can parse the slides list if we want, or we can look at what slides were compiled
// Let's modify the buildPresentationHtml to log the slide titles
