/* =========================================================
   D.S.I. Informatique, interactions
   ========================================================= */
(() => {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Animation d'entrée du hero ---------- */
  requestAnimationFrame(() => document.body.classList.add("loaded"));

  /* ---------- Header : se cache en descendant, revient en remontant ---------- */
  const header = document.getElementById("header");
  let lastY = window.scrollY;
  window.addEventListener("scroll", () => {
    const y = window.scrollY;
    const menuOpen = links.classList.contains("open");
    header.classList.toggle("hidden", !menuOpen && y > lastY && y > 200);
    lastY = y;
  }, { passive: true });

  /* ---------- Menu mobile ---------- */
  const burger = document.getElementById("burger");
  const links = document.getElementById("navLinks");
  const setMenu = (open) => {
    links.classList.toggle("open", open);
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");
  };
  burger.addEventListener("click", () => setMenu(!links.classList.contains("open")));
  links.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => setMenu(false)));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });

  /* ---------- Lien actif dans la navigation ---------- */
  const navAnchors = [...links.querySelectorAll("a")];
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navAnchors.forEach((a) => a.classList.toggle("active", a.hash === `#${entry.target.id}`));
    });
  }, { rootMargin: "-40% 0px -55% 0px" });
  ["accueil", "pc-sur-mesure", "depannage", "faq", "contact"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) spy.observe(el);
  });

  /* ---------- Apparition au scroll ---------- */
  const revealObs = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("in");
      obs.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -60px 0px" });
  const revealEls = [...document.querySelectorAll("[data-reveal]")];
  revealEls.forEach((el) => revealObs.observe(el));
  // Sécurité : après un saut de défilement (ancre, touche Fin), on révèle aussi ce qui est déjà dépassé
  window.addEventListener("scroll", () => {
    revealEls.forEach((el) => {
      if (!el.classList.contains("in") && el.getBoundingClientRect().top < innerHeight) {
        el.classList.add("in");
        revealObs.unobserve(el);
      }
    });
  }, { passive: true });

  /* ---------- Léger parallaxe sur les images ---------- */
  const parallax = [...document.querySelectorAll("[data-parallax]")];
  if (parallax.length && !reduceMotion) {
    let ticking = false;
    const update = () => {
      parallax.forEach((img) => {
        const r = img.parentElement.getBoundingClientRect();
        const progress = (r.top + r.height / 2 - innerHeight / 2) / innerHeight; // -1 → 1 environ
        img.style.transform = `translateY(${(-8 + progress * 8).toFixed(2)}%)`;
      });
      ticking = false;
    };
    window.addEventListener("scroll", () => {
      if (!ticking) { requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    update();
  }

  /* ---------- Ouvert / fermé (heure de Paris) ---------- */
  const live = document.getElementById("liveStatus");
  const dayIndex = { dim: 0, lun: 1, mar: 2, mer: 3, jeu: 4, ven: 5, sam: 6 };
  const updateStatus = () => {
    const parts = new Intl.DateTimeFormat("fr-FR", {
      timeZone: "Europe/Paris", weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
    }).formatToParts(new Date());
    const get = (t) => parts.find((p) => p.type === t).value;
    const day = dayIndex[get("weekday").replace(".", "").toLowerCase()];
    const mins = Number(get("hour")) * 60 + Number(get("minute"));
    const openDay = day >= 2 && day <= 6;
    const open = openDay && ((mins >= 480 && mins < 720) || (mins >= 840 && mins < 1080));

    live.className = `live ${open ? "open" : "closed"}`;
    live.querySelector("b").textContent = open ? "Ouvert" : "Fermé";

    document.querySelectorAll("#hours tr").forEach((tr) => {
      tr.classList.toggle("today", Number(tr.dataset.day) === day);
    });
  };
  updateStatus();
  setInterval(updateStatus, 60_000);

  /* ---------- Barre de progression des étapes de dépannage ---------- */
  const steps = document.getElementById("steps");
  if (steps) {
    const updateSteps = () => {
      const r = steps.getBoundingClientRect();
      const p = Math.min(Math.max((innerHeight * 0.8 - r.top) / (r.height + innerHeight * 0.3), 0), 1);
      steps.style.setProperty("--progress", p.toFixed(3));
    };
    window.addEventListener("scroll", () => requestAnimationFrame(updateSteps), { passive: true });
    updateSteps();
  }

  /* ---------- FAQ : une seule réponse ouverte à la fois ---------- */
  const faqItems = document.querySelectorAll(".faq details");
  faqItems.forEach((d) => d.addEventListener("toggle", () => {
    if (d.open) faqItems.forEach((o) => { if (o !== d) o.open = false; });
  }));

  /* ---------- Formulaire de contact ---------- */
  const form = document.getElementById("contactForm");
  const subject = document.getElementById("f-subject");
  const message = document.getElementById("f-message");
  const status = document.getElementById("formStatus");
  const EMAIL = "contact@dsi-beziers.fr";

  // Les boutons "Demander un devis", "Décrire ma panne"… pré-remplissent le formulaire
  document.querySelectorAll("[data-subject]").forEach((btn) => {
    btn.addEventListener("click", () => {
      subject.value = btn.dataset.subject;
      if (btn.dataset.message && !message.value.trim()) message.value = btn.dataset.message;
      setTimeout(() => document.getElementById("f-name").focus({ preventScroll: true }), 700);
    });
  });

  const validate = () => {
    let ok = true;
    form.querySelectorAll("[required]").forEach((el) => {
      const valid = el.type === "checkbox" ? el.checked : el.checkValidity() && el.value.trim() !== "";
      if (el.type === "checkbox") {
        form.querySelector(".field__error--consent").classList.toggle("show", !valid);
      } else {
        el.closest(".field").classList.toggle("invalid", !valid);
      }
      if (!valid && ok) { el.focus(); ok = false; }
    });
    return ok;
  };
  form.addEventListener("input", (e) => e.target.closest(".field")?.classList.remove("invalid"));
  form.addEventListener("change", (e) => {
    if (e.target.type === "checkbox") form.querySelector(".field__error--consent").classList.remove("show");
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    status.className = "form__status";
    if (!validate()) { status.textContent = "Merci de compléter les champs indiqués."; return; }

    const data = Object.fromEntries(new FormData(form));
    const body =
      `${data.message}\n\n— \n${data.name}\nE-mail : ${data.email}` +
      (data.phone ? `\nTéléphone : ${data.phone}` : "");

    // Si un service d'envoi est branché (ex. Formspree), indiquer son URL dans data-endpoint sur le <form>
    if (form.dataset.endpoint) {
      status.textContent = "Envoi en cours…";
      try {
        const res = await fetch(form.dataset.endpoint, {
          method: "POST",
          headers: { Accept: "application/json" },
          body: new FormData(form),
        });
        if (!res.ok) throw new Error(res.status);
        form.reset();
        status.textContent = "Merci, votre message a bien été envoyé. Nous vous répondons rapidement.";
        status.classList.add("ok");
      } catch {
        status.textContent = `L'envoi a échoué. Écrivez-nous directement à ${EMAIL} ou appelez le 04 67 76 34 80.`;
      }
      return;
    }

    // Sinon : ouverture de la messagerie du visiteur, message pré-rempli
    window.location.href =
      `mailto:${EMAIL}?subject=${encodeURIComponent(`[Site] ${data.subject} (${data.name})`)}&body=${encodeURIComponent(body)}`;
    status.textContent = "Votre messagerie s'ouvre avec le message prêt à envoyer.";
    status.classList.add("ok");
  });

  /* ---------- Plan Google Maps chargé seulement au clic ---------- */
  const loadMap = document.getElementById("loadMap");
  if (loadMap) {
    loadMap.addEventListener("click", () => {
      const iframe = document.createElement("iframe");
      iframe.title = "Plan d'accès : D.S.I. Informatique, 10 rue Olivette, Béziers";
      iframe.src = "https://www.google.com/maps?q=10+rue+Olivette,+34500+B%C3%A9ziers&z=16&output=embed";
      iframe.loading = "lazy";
      iframe.referrerPolicy = "no-referrer-when-downgrade";
      document.getElementById("map").replaceChildren(iframe);
    });
  }

  document.getElementById("year").textContent = new Date().getFullYear();
})();
