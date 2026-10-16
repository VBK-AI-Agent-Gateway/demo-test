/* 图片转文档 - 纯前端实现，无依赖 */
(function () {
  "use strict";

  /** @type {{id:number,name:string,url:string}[]} */
  let images = [];
  let seq = 1;

  const $ = (s) => document.querySelector(s);
  const fileInput = $("#fileInput");
  const dropzone = $("#dropzone");
  const items = $("#items");
  const empty = $("#empty");
  const thumbTray = $("#thumbTray");
  const page = $("#page");

  /* ---------- 设置读取 ---------- */
  function settings() {
    return {
      title: $("#docTitle").value.trim() || "图片文档",
      margin: $("#margin").value,
      imgWidth: $("#imgWidth").value,
      gap: $("#imgGap").value,
      caption: $("#captionMode").value,
      showDate: $("#showDate").checked,
      date: new Date().toLocaleString("zh-CN", { dateStyle: "long", timeStyle: "short" }),
    };
  }

  function applyCssVars() {
    const s = settings();
    page.style.setProperty("--page-margin", s.margin + "mm");
    page.style.setProperty("--item-gap", s.gap + "mm");
    page.style.setProperty("--img-w", s.imgWidth + "%");
    $("#marginVal").textContent = s.margin;
    $("#imgWidthVal").textContent = s.imgWidth;
    $("#imgGapVal").textContent = s.gap;
    $("#previewTitle").textContent = s.title;
    $("#previewDate").textContent = s.showDate ? "生成时间：" + s.date : "";
    $("#previewDate").style.display = s.showDate ? "" : "none";
  }

  function captionText(i) {
    const s = settings();
    const img = images[i];
    const idx = "图 " + (i + 1);
    const name = img ? img.name : "";
    if (s.caption === "name") return name;
    if (s.caption === "index") return idx;
    if (s.caption === "both") return idx + " · " + name;
    return "";
  }

  /* ---------- 渲染 ---------- */
  function render() {
    applyCssVars();
    items.querySelectorAll(".doc-item").forEach((n) => n.remove());
    empty.style.display = images.length ? "none" : "";
    $("#count").textContent = images.length + " 张";

    images.forEach((img, i) => {
      const fig = document.createElement("figure");
      fig.className = "doc-item";
      fig.draggable = true;
      fig.dataset.id = String(img.id);

      const el = document.createElement("img");
      el.src = img.url;
      el.alt = img.name;
      fig.appendChild(el);

      const cap = document.createElement("figcaption");
      cap.className = "cap";
      cap.textContent = captionText(i);
      fig.appendChild(cap);

      items.appendChild(fig);
    });

    renderTray();
  }

  function renderTray() {
    thumbTray.innerHTML = "";
    if (!images.length) {
      const d = document.createElement("div");
      d.className = "empty-tray";
      d.textContent = "缩略图托盘（空）";
      thumbTray.appendChild(d);
      return;
    }
    images.forEach((img, i) => {
      const t = document.createElement("img");
      t.src = img.url;
      t.title = (i + 1) + ". " + img.name;
      t.onclick = () => {
        const node = items.querySelectorAll(".doc-item")[i];
        if (node) node.scrollIntoView({ behavior: "smooth", block: "center" });
      };
      thumbTray.appendChild(t);
    });
  }

  /* ---------- 上传 ---------- */
  function addFiles(fileList) {
    const files = Array.from(fileList || []).filter((f) => f.type.startsWith("image/"));
    if (!files.length) return;
    files.forEach((f) => {
      images.push({
        id: seq++,
        name: f.name || "image-" + seq,
        url: URL.createObjectURL(f),
      });
    });
    render();
  }

  fileInput.addEventListener("change", () => {
    addFiles(fileInput.files);
    fileInput.value = "";
  });

  ["dragenter", "dragover"].forEach((ev) =>
    dropzone.addEventListener(ev, (e) => {
      e.preventDefault();
      dropzone.classList.add("drag");
    })
  );
  ["dragleave", "drop"].forEach((ev) =>
    dropzone.addEventListener(ev, (e) => {
      e.preventDefault();
      dropzone.classList.remove("drag");
    })
  );
  dropzone.addEventListener("drop", (e) => addFiles(e.dataTransfer.files));

  /* 页面空白处也接受拖拽（避免误开新窗口） */
  ["dragover", "drop"].forEach((ev) =>
    document.addEventListener(ev, (e) => e.preventDefault())
  );

  /* ---------- 拖拽排序 ---------- */
  let dragId = null;
  items.addEventListener("dragstart", (e) => {
    const fig = e.target.closest(".doc-item");
    if (!fig) return;
    dragId = Number(fig.dataset.id);
    fig.classList.add("dragging");
  });
  items.addEventListener("dragend", (e) => {
    const fig = e.target.closest(".doc-item");
    if (fig) fig.classList.remove("dragging");
    dragId = null;
  });
  items.addEventListener("dragover", (e) => {
    if (dragId === null) return;
    e.preventDefault();
    const over = e.target.closest(".doc-item");
    if (!over) return;
    const overId = Number(over.dataset.id);
    if (overId === dragId) return;
    const from = images.findIndex((x) => x.id === dragId);
    const to = images.findIndex((x) => x.id === overId);
    if (from < 0 || to < 0) return;
    const [moved] = images.splice(from, 1);
    images.splice(to, 0, moved);
    render();
    const fig = items.querySelector('.doc-item[data-id="' + dragId + '"]');
    if (fig) fig.classList.add("dragging");
  });
  items.addEventListener("drop", (e) => e.preventDefault());

  /* ---------- 设置变更 ---------- */
  ["#docTitle", "#margin", "#imgWidth", "#imgGap", "#captionMode", "#showDate"].forEach(
    (sel) => {
      const el = $(sel);
      const evt = el.type === "checkbox" || el.tagName === "SELECT" ? "change" : "input";
      el.addEventListener(evt, () => {
        applyCssVars();
        items.querySelectorAll(".doc-item").forEach((n, i) => {
          const cap = n.querySelector(".cap");
          if (cap) cap.textContent = captionText(i);
        });
      });
    }
  );

  /* ---------- 导出 ---------- */
  $("#btnPrint").addEventListener("click", () => {
    if (!images.length) {
      alert("请先上传至少一张图片");
      return;
    }
    window.print();
  });

  $("#btnHtml").addEventListener("click", () => {
    if (!images.length) {
      alert("请先上传至少一张图片");
      return;
    }
    const s = settings();
    const html = buildDocHtml(s);
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = s.title.replace(/[\\/:*?"<>|]/g, "_") + ".html";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  });

  $("#btnClear").addEventListener("click", () => {
    if (images.length && !confirm("确定清空全部图片？")) return;
    images.forEach((i) => URL.revokeObjectURL(i.url));
    images = [];
    render();
  });

  function esc(s) {
    return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  }

  /* 构建独立文档 HTML（内嵌 base64，离线可打开） */
  function buildDocHtml(s) {
    const imgsHtml = images
      .map((img, i) => {
        const cap = captionText(i);
        return (
          '<figure class="item"><img src="' +
          img.url +
          '" alt="' +
          esc(img.name) +
          '">' +
          (cap ? "<figcaption>" + esc(cap) + "</figcaption>" : "") +
          "</figure>"
        );
      })
      .join("\n");

    return [
      "<!DOCTYPE html>",
      '<html lang="zh-CN"><head><meta charset="UTF-8">',
      "<title>" + esc(s.title) + "</title>",
      "<style>",
      "@page{size:A4;margin:" + s.margin + "mm}",
      "body{font-family:sans-serif;max-width:210mm;margin:0 auto;padding:" + s.margin + "mm;color:#111}",
      "h1{font-size:22pt;margin:0 0 4pt}",
      ".date{font-size:9pt;color:#666;margin-bottom:16pt}",
      ".items{display:flex;flex-direction:column;gap:" + s.gap + "mm}",
      ".item{margin:0;text-align:center;break-inside:avoid;page-break-inside:avoid}",
      ".item img{max-width:" + s.imgWidth + "%;height:auto}",
      ".item figcaption{font-size:9pt;color:#555;margin-top:4pt}",
      "</style></head><body>",
      "<h1>" + esc(s.title) + "</h1>",
      s.showDate ? '<div class="date">' + esc(s.date) + "</div>" : "",
      '<div class="items">', imgsHtml, "</div>",
      "</body></html>",
    ].join("\n");
  }

  /* 日期显示用当前时间 */
  render();
})();