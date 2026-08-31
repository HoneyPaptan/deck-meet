(() => {
  if (window.__deckMeet) return;
  window.__deckMeet = "dm-runtime-v1";

  const stage = document.querySelector(".stage");
  const slides = [...stage.querySelectorAll(".slide")];
  const bar = document.querySelector(".progress span");
  const counter = document.querySelector(".counter");
  const hint = document.querySelector(".hint");
  const toolbar = document.querySelector(".toolbar");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isPresenter = new URLSearchParams(location.search).has("presenter");
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

  const stagger = () => {
    slides.forEach((slide) => {
      [...slide.children].forEach((el, i) => el.style.setProperty("--i", i));
    });
  };

  const finalText = (el) =>
    Number(el.dataset.to).toFixed(Number(el.dataset.decimals || 0)) +
    (el.dataset.suffix || "");

  const settleCounters = () => {
    document
      .querySelectorAll(".num[data-to]")
      .forEach((el) => (el.textContent = finalText(el)));
  };

  const countUp = (slide) => {
    slide.querySelectorAll(".num[data-to]").forEach((el) => {
      if (reduced || editing) {
        el.textContent = finalText(el);
        return;
      }
      const to = Number(el.dataset.to);
      const decimals = Number(el.dataset.decimals || 0);
      const suffix = el.dataset.suffix || "";
      const t0 = performance.now();
      const tick = (t) => {
        const p = Math.min((t - t0) / 900, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = (to * eased).toFixed(decimals) + suffix;
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  };

  const paint = () => {
    slides.forEach((slide, i) => {
      slide.classList.toggle("active", i === index);
      slide.classList.toggle("before", i < index);
    });
    bar.style.width = `${((index + 1) / slides.length) * 100}%`;
    counter.textContent = `${index + 1} / ${slides.length}`;
    history.replaceState(null, "", location.search + `#${index + 1}`);
    countUp(slides[index]);
    send({ type: "dm-state", i: index });
  };

  const next = () => {
    const hidden = stepsOf(slides[index]).find(
      (el) => !el.classList.contains("shown")
    );
    if (hidden && !editing) {
      hidden.classList.add("shown");
      return;
    }
    if (index < slides.length - 1) {
      index++;
      if (editing) stepsOf(slides[index]).forEach((el) => el.classList.add("shown"));
      paint();
    }
  };

  const prev = () => {
    const shown = stepsOf(slides[index]).filter((el) =>
      el.classList.contains("shown")
    );
    if (shown.length && !editing) {
      shown[shown.length - 1].classList.remove("shown");
      return;
    }
    if (index > 0) {
      index--;
      stepsOf(slides[index]).forEach((el) => el.classList.add("shown"));
      paint();
    }
  };

  const jump = (n) => {
    index = Math.min(Math.max(n, 0), slides.length - 1);
    paint();
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
      slides.forEach((slide) =>
        stepsOf(slide).forEach((el) => el.classList.add("shown"))
      );
      settleCounters();
    }
    toolbar.querySelector('[data-act="edit"]').classList.toggle("on", on);
  };

  const gridEl = () => document.querySelector(".grid");

  const closeGrid = () => gridEl()?.remove();

  const openGrid = () => {
    if (gridEl()) return;
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
    const u = new URL(location.href);
    u.searchParams.set("presenter", "1");
    u.hash = "";
    pvWin = window.open(u, "dm-presenter");
  };

  const play = () => {
    setEditing(false);
    closeGrid();
    document.documentElement.requestFullscreen?.();
    paint();
  };

  const saveCopy = () => {
    const clone = document.documentElement.cloneNode(true);
    clone
      .querySelectorAll("[contenteditable]")
      .forEach((el) => el.removeAttribute("contenteditable"));
    clone.querySelector("body").classList.remove("editing");
    clone.querySelector(".grid")?.remove();
    clone
      .querySelectorAll(".slide")
      .forEach((s) => s.classList.remove("active", "before"));
    clone
      .querySelectorAll("[data-step].shown")
      .forEach((el) => el.classList.remove("shown"));
    const blob = new Blob(["<!doctype html>\n" + clone.outerHTML], {
      type: "text/html",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = (document.title || "deck").replace(/\s+/g, "-") + ".html";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  toolbar.addEventListener("click", (e) => {
    const act = e.target.closest("button")?.dataset.act;
    if (act === "edit") setEditing(!editing);
    else if (act === "play") play();
    else if (act === "grid") toggleGrid();
    else if (act === "pdf") window.print();
    else if (act === "notes") openPresenter();
    else if (act === "save") saveCopy();
    else if (act === "prev") prev();
    else if (act === "next") next();
  });

  const onMsg = (m) => {
    if (!m) return;
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
      if (touchX === null || editing) return;
      const dx = e.changedTouches[0].clientX - touchX;
      if (dx < -50) next();
      if (dx > 50) prev();
      touchX = null;
    },
    { passive: true }
  );

  addEventListener("beforeprint", () => {
    settleCounters();
    closeGrid();
  });

  const fromHash = parseInt(location.hash.slice(1), 10);
  if (fromHash >= 1 && fromHash <= slides.length) index = fromHash - 1;

  fit();
  addEventListener("resize", fit);
  stagger();
  settleCounters();
  jump(index);
  setTimeout(() => hint.classList.add("gone"), 4000);
})();
