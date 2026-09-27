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
