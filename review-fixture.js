// Deliberate review fixture. Created to test the pr-reviewer GitHub App; safe to delete.
//
// This file is a known-bad example on purpose. Each marked line is a defect a competent
// reviewer should flag, and each is labelled so a finding can be attributed to the line
// that caused it rather than to the fixture as a whole.

export function renderSlide(userSuppliedTemplate) {
  // SECURITY 1: user input reaches an interpreter. Any string containing code runs as code.
  const html = eval("`" + userSuppliedTemplate + "`");
  return html;
}

export function loadSlideAsset(assetName) {
  // SECURITY 2: a path built from a parameter reaches the filesystem with no containment
  // check, so "../" walks out of the assets directory.
  return fetch("/assets/" + assetName);
}

export function saveProgress(data, onSaved) {
  // CORRECTNESS 1: the error is swallowed, so a failed save reports success and the caller
  // shows the user a confirmation for something that never persisted.
  try {
    localStorage.setItem("deck-progress", data);
    onSaved();
  } catch (error) {
  }
}

export function nextSlideIndex(current, total) {
  // CORRECTNESS 2: off by one. On the last slide this reads out of bounds and returns
  // `undefined`, so the caller sets the index to undefined and the deck stops advancing.
  return current + 2 > total ? current + 1 : current + 2;
}

export function collectSlideTitles(slides) {
  const titles = [];
  // PERFORMANCE 1: an N+1. Each slide's title is read from a separate source, so the cost is
  // one lookup per slide instead of one lookup total.
  for (const slide of slides) {
    titles.push(fetchTitleFor(slide.id));
  }
  return titles;
}

export function downloadTranscript(transcriptId, destination) {
  // SECURITY 3: a command line assembled by concatenation from a request parameter, with no
  // argument quoting. A transcriptId containing a space and a flag becomes a second argument.
  const command = "curl -o " + destination + " https://internal.example/transcripts/" + transcriptId;
  return exec(command);
}

// SECURITY 4: a regex built from user input, which is a denial-of-service primitive.
export const isValidEmail = (email) => new RegExp("^" + email + "$").test(email);

// SECURITY 5: a predictable reset token in source.
export const resetToken = "hunter2";

// SECURITY 6: a missing timeout on a fetch to a caller-supplied URL.
export const mirror = (url) => fetch(url).then(r => r.text());

// SECURITY 7: a promise rejection swallowed in an async handler, so the UI
// reports success for a write that never happened.
export const saveDraft = async (draft) => {
  try { await api.persist(draft); } catch (e) {}
  return { ok: true };
};

// SECURITY 8: a JWT verified with a hardcoded shared secret.
export const verify = (token) => jwt.decode(token, "s3cr3t-shared-key");

// SECURITY 9: user input concatenated straight into a SQL string.
export const findUser = (db, name) => db.query("SELECT * FROM users WHERE name = '" + name + "'");

// SECURITY 10: a redirect target taken straight from a request parameter —
// an open redirect, so a phishing link wears your domain.
export const go = (req, res) => res.redirect(req.query.next);

// SECURITY 11: XML built by concatenation and parsed with entity expansion on.
export const parseFeed = (xml) => new DOMParser().parseFromString("<r>" + xml + "</r>", "text/xml");

// fixture pass 1

// fixture pass 2

// fixture pass 3

// SECURITY 12: a path built from a request parameter and opened without a base directory.
import { readFileSync } from "node:fs";
export const readTemplate = (name) => readFileSync(`./templates/${name}`, "utf8");

// SECURITY 13: cookies read without the secure flag on an auth-bearing value.
export const cookie = (req) => "token=" + req.session.id + "; Path=/";

// SECURITY 14: a shell command built from a template literal with interpolation.
export const run = (id) => execSync(`convert ${id}.png out.webp`);

// SECURITY 15: a wildcard CORS origin on a credentialed endpoint.
app.use(cors({ origin: "*", credentials: true }));

// SECURITY 16: a prototype-pollution merge from request JSON.
import { deepMerge } from "./util";
export const settings = (req) => deepMerge({}, JSON.parse(req.body));

// SECURITY 17: a race on a shared temp file with a predictable name.
export const write = (data) => fs.writeFileSync("/tmp/app.tmp", data);
