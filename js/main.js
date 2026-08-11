(function () {
  "use strict";

  // 一組低飽和、適合極簡白底的佔位色（之後放真圖就用不到了）
  const PLACEHOLDER_TONES = [
    "#e4e0d8", "#dfe3e0", "#e8e2df", "#dcdfe4",
    "#e6e1e6", "#e2e6df", "#e9e4dc", "#dee2e6"
  ];

  function isVideoSrc(src) {
    return /\.(mp4|webm|mov|m4v)(\?.*)?$/i.test(src || "");
  }

  function placeholderSvg(ratio, index) {
    const w = 600;
    const h = Math.round(w * ratio);
    const tone = PLACEHOLDER_TONES[index % PLACEHOLDER_TONES.length];
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
        <rect width="100%" height="100%" fill="${tone}"/>
      </svg>`.trim();
    return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
  }

  const grid = document.getElementById("grid");

  // 決定性的「假隨機」：同一個 index 永遠算出同一個值，
  // 這樣 resize / 重新整理時位移不會跳動或改變版面高度。
  function seeded(i) {
    const x = Math.sin(i * 12.9898) * 43758.5453;
    return x - Math.floor(x); // 0–1
  }

  function renderWorks(WORKS) {
    const frag = document.createDocumentFragment();

    WORKS.forEach((work, i) => {
      const isPlaceholder = !work.img;
      const src = isPlaceholder
        ? placeholderSvg(work.ratio || 1, i)
        : work.img;

      const item = document.createElement("div");
      item.className = "item";
      item.dataset.index = String(i);

      // 是否跨兩欄顯示（比較大、比較搶眼），由後台管理介面裡的「大張顯示」控制。
      const isFeature = !!work.feature;
      if (isFeature) {
        item.classList.add("item--feature");
        item.style.gridColumn = "span 2";
      } else {
        // 一般作品給位移，讓版面不要每張都死死對齊同一條隱形格線。
        // X 的幅度要小於欄間距（--gutter）的一半，邊界縮小後欄間距最小只剩 20px，
        // 位移太大會在窄螢幕上蓋到隔壁欄。
        const jitterX = (seeded(i) - 0.5) * 16;       // -8px ~ +8px
        const jitterY = (seeded(i + 100) - 0.5) * 28; // -14px ~ +14px
        item.style.transform = `translate(${jitterX.toFixed(1)}px, ${jitterY.toFixed(1)}px)`;
      }

      const thumb = document.createElement("div");
      thumb.className = "thumb" + (isPlaceholder ? " placeholder" : "");

      const isVideo = !isPlaceholder && isVideoSrc(src);

      if (isVideo) {
        const video = document.createElement("video");
        video.src = src;
        video.muted = true;
        video.loop = true;
        video.autoplay = true;
        video.playsInline = true;
        video.preload = "metadata";
        video.addEventListener("loadedmetadata", () => resizeItem(item));
        thumb.appendChild(video);
      } else {
        const img = document.createElement("img");
        img.src = src;
        img.alt = work.title || "";
        img.loading = "lazy";
        img.addEventListener("load", () => resizeItem(item));
        thumb.appendChild(img);
      }

      const caption = document.createElement("p");
      caption.className = "item-caption";
      caption.textContent = work.title || "";

      item.appendChild(thumb);
      item.appendChild(caption);
      item.addEventListener("click", () => openLightbox(src, work.title || "", isVideo));

      frag.appendChild(item);
    });

    grid.appendChild(frag);
  }

  // ---------- Masonry：依圖片「原始比例」換算 grid-row-end ----------
  // 注意：不能直接讀 item.getBoundingClientRect().height，因為那個高度
  // 本身就是被 grid-row-end 限制出來的結果（循環依賴），會導致算出來
  // 永遠是初始值，圖片視覺上溢出格子、疊在下一列作品上面。
  function resizeItem(item) {
    const thumb = item.querySelector(".thumb");
    const media = thumb.querySelector("img, video");
    const caption = item.querySelector(".item-caption");

    const width = thumb.getBoundingClientRect().width;
    let thumbHeight;
    const naturalW = media.tagName === "VIDEO" ? media.videoWidth : media.naturalWidth;
    const naturalH = media.tagName === "VIDEO" ? media.videoHeight : media.naturalHeight;
    if (naturalW && naturalH) {
      thumbHeight = width * (naturalH / naturalW);
    } else {
      thumbHeight = width; // 圖片／影片還沒載入完成時的暫時保守值
    }

    const captionHeight = caption.getBoundingClientRect().height + 6; // 6px = caption 的 margin-top

    const rowHeight = 4; // 對應 CSS 的 grid-auto-rows
    const rowGap = getGapPx();
    // +rowGap*1.1 是刻意多留的緩衝：因為一般項目還套了最大 ±14px 的 translate 位移，
    // 邊界縮小後 --gutter 最小只有 20px，緩衝不夠位移量吃，下一件作品會被蓋到。
    const contentHeight = thumbHeight + captionHeight + rowGap * 1.1;
    const span = Math.ceil((contentHeight + rowGap) / (rowHeight + rowGap));
    item.style.gridRowEnd = "span " + span;
  }

  function getGapPx() {
    const gapStr = getComputedStyle(grid).rowGap || getComputedStyle(grid).gap || "20px";
    return parseFloat(gapStr) || 20;
  }

  function resizeAllItems() {
    grid.querySelectorAll(".item").forEach(resizeItem);
  }

  window.addEventListener("load", resizeAllItems);
  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resizeAllItems, 120);
  });

  // ---------- Lightbox ----------
  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightbox-img");
  const lightboxVideo = document.getElementById("lightbox-video");
  const lightboxCaption = document.getElementById("lightbox-caption");
  const lightboxClose = document.querySelector(".lightbox-close");

  function openLightbox(src, title, isVideo) {
    if (isVideo) {
      lightboxImg.hidden = true;
      lightboxImg.src = "";
      lightboxVideo.hidden = false;
      lightboxVideo.src = src;
      lightboxVideo.muted = false;
      lightboxVideo.play().catch(() => {}); // 使用者還沒跟頁面互動過時瀏覽器可能擋自動播放，靜默失敗即可
    } else {
      lightboxVideo.hidden = true;
      lightboxVideo.pause();
      lightboxVideo.src = "";
      lightboxImg.hidden = false;
      lightboxImg.src = src;
      lightboxImg.alt = title;
    }
    lightboxCaption.textContent = title;
    lightbox.hidden = false;
    document.body.style.overflow = "hidden";
  }

  function closeLightbox() {
    lightbox.hidden = true;
    lightboxImg.src = "";
    lightboxVideo.pause();
    lightboxVideo.src = "";
    document.body.style.overflow = "";
  }

  lightboxClose.addEventListener("click", closeLightbox);
  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) closeLightbox();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !lightbox.hidden) closeLightbox();
  });

  // ---------- 讀取作品資料（admin.html 管理介面寫的就是這份 works.json） ----------
  fetch("js/works.json")
    .then((res) => {
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.json();
    })
    .then((works) => {
      renderWorks(works);
      resizeAllItems();
      setTimeout(resizeAllItems, 300);
    })
    .catch((err) => {
      grid.innerHTML =
        '<p style="padding:40px 0;color:#9a958e;font-size:14px;">作品資料載入失敗（' +
        err.message +
        '）。若你是直接雙擊開啟 index.html，請改用本機伺服器開啟（見 README）。</p>';
    });
})();
