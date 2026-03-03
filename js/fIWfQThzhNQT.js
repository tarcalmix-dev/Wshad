document.addEventListener("DOMContentLoaded", () => {


  const goWithUtm = (url) => {
    if (!url) return;
    const params = window.location.search;
    window.location.href = params
      ? (url.includes("?") ? url + "&" + params.substring(1) : url + params)
      : url;
  };

  /* =========================================================
     1) MENU / DRAWER
  ========================================================= */
  const menuBtn = document.getElementById("menuBtn");
  const drawer = document.getElementById("drawer");
  const backdrop = document.getElementById("drawerBackdrop");
  const closeBtn = document.getElementById("drawerClose");

  if (menuBtn && drawer) {
    const openDrawer = () => {
      drawer.classList.add("is-open");
      drawer.setAttribute("aria-hidden", "false");
      menuBtn.setAttribute("aria-expanded", "true");
      document.documentElement.style.overflow = "hidden";
    };

    const closeDrawer = () => {
      drawer.classList.remove("is-open");
      drawer.setAttribute("aria-hidden", "true");
      menuBtn.setAttribute("aria-expanded", "false");
      document.documentElement.style.overflow = "";
    };

    menuBtn.addEventListener("click", () => {
      drawer.classList.contains("is-open") ? closeDrawer() : openDrawer();
    });

    backdrop && backdrop.addEventListener("click", closeDrawer);
    closeBtn && closeBtn.addEventListener("click", closeDrawer);

    drawer.addEventListener("click", (e) => {
      if (e.target.closest(".drawer__link") || e.target.closest(".drawer__cta")) closeDrawer();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeDrawer();
    });
  }

  /* =========================================================
     2) BENEFÍCIOS (CARROSSEL + DOTS)
  ========================================================= */
  const benefitsTrack = document.getElementById("benefitsTrack");
  const benefitsDots = document.getElementById("benefitsDots");

  if (benefitsTrack && benefitsDots) {
    const slides = Array.from(benefitsTrack.querySelectorAll(".benefitCard"));
    const dots = Array.from(benefitsDots.querySelectorAll(".dot"));

    const setActiveDot = (i) => dots.forEach((d, idx) => d.classList.toggle("is-active", idx === i));

    dots.forEach((dot, i) => {
      dot.addEventListener("click", () => {
        slides[i].scrollIntoView({ behavior: "smooth", inline: "start" });
        setActiveDot(i);
      });
    });

    const io = new IntersectionObserver((entries) => {
      let best = { idx: 0, ratio: 0 };
      entries.forEach((e) => {
        if (e.isIntersecting) {
          const idx = Number(e.target.dataset.slide || 0);
          if (e.intersectionRatio > best.ratio) best = { idx, ratio: e.intersectionRatio };
        }
      });
      setActiveDot(best.idx);
    }, { root: benefitsTrack, threshold: [0.5, 0.7, 0.9] });

    slides.forEach((s) => io.observe(s));
  }

  /* =========================================================
     3) TRUST BAR AUTO SCROLL
  ========================================================= */
  const trustTrack = document.getElementById("trustTrack");
  const trustSection = document.querySelector(".trustbar");

  if (trustTrack && trustSection) {
    const pills = Array.from(trustTrack.querySelectorAll(".trustPill"));
    if (pills.length > 1) {
      let index = 0;
      let timer = null;
      let isVisible = false;

      const getStep = () => {
        const styles = getComputedStyle(trustTrack);
        const gap = parseFloat(styles.gap || styles.columnGap || 0) || 0;
        return pills[0].offsetWidth + gap;
      };

      const goTo = (i) => {
        index = (i + pills.length) % pills.length;
        trustTrack.scrollTo({ left: getStep() * index, behavior: "smooth" });
      };

      const stopAuto = () => { if (timer) clearInterval(timer); timer = null; };

      const startAuto = () => {
        stopAuto();
        if (!isVisible) return;
        if (window.matchMedia("(min-width: 920px)").matches) return;
        timer = setInterval(() => goTo(index + 1), 2400);
      };

      const io = new IntersectionObserver((entries) => {
        isVisible = entries[0].isIntersecting;
        isVisible ? startAuto() : stopAuto();
      }, { threshold: 0.35 });

      io.observe(trustSection);

      ["touchstart","pointerdown","wheel","mouseenter"].forEach(evt =>
        trustTrack.addEventListener(evt, stopAuto, { passive: true })
      );
      ["touchend","pointerup","mouseleave"].forEach(evt =>
        trustTrack.addEventListener(evt, startAuto, { passive: true })
      );

      window.addEventListener("resize", () => {
        index = 0;
        trustTrack.scrollTo({ left: 0, behavior: "auto" });
        startAuto();
      });
    }
  }

 /* =========================
   GALERIA CTA (PG) — compatível com seu HTML
   Usa: #pgMainImg, #pgThumbs, .pg__thumb img
========================= */
(function initPGallery(){
  const main = document.getElementById("pgMainImg");
  const thumbsWrap = document.getElementById("pgThumbs");
  if (!main || !thumbsWrap) return;

  const thumbs = Array.from(thumbsWrap.querySelectorAll(".pg__thumb"));

  // abre na Foto 1
  const firstSrc = thumbs[0]?.querySelector("img")?.getAttribute("src");
  if (firstSrc) {
    main.src = firstSrc;
    thumbs.forEach(t => t.classList.remove("is-active"));
    thumbs[0].classList.add("is-active");
  }

  thumbsWrap.addEventListener("click", (e) => {
    const btn = e.target.closest(".pg__thumb");
    if (!btn) return;

    const src = btn.querySelector("img")?.getAttribute("src");
    if (!src) return;

    // micro animação
    main.style.opacity = "0.35";
    requestAnimationFrame(() => {
      main.src = src;
      main.onload = () => (main.style.opacity = "1");
    });

    thumbs.forEach(t => t.classList.remove("is-active"));
    btn.classList.add("is-active");
  });

  main.addEventListener("error", () => {
    console.error("❌ Imagem principal não carregou:", main.src);
  });
})();


/* =========================
   PAINEL NOVO (carro/caminhão) + cores
   Usa: #carType, #carBrand, #carModel, #carYear,
        #colorButtons, #selectedColor, #colorSelectedText, #resultado
========================= */
(function initVehiclePanel(){
  const root = document.getElementById("widget-macena");
  if (!root) return;

  // SELECTS
  const typeSel  = root.querySelector("#carType");
  const brandSel = root.querySelector("#carBrand");
  const modelSel = root.querySelector("#carModel");
  const yearSel  = root.querySelector("#carYear");

  // CORES
  const colorWrap = root.querySelector("#colorButtons");
  const colorText = root.querySelector("#colorSelectedText");
  const colorHidden = root.querySelector("#selectedColor");
  const resultBox = root.querySelector("#resultado");

  // estado
  const state = { tipo:"", marca:"", modelo:"", ano:"", cor:"" };

  // ✅ TROQUE PELOS SEUS DADOS REAIS (posso colar completo depois)
 const dadosCarros = {
    "Fiat": { "Uno Vivace": {inicio:2010, fim:2016}, "Grande Panda (Híbrido)": {inicio:2025, fim:null}, "147 (Hatch)": {inicio:1976, fim:1987}, "147 Pick-Up": {inicio:1980, fim:1995}, "Oggi (Sedan do 147)": {inicio:1983, fim:1985}, "Panorama (Perua do 147)": {inicio:1980, fim:1986}, "Uno (Hatch)": {inicio:1984, fim:2021}, "Uno Mille": {inicio:1990, fim:2013}, "Uno Furgão": {inicio:1988, fim:2013}, "Prêmio (Sedan)": {inicio:1985, fim:1996}, "Duna (Sedan Argentina)": {inicio:1987, fim:1996}, "Elba (Perua)": {inicio:1986, fim:1996}, "Tempra (Sedan)": {inicio:1990, fim:1999}, "Tempra SW (Perua)": {inicio:1994, fim:1997}, "Tipo (Hatch)": {inicio:1988, fim:1995}, "Marea (Sedan)": {inicio:1996, fim:2007}, "Marea Weekend (Perua)": {inicio:1998, fim:2007}, "Brava (Hatch)": {inicio:1999, fim:2003}, "Bravo (Hatch)": {inicio:2010, fim:2016}, "Stilo (Hatch)": {inicio:2002, fim:2010}, "Palio (Hatch)": {inicio:1996, fim:2018}, "Palio Weekend (Perua)": {inicio:1997, fim:2018}, "Palio Weekend Adventure (Perua)": {inicio:1999, fim:2018}, "Siena (Sedan)": {inicio:1997, fim:2017}, "Grand Siena (Sedan)": {inicio:2012, fim:2021}, "Strada Cabine Simples": {inicio:1998, fim:null}, "Strada Cabine Estendida": {inicio:1999, fim:2013}, "Strada Cabine Dupla 2 Portas": {inicio:2010, fim:2020}, "Strada Cabine Dupla 3 Portas": {inicio:2014, fim:2020}, "Strada Nova Cabine Plus (CS)": {inicio:2020, fim:null}, "Strada Nova Cabine Dupla (CD)": {inicio:2020, fim:null}, "Fiorino (Furgão/Picape - Antiga)": {inicio:1980, fim:2013}, "Fiorino (Furgão - Nova Geração)": {inicio:2013, fim:null}, "Idea (Minivan)": {inicio:2003, fim:2016}, "Punto (Hatch)": {inicio:2005, fim:2018}, "Linea (Sedan)": {inicio:2007, fim:2017}, "500 (Hatch)": {inicio:2007, fim:null}, "500e (Elétrico)": {inicio:2020, fim:null}, "Toro (Picape)": {inicio:2016, fim:null}, "Titano (Picape)": {inicio:2024, fim:null}, "Argo (Hatch)": {inicio:2017, fim:null}, "Cronos (Sedan)": {inicio:2018, fim:null}, "Pulse (SUV)": {inicio:2021, fim:null}, "Pulse Abarth (Esportivo)": {inicio:2022, fim:null}, "Fastback (SUV Coupé)": {inicio:2022, fim:null}, "Fastback Abarth (Esportivo)": {inicio:2023, fim:null}, "Mobi (Subcompacto)": {inicio:2016, fim:null}, "Doblo Passageiro": {inicio:2001, fim:2021}, "Doblo Cargo (Furgão)": {inicio:2002, fim:2021}, "Freemont (SUV)": {inicio:2011, fim:2016} },
    "Volkswagen": { "Terra (Novo SUV)": {inicio:2025, fim:null}, "Fusca (Clássico)": {inicio:1938, fim:1986}, "Fusca (Itamar)": {inicio:1993, fim:1996}, "Brasília": {inicio:1973, fim:1982}, "Variant I": {inicio:1969, fim:1977}, "Variant II": {inicio:1977, fim:1981}, "TL": {inicio:1970, fim:1976}, "SP2 (Esportivo)": {inicio:1972, fim:1976}, "Karmann Ghia": {inicio:1962, fim:1975}, "New Beetle": {inicio:1997, fim:2011}, "Fusca (A5/The Beetle)": {inicio:2011, fim:2019}, "Kombi (Perua/Furgão)": {inicio:1950, fim:2013}, "Gol (Hatch - G1 a G8)": {inicio:1980, fim:2022}, "Voyage (Sedan)": {inicio:1981, fim:null}, "Parati (Perua)": {inicio:1982, fim:2012}, "Saveiro Cabine Simples": {inicio:1982, fim:null}, "Saveiro Cabine Estendida": {inicio:1999, fim:2014}, "Saveiro Cabine Dupla": {inicio:2014, fim:null}, "Apollo": {inicio:1990, fim:1992}, "Logus": {inicio:1993, fim:1997}, "Pointer": {inicio:1993, fim:1996}, "Santana (Sedan)": {inicio:1984, fim:2006}, "Quantum (Perua)": {inicio:1985, fim:2003}, "Passat (Sedan/Perua - Antigo)": {inicio:1973, fim:1988}, "Passat (Sedan - Importado)": {inicio:1994, fim:null}, "Polo (Hatch)": {inicio:2002, fim:null}, "Polo Sedan": {inicio:2002, fim:2014}, "Polo GTS (Esportivo)": {inicio:2020, fim:null}, "Polo Track (Entrada)": {inicio:2023, fim:null}, "Virtus (Sedan)": {inicio:2017, fim:null}, "Fox (Hatch)": {inicio:2003, fim:2021}, "CrossFox (Aventureiro)": {inicio:2005, fim:2021}, "SpaceFox / Space Cross (Perua)": {inicio:2006, fim:2019}, "Up! (Subcompacto)": {inicio:2014, fim:2021}, "Golf (Hatch)": {inicio:1994, fim:2020}, "Bora (Sedan)": {inicio:2000, fim:2011}, "Jetta (Sedan)": {inicio:1981, fim:null}, "Jetta Variant (Perua)": {inicio:2008, fim:2014}, "T-Cross (SUV Compacto)": {inicio:2018, fim:null}, "Nivus (SUV Coupé)": {inicio:2020, fim:null}, "Nivus GTS": {inicio:2025, fim:null}, "Taos (SUV Médio)": {inicio:2021, fim:null}, "Tiguan (SUV - Geração 1)": {inicio:2007, fim:2018}, "Tiguan Allspace (SUV - 7 Lugares)": {inicio:2017, fim:null}, "Touareg (SUV Grande)": {inicio:2002, fim:2017}, "Amarok Cabine Simples": {inicio:2010, fim:null}, "Amarok Cabine Dupla": {inicio:2010, fim:null}, "ID.3 (Elétrico Hatch)": {inicio:2019, fim:null}, "ID.4 (Elétrico SUV)": {inicio:2020, fim:null}, "ID.Buzz (Kombi Elétrica)": {inicio:2022, fim:null} },
    "Chevrolet": { "Meriva (Minivan)": {inicio:2002, fim:2012}, "Blazer EV": {inicio:2025, fim:null}, "Equinox EV": {inicio:2025, fim:null}, "Opala (Sedan/Coupé)": {inicio:1968, fim:1992}, "Caravan (Perua)": {inicio:1975, fim:1992}, "Chevette (Sedan/Hatch)": {inicio:1973, fim:1994}, "Marajó (Perua)": {inicio:1981, fim:1989}, "Chevy 500 (Picape)": {inicio:1983, fim:1995}, "C-10 / C-14": {inicio:1964, fim:1984}, "Veraneio (SUV)": {inicio:1964, fim:1994}, "Bonanza (SUV)": {inicio:1989, fim:1994}, "D20 (Picape)": {inicio:1985, fim:1997}, "Silverado (Antiga)": {inicio:1997, fim:2001}, "Nova Silverado (V8)": {inicio:2023, fim:null}, "Monza (Sedan/Hatch)": {inicio:1982, fim:1996}, "Kadett (Hatch)": {inicio:1989, fim:1998}, "Ipanema (Perua)": {inicio:1989, fim:1997}, "Omega (Sedan/Perua)": {inicio:1992, fim:1998}, "Suprema (Perua)": {inicio:1993, fim:1996}, "Corsa Hatch (Geração 1)": {inicio:1994, fim:2002}, "Corsa Sedan (Geração 1)": {inicio:1996, fim:2001}, "Corsa Wagon (Perua)": {inicio:1997, fim:2001}, "Corsa Hatch (Geração 2 - Novo Corsa)": {inicio:2002, fim:2012}, "Corsa Sedan (Geração 2 - Classic)": {inicio:2002, fim:2016}, "Corsa Pickup": {inicio:1995, fim:2003}, "Tigra (Coupé)": {inicio:1998, fim:1999}, "Vectra (Geração 1, 2 e 3)": {inicio:1993, fim:2011}, "Vectra GT (Hatch)": {inicio:2007, fim:2011}, "Astra Hatch": {inicio:1998, fim:2011}, "Astra Sedan": {inicio:1999, fim:2011}, "Celta (Hatch)": {inicio:2000, fim:2015}, "Prisma (Sedan - 1ª Geração Celta)": {inicio:2006, fim:2012}, "Onix (Hatch - 1ª Geração)": {inicio:2012, fim:2019}, "Onix Plus (Sedan - 2ª Geração)": {inicio:2019, fim:null}, "Onix Hatch (2ª Geração)": {inicio:2019, fim:null}, "Cobalt (Sedan)": {inicio:2011, fim:2020}, "Agile (Hatch)": {inicio:2009, fim:2014}, "Montana (Picape Compacta - Geração 1)": {inicio:2003, fim:2010}, "Montana (Picape Compacta - Geração 2)": {inicio:2011, fim:2021}, "Nova Montana (Picape Média/Compacta)": {inicio:2023, fim:null}, "Spin (Minivan)": {inicio:2012, fim:null}, "Cruze (Sedan)": {inicio:2011, fim:null}, "Cruze Sport6 (Hatch)": {inicio:2012, fim:null}, "Tracker (SUV)": {inicio:2013, fim:null}, "Equinox (SUV Médio)": {inicio:2017, fim:null}, "S10 Cabine Simples": {inicio:1995, fim:null}, "S10 Cabine Dupla": {inicio:1995, fim:null}, "Blazer (SUV - Base S10 Geração 1)": {inicio:1995, fim:2011}, "Trailblazer (SUV - Base S10 Geração 2)": {inicio:2012, fim:null}, "Captiva (SUV)": {inicio:2008, fim:2017}, "Camaro (Esportivo)": {inicio:2010, fim:null}, "Bolt (Elétrico)": {inicio:2017, fim:null} },
    "Ford": { "Galaxie / Landau": {inicio:1967, fim:1983}, "Maverick (Antigo V8/4cil)": {inicio:1973, fim:1979}, "Corcel (Sedan/Coupé)": {inicio:1968, fim:1986}, "Corcel II (Sedan/Coupé)": {inicio:1977, fim:1986}, "Belina (Perua)": {inicio:1970, fim:1991}, "Del Rey (Sedan)": {inicio:1981, fim:1991}, "Pampa (Picape)": {inicio:1982, fim:1997}, "F-100": {inicio:1957, fim:1986}, "F-1000 (Picape)": {inicio:1979, fim:1998}, "F-250 (Picape)": {inicio:1998, fim:2011}, "F-150 (Nova Geração)": {inicio:2023, fim:null}, "Escort (Hatch/Perua)": {inicio:1983, fim:2003}, "Escort Hobby": {inicio:1993, fim:1996}, "Verona (Sedan/Coupé - Base Escort)": {inicio:1989, fim:1996}, "Versailles (Sedan - Base Santana)": {inicio:1991, fim:1996}, "Royale (Perua - Base Quantum)": {inicio:1992, fim:1996}, "Ka (Hatch Compacto - Geração 1)": {inicio:1996, fim:2013}, "Ka (Hatch Compacto - Geração 2)": {inicio:2008, fim:2013}, "Ka (Hatch Compacto - Geração 3)": {inicio:2014, fim:2021}, "Ka Sedan (Geração 3)": {inicio:2014, fim:2021}, "Fiesta (Hatch - Importado/Street)": {inicio:1994, fim:2006}, "Fiesta (Hatch - Rocam)": {inicio:2002, fim:2014}, "Fiesta (New Fiesta)": {inicio:2011, fim:2019}, "Fiesta Sedan": {inicio:1999, fim:2019}, "Courier (Picape)": {inicio:1997, fim:2013}, "Ecosport (SUV Compacto - Geração 1)": {inicio:2003, fim:2012}, "Ecosport (SUV Compacto - Geração 2)": {inicio:2012, fim:2021}, "Focus Hatch": {inicio:1998, fim:2019}, "Focus Sedan": {inicio:2000, fim:2019}, "Fusion (Sedan Médio/Grande)": {inicio:2006, fim:2020}, "Edge (SUV)": {inicio:2008, fim:2020}, "Mondeo (Sedan/Perua)": {inicio:1993, fim:2006}, "Ranger Cabine Simples": {inicio:1994, fim:null}, "Ranger Cabine Estendida": {inicio:1994, fim:2012}, "Ranger Cabine Dupla": {inicio:1997, fim:null}, "Territory (SUV Médio)": {inicio:2019, fim:null}, "Bronco Sport (SUV Off-Road)": {inicio:2020, fim:null}, "Maverick (Picape Compacta/Média)": {inicio:2021, fim:null}, "Mustang (Esportivo Coupé/Conversível)": {inicio:2017, fim:null}, "Mustang Mach-E (Elétrico SUV)": {inicio:2020, fim:null} },
    "BMW": { "iX1 (Elétrico SUV)": {inicio:2023, fim:null}, "Série 1 (Hatch)": {inicio:2004, fim:null}, "Série 2 (Coupé/Gran Coupé)": {inicio:2013, fim:null}, "Série 3 (Sedan/Perua)": {inicio:1975, fim:null}, "Série 4 (Coupé/Conversível)": {inicio:2013, fim:null}, "Série 5 (Sedan/Perua)": {inicio:1972, fim:null}, "Série 7 (Sedan Luxo)": {inicio:1977, fim:null}, "X1 (SUV Compacto)": {inicio:2009, fim:null}, "X2 (SUV Compacto)": {inicio:2018, fim:null}, "X3 (SUV Médio)": {inicio:2003, fim:null}, "X4 (SUV Coupé)": {inicio:2014, fim:null}, "X5 (SUV Grande)": {inicio:1999, fim:null}, "X6 (SUV Coupé Grande)": {inicio:2008, fim:null}, "Z4 (Roadster)": {inicio:2002, fim:null}, "M3 (Esportivo)": {inicio:1986, fim:null}, "M4 (Esportivo)": {inicio:2014, fim:null}, "i3 (Elétrico/Híbrido)": {inicio:2013, fim:2022}, "i4 (Elétrico Gran Coupé)": {inicio:2021, fim:null}, "iX (Elétrico SUV)": {inicio:2021, fim:null}, "iX1 (Elétrico SUV)": {inicio:2023, fim:null} },
    "Audi": { "Q6 e-tron": {inicio:2025, fim:null}, "A1 (Hatch)": {inicio:2010, fim:2022}, "A3 Sportback (Hatch)": {inicio:1996, fim:null}, "A3 Sedan": {inicio:2013, fim:null}, "A4 (Sedan/Perua)": {inicio:1994, fim:null}, "A5 (Coupé/Sportback)": {inicio:2007, fim:null}, "A6 (Sedan/Perua)": {inicio:1994, fim:null}, "A7 Sportback (Coupé 4 Portas)": {inicio:2010, fim:null}, "A8 (Sedan Luxo)": {inicio:1994, fim:null}, "Q3 (SUV Compacto)": {inicio:2011, fim:null}, "Q5 (SUV Médio)": {inicio:2008, fim:null}, "Q7 (SUV Grande 7 Lugares)": {inicio:2005, fim:null}, "Q8 (SUV Coupé Grande)": {inicio:2018, fim:null}, "TT (Coupé/Roadster)": {inicio:1998, fim:2023}, "R8 (Esportivo)": {inicio:2006, fim:null}, "E-Tron (Elétrico SUV)": {inicio:2018, fim:null}, "Q4 e-tron": {inicio:2021, fim:null} },
    "Mercedes-Benz": { "Classe A (Hatch/Sedan)": {inicio:1997, fim:null}, "Classe C (Sedan/Coupé/Perua)": {inicio:1993, fim:null}, "Classe E (Sedan/Coupé/Perua)": {inicio:1953, fim:null}, "Classe S (Sedan Luxo)": {inicio:1972, fim:null}, "CLA (Coupé 4 Portas)": {inicio:2013, fim:null}, "GLA (SUV Compacto)": {inicio:2013, fim:null}, "GLB (SUV 7 Lugares)": {inicio:2019, fim:null}, "GLC (SUV Médio)": {inicio:2015, fim:null}, "GLE (SUV Grande)": {inicio:1997, fim:null}, "GLS (SUV Luxo 7 Lugares)": {inicio:2006, fim:null}, "Classe G (Jipe Off-Road)": {inicio:1979, fim:null}, "AMG GT (Esportivo)": {inicio:2014, fim:null}, "Sprinter (Van/Furgão)": {inicio:1995, fim:null}, "EQA (Elétrico SUV Compacto)": {inicio:2021, fim:null}, "EQB (Elétrico SUV 7 Lugares)": {inicio:2021, fim:null}, "EQC (Elétrico SUV Médio)": {inicio:2019, fim:null}, "EQE (Sedan Elétrico)": {inicio:2022, fim:null}, "EQS (Sedan Luxo Elétrico)": {inicio:2021, fim:null} },
    "Volvo": { "EX90 (Elétrico SUV Grande)": {inicio:2024, fim:null}, "EX30 (Elétrico SUV Subcompacto)": {inicio:2023, fim:null}, "C30 (Hatch Coupé)": {inicio:2006, fim:2013}, "S60 (Sedan)": {inicio:2000, fim:null}, "S90 (Sedan Luxo)": {inicio:2016, fim:null}, "V40 (Hatch)": {inicio:2012, fim:2019}, "V60 (Perua)": {inicio:2010, fim:null}, "XC40 (SUV Compacto)": {inicio:2017, fim:null}, "XC40 Recharge (Elétrico/Híbrido)": {inicio:2020, fim:null}, "C40 (SUV Coupé Elétrico)": {inicio:2021, fim:null}, "XC60 (SUV Médio)": {inicio:2008, fim:null}, "XC90 (SUV Grande 7 Lugares)": {inicio:2002, fim:null} },
    "Land Rover": { "Defender (Jipe Off-Road - Antigo)": {inicio:1983, fim:2016}, "Defender (SUV - Novo)": {inicio:2020, fim:null}, "Discovery (SUV Grande)": {inicio:1989, fim:null}, "Discovery Sport (SUV Médio)": {inicio:2014, fim:null}, "Freelander (SUV)": {inicio:1997, fim:2015}, "Range Rover Evoque (SUV Compacto)": {inicio:2011, fim:null}, "Range Rover Velar (SUV Coupé)": {inicio:2017, fim:null}, "Range Rover Sport (SUV Esportivo)": {inicio:2005, fim:null}, "Range Rover (SUV Luxo)": {inicio:1970, fim:null} },
    "Porsche": { "Macan EV (Elétrico)": {inicio:2025, fim:null}, "911 (Coupé/Conversível)": {inicio:1963, fim:null}, "Boxster/718 Boxster (Roadster)": {inicio:1996, fim:null}, "Cayman/718 Cayman (Coupé)": {inicio:2005, fim:null}, "Panamera (Sedan Coupé 4 Portas)": {inicio:2009, fim:null}, "Cayenne (SUV Grande)": {inicio:2002, fim:null}, "Macan (SUV Compacto)": {inicio:2014, fim:null}, "Taycan (Sedan Elétrico)": {inicio:2019, fim:null} },
    "Lexus": { "RZ 450e (Elétrico)": {inicio:2024, fim:null}, "CT 200h (Hatch Híbrido)": {inicio:2011, fim:2022}, "IS (Sedan)": {inicio:1998, fim:null}, "ES (Sedan Luxo)": {inicio:1989, fim:null}, "UX (SUV Compacto/Híbrido)": {inicio:2018, fim:null}, "NX (SUV Médio/Híbrido)": {inicio:2014, fim:null}, "RX (SUV Grande/Híbrido)": {inicio:1998, fim:null} },
    "Mini": { "Cooper (Nova Geração)": {inicio:2025, fim:null}, "Countryman (Nova Geração)": {inicio:2025, fim:null}, "Cooper (Hatch 3 Portas)": {inicio:2001, fim:2024}, "Cooper S (Hatch Esportivo)": {inicio:2001, fim:2024}, "Cooper E/SE (Elétrico)": {inicio:2020, fim:null}, "Countryman (SUV Compacto)": {inicio:2010, fim:2024}, "Clubman (Perua Compacta)": {inicio:2007, fim:null}, "Paceman": {inicio:2012, fim:2016} },
    "GWM (Great Wall)": { "Tank 300 (Jipe)": {inicio:2025, fim:null}, "Haval H6 (SUV Híbrido/PHEV)": {inicio:2023, fim:null}, "Haval H6 GT (SUV Coupé Híbrido)": {inicio:2023, fim:null}, "Ora 03 (Hatch Elétrico)": {inicio:2023, fim:null}, "Poer (Picape)": {inicio:2024, fim:null} },
    "JAC Motors": { "Hunter (Picape)": {inicio:2024, fim:null}, "J2 (Subcompacto)": {inicio:2012, fim:2016}, "J3 (Hatch)": {inicio:2011, fim:2015}, "J3 Turin (Sedan)": {inicio:2011, fim:2015}, "J5 (Sedan)": {inicio:2011, fim:2016}, "J6 (Minivan)": {inicio:2011, fim:2016}, "T40/E-JS4 (SUV Compacto)": {inicio:2016, fim:null}, "T50/iEV40 (SUV Médio)": {inicio:2018, fim:null}, "T60/T80 (SUV Grande)": {inicio:2019, fim:null}, "E-JS1 (Hatch Elétrico)": {inicio:2021, fim:null}, "V260 (Caminhão Leve)": {inicio:2017, fim:null} },
    "Toyota": { "Yaris Cross (SUV Compacto)": {inicio:2025, fim:null}, "Yaris Cross Hybrid": {inicio:2025, fim:null}, "Corolla (Sedan - Geração 1 em diante)": {inicio:1966, fim:null}, "Corolla Fielder (Perua)": {inicio:2004, fim:2008}, "Corolla Hybrid (Sedan)": {inicio:2019, fim:null}, "Corolla Cross (SUV)": {inicio:2020, fim:null}, "Corolla Cross Hybrid (SUV)": {inicio:2020, fim:null}, "GR Corolla (Hatch Esportivo)": {inicio:2022, fim:null}, "GR Yaris (Esportivo)": {inicio:2021, fim:null}, "Etios Hatch": {inicio:2010, fim:2021}, "Etios Sedan": {inicio:2012, fim:2021}, "Yaris Hatch": {inicio:2018, fim:null}, "Yaris Sedan": {inicio:2018, fim:null}, "Hilux Cabine Simples": {inicio:1968, fim:null}, "Hilux Cabine Dupla": {inicio:1968, fim:null}, "Bandeirante (Jipe/Picape)": {inicio:1962, fim:2001}, "SW4 (SUV - Base Hilux)": {inicio:1984, fim:null}, "RAV4 (SUV Compacto)": {inicio:1994, fim:null}, "RAV4 Hybrid (SUV Compacto)": {inicio:2019, fim:null}, "Camry (Sedan Grande)": {inicio:1982, fim:null}, "Prius (Híbrido)": {inicio:1997, fim:2022}, "Mirai (Hidrogênio)": {inicio:2014, fim:null} },
    "Hyundai": { "Palisade (SUV Grande)": {inicio:2024, fim:null}, "Ioniq 5": {inicio:2024, fim:null}, "HB20 (Hatch)": {inicio:2012, fim:null}, "HB20S (Sedan)": {inicio:2013, fim:null}, "HB20X (Aventureiro)": {inicio:2013, fim:2021}, "Creta (SUV Compacto)": {inicio:2016, fim:null}, "Creta N Line (Esportivo)": {inicio:2022, fim:null}, "Tucson (SUV Compacto - Geração 1)": {inicio:2004, fim:null}, "Ix35 (SUV Compacto - Geração 2)": {inicio:2010, fim:null}, "New Tucson (SUV Compacto - Geração 3)": {inicio:2015, fim:null}, "Santa Fe (SUV Médio)": {inicio:2000, fim:null}, "Vera Cruz (SUV Grande)": {inicio:2007, fim:2012}, "Elantra (Sedan)": {inicio:1990, fim:null}, "Azera (Sedan Grande)": {inicio:1996, fim:2018}, "Sonata (Sedan)": {inicio:1985, fim:null}, "Veloster (Hatch 3 Portas)": {inicio:2011, fim:2018}, "i30 (Hatch)": {inicio:2007, fim:2017}, "HR (Caminhonete)": {inicio:2005, fim:null}, "Kona (SUV Compacto)": {inicio:2017, fim:null}, "Ioniq (Híbrido/Elétrico)": {inicio:2016, fim:null} },
    "Honda": { "WR-V (Nova Geração)": {inicio:2025, fim:null}, "Civic (Sedan/Hatch - Geração 1 em diante)": {inicio:1972, fim:null}, "Civic Si (Esportivo)": {inicio:2007, fim:null}, "Civic Type R (Esportivo)": {inicio:2023, fim:null}, "Accord (Sedan)": {inicio:1976, fim:null}, "Fit (Minivan Compacta)": {inicio:2001, fim:2021}, "City Hatch": {inicio:2021, fim:null}, "City Sedan": {inicio:2009, fim:null}, "HR-V (SUV Compacto)": {inicio:2015, fim:null}, "ZR-V (SUV Médio)": {inicio:2023, fim:null}, "CR-V (SUV Médio)": {inicio:1995, fim:null}, "Pilot (SUV Grande 7 Lugares)": {inicio:2002, fim:null} },
    "Nissan": { "Kicks (Nova Geração)": {inicio:2025, fim:null}, "March (Hatch)": {inicio:2010, fim:2020}, "Versa (Sedan - 1ª Geração)": {inicio:2011, fim:2020}, "Novo Versa (Sedan - 2ª Geração)": {inicio:2020, fim:null}, "Sentra (Sedan)": {inicio:1982, fim:null}, "Tiida (Hatch)": {inicio:2007, fim:2013}, "Altima (Sedan)": {inicio:1992, fim:null}, "Kicks (SUV Compacto)": {inicio:2016, fim:null}, "Frontier Cabine Simples": {inicio:1997, fim:2010}, "Frontier Cabine Dupla": {inicio:1997, fim:null}, "X-Trail (SUV Médio)": {inicio:2000, fim:null}, "Livina (Minivan)": {inicio:2009, fim:2014}, "Grand Livina (Minivan 7 Lug)": {inicio:2009, fim:2014}, "Leaf (Elétrico)": {inicio:2010, fim:null} },
    "Renault": { "Kardian (SUV Compacto)": {inicio:2024, fim:null}, "Megane E-Tech (Elétrico)": {inicio:2022, fim:null}, "Clio (Hatch)": {inicio:1990, fim:2016}, "Clio Sedan": {inicio:2000, fim:2009}, "Logan (Sedan)": {inicio:2004, fim:null}, "Sandero (Hatch)": {inicio:2007, fim:null}, "Sandero Stepway (Aventureiro)": {inicio:2008, fim:null}, "Sandero RS (Esportivo)": {inicio:2015, fim:2021}, "Duster (SUV Compacto)": {inicio:2010, fim:null}, "Duster Oroch (Picape)": {inicio:2015, fim:null}, "Megane (Sedan/Hatch/Perua)": {inicio:1995, fim:2010}, "Fluence (Sedan)": {inicio:2011, fim:2018}, "Kwid (Subcompacto)": {inicio:2015, fim:null}, "Captur (SUV Compacto)": {inicio:2016, fim:2023}, "Koleos (SUV Médio)": {inicio:2007, fim:null}, "Kangoo (Furgão/Passageiro)": {inicio:1997, fim:null}, "Master (Furgão/Van)": {inicio:1997, fim:null}, "Zoe (Elétrico)": {inicio:2012, fim:null} },
    "Jeep": { "Avenger (SUV Compacto)": {inicio:2025, fim:null}, "Renegade (SUV Compacto)": {inicio:2014, fim:null}, "Compass (SUV Médio)": {inicio:2006, fim:null}, "Commander (SUV 7 Lugares)": {inicio:2021, fim:null}, "Wrangler (Jipe)": {inicio:1986, fim:null}, "Cherokee (SUV)": {inicio:1974, fim:null}, "Grand Cherokee (SUV Grande)": {inicio:1992, fim:null}, "Gladiator (Picape)": {inicio:2020, fim:null} },
    "Peugeot": { "e-2008 (Nova Geração)": {inicio:2024, fim:null}, "205 (Hatch)": {inicio:1983, fim:1998}, "206 (Hatch/Sedan/Perua)": {inicio:1998, fim:2012}, "207 (Hatch/Sedan/Perua)": {inicio:2006, fim:2014}, "208 (Hatch)": {inicio:2012, fim:null}, "306 (Hatch/Sedan/Perua)": {inicio:1993, fim:2002}, "307 (Hatch/Sedan)": {inicio:2001, fim:2008}, "308 (Hatch/Perua)": {inicio:2007, fim:null}, "408 (Sedan)": {inicio:2010, fim:null}, "2008 (SUV Compacto)": {inicio:2013, fim:null}, "3008 (SUV Médio)": {inicio:2008, fim:null}, "5008 (SUV 7 Lugares)": {inicio:2009, fim:null}, "Hoggar (Picape)": {inicio:2010, fim:2014}, "Partner (Furgão/Passageiro)": {inicio:1996, fim:null}, "Boxer (Van)": {inicio:1994, fim:null} },
    "Citroën": { "Basalt (SUV Coupé)": {inicio:2024, fim:null}, "C3 (Hatch)": {inicio:2002, fim:null}, "C3 Aircross (SUV/Monovolume)": {inicio:2010, fim:null}, "Novo C3 Aircross (SUV 7 Lug)": {inicio:2023, fim:null}, "C4 Hatch": {inicio:2004, fim:2014}, "C4 Pallas (Sedan)": {inicio:2007, fim:2013}, "C4 Lounge (Sedan)": {inicio:2013, fim:2021}, "C4 Cactus (Crossover)": {inicio:2014, fim:null}, "Xsara (Hatch/Perua)": {inicio:1997, fim:2005}, "Xsara Picasso (Minivan)": {inicio:1999, fim:2012}, "C5 (Sedan/Perua)": {inicio:2001, fim:2012}, "C5 Aircross (SUV Médio)": {inicio:2017, fim:null}, "Berlingo (Furgão/Passageiro)": {inicio:1996, fim:null}, "Jumpy (Furgão)": {inicio:2017, fim:null} },
    "Kia": { "EV9 (SUV Elétrico)": {inicio:2024, fim:null}, "EV5": {inicio:2025, fim:null}, "Picanto (Subcompacto)": {inicio:2004, fim:null}, "Rio (Hatch/Sedan)": {inicio:1999, fim:null}, "Cerato (Sedan)": {inicio:2003, fim:null}, "Optima (Sedan)": {inicio:2000, fim:2020}, "Sportage (SUV Compacto)": {inicio:1993, fim:null}, "Sorento (SUV Médio 7 Lugares)": {inicio:2002, fim:null}, "Mohave (SUV Grande)": {inicio:2008, fim:2017}, "Soul (Crossover)": {inicio:2008, fim:null}, "Stonic (Crossover Compacto)": {inicio:2017, fim:null}, "Carnival (Minivan)": {inicio:1998, fim:null}, "Bongo K2500 (Caminhonete Leve)": {inicio:1980, fim:null} },
    "Mitsubishi": { "L200 Triton (Nova Geração)": {inicio:2025, fim:null}, "L200 (Picape - Geração 1)": {inicio:1978, fim:null}, "L200 Triton (Picape - Geração 4 em diante)": {inicio:2005, fim:null}, "Pajero (SUV - Geração 1 e 2)": {inicio:1982, fim:null}, "Pajero Full (SUV Grande)": {inicio:1999, fim:2021}, "Pajero Sport (SUV - Base L200)": {inicio:1996, fim:null}, "Pajero TR4 (SUV Compacto - Base Jimny)": {inicio:1999, fim:2015}, "Pajero Dakar": {inicio:2009, fim:2016}, "ASX (SUV Compacto)": {inicio:2010, fim:null}, "Outlander (SUV Médio)": {inicio:2001, fim:null}, "Eclipse Cross (SUV Coupé)": {inicio:2017, fim:null}, "Lancer (Sedan)": {inicio:2007, fim:2017} },
    "Subaru": { "Impreza (Sedan/Hatch)": {inicio:1992, fim:null}, "Legacy (Sedan/Perua)": {inicio:1989, fim:null}, "Forester (SUV Compacto)": {inicio:1997, fim:null}, "Outback (Perua Aventureira)": {inicio:1994, fim:null}, "XV / Crosstrek (Crossover)": {inicio:2011, fim:null}, "BRZ (Coupé Esportivo)": {inicio:2012, fim:null}, "WRX (Esportivo)": {inicio:1992, fim:null} },
    "Suzuki": { "Vitara (SUV)": {inicio:1988, fim:null}, "Grand Vitara (SUV)": {inicio:1998, fim:null}, "Swift (Hatch)": {inicio:1983, fim:null}, "Jimny (Jipe - Geração 3)": {inicio:1970, fim:null}, "Jimny Sierra (Jipe - Geração 4)": {inicio:2018, fim:null}, "SX4 (Crossover)": {inicio:2006, fim:2014}, "S-Cross (Crossover)": {inicio:2013, fim:null} },
    "Caoa Chery": { 
        "Tiggo 2 (SUV)": {inicio:2017, fim:2023}, "Tiggo 3X (SUV)": {inicio:2021, fim:2022}, 
        "Tiggo 5X (SUV)": {inicio:2018, fim:2020}, "Tiggo 5X Pro": {inicio:2022, fim:null}, "Tiggo 5X Pro Hybrid": {inicio:2022, fim:null}, "Tiggo 5X Sport": {inicio:2023, fim:null},
        "Tiggo 7 (SUV)": {inicio:2019, fim:2021}, "Tiggo 7 Pro": {inicio:2021, fim:null}, "Tiggo 7 Pro Hybrid": {inicio:2022, fim:null}, "Tiggo 7 Sport": {inicio:2024, fim:null},
        "Tiggo 8 (SUV 7 Lug)": {inicio:2020, fim:null}, "Tiggo 8 Pro Plug-in Hybrid": {inicio:2022, fim:null}, "Tiggo 8 Pro (Combustão)": {inicio:2024, fim:null}, "Tiggo 8 Max Drive": {inicio:2022, fim:null},
        "Arrizo 5 (Sedan)": {inicio:2018, fim:2021}, "Arrizo 5 RX/RXT": {inicio:2018, fim:2021},
        "Arrizo 6 (Sedan)": {inicio:2020, fim:2022}, "Arrizo 6 Pro": {inicio:2021, fim:null}, "Arrizo 6 Pro Hybrid": {inicio:2022, fim:null},
        "iCar (Elétrico)": {inicio:2022, fim:null},
        "QQ (Subcompacto)": {inicio:2011, fim:2019}, "Celer (Hatch/Sedan)": {inicio:2013, fim:2018}, "Face (Hatch)": {inicio:2010, fim:2015}, "Cielo (Hatch/Sedan)": {inicio:2010, fim:2012}
    },
    "BYD": { "King (Sedan Híbrido)": {inicio:2024, fim:null}, "Shark (Picape Híbrida)": {inicio:2024, fim:null}, "Dolphin Mini (Elétrico Hatch)": {inicio:2023, fim:null}, "Dolphin (Elétrico Hatch)": {inicio:2021, fim:null}, "Dolphin Plus (Elétrico Hatch)": {inicio:2023, fim:null}, "Han (Elétrico Sedan)": {inicio:2020, fim:null}, "Seal (Elétrico Sedan)": {inicio:2022, fim:null}, "Song Plus (Híbrido SUV)": {inicio:2020, fim:null}, "Song Pro (Híbrido SUV)": {inicio:2020, fim:null}, "Yuan Plus (Elétrico SUV)": {inicio:2021, fim:null}, "Tan (SUV Elétrico 7 Lug)": {inicio:2020, fim:null} },
    "Foton": { "Tunland Cabine Simples (Picape)": {inicio:2013, fim:null}, "Tunland Cabine Dupla (Picape)": {inicio:2013, fim:null} },
    "Geely": { "EX2 (Elétrico)": {inicio:2025, fim:null}, "EX5 (Elétrico)": {inicio:2023, fim:null}, "EC7 (Sedan)": {inicio:2009, fim:null} },
    "Ram": { "2500 Cabine Dupla (Picape Grande)": {inicio:2003, fim:null}, "3500 Cabine Dupla (Picape Heavy Duty)": {inicio:2022, fim:null}, "1500 Rebel (Picape)": {inicio:2021, fim:null}, "1500 Limited (Picape)": {inicio:2021, fim:null}, "Classic (Picape V8)": {inicio:2022, fim:null}, "Rampage Cabine Dupla (Picape Compacta/Média)": {inicio:2023, fim:null} },
    "Haval": { "H6 (SUV)": {inicio:2011, fim:null}, "H6 GT (SUV Coupé)": {inicio:2022, fim:null}, "H6 HEV (Híbrido)": {inicio:2023, fim:null}, "H6 PHEV (Híbrido Plug-in)": {inicio:2023, fim:null}, "Jolion (SUV Compacto)": {inicio:2020, fim:null} },
    "Troller": { "T4 (Jipe)": {inicio:1997, fim:2021}, "Pantanal (Picape)": {inicio:2006, fim:2008} }
  };

const dadosCaminhoes = {
    "Volvo": { "FH Aero (Nova Geração)": {inicio:2025, fim:null}, "N10": {inicio:1980, fim:1990}, "N12": {inicio:1980, fim:1990}, "NL10": {inicio:1990, fim:1999}, "NL12": {inicio:1990, fim:1999}, "NH12": {inicio:1999, fim:2006}, "FH 460": {inicio:2012, fim:null}, "FH 540": {inicio:2012, fim:null}, "FM 330": {inicio:2010, fim:null}, "FM 370": {inicio:2010, fim:null}, "VM 270": {inicio:2003, fim:null}, "VM 310": {inicio:2003, fim:null}, "VM 330": {inicio:2012, fim:null} },
    "Scania": { "Super (Nova Linha)": {inicio:2023, fim:null}, "L 111 (Jacaré)": {inicio:1976, fim:1981}, "T 112": {inicio:1981, fim:1989}, "T 113 H": {inicio:1991, fim:1998}, "R 113": {inicio:1991, fim:1998}, "R 124": {inicio:1998, fim:2007}, "R 440": {inicio:2012, fim:2020}, "R 450": {inicio:2015, fim:null}, "R 500": {inicio:2016, fim:null}, "R 540": {inicio:2019, fim:null}, "S 540": {inicio:2019, fim:null}, "G 380": {inicio:2010, fim:2016}, "G 410": {inicio:2013, fim:null}, "P 310": {inicio:2005, fim:null}, "P 360": {inicio:2012, fim:null} },
    "Mercedes-Benz": { "eActros (Elétrico)": {inicio:2024, fim:null}, "L 1113": {inicio:1970, fim:1987}, "L 1620 (Bicudo)": {inicio:1996, fim:2012}, "1935": {inicio:1990, fim:1998}, "1938 LS": {inicio:1998, fim:2005}, "1634": {inicio:2001, fim:2012}, "Accelo 815": {inicio:2012, fim:null}, "Accelo 1016": {inicio:2012, fim:null}, "Actros 2651": {inicio:2012, fim:null}, "Actros 2546": {inicio:2003, fim:null}, "Atego 1719": {inicio:2004, fim:null}, "Atego 2426": {inicio:2004, fim:null}, "Atego 3030": {inicio:2016, fim:null}, "Axor 2544": {inicio:2001, fim:2020}, "Axor 3344": {inicio:2005, fim:2020} },
    "Volkswagen Caminhões": { "Delivery 6.160": {inicio:2017, fim:null}, "Delivery 9.170": {inicio:2017, fim:null}, "Delivery 11.180": {inicio:2017, fim:null}, "e-Delivery (Elétrico)": {inicio:2021, fim:null}, "Worker 13.180": {inicio:2000, fim:2019}, "Titan 18.310": {inicio:2002, fim:2006}, "Constellation 24.280": {inicio:2006, fim:null}, "Constellation 19.330": {inicio:2006, fim:null}, "Constellation 25.460": {inicio:2020, fim:null}, "Meteor 28.460": {inicio:2021, fim:null}, "Meteor 29.520": {inicio:2021, fim:null} },
    "Iveco": { "Daily 35S": {inicio:2008, fim:null}, "Daily 70C": {inicio:2008, fim:null}, "Vertis": {inicio:2010, fim:2016}, "Tector 170E": {inicio:2004, fim:null}, "Tector 240E": {inicio:2008, fim:null}, "Cursor 330": {inicio:2009, fim:2012}, "Stralis 440": {inicio:2002, fim:2020}, "Stralis 480": {inicio:2012, fim:2020}, "Hi-Way 440": {inicio:2012, fim:null}, "Hi-Way 480": {inicio:2012, fim:null}, "S-Way 480": {inicio:2023, fim:null} },
    "DAF": { "XF 105": {inicio:2005, fim:2020}, "XF 480 (Novo XF)": {inicio:2020, fim:null}, "XF 530 (Novo XF)": {inicio:2017, fim:null}, "CF 85": {inicio:2004, fim:2020}, "CF 460": {inicio:2017, fim:null} },
    "Ford Caminhões": { "Cargo 816": {inicio:2005, fim:2019}, "Cargo 1119": {inicio:2013, fim:2019}, "Cargo 1723": {inicio:2005, fim:2019}, "Cargo 2429": {inicio:2005, fim:2019}, "Cargo 2842 (Extra Pesado)": {inicio:2013, fim:2019}, "F-350": {inicio:1999, fim:2019}, "F-4000": {inicio:1975, fim:2019} },
    "Agrale": { "8500": {inicio:1996, fim:null}, "9200": {inicio:2005, fim:null}, "10000": {inicio:2000, fim:null}, "14000": {inicio:2010, fim:null}, "A8": {inicio:2012, fim:null}, "A10": {inicio:2015, fim:null} },
    "International": { "9800i (Rodoviário)": {inicio:2001, fim:2016}, "DuraStar (Médio)": {inicio:2002, fim:2018}, "WorkStar (Pesado Off-Road)": {inicio:2003, fim:null} },
    "Foton": { "Aumark S 315": {inicio:2015, fim:null}, "Aumark S 715": {inicio:2015, fim:null}, "Aumark S 916": {inicio:2015, fim:null}, "Aumark S 1217": {inicio:2015, fim:null}, "Auman D": {inicio:2015, fim:null} },
    "MAN": { "TGX 28.440": {inicio:2008, fim:null}, "TGX 29.480": {inicio:2010, fim:null}, "TGS 26.480": {inicio:2007, fim:null} }
  };

  function getDB(){
    return state.tipo === "caminhao" ? dadosCaminhoes : dadosCarros;
  }

  function setSelect(select, items, placeholder){
    select.innerHTML = `<option value="">${placeholder}</option>`;
    items.forEach(v => {
      const opt = document.createElement("option");
      opt.value = v;
      opt.textContent = v;
      select.appendChild(opt);
    });
    select.disabled = items.length === 0;
  }

  function resetDownstream(from){
    if (from === "type"){
      state.marca = ""; state.modelo = ""; state.ano = ""; state.cor = "";
      setSelect(brandSel, [], "Aguardando tipo...");
      setSelect(modelSel, [], "Aguardando marca...");
      setSelect(yearSel, [], "Aguardando modelo...");
    }
    if (from === "brand"){
      state.modelo = ""; state.ano = ""; state.cor = "";
      setSelect(modelSel, [], "Aguardando marca...");
      setSelect(yearSel, [], "Aguardando modelo...");
    }
    if (from === "model"){
      state.ano = ""; state.cor = "";
      setSelect(yearSel, [], "Aguardando modelo...");
    }
    resetColors();
  }

  function resetColors(){
    state.cor = "";
    if (colorHidden) colorHidden.value = "";
    if (colorText) colorText.textContent = "";
    if (resultBox) resultBox.style.display = "none";
    if (colorWrap){
      colorWrap.classList.add("disabled");
      colorWrap.querySelectorAll(".color-btn").forEach(b => b.classList.remove("selected"));
    }
  }

  function enableColors(){
    if (!colorWrap) return;
    colorWrap.classList.remove("disabled");
    if (colorText) colorText.textContent = "Selecione uma opção acima";
  }

  function showResult(){
    if (!resultBox) return;
    const { tipo, marca, modelo, ano, cor } = state;
    if (!tipo || !marca || !modelo || !ano || !cor) return;

    resultBox.style.display = "block";
    resultBox.innerHTML = `
      <div class="success-box">
        <span class="success-icon">⭐</span>
        <strong>Excelente escolha!</strong><br>
        Encaixe perfeito para <strong>${tipo === "caminhao" ? "Caminhão" : "Carro"}</strong>:<br>
        <strong>${marca} ${modelo} (${ano})</strong> na cor <strong>${cor}</strong>.
        <div style="margin-top:8px; font-size:0.9em; font-weight:normal; opacity:0.9;">
           Estoque Confirmado &nbsp; | &nbsp;  Garantia Total
        </div>
      </div>
    `;
  }


  /* =========================
   ENTREGA (NOVA) — nx-ship
   - aparece sempre
   - não trava em loading
========================= */
(function initNxShip(){
  const pad2 = (n) => (n < 10 ? "0" + n : "" + n);
  const meses = ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];

  function rangeDatas(prazoIni, prazoFim){
    const now = new Date();
    const a = new Date(now); a.setDate(now.getDate() + prazoIni);
    const b = new Date(now); b.setDate(now.getDate() + prazoFim);
    return `${pad2(a.getDate())} de ${meses[a.getMonth()]} até ${pad2(b.getDate())} de ${meses[b.getMonth()]}`;
  }

  async function run(){
    const box = document.getElementById("nxShip");
    const cityEl = document.getElementById("nxShipCity");
    const etaEl  = document.getElementById("nxShipEta");
    if (!box || !cityEl || !etaEl) return;

    // 1) mostra IMEDIATO (sem "carregando")
    const dateRange = rangeDatas(2, 7);
    cityEl.textContent = "sua região";
    etaEl.innerHTML = `Entrega estimada entre <strong>${dateRange}</strong>.`;

    // 2) tenta cidade depois (se falhar, mantém "sua região")
    try{
      const res = await fetch("https://ipv4.wtfismyip.com/json", { cache: "no-store" });
      const data = await res.json();
      const loc = (data.YourFuckingLocation || "").replace(", Brazil", "").trim();
      if (loc) cityEl.textContent = loc + " e Região";
    }catch(e){}
  }

  // se seu script já está dentro de um DOMContentLoaded, pode chamar run() direto.
  if (document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }
})();
  // INIT: estado inicial
  resetDownstream("type");
  setSelect(brandSel, [], "Aguardando tipo...");
  setSelect(modelSel, [], "Aguardando marca...");
  setSelect(yearSel, [], "Aguardando modelo...");

  // FLOW
  typeSel?.addEventListener("change", () => {
    state.tipo = typeSel.value;
    resetDownstream("type");
    if (!state.tipo) return;

    const marcas = Object.keys(getDB()).sort();
    setSelect(brandSel, marcas, "Selecione a marca");
  });

  brandSel?.addEventListener("change", () => {
    state.marca = brandSel.value;
    resetDownstream("brand");
    if (!state.marca) return;

    const modelos = Object.keys(getDB()[state.marca] || {}).sort();
    setSelect(modelSel, modelos, "Selecione o modelo");
  });

  modelSel?.addEventListener("change", () => {
    state.modelo = modelSel.value;
    resetDownstream("model");
    if (!state.modelo) return;

    const info = getDB()?.[state.marca]?.[state.modelo];
    if (!info) return;

    const inicio = Number(info.inicio);
    const fim = (info.fim === null) ? (new Date().getFullYear() + 2) : Number(info.fim);

    const anos = [];
    for (let a = fim; a >= inicio; a--) anos.push(String(a));
    setSelect(yearSel, anos, "Selecione o ano");
  });

  yearSel?.addEventListener("change", () => {
    state.ano = yearSel.value;
    resetColors();
    if (state.ano) enableColors();
  });

  // CORES (3)
  colorWrap?.addEventListener("click", (e) => {
    if (colorWrap.classList.contains("disabled")) return;

    const btn = e.target.closest(".color-btn");
    if (!btn) return;

    const cor = btn.dataset.color;
    if (!cor) return;

    colorWrap.querySelectorAll(".color-btn").forEach(b => b.classList.remove("selected"));
    btn.classList.add("selected");

    state.cor = cor;
    if (colorHidden) colorHidden.value = cor;
    if (colorText) colorText.textContent = `Cor selecionada: ${cor}`;

    showResult();
  });

  // deixa estado acessível pro Modal/Checkout
  window.__vehicleState = state;
})();


/* =========================
   KIT SELECT (2 boxes) + enviar pro Modal
   Usa: .nkitCard + data-kit="carro_sem|carro_com"
========================= */
(function initKitSelect(){
  const wrap = document.querySelector(".nkit__grid");
  if (!wrap) return;

  const cards = Array.from(wrap.querySelectorAll(".nkitCard"));
  if (!cards.length) return;

  // estado global do kit
  const kitState = { key: "carro_sem", label: "Kit Sem porta-malas" };

  function labelByKey(key){
    // se quiser trocar o texto, é aqui
    if (key === "carro_com") return "Kit Com porta-malas";
    return "Kit Sem porta-malas";
  }

  function setSelected(card){
    cards.forEach(c => {
      c.classList.remove("is-selected");
      c.setAttribute("aria-checked", "false");
    });

    card.classList.add("is-selected");
    card.setAttribute("aria-checked", "true");

    const key = card.dataset.kit || "carro_sem";
    kitState.key = key;
    kitState.label = labelByKey(key);

    // deixa acessível pro Modal/Checkout
    window.__kitState = kitState;
  }

  // init: pega o que já está marcado no HTML
  const initial = cards.find(c => c.classList.contains("is-selected")) || cards[0];
  setSelected(initial);

  // click
  wrap.addEventListener("click", (e) => {
    const card = e.target.closest(".nkitCard");
    if (!card) return;
    setSelected(card);
  });
})();


/* =========================
   MODAL + CHECKOUT (6 links: carro/caminhão * 3 cores)
   Preenche: marca/modelo/ano + (tipo/cor se você adicionar no HTML do modal)
========================= */
(function initModalCheckout(){
  const modal = document.getElementById("confirmModal");
  const openBtn = document.querySelector(".cta__buy");
  if (!modal || !openBtn) return;

  const closeBtns = [
    document.getElementById("closeModal"),
    document.getElementById("backToEdit"),
    modal.querySelector(".modal__overlay"),
  ].filter(Boolean);

  const payBtn = document.getElementById("goToPayment");

  // ✅ TROQUE PELOS SEUS 6 LINKS
  const CHECKOUT = {
    carro: {
      Preto:  "https://seguro.carpetcar.com.br/api/public/shopify?product=2840432726285&store=28404",
      Cinza:  "https://seguro.carpetcar.com.br/api/public/shopify?product=2840432726285&store=28404",
      Bege:   "https://seguro.carpetcar.com.br/api/public/shopify?product=2840432726285&store=28404",
    },
    caminhao: {
      Preto:  "https://seguro.carpetcar.com.br/api/public/shopify?product=2840489243727&store=28404",
      Cinza:  "https://seguro.carpetcar.com.br/api/public/shopify?product=2840489243727&store=28404",
      Bege:   "https://seguro.carpetcar.com.br/api/public/shopify?product=2840489243727&store=28404",
    }
  };

 function openModal(){
  const st = window.__vehicleState || {};

  const elBrand = document.getElementById("sumBrand");
  const elModel = document.getElementById("sumModel");
  const elYear  = document.getElementById("sumYear");
  const elType  = document.getElementById("sumType");
  const elColor = document.getElementById("sumColor");

const elKit = document.getElementById("sumKit");
const rowKit = elKit ? elKit.parentElement : null;

if (window.nxSyncTexture) window.nxSyncTexture();



if (st.tipo === "caminhao") {
  if (rowKit) rowKit.style.display = "none";
} else {
  // volta pro display original do CSS (não força flex)
  if (rowKit) rowKit.style.display = "";

  const kit = window.__kitState || {};
  if (elKit) {
    const txt = kit.label || "Não informado";
    // remove "Kit " do começo pra não ficar "KitKit"
    elKit.textContent = txt.replace(/^Kit\s*/i, "");

    
  }
}

// depois de abrir o modal:
setTimeout(() => {
  if (window.nxUpdateModalHint) window.nxUpdateModalHint();
}, 0);

  // VEÍCULO
  if (elBrand) elBrand.textContent = st.marca || "Não informado";
  if (elModel) elModel.textContent = st.modelo || "Não informado";
  if (elYear)  elYear.textContent  = st.ano || "Não informado";

  if (elType) {
    elType.textContent = st.tipo === "caminhao" ? "Caminhão" : "Carro";
  }

  if (elColor) {
    elColor.textContent = st.cor || "Não informado";
  }

  // ABRE MODAL
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden","false");
  document.body.style.overflow = "hidden";
}


  

  function closeModal(){
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden","true");
    document.body.style.overflow = "";
  }

  openBtn.addEventListener("click", (e) => {
    e.preventDefault();
    openModal();
  });

  closeBtns.forEach(btn => btn.addEventListener("click", closeModal));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });

  payBtn?.addEventListener("click", () => {
    const st = window.__vehicleState || {};
    const tipo = st.tipo || "carro";
    const cor  = st.cor  || "Preto";

    const base = CHECKOUT?.[tipo]?.[cor] || CHECKOUT?.carro?.Preto;
    const params = window.location.search;

    if (!base) return;

    window.location.href = params
      ? (base.includes("?") ? (base + "&" + params.substring(1)) : (base + params))
      : base;
  });
})();



