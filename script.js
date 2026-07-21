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
})();