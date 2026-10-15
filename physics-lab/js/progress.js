// ===== 学习进度（模块入口，逻辑在 app.js 的 renderProgress） =====
// 该文件确保页面脚本依赖完整；如需扩展可在此添加图表等内容。
(function () {
  if (typeof renderProgress === "function" && document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      var v = document.getElementById("view-progress");
      if (v && v.classList.contains("active")) renderProgress();
    });
  }
})();