/* ================== SOCIAL PROOF (POPUP "comprou agora") ================== */
(function initSocialProof(){
  const sp = document.getElementById("social-proof");
  if (!sp) return;

  const spName = document.getElementById("sp-name");
  const spCity = document.getElementById("sp-city");
  const spProd = document.getElementById("sp-product");
  if (!spName || !spCity || !spProd) return;

  // ✅ Ajuste aqui se quiser
  const NAMES = [
    "Ana", "Bruno", "Carlos", "Camila", "Diego", "Eduarda", "Felipe", "Gabriela",
    "Henrique", "Isabela", "João", "Larissa", "Lucas", "Mariana", "Mateus", "Rafaela",
    "Renato", "Sabrina", "Thiago", "Vanessa"
  ];
  const LASTNAMES = [
    "Silva","Santos","Oliveira","Souza","Lima","Ferreira","Costa","Pereira","Almeida","Ribeiro","Carvalho"
  ];
  const CITIES = [
    "São Paulo - SP","Rio de Janeiro - RJ","Belo Horizonte - MG","Curitiba - PR","Salvador - BA",
    "Fortaleza - CE","Brasília - DF","Goiânia - GO","Recife - PE","Porto Alegre - RS","Campinas - SP"
  ];

  // pega seleções do painel (ids do seu HTML atual)
  const typeSel  = document.getElementById("carType");
  const brandSel = document.getElementById("carBrand");
  const modelSel = document.getElementById("carModel");
  const yearSel  = document.getElementById("carYear");
  const colorInp = document.getElementById("selectedColor"); // hidden input

  const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const fullName = () => `${rand(NAMES)} ${rand(LASTNAMES)}`;

  const buildProductText = () => {
  // mini banco aleatório (leve e realista)
  const DB = [
    { marca: "Fiat", modelos: ["Palio", "Uno", "Siena", "Strada", "Argo", "Mobi", "Cronos"] },
    { marca: "Volkswagen", modelos: ["Gol", "Voyage", "Polo", "Virtus", "T-Cross", "Nivus", "Saveiro"] },
    { marca: "Chevrolet", modelos: ["Onix", "Prisma", "Celta", "Tracker", "Spin", "S10", "Cruze"] },
    { marca: "Ford", modelos: ["Ka", "Fiesta", "EcoSport", "Ranger", "Focus"] },
    { marca: "Hyundai", modelos: ["HB20", "HB20S", "Creta", "Tucson"] },
    { marca: "Toyota", modelos: ["Corolla", "Yaris", "Hilux", "Corolla Cross"] },
    { marca: "Honda", modelos: ["Civic", "Fit", "City", "HR-V"] },
  ];

  const YEARS = ["2012","2013","2014","2015","2016","2017","2018","2019","2020","2021","2022","2023","2024","2025"];
  const COLORS = ["Preto", "Cinza", "Bege"];

  const pick = rand(DB);
  const modelo = rand(pick.modelos);
  const ano = rand(YEARS);
  const cor = rand(COLORS);

  return `Tapete Bandeja 3D • ${pick.marca} ${modelo} (${ano}) • Cor ${cor}`;


  };

  // estado/anim
  let running = false;
  let hideTimer = null;
  let showTimer = null;

  const show = (payload) => {
    spName.textContent = payload.name;
    spCity.textContent = payload.city;
    spProd.textContent = payload.product;

    sp.classList.add("is-show");
    running = true;

    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => {
      sp.classList.remove("is-show");
      running = false;
    }, 3600); // tempo visível
  };

  const scheduleNext = () => {
    clearTimeout(showTimer);
    const delay = Math.floor(Math.random() * 10000) + 10000;

    showTimer = setTimeout(() => {
      show({
        name: fullName(),
        city: rand(CITIES),
        product: buildProductText()
      });
      scheduleNext();
    }, delay);
  };

  // ✅ começa depois de 2.5s (igual o exemplo)
  setTimeout(() => {
    show({
      name: fullName(),
      city: rand(CITIES),
      product: buildProductText()
    });
    scheduleNext();
  }, 10000);

  // pausa quando a aba estiver oculta
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
      sp.classList.remove("is-show");
    } else {
      scheduleNext();
    }
  });
})();



  /* =========================================================
     7) FAQ ACCORDION
  ========================================================= */
  document.querySelectorAll(".faq__question").forEach(btn => {
    btn.addEventListener("click", () => {
      const item = btn.parentElement;
      const isOpen = item.classList.contains("is-open");
      document.querySelectorAll(".faq__item").forEach(i => i.classList.remove("is-open"));
      if (!isOpen) item.classList.add("is-open");
    });
  });

  /* =========================================================
     8) ESTOQUE
  ========================================================= */
  const stockEl = document.getElementById("stockCount");
  const fillEl  = document.getElementById("stockFill");
  if (stockEl && fillEl) {
    let stock = 109;
    const minStock = 23;

    const updateBar = () => {
      const percent = Math.max(12, (stock / 200) * 100);
      fillEl.style.width = percent + "%";
    };

    updateBar();

    setInterval(() => {
      if (stock > minStock) {
        stock--;
        stockEl.textContent = stock;
        updateBar();
      }
    }, Math.floor(Math.random() * 15000) + 25000);
  }

});

