/* Les Douces Heures — script principal (vanilla JS, sans dépendance) */
(function () {
  "use strict";

  /* ---------- Navigation mobile ---------- */
  var toggle = document.querySelector(".nav-toggle");
  var links = document.querySelector(".nav-links");
  if (toggle && links) {
    toggle.addEventListener("click", function () {
      var isOpen = links.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });
    links.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        links.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ---------- Révélation au scroll ---------- */
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion && revealEls.length) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach(function (el) {
      io.observe(el);
    });
  } else {
    revealEls.forEach(function (el) {
      el.classList.add("is-visible");
    });
  }

  /* ---------- Jour courant surligné dans le tableau des horaires ---------- */
  var hoursTable = document.querySelector("table.hours");
  if (hoursTable) {
    var days = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
    var todayName = days[new Date().getDay()];
    var rows = hoursTable.querySelectorAll("tbody tr[data-day]");
    rows.forEach(function (row) {
      if (row.getAttribute("data-day") === todayName) {
        row.classList.add("today");
      }
    });
  }

  /* ---------- Filtres boutique (pages Cafés / Thés) ---------- */
  var chips = document.querySelectorAll(".chip[data-filter]");
  var cards = document.querySelectorAll(".product-card[data-cat]");
  if (chips.length && cards.length) {
    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        chips.forEach(function (c) {
          c.classList.remove("active");
          c.setAttribute("aria-pressed", "false");
        });
        chip.classList.add("active");
        chip.setAttribute("aria-pressed", "true");
        var filter = chip.getAttribute("data-filter");
        cards.forEach(function (card) {
          var show = filter === "tous" || card.getAttribute("data-cat") === filter;
          card.style.display = show ? "" : "none";
        });
      });
    });
  }

  /* ---------- Formulaire de contact (démo sans backend) ---------- */
  var form = document.querySelector("#contact-form");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var status = form.querySelector(".form-status");
      var name = form.querySelector("#cf-name").value.trim();
      if (status) {
        status.textContent =
          "Merci " + (name || "") + " ! Votre message est prêt : votre logiciel de messagerie va s'ouvrir pour l'envoyer directement au café.";
        status.hidden = false;
      }
      var subject = encodeURIComponent("Message depuis le site — Les Douces Heures");
      var body = encodeURIComponent(
        form.querySelector("#cf-message").value +
          "\n\n— " +
          name +
          " (" +
          form.querySelector("#cf-email").value +
          ")"
      );
      window.location.href = "mailto:contact@lesdouchesheures-barleduc.fr?subject=" + subject + "&body=" + body;
    });
  }

  /* ---------- Lien de nav actif selon la section visible (page d'accueil) ---------- */
  var sections = document.querySelectorAll("main section[id]");
  var navAnchors = document.querySelectorAll(".nav-links a[href^='#']");
  if (sections.length && navAnchors.length && "IntersectionObserver" in window) {
    var navIO = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            navAnchors.forEach(function (a) {
              a.classList.toggle("active", a.getAttribute("href") === "#" + entry.target.id);
            });
          }
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    sections.forEach(function (s) {
      navIO.observe(s);
    });
  }

  /* ---------- Menu PDF en mode livre ---------- */
  var menuBook = document.querySelector("[data-menu-book]");
  if (menuBook && window.pdfjsLib) {
    initMenuBook(menuBook);
  }

  function initMenuBook(book) {
    var pdfUrl = book.getAttribute("data-pdf") || "Menu.pdf";
    var prevBtn = book.querySelector("[data-menu-prev]");
    var nextBtn = book.querySelector("[data-menu-next]");
    var statusEl = book.querySelector("[data-menu-status]");
    var totalEl = book.querySelector("[data-menu-total]");
    var hintEl = book.querySelector("[data-menu-hint]");
    var errorEl = book.querySelector("[data-menu-error]");
    var leftCanvas = book.querySelector("[data-menu-left-canvas]");
    var rightCanvas = book.querySelector("[data-menu-right-canvas]");
    var flip = book.querySelector("[data-menu-flip]");
    var flipCanvas = book.querySelector("[data-menu-flip-canvas]");
    var pdfDoc = null;
    var totalPages = 0;
    var currentLeftPage = 1;
    var isBusy = false;
    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var resizeTimer = null;

    book.classList.add("is-loading");
    window.pdfjsLib.disableWorker = true;
    window.pdfjsLib.GlobalWorkerOptions.workerSrc =
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.6.347/pdf.worker.min.js";

    function maxLeftPage() {
      return totalPages > 1 ? totalPages - 1 : 1;
    }

    function clampLeftPage(page) {
      return Math.max(1, Math.min(page, maxLeftPage()));
    }

    function setBusy(busy) {
      isBusy = busy;
      if (prevBtn) {
        prevBtn.disabled = busy || currentLeftPage <= 1;
      }
      if (nextBtn) {
        nextBtn.disabled = busy || currentLeftPage >= maxLeftPage();
      }
    }

    function updateStatus() {
      var rightPage = Math.min(currentLeftPage + 1, totalPages);
      if (statusEl) {
        statusEl.textContent = totalPages
          ? "Page " + currentLeftPage + " - " + rightPage
          : "Chargement...";
      }
      if (totalEl) {
        totalEl.textContent = totalPages ? "sur " + totalPages + " pages" : "Menu.pdf";
      }
      if (hintEl) {
        hintEl.textContent = totalPages
          ? "Cliquez sur les fleches pour tourner le menu."
          : "Patientez une seconde, le menu se charge.";
      }
      setBusy(isBusy);
    }

    function setError(message) {
      if (errorEl) {
        errorEl.textContent = message;
        errorEl.hidden = false;
      }
      if (hintEl) {
        hintEl.hidden = true;
      }
      setBusy(true);
    }

    function paintPlaceholder(canvas, label) {
      if (!canvas) {
        return;
      }
      var ctx = canvas.getContext("2d");
      var width = 1200;
      var height = 1700;
      canvas.width = width;
      canvas.height = height;
      canvas.style.width = "100%";
      canvas.style.height = "100%";
      var gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, "#fbf7f0");
      gradient.addColorStop(1, "#efe3d3");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
      ctx.strokeStyle = "rgba(77, 52, 40, 0.08)";
      ctx.lineWidth = 28;
      ctx.strokeRect(22, 22, width - 44, height - 44);
      ctx.fillStyle = "#4d3428";
      ctx.font = "bold 62px Manrope, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(label || "Menu", width / 2, height / 2 - 30);
      ctx.font = "30px Manrope, sans-serif";
      ctx.fillStyle = "#69584b";
      ctx.fillText("Le PDF se charge", width / 2, height / 2 + 28);
    }

    function fitCanvasToPage(page, canvas) {
      var box = canvas.parentNode.getBoundingClientRect();
      var padding = 28;
      var pageView = page.getViewport({ scale: 1 });
      var availableWidth = Math.max(box.width - padding, 20);
      var availableHeight = Math.max(box.height - padding, 20);
      var scale = Math.min(availableWidth / pageView.width, availableHeight / pageView.height);
      var viewport = page.getViewport({ scale: scale });
      var dpr = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.floor(viewport.width * dpr));
      canvas.height = Math.max(1, Math.floor(viewport.height * dpr));
      canvas.style.width = Math.floor(viewport.width) + "px";
      canvas.style.height = Math.floor(viewport.height) + "px";
      return {
        viewport: viewport,
        transform: dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : null
      };
    }

    function renderPage(pageNumber, canvas) {
      if (!pdfDoc || !canvas) {
        return Promise.resolve();
      }
      if (pageNumber < 1 || pageNumber > totalPages) {
        paintPlaceholder(canvas, "Page vide");
        return Promise.resolve();
      }
      return pdfDoc.getPage(pageNumber).then(function (page) {
        if (pageNumber === 1) {
          var viewport = page.getViewport({ scale: 1 });
          var ratio = viewport.width / viewport.height;
          book.style.setProperty("--menu-page-ratio", ratio.toFixed(4));
        }
        var fit = fitCanvasToPage(page, canvas);
        var context = canvas.getContext("2d");
        context.clearRect(0, 0, canvas.width, canvas.height);
        return page
          .render({
            canvasContext: context,
            viewport: fit.viewport,
            transform: fit.transform
          })
          .promise;
      });
    }

    function renderSpread() {
      return Promise.all([
        renderPage(currentLeftPage, leftCanvas),
        renderPage(currentLeftPage + 1, rightCanvas)
      ]).then(function () {
        updateStatus();
      });
    }

    function prepareFlipCanvas(pageNumber) {
      return renderPage(pageNumber, flipCanvas);
    }

    function cleanupFlip() {
      if (flip) {
        flip.hidden = true;
        flip.classList.remove("is-next", "is-prev", "is-turning-next", "is-turning-prev");
        flip.style.transform = "";
      }
    }

    function finishTurn() {
      cleanupFlip();
      isBusy = false;
      updateStatus();
    }

    function animateTurn(direction) {
      if (!flip) {
        finishTurn();
        return;
      }
      flip.hidden = false;
      flip.classList.remove("is-next", "is-prev", "is-turning-next", "is-turning-prev");
      flip.offsetWidth; // force reflow so the transition restarts cleanly
      if (direction === "next") {
        flip.classList.add("is-next");
        flip.style.transform = "rotateY(0deg)";
        requestAnimationFrame(function () {
          flip.classList.add("is-turning-next");
        });
      } else {
        flip.classList.add("is-prev");
        flip.style.transform = "rotateY(0deg)";
        requestAnimationFrame(function () {
          flip.classList.add("is-turning-prev");
        });
      }

      var done = false;
      function endTurn() {
        if (done) {
          return;
        }
        done = true;
        finishTurn();
      }

      flip.addEventListener("transitionend", endTurn, { once: true });
      window.setTimeout(endTurn, 900);
    }

    function turn(direction) {
      if (!pdfDoc || isBusy) {
        return;
      }

      var oldLeftPage = currentLeftPage;
      var nextLeftPage = direction === "next" ? currentLeftPage + 1 : currentLeftPage - 1;
      nextLeftPage = clampLeftPage(nextLeftPage);
      if (nextLeftPage === currentLeftPage) {
        return;
      }

      var turningPage = direction === "next" ? oldLeftPage + 1 : oldLeftPage;
      isBusy = true;
      updateStatus();

      currentLeftPage = nextLeftPage;

      renderSpread()
        .then(function () {
          return prepareFlipCanvas(turningPage);
        })
        .then(function () {
          if (reduceMotion) {
            cleanupFlip();
            isBusy = false;
            updateStatus();
            return;
          }
          animateTurn(direction);
        })
        .catch(function () {
          cleanupFlip();
          isBusy = false;
          updateStatus();
        });
      setBusy(true);
    }

    function queueRerender() {
      if (!pdfDoc || isBusy) {
        return;
      }
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(function () {
        isBusy = true;
        updateStatus();
        renderSpread()
          .then(function () {
            isBusy = false;
            updateStatus();
          })
          .catch(function () {
            isBusy = false;
            updateStatus();
          });
      }, 120);
    }

    if (prevBtn) {
      prevBtn.addEventListener("click", function () {
        turn("prev");
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener("click", function () {
        turn("next");
      });
    }

    window.addEventListener("resize", queueRerender);

    setBusy(true);
    updateStatus();
    paintPlaceholder(leftCanvas, "Menu");
    paintPlaceholder(rightCanvas, "Menu");
    paintPlaceholder(flipCanvas, "Menu");

    pdfjsLib
      .getDocument({ url: pdfUrl })
      .promise.then(function (doc) {
        pdfDoc = doc;
        totalPages = doc.numPages;
        currentLeftPage = clampLeftPage(1);
        if (totalPages <= 1) {
          currentLeftPage = 1;
        }
        setBusy(true);
        renderSpread().then(function () {
          book.classList.add("is-ready");
          isBusy = false;
          updateStatus();
        });
      })
      .catch(function () {
        setError("Impossible de charger Menu.pdf.");
      });
  }
})();
