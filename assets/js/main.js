(function () {
  var root = document.documentElement;
  var toggleBtn = document.getElementById("theme-toggle");

  function applyToggleLabel() {
    var isDark = root.getAttribute("data-theme") === "dark";
    toggleBtn.textContent = isDark ? "☀ Light" : "● Dark";
  }

  if (toggleBtn) {
    applyToggleLabel();
    toggleBtn.addEventListener("click", function () {
      var isDark = root.getAttribute("data-theme") === "dark";
      if (isDark) {
        root.removeAttribute("data-theme");
        try { localStorage.setItem("theme", "light"); } catch (e) {}
      } else {
        root.setAttribute("data-theme", "dark");
        try { localStorage.setItem("theme", "dark"); } catch (e) {}
      }
      applyToggleLabel();
    });
  }
})();