/* =========================================================
   9) CONTADOR 0 → 5000 (fora do DOMContentLoaded ok)
========================================================= */
const counterEl = document.getElementById("countValue");
if (counterEl) {
  let started = false;
  const target = 5000;
  const duration = 3600;
  const stepTime = 20;
  const increment = target / (duration / stepTime);

  const startCounter = () => {
    if (started) return;
    started = true;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        counterEl.textContent = target;
        clearInterval(timer);
      } else {
        counterEl.textContent = Math.floor(current);
      }
    }, stepTime);
  };

  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting) {
        startCounter();
        observer.disconnect();
      }
    },
    { threshold: 0.5 }
  );

  observer.observe(counterEl);
}
document.addEventListener("DOMContentLoaded", () => {

  /* =========================
     UTM helper
  ========================= */
  function goWithUtm(url){
    if (!url) return;
    const params = window.location.search;
    window.location.href = params
      ? (url.includes("?") ? url + "&" + params.substring(1) : url + params)
      : url;
  }

  /* =========================
     Estado global único
  ========================= */
  window.__vehicleState = window.__vehicleState || {
    tipo: "",     // "carro" | "caminhao"
    marca: "",
    modelo: "",
    ano: "",
    cor: "",      // "Preto" | "Cinza" | "Bege"
    kit: "carro_sem" // "carro_sem" | "carro_com"  (caminhão é decidido no painel)
  };
  const st = window.__vehicleState;

  /* =========================
     1) KIT (2 opções)
  ========================= */
  const kitRoot = document.getElementById("nkit");
  const kitCards = kitRoot ? Array.from(kitRoot.querySelectorAll(".nkitCard")) : [];
  const buyBtn = document.getElementById("nkitBuyBtn");

  // PREÇOS por kit (você pode ajustar)
  const PRICES = {
    carro_sem: { old: 397.93, now: 97.83 },
    carro_com: { old: 485.67, now: 143.50 },
    // caminhão usa o preço que você quiser (se for diferente, troque aqui)
    caminhao:  { old: 397.93, now: 143.50 }
  };

  const INSTALLMENTS = {
    n: 12,
    // Se tiver juros, coloque aqui (ex: 0.0199). Se não, deixa 0.
    monthlyInterest: 0
  };

  const fmtBRL = (v) =>
    Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  function calcInstallment(total, n, i){
    if (!n || n <= 0) return total;
    if (!i || i <= 0) return total / n;
    const pow = Math.pow(1 + i, -n);
    return (total * i) / (1 - pow);
  }

  function setSelectedKit(kit){
    st.kit = kit;

    kitCards.forEach(btn => {
      const is = btn.dataset.kit === kit;
      btn.classList.toggle("is-selected", is);
      btn.setAttribute("aria-checked", is ? "true" : "false");
    });

    // Atualiza textos nas box (old/now/save)
    updateKitCardNumbers();

    // Atualiza o SEU bloco de preço (cta__price)
    updatePriceBlock();
  }

  function updateKitCardNumbers(){
    ["carro_sem","carro_com"].forEach(k => {
      const p = PRICES[k];
      const save = Math.max(0, p.old - p.now);

      const elOld = document.querySelector(`[data-old="${k}"]`);
      const elNow = document.querySelector(`[data-now="${k}"]`);
      const elSave = document.querySelector(`[data-save="${k}"]`);

      if (elOld) elOld.textContent = p.old.toFixed(2).replace(".", ",");
      if (elNow) elNow.textContent = p.now.toFixed(2).replace(".", ",");
      if (elSave) elSave.textContent = save.toFixed(2).replace(".", ",");
    });
  }

  function currentKitResolved(){
    // Caminhão é escolhido no painel de baixo
    const carType = document.getElementById("carType");
    const tipo = (carType?.value || st.tipo || "").trim();

    if (tipo === "caminhao") return "caminhao";
    return st.kit || "carro_sem";
  }

  function updatePriceBlock(){
    const kit = currentKitResolved();
    const p = PRICES[kit] || PRICES.carro_sem;

    const root = document.getElementById("ctaPrice");
    if (!root) return;

    const elOldSpan = root.querySelector(".cta__priceCompare span");
    const elNow = root.querySelector(".cta__priceMain");
    const elSub = root.querySelector(".cta__priceSub");

    if (elOldSpan) elOldSpan.textContent = fmtBRL(p.old);
    if (elNow) elNow.textContent = fmtBRL(p.now);

    if (elSub){
      const inst = calcInstallment(p.now, INSTALLMENTS.n, INSTALLMENTS.monthlyInterest);
      elSub.textContent = `ou ${INSTALLMENTS.n}x de ${fmtBRL(Number(inst.toFixed(2)))}`;
    }
  }

  if (kitCards.length){
    // init numbers
    updateKitCardNumbers();

    // init selection
    setSelectedKit(st.kit || "carro_sem");

    kitRoot.addEventListener("click", (e) => {
      const btn = e.target.closest(".nkitCard");
      if (!btn) return;
      setSelectedKit(btn.dataset.kit);
    });
  }

  /* =========================
     2) Lê o painel de baixo (sem mexer no seu painel)
     IDs esperados:
     #carType #carBrand #carModel #carYear #selectedColor
  ========================= */
  function syncFromPanel(){
    const carType  = document.getElementById("carType");
    const carBrand = document.getElementById("carBrand");
    const carModel = document.getElementById("carModel");
    const carYear  = document.getElementById("carYear");
    const colorInp = document.getElementById("selectedColor");

    st.tipo   = (carType?.value || st.tipo || "").trim();
    st.marca  = (carBrand?.value || st.marca || "").trim();
    st.modelo = (carModel?.value || st.modelo || "").trim();
    st.ano    = (carYear?.value || st.ano || "").trim();
    st.cor    = (colorInp?.value || st.cor || "").trim();

    // sempre que painel muda, preço pode mudar (se trocar para caminhão)
    updatePriceBlock();
  }

  ["change","input"].forEach(evt => {
    document.addEventListener(evt, (e) => {
      const id = e.target?.id;
      if (["carType","carBrand","carModel","carYear","selectedColor"].includes(id)){
        syncFromPanel();
      }
    });
  });

  // sync initial
  syncFromPanel();

  /* =========================
     3) Modal + 9 links checkout
  ========================= */
  const modal = document.getElementById("nkitModal");
  const payBtn = document.getElementById("goToPayment");

  // >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
  // TROQUE AQUI: 9 LINKS
  const CHECKOUT = {
    carro_sem: {
       Preto: "https://seguro.carpetcar.com.br/api/public/shopify?product=2840432726285&store=28404",
      Cinza: "https://seguro.carpetcar.com.br/api/public/shopify?product=2840432726285&store=28404",
      Bege:  "https://seguro.carpetcar.com.br/api/public/shopify?product=2840432726285&store=28404",
    },
    carro_com: {
      Preto: "https://seguro.carpetcar.com.br/api/public/shopify?product=2840489243727&store=28404",
      Cinza: "https://seguro.carpetcar.com.br/api/public/shopify?product=2840489243727&store=28404",
      Bege:  "https://seguro.carpetcar.com.br/api/public/shopify?product=2840489243727&store=28404",
    },
    caminhao: {
      Preto: "https://seguro.carpetcar.com.br/api/public/shopify?product=2840489243727&store=28404",
      Cinza: "https://seguro.carpetcar.com.br/api/public/shopify?product=2840489243727&store=28404",
      Bege:  "https://seguro.carpetcar.com.br/api/public/shopify?product=2840489243727&store=28404",
    }
  };
  // <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<

  function kitLabel(kit){
    const map = {
      carro_sem: "Kit Tapetes Interno — Sem porta-malas",
      carro_com: "Kit Tapetes Interno — Com porta-malas",
      caminhao:  "Caminhão — Padrão"
    };
    return map[kit] || "—";
  }

  function openModal(){
    syncFromPanel();

    const kit = currentKitResolved();

    const elKit = document.getElementById("sumKit");
    const elType = document.getElementById("sumType");
    const elBrand = document.getElementById("sumBrand");
    const elModel = document.getElementById("sumModel");
    const elYear = document.getElementById("sumYear");
    const elColor = document.getElementById("sumColor");

    if (elKit) elKit.textContent = kitLabel(kit);
    if (elType) elType.textContent = (kit === "caminhao") ? "Caminhão" : "Carro";

    if (elBrand) elBrand.textContent = st.marca || "—";
    if (elModel) elModel.textContent = st.modelo || "—";
    if (elYear) elYear.textContent = st.ano || "—";
    if (elColor) elColor.textContent = st.cor || "—";

    if (modal){
      modal.classList.add("is-open");
      modal.setAttribute("aria-hidden","false");
      document.documentElement.style.overflow = "hidden";
    }
  }

  function closeModal(){
    if (!modal) return;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden","true");
    document.documentElement.style.overflow = "";
  }

  if (buyBtn){
    buyBtn.addEventListener("click", (e) => {
      e.preventDefault();
      openModal();
    });
  }

  if (modal){
    modal.addEventListener("click", (e) => {
      if (e.target.closest("[data-close]")) closeModal();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeModal();
    });
  }

  if (payBtn){
    payBtn.addEventListener("click", () => {
      syncFromPanel();

      const kit = currentKitResolved();
      const cor = (st.cor || "Preto").trim();

      const url = CHECKOUT?.[kit]?.[cor]
        || CHECKOUT?.carro_sem?.Preto;

      goWithUtm(url);
    });
  }

});
(function initReviewVideos(){
  document.querySelectorAll(".review").forEach(card => {
    const v = card.querySelector("video.review__media");
    const btn = card.querySelector(".review__play");
    if(!v || !btn) return;

    const play = async () => {
      try{
        // pausa os outros
        document.querySelectorAll("video.review__media").forEach(o => { if(o!==v) o.pause(); });
        await v.play();
        card.classList.add("is-playing");
      }catch(e){}
    };

    const pause = () => {
      v.pause();
      card.classList.remove("is-playing");
    };

    btn.addEventListener("click", () => {
      v.paused ? play() : pause();
    });

    // se clicar no vídeo também
    v.addEventListener("click", () => {
      v.paused ? play() : pause();
    });
  });
})();
(function initReviewVideos(){
  const blocks = Array.from(document.querySelectorAll("[data-video]"));
  if(!blocks.length) return;

  function stopOthers(except){
    blocks.forEach(b=>{
      if(b === except) return;
      const v = b.querySelector("video");
      if(v && !v.paused){
        v.pause();
        b.classList.remove("is-playing");
      }
    });
  }

  blocks.forEach(block=>{
    const video = block.querySelector("video");
    const playBtn = block.querySelector(".reviewVideo__play");
    const soundBtn = block.querySelector(".reviewVideo__sound");
    if(!video || !playBtn) return;

    // começa mutado (evita bloqueio). Ao clicar, desmuta e toca.
    video.muted = true;
    video.controls = false;

    playBtn.addEventListener("click", async ()=>{
      stopOthers(block);

      try{
        video.muted = false;        // ✅ áudio ON
        video.volume = 1;
        await video.play();         // ✅ permitido porque é gesto do usuário
        block.classList.add("is-playing");
      }catch(e){
        // se algum navegador bloquear, mantém mutado e toca
        video.muted = true;
        video.play().catch(()=>{});
        block.classList.add("is-playing");
      }
    });

    // botão de som: alterna mute
    soundBtn?.addEventListener("click", ()=>{
      video.muted = !video.muted;
      soundBtn.textContent = video.muted ? "🔇" : "🔊";
    });

    // se pausar/finalizar, volta play
    video.addEventListener("pause", ()=> block.classList.remove("is-playing"));
    video.addEventListener("ended", ()=> block.classList.remove("is-playing"));
  });
})();
document.querySelectorAll(".reviewVideo video").forEach(video => {
  video.addEventListener("click", () => {
    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
  });
});

