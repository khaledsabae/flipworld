(() => {
  // src/platform/local.js
  var KEY = "flipworld.save.v2";
  var qs = new URLSearchParams(location.search);
  var pauseCb = null;
  var resumeCb = null;
  function fakeAd(label, ms) {
    return new Promise((resolve) => {
      if (pauseCb) pauseCb();
      const el = document.createElement("div");
      el.className = "dev-ad";
      el.textContent = label;
      document.body.appendChild(el);
      setTimeout(() => {
        el.remove();
        if (resumeCb) resumeCb();
        resolve(true);
      }, ms);
    });
  }
  var local_default = {
    id: "local",
    caps: { ads: qs.get("ads") === "1", languageMenu: true },
    loadingShown() {
    },
    ready() {
    },
    async load() {
      if (qs.get("fresh") === "1") {
        try {
          localStorage.removeItem(KEY);
        } catch (_) {
        }
        return null;
      }
      try {
        const raw = localStorage.getItem(KEY);
        return raw ? JSON.parse(raw) : null;
      } catch (_) {
        return null;
      }
    },
    save(data) {
      try {
        localStorage.setItem(KEY, JSON.stringify(data));
      } catch (_) {
      }
    },
    async language() {
      return qs.get("lang") || navigator.language || "en";
    },
    audioEnabled() {
      return qs.get("mute") !== "1";
    },
    onAudioChange() {
    },
    onPause(cb) {
      pauseCb = cb;
      document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
          if (pauseCb) pauseCb();
        } else if (resumeCb) resumeCb();
      });
    },
    onResume(cb) {
      resumeCb = cb;
    },
    async interstitial() {
      return this.caps.ads ? fakeAd("AD \xB7 interstitial (dev)", 900) : false;
    },
    async rewarded(id) {
      return this.caps.ads ? fakeAd("AD \xB7 rewarded: " + id + " (dev)", 1100) : false;
    },
    score() {
    },
    logError() {
    },
    gameplayStart() {
    },
    gameplayStop() {
    },
    happy() {
    }
  };

  // src/meta/save.js
  var SAVE_VERSION = 2;
  function freshSave() {
    return {
      v: SAVE_VERSION,
      stars: [],
      // stars[i] = best stars (1..3) for level index i; 0/undefined = not finished
      best: [],
      // best[i] = best time in tenths of a second
      max: 0,
      // highest unlocked level index
      gems: 0,
      // spendable currency
      earned: 0,
      // lifetime gems (for achievements)
      skins: ["classic"],
      skin: "classic",
      set: { music: 1, sfx: 1, ctl: "swipe", haptic: 1 },
      tut: {},
      // tutorial flags already shown
      stat: { deaths: 0, wins: 0, plays: 0 },
      daily: { day: 0, streak: 0, best: 0 }
    };
  }
  function migrate(raw) {
    const s = freshSave();
    if (!raw || typeof raw !== "object") return s;
    try {
      if (raw.v === 1 || raw.unlockedLevel !== void 0) {
        const st = raw.stars || {};
        for (const k of Object.keys(st)) {
          const i = (k | 0) - 1;
          if (i >= 0 && i < 500) s.stars[i] = clampInt(st[k], 0, 3);
        }
        s.max = clampInt((raw.unlockedLevel | 0) - 1, 0, 500);
        s.gems = s.earned = clampInt(raw.totalGems, 0, 1e6);
        return s;
      }
      if (Array.isArray(raw.stars)) s.stars = raw.stars.slice(0, 1e3).map((n) => clampInt(n, 0, 3));
      if (Array.isArray(raw.best)) s.best = raw.best.slice(0, 1e3).map((n) => clampInt(n, 0, 1e6));
      s.max = clampInt(raw.max, 0, 1e3);
      s.gems = clampInt(raw.gems, 0, 1e7);
      s.earned = clampInt(raw.earned, s.gems, 1e7);
      if (Array.isArray(raw.skins)) s.skins = [.../* @__PURE__ */ new Set(["classic", ...raw.skins.filter((x) => typeof x === "string")])].slice(0, 200);
      if (typeof raw.skin === "string" && s.skins.includes(raw.skin)) s.skin = raw.skin;
      if (raw.set && typeof raw.set === "object") {
        s.set.music = raw.set.music ? 1 : 0;
        s.set.sfx = raw.set.sfx ? 1 : 0;
        s.set.haptic = raw.set.haptic ? 1 : 0;
        s.set.ctl = raw.set.ctl === "grab" ? "grab" : "swipe";
      }
      if (raw.tut && typeof raw.tut === "object") for (const k of Object.keys(raw.tut).slice(0, 50)) s.tut[k] = 1;
      if (raw.stat && typeof raw.stat === "object") {
        s.stat.deaths = clampInt(raw.stat.deaths, 0, 1e9);
        s.stat.wins = clampInt(raw.stat.wins, 0, 1e9);
        s.stat.plays = clampInt(raw.stat.plays, 0, 1e9);
      }
      if (raw.daily && typeof raw.daily === "object") {
        s.daily.day = clampInt(raw.daily.day, 0, 1e9);
        s.daily.streak = clampInt(raw.daily.streak, 0, 1e6);
        s.daily.best = clampInt(raw.daily.best, 0, 1e6);
      }
    } catch (_) {
      return freshSave();
    }
    return s;
  }
  function clampInt(n, lo, hi) {
    n = Number(n);
    if (!isFinite(n)) n = lo;
    n = Math.floor(n);
    return n < lo ? lo : n > hi ? hi : n;
  }
  function totalStars(s) {
    let t = 0;
    for (let i = 0; i < s.stars.length; i++) t += s.stars[i] || 0;
    return t;
  }

  // src/i18n/locales.js
  var KEYS = [
    "loading",
    "level",
    "levels",
    "next",
    "retry",
    "settings",
    "music",
    "sfx",
    "control",
    "ctlSwipe",
    "ctlGrab",
    "win1",
    "win2",
    "win3",
    "paused",
    "tutDrag",
    "tutBoth",
    "tutSpikes",
    "tutFlip",
    "tutEdge",
    "endTitle",
    "endBody",
    "doubleGems",
    "adFail",
    "noWebgl",
    "close",
    "skins",
    "hint",
    "skip",
    "notEnough",
    "equipped"
  ];
  var ROWS = {
    es: [
      "Cargando\u2026",
      "Nivel",
      "Niveles",
      "Siguiente",
      "Reintentar",
      "Ajustes",
      "M\xFAsica",
      "Sonidos",
      "Controles",
      "Deslizar",
      "Agarrar y girar",
      "\xA1Bien!",
      "\xA1Genial!",
      "\xA1Perfecto!",
      "En pausa",
      "Arrastra para inclinar el mundo",
      "Inclina a ambos lados",
      "El rojo es peligro",
      "Ponlo boca abajo",
      "No te caigas",
      "\xA1Mundo completado!",
      "Terminaste todos los niveles. Vienen m\xE1s mundos: \xA1vuelve por las 3 estrellas!",
      "Duplicar gemas",
      "No hay anuncios por ahora",
      "Este dispositivo no puede mostrar gr\xE1ficos 3D.",
      "Cerrar",
      "Bolas",
      "Pista",
      "Saltar nivel",
      "Faltan gemas",
      "En uso"
    ],
    pt: [
      "Carregando\u2026",
      "N\xEDvel",
      "N\xEDveis",
      "Pr\xF3ximo",
      "Repetir",
      "Ajustes",
      "M\xFAsica",
      "Sons",
      "Controles",
      "Deslizar",
      "Pegar e girar",
      "Boa!",
      "\xD3timo!",
      "Perfeito!",
      "Pausado",
      "Arraste para inclinar o mundo",
      "Incline para os dois lados",
      "Vermelho \xE9 perigo",
      "Vire de cabe\xE7a para baixo",
      "N\xE3o caia",
      "Mundo completo!",
      "Voc\xEA terminou todos os n\xEDveis. Mais mundos v\xEAm a\xED: volte pelas 3 estrelas!",
      "Dobrar gemas",
      "Nenhum an\xFAncio agora",
      "Este aparelho n\xE3o exibe gr\xE1ficos 3D.",
      "Fechar",
      "Bolas",
      "Dica",
      "Pular n\xEDvel",
      "Faltam gemas",
      "Em uso"
    ],
    de: [
      "L\xE4dt\u2026",
      "Level",
      "Level",
      "Weiter",
      "Nochmal",
      "Einstellungen",
      "Musik",
      "Soundeffekte",
      "Steuerung",
      "Wischen",
      "Greifen & drehen",
      "Gut!",
      "Super!",
      "Perfekt!",
      "Pausiert",
      "Ziehen, um die Welt zu kippen",
      "Kippe in beide Richtungen",
      "Rot hei\xDFt Gefahr",
      "Stell sie auf den Kopf",
      "Fall nicht raus",
      "Welt geschafft!",
      "Du hast alle Level geschafft. Weitere Welten kommen \u2013 hol dir noch 3 Sterne!",
      "Edelsteine x2",
      "Gerade keine Werbung da",
      "Dieses Ger\xE4t kann keine 3D-Grafik anzeigen.",
      "Schlie\xDFen",
      "B\xE4lle",
      "Tipp",
      "Level \xFCberspringen",
      "Zu wenig Edelsteine",
      "Aktiv"
    ],
    fr: [
      "Chargement\u2026",
      "Niveau",
      "Niveaux",
      "Suivant",
      "Rejouer",
      "R\xE9glages",
      "Musique",
      "Effets sonores",
      "Commandes",
      "Glisser",
      "Saisir et tourner",
      "Bien !",
      "Super !",
      "Parfait !",
      "En pause",
      "Glisse pour incliner le monde",
      "Incline des deux c\xF4t\xE9s",
      "Le rouge, c'est danger",
      "Retourne-le",
      "Ne tombe pas",
      "Monde termin\xE9 !",
      "Tu as fini tous les niveaux. D'autres mondes arrivent : reviens chercher les 3 \xE9toiles !",
      "Doubler les gemmes",
      "Pas de pub pour l'instant",
      "Cet appareil ne peut pas afficher la 3D.",
      "Fermer",
      "Balles",
      "Indice",
      "Passer le niveau",
      "Pas assez de gemmes",
      "Utilis\xE9e"
    ],
    it: [
      "Caricamento\u2026",
      "Livello",
      "Livelli",
      "Avanti",
      "Riprova",
      "Impostazioni",
      "Musica",
      "Effetti sonori",
      "Comandi",
      "Scorri",
      "Afferra e ruota",
      "Bene!",
      "Ottimo!",
      "Perfetto!",
      "In pausa",
      "Trascina per inclinare il mondo",
      "Inclina da entrambi i lati",
      "Il rosso \xE8 pericolo",
      "Capovolgilo",
      "Non cadere fuori",
      "Mondo completato!",
      "Hai finito tutti i livelli. Altri mondi in arrivo: torna a prendere le 3 stelle!",
      "Raddoppia gemme",
      "Nessun annuncio ora",
      "Questo dispositivo non pu\xF2 mostrare la grafica 3D.",
      "Chiudi",
      "Palline",
      "Aiuto",
      "Salta livello",
      "Gemme insufficienti",
      "In uso"
    ],
    ja: [
      "\u8AAD\u307F\u8FBC\u307F\u4E2D\u2026",
      "\u30EC\u30D9\u30EB",
      "\u30EC\u30D9\u30EB\u4E00\u89A7",
      "\u6B21\u3078",
      "\u30EA\u30C8\u30E9\u30A4",
      "\u8A2D\u5B9A",
      "\u97F3\u697D",
      "\u52B9\u679C\u97F3",
      "\u64CD\u4F5C",
      "\u30B9\u30EF\u30A4\u30D7",
      "\u3064\u304B\u3093\u3067\u56DE\u3059",
      "\u3044\u3044\u306D\uFF01",
      "\u3059\u3054\u3044\uFF01",
      "\u30D1\u30FC\u30D5\u30A7\u30AF\u30C8\uFF01",
      "\u4E00\u6642\u505C\u6B62\u4E2D",
      "\u30C9\u30E9\u30C3\u30B0\u3057\u3066\u4E16\u754C\u3092\u50BE\u3051\u3088\u3046",
      "\u5DE6\u53F3\u3069\u3061\u3089\u306B\u3082\u50BE\u3051\u3088\u3046",
      "\u8D64\u306F\u5371\u967A\uFF01",
      "\u3055\u304B\u3055\u307E\u306B\u3057\u3088\u3046",
      "\u843D\u3061\u306A\u3044\u3088\u3046\u306B",
      "\u30EF\u30FC\u30EB\u30C9\u30AF\u30EA\u30A2\uFF01",
      "\u3059\u3079\u3066\u306E\u30EC\u30D9\u30EB\u3092\u30AF\u30EA\u30A2\uFF01\u65B0\u3057\u3044\u30EF\u30FC\u30EB\u30C9\u3082\u6E96\u5099\u4E2D\u3002\u661F3\u3064\u3092\u76EE\u6307\u305D\u3046\uFF01",
      "\u30B8\u30A7\u30E02\u500D",
      "\u4ECA\u306F\u5E83\u544A\u304C\u3042\u308A\u307E\u305B\u3093",
      "\u3053\u306E\u7AEF\u672B\u3067\u306F3D\u3092\u8868\u793A\u3067\u304D\u307E\u305B\u3093\u3002",
      "\u9589\u3058\u308B",
      "\u30DC\u30FC\u30EB",
      "\u30D2\u30F3\u30C8",
      "\u30B9\u30AD\u30C3\u30D7",
      "\u30B8\u30A7\u30E0\u304C\u8DB3\u308A\u307E\u305B\u3093",
      "\u4F7F\u7528\u4E2D"
    ],
    tr: [
      "Y\xFCkleniyor\u2026",
      "B\xF6l\xFCm",
      "B\xF6l\xFCmler",
      "\u0130leri",
      "Tekrar",
      "Ayarlar",
      "M\xFCzik",
      "Ses efektleri",
      "Kontroller",
      "Kayd\u0131r",
      "Tut ve \xE7evir",
      "G\xFCzel!",
      "Harika!",
      "M\xFCkemmel!",
      "Duraklat\u0131ld\u0131",
      "D\xFCnyay\u0131 e\u011Fmek i\xE7in s\xFCr\xFCkle",
      "\u0130ki y\xF6ne de e\u011F",
      "K\u0131rm\u0131z\u0131 tehlikedir",
      "Ba\u015F a\u015Fa\u011F\u0131 \xE7evir",
      "D\u0131\u015Far\u0131 d\xFC\u015Fme",
      "D\xFCnya tamamland\u0131!",
      "T\xFCm b\xF6l\xFCmleri bitirdin. Yeni d\xFCnyalar yolda: 3 y\u0131ld\u0131z i\xE7in geri d\xF6n!",
      "Elmaslar\u0131 ikiye katla",
      "\u015Eu an reklam yok",
      "Bu cihaz 3D grafik g\xF6steremiyor.",
      "Kapat",
      "Toplar",
      "\u0130pucu",
      "B\xF6l\xFCm\xFC ge\xE7",
      "Yeterli elmas yok",
      "Kullan\u0131mda"
    ],
    id: [
      "Memuat\u2026",
      "Level",
      "Level",
      "Lanjut",
      "Ulangi",
      "Pengaturan",
      "Musik",
      "Efek suara",
      "Kontrol",
      "Geser",
      "Pegang & putar",
      "Bagus!",
      "Hebat!",
      "Sempurna!",
      "Dijeda",
      "Seret untuk memiringkan dunia",
      "Miringkan ke dua arah",
      "Merah berarti bahaya",
      "Balikkan dunianya",
      "Jangan sampai jatuh",
      "Dunia selesai!",
      "Kamu menamatkan semua level. Dunia baru segera hadir: kembali untuk 3 bintang!",
      "Gandakan permata",
      "Belum ada iklan saat ini",
      "Perangkat ini tidak bisa menampilkan grafik 3D.",
      "Tutup",
      "Bola",
      "Petunjuk",
      "Lewati level",
      "Permata kurang",
      "Dipakai"
    ],
    hi: [
      "\u0932\u094B\u0921 \u0939\u094B \u0930\u0939\u093E \u0939\u0948\u2026",
      "\u0932\u0947\u0935\u0932",
      "\u0932\u0947\u0935\u0932",
      "\u0906\u0917\u0947",
      "\u092B\u093F\u0930 \u0938\u0947",
      "\u0938\u0947\u091F\u093F\u0902\u0917\u094D\u0938",
      "\u0938\u0902\u0917\u0940\u0924",
      "\u0927\u094D\u0935\u0928\u093F \u092A\u094D\u0930\u092D\u093E\u0935",
      "\u0915\u0902\u091F\u094D\u0930\u094B\u0932",
      "\u0938\u094D\u0935\u093E\u0907\u092A",
      "\u092A\u0915\u0921\u093C\u094B \u0914\u0930 \u0918\u0941\u092E\u093E\u0913",
      "\u092C\u0922\u093C\u093F\u092F\u093E!",
      "\u0936\u093E\u0928\u0926\u093E\u0930!",
      "\u092A\u0930\u092B\u093C\u0947\u0915\u094D\u091F!",
      "\u0930\u0941\u0915\u093E \u0939\u0941\u0906",
      "\u0926\u0941\u0928\u093F\u092F\u093E \u091D\u0941\u0915\u093E\u0928\u0947 \u0915\u0947 \u0932\u093F\u090F \u0916\u0940\u0902\u091A\u094B",
      "\u0926\u094B\u0928\u094B\u0902 \u0924\u0930\u092B\u093C \u091D\u0941\u0915\u093E\u0913",
      "\u0932\u093E\u0932 \u092E\u0924\u0932\u092C \u0916\u093C\u0924\u0930\u093E",
      "\u0907\u0938\u0947 \u0909\u0932\u094D\u091F\u093E \u0915\u0930 \u0926\u094B",
      "\u092C\u093E\u0939\u0930 \u092E\u0924 \u0917\u093F\u0930\u0928\u093E",
      "\u0926\u0941\u0928\u093F\u092F\u093E \u092A\u0942\u0930\u0940!",
      "\u0924\u0941\u092E\u0928\u0947 \u0938\u093E\u0930\u0947 \u0932\u0947\u0935\u0932 \u092A\u0942\u0930\u0947 \u0915\u0930 \u0932\u093F\u090F\u0964 \u0928\u0908 \u0926\u0941\u0928\u093F\u092F\u093E \u0906 \u0930\u0939\u0940 \u0939\u0948\u0902 \u2014 3 \u0938\u094D\u091F\u093E\u0930 \u0915\u0947 \u0932\u093F\u090F \u0935\u093E\u092A\u0938 \u0906\u0913!",
      "\u0930\u0924\u094D\u0928 \u0926\u094B\u0917\u0941\u0928\u0947 \u0915\u0930\u094B",
      "\u0905\u092D\u0940 \u0915\u094B\u0908 \u0935\u093F\u091C\u094D\u091E\u093E\u092A\u0928 \u0928\u0939\u0940\u0902 \u0939\u0948",
      "\u092F\u0939 \u0921\u093F\u0935\u093E\u0907\u0938 3D \u0917\u094D\u0930\u093E\u092B\u093C\u093F\u0915\u094D\u0938 \u0928\u0939\u0940\u0902 \u0926\u093F\u0916\u093E \u0938\u0915\u0924\u093E\u0964",
      "\u092C\u0902\u0926 \u0915\u0930\u0947\u0902",
      "\u0917\u0947\u0902\u0926\u0947\u0902",
      "\u0938\u0902\u0915\u0947\u0924",
      "\u0932\u0947\u0935\u0932 \u091B\u094B\u0921\u093C\u094B",
      "\u0930\u0924\u094D\u0928 \u0915\u092E \u0939\u0948\u0902",
      "\u091A\u093E\u0932\u0942"
    ],
    ru: [
      "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430\u2026",
      "\u0423\u0440\u043E\u0432\u0435\u043D\u044C",
      "\u0423\u0440\u043E\u0432\u043D\u0438",
      "\u0414\u0430\u043B\u044C\u0448\u0435",
      "\u0417\u0430\u043D\u043E\u0432\u043E",
      "\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438",
      "\u041C\u0443\u0437\u044B\u043A\u0430",
      "\u0417\u0432\u0443\u043A\u0438",
      "\u0423\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u0435",
      "\u0421\u0432\u0430\u0439\u043F",
      "\u0425\u0432\u0430\u0442\u0430\u0439 \u0438 \u043A\u0440\u0443\u0442\u0438",
      "\u041D\u0435\u043F\u043B\u043E\u0445\u043E!",
      "\u041E\u0442\u043B\u0438\u0447\u043D\u043E!",
      "\u0418\u0434\u0435\u0430\u043B\u044C\u043D\u043E!",
      "\u041F\u0430\u0443\u0437\u0430",
      "\u0422\u044F\u043D\u0438, \u0447\u0442\u043E\u0431\u044B \u043D\u0430\u043A\u043B\u043E\u043D\u0438\u0442\u044C \u043C\u0438\u0440",
      "\u041D\u0430\u043A\u043B\u043E\u043D\u044F\u0439 \u0432 \u043E\u0431\u0435 \u0441\u0442\u043E\u0440\u043E\u043D\u044B",
      "\u041A\u0440\u0430\u0441\u043D\u043E\u0435 \u2014 \u043E\u043F\u0430\u0441\u043D\u043E",
      "\u041F\u0435\u0440\u0435\u0432\u0435\u0440\u043D\u0438 \u043C\u0438\u0440",
      "\u041D\u0435 \u0432\u044B\u043F\u0430\u0434\u0438",
      "\u041C\u0438\u0440 \u043F\u0440\u043E\u0439\u0434\u0435\u043D!",
      "\u0422\u044B \u043F\u0440\u043E\u0448\u0451\u043B \u0432\u0441\u0435 \u0443\u0440\u043E\u0432\u043D\u0438. \u041D\u043E\u0432\u044B\u0435 \u043C\u0438\u0440\u044B \u0443\u0436\u0435 \u0432 \u043F\u0443\u0442\u0438 \u2014 \u0432\u0435\u0440\u043D\u0438\u0441\u044C \u0437\u0430 3 \u0437\u0432\u0451\u0437\u0434\u0430\u043C\u0438!",
      "\u0423\u0434\u0432\u043E\u0438\u0442\u044C \u043A\u0440\u0438\u0441\u0442\u0430\u043B\u043B\u044B",
      "\u0421\u0435\u0439\u0447\u0430\u0441 \u043D\u0435\u0442 \u0440\u0435\u043A\u043B\u0430\u043C\u044B",
      "\u042D\u0442\u043E \u0443\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432\u043E \u043D\u0435 \u043F\u043E\u0434\u0434\u0435\u0440\u0436\u0438\u0432\u0430\u0435\u0442 3D-\u0433\u0440\u0430\u0444\u0438\u043A\u0443.",
      "\u0417\u0430\u043A\u0440\u044B\u0442\u044C",
      "\u0428\u0430\u0440\u044B",
      "\u041F\u043E\u0434\u0441\u043A\u0430\u0437\u043A\u0430",
      "\u041F\u0440\u043E\u043F\u0443\u0441\u0442\u0438\u0442\u044C",
      "\u041D\u0435 \u0445\u0432\u0430\u0442\u0430\u0435\u0442 \u043A\u0440\u0438\u0441\u0442\u0430\u043B\u043B\u043E\u0432",
      "\u0412\u044B\u0431\u0440\u0430\u043D"
    ],
    vi: [
      "\u0110ang t\u1EA3i\u2026",
      "M\xE0n",
      "M\xE0n ch\u01A1i",
      "Ti\u1EBFp",
      "Ch\u01A1i l\u1EA1i",
      "C\xE0i \u0111\u1EB7t",
      "Nh\u1EA1c",
      "Hi\u1EC7u \u1EE9ng \xE2m thanh",
      "\u0110i\u1EC1u khi\u1EC3n",
      "Vu\u1ED1t",
      "Gi\u1EEF v\xE0 xoay",
      "T\u1ED1t l\u1EAFm!",
      "Tuy\u1EC7t v\u1EDDi!",
      "Ho\xE0n h\u1EA3o!",
      "T\u1EA1m d\u1EEBng",
      "K\xE9o \u0111\u1EC3 nghi\xEAng th\u1EBF gi\u1EDBi",
      "Nghi\xEAng c\u1EA3 hai ph\xEDa",
      "M\xE0u \u0111\u1ECF l\xE0 nguy hi\u1EC3m",
      "L\u1EADt ng\u01B0\u1EE3c n\xF3 l\u1EA1i",
      "\u0110\u1EEBng r\u01A1i ra ngo\xE0i",
      "Ho\xE0n th\xE0nh th\u1EBF gi\u1EDBi!",
      "B\u1EA1n \u0111\xE3 qua m\u1ECDi m\xE0n. Th\u1EBF gi\u1EDBi m\u1EDBi s\u1EAFp ra m\u1EAFt: quay l\u1EA1i l\u1EA5y 3 sao nh\xE9!",
      "Nh\xE2n \u0111\xF4i ng\u1ECDc",
      "Hi\u1EC7n ch\u01B0a c\xF3 qu\u1EA3ng c\xE1o",
      "Thi\u1EBFt b\u1ECB n\xE0y kh\xF4ng hi\u1EC3n th\u1ECB \u0111\u01B0\u1EE3c \u0111\u1ED3 h\u1ECDa 3D.",
      "\u0110\xF3ng",
      "B\xF3ng",
      "G\u1EE3i \xFD",
      "B\u1ECF qua m\xE0n",
      "Kh\xF4ng \u0111\u1EE7 ng\u1ECDc",
      "\u0110ang d\xF9ng"
    ],
    th: [
      "\u0E01\u0E33\u0E25\u0E31\u0E07\u0E42\u0E2B\u0E25\u0E14\u2026",
      "\u0E14\u0E48\u0E32\u0E19",
      "\u0E14\u0E48\u0E32\u0E19\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14",
      "\u0E15\u0E48\u0E2D\u0E44\u0E1B",
      "\u0E40\u0E25\u0E48\u0E19\u0E43\u0E2B\u0E21\u0E48",
      "\u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32",
      "\u0E40\u0E1E\u0E25\u0E07",
      "\u0E40\u0E2A\u0E35\u0E22\u0E07\u0E40\u0E2D\u0E1F\u0E40\u0E1F\u0E01\u0E15\u0E4C",
      "\u0E01\u0E32\u0E23\u0E04\u0E27\u0E1A\u0E04\u0E38\u0E21",
      "\u0E1B\u0E31\u0E14",
      "\u0E08\u0E31\u0E1A\u0E41\u0E25\u0E49\u0E27\u0E2B\u0E21\u0E38\u0E19",
      "\u0E14\u0E35\u0E21\u0E32\u0E01!",
      "\u0E40\u0E22\u0E35\u0E48\u0E22\u0E21!",
      "\u0E2A\u0E21\u0E1A\u0E39\u0E23\u0E13\u0E4C\u0E41\u0E1A\u0E1A!",
      "\u0E2B\u0E22\u0E38\u0E14\u0E0A\u0E31\u0E48\u0E27\u0E04\u0E23\u0E32\u0E27",
      "\u0E25\u0E32\u0E01\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E40\u0E2D\u0E35\u0E22\u0E07\u0E42\u0E25\u0E01",
      "\u0E40\u0E2D\u0E35\u0E22\u0E07\u0E44\u0E14\u0E49\u0E17\u0E31\u0E49\u0E07\u0E2A\u0E2D\u0E07\u0E17\u0E32\u0E07",
      "\u0E2A\u0E35\u0E41\u0E14\u0E07\u0E04\u0E37\u0E2D\u0E2D\u0E31\u0E19\u0E15\u0E23\u0E32\u0E22",
      "\u0E1E\u0E25\u0E34\u0E01\u0E01\u0E25\u0E31\u0E1A\u0E2B\u0E31\u0E27\u0E40\u0E25\u0E22",
      "\u0E2D\u0E22\u0E48\u0E32\u0E15\u0E01\u0E2D\u0E2D\u0E01\u0E44\u0E1B",
      "\u0E1C\u0E48\u0E32\u0E19\u0E42\u0E25\u0E01\u0E19\u0E35\u0E49\u0E41\u0E25\u0E49\u0E27!",
      "\u0E04\u0E38\u0E13\u0E1C\u0E48\u0E32\u0E19\u0E04\u0E23\u0E1A\u0E17\u0E38\u0E01\u0E14\u0E48\u0E32\u0E19\u0E41\u0E25\u0E49\u0E27 \u0E42\u0E25\u0E01\u0E43\u0E2B\u0E21\u0E48\u0E01\u0E33\u0E25\u0E31\u0E07\u0E21\u0E32 \u0E01\u0E25\u0E31\u0E1A\u0E21\u0E32\u0E40\u0E01\u0E47\u0E1A 3 \u0E14\u0E32\u0E27\u0E01\u0E31\u0E19!",
      "\u0E40\u0E1E\u0E0A\u0E23 x2",
      "\u0E15\u0E2D\u0E19\u0E19\u0E35\u0E49\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E42\u0E06\u0E29\u0E13\u0E32",
      "\u0E2D\u0E38\u0E1B\u0E01\u0E23\u0E13\u0E4C\u0E19\u0E35\u0E49\u0E41\u0E2A\u0E14\u0E07\u0E01\u0E23\u0E32\u0E1F\u0E34\u0E01 3D \u0E44\u0E21\u0E48\u0E44\u0E14\u0E49",
      "\u0E1B\u0E34\u0E14",
      "\u0E25\u0E39\u0E01\u0E1A\u0E2D\u0E25",
      "\u0E04\u0E33\u0E43\u0E1A\u0E49",
      "\u0E02\u0E49\u0E32\u0E21\u0E14\u0E48\u0E32\u0E19",
      "\u0E40\u0E1E\u0E0A\u0E23\u0E44\u0E21\u0E48\u0E1E\u0E2D",
      "\u0E43\u0E0A\u0E49\u0E2D\u0E22\u0E39\u0E48"
    ],
    pl: [
      "Wczytywanie\u2026",
      "Poziom",
      "Poziomy",
      "Dalej",
      "Jeszcze raz",
      "Ustawienia",
      "Muzyka",
      "Efekty",
      "Sterowanie",
      "Przesuwanie",
      "Z\u0142ap i obr\xF3\u0107",
      "Nie\u017Ale!",
      "\u015Awietnie!",
      "Idealnie!",
      "Pauza",
      "Przeci\u0105gnij, by przechyli\u0107 \u015Bwiat",
      "Przechylaj w obie strony",
      "Czerwone znaczy gro\u017Ane",
      "Odwr\xF3\u0107 go do g\xF3ry nogami",
      "Nie wypadnij",
      "\u015Awiat uko\u0144czony!",
      "Wszystkie poziomy za tob\u0105. Nowe \u015Bwiaty ju\u017C w drodze \u2014 wr\xF3\u0107 po 3 gwiazdki!",
      "Podw\xF3j klejnoty",
      "Brak reklam w tej chwili",
      "To urz\u0105dzenie nie wy\u015Bwietla grafiki 3D.",
      "Zamknij",
      "Kulki",
      "Podpowied\u017A",
      "Pomi\u0144 poziom",
      "Za ma\u0142o klejnot\xF3w",
      "W u\u017Cyciu"
    ]
  };

  // src/i18n/strings.js
  var STRINGS = {
    en: {
      loading: "Loading\u2026",
      level: "Level",
      levels: "Levels",
      next: "Next",
      retry: "Retry",
      settings: "Settings",
      music: "Music",
      sfx: "Sound effects",
      control: "Controls",
      ctlSwipe: "Swipe",
      ctlGrab: "Grab & turn",
      win1: "Nice!",
      win2: "Great!",
      win3: "Perfect!",
      paused: "Paused",
      tutDrag: "Drag to tilt the world",
      tutBoth: "Tilt both ways",
      tutSpikes: "Red means danger",
      tutFlip: "Turn it upside down",
      tutEdge: "Don't fall out",
      endTitle: "World complete!",
      endBody: "You finished every level. More worlds are on the way \u2014 go back for 3 stars!",
      doubleGems: "Double gems",
      adFail: "No ad available right now",
      noWebgl: "This device can't show 3D graphics.",
      close: "Close",
      skins: "Balls",
      hint: "Hint",
      skip: "Skip level",
      notEnough: "Not enough gems",
      equipped: "In use"
    },
    ar: {
      loading: "\u062C\u0627\u0631\u064D \u0627\u0644\u062A\u062D\u0645\u064A\u0644\u2026",
      level: "\u0627\u0644\u0645\u0633\u062A\u0648\u0649",
      levels: "\u0627\u0644\u0645\u0633\u062A\u0648\u064A\u0627\u062A",
      next: "\u0627\u0644\u062A\u0627\u0644\u064A",
      retry: "\u0625\u0639\u0627\u062F\u0629",
      settings: "\u0627\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A",
      music: "\u0627\u0644\u0645\u0648\u0633\u064A\u0642\u0649",
      sfx: "\u0627\u0644\u0645\u0624\u062B\u0631\u0627\u062A \u0627\u0644\u0635\u0648\u062A\u064A\u0629",
      control: "\u0627\u0644\u062A\u062D\u0643\u0645",
      ctlSwipe: "\u0633\u062D\u0628",
      ctlGrab: "\u0627\u0645\u0633\u0643 \u0648\u0644\u064F\u0641\u0651",
      win1: "\u0623\u062D\u0633\u0646\u062A!",
      win2: "\u0631\u0627\u0626\u0639!",
      win3: "\u0645\u0645\u062A\u0627\u0632!",
      paused: "\u0645\u062A\u0648\u0642\u0641 \u0645\u0624\u0642\u062A\u064B\u0627",
      tutDrag: "\u0627\u0633\u062D\u0628 \u0644\u062A\u064F\u0645\u064A\u0644 \u0627\u0644\u0639\u0627\u0644\u0645",
      tutBoth: "\u0623\u0645\u0650\u0644 \u0641\u064A \u0627\u0644\u0627\u062A\u062C\u0627\u0647\u064A\u0646",
      tutSpikes: "\u0627\u0644\u0623\u062D\u0645\u0631 \u062E\u0637\u0631",
      tutFlip: "\u0627\u0642\u0644\u0628 \u0627\u0644\u0639\u0627\u0644\u0645 \u0631\u0623\u0633\u064B\u0627 \u0639\u0644\u0649 \u0639\u0642\u0628",
      tutEdge: "\u0644\u0627 \u062A\u0633\u0642\u0637 \u0645\u0646 \u0627\u0644\u062D\u0627\u0641\u0629",
      endTitle: "\u0627\u0643\u062A\u0645\u0644 \u0627\u0644\u0639\u0627\u0644\u0645!",
      endBody: "\u0623\u0646\u0647\u064A\u062A \u0643\u0644 \u0627\u0644\u0645\u0633\u062A\u0648\u064A\u0627\u062A. \u0639\u0648\u0627\u0644\u0645 \u062C\u062F\u064A\u062F\u0629 \u0641\u064A \u0627\u0644\u0637\u0631\u064A\u0642 \u2014 \u0639\u064F\u062F \u0648\u0627\u062C\u0645\u0639 \u0663 \u0646\u062C\u0648\u0645!",
      doubleGems: "\u0636\u0627\u0639\u0641 \u0627\u0644\u062C\u0648\u0627\u0647\u0631",
      adFail: "\u0644\u0627 \u064A\u0648\u062C\u062F \u0625\u0639\u0644\u0627\u0646 \u0645\u062A\u0627\u062D \u0627\u0644\u0622\u0646",
      noWebgl: "\u0647\u0630\u0627 \u0627\u0644\u062C\u0647\u0627\u0632 \u0644\u0627 \u064A\u062F\u0639\u0645 \u0627\u0644\u0631\u0633\u0648\u0645 \u062B\u0644\u0627\u062B\u064A\u0629 \u0627\u0644\u0623\u0628\u0639\u0627\u062F.",
      close: "\u0625\u063A\u0644\u0627\u0642",
      skins: "\u0627\u0644\u0643\u0631\u0627\u062A",
      hint: "\u062A\u0644\u0645\u064A\u062D",
      skip: "\u062A\u062E\u0637\u064E\u0651 \u0627\u0644\u0645\u0633\u062A\u0648\u0649",
      notEnough: "\u0627\u0644\u062C\u0648\u0627\u0647\u0631 \u0644\u0627 \u062A\u0643\u0641\u064A",
      equipped: "\u0645\u0633\u062A\u062E\u062F\u0645\u0629"
    }
  };
  for (const [lang, row] of Object.entries(ROWS)) {
    const table = {};
    KEYS.forEach((k, i) => {
      if (row[i] !== void 0) table[k] = row[i];
    });
    STRINGS[lang] = table;
  }
  var RTL = ["ar", "he", "fa", "ur"];
  function resolveLang(tag) {
    const t = String(tag || "en").toLowerCase();
    if (STRINGS[t]) return t;
    const p = t.split(/[-_]/)[0];
    return STRINGS[p] ? p : "en";
  }
  var I18n = class {
    constructor() {
      this.lang = "en";
    }
    set(tag) {
      this.lang = resolveLang(tag);
    }
    get rtl() {
      return RTL.includes(this.lang);
    }
    t(key) {
      const v = STRINGS[this.lang][key];
      return v !== void 0 ? v : STRINGS.en[key] !== void 0 ? STRINGS.en[key] : key;
    }
    apply(root) {
      document.documentElement.lang = this.lang;
      document.documentElement.dir = this.rtl ? "rtl" : "ltr";
      root.querySelectorAll("[data-i18n]").forEach((n) => {
        n.textContent = this.t(n.getAttribute("data-i18n"));
      });
    }
  };

  // src/sim/forms.js
  var FORMS = {
    ball: { id: "ball", r: 13.5, g: 1, e: 0.42, mu: 0.02, drag: 0.45, breaks: 0, wind: 1 },
    cube: { id: "cube", r: 13, g: 1.3, e: 0.04, mu: 0.9, drag: 0.6, breaks: 1, wind: 0.35 },
    prism: { id: "prism", r: 8.5, g: 0.95, e: 0.3, mu: 0.06, drag: 0.4, breaks: 0, wind: 1 },
    feather: { id: "feather", r: 14, g: 0.4, e: 0.5, mu: 0.03, drag: 1.4, breaks: 0, wind: 3 },
    star: { id: "star", r: 14, g: 1.1, e: 0.86, mu: 0.02, drag: 0.45, breaks: 2, wind: 1 }
  };

  // src/sim/sim.js
  var DT = 1 / 120;
  var HALF = 210;
  var G = 720;
  var WMAX = 2.6;
  var KP = 14;
  var AMAX = 42;
  var VMAX = 880;
  var REST = 42;
  var HIT_EVENT = 70;
  var CRYSTAL_SPEED = 170;
  var K_BOX = 0;
  var K_CIRCLE = 1;
  var K_CAPSULE = 2;
  function pathPos(o, t, out) {
    const a = t * o.spd + o.ph;
    const sn = Math.sin(a), cs = Math.cos(a);
    out.x = o.cx + sn * o.ax;
    out.y = o.cy + cs * o.ay;
    out.vx = cs * o.spd * o.ax;
    out.vy = -sn * o.spd * o.ay;
    return out;
  }
  var _p = { x: 0, y: 0, vx: 0, vy: 0 };
  function boxDist2(px, py, b) {
    const dx = px - b.cx, dy = py - b.cy;
    const lx = dx * b.c + dy * b.s, ly = dy * b.c - dx * b.s;
    const ex = lx < -b.hw ? lx + b.hw : lx > b.hw ? lx - b.hw : 0;
    const ey = ly < -b.hh ? ly + b.hh : ly > b.hh ? ly - b.hh : 0;
    return ex * ex + ey * ey;
  }
  var Sim = class {
    /**
     * @param level  a prepared level (see levels/parse.js)
     * @param opts   { form?: string, events?: boolean }
     */
    constructor(level, opts = {}) {
      this.lvl = level;
      this.rec = opts.events !== false;
      this.events = [];
      this.setForm(opts.form || "ball");
      this.reset();
    }
    setForm(id) {
      const f = FORMS[id] || FORMS.ball;
      this.form = f;
      this.formId = f.id;
      this._damp = Math.exp(-f.drag * DT);
    }
    reset() {
      const L = this.lvl;
      this.tick = 0;
      this.angle = 0;
      this.omega = 0;
      this.target = 0;
      this.x = L.start.x;
      this.y = L.start.y;
      this.vx = 0;
      this.vy = 0;
      this.gems = 0;
      this.crys = 0;
      this.alive = true;
      this.won = false;
      this.cause = "";
      this.nx = 0;
      this.ny = 1;
      this.touch = false;
      this.air = 0;
      this.impact = 0;
      this.events.length = 0;
    }
    get time() {
      return this.tick * DT;
    }
    get gemCount() {
      let n = 0, m = this.gems;
      while (m) {
        n += m & 1;
        m >>>= 1;
      }
      return n;
    }
    _emit(t, x, y, v) {
      if (this.rec) this.events.push({ t, x, y, v });
    }
    /** Resolve one contact: push out, bounce, apply Coulomb friction. Returns impact speed. */
    _contact(nx, ny, pen, svx, svy, eMul, muMul, kick) {
      this.x += nx * pen;
      this.y += ny * pen;
      this.touch = true;
      this.nx = nx;
      this.ny = ny;
      let rvx = this.vx - svx, rvy = this.vy - svy;
      const vn = rvx * nx + rvy * ny;
      if (vn >= 0) return 0;
      const f = this.form, imp = -vn;
      let e = imp > REST ? f.e * eMul : 0;
      if (e > 1) e = 1;
      const jn = (1 + e) * imp;
      rvx += jn * nx;
      rvy += jn * ny;
      const tx = -ny, ty = nx;
      const vt = rvx * tx + rvy * ty;
      const maxF = f.mu * muMul * jn;
      const dvt = vt > maxF ? -maxF : vt < -maxF ? maxF : -vt;
      rvx += dvt * tx;
      rvy += dvt * ty;
      if (kick) {
        rvx += nx * kick;
        rvy += ny * kick;
      }
      this.vx = rvx + svx;
      this.vy = rvy + svy;
      if (imp > this.impact) this.impact = imp;
      return imp;
    }
    /** Circle-vs-solid. Returns impact (>=0) on contact, -1 when not touching. */
    _hit(s, r, svx, svy) {
      let nx, ny, pen;
      if (s.k === K_BOX) {
        const dx = this.x - s.cx, dy = this.y - s.cy;
        const lx = dx * s.c + dy * s.s, ly = dy * s.c - dx * s.s;
        const qx = lx < -s.hw ? -s.hw : lx > s.hw ? s.hw : lx;
        const qy = ly < -s.hh ? -s.hh : ly > s.hh ? s.hh : ly;
        const ex = lx - qx, ey = ly - qy, d2 = ex * ex + ey * ey;
        if (d2 >= r * r) return -1;
        let nlx, nly;
        if (d2 > 1e-9) {
          const d = Math.sqrt(d2);
          nlx = ex / d;
          nly = ey / d;
          pen = r - d;
        } else {
          const dl = lx + s.hw, dr = s.hw - lx, db = ly + s.hh, dt = s.hh - ly;
          let m = dl;
          nlx = -1;
          nly = 0;
          if (dr < m) {
            m = dr;
            nlx = 1;
            nly = 0;
          }
          if (db < m) {
            m = db;
            nlx = 0;
            nly = -1;
          }
          if (dt < m) {
            m = dt;
            nlx = 0;
            nly = 1;
          }
          pen = r + m;
        }
        nx = nlx * s.c - nly * s.s;
        ny = nlx * s.s + nly * s.c;
      } else if (s.k === K_CIRCLE) {
        const dx = this.x - s.cx, dy = this.y - s.cy, rr = r + s.r;
        const d2 = dx * dx + dy * dy;
        if (d2 >= rr * rr) return -1;
        const d = Math.sqrt(d2);
        if (d > 1e-6) {
          nx = dx / d;
          ny = dy / d;
        } else {
          nx = 0;
          ny = 1;
        }
        pen = rr - d;
      } else {
        const abx = s.bx - s.ax, aby = s.by - s.ay;
        let t = ((this.x - s.ax) * abx + (this.y - s.ay) * aby) / (abx * abx + aby * aby);
        t = t < 0 ? 0 : t > 1 ? 1 : t;
        const dx = this.x - (s.ax + abx * t), dy = this.y - (s.ay + aby * t), rr = r + s.r;
        const d2 = dx * dx + dy * dy;
        if (d2 >= rr * rr) return -1;
        const d = Math.sqrt(d2);
        if (d > 1e-6) {
          nx = dx / d;
          ny = dy / d;
        } else {
          nx = -aby;
          ny = abx;
          const l = Math.hypot(nx, ny) || 1;
          nx /= l;
          ny /= l;
        }
        pen = rr - d;
      }
      return this._contact(nx, ny, pen, svx, svy, s.e, s.mu, s.kick);
    }
    _die(cause) {
      this.alive = false;
      this.cause = cause;
      this._emit("die", this.x, this.y, 0);
    }
    /**
     * Advance one fixed tick.
     * @param u optional commanded spin in [-1, 1] (bots); players write `target` directly.
     */
    step(u) {
      if (!this.alive || this.won) return;
      const L = this.lvl, f = this.form, r = f.r;
      this.tick++;
      const t = this.tick * DT;
      if (u) this.target += u * WMAX * DT;
      let w = (this.target - this.angle) * KP;
      if (w > WMAX) w = WMAX;
      else if (w < -WMAX) w = -WMAX;
      let dw = w - this.omega;
      const am = AMAX * DT;
      if (dw > am) dw = am;
      else if (dw < -am) dw = -am;
      this.omega += dw;
      this.angle += this.omega * DT;
      const g = G * f.g;
      this.vx = (this.vx - Math.sin(this.angle) * g * DT) * this._damp;
      this.vy = (this.vy - Math.cos(this.angle) * g * DT) * this._damp;
      let sp2 = this.vx * this.vx + this.vy * this.vy;
      if (sp2 > VMAX * VMAX) {
        const k = VMAX / Math.sqrt(sp2);
        this.vx *= k;
        this.vy *= k;
        sp2 = VMAX * VMAX;
      }
      const speedIn = Math.sqrt(sp2);
      this.x += this.vx * DT;
      this.y += this.vy * DT;
      this.impact = 0;
      this.touch = false;
      const grid = L.grid, solids = L.solids, movers = L.movers, crystals = L.crystals;
      for (let pass = 0; pass < 2; pass++) {
        let ci = Math.floor((this.x - grid.min) / grid.cell), cj = Math.floor((this.y - grid.min) / grid.cell);
        ci = ci < 0 ? 0 : ci >= grid.n ? grid.n - 1 : ci;
        cj = cj < 0 ? 0 : cj >= grid.n ? grid.n - 1 : cj;
        const list = grid.lists[cj * grid.n + ci];
        for (let i = 0; i < list.length; i++) {
          const s = solids[list[i]];
          const imp = this._hit(s, r, 0, 0);
          if (imp >= 0 && s.kick && pass === 0) this._emit("bump", s.cx, s.cy, list[i]);
        }
        for (let i = 0; i < movers.length; i++) {
          const m = movers[i];
          pathPos(m, t, _p);
          m.box.cx = _p.x;
          m.box.cy = _p.y;
          this._hit(m.box, r, _p.vx, _p.vy);
        }
        for (let i = 0; i < crystals.length; i++) {
          if (this.crys & 1 << i) continue;
          const c = crystals[i];
          const imp = this._hit(c, r, 0, 0);
          if (imp >= 0 && (f.breaks === 2 || f.breaks === 1 && speedIn > CRYSTAL_SPEED)) {
            this.crys |= 1 << i;
            this._emit("shatter", c.cx, c.cy, i);
          }
        }
      }
      if (this.touch) this.air = 0;
      else this.air++;
      if (this.impact > HIT_EVENT) this._emit("hit", this.x - this.nx * r, this.y - this.ny * r, this.impact);
      const pads = L.pads;
      for (let i = 0; i < pads.length; i++) {
        const p = pads[i];
        if (boxDist2(this.x, this.y, p) < r * r) {
          const vd = this.vx * p.dx + this.vy * p.dy;
          if (vd < p.power * 0.9) {
            this.vx += (p.power - vd) * p.dx;
            this.vy += (p.power - vd) * p.dy;
            this._emit("pad", p.cx, p.cy, i);
          }
        }
      }
      const kr = r * 0.8, kills = L.kills;
      for (let i = 0; i < kills.length; i++) {
        if (boxDist2(this.x, this.y, kills[i]) < kr * kr) {
          this._die("spike");
          return;
        }
      }
      const saws = L.saws;
      for (let i = 0; i < saws.length; i++) {
        const s = saws[i];
        pathPos(s, t, _p);
        const dx = this.x - _p.x, dy = this.y - _p.y, rr = r * 0.85 + s.r;
        if (dx * dx + dy * dy < rr * rr) {
          this._die("saw");
          return;
        }
      }
      const lim = L.half + 70;
      if (this.x > lim || this.x < -lim || this.y > lim || this.y < -lim) {
        this._die("fall");
        return;
      }
      const gems = L.gems;
      for (let i = 0; i < gems.length; i++) {
        if (this.gems & 1 << i) continue;
        const dx = this.x - gems[i].x, dy = this.y - gems[i].y, rr = r + 12;
        if (dx * dx + dy * dy < rr * rr) {
          this.gems |= 1 << i;
          this._emit("gem", gems[i].x, gems[i].y, i);
        }
      }
      const gx = this.x - L.goal.x, gy = this.y - L.goal.y;
      if (gx * gx + gy * gy < L.goal.r * L.goal.r) {
        this.won = true;
        this._emit("win", L.goal.x, L.goal.y, 0);
      }
    }
    /** Compact state copy for search (level data itself is immutable). */
    snap(a) {
      a[0] = this.x;
      a[1] = this.y;
      a[2] = this.vx;
      a[3] = this.vy;
      a[4] = this.angle;
      a[5] = this.omega;
      a[6] = this.target;
      a[7] = this.tick;
      a[8] = this.gems;
      a[9] = this.crys;
      a[10] = this.air;
      return a;
    }
    restore(a) {
      this.x = a[0];
      this.y = a[1];
      this.vx = a[2];
      this.vy = a[3];
      this.angle = a[4];
      this.omega = a[5];
      this.target = a[6];
      this.tick = a[7];
      this.gems = a[8];
      this.crys = a[9];
      this.air = a[10];
      this.alive = true;
      this.won = false;
      this.cause = "";
    }
  };

  // src/render/themes.js
  var THEMES = {
    meadow: {
      dark: false,
      bg: ["#58c6ff", "#c8f2ff"],
      floorA: 16774618,
      floorB: 16772029,
      plate: 14267758,
      wallTop: 3130778,
      wallSide: 1872500,
      wallBevel: 8318160,
      ice: 12577535,
      peg: 16753981,
      pegSide: 14253076,
      bumper: 16736162,
      bumperSide: 13187192,
      spike: 16729176,
      spikeDark: 13576514,
      spikeBase: 12067900,
      gem: 16761375,
      goal: 8014847,
      goalCore: 16777215,
      mover: 10120191,
      moverSide: 7094488,
      crystal: 7332863,
      pad: 16765242,
      padArrow: 16777215,
      saw: 14673646,
      sawCore: 16729176,
      shadow: 1389135,
      shadowA: 0.2,
      ambient: 0.74,
      sun: 0.36,
      edges: 0
    },
    sunset: {
      dark: false,
      bg: ["#ff9a8b", "#ffd6a5"],
      floorA: 16773606,
      floorB: 16769228,
      plate: 14258027,
      wallTop: 16743001,
      wallSide: 13717551,
      wallBevel: 16757145,
      ice: 14086655,
      peg: 5084927,
      pegSide: 2912209,
      bumper: 9067766,
      bumperSide: 6502102,
      spike: 14753096,
      spikeDark: 10818095,
      spikeBase: 9047848,
      gem: 16765503,
      goal: 2078463,
      goalCore: 16777215,
      mover: 2864755,
      moverSide: 1804884,
      crystal: 8382207,
      pad: 16769357,
      padArrow: 16777215,
      saw: 15265266,
      sawCore: 14753096,
      shadow: 4857626,
      shadowA: 0.2,
      ambient: 0.76,
      sun: 0.34,
      edges: 0
    },
    ice: {
      dark: false,
      bg: ["#8fd3f4", "#e9f7ff"],
      floorA: 16055295,
      floorB: 14676475,
      plate: 10273754,
      wallTop: 4892927,
      wallSide: 2785238,
      wallBevel: 11130623,
      ice: 14284031,
      peg: 16757575,
      pegSide: 14256669,
      bumper: 16740270,
      bumperSide: 13582208,
      spike: 16729176,
      spikeDark: 13576514,
      spikeBase: 12067900,
      gem: 16761375,
      goal: 9133302,
      goalCore: 16777215,
      mover: 1357990,
      moverSide: 954241,
      crystal: 10875900,
      pad: 16765242,
      padArrow: 16777215,
      saw: 14673646,
      sawCore: 16729176,
      shadow: 1522526,
      shadowA: 0.2,
      ambient: 0.76,
      sun: 0.34,
      edges: 0
    },
    factory: {
      dark: false,
      bg: ["#ffb347", "#ffe29a"],
      floorA: 15986662,
      floorB: 15065041,
      plate: 9406328,
      wallTop: 5991295,
      wallSide: 4016732,
      wallBevel: 9675704,
      ice: 13627135,
      peg: 16752412,
      pegSide: 13203978,
      bumper: 16736162,
      bumperSide: 13187192,
      spike: 16726843,
      spikeDark: 13114910,
      spikeBase: 10360085,
      gem: 16761375,
      goal: 2278750,
      goalCore: 16777215,
      mover: 3900150,
      moverSide: 1925073,
      crystal: 8382207,
      pad: 16765242,
      padArrow: 4016732,
      saw: 15659766,
      sawCore: 16726843,
      shadow: 3811858,
      shadowA: 0.22,
      ambient: 0.74,
      sun: 0.36,
      edges: 0
    },
    neon: {
      dark: true,
      bg: ["#070b1f", "#1b1147"],
      floorA: 1253189,
      floorB: 989496,
      plate: 659494,
      wallTop: 1846115,
      wallSide: 1055296,
      wallBevel: 2282478,
      ice: 2776463,
      peg: 16096779,
      pegSide: 11817737,
      bumper: 16020150,
      bumperSide: 12458077,
      spike: 16727409,
      spikeDark: 13114962,
      spikeBase: 8000051,
      gem: 16436245,
      goal: 2282478,
      goalCore: 14742270,
      mover: 11032055,
      moverSide: 7020968,
      crystal: 6809849,
      pad: 16436245,
      padArrow: 988970,
      saw: 14870768,
      sawCore: 16727409,
      shadow: 0,
      shadowA: 0.35,
      ambient: 0.82,
      sun: 0.3,
      edges: 2282478
    }
  };
  function themeOf(id) {
    return THEMES[id] || THEMES.meadow;
  }

  // src/render/geo.js
  function roundRect(hw, hh, rad, seg = 3) {
    rad = Math.max(0.01, Math.min(rad, hw, hh));
    const pts = [];
    const corners = [[hw - rad, hh - rad, 0], [-(hw - rad), hh - rad, 1], [-(hw - rad), -(hh - rad), 2], [hw - rad, -(hh - rad), 3]];
    for (const [cx, cy, q] of corners) {
      for (let i = 0; i <= seg; i++) {
        const a = (q + i / seg) * Math.PI * 0.5;
        pts.push([cx + Math.cos(a) * rad, cy + Math.sin(a) * rad]);
      }
    }
    return pts;
  }
  function circlePts(r, n = 16) {
    const pts = [];
    for (let i = 0; i < n; i++) {
      const a = i / n * Math.PI * 2;
      pts.push([Math.cos(a) * r, Math.sin(a) * r]);
    }
    return pts;
  }
  function starPts(r, teeth = 10, inner = 0.74) {
    const pts = [];
    for (let i = 0; i < teeth * 2; i++) {
      const a = i / (teeth * 2) * Math.PI * 2, rr = i % 2 ? r * inner : r;
      pts.push([Math.cos(a) * rr, Math.sin(a) * rr]);
    }
    return pts;
  }
  var rgb = (hex) => [(hex >> 16 & 255) / 255, (hex >> 8 & 255) / 255, (hex & 255) / 255];
  var GeoBuilder = class {
    constructor() {
      this.p = [];
      this.n = [];
      this.c = [];
    }
    get empty() {
      return this.p.length === 0;
    }
    tri(ax, ay, az, bx, by, bz, cx, cy, cz, col) {
      const ux = bx - ax, uy = by - ay, uz = bz - az, vx = cx - ax, vy = cy - ay, vz = cz - az;
      let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
      const l = Math.hypot(nx, ny, nz) || 1;
      nx /= l;
      ny /= l;
      nz /= l;
      this.p.push(ax, ay, az, bx, by, bz, cx, cy, cz);
      this.n.push(nx, ny, nz, nx, ny, nz, nx, ny, nz);
      const k = typeof col === "number" ? rgb(col) : col;
      this.c.push(k[0], k[1], k[2], k[0], k[1], k[2], k[0], k[1], k[2]);
    }
    quad(a, b, c, d, col) {
      this.tri(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2], col);
      this.tri(a[0], a[1], a[2], c[0], c[1], c[2], d[0], d[1], d[2], col);
    }
    /** Flat polygon (fan around the centroid) facing +z. pts are local, placed at (cx,cy) rotated by (cs,sn). */
    flat(pts, cx, cy, cs, sn, z, col) {
      const n = pts.length;
      for (let i = 0; i < n; i++) {
        const a = pts[i], b = pts[(i + 1) % n];
        this.tri(cx, cy, z, cx + a[0] * cs - a[1] * sn, cy + a[0] * sn + a[1] * cs, z, cx + b[0] * cs - b[1] * sn, cy + b[0] * sn + b[1] * cs, z, col);
      }
    }
    /**
     * Extruded block with a bevelled top. `outer` and `inner` are matching outlines
     * (inner = the smaller top face). Extrudes from z0 up to z1.
     */
    prism(outer, inner, cx, cy, cs, sn, z0, z1, bevel, colTop, colSide, colBevel) {
      const n = outer.length, zb = z1 - bevel;
      const W = (p) => [cx + p[0] * cs - p[1] * sn, cy + p[0] * sn + p[1] * cs];
      for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        const o0 = W(outer[i]), o1 = W(outer[j]), i0 = W(inner[i]), i1 = W(inner[j]);
        this.tri(cx, cy, z1, i0[0], i0[1], z1, i1[0], i1[1], z1, colTop);
        this.quad([o0[0], o0[1], zb], [o1[0], o1[1], zb], [i1[0], i1[1], z1], [i0[0], i0[1], z1], colBevel);
        this.quad([o0[0], o0[1], z0], [o1[0], o1[1], z0], [o1[0], o1[1], zb], [o0[0], o0[1], zb], colSide);
      }
    }
    /** Pyramid spike: base centre (x,y,z), unit direction (dx,dy,dz), base radius, height. */
    spike(x, y, z, dx, dy, dz, rad, h, col, colDark) {
      let ux, uy, uz;
      if (Math.abs(dz) > 0.9) {
        ux = 1;
        uy = 0;
        uz = 0;
      } else {
        ux = -dy;
        uy = dx;
        uz = 0;
        const l = Math.hypot(ux, uy) || 1;
        ux /= l;
        uy /= l;
      }
      const vx = dy * uz - dz * uy, vy = dz * ux - dx * uz, vz = dx * uy - dy * ux;
      const ax = x + dx * h, ay = y + dy * h, az = z + dz * h;
      const sides = 4;
      for (let i = 0; i < sides; i++) {
        const a0 = i / sides * Math.PI * 2 + Math.PI / 4, a1 = (i + 1) / sides * Math.PI * 2 + Math.PI / 4;
        const p0 = [x + (Math.cos(a0) * ux + Math.sin(a0) * vx) * rad, y + (Math.cos(a0) * uy + Math.sin(a0) * vy) * rad, z + (Math.cos(a0) * uz + Math.sin(a0) * vz) * rad];
        const p1 = [x + (Math.cos(a1) * ux + Math.sin(a1) * vx) * rad, y + (Math.cos(a1) * uy + Math.sin(a1) * vy) * rad, z + (Math.cos(a1) * uz + Math.sin(a1) * vz) * rad];
        this.tri(p0[0], p0[1], p0[2], p1[0], p1[1], p1[2], ax, ay, az, i % 2 ? colDark : col);
      }
    }
    build() {
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.Float32BufferAttribute(this.p, 3));
      g.setAttribute("normal", new THREE.Float32BufferAttribute(this.n, 3));
      g.setAttribute("color", new THREE.Float32BufferAttribute(this.c, 3));
      return g;
    }
  };

  // src/render/fx.js
  var _m = new THREE.Matrix4();
  var _q = new THREE.Quaternion();
  var _s = new THREE.Vector3();
  var _v = new THREE.Vector3();
  var _e = new THREE.Euler();
  var _c = new THREE.Color();
  var Particles = class {
    constructor(parent, count) {
      this.count = count;
      this.mesh = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: 16777215, side: THREE.DoubleSide }), count);
      this.mesh.frustumCulled = false;
      this.mesh.renderOrder = 5;
      this.p = [];
      for (let i = 0; i < count; i++) {
        this.p.push({ life: 0, max: 1, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, rx: 0, ry: 0, rz: 0, wx: 0, wy: 0, wz: 0, size: 1, g: 0, drag: 0, grow: 0 });
        _m.makeScale(0, 0, 0);
        this.mesh.setMatrixAt(i, _m);
        this.mesh.setColorAt(i, _c.setHex(16777215));
      }
      this.next = 0;
      parent.add(this.mesh);
      this.rings = [];
      const rg = new THREE.RingGeometry(0.82, 1, 28);
      for (let i = 0; i < 5; i++) {
        const m = new THREE.Mesh(rg, new THREE.MeshBasicMaterial({ color: 16777215, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }));
        m.visible = false;
        m.renderOrder = 6;
        parent.add(m);
        this.rings.push({ m, life: 0, max: 1, r0: 1, r1: 1 });
      }
      this.ringNext = 0;
    }
    spawn(o) {
      const p = this.p[this.next];
      const i = this.next;
      this.next = (this.next + 1) % this.count;
      p.life = p.max = o.life || 0.6;
      p.x = o.x;
      p.y = o.y;
      p.z = o.z === void 0 ? 14 : o.z;
      p.vx = o.vx || 0;
      p.vy = o.vy || 0;
      p.vz = o.vz || 0;
      p.rx = Math.random() * 6.28;
      p.ry = Math.random() * 6.28;
      p.rz = Math.random() * 6.28;
      const spin = o.spin === void 0 ? 8 : o.spin;
      p.wx = (Math.random() - 0.5) * spin;
      p.wy = (Math.random() - 0.5) * spin;
      p.wz = (Math.random() - 0.5) * spin;
      p.size = o.size || 4;
      p.g = o.g === void 0 ? 0 : o.g;
      p.drag = o.drag || 0;
      p.grow = o.grow || 0;
      if (o.flat) {
        p.rx = 0;
        p.ry = 0;
        p.wx = 0;
        p.wy = 0;
      }
      this.mesh.setColorAt(i, _c.setHex(o.color === void 0 ? 16777215 : o.color));
      this.mesh.instanceColor.needsUpdate = true;
    }
    /** Radial burst. opts: { n, speed, color | colors[], size, life, g, z } */
    burst(x, y, o = {}) {
      const n = o.n || 14, sp = o.speed || 160;
      for (let i = 0; i < n; i++) {
        const a = Math.random() * 6.283, v = sp * (0.35 + Math.random() * 0.75);
        this.spawn({
          x,
          y,
          z: o.z,
          vx: Math.cos(a) * v + (o.vx || 0),
          vy: Math.sin(a) * v + (o.vy || 0),
          vz: (Math.random() - 0.2) * sp * 0.5,
          color: o.colors ? o.colors[i % o.colors.length] : o.color,
          size: (o.size || 4) * (0.6 + Math.random() * 0.8),
          life: (o.life || 0.6) * (0.7 + Math.random() * 0.6),
          g: o.g,
          drag: o.drag === void 0 ? 1.6 : o.drag
        });
      }
    }
    ring(x, y, color, r0 = 6, r1 = 46, life = 0.35) {
      const r = this.rings[this.ringNext];
      this.ringNext = (this.ringNext + 1) % this.rings.length;
      r.life = r.max = life;
      r.r0 = r0;
      r.r1 = r1;
      r.m.position.set(x, y, 16);
      r.m.material.color.setHex(color);
      r.m.visible = true;
    }
    /** @param gx,gy arena-local gravity direction (unit) so debris falls "screen-down" */
    update(dt, gx, gy) {
      const ps = this.p;
      for (let i = 0; i < ps.length; i++) {
        const p = ps[i];
        if (p.life <= 0) continue;
        p.life -= dt;
        if (p.life <= 0) {
          _m.makeScale(0, 0, 0);
          this.mesh.setMatrixAt(i, _m);
          continue;
        }
        if (p.g) {
          p.vx += gx * p.g * dt;
          p.vy += gy * p.g * dt;
        }
        if (p.drag) {
          const k = Math.max(0, 1 - p.drag * dt);
          p.vx *= k;
          p.vy *= k;
          p.vz *= k;
        }
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.z += p.vz * dt;
        p.rx += p.wx * dt;
        p.ry += p.wy * dt;
        p.rz += p.wz * dt;
        const t = p.life / p.max;
        const s = p.size * (p.grow ? 1 + (1 - t) * p.grow : 1) * (t < 0.5 ? t * 2 : 1);
        _e.set(p.rx, p.ry, p.rz);
        _q.setFromEuler(_e);
        _s.set(s, s, s);
        _v.set(p.x, p.y, p.z);
        _m.compose(_v, _q, _s);
        this.mesh.setMatrixAt(i, _m);
      }
      this.mesh.instanceMatrix.needsUpdate = true;
      for (const r of this.rings) {
        if (r.life <= 0) continue;
        r.life -= dt;
        if (r.life <= 0) {
          r.m.visible = false;
          continue;
        }
        const t = 1 - r.life / r.max, s = r.r0 + (r.r1 - r.r0) * (1 - (1 - t) * (1 - t));
        r.m.scale.set(s, s, 1);
        r.m.material.opacity = (1 - t) * 0.85;
      }
    }
    clear() {
      for (let i = 0; i < this.p.length; i++) {
        this.p[i].life = 0;
        _m.makeScale(0, 0, 0);
        this.mesh.setMatrixAt(i, _m);
      }
      this.mesh.instanceMatrix.needsUpdate = true;
      for (const r of this.rings) {
        r.life = 0;
        r.m.visible = false;
      }
    }
  };

  // src/render/skins.js
  var SKINS = [
    { id: "classic", cost: 0, a: "#ff7a1a", b: "#ffffff", kind: "wedge", n: 6, trail: 16753229 },
    { id: "mint", cost: 30, a: "#12c8a0", b: "#ffffff", kind: "wedge", n: 8, trail: 7336146 },
    { id: "berry", cost: 45, a: "#ff3d81", b: "#ffe3ee", kind: "swirl", n: 5, trail: 16747445 },
    { id: "ocean", cost: 60, a: "#1e7bff", b: "#bfe2ff", kind: "rings", n: 4, trail: 8239359 },
    { id: "bee", cost: 80, a: "#ffd21f", b: "#2b2b2b", kind: "wedge", n: 10, trail: 16770155 },
    { id: "melon", cost: 100, a: "#2fb344", b: "#0f7a2a", kind: "wedge", n: 12, trail: 9167503, core: "#ff5a6e" },
    { id: "eight", cost: 120, a: "#20232e", b: "#ffffff", kind: "dot", n: 1, trail: 10134456 },
    { id: "target", cost: 150, a: "#e11d48", b: "#ffffff", kind: "rings", n: 5, trail: 16747683 },
    { id: "galaxy", cost: 200, a: "#5b21b6", b: "#22d3ee", kind: "swirl", n: 3, trail: 10980346, stars: true },
    { id: "gold", cost: 300, a: "#ffbf00", b: "#fff3b0", kind: "swirl", n: 7, trail: 16769162 }
  ];
  function skinById(id) {
    return SKINS.find((s) => s.id === id) || SKINS[0];
  }
  var cache = /* @__PURE__ */ new Map();
  function skinTexture(id) {
    if (cache.has(id)) return cache.get(id);
    const s = skinById(id), W = 256, H = 128;
    const cv = document.createElement("canvas");
    cv.width = W;
    cv.height = H;
    const g = cv.getContext("2d");
    g.fillStyle = s.b;
    g.fillRect(0, 0, W, H);
    g.fillStyle = s.a;
    if (s.kind === "wedge") {
      const w = W / s.n;
      for (let i = 0; i < s.n; i += 2) g.fillRect(i * w, 0, w, H);
    } else if (s.kind === "swirl") {
      const w = W / s.n;
      for (let i = 0; i < s.n; i++) {
        g.beginPath();
        g.moveTo(i * w, 0);
        g.lineTo(i * w + w * 0.5, 0);
        g.lineTo(i * w + w * 1.5, H);
        g.lineTo(i * w + w, H);
        g.closePath();
        g.fill();
        g.beginPath();
        g.moveTo(i * w - W, 0);
        g.lineTo(i * w + w * 0.5 - W, 0);
        g.lineTo(i * w + w * 1.5 - W, H);
        g.lineTo(i * w + w - W, H);
        g.closePath();
        g.fill();
      }
    } else if (s.kind === "rings") {
      const band = H / 2 / (s.n * 2 - 1);
      for (let i = 0; i < s.n; i++) {
        g.fillRect(0, i * 2 * band, W, band);
        g.fillRect(0, H - (i * 2 + 1) * band, W, band);
      }
    } else if (s.kind === "dot") {
      g.fillRect(0, 0, W, H);
      g.fillStyle = s.b;
      g.fillRect(0, 0, W, H * 0.2);
      g.fillStyle = s.a;
      g.fillRect(W * 0.42, H * 0.04, W * 0.16, H * 0.09);
      g.fillStyle = s.b;
      g.fillRect(0, H * 0.8, W, H * 0.2);
    }
    if (s.core) {
      g.fillStyle = s.core;
      g.fillRect(0, 0, W, H * 0.16);
    }
    if (s.stars) {
      g.fillStyle = "#ffffff";
      for (let i = 0; i < 40; i++) {
        const x = i * 97 % W, y = i * 53 % H;
        g.fillRect(x, y, 2, 2);
      }
    }
    const tex = new THREE.CanvasTexture(cv);
    tex.wrapS = THREE.RepeatWrapping;
    tex.anisotropy = 4;
    cache.set(id, tex);
    return tex;
  }
  function skinSwatch(id) {
    const s = skinById(id);
    return `conic-gradient(from 0deg, ${Array.from({ length: s.n * 2 }, (_, i) => `${i % 2 ? s.b : s.a} ${i / (s.n * 2) * 100}% ${(i + 1) / (s.n * 2) * 100}%`).join(", ")})`;
  }

  // src/render/view.js
  var WALL_H = 24;
  var FOV = 30;
  var PITCH = 0.1;
  var FIT_R = 274;
  var SHX = 7;
  var SHY = -11;
  var INTRO = 0.28;
  var P = { x: 0, y: 0, vx: 0, vy: 0 };
  function shade(hex, k) {
    const r = Math.min(255, (hex >> 16 & 255) * k) | 0, g = Math.min(255, (hex >> 8 & 255) * k) | 0, b = Math.min(255, (hex & 255) * k) | 0;
    return r << 16 | g << 8 | b;
  }
  var css = (hex) => "#" + hex.toString(16).padStart(6, "0");
  function detectTier() {
    const ua = navigator.userAgent || "";
    const mobile = /Android|iPhone|iPad|iPod|Mobile/i.test(ua) || navigator.maxTouchPoints > 1 && Math.min(screen.width, screen.height) < 820;
    const cores = navigator.hardwareConcurrency || 4, mem = navigator.deviceMemory || 4;
    if (mobile && (cores <= 4 || mem <= 3)) return 0;
    return mobile ? 1 : 2;
  }
  function glowTexture() {
    const cv = document.createElement("canvas");
    cv.width = cv.height = 64;
    const g = cv.getContext("2d"), gr = g.createRadialGradient(32, 32, 2, 32, 32, 32);
    gr.addColorStop(0, "rgba(255,255,255,1)");
    gr.addColorStop(0.45, "rgba(255,255,255,.35)");
    gr.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = gr;
    g.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(cv);
  }
  function swirlTexture(colHex, coreHex) {
    const S = 128, cv = document.createElement("canvas");
    cv.width = cv.height = S;
    const g = cv.getContext("2d"), gr = g.createRadialGradient(S / 2, S / 2, 4, S / 2, S / 2, S / 2);
    gr.addColorStop(0, css(coreHex));
    gr.addColorStop(0.55, css(colHex));
    gr.addColorStop(1, css(shade(colHex, 0.55)));
    g.fillStyle = gr;
    g.beginPath();
    g.arc(S / 2, S / 2, S / 2, 0, 6.3);
    g.fill();
    g.strokeStyle = "rgba(255,255,255,.85)";
    g.lineWidth = 5;
    g.lineCap = "round";
    for (let arm = 0; arm < 3; arm++) {
      g.beginPath();
      for (let i = 0; i <= 40; i++) {
        const t = i / 40, a = arm * 2.094 + t * 4.4, r = 6 + t * (S / 2 - 12);
        const x = S / 2 + Math.cos(a) * r, y = S / 2 + Math.sin(a) * r;
        if (i) g.lineTo(x, y);
        else g.moveTo(x, y);
      }
      g.stroke();
    }
    return new THREE.CanvasTexture(cv);
  }
  var View = class {
    constructor(stage, tier) {
      this.stage = stage;
      this.tier = tier;
      const r = this.renderer = new THREE.WebGLRenderer({ antialias: tier > 0, alpha: true, powerPreference: "high-performance" });
      r.setClearColor(0, 0);
      this.pr = Math.min(window.devicePixelRatio || 1, [1.5, 2, 2][tier]);
      r.setPixelRatio(this.pr);
      stage.appendChild(r.domElement);
      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(FOV, 1, 20, 4e3);
      this.amb = new THREE.AmbientLight(16777215, 0.75);
      this.sun = new THREE.DirectionalLight(16777215, 0.35);
      this.sun.position.set(-0.45, 0.7, 1);
      this.scene.add(this.amb, this.sun);
      this.world = new THREE.Group();
      this.scene.add(this.world);
      this.level = new THREE.Group();
      this.world.add(this.level);
      this.matStatic = new THREE.MeshLambertMaterial({ vertexColors: true });
      this.matShadow = new THREE.MeshBasicMaterial({ color: 0, transparent: true, opacity: 0.2, depthWrite: false });
      this.matGem = new THREE.MeshPhongMaterial({ color: 16761375, emissive: 8014336, shininess: 90, specular: 16777215, flatShading: true });
      this.matCrystal = new THREE.MeshPhongMaterial({ color: 7332863, transparent: true, opacity: 0.62, shininess: 100, specular: 16777215 });
      this.gemGeo = new THREE.OctahedronGeometry(10, 0);
      this.glowTex = glowTexture();
      this.fx = new Particles(this.world, [60, 110, 180][tier]);
      this._buildBall();
      this.insets = { top: 56, bottom: 76, left: 0, right: 0 };
      this.zoom = 1;
      this.zoomTo = 1;
      this.shake = 0;
      this.squash = 0;
      this.spin = 0;
      this.spinV = 0;
      this.ballScale = 1;
      this.trailT = 0;
      this.items = null;
      this.theme = themeOf("meadow");
      this.skin = skinById("classic");
      this.resize();
    }
    get canvas() {
      return this.renderer.domElement;
    }
    _buildBall() {
      this.ball = new THREE.Group();
      this.ballSq = new THREE.Group();
      this.ballUn = new THREE.Group();
      this.ballSpin = new THREE.Group();
      const seg = this.tier > 0 ? 28 : 18;
      this.ballMat = new THREE.MeshPhongMaterial({ map: skinTexture("classic"), shininess: 70, specular: 6710886 });
      this.ballMesh = new THREE.Mesh(new THREE.SphereGeometry(1, seg, Math.round(seg * 0.7)), this.ballMat);
      this.ballMesh.rotation.x = Math.PI / 2;
      this.ballSpin.add(this.ballMesh);
      this.ballUn.add(this.ballSpin);
      this.ballSq.add(this.ballUn);
      this.ball.add(this.ballSq);
      this.ballShadow = new THREE.Mesh(new THREE.CircleGeometry(1, 20), this.matShadow);
      this.world.add(this.ballShadow, this.ball);
    }
    setSkin(id) {
      this.skin = skinById(id);
      this.ballMat.map = skinTexture(this.skin.id);
      this.ballMat.needsUpdate = true;
    }
    _disposeLevel() {
      const g = this.level;
      for (let i = g.children.length - 1; i >= 0; i--) {
        const m = g.children[i];
        g.remove(m);
        m.traverse((o) => {
          if (o.geometry && o.geometry !== this.gemGeo) o.geometry.dispose();
          if (o.userData.ownMat) {
            if (o.material.map && o.material.map !== this.glowTex) o.material.map.dispose();
            o.material.dispose();
          }
        });
      }
      this.fx.clear();
    }
    /** Build all meshes for a compiled level. */
    build(L) {
      const T = this.theme = themeOf(L.theme);
      this._disposeLevel();
      this.amb.intensity = T.ambient;
      this.sun.intensity = T.sun;
      this.matShadow.color.setHex(T.shadow);
      this.matShadow.opacity = T.shadowA;
      this.matGem.color.setHex(T.gem);
      this.matCrystal.color.setHex(T.crystal);
      const gb = new GeoBuilder(), sh = new GeoBuilder(), H = WALL_H, edges = [];
      const outline = (pts, cx, cy, cs2, sn, z) => {
        for (let i = 0; i < pts.length; i++) {
          const a = pts[i], b = pts[(i + 1) % pts.length];
          edges.push(cx + a[0] * cs2 - a[1] * sn, cy + a[0] * sn + a[1] * cs2, z, cx + b[0] * cs2 - b[1] * sn, cy + b[0] * sn + b[1] * cs2, z);
        }
      };
      const n = 14, cs = 2 * HALF / n;
      for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
        const x0 = -HALF + i * cs, y0 = -HALF + j * cs;
        gb.quad([x0, y0, 0], [x0 + cs, y0, 0], [x0 + cs, y0 + cs, 0], [x0, y0 + cs, 0], (i + j) % 2 ? T.floorA : T.floorB);
      }
      const sq = roundRect(HALF, HALF, 1, 1);
      gb.prism(sq, sq, 0, 0, 1, 0, -14, -0.05, 0, T.plate, T.plate, T.plate);
      const rows = L.rows, N = L.n;
      const isCh = (c, r, ch) => r >= 0 && c >= 0 && r < N && c < N && rows[r][c] === ch;
      for (const s of L.solids) {
        if (s.k === K_BOX) {
          let hw = s.hw, hh = s.hh, cx = s.cx, cy = s.cy;
          const rad = 3.2, ext = rad + 0.6;
          if (s.rc) {
            const { c0, c1, r0, r1 } = s.rc, ch = s.ice ? "=" : "#";
            let up = true, dn = true, lf = true, rt = true;
            for (let c = c0; c <= c1; c++) {
              if (!isCh(c, r0 - 1, ch)) up = false;
              if (!isCh(c, r1 + 1, ch)) dn = false;
            }
            for (let r = r0; r <= r1; r++) {
              if (!isCh(c0 - 1, r, ch)) lf = false;
              if (!isCh(c1 + 1, r, ch)) rt = false;
            }
            if (up) {
              hh += ext / 2;
              cy += ext / 2;
            }
            if (dn) {
              hh += ext / 2;
              cy -= ext / 2;
            }
            if (lf) {
              hw += ext / 2;
              cx -= ext / 2;
            }
            if (rt) {
              hw += ext / 2;
              cx += ext / 2;
            }
          }
          const o = roundRect(hw, hh, rad, 3), inn = roundRect(hw - 1.8, hh - 1.8, rad - 1.2, 3);
          if (s.ice) gb.prism(o, inn, cx, cy, s.c, s.s, 0, H, 2, T.ice, shade(T.ice, 0.78), 16777215);
          else gb.prism(o, inn, cx, cy, s.c, s.s, 0, H, 2, T.wallTop, T.wallSide, T.wallBevel);
          sh.flat(o, cx, cy, s.c, s.s, 0.5, 0);
          if (T.edges) outline(inn, cx, cy, s.c, s.s, H + 0.4);
        } else if (s.k === K_CIRCLE) {
          const o = circlePts(s.r, 16), inn = circlePts(s.r - 2.2, 16);
          if (s.bumper) gb.prism(o, inn, s.cx, s.cy, 1, 0, 0, H + 5, 2.5, T.bumper, T.bumperSide, 16777215);
          else gb.prism(o, inn, s.cx, s.cy, 1, 0, 0, H, 2, T.peg, T.pegSide, shade(T.peg, 1.2));
          sh.flat(o, s.cx, s.cy, 1, 0, 0.5, 0);
          if (T.edges) outline(inn, s.cx, s.cy, 1, 0, (s.bumper ? H + 5 : H) + 0.4);
        } else {
          const dx = s.bx - s.ax, dy = s.by - s.ay, len = Math.hypot(dx, dy), c2 = dx / len, s2 = dy / len;
          const o = roundRect(len / 2 + s.r, s.r, s.r, 4), inn = roundRect(len / 2 + s.r - 1.8, s.r - 1.8, s.r - 1.8, 4);
          gb.prism(o, inn, s.cx, s.cy, c2, s2, 0, H, 2, T.wallTop, T.wallSide, T.wallBevel);
          sh.flat(o, s.cx, s.cy, c2, s2, 0.5, 0);
          if (T.edges) outline(inn, s.cx, s.cy, c2, s2, H + 0.4);
        }
      }
      for (const k of L.kills) {
        const hw = k.hw + 1.5, hh = k.hh + 1.5, o = roundRect(hw, hh, 1.5, 1);
        gb.prism(o, o, k.cx, k.cy, 1, 0, 0, 1.4, 0, T.spikeBase, T.spikeBase, T.spikeBase);
        if (k.dx || k.dy) {
          const along = k.dx ? hh : hw, depth = (k.dx ? hw : hh) * 2;
          const count = Math.max(1, Math.round(along * 2 / 10));
          for (let i = 0; i < count; i++) {
            const t = ((i + 0.5) / count - 0.5) * along * 2;
            const bx = k.cx - k.dx * (depth / 2) + (k.dx ? 0 : t), by = k.cy - k.dy * (depth / 2) + (k.dy ? 0 : t);
            gb.spike(bx, by, H * 0.5, k.dx, k.dy, 0, Math.min(7.5, along / count * 1.25), depth, T.spike, T.spikeDark);
          }
        } else {
          const nx = Math.max(1, Math.round(hw * 2 / 11)), ny = Math.max(1, Math.round(hh * 2 / 11));
          for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
            gb.spike(k.cx + ((i + 0.5) / nx - 0.5) * hw * 2, k.cy + ((j + 0.5) / ny - 0.5) * hh * 2, 1, 0, 0, 1, 5.5, H * 0.85, T.spike, T.spikeDark);
          }
        }
      }
      for (const p of L.pads) {
        const o = roundRect(p.hw, p.hh, 2.5, 2);
        gb.prism(o, roundRect(p.hw - 1.5, p.hh - 1.5, 2, 2), p.cx, p.cy, 1, 0, 0, 5, 1.5, T.pad, shade(T.pad, 0.72), 16777215);
        const m = Math.min(p.hw, p.hh) * 0.75, px = -p.dy, py = p.dx;
        gb.tri(p.cx - p.dx * m * 0.5 - px * m, p.cy - p.dy * m * 0.5 - py * m, 5.3, p.cx - p.dx * m * 0.5 + px * m, p.cy - p.dy * m * 0.5 + py * m, 5.3, p.cx + p.dx * m, p.cy + p.dy * m, 5.3, T.padArrow);
      }
      this.hint = null;
      this.staticMesh = new THREE.Mesh(gb.build(), this.matStatic);
      this.shadowMesh = new THREE.Mesh(sh.build(), this.matShadow);
      this.shadowMesh.renderOrder = 1;
      this.level.add(this.staticMesh, this.shadowMesh);
      if (T.edges && edges.length) {
        const eg = new THREE.BufferGeometry();
        eg.setAttribute("position", new THREE.Float32BufferAttribute(edges, 3));
        const lines = new THREE.LineSegments(eg, new THREE.LineBasicMaterial({ color: T.edges }));
        lines.userData.ownMat = true;
        this.level.add(lines);
      }
      const it = this.items = { movers: [], saws: [], gems: [], crystals: [], goal: null };
      for (const m of L.movers) {
        const b = new GeoBuilder(), o = roundRect(m.hw, m.hh, 3, 3);
        b.prism(o, roundRect(m.hw - 1.8, m.hh - 1.8, 2, 3), 0, 0, 1, 0, 0, H, 2, T.mover, T.moverSide, 16777215);
        const mesh = new THREE.Mesh(b.build(), this.matStatic);
        const sb = new GeoBuilder();
        sb.flat(o, 0, 0, 1, 0, 0.6, 0);
        const shadow = new THREE.Mesh(sb.build(), this.matShadow);
        this.level.add(mesh, shadow);
        it.movers.push({ d: m, mesh, shadow });
      }
      for (const w of L.saws) {
        const b = new GeoBuilder(), o = starPts(w.r, 10, 0.76);
        b.prism(o, starPts(w.r - 1.2, 10, 0.76), 0, 0, 1, 0, 6, 12, 1, T.saw, shade(T.saw, 0.7), 16777215);
        b.prism(circlePts(w.r * 0.36, 12), circlePts(w.r * 0.3, 12), 0, 0, 1, 0, 12, 14, 1, T.sawCore, shade(T.sawCore, 0.7), T.sawCore);
        const mesh = new THREE.Mesh(b.build(), this.matStatic);
        const sb = new GeoBuilder();
        sb.flat(circlePts(w.r * 0.9, 14), 0, 0, 1, 0, 0.6, 0);
        const shadow = new THREE.Mesh(sb.build(), this.matShadow);
        this.level.add(mesh, shadow);
        it.saws.push({ d: w, mesh, shadow });
      }
      L.gems.forEach((gm, i) => {
        const mesh = new THREE.Mesh(this.gemGeo, this.matGem);
        mesh.scale.set(0.85, 1.2, 0.85);
        mesh.rotation.order = "ZYX";
        mesh.position.set(gm.x, gm.y, 13);
        const halo2 = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.MeshBasicMaterial({ map: this.glowTex, color: T.gem, transparent: true, opacity: T.dark ? 0.55 : 0.75, depthWrite: false }));
        halo2.userData.ownMat = true;
        halo2.position.set(gm.x, gm.y, 2);
        halo2.renderOrder = 2;
        this.level.add(halo2, mesh);
        it.gems.push({ mesh, halo: halo2, i });
      });
      L.crystals.forEach((c, i) => {
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(c.hw * 2, c.hh * 2, H), this.matCrystal);
        mesh.position.set(c.cx, c.cy, H / 2);
        mesh.renderOrder = 3;
        this.level.add(mesh);
        it.crystals.push({ mesh, i });
      });
      const goal = new THREE.Group();
      goal.position.set(L.goal.x, L.goal.y, 0);
      const halo = new THREE.Mesh(new THREE.PlaneGeometry(78, 78), new THREE.MeshBasicMaterial({ map: this.glowTex, color: T.goal, transparent: true, opacity: 0.85, depthWrite: false }));
      halo.userData.ownMat = true;
      halo.position.z = 1.5;
      halo.renderOrder = 2;
      const swirl = new THREE.Mesh(new THREE.CircleGeometry(12, 28), new THREE.MeshBasicMaterial({ map: swirlTexture(T.goal, T.goalCore) }));
      swirl.userData.ownMat = true;
      swirl.position.z = 3;
      const ring = new THREE.Mesh(new THREE.TorusGeometry(13, 2.9, 10, 32), new THREE.MeshLambertMaterial({ color: T.goal, emissive: shade(T.goal, 0.35) }));
      ring.userData.ownMat = true;
      ring.position.z = 5;
      goal.add(halo, swirl, ring);
      this.level.add(goal);
      it.goal = { group: goal, swirl, ring, halo };
      this.squash = 0;
      this.spinV = 0;
      this.ballScale = 1;
      this.shake = 0;
      this.zoomTo = 1;
      this.ball.visible = true;
      this.ballShadow.visible = true;
      this.intro = INTRO;
    }
    /** Dotted route to the goal (the solver's path), shown after repeated failures. */
    showHint(path) {
      this.hideHint();
      if (!path || path.length < 2) return;
      const pts = [], step = 13;
      let carry = 0;
      for (let i = 1; i < path.length; i++) {
        const ax = path[i - 1][0], ay = path[i - 1][1], bx = path[i][0], by = path[i][1], len = Math.hypot(bx - ax, by - ay);
        if (len < 1e-6) continue;
        let d = carry;
        while (d < len) {
          const t = d / len;
          pts.push(ax + (bx - ax) * t, ay + (by - ay) * t, 9);
          d += step;
        }
        carry = d - len;
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
      const m = new THREE.PointsMaterial({ map: this.glowTex, color: this.theme.dark ? 16777215 : 6962672, size: 10 * this.pr, sizeAttenuation: false, transparent: true, opacity: 0.85, depthWrite: false });
      this.hint = new THREE.Points(g, m);
      this.hint.userData.ownMat = true;
      this.hint.renderOrder = 4;
      this.level.add(this.hint);
    }
    hideHint() {
      if (!this.hint) return;
      this.level.remove(this.hint);
      this.hint.geometry.dispose();
      this.hint.material.dispose();
      this.hint = null;
    }
    /** Lower the rendering cost at runtime (called when the frame rate is poor). Returns false if already minimal. */
    degrade() {
      if (this.pr <= 1) return false;
      this.pr = Math.max(1, this.pr - 0.5);
      this.renderer.setPixelRatio(this.pr);
      this.renderer.setSize(this.W, this.H, false);
      return true;
    }
    resize() {
      const W = Math.max(1, this.stage.clientWidth), H = Math.max(1, this.stage.clientHeight);
      this.W = W;
      this.H = H;
      this.renderer.setSize(W, H, false);
      const cam = this.camera;
      cam.aspect = W / H;
      const t = Math.tan(FOV * Math.PI / 360), ins = this.insets;
      const fv = Math.max(0.3, (H - ins.top - ins.bottom) / H), fh = Math.max(0.3, (W - ins.left - ins.right) / W);
      const D = Math.max(FIT_R / (t * fv), FIT_R / (t * cam.aspect * fh)) * 1.03;
      const upp = 2 * D * t / H;
      this.camTo = { D, lx: (ins.right - ins.left) / 2 * upp, ly: (ins.top - ins.bottom) / 2 * upp };
      if (!this.cam) this.cam = { ...this.camTo };
      cam.updateProjectionMatrix();
      this._placeCamera(0, 0);
    }
    _placeCamera(sx, sy) {
      const { D, lx, ly } = this.cam, z = this.zoom;
      this.camera.position.set(lx + sx, ly - Math.sin(PITCH) * D * z + sy, Math.cos(PITCH) * D * z);
      this.camera.lookAt(lx, ly, 0);
    }
    /** Arena-local point -> CSS pixels inside the stage. */
    toScreen(x, y, z = 0) {
      const v = new THREE.Vector3(x, y, z).applyMatrix4(this.world.matrixWorld).project(this.camera);
      return { x: (v.x * 0.5 + 0.5) * this.W, y: (-v.y * 0.5 + 0.5) * this.H };
    }
    // ---- effects (called by the game on sim events) ----
    fxHit(x, y, v) {
      this.squash = Math.max(this.squash, Math.min(0.34, v / 1500));
      if (v > 260) this.shake = Math.max(this.shake, Math.min(5, v / 220));
      if (v > 170 && this.tier > 0) this.fx.burst(x, y, { n: Math.min(8, 2 + v / 130 | 0), speed: v * 0.35, color: this.theme.dark ? 10466559 : 16777215, size: 3.2, life: 0.32, z: 10 });
    }
    fxGem(x, y) {
      this.fx.burst(x, y, { n: this.tier ? 16 : 9, speed: 190, colors: [this.theme.gem, 16777215, shade(this.theme.gem, 1.2)], size: 4.4, life: 0.55 });
      this.fx.ring(x, y, this.theme.gem, 8, 44, 0.32);
    }
    fxDie(x, y) {
      this.shake = 9;
      this.fx.burst(x, y, { n: this.tier ? 26 : 14, speed: 280, colors: [this.theme.spike, 16777215, skinTrail(this.skin)], size: 5.5, life: 0.7, g: 520 });
      this.fx.ring(x, y, this.theme.spike, 10, 70, 0.4);
    }
    fxWin(x, y) {
      this.zoomTo = 0.94;
      this.fx.ring(x, y, this.theme.goal, 14, 110, 0.55);
      const cols = [16731501, 16761375, 4054167, 5090303, 11566079, 16777215];
      this.fx.burst(x, y, { n: this.tier ? 46 : 22, speed: 330, colors: cols, size: 6, life: 1.25, g: 380, drag: 0.9 });
    }
    fxBump(x, y) {
      this.fx.ring(x, y, this.theme.bumper, 14, 40, 0.25);
      this.shake = Math.max(this.shake, 2.5);
    }
    fxShatter(x, y) {
      this.shake = 7;
      this.fx.burst(x, y, { n: 22, speed: 300, colors: [this.theme.crystal, 16777215], size: 6, life: 0.7, g: 500 });
    }
    fxPad(x, y) {
      this.fx.ring(x, y, this.theme.pad, 8, 36, 0.25);
    }
    /** Draw one frame. `t` seconds (wall clock), `dt` frame time. */
    draw(sim, t, dt) {
      const it = this.items, ang = sim.angle, f = sim.form, r = f.r;
      this.world.rotation.z = ang;
      const c = Math.cos(ang), s = Math.sin(ang);
      const ox = SHX * c + SHY * s, oy = -SHX * s + SHY * c;
      this.shadowMesh.position.set(ox, oy, 0);
      for (const m of it.movers) {
        pathPos(m.d, sim.time, P);
        m.mesh.position.set(P.x, P.y, 0);
        m.shadow.position.set(P.x + ox, P.y + oy, 0);
      }
      for (const w of it.saws) {
        pathPos(w.d, sim.time, P);
        w.mesh.position.set(P.x, P.y, 0);
        w.mesh.rotation.z -= dt * 9;
        w.shadow.position.set(P.x + ox, P.y + oy, 0);
      }
      for (const g of it.gems) {
        const on = !(sim.gems & 1 << g.i);
        g.mesh.visible = on;
        g.halo.visible = on;
        if (on) {
          g.mesh.rotation.y = t * 2.4 + g.i * 2;
          g.mesh.rotation.z = -ang;
          g.mesh.position.z = 14 + Math.sin(t * 3 + g.i) * 2;
          const k2 = 1 + Math.sin(t * 4 + g.i) * 0.08;
          g.halo.scale.set(k2, k2, 1);
        }
      }
      for (const cr of it.crystals) cr.mesh.visible = !(sim.crys & 1 << cr.i);
      const go = it.goal;
      go.swirl.rotation.z = -t * 2.6;
      const gk = 1 + Math.sin(t * 3.2) * 0.05;
      go.ring.scale.set(gk, gk, 1);
      go.halo.scale.set(gk * 1.05, gk * 1.05, 1);
      const bs = this.ballScale;
      this.ball.position.set(sim.x, sim.y, r);
      if (sim.air < 3) this.spinV = (sim.nx * sim.vy - sim.ny * sim.vx) / r;
      else this.spinV *= Math.max(0, 1 - 0.5 * dt);
      this.spin += this.spinV * dt;
      this.ballSpin.rotation.z = this.spin;
      this.squash *= Math.exp(-dt * 13);
      const a = Math.atan2(sim.ny, sim.nx), k = this.squash;
      this.ballSq.rotation.z = a;
      this.ballUn.rotation.z = -a;
      this.ballSq.scale.set(r * (1 - k) * bs, r * (1 + k * 0.7) * bs, r * bs);
      this.ballShadow.position.set(sim.x + ox * 1.1, sim.y + oy * 1.1, 0.7);
      this.ballShadow.scale.set(r * 1.02 * bs, r * 1.02 * bs, 1);
      if (this.ball.visible && sim.alive && !sim.won) {
        const sp = Math.hypot(sim.vx, sim.vy);
        this.trailT -= dt;
        if (sp > 150 && this.trailT <= 0) {
          this.trailT = this.tier ? 0.03 : 0.06;
          this.fx.spawn({ x: sim.x, y: sim.y, z: r * 0.6, size: r * 1.25, life: 0.22, color: skinTrail(this.skin), flat: true, spin: 0 });
        }
      }
      this.fx.update(dt, -s, -c);
      if (this.hint) this.hint.material.opacity = 0.6 + 0.3 * Math.sin(t * 5);
      if (this.intro > 0) {
        this.intro = Math.max(0, this.intro - dt);
        const q = 1 - this.intro / INTRO, e = 1 - Math.pow(1 - q, 3);
        this.world.scale.setScalar(0.86 + 0.14 * e);
      }
      const ck = Math.min(1, dt * 7), cm = this.cam, ct = this.camTo;
      cm.D += (ct.D - cm.D) * ck;
      cm.lx += (ct.lx - cm.lx) * ck;
      cm.ly += (ct.ly - cm.ly) * ck;
      this.zoom += (this.zoomTo - this.zoom) * Math.min(1, dt * 6);
      this.shake *= Math.exp(-dt * 10);
      const sh = this.shake > 0.05 ? this.shake : 0;
      this._placeCamera((Math.random() - 0.5) * 2 * sh, (Math.random() - 0.5) * 2 * sh);
      this.renderer.render(this.scene, this.camera);
    }
    info() {
      const i = this.renderer.info.render;
      return { calls: i.calls, tris: i.triangles };
    }
  };
  function skinTrail(skin) {
    return skin.trail || 16777215;
  }

  // src/ui/ui.js
  var $ = (id) => document.getElementById(id);
  var SCREENS = ["scrLoading", "scrHome", "scrWin", "scrMap", "scrShop", "scrSettings", "scrEnd", "scrError"];
  var GEM = '<svg viewBox="0 0 24 24"><path d="M12 2l7 9-7 11-7-11z" fill="currentColor"/></svg>';
  var CHECK = '<svg viewBox="0 0 24 24"><path d="M5 12.500l4.500 4.500L19 7.500" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var UI = class {
    /** @param h handlers: play, next, retry, openMap, pick(i), openSettings, closeOverlay, double, restart, setOpt(key, value), gesture */
    constructor(i18n, h) {
      this.i18n = i18n;
      this.h = h;
      this.screen = "scrLoading";
      this.toastT = 0;
      this.starTimers = [];
      const on = (id, fn) => $(id).addEventListener("click", (e) => {
        h.gesture();
        fn(e);
      });
      on("btnPlay", () => h.play());
      on("btnLevels", () => h.openMap());
      on("btnSettings", () => h.openSettings());
      on("btnNext", () => h.next());
      on("btnRetry", () => h.retry());
      on("btnWinMap", () => h.openMap());
      on("btnDouble", () => h.double());
      on("btnMapClose", () => h.closeOverlay());
      on("btnMapHome", () => h.home());
      on("btnSetClose", () => h.closeOverlay());
      on("btnEndMap", () => h.openMap());
      on("btnRestart", () => h.restart());
      on("btnMap", () => h.openMap());
      on("btnShop", () => h.openShop());
      on("btnShopClose", () => h.closeOverlay());
      on("btnHint", () => h.hint());
      on("btnSkip", () => h.skip());
      $("optMusic").addEventListener("change", (e) => {
        h.gesture();
        h.setOpt("music", e.target.checked ? 1 : 0);
      });
      $("optSfx").addEventListener("change", (e) => {
        h.gesture();
        h.setOpt("sfx", e.target.checked ? 1 : 0);
      });
      $("optCtl").querySelectorAll("button").forEach((b) => b.addEventListener("click", () => {
        h.gesture();
        h.setOpt("ctl", b.dataset.v);
        this._seg(b.dataset.v);
      }));
      i18n.apply(document);
    }
    show(name) {
      this.screen = name;
      for (const s of SCREENS) $(s).classList.toggle("hidden", s !== name);
    }
    hud(on) {
      $("hud").classList.toggle("hidden", !on);
    }
    setHud(levelNum, got, total) {
      $("hudLevel").textContent = levelNum;
      const slots = $("hudGems").children;
      for (let i = 0; i < slots.length; i++) {
        slots[i].classList.toggle("on", i < got);
        slots[i].style.display = i < total ? "" : "none";
      }
    }
    setTheme(theme) {
      const app = $("app");
      app.style.setProperty("--bg1", theme.bg[0]);
      app.style.setProperty("--bg2", theme.bg[1]);
      app.classList.toggle("dark", !!theme.dark);
    }
    home({ levelNum, stars, gems }) {
      $("playLabel").textContent = `${this.i18n.t("level")} ${levelNum}`;
      $("homeStars").textContent = stars;
      $("homeGems").textContent = gems;
      this.show("scrHome");
    }
    win({ stars, time, par, got, total, canDouble, onStar }) {
      $("winTitle").textContent = this.i18n.t("win" + stars);
      $("winTime").textContent = time.toFixed(1) + "s";
      $("winPar").textContent = "/ " + par + "s";
      $("winTime").parentElement.classList.toggle("ok", time <= par);
      $("winGems").textContent = `${got}/${total}`;
      $("winGems").parentElement.classList.toggle("ok", got === total);
      $("btnDouble").classList.toggle("hidden", !canDouble);
      $("btnDouble").disabled = false;
      const cells = $("winStars").children;
      this.starTimers.forEach(clearTimeout);
      this.starTimers = [];
      for (let i = 0; i < 3; i++) {
        cells[i].classList.remove("on");
        if (i < stars) this.starTimers.push(setTimeout(() => {
          cells[i].classList.add("on");
          if (onStar) onStar(i);
        }, 220 + i * 260));
      }
      this.show("scrWin");
      $("btnNext").focus({ preventScroll: true });
    }
    setWinGems(text) {
      $("winGems").textContent = text;
    }
    doubleDone() {
      $("btnDouble").classList.add("hidden");
    }
    doubleBusy(b) {
      $("btnDouble").disabled = b;
    }
    map({ stars, max, count, current }) {
      const grid = $("mapGrid");
      grid.textContent = "";
      let total = 0;
      for (let i = 0; i < count; i++) {
        const st = stars[i] || 0;
        total += st;
        const b = document.createElement("button");
        b.type = "button";
        b.className = "lvl" + (i > max ? " lock" : st ? " done" : "") + (i === current ? " cur" : "");
        b.setAttribute("aria-label", `${this.i18n.t("level")} ${i + 1}`);
        const num = document.createElement("span");
        num.textContent = i + 1;
        const row = document.createElement("span");
        row.className = "s";
        for (let k = 0; k < 3; k++) {
          const s = document.createElement("b");
          if (k < st) s.className = "on";
          row.appendChild(s);
        }
        b.append(num, row);
        if (i <= max) b.addEventListener("click", () => {
          this.h.gesture();
          this.h.pick(i);
        });
        grid.appendChild(b);
      }
      $("mapStars").textContent = `${total}/${count * 3}`;
      this.show("scrMap");
    }
    settings(set) {
      $("optMusic").checked = !!set.music;
      $("optSfx").checked = !!set.sfx;
      this._seg(set.ctl);
      this.show("scrSettings");
    }
    _seg(v) {
      $("optCtl").querySelectorAll("button").forEach((b) => b.classList.toggle("on", b.dataset.v === v));
    }
    /** Help offered after repeated failures. */
    assist({ hint, skip, skipAd }) {
      $("btnHint").classList.toggle("hidden", !hint);
      $("btnSkip").classList.toggle("hidden", !skip);
      $("skipAd").classList.toggle("hidden", !skipAd);
    }
    shop({ owned, current, gems }) {
      const grid = $("shopGrid");
      grid.textContent = "";
      $("shopGems").textContent = gems;
      for (const s of SKINS) {
        const has = owned.includes(s.id), on = s.id === current;
        const b = document.createElement("button");
        b.type = "button";
        b.className = "skin" + (has ? " owned" : "") + (on ? " on" : "") + (!has && gems < s.cost ? " poor" : "");
        b.setAttribute("aria-label", s.id + (has ? "" : " " + s.cost));
        b.dataset.skin = s.id;
        const ball = document.createElement("span");
        ball.className = "ball";
        ball.style.background = skinSwatch(s.id);
        const tag = document.createElement("span");
        tag.className = "price";
        tag.innerHTML = has ? on ? CHECK : "" : GEM + "<b>" + s.cost + "</b>";
        b.append(ball, tag);
        b.addEventListener("click", () => {
          this.h.gesture();
          this.h.pickSkin(s.id);
        });
        grid.appendChild(b);
      }
      this.show("scrShop");
    }
    /** kind: "swipe" | "flip" | "note" */
    tutorial(kind, text) {
      const el = $("tut");
      el.className = "tut " + kind;
      $("tutText").textContent = text;
    }
    tutorialOff() {
      $("tut").classList.add("hidden");
    }
    toast(text) {
      const el = $("toast");
      el.textContent = text;
      el.classList.add("on");
      clearTimeout(this.toastT);
      this.toastT = setTimeout(() => el.classList.remove("on"), 2200);
    }
    paused(on) {
      $("pauseBadge").classList.toggle("hidden", !on);
    }
    error() {
      this.hud(false);
      this.show("scrError");
    }
  };

  // src/audio/audio.js
  var NOTE = (n) => 440 * Math.pow(2, (n - 69) / 12);
  var MOODS = {
    bright: { bpm: 104, chords: [[60, 64, 67], [57, 60, 64], [53, 57, 60], [55, 59, 62]], lead: "triangle" },
    // C  Am F  G
    warm: { bpm: 96, chords: [[62, 66, 69], [59, 62, 66], [55, 59, 62], [57, 61, 64]], lead: "triangle" },
    // D  Bm G  A
    cool: { bpm: 92, chords: [[57, 60, 64], [53, 57, 60], [60, 64, 67], [55, 59, 62]], lead: "sine" },
    // Am F  C  G
    neon: { bpm: 110, chords: [[57, 60, 64], [53, 57, 60], [55, 58, 62], [52, 55, 59]], lead: "sawtooth" }
    // Am F  Gm Em
  };
  var THEME_MOOD = { meadow: "bright", sunset: "warm", ice: "cool", factory: "warm", neon: "neon" };
  var GameAudio = class {
    constructor() {
      this.ctx = null;
      this.host = true;
      this.musicOn = true;
      this.sfxOn = true;
      this.paused = false;
      this.mood = "bright";
      this.timer = null;
      this.step = 0;
      this.nextT = 0;
      this.lastHit = 0;
      this.wantMusic = false;
    }
    /** Create / resume the context. Must be called from a user gesture. */
    unlock() {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        try {
          this.ctx = new AC();
        } catch (_) {
          return;
        }
        const c = this.ctx;
        this.master = c.createGain();
        this.master.connect(c.destination);
        this.sfx = c.createGain();
        this.sfx.connect(this.master);
        this.music = c.createGain();
        this.music.connect(this.master);
        const len = c.sampleRate, buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
        this.noiseBuf = buf;
        const src = c.createBufferSource();
        src.buffer = buf;
        src.loop = true;
        this.rollF = c.createBiquadFilter();
        this.rollF.type = "lowpass";
        this.rollF.frequency.value = 200;
        this.rollG = c.createGain();
        this.rollG.gain.value = 0;
        src.connect(this.rollF);
        this.rollF.connect(this.rollG);
        this.rollG.connect(this.sfx);
        src.start();
      }
      this._apply();
      if (this.wantMusic) this._startMusic();
    }
    _apply() {
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      this.master.gain.setTargetAtTime(this.host ? 1 : 0, now, 0.02);
      this.sfx.gain.setTargetAtTime(this.sfxOn ? 0.9 : 0, now, 0.02);
      this.music.gain.setTargetAtTime(this.musicOn ? 0.5 : 0, now, 0.05);
      const run = this.host && !this.paused;
      try {
        if (run && this.ctx.state === "suspended") this.ctx.resume();
        else if (!run && this.ctx.state === "running") this.ctx.suspend();
      } catch (_) {
      }
    }
    setHost(on) {
      this.host = !!on;
      this._apply();
    }
    setMusic(on) {
      this.musicOn = !!on;
      this._apply();
    }
    setSfx(on) {
      this.sfxOn = !!on;
      this._apply();
    }
    pause() {
      this.paused = true;
      this._stopTimer();
      this._apply();
    }
    resume() {
      this.paused = false;
      this._apply();
      if (this.wantMusic) this._startMusic();
    }
    // ---------- primitives ----------
    _tone(freq, dur, type, vol, endFreq, delay, bus) {
      const c = this.ctx;
      if (!c || !this.host) return;
      const t = c.currentTime + (delay || 0), o = c.createOscillator(), g = c.createGain();
      o.type = type || "sine";
      o.frequency.setValueAtTime(freq, t);
      if (endFreq) o.frequency.exponentialRampToValueAtTime(Math.max(30, endFreq), t + dur);
      g.gain.setValueAtTime(1e-4, t);
      g.gain.exponentialRampToValueAtTime(vol, t + 6e-3);
      g.gain.exponentialRampToValueAtTime(6e-4, t + dur);
      o.connect(g);
      g.connect(bus || this.sfx);
      o.start(t);
      o.stop(t + dur + 0.02);
    }
    _noise(dur, vol, freq, type, delay) {
      const c = this.ctx;
      if (!c || !this.host) return;
      const t = c.currentTime + (delay || 0), s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
      s.buffer = this.noiseBuf;
      f.type = type || "lowpass";
      f.frequency.value = freq;
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(6e-4, t + dur);
      s.connect(f);
      f.connect(g);
      g.connect(this.sfx);
      s.start(t, Math.random() * 0.5, dur + 0.02);
    }
    // ---------- sound effects ----------
    hit(v) {
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      if (now - this.lastHit < 0.045) return;
      this.lastHit = now;
      const k = Math.min(1, v / 700);
      this._tone(120 + k * 60, 0.09, "sine", 0.05 + k * 0.22, 55);
      this._noise(0.05, 0.03 + k * 0.1, 700 + k * 1500);
    }
    gem(n) {
      const f = [784, 988, 1175, 1568][Math.min(3, n)];
      this._tone(f, 0.22, "sine", 0.2, f * 1.01);
      this._tone(f * 2, 0.16, "triangle", 0.08, f * 2.02, 0.03);
    }
    star(i) {
      const f = [659, 784, 1047][Math.min(2, i)];
      this._tone(f, 0.3, "triangle", 0.2, f);
      this._tone(f * 2, 0.2, "sine", 0.07, f * 2, 0.02);
    }
    win() {
      [523, 659, 784, 1047].forEach((f, i) => this._tone(f, 0.26, "triangle", 0.17, f * 1.01, i * 0.075));
      this._noise(0.5, 0.05, 5e3, "highpass", 0.1);
    }
    die() {
      this._tone(260, 0.32, "sawtooth", 0.16, 50);
      this._noise(0.22, 0.2, 1400);
    }
    bump() {
      this._tone(330, 0.12, "triangle", 0.2, 660);
    }
    pad() {
      this._tone(220, 0.2, "triangle", 0.18, 760);
    }
    shatter() {
      this._noise(0.3, 0.25, 3200, "highpass");
      this._tone(1500, 0.18, "sine", 0.1, 600);
      this._tone(2100, 0.14, "sine", 0.07, 900, 0.03);
    }
    click() {
      this._tone(700, 0.04, "triangle", 0.1, 500);
    }
    whoosh() {
      this._noise(0.25, 0.08, 900, "bandpass");
    }
    /** Rolling rumble — call every frame. */
    roll(speed, touching) {
      if (!this.ctx) return;
      const now = this.ctx.currentTime, v = touching ? Math.min(1, speed / 520) : 0;
      this.rollG.gain.setTargetAtTime(v * 0.11, now, 0.04);
      this.rollF.frequency.setTargetAtTime(150 + v * 620, now, 0.05);
    }
    // ---------- music: a small generative loop ----------
    playMusic(theme) {
      this.mood = THEME_MOOD[theme] || "bright";
      this.wantMusic = true;
      if (this.ctx) this._startMusic();
    }
    stopMusic() {
      this.wantMusic = false;
      this._stopTimer();
    }
    _stopTimer() {
      if (this.timer) {
        clearInterval(this.timer);
        this.timer = null;
      }
    }
    _startMusic() {
      if (this.timer || !this.ctx || this.paused) return;
      this.nextT = this.ctx.currentTime + 0.08;
      this.timer = setInterval(() => this._schedule(), 110);
    }
    _schedule() {
      const c = this.ctx;
      if (!c || c.state !== "running") return;
      const m = MOODS[this.mood], spb = 60 / m.bpm / 2;
      while (this.nextT < c.currentTime + 0.3) {
        const s = this.step, ch = m.chords[(s >> 3) % m.chords.length], t = this.nextT - c.currentTime;
        const beat = s & 7;
        if (beat === 0 || beat === 4) this._tone(NOTE(ch[0] - 24), spb * 3.2, "sine", 0.2, null, t, this.music);
        if (beat === 0) {
          this._tone(NOTE(ch[0] - 12), spb * 7.5, "sine", 0.045, null, t, this.music);
          this._tone(NOTE(ch[2] - 12), spb * 7.5, "sine", 0.035, null, t, this.music);
        }
        const pat = s >> 3 & 1 ? [0, 2, 1, 2, 0, 1, 2, 1] : [0, 1, 2, 1, 0, 2, 1, 2];
        if (beat !== 3 && beat !== 7) this._tone(NOTE(ch[pat[beat]] + 12), spb * 0.9, m.lead, m.lead === "sawtooth" ? 0.035 : 0.075, null, t, this.music);
        this.step++;
        this.nextT += spb;
      }
    }
  };

  // src/levels/parse.js
  var GRID = 28;
  var Builder = class {
    constructor(n = GRID) {
      this.n = n;
      this.cell = 2 * HALF / n;
      this.g = Array.from({ length: n }, () => new Array(n).fill(" "));
      this.pt = { start: null, goal: null, gems: [] };
      this.objs = [];
    }
    /** grid column/row (may be fractional) -> arena units; (0,0) is the centre of the top-left cell */
    X(c) {
      return -HALF + (c + 0.5) * this.cell;
    }
    Y(r) {
      return HALF - (r + 0.5) * this.cell;
    }
    put(ch, c, r) {
      if (c >= 0 && r >= 0 && c < this.n && r < this.n) this.g[r][c] = ch;
      return this;
    }
    h(r, c0, c1, ch = "#") {
      for (let c = Math.min(c0, c1); c <= Math.max(c0, c1); c++) this.put(ch, c, r);
      return this;
    }
    v(c, r0, r1, ch = "#") {
      for (let r = Math.min(r0, r1); r <= Math.max(r0, r1); r++) this.put(ch, c, r);
      return this;
    }
    box(c0, r0, c1, r1, ch = "#") {
      for (let r = Math.min(r0, r1); r <= Math.max(r0, r1); r++) this.h(r, c0, c1, ch);
      return this;
    }
    clear(c0, r0, c1, r1) {
      return this.box(c0, r0, c1, r1, " ");
    }
    frame(ch = "#") {
      const m = this.n - 1;
      return this.h(0, 0, m, ch).h(m, 0, m, ch).v(0, 0, m, ch).v(m, 0, m, ch);
    }
    /** diagonal wall from cell (c0,r0) to (c1,r1); |dc| must equal |dr| */
    diag(c0, r0, c1, r1) {
      const n = Math.abs(c1 - c0), sc = Math.sign(c1 - c0) || 1, sr = Math.sign(r1 - r0) || 1;
      const ch = sc * sr < 0 ? "/" : "\\";
      for (let i = 0; i <= n; i++) this.put(ch, c0 + i * sc, r0 + i * sr);
      return this;
    }
    spikes(c0, r0, c1, r1) {
      return this.box(c0, r0, c1, r1, "^");
    }
    start(c, r) {
      this.pt.start = { x: this.X(c), y: this.Y(r) };
      return this;
    }
    goal(c, r) {
      this.pt.goal = { x: this.X(c), y: this.Y(r) };
      return this;
    }
    gem(c, r) {
      this.pt.gems.push({ x: this.X(c), y: this.Y(r) });
      return this;
    }
    /** moving platform: centre cell (c,r), size w x h cells, travel ±ac / ±ar cells */
    mover(c, r, w, h, ac, ar, spd = 1.6, ph = 0) {
      this.objs.push({ t: "mover", cx: this.X(c), cy: this.Y(r), hw: w * this.cell / 2, hh: h * this.cell / 2, ax: ac * this.cell, ay: ar * this.cell, spd, ph });
      return this;
    }
    saw(c, r, rad, ac, ar, spd = 1.8, ph = 0) {
      this.objs.push({ t: "saw", cx: this.X(c), cy: this.Y(r), r: rad, ax: ac * this.cell, ay: ar * this.cell, spd, ph });
      return this;
    }
    rows() {
      return this.g.map((row) => row.join(""));
    }
  };
  function mergeRuns(mask, n) {
    const rects = [];
    let open = /* @__PURE__ */ new Map();
    for (let r = 0; r < n; r++) {
      const next = /* @__PURE__ */ new Map();
      let c = 0;
      while (c < n) {
        if (!mask[r * n + c]) {
          c++;
          continue;
        }
        let c1 = c;
        while (c1 + 1 < n && mask[r * n + c1 + 1]) c1++;
        const key = c + ":" + c1, prev = open.get(key);
        if (prev) {
          prev.r1 = r;
          next.set(key, prev);
        } else {
          const rc = { c0: c, c1, r0: r, r1: r };
          rects.push(rc);
          next.set(key, rc);
        }
        c = c1 + 1;
      }
      open = next;
    }
    return rects;
  }
  var PAD_DIR = { "<": [-1, 0], ">": [1, 0], A: [0, 1], V: [0, -1] };
  function compile(def) {
    let b;
    if (def.build) {
      b = new Builder(def.grid || GRID);
      def.build(b);
    } else {
      b = new Builder(def.map.length);
      def.map.forEach((row, r) => {
        for (let c = 0; c < b.n; c++) b.g[r][c] = row[c] || " ";
      });
      if (def.start) b.start(def.start[0], def.start[1]);
      if (def.goal) b.goal(def.goal[0], def.goal[1]);
      (def.gems || []).forEach((g2) => b.gem(g2[0], g2[1]));
      (def.objs || []).forEach((o) => b.objs.push(o));
    }
    const n = b.n, cell = b.cell, g = b.g;
    const at = (c, r) => c < 0 || r < 0 || c >= n || r >= n ? " " : g[r][c];
    const maskOf = (chars) => {
      const m = new Uint8Array(n * n);
      for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (chars.includes(g[r][c])) m[r * n + c] = 1;
      return m;
    };
    const toBox = (rc, shrink = 0) => ({
      k: K_BOX,
      cx: -HALF + (rc.c0 + rc.c1 + 1) / 2 * cell,
      cy: HALF - (rc.r0 + rc.r1 + 1) / 2 * cell,
      hw: (rc.c1 - rc.c0 + 1) * cell / 2 - shrink,
      hh: (rc.r1 - rc.r0 + 1) * cell / 2 - shrink,
      c: 1,
      s: 0,
      e: 1,
      mu: 1,
      kick: 0,
      rc
    });
    const solidAt = (c, r) => "#=X".includes(at(c, r));
    const solids = [], kills = [], crystals = [], pads = [], movers = [], saws = [];
    for (const rc of mergeRuns(maskOf("#"), n)) {
      const s = toBox(rc);
      s.outer = rc.c0 === 0 || rc.r0 === 0 || rc.c1 === n - 1 || rc.r1 === n - 1;
      solids.push(s);
    }
    for (const rc of mergeRuns(maskOf("="), n)) {
      const s = toBox(rc);
      s.mu = 0;
      s.ice = true;
      solids.push(s);
    }
    for (const rc of mergeRuns(maskOf("X"), n)) crystals.push(toBox(rc));
    for (const rc of mergeRuns(maskOf("^"), n)) {
      const k = toBox(rc, 1.5);
      let up = 0, down = 0, left = 0, right = 0;
      for (let c = rc.c0; c <= rc.c1; c++) {
        if (solidAt(c, rc.r0 - 1)) up++;
        if (solidAt(c, rc.r1 + 1)) down++;
      }
      for (let r = rc.r0; r <= rc.r1; r++) {
        if (solidAt(rc.c0 - 1, r)) left++;
        if (solidAt(rc.c1 + 1, r)) right++;
      }
      const best = Math.max(up, down, left, right);
      k.dx = 0;
      k.dy = 0;
      if (best > 0) {
        if (best === down) k.dy = 1;
        else if (best === up) k.dy = -1;
        else if (best === left) k.dx = 1;
        else k.dx = -1;
      }
      kills.push(k);
    }
    for (const ch of Object.keys(PAD_DIR)) {
      for (const rc of mergeRuns(maskOf(ch), n)) {
        const p = toBox(rc);
        p.dx = PAD_DIR[ch][0];
        p.dy = PAD_DIR[ch][1];
        p.power = 520;
        pads.push(p);
      }
    }
    const seen = new Uint8Array(n * n);
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
      const ch = g[r][c];
      if (ch !== "/" && ch !== "\\" || seen[r * n + c]) continue;
      const dr = ch === "/" ? -1 : 1;
      let c0 = c, r0 = r;
      while (at(c0 - 1, r0 - dr) === ch) {
        c0--;
        r0 -= dr;
      }
      let len = 0;
      while (at(c0 + len, r0 + len * dr) === ch) {
        seen[(r0 + len * dr) * n + c0 + len] = 1;
        len++;
      }
      const xa = -HALF + c0 * cell, xb = -HALF + (c0 + len) * cell;
      const ya = ch === "/" ? HALF - (r0 + 1) * cell : HALF - r0 * cell;
      const yb = ch === "/" ? ya + len * cell : ya - len * cell;
      solids.push({ k: K_CAPSULE, ax: xa, ay: ya, bx: xb, by: yb, r: 6, cx: (xa + xb) / 2, cy: (ya + yb) / 2, e: 1, mu: 1, kick: 0 });
    }
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
      const ch = g[r][c];
      if (ch === "o") solids.push({ k: K_CIRCLE, cx: b.X(c), cy: b.Y(r), r: 7, e: 1, mu: 1, kick: 0 });
      else if (ch === "O") solids.push({ k: K_CIRCLE, cx: b.X(c), cy: b.Y(r), r: 13, e: 3, mu: 0, kick: 240, bumper: true });
    }
    for (const o of b.objs) {
      if (o.t === "mover") {
        movers.push({ ...o, box: { k: K_BOX, cx: o.cx, cy: o.cy, hw: o.hw, hh: o.hh, c: 1, s: 0, e: 1, mu: 1, kick: 0 } });
      } else if (o.t === "saw") saws.push({ ...o });
    }
    if (!b.pt.start || !b.pt.goal) throw new Error(`level ${def.id}: start and goal are required`);
    let open = false;
    for (let i = 0; i < n; i++) if (!solidAt(i, 0) || !solidAt(i, n - 1) || !solidAt(0, i) || !solidAt(n - 1, i)) open = true;
    const level = {
      id: def.id,
      name: def.name || "",
      theme: def.theme || "meadow",
      tut: def.tut || null,
      forms: def.forms || ["ball"],
      par: def.par || 0,
      half: HALF,
      cell,
      n,
      open,
      start: b.pt.start,
      goal: { x: b.pt.goal.x, y: b.pt.goal.y, r: 16 },
      gems: b.pt.gems,
      solids,
      kills,
      crystals,
      pads,
      movers,
      saws,
      rows: b.rows()
    };
    level.grid = buildGrid(level);
    return level;
  }
  function buildGrid(L) {
    const cellSize = 30, margin = 30;
    const min = -L.half - 90, span = 2 * (L.half + 90);
    const n = Math.ceil(span / cellSize);
    const buckets = Array.from({ length: n * n }, () => []);
    L.solids.forEach((s, idx) => {
      let x0, x1, y0, y1;
      if (s.k === K_BOX) {
        const ex = Math.abs(s.hw * s.c) + Math.abs(s.hh * s.s), ey = Math.abs(s.hw * s.s) + Math.abs(s.hh * s.c);
        x0 = s.cx - ex;
        x1 = s.cx + ex;
        y0 = s.cy - ey;
        y1 = s.cy + ey;
      } else if (s.k === K_CIRCLE) {
        x0 = s.cx - s.r;
        x1 = s.cx + s.r;
        y0 = s.cy - s.r;
        y1 = s.cy + s.r;
      } else {
        x0 = Math.min(s.ax, s.bx) - s.r;
        x1 = Math.max(s.ax, s.bx) + s.r;
        y0 = Math.min(s.ay, s.by) - s.r;
        y1 = Math.max(s.ay, s.by) + s.r;
      }
      const i0 = Math.max(0, Math.floor((x0 - margin - min) / cellSize)), i1 = Math.min(n - 1, Math.floor((x1 + margin - min) / cellSize));
      const j0 = Math.max(0, Math.floor((y0 - margin - min) / cellSize)), j1 = Math.min(n - 1, Math.floor((y1 + margin - min) / cellSize));
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) buckets[j * n + i].push(idx);
    });
    return { min, cell: cellSize, n, lists: buckets.map((b) => Int16Array.from(b)) };
  }

  // src/levels/world1.js
  var WORLD1 = [
    {
      // First tilt: roll off the shelf, land by the goal.
      id: "1-1",
      tut: "drag",
      build(b) {
        b.frame();
        b.h(12, 1, 18);
        b.start(4, 10.6).goal(25.6, 25.6);
        b.gem(9, 10.6).gem(14, 10.6).gem(25.6, 22);
      }
    },
    {
      // The other way, then back.
      id: "1-2",
      tut: "both",
      build(b) {
        b.frame();
        b.h(12, 9, 26);
        b.start(23, 10.6).goal(25.6, 25.6);
        b.gem(15, 10.6).gem(1.4, 20).gem(13, 25.6);
      }
    },
    {
      // Zigzag.
      id: "1-3",
      build(b) {
        b.frame();
        b.h(8, 1, 19).h(15, 8, 26).h(22, 1, 19);
        b.start(3, 6.6).goal(25.6, 25.6);
        b.gem(12, 6.6).gem(13, 13.6).gem(10, 20.6);
      }
    },
    {
      // First spikes: the bridge is safe, the floor under it is not.
      id: "1-4",
      tut: "spikes",
      build(b) {
        b.frame();
        b.h(10, 1, 10);
        b.h(17, 9, 19);
        b.spikes(6, 26, 17, 26);
        b.start(7, 8.6).goal(25.6, 25.6);
        b.gem(3, 8.6).gem(14, 15.6).gem(22, 21);
      }
    },
    {
      // Upside down: a half turn makes the ceiling the floor.
      id: "1-5",
      tut: "flip",
      build(b) {
        b.frame();
        b.h(13, 1, 20);
        b.start(4, 25.6).goal(1.4, 1.4);
        b.gem(12, 14.4).gem(23.5, 13).gem(13, 1.4);
      }
    },
    {
      // Pour: tip the ball out of one cup and drop it into the other.
      id: "1-6",
      build(b) {
        b.frame();
        b.v(5, 12, 19).h(19, 5, 11).v(11, 12, 19);
        b.v(18, 13, 20).h(20, 18, 22).v(22, 13, 20);
        b.diag(15, 10, 17, 12).diag(23, 12, 26, 9);
        b.start(8, 17.6).goal(20, 18.6);
        b.gem(8, 9).gem(14, 1.4).gem(20, 10);
      }
    },
    {
      // Steps: gentle tilts — too fast and you overshoot onto the spikes.
      id: "1-7",
      build(b) {
        b.frame();
        b.h(7, 1, 7).h(12, 9, 14).h(17, 16, 21);
        b.spikes(1, 26, 20, 26);
        b.start(3, 5.6).goal(25.6, 25.6);
        b.gem(11.5, 10.6).gem(18.5, 15.6).gem(24, 20);
      }
    },
    {
      // Fork: the safe way down, or the risky side for gems.
      id: "1-8",
      build(b) {
        b.frame();
        b.h(7, 1, 12);
        b.box(13, 11, 14, 22);
        b.h(18, 18, 26);
        b.spikes(21, 26, 26, 26);
        b.start(4, 5.6).goal(1.4, 25.6);
        b.gem(22, 16.6).gem(16.5, 25.6).gem(9, 5.6);
      }
    },
    {
      // Open edge: there is a hole in the floor. Go over the top.
      id: "1-9",
      tut: "edge",
      build(b) {
        b.frame();
        b.clear(11, 27, 16, 27);
        b.h(14, 8, 19);
        b.start(3, 25.6).goal(25.6, 25.6);
        b.gem(6, 1.4).gem(13.5, 12.6).gem(21, 19);
      }
    },
    {
      // Spiral: keep turning.
      id: "1-10",
      build(b) {
        b.frame();
        b.h(5, 1, 22).v(22, 5, 22).h(22, 5, 22).v(5, 10, 22);
        b.h(10, 6, 17).v(17, 10, 17).h(17, 10, 17).v(10, 10, 12).v(10, 16, 17);
        b.start(3, 3.6).goal(15.6, 14);
        b.gem(24.5, 14).gem(2.5, 15).gem(13.5, 19.5);
      }
    },
    {
      // Plinko: steer through the pegs into the cup.
      id: "1-11",
      build(b) {
        b.frame();
        b.h(4, 1, 8);
        [[9, [6, 11, 16, 21]], [13, [3, 8, 14, 19, 24]], [17, [6, 11, 16, 21]]].forEach(([r, cols]) => cols.forEach((c) => b.put("o", c, r)));
        b.v(12, 24, 26).v(16, 24, 26);
        b.diag(8, 20, 11, 23).diag(17, 23, 20, 20);
        b.spikes(1, 26, 11, 26).spikes(17, 26, 26, 26);
        b.start(3, 2.6).goal(14, 25.6);
        b.gem(14, 11).gem(8, 15).gem(14, 21);
      }
    },
    {
      // Ring: find the door of the inner room.
      id: "1-12",
      build(b) {
        b.frame();
        b.h(7, 7, 20).h(20, 7, 20).v(7, 7, 20).v(20, 7, 12).v(20, 16, 20);
        b.start(3, 25.6).goal(8.4, 14);
        b.gem(24, 25.6).gem(23.5, 3).gem(3, 3.4);
      }
    },
    {
      // Valley: climb out the right side — the left side ends badly.
      id: "1-13",
      build(b) {
        b.frame();
        b.diag(4, 12, 12, 20).diag(13, 20, 21, 12);
        b.spikes(1, 26, 9, 26);
        b.start(12.5, 17).goal(25.6, 25.6);
        b.gem(17, 13.5).gem(24, 18).gem(8, 13.5);
      }
    },
    {
      // Bumpers.
      id: "1-14",
      build(b) {
        b.frame();
        b.h(4, 11, 16);
        [[7, 10], [21, 10], [14, 14], [5, 17], [23, 17]].forEach(([c, r]) => b.put("O", c, r));
        b.v(12, 23, 26).v(16, 23, 26);
        b.diag(8, 19, 11, 22).diag(17, 22, 20, 19);
        b.start(13.5, 2.6).goal(14, 25.6);
        b.gem(4, 6).gem(24, 6).gem(14, 19);
      }
    },
    {
      // Maze: under, over, under.
      id: "1-15",
      build(b) {
        b.frame();
        b.v(7, 1, 20).v(14, 7, 26).v(21, 1, 20);
        b.spikes(15, 26, 17, 26);
        b.start(3, 2.6).goal(25.6, 1.4);
        b.gem(10.5, 25.6).gem(11, 1.4).gem(18, 13);
      }
    },
    {
      // Hourglass: slide along the underside and catch the neck.
      id: "1-16",
      build(b) {
        b.frame();
        b.diag(1, 6, 11, 16).diag(16, 16, 26, 6);
        b.start(4, 25.6).goal(1.4, 1.4);
        b.gem(13.5, 21).gem(13.5, 12).gem(22, 1.4);
      }
    },
    {
      // Cliffhanger: open sides. Roll off gently.
      id: "1-17",
      build(b) {
        b.frame();
        b.clear(0, 8, 0, 15).clear(27, 8, 27, 15);
        b.h(10, 9, 18);
        b.start(13.5, 8.6).goal(25.6, 25.6);
        b.gem(4, 9).gem(23, 9).gem(13.5, 18);
      }
    },
    {
      // Gauntlet: spikes on the floor here, on the ceiling there.
      id: "1-18",
      build(b) {
        b.frame();
        b.h(8, 1, 22);
        b.h(17, 5, 26);
        b.spikes(12, 16, 17, 16);
        b.spikes(10, 18, 16, 18);
        b.start(3, 6.6).goal(25.6, 25.6);
        b.gem(14, 9.4).gem(2.5, 13).gem(13, 25.6);
      }
    },
    {
      // Summit: drop onto the peak, not the shoulders.
      id: "1-19",
      build(b) {
        b.frame();
        b.box(3, 23, 23, 26);
        b.box(7, 19, 19, 22);
        b.box(11, 15, 15, 18);
        b.put("#", 11, 14).put("#", 15, 14);
        b.spikes(3, 22, 6, 22).spikes(20, 22, 23, 22);
        b.spikes(7, 18, 10, 18).spikes(16, 18, 19, 18);
        b.h(4, 1, 5);
        b.start(3, 2.6).goal(13, 13.6);
        b.gem(8, 1.4).gem(13, 8).gem(20, 1.4);
      }
    },
    {
      // Exam: tilt, flip over spikes, cross the hole.
      id: "1-20",
      build(b) {
        b.frame();
        b.clear(12, 27, 15, 27);
        b.h(6, 1, 21);
        b.h(13, 6, 26);
        b.spikes(12, 12, 15, 12);
        b.start(3, 4.6).goal(25.6, 25.6);
        b.gem(11, 4.6).gem(13.5, 7.4).gem(13.5, 14.4);
      }
    }
  ];

  // src/levels/meta.gen.js
  var META = {
    "1-1": { "par": 11, "t": 2.03, "tg": 2.03, "d": 13.8, "path": [[-142, 44], [-130, 44], [-50, 44], [98, 42], [159, -23], [170, -155], [173, -170]] },
    "1-2": { "par": 14, "t": 2.37, "tg": 3.15, "d": 12.3, "path": [[143, 44], [138, 44], [100, 44], [10, 44], [-113, 40], [-160, -7], [-82, -92], [43, -180], [177, -166]] },
    "1-3": { "par": 15, "t": 3.63, "tg": 3.63, "d": 15.3, "path": [[-157, 104], [-153, 104], [-115, 104], [-25, 104], [98, 103], [168, 68], [94, 0], [-25, 25], [-174, 11], [-121, -54], [-36, -91], [76, -97], [179, -159], [174, -169]] },
    "1-4": { "par": 15, "t": 1.59, "tg": 3.6, "d": 13.4, "path": [[-97, 74], [-93, 74], [-58, 74], [10, 57], [86, -14], [181, -129], [170, -171]] },
    "1-5": { "par": 16, "t": 2.63, "tg": 3.82, "d": 16.2, "path": [[-142, -181], [-142, -181], [-138, -181], [-125, -181], [-100, -181], [-61, -181], [-10, -177], [51, -165], [115, -140], [178, -101], [158, -51], [128, 10], [91, 80], [46, 157], [-2, 162], [-53, 146], [-108, 145], [-169, 157], [-173, 168]] },
    "1-6": { "par": 15, "t": 3.18, "tg": 3.57, "d": 15.5, "path": [[-82, -61], [-78, -61], [-61, -61], [-58, -58], [-58, -24], [-58, 46], [-23, 145], [63, 156], [177, 115], [140, 48], [96, -9], [104, -65]] },
    "1-7": { "par": 13, "t": 1.93, "tg": 2.92, "d": 11.9, "path": [[-157, 119], [-153, 119], [-115, 119], [-25, 114], [99, 75], [166, -15], [153, -137], [166, -177]] },
    "1-8": { "par": 15, "t": 2.66, "tg": 3.34, "d": 23.4, "path": [[-142, 119], [-130, 119], [-58, 119], [12, 106], [-1, 65], [-91, 44], [-174, -68], [-171, -172]] },
    "1-9": { "par": 20, "t": 1.31, "tg": 5.18, "d": 15.4, "path": [[-157, -181], [-157, -181], [-153, -181], [-140, -181], [-115, -181], [-76, -181], [-24, -182], [40, -181], [115, -177], [174, -168]] },
    "1-10": { "par": 25, "t": 6.88, "tg": 6.88, "d": 69.6, "path": [[-157, 149], [-153, 149], [-115, 149], [-25, 149], [98, 149], [167, 133], [159, 63], [170, -57], [145, -171], [70, -162], [-54, -178], [-171, -158], [-169, -95], [-170, 14], [-124, 89], [-30, 83], [99, 64], [79, -5], [69, -105], [6, -78], [-95, -64], [-66, 1], [-45, -14], [20, 3]] },
    "1-11": { "par": 13, "t": 2.23, "tg": 2.73, "d": 14, "path": [[-157, 164], [-145, 164], [-73, 163], [23, 109], [120, -4], [27, -135], [13, -167]] },
    "1-12": { "par": 22, "t": 2.23, "tg": 5.78, "d": 13.4, "path": [[-157, -181], [-157, -181], [-153, -181], [-140, -181], [-115, -181], [-76, -181], [-25, -178], [38, -169], [109, -151], [182, -121], [152, -80], [121, -26], [83, -10], [37, -25], [-19, -30], [-72, -23]] },
    "1-13": { "par": 16, "t": 2.47, "tg": 3.72, "d": 14.8, "path": [[-15, -52], [-16, -76], [-5, -68], [25, -38], [77, 14], [131, 59], [180, 46], [164, -24], [179, -137], [180, -168]] },
    "1-14": { "par": 14, "t": 1.8, "tg": 3.27, "d": 22, "path": [[0, 164], [-5, 164], [-36, 164], [-69, 145], [-67, 79], [-27, -24], [14, -171]] },
    "1-15": { "par": 18, "t": 4.36, "tg": 4.52, "d": 18.5, "path": [[-157, 164], [-157, 132], [-152, 44], [-120, -78], [-108, -178], [-53, -112], [-21, 1], [-11, 143], [53, 137], [76, 52], [88, -59], [102, -162], [154, -144], [172, -51], [181, 83], [178, 169]] },
    "1-16": { "par": 24, "t": 3.93, "tg": 6.39, "d": 66.3, "path": [[-142, -181], [-138, -181], [-100, -181], [-10, -177], [115, -140], [158, -51], [139, 9], [139, -1], [93, -14], [58, -45], [30, -64], [-5, -35], [-66, 42], [-161, 154], [-173, 168]] },
    "1-17": { "par": 16, "t": 1.8, "tg": 3.87, "d": 51.7, "path": [[0, 74], [5, 74], [36, 74], [74, 74], [108, 43], [142, -43], [175, -168]] },
    "1-18": { "par": 19, "t": 3.83, "tg": 4.83, "d": 68.7, "path": [[-157, 104], [-153, 104], [-115, 104], [-25, 104], [98, 104], [168, 88], [144, 25], [89, -26], [-18, -5], [-156, -22], [-133, -91], [-49, -175], [64, -157], [172, -173]] },
    "1-19": { "par": 15, "t": 1.31, "tg": 3.45, "d": 33.5, "path": [[-157, 164], [-145, 164], [-73, 148], [-1, 45], [3, 8]] },
    "1-20": { "par": 23, "t": 3.51, "tg": 6.12, "d": 45.5, "path": [[-157, 134], [-153, 134], [-115, 134], [-25, 134], [98, 134], [168, 113], [97, 47], [-4, 43], [-131, 30], [-149, 3], [-68, -65], [60, -143], [170, -173]] }
  };

  // src/levels/index.js
  var WORLDS = [
    { id: 1, theme: "meadow", defs: WORLD1 }
  ];
  var DEFS = WORLDS.flatMap((w) => w.defs.map((d) => ({ ...d, theme: d.theme || w.theme, world: w.id })));
  var LEVEL_COUNT = DEFS.length;
  var cache2 = /* @__PURE__ */ new Map();
  function getLevel(i) {
    if (!cache2.has(i)) {
      const def = DEFS[i];
      const lvl = compile(def);
      const m = META[def.id];
      lvl.index = i;
      lvl.world = def.world;
      lvl.par = def.par || m && m.par || 30;
      lvl.hint = m && m.path || null;
      cache2.set(i, lvl);
    }
    return cache2.get(i);
  }

  // src/input.js
  var Input = class {
    constructor(el, game) {
      this.el = el;
      this.game = game;
      this.mode = "swipe";
      this.keyDir = 0;
      this.left = false;
      this.right = false;
      this.active = false;
      this.id = -1;
      this.lx = 0;
      this.ly = 0;
      this.sx = 0;
      this.sy = 0;
      this.moved = 0;
      this.t0 = 0;
      this.la = 0;
      el.addEventListener("pointerdown", (e) => {
        if (this.active) return;
        this.active = true;
        this.id = e.pointerId;
        try {
          el.setPointerCapture(e.pointerId);
        } catch (_) {
        }
        this.lx = this.sx = e.clientX;
        this.ly = this.sy = e.clientY;
        this.moved = 0;
        this.t0 = performance.now();
        this.la = this._angle(e);
        game.gesture();
      });
      el.addEventListener("pointermove", (e) => {
        if (!this.active || e.pointerId !== this.id) return;
        const dx = e.clientX - this.lx, dy = e.clientY - this.ly;
        this.lx = e.clientX;
        this.ly = e.clientY;
        this.moved += Math.abs(dx) + Math.abs(dy);
        const rect = el.getBoundingClientRect();
        const sens = Math.PI * 0.95 / Math.max(240, Math.min(rect.width, rect.height));
        if (this.mode === "grab") {
          const c = game.arenaCenter(), rx = e.clientX - rect.left - c.x, ry = e.clientY - rect.top - c.y;
          const a = Math.atan2(-ry, rx);
          if (rx * rx + ry * ry > 36 * 36) {
            let d = a - this.la;
            if (d > Math.PI) d -= 2 * Math.PI;
            else if (d < -Math.PI) d += 2 * Math.PI;
            game.rotate(d);
          } else game.rotate(-dx * sens);
          this.la = a;
        } else {
          game.rotate(-dx * sens);
        }
      });
      const up = (e) => {
        if (!this.active || e.pointerId !== this.id) return;
        this.active = false;
        if (this.moved < 10 && performance.now() - this.t0 < 320) game.tap();
      };
      el.addEventListener("pointerup", up);
      el.addEventListener("pointercancel", up);
      el.addEventListener("contextmenu", (e) => e.preventDefault());
      window.addEventListener("keydown", (e) => {
        const k = e.key;
        if (k === "Escape") {
          game.escape();
          return;
        }
        if (k === "ArrowLeft" || k === "a" || k === "A") {
          this.left = true;
          e.preventDefault();
        } else if (k === "ArrowRight" || k === "d" || k === "D") {
          this.right = true;
          e.preventDefault();
        } else if (k === " " || k === "Enter") {
          if (!e.repeat && !(e.target && e.target.closest && e.target.closest("button, input"))) {
            game.action();
            e.preventDefault();
          }
        } else if (k === "r" || k === "R") {
          if (!e.repeat) game.restartKey();
        } else return;
        this.keyDir = (this.right ? 1 : 0) - (this.left ? 1 : 0);
        game.gesture();
      });
      window.addEventListener("keyup", (e) => {
        const k = e.key;
        if (k === "ArrowLeft" || k === "a" || k === "A") this.left = false;
        else if (k === "ArrowRight" || k === "d" || k === "D") this.right = false;
        this.keyDir = (this.right ? 1 : 0) - (this.left ? 1 : 0);
      });
    }
    /** Drop any held keys / drags (called when the game is paused by the host). */
    reset() {
      this.left = this.right = false;
      this.keyDir = 0;
      this.active = false;
    }
    _angle(e) {
      const rect = this.el.getBoundingClientRect(), c = this.game.arenaCenter();
      return Math.atan2(-(e.clientY - rect.top - c.y), e.clientX - rect.left - c.x);
    }
  };

  // src/game.js
  var FIRST_AD_AFTER = 2;
  var HINT_AFTER = { deaths: 3, sec: 40 };
  var SKIP_AFTER = { deaths: 6, sec: 90 };
  var _p2 = { x: 0, y: 0, vx: 0, vy: 0 };
  var Game = class {
    constructor({ platform, view, ui, audio, save, i18n }) {
      this.platform = platform;
      this.view = view;
      this.ui = ui;
      this.audio = audio;
      this.save = save;
      this.i18n = i18n;
      this.state = "boot";
      this.overlay = null;
      this.index = -1;
      this.sim = null;
      this.paused = false;
      this.busy = false;
      this.raf = 0;
      this.last = 0;
      this.t = 0;
      this.acc = 0;
      this.timeScale = 1;
      this.timer = 0;
      this.rotated = 0;
      this.tutKind = null;
      this.tutT = 0;
      this.deathsHere = 0;
      this.result = null;
      this.t0 = -1;
      this.devTheme = null;
      this.fpsT = 0;
      this.fpsN = 0;
      this.playT = 0;
      this.hintOn = false;
      this._ah = false;
      this._as = false;
      this.bot = null;
      this.input = new Input(view.canvas, this);
      this.input.mode = save.set.ctl;
      this._frame = this._frame.bind(this);
    }
    // ------------------------------------------------------------------ boot
    start() {
      const { audio, platform, save } = this;
      audio.setMusic(!!save.set.music);
      audio.setSfx(!!save.set.sfx);
      audio.setHost(platform.audioEnabled());
      platform.onAudioChange((on) => audio.setHost(on));
      platform.onPause(() => this.pause());
      platform.onResume(() => this.resume());
      this.view.setSkin(save.skin);
      if (save.max === 0 && !save.stars[0]) this.startLevel(0);
      else this.goHome();
      this.last = performance.now();
      this._frame(this.last);
    }
    // ------------------------------------------------------------------ flow
    _load(i) {
      this.index = i;
      let lvl = getLevel(i);
      if (this.devTheme) lvl = { ...lvl, theme: this.devTheme };
      this.sim = new Sim(lvl);
      this.view.build(lvl);
      this.ui.setTheme(themeOf(lvl.theme));
      this.audio.playMusic(lvl.theme);
      this.deathsHere = 0;
      this.playT = 0;
      this.hintOn = false;
      this._ah = this._as = false;
      this.bot = null;
      this.ui.assist({ hint: false, skip: false, skipAd: false });
    }
    goHome() {
      if (this.busy) return;
      if (this.state === "play" || this.state === "dying") this.platform.gameplayStop("quit");
      const i = Math.min(this.save.max, LEVEL_COUNT - 1);
      if (this.index !== i || this.state !== "home") this._load(i);
      this.state = "home";
      this.overlay = null;
      this.layout();
      this.ui.hud(false);
      this.ui.tutorialOff();
      this.ui.home({ levelNum: i + 1, stars: totalStars(this.save), gems: this.save.gems });
    }
    startLevel(i) {
      this._load(i);
      this.state = "play";
      this.overlay = null;
      this.acc = 0;
      this.timeScale = 1;
      this.rotated = 0;
      this.t0 = -1;
      this.layout();
      this.ui.show(null);
      this.ui.hud(true);
      this.ui.setHud(i + 1, 0, this.sim.lvl.gems.length);
      this._tutorial();
      this.save.stat.plays++;
      this.platform.gameplayStart();
    }
    restart() {
      if (this.state !== "play" && this.state !== "dying") return;
      this.sim.reset();
      const v = this.view;
      v.ball.visible = true;
      v.ballShadow.visible = true;
      v.ballScale = 1;
      v.zoomTo = 1;
      this.state = "play";
      this.acc = 0;
      this.timeScale = 1;
      this.t0 = -1;
      this.ui.setHud(this.index + 1, 0, this.sim.lvl.gems.length);
    }
    /** Reserve screen space for whatever UI is showing, and frame the arena in the rest. */
    layout() {
      const st = this.view.stage, W = st.clientWidth, H = st.clientHeight, land = W > H * 1.2;
      if (this.state === "home" || this.state === "boot") {
        this.view.insets = land ? { top: 14, bottom: 14, left: Math.min(W * 0.46, 470), right: 10 } : { top: Math.min(140, H * 0.19), bottom: Math.min(250, H * 0.36), left: 0, right: 0 };
      } else {
        this.view.insets = land ? { top: 54, bottom: 14, left: 0, right: 0 } : { top: 60, bottom: 88, left: 0, right: 0 };
      }
      this.view.resize();
    }
    _tutorial() {
      const k = this.sim.lvl.tut, t = (key) => this.i18n.t(key);
      this.tutKind = null;
      if (!k || this.save.stars[this.index]) {
        this.ui.tutorialOff();
        return;
      }
      this.tutKind = k;
      this.tutT = 0;
      if (k === "drag") this.ui.tutorial("swipe", t("tutDrag"));
      else if (k === "both") this.ui.tutorial("swipe", t("tutBoth"));
      else if (k === "flip") this.ui.tutorial("flip", t("tutFlip"));
      else if (k === "spikes") this.ui.tutorial("note", t("tutSpikes"));
      else if (k === "edge") this.ui.tutorial("note", t("tutEdge"));
    }
    // ------------------------------------------------------------------ input (called by Input / UI)
    gesture() {
      this.audio.unlock();
    }
    rotate(d) {
      if (this.state !== "play" || this.overlay || this.paused) return;
      const s = this.sim;
      let t = s.target + d;
      if (t > s.angle + 1) t = s.angle + 1;
      else if (t < s.angle - 1) t = s.angle - 1;
      this.rotated += Math.abs(t - s.target);
      s.target = t;
      if (this.t0 < 0) this.t0 = s.time;
    }
    tap() {
    }
    /** Show the solver's route. Free: a stuck player leaves, a helped one keeps playing. */
    hint() {
      if (this.state !== "play" && this.state !== "dying") return;
      this.hintOn = true;
      this.view.showHint(this.sim.lvl.hint);
      this._assist();
    }
    /** Move on without finishing (opt-in rewarded ad where the platform has ads). */
    async skip() {
      if (this.busy || this.index + 1 >= LEVEL_COUNT || this.state !== "play" && this.state !== "dying") return;
      if (this.platform.caps.ads) {
        this.busy = true;
        const ok = await this.platform.rewarded("skip-level");
        this.busy = false;
        if (!ok) {
          this.ui.toast(this.i18n.t("adFail"));
          return;
        }
      }
      this.save.max = Math.max(this.save.max, this.index + 1);
      this.platform.save(this.save);
      this.startLevel(this.index + 1);
    }
    _assist() {
      const h = !this.hintOn && !!this.sim.lvl.hint && (this.deathsHere >= HINT_AFTER.deaths || this.playT > HINT_AFTER.sec);
      const s = this.index + 1 < LEVEL_COUNT && (this.deathsHere >= SKIP_AFTER.deaths || this.playT > SKIP_AFTER.sec);
      if (h === this._ah && s === this._as) return;
      this._ah = h;
      this._as = s;
      this.ui.assist({ hint: h, skip: s, skipAd: this.platform.caps.ads });
    }
    openShop() {
      this.overlay = "shop";
      this.ui.shop({ owned: this.save.skins, current: this.save.skin, gems: this.save.gems });
    }
    pickSkin(id) {
      const sk = skinById(id), sv = this.save;
      if (sk.id !== id) return;
      if (!sv.skins.includes(id)) {
        if (sv.gems < sk.cost) {
          this.ui.toast(this.i18n.t("notEnough"));
          this.audio.click();
          return;
        }
        sv.gems -= sk.cost;
        sv.skins.push(id);
        this.audio.star(2);
      } else this.audio.click();
      sv.skin = id;
      this.view.setSkin(id);
      this.platform.save(sv);
      this.ui.shop({ owned: sv.skins, current: sv.skin, gems: sv.gems });
    }
    action() {
      if (this.overlay) return;
      if (this.state === "won") this.next();
      else if (this.state === "home") this.startLevel(Math.min(this.save.max, LEVEL_COUNT - 1));
    }
    restartKey() {
      if (!this.overlay) this.restart();
    }
    escape() {
      if (this.overlay) this.closeOverlay();
    }
    arenaCenter() {
      return this.view.toScreen(0, 0, 0);
    }
    openMap() {
      if ((this.state === "play" || this.state === "dying") && !this.overlay) this.platform.gameplayStop("menu");
      this.overlay = "map";
      this.ui.map({ stars: this.save.stars, max: Math.min(this.save.max, LEVEL_COUNT - 1), count: LEVEL_COUNT, current: this.state === "play" ? this.index : -1 });
    }
    openSettings() {
      this.overlay = "settings";
      this.ui.settings(this.save.set);
    }
    closeOverlay() {
      this.overlay = null;
      if (this.state === "play" || this.state === "dying") {
        this.ui.show(null);
        this.platform.gameplayStart(true);
      } else if (this.state === "won") this.ui.show("scrWin");
      else if (this.state === "end") this.ui.show("scrEnd");
      else this.goHome();
    }
    setOpt(key, value) {
      this.save.set[key] = value;
      if (key === "music") this.audio.setMusic(!!value);
      else if (key === "sfx") {
        this.audio.setSfx(!!value);
        if (value) this.audio.click();
      } else if (key === "ctl") this.input.mode = value;
      this.platform.save(this.save);
    }
    async next() {
      if (this.busy || this.state !== "won") return;
      this.busy = true;
      if (this.index >= FIRST_AD_AFTER) await this.platform.interstitial();
      this.busy = false;
      if (this.index + 1 >= LEVEL_COUNT) {
        this.state = "end";
        this.ui.hud(false);
        this.ui.show("scrEnd");
      } else this.startLevel(this.index + 1);
    }
    retry() {
      if (!this.busy) this.startLevel(this.index);
    }
    async double() {
      if (this.busy || !this.result || this.result.doubled) return;
      this.busy = true;
      this.ui.doubleBusy(true);
      const ok = await this.platform.rewarded("double-gems");
      this.busy = false;
      this.ui.doubleBusy(false);
      if (!ok) {
        this.ui.toast(this.i18n.t("adFail"));
        return;
      }
      this.result.doubled = true;
      this.save.gems += this.result.got;
      this.save.earned += this.result.got;
      this.platform.save(this.save);
      this.ui.setWinGems(`${this.result.got}/${this.result.total} \xD72`);
      this.ui.doubleDone();
    }
    // ------------------------------------------------------------------ pause (host-driven)
    pause() {
      if (this.paused) return;
      this.paused = true;
      if (this.raf) {
        cancelAnimationFrame(this.raf);
        this.raf = 0;
      }
      this.input.reset();
      this.audio.pause();
      this.ui.paused(true);
      this.platform.save(this.save, true);
    }
    resume() {
      if (!this.paused) return;
      this.paused = false;
      this.ui.paused(false);
      this.audio.resume();
      this.last = performance.now();
      this._frame(this.last);
    }
    // ------------------------------------------------------------------ loop
    _frame(now) {
      this.raf = 0;
      if (this.paused || this.manual) return;
      const dt = Math.min(0.05, Math.max(1e-3, (now - this.last) / 1e3));
      this.last = now;
      this.t += dt;
      this.fpsT += dt;
      this.fpsN++;
      if (this.fpsT >= 3) {
        if (this.fpsN / this.fpsT < 42) this.view.degrade();
        this.fpsT = 0;
        this.fpsN = 0;
      }
      this._update(dt);
      this.view.draw(this.sim, this.t, dt);
      this.raf = requestAnimationFrame(this._frame);
    }
    _update(dt) {
      const s = this.sim;
      if (this.state === "home") {
        s.angle = Math.sin(this.t * 0.5) * 0.2;
        return;
      }
      if (this.state === "play") {
        if (this.overlay) return;
        if (this.input.keyDir) this.rotate(-this.input.keyDir * WMAX * 0.95 * dt);
        this.acc += dt * this.timeScale;
        let n = 0;
        const bot = this.bot;
        while (this.acc >= DT && n < 12) {
          s.step(bot ? bot.track[s.tick / bot.K | 0] || 0 : void 0);
          this.acc -= DT;
          n++;
          if (!s.alive || s.won) break;
        }
        if (n === 12) this.acc = 0;
        this._events();
        if (this.state === "play") {
          this.playT += dt;
          this._assist();
          this._danger(dt);
          this.audio.roll(Math.hypot(s.vx, s.vy), s.air < 3);
          this._tutTick(dt);
        }
      } else if (this.state === "dying") {
        this.timer -= dt;
        if (this.timer <= 0) this.restart();
      } else if (this.state === "winning") {
        this.timer -= dt;
        this.view.ballScale = Math.max(0, this.timer / 0.45);
        if (this.timer <= 0) {
          this.state = "won";
          this.view.ball.visible = false;
          this.view.ballShadow.visible = false;
          this._showWin();
        }
      }
    }
    _events() {
      const s = this.sim, v = this.view, a = this.audio, ev = s.events;
      for (let i = 0; i < ev.length; i++) {
        const e = ev[i];
        if (e.t === "hit") {
          v.fxHit(e.x, e.y, e.v);
          a.hit(e.v);
        } else if (e.t === "gem") {
          v.fxGem(e.x, e.y);
          a.gem(s.gemCount - 1);
          this.ui.setHud(this.index + 1, s.gemCount, s.lvl.gems.length);
        } else if (e.t === "bump") {
          v.fxBump(e.x, e.y);
          a.bump();
        } else if (e.t === "pad") {
          v.fxPad(e.x, e.y);
          a.pad();
        } else if (e.t === "shatter") {
          v.fxShatter(e.x, e.y);
          a.shatter();
        } else if (e.t === "die") this._die();
        else if (e.t === "win") this._win();
      }
      ev.length = 0;
    }
    /** Bullet-time when the ball is about to touch something deadly. */
    _danger(dt) {
      const s = this.sim, L = s.lvl, r = s.form.r;
      let d = 1e9;
      for (let i = 0; i < L.kills.length; i++) {
        const q = boxDist2(s.x, s.y, L.kills[i]);
        if (q < d) d = q;
      }
      d = Math.sqrt(d);
      for (let i = 0; i < L.saws.length; i++) {
        pathPos(L.saws[i], s.time, _p2);
        const q = Math.hypot(s.x - _p2.x, s.y - _p2.y) - L.saws[i].r;
        if (q < d) d = q;
      }
      const near = d < r + 14 && Math.hypot(s.vx, s.vy) > 70;
      this.timeScale += ((near ? 0.6 : 1) - this.timeScale) * Math.min(1, dt * 10);
    }
    _tutTick(dt) {
      if (!this.tutKind) return;
      this.tutT += dt;
      const k = this.tutKind;
      const done = k === "drag" || k === "both" ? this.rotated > 0.7 : k === "flip" ? Math.abs(this.sim.angle) > 2.2 : this.tutT > 3.5;
      if (done) {
        this.tutKind = null;
        this.ui.tutorialOff();
      }
    }
    _die() {
      const s = this.sim, v = this.view;
      this.state = "dying";
      this.timer = 0.6;
      v.ball.visible = false;
      v.ballShadow.visible = false;
      v.fxDie(s.x, s.y);
      this.audio.die();
      this.audio.roll(0, false);
      this.save.stat.deaths++;
      this.deathsHere++;
      this._assist();
    }
    _win() {
      const s = this.sim, L = s.lvl, sv = this.save, i = this.index;
      this.state = "winning";
      this.timer = 0.45;
      this.view.fxWin(L.goal.x, L.goal.y);
      this.audio.win();
      this.audio.roll(0, false);
      this.ui.tutorialOff();
      const total = L.gems.length, got = s.gemCount, time = Math.max(0.1, s.time - Math.max(0, this.t0));
      const fast = time <= L.par, all = got === total;
      const stars = 1 + (all || fast ? 1 : 0) + (all && fast ? 1 : 0);
      sv.stars[i] = Math.max(sv.stars[i] || 0, stars);
      const tenths = Math.round(time * 10);
      sv.best[i] = sv.best[i] ? Math.min(sv.best[i], tenths) : tenths;
      if (i + 1 < LEVEL_COUNT) sv.max = Math.max(sv.max, i + 1);
      sv.gems += got;
      sv.earned += got;
      sv.stat.wins++;
      for (let k = 0; k < sv.stars.length; k++) if (sv.stars[k] === void 0) sv.stars[k] = 0;
      this.result = { stars, time, par: L.par, got, total, doubled: false };
      this.platform.save(sv);
      this.platform.score(totalStars(sv));
      if (stars === 3) this.platform.happy();
      this.platform.gameplayStop("win");
    }
    _showWin() {
      const r = this.result;
      this.ui.hud(false);
      this.ui.win({ ...r, canDouble: this.platform.caps.ads && r.got > 0, onStar: (i) => this.audio.star(i) });
    }
    // ------------------------------------------------------------------ dev / test hooks (stripped from platform builds)
    devApi() {
      const g = this;
      return {
        game: g,
        start: (i) => g.startLevel(i),
        state: () => ({ state: g.state, index: g.index, overlay: g.overlay, paused: g.paused, x: g.sim.x, y: g.sim.y, angle: g.sim.angle, gems: g.sim.gemCount, alive: g.sim.alive, won: g.sim.won, time: g.sim.time, save: g.save, info: g.view.info() }),
        /** advance the sim n ticks with spin command u, then let the game react */
        step: (n, u = 0) => {
          for (let k = 0; k < n && g.sim.alive && !g.sim.won; k++) g.sim.step(u);
          g._events();
        },
        settle: (sec) => {
          g._update(sec);
        },
        /** replay a solver track in real time on the current level */
        bot: (track, K) => {
          g.bot = track ? { track, K } : null;
          g.t0 = 0;
        },
        /** frame-by-frame mode for video capture: stop the real-time loop, then advance with frame(dt) */
        manual: (on) => {
          g.manual = on;
          if (!on) {
            g.last = performance.now();
            g._frame(g.last);
          }
        },
        frame: (dt) => {
          g.t += dt;
          g._update(dt);
          g.view.draw(g.sim, g.t, dt);
        },
        levelCount: LEVEL_COUNT
      };
    }
  };

  // src/main.js
  async function boot() {
    local_default.loadingShown();
    const i18n = new I18n();
    let raw = null, lang = "en";
    try {
      [raw, lang] = await Promise.all([local_default.load(), local_default.language()]);
    } catch (_) {
    }
    i18n.set(lang);
    const save = migrate(raw);
    let game = null;
    const g = (name) => (...a) => {
      if (game) return game[name](...a);
    };
    const ui = new UI(i18n, {
      play: g("action"),
      next: g("next"),
      retry: g("retry"),
      openMap: g("openMap"),
      pick: g("startLevel"),
      openSettings: g("openSettings"),
      closeOverlay: g("closeOverlay"),
      double: g("double"),
      restart: g("restart"),
      setOpt: g("setOpt"),
      gesture: g("gesture"),
      openShop: g("openShop"),
      pickSkin: g("pickSkin"),
      hint: g("hint"),
      skip: g("skip"),
      home: g("goHome")
    });
    const stage = document.getElementById("stage");
    let tier = detectTier(), startAt = -1;
    if (true) {
      const qs2 = new URLSearchParams(location.search);
      if (qs2.has("tier")) tier = Math.max(0, Math.min(2, qs2.get("tier") | 0));
      if (qs2.has("level")) startAt = (qs2.get("level") | 0) - 1;
      if (qs2.get("ctl") === "grab" || qs2.get("ctl") === "swipe") save.set.ctl = qs2.get("ctl");
    }
    let view;
    try {
      view = new View(stage, tier);
    } catch (_) {
      ui.error();
      local_default.logError();
      local_default.ready();
      return;
    }
    game = new Game({ platform: local_default, view, ui, audio: new GameAudio(), save, i18n });
    if (true) game.devTheme = new URLSearchParams(location.search).get("theme");
    const fit = () => game.layout();
    window.addEventListener("resize", fit);
    if (window.ResizeObserver) new ResizeObserver(fit).observe(stage);
    game.start();
    if (true) {
      window.__fw = game.devApi();
      if (startAt >= 0) game.startLevel(Math.min(startAt, window.__fw.levelCount - 1));
    }
    local_default.ready();
  }
  boot();
})();
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vc3JjL3BsYXRmb3JtL2xvY2FsLmpzIiwgIi4uLy4uL3NyYy9tZXRhL3NhdmUuanMiLCAiLi4vLi4vc3JjL2kxOG4vbG9jYWxlcy5qcyIsICIuLi8uLi9zcmMvaTE4bi9zdHJpbmdzLmpzIiwgIi4uLy4uL3NyYy9zaW0vZm9ybXMuanMiLCAiLi4vLi4vc3JjL3NpbS9zaW0uanMiLCAiLi4vLi4vc3JjL3JlbmRlci90aGVtZXMuanMiLCAiLi4vLi4vc3JjL3JlbmRlci9nZW8uanMiLCAiLi4vLi4vc3JjL3JlbmRlci9meC5qcyIsICIuLi8uLi9zcmMvcmVuZGVyL3NraW5zLmpzIiwgIi4uLy4uL3NyYy9yZW5kZXIvdmlldy5qcyIsICIuLi8uLi9zcmMvdWkvdWkuanMiLCAiLi4vLi4vc3JjL2F1ZGlvL2F1ZGlvLmpzIiwgIi4uLy4uL3NyYy9sZXZlbHMvcGFyc2UuanMiLCAiLi4vLi4vc3JjL2xldmVscy93b3JsZDEuanMiLCAiLi4vLi4vc3JjL2xldmVscy9tZXRhLmdlbi5qcyIsICIuLi8uLi9zcmMvbGV2ZWxzL2luZGV4LmpzIiwgIi4uLy4uL3NyYy9pbnB1dC5qcyIsICIuLi8uLi9zcmMvZ2FtZS5qcyIsICIuLi8uLi9zcmMvbWFpbi5qcyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiLy8gTG9jYWwgLyBnZW5lcmljLXdlYiBhZGFwdGVyOiBkZXZlbG9wbWVudCwgcGxheXRlc3RzIGFuZCBwbGFpbiB3ZWIgaG9zdGluZy5cbi8vIE5vdCB1c2VkIGluIHRoZSBZb3VUdWJlIGJ1aWxkICh0aGF0IG9uZSBtdXN0IG5vdCB0b3VjaCBsb2NhbFN0b3JhZ2UsIHRoZSBQYWdlXG4vLyBWaXNpYmlsaXR5IEFQSSBvciBuYXZpZ2F0b3IubGFuZ3VhZ2UgXHUyMDE0IHNlZSBkb2NzL1BMQVRGT1JNLVJVTEVTLm1kKS5cbmNvbnN0IEtFWSA9IFwiZmxpcHdvcmxkLnNhdmUudjJcIjtcbmNvbnN0IHFzID0gbmV3IFVSTFNlYXJjaFBhcmFtcyhsb2NhdGlvbi5zZWFyY2gpO1xubGV0IHBhdXNlQ2IgPSBudWxsLCByZXN1bWVDYiA9IG51bGw7XG5cbmZ1bmN0aW9uIGZha2VBZChsYWJlbCwgbXMpIHtcbiAgLy8gdmlzaWJsZSBzdGFuZC1pbiBzbyBhZCB0aW1pbmcgY2FuIGJlIGp1ZGdlZCBkdXJpbmcgcGxheXRlc3RzIChvbmx5IHdpdGggP2Fkcz0xKVxuICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICBpZiAocGF1c2VDYikgcGF1c2VDYigpO1xuICAgIGNvbnN0IGVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICBlbC5jbGFzc05hbWUgPSBcImRldi1hZFwiOyBlbC50ZXh0Q29udGVudCA9IGxhYmVsO1xuICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoZWwpO1xuICAgIHNldFRpbWVvdXQoKCkgPT4geyBlbC5yZW1vdmUoKTsgaWYgKHJlc3VtZUNiKSByZXN1bWVDYigpOyByZXNvbHZlKHRydWUpOyB9LCBtcyk7XG4gIH0pO1xufVxuXG5leHBvcnQgZGVmYXVsdCB7XG4gIGlkOiBcImxvY2FsXCIsXG4gIGNhcHM6IHsgYWRzOiBxcy5nZXQoXCJhZHNcIikgPT09IFwiMVwiLCBsYW5ndWFnZU1lbnU6IHRydWUgfSxcblxuICBsb2FkaW5nU2hvd24oKSB7fSxcbiAgcmVhZHkoKSB7fSxcblxuICBhc3luYyBsb2FkKCkge1xuICAgIGlmIChxcy5nZXQoXCJmcmVzaFwiKSA9PT0gXCIxXCIpIHsgdHJ5IHsgbG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oS0VZKTsgfSBjYXRjaCAoXykgeyAvKiBub29wICovIH0gcmV0dXJuIG51bGw7IH1cbiAgICB0cnkgeyBjb25zdCByYXcgPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbShLRVkpOyByZXR1cm4gcmF3ID8gSlNPTi5wYXJzZShyYXcpIDogbnVsbDsgfSBjYXRjaCAoXykgeyByZXR1cm4gbnVsbDsgfVxuICB9LFxuICBzYXZlKGRhdGEpIHsgdHJ5IHsgbG9jYWxTdG9yYWdlLnNldEl0ZW0oS0VZLCBKU09OLnN0cmluZ2lmeShkYXRhKSk7IH0gY2F0Y2ggKF8pIHsgLyogcHJpdmF0ZSBtb2RlICovIH0gfSxcblxuICBhc3luYyBsYW5ndWFnZSgpIHsgcmV0dXJuIHFzLmdldChcImxhbmdcIikgfHwgbmF2aWdhdG9yLmxhbmd1YWdlIHx8IFwiZW5cIjsgfSxcblxuICBhdWRpb0VuYWJsZWQoKSB7IHJldHVybiBxcy5nZXQoXCJtdXRlXCIpICE9PSBcIjFcIjsgfSxcbiAgb25BdWRpb0NoYW5nZSgpIHt9LFxuICBvblBhdXNlKGNiKSB7XG4gICAgcGF1c2VDYiA9IGNiO1xuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJ2aXNpYmlsaXR5Y2hhbmdlXCIsICgpID0+IHsgaWYgKGRvY3VtZW50LmhpZGRlbikgeyBpZiAocGF1c2VDYikgcGF1c2VDYigpOyB9IGVsc2UgaWYgKHJlc3VtZUNiKSByZXN1bWVDYigpOyB9KTtcbiAgfSxcbiAgb25SZXN1bWUoY2IpIHsgcmVzdW1lQ2IgPSBjYjsgfSxcblxuICBhc3luYyBpbnRlcnN0aXRpYWwoKSB7IHJldHVybiB0aGlzLmNhcHMuYWRzID8gZmFrZUFkKFwiQUQgXHUwMEI3IGludGVyc3RpdGlhbCAoZGV2KVwiLCA5MDApIDogZmFsc2U7IH0sXG4gIGFzeW5jIHJld2FyZGVkKGlkKSB7IHJldHVybiB0aGlzLmNhcHMuYWRzID8gZmFrZUFkKFwiQUQgXHUwMEI3IHJld2FyZGVkOiBcIiArIGlkICsgXCIgKGRldilcIiwgMTEwMCkgOiBmYWxzZTsgfSxcblxuICBzY29yZSgpIHt9LCBsb2dFcnJvcigpIHt9LFxuICBnYW1lcGxheVN0YXJ0KCkge30sIGdhbWVwbGF5U3RvcCgpIHt9LCBoYXBweSgpIHt9XG59O1xuIiwgIi8vIFBsYXllciBwcm9ncmVzczogc2NoZW1hLCBtaWdyYXRpb24gZnJvbSBvbGRlciBzYXZlcywgbWVyZ2UuXG4vLyBMYW5ndWFnZSBpcyBkZWxpYmVyYXRlbHkgTk9UIHN0b3JlZCAocGxhdGZvcm0gcnVsZTogaXQgY29tZXMgZnJvbSB0aGUgaG9zdCBlYWNoIHNlc3Npb24pLlxuZXhwb3J0IGNvbnN0IFNBVkVfVkVSU0lPTiA9IDI7XG5cbmV4cG9ydCBmdW5jdGlvbiBmcmVzaFNhdmUoKSB7XG4gIHJldHVybiB7XG4gICAgdjogU0FWRV9WRVJTSU9OLFxuICAgIHN0YXJzOiBbXSwgICAgICAgICAgICAgICAgIC8vIHN0YXJzW2ldID0gYmVzdCBzdGFycyAoMS4uMykgZm9yIGxldmVsIGluZGV4IGk7IDAvdW5kZWZpbmVkID0gbm90IGZpbmlzaGVkXG4gICAgYmVzdDogW10sICAgICAgICAgICAgICAgICAgLy8gYmVzdFtpXSA9IGJlc3QgdGltZSBpbiB0ZW50aHMgb2YgYSBzZWNvbmRcbiAgICBtYXg6IDAsICAgICAgICAgICAgICAgICAgICAvLyBoaWdoZXN0IHVubG9ja2VkIGxldmVsIGluZGV4XG4gICAgZ2VtczogMCwgICAgICAgICAgICAgICAgICAgLy8gc3BlbmRhYmxlIGN1cnJlbmN5XG4gICAgZWFybmVkOiAwLCAgICAgICAgICAgICAgICAgLy8gbGlmZXRpbWUgZ2VtcyAoZm9yIGFjaGlldmVtZW50cylcbiAgICBza2luczogW1wiY2xhc3NpY1wiXSwgc2tpbjogXCJjbGFzc2ljXCIsXG4gICAgc2V0OiB7IG11c2ljOiAxLCBzZng6IDEsIGN0bDogXCJzd2lwZVwiLCBoYXB0aWM6IDEgfSxcbiAgICB0dXQ6IHt9LCAgICAgICAgICAgICAgICAgICAvLyB0dXRvcmlhbCBmbGFncyBhbHJlYWR5IHNob3duXG4gICAgc3RhdDogeyBkZWF0aHM6IDAsIHdpbnM6IDAsIHBsYXlzOiAwIH0sXG4gICAgZGFpbHk6IHsgZGF5OiAwLCBzdHJlYWs6IDAsIGJlc3Q6IDAgfVxuICB9O1xufVxuXG4vKiogQWNjZXB0IGFueXRoaW5nIHRoYXQgd2FzIGV2ZXIgc2F2ZWQgYW5kIHJldHVybiBhIHZhbGlkIGN1cnJlbnQgc2F2ZS4gTmV2ZXIgdGhyb3dzLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG1pZ3JhdGUocmF3KSB7XG4gIGNvbnN0IHMgPSBmcmVzaFNhdmUoKTtcbiAgaWYgKCFyYXcgfHwgdHlwZW9mIHJhdyAhPT0gXCJvYmplY3RcIikgcmV0dXJuIHM7XG4gIHRyeSB7XG4gICAgaWYgKHJhdy52ID09PSAxIHx8IHJhdy51bmxvY2tlZExldmVsICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIC8vIHYxIChwcm90b3R5cGUpOiB7IHVubG9ja2VkTGV2ZWwsIHRvdGFsR2Vtcywgc3RhcnM6e251bTpufSwgdW5sb2NrZWRTaGFwZXMsIGJlc3RTdHJlYWsgfVxuICAgICAgY29uc3Qgc3QgPSByYXcuc3RhcnMgfHwge307XG4gICAgICBmb3IgKGNvbnN0IGsgb2YgT2JqZWN0LmtleXMoc3QpKSB7IGNvbnN0IGkgPSAoayB8IDApIC0gMTsgaWYgKGkgPj0gMCAmJiBpIDwgNTAwKSBzLnN0YXJzW2ldID0gY2xhbXBJbnQoc3Rba10sIDAsIDMpOyB9XG4gICAgICBzLm1heCA9IGNsYW1wSW50KChyYXcudW5sb2NrZWRMZXZlbCB8IDApIC0gMSwgMCwgNTAwKTtcbiAgICAgIHMuZ2VtcyA9IHMuZWFybmVkID0gY2xhbXBJbnQocmF3LnRvdGFsR2VtcywgMCwgMWU2KTtcbiAgICAgIHJldHVybiBzO1xuICAgIH1cbiAgICBpZiAoQXJyYXkuaXNBcnJheShyYXcuc3RhcnMpKSBzLnN0YXJzID0gcmF3LnN0YXJzLnNsaWNlKDAsIDEwMDApLm1hcCgobikgPT4gY2xhbXBJbnQobiwgMCwgMykpO1xuICAgIGlmIChBcnJheS5pc0FycmF5KHJhdy5iZXN0KSkgcy5iZXN0ID0gcmF3LmJlc3Quc2xpY2UoMCwgMTAwMCkubWFwKChuKSA9PiBjbGFtcEludChuLCAwLCAxZTYpKTtcbiAgICBzLm1heCA9IGNsYW1wSW50KHJhdy5tYXgsIDAsIDEwMDApO1xuICAgIHMuZ2VtcyA9IGNsYW1wSW50KHJhdy5nZW1zLCAwLCAxZTcpO1xuICAgIHMuZWFybmVkID0gY2xhbXBJbnQocmF3LmVhcm5lZCwgcy5nZW1zLCAxZTcpO1xuICAgIGlmIChBcnJheS5pc0FycmF5KHJhdy5za2lucykpIHMuc2tpbnMgPSBbLi4ubmV3IFNldChbXCJjbGFzc2ljXCIsIC4uLnJhdy5za2lucy5maWx0ZXIoKHgpID0+IHR5cGVvZiB4ID09PSBcInN0cmluZ1wiKV0pXS5zbGljZSgwLCAyMDApO1xuICAgIGlmICh0eXBlb2YgcmF3LnNraW4gPT09IFwic3RyaW5nXCIgJiYgcy5za2lucy5pbmNsdWRlcyhyYXcuc2tpbikpIHMuc2tpbiA9IHJhdy5za2luO1xuICAgIGlmIChyYXcuc2V0ICYmIHR5cGVvZiByYXcuc2V0ID09PSBcIm9iamVjdFwiKSB7XG4gICAgICBzLnNldC5tdXNpYyA9IHJhdy5zZXQubXVzaWMgPyAxIDogMDsgcy5zZXQuc2Z4ID0gcmF3LnNldC5zZnggPyAxIDogMDsgcy5zZXQuaGFwdGljID0gcmF3LnNldC5oYXB0aWMgPyAxIDogMDtcbiAgICAgIHMuc2V0LmN0bCA9IHJhdy5zZXQuY3RsID09PSBcImdyYWJcIiA/IFwiZ3JhYlwiIDogXCJzd2lwZVwiO1xuICAgIH1cbiAgICBpZiAocmF3LnR1dCAmJiB0eXBlb2YgcmF3LnR1dCA9PT0gXCJvYmplY3RcIikgZm9yIChjb25zdCBrIG9mIE9iamVjdC5rZXlzKHJhdy50dXQpLnNsaWNlKDAsIDUwKSkgcy50dXRba10gPSAxO1xuICAgIGlmIChyYXcuc3RhdCAmJiB0eXBlb2YgcmF3LnN0YXQgPT09IFwib2JqZWN0XCIpIHsgcy5zdGF0LmRlYXRocyA9IGNsYW1wSW50KHJhdy5zdGF0LmRlYXRocywgMCwgMWU5KTsgcy5zdGF0LndpbnMgPSBjbGFtcEludChyYXcuc3RhdC53aW5zLCAwLCAxZTkpOyBzLnN0YXQucGxheXMgPSBjbGFtcEludChyYXcuc3RhdC5wbGF5cywgMCwgMWU5KTsgfVxuICAgIGlmIChyYXcuZGFpbHkgJiYgdHlwZW9mIHJhdy5kYWlseSA9PT0gXCJvYmplY3RcIikgeyBzLmRhaWx5LmRheSA9IGNsYW1wSW50KHJhdy5kYWlseS5kYXksIDAsIDFlOSk7IHMuZGFpbHkuc3RyZWFrID0gY2xhbXBJbnQocmF3LmRhaWx5LnN0cmVhaywgMCwgMWU2KTsgcy5kYWlseS5iZXN0ID0gY2xhbXBJbnQocmF3LmRhaWx5LmJlc3QsIDAsIDFlNik7IH1cbiAgfSBjYXRjaCAoXykgeyByZXR1cm4gZnJlc2hTYXZlKCk7IH1cbiAgcmV0dXJuIHM7XG59XG5cbmZ1bmN0aW9uIGNsYW1wSW50KG4sIGxvLCBoaSkgeyBuID0gTnVtYmVyKG4pOyBpZiAoIWlzRmluaXRlKG4pKSBuID0gbG87IG4gPSBNYXRoLmZsb29yKG4pOyByZXR1cm4gbiA8IGxvID8gbG8gOiBuID4gaGkgPyBoaSA6IG47IH1cblxuLyoqIENvbWJpbmUgdHdvIHNhdmVzIHdpdGhvdXQgbG9zaW5nIHByb2dyZXNzIGZyb20gZWl0aGVyICh1c2VkIGFmdGVyIGEgZmFpbGVkIGNsb3VkIGxvYWQpLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG1lcmdlU2F2ZXMoYSwgYikge1xuICBjb25zdCBBID0gbWlncmF0ZShhKSwgQiA9IG1pZ3JhdGUoYik7XG4gIGNvbnN0IG91dCA9IHRvdGFsU3RhcnMoQSkgPj0gdG90YWxTdGFycyhCKSA/IEEgOiBCLCBvdGhlciA9IG91dCA9PT0gQSA/IEIgOiBBO1xuICBjb25zdCBuID0gTWF0aC5tYXgoQS5zdGFycy5sZW5ndGgsIEIuc3RhcnMubGVuZ3RoKTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBuOyBpKyspIHtcbiAgICBvdXQuc3RhcnNbaV0gPSBNYXRoLm1heChBLnN0YXJzW2ldIHx8IDAsIEIuc3RhcnNbaV0gfHwgMCk7XG4gICAgY29uc3QgeCA9IEEuYmVzdFtpXSB8fCAwLCB5ID0gQi5iZXN0W2ldIHx8IDA7XG4gICAgb3V0LmJlc3RbaV0gPSB4ICYmIHkgPyBNYXRoLm1pbih4LCB5KSA6IHggfHwgeTtcbiAgfVxuICBvdXQubWF4ID0gTWF0aC5tYXgoQS5tYXgsIEIubWF4KTtcbiAgb3V0LmdlbXMgPSBNYXRoLm1heChBLmdlbXMsIEIuZ2Vtcyk7XG4gIG91dC5lYXJuZWQgPSBNYXRoLm1heChBLmVhcm5lZCwgQi5lYXJuZWQpO1xuICBvdXQuc2tpbnMgPSBbLi4ubmV3IFNldChbLi4uQS5za2lucywgLi4uQi5za2luc10pXTtcbiAgZm9yIChjb25zdCBrIG9mIE9iamVjdC5rZXlzKG90aGVyLnR1dCkpIG91dC50dXRba10gPSAxO1xuICByZXR1cm4gb3V0O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdG90YWxTdGFycyhzKSB7IGxldCB0ID0gMDsgZm9yIChsZXQgaSA9IDA7IGkgPCBzLnN0YXJzLmxlbmd0aDsgaSsrKSB0ICs9IHMuc3RhcnNbaV0gfHwgMDsgcmV0dXJuIHQ7IH1cbiIsICIvLyBBZGRpdGlvbmFsIGxhbmd1YWdlcy4gRWFjaCByb3cgZm9sbG93cyBLRVlTIGV4YWN0bHk7IHN0cmluZ3MuanMgdHVybnMgdGhlIHJvd3MgaW50byB0YWJsZXMuXG4vLyBMYWJlbHMgYXJlIGtlcHQgc2hvcnQgb24gcHVycG9zZSAodGhleSBzaXQgb24gYnV0dG9ucykuIEVuZ2xpc2ggKyBBcmFiaWMgbGl2ZSBpbiBzdHJpbmdzLmpzLlxuZXhwb3J0IGNvbnN0IEtFWVMgPSBbXG4gIFwibG9hZGluZ1wiLCBcImxldmVsXCIsIFwibGV2ZWxzXCIsIFwibmV4dFwiLCBcInJldHJ5XCIsIFwic2V0dGluZ3NcIiwgXCJtdXNpY1wiLCBcInNmeFwiLCBcImNvbnRyb2xcIiwgXCJjdGxTd2lwZVwiLCBcImN0bEdyYWJcIixcbiAgXCJ3aW4xXCIsIFwid2luMlwiLCBcIndpbjNcIiwgXCJwYXVzZWRcIiwgXCJ0dXREcmFnXCIsIFwidHV0Qm90aFwiLCBcInR1dFNwaWtlc1wiLCBcInR1dEZsaXBcIiwgXCJ0dXRFZGdlXCIsXG4gIFwiZW5kVGl0bGVcIiwgXCJlbmRCb2R5XCIsIFwiZG91YmxlR2Vtc1wiLCBcImFkRmFpbFwiLCBcIm5vV2ViZ2xcIiwgXCJjbG9zZVwiLCBcInNraW5zXCIsIFwiaGludFwiLCBcInNraXBcIiwgXCJub3RFbm91Z2hcIiwgXCJlcXVpcHBlZFwiXG5dO1xuXG5leHBvcnQgY29uc3QgUk9XUyA9IHtcbiAgZXM6IFtcIkNhcmdhbmRvXHUyMDI2XCIsIFwiTml2ZWxcIiwgXCJOaXZlbGVzXCIsIFwiU2lndWllbnRlXCIsIFwiUmVpbnRlbnRhclwiLCBcIkFqdXN0ZXNcIiwgXCJNXHUwMEZBc2ljYVwiLCBcIlNvbmlkb3NcIiwgXCJDb250cm9sZXNcIiwgXCJEZXNsaXphclwiLCBcIkFnYXJyYXIgeSBnaXJhclwiLFxuICAgIFwiXHUwMEExQmllbiFcIiwgXCJcdTAwQTFHZW5pYWwhXCIsIFwiXHUwMEExUGVyZmVjdG8hXCIsIFwiRW4gcGF1c2FcIiwgXCJBcnJhc3RyYSBwYXJhIGluY2xpbmFyIGVsIG11bmRvXCIsIFwiSW5jbGluYSBhIGFtYm9zIGxhZG9zXCIsIFwiRWwgcm9qbyBlcyBwZWxpZ3JvXCIsIFwiUG9ubG8gYm9jYSBhYmFqb1wiLCBcIk5vIHRlIGNhaWdhc1wiLFxuICAgIFwiXHUwMEExTXVuZG8gY29tcGxldGFkbyFcIiwgXCJUZXJtaW5hc3RlIHRvZG9zIGxvcyBuaXZlbGVzLiBWaWVuZW4gbVx1MDBFMXMgbXVuZG9zOiBcdTAwQTF2dWVsdmUgcG9yIGxhcyAzIGVzdHJlbGxhcyFcIiwgXCJEdXBsaWNhciBnZW1hc1wiLCBcIk5vIGhheSBhbnVuY2lvcyBwb3IgYWhvcmFcIiwgXCJFc3RlIGRpc3Bvc2l0aXZvIG5vIHB1ZWRlIG1vc3RyYXIgZ3JcdTAwRTFmaWNvcyAzRC5cIiwgXCJDZXJyYXJcIiwgXCJCb2xhc1wiLCBcIlBpc3RhXCIsIFwiU2FsdGFyIG5pdmVsXCIsIFwiRmFsdGFuIGdlbWFzXCIsIFwiRW4gdXNvXCJdLFxuICBwdDogW1wiQ2FycmVnYW5kb1x1MjAyNlwiLCBcIk5cdTAwRUR2ZWxcIiwgXCJOXHUwMEVEdmVpc1wiLCBcIlByXHUwMEYzeGltb1wiLCBcIlJlcGV0aXJcIiwgXCJBanVzdGVzXCIsIFwiTVx1MDBGQXNpY2FcIiwgXCJTb25zXCIsIFwiQ29udHJvbGVzXCIsIFwiRGVzbGl6YXJcIiwgXCJQZWdhciBlIGdpcmFyXCIsXG4gICAgXCJCb2EhXCIsIFwiXHUwMEQzdGltbyFcIiwgXCJQZXJmZWl0byFcIiwgXCJQYXVzYWRvXCIsIFwiQXJyYXN0ZSBwYXJhIGluY2xpbmFyIG8gbXVuZG9cIiwgXCJJbmNsaW5lIHBhcmEgb3MgZG9pcyBsYWRvc1wiLCBcIlZlcm1lbGhvIFx1MDBFOSBwZXJpZ29cIiwgXCJWaXJlIGRlIGNhYmVcdTAwRTdhIHBhcmEgYmFpeG9cIiwgXCJOXHUwMEUzbyBjYWlhXCIsXG4gICAgXCJNdW5kbyBjb21wbGV0byFcIiwgXCJWb2NcdTAwRUEgdGVybWlub3UgdG9kb3Mgb3Mgblx1MDBFRHZlaXMuIE1haXMgbXVuZG9zIHZcdTAwRUFtIGFcdTAwRUQ6IHZvbHRlIHBlbGFzIDMgZXN0cmVsYXMhXCIsIFwiRG9icmFyIGdlbWFzXCIsIFwiTmVuaHVtIGFuXHUwMEZBbmNpbyBhZ29yYVwiLCBcIkVzdGUgYXBhcmVsaG8gblx1MDBFM28gZXhpYmUgZ3JcdTAwRTFmaWNvcyAzRC5cIiwgXCJGZWNoYXJcIiwgXCJCb2xhc1wiLCBcIkRpY2FcIiwgXCJQdWxhciBuXHUwMEVEdmVsXCIsIFwiRmFsdGFtIGdlbWFzXCIsIFwiRW0gdXNvXCJdLFxuICBkZTogW1wiTFx1MDBFNGR0XHUyMDI2XCIsIFwiTGV2ZWxcIiwgXCJMZXZlbFwiLCBcIldlaXRlclwiLCBcIk5vY2htYWxcIiwgXCJFaW5zdGVsbHVuZ2VuXCIsIFwiTXVzaWtcIiwgXCJTb3VuZGVmZmVrdGVcIiwgXCJTdGV1ZXJ1bmdcIiwgXCJXaXNjaGVuXCIsIFwiR3JlaWZlbiAmIGRyZWhlblwiLFxuICAgIFwiR3V0IVwiLCBcIlN1cGVyIVwiLCBcIlBlcmZla3QhXCIsIFwiUGF1c2llcnRcIiwgXCJaaWVoZW4sIHVtIGRpZSBXZWx0IHp1IGtpcHBlblwiLCBcIktpcHBlIGluIGJlaWRlIFJpY2h0dW5nZW5cIiwgXCJSb3QgaGVpXHUwMERGdCBHZWZhaHJcIiwgXCJTdGVsbCBzaWUgYXVmIGRlbiBLb3BmXCIsIFwiRmFsbCBuaWNodCByYXVzXCIsXG4gICAgXCJXZWx0IGdlc2NoYWZmdCFcIiwgXCJEdSBoYXN0IGFsbGUgTGV2ZWwgZ2VzY2hhZmZ0LiBXZWl0ZXJlIFdlbHRlbiBrb21tZW4gXHUyMDEzIGhvbCBkaXIgbm9jaCAzIFN0ZXJuZSFcIiwgXCJFZGVsc3RlaW5lIHgyXCIsIFwiR2VyYWRlIGtlaW5lIFdlcmJ1bmcgZGFcIiwgXCJEaWVzZXMgR2VyXHUwMEU0dCBrYW5uIGtlaW5lIDNELUdyYWZpayBhbnplaWdlbi5cIiwgXCJTY2hsaWVcdTAwREZlblwiLCBcIkJcdTAwRTRsbGVcIiwgXCJUaXBwXCIsIFwiTGV2ZWwgXHUwMEZDYmVyc3ByaW5nZW5cIiwgXCJadSB3ZW5pZyBFZGVsc3RlaW5lXCIsIFwiQWt0aXZcIl0sXG4gIGZyOiBbXCJDaGFyZ2VtZW50XHUyMDI2XCIsIFwiTml2ZWF1XCIsIFwiTml2ZWF1eFwiLCBcIlN1aXZhbnRcIiwgXCJSZWpvdWVyXCIsIFwiUlx1MDBFOWdsYWdlc1wiLCBcIk11c2lxdWVcIiwgXCJFZmZldHMgc29ub3Jlc1wiLCBcIkNvbW1hbmRlc1wiLCBcIkdsaXNzZXJcIiwgXCJTYWlzaXIgZXQgdG91cm5lclwiLFxuICAgIFwiQmllbiAhXCIsIFwiU3VwZXIgIVwiLCBcIlBhcmZhaXQgIVwiLCBcIkVuIHBhdXNlXCIsIFwiR2xpc3NlIHBvdXIgaW5jbGluZXIgbGUgbW9uZGVcIiwgXCJJbmNsaW5lIGRlcyBkZXV4IGNcdTAwRjR0XHUwMEU5c1wiLCBcIkxlIHJvdWdlLCBjJ2VzdCBkYW5nZXJcIiwgXCJSZXRvdXJuZS1sZVwiLCBcIk5lIHRvbWJlIHBhc1wiLFxuICAgIFwiTW9uZGUgdGVybWluXHUwMEU5ICFcIiwgXCJUdSBhcyBmaW5pIHRvdXMgbGVzIG5pdmVhdXguIEQnYXV0cmVzIG1vbmRlcyBhcnJpdmVudCA6IHJldmllbnMgY2hlcmNoZXIgbGVzIDMgXHUwMEU5dG9pbGVzICFcIiwgXCJEb3VibGVyIGxlcyBnZW1tZXNcIiwgXCJQYXMgZGUgcHViIHBvdXIgbCdpbnN0YW50XCIsIFwiQ2V0IGFwcGFyZWlsIG5lIHBldXQgcGFzIGFmZmljaGVyIGxhIDNELlwiLCBcIkZlcm1lclwiLCBcIkJhbGxlc1wiLCBcIkluZGljZVwiLCBcIlBhc3NlciBsZSBuaXZlYXVcIiwgXCJQYXMgYXNzZXogZGUgZ2VtbWVzXCIsIFwiVXRpbGlzXHUwMEU5ZVwiXSxcbiAgaXQ6IFtcIkNhcmljYW1lbnRvXHUyMDI2XCIsIFwiTGl2ZWxsb1wiLCBcIkxpdmVsbGlcIiwgXCJBdmFudGlcIiwgXCJSaXByb3ZhXCIsIFwiSW1wb3N0YXppb25pXCIsIFwiTXVzaWNhXCIsIFwiRWZmZXR0aSBzb25vcmlcIiwgXCJDb21hbmRpXCIsIFwiU2NvcnJpXCIsIFwiQWZmZXJyYSBlIHJ1b3RhXCIsXG4gICAgXCJCZW5lIVwiLCBcIk90dGltbyFcIiwgXCJQZXJmZXR0byFcIiwgXCJJbiBwYXVzYVwiLCBcIlRyYXNjaW5hIHBlciBpbmNsaW5hcmUgaWwgbW9uZG9cIiwgXCJJbmNsaW5hIGRhIGVudHJhbWJpIGkgbGF0aVwiLCBcIklsIHJvc3NvIFx1MDBFOCBwZXJpY29sb1wiLCBcIkNhcG92b2xnaWxvXCIsIFwiTm9uIGNhZGVyZSBmdW9yaVwiLFxuICAgIFwiTW9uZG8gY29tcGxldGF0byFcIiwgXCJIYWkgZmluaXRvIHR1dHRpIGkgbGl2ZWxsaS4gQWx0cmkgbW9uZGkgaW4gYXJyaXZvOiB0b3JuYSBhIHByZW5kZXJlIGxlIDMgc3RlbGxlIVwiLCBcIlJhZGRvcHBpYSBnZW1tZVwiLCBcIk5lc3N1biBhbm51bmNpbyBvcmFcIiwgXCJRdWVzdG8gZGlzcG9zaXRpdm8gbm9uIHB1XHUwMEYyIG1vc3RyYXJlIGxhIGdyYWZpY2EgM0QuXCIsIFwiQ2hpdWRpXCIsIFwiUGFsbGluZVwiLCBcIkFpdXRvXCIsIFwiU2FsdGEgbGl2ZWxsb1wiLCBcIkdlbW1lIGluc3VmZmljaWVudGlcIiwgXCJJbiB1c29cIl0sXG4gIGphOiBbXCJcdThBQURcdTMwN0ZcdThGQkNcdTMwN0ZcdTRFMkRcdTIwMjZcIiwgXCJcdTMwRUNcdTMwRDlcdTMwRUJcIiwgXCJcdTMwRUNcdTMwRDlcdTMwRUJcdTRFMDBcdTg5QTdcIiwgXCJcdTZCMjFcdTMwNzhcIiwgXCJcdTMwRUFcdTMwQzhcdTMwRTlcdTMwQTRcIiwgXCJcdThBMkRcdTVCOUFcIiwgXCJcdTk3RjNcdTY5N0RcIiwgXCJcdTUyQjlcdTY3OUNcdTk3RjNcIiwgXCJcdTY0Q0RcdTRGNUNcIiwgXCJcdTMwQjlcdTMwRUZcdTMwQTRcdTMwRDdcIiwgXCJcdTMwNjRcdTMwNEJcdTMwOTNcdTMwNjdcdTU2REVcdTMwNTlcIixcbiAgICBcIlx1MzA0NFx1MzA0NFx1MzA2RFx1RkYwMVwiLCBcIlx1MzA1OVx1MzA1NFx1MzA0NFx1RkYwMVwiLCBcIlx1MzBEMVx1MzBGQ1x1MzBENVx1MzBBN1x1MzBBRlx1MzBDOFx1RkYwMVwiLCBcIlx1NEUwMFx1NjY0Mlx1NTA1Q1x1NkI2Mlx1NEUyRFwiLCBcIlx1MzBDOVx1MzBFOVx1MzBDM1x1MzBCMFx1MzA1N1x1MzA2Nlx1NEUxNlx1NzU0Q1x1MzA5Mlx1NTBCRVx1MzA1MVx1MzA4OFx1MzA0NlwiLCBcIlx1NURFNlx1NTNGM1x1MzA2OVx1MzA2MVx1MzA4OVx1MzA2Qlx1MzA4Mlx1NTBCRVx1MzA1MVx1MzA4OFx1MzA0NlwiLCBcIlx1OEQ2NFx1MzA2Rlx1NTM3MVx1OTY3QVx1RkYwMVwiLCBcIlx1MzA1NVx1MzA0Qlx1MzA1NVx1MzA3RVx1MzA2Qlx1MzA1N1x1MzA4OFx1MzA0NlwiLCBcIlx1ODQzRFx1MzA2MVx1MzA2QVx1MzA0NFx1MzA4OFx1MzA0Nlx1MzA2QlwiLFxuICAgIFwiXHUzMEVGXHUzMEZDXHUzMEVCXHUzMEM5XHUzMEFGXHUzMEVBXHUzMEEyXHVGRjAxXCIsIFwiXHUzMDU5XHUzMDc5XHUzMDY2XHUzMDZFXHUzMEVDXHUzMEQ5XHUzMEVCXHUzMDkyXHUzMEFGXHUzMEVBXHUzMEEyXHVGRjAxXHU2NUIwXHUzMDU3XHUzMDQ0XHUzMEVGXHUzMEZDXHUzMEVCXHUzMEM5XHUzMDgyXHU2RTk2XHU1MDk5XHU0RTJEXHUzMDAyXHU2NjFGM1x1MzA2NFx1MzA5Mlx1NzZFRVx1NjMwN1x1MzA1RFx1MzA0Nlx1RkYwMVwiLCBcIlx1MzBCOFx1MzBBN1x1MzBFMDJcdTUwMERcIiwgXCJcdTRFQ0FcdTMwNkZcdTVFODNcdTU0NEFcdTMwNENcdTMwNDJcdTMwOEFcdTMwN0VcdTMwNUJcdTMwOTNcIiwgXCJcdTMwNTNcdTMwNkVcdTdBRUZcdTY3MkJcdTMwNjdcdTMwNkYzRFx1MzA5Mlx1ODg2OFx1NzkzQVx1MzA2N1x1MzA0RFx1MzA3RVx1MzA1Qlx1MzA5M1x1MzAwMlwiLCBcIlx1OTU4OVx1MzA1OFx1MzA4QlwiLCBcIlx1MzBEQ1x1MzBGQ1x1MzBFQlwiLCBcIlx1MzBEMlx1MzBGM1x1MzBDOFwiLCBcIlx1MzBCOVx1MzBBRFx1MzBDM1x1MzBEN1wiLCBcIlx1MzBCOFx1MzBBN1x1MzBFMFx1MzA0Q1x1OERCM1x1MzA4QVx1MzA3RVx1MzA1Qlx1MzA5M1wiLCBcIlx1NEY3Rlx1NzUyOFx1NEUyRFwiXSxcbiAgdHI6IFtcIllcdTAwRkNrbGVuaXlvclx1MjAyNlwiLCBcIkJcdTAwRjZsXHUwMEZDbVwiLCBcIkJcdTAwRjZsXHUwMEZDbWxlclwiLCBcIlx1MDEzMGxlcmlcIiwgXCJUZWtyYXJcIiwgXCJBeWFybGFyXCIsIFwiTVx1MDBGQ3ppa1wiLCBcIlNlcyBlZmVrdGxlcmlcIiwgXCJLb250cm9sbGVyXCIsIFwiS2F5ZFx1MDEzMXJcIiwgXCJUdXQgdmUgXHUwMEU3ZXZpclwiLFxuICAgIFwiR1x1MDBGQ3plbCFcIiwgXCJIYXJpa2EhXCIsIFwiTVx1MDBGQ2tlbW1lbCFcIiwgXCJEdXJha2xhdFx1MDEzMWxkXHUwMTMxXCIsIFwiRFx1MDBGQ255YXlcdTAxMzEgZVx1MDExRm1layBpXHUwMEU3aW4gc1x1MDBGQ3JcdTAwRkNrbGVcIiwgXCJcdTAxMzBraSB5XHUwMEY2bmUgZGUgZVx1MDExRlwiLCBcIktcdTAxMzFybVx1MDEzMXpcdTAxMzEgdGVobGlrZWRpclwiLCBcIkJhXHUwMTVGIGFcdTAxNUZhXHUwMTFGXHUwMTMxIFx1MDBFN2V2aXJcIiwgXCJEXHUwMTMxXHUwMTVGYXJcdTAxMzEgZFx1MDBGQ1x1MDE1Rm1lXCIsXG4gICAgXCJEXHUwMEZDbnlhIHRhbWFtbGFuZFx1MDEzMSFcIiwgXCJUXHUwMEZDbSBiXHUwMEY2bFx1MDBGQ21sZXJpIGJpdGlyZGluLiBZZW5pIGRcdTAwRkNueWFsYXIgeW9sZGE6IDMgeVx1MDEzMWxkXHUwMTMxeiBpXHUwMEU3aW4gZ2VyaSBkXHUwMEY2biFcIiwgXCJFbG1hc2xhclx1MDEzMSBpa2l5ZSBrYXRsYVwiLCBcIlx1MDE1RXUgYW4gcmVrbGFtIHlva1wiLCBcIkJ1IGNpaGF6IDNEIGdyYWZpayBnXHUwMEY2c3RlcmVtaXlvci5cIiwgXCJLYXBhdFwiLCBcIlRvcGxhclwiLCBcIlx1MDEzMHB1Y3VcIiwgXCJCXHUwMEY2bFx1MDBGQ21cdTAwRkMgZ2VcdTAwRTdcIiwgXCJZZXRlcmxpIGVsbWFzIHlva1wiLCBcIkt1bGxhblx1MDEzMW1kYVwiXSxcbiAgaWQ6IFtcIk1lbXVhdFx1MjAyNlwiLCBcIkxldmVsXCIsIFwiTGV2ZWxcIiwgXCJMYW5qdXRcIiwgXCJVbGFuZ2lcIiwgXCJQZW5nYXR1cmFuXCIsIFwiTXVzaWtcIiwgXCJFZmVrIHN1YXJhXCIsIFwiS29udHJvbFwiLCBcIkdlc2VyXCIsIFwiUGVnYW5nICYgcHV0YXJcIixcbiAgICBcIkJhZ3VzIVwiLCBcIkhlYmF0IVwiLCBcIlNlbXB1cm5hIVwiLCBcIkRpamVkYVwiLCBcIlNlcmV0IHVudHVrIG1lbWlyaW5na2FuIGR1bmlhXCIsIFwiTWlyaW5na2FuIGtlIGR1YSBhcmFoXCIsIFwiTWVyYWggYmVyYXJ0aSBiYWhheWFcIiwgXCJCYWxpa2thbiBkdW5pYW55YVwiLCBcIkphbmdhbiBzYW1wYWkgamF0dWhcIixcbiAgICBcIkR1bmlhIHNlbGVzYWkhXCIsIFwiS2FtdSBtZW5hbWF0a2FuIHNlbXVhIGxldmVsLiBEdW5pYSBiYXJ1IHNlZ2VyYSBoYWRpcjoga2VtYmFsaSB1bnR1ayAzIGJpbnRhbmchXCIsIFwiR2FuZGFrYW4gcGVybWF0YVwiLCBcIkJlbHVtIGFkYSBpa2xhbiBzYWF0IGluaVwiLCBcIlBlcmFuZ2thdCBpbmkgdGlkYWsgYmlzYSBtZW5hbXBpbGthbiBncmFmaWsgM0QuXCIsIFwiVHV0dXBcIiwgXCJCb2xhXCIsIFwiUGV0dW5qdWtcIiwgXCJMZXdhdGkgbGV2ZWxcIiwgXCJQZXJtYXRhIGt1cmFuZ1wiLCBcIkRpcGFrYWlcIl0sXG4gIGhpOiBbXCJcdTA5MzJcdTA5NEJcdTA5MjEgXHUwOTM5XHUwOTRCIFx1MDkzMFx1MDkzOVx1MDkzRSBcdTA5MzlcdTA5NDhcdTIwMjZcIiwgXCJcdTA5MzJcdTA5NDdcdTA5MzVcdTA5MzJcIiwgXCJcdTA5MzJcdTA5NDdcdTA5MzVcdTA5MzJcIiwgXCJcdTA5MDZcdTA5MTdcdTA5NDdcIiwgXCJcdTA5MkJcdTA5M0ZcdTA5MzAgXHUwOTM4XHUwOTQ3XCIsIFwiXHUwOTM4XHUwOTQ3XHUwOTFGXHUwOTNGXHUwOTAyXHUwOTE3XHUwOTREXHUwOTM4XCIsIFwiXHUwOTM4XHUwOTAyXHUwOTE3XHUwOTQwXHUwOTI0XCIsIFwiXHUwOTI3XHUwOTREXHUwOTM1XHUwOTI4XHUwOTNGIFx1MDkyQVx1MDk0RFx1MDkzMFx1MDkyRFx1MDkzRVx1MDkzNVwiLCBcIlx1MDkxNVx1MDkwMlx1MDkxRlx1MDk0RFx1MDkzMFx1MDk0Qlx1MDkzMlwiLCBcIlx1MDkzOFx1MDk0RFx1MDkzNVx1MDkzRVx1MDkwN1x1MDkyQVwiLCBcIlx1MDkyQVx1MDkxNVx1MDkyMVx1MDkzQ1x1MDk0QiBcdTA5MTRcdTA5MzAgXHUwOTE4XHUwOTQxXHUwOTJFXHUwOTNFXHUwOTEzXCIsXG4gICAgXCJcdTA5MkNcdTA5MjJcdTA5M0NcdTA5M0ZcdTA5MkZcdTA5M0UhXCIsIFwiXHUwOTM2XHUwOTNFXHUwOTI4XHUwOTI2XHUwOTNFXHUwOTMwIVwiLCBcIlx1MDkyQVx1MDkzMFx1MDkyQlx1MDkzQ1x1MDk0N1x1MDkxNVx1MDk0RFx1MDkxRiFcIiwgXCJcdTA5MzBcdTA5NDFcdTA5MTVcdTA5M0UgXHUwOTM5XHUwOTQxXHUwOTA2XCIsIFwiXHUwOTI2XHUwOTQxXHUwOTI4XHUwOTNGXHUwOTJGXHUwOTNFIFx1MDkxRFx1MDk0MVx1MDkxNVx1MDkzRVx1MDkyOFx1MDk0NyBcdTA5MTVcdTA5NDcgXHUwOTMyXHUwOTNGXHUwOTBGIFx1MDkxNlx1MDk0MFx1MDkwMlx1MDkxQVx1MDk0QlwiLCBcIlx1MDkyNlx1MDk0Qlx1MDkyOFx1MDk0Qlx1MDkwMiBcdTA5MjRcdTA5MzBcdTA5MkJcdTA5M0MgXHUwOTFEXHUwOTQxXHUwOTE1XHUwOTNFXHUwOTEzXCIsIFwiXHUwOTMyXHUwOTNFXHUwOTMyIFx1MDkyRVx1MDkyNFx1MDkzMlx1MDkyQyBcdTA5MTZcdTA5M0NcdTA5MjRcdTA5MzBcdTA5M0VcIiwgXCJcdTA5MDdcdTA5MzhcdTA5NDcgXHUwOTA5XHUwOTMyXHUwOTREXHUwOTFGXHUwOTNFIFx1MDkxNVx1MDkzMCBcdTA5MjZcdTA5NEJcIiwgXCJcdTA5MkNcdTA5M0VcdTA5MzlcdTA5MzAgXHUwOTJFXHUwOTI0IFx1MDkxN1x1MDkzRlx1MDkzMFx1MDkyOFx1MDkzRVwiLFxuICAgIFwiXHUwOTI2XHUwOTQxXHUwOTI4XHUwOTNGXHUwOTJGXHUwOTNFIFx1MDkyQVx1MDk0Mlx1MDkzMFx1MDk0MCFcIiwgXCJcdTA5MjRcdTA5NDFcdTA5MkVcdTA5MjhcdTA5NDcgXHUwOTM4XHUwOTNFXHUwOTMwXHUwOTQ3IFx1MDkzMlx1MDk0N1x1MDkzNVx1MDkzMiBcdTA5MkFcdTA5NDJcdTA5MzBcdTA5NDcgXHUwOTE1XHUwOTMwIFx1MDkzMlx1MDkzRlx1MDkwRlx1MDk2NCBcdTA5MjhcdTA5MDggXHUwOTI2XHUwOTQxXHUwOTI4XHUwOTNGXHUwOTJGXHUwOTNFIFx1MDkwNiBcdTA5MzBcdTA5MzlcdTA5NDAgXHUwOTM5XHUwOTQ4XHUwOTAyIFx1MjAxNCAzIFx1MDkzOFx1MDk0RFx1MDkxRlx1MDkzRVx1MDkzMCBcdTA5MTVcdTA5NDcgXHUwOTMyXHUwOTNGXHUwOTBGIFx1MDkzNVx1MDkzRVx1MDkyQVx1MDkzOCBcdTA5MDZcdTA5MTMhXCIsIFwiXHUwOTMwXHUwOTI0XHUwOTREXHUwOTI4IFx1MDkyNlx1MDk0Qlx1MDkxN1x1MDk0MVx1MDkyOFx1MDk0NyBcdTA5MTVcdTA5MzBcdTA5NEJcIiwgXCJcdTA5MDVcdTA5MkRcdTA5NDAgXHUwOTE1XHUwOTRCXHUwOTA4IFx1MDkzNVx1MDkzRlx1MDkxQ1x1MDk0RFx1MDkxRVx1MDkzRVx1MDkyQVx1MDkyOCBcdTA5MjhcdTA5MzlcdTA5NDBcdTA5MDIgXHUwOTM5XHUwOTQ4XCIsIFwiXHUwOTJGXHUwOTM5IFx1MDkyMVx1MDkzRlx1MDkzNVx1MDkzRVx1MDkwN1x1MDkzOCAzRCBcdTA5MTdcdTA5NERcdTA5MzBcdTA5M0VcdTA5MkJcdTA5M0NcdTA5M0ZcdTA5MTVcdTA5NERcdTA5MzggXHUwOTI4XHUwOTM5XHUwOTQwXHUwOTAyIFx1MDkyNlx1MDkzRlx1MDkxNlx1MDkzRSBcdTA5MzhcdTA5MTVcdTA5MjRcdTA5M0VcdTA5NjRcIiwgXCJcdTA5MkNcdTA5MDJcdTA5MjYgXHUwOTE1XHUwOTMwXHUwOTQ3XHUwOTAyXCIsIFwiXHUwOTE3XHUwOTQ3XHUwOTAyXHUwOTI2XHUwOTQ3XHUwOTAyXCIsIFwiXHUwOTM4XHUwOTAyXHUwOTE1XHUwOTQ3XHUwOTI0XCIsIFwiXHUwOTMyXHUwOTQ3XHUwOTM1XHUwOTMyIFx1MDkxQlx1MDk0Qlx1MDkyMVx1MDkzQ1x1MDk0QlwiLCBcIlx1MDkzMFx1MDkyNFx1MDk0RFx1MDkyOCBcdTA5MTVcdTA5MkUgXHUwOTM5XHUwOTQ4XHUwOTAyXCIsIFwiXHUwOTFBXHUwOTNFXHUwOTMyXHUwOTQyXCJdLFxuICBydTogW1wiXHUwNDE3XHUwNDMwXHUwNDMzXHUwNDQwXHUwNDQzXHUwNDM3XHUwNDNBXHUwNDMwXHUyMDI2XCIsIFwiXHUwNDIzXHUwNDQwXHUwNDNFXHUwNDMyXHUwNDM1XHUwNDNEXHUwNDRDXCIsIFwiXHUwNDIzXHUwNDQwXHUwNDNFXHUwNDMyXHUwNDNEXHUwNDM4XCIsIFwiXHUwNDE0XHUwNDMwXHUwNDNCXHUwNDRDXHUwNDQ4XHUwNDM1XCIsIFwiXHUwNDE3XHUwNDMwXHUwNDNEXHUwNDNFXHUwNDMyXHUwNDNFXCIsIFwiXHUwNDFEXHUwNDMwXHUwNDQxXHUwNDQyXHUwNDQwXHUwNDNFXHUwNDM5XHUwNDNBXHUwNDM4XCIsIFwiXHUwNDFDXHUwNDQzXHUwNDM3XHUwNDRCXHUwNDNBXHUwNDMwXCIsIFwiXHUwNDE3XHUwNDMyXHUwNDQzXHUwNDNBXHUwNDM4XCIsIFwiXHUwNDIzXHUwNDNGXHUwNDQwXHUwNDMwXHUwNDMyXHUwNDNCXHUwNDM1XHUwNDNEXHUwNDM4XHUwNDM1XCIsIFwiXHUwNDIxXHUwNDMyXHUwNDMwXHUwNDM5XHUwNDNGXCIsIFwiXHUwNDI1XHUwNDMyXHUwNDMwXHUwNDQyXHUwNDMwXHUwNDM5IFx1MDQzOCBcdTA0M0FcdTA0NDBcdTA0NDNcdTA0NDJcdTA0MzhcIixcbiAgICBcIlx1MDQxRFx1MDQzNVx1MDQzRlx1MDQzQlx1MDQzRVx1MDQ0NVx1MDQzRSFcIiwgXCJcdTA0MUVcdTA0NDJcdTA0M0JcdTA0MzhcdTA0NDdcdTA0M0RcdTA0M0UhXCIsIFwiXHUwNDE4XHUwNDM0XHUwNDM1XHUwNDMwXHUwNDNCXHUwNDRDXHUwNDNEXHUwNDNFIVwiLCBcIlx1MDQxRlx1MDQzMFx1MDQ0M1x1MDQzN1x1MDQzMFwiLCBcIlx1MDQyMlx1MDQ0Rlx1MDQzRFx1MDQzOCwgXHUwNDQ3XHUwNDQyXHUwNDNFXHUwNDMxXHUwNDRCIFx1MDQzRFx1MDQzMFx1MDQzQVx1MDQzQlx1MDQzRVx1MDQzRFx1MDQzOFx1MDQ0Mlx1MDQ0QyBcdTA0M0NcdTA0MzhcdTA0NDBcIiwgXCJcdTA0MURcdTA0MzBcdTA0M0FcdTA0M0JcdTA0M0VcdTA0M0RcdTA0NEZcdTA0MzkgXHUwNDMyIFx1MDQzRVx1MDQzMVx1MDQzNSBcdTA0NDFcdTA0NDJcdTA0M0VcdTA0NDBcdTA0M0VcdTA0M0RcdTA0NEJcIiwgXCJcdTA0MUFcdTA0NDBcdTA0MzBcdTA0NDFcdTA0M0RcdTA0M0VcdTA0MzUgXHUyMDE0IFx1MDQzRVx1MDQzRlx1MDQzMFx1MDQ0MVx1MDQzRFx1MDQzRVwiLCBcIlx1MDQxRlx1MDQzNVx1MDQ0MFx1MDQzNVx1MDQzMlx1MDQzNVx1MDQ0MFx1MDQzRFx1MDQzOCBcdTA0M0NcdTA0MzhcdTA0NDBcIiwgXCJcdTA0MURcdTA0MzUgXHUwNDMyXHUwNDRCXHUwNDNGXHUwNDMwXHUwNDM0XHUwNDM4XCIsXG4gICAgXCJcdTA0MUNcdTA0MzhcdTA0NDAgXHUwNDNGXHUwNDQwXHUwNDNFXHUwNDM5XHUwNDM0XHUwNDM1XHUwNDNEIVwiLCBcIlx1MDQyMlx1MDQ0QiBcdTA0M0ZcdTA0NDBcdTA0M0VcdTA0NDhcdTA0NTFcdTA0M0IgXHUwNDMyXHUwNDQxXHUwNDM1IFx1MDQ0M1x1MDQ0MFx1MDQzRVx1MDQzMlx1MDQzRFx1MDQzOC4gXHUwNDFEXHUwNDNFXHUwNDMyXHUwNDRCXHUwNDM1IFx1MDQzQ1x1MDQzOFx1MDQ0MFx1MDQ0QiBcdTA0NDNcdTA0MzZcdTA0MzUgXHUwNDMyIFx1MDQzRlx1MDQ0M1x1MDQ0Mlx1MDQzOCBcdTIwMTQgXHUwNDMyXHUwNDM1XHUwNDQwXHUwNDNEXHUwNDM4XHUwNDQxXHUwNDRDIFx1MDQzN1x1MDQzMCAzIFx1MDQzN1x1MDQzMlx1MDQ1MVx1MDQzN1x1MDQzNFx1MDQzMFx1MDQzQ1x1MDQzOCFcIiwgXCJcdTA0MjNcdTA0MzRcdTA0MzJcdTA0M0VcdTA0MzhcdTA0NDJcdTA0NEMgXHUwNDNBXHUwNDQwXHUwNDM4XHUwNDQxXHUwNDQyXHUwNDMwXHUwNDNCXHUwNDNCXHUwNDRCXCIsIFwiXHUwNDIxXHUwNDM1XHUwNDM5XHUwNDQ3XHUwNDMwXHUwNDQxIFx1MDQzRFx1MDQzNVx1MDQ0MiBcdTA0NDBcdTA0MzVcdTA0M0FcdTA0M0JcdTA0MzBcdTA0M0NcdTA0NEJcIiwgXCJcdTA0MkRcdTA0NDJcdTA0M0UgXHUwNDQzXHUwNDQxXHUwNDQyXHUwNDQwXHUwNDNFXHUwNDM5XHUwNDQxXHUwNDQyXHUwNDMyXHUwNDNFIFx1MDQzRFx1MDQzNSBcdTA0M0ZcdTA0M0VcdTA0MzRcdTA0MzRcdTA0MzVcdTA0NDBcdTA0MzZcdTA0MzhcdTA0MzJcdTA0MzBcdTA0MzVcdTA0NDIgM0QtXHUwNDMzXHUwNDQwXHUwNDMwXHUwNDQ0XHUwNDM4XHUwNDNBXHUwNDQzLlwiLCBcIlx1MDQxN1x1MDQzMFx1MDQzQVx1MDQ0MFx1MDQ0Qlx1MDQ0Mlx1MDQ0Q1wiLCBcIlx1MDQyOFx1MDQzMFx1MDQ0MFx1MDQ0QlwiLCBcIlx1MDQxRlx1MDQzRVx1MDQzNFx1MDQ0MVx1MDQzQVx1MDQzMFx1MDQzN1x1MDQzQVx1MDQzMFwiLCBcIlx1MDQxRlx1MDQ0MFx1MDQzRVx1MDQzRlx1MDQ0M1x1MDQ0MVx1MDQ0Mlx1MDQzOFx1MDQ0Mlx1MDQ0Q1wiLCBcIlx1MDQxRFx1MDQzNSBcdTA0NDVcdTA0MzJcdTA0MzBcdTA0NDJcdTA0MzBcdTA0MzVcdTA0NDIgXHUwNDNBXHUwNDQwXHUwNDM4XHUwNDQxXHUwNDQyXHUwNDMwXHUwNDNCXHUwNDNCXHUwNDNFXHUwNDMyXCIsIFwiXHUwNDEyXHUwNDRCXHUwNDMxXHUwNDQwXHUwNDMwXHUwNDNEXCJdLFxuICB2aTogW1wiXHUwMTEwYW5nIHRcdTFFQTNpXHUyMDI2XCIsIFwiTVx1MDBFMG5cIiwgXCJNXHUwMEUwbiBjaFx1MDFBMWlcIiwgXCJUaVx1MUVCRnBcIiwgXCJDaFx1MDFBMWkgbFx1MUVBMWlcIiwgXCJDXHUwMEUwaSBcdTAxMTFcdTFFQjd0XCIsIFwiTmhcdTFFQTFjXCIsIFwiSGlcdTFFQzd1IFx1MUVFOW5nIFx1MDBFMm0gdGhhbmhcIiwgXCJcdTAxMTBpXHUxRUMxdSBraGlcdTFFQzNuXCIsIFwiVnVcdTFFRDF0XCIsIFwiR2lcdTFFRUYgdlx1MDBFMCB4b2F5XCIsXG4gICAgXCJUXHUxRUQxdCBsXHUxRUFGbSFcIiwgXCJUdXlcdTFFQzd0IHZcdTFFRERpIVwiLCBcIkhvXHUwMEUwbiBoXHUxRUEzbyFcIiwgXCJUXHUxRUExbSBkXHUxRUVCbmdcIiwgXCJLXHUwMEU5byBcdTAxMTFcdTFFQzMgbmdoaVx1MDBFQW5nIHRoXHUxRUJGIGdpXHUxRURCaVwiLCBcIk5naGlcdTAwRUFuZyBjXHUxRUEzIGhhaSBwaFx1MDBFRGFcIiwgXCJNXHUwMEUwdSBcdTAxMTFcdTFFQ0YgbFx1MDBFMCBuZ3V5IGhpXHUxRUMzbVwiLCBcIkxcdTFFQUR0IG5nXHUwMUIwXHUxRUUzYyBuXHUwMEYzIGxcdTFFQTFpXCIsIFwiXHUwMTEwXHUxRUVCbmcgclx1MDFBMWkgcmEgbmdvXHUwMEUwaVwiLFxuICAgIFwiSG9cdTAwRTBuIHRoXHUwMEUwbmggdGhcdTFFQkYgZ2lcdTFFREJpIVwiLCBcIkJcdTFFQTFuIFx1MDExMVx1MDBFMyBxdWEgbVx1MUVDRGkgbVx1MDBFMG4uIFRoXHUxRUJGIGdpXHUxRURCaSBtXHUxRURCaSBzXHUxRUFGcCByYSBtXHUxRUFGdDogcXVheSBsXHUxRUExaSBsXHUxRUE1eSAzIHNhbyBuaFx1MDBFOSFcIiwgXCJOaFx1MDBFMm4gXHUwMTExXHUwMEY0aSBuZ1x1MUVDRGNcIiwgXCJIaVx1MUVDN24gY2hcdTAxQjBhIGNcdTAwRjMgcXVcdTFFQTNuZyBjXHUwMEUxb1wiLCBcIlRoaVx1MUVCRnQgYlx1MUVDQiBuXHUwMEUweSBraFx1MDBGNG5nIGhpXHUxRUMzbiB0aFx1MUVDQiBcdTAxMTFcdTAxQjBcdTFFRTNjIFx1MDExMVx1MUVEMyBoXHUxRUNEYSAzRC5cIiwgXCJcdTAxMTBcdTAwRjNuZ1wiLCBcIkJcdTAwRjNuZ1wiLCBcIkdcdTFFRTNpIFx1MDBGRFwiLCBcIkJcdTFFQ0YgcXVhIG1cdTAwRTBuXCIsIFwiS2hcdTAwRjRuZyBcdTAxMTFcdTFFRTcgbmdcdTFFQ0RjXCIsIFwiXHUwMTEwYW5nIGRcdTAwRjluZ1wiXSxcbiAgdGg6IFtcIlx1MEUwMVx1MEUzM1x1MEUyNVx1MEUzMVx1MEUwN1x1MEU0Mlx1MEUyQlx1MEUyNVx1MEUxNFx1MjAyNlwiLCBcIlx1MEUxNFx1MEU0OFx1MEUzMlx1MEUxOVwiLCBcIlx1MEUxNFx1MEU0OFx1MEUzMlx1MEUxOVx1MEUxN1x1MEUzMVx1MEU0OVx1MEUwN1x1MEUyQlx1MEUyMVx1MEUxNFwiLCBcIlx1MEUxNVx1MEU0OFx1MEUyRFx1MEU0NFx1MEUxQlwiLCBcIlx1MEU0MFx1MEUyNVx1MEU0OFx1MEUxOVx1MEU0M1x1MEUyQlx1MEUyMVx1MEU0OFwiLCBcIlx1MEUxNVx1MEUzMVx1MEU0OVx1MEUwN1x1MEUwNFx1MEU0OFx1MEUzMlwiLCBcIlx1MEU0MFx1MEUxRVx1MEUyNVx1MEUwN1wiLCBcIlx1MEU0MFx1MEUyQVx1MEUzNVx1MEUyMlx1MEUwN1x1MEU0MFx1MEUyRFx1MEUxRlx1MEU0MFx1MEUxRlx1MEUwMVx1MEUxNVx1MEU0Q1wiLCBcIlx1MEUwMVx1MEUzMlx1MEUyM1x1MEUwNFx1MEUyN1x1MEUxQVx1MEUwNFx1MEUzOFx1MEUyMVwiLCBcIlx1MEUxQlx1MEUzMVx1MEUxNFwiLCBcIlx1MEUwOFx1MEUzMVx1MEUxQVx1MEU0MVx1MEUyNVx1MEU0OVx1MEUyN1x1MEUyQlx1MEUyMVx1MEUzOFx1MEUxOVwiLFxuICAgIFwiXHUwRTE0XHUwRTM1XHUwRTIxXHUwRTMyXHUwRTAxIVwiLCBcIlx1MEU0MFx1MEUyMlx1MEUzNVx1MEU0OFx1MEUyMlx1MEUyMSFcIiwgXCJcdTBFMkFcdTBFMjFcdTBFMUFcdTBFMzlcdTBFMjNcdTBFMTNcdTBFNENcdTBFNDFcdTBFMUFcdTBFMUEhXCIsIFwiXHUwRTJCXHUwRTIyXHUwRTM4XHUwRTE0XHUwRTBBXHUwRTMxXHUwRTQ4XHUwRTI3XHUwRTA0XHUwRTIzXHUwRTMyXHUwRTI3XCIsIFwiXHUwRTI1XHUwRTMyXHUwRTAxXHUwRTQwXHUwRTFFXHUwRTM3XHUwRTQ4XHUwRTJEXHUwRTQwXHUwRTJEXHUwRTM1XHUwRTIyXHUwRTA3XHUwRTQyXHUwRTI1XHUwRTAxXCIsIFwiXHUwRTQwXHUwRTJEXHUwRTM1XHUwRTIyXHUwRTA3XHUwRTQ0XHUwRTE0XHUwRTQ5XHUwRTE3XHUwRTMxXHUwRTQ5XHUwRTA3XHUwRTJBXHUwRTJEXHUwRTA3XHUwRTE3XHUwRTMyXHUwRTA3XCIsIFwiXHUwRTJBXHUwRTM1XHUwRTQxXHUwRTE0XHUwRTA3XHUwRTA0XHUwRTM3XHUwRTJEXHUwRTJEXHUwRTMxXHUwRTE5XHUwRTE1XHUwRTIzXHUwRTMyXHUwRTIyXCIsIFwiXHUwRTFFXHUwRTI1XHUwRTM0XHUwRTAxXHUwRTAxXHUwRTI1XHUwRTMxXHUwRTFBXHUwRTJCXHUwRTMxXHUwRTI3XHUwRTQwXHUwRTI1XHUwRTIyXCIsIFwiXHUwRTJEXHUwRTIyXHUwRTQ4XHUwRTMyXHUwRTE1XHUwRTAxXHUwRTJEXHUwRTJEXHUwRTAxXHUwRTQ0XHUwRTFCXCIsXG4gICAgXCJcdTBFMUNcdTBFNDhcdTBFMzJcdTBFMTlcdTBFNDJcdTBFMjVcdTBFMDFcdTBFMTlcdTBFMzVcdTBFNDlcdTBFNDFcdTBFMjVcdTBFNDlcdTBFMjchXCIsIFwiXHUwRTA0XHUwRTM4XHUwRTEzXHUwRTFDXHUwRTQ4XHUwRTMyXHUwRTE5XHUwRTA0XHUwRTIzXHUwRTFBXHUwRTE3XHUwRTM4XHUwRTAxXHUwRTE0XHUwRTQ4XHUwRTMyXHUwRTE5XHUwRTQxXHUwRTI1XHUwRTQ5XHUwRTI3IFx1MEU0Mlx1MEUyNVx1MEUwMVx1MEU0M1x1MEUyQlx1MEUyMVx1MEU0OFx1MEUwMVx1MEUzM1x1MEUyNVx1MEUzMVx1MEUwN1x1MEUyMVx1MEUzMiBcdTBFMDFcdTBFMjVcdTBFMzFcdTBFMUFcdTBFMjFcdTBFMzJcdTBFNDBcdTBFMDFcdTBFNDdcdTBFMUEgMyBcdTBFMTRcdTBFMzJcdTBFMjdcdTBFMDFcdTBFMzFcdTBFMTkhXCIsIFwiXHUwRTQwXHUwRTFFXHUwRTBBXHUwRTIzIHgyXCIsIFwiXHUwRTE1XHUwRTJEXHUwRTE5XHUwRTE5XHUwRTM1XHUwRTQ5XHUwRTIyXHUwRTMxXHUwRTA3XHUwRTQ0XHUwRTIxXHUwRTQ4XHUwRTIxXHUwRTM1XHUwRTQyXHUwRTA2XHUwRTI5XHUwRTEzXHUwRTMyXCIsIFwiXHUwRTJEXHUwRTM4XHUwRTFCXHUwRTAxXHUwRTIzXHUwRTEzXHUwRTRDXHUwRTE5XHUwRTM1XHUwRTQ5XHUwRTQxXHUwRTJBXHUwRTE0XHUwRTA3XHUwRTAxXHUwRTIzXHUwRTMyXHUwRTFGXHUwRTM0XHUwRTAxIDNEIFx1MEU0NFx1MEUyMVx1MEU0OFx1MEU0NFx1MEUxNFx1MEU0OVwiLCBcIlx1MEUxQlx1MEUzNFx1MEUxNFwiLCBcIlx1MEUyNVx1MEUzOVx1MEUwMVx1MEUxQVx1MEUyRFx1MEUyNVwiLCBcIlx1MEUwNFx1MEUzM1x1MEU0M1x1MEUxQVx1MEU0OVwiLCBcIlx1MEUwMlx1MEU0OVx1MEUzMlx1MEUyMVx1MEUxNFx1MEU0OFx1MEUzMlx1MEUxOVwiLCBcIlx1MEU0MFx1MEUxRVx1MEUwQVx1MEUyM1x1MEU0NFx1MEUyMVx1MEU0OFx1MEUxRVx1MEUyRFwiLCBcIlx1MEU0M1x1MEUwQVx1MEU0OVx1MEUyRFx1MEUyMlx1MEUzOVx1MEU0OFwiXSxcbiAgcGw6IFtcIldjenl0eXdhbmllXHUyMDI2XCIsIFwiUG96aW9tXCIsIFwiUG96aW9teVwiLCBcIkRhbGVqXCIsIFwiSmVzemN6ZSByYXpcIiwgXCJVc3Rhd2llbmlhXCIsIFwiTXV6eWthXCIsIFwiRWZla3R5XCIsIFwiU3Rlcm93YW5pZVwiLCBcIlByemVzdXdhbmllXCIsIFwiWlx1MDE0MmFwIGkgb2JyXHUwMEYzXHUwMTA3XCIsXG4gICAgXCJOaWVcdTAxN0FsZSFcIiwgXCJcdTAxNUF3aWV0bmllIVwiLCBcIklkZWFsbmllIVwiLCBcIlBhdXphXCIsIFwiUHJ6ZWNpXHUwMTA1Z25paiwgYnkgcHJ6ZWNoeWxpXHUwMTA3IFx1MDE1QndpYXRcIiwgXCJQcnplY2h5bGFqIHcgb2JpZSBzdHJvbnlcIiwgXCJDemVyd29uZSB6bmFjenkgZ3JvXHUwMTdBbmVcIiwgXCJPZHdyXHUwMEYzXHUwMTA3IGdvIGRvIGdcdTAwRjNyeSBub2dhbWlcIiwgXCJOaWUgd3lwYWRuaWpcIixcbiAgICBcIlx1MDE1QXdpYXQgdWtvXHUwMTQ0Y3pvbnkhXCIsIFwiV3N6eXN0a2llIHBvemlvbXkgemEgdG9iXHUwMTA1LiBOb3dlIFx1MDE1QndpYXR5IGp1XHUwMTdDIHcgZHJvZHplIFx1MjAxNCB3clx1MDBGM1x1MDEwNyBwbyAzIGd3aWF6ZGtpIVwiLCBcIlBvZHdcdTAwRjNqIGtsZWpub3R5XCIsIFwiQnJhayByZWtsYW0gdyB0ZWogY2h3aWxpXCIsIFwiVG8gdXJ6XHUwMTA1ZHplbmllIG5pZSB3eVx1MDE1QndpZXRsYSBncmFmaWtpIDNELlwiLCBcIlphbWtuaWpcIiwgXCJLdWxraVwiLCBcIlBvZHBvd2llZFx1MDE3QVwiLCBcIlBvbWlcdTAxNDQgcG96aW9tXCIsIFwiWmEgbWFcdTAxNDJvIGtsZWpub3RcdTAwRjN3XCIsIFwiVyB1XHUwMTdDeWNpdVwiXVxufTtcbiIsICIvLyBVSSBzdHJpbmdzLiBFbmdsaXNoIGlzIHRoZSByZXF1aXJlZCBiYXNlIGxhbmd1YWdlOyBldmVyeSBvdGhlciBsYW5ndWFnZSBmYWxscyBiYWNrIHRvIGl0IHBlciBrZXkuXG5pbXBvcnQgeyBLRVlTLCBST1dTIH0gZnJvbSBcIi4vbG9jYWxlcy5qc1wiO1xuLy8gVGhlIGdhbWUgaXMgaWNvbi1maXJzdCBvbiBwdXJwb3NlOiBrZWVwIHRoaXMgdGFibGUgc21hbGwuXG5leHBvcnQgY29uc3QgU1RSSU5HUyA9IHtcbiAgZW46IHtcbiAgICBsb2FkaW5nOiBcIkxvYWRpbmdcdTIwMjZcIiwgbGV2ZWw6IFwiTGV2ZWxcIiwgbGV2ZWxzOiBcIkxldmVsc1wiLCBuZXh0OiBcIk5leHRcIiwgcmV0cnk6IFwiUmV0cnlcIiwgc2V0dGluZ3M6IFwiU2V0dGluZ3NcIixcbiAgICBtdXNpYzogXCJNdXNpY1wiLCBzZng6IFwiU291bmQgZWZmZWN0c1wiLCBjb250cm9sOiBcIkNvbnRyb2xzXCIsIGN0bFN3aXBlOiBcIlN3aXBlXCIsIGN0bEdyYWI6IFwiR3JhYiAmIHR1cm5cIixcbiAgICB3aW4xOiBcIk5pY2UhXCIsIHdpbjI6IFwiR3JlYXQhXCIsIHdpbjM6IFwiUGVyZmVjdCFcIiwgcGF1c2VkOiBcIlBhdXNlZFwiLFxuICAgIHR1dERyYWc6IFwiRHJhZyB0byB0aWx0IHRoZSB3b3JsZFwiLCB0dXRCb3RoOiBcIlRpbHQgYm90aCB3YXlzXCIsIHR1dFNwaWtlczogXCJSZWQgbWVhbnMgZGFuZ2VyXCIsXG4gICAgdHV0RmxpcDogXCJUdXJuIGl0IHVwc2lkZSBkb3duXCIsIHR1dEVkZ2U6IFwiRG9uJ3QgZmFsbCBvdXRcIixcbiAgICBlbmRUaXRsZTogXCJXb3JsZCBjb21wbGV0ZSFcIiwgZW5kQm9keTogXCJZb3UgZmluaXNoZWQgZXZlcnkgbGV2ZWwuIE1vcmUgd29ybGRzIGFyZSBvbiB0aGUgd2F5IFx1MjAxNCBnbyBiYWNrIGZvciAzIHN0YXJzIVwiLFxuICAgIGRvdWJsZUdlbXM6IFwiRG91YmxlIGdlbXNcIiwgYWRGYWlsOiBcIk5vIGFkIGF2YWlsYWJsZSByaWdodCBub3dcIiwgbm9XZWJnbDogXCJUaGlzIGRldmljZSBjYW4ndCBzaG93IDNEIGdyYXBoaWNzLlwiLFxuICAgIGNsb3NlOiBcIkNsb3NlXCIsIHNraW5zOiBcIkJhbGxzXCIsIGhpbnQ6IFwiSGludFwiLCBza2lwOiBcIlNraXAgbGV2ZWxcIiwgbm90RW5vdWdoOiBcIk5vdCBlbm91Z2ggZ2Vtc1wiLCBlcXVpcHBlZDogXCJJbiB1c2VcIlxuICB9LFxuICBhcjoge1xuICAgIGxvYWRpbmc6IFwiXHUwNjJDXHUwNjI3XHUwNjMxXHUwNjREIFx1MDYyN1x1MDY0NFx1MDYyQVx1MDYyRFx1MDY0NVx1MDY0QVx1MDY0NFx1MjAyNlwiLCBsZXZlbDogXCJcdTA2MjdcdTA2NDRcdTA2NDVcdTA2MzNcdTA2MkFcdTA2NDhcdTA2NDlcIiwgbGV2ZWxzOiBcIlx1MDYyN1x1MDY0NFx1MDY0NVx1MDYzM1x1MDYyQVx1MDY0OFx1MDY0QVx1MDYyN1x1MDYyQVwiLCBuZXh0OiBcIlx1MDYyN1x1MDY0NFx1MDYyQVx1MDYyN1x1MDY0NFx1MDY0QVwiLCByZXRyeTogXCJcdTA2MjVcdTA2MzlcdTA2MjdcdTA2MkZcdTA2MjlcIiwgc2V0dGluZ3M6IFwiXHUwNjI3XHUwNjQ0XHUwNjI1XHUwNjM5XHUwNjJGXHUwNjI3XHUwNjJGXHUwNjI3XHUwNjJBXCIsXG4gICAgbXVzaWM6IFwiXHUwNjI3XHUwNjQ0XHUwNjQ1XHUwNjQ4XHUwNjMzXHUwNjRBXHUwNjQyXHUwNjQ5XCIsIHNmeDogXCJcdTA2MjdcdTA2NDRcdTA2NDVcdTA2MjRcdTA2MkJcdTA2MzFcdTA2MjdcdTA2MkEgXHUwNjI3XHUwNjQ0XHUwNjM1XHUwNjQ4XHUwNjJBXHUwNjRBXHUwNjI5XCIsIGNvbnRyb2w6IFwiXHUwNjI3XHUwNjQ0XHUwNjJBXHUwNjJEXHUwNjQzXHUwNjQ1XCIsIGN0bFN3aXBlOiBcIlx1MDYzM1x1MDYyRFx1MDYyOFwiLCBjdGxHcmFiOiBcIlx1MDYyN1x1MDY0NVx1MDYzM1x1MDY0MyBcdTA2NDhcdTA2NDRcdTA2NEZcdTA2NDFcdTA2NTFcIixcbiAgICB3aW4xOiBcIlx1MDYyM1x1MDYyRFx1MDYzM1x1MDY0Nlx1MDYyQSFcIiwgd2luMjogXCJcdTA2MzFcdTA2MjdcdTA2MjZcdTA2MzkhXCIsIHdpbjM6IFwiXHUwNjQ1XHUwNjQ1XHUwNjJBXHUwNjI3XHUwNjMyIVwiLCBwYXVzZWQ6IFwiXHUwNjQ1XHUwNjJBXHUwNjQ4XHUwNjQyXHUwNjQxIFx1MDY0NVx1MDYyNFx1MDY0Mlx1MDYyQVx1MDY0Qlx1MDYyN1wiLFxuICAgIHR1dERyYWc6IFwiXHUwNjI3XHUwNjMzXHUwNjJEXHUwNjI4IFx1MDY0NFx1MDYyQVx1MDY0Rlx1MDY0NVx1MDY0QVx1MDY0NCBcdTA2MjdcdTA2NDRcdTA2MzlcdTA2MjdcdTA2NDRcdTA2NDVcIiwgdHV0Qm90aDogXCJcdTA2MjNcdTA2NDVcdTA2NTBcdTA2NDQgXHUwNjQxXHUwNjRBIFx1MDYyN1x1MDY0NFx1MDYyN1x1MDYyQVx1MDYyQ1x1MDYyN1x1MDY0N1x1MDY0QVx1MDY0NlwiLCB0dXRTcGlrZXM6IFwiXHUwNjI3XHUwNjQ0XHUwNjIzXHUwNjJEXHUwNjQ1XHUwNjMxIFx1MDYyRVx1MDYzN1x1MDYzMVwiLFxuICAgIHR1dEZsaXA6IFwiXHUwNjI3XHUwNjQyXHUwNjQ0XHUwNjI4IFx1MDYyN1x1MDY0NFx1MDYzOVx1MDYyN1x1MDY0NFx1MDY0NSBcdTA2MzFcdTA2MjNcdTA2MzNcdTA2NEJcdTA2MjcgXHUwNjM5XHUwNjQ0XHUwNjQ5IFx1MDYzOVx1MDY0Mlx1MDYyOFwiLCB0dXRFZGdlOiBcIlx1MDY0NFx1MDYyNyBcdTA2MkFcdTA2MzNcdTA2NDJcdTA2MzcgXHUwNjQ1XHUwNjQ2IFx1MDYyN1x1MDY0NFx1MDYyRFx1MDYyN1x1MDY0MVx1MDYyOVwiLFxuICAgIGVuZFRpdGxlOiBcIlx1MDYyN1x1MDY0M1x1MDYyQVx1MDY0NVx1MDY0NCBcdTA2MjdcdTA2NDRcdTA2MzlcdTA2MjdcdTA2NDRcdTA2NDUhXCIsIGVuZEJvZHk6IFwiXHUwNjIzXHUwNjQ2XHUwNjQ3XHUwNjRBXHUwNjJBIFx1MDY0M1x1MDY0NCBcdTA2MjdcdTA2NDRcdTA2NDVcdTA2MzNcdTA2MkFcdTA2NDhcdTA2NEFcdTA2MjdcdTA2MkEuIFx1MDYzOVx1MDY0OFx1MDYyN1x1MDY0NFx1MDY0NSBcdTA2MkNcdTA2MkZcdTA2NEFcdTA2MkZcdTA2MjkgXHUwNjQxXHUwNjRBIFx1MDYyN1x1MDY0NFx1MDYzN1x1MDYzMVx1MDY0QVx1MDY0MiBcdTIwMTQgXHUwNjM5XHUwNjRGXHUwNjJGIFx1MDY0OFx1MDYyN1x1MDYyQ1x1MDY0NVx1MDYzOSBcdTA2NjMgXHUwNjQ2XHUwNjJDXHUwNjQ4XHUwNjQ1IVwiLFxuICAgIGRvdWJsZUdlbXM6IFwiXHUwNjM2XHUwNjI3XHUwNjM5XHUwNjQxIFx1MDYyN1x1MDY0NFx1MDYyQ1x1MDY0OFx1MDYyN1x1MDY0N1x1MDYzMVwiLCBhZEZhaWw6IFwiXHUwNjQ0XHUwNjI3IFx1MDY0QVx1MDY0OFx1MDYyQ1x1MDYyRiBcdTA2MjVcdTA2MzlcdTA2NDRcdTA2MjdcdTA2NDYgXHUwNjQ1XHUwNjJBXHUwNjI3XHUwNjJEIFx1MDYyN1x1MDY0NFx1MDYyMlx1MDY0NlwiLCBub1dlYmdsOiBcIlx1MDY0N1x1MDYzMFx1MDYyNyBcdTA2MjdcdTA2NDRcdTA2MkNcdTA2NDdcdTA2MjdcdTA2MzIgXHUwNjQ0XHUwNjI3IFx1MDY0QVx1MDYyRlx1MDYzOVx1MDY0NSBcdTA2MjdcdTA2NDRcdTA2MzFcdTA2MzNcdTA2NDhcdTA2NDUgXHUwNjJCXHUwNjQ0XHUwNjI3XHUwNjJCXHUwNjRBXHUwNjI5IFx1MDYyN1x1MDY0NFx1MDYyM1x1MDYyOFx1MDYzOVx1MDYyN1x1MDYyRi5cIixcbiAgICBjbG9zZTogXCJcdTA2MjVcdTA2M0FcdTA2NDRcdTA2MjdcdTA2NDJcIiwgc2tpbnM6IFwiXHUwNjI3XHUwNjQ0XHUwNjQzXHUwNjMxXHUwNjI3XHUwNjJBXCIsIGhpbnQ6IFwiXHUwNjJBXHUwNjQ0XHUwNjQ1XHUwNjRBXHUwNjJEXCIsIHNraXA6IFwiXHUwNjJBXHUwNjJFXHUwNjM3XHUwNjRFXHUwNjUxIFx1MDYyN1x1MDY0NFx1MDY0NVx1MDYzM1x1MDYyQVx1MDY0OFx1MDY0OVwiLCBub3RFbm91Z2g6IFwiXHUwNjI3XHUwNjQ0XHUwNjJDXHUwNjQ4XHUwNjI3XHUwNjQ3XHUwNjMxIFx1MDY0NFx1MDYyNyBcdTA2MkFcdTA2NDNcdTA2NDFcdTA2NEFcIiwgZXF1aXBwZWQ6IFwiXHUwNjQ1XHUwNjMzXHUwNjJBXHUwNjJFXHUwNjJGXHUwNjQ1XHUwNjI5XCJcbiAgfVxufTtcblxuLy8gZXMgcHQgZGUgZnIgaXQgamEgdHIgaWQgaGkgcnUgdmkgdGggcGwgXHUyMDE0IHJvd3MgaW4gbG9jYWxlcy5qcywgb25lIHN0cmluZyBwZXIga2V5XG5mb3IgKGNvbnN0IFtsYW5nLCByb3ddIG9mIE9iamVjdC5lbnRyaWVzKFJPV1MpKSB7XG4gIGNvbnN0IHRhYmxlID0ge307XG4gIEtFWVMuZm9yRWFjaCgoaywgaSkgPT4geyBpZiAocm93W2ldICE9PSB1bmRlZmluZWQpIHRhYmxlW2tdID0gcm93W2ldOyB9KTtcbiAgU1RSSU5HU1tsYW5nXSA9IHRhYmxlO1xufVxuXG5jb25zdCBSVEwgPSBbXCJhclwiLCBcImhlXCIsIFwiZmFcIiwgXCJ1clwiXTtcblxuZXhwb3J0IGZ1bmN0aW9uIHJlc29sdmVMYW5nKHRhZykge1xuICBjb25zdCB0ID0gU3RyaW5nKHRhZyB8fCBcImVuXCIpLnRvTG93ZXJDYXNlKCk7XG4gIGlmIChTVFJJTkdTW3RdKSByZXR1cm4gdDtcbiAgY29uc3QgcCA9IHQuc3BsaXQoL1stX10vKVswXTtcbiAgcmV0dXJuIFNUUklOR1NbcF0gPyBwIDogXCJlblwiO1xufVxuXG5leHBvcnQgY2xhc3MgSTE4biB7XG4gIGNvbnN0cnVjdG9yKCkgeyB0aGlzLmxhbmcgPSBcImVuXCI7IH1cbiAgc2V0KHRhZykgeyB0aGlzLmxhbmcgPSByZXNvbHZlTGFuZyh0YWcpOyB9XG4gIGdldCBydGwoKSB7IHJldHVybiBSVEwuaW5jbHVkZXModGhpcy5sYW5nKTsgfVxuICB0KGtleSkgeyBjb25zdCB2ID0gU1RSSU5HU1t0aGlzLmxhbmddW2tleV07IHJldHVybiB2ICE9PSB1bmRlZmluZWQgPyB2IDogU1RSSU5HUy5lbltrZXldICE9PSB1bmRlZmluZWQgPyBTVFJJTkdTLmVuW2tleV0gOiBrZXk7IH1cbiAgYXBwbHkocm9vdCkge1xuICAgIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5sYW5nID0gdGhpcy5sYW5nO1xuICAgIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5kaXIgPSB0aGlzLnJ0bCA/IFwicnRsXCIgOiBcImx0clwiO1xuICAgIHJvb3QucXVlcnlTZWxlY3RvckFsbChcIltkYXRhLWkxOG5dXCIpLmZvckVhY2goKG4pID0+IHsgbi50ZXh0Q29udGVudCA9IHRoaXMudChuLmdldEF0dHJpYnV0ZShcImRhdGEtaTE4blwiKSk7IH0pO1xuICB9XG59XG4iLCAiLy8gVGhlIGZpdmUgZm9ybXMuIEFsbCBjb2xsaWRlIGFzIGNpcmNsZXM7IHRoZXkgZGlmZmVyIGluIHNpemUsIHdlaWdodCwgZ3JpcCwgYm91bmNlIGFuZCBhYmlsaXRpZXMuXG4vLyAgIGc6IGdyYXZpdHkgc2NhbGUgXHUwMEI3IGU6IHJlc3RpdHV0aW9uIFx1MDBCNyBtdTogc3VyZmFjZSBmcmljdGlvbiBcdTAwQjcgZHJhZzogYWlyIGRyYWcgKDEvcylcbi8vICAgYnJlYWtzOiAwIG5ldmVyIFx1MDBCNyAxIGJyZWFrcyBjcnlzdGFsIHdoZW4gaGl0dGluZyBmYXN0IFx1MDBCNyAyIGJyZWFrcyBjcnlzdGFsIG9uIHRvdWNoXG4vLyAgIHdpbmQ6IGhvdyBzdHJvbmdseSBmYW5zIHB1c2ggaXRcbmV4cG9ydCBjb25zdCBGT1JNUyA9IHtcbiAgYmFsbDogICAgeyBpZDogXCJiYWxsXCIsICAgIHI6IDEzLjUsIGc6IDEuMCwgIGU6IDAuNDIsIG11OiAwLjAyLCBkcmFnOiAwLjQ1LCBicmVha3M6IDAsIHdpbmQ6IDEgfSxcbiAgY3ViZTogICAgeyBpZDogXCJjdWJlXCIsICAgIHI6IDEzLjAsIGc6IDEuMywgIGU6IDAuMDQsIG11OiAwLjksICBkcmFnOiAwLjYsICBicmVha3M6IDEsIHdpbmQ6IDAuMzUgfSxcbiAgcHJpc206ICAgeyBpZDogXCJwcmlzbVwiLCAgIHI6IDguNSwgIGc6IDAuOTUsIGU6IDAuMywgIG11OiAwLjA2LCBkcmFnOiAwLjQsICBicmVha3M6IDAsIHdpbmQ6IDEgfSxcbiAgZmVhdGhlcjogeyBpZDogXCJmZWF0aGVyXCIsIHI6IDE0LjAsIGc6IDAuNCwgIGU6IDAuNSwgIG11OiAwLjAzLCBkcmFnOiAxLjQsICBicmVha3M6IDAsIHdpbmQ6IDMgfSxcbiAgc3RhcjogICAgeyBpZDogXCJzdGFyXCIsICAgIHI6IDE0LjAsIGc6IDEuMSwgIGU6IDAuODYsIG11OiAwLjAyLCBkcmFnOiAwLjQ1LCBicmVha3M6IDIsIHdpbmQ6IDEgfVxufTtcbmV4cG9ydCBjb25zdCBGT1JNX09SREVSID0gW1wiYmFsbFwiLCBcImN1YmVcIiwgXCJwcmlzbVwiLCBcImZlYXRoZXJcIiwgXCJzdGFyXCJdO1xuIiwgIi8vIEZMSVBXT1JMRCBzaW11bGF0aW9uIGNvcmUgXHUyMDE0IGRldGVybWluaXN0aWMsIGZpeGVkLXN0ZXAsIERPTS1mcmVlLlxuLy8gUnVucyB1bmNoYW5nZWQgaW4gdGhlIGJyb3dzZXIgKGdhbWUpLCBpbiBOb2RlIChzb2x2ZXIsIHZhbGlkYXRvciwgdGVzdHMpLlxuLy9cbi8vIEZyYW1lIG9mIHJlZmVyZW5jZTogZXZlcnl0aGluZyBpcyBpbiBBUkVOQS1MT0NBTCBjb29yZGluYXRlcyAoeCByaWdodCwgeSB1cCkuXG4vLyBUaGUgcGxheWVyIHJvdGF0ZXMgdGhlIHdvcmxkOyBoZXJlIHRoYXQgb25seSBjaGFuZ2VzIHRoZSBkaXJlY3Rpb24gb2YgZ3Jhdml0eS5cbmltcG9ydCB7IEZPUk1TIH0gZnJvbSBcIi4vZm9ybXMuanNcIjtcblxuZXhwb3J0IGNvbnN0IERUID0gMSAvIDEyMDsgICAgICAvLyBmaXhlZCBzdGVwIChzKVxuZXhwb3J0IGNvbnN0IEhBTEYgPSAyMTA7ICAgICAgICAvLyBhcmVuYSBzcGFucyBbLUhBTEYsIEhBTEZdIG9uIGJvdGggYXhlc1xuZXhwb3J0IGNvbnN0IEcgPSA3MjA7ICAgICAgICAgICAvLyBncmF2aXR5ICh1bml0cy9zXjIpXG5leHBvcnQgY29uc3QgV01BWCA9IDIuNjsgICAgICAgIC8vIG1heCB3b3JsZCBzcGluIChyYWQvcykgXHUyMjQ4IDE1MFx1MDBCMC9zXG5jb25zdCBLUCA9IDE0OyAgICAgICAgICAgICAgICAgIC8vIHNwaW4gdHJhY2tpbmcgZ2FpbiAoMS9zKVxuY29uc3QgQU1BWCA9IDQyOyAgICAgICAgICAgICAgICAvLyBtYXggc3BpbiBhY2NlbGVyYXRpb24gKHJhZC9zXjIpXG5jb25zdCBWTUFYID0gODgwOyAgICAgICAgICAgICAgIC8vIHNwZWVkIGNhcCBcdTIwMTQga2VlcHMgYSBzdGVwIGJlbG93IHRoZSB0aGlubmVzdCB3YWxsXG5jb25zdCBSRVNUID0gNDI7ICAgICAgICAgICAgICAgIC8vIGltcGFjdHMgc2xvd2VyIHRoYW4gdGhpcyBkbyBub3QgYm91bmNlXG5jb25zdCBISVRfRVZFTlQgPSA3MDsgICAgICAgICAgIC8vIGltcGFjdHMgZmFzdGVyIHRoYW4gdGhpcyBlbWl0IGEgXCJoaXRcIiBldmVudFxuY29uc3QgQ1JZU1RBTF9TUEVFRCA9IDE3MDsgICAgICAvLyBzcGVlZCBhIGJyZWFrczoxIGZvcm0gbmVlZHMgdG8gc2hhdHRlciBjcnlzdGFsXG5cbmV4cG9ydCBjb25zdCBLX0JPWCA9IDAsIEtfQ0lSQ0xFID0gMSwgS19DQVBTVUxFID0gMjtcblxuLyoqIFBvc2l0aW9uL3ZlbG9jaXR5IG9mIGEgcGF0aC1kcml2ZW4gb2JqZWN0IChtb3Zlciwgc2F3KSBhdCB0aW1lIHQuICovXG5leHBvcnQgZnVuY3Rpb24gcGF0aFBvcyhvLCB0LCBvdXQpIHtcbiAgY29uc3QgYSA9IHQgKiBvLnNwZCArIG8ucGg7XG4gIGNvbnN0IHNuID0gTWF0aC5zaW4oYSksIGNzID0gTWF0aC5jb3MoYSk7XG4gIG91dC54ID0gby5jeCArIHNuICogby5heDtcbiAgb3V0LnkgPSBvLmN5ICsgY3MgKiBvLmF5O1xuICBvdXQudnggPSBjcyAqIG8uc3BkICogby5heDtcbiAgb3V0LnZ5ID0gLXNuICogby5zcGQgKiBvLmF5O1xuICByZXR1cm4gb3V0O1xufVxuXG5jb25zdCBfcCA9IHsgeDogMCwgeTogMCwgdng6IDAsIHZ5OiAwIH07XG5jb25zdCBfYm94ID0geyBjeDogMCwgY3k6IDAsIGh3OiAwLCBoaDogMCwgYzogMSwgczogMCB9O1xuXG4vKiogU3F1YXJlZCBkaXN0YW5jZSBmcm9tIHBvaW50IHRvIGFuIChvcmllbnRlZCkgYm94OyAwIHdoZW4gaW5zaWRlLiAqL1xuZnVuY3Rpb24gYm94RGlzdDIocHgsIHB5LCBiKSB7XG4gIGNvbnN0IGR4ID0gcHggLSBiLmN4LCBkeSA9IHB5IC0gYi5jeTtcbiAgY29uc3QgbHggPSBkeCAqIGIuYyArIGR5ICogYi5zLCBseSA9IGR5ICogYi5jIC0gZHggKiBiLnM7XG4gIGNvbnN0IGV4ID0gbHggPCAtYi5odyA/IGx4ICsgYi5odyA6IGx4ID4gYi5odyA/IGx4IC0gYi5odyA6IDA7XG4gIGNvbnN0IGV5ID0gbHkgPCAtYi5oaCA/IGx5ICsgYi5oaCA6IGx5ID4gYi5oaCA/IGx5IC0gYi5oaCA6IDA7XG4gIHJldHVybiBleCAqIGV4ICsgZXkgKiBleTtcbn1cblxuZXhwb3J0IGNsYXNzIFNpbSB7XG4gIC8qKlxuICAgKiBAcGFyYW0gbGV2ZWwgIGEgcHJlcGFyZWQgbGV2ZWwgKHNlZSBsZXZlbHMvcGFyc2UuanMpXG4gICAqIEBwYXJhbSBvcHRzICAgeyBmb3JtPzogc3RyaW5nLCBldmVudHM/OiBib29sZWFuIH1cbiAgICovXG4gIGNvbnN0cnVjdG9yKGxldmVsLCBvcHRzID0ge30pIHtcbiAgICB0aGlzLmx2bCA9IGxldmVsO1xuICAgIHRoaXMucmVjID0gb3B0cy5ldmVudHMgIT09IGZhbHNlO1xuICAgIHRoaXMuZXZlbnRzID0gW107XG4gICAgdGhpcy5zZXRGb3JtKG9wdHMuZm9ybSB8fCBcImJhbGxcIik7XG4gICAgdGhpcy5yZXNldCgpO1xuICB9XG5cbiAgc2V0Rm9ybShpZCkge1xuICAgIGNvbnN0IGYgPSBGT1JNU1tpZF0gfHwgRk9STVMuYmFsbDtcbiAgICB0aGlzLmZvcm0gPSBmO1xuICAgIHRoaXMuZm9ybUlkID0gZi5pZDtcbiAgICB0aGlzLl9kYW1wID0gTWF0aC5leHAoLWYuZHJhZyAqIERUKTtcbiAgfVxuXG4gIHJlc2V0KCkge1xuICAgIGNvbnN0IEwgPSB0aGlzLmx2bDtcbiAgICB0aGlzLnRpY2sgPSAwO1xuICAgIHRoaXMuYW5nbGUgPSAwOyB0aGlzLm9tZWdhID0gMDsgdGhpcy50YXJnZXQgPSAwO1xuICAgIHRoaXMueCA9IEwuc3RhcnQueDsgdGhpcy55ID0gTC5zdGFydC55OyB0aGlzLnZ4ID0gMDsgdGhpcy52eSA9IDA7XG4gICAgdGhpcy5nZW1zID0gMDsgICAgICAgICAgICAvLyBiaXRtYXNrIG9mIGNvbGxlY3RlZCBnZW1zXG4gICAgdGhpcy5jcnlzID0gMDsgICAgICAgICAgICAvLyBiaXRtYXNrIG9mIGJyb2tlbiBjcnlzdGFsc1xuICAgIHRoaXMuYWxpdmUgPSB0cnVlOyB0aGlzLndvbiA9IGZhbHNlOyB0aGlzLmNhdXNlID0gXCJcIjtcbiAgICB0aGlzLm54ID0gMDsgdGhpcy5ueSA9IDE7IC8vIGxhc3QgY29udGFjdCBub3JtYWxcbiAgICB0aGlzLnRvdWNoID0gZmFsc2U7ICAgICAgIC8vIHRvdWNoaW5nIHNvbWV0aGluZyB0aGlzIHRpY2tcbiAgICB0aGlzLmFpciA9IDA7ICAgICAgICAgICAgIC8vIHRpY2tzIHNpbmNlIGxhc3QgY29udGFjdFxuICAgIHRoaXMuaW1wYWN0ID0gMDsgICAgICAgICAgLy8gc3Ryb25nZXN0IGltcGFjdCB0aGlzIHRpY2tcbiAgICB0aGlzLmV2ZW50cy5sZW5ndGggPSAwO1xuICB9XG5cbiAgZ2V0IHRpbWUoKSB7IHJldHVybiB0aGlzLnRpY2sgKiBEVDsgfVxuICBnZXQgZ2VtQ291bnQoKSB7IGxldCBuID0gMCwgbSA9IHRoaXMuZ2Vtczsgd2hpbGUgKG0pIHsgbiArPSBtICYgMTsgbSA+Pj49IDE7IH0gcmV0dXJuIG47IH1cblxuICBfZW1pdCh0LCB4LCB5LCB2KSB7IGlmICh0aGlzLnJlYykgdGhpcy5ldmVudHMucHVzaCh7IHQsIHgsIHksIHYgfSk7IH1cblxuICAvKiogUmVzb2x2ZSBvbmUgY29udGFjdDogcHVzaCBvdXQsIGJvdW5jZSwgYXBwbHkgQ291bG9tYiBmcmljdGlvbi4gUmV0dXJucyBpbXBhY3Qgc3BlZWQuICovXG4gIF9jb250YWN0KG54LCBueSwgcGVuLCBzdngsIHN2eSwgZU11bCwgbXVNdWwsIGtpY2spIHtcbiAgICB0aGlzLnggKz0gbnggKiBwZW47IHRoaXMueSArPSBueSAqIHBlbjtcbiAgICB0aGlzLnRvdWNoID0gdHJ1ZTsgdGhpcy5ueCA9IG54OyB0aGlzLm55ID0gbnk7XG4gICAgbGV0IHJ2eCA9IHRoaXMudnggLSBzdngsIHJ2eSA9IHRoaXMudnkgLSBzdnk7XG4gICAgY29uc3Qgdm4gPSBydnggKiBueCArIHJ2eSAqIG55O1xuICAgIGlmICh2biA+PSAwKSByZXR1cm4gMDtcbiAgICBjb25zdCBmID0gdGhpcy5mb3JtLCBpbXAgPSAtdm47XG4gICAgbGV0IGUgPSBpbXAgPiBSRVNUID8gZi5lICogZU11bCA6IDA7XG4gICAgaWYgKGUgPiAxKSBlID0gMTtcbiAgICBjb25zdCBqbiA9ICgxICsgZSkgKiBpbXA7XG4gICAgcnZ4ICs9IGpuICogbng7IHJ2eSArPSBqbiAqIG55O1xuICAgIGNvbnN0IHR4ID0gLW55LCB0eSA9IG54O1xuICAgIGNvbnN0IHZ0ID0gcnZ4ICogdHggKyBydnkgKiB0eTtcbiAgICBjb25zdCBtYXhGID0gZi5tdSAqIG11TXVsICogam47XG4gICAgY29uc3QgZHZ0ID0gdnQgPiBtYXhGID8gLW1heEYgOiB2dCA8IC1tYXhGID8gbWF4RiA6IC12dDtcbiAgICBydnggKz0gZHZ0ICogdHg7IHJ2eSArPSBkdnQgKiB0eTtcbiAgICBpZiAoa2ljaykgeyBydnggKz0gbnggKiBraWNrOyBydnkgKz0gbnkgKiBraWNrOyB9XG4gICAgdGhpcy52eCA9IHJ2eCArIHN2eDsgdGhpcy52eSA9IHJ2eSArIHN2eTtcbiAgICBpZiAoaW1wID4gdGhpcy5pbXBhY3QpIHRoaXMuaW1wYWN0ID0gaW1wO1xuICAgIHJldHVybiBpbXA7XG4gIH1cblxuICAvKiogQ2lyY2xlLXZzLXNvbGlkLiBSZXR1cm5zIGltcGFjdCAoPj0wKSBvbiBjb250YWN0LCAtMSB3aGVuIG5vdCB0b3VjaGluZy4gKi9cbiAgX2hpdChzLCByLCBzdngsIHN2eSkge1xuICAgIGxldCBueCwgbnksIHBlbjtcbiAgICBpZiAocy5rID09PSBLX0JPWCkge1xuICAgICAgY29uc3QgZHggPSB0aGlzLnggLSBzLmN4LCBkeSA9IHRoaXMueSAtIHMuY3k7XG4gICAgICBjb25zdCBseCA9IGR4ICogcy5jICsgZHkgKiBzLnMsIGx5ID0gZHkgKiBzLmMgLSBkeCAqIHMucztcbiAgICAgIGNvbnN0IHF4ID0gbHggPCAtcy5odyA/IC1zLmh3IDogbHggPiBzLmh3ID8gcy5odyA6IGx4O1xuICAgICAgY29uc3QgcXkgPSBseSA8IC1zLmhoID8gLXMuaGggOiBseSA+IHMuaGggPyBzLmhoIDogbHk7XG4gICAgICBjb25zdCBleCA9IGx4IC0gcXgsIGV5ID0gbHkgLSBxeSwgZDIgPSBleCAqIGV4ICsgZXkgKiBleTtcbiAgICAgIGlmIChkMiA+PSByICogcikgcmV0dXJuIC0xO1xuICAgICAgbGV0IG5seCwgbmx5O1xuICAgICAgaWYgKGQyID4gMWUtOSkge1xuICAgICAgICBjb25zdCBkID0gTWF0aC5zcXJ0KGQyKTsgbmx4ID0gZXggLyBkOyBubHkgPSBleSAvIGQ7IHBlbiA9IHIgLSBkO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gY2VudHJlIGlzIGluc2lkZSB0aGUgYm94OiBsZWF2ZSB0aHJvdWdoIHRoZSBuZWFyZXN0IGZhY2VcbiAgICAgICAgY29uc3QgZGwgPSBseCArIHMuaHcsIGRyID0gcy5odyAtIGx4LCBkYiA9IGx5ICsgcy5oaCwgZHQgPSBzLmhoIC0gbHk7XG4gICAgICAgIGxldCBtID0gZGw7IG5seCA9IC0xOyBubHkgPSAwO1xuICAgICAgICBpZiAoZHIgPCBtKSB7IG0gPSBkcjsgbmx4ID0gMTsgbmx5ID0gMDsgfVxuICAgICAgICBpZiAoZGIgPCBtKSB7IG0gPSBkYjsgbmx4ID0gMDsgbmx5ID0gLTE7IH1cbiAgICAgICAgaWYgKGR0IDwgbSkgeyBtID0gZHQ7IG5seCA9IDA7IG5seSA9IDE7IH1cbiAgICAgICAgcGVuID0gciArIG07XG4gICAgICB9XG4gICAgICBueCA9IG5seCAqIHMuYyAtIG5seSAqIHMuczsgbnkgPSBubHggKiBzLnMgKyBubHkgKiBzLmM7XG4gICAgfSBlbHNlIGlmIChzLmsgPT09IEtfQ0lSQ0xFKSB7XG4gICAgICBjb25zdCBkeCA9IHRoaXMueCAtIHMuY3gsIGR5ID0gdGhpcy55IC0gcy5jeSwgcnIgPSByICsgcy5yO1xuICAgICAgY29uc3QgZDIgPSBkeCAqIGR4ICsgZHkgKiBkeTtcbiAgICAgIGlmIChkMiA+PSByciAqIHJyKSByZXR1cm4gLTE7XG4gICAgICBjb25zdCBkID0gTWF0aC5zcXJ0KGQyKTtcbiAgICAgIGlmIChkID4gMWUtNikgeyBueCA9IGR4IC8gZDsgbnkgPSBkeSAvIGQ7IH0gZWxzZSB7IG54ID0gMDsgbnkgPSAxOyB9XG4gICAgICBwZW4gPSByciAtIGQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIGNhcHN1bGU6IGNsb3Nlc3QgcG9pbnQgb24gc2VnbWVudCBBLUJcbiAgICAgIGNvbnN0IGFieCA9IHMuYnggLSBzLmF4LCBhYnkgPSBzLmJ5IC0gcy5heTtcbiAgICAgIGxldCB0ID0gKCh0aGlzLnggLSBzLmF4KSAqIGFieCArICh0aGlzLnkgLSBzLmF5KSAqIGFieSkgLyAoYWJ4ICogYWJ4ICsgYWJ5ICogYWJ5KTtcbiAgICAgIHQgPSB0IDwgMCA/IDAgOiB0ID4gMSA/IDEgOiB0O1xuICAgICAgY29uc3QgZHggPSB0aGlzLnggLSAocy5heCArIGFieCAqIHQpLCBkeSA9IHRoaXMueSAtIChzLmF5ICsgYWJ5ICogdCksIHJyID0gciArIHMucjtcbiAgICAgIGNvbnN0IGQyID0gZHggKiBkeCArIGR5ICogZHk7XG4gICAgICBpZiAoZDIgPj0gcnIgKiBycikgcmV0dXJuIC0xO1xuICAgICAgY29uc3QgZCA9IE1hdGguc3FydChkMik7XG4gICAgICBpZiAoZCA+IDFlLTYpIHsgbnggPSBkeCAvIGQ7IG55ID0gZHkgLyBkOyB9IGVsc2UgeyBueCA9IC1hYnk7IG55ID0gYWJ4OyBjb25zdCBsID0gTWF0aC5oeXBvdChueCwgbnkpIHx8IDE7IG54IC89IGw7IG55IC89IGw7IH1cbiAgICAgIHBlbiA9IHJyIC0gZDtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuX2NvbnRhY3QobngsIG55LCBwZW4sIHN2eCwgc3Z5LCBzLmUsIHMubXUsIHMua2ljayk7XG4gIH1cblxuICBfZGllKGNhdXNlKSB7XG4gICAgdGhpcy5hbGl2ZSA9IGZhbHNlOyB0aGlzLmNhdXNlID0gY2F1c2U7XG4gICAgdGhpcy5fZW1pdChcImRpZVwiLCB0aGlzLngsIHRoaXMueSwgMCk7XG4gIH1cblxuICAvKipcbiAgICogQWR2YW5jZSBvbmUgZml4ZWQgdGljay5cbiAgICogQHBhcmFtIHUgb3B0aW9uYWwgY29tbWFuZGVkIHNwaW4gaW4gWy0xLCAxXSAoYm90cyk7IHBsYXllcnMgd3JpdGUgYHRhcmdldGAgZGlyZWN0bHkuXG4gICAqL1xuICBzdGVwKHUpIHtcbiAgICBpZiAoIXRoaXMuYWxpdmUgfHwgdGhpcy53b24pIHJldHVybjtcbiAgICBjb25zdCBMID0gdGhpcy5sdmwsIGYgPSB0aGlzLmZvcm0sIHIgPSBmLnI7XG4gICAgdGhpcy50aWNrKys7XG4gICAgY29uc3QgdCA9IHRoaXMudGljayAqIERUO1xuXG4gICAgLy8gLS0tIHdvcmxkIHJvdGF0aW9uOiByYXRlLSBhbmQgYWNjZWxlcmF0aW9uLWxpbWl0ZWQgdHJhY2tpbmcgb2YgdGhlIHRhcmdldCBhbmdsZVxuICAgIGlmICh1KSB0aGlzLnRhcmdldCArPSB1ICogV01BWCAqIERUO1xuICAgIGxldCB3ID0gKHRoaXMudGFyZ2V0IC0gdGhpcy5hbmdsZSkgKiBLUDtcbiAgICBpZiAodyA+IFdNQVgpIHcgPSBXTUFYOyBlbHNlIGlmICh3IDwgLVdNQVgpIHcgPSAtV01BWDtcbiAgICBsZXQgZHcgPSB3IC0gdGhpcy5vbWVnYTtcbiAgICBjb25zdCBhbSA9IEFNQVggKiBEVDtcbiAgICBpZiAoZHcgPiBhbSkgZHcgPSBhbTsgZWxzZSBpZiAoZHcgPCAtYW0pIGR3ID0gLWFtO1xuICAgIHRoaXMub21lZ2EgKz0gZHc7XG4gICAgdGhpcy5hbmdsZSArPSB0aGlzLm9tZWdhICogRFQ7XG5cbiAgICAvLyAtLS0gaW50ZWdyYXRlIChzY3JlZW4tZG93biBncmF2aXR5IGV4cHJlc3NlZCBpbiB0aGUgYXJlbmEgZnJhbWUpXG4gICAgY29uc3QgZyA9IEcgKiBmLmc7XG4gICAgdGhpcy52eCA9ICh0aGlzLnZ4IC0gTWF0aC5zaW4odGhpcy5hbmdsZSkgKiBnICogRFQpICogdGhpcy5fZGFtcDtcbiAgICB0aGlzLnZ5ID0gKHRoaXMudnkgLSBNYXRoLmNvcyh0aGlzLmFuZ2xlKSAqIGcgKiBEVCkgKiB0aGlzLl9kYW1wO1xuICAgIGxldCBzcDIgPSB0aGlzLnZ4ICogdGhpcy52eCArIHRoaXMudnkgKiB0aGlzLnZ5O1xuICAgIGlmIChzcDIgPiBWTUFYICogVk1BWCkgeyBjb25zdCBrID0gVk1BWCAvIE1hdGguc3FydChzcDIpOyB0aGlzLnZ4ICo9IGs7IHRoaXMudnkgKj0gazsgc3AyID0gVk1BWCAqIFZNQVg7IH1cbiAgICBjb25zdCBzcGVlZEluID0gTWF0aC5zcXJ0KHNwMik7XG4gICAgdGhpcy54ICs9IHRoaXMudnggKiBEVDsgdGhpcy55ICs9IHRoaXMudnkgKiBEVDtcblxuICAgIC8vIC0tLSBzb2xpZHNcbiAgICB0aGlzLmltcGFjdCA9IDA7IHRoaXMudG91Y2ggPSBmYWxzZTtcbiAgICBjb25zdCBncmlkID0gTC5ncmlkLCBzb2xpZHMgPSBMLnNvbGlkcywgbW92ZXJzID0gTC5tb3ZlcnMsIGNyeXN0YWxzID0gTC5jcnlzdGFscztcbiAgICBmb3IgKGxldCBwYXNzID0gMDsgcGFzcyA8IDI7IHBhc3MrKykge1xuICAgICAgbGV0IGNpID0gTWF0aC5mbG9vcigodGhpcy54IC0gZ3JpZC5taW4pIC8gZ3JpZC5jZWxsKSwgY2ogPSBNYXRoLmZsb29yKCh0aGlzLnkgLSBncmlkLm1pbikgLyBncmlkLmNlbGwpO1xuICAgICAgY2kgPSBjaSA8IDAgPyAwIDogY2kgPj0gZ3JpZC5uID8gZ3JpZC5uIC0gMSA6IGNpO1xuICAgICAgY2ogPSBjaiA8IDAgPyAwIDogY2ogPj0gZ3JpZC5uID8gZ3JpZC5uIC0gMSA6IGNqO1xuICAgICAgY29uc3QgbGlzdCA9IGdyaWQubGlzdHNbY2ogKiBncmlkLm4gKyBjaV07XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxpc3QubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3QgcyA9IHNvbGlkc1tsaXN0W2ldXTtcbiAgICAgICAgY29uc3QgaW1wID0gdGhpcy5faGl0KHMsIHIsIDAsIDApO1xuICAgICAgICBpZiAoaW1wID49IDAgJiYgcy5raWNrICYmIHBhc3MgPT09IDApIHRoaXMuX2VtaXQoXCJidW1wXCIsIHMuY3gsIHMuY3ksIGxpc3RbaV0pO1xuICAgICAgfVxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBtb3ZlcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3QgbSA9IG1vdmVyc1tpXTtcbiAgICAgICAgcGF0aFBvcyhtLCB0LCBfcCk7XG4gICAgICAgIG0uYm94LmN4ID0gX3AueDsgbS5ib3guY3kgPSBfcC55O1xuICAgICAgICB0aGlzLl9oaXQobS5ib3gsIHIsIF9wLnZ4LCBfcC52eSk7XG4gICAgICB9XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNyeXN0YWxzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmICh0aGlzLmNyeXMgJiAoMSA8PCBpKSkgY29udGludWU7XG4gICAgICAgIGNvbnN0IGMgPSBjcnlzdGFsc1tpXTtcbiAgICAgICAgY29uc3QgaW1wID0gdGhpcy5faGl0KGMsIHIsIDAsIDApO1xuICAgICAgICBpZiAoaW1wID49IDAgJiYgKGYuYnJlYWtzID09PSAyIHx8IChmLmJyZWFrcyA9PT0gMSAmJiBzcGVlZEluID4gQ1JZU1RBTF9TUEVFRCkpKSB7XG4gICAgICAgICAgdGhpcy5jcnlzIHw9IDEgPDwgaTtcbiAgICAgICAgICB0aGlzLl9lbWl0KFwic2hhdHRlclwiLCBjLmN4LCBjLmN5LCBpKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBpZiAodGhpcy50b3VjaCkgdGhpcy5haXIgPSAwOyBlbHNlIHRoaXMuYWlyKys7XG4gICAgaWYgKHRoaXMuaW1wYWN0ID4gSElUX0VWRU5UKSB0aGlzLl9lbWl0KFwiaGl0XCIsIHRoaXMueCAtIHRoaXMubnggKiByLCB0aGlzLnkgLSB0aGlzLm55ICogciwgdGhpcy5pbXBhY3QpO1xuXG4gICAgLy8gLS0tIHBhZHMgKGxhdW5jaGVycyk6IHNldCB0aGUgdmVsb2NpdHkgY29tcG9uZW50IGFsb25nIHRoZSBwYWQgZGlyZWN0aW9uXG4gICAgY29uc3QgcGFkcyA9IEwucGFkcztcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHBhZHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IHAgPSBwYWRzW2ldO1xuICAgICAgaWYgKGJveERpc3QyKHRoaXMueCwgdGhpcy55LCBwKSA8IHIgKiByKSB7XG4gICAgICAgIGNvbnN0IHZkID0gdGhpcy52eCAqIHAuZHggKyB0aGlzLnZ5ICogcC5keTtcbiAgICAgICAgaWYgKHZkIDwgcC5wb3dlciAqIDAuOSkge1xuICAgICAgICAgIHRoaXMudnggKz0gKHAucG93ZXIgLSB2ZCkgKiBwLmR4OyB0aGlzLnZ5ICs9IChwLnBvd2VyIC0gdmQpICogcC5keTtcbiAgICAgICAgICB0aGlzLl9lbWl0KFwicGFkXCIsIHAuY3gsIHAuY3ksIGkpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gLS0tIGhhemFyZHNcbiAgICBjb25zdCBrciA9IHIgKiAwLjgsIGtpbGxzID0gTC5raWxscztcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGtpbGxzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAoYm94RGlzdDIodGhpcy54LCB0aGlzLnksIGtpbGxzW2ldKSA8IGtyICoga3IpIHsgdGhpcy5fZGllKFwic3Bpa2VcIik7IHJldHVybjsgfVxuICAgIH1cbiAgICBjb25zdCBzYXdzID0gTC5zYXdzO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc2F3cy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgcyA9IHNhd3NbaV07XG4gICAgICBwYXRoUG9zKHMsIHQsIF9wKTtcbiAgICAgIGNvbnN0IGR4ID0gdGhpcy54IC0gX3AueCwgZHkgPSB0aGlzLnkgLSBfcC55LCByciA9IHIgKiAwLjg1ICsgcy5yO1xuICAgICAgaWYgKGR4ICogZHggKyBkeSAqIGR5IDwgcnIgKiBycikgeyB0aGlzLl9kaWUoXCJzYXdcIik7IHJldHVybjsgfVxuICAgIH1cbiAgICBjb25zdCBsaW0gPSBMLmhhbGYgKyA3MDtcbiAgICBpZiAodGhpcy54ID4gbGltIHx8IHRoaXMueCA8IC1saW0gfHwgdGhpcy55ID4gbGltIHx8IHRoaXMueSA8IC1saW0pIHsgdGhpcy5fZGllKFwiZmFsbFwiKTsgcmV0dXJuOyB9XG5cbiAgICAvLyAtLS0gZ2Vtc1xuICAgIGNvbnN0IGdlbXMgPSBMLmdlbXM7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBnZW1zLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAodGhpcy5nZW1zICYgKDEgPDwgaSkpIGNvbnRpbnVlO1xuICAgICAgY29uc3QgZHggPSB0aGlzLnggLSBnZW1zW2ldLngsIGR5ID0gdGhpcy55IC0gZ2Vtc1tpXS55LCByciA9IHIgKyAxMjtcbiAgICAgIGlmIChkeCAqIGR4ICsgZHkgKiBkeSA8IHJyICogcnIpIHtcbiAgICAgICAgdGhpcy5nZW1zIHw9IDEgPDwgaTtcbiAgICAgICAgdGhpcy5fZW1pdChcImdlbVwiLCBnZW1zW2ldLngsIGdlbXNbaV0ueSwgaSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gLS0tIGdvYWxcbiAgICBjb25zdCBneCA9IHRoaXMueCAtIEwuZ29hbC54LCBneSA9IHRoaXMueSAtIEwuZ29hbC55O1xuICAgIGlmIChneCAqIGd4ICsgZ3kgKiBneSA8IEwuZ29hbC5yICogTC5nb2FsLnIpIHtcbiAgICAgIHRoaXMud29uID0gdHJ1ZTtcbiAgICAgIHRoaXMuX2VtaXQoXCJ3aW5cIiwgTC5nb2FsLngsIEwuZ29hbC55LCAwKTtcbiAgICB9XG4gIH1cblxuICAvKiogQ29tcGFjdCBzdGF0ZSBjb3B5IGZvciBzZWFyY2ggKGxldmVsIGRhdGEgaXRzZWxmIGlzIGltbXV0YWJsZSkuICovXG4gIHNuYXAoYSkge1xuICAgIGFbMF0gPSB0aGlzLng7IGFbMV0gPSB0aGlzLnk7IGFbMl0gPSB0aGlzLnZ4OyBhWzNdID0gdGhpcy52eTtcbiAgICBhWzRdID0gdGhpcy5hbmdsZTsgYVs1XSA9IHRoaXMub21lZ2E7IGFbNl0gPSB0aGlzLnRhcmdldDtcbiAgICBhWzddID0gdGhpcy50aWNrOyBhWzhdID0gdGhpcy5nZW1zOyBhWzldID0gdGhpcy5jcnlzOyBhWzEwXSA9IHRoaXMuYWlyO1xuICAgIHJldHVybiBhO1xuICB9XG4gIHJlc3RvcmUoYSkge1xuICAgIHRoaXMueCA9IGFbMF07IHRoaXMueSA9IGFbMV07IHRoaXMudnggPSBhWzJdOyB0aGlzLnZ5ID0gYVszXTtcbiAgICB0aGlzLmFuZ2xlID0gYVs0XTsgdGhpcy5vbWVnYSA9IGFbNV07IHRoaXMudGFyZ2V0ID0gYVs2XTtcbiAgICB0aGlzLnRpY2sgPSBhWzddOyB0aGlzLmdlbXMgPSBhWzhdOyB0aGlzLmNyeXMgPSBhWzldOyB0aGlzLmFpciA9IGFbMTBdO1xuICAgIHRoaXMuYWxpdmUgPSB0cnVlOyB0aGlzLndvbiA9IGZhbHNlOyB0aGlzLmNhdXNlID0gXCJcIjtcbiAgfVxufVxuXG5leHBvcnQgeyBib3hEaXN0MiwgX2JveCBhcyBzY3JhdGNoQm94IH07XG4iLCAiLy8gV29ybGQgdGhlbWVzLiBCcmlnaHQsIHJlYWRhYmxlIFwidG95XCIgcGFsZXR0ZXMgZm9yIHdvcmxkcyAxLTQ7IG5lb24gc3BhY2UgZm9yIHdvcmxkIDUuXG4vLyBSdWxlIGZvciBldmVyeSB0aGVtZTogaGF6YXJkcyBhcmUgdGhlIG9ubHkgcmVkIHRoaW5ncyBvbiBzY3JlZW4uXG5leHBvcnQgY29uc3QgVEhFTUVTID0ge1xuICBtZWFkb3c6IHtcbiAgICBkYXJrOiBmYWxzZSwgYmc6IFtcIiM1OGM2ZmZcIiwgXCIjYzhmMmZmXCJdLFxuICAgIGZsb29yQTogMHhmZmY1ZGEsIGZsb29yQjogMHhmZmViYmQsIHBsYXRlOiAweGQ5YjU2ZSxcbiAgICB3YWxsVG9wOiAweDJmYzU5YSwgd2FsbFNpZGU6IDB4MWM5Mjc0LCB3YWxsQmV2ZWw6IDB4N2VlY2QwLFxuICAgIGljZTogMHhiZmVhZmYsIHBlZzogMHhmZmE1M2QsIHBlZ1NpZGU6IDB4ZDk3YzE0LCBidW1wZXI6IDB4ZmY1ZmEyLCBidW1wZXJTaWRlOiAweGM5Mzg3OCxcbiAgICBzcGlrZTogMHhmZjQ0NTgsIHNwaWtlRGFyazogMHhjZjI5NDIsIHNwaWtlQmFzZTogMHhiODI0M2MsXG4gICAgZ2VtOiAweGZmYzIxZiwgZ29hbDogMHg3YTRiZmYsIGdvYWxDb3JlOiAweGZmZmZmZixcbiAgICBtb3ZlcjogMHg5YTZiZmYsIG1vdmVyU2lkZTogMHg2YzQwZDgsIGNyeXN0YWw6IDB4NmZlM2ZmLCBwYWQ6IDB4ZmZkMTNhLCBwYWRBcnJvdzogMHhmZmZmZmYsIHNhdzogMHhkZmU2ZWUsIHNhd0NvcmU6IDB4ZmY0NDU4LFxuICAgIHNoYWRvdzogMHgxNTMyNGYsIHNoYWRvd0E6IDAuMiwgYW1iaWVudDogMC43NCwgc3VuOiAwLjM2LCBlZGdlczogMFxuICB9LFxuICBzdW5zZXQ6IHtcbiAgICBkYXJrOiBmYWxzZSwgYmc6IFtcIiNmZjlhOGJcIiwgXCIjZmZkNmE1XCJdLFxuICAgIGZsb29yQTogMHhmZmYxZTYsIGZsb29yQjogMHhmZmUwY2MsIHBsYXRlOiAweGQ5OGY2YixcbiAgICB3YWxsVG9wOiAweGZmN2E1OSwgd2FsbFNpZGU6IDB4ZDE1MDJmLCB3YWxsQmV2ZWw6IDB4ZmZiMTk5LFxuICAgIGljZTogMHhkNmYxZmYsIHBlZzogMHg0ZDk2ZmYsIHBlZ1NpZGU6IDB4MmM2ZmQxLCBidW1wZXI6IDB4OGE1Y2Y2LCBidW1wZXJTaWRlOiAweDYzMzZkNixcbiAgICBzcGlrZTogMHhlMTFkNDgsIHNwaWtlRGFyazogMHhhNTEyMmYsIHNwaWtlQmFzZTogMHg4YTBmMjgsXG4gICAgZ2VtOiAweGZmZDIzZiwgZ29hbDogMHgxZmI2ZmYsIGdvYWxDb3JlOiAweGZmZmZmZixcbiAgICBtb3ZlcjogMHgyYmI2NzMsIG1vdmVyU2lkZTogMHgxYjhhNTQsIGNyeXN0YWw6IDB4N2ZlNmZmLCBwYWQ6IDB4ZmZlMTRkLCBwYWRBcnJvdzogMHhmZmZmZmYsIHNhdzogMHhlOGVkZjIsIHNhd0NvcmU6IDB4ZTExZDQ4LFxuICAgIHNoYWRvdzogMHg0YTFmMWEsIHNoYWRvd0E6IDAuMiwgYW1iaWVudDogMC43Niwgc3VuOiAwLjM0LCBlZGdlczogMFxuICB9LFxuICBpY2U6IHtcbiAgICBkYXJrOiBmYWxzZSwgYmc6IFtcIiM4ZmQzZjRcIiwgXCIjZTlmN2ZmXCJdLFxuICAgIGZsb29yQTogMHhmNGZiZmYsIGZsb29yQjogMHhkZmYxZmIsIHBsYXRlOiAweDljYzNkYSxcbiAgICB3YWxsVG9wOiAweDRhYThmZiwgd2FsbFNpZGU6IDB4MmE3ZmQ2LCB3YWxsQmV2ZWw6IDB4YTlkNmZmLFxuICAgIGljZTogMHhkOWY0ZmYsIHBlZzogMHhmZmIzNDcsIHBlZ1NpZGU6IDB4ZDk4YTFkLCBidW1wZXI6IDB4ZmY2ZmFlLCBidW1wZXJTaWRlOiAweGNmM2Y4MCxcbiAgICBzcGlrZTogMHhmZjQ0NTgsIHNwaWtlRGFyazogMHhjZjI5NDIsIHNwaWtlQmFzZTogMHhiODI0M2MsXG4gICAgZ2VtOiAweGZmYzIxZiwgZ29hbDogMHg4YjVjZjYsIGdvYWxDb3JlOiAweGZmZmZmZixcbiAgICBtb3ZlcjogMHgxNGI4YTYsIG1vdmVyU2lkZTogMHgwZThmODEsIGNyeXN0YWw6IDB4YTVmM2ZjLCBwYWQ6IDB4ZmZkMTNhLCBwYWRBcnJvdzogMHhmZmZmZmYsIHNhdzogMHhkZmU2ZWUsIHNhd0NvcmU6IDB4ZmY0NDU4LFxuICAgIHNoYWRvdzogMHgxNzNiNWUsIHNoYWRvd0E6IDAuMiwgYW1iaWVudDogMC43Niwgc3VuOiAwLjM0LCBlZGdlczogMFxuICB9LFxuICBmYWN0b3J5OiB7XG4gICAgZGFyazogZmFsc2UsIGJnOiBbXCIjZmZiMzQ3XCIsIFwiI2ZmZTI5YVwiXSxcbiAgICBmbG9vckE6IDB4ZjNlZmU2LCBmbG9vckI6IDB4ZTVkZmQxLCBwbGF0ZTogMHg4Zjg3NzgsXG4gICAgd2FsbFRvcDogMHg1YjZiN2YsIHdhbGxTaWRlOiAweDNkNGE1Yywgd2FsbEJldmVsOiAweDkzYTNiOCxcbiAgICBpY2U6IDB4Y2ZlZWZmLCBwZWc6IDB4ZmY5ZjFjLCBwZWdTaWRlOiAweGM5N2EwYSwgYnVtcGVyOiAweGZmNWZhMiwgYnVtcGVyU2lkZTogMHhjOTM4NzgsXG4gICAgc3Bpa2U6IDB4ZmYzYjNiLCBzcGlrZURhcms6IDB4YzgxZTFlLCBzcGlrZUJhc2U6IDB4OWUxNTE1LFxuICAgIGdlbTogMHhmZmMyMWYsIGdvYWw6IDB4MjJjNTVlLCBnb2FsQ29yZTogMHhmZmZmZmYsXG4gICAgbW92ZXI6IDB4M2I4MmY2LCBtb3ZlclNpZGU6IDB4MWQ1ZmQxLCBjcnlzdGFsOiAweDdmZTZmZiwgcGFkOiAweGZmZDEzYSwgcGFkQXJyb3c6IDB4M2Q0YTVjLCBzYXc6IDB4ZWVmMmY2LCBzYXdDb3JlOiAweGZmM2IzYixcbiAgICBzaGFkb3c6IDB4M2EyYTEyLCBzaGFkb3dBOiAwLjIyLCBhbWJpZW50OiAwLjc0LCBzdW46IDAuMzYsIGVkZ2VzOiAwXG4gIH0sXG4gIG5lb246IHtcbiAgICBkYXJrOiB0cnVlLCBiZzogW1wiIzA3MGIxZlwiLCBcIiMxYjExNDdcIl0sXG4gICAgZmxvb3JBOiAweDEzMWY0NSwgZmxvb3JCOiAweDBmMTkzOCwgcGxhdGU6IDB4MGExMDI2LFxuICAgIHdhbGxUb3A6IDB4MWMyYjYzLCB3YWxsU2lkZTogMHgxMDFhNDAsIHdhbGxCZXZlbDogMHgyMmQzZWUsXG4gICAgaWNlOiAweDJhNWQ4ZiwgcGVnOiAweGY1OWUwYiwgcGVnU2lkZTogMHhiNDUzMDksIGJ1bXBlcjogMHhmNDcyYjYsIGJ1bXBlclNpZGU6IDB4YmUxODVkLFxuICAgIHNwaWtlOiAweGZmM2Q3MSwgc3Bpa2VEYXJrOiAweGM4MWU1Miwgc3Bpa2VCYXNlOiAweDdhMTIzMyxcbiAgICBnZW06IDB4ZmFjYzE1LCBnb2FsOiAweDIyZDNlZSwgZ29hbENvcmU6IDB4ZTBmMmZlLFxuICAgIG1vdmVyOiAweGE4NTVmNywgbW92ZXJTaWRlOiAweDZiMjFhOCwgY3J5c3RhbDogMHg2N2U4ZjksIHBhZDogMHhmYWNjMTUsIHBhZEFycm93OiAweDBmMTcyYSwgc2F3OiAweGUyZThmMCwgc2F3Q29yZTogMHhmZjNkNzEsXG4gICAgc2hhZG93OiAweDAwMDAwMCwgc2hhZG93QTogMC4zNSwgYW1iaWVudDogMC44Miwgc3VuOiAwLjMsIGVkZ2VzOiAweDIyZDNlZVxuICB9XG59O1xuXG5leHBvcnQgZnVuY3Rpb24gdGhlbWVPZihpZCkgeyByZXR1cm4gVEhFTUVTW2lkXSB8fCBUSEVNRVMubWVhZG93OyB9XG4iLCAiLyogZ2xvYmFsIFRIUkVFICovXG4vLyBUaW55IGdlb21ldHJ5IGtpdDogZXZlcnl0aGluZyBzdGF0aWMgaW4gYSBsZXZlbCBpcyBtZXJnZWQgaW50byBPTkUgdmVydGV4LWNvbG91cmVkXG4vLyBtZXNoIChvbmUgZHJhdyBjYWxsKSwgcGx1cyBvbmUgZmxhdCBcImRyb3Agc2hhZG93XCIgbWVzaC5cblxuZXhwb3J0IGZ1bmN0aW9uIHJvdW5kUmVjdChodywgaGgsIHJhZCwgc2VnID0gMykge1xuICByYWQgPSBNYXRoLm1heCgwLjAxLCBNYXRoLm1pbihyYWQsIGh3LCBoaCkpO1xuICBjb25zdCBwdHMgPSBbXTtcbiAgY29uc3QgY29ybmVycyA9IFtbaHcgLSByYWQsIGhoIC0gcmFkLCAwXSwgWy0oaHcgLSByYWQpLCBoaCAtIHJhZCwgMV0sIFstKGh3IC0gcmFkKSwgLShoaCAtIHJhZCksIDJdLCBbaHcgLSByYWQsIC0oaGggLSByYWQpLCAzXV07XG4gIGZvciAoY29uc3QgW2N4LCBjeSwgcV0gb2YgY29ybmVycykge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDw9IHNlZzsgaSsrKSB7XG4gICAgICBjb25zdCBhID0gKHEgKyBpIC8gc2VnKSAqIE1hdGguUEkgKiAwLjU7XG4gICAgICBwdHMucHVzaChbY3ggKyBNYXRoLmNvcyhhKSAqIHJhZCwgY3kgKyBNYXRoLnNpbihhKSAqIHJhZF0pO1xuICAgIH1cbiAgfVxuICByZXR1cm4gcHRzO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY2lyY2xlUHRzKHIsIG4gPSAxNikge1xuICBjb25zdCBwdHMgPSBbXTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBuOyBpKyspIHsgY29uc3QgYSA9IChpIC8gbikgKiBNYXRoLlBJICogMjsgcHRzLnB1c2goW01hdGguY29zKGEpICogciwgTWF0aC5zaW4oYSkgKiByXSk7IH1cbiAgcmV0dXJuIHB0cztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHN0YXJQdHMociwgdGVldGggPSAxMCwgaW5uZXIgPSAwLjc0KSB7XG4gIGNvbnN0IHB0cyA9IFtdO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IHRlZXRoICogMjsgaSsrKSB7IGNvbnN0IGEgPSAoaSAvICh0ZWV0aCAqIDIpKSAqIE1hdGguUEkgKiAyLCByciA9IGkgJSAyID8gciAqIGlubmVyIDogcjsgcHRzLnB1c2goW01hdGguY29zKGEpICogcnIsIE1hdGguc2luKGEpICogcnJdKTsgfVxuICByZXR1cm4gcHRzO1xufVxuXG5jb25zdCByZ2IgPSAoaGV4KSA9PiBbKChoZXggPj4gMTYpICYgMjU1KSAvIDI1NSwgKChoZXggPj4gOCkgJiAyNTUpIC8gMjU1LCAoaGV4ICYgMjU1KSAvIDI1NV07XG5cbmV4cG9ydCBjbGFzcyBHZW9CdWlsZGVyIHtcbiAgY29uc3RydWN0b3IoKSB7IHRoaXMucCA9IFtdOyB0aGlzLm4gPSBbXTsgdGhpcy5jID0gW107IH1cbiAgZ2V0IGVtcHR5KCkgeyByZXR1cm4gdGhpcy5wLmxlbmd0aCA9PT0gMDsgfVxuXG4gIHRyaShheCwgYXksIGF6LCBieCwgYnksIGJ6LCBjeCwgY3ksIGN6LCBjb2wpIHtcbiAgICAvLyBmbGF0IG5vcm1hbCBmcm9tIHRoZSB3aW5kaW5nXG4gICAgY29uc3QgdXggPSBieCAtIGF4LCB1eSA9IGJ5IC0gYXksIHV6ID0gYnogLSBheiwgdnggPSBjeCAtIGF4LCB2eSA9IGN5IC0gYXksIHZ6ID0gY3ogLSBhejtcbiAgICBsZXQgbnggPSB1eSAqIHZ6IC0gdXogKiB2eSwgbnkgPSB1eiAqIHZ4IC0gdXggKiB2eiwgbnogPSB1eCAqIHZ5IC0gdXkgKiB2eDtcbiAgICBjb25zdCBsID0gTWF0aC5oeXBvdChueCwgbnksIG56KSB8fCAxOyBueCAvPSBsOyBueSAvPSBsOyBueiAvPSBsO1xuICAgIHRoaXMucC5wdXNoKGF4LCBheSwgYXosIGJ4LCBieSwgYnosIGN4LCBjeSwgY3opO1xuICAgIHRoaXMubi5wdXNoKG54LCBueSwgbnosIG54LCBueSwgbnosIG54LCBueSwgbnopO1xuICAgIGNvbnN0IGsgPSB0eXBlb2YgY29sID09PSBcIm51bWJlclwiID8gcmdiKGNvbCkgOiBjb2w7XG4gICAgdGhpcy5jLnB1c2goa1swXSwga1sxXSwga1syXSwga1swXSwga1sxXSwga1syXSwga1swXSwga1sxXSwga1syXSk7XG4gIH1cbiAgcXVhZChhLCBiLCBjLCBkLCBjb2wpIHsgLy8gYSxiLGMsZCBjb3VudGVyLWNsb2Nrd2lzZSwgZWFjaCBbeCx5LHpdXG4gICAgdGhpcy50cmkoYVswXSwgYVsxXSwgYVsyXSwgYlswXSwgYlsxXSwgYlsyXSwgY1swXSwgY1sxXSwgY1syXSwgY29sKTtcbiAgICB0aGlzLnRyaShhWzBdLCBhWzFdLCBhWzJdLCBjWzBdLCBjWzFdLCBjWzJdLCBkWzBdLCBkWzFdLCBkWzJdLCBjb2wpO1xuICB9XG5cbiAgLyoqIEZsYXQgcG9seWdvbiAoZmFuIGFyb3VuZCB0aGUgY2VudHJvaWQpIGZhY2luZyArei4gcHRzIGFyZSBsb2NhbCwgcGxhY2VkIGF0IChjeCxjeSkgcm90YXRlZCBieSAoY3Msc24pLiAqL1xuICBmbGF0KHB0cywgY3gsIGN5LCBjcywgc24sIHosIGNvbCkge1xuICAgIGNvbnN0IG4gPSBwdHMubGVuZ3RoO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbjsgaSsrKSB7XG4gICAgICBjb25zdCBhID0gcHRzW2ldLCBiID0gcHRzWyhpICsgMSkgJSBuXTtcbiAgICAgIHRoaXMudHJpKGN4LCBjeSwgeiwgY3ggKyBhWzBdICogY3MgLSBhWzFdICogc24sIGN5ICsgYVswXSAqIHNuICsgYVsxXSAqIGNzLCB6LCBjeCArIGJbMF0gKiBjcyAtIGJbMV0gKiBzbiwgY3kgKyBiWzBdICogc24gKyBiWzFdICogY3MsIHosIGNvbCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEV4dHJ1ZGVkIGJsb2NrIHdpdGggYSBiZXZlbGxlZCB0b3AuIGBvdXRlcmAgYW5kIGBpbm5lcmAgYXJlIG1hdGNoaW5nIG91dGxpbmVzXG4gICAqIChpbm5lciA9IHRoZSBzbWFsbGVyIHRvcCBmYWNlKS4gRXh0cnVkZXMgZnJvbSB6MCB1cCB0byB6MS5cbiAgICovXG4gIHByaXNtKG91dGVyLCBpbm5lciwgY3gsIGN5LCBjcywgc24sIHowLCB6MSwgYmV2ZWwsIGNvbFRvcCwgY29sU2lkZSwgY29sQmV2ZWwpIHtcbiAgICBjb25zdCBuID0gb3V0ZXIubGVuZ3RoLCB6YiA9IHoxIC0gYmV2ZWw7XG4gICAgY29uc3QgVyA9IChwKSA9PiBbY3ggKyBwWzBdICogY3MgLSBwWzFdICogc24sIGN5ICsgcFswXSAqIHNuICsgcFsxXSAqIGNzXTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG47IGkrKykge1xuICAgICAgY29uc3QgaiA9IChpICsgMSkgJSBuO1xuICAgICAgY29uc3QgbzAgPSBXKG91dGVyW2ldKSwgbzEgPSBXKG91dGVyW2pdKSwgaTAgPSBXKGlubmVyW2ldKSwgaTEgPSBXKGlubmVyW2pdKTtcbiAgICAgIHRoaXMudHJpKGN4LCBjeSwgejEsIGkwWzBdLCBpMFsxXSwgejEsIGkxWzBdLCBpMVsxXSwgejEsIGNvbFRvcCk7XG4gICAgICB0aGlzLnF1YWQoW28wWzBdLCBvMFsxXSwgemJdLCBbbzFbMF0sIG8xWzFdLCB6Yl0sIFtpMVswXSwgaTFbMV0sIHoxXSwgW2kwWzBdLCBpMFsxXSwgejFdLCBjb2xCZXZlbCk7XG4gICAgICB0aGlzLnF1YWQoW28wWzBdLCBvMFsxXSwgejBdLCBbbzFbMF0sIG8xWzFdLCB6MF0sIFtvMVswXSwgbzFbMV0sIHpiXSwgW28wWzBdLCBvMFsxXSwgemJdLCBjb2xTaWRlKTtcbiAgICB9XG4gIH1cblxuICAvKiogUHlyYW1pZCBzcGlrZTogYmFzZSBjZW50cmUgKHgseSx6KSwgdW5pdCBkaXJlY3Rpb24gKGR4LGR5LGR6KSwgYmFzZSByYWRpdXMsIGhlaWdodC4gKi9cbiAgc3Bpa2UoeCwgeSwgeiwgZHgsIGR5LCBkeiwgcmFkLCBoLCBjb2wsIGNvbERhcmspIHtcbiAgICAvLyBvcnRob25vcm1hbCBiYXNpcyAodSwgdikgcGVycGVuZGljdWxhciB0byBkXG4gICAgbGV0IHV4LCB1eSwgdXo7XG4gICAgaWYgKE1hdGguYWJzKGR6KSA+IDAuOSkgeyB1eCA9IDE7IHV5ID0gMDsgdXogPSAwOyB9IGVsc2UgeyB1eCA9IC1keTsgdXkgPSBkeDsgdXogPSAwOyBjb25zdCBsID0gTWF0aC5oeXBvdCh1eCwgdXkpIHx8IDE7IHV4IC89IGw7IHV5IC89IGw7IH1cbiAgICBjb25zdCB2eCA9IGR5ICogdXogLSBkeiAqIHV5LCB2eSA9IGR6ICogdXggLSBkeCAqIHV6LCB2eiA9IGR4ICogdXkgLSBkeSAqIHV4O1xuICAgIGNvbnN0IGF4ID0geCArIGR4ICogaCwgYXkgPSB5ICsgZHkgKiBoLCBheiA9IHogKyBkeiAqIGg7XG4gICAgY29uc3Qgc2lkZXMgPSA0O1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc2lkZXM7IGkrKykge1xuICAgICAgY29uc3QgYTAgPSAoaSAvIHNpZGVzKSAqIE1hdGguUEkgKiAyICsgTWF0aC5QSSAvIDQsIGExID0gKChpICsgMSkgLyBzaWRlcykgKiBNYXRoLlBJICogMiArIE1hdGguUEkgLyA0O1xuICAgICAgY29uc3QgcDAgPSBbeCArIChNYXRoLmNvcyhhMCkgKiB1eCArIE1hdGguc2luKGEwKSAqIHZ4KSAqIHJhZCwgeSArIChNYXRoLmNvcyhhMCkgKiB1eSArIE1hdGguc2luKGEwKSAqIHZ5KSAqIHJhZCwgeiArIChNYXRoLmNvcyhhMCkgKiB1eiArIE1hdGguc2luKGEwKSAqIHZ6KSAqIHJhZF07XG4gICAgICBjb25zdCBwMSA9IFt4ICsgKE1hdGguY29zKGExKSAqIHV4ICsgTWF0aC5zaW4oYTEpICogdngpICogcmFkLCB5ICsgKE1hdGguY29zKGExKSAqIHV5ICsgTWF0aC5zaW4oYTEpICogdnkpICogcmFkLCB6ICsgKE1hdGguY29zKGExKSAqIHV6ICsgTWF0aC5zaW4oYTEpICogdnopICogcmFkXTtcbiAgICAgIHRoaXMudHJpKHAwWzBdLCBwMFsxXSwgcDBbMl0sIHAxWzBdLCBwMVsxXSwgcDFbMl0sIGF4LCBheSwgYXosIGkgJSAyID8gY29sRGFyayA6IGNvbCk7XG4gICAgfVxuICB9XG5cbiAgYnVpbGQoKSB7XG4gICAgY29uc3QgZyA9IG5ldyBUSFJFRS5CdWZmZXJHZW9tZXRyeSgpO1xuICAgIGcuc2V0QXR0cmlidXRlKFwicG9zaXRpb25cIiwgbmV3IFRIUkVFLkZsb2F0MzJCdWZmZXJBdHRyaWJ1dGUodGhpcy5wLCAzKSk7XG4gICAgZy5zZXRBdHRyaWJ1dGUoXCJub3JtYWxcIiwgbmV3IFRIUkVFLkZsb2F0MzJCdWZmZXJBdHRyaWJ1dGUodGhpcy5uLCAzKSk7XG4gICAgZy5zZXRBdHRyaWJ1dGUoXCJjb2xvclwiLCBuZXcgVEhSRUUuRmxvYXQzMkJ1ZmZlckF0dHJpYnV0ZSh0aGlzLmMsIDMpKTtcbiAgICByZXR1cm4gZztcbiAgfVxufVxuIiwgIi8qIGdsb2JhbCBUSFJFRSAqL1xuLy8gUG9vbGVkIHBhcnRpY2xlcyAob25lIEluc3RhbmNlZE1lc2ggPSBvbmUgZHJhdyBjYWxsKSArIHBvb2xlZCBzaG9ja3dhdmUgcmluZ3MuXG4vLyBQb3NpdGlvbnMgYXJlIGFyZW5hLWxvY2FsICh0aGUgcG9vbCBsaXZlcyBpbnNpZGUgdGhlIHJvdGF0aW5nIHdvcmxkIGdyb3VwKS5cblxuY29uc3QgX20gPSBuZXcgVEhSRUUuTWF0cml4NCgpLCBfcSA9IG5ldyBUSFJFRS5RdWF0ZXJuaW9uKCksIF9zID0gbmV3IFRIUkVFLlZlY3RvcjMoKSwgX3YgPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuY29uc3QgX2UgPSBuZXcgVEhSRUUuRXVsZXIoKSwgX2MgPSBuZXcgVEhSRUUuQ29sb3IoKTtcblxuZXhwb3J0IGNsYXNzIFBhcnRpY2xlcyB7XG4gIGNvbnN0cnVjdG9yKHBhcmVudCwgY291bnQpIHtcbiAgICB0aGlzLmNvdW50ID0gY291bnQ7XG4gICAgdGhpcy5tZXNoID0gbmV3IFRIUkVFLkluc3RhbmNlZE1lc2gobmV3IFRIUkVFLlBsYW5lR2VvbWV0cnkoMSwgMSksIG5ldyBUSFJFRS5NZXNoQmFzaWNNYXRlcmlhbCh7IGNvbG9yOiAweGZmZmZmZiwgc2lkZTogVEhSRUUuRG91YmxlU2lkZSB9KSwgY291bnQpO1xuICAgIHRoaXMubWVzaC5mcnVzdHVtQ3VsbGVkID0gZmFsc2U7XG4gICAgdGhpcy5tZXNoLnJlbmRlck9yZGVyID0gNTtcbiAgICB0aGlzLnAgPSBbXTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNvdW50OyBpKyspIHtcbiAgICAgIHRoaXMucC5wdXNoKHsgbGlmZTogMCwgbWF4OiAxLCB4OiAwLCB5OiAwLCB6OiAwLCB2eDogMCwgdnk6IDAsIHZ6OiAwLCByeDogMCwgcnk6IDAsIHJ6OiAwLCB3eDogMCwgd3k6IDAsIHd6OiAwLCBzaXplOiAxLCBnOiAwLCBkcmFnOiAwLCBncm93OiAwIH0pO1xuICAgICAgX20ubWFrZVNjYWxlKDAsIDAsIDApOyB0aGlzLm1lc2guc2V0TWF0cml4QXQoaSwgX20pOyB0aGlzLm1lc2guc2V0Q29sb3JBdChpLCBfYy5zZXRIZXgoMHhmZmZmZmYpKTtcbiAgICB9XG4gICAgdGhpcy5uZXh0ID0gMDtcbiAgICBwYXJlbnQuYWRkKHRoaXMubWVzaCk7XG5cbiAgICB0aGlzLnJpbmdzID0gW107XG4gICAgY29uc3QgcmcgPSBuZXcgVEhSRUUuUmluZ0dlb21ldHJ5KDAuODIsIDEsIDI4KTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IDU7IGkrKykge1xuICAgICAgY29uc3QgbSA9IG5ldyBUSFJFRS5NZXNoKHJnLCBuZXcgVEhSRUUuTWVzaEJhc2ljTWF0ZXJpYWwoeyBjb2xvcjogMHhmZmZmZmYsIHRyYW5zcGFyZW50OiB0cnVlLCBvcGFjaXR5OiAwLCBkZXB0aFdyaXRlOiBmYWxzZSwgc2lkZTogVEhSRUUuRG91YmxlU2lkZSB9KSk7XG4gICAgICBtLnZpc2libGUgPSBmYWxzZTsgbS5yZW5kZXJPcmRlciA9IDY7XG4gICAgICBwYXJlbnQuYWRkKG0pO1xuICAgICAgdGhpcy5yaW5ncy5wdXNoKHsgbSwgbGlmZTogMCwgbWF4OiAxLCByMDogMSwgcjE6IDEgfSk7XG4gICAgfVxuICAgIHRoaXMucmluZ05leHQgPSAwO1xuICB9XG5cbiAgc3Bhd24obykge1xuICAgIGNvbnN0IHAgPSB0aGlzLnBbdGhpcy5uZXh0XTtcbiAgICBjb25zdCBpID0gdGhpcy5uZXh0O1xuICAgIHRoaXMubmV4dCA9ICh0aGlzLm5leHQgKyAxKSAlIHRoaXMuY291bnQ7XG4gICAgcC5saWZlID0gcC5tYXggPSBvLmxpZmUgfHwgMC42O1xuICAgIHAueCA9IG8ueDsgcC55ID0gby55OyBwLnogPSBvLnogPT09IHVuZGVmaW5lZCA/IDE0IDogby56O1xuICAgIHAudnggPSBvLnZ4IHx8IDA7IHAudnkgPSBvLnZ5IHx8IDA7IHAudnogPSBvLnZ6IHx8IDA7XG4gICAgcC5yeCA9IE1hdGgucmFuZG9tKCkgKiA2LjI4OyBwLnJ5ID0gTWF0aC5yYW5kb20oKSAqIDYuMjg7IHAucnogPSBNYXRoLnJhbmRvbSgpICogNi4yODtcbiAgICBjb25zdCBzcGluID0gby5zcGluID09PSB1bmRlZmluZWQgPyA4IDogby5zcGluO1xuICAgIHAud3ggPSAoTWF0aC5yYW5kb20oKSAtIDAuNSkgKiBzcGluOyBwLnd5ID0gKE1hdGgucmFuZG9tKCkgLSAwLjUpICogc3BpbjsgcC53eiA9IChNYXRoLnJhbmRvbSgpIC0gMC41KSAqIHNwaW47XG4gICAgcC5zaXplID0gby5zaXplIHx8IDQ7IHAuZyA9IG8uZyA9PT0gdW5kZWZpbmVkID8gMCA6IG8uZzsgcC5kcmFnID0gby5kcmFnIHx8IDA7IHAuZ3JvdyA9IG8uZ3JvdyB8fCAwO1xuICAgIGlmIChvLmZsYXQpIHsgcC5yeCA9IDA7IHAucnkgPSAwOyBwLnd4ID0gMDsgcC53eSA9IDA7IH1cbiAgICB0aGlzLm1lc2guc2V0Q29sb3JBdChpLCBfYy5zZXRIZXgoby5jb2xvciA9PT0gdW5kZWZpbmVkID8gMHhmZmZmZmYgOiBvLmNvbG9yKSk7XG4gICAgdGhpcy5tZXNoLmluc3RhbmNlQ29sb3IubmVlZHNVcGRhdGUgPSB0cnVlO1xuICB9XG5cbiAgLyoqIFJhZGlhbCBidXJzdC4gb3B0czogeyBuLCBzcGVlZCwgY29sb3IgfCBjb2xvcnNbXSwgc2l6ZSwgbGlmZSwgZywgeiB9ICovXG4gIGJ1cnN0KHgsIHksIG8gPSB7fSkge1xuICAgIGNvbnN0IG4gPSBvLm4gfHwgMTQsIHNwID0gby5zcGVlZCB8fCAxNjA7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBuOyBpKyspIHtcbiAgICAgIGNvbnN0IGEgPSBNYXRoLnJhbmRvbSgpICogNi4yODMsIHYgPSBzcCAqICgwLjM1ICsgTWF0aC5yYW5kb20oKSAqIDAuNzUpO1xuICAgICAgdGhpcy5zcGF3bih7XG4gICAgICAgIHgsIHksIHo6IG8ueiwgdng6IE1hdGguY29zKGEpICogdiArIChvLnZ4IHx8IDApLCB2eTogTWF0aC5zaW4oYSkgKiB2ICsgKG8udnkgfHwgMCksIHZ6OiAoTWF0aC5yYW5kb20oKSAtIDAuMikgKiBzcCAqIDAuNSxcbiAgICAgICAgY29sb3I6IG8uY29sb3JzID8gby5jb2xvcnNbaSAlIG8uY29sb3JzLmxlbmd0aF0gOiBvLmNvbG9yLCBzaXplOiAoby5zaXplIHx8IDQpICogKDAuNiArIE1hdGgucmFuZG9tKCkgKiAwLjgpLFxuICAgICAgICBsaWZlOiAoby5saWZlIHx8IDAuNikgKiAoMC43ICsgTWF0aC5yYW5kb20oKSAqIDAuNiksIGc6IG8uZywgZHJhZzogby5kcmFnID09PSB1bmRlZmluZWQgPyAxLjYgOiBvLmRyYWdcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIHJpbmcoeCwgeSwgY29sb3IsIHIwID0gNiwgcjEgPSA0NiwgbGlmZSA9IDAuMzUpIHtcbiAgICBjb25zdCByID0gdGhpcy5yaW5nc1t0aGlzLnJpbmdOZXh0XTtcbiAgICB0aGlzLnJpbmdOZXh0ID0gKHRoaXMucmluZ05leHQgKyAxKSAlIHRoaXMucmluZ3MubGVuZ3RoO1xuICAgIHIubGlmZSA9IHIubWF4ID0gbGlmZTsgci5yMCA9IHIwOyByLnIxID0gcjE7XG4gICAgci5tLnBvc2l0aW9uLnNldCh4LCB5LCAxNik7IHIubS5tYXRlcmlhbC5jb2xvci5zZXRIZXgoY29sb3IpOyByLm0udmlzaWJsZSA9IHRydWU7XG4gIH1cblxuICAvKiogQHBhcmFtIGd4LGd5IGFyZW5hLWxvY2FsIGdyYXZpdHkgZGlyZWN0aW9uICh1bml0KSBzbyBkZWJyaXMgZmFsbHMgXCJzY3JlZW4tZG93blwiICovXG4gIHVwZGF0ZShkdCwgZ3gsIGd5KSB7XG4gICAgY29uc3QgcHMgPSB0aGlzLnA7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwcy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgcCA9IHBzW2ldO1xuICAgICAgaWYgKHAubGlmZSA8PSAwKSBjb250aW51ZTtcbiAgICAgIHAubGlmZSAtPSBkdDtcbiAgICAgIGlmIChwLmxpZmUgPD0gMCkgeyBfbS5tYWtlU2NhbGUoMCwgMCwgMCk7IHRoaXMubWVzaC5zZXRNYXRyaXhBdChpLCBfbSk7IGNvbnRpbnVlOyB9XG4gICAgICBpZiAocC5nKSB7IHAudnggKz0gZ3ggKiBwLmcgKiBkdDsgcC52eSArPSBneSAqIHAuZyAqIGR0OyB9XG4gICAgICBpZiAocC5kcmFnKSB7IGNvbnN0IGsgPSBNYXRoLm1heCgwLCAxIC0gcC5kcmFnICogZHQpOyBwLnZ4ICo9IGs7IHAudnkgKj0gazsgcC52eiAqPSBrOyB9XG4gICAgICBwLnggKz0gcC52eCAqIGR0OyBwLnkgKz0gcC52eSAqIGR0OyBwLnogKz0gcC52eiAqIGR0O1xuICAgICAgcC5yeCArPSBwLnd4ICogZHQ7IHAucnkgKz0gcC53eSAqIGR0OyBwLnJ6ICs9IHAud3ogKiBkdDtcbiAgICAgIGNvbnN0IHQgPSBwLmxpZmUgLyBwLm1heDtcbiAgICAgIGNvbnN0IHMgPSBwLnNpemUgKiAocC5ncm93ID8gMSArICgxIC0gdCkgKiBwLmdyb3cgOiAxKSAqICh0IDwgMC41ID8gdCAqIDIgOiAxKTtcbiAgICAgIF9lLnNldChwLnJ4LCBwLnJ5LCBwLnJ6KTsgX3Euc2V0RnJvbUV1bGVyKF9lKTsgX3Muc2V0KHMsIHMsIHMpOyBfdi5zZXQocC54LCBwLnksIHAueik7XG4gICAgICBfbS5jb21wb3NlKF92LCBfcSwgX3MpO1xuICAgICAgdGhpcy5tZXNoLnNldE1hdHJpeEF0KGksIF9tKTtcbiAgICB9XG4gICAgdGhpcy5tZXNoLmluc3RhbmNlTWF0cml4Lm5lZWRzVXBkYXRlID0gdHJ1ZTtcbiAgICBmb3IgKGNvbnN0IHIgb2YgdGhpcy5yaW5ncykge1xuICAgICAgaWYgKHIubGlmZSA8PSAwKSBjb250aW51ZTtcbiAgICAgIHIubGlmZSAtPSBkdDtcbiAgICAgIGlmIChyLmxpZmUgPD0gMCkgeyByLm0udmlzaWJsZSA9IGZhbHNlOyBjb250aW51ZTsgfVxuICAgICAgY29uc3QgdCA9IDEgLSByLmxpZmUgLyByLm1heCwgcyA9IHIucjAgKyAoci5yMSAtIHIucjApICogKDEgLSAoMSAtIHQpICogKDEgLSB0KSk7XG4gICAgICByLm0uc2NhbGUuc2V0KHMsIHMsIDEpOyByLm0ubWF0ZXJpYWwub3BhY2l0eSA9ICgxIC0gdCkgKiAwLjg1O1xuICAgIH1cbiAgfVxuXG4gIGNsZWFyKCkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5wLmxlbmd0aDsgaSsrKSB7IHRoaXMucFtpXS5saWZlID0gMDsgX20ubWFrZVNjYWxlKDAsIDAsIDApOyB0aGlzLm1lc2guc2V0TWF0cml4QXQoaSwgX20pOyB9XG4gICAgdGhpcy5tZXNoLmluc3RhbmNlTWF0cml4Lm5lZWRzVXBkYXRlID0gdHJ1ZTtcbiAgICBmb3IgKGNvbnN0IHIgb2YgdGhpcy5yaW5ncykgeyByLmxpZmUgPSAwOyByLm0udmlzaWJsZSA9IGZhbHNlOyB9XG4gIH1cbn1cbiIsICIvKiBnbG9iYWwgVEhSRUUgKi9cbi8vIEJhbGwgc2tpbnMsIGRyYXduIGluIGNvZGUgKG5vIGltYWdlIGZpbGVzLCBub3RoaW5nIHRvIGxpY2Vuc2UpLlxuLy8gVGhlIHRleHR1cmUgaXMgYW4gZXF1aXJlY3Rhbmd1bGFyIG1hcDsgdGhlIGJhbGwgaXMgc2hvd24gcG9sZS1vbiBhbmQgc3BpbnMgYWJvdXRcbi8vIHRoYXQgcG9sZSwgc28gd2VkZ2UgLyByaW5nIHBhdHRlcm5zIHJlYWQgY2xlYXJseSBhcyBcInJvbGxpbmdcIi5cblxuZXhwb3J0IGNvbnN0IFNLSU5TID0gW1xuICB7IGlkOiBcImNsYXNzaWNcIiwgY29zdDogMCwgICBhOiBcIiNmZjdhMWFcIiwgYjogXCIjZmZmZmZmXCIsIGtpbmQ6IFwid2VkZ2VcIiwgbjogNiwgIHRyYWlsOiAweGZmYTI0ZCB9LFxuICB7IGlkOiBcIm1pbnRcIiwgICAgY29zdDogMzAsICBhOiBcIiMxMmM4YTBcIiwgYjogXCIjZmZmZmZmXCIsIGtpbmQ6IFwid2VkZ2VcIiwgbjogOCwgIHRyYWlsOiAweDZmZjBkMiB9LFxuICB7IGlkOiBcImJlcnJ5XCIsICAgY29zdDogNDUsICBhOiBcIiNmZjNkODFcIiwgYjogXCIjZmZlM2VlXCIsIGtpbmQ6IFwic3dpcmxcIiwgbjogNSwgIHRyYWlsOiAweGZmOGJiNSB9LFxuICB7IGlkOiBcIm9jZWFuXCIsICAgY29zdDogNjAsICBhOiBcIiMxZTdiZmZcIiwgYjogXCIjYmZlMmZmXCIsIGtpbmQ6IFwicmluZ3NcIiwgbjogNCwgIHRyYWlsOiAweDdkYjhmZiB9LFxuICB7IGlkOiBcImJlZVwiLCAgICAgY29zdDogODAsICBhOiBcIiNmZmQyMWZcIiwgYjogXCIjMmIyYjJiXCIsIGtpbmQ6IFwid2VkZ2VcIiwgbjogMTAsIHRyYWlsOiAweGZmZTQ2YiB9LFxuICB7IGlkOiBcIm1lbG9uXCIsICAgY29zdDogMTAwLCBhOiBcIiMyZmIzNDRcIiwgYjogXCIjMGY3YTJhXCIsIGtpbmQ6IFwid2VkZ2VcIiwgbjogMTIsIHRyYWlsOiAweDhiZTI4ZiwgY29yZTogXCIjZmY1YTZlXCIgfSxcbiAgeyBpZDogXCJlaWdodFwiLCAgIGNvc3Q6IDEyMCwgYTogXCIjMjAyMzJlXCIsIGI6IFwiI2ZmZmZmZlwiLCBraW5kOiBcImRvdFwiLCAgIG46IDEsICB0cmFpbDogMHg5YWEzYjggfSxcbiAgeyBpZDogXCJ0YXJnZXRcIiwgIGNvc3Q6IDE1MCwgYTogXCIjZTExZDQ4XCIsIGI6IFwiI2ZmZmZmZlwiLCBraW5kOiBcInJpbmdzXCIsIG46IDUsICB0cmFpbDogMHhmZjhjYTMgfSxcbiAgeyBpZDogXCJnYWxheHlcIiwgIGNvc3Q6IDIwMCwgYTogXCIjNWIyMWI2XCIsIGI6IFwiIzIyZDNlZVwiLCBraW5kOiBcInN3aXJsXCIsIG46IDMsICB0cmFpbDogMHhhNzhiZmEsIHN0YXJzOiB0cnVlIH0sXG4gIHsgaWQ6IFwiZ29sZFwiLCAgICBjb3N0OiAzMDAsIGE6IFwiI2ZmYmYwMFwiLCBiOiBcIiNmZmYzYjBcIiwga2luZDogXCJzd2lybFwiLCBuOiA3LCAgdHJhaWw6IDB4ZmZlMDhhIH1cbl07XG5cbmV4cG9ydCBmdW5jdGlvbiBza2luQnlJZChpZCkgeyByZXR1cm4gU0tJTlMuZmluZCgocykgPT4gcy5pZCA9PT0gaWQpIHx8IFNLSU5TWzBdOyB9XG5cbmNvbnN0IGNhY2hlID0gbmV3IE1hcCgpO1xuXG4vKiogQHJldHVybnMgVEhSRUUuQ2FudmFzVGV4dHVyZSAoMjU2eDEyOCBlcXVpcmVjdCkgKi9cbmV4cG9ydCBmdW5jdGlvbiBza2luVGV4dHVyZShpZCkge1xuICBpZiAoY2FjaGUuaGFzKGlkKSkgcmV0dXJuIGNhY2hlLmdldChpZCk7XG4gIGNvbnN0IHMgPSBza2luQnlJZChpZCksIFcgPSAyNTYsIEggPSAxMjg7XG4gIGNvbnN0IGN2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImNhbnZhc1wiKTsgY3Yud2lkdGggPSBXOyBjdi5oZWlnaHQgPSBIO1xuICBjb25zdCBnID0gY3YuZ2V0Q29udGV4dChcIjJkXCIpO1xuICBnLmZpbGxTdHlsZSA9IHMuYjsgZy5maWxsUmVjdCgwLCAwLCBXLCBIKTtcbiAgZy5maWxsU3R5bGUgPSBzLmE7XG4gIGlmIChzLmtpbmQgPT09IFwid2VkZ2VcIikge1xuICAgIGNvbnN0IHcgPSBXIC8gcy5uO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcy5uOyBpICs9IDIpIGcuZmlsbFJlY3QoaSAqIHcsIDAsIHcsIEgpO1xuICB9IGVsc2UgaWYgKHMua2luZCA9PT0gXCJzd2lybFwiKSB7XG4gICAgY29uc3QgdyA9IFcgLyBzLm47XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzLm47IGkrKykge1xuICAgICAgZy5iZWdpblBhdGgoKTtcbiAgICAgIGcubW92ZVRvKGkgKiB3LCAwKTsgZy5saW5lVG8oaSAqIHcgKyB3ICogMC41LCAwKTtcbiAgICAgIGcubGluZVRvKGkgKiB3ICsgdyAqIDEuNSwgSCk7IGcubGluZVRvKGkgKiB3ICsgdywgSCk7IGcuY2xvc2VQYXRoKCk7IGcuZmlsbCgpO1xuICAgICAgLy8gd3JhcC1hcm91bmQgcGllY2VcbiAgICAgIGcuYmVnaW5QYXRoKCk7IGcubW92ZVRvKGkgKiB3IC0gVywgMCk7IGcubGluZVRvKGkgKiB3ICsgdyAqIDAuNSAtIFcsIDApOyBnLmxpbmVUbyhpICogdyArIHcgKiAxLjUgLSBXLCBIKTsgZy5saW5lVG8oaSAqIHcgKyB3IC0gVywgSCk7IGcuY2xvc2VQYXRoKCk7IGcuZmlsbCgpO1xuICAgIH1cbiAgfSBlbHNlIGlmIChzLmtpbmQgPT09IFwicmluZ3NcIikge1xuICAgIC8vIHRoZSB2aXNpYmxlIGhlbWlzcGhlcmUgaXMgdGhlIHRvcCBoYWxmIG9mIHRoZSB0ZXh0dXJlICh2IGZyb20gcG9sZSB0byBlcXVhdG9yKVxuICAgIGNvbnN0IGJhbmQgPSAoSCAvIDIpIC8gKHMubiAqIDIgLSAxKTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHMubjsgaSsrKSB7IGcuZmlsbFJlY3QoMCwgaSAqIDIgKiBiYW5kLCBXLCBiYW5kKTsgZy5maWxsUmVjdCgwLCBIIC0gKGkgKiAyICsgMSkgKiBiYW5kLCBXLCBiYW5kKTsgfVxuICB9IGVsc2UgaWYgKHMua2luZCA9PT0gXCJkb3RcIikge1xuICAgIGcuZmlsbFJlY3QoMCwgMCwgVywgSCk7XG4gICAgZy5maWxsU3R5bGUgPSBzLmI7IGcuZmlsbFJlY3QoMCwgMCwgVywgSCAqIDAuMik7ICAgICAgICAgIC8vIHdoaXRlIGNhcCBhdCB0aGUgdmlzaWJsZSBwb2xlXG4gICAgZy5maWxsU3R5bGUgPSBzLmE7IGcuZmlsbFJlY3QoVyAqIDAuNDIsIEggKiAwLjA0LCBXICogMC4xNiwgSCAqIDAuMDkpO1xuICAgIGcuZmlsbFN0eWxlID0gcy5iOyBnLmZpbGxSZWN0KDAsIEggKiAwLjgsIFcsIEggKiAwLjIpO1xuICB9XG4gIGlmIChzLmNvcmUpIHsgZy5maWxsU3R5bGUgPSBzLmNvcmU7IGcuZmlsbFJlY3QoMCwgMCwgVywgSCAqIDAuMTYpOyB9XG4gIGlmIChzLnN0YXJzKSB7XG4gICAgZy5maWxsU3R5bGUgPSBcIiNmZmZmZmZcIjtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IDQwOyBpKyspIHsgY29uc3QgeCA9IChpICogOTcpICUgVywgeSA9IChpICogNTMpICUgSDsgZy5maWxsUmVjdCh4LCB5LCAyLCAyKTsgfVxuICB9XG4gIGNvbnN0IHRleCA9IG5ldyBUSFJFRS5DYW52YXNUZXh0dXJlKGN2KTtcbiAgdGV4LndyYXBTID0gVEhSRUUuUmVwZWF0V3JhcHBpbmc7XG4gIHRleC5hbmlzb3Ryb3B5ID0gNDtcbiAgY2FjaGUuc2V0KGlkLCB0ZXgpO1xuICByZXR1cm4gdGV4O1xufVxuXG4vKiogU21hbGwgMkQgcHJldmlldyBvZiBhIHNraW4gZm9yIHRoZSBzaG9wIC8gSFVEIChDU1MgYmFja2dyb3VuZCkuICovXG5leHBvcnQgZnVuY3Rpb24gc2tpblN3YXRjaChpZCkge1xuICBjb25zdCBzID0gc2tpbkJ5SWQoaWQpO1xuICByZXR1cm4gYGNvbmljLWdyYWRpZW50KGZyb20gMGRlZywgJHtBcnJheS5mcm9tKHsgbGVuZ3RoOiBzLm4gKiAyIH0sIChfLCBpKSA9PiBgJHtpICUgMiA/IHMuYiA6IHMuYX0gJHsoaSAvIChzLm4gKiAyKSkgKiAxMDB9JSAkeygoaSArIDEpIC8gKHMubiAqIDIpKSAqIDEwMH0lYCkuam9pbihcIiwgXCIpfSlgO1xufVxuIiwgIi8qIGdsb2JhbCBUSFJFRSAqL1xuLy8gUmVuZGVyZXIuIFJlYWRzIHRoZSBzaW11bGF0aW9uIHN0YXRlIGVhY2ggZnJhbWU7IG5ldmVyIGNoYW5nZXMgaXQuXG4vLyBCdWRnZXQ6IHN0YXRpYyBsZXZlbCA9IDEgZHJhdyBjYWxsLCBkcm9wIHNoYWRvd3MgPSAxLCBwYXJ0aWNsZXMgPSAxLCBwbHVzIGFcbi8vIGhhbmRmdWwgb2Ygc21hbGwgZHluYW1pYyBtZXNoZXMuIE5vIHNoYWRvdyBtYXBzLCBubyBwb3N0LXByb2Nlc3NpbmcuXG5pbXBvcnQgeyBIQUxGLCBLX0JPWCwgS19DSVJDTEUsIHBhdGhQb3MgfSBmcm9tIFwiLi4vc2ltL3NpbS5qc1wiO1xuaW1wb3J0IHsgdGhlbWVPZiB9IGZyb20gXCIuL3RoZW1lcy5qc1wiO1xuaW1wb3J0IHsgR2VvQnVpbGRlciwgcm91bmRSZWN0LCBjaXJjbGVQdHMsIHN0YXJQdHMgfSBmcm9tIFwiLi9nZW8uanNcIjtcbmltcG9ydCB7IFBhcnRpY2xlcyB9IGZyb20gXCIuL2Z4LmpzXCI7XG5pbXBvcnQgeyBza2luVGV4dHVyZSwgc2tpbkJ5SWQgfSBmcm9tIFwiLi9za2lucy5qc1wiO1xuXG5jb25zdCBXQUxMX0ggPSAyNCwgRk9WID0gMzAsIFBJVENIID0gMC4xOyAgIC8vIG5lYXItb3J0aG9ncmFwaGljIFwidHJheSBvbiBhIHRhYmxlXCIgdmlld1xuY29uc3QgRklUX1IgPSAyNzQ7ICAgICAgICAgICAgLy8gYXJlbmEgcmFkaXVzIHRoYXQgbXVzdCBzdGF5IG9uIHNjcmVlbiB3aGlsZSBpdCBzcGluc1xuY29uc3QgU0hYID0gNywgU0hZID0gLTExOyAgICAgLy8gZHJvcC1zaGFkb3cgb2Zmc2V0IGluIHNjcmVlbiBzcGFjZSAobGlnaHQgZnJvbSB0aGUgdXBwZXIgbGVmdClcbmNvbnN0IElOVFJPID0gMC4yODsgICAgICAgICAgIC8vIHNlY29uZHMgYSBmcmVzaGx5IGJ1aWx0IGxldmVsIHRha2VzIHRvIHBvcCBpblxuY29uc3QgUCA9IHsgeDogMCwgeTogMCwgdng6IDAsIHZ5OiAwIH07XG5cbmZ1bmN0aW9uIHNoYWRlKGhleCwgaykge1xuICBjb25zdCByID0gTWF0aC5taW4oMjU1LCAoKGhleCA+PiAxNikgJiAyNTUpICogaykgfCAwLCBnID0gTWF0aC5taW4oMjU1LCAoKGhleCA+PiA4KSAmIDI1NSkgKiBrKSB8IDAsIGIgPSBNYXRoLm1pbigyNTUsIChoZXggJiAyNTUpICogaykgfCAwO1xuICByZXR1cm4gKHIgPDwgMTYpIHwgKGcgPDwgOCkgfCBiO1xufVxuY29uc3QgY3NzID0gKGhleCkgPT4gXCIjXCIgKyBoZXgudG9TdHJpbmcoMTYpLnBhZFN0YXJ0KDYsIFwiMFwiKTtcblxuLyoqIDAgPSBsb3ctZW5kIHBob25lLCAxID0gcGhvbmUgLyB0YWJsZXQsIDIgPSBkZXNrdG9wICovXG5leHBvcnQgZnVuY3Rpb24gZGV0ZWN0VGllcigpIHtcbiAgY29uc3QgdWEgPSBuYXZpZ2F0b3IudXNlckFnZW50IHx8IFwiXCI7XG4gIGNvbnN0IG1vYmlsZSA9IC9BbmRyb2lkfGlQaG9uZXxpUGFkfGlQb2R8TW9iaWxlL2kudGVzdCh1YSkgfHwgKG5hdmlnYXRvci5tYXhUb3VjaFBvaW50cyA+IDEgJiYgTWF0aC5taW4oc2NyZWVuLndpZHRoLCBzY3JlZW4uaGVpZ2h0KSA8IDgyMCk7XG4gIGNvbnN0IGNvcmVzID0gbmF2aWdhdG9yLmhhcmR3YXJlQ29uY3VycmVuY3kgfHwgNCwgbWVtID0gbmF2aWdhdG9yLmRldmljZU1lbW9yeSB8fCA0O1xuICBpZiAobW9iaWxlICYmIChjb3JlcyA8PSA0IHx8IG1lbSA8PSAzKSkgcmV0dXJuIDA7XG4gIHJldHVybiBtb2JpbGUgPyAxIDogMjtcbn1cblxuZnVuY3Rpb24gZ2xvd1RleHR1cmUoKSB7XG4gIGNvbnN0IGN2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImNhbnZhc1wiKTsgY3Yud2lkdGggPSBjdi5oZWlnaHQgPSA2NDtcbiAgY29uc3QgZyA9IGN2LmdldENvbnRleHQoXCIyZFwiKSwgZ3IgPSBnLmNyZWF0ZVJhZGlhbEdyYWRpZW50KDMyLCAzMiwgMiwgMzIsIDMyLCAzMik7XG4gIGdyLmFkZENvbG9yU3RvcCgwLCBcInJnYmEoMjU1LDI1NSwyNTUsMSlcIik7IGdyLmFkZENvbG9yU3RvcCgwLjQ1LCBcInJnYmEoMjU1LDI1NSwyNTUsLjM1KVwiKTsgZ3IuYWRkQ29sb3JTdG9wKDEsIFwicmdiYSgyNTUsMjU1LDI1NSwwKVwiKTtcbiAgZy5maWxsU3R5bGUgPSBncjsgZy5maWxsUmVjdCgwLCAwLCA2NCwgNjQpO1xuICByZXR1cm4gbmV3IFRIUkVFLkNhbnZhc1RleHR1cmUoY3YpO1xufVxuXG5mdW5jdGlvbiBzd2lybFRleHR1cmUoY29sSGV4LCBjb3JlSGV4KSB7XG4gIGNvbnN0IFMgPSAxMjgsIGN2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImNhbnZhc1wiKTsgY3Yud2lkdGggPSBjdi5oZWlnaHQgPSBTO1xuICBjb25zdCBnID0gY3YuZ2V0Q29udGV4dChcIjJkXCIpLCBnciA9IGcuY3JlYXRlUmFkaWFsR3JhZGllbnQoUyAvIDIsIFMgLyAyLCA0LCBTIC8gMiwgUyAvIDIsIFMgLyAyKTtcbiAgZ3IuYWRkQ29sb3JTdG9wKDAsIGNzcyhjb3JlSGV4KSk7IGdyLmFkZENvbG9yU3RvcCgwLjU1LCBjc3MoY29sSGV4KSk7IGdyLmFkZENvbG9yU3RvcCgxLCBjc3Moc2hhZGUoY29sSGV4LCAwLjU1KSkpO1xuICBnLmZpbGxTdHlsZSA9IGdyOyBnLmJlZ2luUGF0aCgpOyBnLmFyYyhTIC8gMiwgUyAvIDIsIFMgLyAyLCAwLCA2LjMpOyBnLmZpbGwoKTtcbiAgZy5zdHJva2VTdHlsZSA9IFwicmdiYSgyNTUsMjU1LDI1NSwuODUpXCI7IGcubGluZVdpZHRoID0gNTsgZy5saW5lQ2FwID0gXCJyb3VuZFwiO1xuICBmb3IgKGxldCBhcm0gPSAwOyBhcm0gPCAzOyBhcm0rKykge1xuICAgIGcuYmVnaW5QYXRoKCk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPD0gNDA7IGkrKykge1xuICAgICAgY29uc3QgdCA9IGkgLyA0MCwgYSA9IGFybSAqIDIuMDk0ICsgdCAqIDQuNCwgciA9IDYgKyB0ICogKFMgLyAyIC0gMTIpO1xuICAgICAgY29uc3QgeCA9IFMgLyAyICsgTWF0aC5jb3MoYSkgKiByLCB5ID0gUyAvIDIgKyBNYXRoLnNpbihhKSAqIHI7XG4gICAgICBpZiAoaSkgZy5saW5lVG8oeCwgeSk7IGVsc2UgZy5tb3ZlVG8oeCwgeSk7XG4gICAgfVxuICAgIGcuc3Ryb2tlKCk7XG4gIH1cbiAgcmV0dXJuIG5ldyBUSFJFRS5DYW52YXNUZXh0dXJlKGN2KTtcbn1cblxuZXhwb3J0IGNsYXNzIFZpZXcge1xuICBjb25zdHJ1Y3RvcihzdGFnZSwgdGllcikge1xuICAgIHRoaXMuc3RhZ2UgPSBzdGFnZTsgdGhpcy50aWVyID0gdGllcjtcbiAgICBjb25zdCByID0gKHRoaXMucmVuZGVyZXIgPSBuZXcgVEhSRUUuV2ViR0xSZW5kZXJlcih7IGFudGlhbGlhczogdGllciA+IDAsIGFscGhhOiB0cnVlLCBwb3dlclByZWZlcmVuY2U6IFwiaGlnaC1wZXJmb3JtYW5jZVwiIH0pKTtcbiAgICByLnNldENsZWFyQ29sb3IoMHgwMDAwMDAsIDApO1xuICAgIHRoaXMucHIgPSBNYXRoLm1pbih3aW5kb3cuZGV2aWNlUGl4ZWxSYXRpbyB8fCAxLCBbMS41LCAyLCAyXVt0aWVyXSk7XG4gICAgci5zZXRQaXhlbFJhdGlvKHRoaXMucHIpO1xuICAgIHN0YWdlLmFwcGVuZENoaWxkKHIuZG9tRWxlbWVudCk7XG5cbiAgICB0aGlzLnNjZW5lID0gbmV3IFRIUkVFLlNjZW5lKCk7XG4gICAgdGhpcy5jYW1lcmEgPSBuZXcgVEhSRUUuUGVyc3BlY3RpdmVDYW1lcmEoRk9WLCAxLCAyMCwgNDAwMCk7XG4gICAgdGhpcy5hbWIgPSBuZXcgVEhSRUUuQW1iaWVudExpZ2h0KDB4ZmZmZmZmLCAwLjc1KTtcbiAgICB0aGlzLnN1biA9IG5ldyBUSFJFRS5EaXJlY3Rpb25hbExpZ2h0KDB4ZmZmZmZmLCAwLjM1KTtcbiAgICB0aGlzLnN1bi5wb3NpdGlvbi5zZXQoLTAuNDUsIDAuNywgMSk7XG4gICAgdGhpcy5zY2VuZS5hZGQodGhpcy5hbWIsIHRoaXMuc3VuKTtcblxuICAgIHRoaXMud29ybGQgPSBuZXcgVEhSRUUuR3JvdXAoKTsgdGhpcy5zY2VuZS5hZGQodGhpcy53b3JsZCk7ICAgLy8gcm90YXRlcyB3aXRoIHRoZSBzaW0gYW5nbGVcbiAgICB0aGlzLmxldmVsID0gbmV3IFRIUkVFLkdyb3VwKCk7IHRoaXMud29ybGQuYWRkKHRoaXMubGV2ZWwpOyAgIC8vIHJlYnVpbHQgcGVyIGxldmVsXG5cbiAgICB0aGlzLm1hdFN0YXRpYyA9IG5ldyBUSFJFRS5NZXNoTGFtYmVydE1hdGVyaWFsKHsgdmVydGV4Q29sb3JzOiB0cnVlIH0pO1xuICAgIHRoaXMubWF0U2hhZG93ID0gbmV3IFRIUkVFLk1lc2hCYXNpY01hdGVyaWFsKHsgY29sb3I6IDB4MDAwMDAwLCB0cmFuc3BhcmVudDogdHJ1ZSwgb3BhY2l0eTogMC4yLCBkZXB0aFdyaXRlOiBmYWxzZSB9KTtcbiAgICB0aGlzLm1hdEdlbSA9IG5ldyBUSFJFRS5NZXNoUGhvbmdNYXRlcmlhbCh7IGNvbG9yOiAweGZmYzIxZiwgZW1pc3NpdmU6IDB4N2E0YTAwLCBzaGluaW5lc3M6IDkwLCBzcGVjdWxhcjogMHhmZmZmZmYsIGZsYXRTaGFkaW5nOiB0cnVlIH0pO1xuICAgIHRoaXMubWF0Q3J5c3RhbCA9IG5ldyBUSFJFRS5NZXNoUGhvbmdNYXRlcmlhbCh7IGNvbG9yOiAweDZmZTNmZiwgdHJhbnNwYXJlbnQ6IHRydWUsIG9wYWNpdHk6IDAuNjIsIHNoaW5pbmVzczogMTAwLCBzcGVjdWxhcjogMHhmZmZmZmYgfSk7XG4gICAgdGhpcy5nZW1HZW8gPSBuZXcgVEhSRUUuT2N0YWhlZHJvbkdlb21ldHJ5KDEwLCAwKTtcbiAgICB0aGlzLmdsb3dUZXggPSBnbG93VGV4dHVyZSgpO1xuXG4gICAgdGhpcy5meCA9IG5ldyBQYXJ0aWNsZXModGhpcy53b3JsZCwgWzYwLCAxMTAsIDE4MF1bdGllcl0pO1xuICAgIHRoaXMuX2J1aWxkQmFsbCgpO1xuXG4gICAgdGhpcy5pbnNldHMgPSB7IHRvcDogNTYsIGJvdHRvbTogNzYsIGxlZnQ6IDAsIHJpZ2h0OiAwIH07XG4gICAgdGhpcy56b29tID0gMTsgdGhpcy56b29tVG8gPSAxOyB0aGlzLnNoYWtlID0gMDtcbiAgICB0aGlzLnNxdWFzaCA9IDA7IHRoaXMuc3BpbiA9IDA7IHRoaXMuc3BpblYgPSAwOyB0aGlzLmJhbGxTY2FsZSA9IDE7IHRoaXMudHJhaWxUID0gMDtcbiAgICB0aGlzLml0ZW1zID0gbnVsbDsgdGhpcy50aGVtZSA9IHRoZW1lT2YoXCJtZWFkb3dcIik7IHRoaXMuc2tpbiA9IHNraW5CeUlkKFwiY2xhc3NpY1wiKTtcbiAgICB0aGlzLnJlc2l6ZSgpO1xuICB9XG5cbiAgZ2V0IGNhbnZhcygpIHsgcmV0dXJuIHRoaXMucmVuZGVyZXIuZG9tRWxlbWVudDsgfVxuXG4gIF9idWlsZEJhbGwoKSB7XG4gICAgdGhpcy5iYWxsID0gbmV3IFRIUkVFLkdyb3VwKCk7XG4gICAgdGhpcy5iYWxsU3EgPSBuZXcgVEhSRUUuR3JvdXAoKTsgdGhpcy5iYWxsVW4gPSBuZXcgVEhSRUUuR3JvdXAoKTsgdGhpcy5iYWxsU3BpbiA9IG5ldyBUSFJFRS5Hcm91cCgpO1xuICAgIGNvbnN0IHNlZyA9IHRoaXMudGllciA+IDAgPyAyOCA6IDE4O1xuICAgIHRoaXMuYmFsbE1hdCA9IG5ldyBUSFJFRS5NZXNoUGhvbmdNYXRlcmlhbCh7IG1hcDogc2tpblRleHR1cmUoXCJjbGFzc2ljXCIpLCBzaGluaW5lc3M6IDcwLCBzcGVjdWxhcjogMHg2NjY2NjYgfSk7XG4gICAgdGhpcy5iYWxsTWVzaCA9IG5ldyBUSFJFRS5NZXNoKG5ldyBUSFJFRS5TcGhlcmVHZW9tZXRyeSgxLCBzZWcsIE1hdGgucm91bmQoc2VnICogMC43KSksIHRoaXMuYmFsbE1hdCk7XG4gICAgdGhpcy5iYWxsTWVzaC5yb3RhdGlvbi54ID0gTWF0aC5QSSAvIDI7ICAgICAgICAgICAgLy8gc2hvdyB0aGUgcG9sZSB0byB0aGUgY2FtZXJhXG4gICAgdGhpcy5iYWxsU3Bpbi5hZGQodGhpcy5iYWxsTWVzaCk7IHRoaXMuYmFsbFVuLmFkZCh0aGlzLmJhbGxTcGluKTsgdGhpcy5iYWxsU3EuYWRkKHRoaXMuYmFsbFVuKTsgdGhpcy5iYWxsLmFkZCh0aGlzLmJhbGxTcSk7XG4gICAgdGhpcy5iYWxsU2hhZG93ID0gbmV3IFRIUkVFLk1lc2gobmV3IFRIUkVFLkNpcmNsZUdlb21ldHJ5KDEsIDIwKSwgdGhpcy5tYXRTaGFkb3cpO1xuICAgIHRoaXMud29ybGQuYWRkKHRoaXMuYmFsbFNoYWRvdywgdGhpcy5iYWxsKTtcbiAgfVxuXG4gIHNldFNraW4oaWQpIHtcbiAgICB0aGlzLnNraW4gPSBza2luQnlJZChpZCk7XG4gICAgdGhpcy5iYWxsTWF0Lm1hcCA9IHNraW5UZXh0dXJlKHRoaXMuc2tpbi5pZCk7XG4gICAgdGhpcy5iYWxsTWF0Lm5lZWRzVXBkYXRlID0gdHJ1ZTtcbiAgfVxuXG4gIF9kaXNwb3NlTGV2ZWwoKSB7XG4gICAgY29uc3QgZyA9IHRoaXMubGV2ZWw7XG4gICAgZm9yIChsZXQgaSA9IGcuY2hpbGRyZW4ubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgIGNvbnN0IG0gPSBnLmNoaWxkcmVuW2ldO1xuICAgICAgZy5yZW1vdmUobSk7XG4gICAgICBtLnRyYXZlcnNlKChvKSA9PiB7IGlmIChvLmdlb21ldHJ5ICYmIG8uZ2VvbWV0cnkgIT09IHRoaXMuZ2VtR2VvKSBvLmdlb21ldHJ5LmRpc3Bvc2UoKTsgaWYgKG8udXNlckRhdGEub3duTWF0KSB7IGlmIChvLm1hdGVyaWFsLm1hcCAmJiBvLm1hdGVyaWFsLm1hcCAhPT0gdGhpcy5nbG93VGV4KSBvLm1hdGVyaWFsLm1hcC5kaXNwb3NlKCk7IG8ubWF0ZXJpYWwuZGlzcG9zZSgpOyB9IH0pO1xuICAgIH1cbiAgICB0aGlzLmZ4LmNsZWFyKCk7XG4gIH1cblxuICAvKiogQnVpbGQgYWxsIG1lc2hlcyBmb3IgYSBjb21waWxlZCBsZXZlbC4gKi9cbiAgYnVpbGQoTCkge1xuICAgIGNvbnN0IFQgPSAodGhpcy50aGVtZSA9IHRoZW1lT2YoTC50aGVtZSkpO1xuICAgIHRoaXMuX2Rpc3Bvc2VMZXZlbCgpO1xuICAgIHRoaXMuYW1iLmludGVuc2l0eSA9IFQuYW1iaWVudDsgdGhpcy5zdW4uaW50ZW5zaXR5ID0gVC5zdW47XG4gICAgdGhpcy5tYXRTaGFkb3cuY29sb3Iuc2V0SGV4KFQuc2hhZG93KTsgdGhpcy5tYXRTaGFkb3cub3BhY2l0eSA9IFQuc2hhZG93QTtcbiAgICB0aGlzLm1hdEdlbS5jb2xvci5zZXRIZXgoVC5nZW0pO1xuICAgIHRoaXMubWF0Q3J5c3RhbC5jb2xvci5zZXRIZXgoVC5jcnlzdGFsKTtcblxuICAgIGNvbnN0IGdiID0gbmV3IEdlb0J1aWxkZXIoKSwgc2ggPSBuZXcgR2VvQnVpbGRlcigpLCBIID0gV0FMTF9ILCBlZGdlcyA9IFtdO1xuICAgIGNvbnN0IG91dGxpbmUgPSAocHRzLCBjeCwgY3ksIGNzLCBzbiwgeikgPT4ge1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwdHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3QgYSA9IHB0c1tpXSwgYiA9IHB0c1soaSArIDEpICUgcHRzLmxlbmd0aF07XG4gICAgICAgIGVkZ2VzLnB1c2goY3ggKyBhWzBdICogY3MgLSBhWzFdICogc24sIGN5ICsgYVswXSAqIHNuICsgYVsxXSAqIGNzLCB6LCBjeCArIGJbMF0gKiBjcyAtIGJbMV0gKiBzbiwgY3kgKyBiWzBdICogc24gKyBiWzFdICogY3MsIHopO1xuICAgICAgfVxuICAgIH07XG5cbiAgICAvLyBmbG9vcjogY2hlY2tlciB0aWxlcyBvbiBhIHBsYXRlXG4gICAgY29uc3QgbiA9IDE0LCBjcyA9ICgyICogSEFMRikgLyBuO1xuICAgIGZvciAobGV0IGogPSAwOyBqIDwgbjsgaisrKSBmb3IgKGxldCBpID0gMDsgaSA8IG47IGkrKykge1xuICAgICAgY29uc3QgeDAgPSAtSEFMRiArIGkgKiBjcywgeTAgPSAtSEFMRiArIGogKiBjcztcbiAgICAgIGdiLnF1YWQoW3gwLCB5MCwgMF0sIFt4MCArIGNzLCB5MCwgMF0sIFt4MCArIGNzLCB5MCArIGNzLCAwXSwgW3gwLCB5MCArIGNzLCAwXSwgKGkgKyBqKSAlIDIgPyBULmZsb29yQSA6IFQuZmxvb3JCKTtcbiAgICB9XG4gICAgY29uc3Qgc3EgPSByb3VuZFJlY3QoSEFMRiwgSEFMRiwgMSwgMSk7XG4gICAgZ2IucHJpc20oc3EsIHNxLCAwLCAwLCAxLCAwLCAtMTQsIC0wLjA1LCAwLCBULnBsYXRlLCBULnBsYXRlLCBULnBsYXRlKTtcblxuICAgIC8vIHdhbGxzXG4gICAgY29uc3Qgcm93cyA9IEwucm93cywgTiA9IEwubjtcbiAgICBjb25zdCBpc0NoID0gKGMsIHIsIGNoKSA9PiByID49IDAgJiYgYyA+PSAwICYmIHIgPCBOICYmIGMgPCBOICYmIHJvd3Nbcl1bY10gPT09IGNoO1xuICAgIGZvciAoY29uc3QgcyBvZiBMLnNvbGlkcykge1xuICAgICAgaWYgKHMuayA9PT0gS19CT1gpIHtcbiAgICAgICAgbGV0IGh3ID0gcy5odywgaGggPSBzLmhoLCBjeCA9IHMuY3gsIGN5ID0gcy5jeTtcbiAgICAgICAgY29uc3QgcmFkID0gMy4yLCBleHQgPSByYWQgKyAwLjY7XG4gICAgICAgIGlmIChzLnJjKSB7XG4gICAgICAgICAgLy8gd2hlcmUgYSB3aG9sZSBzaWRlIGJ1dHRzIGludG8gYW5vdGhlciB3YWxsLCBleHRlbmQgaW50byBpdCBzbyB0aGUgcm91bmRlZCBjb3JuZXJzIGRvbid0IGxlYXZlIG5vdGNoZXNcbiAgICAgICAgICBjb25zdCB7IGMwLCBjMSwgcjAsIHIxIH0gPSBzLnJjLCBjaCA9IHMuaWNlID8gXCI9XCIgOiBcIiNcIjtcbiAgICAgICAgICBsZXQgdXAgPSB0cnVlLCBkbiA9IHRydWUsIGxmID0gdHJ1ZSwgcnQgPSB0cnVlO1xuICAgICAgICAgIGZvciAobGV0IGMgPSBjMDsgYyA8PSBjMTsgYysrKSB7IGlmICghaXNDaChjLCByMCAtIDEsIGNoKSkgdXAgPSBmYWxzZTsgaWYgKCFpc0NoKGMsIHIxICsgMSwgY2gpKSBkbiA9IGZhbHNlOyB9XG4gICAgICAgICAgZm9yIChsZXQgciA9IHIwOyByIDw9IHIxOyByKyspIHsgaWYgKCFpc0NoKGMwIC0gMSwgciwgY2gpKSBsZiA9IGZhbHNlOyBpZiAoIWlzQ2goYzEgKyAxLCByLCBjaCkpIHJ0ID0gZmFsc2U7IH1cbiAgICAgICAgICBpZiAodXApIHsgaGggKz0gZXh0IC8gMjsgY3kgKz0gZXh0IC8gMjsgfSBpZiAoZG4pIHsgaGggKz0gZXh0IC8gMjsgY3kgLT0gZXh0IC8gMjsgfVxuICAgICAgICAgIGlmIChsZikgeyBodyArPSBleHQgLyAyOyBjeCAtPSBleHQgLyAyOyB9IGlmIChydCkgeyBodyArPSBleHQgLyAyOyBjeCArPSBleHQgLyAyOyB9XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgbyA9IHJvdW5kUmVjdChodywgaGgsIHJhZCwgMyksIGlubiA9IHJvdW5kUmVjdChodyAtIDEuOCwgaGggLSAxLjgsIHJhZCAtIDEuMiwgMyk7XG4gICAgICAgIGlmIChzLmljZSkgZ2IucHJpc20obywgaW5uLCBjeCwgY3ksIHMuYywgcy5zLCAwLCBILCAyLCBULmljZSwgc2hhZGUoVC5pY2UsIDAuNzgpLCAweGZmZmZmZik7XG4gICAgICAgIGVsc2UgZ2IucHJpc20obywgaW5uLCBjeCwgY3ksIHMuYywgcy5zLCAwLCBILCAyLCBULndhbGxUb3AsIFQud2FsbFNpZGUsIFQud2FsbEJldmVsKTtcbiAgICAgICAgc2guZmxhdChvLCBjeCwgY3ksIHMuYywgcy5zLCAwLjUsIDApO1xuICAgICAgICBpZiAoVC5lZGdlcykgb3V0bGluZShpbm4sIGN4LCBjeSwgcy5jLCBzLnMsIEggKyAwLjQpO1xuICAgICAgfSBlbHNlIGlmIChzLmsgPT09IEtfQ0lSQ0xFKSB7XG4gICAgICAgIGNvbnN0IG8gPSBjaXJjbGVQdHMocy5yLCAxNiksIGlubiA9IGNpcmNsZVB0cyhzLnIgLSAyLjIsIDE2KTtcbiAgICAgICAgaWYgKHMuYnVtcGVyKSBnYi5wcmlzbShvLCBpbm4sIHMuY3gsIHMuY3ksIDEsIDAsIDAsIEggKyA1LCAyLjUsIFQuYnVtcGVyLCBULmJ1bXBlclNpZGUsIDB4ZmZmZmZmKTtcbiAgICAgICAgZWxzZSBnYi5wcmlzbShvLCBpbm4sIHMuY3gsIHMuY3ksIDEsIDAsIDAsIEgsIDIsIFQucGVnLCBULnBlZ1NpZGUsIHNoYWRlKFQucGVnLCAxLjIpKTtcbiAgICAgICAgc2guZmxhdChvLCBzLmN4LCBzLmN5LCAxLCAwLCAwLjUsIDApO1xuICAgICAgICBpZiAoVC5lZGdlcykgb3V0bGluZShpbm4sIHMuY3gsIHMuY3ksIDEsIDAsIChzLmJ1bXBlciA/IEggKyA1IDogSCkgKyAwLjQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3QgZHggPSBzLmJ4IC0gcy5heCwgZHkgPSBzLmJ5IC0gcy5heSwgbGVuID0gTWF0aC5oeXBvdChkeCwgZHkpLCBjMiA9IGR4IC8gbGVuLCBzMiA9IGR5IC8gbGVuO1xuICAgICAgICBjb25zdCBvID0gcm91bmRSZWN0KGxlbiAvIDIgKyBzLnIsIHMuciwgcy5yLCA0KSwgaW5uID0gcm91bmRSZWN0KGxlbiAvIDIgKyBzLnIgLSAxLjgsIHMuciAtIDEuOCwgcy5yIC0gMS44LCA0KTtcbiAgICAgICAgZ2IucHJpc20obywgaW5uLCBzLmN4LCBzLmN5LCBjMiwgczIsIDAsIEgsIDIsIFQud2FsbFRvcCwgVC53YWxsU2lkZSwgVC53YWxsQmV2ZWwpO1xuICAgICAgICBzaC5mbGF0KG8sIHMuY3gsIHMuY3ksIGMyLCBzMiwgMC41LCAwKTtcbiAgICAgICAgaWYgKFQuZWRnZXMpIG91dGxpbmUoaW5uLCBzLmN4LCBzLmN5LCBjMiwgczIsIEggKyAwLjQpO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIHNwaWtlc1xuICAgIGZvciAoY29uc3QgayBvZiBMLmtpbGxzKSB7XG4gICAgICBjb25zdCBodyA9IGsuaHcgKyAxLjUsIGhoID0gay5oaCArIDEuNSwgbyA9IHJvdW5kUmVjdChodywgaGgsIDEuNSwgMSk7XG4gICAgICBnYi5wcmlzbShvLCBvLCBrLmN4LCBrLmN5LCAxLCAwLCAwLCAxLjQsIDAsIFQuc3Bpa2VCYXNlLCBULnNwaWtlQmFzZSwgVC5zcGlrZUJhc2UpO1xuICAgICAgaWYgKGsuZHggfHwgay5keSkge1xuICAgICAgICBjb25zdCBhbG9uZyA9IGsuZHggPyBoaCA6IGh3LCBkZXB0aCA9IChrLmR4ID8gaHcgOiBoaCkgKiAyO1xuICAgICAgICBjb25zdCBjb3VudCA9IE1hdGgubWF4KDEsIE1hdGgucm91bmQoKGFsb25nICogMikgLyAxMCkpO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNvdW50OyBpKyspIHtcbiAgICAgICAgICBjb25zdCB0ID0gKChpICsgMC41KSAvIGNvdW50IC0gMC41KSAqIGFsb25nICogMjtcbiAgICAgICAgICBjb25zdCBieCA9IGsuY3ggLSBrLmR4ICogKGRlcHRoIC8gMikgKyAoay5keCA/IDAgOiB0KSwgYnkgPSBrLmN5IC0gay5keSAqIChkZXB0aCAvIDIpICsgKGsuZHkgPyAwIDogdCk7XG4gICAgICAgICAgZ2Iuc3Bpa2UoYngsIGJ5LCBIICogMC41LCBrLmR4LCBrLmR5LCAwLCBNYXRoLm1pbig3LjUsIChhbG9uZyAvIGNvdW50KSAqIDEuMjUpLCBkZXB0aCwgVC5zcGlrZSwgVC5zcGlrZURhcmspO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCBueCA9IE1hdGgubWF4KDEsIE1hdGgucm91bmQoKGh3ICogMikgLyAxMSkpLCBueSA9IE1hdGgubWF4KDEsIE1hdGgucm91bmQoKGhoICogMikgLyAxMSkpO1xuICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IG55OyBqKyspIGZvciAobGV0IGkgPSAwOyBpIDwgbng7IGkrKykge1xuICAgICAgICAgIGdiLnNwaWtlKGsuY3ggKyAoKGkgKyAwLjUpIC8gbnggLSAwLjUpICogaHcgKiAyLCBrLmN5ICsgKChqICsgMC41KSAvIG55IC0gMC41KSAqIGhoICogMiwgMSwgMCwgMCwgMSwgNS41LCBIICogMC44NSwgVC5zcGlrZSwgVC5zcGlrZURhcmspO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gbGF1bmNoIHBhZHNcbiAgICBmb3IgKGNvbnN0IHAgb2YgTC5wYWRzKSB7XG4gICAgICBjb25zdCBvID0gcm91bmRSZWN0KHAuaHcsIHAuaGgsIDIuNSwgMik7XG4gICAgICBnYi5wcmlzbShvLCByb3VuZFJlY3QocC5odyAtIDEuNSwgcC5oaCAtIDEuNSwgMiwgMiksIHAuY3gsIHAuY3ksIDEsIDAsIDAsIDUsIDEuNSwgVC5wYWQsIHNoYWRlKFQucGFkLCAwLjcyKSwgMHhmZmZmZmYpO1xuICAgICAgY29uc3QgbSA9IE1hdGgubWluKHAuaHcsIHAuaGgpICogMC43NSwgcHggPSAtcC5keSwgcHkgPSBwLmR4O1xuICAgICAgZ2IudHJpKHAuY3ggLSBwLmR4ICogbSAqIDAuNSAtIHB4ICogbSwgcC5jeSAtIHAuZHkgKiBtICogMC41IC0gcHkgKiBtLCA1LjMsIHAuY3ggLSBwLmR4ICogbSAqIDAuNSArIHB4ICogbSwgcC5jeSAtIHAuZHkgKiBtICogMC41ICsgcHkgKiBtLCA1LjMsIHAuY3ggKyBwLmR4ICogbSwgcC5jeSArIHAuZHkgKiBtLCA1LjMsIFQucGFkQXJyb3cpO1xuICAgIH1cblxuICAgIHRoaXMuaGludCA9IG51bGw7XG4gICAgdGhpcy5zdGF0aWNNZXNoID0gbmV3IFRIUkVFLk1lc2goZ2IuYnVpbGQoKSwgdGhpcy5tYXRTdGF0aWMpO1xuICAgIHRoaXMuc2hhZG93TWVzaCA9IG5ldyBUSFJFRS5NZXNoKHNoLmJ1aWxkKCksIHRoaXMubWF0U2hhZG93KTtcbiAgICB0aGlzLnNoYWRvd01lc2gucmVuZGVyT3JkZXIgPSAxO1xuICAgIHRoaXMubGV2ZWwuYWRkKHRoaXMuc3RhdGljTWVzaCwgdGhpcy5zaGFkb3dNZXNoKTtcbiAgICBpZiAoVC5lZGdlcyAmJiBlZGdlcy5sZW5ndGgpIHtcbiAgICAgIGNvbnN0IGVnID0gbmV3IFRIUkVFLkJ1ZmZlckdlb21ldHJ5KCk7XG4gICAgICBlZy5zZXRBdHRyaWJ1dGUoXCJwb3NpdGlvblwiLCBuZXcgVEhSRUUuRmxvYXQzMkJ1ZmZlckF0dHJpYnV0ZShlZGdlcywgMykpO1xuICAgICAgY29uc3QgbGluZXMgPSBuZXcgVEhSRUUuTGluZVNlZ21lbnRzKGVnLCBuZXcgVEhSRUUuTGluZUJhc2ljTWF0ZXJpYWwoeyBjb2xvcjogVC5lZGdlcyB9KSk7XG4gICAgICBsaW5lcy51c2VyRGF0YS5vd25NYXQgPSB0cnVlO1xuICAgICAgdGhpcy5sZXZlbC5hZGQobGluZXMpO1xuICAgIH1cblxuICAgIC8vIGR5bmFtaWMgdGhpbmdzXG4gICAgY29uc3QgaXQgPSAodGhpcy5pdGVtcyA9IHsgbW92ZXJzOiBbXSwgc2F3czogW10sIGdlbXM6IFtdLCBjcnlzdGFsczogW10sIGdvYWw6IG51bGwgfSk7XG4gICAgZm9yIChjb25zdCBtIG9mIEwubW92ZXJzKSB7XG4gICAgICBjb25zdCBiID0gbmV3IEdlb0J1aWxkZXIoKSwgbyA9IHJvdW5kUmVjdChtLmh3LCBtLmhoLCAzLCAzKTtcbiAgICAgIGIucHJpc20obywgcm91bmRSZWN0KG0uaHcgLSAxLjgsIG0uaGggLSAxLjgsIDIsIDMpLCAwLCAwLCAxLCAwLCAwLCBILCAyLCBULm1vdmVyLCBULm1vdmVyU2lkZSwgMHhmZmZmZmYpO1xuICAgICAgY29uc3QgbWVzaCA9IG5ldyBUSFJFRS5NZXNoKGIuYnVpbGQoKSwgdGhpcy5tYXRTdGF0aWMpO1xuICAgICAgY29uc3Qgc2IgPSBuZXcgR2VvQnVpbGRlcigpOyBzYi5mbGF0KG8sIDAsIDAsIDEsIDAsIDAuNiwgMCk7XG4gICAgICBjb25zdCBzaGFkb3cgPSBuZXcgVEhSRUUuTWVzaChzYi5idWlsZCgpLCB0aGlzLm1hdFNoYWRvdyk7XG4gICAgICB0aGlzLmxldmVsLmFkZChtZXNoLCBzaGFkb3cpO1xuICAgICAgaXQubW92ZXJzLnB1c2goeyBkOiBtLCBtZXNoLCBzaGFkb3cgfSk7XG4gICAgfVxuICAgIGZvciAoY29uc3QgdyBvZiBMLnNhd3MpIHtcbiAgICAgIGNvbnN0IGIgPSBuZXcgR2VvQnVpbGRlcigpLCBvID0gc3RhclB0cyh3LnIsIDEwLCAwLjc2KTtcbiAgICAgIGIucHJpc20obywgc3RhclB0cyh3LnIgLSAxLjIsIDEwLCAwLjc2KSwgMCwgMCwgMSwgMCwgNiwgMTIsIDEsIFQuc2F3LCBzaGFkZShULnNhdywgMC43KSwgMHhmZmZmZmYpO1xuICAgICAgYi5wcmlzbShjaXJjbGVQdHMody5yICogMC4zNiwgMTIpLCBjaXJjbGVQdHMody5yICogMC4zLCAxMiksIDAsIDAsIDEsIDAsIDEyLCAxNCwgMSwgVC5zYXdDb3JlLCBzaGFkZShULnNhd0NvcmUsIDAuNyksIFQuc2F3Q29yZSk7XG4gICAgICBjb25zdCBtZXNoID0gbmV3IFRIUkVFLk1lc2goYi5idWlsZCgpLCB0aGlzLm1hdFN0YXRpYyk7XG4gICAgICBjb25zdCBzYiA9IG5ldyBHZW9CdWlsZGVyKCk7IHNiLmZsYXQoY2lyY2xlUHRzKHcuciAqIDAuOSwgMTQpLCAwLCAwLCAxLCAwLCAwLjYsIDApO1xuICAgICAgY29uc3Qgc2hhZG93ID0gbmV3IFRIUkVFLk1lc2goc2IuYnVpbGQoKSwgdGhpcy5tYXRTaGFkb3cpO1xuICAgICAgdGhpcy5sZXZlbC5hZGQobWVzaCwgc2hhZG93KTtcbiAgICAgIGl0LnNhd3MucHVzaCh7IGQ6IHcsIG1lc2gsIHNoYWRvdyB9KTtcbiAgICB9XG4gICAgTC5nZW1zLmZvckVhY2goKGdtLCBpKSA9PiB7XG4gICAgICBjb25zdCBtZXNoID0gbmV3IFRIUkVFLk1lc2godGhpcy5nZW1HZW8sIHRoaXMubWF0R2VtKTtcbiAgICAgIG1lc2guc2NhbGUuc2V0KDAuODUsIDEuMiwgMC44NSk7XG4gICAgICBtZXNoLnJvdGF0aW9uLm9yZGVyID0gXCJaWVhcIjsgICAgICAgICAgICAgICAgIC8vIHNwaW4gYWJvdXQgaXRzIG93biB2ZXJ0aWNhbCwgdGhlbiBzdGF5IHNjcmVlbi11cHJpZ2h0XG4gICAgICBtZXNoLnBvc2l0aW9uLnNldChnbS54LCBnbS55LCAxMyk7XG4gICAgICBjb25zdCBoYWxvID0gbmV3IFRIUkVFLk1lc2gobmV3IFRIUkVFLlBsYW5lR2VvbWV0cnkoNDAsIDQwKSwgbmV3IFRIUkVFLk1lc2hCYXNpY01hdGVyaWFsKHsgbWFwOiB0aGlzLmdsb3dUZXgsIGNvbG9yOiBULmdlbSwgdHJhbnNwYXJlbnQ6IHRydWUsIG9wYWNpdHk6IFQuZGFyayA/IDAuNTUgOiAwLjc1LCBkZXB0aFdyaXRlOiBmYWxzZSB9KSk7XG4gICAgICBoYWxvLnVzZXJEYXRhLm93bk1hdCA9IHRydWU7IGhhbG8ucG9zaXRpb24uc2V0KGdtLngsIGdtLnksIDIpOyBoYWxvLnJlbmRlck9yZGVyID0gMjtcbiAgICAgIHRoaXMubGV2ZWwuYWRkKGhhbG8sIG1lc2gpO1xuICAgICAgaXQuZ2Vtcy5wdXNoKHsgbWVzaCwgaGFsbywgaSB9KTtcbiAgICB9KTtcbiAgICBMLmNyeXN0YWxzLmZvckVhY2goKGMsIGkpID0+IHtcbiAgICAgIGNvbnN0IG1lc2ggPSBuZXcgVEhSRUUuTWVzaChuZXcgVEhSRUUuQm94R2VvbWV0cnkoYy5odyAqIDIsIGMuaGggKiAyLCBIKSwgdGhpcy5tYXRDcnlzdGFsKTtcbiAgICAgIG1lc2gucG9zaXRpb24uc2V0KGMuY3gsIGMuY3ksIEggLyAyKTsgbWVzaC5yZW5kZXJPcmRlciA9IDM7XG4gICAgICB0aGlzLmxldmVsLmFkZChtZXNoKTtcbiAgICAgIGl0LmNyeXN0YWxzLnB1c2goeyBtZXNoLCBpIH0pO1xuICAgIH0pO1xuXG4gICAgY29uc3QgZ29hbCA9IG5ldyBUSFJFRS5Hcm91cCgpO1xuICAgIGdvYWwucG9zaXRpb24uc2V0KEwuZ29hbC54LCBMLmdvYWwueSwgMCk7XG4gICAgY29uc3QgaGFsbyA9IG5ldyBUSFJFRS5NZXNoKG5ldyBUSFJFRS5QbGFuZUdlb21ldHJ5KDc4LCA3OCksIG5ldyBUSFJFRS5NZXNoQmFzaWNNYXRlcmlhbCh7IG1hcDogdGhpcy5nbG93VGV4LCBjb2xvcjogVC5nb2FsLCB0cmFuc3BhcmVudDogdHJ1ZSwgb3BhY2l0eTogMC44NSwgZGVwdGhXcml0ZTogZmFsc2UgfSkpO1xuICAgIGhhbG8udXNlckRhdGEub3duTWF0ID0gdHJ1ZTsgaGFsby5wb3NpdGlvbi56ID0gMS41OyBoYWxvLnJlbmRlck9yZGVyID0gMjtcbiAgICBjb25zdCBzd2lybCA9IG5ldyBUSFJFRS5NZXNoKG5ldyBUSFJFRS5DaXJjbGVHZW9tZXRyeSgxMiwgMjgpLCBuZXcgVEhSRUUuTWVzaEJhc2ljTWF0ZXJpYWwoeyBtYXA6IHN3aXJsVGV4dHVyZShULmdvYWwsIFQuZ29hbENvcmUpIH0pKTtcbiAgICBzd2lybC51c2VyRGF0YS5vd25NYXQgPSB0cnVlOyBzd2lybC5wb3NpdGlvbi56ID0gMztcbiAgICBjb25zdCByaW5nID0gbmV3IFRIUkVFLk1lc2gobmV3IFRIUkVFLlRvcnVzR2VvbWV0cnkoMTMsIDIuOSwgMTAsIDMyKSwgbmV3IFRIUkVFLk1lc2hMYW1iZXJ0TWF0ZXJpYWwoeyBjb2xvcjogVC5nb2FsLCBlbWlzc2l2ZTogc2hhZGUoVC5nb2FsLCAwLjM1KSB9KSk7XG4gICAgcmluZy51c2VyRGF0YS5vd25NYXQgPSB0cnVlOyByaW5nLnBvc2l0aW9uLnogPSA1O1xuICAgIGdvYWwuYWRkKGhhbG8sIHN3aXJsLCByaW5nKTtcbiAgICB0aGlzLmxldmVsLmFkZChnb2FsKTtcbiAgICBpdC5nb2FsID0geyBncm91cDogZ29hbCwgc3dpcmwsIHJpbmcsIGhhbG8gfTtcblxuICAgIHRoaXMuc3F1YXNoID0gMDsgdGhpcy5zcGluViA9IDA7IHRoaXMuYmFsbFNjYWxlID0gMTsgdGhpcy5zaGFrZSA9IDA7IHRoaXMuem9vbVRvID0gMTtcbiAgICB0aGlzLmJhbGwudmlzaWJsZSA9IHRydWU7IHRoaXMuYmFsbFNoYWRvdy52aXNpYmxlID0gdHJ1ZTtcbiAgICB0aGlzLmludHJvID0gSU5UUk87ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gbmV3IGxldmVsIHBvcHMgaW5cbiAgfVxuXG4gIC8qKiBEb3R0ZWQgcm91dGUgdG8gdGhlIGdvYWwgKHRoZSBzb2x2ZXIncyBwYXRoKSwgc2hvd24gYWZ0ZXIgcmVwZWF0ZWQgZmFpbHVyZXMuICovXG4gIHNob3dIaW50KHBhdGgpIHtcbiAgICB0aGlzLmhpZGVIaW50KCk7XG4gICAgaWYgKCFwYXRoIHx8IHBhdGgubGVuZ3RoIDwgMikgcmV0dXJuO1xuICAgIGNvbnN0IHB0cyA9IFtdLCBzdGVwID0gMTM7XG4gICAgbGV0IGNhcnJ5ID0gMDtcbiAgICBmb3IgKGxldCBpID0gMTsgaSA8IHBhdGgubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IGF4ID0gcGF0aFtpIC0gMV1bMF0sIGF5ID0gcGF0aFtpIC0gMV1bMV0sIGJ4ID0gcGF0aFtpXVswXSwgYnkgPSBwYXRoW2ldWzFdLCBsZW4gPSBNYXRoLmh5cG90KGJ4IC0gYXgsIGJ5IC0gYXkpO1xuICAgICAgaWYgKGxlbiA8IDFlLTYpIGNvbnRpbnVlO1xuICAgICAgbGV0IGQgPSBjYXJyeTtcbiAgICAgIHdoaWxlIChkIDwgbGVuKSB7IGNvbnN0IHQgPSBkIC8gbGVuOyBwdHMucHVzaChheCArIChieCAtIGF4KSAqIHQsIGF5ICsgKGJ5IC0gYXkpICogdCwgOSk7IGQgKz0gc3RlcDsgfVxuICAgICAgY2FycnkgPSBkIC0gbGVuO1xuICAgIH1cbiAgICBjb25zdCBnID0gbmV3IFRIUkVFLkJ1ZmZlckdlb21ldHJ5KCk7XG4gICAgZy5zZXRBdHRyaWJ1dGUoXCJwb3NpdGlvblwiLCBuZXcgVEhSRUUuRmxvYXQzMkJ1ZmZlckF0dHJpYnV0ZShwdHMsIDMpKTtcbiAgICBjb25zdCBtID0gbmV3IFRIUkVFLlBvaW50c01hdGVyaWFsKHsgbWFwOiB0aGlzLmdsb3dUZXgsIGNvbG9yOiB0aGlzLnRoZW1lLmRhcmsgPyAweGZmZmZmZiA6IDB4NmEzZGYwLCBzaXplOiAxMCAqIHRoaXMucHIsIHNpemVBdHRlbnVhdGlvbjogZmFsc2UsIHRyYW5zcGFyZW50OiB0cnVlLCBvcGFjaXR5OiAwLjg1LCBkZXB0aFdyaXRlOiBmYWxzZSB9KTtcbiAgICB0aGlzLmhpbnQgPSBuZXcgVEhSRUUuUG9pbnRzKGcsIG0pO1xuICAgIHRoaXMuaGludC51c2VyRGF0YS5vd25NYXQgPSB0cnVlOyB0aGlzLmhpbnQucmVuZGVyT3JkZXIgPSA0O1xuICAgIHRoaXMubGV2ZWwuYWRkKHRoaXMuaGludCk7XG4gIH1cbiAgaGlkZUhpbnQoKSB7XG4gICAgaWYgKCF0aGlzLmhpbnQpIHJldHVybjtcbiAgICB0aGlzLmxldmVsLnJlbW92ZSh0aGlzLmhpbnQpOyB0aGlzLmhpbnQuZ2VvbWV0cnkuZGlzcG9zZSgpOyB0aGlzLmhpbnQubWF0ZXJpYWwuZGlzcG9zZSgpOyB0aGlzLmhpbnQgPSBudWxsO1xuICB9XG5cbiAgLyoqIExvd2VyIHRoZSByZW5kZXJpbmcgY29zdCBhdCBydW50aW1lIChjYWxsZWQgd2hlbiB0aGUgZnJhbWUgcmF0ZSBpcyBwb29yKS4gUmV0dXJucyBmYWxzZSBpZiBhbHJlYWR5IG1pbmltYWwuICovXG4gIGRlZ3JhZGUoKSB7XG4gICAgaWYgKHRoaXMucHIgPD0gMSkgcmV0dXJuIGZhbHNlO1xuICAgIHRoaXMucHIgPSBNYXRoLm1heCgxLCB0aGlzLnByIC0gMC41KTtcbiAgICB0aGlzLnJlbmRlcmVyLnNldFBpeGVsUmF0aW8odGhpcy5wcik7XG4gICAgdGhpcy5yZW5kZXJlci5zZXRTaXplKHRoaXMuVywgdGhpcy5ILCBmYWxzZSk7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICByZXNpemUoKSB7XG4gICAgY29uc3QgVyA9IE1hdGgubWF4KDEsIHRoaXMuc3RhZ2UuY2xpZW50V2lkdGgpLCBIID0gTWF0aC5tYXgoMSwgdGhpcy5zdGFnZS5jbGllbnRIZWlnaHQpO1xuICAgIHRoaXMuVyA9IFc7IHRoaXMuSCA9IEg7XG4gICAgdGhpcy5yZW5kZXJlci5zZXRTaXplKFcsIEgsIGZhbHNlKTtcbiAgICBjb25zdCBjYW0gPSB0aGlzLmNhbWVyYTtcbiAgICBjYW0uYXNwZWN0ID0gVyAvIEg7XG4gICAgY29uc3QgdCA9IE1hdGgudGFuKChGT1YgKiBNYXRoLlBJKSAvIDM2MCksIGlucyA9IHRoaXMuaW5zZXRzO1xuICAgIGNvbnN0IGZ2ID0gTWF0aC5tYXgoMC4zLCAoSCAtIGlucy50b3AgLSBpbnMuYm90dG9tKSAvIEgpLCBmaCA9IE1hdGgubWF4KDAuMywgKFcgLSBpbnMubGVmdCAtIGlucy5yaWdodCkgLyBXKTtcbiAgICBjb25zdCBEID0gTWF0aC5tYXgoRklUX1IgLyAodCAqIGZ2KSwgRklUX1IgLyAodCAqIGNhbS5hc3BlY3QgKiBmaCkpICogMS4wMztcbiAgICBjb25zdCB1cHAgPSAoMiAqIEQgKiB0KSAvIEg7XG4gICAgLy8gZ2xpZGUgdG8gdGhlIG5ldyBmcmFtaW5nIGluc3RlYWQgb2YganVtcGluZyAoaG9tZSA8LT4gcGxheSwgcm90YXRpb24gb2YgdGhlIGRldmljZSlcbiAgICB0aGlzLmNhbVRvID0geyBELCBseDogKChpbnMucmlnaHQgLSBpbnMubGVmdCkgLyAyKSAqIHVwcCwgbHk6ICgoaW5zLnRvcCAtIGlucy5ib3R0b20pIC8gMikgKiB1cHAgfTtcbiAgICBpZiAoIXRoaXMuY2FtKSB0aGlzLmNhbSA9IHsgLi4udGhpcy5jYW1UbyB9O1xuICAgIGNhbS51cGRhdGVQcm9qZWN0aW9uTWF0cml4KCk7XG4gICAgdGhpcy5fcGxhY2VDYW1lcmEoMCwgMCk7XG4gIH1cblxuICBfcGxhY2VDYW1lcmEoc3gsIHN5KSB7XG4gICAgY29uc3QgeyBELCBseCwgbHkgfSA9IHRoaXMuY2FtLCB6ID0gdGhpcy56b29tO1xuICAgIHRoaXMuY2FtZXJhLnBvc2l0aW9uLnNldChseCArIHN4LCBseSAtIE1hdGguc2luKFBJVENIKSAqIEQgKiB6ICsgc3ksIE1hdGguY29zKFBJVENIKSAqIEQgKiB6KTtcbiAgICB0aGlzLmNhbWVyYS5sb29rQXQobHgsIGx5LCAwKTtcbiAgfVxuXG4gIC8qKiBBcmVuYS1sb2NhbCBwb2ludCAtPiBDU1MgcGl4ZWxzIGluc2lkZSB0aGUgc3RhZ2UuICovXG4gIHRvU2NyZWVuKHgsIHksIHogPSAwKSB7XG4gICAgY29uc3QgdiA9IG5ldyBUSFJFRS5WZWN0b3IzKHgsIHksIHopLmFwcGx5TWF0cml4NCh0aGlzLndvcmxkLm1hdHJpeFdvcmxkKS5wcm9qZWN0KHRoaXMuY2FtZXJhKTtcbiAgICByZXR1cm4geyB4OiAodi54ICogMC41ICsgMC41KSAqIHRoaXMuVywgeTogKC12LnkgKiAwLjUgKyAwLjUpICogdGhpcy5IIH07XG4gIH1cblxuICAvLyAtLS0tIGVmZmVjdHMgKGNhbGxlZCBieSB0aGUgZ2FtZSBvbiBzaW0gZXZlbnRzKSAtLS0tXG4gIGZ4SGl0KHgsIHksIHYpIHtcbiAgICB0aGlzLnNxdWFzaCA9IE1hdGgubWF4KHRoaXMuc3F1YXNoLCBNYXRoLm1pbigwLjM0LCB2IC8gMTUwMCkpO1xuICAgIGlmICh2ID4gMjYwKSB0aGlzLnNoYWtlID0gTWF0aC5tYXgodGhpcy5zaGFrZSwgTWF0aC5taW4oNSwgdiAvIDIyMCkpO1xuICAgIGlmICh2ID4gMTcwICYmIHRoaXMudGllciA+IDApIHRoaXMuZnguYnVyc3QoeCwgeSwgeyBuOiBNYXRoLm1pbig4LCAyICsgKHYgLyAxMzApIHwgMCksIHNwZWVkOiB2ICogMC4zNSwgY29sb3I6IHRoaXMudGhlbWUuZGFyayA/IDB4OWZiNGZmIDogMHhmZmZmZmYsIHNpemU6IDMuMiwgbGlmZTogMC4zMiwgejogMTAgfSk7XG4gIH1cbiAgZnhHZW0oeCwgeSkge1xuICAgIHRoaXMuZnguYnVyc3QoeCwgeSwgeyBuOiB0aGlzLnRpZXIgPyAxNiA6IDksIHNwZWVkOiAxOTAsIGNvbG9yczogW3RoaXMudGhlbWUuZ2VtLCAweGZmZmZmZiwgc2hhZGUodGhpcy50aGVtZS5nZW0sIDEuMildLCBzaXplOiA0LjQsIGxpZmU6IDAuNTUgfSk7XG4gICAgdGhpcy5meC5yaW5nKHgsIHksIHRoaXMudGhlbWUuZ2VtLCA4LCA0NCwgMC4zMik7XG4gIH1cbiAgZnhEaWUoeCwgeSkge1xuICAgIHRoaXMuc2hha2UgPSA5O1xuICAgIHRoaXMuZnguYnVyc3QoeCwgeSwgeyBuOiB0aGlzLnRpZXIgPyAyNiA6IDE0LCBzcGVlZDogMjgwLCBjb2xvcnM6IFt0aGlzLnRoZW1lLnNwaWtlLCAweGZmZmZmZiwgc2tpblRyYWlsKHRoaXMuc2tpbildLCBzaXplOiA1LjUsIGxpZmU6IDAuNywgZzogNTIwIH0pO1xuICAgIHRoaXMuZngucmluZyh4LCB5LCB0aGlzLnRoZW1lLnNwaWtlLCAxMCwgNzAsIDAuNCk7XG4gIH1cbiAgZnhXaW4oeCwgeSkge1xuICAgIHRoaXMuem9vbVRvID0gMC45NDtcbiAgICB0aGlzLmZ4LnJpbmcoeCwgeSwgdGhpcy50aGVtZS5nb2FsLCAxNCwgMTEwLCAwLjU1KTtcbiAgICBjb25zdCBjb2xzID0gWzB4ZmY0ZDZkLCAweGZmYzIxZiwgMHgzZGRjOTcsIDB4NGRhYmZmLCAweGIwN2JmZiwgMHhmZmZmZmZdO1xuICAgIHRoaXMuZnguYnVyc3QoeCwgeSwgeyBuOiB0aGlzLnRpZXIgPyA0NiA6IDIyLCBzcGVlZDogMzMwLCBjb2xvcnM6IGNvbHMsIHNpemU6IDYsIGxpZmU6IDEuMjUsIGc6IDM4MCwgZHJhZzogMC45IH0pO1xuICB9XG4gIGZ4QnVtcCh4LCB5KSB7IHRoaXMuZngucmluZyh4LCB5LCB0aGlzLnRoZW1lLmJ1bXBlciwgMTQsIDQwLCAwLjI1KTsgdGhpcy5zaGFrZSA9IE1hdGgubWF4KHRoaXMuc2hha2UsIDIuNSk7IH1cbiAgZnhTaGF0dGVyKHgsIHkpIHsgdGhpcy5zaGFrZSA9IDc7IHRoaXMuZnguYnVyc3QoeCwgeSwgeyBuOiAyMiwgc3BlZWQ6IDMwMCwgY29sb3JzOiBbdGhpcy50aGVtZS5jcnlzdGFsLCAweGZmZmZmZl0sIHNpemU6IDYsIGxpZmU6IDAuNywgZzogNTAwIH0pOyB9XG4gIGZ4UGFkKHgsIHkpIHsgdGhpcy5meC5yaW5nKHgsIHksIHRoaXMudGhlbWUucGFkLCA4LCAzNiwgMC4yNSk7IH1cblxuICAvKiogRHJhdyBvbmUgZnJhbWUuIGB0YCBzZWNvbmRzICh3YWxsIGNsb2NrKSwgYGR0YCBmcmFtZSB0aW1lLiAqL1xuICBkcmF3KHNpbSwgdCwgZHQpIHtcbiAgICBjb25zdCBpdCA9IHRoaXMuaXRlbXMsIGFuZyA9IHNpbS5hbmdsZSwgZiA9IHNpbS5mb3JtLCByID0gZi5yO1xuICAgIHRoaXMud29ybGQucm90YXRpb24ueiA9IGFuZztcbiAgICBjb25zdCBjID0gTWF0aC5jb3MoYW5nKSwgcyA9IE1hdGguc2luKGFuZyk7XG4gICAgY29uc3Qgb3ggPSBTSFggKiBjICsgU0hZICogcywgb3kgPSAtU0hYICogcyArIFNIWSAqIGM7ICAgLy8gc2NyZWVuLXNwYWNlIHNoYWRvdyBvZmZzZXQgaW4gdGhlIGFyZW5hIGZyYW1lXG4gICAgdGhpcy5zaGFkb3dNZXNoLnBvc2l0aW9uLnNldChveCwgb3ksIDApO1xuXG4gICAgZm9yIChjb25zdCBtIG9mIGl0Lm1vdmVycykgeyBwYXRoUG9zKG0uZCwgc2ltLnRpbWUsIFApOyBtLm1lc2gucG9zaXRpb24uc2V0KFAueCwgUC55LCAwKTsgbS5zaGFkb3cucG9zaXRpb24uc2V0KFAueCArIG94LCBQLnkgKyBveSwgMCk7IH1cbiAgICBmb3IgKGNvbnN0IHcgb2YgaXQuc2F3cykgeyBwYXRoUG9zKHcuZCwgc2ltLnRpbWUsIFApOyB3Lm1lc2gucG9zaXRpb24uc2V0KFAueCwgUC55LCAwKTsgdy5tZXNoLnJvdGF0aW9uLnogLT0gZHQgKiA5OyB3LnNoYWRvdy5wb3NpdGlvbi5zZXQoUC54ICsgb3gsIFAueSArIG95LCAwKTsgfVxuICAgIGZvciAoY29uc3QgZyBvZiBpdC5nZW1zKSB7XG4gICAgICBjb25zdCBvbiA9ICEoc2ltLmdlbXMgJiAoMSA8PCBnLmkpKTtcbiAgICAgIGcubWVzaC52aXNpYmxlID0gb247IGcuaGFsby52aXNpYmxlID0gb247XG4gICAgICBpZiAob24pIHsgZy5tZXNoLnJvdGF0aW9uLnkgPSB0ICogMi40ICsgZy5pICogMjsgZy5tZXNoLnJvdGF0aW9uLnogPSAtYW5nOyBnLm1lc2gucG9zaXRpb24ueiA9IDE0ICsgTWF0aC5zaW4odCAqIDMgKyBnLmkpICogMjsgY29uc3QgayA9IDEgKyBNYXRoLnNpbih0ICogNCArIGcuaSkgKiAwLjA4OyBnLmhhbG8uc2NhbGUuc2V0KGssIGssIDEpOyB9XG4gICAgfVxuICAgIGZvciAoY29uc3QgY3Igb2YgaXQuY3J5c3RhbHMpIGNyLm1lc2gudmlzaWJsZSA9ICEoc2ltLmNyeXMgJiAoMSA8PCBjci5pKSk7XG4gICAgY29uc3QgZ28gPSBpdC5nb2FsO1xuICAgIGdvLnN3aXJsLnJvdGF0aW9uLnogPSAtdCAqIDIuNjtcbiAgICBjb25zdCBnayA9IDEgKyBNYXRoLnNpbih0ICogMy4yKSAqIDAuMDU7XG4gICAgZ28ucmluZy5zY2FsZS5zZXQoZ2ssIGdrLCAxKTsgZ28uaGFsby5zY2FsZS5zZXQoZ2sgKiAxLjA1LCBnayAqIDEuMDUsIDEpO1xuXG4gICAgLy8gYmFsbFxuICAgIGNvbnN0IGJzID0gdGhpcy5iYWxsU2NhbGU7XG4gICAgdGhpcy5iYWxsLnBvc2l0aW9uLnNldChzaW0ueCwgc2ltLnksIHIpO1xuICAgIGlmIChzaW0uYWlyIDwgMykgdGhpcy5zcGluViA9IChzaW0ubnggKiBzaW0udnkgLSBzaW0ubnkgKiBzaW0udngpIC8gcjsgZWxzZSB0aGlzLnNwaW5WICo9IE1hdGgubWF4KDAsIDEgLSAwLjUgKiBkdCk7XG4gICAgdGhpcy5zcGluICs9IHRoaXMuc3BpblYgKiBkdDtcbiAgICB0aGlzLmJhbGxTcGluLnJvdGF0aW9uLnogPSB0aGlzLnNwaW47XG4gICAgdGhpcy5zcXVhc2ggKj0gTWF0aC5leHAoLWR0ICogMTMpO1xuICAgIGNvbnN0IGEgPSBNYXRoLmF0YW4yKHNpbS5ueSwgc2ltLm54KSwgayA9IHRoaXMuc3F1YXNoO1xuICAgIHRoaXMuYmFsbFNxLnJvdGF0aW9uLnogPSBhOyB0aGlzLmJhbGxVbi5yb3RhdGlvbi56ID0gLWE7XG4gICAgdGhpcy5iYWxsU3Euc2NhbGUuc2V0KHIgKiAoMSAtIGspICogYnMsIHIgKiAoMSArIGsgKiAwLjcpICogYnMsIHIgKiBicyk7XG4gICAgdGhpcy5iYWxsU2hhZG93LnBvc2l0aW9uLnNldChzaW0ueCArIG94ICogMS4xLCBzaW0ueSArIG95ICogMS4xLCAwLjcpO1xuICAgIHRoaXMuYmFsbFNoYWRvdy5zY2FsZS5zZXQociAqIDEuMDIgKiBicywgciAqIDEuMDIgKiBicywgMSk7XG5cbiAgICAvLyB0cmFpbFxuICAgIGlmICh0aGlzLmJhbGwudmlzaWJsZSAmJiBzaW0uYWxpdmUgJiYgIXNpbS53b24pIHtcbiAgICAgIGNvbnN0IHNwID0gTWF0aC5oeXBvdChzaW0udngsIHNpbS52eSk7XG4gICAgICB0aGlzLnRyYWlsVCAtPSBkdDtcbiAgICAgIGlmIChzcCA+IDE1MCAmJiB0aGlzLnRyYWlsVCA8PSAwKSB7XG4gICAgICAgIHRoaXMudHJhaWxUID0gdGhpcy50aWVyID8gMC4wMyA6IDAuMDY7XG4gICAgICAgIHRoaXMuZnguc3Bhd24oeyB4OiBzaW0ueCwgeTogc2ltLnksIHo6IHIgKiAwLjYsIHNpemU6IHIgKiAxLjI1LCBsaWZlOiAwLjIyLCBjb2xvcjogc2tpblRyYWlsKHRoaXMuc2tpbiksIGZsYXQ6IHRydWUsIHNwaW46IDAgfSk7XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMuZngudXBkYXRlKGR0LCAtcywgLWMpO1xuXG4gICAgaWYgKHRoaXMuaGludCkgdGhpcy5oaW50Lm1hdGVyaWFsLm9wYWNpdHkgPSAwLjYgKyAwLjMgKiBNYXRoLnNpbih0ICogNSk7XG5cbiAgICAvLyBsZXZlbCBwb3AtaW5cbiAgICBpZiAodGhpcy5pbnRybyA+IDApIHtcbiAgICAgIHRoaXMuaW50cm8gPSBNYXRoLm1heCgwLCB0aGlzLmludHJvIC0gZHQpO1xuICAgICAgY29uc3QgcSA9IDEgLSB0aGlzLmludHJvIC8gSU5UUk8sIGUgPSAxIC0gTWF0aC5wb3coMSAtIHEsIDMpO1xuICAgICAgdGhpcy53b3JsZC5zY2FsZS5zZXRTY2FsYXIoMC44NiArIDAuMTQgKiBlKTtcbiAgICB9XG5cbiAgICAvLyBjYW1lcmEgZmVlbFxuICAgIGNvbnN0IGNrID0gTWF0aC5taW4oMSwgZHQgKiA3KSwgY20gPSB0aGlzLmNhbSwgY3QgPSB0aGlzLmNhbVRvO1xuICAgIGNtLkQgKz0gKGN0LkQgLSBjbS5EKSAqIGNrOyBjbS5seCArPSAoY3QubHggLSBjbS5seCkgKiBjazsgY20ubHkgKz0gKGN0Lmx5IC0gY20ubHkpICogY2s7XG4gICAgdGhpcy56b29tICs9ICh0aGlzLnpvb21UbyAtIHRoaXMuem9vbSkgKiBNYXRoLm1pbigxLCBkdCAqIDYpO1xuICAgIHRoaXMuc2hha2UgKj0gTWF0aC5leHAoLWR0ICogMTApO1xuICAgIGNvbnN0IHNoID0gdGhpcy5zaGFrZSA+IDAuMDUgPyB0aGlzLnNoYWtlIDogMDtcbiAgICB0aGlzLl9wbGFjZUNhbWVyYSgoTWF0aC5yYW5kb20oKSAtIDAuNSkgKiAyICogc2gsIChNYXRoLnJhbmRvbSgpIC0gMC41KSAqIDIgKiBzaCk7XG5cbiAgICB0aGlzLnJlbmRlcmVyLnJlbmRlcih0aGlzLnNjZW5lLCB0aGlzLmNhbWVyYSk7XG4gIH1cblxuICBpbmZvKCkgeyBjb25zdCBpID0gdGhpcy5yZW5kZXJlci5pbmZvLnJlbmRlcjsgcmV0dXJuIHsgY2FsbHM6IGkuY2FsbHMsIHRyaXM6IGkudHJpYW5nbGVzIH07IH1cbn1cblxuZnVuY3Rpb24gc2tpblRyYWlsKHNraW4pIHsgcmV0dXJuIHNraW4udHJhaWwgfHwgMHhmZmZmZmY7IH1cbiIsICIvLyBET00gdXNlciBpbnRlcmZhY2UuIEtub3dzIG5vdGhpbmcgYWJvdXQgcGh5c2ljcyBvciByZW5kZXJpbmc7IHRhbGtzIHRvIHRoZSBnYW1lIHRocm91Z2ggaGFuZGxlcnMuXG5pbXBvcnQgeyBTS0lOUywgc2tpblN3YXRjaCB9IGZyb20gXCIuLi9yZW5kZXIvc2tpbnMuanNcIjtcbmNvbnN0ICQgPSAoaWQpID0+IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGlkKTtcbmNvbnN0IFNDUkVFTlMgPSBbXCJzY3JMb2FkaW5nXCIsIFwic2NySG9tZVwiLCBcInNjcldpblwiLCBcInNjck1hcFwiLCBcInNjclNob3BcIiwgXCJzY3JTZXR0aW5nc1wiLCBcInNjckVuZFwiLCBcInNjckVycm9yXCJdO1xuY29uc3QgR0VNID0gJzxzdmcgdmlld0JveD1cIjAgMCAyNCAyNFwiPjxwYXRoIGQ9XCJNMTIgMmw3IDktNyAxMS03LTExelwiIGZpbGw9XCJjdXJyZW50Q29sb3JcIi8+PC9zdmc+JztcbmNvbnN0IENIRUNLID0gJzxzdmcgdmlld0JveD1cIjAgMCAyNCAyNFwiPjxwYXRoIGQ9XCJNNSAxMi41MDBsNC41MDAgNC41MDBMMTkgNy41MDBcIiBmaWxsPVwibm9uZVwiIHN0cm9rZT1cImN1cnJlbnRDb2xvclwiIHN0cm9rZS13aWR0aD1cIjNcIiBzdHJva2UtbGluZWNhcD1cInJvdW5kXCIgc3Ryb2tlLWxpbmVqb2luPVwicm91bmRcIi8+PC9zdmc+JztcblxuZXhwb3J0IGNsYXNzIFVJIHtcbiAgLyoqIEBwYXJhbSBoIGhhbmRsZXJzOiBwbGF5LCBuZXh0LCByZXRyeSwgb3Blbk1hcCwgcGljayhpKSwgb3BlblNldHRpbmdzLCBjbG9zZU92ZXJsYXksIGRvdWJsZSwgcmVzdGFydCwgc2V0T3B0KGtleSwgdmFsdWUpLCBnZXN0dXJlICovXG4gIGNvbnN0cnVjdG9yKGkxOG4sIGgpIHtcbiAgICB0aGlzLmkxOG4gPSBpMThuOyB0aGlzLmggPSBoOyB0aGlzLnNjcmVlbiA9IFwic2NyTG9hZGluZ1wiOyB0aGlzLnRvYXN0VCA9IDA7IHRoaXMuc3RhclRpbWVycyA9IFtdO1xuICAgIGNvbnN0IG9uID0gKGlkLCBmbikgPT4gJChpZCkuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIChlKSA9PiB7IGguZ2VzdHVyZSgpOyBmbihlKTsgfSk7XG4gICAgb24oXCJidG5QbGF5XCIsICgpID0+IGgucGxheSgpKTtcbiAgICBvbihcImJ0bkxldmVsc1wiLCAoKSA9PiBoLm9wZW5NYXAoKSk7XG4gICAgb24oXCJidG5TZXR0aW5nc1wiLCAoKSA9PiBoLm9wZW5TZXR0aW5ncygpKTtcbiAgICBvbihcImJ0bk5leHRcIiwgKCkgPT4gaC5uZXh0KCkpO1xuICAgIG9uKFwiYnRuUmV0cnlcIiwgKCkgPT4gaC5yZXRyeSgpKTtcbiAgICBvbihcImJ0bldpbk1hcFwiLCAoKSA9PiBoLm9wZW5NYXAoKSk7XG4gICAgb24oXCJidG5Eb3VibGVcIiwgKCkgPT4gaC5kb3VibGUoKSk7XG4gICAgb24oXCJidG5NYXBDbG9zZVwiLCAoKSA9PiBoLmNsb3NlT3ZlcmxheSgpKTtcbiAgICBvbihcImJ0bk1hcEhvbWVcIiwgKCkgPT4gaC5ob21lKCkpO1xuICAgIG9uKFwiYnRuU2V0Q2xvc2VcIiwgKCkgPT4gaC5jbG9zZU92ZXJsYXkoKSk7XG4gICAgb24oXCJidG5FbmRNYXBcIiwgKCkgPT4gaC5vcGVuTWFwKCkpO1xuICAgIG9uKFwiYnRuUmVzdGFydFwiLCAoKSA9PiBoLnJlc3RhcnQoKSk7XG4gICAgb24oXCJidG5NYXBcIiwgKCkgPT4gaC5vcGVuTWFwKCkpO1xuICAgIG9uKFwiYnRuU2hvcFwiLCAoKSA9PiBoLm9wZW5TaG9wKCkpO1xuICAgIG9uKFwiYnRuU2hvcENsb3NlXCIsICgpID0+IGguY2xvc2VPdmVybGF5KCkpO1xuICAgIG9uKFwiYnRuSGludFwiLCAoKSA9PiBoLmhpbnQoKSk7XG4gICAgb24oXCJidG5Ta2lwXCIsICgpID0+IGguc2tpcCgpKTtcbiAgICAkKFwib3B0TXVzaWNcIikuYWRkRXZlbnRMaXN0ZW5lcihcImNoYW5nZVwiLCAoZSkgPT4geyBoLmdlc3R1cmUoKTsgaC5zZXRPcHQoXCJtdXNpY1wiLCBlLnRhcmdldC5jaGVja2VkID8gMSA6IDApOyB9KTtcbiAgICAkKFwib3B0U2Z4XCIpLmFkZEV2ZW50TGlzdGVuZXIoXCJjaGFuZ2VcIiwgKGUpID0+IHsgaC5nZXN0dXJlKCk7IGguc2V0T3B0KFwic2Z4XCIsIGUudGFyZ2V0LmNoZWNrZWQgPyAxIDogMCk7IH0pO1xuICAgICQoXCJvcHRDdGxcIikucXVlcnlTZWxlY3RvckFsbChcImJ1dHRvblwiKS5mb3JFYWNoKChiKSA9PiBiLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7IGguZ2VzdHVyZSgpOyBoLnNldE9wdChcImN0bFwiLCBiLmRhdGFzZXQudik7IHRoaXMuX3NlZyhiLmRhdGFzZXQudik7IH0pKTtcbiAgICBpMThuLmFwcGx5KGRvY3VtZW50KTtcbiAgfVxuXG4gIHNob3cobmFtZSkge1xuICAgIHRoaXMuc2NyZWVuID0gbmFtZTtcbiAgICBmb3IgKGNvbnN0IHMgb2YgU0NSRUVOUykgJChzKS5jbGFzc0xpc3QudG9nZ2xlKFwiaGlkZGVuXCIsIHMgIT09IG5hbWUpO1xuICB9XG4gIGh1ZChvbikgeyAkKFwiaHVkXCIpLmNsYXNzTGlzdC50b2dnbGUoXCJoaWRkZW5cIiwgIW9uKTsgfVxuICBzZXRIdWQobGV2ZWxOdW0sIGdvdCwgdG90YWwpIHtcbiAgICAkKFwiaHVkTGV2ZWxcIikudGV4dENvbnRlbnQgPSBsZXZlbE51bTtcbiAgICBjb25zdCBzbG90cyA9ICQoXCJodWRHZW1zXCIpLmNoaWxkcmVuO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc2xvdHMubGVuZ3RoOyBpKyspIHsgc2xvdHNbaV0uY2xhc3NMaXN0LnRvZ2dsZShcIm9uXCIsIGkgPCBnb3QpOyBzbG90c1tpXS5zdHlsZS5kaXNwbGF5ID0gaSA8IHRvdGFsID8gXCJcIiA6IFwibm9uZVwiOyB9XG4gIH1cbiAgc2V0VGhlbWUodGhlbWUpIHtcbiAgICBjb25zdCBhcHAgPSAkKFwiYXBwXCIpO1xuICAgIGFwcC5zdHlsZS5zZXRQcm9wZXJ0eShcIi0tYmcxXCIsIHRoZW1lLmJnWzBdKTsgYXBwLnN0eWxlLnNldFByb3BlcnR5KFwiLS1iZzJcIiwgdGhlbWUuYmdbMV0pO1xuICAgIGFwcC5jbGFzc0xpc3QudG9nZ2xlKFwiZGFya1wiLCAhIXRoZW1lLmRhcmspO1xuICB9XG5cbiAgaG9tZSh7IGxldmVsTnVtLCBzdGFycywgZ2VtcyB9KSB7XG4gICAgJChcInBsYXlMYWJlbFwiKS50ZXh0Q29udGVudCA9IGAke3RoaXMuaTE4bi50KFwibGV2ZWxcIil9ICR7bGV2ZWxOdW19YDtcbiAgICAkKFwiaG9tZVN0YXJzXCIpLnRleHRDb250ZW50ID0gc3RhcnM7ICQoXCJob21lR2Vtc1wiKS50ZXh0Q29udGVudCA9IGdlbXM7XG4gICAgdGhpcy5zaG93KFwic2NySG9tZVwiKTtcbiAgfVxuXG4gIHdpbih7IHN0YXJzLCB0aW1lLCBwYXIsIGdvdCwgdG90YWwsIGNhbkRvdWJsZSwgb25TdGFyIH0pIHtcbiAgICAkKFwid2luVGl0bGVcIikudGV4dENvbnRlbnQgPSB0aGlzLmkxOG4udChcIndpblwiICsgc3RhcnMpO1xuICAgICQoXCJ3aW5UaW1lXCIpLnRleHRDb250ZW50ID0gdGltZS50b0ZpeGVkKDEpICsgXCJzXCI7XG4gICAgJChcIndpblBhclwiKS50ZXh0Q29udGVudCA9IFwiLyBcIiArIHBhciArIFwic1wiO1xuICAgICQoXCJ3aW5UaW1lXCIpLnBhcmVudEVsZW1lbnQuY2xhc3NMaXN0LnRvZ2dsZShcIm9rXCIsIHRpbWUgPD0gcGFyKTtcbiAgICAkKFwid2luR2Vtc1wiKS50ZXh0Q29udGVudCA9IGAke2dvdH0vJHt0b3RhbH1gO1xuICAgICQoXCJ3aW5HZW1zXCIpLnBhcmVudEVsZW1lbnQuY2xhc3NMaXN0LnRvZ2dsZShcIm9rXCIsIGdvdCA9PT0gdG90YWwpO1xuICAgICQoXCJidG5Eb3VibGVcIikuY2xhc3NMaXN0LnRvZ2dsZShcImhpZGRlblwiLCAhY2FuRG91YmxlKTtcbiAgICAkKFwiYnRuRG91YmxlXCIpLmRpc2FibGVkID0gZmFsc2U7XG4gICAgY29uc3QgY2VsbHMgPSAkKFwid2luU3RhcnNcIikuY2hpbGRyZW47XG4gICAgdGhpcy5zdGFyVGltZXJzLmZvckVhY2goY2xlYXJUaW1lb3V0KTsgdGhpcy5zdGFyVGltZXJzID0gW107XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCAzOyBpKyspIHtcbiAgICAgIGNlbGxzW2ldLmNsYXNzTGlzdC5yZW1vdmUoXCJvblwiKTtcbiAgICAgIGlmIChpIDwgc3RhcnMpIHRoaXMuc3RhclRpbWVycy5wdXNoKHNldFRpbWVvdXQoKCkgPT4geyBjZWxsc1tpXS5jbGFzc0xpc3QuYWRkKFwib25cIik7IGlmIChvblN0YXIpIG9uU3RhcihpKTsgfSwgMjIwICsgaSAqIDI2MCkpO1xuICAgIH1cbiAgICB0aGlzLnNob3coXCJzY3JXaW5cIik7XG4gICAgJChcImJ0bk5leHRcIikuZm9jdXMoeyBwcmV2ZW50U2Nyb2xsOiB0cnVlIH0pO1xuICB9XG4gIHNldFdpbkdlbXModGV4dCkgeyAkKFwid2luR2Vtc1wiKS50ZXh0Q29udGVudCA9IHRleHQ7IH1cbiAgZG91YmxlRG9uZSgpIHsgJChcImJ0bkRvdWJsZVwiKS5jbGFzc0xpc3QuYWRkKFwiaGlkZGVuXCIpOyB9XG4gIGRvdWJsZUJ1c3koYikgeyAkKFwiYnRuRG91YmxlXCIpLmRpc2FibGVkID0gYjsgfVxuXG4gIG1hcCh7IHN0YXJzLCBtYXgsIGNvdW50LCBjdXJyZW50IH0pIHtcbiAgICBjb25zdCBncmlkID0gJChcIm1hcEdyaWRcIik7XG4gICAgZ3JpZC50ZXh0Q29udGVudCA9IFwiXCI7XG4gICAgbGV0IHRvdGFsID0gMDtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNvdW50OyBpKyspIHtcbiAgICAgIGNvbnN0IHN0ID0gc3RhcnNbaV0gfHwgMDsgdG90YWwgKz0gc3Q7XG4gICAgICBjb25zdCBiID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImJ1dHRvblwiKTtcbiAgICAgIGIudHlwZSA9IFwiYnV0dG9uXCI7XG4gICAgICBiLmNsYXNzTmFtZSA9IFwibHZsXCIgKyAoaSA+IG1heCA/IFwiIGxvY2tcIiA6IHN0ID8gXCIgZG9uZVwiIDogXCJcIikgKyAoaSA9PT0gY3VycmVudCA/IFwiIGN1clwiIDogXCJcIik7XG4gICAgICBiLnNldEF0dHJpYnV0ZShcImFyaWEtbGFiZWxcIiwgYCR7dGhpcy5pMThuLnQoXCJsZXZlbFwiKX0gJHtpICsgMX1gKTtcbiAgICAgIGNvbnN0IG51bSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpOyBudW0udGV4dENvbnRlbnQgPSBpICsgMTtcbiAgICAgIGNvbnN0IHJvdyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpOyByb3cuY2xhc3NOYW1lID0gXCJzXCI7XG4gICAgICBmb3IgKGxldCBrID0gMDsgayA8IDM7IGsrKykgeyBjb25zdCBzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImJcIik7IGlmIChrIDwgc3QpIHMuY2xhc3NOYW1lID0gXCJvblwiOyByb3cuYXBwZW5kQ2hpbGQocyk7IH1cbiAgICAgIGIuYXBwZW5kKG51bSwgcm93KTtcbiAgICAgIGlmIChpIDw9IG1heCkgYi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4geyB0aGlzLmguZ2VzdHVyZSgpOyB0aGlzLmgucGljayhpKTsgfSk7XG4gICAgICBncmlkLmFwcGVuZENoaWxkKGIpO1xuICAgIH1cbiAgICAkKFwibWFwU3RhcnNcIikudGV4dENvbnRlbnQgPSBgJHt0b3RhbH0vJHtjb3VudCAqIDN9YDtcbiAgICB0aGlzLnNob3coXCJzY3JNYXBcIik7XG4gIH1cblxuICBzZXR0aW5ncyhzZXQpIHtcbiAgICAkKFwib3B0TXVzaWNcIikuY2hlY2tlZCA9ICEhc2V0Lm11c2ljOyAkKFwib3B0U2Z4XCIpLmNoZWNrZWQgPSAhIXNldC5zZng7XG4gICAgdGhpcy5fc2VnKHNldC5jdGwpO1xuICAgIHRoaXMuc2hvdyhcInNjclNldHRpbmdzXCIpO1xuICB9XG4gIF9zZWcodikgeyAkKFwib3B0Q3RsXCIpLnF1ZXJ5U2VsZWN0b3JBbGwoXCJidXR0b25cIikuZm9yRWFjaCgoYikgPT4gYi5jbGFzc0xpc3QudG9nZ2xlKFwib25cIiwgYi5kYXRhc2V0LnYgPT09IHYpKTsgfVxuXG4gIC8qKiBIZWxwIG9mZmVyZWQgYWZ0ZXIgcmVwZWF0ZWQgZmFpbHVyZXMuICovXG4gIGFzc2lzdCh7IGhpbnQsIHNraXAsIHNraXBBZCB9KSB7XG4gICAgJChcImJ0bkhpbnRcIikuY2xhc3NMaXN0LnRvZ2dsZShcImhpZGRlblwiLCAhaGludCk7XG4gICAgJChcImJ0blNraXBcIikuY2xhc3NMaXN0LnRvZ2dsZShcImhpZGRlblwiLCAhc2tpcCk7XG4gICAgJChcInNraXBBZFwiKS5jbGFzc0xpc3QudG9nZ2xlKFwiaGlkZGVuXCIsICFza2lwQWQpO1xuICB9XG5cbiAgc2hvcCh7IG93bmVkLCBjdXJyZW50LCBnZW1zIH0pIHtcbiAgICBjb25zdCBncmlkID0gJChcInNob3BHcmlkXCIpO1xuICAgIGdyaWQudGV4dENvbnRlbnQgPSBcIlwiO1xuICAgICQoXCJzaG9wR2Vtc1wiKS50ZXh0Q29udGVudCA9IGdlbXM7XG4gICAgZm9yIChjb25zdCBzIG9mIFNLSU5TKSB7XG4gICAgICBjb25zdCBoYXMgPSBvd25lZC5pbmNsdWRlcyhzLmlkKSwgb24gPSBzLmlkID09PSBjdXJyZW50O1xuICAgICAgY29uc3QgYiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJidXR0b25cIik7XG4gICAgICBiLnR5cGUgPSBcImJ1dHRvblwiO1xuICAgICAgYi5jbGFzc05hbWUgPSBcInNraW5cIiArIChoYXMgPyBcIiBvd25lZFwiIDogXCJcIikgKyAob24gPyBcIiBvblwiIDogXCJcIikgKyAoIWhhcyAmJiBnZW1zIDwgcy5jb3N0ID8gXCIgcG9vclwiIDogXCJcIik7XG4gICAgICBiLnNldEF0dHJpYnV0ZShcImFyaWEtbGFiZWxcIiwgcy5pZCArIChoYXMgPyBcIlwiIDogXCIgXCIgKyBzLmNvc3QpKTtcbiAgICAgIGIuZGF0YXNldC5za2luID0gcy5pZDtcbiAgICAgIGNvbnN0IGJhbGwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTsgYmFsbC5jbGFzc05hbWUgPSBcImJhbGxcIjsgYmFsbC5zdHlsZS5iYWNrZ3JvdW5kID0gc2tpblN3YXRjaChzLmlkKTtcbiAgICAgIGNvbnN0IHRhZyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpOyB0YWcuY2xhc3NOYW1lID0gXCJwcmljZVwiO1xuICAgICAgdGFnLmlubmVySFRNTCA9IGhhcyA/IChvbiA/IENIRUNLIDogXCJcIikgOiBHRU0gKyBcIjxiPlwiICsgcy5jb3N0ICsgXCI8L2I+XCI7XG4gICAgICBiLmFwcGVuZChiYWxsLCB0YWcpO1xuICAgICAgYi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4geyB0aGlzLmguZ2VzdHVyZSgpOyB0aGlzLmgucGlja1NraW4ocy5pZCk7IH0pO1xuICAgICAgZ3JpZC5hcHBlbmRDaGlsZChiKTtcbiAgICB9XG4gICAgdGhpcy5zaG93KFwic2NyU2hvcFwiKTtcbiAgfVxuXG4gIC8qKiBraW5kOiBcInN3aXBlXCIgfCBcImZsaXBcIiB8IFwibm90ZVwiICovXG4gIHR1dG9yaWFsKGtpbmQsIHRleHQpIHtcbiAgICBjb25zdCBlbCA9ICQoXCJ0dXRcIik7XG4gICAgZWwuY2xhc3NOYW1lID0gXCJ0dXQgXCIgKyBraW5kO1xuICAgICQoXCJ0dXRUZXh0XCIpLnRleHRDb250ZW50ID0gdGV4dDtcbiAgfVxuICB0dXRvcmlhbE9mZigpIHsgJChcInR1dFwiKS5jbGFzc0xpc3QuYWRkKFwiaGlkZGVuXCIpOyB9XG5cbiAgdG9hc3QodGV4dCkge1xuICAgIGNvbnN0IGVsID0gJChcInRvYXN0XCIpO1xuICAgIGVsLnRleHRDb250ZW50ID0gdGV4dDsgZWwuY2xhc3NMaXN0LmFkZChcIm9uXCIpO1xuICAgIGNsZWFyVGltZW91dCh0aGlzLnRvYXN0VCk7XG4gICAgdGhpcy50b2FzdFQgPSBzZXRUaW1lb3V0KCgpID0+IGVsLmNsYXNzTGlzdC5yZW1vdmUoXCJvblwiKSwgMjIwMCk7XG4gIH1cbiAgcGF1c2VkKG9uKSB7ICQoXCJwYXVzZUJhZGdlXCIpLmNsYXNzTGlzdC50b2dnbGUoXCJoaWRkZW5cIiwgIW9uKTsgfVxuICBlcnJvcigpIHsgdGhpcy5odWQoZmFsc2UpOyB0aGlzLnNob3coXCJzY3JFcnJvclwiKTsgfVxufVxuIiwgIi8vIEFsbCBzb3VuZCBpcyBzeW50aGVzaXNlZCB3aXRoIFdlYkF1ZGlvIFx1MjAxNCBubyBhdWRpbyBmaWxlcywgbm90aGluZyB0byBsaWNlbnNlLCB0aW55IGJ1bmRsZS5cbi8vIE91dHB1dCBvYmV5cyB0aHJlZSBzd2l0Y2hlczogdGhlIGhvc3QgKHBsYXRmb3JtIG11dGUgXHUyMDE0IGFsd2F5cyB3aW5zKSwgbXVzaWMsIHNmeC5cblxuY29uc3QgTk9URSA9IChuKSA9PiA0NDAgKiBNYXRoLnBvdygyLCAobiAtIDY5KSAvIDEyKTsgICAgIC8vIG1pZGkgLT4gSHpcbi8vIGNob3JkIGxvb3BzIChtaWRpIHJvb3RzICsgaW50ZXJ2YWxzKSwgb25lIHBlciBtb29kXG5jb25zdCBNT09EUyA9IHtcbiAgYnJpZ2h0OiB7IGJwbTogMTA0LCBjaG9yZHM6IFtbNjAsIDY0LCA2N10sIFs1NywgNjAsIDY0XSwgWzUzLCA1NywgNjBdLCBbNTUsIDU5LCA2Ml1dLCBsZWFkOiBcInRyaWFuZ2xlXCIgfSwgICAvLyBDICBBbSBGICBHXG4gIHdhcm06ICAgeyBicG06IDk2LCAgY2hvcmRzOiBbWzYyLCA2NiwgNjldLCBbNTksIDYyLCA2Nl0sIFs1NSwgNTksIDYyXSwgWzU3LCA2MSwgNjRdXSwgbGVhZDogXCJ0cmlhbmdsZVwiIH0sICAgLy8gRCAgQm0gRyAgQVxuICBjb29sOiAgIHsgYnBtOiA5MiwgIGNob3JkczogW1s1NywgNjAsIDY0XSwgWzUzLCA1NywgNjBdLCBbNjAsIDY0LCA2N10sIFs1NSwgNTksIDYyXV0sIGxlYWQ6IFwic2luZVwiIH0sICAgICAgIC8vIEFtIEYgIEMgIEdcbiAgbmVvbjogICB7IGJwbTogMTEwLCBjaG9yZHM6IFtbNTcsIDYwLCA2NF0sIFs1MywgNTcsIDYwXSwgWzU1LCA1OCwgNjJdLCBbNTIsIDU1LCA1OV1dLCBsZWFkOiBcInNhd3Rvb3RoXCIgfSAgICAvLyBBbSBGICBHbSBFbVxufTtcbmNvbnN0IFRIRU1FX01PT0QgPSB7IG1lYWRvdzogXCJicmlnaHRcIiwgc3Vuc2V0OiBcIndhcm1cIiwgaWNlOiBcImNvb2xcIiwgZmFjdG9yeTogXCJ3YXJtXCIsIG5lb246IFwibmVvblwiIH07XG5cbmV4cG9ydCBjbGFzcyBHYW1lQXVkaW8ge1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICB0aGlzLmN0eCA9IG51bGw7IHRoaXMuaG9zdCA9IHRydWU7IHRoaXMubXVzaWNPbiA9IHRydWU7IHRoaXMuc2Z4T24gPSB0cnVlOyB0aGlzLnBhdXNlZCA9IGZhbHNlO1xuICAgIHRoaXMubW9vZCA9IFwiYnJpZ2h0XCI7IHRoaXMudGltZXIgPSBudWxsOyB0aGlzLnN0ZXAgPSAwOyB0aGlzLm5leHRUID0gMDsgdGhpcy5sYXN0SGl0ID0gMDsgdGhpcy53YW50TXVzaWMgPSBmYWxzZTtcbiAgfVxuXG4gIC8qKiBDcmVhdGUgLyByZXN1bWUgdGhlIGNvbnRleHQuIE11c3QgYmUgY2FsbGVkIGZyb20gYSB1c2VyIGdlc3R1cmUuICovXG4gIHVubG9jaygpIHtcbiAgICBpZiAoIXRoaXMuY3R4KSB7XG4gICAgICBjb25zdCBBQyA9IHdpbmRvdy5BdWRpb0NvbnRleHQgfHwgd2luZG93LndlYmtpdEF1ZGlvQ29udGV4dDtcbiAgICAgIGlmICghQUMpIHJldHVybjtcbiAgICAgIHRyeSB7IHRoaXMuY3R4ID0gbmV3IEFDKCk7IH0gY2F0Y2ggKF8pIHsgcmV0dXJuOyB9XG4gICAgICBjb25zdCBjID0gdGhpcy5jdHg7XG4gICAgICB0aGlzLm1hc3RlciA9IGMuY3JlYXRlR2FpbigpOyB0aGlzLm1hc3Rlci5jb25uZWN0KGMuZGVzdGluYXRpb24pO1xuICAgICAgdGhpcy5zZnggPSBjLmNyZWF0ZUdhaW4oKTsgdGhpcy5zZnguY29ubmVjdCh0aGlzLm1hc3Rlcik7XG4gICAgICB0aGlzLm11c2ljID0gYy5jcmVhdGVHYWluKCk7IHRoaXMubXVzaWMuY29ubmVjdCh0aGlzLm1hc3Rlcik7XG4gICAgICAvLyBzaGFyZWQgbm9pc2UgYnVmZmVyXG4gICAgICBjb25zdCBsZW4gPSBjLnNhbXBsZVJhdGUsIGJ1ZiA9IGMuY3JlYXRlQnVmZmVyKDEsIGxlbiwgYy5zYW1wbGVSYXRlKSwgZCA9IGJ1Zi5nZXRDaGFubmVsRGF0YSgwKTtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGVuOyBpKyspIGRbaV0gPSBNYXRoLnJhbmRvbSgpICogMiAtIDE7XG4gICAgICB0aGlzLm5vaXNlQnVmID0gYnVmO1xuICAgICAgLy8gcm9sbGluZyBydW1ibGU6IGxvb3Bpbmcgbm9pc2UgLT4gbG93cGFzcyAtPiBnYWluXG4gICAgICBjb25zdCBzcmMgPSBjLmNyZWF0ZUJ1ZmZlclNvdXJjZSgpOyBzcmMuYnVmZmVyID0gYnVmOyBzcmMubG9vcCA9IHRydWU7XG4gICAgICB0aGlzLnJvbGxGID0gYy5jcmVhdGVCaXF1YWRGaWx0ZXIoKTsgdGhpcy5yb2xsRi50eXBlID0gXCJsb3dwYXNzXCI7IHRoaXMucm9sbEYuZnJlcXVlbmN5LnZhbHVlID0gMjAwO1xuICAgICAgdGhpcy5yb2xsRyA9IGMuY3JlYXRlR2FpbigpOyB0aGlzLnJvbGxHLmdhaW4udmFsdWUgPSAwO1xuICAgICAgc3JjLmNvbm5lY3QodGhpcy5yb2xsRik7IHRoaXMucm9sbEYuY29ubmVjdCh0aGlzLnJvbGxHKTsgdGhpcy5yb2xsRy5jb25uZWN0KHRoaXMuc2Z4KTtcbiAgICAgIHNyYy5zdGFydCgpO1xuICAgIH1cbiAgICB0aGlzLl9hcHBseSgpO1xuICAgIGlmICh0aGlzLndhbnRNdXNpYykgdGhpcy5fc3RhcnRNdXNpYygpO1xuICB9XG5cbiAgX2FwcGx5KCkge1xuICAgIGlmICghdGhpcy5jdHgpIHJldHVybjtcbiAgICBjb25zdCBub3cgPSB0aGlzLmN0eC5jdXJyZW50VGltZTtcbiAgICB0aGlzLm1hc3Rlci5nYWluLnNldFRhcmdldEF0VGltZSh0aGlzLmhvc3QgPyAxIDogMCwgbm93LCAwLjAyKTtcbiAgICB0aGlzLnNmeC5nYWluLnNldFRhcmdldEF0VGltZSh0aGlzLnNmeE9uID8gMC45IDogMCwgbm93LCAwLjAyKTtcbiAgICB0aGlzLm11c2ljLmdhaW4uc2V0VGFyZ2V0QXRUaW1lKHRoaXMubXVzaWNPbiA/IDAuNSA6IDAsIG5vdywgMC4wNSk7XG4gICAgY29uc3QgcnVuID0gdGhpcy5ob3N0ICYmICF0aGlzLnBhdXNlZDtcbiAgICB0cnkgeyBpZiAocnVuICYmIHRoaXMuY3R4LnN0YXRlID09PSBcInN1c3BlbmRlZFwiKSB0aGlzLmN0eC5yZXN1bWUoKTsgZWxzZSBpZiAoIXJ1biAmJiB0aGlzLmN0eC5zdGF0ZSA9PT0gXCJydW5uaW5nXCIpIHRoaXMuY3R4LnN1c3BlbmQoKTsgfSBjYXRjaCAoXykgeyAvKiBub29wICovIH1cbiAgfVxuICBzZXRIb3N0KG9uKSB7IHRoaXMuaG9zdCA9ICEhb247IHRoaXMuX2FwcGx5KCk7IH1cbiAgc2V0TXVzaWMob24pIHsgdGhpcy5tdXNpY09uID0gISFvbjsgdGhpcy5fYXBwbHkoKTsgfVxuICBzZXRTZngob24pIHsgdGhpcy5zZnhPbiA9ICEhb247IHRoaXMuX2FwcGx5KCk7IH1cbiAgcGF1c2UoKSB7IHRoaXMucGF1c2VkID0gdHJ1ZTsgdGhpcy5fc3RvcFRpbWVyKCk7IHRoaXMuX2FwcGx5KCk7IH1cbiAgcmVzdW1lKCkgeyB0aGlzLnBhdXNlZCA9IGZhbHNlOyB0aGlzLl9hcHBseSgpOyBpZiAodGhpcy53YW50TXVzaWMpIHRoaXMuX3N0YXJ0TXVzaWMoKTsgfVxuXG4gIC8vIC0tLS0tLS0tLS0gcHJpbWl0aXZlcyAtLS0tLS0tLS0tXG4gIF90b25lKGZyZXEsIGR1ciwgdHlwZSwgdm9sLCBlbmRGcmVxLCBkZWxheSwgYnVzKSB7XG4gICAgY29uc3QgYyA9IHRoaXMuY3R4OyBpZiAoIWMgfHwgIXRoaXMuaG9zdCkgcmV0dXJuO1xuICAgIGNvbnN0IHQgPSBjLmN1cnJlbnRUaW1lICsgKGRlbGF5IHx8IDApLCBvID0gYy5jcmVhdGVPc2NpbGxhdG9yKCksIGcgPSBjLmNyZWF0ZUdhaW4oKTtcbiAgICBvLnR5cGUgPSB0eXBlIHx8IFwic2luZVwiOyBvLmZyZXF1ZW5jeS5zZXRWYWx1ZUF0VGltZShmcmVxLCB0KTtcbiAgICBpZiAoZW5kRnJlcSkgby5mcmVxdWVuY3kuZXhwb25lbnRpYWxSYW1wVG9WYWx1ZUF0VGltZShNYXRoLm1heCgzMCwgZW5kRnJlcSksIHQgKyBkdXIpO1xuICAgIGcuZ2Fpbi5zZXRWYWx1ZUF0VGltZSgwLjAwMDEsIHQpOyBnLmdhaW4uZXhwb25lbnRpYWxSYW1wVG9WYWx1ZUF0VGltZSh2b2wsIHQgKyAwLjAwNik7IGcuZ2Fpbi5leHBvbmVudGlhbFJhbXBUb1ZhbHVlQXRUaW1lKDAuMDAwNiwgdCArIGR1cik7XG4gICAgby5jb25uZWN0KGcpOyBnLmNvbm5lY3QoYnVzIHx8IHRoaXMuc2Z4KTsgby5zdGFydCh0KTsgby5zdG9wKHQgKyBkdXIgKyAwLjAyKTtcbiAgfVxuICBfbm9pc2UoZHVyLCB2b2wsIGZyZXEsIHR5cGUsIGRlbGF5KSB7XG4gICAgY29uc3QgYyA9IHRoaXMuY3R4OyBpZiAoIWMgfHwgIXRoaXMuaG9zdCkgcmV0dXJuO1xuICAgIGNvbnN0IHQgPSBjLmN1cnJlbnRUaW1lICsgKGRlbGF5IHx8IDApLCBzID0gYy5jcmVhdGVCdWZmZXJTb3VyY2UoKSwgZiA9IGMuY3JlYXRlQmlxdWFkRmlsdGVyKCksIGcgPSBjLmNyZWF0ZUdhaW4oKTtcbiAgICBzLmJ1ZmZlciA9IHRoaXMubm9pc2VCdWY7IGYudHlwZSA9IHR5cGUgfHwgXCJsb3dwYXNzXCI7IGYuZnJlcXVlbmN5LnZhbHVlID0gZnJlcTtcbiAgICBnLmdhaW4uc2V0VmFsdWVBdFRpbWUodm9sLCB0KTsgZy5nYWluLmV4cG9uZW50aWFsUmFtcFRvVmFsdWVBdFRpbWUoMC4wMDA2LCB0ICsgZHVyKTtcbiAgICBzLmNvbm5lY3QoZik7IGYuY29ubmVjdChnKTsgZy5jb25uZWN0KHRoaXMuc2Z4KTsgcy5zdGFydCh0LCBNYXRoLnJhbmRvbSgpICogMC41LCBkdXIgKyAwLjAyKTtcbiAgfVxuXG4gIC8vIC0tLS0tLS0tLS0gc291bmQgZWZmZWN0cyAtLS0tLS0tLS0tXG4gIGhpdCh2KSB7XG4gICAgaWYgKCF0aGlzLmN0eCkgcmV0dXJuO1xuICAgIGNvbnN0IG5vdyA9IHRoaXMuY3R4LmN1cnJlbnRUaW1lO1xuICAgIGlmIChub3cgLSB0aGlzLmxhc3RIaXQgPCAwLjA0NSkgcmV0dXJuO1xuICAgIHRoaXMubGFzdEhpdCA9IG5vdztcbiAgICBjb25zdCBrID0gTWF0aC5taW4oMSwgdiAvIDcwMCk7XG4gICAgdGhpcy5fdG9uZSgxMjAgKyBrICogNjAsIDAuMDksIFwic2luZVwiLCAwLjA1ICsgayAqIDAuMjIsIDU1KTtcbiAgICB0aGlzLl9ub2lzZSgwLjA1LCAwLjAzICsgayAqIDAuMSwgNzAwICsgayAqIDE1MDApO1xuICB9XG4gIGdlbShuKSB7IGNvbnN0IGYgPSBbNzg0LCA5ODgsIDExNzUsIDE1NjhdW01hdGgubWluKDMsIG4pXTsgdGhpcy5fdG9uZShmLCAwLjIyLCBcInNpbmVcIiwgMC4yLCBmICogMS4wMSk7IHRoaXMuX3RvbmUoZiAqIDIsIDAuMTYsIFwidHJpYW5nbGVcIiwgMC4wOCwgZiAqIDIuMDIsIDAuMDMpOyB9XG4gIHN0YXIoaSkgeyBjb25zdCBmID0gWzY1OSwgNzg0LCAxMDQ3XVtNYXRoLm1pbigyLCBpKV07IHRoaXMuX3RvbmUoZiwgMC4zLCBcInRyaWFuZ2xlXCIsIDAuMiwgZik7IHRoaXMuX3RvbmUoZiAqIDIsIDAuMiwgXCJzaW5lXCIsIDAuMDcsIGYgKiAyLCAwLjAyKTsgfVxuICB3aW4oKSB7IFs1MjMsIDY1OSwgNzg0LCAxMDQ3XS5mb3JFYWNoKChmLCBpKSA9PiB0aGlzLl90b25lKGYsIDAuMjYsIFwidHJpYW5nbGVcIiwgMC4xNywgZiAqIDEuMDEsIGkgKiAwLjA3NSkpOyB0aGlzLl9ub2lzZSgwLjUsIDAuMDUsIDUwMDAsIFwiaGlnaHBhc3NcIiwgMC4xKTsgfVxuICBkaWUoKSB7IHRoaXMuX3RvbmUoMjYwLCAwLjMyLCBcInNhd3Rvb3RoXCIsIDAuMTYsIDUwKTsgdGhpcy5fbm9pc2UoMC4yMiwgMC4yLCAxNDAwKTsgfVxuICBidW1wKCkgeyB0aGlzLl90b25lKDMzMCwgMC4xMiwgXCJ0cmlhbmdsZVwiLCAwLjIsIDY2MCk7IH1cbiAgcGFkKCkgeyB0aGlzLl90b25lKDIyMCwgMC4yLCBcInRyaWFuZ2xlXCIsIDAuMTgsIDc2MCk7IH1cbiAgc2hhdHRlcigpIHsgdGhpcy5fbm9pc2UoMC4zLCAwLjI1LCAzMjAwLCBcImhpZ2hwYXNzXCIpOyB0aGlzLl90b25lKDE1MDAsIDAuMTgsIFwic2luZVwiLCAwLjEsIDYwMCk7IHRoaXMuX3RvbmUoMjEwMCwgMC4xNCwgXCJzaW5lXCIsIDAuMDcsIDkwMCwgMC4wMyk7IH1cbiAgY2xpY2soKSB7IHRoaXMuX3RvbmUoNzAwLCAwLjA0LCBcInRyaWFuZ2xlXCIsIDAuMSwgNTAwKTsgfVxuICB3aG9vc2goKSB7IHRoaXMuX25vaXNlKDAuMjUsIDAuMDgsIDkwMCwgXCJiYW5kcGFzc1wiKTsgfVxuXG4gIC8qKiBSb2xsaW5nIHJ1bWJsZSBcdTIwMTQgY2FsbCBldmVyeSBmcmFtZS4gKi9cbiAgcm9sbChzcGVlZCwgdG91Y2hpbmcpIHtcbiAgICBpZiAoIXRoaXMuY3R4KSByZXR1cm47XG4gICAgY29uc3Qgbm93ID0gdGhpcy5jdHguY3VycmVudFRpbWUsIHYgPSB0b3VjaGluZyA/IE1hdGgubWluKDEsIHNwZWVkIC8gNTIwKSA6IDA7XG4gICAgdGhpcy5yb2xsRy5nYWluLnNldFRhcmdldEF0VGltZSh2ICogMC4xMSwgbm93LCAwLjA0KTtcbiAgICB0aGlzLnJvbGxGLmZyZXF1ZW5jeS5zZXRUYXJnZXRBdFRpbWUoMTUwICsgdiAqIDYyMCwgbm93LCAwLjA1KTtcbiAgfVxuXG4gIC8vIC0tLS0tLS0tLS0gbXVzaWM6IGEgc21hbGwgZ2VuZXJhdGl2ZSBsb29wIC0tLS0tLS0tLS1cbiAgcGxheU11c2ljKHRoZW1lKSB7XG4gICAgdGhpcy5tb29kID0gVEhFTUVfTU9PRFt0aGVtZV0gfHwgXCJicmlnaHRcIjtcbiAgICB0aGlzLndhbnRNdXNpYyA9IHRydWU7XG4gICAgaWYgKHRoaXMuY3R4KSB0aGlzLl9zdGFydE11c2ljKCk7XG4gIH1cbiAgc3RvcE11c2ljKCkgeyB0aGlzLndhbnRNdXNpYyA9IGZhbHNlOyB0aGlzLl9zdG9wVGltZXIoKTsgfVxuICBfc3RvcFRpbWVyKCkgeyBpZiAodGhpcy50aW1lcikgeyBjbGVhckludGVydmFsKHRoaXMudGltZXIpOyB0aGlzLnRpbWVyID0gbnVsbDsgfSB9XG4gIF9zdGFydE11c2ljKCkge1xuICAgIGlmICh0aGlzLnRpbWVyIHx8ICF0aGlzLmN0eCB8fCB0aGlzLnBhdXNlZCkgcmV0dXJuO1xuICAgIHRoaXMubmV4dFQgPSB0aGlzLmN0eC5jdXJyZW50VGltZSArIDAuMDg7XG4gICAgdGhpcy50aW1lciA9IHNldEludGVydmFsKCgpID0+IHRoaXMuX3NjaGVkdWxlKCksIDExMCk7XG4gIH1cbiAgX3NjaGVkdWxlKCkge1xuICAgIGNvbnN0IGMgPSB0aGlzLmN0eDsgaWYgKCFjIHx8IGMuc3RhdGUgIT09IFwicnVubmluZ1wiKSByZXR1cm47XG4gICAgY29uc3QgbSA9IE1PT0RTW3RoaXMubW9vZF0sIHNwYiA9IDYwIC8gbS5icG0gLyAyOyAgICAgICAgLy8gZWlnaHRoIG5vdGVzXG4gICAgd2hpbGUgKHRoaXMubmV4dFQgPCBjLmN1cnJlbnRUaW1lICsgMC4zKSB7XG4gICAgICBjb25zdCBzID0gdGhpcy5zdGVwLCBjaCA9IG0uY2hvcmRzWyhzID4+IDMpICUgbS5jaG9yZHMubGVuZ3RoXSwgdCA9IHRoaXMubmV4dFQgLSBjLmN1cnJlbnRUaW1lO1xuICAgICAgY29uc3QgYmVhdCA9IHMgJiA3O1xuICAgICAgaWYgKGJlYXQgPT09IDAgfHwgYmVhdCA9PT0gNCkgdGhpcy5fdG9uZShOT1RFKGNoWzBdIC0gMjQpLCBzcGIgKiAzLjIsIFwic2luZVwiLCAwLjIsIG51bGwsIHQsIHRoaXMubXVzaWMpO1xuICAgICAgaWYgKGJlYXQgPT09IDApIHsgdGhpcy5fdG9uZShOT1RFKGNoWzBdIC0gMTIpLCBzcGIgKiA3LjUsIFwic2luZVwiLCAwLjA0NSwgbnVsbCwgdCwgdGhpcy5tdXNpYyk7IHRoaXMuX3RvbmUoTk9URShjaFsyXSAtIDEyKSwgc3BiICogNy41LCBcInNpbmVcIiwgMC4wMzUsIG51bGwsIHQsIHRoaXMubXVzaWMpOyB9XG4gICAgICAvLyBhcnBlZ2dpbyB3aXRoIGEgbGl0dGxlIHZhcmlhdGlvbiBldmVyeSBvdGhlciBiYXJcbiAgICAgIGNvbnN0IHBhdCA9ICgocyA+PiAzKSAmIDEpID8gWzAsIDIsIDEsIDIsIDAsIDEsIDIsIDFdIDogWzAsIDEsIDIsIDEsIDAsIDIsIDEsIDJdO1xuICAgICAgaWYgKGJlYXQgIT09IDMgJiYgYmVhdCAhPT0gNykgdGhpcy5fdG9uZShOT1RFKGNoW3BhdFtiZWF0XV0gKyAxMiksIHNwYiAqIDAuOSwgbS5sZWFkLCBtLmxlYWQgPT09IFwic2F3dG9vdGhcIiA/IDAuMDM1IDogMC4wNzUsIG51bGwsIHQsIHRoaXMubXVzaWMpO1xuICAgICAgdGhpcy5zdGVwKys7IHRoaXMubmV4dFQgKz0gc3BiO1xuICAgIH1cbiAgfVxufVxuIiwgIi8vIExldmVsIGF1dGhvcmluZyArIGNvbXBpbGF0aW9uLlxuLy9cbi8vIEEgbGV2ZWwgaXMgYXV0aG9yZWQgb24gYSBzcXVhcmUgY2hhcmFjdGVyIGdyaWQgKGRlZmF1bHQgMjh4MjggY2VsbHMgb3ZlciB0aGVcbi8vIDQyMC11bml0IGFyZW5hLCBzbyBvbmUgY2VsbCA9IDE1IHVuaXRzKSB3aXRoIGEgc21hbGwgYnVpbGRlciBBUEksIHBsdXMgcG9pbnRzXG4vLyAoc3RhcnQgLyBnb2FsIC8gZ2VtcykgYW5kIHBhcmFtZXRyaWMgb2JqZWN0cyAobW92ZXJzLCBzYXdzKS5cbi8vIGNvbXBpbGUoKSB0dXJucyB0aGF0IGludG8gdGhlIGZsYXQgcHJpbWl0aXZlIGxpc3RzIHRoZSBzaW11bGF0aW9uIHJ1bnMgb24uXG4vL1xuLy8gR3JpZCBjaGFyYWN0ZXJzOlxuLy8gICAnIycgd2FsbCAgICc9JyBpY2Ugd2FsbCAgICdeJyBzcGlrZXMgICAnWCcgY3J5c3RhbCAgICdvJyBwZWcgICAnTycgYnVtcGVyXG4vLyAgICcvJyAnXFwnIGRpYWdvbmFsIHdhbGwgICAgICc8JyAnPicgJ0EnICdWJyBsYXVuY2ggcGFkcyAobGVmdC9yaWdodC91cC9kb3duKVxuaW1wb3J0IHsgSEFMRiwgS19CT1gsIEtfQ0lSQ0xFLCBLX0NBUFNVTEUgfSBmcm9tIFwiLi4vc2ltL3NpbS5qc1wiO1xuXG5leHBvcnQgY29uc3QgR1JJRCA9IDI4O1xuXG5leHBvcnQgY2xhc3MgQnVpbGRlciB7XG4gIGNvbnN0cnVjdG9yKG4gPSBHUklEKSB7XG4gICAgdGhpcy5uID0gbjtcbiAgICB0aGlzLmNlbGwgPSAoMiAqIEhBTEYpIC8gbjtcbiAgICB0aGlzLmcgPSBBcnJheS5mcm9tKHsgbGVuZ3RoOiBuIH0sICgpID0+IG5ldyBBcnJheShuKS5maWxsKFwiIFwiKSk7XG4gICAgdGhpcy5wdCA9IHsgc3RhcnQ6IG51bGwsIGdvYWw6IG51bGwsIGdlbXM6IFtdIH07XG4gICAgdGhpcy5vYmpzID0gW107XG4gIH1cbiAgLyoqIGdyaWQgY29sdW1uL3JvdyAobWF5IGJlIGZyYWN0aW9uYWwpIC0+IGFyZW5hIHVuaXRzOyAoMCwwKSBpcyB0aGUgY2VudHJlIG9mIHRoZSB0b3AtbGVmdCBjZWxsICovXG4gIFgoYykgeyByZXR1cm4gLUhBTEYgKyAoYyArIDAuNSkgKiB0aGlzLmNlbGw7IH1cbiAgWShyKSB7IHJldHVybiBIQUxGIC0gKHIgKyAwLjUpICogdGhpcy5jZWxsOyB9XG5cbiAgcHV0KGNoLCBjLCByKSB7IGlmIChjID49IDAgJiYgciA+PSAwICYmIGMgPCB0aGlzLm4gJiYgciA8IHRoaXMubikgdGhpcy5nW3JdW2NdID0gY2g7IHJldHVybiB0aGlzOyB9XG4gIGgociwgYzAsIGMxLCBjaCA9IFwiI1wiKSB7IGZvciAobGV0IGMgPSBNYXRoLm1pbihjMCwgYzEpOyBjIDw9IE1hdGgubWF4KGMwLCBjMSk7IGMrKykgdGhpcy5wdXQoY2gsIGMsIHIpOyByZXR1cm4gdGhpczsgfVxuICB2KGMsIHIwLCByMSwgY2ggPSBcIiNcIikgeyBmb3IgKGxldCByID0gTWF0aC5taW4ocjAsIHIxKTsgciA8PSBNYXRoLm1heChyMCwgcjEpOyByKyspIHRoaXMucHV0KGNoLCBjLCByKTsgcmV0dXJuIHRoaXM7IH1cbiAgYm94KGMwLCByMCwgYzEsIHIxLCBjaCA9IFwiI1wiKSB7IGZvciAobGV0IHIgPSBNYXRoLm1pbihyMCwgcjEpOyByIDw9IE1hdGgubWF4KHIwLCByMSk7IHIrKykgdGhpcy5oKHIsIGMwLCBjMSwgY2gpOyByZXR1cm4gdGhpczsgfVxuICBjbGVhcihjMCwgcjAsIGMxLCByMSkgeyByZXR1cm4gdGhpcy5ib3goYzAsIHIwLCBjMSwgcjEsIFwiIFwiKTsgfVxuICBmcmFtZShjaCA9IFwiI1wiKSB7IGNvbnN0IG0gPSB0aGlzLm4gLSAxOyByZXR1cm4gdGhpcy5oKDAsIDAsIG0sIGNoKS5oKG0sIDAsIG0sIGNoKS52KDAsIDAsIG0sIGNoKS52KG0sIDAsIG0sIGNoKTsgfVxuICAvKiogZGlhZ29uYWwgd2FsbCBmcm9tIGNlbGwgKGMwLHIwKSB0byAoYzEscjEpOyB8ZGN8IG11c3QgZXF1YWwgfGRyfCAqL1xuICBkaWFnKGMwLCByMCwgYzEsIHIxKSB7XG4gICAgY29uc3QgbiA9IE1hdGguYWJzKGMxIC0gYzApLCBzYyA9IE1hdGguc2lnbihjMSAtIGMwKSB8fCAxLCBzciA9IE1hdGguc2lnbihyMSAtIHIwKSB8fCAxO1xuICAgIGNvbnN0IGNoID0gc2MgKiBzciA8IDAgPyBcIi9cIiA6IFwiXFxcXFwiO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDw9IG47IGkrKykgdGhpcy5wdXQoY2gsIGMwICsgaSAqIHNjLCByMCArIGkgKiBzcik7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbiAgc3Bpa2VzKGMwLCByMCwgYzEsIHIxKSB7IHJldHVybiB0aGlzLmJveChjMCwgcjAsIGMxLCByMSwgXCJeXCIpOyB9XG4gIHN0YXJ0KGMsIHIpIHsgdGhpcy5wdC5zdGFydCA9IHsgeDogdGhpcy5YKGMpLCB5OiB0aGlzLlkocikgfTsgcmV0dXJuIHRoaXM7IH1cbiAgZ29hbChjLCByKSB7IHRoaXMucHQuZ29hbCA9IHsgeDogdGhpcy5YKGMpLCB5OiB0aGlzLlkocikgfTsgcmV0dXJuIHRoaXM7IH1cbiAgZ2VtKGMsIHIpIHsgdGhpcy5wdC5nZW1zLnB1c2goeyB4OiB0aGlzLlgoYyksIHk6IHRoaXMuWShyKSB9KTsgcmV0dXJuIHRoaXM7IH1cbiAgLyoqIG1vdmluZyBwbGF0Zm9ybTogY2VudHJlIGNlbGwgKGMsciksIHNpemUgdyB4IGggY2VsbHMsIHRyYXZlbCBcdTAwQjFhYyAvIFx1MDBCMWFyIGNlbGxzICovXG4gIG1vdmVyKGMsIHIsIHcsIGgsIGFjLCBhciwgc3BkID0gMS42LCBwaCA9IDApIHtcbiAgICB0aGlzLm9ianMucHVzaCh7IHQ6IFwibW92ZXJcIiwgY3g6IHRoaXMuWChjKSwgY3k6IHRoaXMuWShyKSwgaHc6ICh3ICogdGhpcy5jZWxsKSAvIDIsIGhoOiAoaCAqIHRoaXMuY2VsbCkgLyAyLCBheDogYWMgKiB0aGlzLmNlbGwsIGF5OiBhciAqIHRoaXMuY2VsbCwgc3BkLCBwaCB9KTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuICBzYXcoYywgciwgcmFkLCBhYywgYXIsIHNwZCA9IDEuOCwgcGggPSAwKSB7XG4gICAgdGhpcy5vYmpzLnB1c2goeyB0OiBcInNhd1wiLCBjeDogdGhpcy5YKGMpLCBjeTogdGhpcy5ZKHIpLCByOiByYWQsIGF4OiBhYyAqIHRoaXMuY2VsbCwgYXk6IGFyICogdGhpcy5jZWxsLCBzcGQsIHBoIH0pO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG4gIHJvd3MoKSB7IHJldHVybiB0aGlzLmcubWFwKChyb3cpID0+IHJvdy5qb2luKFwiXCIpKTsgfVxufVxuXG5mdW5jdGlvbiBtZXJnZVJ1bnMobWFzaywgbikge1xuICBjb25zdCByZWN0cyA9IFtdO1xuICBsZXQgb3BlbiA9IG5ldyBNYXAoKTtcbiAgZm9yIChsZXQgciA9IDA7IHIgPCBuOyByKyspIHtcbiAgICBjb25zdCBuZXh0ID0gbmV3IE1hcCgpO1xuICAgIGxldCBjID0gMDtcbiAgICB3aGlsZSAoYyA8IG4pIHtcbiAgICAgIGlmICghbWFza1tyICogbiArIGNdKSB7IGMrKzsgY29udGludWU7IH1cbiAgICAgIGxldCBjMSA9IGM7XG4gICAgICB3aGlsZSAoYzEgKyAxIDwgbiAmJiBtYXNrW3IgKiBuICsgYzEgKyAxXSkgYzErKztcbiAgICAgIGNvbnN0IGtleSA9IGMgKyBcIjpcIiArIGMxLCBwcmV2ID0gb3Blbi5nZXQoa2V5KTtcbiAgICAgIGlmIChwcmV2KSB7IHByZXYucjEgPSByOyBuZXh0LnNldChrZXksIHByZXYpOyB9XG4gICAgICBlbHNlIHsgY29uc3QgcmMgPSB7IGMwOiBjLCBjMSwgcjA6IHIsIHIxOiByIH07IHJlY3RzLnB1c2gocmMpOyBuZXh0LnNldChrZXksIHJjKTsgfVxuICAgICAgYyA9IGMxICsgMTtcbiAgICB9XG4gICAgb3BlbiA9IG5leHQ7XG4gIH1cbiAgcmV0dXJuIHJlY3RzO1xufVxuXG5jb25zdCBQQURfRElSID0geyBcIjxcIjogWy0xLCAwXSwgXCI+XCI6IFsxLCAwXSwgQTogWzAsIDFdLCBWOiBbMCwgLTFdIH07XG5cbi8qKlxuICogQ29tcGlsZSBhbiBhdXRob3JlZCBsZXZlbCBkZWZpbml0aW9uIGludG8gc2ltdWxhdGlvbiBwcmltaXRpdmVzLlxuICogZGVmOiB7IGlkLCBidWlsZChiKSB8IG1hcDogc3RyaW5nW10sIHRoZW1lPywgdHV0PywgZm9ybXM/LCBwYXI/IC4uLiB9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb21waWxlKGRlZikge1xuICBsZXQgYjtcbiAgaWYgKGRlZi5idWlsZCkgeyBiID0gbmV3IEJ1aWxkZXIoZGVmLmdyaWQgfHwgR1JJRCk7IGRlZi5idWlsZChiKTsgfVxuICBlbHNlIHtcbiAgICBiID0gbmV3IEJ1aWxkZXIoZGVmLm1hcC5sZW5ndGgpO1xuICAgIGRlZi5tYXAuZm9yRWFjaCgocm93LCByKSA9PiB7IGZvciAobGV0IGMgPSAwOyBjIDwgYi5uOyBjKyspIGIuZ1tyXVtjXSA9IHJvd1tjXSB8fCBcIiBcIjsgfSk7XG4gICAgaWYgKGRlZi5zdGFydCkgYi5zdGFydChkZWYuc3RhcnRbMF0sIGRlZi5zdGFydFsxXSk7XG4gICAgaWYgKGRlZi5nb2FsKSBiLmdvYWwoZGVmLmdvYWxbMF0sIGRlZi5nb2FsWzFdKTtcbiAgICAoZGVmLmdlbXMgfHwgW10pLmZvckVhY2goKGcpID0+IGIuZ2VtKGdbMF0sIGdbMV0pKTtcbiAgICAoZGVmLm9ianMgfHwgW10pLmZvckVhY2goKG8pID0+IGIub2Jqcy5wdXNoKG8pKTtcbiAgfVxuICBjb25zdCBuID0gYi5uLCBjZWxsID0gYi5jZWxsLCBnID0gYi5nO1xuICBjb25zdCBhdCA9IChjLCByKSA9PiAoYyA8IDAgfHwgciA8IDAgfHwgYyA+PSBuIHx8IHIgPj0gbiA/IFwiIFwiIDogZ1tyXVtjXSk7XG4gIGNvbnN0IG1hc2tPZiA9IChjaGFycykgPT4geyBjb25zdCBtID0gbmV3IFVpbnQ4QXJyYXkobiAqIG4pOyBmb3IgKGxldCByID0gMDsgciA8IG47IHIrKykgZm9yIChsZXQgYyA9IDA7IGMgPCBuOyBjKyspIGlmIChjaGFycy5pbmNsdWRlcyhnW3JdW2NdKSkgbVtyICogbiArIGNdID0gMTsgcmV0dXJuIG07IH07XG4gIGNvbnN0IHRvQm94ID0gKHJjLCBzaHJpbmsgPSAwKSA9PiAoe1xuICAgIGs6IEtfQk9YLFxuICAgIGN4OiAtSEFMRiArICgocmMuYzAgKyByYy5jMSArIDEpIC8gMikgKiBjZWxsLCBjeTogSEFMRiAtICgocmMucjAgKyByYy5yMSArIDEpIC8gMikgKiBjZWxsLFxuICAgIGh3OiAoKHJjLmMxIC0gcmMuYzAgKyAxKSAqIGNlbGwpIC8gMiAtIHNocmluaywgaGg6ICgocmMucjEgLSByYy5yMCArIDEpICogY2VsbCkgLyAyIC0gc2hyaW5rLFxuICAgIGM6IDEsIHM6IDAsIGU6IDEsIG11OiAxLCBraWNrOiAwLCByY1xuICB9KTtcbiAgY29uc3Qgc29saWRBdCA9IChjLCByKSA9PiBcIiM9WFwiLmluY2x1ZGVzKGF0KGMsIHIpKTtcblxuICBjb25zdCBzb2xpZHMgPSBbXSwga2lsbHMgPSBbXSwgY3J5c3RhbHMgPSBbXSwgcGFkcyA9IFtdLCBtb3ZlcnMgPSBbXSwgc2F3cyA9IFtdO1xuXG4gIGZvciAoY29uc3QgcmMgb2YgbWVyZ2VSdW5zKG1hc2tPZihcIiNcIiksIG4pKSB7XG4gICAgY29uc3QgcyA9IHRvQm94KHJjKTtcbiAgICBzLm91dGVyID0gcmMuYzAgPT09IDAgfHwgcmMucjAgPT09IDAgfHwgcmMuYzEgPT09IG4gLSAxIHx8IHJjLnIxID09PSBuIC0gMTtcbiAgICBzb2xpZHMucHVzaChzKTtcbiAgfVxuICBmb3IgKGNvbnN0IHJjIG9mIG1lcmdlUnVucyhtYXNrT2YoXCI9XCIpLCBuKSkgeyBjb25zdCBzID0gdG9Cb3gocmMpOyBzLm11ID0gMDsgcy5pY2UgPSB0cnVlOyBzb2xpZHMucHVzaChzKTsgfVxuICBmb3IgKGNvbnN0IHJjIG9mIG1lcmdlUnVucyhtYXNrT2YoXCJYXCIpLCBuKSkgY3J5c3RhbHMucHVzaCh0b0JveChyYykpO1xuXG4gIC8vIHNwaWtlczogcmVtZW1iZXIgd2hpY2ggd2F5IHRoZXkgcG9pbnQgKGF3YXkgZnJvbSB0aGUgd2FsbCB0aGV5IHNpdCBvbilcbiAgZm9yIChjb25zdCByYyBvZiBtZXJnZVJ1bnMobWFza09mKFwiXlwiKSwgbikpIHtcbiAgICBjb25zdCBrID0gdG9Cb3gocmMsIDEuNSk7XG4gICAgbGV0IHVwID0gMCwgZG93biA9IDAsIGxlZnQgPSAwLCByaWdodCA9IDA7XG4gICAgZm9yIChsZXQgYyA9IHJjLmMwOyBjIDw9IHJjLmMxOyBjKyspIHsgaWYgKHNvbGlkQXQoYywgcmMucjAgLSAxKSkgdXArKzsgaWYgKHNvbGlkQXQoYywgcmMucjEgKyAxKSkgZG93bisrOyB9XG4gICAgZm9yIChsZXQgciA9IHJjLnIwOyByIDw9IHJjLnIxOyByKyspIHsgaWYgKHNvbGlkQXQocmMuYzAgLSAxLCByKSkgbGVmdCsrOyBpZiAoc29saWRBdChyYy5jMSArIDEsIHIpKSByaWdodCsrOyB9XG4gICAgY29uc3QgYmVzdCA9IE1hdGgubWF4KHVwLCBkb3duLCBsZWZ0LCByaWdodCk7XG4gICAgLy8gZGlyOiB1bml0IHZlY3RvciB0aGUgc3Bpa2VzIHBvaW50IGFsb25nIChhcmVuYSBjb29yZHMpLCBvciAoMCwwKSBmb3IgZmxvb3Igc3Bpa2VzXG4gICAgay5keCA9IDA7IGsuZHkgPSAwO1xuICAgIGlmIChiZXN0ID4gMCkge1xuICAgICAgaWYgKGJlc3QgPT09IGRvd24pIGsuZHkgPSAxOyBlbHNlIGlmIChiZXN0ID09PSB1cCkgay5keSA9IC0xOyBlbHNlIGlmIChiZXN0ID09PSBsZWZ0KSBrLmR4ID0gMTsgZWxzZSBrLmR4ID0gLTE7XG4gICAgfVxuICAgIGtpbGxzLnB1c2goayk7XG4gIH1cblxuICBmb3IgKGNvbnN0IGNoIG9mIE9iamVjdC5rZXlzKFBBRF9ESVIpKSB7XG4gICAgZm9yIChjb25zdCByYyBvZiBtZXJnZVJ1bnMobWFza09mKGNoKSwgbikpIHtcbiAgICAgIGNvbnN0IHAgPSB0b0JveChyYyk7XG4gICAgICBwLmR4ID0gUEFEX0RJUltjaF1bMF07IHAuZHkgPSBQQURfRElSW2NoXVsxXTsgcC5wb3dlciA9IDUyMDtcbiAgICAgIHBhZHMucHVzaChwKTtcbiAgICB9XG4gIH1cblxuICAvLyBkaWFnb25hbHMgLT4gY2Fwc3VsZXMgYWxvbmcgdGhlIHJ1blxuICBjb25zdCBzZWVuID0gbmV3IFVpbnQ4QXJyYXkobiAqIG4pO1xuICBmb3IgKGxldCByID0gMDsgciA8IG47IHIrKykgZm9yIChsZXQgYyA9IDA7IGMgPCBuOyBjKyspIHtcbiAgICBjb25zdCBjaCA9IGdbcl1bY107XG4gICAgaWYgKChjaCAhPT0gXCIvXCIgJiYgY2ggIT09IFwiXFxcXFwiKSB8fCBzZWVuW3IgKiBuICsgY10pIGNvbnRpbnVlO1xuICAgIGNvbnN0IGRyID0gY2ggPT09IFwiL1wiID8gLTEgOiAxOyAgICAgLy8gbW92aW5nIHJpZ2h0LCAnLycgZ29lcyB1cCAocm93IGRlY3JlYXNlcylcbiAgICBsZXQgYzAgPSBjLCByMCA9IHI7ICAgICAgICAgICAgICAgICAvLyB3YWxrIGJhY2sgdG8gdGhlIGxlZnQgZW5kIG9mIHRoZSBydW5cbiAgICB3aGlsZSAoYXQoYzAgLSAxLCByMCAtIGRyKSA9PT0gY2gpIHsgYzAtLTsgcjAgLT0gZHI7IH1cbiAgICBsZXQgbGVuID0gMDtcbiAgICB3aGlsZSAoYXQoYzAgKyBsZW4sIHIwICsgbGVuICogZHIpID09PSBjaCkgeyBzZWVuWyhyMCArIGxlbiAqIGRyKSAqIG4gKyBjMCArIGxlbl0gPSAxOyBsZW4rKzsgfVxuICAgIGNvbnN0IHhhID0gLUhBTEYgKyBjMCAqIGNlbGwsIHhiID0gLUhBTEYgKyAoYzAgKyBsZW4pICogY2VsbDtcbiAgICBjb25zdCB5YSA9IGNoID09PSBcIi9cIiA/IEhBTEYgLSAocjAgKyAxKSAqIGNlbGwgOiBIQUxGIC0gcjAgKiBjZWxsO1xuICAgIGNvbnN0IHliID0gY2ggPT09IFwiL1wiID8geWEgKyBsZW4gKiBjZWxsIDogeWEgLSBsZW4gKiBjZWxsO1xuICAgIHNvbGlkcy5wdXNoKHsgazogS19DQVBTVUxFLCBheDogeGEsIGF5OiB5YSwgYng6IHhiLCBieTogeWIsIHI6IDYsIGN4OiAoeGEgKyB4YikgLyAyLCBjeTogKHlhICsgeWIpIC8gMiwgZTogMSwgbXU6IDEsIGtpY2s6IDAgfSk7XG4gIH1cblxuICBmb3IgKGxldCByID0gMDsgciA8IG47IHIrKykgZm9yIChsZXQgYyA9IDA7IGMgPCBuOyBjKyspIHtcbiAgICBjb25zdCBjaCA9IGdbcl1bY107XG4gICAgaWYgKGNoID09PSBcIm9cIikgc29saWRzLnB1c2goeyBrOiBLX0NJUkNMRSwgY3g6IGIuWChjKSwgY3k6IGIuWShyKSwgcjogNywgZTogMSwgbXU6IDEsIGtpY2s6IDAgfSk7XG4gICAgZWxzZSBpZiAoY2ggPT09IFwiT1wiKSBzb2xpZHMucHVzaCh7IGs6IEtfQ0lSQ0xFLCBjeDogYi5YKGMpLCBjeTogYi5ZKHIpLCByOiAxMywgZTogMywgbXU6IDAsIGtpY2s6IDI0MCwgYnVtcGVyOiB0cnVlIH0pO1xuICB9XG5cbiAgZm9yIChjb25zdCBvIG9mIGIub2Jqcykge1xuICAgIGlmIChvLnQgPT09IFwibW92ZXJcIikge1xuICAgICAgbW92ZXJzLnB1c2goeyAuLi5vLCBib3g6IHsgazogS19CT1gsIGN4OiBvLmN4LCBjeTogby5jeSwgaHc6IG8uaHcsIGhoOiBvLmhoLCBjOiAxLCBzOiAwLCBlOiAxLCBtdTogMSwga2ljazogMCB9IH0pO1xuICAgIH0gZWxzZSBpZiAoby50ID09PSBcInNhd1wiKSBzYXdzLnB1c2goeyAuLi5vIH0pO1xuICB9XG5cbiAgaWYgKCFiLnB0LnN0YXJ0IHx8ICFiLnB0LmdvYWwpIHRocm93IG5ldyBFcnJvcihgbGV2ZWwgJHtkZWYuaWR9OiBzdGFydCBhbmQgZ29hbCBhcmUgcmVxdWlyZWRgKTtcblxuICAvLyBpcyB0aGUgYm9yZGVyIHJpbmcgb3BlbiBhbnl3aGVyZT8gKHRoZW4gdGhlIGJhbGwgY2FuIGZhbGwgb3V0IG9mIHRoZSB3b3JsZClcbiAgbGV0IG9wZW4gPSBmYWxzZTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBuOyBpKyspIGlmICghc29saWRBdChpLCAwKSB8fCAhc29saWRBdChpLCBuIC0gMSkgfHwgIXNvbGlkQXQoMCwgaSkgfHwgIXNvbGlkQXQobiAtIDEsIGkpKSBvcGVuID0gdHJ1ZTtcblxuICBjb25zdCBsZXZlbCA9IHtcbiAgICBpZDogZGVmLmlkLCBuYW1lOiBkZWYubmFtZSB8fCBcIlwiLCB0aGVtZTogZGVmLnRoZW1lIHx8IFwibWVhZG93XCIsIHR1dDogZGVmLnR1dCB8fCBudWxsLFxuICAgIGZvcm1zOiBkZWYuZm9ybXMgfHwgW1wiYmFsbFwiXSwgcGFyOiBkZWYucGFyIHx8IDAsIGhhbGY6IEhBTEYsIGNlbGwsIG4sIG9wZW4sXG4gICAgc3RhcnQ6IGIucHQuc3RhcnQsIGdvYWw6IHsgeDogYi5wdC5nb2FsLngsIHk6IGIucHQuZ29hbC55LCByOiAxNiB9LFxuICAgIGdlbXM6IGIucHQuZ2Vtcywgc29saWRzLCBraWxscywgY3J5c3RhbHMsIHBhZHMsIG1vdmVycywgc2F3cyxcbiAgICByb3dzOiBiLnJvd3MoKVxuICB9O1xuICBsZXZlbC5ncmlkID0gYnVpbGRHcmlkKGxldmVsKTtcbiAgcmV0dXJuIGxldmVsO1xufVxuXG4vKiogQnJvYWRwaGFzZTogZm9yIGVhY2ggY29hcnNlIGNlbGwsIHRoZSBzdGF0aWMgc29saWRzIHRoYXQgY2FuIHRvdWNoIGEgYmFsbCBjZW50cmVkIGluIGl0LiAqL1xuZnVuY3Rpb24gYnVpbGRHcmlkKEwpIHtcbiAgY29uc3QgY2VsbFNpemUgPSAzMCwgbWFyZ2luID0gMzA7XG4gIGNvbnN0IG1pbiA9IC1MLmhhbGYgLSA5MCwgc3BhbiA9IDIgKiAoTC5oYWxmICsgOTApO1xuICBjb25zdCBuID0gTWF0aC5jZWlsKHNwYW4gLyBjZWxsU2l6ZSk7XG4gIGNvbnN0IGJ1Y2tldHMgPSBBcnJheS5mcm9tKHsgbGVuZ3RoOiBuICogbiB9LCAoKSA9PiBbXSk7XG4gIEwuc29saWRzLmZvckVhY2goKHMsIGlkeCkgPT4ge1xuICAgIGxldCB4MCwgeDEsIHkwLCB5MTtcbiAgICBpZiAocy5rID09PSBLX0JPWCkge1xuICAgICAgY29uc3QgZXggPSBNYXRoLmFicyhzLmh3ICogcy5jKSArIE1hdGguYWJzKHMuaGggKiBzLnMpLCBleSA9IE1hdGguYWJzKHMuaHcgKiBzLnMpICsgTWF0aC5hYnMocy5oaCAqIHMuYyk7XG4gICAgICB4MCA9IHMuY3ggLSBleDsgeDEgPSBzLmN4ICsgZXg7IHkwID0gcy5jeSAtIGV5OyB5MSA9IHMuY3kgKyBleTtcbiAgICB9IGVsc2UgaWYgKHMuayA9PT0gS19DSVJDTEUpIHsgeDAgPSBzLmN4IC0gcy5yOyB4MSA9IHMuY3ggKyBzLnI7IHkwID0gcy5jeSAtIHMucjsgeTEgPSBzLmN5ICsgcy5yOyB9XG4gICAgZWxzZSB7IHgwID0gTWF0aC5taW4ocy5heCwgcy5ieCkgLSBzLnI7IHgxID0gTWF0aC5tYXgocy5heCwgcy5ieCkgKyBzLnI7IHkwID0gTWF0aC5taW4ocy5heSwgcy5ieSkgLSBzLnI7IHkxID0gTWF0aC5tYXgocy5heSwgcy5ieSkgKyBzLnI7IH1cbiAgICBjb25zdCBpMCA9IE1hdGgubWF4KDAsIE1hdGguZmxvb3IoKHgwIC0gbWFyZ2luIC0gbWluKSAvIGNlbGxTaXplKSksIGkxID0gTWF0aC5taW4obiAtIDEsIE1hdGguZmxvb3IoKHgxICsgbWFyZ2luIC0gbWluKSAvIGNlbGxTaXplKSk7XG4gICAgY29uc3QgajAgPSBNYXRoLm1heCgwLCBNYXRoLmZsb29yKCh5MCAtIG1hcmdpbiAtIG1pbikgLyBjZWxsU2l6ZSkpLCBqMSA9IE1hdGgubWluKG4gLSAxLCBNYXRoLmZsb29yKCh5MSArIG1hcmdpbiAtIG1pbikgLyBjZWxsU2l6ZSkpO1xuICAgIGZvciAobGV0IGogPSBqMDsgaiA8PSBqMTsgaisrKSBmb3IgKGxldCBpID0gaTA7IGkgPD0gaTE7IGkrKykgYnVja2V0c1tqICogbiArIGldLnB1c2goaWR4KTtcbiAgfSk7XG4gIHJldHVybiB7IG1pbiwgY2VsbDogY2VsbFNpemUsIG4sIGxpc3RzOiBidWNrZXRzLm1hcCgoYikgPT4gSW50MTZBcnJheS5mcm9tKGIpKSB9O1xufVxuXG4vKiogQVNDSUkgcGljdHVyZSBvZiBhIGNvbXBpbGVkIGxldmVsIChhdXRob3JpbmcgYWlkKS4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhc2NpaShsZXZlbCkge1xuICBjb25zdCByb3dzID0gbGV2ZWwucm93cy5tYXAoKHIpID0+IHIuc3BsaXQoXCJcIikpO1xuICBjb25zdCBtYXJrID0gKHAsIGNoKSA9PiB7XG4gICAgY29uc3QgYyA9IE1hdGgucm91bmQoKHAueCArIEhBTEYpIC8gbGV2ZWwuY2VsbCAtIDAuNSksIHIgPSBNYXRoLnJvdW5kKChIQUxGIC0gcC55KSAvIGxldmVsLmNlbGwgLSAwLjUpO1xuICAgIGlmIChyb3dzW3JdICYmIHJvd3Nbcl1bY10gIT09IHVuZGVmaW5lZCkgcm93c1tyXVtjXSA9IGNoO1xuICB9O1xuICBsZXZlbC5nZW1zLmZvckVhY2goKGcpID0+IG1hcmsoZywgXCIqXCIpKTtcbiAgbWFyayhsZXZlbC5zdGFydCwgXCJTXCIpOyBtYXJrKGxldmVsLmdvYWwsIFwiR1wiKTtcbiAgZm9yIChjb25zdCBtIG9mIGxldmVsLm1vdmVycykgbWFyayh7IHg6IG0uY3gsIHk6IG0uY3kgfSwgXCJtXCIpO1xuICBmb3IgKGNvbnN0IHMgb2YgbGV2ZWwuc2F3cykgbWFyayh7IHg6IHMuY3gsIHk6IHMuY3kgfSwgXCJzXCIpO1xuICByZXR1cm4gcm93cy5tYXAoKHIpID0+IHIuam9pbihcIlwiKSkuam9pbihcIlxcblwiKTtcbn1cbiIsICIvLyBXb3JsZCAxIFx1MjAxNCBcIk1lYWRvd1wiLiBUZWFjaGVzIHRoZSBjb3JlIHZlcmI6IHR1cm4gdGhlIHdvcmxkLCB0aGUgYmFsbCBmb2xsb3dzIGdyYXZpdHkuXG4vLyBTdGF0aWMgZ2VvbWV0cnkgb25seTogd2FsbHMsIHNsb3BlcywgZ2Vtcywgc3Bpa2VzLCBwZWdzLCBidW1wZXJzLCBvcGVuIGVkZ2VzLlxuLy8gR3JpZCBpcyAyOHgyOCAoY29scy9yb3dzIDAuLjI3LCBmcmFtZSBvbiAwIGFuZCAyNykuIEEgYmFsbCByZXN0aW5nIG9uIGEgd2FsbCBpbiByb3cgUlxuLy8gaGFzIGl0cyBjZW50cmUgYXQgcm93IFItMS40LlxuXG5leHBvcnQgY29uc3QgV09STEQxID0gW1xuICB7IC8vIEZpcnN0IHRpbHQ6IHJvbGwgb2ZmIHRoZSBzaGVsZiwgbGFuZCBieSB0aGUgZ29hbC5cbiAgICBpZDogXCIxLTFcIiwgdHV0OiBcImRyYWdcIixcbiAgICBidWlsZChiKSB7XG4gICAgICBiLmZyYW1lKCk7XG4gICAgICBiLmgoMTIsIDEsIDE4KTtcbiAgICAgIGIuc3RhcnQoNCwgMTAuNikuZ29hbCgyNS42LCAyNS42KTtcbiAgICAgIGIuZ2VtKDksIDEwLjYpLmdlbSgxNCwgMTAuNikuZ2VtKDI1LjYsIDIyKTtcbiAgICB9XG4gIH0sXG4gIHsgLy8gVGhlIG90aGVyIHdheSwgdGhlbiBiYWNrLlxuICAgIGlkOiBcIjEtMlwiLCB0dXQ6IFwiYm90aFwiLFxuICAgIGJ1aWxkKGIpIHtcbiAgICAgIGIuZnJhbWUoKTtcbiAgICAgIGIuaCgxMiwgOSwgMjYpO1xuICAgICAgYi5zdGFydCgyMywgMTAuNikuZ29hbCgyNS42LCAyNS42KTtcbiAgICAgIGIuZ2VtKDE1LCAxMC42KS5nZW0oMS40LCAyMCkuZ2VtKDEzLCAyNS42KTtcbiAgICB9XG4gIH0sXG4gIHsgLy8gWmlnemFnLlxuICAgIGlkOiBcIjEtM1wiLFxuICAgIGJ1aWxkKGIpIHtcbiAgICAgIGIuZnJhbWUoKTtcbiAgICAgIGIuaCg4LCAxLCAxOSkuaCgxNSwgOCwgMjYpLmgoMjIsIDEsIDE5KTtcbiAgICAgIGIuc3RhcnQoMywgNi42KS5nb2FsKDI1LjYsIDI1LjYpO1xuICAgICAgYi5nZW0oMTIsIDYuNikuZ2VtKDEzLCAxMy42KS5nZW0oMTAsIDIwLjYpO1xuICAgIH1cbiAgfSxcbiAgeyAvLyBGaXJzdCBzcGlrZXM6IHRoZSBicmlkZ2UgaXMgc2FmZSwgdGhlIGZsb29yIHVuZGVyIGl0IGlzIG5vdC5cbiAgICBpZDogXCIxLTRcIiwgdHV0OiBcInNwaWtlc1wiLFxuICAgIGJ1aWxkKGIpIHtcbiAgICAgIGIuZnJhbWUoKTtcbiAgICAgIGIuaCgxMCwgMSwgMTApO1xuICAgICAgYi5oKDE3LCA5LCAxOSk7XG4gICAgICBiLnNwaWtlcyg2LCAyNiwgMTcsIDI2KTtcbiAgICAgIGIuc3RhcnQoNywgOC42KS5nb2FsKDI1LjYsIDI1LjYpO1xuICAgICAgYi5nZW0oMywgOC42KS5nZW0oMTQsIDE1LjYpLmdlbSgyMiwgMjEpO1xuICAgIH1cbiAgfSxcbiAgeyAvLyBVcHNpZGUgZG93bjogYSBoYWxmIHR1cm4gbWFrZXMgdGhlIGNlaWxpbmcgdGhlIGZsb29yLlxuICAgIGlkOiBcIjEtNVwiLCB0dXQ6IFwiZmxpcFwiLFxuICAgIGJ1aWxkKGIpIHtcbiAgICAgIGIuZnJhbWUoKTtcbiAgICAgIGIuaCgxMywgMSwgMjApO1xuICAgICAgYi5zdGFydCg0LCAyNS42KS5nb2FsKDEuNCwgMS40KTtcbiAgICAgIGIuZ2VtKDEyLCAxNC40KS5nZW0oMjMuNSwgMTMpLmdlbSgxMywgMS40KTtcbiAgICB9XG4gIH0sXG4gIHsgLy8gUG91cjogdGlwIHRoZSBiYWxsIG91dCBvZiBvbmUgY3VwIGFuZCBkcm9wIGl0IGludG8gdGhlIG90aGVyLlxuICAgIGlkOiBcIjEtNlwiLFxuICAgIGJ1aWxkKGIpIHtcbiAgICAgIGIuZnJhbWUoKTtcbiAgICAgIGIudig1LCAxMiwgMTkpLmgoMTksIDUsIDExKS52KDExLCAxMiwgMTkpO1xuICAgICAgYi52KDE4LCAxMywgMjApLmgoMjAsIDE4LCAyMikudigyMiwgMTMsIDIwKTsgICAgICAgICAgLy8gc251ZyBjdXA6IHRoZSBiYWxsIGNhbiBvbmx5IHJlc3Qgb24gdGhlIGdvYWxcbiAgICAgIGIuZGlhZygxNSwgMTAsIDE3LCAxMikuZGlhZygyMywgMTIsIDI2LCA5KTtcbiAgICAgIGIuc3RhcnQoOCwgMTcuNikuZ29hbCgyMCwgMTguNik7XG4gICAgICBiLmdlbSg4LCA5KS5nZW0oMTQsIDEuNCkuZ2VtKDIwLCAxMCk7XG4gICAgfVxuICB9LFxuICB7IC8vIFN0ZXBzOiBnZW50bGUgdGlsdHMgXHUyMDE0IHRvbyBmYXN0IGFuZCB5b3Ugb3ZlcnNob290IG9udG8gdGhlIHNwaWtlcy5cbiAgICBpZDogXCIxLTdcIixcbiAgICBidWlsZChiKSB7XG4gICAgICBiLmZyYW1lKCk7XG4gICAgICBiLmgoNywgMSwgNykuaCgxMiwgOSwgMTQpLmgoMTcsIDE2LCAyMSk7XG4gICAgICBiLnNwaWtlcygxLCAyNiwgMjAsIDI2KTtcbiAgICAgIGIuc3RhcnQoMywgNS42KS5nb2FsKDI1LjYsIDI1LjYpO1xuICAgICAgYi5nZW0oMTEuNSwgMTAuNikuZ2VtKDE4LjUsIDE1LjYpLmdlbSgyNCwgMjApO1xuICAgIH1cbiAgfSxcbiAgeyAvLyBGb3JrOiB0aGUgc2FmZSB3YXkgZG93biwgb3IgdGhlIHJpc2t5IHNpZGUgZm9yIGdlbXMuXG4gICAgaWQ6IFwiMS04XCIsXG4gICAgYnVpbGQoYikge1xuICAgICAgYi5mcmFtZSgpO1xuICAgICAgYi5oKDcsIDEsIDEyKTtcbiAgICAgIGIuYm94KDEzLCAxMSwgMTQsIDIyKTtcbiAgICAgIGIuaCgxOCwgMTgsIDI2KTtcbiAgICAgIGIuc3Bpa2VzKDIxLCAyNiwgMjYsIDI2KTtcbiAgICAgIGIuc3RhcnQoNCwgNS42KS5nb2FsKDEuNCwgMjUuNik7XG4gICAgICBiLmdlbSgyMiwgMTYuNikuZ2VtKDE2LjUsIDI1LjYpLmdlbSg5LCA1LjYpO1xuICAgIH1cbiAgfSxcbiAgeyAvLyBPcGVuIGVkZ2U6IHRoZXJlIGlzIGEgaG9sZSBpbiB0aGUgZmxvb3IuIEdvIG92ZXIgdGhlIHRvcC5cbiAgICBpZDogXCIxLTlcIiwgdHV0OiBcImVkZ2VcIixcbiAgICBidWlsZChiKSB7XG4gICAgICBiLmZyYW1lKCk7XG4gICAgICBiLmNsZWFyKDExLCAyNywgMTYsIDI3KTtcbiAgICAgIGIuaCgxNCwgOCwgMTkpO1xuICAgICAgYi5zdGFydCgzLCAyNS42KS5nb2FsKDI1LjYsIDI1LjYpO1xuICAgICAgYi5nZW0oNiwgMS40KS5nZW0oMTMuNSwgMTIuNikuZ2VtKDIxLCAxOSk7XG4gICAgfVxuICB9LFxuICB7IC8vIFNwaXJhbDoga2VlcCB0dXJuaW5nLlxuICAgIGlkOiBcIjEtMTBcIixcbiAgICBidWlsZChiKSB7XG4gICAgICBiLmZyYW1lKCk7XG4gICAgICBiLmgoNSwgMSwgMjIpLnYoMjIsIDUsIDIyKS5oKDIyLCA1LCAyMikudig1LCAxMCwgMjIpO1xuICAgICAgYi5oKDEwLCA2LCAxNykudigxNywgMTAsIDE3KS5oKDE3LCAxMCwgMTcpLnYoMTAsIDEwLCAxMikudigxMCwgMTYsIDE3KTtcbiAgICAgIGIuc3RhcnQoMywgMy42KS5nb2FsKDE1LjYsIDE0KTsgICAgICAgICAgICAgICAgICAgICAgIC8vIGFnYWluc3QgdGhlIGZhciB3YWxsIG9mIHRoZSBpbm5lciByb29tXG4gICAgICBiLmdlbSgyNC41LCAxNCkuZ2VtKDIuNSwgMTUpLmdlbSgxMy41LCAxOS41KTtcbiAgICB9XG4gIH0sXG4gIHsgLy8gUGxpbmtvOiBzdGVlciB0aHJvdWdoIHRoZSBwZWdzIGludG8gdGhlIGN1cC5cbiAgICBpZDogXCIxLTExXCIsXG4gICAgYnVpbGQoYikge1xuICAgICAgYi5mcmFtZSgpO1xuICAgICAgYi5oKDQsIDEsIDgpO1xuICAgICAgW1s5LCBbNiwgMTEsIDE2LCAyMV1dLCBbMTMsIFszLCA4LCAxNCwgMTksIDI0XV0sIFsxNywgWzYsIDExLCAxNiwgMjFdXV1cbiAgICAgICAgLmZvckVhY2goKFtyLCBjb2xzXSkgPT4gY29scy5mb3JFYWNoKChjKSA9PiBiLnB1dChcIm9cIiwgYywgcikpKTtcbiAgICAgIGIudigxMiwgMjQsIDI2KS52KDE2LCAyNCwgMjYpOyAgICAgICAgICAgICAgICAgICAgICAgIC8vIHNudWcgY3VwIHVuZGVyIGEgZnVubmVsXG4gICAgICBiLmRpYWcoOCwgMjAsIDExLCAyMykuZGlhZygxNywgMjMsIDIwLCAyMCk7XG4gICAgICBiLnNwaWtlcygxLCAyNiwgMTEsIDI2KS5zcGlrZXMoMTcsIDI2LCAyNiwgMjYpO1xuICAgICAgYi5zdGFydCgzLCAyLjYpLmdvYWwoMTQsIDI1LjYpO1xuICAgICAgYi5nZW0oMTQsIDExKS5nZW0oOCwgMTUpLmdlbSgxNCwgMjEpO1xuICAgIH1cbiAgfSxcbiAgeyAvLyBSaW5nOiBmaW5kIHRoZSBkb29yIG9mIHRoZSBpbm5lciByb29tLlxuICAgIGlkOiBcIjEtMTJcIixcbiAgICBidWlsZChiKSB7XG4gICAgICBiLmZyYW1lKCk7XG4gICAgICBiLmgoNywgNywgMjApLmgoMjAsIDcsIDIwKS52KDcsIDcsIDIwKS52KDIwLCA3LCAxMikudigyMCwgMTYsIDIwKTtcbiAgICAgIGIuc3RhcnQoMywgMjUuNikuZ29hbCg4LjQsIDE0KTsgICAgICAgICAgICAgICAgICAgICAgICAvLyBhZ2FpbnN0IHRoZSBmYXIgd2FsbCwgb3Bwb3NpdGUgdGhlIGRvb3JcbiAgICAgIGIuZ2VtKDI0LCAyNS42KS5nZW0oMjMuNSwgMykuZ2VtKDMsIDMuNCk7XG4gICAgfVxuICB9LFxuICB7IC8vIFZhbGxleTogY2xpbWIgb3V0IHRoZSByaWdodCBzaWRlIFx1MjAxNCB0aGUgbGVmdCBzaWRlIGVuZHMgYmFkbHkuXG4gICAgaWQ6IFwiMS0xM1wiLFxuICAgIGJ1aWxkKGIpIHtcbiAgICAgIGIuZnJhbWUoKTtcbiAgICAgIGIuZGlhZyg0LCAxMiwgMTIsIDIwKS5kaWFnKDEzLCAyMCwgMjEsIDEyKTtcbiAgICAgIGIuc3Bpa2VzKDEsIDI2LCA5LCAyNik7XG4gICAgICBiLnN0YXJ0KDEyLjUsIDE3KS5nb2FsKDI1LjYsIDI1LjYpO1xuICAgICAgYi5nZW0oMTcsIDEzLjUpLmdlbSgyNCwgMTgpLmdlbSg4LCAxMy41KTtcbiAgICB9XG4gIH0sXG4gIHsgLy8gQnVtcGVycy5cbiAgICBpZDogXCIxLTE0XCIsXG4gICAgYnVpbGQoYikge1xuICAgICAgYi5mcmFtZSgpO1xuICAgICAgYi5oKDQsIDExLCAxNik7XG4gICAgICBbWzcsIDEwXSwgWzIxLCAxMF0sIFsxNCwgMTRdLCBbNSwgMTddLCBbMjMsIDE3XV0uZm9yRWFjaCgoW2MsIHJdKSA9PiBiLnB1dChcIk9cIiwgYywgcikpO1xuICAgICAgYi52KDEyLCAyMywgMjYpLnYoMTYsIDIzLCAyNik7XG4gICAgICBiLmRpYWcoOCwgMTksIDExLCAyMikuZGlhZygxNywgMjIsIDIwLCAxOSk7XG4gICAgICBiLnN0YXJ0KDEzLjUsIDIuNikuZ29hbCgxNCwgMjUuNik7XG4gICAgICBiLmdlbSg0LCA2KS5nZW0oMjQsIDYpLmdlbSgxNCwgMTkpO1xuICAgIH1cbiAgfSxcbiAgeyAvLyBNYXplOiB1bmRlciwgb3ZlciwgdW5kZXIuXG4gICAgaWQ6IFwiMS0xNVwiLFxuICAgIGJ1aWxkKGIpIHtcbiAgICAgIGIuZnJhbWUoKTtcbiAgICAgIGIudig3LCAxLCAyMCkudigxNCwgNywgMjYpLnYoMjEsIDEsIDIwKTtcbiAgICAgIGIuc3Bpa2VzKDE1LCAyNiwgMTcsIDI2KTtcbiAgICAgIGIuc3RhcnQoMywgMi42KS5nb2FsKDI1LjYsIDEuNCk7XG4gICAgICBiLmdlbSgxMC41LCAyNS42KS5nZW0oMTEsIDEuNCkuZ2VtKDE4LCAxMyk7XG4gICAgfVxuICB9LFxuICB7IC8vIEhvdXJnbGFzczogc2xpZGUgYWxvbmcgdGhlIHVuZGVyc2lkZSBhbmQgY2F0Y2ggdGhlIG5lY2suXG4gICAgaWQ6IFwiMS0xNlwiLFxuICAgIGJ1aWxkKGIpIHtcbiAgICAgIGIuZnJhbWUoKTtcbiAgICAgIGIuZGlhZygxLCA2LCAxMSwgMTYpLmRpYWcoMTYsIDE2LCAyNiwgNik7XG4gICAgICBiLnN0YXJ0KDQsIDI1LjYpLmdvYWwoMS40LCAxLjQpO1xuICAgICAgYi5nZW0oMTMuNSwgMjEpLmdlbSgxMy41LCAxMikuZ2VtKDIyLCAxLjQpO1xuICAgIH1cbiAgfSxcbiAgeyAvLyBDbGlmZmhhbmdlcjogb3BlbiBzaWRlcy4gUm9sbCBvZmYgZ2VudGx5LlxuICAgIGlkOiBcIjEtMTdcIixcbiAgICBidWlsZChiKSB7XG4gICAgICBiLmZyYW1lKCk7XG4gICAgICBiLmNsZWFyKDAsIDgsIDAsIDE1KS5jbGVhcigyNywgOCwgMjcsIDE1KTtcbiAgICAgIGIuaCgxMCwgOSwgMTgpO1xuICAgICAgYi5zdGFydCgxMy41LCA4LjYpLmdvYWwoMjUuNiwgMjUuNik7XG4gICAgICBiLmdlbSg0LCA5KS5nZW0oMjMsIDkpLmdlbSgxMy41LCAxOCk7XG4gICAgfVxuICB9LFxuICB7IC8vIEdhdW50bGV0OiBzcGlrZXMgb24gdGhlIGZsb29yIGhlcmUsIG9uIHRoZSBjZWlsaW5nIHRoZXJlLlxuICAgIGlkOiBcIjEtMThcIixcbiAgICBidWlsZChiKSB7XG4gICAgICBiLmZyYW1lKCk7XG4gICAgICBiLmgoOCwgMSwgMjIpO1xuICAgICAgYi5oKDE3LCA1LCAyNik7XG4gICAgICBiLnNwaWtlcygxMiwgMTYsIDE3LCAxNik7XG4gICAgICBiLnNwaWtlcygxMCwgMTgsIDE2LCAxOCk7XG4gICAgICBiLnN0YXJ0KDMsIDYuNikuZ29hbCgyNS42LCAyNS42KTtcbiAgICAgIGIuZ2VtKDE0LCA5LjQpLmdlbSgyLjUsIDEzKS5nZW0oMTMsIDI1LjYpO1xuICAgIH1cbiAgfSxcbiAgeyAvLyBTdW1taXQ6IGRyb3Agb250byB0aGUgcGVhaywgbm90IHRoZSBzaG91bGRlcnMuXG4gICAgaWQ6IFwiMS0xOVwiLFxuICAgIGJ1aWxkKGIpIHtcbiAgICAgIGIuZnJhbWUoKTtcbiAgICAgIGIuYm94KDMsIDIzLCAyMywgMjYpO1xuICAgICAgYi5ib3goNywgMTksIDE5LCAyMik7XG4gICAgICBiLmJveCgxMSwgMTUsIDE1LCAxOCk7XG4gICAgICBiLnB1dChcIiNcIiwgMTEsIDE0KS5wdXQoXCIjXCIsIDE1LCAxNCk7ICAgICAgICAgICAgICAgICAgLy8gY3JhZGxlIG9uIHRoZSBwZWFrXG4gICAgICBiLnNwaWtlcygzLCAyMiwgNiwgMjIpLnNwaWtlcygyMCwgMjIsIDIzLCAyMik7XG4gICAgICBiLnNwaWtlcyg3LCAxOCwgMTAsIDE4KS5zcGlrZXMoMTYsIDE4LCAxOSwgMTgpO1xuICAgICAgYi5oKDQsIDEsIDUpO1xuICAgICAgYi5zdGFydCgzLCAyLjYpLmdvYWwoMTMsIDEzLjYpO1xuICAgICAgYi5nZW0oOCwgMS40KS5nZW0oMTMsIDgpLmdlbSgyMCwgMS40KTtcbiAgICB9XG4gIH0sXG4gIHsgLy8gRXhhbTogdGlsdCwgZmxpcCBvdmVyIHNwaWtlcywgY3Jvc3MgdGhlIGhvbGUuXG4gICAgaWQ6IFwiMS0yMFwiLFxuICAgIGJ1aWxkKGIpIHtcbiAgICAgIGIuZnJhbWUoKTtcbiAgICAgIGIuY2xlYXIoMTIsIDI3LCAxNSwgMjcpO1xuICAgICAgYi5oKDYsIDEsIDIxKTtcbiAgICAgIGIuaCgxMywgNiwgMjYpO1xuICAgICAgYi5zcGlrZXMoMTIsIDEyLCAxNSwgMTIpO1xuICAgICAgYi5zdGFydCgzLCA0LjYpLmdvYWwoMjUuNiwgMjUuNik7XG4gICAgICBiLmdlbSgxMSwgNC42KS5nZW0oMTMuNSwgNy40KS5nZW0oMTMuNSwgMTQuNCk7XG4gICAgfVxuICB9XG5dO1xuIiwgIi8vIEdFTkVSQVRFRCBieSB0b29scy92YWxpZGF0ZS1sZXZlbHMubWpzIFx1MjAxNCBkbyBub3QgZWRpdCBieSBoYW5kLlxuLy8gcGFyOiBzZWNvbmRzIGZvciB0aGUgdGltZSBzdGFyIFx1MDBCNyB0L3RnOiBib3QgYmVzdCB0aW1lIChwbGFpbiAvIGFsbCBnZW1zKSBcdTAwQjcgZDogZGlmZmljdWx0eSBcdTAwQjcgcGF0aDogYm90IHJvdXRlIChoaW50KVxuZXhwb3J0IGNvbnN0IE1FVEEgPSB7XG4gIFwiMS0xXCI6IHtcInBhclwiOjExLFwidFwiOjIuMDMsXCJ0Z1wiOjIuMDMsXCJkXCI6MTMuOCxcInBhdGhcIjpbWy0xNDIsNDRdLFstMTMwLDQ0XSxbLTUwLDQ0XSxbOTgsNDJdLFsxNTksLTIzXSxbMTcwLC0xNTVdLFsxNzMsLTE3MF1dfSxcbiAgXCIxLTJcIjoge1wicGFyXCI6MTQsXCJ0XCI6Mi4zNyxcInRnXCI6My4xNSxcImRcIjoxMi4zLFwicGF0aFwiOltbMTQzLDQ0XSxbMTM4LDQ0XSxbMTAwLDQ0XSxbMTAsNDRdLFstMTEzLDQwXSxbLTE2MCwtN10sWy04MiwtOTJdLFs0MywtMTgwXSxbMTc3LC0xNjZdXX0sXG4gIFwiMS0zXCI6IHtcInBhclwiOjE1LFwidFwiOjMuNjMsXCJ0Z1wiOjMuNjMsXCJkXCI6MTUuMyxcInBhdGhcIjpbWy0xNTcsMTA0XSxbLTE1MywxMDRdLFstMTE1LDEwNF0sWy0yNSwxMDRdLFs5OCwxMDNdLFsxNjgsNjhdLFs5NCwwXSxbLTI1LDI1XSxbLTE3NCwxMV0sWy0xMjEsLTU0XSxbLTM2LC05MV0sWzc2LC05N10sWzE3OSwtMTU5XSxbMTc0LC0xNjldXX0sXG4gIFwiMS00XCI6IHtcInBhclwiOjE1LFwidFwiOjEuNTksXCJ0Z1wiOjMuNixcImRcIjoxMy40LFwicGF0aFwiOltbLTk3LDc0XSxbLTkzLDc0XSxbLTU4LDc0XSxbMTAsNTddLFs4NiwtMTRdLFsxODEsLTEyOV0sWzE3MCwtMTcxXV19LFxuICBcIjEtNVwiOiB7XCJwYXJcIjoxNixcInRcIjoyLjYzLFwidGdcIjozLjgyLFwiZFwiOjE2LjIsXCJwYXRoXCI6W1stMTQyLC0xODFdLFstMTQyLC0xODFdLFstMTM4LC0xODFdLFstMTI1LC0xODFdLFstMTAwLC0xODFdLFstNjEsLTE4MV0sWy0xMCwtMTc3XSxbNTEsLTE2NV0sWzExNSwtMTQwXSxbMTc4LC0xMDFdLFsxNTgsLTUxXSxbMTI4LDEwXSxbOTEsODBdLFs0NiwxNTddLFstMiwxNjJdLFstNTMsMTQ2XSxbLTEwOCwxNDVdLFstMTY5LDE1N10sWy0xNzMsMTY4XV19LFxuICBcIjEtNlwiOiB7XCJwYXJcIjoxNSxcInRcIjozLjE4LFwidGdcIjozLjU3LFwiZFwiOjE1LjUsXCJwYXRoXCI6W1stODIsLTYxXSxbLTc4LC02MV0sWy02MSwtNjFdLFstNTgsLTU4XSxbLTU4LC0yNF0sWy01OCw0Nl0sWy0yMywxNDVdLFs2MywxNTZdLFsxNzcsMTE1XSxbMTQwLDQ4XSxbOTYsLTldLFsxMDQsLTY1XV19LFxuICBcIjEtN1wiOiB7XCJwYXJcIjoxMyxcInRcIjoxLjkzLFwidGdcIjoyLjkyLFwiZFwiOjExLjksXCJwYXRoXCI6W1stMTU3LDExOV0sWy0xNTMsMTE5XSxbLTExNSwxMTldLFstMjUsMTE0XSxbOTksNzVdLFsxNjYsLTE1XSxbMTUzLC0xMzddLFsxNjYsLTE3N11dfSxcbiAgXCIxLThcIjoge1wicGFyXCI6MTUsXCJ0XCI6Mi42NixcInRnXCI6My4zNCxcImRcIjoyMy40LFwicGF0aFwiOltbLTE0MiwxMTldLFstMTMwLDExOV0sWy01OCwxMTldLFsxMiwxMDZdLFstMSw2NV0sWy05MSw0NF0sWy0xNzQsLTY4XSxbLTE3MSwtMTcyXV19LFxuICBcIjEtOVwiOiB7XCJwYXJcIjoyMCxcInRcIjoxLjMxLFwidGdcIjo1LjE4LFwiZFwiOjE1LjQsXCJwYXRoXCI6W1stMTU3LC0xODFdLFstMTU3LC0xODFdLFstMTUzLC0xODFdLFstMTQwLC0xODFdLFstMTE1LC0xODFdLFstNzYsLTE4MV0sWy0yNCwtMTgyXSxbNDAsLTE4MV0sWzExNSwtMTc3XSxbMTc0LC0xNjhdXX0sXG4gIFwiMS0xMFwiOiB7XCJwYXJcIjoyNSxcInRcIjo2Ljg4LFwidGdcIjo2Ljg4LFwiZFwiOjY5LjYsXCJwYXRoXCI6W1stMTU3LDE0OV0sWy0xNTMsMTQ5XSxbLTExNSwxNDldLFstMjUsMTQ5XSxbOTgsMTQ5XSxbMTY3LDEzM10sWzE1OSw2M10sWzE3MCwtNTddLFsxNDUsLTE3MV0sWzcwLC0xNjJdLFstNTQsLTE3OF0sWy0xNzEsLTE1OF0sWy0xNjksLTk1XSxbLTE3MCwxNF0sWy0xMjQsODldLFstMzAsODNdLFs5OSw2NF0sWzc5LC01XSxbNjksLTEwNV0sWzYsLTc4XSxbLTk1LC02NF0sWy02NiwxXSxbLTQ1LC0xNF0sWzIwLDNdXX0sXG4gIFwiMS0xMVwiOiB7XCJwYXJcIjoxMyxcInRcIjoyLjIzLFwidGdcIjoyLjczLFwiZFwiOjE0LFwicGF0aFwiOltbLTE1NywxNjRdLFstMTQ1LDE2NF0sWy03MywxNjNdLFsyMywxMDldLFsxMjAsLTRdLFsyNywtMTM1XSxbMTMsLTE2N11dfSxcbiAgXCIxLTEyXCI6IHtcInBhclwiOjIyLFwidFwiOjIuMjMsXCJ0Z1wiOjUuNzgsXCJkXCI6MTMuNCxcInBhdGhcIjpbWy0xNTcsLTE4MV0sWy0xNTcsLTE4MV0sWy0xNTMsLTE4MV0sWy0xNDAsLTE4MV0sWy0xMTUsLTE4MV0sWy03NiwtMTgxXSxbLTI1LC0xNzhdLFszOCwtMTY5XSxbMTA5LC0xNTFdLFsxODIsLTEyMV0sWzE1MiwtODBdLFsxMjEsLTI2XSxbODMsLTEwXSxbMzcsLTI1XSxbLTE5LC0zMF0sWy03MiwtMjNdXX0sXG4gIFwiMS0xM1wiOiB7XCJwYXJcIjoxNixcInRcIjoyLjQ3LFwidGdcIjozLjcyLFwiZFwiOjE0LjgsXCJwYXRoXCI6W1stMTUsLTUyXSxbLTE2LC03Nl0sWy01LC02OF0sWzI1LC0zOF0sWzc3LDE0XSxbMTMxLDU5XSxbMTgwLDQ2XSxbMTY0LC0yNF0sWzE3OSwtMTM3XSxbMTgwLC0xNjhdXX0sXG4gIFwiMS0xNFwiOiB7XCJwYXJcIjoxNCxcInRcIjoxLjgsXCJ0Z1wiOjMuMjcsXCJkXCI6MjIsXCJwYXRoXCI6W1swLDE2NF0sWy01LDE2NF0sWy0zNiwxNjRdLFstNjksMTQ1XSxbLTY3LDc5XSxbLTI3LC0yNF0sWzE0LC0xNzFdXX0sXG4gIFwiMS0xNVwiOiB7XCJwYXJcIjoxOCxcInRcIjo0LjM2LFwidGdcIjo0LjUyLFwiZFwiOjE4LjUsXCJwYXRoXCI6W1stMTU3LDE2NF0sWy0xNTcsMTMyXSxbLTE1Miw0NF0sWy0xMjAsLTc4XSxbLTEwOCwtMTc4XSxbLTUzLC0xMTJdLFstMjEsMV0sWy0xMSwxNDNdLFs1MywxMzddLFs3Niw1Ml0sWzg4LC01OV0sWzEwMiwtMTYyXSxbMTU0LC0xNDRdLFsxNzIsLTUxXSxbMTgxLDgzXSxbMTc4LDE2OV1dfSxcbiAgXCIxLTE2XCI6IHtcInBhclwiOjI0LFwidFwiOjMuOTMsXCJ0Z1wiOjYuMzksXCJkXCI6NjYuMyxcInBhdGhcIjpbWy0xNDIsLTE4MV0sWy0xMzgsLTE4MV0sWy0xMDAsLTE4MV0sWy0xMCwtMTc3XSxbMTE1LC0xNDBdLFsxNTgsLTUxXSxbMTM5LDldLFsxMzksLTFdLFs5MywtMTRdLFs1OCwtNDVdLFszMCwtNjRdLFstNSwtMzVdLFstNjYsNDJdLFstMTYxLDE1NF0sWy0xNzMsMTY4XV19LFxuICBcIjEtMTdcIjoge1wicGFyXCI6MTYsXCJ0XCI6MS44LFwidGdcIjozLjg3LFwiZFwiOjUxLjcsXCJwYXRoXCI6W1swLDc0XSxbNSw3NF0sWzM2LDc0XSxbNzQsNzRdLFsxMDgsNDNdLFsxNDIsLTQzXSxbMTc1LC0xNjhdXX0sXG4gIFwiMS0xOFwiOiB7XCJwYXJcIjoxOSxcInRcIjozLjgzLFwidGdcIjo0LjgzLFwiZFwiOjY4LjcsXCJwYXRoXCI6W1stMTU3LDEwNF0sWy0xNTMsMTA0XSxbLTExNSwxMDRdLFstMjUsMTA0XSxbOTgsMTA0XSxbMTY4LDg4XSxbMTQ0LDI1XSxbODksLTI2XSxbLTE4LC01XSxbLTE1NiwtMjJdLFstMTMzLC05MV0sWy00OSwtMTc1XSxbNjQsLTE1N10sWzE3MiwtMTczXV19LFxuICBcIjEtMTlcIjoge1wicGFyXCI6MTUsXCJ0XCI6MS4zMSxcInRnXCI6My40NSxcImRcIjozMy41LFwicGF0aFwiOltbLTE1NywxNjRdLFstMTQ1LDE2NF0sWy03MywxNDhdLFstMSw0NV0sWzMsOF1dfSxcbiAgXCIxLTIwXCI6IHtcInBhclwiOjIzLFwidFwiOjMuNTEsXCJ0Z1wiOjYuMTIsXCJkXCI6NDUuNSxcInBhdGhcIjpbWy0xNTcsMTM0XSxbLTE1MywxMzRdLFstMTE1LDEzNF0sWy0yNSwxMzRdLFs5OCwxMzRdLFsxNjgsMTEzXSxbOTcsNDddLFstNCw0M10sWy0xMzEsMzBdLFstMTQ5LDNdLFstNjgsLTY1XSxbNjAsLTE0M10sWzE3MCwtMTczXV19XG59O1xuIiwgIi8vIExldmVsIHJlZ2lzdHJ5OiBhdXRob3JlZCBkZWZpbml0aW9ucyAtPiBjb21waWxlZCBsZXZlbHMgKGxhemlseSwgY2FjaGVkKS5cbmltcG9ydCB7IGNvbXBpbGUgfSBmcm9tIFwiLi9wYXJzZS5qc1wiO1xuaW1wb3J0IHsgV09STEQxIH0gZnJvbSBcIi4vd29ybGQxLmpzXCI7XG5pbXBvcnQgeyBNRVRBIH0gZnJvbSBcIi4vbWV0YS5nZW4uanNcIjtcblxuZXhwb3J0IGNvbnN0IFdPUkxEUyA9IFtcbiAgeyBpZDogMSwgdGhlbWU6IFwibWVhZG93XCIsIGRlZnM6IFdPUkxEMSB9XG5dO1xuXG5leHBvcnQgY29uc3QgREVGUyA9IFdPUkxEUy5mbGF0TWFwKCh3KSA9PiB3LmRlZnMubWFwKChkKSA9PiAoeyAuLi5kLCB0aGVtZTogZC50aGVtZSB8fCB3LnRoZW1lLCB3b3JsZDogdy5pZCB9KSkpO1xuZXhwb3J0IGNvbnN0IExFVkVMX0NPVU5UID0gREVGUy5sZW5ndGg7XG5cbmNvbnN0IGNhY2hlID0gbmV3IE1hcCgpO1xuLyoqIEBwYXJhbSBpIHplcm8tYmFzZWQgbGV2ZWwgaW5kZXggaW4gY2FtcGFpZ24gb3JkZXIgKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRMZXZlbChpKSB7XG4gIGlmICghY2FjaGUuaGFzKGkpKSB7XG4gICAgY29uc3QgZGVmID0gREVGU1tpXTtcbiAgICBjb25zdCBsdmwgPSBjb21waWxlKGRlZik7XG4gICAgY29uc3QgbSA9IE1FVEFbZGVmLmlkXTtcbiAgICBsdmwuaW5kZXggPSBpOyBsdmwud29ybGQgPSBkZWYud29ybGQ7XG4gICAgbHZsLnBhciA9IGRlZi5wYXIgfHwgKG0gJiYgbS5wYXIpIHx8IDMwO1xuICAgIGx2bC5oaW50ID0gKG0gJiYgbS5wYXRoKSB8fCBudWxsO1xuICAgIGNhY2hlLnNldChpLCBsdmwpO1xuICB9XG4gIHJldHVybiBjYWNoZS5nZXQoaSk7XG59XG4iLCAiLyogZ2xvYmFsIF9fRVNDX0tFWV9fICovXG4vLyBJbnB1dDogb25lIGZpbmdlciAob3IgdGhlIG1vdXNlKSB0dXJucyB0aGUgd29ybGQ7IGtleWJvYXJkIHdvcmtzIHRvby5cbi8vICAgc3dpcGUgbW9kZTogaG9yaXpvbnRhbCBkcmFnID0gdGlsdCAoZHJhZyByaWdodCAtPiB0aGUgd29ybGQgdGlwcyByaWdodClcbi8vICAgZ3JhYiBtb2RlOiAgdGhlIHdvcmxkIGZvbGxvd3MgdGhlIGZpbmdlciBhcm91bmQgaXRzIGNlbnRyZVxuZXhwb3J0IGNsYXNzIElucHV0IHtcbiAgY29uc3RydWN0b3IoZWwsIGdhbWUpIHtcbiAgICB0aGlzLmVsID0gZWw7IHRoaXMuZ2FtZSA9IGdhbWU7IHRoaXMubW9kZSA9IFwic3dpcGVcIjtcbiAgICB0aGlzLmtleURpciA9IDA7IHRoaXMubGVmdCA9IGZhbHNlOyB0aGlzLnJpZ2h0ID0gZmFsc2U7XG4gICAgdGhpcy5hY3RpdmUgPSBmYWxzZTsgdGhpcy5pZCA9IC0xOyB0aGlzLmx4ID0gMDsgdGhpcy5seSA9IDA7IHRoaXMuc3ggPSAwOyB0aGlzLnN5ID0gMDsgdGhpcy5tb3ZlZCA9IDA7IHRoaXMudDAgPSAwOyB0aGlzLmxhID0gMDtcblxuICAgIGVsLmFkZEV2ZW50TGlzdGVuZXIoXCJwb2ludGVyZG93blwiLCAoZSkgPT4ge1xuICAgICAgaWYgKHRoaXMuYWN0aXZlKSByZXR1cm47XG4gICAgICB0aGlzLmFjdGl2ZSA9IHRydWU7IHRoaXMuaWQgPSBlLnBvaW50ZXJJZDtcbiAgICAgIHRyeSB7IGVsLnNldFBvaW50ZXJDYXB0dXJlKGUucG9pbnRlcklkKTsgfSBjYXRjaCAoXykgeyAvKiBub29wICovIH1cbiAgICAgIHRoaXMubHggPSB0aGlzLnN4ID0gZS5jbGllbnRYOyB0aGlzLmx5ID0gdGhpcy5zeSA9IGUuY2xpZW50WTsgdGhpcy5tb3ZlZCA9IDA7IHRoaXMudDAgPSBwZXJmb3JtYW5jZS5ub3coKTtcbiAgICAgIHRoaXMubGEgPSB0aGlzLl9hbmdsZShlKTtcbiAgICAgIGdhbWUuZ2VzdHVyZSgpO1xuICAgIH0pO1xuICAgIGVsLmFkZEV2ZW50TGlzdGVuZXIoXCJwb2ludGVybW92ZVwiLCAoZSkgPT4ge1xuICAgICAgaWYgKCF0aGlzLmFjdGl2ZSB8fCBlLnBvaW50ZXJJZCAhPT0gdGhpcy5pZCkgcmV0dXJuO1xuICAgICAgY29uc3QgZHggPSBlLmNsaWVudFggLSB0aGlzLmx4LCBkeSA9IGUuY2xpZW50WSAtIHRoaXMubHk7XG4gICAgICB0aGlzLmx4ID0gZS5jbGllbnRYOyB0aGlzLmx5ID0gZS5jbGllbnRZO1xuICAgICAgdGhpcy5tb3ZlZCArPSBNYXRoLmFicyhkeCkgKyBNYXRoLmFicyhkeSk7XG4gICAgICBjb25zdCByZWN0ID0gZWwuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICBjb25zdCBzZW5zID0gKE1hdGguUEkgKiAwLjk1KSAvIE1hdGgubWF4KDI0MCwgTWF0aC5taW4ocmVjdC53aWR0aCwgcmVjdC5oZWlnaHQpKTsgICAvLyBhIHN3aXBlIGFjcm9zcyB0aGUgc2hvcnQgc2lkZSBcdTIyNDggMTcwXHUwMEIwXG4gICAgICBpZiAodGhpcy5tb2RlID09PSBcImdyYWJcIikge1xuICAgICAgICBjb25zdCBjID0gZ2FtZS5hcmVuYUNlbnRlcigpLCByeCA9IGUuY2xpZW50WCAtIHJlY3QubGVmdCAtIGMueCwgcnkgPSBlLmNsaWVudFkgLSByZWN0LnRvcCAtIGMueTtcbiAgICAgICAgY29uc3QgYSA9IE1hdGguYXRhbjIoLXJ5LCByeCk7XG4gICAgICAgIGlmIChyeCAqIHJ4ICsgcnkgKiByeSA+IDM2ICogMzYpIHtcbiAgICAgICAgICBsZXQgZCA9IGEgLSB0aGlzLmxhO1xuICAgICAgICAgIGlmIChkID4gTWF0aC5QSSkgZCAtPSAyICogTWF0aC5QSTsgZWxzZSBpZiAoZCA8IC1NYXRoLlBJKSBkICs9IDIgKiBNYXRoLlBJO1xuICAgICAgICAgIGdhbWUucm90YXRlKGQpO1xuICAgICAgICB9IGVsc2UgZ2FtZS5yb3RhdGUoLWR4ICogc2Vucyk7XG4gICAgICAgIHRoaXMubGEgPSBhO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZ2FtZS5yb3RhdGUoLWR4ICogc2Vucyk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgY29uc3QgdXAgPSAoZSkgPT4ge1xuICAgICAgaWYgKCF0aGlzLmFjdGl2ZSB8fCBlLnBvaW50ZXJJZCAhPT0gdGhpcy5pZCkgcmV0dXJuO1xuICAgICAgdGhpcy5hY3RpdmUgPSBmYWxzZTtcbiAgICAgIGlmICh0aGlzLm1vdmVkIDwgMTAgJiYgcGVyZm9ybWFuY2Uubm93KCkgLSB0aGlzLnQwIDwgMzIwKSBnYW1lLnRhcCgpO1xuICAgIH07XG4gICAgZWwuYWRkRXZlbnRMaXN0ZW5lcihcInBvaW50ZXJ1cFwiLCB1cCk7XG4gICAgZWwuYWRkRXZlbnRMaXN0ZW5lcihcInBvaW50ZXJjYW5jZWxcIiwgdXApO1xuICAgIGVsLmFkZEV2ZW50TGlzdGVuZXIoXCJjb250ZXh0bWVudVwiLCAoZSkgPT4gZS5wcmV2ZW50RGVmYXVsdCgpKTtcblxuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwia2V5ZG93blwiLCAoZSkgPT4ge1xuICAgICAgY29uc3QgayA9IGUua2V5O1xuICAgICAgaWYgKF9fRVNDX0tFWV9fICYmIGsgPT09IFwiRXNjYXBlXCIpIHsgZ2FtZS5lc2NhcGUoKTsgcmV0dXJuOyB9ICAgLy8gbmV2ZXIgcHJldmVudERlZmF1bHQgb24gRXNjOyBjb21waWxlZCBvdXQgd2hlcmUgdGhlIHBvcnRhbCBmb3JiaWRzIEVzY1xuICAgICAgaWYgKGsgPT09IFwiQXJyb3dMZWZ0XCIgfHwgayA9PT0gXCJhXCIgfHwgayA9PT0gXCJBXCIpIHsgdGhpcy5sZWZ0ID0gdHJ1ZTsgZS5wcmV2ZW50RGVmYXVsdCgpOyB9XG4gICAgICBlbHNlIGlmIChrID09PSBcIkFycm93UmlnaHRcIiB8fCBrID09PSBcImRcIiB8fCBrID09PSBcIkRcIikgeyB0aGlzLnJpZ2h0ID0gdHJ1ZTsgZS5wcmV2ZW50RGVmYXVsdCgpOyB9XG4gICAgICBlbHNlIGlmIChrID09PSBcIiBcIiB8fCBrID09PSBcIkVudGVyXCIpIHsgaWYgKCFlLnJlcGVhdCAmJiAhKGUudGFyZ2V0ICYmIGUudGFyZ2V0LmNsb3Nlc3QgJiYgZS50YXJnZXQuY2xvc2VzdChcImJ1dHRvbiwgaW5wdXRcIikpKSB7IGdhbWUuYWN0aW9uKCk7IGUucHJldmVudERlZmF1bHQoKTsgfSB9XG4gICAgICBlbHNlIGlmIChrID09PSBcInJcIiB8fCBrID09PSBcIlJcIikgeyBpZiAoIWUucmVwZWF0KSBnYW1lLnJlc3RhcnRLZXkoKTsgfVxuICAgICAgZWxzZSByZXR1cm47XG4gICAgICB0aGlzLmtleURpciA9ICh0aGlzLnJpZ2h0ID8gMSA6IDApIC0gKHRoaXMubGVmdCA/IDEgOiAwKTtcbiAgICAgIGdhbWUuZ2VzdHVyZSgpO1xuICAgIH0pO1xuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwia2V5dXBcIiwgKGUpID0+IHtcbiAgICAgIGNvbnN0IGsgPSBlLmtleTtcbiAgICAgIGlmIChrID09PSBcIkFycm93TGVmdFwiIHx8IGsgPT09IFwiYVwiIHx8IGsgPT09IFwiQVwiKSB0aGlzLmxlZnQgPSBmYWxzZTtcbiAgICAgIGVsc2UgaWYgKGsgPT09IFwiQXJyb3dSaWdodFwiIHx8IGsgPT09IFwiZFwiIHx8IGsgPT09IFwiRFwiKSB0aGlzLnJpZ2h0ID0gZmFsc2U7XG4gICAgICB0aGlzLmtleURpciA9ICh0aGlzLnJpZ2h0ID8gMSA6IDApIC0gKHRoaXMubGVmdCA/IDEgOiAwKTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKiBEcm9wIGFueSBoZWxkIGtleXMgLyBkcmFncyAoY2FsbGVkIHdoZW4gdGhlIGdhbWUgaXMgcGF1c2VkIGJ5IHRoZSBob3N0KS4gKi9cbiAgcmVzZXQoKSB7IHRoaXMubGVmdCA9IHRoaXMucmlnaHQgPSBmYWxzZTsgdGhpcy5rZXlEaXIgPSAwOyB0aGlzLmFjdGl2ZSA9IGZhbHNlOyB9XG5cbiAgX2FuZ2xlKGUpIHtcbiAgICBjb25zdCByZWN0ID0gdGhpcy5lbC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKSwgYyA9IHRoaXMuZ2FtZS5hcmVuYUNlbnRlcigpO1xuICAgIHJldHVybiBNYXRoLmF0YW4yKC0oZS5jbGllbnRZIC0gcmVjdC50b3AgLSBjLnkpLCBlLmNsaWVudFggLSByZWN0LmxlZnQgLSBjLngpO1xuICB9XG59XG4iLCAiLy8gR2FtZSBjb250cm9sbGVyOiBvd25zIHRoZSBsb29wLCB0aGUgbGV2ZWwgZmxvdyBhbmQgdGhlIGdsdWUgYmV0d2VlblxuLy8gc2ltdWxhdGlvbiwgcmVuZGVyZXIsIFVJLCBhdWRpbyBhbmQgdGhlIHBsYXRmb3JtIGFkYXB0ZXIuXG5pbXBvcnQgeyBTaW0sIERULCBXTUFYLCBib3hEaXN0MiwgcGF0aFBvcyB9IGZyb20gXCIuL3NpbS9zaW0uanNcIjtcbmltcG9ydCB7IGdldExldmVsLCBMRVZFTF9DT1VOVCB9IGZyb20gXCIuL2xldmVscy9pbmRleC5qc1wiO1xuaW1wb3J0IHsgdG90YWxTdGFycyB9IGZyb20gXCIuL21ldGEvc2F2ZS5qc1wiO1xuaW1wb3J0IHsgdGhlbWVPZiB9IGZyb20gXCIuL3JlbmRlci90aGVtZXMuanNcIjtcbmltcG9ydCB7IHNraW5CeUlkIH0gZnJvbSBcIi4vcmVuZGVyL3NraW5zLmpzXCI7XG5pbXBvcnQgeyBJbnB1dCB9IGZyb20gXCIuL2lucHV0LmpzXCI7XG5cbmNvbnN0IEZJUlNUX0FEX0FGVEVSID0gMjsgICAgICAgIC8vIG5vIGludGVyc3RpdGlhbCBiZWZvcmUgdGhlIHBsYXllciBoYXMgZmluaXNoZWQgbGV2ZWwgM1xuY29uc3QgSElOVF9BRlRFUiA9IHsgZGVhdGhzOiAzLCBzZWM6IDQwIH07ICAgLy8gb2ZmZXIgdGhlIHJvdXRlXG5jb25zdCBTS0lQX0FGVEVSID0geyBkZWF0aHM6IDYsIHNlYzogOTAgfTsgICAvLyBvZmZlciB0byBtb3ZlIG9uXG5jb25zdCBfcCA9IHsgeDogMCwgeTogMCwgdng6IDAsIHZ5OiAwIH07XG5cbmV4cG9ydCBjbGFzcyBHYW1lIHtcbiAgY29uc3RydWN0b3IoeyBwbGF0Zm9ybSwgdmlldywgdWksIGF1ZGlvLCBzYXZlLCBpMThuIH0pIHtcbiAgICB0aGlzLnBsYXRmb3JtID0gcGxhdGZvcm07IHRoaXMudmlldyA9IHZpZXc7IHRoaXMudWkgPSB1aTsgdGhpcy5hdWRpbyA9IGF1ZGlvOyB0aGlzLnNhdmUgPSBzYXZlOyB0aGlzLmkxOG4gPSBpMThuO1xuICAgIHRoaXMuc3RhdGUgPSBcImJvb3RcIjsgICAgICAgLy8gaG9tZSB8IHBsYXkgfCBkeWluZyB8IHdpbm5pbmcgfCB3b24gfCBlbmRcbiAgICB0aGlzLm92ZXJsYXkgPSBudWxsOyAgICAgICAvLyBcIm1hcFwiIHwgXCJzZXR0aW5nc1wiIHdoaWxlIG9uZSBpcyBvcGVuXG4gICAgdGhpcy5pbmRleCA9IC0xOyB0aGlzLnNpbSA9IG51bGw7XG4gICAgdGhpcy5wYXVzZWQgPSBmYWxzZTsgdGhpcy5idXN5ID0gZmFsc2U7IHRoaXMucmFmID0gMDsgdGhpcy5sYXN0ID0gMDsgdGhpcy50ID0gMDtcbiAgICB0aGlzLmFjYyA9IDA7IHRoaXMudGltZVNjYWxlID0gMTsgdGhpcy50aW1lciA9IDA7IHRoaXMucm90YXRlZCA9IDA7IHRoaXMudHV0S2luZCA9IG51bGw7IHRoaXMudHV0VCA9IDA7IHRoaXMuZGVhdGhzSGVyZSA9IDA7XG4gICAgdGhpcy5yZXN1bHQgPSBudWxsOyB0aGlzLnQwID0gLTE7IHRoaXMuZGV2VGhlbWUgPSBudWxsO1xuICAgIHRoaXMuZnBzVCA9IDA7IHRoaXMuZnBzTiA9IDA7XG4gICAgdGhpcy5wbGF5VCA9IDA7IHRoaXMuaGludE9uID0gZmFsc2U7IHRoaXMuX2FoID0gZmFsc2U7IHRoaXMuX2FzID0gZmFsc2U7XG4gICAgdGhpcy5ib3QgPSBudWxsOyAgICAgICAgICAgLy8gZGV2IG9ubHk6IHsgdHJhY2ssIEsgfSByZXBsYXllZCBpbiByZWFsIHRpbWUgKHRyYWlsZXJzLCBkZW1vcylcbiAgICB0aGlzLmlucHV0ID0gbmV3IElucHV0KHZpZXcuY2FudmFzLCB0aGlzKTtcbiAgICB0aGlzLmlucHV0Lm1vZGUgPSBzYXZlLnNldC5jdGw7XG4gICAgdGhpcy5fZnJhbWUgPSB0aGlzLl9mcmFtZS5iaW5kKHRoaXMpO1xuICB9XG5cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGJvb3RcbiAgc3RhcnQoKSB7XG4gICAgY29uc3QgeyBhdWRpbywgcGxhdGZvcm0sIHNhdmUgfSA9IHRoaXM7XG4gICAgYXVkaW8uc2V0TXVzaWMoISFzYXZlLnNldC5tdXNpYyk7IGF1ZGlvLnNldFNmeCghIXNhdmUuc2V0LnNmeCk7XG4gICAgYXVkaW8uc2V0SG9zdChwbGF0Zm9ybS5hdWRpb0VuYWJsZWQoKSk7XG4gICAgcGxhdGZvcm0ub25BdWRpb0NoYW5nZSgob24pID0+IGF1ZGlvLnNldEhvc3Qob24pKTtcbiAgICBwbGF0Zm9ybS5vblBhdXNlKCgpID0+IHRoaXMucGF1c2UoKSk7XG4gICAgcGxhdGZvcm0ub25SZXN1bWUoKCkgPT4gdGhpcy5yZXN1bWUoKSk7XG4gICAgdGhpcy52aWV3LnNldFNraW4oc2F2ZS5za2luKTtcbiAgICBpZiAoc2F2ZS5tYXggPT09IDAgJiYgIXNhdmUuc3RhcnNbMF0pIHRoaXMuc3RhcnRMZXZlbCgwKTsgICAvLyBmaXJzdCBsYXVuY2g6IHN0cmFpZ2h0IGludG8gcGxheVxuICAgIGVsc2UgdGhpcy5nb0hvbWUoKTtcbiAgICB0aGlzLmxhc3QgPSBwZXJmb3JtYW5jZS5ub3coKTtcbiAgICB0aGlzLl9mcmFtZSh0aGlzLmxhc3QpO1xuICB9XG5cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGZsb3dcbiAgX2xvYWQoaSkge1xuICAgIHRoaXMuaW5kZXggPSBpO1xuICAgIGxldCBsdmwgPSBnZXRMZXZlbChpKTtcbiAgICBpZiAodGhpcy5kZXZUaGVtZSkgbHZsID0geyAuLi5sdmwsIHRoZW1lOiB0aGlzLmRldlRoZW1lIH07XG4gICAgdGhpcy5zaW0gPSBuZXcgU2ltKGx2bCk7XG4gICAgdGhpcy52aWV3LmJ1aWxkKGx2bCk7XG4gICAgdGhpcy51aS5zZXRUaGVtZSh0aGVtZU9mKGx2bC50aGVtZSkpO1xuICAgIHRoaXMuYXVkaW8ucGxheU11c2ljKGx2bC50aGVtZSk7XG4gICAgdGhpcy5kZWF0aHNIZXJlID0gMDsgdGhpcy5wbGF5VCA9IDA7IHRoaXMuaGludE9uID0gZmFsc2U7IHRoaXMuX2FoID0gdGhpcy5fYXMgPSBmYWxzZTsgdGhpcy5ib3QgPSBudWxsO1xuICAgIHRoaXMudWkuYXNzaXN0KHsgaGludDogZmFsc2UsIHNraXA6IGZhbHNlLCBza2lwQWQ6IGZhbHNlIH0pO1xuICB9XG5cbiAgZ29Ib21lKCkge1xuICAgIGlmICh0aGlzLmJ1c3kpIHJldHVybjtcbiAgICBpZiAodGhpcy5zdGF0ZSA9PT0gXCJwbGF5XCIgfHwgdGhpcy5zdGF0ZSA9PT0gXCJkeWluZ1wiKSB0aGlzLnBsYXRmb3JtLmdhbWVwbGF5U3RvcChcInF1aXRcIik7XG4gICAgY29uc3QgaSA9IE1hdGgubWluKHRoaXMuc2F2ZS5tYXgsIExFVkVMX0NPVU5UIC0gMSk7XG4gICAgaWYgKHRoaXMuaW5kZXggIT09IGkgfHwgdGhpcy5zdGF0ZSAhPT0gXCJob21lXCIpIHRoaXMuX2xvYWQoaSk7XG4gICAgdGhpcy5zdGF0ZSA9IFwiaG9tZVwiOyB0aGlzLm92ZXJsYXkgPSBudWxsO1xuICAgIHRoaXMubGF5b3V0KCk7XG4gICAgdGhpcy51aS5odWQoZmFsc2UpOyB0aGlzLnVpLnR1dG9yaWFsT2ZmKCk7XG4gICAgdGhpcy51aS5ob21lKHsgbGV2ZWxOdW06IGkgKyAxLCBzdGFyczogdG90YWxTdGFycyh0aGlzLnNhdmUpLCBnZW1zOiB0aGlzLnNhdmUuZ2VtcyB9KTtcbiAgfVxuXG4gIHN0YXJ0TGV2ZWwoaSkge1xuICAgIHRoaXMuX2xvYWQoaSk7XG4gICAgdGhpcy5zdGF0ZSA9IFwicGxheVwiOyB0aGlzLm92ZXJsYXkgPSBudWxsO1xuICAgIHRoaXMuYWNjID0gMDsgdGhpcy50aW1lU2NhbGUgPSAxOyB0aGlzLnJvdGF0ZWQgPSAwOyB0aGlzLnQwID0gLTE7XG4gICAgdGhpcy5sYXlvdXQoKTtcbiAgICB0aGlzLnVpLnNob3cobnVsbCk7IHRoaXMudWkuaHVkKHRydWUpO1xuICAgIHRoaXMudWkuc2V0SHVkKGkgKyAxLCAwLCB0aGlzLnNpbS5sdmwuZ2Vtcy5sZW5ndGgpO1xuICAgIHRoaXMuX3R1dG9yaWFsKCk7XG4gICAgdGhpcy5zYXZlLnN0YXQucGxheXMrKztcbiAgICB0aGlzLnBsYXRmb3JtLmdhbWVwbGF5U3RhcnQoKTtcbiAgfVxuXG4gIHJlc3RhcnQoKSB7XG4gICAgaWYgKHRoaXMuc3RhdGUgIT09IFwicGxheVwiICYmIHRoaXMuc3RhdGUgIT09IFwiZHlpbmdcIikgcmV0dXJuO1xuICAgIHRoaXMuc2ltLnJlc2V0KCk7XG4gICAgY29uc3QgdiA9IHRoaXMudmlldztcbiAgICB2LmJhbGwudmlzaWJsZSA9IHRydWU7IHYuYmFsbFNoYWRvdy52aXNpYmxlID0gdHJ1ZTsgdi5iYWxsU2NhbGUgPSAxOyB2Lnpvb21UbyA9IDE7XG4gICAgdGhpcy5zdGF0ZSA9IFwicGxheVwiOyB0aGlzLmFjYyA9IDA7IHRoaXMudGltZVNjYWxlID0gMTsgdGhpcy50MCA9IC0xO1xuICAgIHRoaXMudWkuc2V0SHVkKHRoaXMuaW5kZXggKyAxLCAwLCB0aGlzLnNpbS5sdmwuZ2Vtcy5sZW5ndGgpO1xuICB9XG5cbiAgLyoqIFJlc2VydmUgc2NyZWVuIHNwYWNlIGZvciB3aGF0ZXZlciBVSSBpcyBzaG93aW5nLCBhbmQgZnJhbWUgdGhlIGFyZW5hIGluIHRoZSByZXN0LiAqL1xuICBsYXlvdXQoKSB7XG4gICAgY29uc3Qgc3QgPSB0aGlzLnZpZXcuc3RhZ2UsIFcgPSBzdC5jbGllbnRXaWR0aCwgSCA9IHN0LmNsaWVudEhlaWdodCwgbGFuZCA9IFcgPiBIICogMS4yO1xuICAgIGlmICh0aGlzLnN0YXRlID09PSBcImhvbWVcIiB8fCB0aGlzLnN0YXRlID09PSBcImJvb3RcIikge1xuICAgICAgdGhpcy52aWV3Lmluc2V0cyA9IGxhbmQgPyB7IHRvcDogMTQsIGJvdHRvbTogMTQsIGxlZnQ6IE1hdGgubWluKFcgKiAwLjQ2LCA0NzApLCByaWdodDogMTAgfVxuICAgICAgICA6IHsgdG9wOiBNYXRoLm1pbigxNDAsIEggKiAwLjE5KSwgYm90dG9tOiBNYXRoLm1pbigyNTAsIEggKiAwLjM2KSwgbGVmdDogMCwgcmlnaHQ6IDAgfTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy52aWV3Lmluc2V0cyA9IGxhbmQgPyB7IHRvcDogNTQsIGJvdHRvbTogMTQsIGxlZnQ6IDAsIHJpZ2h0OiAwIH0gOiB7IHRvcDogNjAsIGJvdHRvbTogODgsIGxlZnQ6IDAsIHJpZ2h0OiAwIH07XG4gICAgfVxuICAgIHRoaXMudmlldy5yZXNpemUoKTtcbiAgfVxuXG4gIF90dXRvcmlhbCgpIHtcbiAgICBjb25zdCBrID0gdGhpcy5zaW0ubHZsLnR1dCwgdCA9IChrZXkpID0+IHRoaXMuaTE4bi50KGtleSk7XG4gICAgdGhpcy50dXRLaW5kID0gbnVsbDtcbiAgICBpZiAoIWsgfHwgdGhpcy5zYXZlLnN0YXJzW3RoaXMuaW5kZXhdKSB7IHRoaXMudWkudHV0b3JpYWxPZmYoKTsgcmV0dXJuOyB9XG4gICAgdGhpcy50dXRLaW5kID0gazsgdGhpcy50dXRUID0gMDtcbiAgICBpZiAoayA9PT0gXCJkcmFnXCIpIHRoaXMudWkudHV0b3JpYWwoXCJzd2lwZVwiLCB0KFwidHV0RHJhZ1wiKSk7XG4gICAgZWxzZSBpZiAoayA9PT0gXCJib3RoXCIpIHRoaXMudWkudHV0b3JpYWwoXCJzd2lwZVwiLCB0KFwidHV0Qm90aFwiKSk7XG4gICAgZWxzZSBpZiAoayA9PT0gXCJmbGlwXCIpIHRoaXMudWkudHV0b3JpYWwoXCJmbGlwXCIsIHQoXCJ0dXRGbGlwXCIpKTtcbiAgICBlbHNlIGlmIChrID09PSBcInNwaWtlc1wiKSB0aGlzLnVpLnR1dG9yaWFsKFwibm90ZVwiLCB0KFwidHV0U3Bpa2VzXCIpKTtcbiAgICBlbHNlIGlmIChrID09PSBcImVkZ2VcIikgdGhpcy51aS50dXRvcmlhbChcIm5vdGVcIiwgdChcInR1dEVkZ2VcIikpO1xuICB9XG5cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGlucHV0IChjYWxsZWQgYnkgSW5wdXQgLyBVSSlcbiAgZ2VzdHVyZSgpIHsgdGhpcy5hdWRpby51bmxvY2soKTsgfVxuICByb3RhdGUoZCkge1xuICAgIGlmICh0aGlzLnN0YXRlICE9PSBcInBsYXlcIiB8fCB0aGlzLm92ZXJsYXkgfHwgdGhpcy5wYXVzZWQpIHJldHVybjtcbiAgICBjb25zdCBzID0gdGhpcy5zaW07XG4gICAgbGV0IHQgPSBzLnRhcmdldCArIGQ7XG4gICAgLy8gZG9uJ3QgbGV0IHRoZSBjb21tYW5kIHJ1biBmYXIgYWhlYWQgb2YgdGhlIHdvcmxkLCBvciBpdCBrZWVwcyBzcGlubmluZyBhZnRlciB0aGUgZmluZ2VyIHN0b3BzXG4gICAgaWYgKHQgPiBzLmFuZ2xlICsgMS4wKSB0ID0gcy5hbmdsZSArIDEuMDsgZWxzZSBpZiAodCA8IHMuYW5nbGUgLSAxLjApIHQgPSBzLmFuZ2xlIC0gMS4wO1xuICAgIHRoaXMucm90YXRlZCArPSBNYXRoLmFicyh0IC0gcy50YXJnZXQpO1xuICAgIHMudGFyZ2V0ID0gdDtcbiAgICBpZiAodGhpcy50MCA8IDApIHRoaXMudDAgPSBzLnRpbWU7ICAgICAgICAgIC8vIHRoZSBjbG9jayBmb3IgdGhlIHRpbWUgc3RhciBzdGFydHMgd2l0aCB0aGUgZmlyc3QgbW92ZVxuICB9XG4gIHRhcCgpIHsgLyogZm9ybXMgYXJyaXZlIGluIHdvcmxkIDIgKi8gfVxuXG4gIC8qKiBTaG93IHRoZSBzb2x2ZXIncyByb3V0ZS4gRnJlZTogYSBzdHVjayBwbGF5ZXIgbGVhdmVzLCBhIGhlbHBlZCBvbmUga2VlcHMgcGxheWluZy4gKi9cbiAgaGludCgpIHtcbiAgICBpZiAodGhpcy5zdGF0ZSAhPT0gXCJwbGF5XCIgJiYgdGhpcy5zdGF0ZSAhPT0gXCJkeWluZ1wiKSByZXR1cm47XG4gICAgdGhpcy5oaW50T24gPSB0cnVlO1xuICAgIHRoaXMudmlldy5zaG93SGludCh0aGlzLnNpbS5sdmwuaGludCk7XG4gICAgdGhpcy5fYXNzaXN0KCk7XG4gIH1cbiAgLyoqIE1vdmUgb24gd2l0aG91dCBmaW5pc2hpbmcgKG9wdC1pbiByZXdhcmRlZCBhZCB3aGVyZSB0aGUgcGxhdGZvcm0gaGFzIGFkcykuICovXG4gIGFzeW5jIHNraXAoKSB7XG4gICAgaWYgKHRoaXMuYnVzeSB8fCB0aGlzLmluZGV4ICsgMSA+PSBMRVZFTF9DT1VOVCB8fCAodGhpcy5zdGF0ZSAhPT0gXCJwbGF5XCIgJiYgdGhpcy5zdGF0ZSAhPT0gXCJkeWluZ1wiKSkgcmV0dXJuO1xuICAgIGlmICh0aGlzLnBsYXRmb3JtLmNhcHMuYWRzKSB7XG4gICAgICB0aGlzLmJ1c3kgPSB0cnVlO1xuICAgICAgY29uc3Qgb2sgPSBhd2FpdCB0aGlzLnBsYXRmb3JtLnJld2FyZGVkKFwic2tpcC1sZXZlbFwiKTtcbiAgICAgIHRoaXMuYnVzeSA9IGZhbHNlO1xuICAgICAgaWYgKCFvaykgeyB0aGlzLnVpLnRvYXN0KHRoaXMuaTE4bi50KFwiYWRGYWlsXCIpKTsgcmV0dXJuOyB9XG4gICAgfVxuICAgIHRoaXMuc2F2ZS5tYXggPSBNYXRoLm1heCh0aGlzLnNhdmUubWF4LCB0aGlzLmluZGV4ICsgMSk7XG4gICAgdGhpcy5wbGF0Zm9ybS5zYXZlKHRoaXMuc2F2ZSk7XG4gICAgdGhpcy5zdGFydExldmVsKHRoaXMuaW5kZXggKyAxKTtcbiAgfVxuICBfYXNzaXN0KCkge1xuICAgIGNvbnN0IGggPSAhdGhpcy5oaW50T24gJiYgISF0aGlzLnNpbS5sdmwuaGludCAmJiAodGhpcy5kZWF0aHNIZXJlID49IEhJTlRfQUZURVIuZGVhdGhzIHx8IHRoaXMucGxheVQgPiBISU5UX0FGVEVSLnNlYyk7XG4gICAgY29uc3QgcyA9IHRoaXMuaW5kZXggKyAxIDwgTEVWRUxfQ09VTlQgJiYgKHRoaXMuZGVhdGhzSGVyZSA+PSBTS0lQX0FGVEVSLmRlYXRocyB8fCB0aGlzLnBsYXlUID4gU0tJUF9BRlRFUi5zZWMpO1xuICAgIGlmIChoID09PSB0aGlzLl9haCAmJiBzID09PSB0aGlzLl9hcykgcmV0dXJuO1xuICAgIHRoaXMuX2FoID0gaDsgdGhpcy5fYXMgPSBzO1xuICAgIHRoaXMudWkuYXNzaXN0KHsgaGludDogaCwgc2tpcDogcywgc2tpcEFkOiB0aGlzLnBsYXRmb3JtLmNhcHMuYWRzIH0pO1xuICB9XG5cbiAgb3BlblNob3AoKSB7IHRoaXMub3ZlcmxheSA9IFwic2hvcFwiOyB0aGlzLnVpLnNob3AoeyBvd25lZDogdGhpcy5zYXZlLnNraW5zLCBjdXJyZW50OiB0aGlzLnNhdmUuc2tpbiwgZ2VtczogdGhpcy5zYXZlLmdlbXMgfSk7IH1cbiAgcGlja1NraW4oaWQpIHtcbiAgICBjb25zdCBzayA9IHNraW5CeUlkKGlkKSwgc3YgPSB0aGlzLnNhdmU7XG4gICAgaWYgKHNrLmlkICE9PSBpZCkgcmV0dXJuO1xuICAgIGlmICghc3Yuc2tpbnMuaW5jbHVkZXMoaWQpKSB7XG4gICAgICBpZiAoc3YuZ2VtcyA8IHNrLmNvc3QpIHsgdGhpcy51aS50b2FzdCh0aGlzLmkxOG4udChcIm5vdEVub3VnaFwiKSk7IHRoaXMuYXVkaW8uY2xpY2soKTsgcmV0dXJuOyB9XG4gICAgICBzdi5nZW1zIC09IHNrLmNvc3Q7IHN2LnNraW5zLnB1c2goaWQpO1xuICAgICAgdGhpcy5hdWRpby5zdGFyKDIpO1xuICAgIH0gZWxzZSB0aGlzLmF1ZGlvLmNsaWNrKCk7XG4gICAgc3Yuc2tpbiA9IGlkO1xuICAgIHRoaXMudmlldy5zZXRTa2luKGlkKTtcbiAgICB0aGlzLnBsYXRmb3JtLnNhdmUoc3YpO1xuICAgIHRoaXMudWkuc2hvcCh7IG93bmVkOiBzdi5za2lucywgY3VycmVudDogc3Yuc2tpbiwgZ2Vtczogc3YuZ2VtcyB9KTtcbiAgfVxuICBhY3Rpb24oKSB7IGlmICh0aGlzLm92ZXJsYXkpIHJldHVybjsgaWYgKHRoaXMuc3RhdGUgPT09IFwid29uXCIpIHRoaXMubmV4dCgpOyBlbHNlIGlmICh0aGlzLnN0YXRlID09PSBcImhvbWVcIikgdGhpcy5zdGFydExldmVsKE1hdGgubWluKHRoaXMuc2F2ZS5tYXgsIExFVkVMX0NPVU5UIC0gMSkpOyB9XG4gIHJlc3RhcnRLZXkoKSB7IGlmICghdGhpcy5vdmVybGF5KSB0aGlzLnJlc3RhcnQoKTsgfVxuICBlc2NhcGUoKSB7IGlmICh0aGlzLm92ZXJsYXkpIHRoaXMuY2xvc2VPdmVybGF5KCk7IH1cbiAgYXJlbmFDZW50ZXIoKSB7IHJldHVybiB0aGlzLnZpZXcudG9TY3JlZW4oMCwgMCwgMCk7IH1cblxuICBvcGVuTWFwKCkge1xuICAgIGlmICgodGhpcy5zdGF0ZSA9PT0gXCJwbGF5XCIgfHwgdGhpcy5zdGF0ZSA9PT0gXCJkeWluZ1wiKSAmJiAhdGhpcy5vdmVybGF5KSB0aGlzLnBsYXRmb3JtLmdhbWVwbGF5U3RvcChcIm1lbnVcIik7XG4gICAgdGhpcy5vdmVybGF5ID0gXCJtYXBcIjtcbiAgICB0aGlzLnVpLm1hcCh7IHN0YXJzOiB0aGlzLnNhdmUuc3RhcnMsIG1heDogTWF0aC5taW4odGhpcy5zYXZlLm1heCwgTEVWRUxfQ09VTlQgLSAxKSwgY291bnQ6IExFVkVMX0NPVU5ULCBjdXJyZW50OiB0aGlzLnN0YXRlID09PSBcInBsYXlcIiA/IHRoaXMuaW5kZXggOiAtMSB9KTtcbiAgfVxuICBvcGVuU2V0dGluZ3MoKSB7IHRoaXMub3ZlcmxheSA9IFwic2V0dGluZ3NcIjsgdGhpcy51aS5zZXR0aW5ncyh0aGlzLnNhdmUuc2V0KTsgfVxuICBjbG9zZU92ZXJsYXkoKSB7XG4gICAgdGhpcy5vdmVybGF5ID0gbnVsbDtcbiAgICBpZiAodGhpcy5zdGF0ZSA9PT0gXCJwbGF5XCIgfHwgdGhpcy5zdGF0ZSA9PT0gXCJkeWluZ1wiKSB7IHRoaXMudWkuc2hvdyhudWxsKTsgdGhpcy5wbGF0Zm9ybS5nYW1lcGxheVN0YXJ0KHRydWUpOyB9XG4gICAgZWxzZSBpZiAodGhpcy5zdGF0ZSA9PT0gXCJ3b25cIikgdGhpcy51aS5zaG93KFwic2NyV2luXCIpO1xuICAgIGVsc2UgaWYgKHRoaXMuc3RhdGUgPT09IFwiZW5kXCIpIHRoaXMudWkuc2hvdyhcInNjckVuZFwiKTtcbiAgICBlbHNlIHRoaXMuZ29Ib21lKCk7XG4gIH1cbiAgc2V0T3B0KGtleSwgdmFsdWUpIHtcbiAgICB0aGlzLnNhdmUuc2V0W2tleV0gPSB2YWx1ZTtcbiAgICBpZiAoa2V5ID09PSBcIm11c2ljXCIpIHRoaXMuYXVkaW8uc2V0TXVzaWMoISF2YWx1ZSk7XG4gICAgZWxzZSBpZiAoa2V5ID09PSBcInNmeFwiKSB7IHRoaXMuYXVkaW8uc2V0U2Z4KCEhdmFsdWUpOyBpZiAodmFsdWUpIHRoaXMuYXVkaW8uY2xpY2soKTsgfVxuICAgIGVsc2UgaWYgKGtleSA9PT0gXCJjdGxcIikgdGhpcy5pbnB1dC5tb2RlID0gdmFsdWU7XG4gICAgdGhpcy5wbGF0Zm9ybS5zYXZlKHRoaXMuc2F2ZSk7XG4gIH1cblxuICBhc3luYyBuZXh0KCkge1xuICAgIGlmICh0aGlzLmJ1c3kgfHwgdGhpcy5zdGF0ZSAhPT0gXCJ3b25cIikgcmV0dXJuO1xuICAgIHRoaXMuYnVzeSA9IHRydWU7XG4gICAgaWYgKHRoaXMuaW5kZXggPj0gRklSU1RfQURfQUZURVIpIGF3YWl0IHRoaXMucGxhdGZvcm0uaW50ZXJzdGl0aWFsKCk7ICAgLy8gbmF0dXJhbCBicmVhayBiZXR3ZWVuIHR3byBsZXZlbHNcbiAgICB0aGlzLmJ1c3kgPSBmYWxzZTtcbiAgICBpZiAodGhpcy5pbmRleCArIDEgPj0gTEVWRUxfQ09VTlQpIHsgdGhpcy5zdGF0ZSA9IFwiZW5kXCI7IHRoaXMudWkuaHVkKGZhbHNlKTsgdGhpcy51aS5zaG93KFwic2NyRW5kXCIpOyB9XG4gICAgZWxzZSB0aGlzLnN0YXJ0TGV2ZWwodGhpcy5pbmRleCArIDEpO1xuICB9XG4gIHJldHJ5KCkgeyBpZiAoIXRoaXMuYnVzeSkgdGhpcy5zdGFydExldmVsKHRoaXMuaW5kZXgpOyB9XG5cbiAgYXN5bmMgZG91YmxlKCkge1xuICAgIGlmICh0aGlzLmJ1c3kgfHwgIXRoaXMucmVzdWx0IHx8IHRoaXMucmVzdWx0LmRvdWJsZWQpIHJldHVybjtcbiAgICB0aGlzLmJ1c3kgPSB0cnVlOyB0aGlzLnVpLmRvdWJsZUJ1c3kodHJ1ZSk7XG4gICAgY29uc3Qgb2sgPSBhd2FpdCB0aGlzLnBsYXRmb3JtLnJld2FyZGVkKFwiZG91YmxlLWdlbXNcIik7XG4gICAgdGhpcy5idXN5ID0gZmFsc2U7IHRoaXMudWkuZG91YmxlQnVzeShmYWxzZSk7XG4gICAgaWYgKCFvaykgeyB0aGlzLnVpLnRvYXN0KHRoaXMuaTE4bi50KFwiYWRGYWlsXCIpKTsgcmV0dXJuOyB9XG4gICAgdGhpcy5yZXN1bHQuZG91YmxlZCA9IHRydWU7XG4gICAgdGhpcy5zYXZlLmdlbXMgKz0gdGhpcy5yZXN1bHQuZ290OyB0aGlzLnNhdmUuZWFybmVkICs9IHRoaXMucmVzdWx0LmdvdDtcbiAgICB0aGlzLnBsYXRmb3JtLnNhdmUodGhpcy5zYXZlKTtcbiAgICB0aGlzLnVpLnNldFdpbkdlbXMoYCR7dGhpcy5yZXN1bHQuZ290fS8ke3RoaXMucmVzdWx0LnRvdGFsfSBcdTAwRDcyYCk7XG4gICAgdGhpcy51aS5kb3VibGVEb25lKCk7XG4gIH1cblxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gcGF1c2UgKGhvc3QtZHJpdmVuKVxuICBwYXVzZSgpIHtcbiAgICBpZiAodGhpcy5wYXVzZWQpIHJldHVybjtcbiAgICB0aGlzLnBhdXNlZCA9IHRydWU7XG4gICAgaWYgKHRoaXMucmFmKSB7IGNhbmNlbEFuaW1hdGlvbkZyYW1lKHRoaXMucmFmKTsgdGhpcy5yYWYgPSAwOyB9XG4gICAgdGhpcy5pbnB1dC5yZXNldCgpO1xuICAgIHRoaXMuYXVkaW8ucGF1c2UoKTtcbiAgICB0aGlzLnVpLnBhdXNlZCh0cnVlKTtcbiAgICB0aGlzLnBsYXRmb3JtLnNhdmUodGhpcy5zYXZlLCB0cnVlKTtcbiAgfVxuICByZXN1bWUoKSB7XG4gICAgaWYgKCF0aGlzLnBhdXNlZCkgcmV0dXJuO1xuICAgIHRoaXMucGF1c2VkID0gZmFsc2U7XG4gICAgdGhpcy51aS5wYXVzZWQoZmFsc2UpO1xuICAgIHRoaXMuYXVkaW8ucmVzdW1lKCk7XG4gICAgdGhpcy5sYXN0ID0gcGVyZm9ybWFuY2Uubm93KCk7XG4gICAgdGhpcy5fZnJhbWUodGhpcy5sYXN0KTtcbiAgfVxuXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBsb29wXG4gIF9mcmFtZShub3cpIHtcbiAgICB0aGlzLnJhZiA9IDA7XG4gICAgaWYgKHRoaXMucGF1c2VkIHx8IHRoaXMubWFudWFsKSByZXR1cm47XG4gICAgY29uc3QgZHQgPSBNYXRoLm1pbigwLjA1LCBNYXRoLm1heCgwLjAwMSwgKG5vdyAtIHRoaXMubGFzdCkgLyAxMDAwKSk7XG4gICAgdGhpcy5sYXN0ID0gbm93OyB0aGlzLnQgKz0gZHQ7XG4gICAgLy8gZnJhbWUtcmF0ZSB3YXRjaGRvZzogdGhyZWUgYmFkIHNlY29uZHMgaW4gYSByb3cgLT4gcmVuZGVyIGZld2VyIHBpeGVsc1xuICAgIHRoaXMuZnBzVCArPSBkdDsgdGhpcy5mcHNOKys7XG4gICAgaWYgKHRoaXMuZnBzVCA+PSAzKSB7IGlmICh0aGlzLmZwc04gLyB0aGlzLmZwc1QgPCA0MikgdGhpcy52aWV3LmRlZ3JhZGUoKTsgdGhpcy5mcHNUID0gMDsgdGhpcy5mcHNOID0gMDsgfVxuICAgIHRoaXMuX3VwZGF0ZShkdCk7XG4gICAgdGhpcy52aWV3LmRyYXcodGhpcy5zaW0sIHRoaXMudCwgZHQpO1xuICAgIHRoaXMucmFmID0gcmVxdWVzdEFuaW1hdGlvbkZyYW1lKHRoaXMuX2ZyYW1lKTtcbiAgfVxuXG4gIF91cGRhdGUoZHQpIHtcbiAgICBjb25zdCBzID0gdGhpcy5zaW07XG4gICAgaWYgKHRoaXMuc3RhdGUgPT09IFwiaG9tZVwiKSB7IHMuYW5nbGUgPSBNYXRoLnNpbih0aGlzLnQgKiAwLjUpICogMC4yOyByZXR1cm47IH1cbiAgICBpZiAodGhpcy5zdGF0ZSA9PT0gXCJwbGF5XCIpIHtcbiAgICAgIGlmICh0aGlzLm92ZXJsYXkpIHJldHVybjtcbiAgICAgIGlmICh0aGlzLmlucHV0LmtleURpcikgdGhpcy5yb3RhdGUoLXRoaXMuaW5wdXQua2V5RGlyICogV01BWCAqIDAuOTUgKiBkdCk7XG4gICAgICB0aGlzLmFjYyArPSBkdCAqIHRoaXMudGltZVNjYWxlO1xuICAgICAgbGV0IG4gPSAwO1xuICAgICAgY29uc3QgYm90ID0gdGhpcy5ib3Q7XG4gICAgICB3aGlsZSAodGhpcy5hY2MgPj0gRFQgJiYgbiA8IDEyKSB7IHMuc3RlcChib3QgPyBib3QudHJhY2tbKHMudGljayAvIGJvdC5LKSB8IDBdIHx8IDAgOiB1bmRlZmluZWQpOyB0aGlzLmFjYyAtPSBEVDsgbisrOyBpZiAoIXMuYWxpdmUgfHwgcy53b24pIGJyZWFrOyB9XG4gICAgICBpZiAobiA9PT0gMTIpIHRoaXMuYWNjID0gMDtcbiAgICAgIHRoaXMuX2V2ZW50cygpO1xuICAgICAgaWYgKHRoaXMuc3RhdGUgPT09IFwicGxheVwiKSB7XG4gICAgICAgIHRoaXMucGxheVQgKz0gZHQ7XG4gICAgICAgIHRoaXMuX2Fzc2lzdCgpO1xuICAgICAgICB0aGlzLl9kYW5nZXIoZHQpO1xuICAgICAgICB0aGlzLmF1ZGlvLnJvbGwoTWF0aC5oeXBvdChzLnZ4LCBzLnZ5KSwgcy5haXIgPCAzKTtcbiAgICAgICAgdGhpcy5fdHV0VGljayhkdCk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmICh0aGlzLnN0YXRlID09PSBcImR5aW5nXCIpIHtcbiAgICAgIHRoaXMudGltZXIgLT0gZHQ7XG4gICAgICBpZiAodGhpcy50aW1lciA8PSAwKSB0aGlzLnJlc3RhcnQoKTtcbiAgICB9IGVsc2UgaWYgKHRoaXMuc3RhdGUgPT09IFwid2lubmluZ1wiKSB7XG4gICAgICB0aGlzLnRpbWVyIC09IGR0O1xuICAgICAgdGhpcy52aWV3LmJhbGxTY2FsZSA9IE1hdGgubWF4KDAsIHRoaXMudGltZXIgLyAwLjQ1KTtcbiAgICAgIGlmICh0aGlzLnRpbWVyIDw9IDApIHsgdGhpcy5zdGF0ZSA9IFwid29uXCI7IHRoaXMudmlldy5iYWxsLnZpc2libGUgPSBmYWxzZTsgdGhpcy52aWV3LmJhbGxTaGFkb3cudmlzaWJsZSA9IGZhbHNlOyB0aGlzLl9zaG93V2luKCk7IH1cbiAgICB9XG4gIH1cblxuICBfZXZlbnRzKCkge1xuICAgIGNvbnN0IHMgPSB0aGlzLnNpbSwgdiA9IHRoaXMudmlldywgYSA9IHRoaXMuYXVkaW8sIGV2ID0gcy5ldmVudHM7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBldi5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgZSA9IGV2W2ldO1xuICAgICAgaWYgKGUudCA9PT0gXCJoaXRcIikgeyB2LmZ4SGl0KGUueCwgZS55LCBlLnYpOyBhLmhpdChlLnYpOyB9XG4gICAgICBlbHNlIGlmIChlLnQgPT09IFwiZ2VtXCIpIHsgdi5meEdlbShlLngsIGUueSk7IGEuZ2VtKHMuZ2VtQ291bnQgLSAxKTsgdGhpcy51aS5zZXRIdWQodGhpcy5pbmRleCArIDEsIHMuZ2VtQ291bnQsIHMubHZsLmdlbXMubGVuZ3RoKTsgfVxuICAgICAgZWxzZSBpZiAoZS50ID09PSBcImJ1bXBcIikgeyB2LmZ4QnVtcChlLngsIGUueSk7IGEuYnVtcCgpOyB9XG4gICAgICBlbHNlIGlmIChlLnQgPT09IFwicGFkXCIpIHsgdi5meFBhZChlLngsIGUueSk7IGEucGFkKCk7IH1cbiAgICAgIGVsc2UgaWYgKGUudCA9PT0gXCJzaGF0dGVyXCIpIHsgdi5meFNoYXR0ZXIoZS54LCBlLnkpOyBhLnNoYXR0ZXIoKTsgfVxuICAgICAgZWxzZSBpZiAoZS50ID09PSBcImRpZVwiKSB0aGlzLl9kaWUoKTtcbiAgICAgIGVsc2UgaWYgKGUudCA9PT0gXCJ3aW5cIikgdGhpcy5fd2luKCk7XG4gICAgfVxuICAgIGV2Lmxlbmd0aCA9IDA7XG4gIH1cblxuICAvKiogQnVsbGV0LXRpbWUgd2hlbiB0aGUgYmFsbCBpcyBhYm91dCB0byB0b3VjaCBzb21ldGhpbmcgZGVhZGx5LiAqL1xuICBfZGFuZ2VyKGR0KSB7XG4gICAgY29uc3QgcyA9IHRoaXMuc2ltLCBMID0gcy5sdmwsIHIgPSBzLmZvcm0ucjtcbiAgICBsZXQgZCA9IDFlOTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IEwua2lsbHMubGVuZ3RoOyBpKyspIHsgY29uc3QgcSA9IGJveERpc3QyKHMueCwgcy55LCBMLmtpbGxzW2ldKTsgaWYgKHEgPCBkKSBkID0gcTsgfVxuICAgIGQgPSBNYXRoLnNxcnQoZCk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBMLnNhd3MubGVuZ3RoOyBpKyspIHsgcGF0aFBvcyhMLnNhd3NbaV0sIHMudGltZSwgX3ApOyBjb25zdCBxID0gTWF0aC5oeXBvdChzLnggLSBfcC54LCBzLnkgLSBfcC55KSAtIEwuc2F3c1tpXS5yOyBpZiAocSA8IGQpIGQgPSBxOyB9XG4gICAgY29uc3QgbmVhciA9IGQgPCByICsgMTQgJiYgTWF0aC5oeXBvdChzLnZ4LCBzLnZ5KSA+IDcwO1xuICAgIHRoaXMudGltZVNjYWxlICs9ICgobmVhciA/IDAuNiA6IDEpIC0gdGhpcy50aW1lU2NhbGUpICogTWF0aC5taW4oMSwgZHQgKiAxMCk7XG4gIH1cblxuICBfdHV0VGljayhkdCkge1xuICAgIGlmICghdGhpcy50dXRLaW5kKSByZXR1cm47XG4gICAgdGhpcy50dXRUICs9IGR0O1xuICAgIGNvbnN0IGsgPSB0aGlzLnR1dEtpbmQ7XG4gICAgY29uc3QgZG9uZSA9IChrID09PSBcImRyYWdcIiB8fCBrID09PSBcImJvdGhcIikgPyB0aGlzLnJvdGF0ZWQgPiAwLjcgOiBrID09PSBcImZsaXBcIiA/IE1hdGguYWJzKHRoaXMuc2ltLmFuZ2xlKSA+IDIuMiA6IHRoaXMudHV0VCA+IDMuNTtcbiAgICBpZiAoZG9uZSkgeyB0aGlzLnR1dEtpbmQgPSBudWxsOyB0aGlzLnVpLnR1dG9yaWFsT2ZmKCk7IH1cbiAgfVxuXG4gIF9kaWUoKSB7XG4gICAgY29uc3QgcyA9IHRoaXMuc2ltLCB2ID0gdGhpcy52aWV3O1xuICAgIHRoaXMuc3RhdGUgPSBcImR5aW5nXCI7IHRoaXMudGltZXIgPSAwLjY7XG4gICAgdi5iYWxsLnZpc2libGUgPSBmYWxzZTsgdi5iYWxsU2hhZG93LnZpc2libGUgPSBmYWxzZTtcbiAgICB2LmZ4RGllKHMueCwgcy55KTtcbiAgICB0aGlzLmF1ZGlvLmRpZSgpOyB0aGlzLmF1ZGlvLnJvbGwoMCwgZmFsc2UpO1xuICAgIHRoaXMuc2F2ZS5zdGF0LmRlYXRocysrOyB0aGlzLmRlYXRoc0hlcmUrKztcbiAgICB0aGlzLl9hc3Npc3QoKTtcbiAgfVxuXG4gIF93aW4oKSB7XG4gICAgY29uc3QgcyA9IHRoaXMuc2ltLCBMID0gcy5sdmwsIHN2ID0gdGhpcy5zYXZlLCBpID0gdGhpcy5pbmRleDtcbiAgICB0aGlzLnN0YXRlID0gXCJ3aW5uaW5nXCI7IHRoaXMudGltZXIgPSAwLjQ1O1xuICAgIHRoaXMudmlldy5meFdpbihMLmdvYWwueCwgTC5nb2FsLnkpO1xuICAgIHRoaXMuYXVkaW8ud2luKCk7IHRoaXMuYXVkaW8ucm9sbCgwLCBmYWxzZSk7XG4gICAgdGhpcy51aS50dXRvcmlhbE9mZigpO1xuICAgIGNvbnN0IHRvdGFsID0gTC5nZW1zLmxlbmd0aCwgZ290ID0gcy5nZW1Db3VudCwgdGltZSA9IE1hdGgubWF4KDAuMSwgcy50aW1lIC0gTWF0aC5tYXgoMCwgdGhpcy50MCkpO1xuICAgIGNvbnN0IGZhc3QgPSB0aW1lIDw9IEwucGFyLCBhbGwgPSBnb3QgPT09IHRvdGFsO1xuICAgIGNvbnN0IHN0YXJzID0gMSArIChhbGwgfHwgZmFzdCA/IDEgOiAwKSArIChhbGwgJiYgZmFzdCA/IDEgOiAwKTtcbiAgICBzdi5zdGFyc1tpXSA9IE1hdGgubWF4KHN2LnN0YXJzW2ldIHx8IDAsIHN0YXJzKTtcbiAgICBjb25zdCB0ZW50aHMgPSBNYXRoLnJvdW5kKHRpbWUgKiAxMCk7XG4gICAgc3YuYmVzdFtpXSA9IHN2LmJlc3RbaV0gPyBNYXRoLm1pbihzdi5iZXN0W2ldLCB0ZW50aHMpIDogdGVudGhzO1xuICAgIGlmIChpICsgMSA8IExFVkVMX0NPVU5UKSBzdi5tYXggPSBNYXRoLm1heChzdi5tYXgsIGkgKyAxKTtcbiAgICBzdi5nZW1zICs9IGdvdDsgc3YuZWFybmVkICs9IGdvdDsgc3Yuc3RhdC53aW5zKys7XG4gICAgZm9yIChsZXQgayA9IDA7IGsgPCBzdi5zdGFycy5sZW5ndGg7IGsrKykgaWYgKHN2LnN0YXJzW2tdID09PSB1bmRlZmluZWQpIHN2LnN0YXJzW2tdID0gMDsgICAvLyBrZWVwIHRoZSBhcnJheSBkZW5zZSBmb3IgSlNPTlxuICAgIHRoaXMucmVzdWx0ID0geyBzdGFycywgdGltZSwgcGFyOiBMLnBhciwgZ290LCB0b3RhbCwgZG91YmxlZDogZmFsc2UgfTtcbiAgICB0aGlzLnBsYXRmb3JtLnNhdmUoc3YpO1xuICAgIHRoaXMucGxhdGZvcm0uc2NvcmUodG90YWxTdGFycyhzdikpO1xuICAgIGlmIChzdGFycyA9PT0gMykgdGhpcy5wbGF0Zm9ybS5oYXBweSgpOyAgICAgICAgLy8gcG9ydGFscyB3YW50IHRoaXMgc3BhcmluZ2x5LCBub3Qgb24gZXZlcnkgd2luXG4gICAgdGhpcy5wbGF0Zm9ybS5nYW1lcGxheVN0b3AoXCJ3aW5cIik7XG4gIH1cblxuICBfc2hvd1dpbigpIHtcbiAgICBjb25zdCByID0gdGhpcy5yZXN1bHQ7XG4gICAgdGhpcy51aS5odWQoZmFsc2UpO1xuICAgIHRoaXMudWkud2luKHsgLi4uciwgY2FuRG91YmxlOiB0aGlzLnBsYXRmb3JtLmNhcHMuYWRzICYmIHIuZ290ID4gMCwgb25TdGFyOiAoaSkgPT4gdGhpcy5hdWRpby5zdGFyKGkpIH0pO1xuICB9XG5cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGRldiAvIHRlc3QgaG9va3MgKHN0cmlwcGVkIGZyb20gcGxhdGZvcm0gYnVpbGRzKVxuICBkZXZBcGkoKSB7XG4gICAgY29uc3QgZyA9IHRoaXM7XG4gICAgcmV0dXJuIHtcbiAgICAgIGdhbWU6IGcsXG4gICAgICBzdGFydDogKGkpID0+IGcuc3RhcnRMZXZlbChpKSxcbiAgICAgIHN0YXRlOiAoKSA9PiAoeyBzdGF0ZTogZy5zdGF0ZSwgaW5kZXg6IGcuaW5kZXgsIG92ZXJsYXk6IGcub3ZlcmxheSwgcGF1c2VkOiBnLnBhdXNlZCwgeDogZy5zaW0ueCwgeTogZy5zaW0ueSwgYW5nbGU6IGcuc2ltLmFuZ2xlLCBnZW1zOiBnLnNpbS5nZW1Db3VudCwgYWxpdmU6IGcuc2ltLmFsaXZlLCB3b246IGcuc2ltLndvbiwgdGltZTogZy5zaW0udGltZSwgc2F2ZTogZy5zYXZlLCBpbmZvOiBnLnZpZXcuaW5mbygpIH0pLFxuICAgICAgLyoqIGFkdmFuY2UgdGhlIHNpbSBuIHRpY2tzIHdpdGggc3BpbiBjb21tYW5kIHUsIHRoZW4gbGV0IHRoZSBnYW1lIHJlYWN0ICovXG4gICAgICBzdGVwOiAobiwgdSA9IDApID0+IHsgZm9yIChsZXQgayA9IDA7IGsgPCBuICYmIGcuc2ltLmFsaXZlICYmICFnLnNpbS53b247IGsrKykgZy5zaW0uc3RlcCh1KTsgZy5fZXZlbnRzKCk7IH0sXG4gICAgICBzZXR0bGU6IChzZWMpID0+IHsgZy5fdXBkYXRlKHNlYyk7IH0sXG4gICAgICAvKiogcmVwbGF5IGEgc29sdmVyIHRyYWNrIGluIHJlYWwgdGltZSBvbiB0aGUgY3VycmVudCBsZXZlbCAqL1xuICAgICAgYm90OiAodHJhY2ssIEspID0+IHsgZy5ib3QgPSB0cmFjayA/IHsgdHJhY2ssIEsgfSA6IG51bGw7IGcudDAgPSAwOyB9LFxuICAgICAgLyoqIGZyYW1lLWJ5LWZyYW1lIG1vZGUgZm9yIHZpZGVvIGNhcHR1cmU6IHN0b3AgdGhlIHJlYWwtdGltZSBsb29wLCB0aGVuIGFkdmFuY2Ugd2l0aCBmcmFtZShkdCkgKi9cbiAgICAgIG1hbnVhbDogKG9uKSA9PiB7IGcubWFudWFsID0gb247IGlmICghb24pIHsgZy5sYXN0ID0gcGVyZm9ybWFuY2Uubm93KCk7IGcuX2ZyYW1lKGcubGFzdCk7IH0gfSxcbiAgICAgIGZyYW1lOiAoZHQpID0+IHsgZy50ICs9IGR0OyBnLl91cGRhdGUoZHQpOyBnLnZpZXcuZHJhdyhnLnNpbSwgZy50LCBkdCk7IH0sXG4gICAgICBsZXZlbENvdW50OiBMRVZFTF9DT1VOVFxuICAgIH07XG4gIH1cbn1cbiIsICIvLyBFbnRyeSBwb2ludC4gQm9vdCBvcmRlciBtYXR0ZXJzIG9uIFlvdVR1YmUgUGxheWFibGVzOlxuLy8gICBsb2FkaW5nIHNjcmVlbiB2aXNpYmxlIC0+IGZpcnN0RnJhbWVSZWFkeSAtPiBsb2FkRGF0YSAtPiBidWlsZCAtPiBnYW1lUmVhZHkgKGludGVyYWN0aXZlKVxuLyogZ2xvYmFsIF9fREVWX18gKi9cbmltcG9ydCBwbGF0Zm9ybSBmcm9tIFwiQHBsYXRmb3JtXCI7XG5pbXBvcnQgeyBtaWdyYXRlIH0gZnJvbSBcIi4vbWV0YS9zYXZlLmpzXCI7XG5pbXBvcnQgeyBJMThuIH0gZnJvbSBcIi4vaTE4bi9zdHJpbmdzLmpzXCI7XG5pbXBvcnQgeyBWaWV3LCBkZXRlY3RUaWVyIH0gZnJvbSBcIi4vcmVuZGVyL3ZpZXcuanNcIjtcbmltcG9ydCB7IFVJIH0gZnJvbSBcIi4vdWkvdWkuanNcIjtcbmltcG9ydCB7IEdhbWVBdWRpbyB9IGZyb20gXCIuL2F1ZGlvL2F1ZGlvLmpzXCI7XG5pbXBvcnQgeyBHYW1lIH0gZnJvbSBcIi4vZ2FtZS5qc1wiO1xuXG5hc3luYyBmdW5jdGlvbiBib290KCkge1xuICBwbGF0Zm9ybS5sb2FkaW5nU2hvd24oKTsgICAgICAgICAgICAgICAgIC8vIHRoZSBsb2FkaW5nIHNjcmVlbiBpcyBwbGFpbiBIVE1MLCBhbHJlYWR5IG9uIHNjcmVlblxuXG4gIGNvbnN0IGkxOG4gPSBuZXcgSTE4bigpO1xuICBsZXQgcmF3ID0gbnVsbCwgbGFuZyA9IFwiZW5cIjtcbiAgdHJ5IHsgW3JhdywgbGFuZ10gPSBhd2FpdCBQcm9taXNlLmFsbChbcGxhdGZvcm0ubG9hZCgpLCBwbGF0Zm9ybS5sYW5ndWFnZSgpXSk7IH0gY2F0Y2ggKF8pIHsgLyogcGxheSB3aXRoIGRlZmF1bHRzICovIH1cbiAgaTE4bi5zZXQobGFuZyk7XG4gIGNvbnN0IHNhdmUgPSBtaWdyYXRlKHJhdyk7XG5cbiAgbGV0IGdhbWUgPSBudWxsO1xuICBjb25zdCBnID0gKG5hbWUpID0+ICguLi5hKSA9PiB7IGlmIChnYW1lKSByZXR1cm4gZ2FtZVtuYW1lXSguLi5hKTsgfTtcbiAgY29uc3QgdWkgPSBuZXcgVUkoaTE4biwge1xuICAgIHBsYXk6IGcoXCJhY3Rpb25cIiksIG5leHQ6IGcoXCJuZXh0XCIpLCByZXRyeTogZyhcInJldHJ5XCIpLCBvcGVuTWFwOiBnKFwib3Blbk1hcFwiKSwgcGljazogZyhcInN0YXJ0TGV2ZWxcIiksXG4gICAgb3BlblNldHRpbmdzOiBnKFwib3BlblNldHRpbmdzXCIpLCBjbG9zZU92ZXJsYXk6IGcoXCJjbG9zZU92ZXJsYXlcIiksIGRvdWJsZTogZyhcImRvdWJsZVwiKSwgcmVzdGFydDogZyhcInJlc3RhcnRcIiksXG4gICAgc2V0T3B0OiBnKFwic2V0T3B0XCIpLCBnZXN0dXJlOiBnKFwiZ2VzdHVyZVwiKSwgb3BlblNob3A6IGcoXCJvcGVuU2hvcFwiKSwgcGlja1NraW46IGcoXCJwaWNrU2tpblwiKSwgaGludDogZyhcImhpbnRcIiksIHNraXA6IGcoXCJza2lwXCIpLCBob21lOiBnKFwiZ29Ib21lXCIpXG4gIH0pO1xuXG4gIGNvbnN0IHN0YWdlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzdGFnZVwiKTtcbiAgbGV0IHRpZXIgPSBkZXRlY3RUaWVyKCksIHN0YXJ0QXQgPSAtMTtcbiAgaWYgKF9fREVWX18pIHtcbiAgICBjb25zdCBxcyA9IG5ldyBVUkxTZWFyY2hQYXJhbXMobG9jYXRpb24uc2VhcmNoKTtcbiAgICBpZiAocXMuaGFzKFwidGllclwiKSkgdGllciA9IE1hdGgubWF4KDAsIE1hdGgubWluKDIsIHFzLmdldChcInRpZXJcIikgfCAwKSk7XG4gICAgaWYgKHFzLmhhcyhcImxldmVsXCIpKSBzdGFydEF0ID0gKHFzLmdldChcImxldmVsXCIpIHwgMCkgLSAxO1xuICAgIGlmIChxcy5nZXQoXCJjdGxcIikgPT09IFwiZ3JhYlwiIHx8IHFzLmdldChcImN0bFwiKSA9PT0gXCJzd2lwZVwiKSBzYXZlLnNldC5jdGwgPSBxcy5nZXQoXCJjdGxcIik7XG4gIH1cblxuICBsZXQgdmlldztcbiAgdHJ5IHsgdmlldyA9IG5ldyBWaWV3KHN0YWdlLCB0aWVyKTsgfVxuICBjYXRjaCAoXykgeyB1aS5lcnJvcigpOyBwbGF0Zm9ybS5sb2dFcnJvcigpOyBwbGF0Zm9ybS5yZWFkeSgpOyByZXR1cm47IH1cblxuICBnYW1lID0gbmV3IEdhbWUoeyBwbGF0Zm9ybSwgdmlldywgdWksIGF1ZGlvOiBuZXcgR2FtZUF1ZGlvKCksIHNhdmUsIGkxOG4gfSk7XG4gIGlmIChfX0RFVl9fKSBnYW1lLmRldlRoZW1lID0gbmV3IFVSTFNlYXJjaFBhcmFtcyhsb2NhdGlvbi5zZWFyY2gpLmdldChcInRoZW1lXCIpO1xuICBjb25zdCBmaXQgPSAoKSA9PiBnYW1lLmxheW91dCgpO1xuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcInJlc2l6ZVwiLCBmaXQpO1xuICBpZiAod2luZG93LlJlc2l6ZU9ic2VydmVyKSBuZXcgUmVzaXplT2JzZXJ2ZXIoZml0KS5vYnNlcnZlKHN0YWdlKTtcbiAgZ2FtZS5zdGFydCgpO1xuICBpZiAoX19ERVZfXykge1xuICAgIHdpbmRvdy5fX2Z3ID0gZ2FtZS5kZXZBcGkoKTtcbiAgICBpZiAoc3RhcnRBdCA+PSAwKSBnYW1lLnN0YXJ0TGV2ZWwoTWF0aC5taW4oc3RhcnRBdCwgd2luZG93Ll9fZncubGV2ZWxDb3VudCAtIDEpKTtcbiAgfVxuICBwbGF0Zm9ybS5yZWFkeSgpOyAgICAgICAgICAgICAgICAgICAgICAgIC8vIG1lbnVzIC8gZmlyc3QgbGV2ZWwgYXJlIGludGVyYWN0aXZlIG5vd1xufVxuXG5ib290KCk7XG4iXSwKICAibWFwcGluZ3MiOiAiOztBQUdBLE1BQU0sTUFBTTtBQUNaLE1BQU0sS0FBSyxJQUFJLGdCQUFnQixTQUFTLE1BQU07QUFDOUMsTUFBSSxVQUFVO0FBQWQsTUFBb0IsV0FBVztBQUUvQixXQUFTLE9BQU8sT0FBTyxJQUFJO0FBRXpCLFdBQU8sSUFBSSxRQUFRLENBQUMsWUFBWTtBQUM5QixVQUFJLFFBQVMsU0FBUTtBQUNyQixZQUFNLEtBQUssU0FBUyxjQUFjLEtBQUs7QUFDdkMsU0FBRyxZQUFZO0FBQVUsU0FBRyxjQUFjO0FBQzFDLGVBQVMsS0FBSyxZQUFZLEVBQUU7QUFDNUIsaUJBQVcsTUFBTTtBQUFFLFdBQUcsT0FBTztBQUFHLFlBQUksU0FBVSxVQUFTO0FBQUcsZ0JBQVEsSUFBSTtBQUFBLE1BQUcsR0FBRyxFQUFFO0FBQUEsSUFDaEYsQ0FBQztBQUFBLEVBQ0g7QUFFQSxNQUFPLGdCQUFRO0FBQUEsSUFDYixJQUFJO0FBQUEsSUFDSixNQUFNLEVBQUUsS0FBSyxHQUFHLElBQUksS0FBSyxNQUFNLEtBQUssY0FBYyxLQUFLO0FBQUEsSUFFdkQsZUFBZTtBQUFBLElBQUM7QUFBQSxJQUNoQixRQUFRO0FB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TUFDdEMsUUFBUTtBQUFBLE1BQVUsUUFBUTtBQUFBLE1BQVUsT0FBTztBQUFBLE1BQzNDLFNBQVM7QUFBQSxNQUFVLFVBQVU7QUFBQSxNQUFVLFdBQVc7QUFBQSxNQUNsRCxLQUFLO0FBQUEsTUFBVSxLQUFLO0FBQUEsTUFBVSxTQUFTO0FBQUEsTUFBVSxRQUFRO0FBQUEsTUFBVSxZQUFZO0FBQUEsTUFDL0UsT0FBTztBQUFBLE1BQVUsV0FBVztBQUFBLE1BQVUsV0FBVztBQUFBLE1BQ2pELEtBQUs7QUFBQSxNQUFVLE1BQU07QUFBQSxNQUFVLFVBQVU7QUFBQSxNQUN6QyxPQUFPO0FBQUEsTUFBVSxXQUFXO0FBQUEsTUFBVSxTQUFTO0FBQUEsTUFBVSxLQUFLO0FBQUEsTUFBVSxVQUFVO0FBQUEsTUFBVSxLQUFLO0FBQUEsTUFBVSxTQUFTO0FBQUEsTUFDcEgsUUFBUTtBQUFBLE1BQVUsU0FBUztBQUFBLE1BQUssU0FBUztBQUFBLE1BQU0sS0FBSztBQUFBLE1BQU0sT0FBTztBQUFBLElBQ25FO0FBQUEsSUFDQSxLQUFLO0FBQUEsTUFDSCxNQUFNO0FBQUEsTUFBTyxJQUFJLENBQUMsV0FBVyxTQUFTO0FBQUEsTUFDdEMsUUFBUTtBQUFBLE1BQVUsUUFBUTtBQUFBLE1BQVUsT0FBTztBQUFBLE1BQzNDLFNBQVM7QUFBQSxNQUFVLFVBQVU7QUFBQSxNQUFVLFdBQVc7QUFBQSxNQUNsRCxLQUFLO0FBQUEsTUFBVSxLQUFLO0FBQUEsTUFBVSxTQUFTO0FBQUEsTUFBVSxRQUFRO0FBQUEsTUFBVSxZQUFZO0FBQUEsTUFDL0UsT0FBTztBQUFBLE1BQVUsV0FBVztBQUFBLE1BQVUsV0FBVztBQUFBLE1BQ2pELEtBQUs7QUFBQSxNQUFVLE1BQU07QUFBQSxNQUFVLFVBQVU7QUFBQSxNQUN6QyxPQUFPO0FBQUEsTUFBVSxXQUFXO0FBQUEsTUFBVSxTQUFTO0FBQUEsTUFBVSxLQUFLO0FBQUEsTUFBVSxVQUFVO0FBQUEsTUFBVSxLQUFLO0FBQUEsTUFBVSxTQUFTO0FBQUEsTUFDcEgsUUFBUTtBQUFBLE1BQVUsU0FBUztBQUFBLE1BQUssU0FBUztBQUFBLE1BQU0sS0FBSztBQUFBLE1BQU0sT0FBTztBQUFBLElBQ25FO0FBQUEsSUFDQSxTQUFTO0FBQUEsTUFDUCxNQUFNO0FBQUEsTUFBTyxJQUFJLENBQUMsV0FBVyxTQUFTO0FBQUEsTUFDdEMsUUFBUTtBQUFBLE1BQVUsUUFBUTtBQUFBLE1BQVUsT0FBTztBQUFBLE1BQzNDLFNBQVM7QUFBQSxNQUFVLFVBQVU7QUFBQSxNQUFVLFdBQVc7QUFBQSxNQUNsRCxLQUFLO0FBQUEsTUFBVSxLQUFLO0FBQUEsTUFBVSxTQUFTO0FBQUEsTUFBVSxRQUFRO0FBQUEsTUFBVSxZQUFZO0FBQUEsTUFDL0UsT0FBTztBQUFBLE1BQVUsV0FBVztBQUFBLE1BQVUsV0FBVztBQUFBLE1BQ2pELEtBQUs7QUFBQSxNQUFVLE1BQU07QUFBQSxNQUFVLFVBQVU7QUFBQSxNQUN6QyxPQUFPO0FBQUEsTUFBVSxXQUFXO0FBQUEsTUFBVSxTQUFTO0FBQUEsTUFBVSxLQUFLO0FBQUEsTUFBVSxVQUFVO0FBQUEsTUFBVSxLQUFLO0FBQUEsTUFBVSxTQUFTO0FBQUEsTUFDcEgsUUFBUTtBQUFBLE1BQVUsU0FBUztBQUFBLE1BQU0sU0FBUztBQUFBLE1BQU0sS0FBSztBQUFBLE1BQU0sT0FBTztBQUFBLElBQ3BFO0FBQUEsSUFDQSxNQUFNO0FBQUEsTUFDSixNQUFNO0FBQUEsTUFBTSxJQUFJLENBQUMsV0FBVyxTQUFTO0FBQUEsTUFDckMsUUFBUTtBQUFBLE1BQVUsUUFBUTtBQUFBLE1BQVUsT0FBTztBQUFBLE1BQzNDLFNBQVM7QUFBQSxNQUFVLFVBQVU7QUFBQSxNQUFVLFdBQVc7QUFBQSxNQUNsRCxLQUFLO0FBQUEsTUFBVSxLQUFLO0FBQUEsTUFBVSxTQUFTO0FBQUEsTUFBVSxRQUFRO0FBQUEsTUFBVSxZQUFZO0FBQUEsTUFDL0UsT0FBTztBQUFBLE1BQVUsV0FBVztBQUFBLE1BQVUsV0FBVztBQUFBLE1BQ2pELEtBQUs7QUFBQSxNQUFVLE1BQU07QUFBQSxNQUFVLFVBQVU7QUFBQSxNQUN6QyxPQUFPO0FBQUEsTUFBVSxXQUFXO0FBQUEsTUFBVSxTQUFTO0FBQUEsTUFBVSxLQUFLO0FBQUEsTUFBVSxVQUFVO0FBQUEsTUFBVSxLQUFLO0FBQUEsTUFBVSxTQUFTO0FBQUEsTUFDcEgsUUFBUTtBQUFBLE1BQVUsU0FBUztBQUFBLE1BQU0sU0FBUztBQUFBLE1BQU0sS0FBSztBQUFBLE1BQUssT0FBTztBQUFBLElBQ25FO0FBQUEsRUFDRjtBQUVPLFdBQVMsUUFBUSxJQUFJO0FBQUUsV0FBTyxPQUFPLEVBQUUsS0FBSyxPQUFPO0FBQUEsRUFBUTs7O0FDbkQzRCxXQUFTLFVBQVUsSUFBSSxJQUFJLEtBQUssTUFBTSxHQUFHO0FBQzlDLFVBQU0sS0FBSyxJQUFJLE1BQU0sS0FBSyxJQUFJLEtBQUssSUFBSSxFQUFFLENBQUM7QUFDMUMsVUFBTSxNQUFNLENBQUM7QUFDYixVQUFNLFVBQVUsQ0FBQyxDQUFDLEtBQUssS0FBSyxLQUFLLEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBRSxLQUFLLE1BQU0sS0FBSyxLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUUsS0FBSyxNQUFNLEVBQUUsS0FBSyxNQUFNLENBQUMsR0FBRyxDQUFDLEtBQUssS0FBSyxFQUFFLEtBQUssTUFBTSxDQUFDLENBQUM7QUFDL0gsZUFBVyxDQUFDLElBQUksSUFBSSxDQUFDLEtBQUssU0FBUztBQUNqQyxlQUFTLElBQUksR0FBRyxLQUFLLEtBQUssS0FBSztBQUM3QixjQUFNLEtBQUssSUFBSSxJQUFJLE9BQU8sS0FBSyxLQUFLO0FBQ3BDLFlBQUksS0FBSyxDQUFDLEtBQUssS0FBSyxJQUFJLENBQUMsSUFBSSxLQUFLLEtBQUssS0FBSyxJQUFJLENBQUMsSUFBSSxHQUFHLENBQUM7QUFBQSxNQUMzRDtBQUFBLElBQ0Y7QUFDQSxXQUFPO0FBQUEsRUFDVDtBQUVPLFdBQVMsVUFBVSxHQUFHLElBQUksSUFBSTtBQUNuQyxVQUFNLE1BQU0sQ0FBQztBQUNiLGFBQVMsSUFBSSxHQUFHLElBQUksR0FBRyxLQUFLO0FBQUUsWUFBTSxJQUFLLElBQUksSUFBSyxLQUFLLEtBQUs7QUFBRyxVQUFJLEtBQUssQ0FBQyxLQUFLLElBQUksQ0FBQyxJQUFJLEdBQUcsS0FBSyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7QUFBQSxJQUFHO0FBQzdHLFdBQU87QUFBQSxFQUNUO0FBRU8sV0FBUyxRQUFRLEdBQUcsUUFBUSxJQUFJLFFBQVEsTUFBTTtBQUNuRCxVQUFNLE1BQU0sQ0FBQztBQUNiLGFBQVMsSUFBSSxHQUFHLElBQUksUUFBUSxHQUFHLEtBQUs7QUFBRSxZQUFNLElBQUssS0FBSyxRQUFRLEtBQU0sS0FBSyxLQUFLLEdBQUcsS0FBSyxJQUFJLElBQUksSUFBSSxRQUFRO0FBQUcsVUFBSSxLQUFLLENBQUMsS0FBSyxJQUFJLENBQUMsSUFBSSxJQUFJLEtBQUssSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO0FBQUEsSUFBRztBQUM3SixXQUFPO0FBQUEsRUFDVDtBQUVBLE1BQU0sTUFBTSxDQUFDLFFBQVEsRUFBRyxPQUFPLEtBQU0sT0FBTyxNQUFPLE9BQU8sSUFBSyxPQUFPLE1BQU0sTUFBTSxPQUFPLEdBQUc7QUFFckYsTUFBTSxhQUFOLE1BQWlCO0FBQUEsSUFDdEIsY0FBYztBQUFFLFdBQUssSUFBSSxDQUFDO0FBQUcsV0FBSyxJQUFJLENBQUM7QUFBRyxXQUFLLElBQUksQ0FBQztBQUFBLElBQUc7QUFBQSxJQUN2RCxJQUFJLFFBQVE7QUFBRSxhQUFPLEtBQUssRUFBRSxXQUFXO0FBQUEsSUFBRztBQUFBLElBRTFDLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksS0FBSztBQUUzQyxZQUFNLEtBQUssS0FBSyxJQUFJLEtBQUssS0FBSyxJQUFJLEtBQUssS0FBSyxJQUFJLEtBQUssS0FBSyxJQUFJLEtBQUssS0FBSyxJQUFJLEtBQUssS0FBSztBQUN0RixVQUFJLEtBQUssS0FBSyxLQUFLLEtBQUssSUFBSSxLQUFLLEtBQUssS0FBSyxLQUFLLElBQUksS0FBSyxLQUFLLEtBQUssS0FBSztBQUN4RSxZQUFNLElBQUksS0FBSyxNQUFNLElBQUksSUFBSSxFQUFFLEtBQUs7QUFBRyxZQUFNO0FBQUcsWUFBTTtBQUFHLFlBQU07QUFDL0QsV0FBSyxFQUFFLEtBQUssSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLEVBQUU7QUFDOUMsV0FBSyxFQUFFLEtBQUssSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLEVBQUU7QUFDOUMsWUFBTSxJQUFJLE9BQU8sUUFBUSxXQUFXLElBQUksR0FBRyxJQUFJO0FBQy9DLFdBQUssRUFBRSxLQUFLLEVBQUUsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDO0FBQUEsSUFDbEU7QUFBQSxJQUNBLEtBQUssR0FBRyxHQUFHLEdBQUcsR0FBRyxLQUFLO0FBQ3BCLFdBQUssSUFBSSxFQUFFLENBQUMsR0FBRyxFQUFFLENBQUMsR0FBRyxFQUFFLENBQUMsR0FBRyxFQUFFLENBQUMsR0FBRyxFQUFFLENBQUMsR0FBRyxFQUFFLENBQUMsR0FBRyxFQUFFLENBQUMsR0FBRyxFQUFFLENBQUMsR0FBRyxFQUFFLENBQUMsR0FBRyxHQUFHO0FBQ2xFLFdBQUssSUFBSSxFQUFFLENBQUMsR0FBRyxFQUFFLENBQUMsR0FBRyxFQUFFLENBQUMsR0FBRyxFQUFFLENBQUMsR0FBRyxFQUFFLENBQUMsR0FBRyxFQUFFLENBQUMsR0FBRyxFQUFFLENBQUMsR0FBRyxFQUFFLENBQUMsR0FBRyxFQUFFLENBQUMsR0FBRyxHQUFHO0FBQUEsSUFDcEU7QUFBQTtBQUFBLElBR0EsS0FBSyxLQUFLLElBQUksSUFBSSxJQUFJLElBQUksR0FBRyxLQUFLO0FBQ2hDLFlBQU0sSUFBSSxJQUFJO0FBQ2QsZUFBUyxJQUFJLEdBQUcsSUFBSSxHQUFHLEtBQUs7QUFDMUIs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LEdBQUcsUUFBUSxFQUFFLEdBQUcsS0FBSyxFQUFFLENBQUMsR0FBRyxHQUFHLEtBQUssRUFBRSxDQUFDLEVBQUU7QUFBRyxhQUFPO0FBQUEsSUFBTTtBQUFBLElBQzNFLEtBQUssR0FBRyxHQUFHO0FBQUUsV0FBSyxHQUFHLE9BQU8sRUFBRSxHQUFHLEtBQUssRUFBRSxDQUFDLEdBQUcsR0FBRyxLQUFLLEVBQUUsQ0FBQyxFQUFFO0FBQUcsYUFBTztBQUFBLElBQU07QUFBQSxJQUN6RSxJQUFJLEdBQUcsR0FBRztBQUFFLFdBQUssR0FBRyxLQUFLLEtBQUssRUFBRSxHQUFHLEtBQUssRUFBRSxDQUFDLEdBQUcsR0FBRyxLQUFLLEVBQUUsQ0FBQyxFQUFFLENBQUM7QUFBRyxhQUFPO0FBQUEsSUFBTTtBQUFBO0FBQUEsSUFFNUUsTUFBTSxHQUFHLEdBQUcsR0FBRyxHQUFHLElBQUksSUFBSSxNQUFNLEtBQUssS0FBSyxHQUFHO0FBQzNDLFdBQUssS0FBSyxLQUFLLEVBQUUsR0FBRyxTQUFTLElBQUksS0FBSyxFQUFFLENBQUMsR0FBRyxJQUFJLEtBQUssRUFBRSxDQUFDLEdBQUcsSUFBSyxJQUFJLEtBQUssT0FBUSxHQUFHLElBQUssSUFBSSxLQUFLLE9BQVEsR0FBRyxJQUFJLEtBQUssS0FBSyxNQUFNLElBQUksS0FBSyxLQUFLLE1BQU0sS0FBSyxHQUFHLENBQUM7QUFDOUosYUFBTztBQUFBLElBQ1Q7QUFBQSxJQUNBLElBQUksR0FBRyxHQUFHLEtBQUssSUFBSSxJQUFJLE1BQU0sS0FBSyxLQUFLLEdBQUc7QUFDeEMsV0FBSyxLQUFLLEtBQUssRUFBRSxHQUFHLE9BQU8sSUFBSSxLQUFLLEVBQUUsQ0FBQyxHQUFHLElBQUksS0FBSyxFQUFFLENBQUMsR0FBRyxHQUFHLEtBQUssSUFBSSxLQUFLLEtBQUssTUFBTSxJQUFJLEtBQUssS0FBSyxNQUFNLEtBQUssR0FBRyxDQUFDO0FBQ2xILGFBQU87QUFBQSxJQUNUO0FBQUEsSUFDQSxPQUFPO0FBQUUsYUFBTyxLQUFLLEVBQUUsSUFBSSxDQUFDLFFB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LEdBQUcsRUFBRSxFQUFFLEVBQUUsSUFBSSxHQUFHLEVBQUUsRUFBRSxFQUFFLEdBQUcsSUFBSSxFQUFFO0FBQ25ELFVBQUUsRUFBRSxJQUFJLEdBQUcsRUFBRSxFQUFFLEVBQUUsSUFBSSxJQUFJLEVBQUUsRUFBRSxFQUFFLElBQUksSUFBSSxFQUFFLEVBQUUsRUFBRSxJQUFJLElBQUksRUFBRSxFQUFFLEVBQUUsSUFBSSxJQUFJLEVBQUU7QUFDckUsVUFBRSxNQUFNLEdBQUcsR0FBRyxFQUFFLEtBQUssTUFBTSxFQUFFO0FBQzdCLFVBQUUsSUFBSSxNQUFNLEVBQUUsRUFBRSxJQUFJLEtBQUssRUFBRSxFQUFFLElBQUksTUFBTSxJQUFJO0FBQUEsTUFDN0M7QUFBQSxJQUNGO0FBQUEsSUFDQTtBQUFBO0FBQUEsTUFDRSxJQUFJO0FBQUEsTUFDSixNQUFNLEdBQUc7QUFDUCxVQUFFLE1BQU07QUFDUixVQUFFLEVBQUUsR0FBRyxHQUFHLENBQUM7QUFDWCxTQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsSUFBSSxJQUFJLEVBQUUsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsR0FBRyxJQUFJLElBQUksRUFBRSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFJLElBQUksRUFBRSxDQUFDLENBQUMsRUFDbkUsUUFBUSxDQUFDLENBQUMsR0FBRyxJQUFJLE1BQU0sS0FBSyxRQUFRLENBQUMsTUFBTSxFQUFFLElBQUksS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDO0FBQy9ELFVBQUUsRUFBRSxJQUFJLElBQUksRUFBRSxFQUFFLEVBQUUsSUFBSSxJQUFJLEVBQUU7QUFDNUIsVUFBRSxLQUFLLEdBQUcsSUFBSSxJQUFJLEVBQUUsRUFBRSxLQUFLLElBQUksSUFBSSxJQUFJLEVBQUU7QUFDekMsVUFBRSxPQUFPLEdBQUcsSUFBSSxJQUFJLEVBQUUsRUFBRSxPQUFPLElBQUksSUFBSSxJQUFJLEVBQUU7QUFDN0MsVUFBRSxNQUFNLEdBQUcsR0FBRyxFQUFFLEtBQUssSUFBSSxJQUFJO0FBQzdC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Q0FBQyxLQUFJLEVBQUUsR0FBRSxDQUFDLEtBQUksRUFBRSxHQUFFLENBQUMsS0FBSSxFQUFFLEdBQUUsQ0FBQyxJQUFHLEVBQUUsR0FBRSxDQUFDLE1BQUssRUFBRSxHQUFFLENBQUMsTUFBSyxFQUFFLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLElBQUcsSUFBSSxHQUFFLENBQUMsS0FBSSxJQUFJLENBQUMsRUFBQztBQUFBLElBQzNJLE9BQU8sRUFBQyxPQUFNLElBQUcsS0FBSSxNQUFLLE1BQUssTUFBSyxLQUFJLE1BQUssUUFBTyxDQUFDLENBQUMsTUFBSyxHQUFHLEdBQUUsQ0FBQyxNQUFLLEdBQUcsR0FBRSxDQUFDLE1BQUssR0FBRyxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxJQUFHLEdBQUcsR0FBRSxDQUFDLEtBQUksRUFBRSxHQUFFLENBQUMsSUFBRyxDQUFDLEdBQUUsQ0FBQyxLQUFJLEVBQUUsR0FBRSxDQUFDLE1BQUssRUFBRSxHQUFFLENBQUMsTUFBSyxHQUFHLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLElBQUcsR0FBRyxHQUFFLENBQUMsS0FBSSxJQUFJLEdBQUUsQ0FBQyxLQUFJLElBQUksQ0FBQyxFQUFDO0FBQUEsSUFDaE0sT0FBTyxFQUFDLE9BQU0sSUFBRyxLQUFJLE1BQUssTUFBSyxLQUFJLEtBQUksTUFBSyxRQUFPLENBQUMsQ0FBQyxLQUFJLEVBQUUsR0FBRSxDQUFDLEtBQUksRUFBRSxHQUFFLENBQUMsS0FBSSxFQUFFLEdBQUUsQ0FBQyxJQUFHLEVBQUUsR0FBRSxDQUFDLElBQUcsR0FBRyxHQUFFLENBQUMsS0FBSSxJQUFJLEdBQUUsQ0FBQyxLQUFJLElBQUksQ0FBQyxFQUFDO0FBQUEsSUFDdEgsT0FBTyxFQUFDLE9BQU0sSUFBRyxLQUFJLE1BQUssTUFBSyxNQUFLLEtBQUksTUFBSyxRQUFPLENBQUMsQ0FBQyxNQUFLLElBQUksR0FBRSxDQUFDLE1BQUssSUFBSSxHQUFFLENBQUMsTUFBSyxJQUFJLEdBQUUsQ0FBQyxNQUFLLElBQUksR0FBRSxDQUFDLE1BQUssSUFBSSxHQUFFLENBQUMsS0FBSSxJQUFJLEdBQUUsQ0FBQyxLQUFJLElBQUksR0FBRSxDQUFDLElBQUcsSUFBSSxHQUFFLENBQUMsS0FBSSxJQUFJLEdBQUUsQ0FBQyxLQUFJLElBQUksR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsS0FBSSxFQUFFLEdBQUUsQ0FBQyxJQUFHLEVBQUUsR0FBRSxDQUFDLElBQUcsR0FBRyxHQUFFLENBQUMsSUFBRyxHQUFHLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLE1BQUssR0FBRyxHQUFFLENBQUMsTUFBSyxHQUFHLEdBQUUsQ0FBQyxNQUFLLEdBQUcsQ0FBQyxFQUFDO0FBQUEsSUFDL1AsT0FBTyxFQUFDLE9BQU0sSUFBRyxLQUFJLE1BQUssTUFBSyxNQUFLLEtBQUksTUFBSyxRQUFPLENBQUMsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsS0FBSSxFQUFFLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLElBQUcsR0FBRyxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxLQUFJLEVBQUUsR0FBRSxDQUFDLElBQUcsRUFBRSxHQUFFLENBQUMsS0FBSSxHQUFHLENBQUMsRUFBQztBQUFBLElBQ3hLLE9BQU8sRUFBQyxPQUFNLElBQUcsS0FBSSxNQUFLLE1BQUssTUFBSyxLQUFJLE1BQUssUUFBTyxDQUFDLENBQUMsTUFBSyxHQUFHLEdBQUUsQ0FBQyxNQUFLLEdBQUcsR0FBRSxDQUFDLE1BQUssR0FBRyxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxJQUFHLEVBQUUsR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsS0FBSSxJQUFJLEdBQUUsQ0FBQyxLQUFJLElBQUksQ0FBQyxFQUFDO0FBQUEsSUFDeEksT0FBTyxFQUFDLE9BQU0sSUFBRyxLQUFJLE1BQUssTUFBSyxNQUFLLEtBQUksTUFBSyxRQUFPLENBQUMsQ0FBQyxNQUFLLEdBQUcsR0FBRSxDQUFDLE1BQUssR0FBRyxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxJQUFHLEdBQUcsR0FBRSxDQUFDLElBQUcsRUFBRSxHQUFFLENBQUMsS0FBSSxFQUFFLEdBQUUsQ0FBQyxNQUFLLEdBQUcsR0FBRSxDQUFDLE1BQUssSUFBSSxDQUFDLEVBQUM7QUFBQSxJQUN0SSxPQUFPLEVBQUMsT0FBTSxJQUFHLEtBQUksTUFBSyxNQUFLLE1BQUssS0FBSSxNQUFLLFFBQU8sQ0FBQyxDQUFDLE1BQUssSUFBSSxHQUFFLENBQUMsTUFBSyxJQUFJLEdBQUUsQ0FBQyxNQUFLLElBQUksR0FBRSxDQUFDLE1BQUssSUFBSSxHQUFFLENBQUMsTUFBSyxJQUFJLEdBQUUsQ0FBQyxLQUFJLElBQUksR0FBRSxDQUFDLEtBQUksSUFBSSxHQUFFLENBQUMsSUFBRyxJQUFJLEdBQUUsQ0FBQyxLQUFJLElBQUksR0FBRSxDQUFDLEtBQUksSUFBSSxDQUFDLEVBQUM7QUFBQSxJQUN2SyxRQUFRLEVBQUMsT0FBTSxJQUFHLEtBQUksTUFBSyxNQUFLLE1BQUssS0FBSSxNQUFLLFFBQU8sQ0FBQyxDQUFDLE1BQUssR0FBRyxHQUFFLENBQUMsTUFBSyxHQUFHLEdBQUUsQ0FBQyxNQUFLLEdBQUcsR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsSUFBRyxHQUFHLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLEtBQUksRUFBRSxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxLQUFJLElBQUksR0FBRSxDQUFDLElBQUcsSUFBSSxHQUFFLENBQUMsS0FBSSxJQUFJLEdBQUUsQ0FBQyxNQUFLLElBQUksR0FBRSxDQUFDLE1BQUssR0FBRyxHQUFFLENBQUMsTUFBSyxFQUFFLEdBQUUsQ0FBQyxNQUFLLEVBQUUsR0FBRSxDQUFDLEtBQUksRUFBRSxHQUFFLENBQUMsSUFBRyxFQUFFLEdBQUUsQ0FBQyxJQUFHLEVBQUUsR0FBRSxDQUFDLElBQUcsSUFBSSxHQUFFLENBQUMsR0FBRSxHQUFHLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLEtBQUksQ0FBQyxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxJQUFHLENBQUMsQ0FBQyxFQUFDO0FBQUEsSUFDaFMsUUFBUSxFQUFDLE9BQU0sSUFBRyxLQUFJLE1BQUssTUFBSyxNQUFLLEtBQUksSUFBRyxRQUFPLENBQUMsQ0FBQyxNQUFLLEdBQUcsR0FBRSxDQUFDLE1BQUssR0FBRyxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxJQUFHLEdBQUcsR0FBRSxDQUFDLEtBQUksRUFBRSxHQUFFLENBQUMsSUFBRyxJQUFJLEdBQUUsQ0FBQyxJQUFHLElBQUksQ0FBQyxFQUFDO0FBQUEsSUFDMUgsUUFBUSxFQUFDLE9BQU0sSUFBRyxLQUFJLE1BQUssTUFBSyxNQUFLLEtBQUksTUFBSyxRQUFPLENBQUMsQ0FBQyxNQUFLLElBQUksR0FBRSxDQUFDLE1BQUssSUFBSSxHQUFFLENBQUMsTUFBSyxJQUFJLEdBQUUsQ0FBQyxNQUFLLElBQUksR0FBRSxDQUFDLE1BQUssSUFBSSxHQUFFLENBQUMsS0FBSSxJQUFJLEdBQUUsQ0FBQyxLQUFJLElBQUksR0FBRSxDQUFDLElBQUcsSUFBSSxHQUFFLENBQUMsS0FBSSxJQUFJLEdBQUUsQ0FBQyxLQUFJLElBQUksR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxJQUFHLEdBQUcsR0FBRSxDQUFDLElBQUcsR0FBRyxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxLQUFJLEdBQUcsQ0FBQyxFQUFDO0FBQUEsSUFDbE8sUUFBUSxFQUFDLE9BQU0sSUFBRyxLQUFJLE1BQUssTUFBSyxNQUFLLEtBQUksTUFBSyxRQUFPLENBQUMsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsSUFBRyxHQUFHLEdBQUUsQ0FBQyxJQUFHLEdBQUcsR0FBRSxDQUFDLElBQUcsRUFBRSxHQUFFLENBQUMsS0FBSSxFQUFFLEdBQUUsQ0FBQyxLQUFJLEVBQUUsR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsS0FBSSxJQUFJLEdBQUUsQ0FBQyxLQUFJLElBQUksQ0FBQyxFQUFDO0FBQUEsSUFDdEosUUFBUSxFQUFDLE9BQU0sSUFBRyxLQUFJLEtBQUksTUFBSyxNQUFLLEtBQUksSUFBRyxRQUFPLENBQUMsQ0FBQyxHQUFFLEdBQUcsR0FBRSxDQUFDLElBQUcsR0FBRyxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLEtBQUksRUFBRSxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxJQUFHLElBQUksQ0FBQyxFQUFDO0FBQUEsSUFDckgsUUFBUSxFQUFDLE9BQU0sSUFBRyxLQUFJLE1BQUssTUFBSyxNQUFLLEtBQUksTUFBSyxRQUFPLENBQUMsQ0FBQyxNQUFLLEdBQUcsR0FBRSxDQUFDLE1BQUssR0FBRyxHQUFFLENBQUMsTUFBSyxFQUFFLEdBQUUsQ0FBQyxNQUFLLEdBQUcsR0FBRSxDQUFDLE1BQUssSUFBSSxHQUFFLENBQUMsS0FBSSxJQUFJLEdBQUUsQ0FBQyxLQUFJLENBQUMsR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsSUFBRyxHQUFHLEdBQUUsQ0FBQyxJQUFHLEVBQUUsR0FBRSxDQUFDLElBQUcsR0FBRyxHQUFFLENBQUMsS0FBSSxJQUFJLEdBQUUsQ0FBQyxLQUFJLElBQUksR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsS0FBSSxFQUFFLEdBQUUsQ0FBQyxLQUFJLEdBQUcsQ0FBQyxFQUFDO0FBQUEsSUFDdk4sUUFBUSxFQUFDLE9BQU0sSUFBRyxLQUFJLE1BQUssTUFBSyxNQUFLLEtBQUksTUFBSyxRQUFPLENBQUMsQ0FBQyxNQUFLLElBQUksR0FBRSxDQUFDLE1BQUssSUFBSSxHQUFFLENBQUMsTUFBSyxJQUFJLEdBQUUsQ0FBQyxLQUFJLElBQUksR0FBRSxDQUFDLEtBQUksSUFBSSxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxLQUFJLENBQUMsR0FBRSxDQUFDLEtBQUksRUFBRSxHQUFFLENBQUMsSUFBRyxHQUFHLEdBQUUsQ0FBQyxJQUFHLEdBQUcsR0FBRSxDQUFDLElBQUcsR0FBRyxHQUFFLENBQUMsSUFBRyxHQUFHLEdBQUUsQ0FBQyxLQUFJLEVBQUUsR0FBRSxDQUFDLE1BQUssR0FBRyxHQUFFLENBQUMsTUFBSyxHQUFHLENBQUMsRUFBQztBQUFBLElBQzlNLFFBQVEsRUFBQyxPQUFNLElBQUcsS0FBSSxLQUFJLE1BQUssTUFBSyxLQUFJLE1BQUssUUFBTyxDQUFDLENBQUMsR0FBRSxFQUFFLEdBQUUsQ0FBQyxHQUFFLEVBQUUsR0FBRSxDQUFDLElBQUcsRUFBRSxHQUFFLENBQUMsSUFBRyxFQUFFLEdBQUUsQ0FBQyxLQUFJLEVBQUUsR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsS0FBSSxJQUFJLENBQUMsRUFBQztBQUFBLElBQ2pILFFBQVEsRUFBQyxPQUFNLElBQUcsS0FBSSxNQUFLLE1BQUssTUFBSyxLQUFJLE1BQUssUUFBTyxDQUFDLENBQUMsTUFBSyxHQUFHLEdBQUUsQ0FBQyxNQUFLLEdBQUcsR0FBRSxDQUFDLE1BQUssR0FBRyxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxJQUFHLEdBQUcsR0FBRSxDQUFDLEtBQUksRUFBRSxHQUFFLENBQUMsS0FBSSxFQUFFLEdBQUUsQ0FBQyxJQUFHLEdBQUcsR0FBRSxDQUFDLEtBQUksRUFBRSxHQUFFLENBQUMsTUFBSyxHQUFHLEdBQUUsQ0FBQyxNQUFLLEdBQUcsR0FBRSxDQUFDLEtBQUksSUFBSSxHQUFFLENBQUMsSUFBRyxJQUFJLEdBQUUsQ0FBQyxLQUFJLElBQUksQ0FBQyxFQUFDO0FBQUEsSUFDcE0sUUFBUSxFQUFDLE9BQU0sSUFBRyxLQUFJLE1BQUssTUFBSyxNQUFLLEtBQUksTUFBSyxRQUFPLENBQUMsQ0FBQyxNQUFLLEdBQUcsR0FBRSxDQUFDLE1BQUssR0FBRyxHQUFFLENBQUMsS0FB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QUFRO0FBQUEsTUFBRyxTQUFTLEVBQUUsU0FBUztBQUFBLE1BQzNHLFFBQVEsRUFBRSxRQUFRO0FBQUEsTUFBRyxTQUFTLEVBQUUsU0FBUztBQUFBLE1BQUcsVUFBVSxFQUFFLFVBQVU7QUFBQSxNQUFHLFVBQVUsRUFBRSxVQUFVO0FBQUEsTUFBRyxNQUFNLEVBQUUsTUFBTTtBQUFBLE1BQUcsTUFBTSxFQUFFLE1BQU07QUFBQSxNQUFHLE1BQU0sRUFBRSxRQUFRO0FBQUEsSUFDbEosQ0FBQztBQUVELFVBQU0sUUFBUSxTQUFTLGVBQWUsT0FBTztBQUM3QyxRQUFJLE9BQU8sV0FBVyxHQUFHLFVBQVU7QUFDbkMsUUFBSSxNQUFTO0FBQ1gsWUFBTUMsTUFBSyxJQUFJLGdCQUFnQixTQUFTLE1BQU07QUFDOUMsVUFBSUEsSUFBRyxJQUFJLE1BQU0sRUFBRyxRQUFPLEtBQUssSUFBSSxHQUFHLEtBQUssSUFBSSxHQUFHQSxJQUFHLElBQUksTUFBTSxJQUFJLENBQUMsQ0FBQztBQUN0RSxVQUFJQSxJQUFHLElBQUksT0FBTyxFQUFHLFlBQVdBLElBQUcsSUFBSSxPQUFPLElBQUksS0FBSztBQUN2RCxVQUFJQSxJQUFHLElBQUksS0FBSyxNQUFNLFVBQVVBLElBQUcsSUFBSSxLQUFLLE1BQU0sUUFBUyxNQUFLLElBQUksTUFBTUEsSUFBRyxJQUFJLEtBQUs7QUFBQSxJQUN4RjtBQUVBLFFBQUk7QUFDSixRQUFJO0FBQUUsYUFBTyxJQUFJLEtBQUssT0FBTyxJQUFJO0FBQUEsSUFBRyxTQUM3QixHQUFHO0FBQUUsU0FBRyxNQUFNO0FBQUcsb0JBQVMsU0FBUztBQUFHLG9CQUFTLE1BQU07QUFBRztBQUFBLElBQVE7QUFFdkUsV0FBTyxJQUFJLEtBQUssRUFBRSx5QkFBVSxNQUFNLElBQUksT0FBTyxJQUFJLFVBQVUsR0FBRyxNQUFNLEtBQUssQ0FBQztBQUMxRSxRQUFJLEtBQVMsTUFBSyxXQUFXLElBQUksZ0JBQWdCLFNBQVMsTUFBTSxFQUFFLElBQUksT0FBTztBQUM3RSxVQUFNLE1BQU0sTUFBTSxLQUFLLE9BQU87QUFDOUIsV0FBTyxpQkFBaUIsVUFBVSxHQUFHO0FBQ3JDLFFBQUksT0FBTyxlQUFnQixLQUFJLGVBQWUsR0FBRyxFQUFFLFFBQVEsS0FBSztBQUNoRSxTQUFLLE1BQU07QUFDWCxRQUFJLE1BQVM7QUFDWCxhQUFPLE9BQU8sS0FBSyxPQUFPO0FBQzFCLFVBQUksV0FBVyxFQUFHLE1BQUssV0FBVyxLQUFLLElBQUksU0FBUyxPQUFPLEtBQUssYUFBYSxDQUFDLENBQUM7QUFBQSxJQUNqRjtBQUNBLGtCQUFTLE1BQU07QUFBQSxFQUNqQjtBQUVBLE9BQUs7IiwKICAibmFtZXMiOiBbImNzIiwgImhhbG8iLCAiayIsICJnIiwgImNhY2hlIiwgIl9wIiwgInFzIl0KfQo=
