(function () {
  "use strict";

  const framesEl = document.getElementById("frames");
  const scroller = document.getElementById("scroller");
  const filmWrap = document.getElementById("filmWrap");
  const railThumb = document.getElementById("railThumb");
  const metaCount = document.getElementById("metaCount");
  const underCount = document.getElementById("underCount");
  const hint = document.getElementById("hint");

  const dialog = document.getElementById("viewer");
  const stage = document.getElementById("stage");
  const stageImg = document.getElementById("stageImg");
  const stageBlur = document.getElementById("stageBlur");
  const stageStatus = document.getElementById("stageStatus");
  const viewerCount = document.getElementById("viewerCount");
  const viewerMonth = document.getElementById("viewerMonth");
  const viewerDate = document.getElementById("viewerDate");
  const viewerLoc = document.getElementById("viewerLoc");
  const viewerCaption = document.getElementById("viewerCaption");
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  const closeBtn = document.getElementById("closeBtn");

  if (!Array.isArray(PHOTOS) || PHOTOS.length === 0) {
    return;
  }

  /* ---------- build the film roll ---------- */

  const MONTH_NAMES = [
    "", "一月", "二月", "三月", "四月", "五月", "六月",
    "七月", "八月", "九月", "十月", "十一月", "十二月"
  ];
  const MONTH_EN = [
    "", "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
    "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"
  ];

  function createMonthMarker(monthKey, hasPhotos) {
    const parts = monthKey.split("-");
    const monthNumber = Number(parts[1]);

    const month = document.createElement("section");
    month.className = "month" + (hasPhotos ? "" : " month-empty");
    month.setAttribute(
      "aria-label",
      MONTH_NAMES[monthNumber] + (hasPhotos ? "的照片" : "，没有照片")
    );

    const kicker = document.createElement("span");
    kicker.className = "month-kicker";
    kicker.textContent = parts[0] + " / " + parts[1];

    const name = document.createElement("span");
    name.className = "month-name";
    name.textContent = MONTH_NAMES[monthNumber];

    const en = document.createElement("span");
    en.className = "month-en";
    en.textContent = MONTH_EN[monthNumber];

    month.appendChild(kicker);
    month.appendChild(name);
    month.appendChild(en);

    if (!hasPhotos) {
      const note = document.createElement("span");
      note.className = "month-note";
      note.textContent = "没有照片";
      month.appendChild(note);
    }

    return month;
  }

  function createFrame(photo, index) {
    const frame = document.createElement("button");
    frame.type = "button";
    frame.className = "frame";
    frame.dataset.index = String(index);
    frame.setAttribute(
      "aria-label",
      "打开照片：" + photo.caption + "，" + photo.location + "，" + photo.dateLabel
    );

    const img = document.createElement("img");
    img.src = photo.thumb;
    img.width = photo.width;
    img.height = photo.height;
    img.alt = photo.alt;
    img.loading = "lazy";
    img.decoding = "async";
    img.draggable = false;

    const meta = document.createElement("span");
    meta.className = "frame-meta";

    const no = document.createElement("span");
    no.textContent = String(photo.no).padStart(2, "0");

    const date = document.createElement("span");
    date.textContent = photo.frameDate;

    meta.appendChild(no);
    meta.appendChild(date);
    frame.appendChild(img);
    frame.appendChild(meta);

    frame.addEventListener("click", function () {
      openViewer(index, frame);
    });

    return frame;
  }

  // Group by month, but keep a slot for every month between the first and
  // last photo so months without pictures (February, September) still get a
  // blank stretch of film with their name on it.
  const byMonth = new Map();
  PHOTOS.forEach(function (photo, index) {
    if (!byMonth.has(photo.month)) {
      byMonth.set(photo.month, []);
    }
    byMonth.get(photo.month).push({ photo: photo, index: index });
  });

  const firstParts = PHOTOS[0].month.split("-").map(Number);
  const lastParts = PHOTOS[PHOTOS.length - 1].month.split("-").map(Number);
  const firstIndex = firstParts[0] * 12 + firstParts[1];
  const lastIndex = lastParts[0] * 12 + lastParts[1];

  for (let cursor = firstIndex; cursor <= lastIndex; cursor++) {
    const year = Math.floor((cursor - 1) / 12);
    const monthNumber = ((cursor - 1) % 12) + 1;
    const monthKey = year + "-" + String(monthNumber).padStart(2, "0");
    const group = byMonth.get(monthKey) || [];

    framesEl.appendChild(createMonthMarker(monthKey, group.length > 0));
    group.forEach(function (entry) {
      framesEl.appendChild(createFrame(entry.photo, entry.index));
    });
  }

  const end = document.createElement("div");
  end.className = "roll-end";
  end.setAttribute("aria-hidden", "true");
  const endDot = document.createElement("span");
  endDot.className = "end-dot";
  const endText = document.createElement("span");
  endText.textContent = "END";
  end.appendChild(endDot);
  end.appendChild(endText);
  framesEl.appendChild(end);

  metaCount.textContent =
    PHOTOS.length + " 张照片 · " + PHOTOS[0].monthName + "—" + PHOTOS[PHOTOS.length - 1].monthName;
  underCount.textContent = PHOTOS.length + " 格";

  if (window.matchMedia("(hover: none)").matches) {
    hint.innerHTML = '左右滑动浏览 <span aria-hidden="true">→</span>';
  }

  /* ---------- horizontal scrolling ---------- */

  function maxScroll() {
    return Math.max(0, scroller.scrollWidth - scroller.clientWidth);
  }

  function updateRail() {
    const max = maxScroll();
    const visible = Math.min(1, Math.max(scroller.clientWidth / scroller.scrollWidth, 0.045));
    const progress = max > 0 ? scroller.scrollLeft / max : 0;

    railThumb.style.width = visible * 100 + "%";
    railThumb.style.left = progress * (1 - visible) * 100 + "%";

    filmWrap.classList.toggle("at-start", scroller.scrollLeft < 4);
    filmWrap.classList.toggle("at-end", max - scroller.scrollLeft < 4);
  }

  let railQueued = false;
  scroller.addEventListener("scroll", function () {
    if (railQueued) {
      return;
    }
    railQueued = true;
    requestAnimationFrame(function () {
      railQueued = false;
      updateRail();
    });
  }, { passive: true });

  window.addEventListener("resize", updateRail);
  window.addEventListener("load", updateRail);
  updateRail();

  // Mouse drag to scroll. Touch uses the browser's native horizontal pan.
  let dragging = false;
  let dragStartX = 0;
  let dragStartScroll = 0;
  let dragMoved = false;
  let suppressClickUntil = 0;

  scroller.addEventListener("pointerdown", function (event) {
    if (event.pointerType === "touch" || (event.pointerType === "mouse" && event.button !== 0)) {
      return;
    }
    dragging = true;
    dragMoved = false;
    dragStartX = event.clientX;
    dragStartScroll = scroller.scrollLeft;
    scroller.classList.add("dragging");
  });

  window.addEventListener("pointermove", function (event) {
    if (!dragging) {
      return;
    }
    const dx = event.clientX - dragStartX;
    if (Math.abs(dx) > 6) {
      dragMoved = true;
    }
    if (dragMoved) {
      scroller.scrollLeft = dragStartScroll - dx;
    }
  });

  window.addEventListener("pointerup", function () {
    if (!dragging) {
      return;
    }
    dragging = false;
    scroller.classList.remove("dragging");
    if (dragMoved) {
      suppressClickUntil = performance.now() + 250;
    }
  });

  scroller.addEventListener("click", function (event) {
    if (performance.now() < suppressClickUntil) {
      event.preventDefault();
      event.stopPropagation();
    }
  }, true);

  // A vertical wheel over the roll moves it sideways, but only while the roll
  // still has room in that direction; otherwise the page keeps its scroll.
  scroller.addEventListener("wheel", function (event) {
    if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) {
      return;
    }
    const max = maxScroll();
    if (max <= 0) {
      return;
    }
    const next = scroller.scrollLeft + event.deltaY;
    if ((next < 0 && event.deltaY < 0) || (next > max && event.deltaY > 0)) {
      return;
    }
    event.preventDefault();
    scroller.scrollLeft = next;
  }, { passive: false });

  /* ---------- viewer ---------- */

  let current = -1;
  let lastFocus = null;
  let statusTimer = 0;
  const preloaded = new Set();

  function preload(index) {
    if (index < 0 || index >= PHOTOS.length) {
      return;
    }
    const src = PHOTOS[index].src;
    if (preloaded.has(src)) {
      return;
    }
    preloaded.add(src);
    const image = new Image();
    image.src = src;
  }

  function updateViewer() {
    const photo = PHOTOS[current];

    viewerCount.textContent =
      String(current + 1).padStart(2, "0") + " / " + String(PHOTOS.length).padStart(2, "0");
    viewerMonth.textContent = photo.monthName;
    viewerDate.textContent = photo.dateLabel;
    viewerLoc.textContent = photo.location;
    viewerCaption.textContent = photo.caption;

    prevBtn.disabled = current === 0;
    nextBtn.disabled = current === PHOTOS.length - 1;

    stageImg.classList.remove("loaded");
    stageImg.alt = photo.alt;
    stageBlur.style.backgroundImage = 'url("' + photo.thumb + '")';

    window.clearTimeout(statusTimer);
    stageStatus.classList.remove("visible");
    statusTimer = window.setTimeout(function () {
      stageStatus.classList.add("visible");
    }, 180);

    stageImg.src = photo.src;

    preload(current + 1);
    preload(current + 2);
    preload(current - 1);
  }

  function openViewer(index, trigger) {
    current = index;
    lastFocus = trigger || null;

    if (!dialog.open) {
      dialog.showModal();
      dialog.focus();
    }
    document.body.classList.add("viewing");
    updateViewer();
  }

  function step(direction) {
    const next = current + direction;
    if (next < 0 || next >= PHOTOS.length) {
      return;
    }
    current = next;
    updateViewer();
  }

  stageImg.addEventListener("load", function () {
    window.clearTimeout(statusTimer);
    stageStatus.classList.remove("visible");
    stageImg.classList.add("loaded");
  });

  stageImg.addEventListener("error", function () {
    window.clearTimeout(statusTimer);
    stageStatus.textContent = "这张照片没能显影";
    stageStatus.classList.add("visible");
  });

  prevBtn.addEventListener("click", function () {
    step(-1);
  });

  nextBtn.addEventListener("click", function () {
    step(1);
  });

  closeBtn.addEventListener("click", function () {
    dialog.close();
  });

  dialog.addEventListener("click", function (event) {
    if (event.target === dialog) {
      dialog.close();
    }
  });

  dialog.addEventListener("close", function () {
    document.body.classList.remove("viewing");
    stageStatus.classList.remove("visible");
    stageImg.removeAttribute("src");
    stageImg.alt = "";
    if (lastFocus && typeof lastFocus.focus === "function") {
      lastFocus.focus({ preventScroll: true });
    }
  });

  dialog.addEventListener("keydown", function (event) {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      step(-1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      step(1);
    } else if (event.key === "Home") {
      event.preventDefault();
      current = 0;
      updateViewer();
    } else if (event.key === "End") {
      event.preventDefault();
      current = PHOTOS.length - 1;
      updateViewer();
    }
  });

  // Swipe left / right on the photo to move through the roll.
  let touchX = 0;
  let touchY = 0;

  stage.addEventListener("touchstart", function (event) {
    if (event.touches.length !== 1) {
      return;
    }
    touchX = event.touches[0].clientX;
    touchY = event.touches[0].clientY;
  }, { passive: true });

  stage.addEventListener("touchend", function (event) {
    if (event.changedTouches.length !== 1) {
      return;
    }
    const dx = event.changedTouches[0].clientX - touchX;
    const dy = event.changedTouches[0].clientY - touchY;
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.15) {
      step(dx < 0 ? 1 : -1);
    }
  }, { passive: true });

  // Keep the roll and the rail correct after the thumbnails take their space.
  window.addEventListener("pageshow", updateRail);
})();
