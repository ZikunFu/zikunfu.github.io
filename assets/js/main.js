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

  var steps = document.querySelectorAll(".demo-step");
  var demoTimer;

  function runDemo(step) {
    clearTimeout(demoTimer);
    steps.forEach(function (el, i) {
      el.classList.toggle("is-active", i <= step);
    });
    if (step < steps.length - 1) {
      demoTimer = setTimeout(function () {
        runDemo(step + 1);
      }, 1100);
    }
  }

  var replayBtn = document.getElementById("demo-replay");
  if (replayBtn) {
    replayBtn.addEventListener("click", function () {
      runDemo(0);
    });
  }
  if (steps.length) runDemo(0);
})();
