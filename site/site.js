/* The two small behaviours this page needs, and nothing else. */
(function () {
  document.addEventListener("click", function (ev) {
    var btn = ev.target.closest ? ev.target.closest("[data-copy]") : null;
    if (!btn) return;
    var block = btn.closest(".code");
    var code = block && block.querySelector("pre code");
    if (!code) return;
    var text = code.textContent;
    var done = function () {
      var was = btn.textContent;
      btn.textContent = "Copied";
      setTimeout(function () {
        btn.textContent = was;
      }, 1500);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, function () {});
    } else {
      var ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        done();
      } catch (e) {
        /* the reader can still select it by hand */
      }
      ta.remove();
    }
  });
  /* 🔴 THE COMPATIBILITY LIST REMEMBERS ITS OWN STATE. Stored where the cookie panel stores its
   * answer — localStorage, because this site sets no cookies at all — so "remembered like the
   * cookie settings" does not mean a cookie appears on a site that promises none. The element is a
   * native <details>, so with this script blocked it still opens and closes; all that is lost is
   * the memory. No stored value leaves it as authored (collapsed). */
  var COMPAT_KEY = "fmradio.compat";
  var box = document.querySelector("[data-compat]");
  if (box) {
    try {
      var saved = localStorage.getItem(COMPAT_KEY);
      if (saved === "open") box.open = true;
      else if (saved === "closed") box.open = false;
    } catch (e) {
      /* private mode, or storage denied: the list still works, it just forgets */
    }
    box.addEventListener("toggle", function () {
      try {
        localStorage.setItem(COMPAT_KEY, box.open ? "open" : "closed");
      } catch (e) {}
    });
  }
})();
