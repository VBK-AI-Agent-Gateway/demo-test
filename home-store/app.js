/* HomeStore - 仿宜家家具商城逻辑 */
(function () {
  "use strict";
  var $ = function (s) { return document.querySelector(s); };
  var KEY = "homestore-v1";

  var state = { cat: "all", q: "", sort: "def", cart: {} };
  try { var raw = JSON.parse(localStorage.getItem(KEY)); if (raw && raw.cart) state.cart = raw.cart; } catch (e) {}
  function save() { try { localStorage.setItem(KEY, { cart: state.cart } && JSON.stringify({ cart: state.cart })); } catch (e) {} }

  function catName(id) {
    for (var i = 0; i < STORE.cats.length; i++) if (STORE.cats[i].id === id) return STORE.cats[i].name;
    return "商品";
  }
  function pic(p) { return typeof p.pic === "function" ? p.pic(p.a, p.b) : p.pic; }

  /* ---------- 分类卡 ---------- */
  function renderCats() {
    var html = '<button class="cat-card' + (state.cat === "all" ? " on" : "") + '" data-cat="all"><div class="ic">🛍️</div><b>全部</b></button>';
    STORE.cats.forEach(function (c) {
      html += '<button class="cat-card' + (state.cat === c.id ? " on" : "") + '" data-cat="' + c.id + '">' +
        '<div class="ic">' + c.ic + "</div><b>" + c.name + "</b></button>";
    });
    $("#catsBox").innerHTML = html;
    Array.prototype.forEach.call($("#catsBox").querySelectorAll(".cat-card"), function (b) {
      b.addEventListener("click", function () { setCat(b.getAttribute("data-cat")); });
    });
  }

  /* ---------- 商品列表 ---------- */
  function filtered() {
    var list = STORE.products.slice();
    if (state.cat !== "all") list = list.filter(function (p) { return p.cat === state.cat; });
    if (state.q) {
      var q = state.q.toLowerCase();
      list = list.filter(function (p) {
        return (p.name + " " + catName(p.cat) + " " + p.desc).toLowerCase().indexOf(q) >= 0;
      });
    }
    if (state.sort === "asc") list.sort(function (a, b) { return a.price - b.price; });
    else if (state.sort === "desc") list.sort(function (a, b) { return b.price - a.price; });
    else if (state.sort === "rating") list.sort(function (a, b) { return b.rating - a.rating; });
    return list;
  }
  function renderGrid() {
    var list = filtered();
    $("#listTitle").textContent = (state.cat === "all" ? "全部商品" : catName(state.cat)) +
      "（" + list.length + " 件）" + (state.q ? " · 搜索：“" + state.q + "”" : "");
    $("#emptyBox").style.display = list.length ? "none" : "block";
    $("#gridBox").innerHTML = list.map(function (p) {
      var tagCls = p.tag === "新品" ? "new" : (p.tag === "特惠" || p.tag === "爆款" ? "sale" : "");
      return '<article class="card" data-id="' + p.id + '">' +
        '<div class="pic">' + (p.tag ? '<span class="tag ' + tagCls + '">' + p.tag + "</span>" : "") + pic(p) + "</div>" +
        '<div class="body"><h3>' + p.name + "</h3>" +
        '<div class="rate">★ ' + p.rating.toFixed(1) + ' <span>（' + (900 + p.id * 37) + " 条评价）</span></div>" +
        '<div class="desc">' + p.desc + "</div>" +
        '<div class="price"><b>' + p.price + "</b>" + (p.old ? "<s>¥" + p.old + "</s>" : "") + "</div>" +
        '<button class="add" data-add="' + p.id + '">加入购物车</button>' +
        "</div></article>";
    }).join("");
    Array.prototype.forEach.call($("#gridBox").querySelectorAll(".card"), function (c) {
      c.addEventListener("click", function (e) {
        if (e.target.closest("[data-add]")) return;
        openDetail(+c.getAttribute("data-id"));
      });
    });
    Array.prototype.forEach.call($("#gridBox").querySelectorAll("[data-add]"), function (b) {
      b.addEventListener("click", function (e) {
        e.stopPropagation();
        addCart(+b.getAttribute("data-add"));
      });
    });
  }
  function setCat(id) {
    state.cat = id;
    renderCats(); renderGrid();
    syncMenu();
    window.scrollTo({ top: $("#catsBox").offsetTop - 70, behavior: "smooth" });
  }
  function syncMenu() {
    Array.prototype.forEach.call($("#menu").querySelectorAll(".m-item"), function (m) {
      m.classList.toggle("active", m.getAttribute("data-cat") === state.cat);
    });
  }

  /* ---------- 导航 ---------- */
  $("#menu").addEventListener("click", function (e) {
    var m = e.target.closest(".m-item"); if (!m) return;
    var c = m.getAttribute("data-cat");
    if (c === "more") { var d = $("#moreDrop"); d.style.display = d.style.display === "none" ? "flex" : "none"; return; }
    $("#moreDrop").style.display = "none";
    setCat(c);
  });
  $("#moreDrop").addEventListener("click", function (e) {
    var m = e.target.closest(".m-item"); if (!m) return;
    $("#moreDrop").style.display = "none";
    setCat(m.getAttribute("data-cat"));
  });
  document.addEventListener("click", function (e) {
    if (!e.target.closest("#moreBtn") && !e.target.closest("#moreDrop")) $("#moreDrop").style.display = "none";
  });
  $("#brandHome").addEventListener("click", function (e) { e.preventDefault(); setCat("all"); window.scrollTo({ top: 0, behavior: "smooth" }); });
  $("#heroShop").addEventListener("click", function () { setCat("all"); });
  $("#heroDeal").addEventListener("click", function () {
    state.sort = "asc"; $("#sortSel").value = "asc";
    setCat("all"); toast("已按价格从低到高排序，特惠先看 👀");
  });
  $("#searchInput").addEventListener("input", function (e) { state.q = e.target.value.trim(); renderGrid(); });
  $("#sortSel").addEventListener("change", function (e) { state.sort = e.target.value; renderGrid(); });

  /* ---------- 详情弹窗 ---------- */
  var detailId = null;
  function openDetail(id) {
    var p = null;
    STORE.products.forEach(function (x) { if (x.id === id) p = x; });
    if (!p) return;
    detailId = id;
    $("#dPic").innerHTML = pic(p);
    $("#dName").textContent = p.name;
    $("#dRate").textContent = "★ " + p.rating.toFixed(1) + " 分 · " + catName(p.cat);
    $("#dPrice").textContent = "¥" + p.price;
    $("#dOld").textContent = p.old ? "¥" + p.old : "";
    $("#dDesc").textContent = p.desc;
    $("#detailModal").classList.add("open");
  }
  function closeDetail() { $("#detailModal").classList.remove("open"); }
  $("#detailClose").addEventListener("click", closeDetail);
  $("#detailModal").addEventListener("click", function (e) { if (e.target === e.currentTarget) closeDetail(); });
  $("#dAdd").addEventListener("click", function () { if (detailId) { addCart(detailId); closeDetail(); } });

  /* ---------- 购物车 ---------- */
  function addCart(id) {
    state.cart[id] = (state.cart[id] || 0) + 1;
    save(); renderCart();
    var p = null; STORE.products.forEach(function (x) { if (x.id === id) p = x; });
    toast("已加入购物车：" + (p ? p.name : ""));
  }
  function setQty(id, n) {
    if (n <= 0) delete state.cart[id]; else state.cart[id] = n;
    save(); renderCart();
  }
  function renderCart() {
    var ids = Object.keys(state.cart), total = 0, n = 0;
    var html = "";
    ids.forEach(function (id) {
      var p = null; STORE.products.forEach(function (x) { if (x.id === +id) p = x; });
      if (!p) return;
      var q = state.cart[id];
      total += p.price * q; n += q;
      html += '<div class="ci"><div class="thumb">' + pic(p) + "</div>" +
        '<div class="mid"><b>' + p.name + '</b><span class="pp">' + p.price + "</span>" +
        '<div class="qty"><button data-dec="' + p.id + '">−</button><span>' + q + '</span><button data-inc="' + p.id + '">+</button></div></div>' +
        '<button class="rm" data-rm="' + p.id + '" aria-label="删除">✕</button></div>';
    });
    if (!ids.length) html = '<div class="cd-empty">购物车还是空的<br>去挑选心仪的家具吧 🛋️</div>';
    $("#cartList").innerHTML = html;
    $("#cartTotal").textContent = "¥" + total;
    $("#cartBadge").textContent = n;
    $("#cartBadge").style.display = n ? "flex" : "none";

    Array.prototype.forEach.call($("#cartList").querySelectorAll("[data-inc]"), function (b) {
      b.addEventListener("click", function () { var id = b.getAttribute("data-inc"); setQty(id, state.cart[id] + 1); });
    });
    Array.prototype.forEach.call($("#cartList").querySelectorAll("[data-dec]"), function (b) {
      b.addEventListener("click", function () { var id = b.getAttribute("data-dec"); setQty(id, state.cart[id] - 1); });
    });
    Array.prototype.forEach.call($("#cartList").querySelectorAll("[data-rm]"), function (b) {
      b.addEventListener("click", function () { setQty(b.getAttribute("data-rm"), 0); });
    });
  }
  function openCart() { $("#cartDrawer").classList.add("open"); $("#cartMask").classList.add("open"); }
  function closeCart() { $("#cartDrawer").classList.remove("open"); $("#cartMask").classList.remove("open"); }
  $("#cartBtn").addEventListener("click", openCart);
  $("#cartClose").addEventListener("click", closeCart);
  $("#cartMask").addEventListener("click", closeCart);
  $("#checkoutBtn").addEventListener("click", function () {
    var ids = Object.keys(state.cart);
    if (!ids.length) { toast("购物车是空的，先挑几件家具吧"); return; }
    state.cart = {}; save(); renderCart();
    toast("下单成功（演示）！感谢选购 🎉");
  });

  /* ---------- toast ---------- */
  var tt;
  function toast(msg) {
    var el = $("#toast"); el.textContent = msg; el.classList.add("show");
    clearTimeout(tt); tt = setTimeout(function () { el.classList.remove("show"); }, 1800);
  }

  renderCats(); renderGrid(); renderCart(); syncMenu();
})();