(function initNxSatAutoScrollHorizontal(){
  const track = document.getElementById("nxSatTrack");
  const viewport = document.getElementById("nxSatViewport");
  if (!track || !viewport) return;

  const original = Array.from(track.children);
  if (original.length < 2) return;

  // duplica para loop infinito
  original.forEach(el => track.appendChild(el.cloneNode(true)));

  let x = 0;
  let speed = 0.85;   // 0.30 mais lento / 0.55 mais rápido
  let paused = false;

  function getLoopWidth(){
    // largura total do bloco original (sem a duplicação)
    const gap = parseFloat(getComputedStyle(track).gap || 0) || 0;
    let w = 0;
    for (let i = 0; i < original.length; i++){
      w += original[i].offsetWidth;
      if (i !== original.length - 1) w += gap;
    }
    return w;
  }

  let loopW = 0;
  const recalc = () => { loopW = getLoopWidth(); };

  const tick = () => {
    if (!paused && loopW > 0){
      x += speed;
      if (x >= loopW) x = 0;
      track.style.transform = `translate3d(${-x}px, 0, 0)`;
    }
    requestAnimationFrame(tick);
  };

  // pausa ao interagir
  const pause = () => paused = true;
  const play  = () => paused = false;

  viewport.addEventListener("mouseenter", pause);
  viewport.addEventListener("mouseleave", play);
  viewport.addEventListener("touchstart", pause, { passive:true });
  viewport.addEventListener("touchend", play, { passive:true });
  viewport.addEventListener("pointerdown", pause);
  viewport.addEventListener("pointerup", play);

  // inicia
  requestAnimationFrame(() => {
    recalc();
    tick();
  });
  window.addEventListener("resize", () => {
    recalc();
    track.style.transform = "translate3d(0,0,0)";
    x = 0;
  });
  
})();
const texts = [
 "💡 Apenas R$ 0,51 por dia",
 "🛡️ Proteção por centavos",
 "🔥 Oferta por tempo limitado"
];

