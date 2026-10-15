/* PulseBoard – 无后端，仅做导航交互与渐进增强 */
(function () {
  "use strict";

  var toggle = document.getElementById("navToggle");
  var sidebar = document.getElementById("sidebar");

  if (toggle && sidebar) {
    toggle.addEventListener("click", function () {
      var open = sidebar.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "关闭导航菜单" : "打开导航菜单");
    });
  }

  var links = document.querySelectorAll(".nav-link");
  links.forEach(function (link) {
    link.addEventListener("click", function () {
      links.forEach(function (l) {
        l.classList.remove("is-active");
        l.removeAttribute("aria-current");
      });
      link.classList.add("is-active");
      link.setAttribute("aria-current", "page");
      if (sidebar) sidebar.classList.remove("is-open");
      if (toggle) {
        toggle.setAttribute("aria-expanded", "false");
        toggle.setAttribute("aria-label", "打开导航菜单");
      }
    });
  });

  document.addEventListener("DOMContentLoaded", function () {
    var overflow = document.documentElement.scrollWidth > document.documentElement.clientWidth;
    document.documentElement.dataset.hscroll = overflow ? "1" : "0";
  });
})();