(() => {
  if (window.__deckMeet) return;
  window.__deckMeet = "dm-runtime-v2";

  const stage = document.querySelector(".stage");
  const slides = [...stage.querySelectorAll(".slide")];
  const bar = document.querySelector(".progress span");
  const counter = document.querySelector(".counter");
  const hint = document.querySelector(".hint");
  const toolbar = document.querySelector(".toolbar");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isPresenter = new URLSearchParams(location.search).has("presenter");
  const story = document.body.dataset.mode === "story" && !isPresenter;
  const outQuart = "cubic-bezier(0.25, 1, 0.5, 1)";
  const bc = "BroadcastChannel" in window ? new BroadcastChannel("dm-" + document.title) : null;
  let index = 0;
  let editing = false;
  let pvWin = null;

  const send = (msg) => {
    bc?.postMessage(msg);
    if (isPresenter) window.opener?.postMessage(msg, "*");
    else if (pvWin && !pvWin.closed) pvWin.postMessage(msg, "*");
  };

  const titleOf = (slide) =>
    slide?.querySelector("h1, h2, h3")?.textContent.trim() ||
    slide?.getAttribute("aria-label") ||
    "";

  const notesOf = (slide) =>
    slide?.querySelector("aside.notes")?.textContent.trim() ||
    "No notes for this slide.";

  const helpRoot = () => document.querySelector(".kb");

  const closeHelp = () => helpRoot()?.remove();

  const helpRows = [
    ["Right, Down, Space, PageDown", "next"],
    ["Left, Up, Backspace, PageUp", "previous"],
    ["Home", "first slide"],
    ["End", "last slide"],
    ["E", "edit"],
    ["O", "grid"],
    ["N", "presenter window"],
    ["F", "fullscreen"],
    ["Esc", "close this list, close grid, leave edit, or close presenter"],
    ["Q", "close presenter"],
    ["?", "show or hide this list"],
  ];

  const helpLine = (key, action) => {
    const row = document.createElement("button");
    row.type = "button";
    row.className = "kb-row";
    row.tabIndex = -1;
    const keyEl = document.createElement("span");
    keyEl.className = "kb-k";
    keyEl.textContent = key;
    const actionEl = document.createElement("span");
    actionEl.className = "kb-a";
    actionEl.textContent = action;
    row.append(keyEl, actionEl);
    row.addEventListener("click", closeHelp);
    return row;
  };

  const openHelp = () => {
    if (helpRoot()) return;
    const box = document.createElement("div");
    box.className = "kb";
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-label", "Keyboard shortcuts");
    const title = document.createElement("p");
    title.className = "kb-title";
    title.textContent = "Keyboard";
    const close = document.createElement("button");
    close.type = "button";
    close.className = "kb-close";
    close.textContent = "close";
    close.addEventListener("click", closeHelp);
    box.append(title, ...helpRows.map(([key, action]) => helpLine(key, action)), close);
    document.body.appendChild(box);
  };

  const toggleHelp = () => (helpRoot() ? closeHelp() : openHelp());

  const helpKey = (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return false;
    if (e.key === "?") {
      e.preventDefault();
      toggleHelp();
      return true;
    }
    if (e.key === "Escape" && helpRoot()) {
      closeHelp();
      return true;
    }
    return false;
  };

  if (isPresenter) {
    document.body.classList.add("presenter");
    const pv = document.createElement("div");
    pv.className = "pv";
    pv.innerHTML =
      '<div class="pv-top"><span class="pv-counter"></span><span class="pv-clock" title="click to reset">00:00</span>' +
      '<button class="pv-close">close</button></div>' +
      '<div class="pv-title"></div><div class="pv-notes"></div>' +
      '<div class="pv-next"><span>next</span><span class="pv-next-title"></span></div>' +
      '<div class="pv-hint">arrows here drive the deck, Esc closes</div>';
    document.body.appendChild(pv);
    const closePresenter = () => {
      window.close();
      setTimeout(() => {
        const u = new URL(location.href);
        u.searchParams.delete("presenter");
        location.replace(u);
      }, 150);
    };
    pv.querySelector(".pv-close").addEventListener("click", closePresenter);
    const els = {
      counter: pv.querySelector(".pv-counter"),
      clock: pv.querySelector(".pv-clock"),
      title: pv.querySelector(".pv-title"),
      notes: pv.querySelector(".pv-notes"),
      next: pv.querySelector(".pv-next-title"),
    };
    let t0 = Date.now();
    els.clock.addEventListener("click", () => (t0 = Date.now()));
    setInterval(() => {
      const s = Math.floor((Date.now() - t0) / 1000);
      els.clock.textContent =
        String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0");
    }, 1000);
    const render = (i) => {
      els.counter.textContent = `${i + 1} / ${slides.length}`;
      els.title.textContent = titleOf(slides[i]);
      els.notes.textContent = notesOf(slides[i]);
      els.next.textContent = i + 1 < slides.length ? titleOf(slides[i + 1]) : "end of deck";
    };
    const onMsg = (m) => {
      if (m && m.type === "dm-state") render(m.i);
    };
    bc && (bc.onmessage = (e) => onMsg(e.data));
    addEventListener("message", (e) => onMsg(e.data));
    addEventListener("keydown", (e) => {
      if (helpKey(e)) return;
      const k = e.key;
      if (["ArrowRight", "ArrowDown", " ", "PageDown"].includes(k)) {
        e.preventDefault();
        send({ type: "dm-cmd", cmd: "next" });
      } else if (["ArrowLeft", "ArrowUp", "Backspace", "PageUp"].includes(k)) {
        e.preventDefault();
        send({ type: "dm-cmd", cmd: "prev" });
      } else if (k === "Escape" || k === "q" || k === "Q") {
        closePresenter();
      }
    });
    render(0);
    send({ type: "dm-hello" });
    return;
  }

  const fit = () => {
    const scale = Math.min(innerWidth / 1300, innerHeight / 740);
    document.documentElement.style.setProperty("--dm-scale", scale);
  };

  const stepsOf = (slide) =>
    [...slide.querySelectorAll("[data-step]")].sort(
      (a, b) => Number(a.dataset.step) - Number(b.dataset.step)
    );

  const stepGroups = (slide) => {
    const groups = new Map();
    stepsOf(slide).forEach((el) => {
      const v = el.dataset.step;
      if (!groups.has(v)) groups.set(v, []);
      groups.get(v).push(el);
    });
    return [...groups.values()];
  };

  const stagger = () => {
    slides.forEach((slide) => {
      [...slide.children].forEach((el, i) => el.style.setProperty("--i", i));
    });
  };

  const clearAnim = (el) => {
    el.getAnimations().forEach((a) => a.cancel());
    [
      "opacity",
      "transform",
      "transition",
      "transform-box",
      "transform-origin",
      "stroke-dasharray",
      "stroke-dashoffset",
    ].forEach((p) => el.style.removeProperty(p));
  };

  const motion = (el, keyframes, duration, delay = 0) =>
    el.animate(keyframes, { duration, delay, easing: outQuart, fill: "backwards" });

  const draw = (el, duration, delay = 0) => {
    const length = Number(el.getAttribute("pathLength")) || el.getTotalLength();
    el.style.strokeDasharray = length;
    motion(el, [{ strokeDashoffset: length }, { strokeDashoffset: 0 }], duration, delay)
      .finished.then(() => el.style.removeProperty("stroke-dasharray"), () => {});
  };

  const drawable = (el) =>
    el.ownerSVGElement && el.matches("path, line, polyline") && el.classList.contains("draw");

  const showStep = (el) => {
    if (el.classList.contains("shown")) return;
    el.classList.add("shown");
    if (reduced || editing) return;
    el.style.transition = "none";
    if (drawable(el)) {
      el.style.opacity = "1";
      el.style.transform = "none";
      draw(el, 700);
    } else if (el.ownerSVGElement) {
      el.style.transformBox = "fill-box";
      el.style.transformOrigin = "center";
      motion(el, [{ opacity: 0, transform: "scale(0.86)" }, { opacity: 1, transform: "none" }], 450);
    } else {
      motion(el, [{ opacity: 0, transform: "translateY(14px)" }, { opacity: 1, transform: "none" }], 450);
    }
  };

  const hideStep = (el) => {
    if (!el.classList.contains("shown")) return;
    el.classList.remove("shown");
    clearAnim(el);
  };

  const chartTargets = (slide) => ({
    grows: [...slide.querySelectorAll(".grow:not([data-step])")],
    pts: [...slide.querySelectorAll(".pt:not([data-step])")],
    traces: [...slide.querySelectorAll(".trace:not([data-step])")],
  });

  const settleCharts = (root) => {
    (root || document)
      .querySelectorAll(".grow, .pt, .trace")
      .forEach((el) => clearAnim(el));
  };

  const animateCharts = (slide) => {
    const { grows, pts, traces } = chartTargets(slide);
    if (reduced || editing) {
      settleCharts(slide);
      return;
    }
    grows.forEach((el) => {
      el.style.transformBox = "fill-box";
      el.style.transformOrigin = el.dataset.origin || "left center";
    });
    grows.forEach((el, i) =>
      motion(el, [{ transform: "scaleX(0)" }, { transform: "none" }], 800, i * 90),
    );
    pts.forEach((el) => {
      el.style.transformBox = "fill-box";
      el.style.transformOrigin = "center";
    });
    pts.forEach((el, i) =>
      motion(el, [{ opacity: 0, transform: "scale(0.5)" }, { opacity: 1, transform: "none" }], 340, i * 26),
    );
    traces.forEach((el, i) => {
      draw(el, 1000, i * 140);
    });
  };

  const finalText = (el) =>
    Number(el.dataset.to).toFixed(Number(el.dataset.decimals || 0)) +
    (el.dataset.suffix || "");

  const settleCounters = () => {
    document
      .querySelectorAll(".num[data-to], .bignum[data-to]")
      .forEach((el) => (el.textContent = finalText(el)));
  };

  const countUp = (slide) => {
    slide.querySelectorAll(".num[data-to], .bignum[data-to]").forEach((el) => {
      if (reduced || editing) {
        el.textContent = finalText(el);
        return;
      }
      const to = Number(el.dataset.to);
      const decimals = Number(el.dataset.decimals || 0);
      const suffix = el.dataset.suffix || "";
      const t0 = performance.now();
      const tick = (t) => {
        const p = Math.min(Math.max((t - t0) / 900, 0), 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = (to * eased).toFixed(decimals) + suffix;
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  };

  const activate = (slide) => {
    countUp(slide);
    animateCharts(slide);
  };

  const setEditing = (on) => {
    editing = on;
    document.body.classList.toggle("editing", on);
    slides.forEach((slide) => {
      if (on) slide.setAttribute("contenteditable", "true");
      else slide.removeAttribute("contenteditable");
    });
    if (on) {
      closeGrid();
      slides.forEach((slide) => stepsOf(slide).forEach((el) => showStep(el)));
      settleCounters();
      settleCharts();
    }
    toolbar.querySelector('[data-act="edit"]').classList.toggle("on", on);
  };

  const gridEl = () => document.querySelector(".grid");

  const closeGrid = () => gridEl()?.remove();

  const openGrid = () => {
    if (gridEl() || story) return;
    setEditing(false);
    const grid = document.createElement("div");
    grid.className = "grid";
    slides.forEach((slide, i) => {
      const thumb = document.createElement("div");
      thumb.className = "thumb" + (i === index ? " here" : "");
      const clone = slide.cloneNode(true);
      clone.classList.remove("active", "before");
      clone.removeAttribute("contenteditable");
      thumb.appendChild(clone);
      const tag = document.createElement("span");
      tag.className = "thumb-n";
      tag.textContent = i + 1;
      thumb.appendChild(tag);
      thumb.addEventListener("click", () => {
        closeGrid();
        jump(i);
      });
      grid.appendChild(thumb);
    });
    document.body.appendChild(grid);
  };

  const toggleGrid = () => (gridEl() ? closeGrid() : openGrid());

  const openPresenter = () => {
    if (story) return;
    const u = new URL(location.href);
    u.searchParams.set("presenter", "1");
    u.hash = "";
    pvWin = window.open(u, "dm-presenter");
  };

  const saveCopy = () => {
    const clone = document.documentElement.cloneNode(true);
    clone.classList.remove("story");
    const body = clone.querySelector("body");
    body.classList.remove("editing", "story");
    clone
      .querySelectorAll("[contenteditable]")
      .forEach((el) => el.removeAttribute("contenteditable"));
    clone.querySelector(".grid")?.remove();
    clone.querySelector(".kb")?.remove();
    clone.querySelector(".story-cue")?.remove();
    clone.querySelectorAll(".scene").forEach((scene) => {
      const slide = scene.querySelector(".slide");
      if (slide) scene.replaceWith(slide);
    });
    clone.querySelectorAll(".slide").forEach((s) => s.classList.remove("active", "before"));
    clone.querySelectorAll("[data-step]").forEach((el) => {
      el.classList.remove("shown");
      clearAnim(el);
    });
    clone.querySelectorAll(".grow, .pt, .trace").forEach((el) => clearAnim(el));
    const blob = new Blob(["<!doctype html>\n" + clone.outerHTML], {
      type: "text/html",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = (document.title || "deck").replace(/\s+/g, "-") + ".html";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  let paint = () => {};
  let next = () => {};
  let prev = () => {};
  let jump = () => {};

  if (!story) {
    paint = () => {
      slides.forEach((slide, i) => {
        slide.classList.toggle("active", i === index);
        slide.classList.toggle("before", i < index);
      });
      bar.style.width = `${((index + 1) / slides.length) * 100}%`;
      counter.textContent = `${index + 1} / ${slides.length}`;
      history.replaceState(null, "", location.search + `#${index + 1}`);
      activate(slides[index]);
      send({ type: "dm-state", i: index });
    };

    next = () => {
      const hidden = stepGroups(slides[index]).find((g) =>
        g.some((el) => !el.classList.contains("shown"))
      );
      if (hidden && !editing) {
        hidden.forEach(showStep);
        return;
      }
      if (index < slides.length - 1) {
        index++;
        if (editing) stepsOf(slides[index]).forEach((el) => showStep(el));
        paint();
      }
    };

    prev = () => {
      const shown = stepGroups(slides[index]).filter((g) =>
        g.some((el) => el.classList.contains("shown"))
      );
      if (shown.length && !editing) {
        shown[shown.length - 1].forEach(hideStep);
        return;
      }
      if (index > 0) {
        index--;
        stepsOf(slides[index]).forEach((el) => showStep(el));
        paint();
      }
    };

    jump = (n) => {
      index = Math.min(Math.max(n, 0), slides.length - 1);
      paint();
    };
  }

  if (story) {
    document.documentElement.classList.add("story");
    document.body.classList.add("story");
    const scenes = slides.map((slide) => {
      const scene = document.createElement("div");
      scene.className = "scene";
      const frame = document.createElement("div");
      frame.className = "frame";
      slide.parentNode.insertBefore(scene, slide);
      scene.appendChild(frame);
      frame.appendChild(slide);
      const steps = stepGroups(slide).length;
      scene.style.setProperty("--scene-h", `${150 + steps * 70}vh`);
      return scene;
    });
    const lastScene = scenes[scenes.length - 1];
    if (!stepGroups(slides[slides.length - 1]).length)
      lastScene.style.setProperty("--scene-h", "100vh");

    const cue = document.createElement("div");
    cue.className = "story-cue";
    cue.textContent = "scroll";
    document.body.appendChild(cue);
    hint.remove();

    const sceneProgress = (scene) => {
      const r = scene.getBoundingClientRect();
      const span = r.height - innerHeight;
      return span > 0 ? Math.min(Math.max(-r.top / span, 0), 1) : r.top < 0 ? 1 : 0;
    };

    const currentScene = () => {
      const mid = innerHeight * 0.5;
      for (let i = scenes.length - 1; i >= 0; i--) {
        if (scenes[i].getBoundingClientRect().top <= mid) return i;
      }
      return 0;
    };

    const setSteps = (slide, count) => {
      stepGroups(slide).forEach((g, j) =>
        g.forEach(j < count ? showStep : hideStep)
      );
    };

    const onScroll = () => {
      const i = currentScene();
      if (i !== index) {
        index = i;
        slides.forEach((slide, j) => {
          slide.classList.toggle("active", j === index);
          slide.classList.toggle("before", j < index);
        });
        counter.textContent = `${index + 1} / ${slides.length}`;
        history.replaceState(null, "", location.search + `#${index + 1}`);
        activate(slides[index]);
      }
      const p = sceneProgress(scenes[index]);
      const groups = stepGroups(slides[index]);
      if (groups.length && !editing) {
        const count = Math.min(
          groups.length,
          Math.max(0, Math.floor(((p - 0.22) / 0.62) * groups.length + 1))
        );
        setSteps(slides[index], count);
      }
      const doc = document.documentElement;
      const total = doc.scrollHeight - innerHeight;
      bar.style.width = `${total > 0 ? (scrollY / total) * 100 : 100}%`;
      if (scrollY > 40) cue.classList.add("gone");
    };

    slides[0].classList.add("active");
    counter.textContent = `1 / ${slides.length}`;

    const groupCount = (i) => stepGroups(slides[i]).length;
    const shownGroups = (i) =>
      stepGroups(slides[i]).filter((g) =>
        g.every((el) => el.classList.contains("shown"))
      ).length;

    const beatTop = (i, count) => {
      const scene = scenes[i];
      const n = groupCount(i);
      if (count <= 0 || !n) return scene.offsetTop;
      const span = scene.offsetHeight - innerHeight;
      const p = Math.min(0.22 + (0.62 * (count - 1)) / n + 0.31 / n, 1);
      return scene.offsetTop + span * p;
    };

    next = () => {
      const n = groupCount(index);
      const c = shownGroups(index);
      if (c < n) scrollTo({ top: beatTop(index, c + 1), behavior: "smooth" });
      else if (index < scenes.length - 1)
        scrollTo({ top: scenes[index + 1].offsetTop, behavior: "smooth" });
    };

    prev = () => {
      const c = shownGroups(index);
      if (c > 0) scrollTo({ top: beatTop(index, c - 1), behavior: "smooth" });
      else if (index > 0)
        scrollTo({ top: beatTop(index - 1, groupCount(index - 1)), behavior: "smooth" });
    };

    jump = (n) => {
      const scene = scenes[Math.min(Math.max(n, 0), scenes.length - 1)];
      scrollTo({ top: scene.offsetTop, behavior: "smooth" });
    };

    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", onScroll);
    requestAnimationFrame(onScroll);
  }

  toolbar.addEventListener("click", (e) => {
    const act = e.target.closest("button")?.dataset.act;
    if (act === "edit") setEditing(!editing);
    else if (act === "play") {
      if (story) return;
      setEditing(false);
      closeGrid();
      document.documentElement.requestFullscreen?.();
      paint();
    } else if (act === "grid") toggleGrid();
    else if (act === "pdf") window.print();
    else if (act === "notes") openPresenter();
    else if (act === "save") saveCopy();
    else if (act === "prev") prev();
    else if (act === "next") next();
  });

  const onMsg = (m) => {
    if (!m || story) return;
    if (m.type === "dm-hello") send({ type: "dm-state", i: index });
    else if (m.type === "dm-cmd") m.cmd === "next" ? next() : prev();
  };
  bc && (bc.onmessage = (e) => onMsg(e.data));
  addEventListener("message", (e) => onMsg(e.data));

  addEventListener("keydown", (e) => {
    if (editing) {
      if (e.key === "Escape") setEditing(false);
      return;
    }
    if (helpKey(e)) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key;
    if (gridEl() && !["o", "O", "Escape"].includes(k)) return;
    if (["ArrowRight", "ArrowDown", " ", "PageDown"].includes(k)) {
      e.preventDefault();
      next();
    } else if (["ArrowLeft", "ArrowUp", "Backspace", "PageUp"].includes(k)) {
      e.preventDefault();
      prev();
    } else if (k === "Home") {
      jump(0);
    } else if (k === "End") {
      jump(slides.length - 1);
    } else if (k === "e" || k === "E") {
      setEditing(true);
    } else if (k === "o" || k === "O") {
      toggleGrid();
    } else if (k === "n" || k === "N") {
      openPresenter();
    } else if (k === "Escape") {
      closeGrid();
    } else if (k === "f" || k === "F") {
      document.fullscreenElement
        ? document.exitFullscreen()
        : document.documentElement.requestFullscreen();
    }
  });

  let touchX = null;
  addEventListener(
    "touchstart",
    (e) => {
      touchX = e.touches[0].clientX;
    },
    { passive: true }
  );
  addEventListener(
    "touchend",
    (e) => {
      if (touchX === null || editing || story) return;
      const dx = e.changedTouches[0].clientX - touchX;
      if (dx < -50) next();
      if (dx > 50) prev();
      touchX = null;
    },
    { passive: true }
  );

  addEventListener("beforeprint", () => {
    closeHelp();
    settleCounters();
    settleCharts();
    closeGrid();
    slides.forEach((slide) =>
      stepsOf(slide).forEach((el) => {
        el.classList.add("shown");
        clearAnim(el);
      })
    );
  });

  fit();
  addEventListener("resize", fit);
  stagger();
  settleCounters();

  if (!story) {
    const fromHash = parseInt(location.hash.slice(1), 10);
    if (fromHash >= 1 && fromHash <= slides.length) index = fromHash - 1;
    jump(index);
    setTimeout(() => hint.classList.add("gone"), 4000);
  }
})();