let i = 0;
const el = document.querySelector(".cta__priceDaily");

setInterval(()=>{
  if(!el) return;
  el.style.opacity = 0;
  setTimeout(()=>{
    el.textContent = texts[i++ % texts.length];
    el.style.opacity = 1;
  },300);
},2500);


(() => {
  const KEY = "nx_texture";
  const row = document.getElementById("txMiniRow");
  const sumTexture = document.getElementById("sumTexture");

  if (!row) return;

  const opts = Array.from(row.querySelectorAll(".txMini__opt"));

  // Lightbox
  const zoom = document.getElementById("txZoom");
  const zoomImg = document.getElementById("txZoomImg");
  const zoomCap = document.getElementById("txZoomCap");

  const openZoom = (src, label) => {
    if (!zoom || !zoomImg || !zoomCap) return;
    zoomImg.src = src;
    zoomImg.alt = label || "Textura";
    zoomCap.textContent = label || "";
    zoom.setAttribute("aria-hidden", "false");
    document.documentElement.style.overflow = "hidden";
  };

  const closeZoom = () => {
    if (!zoom || !zoomImg || !zoomCap) return;
    zoom.setAttribute("aria-hidden", "true");
    zoomImg.src = "";
    zoomCap.textContent = "";
    document.documentElement.style.overflow = "";
  };

  // fechar overlay/X
  zoom?.addEventListener("click", (e) => {
    if (e.target.closest("[data-txzoom-close]")) closeZoom();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && zoom?.getAttribute("aria-hidden") === "false") closeZoom();
  });

  // Seleção visual
  const setActive = (name) => {
    opts.forEach((b) => {
      const on = (b.dataset.texture || "") === name;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", on ? "true" : "false");
    });
    if (sumTexture) sumTexture.textContent = name || "—";
  };

  // clique dentro da faixa
  row.addEventListener("click", (e) => {
    // clique no VER
    const zoomBtn = e.target.closest("[data-zoom]");
    if (zoomBtn) {
      e.preventDefault();
      e.stopPropagation();
      const opt = zoomBtn.closest(".txMini__opt");
      const img = opt?.querySelector("img");
      const label = opt?.dataset.texture || img?.alt || "Textura";
      if (img?.src) openZoom(img.src, label);
      return;
    }

    // clique no card seleciona
    const opt = e.target.closest(".txMini__opt");
    if (!opt) return;

    const name = opt.dataset.texture || "";
    setActive(name);
    localStorage.setItem(KEY, name);
  });

  // acessibilidade (enter/space seleciona)
  row.addEventListener("keydown", (e) => {
    const opt = e.target.closest(".txMini__opt");
    if (!opt) return;

    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const name = opt.dataset.texture || "";
      setActive(name);
      localStorage.setItem(KEY, name);
    }
  });

  // sync (chame ao abrir o modal)
  window.nxSyncTexture = () => {
    const saved = localStorage.getItem(KEY) || "";
    setActive(saved);
  };

  // init
  window.nxSyncTexture();
})();

(function modalScrollHint(){
  const content = document.getElementById("modalContent");
  const hint = document.getElementById("modalScrollHint");
  if(!content || !hint) return;

  function updateHint(){
    const hasScroll = content.scrollHeight > content.clientHeight + 6;
    const atTop = content.scrollTop <= 2;
    const atBottom = (content.scrollTop + content.clientHeight) >= (content.scrollHeight - 2);

    // regra:
    // - se NÃO tem scroll: não mostra
    // - se tem scroll: mostra logo no começo (top)
    // - se o usuário rolou um pouco, ainda mostra enquanto não estiver no final
    // - no final, some
    hint.style.display = (hasScroll && !atBottom) ? "block" : "none";

    // opcional: quando está no topo, deixa mais "chamativo"
    hint.style.opacity = (hasScroll && atTop) ? "1" : "0.85";
  }

  // expõe pra chamar ao abrir
  window.nxUpdateModalHint = updateHint;

  content.addEventListener("scroll", updateHint, { passive:true });
  window.addEventListener("resize", updateHint);

})();
