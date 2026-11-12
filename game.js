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
    "equipped",
    "tutPad",
    "tutMover",
    "tutSaw",
    "tutKey",
    "tutGate",
    "tutLaser",
    "tutFan",
    "tutPort"
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
      "En uso",
      "Las placas amarillas te lanzan",
      "S\xFAbete al bloque m\xF3vil",
      "Esquiva la sierra",
      "La llave abre la puerta",
      "Las puertas verdes son de un solo sentido",
      "Espera a que el l\xE1ser se apague",
      "El viento te lleva",
      "Los portales est\xE1n conectados"
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
      "Em uso",
      "As placas amarelas lan\xE7am voc\xEA",
      "Suba no bloco m\xF3vel",
      "Desvie da serra",
      "A chave abre a porta",
      "Port\xF5es verdes s\xE3o de m\xE3o \xFAnica",
      "Espere o laser apagar",
      "O vento leva voc\xEA",
      "Os portais s\xE3o ligados"
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
      "Aktiv",
      "Gelbe Felder schleudern dich",
      "Fahr auf dem Block mit",
      "Weich der S\xE4ge aus",
      "Der Schl\xFCssel \xF6ffnet die T\xFCr",
      "Gr\xFCne Tore gehen nur in eine Richtung",
      "Warte, bis der Laser ausgeht",
      "Der Wind tr\xE4gt dich",
      "Portale sind verbunden"
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
      "Utilis\xE9e",
      "Les dalles jaunes te propulsent",
      "Monte sur le bloc mobile",
      "\xC9vite la scie",
      "La cl\xE9 ouvre la porte",
      "Les portes vertes sont \xE0 sens unique",
      "Attends que le laser s'\xE9teigne",
      "Le vent te porte",
      "Les portails sont reli\xE9s"
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
      "In uso",
      "Le piastre gialle ti lanciano",
      "Sali sul blocco mobile",
      "Evita la sega",
      "La chiave apre la porta",
      "I cancelli verdi sono a senso unico",
      "Aspetta che il laser si spenga",
      "Il vento ti trasporta",
      "I portali sono collegati"
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
      "\u4F7F\u7528\u4E2D",
      "\u9EC4\u8272\u306E\u30D1\u30C3\u30C9\u3067\u30B8\u30E3\u30F3\u30D7",
      "\u52D5\u304F\u30D6\u30ED\u30C3\u30AF\u306B\u4E57\u308D\u3046",
      "\u30CE\u30B3\u30AE\u30EA\u3092\u3088\u3051\u3088\u3046",
      "\u30AB\u30AE\u3067\u30C9\u30A2\u304C\u958B\u304F",
      "\u7DD1\u306E\u30B2\u30FC\u30C8\u306F\u4E00\u65B9\u901A\u884C",
      "\u30EC\u30FC\u30B6\u30FC\u304C\u6D88\u3048\u308B\u307E\u3067\u5F85\u3068\u3046",
      "\u98A8\u306B\u4E57\u308D\u3046",
      "\u30DD\u30FC\u30BF\u30EB\u306F\u3064\u306A\u304C\u3063\u3066\u3044\u308B"
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
      "Kullan\u0131mda",
      "Sar\u0131 pedler seni f\u0131rlat\u0131r",
      "Hareketli blo\u011Fa bin",
      "Testereden ka\xE7",
      "Anahtar kap\u0131y\u0131 a\xE7ar",
      "Ye\u015Fil kap\u0131lar tek y\xF6nl\xFCd\xFCr",
      "Lazerin s\xF6nmesini bekle",
      "R\xFCzg\xE2r seni ta\u015F\u0131r",
      "Portallar birbirine ba\u011Fl\u0131"
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
      "Dipakai",
      "Bantalan kuning melontarkanmu",
      "Naiki balok bergerak",
      "Hindari gergaji",
      "Kunci membuka pintu",
      "Gerbang hijau hanya satu arah",
      "Tunggu lasernya padam",
      "Angin membawamu",
      "Portal saling terhubung"
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
      "\u091A\u093E\u0932\u0942",
      "\u092A\u0940\u0932\u0947 \u092A\u0948\u0921 \u0924\u0941\u092E\u094D\u0939\u0947\u0902 \u0909\u091B\u093E\u0932\u0924\u0947 \u0939\u0948\u0902",
      "\u091A\u0932\u0924\u0947 \u092C\u094D\u0932\u0949\u0915 \u092A\u0930 \u0938\u0935\u093E\u0930 \u0939\u094B \u091C\u093E\u0913",
      "\u0906\u0930\u0940 \u0938\u0947 \u092C\u091A\u094B",
      "\u091A\u093E\u092C\u0940 \u0938\u0947 \u0926\u0930\u0935\u093E\u091C\u093C\u093E \u0916\u0941\u0932\u0924\u093E \u0939\u0948",
      "\u0939\u0930\u0947 \u0917\u0947\u091F \u090F\u0915 \u0939\u0940 \u0924\u0930\u092B\u093C \u0916\u0941\u0932\u0924\u0947 \u0939\u0948\u0902",
      "\u0932\u0947\u091C\u093C\u0930 \u092C\u0941\u091D\u0928\u0947 \u0915\u093E \u0907\u0902\u0924\u091C\u093C\u093E\u0930 \u0915\u0930\u094B",
      "\u0939\u0935\u093E \u0924\u0941\u092E\u094D\u0939\u0947\u0902 \u0932\u0947 \u091C\u093E\u0924\u0940 \u0939\u0948",
      "\u092A\u094B\u0930\u094D\u091F\u0932 \u0906\u092A\u0938 \u092E\u0947\u0902 \u091C\u0941\u0921\u093C\u0947 \u0939\u0948\u0902"
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
      "\u0412\u044B\u0431\u0440\u0430\u043D",
      "\u0416\u0451\u043B\u0442\u044B\u0435 \u043F\u043B\u0438\u0442\u044B \u043F\u043E\u0434\u0431\u0440\u0430\u0441\u044B\u0432\u0430\u044E\u0442",
      "\u041F\u0440\u043E\u043A\u0430\u0442\u0438\u0441\u044C \u043D\u0430 \u043F\u043B\u0430\u0442\u0444\u043E\u0440\u043C\u0435",
      "\u0411\u0435\u0440\u0435\u0433\u0438\u0441\u044C \u043F\u0438\u043B\u044B",
      "\u041A\u043B\u044E\u0447 \u043E\u0442\u043A\u0440\u044B\u0432\u0430\u0435\u0442 \u0434\u0432\u0435\u0440\u044C",
      "\u0417\u0435\u043B\u0451\u043D\u044B\u0435 \u0432\u043E\u0440\u043E\u0442\u0430 \u2014 \u0432 \u043E\u0434\u043D\u0443 \u0441\u0442\u043E\u0440\u043E\u043D\u0443",
      "\u0414\u043E\u0436\u0434\u0438\u0441\u044C, \u043F\u043E\u043A\u0430 \u043B\u0430\u0437\u0435\u0440 \u043F\u043E\u0433\u0430\u0441\u043D\u0435\u0442",
      "\u0412\u0435\u0442\u0435\u0440 \u043D\u0435\u0441\u0451\u0442 \u0442\u0435\u0431\u044F",
      "\u041F\u043E\u0440\u0442\u0430\u043B\u044B \u0441\u0432\u044F\u0437\u0430\u043D\u044B"
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
      "\u0110ang d\xF9ng",
      "\xD4 v\xE0ng s\u1EBD b\u1EAFn b\u1EA1n \u0111i",
      "C\u01B0\u1EE1i kh\u1ED1i di chuy\u1EC3n",
      "N\xE9 l\u01B0\u1EE1i c\u01B0a",
      "Ch\xECa kh\xF3a m\u1EDF c\u1EEDa",
      "C\u1ED5ng xanh ch\u1EC9 \u0111i m\u1ED9t chi\u1EC1u",
      "Ch\u1EDD tia laser t\u1EAFt",
      "Gi\xF3 s\u1EBD \u0111\u01B0a b\u1EA1n \u0111i",
      "Hai c\u1ED5ng n\u1ED1i v\u1EDBi nhau"
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
      "\u0E43\u0E0A\u0E49\u0E2D\u0E22\u0E39\u0E48",
      "\u0E41\u0E1C\u0E48\u0E19\u0E2A\u0E35\u0E40\u0E2B\u0E25\u0E37\u0E2D\u0E07\u0E08\u0E30\u0E14\u0E35\u0E14\u0E04\u0E38\u0E13",
      "\u0E02\u0E36\u0E49\u0E19\u0E44\u0E1B\u0E1A\u0E19\u0E1A\u0E25\u0E47\u0E2D\u0E01\u0E17\u0E35\u0E48\u0E40\u0E04\u0E25\u0E37\u0E48\u0E2D\u0E19\u0E17\u0E35\u0E48",
      "\u0E2B\u0E25\u0E1A\u0E43\u0E1A\u0E40\u0E25\u0E37\u0E48\u0E2D\u0E22",
      "\u0E01\u0E38\u0E0D\u0E41\u0E08\u0E40\u0E1B\u0E34\u0E14\u0E1B\u0E23\u0E30\u0E15\u0E39",
      "\u0E1B\u0E23\u0E30\u0E15\u0E39\u0E2A\u0E35\u0E40\u0E02\u0E35\u0E22\u0E27\u0E1C\u0E48\u0E32\u0E19\u0E44\u0E14\u0E49\u0E17\u0E32\u0E07\u0E40\u0E14\u0E35\u0E22\u0E27",
      "\u0E23\u0E2D\u0E43\u0E2B\u0E49\u0E40\u0E25\u0E40\u0E0B\u0E2D\u0E23\u0E4C\u0E14\u0E31\u0E1A\u0E01\u0E48\u0E2D\u0E19",
      "\u0E25\u0E21\u0E08\u0E30\u0E1E\u0E32\u0E04\u0E38\u0E13\u0E44\u0E1B",
      "\u0E1E\u0E2D\u0E23\u0E4C\u0E17\u0E31\u0E25\u0E40\u0E0A\u0E37\u0E48\u0E2D\u0E21\u0E16\u0E36\u0E07\u0E01\u0E31\u0E19"
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
      "W u\u017Cyciu",
      "\u017B\xF3\u0142te pola ci\u0119 wyrzucaj\u0105",
      "Wskocz na ruchomy blok",
      "Omi\u0144 pi\u0142\u0119",
      "Klucz otwiera drzwi",
      "Zielone bramki s\u0105 jednokierunkowe",
      "Poczekaj, a\u017C laser zga\u015Bnie",
      "Wiatr ci\u0119 niesie",
      "Portale s\u0105 po\u0142\u0105czone"
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
      tutPad: "Yellow pads launch you",
      tutMover: "Ride the moving block",
      tutSaw: "Dodge the saw",
      tutKey: "The key opens the door",
      tutGate: "Green gates are one-way",
      tutLaser: "Wait for the laser to go dark",
      tutFan: "The wind carries you",
      tutPort: "Portals link up",
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
      tutPad: "\u0627\u0644\u0645\u0646\u0635\u0627\u062A \u0627\u0644\u0635\u0641\u0631\u0627\u0621 \u062A\u0642\u0630\u0641\u0643",
      tutMover: "\u0627\u0631\u0643\u0628 \u0627\u0644\u0645\u0646\u0635\u0629 \u0627\u0644\u0645\u062A\u062D\u0631\u0643\u0629",
      tutSaw: "\u062A\u0641\u0627\u062F\u064E \u0627\u0644\u0645\u0646\u0634\u0627\u0631",
      tutKey: "\u0627\u0644\u0645\u0641\u062A\u0627\u062D \u064A\u0641\u062A\u062D \u0627\u0644\u0628\u0627\u0628",
      tutGate: "\u0627\u0644\u0628\u0648\u0627\u0628\u0627\u062A \u0627\u0644\u062E\u0636\u0631\u0627\u0621 \u0627\u062A\u062C\u0627\u0647 \u0648\u0627\u062D\u062F",
      tutLaser: "\u0627\u0646\u062A\u0638\u0631 \u062D\u062A\u0649 \u064A\u0646\u0637\u0641\u0626 \u0627\u0644\u0644\u064A\u0632\u0631",
      tutFan: "\u0627\u0644\u0647\u0648\u0627\u0621 \u064A\u062D\u0645\u0644\u0643",
      tutPort: "\u0627\u0644\u0628\u0648\u0627\u0628\u062A\u0627\u0646 \u0645\u062A\u0635\u0644\u062A\u0627\u0646",
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
  var PORT_R = 12;
  var PORT_CLEAR = 34;
  var K_BOX = 0;
  var K_CIRCLE = 1;
  var K_CAPSULE = 2;
  function laserOn(lz, t) {
    if (!lz.period) return true;
    let p = (t + lz.ph) % lz.period;
    if (p < 0) p += lz.period;
    return p < lz.duty;
  }
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
      this.keys = 0;
      this.tpl = 0;
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
      const fans = L.fans;
      for (let i = 0; i < fans.length; i++) {
        const fn = fans[i];
        if (boxDist2(this.x, this.y, fn) === 0) {
          this.vx += fn.dx * fn.power * f.wind * DT;
          this.vy += fn.dy * fn.power * f.wind * DT;
        }
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
      const doors = L.doors, gates = L.gates;
      if (doors.length && this.keys !== L.keyMask) for (let i = 0; i < doors.length; i++) this._hit(doors[i], r, 0, 0);
      for (let i = 0; i < gates.length; i++) {
        const gt = gates[i];
        const sd = (this.x - gt.cx) * gt.dx + (this.y - gt.cy) * gt.dy;
        if (sd <= 0 || sd >= r) continue;
        const lat = Math.abs((this.x - gt.cx) * gt.dy - (this.y - gt.cy) * gt.dx);
        if (lat > gt.half + r * 0.5) continue;
        if (this.vx * gt.dx + this.vy * gt.dy >= 0) continue;
        this._contact(gt.dx, gt.dy, r - sd, 0, 0, 1, 1, 0);
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
      const lasers = L.lasers;
      for (let i = 0; i < lasers.length; i++) {
        const lz = lasers[i];
        if (laserOn(lz, t) && boxDist2(this.x, this.y, lz) < kr * kr) {
          this._die("laser");
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
      const keys = L.keys;
      for (let i = 0; i < keys.length; i++) {
        if (this.keys & 1 << i) continue;
        const dx = this.x - keys[i].x, dy = this.y - keys[i].y, rr = r + 12;
        if (dx * dx + dy * dy < rr * rr) {
          this.keys |= 1 << i;
          this._emit("key", keys[i].x, keys[i].y, this.keys === L.keyMask ? 1 : 0);
        }
      }
      const ports = L.ports;
      if (ports.length) {
        let near = false, hit = -1;
        for (let i = 0; i < ports.length; i++) {
          const dx = this.x - ports[i].x, dy = this.y - ports[i].y, d2 = dx * dx + dy * dy;
          if (d2 < PORT_CLEAR * PORT_CLEAR) near = true;
          if (d2 < PORT_R * PORT_R) hit = i;
        }
        if (!near) this.tpl = 0;
        else if (hit >= 0 && !this.tpl) {
          const a = ports[hit], b = ports[a.to];
          this._emit("port", a.x, a.y, hit);
          this.x = b.x + (this.x - a.x);
          this.y = b.y + (this.y - a.y);
          this.tpl = 1;
          this._emit("port", b.x, b.y, a.to);
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
      a[11] = this.keys;
      a[12] = this.tpl;
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
      this.keys = a[11];
      this.tpl = a[12];
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
  var PORT_COLORS = [16747008, 14239471, 8702998, 16007006];
  var GATE_COLOR = 2278750;
  var DOOR_COLOR = 16102145;
  var DOOR_SIDE = 12156672;
  function chevronTexture() {
    const S = 64, cv = document.createElement("canvas");
    cv.width = cv.height = S;
    const g = cv.getContext("2d");
    g.strokeStyle = "rgba(255,255,255,.95)";
    g.lineWidth = 7;
    g.lineCap = "round";
    g.lineJoin = "round";
    g.beginPath();
    g.moveTo(14, 44);
    g.lineTo(32, 22);
    g.lineTo(50, 44);
    g.stroke();
    const t = new THREE.CanvasTexture(cv);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    return t;
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
      this.matKey = new THREE.MeshPhongMaterial({ color: DOOR_COLOR, emissive: 7030528, shininess: 90, specular: 16777215 });
      this.keyRing = new THREE.TorusGeometry(5.5, 2, 8, 18);
      this.keyBar = new THREE.BoxGeometry(3.4, 11, 3.4);
      this.keyTooth = new THREE.BoxGeometry(5.5, 3, 3.4);
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
          if (o.geometry && o.geometry !== this.gemGeo && o.geometry !== this.keyRing && o.geometry !== this.keyBar && o.geometry !== this.keyTooth) o.geometry.dispose();
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
      for (const gt of L.gates) {
        const thin = 2.6, hw = gt.dx ? thin : gt.hw, hh = gt.dx ? gt.hh : thin;
        const o = roundRect(hw, hh, 1.2, 2);
        gb.prism(o, o, gt.cx, gt.cy, 1, 0, 0, 7, 0, GATE_COLOR, shade(GATE_COLOR, 0.7), GATE_COLOR);
        const px = -gt.dy, py = gt.dx, nA = Math.max(1, Math.round(gt.half * 2 / 16));
        for (let i = 0; i < nA; i++) {
          const t = ((i + 0.5) / nA - 0.5) * gt.half * 2;
          for (const off of [-13, 9]) {
            const bx = gt.cx + px * t + gt.dx * off, by = gt.cy + py * t + gt.dy * off, m = 4.5;
            gb.tri(bx + px * m, by + py * m, 0.5, bx - px * m, by - py * m, 0.5, bx + gt.dx * m * 1.5, by + gt.dy * m * 1.5, 0.5, GATE_COLOR);
            gb.tri(bx - px * m, by - py * m, 0.5, bx + px * m, by + py * m, 0.5, bx + gt.dx * m * 1.5, by + gt.dy * m * 1.5, 0.5, GATE_COLOR);
          }
        }
      }
      for (const lz of L.lasers) {
        const along = lz.hw >= lz.hh, e = along ? lz.hw : lz.hh;
        for (const sgn of [-1, 1]) {
          const ex = lz.cx + (along ? sgn * (e - 3) : 0), ey = lz.cy + (along ? 0 : sgn * (e - 3));
          gb.prism(circlePts(5.5, 10), circlePts(4, 10), ex, ey, 1, 0, 0, H * 0.7, 1.5, 4016732, 2567994, T.spike);
        }
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
      const it = this.items = { movers: [], saws: [], gems: [], crystals: [], goal: null, keys: [], doors: [], lasers: [], fans: [], ports: [] };
      L.keys.forEach((k, i) => {
        const grp = new THREE.Group();
        const ring2 = new THREE.Mesh(this.keyRing, this.matKey);
        ring2.position.y = 6;
        const bar = new THREE.Mesh(this.keyBar, this.matKey);
        bar.position.y = -4;
        const tooth = new THREE.Mesh(this.keyTooth, this.matKey);
        tooth.position.set(3.5, -8, 0);
        grp.add(ring2, bar, tooth);
        grp.position.set(k.x, k.y, 14);
        const halo2 = new THREE.Mesh(new THREE.PlaneGeometry(46, 46), new THREE.MeshBasicMaterial({ map: this.glowTex, color: DOOR_COLOR, transparent: true, opacity: 0.8, depthWrite: false }));
        halo2.userData.ownMat = true;
        halo2.position.set(k.x, k.y, 2);
        halo2.renderOrder = 2;
        this.level.add(halo2, grp);
        it.keys.push({ mesh: grp, halo: halo2, i });
      });
      for (const d of L.doors) {
        const b = new GeoBuilder(), o = roundRect(d.hw, d.hh, 3, 3);
        b.prism(o, roundRect(d.hw - 2, d.hh - 2, 2, 3), 0, 0, 1, 0, 0, H, 2, DOOR_COLOR, DOOR_SIDE, 16773560);
        b.prism(circlePts(3.2, 10), circlePts(3.2, 10), 0, 1.5, 1, 0, H, H + 0.6, 0, 3811840, 3811840, 3811840);
        const mesh = new THREE.Mesh(b.build(), this.matStatic);
        mesh.position.set(d.cx, d.cy, 0);
        const sb = new GeoBuilder();
        sb.flat(o, 0, 0, 1, 0, 0.6, 0);
        const shadow = new THREE.Mesh(sb.build(), this.matShadow);
        this.level.add(mesh, shadow);
        it.doors.push({ d, mesh, shadow, k: 1 });
      }
      for (const lz of L.lasers) {
        const mat = new THREE.MeshBasicMaterial({ color: T.spike, transparent: true, opacity: 1, depthWrite: false });
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(Math.max(lz.hw * 2 - 6, 3), Math.max(lz.hh * 2 - 6, 3), 4), mat);
        if (lz.hw >= lz.hh) mesh.scale.y = 1;
        mesh.userData.ownMat = true;
        mesh.position.set(lz.cx, lz.cy, H * 0.55);
        mesh.renderOrder = 3;
        const glow = new THREE.Mesh(new THREE.PlaneGeometry(lz.hw * 2 + 14, lz.hh * 2 + 14), new THREE.MeshBasicMaterial({ color: T.spike, transparent: true, opacity: 0.25, depthWrite: false }));
        glow.userData.ownMat = true;
        glow.position.set(lz.cx, lz.cy, 1.2);
        glow.renderOrder = 2;
        this.level.add(glow, mesh);
        it.lasers.push({ d: lz, mesh, glow });
      }
      for (const fn of L.fans) {
        const tex = chevronTexture();
        const across = fn.dx ? fn.hh * 2 : fn.hw * 2, along = fn.dx ? fn.hw * 2 : fn.hh * 2;
        tex.repeat.set(Math.max(1, Math.round(across / 26)), Math.max(1, Math.round(along / 26)));
        const mat = new THREE.MeshBasicMaterial({ map: tex, color: T.dark ? 6809849 : 1937361, transparent: true, opacity: T.dark ? 0.6 : 0.6, depthWrite: false });
        const mesh = new THREE.Mesh(new THREE.PlaneGeometry(across, along), mat);
        mesh.userData.ownMat = true;
        mesh.position.set(fn.cx, fn.cy, 1);
        mesh.renderOrder = 2;
        mesh.rotation.z = Math.atan2(fn.dy, fn.dx) - Math.PI / 2;
        this.level.add(mesh);
        it.fans.push({ d: fn, tex });
      }
      L.ports.forEach((p) => {
        const col = PORT_COLORS[p.pair % PORT_COLORS.length], grp = new THREE.Group();
        grp.position.set(p.x, p.y, 0);
        const halo2 = new THREE.Mesh(new THREE.PlaneGeometry(74, 74), new THREE.MeshBasicMaterial({ map: this.glowTex, color: col, transparent: true, opacity: 0.8, depthWrite: false }));
        halo2.userData.ownMat = true;
        halo2.position.z = 1.4;
        halo2.renderOrder = 2;
        const disc = new THREE.Mesh(new THREE.CircleGeometry(11.5, 24), new THREE.MeshBasicMaterial({ map: swirlTexture(shade(col, 0.45), 329231) }));
        disc.userData.ownMat = true;
        disc.position.z = 2.6;
        const ring2 = new THREE.Mesh(new THREE.TorusGeometry(12.5, 2.6, 8, 28), new THREE.MeshLambertMaterial({ color: col, emissive: shade(col, 0.45) }));
        ring2.userData.ownMat = true;
        ring2.position.z = 4;
        grp.add(halo2, disc, ring2);
        this.level.add(grp);
        it.ports.push({ disc, ring: ring2 });
      });
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
    fxKey(x, y, all) {
      this.fx.burst(x, y, { n: this.tier ? 18 : 10, speed: 200, colors: [DOOR_COLOR, 16777215], size: 4.6, life: 0.6 });
      this.fx.ring(x, y, DOOR_COLOR, 8, all ? 90 : 46, 0.36);
    }
    fxPort(x, y, i) {
      this.fx.ring(x, y, PORT_COLORS[(i >> 1) % PORT_COLORS.length], 12, 60, 0.3);
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
      for (const k2 of it.keys) {
        const on = !(sim.keys & 1 << k2.i);
        k2.mesh.visible = on;
        k2.halo.visible = on;
        if (on) {
          k2.mesh.rotation.z = -ang + Math.sin(t * 2.2 + k2.i) * 0.35;
          k2.mesh.position.z = 14 + Math.sin(t * 3 + k2.i) * 2;
        }
      }
      const open = sim.keys === sim.lvl.keyMask;
      for (const d of it.doors) {
        d.k += ((open ? 0 : 1) - d.k) * Math.min(1, dt * 12);
        const vis = d.k > 0.03;
        d.mesh.visible = vis;
        d.shadow.visible = vis;
        if (vis) {
          d.mesh.scale.set(1, 1, Math.max(0.02, d.k));
          d.shadow.position.set(d.d.cx + ox * d.k, d.d.cy + oy * d.k, 0);
        }
      }
      for (const lz of it.lasers) {
        const d = lz.d, on = laserOn(d, sim.time);
        let warn = false;
        if (!on && d.period) {
          let ph = (sim.time + d.ph) % d.period;
          if (ph < 0) ph += d.period;
          warn = d.period - ph < 0.45;
        }
        lz.mesh.material.opacity = on ? 0.85 + 0.15 * Math.sin(t * 40) : warn ? Math.sin(t * 38) > 0 ? 0.55 : 0.12 : 0.1;
        lz.glow.visible = on;
      }
      for (const fn of it.fans) fn.tex.offset.y = -(t * 1.6 % 1);
      for (const p of it.ports) {
        p.disc.rotation.z = t * 3.2;
        const k2 = 1 + Math.sin(t * 4) * 0.06;
        p.ring.scale.set(k2, k2, 1);
      }
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
      on("btnDaily", () => h.daily());
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
    home({ levelNum, stars, gems, daily }) {
      $("playLabel").textContent = `${this.i18n.t("level")} ${levelNum}`;
      const db = $("btnDaily");
      db.classList.toggle("hidden", !daily);
      if (daily) {
        db.classList.toggle("done", daily.done);
        $("dailyBadge").textContent = daily.done ? "\u2713" : daily.streak > 0 ? daily.streak : "";
      }
      $("homeStars").textContent = stars;
      $("homeGems").textContent = gems;
      this.show("scrHome");
    }
    win({ stars, time, par, got, total, bonus = 0, canDouble, onStar }) {
      $("winTitle").textContent = this.i18n.t("win" + stars);
      $("winTime").textContent = time.toFixed(1) + "s";
      $("winPar").textContent = "/ " + par + "s";
      $("winTime").parentElement.classList.toggle("ok", time <= par);
      $("winGems").textContent = `${got}/${total}` + (bonus ? ` +${bonus}` : "");
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
    map({ stars, max, count, current, worlds = [] }) {
      const grid = $("mapGrid");
      grid.textContent = "";
      let total = 0, focus = null;
      const heads = /* @__PURE__ */ new Map();
      let at = 0;
      worlds.forEach((w, k) => {
        heads.set(at, { k, ...w, from: at });
        at += w.n;
      });
      for (let i = 0; i < count; i++) {
        const hd = worlds.length > 1 && heads.get(i);
        if (hd) {
          const sep = document.createElement("div");
          sep.className = "wsep";
          let got = 0;
          for (let j = hd.from; j < hd.from + hd.n; j++) got += stars[j] || 0;
          const dot = document.createElement("i");
          dot.style.background = "#" + hd.color.toString(16).padStart(6, "0");
          const nm = document.createElement("b");
          nm.textContent = hd.k + 1;
          const sc = document.createElement("span");
          sc.textContent = `\u2605 ${got}/${hd.n * 3}`;
          sep.append(dot, nm, sc);
          grid.appendChild(sep);
        }
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
        if (i === (current >= 0 ? current : max)) focus = b;
        grid.appendChild(b);
      }
      $("mapStars").textContent = `${total}/${count * 3}`;
      this.show("scrMap");
      if (focus) grid.scrollTop = Math.max(0, focus.offsetTop - grid.offsetTop - grid.clientHeight / 2 + focus.offsetHeight / 2);
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
    key(all) {
      this._tone(880, 0.12, "triangle", 0.16, 1320);
      this._tone(all ? 1760 : 1320, 0.22, "sine", 0.12, all ? 2640 : 1320, 0.09);
    }
    port() {
      this._tone(520, 0.22, "sine", 0.14, 1400);
      this._tone(1400, 0.16, "triangle", 0.07, 520, 0.05);
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
  var MIRROR_CH = { "/": "\\", "\\": "/", "<": ">", ">": "<" };
  var Builder = class {
    /** @param mirror build the left-right mirror image of whatever is drawn (daily challenge) */
    constructor(n = GRID, mirror = false) {
      this.n = n;
      this.mirror = mirror;
      this.cell = 2 * HALF / n;
      this.g = Array.from({ length: n }, () => new Array(n).fill(" "));
      this.pt = { start: null, goal: null, gems: [], keys: [] };
      this.objs = [];
    }
    /** grid column/row (may be fractional) -> arena units; (0,0) is the centre of the top-left cell */
    X(c) {
      const x = -HALF + (c + 0.5) * this.cell;
      return this.mirror ? -x : x;
    }
    Y(r) {
      return HALF - (r + 0.5) * this.cell;
    }
    put(ch, c, r) {
      if (this.mirror) {
        c = this.n - 1 - c;
        ch = MIRROR_CH[ch] || ch;
      }
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
      this.objs.push({ t: "mover", cx: this.X(c), cy: this.Y(r), hw: w * this.cell / 2, hh: h * this.cell / 2, ax: (this.mirror ? -ac : ac) * this.cell, ay: ar * this.cell, spd, ph });
      return this;
    }
    saw(c, r, rad, ac, ar, spd = 1.8, ph = 0) {
      this.objs.push({ t: "saw", cx: this.X(c), cy: this.Y(r), r: rad, ax: (this.mirror ? -ac : ac) * this.cell, ay: ar * this.cell, spd, ph });
      return this;
    }
    key(c, r) {
      this.pt.keys.push({ x: this.X(c), y: this.Y(r) });
      return this;
    }
    door(c0, r0, c1, r1) {
      return this.box(c0, r0, c1, r1, "D");
    }
    _rect(c0, r0, c1, r1) {
      let a = Math.min(c0, c1), b = Math.max(c0, c1);
      const t = Math.min(r0, r1), u = Math.max(r0, r1);
      if (this.mirror) {
        const m = this.n - 1;
        [a, b] = [m - b, m - a];
      }
      return { cx: -HALF + (a + b + 1) / 2 * this.cell, cy: HALF - (t + u + 1) / 2 * this.cell, hw: (b - a + 1) * this.cell / 2, hh: (u - t + 1) * this.cell / 2 };
    }
    /** one-way gate filling cells (c0,r0)-(c1,r1) (a 1-cell-thick line); the ball may only pass towards dir: "L" "R" "U" "D" */
    gate(c0, r0, c1, r1, dir) {
      this.objs.push({ t: "gate", ...this._rect(c0, r0, c1, r1), dir: this._dir(dir) });
      return this;
    }
    _dir(d) {
      return this.mirror ? d === "L" ? "R" : d === "R" ? "L" : d : d;
    }
    /** laser beam filling cells (c0,r0)-(c1,r1); lit for `duty` seconds out of every `period` (period 0 = always on) */
    laser(c0, r0, c1, r1, period = 2.4, duty = 1.2, ph = 0) {
      this.objs.push({ t: "laser", ...this._rect(c0, r0, c1, r1), period, duty, ph });
      return this;
    }
    /** fan: air stream over cells (c0,r0)-(c1,r1) pushing towards dir ("L" "R" "U" "D"); power in units/s^2 (gravity is 720) */
    fan(c0, r0, c1, r1, dir, power = 1100) {
      this.objs.push({ t: "fan", ...this._rect(c0, r0, c1, r1), dir: this._dir(dir), power });
      return this;
    }
    /** linked pair of portals at cells (c,r) and (c2,r2) */
    port(c, r, c2, r2) {
      this.objs.push({ t: "port", x: this.X(c), y: this.Y(r), x2: this.X(c2), y2: this.Y(r2) });
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
  function compile(def, opts = {}) {
    let b;
    if (def.build) {
      b = new Builder(def.grid || GRID, !!opts.mirror);
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
    const solidAt = (c, r) => "#=XD".includes(at(c, r));
    const solids = [], kills = [], crystals = [], pads = [], movers = [], saws = [];
    const doors = [], gates = [], lasers = [], fans = [], ports = [];
    const DIR = { L: [-1, 0], R: [1, 0], U: [0, 1], D: [0, -1] };
    for (const rc of mergeRuns(maskOf("D"), n)) doors.push(toBox(rc));
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
      else if (o.t === "gate" || o.t === "fan") {
        const d = DIR[o.dir];
        if (!d) throw new Error(`level ${def.id}: ${o.t} needs dir L/R/U/D`);
        const base = { k: K_BOX, cx: o.cx, cy: o.cy, hw: o.hw, hh: o.hh, c: 1, s: 0, dx: d[0], dy: d[1], dir: o.dir };
        if (o.t === "gate") gates.push({ ...base, half: d[0] ? o.hh : o.hw });
        else fans.push({ ...base, power: o.power });
      } else if (o.t === "laser") {
        const thin = o.hw >= o.hh ? { hw: o.hw, hh: Math.min(o.hh, 3.5) } : { hw: Math.min(o.hw, 3.5), hh: o.hh };
        lasers.push({ k: K_BOX, cx: o.cx, cy: o.cy, ...thin, c: 1, s: 0, period: o.period, duty: o.duty, ph: o.ph });
      } else if (o.t === "port") {
        const i = ports.length;
        ports.push({ x: o.x, y: o.y, to: i + 1, pair: i >> 1 }, { x: o.x2, y: o.y2, to: i, pair: i >> 1 });
      }
    }
    if (doors.length && !b.pt.keys.length) throw new Error(`level ${def.id}: doors need a key`);
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
      keys: b.pt.keys,
      keyMask: (1 << b.pt.keys.length) - 1,
      doors,
      gates,
      lasers,
      fans,
      ports,
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

  // src/levels/world2.js
  var WORLD2 = [
    {
      // Pad: a low cave, a hole in the floor and spikes overhead; the pad's throw is the way across.
      id: "2-1",
      tut: "pad",
      build(b) {
        b.frame();
        b.box(1, 1, 26, 9);
        b.clear(14, 27, 22, 27);
        b.v(13, 10, 21).h(22, 13, 23);
        b.spikes(14, 23, 22, 23);
        b.h(14, 1, 6).h(20, 6, 11);
        b.put(">", 10, 26).put(">", 11, 26);
        b.start(3, 12.6).goal(25.6, 25.6);
        b.gem(4, 18).gem(9, 18.6).gem(24.5, 19);
      }
    },
    {
      // Two hops: a pad at the end of each platform throws you over the spiked gap.
      id: "2-2",
      build(b) {
        b.frame();
        b.box(1, 1, 26, 16).clear(1, 9, 7, 16);
        b.h(12, 1, 4);
        b.box(1, 21, 7, 26).box(12, 21, 16, 26).box(21, 21, 26, 26);
        b.spikes(8, 26, 11, 26).spikes(17, 26, 20, 26);
        b.spikes(8, 17, 11, 17).spikes(17, 17, 20, 17);
        b.put(">", 6, 20).put(">", 7, 20).put(">", 15, 20).put(">", 16, 20);
        b.start(3, 10.6).goal(25.6, 19.6);
        b.gem(5, 19.6).gem(14, 19.6).gem(23, 19.6);
      }
    },
    {
      // Valley: roll down one ramp, the pad throws you up the other, over the spikes.
      id: "2-3",
      build(b) {
        b.frame();
        b.diag(1, 8, 9, 16).diag(10, 17, 17, 10);
        b.box(1, 24, 26, 26);
        b.put(">", 9, 16).put(">", 10, 16);
        b.spikes(18, 23, 22, 23);
        b.h(11, 18, 20);
        b.start(2.6, 6.6).goal(25.6, 22.6);
        b.gem(7, 11).gem(13, 11).gem(19, 8);
      }
    },
    {
      // Chimney: the only way up through the slab is the pad under the hole.
      id: "2-4",
      build(b) {
        b.frame();
        b.h(18, 1, 9).h(18, 15, 26);
        b.spikes(1, 19, 9, 19).spikes(15, 19, 26, 19);
        b.put("A", 11, 26).put("A", 12, 26).put("A", 13, 26);
        b.start(3, 25.6).goal(25.6, 16.6);
        b.gem(7, 25.6).gem(20, 25.6).gem(4, 16.6);
      }
    },
    {
      // Hop and lift: throw across the spikes, then rocket up through the slab.
      id: "2-5",
      build(b) {
        b.frame();
        b.box(1, 22, 7, 26).box(14, 22, 26, 26);
        b.spikes(8, 26, 13, 26);
        b.h(14, 1, 19).h(14, 25, 26);
        b.spikes(1, 15, 19, 15).spikes(25, 15, 26, 15);
        b.put(">", 6, 21).put(">", 7, 21);
        b.put("A", 21, 21).put("A", 22, 21).put("A", 23, 21);
        b.start(3, 20.6).goal(1.4, 12.6);
        b.gem(5, 20.6).gem(11, 19).gem(12, 9);
      }
    },
    {
      // Ferry: the only bridge over the spiked pit is a moving platform.
      id: "2-6",
      tut: "mover",
      build(b) {
        b.frame();
        b.box(1, 1, 26, 16);
        b.box(1, 21, 8, 26).box(19, 21, 26, 26);
        b.spikes(9, 17, 18, 17).spikes(9, 26, 18, 26);
        b.mover(13.5, 21, 3, 1, 3.5, 0, 1, 1.57);
        b.start(3, 19.6).goal(25.6, 19.6);
        b.gem(6, 19.6).gem(13.5, 19.6).gem(23, 19.6);
      }
    },
    {
      // Doorman: a plug slides up and down in the doorway. Slip through when it is high.
      id: "2-7",
      build(b) {
        b.frame();
        b.v(13, 1, 19);
        b.mover(13, 23, 1, 5, 0, 1, 1.3);
        b.h(12, 1, 8).h(18, 4, 10);
        b.start(3, 10.6).goal(25.6, 25.6);
        b.gem(6, 16.6).gem(8, 25.6).gem(20, 12);
      }
    },
    {
      // Saw: a blade bobs across the corridor. Run through while it is up.
      id: "2-8",
      tut: "saw",
      build(b) {
        b.frame();
        b.box(1, 1, 26, 15);
        b.box(1, 23, 26, 26);
        b.saw(13, 20, 14, 0, 3, 1.3, 3.14);
        b.start(3, 21.6).goal(25.6, 21.6);
        b.gem(7, 21.6).gem(20, 17).gem(23, 21.6);
      }
    },
    {
      // Sieve: the pegs spill the ball onto a sliding shelf that decides where it falls.
      id: "2-9",
      build(b) {
        b.frame();
        b.h(4, 11, 16);
        [[8, [6, 11, 16, 21]], [11, [4, 9, 14, 19, 24]]].forEach(([r, cols]) => cols.forEach((c) => b.put("o", c, r)));
        b.mover(14, 16, 7, 1, 6.5, 0, 1.3);
        b.spikes(10, 26, 26, 26);
        b.v(5, 21, 26).v(9, 21, 26);
        b.diag(1, 17, 4, 20).diag(10, 20, 13, 17);
        b.start(13.5, 2.6).goal(7, 25.6);
        b.gem(14, 7).gem(7, 13).gem(21, 14);
      }
    },
    {
      // Pinball: the pad fires you into the bumpers, the corner is the goal.
      id: "2-10",
      build(b) {
        b.frame();
        b.spikes(1, 26, 10, 26);
        b.put("A", 13, 26).put("A", 14, 26);
        [[7, 14], [20, 14], [14, 8], [4, 5], [23, 6]].forEach(([c, r]) => b.put("O", c, r));
        [[10, 11], [17, 11], [10, 4], [18, 4]].forEach(([c, r]) => b.put("o", c, r));
        b.start(25.6, 25.6).goal(1.4, 1.4);
        b.gem(14, 16).gem(7, 9).gem(21, 9);
      }
    },
    {
      // Orchard: bumpers, pegs, a sliding plate and a blade guard the corner cup.
      id: "2-11",
      build(b) {
        b.frame();
        b.h(4, 12, 16);
        [[7, 9], [20, 9], [13, 13]].forEach(([c, r]) => b.put("O", c, r));
        [[4, 12], [10, 16], [17, 16], [24, 12], [14, 8]].forEach(([c, r]) => b.put("o", c, r));
        b.mover(14, 20, 6, 1, 6, 0, 1.4);
        b.spikes(1, 26, 21, 26);
        b.v(22, 21, 26);
        b.saw(24, 22, 12, 0, 2, 1.6);
        b.saw(8, 17, 12, 3, 0, 1.5).saw(19, 6, 12, 3, 0, 1.7, 2);
        b.start(13.5, 2.6).goal(25.6, 25.6);
        b.gem(14, 6).gem(5, 17).gem(24, 17);
      }
    },
    {
      // Sawmill: three shelves, a blade bobbing through each.
      id: "2-12",
      build(b) {
        b.frame();
        b.h(8, 1, 19).h(15, 8, 26).h(22, 1, 19);
        b.saw(11, 6, 12, 0, 3, 1.4);
        b.saw(17, 13, 12, 0, 3, 1.4, 2);
        b.saw(10, 20, 12, 0, 3, 1.4, 4);
        b.start(3, 6.6).goal(25.6, 25.6);
        b.gem(6, 6.6).gem(22, 13.6).gem(14, 25.6);
      }
    },
    {
      // Shaft: the pad throws you up the hole in the slab; a saw sweeps across it.
      id: "2-13",
      build(b) {
        b.frame();
        b.h(15, 1, 9).h(15, 15, 26);
        b.saw(12, 15, 12, 2.5, 0, 1.5);
        b.put("A", 11, 26).put("A", 12, 26).put("A", 13, 26);
        b.start(3, 25.6).goal(25.6, 13.6);
        b.gem(7, 25.6).gem(5, 13.6).gem(20, 25.6);
      }
    },
    {
      // Shutter: pegs spill into the cup, but a sliding plate covers its mouth.
      id: "2-14",
      build(b) {
        b.frame();
        b.h(4, 1, 6);
        [[9, [5, 10, 15, 20, 25]], [13, [3, 8, 13, 18, 23]], [17, [5, 10, 15, 20, 25]]].forEach(([r, cols]) => cols.forEach((c) => b.put("o", c, r)));
        b.v(18, 23, 26).v(23, 23, 26);
        b.spikes(1, 26, 17, 26);
        b.mover(20.5, 22, 5, 1, 3, 0, 1.1);
        b.start(3, 2.6).goal(20.5, 25.6);
        b.gem(14, 7).gem(8, 15).gem(20, 19);
      }
    },
    {
      // Triple throw: across, up, and back over the saws.
      id: "2-15",
      build(b) {
        b.frame();
        b.box(1, 22, 8, 26).box(16, 22, 26, 26);
        b.spikes(9, 26, 15, 26);
        b.h(14, 17, 21).h(14, 25, 26);
        b.box(1, 14, 9, 15);
        b.put(">", 7, 21).put(">", 8, 21);
        b.put("A", 22, 21).put("A", 23, 21).put("A", 24, 21);
        b.put("<", 17, 13).put("<", 18, 13);
        b.saw(12, 21, 14, 0, 3, 2.2);
        b.saw(13, 11, 14, 0, 3, 2.2, 2);
        b.saw(21, 7, 12, 3, 0, 1.8);
        b.start(3, 20.6).goal(1.4, 12.6);
        b.gem(5, 20.6).gem(20, 20).gem(5, 12.6);
      }
    },
    {
      // Lift: step on at the bottom, ride up the shaft, step off onto the high shelf.
      id: "2-16",
      build(b) {
        b.frame();
        b.box(1, 1, 26, 4);
        b.box(1, 22, 8, 26).v(8, 5, 18);
        b.box(12, 10, 26, 26);
        b.spikes(9, 5, 11, 5).spikes(9, 26, 11, 26);
        b.mover(10, 16, 3, 1, 0, 6, 1);
        b.start(3, 20.6).goal(25.6, 8.6);
        b.gem(5, 20.6).gem(10, 14).gem(20, 8.6);
      }
    },
    {
      // Sunset run: hop, ferry, rocket up, then thread the bumpers home.
      id: "2-17",
      build(b) {
        b.frame();
        b.box(1, 22, 6, 26).box(11, 22, 16, 26).box(23, 22, 26, 26);
        b.spikes(7, 26, 10, 26).spikes(17, 26, 22, 26);
        b.h(15, 1, 21).h(15, 26, 26);
        b.spikes(1, 16, 21, 16);
        b.put(">", 5, 21).put(">", 6, 21);
        b.put("A", 23, 21).put("A", 24, 21).put("A", 25, 21);
        b.mover(19.5, 22, 3, 1, 1.5, 0, 1.2, 1.57);
        b.saw(8.5, 20, 12, 0, 2, 1.7);
        b.saw(19.5, 19, 12, 0, 2, 1.3, 1);
        b.put("O", 14, 12).put("O", 8, 11).put("o", 18, 12).put("o", 11, 13);
        b.saw(4, 11, 12, 0, 2, 1.5, 2);
        b.start(3, 20.6).goal(1.4, 13.6);
        b.gem(14, 20.6).gem(24.5, 20.6).gem(20, 8);
      }
    },
    {
      // Ferry and lift: across the pit on the shuttle, then up the shaft.
      id: "2-18",
      build(b) {
        b.frame();
        b.box(1, 1, 26, 6);
        b.box(7, 7, 14, 17);
        b.spikes(7, 18, 14, 18).spikes(7, 26, 14, 26);
        b.box(1, 22, 6, 26).box(15, 22, 19, 26).v(19, 7, 18);
        b.box(23, 10, 26, 26);
        b.spikes(20, 26, 22, 26);
        b.mover(10.5, 22, 3, 1, 2.5, 0, 1);
        b.mover(21, 16, 3, 1, 0, 6, 1);
        b.start(3, 20.6).goal(25.6, 8.6);
        b.gem(4, 20.6).gem(17, 20.6).gem(24.5, 8.6);
      }
    },
    {
      // Updraft: two chimneys, three floors. Time the saw over the first hole and the one bobbing above it.
      id: "2-19",
      build(b) {
        b.frame();
        b.h(19, 1, 20).h(19, 26, 26);
        b.spikes(1, 20, 20, 20);
        b.h(12, 5, 26);
        b.spikes(5, 13, 26, 13);
        b.put("A", 22, 26).put("A", 23, 26).put("A", 24, 26);
        b.put("A", 2, 18).put("A", 3, 18);
        b.saw(23, 19, 12, 2, 0, 1.4);
        b.saw(12, 16, 12, 0, 2, 1.4, 2);
        b.saw(14, 8, 12, 0, 2, 1.6, 4);
        b.start(3, 25.6).goal(25.6, 10.6);
        b.gem(10, 25.6).gem(14, 17.6).gem(20, 10.6);
      }
    },
    {
      // Chimneys: fall through the gap in each shelf while the blade sweeps it.
      id: "2-20",
      build(b) {
        b.frame();
        b.h(7, 1, 22).h(13, 5, 26).h(19, 1, 22);
        b.saw(24.5, 10, 12, 1.5, 0, 1.8);
        b.saw(2.5, 16, 12, 1.5, 0, 1.8, 2);
        b.saw(24.5, 22, 12, 1.5, 0, 1.8, 4);
        b.start(3, 5.6).goal(25.6, 25.6);
        b.gem(14, 5.6).gem(14, 11.6).gem(14, 17.6);
      }
    }
  ];

  // src/levels/world3.js
  var WORLD3 = [
    {
      // Key and door: the floor on the right is a door; grab the key and it opens.
      id: "3-1",
      tut: "key",
      build(b) {
        b.frame();
        b.h(14, 1, 15);
        b.door(16, 14, 26, 14);
        b.key(21, 12.6);
        b.start(4, 12.6).goal(25.6, 25.6);
        b.gem(8, 12.6).gem(13, 12.6).gem(14, 25.6);
      }
    },
    {
      // The key hides in the ceiling corner; the door seals the only way across.
      id: "3-2",
      build(b) {
        b.frame();
        b.v(14, 1, 19);
        b.door(14, 20, 14, 26);
        b.key(1.4, 1.4);
        b.start(4, 25.6).goal(25.6, 25.6);
        b.gem(8, 25.6).gem(8, 1.4).gem(20, 25.6);
      }
    },
    {
      // Gate: the doorway lets the ball into the chamber, never back out.
      id: "3-3",
      tut: "gate",
      build(b) {
        b.frame();
        b.h(17, 1, 17);
        b.h(8, 18, 26).v(18, 9, 12).gate(18, 13, 18, 16, "R").v(18, 17, 20).h(20, 19, 26);
        b.start(4, 15.6).goal(25.6, 18.6);
        b.gem(9, 15.6).gem(14, 15.6).gem(22, 9.4);
      }
    },
    {
      // One-way drop: go over the top, come down through the gate, no way back up.
      id: "3-4",
      build(b) {
        b.frame();
        b.h(9, 1, 9).gate(10, 9, 16, 9, "D").h(9, 17, 26);
        b.h(18, 1, 18);
        b.start(4, 7.6).goal(25.6, 25.6);
        b.gem(7, 7.6).gem(22, 7.6).gem(10, 25.6);
      }
    },
    {
      // Gate in, key in the ceiling corner of the middle room, door in the second wall.
      id: "3-5",
      build(b) {
        b.frame();
        b.v(9, 1, 22).gate(9, 23, 9, 26, "R");
        b.v(18, 1, 19).door(18, 20, 18, 26);
        b.key(10.4, 1.4);
        b.start(3, 25.6).goal(25.6, 25.6);
        b.gem(6.5, 25.6).gem(14, 25.6).gem(22, 25.6);
      }
    },
    {
      // Over the spikes on the ceiling to the key, back down onto the landing strip, through the door.
      id: "3-6",
      build(b) {
        b.frame();
        b.box(9, 9, 10, 26).spikes(11, 26, 15, 26);
        b.box(21, 1, 22, 18).door(21, 19, 22, 26);
        b.key(14, 1.4);
        b.start(3, 25.6).goal(25.6, 25.6);
        b.gem(5, 1.4).gem(18, 25.6).gem(1.4, 13);
      }
    },
    {
      // Ratchet: each shelf has one way down, a one-way gate. Collect before you drop.
      id: "3-7",
      build(b) {
        b.frame();
        b.h(8, 1, 19).gate(20, 8, 26, 8, "D");
        b.gate(1, 15, 7, 15, "D").h(15, 8, 26);
        b.h(22, 1, 19).gate(20, 22, 26, 22, "D");
        b.start(3, 6.6).goal(1.4, 25.6);
        b.gem(12, 6.6).gem(18, 13.6).gem(8, 20.6);
      }
    },
    {
      // Elevator: the pad throws you up through a one-way hatch. No coming back down.
      id: "3-8",
      build(b) {
        b.frame();
        b.h(12, 1, 4).gate(5, 12, 8, 12, "U").h(12, 9, 26);
        b.put("A", 6, 26);
        b.start(3, 25.6).goal(25.6, 10.6);
        b.gem(14, 25.6).gem(14, 10.6).gem(25.6, 1.4);
      }
    },
    {
      // Jail: the gate lets you into the cell, the key in the cell unlocks the floor under it.
      id: "3-9",
      build(b) {
        b.frame();
        b.h(17, 1, 12);
        b.h(10, 13, 22).v(13, 11, 13).gate(13, 14, 13, 16, "R").v(13, 17, 18).v(22, 11, 18);
        b.h(18, 13, 15).door(16, 18, 19, 18).h(18, 20, 22);
        b.key(18, 16.6);
        b.start(4, 15.6).goal(25.6, 25.6);
        b.gem(8, 15.6).gem(15, 16.6).gem(10, 25.6);
      }
    },
    {
      // Two keys: one in the left ceiling corner, one over the wall; the door is the roof of the goal pocket.
      id: "3-10",
      build(b) {
        b.frame();
        b.box(14, 8, 15, 26);
        b.v(16, 22, 26).box(17, 21, 26, 22);
        b.door(17, 21, 26, 22);
        b.key(1.4, 1.4).key(25.6, 1.4);
        b.start(4, 25.6).goal(25.6, 25.6);
        b.gem(8, 25.6).gem(14.5, 1.4).gem(21, 19.6);
      }
    },
    {
      // Saw patrol: cross to the key and come back past the saw to drop through the floor door.
      id: "3-11",
      build(b) {
        b.frame();
        b.door(1, 12, 8, 12).h(12, 9, 26);
        b.saw(15, 6, 12, 0, 5, 1.6);
        b.key(24, 10.6);
        b.start(4, 10.6).goal(1.4, 25.6);
        b.gem(11, 10.6).gem(20, 1.4).gem(8, 25.6);
      }
    },
    {
      // Pinball: bumpers shake you down past the spikes, the gate lets you through, the key is in the far ceiling corner and the goal pocket is sealed.
      id: "3-12",
      build(b) {
        b.frame();
        b.v(14, 1, 20).gate(14, 21, 14, 25, "R");
        b.v(19, 22, 26).box(20, 21, 26, 21).door(20, 21, 26, 21);
        b.key(25.6, 1.4);
        [[4, 7], [9, 7], [6.5, 11], [11.5, 11], [4, 15], [9, 15], [6.5, 19], [11.5, 19]].forEach(([c, r]) => b.put("O", c, r));
        b.spikes(1, 26, 7, 26);
        b.start(7, 2.6).goal(25.6, 25.6);
        b.gem(8, 9).gem(12, 25.6).gem(17, 25.6);
      }
    },
    {
      // Lift: ride the moving platform up to the key ledge, then back down to the door.
      id: "3-13",
      build(b) {
        b.frame();
        b.h(12, 1, 9);
        b.mover(13, 18.5, 4, 1, 0, 6, 1.2);
        b.box(17, 1, 18, 18).door(17, 19, 18, 26);
        b.key(4, 10.6);
        b.start(3, 25.6).goal(25.6, 25.6);
        b.gem(8, 10.6).gem(13, 25.6).gem(22, 25.6);
      }
    },
    {
      // Elevator to the key: pad up through the opening, land on the ledge, door shuts off the goal.
      id: "3-14",
      build(b) {
        b.frame();
        b.h(12, 1, 12);
        b.put("A", 18, 26);
        b.box(21, 1, 22, 18).door(21, 19, 22, 26);
        b.key(6, 10.6);
        b.start(3, 25.6).goal(25.6, 25.6);
        b.gem(8, 10.6).gem(10, 25.6).gem(25.6, 10);
      }
    },
    {
      // Wrong-way gate: the short way across only opens leftwards. Go under, up through the gap, onto the far shelf.
      id: "3-15",
      build(b) {
        b.frame();
        b.h(10, 1, 9).h(10, 19, 26);
        b.v(14, 1, 6).gate(14, 7, 14, 9, "L").v(14, 10, 21);
        b.start(4, 8.6).goal(25.6, 8.6);
        b.gem(6, 8.6).gem(20, 25.6).gem(22, 8.6);
      }
    },
    {
      // Zigzag with two keys and a saw sweeping the middle shelf; the last gap is a door.
      id: "3-16",
      build(b) {
        b.frame();
        b.h(8, 1, 22).h(15, 5, 26).h(22, 1, 22).door(23, 22, 26, 22);
        b.spikes(1, 26, 19, 26);
        b.saw(14, 11, 12, 0, 3, 1.5);
        b.key(24, 13.6).key(3, 20.6);
        b.start(3, 6.6).goal(25.6, 25.6);
        b.gem(14, 6.6).gem(8, 13.6).gem(14, 20.6);
      }
    },
    {
      // Alcove: the gate lets you in for the key, the alcove drops you out below the door, and a saw guards the way to the goal.
      id: "3-17",
      build(b) {
        b.frame();
        b.h(10, 1, 14);
        b.v(15, 3, 6).gate(15, 7, 15, 9, "R").h(3, 15, 26).h(10, 15, 19);
        b.box(12, 11, 13, 18).door(12, 19, 13, 26);
        b.key(17.5, 8.6);
        b.saw(6, 23.5, 12, 0, 2.5, 1.6);
        b.start(4, 8.6).goal(1.4, 25.6);
        b.gem(8, 8.6).gem(22, 25.6).gem(6, 25.6);
      }
    },
    {
      // Ring road: the gates only turn one way, so you must take the long way round for both keys.
      id: "3-18",
      build(b) {
        b.frame();
        b.h(7, 8, 11).door(12, 7, 15, 7).h(7, 16, 19).v(8, 8, 19).v(19, 8, 19).h(20, 8, 19);
        b.gate(14, 21, 14, 26, "R").gate(21, 1, 21, 6, "L");
        b.saw(10, 23.5, 12, 0, 2.5, 1.7).saw(17, 3.5, 12, 0, 2.5, 1.4);
        b.key(3, 25.6).key(25.6, 1.4);
        b.start(4, 3.6).goal(9.4, 18.6);
        b.gem(4, 12).gem(22, 25.6).gem(13.5, 1.4);
      }
    },
    {
      // Ferry: ride the platform over the spike pit to the second key, then up through the opened roof.
      id: "3-19",
      build(b) {
        b.frame();
        b.box(1, 24, 5, 26).box(21, 24, 26, 26);
        b.spikes(6, 26, 20, 26);
        b.mover(13.5, 24.5, 4, 1, 5, 0, 1.1);
        b.saw(23.5, 17, 11, 0, 2, 1.8);
        b.v(16, 1, 11).box(17, 10, 26, 11).door(17, 10, 26, 11);
        b.key(3, 1.4).key(24, 22.6);
        b.start(3, 22.6).goal(25.6, 1.4);
        b.gem(3, 12).gem(12, 15).gem(24, 15);
      }
    },
    {
      // Tower: pad up the hatch, first key and a saw in the middle, pad up the second hatch, second key, door, goal.
      id: "3-20",
      build(b) {
        b.frame();
        b.h(18, 1, 4).gate(5, 18, 7, 18, "U").h(18, 8, 26);
        b.h(9, 1, 20).gate(21, 9, 23, 9, "U").h(9, 24, 26);
        b.put("A", 6, 26).put("A", 22, 17);
        b.saw(14, 13.5, 12, 0, 3, 2.1).saw(7.5, 5.5, 14, 0, 3, 1.9);
        b.box(14, 1, 15, 8).door(14, 1, 15, 8);
        b.key(11, 16.6).key(25, 7.6);
        b.start(3, 25.6).goal(1.4, 7.6);
        b.gem(18, 16.6).gem(8, 7.6).gem(17, 1.4);
      }
    }
  ];

  // src/levels/world4.js
  var WORLD4 = [
    {
      // Fan lift: spiked roof above the slab, so only the gentle stream lifts you high enough.
      id: "4-1",
      tut: "fan",
      build(b) {
        b.frame();
        b.h(14, 1, 9).h(14, 18, 26);
        b.spikes(1, 7, 26, 7);
        b.diag(1, 18, 8, 25).diag(19, 25, 26, 18);
        b.fan(10, 14, 17, 25, "U", 940);
        b.start(13.5, 25.6).goal(25.6, 12.6);
        b.gem(14, 19).gem(8, 12.6).gem(22, 12.6);
      }
    },
    {
      // Chimney: roll against the stopper inside the shaft and ride the draught up to the shelf.
      id: "4-2",
      build(b) {
        b.frame();
        b.v(11, 6, 22).v(16, 6, 22);
        b.box(16, 24, 17, 26);
        b.h(6, 1, 10);
        b.fan(12, 6, 15, 26, "U", 830);
        b.start(4, 25.6).goal(1.4, 4.6);
        b.gem(8, 25.6).gem(13.5, 14).gem(5, 4.6);
      }
    },
    {
      // Two lifts: ride the right draught up, cross over, ride the left draught to the top.
      id: "4-3",
      build(b) {
        b.frame();
        b.h(18, 1, 18).h(10, 9, 26);
        b.fan(20, 18, 26, 25, "U", 900);
        b.fan(2, 10, 8, 17, "U", 900);
        b.start(4, 25.6).goal(25.6, 8.6);
        b.gem(14, 25.6).gem(13, 16.6).gem(14, 8.6);
      }
    },
    {
      // Headwind: crawl up the tunnel against the stream.
      id: "4-4",
      build(b) {
        b.frame();
        b.h(10, 1, 26).h(18, 1, 22);
        b.v(22, 18, 26);
        b.clear(23, 10, 26, 10);
        b.fan(1, 11, 26, 17, "R", 560);
        b.start(25.6, 16.6).goal(1.4, 16.6);
        b.gem(18, 16.6).gem(10, 16.6).gem(24.5, 25.6);
      }
    },
    {
      // Laser: a long dark gap — drop through the hole while the beam is off.
      id: "4-5",
      tut: "laser",
      build(b) {
        b.frame();
        b.h(12, 1, 12).h(12, 17, 26);
        b.laser(13, 13, 16, 13, 3, 1, 1.8);
        b.start(4, 10.6).goal(25.6, 25.6);
        b.gem(9, 10.6).gem(14.5, 19).gem(22, 25.6);
      }
    },
    {
      // Beam corridor: slip past the first beam, wait in the pocket, then the second.
      id: "4-6",
      build(b) {
        b.frame();
        b.h(18, 1, 23).h(9, 4, 26);
        b.laser(12, 19, 12, 26, 3, 1, 0);
        b.laser(14, 10, 14, 17, 3, 1, 1.5);
        b.start(3, 25.6).goal(1.4, 16.6);
        b.gem(8, 25.6).gem(24.5, 25.6).gem(20, 16.6);
      }
    },
    {
      // Draught under the beam: the chimney exit is guarded by a laser.
      id: "4-7",
      build(b) {
        b.frame();
        b.v(11, 6, 22).v(16, 6, 22);
        b.box(16, 24, 17, 26);
        b.h(6, 1, 10);
        b.fan(12, 6, 15, 26, "U", 830);
        b.laser(12, 9, 15, 9, 3.2, 1.4, 2.6);
        b.start(4, 25.6).goal(1.4, 4.6);
        b.gem(8, 25.6).gem(13.5, 14).gem(5, 4.6);
      }
    },
    {
      // Key lift: fetch the key from the floor, then ride up to the sealed vault.
      id: "4-8",
      build(b) {
        b.frame();
        b.h(14, 1, 11).h(14, 16, 26);
        b.fan(12, 14, 15, 25, "U", 900);
        b.door(20, 1, 20, 13);
        b.key(24, 25.6);
        b.start(4, 25.6).goal(25.6, 12.6);
        b.gem(8, 25.6).gem(13.5, 18).gem(4, 12.6);
      }
    },
    {
      // Saw in the shaft: the draught carries you up, the blade sweeps across — pick your moment.
      id: "4-9",
      build(b) {
        b.frame();
        b.v(10, 6, 22).v(19, 6, 22);
        b.box(19, 24, 20, 26);
        b.h(6, 1, 9);
        b.fan(11, 6, 18, 26, "U", 830);
        b.saw(14.5, 15, 12, 2.6, 0, 1.7, 0);
        b.start(4, 25.6).goal(1.4, 4.6);
        b.gem(7, 25.6).gem(14.5, 21).gem(5, 4.6);
      }
    },
    {
      // Pinball lift: bumpers sling you out of the updraft towards the exit.
      id: "4-10",
      build(b) {
        b.frame();
        b.v(8, 6, 22).v(19, 6, 22);
        b.h(6, 1, 7);
        b.box(19, 24, 20, 26);
        b.fan(9, 6, 18, 26, "U", 880);
        b.put("O", 17, 9).put("O", 11, 13);
        b.spikes(9, 2, 18, 2);
        b.start(4, 25.6).goal(1.4, 4.6);
        b.gem(7, 25.6).gem(13.5, 18).gem(4, 4.6);
      }
    },
    {
      // Beams behind a key: grab it past the first beam, drop to the lower hall, door and second beam.
      id: "4-11",
      build(b) {
        b.frame();
        b.h(13, 1, 23);
        b.laser(14, 1, 14, 12, 3, 1, 1);
        b.key(24, 11.6);
        b.door(12, 14, 12, 26);
        b.laser(6, 14, 6, 26, 3, 1, 0);
        b.start(3, 11.6).goal(1.4, 25.6);
        b.gem(9, 11.6).gem(20, 11.6).gem(18, 25.6);
      }
    },
    {
      // Ferry: the only way over the pit is the platform, and the beam crosses its path.
      id: "4-12",
      build(b) {
        b.frame();
        b.h(14, 1, 7).h(14, 21, 26);
        b.spikes(8, 26, 20, 26);
        b.laser(14, 1, 14, 13, 4, 1.4, 0);
        b.mover(14, 14.5, 5, 1, 4, 0, 1.4, 0);
        b.start(4, 12.6).goal(25.6, 12.6);
        b.gem(5, 8).gem(14, 20).gem(24, 12.6);
      }
    },
    {
      // Elevator: the shaft is blocked by the platform — hop on at the bottom, hop off at the top.
      id: "4-13",
      build(b) {
        b.frame();
        b.v(11, 3, 18).v(11, 22, 25);
        b.v(18, 3, 6).v(18, 10, 25);
        b.h(22, 1, 10).h(10, 18, 26).h(2, 11, 17);
        b.mover(14.5, 16.5, 5, 1, 0, 6, 1.1, 0);
        b.laser(6, 1, 6, 21, 2.6, 1.7, 0);
        b.laser(22, 3, 22, 9, 2.8, 1.7, 1.6);
        b.saw(14.5, 6, 12, 0, 1.2, 2.4, 0);
        b.start(3, 20.6).goal(25.6, 8.6);
        b.gem(3, 14).gem(14.5, 5).gem(24, 8.6);
      }
    },
    {
      // Pad and crosswind: the launcher throws you up, the stream carries you over the spikes.
      id: "4-14",
      build(b) {
        b.frame();
        b.h(22, 1, 8).h(22, 20, 26);
        b.spikes(9, 26, 19, 26);
        b.put("A", 7, 21);
        b.fan(6, 8, 21, 15, "R", 900);
        b.laser(14, 1, 14, 21, 2.6, 1.5, 0.8);
        b.laser(22, 1, 22, 21, 2.9, 1.7, 0.3);
        b.saw(18, 17, 12, 0, 2.4, 2.1, 0);
        b.start(3, 20.6).goal(25.6, 20.6);
        b.gem(14, 20).gem(10, 11).gem(24, 20.6);
      }
    },
    {
      // Crosswind: the stream shoves you towards the spikes; lean into it all the way down.
      id: "4-15",
      build(b) {
        b.frame();
        b.v(9, 5, 22).v(18, 5, 22);
        b.spikes(18, 5, 18, 22);
        b.h(5, 1, 9).h(23, 1, 9);
        b.fan(10, 5, 17, 22, "R", 480);
        b.start(4, 3.6).goal(1.4, 25.6);
        b.gem(12, 7).gem(13.5, 14).gem(4, 25.6);
      }
    },
    {
      // Tailwind tunnel: the stream shoves you at the second beam; hold back and wait for the gap.
      id: "4-16",
      build(b) {
        b.frame();
        b.h(15, 4, 26);
        b.laser(9, 16, 9, 26, 3, 1.8, 0.5);
        b.laser(18, 16, 18, 26, 3.4, 2, 2);
        b.fan(10, 16, 17, 26, "R", 560);
        b.start(2, 6.6).goal(25.6, 25.6);
        b.gem(14, 13.6).gem(13.5, 17.6).gem(22, 25.6);
      }
    },
    {
      // Sawmill: three lanes, a blade bobbing in each — the stream pushes you into them.
      id: "4-17",
      build(b) {
        b.frame();
        b.h(9, 1, 22).h(18, 5, 26);
        b.saw(14, 5, 14, 0, 2.8, 2.3, 0);
        b.fan(4, 1, 12, 8, "R", 520);
        b.saw(17, 13.5, 14, 0, 2.6, 2.3, 2);
        b.saw(9, 13.5, 14, 0, 2.6, 2.3, 5);
        b.fan(6, 10, 22, 17, "L", 500);
        b.laser(14, 19, 14, 26, 2.7, 1.7, 0);
        b.fan(5, 19, 13, 26, "R", 520);
        b.start(3, 7.6).goal(25.6, 25.6);
        b.gem(9, 7.6).gem(13, 11.4).gem(21, 25.6);
      }
    },
    {
      // Downdraft: ride the fast shafts down, each hole guarded by a beam.
      id: "4-18",
      build(b) {
        b.frame();
        b.h(7, 6, 26).h(13, 1, 21).h(19, 6, 26);
        b.fan(1, 8, 5, 12, "D", 1400);
        b.fan(22, 14, 26, 18, "D", 1400);
        b.laser(1, 8, 5, 8, 2.5, 1.5, 0);
        b.laser(22, 14, 26, 14, 2.5, 1.5, 1.2);
        b.laser(12, 8, 12, 12, 2.8, 1.5, 0.6);
        b.laser(14, 14, 14, 18, 3.1, 1.6, 2);
        b.spikes(9, 26, 14, 26);
        b.start(20, 5.6).goal(25.6, 25.6);
        b.gem(10, 5.6).gem(12, 11.6).gem(18, 17.6);
      }
    },
    {
      // Vault: lift to the key behind a beam, drop back, open the door, cross the second beam.
      id: "4-19",
      build(b) {
        b.frame();
        b.h(14, 1, 4).h(14, 9, 11).h(14, 16, 26);
        b.fan(5, 14, 8, 25, "U", 900);
        b.spikes(5, 2, 8, 2);
        b.laser(14, 1, 14, 13, 3, 1.2, 0);
        b.key(24, 12.6);
        b.gate(12, 14, 15, 14, "D");
        b.door(19, 15, 19, 26);
        b.laser(17, 15, 17, 26, 3.4, 1.2, 1.5);
        b.start(2, 25.6).goal(25.6, 25.6);
        b.gem(2, 12.6).gem(6.5, 19).gem(21, 12.6);
      }
    },
    {
      // Factory floor: four lanes — beams, blades, a key, a door and a stream against you.
      id: "4-20",
      build(b) {
        b.frame();
        b.h(7, 1, 22).h(14, 5, 26).h(21, 1, 22);
        b.laser(8, 1, 8, 6, 2.6, 1.7, 0);
        b.laser(17, 1, 17, 6, 2.9, 1.8, 1.1);
        b.saw(15, 10.5, 14, 0, 2.2, 2.2, 1);
        b.saw(9, 10.5, 14, 0, 2.2, 2.2, 4.1);
        b.fan(6, 8, 22, 13, "L", 480);
        b.key(2.4, 12.6);
        b.laser(9, 15, 9, 20, 2.7, 1.7, 0.5);
        b.laser(17, 15, 17, 20, 3, 1.8, 1.5);
        b.fan(5, 15, 16, 20, "R", 520);
        b.door(8, 22, 8, 26);
        b.laser(16, 22, 16, 26, 3, 1.8, 0.4);
        b.start(3, 5.6).goal(1.4, 25.6);
        b.gem(12.5, 5.6).gem(20, 12.6).gem(21, 19.6);
      }
    }
  ];

  // src/levels/world5.js
  var WORLD5 = [
    {
      // First portal: the goal sits in a sealed room; roll into the left portal, come out of the right one.
      id: "5-1",
      tut: "port",
      build(b) {
        b.frame();
        b.box(15, 17, 16, 26);
        b.h(17, 15, 26);
        b.h(9, 1, 12);
        b.port(6, 25.2, 21, 25.2);
        b.start(4, 7.6).goal(25.6, 25.6);
        b.gem(9, 7.6).gem(12, 25.6).gem(23, 24);
      }
    },
    {
      // Fall in at the bottom, drop out of the ceiling of the sealed room with all that speed.
      id: "5-2",
      build(b) {
        b.frame();
        b.h(11, 14, 26).v(14, 11, 26);
        b.h(8, 1, 7);
        b.port(5, 25.2, 20, 14);
        b.start(4, 6.6).goal(25.6, 25.6);
        b.gem(8, 25.6).gem(11, 12).gem(25, 14);
      }
    },
    {
      // Three floors, two pairs: climb the tower by stepping through the portals.
      id: "5-3",
      build(b) {
        b.frame();
        b.h(18, 0, 27).h(9, 0, 27);
        b.port(23, 25.2, 4, 16.2);
        b.port(23, 16.2, 4, 7.2);
        b.start(4, 24.6).goal(25.6, 7.6);
        b.gem(14, 25.6).gem(14, 16.6).gem(14, 7.6);
      }
    },
    {
      // The pillar in the spikes: land exactly on the top and the portal swallows you.
      id: "5-4",
      build(b) {
        b.frame();
        b.spikes(1, 26, 26, 26);
        b.box(11, 20, 17, 25);
        b.put("#", 11, 19).put("#", 17, 19);
        b.h(6, 1, 8);
        b.box(19, 11, 26, 12);
        b.v(19, 13, 20);
        b.port(14, 18.4, 23, 18.4);
        b.start(4, 4.6).goal(25.6, 20.6);
        b.gem(7, 4.6).gem(14, 12).gem(24, 17);
      }
    },
    {
      // No ground between the islands: the portal is the bridge.
      id: "5-5",
      build(b) {
        b.frame();
        b.clear(1, 27, 26, 27);
        b.h(22, 1, 11).h(22, 16, 26);
        b.v(13, 1, 21).v(14, 1, 21);
        b.port(6, 20.2, 21, 20.2);
        b.start(3, 3.6).goal(25.6, 20.6);
        b.gem(9, 20.6).gem(24, 20.6).gem(21, 2);
      }
    },
    {
      // Ramp for speed, portal for the jump: the exit flings you across the spike pit.
      id: "5-6",
      build(b) {
        b.frame();
        b.diag(1, 15, 12, 26);
        b.box(18, 22, 20, 26);
        b.box(24, 22, 26, 26);
        b.spikes(21, 26, 23, 26);
        b.h(14, 17, 26).v(17, 14, 20);
        b.port(15, 25.2, 19, 20.2);
        b.start(3, 6.6).goal(25.6, 20.6);
        b.gem(3, 12).gem(15, 24).gem(22, 20);
      }
    },
    {
      // The portal hangs high in a sealed shaft: only the launch pad gets you up to it.
      id: "5-7",
      build(b) {
        b.frame();
        b.v(11, 1, 22);
        b.v(18, 1, 26);
        b.put("A", 14, 26);
        b.port(14.5, 8, 22, 20.2);
        b.start(4, 25.6).goal(25.6, 25.6);
        b.gem(5, 14).gem(16, 14).gem(23, 4);
      }
    },
    {
      // The key is in a sealed cell: portal in, grab it, portal out, open the door.
      id: "5-8",
      build(b) {
        b.frame();
        b.box(18, 1, 19, 8).h(9, 18, 26);
        b.port(6, 25.2, 22, 7.2);
        b.key(24.5, 7.6);
        b.door(16, 18, 16, 26);
        b.h(17, 16, 26);
        b.start(4, 3.6).goal(25.6, 25.6);
        b.gem(11, 25.6).gem(3, 12).gem(22, 2);
      }
    },
    {
      // The saw patrols the low corridor in front of the portal: slip under it.
      id: "5-9",
      build(b) {
        b.frame();
        b.h(21, 5, 13);
        b.v(14, 1, 26);
        b.saw(8, 24, 12, 0, 1.8, 2);
        b.port(11.5, 25.2, 22, 25.2);
        b.start(9, 17.6).goal(25.6, 25.6);
        b.gem(3, 24).gem(10, 19).gem(20, 1.4);
      }
    },
    {
      // A shutter slides in the doorway; wait for it to open, then portal up to the goal room.
      id: "5-10",
      build(b) {
        b.frame();
        b.v(13, 1, 19).v(13, 26, 26);
        b.mover(13, 22.5, 1, 6, 0, 5, 1.2);
        b.box(19, 1, 20, 8).h(9, 19, 26);
        b.port(20, 25.2, 23, 7.2);
        b.start(4, 3.6).goal(25.6, 7.6);
        b.gem(5, 24).gem(16, 12).gem(24, 2);
      }
    },
    {
      // Cross-wind shaft: the wind shoves you onto the spikes. Lean into it all the way down.
      id: "5-11",
      build(b) {
        b.frame();
        b.h(6, 1, 9).h(6, 17, 26);
        b.v(9, 7, 23).v(17, 7, 23);
        b.spikes(16, 8, 16, 23);
        b.fan(10, 7, 15, 23, "R", 500);
        b.start(4, 4.6).goal(25.6, 25.6);
        b.gem(3, 4.6).gem(12, 15).gem(5, 25.6);
      }
    },
    {
      // The gate only opens towards the right, so the way home is the portal.
      id: "5-12",
      build(b) {
        b.frame();
        b.v(13, 1, 20).v(13, 26, 26);
        b.gate(13, 21, 13, 25, "R");
        b.port(20, 25.2, 6, 25.2);
        b.start(24, 3.6).goal(1.4, 25.6);
        b.gem(25, 25.6).gem(17, 12).gem(4, 14);
      }
    },
    {
      // A wall of laser splits the room. Hop it, then wait out the flashing beam at the goal.
      id: "5-13",
      build(b) {
        b.frame();
        b.laser(13, 1, 14, 26, 0);
        b.laser(18, 23, 26, 23, 3, 1.5);
        b.h(23, 15, 17);
        b.port(6, 25.2, 21, 25.2);
        b.start(4, 3.6).goal(25.6, 25.6);
        b.gem(3, 24).gem(23, 12).gem(24, 25.6);
      }
    },
    {
      // Pegs and bumpers: plinko down into the portal, plinko again out of its twin.
      id: "5-14",
      build(b) {
        b.frame();
        b.h(13, 1, 26);
        [4, 8, 12, 16, 20, 24].forEach((c) => b.put("o", c, 8));
        [6, 14, 22].forEach((c) => b.put("o", c, 4));
        b.put("O", 7, 18).put("O", 14, 18).put("O", 21, 18);
        [5, 10, 15, 20].forEach((c) => b.put("o", c, 22));
        b.diag(12, 21, 17, 26);
        b.spikes(1, 26, 11, 26);
        b.port(14, 11.2, 14, 15.4);
        b.start(2, 2).goal(25.6, 25.6);
        b.gem(13, 4).gem(24, 11).gem(24, 20);
      }
    },
    {
      // The spiral is plugged halfway. The portal skips the plug.
      id: "5-15",
      build(b) {
        b.frame();
        b.h(5, 1, 22).v(22, 5, 22).h(22, 5, 22).v(5, 10, 22);
        b.h(10, 6, 17).v(17, 10, 17).h(17, 10, 17).v(10, 10, 12).v(10, 16, 17);
        b.h(13, 23, 26);
        b.port(24.5, 11.2, 24.5, 17);
        b.start(3, 3.6).goal(15.6, 14);
        b.gem(24.5, 20).gem(2.5, 15).gem(13.5, 19.5);
      }
    },
    {
      // Vault: portal to the key, back out through the portal, then past the saw into the goal nook.
      id: "5-16",
      build(b) {
        b.frame();
        b.h(13, 5, 26);
        b.v(19, 1, 9).h(9, 19, 26);
        b.box(1, 19, 8, 23);
        b.door(8, 24, 8, 26);
        b.saw(4.5, 25, 13, 0, 3, 1.8);
        b.spikes(14, 26, 18, 26);
        b.port(14, 11.2, 22.5, 7.2);
        b.key(24.5, 7.6);
        b.start(3, 6.6).goal(1.4, 25.6);
        b.gem(8, 11.6).gem(23, 2).gem(24, 25.6);
      }
    },
    {
      // A headwind guards the corridor. Take the portal, then wait for the beam at the goal nook.
      id: "5-17",
      build(b) {
        b.frame();
        b.v(13, 1, 19).v(13, 26, 26);
        b.box(13, 20, 14, 20);
        b.fan(8, 21, 19, 25, "L", 3e3);
        b.h(13, 5, 12);
        b.h(9, 17, 24);
        b.port(8.5, 11.2, 20.5, 7.2);
        b.h(19, 21, 26);
        b.laser(21, 20, 21, 26, 2.8, 1.4);
        b.spikes(15, 26, 20, 26);
        b.start(3, 3.6).goal(25.6, 25.6);
        b.gem(3, 11).gem(24, 3).gem(5, 24);
      }
    },
    {
      // Round the pillar one way only: gates behind you, saws on the left and the right, laser across the top. Portal over the laser.
      id: "5-18",
      build(b) {
        b.frame();
        b.box(5, 8, 22, 19);
        b.gate(1, 13, 4, 13, "U");
        b.gate(13, 20, 13, 26, "L");
        b.laser(13, 1, 13, 7, 0);
        b.saw(2.5, 17, 13, 1.5, 0, 1.8);
        b.saw(24.5, 5, 13, 1.5, 0, 2.2, 1.5);
        b.laser(1, 10, 4, 10, 2.6, 1.3);
        b.laser(23, 9, 26, 9, 2.4, 1.2, 0.6);
        b.port(4, 4, 24.5, 14);
        b.start(3, 24).goal(25.6, 1.4);
        b.gem(3, 10).gem(10, 3).gem(24.5, 21);
      }
    },
    {
      // Switchback: two three-high channels. Pads kick you back off the floor, spikes bite from the ceiling.
      id: "5-19",
      build(b) {
        b.frame();
        b.h(16, 1, 26).h(17, 1, 26);
        b.h(18, 1, 26);
        b.spikes(14, 18, 17, 18).spikes(4, 18, 6, 18);
        b.h(22, 1, 26).h(23, 1, 26);
        b.spikes(11, 23, 14, 23).spikes(21, 23, 23, 23);
        b.put("<", 8, 26).put("<", 17, 26);
        b.laser(5, 24, 5, 26, 3.2, 2.2);
        b.saw(12.5, 20, 12, 0, 2.4, 2);
        b.put(">", 20, 21).put(">", 9, 21);
        b.port(25, 25.2, 25, 20.2);
        b.port(2, 20.2, 4, 14.2);
        b.start(2, 25.2).goal(25.6, 14.6);
        b.gem(5, 25.6).gem(15, 20.6).gem(15, 14.6);
      }
    },
    {
      // Final exam: saw and beam, up through the portal, key over the spikes, through the door, portal again, then fight the headwind to the goal.
      id: "5-20",
      build(b) {
        b.frame();
        b.h(9, 1, 26).h(18, 1, 26);
        b.h(21, 6, 12);
        b.saw(9, 24, 13, 0, 3, 1.8);
        b.laser(17, 19, 17, 26, 3.2, 2.2);
        b.port(24, 25.2, 3, 16.2);
        b.spikes(8, 17, 13, 17).spikes(15, 10, 18, 10);
        b.laser(6, 10, 6, 17, 3.4, 1.6);
        b.key(12, 11.6);
        b.door(20, 10, 20, 17);
        b.port(24, 16.2, 3, 7.2);
        b.saw(8, 4.5, 13, 0, 2.5, 2);
        b.fan(11, 1, 26, 8, "L", 700);
        b.start(3, 25.6).goal(25.6, 7.6);
        b.gem(13, 25.6).gem(4, 11).gem(20, 2);
      }
    }
  ];

  // src/levels/meta.gen.js
  var META = {
    "1-1": { "par": 11, "t": 2.03, "tg": 2.03, "d": 13.8, "path": [[-142, 44], [-130, 44], [-50, 44], [98, 42], [159, -23], [170, -155], [173, -170]] },
    "1-2": { "par": 14, "t": 2.37, "tg": 3.15, "d": 12.3, "path": [[143, 44], [138, 44], [100, 44], [10, 44], [-113, 40], [-160, -7], [-82, -92], [43, -180], [177, -166]] },
    "1-3": { "par": 15, "t": 3.63, "tg": 3.63, "d": 15.3, "path": [[-157, 104], [-153, 104], [-115, 104], [-25, 104], [98, 103], [168, 68], [94, 0], [-25, 25], [-174, 11], [-121, -54], [-36, -91], [76, -97], [179, -159], [174, -169]], "m": 1, "mp": [[158, 104], [153, 104], [115, 104], [25, 104], [-98, 103], [-168, 68], [-94, 0], [25, 25], [174, 11], [121, -54], [36, -91], [-76, -97], [-180, -159], [-179, -167]] },
    "1-4": { "par": 15, "t": 1.59, "tg": 3.6, "d": 13.4, "path": [[-97, 74], [-93, 74], [-58, 74], [10, 57], [86, -14], [181, -129], [170, -171]] },
    "1-5": { "par": 16, "t": 2.63, "tg": 3.82, "d": 16.2, "path": [[-142, -181], [-142, -181], [-138, -181], [-125, -181], [-100, -181], [-61, -181], [-10, -177], [51, -165], [115, -140], [178, -101], [158, -51], [128, 10], [91, 80], [46, 157], [-2, 162], [-53, 146], [-108, 145], [-169, 157], [-173, 168]] },
    "1-6": { "par": 15, "t": 3.18, "tg": 3.57, "d": 15.5, "path": [[-82, -61], [-78, -61], [-61, -61], [-58, -58], [-58, -24], [-58, 46], [-23, 145], [63, 156], [177, 115], [140, 48], [96, -9], [104, -65]], "m": 1, "mp": [[83, -61], [78, -61], [61, -61], [59, -58], [59, -24], [58, 46], [23, 145], [-63, 156], [-177, 115], [-140, 48], [-96, -10], [-102, -63]] },
    "1-7": { "par": 13, "t": 1.93, "tg": 2.92, "d": 11.9, "path": [[-157, 119], [-153, 119], [-115, 119], [-25, 114], [99, 75], [166, -15], [153, -137], [166, -177]], "m": 1, "mp": [[158, 119], [153, 119], [115, 119], [25, 114], [-99, 75], [-166, -15], [-153, -137], [-166, -177]] },
    "1-8": { "par": 15, "t": 2.66, "tg": 3.34, "d": 23.4, "path": [[-142, 119], [-130, 119], [-58, 119], [12, 106], [-1, 65], [-91, 44], [-174, -68], [-171, -172]], "m": 1, "mp": [[143, 119], [130, 119], [58, 119], [-12, 106], [1, 65], [91, 44], [174, -68], [174, -170]] },
    "1-9": { "par": 20, "t": 1.31, "tg": 5.18, "d": 15.4, "path": [[-157, -181], [-157, -181], [-153, -181], [-140, -181], [-115, -181], [-76, -181], [-24, -182], [40, -181], [115, -177], [174, -168]] },
    "1-10": { "par": 25, "t": 6.88, "tg": 6.88, "d": 69.6, "path": [[-157, 149], [-153, 149], [-115, 149], [-25, 149], [98, 149], [167, 133], [159, 63], [170, -57], [145, -171], [70, -162], [-54, -178], [-171, -158], [-169, -95], [-170, 14], [-124, 89], [-30, 83], [99, 64], [79, -5], [69, -105], [6, -78], [-95, -64], [-66, 1], [-45, -14], [20, 3]], "m": 1, "mp": [[158, 149], [157, 149], [153, 149], [141, 149], [121, 149], [94, 149], [61, 149], [21, 149], [-24, 149], [-75, 149], [-130, 149], [-181, 141], [-160, 120], [-152, 85], [-159, 37], [-162, -24], [-159, -94], [-146, -172], [-123, -156], [-87, -156], [-38, -163], [22, -164], [93, -159], [173, -148], [155, -131], [159, -107], [177, -72], [176, -24], [160, 33], [133, 94], [93, 87], [41, 78], [-19, 79], [-84, 68], [-90, 43], [-77, 6], [-80, -41], [-70, -93], [-47, -91], [-10, -76], [37, -78], [89, -68], [92, -44], [69, -7], [51, -12], [24, -18], [-16, -18], [-21, -18]] },
    "1-11": { "par": 13, "t": 2.23, "tg": 2.73, "d": 14, "path": [[-157, 164], [-145, 164], [-73, 163], [23, 109], [120, -4], [27, -135], [13, -167]], "m": 1, "mp": [[158, 164], [145, 164], [73, 163], [-23, 109], [-120, -4], [-27, -135], [-13, -167]] },
    "1-12": { "par": 22, "t": 2.23, "tg": 5.78, "d": 13.4, "path": [[-157, -181], [-157, -181], [-153, -181], [-140, -181], [-115, -181], [-76, -181], [-25, -178], [38, -169], [109, -151], [182, -121], [152, -80], [121, -26], [83, -10], [37, -25], [-19, -30], [-72, -23]], "m": 1, "mp": [[158, -181], [145, -181], [73, -181], [3, -181], [9, -181], [24, -181], [-40, -181], [-181, -140], [-112, -14], [4, -23], [62, -1]] },
    "1-13": { "par": 16, "t": 2.47, "tg": 3.72, "d": 14.8, "path": [[-15, -52], [-16, -76], [-5, -68], [25, -38], [77, 14], [131, 59], [180, 46], [164, -24], [179, -137], [180, -168]], "m": 1, "mp": [[15, -52], [16, -76], [5, -68], [-25, -38], [-77, 14], [-131, 59], [-180, 46], [-164, -24], [-179, -137], [-180, -168]] },
    "1-14": { "par": 14, "t": 1.8, "tg": 3.27, "d": 22, "path": [[0, 164], [-5, 164], [-36, 164], [-69, 145], [-67, 79], [-27, -24], [14, -171]], "m": 1, "mp": [[0, 164], [5, 164], [36, 164], [69, 145], [71, 77], [55, -40], [-11, -147], [-2, -167]] },
    "1-15": { "par": 18, "t": 4.36, "tg": 4.52, "d": 18.5, "path": [[-157, 164], [-157, 132], [-152, 44], [-120, -78], [-108, -178], [-53, -112], [-21, 1], [-11, 143], [53, 137], [76, 52], [88, -59], [102, -162], [154, -144], [172, -51], [181, 83], [178, 169]], "m": 1, "mp": [[158, 164], [158, 132], [152, 44], [120, -78], [108, -178], [53, -112], [21, 1], [11, 143], [-53, 137], [-76, 52], [-88, -59], [-102, -162], [-154, -144], [-172, -51], [-181, 83], [-179, 169]] },
    "1-16": { "par": 24, "t": 3.93, "tg": 6.39, "d": 66.3, "path": [[-142, -181], [-138, -181], [-100, -181], [-10, -177], [115, -140], [158, -51], [139, 9], [139, -1], [93, -14], [58, -45], [30, -64], [-5, -35], [-66, 42], [-161, 154], [-173, 168]], "m": 1, "mp": [[143, -181], [138, -181], [100, -181], [10, -177], [-115, -140], [-158, -51], [-139, 9], [-139, -1], [-93, -14], [-58, -45], [-30, -64], [5, -35], [66, 42], [161, 154], [173, 168]] },
    "1-17": { "par": 16, "t": 1.8, "tg": 3.87, "d": 51.7, "path": [[0, 74], [5, 74], [36, 74], [74, 74], [108, 43], [142, -43], [175, -168]], "m": 1, "mp": [[0, 74], [0, 74], [-5, 74], [-17, 74], [-37, 74], [-64, 74], [-96, 70], [-128, 52], [-156, 20], [-179, -26], [-175, -83], [-169, -152], [-166, -177]] },
    "1-18": { "par": 19, "t": 3.83, "tg": 4.83, "d": 68.7, "path": [[-157, 104], [-153, 104], [-115, 104], [-25, 104], [98, 104], [168, 88], [144, 25], [89, -26], [-18, -5], [-156, -22], [-133, -91], [-49, -175], [64, -157], [172, -173]], "m": 1, "mp": [[158, 104], [153, 104], [115, 104], [25, 104], [-98, 104], [-168, 88], [-144, 25], [-89, -26], [18, -5], [156, -22], [133, -91], [49, -175], [-64, -157], [-169, -176]] },
    "1-19": { "par": 15, "t": 1.31, "tg": 3.45, "d": 33.5, "path": [[-157, 164], [-145, 164], [-73, 148], [-1, 45], [3, 8]], "m": 1, "mp": [[158, 164], [157, 164], [153, 164], [141, 164], [122, 164], [102, 156], [82, 134], [60, 98], [30, 52], [3, 13]] },
    "1-20": { "par": 23, "t": 3.51, "tg": 6.12, "d": 45.5, "path": [[-157, 134], [-153, 134], [-115, 134], [-25, 134], [98, 134], [168, 113], [97, 47], [-4, 43], [-131, 30], [-149, 3], [-68, -65], [60, -143], [170, -173]], "m": 1, "mp": [[158, 134], [153, 134], [115, 134], [25, 134], [-98, 134], [-168, 113], [-97, 47], [4, 43], [131, 30], [149, 3], [68, -65], [-60, -143], [-168, -173]] },
    "2-1": { "par": 17, "t": 2.86, "tg": 4.06, "d": 18, "path": [[-157, 14], [-145, 13], [-73, 6], [-49, -75], [-137, -69], [-152, -157], [-44, -159], [135, -181], [167, -179]] },
    "2-2": { "par": 9, "t": 1.63, "tg": 1.63, "d": 18.1, "path": [[-157, 44], [-153, 44], [-122, 40], [-112, -11], [-73, -84], [94, -71], [175, -79]], "m": 1, "mp": [[158, 44], [153, 44], [122, 40], [112, -11], [73, -84], [-94, -71], [-174, -80]] },
    "2-3": { "par": 11, "t": 2.21, "tg": 2.21, "d": 13.4, "path": [[-163, 104], [-155, 80], [-111, 34], [-14, 14], [143, 158], [144, 138], [141, 55], [156, -73], [167, -129]], "m": 1, "mp": [[164, 104], [155, 80], [111, 34], [14, 14], [-143, 158], [-144, 138], [-141, 55], [-156, -73], [-167, -129]] },
    "2-4": { "par": 21, "t": 2.09, "tg": 5.45, "d": 23.4, "path": [[-157, -181], [-153, -181], [-122, -181], [-83, -181], [-45, -138], [16, -40], [86, -12], [179, -32]], "m": 1, "mp": [[158, -181], [153, -181], [122, -181], [83, -181], [45, -138], [-16, -40], [-86, -12], [-170, -37]] },
    "2-5": { "par": 15, "t": 3.04, "tg": 3.4, "d": 22.1, "path": [[-157, -106], [-157, -106], [-153, -106], [-144, -106], [-120, -106], [-42, -110], [-24, -100], [-35, -87], [-32, -83], [-14, -81], [19, -76], [61, -62], [109, -36], [151, 4], [134, 59], [109, 123], [74, 178], [27, 152], [-32, 123], [-100, 88], [-173, 42], [-178, 28]], "m": 1, "mp": [[158, -106], [157, -106], [153, -106], [141, -106], [89, -107], [12, -110], [15, -73], [7, -50], [-9, -41], [-32, -46], [-63, -64], [-100, -93], [-142, -25], [-138, 22], [-117, 51], [-89, 65], [-49, 70], [0, 65], [59, 52], [128, 32], [169, 17]] },
    "2-6": { "par": 8, "t": 1.29, "tg": 1.29, "d": 16.5, "path": [[-157, -91], [-153, -91], [-115, -91], [-24, -92], [115, -88], [167, -86]] },
    "2-7": { "par": 25, "t": 2.87, "tg": 6.7, "d": 14.6, "path": [[-157, 44], [-157, 44], [-153, 44], [-144, 44], [-131, 44], [-112, 44], [-89, 44], [-61, 41], [-30, 27], [-38, -1], [-38, -38], [-31, -69], [-28, -94], [-26, -105], [-20, -103], [-6, -105], [20, -111], [55, -128], [102, -151], [161, -174], [168, -177]], "m": 1, "mp": [[158, 44], [153, 44], [122, 44], [83, 44], [45, 25], [32, -34], [28, -93], [19, -103], [-27, -110], [-120, -143], [-180, -166]] },
    "2-8": { "par": 14, "t": 1.61, "tg": 3.09, "d": 17.8, "path": [[-157, -121], [-157, -121], [-153, -121], [-115, -121], [-24, -121], [115, -117], [174, -108]] },
    "2-9": { "par": 19, "t": 1.85, "tg": 4.99, "d": 14.3, "path": [[0, 164], [-5, 164], [-40, 164], [-108, 141], [-174, 65], [-152, -51], [-105, -151], [-105, -170]], "m": 1, "mp": [[0, 164], [5, 164], [40, 164], [108, 141], [174, 65], [152, -51], [105, -151], [105, -170]] },
    "2-10": { "par": 16, "t": 2.17, "tg": 3.75, "d": 19, "path": [[182, -181], [177, -181], [139, -181], [49, -181], [-79, -77], [-164, 2], [-151, 59], [-180, 144], [-176, 169]], "m": 1, "mp": [[-181, -181], [-181, -181], [-177, -181], [-164, -181], [-139, -181], [-100, -181], [-48, -181], [16, -130], [91, -54], [173, 26], [182, 78], [139, 28], [146, 36], [172, 103], [175, 171]] },
    "2-11": { "par": 23, "t": 1.85, "tg": 6.01, "d": 15.3, "path": [[0, 164], [0, 164], [4, 164], [13, 164], [27, 164], [46, 163], [69, 155], [97, 133], [129, 97], [168, 52], [181, -4], [181, -69], [182, -143], [182, -169]], "m": 1, "mp": [[0, 164], [-12, 164], [-84, 153], [-181, 58], [-181, -90], [-181, -167]] },
    "2-12": { "par": 22, "t": 4.34, "tg": 5.88, "d": 27.5, "path": [[-157, 104], [-153, 104], [-115, 104], [-25, 104], [98, 103], [167, 68], [123, 5], [82, 5], [12, -1], [-105, -2], [-156, -28], [-106, -106], [-34, -90], [67, -104], [166, -136], [170, -171]], "m": 1, "mp": [[158, 104], [153, 104], [115, 104], [25, 104], [-98, 103], [-167, 68], [-123, 5], [-82, 5], [-12, -1], [105, -2], [156, -28], [106, -106], [34, -90], [-67, -104], [-166, -136], [-170, -171]] },
    "2-13": { "par": 22, "t": 3.38, "tg": 5.78, "d": 29.3, "path": [[-157, -181], [-153, -181], [-122, -181], [-83, -181], [-56, -157], [-60, -49], [-69, -94], [-50, -148], [-16, -46], [-1, -4], [42, 14], [133, 2], [166, 0]], "m": 1, "mp": [[158, -181], [153, -181], [122, -181], [83, -181], [56, -157], [60, -49], [69, -94], [50, -148], [16, -46], [1, -4], [-42, 14], [-130, -1], [-166, 1]] },
    "2-14": { "par": 17, "t": 2.63, "tg": 4.19, "d": 37.1, "path": [[-157, 164], [-145, 164], [-73, 156], [-1, 68], [54, -14], [89, -145], [89, -155], [90, -177]], "m": 1, "mp": [[158, 164], [153, 164], [118, 164], [50, 147], [-22, 75], [-80, -47], [-97, -169]] },
    "2-15": { "par": 14, "t": 3.15, "tg": 3.15, "d": 27.6, "path": [[-157, -106], [-157, -106], [-153, -106], [-109, -106], [69, -102], [150, -47], [84, -59], [-8, -22], [-26, 17], [-42, 24], [-114, 15], [-167, 13]], "m": 1, "mp": [[158, -106], [158, -106], [153, -106], [109, -106], [-69, -102], [-150, -47], [-84, -59], [8, -22], [26, 17], [42, 24], [115, 19], [168, 18]] },
    "2-16": { "par": 17, "t": 4.16, "tg": 4.16, "d": 41.3, "path": [[-157, -106], [-162, -106], [-179, -106], [-181, -103], [-181, -73], [-181, -42], [-181, -50], [-177, -104], [-141, -95], [-61, -82], [-55, -15], [-44, 54], [-14, 114], [71, 103], [182, 89]], "m": 1, "mp": [[158, -106], [162, -106], [179, -106], [182, -103], [182, -73], [182, -42], [182, -50], [177, -104], [141, -95], [61, -82], [55, -15], [44, 54], [14, 114], [-70, 99], [-167, 78]] },
    "2-17": { "par": 23, "t": 5.46, "tg": 6.01, "d": 45.1, "path": [[-157, -106], [-157, -106], [-157, -106], [-157, -106], [-157, -106], [-157, -106], [-157, -106], [-157, -106], [-162, -106], [-178, -106], [-166, -106], [-70, -107], [123, -107], [128, 10], [66, 54], [-15, 74], [-96, 119], [-167, 98], [-167, 21], [-166, 1]], "m": 1, "mp": [[158, -106], [158, -106], [158, -106], [170, -106], [182, -106], [182, -88], [182, -105], [170, -106], [9, -106], [-136, -19], [-168, 110], [-140, 153], [-48, 167], [121, 170], [143, 132], [169, 43], [181, 12]] },
    "2-18": { "par": 15, "t": 3.6, "tg": 3.6, "d": 55.5, "path": [[-157, -106], [-157, -106], [-153, -106], [-115, -106], [-25, -102], [59, -98], [66, -87], [76, -88], [79, -88], [110, -80], [115, -22], [123, 74], [167, 79]], "m": 1, "mp": [[158, -106], [158, -106], [153, -106], [115, -106], [25, -102], [-59, -98], [-66, -87], [-76, -88], [-79, -88], [-110, -80], [-115, -22], [-123, 74], [-167, 79]] },
    "2-19": { "par": 18, "t": 4.52, "tg": 4.58, "d": 55.4, "path": [[-157, -181], [-145, -181], [-60, -181], [112, -161], [135, -116], [90, -17], [39, -36], [-65, -60], [-162, 0], [-166, 136], [-71, 149], [105, 75], [168, 45]], "m": 1, "mp": [[158, -181], [145, -181], [60, -181], [-112, -161], [-135, -116], [-90, -17], [-39, -36], [65, -60], [162, 0], [166, 136], [71, 149], [-105, 75], [-168, 45]] },
    "2-20": { "par": 20, "t": 5.3, "tg": 5.3, "d": 61.3, "path": [[-157, 119], [-153, 119], [-118, 119], [-46, 119], [54, 119], [148, 118], [169, 90], [99, 49], [-7, 33], [-105, 29], [-156, 24], [-150, 9], [-148, -4], [-120, -21], [-36, -41], [86, -57], [163, -81], [145, -137], [167, -178]], "m": 1, "mp": [[158, 119], [153, 119], [118, 119], [46, 119], [-54, 119], [-148, 118], [-169, 90], [-99, 49], [7, 33], [105, 29], [156, 24], [150, 9], [148, -4], [120, -21], [36, -41], [-86, -57], [-163, -81], [-145, -137], [-167, -181]] },
    "3-1": { "par": 14, "t": 2.01, "tg": 3.09, "d": 13.8, "path": [[-142, 14], [-130, 13], [-50, 14], [98, 13], [159, -44], [170, -169], [171, -173]] },
    "3-2": { "par": 19, "t": 3.68, "tg": 4.77, "d": 15.9, "path": [[-142, -181], [-147, -181], [-180, -181], [-181, -178], [-181, -141], [-181, -52], [-177, 86], [-141, 155], [-55, 98], [-35, 20], [-25, -83], [41, -179], [143, -163], [173, -168]], "m": 1, "mp": [[143, -181], [147, -181], [180, -181], [182, -178], [182, -141], [182, -52], [177, 86], [141, 155], [55, 98], [35, 20], [25, -83], [-41, -179], [-143, -163], [-173, -168]] },
    "3-3": { "par": 11, "t": 1.42, "tg": 2.24, "d": 11.5, "path": [[-142, -32], [-138, -31], [-100, -31], [-10, -31], [113, -35], [173, -64]] },
    "3-4": { "par": 21, "t": 1.74, "tg": 5.53, "d": 13.6, "path": [[-142, 89], [-138, 89], [-103, 89], [-35, 85], [41, 35], [135, -61], [169, -171]], "m": 1, "mp": [[143, 89], [138, 89], [103, 89], [35, 85], [-41, 35], [-135, -61], [-168, -176]] },
    "3-5": { "par": 16, "t": 3.77, "tg": 3.77, "d": 13.6, "path": [[-157, -181], [-145, -181], [-60, -181], [28, -141], [-34, -16], [-46, 147], [-46, 123], [-36, -31], [31, -162], [115, -158], [168, -181]], "m": 1, "mp": [[158, -181], [153, -181], [115, -181], [25, -177], [-28, -141], [10, -54], [36, 82], [25, 158], [-39, 98], [-33, 16], [-45, -94], [-82, -173], [-157, -160], [-177, -166]] },
    "3-6": { "par": 18, "t": 3.64, "tg": 4.63, "d": 16.2, "path": [[-157, -181], [-153, -181], [-115, -181], [-97, -178], [-88, -144], [-88, -74], [-88, 25], [-80, 121], [-21, 173], [80, 116], [68, 27], [87, -90], [161, -174], [175, -167]], "m": 1, "mp": [[158, -181], [153, -181], [115, -181], [97, -178], [89, -144], [89, -74], [89, 25], [80, 121], [21, 173], [-80, 116], [-68, 27], [-87, -90], [-161, -174], [-175, -167]] },
    "3-7": { "par": 18, "t": 4.58, "tg": 4.58, "d": 17.3, "path": [[-157, 104], [-153, 104], [-115, 104], [-25, 104], [98, 103], [168, 68], [94, 0], [-25, 25], [-174, 11], [-121, -54], [-36, -91], [76, -97], [180, -159], [127, -163], [23, -155], [-120, -177], [-167, -180]], "m": 1, "mp": [[158, 104], [153, 104], [115, 104], [25, 104], [-98, 103], [-168, 68], [-94, 0], [25, 25], [174, 11], [121, -54], [36, -91], [-76, -97], [-180, -159], [-127, -163], [-23, -155], [120, -177], [167, -180]] },
    "3-8": { "par": 21, "t": 3.44, "tg": 5.5, "d": 15.1, "path": [[-157, -181], [-162, -181], [-179, -181], [-181, -178], [-181, -141], [-178, -52], [-149, -17], [-111, -4], [-95, 57], [-69, 149], [8, 152], [129, 89], [175, 57]], "m": 1, "mp": [[158, -181], [162, -181], [179, -181], [182, -178], [182, -141], [178, -52], [149, -17], [111, -4], [95, 57], [69, 149], [-8, 152], [-129, 89], [-176, 58]] },
    "3-9": { "par": 15, "t": 2.08, "tg": 3.37, "d": 13.9, "path": [[-142, -32], [-138, -31], [-100, -31], [-9, -31], [98, -36], [72, -66], [100, -111], [168, -176]], "m": 1, "mp": [[143, -32], [138, -31], [100, -31], [9, -31], [-98, -36], [-72, -66], [-100, -111], [-166, -179]] },
    "3-10": { "par": 19, "t": 4.22, "tg": 4.78, "d": 17.6, "path": [[-142, -181], [-147, -181], [-180, -181], [-181, -178], [-181, -141], [-181, -52], [-177, 86], [-144, 156], [-77, 133], [27, 153], [174, 179], [137, 165], [114, 96], [128, -13], [180, -153], [180, -166]], "m": 1, "mp": [[143, -181], [143, -181], [147, -181], [160, -181], [180, -181], [178, -181], [182, -178], [182, -165], [182, -141], [182, -103], [182, -52], [181, 12], [177, 86], [164, 168], [141, 155], [106, 132], [57, 113], [0, 106], [-51, 140], [-114, 169], [-180, 179], [-155, 163], [-141, 136], [-136, 98], [-135, 46], [-139, -16], [-152, -87], [-173, -166], [-174, -171]] },
    "3-11": { "par": 17, "t": 3.45, "tg": 4.1, "d": 17.6, "path": [[-142, 44], [-142, 44], [-138, 44], [-125, 44], [-100, 44], [-61, 44], [-9, 44], [55, 44], [130, 48], [171, 61], [144, 84], [122, 121], [97, 171], [67, 167], [26, 157], [-28, 149], [-93, 139], [-167, 121], [-160, 93], [-142, 55], [-134, 7], [-136, -51], [-147, -117], [-167, -178]], "m": 1, "mp": [[143, 44], [138, 44], [100, 44], [9, 44], [-130, 48], [-144, 84], [-97, 171], [-26, 157], [93, 139], [160, 96], [142, 20], [166, -90], [180, -166]] },
    "3-12": { "par": 17, "t": 3.58, "tg": 4.07, "d": 18.2, "path": [[-97, 164], [-103, 133], [-74, 50], [-19, -84], [-40, -158], [-20, -131], [55, -116], [109, -26], [176, 94], [174, 171], [180, 102], [182, -16], [182, -168]], "m": 1, "mp": [[98, 164], [97, 155], [92, 133], [79, 98], [59, 53], [30, -1], [20, -60], [20, -120], [6, -178], [-22, -160], [-61, -135], [-50, -110], [-55, -84], [-76, -59], [-110, -32], [-109, -21], [-134, 67], [-160, 53], [-174, 168], [-170, 142], [-174, 85], [-181, 16], [-180, -64], [-173, -152], [-170, -173]] },
    "3-13": { "par": 25, "t": 6.9, "tg": 6.98, "d": 21.2, "path": [[-157, -181], [-170, -181], [-181, -181], [-181, -141], [-170, -13], [-95, -32], [25, -2], [-43, 116], [-175, 145], [-153, 53], [-154, 46], [-142, 44], [-60, 44], [13, 36], [-30, 28], [-51, -20], [-12, -112], [121, -176], [167, -178]], "m": 1, "mp": [[158, -181], [145, -181], [60, -181], [-9, -141], [31, -144], [60, -143], [37, -84], [4, 61], [49, 156], [182, 73], [152, 48], [138, 123], [51, 156], [-7, 73], [31, 44], [58, -21], [17, -120], [-118, -179], [-168, -175]] },
    "3-14": { "par": 24, "t": 4.48, "tg": 6.4, "d": 19, "path": [[-157, -181], [-153, -181], [-118, -181], [-50, -181], [20, -181], [76, -108], [89, -21], [44, 40], [-56, 88], [-180, 95], [-124, 47], [-45, 50], [66, 15], [67, -52], [92, -124], [168, -179]], "m": 1, "mp": [[158, -181], [153, -181], [118, -181], [50, -181], [-20, -181], [-76, -108], [-89, -21], [-44, 40], [56, 88], [180, 95], [124, 47], [45, 50], [-66, 15], [-67, -52], [-92, -124], [-167, -179]] },
    "3-15": { "par": 18, "t": 4.37, "tg": 4.43, "d": 52.1, "path": [[-142, 74], [-130, 74], [-58, 73], [-24, 20], [-14, -94], [21, -161], [135, -70], [144, 12], [38, 13], [83, 106], [173, 157], [177, 87]], "m": 1, "mp": [[143, 74], [130, 74], [58, 73], [24, 20], [14, -94], [-21, -161], [-135, -70], [-144, 12], [-38, 13], [-83, 106], [-173, 157], [-170, 84]] },
    "3-16": { "par": 19, "t": 4.53, "tg": 4.84, "d": 28.3, "path": [[-157, 104], [-153, 104], [-115, 104], [-25, 104], [98, 104], [168, 88], [144, 25], [89, 16], [-17, 36], [-155, 18], [-149, -54], [-126, -86], [-50, -56], [76, -51], [163, -92], [174, -160], [178, -167]], "m": 1, "mp": [[158, 104], [153, 104], [115, 104], [25, 104], [-98, 104], [-168, 88], [-144, 25], [-89, 16], [17, 36], [155, 18], [149, -54], [126, -86], [50, -56], [-76, -51], [-163, -95], [-178, -160], [-180, -167]] },
    "3-17": { "par": 14, "t": 2.38, "tg": 3.14, "d": 34.8, "path": [[-142, 74], [-138, 74], [-100, 74], [-10, 74], [113, 72], [160, 31], [82, -49], [-43, -127], [-180, -166]], "m": 1, "mp": [[143, 74], [138, 74], [100, 74], [10, 74], [-113, 72], [-160, 31], [-82, -49], [43, -127], [180, -166]] },
    "3-18": { "par": 28, "t": 4.43, "tg": 7.83, "d": 31, "path": [[-142, 149], [-148, 118], [-180, 38], [-162, -88], [-111, -158], [-12, -123], [123, -116], [153, -76], [159, -25], [174, 53], [161, 177], [120, 144], [27, 119], [6, 68], [-1, -11], [-47, -76]], "m": 1, "mp": [[143, 149], [148, 118], [180, 38], [162, -88], [111, -158], [12, -123], [-123, -116], [-153, -76], [-159, -25], [-174, 53], [-161, 177], [-120, 144], [-27, 119], [-6, 68], [1, -11], [47, -72]] },
    "3-19": { "par": 19, "t": 4.72, "tg": 4.72, "d": 33.1, "path": [[-157, -136], [-162, -136], [-179, -136], [-181, -133], [-181, -96], [-181, -7], [-177, 131], [-142, 144], [-56, 99], [0, 34], [5, -30], [69, -91], [177, -125], [160, -99], [181, -41], [174, 67], [180, 169]], "m": 1, "mp": [[158, -136], [162, -136], [179, -136], [182, -133], [182, -96], [182, -7], [177, 131], [142, 144], [56, 99], [0, 34], [-5, -30], [-69, -91], [-177, -125], [-160, -99], [-181, -41], [-174, 67], [-181, 167]] },
    "3-20": { "par": 25, "t": 5.28, "tg": 6.69, "d": 29.7, "path": [[-157, -181], [-153, -181], [-122, -142], [-123, -86], [-139, -126], [-115, -117], [-121, -39], [-116, -26], [-70, -44], [7, -46], [81, -46], [117, 8], [140, 93], [179, 115], [155, 91], [104, 92], [20, 119], [-98, 107], [-166, 92]], "m": 1, "mp": [[158, -181], [153, -181], [122, -142], [123, -86], [139, -126], [115, -117], [121, -39], [116, -26], [70, -44], [-7, -46], [-81, -46], [-117, 8], [-140, 93], [-179, 115], [-155, 91], [-104, 92], [-20, 119], [102, 110], [170, 91]] },
    "4-1": { "par": 20, "t": 3.45, "tg": 5.13, "d": 27.4, "path": [[0, -181], [-12, -181], [-49, -181], [-90, -99], [-136, -52], [-103, -37], [18, -15], [24, 43], [87, 44], [170, 22]] },
    "4-2": { "par": 12, "t": 2.42, "tg": 2.49, "d": 12.4, "path": [[-142, -181], [-138, -181], [-100, -181], [-10, -176], [-10, -92], [-14, 106], [-31, 140], [-77, 175], [-172, 152], [-181, 149]], "m": 1, "mp": [[143, -181], [138, -181], [100, -181], [10, -176], [10, -92], [14, 106], [31, 140], [77, 175], [172, 152], [182, 149]] },
    "4-3": { "par": 16, "t": 3.42, "tg": 3.83, "d": 13.3, "path": [[-142, -181], [-138, -181], [-100, -181], [-10, -177], [115, -138], [158, -2], [83, -12], [-38, -46], [-180, 7], [-117, 165], [-30, 131], [102, 86], [168, 78]], "m": 1, "mp": [[143, -181], [138, -181], [100, -181], [10, -177], [-115, -138], [-158, -2], [-83, -12], [38, -46], [180, 7], [117, 165], [30, 131], [-102, 86], [-167, 77]] },
    "4-4": { "par": 16, "t": 3.8, "tg": 3.99, "d": 14.2, "path": [[182, -46], [180, -77], [149, -150], [149, -161], [149, -105], [148, -46], [136, 4], [113, 25], [81, 8], [39, -7], [-11, -21], [-67, -34], [-129, -46], [-167, -46]], "m": 1, "mp": [[-181, -46], [-180, -77], [-149, -150], [-149, -161], [-148, -105], [-148, -46], [-136, 4], [-113, 25], [-81, 8], [-39, -7], [11, -21], [67, -34], [130, -46], [167, -46]] },
    "4-5": { "par": 14, "t": 2.99, "tg": 3.23, "d": 15.2, "path": [[-142, 44], [-138, 44], [-100, 44], [-9, 43], [128, 52], [146, 45], [99, 44], [32, 42], [16, 1], [75, -84], [168, -176]] },
    "4-6": { "par": 15, "t": 2.98, "tg": 3.61, "d": 14.1, "path": [[-157, -181], [-157, -181], [-157, -181], [-157, -181], [-157, -181], [-157, -181], [-153, -181], [-140, -181], [-115, -181], [-76, -181], [-25, -177], [36, -165], [100, -140], [163, -101], [164, -51], [132, 8], [89, 37], [35, 13], [-31, -12], [-105, -43], [-171, -39]], "m": 1, "mp": [[158, -181], [158, -181], [158, -181], [153, -181], [115, -181], [25, -177], [-100, -140], [-164, -51], [-89, 37], [31, -12], [169, -38]] },
    "4-7": { "par": 13, "t": 2.83, "tg": 2.83, "d": 39.2, "path": [[-142, -181], [-138, -181], [-103, -181], [-28, -181], [-1, -153], [10, -92], [14, -15], [12, 64], [-26, 153], [-114, 157], [-167, 134]], "m": 1, "mp": [[143, -181], [138, -181], [103, -181], [28, -181], [1, -153], [-10, -92], [-14, -15], [-12, 64], [26, 153], [114, 157], [167, 134]] },
    "4-8": { "par": 19, "t": 3.51, "tg": 4.73, "d": 14.6, "path": [[-142, -181], [-138, -181], [-100, -181], [-9, -181], [130, -177], [144, -141], [97, -54], [32, -48], [-10, 15], [44, 142], [146, 144], [158, 70], [167, 17]], "m": 1, "mp": [[143, -181], [138, -181], [100, -181], [9, -181], [-130, -177], [-144, -141], [-97, -54], [-32, -48], [10, 15], [-44, 142], [-146, 144], [-158, 70], [-166, 17]] },
    "4-9": { "par": 13, "t": 2.79, "tg": 2.79, "d": 18, "path": [[-142, -181], [-130, -181], [-50, -181], [47, -150], [44, -67], [53, 27], [-16, 164], [-166, 136]], "m": 1, "mp": [[143, -181], [142, -181], [138, -181], [126, -181], [106, -181], [79, -181], [47, -181], [14, -180], [-12, -176], [-27, -166], [-28, -147], [-14, -113], [14, -61], [25, 12], [24, 102], [38, 175], [64, 134], [100, 146], [146, 150], [176, 148]] },
    "4-10": { "par": 13, "t": 1.92, "tg": 2.79, "d": 24.9, "path": [[-142, -181], [-142, -181], [-138, -181], [-129, -181], [-115, -181], [-92, -181], [-58, -180], [-11, -163], [49, -125], [44, -62], [31, 28], [-43, 117], [-128, 171], [-180, 149]], "m": 1, "mp": [[143, -181], [142, -181], [138, -181], [126, -181], [106, -181], [79, -181], [46, -179], [5, -171], [-43, -155], [-54, -129], [-43, -96], [-32, -62], [-19, -26], [-1, 12], [22, 52], [-30, 73], [-47, 91], [-15, 112], [24, 134], [73, 147], [132, 151], [177, 148]] },
    "4-11": { "par": 13, "t": 2.75, "tg": 2.91, "d": 24.9, "path": [[-157, 29], [-153, 29], [-115, 29], [-25, 29], [98, 29], [168, 19], [165, -22], [111, -70], [3, -114], [-151, -158], [-180, -167]], "m": 1, "mp": [[158, 29], [153, 29], [115, 29], [25, 29], [-98, 29], [-168, 19], [-165, -22], [-111, -70], [-3, -114], [151, -158], [180, -167]] },
    "4-12": { "par": 22, "t": 1.88, "tg": 5.78, "d": 28.7, "path": [[-142, 14], [-142, 14], [-142, 14], [-142, 14], [-142, 14], [-142, 14], [-138, 14], [-125, 14], [-100, 13], [-61, 13], [-9, 12], [55, 12], [130, 16], [170, 21]], "m": 1, "mp": [[143, 14], [143, 14], [143, 14], [138, 14], [100, 13], [9, 12], [-130, 16], [-170, 21]] },
    "4-13": { "par": 22, "t": 3.67, "tg": 5.88, "d": 30.5, "path": [[-157, -106], [-157, -106], [-157, -106], [-157, -106], [-157, -106], [-157, -106], [-157, -106], [-157, -106], [-157, -106], [-157, -106], [-157, -106], [-153, -106], [-144, -106], [-130, -106], [-107, -106], [-73, -106], [-30, -103], [0, -69], [40, -30], [36, 13], [38, 55], [55, 90], [75, 74], [106, 79], [147, 76], [168, 74]], "m": 1, "mp": [[158, -106], [158, -106], [158, -106], [158, -106], [158, -106], [158, -106], [153, -106], [115, -106], [25, -102], [-28, -69], [-20, -1], [-58, 90], [-115, 83], [-168, 78]] },
    "4-14": { "par": 22, "t": 2.26, "tg": 5.68, "d": 38.8, "path": [[-157, -106], [-157, -106], [-153, -106], [-144, -106], [-131, -106], [-112, -86], [-88, -24], [-48, 20], [10, 45], [82, 54], [164, 46], [158, 26], [137, -5], [131, -42], [141, -79], [165, -106], [167, -105]], "m": 1, "mp": [[158, -106], [153, -106], [122, -106], [84, 2], [20, 55], [-105, 44], [-149, -8], [-142, -70], [-168, -100]] },
    "4-15": { "par": 13, "t": 2.72, "tg": 2.72, "d": 43.1, "path": [[-142, 149], [-138, 149], [-107, 149], [-68, 149], [-40, 130], [-23, 66], [-13, -29], [-21, -125], [-65, -170], [-160, -178], [-167, -180]], "m": 1, "mp": [[143, 149], [138, 149], [107, 149], [68, 149], [40, 130], [23, 66], [13, -29], [21, -125], [65, -170], [161, -174], [168, -174]] },
    "4-16": { "par": 21, "t": 3.92, "tg": 5.51, "d": 45.7, "path": [[-172, 104], [-172, 72], [-172, -17], [-167, -153], [-138, -148], [-101, -163], [-70, -179], [-38, -181], [-2, -181], [19, -181], [25, -181], [31, -181], [74, -181], [159, -181], [168, -181]], "m": 1, "mp": [[173, 104], [173, 72], [173, -17], [167, -153], [138, -148], [101, -163], [70, -179], [38, -181], [2, -181], [-19, -181], [-25, -181], [-31, -181], [-74, -181], [-159, -181], [-168, -181]] },
    "4-17": { "par": 27, "t": 4.78, "tg": 7.42, "d": 46.8, "path": [[-157, 89], [-162, 89], [-178, 89], [-171, 89], [-166, 89], [-158, 89], [-106, 89], [35, 89], [169, 83], [163, 34], [150, -43], [73, -14], [-79, -24], [-152, -88], [-74, -175], [36, -164], [169, -177]], "m": 1, "mp": [[158, 89], [158, 89], [158, 89], [158, 89], [158, 89], [153, 89], [98, 89], [-45, 89], [-165, 82], [-164, 30], [-150, -41], [-73, -12], [80, -22], [152, -86], [74, -175], [-37, -164], [-168, -179]] },
    "4-18": { "par": 27, "t": 7.38, "tg": 7.38, "d": 52.2, "path": [[98, 119], [93, 119], [62, 119], [23, 119], [-15, 119], [-79, 119], [-172, 109], [-148, 30], [-120, 29], [-97, 29], [-84, 29], [-101, 29], [-126, 29], [-141, 29], [-122, 29], [-66, 29], [26, 29], [143, 27], [146, -16], [69, -32], [-53, -23], [-173, -71], [-111, -166], [-29, -157], [85, -173], [169, -177]], "m": 1, "mp": [[-97, 119], [-85, 119], [0, 119], [169, 150], [142, 178], [120, 182], [42, 182], [-31, 182], [-13, 180], [90, 138], [180, 119], [112, 31], [23, 47], [-114, 29], [-148, -25], [-31, -32], [147, -58], [112, -171], [-27, -153], [-172, -170]] },
    "4-19": { "par": 26, "t": 5.27, "tg": 7.07, "d": 60.1, "path": [[-172, -181], [-177, -181], [-181, -181], [-181, -178], [-181, -141], [-178, -53], [-150, -48], [-111, -5], [-42, 114], [73, 160], [168, 85], [119, 27], [81, 23], [52, 14], [30, 13], [16, -4], [37, -61], [114, -126], [175, -170]], "m": 1, "mp": [[173, -181], [173, -181], [177, -181], [181, -181], [182, -181], [182, -181], [182, -178], [182, -165], [182, -141], [181, -103], [178, -52], [170, -40], [155, -50], [133, -46], [103, -17], [68, 38], [25, 104], [-27, 173], [-90, 158], [-164, 128], [-160, 94], [-144, 51], [-138, 18], [-136, 29], [-131, 24], [-122, 16], [-104, 14], [-76, 14], [-38, 13], [5, 8], [4, -1], [-15, -19], [-38, -51], [-69, -93], [-111, -140], [-166, -180]] },
    "4-20": { "par": 29, "t": 8.23, "tg": 8.23, "d": 66.1, "path": [[-157, 119], [-157, 119], [-157, 119], [-157, 119], [-157, 119], [-153, 119], [-122, 119], [-83, 119], [-51, 119], [-23, 119], [0, 119], [13, 119], [-3, 119], [-23, 119], [-6, 119], [65, 119], [173, 114], [142, 65], [92, 26], [10, 15], [-101, 14], [-165, -4], [-112, -75], [0, -74], [167, -97], [118, -171], [27, -165], [-98, -180], [-167, -176]], "m": 1, "mp": [[158, 119], [158, 119], [158, 119], [158, 119], [158, 119], [153, 119], [122, 119], [83, 119], [51, 119], [23, 119], [6, 119], [18, 119], [41, 119], [55, 119], [31, 119], [-45, 119], [-157, 117], [-147, 77], [-97, 23], [-18, 15], [91, 13], [169, 0], [117, -67], [8, -75], [-159, -95], [-120, -165], [-28, -165], [97, -181], [170, -176]] },
    "5-1": { "par": 14, "t": 3.02, "tg": 3.17, "d": 13.5, "path": [[-142, 89], [-130, 89], [-58, 89], [12, 76], [-1, 6], [-103, -106], [-157, -164], [117, -179], [168, -181]] },
    "5-2": { "par": 15, "t": 2.43, "tg": 3.37, "d": 13.6, "path": [[-142, 104], [-130, 104], [-58, 96], [-32, 57], [-135, 8], [-148, -126], [182, -149], [177, -168]], "m": 1, "mp": [[143, 104], [130, 104], [58, 96], [32, 57], [135, 8], [148, -126], [-181, -149], [-177, -168]] },
    "5-3": { "par": 11, "t": 2.05, "tg": 2.05, "d": 12, "path": [[-142, -166], [-138, -179], [-100, -181], [-9, -181], [131, -181], [28, -46], [-37, 89], [171, 91]], "m": 1, "mp": [[143, -166], [138, -179], [100, -181], [9, -181], [-131, -181], [-28, -46], [37, 89], [-171, 89]] },
    "5-4": { "par": 12, "t": 1.98, "tg": 2.41, "d": 14.2, "path": [[-142, 134], [-138, 134], [-107, 134], [-74, 133], [-62, 125], [-50, 72], [-8, -24], [172, -97]], "m": 1, "mp": [[143, 134], [138, 134], [107, 134], [74, 133], [62, 125], [50, 72], [8, -24], [-170, -99]] },
    "5-5": { "par": 16, "t": 1.44, "tg": 3.92, "d": 16.1, "path": [[-157, 149], [-157, 93], [-145, -55], [151, -76], [174, -93]], "m": 1, "mp": [[158, 149], [158, 117], [152, 29], [-105, -100], [-147, -78], [-177, -92]] },
    "5-6": { "par": 8, "t": 1.32, "tg": 1.32, "d": 12, "path": [[-157, 104], [-152, 73], [-116, -5], [-46, -118], [125, -93], [180, -91]], "m": 1, "mp": [[158, 104], [157, 95], [152, 73], [139, 38], [119, -7], [91, -62], [56, -126], [-6, -177], [-131, -92], [-181, -91]] },
    "5-7": { "par": 32, "t": 2.68, "tg": 9.32, "d": 12.6, "path": [[-142, -181], [-138, -181], [-100, -181], [-10, -173], [24, -5], [108, 14], [118, 162], [180, 76], [166, -32], [169, -173]], "m": 1, "mp": [[143, -181], [138, -181], [100, -181], [10, -173], [-24, -5], [-108, 14], [-118, 162], [-180, 76], [-166, -32], [-169, -173]] },
    "5-8": { "par": 18, "t": 3.38, "tg": 4.4, "d": 16.2, "path": [[-142, 149], [-142, 117], [-142, 28], [-137, -108], [137, 118], [174, 131], [153, 90], [-103, -181], [-110, -181], [-82, -181], [0, -181], [131, -177], [170, -171]], "m": 1, "mp": [[143, 149], [143, 117], [143, 28], [137, -108], [-137, 118], [-174, 131], [-153, 90], [103, -181], [110, -181], [82, -181], [0, -181], [-131, -181], [-170, -181]] },
    "5-9": { "par": 19, "t": 2.63, "tg": 4.86, "d": 24.9, "path": [[-67, -61], [-68, -70], [-73, -91], [-85, -86], [-110, -89], [-145, -92], [-181, -104], [-165, -130], [-155, -168], [-155, -172], [-162, -169], [-172, -181], [-176, -181], [-171, -181], [-154, -181], [-122, -181], [-77, -181], [138, -177], [170, -172]], "m": 1, "mp": [[68, -61], [80, -87], [161, -92], [163, -140], [163, -172], [152, -181], [72, -181], [-167, -181]] },
    "5-10": { "par": 20, "t": 2.36, "tg": 5.21, "d": 14.1, "path": [[-142, 149], [-142, 117], [-137, 29], [-98, -93], [-34, -167], [-30, -119], [-13, -111], [45, -146], [169, 96]], "m": 1, "mp": [[143, 149], [143, 117], [137, 29], [98, -93], [34, -167], [30, -119], [13, -111], [-45, -146], [-170, 96]] },
    "5-11": { "par": 16, "t": 3.01, "tg": 3.84, "d": 53.9, "path": [[-142, 134], [-130, 134], [-50, 133], [11, 92], [10, -36], [15, -168], [21, -163], [96, -178], [168, -181]], "m": 1, "mp": [[143, 134], [130, 134], [50, 133], [-11, 92], [-10, -36], [-15, -168], [-21, -163], [-96, -178], [-166, -181]] },
    "5-12": { "par": 23, "t": 1.63, "tg": 6.18, "d": 22.5, "path": [[158, 149], [158, 117], [152, 29], [120, -100], [-129, -156], [-166, -152], [-179, -166]], "m": 1, "mp": [[-157, 149], [-157, 117], [-152, 29], [-120, -100], [129, -156], [166, -152], [179, -167]] },
    "5-13": { "par": 18, "t": 1.93, "tg": 4.59, "d": 32.4, "path": [[-142, 149], [-142, 140], [-142, 117], [-142, 79], [-138, 29], [-133, -33], [-131, -107], [-132, -179], [-132, -153], [-131, -144], [-127, -150], [112, -168], [137, -177], [171, -170]], "m": 1, "mp": [[143, 149], [143, 93], [143, -58], [143, -152], [130, -162], [-167, -181]] },
    "5-14": { "par": 18, "t": 2.15, "tg": 4.59, "d": 15.1, "path": [[-172, 173], [-172, 141], [-167, 53], [-133, 51], [-66, 34], [3, -34], [69, -71], [159, -153], [177, -170]], "m": 1, "mp": [[173, 173], [173, 141], [179, 81], [168, 30], [103, 48], [-6, -27], [-150, -23], [-151, -92], [-167, -169], [-169, -173]] },
    "5-15": { "par": 24, "t": 6.66, "tg": 6.66, "d": 56.6, "path": [[-157, 149], [-153, 149], [-115, 149], [-24, 149], [115, 149], [150, 134], [178, 78], [163, -114], [113, -158], [14, -158], [-121, -150], [-149, -125], [-175, -66], [-165, 31], [-100, 98], [1, 78], [103, 65], [76, 5], [66, -93], [3, -76], [-98, -68], [-65, -7], [0, -10], [17, -8]], "m": 1, "mp": [[158, 149], [153, 149], [115, 149], [24, 149], [-115, 149], [-150, 134], [-178, 78], [-163, -114], [-113, -158], [-14, -158], [121, -150], [149, -125], [175, -66], [165, 31], [100, 98], [-1, 78], [-103, 65], [-76, 5], [-66, -93], [-3, -76], [98, -68], [65, -7], [-4, -14], [-20, -15]] },
    "5-16": { "par": 24, "t": 4.01, "tg": 6.44, "d": 39.9, "path": [[-157, 104], [-152, 73], [-117, 37], [-45, 30], [182, 89], [10, 29], [-59, 29], [-156, 27], [-147, -15], [-81, -52], [-18, -70], [3, -132], [-36, -174], [-126, -178], [-168, -179]], "m": 1, "mp": [[158, 104], [152, 73], [117, 37], [45, 30], [-181, 89], [-10, 29], [59, 29], [156, 27], [147, -15], [81, -52], [18, -70], [-3, -132], [36, -174], [126, -178], [168, -179]] },
    "5-17": { "par": 21, "t": 2.61, "tg": 5.41, "d": 62.7, "path": [[-157, 149], [-152, 118], [-120, 38], [-87, 42], [91, 90], [48, 89], [26, 65], [48, -12], [102, -124], [169, -172]], "m": 1, "mp": [[158, 149], [152, 118], [120, 38], [87, 42], [-91, 90], [-48, 89], [-26, 65], [-48, -12], [-102, -124], [-169, -173]] },
    "5-18": { "par": 25, "t": 3.92, "tg": 6.77, "d": 74.6, "path": [[-157, -157], [-163, -180], [-179, -181], [-181, -175], [-181, -137], [-181, -47], [-177, 92], [166, 3], [177, -42], [182, -50], [182, -39], [182, 3], [182, 78], [182, 161], [182, 167]], "m": 1, "mp": [[158, -157], [157, -166], [152, -180], [140, -179], [121, -181], [102, -181], [84, -181], [71, -181], [69, -181], [80, -181], [106, -181], [145, -177], [177, -165], [162, -141], [151, -104], [151, -53], [155, 9], [160, 83], [164, 168], [162, 156], [155, 141], [-164, -9], [-181, 6], [-177, 34], [-181, 72], [-181, 117], [-181, 168]] },
    "5-19": { "par": 28, "t": 6.99, "tg": 7.72, "d": 52, "path": [[-172, -175], [-172, -181], [-172, -181], [-177, -181], [-181, -181], [-181, -178], [-181, -164], [-178, -163], [-142, -163], [-54, -163], [83, -168], [159, -105], [146, -99], [180, -89], [162, -88], [109, -88], [6, -89], [-145, -87], [-145, 8], [-92, 70], [-11, 171], [113, 141], [156, 77], [158, 13], [171, -5]], "m": 1, "mp": [[173, -175], [173, -181], [173, -181], [177, -181], [182, -181], [182, -178], [182, -164], [178, -163], [142, -163], [54, -163], [-83, -168], [-159, -105], [-146, -99], [-180, -89], [-162, -88], [-109, -88], [-6, -89], [145, -87], [145, 8], [92, 70], [11, 171], [-113, 141], [-156, 77], [-158, 8], [-167, -12]] },
    "5-20": { "par": 29, "t": 6.49, "tg": 8.1, "d": 75.9, "path": [[-157, -181], [-162, -181], [-179, -181], [-181, -178], [-181, -141], [-178, -98], [-144, -97], [-71, -90], [35, -98], [137, -155], [-123, -29], [-132, -17], [-176, -15], [-179, -43], [-181, -30], [-181, 16], [-178, 36], [-144, 44], [-59, 39], [68, 8], [-90, 93], [78, 101], [174, 101]], "m": 1, "mp": [[158, -181], [158, -181], [162, -181], [171, -181], [180, -181], [181, -181], [182, -181], [182, -178], [182, -165], [182, -141], [182, -103], [182, -98], [181, -98], [177, -90], [165, -88], [140, -88], [102, -89], [52, -91], [-8, -93], [-72, -105], [-135, -131], [-178, -171], [164, -36], [176, -30], [175, -31], [180, -35], [182, -36], [182, -31], [182, -19], [182, 6], [181, 44], [179, 36], [169, 38], [146, 46], [111, 42], [62, 36], [3, 22], [-66, 3], [-144, -24], [85, 92], [-8, 101], [-95, 104], [-170, 99]] }
  };

  // src/levels/index.js
  var WORLDS = [
    { id: 1, theme: "meadow", defs: WORLD1 },
    { id: 2, theme: "sunset", defs: WORLD2 },
    { id: 3, theme: "ice", defs: WORLD3 },
    { id: 4, theme: "factory", defs: WORLD4 },
    { id: 5, theme: "neon", defs: WORLD5 }
  ].filter((w) => w.defs.length);
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
  var DAILY_POOL = DEFS.map((d, i) => i).filter((i) => !DEFS[i].tut && META[DEFS[i].id] && META[DEFS[i].id].m);
  var dailyCache = null;
  function getDaily(day) {
    if (dailyCache && dailyCache.day === day) return dailyCache.lvl;
    if (!DAILY_POOL.length) return null;
    let h = day * 2654435761 >>> 0;
    h ^= h >>> 15;
    h = Math.imul(h, 739982445) >>> 0;
    h = (h ^ h >>> 12) >>> 0;
    const src = DAILY_POOL[h % DAILY_POOL.length], def = DEFS[src], m = META[def.id];
    const lvl = compile(def, { mirror: true });
    lvl.index = src;
    lvl.world = def.world;
    lvl.daily = true;
    lvl.tut = null;
    lvl.par = def.par || m.par || 30;
    lvl.hint = m.mp || null;
    dailyCache = { day, lvl };
    return lvl;
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
  var DAILY_FROM = 5;
  var DAILY_BONUS = 5;
  var _p2 = { x: 0, y: 0, vx: 0, vy: 0 };
  function today() {
    const d = /* @__PURE__ */ new Date();
    return Math.floor((d.getTime() - d.getTimezoneOffset() * 6e4) / 864e5);
  }
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
    _load(i, daily) {
      this.index = i;
      this.daily = !!daily;
      let lvl = daily || getLevel(i);
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
      this.ui.home({ levelNum: i + 1, stars: totalStars(this.save), gems: this.save.gems, daily: this._dailyInfo() });
    }
    _dailyInfo() {
      const d = this.save.daily, t = today();
      if (this.save.max < DAILY_FROM || !DAILY_POOL.length) return null;
      return { done: d.day === t, streak: d.day >= t - 1 ? d.streak : 0 };
    }
    /** Level of the day: a mirrored campaign level, the same for everyone. */
    startDaily() {
      const lvl = getDaily(today());
      if (!lvl || this.busy) return;
      this._load(lvl.index, lvl);
      this.state = "play";
      this.overlay = null;
      this.acc = 0;
      this.timeScale = 1;
      this.rotated = 0;
      this.t0 = -1;
      this.layout();
      this.ui.show(null);
      this.ui.hud(true);
      this.ui.setHud("\u2605", 0, this.sim.lvl.gems.length);
      this.ui.tutorialOff();
      this.tutKind = null;
      this.save.stat.plays++;
      this.platform.gameplayStart();
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
      this.ui.setHud(this.daily ? "\u2605" : this.index + 1, 0, this.sim.lvl.gems.length);
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
      else {
        const key = "tut" + k[0].toUpperCase() + k.slice(1);
        this.ui.tutorial("note", t(key));
      }
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
      if (this.busy || this.daily || this.index + 1 >= LEVEL_COUNT || this.state !== "play" && this.state !== "dying") return;
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
      const s = !this.daily && this.index + 1 < LEVEL_COUNT && (this.deathsHere >= SKIP_AFTER.deaths || this.playT > SKIP_AFTER.sec);
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
      this.ui.map({ stars: this.save.stars, max: Math.min(this.save.max, LEVEL_COUNT - 1), count: LEVEL_COUNT, worlds: WORLDS.map((w) => ({ n: w.defs.length, color: themeOf(w.theme).wallTop })), current: this.state === "play" ? this.index : -1 });
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
      if (this.daily || this.index >= FIRST_AD_AFTER) await this.platform.interstitial();
      this.busy = false;
      if (this.daily) {
        this.state = "home";
        this.index = -1;
        this.goHome();
      } else if (this.index + 1 >= LEVEL_COUNT) {
        this.state = "end";
        this.ui.hud(false);
        this.ui.show("scrEnd");
      } else this.startLevel(this.index + 1);
    }
    retry() {
      if (this.busy) return;
      if (this.daily) this.startDaily();
      else this.startLevel(this.index);
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
          this.ui.setHud(this.daily ? "\u2605" : this.index + 1, s.gemCount, s.lvl.gems.length);
        } else if (e.t === "bump") {
          v.fxBump(e.x, e.y);
          a.bump();
        } else if (e.t === "pad") {
          v.fxPad(e.x, e.y);
          a.pad();
        } else if (e.t === "shatter") {
          v.fxShatter(e.x, e.y);
          a.shatter();
        } else if (e.t === "key") {
          v.fxKey(e.x, e.y, e.v);
          a.key(e.v);
        } else if (e.t === "port") {
          v.fxPort(e.x, e.y, e.v);
          a.port();
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
      let bonus = 0;
      if (this.daily) {
        const t = today(), d = sv.daily;
        if (d.day !== t) {
          d.streak = d.day === t - 1 ? d.streak + 1 : 1;
          d.day = t;
          d.best = Math.max(d.best, d.streak);
          bonus = DAILY_BONUS + Math.min(d.streak, 5);
        }
      } else {
        sv.stars[i] = Math.max(sv.stars[i] || 0, stars);
        const tenths = Math.round(time * 10);
        sv.best[i] = sv.best[i] ? Math.min(sv.best[i], tenths) : tenths;
        if (i + 1 < LEVEL_COUNT) sv.max = Math.max(sv.max, i + 1);
      }
      sv.gems += got + bonus;
      sv.earned += got + bonus;
      sv.stat.wins++;
      for (let k = 0; k < sv.stars.length; k++) if (sv.stars[k] === void 0) sv.stars[k] = 0;
      this.result = { stars, time, par: L.par, got, total, bonus, doubled: false };
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
        daily: () => g.startDaily(),
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
      home: g("goHome"),
      daily: g("startDaily")
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
    if (local_default.id === "local") window.__fwBack = () => {
      if (game.overlay) {
        game.closeOverlay();
        return true;
      }
      if (game.state === "play" || game.state === "dying" || game.state === "won") {
        game.goHome();
        return true;
      }
      return false;
    };
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vc3JjL3BsYXRmb3JtL2xvY2FsLmpzIiwgIi4uLy4uL3NyYy9tZXRhL3NhdmUuanMiLCAiLi4vLi4vc3JjL2kxOG4vbG9jYWxlcy5qcyIsICIuLi8uLi9zcmMvaTE4bi9zdHJpbmdzLmpzIiwgIi4uLy4uL3NyYy9zaW0vZm9ybXMuanMiLCAiLi4vLi4vc3JjL3NpbS9zaW0uanMiLCAiLi4vLi4vc3JjL3JlbmRlci90aGVtZXMuanMiLCAiLi4vLi4vc3JjL3JlbmRlci9nZW8uanMiLCAiLi4vLi4vc3JjL3JlbmRlci9meC5qcyIsICIuLi8uLi9zcmMvcmVuZGVyL3NraW5zLmpzIiwgIi4uLy4uL3NyYy9yZW5kZXIvdmlldy5qcyIsICIuLi8uLi9zcmMvdWkvdWkuanMiLCAiLi4vLi4vc3JjL2F1ZGlvL2F1ZGlvLmpzIiwgIi4uLy4uL3NyYy9sZXZlbHMvcGFyc2UuanMiLCAiLi4vLi4vc3JjL2xldmVscy93b3JsZDEuanMiLCAiLi4vLi4vc3JjL2xldmVscy93b3JsZDIuanMiLCAiLi4vLi4vc3JjL2xldmVscy93b3JsZDMuanMiLCAiLi4vLi4vc3JjL2xldmVscy93b3JsZDQuanMiLCAiLi4vLi4vc3JjL2xldmVscy93b3JsZDUuanMiLCAiLi4vLi4vc3JjL2xldmVscy9tZXRhLmdlbi5qcyIsICIuLi8uLi9zcmMvbGV2ZWxzL2luZGV4LmpzIiwgIi4uLy4uL3NyYy9pbnB1dC5qcyIsICIuLi8uLi9zcmMvZ2FtZS5qcyIsICIuLi8uLi9zcmMvbWFpbi5qcyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiLy8gTG9jYWwgLyBnZW5lcmljLXdlYiBhZGFwdGVyOiBkZXZlbG9wbWVudCwgcGxheXRlc3RzIGFuZCBwbGFpbiB3ZWIgaG9zdGluZy5cbi8vIE5vdCB1c2VkIGluIHRoZSBZb3VUdWJlIGJ1aWxkICh0aGF0IG9uZSBtdXN0IG5vdCB0b3VjaCBsb2NhbFN0b3JhZ2UsIHRoZSBQYWdlXG4vLyBWaXNpYmlsaXR5IEFQSSBvciBuYXZpZ2F0b3IubGFuZ3VhZ2UgXHUyMDE0IHNlZSBkb2NzL1BMQVRGT1JNLVJVTEVTLm1kKS5cbmNvbnN0IEtFWSA9IFwiZmxpcHdvcmxkLnNhdmUudjJcIjtcbmNvbnN0IHFzID0gbmV3IFVSTFNlYXJjaFBhcmFtcyhsb2NhdGlvbi5zZWFyY2gpO1xubGV0IHBhdXNlQ2IgPSBudWxsLCByZXN1bWVDYiA9IG51bGw7XG5cbmZ1bmN0aW9uIGZha2VBZChsYWJlbCwgbXMpIHtcbiAgLy8gdmlzaWJsZSBzdGFuZC1pbiBzbyBhZCB0aW1pbmcgY2FuIGJlIGp1ZGdlZCBkdXJpbmcgcGxheXRlc3RzIChvbmx5IHdpdGggP2Fkcz0xKVxuICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICBpZiAocGF1c2VDYikgcGF1c2VDYigpO1xuICAgIGNvbnN0IGVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICBlbC5jbGFzc05hbWUgPSBcImRldi1hZFwiOyBlbC50ZXh0Q29udGVudCA9IGxhYmVsO1xuICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoZWwpO1xuICAgIHNldFRpbWVvdXQoKCkgPT4geyBlbC5yZW1vdmUoKTsgaWYgKHJlc3VtZUNiKSByZXN1bWVDYigpOyByZXNvbHZlKHRydWUpOyB9LCBtcyk7XG4gIH0pO1xufVxuXG5leHBvcnQgZGVmYXVsdCB7XG4gIGlkOiBcImxvY2FsXCIsXG4gIGNhcHM6IHsgYWRzOiBxcy5nZXQoXCJhZHNcIikgPT09IFwiMVwiLCBsYW5ndWFnZU1lbnU6IHRydWUgfSxcblxuICBsb2FkaW5nU2hvd24oKSB7fSxcbiAgcmVhZHkoKSB7fSxcblxuICBhc3luYyBsb2FkKCkge1xuICAgIGlmIChxcy5nZXQoXCJmcmVzaFwiKSA9PT0gXCIxXCIpIHsgdHJ5IHsgbG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oS0VZKTsgfSBjYXRjaCAoXykgeyAvKiBub29wICovIH0gcmV0dXJuIG51bGw7IH1cbiAgICB0cnkgeyBjb25zdCByYXcgPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbShLRVkpOyByZXR1cm4gcmF3ID8gSlNPTi5wYXJzZShyYXcpIDogbnVsbDsgfSBjYXRjaCAoXykgeyByZXR1cm4gbnVsbDsgfVxuICB9LFxuICBzYXZlKGRhdGEpIHsgdHJ5IHsgbG9jYWxTdG9yYWdlLnNldEl0ZW0oS0VZLCBKU09OLnN0cmluZ2lmeShkYXRhKSk7IH0gY2F0Y2ggKF8pIHsgLyogcHJpdmF0ZSBtb2RlICovIH0gfSxcblxuICBhc3luYyBsYW5ndWFnZSgpIHsgcmV0dXJuIHFzLmdldChcImxhbmdcIikgfHwgbmF2aWdhdG9yLmxhbmd1YWdlIHx8IFwiZW5cIjsgfSxcblxuICBhdWRpb0VuYWJsZWQoKSB7IHJldHVybiBxcy5nZXQoXCJtdXRlXCIpICE9PSBcIjFcIjsgfSxcbiAgb25BdWRpb0NoYW5nZSgpIHt9LFxuICBvblBhdXNlKGNiKSB7XG4gICAgcGF1c2VDYiA9IGNiO1xuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJ2aXNpYmlsaXR5Y2hhbmdlXCIsICgpID0+IHsgaWYgKGRvY3VtZW50LmhpZGRlbikgeyBpZiAocGF1c2VDYikgcGF1c2VDYigpOyB9IGVsc2UgaWYgKHJlc3VtZUNiKSByZXN1bWVDYigpOyB9KTtcbiAgfSxcbiAgb25SZXN1bWUoY2IpIHsgcmVzdW1lQ2IgPSBjYjsgfSxcblxuICBhc3luYyBpbnRlcnN0aXRpYWwoKSB7IHJldHVybiB0aGlzLmNhcHMuYWRzID8gZmFrZUFkKFwiQUQgXHUwMEI3IGludGVyc3RpdGlhbCAoZGV2KVwiLCA5MDApIDogZmFsc2U7IH0sXG4gIGFzeW5jIHJld2FyZGVkKGlkKSB7IHJldHVybiB0aGlzLmNhcHMuYWRzID8gZmFrZUFkKFwiQUQgXHUwMEI3IHJld2FyZGVkOiBcIiArIGlkICsgXCIgKGRldilcIiwgMTEwMCkgOiBmYWxzZTsgfSxcblxuICBzY29yZSgpIHt9LCBsb2dFcnJvcigpIHt9LFxuICBnYW1lcGxheVN0YXJ0KCkge30sIGdhbWVwbGF5U3RvcCgpIHt9LCBoYXBweSgpIHt9XG59O1xuIiwgIi8vIFBsYXllciBwcm9ncmVzczogc2NoZW1hLCBtaWdyYXRpb24gZnJvbSBvbGRlciBzYXZlcywgbWVyZ2UuXG4vLyBMYW5ndWFnZSBpcyBkZWxpYmVyYXRlbHkgTk9UIHN0b3JlZCAocGxhdGZvcm0gcnVsZTogaXQgY29tZXMgZnJvbSB0aGUgaG9zdCBlYWNoIHNlc3Npb24pLlxuZXhwb3J0IGNvbnN0IFNBVkVfVkVSU0lPTiA9IDI7XG5cbmV4cG9ydCBmdW5jdGlvbiBmcmVzaFNhdmUoKSB7XG4gIHJldHVybiB7XG4gICAgdjogU0FWRV9WRVJTSU9OLFxuICAgIHN0YXJzOiBbXSwgICAgICAgICAgICAgICAgIC8vIHN0YXJzW2ldID0gYmVzdCBzdGFycyAoMS4uMykgZm9yIGxldmVsIGluZGV4IGk7IDAvdW5kZWZpbmVkID0gbm90IGZpbmlzaGVkXG4gICAgYmVzdDogW10sICAgICAgICAgICAgICAgICAgLy8gYmVzdFtpXSA9IGJlc3QgdGltZSBpbiB0ZW50aHMgb2YgYSBzZWNvbmRcbiAgICBtYXg6IDAsICAgICAgICAgICAgICAgICAgICAvLyBoaWdoZXN0IHVubG9ja2VkIGxldmVsIGluZGV4XG4gICAgZ2VtczogMCwgICAgICAgICAgICAgICAgICAgLy8gc3BlbmRhYmxlIGN1cnJlbmN5XG4gICAgZWFybmVkOiAwLCAgICAgICAgICAgICAgICAgLy8gbGlmZXRpbWUgZ2VtcyAoZm9yIGFjaGlldmVtZW50cylcbiAgICBza2luczogW1wiY2xhc3NpY1wiXSwgc2tpbjogXCJjbGFzc2ljXCIsXG4gICAgc2V0OiB7IG11c2ljOiAxLCBzZng6IDEsIGN0bDogXCJzd2lwZVwiLCBoYXB0aWM6IDEgfSxcbiAgICB0dXQ6IHt9LCAgICAgICAgICAgICAgICAgICAvLyB0dXRvcmlhbCBmbGFncyBhbHJlYWR5IHNob3duXG4gICAgc3RhdDogeyBkZWF0aHM6IDAsIHdpbnM6IDAsIHBsYXlzOiAwIH0sXG4gICAgZGFpbHk6IHsgZGF5OiAwLCBzdHJlYWs6IDAsIGJlc3Q6IDAgfVxuICB9O1xufVxuXG4vKiogQWNjZXB0IGFueXRoaW5nIHRoYXQgd2FzIGV2ZXIgc2F2ZWQgYW5kIHJldHVybiBhIHZhbGlkIGN1cnJlbnQgc2F2ZS4gTmV2ZXIgdGhyb3dzLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG1pZ3JhdGUocmF3KSB7XG4gIGNvbnN0IHMgPSBmcmVzaFNhdmUoKTtcbiAgaWYgKCFyYXcgfHwgdHlwZW9mIHJhdyAhPT0gXCJvYmplY3RcIikgcmV0dXJuIHM7XG4gIHRyeSB7XG4gICAgaWYgKHJhdy52ID09PSAxIHx8IHJhdy51bmxvY2tlZExldmVsICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIC8vIHYxIChwcm90b3R5cGUpOiB7IHVubG9ja2VkTGV2ZWwsIHRvdGFsR2Vtcywgc3RhcnM6e251bTpufSwgdW5sb2NrZWRTaGFwZXMsIGJlc3RTdHJlYWsgfVxuICAgICAgY29uc3Qgc3QgPSByYXcuc3RhcnMgfHwge307XG4gICAgICBmb3IgKGNvbnN0IGsgb2YgT2JqZWN0LmtleXMoc3QpKSB7IGNvbnN0IGkgPSAoayB8IDApIC0gMTsgaWYgKGkgPj0gMCAmJiBpIDwgNTAwKSBzLnN0YXJzW2ldID0gY2xhbXBJbnQoc3Rba10sIDAsIDMpOyB9XG4gICAgICBzLm1heCA9IGNsYW1wSW50KChyYXcudW5sb2NrZWRMZXZlbCB8IDApIC0gMSwgMCwgNTAwKTtcbiAgICAgIHMuZ2VtcyA9IHMuZWFybmVkID0gY2xhbXBJbnQocmF3LnRvdGFsR2VtcywgMCwgMWU2KTtcbiAgICAgIHJldHVybiBzO1xuICAgIH1cbiAgICBpZiAoQXJyYXkuaXNBcnJheShyYXcuc3RhcnMpKSBzLnN0YXJzID0gcmF3LnN0YXJzLnNsaWNlKDAsIDEwMDApLm1hcCgobikgPT4gY2xhbXBJbnQobiwgMCwgMykpO1xuICAgIGlmIChBcnJheS5pc0FycmF5KHJhdy5iZXN0KSkgcy5iZXN0ID0gcmF3LmJlc3Quc2xpY2UoMCwgMTAwMCkubWFwKChuKSA9PiBjbGFtcEludChuLCAwLCAxZTYpKTtcbiAgICBzLm1heCA9IGNsYW1wSW50KHJhdy5tYXgsIDAsIDEwMDApO1xuICAgIHMuZ2VtcyA9IGNsYW1wSW50KHJhdy5nZW1zLCAwLCAxZTcpO1xuICAgIHMuZWFybmVkID0gY2xhbXBJbnQocmF3LmVhcm5lZCwgcy5nZW1zLCAxZTcpO1xuICAgIGlmIChBcnJheS5pc0FycmF5KHJhdy5za2lucykpIHMuc2tpbnMgPSBbLi4ubmV3IFNldChbXCJjbGFzc2ljXCIsIC4uLnJhdy5za2lucy5maWx0ZXIoKHgpID0+IHR5cGVvZiB4ID09PSBcInN0cmluZ1wiKV0pXS5zbGljZSgwLCAyMDApO1xuICAgIGlmICh0eXBlb2YgcmF3LnNraW4gPT09IFwic3RyaW5nXCIgJiYgcy5za2lucy5pbmNsdWRlcyhyYXcuc2tpbikpIHMuc2tpbiA9IHJhdy5za2luO1xuICAgIGlmIChyYXcuc2V0ICYmIHR5cGVvZiByYXcuc2V0ID09PSBcIm9iamVjdFwiKSB7XG4gICAgICBzLnNldC5tdXNpYyA9IHJhdy5zZXQubXVzaWMgPyAxIDogMDsgcy5zZXQuc2Z4ID0gcmF3LnNldC5zZnggPyAxIDogMDsgcy5zZXQuaGFwdGljID0gcmF3LnNldC5oYXB0aWMgPyAxIDogMDtcbiAgICAgIHMuc2V0LmN0bCA9IHJhdy5zZXQuY3RsID09PSBcImdyYWJcIiA/IFwiZ3JhYlwiIDogXCJzd2lwZVwiO1xuICAgIH1cbiAgICBpZiAocmF3LnR1dCAmJiB0eXBlb2YgcmF3LnR1dCA9PT0gXCJvYmplY3RcIikgZm9yIChjb25zdCBrIG9mIE9iamVjdC5rZXlzKHJhdy50dXQpLnNsaWNlKDAsIDUwKSkgcy50dXRba10gPSAxO1xuICAgIGlmIChyYXcuc3RhdCAmJiB0eXBlb2YgcmF3LnN0YXQgPT09IFwib2JqZWN0XCIpIHsgcy5zdGF0LmRlYXRocyA9IGNsYW1wSW50KHJhdy5zdGF0LmRlYXRocywgMCwgMWU5KTsgcy5zdGF0LndpbnMgPSBjbGFtcEludChyYXcuc3RhdC53aW5zLCAwLCAxZTkpOyBzLnN0YXQucGxheXMgPSBjbGFtcEludChyYXcuc3RhdC5wbGF5cywgMCwgMWU5KTsgfVxuICAgIGlmIChyYXcuZGFpbHkgJiYgdHlwZW9mIHJhdy5kYWlseSA9PT0gXCJvYmplY3RcIikgeyBzLmRhaWx5LmRheSA9IGNsYW1wSW50KHJhdy5kYWlseS5kYXksIDAsIDFlOSk7IHMuZGFpbHkuc3RyZWFrID0gY2xhbXBJbnQocmF3LmRhaWx5LnN0cmVhaywgMCwgMWU2KTsgcy5kYWlseS5iZXN0ID0gY2xhbXBJbnQocmF3LmRhaWx5LmJlc3QsIDAsIDFlNik7IH1cbiAgfSBjYXRjaCAoXykgeyByZXR1cm4gZnJlc2hTYXZlKCk7IH1cbiAgcmV0dXJuIHM7XG59XG5cbmZ1bmN0aW9uIGNsYW1wSW50KG4sIGxvLCBoaSkgeyBuID0gTnVtYmVyKG4pOyBpZiAoIWlzRmluaXRlKG4pKSBuID0gbG87IG4gPSBNYXRoLmZsb29yKG4pOyByZXR1cm4gbiA8IGxvID8gbG8gOiBuID4gaGkgPyBoaSA6IG47IH1cblxuLyoqIENvbWJpbmUgdHdvIHNhdmVzIHdpdGhvdXQgbG9zaW5nIHByb2dyZXNzIGZyb20gZWl0aGVyICh1c2VkIGFmdGVyIGEgZmFpbGVkIGNsb3VkIGxvYWQpLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG1lcmdlU2F2ZXMoYSwgYikge1xuICBjb25zdCBBID0gbWlncmF0ZShhKSwgQiA9IG1pZ3JhdGUoYik7XG4gIGNvbnN0IG91dCA9IHRvdGFsU3RhcnMoQSkgPj0gdG90YWxTdGFycyhCKSA/IEEgOiBCLCBvdGhlciA9IG91dCA9PT0gQSA/IEIgOiBBO1xuICBjb25zdCBuID0gTWF0aC5tYXgoQS5zdGFycy5sZW5ndGgsIEIuc3RhcnMubGVuZ3RoKTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBuOyBpKyspIHtcbiAgICBvdXQuc3RhcnNbaV0gPSBNYXRoLm1heChBLnN0YXJzW2ldIHx8IDAsIEIuc3RhcnNbaV0gfHwgMCk7XG4gICAgY29uc3QgeCA9IEEuYmVzdFtpXSB8fCAwLCB5ID0gQi5iZXN0W2ldIHx8IDA7XG4gICAgb3V0LmJlc3RbaV0gPSB4ICYmIHkgPyBNYXRoLm1pbih4LCB5KSA6IHggfHwgeTtcbiAgfVxuICBvdXQubWF4ID0gTWF0aC5tYXgoQS5tYXgsIEIubWF4KTtcbiAgb3V0LmdlbXMgPSBNYXRoLm1heChBLmdlbXMsIEIuZ2Vtcyk7XG4gIG91dC5lYXJuZWQgPSBNYXRoLm1heChBLmVhcm5lZCwgQi5lYXJuZWQpO1xuICBvdXQuc2tpbnMgPSBbLi4ubmV3IFNldChbLi4uQS5za2lucywgLi4uQi5za2luc10pXTtcbiAgZm9yIChjb25zdCBrIG9mIE9iamVjdC5rZXlzKG90aGVyLnR1dCkpIG91dC50dXRba10gPSAxO1xuICByZXR1cm4gb3V0O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdG90YWxTdGFycyhzKSB7IGxldCB0ID0gMDsgZm9yIChsZXQgaSA9IDA7IGkgPCBzLnN0YXJzLmxlbmd0aDsgaSsrKSB0ICs9IHMuc3RhcnNbaV0gfHwgMDsgcmV0dXJuIHQ7IH1cbiIsICIvLyBBZGRpdGlvbmFsIGxhbmd1YWdlcy4gRWFjaCByb3cgZm9sbG93cyBLRVlTIGV4YWN0bHk7IHN0cmluZ3MuanMgdHVybnMgdGhlIHJvd3MgaW50byB0YWJsZXMuXG4vLyBMYWJlbHMgYXJlIGtlcHQgc2hvcnQgb24gcHVycG9zZSAodGhleSBzaXQgb24gYnV0dG9ucykuIEVuZ2xpc2ggKyBBcmFiaWMgbGl2ZSBpbiBzdHJpbmdzLmpzLlxuZXhwb3J0IGNvbnN0IEtFWVMgPSBbXG4gIFwibG9hZGluZ1wiLCBcImxldmVsXCIsIFwibGV2ZWxzXCIsIFwibmV4dFwiLCBcInJldHJ5XCIsIFwic2V0dGluZ3NcIiwgXCJtdXNpY1wiLCBcInNmeFwiLCBcImNvbnRyb2xcIiwgXCJjdGxTd2lwZVwiLCBcImN0bEdyYWJcIixcbiAgXCJ3aW4xXCIsIFwid2luMlwiLCBcIndpbjNcIiwgXCJwYXVzZWRcIiwgXCJ0dXREcmFnXCIsIFwidHV0Qm90aFwiLCBcInR1dFNwaWtlc1wiLCBcInR1dEZsaXBcIiwgXCJ0dXRFZGdlXCIsXG4gIFwiZW5kVGl0bGVcIiwgXCJlbmRCb2R5XCIsIFwiZG91YmxlR2Vtc1wiLCBcImFkRmFpbFwiLCBcIm5vV2ViZ2xcIiwgXCJjbG9zZVwiLCBcInNraW5zXCIsIFwiaGludFwiLCBcInNraXBcIiwgXCJub3RFbm91Z2hcIiwgXCJlcXVpcHBlZFwiLFxuICBcInR1dFBhZFwiLCBcInR1dE1vdmVyXCIsIFwidHV0U2F3XCIsIFwidHV0S2V5XCIsIFwidHV0R2F0ZVwiLCBcInR1dExhc2VyXCIsIFwidHV0RmFuXCIsIFwidHV0UG9ydFwiXG5dO1xuXG5leHBvcnQgY29uc3QgUk9XUyA9IHtcbiAgZXM6IFtcIkNhcmdhbmRvXHUyMDI2XCIsIFwiTml2ZWxcIiwgXCJOaXZlbGVzXCIsIFwiU2lndWllbnRlXCIsIFwiUmVpbnRlbnRhclwiLCBcIkFqdXN0ZXNcIiwgXCJNXHUwMEZBc2ljYVwiLCBcIlNvbmlkb3NcIiwgXCJDb250cm9sZXNcIiwgXCJEZXNsaXphclwiLCBcIkFnYXJyYXIgeSBnaXJhclwiLFxuICAgIFwiXHUwMEExQmllbiFcIiwgXCJcdTAwQTFHZW5pYWwhXCIsIFwiXHUwMEExUGVyZmVjdG8hXCIsIFwiRW4gcGF1c2FcIiwgXCJBcnJhc3RyYSBwYXJhIGluY2xpbmFyIGVsIG11bmRvXCIsIFwiSW5jbGluYSBhIGFtYm9zIGxhZG9zXCIsIFwiRWwgcm9qbyBlcyBwZWxpZ3JvXCIsIFwiUG9ubG8gYm9jYSBhYmFqb1wiLCBcIk5vIHRlIGNhaWdhc1wiLFxuICAgIFwiXHUwMEExTXVuZG8gY29tcGxldGFkbyFcIiwgXCJUZXJtaW5hc3RlIHRvZG9zIGxvcyBuaXZlbGVzLiBWaWVuZW4gbVx1MDBFMXMgbXVuZG9zOiBcdTAwQTF2dWVsdmUgcG9yIGxhcyAzIGVzdHJlbGxhcyFcIiwgXCJEdXBsaWNhciBnZW1hc1wiLCBcIk5vIGhheSBhbnVuY2lvcyBwb3IgYWhvcmFcIiwgXCJFc3RlIGRpc3Bvc2l0aXZvIG5vIHB1ZWRlIG1vc3RyYXIgZ3JcdTAwRTFmaWNvcyAzRC5cIiwgXCJDZXJyYXJcIiwgXCJCb2xhc1wiLCBcIlBpc3RhXCIsIFwiU2FsdGFyIG5pdmVsXCIsIFwiRmFsdGFuIGdlbWFzXCIsIFwiRW4gdXNvXCIsXG4gICAgXCJMYXMgcGxhY2FzIGFtYXJpbGxhcyB0ZSBsYW56YW5cIiwgXCJTXHUwMEZBYmV0ZSBhbCBibG9xdWUgbVx1MDBGM3ZpbFwiLCBcIkVzcXVpdmEgbGEgc2llcnJhXCIsIFwiTGEgbGxhdmUgYWJyZSBsYSBwdWVydGFcIiwgXCJMYXMgcHVlcnRhcyB2ZXJkZXMgc29uIGRlIHVuIHNvbG8gc2VudGlkb1wiLCBcIkVzcGVyYSBhIHF1ZSBlbCBsXHUwMEUxc2VyIHNlIGFwYWd1ZVwiLCBcIkVsIHZpZW50byB0ZSBsbGV2YVwiLCBcIkxvcyBwb3J0YWxlcyBlc3RcdTAwRTFuIGNvbmVjdGFkb3NcIl0sXG4gIHB0OiBbXCJDYXJyZWdhbmRvXHUyMDI2XCIsIFwiTlx1MDBFRHZlbFwiLCBcIk5cdTAwRUR2ZWlzXCIsIFwiUHJcdTAwRjN4aW1vXCIsIFwiUmVwZXRpclwiLCBcIkFqdXN0ZXNcIiwgXCJNXHUwMEZBc2ljYVwiLCBcIlNvbnNcIiwgXCJDb250cm9sZXNcIiwgXCJEZXNsaXphclwiLCBcIlBlZ2FyIGUgZ2lyYXJcIixcbiAgICBcIkJvYSFcIiwgXCJcdTAwRDN0aW1vIVwiLCBcIlBlcmZlaXRvIVwiLCBcIlBhdXNhZG9cIiwgXCJBcnJhc3RlIHBhcmEgaW5jbGluYXIgbyBtdW5kb1wiLCBcIkluY2xpbmUgcGFyYSBvcyBkb2lzIGxhZG9zXCIsIFwiVmVybWVsaG8gXHUwMEU5IHBlcmlnb1wiLCBcIlZpcmUgZGUgY2FiZVx1MDBFN2EgcGFyYSBiYWl4b1wiLCBcIk5cdTAwRTNvIGNhaWFcIixcbiAgICBcIk11bmRvIGNvbXBsZXRvIVwiLCBcIlZvY1x1MDBFQSB0ZXJtaW5vdSB0b2RvcyBvcyBuXHUwMEVEdmVpcy4gTWFpcyBtdW5kb3Mgdlx1MDBFQW0gYVx1MDBFRDogdm9sdGUgcGVsYXMgMyBlc3RyZWxhcyFcIiwgXCJEb2JyYXIgZ2VtYXNcIiwgXCJOZW5odW0gYW5cdTAwRkFuY2lvIGFnb3JhXCIsIFwiRXN0ZSBhcGFyZWxobyBuXHUwMEUzbyBleGliZSBnclx1MDBFMWZpY29zIDNELlwiLCBcIkZlY2hhclwiLCBcIkJvbGFzXCIsIFwiRGljYVwiLCBcIlB1bGFyIG5cdTAwRUR2ZWxcIiwgXCJGYWx0YW0gZ2VtYXNcIiwgXCJFbSB1c29cIixcbiAgICBcIkFzIHBsYWNhcyBhbWFyZWxhcyBsYW5cdTAwRTdhbSB2b2NcdTAwRUFcIiwgXCJTdWJhIG5vIGJsb2NvIG1cdTAwRjN2ZWxcIiwgXCJEZXN2aWUgZGEgc2VycmFcIiwgXCJBIGNoYXZlIGFicmUgYSBwb3J0YVwiLCBcIlBvcnRcdTAwRjVlcyB2ZXJkZXMgc1x1MDBFM28gZGUgbVx1MDBFM28gXHUwMEZBbmljYVwiLCBcIkVzcGVyZSBvIGxhc2VyIGFwYWdhclwiLCBcIk8gdmVudG8gbGV2YSB2b2NcdTAwRUFcIiwgXCJPcyBwb3J0YWlzIHNcdTAwRTNvIGxpZ2Fkb3NcIl0sXG4gIGRlOiBbXCJMXHUwMEU0ZHRcdTIwMjZcIiwgXCJMZXZlbFwiLCBcIkxldmVsXCIsIFwiV2VpdGVyXCIsIFwiTm9jaG1hbFwiLCBcIkVpbnN0ZWxsdW5nZW5cIiwgXCJNdXNpa1wiLCBcIlNvdW5kZWZmZWt0ZVwiLCBcIlN0ZXVlcnVuZ1wiLCBcIldpc2NoZW5cIiwgXCJHcmVpZmVuICYgZHJlaGVuXCIsXG4gICAgXCJHdXQhXCIsIFwiU3VwZXIhXCIsIFwiUGVyZmVrdCFcIiwgXCJQYXVzaWVydFwiLCBcIlppZWhlbiwgdW0gZGllIFdlbHQgenUga2lwcGVuXCIsIFwiS2lwcGUgaW4gYmVpZGUgUmljaHR1bmdlblwiLCBcIlJvdCBoZWlcdTAwREZ0IEdlZmFoclwiLCBcIlN0ZWxsIHNpZSBhdWYgZGVuIEtvcGZcIiwgXCJGYWxsIG5pY2h0IHJhdXNcIixcbiAgICBcIldlbHQgZ2VzY2hhZmZ0IVwiLCBcIkR1IGhhc3QgYWxsZSBMZXZlbCBnZXNjaGFmZnQuIFdlaXRlcmUgV2VsdGVuIGtvbW1lbiBcdTIwMTMgaG9sIGRpciBub2NoIDMgU3Rlcm5lIVwiLCBcIkVkZWxzdGVpbmUgeDJcIiwgXCJHZXJhZGUga2VpbmUgV2VyYnVuZyBkYVwiLCBcIkRpZXNlcyBHZXJcdTAwRTR0IGthbm4ga2VpbmUgM0QtR3JhZmlrIGFuemVpZ2VuLlwiLCBcIlNjaGxpZVx1MDBERmVuXCIsIFwiQlx1MDBFNGxsZVwiLCBcIlRpcHBcIiwgXCJMZXZlbCBcdTAwRkNiZXJzcHJpbmdlblwiLCBcIlp1IHdlbmlnIEVkZWxzdGVpbmVcIiwgXCJBa3RpdlwiLFxuICAgIFwiR2VsYmUgRmVsZGVyIHNjaGxldWRlcm4gZGljaFwiLCBcIkZhaHIgYXVmIGRlbSBCbG9jayBtaXRcIiwgXCJXZWljaCBkZXIgU1x1MDBFNGdlIGF1c1wiLCBcIkRlciBTY2hsXHUwMEZDc3NlbCBcdTAwRjZmZm5ldCBkaWUgVFx1MDBGQ3JcIiwgXCJHclx1MDBGQ25lIFRvcmUgZ2VoZW4gbnVyIGluIGVpbmUgUmljaHR1bmdcIiwgXCJXYXJ0ZSwgYmlzIGRlciBMYXNlciBhdXNnZWh0XCIsIFwiRGVyIFdpbmQgdHJcdTAwRTRndCBkaWNoXCIsIFwiUG9ydGFsZSBzaW5kIHZlcmJ1bmRlblwiXSxcbiAgZnI6IFtcIkNoYXJnZW1lbnRcdTIwMjZcIiwgXCJOaXZlYXVcIiwgXCJOaXZlYXV4XCIsIFwiU3VpdmFudFwiLCBcIlJlam91ZXJcIiwgXCJSXHUwMEU5Z2xhZ2VzXCIsIFwiTXVzaXF1ZVwiLCBcIkVmZmV0cyBzb25vcmVzXCIsIFwiQ29tbWFuZGVzXCIsIFwiR2xpc3NlclwiLCBcIlNhaXNpciBldCB0b3VybmVyXCIsXG4gICAgXCJCaWVuICFcIiwgXCJTdXBlciAhXCIsIFwiUGFyZmFpdCAhXCIsIFwiRW4gcGF1c2VcIiwgXCJHbGlzc2UgcG91ciBpbmNsaW5lciBsZSBtb25kZVwiLCBcIkluY2xpbmUgZGVzIGRldXggY1x1MDBGNHRcdTAwRTlzXCIsIFwiTGUgcm91Z2UsIGMnZXN0IGRhbmdlclwiLCBcIlJldG91cm5lLWxlXCIsIFwiTmUgdG9tYmUgcGFzXCIsXG4gICAgXCJNb25kZSB0ZXJtaW5cdTAwRTkgIVwiLCBcIlR1IGFzIGZpbmkgdG91cyBsZXMgbml2ZWF1eC4gRCdhdXRyZXMgbW9uZGVzIGFycml2ZW50IDogcmV2aWVucyBjaGVyY2hlciBsZXMgMyBcdTAwRTl0b2lsZXMgIVwiLCBcIkRvdWJsZXIgbGVzIGdlbW1lc1wiLCBcIlBhcyBkZSBwdWIgcG91ciBsJ2luc3RhbnRcIiwgXCJDZXQgYXBwYXJlaWwgbmUgcGV1dCBwYXMgYWZmaWNoZXIgbGEgM0QuXCIsIFwiRmVybWVyXCIsIFwiQmFsbGVzXCIsIFwiSW5kaWNlXCIsIFwiUGFzc2VyIGxlIG5pdmVhdVwiLCBcIlBhcyBhc3NleiBkZSBnZW1tZXNcIiwgXCJVdGlsaXNcdTAwRTllXCIsXG4gICAgXCJMZXMgZGFsbGVzIGphdW5lcyB0ZSBwcm9wdWxzZW50XCIsIFwiTW9udGUgc3VyIGxlIGJsb2MgbW9iaWxlXCIsIFwiXHUwMEM5dml0ZSBsYSBzY2llXCIsIFwiTGEgY2xcdTAwRTkgb3V2cmUgbGEgcG9ydGVcIiwgXCJMZXMgcG9ydGVzIHZlcnRlcyBzb250IFx1MDBFMCBzZW5zIHVuaXF1ZVwiLCBcIkF0dGVuZHMgcXVlIGxlIGxhc2VyIHMnXHUwMEU5dGVpZ25lXCIsIFwiTGUgdmVudCB0ZSBwb3J0ZVwiLCBcIkxlcyBwb3J0YWlscyBzb250IHJlbGlcdTAwRTlzXCJdLFxuICBpdDogW1wiQ2FyaWNhbWVudG9cdTIwMjZcIiwgXCJMaXZlbGxvXCIsIFwiTGl2ZWxsaVwiLCBcIkF2YW50aVwiLCBcIlJpcHJvdmFcIiwgXCJJbXBvc3RhemlvbmlcIiwgXCJNdXNpY2FcIiwgXCJFZmZldHRpIHNvbm9yaVwiLCBcIkNvbWFuZGlcIiwgXCJTY29ycmlcIiwgXCJBZmZlcnJhIGUgcnVvdGFcIixcbiAgICBcIkJlbmUhXCIsIFwiT3R0aW1vIVwiLCBcIlBlcmZldHRvIVwiLCBcIkluIHBhdXNhXCIsIFwiVHJhc2NpbmEgcGVyIGluY2xpbmFyZSBpbCBtb25kb1wiLCBcIkluY2xpbmEgZGEgZW50cmFtYmkgaSBsYXRpXCIsIFwiSWwgcm9zc28gXHUwMEU4IHBlcmljb2xvXCIsIFwiQ2Fwb3ZvbGdpbG9cIiwgXCJOb24gY2FkZXJlIGZ1b3JpXCIsXG4gICAgXCJNb25kbyBjb21wbGV0YXRvIVwiLCBcIkhhaSBmaW5pdG8gdHV0dGkgaSBsaXZlbGxpLiBBbHRyaSBtb25kaSBpbiBhcnJpdm86IHRvcm5hIGEgcHJlbmRlcmUgbGUgMyBzdGVsbGUhXCIsIFwiUmFkZG9wcGlhIGdlbW1lXCIsIFwiTmVzc3VuIGFubnVuY2lvIG9yYVwiLCBcIlF1ZXN0byBkaXNwb3NpdGl2byBub24gcHVcdTAwRjIgbW9zdHJhcmUgbGEgZ3JhZmljYSAzRC5cIiwgXCJDaGl1ZGlcIiwgXCJQYWxsaW5lXCIsIFwiQWl1dG9cIiwgXCJTYWx0YSBsaXZlbGxvXCIsIFwiR2VtbWUgaW5zdWZmaWNpZW50aVwiLCBcIkluIHVzb1wiLFxuICAgIFwiTGUgcGlhc3RyZSBnaWFsbGUgdGkgbGFuY2lhbm9cIiwgXCJTYWxpIHN1bCBibG9jY28gbW9iaWxlXCIsIFwiRXZpdGEgbGEgc2VnYVwiLCBcIkxhIGNoaWF2ZSBhcHJlIGxhIHBvcnRhXCIsIFwiSSBjYW5jZWxsaSB2ZXJkaSBzb25vIGEgc2Vuc28gdW5pY29cIiwgXCJBc3BldHRhIGNoZSBpbCBsYXNlciBzaSBzcGVuZ2FcIiwgXCJJbCB2ZW50byB0aSB0cmFzcG9ydGFcIiwgXCJJIHBvcnRhbGkgc29ubyBjb2xsZWdhdGlcIl0sXG4gIGphOiBbXCJcdThBQURcdTMwN0ZcdThGQkNcdTMwN0ZcdTRFMkRcdTIwMjZcIiwgXCJcdTMwRUNcdTMwRDlcdTMwRUJcIiwgXCJcdTMwRUNcdTMwRDlcdTMwRUJcdTRFMDBcdTg5QTdcIiwgXCJcdTZCMjFcdTMwNzhcIiwgXCJcdTMwRUFcdTMwQzhcdTMwRTlcdTMwQTRcIiwgXCJcdThBMkRcdTVCOUFcIiwgXCJcdTk3RjNcdTY5N0RcIiwgXCJcdTUyQjlcdTY3OUNcdTk3RjNcIiwgXCJcdTY0Q0RcdTRGNUNcIiwgXCJcdTMwQjlcdTMwRUZcdTMwQTRcdTMwRDdcIiwgXCJcdTMwNjRcdTMwNEJcdTMwOTNcdTMwNjdcdTU2REVcdTMwNTlcIixcbiAgICBcIlx1MzA0NFx1MzA0NFx1MzA2RFx1RkYwMVwiLCBcIlx1MzA1OVx1MzA1NFx1MzA0NFx1RkYwMVwiLCBcIlx1MzBEMVx1MzBGQ1x1MzBENVx1MzBBN1x1MzBBRlx1MzBDOFx1RkYwMVwiLCBcIlx1NEUwMFx1NjY0Mlx1NTA1Q1x1NkI2Mlx1NEUyRFwiLCBcIlx1MzBDOVx1MzBFOVx1MzBDM1x1MzBCMFx1MzA1N1x1MzA2Nlx1NEUxNlx1NzU0Q1x1MzA5Mlx1NTBCRVx1MzA1MVx1MzA4OFx1MzA0NlwiLCBcIlx1NURFNlx1NTNGM1x1MzA2OVx1MzA2MVx1MzA4OVx1MzA2Qlx1MzA4Mlx1NTBCRVx1MzA1MVx1MzA4OFx1MzA0NlwiLCBcIlx1OEQ2NFx1MzA2Rlx1NTM3MVx1OTY3QVx1RkYwMVwiLCBcIlx1MzA1NVx1MzA0Qlx1MzA1NVx1MzA3RVx1MzA2Qlx1MzA1N1x1MzA4OFx1MzA0NlwiLCBcIlx1ODQzRFx1MzA2MVx1MzA2QVx1MzA0NFx1MzA4OFx1MzA0Nlx1MzA2QlwiLFxuICAgIFwiXHUzMEVGXHUzMEZDXHUzMEVCXHUzMEM5XHUzMEFGXHUzMEVBXHUzMEEyXHVGRjAxXCIsIFwiXHUzMDU5XHUzMDc5XHUzMDY2XHUzMDZFXHUzMEVDXHUzMEQ5XHUzMEVCXHUzMDkyXHUzMEFGXHUzMEVBXHUzMEEyXHVGRjAxXHU2NUIwXHUzMDU3XHUzMDQ0XHUzMEVGXHUzMEZDXHUzMEVCXHUzMEM5XHUzMDgyXHU2RTk2XHU1MDk5XHU0RTJEXHUzMDAyXHU2NjFGM1x1MzA2NFx1MzA5Mlx1NzZFRVx1NjMwN1x1MzA1RFx1MzA0Nlx1RkYwMVwiLCBcIlx1MzBCOFx1MzBBN1x1MzBFMDJcdTUwMERcIiwgXCJcdTRFQ0FcdTMwNkZcdTVFODNcdTU0NEFcdTMwNENcdTMwNDJcdTMwOEFcdTMwN0VcdTMwNUJcdTMwOTNcIiwgXCJcdTMwNTNcdTMwNkVcdTdBRUZcdTY3MkJcdTMwNjdcdTMwNkYzRFx1MzA5Mlx1ODg2OFx1NzkzQVx1MzA2N1x1MzA0RFx1MzA3RVx1MzA1Qlx1MzA5M1x1MzAwMlwiLCBcIlx1OTU4OVx1MzA1OFx1MzA4QlwiLCBcIlx1MzBEQ1x1MzBGQ1x1MzBFQlwiLCBcIlx1MzBEMlx1MzBGM1x1MzBDOFwiLCBcIlx1MzBCOVx1MzBBRFx1MzBDM1x1MzBEN1wiLCBcIlx1MzBCOFx1MzBBN1x1MzBFMFx1MzA0Q1x1OERCM1x1MzA4QVx1MzA3RVx1MzA1Qlx1MzA5M1wiLCBcIlx1NEY3Rlx1NzUyOFx1NEUyRFwiLFxuICAgIFwiXHU5RUM0XHU4MjcyXHUzMDZFXHUzMEQxXHUzMEMzXHUzMEM5XHUzMDY3XHUzMEI4XHUzMEUzXHUzMEYzXHUzMEQ3XCIsIFwiXHU1MkQ1XHUzMDRGXHUzMEQ2XHUzMEVEXHUzMEMzXHUzMEFGXHUzMDZCXHU0RTU3XHUzMDhEXHUzMDQ2XCIsIFwiXHUzMENFXHUzMEIzXHUzMEFFXHUzMEVBXHUzMDkyXHUzMDg4XHUzMDUxXHUzMDg4XHUzMDQ2XCIsIFwiXHUzMEFCXHUzMEFFXHUzMDY3XHUzMEM5XHUzMEEyXHUzMDRDXHU5NThCXHUzMDRGXCIsIFwiXHU3REQxXHUzMDZFXHUzMEIyXHUzMEZDXHUzMEM4XHUzMDZGXHU0RTAwXHU2NUI5XHU5MDFBXHU4ODRDXCIsIFwiXHUzMEVDXHUzMEZDXHUzMEI2XHUzMEZDXHUzMDRDXHU2RDg4XHUzMDQ4XHUzMDhCXHUzMDdFXHUzMDY3XHU1Rjg1XHUzMDY4XHUzMDQ2XCIsIFwiXHU5OEE4XHUzMDZCXHU0RTU3XHUzMDhEXHUzMDQ2XCIsIFwiXHUzMEREXHUzMEZDXHUzMEJGXHUzMEVCXHUzMDZGXHUzMDY0XHUzMDZBXHUzMDRDXHUzMDYzXHUzMDY2XHUzMDQ0XHUzMDhCXCJdLFxuICB0cjogW1wiWVx1MDBGQ2tsZW5peW9yXHUyMDI2XCIsIFwiQlx1MDBGNmxcdTAwRkNtXCIsIFwiQlx1MDBGNmxcdTAwRkNtbGVyXCIsIFwiXHUwMTMwbGVyaVwiLCBcIlRla3JhclwiLCBcIkF5YXJsYXJcIiwgXCJNXHUwMEZDemlrXCIsIFwiU2VzIGVmZWt0bGVyaVwiLCBcIktvbnRyb2xsZXJcIiwgXCJLYXlkXHUwMTMxclwiLCBcIlR1dCB2ZSBcdTAwRTdldmlyXCIsXG4gICAgXCJHXHUwMEZDemVsIVwiLCBcIkhhcmlrYSFcIiwgXCJNXHUwMEZDa2VtbWVsIVwiLCBcIkR1cmFrbGF0XHUwMTMxbGRcdTAxMzFcIiwgXCJEXHUwMEZDbnlheVx1MDEzMSBlXHUwMTFGbWVrIGlcdTAwRTdpbiBzXHUwMEZDclx1MDBGQ2tsZVwiLCBcIlx1MDEzMGtpIHlcdTAwRjZuZSBkZSBlXHUwMTFGXCIsIFwiS1x1MDEzMXJtXHUwMTMxelx1MDEzMSB0ZWhsaWtlZGlyXCIsIFwiQmFcdTAxNUYgYVx1MDE1RmFcdTAxMUZcdTAxMzEgXHUwMEU3ZXZpclwiLCBcIkRcdTAxMzFcdTAxNUZhclx1MDEzMSBkXHUwMEZDXHUwMTVGbWVcIixcbiAgICBcIkRcdTAwRkNueWEgdGFtYW1sYW5kXHUwMTMxIVwiLCBcIlRcdTAwRkNtIGJcdTAwRjZsXHUwMEZDbWxlcmkgYml0aXJkaW4uIFllbmkgZFx1MDBGQ255YWxhciB5b2xkYTogMyB5XHUwMTMxbGRcdTAxMzF6IGlcdTAwRTdpbiBnZXJpIGRcdTAwRjZuIVwiLCBcIkVsbWFzbGFyXHUwMTMxIGlraXllIGthdGxhXCIsIFwiXHUwMTVFdSBhbiByZWtsYW0geW9rXCIsIFwiQnUgY2loYXogM0QgZ3JhZmlrIGdcdTAwRjZzdGVyZW1peW9yLlwiLCBcIkthcGF0XCIsIFwiVG9wbGFyXCIsIFwiXHUwMTMwcHVjdVwiLCBcIkJcdTAwRjZsXHUwMEZDbVx1MDBGQyBnZVx1MDBFN1wiLCBcIllldGVybGkgZWxtYXMgeW9rXCIsIFwiS3VsbGFuXHUwMTMxbWRhXCIsXG4gICAgXCJTYXJcdTAxMzEgcGVkbGVyIHNlbmkgZlx1MDEzMXJsYXRcdTAxMzFyXCIsIFwiSGFyZWtldGxpIGJsb1x1MDExRmEgYmluXCIsIFwiVGVzdGVyZWRlbiBrYVx1MDBFN1wiLCBcIkFuYWh0YXIga2FwXHUwMTMxeVx1MDEzMSBhXHUwMEU3YXJcIiwgXCJZZVx1MDE1RmlsIGthcFx1MDEzMWxhciB0ZWsgeVx1MDBGNm5sXHUwMEZDZFx1MDBGQ3JcIiwgXCJMYXplcmluIHNcdTAwRjZubWVzaW5pIGJla2xlXCIsIFwiUlx1MDBGQ3pnXHUwMEUyciBzZW5pIHRhXHUwMTVGXHUwMTMxclwiLCBcIlBvcnRhbGxhciBiaXJiaXJpbmUgYmFcdTAxMUZsXHUwMTMxXCJdLFxuICBpZDogW1wiTWVtdWF0XHUyMDI2XCIsIFwiTGV2ZWxcIiwgXCJMZXZlbFwiLCBcIkxhbmp1dFwiLCBcIlVsYW5naVwiLCBcIlBlbmdhdHVyYW5cIiwgXCJNdXNpa1wiLCBcIkVmZWsgc3VhcmFcIiwgXCJLb250cm9sXCIsIFwiR2VzZXJcIiwgXCJQZWdhbmcgJiBwdXRhclwiLFxuICAgIFwiQmFndXMhXCIsIFwiSGViYXQhXCIsIFwiU2VtcHVybmEhXCIsIFwiRGlqZWRhXCIsIFwiU2VyZXQgdW50dWsgbWVtaXJpbmdrYW4gZHVuaWFcIiwgXCJNaXJpbmdrYW4ga2UgZHVhIGFyYWhcIiwgXCJNZXJhaCBiZXJhcnRpIGJhaGF5YVwiLCBcIkJhbGlra2FuIGR1bmlhbnlhXCIsIFwiSmFuZ2FuIHNhbXBhaSBqYXR1aFwiLFxuICAgIFwiRHVuaWEgc2VsZXNhaSFcIiwgXCJLYW11IG1lbmFtYXRrYW4gc2VtdWEgbGV2ZWwuIER1bmlhIGJhcnUgc2VnZXJhIGhhZGlyOiBrZW1iYWxpIHVudHVrIDMgYmludGFuZyFcIiwgXCJHYW5kYWthbiBwZXJtYXRhXCIsIFwiQmVsdW0gYWRhIGlrbGFuIHNhYXQgaW5pXCIsIFwiUGVyYW5na2F0IGluaSB0aWRhayBiaXNhIG1lbmFtcGlsa2FuIGdyYWZpayAzRC5cIiwgXCJUdXR1cFwiLCBcIkJvbGFcIiwgXCJQZXR1bmp1a1wiLCBcIkxld2F0aSBsZXZlbFwiLCBcIlBlcm1hdGEga3VyYW5nXCIsIFwiRGlwYWthaVwiLFxuICAgIFwiQmFudGFsYW4ga3VuaW5nIG1lbG9udGFya2FubXVcIiwgXCJOYWlraSBiYWxvayBiZXJnZXJha1wiLCBcIkhpbmRhcmkgZ2VyZ2FqaVwiLCBcIkt1bmNpIG1lbWJ1a2EgcGludHVcIiwgXCJHZXJiYW5nIGhpamF1IGhhbnlhIHNhdHUgYXJhaFwiLCBcIlR1bmdndSBsYXNlcm55YSBwYWRhbVwiLCBcIkFuZ2luIG1lbWJhd2FtdVwiLCBcIlBvcnRhbCBzYWxpbmcgdGVyaHVidW5nXCJdLFxuICBoaTogW1wiXHUwOTMyXHUwOTRCXHUwOTIxIFx1MDkzOVx1MDk0QiBcdTA5MzBcdTA5MzlcdTA5M0UgXHUwOTM5XHUwOTQ4XHUyMDI2XCIsIFwiXHUwOTMyXHUwOTQ3XHUwOTM1XHUwOTMyXCIsIFwiXHUwOTMyXHUwOTQ3XHUwOTM1XHUwOTMyXCIsIFwiXHUwOTA2XHUwOTE3XHUwOTQ3XCIsIFwiXHUwOTJCXHUwOTNGXHUwOTMwIFx1MDkzOFx1MDk0N1wiLCBcIlx1MDkzOFx1MDk0N1x1MDkxRlx1MDkzRlx1MDkwMlx1MDkxN1x1MDk0RFx1MDkzOFwiLCBcIlx1MDkzOFx1MDkwMlx1MDkxN1x1MDk0MFx1MDkyNFwiLCBcIlx1MDkyN1x1MDk0RFx1MDkzNVx1MDkyOFx1MDkzRiBcdTA5MkFcdTA5NERcdTA5MzBcdTA5MkRcdTA5M0VcdTA5MzVcIiwgXCJcdTA5MTVcdTA5MDJcdTA5MUZcdTA5NERcdTA5MzBcdTA5NEJcdTA5MzJcIiwgXCJcdTA5MzhcdTA5NERcdTA5MzVcdTA5M0VcdTA5MDdcdTA5MkFcIiwgXCJcdTA5MkFcdTA5MTVcdTA5MjFcdTA5M0NcdTA5NEIgXHUwOTE0XHUwOTMwIFx1MDkxOFx1MDk0MVx1MDkyRVx1MDkzRVx1MDkxM1wiLFxuICAgIFwiXHUwOTJDXHUwOTIyXHUwOTNDXHUwOTNGXHUwOTJGXHUwOTNFIVwiLCBcIlx1MDkzNlx1MDkzRVx1MDkyOFx1MDkyNlx1MDkzRVx1MDkzMCFcIiwgXCJcdTA5MkFcdTA5MzBcdTA5MkJcdTA5M0NcdTA5NDdcdTA5MTVcdTA5NERcdTA5MUYhXCIsIFwiXHUwOTMwXHUwOTQxXHUwOTE1XHUwOTNFIFx1MDkzOVx1MDk0MVx1MDkwNlwiLCBcIlx1MDkyNlx1MDk0MVx1MDkyOFx1MDkzRlx1MDkyRlx1MDkzRSBcdTA5MURcdTA5NDFcdTA5MTVcdTA5M0VcdTA5MjhcdTA5NDcgXHUwOTE1XHUwOTQ3IFx1MDkzMlx1MDkzRlx1MDkwRiBcdTA5MTZcdTA5NDBcdTA5MDJcdTA5MUFcdTA5NEJcIiwgXCJcdTA5MjZcdTA5NEJcdTA5MjhcdTA5NEJcdTA5MDIgXHUwOTI0XHUwOTMwXHUwOTJCXHUwOTNDIFx1MDkxRFx1MDk0MVx1MDkxNVx1MDkzRVx1MDkxM1wiLCBcIlx1MDkzMlx1MDkzRVx1MDkzMiBcdTA5MkVcdTA5MjRcdTA5MzJcdTA5MkMgXHUwOTE2XHUwOTNDXHUwOTI0XHUwOTMwXHUwOTNFXCIsIFwiXHUwOTA3XHUwOTM4XHUwOTQ3IFx1MDkwOVx1MDkzMlx1MDk0RFx1MDkxRlx1MDkzRSBcdTA5MTVcdTA5MzAgXHUwOTI2XHUwOTRCXCIsIFwiXHUwOTJDXHUwOTNFXHUwOTM5XHUwOTMwIFx1MDkyRVx1MDkyNCBcdTA5MTdcdTA5M0ZcdTA5MzBcdTA5MjhcdTA5M0VcIixcbiAgICBcIlx1MDkyNlx1MDk0MVx1MDkyOFx1MDkzRlx1MDkyRlx1MDkzRSBcdTA5MkFcdTA5NDJcdTA5MzBcdTA5NDAhXCIsIFwiXHUwOTI0XHUwOTQxXHUwOTJFXHUwOTI4XHUwOTQ3IFx1MDkzOFx1MDkzRVx1MDkzMFx1MDk0NyBcdTA5MzJcdTA5NDdcdTA5MzVcdTA5MzIgXHUwOTJBXHUwOTQyXHUwOTMwXHUwOTQ3IFx1MDkxNVx1MDkzMCBcdTA5MzJcdTA5M0ZcdTA5MEZcdTA5NjQgXHUwOTI4XHUwOTA4IFx1MDkyNlx1MDk0MVx1MDkyOFx1MDkzRlx1MDkyRlx1MDkzRSBcdTA5MDYgXHUwOTMwXHUwOTM5XHUwOTQwIFx1MDkzOVx1MDk0OFx1MDkwMiBcdTIwMTQgMyBcdTA5MzhcdTA5NERcdTA5MUZcdTA5M0VcdTA5MzAgXHUwOTE1XHUwOTQ3IFx1MDkzMlx1MDkzRlx1MDkwRiBcdTA5MzVcdTA5M0VcdTA5MkFcdTA5MzggXHUwOTA2XHUwOTEzIVwiLCBcIlx1MDkzMFx1MDkyNFx1MDk0RFx1MDkyOCBcdTA5MjZcdTA5NEJcdTA5MTdcdTA5NDFcdTA5MjhcdTA5NDcgXHUwOTE1XHUwOTMwXHUwOTRCXCIsIFwiXHUwOTA1XHUwOTJEXHUwOTQwIFx1MDkxNVx1MDk0Qlx1MDkwOCBcdTA5MzVcdTA5M0ZcdTA5MUNcdTA5NERcdTA5MUVcdTA5M0VcdTA5MkFcdTA5MjggXHUwOTI4XHUwOTM5XHUwOTQwXHUwOTAyIFx1MDkzOVx1MDk0OFwiLCBcIlx1MDkyRlx1MDkzOSBcdTA5MjFcdTA5M0ZcdTA5MzVcdTA5M0VcdTA5MDdcdTA5MzggM0QgXHUwOTE3XHUwOTREXHUwOTMwXHUwOTNFXHUwOTJCXHUwOTNDXHUwOTNGXHUwOTE1XHUwOTREXHUwOTM4IFx1MDkyOFx1MDkzOVx1MDk0MFx1MDkwMiBcdTA5MjZcdTA5M0ZcdTA5MTZcdTA5M0UgXHUwOTM4XHUwOTE1XHUwOTI0XHUwOTNFXHUwOTY0XCIsIFwiXHUwOTJDXHUwOTAyXHUwOTI2IFx1MDkxNVx1MDkzMFx1MDk0N1x1MDkwMlwiLCBcIlx1MDkxN1x1MDk0N1x1MDkwMlx1MDkyNlx1MDk0N1x1MDkwMlwiLCBcIlx1MDkzOFx1MDkwMlx1MDkxNVx1MDk0N1x1MDkyNFwiLCBcIlx1MDkzMlx1MDk0N1x1MDkzNVx1MDkzMiBcdTA5MUJcdTA5NEJcdTA5MjFcdTA5M0NcdTA5NEJcIiwgXCJcdTA5MzBcdTA5MjRcdTA5NERcdTA5MjggXHUwOTE1XHUwOTJFIFx1MDkzOVx1MDk0OFx1MDkwMlwiLCBcIlx1MDkxQVx1MDkzRVx1MDkzMlx1MDk0MlwiLFxuICAgIFwiXHUwOTJBXHUwOTQwXHUwOTMyXHUwOTQ3IFx1MDkyQVx1MDk0OFx1MDkyMSBcdTA5MjRcdTA5NDFcdTA5MkVcdTA5NERcdTA5MzlcdTA5NDdcdTA5MDIgXHUwOTA5XHUwOTFCXHUwOTNFXHUwOTMyXHUwOTI0XHUwOTQ3IFx1MDkzOVx1MDk0OFx1MDkwMlwiLCBcIlx1MDkxQVx1MDkzMlx1MDkyNFx1MDk0NyBcdTA5MkNcdTA5NERcdTA5MzJcdTA5NDlcdTA5MTUgXHUwOTJBXHUwOTMwIFx1MDkzOFx1MDkzNVx1MDkzRVx1MDkzMCBcdTA5MzlcdTA5NEIgXHUwOTFDXHUwOTNFXHUwOTEzXCIsIFwiXHUwOTA2XHUwOTMwXHUwOTQwIFx1MDkzOFx1MDk0NyBcdTA5MkNcdTA5MUFcdTA5NEJcIiwgXCJcdTA5MUFcdTA5M0VcdTA5MkNcdTA5NDAgXHUwOTM4XHUwOTQ3IFx1MDkyNlx1MDkzMFx1MDkzNVx1MDkzRVx1MDkxQ1x1MDkzQ1x1MDkzRSBcdTA5MTZcdTA5NDFcdTA5MzJcdTA5MjRcdTA5M0UgXHUwOTM5XHUwOTQ4XCIsIFwiXHUwOTM5XHUwOTMwXHUwOTQ3IFx1MDkxN1x1MDk0N1x1MDkxRiBcdTA5MEZcdTA5MTUgXHUwOTM5XHUwOTQwIFx1MDkyNFx1MDkzMFx1MDkyQlx1MDkzQyBcdTA5MTZcdTA5NDFcdTA5MzJcdTA5MjRcdTA5NDcgXHUwOTM5XHUwOTQ4XHUwOTAyXCIsIFwiXHUwOTMyXHUwOTQ3XHUwOTFDXHUwOTNDXHUwOTMwIFx1MDkyQ1x1MDk0MVx1MDkxRFx1MDkyOFx1MDk0NyBcdTA5MTVcdTA5M0UgXHUwOTA3XHUwOTAyXHUwOTI0XHUwOTFDXHUwOTNDXHUwOTNFXHUwOTMwIFx1MDkxNVx1MDkzMFx1MDk0QlwiLCBcIlx1MDkzOVx1MDkzNVx1MDkzRSBcdTA5MjRcdTA5NDFcdTA5MkVcdTA5NERcdTA5MzlcdTA5NDdcdTA5MDIgXHUwOTMyXHUwOTQ3IFx1MDkxQ1x1MDkzRVx1MDkyNFx1MDk0MCBcdTA5MzlcdTA5NDhcIiwgXCJcdTA5MkFcdTA5NEJcdTA5MzBcdTA5NERcdTA5MUZcdTA5MzIgXHUwOTA2XHUwOTJBXHUwOTM4IFx1MDkyRVx1MDk0N1x1MDkwMiBcdTA5MUNcdTA5NDFcdTA5MjFcdTA5M0NcdTA5NDcgXHUwOTM5XHUwOTQ4XHUwOTAyXCJdLFxuICBydTogW1wiXHUwNDE3XHUwNDMwXHUwNDMzXHUwNDQwXHUwNDQzXHUwNDM3XHUwNDNBXHUwNDMwXHUyMDI2XCIsIFwiXHUwNDIzXHUwNDQwXHUwNDNFXHUwNDMyXHUwNDM1XHUwNDNEXHUwNDRDXCIsIFwiXHUwNDIzXHUwNDQwXHUwNDNFXHUwNDMyXHUwNDNEXHUwNDM4XCIsIFwiXHUwNDE0XHUwNDMwXHUwNDNCXHUwNDRDXHUwNDQ4XHUwNDM1XCIsIFwiXHUwNDE3XHUwNDMwXHUwNDNEXHUwNDNFXHUwNDMyXHUwNDNFXCIsIFwiXHUwNDFEXHUwNDMwXHUwNDQxXHUwNDQyXHUwNDQwXHUwNDNFXHUwNDM5XHUwNDNBXHUwNDM4XCIsIFwiXHUwNDFDXHUwNDQzXHUwNDM3XHUwNDRCXHUwNDNBXHUwNDMwXCIsIFwiXHUwNDE3XHUwNDMyXHUwNDQzXHUwNDNBXHUwNDM4XCIsIFwiXHUwNDIzXHUwNDNGXHUwNDQwXHUwNDMwXHUwNDMyXHUwNDNCXHUwNDM1XHUwNDNEXHUwNDM4XHUwNDM1XCIsIFwiXHUwNDIxXHUwNDMyXHUwNDMwXHUwNDM5XHUwNDNGXCIsIFwiXHUwNDI1XHUwNDMyXHUwNDMwXHUwNDQyXHUwNDMwXHUwNDM5IFx1MDQzOCBcdTA0M0FcdTA0NDBcdTA0NDNcdTA0NDJcdTA0MzhcIixcbiAgICBcIlx1MDQxRFx1MDQzNVx1MDQzRlx1MDQzQlx1MDQzRVx1MDQ0NVx1MDQzRSFcIiwgXCJcdTA0MUVcdTA0NDJcdTA0M0JcdTA0MzhcdTA0NDdcdTA0M0RcdTA0M0UhXCIsIFwiXHUwNDE4XHUwNDM0XHUwNDM1XHUwNDMwXHUwNDNCXHUwNDRDXHUwNDNEXHUwNDNFIVwiLCBcIlx1MDQxRlx1MDQzMFx1MDQ0M1x1MDQzN1x1MDQzMFwiLCBcIlx1MDQyMlx1MDQ0Rlx1MDQzRFx1MDQzOCwgXHUwNDQ3XHUwNDQyXHUwNDNFXHUwNDMxXHUwNDRCIFx1MDQzRFx1MDQzMFx1MDQzQVx1MDQzQlx1MDQzRVx1MDQzRFx1MDQzOFx1MDQ0Mlx1MDQ0QyBcdTA0M0NcdTA0MzhcdTA0NDBcIiwgXCJcdTA0MURcdTA0MzBcdTA0M0FcdTA0M0JcdTA0M0VcdTA0M0RcdTA0NEZcdTA0MzkgXHUwNDMyIFx1MDQzRVx1MDQzMVx1MDQzNSBcdTA0NDFcdTA0NDJcdTA0M0VcdTA0NDBcdTA0M0VcdTA0M0RcdTA0NEJcIiwgXCJcdTA0MUFcdTA0NDBcdTA0MzBcdTA0NDFcdTA0M0RcdTA0M0VcdTA0MzUgXHUyMDE0IFx1MDQzRVx1MDQzRlx1MDQzMFx1MDQ0MVx1MDQzRFx1MDQzRVwiLCBcIlx1MDQxRlx1MDQzNVx1MDQ0MFx1MDQzNVx1MDQzMlx1MDQzNVx1MDQ0MFx1MDQzRFx1MDQzOCBcdTA0M0NcdTA0MzhcdTA0NDBcIiwgXCJcdTA0MURcdTA0MzUgXHUwNDMyXHUwNDRCXHUwNDNGXHUwNDMwXHUwNDM0XHUwNDM4XCIsXG4gICAgXCJcdTA0MUNcdTA0MzhcdTA0NDAgXHUwNDNGXHUwNDQwXHUwNDNFXHUwNDM5XHUwNDM0XHUwNDM1XHUwNDNEIVwiLCBcIlx1MDQyMlx1MDQ0QiBcdTA0M0ZcdTA0NDBcdTA0M0VcdTA0NDhcdTA0NTFcdTA0M0IgXHUwNDMyXHUwNDQxXHUwNDM1IFx1MDQ0M1x1MDQ0MFx1MDQzRVx1MDQzMlx1MDQzRFx1MDQzOC4gXHUwNDFEXHUwNDNFXHUwNDMyXHUwNDRCXHUwNDM1IFx1MDQzQ1x1MDQzOFx1MDQ0MFx1MDQ0QiBcdTA0NDNcdTA0MzZcdTA0MzUgXHUwNDMyIFx1MDQzRlx1MDQ0M1x1MDQ0Mlx1MDQzOCBcdTIwMTQgXHUwNDMyXHUwNDM1XHUwNDQwXHUwNDNEXHUwNDM4XHUwNDQxXHUwNDRDIFx1MDQzN1x1MDQzMCAzIFx1MDQzN1x1MDQzMlx1MDQ1MVx1MDQzN1x1MDQzNFx1MDQzMFx1MDQzQ1x1MDQzOCFcIiwgXCJcdTA0MjNcdTA0MzRcdTA0MzJcdTA0M0VcdTA0MzhcdTA0NDJcdTA0NEMgXHUwNDNBXHUwNDQwXHUwNDM4XHUwNDQxXHUwNDQyXHUwNDMwXHUwNDNCXHUwNDNCXHUwNDRCXCIsIFwiXHUwNDIxXHUwNDM1XHUwNDM5XHUwNDQ3XHUwNDMwXHUwNDQxIFx1MDQzRFx1MDQzNVx1MDQ0MiBcdTA0NDBcdTA0MzVcdTA0M0FcdTA0M0JcdTA0MzBcdTA0M0NcdTA0NEJcIiwgXCJcdTA0MkRcdTA0NDJcdTA0M0UgXHUwNDQzXHUwNDQxXHUwNDQyXHUwNDQwXHUwNDNFXHUwNDM5XHUwNDQxXHUwNDQyXHUwNDMyXHUwNDNFIFx1MDQzRFx1MDQzNSBcdTA0M0ZcdTA0M0VcdTA0MzRcdTA0MzRcdTA0MzVcdTA0NDBcdTA0MzZcdTA0MzhcdTA0MzJcdTA0MzBcdTA0MzVcdTA0NDIgM0QtXHUwNDMzXHUwNDQwXHUwNDMwXHUwNDQ0XHUwNDM4XHUwNDNBXHUwNDQzLlwiLCBcIlx1MDQxN1x1MDQzMFx1MDQzQVx1MDQ0MFx1MDQ0Qlx1MDQ0Mlx1MDQ0Q1wiLCBcIlx1MDQyOFx1MDQzMFx1MDQ0MFx1MDQ0QlwiLCBcIlx1MDQxRlx1MDQzRVx1MDQzNFx1MDQ0MVx1MDQzQVx1MDQzMFx1MDQzN1x1MDQzQVx1MDQzMFwiLCBcIlx1MDQxRlx1MDQ0MFx1MDQzRVx1MDQzRlx1MDQ0M1x1MDQ0MVx1MDQ0Mlx1MDQzOFx1MDQ0Mlx1MDQ0Q1wiLCBcIlx1MDQxRFx1MDQzNSBcdTA0NDVcdTA0MzJcdTA0MzBcdTA0NDJcdTA0MzBcdTA0MzVcdTA0NDIgXHUwNDNBXHUwNDQwXHUwNDM4XHUwNDQxXHUwNDQyXHUwNDMwXHUwNDNCXHUwNDNCXHUwNDNFXHUwNDMyXCIsIFwiXHUwNDEyXHUwNDRCXHUwNDMxXHUwNDQwXHUwNDMwXHUwNDNEXCIsXG4gICAgXCJcdTA0MTZcdTA0NTFcdTA0M0JcdTA0NDJcdTA0NEJcdTA0MzUgXHUwNDNGXHUwNDNCXHUwNDM4XHUwNDQyXHUwNDRCIFx1MDQzRlx1MDQzRVx1MDQzNFx1MDQzMVx1MDQ0MFx1MDQzMFx1MDQ0MVx1MDQ0Qlx1MDQzMlx1MDQzMFx1MDQ0RVx1MDQ0MlwiLCBcIlx1MDQxRlx1MDQ0MFx1MDQzRVx1MDQzQVx1MDQzMFx1MDQ0Mlx1MDQzOFx1MDQ0MVx1MDQ0QyBcdTA0M0RcdTA0MzAgXHUwNDNGXHUwNDNCXHUwNDMwXHUwNDQyXHUwNDQ0XHUwNDNFXHUwNDQwXHUwNDNDXHUwNDM1XCIsIFwiXHUwNDExXHUwNDM1XHUwNDQwXHUwNDM1XHUwNDMzXHUwNDM4XHUwNDQxXHUwNDRDIFx1MDQzRlx1MDQzOFx1MDQzQlx1MDQ0QlwiLCBcIlx1MDQxQVx1MDQzQlx1MDQ0RVx1MDQ0NyBcdTA0M0VcdTA0NDJcdTA0M0FcdTA0NDBcdTA0NEJcdTA0MzJcdTA0MzBcdTA0MzVcdTA0NDIgXHUwNDM0XHUwNDMyXHUwNDM1XHUwNDQwXHUwNDRDXCIsIFwiXHUwNDE3XHUwNDM1XHUwNDNCXHUwNDUxXHUwNDNEXHUwNDRCXHUwNDM1IFx1MDQzMlx1MDQzRVx1MDQ0MFx1MDQzRVx1MDQ0Mlx1MDQzMCBcdTIwMTQgXHUwNDMyIFx1MDQzRVx1MDQzNFx1MDQzRFx1MDQ0MyBcdTA0NDFcdTA0NDJcdTA0M0VcdTA0NDBcdTA0M0VcdTA0M0RcdTA0NDNcIiwgXCJcdTA0MTRcdTA0M0VcdTA0MzZcdTA0MzRcdTA0MzhcdTA0NDFcdTA0NEMsIFx1MDQzRlx1MDQzRVx1MDQzQVx1MDQzMCBcdTA0M0JcdTA0MzBcdTA0MzdcdTA0MzVcdTA0NDAgXHUwNDNGXHUwNDNFXHUwNDMzXHUwNDMwXHUwNDQxXHUwNDNEXHUwNDM1XHUwNDQyXCIsIFwiXHUwNDEyXHUwNDM1XHUwNDQyXHUwNDM1XHUwNDQwIFx1MDQzRFx1MDQzNVx1MDQ0MVx1MDQ1MVx1MDQ0MiBcdTA0NDJcdTA0MzVcdTA0MzFcdTA0NEZcIiwgXCJcdTA0MUZcdTA0M0VcdTA0NDBcdTA0NDJcdTA0MzBcdTA0M0JcdTA0NEIgXHUwNDQxXHUwNDMyXHUwNDRGXHUwNDM3XHUwNDMwXHUwNDNEXHUwNDRCXCJdLFxuICB2aTogW1wiXHUwMTEwYW5nIHRcdTFFQTNpXHUyMDI2XCIsIFwiTVx1MDBFMG5cIiwgXCJNXHUwMEUwbiBjaFx1MDFBMWlcIiwgXCJUaVx1MUVCRnBcIiwgXCJDaFx1MDFBMWkgbFx1MUVBMWlcIiwgXCJDXHUwMEUwaSBcdTAxMTFcdTFFQjd0XCIsIFwiTmhcdTFFQTFjXCIsIFwiSGlcdTFFQzd1IFx1MUVFOW5nIFx1MDBFMm0gdGhhbmhcIiwgXCJcdTAxMTBpXHUxRUMxdSBraGlcdTFFQzNuXCIsIFwiVnVcdTFFRDF0XCIsIFwiR2lcdTFFRUYgdlx1MDBFMCB4b2F5XCIsXG4gICAgXCJUXHUxRUQxdCBsXHUxRUFGbSFcIiwgXCJUdXlcdTFFQzd0IHZcdTFFRERpIVwiLCBcIkhvXHUwMEUwbiBoXHUxRUEzbyFcIiwgXCJUXHUxRUExbSBkXHUxRUVCbmdcIiwgXCJLXHUwMEU5byBcdTAxMTFcdTFFQzMgbmdoaVx1MDBFQW5nIHRoXHUxRUJGIGdpXHUxRURCaVwiLCBcIk5naGlcdTAwRUFuZyBjXHUxRUEzIGhhaSBwaFx1MDBFRGFcIiwgXCJNXHUwMEUwdSBcdTAxMTFcdTFFQ0YgbFx1MDBFMCBuZ3V5IGhpXHUxRUMzbVwiLCBcIkxcdTFFQUR0IG5nXHUwMUIwXHUxRUUzYyBuXHUwMEYzIGxcdTFFQTFpXCIsIFwiXHUwMTEwXHUxRUVCbmcgclx1MDFBMWkgcmEgbmdvXHUwMEUwaVwiLFxuICAgIFwiSG9cdTAwRTBuIHRoXHUwMEUwbmggdGhcdTFFQkYgZ2lcdTFFREJpIVwiLCBcIkJcdTFFQTFuIFx1MDExMVx1MDBFMyBxdWEgbVx1MUVDRGkgbVx1MDBFMG4uIFRoXHUxRUJGIGdpXHUxRURCaSBtXHUxRURCaSBzXHUxRUFGcCByYSBtXHUxRUFGdDogcXVheSBsXHUxRUExaSBsXHUxRUE1eSAzIHNhbyBuaFx1MDBFOSFcIiwgXCJOaFx1MDBFMm4gXHUwMTExXHUwMEY0aSBuZ1x1MUVDRGNcIiwgXCJIaVx1MUVDN24gY2hcdTAxQjBhIGNcdTAwRjMgcXVcdTFFQTNuZyBjXHUwMEUxb1wiLCBcIlRoaVx1MUVCRnQgYlx1MUVDQiBuXHUwMEUweSBraFx1MDBGNG5nIGhpXHUxRUMzbiB0aFx1MUVDQiBcdTAxMTFcdTAxQjBcdTFFRTNjIFx1MDExMVx1MUVEMyBoXHUxRUNEYSAzRC5cIiwgXCJcdTAxMTBcdTAwRjNuZ1wiLCBcIkJcdTAwRjNuZ1wiLCBcIkdcdTFFRTNpIFx1MDBGRFwiLCBcIkJcdTFFQ0YgcXVhIG1cdTAwRTBuXCIsIFwiS2hcdTAwRjRuZyBcdTAxMTFcdTFFRTcgbmdcdTFFQ0RjXCIsIFwiXHUwMTEwYW5nIGRcdTAwRjluZ1wiLFxuICAgIFwiXHUwMEQ0IHZcdTAwRTBuZyBzXHUxRUJEIGJcdTFFQUZuIGJcdTFFQTFuIFx1MDExMWlcIiwgXCJDXHUwMUIwXHUxRUUxaSBraFx1MUVEMWkgZGkgY2h1eVx1MUVDM25cIiwgXCJOXHUwMEU5IGxcdTAxQjBcdTFFRTFpIGNcdTAxQjBhXCIsIFwiQ2hcdTAwRUNhIGtoXHUwMEYzYSBtXHUxRURGIGNcdTFFRURhXCIsIFwiQ1x1MUVENW5nIHhhbmggY2hcdTFFQzkgXHUwMTExaSBtXHUxRUQ5dCBjaGlcdTFFQzF1XCIsIFwiQ2hcdTFFREQgdGlhIGxhc2VyIHRcdTFFQUZ0XCIsIFwiR2lcdTAwRjMgc1x1MUVCRCBcdTAxMTFcdTAxQjBhIGJcdTFFQTFuIFx1MDExMWlcIiwgXCJIYWkgY1x1MUVENW5nIG5cdTFFRDFpIHZcdTFFREJpIG5oYXVcIl0sXG4gIHRoOiBbXCJcdTBFMDFcdTBFMzNcdTBFMjVcdTBFMzFcdTBFMDdcdTBFNDJcdTBFMkJcdTBFMjVcdTBFMTRcdTIwMjZcIiwgXCJcdTBFMTRcdTBFNDhcdTBFMzJcdTBFMTlcIiwgXCJcdTBFMTRcdTBFNDhcdTBFMzJcdTBFMTlcdTBFMTdcdTBFMzFcdTBFNDlcdTBFMDdcdTBFMkJcdTBFMjFcdTBFMTRcIiwgXCJcdTBFMTVcdTBFNDhcdTBFMkRcdTBFNDRcdTBFMUJcIiwgXCJcdTBFNDBcdTBFMjVcdTBFNDhcdTBFMTlcdTBFNDNcdTBFMkJcdTBFMjFcdTBFNDhcIiwgXCJcdTBFMTVcdTBFMzFcdTBFNDlcdTBFMDdcdTBFMDRcdTBFNDhcdTBFMzJcIiwgXCJcdTBFNDBcdTBFMUVcdTBFMjVcdTBFMDdcIiwgXCJcdTBFNDBcdTBFMkFcdTBFMzVcdTBFMjJcdTBFMDdcdTBFNDBcdTBFMkRcdTBFMUZcdTBFNDBcdTBFMUZcdTBFMDFcdTBFMTVcdTBFNENcIiwgXCJcdTBFMDFcdTBFMzJcdTBFMjNcdTBFMDRcdTBFMjdcdTBFMUFcdTBFMDRcdTBFMzhcdTBFMjFcIiwgXCJcdTBFMUJcdTBFMzFcdTBFMTRcIiwgXCJcdTBFMDhcdTBFMzFcdTBFMUFcdTBFNDFcdTBFMjVcdTBFNDlcdTBFMjdcdTBFMkJcdTBFMjFcdTBFMzhcdTBFMTlcIixcbiAgICBcIlx1MEUxNFx1MEUzNVx1MEUyMVx1MEUzMlx1MEUwMSFcIiwgXCJcdTBFNDBcdTBFMjJcdTBFMzVcdTBFNDhcdTBFMjJcdTBFMjEhXCIsIFwiXHUwRTJBXHUwRTIxXHUwRTFBXHUwRTM5XHUwRTIzXHUwRTEzXHUwRTRDXHUwRTQxXHUwRTFBXHUwRTFBIVwiLCBcIlx1MEUyQlx1MEUyMlx1MEUzOFx1MEUxNFx1MEUwQVx1MEUzMVx1MEU0OFx1MEUyN1x1MEUwNFx1MEUyM1x1MEUzMlx1MEUyN1wiLCBcIlx1MEUyNVx1MEUzMlx1MEUwMVx1MEU0MFx1MEUxRVx1MEUzN1x1MEU0OFx1MEUyRFx1MEU0MFx1MEUyRFx1MEUzNVx1MEUyMlx1MEUwN1x1MEU0Mlx1MEUyNVx1MEUwMVwiLCBcIlx1MEU0MFx1MEUyRFx1MEUzNVx1MEUyMlx1MEUwN1x1MEU0NFx1MEUxNFx1MEU0OVx1MEUxN1x1MEUzMVx1MEU0OVx1MEUwN1x1MEUyQVx1MEUyRFx1MEUwN1x1MEUxN1x1MEUzMlx1MEUwN1wiLCBcIlx1MEUyQVx1MEUzNVx1MEU0MVx1MEUxNFx1MEUwN1x1MEUwNFx1MEUzN1x1MEUyRFx1MEUyRFx1MEUzMVx1MEUxOVx1MEUxNVx1MEUyM1x1MEUzMlx1MEUyMlwiLCBcIlx1MEUxRVx1MEUyNVx1MEUzNFx1MEUwMVx1MEUwMVx1MEUyNVx1MEUzMVx1MEUxQVx1MEUyQlx1MEUzMVx1MEUyN1x1MEU0MFx1MEUyNVx1MEUyMlwiLCBcIlx1MEUyRFx1MEUyMlx1MEU0OFx1MEUzMlx1MEUxNVx1MEUwMVx1MEUyRFx1MEUyRFx1MEUwMVx1MEU0NFx1MEUxQlwiLFxuICAgIFwiXHUwRTFDXHUwRTQ4XHUwRTMyXHUwRTE5XHUwRTQyXHUwRTI1XHUwRTAxXHUwRTE5XHUwRTM1XHUwRTQ5XHUwRTQxXHUwRTI1XHUwRTQ5XHUwRTI3IVwiLCBcIlx1MEUwNFx1MEUzOFx1MEUxM1x1MEUxQ1x1MEU0OFx1MEUzMlx1MEUxOVx1MEUwNFx1MEUyM1x1MEUxQVx1MEUxN1x1MEUzOFx1MEUwMVx1MEUxNFx1MEU0OFx1MEUzMlx1MEUxOVx1MEU0MVx1MEUyNVx1MEU0OVx1MEUyNyBcdTBFNDJcdTBFMjVcdTBFMDFcdTBFNDNcdTBFMkJcdTBFMjFcdTBFNDhcdTBFMDFcdTBFMzNcdTBFMjVcdTBFMzFcdTBFMDdcdTBFMjFcdTBFMzIgXHUwRTAxXHUwRTI1XHUwRTMxXHUwRTFBXHUwRTIxXHUwRTMyXHUwRTQwXHUwRTAxXHUwRTQ3XHUwRTFBIDMgXHUwRTE0XHUwRTMyXHUwRTI3XHUwRTAxXHUwRTMxXHUwRTE5IVwiLCBcIlx1MEU0MFx1MEUxRVx1MEUwQVx1MEUyMyB4MlwiLCBcIlx1MEUxNVx1MEUyRFx1MEUxOVx1MEUxOVx1MEUzNVx1MEU0OVx1MEUyMlx1MEUzMVx1MEUwN1x1MEU0NFx1MEUyMVx1MEU0OFx1MEUyMVx1MEUzNVx1MEU0Mlx1MEUwNlx1MEUyOVx1MEUxM1x1MEUzMlwiLCBcIlx1MEUyRFx1MEUzOFx1MEUxQlx1MEUwMVx1MEUyM1x1MEUxM1x1MEU0Q1x1MEUxOVx1MEUzNVx1MEU0OVx1MEU0MVx1MEUyQVx1MEUxNFx1MEUwN1x1MEUwMVx1MEUyM1x1MEUzMlx1MEUxRlx1MEUzNFx1MEUwMSAzRCBcdTBFNDRcdTBFMjFcdTBFNDhcdTBFNDRcdTBFMTRcdTBFNDlcIiwgXCJcdTBFMUJcdTBFMzRcdTBFMTRcIiwgXCJcdTBFMjVcdTBFMzlcdTBFMDFcdTBFMUFcdTBFMkRcdTBFMjVcIiwgXCJcdTBFMDRcdTBFMzNcdTBFNDNcdTBFMUFcdTBFNDlcIiwgXCJcdTBFMDJcdTBFNDlcdTBFMzJcdTBFMjFcdTBFMTRcdTBFNDhcdTBFMzJcdTBFMTlcIiwgXCJcdTBFNDBcdTBFMUVcdTBFMEFcdTBFMjNcdTBFNDRcdTBFMjFcdTBFNDhcdTBFMUVcdTBFMkRcIiwgXCJcdTBFNDNcdTBFMEFcdTBFNDlcdTBFMkRcdTBFMjJcdTBFMzlcdTBFNDhcIixcbiAgICBcIlx1MEU0MVx1MEUxQ1x1MEU0OFx1MEUxOVx1MEUyQVx1MEUzNVx1MEU0MFx1MEUyQlx1MEUyNVx1MEUzN1x1MEUyRFx1MEUwN1x1MEUwOFx1MEUzMFx1MEUxNFx1MEUzNVx1MEUxNFx1MEUwNFx1MEUzOFx1MEUxM1wiLCBcIlx1MEUwMlx1MEUzNlx1MEU0OVx1MEUxOVx1MEU0NFx1MEUxQlx1MEUxQVx1MEUxOVx1MEUxQVx1MEUyNVx1MEU0N1x1MEUyRFx1MEUwMVx1MEUxN1x1MEUzNVx1MEU0OFx1MEU0MFx1MEUwNFx1MEUyNVx1MEUzN1x1MEU0OFx1MEUyRFx1MEUxOVx1MEUxN1x1MEUzNVx1MEU0OFwiLCBcIlx1MEUyQlx1MEUyNVx1MEUxQVx1MEU0M1x1MEUxQVx1MEU0MFx1MEUyNVx1MEUzN1x1MEU0OFx1MEUyRFx1MEUyMlwiLCBcIlx1MEUwMVx1MEUzOFx1MEUwRFx1MEU0MVx1MEUwOFx1MEU0MFx1MEUxQlx1MEUzNFx1MEUxNFx1MEUxQlx1MEUyM1x1MEUzMFx1MEUxNVx1MEUzOVwiLCBcIlx1MEUxQlx1MEUyM1x1MEUzMFx1MEUxNVx1MEUzOVx1MEUyQVx1MEUzNVx1MEU0MFx1MEUwMlx1MEUzNVx1MEUyMlx1MEUyN1x1MEUxQ1x1MEU0OFx1MEUzMlx1MEUxOVx1MEU0NFx1MEUxNFx1MEU0OVx1MEUxN1x1MEUzMlx1MEUwN1x1MEU0MFx1MEUxNFx1MEUzNVx1MEUyMlx1MEUyN1wiLCBcIlx1MEUyM1x1MEUyRFx1MEU0M1x1MEUyQlx1MEU0OVx1MEU0MFx1MEUyNVx1MEU0MFx1MEUwQlx1MEUyRFx1MEUyM1x1MEU0Q1x1MEUxNFx1MEUzMVx1MEUxQVx1MEUwMVx1MEU0OFx1MEUyRFx1MEUxOVwiLCBcIlx1MEUyNVx1MEUyMVx1MEUwOFx1MEUzMFx1MEUxRVx1MEUzMlx1MEUwNFx1MEUzOFx1MEUxM1x1MEU0NFx1MEUxQlwiLCBcIlx1MEUxRVx1MEUyRFx1MEUyM1x1MEU0Q1x1MEUxN1x1MEUzMVx1MEUyNVx1MEU0MFx1MEUwQVx1MEUzN1x1MEU0OFx1MEUyRFx1MEUyMVx1MEUxNlx1MEUzNlx1MEUwN1x1MEUwMVx1MEUzMVx1MEUxOVwiXSxcbiAgcGw6IFtcIldjenl0eXdhbmllXHUyMDI2XCIsIFwiUG96aW9tXCIsIFwiUG96aW9teVwiLCBcIkRhbGVqXCIsIFwiSmVzemN6ZSByYXpcIiwgXCJVc3Rhd2llbmlhXCIsIFwiTXV6eWthXCIsIFwiRWZla3R5XCIsIFwiU3Rlcm93YW5pZVwiLCBcIlByemVzdXdhbmllXCIsIFwiWlx1MDE0MmFwIGkgb2JyXHUwMEYzXHUwMTA3XCIsXG4gICAgXCJOaWVcdTAxN0FsZSFcIiwgXCJcdTAxNUF3aWV0bmllIVwiLCBcIklkZWFsbmllIVwiLCBcIlBhdXphXCIsIFwiUHJ6ZWNpXHUwMTA1Z25paiwgYnkgcHJ6ZWNoeWxpXHUwMTA3IFx1MDE1QndpYXRcIiwgXCJQcnplY2h5bGFqIHcgb2JpZSBzdHJvbnlcIiwgXCJDemVyd29uZSB6bmFjenkgZ3JvXHUwMTdBbmVcIiwgXCJPZHdyXHUwMEYzXHUwMTA3IGdvIGRvIGdcdTAwRjNyeSBub2dhbWlcIiwgXCJOaWUgd3lwYWRuaWpcIixcbiAgICBcIlx1MDE1QXdpYXQgdWtvXHUwMTQ0Y3pvbnkhXCIsIFwiV3N6eXN0a2llIHBvemlvbXkgemEgdG9iXHUwMTA1LiBOb3dlIFx1MDE1QndpYXR5IGp1XHUwMTdDIHcgZHJvZHplIFx1MjAxNCB3clx1MDBGM1x1MDEwNyBwbyAzIGd3aWF6ZGtpIVwiLCBcIlBvZHdcdTAwRjNqIGtsZWpub3R5XCIsIFwiQnJhayByZWtsYW0gdyB0ZWogY2h3aWxpXCIsIFwiVG8gdXJ6XHUwMTA1ZHplbmllIG5pZSB3eVx1MDE1QndpZXRsYSBncmFmaWtpIDNELlwiLCBcIlphbWtuaWpcIiwgXCJLdWxraVwiLCBcIlBvZHBvd2llZFx1MDE3QVwiLCBcIlBvbWlcdTAxNDQgcG96aW9tXCIsIFwiWmEgbWFcdTAxNDJvIGtsZWpub3RcdTAwRjN3XCIsIFwiVyB1XHUwMTdDeWNpdVwiLFxuICAgIFwiXHUwMTdCXHUwMEYzXHUwMTQydGUgcG9sYSBjaVx1MDExOSB3eXJ6dWNhalx1MDEwNVwiLCBcIldza29jeiBuYSBydWNob215IGJsb2tcIiwgXCJPbWlcdTAxNDQgcGlcdTAxNDJcdTAxMTlcIiwgXCJLbHVjeiBvdHdpZXJhIGRyendpXCIsIFwiWmllbG9uZSBicmFta2kgc1x1MDEwNSBqZWRub2tpZXJ1bmtvd2VcIiwgXCJQb2N6ZWthaiwgYVx1MDE3QyBsYXNlciB6Z2FcdTAxNUJuaWVcIiwgXCJXaWF0ciBjaVx1MDExOSBuaWVzaWVcIiwgXCJQb3J0YWxlIHNcdTAxMDUgcG9cdTAxNDJcdTAxMDVjem9uZVwiXVxufTtcbiIsICIvLyBVSSBzdHJpbmdzLiBFbmdsaXNoIGlzIHRoZSByZXF1aXJlZCBiYXNlIGxhbmd1YWdlOyBldmVyeSBvdGhlciBsYW5ndWFnZSBmYWxscyBiYWNrIHRvIGl0IHBlciBrZXkuXG5pbXBvcnQgeyBLRVlTLCBST1dTIH0gZnJvbSBcIi4vbG9jYWxlcy5qc1wiO1xuLy8gVGhlIGdhbWUgaXMgaWNvbi1maXJzdCBvbiBwdXJwb3NlOiBrZWVwIHRoaXMgdGFibGUgc21hbGwuXG5leHBvcnQgY29uc3QgU1RSSU5HUyA9IHtcbiAgZW46IHtcbiAgICBsb2FkaW5nOiBcIkxvYWRpbmdcdTIwMjZcIiwgbGV2ZWw6IFwiTGV2ZWxcIiwgbGV2ZWxzOiBcIkxldmVsc1wiLCBuZXh0OiBcIk5leHRcIiwgcmV0cnk6IFwiUmV0cnlcIiwgc2V0dGluZ3M6IFwiU2V0dGluZ3NcIixcbiAgICBtdXNpYzogXCJNdXNpY1wiLCBzZng6IFwiU291bmQgZWZmZWN0c1wiLCBjb250cm9sOiBcIkNvbnRyb2xzXCIsIGN0bFN3aXBlOiBcIlN3aXBlXCIsIGN0bEdyYWI6IFwiR3JhYiAmIHR1cm5cIixcbiAgICB3aW4xOiBcIk5pY2UhXCIsIHdpbjI6IFwiR3JlYXQhXCIsIHdpbjM6IFwiUGVyZmVjdCFcIiwgcGF1c2VkOiBcIlBhdXNlZFwiLFxuICAgIHR1dERyYWc6IFwiRHJhZyB0byB0aWx0IHRoZSB3b3JsZFwiLCB0dXRCb3RoOiBcIlRpbHQgYm90aCB3YXlzXCIsIHR1dFNwaWtlczogXCJSZWQgbWVhbnMgZGFuZ2VyXCIsXG4gICAgdHV0RmxpcDogXCJUdXJuIGl0IHVwc2lkZSBkb3duXCIsIHR1dEVkZ2U6IFwiRG9uJ3QgZmFsbCBvdXRcIixcbiAgICB0dXRQYWQ6IFwiWWVsbG93IHBhZHMgbGF1bmNoIHlvdVwiLCB0dXRNb3ZlcjogXCJSaWRlIHRoZSBtb3ZpbmcgYmxvY2tcIiwgdHV0U2F3OiBcIkRvZGdlIHRoZSBzYXdcIiwgdHV0S2V5OiBcIlRoZSBrZXkgb3BlbnMgdGhlIGRvb3JcIixcbiAgICB0dXRHYXRlOiBcIkdyZWVuIGdhdGVzIGFyZSBvbmUtd2F5XCIsIHR1dExhc2VyOiBcIldhaXQgZm9yIHRoZSBsYXNlciB0byBnbyBkYXJrXCIsIHR1dEZhbjogXCJUaGUgd2luZCBjYXJyaWVzIHlvdVwiLCB0dXRQb3J0OiBcIlBvcnRhbHMgbGluayB1cFwiLFxuICAgIGVuZFRpdGxlOiBcIldvcmxkIGNvbXBsZXRlIVwiLCBlbmRCb2R5OiBcIllvdSBmaW5pc2hlZCBldmVyeSBsZXZlbC4gTW9yZSB3b3JsZHMgYXJlIG9uIHRoZSB3YXkgXHUyMDE0IGdvIGJhY2sgZm9yIDMgc3RhcnMhXCIsXG4gICAgZG91YmxlR2VtczogXCJEb3VibGUgZ2Vtc1wiLCBhZEZhaWw6IFwiTm8gYWQgYXZhaWxhYmxlIHJpZ2h0IG5vd1wiLCBub1dlYmdsOiBcIlRoaXMgZGV2aWNlIGNhbid0IHNob3cgM0QgZ3JhcGhpY3MuXCIsXG4gICAgY2xvc2U6IFwiQ2xvc2VcIiwgc2tpbnM6IFwiQmFsbHNcIiwgaGludDogXCJIaW50XCIsIHNraXA6IFwiU2tpcCBsZXZlbFwiLCBub3RFbm91Z2g6IFwiTm90IGVub3VnaCBnZW1zXCIsIGVxdWlwcGVkOiBcIkluIHVzZVwiXG4gIH0sXG4gIGFyOiB7XG4gICAgbG9hZGluZzogXCJcdTA2MkNcdTA2MjdcdTA2MzFcdTA2NEQgXHUwNjI3XHUwNjQ0XHUwNjJBXHUwNjJEXHUwNjQ1XHUwNjRBXHUwNjQ0XHUyMDI2XCIsIGxldmVsOiBcIlx1MDYyN1x1MDY0NFx1MDY0NVx1MDYzM1x1MDYyQVx1MDY0OFx1MDY0OVwiLCBsZXZlbHM6IFwiXHUwNjI3XHUwNjQ0XHUwNjQ1XHUwNjMzXHUwNjJBXHUwNjQ4XHUwNjRBXHUwNjI3XHUwNjJBXCIsIG5leHQ6IFwiXHUwNjI3XHUwNjQ0XHUwNjJBXHUwNjI3XHUwNjQ0XHUwNjRBXCIsIHJldHJ5OiBcIlx1MDYyNVx1MDYzOVx1MDYyN1x1MDYyRlx1MDYyOVwiLCBzZXR0aW5nczogXCJcdTA2MjdcdTA2NDRcdTA2MjVcdTA2MzlcdTA2MkZcdTA2MjdcdTA2MkZcdTA2MjdcdTA2MkFcIixcbiAgICBtdXNpYzogXCJcdTA2MjdcdTA2NDRcdTA2NDVcdTA2NDhcdTA2MzNcdTA2NEFcdTA2NDJcdTA2NDlcIiwgc2Z4OiBcIlx1MDYyN1x1MDY0NFx1MDY0NVx1MDYyNFx1MDYyQlx1MDYzMVx1MDYyN1x1MDYyQSBcdTA2MjdcdTA2NDRcdTA2MzVcdTA2NDhcdTA2MkFcdTA2NEFcdTA2MjlcIiwgY29udHJvbDogXCJcdTA2MjdcdTA2NDRcdTA2MkFcdTA2MkRcdTA2NDNcdTA2NDVcIiwgY3RsU3dpcGU6IFwiXHUwNjMzXHUwNjJEXHUwNjI4XCIsIGN0bEdyYWI6IFwiXHUwNjI3XHUwNjQ1XHUwNjMzXHUwNjQzIFx1MDY0OFx1MDY0NFx1MDY0Rlx1MDY0MVx1MDY1MVwiLFxuICAgIHdpbjE6IFwiXHUwNjIzXHUwNjJEXHUwNjMzXHUwNjQ2XHUwNjJBIVwiLCB3aW4yOiBcIlx1MDYzMVx1MDYyN1x1MDYyNlx1MDYzOSFcIiwgd2luMzogXCJcdTA2NDVcdTA2NDVcdTA2MkFcdTA2MjdcdTA2MzIhXCIsIHBhdXNlZDogXCJcdTA2NDVcdTA2MkFcdTA2NDhcdTA2NDJcdTA2NDEgXHUwNjQ1XHUwNjI0XHUwNjQyXHUwNjJBXHUwNjRCXHUwNjI3XCIsXG4gICAgdHV0RHJhZzogXCJcdTA2MjdcdTA2MzNcdTA2MkRcdTA2MjggXHUwNjQ0XHUwNjJBXHUwNjRGXHUwNjQ1XHUwNjRBXHUwNjQ0IFx1MDYyN1x1MDY0NFx1MDYzOVx1MDYyN1x1MDY0NFx1MDY0NVwiLCB0dXRCb3RoOiBcIlx1MDYyM1x1MDY0NVx1MDY1MFx1MDY0NCBcdTA2NDFcdTA2NEEgXHUwNjI3XHUwNjQ0XHUwNjI3XHUwNjJBXHUwNjJDXHUwNjI3XHUwNjQ3XHUwNjRBXHUwNjQ2XCIsIHR1dFNwaWtlczogXCJcdTA2MjdcdTA2NDRcdTA2MjNcdTA2MkRcdTA2NDVcdTA2MzEgXHUwNjJFXHUwNjM3XHUwNjMxXCIsXG4gICAgdHV0RmxpcDogXCJcdTA2MjdcdTA2NDJcdTA2NDRcdTA2MjggXHUwNjI3XHUwNjQ0XHUwNjM5XHUwNjI3XHUwNjQ0XHUwNjQ1IFx1MDYzMVx1MDYyM1x1MDYzM1x1MDY0Qlx1MDYyNyBcdTA2MzlcdTA2NDRcdTA2NDkgXHUwNjM5XHUwNjQyXHUwNjI4XCIsIHR1dEVkZ2U6IFwiXHUwNjQ0XHUwNjI3IFx1MDYyQVx1MDYzM1x1MDY0Mlx1MDYzNyBcdTA2NDVcdTA2NDYgXHUwNjI3XHUwNjQ0XHUwNjJEXHUwNjI3XHUwNjQxXHUwNjI5XCIsXG4gICAgdHV0UGFkOiBcIlx1MDYyN1x1MDY0NFx1MDY0NVx1MDY0Nlx1MDYzNVx1MDYyN1x1MDYyQSBcdTA2MjdcdTA2NDRcdTA2MzVcdTA2NDFcdTA2MzFcdTA2MjdcdTA2MjEgXHUwNjJBXHUwNjQyXHUwNjMwXHUwNjQxXHUwNjQzXCIsIHR1dE1vdmVyOiBcIlx1MDYyN1x1MDYzMVx1MDY0M1x1MDYyOCBcdTA2MjdcdTA2NDRcdTA2NDVcdTA2NDZcdTA2MzVcdTA2MjkgXHUwNjI3XHUwNjQ0XHUwNjQ1XHUwNjJBXHUwNjJEXHUwNjMxXHUwNjQzXHUwNjI5XCIsIHR1dFNhdzogXCJcdTA2MkFcdTA2NDFcdTA2MjdcdTA2MkZcdTA2NEUgXHUwNjI3XHUwNjQ0XHUwNjQ1XHUwNjQ2XHUwNjM0XHUwNjI3XHUwNjMxXCIsIHR1dEtleTogXCJcdTA2MjdcdTA2NDRcdTA2NDVcdTA2NDFcdTA2MkFcdTA2MjdcdTA2MkQgXHUwNjRBXHUwNjQxXHUwNjJBXHUwNjJEIFx1MDYyN1x1MDY0NFx1MDYyOFx1MDYyN1x1MDYyOFwiLFxuICAgIHR1dEdhdGU6IFwiXHUwNjI3XHUwNjQ0XHUwNjI4XHUwNjQ4XHUwNjI3XHUwNjI4XHUwNjI3XHUwNjJBIFx1MDYyN1x1MDY0NFx1MDYyRVx1MDYzNlx1MDYzMVx1MDYyN1x1MDYyMSBcdTA2MjdcdTA2MkFcdTA2MkNcdTA2MjdcdTA2NDcgXHUwNjQ4XHUwNjI3XHUwNjJEXHUwNjJGXCIsIHR1dExhc2VyOiBcIlx1MDYyN1x1MDY0Nlx1MDYyQVx1MDYzOFx1MDYzMSBcdTA2MkRcdTA2MkFcdTA2NDkgXHUwNjRBXHUwNjQ2XHUwNjM3XHUwNjQxXHUwNjI2IFx1MDYyN1x1MDY0NFx1MDY0NFx1MDY0QVx1MDYzMlx1MDYzMVwiLCB0dXRGYW46IFwiXHUwNjI3XHUwNjQ0XHUwNjQ3XHUwNjQ4XHUwNjI3XHUwNjIxIFx1MDY0QVx1MDYyRFx1MDY0NVx1MDY0NFx1MDY0M1wiLCB0dXRQb3J0OiBcIlx1MDYyN1x1MDY0NFx1MDYyOFx1MDY0OFx1MDYyN1x1MDYyOFx1MDYyQVx1MDYyN1x1MDY0NiBcdTA2NDVcdTA2MkFcdTA2MzVcdTA2NDRcdTA2MkFcdTA2MjdcdTA2NDZcIixcbiAgICBlbmRUaXRsZTogXCJcdTA2MjdcdTA2NDNcdTA2MkFcdTA2NDVcdTA2NDQgXHUwNjI3XHUwNjQ0XHUwNjM5XHUwNjI3XHUwNjQ0XHUwNjQ1IVwiLCBlbmRCb2R5OiBcIlx1MDYyM1x1MDY0Nlx1MDY0N1x1MDY0QVx1MDYyQSBcdTA2NDNcdTA2NDQgXHUwNjI3XHUwNjQ0XHUwNjQ1XHUwNjMzXHUwNjJBXHUwNjQ4XHUwNjRBXHUwNjI3XHUwNjJBLiBcdTA2MzlcdTA2NDhcdTA2MjdcdTA2NDRcdTA2NDUgXHUwNjJDXHUwNjJGXHUwNjRBXHUwNjJGXHUwNjI5IFx1MDY0MVx1MDY0QSBcdTA2MjdcdTA2NDRcdTA2MzdcdTA2MzFcdTA2NEFcdTA2NDIgXHUyMDE0IFx1MDYzOVx1MDY0Rlx1MDYyRiBcdTA2NDhcdTA2MjdcdTA2MkNcdTA2NDVcdTA2MzkgXHUwNjYzIFx1MDY0Nlx1MDYyQ1x1MDY0OFx1MDY0NSFcIixcbiAgICBkb3VibGVHZW1zOiBcIlx1MDYzNlx1MDYyN1x1MDYzOVx1MDY0MSBcdTA2MjdcdTA2NDRcdTA2MkNcdTA2NDhcdTA2MjdcdTA2NDdcdTA2MzFcIiwgYWRGYWlsOiBcIlx1MDY0NFx1MDYyNyBcdTA2NEFcdTA2NDhcdTA2MkNcdTA2MkYgXHUwNjI1XHUwNjM5XHUwNjQ0XHUwNjI3XHUwNjQ2IFx1MDY0NVx1MDYyQVx1MDYyN1x1MDYyRCBcdTA2MjdcdTA2NDRcdTA2MjJcdTA2NDZcIiwgbm9XZWJnbDogXCJcdTA2NDdcdTA2MzBcdTA2MjcgXHUwNjI3XHUwNjQ0XHUwNjJDXHUwNjQ3XHUwNjI3XHUwNjMyIFx1MDY0NFx1MDYyNyBcdTA2NEFcdTA2MkZcdTA2MzlcdTA2NDUgXHUwNjI3XHUwNjQ0XHUwNjMxXHUwNjMzXHUwNjQ4XHUwNjQ1IFx1MDYyQlx1MDY0NFx1MDYyN1x1MDYyQlx1MDY0QVx1MDYyOSBcdTA2MjdcdTA2NDRcdTA2MjNcdTA2MjhcdTA2MzlcdTA2MjdcdTA2MkYuXCIsXG4gICAgY2xvc2U6IFwiXHUwNjI1XHUwNjNBXHUwNjQ0XHUwNjI3XHUwNjQyXCIsIHNraW5zOiBcIlx1MDYyN1x1MDY0NFx1MDY0M1x1MDYzMVx1MDYyN1x1MDYyQVwiLCBoaW50OiBcIlx1MDYyQVx1MDY0NFx1MDY0NVx1MDY0QVx1MDYyRFwiLCBza2lwOiBcIlx1MDYyQVx1MDYyRVx1MDYzN1x1MDY0RVx1MDY1MSBcdTA2MjdcdTA2NDRcdTA2NDVcdTA2MzNcdTA2MkFcdTA2NDhcdTA2NDlcIiwgbm90RW5vdWdoOiBcIlx1MDYyN1x1MDY0NFx1MDYyQ1x1MDY0OFx1MDYyN1x1MDY0N1x1MDYzMSBcdTA2NDRcdTA2MjcgXHUwNjJBXHUwNjQzXHUwNjQxXHUwNjRBXCIsIGVxdWlwcGVkOiBcIlx1MDY0NVx1MDYzM1x1MDYyQVx1MDYyRVx1MDYyRlx1MDY0NVx1MDYyOVwiXG4gIH1cbn07XG5cbi8vIGVzIHB0IGRlIGZyIGl0IGphIHRyIGlkIGhpIHJ1IHZpIHRoIHBsIFx1MjAxNCByb3dzIGluIGxvY2FsZXMuanMsIG9uZSBzdHJpbmcgcGVyIGtleVxuZm9yIChjb25zdCBbbGFuZywgcm93XSBvZiBPYmplY3QuZW50cmllcyhST1dTKSkge1xuICBjb25zdCB0YWJsZSA9IHt9O1xuICBLRVlTLmZvckVhY2goKGssIGkpID0+IHsgaWYgKHJvd1tpXSAhPT0gdW5kZWZpbmVkKSB0YWJsZVtrXSA9IHJvd1tpXTsgfSk7XG4gIFNUUklOR1NbbGFuZ10gPSB0YWJsZTtcbn1cblxuY29uc3QgUlRMID0gW1wiYXJcIiwgXCJoZVwiLCBcImZhXCIsIFwidXJcIl07XG5cbmV4cG9ydCBmdW5jdGlvbiByZXNvbHZlTGFuZyh0YWcpIHtcbiAgY29uc3QgdCA9IFN0cmluZyh0YWcgfHwgXCJlblwiKS50b0xvd2VyQ2FzZSgpO1xuICBpZiAoU1RSSU5HU1t0XSkgcmV0dXJuIHQ7XG4gIGNvbnN0IHAgPSB0LnNwbGl0KC9bLV9dLylbMF07XG4gIHJldHVybiBTVFJJTkdTW3BdID8gcCA6IFwiZW5cIjtcbn1cblxuZXhwb3J0IGNsYXNzIEkxOG4ge1xuICBjb25zdHJ1Y3RvcigpIHsgdGhpcy5sYW5nID0gXCJlblwiOyB9XG4gIHNldCh0YWcpIHsgdGhpcy5sYW5nID0gcmVzb2x2ZUxhbmcodGFnKTsgfVxuICBnZXQgcnRsKCkgeyByZXR1cm4gUlRMLmluY2x1ZGVzKHRoaXMubGFuZyk7IH1cbiAgdChrZXkpIHsgY29uc3QgdiA9IFNUUklOR1NbdGhpcy5sYW5nXVtrZXldOyByZXR1cm4gdiAhPT0gdW5kZWZpbmVkID8gdiA6IFNUUklOR1MuZW5ba2V5XSAhPT0gdW5kZWZpbmVkID8gU1RSSU5HUy5lbltrZXldIDoga2V5OyB9XG4gIGFwcGx5KHJvb3QpIHtcbiAgICBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQubGFuZyA9IHRoaXMubGFuZztcbiAgICBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuZGlyID0gdGhpcy5ydGwgPyBcInJ0bFwiIDogXCJsdHJcIjtcbiAgICByb290LnF1ZXJ5U2VsZWN0b3JBbGwoXCJbZGF0YS1pMThuXVwiKS5mb3JFYWNoKChuKSA9PiB7IG4udGV4dENvbnRlbnQgPSB0aGlzLnQobi5nZXRBdHRyaWJ1dGUoXCJkYXRhLWkxOG5cIikpOyB9KTtcbiAgfVxufVxuIiwgIi8vIFRoZSBmaXZlIGZvcm1zLiBBbGwgY29sbGlkZSBhcyBjaXJjbGVzOyB0aGV5IGRpZmZlciBpbiBzaXplLCB3ZWlnaHQsIGdyaXAsIGJvdW5jZSBhbmQgYWJpbGl0aWVzLlxuLy8gICBnOiBncmF2aXR5IHNjYWxlIFx1MDBCNyBlOiByZXN0aXR1dGlvbiBcdTAwQjcgbXU6IHN1cmZhY2UgZnJpY3Rpb24gXHUwMEI3IGRyYWc6IGFpciBkcmFnICgxL3MpXG4vLyAgIGJyZWFrczogMCBuZXZlciBcdTAwQjcgMSBicmVha3MgY3J5c3RhbCB3aGVuIGhpdHRpbmcgZmFzdCBcdTAwQjcgMiBicmVha3MgY3J5c3RhbCBvbiB0b3VjaFxuLy8gICB3aW5kOiBob3cgc3Ryb25nbHkgZmFucyBwdXNoIGl0XG5leHBvcnQgY29uc3QgRk9STVMgPSB7XG4gIGJhbGw6ICAgIHsgaWQ6IFwiYmFsbFwiLCAgICByOiAxMy41LCBnOiAxLjAsICBlOiAwLjQyLCBtdTogMC4wMiwgZHJhZzogMC40NSwgYnJlYWtzOiAwLCB3aW5kOiAxIH0sXG4gIGN1YmU6ICAgIHsgaWQ6IFwiY3ViZVwiLCAgICByOiAxMy4wLCBnOiAxLjMsICBlOiAwLjA0LCBtdTogMC45LCAgZHJhZzogMC42LCAgYnJlYWtzOiAxLCB3aW5kOiAwLjM1IH0sXG4gIHByaXNtOiAgIHsgaWQ6IFwicHJpc21cIiwgICByOiA4LjUsICBnOiAwLjk1LCBlOiAwLjMsICBtdTogMC4wNiwgZHJhZzogMC40LCAgYnJlYWtzOiAwLCB3aW5kOiAxIH0sXG4gIGZlYXRoZXI6IHsgaWQ6IFwiZmVhdGhlclwiLCByOiAxNC4wLCBnOiAwLjQsICBlOiAwLjUsICBtdTogMC4wMywgZHJhZzogMS40LCAgYnJlYWtzOiAwLCB3aW5kOiAzIH0sXG4gIHN0YXI6ICAgIHsgaWQ6IFwic3RhclwiLCAgICByOiAxNC4wLCBnOiAxLjEsICBlOiAwLjg2LCBtdTogMC4wMiwgZHJhZzogMC40NSwgYnJlYWtzOiAyLCB3aW5kOiAxIH1cbn07XG5leHBvcnQgY29uc3QgRk9STV9PUkRFUiA9IFtcImJhbGxcIiwgXCJjdWJlXCIsIFwicHJpc21cIiwgXCJmZWF0aGVyXCIsIFwic3RhclwiXTtcbiIsICIvLyBGTElQV09STEQgc2ltdWxhdGlvbiBjb3JlIFx1MjAxNCBkZXRlcm1pbmlzdGljLCBmaXhlZC1zdGVwLCBET00tZnJlZS5cbi8vIFJ1bnMgdW5jaGFuZ2VkIGluIHRoZSBicm93c2VyIChnYW1lKSwgaW4gTm9kZSAoc29sdmVyLCB2YWxpZGF0b3IsIHRlc3RzKS5cbi8vXG4vLyBGcmFtZSBvZiByZWZlcmVuY2U6IGV2ZXJ5dGhpbmcgaXMgaW4gQVJFTkEtTE9DQUwgY29vcmRpbmF0ZXMgKHggcmlnaHQsIHkgdXApLlxuLy8gVGhlIHBsYXllciByb3RhdGVzIHRoZSB3b3JsZDsgaGVyZSB0aGF0IG9ubHkgY2hhbmdlcyB0aGUgZGlyZWN0aW9uIG9mIGdyYXZpdHkuXG5pbXBvcnQgeyBGT1JNUyB9IGZyb20gXCIuL2Zvcm1zLmpzXCI7XG5cbmV4cG9ydCBjb25zdCBEVCA9IDEgLyAxMjA7ICAgICAgLy8gZml4ZWQgc3RlcCAocylcbmV4cG9ydCBjb25zdCBIQUxGID0gMjEwOyAgICAgICAgLy8gYXJlbmEgc3BhbnMgWy1IQUxGLCBIQUxGXSBvbiBib3RoIGF4ZXNcbmV4cG9ydCBjb25zdCBHID0gNzIwOyAgICAgICAgICAgLy8gZ3Jhdml0eSAodW5pdHMvc14yKVxuZXhwb3J0IGNvbnN0IFdNQVggPSAyLjY7ICAgICAgICAvLyBtYXggd29ybGQgc3BpbiAocmFkL3MpIFx1MjI0OCAxNTBcdTAwQjAvc1xuY29uc3QgS1AgPSAxNDsgICAgICAgICAgICAgICAgICAvLyBzcGluIHRyYWNraW5nIGdhaW4gKDEvcylcbmNvbnN0IEFNQVggPSA0MjsgICAgICAgICAgICAgICAgLy8gbWF4IHNwaW4gYWNjZWxlcmF0aW9uIChyYWQvc14yKVxuY29uc3QgVk1BWCA9IDg4MDsgICAgICAgICAgICAgICAvLyBzcGVlZCBjYXAgXHUyMDE0IGtlZXBzIGEgc3RlcCBiZWxvdyB0aGUgdGhpbm5lc3Qgd2FsbFxuY29uc3QgUkVTVCA9IDQyOyAgICAgICAgICAgICAgICAvLyBpbXBhY3RzIHNsb3dlciB0aGFuIHRoaXMgZG8gbm90IGJvdW5jZVxuY29uc3QgSElUX0VWRU5UID0gNzA7ICAgICAgICAgICAvLyBpbXBhY3RzIGZhc3RlciB0aGFuIHRoaXMgZW1pdCBhIFwiaGl0XCIgZXZlbnRcbmNvbnN0IENSWVNUQUxfU1BFRUQgPSAxNzA7ICAgICAgLy8gc3BlZWQgYSBicmVha3M6MSBmb3JtIG5lZWRzIHRvIHNoYXR0ZXIgY3J5c3RhbFxuXG5leHBvcnQgY29uc3QgUE9SVF9SID0gMTI7ICAgICAgIC8vIGEgcG9ydGFsIHN3YWxsb3dzIHRoZSBiYWxsIHdoZW4gaXRzIGNlbnRyZSBpcyB0aGlzIGNsb3NlXG5jb25zdCBQT1JUX0NMRUFSID0gMzQ7ICAgICAgICAgIC8vIC4uLmFuZCByZS1hcm1zIG9uY2UgdGhlIGJhbGwgaXMgdGhpcyBmYXIgZnJvbSBldmVyeSBwb3J0YWxcbmV4cG9ydCBjb25zdCBTTkFQID0gMTM7ICAgICAgICAgLy8gbGVuZ3RoIG9mIGEgc25hcCgpIGFycmF5XG5cbmV4cG9ydCBjb25zdCBLX0JPWCA9IDAsIEtfQ0lSQ0xFID0gMSwgS19DQVBTVUxFID0gMjtcblxuLyoqIElzIGEgdGltZWQgbGFzZXIgbGl0IGF0IHRpbWUgdD8gKHBlcmlvZCAvIGR1dHkgaW4gc2Vjb25kcykgKi9cbmV4cG9ydCBmdW5jdGlvbiBsYXNlck9uKGx6LCB0KSB7XG4gIGlmICghbHoucGVyaW9kKSByZXR1cm4gdHJ1ZTtcbiAgbGV0IHAgPSAodCArIGx6LnBoKSAlIGx6LnBlcmlvZDsgaWYgKHAgPCAwKSBwICs9IGx6LnBlcmlvZDtcbiAgcmV0dXJuIHAgPCBsei5kdXR5O1xufVxuXG4vKiogUG9zaXRpb24vdmVsb2NpdHkgb2YgYSBwYXRoLWRyaXZlbiBvYmplY3QgKG1vdmVyLCBzYXcpIGF0IHRpbWUgdC4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwYXRoUG9zKG8sIHQsIG91dCkge1xuICBjb25zdCBhID0gdCAqIG8uc3BkICsgby5waDtcbiAgY29uc3Qgc24gPSBNYXRoLnNpbihhKSwgY3MgPSBNYXRoLmNvcyhhKTtcbiAgb3V0LnggPSBvLmN4ICsgc24gKiBvLmF4O1xuICBvdXQueSA9IG8uY3kgKyBjcyAqIG8uYXk7XG4gIG91dC52eCA9IGNzICogby5zcGQgKiBvLmF4O1xuICBvdXQudnkgPSAtc24gKiBvLnNwZCAqIG8uYXk7XG4gIHJldHVybiBvdXQ7XG59XG5cbmNvbnN0IF9wID0geyB4OiAwLCB5OiAwLCB2eDogMCwgdnk6IDAgfTtcbmNvbnN0IF9ib3ggPSB7IGN4OiAwLCBjeTogMCwgaHc6IDAsIGhoOiAwLCBjOiAxLCBzOiAwIH07XG5cbi8qKiBTcXVhcmVkIGRpc3RhbmNlIGZyb20gcG9pbnQgdG8gYW4gKG9yaWVudGVkKSBib3g7IDAgd2hlbiBpbnNpZGUuICovXG5mdW5jdGlvbiBib3hEaXN0MihweCwgcHksIGIpIHtcbiAgY29uc3QgZHggPSBweCAtIGIuY3gsIGR5ID0gcHkgLSBiLmN5O1xuICBjb25zdCBseCA9IGR4ICogYi5jICsgZHkgKiBiLnMsIGx5ID0gZHkgKiBiLmMgLSBkeCAqIGIucztcbiAgY29uc3QgZXggPSBseCA8IC1iLmh3ID8gbHggKyBiLmh3IDogbHggPiBiLmh3ID8gbHggLSBiLmh3IDogMDtcbiAgY29uc3QgZXkgPSBseSA8IC1iLmhoID8gbHkgKyBiLmhoIDogbHkgPiBiLmhoID8gbHkgLSBiLmhoIDogMDtcbiAgcmV0dXJuIGV4ICogZXggKyBleSAqIGV5O1xufVxuXG5leHBvcnQgY2xhc3MgU2ltIHtcbiAgLyoqXG4gICAqIEBwYXJhbSBsZXZlbCAgYSBwcmVwYXJlZCBsZXZlbCAoc2VlIGxldmVscy9wYXJzZS5qcylcbiAgICogQHBhcmFtIG9wdHMgICB7IGZvcm0/OiBzdHJpbmcsIGV2ZW50cz86IGJvb2xlYW4gfVxuICAgKi9cbiAgY29uc3RydWN0b3IobGV2ZWwsIG9wdHMgPSB7fSkge1xuICAgIHRoaXMubHZsID0gbGV2ZWw7XG4gICAgdGhpcy5yZWMgPSBvcHRzLmV2ZW50cyAhPT0gZmFsc2U7XG4gICAgdGhpcy5ldmVudHMgPSBbXTtcbiAgICB0aGlzLnNldEZvcm0ob3B0cy5mb3JtIHx8IFwiYmFsbFwiKTtcbiAgICB0aGlzLnJlc2V0KCk7XG4gIH1cblxuICBzZXRGb3JtKGlkKSB7XG4gICAgY29uc3QgZiA9IEZPUk1TW2lkXSB8fCBGT1JNUy5iYWxsO1xuICAgIHRoaXMuZm9ybSA9IGY7XG4gICAgdGhpcy5mb3JtSWQgPSBmLmlkO1xuICAgIHRoaXMuX2RhbXAgPSBNYXRoLmV4cCgtZi5kcmFnICogRFQpO1xuICB9XG5cbiAgcmVzZXQoKSB7XG4gICAgY29uc3QgTCA9IHRoaXMubHZsO1xuICAgIHRoaXMudGljayA9IDA7XG4gICAgdGhpcy5hbmdsZSA9IDA7IHRoaXMub21lZ2EgPSAwOyB0aGlzLnRhcmdldCA9IDA7XG4gICAgdGhpcy54ID0gTC5zdGFydC54OyB0aGlzLnkgPSBMLnN0YXJ0Lnk7IHRoaXMudnggPSAwOyB0aGlzLnZ5ID0gMDtcbiAgICB0aGlzLmdlbXMgPSAwOyAgICAgICAgICAgIC8vIGJpdG1hc2sgb2YgY29sbGVjdGVkIGdlbXNcbiAgICB0aGlzLmNyeXMgPSAwOyAgICAgICAgICAgIC8vIGJpdG1hc2sgb2YgYnJva2VuIGNyeXN0YWxzXG4gICAgdGhpcy5rZXlzID0gMDsgICAgICAgICAgICAvLyBiaXRtYXNrIG9mIGNvbGxlY3RlZCBrZXlzIChkb29ycyBvcGVuIHdoZW4gYWxsIGFyZSBoZWxkKVxuICAgIHRoaXMudHBsID0gMDsgICAgICAgICAgICAgLy8gMSB3aGlsZSB0aGUgYmFsbCBpcyBzdGlsbCBpbnNpZGUgYSBwb3J0YWwgaXQganVzdCB1c2VkXG4gICAgdGhpcy5hbGl2ZSA9IHRydWU7IHRoaXMud29uID0gZmFsc2U7IHRoaXMuY2F1c2UgPSBcIlwiO1xuICAgIHRoaXMubnggPSAwOyB0aGlzLm55ID0gMTsgLy8gbGFzdCBjb250YWN0IG5vcm1hbFxuICAgIHRoaXMudG91Y2ggPSBmYWxzZTsgICAgICAgLy8gdG91Y2hpbmcgc29tZXRoaW5nIHRoaXMgdGlja1xuICAgIHRoaXMuYWlyID0gMDsgICAgICAgICAgICAgLy8gdGlja3Mgc2luY2UgbGFzdCBjb250YWN0XG4gICAgdGhpcy5pbXBhY3QgPSAwOyAgICAgICAgICAvLyBzdHJvbmdlc3QgaW1wYWN0IHRoaXMgdGlja1xuICAgIHRoaXMuZXZlbnRzLmxlbmd0aCA9IDA7XG4gIH1cblxuICBnZXQgdGltZSgpIHsgcmV0dXJuIHRoaXMudGljayAqIERUOyB9XG4gIGdldCBnZW1Db3VudCgpIHsgbGV0IG4gPSAwLCBtID0gdGhpcy5nZW1zOyB3aGlsZSAobSkgeyBuICs9IG0gJiAxOyBtID4+Pj0gMTsgfSByZXR1cm4gbjsgfVxuXG4gIF9lbWl0KHQsIHgsIHksIHYpIHsgaWYgKHRoaXMucmVjKSB0aGlzLmV2ZW50cy5wdXNoKHsgdCwgeCwgeSwgdiB9KTsgfVxuXG4gIC8qKiBSZXNvbHZlIG9uZSBjb250YWN0OiBwdXNoIG91dCwgYm91bmNlLCBhcHBseSBDb3Vsb21iIGZyaWN0aW9uLiBSZXR1cm5zIGltcGFjdCBzcGVlZC4gKi9cbiAgX2NvbnRhY3QobngsIG55LCBwZW4sIHN2eCwgc3Z5LCBlTXVsLCBtdU11bCwga2ljaykge1xuICAgIHRoaXMueCArPSBueCAqIHBlbjsgdGhpcy55ICs9IG55ICogcGVuO1xuICAgIHRoaXMudG91Y2ggPSB0cnVlOyB0aGlzLm54ID0gbng7IHRoaXMubnkgPSBueTtcbiAgICBsZXQgcnZ4ID0gdGhpcy52eCAtIHN2eCwgcnZ5ID0gdGhpcy52eSAtIHN2eTtcbiAgICBjb25zdCB2biA9IHJ2eCAqIG54ICsgcnZ5ICogbnk7XG4gICAgaWYgKHZuID49IDApIHJldHVybiAwO1xuICAgIGNvbnN0IGYgPSB0aGlzLmZvcm0sIGltcCA9IC12bjtcbiAgICBsZXQgZSA9IGltcCA+IFJFU1QgPyBmLmUgKiBlTXVsIDogMDtcbiAgICBpZiAoZSA+IDEpIGUgPSAxO1xuICAgIGNvbnN0IGpuID0gKDEgKyBlKSAqIGltcDtcbiAgICBydnggKz0gam4gKiBueDsgcnZ5ICs9IGpuICogbnk7XG4gICAgY29uc3QgdHggPSAtbnksIHR5ID0gbng7XG4gICAgY29uc3QgdnQgPSBydnggKiB0eCArIHJ2eSAqIHR5O1xuICAgIGNvbnN0IG1heEYgPSBmLm11ICogbXVNdWwgKiBqbjtcbiAgICBjb25zdCBkdnQgPSB2dCA+IG1heEYgPyAtbWF4RiA6IHZ0IDwgLW1heEYgPyBtYXhGIDogLXZ0O1xuICAgIHJ2eCArPSBkdnQgKiB0eDsgcnZ5ICs9IGR2dCAqIHR5O1xuICAgIGlmIChraWNrKSB7IHJ2eCArPSBueCAqIGtpY2s7IHJ2eSArPSBueSAqIGtpY2s7IH1cbiAgICB0aGlzLnZ4ID0gcnZ4ICsgc3Z4OyB0aGlzLnZ5ID0gcnZ5ICsgc3Z5O1xuICAgIGlmIChpbXAgPiB0aGlzLmltcGFjdCkgdGhpcy5pbXBhY3QgPSBpbXA7XG4gICAgcmV0dXJuIGltcDtcbiAgfVxuXG4gIC8qKiBDaXJjbGUtdnMtc29saWQuIFJldHVybnMgaW1wYWN0ICg+PTApIG9uIGNvbnRhY3QsIC0xIHdoZW4gbm90IHRvdWNoaW5nLiAqL1xuICBfaGl0KHMsIHIsIHN2eCwgc3Z5KSB7XG4gICAgbGV0IG54LCBueSwgcGVuO1xuICAgIGlmIChzLmsgPT09IEtfQk9YKSB7XG4gICAgICBjb25zdCBkeCA9IHRoaXMueCAtIHMuY3gsIGR5ID0gdGhpcy55IC0gcy5jeTtcbiAgICAgIGNvbnN0IGx4ID0gZHggKiBzLmMgKyBkeSAqIHMucywgbHkgPSBkeSAqIHMuYyAtIGR4ICogcy5zO1xuICAgICAgY29uc3QgcXggPSBseCA8IC1zLmh3ID8gLXMuaHcgOiBseCA+IHMuaHcgPyBzLmh3IDogbHg7XG4gICAgICBjb25zdCBxeSA9IGx5IDwgLXMuaGggPyAtcy5oaCA6IGx5ID4gcy5oaCA/IHMuaGggOiBseTtcbiAgICAgIGNvbnN0IGV4ID0gbHggLSBxeCwgZXkgPSBseSAtIHF5LCBkMiA9IGV4ICogZXggKyBleSAqIGV5O1xuICAgICAgaWYgKGQyID49IHIgKiByKSByZXR1cm4gLTE7XG4gICAgICBsZXQgbmx4LCBubHk7XG4gICAgICBpZiAoZDIgPiAxZS05KSB7XG4gICAgICAgIGNvbnN0IGQgPSBNYXRoLnNxcnQoZDIpOyBubHggPSBleCAvIGQ7IG5seSA9IGV5IC8gZDsgcGVuID0gciAtIGQ7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBjZW50cmUgaXMgaW5zaWRlIHRoZSBib3g6IGxlYXZlIHRocm91Z2ggdGhlIG5lYXJlc3QgZmFjZVxuICAgICAgICBjb25zdCBkbCA9IGx4ICsgcy5odywgZHIgPSBzLmh3IC0gbHgsIGRiID0gbHkgKyBzLmhoLCBkdCA9IHMuaGggLSBseTtcbiAgICAgICAgbGV0IG0gPSBkbDsgbmx4ID0gLTE7IG5seSA9IDA7XG4gICAgICAgIGlmIChkciA8IG0pIHsgbSA9IGRyOyBubHggPSAxOyBubHkgPSAwOyB9XG4gICAgICAgIGlmIChkYiA8IG0pIHsgbSA9IGRiOyBubHggPSAwOyBubHkgPSAtMTsgfVxuICAgICAgICBpZiAoZHQgPCBtKSB7IG0gPSBkdDsgbmx4ID0gMDsgbmx5ID0gMTsgfVxuICAgICAgICBwZW4gPSByICsgbTtcbiAgICAgIH1cbiAgICAgIG54ID0gbmx4ICogcy5jIC0gbmx5ICogcy5zOyBueSA9IG5seCAqIHMucyArIG5seSAqIHMuYztcbiAgICB9IGVsc2UgaWYgKHMuayA9PT0gS19DSVJDTEUpIHtcbiAgICAgIGNvbnN0IGR4ID0gdGhpcy54IC0gcy5jeCwgZHkgPSB0aGlzLnkgLSBzLmN5LCByciA9IHIgKyBzLnI7XG4gICAgICBjb25zdCBkMiA9IGR4ICogZHggKyBkeSAqIGR5O1xuICAgICAgaWYgKGQyID49IHJyICogcnIpIHJldHVybiAtMTtcbiAgICAgIGNvbnN0IGQgPSBNYXRoLnNxcnQoZDIpO1xuICAgICAgaWYgKGQgPiAxZS02KSB7IG54ID0gZHggLyBkOyBueSA9IGR5IC8gZDsgfSBlbHNlIHsgbnggPSAwOyBueSA9IDE7IH1cbiAgICAgIHBlbiA9IHJyIC0gZDtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gY2Fwc3VsZTogY2xvc2VzdCBwb2ludCBvbiBzZWdtZW50IEEtQlxuICAgICAgY29uc3QgYWJ4ID0gcy5ieCAtIHMuYXgsIGFieSA9IHMuYnkgLSBzLmF5O1xuICAgICAgbGV0IHQgPSAoKHRoaXMueCAtIHMuYXgpICogYWJ4ICsgKHRoaXMueSAtIHMuYXkpICogYWJ5KSAvIChhYnggKiBhYnggKyBhYnkgKiBhYnkpO1xuICAgICAgdCA9IHQgPCAwID8gMCA6IHQgPiAxID8gMSA6IHQ7XG4gICAgICBjb25zdCBkeCA9IHRoaXMueCAtIChzLmF4ICsgYWJ4ICogdCksIGR5ID0gdGhpcy55IC0gKHMuYXkgKyBhYnkgKiB0KSwgcnIgPSByICsgcy5yO1xuICAgICAgY29uc3QgZDIgPSBkeCAqIGR4ICsgZHkgKiBkeTtcbiAgICAgIGlmIChkMiA+PSByciAqIHJyKSByZXR1cm4gLTE7XG4gICAgICBjb25zdCBkID0gTWF0aC5zcXJ0KGQyKTtcbiAgICAgIGlmIChkID4gMWUtNikgeyBueCA9IGR4IC8gZDsgbnkgPSBkeSAvIGQ7IH0gZWxzZSB7IG54ID0gLWFieTsgbnkgPSBhYng7IGNvbnN0IGwgPSBNYXRoLmh5cG90KG54LCBueSkgfHwgMTsgbnggLz0gbDsgbnkgLz0gbDsgfVxuICAgICAgcGVuID0gcnIgLSBkO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5fY29udGFjdChueCwgbnksIHBlbiwgc3Z4LCBzdnksIHMuZSwgcy5tdSwgcy5raWNrKTtcbiAgfVxuXG4gIF9kaWUoY2F1c2UpIHtcbiAgICB0aGlzLmFsaXZlID0gZmFsc2U7IHRoaXMuY2F1c2UgPSBjYXVzZTtcbiAgICB0aGlzLl9lbWl0KFwiZGllXCIsIHRoaXMueCwgdGhpcy55LCAwKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZHZhbmNlIG9uZSBmaXhlZCB0aWNrLlxuICAgKiBAcGFyYW0gdSBvcHRpb25hbCBjb21tYW5kZWQgc3BpbiBpbiBbLTEsIDFdIChib3RzKTsgcGxheWVycyB3cml0ZSBgdGFyZ2V0YCBkaXJlY3RseS5cbiAgICovXG4gIHN0ZXAodSkge1xuICAgIGlmICghdGhpcy5hbGl2ZSB8fCB0aGlzLndvbikgcmV0dXJuO1xuICAgIGNvbnN0IEwgPSB0aGlzLmx2bCwgZiA9IHRoaXMuZm9ybSwgciA9IGYucjtcbiAgICB0aGlzLnRpY2srKztcbiAgICBjb25zdCB0ID0gdGhpcy50aWNrICogRFQ7XG5cbiAgICAvLyAtLS0gd29ybGQgcm90YXRpb246IHJhdGUtIGFuZCBhY2NlbGVyYXRpb24tbGltaXRlZCB0cmFja2luZyBvZiB0aGUgdGFyZ2V0IGFuZ2xlXG4gICAgaWYgKHUpIHRoaXMudGFyZ2V0ICs9IHUgKiBXTUFYICogRFQ7XG4gICAgbGV0IHcgPSAodGhpcy50YXJnZXQgLSB0aGlzLmFuZ2xlKSAqIEtQO1xuICAgIGlmICh3ID4gV01BWCkgdyA9IFdNQVg7IGVsc2UgaWYgKHcgPCAtV01BWCkgdyA9IC1XTUFYO1xuICAgIGxldCBkdyA9IHcgLSB0aGlzLm9tZWdhO1xuICAgIGNvbnN0IGFtID0gQU1BWCAqIERUO1xuICAgIGlmIChkdyA+IGFtKSBkdyA9IGFtOyBlbHNlIGlmIChkdyA8IC1hbSkgZHcgPSAtYW07XG4gICAgdGhpcy5vbWVnYSArPSBkdztcbiAgICB0aGlzLmFuZ2xlICs9IHRoaXMub21lZ2EgKiBEVDtcblxuICAgIC8vIC0tLSBpbnRlZ3JhdGUgKHNjcmVlbi1kb3duIGdyYXZpdHkgZXhwcmVzc2VkIGluIHRoZSBhcmVuYSBmcmFtZSlcbiAgICBjb25zdCBnID0gRyAqIGYuZztcbiAgICB0aGlzLnZ4ID0gKHRoaXMudnggLSBNYXRoLnNpbih0aGlzLmFuZ2xlKSAqIGcgKiBEVCkgKiB0aGlzLl9kYW1wO1xuICAgIHRoaXMudnkgPSAodGhpcy52eSAtIE1hdGguY29zKHRoaXMuYW5nbGUpICogZyAqIERUKSAqIHRoaXMuX2RhbXA7XG4gICAgbGV0IHNwMiA9IHRoaXMudnggKiB0aGlzLnZ4ICsgdGhpcy52eSAqIHRoaXMudnk7XG4gICAgaWYgKHNwMiA+IFZNQVggKiBWTUFYKSB7IGNvbnN0IGsgPSBWTUFYIC8gTWF0aC5zcXJ0KHNwMik7IHRoaXMudnggKj0gazsgdGhpcy52eSAqPSBrOyBzcDIgPSBWTUFYICogVk1BWDsgfVxuICAgIC8vIC0tLSBmYW5zOiBhIHN0ZWFkeSBwdXNoIHdoaWxlIHRoZSBjZW50cmUgaXMgaW5zaWRlIHRoZSBhaXIgc3RyZWFtXG4gICAgY29uc3QgZmFucyA9IEwuZmFucztcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGZhbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IGZuID0gZmFuc1tpXTtcbiAgICAgIGlmIChib3hEaXN0Mih0aGlzLngsIHRoaXMueSwgZm4pID09PSAwKSB7IHRoaXMudnggKz0gZm4uZHggKiBmbi5wb3dlciAqIGYud2luZCAqIERUOyB0aGlzLnZ5ICs9IGZuLmR5ICogZm4ucG93ZXIgKiBmLndpbmQgKiBEVDsgfVxuICAgIH1cbiAgICBjb25zdCBzcGVlZEluID0gTWF0aC5zcXJ0KHNwMik7XG4gICAgdGhpcy54ICs9IHRoaXMudnggKiBEVDsgdGhpcy55ICs9IHRoaXMudnkgKiBEVDtcblxuICAgIC8vIC0tLSBzb2xpZHNcbiAgICB0aGlzLmltcGFjdCA9IDA7IHRoaXMudG91Y2ggPSBmYWxzZTtcbiAgICBjb25zdCBncmlkID0gTC5ncmlkLCBzb2xpZHMgPSBMLnNvbGlkcywgbW92ZXJzID0gTC5tb3ZlcnMsIGNyeXN0YWxzID0gTC5jcnlzdGFscztcbiAgICBmb3IgKGxldCBwYXNzID0gMDsgcGFzcyA8IDI7IHBhc3MrKykge1xuICAgICAgbGV0IGNpID0gTWF0aC5mbG9vcigodGhpcy54IC0gZ3JpZC5taW4pIC8gZ3JpZC5jZWxsKSwgY2ogPSBNYXRoLmZsb29yKCh0aGlzLnkgLSBncmlkLm1pbikgLyBncmlkLmNlbGwpO1xuICAgICAgY2kgPSBjaSA8IDAgPyAwIDogY2kgPj0gZ3JpZC5uID8gZ3JpZC5uIC0gMSA6IGNpO1xuICAgICAgY2ogPSBjaiA8IDAgPyAwIDogY2ogPj0gZ3JpZC5uID8gZ3JpZC5uIC0gMSA6IGNqO1xuICAgICAgY29uc3QgbGlzdCA9IGdyaWQubGlzdHNbY2ogKiBncmlkLm4gKyBjaV07XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxpc3QubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3QgcyA9IHNvbGlkc1tsaXN0W2ldXTtcbiAgICAgICAgY29uc3QgaW1wID0gdGhpcy5faGl0KHMsIHIsIDAsIDApO1xuICAgICAgICBpZiAoaW1wID49IDAgJiYgcy5raWNrICYmIHBhc3MgPT09IDApIHRoaXMuX2VtaXQoXCJidW1wXCIsIHMuY3gsIHMuY3ksIGxpc3RbaV0pO1xuICAgICAgfVxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBtb3ZlcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3QgbSA9IG1vdmVyc1tpXTtcbiAgICAgICAgcGF0aFBvcyhtLCB0LCBfcCk7XG4gICAgICAgIG0uYm94LmN4ID0gX3AueDsgbS5ib3guY3kgPSBfcC55O1xuICAgICAgICB0aGlzLl9oaXQobS5ib3gsIHIsIF9wLnZ4LCBfcC52eSk7XG4gICAgICB9XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNyeXN0YWxzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmICh0aGlzLmNyeXMgJiAoMSA8PCBpKSkgY29udGludWU7XG4gICAgICAgIGNvbnN0IGMgPSBjcnlzdGFsc1tpXTtcbiAgICAgICAgY29uc3QgaW1wID0gdGhpcy5faGl0KGMsIHIsIDAsIDApO1xuICAgICAgICBpZiAoaW1wID49IDAgJiYgKGYuYnJlYWtzID09PSAyIHx8IChmLmJyZWFrcyA9PT0gMSAmJiBzcGVlZEluID4gQ1JZU1RBTF9TUEVFRCkpKSB7XG4gICAgICAgICAgdGhpcy5jcnlzIHw9IDEgPDwgaTtcbiAgICAgICAgICB0aGlzLl9lbWl0KFwic2hhdHRlclwiLCBjLmN4LCBjLmN5LCBpKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICAvLyAtLS0gZG9vcnMgKHNvbGlkIHVudGlsIGV2ZXJ5IGtleSBpcyBoZWxkKSBhbmQgb25lLXdheSBnYXRlc1xuICAgIGNvbnN0IGRvb3JzID0gTC5kb29ycywgZ2F0ZXMgPSBMLmdhdGVzO1xuICAgIGlmIChkb29ycy5sZW5ndGggJiYgdGhpcy5rZXlzICE9PSBMLmtleU1hc2spIGZvciAobGV0IGkgPSAwOyBpIDwgZG9vcnMubGVuZ3RoOyBpKyspIHRoaXMuX2hpdChkb29yc1tpXSwgciwgMCwgMCk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBnYXRlcy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgZ3QgPSBnYXRlc1tpXTtcbiAgICAgIC8vIG9ubHkgdGhlIGV4aXQgZmFjZSBpcyBzb2xpZCwgYW5kIG9ubHkgYWdhaW5zdCBhIGJhbGwgY29taW5nIGJhY2tcbiAgICAgIGNvbnN0IHNkID0gKHRoaXMueCAtIGd0LmN4KSAqIGd0LmR4ICsgKHRoaXMueSAtIGd0LmN5KSAqIGd0LmR5O1xuICAgICAgaWYgKHNkIDw9IDAgfHwgc2QgPj0gcikgY29udGludWU7XG4gICAgICBjb25zdCBsYXQgPSBNYXRoLmFicygodGhpcy54IC0gZ3QuY3gpICogZ3QuZHkgLSAodGhpcy55IC0gZ3QuY3kpICogZ3QuZHgpO1xuICAgICAgaWYgKGxhdCA+IGd0LmhhbGYgKyByICogMC41KSBjb250aW51ZTtcbiAgICAgIGlmICh0aGlzLnZ4ICogZ3QuZHggKyB0aGlzLnZ5ICogZ3QuZHkgPj0gMCkgY29udGludWU7XG4gICAgICB0aGlzLl9jb250YWN0KGd0LmR4LCBndC5keSwgciAtIHNkLCAwLCAwLCAxLCAxLCAwKTtcbiAgICB9XG4gICAgaWYgKHRoaXMudG91Y2gpIHRoaXMuYWlyID0gMDsgZWxzZSB0aGlzLmFpcisrO1xuICAgIGlmICh0aGlzLmltcGFjdCA+IEhJVF9FVkVOVCkgdGhpcy5fZW1pdChcImhpdFwiLCB0aGlzLnggLSB0aGlzLm54ICogciwgdGhpcy55IC0gdGhpcy5ueSAqIHIsIHRoaXMuaW1wYWN0KTtcblxuICAgIC8vIC0tLSBwYWRzIChsYXVuY2hlcnMpOiBzZXQgdGhlIHZlbG9jaXR5IGNvbXBvbmVudCBhbG9uZyB0aGUgcGFkIGRpcmVjdGlvblxuICAgIGNvbnN0IHBhZHMgPSBMLnBhZHM7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwYWRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBwID0gcGFkc1tpXTtcbiAgICAgIGlmIChib3hEaXN0Mih0aGlzLngsIHRoaXMueSwgcCkgPCByICogcikge1xuICAgICAgICBjb25zdCB2ZCA9IHRoaXMudnggKiBwLmR4ICsgdGhpcy52eSAqIHAuZHk7XG4gICAgICAgIGlmICh2ZCA8IHAucG93ZXIgKiAwLjkpIHtcbiAgICAgICAgICB0aGlzLnZ4ICs9IChwLnBvd2VyIC0gdmQpICogcC5keDsgdGhpcy52eSArPSAocC5wb3dlciAtIHZkKSAqIHAuZHk7XG4gICAgICAgICAgdGhpcy5fZW1pdChcInBhZFwiLCBwLmN4LCBwLmN5LCBpKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIC8vIC0tLSBoYXphcmRzXG4gICAgY29uc3Qga3IgPSByICogMC44LCBraWxscyA9IEwua2lsbHM7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBraWxscy5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKGJveERpc3QyKHRoaXMueCwgdGhpcy55LCBraWxsc1tpXSkgPCBrciAqIGtyKSB7IHRoaXMuX2RpZShcInNwaWtlXCIpOyByZXR1cm47IH1cbiAgICB9XG4gICAgY29uc3QgbGFzZXJzID0gTC5sYXNlcnM7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsYXNlcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IGx6ID0gbGFzZXJzW2ldO1xuICAgICAgaWYgKGxhc2VyT24obHosIHQpICYmIGJveERpc3QyKHRoaXMueCwgdGhpcy55LCBseikgPCBrciAqIGtyKSB7IHRoaXMuX2RpZShcImxhc2VyXCIpOyByZXR1cm47IH1cbiAgICB9XG4gICAgY29uc3Qgc2F3cyA9IEwuc2F3cztcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNhd3MubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IHMgPSBzYXdzW2ldO1xuICAgICAgcGF0aFBvcyhzLCB0LCBfcCk7XG4gICAgICBjb25zdCBkeCA9IHRoaXMueCAtIF9wLngsIGR5ID0gdGhpcy55IC0gX3AueSwgcnIgPSByICogMC44NSArIHMucjtcbiAgICAgIGlmIChkeCAqIGR4ICsgZHkgKiBkeSA8IHJyICogcnIpIHsgdGhpcy5fZGllKFwic2F3XCIpOyByZXR1cm47IH1cbiAgICB9XG4gICAgY29uc3QgbGltID0gTC5oYWxmICsgNzA7XG4gICAgaWYgKHRoaXMueCA+IGxpbSB8fCB0aGlzLnggPCAtbGltIHx8IHRoaXMueSA+IGxpbSB8fCB0aGlzLnkgPCAtbGltKSB7IHRoaXMuX2RpZShcImZhbGxcIik7IHJldHVybjsgfVxuXG4gICAgLy8gLS0tIGdlbXNcbiAgICBjb25zdCBnZW1zID0gTC5nZW1zO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZ2Vtcy5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKHRoaXMuZ2VtcyAmICgxIDw8IGkpKSBjb250aW51ZTtcbiAgICAgIGNvbnN0IGR4ID0gdGhpcy54IC0gZ2Vtc1tpXS54LCBkeSA9IHRoaXMueSAtIGdlbXNbaV0ueSwgcnIgPSByICsgMTI7XG4gICAgICBpZiAoZHggKiBkeCArIGR5ICogZHkgPCByciAqIHJyKSB7XG4gICAgICAgIHRoaXMuZ2VtcyB8PSAxIDw8IGk7XG4gICAgICAgIHRoaXMuX2VtaXQoXCJnZW1cIiwgZ2Vtc1tpXS54LCBnZW1zW2ldLnksIGkpO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIC0tLSBrZXlzXG4gICAgY29uc3Qga2V5cyA9IEwua2V5cztcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGtleXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmICh0aGlzLmtleXMgJiAoMSA8PCBpKSkgY29udGludWU7XG4gICAgICBjb25zdCBkeCA9IHRoaXMueCAtIGtleXNbaV0ueCwgZHkgPSB0aGlzLnkgLSBrZXlzW2ldLnksIHJyID0gciArIDEyO1xuICAgICAgaWYgKGR4ICogZHggKyBkeSAqIGR5IDwgcnIgKiBycikge1xuICAgICAgICB0aGlzLmtleXMgfD0gMSA8PCBpO1xuICAgICAgICB0aGlzLl9lbWl0KFwia2V5XCIsIGtleXNbaV0ueCwga2V5c1tpXS55LCB0aGlzLmtleXMgPT09IEwua2V5TWFzayA/IDEgOiAwKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyAtLS0gcG9ydGFsczogc3RlcCBpbiBvbmUsIGNvbWUgb3V0IG9mIGl0cyB0d2luIHdpdGggdGhlIHNhbWUgdmVsb2NpdHlcbiAgICBjb25zdCBwb3J0cyA9IEwucG9ydHM7XG4gICAgaWYgKHBvcnRzLmxlbmd0aCkge1xuICAgICAgbGV0IG5lYXIgPSBmYWxzZSwgaGl0ID0gLTE7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHBvcnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IGR4ID0gdGhpcy54IC0gcG9ydHNbaV0ueCwgZHkgPSB0aGlzLnkgLSBwb3J0c1tpXS55LCBkMiA9IGR4ICogZHggKyBkeSAqIGR5O1xuICAgICAgICBpZiAoZDIgPCBQT1JUX0NMRUFSICogUE9SVF9DTEVBUikgbmVhciA9IHRydWU7XG4gICAgICAgIGlmIChkMiA8IFBPUlRfUiAqIFBPUlRfUikgaGl0ID0gaTtcbiAgICAgIH1cbiAgICAgIGlmICghbmVhcikgdGhpcy50cGwgPSAwO1xuICAgICAgZWxzZSBpZiAoaGl0ID49IDAgJiYgIXRoaXMudHBsKSB7XG4gICAgICAgIGNvbnN0IGEgPSBwb3J0c1toaXRdLCBiID0gcG9ydHNbYS50b107XG4gICAgICAgIHRoaXMuX2VtaXQoXCJwb3J0XCIsIGEueCwgYS55LCBoaXQpO1xuICAgICAgICB0aGlzLnggPSBiLnggKyAodGhpcy54IC0gYS54KTsgdGhpcy55ID0gYi55ICsgKHRoaXMueSAtIGEueSk7XG4gICAgICAgIHRoaXMudHBsID0gMTtcbiAgICAgICAgdGhpcy5fZW1pdChcInBvcnRcIiwgYi54LCBiLnksIGEudG8pO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIC0tLSBnb2FsXG4gICAgY29uc3QgZ3ggPSB0aGlzLnggLSBMLmdvYWwueCwgZ3kgPSB0aGlzLnkgLSBMLmdvYWwueTtcbiAgICBpZiAoZ3ggKiBneCArIGd5ICogZ3kgPCBMLmdvYWwuciAqIEwuZ29hbC5yKSB7XG4gICAgICB0aGlzLndvbiA9IHRydWU7XG4gICAgICB0aGlzLl9lbWl0KFwid2luXCIsIEwuZ29hbC54LCBMLmdvYWwueSwgMCk7XG4gICAgfVxuICB9XG5cbiAgLyoqIENvbXBhY3Qgc3RhdGUgY29weSBmb3Igc2VhcmNoIChsZXZlbCBkYXRhIGl0c2VsZiBpcyBpbW11dGFibGUpLiAqL1xuICBzbmFwKGEpIHtcbiAgICBhWzBdID0gdGhpcy54OyBhWzFdID0gdGhpcy55OyBhWzJdID0gdGhpcy52eDsgYVszXSA9IHRoaXMudnk7XG4gICAgYVs0XSA9IHRoaXMuYW5nbGU7IGFbNV0gPSB0aGlzLm9tZWdhOyBhWzZdID0gdGhpcy50YXJnZXQ7XG4gICAgYVs3XSA9IHRoaXMudGljazsgYVs4XSA9IHRoaXMuZ2VtczsgYVs5XSA9IHRoaXMuY3J5czsgYVsxMF0gPSB0aGlzLmFpcjtcbiAgICBhWzExXSA9IHRoaXMua2V5czsgYVsxMl0gPSB0aGlzLnRwbDtcbiAgICByZXR1cm4gYTtcbiAgfVxuICByZXN0b3JlKGEpIHtcbiAgICB0aGlzLnggPSBhWzBdOyB0aGlzLnkgPSBhWzFdOyB0aGlzLnZ4ID0gYVsyXTsgdGhpcy52eSA9IGFbM107XG4gICAgdGhpcy5hbmdsZSA9IGFbNF07IHRoaXMub21lZ2EgPSBhWzVdOyB0aGlzLnRhcmdldCA9IGFbNl07XG4gICAgdGhpcy50aWNrID0gYVs3XTsgdGhpcy5nZW1zID0gYVs4XTsgdGhpcy5jcnlzID0gYVs5XTsgdGhpcy5haXIgPSBhWzEwXTtcbiAgICB0aGlzLmtleXMgPSBhWzExXTsgdGhpcy50cGwgPSBhWzEyXTtcbiAgICB0aGlzLmFsaXZlID0gdHJ1ZTsgdGhpcy53b24gPSBmYWxzZTsgdGhpcy5jYXVzZSA9IFwiXCI7XG4gIH1cbn1cblxuZXhwb3J0IHsgYm94RGlzdDIsIF9ib3ggYXMgc2NyYXRjaEJveCB9O1xuIiwgIi8vIFdvcmxkIHRoZW1lcy4gQnJpZ2h0LCByZWFkYWJsZSBcInRveVwiIHBhbGV0dGVzIGZvciB3b3JsZHMgMS00OyBuZW9uIHNwYWNlIGZvciB3b3JsZCA1LlxuLy8gUnVsZSBmb3IgZXZlcnkgdGhlbWU6IGhhemFyZHMgYXJlIHRoZSBvbmx5IHJlZCB0aGluZ3Mgb24gc2NyZWVuLlxuZXhwb3J0IGNvbnN0IFRIRU1FUyA9IHtcbiAgbWVhZG93OiB7XG4gICAgZGFyazogZmFsc2UsIGJnOiBbXCIjNThjNmZmXCIsIFwiI2M4ZjJmZlwiXSxcbiAgICBmbG9vckE6IDB4ZmZmNWRhLCBmbG9vckI6IDB4ZmZlYmJkLCBwbGF0ZTogMHhkOWI1NmUsXG4gICAgd2FsbFRvcDogMHgyZmM1OWEsIHdhbGxTaWRlOiAweDFjOTI3NCwgd2FsbEJldmVsOiAweDdlZWNkMCxcbiAgICBpY2U6IDB4YmZlYWZmLCBwZWc6IDB4ZmZhNTNkLCBwZWdTaWRlOiAweGQ5N2MxNCwgYnVtcGVyOiAweGZmNWZhMiwgYnVtcGVyU2lkZTogMHhjOTM4NzgsXG4gICAgc3Bpa2U6IDB4ZmY0NDU4LCBzcGlrZURhcms6IDB4Y2YyOTQyLCBzcGlrZUJhc2U6IDB4YjgyNDNjLFxuICAgIGdlbTogMHhmZmMyMWYsIGdvYWw6IDB4N2E0YmZmLCBnb2FsQ29yZTogMHhmZmZmZmYsXG4gICAgbW92ZXI6IDB4OWE2YmZmLCBtb3ZlclNpZGU6IDB4NmM0MGQ4LCBjcnlzdGFsOiAweDZmZTNmZiwgcGFkOiAweGZmZDEzYSwgcGFkQXJyb3c6IDB4ZmZmZmZmLCBzYXc6IDB4ZGZlNmVlLCBzYXdDb3JlOiAweGZmNDQ1OCxcbiAgICBzaGFkb3c6IDB4MTUzMjRmLCBzaGFkb3dBOiAwLjIsIGFtYmllbnQ6IDAuNzQsIHN1bjogMC4zNiwgZWRnZXM6IDBcbiAgfSxcbiAgc3Vuc2V0OiB7XG4gICAgZGFyazogZmFsc2UsIGJnOiBbXCIjZmY5YThiXCIsIFwiI2ZmZDZhNVwiXSxcbiAgICBmbG9vckE6IDB4ZmZmMWU2LCBmbG9vckI6IDB4ZmZlMGNjLCBwbGF0ZTogMHhkOThmNmIsXG4gICAgd2FsbFRvcDogMHhmZjdhNTksIHdhbGxTaWRlOiAweGQxNTAyZiwgd2FsbEJldmVsOiAweGZmYjE5OSxcbiAgICBpY2U6IDB4ZDZmMWZmLCBwZWc6IDB4NGQ5NmZmLCBwZWdTaWRlOiAweDJjNmZkMSwgYnVtcGVyOiAweDhhNWNmNiwgYnVtcGVyU2lkZTogMHg2MzM2ZDYsXG4gICAgc3Bpa2U6IDB4ZTExZDQ4LCBzcGlrZURhcms6IDB4YTUxMjJmLCBzcGlrZUJhc2U6IDB4OGEwZjI4LFxuICAgIGdlbTogMHhmZmQyM2YsIGdvYWw6IDB4MWZiNmZmLCBnb2FsQ29yZTogMHhmZmZmZmYsXG4gICAgbW92ZXI6IDB4MmJiNjczLCBtb3ZlclNpZGU6IDB4MWI4YTU0LCBjcnlzdGFsOiAweDdmZTZmZiwgcGFkOiAweGZmZTE0ZCwgcGFkQXJyb3c6IDB4ZmZmZmZmLCBzYXc6IDB4ZThlZGYyLCBzYXdDb3JlOiAweGUxMWQ0OCxcbiAgICBzaGFkb3c6IDB4NGExZjFhLCBzaGFkb3dBOiAwLjIsIGFtYmllbnQ6IDAuNzYsIHN1bjogMC4zNCwgZWRnZXM6IDBcbiAgfSxcbiAgaWNlOiB7XG4gICAgZGFyazogZmFsc2UsIGJnOiBbXCIjOGZkM2Y0XCIsIFwiI2U5ZjdmZlwiXSxcbiAgICBmbG9vckE6IDB4ZjRmYmZmLCBmbG9vckI6IDB4ZGZmMWZiLCBwbGF0ZTogMHg5Y2MzZGEsXG4gICAgd2FsbFRvcDogMHg0YWE4ZmYsIHdhbGxTaWRlOiAweDJhN2ZkNiwgd2FsbEJldmVsOiAweGE5ZDZmZixcbiAgICBpY2U6IDB4ZDlmNGZmLCBwZWc6IDB4ZmZiMzQ3LCBwZWdTaWRlOiAweGQ5OGExZCwgYnVtcGVyOiAweGZmNmZhZSwgYnVtcGVyU2lkZTogMHhjZjNmODAsXG4gICAgc3Bpa2U6IDB4ZmY0NDU4LCBzcGlrZURhcms6IDB4Y2YyOTQyLCBzcGlrZUJhc2U6IDB4YjgyNDNjLFxuICAgIGdlbTogMHhmZmMyMWYsIGdvYWw6IDB4OGI1Y2Y2LCBnb2FsQ29yZTogMHhmZmZmZmYsXG4gICAgbW92ZXI6IDB4MTRiOGE2LCBtb3ZlclNpZGU6IDB4MGU4ZjgxLCBjcnlzdGFsOiAweGE1ZjNmYywgcGFkOiAweGZmZDEzYSwgcGFkQXJyb3c6IDB4ZmZmZmZmLCBzYXc6IDB4ZGZlNmVlLCBzYXdDb3JlOiAweGZmNDQ1OCxcbiAgICBzaGFkb3c6IDB4MTczYjVlLCBzaGFkb3dBOiAwLjIsIGFtYmllbnQ6IDAuNzYsIHN1bjogMC4zNCwgZWRnZXM6IDBcbiAgfSxcbiAgZmFjdG9yeToge1xuICAgIGRhcms6IGZhbHNlLCBiZzogW1wiI2ZmYjM0N1wiLCBcIiNmZmUyOWFcIl0sXG4gICAgZmxvb3JBOiAweGYzZWZlNiwgZmxvb3JCOiAweGU1ZGZkMSwgcGxhdGU6IDB4OGY4Nzc4LFxuICAgIHdhbGxUb3A6IDB4NWI2YjdmLCB3YWxsU2lkZTogMHgzZDRhNWMsIHdhbGxCZXZlbDogMHg5M2EzYjgsXG4gICAgaWNlOiAweGNmZWVmZiwgcGVnOiAweGZmOWYxYywgcGVnU2lkZTogMHhjOTdhMGEsIGJ1bXBlcjogMHhmZjVmYTIsIGJ1bXBlclNpZGU6IDB4YzkzODc4LFxuICAgIHNwaWtlOiAweGZmM2IzYiwgc3Bpa2VEYXJrOiAweGM4MWUxZSwgc3Bpa2VCYXNlOiAweDllMTUxNSxcbiAgICBnZW06IDB4ZmZjMjFmLCBnb2FsOiAweDIyYzU1ZSwgZ29hbENvcmU6IDB4ZmZmZmZmLFxuICAgIG1vdmVyOiAweDNiODJmNiwgbW92ZXJTaWRlOiAweDFkNWZkMSwgY3J5c3RhbDogMHg3ZmU2ZmYsIHBhZDogMHhmZmQxM2EsIHBhZEFycm93OiAweDNkNGE1Yywgc2F3OiAweGVlZjJmNiwgc2F3Q29yZTogMHhmZjNiM2IsXG4gICAgc2hhZG93OiAweDNhMmExMiwgc2hhZG93QTogMC4yMiwgYW1iaWVudDogMC43NCwgc3VuOiAwLjM2LCBlZGdlczogMFxuICB9LFxuICBuZW9uOiB7XG4gICAgZGFyazogdHJ1ZSwgYmc6IFtcIiMwNzBiMWZcIiwgXCIjMWIxMTQ3XCJdLFxuICAgIGZsb29yQTogMHgxMzFmNDUsIGZsb29yQjogMHgwZjE5MzgsIHBsYXRlOiAweDBhMTAyNixcbiAgICB3YWxsVG9wOiAweDFjMmI2Mywgd2FsbFNpZGU6IDB4MTAxYTQwLCB3YWxsQmV2ZWw6IDB4MjJkM2VlLFxuICAgIGljZTogMHgyYTVkOGYsIHBlZzogMHhmNTllMGIsIHBlZ1NpZGU6IDB4YjQ1MzA5LCBidW1wZXI6IDB4ZjQ3MmI2LCBidW1wZXJTaWRlOiAweGJlMTg1ZCxcbiAgICBzcGlrZTogMHhmZjNkNzEsIHNwaWtlRGFyazogMHhjODFlNTIsIHNwaWtlQmFzZTogMHg3YTEyMzMsXG4gICAgZ2VtOiAweGZhY2MxNSwgZ29hbDogMHgyMmQzZWUsIGdvYWxDb3JlOiAweGUwZjJmZSxcbiAgICBtb3ZlcjogMHhhODU1ZjcsIG1vdmVyU2lkZTogMHg2YjIxYTgsIGNyeXN0YWw6IDB4NjdlOGY5LCBwYWQ6IDB4ZmFjYzE1LCBwYWRBcnJvdzogMHgwZjE3MmEsIHNhdzogMHhlMmU4ZjAsIHNhd0NvcmU6IDB4ZmYzZDcxLFxuICAgIHNoYWRvdzogMHgwMDAwMDAsIHNoYWRvd0E6IDAuMzUsIGFtYmllbnQ6IDAuODIsIHN1bjogMC4zLCBlZGdlczogMHgyMmQzZWVcbiAgfVxufTtcblxuZXhwb3J0IGZ1bmN0aW9uIHRoZW1lT2YoaWQpIHsgcmV0dXJuIFRIRU1FU1tpZF0gfHwgVEhFTUVTLm1lYWRvdzsgfVxuIiwgIi8qIGdsb2JhbCBUSFJFRSAqL1xuLy8gVGlueSBnZW9tZXRyeSBraXQ6IGV2ZXJ5dGhpbmcgc3RhdGljIGluIGEgbGV2ZWwgaXMgbWVyZ2VkIGludG8gT05FIHZlcnRleC1jb2xvdXJlZFxuLy8gbWVzaCAob25lIGRyYXcgY2FsbCksIHBsdXMgb25lIGZsYXQgXCJkcm9wIHNoYWRvd1wiIG1lc2guXG5cbmV4cG9ydCBmdW5jdGlvbiByb3VuZFJlY3QoaHcsIGhoLCByYWQsIHNlZyA9IDMpIHtcbiAgcmFkID0gTWF0aC5tYXgoMC4wMSwgTWF0aC5taW4ocmFkLCBodywgaGgpKTtcbiAgY29uc3QgcHRzID0gW107XG4gIGNvbnN0IGNvcm5lcnMgPSBbW2h3IC0gcmFkLCBoaCAtIHJhZCwgMF0sIFstKGh3IC0gcmFkKSwgaGggLSByYWQsIDFdLCBbLShodyAtIHJhZCksIC0oaGggLSByYWQpLCAyXSwgW2h3IC0gcmFkLCAtKGhoIC0gcmFkKSwgM11dO1xuICBmb3IgKGNvbnN0IFtjeCwgY3ksIHFdIG9mIGNvcm5lcnMpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8PSBzZWc7IGkrKykge1xuICAgICAgY29uc3QgYSA9IChxICsgaSAvIHNlZykgKiBNYXRoLlBJICogMC41O1xuICAgICAgcHRzLnB1c2goW2N4ICsgTWF0aC5jb3MoYSkgKiByYWQsIGN5ICsgTWF0aC5zaW4oYSkgKiByYWRdKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHB0cztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNpcmNsZVB0cyhyLCBuID0gMTYpIHtcbiAgY29uc3QgcHRzID0gW107XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgbjsgaSsrKSB7IGNvbnN0IGEgPSAoaSAvIG4pICogTWF0aC5QSSAqIDI7IHB0cy5wdXNoKFtNYXRoLmNvcyhhKSAqIHIsIE1hdGguc2luKGEpICogcl0pOyB9XG4gIHJldHVybiBwdHM7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzdGFyUHRzKHIsIHRlZXRoID0gMTAsIGlubmVyID0gMC43NCkge1xuICBjb25zdCBwdHMgPSBbXTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCB0ZWV0aCAqIDI7IGkrKykgeyBjb25zdCBhID0gKGkgLyAodGVldGggKiAyKSkgKiBNYXRoLlBJICogMiwgcnIgPSBpICUgMiA/IHIgKiBpbm5lciA6IHI7IHB0cy5wdXNoKFtNYXRoLmNvcyhhKSAqIHJyLCBNYXRoLnNpbihhKSAqIHJyXSk7IH1cbiAgcmV0dXJuIHB0cztcbn1cblxuY29uc3QgcmdiID0gKGhleCkgPT4gWygoaGV4ID4+IDE2KSAmIDI1NSkgLyAyNTUsICgoaGV4ID4+IDgpICYgMjU1KSAvIDI1NSwgKGhleCAmIDI1NSkgLyAyNTVdO1xuXG5leHBvcnQgY2xhc3MgR2VvQnVpbGRlciB7XG4gIGNvbnN0cnVjdG9yKCkgeyB0aGlzLnAgPSBbXTsgdGhpcy5uID0gW107IHRoaXMuYyA9IFtdOyB9XG4gIGdldCBlbXB0eSgpIHsgcmV0dXJuIHRoaXMucC5sZW5ndGggPT09IDA7IH1cblxuICB0cmkoYXgsIGF5LCBheiwgYngsIGJ5LCBieiwgY3gsIGN5LCBjeiwgY29sKSB7XG4gICAgLy8gZmxhdCBub3JtYWwgZnJvbSB0aGUgd2luZGluZ1xuICAgIGNvbnN0IHV4ID0gYnggLSBheCwgdXkgPSBieSAtIGF5LCB1eiA9IGJ6IC0gYXosIHZ4ID0gY3ggLSBheCwgdnkgPSBjeSAtIGF5LCB2eiA9IGN6IC0gYXo7XG4gICAgbGV0IG54ID0gdXkgKiB2eiAtIHV6ICogdnksIG55ID0gdXogKiB2eCAtIHV4ICogdnosIG56ID0gdXggKiB2eSAtIHV5ICogdng7XG4gICAgY29uc3QgbCA9IE1hdGguaHlwb3QobngsIG55LCBueikgfHwgMTsgbnggLz0gbDsgbnkgLz0gbDsgbnogLz0gbDtcbiAgICB0aGlzLnAucHVzaChheCwgYXksIGF6LCBieCwgYnksIGJ6LCBjeCwgY3ksIGN6KTtcbiAgICB0aGlzLm4ucHVzaChueCwgbnksIG56LCBueCwgbnksIG56LCBueCwgbnksIG56KTtcbiAgICBjb25zdCBrID0gdHlwZW9mIGNvbCA9PT0gXCJudW1iZXJcIiA/IHJnYihjb2wpIDogY29sO1xuICAgIHRoaXMuYy5wdXNoKGtbMF0sIGtbMV0sIGtbMl0sIGtbMF0sIGtbMV0sIGtbMl0sIGtbMF0sIGtbMV0sIGtbMl0pO1xuICB9XG4gIHF1YWQoYSwgYiwgYywgZCwgY29sKSB7IC8vIGEsYixjLGQgY291bnRlci1jbG9ja3dpc2UsIGVhY2ggW3gseSx6XVxuICAgIHRoaXMudHJpKGFbMF0sIGFbMV0sIGFbMl0sIGJbMF0sIGJbMV0sIGJbMl0sIGNbMF0sIGNbMV0sIGNbMl0sIGNvbCk7XG4gICAgdGhpcy50cmkoYVswXSwgYVsxXSwgYVsyXSwgY1swXSwgY1sxXSwgY1syXSwgZFswXSwgZFsxXSwgZFsyXSwgY29sKTtcbiAgfVxuXG4gIC8qKiBGbGF0IHBvbHlnb24gKGZhbiBhcm91bmQgdGhlIGNlbnRyb2lkKSBmYWNpbmcgK3ouIHB0cyBhcmUgbG9jYWwsIHBsYWNlZCBhdCAoY3gsY3kpIHJvdGF0ZWQgYnkgKGNzLHNuKS4gKi9cbiAgZmxhdChwdHMsIGN4LCBjeSwgY3MsIHNuLCB6LCBjb2wpIHtcbiAgICBjb25zdCBuID0gcHRzLmxlbmd0aDtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG47IGkrKykge1xuICAgICAgY29uc3QgYSA9IHB0c1tpXSwgYiA9IHB0c1soaSArIDEpICUgbl07XG4gICAgICB0aGlzLnRyaShjeCwgY3ksIHosIGN4ICsgYVswXSAqIGNzIC0gYVsxXSAqIHNuLCBjeSArIGFbMF0gKiBzbiArIGFbMV0gKiBjcywgeiwgY3ggKyBiWzBdICogY3MgLSBiWzFdICogc24sIGN5ICsgYlswXSAqIHNuICsgYlsxXSAqIGNzLCB6LCBjb2wpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBFeHRydWRlZCBibG9jayB3aXRoIGEgYmV2ZWxsZWQgdG9wLiBgb3V0ZXJgIGFuZCBgaW5uZXJgIGFyZSBtYXRjaGluZyBvdXRsaW5lc1xuICAgKiAoaW5uZXIgPSB0aGUgc21hbGxlciB0b3AgZmFjZSkuIEV4dHJ1ZGVzIGZyb20gejAgdXAgdG8gejEuXG4gICAqL1xuICBwcmlzbShvdXRlciwgaW5uZXIsIGN4LCBjeSwgY3MsIHNuLCB6MCwgejEsIGJldmVsLCBjb2xUb3AsIGNvbFNpZGUsIGNvbEJldmVsKSB7XG4gICAgY29uc3QgbiA9IG91dGVyLmxlbmd0aCwgemIgPSB6MSAtIGJldmVsO1xuICAgIGNvbnN0IFcgPSAocCkgPT4gW2N4ICsgcFswXSAqIGNzIC0gcFsxXSAqIHNuLCBjeSArIHBbMF0gKiBzbiArIHBbMV0gKiBjc107XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBuOyBpKyspIHtcbiAgICAgIGNvbnN0IGogPSAoaSArIDEpICUgbjtcbiAgICAgIGNvbnN0IG8wID0gVyhvdXRlcltpXSksIG8xID0gVyhvdXRlcltqXSksIGkwID0gVyhpbm5lcltpXSksIGkxID0gVyhpbm5lcltqXSk7XG4gICAgICB0aGlzLnRyaShjeCwgY3ksIHoxLCBpMFswXSwgaTBbMV0sIHoxLCBpMVswXSwgaTFbMV0sIHoxLCBjb2xUb3ApO1xuICAgICAgdGhpcy5xdWFkKFtvMFswXSwgbzBbMV0sIHpiXSwgW28xWzBdLCBvMVsxXSwgemJdLCBbaTFbMF0sIGkxWzFdLCB6MV0sIFtpMFswXSwgaTBbMV0sIHoxXSwgY29sQmV2ZWwpO1xuICAgICAgdGhpcy5xdWFkKFtvMFswXSwgbzBbMV0sIHowXSwgW28xWzBdLCBvMVsxXSwgejBdLCBbbzFbMF0sIG8xWzFdLCB6Yl0sIFtvMFswXSwgbzBbMV0sIHpiXSwgY29sU2lkZSk7XG4gICAgfVxuICB9XG5cbiAgLyoqIFB5cmFtaWQgc3Bpa2U6IGJhc2UgY2VudHJlICh4LHkseiksIHVuaXQgZGlyZWN0aW9uIChkeCxkeSxkeiksIGJhc2UgcmFkaXVzLCBoZWlnaHQuICovXG4gIHNwaWtlKHgsIHksIHosIGR4LCBkeSwgZHosIHJhZCwgaCwgY29sLCBjb2xEYXJrKSB7XG4gICAgLy8gb3J0aG9ub3JtYWwgYmFzaXMgKHUsIHYpIHBlcnBlbmRpY3VsYXIgdG8gZFxuICAgIGxldCB1eCwgdXksIHV6O1xuICAgIGlmIChNYXRoLmFicyhkeikgPiAwLjkpIHsgdXggPSAxOyB1eSA9IDA7IHV6ID0gMDsgfSBlbHNlIHsgdXggPSAtZHk7IHV5ID0gZHg7IHV6ID0gMDsgY29uc3QgbCA9IE1hdGguaHlwb3QodXgsIHV5KSB8fCAxOyB1eCAvPSBsOyB1eSAvPSBsOyB9XG4gICAgY29uc3QgdnggPSBkeSAqIHV6IC0gZHogKiB1eSwgdnkgPSBkeiAqIHV4IC0gZHggKiB1eiwgdnogPSBkeCAqIHV5IC0gZHkgKiB1eDtcbiAgICBjb25zdCBheCA9IHggKyBkeCAqIGgsIGF5ID0geSArIGR5ICogaCwgYXogPSB6ICsgZHogKiBoO1xuICAgIGNvbnN0IHNpZGVzID0gNDtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNpZGVzOyBpKyspIHtcbiAgICAgIGNvbnN0IGEwID0gKGkgLyBzaWRlcykgKiBNYXRoLlBJICogMiArIE1hdGguUEkgLyA0LCBhMSA9ICgoaSArIDEpIC8gc2lkZXMpICogTWF0aC5QSSAqIDIgKyBNYXRoLlBJIC8gNDtcbiAgICAgIGNvbnN0IHAwID0gW3ggKyAoTWF0aC5jb3MoYTApICogdXggKyBNYXRoLnNpbihhMCkgKiB2eCkgKiByYWQsIHkgKyAoTWF0aC5jb3MoYTApICogdXkgKyBNYXRoLnNpbihhMCkgKiB2eSkgKiByYWQsIHogKyAoTWF0aC5jb3MoYTApICogdXogKyBNYXRoLnNpbihhMCkgKiB2eikgKiByYWRdO1xuICAgICAgY29uc3QgcDEgPSBbeCArIChNYXRoLmNvcyhhMSkgKiB1eCArIE1hdGguc2luKGExKSAqIHZ4KSAqIHJhZCwgeSArIChNYXRoLmNvcyhhMSkgKiB1eSArIE1hdGguc2luKGExKSAqIHZ5KSAqIHJhZCwgeiArIChNYXRoLmNvcyhhMSkgKiB1eiArIE1hdGguc2luKGExKSAqIHZ6KSAqIHJhZF07XG4gICAgICB0aGlzLnRyaShwMFswXSwgcDBbMV0sIHAwWzJdLCBwMVswXSwgcDFbMV0sIHAxWzJdLCBheCwgYXksIGF6LCBpICUgMiA/IGNvbERhcmsgOiBjb2wpO1xuICAgIH1cbiAgfVxuXG4gIGJ1aWxkKCkge1xuICAgIGNvbnN0IGcgPSBuZXcgVEhSRUUuQnVmZmVyR2VvbWV0cnkoKTtcbiAgICBnLnNldEF0dHJpYnV0ZShcInBvc2l0aW9uXCIsIG5ldyBUSFJFRS5GbG9hdDMyQnVmZmVyQXR0cmlidXRlKHRoaXMucCwgMykpO1xuICAgIGcuc2V0QXR0cmlidXRlKFwibm9ybWFsXCIsIG5ldyBUSFJFRS5GbG9hdDMyQnVmZmVyQXR0cmlidXRlKHRoaXMubiwgMykpO1xuICAgIGcuc2V0QXR0cmlidXRlKFwiY29sb3JcIiwgbmV3IFRIUkVFLkZsb2F0MzJCdWZmZXJBdHRyaWJ1dGUodGhpcy5jLCAzKSk7XG4gICAgcmV0dXJuIGc7XG4gIH1cbn1cbiIsICIvKiBnbG9iYWwgVEhSRUUgKi9cbi8vIFBvb2xlZCBwYXJ0aWNsZXMgKG9uZSBJbnN0YW5jZWRNZXNoID0gb25lIGRyYXcgY2FsbCkgKyBwb29sZWQgc2hvY2t3YXZlIHJpbmdzLlxuLy8gUG9zaXRpb25zIGFyZSBhcmVuYS1sb2NhbCAodGhlIHBvb2wgbGl2ZXMgaW5zaWRlIHRoZSByb3RhdGluZyB3b3JsZCBncm91cCkuXG5cbmNvbnN0IF9tID0gbmV3IFRIUkVFLk1hdHJpeDQoKSwgX3EgPSBuZXcgVEhSRUUuUXVhdGVybmlvbigpLCBfcyA9IG5ldyBUSFJFRS5WZWN0b3IzKCksIF92ID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcbmNvbnN0IF9lID0gbmV3IFRIUkVFLkV1bGVyKCksIF9jID0gbmV3IFRIUkVFLkNvbG9yKCk7XG5cbmV4cG9ydCBjbGFzcyBQYXJ0aWNsZXMge1xuICBjb25zdHJ1Y3RvcihwYXJlbnQsIGNvdW50KSB7XG4gICAgdGhpcy5jb3VudCA9IGNvdW50O1xuICAgIHRoaXMubWVzaCA9IG5ldyBUSFJFRS5JbnN0YW5jZWRNZXNoKG5ldyBUSFJFRS5QbGFuZUdlb21ldHJ5KDEsIDEpLCBuZXcgVEhSRUUuTWVzaEJhc2ljTWF0ZXJpYWwoeyBjb2xvcjogMHhmZmZmZmYsIHNpZGU6IFRIUkVFLkRvdWJsZVNpZGUgfSksIGNvdW50KTtcbiAgICB0aGlzLm1lc2guZnJ1c3R1bUN1bGxlZCA9IGZhbHNlO1xuICAgIHRoaXMubWVzaC5yZW5kZXJPcmRlciA9IDU7XG4gICAgdGhpcy5wID0gW107XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjb3VudDsgaSsrKSB7XG4gICAgICB0aGlzLnAucHVzaCh7IGxpZmU6IDAsIG1heDogMSwgeDogMCwgeTogMCwgejogMCwgdng6IDAsIHZ5OiAwLCB2ejogMCwgcng6IDAsIHJ5OiAwLCByejogMCwgd3g6IDAsIHd5OiAwLCB3ejogMCwgc2l6ZTogMSwgZzogMCwgZHJhZzogMCwgZ3JvdzogMCB9KTtcbiAgICAgIF9tLm1ha2VTY2FsZSgwLCAwLCAwKTsgdGhpcy5tZXNoLnNldE1hdHJpeEF0KGksIF9tKTsgdGhpcy5tZXNoLnNldENvbG9yQXQoaSwgX2Muc2V0SGV4KDB4ZmZmZmZmKSk7XG4gICAgfVxuICAgIHRoaXMubmV4dCA9IDA7XG4gICAgcGFyZW50LmFkZCh0aGlzLm1lc2gpO1xuXG4gICAgdGhpcy5yaW5ncyA9IFtdO1xuICAgIGNvbnN0IHJnID0gbmV3IFRIUkVFLlJpbmdHZW9tZXRyeSgwLjgyLCAxLCAyOCk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCA1OyBpKyspIHtcbiAgICAgIGNvbnN0IG0gPSBuZXcgVEhSRUUuTWVzaChyZywgbmV3IFRIUkVFLk1lc2hCYXNpY01hdGVyaWFsKHsgY29sb3I6IDB4ZmZmZmZmLCB0cmFuc3BhcmVudDogdHJ1ZSwgb3BhY2l0eTogMCwgZGVwdGhXcml0ZTogZmFsc2UsIHNpZGU6IFRIUkVFLkRvdWJsZVNpZGUgfSkpO1xuICAgICAgbS52aXNpYmxlID0gZmFsc2U7IG0ucmVuZGVyT3JkZXIgPSA2O1xuICAgICAgcGFyZW50LmFkZChtKTtcbiAgICAgIHRoaXMucmluZ3MucHVzaCh7IG0sIGxpZmU6IDAsIG1heDogMSwgcjA6IDEsIHIxOiAxIH0pO1xuICAgIH1cbiAgICB0aGlzLnJpbmdOZXh0ID0gMDtcbiAgfVxuXG4gIHNwYXduKG8pIHtcbiAgICBjb25zdCBwID0gdGhpcy5wW3RoaXMubmV4dF07XG4gICAgY29uc3QgaSA9IHRoaXMubmV4dDtcbiAgICB0aGlzLm5leHQgPSAodGhpcy5uZXh0ICsgMSkgJSB0aGlzLmNvdW50O1xuICAgIHAubGlmZSA9IHAubWF4ID0gby5saWZlIHx8IDAuNjtcbiAgICBwLnggPSBvLng7IHAueSA9IG8ueTsgcC56ID0gby56ID09PSB1bmRlZmluZWQgPyAxNCA6IG8uejtcbiAgICBwLnZ4ID0gby52eCB8fCAwOyBwLnZ5ID0gby52eSB8fCAwOyBwLnZ6ID0gby52eiB8fCAwO1xuICAgIHAucnggPSBNYXRoLnJhbmRvbSgpICogNi4yODsgcC5yeSA9IE1hdGgucmFuZG9tKCkgKiA2LjI4OyBwLnJ6ID0gTWF0aC5yYW5kb20oKSAqIDYuMjg7XG4gICAgY29uc3Qgc3BpbiA9IG8uc3BpbiA9PT0gdW5kZWZpbmVkID8gOCA6IG8uc3BpbjtcbiAgICBwLnd4ID0gKE1hdGgucmFuZG9tKCkgLSAwLjUpICogc3BpbjsgcC53eSA9IChNYXRoLnJhbmRvbSgpIC0gMC41KSAqIHNwaW47IHAud3ogPSAoTWF0aC5yYW5kb20oKSAtIDAuNSkgKiBzcGluO1xuICAgIHAuc2l6ZSA9IG8uc2l6ZSB8fCA0OyBwLmcgPSBvLmcgPT09IHVuZGVmaW5lZCA/IDAgOiBvLmc7IHAuZHJhZyA9IG8uZHJhZyB8fCAwOyBwLmdyb3cgPSBvLmdyb3cgfHwgMDtcbiAgICBpZiAoby5mbGF0KSB7IHAucnggPSAwOyBwLnJ5ID0gMDsgcC53eCA9IDA7IHAud3kgPSAwOyB9XG4gICAgdGhpcy5tZXNoLnNldENvbG9yQXQoaSwgX2Muc2V0SGV4KG8uY29sb3IgPT09IHVuZGVmaW5lZCA/IDB4ZmZmZmZmIDogby5jb2xvcikpO1xuICAgIHRoaXMubWVzaC5pbnN0YW5jZUNvbG9yLm5lZWRzVXBkYXRlID0gdHJ1ZTtcbiAgfVxuXG4gIC8qKiBSYWRpYWwgYnVyc3QuIG9wdHM6IHsgbiwgc3BlZWQsIGNvbG9yIHwgY29sb3JzW10sIHNpemUsIGxpZmUsIGcsIHogfSAqL1xuICBidXJzdCh4LCB5LCBvID0ge30pIHtcbiAgICBjb25zdCBuID0gby5uIHx8IDE0LCBzcCA9IG8uc3BlZWQgfHwgMTYwO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbjsgaSsrKSB7XG4gICAgICBjb25zdCBhID0gTWF0aC5yYW5kb20oKSAqIDYuMjgzLCB2ID0gc3AgKiAoMC4zNSArIE1hdGgucmFuZG9tKCkgKiAwLjc1KTtcbiAgICAgIHRoaXMuc3Bhd24oe1xuICAgICAgICB4LCB5LCB6OiBvLnosIHZ4OiBNYXRoLmNvcyhhKSAqIHYgKyAoby52eCB8fCAwKSwgdnk6IE1hdGguc2luKGEpICogdiArIChvLnZ5IHx8IDApLCB2ejogKE1hdGgucmFuZG9tKCkgLSAwLjIpICogc3AgKiAwLjUsXG4gICAgICAgIGNvbG9yOiBvLmNvbG9ycyA/IG8uY29sb3JzW2kgJSBvLmNvbG9ycy5sZW5ndGhdIDogby5jb2xvciwgc2l6ZTogKG8uc2l6ZSB8fCA0KSAqICgwLjYgKyBNYXRoLnJhbmRvbSgpICogMC44KSxcbiAgICAgICAgbGlmZTogKG8ubGlmZSB8fCAwLjYpICogKDAuNyArIE1hdGgucmFuZG9tKCkgKiAwLjYpLCBnOiBvLmcsIGRyYWc6IG8uZHJhZyA9PT0gdW5kZWZpbmVkID8gMS42IDogby5kcmFnXG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICByaW5nKHgsIHksIGNvbG9yLCByMCA9IDYsIHIxID0gNDYsIGxpZmUgPSAwLjM1KSB7XG4gICAgY29uc3QgciA9IHRoaXMucmluZ3NbdGhpcy5yaW5nTmV4dF07XG4gICAgdGhpcy5yaW5nTmV4dCA9ICh0aGlzLnJpbmdOZXh0ICsgMSkgJSB0aGlzLnJpbmdzLmxlbmd0aDtcbiAgICByLmxpZmUgPSByLm1heCA9IGxpZmU7IHIucjAgPSByMDsgci5yMSA9IHIxO1xuICAgIHIubS5wb3NpdGlvbi5zZXQoeCwgeSwgMTYpOyByLm0ubWF0ZXJpYWwuY29sb3Iuc2V0SGV4KGNvbG9yKTsgci5tLnZpc2libGUgPSB0cnVlO1xuICB9XG5cbiAgLyoqIEBwYXJhbSBneCxneSBhcmVuYS1sb2NhbCBncmF2aXR5IGRpcmVjdGlvbiAodW5pdCkgc28gZGVicmlzIGZhbGxzIFwic2NyZWVuLWRvd25cIiAqL1xuICB1cGRhdGUoZHQsIGd4LCBneSkge1xuICAgIGNvbnN0IHBzID0gdGhpcy5wO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IHAgPSBwc1tpXTtcbiAgICAgIGlmIChwLmxpZmUgPD0gMCkgY29udGludWU7XG4gICAgICBwLmxpZmUgLT0gZHQ7XG4gICAgICBpZiAocC5saWZlIDw9IDApIHsgX20ubWFrZVNjYWxlKDAsIDAsIDApOyB0aGlzLm1lc2guc2V0TWF0cml4QXQoaSwgX20pOyBjb250aW51ZTsgfVxuICAgICAgaWYgKHAuZykgeyBwLnZ4ICs9IGd4ICogcC5nICogZHQ7IHAudnkgKz0gZ3kgKiBwLmcgKiBkdDsgfVxuICAgICAgaWYgKHAuZHJhZykgeyBjb25zdCBrID0gTWF0aC5tYXgoMCwgMSAtIHAuZHJhZyAqIGR0KTsgcC52eCAqPSBrOyBwLnZ5ICo9IGs7IHAudnogKj0gazsgfVxuICAgICAgcC54ICs9IHAudnggKiBkdDsgcC55ICs9IHAudnkgKiBkdDsgcC56ICs9IHAudnogKiBkdDtcbiAgICAgIHAucnggKz0gcC53eCAqIGR0OyBwLnJ5ICs9IHAud3kgKiBkdDsgcC5yeiArPSBwLnd6ICogZHQ7XG4gICAgICBjb25zdCB0ID0gcC5saWZlIC8gcC5tYXg7XG4gICAgICBjb25zdCBzID0gcC5zaXplICogKHAuZ3JvdyA/IDEgKyAoMSAtIHQpICogcC5ncm93IDogMSkgKiAodCA8IDAuNSA/IHQgKiAyIDogMSk7XG4gICAgICBfZS5zZXQocC5yeCwgcC5yeSwgcC5yeik7IF9xLnNldEZyb21FdWxlcihfZSk7IF9zLnNldChzLCBzLCBzKTsgX3Yuc2V0KHAueCwgcC55LCBwLnopO1xuICAgICAgX20uY29tcG9zZShfdiwgX3EsIF9zKTtcbiAgICAgIHRoaXMubWVzaC5zZXRNYXRyaXhBdChpLCBfbSk7XG4gICAgfVxuICAgIHRoaXMubWVzaC5pbnN0YW5jZU1hdHJpeC5uZWVkc1VwZGF0ZSA9IHRydWU7XG4gICAgZm9yIChjb25zdCByIG9mIHRoaXMucmluZ3MpIHtcbiAgICAgIGlmIChyLmxpZmUgPD0gMCkgY29udGludWU7XG4gICAgICByLmxpZmUgLT0gZHQ7XG4gICAgICBpZiAoci5saWZlIDw9IDApIHsgci5tLnZpc2libGUgPSBmYWxzZTsgY29udGludWU7IH1cbiAgICAgIGNvbnN0IHQgPSAxIC0gci5saWZlIC8gci5tYXgsIHMgPSByLnIwICsgKHIucjEgLSByLnIwKSAqICgxIC0gKDEgLSB0KSAqICgxIC0gdCkpO1xuICAgICAgci5tLnNjYWxlLnNldChzLCBzLCAxKTsgci5tLm1hdGVyaWFsLm9wYWNpdHkgPSAoMSAtIHQpICogMC44NTtcbiAgICB9XG4gIH1cblxuICBjbGVhcigpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMucC5sZW5ndGg7IGkrKykgeyB0aGlzLnBbaV0ubGlmZSA9IDA7IF9tLm1ha2VTY2FsZSgwLCAwLCAwKTsgdGhpcy5tZXNoLnNldE1hdHJpeEF0KGksIF9tKTsgfVxuICAgIHRoaXMubWVzaC5pbnN0YW5jZU1hdHJpeC5uZWVkc1VwZGF0ZSA9IHRydWU7XG4gICAgZm9yIChjb25zdCByIG9mIHRoaXMucmluZ3MpIHsgci5saWZlID0gMDsgci5tLnZpc2libGUgPSBmYWxzZTsgfVxuICB9XG59XG4iLCAiLyogZ2xvYmFsIFRIUkVFICovXG4vLyBCYWxsIHNraW5zLCBkcmF3biBpbiBjb2RlIChubyBpbWFnZSBmaWxlcywgbm90aGluZyB0byBsaWNlbnNlKS5cbi8vIFRoZSB0ZXh0dXJlIGlzIGFuIGVxdWlyZWN0YW5ndWxhciBtYXA7IHRoZSBiYWxsIGlzIHNob3duIHBvbGUtb24gYW5kIHNwaW5zIGFib3V0XG4vLyB0aGF0IHBvbGUsIHNvIHdlZGdlIC8gcmluZyBwYXR0ZXJucyByZWFkIGNsZWFybHkgYXMgXCJyb2xsaW5nXCIuXG5cbmV4cG9ydCBjb25zdCBTS0lOUyA9IFtcbiAgeyBpZDogXCJjbGFzc2ljXCIsIGNvc3Q6IDAsICAgYTogXCIjZmY3YTFhXCIsIGI6IFwiI2ZmZmZmZlwiLCBraW5kOiBcIndlZGdlXCIsIG46IDYsICB0cmFpbDogMHhmZmEyNGQgfSxcbiAgeyBpZDogXCJtaW50XCIsICAgIGNvc3Q6IDMwLCAgYTogXCIjMTJjOGEwXCIsIGI6IFwiI2ZmZmZmZlwiLCBraW5kOiBcIndlZGdlXCIsIG46IDgsICB0cmFpbDogMHg2ZmYwZDIgfSxcbiAgeyBpZDogXCJiZXJyeVwiLCAgIGNvc3Q6IDQ1LCAgYTogXCIjZmYzZDgxXCIsIGI6IFwiI2ZmZTNlZVwiLCBraW5kOiBcInN3aXJsXCIsIG46IDUsICB0cmFpbDogMHhmZjhiYjUgfSxcbiAgeyBpZDogXCJvY2VhblwiLCAgIGNvc3Q6IDYwLCAgYTogXCIjMWU3YmZmXCIsIGI6IFwiI2JmZTJmZlwiLCBraW5kOiBcInJpbmdzXCIsIG46IDQsICB0cmFpbDogMHg3ZGI4ZmYgfSxcbiAgeyBpZDogXCJiZWVcIiwgICAgIGNvc3Q6IDgwLCAgYTogXCIjZmZkMjFmXCIsIGI6IFwiIzJiMmIyYlwiLCBraW5kOiBcIndlZGdlXCIsIG46IDEwLCB0cmFpbDogMHhmZmU0NmIgfSxcbiAgeyBpZDogXCJtZWxvblwiLCAgIGNvc3Q6IDEwMCwgYTogXCIjMmZiMzQ0XCIsIGI6IFwiIzBmN2EyYVwiLCBraW5kOiBcIndlZGdlXCIsIG46IDEyLCB0cmFpbDogMHg4YmUyOGYsIGNvcmU6IFwiI2ZmNWE2ZVwiIH0sXG4gIHsgaWQ6IFwiZWlnaHRcIiwgICBjb3N0OiAxMjAsIGE6IFwiIzIwMjMyZVwiLCBiOiBcIiNmZmZmZmZcIiwga2luZDogXCJkb3RcIiwgICBuOiAxLCAgdHJhaWw6IDB4OWFhM2I4IH0sXG4gIHsgaWQ6IFwidGFyZ2V0XCIsICBjb3N0OiAxNTAsIGE6IFwiI2UxMWQ0OFwiLCBiOiBcIiNmZmZmZmZcIiwga2luZDogXCJyaW5nc1wiLCBuOiA1LCAgdHJhaWw6IDB4ZmY4Y2EzIH0sXG4gIHsgaWQ6IFwiZ2FsYXh5XCIsICBjb3N0OiAyMDAsIGE6IFwiIzViMjFiNlwiLCBiOiBcIiMyMmQzZWVcIiwga2luZDogXCJzd2lybFwiLCBuOiAzLCAgdHJhaWw6IDB4YTc4YmZhLCBzdGFyczogdHJ1ZSB9LFxuICB7IGlkOiBcImdvbGRcIiwgICAgY29zdDogMzAwLCBhOiBcIiNmZmJmMDBcIiwgYjogXCIjZmZmM2IwXCIsIGtpbmQ6IFwic3dpcmxcIiwgbjogNywgIHRyYWlsOiAweGZmZTA4YSB9XG5dO1xuXG5leHBvcnQgZnVuY3Rpb24gc2tpbkJ5SWQoaWQpIHsgcmV0dXJuIFNLSU5TLmZpbmQoKHMpID0+IHMuaWQgPT09IGlkKSB8fCBTS0lOU1swXTsgfVxuXG5jb25zdCBjYWNoZSA9IG5ldyBNYXAoKTtcblxuLyoqIEByZXR1cm5zIFRIUkVFLkNhbnZhc1RleHR1cmUgKDI1NngxMjggZXF1aXJlY3QpICovXG5leHBvcnQgZnVuY3Rpb24gc2tpblRleHR1cmUoaWQpIHtcbiAgaWYgKGNhY2hlLmhhcyhpZCkpIHJldHVybiBjYWNoZS5nZXQoaWQpO1xuICBjb25zdCBzID0gc2tpbkJ5SWQoaWQpLCBXID0gMjU2LCBIID0gMTI4O1xuICBjb25zdCBjdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJjYW52YXNcIik7IGN2LndpZHRoID0gVzsgY3YuaGVpZ2h0ID0gSDtcbiAgY29uc3QgZyA9IGN2LmdldENvbnRleHQoXCIyZFwiKTtcbiAgZy5maWxsU3R5bGUgPSBzLmI7IGcuZmlsbFJlY3QoMCwgMCwgVywgSCk7XG4gIGcuZmlsbFN0eWxlID0gcy5hO1xuICBpZiAocy5raW5kID09PSBcIndlZGdlXCIpIHtcbiAgICBjb25zdCB3ID0gVyAvIHMubjtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHMubjsgaSArPSAyKSBnLmZpbGxSZWN0KGkgKiB3LCAwLCB3LCBIKTtcbiAgfSBlbHNlIGlmIChzLmtpbmQgPT09IFwic3dpcmxcIikge1xuICAgIGNvbnN0IHcgPSBXIC8gcy5uO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcy5uOyBpKyspIHtcbiAgICAgIGcuYmVnaW5QYXRoKCk7XG4gICAgICBnLm1vdmVUbyhpICogdywgMCk7IGcubGluZVRvKGkgKiB3ICsgdyAqIDAuNSwgMCk7XG4gICAgICBnLmxpbmVUbyhpICogdyArIHcgKiAxLjUsIEgpOyBnLmxpbmVUbyhpICogdyArIHcsIEgpOyBnLmNsb3NlUGF0aCgpOyBnLmZpbGwoKTtcbiAgICAgIC8vIHdyYXAtYXJvdW5kIHBpZWNlXG4gICAgICBnLmJlZ2luUGF0aCgpOyBnLm1vdmVUbyhpICogdyAtIFcsIDApOyBnLmxpbmVUbyhpICogdyArIHcgKiAwLjUgLSBXLCAwKTsgZy5saW5lVG8oaSAqIHcgKyB3ICogMS41IC0gVywgSCk7IGcubGluZVRvKGkgKiB3ICsgdyAtIFcsIEgpOyBnLmNsb3NlUGF0aCgpOyBnLmZpbGwoKTtcbiAgICB9XG4gIH0gZWxzZSBpZiAocy5raW5kID09PSBcInJpbmdzXCIpIHtcbiAgICAvLyB0aGUgdmlzaWJsZSBoZW1pc3BoZXJlIGlzIHRoZSB0b3AgaGFsZiBvZiB0aGUgdGV4dHVyZSAodiBmcm9tIHBvbGUgdG8gZXF1YXRvcilcbiAgICBjb25zdCBiYW5kID0gKEggLyAyKSAvIChzLm4gKiAyIC0gMSk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzLm47IGkrKykgeyBnLmZpbGxSZWN0KDAsIGkgKiAyICogYmFuZCwgVywgYmFuZCk7IGcuZmlsbFJlY3QoMCwgSCAtIChpICogMiArIDEpICogYmFuZCwgVywgYmFuZCk7IH1cbiAgfSBlbHNlIGlmIChzLmtpbmQgPT09IFwiZG90XCIpIHtcbiAgICBnLmZpbGxSZWN0KDAsIDAsIFcsIEgpO1xuICAgIGcuZmlsbFN0eWxlID0gcy5iOyBnLmZpbGxSZWN0KDAsIDAsIFcsIEggKiAwLjIpOyAgICAgICAgICAvLyB3aGl0ZSBjYXAgYXQgdGhlIHZpc2libGUgcG9sZVxuICAgIGcuZmlsbFN0eWxlID0gcy5hOyBnLmZpbGxSZWN0KFcgKiAwLjQyLCBIICogMC4wNCwgVyAqIDAuMTYsIEggKiAwLjA5KTtcbiAgICBnLmZpbGxTdHlsZSA9IHMuYjsgZy5maWxsUmVjdCgwLCBIICogMC44LCBXLCBIICogMC4yKTtcbiAgfVxuICBpZiAocy5jb3JlKSB7IGcuZmlsbFN0eWxlID0gcy5jb3JlOyBnLmZpbGxSZWN0KDAsIDAsIFcsIEggKiAwLjE2KTsgfVxuICBpZiAocy5zdGFycykge1xuICAgIGcuZmlsbFN0eWxlID0gXCIjZmZmZmZmXCI7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCA0MDsgaSsrKSB7IGNvbnN0IHggPSAoaSAqIDk3KSAlIFcsIHkgPSAoaSAqIDUzKSAlIEg7IGcuZmlsbFJlY3QoeCwgeSwgMiwgMik7IH1cbiAgfVxuICBjb25zdCB0ZXggPSBuZXcgVEhSRUUuQ2FudmFzVGV4dHVyZShjdik7XG4gIHRleC53cmFwUyA9IFRIUkVFLlJlcGVhdFdyYXBwaW5nO1xuICB0ZXguYW5pc290cm9weSA9IDQ7XG4gIGNhY2hlLnNldChpZCwgdGV4KTtcbiAgcmV0dXJuIHRleDtcbn1cblxuLyoqIFNtYWxsIDJEIHByZXZpZXcgb2YgYSBza2luIGZvciB0aGUgc2hvcCAvIEhVRCAoQ1NTIGJhY2tncm91bmQpLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNraW5Td2F0Y2goaWQpIHtcbiAgY29uc3QgcyA9IHNraW5CeUlkKGlkKTtcbiAgcmV0dXJuIGBjb25pYy1ncmFkaWVudChmcm9tIDBkZWcsICR7QXJyYXkuZnJvbSh7IGxlbmd0aDogcy5uICogMiB9LCAoXywgaSkgPT4gYCR7aSAlIDIgPyBzLmIgOiBzLmF9ICR7KGkgLyAocy5uICogMikpICogMTAwfSUgJHsoKGkgKyAxKSAvIChzLm4gKiAyKSkgKiAxMDB9JWApLmpvaW4oXCIsIFwiKX0pYDtcbn1cbiIsICIvKiBnbG9iYWwgVEhSRUUgKi9cbi8vIFJlbmRlcmVyLiBSZWFkcyB0aGUgc2ltdWxhdGlvbiBzdGF0ZSBlYWNoIGZyYW1lOyBuZXZlciBjaGFuZ2VzIGl0LlxuLy8gQnVkZ2V0OiBzdGF0aWMgbGV2ZWwgPSAxIGRyYXcgY2FsbCwgZHJvcCBzaGFkb3dzID0gMSwgcGFydGljbGVzID0gMSwgcGx1cyBhXG4vLyBoYW5kZnVsIG9mIHNtYWxsIGR5bmFtaWMgbWVzaGVzLiBObyBzaGFkb3cgbWFwcywgbm8gcG9zdC1wcm9jZXNzaW5nLlxuaW1wb3J0IHsgSEFMRiwgS19CT1gsIEtfQ0lSQ0xFLCBwYXRoUG9zLCBsYXNlck9uIH0gZnJvbSBcIi4uL3NpbS9zaW0uanNcIjtcbmltcG9ydCB7IHRoZW1lT2YgfSBmcm9tIFwiLi90aGVtZXMuanNcIjtcbmltcG9ydCB7IEdlb0J1aWxkZXIsIHJvdW5kUmVjdCwgY2lyY2xlUHRzLCBzdGFyUHRzIH0gZnJvbSBcIi4vZ2VvLmpzXCI7XG5pbXBvcnQgeyBQYXJ0aWNsZXMgfSBmcm9tIFwiLi9meC5qc1wiO1xuaW1wb3J0IHsgc2tpblRleHR1cmUsIHNraW5CeUlkIH0gZnJvbSBcIi4vc2tpbnMuanNcIjtcblxuY29uc3QgV0FMTF9IID0gMjQsIEZPViA9IDMwLCBQSVRDSCA9IDAuMTsgICAvLyBuZWFyLW9ydGhvZ3JhcGhpYyBcInRyYXkgb24gYSB0YWJsZVwiIHZpZXdcbmNvbnN0IEZJVF9SID0gMjc0OyAgICAgICAgICAgIC8vIGFyZW5hIHJhZGl1cyB0aGF0IG11c3Qgc3RheSBvbiBzY3JlZW4gd2hpbGUgaXQgc3BpbnNcbmNvbnN0IFNIWCA9IDcsIFNIWSA9IC0xMTsgICAgIC8vIGRyb3Atc2hhZG93IG9mZnNldCBpbiBzY3JlZW4gc3BhY2UgKGxpZ2h0IGZyb20gdGhlIHVwcGVyIGxlZnQpXG5jb25zdCBJTlRSTyA9IDAuMjg7ICAgICAgICAgICAvLyBzZWNvbmRzIGEgZnJlc2hseSBidWlsdCBsZXZlbCB0YWtlcyB0byBwb3AgaW5cbmNvbnN0IFAgPSB7IHg6IDAsIHk6IDAsIHZ4OiAwLCB2eTogMCB9O1xuXG5mdW5jdGlvbiBzaGFkZShoZXgsIGspIHtcbiAgY29uc3QgciA9IE1hdGgubWluKDI1NSwgKChoZXggPj4gMTYpICYgMjU1KSAqIGspIHwgMCwgZyA9IE1hdGgubWluKDI1NSwgKChoZXggPj4gOCkgJiAyNTUpICogaykgfCAwLCBiID0gTWF0aC5taW4oMjU1LCAoaGV4ICYgMjU1KSAqIGspIHwgMDtcbiAgcmV0dXJuIChyIDw8IDE2KSB8IChnIDw8IDgpIHwgYjtcbn1cbmNvbnN0IGNzcyA9IChoZXgpID0+IFwiI1wiICsgaGV4LnRvU3RyaW5nKDE2KS5wYWRTdGFydCg2LCBcIjBcIik7XG5cbi8qKiAwID0gbG93LWVuZCBwaG9uZSwgMSA9IHBob25lIC8gdGFibGV0LCAyID0gZGVza3RvcCAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRldGVjdFRpZXIoKSB7XG4gIGNvbnN0IHVhID0gbmF2aWdhdG9yLnVzZXJBZ2VudCB8fCBcIlwiO1xuICBjb25zdCBtb2JpbGUgPSAvQW5kcm9pZHxpUGhvbmV8aVBhZHxpUG9kfE1vYmlsZS9pLnRlc3QodWEpIHx8IChuYXZpZ2F0b3IubWF4VG91Y2hQb2ludHMgPiAxICYmIE1hdGgubWluKHNjcmVlbi53aWR0aCwgc2NyZWVuLmhlaWdodCkgPCA4MjApO1xuICBjb25zdCBjb3JlcyA9IG5hdmlnYXRvci5oYXJkd2FyZUNvbmN1cnJlbmN5IHx8IDQsIG1lbSA9IG5hdmlnYXRvci5kZXZpY2VNZW1vcnkgfHwgNDtcbiAgaWYgKG1vYmlsZSAmJiAoY29yZXMgPD0gNCB8fCBtZW0gPD0gMykpIHJldHVybiAwO1xuICByZXR1cm4gbW9iaWxlID8gMSA6IDI7XG59XG5cbmZ1bmN0aW9uIGdsb3dUZXh0dXJlKCkge1xuICBjb25zdCBjdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJjYW52YXNcIik7IGN2LndpZHRoID0gY3YuaGVpZ2h0ID0gNjQ7XG4gIGNvbnN0IGcgPSBjdi5nZXRDb250ZXh0KFwiMmRcIiksIGdyID0gZy5jcmVhdGVSYWRpYWxHcmFkaWVudCgzMiwgMzIsIDIsIDMyLCAzMiwgMzIpO1xuICBnci5hZGRDb2xvclN0b3AoMCwgXCJyZ2JhKDI1NSwyNTUsMjU1LDEpXCIpOyBnci5hZGRDb2xvclN0b3AoMC40NSwgXCJyZ2JhKDI1NSwyNTUsMjU1LC4zNSlcIik7IGdyLmFkZENvbG9yU3RvcCgxLCBcInJnYmEoMjU1LDI1NSwyNTUsMClcIik7XG4gIGcuZmlsbFN0eWxlID0gZ3I7IGcuZmlsbFJlY3QoMCwgMCwgNjQsIDY0KTtcbiAgcmV0dXJuIG5ldyBUSFJFRS5DYW52YXNUZXh0dXJlKGN2KTtcbn1cblxuZnVuY3Rpb24gc3dpcmxUZXh0dXJlKGNvbEhleCwgY29yZUhleCkge1xuICBjb25zdCBTID0gMTI4LCBjdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJjYW52YXNcIik7IGN2LndpZHRoID0gY3YuaGVpZ2h0ID0gUztcbiAgY29uc3QgZyA9IGN2LmdldENvbnRleHQoXCIyZFwiKSwgZ3IgPSBnLmNyZWF0ZVJhZGlhbEdyYWRpZW50KFMgLyAyLCBTIC8gMiwgNCwgUyAvIDIsIFMgLyAyLCBTIC8gMik7XG4gIGdyLmFkZENvbG9yU3RvcCgwLCBjc3MoY29yZUhleCkpOyBnci5hZGRDb2xvclN0b3AoMC41NSwgY3NzKGNvbEhleCkpOyBnci5hZGRDb2xvclN0b3AoMSwgY3NzKHNoYWRlKGNvbEhleCwgMC41NSkpKTtcbiAgZy5maWxsU3R5bGUgPSBncjsgZy5iZWdpblBhdGgoKTsgZy5hcmMoUyAvIDIsIFMgLyAyLCBTIC8gMiwgMCwgNi4zKTsgZy5maWxsKCk7XG4gIGcuc3Ryb2tlU3R5bGUgPSBcInJnYmEoMjU1LDI1NSwyNTUsLjg1KVwiOyBnLmxpbmVXaWR0aCA9IDU7IGcubGluZUNhcCA9IFwicm91bmRcIjtcbiAgZm9yIChsZXQgYXJtID0gMDsgYXJtIDwgMzsgYXJtKyspIHtcbiAgICBnLmJlZ2luUGF0aCgpO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDw9IDQwOyBpKyspIHtcbiAgICAgIGNvbnN0IHQgPSBpIC8gNDAsIGEgPSBhcm0gKiAyLjA5NCArIHQgKiA0LjQsIHIgPSA2ICsgdCAqIChTIC8gMiAtIDEyKTtcbiAgICAgIGNvbnN0IHggPSBTIC8gMiArIE1hdGguY29zKGEpICogciwgeSA9IFMgLyAyICsgTWF0aC5zaW4oYSkgKiByO1xuICAgICAgaWYgKGkpIGcubGluZVRvKHgsIHkpOyBlbHNlIGcubW92ZVRvKHgsIHkpO1xuICAgIH1cbiAgICBnLnN0cm9rZSgpO1xuICB9XG4gIHJldHVybiBuZXcgVEhSRUUuQ2FudmFzVGV4dHVyZShjdik7XG59XG5cbmNvbnN0IFBPUlRfQ09MT1JTID0gWzB4ZmY4YTAwLCAweGQ5NDZlZiwgMHg4NGNjMTYsIDB4ZjQzZjVlXTtcbmNvbnN0IEdBVEVfQ09MT1IgPSAweDIyYzU1ZSwgRE9PUl9DT0xPUiA9IDB4ZjViMzAxLCBET09SX1NJREUgPSAweGI5N2YwMDtcblxuZnVuY3Rpb24gY2hldnJvblRleHR1cmUoKSB7XG4gIGNvbnN0IFMgPSA2NCwgY3YgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiY2FudmFzXCIpOyBjdi53aWR0aCA9IGN2LmhlaWdodCA9IFM7XG4gIGNvbnN0IGcgPSBjdi5nZXRDb250ZXh0KFwiMmRcIik7XG4gIGcuc3Ryb2tlU3R5bGUgPSBcInJnYmEoMjU1LDI1NSwyNTUsLjk1KVwiOyBnLmxpbmVXaWR0aCA9IDc7IGcubGluZUNhcCA9IFwicm91bmRcIjsgZy5saW5lSm9pbiA9IFwicm91bmRcIjtcbiAgZy5iZWdpblBhdGgoKTsgZy5tb3ZlVG8oMTQsIDQ0KTsgZy5saW5lVG8oMzIsIDIyKTsgZy5saW5lVG8oNTAsIDQ0KTsgZy5zdHJva2UoKTtcbiAgY29uc3QgdCA9IG5ldyBUSFJFRS5DYW52YXNUZXh0dXJlKGN2KTtcbiAgdC53cmFwUyA9IHQud3JhcFQgPSBUSFJFRS5SZXBlYXRXcmFwcGluZztcbiAgcmV0dXJuIHQ7XG59XG5cbmV4cG9ydCBjbGFzcyBWaWV3IHtcbiAgY29uc3RydWN0b3Ioc3RhZ2UsIHRpZXIpIHtcbiAgICB0aGlzLnN0YWdlID0gc3RhZ2U7IHRoaXMudGllciA9IHRpZXI7XG4gICAgY29uc3QgciA9ICh0aGlzLnJlbmRlcmVyID0gbmV3IFRIUkVFLldlYkdMUmVuZGVyZXIoeyBhbnRpYWxpYXM6IHRpZXIgPiAwLCBhbHBoYTogdHJ1ZSwgcG93ZXJQcmVmZXJlbmNlOiBcImhpZ2gtcGVyZm9ybWFuY2VcIiB9KSk7XG4gICAgci5zZXRDbGVhckNvbG9yKDB4MDAwMDAwLCAwKTtcbiAgICB0aGlzLnByID0gTWF0aC5taW4od2luZG93LmRldmljZVBpeGVsUmF0aW8gfHwgMSwgWzEuNSwgMiwgMl1bdGllcl0pO1xuICAgIHIuc2V0UGl4ZWxSYXRpbyh0aGlzLnByKTtcbiAgICBzdGFnZS5hcHBlbmRDaGlsZChyLmRvbUVsZW1lbnQpO1xuXG4gICAgdGhpcy5zY2VuZSA9IG5ldyBUSFJFRS5TY2VuZSgpO1xuICAgIHRoaXMuY2FtZXJhID0gbmV3IFRIUkVFLlBlcnNwZWN0aXZlQ2FtZXJhKEZPViwgMSwgMjAsIDQwMDApO1xuICAgIHRoaXMuYW1iID0gbmV3IFRIUkVFLkFtYmllbnRMaWdodCgweGZmZmZmZiwgMC43NSk7XG4gICAgdGhpcy5zdW4gPSBuZXcgVEhSRUUuRGlyZWN0aW9uYWxMaWdodCgweGZmZmZmZiwgMC4zNSk7XG4gICAgdGhpcy5zdW4ucG9zaXRpb24uc2V0KC0wLjQ1LCAwLjcsIDEpO1xuICAgIHRoaXMuc2NlbmUuYWRkKHRoaXMuYW1iLCB0aGlzLnN1bik7XG5cbiAgICB0aGlzLndvcmxkID0gbmV3IFRIUkVFLkdyb3VwKCk7IHRoaXMuc2NlbmUuYWRkKHRoaXMud29ybGQpOyAgIC8vIHJvdGF0ZXMgd2l0aCB0aGUgc2ltIGFuZ2xlXG4gICAgdGhpcy5sZXZlbCA9IG5ldyBUSFJFRS5Hcm91cCgpOyB0aGlzLndvcmxkLmFkZCh0aGlzLmxldmVsKTsgICAvLyByZWJ1aWx0IHBlciBsZXZlbFxuXG4gICAgdGhpcy5tYXRTdGF0aWMgPSBuZXcgVEhSRUUuTWVzaExhbWJlcnRNYXRlcmlhbCh7IHZlcnRleENvbG9yczogdHJ1ZSB9KTtcbiAgICB0aGlzLm1hdFNoYWRvdyA9IG5ldyBUSFJFRS5NZXNoQmFzaWNNYXRlcmlhbCh7IGNvbG9yOiAweDAwMDAwMCwgdHJhbnNwYXJlbnQ6IHRydWUsIG9wYWNpdHk6IDAuMiwgZGVwdGhXcml0ZTogZmFsc2UgfSk7XG4gICAgdGhpcy5tYXRHZW0gPSBuZXcgVEhSRUUuTWVzaFBob25nTWF0ZXJpYWwoeyBjb2xvcjogMHhmZmMyMWYsIGVtaXNzaXZlOiAweDdhNGEwMCwgc2hpbmluZXNzOiA5MCwgc3BlY3VsYXI6IDB4ZmZmZmZmLCBmbGF0U2hhZGluZzogdHJ1ZSB9KTtcbiAgICB0aGlzLm1hdENyeXN0YWwgPSBuZXcgVEhSRUUuTWVzaFBob25nTWF0ZXJpYWwoeyBjb2xvcjogMHg2ZmUzZmYsIHRyYW5zcGFyZW50OiB0cnVlLCBvcGFjaXR5OiAwLjYyLCBzaGluaW5lc3M6IDEwMCwgc3BlY3VsYXI6IDB4ZmZmZmZmIH0pO1xuICAgIHRoaXMuZ2VtR2VvID0gbmV3IFRIUkVFLk9jdGFoZWRyb25HZW9tZXRyeSgxMCwgMCk7XG4gICAgdGhpcy5nbG93VGV4ID0gZ2xvd1RleHR1cmUoKTtcbiAgICB0aGlzLm1hdEtleSA9IG5ldyBUSFJFRS5NZXNoUGhvbmdNYXRlcmlhbCh7IGNvbG9yOiBET09SX0NPTE9SLCBlbWlzc2l2ZTogMHg2YjQ3MDAsIHNoaW5pbmVzczogOTAsIHNwZWN1bGFyOiAweGZmZmZmZiB9KTtcbiAgICB0aGlzLmtleVJpbmcgPSBuZXcgVEhSRUUuVG9ydXNHZW9tZXRyeSg1LjUsIDIsIDgsIDE4KTsgdGhpcy5rZXlCYXIgPSBuZXcgVEhSRUUuQm94R2VvbWV0cnkoMy40LCAxMSwgMy40KTsgdGhpcy5rZXlUb290aCA9IG5ldyBUSFJFRS5Cb3hHZW9tZXRyeSg1LjUsIDMsIDMuNCk7XG5cbiAgICB0aGlzLmZ4ID0gbmV3IFBhcnRpY2xlcyh0aGlzLndvcmxkLCBbNjAsIDExMCwgMTgwXVt0aWVyXSk7XG4gICAgdGhpcy5fYnVpbGRCYWxsKCk7XG5cbiAgICB0aGlzLmluc2V0cyA9IHsgdG9wOiA1NiwgYm90dG9tOiA3NiwgbGVmdDogMCwgcmlnaHQ6IDAgfTtcbiAgICB0aGlzLnpvb20gPSAxOyB0aGlzLnpvb21UbyA9IDE7IHRoaXMuc2hha2UgPSAwO1xuICAgIHRoaXMuc3F1YXNoID0gMDsgdGhpcy5zcGluID0gMDsgdGhpcy5zcGluViA9IDA7IHRoaXMuYmFsbFNjYWxlID0gMTsgdGhpcy50cmFpbFQgPSAwO1xuICAgIHRoaXMuaXRlbXMgPSBudWxsOyB0aGlzLnRoZW1lID0gdGhlbWVPZihcIm1lYWRvd1wiKTsgdGhpcy5za2luID0gc2tpbkJ5SWQoXCJjbGFzc2ljXCIpO1xuICAgIHRoaXMucmVzaXplKCk7XG4gIH1cblxuICBnZXQgY2FudmFzKCkgeyByZXR1cm4gdGhpcy5yZW5kZXJlci5kb21FbGVtZW50OyB9XG5cbiAgX2J1aWxkQmFsbCgpIHtcbiAgICB0aGlzLmJhbGwgPSBuZXcgVEhSRUUuR3JvdXAoKTtcbiAgICB0aGlzLmJhbGxTcSA9IG5ldyBUSFJFRS5Hcm91cCgpOyB0aGlzLmJhbGxVbiA9IG5ldyBUSFJFRS5Hcm91cCgpOyB0aGlzLmJhbGxTcGluID0gbmV3IFRIUkVFLkdyb3VwKCk7XG4gICAgY29uc3Qgc2VnID0gdGhpcy50aWVyID4gMCA/IDI4IDogMTg7XG4gICAgdGhpcy5iYWxsTWF0ID0gbmV3IFRIUkVFLk1lc2hQaG9uZ01hdGVyaWFsKHsgbWFwOiBza2luVGV4dHVyZShcImNsYXNzaWNcIiksIHNoaW5pbmVzczogNzAsIHNwZWN1bGFyOiAweDY2NjY2NiB9KTtcbiAgICB0aGlzLmJhbGxNZXNoID0gbmV3IFRIUkVFLk1lc2gobmV3IFRIUkVFLlNwaGVyZUdlb21ldHJ5KDEsIHNlZywgTWF0aC5yb3VuZChzZWcgKiAwLjcpKSwgdGhpcy5iYWxsTWF0KTtcbiAgICB0aGlzLmJhbGxNZXNoLnJvdGF0aW9uLnggPSBNYXRoLlBJIC8gMjsgICAgICAgICAgICAvLyBzaG93IHRoZSBwb2xlIHRvIHRoZSBjYW1lcmFcbiAgICB0aGlzLmJhbGxTcGluLmFkZCh0aGlzLmJhbGxNZXNoKTsgdGhpcy5iYWxsVW4uYWRkKHRoaXMuYmFsbFNwaW4pOyB0aGlzLmJhbGxTcS5hZGQodGhpcy5iYWxsVW4pOyB0aGlzLmJhbGwuYWRkKHRoaXMuYmFsbFNxKTtcbiAgICB0aGlzLmJhbGxTaGFkb3cgPSBuZXcgVEhSRUUuTWVzaChuZXcgVEhSRUUuQ2lyY2xlR2VvbWV0cnkoMSwgMjApLCB0aGlzLm1hdFNoYWRvdyk7XG4gICAgdGhpcy53b3JsZC5hZGQodGhpcy5iYWxsU2hhZG93LCB0aGlzLmJhbGwpO1xuICB9XG5cbiAgc2V0U2tpbihpZCkge1xuICAgIHRoaXMuc2tpbiA9IHNraW5CeUlkKGlkKTtcbiAgICB0aGlzLmJhbGxNYXQubWFwID0gc2tpblRleHR1cmUodGhpcy5za2luLmlkKTtcbiAgICB0aGlzLmJhbGxNYXQubmVlZHNVcGRhdGUgPSB0cnVlO1xuICB9XG5cbiAgX2Rpc3Bvc2VMZXZlbCgpIHtcbiAgICBjb25zdCBnID0gdGhpcy5sZXZlbDtcbiAgICBmb3IgKGxldCBpID0gZy5jaGlsZHJlbi5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgY29uc3QgbSA9IGcuY2hpbGRyZW5baV07XG4gICAgICBnLnJlbW92ZShtKTtcbiAgICAgIG0udHJhdmVyc2UoKG8pID0+IHsgaWYgKG8uZ2VvbWV0cnkgJiYgby5nZW9tZXRyeSAhPT0gdGhpcy5nZW1HZW8gJiYgby5nZW9tZXRyeSAhPT0gdGhpcy5rZXlSaW5nICYmIG8uZ2VvbWV0cnkgIT09IHRoaXMua2V5QmFyICYmIG8uZ2VvbWV0cnkgIT09IHRoaXMua2V5VG9vdGgpIG8uZ2VvbWV0cnkuZGlzcG9zZSgpOyBpZiAoby51c2VyRGF0YS5vd25NYXQpIHsgaWYgKG8ubWF0ZXJpYWwubWFwICYmIG8ubWF0ZXJpYWwubWFwICE9PSB0aGlzLmdsb3dUZXgpIG8ubWF0ZXJpYWwubWFwLmRpc3Bvc2UoKTsgby5tYXRlcmlhbC5kaXNwb3NlKCk7IH0gfSk7XG4gICAgfVxuICAgIHRoaXMuZnguY2xlYXIoKTtcbiAgfVxuXG4gIC8qKiBCdWlsZCBhbGwgbWVzaGVzIGZvciBhIGNvbXBpbGVkIGxldmVsLiAqL1xuICBidWlsZChMKSB7XG4gICAgY29uc3QgVCA9ICh0aGlzLnRoZW1lID0gdGhlbWVPZihMLnRoZW1lKSk7XG4gICAgdGhpcy5fZGlzcG9zZUxldmVsKCk7XG4gICAgdGhpcy5hbWIuaW50ZW5zaXR5ID0gVC5hbWJpZW50OyB0aGlzLnN1bi5pbnRlbnNpdHkgPSBULnN1bjtcbiAgICB0aGlzLm1hdFNoYWRvdy5jb2xvci5zZXRIZXgoVC5zaGFkb3cpOyB0aGlzLm1hdFNoYWRvdy5vcGFjaXR5ID0gVC5zaGFkb3dBO1xuICAgIHRoaXMubWF0R2VtLmNvbG9yLnNldEhleChULmdlbSk7XG4gICAgdGhpcy5tYXRDcnlzdGFsLmNvbG9yLnNldEhleChULmNyeXN0YWwpO1xuXG4gICAgY29uc3QgZ2IgPSBuZXcgR2VvQnVpbGRlcigpLCBzaCA9IG5ldyBHZW9CdWlsZGVyKCksIEggPSBXQUxMX0gsIGVkZ2VzID0gW107XG4gICAgY29uc3Qgb3V0bGluZSA9IChwdHMsIGN4LCBjeSwgY3MsIHNuLCB6KSA9PiB7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHB0cy5sZW5ndGg7IGkrKykge1xuICAgICAgICBjb25zdCBhID0gcHRzW2ldLCBiID0gcHRzWyhpICsgMSkgJSBwdHMubGVuZ3RoXTtcbiAgICAgICAgZWRnZXMucHVzaChjeCArIGFbMF0gKiBjcyAtIGFbMV0gKiBzbiwgY3kgKyBhWzBdICogc24gKyBhWzFdICogY3MsIHosIGN4ICsgYlswXSAqIGNzIC0gYlsxXSAqIHNuLCBjeSArIGJbMF0gKiBzbiArIGJbMV0gKiBjcywgeik7XG4gICAgICB9XG4gICAgfTtcblxuICAgIC8vIGZsb29yOiBjaGVja2VyIHRpbGVzIG9uIGEgcGxhdGVcbiAgICBjb25zdCBuID0gMTQsIGNzID0gKDIgKiBIQUxGKSAvIG47XG4gICAgZm9yIChsZXQgaiA9IDA7IGogPCBuOyBqKyspIGZvciAobGV0IGkgPSAwOyBpIDwgbjsgaSsrKSB7XG4gICAgICBjb25zdCB4MCA9IC1IQUxGICsgaSAqIGNzLCB5MCA9IC1IQUxGICsgaiAqIGNzO1xuICAgICAgZ2IucXVhZChbeDAsIHkwLCAwXSwgW3gwICsgY3MsIHkwLCAwXSwgW3gwICsgY3MsIHkwICsgY3MsIDBdLCBbeDAsIHkwICsgY3MsIDBdLCAoaSArIGopICUgMiA/IFQuZmxvb3JBIDogVC5mbG9vckIpO1xuICAgIH1cbiAgICBjb25zdCBzcSA9IHJvdW5kUmVjdChIQUxGLCBIQUxGLCAxLCAxKTtcbiAgICBnYi5wcmlzbShzcSwgc3EsIDAsIDAsIDEsIDAsIC0xNCwgLTAuMDUsIDAsIFQucGxhdGUsIFQucGxhdGUsIFQucGxhdGUpO1xuXG4gICAgLy8gd2FsbHNcbiAgICBjb25zdCByb3dzID0gTC5yb3dzLCBOID0gTC5uO1xuICAgIGNvbnN0IGlzQ2ggPSAoYywgciwgY2gpID0+IHIgPj0gMCAmJiBjID49IDAgJiYgciA8IE4gJiYgYyA8IE4gJiYgcm93c1tyXVtjXSA9PT0gY2g7XG4gICAgZm9yIChjb25zdCBzIG9mIEwuc29saWRzKSB7XG4gICAgICBpZiAocy5rID09PSBLX0JPWCkge1xuICAgICAgICBsZXQgaHcgPSBzLmh3LCBoaCA9IHMuaGgsIGN4ID0gcy5jeCwgY3kgPSBzLmN5O1xuICAgICAgICBjb25zdCByYWQgPSAzLjIsIGV4dCA9IHJhZCArIDAuNjtcbiAgICAgICAgaWYgKHMucmMpIHtcbiAgICAgICAgICAvLyB3aGVyZSBhIHdob2xlIHNpZGUgYnV0dHMgaW50byBhbm90aGVyIHdhbGwsIGV4dGVuZCBpbnRvIGl0IHNvIHRoZSByb3VuZGVkIGNvcm5lcnMgZG9uJ3QgbGVhdmUgbm90Y2hlc1xuICAgICAgICAgIGNvbnN0IHsgYzAsIGMxLCByMCwgcjEgfSA9IHMucmMsIGNoID0gcy5pY2UgPyBcIj1cIiA6IFwiI1wiO1xuICAgICAgICAgIGxldCB1cCA9IHRydWUsIGRuID0gdHJ1ZSwgbGYgPSB0cnVlLCBydCA9IHRydWU7XG4gICAgICAgICAgZm9yIChsZXQgYyA9IGMwOyBjIDw9IGMxOyBjKyspIHsgaWYgKCFpc0NoKGMsIHIwIC0gMSwgY2gpKSB1cCA9IGZhbHNlOyBpZiAoIWlzQ2goYywgcjEgKyAxLCBjaCkpIGRuID0gZmFsc2U7IH1cbiAgICAgICAgICBmb3IgKGxldCByID0gcjA7IHIgPD0gcjE7IHIrKykgeyBpZiAoIWlzQ2goYzAgLSAxLCByLCBjaCkpIGxmID0gZmFsc2U7IGlmICghaXNDaChjMSArIDEsIHIsIGNoKSkgcnQgPSBmYWxzZTsgfVxuICAgICAgICAgIGlmICh1cCkgeyBoaCArPSBleHQgLyAyOyBjeSArPSBleHQgLyAyOyB9IGlmIChkbikgeyBoaCArPSBleHQgLyAyOyBjeSAtPSBleHQgLyAyOyB9XG4gICAgICAgICAgaWYgKGxmKSB7IGh3ICs9IGV4dCAvIDI7IGN4IC09IGV4dCAvIDI7IH0gaWYgKHJ0KSB7IGh3ICs9IGV4dCAvIDI7IGN4ICs9IGV4dCAvIDI7IH1cbiAgICAgICAgfVxuICAgICAgICBjb25zdCBvID0gcm91bmRSZWN0KGh3LCBoaCwgcmFkLCAzKSwgaW5uID0gcm91bmRSZWN0KGh3IC0gMS44LCBoaCAtIDEuOCwgcmFkIC0gMS4yLCAzKTtcbiAgICAgICAgaWYgKHMuaWNlKSBnYi5wcmlzbShvLCBpbm4sIGN4LCBjeSwgcy5jLCBzLnMsIDAsIEgsIDIsIFQuaWNlLCBzaGFkZShULmljZSwgMC43OCksIDB4ZmZmZmZmKTtcbiAgICAgICAgZWxzZSBnYi5wcmlzbShvLCBpbm4sIGN4LCBjeSwgcy5jLCBzLnMsIDAsIEgsIDIsIFQud2FsbFRvcCwgVC53YWxsU2lkZSwgVC53YWxsQmV2ZWwpO1xuICAgICAgICBzaC5mbGF0KG8sIGN4LCBjeSwgcy5jLCBzLnMsIDAuNSwgMCk7XG4gICAgICAgIGlmIChULmVkZ2VzKSBvdXRsaW5lKGlubiwgY3gsIGN5LCBzLmMsIHMucywgSCArIDAuNCk7XG4gICAgICB9IGVsc2UgaWYgKHMuayA9PT0gS19DSVJDTEUpIHtcbiAgICAgICAgY29uc3QgbyA9IGNpcmNsZVB0cyhzLnIsIDE2KSwgaW5uID0gY2lyY2xlUHRzKHMuciAtIDIuMiwgMTYpO1xuICAgICAgICBpZiAocy5idW1wZXIpIGdiLnByaXNtKG8sIGlubiwgcy5jeCwgcy5jeSwgMSwgMCwgMCwgSCArIDUsIDIuNSwgVC5idW1wZXIsIFQuYnVtcGVyU2lkZSwgMHhmZmZmZmYpO1xuICAgICAgICBlbHNlIGdiLnByaXNtKG8sIGlubiwgcy5jeCwgcy5jeSwgMSwgMCwgMCwgSCwgMiwgVC5wZWcsIFQucGVnU2lkZSwgc2hhZGUoVC5wZWcsIDEuMikpO1xuICAgICAgICBzaC5mbGF0KG8sIHMuY3gsIHMuY3ksIDEsIDAsIDAuNSwgMCk7XG4gICAgICAgIGlmIChULmVkZ2VzKSBvdXRsaW5lKGlubiwgcy5jeCwgcy5jeSwgMSwgMCwgKHMuYnVtcGVyID8gSCArIDUgOiBIKSArIDAuNCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCBkeCA9IHMuYnggLSBzLmF4LCBkeSA9IHMuYnkgLSBzLmF5LCBsZW4gPSBNYXRoLmh5cG90KGR4LCBkeSksIGMyID0gZHggLyBsZW4sIHMyID0gZHkgLyBsZW47XG4gICAgICAgIGNvbnN0IG8gPSByb3VuZFJlY3QobGVuIC8gMiArIHMuciwgcy5yLCBzLnIsIDQpLCBpbm4gPSByb3VuZFJlY3QobGVuIC8gMiArIHMuciAtIDEuOCwgcy5yIC0gMS44LCBzLnIgLSAxLjgsIDQpO1xuICAgICAgICBnYi5wcmlzbShvLCBpbm4sIHMuY3gsIHMuY3ksIGMyLCBzMiwgMCwgSCwgMiwgVC53YWxsVG9wLCBULndhbGxTaWRlLCBULndhbGxCZXZlbCk7XG4gICAgICAgIHNoLmZsYXQobywgcy5jeCwgcy5jeSwgYzIsIHMyLCAwLjUsIDApO1xuICAgICAgICBpZiAoVC5lZGdlcykgb3V0bGluZShpbm4sIHMuY3gsIHMuY3ksIGMyLCBzMiwgSCArIDAuNCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gc3Bpa2VzXG4gICAgZm9yIChjb25zdCBrIG9mIEwua2lsbHMpIHtcbiAgICAgIGNvbnN0IGh3ID0gay5odyArIDEuNSwgaGggPSBrLmhoICsgMS41LCBvID0gcm91bmRSZWN0KGh3LCBoaCwgMS41LCAxKTtcbiAgICAgIGdiLnByaXNtKG8sIG8sIGsuY3gsIGsuY3ksIDEsIDAsIDAsIDEuNCwgMCwgVC5zcGlrZUJhc2UsIFQuc3Bpa2VCYXNlLCBULnNwaWtlQmFzZSk7XG4gICAgICBpZiAoay5keCB8fCBrLmR5KSB7XG4gICAgICAgIGNvbnN0IGFsb25nID0gay5keCA/IGhoIDogaHcsIGRlcHRoID0gKGsuZHggPyBodyA6IGhoKSAqIDI7XG4gICAgICAgIGNvbnN0IGNvdW50ID0gTWF0aC5tYXgoMSwgTWF0aC5yb3VuZCgoYWxvbmcgKiAyKSAvIDEwKSk7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY291bnQ7IGkrKykge1xuICAgICAgICAgIGNvbnN0IHQgPSAoKGkgKyAwLjUpIC8gY291bnQgLSAwLjUpICogYWxvbmcgKiAyO1xuICAgICAgICAgIGNvbnN0IGJ4ID0gay5jeCAtIGsuZHggKiAoZGVwdGggLyAyKSArIChrLmR4ID8gMCA6IHQpLCBieSA9IGsuY3kgLSBrLmR5ICogKGRlcHRoIC8gMikgKyAoay5keSA/IDAgOiB0KTtcbiAgICAgICAgICBnYi5zcGlrZShieCwgYnksIEggKiAwLjUsIGsuZHgsIGsuZHksIDAsIE1hdGgubWluKDcuNSwgKGFsb25nIC8gY291bnQpICogMS4yNSksIGRlcHRoLCBULnNwaWtlLCBULnNwaWtlRGFyayk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IG54ID0gTWF0aC5tYXgoMSwgTWF0aC5yb3VuZCgoaHcgKiAyKSAvIDExKSksIG55ID0gTWF0aC5tYXgoMSwgTWF0aC5yb3VuZCgoaGggKiAyKSAvIDExKSk7XG4gICAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgbnk7IGorKykgZm9yIChsZXQgaSA9IDA7IGkgPCBueDsgaSsrKSB7XG4gICAgICAgICAgZ2Iuc3Bpa2Uoay5jeCArICgoaSArIDAuNSkgLyBueCAtIDAuNSkgKiBodyAqIDIsIGsuY3kgKyAoKGogKyAwLjUpIC8gbnkgLSAwLjUpICogaGggKiAyLCAxLCAwLCAwLCAxLCA1LjUsIEggKiAwLjg1LCBULnNwaWtlLCBULnNwaWtlRGFyayk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBsYXVuY2ggcGFkc1xuICAgIGZvciAoY29uc3QgcCBvZiBMLnBhZHMpIHtcbiAgICAgIGNvbnN0IG8gPSByb3VuZFJlY3QocC5odywgcC5oaCwgMi41LCAyKTtcbiAgICAgIGdiLnByaXNtKG8sIHJvdW5kUmVjdChwLmh3IC0gMS41LCBwLmhoIC0gMS41LCAyLCAyKSwgcC5jeCwgcC5jeSwgMSwgMCwgMCwgNSwgMS41LCBULnBhZCwgc2hhZGUoVC5wYWQsIDAuNzIpLCAweGZmZmZmZik7XG4gICAgICBjb25zdCBtID0gTWF0aC5taW4ocC5odywgcC5oaCkgKiAwLjc1LCBweCA9IC1wLmR5LCBweSA9IHAuZHg7XG4gICAgICBnYi50cmkocC5jeCAtIHAuZHggKiBtICogMC41IC0gcHggKiBtLCBwLmN5IC0gcC5keSAqIG0gKiAwLjUgLSBweSAqIG0sIDUuMywgcC5jeCAtIHAuZHggKiBtICogMC41ICsgcHggKiBtLCBwLmN5IC0gcC5keSAqIG0gKiAwLjUgKyBweSAqIG0sIDUuMywgcC5jeCArIHAuZHggKiBtLCBwLmN5ICsgcC5keSAqIG0sIDUuMywgVC5wYWRBcnJvdyk7XG4gICAgfVxuXG4gICAgLy8gb25lLXdheSBnYXRlczogYSBsb3cgZ3JlZW4gc2lsbCB3aXRoIGFycm93cyBvbiB0aGUgZmxvb3Igc2hvd2luZyB0aGUgd2F5IHRocm91Z2hcbiAgICBmb3IgKGNvbnN0IGd0IG9mIEwuZ2F0ZXMpIHtcbiAgICAgIGNvbnN0IHRoaW4gPSAyLjYsIGh3ID0gZ3QuZHggPyB0aGluIDogZ3QuaHcsIGhoID0gZ3QuZHggPyBndC5oaCA6IHRoaW47XG4gICAgICBjb25zdCBvID0gcm91bmRSZWN0KGh3LCBoaCwgMS4yLCAyKTtcbiAgICAgIGdiLnByaXNtKG8sIG8sIGd0LmN4LCBndC5jeSwgMSwgMCwgMCwgNywgMCwgR0FURV9DT0xPUiwgc2hhZGUoR0FURV9DT0xPUiwgMC43KSwgR0FURV9DT0xPUik7XG4gICAgICBjb25zdCBweCA9IC1ndC5keSwgcHkgPSBndC5keCwgbkEgPSBNYXRoLm1heCgxLCBNYXRoLnJvdW5kKChndC5oYWxmICogMikgLyAxNikpO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBuQTsgaSsrKSB7XG4gICAgICAgIGNvbnN0IHQgPSAoKGkgKyAwLjUpIC8gbkEgLSAwLjUpICogZ3QuaGFsZiAqIDI7XG4gICAgICAgIGZvciAoY29uc3Qgb2ZmIG9mIFstMTMsIDldKSB7XG4gICAgICAgICAgY29uc3QgYnggPSBndC5jeCArIHB4ICogdCArIGd0LmR4ICogb2ZmLCBieSA9IGd0LmN5ICsgcHkgKiB0ICsgZ3QuZHkgKiBvZmYsIG0gPSA0LjU7XG4gICAgICAgICAgZ2IudHJpKGJ4ICsgcHggKiBtLCBieSArIHB5ICogbSwgMC41LCBieCAtIHB4ICogbSwgYnkgLSBweSAqIG0sIDAuNSwgYnggKyBndC5keCAqIG0gKiAxLjUsIGJ5ICsgZ3QuZHkgKiBtICogMS41LCAwLjUsIEdBVEVfQ09MT1IpO1xuICAgICAgICAgIGdiLnRyaShieCAtIHB4ICogbSwgYnkgLSBweSAqIG0sIDAuNSwgYnggKyBweCAqIG0sIGJ5ICsgcHkgKiBtLCAwLjUsIGJ4ICsgZ3QuZHggKiBtICogMS41LCBieSArIGd0LmR5ICogbSAqIDEuNSwgMC41LCBHQVRFX0NPTE9SKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICAvLyBsYXNlciBlbWl0dGVycyAodGhlIGJlYW0gaXRzZWxmIGlzIGR5bmFtaWMpXG4gICAgZm9yIChjb25zdCBseiBvZiBMLmxhc2Vycykge1xuICAgICAgY29uc3QgYWxvbmcgPSBsei5odyA+PSBsei5oaCwgZSA9IGFsb25nID8gbHouaHcgOiBsei5oaDtcbiAgICAgIGZvciAoY29uc3Qgc2duIG9mIFstMSwgMV0pIHtcbiAgICAgICAgY29uc3QgZXggPSBsei5jeCArIChhbG9uZyA/IHNnbiAqIChlIC0gMykgOiAwKSwgZXkgPSBsei5jeSArIChhbG9uZyA/IDAgOiBzZ24gKiAoZSAtIDMpKTtcbiAgICAgICAgZ2IucHJpc20oY2lyY2xlUHRzKDUuNSwgMTApLCBjaXJjbGVQdHMoNCwgMTApLCBleCwgZXksIDEsIDAsIDAsIEggKiAwLjcsIDEuNSwgMHgzZDRhNWMsIDB4MjcyZjNhLCBULnNwaWtlKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLmhpbnQgPSBudWxsO1xuICAgIHRoaXMuc3RhdGljTWVzaCA9IG5ldyBUSFJFRS5NZXNoKGdiLmJ1aWxkKCksIHRoaXMubWF0U3RhdGljKTtcbiAgICB0aGlzLnNoYWRvd01lc2ggPSBuZXcgVEhSRUUuTWVzaChzaC5idWlsZCgpLCB0aGlzLm1hdFNoYWRvdyk7XG4gICAgdGhpcy5zaGFkb3dNZXNoLnJlbmRlck9yZGVyID0gMTtcbiAgICB0aGlzLmxldmVsLmFkZCh0aGlzLnN0YXRpY01lc2gsIHRoaXMuc2hhZG93TWVzaCk7XG4gICAgaWYgKFQuZWRnZXMgJiYgZWRnZXMubGVuZ3RoKSB7XG4gICAgICBjb25zdCBlZyA9IG5ldyBUSFJFRS5CdWZmZXJHZW9tZXRyeSgpO1xuICAgICAgZWcuc2V0QXR0cmlidXRlKFwicG9zaXRpb25cIiwgbmV3IFRIUkVFLkZsb2F0MzJCdWZmZXJBdHRyaWJ1dGUoZWRnZXMsIDMpKTtcbiAgICAgIGNvbnN0IGxpbmVzID0gbmV3IFRIUkVFLkxpbmVTZWdtZW50cyhlZywgbmV3IFRIUkVFLkxpbmVCYXNpY01hdGVyaWFsKHsgY29sb3I6IFQuZWRnZXMgfSkpO1xuICAgICAgbGluZXMudXNlckRhdGEub3duTWF0ID0gdHJ1ZTtcbiAgICAgIHRoaXMubGV2ZWwuYWRkKGxpbmVzKTtcbiAgICB9XG5cbiAgICAvLyBkeW5hbWljIHRoaW5nc1xuICAgIGNvbnN0IGl0ID0gKHRoaXMuaXRlbXMgPSB7IG1vdmVyczogW10sIHNhd3M6IFtdLCBnZW1zOiBbXSwgY3J5c3RhbHM6IFtdLCBnb2FsOiBudWxsLCBrZXlzOiBbXSwgZG9vcnM6IFtdLCBsYXNlcnM6IFtdLCBmYW5zOiBbXSwgcG9ydHM6IFtdIH0pO1xuICAgIEwua2V5cy5mb3JFYWNoKChrLCBpKSA9PiB7XG4gICAgICBjb25zdCBncnAgPSBuZXcgVEhSRUUuR3JvdXAoKTtcbiAgICAgIGNvbnN0IHJpbmcgPSBuZXcgVEhSRUUuTWVzaCh0aGlzLmtleVJpbmcsIHRoaXMubWF0S2V5KTsgcmluZy5wb3NpdGlvbi55ID0gNjtcbiAgICAgIGNvbnN0IGJhciA9IG5ldyBUSFJFRS5NZXNoKHRoaXMua2V5QmFyLCB0aGlzLm1hdEtleSk7IGJhci5wb3NpdGlvbi55ID0gLTQ7XG4gICAgICBjb25zdCB0b290aCA9IG5ldyBUSFJFRS5NZXNoKHRoaXMua2V5VG9vdGgsIHRoaXMubWF0S2V5KTsgdG9vdGgucG9zaXRpb24uc2V0KDMuNSwgLTgsIDApO1xuICAgICAgZ3JwLmFkZChyaW5nLCBiYXIsIHRvb3RoKTsgZ3JwLnBvc2l0aW9uLnNldChrLngsIGsueSwgMTQpO1xuICAgICAgY29uc3QgaGFsbyA9IG5ldyBUSFJFRS5NZXNoKG5ldyBUSFJFRS5QbGFuZUdlb21ldHJ5KDQ2LCA0NiksIG5ldyBUSFJFRS5NZXNoQmFzaWNNYXRlcmlhbCh7IG1hcDogdGhpcy5nbG93VGV4LCBjb2xvcjogRE9PUl9DT0xPUiwgdHJhbnNwYXJlbnQ6IHRydWUsIG9wYWNpdHk6IDAuOCwgZGVwdGhXcml0ZTogZmFsc2UgfSkpO1xuICAgICAgaGFsby51c2VyRGF0YS5vd25NYXQgPSB0cnVlOyBoYWxvLnBvc2l0aW9uLnNldChrLngsIGsueSwgMik7IGhhbG8ucmVuZGVyT3JkZXIgPSAyO1xuICAgICAgdGhpcy5sZXZlbC5hZGQoaGFsbywgZ3JwKTtcbiAgICAgIGl0LmtleXMucHVzaCh7IG1lc2g6IGdycCwgaGFsbywgaSB9KTtcbiAgICB9KTtcbiAgICBmb3IgKGNvbnN0IGQgb2YgTC5kb29ycykge1xuICAgICAgY29uc3QgYiA9IG5ldyBHZW9CdWlsZGVyKCksIG8gPSByb3VuZFJlY3QoZC5odywgZC5oaCwgMywgMyk7XG4gICAgICBiLnByaXNtKG8sIHJvdW5kUmVjdChkLmh3IC0gMiwgZC5oaCAtIDIsIDIsIDMpLCAwLCAwLCAxLCAwLCAwLCBILCAyLCBET09SX0NPTE9SLCBET09SX1NJREUsIDB4ZmZmMWI4KTtcbiAgICAgIC8vIGtleWhvbGVcbiAgICAgIGIucHJpc20oY2lyY2xlUHRzKDMuMiwgMTApLCBjaXJjbGVQdHMoMy4yLCAxMCksIDAsIDEuNSwgMSwgMCwgSCwgSCArIDAuNiwgMCwgMHgzYTJhMDAsIDB4M2EyYTAwLCAweDNhMmEwMCk7XG4gICAgICBjb25zdCBtZXNoID0gbmV3IFRIUkVFLk1lc2goYi5idWlsZCgpLCB0aGlzLm1hdFN0YXRpYyk7IG1lc2gucG9zaXRpb24uc2V0KGQuY3gsIGQuY3ksIDApO1xuICAgICAgY29uc3Qgc2IgPSBuZXcgR2VvQnVpbGRlcigpOyBzYi5mbGF0KG8sIDAsIDAsIDEsIDAsIDAuNiwgMCk7XG4gICAgICBjb25zdCBzaGFkb3cgPSBuZXcgVEhSRUUuTWVzaChzYi5idWlsZCgpLCB0aGlzLm1hdFNoYWRvdyk7XG4gICAgICB0aGlzLmxldmVsLmFkZChtZXNoLCBzaGFkb3cpO1xuICAgICAgaXQuZG9vcnMucHVzaCh7IGQsIG1lc2gsIHNoYWRvdywgazogMSB9KTtcbiAgICB9XG4gICAgZm9yIChjb25zdCBseiBvZiBMLmxhc2Vycykge1xuICAgICAgY29uc3QgbWF0ID0gbmV3IFRIUkVFLk1lc2hCYXNpY01hdGVyaWFsKHsgY29sb3I6IFQuc3Bpa2UsIHRyYW5zcGFyZW50OiB0cnVlLCBvcGFjaXR5OiAxLCBkZXB0aFdyaXRlOiBmYWxzZSB9KTtcbiAgICAgIGNvbnN0IG1lc2ggPSBuZXcgVEhSRUUuTWVzaChuZXcgVEhSRUUuQm94R2VvbWV0cnkoTWF0aC5tYXgobHouaHcgKiAyIC0gNiwgMyksIE1hdGgubWF4KGx6LmhoICogMiAtIDYsIDMpLCA0KSwgbWF0KTtcbiAgICAgIGlmIChsei5odyA+PSBsei5oaCkgbWVzaC5zY2FsZS55ID0gMTsgbWVzaC51c2VyRGF0YS5vd25NYXQgPSB0cnVlOyBtZXNoLnBvc2l0aW9uLnNldChsei5jeCwgbHouY3ksIEggKiAwLjU1KTsgbWVzaC5yZW5kZXJPcmRlciA9IDM7XG4gICAgICBjb25zdCBnbG93ID0gbmV3IFRIUkVFLk1lc2gobmV3IFRIUkVFLlBsYW5lR2VvbWV0cnkobHouaHcgKiAyICsgMTQsIGx6LmhoICogMiArIDE0KSwgbmV3IFRIUkVFLk1lc2hCYXNpY01hdGVyaWFsKHsgY29sb3I6IFQuc3Bpa2UsIHRyYW5zcGFyZW50OiB0cnVlLCBvcGFjaXR5OiAwLjI1LCBkZXB0aFdyaXRlOiBmYWxzZSB9KSk7XG4gICAgICBnbG93LnVzZXJEYXRhLm93bk1hdCA9IHRydWU7IGdsb3cucG9zaXRpb24uc2V0KGx6LmN4LCBsei5jeSwgMS4yKTsgZ2xvdy5yZW5kZXJPcmRlciA9IDI7XG4gICAgICB0aGlzLmxldmVsLmFkZChnbG93LCBtZXNoKTtcbiAgICAgIGl0Lmxhc2Vycy5wdXNoKHsgZDogbHosIG1lc2gsIGdsb3cgfSk7XG4gICAgfVxuICAgIGZvciAoY29uc3QgZm4gb2YgTC5mYW5zKSB7XG4gICAgICBjb25zdCB0ZXggPSBjaGV2cm9uVGV4dHVyZSgpO1xuICAgICAgY29uc3QgYWNyb3NzID0gZm4uZHggPyBmbi5oaCAqIDIgOiBmbi5odyAqIDIsIGFsb25nID0gZm4uZHggPyBmbi5odyAqIDIgOiBmbi5oaCAqIDI7XG4gICAgICB0ZXgucmVwZWF0LnNldChNYXRoLm1heCgxLCBNYXRoLnJvdW5kKGFjcm9zcyAvIDI2KSksIE1hdGgubWF4KDEsIE1hdGgucm91bmQoYWxvbmcgLyAyNikpKTtcbiAgICAgIGNvbnN0IG1hdCA9IG5ldyBUSFJFRS5NZXNoQmFzaWNNYXRlcmlhbCh7IG1hcDogdGV4LCBjb2xvcjogVC5kYXJrID8gMHg2N2U4ZjkgOiAweDFkOGZkMSwgdHJhbnNwYXJlbnQ6IHRydWUsIG9wYWNpdHk6IFQuZGFyayA/IDAuNiA6IDAuNiwgZGVwdGhXcml0ZTogZmFsc2UgfSk7XG4gICAgICBjb25zdCBtZXNoID0gbmV3IFRIUkVFLk1lc2gobmV3IFRIUkVFLlBsYW5lR2VvbWV0cnkoYWNyb3NzLCBhbG9uZyksIG1hdCk7XG4gICAgICBtZXNoLnVzZXJEYXRhLm93bk1hdCA9IHRydWU7IG1lc2gucG9zaXRpb24uc2V0KGZuLmN4LCBmbi5jeSwgMSk7IG1lc2gucmVuZGVyT3JkZXIgPSAyO1xuICAgICAgbWVzaC5yb3RhdGlvbi56ID0gTWF0aC5hdGFuMihmbi5keSwgZm4uZHgpIC0gTWF0aC5QSSAvIDI7XG4gICAgICB0aGlzLmxldmVsLmFkZChtZXNoKTtcbiAgICAgIGl0LmZhbnMucHVzaCh7IGQ6IGZuLCB0ZXggfSk7XG4gICAgfVxuICAgIEwucG9ydHMuZm9yRWFjaCgocCkgPT4ge1xuICAgICAgY29uc3QgY29sID0gUE9SVF9DT0xPUlNbcC5wYWlyICUgUE9SVF9DT0xPUlMubGVuZ3RoXSwgZ3JwID0gbmV3IFRIUkVFLkdyb3VwKCk7XG4gICAgICBncnAucG9zaXRpb24uc2V0KHAueCwgcC55LCAwKTtcbiAgICAgIGNvbnN0IGhhbG8gPSBuZXcgVEhSRUUuTWVzaChuZXcgVEhSRUUuUGxhbmVHZW9tZXRyeSg3NCwgNzQpLCBuZXcgVEhSRUUuTWVzaEJhc2ljTWF0ZXJpYWwoeyBtYXA6IHRoaXMuZ2xvd1RleCwgY29sb3I6IGNvbCwgdHJhbnNwYXJlbnQ6IHRydWUsIG9wYWNpdHk6IDAuOCwgZGVwdGhXcml0ZTogZmFsc2UgfSkpO1xuICAgICAgaGFsby51c2VyRGF0YS5vd25NYXQgPSB0cnVlOyBoYWxvLnBvc2l0aW9uLnogPSAxLjQ7IGhhbG8ucmVuZGVyT3JkZXIgPSAyO1xuICAgICAgY29uc3QgZGlzYyA9IG5ldyBUSFJFRS5NZXNoKG5ldyBUSFJFRS5DaXJjbGVHZW9tZXRyeSgxMS41LCAyNCksIG5ldyBUSFJFRS5NZXNoQmFzaWNNYXRlcmlhbCh7IG1hcDogc3dpcmxUZXh0dXJlKHNoYWRlKGNvbCwgMC40NSksIDB4MDUwNjBmKSB9KSk7XG4gICAgICBkaXNjLnVzZXJEYXRhLm93bk1hdCA9IHRydWU7IGRpc2MucG9zaXRpb24ueiA9IDIuNjtcbiAgICAgIGNvbnN0IHJpbmcgPSBuZXcgVEhSRUUuTWVzaChuZXcgVEhSRUUuVG9ydXNHZW9tZXRyeSgxMi41LCAyLjYsIDgsIDI4KSwgbmV3IFRIUkVFLk1lc2hMYW1iZXJ0TWF0ZXJpYWwoeyBjb2xvcjogY29sLCBlbWlzc2l2ZTogc2hhZGUoY29sLCAwLjQ1KSB9KSk7XG4gICAgICByaW5nLnVzZXJEYXRhLm93bk1hdCA9IHRydWU7IHJpbmcucG9zaXRpb24ueiA9IDQ7XG4gICAgICBncnAuYWRkKGhhbG8sIGRpc2MsIHJpbmcpO1xuICAgICAgdGhpcy5sZXZlbC5hZGQoZ3JwKTtcbiAgICAgIGl0LnBvcnRzLnB1c2goeyBkaXNjLCByaW5nIH0pO1xuICAgIH0pO1xuICAgIGZvciAoY29uc3QgbSBvZiBMLm1vdmVycykge1xuICAgICAgY29uc3QgYiA9IG5ldyBHZW9CdWlsZGVyKCksIG8gPSByb3VuZFJlY3QobS5odywgbS5oaCwgMywgMyk7XG4gICAgICBiLnByaXNtKG8sIHJvdW5kUmVjdChtLmh3IC0gMS44LCBtLmhoIC0gMS44LCAyLCAzKSwgMCwgMCwgMSwgMCwgMCwgSCwgMiwgVC5tb3ZlciwgVC5tb3ZlclNpZGUsIDB4ZmZmZmZmKTtcbiAgICAgIGNvbnN0IG1lc2ggPSBuZXcgVEhSRUUuTWVzaChiLmJ1aWxkKCksIHRoaXMubWF0U3RhdGljKTtcbiAgICAgIGNvbnN0IHNiID0gbmV3IEdlb0J1aWxkZXIoKTsgc2IuZmxhdChvLCAwLCAwLCAxLCAwLCAwLjYsIDApO1xuICAgICAgY29uc3Qgc2hhZG93ID0gbmV3IFRIUkVFLk1lc2goc2IuYnVpbGQoKSwgdGhpcy5tYXRTaGFkb3cpO1xuICAgICAgdGhpcy5sZXZlbC5hZGQobWVzaCwgc2hhZG93KTtcbiAgICAgIGl0Lm1vdmVycy5wdXNoKHsgZDogbSwgbWVzaCwgc2hhZG93IH0pO1xuICAgIH1cbiAgICBmb3IgKGNvbnN0IHcgb2YgTC5zYXdzKSB7XG4gICAgICBjb25zdCBiID0gbmV3IEdlb0J1aWxkZXIoKSwgbyA9IHN0YXJQdHMody5yLCAxMCwgMC43Nik7XG4gICAgICBiLnByaXNtKG8sIHN0YXJQdHMody5yIC0gMS4yLCAxMCwgMC43NiksIDAsIDAsIDEsIDAsIDYsIDEyLCAxLCBULnNhdywgc2hhZGUoVC5zYXcsIDAuNyksIDB4ZmZmZmZmKTtcbiAgICAgIGIucHJpc20oY2lyY2xlUHRzKHcuciAqIDAuMzYsIDEyKSwgY2lyY2xlUHRzKHcuciAqIDAuMywgMTIpLCAwLCAwLCAxLCAwLCAxMiwgMTQsIDEsIFQuc2F3Q29yZSwgc2hhZGUoVC5zYXdDb3JlLCAwLjcpLCBULnNhd0NvcmUpO1xuICAgICAgY29uc3QgbWVzaCA9IG5ldyBUSFJFRS5NZXNoKGIuYnVpbGQoKSwgdGhpcy5tYXRTdGF0aWMpO1xuICAgICAgY29uc3Qgc2IgPSBuZXcgR2VvQnVpbGRlcigpOyBzYi5mbGF0KGNpcmNsZVB0cyh3LnIgKiAwLjksIDE0KSwgMCwgMCwgMSwgMCwgMC42LCAwKTtcbiAgICAgIGNvbnN0IHNoYWRvdyA9IG5ldyBUSFJFRS5NZXNoKHNiLmJ1aWxkKCksIHRoaXMubWF0U2hhZG93KTtcbiAgICAgIHRoaXMubGV2ZWwuYWRkKG1lc2gsIHNoYWRvdyk7XG4gICAgICBpdC5zYXdzLnB1c2goeyBkOiB3LCBtZXNoLCBzaGFkb3cgfSk7XG4gICAgfVxuICAgIEwuZ2Vtcy5mb3JFYWNoKChnbSwgaSkgPT4ge1xuICAgICAgY29uc3QgbWVzaCA9IG5ldyBUSFJFRS5NZXNoKHRoaXMuZ2VtR2VvLCB0aGlzLm1hdEdlbSk7XG4gICAgICBtZXNoLnNjYWxlLnNldCgwLjg1LCAxLjIsIDAuODUpO1xuICAgICAgbWVzaC5yb3RhdGlvbi5vcmRlciA9IFwiWllYXCI7ICAgICAgICAgICAgICAgICAvLyBzcGluIGFib3V0IGl0cyBvd24gdmVydGljYWwsIHRoZW4gc3RheSBzY3JlZW4tdXByaWdodFxuICAgICAgbWVzaC5wb3NpdGlvbi5zZXQoZ20ueCwgZ20ueSwgMTMpO1xuICAgICAgY29uc3QgaGFsbyA9IG5ldyBUSFJFRS5NZXNoKG5ldyBUSFJFRS5QbGFuZUdlb21ldHJ5KDQwLCA0MCksIG5ldyBUSFJFRS5NZXNoQmFzaWNNYXRlcmlhbCh7IG1hcDogdGhpcy5nbG93VGV4LCBjb2xvcjogVC5nZW0sIHRyYW5zcGFyZW50OiB0cnVlLCBvcGFjaXR5OiBULmRhcmsgPyAwLjU1IDogMC43NSwgZGVwdGhXcml0ZTogZmFsc2UgfSkpO1xuICAgICAgaGFsby51c2VyRGF0YS5vd25NYXQgPSB0cnVlOyBoYWxvLnBvc2l0aW9uLnNldChnbS54LCBnbS55LCAyKTsgaGFsby5yZW5kZXJPcmRlciA9IDI7XG4gICAgICB0aGlzLmxldmVsLmFkZChoYWxvLCBtZXNoKTtcbiAgICAgIGl0LmdlbXMucHVzaCh7IG1lc2gsIGhhbG8sIGkgfSk7XG4gICAgfSk7XG4gICAgTC5jcnlzdGFscy5mb3JFYWNoKChjLCBpKSA9PiB7XG4gICAgICBjb25zdCBtZXNoID0gbmV3IFRIUkVFLk1lc2gobmV3IFRIUkVFLkJveEdlb21ldHJ5KGMuaHcgKiAyLCBjLmhoICogMiwgSCksIHRoaXMubWF0Q3J5c3RhbCk7XG4gICAgICBtZXNoLnBvc2l0aW9uLnNldChjLmN4LCBjLmN5LCBIIC8gMik7IG1lc2gucmVuZGVyT3JkZXIgPSAzO1xuICAgICAgdGhpcy5sZXZlbC5hZGQobWVzaCk7XG4gICAgICBpdC5jcnlzdGFscy5wdXNoKHsgbWVzaCwgaSB9KTtcbiAgICB9KTtcblxuICAgIGNvbnN0IGdvYWwgPSBuZXcgVEhSRUUuR3JvdXAoKTtcbiAgICBnb2FsLnBvc2l0aW9uLnNldChMLmdvYWwueCwgTC5nb2FsLnksIDApO1xuICAgIGNvbnN0IGhhbG8gPSBuZXcgVEhSRUUuTWVzaChuZXcgVEhSRUUuUGxhbmVHZW9tZXRyeSg3OCwgNzgpLCBuZXcgVEhSRUUuTWVzaEJhc2ljTWF0ZXJpYWwoeyBtYXA6IHRoaXMuZ2xvd1RleCwgY29sb3I6IFQuZ29hbCwgdHJhbnNwYXJlbnQ6IHRydWUsIG9wYWNpdHk6IDAuODUsIGRlcHRoV3JpdGU6IGZhbHNlIH0pKTtcbiAgICBoYWxvLnVzZXJEYXRhLm93bk1hdCA9IHRydWU7IGhhbG8ucG9zaXRpb24ueiA9IDEuNTsgaGFsby5yZW5kZXJPcmRlciA9IDI7XG4gICAgY29uc3Qgc3dpcmwgPSBuZXcgVEhSRUUuTWVzaChuZXcgVEhSRUUuQ2lyY2xlR2VvbWV0cnkoMTIsIDI4KSwgbmV3IFRIUkVFLk1lc2hCYXNpY01hdGVyaWFsKHsgbWFwOiBzd2lybFRleHR1cmUoVC5nb2FsLCBULmdvYWxDb3JlKSB9KSk7XG4gICAgc3dpcmwudXNlckRhdGEub3duTWF0ID0gdHJ1ZTsgc3dpcmwucG9zaXRpb24ueiA9IDM7XG4gICAgY29uc3QgcmluZyA9IG5ldyBUSFJFRS5NZXNoKG5ldyBUSFJFRS5Ub3J1c0dlb21ldHJ5KDEzLCAyLjksIDEwLCAzMiksIG5ldyBUSFJFRS5NZXNoTGFtYmVydE1hdGVyaWFsKHsgY29sb3I6IFQuZ29hbCwgZW1pc3NpdmU6IHNoYWRlKFQuZ29hbCwgMC4zNSkgfSkpO1xuICAgIHJpbmcudXNlckRhdGEub3duTWF0ID0gdHJ1ZTsgcmluZy5wb3NpdGlvbi56ID0gNTtcbiAgICBnb2FsLmFkZChoYWxvLCBzd2lybCwgcmluZyk7XG4gICAgdGhpcy5sZXZlbC5hZGQoZ29hbCk7XG4gICAgaXQuZ29hbCA9IHsgZ3JvdXA6IGdvYWwsIHN3aXJsLCByaW5nLCBoYWxvIH07XG5cbiAgICB0aGlzLnNxdWFzaCA9IDA7IHRoaXMuc3BpblYgPSAwOyB0aGlzLmJhbGxTY2FsZSA9IDE7IHRoaXMuc2hha2UgPSAwOyB0aGlzLnpvb21UbyA9IDE7XG4gICAgdGhpcy5iYWxsLnZpc2libGUgPSB0cnVlOyB0aGlzLmJhbGxTaGFkb3cudmlzaWJsZSA9IHRydWU7XG4gICAgdGhpcy5pbnRybyA9IElOVFJPOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIG5ldyBsZXZlbCBwb3BzIGluXG4gIH1cblxuICAvKiogRG90dGVkIHJvdXRlIHRvIHRoZSBnb2FsICh0aGUgc29sdmVyJ3MgcGF0aCksIHNob3duIGFmdGVyIHJlcGVhdGVkIGZhaWx1cmVzLiAqL1xuICBzaG93SGludChwYXRoKSB7XG4gICAgdGhpcy5oaWRlSGludCgpO1xuICAgIGlmICghcGF0aCB8fCBwYXRoLmxlbmd0aCA8IDIpIHJldHVybjtcbiAgICBjb25zdCBwdHMgPSBbXSwgc3RlcCA9IDEzO1xuICAgIGxldCBjYXJyeSA9IDA7XG4gICAgZm9yIChsZXQgaSA9IDE7IGkgPCBwYXRoLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBheCA9IHBhdGhbaSAtIDFdWzBdLCBheSA9IHBhdGhbaSAtIDFdWzFdLCBieCA9IHBhdGhbaV1bMF0sIGJ5ID0gcGF0aFtpXVsxXSwgbGVuID0gTWF0aC5oeXBvdChieCAtIGF4LCBieSAtIGF5KTtcbiAgICAgIGlmIChsZW4gPCAxZS02KSBjb250aW51ZTtcbiAgICAgIGxldCBkID0gY2Fycnk7XG4gICAgICB3aGlsZSAoZCA8IGxlbikgeyBjb25zdCB0ID0gZCAvIGxlbjsgcHRzLnB1c2goYXggKyAoYnggLSBheCkgKiB0LCBheSArIChieSAtIGF5KSAqIHQsIDkpOyBkICs9IHN0ZXA7IH1cbiAgICAgIGNhcnJ5ID0gZCAtIGxlbjtcbiAgICB9XG4gICAgY29uc3QgZyA9IG5ldyBUSFJFRS5CdWZmZXJHZW9tZXRyeSgpO1xuICAgIGcuc2V0QXR0cmlidXRlKFwicG9zaXRpb25cIiwgbmV3IFRIUkVFLkZsb2F0MzJCdWZmZXJBdHRyaWJ1dGUocHRzLCAzKSk7XG4gICAgY29uc3QgbSA9IG5ldyBUSFJFRS5Qb2ludHNNYXRlcmlhbCh7IG1hcDogdGhpcy5nbG93VGV4LCBjb2xvcjogdGhpcy50aGVtZS5kYXJrID8gMHhmZmZmZmYgOiAweDZhM2RmMCwgc2l6ZTogMTAgKiB0aGlzLnByLCBzaXplQXR0ZW51YXRpb246IGZhbHNlLCB0cmFuc3BhcmVudDogdHJ1ZSwgb3BhY2l0eTogMC44NSwgZGVwdGhXcml0ZTogZmFsc2UgfSk7XG4gICAgdGhpcy5oaW50ID0gbmV3IFRIUkVFLlBvaW50cyhnLCBtKTtcbiAgICB0aGlzLmhpbnQudXNlckRhdGEub3duTWF0ID0gdHJ1ZTsgdGhpcy5oaW50LnJlbmRlck9yZGVyID0gNDtcbiAgICB0aGlzLmxldmVsLmFkZCh0aGlzLmhpbnQpO1xuICB9XG4gIGhpZGVIaW50KCkge1xuICAgIGlmICghdGhpcy5oaW50KSByZXR1cm47XG4gICAgdGhpcy5sZXZlbC5yZW1vdmUodGhpcy5oaW50KTsgdGhpcy5oaW50Lmdlb21ldHJ5LmRpc3Bvc2UoKTsgdGhpcy5oaW50Lm1hdGVyaWFsLmRpc3Bvc2UoKTsgdGhpcy5oaW50ID0gbnVsbDtcbiAgfVxuXG4gIC8qKiBMb3dlciB0aGUgcmVuZGVyaW5nIGNvc3QgYXQgcnVudGltZSAoY2FsbGVkIHdoZW4gdGhlIGZyYW1lIHJhdGUgaXMgcG9vcikuIFJldHVybnMgZmFsc2UgaWYgYWxyZWFkeSBtaW5pbWFsLiAqL1xuICBkZWdyYWRlKCkge1xuICAgIGlmICh0aGlzLnByIDw9IDEpIHJldHVybiBmYWxzZTtcbiAgICB0aGlzLnByID0gTWF0aC5tYXgoMSwgdGhpcy5wciAtIDAuNSk7XG4gICAgdGhpcy5yZW5kZXJlci5zZXRQaXhlbFJhdGlvKHRoaXMucHIpO1xuICAgIHRoaXMucmVuZGVyZXIuc2V0U2l6ZSh0aGlzLlcsIHRoaXMuSCwgZmFsc2UpO1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgcmVzaXplKCkge1xuICAgIGNvbnN0IFcgPSBNYXRoLm1heCgxLCB0aGlzLnN0YWdlLmNsaWVudFdpZHRoKSwgSCA9IE1hdGgubWF4KDEsIHRoaXMuc3RhZ2UuY2xpZW50SGVpZ2h0KTtcbiAgICB0aGlzLlcgPSBXOyB0aGlzLkggPSBIO1xuICAgIHRoaXMucmVuZGVyZXIuc2V0U2l6ZShXLCBILCBmYWxzZSk7XG4gICAgY29uc3QgY2FtID0gdGhpcy5jYW1lcmE7XG4gICAgY2FtLmFzcGVjdCA9IFcgLyBIO1xuICAgIGNvbnN0IHQgPSBNYXRoLnRhbigoRk9WICogTWF0aC5QSSkgLyAzNjApLCBpbnMgPSB0aGlzLmluc2V0cztcbiAgICBjb25zdCBmdiA9IE1hdGgubWF4KDAuMywgKEggLSBpbnMudG9wIC0gaW5zLmJvdHRvbSkgLyBIKSwgZmggPSBNYXRoLm1heCgwLjMsIChXIC0gaW5zLmxlZnQgLSBpbnMucmlnaHQpIC8gVyk7XG4gICAgY29uc3QgRCA9IE1hdGgubWF4KEZJVF9SIC8gKHQgKiBmdiksIEZJVF9SIC8gKHQgKiBjYW0uYXNwZWN0ICogZmgpKSAqIDEuMDM7XG4gICAgY29uc3QgdXBwID0gKDIgKiBEICogdCkgLyBIO1xuICAgIC8vIGdsaWRlIHRvIHRoZSBuZXcgZnJhbWluZyBpbnN0ZWFkIG9mIGp1bXBpbmcgKGhvbWUgPC0+IHBsYXksIHJvdGF0aW9uIG9mIHRoZSBkZXZpY2UpXG4gICAgdGhpcy5jYW1UbyA9IHsgRCwgbHg6ICgoaW5zLnJpZ2h0IC0gaW5zLmxlZnQpIC8gMikgKiB1cHAsIGx5OiAoKGlucy50b3AgLSBpbnMuYm90dG9tKSAvIDIpICogdXBwIH07XG4gICAgaWYgKCF0aGlzLmNhbSkgdGhpcy5jYW0gPSB7IC4uLnRoaXMuY2FtVG8gfTtcbiAgICBjYW0udXBkYXRlUHJvamVjdGlvbk1hdHJpeCgpO1xuICAgIHRoaXMuX3BsYWNlQ2FtZXJhKDAsIDApO1xuICB9XG5cbiAgX3BsYWNlQ2FtZXJhKHN4LCBzeSkge1xuICAgIGNvbnN0IHsgRCwgbHgsIGx5IH0gPSB0aGlzLmNhbSwgeiA9IHRoaXMuem9vbTtcbiAgICB0aGlzLmNhbWVyYS5wb3NpdGlvbi5zZXQobHggKyBzeCwgbHkgLSBNYXRoLnNpbihQSVRDSCkgKiBEICogeiArIHN5LCBNYXRoLmNvcyhQSVRDSCkgKiBEICogeik7XG4gICAgdGhpcy5jYW1lcmEubG9va0F0KGx4LCBseSwgMCk7XG4gIH1cblxuICAvKiogQXJlbmEtbG9jYWwgcG9pbnQgLT4gQ1NTIHBpeGVscyBpbnNpZGUgdGhlIHN0YWdlLiAqL1xuICB0b1NjcmVlbih4LCB5LCB6ID0gMCkge1xuICAgIGNvbnN0IHYgPSBuZXcgVEhSRUUuVmVjdG9yMyh4LCB5LCB6KS5hcHBseU1hdHJpeDQodGhpcy53b3JsZC5tYXRyaXhXb3JsZCkucHJvamVjdCh0aGlzLmNhbWVyYSk7XG4gICAgcmV0dXJuIHsgeDogKHYueCAqIDAuNSArIDAuNSkgKiB0aGlzLlcsIHk6ICgtdi55ICogMC41ICsgMC41KSAqIHRoaXMuSCB9O1xuICB9XG5cbiAgLy8gLS0tLSBlZmZlY3RzIChjYWxsZWQgYnkgdGhlIGdhbWUgb24gc2ltIGV2ZW50cykgLS0tLVxuICBmeEhpdCh4LCB5LCB2KSB7XG4gICAgdGhpcy5zcXVhc2ggPSBNYXRoLm1heCh0aGlzLnNxdWFzaCwgTWF0aC5taW4oMC4zNCwgdiAvIDE1MDApKTtcbiAgICBpZiAodiA+IDI2MCkgdGhpcy5zaGFrZSA9IE1hdGgubWF4KHRoaXMuc2hha2UsIE1hdGgubWluKDUsIHYgLyAyMjApKTtcbiAgICBpZiAodiA+IDE3MCAmJiB0aGlzLnRpZXIgPiAwKSB0aGlzLmZ4LmJ1cnN0KHgsIHksIHsgbjogTWF0aC5taW4oOCwgMiArICh2IC8gMTMwKSB8IDApLCBzcGVlZDogdiAqIDAuMzUsIGNvbG9yOiB0aGlzLnRoZW1lLmRhcmsgPyAweDlmYjRmZiA6IDB4ZmZmZmZmLCBzaXplOiAzLjIsIGxpZmU6IDAuMzIsIHo6IDEwIH0pO1xuICB9XG4gIGZ4R2VtKHgsIHkpIHtcbiAgICB0aGlzLmZ4LmJ1cnN0KHgsIHksIHsgbjogdGhpcy50aWVyID8gMTYgOiA5LCBzcGVlZDogMTkwLCBjb2xvcnM6IFt0aGlzLnRoZW1lLmdlbSwgMHhmZmZmZmYsIHNoYWRlKHRoaXMudGhlbWUuZ2VtLCAxLjIpXSwgc2l6ZTogNC40LCBsaWZlOiAwLjU1IH0pO1xuICAgIHRoaXMuZngucmluZyh4LCB5LCB0aGlzLnRoZW1lLmdlbSwgOCwgNDQsIDAuMzIpO1xuICB9XG4gIGZ4RGllKHgsIHkpIHtcbiAgICB0aGlzLnNoYWtlID0gOTtcbiAgICB0aGlzLmZ4LmJ1cnN0KHgsIHksIHsgbjogdGhpcy50aWVyID8gMjYgOiAxNCwgc3BlZWQ6IDI4MCwgY29sb3JzOiBbdGhpcy50aGVtZS5zcGlrZSwgMHhmZmZmZmYsIHNraW5UcmFpbCh0aGlzLnNraW4pXSwgc2l6ZTogNS41LCBsaWZlOiAwLjcsIGc6IDUyMCB9KTtcbiAgICB0aGlzLmZ4LnJpbmcoeCwgeSwgdGhpcy50aGVtZS5zcGlrZSwgMTAsIDcwLCAwLjQpO1xuICB9XG4gIGZ4V2luKHgsIHkpIHtcbiAgICB0aGlzLnpvb21UbyA9IDAuOTQ7XG4gICAgdGhpcy5meC5yaW5nKHgsIHksIHRoaXMudGhlbWUuZ29hbCwgMTQsIDExMCwgMC41NSk7XG4gICAgY29uc3QgY29scyA9IFsweGZmNGQ2ZCwgMHhmZmMyMWYsIDB4M2RkYzk3LCAweDRkYWJmZiwgMHhiMDdiZmYsIDB4ZmZmZmZmXTtcbiAgICB0aGlzLmZ4LmJ1cnN0KHgsIHksIHsgbjogdGhpcy50aWVyID8gNDYgOiAyMiwgc3BlZWQ6IDMzMCwgY29sb3JzOiBjb2xzLCBzaXplOiA2LCBsaWZlOiAxLjI1LCBnOiAzODAsIGRyYWc6IDAuOSB9KTtcbiAgfVxuICBmeEJ1bXAoeCwgeSkgeyB0aGlzLmZ4LnJpbmcoeCwgeSwgdGhpcy50aGVtZS5idW1wZXIsIDE0LCA0MCwgMC4yNSk7IHRoaXMuc2hha2UgPSBNYXRoLm1heCh0aGlzLnNoYWtlLCAyLjUpOyB9XG4gIGZ4U2hhdHRlcih4LCB5KSB7IHRoaXMuc2hha2UgPSA3OyB0aGlzLmZ4LmJ1cnN0KHgsIHksIHsgbjogMjIsIHNwZWVkOiAzMDAsIGNvbG9yczogW3RoaXMudGhlbWUuY3J5c3RhbCwgMHhmZmZmZmZdLCBzaXplOiA2LCBsaWZlOiAwLjcsIGc6IDUwMCB9KTsgfVxuICBmeEtleSh4LCB5LCBhbGwpIHsgdGhpcy5meC5idXJzdCh4LCB5LCB7IG46IHRoaXMudGllciA/IDE4IDogMTAsIHNwZWVkOiAyMDAsIGNvbG9yczogW0RPT1JfQ09MT1IsIDB4ZmZmZmZmXSwgc2l6ZTogNC42LCBsaWZlOiAwLjYgfSk7IHRoaXMuZngucmluZyh4LCB5LCBET09SX0NPTE9SLCA4LCBhbGwgPyA5MCA6IDQ2LCAwLjM2KTsgfVxuICBmeFBvcnQoeCwgeSwgaSkgeyB0aGlzLmZ4LnJpbmcoeCwgeSwgUE9SVF9DT0xPUlNbKGkgPj4gMSkgJSBQT1JUX0NPTE9SUy5sZW5ndGhdLCAxMiwgNjAsIDAuMyk7IH1cbiAgZnhQYWQoeCwgeSkgeyB0aGlzLmZ4LnJpbmcoeCwgeSwgdGhpcy50aGVtZS5wYWQsIDgsIDM2LCAwLjI1KTsgfVxuXG4gIC8qKiBEcmF3IG9uZSBmcmFtZS4gYHRgIHNlY29uZHMgKHdhbGwgY2xvY2spLCBgZHRgIGZyYW1lIHRpbWUuICovXG4gIGRyYXcoc2ltLCB0LCBkdCkge1xuICAgIGNvbnN0IGl0ID0gdGhpcy5pdGVtcywgYW5nID0gc2ltLmFuZ2xlLCBmID0gc2ltLmZvcm0sIHIgPSBmLnI7XG4gICAgdGhpcy53b3JsZC5yb3RhdGlvbi56ID0gYW5nO1xuICAgIGNvbnN0IGMgPSBNYXRoLmNvcyhhbmcpLCBzID0gTWF0aC5zaW4oYW5nKTtcbiAgICBjb25zdCBveCA9IFNIWCAqIGMgKyBTSFkgKiBzLCBveSA9IC1TSFggKiBzICsgU0hZICogYzsgICAvLyBzY3JlZW4tc3BhY2Ugc2hhZG93IG9mZnNldCBpbiB0aGUgYXJlbmEgZnJhbWVcbiAgICB0aGlzLnNoYWRvd01lc2gucG9zaXRpb24uc2V0KG94LCBveSwgMCk7XG5cbiAgICBmb3IgKGNvbnN0IG0gb2YgaXQubW92ZXJzKSB7IHBhdGhQb3MobS5kLCBzaW0udGltZSwgUCk7IG0ubWVzaC5wb3NpdGlvbi5zZXQoUC54LCBQLnksIDApOyBtLnNoYWRvdy5wb3NpdGlvbi5zZXQoUC54ICsgb3gsIFAueSArIG95LCAwKTsgfVxuICAgIGZvciAoY29uc3QgdyBvZiBpdC5zYXdzKSB7IHBhdGhQb3Mody5kLCBzaW0udGltZSwgUCk7IHcubWVzaC5wb3NpdGlvbi5zZXQoUC54LCBQLnksIDApOyB3Lm1lc2gucm90YXRpb24ueiAtPSBkdCAqIDk7IHcuc2hhZG93LnBvc2l0aW9uLnNldChQLnggKyBveCwgUC55ICsgb3ksIDApOyB9XG4gICAgZm9yIChjb25zdCBnIG9mIGl0LmdlbXMpIHtcbiAgICAgIGNvbnN0IG9uID0gIShzaW0uZ2VtcyAmICgxIDw8IGcuaSkpO1xuICAgICAgZy5tZXNoLnZpc2libGUgPSBvbjsgZy5oYWxvLnZpc2libGUgPSBvbjtcbiAgICAgIGlmIChvbikgeyBnLm1lc2gucm90YXRpb24ueSA9IHQgKiAyLjQgKyBnLmkgKiAyOyBnLm1lc2gucm90YXRpb24ueiA9IC1hbmc7IGcubWVzaC5wb3NpdGlvbi56ID0gMTQgKyBNYXRoLnNpbih0ICogMyArIGcuaSkgKiAyOyBjb25zdCBrID0gMSArIE1hdGguc2luKHQgKiA0ICsgZy5pKSAqIDAuMDg7IGcuaGFsby5zY2FsZS5zZXQoaywgaywgMSk7IH1cbiAgICB9XG4gICAgZm9yIChjb25zdCBjciBvZiBpdC5jcnlzdGFscykgY3IubWVzaC52aXNpYmxlID0gIShzaW0uY3J5cyAmICgxIDw8IGNyLmkpKTtcbiAgICBmb3IgKGNvbnN0IGsgb2YgaXQua2V5cykge1xuICAgICAgY29uc3Qgb24gPSAhKHNpbS5rZXlzICYgKDEgPDwgay5pKSk7XG4gICAgICBrLm1lc2gudmlzaWJsZSA9IG9uOyBrLmhhbG8udmlzaWJsZSA9IG9uO1xuICAgICAgaWYgKG9uKSB7IGsubWVzaC5yb3RhdGlvbi56ID0gLWFuZyArIE1hdGguc2luKHQgKiAyLjIgKyBrLmkpICogMC4zNTsgay5tZXNoLnBvc2l0aW9uLnogPSAxNCArIE1hdGguc2luKHQgKiAzICsgay5pKSAqIDI7IH1cbiAgICB9XG4gICAgY29uc3Qgb3BlbiA9IHNpbS5rZXlzID09PSBzaW0ubHZsLmtleU1hc2s7XG4gICAgZm9yIChjb25zdCBkIG9mIGl0LmRvb3JzKSB7XG4gICAgICBkLmsgKz0gKChvcGVuID8gMCA6IDEpIC0gZC5rKSAqIE1hdGgubWluKDEsIGR0ICogMTIpO1xuICAgICAgY29uc3QgdmlzID0gZC5rID4gMC4wMztcbiAgICAgIGQubWVzaC52aXNpYmxlID0gdmlzOyBkLnNoYWRvdy52aXNpYmxlID0gdmlzO1xuICAgICAgaWYgKHZpcykgeyBkLm1lc2guc2NhbGUuc2V0KDEsIDEsIE1hdGgubWF4KDAuMDIsIGQuaykpOyBkLnNoYWRvdy5wb3NpdGlvbi5zZXQoZC5kLmN4ICsgb3ggKiBkLmssIGQuZC5jeSArIG95ICogZC5rLCAwKTsgfVxuICAgIH1cbiAgICBmb3IgKGNvbnN0IGx6IG9mIGl0Lmxhc2Vycykge1xuICAgICAgY29uc3QgZCA9IGx6LmQsIG9uID0gbGFzZXJPbihkLCBzaW0udGltZSk7XG4gICAgICBsZXQgd2FybiA9IGZhbHNlO1xuICAgICAgaWYgKCFvbiAmJiBkLnBlcmlvZCkgeyBsZXQgcGggPSAoc2ltLnRpbWUgKyBkLnBoKSAlIGQucGVyaW9kOyBpZiAocGggPCAwKSBwaCArPSBkLnBlcmlvZDsgd2FybiA9IGQucGVyaW9kIC0gcGggPCAwLjQ1OyB9XG4gICAgICBsei5tZXNoLm1hdGVyaWFsLm9wYWNpdHkgPSBvbiA/IDAuODUgKyAwLjE1ICogTWF0aC5zaW4odCAqIDQwKSA6IHdhcm4gPyAoTWF0aC5zaW4odCAqIDM4KSA+IDAgPyAwLjU1IDogMC4xMikgOiAwLjE7XG4gICAgICBsei5nbG93LnZpc2libGUgPSBvbjtcbiAgICB9XG4gICAgZm9yIChjb25zdCBmbiBvZiBpdC5mYW5zKSBmbi50ZXgub2Zmc2V0LnkgPSAtKCh0ICogMS42KSAlIDEpO1xuICAgIGZvciAoY29uc3QgcCBvZiBpdC5wb3J0cykgeyBwLmRpc2Mucm90YXRpb24ueiA9IHQgKiAzLjI7IGNvbnN0IGsgPSAxICsgTWF0aC5zaW4odCAqIDQpICogMC4wNjsgcC5yaW5nLnNjYWxlLnNldChrLCBrLCAxKTsgfVxuICAgIGNvbnN0IGdvID0gaXQuZ29hbDtcbiAgICBnby5zd2lybC5yb3RhdGlvbi56ID0gLXQgKiAyLjY7XG4gICAgY29uc3QgZ2sgPSAxICsgTWF0aC5zaW4odCAqIDMuMikgKiAwLjA1O1xuICAgIGdvLnJpbmcuc2NhbGUuc2V0KGdrLCBnaywgMSk7IGdvLmhhbG8uc2NhbGUuc2V0KGdrICogMS4wNSwgZ2sgKiAxLjA1LCAxKTtcblxuICAgIC8vIGJhbGxcbiAgICBjb25zdCBicyA9IHRoaXMuYmFsbFNjYWxlO1xuICAgIHRoaXMuYmFsbC5wb3NpdGlvbi5zZXQoc2ltLngsIHNpbS55LCByKTtcbiAgICBpZiAoc2ltLmFpciA8IDMpIHRoaXMuc3BpblYgPSAoc2ltLm54ICogc2ltLnZ5IC0gc2ltLm55ICogc2ltLnZ4KSAvIHI7IGVsc2UgdGhpcy5zcGluViAqPSBNYXRoLm1heCgwLCAxIC0gMC41ICogZHQpO1xuICAgIHRoaXMuc3BpbiArPSB0aGlzLnNwaW5WICogZHQ7XG4gICAgdGhpcy5iYWxsU3Bpbi5yb3RhdGlvbi56ID0gdGhpcy5zcGluO1xuICAgIHRoaXMuc3F1YXNoICo9IE1hdGguZXhwKC1kdCAqIDEzKTtcbiAgICBjb25zdCBhID0gTWF0aC5hdGFuMihzaW0ubnksIHNpbS5ueCksIGsgPSB0aGlzLnNxdWFzaDtcbiAgICB0aGlzLmJhbGxTcS5yb3RhdGlvbi56ID0gYTsgdGhpcy5iYWxsVW4ucm90YXRpb24ueiA9IC1hO1xuICAgIHRoaXMuYmFsbFNxLnNjYWxlLnNldChyICogKDEgLSBrKSAqIGJzLCByICogKDEgKyBrICogMC43KSAqIGJzLCByICogYnMpO1xuICAgIHRoaXMuYmFsbFNoYWRvdy5wb3NpdGlvbi5zZXQoc2ltLnggKyBveCAqIDEuMSwgc2ltLnkgKyBveSAqIDEuMSwgMC43KTtcbiAgICB0aGlzLmJhbGxTaGFkb3cuc2NhbGUuc2V0KHIgKiAxLjAyICogYnMsIHIgKiAxLjAyICogYnMsIDEpO1xuXG4gICAgLy8gdHJhaWxcbiAgICBpZiAodGhpcy5iYWxsLnZpc2libGUgJiYgc2ltLmFsaXZlICYmICFzaW0ud29uKSB7XG4gICAgICBjb25zdCBzcCA9IE1hdGguaHlwb3Qoc2ltLnZ4LCBzaW0udnkpO1xuICAgICAgdGhpcy50cmFpbFQgLT0gZHQ7XG4gICAgICBpZiAoc3AgPiAxNTAgJiYgdGhpcy50cmFpbFQgPD0gMCkge1xuICAgICAgICB0aGlzLnRyYWlsVCA9IHRoaXMudGllciA/IDAuMDMgOiAwLjA2O1xuICAgICAgICB0aGlzLmZ4LnNwYXduKHsgeDogc2ltLngsIHk6IHNpbS55LCB6OiByICogMC42LCBzaXplOiByICogMS4yNSwgbGlmZTogMC4yMiwgY29sb3I6IHNraW5UcmFpbCh0aGlzLnNraW4pLCBmbGF0OiB0cnVlLCBzcGluOiAwIH0pO1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLmZ4LnVwZGF0ZShkdCwgLXMsIC1jKTtcblxuICAgIGlmICh0aGlzLmhpbnQpIHRoaXMuaGludC5tYXRlcmlhbC5vcGFjaXR5ID0gMC42ICsgMC4zICogTWF0aC5zaW4odCAqIDUpO1xuXG4gICAgLy8gbGV2ZWwgcG9wLWluXG4gICAgaWYgKHRoaXMuaW50cm8gPiAwKSB7XG4gICAgICB0aGlzLmludHJvID0gTWF0aC5tYXgoMCwgdGhpcy5pbnRybyAtIGR0KTtcbiAgICAgIGNvbnN0IHEgPSAxIC0gdGhpcy5pbnRybyAvIElOVFJPLCBlID0gMSAtIE1hdGgucG93KDEgLSBxLCAzKTtcbiAgICAgIHRoaXMud29ybGQuc2NhbGUuc2V0U2NhbGFyKDAuODYgKyAwLjE0ICogZSk7XG4gICAgfVxuXG4gICAgLy8gY2FtZXJhIGZlZWxcbiAgICBjb25zdCBjayA9IE1hdGgubWluKDEsIGR0ICogNyksIGNtID0gdGhpcy5jYW0sIGN0ID0gdGhpcy5jYW1UbztcbiAgICBjbS5EICs9IChjdC5EIC0gY20uRCkgKiBjazsgY20ubHggKz0gKGN0Lmx4IC0gY20ubHgpICogY2s7IGNtLmx5ICs9IChjdC5seSAtIGNtLmx5KSAqIGNrO1xuICAgIHRoaXMuem9vbSArPSAodGhpcy56b29tVG8gLSB0aGlzLnpvb20pICogTWF0aC5taW4oMSwgZHQgKiA2KTtcbiAgICB0aGlzLnNoYWtlICo9IE1hdGguZXhwKC1kdCAqIDEwKTtcbiAgICBjb25zdCBzaCA9IHRoaXMuc2hha2UgPiAwLjA1ID8gdGhpcy5zaGFrZSA6IDA7XG4gICAgdGhpcy5fcGxhY2VDYW1lcmEoKE1hdGgucmFuZG9tKCkgLSAwLjUpICogMiAqIHNoLCAoTWF0aC5yYW5kb20oKSAtIDAuNSkgKiAyICogc2gpO1xuXG4gICAgdGhpcy5yZW5kZXJlci5yZW5kZXIodGhpcy5zY2VuZSwgdGhpcy5jYW1lcmEpO1xuICB9XG5cbiAgaW5mbygpIHsgY29uc3QgaSA9IHRoaXMucmVuZGVyZXIuaW5mby5yZW5kZXI7IHJldHVybiB7IGNhbGxzOiBpLmNhbGxzLCB0cmlzOiBpLnRyaWFuZ2xlcyB9OyB9XG59XG5cbmZ1bmN0aW9uIHNraW5UcmFpbChza2luKSB7IHJldHVybiBza2luLnRyYWlsIHx8IDB4ZmZmZmZmOyB9XG4iLCAiLy8gRE9NIHVzZXIgaW50ZXJmYWNlLiBLbm93cyBub3RoaW5nIGFib3V0IHBoeXNpY3Mgb3IgcmVuZGVyaW5nOyB0YWxrcyB0byB0aGUgZ2FtZSB0aHJvdWdoIGhhbmRsZXJzLlxuaW1wb3J0IHsgU0tJTlMsIHNraW5Td2F0Y2ggfSBmcm9tIFwiLi4vcmVuZGVyL3NraW5zLmpzXCI7XG5jb25zdCAkID0gKGlkKSA9PiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChpZCk7XG5jb25zdCBTQ1JFRU5TID0gW1wic2NyTG9hZGluZ1wiLCBcInNjckhvbWVcIiwgXCJzY3JXaW5cIiwgXCJzY3JNYXBcIiwgXCJzY3JTaG9wXCIsIFwic2NyU2V0dGluZ3NcIiwgXCJzY3JFbmRcIiwgXCJzY3JFcnJvclwiXTtcbmNvbnN0IEdFTSA9ICc8c3ZnIHZpZXdCb3g9XCIwIDAgMjQgMjRcIj48cGF0aCBkPVwiTTEyIDJsNyA5LTcgMTEtNy0xMXpcIiBmaWxsPVwiY3VycmVudENvbG9yXCIvPjwvc3ZnPic7XG5jb25zdCBDSEVDSyA9ICc8c3ZnIHZpZXdCb3g9XCIwIDAgMjQgMjRcIj48cGF0aCBkPVwiTTUgMTIuNTAwbDQuNTAwIDQuNTAwTDE5IDcuNTAwXCIgZmlsbD1cIm5vbmVcIiBzdHJva2U9XCJjdXJyZW50Q29sb3JcIiBzdHJva2Utd2lkdGg9XCIzXCIgc3Ryb2tlLWxpbmVjYXA9XCJyb3VuZFwiIHN0cm9rZS1saW5lam9pbj1cInJvdW5kXCIvPjwvc3ZnPic7XG5cbmV4cG9ydCBjbGFzcyBVSSB7XG4gIC8qKiBAcGFyYW0gaCBoYW5kbGVyczogcGxheSwgbmV4dCwgcmV0cnksIG9wZW5NYXAsIHBpY2soaSksIG9wZW5TZXR0aW5ncywgY2xvc2VPdmVybGF5LCBkb3VibGUsIHJlc3RhcnQsIHNldE9wdChrZXksIHZhbHVlKSwgZ2VzdHVyZSAqL1xuICBjb25zdHJ1Y3RvcihpMThuLCBoKSB7XG4gICAgdGhpcy5pMThuID0gaTE4bjsgdGhpcy5oID0gaDsgdGhpcy5zY3JlZW4gPSBcInNjckxvYWRpbmdcIjsgdGhpcy50b2FzdFQgPSAwOyB0aGlzLnN0YXJUaW1lcnMgPSBbXTtcbiAgICBjb25zdCBvbiA9IChpZCwgZm4pID0+ICQoaWQpLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoZSkgPT4geyBoLmdlc3R1cmUoKTsgZm4oZSk7IH0pO1xuICAgIG9uKFwiYnRuUGxheVwiLCAoKSA9PiBoLnBsYXkoKSk7XG4gICAgb24oXCJidG5EYWlseVwiLCAoKSA9PiBoLmRhaWx5KCkpO1xuICAgIG9uKFwiYnRuTGV2ZWxzXCIsICgpID0+IGgub3Blbk1hcCgpKTtcbiAgICBvbihcImJ0blNldHRpbmdzXCIsICgpID0+IGgub3BlblNldHRpbmdzKCkpO1xuICAgIG9uKFwiYnRuTmV4dFwiLCAoKSA9PiBoLm5leHQoKSk7XG4gICAgb24oXCJidG5SZXRyeVwiLCAoKSA9PiBoLnJldHJ5KCkpO1xuICAgIG9uKFwiYnRuV2luTWFwXCIsICgpID0+IGgub3Blbk1hcCgpKTtcbiAgICBvbihcImJ0bkRvdWJsZVwiLCAoKSA9PiBoLmRvdWJsZSgpKTtcbiAgICBvbihcImJ0bk1hcENsb3NlXCIsICgpID0+IGguY2xvc2VPdmVybGF5KCkpO1xuICAgIG9uKFwiYnRuTWFwSG9tZVwiLCAoKSA9PiBoLmhvbWUoKSk7XG4gICAgb24oXCJidG5TZXRDbG9zZVwiLCAoKSA9PiBoLmNsb3NlT3ZlcmxheSgpKTtcbiAgICBvbihcImJ0bkVuZE1hcFwiLCAoKSA9PiBoLm9wZW5NYXAoKSk7XG4gICAgb24oXCJidG5SZXN0YXJ0XCIsICgpID0+IGgucmVzdGFydCgpKTtcbiAgICBvbihcImJ0bk1hcFwiLCAoKSA9PiBoLm9wZW5NYXAoKSk7XG4gICAgb24oXCJidG5TaG9wXCIsICgpID0+IGgub3BlblNob3AoKSk7XG4gICAgb24oXCJidG5TaG9wQ2xvc2VcIiwgKCkgPT4gaC5jbG9zZU92ZXJsYXkoKSk7XG4gICAgb24oXCJidG5IaW50XCIsICgpID0+IGguaGludCgpKTtcbiAgICBvbihcImJ0blNraXBcIiwgKCkgPT4gaC5za2lwKCkpO1xuICAgICQoXCJvcHRNdXNpY1wiKS5hZGRFdmVudExpc3RlbmVyKFwiY2hhbmdlXCIsIChlKSA9PiB7IGguZ2VzdHVyZSgpOyBoLnNldE9wdChcIm11c2ljXCIsIGUudGFyZ2V0LmNoZWNrZWQgPyAxIDogMCk7IH0pO1xuICAgICQoXCJvcHRTZnhcIikuYWRkRXZlbnRMaXN0ZW5lcihcImNoYW5nZVwiLCAoZSkgPT4geyBoLmdlc3R1cmUoKTsgaC5zZXRPcHQoXCJzZnhcIiwgZS50YXJnZXQuY2hlY2tlZCA/IDEgOiAwKTsgfSk7XG4gICAgJChcIm9wdEN0bFwiKS5xdWVyeVNlbGVjdG9yQWxsKFwiYnV0dG9uXCIpLmZvckVhY2goKGIpID0+IGIuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHsgaC5nZXN0dXJlKCk7IGguc2V0T3B0KFwiY3RsXCIsIGIuZGF0YXNldC52KTsgdGhpcy5fc2VnKGIuZGF0YXNldC52KTsgfSkpO1xuICAgIGkxOG4uYXBwbHkoZG9jdW1lbnQpO1xuICB9XG5cbiAgc2hvdyhuYW1lKSB7XG4gICAgdGhpcy5zY3JlZW4gPSBuYW1lO1xuICAgIGZvciAoY29uc3QgcyBvZiBTQ1JFRU5TKSAkKHMpLmNsYXNzTGlzdC50b2dnbGUoXCJoaWRkZW5cIiwgcyAhPT0gbmFtZSk7XG4gIH1cbiAgaHVkKG9uKSB7ICQoXCJodWRcIikuY2xhc3NMaXN0LnRvZ2dsZShcImhpZGRlblwiLCAhb24pOyB9XG4gIHNldEh1ZChsZXZlbE51bSwgZ290LCB0b3RhbCkge1xuICAgICQoXCJodWRMZXZlbFwiKS50ZXh0Q29udGVudCA9IGxldmVsTnVtO1xuICAgIGNvbnN0IHNsb3RzID0gJChcImh1ZEdlbXNcIikuY2hpbGRyZW47XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzbG90cy5sZW5ndGg7IGkrKykgeyBzbG90c1tpXS5jbGFzc0xpc3QudG9nZ2xlKFwib25cIiwgaSA8IGdvdCk7IHNsb3RzW2ldLnN0eWxlLmRpc3BsYXkgPSBpIDwgdG90YWwgPyBcIlwiIDogXCJub25lXCI7IH1cbiAgfVxuICBzZXRUaGVtZSh0aGVtZSkge1xuICAgIGNvbnN0IGFwcCA9ICQoXCJhcHBcIik7XG4gICAgYXBwLnN0eWxlLnNldFByb3BlcnR5KFwiLS1iZzFcIiwgdGhlbWUuYmdbMF0pOyBhcHAuc3R5bGUuc2V0UHJvcGVydHkoXCItLWJnMlwiLCB0aGVtZS5iZ1sxXSk7XG4gICAgYXBwLmNsYXNzTGlzdC50b2dnbGUoXCJkYXJrXCIsICEhdGhlbWUuZGFyayk7XG4gIH1cblxuICBob21lKHsgbGV2ZWxOdW0sIHN0YXJzLCBnZW1zLCBkYWlseSB9KSB7XG4gICAgJChcInBsYXlMYWJlbFwiKS50ZXh0Q29udGVudCA9IGAke3RoaXMuaTE4bi50KFwibGV2ZWxcIil9ICR7bGV2ZWxOdW19YDtcbiAgICBjb25zdCBkYiA9ICQoXCJidG5EYWlseVwiKTtcbiAgICBkYi5jbGFzc0xpc3QudG9nZ2xlKFwiaGlkZGVuXCIsICFkYWlseSk7XG4gICAgaWYgKGRhaWx5KSB7IGRiLmNsYXNzTGlzdC50b2dnbGUoXCJkb25lXCIsIGRhaWx5LmRvbmUpOyAkKFwiZGFpbHlCYWRnZVwiKS50ZXh0Q29udGVudCA9IGRhaWx5LmRvbmUgPyBcIlx1MjcxM1wiIDogZGFpbHkuc3RyZWFrID4gMCA/IGRhaWx5LnN0cmVhayA6IFwiXCI7IH1cbiAgICAkKFwiaG9tZVN0YXJzXCIpLnRleHRDb250ZW50ID0gc3RhcnM7ICQoXCJob21lR2Vtc1wiKS50ZXh0Q29udGVudCA9IGdlbXM7XG4gICAgdGhpcy5zaG93KFwic2NySG9tZVwiKTtcbiAgfVxuXG4gIHdpbih7IHN0YXJzLCB0aW1lLCBwYXIsIGdvdCwgdG90YWwsIGJvbnVzID0gMCwgY2FuRG91YmxlLCBvblN0YXIgfSkge1xuICAgICQoXCJ3aW5UaXRsZVwiKS50ZXh0Q29udGVudCA9IHRoaXMuaTE4bi50KFwid2luXCIgKyBzdGFycyk7XG4gICAgJChcIndpblRpbWVcIikudGV4dENvbnRlbnQgPSB0aW1lLnRvRml4ZWQoMSkgKyBcInNcIjtcbiAgICAkKFwid2luUGFyXCIpLnRleHRDb250ZW50ID0gXCIvIFwiICsgcGFyICsgXCJzXCI7XG4gICAgJChcIndpblRpbWVcIikucGFyZW50RWxlbWVudC5jbGFzc0xpc3QudG9nZ2xlKFwib2tcIiwgdGltZSA8PSBwYXIpO1xuICAgICQoXCJ3aW5HZW1zXCIpLnRleHRDb250ZW50ID0gYCR7Z290fS8ke3RvdGFsfWAgKyAoYm9udXMgPyBgICske2JvbnVzfWAgOiBcIlwiKTtcbiAgICAkKFwid2luR2Vtc1wiKS5wYXJlbnRFbGVtZW50LmNsYXNzTGlzdC50b2dnbGUoXCJva1wiLCBnb3QgPT09IHRvdGFsKTtcbiAgICAkKFwiYnRuRG91YmxlXCIpLmNsYXNzTGlzdC50b2dnbGUoXCJoaWRkZW5cIiwgIWNhbkRvdWJsZSk7XG4gICAgJChcImJ0bkRvdWJsZVwiKS5kaXNhYmxlZCA9IGZhbHNlO1xuICAgIGNvbnN0IGNlbGxzID0gJChcIndpblN0YXJzXCIpLmNoaWxkcmVuO1xuICAgIHRoaXMuc3RhclRpbWVycy5mb3JFYWNoKGNsZWFyVGltZW91dCk7IHRoaXMuc3RhclRpbWVycyA9IFtdO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgMzsgaSsrKSB7XG4gICAgICBjZWxsc1tpXS5jbGFzc0xpc3QucmVtb3ZlKFwib25cIik7XG4gICAgICBpZiAoaSA8IHN0YXJzKSB0aGlzLnN0YXJUaW1lcnMucHVzaChzZXRUaW1lb3V0KCgpID0+IHsgY2VsbHNbaV0uY2xhc3NMaXN0LmFkZChcIm9uXCIpOyBpZiAob25TdGFyKSBvblN0YXIoaSk7IH0sIDIyMCArIGkgKiAyNjApKTtcbiAgICB9XG4gICAgdGhpcy5zaG93KFwic2NyV2luXCIpO1xuICAgICQoXCJidG5OZXh0XCIpLmZvY3VzKHsgcHJldmVudFNjcm9sbDogdHJ1ZSB9KTtcbiAgfVxuICBzZXRXaW5HZW1zKHRleHQpIHsgJChcIndpbkdlbXNcIikudGV4dENvbnRlbnQgPSB0ZXh0OyB9XG4gIGRvdWJsZURvbmUoKSB7ICQoXCJidG5Eb3VibGVcIikuY2xhc3NMaXN0LmFkZChcImhpZGRlblwiKTsgfVxuICBkb3VibGVCdXN5KGIpIHsgJChcImJ0bkRvdWJsZVwiKS5kaXNhYmxlZCA9IGI7IH1cblxuICBtYXAoeyBzdGFycywgbWF4LCBjb3VudCwgY3VycmVudCwgd29ybGRzID0gW10gfSkge1xuICAgIGNvbnN0IGdyaWQgPSAkKFwibWFwR3JpZFwiKTtcbiAgICBncmlkLnRleHRDb250ZW50ID0gXCJcIjtcbiAgICBsZXQgdG90YWwgPSAwLCBmb2N1cyA9IG51bGw7XG4gICAgY29uc3QgaGVhZHMgPSBuZXcgTWFwKCk7ICAgICAgICAgICAvLyBmaXJzdCBsZXZlbCBpbmRleCBvZiBlYWNoIHdvcmxkIC0+IHdvcmxkIGluZm9cbiAgICBsZXQgYXQgPSAwO1xuICAgIHdvcmxkcy5mb3JFYWNoKCh3LCBrKSA9PiB7IGhlYWRzLnNldChhdCwgeyBrLCAuLi53LCBmcm9tOiBhdCB9KTsgYXQgKz0gdy5uOyB9KTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNvdW50OyBpKyspIHtcbiAgICAgIGNvbnN0IGhkID0gd29ybGRzLmxlbmd0aCA+IDEgJiYgaGVhZHMuZ2V0KGkpO1xuICAgICAgaWYgKGhkKSB7XG4gICAgICAgIGNvbnN0IHNlcCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgICAgIHNlcC5jbGFzc05hbWUgPSBcIndzZXBcIjtcbiAgICAgICAgbGV0IGdvdCA9IDA7IGZvciAobGV0IGogPSBoZC5mcm9tOyBqIDwgaGQuZnJvbSArIGhkLm47IGorKykgZ290ICs9IHN0YXJzW2pdIHx8IDA7XG4gICAgICAgIGNvbnN0IGRvdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJpXCIpOyBkb3Quc3R5bGUuYmFja2dyb3VuZCA9IFwiI1wiICsgaGQuY29sb3IudG9TdHJpbmcoMTYpLnBhZFN0YXJ0KDYsIFwiMFwiKTtcbiAgICAgICAgY29uc3Qgbm0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYlwiKTsgbm0udGV4dENvbnRlbnQgPSBoZC5rICsgMTtcbiAgICAgICAgY29uc3Qgc2MgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTsgc2MudGV4dENvbnRlbnQgPSBgXHUyNjA1ICR7Z290fS8ke2hkLm4gKiAzfWA7XG4gICAgICAgIHNlcC5hcHBlbmQoZG90LCBubSwgc2MpO1xuICAgICAgICBncmlkLmFwcGVuZENoaWxkKHNlcCk7XG4gICAgICB9XG4gICAgICBjb25zdCBzdCA9IHN0YXJzW2ldIHx8IDA7IHRvdGFsICs9IHN0O1xuICAgICAgY29uc3QgYiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJidXR0b25cIik7XG4gICAgICBiLnR5cGUgPSBcImJ1dHRvblwiO1xuICAgICAgYi5jbGFzc05hbWUgPSBcImx2bFwiICsgKGkgPiBtYXggPyBcIiBsb2NrXCIgOiBzdCA/IFwiIGRvbmVcIiA6IFwiXCIpICsgKGkgPT09IGN1cnJlbnQgPyBcIiBjdXJcIiA6IFwiXCIpO1xuICAgICAgYi5zZXRBdHRyaWJ1dGUoXCJhcmlhLWxhYmVsXCIsIGAke3RoaXMuaTE4bi50KFwibGV2ZWxcIil9ICR7aSArIDF9YCk7XG4gICAgICBjb25zdCBudW0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTsgbnVtLnRleHRDb250ZW50ID0gaSArIDE7XG4gICAgICBjb25zdCByb3cgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTsgcm93LmNsYXNzTmFtZSA9IFwic1wiO1xuICAgICAgZm9yIChsZXQgayA9IDA7IGsgPCAzOyBrKyspIHsgY29uc3QgcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJiXCIpOyBpZiAoayA8IHN0KSBzLmNsYXNzTmFtZSA9IFwib25cIjsgcm93LmFwcGVuZENoaWxkKHMpOyB9XG4gICAgICBiLmFwcGVuZChudW0sIHJvdyk7XG4gICAgICBpZiAoaSA8PSBtYXgpIGIuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHsgdGhpcy5oLmdlc3R1cmUoKTsgdGhpcy5oLnBpY2soaSk7IH0pO1xuICAgICAgaWYgKGkgPT09IChjdXJyZW50ID49IDAgPyBjdXJyZW50IDogbWF4KSkgZm9jdXMgPSBiO1xuICAgICAgZ3JpZC5hcHBlbmRDaGlsZChiKTtcbiAgICB9XG4gICAgJChcIm1hcFN0YXJzXCIpLnRleHRDb250ZW50ID0gYCR7dG90YWx9LyR7Y291bnQgKiAzfWA7XG4gICAgdGhpcy5zaG93KFwic2NyTWFwXCIpO1xuICAgIGlmIChmb2N1cykgZ3JpZC5zY3JvbGxUb3AgPSBNYXRoLm1heCgwLCBmb2N1cy5vZmZzZXRUb3AgLSBncmlkLm9mZnNldFRvcCAtIGdyaWQuY2xpZW50SGVpZ2h0IC8gMiArIGZvY3VzLm9mZnNldEhlaWdodCAvIDIpO1xuICB9XG5cbiAgc2V0dGluZ3Moc2V0KSB7XG4gICAgJChcIm9wdE11c2ljXCIpLmNoZWNrZWQgPSAhIXNldC5tdXNpYzsgJChcIm9wdFNmeFwiKS5jaGVja2VkID0gISFzZXQuc2Z4O1xuICAgIHRoaXMuX3NlZyhzZXQuY3RsKTtcbiAgICB0aGlzLnNob3coXCJzY3JTZXR0aW5nc1wiKTtcbiAgfVxuICBfc2VnKHYpIHsgJChcIm9wdEN0bFwiKS5xdWVyeVNlbGVjdG9yQWxsKFwiYnV0dG9uXCIpLmZvckVhY2goKGIpID0+IGIuY2xhc3NMaXN0LnRvZ2dsZShcIm9uXCIsIGIuZGF0YXNldC52ID09PSB2KSk7IH1cblxuICAvKiogSGVscCBvZmZlcmVkIGFmdGVyIHJlcGVhdGVkIGZhaWx1cmVzLiAqL1xuICBhc3Npc3QoeyBoaW50LCBza2lwLCBza2lwQWQgfSkge1xuICAgICQoXCJidG5IaW50XCIpLmNsYXNzTGlzdC50b2dnbGUoXCJoaWRkZW5cIiwgIWhpbnQpO1xuICAgICQoXCJidG5Ta2lwXCIpLmNsYXNzTGlzdC50b2dnbGUoXCJoaWRkZW5cIiwgIXNraXApO1xuICAgICQoXCJza2lwQWRcIikuY2xhc3NMaXN0LnRvZ2dsZShcImhpZGRlblwiLCAhc2tpcEFkKTtcbiAgfVxuXG4gIHNob3AoeyBvd25lZCwgY3VycmVudCwgZ2VtcyB9KSB7XG4gICAgY29uc3QgZ3JpZCA9ICQoXCJzaG9wR3JpZFwiKTtcbiAgICBncmlkLnRleHRDb250ZW50ID0gXCJcIjtcbiAgICAkKFwic2hvcEdlbXNcIikudGV4dENvbnRlbnQgPSBnZW1zO1xuICAgIGZvciAoY29uc3QgcyBvZiBTS0lOUykge1xuICAgICAgY29uc3QgaGFzID0gb3duZWQuaW5jbHVkZXMocy5pZCksIG9uID0gcy5pZCA9PT0gY3VycmVudDtcbiAgICAgIGNvbnN0IGIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYnV0dG9uXCIpO1xuICAgICAgYi50eXBlID0gXCJidXR0b25cIjtcbiAgICAgIGIuY2xhc3NOYW1lID0gXCJza2luXCIgKyAoaGFzID8gXCIgb3duZWRcIiA6IFwiXCIpICsgKG9uID8gXCIgb25cIiA6IFwiXCIpICsgKCFoYXMgJiYgZ2VtcyA8IHMuY29zdCA/IFwiIHBvb3JcIiA6IFwiXCIpO1xuICAgICAgYi5zZXRBdHRyaWJ1dGUoXCJhcmlhLWxhYmVsXCIsIHMuaWQgKyAoaGFzID8gXCJcIiA6IFwiIFwiICsgcy5jb3N0KSk7XG4gICAgICBiLmRhdGFzZXQuc2tpbiA9IHMuaWQ7XG4gICAgICBjb25zdCBiYWxsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7IGJhbGwuY2xhc3NOYW1lID0gXCJiYWxsXCI7IGJhbGwuc3R5bGUuYmFja2dyb3VuZCA9IHNraW5Td2F0Y2gocy5pZCk7XG4gICAgICBjb25zdCB0YWcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTsgdGFnLmNsYXNzTmFtZSA9IFwicHJpY2VcIjtcbiAgICAgIHRhZy5pbm5lckhUTUwgPSBoYXMgPyAob24gPyBDSEVDSyA6IFwiXCIpIDogR0VNICsgXCI8Yj5cIiArIHMuY29zdCArIFwiPC9iPlwiO1xuICAgICAgYi5hcHBlbmQoYmFsbCwgdGFnKTtcbiAgICAgIGIuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHsgdGhpcy5oLmdlc3R1cmUoKTsgdGhpcy5oLnBpY2tTa2luKHMuaWQpOyB9KTtcbiAgICAgIGdyaWQuYXBwZW5kQ2hpbGQoYik7XG4gICAgfVxuICAgIHRoaXMuc2hvdyhcInNjclNob3BcIik7XG4gIH1cblxuICAvKioga2luZDogXCJzd2lwZVwiIHwgXCJmbGlwXCIgfCBcIm5vdGVcIiAqL1xuICB0dXRvcmlhbChraW5kLCB0ZXh0KSB7XG4gICAgY29uc3QgZWwgPSAkKFwidHV0XCIpO1xuICAgIGVsLmNsYXNzTmFtZSA9IFwidHV0IFwiICsga2luZDtcbiAgICAkKFwidHV0VGV4dFwiKS50ZXh0Q29udGVudCA9IHRleHQ7XG4gIH1cbiAgdHV0b3JpYWxPZmYoKSB7ICQoXCJ0dXRcIikuY2xhc3NMaXN0LmFkZChcImhpZGRlblwiKTsgfVxuXG4gIHRvYXN0KHRleHQpIHtcbiAgICBjb25zdCBlbCA9ICQoXCJ0b2FzdFwiKTtcbiAgICBlbC50ZXh0Q29udGVudCA9IHRleHQ7IGVsLmNsYXNzTGlzdC5hZGQoXCJvblwiKTtcbiAgICBjbGVhclRpbWVvdXQodGhpcy50b2FzdFQpO1xuICAgIHRoaXMudG9hc3RUID0gc2V0VGltZW91dCgoKSA9PiBlbC5jbGFzc0xpc3QucmVtb3ZlKFwib25cIiksIDIyMDApO1xuICB9XG4gIHBhdXNlZChvbikgeyAkKFwicGF1c2VCYWRnZVwiKS5jbGFzc0xpc3QudG9nZ2xlKFwiaGlkZGVuXCIsICFvbik7IH1cbiAgZXJyb3IoKSB7IHRoaXMuaHVkKGZhbHNlKTsgdGhpcy5zaG93KFwic2NyRXJyb3JcIik7IH1cbn1cbiIsICIvLyBBbGwgc291bmQgaXMgc3ludGhlc2lzZWQgd2l0aCBXZWJBdWRpbyBcdTIwMTQgbm8gYXVkaW8gZmlsZXMsIG5vdGhpbmcgdG8gbGljZW5zZSwgdGlueSBidW5kbGUuXG4vLyBPdXRwdXQgb2JleXMgdGhyZWUgc3dpdGNoZXM6IHRoZSBob3N0IChwbGF0Zm9ybSBtdXRlIFx1MjAxNCBhbHdheXMgd2lucyksIG11c2ljLCBzZnguXG5cbmNvbnN0IE5PVEUgPSAobikgPT4gNDQwICogTWF0aC5wb3coMiwgKG4gLSA2OSkgLyAxMik7ICAgICAvLyBtaWRpIC0+IEh6XG4vLyBjaG9yZCBsb29wcyAobWlkaSByb290cyArIGludGVydmFscyksIG9uZSBwZXIgbW9vZFxuY29uc3QgTU9PRFMgPSB7XG4gIGJyaWdodDogeyBicG06IDEwNCwgY2hvcmRzOiBbWzYwLCA2NCwgNjddLCBbNTcsIDYwLCA2NF0sIFs1MywgNTcsIDYwXSwgWzU1LCA1OSwgNjJdXSwgbGVhZDogXCJ0cmlhbmdsZVwiIH0sICAgLy8gQyAgQW0gRiAgR1xuICB3YXJtOiAgIHsgYnBtOiA5NiwgIGNob3JkczogW1s2MiwgNjYsIDY5XSwgWzU5LCA2MiwgNjZdLCBbNTUsIDU5LCA2Ml0sIFs1NywgNjEsIDY0XV0sIGxlYWQ6IFwidHJpYW5nbGVcIiB9LCAgIC8vIEQgIEJtIEcgIEFcbiAgY29vbDogICB7IGJwbTogOTIsICBjaG9yZHM6IFtbNTcsIDYwLCA2NF0sIFs1MywgNTcsIDYwXSwgWzYwLCA2NCwgNjddLCBbNTUsIDU5LCA2Ml1dLCBsZWFkOiBcInNpbmVcIiB9LCAgICAgICAvLyBBbSBGICBDICBHXG4gIG5lb246ICAgeyBicG06IDExMCwgY2hvcmRzOiBbWzU3LCA2MCwgNjRdLCBbNTMsIDU3LCA2MF0sIFs1NSwgNTgsIDYyXSwgWzUyLCA1NSwgNTldXSwgbGVhZDogXCJzYXd0b290aFwiIH0gICAgLy8gQW0gRiAgR20gRW1cbn07XG5jb25zdCBUSEVNRV9NT09EID0geyBtZWFkb3c6IFwiYnJpZ2h0XCIsIHN1bnNldDogXCJ3YXJtXCIsIGljZTogXCJjb29sXCIsIGZhY3Rvcnk6IFwid2FybVwiLCBuZW9uOiBcIm5lb25cIiB9O1xuXG5leHBvcnQgY2xhc3MgR2FtZUF1ZGlvIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgdGhpcy5jdHggPSBudWxsOyB0aGlzLmhvc3QgPSB0cnVlOyB0aGlzLm11c2ljT24gPSB0cnVlOyB0aGlzLnNmeE9uID0gdHJ1ZTsgdGhpcy5wYXVzZWQgPSBmYWxzZTtcbiAgICB0aGlzLm1vb2QgPSBcImJyaWdodFwiOyB0aGlzLnRpbWVyID0gbnVsbDsgdGhpcy5zdGVwID0gMDsgdGhpcy5uZXh0VCA9IDA7IHRoaXMubGFzdEhpdCA9IDA7IHRoaXMud2FudE11c2ljID0gZmFsc2U7XG4gIH1cblxuICAvKiogQ3JlYXRlIC8gcmVzdW1lIHRoZSBjb250ZXh0LiBNdXN0IGJlIGNhbGxlZCBmcm9tIGEgdXNlciBnZXN0dXJlLiAqL1xuICB1bmxvY2soKSB7XG4gICAgaWYgKCF0aGlzLmN0eCkge1xuICAgICAgY29uc3QgQUMgPSB3aW5kb3cuQXVkaW9Db250ZXh0IHx8IHdpbmRvdy53ZWJraXRBdWRpb0NvbnRleHQ7XG4gICAgICBpZiAoIUFDKSByZXR1cm47XG4gICAgICB0cnkgeyB0aGlzLmN0eCA9IG5ldyBBQygpOyB9IGNhdGNoIChfKSB7IHJldHVybjsgfVxuICAgICAgY29uc3QgYyA9IHRoaXMuY3R4O1xuICAgICAgdGhpcy5tYXN0ZXIgPSBjLmNyZWF0ZUdhaW4oKTsgdGhpcy5tYXN0ZXIuY29ubmVjdChjLmRlc3RpbmF0aW9uKTtcbiAgICAgIHRoaXMuc2Z4ID0gYy5jcmVhdGVHYWluKCk7IHRoaXMuc2Z4LmNvbm5lY3QodGhpcy5tYXN0ZXIpO1xuICAgICAgdGhpcy5tdXNpYyA9IGMuY3JlYXRlR2FpbigpOyB0aGlzLm11c2ljLmNvbm5lY3QodGhpcy5tYXN0ZXIpO1xuICAgICAgLy8gc2hhcmVkIG5vaXNlIGJ1ZmZlclxuICAgICAgY29uc3QgbGVuID0gYy5zYW1wbGVSYXRlLCBidWYgPSBjLmNyZWF0ZUJ1ZmZlcigxLCBsZW4sIGMuc2FtcGxlUmF0ZSksIGQgPSBidWYuZ2V0Q2hhbm5lbERhdGEoMCk7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxlbjsgaSsrKSBkW2ldID0gTWF0aC5yYW5kb20oKSAqIDIgLSAxO1xuICAgICAgdGhpcy5ub2lzZUJ1ZiA9IGJ1ZjtcbiAgICAgIC8vIHJvbGxpbmcgcnVtYmxlOiBsb29waW5nIG5vaXNlIC0+IGxvd3Bhc3MgLT4gZ2FpblxuICAgICAgY29uc3Qgc3JjID0gYy5jcmVhdGVCdWZmZXJTb3VyY2UoKTsgc3JjLmJ1ZmZlciA9IGJ1Zjsgc3JjLmxvb3AgPSB0cnVlO1xuICAgICAgdGhpcy5yb2xsRiA9IGMuY3JlYXRlQmlxdWFkRmlsdGVyKCk7IHRoaXMucm9sbEYudHlwZSA9IFwibG93cGFzc1wiOyB0aGlzLnJvbGxGLmZyZXF1ZW5jeS52YWx1ZSA9IDIwMDtcbiAgICAgIHRoaXMucm9sbEcgPSBjLmNyZWF0ZUdhaW4oKTsgdGhpcy5yb2xsRy5nYWluLnZhbHVlID0gMDtcbiAgICAgIHNyYy5jb25uZWN0KHRoaXMucm9sbEYpOyB0aGlzLnJvbGxGLmNvbm5lY3QodGhpcy5yb2xsRyk7IHRoaXMucm9sbEcuY29ubmVjdCh0aGlzLnNmeCk7XG4gICAgICBzcmMuc3RhcnQoKTtcbiAgICB9XG4gICAgdGhpcy5fYXBwbHkoKTtcbiAgICBpZiAodGhpcy53YW50TXVzaWMpIHRoaXMuX3N0YXJ0TXVzaWMoKTtcbiAgfVxuXG4gIF9hcHBseSgpIHtcbiAgICBpZiAoIXRoaXMuY3R4KSByZXR1cm47XG4gICAgY29uc3Qgbm93ID0gdGhpcy5jdHguY3VycmVudFRpbWU7XG4gICAgdGhpcy5tYXN0ZXIuZ2Fpbi5zZXRUYXJnZXRBdFRpbWUodGhpcy5ob3N0ID8gMSA6IDAsIG5vdywgMC4wMik7XG4gICAgdGhpcy5zZnguZ2Fpbi5zZXRUYXJnZXRBdFRpbWUodGhpcy5zZnhPbiA/IDAuOSA6IDAsIG5vdywgMC4wMik7XG4gICAgdGhpcy5tdXNpYy5nYWluLnNldFRhcmdldEF0VGltZSh0aGlzLm11c2ljT24gPyAwLjUgOiAwLCBub3csIDAuMDUpO1xuICAgIGNvbnN0IHJ1biA9IHRoaXMuaG9zdCAmJiAhdGhpcy5wYXVzZWQ7XG4gICAgdHJ5IHsgaWYgKHJ1biAmJiB0aGlzLmN0eC5zdGF0ZSA9PT0gXCJzdXNwZW5kZWRcIikgdGhpcy5jdHgucmVzdW1lKCk7IGVsc2UgaWYgKCFydW4gJiYgdGhpcy5jdHguc3RhdGUgPT09IFwicnVubmluZ1wiKSB0aGlzLmN0eC5zdXNwZW5kKCk7IH0gY2F0Y2ggKF8pIHsgLyogbm9vcCAqLyB9XG4gIH1cbiAgc2V0SG9zdChvbikgeyB0aGlzLmhvc3QgPSAhIW9uOyB0aGlzLl9hcHBseSgpOyB9XG4gIHNldE11c2ljKG9uKSB7IHRoaXMubXVzaWNPbiA9ICEhb247IHRoaXMuX2FwcGx5KCk7IH1cbiAgc2V0U2Z4KG9uKSB7IHRoaXMuc2Z4T24gPSAhIW9uOyB0aGlzLl9hcHBseSgpOyB9XG4gIHBhdXNlKCkgeyB0aGlzLnBhdXNlZCA9IHRydWU7IHRoaXMuX3N0b3BUaW1lcigpOyB0aGlzLl9hcHBseSgpOyB9XG4gIHJlc3VtZSgpIHsgdGhpcy5wYXVzZWQgPSBmYWxzZTsgdGhpcy5fYXBwbHkoKTsgaWYgKHRoaXMud2FudE11c2ljKSB0aGlzLl9zdGFydE11c2ljKCk7IH1cblxuICAvLyAtLS0tLS0tLS0tIHByaW1pdGl2ZXMgLS0tLS0tLS0tLVxuICBfdG9uZShmcmVxLCBkdXIsIHR5cGUsIHZvbCwgZW5kRnJlcSwgZGVsYXksIGJ1cykge1xuICAgIGNvbnN0IGMgPSB0aGlzLmN0eDsgaWYgKCFjIHx8ICF0aGlzLmhvc3QpIHJldHVybjtcbiAgICBjb25zdCB0ID0gYy5jdXJyZW50VGltZSArIChkZWxheSB8fCAwKSwgbyA9IGMuY3JlYXRlT3NjaWxsYXRvcigpLCBnID0gYy5jcmVhdGVHYWluKCk7XG4gICAgby50eXBlID0gdHlwZSB8fCBcInNpbmVcIjsgby5mcmVxdWVuY3kuc2V0VmFsdWVBdFRpbWUoZnJlcSwgdCk7XG4gICAgaWYgKGVuZEZyZXEpIG8uZnJlcXVlbmN5LmV4cG9uZW50aWFsUmFtcFRvVmFsdWVBdFRpbWUoTWF0aC5tYXgoMzAsIGVuZEZyZXEpLCB0ICsgZHVyKTtcbiAgICBnLmdhaW4uc2V0VmFsdWVBdFRpbWUoMC4wMDAxLCB0KTsgZy5nYWluLmV4cG9uZW50aWFsUmFtcFRvVmFsdWVBdFRpbWUodm9sLCB0ICsgMC4wMDYpOyBnLmdhaW4uZXhwb25lbnRpYWxSYW1wVG9WYWx1ZUF0VGltZSgwLjAwMDYsIHQgKyBkdXIpO1xuICAgIG8uY29ubmVjdChnKTsgZy5jb25uZWN0KGJ1cyB8fCB0aGlzLnNmeCk7IG8uc3RhcnQodCk7IG8uc3RvcCh0ICsgZHVyICsgMC4wMik7XG4gIH1cbiAgX25vaXNlKGR1ciwgdm9sLCBmcmVxLCB0eXBlLCBkZWxheSkge1xuICAgIGNvbnN0IGMgPSB0aGlzLmN0eDsgaWYgKCFjIHx8ICF0aGlzLmhvc3QpIHJldHVybjtcbiAgICBjb25zdCB0ID0gYy5jdXJyZW50VGltZSArIChkZWxheSB8fCAwKSwgcyA9IGMuY3JlYXRlQnVmZmVyU291cmNlKCksIGYgPSBjLmNyZWF0ZUJpcXVhZEZpbHRlcigpLCBnID0gYy5jcmVhdGVHYWluKCk7XG4gICAgcy5idWZmZXIgPSB0aGlzLm5vaXNlQnVmOyBmLnR5cGUgPSB0eXBlIHx8IFwibG93cGFzc1wiOyBmLmZyZXF1ZW5jeS52YWx1ZSA9IGZyZXE7XG4gICAgZy5nYWluLnNldFZhbHVlQXRUaW1lKHZvbCwgdCk7IGcuZ2Fpbi5leHBvbmVudGlhbFJhbXBUb1ZhbHVlQXRUaW1lKDAuMDAwNiwgdCArIGR1cik7XG4gICAgcy5jb25uZWN0KGYpOyBmLmNvbm5lY3QoZyk7IGcuY29ubmVjdCh0aGlzLnNmeCk7IHMuc3RhcnQodCwgTWF0aC5yYW5kb20oKSAqIDAuNSwgZHVyICsgMC4wMik7XG4gIH1cblxuICAvLyAtLS0tLS0tLS0tIHNvdW5kIGVmZmVjdHMgLS0tLS0tLS0tLVxuICBoaXQodikge1xuICAgIGlmICghdGhpcy5jdHgpIHJldHVybjtcbiAgICBjb25zdCBub3cgPSB0aGlzLmN0eC5jdXJyZW50VGltZTtcbiAgICBpZiAobm93IC0gdGhpcy5sYXN0SGl0IDwgMC4wNDUpIHJldHVybjtcbiAgICB0aGlzLmxhc3RIaXQgPSBub3c7XG4gICAgY29uc3QgayA9IE1hdGgubWluKDEsIHYgLyA3MDApO1xuICAgIHRoaXMuX3RvbmUoMTIwICsgayAqIDYwLCAwLjA5LCBcInNpbmVcIiwgMC4wNSArIGsgKiAwLjIyLCA1NSk7XG4gICAgdGhpcy5fbm9pc2UoMC4wNSwgMC4wMyArIGsgKiAwLjEsIDcwMCArIGsgKiAxNTAwKTtcbiAgfVxuICBnZW0obikgeyBjb25zdCBmID0gWzc4NCwgOTg4LCAxMTc1LCAxNTY4XVtNYXRoLm1pbigzLCBuKV07IHRoaXMuX3RvbmUoZiwgMC4yMiwgXCJzaW5lXCIsIDAuMiwgZiAqIDEuMDEpOyB0aGlzLl90b25lKGYgKiAyLCAwLjE2LCBcInRyaWFuZ2xlXCIsIDAuMDgsIGYgKiAyLjAyLCAwLjAzKTsgfVxuICBzdGFyKGkpIHsgY29uc3QgZiA9IFs2NTksIDc4NCwgMTA0N11bTWF0aC5taW4oMiwgaSldOyB0aGlzLl90b25lKGYsIDAuMywgXCJ0cmlhbmdsZVwiLCAwLjIsIGYpOyB0aGlzLl90b25lKGYgKiAyLCAwLjIsIFwic2luZVwiLCAwLjA3LCBmICogMiwgMC4wMik7IH1cbiAgd2luKCkgeyBbNTIzLCA2NTksIDc4NCwgMTA0N10uZm9yRWFjaCgoZiwgaSkgPT4gdGhpcy5fdG9uZShmLCAwLjI2LCBcInRyaWFuZ2xlXCIsIDAuMTcsIGYgKiAxLjAxLCBpICogMC4wNzUpKTsgdGhpcy5fbm9pc2UoMC41LCAwLjA1LCA1MDAwLCBcImhpZ2hwYXNzXCIsIDAuMSk7IH1cbiAgZGllKCkgeyB0aGlzLl90b25lKDI2MCwgMC4zMiwgXCJzYXd0b290aFwiLCAwLjE2LCA1MCk7IHRoaXMuX25vaXNlKDAuMjIsIDAuMiwgMTQwMCk7IH1cbiAgYnVtcCgpIHsgdGhpcy5fdG9uZSgzMzAsIDAuMTIsIFwidHJpYW5nbGVcIiwgMC4yLCA2NjApOyB9XG4gIGtleShhbGwpIHsgdGhpcy5fdG9uZSg4ODAsIDAuMTIsIFwidHJpYW5nbGVcIiwgMC4xNiwgMTMyMCk7IHRoaXMuX3RvbmUoYWxsID8gMTc2MCA6IDEzMjAsIDAuMjIsIFwic2luZVwiLCAwLjEyLCBhbGwgPyAyNjQwIDogMTMyMCwgMC4wOSk7IH1cbiAgcG9ydCgpIHsgdGhpcy5fdG9uZSg1MjAsIDAuMjIsIFwic2luZVwiLCAwLjE0LCAxNDAwKTsgdGhpcy5fdG9uZSgxNDAwLCAwLjE2LCBcInRyaWFuZ2xlXCIsIDAuMDcsIDUyMCwgMC4wNSk7IH1cbiAgcGFkKCkgeyB0aGlzLl90b25lKDIyMCwgMC4yLCBcInRyaWFuZ2xlXCIsIDAuMTgsIDc2MCk7IH1cbiAgc2hhdHRlcigpIHsgdGhpcy5fbm9pc2UoMC4zLCAwLjI1LCAzMjAwLCBcImhpZ2hwYXNzXCIpOyB0aGlzLl90b25lKDE1MDAsIDAuMTgsIFwic2luZVwiLCAwLjEsIDYwMCk7IHRoaXMuX3RvbmUoMjEwMCwgMC4xNCwgXCJzaW5lXCIsIDAuMDcsIDkwMCwgMC4wMyk7IH1cbiAgY2xpY2soKSB7IHRoaXMuX3RvbmUoNzAwLCAwLjA0LCBcInRyaWFuZ2xlXCIsIDAuMSwgNTAwKTsgfVxuICB3aG9vc2goKSB7IHRoaXMuX25vaXNlKDAuMjUsIDAuMDgsIDkwMCwgXCJiYW5kcGFzc1wiKTsgfVxuXG4gIC8qKiBSb2xsaW5nIHJ1bWJsZSBcdTIwMTQgY2FsbCBldmVyeSBmcmFtZS4gKi9cbiAgcm9sbChzcGVlZCwgdG91Y2hpbmcpIHtcbiAgICBpZiAoIXRoaXMuY3R4KSByZXR1cm47XG4gICAgY29uc3Qgbm93ID0gdGhpcy5jdHguY3VycmVudFRpbWUsIHYgPSB0b3VjaGluZyA/IE1hdGgubWluKDEsIHNwZWVkIC8gNTIwKSA6IDA7XG4gICAgdGhpcy5yb2xsRy5nYWluLnNldFRhcmdldEF0VGltZSh2ICogMC4xMSwgbm93LCAwLjA0KTtcbiAgICB0aGlzLnJvbGxGLmZyZXF1ZW5jeS5zZXRUYXJnZXRBdFRpbWUoMTUwICsgdiAqIDYyMCwgbm93LCAwLjA1KTtcbiAgfVxuXG4gIC8vIC0tLS0tLS0tLS0gbXVzaWM6IGEgc21hbGwgZ2VuZXJhdGl2ZSBsb29wIC0tLS0tLS0tLS1cbiAgcGxheU11c2ljKHRoZW1lKSB7XG4gICAgdGhpcy5tb29kID0gVEhFTUVfTU9PRFt0aGVtZV0gfHwgXCJicmlnaHRcIjtcbiAgICB0aGlzLndhbnRNdXNpYyA9IHRydWU7XG4gICAgaWYgKHRoaXMuY3R4KSB0aGlzLl9zdGFydE11c2ljKCk7XG4gIH1cbiAgc3RvcE11c2ljKCkgeyB0aGlzLndhbnRNdXNpYyA9IGZhbHNlOyB0aGlzLl9zdG9wVGltZXIoKTsgfVxuICBfc3RvcFRpbWVyKCkgeyBpZiAodGhpcy50aW1lcikgeyBjbGVhckludGVydmFsKHRoaXMudGltZXIpOyB0aGlzLnRpbWVyID0gbnVsbDsgfSB9XG4gIF9zdGFydE11c2ljKCkge1xuICAgIGlmICh0aGlzLnRpbWVyIHx8ICF0aGlzLmN0eCB8fCB0aGlzLnBhdXNlZCkgcmV0dXJuO1xuICAgIHRoaXMubmV4dFQgPSB0aGlzLmN0eC5jdXJyZW50VGltZSArIDAuMDg7XG4gICAgdGhpcy50aW1lciA9IHNldEludGVydmFsKCgpID0+IHRoaXMuX3NjaGVkdWxlKCksIDExMCk7XG4gIH1cbiAgX3NjaGVkdWxlKCkge1xuICAgIGNvbnN0IGMgPSB0aGlzLmN0eDsgaWYgKCFjIHx8IGMuc3RhdGUgIT09IFwicnVubmluZ1wiKSByZXR1cm47XG4gICAgY29uc3QgbSA9IE1PT0RTW3RoaXMubW9vZF0sIHNwYiA9IDYwIC8gbS5icG0gLyAyOyAgICAgICAgLy8gZWlnaHRoIG5vdGVzXG4gICAgd2hpbGUgKHRoaXMubmV4dFQgPCBjLmN1cnJlbnRUaW1lICsgMC4zKSB7XG4gICAgICBjb25zdCBzID0gdGhpcy5zdGVwLCBjaCA9IG0uY2hvcmRzWyhzID4+IDMpICUgbS5jaG9yZHMubGVuZ3RoXSwgdCA9IHRoaXMubmV4dFQgLSBjLmN1cnJlbnRUaW1lO1xuICAgICAgY29uc3QgYmVhdCA9IHMgJiA3O1xuICAgICAgaWYgKGJlYXQgPT09IDAgfHwgYmVhdCA9PT0gNCkgdGhpcy5fdG9uZShOT1RFKGNoWzBdIC0gMjQpLCBzcGIgKiAzLjIsIFwic2luZVwiLCAwLjIsIG51bGwsIHQsIHRoaXMubXVzaWMpO1xuICAgICAgaWYgKGJlYXQgPT09IDApIHsgdGhpcy5fdG9uZShOT1RFKGNoWzBdIC0gMTIpLCBzcGIgKiA3LjUsIFwic2luZVwiLCAwLjA0NSwgbnVsbCwgdCwgdGhpcy5tdXNpYyk7IHRoaXMuX3RvbmUoTk9URShjaFsyXSAtIDEyKSwgc3BiICogNy41LCBcInNpbmVcIiwgMC4wMzUsIG51bGwsIHQsIHRoaXMubXVzaWMpOyB9XG4gICAgICAvLyBhcnBlZ2dpbyB3aXRoIGEgbGl0dGxlIHZhcmlhdGlvbiBldmVyeSBvdGhlciBiYXJcbiAgICAgIGNvbnN0IHBhdCA9ICgocyA+PiAzKSAmIDEpID8gWzAsIDIsIDEsIDIsIDAsIDEsIDIsIDFdIDogWzAsIDEsIDIsIDEsIDAsIDIsIDEsIDJdO1xuICAgICAgaWYgKGJlYXQgIT09IDMgJiYgYmVhdCAhPT0gNykgdGhpcy5fdG9uZShOT1RFKGNoW3BhdFtiZWF0XV0gKyAxMiksIHNwYiAqIDAuOSwgbS5sZWFkLCBtLmxlYWQgPT09IFwic2F3dG9vdGhcIiA/IDAuMDM1IDogMC4wNzUsIG51bGwsIHQsIHRoaXMubXVzaWMpO1xuICAgICAgdGhpcy5zdGVwKys7IHRoaXMubmV4dFQgKz0gc3BiO1xuICAgIH1cbiAgfVxufVxuIiwgIi8vIExldmVsIGF1dGhvcmluZyArIGNvbXBpbGF0aW9uLlxuLy9cbi8vIEEgbGV2ZWwgaXMgYXV0aG9yZWQgb24gYSBzcXVhcmUgY2hhcmFjdGVyIGdyaWQgKGRlZmF1bHQgMjh4MjggY2VsbHMgb3ZlciB0aGVcbi8vIDQyMC11bml0IGFyZW5hLCBzbyBvbmUgY2VsbCA9IDE1IHVuaXRzKSB3aXRoIGEgc21hbGwgYnVpbGRlciBBUEksIHBsdXMgcG9pbnRzXG4vLyAoc3RhcnQgLyBnb2FsIC8gZ2VtcykgYW5kIHBhcmFtZXRyaWMgb2JqZWN0cyAobW92ZXJzLCBzYXdzKS5cbi8vIGNvbXBpbGUoKSB0dXJucyB0aGF0IGludG8gdGhlIGZsYXQgcHJpbWl0aXZlIGxpc3RzIHRoZSBzaW11bGF0aW9uIHJ1bnMgb24uXG4vL1xuLy8gR3JpZCBjaGFyYWN0ZXJzOlxuLy8gICAnIycgd2FsbCAgICc9JyBpY2Ugd2FsbCAgICdeJyBzcGlrZXMgICAnWCcgY3J5c3RhbCAgICdvJyBwZWcgICAnTycgYnVtcGVyXG4vLyAgICcvJyAnXFwnIGRpYWdvbmFsIHdhbGwgICAgICc8JyAnPicgJ0EnICdWJyBsYXVuY2ggcGFkcyAobGVmdC9yaWdodC91cC9kb3duKVxuLy8gICAnRCcgZG9vciAoc29saWQgdW50aWwgZXZlcnkga2V5IGlzIGNvbGxlY3RlZClcbmltcG9ydCB7IEhBTEYsIEtfQk9YLCBLX0NJUkNMRSwgS19DQVBTVUxFIH0gZnJvbSBcIi4uL3NpbS9zaW0uanNcIjtcblxuZXhwb3J0IGNvbnN0IEdSSUQgPSAyODtcbmNvbnN0IE1JUlJPUl9DSCA9IHsgXCIvXCI6IFwiXFxcXFwiLCBcIlxcXFxcIjogXCIvXCIsIFwiPFwiOiBcIj5cIiwgXCI+XCI6IFwiPFwiIH07XG5cbmV4cG9ydCBjbGFzcyBCdWlsZGVyIHtcbiAgLyoqIEBwYXJhbSBtaXJyb3IgYnVpbGQgdGhlIGxlZnQtcmlnaHQgbWlycm9yIGltYWdlIG9mIHdoYXRldmVyIGlzIGRyYXduIChkYWlseSBjaGFsbGVuZ2UpICovXG4gIGNvbnN0cnVjdG9yKG4gPSBHUklELCBtaXJyb3IgPSBmYWxzZSkge1xuICAgIHRoaXMubiA9IG47IHRoaXMubWlycm9yID0gbWlycm9yO1xuICAgIHRoaXMuY2VsbCA9ICgyICogSEFMRikgLyBuO1xuICAgIHRoaXMuZyA9IEFycmF5LmZyb20oeyBsZW5ndGg6IG4gfSwgKCkgPT4gbmV3IEFycmF5KG4pLmZpbGwoXCIgXCIpKTtcbiAgICB0aGlzLnB0ID0geyBzdGFydDogbnVsbCwgZ29hbDogbnVsbCwgZ2VtczogW10sIGtleXM6IFtdIH07XG4gICAgdGhpcy5vYmpzID0gW107XG4gIH1cbiAgLyoqIGdyaWQgY29sdW1uL3JvdyAobWF5IGJlIGZyYWN0aW9uYWwpIC0+IGFyZW5hIHVuaXRzOyAoMCwwKSBpcyB0aGUgY2VudHJlIG9mIHRoZSB0b3AtbGVmdCBjZWxsICovXG4gIFgoYykgeyBjb25zdCB4ID0gLUhBTEYgKyAoYyArIDAuNSkgKiB0aGlzLmNlbGw7IHJldHVybiB0aGlzLm1pcnJvciA/IC14IDogeDsgfVxuICBZKHIpIHsgcmV0dXJuIEhBTEYgLSAociArIDAuNSkgKiB0aGlzLmNlbGw7IH1cblxuICBwdXQoY2gsIGMsIHIpIHsgaWYgKHRoaXMubWlycm9yKSB7IGMgPSB0aGlzLm4gLSAxIC0gYzsgY2ggPSBNSVJST1JfQ0hbY2hdIHx8IGNoOyB9IGlmIChjID49IDAgJiYgciA+PSAwICYmIGMgPCB0aGlzLm4gJiYgciA8IHRoaXMubikgdGhpcy5nW3JdW2NdID0gY2g7IHJldHVybiB0aGlzOyB9XG4gIGgociwgYzAsIGMxLCBjaCA9IFwiI1wiKSB7IGZvciAobGV0IGMgPSBNYXRoLm1pbihjMCwgYzEpOyBjIDw9IE1hdGgubWF4KGMwLCBjMSk7IGMrKykgdGhpcy5wdXQoY2gsIGMsIHIpOyByZXR1cm4gdGhpczsgfVxuICB2KGMsIHIwLCByMSwgY2ggPSBcIiNcIikgeyBmb3IgKGxldCByID0gTWF0aC5taW4ocjAsIHIxKTsgciA8PSBNYXRoLm1heChyMCwgcjEpOyByKyspIHRoaXMucHV0KGNoLCBjLCByKTsgcmV0dXJuIHRoaXM7IH1cbiAgYm94KGMwLCByMCwgYzEsIHIxLCBjaCA9IFwiI1wiKSB7IGZvciAobGV0IHIgPSBNYXRoLm1pbihyMCwgcjEpOyByIDw9IE1hdGgubWF4KHIwLCByMSk7IHIrKykgdGhpcy5oKHIsIGMwLCBjMSwgY2gpOyByZXR1cm4gdGhpczsgfVxuICBjbGVhcihjMCwgcjAsIGMxLCByMSkgeyByZXR1cm4gdGhpcy5ib3goYzAsIHIwLCBjMSwgcjEsIFwiIFwiKTsgfVxuICBmcmFtZShjaCA9IFwiI1wiKSB7IGNvbnN0IG0gPSB0aGlzLm4gLSAxOyByZXR1cm4gdGhpcy5oKDAsIDAsIG0sIGNoKS5oKG0sIDAsIG0sIGNoKS52KDAsIDAsIG0sIGNoKS52KG0sIDAsIG0sIGNoKTsgfVxuICAvKiogZGlhZ29uYWwgd2FsbCBmcm9tIGNlbGwgKGMwLHIwKSB0byAoYzEscjEpOyB8ZGN8IG11c3QgZXF1YWwgfGRyfCAqL1xuICBkaWFnKGMwLCByMCwgYzEsIHIxKSB7XG4gICAgY29uc3QgbiA9IE1hdGguYWJzKGMxIC0gYzApLCBzYyA9IE1hdGguc2lnbihjMSAtIGMwKSB8fCAxLCBzciA9IE1hdGguc2lnbihyMSAtIHIwKSB8fCAxO1xuICAgIGNvbnN0IGNoID0gc2MgKiBzciA8IDAgPyBcIi9cIiA6IFwiXFxcXFwiO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDw9IG47IGkrKykgdGhpcy5wdXQoY2gsIGMwICsgaSAqIHNjLCByMCArIGkgKiBzcik7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbiAgc3Bpa2VzKGMwLCByMCwgYzEsIHIxKSB7IHJldHVybiB0aGlzLmJveChjMCwgcjAsIGMxLCByMSwgXCJeXCIpOyB9XG4gIHN0YXJ0KGMsIHIpIHsgdGhpcy5wdC5zdGFydCA9IHsgeDogdGhpcy5YKGMpLCB5OiB0aGlzLlkocikgfTsgcmV0dXJuIHRoaXM7IH1cbiAgZ29hbChjLCByKSB7IHRoaXMucHQuZ29hbCA9IHsgeDogdGhpcy5YKGMpLCB5OiB0aGlzLlkocikgfTsgcmV0dXJuIHRoaXM7IH1cbiAgZ2VtKGMsIHIpIHsgdGhpcy5wdC5nZW1zLnB1c2goeyB4OiB0aGlzLlgoYyksIHk6IHRoaXMuWShyKSB9KTsgcmV0dXJuIHRoaXM7IH1cbiAgLyoqIG1vdmluZyBwbGF0Zm9ybTogY2VudHJlIGNlbGwgKGMsciksIHNpemUgdyB4IGggY2VsbHMsIHRyYXZlbCBcdTAwQjFhYyAvIFx1MDBCMWFyIGNlbGxzICovXG4gIG1vdmVyKGMsIHIsIHcsIGgsIGFjLCBhciwgc3BkID0gMS42LCBwaCA9IDApIHtcbiAgICB0aGlzLm9ianMucHVzaCh7IHQ6IFwibW92ZXJcIiwgY3g6IHRoaXMuWChjKSwgY3k6IHRoaXMuWShyKSwgaHc6ICh3ICogdGhpcy5jZWxsKSAvIDIsIGhoOiAoaCAqIHRoaXMuY2VsbCkgLyAyLCBheDogKHRoaXMubWlycm9yID8gLWFjIDogYWMpICogdGhpcy5jZWxsLCBheTogYXIgKiB0aGlzLmNlbGwsIHNwZCwgcGggfSk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbiAgc2F3KGMsIHIsIHJhZCwgYWMsIGFyLCBzcGQgPSAxLjgsIHBoID0gMCkge1xuICAgIHRoaXMub2Jqcy5wdXNoKHsgdDogXCJzYXdcIiwgY3g6IHRoaXMuWChjKSwgY3k6IHRoaXMuWShyKSwgcjogcmFkLCBheDogKHRoaXMubWlycm9yID8gLWFjIDogYWMpICogdGhpcy5jZWxsLCBheTogYXIgKiB0aGlzLmNlbGwsIHNwZCwgcGggfSk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbiAga2V5KGMsIHIpIHsgdGhpcy5wdC5rZXlzLnB1c2goeyB4OiB0aGlzLlgoYyksIHk6IHRoaXMuWShyKSB9KTsgcmV0dXJuIHRoaXM7IH1cbiAgZG9vcihjMCwgcjAsIGMxLCByMSkgeyByZXR1cm4gdGhpcy5ib3goYzAsIHIwLCBjMSwgcjEsIFwiRFwiKTsgfVxuICBfcmVjdChjMCwgcjAsIGMxLCByMSkge1xuICAgIGxldCBhID0gTWF0aC5taW4oYzAsIGMxKSwgYiA9IE1hdGgubWF4KGMwLCBjMSk7XG4gICAgY29uc3QgdCA9IE1hdGgubWluKHIwLCByMSksIHUgPSBNYXRoLm1heChyMCwgcjEpO1xuICAgIGlmICh0aGlzLm1pcnJvcikgeyBjb25zdCBtID0gdGhpcy5uIC0gMTsgW2EsIGJdID0gW20gLSBiLCBtIC0gYV07IH1cbiAgICByZXR1cm4geyBjeDogLUhBTEYgKyAoKGEgKyBiICsgMSkgLyAyKSAqIHRoaXMuY2VsbCwgY3k6IEhBTEYgLSAoKHQgKyB1ICsgMSkgLyAyKSAqIHRoaXMuY2VsbCwgaHc6ICgoYiAtIGEgKyAxKSAqIHRoaXMuY2VsbCkgLyAyLCBoaDogKCh1IC0gdCArIDEpICogdGhpcy5jZWxsKSAvIDIgfTtcbiAgfVxuICAvKiogb25lLXdheSBnYXRlIGZpbGxpbmcgY2VsbHMgKGMwLHIwKS0oYzEscjEpIChhIDEtY2VsbC10aGljayBsaW5lKTsgdGhlIGJhbGwgbWF5IG9ubHkgcGFzcyB0b3dhcmRzIGRpcjogXCJMXCIgXCJSXCIgXCJVXCIgXCJEXCIgKi9cbiAgZ2F0ZShjMCwgcjAsIGMxLCByMSwgZGlyKSB7IHRoaXMub2Jqcy5wdXNoKHsgdDogXCJnYXRlXCIsIC4uLnRoaXMuX3JlY3QoYzAsIHIwLCBjMSwgcjEpLCBkaXI6IHRoaXMuX2RpcihkaXIpIH0pOyByZXR1cm4gdGhpczsgfVxuICBfZGlyKGQpIHsgcmV0dXJuIHRoaXMubWlycm9yID8gKGQgPT09IFwiTFwiID8gXCJSXCIgOiBkID09PSBcIlJcIiA/IFwiTFwiIDogZCkgOiBkOyB9XG4gIC8qKiBsYXNlciBiZWFtIGZpbGxpbmcgY2VsbHMgKGMwLHIwKS0oYzEscjEpOyBsaXQgZm9yIGBkdXR5YCBzZWNvbmRzIG91dCBvZiBldmVyeSBgcGVyaW9kYCAocGVyaW9kIDAgPSBhbHdheXMgb24pICovXG4gIGxhc2VyKGMwLCByMCwgYzEsIHIxLCBwZXJpb2QgPSAyLjQsIGR1dHkgPSAxLjIsIHBoID0gMCkgeyB0aGlzLm9ianMucHVzaCh7IHQ6IFwibGFzZXJcIiwgLi4udGhpcy5fcmVjdChjMCwgcjAsIGMxLCByMSksIHBlcmlvZCwgZHV0eSwgcGggfSk7IHJldHVybiB0aGlzOyB9XG4gIC8qKiBmYW46IGFpciBzdHJlYW0gb3ZlciBjZWxscyAoYzAscjApLShjMSxyMSkgcHVzaGluZyB0b3dhcmRzIGRpciAoXCJMXCIgXCJSXCIgXCJVXCIgXCJEXCIpOyBwb3dlciBpbiB1bml0cy9zXjIgKGdyYXZpdHkgaXMgNzIwKSAqL1xuICBmYW4oYzAsIHIwLCBjMSwgcjEsIGRpciwgcG93ZXIgPSAxMTAwKSB7IHRoaXMub2Jqcy5wdXNoKHsgdDogXCJmYW5cIiwgLi4udGhpcy5fcmVjdChjMCwgcjAsIGMxLCByMSksIGRpcjogdGhpcy5fZGlyKGRpciksIHBvd2VyIH0pOyByZXR1cm4gdGhpczsgfVxuICAvKiogbGlua2VkIHBhaXIgb2YgcG9ydGFscyBhdCBjZWxscyAoYyxyKSBhbmQgKGMyLHIyKSAqL1xuICBwb3J0KGMsIHIsIGMyLCByMikgeyB0aGlzLm9ianMucHVzaCh7IHQ6IFwicG9ydFwiLCB4OiB0aGlzLlgoYyksIHk6IHRoaXMuWShyKSwgeDI6IHRoaXMuWChjMiksIHkyOiB0aGlzLlkocjIpIH0pOyByZXR1cm4gdGhpczsgfVxuICByb3dzKCkgeyByZXR1cm4gdGhpcy5nLm1hcCgocm93KSA9PiByb3cuam9pbihcIlwiKSk7IH1cbn1cblxuZnVuY3Rpb24gbWVyZ2VSdW5zKG1hc2ssIG4pIHtcbiAgY29uc3QgcmVjdHMgPSBbXTtcbiAgbGV0IG9wZW4gPSBuZXcgTWFwKCk7XG4gIGZvciAobGV0IHIgPSAwOyByIDwgbjsgcisrKSB7XG4gICAgY29uc3QgbmV4dCA9IG5ldyBNYXAoKTtcbiAgICBsZXQgYyA9IDA7XG4gICAgd2hpbGUgKGMgPCBuKSB7XG4gICAgICBpZiAoIW1hc2tbciAqIG4gKyBjXSkgeyBjKys7IGNvbnRpbnVlOyB9XG4gICAgICBsZXQgYzEgPSBjO1xuICAgICAgd2hpbGUgKGMxICsgMSA8IG4gJiYgbWFza1tyICogbiArIGMxICsgMV0pIGMxKys7XG4gICAgICBjb25zdCBrZXkgPSBjICsgXCI6XCIgKyBjMSwgcHJldiA9IG9wZW4uZ2V0KGtleSk7XG4gICAgICBpZiAocHJldikgeyBwcmV2LnIxID0gcjsgbmV4dC5zZXQoa2V5LCBwcmV2KTsgfVxuICAgICAgZWxzZSB7IGNvbnN0IHJjID0geyBjMDogYywgYzEsIHIwOiByLCByMTogciB9OyByZWN0cy5wdXNoKHJjKTsgbmV4dC5zZXQoa2V5LCByYyk7IH1cbiAgICAgIGMgPSBjMSArIDE7XG4gICAgfVxuICAgIG9wZW4gPSBuZXh0O1xuICB9XG4gIHJldHVybiByZWN0cztcbn1cblxuY29uc3QgUEFEX0RJUiA9IHsgXCI8XCI6IFstMSwgMF0sIFwiPlwiOiBbMSwgMF0sIEE6IFswLCAxXSwgVjogWzAsIC0xXSB9O1xuXG4vKipcbiAqIENvbXBpbGUgYW4gYXV0aG9yZWQgbGV2ZWwgZGVmaW5pdGlvbiBpbnRvIHNpbXVsYXRpb24gcHJpbWl0aXZlcy5cbiAqIGRlZjogeyBpZCwgYnVpbGQoYikgfCBtYXA6IHN0cmluZ1tdLCB0aGVtZT8sIHR1dD8sIGZvcm1zPywgcGFyPyAuLi4gfVxuICovXG5leHBvcnQgZnVuY3Rpb24gY29tcGlsZShkZWYsIG9wdHMgPSB7fSkge1xuICBsZXQgYjtcbiAgaWYgKGRlZi5idWlsZCkgeyBiID0gbmV3IEJ1aWxkZXIoZGVmLmdyaWQgfHwgR1JJRCwgISFvcHRzLm1pcnJvcik7IGRlZi5idWlsZChiKTsgfVxuICBlbHNlIHtcbiAgICBiID0gbmV3IEJ1aWxkZXIoZGVmLm1hcC5sZW5ndGgpO1xuICAgIGRlZi5tYXAuZm9yRWFjaCgocm93LCByKSA9PiB7IGZvciAobGV0IGMgPSAwOyBjIDwgYi5uOyBjKyspIGIuZ1tyXVtjXSA9IHJvd1tjXSB8fCBcIiBcIjsgfSk7XG4gICAgaWYgKGRlZi5zdGFydCkgYi5zdGFydChkZWYuc3RhcnRbMF0sIGRlZi5zdGFydFsxXSk7XG4gICAgaWYgKGRlZi5nb2FsKSBiLmdvYWwoZGVmLmdvYWxbMF0sIGRlZi5nb2FsWzFdKTtcbiAgICAoZGVmLmdlbXMgfHwgW10pLmZvckVhY2goKGcpID0+IGIuZ2VtKGdbMF0sIGdbMV0pKTtcbiAgICAoZGVmLm9ianMgfHwgW10pLmZvckVhY2goKG8pID0+IGIub2Jqcy5wdXNoKG8pKTtcbiAgfVxuICBjb25zdCBuID0gYi5uLCBjZWxsID0gYi5jZWxsLCBnID0gYi5nO1xuICBjb25zdCBhdCA9IChjLCByKSA9PiAoYyA8IDAgfHwgciA8IDAgfHwgYyA+PSBuIHx8IHIgPj0gbiA/IFwiIFwiIDogZ1tyXVtjXSk7XG4gIGNvbnN0IG1hc2tPZiA9IChjaGFycykgPT4geyBjb25zdCBtID0gbmV3IFVpbnQ4QXJyYXkobiAqIG4pOyBmb3IgKGxldCByID0gMDsgciA8IG47IHIrKykgZm9yIChsZXQgYyA9IDA7IGMgPCBuOyBjKyspIGlmIChjaGFycy5pbmNsdWRlcyhnW3JdW2NdKSkgbVtyICogbiArIGNdID0gMTsgcmV0dXJuIG07IH07XG4gIGNvbnN0IHRvQm94ID0gKHJjLCBzaHJpbmsgPSAwKSA9PiAoe1xuICAgIGs6IEtfQk9YLFxuICAgIGN4OiAtSEFMRiArICgocmMuYzAgKyByYy5jMSArIDEpIC8gMikgKiBjZWxsLCBjeTogSEFMRiAtICgocmMucjAgKyByYy5yMSArIDEpIC8gMikgKiBjZWxsLFxuICAgIGh3OiAoKHJjLmMxIC0gcmMuYzAgKyAxKSAqIGNlbGwpIC8gMiAtIHNocmluaywgaGg6ICgocmMucjEgLSByYy5yMCArIDEpICogY2VsbCkgLyAyIC0gc2hyaW5rLFxuICAgIGM6IDEsIHM6IDAsIGU6IDEsIG11OiAxLCBraWNrOiAwLCByY1xuICB9KTtcbiAgY29uc3Qgc29saWRBdCA9IChjLCByKSA9PiBcIiM9WERcIi5pbmNsdWRlcyhhdChjLCByKSk7XG5cbiAgY29uc3Qgc29saWRzID0gW10sIGtpbGxzID0gW10sIGNyeXN0YWxzID0gW10sIHBhZHMgPSBbXSwgbW92ZXJzID0gW10sIHNhd3MgPSBbXTtcbiAgY29uc3QgZG9vcnMgPSBbXSwgZ2F0ZXMgPSBbXSwgbGFzZXJzID0gW10sIGZhbnMgPSBbXSwgcG9ydHMgPSBbXTtcbiAgY29uc3QgRElSID0geyBMOiBbLTEsIDBdLCBSOiBbMSwgMF0sIFU6IFswLCAxXSwgRDogWzAsIC0xXSB9O1xuICBmb3IgKGNvbnN0IHJjIG9mIG1lcmdlUnVucyhtYXNrT2YoXCJEXCIpLCBuKSkgZG9vcnMucHVzaCh0b0JveChyYykpO1xuXG4gIGZvciAoY29uc3QgcmMgb2YgbWVyZ2VSdW5zKG1hc2tPZihcIiNcIiksIG4pKSB7XG4gICAgY29uc3QgcyA9IHRvQm94KHJjKTtcbiAgICBzLm91dGVyID0gcmMuYzAgPT09IDAgfHwgcmMucjAgPT09IDAgfHwgcmMuYzEgPT09IG4gLSAxIHx8IHJjLnIxID09PSBuIC0gMTtcbiAgICBzb2xpZHMucHVzaChzKTtcbiAgfVxuICBmb3IgKGNvbnN0IHJjIG9mIG1lcmdlUnVucyhtYXNrT2YoXCI9XCIpLCBuKSkgeyBjb25zdCBzID0gdG9Cb3gocmMpOyBzLm11ID0gMDsgcy5pY2UgPSB0cnVlOyBzb2xpZHMucHVzaChzKTsgfVxuICBmb3IgKGNvbnN0IHJjIG9mIG1lcmdlUnVucyhtYXNrT2YoXCJYXCIpLCBuKSkgY3J5c3RhbHMucHVzaCh0b0JveChyYykpO1xuXG4gIC8vIHNwaWtlczogcmVtZW1iZXIgd2hpY2ggd2F5IHRoZXkgcG9pbnQgKGF3YXkgZnJvbSB0aGUgd2FsbCB0aGV5IHNpdCBvbilcbiAgZm9yIChjb25zdCByYyBvZiBtZXJnZVJ1bnMobWFza09mKFwiXlwiKSwgbikpIHtcbiAgICBjb25zdCBrID0gdG9Cb3gocmMsIDEuNSk7XG4gICAgbGV0IHVwID0gMCwgZG93biA9IDAsIGxlZnQgPSAwLCByaWdodCA9IDA7XG4gICAgZm9yIChsZXQgYyA9IHJjLmMwOyBjIDw9IHJjLmMxOyBjKyspIHsgaWYgKHNvbGlkQXQoYywgcmMucjAgLSAxKSkgdXArKzsgaWYgKHNvbGlkQXQoYywgcmMucjEgKyAxKSkgZG93bisrOyB9XG4gICAgZm9yIChsZXQgciA9IHJjLnIwOyByIDw9IHJjLnIxOyByKyspIHsgaWYgKHNvbGlkQXQocmMuYzAgLSAxLCByKSkgbGVmdCsrOyBpZiAoc29saWRBdChyYy5jMSArIDEsIHIpKSByaWdodCsrOyB9XG4gICAgY29uc3QgYmVzdCA9IE1hdGgubWF4KHVwLCBkb3duLCBsZWZ0LCByaWdodCk7XG4gICAgLy8gZGlyOiB1bml0IHZlY3RvciB0aGUgc3Bpa2VzIHBvaW50IGFsb25nIChhcmVuYSBjb29yZHMpLCBvciAoMCwwKSBmb3IgZmxvb3Igc3Bpa2VzXG4gICAgay5keCA9IDA7IGsuZHkgPSAwO1xuICAgIGlmIChiZXN0ID4gMCkge1xuICAgICAgaWYgKGJlc3QgPT09IGRvd24pIGsuZHkgPSAxOyBlbHNlIGlmIChiZXN0ID09PSB1cCkgay5keSA9IC0xOyBlbHNlIGlmIChiZXN0ID09PSBsZWZ0KSBrLmR4ID0gMTsgZWxzZSBrLmR4ID0gLTE7XG4gICAgfVxuICAgIGtpbGxzLnB1c2goayk7XG4gIH1cblxuICBmb3IgKGNvbnN0IGNoIG9mIE9iamVjdC5rZXlzKFBBRF9ESVIpKSB7XG4gICAgZm9yIChjb25zdCByYyBvZiBtZXJnZVJ1bnMobWFza09mKGNoKSwgbikpIHtcbiAgICAgIGNvbnN0IHAgPSB0b0JveChyYyk7XG4gICAgICBwLmR4ID0gUEFEX0RJUltjaF1bMF07IHAuZHkgPSBQQURfRElSW2NoXVsxXTsgcC5wb3dlciA9IDUyMDtcbiAgICAgIHBhZHMucHVzaChwKTtcbiAgICB9XG4gIH1cblxuICAvLyBkaWFnb25hbHMgLT4gY2Fwc3VsZXMgYWxvbmcgdGhlIHJ1blxuICBjb25zdCBzZWVuID0gbmV3IFVpbnQ4QXJyYXkobiAqIG4pO1xuICBmb3IgKGxldCByID0gMDsgciA8IG47IHIrKykgZm9yIChsZXQgYyA9IDA7IGMgPCBuOyBjKyspIHtcbiAgICBjb25zdCBjaCA9IGdbcl1bY107XG4gICAgaWYgKChjaCAhPT0gXCIvXCIgJiYgY2ggIT09IFwiXFxcXFwiKSB8fCBzZWVuW3IgKiBuICsgY10pIGNvbnRpbnVlO1xuICAgIGNvbnN0IGRyID0gY2ggPT09IFwiL1wiID8gLTEgOiAxOyAgICAgLy8gbW92aW5nIHJpZ2h0LCAnLycgZ29lcyB1cCAocm93IGRlY3JlYXNlcylcbiAgICBsZXQgYzAgPSBjLCByMCA9IHI7ICAgICAgICAgICAgICAgICAvLyB3YWxrIGJhY2sgdG8gdGhlIGxlZnQgZW5kIG9mIHRoZSBydW5cbiAgICB3aGlsZSAoYXQoYzAgLSAxLCByMCAtIGRyKSA9PT0gY2gpIHsgYzAtLTsgcjAgLT0gZHI7IH1cbiAgICBsZXQgbGVuID0gMDtcbiAgICB3aGlsZSAoYXQoYzAgKyBsZW4sIHIwICsgbGVuICogZHIpID09PSBjaCkgeyBzZWVuWyhyMCArIGxlbiAqIGRyKSAqIG4gKyBjMCArIGxlbl0gPSAxOyBsZW4rKzsgfVxuICAgIGNvbnN0IHhhID0gLUhBTEYgKyBjMCAqIGNlbGwsIHhiID0gLUhBTEYgKyAoYzAgKyBsZW4pICogY2VsbDtcbiAgICBjb25zdCB5YSA9IGNoID09PSBcIi9cIiA/IEhBTEYgLSAocjAgKyAxKSAqIGNlbGwgOiBIQUxGIC0gcjAgKiBjZWxsO1xuICAgIGNvbnN0IHliID0gY2ggPT09IFwiL1wiID8geWEgKyBsZW4gKiBjZWxsIDogeWEgLSBsZW4gKiBjZWxsO1xuICAgIHNvbGlkcy5wdXNoKHsgazogS19DQVBTVUxFLCBheDogeGEsIGF5OiB5YSwgYng6IHhiLCBieTogeWIsIHI6IDYsIGN4OiAoeGEgKyB4YikgLyAyLCBjeTogKHlhICsgeWIpIC8gMiwgZTogMSwgbXU6IDEsIGtpY2s6IDAgfSk7XG4gIH1cblxuICBmb3IgKGxldCByID0gMDsgciA8IG47IHIrKykgZm9yIChsZXQgYyA9IDA7IGMgPCBuOyBjKyspIHtcbiAgICBjb25zdCBjaCA9IGdbcl1bY107XG4gICAgaWYgKGNoID09PSBcIm9cIikgc29saWRzLnB1c2goeyBrOiBLX0NJUkNMRSwgY3g6IGIuWChjKSwgY3k6IGIuWShyKSwgcjogNywgZTogMSwgbXU6IDEsIGtpY2s6IDAgfSk7XG4gICAgZWxzZSBpZiAoY2ggPT09IFwiT1wiKSBzb2xpZHMucHVzaCh7IGs6IEtfQ0lSQ0xFLCBjeDogYi5YKGMpLCBjeTogYi5ZKHIpLCByOiAxMywgZTogMywgbXU6IDAsIGtpY2s6IDI0MCwgYnVtcGVyOiB0cnVlIH0pO1xuICB9XG5cbiAgZm9yIChjb25zdCBvIG9mIGIub2Jqcykge1xuICAgIGlmIChvLnQgPT09IFwibW92ZXJcIikge1xuICAgICAgbW92ZXJzLnB1c2goeyAuLi5vLCBib3g6IHsgazogS19CT1gsIGN4OiBvLmN4LCBjeTogby5jeSwgaHc6IG8uaHcsIGhoOiBvLmhoLCBjOiAxLCBzOiAwLCBlOiAxLCBtdTogMSwga2ljazogMCB9IH0pO1xuICAgIH0gZWxzZSBpZiAoby50ID09PSBcInNhd1wiKSBzYXdzLnB1c2goeyAuLi5vIH0pO1xuICAgIGVsc2UgaWYgKG8udCA9PT0gXCJnYXRlXCIgfHwgby50ID09PSBcImZhblwiKSB7XG4gICAgICBjb25zdCBkID0gRElSW28uZGlyXTtcbiAgICAgIGlmICghZCkgdGhyb3cgbmV3IEVycm9yKGBsZXZlbCAke2RlZi5pZH06ICR7by50fSBuZWVkcyBkaXIgTC9SL1UvRGApO1xuICAgICAgY29uc3QgYmFzZSA9IHsgazogS19CT1gsIGN4OiBvLmN4LCBjeTogby5jeSwgaHc6IG8uaHcsIGhoOiBvLmhoLCBjOiAxLCBzOiAwLCBkeDogZFswXSwgZHk6IGRbMV0sIGRpcjogby5kaXIgfTtcbiAgICAgIGlmIChvLnQgPT09IFwiZ2F0ZVwiKSBnYXRlcy5wdXNoKHsgLi4uYmFzZSwgaGFsZjogZFswXSA/IG8uaGggOiBvLmh3IH0pO1xuICAgICAgZWxzZSBmYW5zLnB1c2goeyAuLi5iYXNlLCBwb3dlcjogby5wb3dlciB9KTtcbiAgICB9IGVsc2UgaWYgKG8udCA9PT0gXCJsYXNlclwiKSB7XG4gICAgICAvLyB0aGUgYmVhbSBpcyB0aGlubmVyIHRoYW4gaXRzIGNlbGxzIHNvIGl0IHJlYWRzIGFzIGEgbGluZVxuICAgICAgY29uc3QgdGhpbiA9IG8uaHcgPj0gby5oaCA/IHsgaHc6IG8uaHcsIGhoOiBNYXRoLm1pbihvLmhoLCAzLjUpIH0gOiB7IGh3OiBNYXRoLm1pbihvLmh3LCAzLjUpLCBoaDogby5oaCB9O1xuICAgICAgbGFzZXJzLnB1c2goeyBrOiBLX0JPWCwgY3g6IG8uY3gsIGN5OiBvLmN5LCAuLi50aGluLCBjOiAxLCBzOiAwLCBwZXJpb2Q6IG8ucGVyaW9kLCBkdXR5OiBvLmR1dHksIHBoOiBvLnBoIH0pO1xuICAgIH0gZWxzZSBpZiAoby50ID09PSBcInBvcnRcIikge1xuICAgICAgY29uc3QgaSA9IHBvcnRzLmxlbmd0aDtcbiAgICAgIHBvcnRzLnB1c2goeyB4OiBvLngsIHk6IG8ueSwgdG86IGkgKyAxLCBwYWlyOiBpID4+IDEgfSwgeyB4OiBvLngyLCB5OiBvLnkyLCB0bzogaSwgcGFpcjogaSA+PiAxIH0pO1xuICAgIH1cbiAgfVxuICBpZiAoZG9vcnMubGVuZ3RoICYmICFiLnB0LmtleXMubGVuZ3RoKSB0aHJvdyBuZXcgRXJyb3IoYGxldmVsICR7ZGVmLmlkfTogZG9vcnMgbmVlZCBhIGtleWApO1xuXG4gIGlmICghYi5wdC5zdGFydCB8fCAhYi5wdC5nb2FsKSB0aHJvdyBuZXcgRXJyb3IoYGxldmVsICR7ZGVmLmlkfTogc3RhcnQgYW5kIGdvYWwgYXJlIHJlcXVpcmVkYCk7XG5cbiAgLy8gaXMgdGhlIGJvcmRlciByaW5nIG9wZW4gYW55d2hlcmU/ICh0aGVuIHRoZSBiYWxsIGNhbiBmYWxsIG91dCBvZiB0aGUgd29ybGQpXG4gIGxldCBvcGVuID0gZmFsc2U7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgbjsgaSsrKSBpZiAoIXNvbGlkQXQoaSwgMCkgfHwgIXNvbGlkQXQoaSwgbiAtIDEpIHx8ICFzb2xpZEF0KDAsIGkpIHx8ICFzb2xpZEF0KG4gLSAxLCBpKSkgb3BlbiA9IHRydWU7XG5cbiAgY29uc3QgbGV2ZWwgPSB7XG4gICAgaWQ6IGRlZi5pZCwgbmFtZTogZGVmLm5hbWUgfHwgXCJcIiwgdGhlbWU6IGRlZi50aGVtZSB8fCBcIm1lYWRvd1wiLCB0dXQ6IGRlZi50dXQgfHwgbnVsbCxcbiAgICBmb3JtczogZGVmLmZvcm1zIHx8IFtcImJhbGxcIl0sIHBhcjogZGVmLnBhciB8fCAwLCBoYWxmOiBIQUxGLCBjZWxsLCBuLCBvcGVuLFxuICAgIHN0YXJ0OiBiLnB0LnN0YXJ0LCBnb2FsOiB7IHg6IGIucHQuZ29hbC54LCB5OiBiLnB0LmdvYWwueSwgcjogMTYgfSxcbiAgICBnZW1zOiBiLnB0LmdlbXMsIHNvbGlkcywga2lsbHMsIGNyeXN0YWxzLCBwYWRzLCBtb3ZlcnMsIHNhd3MsXG4gICAga2V5czogYi5wdC5rZXlzLCBrZXlNYXNrOiAoMSA8PCBiLnB0LmtleXMubGVuZ3RoKSAtIDEsIGRvb3JzLCBnYXRlcywgbGFzZXJzLCBmYW5zLCBwb3J0cyxcbiAgICByb3dzOiBiLnJvd3MoKVxuICB9O1xuICBsZXZlbC5ncmlkID0gYnVpbGRHcmlkKGxldmVsKTtcbiAgcmV0dXJuIGxldmVsO1xufVxuXG4vKiogQnJvYWRwaGFzZTogZm9yIGVhY2ggY29hcnNlIGNlbGwsIHRoZSBzdGF0aWMgc29saWRzIHRoYXQgY2FuIHRvdWNoIGEgYmFsbCBjZW50cmVkIGluIGl0LiAqL1xuZnVuY3Rpb24gYnVpbGRHcmlkKEwpIHtcbiAgY29uc3QgY2VsbFNpemUgPSAzMCwgbWFyZ2luID0gMzA7XG4gIGNvbnN0IG1pbiA9IC1MLmhhbGYgLSA5MCwgc3BhbiA9IDIgKiAoTC5oYWxmICsgOTApO1xuICBjb25zdCBuID0gTWF0aC5jZWlsKHNwYW4gLyBjZWxsU2l6ZSk7XG4gIGNvbnN0IGJ1Y2tldHMgPSBBcnJheS5mcm9tKHsgbGVuZ3RoOiBuICogbiB9LCAoKSA9PiBbXSk7XG4gIEwuc29saWRzLmZvckVhY2goKHMsIGlkeCkgPT4ge1xuICAgIGxldCB4MCwgeDEsIHkwLCB5MTtcbiAgICBpZiAocy5rID09PSBLX0JPWCkge1xuICAgICAgY29uc3QgZXggPSBNYXRoLmFicyhzLmh3ICogcy5jKSArIE1hdGguYWJzKHMuaGggKiBzLnMpLCBleSA9IE1hdGguYWJzKHMuaHcgKiBzLnMpICsgTWF0aC5hYnMocy5oaCAqIHMuYyk7XG4gICAgICB4MCA9IHMuY3ggLSBleDsgeDEgPSBzLmN4ICsgZXg7IHkwID0gcy5jeSAtIGV5OyB5MSA9IHMuY3kgKyBleTtcbiAgICB9IGVsc2UgaWYgKHMuayA9PT0gS19DSVJDTEUpIHsgeDAgPSBzLmN4IC0gcy5yOyB4MSA9IHMuY3ggKyBzLnI7IHkwID0gcy5jeSAtIHMucjsgeTEgPSBzLmN5ICsgcy5yOyB9XG4gICAgZWxzZSB7IHgwID0gTWF0aC5taW4ocy5heCwgcy5ieCkgLSBzLnI7IHgxID0gTWF0aC5tYXgocy5heCwgcy5ieCkgKyBzLnI7IHkwID0gTWF0aC5taW4ocy5heSwgcy5ieSkgLSBzLnI7IHkxID0gTWF0aC5tYXgocy5heSwgcy5ieSkgKyBzLnI7IH1cbiAgICBjb25zdCBpMCA9IE1hdGgubWF4KDAsIE1hdGguZmxvb3IoKHgwIC0gbWFyZ2luIC0gbWluKSAvIGNlbGxTaXplKSksIGkxID0gTWF0aC5taW4obiAtIDEsIE1hdGguZmxvb3IoKHgxICsgbWFyZ2luIC0gbWluKSAvIGNlbGxTaXplKSk7XG4gICAgY29uc3QgajAgPSBNYXRoLm1heCgwLCBNYXRoLmZsb29yKCh5MCAtIG1hcmdpbiAtIG1pbikgLyBjZWxsU2l6ZSkpLCBqMSA9IE1hdGgubWluKG4gLSAxLCBNYXRoLmZsb29yKCh5MSArIG1hcmdpbiAtIG1pbikgLyBjZWxsU2l6ZSkpO1xuICAgIGZvciAobGV0IGogPSBqMDsgaiA8PSBqMTsgaisrKSBmb3IgKGxldCBpID0gaTA7IGkgPD0gaTE7IGkrKykgYnVja2V0c1tqICogbiArIGldLnB1c2goaWR4KTtcbiAgfSk7XG4gIHJldHVybiB7IG1pbiwgY2VsbDogY2VsbFNpemUsIG4sIGxpc3RzOiBidWNrZXRzLm1hcCgoYikgPT4gSW50MTZBcnJheS5mcm9tKGIpKSB9O1xufVxuXG4vKiogQVNDSUkgcGljdHVyZSBvZiBhIGNvbXBpbGVkIGxldmVsIChhdXRob3JpbmcgYWlkKS4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhc2NpaShsZXZlbCkge1xuICBjb25zdCByb3dzID0gbGV2ZWwucm93cy5tYXAoKHIpID0+IHIuc3BsaXQoXCJcIikpO1xuICBjb25zdCBtYXJrID0gKHAsIGNoKSA9PiB7XG4gICAgY29uc3QgYyA9IE1hdGgucm91bmQoKHAueCArIEhBTEYpIC8gbGV2ZWwuY2VsbCAtIDAuNSksIHIgPSBNYXRoLnJvdW5kKChIQUxGIC0gcC55KSAvIGxldmVsLmNlbGwgLSAwLjUpO1xuICAgIGlmIChyb3dzW3JdICYmIHJvd3Nbcl1bY10gIT09IHVuZGVmaW5lZCkgcm93c1tyXVtjXSA9IGNoO1xuICB9O1xuICBsZXZlbC5nZW1zLmZvckVhY2goKGcpID0+IG1hcmsoZywgXCIqXCIpKTtcbiAgbWFyayhsZXZlbC5zdGFydCwgXCJTXCIpOyBtYXJrKGxldmVsLmdvYWwsIFwiR1wiKTtcbiAgZm9yIChjb25zdCBtIG9mIGxldmVsLm1vdmVycykgbWFyayh7IHg6IG0uY3gsIHk6IG0uY3kgfSwgXCJtXCIpO1xuICBmb3IgKGNvbnN0IHMgb2YgbGV2ZWwuc2F3cykgbWFyayh7IHg6IHMuY3gsIHk6IHMuY3kgfSwgXCJzXCIpO1xuICBmb3IgKGNvbnN0IGsgb2YgbGV2ZWwua2V5cykgbWFyayhrLCBcImtcIik7XG4gIGZvciAoY29uc3QgcCBvZiBsZXZlbC5wb3J0cykgbWFyayhwLCBcIkBcIik7XG4gIGZvciAoY29uc3QgZyBvZiBsZXZlbC5nYXRlcykgbWFyayh7IHg6IGcuY3gsIHk6IGcuY3kgfSwgeyBMOiBcIlx1MjE5MFwiLCBSOiBcIlx1MjE5MlwiLCBVOiBcIlx1MjE5MVwiLCBEOiBcIlx1MjE5M1wiIH1bZy5kaXJdKTtcbiAgZm9yIChjb25zdCBmIG9mIGxldmVsLmZhbnMpIG1hcmsoeyB4OiBmLmN4LCB5OiBmLmN5IH0sIFwiZlwiKTtcbiAgZm9yIChjb25zdCBsIG9mIGxldmVsLmxhc2VycykgbWFyayh7IHg6IGwuY3gsIHk6IGwuY3kgfSwgXCIhXCIpO1xuICByZXR1cm4gcm93cy5tYXAoKHIpID0+IHIuam9pbihcIlwiKSkuam9pbihcIlxcblwiKTtcbn1cbiIsICIvLyBXb3JsZCAxIFx1MjAxNCBcIk1lYWRvd1wiLiBUZWFjaGVzIHRoZSBjb3JlIHZlcmI6IHR1cm4gdGhlIHdvcmxkLCB0aGUgYmFsbCBmb2xsb3dzIGdyYXZpdHkuXG4vLyBTdGF0aWMgZ2VvbWV0cnkgb25seTogd2FsbHMsIHNsb3BlcywgZ2Vtcywgc3Bpa2VzLCBwZWdzLCBidW1wZXJzLCBvcGVuIGVkZ2VzLlxuLy8gR3JpZCBpcyAyOHgyOCAoY29scy9yb3dzIDAuLjI3LCBmcmFtZSBvbiAwIGFuZCAyNykuIEEgYmFsbCByZXN0aW5nIG9uIGEgd2FsbCBpbiByb3cgUlxuLy8gaGFzIGl0cyBjZW50cmUgYXQgcm93IFItMS40LlxuXG5leHBvcnQgY29uc3QgV09STEQxID0gW1xuICB7IC8vIEZpcnN0IHRpbHQ6IHJvbGwgb2ZmIHRoZSBzaGVsZiwgbGFuZCBieSB0aGUgZ29hbC5cbiAgICBpZDogXCIxLTFcIiwgdHV0OiBcImRyYWdcIixcbiAgICBidWlsZChiKSB7XG4gICAgICBiLmZyYW1lKCk7XG4gICAgICBiLmgoMTIsIDEsIDE4KTtcbiAgICAgIGIuc3RhcnQoNCwgMTAuNikuZ29hbCgyNS42LCAyNS42KTtcbiAgICAgIGIuZ2VtKDksIDEwLjYpLmdlbSgxNCwgMTAuNikuZ2VtKDI1LjYsIDIyKTtcbiAgICB9XG4gIH0sXG4gIHsgLy8gVGhlIG90aGVyIHdheSwgdGhlbiBiYWNrLlxuICAgIGlkOiBcIjEtMlwiLCB0dXQ6IFwiYm90aFwiLFxuICAgIGJ1aWxkKGIpIHtcbiAgICAgIGIuZnJhbWUoKTtcbiAgICAgIGIuaCgxMiwgOSwgMjYpO1xuICAgICAgYi5zdGFydCgyMywgMTAuNikuZ29hbCgyNS42LCAyNS42KTtcbiAgICAgIGIuZ2VtKDE1LCAxMC42KS5nZW0oMS40LCAyMCkuZ2VtKDEzLCAyNS42KTtcbiAgICB9XG4gIH0sXG4gIHsgLy8gWmlnemFnLlxuICAgIGlkOiBcIjEtM1wiLFxuICAgIGJ1aWxkKGIpIHtcbiAgICAgIGIuZnJhbWUoKTtcbiAgICAgIGIuaCg4LCAxLCAxOSkuaCgxNSwgOCwgMjYpLmgoMjIsIDEsIDE5KTtcbiAgICAgIGIuc3RhcnQoMywgNi42KS5nb2FsKDI1LjYsIDI1LjYpO1xuICAgICAgYi5nZW0oMTIsIDYuNikuZ2VtKDEzLCAxMy42KS5nZW0oMTAsIDIwLjYpO1xuICAgIH1cbiAgfSxcbiAgeyAvLyBGaXJzdCBzcGlrZXM6IHRoZSBicmlkZ2UgaXMgc2FmZSwgdGhlIGZsb29yIHVuZGVyIGl0IGlzIG5vdC5cbiAgICBpZDogXCIxLTRcIiwgdHV0OiBcInNwaWtlc1wiLFxuICAgIGJ1aWxkKGIpIHtcbiAgICAgIGIuZnJhbWUoKTtcbiAgICAgIGIuaCgxMCwgMSwgMTApO1xuICAgICAgYi5oKDE3LCA5LCAxOSk7XG4gICAgICBiLnNwaWtlcyg2LCAyNiwgMTcsIDI2KTtcbiAgICAgIGIuc3RhcnQoNywgOC42KS5nb2FsKDI1LjYsIDI1LjYpO1xuICAgICAgYi5nZW0oMywgOC42KS5nZW0oMTQsIDE1LjYpLmdlbSgyMiwgMjEpO1xuICAgIH1cbiAgfSxcbiAgeyAvLyBVcHNpZGUgZG93bjogYSBoYWxmIHR1cm4gbWFrZXMgdGhlIGNlaWxpbmcgdGhlIGZsb29yLlxuICAgIGlkOiBcIjEtNVwiLCB0dXQ6IFwiZmxpcFwiLFxuICAgIGJ1aWxkKGIpIHtcbiAgICAgIGIuZnJhbWUoKTtcbiAgICAgIGIuaCgxMywgMSwgMjApO1xuICAgICAgYi5zdGFydCg0LCAyNS42KS5nb2FsKDEuNCwgMS40KTtcbiAgICAgIGIuZ2VtKDEyLCAxNC40KS5nZW0oMjMuNSwgMTMpLmdlbSgxMywgMS40KTtcbiAgICB9XG4gIH0sXG4gIHsgLy8gUG91cjogdGlwIHRoZSBiYWxsIG91dCBvZiBvbmUgY3VwIGFuZCBkcm9wIGl0IGludG8gdGhlIG90aGVyLlxuICAgIGlkOiBcIjEtNlwiLFxuICAgIGJ1aWxkKGIpIHtcbiAgICAgIGIuZnJhbWUoKTtcbiAgICAgIGIudig1LCAxMiwgMTkpLmgoMTksIDUsIDExKS52KDExLCAxMiwgMTkpO1xuICAgICAgYi52KDE4LCAxMywgMjApLmgoMjAsIDE4LCAyMikudigyMiwgMTMsIDIwKTsgICAgICAgICAgLy8gc251ZyBjdXA6IHRoZSBiYWxsIGNhbiBvbmx5IHJlc3Qgb24gdGhlIGdvYWxcbiAgICAgIGIuZGlhZygxNSwgMTAsIDE3LCAxMikuZGlhZygyMywgMTIsIDI2LCA5KTtcbiAgICAgIGIuc3RhcnQoOCwgMTcuNikuZ29hbCgyMCwgMTguNik7XG4gICAgICBiLmdlbSg4LCA5KS5nZW0oMTQsIDEuNCkuZ2VtKDIwLCAxMCk7XG4gICAgfVxuICB9LFxuICB7IC8vIFN0ZXBzOiBnZW50bGUgdGlsdHMgXHUyMDE0IHRvbyBmYXN0IGFuZCB5b3Ugb3ZlcnNob290IG9udG8gdGhlIHNwaWtlcy5cbiAgICBpZDogXCIxLTdcIixcbiAgICBidWlsZChiKSB7XG4gICAgICBiLmZyYW1lKCk7XG4gICAgICBiLmgoNywgMSwgNykuaCgxMiwgOSwgMTQpLmgoMTcsIDE2LCAyMSk7XG4gICAgICBiLnNwaWtlcygxLCAyNiwgMjAsIDI2KTtcbiAgICAgIGIuc3RhcnQoMywgNS42KS5nb2FsKDI1LjYsIDI1LjYpO1xuICAgICAgYi5nZW0oMTEuNSwgMTAuNikuZ2VtKDE4LjUsIDE1LjYpLmdlbSgyNCwgMjApO1xuICAgIH1cbiAgfSxcbiAgeyAvLyBGb3JrOiB0aGUgc2FmZSB3YXkgZG93biwgb3IgdGhlIHJpc2t5IHNpZGUgZm9yIGdlbXMuXG4gICAgaWQ6IFwiMS04XCIsXG4gICAgYnVpbGQoYikge1xuICAgICAgYi5mcmFtZSgpO1xuICAgICAgYi5oKDcsIDEsIDEyKTtcbiAgICAgIGIuYm94KDEzLCAxMSwgMTQsIDIyKTtcbiAgICAgIGIuaCgxOCwgMTgsIDI2KTtcbiAgICAgIGIuc3Bpa2VzKDIxLCAyNiwgMjYsIDI2KTtcbiAgICAgIGIuc3RhcnQoNCwgNS42KS5nb2FsKDEuNCwgMjUuNik7XG4gICAgICBiLmdlbSgyMiwgMTYuNikuZ2VtKDE2LjUsIDI1LjYpLmdlbSg5LCA1LjYpO1xuICAgIH1cbiAgfSxcbiAgeyAvLyBPcGVuIGVkZ2U6IHRoZXJlIGlzIGEgaG9sZSBpbiB0aGUgZmxvb3IuIEdvIG92ZXIgdGhlIHRvcC5cbiAgICBpZDogXCIxLTlcIiwgdHV0OiBcImVkZ2VcIixcbiAgICBidWlsZChiKSB7XG4gICAgICBiLmZyYW1lKCk7XG4gICAgICBiLmNsZWFyKDExLCAyNywgMTYsIDI3KTtcbiAgICAgIGIuaCgxNCwgOCwgMTkpO1xuICAgICAgYi5zdGFydCgzLCAyNS42KS5nb2FsKDI1LjYsIDI1LjYpO1xuICAgICAgYi5nZW0oNiwgMS40KS5nZW0oMTMuNSwgMTIuNikuZ2VtKDIxLCAxOSk7XG4gICAgfVxuICB9LFxuICB7IC8vIFNwaXJhbDoga2VlcCB0dXJuaW5nLlxuICAgIGlkOiBcIjEtMTBcIixcbiAgICBidWlsZChiKSB7XG4gICAgICBiLmZyYW1lKCk7XG4gICAgICBiLmgoNSwgMSwgMjIpLnYoMjIsIDUsIDIyKS5oKDIyLCA1LCAyMikudig1LCAxMCwgMjIpO1xuICAgICAgYi5oKDEwLCA2LCAxNykudigxNywgMTAsIDE3KS5oKDE3LCAxMCwgMTcpLnYoMTAsIDEwLCAxMikudigxMCwgMTYsIDE3KTtcbiAgICAgIGIuc3RhcnQoMywgMy42KS5nb2FsKDE1LjYsIDE0KTsgICAgICAgICAgICAgICAgICAgICAgIC8vIGFnYWluc3QgdGhlIGZhciB3YWxsIG9mIHRoZSBpbm5lciByb29tXG4gICAgICBiLmdlbSgyNC41LCAxNCkuZ2VtKDIuNSwgMTUpLmdlbSgxMy41LCAxOS41KTtcbiAgICB9XG4gIH0sXG4gIHsgLy8gUGxpbmtvOiBzdGVlciB0aHJvdWdoIHRoZSBwZWdzIGludG8gdGhlIGN1cC5cbiAgICBpZDogXCIxLTExXCIsXG4gICAgYnVpbGQoYikge1xuICAgICAgYi5mcmFtZSgpO1xuICAgICAgYi5oKDQsIDEsIDgpO1xuICAgICAgW1s5LCBbNiwgMTEsIDE2LCAyMV1dLCBbMTMsIFszLCA4LCAxNCwgMTksIDI0XV0sIFsxNywgWzYsIDExLCAxNiwgMjFdXV1cbiAgICAgICAgLmZvckVhY2goKFtyLCBjb2xzXSkgPT4gY29scy5mb3JFYWNoKChjKSA9PiBiLnB1dChcIm9cIiwgYywgcikpKTtcbiAgICAgIGIudigxMiwgMjQsIDI2KS52KDE2LCAyNCwgMjYpOyAgICAgICAgICAgICAgICAgICAgICAgIC8vIHNudWcgY3VwIHVuZGVyIGEgZnVubmVsXG4gICAgICBiLmRpYWcoOCwgMjAsIDExLCAyMykuZGlhZygxNywgMjMsIDIwLCAyMCk7XG4gICAgICBiLnNwaWtlcygxLCAyNiwgMTEsIDI2KS5zcGlrZXMoMTcsIDI2LCAyNiwgMjYpO1xuICAgICAgYi5zdGFydCgzLCAyLjYpLmdvYWwoMTQsIDI1LjYpO1xuICAgICAgYi5nZW0oMTQsIDExKS5nZW0oOCwgMTUpLmdlbSgxNCwgMjEpO1xuICAgIH1cbiAgfSxcbiAgeyAvLyBSaW5nOiBmaW5kIHRoZSBkb29yIG9mIHRoZSBpbm5lciByb29tLlxuICAgIGlkOiBcIjEtMTJcIixcbiAgICBidWlsZChiKSB7XG4gICAgICBiLmZyYW1lKCk7XG4gICAgICBiLmgoNywgNywgMjApLmgoMjAsIDcsIDIwKS52KDcsIDcsIDIwKS52KDIwLCA3LCAxMikudigyMCwgMTYsIDIwKTtcbiAgICAgIGIuc3RhcnQoMywgMjUuNikuZ29hbCg4LjQsIDE0KTsgICAgICAgICAgICAgICAgICAgICAgICAvLyBhZ2FpbnN0IHRoZSBmYXIgd2FsbCwgb3Bwb3NpdGUgdGhlIGRvb3JcbiAgICAgIGIuZ2VtKDI0LCAyNS42KS5nZW0oMjMuNSwgMykuZ2VtKDMsIDMuNCk7XG4gICAgfVxuICB9LFxuICB7IC8vIFZhbGxleTogY2xpbWIgb3V0IHRoZSByaWdodCBzaWRlIFx1MjAxNCB0aGUgbGVmdCBzaWRlIGVuZHMgYmFkbHkuXG4gICAgaWQ6IFwiMS0xM1wiLFxuICAgIGJ1aWxkKGIpIHtcbiAgICAgIGIuZnJhbWUoKTtcbiAgICAgIGIuZGlhZyg0LCAxMiwgMTIsIDIwKS5kaWFnKDEzLCAyMCwgMjEsIDEyKTtcbiAgICAgIGIuc3Bpa2VzKDEsIDI2LCA5LCAyNik7XG4gICAgICBiLnN0YXJ0KDEyLjUsIDE3KS5nb2FsKDI1LjYsIDI1LjYpO1xuICAgICAgYi5nZW0oMTcsIDEzLjUpLmdlbSgyNCwgMTgpLmdlbSg4LCAxMy41KTtcbiAgICB9XG4gIH0sXG4gIHsgLy8gQnVtcGVycy5cbiAgICBpZDogXCIxLTE0XCIsXG4gICAgYnVpbGQoYikge1xuICAgICAgYi5mcmFtZSgpO1xuICAgICAgYi5oKDQsIDExLCAxNik7XG4gICAgICBbWzcsIDEwXSwgWzIxLCAxMF0sIFsxNCwgMTRdLCBbNSwgMTddLCBbMjMsIDE3XV0uZm9yRWFjaCgoW2MsIHJdKSA9PiBiLnB1dChcIk9cIiwgYywgcikpO1xuICAgICAgYi52KDEyLCAyMywgMjYpLnYoMTYsIDIzLCAyNik7XG4gICAgICBiLmRpYWcoOCwgMTksIDExLCAyMikuZGlhZygxNywgMjIsIDIwLCAxOSk7XG4gICAgICBiLnN0YXJ0KDEzLjUsIDIuNikuZ29hbCgxNCwgMjUuNik7XG4gICAgICBiLmdlbSg0LCA2KS5nZW0oMjQsIDYpLmdlbSgxNCwgMTkpO1xuICAgIH1cbiAgfSxcbiAgeyAvLyBNYXplOiB1bmRlciwgb3ZlciwgdW5kZXIuXG4gICAgaWQ6IFwiMS0xNVwiLFxuICAgIGJ1aWxkKGIpIHtcbiAgICAgIGIuZnJhbWUoKTtcbiAgICAgIGIudig3LCAxLCAyMCkudigxNCwgNywgMjYpLnYoMjEsIDEsIDIwKTtcbiAgICAgIGIuc3Bpa2VzKDE1LCAyNiwgMTcsIDI2KTtcbiAgICAgIGIuc3RhcnQoMywgMi42KS5nb2FsKDI1LjYsIDEuNCk7XG4gICAgICBiLmdlbSgxMC41LCAyNS42KS5nZW0oMTEsIDEuNCkuZ2VtKDE4LCAxMyk7XG4gICAgfVxuICB9LFxuICB7IC8vIEhvdXJnbGFzczogc2xpZGUgYWxvbmcgdGhlIHVuZGVyc2lkZSBhbmQgY2F0Y2ggdGhlIG5lY2suXG4gICAgaWQ6IFwiMS0xNlwiLFxuICAgIGJ1aWxkKGIpIHtcbiAgICAgIGIuZnJhbWUoKTtcbiAgICAgIGIuZGlhZygxLCA2LCAxMSwgMTYpLmRpYWcoMTYsIDE2LCAyNiwgNik7XG4gICAgICBiLnN0YXJ0KDQsIDI1LjYpLmdvYWwoMS40LCAxLjQpO1xuICAgICAgYi5nZW0oMTMuNSwgMjEpLmdlbSgxMy41LCAxMikuZ2VtKDIyLCAxLjQpO1xuICAgIH1cbiAgfSxcbiAgeyAvLyBDbGlmZmhhbmdlcjogb3BlbiBzaWRlcy4gUm9sbCBvZmYgZ2VudGx5LlxuICAgIGlkOiBcIjEtMTdcIixcbiAgICBidWlsZChiKSB7XG4gICAgICBiLmZyYW1lKCk7XG4gICAgICBiLmNsZWFyKDAsIDgsIDAsIDE1KS5jbGVhcigyNywgOCwgMjcsIDE1KTtcbiAgICAgIGIuaCgxMCwgOSwgMTgpO1xuICAgICAgYi5zdGFydCgxMy41LCA4LjYpLmdvYWwoMjUuNiwgMjUuNik7XG4gICAgICBiLmdlbSg0LCA5KS5nZW0oMjMsIDkpLmdlbSgxMy41LCAxOCk7XG4gICAgfVxuICB9LFxuICB7IC8vIEdhdW50bGV0OiBzcGlrZXMgb24gdGhlIGZsb29yIGhlcmUsIG9uIHRoZSBjZWlsaW5nIHRoZXJlLlxuICAgIGlkOiBcIjEtMThcIixcbiAgICBidWlsZChiKSB7XG4gICAgICBiLmZyYW1lKCk7XG4gICAgICBiLmgoOCwgMSwgMjIpO1xuICAgICAgYi5oKDE3LCA1LCAyNik7XG4gICAgICBiLnNwaWtlcygxMiwgMTYsIDE3LCAxNik7XG4gICAgICBiLnNwaWtlcygxMCwgMTgsIDE2LCAxOCk7XG4gICAgICBiLnN0YXJ0KDMsIDYuNikuZ29hbCgyNS42LCAyNS42KTtcbiAgICAgIGIuZ2VtKDE0LCA5LjQpLmdlbSgyLjUsIDEzKS5nZW0oMTMsIDI1LjYpO1xuICAgIH1cbiAgfSxcbiAgeyAvLyBTdW1taXQ6IGRyb3Agb250byB0aGUgcGVhaywgbm90IHRoZSBzaG91bGRlcnMuXG4gICAgaWQ6IFwiMS0xOVwiLFxuICAgIGJ1aWxkKGIpIHtcbiAgICAgIGIuZnJhbWUoKTtcbiAgICAgIGIuYm94KDMsIDIzLCAyMywgMjYpO1xuICAgICAgYi5ib3goNywgMTksIDE5LCAyMik7XG4gICAgICBiLmJveCgxMSwgMTUsIDE1LCAxOCk7XG4gICAgICBiLnB1dChcIiNcIiwgMTEsIDE0KS5wdXQoXCIjXCIsIDE1LCAxNCk7ICAgICAgICAgICAgICAgICAgLy8gY3JhZGxlIG9uIHRoZSBwZWFrXG4gICAgICBiLnNwaWtlcygzLCAyMiwgNiwgMjIpLnNwaWtlcygyMCwgMjIsIDIzLCAyMik7XG4gICAgICBiLnNwaWtlcyg3LCAxOCwgMTAsIDE4KS5zcGlrZXMoMTYsIDE4LCAxOSwgMTgpO1xuICAgICAgYi5oKDQsIDEsIDUpO1xuICAgICAgYi5zdGFydCgzLCAyLjYpLmdvYWwoMTMsIDEzLjYpO1xuICAgICAgYi5nZW0oOCwgMS40KS5nZW0oMTMsIDgpLmdlbSgyMCwgMS40KTtcbiAgICB9XG4gIH0sXG4gIHsgLy8gRXhhbTogdGlsdCwgZmxpcCBvdmVyIHNwaWtlcywgY3Jvc3MgdGhlIGhvbGUuXG4gICAgaWQ6IFwiMS0yMFwiLFxuICAgIGJ1aWxkKGIpIHtcbiAgICAgIGIuZnJhbWUoKTtcbiAgICAgIGIuY2xlYXIoMTIsIDI3LCAxNSwgMjcpO1xuICAgICAgYi5oKDYsIDEsIDIxKTtcbiAgICAgIGIuaCgxMywgNiwgMjYpO1xuICAgICAgYi5zcGlrZXMoMTIsIDEyLCAxNSwgMTIpO1xuICAgICAgYi5zdGFydCgzLCA0LjYpLmdvYWwoMjUuNiwgMjUuNik7XG4gICAgICBiLmdlbSgxMSwgNC42KS5nZW0oMTMuNSwgNy40KS5nZW0oMTMuNSwgMTQuNCk7XG4gICAgfVxuICB9XG5dO1xuIiwgIi8vIFdvcmxkIDIgXHUyMDE0IFwiU3Vuc2V0XCIuIExhdW5jaCBwYWRzLCBtb3ZpbmcgcGxhdGZvcm1zLCBzYXcgYmxhZGVzOyB0aGVuIGJ1bXBlcnMgYW5kIHBlZ3MgYW1vbmcgdGhlbS5cbmV4cG9ydCBjb25zdCBXT1JMRDIgPSBbXG4gIHsgLy8gUGFkOiBhIGxvdyBjYXZlLCBhIGhvbGUgaW4gdGhlIGZsb29yIGFuZCBzcGlrZXMgb3ZlcmhlYWQ7IHRoZSBwYWQncyB0aHJvdyBpcyB0aGUgd2F5IGFjcm9zcy5cbiAgICBpZDogXCIyLTFcIiwgdHV0OiBcInBhZFwiLFxuICAgIGJ1aWxkKGIpIHtcbiAgICAgIGIuZnJhbWUoKTtcbiAgICAgIGIuYm94KDEsIDEsIDI2LCA5KTtcbiAgICAgIGIuY2xlYXIoMTQsIDI3LCAyMiwgMjcpO1xuICAgICAgYi52KDEzLCAxMCwgMjEpLmgoMjIsIDEzLCAyMyk7XG4gICAgICBiLnNwaWtlcygxNCwgMjMsIDIyLCAyMyk7XG4gICAgICBiLmgoMTQsIDEsIDYpLmgoMjAsIDYsIDExKTtcbiAgICAgIGIucHV0KFwiPlwiLCAxMCwgMjYpLnB1dChcIj5cIiwgMTEsIDI2KTtcbiAgICAgIGIuc3RhcnQoMywgMTIuNikuZ29hbCgyNS42LCAyNS42KTtcbiAgICAgIGIuZ2VtKDQsIDE4KS5nZW0oOSwgMTguNikuZ2VtKDI0LjUsIDE5KTtcbiAgICB9XG4gIH0sXG4gIHsgLy8gVHdvIGhvcHM6IGEgcGFkIGF0IHRoZSBlbmQgb2YgZWFjaCBwbGF0Zm9ybSB0aHJvd3MgeW91IG92ZXIgdGhlIHNwaWtlZCBnYXAuXG4gICAgaWQ6IFwiMi0yXCIsXG4gICAgYnVpbGQoYikge1xuICAgICAgYi5mcmFtZSgpO1xuICAgICAgYi5ib3goMSwgMSwgMjYsIDE2KS5jbGVhcigxLCA5LCA3LCAxNik7XG4gICAgICBiLmgoMTIsIDEsIDQpO1xuICAgICAgYi5ib3goMSwgMjEsIDcsIDI2KS5ib3goMTIsIDIxLCAxNiwgMjYpLmJveCgyMSwgMjEsIDI2LCAyNik7XG4gICAgICBiLnNwaWtlcyg4LCAyNiwgMTEsIDI2KS5zcGlrZXMoMTcsIDI2LCAyMCwgMjYpO1xuICAgICAgYi5zcGlrZXMoOCwgMTcsIDExLCAxNykuc3Bpa2VzKDE3LCAxNywgMjAsIDE3KTtcbiAgICAgIGIucHV0KFwiPlwiLCA2LCAyMCkucHV0KFwiPlwiLCA3LCAyMCkucHV0KFwiPlwiLCAxNSwgMjApLnB1dChcIj5cIiwgMTYsIDIwKTtcbiAgICAgIGIuc3RhcnQoMywgMTAuNikuZ29hbCgyNS42LCAxOS42KTtcbiAgICAgIGIuZ2VtKDUsIDE5LjYpLmdlbSgxNCwgMTkuNikuZ2VtKDIzLCAxOS42KTtcbiAgICB9XG4gIH0sXG4gIHsgLy8gVmFsbGV5OiByb2xsIGRvd24gb25lIHJhbXAsIHRoZSBwYWQgdGhyb3dzIHlvdSB1cCB0aGUgb3RoZXIsIG92ZXIgdGhlIHNwaWtlcy5cbiAgICBpZDogXCIyLTNcIixcbiAgICBidWlsZChiKSB7XG4gICAgICBiLmZyYW1lKCk7XG4gICAgICBiLmRpYWcoMSwgOCwgOSwgMTYpLmRpYWcoMTAsIDE3LCAxNywgMTApO1xuICAgICAgYi5ib3goMSwgMjQsIDI2LCAyNik7XG4gICAgICBiLnB1dChcIj5cIiwgOSwgMTYpLnB1dChcIj5cIiwgMTAsIDE2KTtcbiAgICAgIGIuc3Bpa2VzKDE4LCAyMywgMjIsIDIzKTtcbiAgICAgIGIuaCgxMSwgMTgsIDIwKTtcbiAgICAgIGIuc3RhcnQoMi42LCA2LjYpLmdvYWwoMjUuNiwgMjIuNik7XG4gICAgICBiLmdlbSg3LCAxMSkuZ2VtKDEzLCAxMSkuZ2VtKDE5LCA4KTtcbiAgICB9XG4gIH0sXG4gIHsgLy8gQ2hpbW5leTogdGhlIG9ubHkgd2F5IHVwIHRocm91Z2ggdGhlIHNsYWIgaXMgdGhlIHBhZCB1bmRlciB0aGUgaG9sZS5cbiAgICBpZDogXCIyLTRcIixcbiAgICBidWlsZChiKSB7XG4gICAgICBiLmZyYW1lKCk7XG4gICAgICBiLmgoMTgsIDEsIDkpLmgoMTgsIDE1LCAyNik7XG4gICAgICBiLnNwaWtlcygxLCAxOSwgOSwgMTkpLnNwaWtlcygxNSwgMTksIDI2LCAxOSk7XG4gICAgICBiLnB1dChcIkFcIiwgMTEsIDI2KS5wdXQoXCJBXCIsIDEyLCAyNikucHV0KFwiQVwiLCAxMywgMjYpO1xuICAgICAgYi5zdGFydCgzLCAyNS42KS5nb2FsKDI1LjYsIDE2LjYpO1xuICAgICAgYi5nZW0oNywgMjUuNikuZ2VtKDIwLCAyNS42KS5nZW0oNCwgMTYuNik7XG4gICAgfVxuICB9LFxuICB7IC8vIEhvcCBhbmQgbGlmdDogdGhyb3cgYWNyb3NzIHRoZSBzcGlrZXMsIHRoZW4gcm9ja2V0IHVwIHRocm91Z2ggdGhlIHNsYWIuXG4gICAgaWQ6IFwiMi01XCIsXG4gICAgYnVpbGQoYikge1xuICAgICAgYi5mcmFtZSgpO1xuICAgICAgYi5ib3goMSwgMjIsIDcsIDI2KS5ib3goMTQsIDIyLCAyNiwgMjYpO1xuICAgICAgYi5zcGlrZXMoOCwgMjYsIDEzLCAyNik7XG4gICAgICBiLmgoMTQsIDEsIDE5KS5oKDE0LCAyNSwgMjYpO1xuICAgICAgYi5zcGlrZXMoMSwgMTUsIDE5LCAxNSkuc3Bpa2VzKDI1LCAxNSwgMjYsIDE1KTtcbiAgICAgIGIucHV0KFwiPlwiLCA2LCAyMSkucHV0KFwiPlwiLCA3LCAyMSk7XG4gICAgICBiLnB1dChcIkFcIiwgMjEsIDIxKS5wdXQoXCJBXCIsIDIyLCAyMSkucHV0KFwiQVwiLCAyMywgMjEpO1xuICAgICAgYi5zdGFydCgzLCAyMC42KS5nb2FsKDEuNCwgMTIuNik7XG4gICAgICBiLmdlbSg1LCAyMC42KS5nZW0oMTEsIDE5KS5nZW0oMTIsIDkpO1xuICAgIH1cbiAgfSxcbiAgeyAvLyBGZXJyeTogdGhlIG9ubHkgYnJpZGdlIG92ZXIgdGhlIHNwaWtlZCBwaXQgaXMgYSBtb3ZpbmcgcGxhdGZvcm0uXG4gICAgaWQ6IFwiMi02XCIsIHR1dDogXCJtb3ZlclwiLFxuICAgIGJ1aWxkKGIpIHtcbiAgICAgIGIuZnJhbWUoKTtcbiAgICAgIGIuYm94KDEsIDEsIDI2LCAxNik7XG4gICAgICBiLmJveCgxLCAyMSwgOCwgMjYpLmJveCgxOSwgMjEsIDI2LCAyNik7XG4gICAgICBiLnNwaWtlcyg5LCAxNywgMTgsIDE3KS5zcGlrZXMoOSwgMjYsIDE4LCAyNik7XG4gICAgICBiLm1vdmVyKDEzLjUsIDIxLCAzLCAxLCAzLjUsIDAsIDEuMCwgMS41Nyk7XG4gICAgICBiLnN0YXJ0KDMsIDE5LjYpLmdvYWwoMjUuNiwgMTkuNik7XG4gICAgICBiLmdlbSg2LCAxOS42KS5nZW0oMTMuNSwgMTkuNikuZ2VtKDIzLCAxOS42KTtcbiAgICB9XG4gIH0sXG4gIHsgLy8gRG9vcm1hbjogYSBwbHVnIHNsaWRlcyB1cCBhbmQgZG93biBpbiB0aGUgZG9vcndheS4gU2xpcCB0aHJvdWdoIHdoZW4gaXQgaXMgaGlnaC5cbiAgICBpZDogXCIyLTdcIixcbiAgICBidWlsZChiKSB7XG4gICAgICBiLmZyYW1lKCk7XG4gICAgICBiLnYoMTMsIDEsIDE5KTtcbiAgICAgIGIubW92ZXIoMTMsIDIzLCAxLCA1LCAwLCAxLjAsIDEuMyk7XG4gICAgICBiLmgoMTIsIDEsIDgpLmgoMTgsIDQsIDEwKTtcbiAgICAgIGIuc3RhcnQoMywgMTAuNikuZ29hbCgyNS42LCAyNS42KTtcbiAgICAgIGIuZ2VtKDYsIDE2LjYpLmdlbSg4LCAyNS42KS5nZW0oMjAsIDEyKTtcbiAgICB9XG4gIH0sXG4gIHsgLy8gU2F3OiBhIGJsYWRlIGJvYnMgYWNyb3NzIHRoZSBjb3JyaWRvci4gUnVuIHRocm91Z2ggd2hpbGUgaXQgaXMgdXAuXG4gICAgaWQ6IFwiMi04XCIsIHR1dDogXCJzYXdcIixcbiAgICBidWlsZChiKSB7XG4gICAgICBiLmZyYW1lKCk7XG4gICAgICBiLmJveCgxLCAxLCAyNiwgMTUpO1xuICAgICAgYi5ib3goMSwgMjMsIDI2LCAyNik7XG4gICAgICBiLnNhdygxMywgMjAsIDE0LCAwLCAzLCAxLjMsIDMuMTQpO1xuICAgICAgYi5zdGFydCgzLCAyMS42KS5nb2FsKDI1LjYsIDIxLjYpO1xuICAgICAgYi5nZW0oNywgMjEuNikuZ2VtKDIwLCAxNykuZ2VtKDIzLCAyMS42KTtcbiAgICB9XG4gIH0sXG4gIHsgLy8gU2lldmU6IHRoZSBwZWdzIHNwaWxsIHRoZSBiYWxsIG9udG8gYSBzbGlkaW5nIHNoZWxmIHRoYXQgZGVjaWRlcyB3aGVyZSBpdCBmYWxscy5cbiAgICBpZDogXCIyLTlcIixcbiAgICBidWlsZChiKSB7XG4gICAgICBiLmZyYW1lKCk7XG4gICAgICBiLmgoNCwgMTEsIDE2KTtcbiAgICAgIFtbOCwgWzYsIDExLCAxNiwgMjFdXSwgWzExLCBbNCwgOSwgMTQsIDE5LCAyNF1dXS5mb3JFYWNoKChbciwgY29sc10pID0+IGNvbHMuZm9yRWFjaCgoYykgPT4gYi5wdXQoXCJvXCIsIGMsIHIpKSk7XG4gICAgICBiLm1vdmVyKDE0LCAxNiwgNywgMSwgNi41LCAwLCAxLjMpO1xuICAgICAgYi5zcGlrZXMoMTAsIDI2LCAyNiwgMjYpO1xuICAgICAgYi52KDUsIDIxLCAyNikudig5LCAyMSwgMjYpO1xuICAgICAgYi5kaWFnKDEsIDE3LCA0LCAyMCkuZGlhZygxMCwgMjAsIDEzLCAxNyk7XG4gICAgICBiLnN0YXJ0KDEzLjUsIDIuNikuZ29hbCg3LCAyNS42KTtcbiAgICAgIGIuZ2VtKDE0LCA3KS5nZW0oNywgMTMpLmdlbSgyMSwgMTQpO1xuICAgIH1cbiAgfSxcbiAgeyAvLyBQaW5iYWxsOiB0aGUgcGFkIGZpcmVzIHlvdSBpbnRvIHRoZSBidW1wZXJzLCB0aGUgY29ybmVyIGlzIHRoZSBnb2FsLlxuICAgIGlkOiBcIjItMTBcIixcbiAgICBidWlsZChiKSB7XG4gICAgICBiLmZyYW1lKCk7XG4gICAgICBiLnNwaWtlcygxLCAyNiwgMTAsIDI2KTtcbiAgICAgIGIucHV0KFwiQVwiLCAxMywgMjYpLnB1dChcIkFcIiwgMTQsIDI2KTtcbiAgICAgIFtbNywgMTRdLCBbMjAsIDE0XSwgWzE0LCA4XSwgWzQsIDVdLCBbMjMsIDZdXS5mb3JFYWNoKChbYywgcl0pID0+IGIucHV0KFwiT1wiLCBjLCByKSk7XG4gICAgICBbWzEwLCAxMV0sIFsxNywgMTFdLCBbMTAsIDRdLCBbMTgsIDRdXS5mb3JFYWNoKChbYywgcl0pID0+IGIucHV0KFwib1wiLCBjLCByKSk7XG4gICAgICBiLnN0YXJ0KDI1LjYsIDI1LjYpLmdvYWwoMS40LCAxLjQpO1xuICAgICAgYi5nZW0oMTQsIDE2KS5nZW0oNywgOSkuZ2VtKDIxLCA5KTtcbiAgICB9XG4gIH0sXG4gIHsgLy8gT3JjaGFyZDogYnVtcGVycywgcGVncywgYSBzbGlkaW5nIHBsYXRlIGFuZCBhIGJsYWRlIGd1YXJkIHRoZSBjb3JuZXIgY3VwLlxuICAgIGlkOiBcIjItMTFcIixcbiAgICBidWlsZChiKSB7XG4gICAgICBiLmZyYW1lKCk7XG4gICAgICBiLmgoNCwgMTIsIDE2KTtcbiAgICAgIFtbNywgOV0sIFsyMCwgOV0sIFsxMywgMTNdXS5mb3JFYWNoKChbYywgcl0pID0+IGIucHV0KFwiT1wiLCBjLCByKSk7XG4gICAgICBbWzQsIDEyXSwgWzEwLCAxNl0sIFsxNywgMTZdLCBbMjQsIDEyXSwgWzE0LCA4XV0uZm9yRWFjaCgoW2MsIHJdKSA9PiBiLnB1dChcIm9cIiwgYywgcikpO1xuICAgICAgYi5tb3ZlcigxNCwgMjAsIDYsIDEsIDYsIDAsIDEuNCk7XG4gICAgICBiLnNwaWtlcygxLCAyNiwgMjEsIDI2KTtcbiAgICAgIGIudigyMiwgMjEsIDI2KTtcbiAgICAgIGIuc2F3KDI0LCAyMiwgMTIsIDAsIDIsIDEuNik7XG4gICAgICBiLnNhdyg4LCAxNywgMTIsIDMsIDAsIDEuNSkuc2F3KDE5LCA2LCAxMiwgMywgMCwgMS43LCAyKTtcbiAgICAgIGIuc3RhcnQoMTMuNSwgMi42KS5nb2FsKDI1LjYsIDI1LjYpO1xuICAgICAgYi5nZW0oMTQsIDYpLmdlbSg1LCAxNykuZ2VtKDI0LCAxNyk7XG4gICAgfVxuICB9LFxuICB7IC8vIFNhd21pbGw6IHRocmVlIHNoZWx2ZXMsIGEgYmxhZGUgYm9iYmluZyB0aHJvdWdoIGVhY2guXG4gICAgaWQ6IFwiMi0xMlwiLFxuICAgIGJ1aWxkKGIpIHtcbiAgICAgIGIuZnJhbWUoKTtcbiAgICAgIGIuaCg4LCAxLCAxOSkuaCgxNSwgOCwgMjYpLmgoMjIsIDEsIDE5KTtcbiAgICAgIGIuc2F3KDExLCA2LCAxMiwgMCwgMywgMS40KTtcbiAgICAgIGIuc2F3KDE3LCAxMywgMTIsIDAsIDMsIDEuNCwgMik7XG4gICAgICBiLnNhdygxMCwgMjAsIDEyLCAwLCAzLCAxLjQsIDQpO1xuICAgICAgYi5zdGFydCgzLCA2LjYpLmdvYWwoMjUuNiwgMjUuNik7XG4gICAgICBiLmdlbSg2LCA2LjYpLmdlbSgyMiwgMTMuNikuZ2VtKDE0LCAyNS42KTtcbiAgICB9XG4gIH0sXG4gIHsgLy8gU2hhZnQ6IHRoZSBwYWQgdGhyb3dzIHlvdSB1cCB0aGUgaG9sZSBpbiB0aGUgc2xhYjsgYSBzYXcgc3dlZXBzIGFjcm9zcyBpdC5cbiAgICBpZDogXCIyLTEzXCIsXG4gICAgYnVpbGQoYikge1xuICAgICAgYi5mcmFtZSgpO1xuICAgICAgYi5oKDE1LCAxLCA5KS5oKDE1LCAxNSwgMjYpO1xuICAgICAgYi5zYXcoMTIsIDE1LCAxMiwgMi41LCAwLCAxLjUpO1xuICAgICAgYi5wdXQoXCJBXCIsIDExLCAyNikucHV0KFwiQVwiLCAxMiwgMjYpLnB1dChcIkFcIiwgMTMsIDI2KTtcbiAgICAgIGIuc3RhcnQoMywgMjUuNikuZ29hbCgyNS42LCAxMy42KTtcbiAgICAgIGIuZ2VtKDcsIDI1LjYpLmdlbSg1LCAxMy42KS5nZW0oMjAsIDI1LjYpO1xuICAgIH1cbiAgfSxcbiAgeyAvLyBTaHV0dGVyOiBwZWdzIHNwaWxsIGludG8gdGhlIGN1cCwgYnV0IGEgc2xpZGluZyBwbGF0ZSBjb3ZlcnMgaXRzIG1vdXRoLlxuICAgIGlkOiBcIjItMTRcIixcbiAgICBidWlsZChiKSB7XG4gICAgICBiLmZyYW1lKCk7XG4gICAgICBiLmgoNCwgMSwgNik7XG4gICAgICBbWzksIFs1LCAxMCwgMTUsIDIwLCAyNV1dLCBbMTMsIFszLCA4LCAxMywgMTgsIDIzXV0sIFsxNywgWzUsIDEwLCAxNSwgMjAsIDI1XV1dXG4gICAgICAgIC5mb3JFYWNoKChbciwgY29sc10pID0+IGNvbHMuZm9yRWFjaCgoYykgPT4gYi5wdXQoXCJvXCIsIGMsIHIpKSk7XG4gICAgICBiLnYoMTgsIDIzLCAyNikudigyMywgMjMsIDI2KTtcbiAgICAgIGIuc3Bpa2VzKDEsIDI2LCAxNywgMjYpO1xuICAgICAgYi5tb3ZlcigyMC41LCAyMiwgNSwgMSwgMywgMCwgMS4xKTtcbiAgICAgIGIuc3RhcnQoMywgMi42KS5nb2FsKDIwLjUsIDI1LjYpO1xuICAgICAgYi5nZW0oMTQsIDcpLmdlbSg4LCAxNSkuZ2VtKDIwLCAxOSk7XG4gICAgfVxuICB9LFxuICB7IC8vIFRyaXBsZSB0aHJvdzogYWNyb3NzLCB1cCwgYW5kIGJhY2sgb3ZlciB0aGUgc2F3cy5cbiAgICBpZDogXCIyLTE1XCIsXG4gICAgYnVpbGQoYikge1xuICAgICAgYi5mcmFtZSgpO1xuICAgICAgYi5ib3goMSwgMjIsIDgsIDI2KS5ib3goMTYsIDIyLCAyNiwgMjYpO1xuICAgICAgYi5zcGlrZXMoOSwgMjYsIDE1LCAyNik7XG4gICAgICBiLmgoMTQsIDE3LCAyMSkuaCgxNCwgMjUsIDI2KTtcbiAgICAgIGIuYm94KDEsIDE0LCA5LCAxNSk7XG4gICAgICBiLnB1dChcIj5cIiwgNywgMjEpLnB1dChcIj5cIiwgOCwgMjEpO1xuICAgICAgYi5wdXQoXCJBXCIsIDIyLCAyMSkucHV0KFwiQVwiLCAyMywgMjEpLnB1dChcIkFcIiwgMjQsIDIxKTtcbiAgICAgIGIucHV0KFwiPFwiLCAxNywgMTMpLnB1dChcIjxcIiwgMTgsIDEzKTtcbiAgICAgIGIuc2F3KDEyLCAyMSwgMTQsIDAsIDMsIDIuMik7XG4gICAgICBiLnNhdygxMywgMTEsIDE0LCAwLCAzLCAyLjIsIDIpO1xuICAgICAgYi5zYXcoMjEsIDcsIDEyLCAzLCAwLCAxLjgpO1xuICAgICAgYi5zdGFydCgzLCAyMC42KS5nb2FsKDEuNCwgMTIuNik7XG4gICAgICBiLmdlbSg1LCAyMC42KS5nZW0oMjAsIDIwKS5nZW0oNSwgMTIuNik7XG4gICAgfVxuICB9LFxuICB7IC8vIExpZnQ6IHN0ZXAgb24gYXQgdGhlIGJvdHRvbSwgcmlkZSB1cCB0aGUgc2hhZnQsIHN0ZXAgb2ZmIG9udG8gdGhlIGhpZ2ggc2hlbGYuXG4gICAgaWQ6IFwiMi0xNlwiLFxuICAgIGJ1aWxkKGIpIHtcbiAgICAgIGIuZnJhbWUoKTtcbiAgICAgIGIuYm94KDEsIDEsIDI2LCA0KTtcbiAgICAgIGIuYm94KDEsIDIyLCA4LCAyNikudig4LCA1LCAxOCk7XG4gICAgICBiLmJveCgxMiwgMTAsIDI2LCAyNik7XG4gICAgICBiLnNwaWtlcyg5LCA1LCAxMSwgNSkuc3Bpa2VzKDksIDI2LCAxMSwgMjYpO1xuICAgICAgYi5tb3ZlcigxMCwgMTYsIDMsIDEsIDAsIDYsIDEuMCk7XG4gICAgICBiLnN0YXJ0KDMsIDIwLjYpLmdvYWwoMjUuNiwgOC42KTtcbiAgICAgIGIuZ2VtKDUsIDIwLjYpLmdlbSgxMCwgMTQpLmdlbSgyMCwgOC42KTtcbiAgICB9XG4gIH0sXG4gIHsgLy8gU3Vuc2V0IHJ1bjogaG9wLCBmZXJyeSwgcm9ja2V0IHVwLCB0aGVuIHRocmVhZCB0aGUgYnVtcGVycyBob21lLlxuICAgIGlkOiBcIjItMTdcIixcbiAgICBidWlsZChiKSB7XG4gICAgICBiLmZyYW1lKCk7XG4gICAgICBiLmJveCgxLCAyMiwgNiwgMjYpLmJveCgxMSwgMjIsIDE2LCAyNikuYm94KDIzLCAyMiwgMjYsIDI2KTtcbiAgICAgIGIuc3Bpa2VzKDcsIDI2LCAxMCwgMjYpLnNwaWtlcygxNywgMjYsIDIyLCAyNik7XG4gICAgICBiLmgoMTUsIDEsIDIxKS5oKDE1LCAyNiwgMjYpO1xuICAgICAgYi5zcGlrZXMoMSwgMTYsIDIxLCAxNik7XG4gICAgICBiLnB1dChcIj5cIiwgNSwgMjEpLnB1dChcIj5cIiwgNiwgMjEpO1xuICAgICAgYi5wdXQoXCJBXCIsIDIzLCAyMSkucHV0KFwiQVwiLCAyNCwgMjEpLnB1dChcIkFcIiwgMjUsIDIxKTtcbiAgICAgIGIubW92ZXIoMTkuNSwgMjIsIDMsIDEsIDEuNSwgMCwgMS4yLCAxLjU3KTtcbiAgICAgIGIuc2F3KDguNSwgMjAsIDEyLCAwLCAyLCAxLjcpO1xuICAgICAgYi5zYXcoMTkuNSwgMTksIDEyLCAwLCAyLCAxLjMsIDEpO1xuICAgICAgYi5wdXQoXCJPXCIsIDE0LCAxMikucHV0KFwiT1wiLCA4LCAxMSkucHV0KFwib1wiLCAxOCwgMTIpLnB1dChcIm9cIiwgMTEsIDEzKTtcbiAgICAgIGIuc2F3KDQsIDExLCAxMiwgMCwgMiwgMS41LCAyKTtcbiAgICAgIGIuc3RhcnQoMywgMjAuNikuZ29hbCgxLjQsIDEzLjYpO1xuICAgICAgYi5nZW0oMTQsIDIwLjYpLmdlbSgyNC41LCAyMC42KS5nZW0oMjAsIDgpO1xuICAgIH1cbiAgfSxcbiAgeyAvLyBGZXJyeSBhbmQgbGlmdDogYWNyb3NzIHRoZSBwaXQgb24gdGhlIHNodXR0bGUsIHRoZW4gdXAgdGhlIHNoYWZ0LlxuICAgIGlkOiBcIjItMThcIixcbiAgICBidWlsZChiKSB7XG4gICAgICBiLmZyYW1lKCk7XG4gICAgICBiLmJveCgxLCAxLCAyNiwgNik7XG4gICAgICBiLmJveCg3LCA3LCAxNCwgMTcpO1xuICAgICAgYi5zcGlrZXMoNywgMTgsIDE0LCAxOCkuc3Bpa2VzKDcsIDI2LCAxNCwgMjYpO1xuICAgICAgYi5ib3goMSwgMjIsIDYsIDI2KS5ib3goMTUsIDIyLCAxOSwgMjYpLnYoMTksIDcsIDE4KTtcbiAgICAgIGIuYm94KDIzLCAxMCwgMjYsIDI2KTtcbiAgICAgIGIuc3Bpa2VzKDIwLCAyNiwgMjIsIDI2KTtcbiAgICAgIGIubW92ZXIoMTAuNSwgMjIsIDMsIDEsIDIuNSwgMCwgMS4wKTtcbiAgICAgIGIubW92ZXIoMjEsIDE2LCAzLCAxLCAwLCA2LCAxLjApO1xuICAgICAgYi5zdGFydCgzLCAyMC42KS5nb2FsKDI1LjYsIDguNik7XG4gICAgICBiLmdlbSg0LCAyMC42KS5nZW0oMTcsIDIwLjYpLmdlbSgyNC41LCA4LjYpO1xuICAgIH1cbiAgfSxcbiAgeyAvLyBVcGRyYWZ0OiB0d28gY2hpbW5leXMsIHRocmVlIGZsb29ycy4gVGltZSB0aGUgc2F3IG92ZXIgdGhlIGZpcnN0IGhvbGUgYW5kIHRoZSBvbmUgYm9iYmluZyBhYm92ZSBpdC5cbiAgICBpZDogXCIyLTE5XCIsXG4gICAgYnVpbGQoYikge1xuICAgICAgYi5mcmFtZSgpO1xuICAgICAgYi5oKDE5LCAxLCAyMCkuaCgxOSwgMjYsIDI2KTtcbiAgICAgIGIuc3Bpa2VzKDEsIDIwLCAyMCwgMjApO1xuICAgICAgYi5oKDEyLCA1LCAyNik7XG4gICAgICBiLnNwaWtlcyg1LCAxMywgMjYsIDEzKTtcbiAgICAgIGIucHV0KFwiQVwiLCAyMiwgMjYpLnB1dChcIkFcIiwgMjMsIDI2KS5wdXQoXCJBXCIsIDI0LCAyNik7XG4gICAgICBiLnB1dChcIkFcIiwgMiwgMTgpLnB1dChcIkFcIiwgMywgMTgpO1xuICAgICAgYi5zYXcoMjMsIDE5LCAxMiwgMiwgMCwgMS40KTtcbiAgICAgIGIuc2F3KDEyLCAxNiwgMTIsIDAsIDIsIDEuNCwgMik7XG4gICAgICBiLnNhdygxNCwgOCwgMTIsIDAsIDIsIDEuNiwgNCk7XG4gICAgICBiLnN0YXJ0KDMsIDI1LjYpLmdvYWwoMjUuNiwgMTAuNik7XG4gICAgICBiLmdlbSgxMCwgMjUuNikuZ2VtKDE0LCAxNy42KS5nZW0oMjAsIDEwLjYpO1xuICAgIH1cbiAgfSxcbiAgeyAvLyBDaGltbmV5czogZmFsbCB0aHJvdWdoIHRoZSBnYXAgaW4gZWFjaCBzaGVsZiB3aGlsZSB0aGUgYmxhZGUgc3dlZXBzIGl0LlxuICAgIGlkOiBcIjItMjBcIixcbiAgICBidWlsZChiKSB7XG4gICAgICBiLmZyYW1lKCk7XG4gICAgICBiLmgoNywgMSwgMjIpLmgoMTMsIDUsIDI2KS5oKDE5LCAxLCAyMik7XG4gICAgICBiLnNhdygyNC41LCAxMCwgMTIsIDEuNSwgMCwgMS44KTtcbiAgICAgIGIuc2F3KDIuNSwgMTYsIDEyLCAxLjUsIDAsIDEuOCwgMik7XG4gICAgICBiLnNhdygyNC41LCAyMiwgMTIsIDEuNSwgMCwgMS44LCA0KTtcbiAgICAgIGIuc3RhcnQoMywgNS42KS5nb2FsKDI1LjYsIDI1LjYpO1xuICAgICAgYi5nZW0oMTQsIDUuNikuZ2VtKDE0LCAxMS42KS5nZW0oMTQsIDE3LjYpO1xuICAgIH1cbiAgfSxcbl07XG4iLCAiLy8gV29ybGQgMyBcdTIwMTQgXCJJY2VcIjogbG9ja3MgYW5kIG9uZS13YXkgcm91dGVzIChzZWUgZG9jcy9MRVZFTC1BVVRIT1JJTkcubWQpLlxuZXhwb3J0IGNvbnN0IFdPUkxEMyA9IFtcbiAgeyAvLyBLZXkgYW5kIGRvb3I6IHRoZSBmbG9vciBvbiB0aGUgcmlnaHQgaXMgYSBkb29yOyBncmFiIHRoZSBrZXkgYW5kIGl0IG9wZW5zLlxuICAgIGlkOiBcIjMtMVwiLCB0dXQ6IFwia2V5XCIsXG4gICAgYnVpbGQoYikge1xuICAgICAgYi5mcmFtZSgpO1xuICAgICAgYi5oKDE0LCAxLCAxNSk7XG4gICAgICBiLmRvb3IoMTYsIDE0LCAyNiwgMTQpO1xuICAgICAgYi5rZXkoMjEsIDEyLjYpO1xuICAgICAgYi5zdGFydCg0LCAxMi42KS5nb2FsKDI1LjYsIDI1LjYpO1xuICAgICAgYi5nZW0oOCwgMTIuNikuZ2VtKDEzLCAxMi42KS5nZW0oMTQsIDI1LjYpO1xuICAgIH1cbiAgfSxcbiAgeyAvLyBUaGUga2V5IGhpZGVzIGluIHRoZSBjZWlsaW5nIGNvcm5lcjsgdGhlIGRvb3Igc2VhbHMgdGhlIG9ubHkgd2F5IGFjcm9zcy5cbiAgICBpZDogXCIzLTJcIixcbiAgICBidWlsZChiKSB7XG4gICAgICBiLmZyYW1lKCk7XG4gICAgICBiLnYoMTQsIDEsIDE5KTtcbiAgICAgIGIuZG9vcigxNCwgMjAsIDE0LCAyNik7XG4gICAgICBiLmtleSgxLjQsIDEuNCk7XG4gICAgICBiLnN0YXJ0KDQsIDI1LjYpLmdvYWwoMjUuNiwgMjUuNik7XG4gICAgICBiLmdlbSg4LCAyNS42KS5nZW0oOCwgMS40KS5nZW0oMjAsIDI1LjYpO1xuICAgIH1cbiAgfSxcbiAgeyAvLyBHYXRlOiB0aGUgZG9vcndheSBsZXRzIHRoZSBiYWxsIGludG8gdGhlIGNoYW1iZXIsIG5ldmVyIGJhY2sgb3V0LlxuICAgIGlkOiBcIjMtM1wiLCB0dXQ6IFwiZ2F0ZVwiLFxuICAgIGJ1aWxkKGIpIHtcbiAgICAgIGIuZnJhbWUoKTtcbiAgICAgIGIuaCgxNywgMSwgMTcpO1xuICAgICAgYi5oKDgsIDE4LCAyNikudigxOCwgOSwgMTIpLmdhdGUoMTgsIDEzLCAxOCwgMTYsIFwiUlwiKS52KDE4LCAxNywgMjApLmgoMjAsIDE5LCAyNik7XG4gICAgICBiLnN0YXJ0KDQsIDE1LjYpLmdvYWwoMjUuNiwgMTguNik7XG4gICAgICBiLmdlbSg5LCAxNS42KS5nZW0oMTQsIDE1LjYpLmdlbSgyMiwgOS40KTtcbiAgICB9XG4gIH0sXG4gIHsgLy8gT25lLXdheSBkcm9wOiBnbyBvdmVyIHRoZSB0b3AsIGNvbWUgZG93biB0aHJvdWdoIHRoZSBnYXRlLCBubyB3YXkgYmFjayB1cC5cbiAgICBpZDogXCIzLTRcIixcbiAgICBidWlsZChiKSB7XG4gICAgICBiLmZyYW1lKCk7XG4gICAgICBiLmgoOSwgMSwgOSkuZ2F0ZSgxMCwgOSwgMTYsIDksIFwiRFwiKS5oKDksIDE3LCAyNik7XG4gICAgICBiLmgoMTgsIDEsIDE4KTtcbiAgICAgIGIuc3RhcnQoNCwgNy42KS5nb2FsKDI1LjYsIDI1LjYpO1xuICAgICAgYi5nZW0oNywgNy42KS5nZW0oMjIsIDcuNikuZ2VtKDEwLCAyNS42KTtcbiAgICB9XG4gIH0sXG4gIHsgLy8gR2F0ZSBpbiwga2V5IGluIHRoZSBjZWlsaW5nIGNvcm5lciBvZiB0aGUgbWlkZGxlIHJvb20sIGRvb3IgaW4gdGhlIHNlY29uZCB3YWxsLlxuICAgIGlkOiBcIjMtNVwiLFxuICAgIGJ1aWxkKGIpIHtcbiAgICAgIGIuZnJhbWUoKTtcbiAgICAgIGIudig5LCAxLCAyMikuZ2F0ZSg5LCAyMywgOSwgMjYsIFwiUlwiKTtcbiAgICAgIGIudigxOCwgMSwgMTkpLmRvb3IoMTgsIDIwLCAxOCwgMjYpO1xuICAgICAgYi5rZXkoMTAuNCwgMS40KTtcbiAgICAgIGIuc3RhcnQoMywgMjUuNikuZ29hbCgyNS42LCAyNS42KTtcbiAgICAgIGIuZ2VtKDYuNSwgMjUuNikuZ2VtKDE0LCAyNS42KS5nZW0oMjIsIDI1LjYpO1xuICAgIH1cbiAgfSxcbiAgeyAvLyBPdmVyIHRoZSBzcGlrZXMgb24gdGhlIGNlaWxpbmcgdG8gdGhlIGtleSwgYmFjayBkb3duIG9udG8gdGhlIGxhbmRpbmcgc3RyaXAsIHRocm91Z2ggdGhlIGRvb3IuXG4gICAgaWQ6IFwiMy02XCIsXG4gICAgYnVpbGQoYikge1xuICAgICAgYi5mcmFtZSgpO1xuICAgICAgYi5ib3goOSwgOSwgMTAsIDI2KS5zcGlrZXMoMTEsIDI2LCAxNSwgMjYpO1xuICAgICAgYi5ib3goMjEsIDEsIDIyLCAxOCkuZG9vcigyMSwgMTksIDIyLCAyNik7XG4gICAgICBiLmtleSgxNCwgMS40KTtcbiAgICAgIGIuc3RhcnQoMywgMjUuNikuZ29hbCgyNS42LCAyNS42KTtcbiAgICAgIGIuZ2VtKDUsIDEuNCkuZ2VtKDE4LCAyNS42KS5nZW0oMS40LCAxMyk7XG4gICAgfVxuICB9LFxuICB7IC8vIFJhdGNoZXQ6IGVhY2ggc2hlbGYgaGFzIG9uZSB3YXkgZG93biwgYSBvbmUtd2F5IGdhdGUuIENvbGxlY3QgYmVmb3JlIHlvdSBkcm9wLlxuICAgIGlkOiBcIjMtN1wiLFxuICAgIGJ1aWxkKGIpIHtcbiAgICAgIGIuZnJhbWUoKTtcbiAgICAgIGIuaCg4LCAxLCAxOSkuZ2F0ZSgyMCwgOCwgMjYsIDgsIFwiRFwiKTtcbiAgICAgIGIuZ2F0ZSgxLCAxNSwgNywgMTUsIFwiRFwiKS5oKDE1LCA4LCAyNik7XG4gICAgICBiLmgoMjIsIDEsIDE5KS5nYXRlKDIwLCAyMiwgMjYsIDIyLCBcIkRcIik7XG4gICAgICBiLnN0YXJ0KDMsIDYuNikuZ29hbCgxLjQsIDI1LjYpO1xuICAgICAgYi5nZW0oMTIsIDYuNikuZ2VtKDE4LCAxMy42KS5nZW0oOCwgMjAuNik7XG4gICAgfVxuICB9LFxuICB7IC8vIEVsZXZhdG9yOiB0aGUgcGFkIHRocm93cyB5b3UgdXAgdGhyb3VnaCBhIG9uZS13YXkgaGF0Y2guIE5vIGNvbWluZyBiYWNrIGRvd24uXG4gICAgaWQ6IFwiMy04XCIsXG4gICAgYnVpbGQoYikge1xuICAgICAgYi5mcmFtZSgpO1xuICAgICAgYi5oKDEyLCAxLCA0KS5nYXRlKDUsIDEyLCA4LCAxMiwgXCJVXCIpLmgoMTIsIDksIDI2KTtcbiAgICAgIGIucHV0KFwiQVwiLCA2LCAyNik7XG4gICAgICBiLnN0YXJ0KDMsIDI1LjYpLmdvYWwoMjUuNiwgMTAuNik7XG4gICAgICBiLmdlbSgxNCwgMjUuNikuZ2VtKDE0LCAxMC42KS5nZW0oMjUuNiwgMS40KTtcbiAgICB9XG4gIH0sXG4gIHsgLy8gSmFpbDogdGhlIGdhdGUgbGV0cyB5b3UgaW50byB0aGUgY2VsbCwgdGhlIGtleSBpbiB0aGUgY2VsbCB1bmxvY2tzIHRoZSBmbG9vciB1bmRlciBpdC5cbiAgICBpZDogXCIzLTlcIixcbiAgICBidWlsZChiKSB7XG4gICAgICBiLmZyYW1lKCk7XG4gICAgICBiLmgoMTcsIDEsIDEyKTtcbiAgICAgIGIuaCgxMCwgMTMsIDIyKS52KDEzLCAxMSwgMTMpLmdhdGUoMTMsIDE0LCAxMywgMTYsIFwiUlwiKS52KDEzLCAxNywgMTgpLnYoMjIsIDExLCAxOCk7XG4gICAgICBiLmgoMTgsIDEzLCAxNSkuZG9vcigxNiwgMTgsIDE5LCAxOCkuaCgxOCwgMjAsIDIyKTtcbiAgICAgIGIua2V5KDE4LCAxNi42KTtcbiAgICAgIGIuc3RhcnQoNCwgMTUuNikuZ29hbCgyNS42LCAyNS42KTtcbiAgICAgIGIuZ2VtKDgsIDE1LjYpLmdlbSgxNSwgMTYuNikuZ2VtKDEwLCAyNS42KTtcbiAgICB9XG4gIH0sXG4gIHsgLy8gVHdvIGtleXM6IG9uZSBpbiB0aGUgbGVmdCBjZWlsaW5nIGNvcm5lciwgb25lIG92ZXIgdGhlIHdhbGw7IHRoZSBkb29yIGlzIHRoZSByb29mIG9mIHRoZSBnb2FsIHBvY2tldC5cbiAgICBpZDogXCIzLTEwXCIsXG4gICAgYnVpbGQoYikge1xuICAgICAgYi5mcmFtZSgpO1xuICAgICAgYi5ib3goMTQsIDgsIDE1LCAyNik7XG4gICAgICBiLnYoMTYsIDIyLCAyNikuYm94KDE3LCAyMSwgMjYsIDIyKTtcbiAgICAgIGIuZG9vcigxNywgMjEsIDI2LCAyMik7XG4gICAgICBiLmtleSgxLjQsIDEuNCkua2V5KDI1LjYsIDEuNCk7XG4gICAgICBiLnN0YXJ0KDQsIDI1LjYpLmdvYWwoMjUuNiwgMjUuNik7XG4gICAgICBiLmdlbSg4LCAyNS42KS5nZW0oMTQuNSwgMS40KS5nZW0oMjEsIDE5LjYpO1xuICAgIH1cbiAgfSxcbiAgeyAvLyBTYXcgcGF0cm9sOiBjcm9zcyB0byB0aGUga2V5IGFuZCBjb21lIGJhY2sgcGFzdCB0aGUgc2F3IHRvIGRyb3AgdGhyb3VnaCB0aGUgZmxvb3IgZG9vci5cbiAgICBpZDogXCIzLTExXCIsXG4gICAgYnVpbGQoYikge1xuICAgICAgYi5mcmFtZSgpO1xuICAgICAgYi5kb29yKDEsIDEyLCA4LCAxMikuaCgxMiwgOSwgMjYpO1xuICAgICAgYi5zYXcoMTUsIDYsIDEyLCAwLCA1LCAxLjYpO1xuICAgICAgYi5rZXkoMjQsIDEwLjYpO1xuICAgICAgYi5zdGFydCg0LCAxMC42KS5nb2FsKDEuNCwgMjUuNik7XG4gICAgICBiLmdlbSgxMSwgMTAuNikuZ2VtKDIwLCAxLjQpLmdlbSg4LCAyNS42KTtcbiAgICB9XG4gIH0sXG4gIHsgLy8gUGluYmFsbDogYnVtcGVycyBzaGFrZSB5b3UgZG93biBwYXN0IHRoZSBzcGlrZXMsIHRoZSBnYXRlIGxldHMgeW91IHRocm91Z2gsIHRoZSBrZXkgaXMgaW4gdGhlIGZhciBjZWlsaW5nIGNvcm5lciBhbmQgdGhlIGdvYWwgcG9ja2V0IGlzIHNlYWxlZC5cbiAgICBpZDogXCIzLTEyXCIsXG4gICAgYnVpbGQoYikge1xuICAgICAgYi5mcmFtZSgpO1xuICAgICAgYi52KDE0LCAxLCAyMCkuZ2F0ZSgxNCwgMjEsIDE0LCAyNSwgXCJSXCIpO1xuICAgICAgYi52KDE5LCAyMiwgMjYpLmJveCgyMCwgMjEsIDI2LCAyMSkuZG9vcigyMCwgMjEsIDI2LCAyMSk7XG4gICAgICBiLmtleSgyNS42LCAxLjQpO1xuICAgICAgW1s0LCA3XSwgWzksIDddLCBbNi41LCAxMV0sIFsxMS41LCAxMV0sIFs0LCAxNV0sIFs5LCAxNV0sIFs2LjUsIDE5XSwgWzExLjUsIDE5XV0uZm9yRWFjaCgoW2MsIHJdKSA9PiBiLnB1dChcIk9cIiwgYywgcikpO1xuICAgICAgYi5zcGlrZXMoMSwgMjYsIDcsIDI2KTtcbiAgICAgIGIuc3RhcnQoNywgMi42KS5nb2FsKDI1LjYsIDI1LjYpO1xuICAgICAgYi5nZW0oOCwgOSkuZ2VtKDEyLCAyNS42KS5nZW0oMTcsIDI1LjYpO1xuICAgIH1cbiAgfSxcbiAgeyAvLyBMaWZ0OiByaWRlIHRoZSBtb3ZpbmcgcGxhdGZvcm0gdXAgdG8gdGhlIGtleSBsZWRnZSwgdGhlbiBiYWNrIGRvd24gdG8gdGhlIGRvb3IuXG4gICAgaWQ6IFwiMy0xM1wiLFxuICAgIGJ1aWxkKGIpIHtcbiAgICAgIGIuZnJhbWUoKTtcbiAgICAgIGIuaCgxMiwgMSwgOSk7XG4gICAgICBiLm1vdmVyKDEzLCAxOC41LCA0LCAxLCAwLCA2LCAxLjIpO1xuICAgICAgYi5ib3goMTcsIDEsIDE4LCAxOCkuZG9vcigxNywgMTksIDE4LCAyNik7XG4gICAgICBiLmtleSg0LCAxMC42KTtcbiAgICAgIGIuc3RhcnQoMywgMjUuNikuZ29hbCgyNS42LCAyNS42KTtcbiAgICAgIGIuZ2VtKDgsIDEwLjYpLmdlbSgxMywgMjUuNikuZ2VtKDIyLCAyNS42KTtcbiAgICB9XG4gIH0sXG4gIHsgLy8gRWxldmF0b3IgdG8gdGhlIGtleTogcGFkIHVwIHRocm91Z2ggdGhlIG9wZW5pbmcsIGxhbmQgb24gdGhlIGxlZGdlLCBkb29yIHNodXRzIG9mZiB0aGUgZ29hbC5cbiAgICBpZDogXCIzLTE0XCIsXG4gICAgYnVpbGQoYikge1xuICAgICAgYi5mcmFtZSgpO1xuICAgICAgYi5oKDEyLCAxLCAxMik7XG4gICAgICBiLnB1dChcIkFcIiwgMTgsIDI2KTtcbiAgICAgIGIuYm94KDIxLCAxLCAyMiwgMTgpLmRvb3IoMjEsIDE5LCAyMiwgMjYpO1xuICAgICAgYi5rZXkoNiwgMTAuNik7XG4gICAgICBiLnN0YXJ0KDMsIDI1LjYpLmdvYWwoMjUuNiwgMjUuNik7XG4gICAgICBiLmdlbSg4LCAxMC42KS5nZW0oMTAsIDI1LjYpLmdlbSgyNS42LCAxMCk7XG4gICAgfVxuICB9LFxuICB7IC8vIFdyb25nLXdheSBnYXRlOiB0aGUgc2hvcnQgd2F5IGFjcm9zcyBvbmx5IG9wZW5zIGxlZnR3YXJkcy4gR28gdW5kZXIsIHVwIHRocm91Z2ggdGhlIGdhcCwgb250byB0aGUgZmFyIHNoZWxmLlxuICAgIGlkOiBcIjMtMTVcIixcbiAgICBidWlsZChiKSB7XG4gICAgICBiLmZyYW1lKCk7XG4gICAgICBiLmgoMTAsIDEsIDkpLmgoMTAsIDE5LCAyNik7XG4gICAgICBiLnYoMTQsIDEsIDYpLmdhdGUoMTQsIDcsIDE0LCA5LCBcIkxcIikudigxNCwgMTAsIDIxKTtcbiAgICAgIGIuc3RhcnQoNCwgOC42KS5nb2FsKDI1LjYsIDguNik7XG4gICAgICBiLmdlbSg2LCA4LjYpLmdlbSgyMCwgMjUuNikuZ2VtKDIyLCA4LjYpO1xuICAgIH1cbiAgfSxcbiAgeyAvLyBaaWd6YWcgd2l0aCB0d28ga2V5cyBhbmQgYSBzYXcgc3dlZXBpbmcgdGhlIG1pZGRsZSBzaGVsZjsgdGhlIGxhc3QgZ2FwIGlzIGEgZG9vci5cbiAgICBpZDogXCIzLTE2XCIsXG4gICAgYnVpbGQoYikge1xuICAgICAgYi5mcmFtZSgpO1xuICAgICAgYi5oKDgsIDEsIDIyKS5oKDE1LCA1LCAyNikuaCgyMiwgMSwgMjIpLmRvb3IoMjMsIDIyLCAyNiwgMjIpO1xuICAgICAgYi5zcGlrZXMoMSwgMjYsIDE5LCAyNik7XG4gICAgICBiLnNhdygxNCwgMTEsIDEyLCAwLCAzLCAxLjUpO1xuICAgICAgYi5rZXkoMjQsIDEzLjYpLmtleSgzLCAyMC42KTtcbiAgICAgIGIuc3RhcnQoMywgNi42KS5nb2FsKDI1LjYsIDI1LjYpO1xuICAgICAgYi5nZW0oMTQsIDYuNikuZ2VtKDgsIDEzLjYpLmdlbSgxNCwgMjAuNik7XG4gICAgfVxuICB9LFxuICB7IC8vIEFsY292ZTogdGhlIGdhdGUgbGV0cyB5b3UgaW4gZm9yIHRoZSBrZXksIHRoZSBhbGNvdmUgZHJvcHMgeW91IG91dCBiZWxvdyB0aGUgZG9vciwgYW5kIGEgc2F3IGd1YXJkcyB0aGUgd2F5IHRvIHRoZSBnb2FsLlxuICAgIGlkOiBcIjMtMTdcIixcbiAgICBidWlsZChiKSB7XG4gICAgICBiLmZyYW1lKCk7XG4gICAgICBiLmgoMTAsIDEsIDE0KTtcbiAgICAgIGIudigxNSwgMywgNikuZ2F0ZSgxNSwgNywgMTUsIDksIFwiUlwiKS5oKDMsIDE1LCAyNikuaCgxMCwgMTUsIDE5KTtcbiAgICAgIGIuYm94KDEyLCAxMSwgMTMsIDE4KS5kb29yKDEyLCAxOSwgMTMsIDI2KTtcbiAgICAgIGIua2V5KDE3LjUsIDguNik7XG4gICAgICBiLnNhdyg2LCAyMy41LCAxMiwgMCwgMi41LCAxLjYpO1xuICAgICAgYi5zdGFydCg0LCA4LjYpLmdvYWwoMS40LCAyNS42KTtcbiAgICAgIGIuZ2VtKDgsIDguNikuZ2VtKDIyLCAyNS42KS5nZW0oNiwgMjUuNik7XG4gICAgfVxuICB9LFxuICB7IC8vIFJpbmcgcm9hZDogdGhlIGdhdGVzIG9ubHkgdHVybiBvbmUgd2F5LCBzbyB5b3UgbXVzdCB0YWtlIHRoZSBsb25nIHdheSByb3VuZCBmb3IgYm90aCBrZXlzLlxuICAgIGlkOiBcIjMtMThcIixcbiAgICBidWlsZChiKSB7XG4gICAgICBiLmZyYW1lKCk7XG4gICAgICBiLmgoNywgOCwgMTEpLmRvb3IoMTIsIDcsIDE1LCA3KS5oKDcsIDE2LCAxOSkudig4LCA4LCAxOSkudigxOSwgOCwgMTkpLmgoMjAsIDgsIDE5KTtcbiAgICAgIGIuZ2F0ZSgxNCwgMjEsIDE0LCAyNiwgXCJSXCIpLmdhdGUoMjEsIDEsIDIxLCA2LCBcIkxcIik7XG4gICAgICBiLnNhdygxMCwgMjMuNSwgMTIsIDAsIDIuNSwgMS43KS5zYXcoMTcsIDMuNSwgMTIsIDAsIDIuNSwgMS40KTtcbiAgICAgIGIua2V5KDMsIDI1LjYpLmtleSgyNS42LCAxLjQpO1xuICAgICAgYi5zdGFydCg0LCAzLjYpLmdvYWwoOS40LCAxOC42KTtcbiAgICAgIGIuZ2VtKDQsIDEyKS5nZW0oMjIsIDI1LjYpLmdlbSgxMy41LCAxLjQpO1xuICAgIH1cbiAgfSxcbiAgeyAvLyBGZXJyeTogcmlkZSB0aGUgcGxhdGZvcm0gb3ZlciB0aGUgc3Bpa2UgcGl0IHRvIHRoZSBzZWNvbmQga2V5LCB0aGVuIHVwIHRocm91Z2ggdGhlIG9wZW5lZCByb29mLlxuICAgIGlkOiBcIjMtMTlcIixcbiAgICBidWlsZChiKSB7XG4gICAgICBiLmZyYW1lKCk7XG4gICAgICBiLmJveCgxLCAyNCwgNSwgMjYpLmJveCgyMSwgMjQsIDI2LCAyNik7XG4gICAgICBiLnNwaWtlcyg2LCAyNiwgMjAsIDI2KTtcbiAgICAgIGIubW92ZXIoMTMuNSwgMjQuNSwgNCwgMSwgNSwgMCwgMS4xKTtcbiAgICAgIGIuc2F3KDIzLjUsIDE3LCAxMSwgMCwgMiwgMS44KTtcbiAgICAgIGIudigxNiwgMSwgMTEpLmJveCgxNywgMTAsIDI2LCAxMSkuZG9vcigxNywgMTAsIDI2LCAxMSk7XG4gICAgICBiLmtleSgzLCAxLjQpLmtleSgyNCwgMjIuNik7XG4gICAgICBiLnN0YXJ0KDMsIDIyLjYpLmdvYWwoMjUuNiwgMS40KTtcbiAgICAgIGIuZ2VtKDMsIDEyKS5nZW0oMTIsIDE1KS5nZW0oMjQsIDE1KTtcbiAgICB9XG4gIH0sXG4gIHsgLy8gVG93ZXI6IHBhZCB1cCB0aGUgaGF0Y2gsIGZpcnN0IGtleSBhbmQgYSBzYXcgaW4gdGhlIG1pZGRsZSwgcGFkIHVwIHRoZSBzZWNvbmQgaGF0Y2gsIHNlY29uZCBrZXksIGRvb3IsIGdvYWwuXG4gICAgaWQ6IFwiMy0yMFwiLFxuICAgIGJ1aWxkKGIpIHtcbiAgICAgIGIuZnJhbWUoKTtcbiAgICAgIGIuaCgxOCwgMSwgNCkuZ2F0ZSg1LCAxOCwgNywgMTgsIFwiVVwiKS5oKDE4LCA4LCAyNik7XG4gICAgICBiLmgoOSwgMSwgMjApLmdhdGUoMjEsIDksIDIzLCA5LCBcIlVcIikuaCg5LCAyNCwgMjYpO1xuICAgICAgYi5wdXQoXCJBXCIsIDYsIDI2KS5wdXQoXCJBXCIsIDIyLCAxNyk7XG4gICAgICBiLnNhdygxNCwgMTMuNSwgMTIsIDAsIDMsIDIuMSkuc2F3KDcuNSwgNS41LCAxNCwgMCwgMywgMS45KTtcbiAgICAgIGIuYm94KDE0LCAxLCAxNSwgOCkuZG9vcigxNCwgMSwgMTUsIDgpO1xuICAgICAgYi5rZXkoMTEsIDE2LjYpLmtleSgyNSwgNy42KTtcbiAgICAgIGIuc3RhcnQoMywgMjUuNikuZ29hbCgxLjQsIDcuNik7XG4gICAgICBiLmdlbSgxOCwgMTYuNikuZ2VtKDgsIDcuNikuZ2VtKDE3LCAxLjQpO1xuICAgIH1cbiAgfSxcbl07XG4iLCAiLy8gV29ybGQgNCBcdTIwMTQgXCJGYWN0b3J5XCIuIE1hY2hpbmVzIGFuZCB0aW1pbmc6IGZhbnMgYW5kIGxhc2Vycy5cbmV4cG9ydCBjb25zdCBXT1JMRDQgPSBbXG4gIHsgLy8gRmFuIGxpZnQ6IHNwaWtlZCByb29mIGFib3ZlIHRoZSBzbGFiLCBzbyBvbmx5IHRoZSBnZW50bGUgc3RyZWFtIGxpZnRzIHlvdSBoaWdoIGVub3VnaC5cbiAgICBpZDogXCI0LTFcIiwgdHV0OiBcImZhblwiLFxuICAgIGJ1aWxkKGIpIHtcbiAgICAgIGIuZnJhbWUoKTtcbiAgICAgIGIuaCgxNCwgMSwgOSkuaCgxNCwgMTgsIDI2KTtcbiAgICAgIGIuc3Bpa2VzKDEsIDcsIDI2LCA3KTtcbiAgICAgIGIuZGlhZygxLCAxOCwgOCwgMjUpLmRpYWcoMTksIDI1LCAyNiwgMTgpO1xuICAgICAgYi5mYW4oMTAsIDE0LCAxNywgMjUsIFwiVVwiLCA5NDApO1xuICAgICAgYi5zdGFydCgxMy41LCAyNS42KS5nb2FsKDI1LjYsIDEyLjYpO1xuICAgICAgYi5nZW0oMTQsIDE5KS5nZW0oOCwgMTIuNikuZ2VtKDIyLCAxMi42KTtcbiAgICB9XG4gIH0sXG4gIHsgLy8gQ2hpbW5leTogcm9sbCBhZ2FpbnN0IHRoZSBzdG9wcGVyIGluc2lkZSB0aGUgc2hhZnQgYW5kIHJpZGUgdGhlIGRyYXVnaHQgdXAgdG8gdGhlIHNoZWxmLlxuICAgIGlkOiBcIjQtMlwiLFxuICAgIGJ1aWxkKGIpIHtcbiAgICAgIGIuZnJhbWUoKTtcbiAgICAgIGIudigxMSwgNiwgMjIpLnYoMTYsIDYsIDIyKTtcbiAgICAgIGIuYm94KDE2LCAyNCwgMTcsIDI2KTtcbiAgICAgIGIuaCg2LCAxLCAxMCk7XG4gICAgICBiLmZhbigxMiwgNiwgMTUsIDI2LCBcIlVcIiwgODMwKTtcbiAgICAgIGIuc3RhcnQoNCwgMjUuNikuZ29hbCgxLjQsIDQuNik7XG4gICAgICBiLmdlbSg4LCAyNS42KS5nZW0oMTMuNSwgMTQpLmdlbSg1LCA0LjYpO1xuICAgIH1cbiAgfSxcbiAgeyAvLyBUd28gbGlmdHM6IHJpZGUgdGhlIHJpZ2h0IGRyYXVnaHQgdXAsIGNyb3NzIG92ZXIsIHJpZGUgdGhlIGxlZnQgZHJhdWdodCB0byB0aGUgdG9wLlxuICAgIGlkOiBcIjQtM1wiLFxuICAgIGJ1aWxkKGIpIHtcbiAgICAgIGIuZnJhbWUoKTtcbiAgICAgIGIuaCgxOCwgMSwgMTgpLmgoMTAsIDksIDI2KTtcbiAgICAgIGIuZmFuKDIwLCAxOCwgMjYsIDI1LCBcIlVcIiwgOTAwKTtcbiAgICAgIGIuZmFuKDIsIDEwLCA4LCAxNywgXCJVXCIsIDkwMCk7XG4gICAgICBiLnN0YXJ0KDQsIDI1LjYpLmdvYWwoMjUuNiwgOC42KTtcbiAgICAgIGIuZ2VtKDE0LCAyNS42KS5nZW0oMTMsIDE2LjYpLmdlbSgxNCwgOC42KTtcbiAgICB9XG4gIH0sXG4gIHsgLy8gSGVhZHdpbmQ6IGNyYXdsIHVwIHRoZSB0dW5uZWwgYWdhaW5zdCB0aGUgc3RyZWFtLlxuICAgIGlkOiBcIjQtNFwiLFxuICAgIGJ1aWxkKGIpIHtcbiAgICAgIGIuZnJhbWUoKTtcbiAgICAgIGIuaCgxMCwgMSwgMjYpLmgoMTgsIDEsIDIyKTtcbiAgICAgIGIudigyMiwgMTgsIDI2KTtcbiAgICAgIGIuY2xlYXIoMjMsIDEwLCAyNiwgMTApO1xuICAgICAgYi5mYW4oMSwgMTEsIDI2LCAxNywgXCJSXCIsIDU2MCk7XG4gICAgICBiLnN0YXJ0KDI1LjYsIDE2LjYpLmdvYWwoMS40LCAxNi42KTtcbiAgICAgIGIuZ2VtKDE4LCAxNi42KS5nZW0oMTAsIDE2LjYpLmdlbSgyNC41LCAyNS42KTtcbiAgICB9XG4gIH0sXG4gIHsgLy8gTGFzZXI6IGEgbG9uZyBkYXJrIGdhcCBcdTIwMTQgZHJvcCB0aHJvdWdoIHRoZSBob2xlIHdoaWxlIHRoZSBiZWFtIGlzIG9mZi5cbiAgICBpZDogXCI0LTVcIiwgdHV0OiBcImxhc2VyXCIsXG4gICAgYnVpbGQoYikge1xuICAgICAgYi5mcmFtZSgpO1xuICAgICAgYi5oKDEyLCAxLCAxMikuaCgxMiwgMTcsIDI2KTtcbiAgICAgIGIubGFzZXIoMTMsIDEzLCAxNiwgMTMsIDMsIDEsIDEuOCk7XG4gICAgICBiLnN0YXJ0KDQsIDEwLjYpLmdvYWwoMjUuNiwgMjUuNik7XG4gICAgICBiLmdlbSg5LCAxMC42KS5nZW0oMTQuNSwgMTkpLmdlbSgyMiwgMjUuNik7XG4gICAgfVxuICB9LFxuICB7IC8vIEJlYW0gY29ycmlkb3I6IHNsaXAgcGFzdCB0aGUgZmlyc3QgYmVhbSwgd2FpdCBpbiB0aGUgcG9ja2V0LCB0aGVuIHRoZSBzZWNvbmQuXG4gICAgaWQ6IFwiNC02XCIsXG4gICAgYnVpbGQoYikge1xuICAgICAgYi5mcmFtZSgpO1xuICAgICAgYi5oKDE4LCAxLCAyMykuaCg5LCA0LCAyNik7XG4gICAgICBiLmxhc2VyKDEyLCAxOSwgMTIsIDI2LCAzLCAxLCAwKTtcbiAgICAgIGIubGFzZXIoMTQsIDEwLCAxNCwgMTcsIDMsIDEsIDEuNSk7XG4gICAgICBiLnN0YXJ0KDMsIDI1LjYpLmdvYWwoMS40LCAxNi42KTtcbiAgICAgIGIuZ2VtKDgsIDI1LjYpLmdlbSgyNC41LCAyNS42KS5nZW0oMjAsIDE2LjYpO1xuICAgIH1cbiAgfSxcbiAgeyAvLyBEcmF1Z2h0IHVuZGVyIHRoZSBiZWFtOiB0aGUgY2hpbW5leSBleGl0IGlzIGd1YXJkZWQgYnkgYSBsYXNlci5cbiAgICBpZDogXCI0LTdcIixcbiAgICBidWlsZChiKSB7XG4gICAgICBiLmZyYW1lKCk7XG4gICAgICBiLnYoMTEsIDYsIDIyKS52KDE2LCA2LCAyMik7XG4gICAgICBiLmJveCgxNiwgMjQsIDE3LCAyNik7XG4gICAgICBiLmgoNiwgMSwgMTApO1xuICAgICAgYi5mYW4oMTIsIDYsIDE1LCAyNiwgXCJVXCIsIDgzMCk7XG4gICAgICBiLmxhc2VyKDEyLCA5LCAxNSwgOSwgMy4yLCAxLjQsIDIuNik7XG4gICAgICBiLnN0YXJ0KDQsIDI1LjYpLmdvYWwoMS40LCA0LjYpO1xuICAgICAgYi5nZW0oOCwgMjUuNikuZ2VtKDEzLjUsIDE0KS5nZW0oNSwgNC42KTtcbiAgICB9XG4gIH0sXG4gIHsgLy8gS2V5IGxpZnQ6IGZldGNoIHRoZSBrZXkgZnJvbSB0aGUgZmxvb3IsIHRoZW4gcmlkZSB1cCB0byB0aGUgc2VhbGVkIHZhdWx0LlxuICAgIGlkOiBcIjQtOFwiLFxuICAgIGJ1aWxkKGIpIHtcbiAgICAgIGIuZnJhbWUoKTtcbiAgICAgIGIuaCgxNCwgMSwgMTEpLmgoMTQsIDE2LCAyNik7XG4gICAgICBiLmZhbigxMiwgMTQsIDE1LCAyNSwgXCJVXCIsIDkwMCk7XG4gICAgICBiLmRvb3IoMjAsIDEsIDIwLCAxMyk7XG4gICAgICBiLmtleSgyNCwgMjUuNik7XG4gICAgICBiLnN0YXJ0KDQsIDI1LjYpLmdvYWwoMjUuNiwgMTIuNik7XG4gICAgICBiLmdlbSg4LCAyNS42KS5nZW0oMTMuNSwgMTgpLmdlbSg0LCAxMi42KTtcbiAgICB9XG4gIH0sXG4gIHsgLy8gU2F3IGluIHRoZSBzaGFmdDogdGhlIGRyYXVnaHQgY2FycmllcyB5b3UgdXAsIHRoZSBibGFkZSBzd2VlcHMgYWNyb3NzIFx1MjAxNCBwaWNrIHlvdXIgbW9tZW50LlxuICAgIGlkOiBcIjQtOVwiLFxuICAgIGJ1aWxkKGIpIHtcbiAgICAgIGIuZnJhbWUoKTtcbiAgICAgIGIudigxMCwgNiwgMjIpLnYoMTksIDYsIDIyKTtcbiAgICAgIGIuYm94KDE5LCAyNCwgMjAsIDI2KTtcbiAgICAgIGIuaCg2LCAxLCA5KTtcbiAgICAgIGIuZmFuKDExLCA2LCAxOCwgMjYsIFwiVVwiLCA4MzApO1xuICAgICAgYi5zYXcoMTQuNSwgMTUsIDEyLCAyLjYsIDAsIDEuNywgMCk7XG4gICAgICBiLnN0YXJ0KDQsIDI1LjYpLmdvYWwoMS40LCA0LjYpO1xuICAgICAgYi5nZW0oNywgMjUuNikuZ2VtKDE0LjUsIDIxKS5nZW0oNSwgNC42KTtcbiAgICB9XG4gIH0sXG4gIHsgLy8gUGluYmFsbCBsaWZ0OiBidW1wZXJzIHNsaW5nIHlvdSBvdXQgb2YgdGhlIHVwZHJhZnQgdG93YXJkcyB0aGUgZXhpdC5cbiAgICBpZDogXCI0LTEwXCIsXG4gICAgYnVpbGQoYikge1xuICAgICAgYi5mcmFtZSgpO1xuICAgICAgYi52KDgsIDYsIDIyKS52KDE5LCA2LCAyMik7XG4gICAgICBiLmgoNiwgMSwgNyk7XG4gICAgICBiLmJveCgxOSwgMjQsIDIwLCAyNik7XG4gICAgICBiLmZhbig5LCA2LCAxOCwgMjYsIFwiVVwiLCA4ODApO1xuICAgICAgYi5wdXQoXCJPXCIsIDE3LCA5KS5wdXQoXCJPXCIsIDExLCAxMyk7XG4gICAgICBiLnNwaWtlcyg5LCAyLCAxOCwgMik7XG4gICAgICBiLnN0YXJ0KDQsIDI1LjYpLmdvYWwoMS40LCA0LjYpO1xuICAgICAgYi5nZW0oNywgMjUuNikuZ2VtKDEzLjUsIDE4KS5nZW0oNCwgNC42KTtcbiAgICB9XG4gIH0sXG4gIHsgLy8gQmVhbXMgYmVoaW5kIGEga2V5OiBncmFiIGl0IHBhc3QgdGhlIGZpcnN0IGJlYW0sIGRyb3AgdG8gdGhlIGxvd2VyIGhhbGwsIGRvb3IgYW5kIHNlY29uZCBiZWFtLlxuICAgIGlkOiBcIjQtMTFcIixcbiAgICBidWlsZChiKSB7XG4gICAgICBiLmZyYW1lKCk7XG4gICAgICBiLmgoMTMsIDEsIDIzKTtcbiAgICAgIGIubGFzZXIoMTQsIDEsIDE0LCAxMiwgMywgMSwgMS4wKTtcbiAgICAgIGIua2V5KDI0LCAxMS42KTtcbiAgICAgIGIuZG9vcigxMiwgMTQsIDEyLCAyNik7XG4gICAgICBiLmxhc2VyKDYsIDE0LCA2LCAyNiwgMywgMSwgMCk7XG4gICAgICBiLnN0YXJ0KDMsIDExLjYpLmdvYWwoMS40LCAyNS42KTtcbiAgICAgIGIuZ2VtKDksIDExLjYpLmdlbSgyMCwgMTEuNikuZ2VtKDE4LCAyNS42KTtcbiAgICB9XG4gIH0sXG4gIHsgLy8gRmVycnk6IHRoZSBvbmx5IHdheSBvdmVyIHRoZSBwaXQgaXMgdGhlIHBsYXRmb3JtLCBhbmQgdGhlIGJlYW0gY3Jvc3NlcyBpdHMgcGF0aC5cbiAgICBpZDogXCI0LTEyXCIsXG4gICAgYnVpbGQoYikge1xuICAgICAgYi5mcmFtZSgpO1xuICAgICAgYi5oKDE0LCAxLCA3KS5oKDE0LCAyMSwgMjYpO1xuICAgICAgYi5zcGlrZXMoOCwgMjYsIDIwLCAyNik7XG4gICAgICBiLmxhc2VyKDE0LCAxLCAxNCwgMTMsIDQsIDEuNCwgMCk7XG4gICAgICBiLm1vdmVyKDE0LCAxNC41LCA1LCAxLCA0LCAwLCAxLjQsIDApO1xuICAgICAgYi5zdGFydCg0LCAxMi42KS5nb2FsKDI1LjYsIDEyLjYpO1xuICAgICAgYi5nZW0oNSwgOCkuZ2VtKDE0LCAyMCkuZ2VtKDI0LCAxMi42KTtcbiAgICB9XG4gIH0sXG4gIHsgLy8gRWxldmF0b3I6IHRoZSBzaGFmdCBpcyBibG9ja2VkIGJ5IHRoZSBwbGF0Zm9ybSBcdTIwMTQgaG9wIG9uIGF0IHRoZSBib3R0b20sIGhvcCBvZmYgYXQgdGhlIHRvcC5cbiAgICBpZDogXCI0LTEzXCIsXG4gICAgYnVpbGQoYikge1xuICAgICAgYi5mcmFtZSgpO1xuICAgICAgYi52KDExLCAzLCAxOCkudigxMSwgMjIsIDI1KTtcbiAgICAgIGIudigxOCwgMywgNikudigxOCwgMTAsIDI1KTtcbiAgICAgIGIuaCgyMiwgMSwgMTApLmgoMTAsIDE4LCAyNikuaCgyLCAxMSwgMTcpO1xuICAgICAgYi5tb3ZlcigxNC41LCAxNi41LCA1LCAxLCAwLCA2LCAxLjEsIDApO1xuICAgICAgYi5sYXNlcig2LCAxLCA2LCAyMSwgMi42LCAxLjcsIDApO1xuICAgICAgYi5sYXNlcigyMiwgMywgMjIsIDksIDIuOCwgMS43LCAxLjYpO1xuICAgICAgYi5zYXcoMTQuNSwgNiwgMTIsIDAsIDEuMiwgMi40LCAwKTtcbiAgICAgIGIuc3RhcnQoMywgMjAuNikuZ29hbCgyNS42LCA4LjYpO1xuICAgICAgYi5nZW0oMywgMTQpLmdlbSgxNC41LCA1KS5nZW0oMjQsIDguNik7XG4gICAgfVxuICB9LFxuICB7IC8vIFBhZCBhbmQgY3Jvc3N3aW5kOiB0aGUgbGF1bmNoZXIgdGhyb3dzIHlvdSB1cCwgdGhlIHN0cmVhbSBjYXJyaWVzIHlvdSBvdmVyIHRoZSBzcGlrZXMuXG4gICAgaWQ6IFwiNC0xNFwiLFxuICAgIGJ1aWxkKGIpIHtcbiAgICAgIGIuZnJhbWUoKTtcbiAgICAgIGIuaCgyMiwgMSwgOCkuaCgyMiwgMjAsIDI2KTtcbiAgICAgIGIuc3Bpa2VzKDksIDI2LCAxOSwgMjYpO1xuICAgICAgYi5wdXQoXCJBXCIsIDcsIDIxKTtcbiAgICAgIGIuZmFuKDYsIDgsIDIxLCAxNSwgXCJSXCIsIDkwMCk7XG4gICAgICBiLmxhc2VyKDE0LCAxLCAxNCwgMjEsIDIuNiwgMS41LCAwLjgpO1xuICAgICAgYi5sYXNlcigyMiwgMSwgMjIsIDIxLCAyLjksIDEuNywgMC4zKTtcbiAgICAgIGIuc2F3KDE4LCAxNywgMTIsIDAsIDIuNCwgMi4xLCAwKTtcbiAgICAgIGIuc3RhcnQoMywgMjAuNikuZ29hbCgyNS42LCAyMC42KTtcbiAgICAgIGIuZ2VtKDE0LCAyMCkuZ2VtKDEwLCAxMSkuZ2VtKDI0LCAyMC42KTtcbiAgICB9XG4gIH0sXG4gIHsgLy8gQ3Jvc3N3aW5kOiB0aGUgc3RyZWFtIHNob3ZlcyB5b3UgdG93YXJkcyB0aGUgc3Bpa2VzOyBsZWFuIGludG8gaXQgYWxsIHRoZSB3YXkgZG93bi5cbiAgICBpZDogXCI0LTE1XCIsXG4gICAgYnVpbGQoYikge1xuICAgICAgYi5mcmFtZSgpO1xuICAgICAgYi52KDksIDUsIDIyKS52KDE4LCA1LCAyMik7XG4gICAgICBiLnNwaWtlcygxOCwgNSwgMTgsIDIyKTtcbiAgICAgIGIuaCg1LCAxLCA5KS5oKDIzLCAxLCA5KTtcbiAgICAgIGIuZmFuKDEwLCA1LCAxNywgMjIsIFwiUlwiLCA0ODApO1xuICAgICAgYi5zdGFydCg0LCAzLjYpLmdvYWwoMS40LCAyNS42KTtcbiAgICAgIGIuZ2VtKDEyLCA3KS5nZW0oMTMuNSwgMTQpLmdlbSg0LCAyNS42KTtcbiAgICB9XG4gIH0sXG4gIHsgLy8gVGFpbHdpbmQgdHVubmVsOiB0aGUgc3RyZWFtIHNob3ZlcyB5b3UgYXQgdGhlIHNlY29uZCBiZWFtOyBob2xkIGJhY2sgYW5kIHdhaXQgZm9yIHRoZSBnYXAuXG4gICAgaWQ6IFwiNC0xNlwiLFxuICAgIGJ1aWxkKGIpIHtcbiAgICAgIGIuZnJhbWUoKTtcbiAgICAgIGIuaCgxNSwgNCwgMjYpO1xuICAgICAgYi5sYXNlcig5LCAxNiwgOSwgMjYsIDMsIDEuOCwgMC41KTtcbiAgICAgIGIubGFzZXIoMTgsIDE2LCAxOCwgMjYsIDMuNCwgMi4wLCAyKTtcbiAgICAgIGIuZmFuKDEwLCAxNiwgMTcsIDI2LCBcIlJcIiwgNTYwKTtcbiAgICAgIGIuc3RhcnQoMiwgNi42KS5nb2FsKDI1LjYsIDI1LjYpO1xuICAgICAgYi5nZW0oMTQsIDEzLjYpLmdlbSgxMy41LCAxNy42KS5nZW0oMjIsIDI1LjYpO1xuICAgIH1cbiAgfSxcbiAgeyAvLyBTYXdtaWxsOiB0aHJlZSBsYW5lcywgYSBibGFkZSBib2JiaW5nIGluIGVhY2ggXHUyMDE0IHRoZSBzdHJlYW0gcHVzaGVzIHlvdSBpbnRvIHRoZW0uXG4gICAgaWQ6IFwiNC0xN1wiLFxuICAgIGJ1aWxkKGIpIHtcbiAgICAgIGIuZnJhbWUoKTtcbiAgICAgIGIuaCg5LCAxLCAyMikuaCgxOCwgNSwgMjYpO1xuICAgICAgYi5zYXcoMTQsIDUsIDE0LCAwLCAyLjgsIDIuMywgMCk7XG4gICAgICBiLmZhbig0LCAxLCAxMiwgOCwgXCJSXCIsIDUyMCk7XG4gICAgICBiLnNhdygxNywgMTMuNSwgMTQsIDAsIDIuNiwgMi4zLCAyKTtcbiAgICAgIGIuc2F3KDksIDEzLjUsIDE0LCAwLCAyLjYsIDIuMywgNSk7XG4gICAgICBiLmZhbig2LCAxMCwgMjIsIDE3LCBcIkxcIiwgNTAwKTtcbiAgICAgIGIubGFzZXIoMTQsIDE5LCAxNCwgMjYsIDIuNywgMS43LCAwKTtcbiAgICAgIGIuZmFuKDUsIDE5LCAxMywgMjYsIFwiUlwiLCA1MjApO1xuICAgICAgYi5zdGFydCgzLCA3LjYpLmdvYWwoMjUuNiwgMjUuNik7XG4gICAgICBiLmdlbSg5LCA3LjYpLmdlbSgxMywgMTEuNCkuZ2VtKDIxLCAyNS42KTtcbiAgICB9XG4gIH0sXG4gIHsgLy8gRG93bmRyYWZ0OiByaWRlIHRoZSBmYXN0IHNoYWZ0cyBkb3duLCBlYWNoIGhvbGUgZ3VhcmRlZCBieSBhIGJlYW0uXG4gICAgaWQ6IFwiNC0xOFwiLFxuICAgIGJ1aWxkKGIpIHtcbiAgICAgIGIuZnJhbWUoKTtcbiAgICAgIGIuaCg3LCA2LCAyNikuaCgxMywgMSwgMjEpLmgoMTksIDYsIDI2KTtcbiAgICAgIGIuZmFuKDEsIDgsIDUsIDEyLCBcIkRcIiwgMTQwMCk7XG4gICAgICBiLmZhbigyMiwgMTQsIDI2LCAxOCwgXCJEXCIsIDE0MDApO1xuICAgICAgYi5sYXNlcigxLCA4LCA1LCA4LCAyLjUsIDEuNSwgMCk7XG4gICAgICBiLmxhc2VyKDIyLCAxNCwgMjYsIDE0LCAyLjUsIDEuNSwgMS4yKTtcbiAgICAgIGIubGFzZXIoMTIsIDgsIDEyLCAxMiwgMi44LCAxLjUsIDAuNik7XG4gICAgICBiLmxhc2VyKDE0LCAxNCwgMTQsIDE4LCAzLjEsIDEuNiwgMik7XG4gICAgICBiLnNwaWtlcyg5LCAyNiwgMTQsIDI2KTtcbiAgICAgIGIuc3RhcnQoMjAsIDUuNikuZ29hbCgyNS42LCAyNS42KTtcbiAgICAgIGIuZ2VtKDEwLCA1LjYpLmdlbSgxMiwgMTEuNikuZ2VtKDE4LCAxNy42KTtcbiAgICB9XG4gIH0sXG4gIHsgLy8gVmF1bHQ6IGxpZnQgdG8gdGhlIGtleSBiZWhpbmQgYSBiZWFtLCBkcm9wIGJhY2ssIG9wZW4gdGhlIGRvb3IsIGNyb3NzIHRoZSBzZWNvbmQgYmVhbS5cbiAgICBpZDogXCI0LTE5XCIsXG4gICAgYnVpbGQoYikge1xuICAgICAgYi5mcmFtZSgpO1xuICAgICAgYi5oKDE0LCAxLCA0KS5oKDE0LCA5LCAxMSkuaCgxNCwgMTYsIDI2KTtcbiAgICAgIGIuZmFuKDUsIDE0LCA4LCAyNSwgXCJVXCIsIDkwMCk7XG4gICAgICBiLnNwaWtlcyg1LCAyLCA4LCAyKTtcbiAgICAgIGIubGFzZXIoMTQsIDEsIDE0LCAxMywgMywgMS4yLCAwKTtcbiAgICAgIGIua2V5KDI0LCAxMi42KTtcbiAgICAgIGIuZ2F0ZSgxMiwgMTQsIDE1LCAxNCwgXCJEXCIpO1xuICAgICAgYi5kb29yKDE5LCAxNSwgMTksIDI2KTtcbiAgICAgIGIubGFzZXIoMTcsIDE1LCAxNywgMjYsIDMuNCwgMS4yLCAxLjUpO1xuICAgICAgYi5zdGFydCgyLCAyNS42KS5nb2FsKDI1LjYsIDI1LjYpO1xuICAgICAgYi5nZW0oMiwgMTIuNikuZ2VtKDYuNSwgMTkpLmdlbSgyMSwgMTIuNik7XG4gICAgfVxuICB9LFxuICB7IC8vIEZhY3RvcnkgZmxvb3I6IGZvdXIgbGFuZXMgXHUyMDE0IGJlYW1zLCBibGFkZXMsIGEga2V5LCBhIGRvb3IgYW5kIGEgc3RyZWFtIGFnYWluc3QgeW91LlxuICAgIGlkOiBcIjQtMjBcIixcbiAgICBidWlsZChiKSB7XG4gICAgICBiLmZyYW1lKCk7XG4gICAgICBiLmgoNywgMSwgMjIpLmgoMTQsIDUsIDI2KS5oKDIxLCAxLCAyMik7XG4gICAgICBiLmxhc2VyKDgsIDEsIDgsIDYsIDIuNiwgMS43LCAwKTtcbiAgICAgIGIubGFzZXIoMTcsIDEsIDE3LCA2LCAyLjksIDEuOCwgMS4xKTtcbiAgICAgIGIuc2F3KDE1LCAxMC41LCAxNCwgMCwgMi4yLCAyLjIsIDEpO1xuICAgICAgYi5zYXcoOSwgMTAuNSwgMTQsIDAsIDIuMiwgMi4yLCA0LjEpO1xuICAgICAgYi5mYW4oNiwgOCwgMjIsIDEzLCBcIkxcIiwgNDgwKTtcbiAgICAgIGIua2V5KDIuNCwgMTIuNik7XG4gICAgICBiLmxhc2VyKDksIDE1LCA5LCAyMCwgMi43LCAxLjcsIDAuNSk7XG4gICAgICBiLmxhc2VyKDE3LCAxNSwgMTcsIDIwLCAzLCAxLjgsIDEuNSk7XG4gICAgICBiLmZhbig1LCAxNSwgMTYsIDIwLCBcIlJcIiwgNTIwKTtcbiAgICAgIGIuZG9vcig4LCAyMiwgOCwgMjYpO1xuICAgICAgYi5sYXNlcigxNiwgMjIsIDE2LCAyNiwgMywgMS44LCAwLjQpO1xuICAgICAgYi5zdGFydCgzLCA1LjYpLmdvYWwoMS40LCAyNS42KTtcbiAgICAgIGIuZ2VtKDEyLjUsIDUuNikuZ2VtKDIwLCAxMi42KS5nZW0oMjEsIDE5LjYpO1xuICAgIH1cbiAgfVxuXTtcbiIsICIvLyBXb3JsZCA1IFx1MjAxNCBcIk5lb25cIi4gUG9ydGFscyBmaXJzdCwgdGhlbiB0aGUgZ3JhbmQgZmluYWxlIG1peGluZyBldmVyeSBtZWNoYW5pYy5cbi8vIE5vdGU6IGEgcG9ydGFsIGNlbnRyZSBtdXN0IHNpdCBvbiBhIGZyZWUgc29sdmVyIGNlbGw7IG9uIGEgZmxvb3IgdXNlIHJvdyAocmVzdCByb3cgLSAwLjQpLCBlLmcuIDI1LjIsIG5vdCAyNS42LlxuZXhwb3J0IGNvbnN0IFdPUkxENSA9IFtcbiAgeyAvLyBGaXJzdCBwb3J0YWw6IHRoZSBnb2FsIHNpdHMgaW4gYSBzZWFsZWQgcm9vbTsgcm9sbCBpbnRvIHRoZSBsZWZ0IHBvcnRhbCwgY29tZSBvdXQgb2YgdGhlIHJpZ2h0IG9uZS5cbiAgICBpZDogXCI1LTFcIiwgdHV0OiBcInBvcnRcIixcbiAgICBidWlsZChiKSB7XG4gICAgICBiLmZyYW1lKCk7XG4gICAgICBiLmJveCgxNSwgMTcsIDE2LCAyNik7XG4gICAgICBiLmgoMTcsIDE1LCAyNik7XG4gICAgICBiLmgoOSwgMSwgMTIpO1xuICAgICAgYi5wb3J0KDYsIDI1LjIsIDIxLCAyNS4yKTtcbiAgICAgIGIuc3RhcnQoNCwgNy42KS5nb2FsKDI1LjYsIDI1LjYpO1xuICAgICAgYi5nZW0oOSwgNy42KS5nZW0oMTIsIDI1LjYpLmdlbSgyMywgMjQpO1xuICAgIH1cbiAgfSxcbiAgeyAvLyBGYWxsIGluIGF0IHRoZSBib3R0b20sIGRyb3Agb3V0IG9mIHRoZSBjZWlsaW5nIG9mIHRoZSBzZWFsZWQgcm9vbSB3aXRoIGFsbCB0aGF0IHNwZWVkLlxuICAgIGlkOiBcIjUtMlwiLFxuICAgIGJ1aWxkKGIpIHtcbiAgICAgIGIuZnJhbWUoKTtcbiAgICAgIGIuaCgxMSwgMTQsIDI2KS52KDE0LCAxMSwgMjYpO1xuICAgICAgYi5oKDgsIDEsIDcpO1xuICAgICAgYi5wb3J0KDUsIDI1LjIsIDIwLCAxNCk7XG4gICAgICBiLnN0YXJ0KDQsIDYuNikuZ29hbCgyNS42LCAyNS42KTtcbiAgICAgIGIuZ2VtKDgsIDI1LjYpLmdlbSgxMSwgMTIpLmdlbSgyNSwgMTQpO1xuICAgIH1cbiAgfSxcbiAgeyAvLyBUaHJlZSBmbG9vcnMsIHR3byBwYWlyczogY2xpbWIgdGhlIHRvd2VyIGJ5IHN0ZXBwaW5nIHRocm91Z2ggdGhlIHBvcnRhbHMuXG4gICAgaWQ6IFwiNS0zXCIsXG4gICAgYnVpbGQoYikge1xuICAgICAgYi5mcmFtZSgpO1xuICAgICAgYi5oKDE4LCAwLCAyNykuaCg5LCAwLCAyNyk7XG4gICAgICBiLnBvcnQoMjMsIDI1LjIsIDQsIDE2LjIpO1xuICAgICAgYi5wb3J0KDIzLCAxNi4yLCA0LCA3LjIpO1xuICAgICAgYi5zdGFydCg0LCAyNC42KS5nb2FsKDI1LjYsIDcuNik7XG4gICAgICBiLmdlbSgxNCwgMjUuNikuZ2VtKDE0LCAxNi42KS5nZW0oMTQsIDcuNik7XG4gICAgfVxuICB9LFxuICB7IC8vIFRoZSBwaWxsYXIgaW4gdGhlIHNwaWtlczogbGFuZCBleGFjdGx5IG9uIHRoZSB0b3AgYW5kIHRoZSBwb3J0YWwgc3dhbGxvd3MgeW91LlxuICAgIGlkOiBcIjUtNFwiLFxuICAgIGJ1aWxkKGIpIHtcbiAgICAgIGIuZnJhbWUoKTtcbiAgICAgIGIuc3Bpa2VzKDEsIDI2LCAyNiwgMjYpO1xuICAgICAgYi5ib3goMTEsIDIwLCAxNywgMjUpO1xuICAgICAgYi5wdXQoXCIjXCIsIDExLCAxOSkucHV0KFwiI1wiLCAxNywgMTkpO1xuICAgICAgYi5oKDYsIDEsIDgpO1xuICAgICAgYi5ib3goMTksIDExLCAyNiwgMTIpO1xuICAgICAgYi52KDE5LCAxMywgMjApO1xuICAgICAgYi5wb3J0KDE0LCAxOC40LCAyMywgMTguNCk7XG4gICAgICBiLnN0YXJ0KDQsIDQuNikuZ29hbCgyNS42LCAyMC42KTtcbiAgICAgIGIuZ2VtKDcsIDQuNikuZ2VtKDE0LCAxMikuZ2VtKDI0LCAxNyk7XG4gICAgfVxuICB9LFxuICB7IC8vIE5vIGdyb3VuZCBiZXR3ZWVuIHRoZSBpc2xhbmRzOiB0aGUgcG9ydGFsIGlzIHRoZSBicmlkZ2UuXG4gICAgaWQ6IFwiNS01XCIsXG4gICAgYnVpbGQoYikge1xuICAgICAgYi5mcmFtZSgpO1xuICAgICAgYi5jbGVhcigxLCAyNywgMjYsIDI3KTtcbiAgICAgIGIuaCgyMiwgMSwgMTEpLmgoMjIsIDE2LCAyNik7XG4gICAgICBiLnYoMTMsIDEsIDIxKS52KDE0LCAxLCAyMSk7XG4gICAgICBiLnBvcnQoNiwgMjAuMiwgMjEsIDIwLjIpO1xuICAgICAgYi5zdGFydCgzLCAzLjYpLmdvYWwoMjUuNiwgMjAuNik7XG4gICAgICBiLmdlbSg5LCAyMC42KS5nZW0oMjQsIDIwLjYpLmdlbSgyMSwgMik7XG4gICAgfVxuICB9LFxuICB7IC8vIFJhbXAgZm9yIHNwZWVkLCBwb3J0YWwgZm9yIHRoZSBqdW1wOiB0aGUgZXhpdCBmbGluZ3MgeW91IGFjcm9zcyB0aGUgc3Bpa2UgcGl0LlxuICAgIGlkOiBcIjUtNlwiLFxuICAgIGJ1aWxkKGIpIHtcbiAgICAgIGIuZnJhbWUoKTtcbiAgICAgIGIuZGlhZygxLCAxNSwgMTIsIDI2KTtcbiAgICAgIGIuYm94KDE4LCAyMiwgMjAsIDI2KTtcbiAgICAgIGIuYm94KDI0LCAyMiwgMjYsIDI2KTtcbiAgICAgIGIuc3Bpa2VzKDIxLCAyNiwgMjMsIDI2KTtcbiAgICAgIGIuaCgxNCwgMTcsIDI2KS52KDE3LCAxNCwgMjApO1xuICAgICAgYi5wb3J0KDE1LCAyNS4yLCAxOSwgMjAuMik7XG4gICAgICBiLnN0YXJ0KDMsIDYuNikuZ29hbCgyNS42LCAyMC42KTtcbiAgICAgIGIuZ2VtKDMsIDEyKS5nZW0oMTUsIDI0KS5nZW0oMjIsIDIwKTtcbiAgICB9XG4gIH0sXG4gIHsgLy8gVGhlIHBvcnRhbCBoYW5ncyBoaWdoIGluIGEgc2VhbGVkIHNoYWZ0OiBvbmx5IHRoZSBsYXVuY2ggcGFkIGdldHMgeW91IHVwIHRvIGl0LlxuICAgIGlkOiBcIjUtN1wiLFxuICAgIGJ1aWxkKGIpIHtcbiAgICAgIGIuZnJhbWUoKTtcbiAgICAgIGIudigxMSwgMSwgMjIpO1xuICAgICAgYi52KDE4LCAxLCAyNik7XG4gICAgICBiLnB1dChcIkFcIiwgMTQsIDI2KTtcbiAgICAgIGIucG9ydCgxNC41LCA4LCAyMiwgMjAuMik7XG4gICAgICBiLnN0YXJ0KDQsIDI1LjYpLmdvYWwoMjUuNiwgMjUuNik7XG4gICAgICBiLmdlbSg1LCAxNCkuZ2VtKDE2LCAxNCkuZ2VtKDIzLCA0KTtcbiAgICB9XG4gIH0sXG4gIHsgLy8gVGhlIGtleSBpcyBpbiBhIHNlYWxlZCBjZWxsOiBwb3J0YWwgaW4sIGdyYWIgaXQsIHBvcnRhbCBvdXQsIG9wZW4gdGhlIGRvb3IuXG4gICAgaWQ6IFwiNS04XCIsXG4gICAgYnVpbGQoYikge1xuICAgICAgYi5mcmFtZSgpO1xuICAgICAgYi5ib3goMTgsIDEsIDE5LCA4KS5oKDksIDE4LCAyNik7XG4gICAgICBiLnBvcnQoNiwgMjUuMiwgMjIsIDcuMik7XG4gICAgICBiLmtleSgyNC41LCA3LjYpO1xuICAgICAgYi5kb29yKDE2LCAxOCwgMTYsIDI2KTtcbiAgICAgIGIuaCgxNywgMTYsIDI2KTtcbiAgICAgIGIuc3RhcnQoNCwgMy42KS5nb2FsKDI1LjYsIDI1LjYpO1xuICAgICAgYi5nZW0oMTEsIDI1LjYpLmdlbSgzLCAxMikuZ2VtKDIyLCAyKTtcbiAgICB9XG4gIH0sXG4gIHsgLy8gVGhlIHNhdyBwYXRyb2xzIHRoZSBsb3cgY29ycmlkb3IgaW4gZnJvbnQgb2YgdGhlIHBvcnRhbDogc2xpcCB1bmRlciBpdC5cbiAgICBpZDogXCI1LTlcIixcbiAgICBidWlsZChiKSB7XG4gICAgICBiLmZyYW1lKCk7XG4gICAgICBiLmgoMjEsIDUsIDEzKTtcbiAgICAgIGIudigxNCwgMSwgMjYpO1xuICAgICAgYi5zYXcoOCwgMjQsIDEyLCAwLCAxLjgsIDIuMCk7XG4gICAgICBiLnBvcnQoMTEuNSwgMjUuMiwgMjIsIDI1LjIpO1xuICAgICAgYi5zdGFydCg5LCAxNy42KS5nb2FsKDI1LjYsIDI1LjYpO1xuICAgICAgYi5nZW0oMywgMjQpLmdlbSgxMCwgMTkpLmdlbSgyMCwgMS40KTtcbiAgICB9XG4gIH0sXG4gIHsgLy8gQSBzaHV0dGVyIHNsaWRlcyBpbiB0aGUgZG9vcndheTsgd2FpdCBmb3IgaXQgdG8gb3BlbiwgdGhlbiBwb3J0YWwgdXAgdG8gdGhlIGdvYWwgcm9vbS5cbiAgICBpZDogXCI1LTEwXCIsXG4gICAgYnVpbGQoYikge1xuICAgICAgYi5mcmFtZSgpO1xuICAgICAgYi52KDEzLCAxLCAxOSkudigxMywgMjYsIDI2KTtcbiAgICAgIGIubW92ZXIoMTMsIDIyLjUsIDEsIDYsIDAsIDUsIDEuMik7XG4gICAgICBiLmJveCgxOSwgMSwgMjAsIDgpLmgoOSwgMTksIDI2KTtcbiAgICAgIGIucG9ydCgyMCwgMjUuMiwgMjMsIDcuMik7XG4gICAgICBiLnN0YXJ0KDQsIDMuNikuZ29hbCgyNS42LCA3LjYpO1xuICAgICAgYi5nZW0oNSwgMjQpLmdlbSgxNiwgMTIpLmdlbSgyNCwgMik7XG4gICAgfVxuICB9LFxuICB7IC8vIENyb3NzLXdpbmQgc2hhZnQ6IHRoZSB3aW5kIHNob3ZlcyB5b3Ugb250byB0aGUgc3Bpa2VzLiBMZWFuIGludG8gaXQgYWxsIHRoZSB3YXkgZG93bi5cbiAgICBpZDogXCI1LTExXCIsXG4gICAgYnVpbGQoYikge1xuICAgICAgYi5mcmFtZSgpO1xuICAgICAgYi5oKDYsIDEsIDkpLmgoNiwgMTcsIDI2KTtcbiAgICAgIGIudig5LCA3LCAyMykudigxNywgNywgMjMpO1xuICAgICAgYi5zcGlrZXMoMTYsIDgsIDE2LCAyMyk7XG4gICAgICBiLmZhbigxMCwgNywgMTUsIDIzLCBcIlJcIiwgNTAwKTtcbiAgICAgIGIuc3RhcnQoNCwgNC42KS5nb2FsKDI1LjYsIDI1LjYpO1xuICAgICAgYi5nZW0oMywgNC42KS5nZW0oMTIsIDE1KS5nZW0oNSwgMjUuNik7XG4gICAgfVxuICB9LFxuICB7IC8vIFRoZSBnYXRlIG9ubHkgb3BlbnMgdG93YXJkcyB0aGUgcmlnaHQsIHNvIHRoZSB3YXkgaG9tZSBpcyB0aGUgcG9ydGFsLlxuICAgIGlkOiBcIjUtMTJcIixcbiAgICBidWlsZChiKSB7XG4gICAgICBiLmZyYW1lKCk7XG4gICAgICBiLnYoMTMsIDEsIDIwKS52KDEzLCAyNiwgMjYpO1xuICAgICAgYi5nYXRlKDEzLCAyMSwgMTMsIDI1LCBcIlJcIik7XG4gICAgICBiLnBvcnQoMjAsIDI1LjIsIDYsIDI1LjIpO1xuICAgICAgYi5zdGFydCgyNCwgMy42KS5nb2FsKDEuNCwgMjUuNik7XG4gICAgICBiLmdlbSgyNSwgMjUuNikuZ2VtKDE3LCAxMikuZ2VtKDQsIDE0KTtcbiAgICB9XG4gIH0sXG4gIHsgLy8gQSB3YWxsIG9mIGxhc2VyIHNwbGl0cyB0aGUgcm9vbS4gSG9wIGl0LCB0aGVuIHdhaXQgb3V0IHRoZSBmbGFzaGluZyBiZWFtIGF0IHRoZSBnb2FsLlxuICAgIGlkOiBcIjUtMTNcIixcbiAgICBidWlsZChiKSB7XG4gICAgICBiLmZyYW1lKCk7XG4gICAgICBiLmxhc2VyKDEzLCAxLCAxNCwgMjYsIDApO1xuICAgICAgYi5sYXNlcigxOCwgMjMsIDI2LCAyMywgMy4wLCAxLjUpO1xuICAgICAgYi5oKDIzLCAxNSwgMTcpO1xuICAgICAgYi5wb3J0KDYsIDI1LjIsIDIxLCAyNS4yKTtcbiAgICAgIGIuc3RhcnQoNCwgMy42KS5nb2FsKDI1LjYsIDI1LjYpO1xuICAgICAgYi5nZW0oMywgMjQpLmdlbSgyMywgMTIpLmdlbSgyNCwgMjUuNik7XG4gICAgfVxuICB9LFxuICB7IC8vIFBlZ3MgYW5kIGJ1bXBlcnM6IHBsaW5rbyBkb3duIGludG8gdGhlIHBvcnRhbCwgcGxpbmtvIGFnYWluIG91dCBvZiBpdHMgdHdpbi5cbiAgICBpZDogXCI1LTE0XCIsXG4gICAgYnVpbGQoYikge1xuICAgICAgYi5mcmFtZSgpO1xuICAgICAgYi5oKDEzLCAxLCAyNik7XG4gICAgICBbNCwgOCwgMTIsIDE2LCAyMCwgMjRdLmZvckVhY2goKGMpID0+IGIucHV0KFwib1wiLCBjLCA4KSk7XG4gICAgICBbNiwgMTQsIDIyXS5mb3JFYWNoKChjKSA9PiBiLnB1dChcIm9cIiwgYywgNCkpO1xuICAgICAgYi5wdXQoXCJPXCIsIDcsIDE4KS5wdXQoXCJPXCIsIDE0LCAxOCkucHV0KFwiT1wiLCAyMSwgMTgpO1xuICAgICAgWzUsIDEwLCAxNSwgMjBdLmZvckVhY2goKGMpID0+IGIucHV0KFwib1wiLCBjLCAyMikpO1xuICAgICAgYi5kaWFnKDEyLCAyMSwgMTcsIDI2KTtcbiAgICAgIGIuc3Bpa2VzKDEsIDI2LCAxMSwgMjYpO1xuICAgICAgYi5wb3J0KDE0LCAxMS4yLCAxNCwgMTUuNCk7XG4gICAgICBiLnN0YXJ0KDIsIDIpLmdvYWwoMjUuNiwgMjUuNik7XG4gICAgICBiLmdlbSgxMywgNCkuZ2VtKDI0LCAxMSkuZ2VtKDI0LCAyMCk7XG4gICAgfVxuICB9LFxuICB7IC8vIFRoZSBzcGlyYWwgaXMgcGx1Z2dlZCBoYWxmd2F5LiBUaGUgcG9ydGFsIHNraXBzIHRoZSBwbHVnLlxuICAgIGlkOiBcIjUtMTVcIixcbiAgICBidWlsZChiKSB7XG4gICAgICBiLmZyYW1lKCk7XG4gICAgICBiLmgoNSwgMSwgMjIpLnYoMjIsIDUsIDIyKS5oKDIyLCA1LCAyMikudig1LCAxMCwgMjIpO1xuICAgICAgYi5oKDEwLCA2LCAxNykudigxNywgMTAsIDE3KS5oKDE3LCAxMCwgMTcpLnYoMTAsIDEwLCAxMikudigxMCwgMTYsIDE3KTtcbiAgICAgIGIuaCgxMywgMjMsIDI2KTtcbiAgICAgIGIucG9ydCgyNC41LCAxMS4yLCAyNC41LCAxNyk7XG4gICAgICBiLnN0YXJ0KDMsIDMuNikuZ29hbCgxNS42LCAxNCk7XG4gICAgICBiLmdlbSgyNC41LCAyMCkuZ2VtKDIuNSwgMTUpLmdlbSgxMy41LCAxOS41KTtcbiAgICB9XG4gIH0sXG4gIHsgLy8gVmF1bHQ6IHBvcnRhbCB0byB0aGUga2V5LCBiYWNrIG91dCB0aHJvdWdoIHRoZSBwb3J0YWwsIHRoZW4gcGFzdCB0aGUgc2F3IGludG8gdGhlIGdvYWwgbm9vay5cbiAgICBpZDogXCI1LTE2XCIsXG4gICAgYnVpbGQoYikge1xuICAgICAgYi5mcmFtZSgpO1xuICAgICAgYi5oKDEzLCA1LCAyNik7XG4gICAgICBiLnYoMTksIDEsIDkpLmgoOSwgMTksIDI2KTtcbiAgICAgIGIuYm94KDEsIDE5LCA4LCAyMyk7XG4gICAgICBiLmRvb3IoOCwgMjQsIDgsIDI2KTtcbiAgICAgIGIuc2F3KDQuNSwgMjUsIDEzLCAwLCAzLjAsIDEuOCk7XG4gICAgICBiLnNwaWtlcygxNCwgMjYsIDE4LCAyNik7XG4gICAgICBiLnBvcnQoMTQsIDExLjIsIDIyLjUsIDcuMik7XG4gICAgICBiLmtleSgyNC41LCA3LjYpO1xuICAgICAgYi5zdGFydCgzLCA2LjYpLmdvYWwoMS40LCAyNS42KTtcbiAgICAgIGIuZ2VtKDgsIDExLjYpLmdlbSgyMywgMikuZ2VtKDI0LCAyNS42KTtcbiAgICB9XG4gIH0sXG4gIHsgLy8gQSBoZWFkd2luZCBndWFyZHMgdGhlIGNvcnJpZG9yLiBUYWtlIHRoZSBwb3J0YWwsIHRoZW4gd2FpdCBmb3IgdGhlIGJlYW0gYXQgdGhlIGdvYWwgbm9vay5cbiAgICBpZDogXCI1LTE3XCIsXG4gICAgYnVpbGQoYikge1xuICAgICAgYi5mcmFtZSgpO1xuICAgICAgYi52KDEzLCAxLCAxOSkudigxMywgMjYsIDI2KTtcbiAgICAgIGIuYm94KDEzLCAyMCwgMTQsIDIwKTtcbiAgICAgIGIuZmFuKDgsIDIxLCAxOSwgMjUsIFwiTFwiLCAzMDAwKTtcbiAgICAgIGIuaCgxMywgNSwgMTIpO1xuICAgICAgYi5oKDksIDE3LCAyNCk7XG4gICAgICBiLnBvcnQoOC41LCAxMS4yLCAyMC41LCA3LjIpO1xuICAgICAgYi5oKDE5LCAyMSwgMjYpO1xuICAgICAgYi5sYXNlcigyMSwgMjAsIDIxLCAyNiwgMi44LCAxLjQpO1xuICAgICAgYi5zcGlrZXMoMTUsIDI2LCAyMCwgMjYpO1xuICAgICAgYi5zdGFydCgzLCAzLjYpLmdvYWwoMjUuNiwgMjUuNik7XG4gICAgICBiLmdlbSgzLCAxMSkuZ2VtKDI0LCAzKS5nZW0oNSwgMjQpO1xuICAgIH1cbiAgfSxcbiAgeyAvLyBSb3VuZCB0aGUgcGlsbGFyIG9uZSB3YXkgb25seTogZ2F0ZXMgYmVoaW5kIHlvdSwgc2F3cyBvbiB0aGUgbGVmdCBhbmQgdGhlIHJpZ2h0LCBsYXNlciBhY3Jvc3MgdGhlIHRvcC4gUG9ydGFsIG92ZXIgdGhlIGxhc2VyLlxuICAgIGlkOiBcIjUtMThcIixcbiAgICBidWlsZChiKSB7XG4gICAgICBiLmZyYW1lKCk7XG4gICAgICBiLmJveCg1LCA4LCAyMiwgMTkpO1xuICAgICAgYi5nYXRlKDEsIDEzLCA0LCAxMywgXCJVXCIpO1xuICAgICAgYi5nYXRlKDEzLCAyMCwgMTMsIDI2LCBcIkxcIik7XG4gICAgICBiLmxhc2VyKDEzLCAxLCAxMywgNywgMCk7XG4gICAgICBiLnNhdygyLjUsIDE3LCAxMywgMS41LCAwLCAxLjgpO1xuICAgICAgYi5zYXcoMjQuNSwgNSwgMTMsIDEuNSwgMCwgMi4yLCAxLjUpO1xuICAgICAgYi5sYXNlcigxLCAxMCwgNCwgMTAsIDIuNiwgMS4zKTtcbiAgICAgIGIubGFzZXIoMjMsIDksIDI2LCA5LCAyLjQsIDEuMiwgMC42KTtcbiAgICAgIGIucG9ydCg0LCA0LCAyNC41LCAxNCk7XG4gICAgICBiLnN0YXJ0KDMsIDI0KS5nb2FsKDI1LjYsIDEuNCk7XG4gICAgICBiLmdlbSgzLCAxMCkuZ2VtKDEwLCAzKS5nZW0oMjQuNSwgMjEpO1xuICAgIH1cbiAgfSxcbiAgeyAvLyBTd2l0Y2hiYWNrOiB0d28gdGhyZWUtaGlnaCBjaGFubmVscy4gUGFkcyBraWNrIHlvdSBiYWNrIG9mZiB0aGUgZmxvb3IsIHNwaWtlcyBiaXRlIGZyb20gdGhlIGNlaWxpbmcuXG4gICAgaWQ6IFwiNS0xOVwiLFxuICAgIGJ1aWxkKGIpIHtcbiAgICAgIGIuZnJhbWUoKTtcbiAgICAgIGIuaCgxNiwgMSwgMjYpLmgoMTcsIDEsIDI2KTtcbiAgICAgIGIuaCgxOCwgMSwgMjYpO1xuICAgICAgYi5zcGlrZXMoMTQsIDE4LCAxNywgMTgpLnNwaWtlcyg0LCAxOCwgNiwgMTgpO1xuICAgICAgYi5oKDIyLCAxLCAyNikuaCgyMywgMSwgMjYpO1xuICAgICAgYi5zcGlrZXMoMTEsIDIzLCAxNCwgMjMpLnNwaWtlcygyMSwgMjMsIDIzLCAyMyk7XG4gICAgICBiLnB1dChcIjxcIiwgOCwgMjYpLnB1dChcIjxcIiwgMTcsIDI2KTtcbiAgICAgIGIubGFzZXIoNSwgMjQsIDUsIDI2LCAzLjIsIDIuMik7XG4gICAgICBiLnNhdygxMi41LCAyMCwgMTIsIDAsIDIuNCwgMi4wKTtcbiAgICAgIGIucHV0KFwiPlwiLCAyMCwgMjEpLnB1dChcIj5cIiwgOSwgMjEpO1xuICAgICAgYi5wb3J0KDI1LCAyNS4yLCAyNSwgMjAuMik7XG4gICAgICBiLnBvcnQoMiwgMjAuMiwgNCwgMTQuMik7XG4gICAgICBiLnN0YXJ0KDIsIDI1LjIpLmdvYWwoMjUuNiwgMTQuNik7XG4gICAgICBiLmdlbSg1LCAyNS42KS5nZW0oMTUsIDIwLjYpLmdlbSgxNSwgMTQuNik7XG4gICAgfVxuICB9LFxuICB7IC8vIEZpbmFsIGV4YW06IHNhdyBhbmQgYmVhbSwgdXAgdGhyb3VnaCB0aGUgcG9ydGFsLCBrZXkgb3ZlciB0aGUgc3Bpa2VzLCB0aHJvdWdoIHRoZSBkb29yLCBwb3J0YWwgYWdhaW4sIHRoZW4gZmlnaHQgdGhlIGhlYWR3aW5kIHRvIHRoZSBnb2FsLlxuICAgIGlkOiBcIjUtMjBcIixcbiAgICBidWlsZChiKSB7XG4gICAgICBiLmZyYW1lKCk7XG4gICAgICBiLmgoOSwgMSwgMjYpLmgoMTgsIDEsIDI2KTtcbiAgICAgIC8vIGZsb29yIDM6IHNhdywgdGhlbiBhIGZsYXNoaW5nIGJlYW0sIHRoZW4gdGhlIHBvcnRhbFxuICAgICAgYi5oKDIxLCA2LCAxMik7XG4gICAgICBiLnNhdyg5LCAyNCwgMTMsIDAsIDMuMCwgMS44KTtcbiAgICAgIGIubGFzZXIoMTcsIDE5LCAxNywgMjYsIDMuMiwgMi4yKTtcbiAgICAgIGIucG9ydCgyNCwgMjUuMiwgMywgMTYuMik7XG4gICAgICAvLyBmbG9vciAyOiBzcGlrZXMgdW5kZXIsIHNwaWtlcyBvdmVyLCBhIGtleSB0byBmZXRjaCwgYSBkb29yIHRvIGNyb3NzXG4gICAgICBiLnNwaWtlcyg4LCAxNywgMTMsIDE3KS5zcGlrZXMoMTUsIDEwLCAxOCwgMTApO1xuICAgICAgYi5sYXNlcig2LCAxMCwgNiwgMTcsIDMuNCwgMS42KTtcbiAgICAgIGIua2V5KDEyLCAxMS42KTtcbiAgICAgIGIuZG9vcigyMCwgMTAsIDIwLCAxNyk7XG4gICAgICBiLnBvcnQoMjQsIDE2LjIsIDMsIDcuMik7XG4gICAgICAvLyBmbG9vciAxOiBhIGhlYWR3aW5kIGJldHdlZW4geW91IGFuZCB0aGUgY29ybmVyXG4gICAgICBiLnNhdyg4LCA0LjUsIDEzLCAwLCAyLjUsIDIuMCk7XG4gICAgICBiLmZhbigxMSwgMSwgMjYsIDgsIFwiTFwiLCA3MDApO1xuICAgICAgYi5zdGFydCgzLCAyNS42KS5nb2FsKDI1LjYsIDcuNik7XG4gICAgICBiLmdlbSgxMywgMjUuNikuZ2VtKDQsIDExKS5nZW0oMjAsIDIpO1xuICAgIH1cbiAgfSxcbl07XG4iLCAiLy8gR0VORVJBVEVEIGJ5IHRvb2xzL3ZhbGlkYXRlLWxldmVscy5tanMgXHUyMDE0IGRvIG5vdCBlZGl0IGJ5IGhhbmQuXG4vLyBwYXI6IHNlY29uZHMgZm9yIHRoZSB0aW1lIHN0YXIgXHUwMEI3IHQvdGc6IGJvdCBiZXN0IHRpbWUgKHBsYWluIC8gYWxsIGdlbXMpIFx1MDBCNyBkOiBkaWZmaWN1bHR5IFx1MDBCNyBwYXRoOiBib3Qgcm91dGUgKGhpbnQpXG5leHBvcnQgY29uc3QgTUVUQSA9IHtcbiAgXCIxLTFcIjoge1wicGFyXCI6MTEsXCJ0XCI6Mi4wMyxcInRnXCI6Mi4wMyxcImRcIjoxMy44LFwicGF0aFwiOltbLTE0Miw0NF0sWy0xMzAsNDRdLFstNTAsNDRdLFs5OCw0Ml0sWzE1OSwtMjNdLFsxNzAsLTE1NV0sWzE3MywtMTcwXV19LFxuICBcIjEtMlwiOiB7XCJwYXJcIjoxNCxcInRcIjoyLjM3LFwidGdcIjozLjE1LFwiZFwiOjEyLjMsXCJwYXRoXCI6W1sxNDMsNDRdLFsxMzgsNDRdLFsxMDAsNDRdLFsxMCw0NF0sWy0xMTMsNDBdLFstMTYwLC03XSxbLTgyLC05Ml0sWzQzLC0xODBdLFsxNzcsLTE2Nl1dfSxcbiAgXCIxLTNcIjoge1wicGFyXCI6MTUsXCJ0XCI6My42MyxcInRnXCI6My42MyxcImRcIjoxNS4zLFwicGF0aFwiOltbLTE1NywxMDRdLFstMTUzLDEwNF0sWy0xMTUsMTA0XSxbLTI1LDEwNF0sWzk4LDEwM10sWzE2OCw2OF0sWzk0LDBdLFstMjUsMjVdLFstMTc0LDExXSxbLTEyMSwtNTRdLFstMzYsLTkxXSxbNzYsLTk3XSxbMTc5LC0xNTldLFsxNzQsLTE2OV1dLFwibVwiOjEsXCJtcFwiOltbMTU4LDEwNF0sWzE1MywxMDRdLFsxMTUsMTA0XSxbMjUsMTA0XSxbLTk4LDEwM10sWy0xNjgsNjhdLFstOTQsMF0sWzI1LDI1XSxbMTc0LDExXSxbMTIxLC01NF0sWzM2LC05MV0sWy03NiwtOTddLFstMTgwLC0xNTldLFstMTc5LC0xNjddXX0sXG4gIFwiMS00XCI6IHtcInBhclwiOjE1LFwidFwiOjEuNTksXCJ0Z1wiOjMuNixcImRcIjoxMy40LFwicGF0aFwiOltbLTk3LDc0XSxbLTkzLDc0XSxbLTU4LDc0XSxbMTAsNTddLFs4NiwtMTRdLFsxODEsLTEyOV0sWzE3MCwtMTcxXV19LFxuICBcIjEtNVwiOiB7XCJwYXJcIjoxNixcInRcIjoyLjYzLFwidGdcIjozLjgyLFwiZFwiOjE2LjIsXCJwYXRoXCI6W1stMTQyLC0xODFdLFstMTQyLC0xODFdLFstMTM4LC0xODFdLFstMTI1LC0xODFdLFstMTAwLC0xODFdLFstNjEsLTE4MV0sWy0xMCwtMTc3XSxbNTEsLTE2NV0sWzExNSwtMTQwXSxbMTc4LC0xMDFdLFsxNTgsLTUxXSxbMTI4LDEwXSxbOTEsODBdLFs0NiwxNTddLFstMiwxNjJdLFstNTMsMTQ2XSxbLTEwOCwxNDVdLFstMTY5LDE1N10sWy0xNzMsMTY4XV19LFxuICBcIjEtNlwiOiB7XCJwYXJcIjoxNSxcInRcIjozLjE4LFwidGdcIjozLjU3LFwiZFwiOjE1LjUsXCJwYXRoXCI6W1stODIsLTYxXSxbLTc4LC02MV0sWy02MSwtNjFdLFstNTgsLTU4XSxbLTU4LC0yNF0sWy01OCw0Nl0sWy0yMywxNDVdLFs2MywxNTZdLFsxNzcsMTE1XSxbMTQwLDQ4XSxbOTYsLTldLFsxMDQsLTY1XV0sXCJtXCI6MSxcIm1wXCI6W1s4MywtNjFdLFs3OCwtNjFdLFs2MSwtNjFdLFs1OSwtNThdLFs1OSwtMjRdLFs1OCw0Nl0sWzIzLDE0NV0sWy02MywxNTZdLFstMTc3LDExNV0sWy0xNDAsNDhdLFstOTYsLTEwXSxbLTEwMiwtNjNdXX0sXG4gIFwiMS03XCI6IHtcInBhclwiOjEzLFwidFwiOjEuOTMsXCJ0Z1wiOjIuOTIsXCJkXCI6MTEuOSxcInBhdGhcIjpbWy0xNTcsMTE5XSxbLTE1MywxMTldLFstMTE1LDExOV0sWy0yNSwxMTRdLFs5OSw3NV0sWzE2NiwtMTVdLFsxNTMsLTEzN10sWzE2NiwtMTc3XV0sXCJtXCI6MSxcIm1wXCI6W1sxNTgsMTE5XSxbMTUzLDExOV0sWzExNSwxMTldLFsyNSwxMTRdLFstOTksNzVdLFstMTY2LC0xNV0sWy0xNTMsLTEzN10sWy0xNjYsLTE3N11dfSxcbiAgXCIxLThcIjoge1wicGFyXCI6MTUsXCJ0XCI6Mi42NixcInRnXCI6My4zNCxcImRcIjoyMy40LFwicGF0aFwiOltbLTE0MiwxMTldLFstMTMwLDExOV0sWy01OCwxMTldLFsxMiwxMDZdLFstMSw2NV0sWy05MSw0NF0sWy0xNzQsLTY4XSxbLTE3MSwtMTcyXV0sXCJtXCI6MSxcIm1wXCI6W1sxNDMsMTE5XSxbMTMwLDExOV0sWzU4LDExOV0sWy0xMiwxMDZdLFsxLDY1XSxbOTEsNDRdLFsxNzQsLTY4XSxbMTc0LC0xNzBdXX0sXG4gIFwiMS05XCI6IHtcInBhclwiOjIwLFwidFwiOjEuMzEsXCJ0Z1wiOjUuMTgsXCJkXCI6MTUuNCxcInBhdGhcIjpbWy0xNTcsLTE4MV0sWy0xNTcsLTE4MV0sWy0xNTMsLTE4MV0sWy0xNDAsLTE4MV0sWy0xMTUsLTE4MV0sWy03NiwtMTgxXSxbLTI0LC0xODJdLFs0MCwtMTgxXSxbMTE1LC0xNzddLFsxNzQsLTE2OF1dfSxcbiAgXCIxLTEwXCI6IHtcInBhclwiOjI1LFwidFwiOjYuODgsXCJ0Z1wiOjYuODgsXCJkXCI6NjkuNixcInBhdGhcIjpbWy0xNTcsMTQ5XSxbLTE1MywxNDldLFstMTE1LDE0OV0sWy0yNSwxNDldLFs5OCwxNDldLFsxNjcsMTMzXSxbMTU5LDYzXSxbMTcwLC01N10sWzE0NSwtMTcxXSxbNzAsLTE2Ml0sWy01NCwtMTc4XSxbLTE3MSwtMTU4XSxbLTE2OSwtOTVdLFstMTcwLDE0XSxbLTEyNCw4OV0sWy0zMCw4M10sWzk5LDY0XSxbNzksLTVdLFs2OSwtMTA1XSxbNiwtNzhdLFstOTUsLTY0XSxbLTY2LDFdLFstNDUsLTE0XSxbMjAsM11dLFwibVwiOjEsXCJtcFwiOltbMTU4LDE0OV0sWzE1NywxNDldLFsxNTMsMTQ5XSxbMTQxLDE0OV0sWzEyMSwxNDldLFs5NCwxNDldLFs2MSwxNDldLFsyMSwxNDldLFstMjQsMTQ5XSxbLTc1LDE0OV0sWy0xMzAsMTQ5XSxbLTE4MSwxNDFdLFstMTYwLDEyMF0sWy0xNTIsODVdLFstMTU5LDM3XSxbLTE2MiwtMjRdLFstMTU5LC05NF0sWy0xNDYsLTE3Ml0sWy0xMjMsLTE1Nl0sWy04NywtMTU2XSxbLTM4LC0xNjNdLFsyMiwtMTY0XSxbOTMsLTE1OV0sWzE3MywtMTQ4XSxbMTU1LC0xMzFdLFsxNTksLTEwN10sWzE3NywtNzJdLFsxNzYsLTI0XSxbMTYwLDMzXSxbMTMzLDk0XSxbOTMsODddLFs0MSw3OF0sWy0xOSw3OV0sWy04NCw2OF0sWy05MCw0M10sWy03Nyw2XSxbLTgwLC00MV0sWy03MCwtOTNdLFstNDcsLTkxXSxbLTEwLC03Nl0sWzM3LC03OF0sWzg5LC02OF0sWzkyLC00NF0sWzY5LC03XSxbNTEsLTEyXSxbMjQsLTE4XSxbLTE2LC0xOF0sWy0yMSwtMThdXX0sXG4gIFwiMS0xMVwiOiB7XCJwYXJcIjoxMyxcInRcIjoyLjIzLFwidGdcIjoyLjczLFwiZFwiOjE0LFwicGF0aFwiOltbLTE1NywxNjRdLFstMTQ1LDE2NF0sWy03MywxNjNdLFsyMywxMDldLFsxMjAsLTRdLFsyNywtMTM1XSxbMTMsLTE2N11dLFwibVwiOjEsXCJtcFwiOltbMTU4LDE2NF0sWzE0NSwxNjRdLFs3MywxNjNdLFstMjMsMTA5XSxbLTEyMCwtNF0sWy0yNywtMTM1XSxbLTEzLC0xNjddXX0sXG4gIFwiMS0xMlwiOiB7XCJwYXJcIjoyMixcInRcIjoyLjIzLFwidGdcIjo1Ljc4LFwiZFwiOjEzLjQsXCJwYXRoXCI6W1stMTU3LC0xODFdLFstMTU3LC0xODFdLFstMTUzLC0xODFdLFstMTQwLC0xODFdLFstMTE1LC0xODFdLFstNzYsLTE4MV0sWy0yNSwtMTc4XSxbMzgsLTE2OV0sWzEwOSwtMTUxXSxbMTgyLC0xMjFdLFsxNTIsLTgwXSxbMTIxLC0yNl0sWzgzLC0xMF0sWzM3LC0yNV0sWy0xOSwtMzBdLFstNzIsLTIzXV0sXCJtXCI6MSxcIm1wXCI6W1sxNTgsLTE4MV0sWzE0NSwtMTgxXSxbNzMsLTE4MV0sWzMsLTE4MV0sWzksLTE4MV0sWzI0LC0xODFdLFstNDAsLTE4MV0sWy0xODEsLTE0MF0sWy0xMTIsLTE0XSxbNCwtMjNdLFs2MiwtMV1dfSxcbiAgXCIxLTEzXCI6IHtcInBhclwiOjE2LFwidFwiOjIuNDcsXCJ0Z1wiOjMuNzIsXCJkXCI6MTQuOCxcInBhdGhcIjpbWy0xNSwtNTJdLFstMTYsLTc2XSxbLTUsLTY4XSxbMjUsLTM4XSxbNzcsMTRdLFsxMzEsNTldLFsxODAsNDZdLFsxNjQsLTI0XSxbMTc5LC0xMzddLFsxODAsLTE2OF1dLFwibVwiOjEsXCJtcFwiOltbMTUsLTUyXSxbMTYsLTc2XSxbNSwtNjhdLFstMjUsLTM4XSxbLTc3LDE0XSxbLTEzMSw1OV0sWy0xODAsNDZdLFstMTY0LC0yNF0sWy0xNzksLTEzN10sWy0xODAsLTE2OF1dfSxcbiAgXCIxLTE0XCI6IHtcInBhclwiOjE0LFwidFwiOjEuOCxcInRnXCI6My4yNyxcImRcIjoyMixcInBhdGhcIjpbWzAsMTY0XSxbLTUsMTY0XSxbLTM2LDE2NF0sWy02OSwxNDVdLFstNjcsNzldLFstMjcsLTI0XSxbMTQsLTE3MV1dLFwibVwiOjEsXCJtcFwiOltbMCwxNjRdLFs1LDE2NF0sWzM2LDE2NF0sWzY5LDE0NV0sWzcxLDc3XSxbNTUsLTQwXSxbLTExLC0xNDddLFstMiwtMTY3XV19LFxuICBcIjEtMTVcIjoge1wicGFyXCI6MTgsXCJ0XCI6NC4zNixcInRnXCI6NC41MixcImRcIjoxOC41LFwicGF0aFwiOltbLTE1NywxNjRdLFstMTU3LDEzMl0sWy0xNTIsNDRdLFstMTIwLC03OF0sWy0xMDgsLTE3OF0sWy01MywtMTEyXSxbLTIxLDFdLFstMTEsMTQzXSxbNTMsMTM3XSxbNzYsNTJdLFs4OCwtNTldLFsxMDIsLTE2Ml0sWzE1NCwtMTQ0XSxbMTcyLC01MV0sWzE4MSw4M10sWzE3OCwxNjldXSxcIm1cIjoxLFwibXBcIjpbWzE1OCwxNjRdLFsxNTgsMTMyXSxbMTUyLDQ0XSxbMTIwLC03OF0sWzEwOCwtMTc4XSxbNTMsLTExMl0sWzIxLDFdLFsxMSwxNDNdLFstNTMsMTM3XSxbLTc2LDUyXSxbLTg4LC01OV0sWy0xMDIsLTE2Ml0sWy0xNTQsLTE0NF0sWy0xNzIsLTUxXSxbLTE4MSw4M10sWy0xNzksMTY5XV19LFxuICBcIjEtMTZcIjoge1wicGFyXCI6MjQsXCJ0XCI6My45MyxcInRnXCI6Ni4zOSxcImRcIjo2Ni4zLFwicGF0aFwiOltbLTE0MiwtMTgxXSxbLTEzOCwtMTgxXSxbLTEwMCwtMTgxXSxbLTEwLC0xNzddLFsxMTUsLTE0MF0sWzE1OCwtNTFdLFsxMzksOV0sWzEzOSwtMV0sWzkzLC0xNF0sWzU4LC00NV0sWzMwLC02NF0sWy01LC0zNV0sWy02Niw0Ml0sWy0xNjEsMTU0XSxbLTE3MywxNjhdXSxcIm1cIjoxLFwibXBcIjpbWzE0MywtMTgxXSxbMTM4LC0xODFdLFsxMDAsLTE4MV0sWzEwLC0xNzddLFstMTE1LC0xNDBdLFstMTU4LC01MV0sWy0xMzksOV0sWy0xMzksLTFdLFstOTMsLTE0XSxbLTU4LC00NV0sWy0zMCwtNjRdLFs1LC0zNV0sWzY2LDQyXSxbMTYxLDE1NF0sWzE3MywxNjhdXX0sXG4gIFwiMS0xN1wiOiB7XCJwYXJcIjoxNixcInRcIjoxLjgsXCJ0Z1wiOjMuODcsXCJkXCI6NTEuNyxcInBhdGhcIjpbWzAsNzRdLFs1LDc0XSxbMzYsNzRdLFs3NCw3NF0sWzEwOCw0M10sWzE0MiwtNDNdLFsxNzUsLTE2OF1dLFwibVwiOjEsXCJtcFwiOltbMCw3NF0sWzAsNzRdLFstNSw3NF0sWy0xNyw3NF0sWy0zNyw3NF0sWy02NCw3NF0sWy05Niw3MF0sWy0xMjgsNTJdLFstMTU2LDIwXSxbLTE3OSwtMjZdLFstMTc1LC04M10sWy0xNjksLTE1Ml0sWy0xNjYsLTE3N11dfSxcbiAgXCIxLTE4XCI6IHtcInBhclwiOjE5LFwidFwiOjMuODMsXCJ0Z1wiOjQuODMsXCJkXCI6NjguNyxcInBhdGhcIjpbWy0xNTcsMTA0XSxbLTE1MywxMDRdLFstMTE1LDEwNF0sWy0yNSwxMDRdLFs5OCwxMDRdLFsxNjgsODhdLFsxNDQsMjVdLFs4OSwtMjZdLFstMTgsLTVdLFstMTU2LC0yMl0sWy0xMzMsLTkxXSxbLTQ5LC0xNzVdLFs2NCwtMTU3XSxbMTcyLC0xNzNdXSxcIm1cIjoxLFwibXBcIjpbWzE1OCwxMDRdLFsxNTMsMTA0XSxbMTE1LDEwNF0sWzI1LDEwNF0sWy05OCwxMDRdLFstMTY4LDg4XSxbLTE0NCwyNV0sWy04OSwtMjZdLFsxOCwtNV0sWzE1NiwtMjJdLFsxMzMsLTkxXSxbNDksLTE3NV0sWy02NCwtMTU3XSxbLTE2OSwtMTc2XV19LFxuICBcIjEtMTlcIjoge1wicGFyXCI6MTUsXCJ0XCI6MS4zMSxcInRnXCI6My40NSxcImRcIjozMy41LFwicGF0aFwiOltbLTE1NywxNjRdLFstMTQ1LDE2NF0sWy03MywxNDhdLFstMSw0NV0sWzMsOF1dLFwibVwiOjEsXCJtcFwiOltbMTU4LDE2NF0sWzE1NywxNjRdLFsxNTMsMTY0XSxbMTQxLDE2NF0sWzEyMiwxNjRdLFsxMDIsMTU2XSxbODIsMTM0XSxbNjAsOThdLFszMCw1Ml0sWzMsMTNdXX0sXG4gIFwiMS0yMFwiOiB7XCJwYXJcIjoyMyxcInRcIjozLjUxLFwidGdcIjo2LjEyLFwiZFwiOjQ1LjUsXCJwYXRoXCI6W1stMTU3LDEzNF0sWy0xNTMsMTM0XSxbLTExNSwxMzRdLFstMjUsMTM0XSxbOTgsMTM0XSxbMTY4LDExM10sWzk3LDQ3XSxbLTQsNDNdLFstMTMxLDMwXSxbLTE0OSwzXSxbLTY4LC02NV0sWzYwLC0xNDNdLFsxNzAsLTE3M11dLFwibVwiOjEsXCJtcFwiOltbMTU4LDEzNF0sWzE1MywxMzRdLFsxMTUsMTM0XSxbMjUsMTM0XSxbLTk4LDEzNF0sWy0xNjgsMTEzXSxbLTk3LDQ3XSxbNCw0M10sWzEzMSwzMF0sWzE0OSwzXSxbNjgsLTY1XSxbLTYwLC0xNDNdLFstMTY4LC0xNzNdXX0sXG4gIFwiMi0xXCI6IHtcInBhclwiOjE3LFwidFwiOjIuODYsXCJ0Z1wiOjQuMDYsXCJkXCI6MTgsXCJwYXRoXCI6W1stMTU3LDE0XSxbLTE0NSwxM10sWy03Myw2XSxbLTQ5LC03NV0sWy0xMzcsLTY5XSxbLTE1MiwtMTU3XSxbLTQ0LC0xNTldLFsxMzUsLTE4MV0sWzE2NywtMTc5XV19LFxuICBcIjItMlwiOiB7XCJwYXJcIjo5LFwidFwiOjEuNjMsXCJ0Z1wiOjEuNjMsXCJkXCI6MTguMSxcInBhdGhcIjpbWy0xNTcsNDRdLFstMTUzLDQ0XSxbLTEyMiw0MF0sWy0xMTIsLTExXSxbLTczLC04NF0sWzk0LC03MV0sWzE3NSwtNzldXSxcIm1cIjoxLFwibXBcIjpbWzE1OCw0NF0sWzE1Myw0NF0sWzEyMiw0MF0sWzExMiwtMTFdLFs3MywtODRdLFstOTQsLTcxXSxbLTE3NCwtODBdXX0sXG4gIFwiMi0zXCI6IHtcInBhclwiOjExLFwidFwiOjIuMjEsXCJ0Z1wiOjIuMjEsXCJkXCI6MTMuNCxcInBhdGhcIjpbWy0xNjMsMTA0XSxbLTE1NSw4MF0sWy0xMTEsMzRdLFstMTQsMTRdLFsxNDMsMTU4XSxbMTQ0LDEzOF0sWzE0MSw1NV0sWzE1NiwtNzNdLFsxNjcsLTEyOV1dLFwibVwiOjEsXCJtcFwiOltbMTY0LDEwNF0sWzE1NSw4MF0sWzExMSwzNF0sWzE0LDE0XSxbLTE0MywxNThdLFstMTQ0LDEzOF0sWy0xNDEsNTVdLFstMTU2LC03M10sWy0xNjcsLTEyOV1dfSxcbiAgXCIyLTRcIjoge1wicGFyXCI6MjEsXCJ0XCI6Mi4wOSxcInRnXCI6NS40NSxcImRcIjoyMy40LFwicGF0aFwiOltbLTE1NywtMTgxXSxbLTE1MywtMTgxXSxbLTEyMiwtMTgxXSxbLTgzLC0xODFdLFstNDUsLTEzOF0sWzE2LC00MF0sWzg2LC0xMl0sWzE3OSwtMzJdXSxcIm1cIjoxLFwibXBcIjpbWzE1OCwtMTgxXSxbMTUzLC0xODFdLFsxMjIsLTE4MV0sWzgzLC0xODFdLFs0NSwtMTM4XSxbLTE2LC00MF0sWy04NiwtMTJdLFstMTcwLC0zN11dfSxcbiAgXCIyLTVcIjoge1wicGFyXCI6MTUsXCJ0XCI6My4wNCxcInRnXCI6My40LFwiZFwiOjIyLjEsXCJwYXRoXCI6W1stMTU3LC0xMDZdLFstMTU3LC0xMDZdLFstMTUzLC0xMDZdLFstMTQ0LC0xMDZdLFstMTIwLC0xMDZdLFstNDIsLTExMF0sWy0yNCwtMTAwXSxbLTM1LC04N10sWy0zMiwtODNdLFstMTQsLTgxXSxbMTksLTc2XSxbNjEsLTYyXSxbMTA5LC0zNl0sWzE1MSw0XSxbMTM0LDU5XSxbMTA5LDEyM10sWzc0LDE3OF0sWzI3LDE1Ml0sWy0zMiwxMjNdLFstMTAwLDg4XSxbLTE3Myw0Ml0sWy0xNzgsMjhdXSxcIm1cIjoxLFwibXBcIjpbWzE1OCwtMTA2XSxbMTU3LC0xMDZdLFsxNTMsLTEwNl0sWzE0MSwtMTA2XSxbODksLTEwN10sWzEyLC0xMTBdLFsxNSwtNzNdLFs3LC01MF0sWy05LC00MV0sWy0zMiwtNDZdLFstNjMsLTY0XSxbLTEwMCwtOTNdLFstMTQyLC0yNV0sWy0xMzgsMjJdLFstMTE3LDUxXSxbLTg5LDY1XSxbLTQ5LDcwXSxbMCw2NV0sWzU5LDUyXSxbMTI4LDMyXSxbMTY5LDE3XV19LFxuICBcIjItNlwiOiB7XCJwYXJcIjo4LFwidFwiOjEuMjksXCJ0Z1wiOjEuMjksXCJkXCI6MTYuNSxcInBhdGhcIjpbWy0xNTcsLTkxXSxbLTE1MywtOTFdLFstMTE1LC05MV0sWy0yNCwtOTJdLFsxMTUsLTg4XSxbMTY3LC04Nl1dfSxcbiAgXCIyLTdcIjoge1wicGFyXCI6MjUsXCJ0XCI6Mi44NyxcInRnXCI6Ni43LFwiZFwiOjE0LjYsXCJwYXRoXCI6W1stMTU3LDQ0XSxbLTE1Nyw0NF0sWy0xNTMsNDRdLFstMTQ0LDQ0XSxbLTEzMSw0NF0sWy0xMTIsNDRdLFstODksNDRdLFstNjEsNDFdLFstMzAsMjddLFstMzgsLTFdLFstMzgsLTM4XSxbLTMxLC02OV0sWy0yOCwtOTRdLFstMjYsLTEwNV0sWy0yMCwtMTAzXSxbLTYsLTEwNV0sWzIwLC0xMTFdLFs1NSwtMTI4XSxbMTAyLC0xNTFdLFsxNjEsLTE3NF0sWzE2OCwtMTc3XV0sXCJtXCI6MSxcIm1wXCI6W1sxNTgsNDRdLFsxNTMsNDRdLFsxMjIsNDRdLFs4Myw0NF0sWzQ1LDI1XSxbMzIsLTM0XSxbMjgsLTkzXSxbMTksLTEwM10sWy0yNywtMTEwXSxbLTEyMCwtMTQzXSxbLTE4MCwtMTY2XV19LFxuICBcIjItOFwiOiB7XCJwYXJcIjoxNCxcInRcIjoxLjYxLFwidGdcIjozLjA5LFwiZFwiOjE3LjgsXCJwYXRoXCI6W1stMTU3LC0xMjFdLFstMTU3LC0xMjFdLFstMTUzLC0xMjFdLFstMTE1LC0xMjFdLFstMjQsLTEyMV0sWzExNSwtMTE3XSxbMTc0LC0xMDhdXX0sXG4gIFwiMi05XCI6IHtcInBhclwiOjE5LFwidFwiOjEuODUsXCJ0Z1wiOjQuOTksXCJkXCI6MTQuMyxcInBhdGhcIjpbWzAsMTY0XSxbLTUsMTY0XSxbLTQwLDE2NF0sWy0xMDgsMTQxXSxbLTE3NCw2NV0sWy0xNTIsLTUxXSxbLTEwNSwtMTUxXSxbLTEwNSwtMTcwXV0sXCJtXCI6MSxcIm1wXCI6W1swLDE2NF0sWzUsMTY0XSxbNDAsMTY0XSxbMTA4LDE0MV0sWzE3NCw2NV0sWzE1MiwtNTFdLFsxMDUsLTE1MV0sWzEwNSwtMTcwXV19LFxuICBcIjItMTBcIjoge1wicGFyXCI6MTYsXCJ0XCI6Mi4xNyxcInRnXCI6My43NSxcImRcIjoxOSxcInBhdGhcIjpbWzE4MiwtMTgxXSxbMTc3LC0xODFdLFsxMzksLTE4MV0sWzQ5LC0xODFdLFstNzksLTc3XSxbLTE2NCwyXSxbLTE1MSw1OV0sWy0xODAsMTQ0XSxbLTE3NiwxNjldXSxcIm1cIjoxLFwibXBcIjpbWy0xODEsLTE4MV0sWy0xODEsLTE4MV0sWy0xNzcsLTE4MV0sWy0xNjQsLTE4MV0sWy0xMzksLTE4MV0sWy0xMDAsLTE4MV0sWy00OCwtMTgxXSxbMTYsLTEzMF0sWzkxLC01NF0sWzE3MywyNl0sWzE4Miw3OF0sWzEzOSwyOF0sWzE0NiwzNl0sWzE3MiwxMDNdLFsxNzUsMTcxXV19LFxuICBcIjItMTFcIjoge1wicGFyXCI6MjMsXCJ0XCI6MS44NSxcInRnXCI6Ni4wMSxcImRcIjoxNS4zLFwicGF0aFwiOltbMCwxNjRdLFswLDE2NF0sWzQsMTY0XSxbMTMsMTY0XSxbMjcsMTY0XSxbNDYsMTYzXSxbNjksMTU1XSxbOTcsMTMzXSxbMTI5LDk3XSxbMTY4LDUyXSxbMTgxLC00XSxbMTgxLC02OV0sWzE4MiwtMTQzXSxbMTgyLC0xNjldXSxcIm1cIjoxLFwibXBcIjpbWzAsMTY0XSxbLTEyLDE2NF0sWy04NCwxNTNdLFstMTgxLDU4XSxbLTE4MSwtOTBdLFstMTgxLC0xNjddXX0sXG4gIFwiMi0xMlwiOiB7XCJwYXJcIjoyMixcInRcIjo0LjM0LFwidGdcIjo1Ljg4LFwiZFwiOjI3LjUsXCJwYXRoXCI6W1stMTU3LDEwNF0sWy0xNTMsMTA0XSxbLTExNSwxMDRdLFstMjUsMTA0XSxbOTgsMTAzXSxbMTY3LDY4XSxbMTIzLDVdLFs4Miw1XSxbMTIsLTFdLFstMTA1LC0yXSxbLTE1NiwtMjhdLFstMTA2LC0xMDZdLFstMzQsLTkwXSxbNjcsLTEwNF0sWzE2NiwtMTM2XSxbMTcwLC0xNzFdXSxcIm1cIjoxLFwibXBcIjpbWzE1OCwxMDRdLFsxNTMsMTA0XSxbMTE1LDEwNF0sWzI1LDEwNF0sWy05OCwxMDNdLFstMTY3LDY4XSxbLTEyMyw1XSxbLTgyLDVdLFstMTIsLTFdLFsxMDUsLTJdLFsxNTYsLTI4XSxbMTA2LC0xMDZdLFszNCwtOTBdLFstNjcsLTEwNF0sWy0xNjYsLTEzNl0sWy0xNzAsLTE3MV1dfSxcbiAgXCIyLTEzXCI6IHtcInBhclwiOjIyLFwidFwiOjMuMzgsXCJ0Z1wiOjUuNzgsXCJkXCI6MjkuMyxcInBhdGhcIjpbWy0xNTcsLTE4MV0sWy0xNTMsLTE4MV0sWy0xMjIsLTE4MV0sWy04MywtMTgxXSxbLTU2LC0xNTddLFstNjAsLTQ5XSxbLTY5LC05NF0sWy01MCwtMTQ4XSxbLTE2LC00Nl0sWy0xLC00XSxbNDIsMTRdLFsxMzMsMl0sWzE2NiwwXV0sXCJtXCI6MSxcIm1wXCI6W1sxNTgsLTE4MV0sWzE1MywtMTgxXSxbMTIyLC0xODFdLFs4MywtMTgxXSxbNTYsLTE1N10sWzYwLC00OV0sWzY5LC05NF0sWzUwLC0xNDhdLFsxNiwtNDZdLFsxLC00XSxbLTQyLDE0XSxbLTEzMCwtMV0sWy0xNjYsMV1dfSxcbiAgXCIyLTE0XCI6IHtcInBhclwiOjE3LFwidFwiOjIuNjMsXCJ0Z1wiOjQuMTksXCJkXCI6MzcuMSxcInBhdGhcIjpbWy0xNTcsMTY0XSxbLTE0NSwxNjRdLFstNzMsMTU2XSxbLTEsNjhdLFs1NCwtMTRdLFs4OSwtMTQ1XSxbODksLTE1NV0sWzkwLC0xNzddXSxcIm1cIjoxLFwibXBcIjpbWzE1OCwxNjRdLFsxNTMsMTY0XSxbMTE4LDE2NF0sWzUwLDE0N10sWy0yMiw3NV0sWy04MCwtNDddLFstOTcsLTE2OV1dfSxcbiAgXCIyLTE1XCI6IHtcInBhclwiOjE0LFwidFwiOjMuMTUsXCJ0Z1wiOjMuMTUsXCJkXCI6MjcuNixcInBhdGhcIjpbWy0xNTcsLTEwNl0sWy0xNTcsLTEwNl0sWy0xNTMsLTEwNl0sWy0xMDksLTEwNl0sWzY5LC0xMDJdLFsxNTAsLTQ3XSxbODQsLTU5XSxbLTgsLTIyXSxbLTI2LDE3XSxbLTQyLDI0XSxbLTExNCwxNV0sWy0xNjcsMTNdXSxcIm1cIjoxLFwibXBcIjpbWzE1OCwtMTA2XSxbMTU4LC0xMDZdLFsxNTMsLTEwNl0sWzEwOSwtMTA2XSxbLTY5LC0xMDJdLFstMTUwLC00N10sWy04NCwtNTldLFs4LC0yMl0sWzI2LDE3XSxbNDIsMjRdLFsxMTUsMTldLFsxNjgsMThdXX0sXG4gIFwiMi0xNlwiOiB7XCJwYXJcIjoxNyxcInRcIjo0LjE2LFwidGdcIjo0LjE2LFwiZFwiOjQxLjMsXCJwYXRoXCI6W1stMTU3LC0xMDZdLFstMTYyLC0xMDZdLFstMTc5LC0xMDZdLFstMTgxLC0xMDNdLFstMTgxLC03M10sWy0xODEsLTQyXSxbLTE4MSwtNTBdLFstMTc3LC0xMDRdLFstMTQxLC05NV0sWy02MSwtODJdLFstNTUsLTE1XSxbLTQ0LDU0XSxbLTE0LDExNF0sWzcxLDEwM10sWzE4Miw4OV1dLFwibVwiOjEsXCJtcFwiOltbMTU4LC0xMDZdLFsxNjIsLTEwNl0sWzE3OSwtMTA2XSxbMTgyLC0xMDNdLFsxODIsLTczXSxbMTgyLC00Ml0sWzE4MiwtNTBdLFsxNzcsLTEwNF0sWzE0MSwtOTVdLFs2MSwtODJdLFs1NSwtMTVdLFs0NCw1NF0sWzE0LDExNF0sWy03MCw5OV0sWy0xNjcsNzhdXX0sXG4gIFwiMi0xN1wiOiB7XCJwYXJcIjoyMyxcInRcIjo1LjQ2LFwidGdcIjo2LjAxLFwiZFwiOjQ1LjEsXCJwYXRoXCI6W1stMTU3LC0xMDZdLFstMTU3LC0xMDZdLFstMTU3LC0xMDZdLFstMTU3LC0xMDZdLFstMTU3LC0xMDZdLFstMTU3LC0xMDZdLFstMTU3LC0xMDZdLFstMTU3LC0xMDZdLFstMTYyLC0xMDZdLFstMTc4LC0xMDZdLFstMTY2LC0xMDZdLFstNzAsLTEwN10sWzEyMywtMTA3XSxbMTI4LDEwXSxbNjYsNTRdLFstMTUsNzRdLFstOTYsMTE5XSxbLTE2Nyw5OF0sWy0xNjcsMjFdLFstMTY2LDFdXSxcIm1cIjoxLFwibXBcIjpbWzE1OCwtMTA2XSxbMTU4LC0xMDZdLFsxNTgsLTEwNl0sWzE3MCwtMTA2XSxbMTgyLC0xMDZdLFsxODIsLTg4XSxbMTgyLC0xMDVdLFsxNzAsLTEwNl0sWzksLTEwNl0sWy0xMzYsLTE5XSxbLTE2OCwxMTBdLFstMTQwLDE1M10sWy00OCwxNjddLFsxMjEsMTcwXSxbMTQzLDEzMl0sWzE2OSw0M10sWzE4MSwxMl1dfSxcbiAgXCIyLTE4XCI6IHtcInBhclwiOjE1LFwidFwiOjMuNixcInRnXCI6My42LFwiZFwiOjU1LjUsXCJwYXRoXCI6W1stMTU3LC0xMDZdLFstMTU3LC0xMDZdLFstMTUzLC0xMDZdLFstMTE1LC0xMDZdLFstMjUsLTEwMl0sWzU5LC05OF0sWzY2LC04N10sWzc2LC04OF0sWzc5LC04OF0sWzExMCwtODBdLFsxMTUsLTIyXSxbMTIzLDc0XSxbMTY3LDc5XV0sXCJtXCI6MSxcIm1wXCI6W1sxNTgsLTEwNl0sWzE1OCwtMTA2XSxbMTUzLC0xMDZdLFsxMTUsLTEwNl0sWzI1LC0xMDJdLFstNTksLTk4XSxbLTY2LC04N10sWy03NiwtODhdLFstNzksLTg4XSxbLTExMCwtODBdLFstMTE1LC0yMl0sWy0xMjMsNzRdLFstMTY3LDc5XV19LFxuICBcIjItMTlcIjoge1wicGFyXCI6MTgsXCJ0XCI6NC41MixcInRnXCI6NC41OCxcImRcIjo1NS40LFwicGF0aFwiOltbLTE1NywtMTgxXSxbLTE0NSwtMTgxXSxbLTYwLC0xODFdLFsxMTIsLTE2MV0sWzEzNSwtMTE2XSxbOTAsLTE3XSxbMzksLTM2XSxbLTY1LC02MF0sWy0xNjIsMF0sWy0xNjYsMTM2XSxbLTcxLDE0OV0sWzEwNSw3NV0sWzE2OCw0NV1dLFwibVwiOjEsXCJtcFwiOltbMTU4LC0xODFdLFsxNDUsLTE4MV0sWzYwLC0xODFdLFstMTEyLC0xNjFdLFstMTM1LC0xMTZdLFstOTAsLTE3XSxbLTM5LC0zNl0sWzY1LC02MF0sWzE2MiwwXSxbMTY2LDEzNl0sWzcxLDE0OV0sWy0xMDUsNzVdLFstMTY4LDQ1XV19LFxuICBcIjItMjBcIjoge1wicGFyXCI6MjAsXCJ0XCI6NS4zLFwidGdcIjo1LjMsXCJkXCI6NjEuMyxcInBhdGhcIjpbWy0xNTcsMTE5XSxbLTE1MywxMTldLFstMTE4LDExOV0sWy00NiwxMTldLFs1NCwxMTldLFsxNDgsMTE4XSxbMTY5LDkwXSxbOTksNDldLFstNywzM10sWy0xMDUsMjldLFstMTU2LDI0XSxbLTE1MCw5XSxbLTE0OCwtNF0sWy0xMjAsLTIxXSxbLTM2LC00MV0sWzg2LC01N10sWzE2MywtODFdLFsxNDUsLTEzN10sWzE2NywtMTc4XV0sXCJtXCI6MSxcIm1wXCI6W1sxNTgsMTE5XSxbMTUzLDExOV0sWzExOCwxMTldLFs0NiwxMTldLFstNTQsMTE5XSxbLTE0OCwxMThdLFstMTY5LDkwXSxbLTk5LDQ5XSxbNywzM10sWzEwNSwyOV0sWzE1NiwyNF0sWzE1MCw5XSxbMTQ4LC00XSxbMTIwLC0yMV0sWzM2LC00MV0sWy04NiwtNTddLFstMTYzLC04MV0sWy0xNDUsLTEzN10sWy0xNjcsLTE4MV1dfSxcbiAgXCIzLTFcIjoge1wicGFyXCI6MTQsXCJ0XCI6Mi4wMSxcInRnXCI6My4wOSxcImRcIjoxMy44LFwicGF0aFwiOltbLTE0MiwxNF0sWy0xMzAsMTNdLFstNTAsMTRdLFs5OCwxM10sWzE1OSwtNDRdLFsxNzAsLTE2OV0sWzE3MSwtMTczXV19LFxuICBcIjMtMlwiOiB7XCJwYXJcIjoxOSxcInRcIjozLjY4LFwidGdcIjo0Ljc3LFwiZFwiOjE1LjksXCJwYXRoXCI6W1stMTQyLC0xODFdLFstMTQ3LC0xODFdLFstMTgwLC0xODFdLFstMTgxLC0xNzhdLFstMTgxLC0xNDFdLFstMTgxLC01Ml0sWy0xNzcsODZdLFstMTQxLDE1NV0sWy01NSw5OF0sWy0zNSwyMF0sWy0yNSwtODNdLFs0MSwtMTc5XSxbMTQzLC0xNjNdLFsxNzMsLTE2OF1dLFwibVwiOjEsXCJtcFwiOltbMTQzLC0xODFdLFsxNDcsLTE4MV0sWzE4MCwtMTgxXSxbMTgyLC0xNzhdLFsxODIsLTE0MV0sWzE4MiwtNTJdLFsxNzcsODZdLFsxNDEsMTU1XSxbNTUsOThdLFszNSwyMF0sWzI1LC04M10sWy00MSwtMTc5XSxbLTE0MywtMTYzXSxbLTE3MywtMTY4XV19LFxuICBcIjMtM1wiOiB7XCJwYXJcIjoxMSxcInRcIjoxLjQyLFwidGdcIjoyLjI0LFwiZFwiOjExLjUsXCJwYXRoXCI6W1stMTQyLC0zMl0sWy0xMzgsLTMxXSxbLTEwMCwtMzFdLFstMTAsLTMxXSxbMTEzLC0zNV0sWzE3MywtNjRdXX0sXG4gIFwiMy00XCI6IHtcInBhclwiOjIxLFwidFwiOjEuNzQsXCJ0Z1wiOjUuNTMsXCJkXCI6MTMuNixcInBhdGhcIjpbWy0xNDIsODldLFstMTM4LDg5XSxbLTEwMyw4OV0sWy0zNSw4NV0sWzQxLDM1XSxbMTM1LC02MV0sWzE2OSwtMTcxXV0sXCJtXCI6MSxcIm1wXCI6W1sxNDMsODldLFsxMzgsODldLFsxMDMsODldLFszNSw4NV0sWy00MSwzNV0sWy0xMzUsLTYxXSxbLTE2OCwtMTc2XV19LFxuICBcIjMtNVwiOiB7XCJwYXJcIjoxNixcInRcIjozLjc3LFwidGdcIjozLjc3LFwiZFwiOjEzLjYsXCJwYXRoXCI6W1stMTU3LC0xODFdLFstMTQ1LC0xODFdLFstNjAsLTE4MV0sWzI4LC0xNDFdLFstMzQsLTE2XSxbLTQ2LDE0N10sWy00NiwxMjNdLFstMzYsLTMxXSxbMzEsLTE2Ml0sWzExNSwtMTU4XSxbMTY4LC0xODFdXSxcIm1cIjoxLFwibXBcIjpbWzE1OCwtMTgxXSxbMTUzLC0xODFdLFsxMTUsLTE4MV0sWzI1LC0xNzddLFstMjgsLTE0MV0sWzEwLC01NF0sWzM2LDgyXSxbMjUsMTU4XSxbLTM5LDk4XSxbLTMzLDE2XSxbLTQ1LC05NF0sWy04MiwtMTczXSxbLTE1NywtMTYwXSxbLTE3NywtMTY2XV19LFxuICBcIjMtNlwiOiB7XCJwYXJcIjoxOCxcInRcIjozLjY0LFwidGdcIjo0LjYzLFwiZFwiOjE2LjIsXCJwYXRoXCI6W1stMTU3LC0xODFdLFstMTUzLC0xODFdLFstMTE1LC0xODFdLFstOTcsLTE3OF0sWy04OCwtMTQ0XSxbLTg4LC03NF0sWy04OCwyNV0sWy04MCwxMjFdLFstMjEsMTczXSxbODAsMTE2XSxbNjgsMjddLFs4NywtOTBdLFsxNjEsLTE3NF0sWzE3NSwtMTY3XV0sXCJtXCI6MSxcIm1wXCI6W1sxNTgsLTE4MV0sWzE1MywtMTgxXSxbMTE1LC0xODFdLFs5NywtMTc4XSxbODksLTE0NF0sWzg5LC03NF0sWzg5LDI1XSxbODAsMTIxXSxbMjEsMTczXSxbLTgwLDExNl0sWy02OCwyN10sWy04NywtOTBdLFstMTYxLC0xNzRdLFstMTc1LC0xNjddXX0sXG4gIFwiMy03XCI6IHtcInBhclwiOjE4LFwidFwiOjQuNTgsXCJ0Z1wiOjQuNTgsXCJkXCI6MTcuMyxcInBhdGhcIjpbWy0xNTcsMTA0XSxbLTE1MywxMDRdLFstMTE1LDEwNF0sWy0yNSwxMDRdLFs5OCwxMDNdLFsxNjgsNjhdLFs5NCwwXSxbLTI1LDI1XSxbLTE3NCwxMV0sWy0xMjEsLTU0XSxbLTM2LC05MV0sWzc2LC05N10sWzE4MCwtMTU5XSxbMTI3LC0xNjNdLFsyMywtMTU1XSxbLTEyMCwtMTc3XSxbLTE2NywtMTgwXV0sXCJtXCI6MSxcIm1wXCI6W1sxNTgsMTA0XSxbMTUzLDEwNF0sWzExNSwxMDRdLFsyNSwxMDRdLFstOTgsMTAzXSxbLTE2OCw2OF0sWy05NCwwXSxbMjUsMjVdLFsxNzQsMTFdLFsxMjEsLTU0XSxbMzYsLTkxXSxbLTc2LC05N10sWy0xODAsLTE1OV0sWy0xMjcsLTE2M10sWy0yMywtMTU1XSxbMTIwLC0xNzddLFsxNjcsLTE4MF1dfSxcbiAgXCIzLThcIjoge1wicGFyXCI6MjEsXCJ0XCI6My40NCxcInRnXCI6NS41LFwiZFwiOjE1LjEsXCJwYXRoXCI6W1stMTU3LC0xODFdLFstMTYyLC0xODFdLFstMTc5LC0xODFdLFstMTgxLC0xNzhdLFstMTgxLC0xNDFdLFstMTc4LC01Ml0sWy0xNDksLTE3XSxbLTExMSwtNF0sWy05NSw1N10sWy02OSwxNDldLFs4LDE1Ml0sWzEyOSw4OV0sWzE3NSw1N11dLFwibVwiOjEsXCJtcFwiOltbMTU4LC0xODFdLFsxNjIsLTE4MV0sWzE3OSwtMTgxXSxbMTgyLC0xNzhdLFsxODIsLTE0MV0sWzE3OCwtNTJdLFsxNDksLTE3XSxbMTExLC00XSxbOTUsNTddLFs2OSwxNDldLFstOCwxNTJdLFstMTI5LDg5XSxbLTE3Niw1OF1dfSxcbiAgXCIzLTlcIjoge1wicGFyXCI6MTUsXCJ0XCI6Mi4wOCxcInRnXCI6My4zNyxcImRcIjoxMy45LFwicGF0aFwiOltbLTE0MiwtMzJdLFstMTM4LC0zMV0sWy0xMDAsLTMxXSxbLTksLTMxXSxbOTgsLTM2XSxbNzIsLTY2XSxbMTAwLC0xMTFdLFsxNjgsLTE3Nl1dLFwibVwiOjEsXCJtcFwiOltbMTQzLC0zMl0sWzEzOCwtMzFdLFsxMDAsLTMxXSxbOSwtMzFdLFstOTgsLTM2XSxbLTcyLC02Nl0sWy0xMDAsLTExMV0sWy0xNjYsLTE3OV1dfSxcbiAgXCIzLTEwXCI6IHtcInBhclwiOjE5LFwidFwiOjQuMjIsXCJ0Z1wiOjQuNzgsXCJkXCI6MTcuNixcInBhdGhcIjpbWy0xNDIsLTE4MV0sWy0xNDcsLTE4MV0sWy0xODAsLTE4MV0sWy0xODEsLTE3OF0sWy0xODEsLTE0MV0sWy0xODEsLTUyXSxbLTE3Nyw4Nl0sWy0xNDQsMTU2XSxbLTc3LDEzM10sWzI3LDE1M10sWzE3NCwxNzldLFsxMzcsMTY1XSxbMTE0LDk2XSxbMTI4LC0xM10sWzE4MCwtMTUzXSxbMTgwLC0xNjZdXSxcIm1cIjoxLFwibXBcIjpbWzE0MywtMTgxXSxbMTQzLC0xODFdLFsxNDcsLTE4MV0sWzE2MCwtMTgxXSxbMTgwLC0xODFdLFsxNzgsLTE4MV0sWzE4MiwtMTc4XSxbMTgyLC0xNjVdLFsxODIsLTE0MV0sWzE4MiwtMTAzXSxbMTgyLC01Ml0sWzE4MSwxMl0sWzE3Nyw4Nl0sWzE2NCwxNjhdLFsxNDEsMTU1XSxbMTA2LDEzMl0sWzU3LDExM10sWzAsMTA2XSxbLTUxLDE0MF0sWy0xMTQsMTY5XSxbLTE4MCwxNzldLFstMTU1LDE2M10sWy0xNDEsMTM2XSxbLTEzNiw5OF0sWy0xMzUsNDZdLFstMTM5LC0xNl0sWy0xNTIsLTg3XSxbLTE3MywtMTY2XSxbLTE3NCwtMTcxXV19LFxuICBcIjMtMTFcIjoge1wicGFyXCI6MTcsXCJ0XCI6My40NSxcInRnXCI6NC4xLFwiZFwiOjE3LjYsXCJwYXRoXCI6W1stMTQyLDQ0XSxbLTE0Miw0NF0sWy0xMzgsNDRdLFstMTI1LDQ0XSxbLTEwMCw0NF0sWy02MSw0NF0sWy05LDQ0XSxbNTUsNDRdLFsxMzAsNDhdLFsxNzEsNjFdLFsxNDQsODRdLFsxMjIsMTIxXSxbOTcsMTcxXSxbNjcsMTY3XSxbMjYsMTU3XSxbLTI4LDE0OV0sWy05MywxMzldLFstMTY3LDEyMV0sWy0xNjAsOTNdLFstMTQyLDU1XSxbLTEzNCw3XSxbLTEzNiwtNTFdLFstMTQ3LC0xMTddLFstMTY3LC0xNzhdXSxcIm1cIjoxLFwibXBcIjpbWzE0Myw0NF0sWzEzOCw0NF0sWzEwMCw0NF0sWzksNDRdLFstMTMwLDQ4XSxbLTE0NCw4NF0sWy05NywxNzFdLFstMjYsMTU3XSxbOTMsMTM5XSxbMTYwLDk2XSxbMTQyLDIwXSxbMTY2LC05MF0sWzE4MCwtMTY2XV19LFxuICBcIjMtMTJcIjoge1wicGFyXCI6MTcsXCJ0XCI6My41OCxcInRnXCI6NC4wNyxcImRcIjoxOC4yLFwicGF0aFwiOltbLTk3LDE2NF0sWy0xMDMsMTMzXSxbLTc0LDUwXSxbLTE5LC04NF0sWy00MCwtMTU4XSxbLTIwLC0xMzFdLFs1NSwtMTE2XSxbMTA5LC0yNl0sWzE3Niw5NF0sWzE3NCwxNzFdLFsxODAsMTAyXSxbMTgyLC0xNl0sWzE4MiwtMTY4XV0sXCJtXCI6MSxcIm1wXCI6W1s5OCwxNjRdLFs5NywxNTVdLFs5MiwxMzNdLFs3OSw5OF0sWzU5LDUzXSxbMzAsLTFdLFsyMCwtNjBdLFsyMCwtMTIwXSxbNiwtMTc4XSxbLTIyLC0xNjBdLFstNjEsLTEzNV0sWy01MCwtMTEwXSxbLTU1LC04NF0sWy03NiwtNTldLFstMTEwLC0zMl0sWy0xMDksLTIxXSxbLTEzNCw2N10sWy0xNjAsNTNdLFstMTc0LDE2OF0sWy0xNzAsMTQyXSxbLTE3NCw4NV0sWy0xODEsMTZdLFstMTgwLC02NF0sWy0xNzMsLTE1Ml0sWy0xNzAsLTE3M11dfSxcbiAgXCIzLTEzXCI6IHtcInBhclwiOjI1LFwidFwiOjYuOSxcInRnXCI6Ni45OCxcImRcIjoyMS4yLFwicGF0aFwiOltbLTE1NywtMTgxXSxbLTE3MCwtMTgxXSxbLTE4MSwtMTgxXSxbLTE4MSwtMTQxXSxbLTE3MCwtMTNdLFstOTUsLTMyXSxbMjUsLTJdLFstNDMsMTE2XSxbLTE3NSwxNDVdLFstMTUzLDUzXSxbLTE1NCw0Nl0sWy0xNDIsNDRdLFstNjAsNDRdLFsxMywzNl0sWy0zMCwyOF0sWy01MSwtMjBdLFstMTIsLTExMl0sWzEyMSwtMTc2XSxbMTY3LC0xNzhdXSxcIm1cIjoxLFwibXBcIjpbWzE1OCwtMTgxXSxbMTQ1LC0xODFdLFs2MCwtMTgxXSxbLTksLTE0MV0sWzMxLC0xNDRdLFs2MCwtMTQzXSxbMzcsLTg0XSxbNCw2MV0sWzQ5LDE1Nl0sWzE4Miw3M10sWzE1Miw0OF0sWzEzOCwxMjNdLFs1MSwxNTZdLFstNyw3M10sWzMxLDQ0XSxbNTgsLTIxXSxbMTcsLTEyMF0sWy0xMTgsLTE3OV0sWy0xNjgsLTE3NV1dfSxcbiAgXCIzLTE0XCI6IHtcInBhclwiOjI0LFwidFwiOjQuNDgsXCJ0Z1wiOjYuNCxcImRcIjoxOSxcInBhdGhcIjpbWy0xNTcsLTE4MV0sWy0xNTMsLTE4MV0sWy0xMTgsLTE4MV0sWy01MCwtMTgxXSxbMjAsLTE4MV0sWzc2LC0xMDhdLFs4OSwtMjFdLFs0NCw0MF0sWy01Niw4OF0sWy0xODAsOTVdLFstMTI0LDQ3XSxbLTQ1LDUwXSxbNjYsMTVdLFs2NywtNTJdLFs5MiwtMTI0XSxbMTY4LC0xNzldXSxcIm1cIjoxLFwibXBcIjpbWzE1OCwtMTgxXSxbMTUzLC0xODFdLFsxMTgsLTE4MV0sWzUwLC0xODFdLFstMjAsLTE4MV0sWy03NiwtMTA4XSxbLTg5LC0yMV0sWy00NCw0MF0sWzU2LDg4XSxbMTgwLDk1XSxbMTI0LDQ3XSxbNDUsNTBdLFstNjYsMTVdLFstNjcsLTUyXSxbLTkyLC0xMjRdLFstMTY3LC0xNzldXX0sXG4gIFwiMy0xNVwiOiB7XCJwYXJcIjoxOCxcInRcIjo0LjM3LFwidGdcIjo0LjQzLFwiZFwiOjUyLjEsXCJwYXRoXCI6W1stMTQyLDc0XSxbLTEzMCw3NF0sWy01OCw3M10sWy0yNCwyMF0sWy0xNCwtOTRdLFsyMSwtMTYxXSxbMTM1LC03MF0sWzE0NCwxMl0sWzM4LDEzXSxbODMsMTA2XSxbMTczLDE1N10sWzE3Nyw4N11dLFwibVwiOjEsXCJtcFwiOltbMTQzLDc0XSxbMTMwLDc0XSxbNTgsNzNdLFsyNCwyMF0sWzE0LC05NF0sWy0yMSwtMTYxXSxbLTEzNSwtNzBdLFstMTQ0LDEyXSxbLTM4LDEzXSxbLTgzLDEwNl0sWy0xNzMsMTU3XSxbLTE3MCw4NF1dfSxcbiAgXCIzLTE2XCI6IHtcInBhclwiOjE5LFwidFwiOjQuNTMsXCJ0Z1wiOjQuODQsXCJkXCI6MjguMyxcInBhdGhcIjpbWy0xNTcsMTA0XSxbLTE1MywxMDRdLFstMTE1LDEwNF0sWy0yNSwxMDRdLFs5OCwxMDRdLFsxNjgsODhdLFsxNDQsMjVdLFs4OSwxNl0sWy0xNywzNl0sWy0xNTUsMThdLFstMTQ5LC01NF0sWy0xMjYsLTg2XSxbLTUwLC01Nl0sWzc2LC01MV0sWzE2MywtOTJdLFsxNzQsLTE2MF0sWzE3OCwtMTY3XV0sXCJtXCI6MSxcIm1wXCI6W1sxNTgsMTA0XSxbMTUzLDEwNF0sWzExNSwxMDRdLFsyNSwxMDRdLFstOTgsMTA0XSxbLTE2OCw4OF0sWy0xNDQsMjVdLFstODksMTZdLFsxNywzNl0sWzE1NSwxOF0sWzE0OSwtNTRdLFsxMjYsLTg2XSxbNTAsLTU2XSxbLTc2LC01MV0sWy0xNjMsLTk1XSxbLTE3OCwtMTYwXSxbLTE4MCwtMTY3XV19LFxuICBcIjMtMTdcIjoge1wicGFyXCI6MTQsXCJ0XCI6Mi4zOCxcInRnXCI6My4xNCxcImRcIjozNC44LFwicGF0aFwiOltbLTE0Miw3NF0sWy0xMzgsNzRdLFstMTAwLDc0XSxbLTEwLDc0XSxbMTEzLDcyXSxbMTYwLDMxXSxbODIsLTQ5XSxbLTQzLC0xMjddLFstMTgwLC0xNjZdXSxcIm1cIjoxLFwibXBcIjpbWzE0Myw3NF0sWzEzOCw3NF0sWzEwMCw3NF0sWzEwLDc0XSxbLTExMyw3Ml0sWy0xNjAsMzFdLFstODIsLTQ5XSxbNDMsLTEyN10sWzE4MCwtMTY2XV19LFxuICBcIjMtMThcIjoge1wicGFyXCI6MjgsXCJ0XCI6NC40MyxcInRnXCI6Ny44MyxcImRcIjozMSxcInBhdGhcIjpbWy0xNDIsMTQ5XSxbLTE0OCwxMThdLFstMTgwLDM4XSxbLTE2MiwtODhdLFstMTExLC0xNThdLFstMTIsLTEyM10sWzEyMywtMTE2XSxbMTUzLC03Nl0sWzE1OSwtMjVdLFsxNzQsNTNdLFsxNjEsMTc3XSxbMTIwLDE0NF0sWzI3LDExOV0sWzYsNjhdLFstMSwtMTFdLFstNDcsLTc2XV0sXCJtXCI6MSxcIm1wXCI6W1sxNDMsMTQ5XSxbMTQ4LDExOF0sWzE4MCwzOF0sWzE2MiwtODhdLFsxMTEsLTE1OF0sWzEyLC0xMjNdLFstMTIzLC0xMTZdLFstMTUzLC03Nl0sWy0xNTksLTI1XSxbLTE3NCw1M10sWy0xNjEsMTc3XSxbLTEyMCwxNDRdLFstMjcsMTE5XSxbLTYsNjhdLFsxLC0xMV0sWzQ3LC03Ml1dfSxcbiAgXCIzLTE5XCI6IHtcInBhclwiOjE5LFwidFwiOjQuNzIsXCJ0Z1wiOjQuNzIsXCJkXCI6MzMuMSxcInBhdGhcIjpbWy0xNTcsLTEzNl0sWy0xNjIsLTEzNl0sWy0xNzksLTEzNl0sWy0xODEsLTEzM10sWy0xODEsLTk2XSxbLTE4MSwtN10sWy0xNzcsMTMxXSxbLTE0MiwxNDRdLFstNTYsOTldLFswLDM0XSxbNSwtMzBdLFs2OSwtOTFdLFsxNzcsLTEyNV0sWzE2MCwtOTldLFsxODEsLTQxXSxbMTc0LDY3XSxbMTgwLDE2OV1dLFwibVwiOjEsXCJtcFwiOltbMTU4LC0xMzZdLFsxNjIsLTEzNl0sWzE3OSwtMTM2XSxbMTgyLC0xMzNdLFsxODIsLTk2XSxbMTgyLC03XSxbMTc3LDEzMV0sWzE0MiwxNDRdLFs1Niw5OV0sWzAsMzRdLFstNSwtMzBdLFstNjksLTkxXSxbLTE3NywtMTI1XSxbLTE2MCwtOTldLFstMTgxLC00MV0sWy0xNzQsNjddLFstMTgxLDE2N11dfSxcbiAgXCIzLTIwXCI6IHtcInBhclwiOjI1LFwidFwiOjUuMjgsXCJ0Z1wiOjYuNjksXCJkXCI6MjkuNyxcInBhdGhcIjpbWy0xNTcsLTE4MV0sWy0xNTMsLTE4MV0sWy0xMjIsLTE0Ml0sWy0xMjMsLTg2XSxbLTEzOSwtMTI2XSxbLTExNSwtMTE3XSxbLTEyMSwtMzldLFstMTE2LC0yNl0sWy03MCwtNDRdLFs3LC00Nl0sWzgxLC00Nl0sWzExNyw4XSxbMTQwLDkzXSxbMTc5LDExNV0sWzE1NSw5MV0sWzEwNCw5Ml0sWzIwLDExOV0sWy05OCwxMDddLFstMTY2LDkyXV0sXCJtXCI6MSxcIm1wXCI6W1sxNTgsLTE4MV0sWzE1MywtMTgxXSxbMTIyLC0xNDJdLFsxMjMsLTg2XSxbMTM5LC0xMjZdLFsxMTUsLTExN10sWzEyMSwtMzldLFsxMTYsLTI2XSxbNzAsLTQ0XSxbLTcsLTQ2XSxbLTgxLC00Nl0sWy0xMTcsOF0sWy0xNDAsOTNdLFstMTc5LDExNV0sWy0xNTUsOTFdLFstMTA0LDkyXSxbLTIwLDExOV0sWzEwMiwxMTBdLFsxNzAsOTFdXX0sXG4gIFwiNC0xXCI6IHtcInBhclwiOjIwLFwidFwiOjMuNDUsXCJ0Z1wiOjUuMTMsXCJkXCI6MjcuNCxcInBhdGhcIjpbWzAsLTE4MV0sWy0xMiwtMTgxXSxbLTQ5LC0xODFdLFstOTAsLTk5XSxbLTEzNiwtNTJdLFstMTAzLC0zN10sWzE4LC0xNV0sWzI0LDQzXSxbODcsNDRdLFsxNzAsMjJdXX0sXG4gIFwiNC0yXCI6IHtcInBhclwiOjEyLFwidFwiOjIuNDIsXCJ0Z1wiOjIuNDksXCJkXCI6MTIuNCxcInBhdGhcIjpbWy0xNDIsLTE4MV0sWy0xMzgsLTE4MV0sWy0xMDAsLTE4MV0sWy0xMCwtMTc2XSxbLTEwLC05Ml0sWy0xNCwxMDZdLFstMzEsMTQwXSxbLTc3LDE3NV0sWy0xNzIsMTUyXSxbLTE4MSwxNDldXSxcIm1cIjoxLFwibXBcIjpbWzE0MywtMTgxXSxbMTM4LC0xODFdLFsxMDAsLTE4MV0sWzEwLC0xNzZdLFsxMCwtOTJdLFsxNCwxMDZdLFszMSwxNDBdLFs3NywxNzVdLFsxNzIsMTUyXSxbMTgyLDE0OV1dfSxcbiAgXCI0LTNcIjoge1wicGFyXCI6MTYsXCJ0XCI6My40MixcInRnXCI6My44MyxcImRcIjoxMy4zLFwicGF0aFwiOltbLTE0MiwtMTgxXSxbLTEzOCwtMTgxXSxbLTEwMCwtMTgxXSxbLTEwLC0xNzddLFsxMTUsLTEzOF0sWzE1OCwtMl0sWzgzLC0xMl0sWy0zOCwtNDZdLFstMTgwLDddLFstMTE3LDE2NV0sWy0zMCwxMzFdLFsxMDIsODZdLFsxNjgsNzhdXSxcIm1cIjoxLFwibXBcIjpbWzE0MywtMTgxXSxbMTM4LC0xODFdLFsxMDAsLTE4MV0sWzEwLC0xNzddLFstMTE1LC0xMzhdLFstMTU4LC0yXSxbLTgzLC0xMl0sWzM4LC00Nl0sWzE4MCw3XSxbMTE3LDE2NV0sWzMwLDEzMV0sWy0xMDIsODZdLFstMTY3LDc3XV19LFxuICBcIjQtNFwiOiB7XCJwYXJcIjoxNixcInRcIjozLjgsXCJ0Z1wiOjMuOTksXCJkXCI6MTQuMixcInBhdGhcIjpbWzE4MiwtNDZdLFsxODAsLTc3XSxbMTQ5LC0xNTBdLFsxNDksLTE2MV0sWzE0OSwtMTA1XSxbMTQ4LC00Nl0sWzEzNiw0XSxbMTEzLDI1XSxbODEsOF0sWzM5LC03XSxbLTExLC0yMV0sWy02NywtMzRdLFstMTI5LC00Nl0sWy0xNjcsLTQ2XV0sXCJtXCI6MSxcIm1wXCI6W1stMTgxLC00Nl0sWy0xODAsLTc3XSxbLTE0OSwtMTUwXSxbLTE0OSwtMTYxXSxbLTE0OCwtMTA1XSxbLTE0OCwtNDZdLFstMTM2LDRdLFstMTEzLDI1XSxbLTgxLDhdLFstMzksLTddLFsxMSwtMjFdLFs2NywtMzRdLFsxMzAsLTQ2XSxbMTY3LC00Nl1dfSxcbiAgXCI0LTVcIjoge1wicGFyXCI6MTQsXCJ0XCI6Mi45OSxcInRnXCI6My4yMyxcImRcIjoxNS4yLFwicGF0aFwiOltbLTE0Miw0NF0sWy0xMzgsNDRdLFstMTAwLDQ0XSxbLTksNDNdLFsxMjgsNTJdLFsxNDYsNDVdLFs5OSw0NF0sWzMyLDQyXSxbMTYsMV0sWzc1LC04NF0sWzE2OCwtMTc2XV19LFxuICBcIjQtNlwiOiB7XCJwYXJcIjoxNSxcInRcIjoyLjk4LFwidGdcIjozLjYxLFwiZFwiOjE0LjEsXCJwYXRoXCI6W1stMTU3LC0xODFdLFstMTU3LC0xODFdLFstMTU3LC0xODFdLFstMTU3LC0xODFdLFstMTU3LC0xODFdLFstMTU3LC0xODFdLFstMTUzLC0xODFdLFstMTQwLC0xODFdLFstMTE1LC0xODFdLFstNzYsLTE4MV0sWy0yNSwtMTc3XSxbMzYsLTE2NV0sWzEwMCwtMTQwXSxbMTYzLC0xMDFdLFsxNjQsLTUxXSxbMTMyLDhdLFs4OSwzN10sWzM1LDEzXSxbLTMxLC0xMl0sWy0xMDUsLTQzXSxbLTE3MSwtMzldXSxcIm1cIjoxLFwibXBcIjpbWzE1OCwtMTgxXSxbMTU4LC0xODFdLFsxNTgsLTE4MV0sWzE1MywtMTgxXSxbMTE1LC0xODFdLFsyNSwtMTc3XSxbLTEwMCwtMTQwXSxbLTE2NCwtNTFdLFstODksMzddLFszMSwtMTJdLFsxNjksLTM4XV19LFxuICBcIjQtN1wiOiB7XCJwYXJcIjoxMyxcInRcIjoyLjgzLFwidGdcIjoyLjgzLFwiZFwiOjM5LjIsXCJwYXRoXCI6W1stMTQyLC0xODFdLFstMTM4LC0xODFdLFstMTAzLC0xODFdLFstMjgsLTE4MV0sWy0xLC0xNTNdLFsxMCwtOTJdLFsxNCwtMTVdLFsxMiw2NF0sWy0yNiwxNTNdLFstMTE0LDE1N10sWy0xNjcsMTM0XV0sXCJtXCI6MSxcIm1wXCI6W1sxNDMsLTE4MV0sWzEzOCwtMTgxXSxbMTAzLC0xODFdLFsyOCwtMTgxXSxbMSwtMTUzXSxbLTEwLC05Ml0sWy0xNCwtMTVdLFstMTIsNjRdLFsyNiwxNTNdLFsxMTQsMTU3XSxbMTY3LDEzNF1dfSxcbiAgXCI0LThcIjoge1wicGFyXCI6MTksXCJ0XCI6My41MSxcInRnXCI6NC43MyxcImRcIjoxNC42LFwicGF0aFwiOltbLTE0MiwtMTgxXSxbLTEzOCwtMTgxXSxbLTEwMCwtMTgxXSxbLTksLTE4MV0sWzEzMCwtMTc3XSxbMTQ0LC0xNDFdLFs5NywtNTRdLFszMiwtNDhdLFstMTAsMTVdLFs0NCwxNDJdLFsxNDYsMTQ0XSxbMTU4LDcwXSxbMTY3LDE3XV0sXCJtXCI6MSxcIm1wXCI6W1sxNDMsLTE4MV0sWzEzOCwtMTgxXSxbMTAwLC0xODFdLFs5LC0xODFdLFstMTMwLC0xNzddLFstMTQ0LC0xNDFdLFstOTcsLTU0XSxbLTMyLC00OF0sWzEwLDE1XSxbLTQ0LDE0Ml0sWy0xNDYsMTQ0XSxbLTE1OCw3MF0sWy0xNjYsMTddXX0sXG4gIFwiNC05XCI6IHtcInBhclwiOjEzLFwidFwiOjIuNzksXCJ0Z1wiOjIuNzksXCJkXCI6MTgsXCJwYXRoXCI6W1stMTQyLC0xODFdLFstMTMwLC0xODFdLFstNTAsLTE4MV0sWzQ3LC0xNTBdLFs0NCwtNjddLFs1MywyN10sWy0xNiwxNjRdLFstMTY2LDEzNl1dLFwibVwiOjEsXCJtcFwiOltbMTQzLC0xODFdLFsxNDIsLTE4MV0sWzEzOCwtMTgxXSxbMTI2LC0xODFdLFsxMDYsLTE4MV0sWzc5LC0xODFdLFs0NywtMTgxXSxbMTQsLTE4MF0sWy0xMiwtMTc2XSxbLTI3LC0xNjZdLFstMjgsLTE0N10sWy0xNCwtMTEzXSxbMTQsLTYxXSxbMjUsMTJdLFsyNCwxMDJdLFszOCwxNzVdLFs2NCwxMzRdLFsxMDAsMTQ2XSxbMTQ2LDE1MF0sWzE3NiwxNDhdXX0sXG4gIFwiNC0xMFwiOiB7XCJwYXJcIjoxMyxcInRcIjoxLjkyLFwidGdcIjoyLjc5LFwiZFwiOjI0LjksXCJwYXRoXCI6W1stMTQyLC0xODFdLFstMTQyLC0xODFdLFstMTM4LC0xODFdLFstMTI5LC0xODFdLFstMTE1LC0xODFdLFstOTIsLTE4MV0sWy01OCwtMTgwXSxbLTExLC0xNjNdLFs0OSwtMTI1XSxbNDQsLTYyXSxbMzEsMjhdLFstNDMsMTE3XSxbLTEyOCwxNzFdLFstMTgwLDE0OV1dLFwibVwiOjEsXCJtcFwiOltbMTQzLC0xODFdLFsxNDIsLTE4MV0sWzEzOCwtMTgxXSxbMTI2LC0xODFdLFsxMDYsLTE4MV0sWzc5LC0xODFdLFs0NiwtMTc5XSxbNSwtMTcxXSxbLTQzLC0xNTVdLFstNTQsLTEyOV0sWy00MywtOTZdLFstMzIsLTYyXSxbLTE5LC0yNl0sWy0xLDEyXSxbMjIsNTJdLFstMzAsNzNdLFstNDcsOTFdLFstMTUsMTEyXSxbMjQsMTM0XSxbNzMsMTQ3XSxbMTMyLDE1MV0sWzE3NywxNDhdXX0sXG4gIFwiNC0xMVwiOiB7XCJwYXJcIjoxMyxcInRcIjoyLjc1LFwidGdcIjoyLjkxLFwiZFwiOjI0LjksXCJwYXRoXCI6W1stMTU3LDI5XSxbLTE1MywyOV0sWy0xMTUsMjldLFstMjUsMjldLFs5OCwyOV0sWzE2OCwxOV0sWzE2NSwtMjJdLFsxMTEsLTcwXSxbMywtMTE0XSxbLTE1MSwtMTU4XSxbLTE4MCwtMTY3XV0sXCJtXCI6MSxcIm1wXCI6W1sxNTgsMjldLFsxNTMsMjldLFsxMTUsMjldLFsyNSwyOV0sWy05OCwyOV0sWy0xNjgsMTldLFstMTY1LC0yMl0sWy0xMTEsLTcwXSxbLTMsLTExNF0sWzE1MSwtMTU4XSxbMTgwLC0xNjddXX0sXG4gIFwiNC0xMlwiOiB7XCJwYXJcIjoyMixcInRcIjoxLjg4LFwidGdcIjo1Ljc4LFwiZFwiOjI4LjcsXCJwYXRoXCI6W1stMTQyLDE0XSxbLTE0MiwxNF0sWy0xNDIsMTRdLFstMTQyLDE0XSxbLTE0MiwxNF0sWy0xNDIsMTRdLFstMTM4LDE0XSxbLTEyNSwxNF0sWy0xMDAsMTNdLFstNjEsMTNdLFstOSwxMl0sWzU1LDEyXSxbMTMwLDE2XSxbMTcwLDIxXV0sXCJtXCI6MSxcIm1wXCI6W1sxNDMsMTRdLFsxNDMsMTRdLFsxNDMsMTRdLFsxMzgsMTRdLFsxMDAsMTNdLFs5LDEyXSxbLTEzMCwxNl0sWy0xNzAsMjFdXX0sXG4gIFwiNC0xM1wiOiB7XCJwYXJcIjoyMixcInRcIjozLjY3LFwidGdcIjo1Ljg4LFwiZFwiOjMwLjUsXCJwYXRoXCI6W1stMTU3LC0xMDZdLFstMTU3LC0xMDZdLFstMTU3LC0xMDZdLFstMTU3LC0xMDZdLFstMTU3LC0xMDZdLFstMTU3LC0xMDZdLFstMTU3LC0xMDZdLFstMTU3LC0xMDZdLFstMTU3LC0xMDZdLFstMTU3LC0xMDZdLFstMTU3LC0xMDZdLFstMTUzLC0xMDZdLFstMTQ0LC0xMDZdLFstMTMwLC0xMDZdLFstMTA3LC0xMDZdLFstNzMsLTEwNl0sWy0zMCwtMTAzXSxbMCwtNjldLFs0MCwtMzBdLFszNiwxM10sWzM4LDU1XSxbNTUsOTBdLFs3NSw3NF0sWzEwNiw3OV0sWzE0Nyw3Nl0sWzE2OCw3NF1dLFwibVwiOjEsXCJtcFwiOltbMTU4LC0xMDZdLFsxNTgsLTEwNl0sWzE1OCwtMTA2XSxbMTU4LC0xMDZdLFsxNTgsLTEwNl0sWzE1OCwtMTA2XSxbMTUzLC0xMDZdLFsxMTUsLTEwNl0sWzI1LC0xMDJdLFstMjgsLTY5XSxbLTIwLC0xXSxbLTU4LDkwXSxbLTExNSw4M10sWy0xNjgsNzhdXX0sXG4gIFwiNC0xNFwiOiB7XCJwYXJcIjoyMixcInRcIjoyLjI2LFwidGdcIjo1LjY4LFwiZFwiOjM4LjgsXCJwYXRoXCI6W1stMTU3LC0xMDZdLFstMTU3LC0xMDZdLFstMTUzLC0xMDZdLFstMTQ0LC0xMDZdLFstMTMxLC0xMDZdLFstMTEyLC04Nl0sWy04OCwtMjRdLFstNDgsMjBdLFsxMCw0NV0sWzgyLDU0XSxbMTY0LDQ2XSxbMTU4LDI2XSxbMTM3LC01XSxbMTMxLC00Ml0sWzE0MSwtNzldLFsxNjUsLTEwNl0sWzE2NywtMTA1XV0sXCJtXCI6MSxcIm1wXCI6W1sxNTgsLTEwNl0sWzE1MywtMTA2XSxbMTIyLC0xMDZdLFs4NCwyXSxbMjAsNTVdLFstMTA1LDQ0XSxbLTE0OSwtOF0sWy0xNDIsLTcwXSxbLTE2OCwtMTAwXV19LFxuICBcIjQtMTVcIjoge1wicGFyXCI6MTMsXCJ0XCI6Mi43MixcInRnXCI6Mi43MixcImRcIjo0My4xLFwicGF0aFwiOltbLTE0MiwxNDldLFstMTM4LDE0OV0sWy0xMDcsMTQ5XSxbLTY4LDE0OV0sWy00MCwxMzBdLFstMjMsNjZdLFstMTMsLTI5XSxbLTIxLC0xMjVdLFstNjUsLTE3MF0sWy0xNjAsLTE3OF0sWy0xNjcsLTE4MF1dLFwibVwiOjEsXCJtcFwiOltbMTQzLDE0OV0sWzEzOCwxNDldLFsxMDcsMTQ5XSxbNjgsMTQ5XSxbNDAsMTMwXSxbMjMsNjZdLFsxMywtMjldLFsyMSwtMTI1XSxbNjUsLTE3MF0sWzE2MSwtMTc0XSxbMTY4LC0xNzRdXX0sXG4gIFwiNC0xNlwiOiB7XCJwYXJcIjoyMSxcInRcIjozLjkyLFwidGdcIjo1LjUxLFwiZFwiOjQ1LjcsXCJwYXRoXCI6W1stMTcyLDEwNF0sWy0xNzIsNzJdLFstMTcyLC0xN10sWy0xNjcsLTE1M10sWy0xMzgsLTE0OF0sWy0xMDEsLTE2M10sWy03MCwtMTc5XSxbLTM4LC0xODFdLFstMiwtMTgxXSxbMTksLTE4MV0sWzI1LC0xODFdLFszMSwtMTgxXSxbNzQsLTE4MV0sWzE1OSwtMTgxXSxbMTY4LC0xODFdXSxcIm1cIjoxLFwibXBcIjpbWzE3MywxMDRdLFsxNzMsNzJdLFsxNzMsLTE3XSxbMTY3LC0xNTNdLFsxMzgsLTE0OF0sWzEwMSwtMTYzXSxbNzAsLTE3OV0sWzM4LC0xODFdLFsyLC0xODFdLFstMTksLTE4MV0sWy0yNSwtMTgxXSxbLTMxLC0xODFdLFstNzQsLTE4MV0sWy0xNTksLTE4MV0sWy0xNjgsLTE4MV1dfSxcbiAgXCI0LTE3XCI6IHtcInBhclwiOjI3LFwidFwiOjQuNzgsXCJ0Z1wiOjcuNDIsXCJkXCI6NDYuOCxcInBhdGhcIjpbWy0xNTcsODldLFstMTYyLDg5XSxbLTE3OCw4OV0sWy0xNzEsODldLFstMTY2LDg5XSxbLTE1OCw4OV0sWy0xMDYsODldLFszNSw4OV0sWzE2OSw4M10sWzE2MywzNF0sWzE1MCwtNDNdLFs3MywtMTRdLFstNzksLTI0XSxbLTE1MiwtODhdLFstNzQsLTE3NV0sWzM2LC0xNjRdLFsxNjksLTE3N11dLFwibVwiOjEsXCJtcFwiOltbMTU4LDg5XSxbMTU4LDg5XSxbMTU4LDg5XSxbMTU4LDg5XSxbMTU4LDg5XSxbMTUzLDg5XSxbOTgsODldLFstNDUsODldLFstMTY1LDgyXSxbLTE2NCwzMF0sWy0xNTAsLTQxXSxbLTczLC0xMl0sWzgwLC0yMl0sWzE1MiwtODZdLFs3NCwtMTc1XSxbLTM3LC0xNjRdLFstMTY4LC0xNzldXX0sXG4gIFwiNC0xOFwiOiB7XCJwYXJcIjoyNyxcInRcIjo3LjM4LFwidGdcIjo3LjM4LFwiZFwiOjUyLjIsXCJwYXRoXCI6W1s5OCwxMTldLFs5MywxMTldLFs2MiwxMTldLFsyMywxMTldLFstMTUsMTE5XSxbLTc5LDExOV0sWy0xNzIsMTA5XSxbLTE0OCwzMF0sWy0xMjAsMjldLFstOTcsMjldLFstODQsMjldLFstMTAxLDI5XSxbLTEyNiwyOV0sWy0xNDEsMjldLFstMTIyLDI5XSxbLTY2LDI5XSxbMjYsMjldLFsxNDMsMjddLFsxNDYsLTE2XSxbNjksLTMyXSxbLTUzLC0yM10sWy0xNzMsLTcxXSxbLTExMSwtMTY2XSxbLTI5LC0xNTddLFs4NSwtMTczXSxbMTY5LC0xNzddXSxcIm1cIjoxLFwibXBcIjpbWy05NywxMTldLFstODUsMTE5XSxbMCwxMTldLFsxNjksMTUwXSxbMTQyLDE3OF0sWzEyMCwxODJdLFs0MiwxODJdLFstMzEsMTgyXSxbLTEzLDE4MF0sWzkwLDEzOF0sWzE4MCwxMTldLFsxMTIsMzFdLFsyMyw0N10sWy0xMTQsMjldLFstMTQ4LC0yNV0sWy0zMSwtMzJdLFsxNDcsLTU4XSxbMTEyLC0xNzFdLFstMjcsLTE1M10sWy0xNzIsLTE3MF1dfSxcbiAgXCI0LTE5XCI6IHtcInBhclwiOjI2LFwidFwiOjUuMjcsXCJ0Z1wiOjcuMDcsXCJkXCI6NjAuMSxcInBhdGhcIjpbWy0xNzIsLTE4MV0sWy0xNzcsLTE4MV0sWy0xODEsLTE4MV0sWy0xODEsLTE3OF0sWy0xODEsLTE0MV0sWy0xNzgsLTUzXSxbLTE1MCwtNDhdLFstMTExLC01XSxbLTQyLDExNF0sWzczLDE2MF0sWzE2OCw4NV0sWzExOSwyN10sWzgxLDIzXSxbNTIsMTRdLFszMCwxM10sWzE2LC00XSxbMzcsLTYxXSxbMTE0LC0xMjZdLFsxNzUsLTE3MF1dLFwibVwiOjEsXCJtcFwiOltbMTczLC0xODFdLFsxNzMsLTE4MV0sWzE3NywtMTgxXSxbMTgxLC0xODFdLFsxODIsLTE4MV0sWzE4MiwtMTgxXSxbMTgyLC0xNzhdLFsxODIsLTE2NV0sWzE4MiwtMTQxXSxbMTgxLC0xMDNdLFsxNzgsLTUyXSxbMTcwLC00MF0sWzE1NSwtNTBdLFsxMzMsLTQ2XSxbMTAzLC0xN10sWzY4LDM4XSxbMjUsMTA0XSxbLTI3LDE3M10sWy05MCwxNThdLFstMTY0LDEyOF0sWy0xNjAsOTRdLFstMTQ0LDUxXSxbLTEzOCwxOF0sWy0xMzYsMjldLFstMTMxLDI0XSxbLTEyMiwxNl0sWy0xMDQsMTRdLFstNzYsMTRdLFstMzgsMTNdLFs1LDhdLFs0LC0xXSxbLTE1LC0xOV0sWy0zOCwtNTFdLFstNjksLTkzXSxbLTExMSwtMTQwXSxbLTE2NiwtMTgwXV19LFxuICBcIjQtMjBcIjoge1wicGFyXCI6MjksXCJ0XCI6OC4yMyxcInRnXCI6OC4yMyxcImRcIjo2Ni4xLFwicGF0aFwiOltbLTE1NywxMTldLFstMTU3LDExOV0sWy0xNTcsMTE5XSxbLTE1NywxMTldLFstMTU3LDExOV0sWy0xNTMsMTE5XSxbLTEyMiwxMTldLFstODMsMTE5XSxbLTUxLDExOV0sWy0yMywxMTldLFswLDExOV0sWzEzLDExOV0sWy0zLDExOV0sWy0yMywxMTldLFstNiwxMTldLFs2NSwxMTldLFsxNzMsMTE0XSxbMTQyLDY1XSxbOTIsMjZdLFsxMCwxNV0sWy0xMDEsMTRdLFstMTY1LC00XSxbLTExMiwtNzVdLFswLC03NF0sWzE2NywtOTddLFsxMTgsLTE3MV0sWzI3LC0xNjVdLFstOTgsLTE4MF0sWy0xNjcsLTE3Nl1dLFwibVwiOjEsXCJtcFwiOltbMTU4LDExOV0sWzE1OCwxMTldLFsxNTgsMTE5XSxbMTU4LDExOV0sWzE1OCwxMTldLFsxNTMsMTE5XSxbMTIyLDExOV0sWzgzLDExOV0sWzUxLDExOV0sWzIzLDExOV0sWzYsMTE5XSxbMTgsMTE5XSxbNDEsMTE5XSxbNTUsMTE5XSxbMzEsMTE5XSxbLTQ1LDExOV0sWy0xNTcsMTE3XSxbLTE0Nyw3N10sWy05NywyM10sWy0xOCwxNV0sWzkxLDEzXSxbMTY5LDBdLFsxMTcsLTY3XSxbOCwtNzVdLFstMTU5LC05NV0sWy0xMjAsLTE2NV0sWy0yOCwtMTY1XSxbOTcsLTE4MV0sWzE3MCwtMTc2XV19LFxuICBcIjUtMVwiOiB7XCJwYXJcIjoxNCxcInRcIjozLjAyLFwidGdcIjozLjE3LFwiZFwiOjEzLjUsXCJwYXRoXCI6W1stMTQyLDg5XSxbLTEzMCw4OV0sWy01OCw4OV0sWzEyLDc2XSxbLTEsNl0sWy0xMDMsLTEwNl0sWy0xNTcsLTE2NF0sWzExNywtMTc5XSxbMTY4LC0xODFdXX0sXG4gIFwiNS0yXCI6IHtcInBhclwiOjE1LFwidFwiOjIuNDMsXCJ0Z1wiOjMuMzcsXCJkXCI6MTMuNixcInBhdGhcIjpbWy0xNDIsMTA0XSxbLTEzMCwxMDRdLFstNTgsOTZdLFstMzIsNTddLFstMTM1LDhdLFstMTQ4LC0xMjZdLFsxODIsLTE0OV0sWzE3NywtMTY4XV0sXCJtXCI6MSxcIm1wXCI6W1sxNDMsMTA0XSxbMTMwLDEwNF0sWzU4LDk2XSxbMzIsNTddLFsxMzUsOF0sWzE0OCwtMTI2XSxbLTE4MSwtMTQ5XSxbLTE3NywtMTY4XV19LFxuICBcIjUtM1wiOiB7XCJwYXJcIjoxMSxcInRcIjoyLjA1LFwidGdcIjoyLjA1LFwiZFwiOjEyLFwicGF0aFwiOltbLTE0MiwtMTY2XSxbLTEzOCwtMTc5XSxbLTEwMCwtMTgxXSxbLTksLTE4MV0sWzEzMSwtMTgxXSxbMjgsLTQ2XSxbLTM3LDg5XSxbMTcxLDkxXV0sXCJtXCI6MSxcIm1wXCI6W1sxNDMsLTE2Nl0sWzEzOCwtMTc5XSxbMTAwLC0xODFdLFs5LC0xODFdLFstMTMxLC0xODFdLFstMjgsLTQ2XSxbMzcsODldLFstMTcxLDg5XV19LFxuICBcIjUtNFwiOiB7XCJwYXJcIjoxMixcInRcIjoxLjk4LFwidGdcIjoyLjQxLFwiZFwiOjE0LjIsXCJwYXRoXCI6W1stMTQyLDEzNF0sWy0xMzgsMTM0XSxbLTEwNywxMzRdLFstNzQsMTMzXSxbLTYyLDEyNV0sWy01MCw3Ml0sWy04LC0yNF0sWzE3MiwtOTddXSxcIm1cIjoxLFwibXBcIjpbWzE0MywxMzRdLFsxMzgsMTM0XSxbMTA3LDEzNF0sWzc0LDEzM10sWzYyLDEyNV0sWzUwLDcyXSxbOCwtMjRdLFstMTcwLC05OV1dfSxcbiAgXCI1LTVcIjoge1wicGFyXCI6MTYsXCJ0XCI6MS40NCxcInRnXCI6My45MixcImRcIjoxNi4xLFwicGF0aFwiOltbLTE1NywxNDldLFstMTU3LDkzXSxbLTE0NSwtNTVdLFsxNTEsLTc2XSxbMTc0LC05M11dLFwibVwiOjEsXCJtcFwiOltbMTU4LDE0OV0sWzE1OCwxMTddLFsxNTIsMjldLFstMTA1LC0xMDBdLFstMTQ3LC03OF0sWy0xNzcsLTkyXV19LFxuICBcIjUtNlwiOiB7XCJwYXJcIjo4LFwidFwiOjEuMzIsXCJ0Z1wiOjEuMzIsXCJkXCI6MTIsXCJwYXRoXCI6W1stMTU3LDEwNF0sWy0xNTIsNzNdLFstMTE2LC01XSxbLTQ2LC0xMThdLFsxMjUsLTkzXSxbMTgwLC05MV1dLFwibVwiOjEsXCJtcFwiOltbMTU4LDEwNF0sWzE1Nyw5NV0sWzE1Miw3M10sWzEzOSwzOF0sWzExOSwtN10sWzkxLC02Ml0sWzU2LC0xMjZdLFstNiwtMTc3XSxbLTEzMSwtOTJdLFstMTgxLC05MV1dfSxcbiAgXCI1LTdcIjoge1wicGFyXCI6MzIsXCJ0XCI6Mi42OCxcInRnXCI6OS4zMixcImRcIjoxMi42LFwicGF0aFwiOltbLTE0MiwtMTgxXSxbLTEzOCwtMTgxXSxbLTEwMCwtMTgxXSxbLTEwLC0xNzNdLFsyNCwtNV0sWzEwOCwxNF0sWzExOCwxNjJdLFsxODAsNzZdLFsxNjYsLTMyXSxbMTY5LC0xNzNdXSxcIm1cIjoxLFwibXBcIjpbWzE0MywtMTgxXSxbMTM4LC0xODFdLFsxMDAsLTE4MV0sWzEwLC0xNzNdLFstMjQsLTVdLFstMTA4LDE0XSxbLTExOCwxNjJdLFstMTgwLDc2XSxbLTE2NiwtMzJdLFstMTY5LC0xNzNdXX0sXG4gIFwiNS04XCI6IHtcInBhclwiOjE4LFwidFwiOjMuMzgsXCJ0Z1wiOjQuNCxcImRcIjoxNi4yLFwicGF0aFwiOltbLTE0MiwxNDldLFstMTQyLDExN10sWy0xNDIsMjhdLFstMTM3LC0xMDhdLFsxMzcsMTE4XSxbMTc0LDEzMV0sWzE1Myw5MF0sWy0xMDMsLTE4MV0sWy0xMTAsLTE4MV0sWy04MiwtMTgxXSxbMCwtMTgxXSxbMTMxLC0xNzddLFsxNzAsLTE3MV1dLFwibVwiOjEsXCJtcFwiOltbMTQzLDE0OV0sWzE0MywxMTddLFsxNDMsMjhdLFsxMzcsLTEwOF0sWy0xMzcsMTE4XSxbLTE3NCwxMzFdLFstMTUzLDkwXSxbMTAzLC0xODFdLFsxMTAsLTE4MV0sWzgyLC0xODFdLFswLC0xODFdLFstMTMxLC0xODFdLFstMTcwLC0xODFdXX0sXG4gIFwiNS05XCI6IHtcInBhclwiOjE5LFwidFwiOjIuNjMsXCJ0Z1wiOjQuODYsXCJkXCI6MjQuOSxcInBhdGhcIjpbWy02NywtNjFdLFstNjgsLTcwXSxbLTczLC05MV0sWy04NSwtODZdLFstMTEwLC04OV0sWy0xNDUsLTkyXSxbLTE4MSwtMTA0XSxbLTE2NSwtMTMwXSxbLTE1NSwtMTY4XSxbLTE1NSwtMTcyXSxbLTE2MiwtMTY5XSxbLTE3MiwtMTgxXSxbLTE3NiwtMTgxXSxbLTE3MSwtMTgxXSxbLTE1NCwtMTgxXSxbLTEyMiwtMTgxXSxbLTc3LC0xODFdLFsxMzgsLTE3N10sWzE3MCwtMTcyXV0sXCJtXCI6MSxcIm1wXCI6W1s2OCwtNjFdLFs4MCwtODddLFsxNjEsLTkyXSxbMTYzLC0xNDBdLFsxNjMsLTE3Ml0sWzE1MiwtMTgxXSxbNzIsLTE4MV0sWy0xNjcsLTE4MV1dfSxcbiAgXCI1LTEwXCI6IHtcInBhclwiOjIwLFwidFwiOjIuMzYsXCJ0Z1wiOjUuMjEsXCJkXCI6MTQuMSxcInBhdGhcIjpbWy0xNDIsMTQ5XSxbLTE0MiwxMTddLFstMTM3LDI5XSxbLTk4LC05M10sWy0zNCwtMTY3XSxbLTMwLC0xMTldLFstMTMsLTExMV0sWzQ1LC0xNDZdLFsxNjksOTZdXSxcIm1cIjoxLFwibXBcIjpbWzE0MywxNDldLFsxNDMsMTE3XSxbMTM3LDI5XSxbOTgsLTkzXSxbMzQsLTE2N10sWzMwLC0xMTldLFsxMywtMTExXSxbLTQ1LC0xNDZdLFstMTcwLDk2XV19LFxuICBcIjUtMTFcIjoge1wicGFyXCI6MTYsXCJ0XCI6My4wMSxcInRnXCI6My44NCxcImRcIjo1My45LFwicGF0aFwiOltbLTE0MiwxMzRdLFstMTMwLDEzNF0sWy01MCwxMzNdLFsxMSw5Ml0sWzEwLC0zNl0sWzE1LC0xNjhdLFsyMSwtMTYzXSxbOTYsLTE3OF0sWzE2OCwtMTgxXV0sXCJtXCI6MSxcIm1wXCI6W1sxNDMsMTM0XSxbMTMwLDEzNF0sWzUwLDEzM10sWy0xMSw5Ml0sWy0xMCwtMzZdLFstMTUsLTE2OF0sWy0yMSwtMTYzXSxbLTk2LC0xNzhdLFstMTY2LC0xODFdXX0sXG4gIFwiNS0xMlwiOiB7XCJwYXJcIjoyMyxcInRcIjoxLjYzLFwidGdcIjo2LjE4LFwiZFwiOjIyLjUsXCJwYXRoXCI6W1sxNTgsMTQ5XSxbMTU4LDExN10sWzE1MiwyOV0sWzEyMCwtMTAwXSxbLTEyOSwtMTU2XSxbLTE2NiwtMTUyXSxbLTE3OSwtMTY2XV0sXCJtXCI6MSxcIm1wXCI6W1stMTU3LDE0OV0sWy0xNTcsMTE3XSxbLTE1MiwyOV0sWy0xMjAsLTEwMF0sWzEyOSwtMTU2XSxbMTY2LC0xNTJdLFsxNzksLTE2N11dfSxcbiAgXCI1LTEzXCI6IHtcInBhclwiOjE4LFwidFwiOjEuOTMsXCJ0Z1wiOjQuNTksXCJkXCI6MzIuNCxcInBhdGhcIjpbWy0xNDIsMTQ5XSxbLTE0MiwxNDBdLFstMTQyLDExN10sWy0xNDIsNzldLFstMTM4LDI5XSxbLTEzMywtMzNdLFstMTMxLC0xMDddLFstMTMyLC0xNzldLFstMTMyLC0xNTNdLFstMTMxLC0xNDRdLFstMTI3LC0xNTBdLFsxMTIsLTE2OF0sWzEzNywtMTc3XSxbMTcxLC0xNzBdXSxcIm1cIjoxLFwibXBcIjpbWzE0MywxNDldLFsxNDMsOTNdLFsxNDMsLTU4XSxbMTQzLC0xNTJdLFsxMzAsLTE2Ml0sWy0xNjcsLTE4MV1dfSxcbiAgXCI1LTE0XCI6IHtcInBhclwiOjE4LFwidFwiOjIuMTUsXCJ0Z1wiOjQuNTksXCJkXCI6MTUuMSxcInBhdGhcIjpbWy0xNzIsMTczXSxbLTE3MiwxNDFdLFstMTY3LDUzXSxbLTEzMyw1MV0sWy02NiwzNF0sWzMsLTM0XSxbNjksLTcxXSxbMTU5LC0xNTNdLFsxNzcsLTE3MF1dLFwibVwiOjEsXCJtcFwiOltbMTczLDE3M10sWzE3MywxNDFdLFsxNzksODFdLFsxNjgsMzBdLFsxMDMsNDhdLFstNiwtMjddLFstMTUwLC0yM10sWy0xNTEsLTkyXSxbLTE2NywtMTY5XSxbLTE2OSwtMTczXV19LFxuICBcIjUtMTVcIjoge1wicGFyXCI6MjQsXCJ0XCI6Ni42NixcInRnXCI6Ni42NixcImRcIjo1Ni42LFwicGF0aFwiOltbLTE1NywxNDldLFstMTUzLDE0OV0sWy0xMTUsMTQ5XSxbLTI0LDE0OV0sWzExNSwxNDldLFsxNTAsMTM0XSxbMTc4LDc4XSxbMTYzLC0xMTRdLFsxMTMsLTE1OF0sWzE0LC0xNThdLFstMTIxLC0xNTBdLFstMTQ5LC0xMjVdLFstMTc1LC02Nl0sWy0xNjUsMzFdLFstMTAwLDk4XSxbMSw3OF0sWzEwMyw2NV0sWzc2LDVdLFs2NiwtOTNdLFszLC03Nl0sWy05OCwtNjhdLFstNjUsLTddLFswLC0xMF0sWzE3LC04XV0sXCJtXCI6MSxcIm1wXCI6W1sxNTgsMTQ5XSxbMTUzLDE0OV0sWzExNSwxNDldLFsyNCwxNDldLFstMTE1LDE0OV0sWy0xNTAsMTM0XSxbLTE3OCw3OF0sWy0xNjMsLTExNF0sWy0xMTMsLTE1OF0sWy0xNCwtMTU4XSxbMTIxLC0xNTBdLFsxNDksLTEyNV0sWzE3NSwtNjZdLFsxNjUsMzFdLFsxMDAsOThdLFstMSw3OF0sWy0xMDMsNjVdLFstNzYsNV0sWy02NiwtOTNdLFstMywtNzZdLFs5OCwtNjhdLFs2NSwtN10sWy00LC0xNF0sWy0yMCwtMTVdXX0sXG4gIFwiNS0xNlwiOiB7XCJwYXJcIjoyNCxcInRcIjo0LjAxLFwidGdcIjo2LjQ0LFwiZFwiOjM5LjksXCJwYXRoXCI6W1stMTU3LDEwNF0sWy0xNTIsNzNdLFstMTE3LDM3XSxbLTQ1LDMwXSxbMTgyLDg5XSxbMTAsMjldLFstNTksMjldLFstMTU2LDI3XSxbLTE0NywtMTVdLFstODEsLTUyXSxbLTE4LC03MF0sWzMsLTEzMl0sWy0zNiwtMTc0XSxbLTEyNiwtMTc4XSxbLTE2OCwtMTc5XV0sXCJtXCI6MSxcIm1wXCI6W1sxNTgsMTA0XSxbMTUyLDczXSxbMTE3LDM3XSxbNDUsMzBdLFstMTgxLDg5XSxbLTEwLDI5XSxbNTksMjldLFsxNTYsMjddLFsxNDcsLTE1XSxbODEsLTUyXSxbMTgsLTcwXSxbLTMsLTEzMl0sWzM2LC0xNzRdLFsxMjYsLTE3OF0sWzE2OCwtMTc5XV19LFxuICBcIjUtMTdcIjoge1wicGFyXCI6MjEsXCJ0XCI6Mi42MSxcInRnXCI6NS40MSxcImRcIjo2Mi43LFwicGF0aFwiOltbLTE1NywxNDldLFstMTUyLDExOF0sWy0xMjAsMzhdLFstODcsNDJdLFs5MSw5MF0sWzQ4LDg5XSxbMjYsNjVdLFs0OCwtMTJdLFsxMDIsLTEyNF0sWzE2OSwtMTcyXV0sXCJtXCI6MSxcIm1wXCI6W1sxNTgsMTQ5XSxbMTUyLDExOF0sWzEyMCwzOF0sWzg3LDQyXSxbLTkxLDkwXSxbLTQ4LDg5XSxbLTI2LDY1XSxbLTQ4LC0xMl0sWy0xMDIsLTEyNF0sWy0xNjksLTE3M11dfSxcbiAgXCI1LTE4XCI6IHtcInBhclwiOjI1LFwidFwiOjMuOTIsXCJ0Z1wiOjYuNzcsXCJkXCI6NzQuNixcInBhdGhcIjpbWy0xNTcsLTE1N10sWy0xNjMsLTE4MF0sWy0xNzksLTE4MV0sWy0xODEsLTE3NV0sWy0xODEsLTEzN10sWy0xODEsLTQ3XSxbLTE3Nyw5Ml0sWzE2NiwzXSxbMTc3LC00Ml0sWzE4MiwtNTBdLFsxODIsLTM5XSxbMTgyLDNdLFsxODIsNzhdLFsxODIsMTYxXSxbMTgyLDE2N11dLFwibVwiOjEsXCJtcFwiOltbMTU4LC0xNTddLFsxNTcsLTE2Nl0sWzE1MiwtMTgwXSxbMTQwLC0xNzldLFsxMjEsLTE4MV0sWzEwMiwtMTgxXSxbODQsLTE4MV0sWzcxLC0xODFdLFs2OSwtMTgxXSxbODAsLTE4MV0sWzEwNiwtMTgxXSxbMTQ1LC0xNzddLFsxNzcsLTE2NV0sWzE2MiwtMTQxXSxbMTUxLC0xMDRdLFsxNTEsLTUzXSxbMTU1LDldLFsxNjAsODNdLFsxNjQsMTY4XSxbMTYyLDE1Nl0sWzE1NSwxNDFdLFstMTY0LC05XSxbLTE4MSw2XSxbLTE3NywzNF0sWy0xODEsNzJdLFstMTgxLDExN10sWy0xODEsMTY4XV19LFxuICBcIjUtMTlcIjoge1wicGFyXCI6MjgsXCJ0XCI6Ni45OSxcInRnXCI6Ny43MixcImRcIjo1MixcInBhdGhcIjpbWy0xNzIsLTE3NV0sWy0xNzIsLTE4MV0sWy0xNzIsLTE4MV0sWy0xNzcsLTE4MV0sWy0xODEsLTE4MV0sWy0xODEsLTE3OF0sWy0xODEsLTE2NF0sWy0xNzgsLTE2M10sWy0xNDIsLTE2M10sWy01NCwtMTYzXSxbODMsLTE2OF0sWzE1OSwtMTA1XSxbMTQ2LC05OV0sWzE4MCwtODldLFsxNjIsLTg4XSxbMTA5LC04OF0sWzYsLTg5XSxbLTE0NSwtODddLFstMTQ1LDhdLFstOTIsNzBdLFstMTEsMTcxXSxbMTEzLDE0MV0sWzE1Niw3N10sWzE1OCwxM10sWzE3MSwtNV1dLFwibVwiOjEsXCJtcFwiOltbMTczLC0xNzVdLFsxNzMsLTE4MV0sWzE3MywtMTgxXSxbMTc3LC0xODFdLFsxODIsLTE4MV0sWzE4MiwtMTc4XSxbMTgyLC0xNjRdLFsxNzgsLTE2M10sWzE0MiwtMTYzXSxbNTQsLTE2M10sWy04MywtMTY4XSxbLTE1OSwtMTA1XSxbLTE0NiwtOTldLFstMTgwLC04OV0sWy0xNjIsLTg4XSxbLTEwOSwtODhdLFstNiwtODldLFsxNDUsLTg3XSxbMTQ1LDhdLFs5Miw3MF0sWzExLDE3MV0sWy0xMTMsMTQxXSxbLTE1Niw3N10sWy0xNTgsOF0sWy0xNjcsLTEyXV19LFxuICBcIjUtMjBcIjoge1wicGFyXCI6MjksXCJ0XCI6Ni40OSxcInRnXCI6OC4xLFwiZFwiOjc1LjksXCJwYXRoXCI6W1stMTU3LC0xODFdLFstMTYyLC0xODFdLFstMTc5LC0xODFdLFstMTgxLC0xNzhdLFstMTgxLC0xNDFdLFstMTc4LC05OF0sWy0xNDQsLTk3XSxbLTcxLC05MF0sWzM1LC05OF0sWzEzNywtMTU1XSxbLTEyMywtMjldLFstMTMyLC0xN10sWy0xNzYsLTE1XSxbLTE3OSwtNDNdLFstMTgxLC0zMF0sWy0xODEsMTZdLFstMTc4LDM2XSxbLTE0NCw0NF0sWy01OSwzOV0sWzY4LDhdLFstOTAsOTNdLFs3OCwxMDFdLFsxNzQsMTAxXV0sXCJtXCI6MSxcIm1wXCI6W1sxNTgsLTE4MV0sWzE1OCwtMTgxXSxbMTYyLC0xODFdLFsxNzEsLTE4MV0sWzE4MCwtMTgxXSxbMTgxLC0xODFdLFsxODIsLTE4MV0sWzE4MiwtMTc4XSxbMTgyLC0xNjVdLFsxODIsLTE0MV0sWzE4MiwtMTAzXSxbMTgyLC05OF0sWzE4MSwtOThdLFsxNzcsLTkwXSxbMTY1LC04OF0sWzE0MCwtODhdLFsxMDIsLTg5XSxbNTIsLTkxXSxbLTgsLTkzXSxbLTcyLC0xMDVdLFstMTM1LC0xMzFdLFstMTc4LC0xNzFdLFsxNjQsLTM2XSxbMTc2LC0zMF0sWzE3NSwtMzFdLFsxODAsLTM1XSxbMTgyLC0zNl0sWzE4MiwtMzFdLFsxODIsLTE5XSxbMTgyLDZdLFsxODEsNDRdLFsxNzksMzZdLFsxNjksMzhdLFsxNDYsNDZdLFsxMTEsNDJdLFs2MiwzNl0sWzMsMjJdLFstNjYsM10sWy0xNDQsLTI0XSxbODUsOTJdLFstOCwxMDFdLFstOTUsMTA0XSxbLTE3MCw5OV1dfVxufTtcbiIsICIvLyBMZXZlbCByZWdpc3RyeTogYXV0aG9yZWQgZGVmaW5pdGlvbnMgLT4gY29tcGlsZWQgbGV2ZWxzIChsYXppbHksIGNhY2hlZCkuXG5pbXBvcnQgeyBjb21waWxlIH0gZnJvbSBcIi4vcGFyc2UuanNcIjtcbmltcG9ydCB7IFdPUkxEMSB9IGZyb20gXCIuL3dvcmxkMS5qc1wiO1xuaW1wb3J0IHsgV09STEQyIH0gZnJvbSBcIi4vd29ybGQyLmpzXCI7XG5pbXBvcnQgeyBXT1JMRDMgfSBmcm9tIFwiLi93b3JsZDMuanNcIjtcbmltcG9ydCB7IFdPUkxENCB9IGZyb20gXCIuL3dvcmxkNC5qc1wiO1xuaW1wb3J0IHsgV09STEQ1IH0gZnJvbSBcIi4vd29ybGQ1LmpzXCI7XG5pbXBvcnQgeyBNRVRBIH0gZnJvbSBcIi4vbWV0YS5nZW4uanNcIjtcblxuZXhwb3J0IGNvbnN0IFdPUkxEUyA9IFtcbiAgeyBpZDogMSwgdGhlbWU6IFwibWVhZG93XCIsIGRlZnM6IFdPUkxEMSB9LFxuICB7IGlkOiAyLCB0aGVtZTogXCJzdW5zZXRcIiwgZGVmczogV09STEQyIH0sXG4gIHsgaWQ6IDMsIHRoZW1lOiBcImljZVwiLCBkZWZzOiBXT1JMRDMgfSxcbiAgeyBpZDogNCwgdGhlbWU6IFwiZmFjdG9yeVwiLCBkZWZzOiBXT1JMRDQgfSxcbiAgeyBpZDogNSwgdGhlbWU6IFwibmVvblwiLCBkZWZzOiBXT1JMRDUgfVxuXS5maWx0ZXIoKHcpID0+IHcuZGVmcy5sZW5ndGgpO1xuXG5leHBvcnQgY29uc3QgREVGUyA9IFdPUkxEUy5mbGF0TWFwKCh3KSA9PiB3LmRlZnMubWFwKChkKSA9PiAoeyAuLi5kLCB0aGVtZTogZC50aGVtZSB8fCB3LnRoZW1lLCB3b3JsZDogdy5pZCB9KSkpO1xuZXhwb3J0IGNvbnN0IExFVkVMX0NPVU5UID0gREVGUy5sZW5ndGg7XG5cbmNvbnN0IGNhY2hlID0gbmV3IE1hcCgpO1xuLyoqIEBwYXJhbSBpIHplcm8tYmFzZWQgbGV2ZWwgaW5kZXggaW4gY2FtcGFpZ24gb3JkZXIgKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRMZXZlbChpKSB7XG4gIGlmICghY2FjaGUuaGFzKGkpKSB7XG4gICAgY29uc3QgZGVmID0gREVGU1tpXTtcbiAgICBjb25zdCBsdmwgPSBjb21waWxlKGRlZik7XG4gICAgY29uc3QgbSA9IE1FVEFbZGVmLmlkXTtcbiAgICBsdmwuaW5kZXggPSBpOyBsdmwud29ybGQgPSBkZWYud29ybGQ7XG4gICAgbHZsLnBhciA9IGRlZi5wYXIgfHwgKG0gJiYgbS5wYXIpIHx8IDMwO1xuICAgIGx2bC5oaW50ID0gKG0gJiYgbS5wYXRoKSB8fCBudWxsO1xuICAgIGNhY2hlLnNldChpLCBsdmwpO1xuICB9XG4gIHJldHVybiBjYWNoZS5nZXQoaSk7XG59XG5cbi8qKiBMZXZlbHMgdGhhdCBtYWtlIGEgZ29vZCBkYWlseSBjaGFsbGVuZ2U6IG5vdCBhIHR1dG9yaWFsLCBhbmQgdGhlIGJvdCBzb2x2ZWQgdGhlIG1pcnJvciBpbWFnZSB0b28uICovXG5leHBvcnQgY29uc3QgREFJTFlfUE9PTCA9IERFRlMubWFwKChkLCBpKSA9PiBpKS5maWx0ZXIoKGkpID0+ICFERUZTW2ldLnR1dCAmJiBNRVRBW0RFRlNbaV0uaWRdICYmIE1FVEFbREVGU1tpXS5pZF0ubSk7XG5cbmxldCBkYWlseUNhY2hlID0gbnVsbDtcbi8qKiBUaGUgbGV2ZWwgb2YgdGhlIGRheTogYSBtaXJyb3IgaW1hZ2Ugb2YgYSBjYW1wYWlnbiBsZXZlbCwgdGhlIHNhbWUgZm9yIGV2ZXJ5b25lIG9uIHRoYXQgZGF5LiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldERhaWx5KGRheSkge1xuICBpZiAoZGFpbHlDYWNoZSAmJiBkYWlseUNhY2hlLmRheSA9PT0gZGF5KSByZXR1cm4gZGFpbHlDYWNoZS5sdmw7XG4gIGlmICghREFJTFlfUE9PTC5sZW5ndGgpIHJldHVybiBudWxsO1xuICBsZXQgaCA9IChkYXkgKiAyNjU0NDM1NzYxKSA+Pj4gMDsgaCBePSBoID4+PiAxNTsgaCA9IE1hdGguaW11bChoLCAweDJjMWIzYzZkKSA+Pj4gMDsgaCA9IChoIF4gKGggPj4+IDEyKSkgPj4+IDA7XG4gIGNvbnN0IHNyYyA9IERBSUxZX1BPT0xbaCAlIERBSUxZX1BPT0wubGVuZ3RoXSwgZGVmID0gREVGU1tzcmNdLCBtID0gTUVUQVtkZWYuaWRdO1xuICBjb25zdCBsdmwgPSBjb21waWxlKGRlZiwgeyBtaXJyb3I6IHRydWUgfSk7XG4gIGx2bC5pbmRleCA9IHNyYzsgbHZsLndvcmxkID0gZGVmLndvcmxkOyBsdmwuZGFpbHkgPSB0cnVlOyBsdmwudHV0ID0gbnVsbDtcbiAgbHZsLnBhciA9IGRlZi5wYXIgfHwgbS5wYXIgfHwgMzA7XG4gIGx2bC5oaW50ID0gbS5tcCB8fCBudWxsO1xuICBkYWlseUNhY2hlID0geyBkYXksIGx2bCB9O1xuICByZXR1cm4gbHZsO1xufVxuIiwgIi8qIGdsb2JhbCBfX0VTQ19LRVlfXyAqL1xuLy8gSW5wdXQ6IG9uZSBmaW5nZXIgKG9yIHRoZSBtb3VzZSkgdHVybnMgdGhlIHdvcmxkOyBrZXlib2FyZCB3b3JrcyB0b28uXG4vLyAgIHN3aXBlIG1vZGU6IGhvcml6b250YWwgZHJhZyA9IHRpbHQgKGRyYWcgcmlnaHQgLT4gdGhlIHdvcmxkIHRpcHMgcmlnaHQpXG4vLyAgIGdyYWIgbW9kZTogIHRoZSB3b3JsZCBmb2xsb3dzIHRoZSBmaW5nZXIgYXJvdW5kIGl0cyBjZW50cmVcbmV4cG9ydCBjbGFzcyBJbnB1dCB7XG4gIGNvbnN0cnVjdG9yKGVsLCBnYW1lKSB7XG4gICAgdGhpcy5lbCA9IGVsOyB0aGlzLmdhbWUgPSBnYW1lOyB0aGlzLm1vZGUgPSBcInN3aXBlXCI7XG4gICAgdGhpcy5rZXlEaXIgPSAwOyB0aGlzLmxlZnQgPSBmYWxzZTsgdGhpcy5yaWdodCA9IGZhbHNlO1xuICAgIHRoaXMuYWN0aXZlID0gZmFsc2U7IHRoaXMuaWQgPSAtMTsgdGhpcy5seCA9IDA7IHRoaXMubHkgPSAwOyB0aGlzLnN4ID0gMDsgdGhpcy5zeSA9IDA7IHRoaXMubW92ZWQgPSAwOyB0aGlzLnQwID0gMDsgdGhpcy5sYSA9IDA7XG5cbiAgICBlbC5hZGRFdmVudExpc3RlbmVyKFwicG9pbnRlcmRvd25cIiwgKGUpID0+IHtcbiAgICAgIGlmICh0aGlzLmFjdGl2ZSkgcmV0dXJuO1xuICAgICAgdGhpcy5hY3RpdmUgPSB0cnVlOyB0aGlzLmlkID0gZS5wb2ludGVySWQ7XG4gICAgICB0cnkgeyBlbC5zZXRQb2ludGVyQ2FwdHVyZShlLnBvaW50ZXJJZCk7IH0gY2F0Y2ggKF8pIHsgLyogbm9vcCAqLyB9XG4gICAgICB0aGlzLmx4ID0gdGhpcy5zeCA9IGUuY2xpZW50WDsgdGhpcy5seSA9IHRoaXMuc3kgPSBlLmNsaWVudFk7IHRoaXMubW92ZWQgPSAwOyB0aGlzLnQwID0gcGVyZm9ybWFuY2Uubm93KCk7XG4gICAgICB0aGlzLmxhID0gdGhpcy5fYW5nbGUoZSk7XG4gICAgICBnYW1lLmdlc3R1cmUoKTtcbiAgICB9KTtcbiAgICBlbC5hZGRFdmVudExpc3RlbmVyKFwicG9pbnRlcm1vdmVcIiwgKGUpID0+IHtcbiAgICAgIGlmICghdGhpcy5hY3RpdmUgfHwgZS5wb2ludGVySWQgIT09IHRoaXMuaWQpIHJldHVybjtcbiAgICAgIGNvbnN0IGR4ID0gZS5jbGllbnRYIC0gdGhpcy5seCwgZHkgPSBlLmNsaWVudFkgLSB0aGlzLmx5O1xuICAgICAgdGhpcy5seCA9IGUuY2xpZW50WDsgdGhpcy5seSA9IGUuY2xpZW50WTtcbiAgICAgIHRoaXMubW92ZWQgKz0gTWF0aC5hYnMoZHgpICsgTWF0aC5hYnMoZHkpO1xuICAgICAgY29uc3QgcmVjdCA9IGVsLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgY29uc3Qgc2VucyA9IChNYXRoLlBJICogMC45NSkgLyBNYXRoLm1heCgyNDAsIE1hdGgubWluKHJlY3Qud2lkdGgsIHJlY3QuaGVpZ2h0KSk7ICAgLy8gYSBzd2lwZSBhY3Jvc3MgdGhlIHNob3J0IHNpZGUgXHUyMjQ4IDE3MFx1MDBCMFxuICAgICAgaWYgKHRoaXMubW9kZSA9PT0gXCJncmFiXCIpIHtcbiAgICAgICAgY29uc3QgYyA9IGdhbWUuYXJlbmFDZW50ZXIoKSwgcnggPSBlLmNsaWVudFggLSByZWN0LmxlZnQgLSBjLngsIHJ5ID0gZS5jbGllbnRZIC0gcmVjdC50b3AgLSBjLnk7XG4gICAgICAgIGNvbnN0IGEgPSBNYXRoLmF0YW4yKC1yeSwgcngpO1xuICAgICAgICBpZiAocnggKiByeCArIHJ5ICogcnkgPiAzNiAqIDM2KSB7XG4gICAgICAgICAgbGV0IGQgPSBhIC0gdGhpcy5sYTtcbiAgICAgICAgICBpZiAoZCA+IE1hdGguUEkpIGQgLT0gMiAqIE1hdGguUEk7IGVsc2UgaWYgKGQgPCAtTWF0aC5QSSkgZCArPSAyICogTWF0aC5QSTtcbiAgICAgICAgICBnYW1lLnJvdGF0ZShkKTtcbiAgICAgICAgfSBlbHNlIGdhbWUucm90YXRlKC1keCAqIHNlbnMpO1xuICAgICAgICB0aGlzLmxhID0gYTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGdhbWUucm90YXRlKC1keCAqIHNlbnMpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIGNvbnN0IHVwID0gKGUpID0+IHtcbiAgICAgIGlmICghdGhpcy5hY3RpdmUgfHwgZS5wb2ludGVySWQgIT09IHRoaXMuaWQpIHJldHVybjtcbiAgICAgIHRoaXMuYWN0aXZlID0gZmFsc2U7XG4gICAgICBpZiAodGhpcy5tb3ZlZCA8IDEwICYmIHBlcmZvcm1hbmNlLm5vdygpIC0gdGhpcy50MCA8IDMyMCkgZ2FtZS50YXAoKTtcbiAgICB9O1xuICAgIGVsLmFkZEV2ZW50TGlzdGVuZXIoXCJwb2ludGVydXBcIiwgdXApO1xuICAgIGVsLmFkZEV2ZW50TGlzdGVuZXIoXCJwb2ludGVyY2FuY2VsXCIsIHVwKTtcbiAgICBlbC5hZGRFdmVudExpc3RlbmVyKFwiY29udGV4dG1lbnVcIiwgKGUpID0+IGUucHJldmVudERlZmF1bHQoKSk7XG5cbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwgKGUpID0+IHtcbiAgICAgIGNvbnN0IGsgPSBlLmtleTtcbiAgICAgIGlmIChfX0VTQ19LRVlfXyAmJiBrID09PSBcIkVzY2FwZVwiKSB7IGdhbWUuZXNjYXBlKCk7IHJldHVybjsgfSAgIC8vIG5ldmVyIHByZXZlbnREZWZhdWx0IG9uIEVzYzsgY29tcGlsZWQgb3V0IHdoZXJlIHRoZSBwb3J0YWwgZm9yYmlkcyBFc2NcbiAgICAgIGlmIChrID09PSBcIkFycm93TGVmdFwiIHx8IGsgPT09IFwiYVwiIHx8IGsgPT09IFwiQVwiKSB7IHRoaXMubGVmdCA9IHRydWU7IGUucHJldmVudERlZmF1bHQoKTsgfVxuICAgICAgZWxzZSBpZiAoayA9PT0gXCJBcnJvd1JpZ2h0XCIgfHwgayA9PT0gXCJkXCIgfHwgayA9PT0gXCJEXCIpIHsgdGhpcy5yaWdodCA9IHRydWU7IGUucHJldmVudERlZmF1bHQoKTsgfVxuICAgICAgZWxzZSBpZiAoayA9PT0gXCIgXCIgfHwgayA9PT0gXCJFbnRlclwiKSB7IGlmICghZS5yZXBlYXQgJiYgIShlLnRhcmdldCAmJiBlLnRhcmdldC5jbG9zZXN0ICYmIGUudGFyZ2V0LmNsb3Nlc3QoXCJidXR0b24sIGlucHV0XCIpKSkgeyBnYW1lLmFjdGlvbigpOyBlLnByZXZlbnREZWZhdWx0KCk7IH0gfVxuICAgICAgZWxzZSBpZiAoayA9PT0gXCJyXCIgfHwgayA9PT0gXCJSXCIpIHsgaWYgKCFlLnJlcGVhdCkgZ2FtZS5yZXN0YXJ0S2V5KCk7IH1cbiAgICAgIGVsc2UgcmV0dXJuO1xuICAgICAgdGhpcy5rZXlEaXIgPSAodGhpcy5yaWdodCA/IDEgOiAwKSAtICh0aGlzLmxlZnQgPyAxIDogMCk7XG4gICAgICBnYW1lLmdlc3R1cmUoKTtcbiAgICB9KTtcbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcImtleXVwXCIsIChlKSA9PiB7XG4gICAgICBjb25zdCBrID0gZS5rZXk7XG4gICAgICBpZiAoayA9PT0gXCJBcnJvd0xlZnRcIiB8fCBrID09PSBcImFcIiB8fCBrID09PSBcIkFcIikgdGhpcy5sZWZ0ID0gZmFsc2U7XG4gICAgICBlbHNlIGlmIChrID09PSBcIkFycm93UmlnaHRcIiB8fCBrID09PSBcImRcIiB8fCBrID09PSBcIkRcIikgdGhpcy5yaWdodCA9IGZhbHNlO1xuICAgICAgdGhpcy5rZXlEaXIgPSAodGhpcy5yaWdodCA/IDEgOiAwKSAtICh0aGlzLmxlZnQgPyAxIDogMCk7XG4gICAgfSk7XG4gIH1cblxuICAvKiogRHJvcCBhbnkgaGVsZCBrZXlzIC8gZHJhZ3MgKGNhbGxlZCB3aGVuIHRoZSBnYW1lIGlzIHBhdXNlZCBieSB0aGUgaG9zdCkuICovXG4gIHJlc2V0KCkgeyB0aGlzLmxlZnQgPSB0aGlzLnJpZ2h0ID0gZmFsc2U7IHRoaXMua2V5RGlyID0gMDsgdGhpcy5hY3RpdmUgPSBmYWxzZTsgfVxuXG4gIF9hbmdsZShlKSB7XG4gICAgY29uc3QgcmVjdCA9IHRoaXMuZWwuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCksIGMgPSB0aGlzLmdhbWUuYXJlbmFDZW50ZXIoKTtcbiAgICByZXR1cm4gTWF0aC5hdGFuMigtKGUuY2xpZW50WSAtIHJlY3QudG9wIC0gYy55KSwgZS5jbGllbnRYIC0gcmVjdC5sZWZ0IC0gYy54KTtcbiAgfVxufVxuIiwgIi8vIEdhbWUgY29udHJvbGxlcjogb3ducyB0aGUgbG9vcCwgdGhlIGxldmVsIGZsb3cgYW5kIHRoZSBnbHVlIGJldHdlZW5cbi8vIHNpbXVsYXRpb24sIHJlbmRlcmVyLCBVSSwgYXVkaW8gYW5kIHRoZSBwbGF0Zm9ybSBhZGFwdGVyLlxuaW1wb3J0IHsgU2ltLCBEVCwgV01BWCwgYm94RGlzdDIsIHBhdGhQb3MgfSBmcm9tIFwiLi9zaW0vc2ltLmpzXCI7XG5pbXBvcnQgeyBnZXRMZXZlbCwgZ2V0RGFpbHksIERBSUxZX1BPT0wsIExFVkVMX0NPVU5ULCBXT1JMRFMgfSBmcm9tIFwiLi9sZXZlbHMvaW5kZXguanNcIjtcbmltcG9ydCB7IHRvdGFsU3RhcnMgfSBmcm9tIFwiLi9tZXRhL3NhdmUuanNcIjtcbmltcG9ydCB7IHRoZW1lT2YgfSBmcm9tIFwiLi9yZW5kZXIvdGhlbWVzLmpzXCI7XG5pbXBvcnQgeyBza2luQnlJZCB9IGZyb20gXCIuL3JlbmRlci9za2lucy5qc1wiO1xuaW1wb3J0IHsgSW5wdXQgfSBmcm9tIFwiLi9pbnB1dC5qc1wiO1xuXG5jb25zdCBGSVJTVF9BRF9BRlRFUiA9IDI7ICAgICAgICAvLyBubyBpbnRlcnN0aXRpYWwgYmVmb3JlIHRoZSBwbGF5ZXIgaGFzIGZpbmlzaGVkIGxldmVsIDNcbmNvbnN0IEhJTlRfQUZURVIgPSB7IGRlYXRoczogMywgc2VjOiA0MCB9OyAgIC8vIG9mZmVyIHRoZSByb3V0ZVxuY29uc3QgU0tJUF9BRlRFUiA9IHsgZGVhdGhzOiA2LCBzZWM6IDkwIH07ICAgLy8gb2ZmZXIgdG8gbW92ZSBvblxuY29uc3QgREFJTFlfRlJPTSA9IDU7ICAgICAgICAgICAgLy8gdGhlIGRhaWx5IGNoYWxsZW5nZSBhcHBlYXJzIG9uY2UgdGhpcyBtYW55IGxldmVscyBhcmUgdW5sb2NrZWRcbmNvbnN0IERBSUxZX0JPTlVTID0gNTsgICAgICAgICAgIC8vIGV4dHJhIGdlbXMgZm9yIHRoZSBmaXJzdCB3aW4gb2YgdGhlIGRheVxuY29uc3QgX3AgPSB7IHg6IDAsIHk6IDAsIHZ4OiAwLCB2eTogMCB9O1xuLyoqIExvY2FsIGNhbGVuZGFyIGRheSBudW1iZXIuICovXG5leHBvcnQgZnVuY3Rpb24gdG9kYXkoKSB7IGNvbnN0IGQgPSBuZXcgRGF0ZSgpOyByZXR1cm4gTWF0aC5mbG9vcigoZC5nZXRUaW1lKCkgLSBkLmdldFRpbWV6b25lT2Zmc2V0KCkgKiA2MDAwMCkgLyA4NjQwMDAwMCk7IH1cblxuZXhwb3J0IGNsYXNzIEdhbWUge1xuICBjb25zdHJ1Y3Rvcih7IHBsYXRmb3JtLCB2aWV3LCB1aSwgYXVkaW8sIHNhdmUsIGkxOG4gfSkge1xuICAgIHRoaXMucGxhdGZvcm0gPSBwbGF0Zm9ybTsgdGhpcy52aWV3ID0gdmlldzsgdGhpcy51aSA9IHVpOyB0aGlzLmF1ZGlvID0gYXVkaW87IHRoaXMuc2F2ZSA9IHNhdmU7IHRoaXMuaTE4biA9IGkxOG47XG4gICAgdGhpcy5zdGF0ZSA9IFwiYm9vdFwiOyAgICAgICAvLyBob21lIHwgcGxheSB8IGR5aW5nIHwgd2lubmluZyB8IHdvbiB8IGVuZFxuICAgIHRoaXMub3ZlcmxheSA9IG51bGw7ICAgICAgIC8vIFwibWFwXCIgfCBcInNldHRpbmdzXCIgd2hpbGUgb25lIGlzIG9wZW5cbiAgICB0aGlzLmluZGV4ID0gLTE7IHRoaXMuc2ltID0gbnVsbDtcbiAgICB0aGlzLnBhdXNlZCA9IGZhbHNlOyB0aGlzLmJ1c3kgPSBmYWxzZTsgdGhpcy5yYWYgPSAwOyB0aGlzLmxhc3QgPSAwOyB0aGlzLnQgPSAwO1xuICAgIHRoaXMuYWNjID0gMDsgdGhpcy50aW1lU2NhbGUgPSAxOyB0aGlzLnRpbWVyID0gMDsgdGhpcy5yb3RhdGVkID0gMDsgdGhpcy50dXRLaW5kID0gbnVsbDsgdGhpcy50dXRUID0gMDsgdGhpcy5kZWF0aHNIZXJlID0gMDtcbiAgICB0aGlzLnJlc3VsdCA9IG51bGw7IHRoaXMudDAgPSAtMTsgdGhpcy5kZXZUaGVtZSA9IG51bGw7XG4gICAgdGhpcy5mcHNUID0gMDsgdGhpcy5mcHNOID0gMDtcbiAgICB0aGlzLnBsYXlUID0gMDsgdGhpcy5oaW50T24gPSBmYWxzZTsgdGhpcy5fYWggPSBmYWxzZTsgdGhpcy5fYXMgPSBmYWxzZTtcbiAgICB0aGlzLmJvdCA9IG51bGw7ICAgICAgICAgICAvLyBkZXYgb25seTogeyB0cmFjaywgSyB9IHJlcGxheWVkIGluIHJlYWwgdGltZSAodHJhaWxlcnMsIGRlbW9zKVxuICAgIHRoaXMuaW5wdXQgPSBuZXcgSW5wdXQodmlldy5jYW52YXMsIHRoaXMpO1xuICAgIHRoaXMuaW5wdXQubW9kZSA9IHNhdmUuc2V0LmN0bDtcbiAgICB0aGlzLl9mcmFtZSA9IHRoaXMuX2ZyYW1lLmJpbmQodGhpcyk7XG4gIH1cblxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gYm9vdFxuICBzdGFydCgpIHtcbiAgICBjb25zdCB7IGF1ZGlvLCBwbGF0Zm9ybSwgc2F2ZSB9ID0gdGhpcztcbiAgICBhdWRpby5zZXRNdXNpYyghIXNhdmUuc2V0Lm11c2ljKTsgYXVkaW8uc2V0U2Z4KCEhc2F2ZS5zZXQuc2Z4KTtcbiAgICBhdWRpby5zZXRIb3N0KHBsYXRmb3JtLmF1ZGlvRW5hYmxlZCgpKTtcbiAgICBwbGF0Zm9ybS5vbkF1ZGlvQ2hhbmdlKChvbikgPT4gYXVkaW8uc2V0SG9zdChvbikpO1xuICAgIHBsYXRmb3JtLm9uUGF1c2UoKCkgPT4gdGhpcy5wYXVzZSgpKTtcbiAgICBwbGF0Zm9ybS5vblJlc3VtZSgoKSA9PiB0aGlzLnJlc3VtZSgpKTtcbiAgICB0aGlzLnZpZXcuc2V0U2tpbihzYXZlLnNraW4pO1xuICAgIGlmIChzYXZlLm1heCA9PT0gMCAmJiAhc2F2ZS5zdGFyc1swXSkgdGhpcy5zdGFydExldmVsKDApOyAgIC8vIGZpcnN0IGxhdW5jaDogc3RyYWlnaHQgaW50byBwbGF5XG4gICAgZWxzZSB0aGlzLmdvSG9tZSgpO1xuICAgIHRoaXMubGFzdCA9IHBlcmZvcm1hbmNlLm5vdygpO1xuICAgIHRoaXMuX2ZyYW1lKHRoaXMubGFzdCk7XG4gIH1cblxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gZmxvd1xuICBfbG9hZChpLCBkYWlseSkge1xuICAgIHRoaXMuaW5kZXggPSBpO1xuICAgIHRoaXMuZGFpbHkgPSAhIWRhaWx5O1xuICAgIGxldCBsdmwgPSBkYWlseSB8fCBnZXRMZXZlbChpKTtcbiAgICBpZiAodGhpcy5kZXZUaGVtZSkgbHZsID0geyAuLi5sdmwsIHRoZW1lOiB0aGlzLmRldlRoZW1lIH07XG4gICAgdGhpcy5zaW0gPSBuZXcgU2ltKGx2bCk7XG4gICAgdGhpcy52aWV3LmJ1aWxkKGx2bCk7XG4gICAgdGhpcy51aS5zZXRUaGVtZSh0aGVtZU9mKGx2bC50aGVtZSkpO1xuICAgIHRoaXMuYXVkaW8ucGxheU11c2ljKGx2bC50aGVtZSk7XG4gICAgdGhpcy5kZWF0aHNIZXJlID0gMDsgdGhpcy5wbGF5VCA9IDA7IHRoaXMuaGludE9uID0gZmFsc2U7IHRoaXMuX2FoID0gdGhpcy5fYXMgPSBmYWxzZTsgdGhpcy5ib3QgPSBudWxsO1xuICAgIHRoaXMudWkuYXNzaXN0KHsgaGludDogZmFsc2UsIHNraXA6IGZhbHNlLCBza2lwQWQ6IGZhbHNlIH0pO1xuICB9XG5cbiAgZ29Ib21lKCkge1xuICAgIGlmICh0aGlzLmJ1c3kpIHJldHVybjtcbiAgICBpZiAodGhpcy5zdGF0ZSA9PT0gXCJwbGF5XCIgfHwgdGhpcy5zdGF0ZSA9PT0gXCJkeWluZ1wiKSB0aGlzLnBsYXRmb3JtLmdhbWVwbGF5U3RvcChcInF1aXRcIik7XG4gICAgY29uc3QgaSA9IE1hdGgubWluKHRoaXMuc2F2ZS5tYXgsIExFVkVMX0NPVU5UIC0gMSk7XG4gICAgaWYgKHRoaXMuaW5kZXggIT09IGkgfHwgdGhpcy5zdGF0ZSAhPT0gXCJob21lXCIpIHRoaXMuX2xvYWQoaSk7XG4gICAgdGhpcy5zdGF0ZSA9IFwiaG9tZVwiOyB0aGlzLm92ZXJsYXkgPSBudWxsO1xuICAgIHRoaXMubGF5b3V0KCk7XG4gICAgdGhpcy51aS5odWQoZmFsc2UpOyB0aGlzLnVpLnR1dG9yaWFsT2ZmKCk7XG4gICAgdGhpcy51aS5ob21lKHsgbGV2ZWxOdW06IGkgKyAxLCBzdGFyczogdG90YWxTdGFycyh0aGlzLnNhdmUpLCBnZW1zOiB0aGlzLnNhdmUuZ2VtcywgZGFpbHk6IHRoaXMuX2RhaWx5SW5mbygpIH0pO1xuICB9XG5cbiAgX2RhaWx5SW5mbygpIHtcbiAgICBjb25zdCBkID0gdGhpcy5zYXZlLmRhaWx5LCB0ID0gdG9kYXkoKTtcbiAgICBpZiAodGhpcy5zYXZlLm1heCA8IERBSUxZX0ZST00gfHwgIURBSUxZX1BPT0wubGVuZ3RoKSByZXR1cm4gbnVsbDtcbiAgICByZXR1cm4geyBkb25lOiBkLmRheSA9PT0gdCwgc3RyZWFrOiBkLmRheSA+PSB0IC0gMSA/IGQuc3RyZWFrIDogMCB9O1xuICB9XG5cbiAgLyoqIExldmVsIG9mIHRoZSBkYXk6IGEgbWlycm9yZWQgY2FtcGFpZ24gbGV2ZWwsIHRoZSBzYW1lIGZvciBldmVyeW9uZS4gKi9cbiAgc3RhcnREYWlseSgpIHtcbiAgICBjb25zdCBsdmwgPSBnZXREYWlseSh0b2RheSgpKTtcbiAgICBpZiAoIWx2bCB8fCB0aGlzLmJ1c3kpIHJldHVybjtcbiAgICB0aGlzLl9sb2FkKGx2bC5pbmRleCwgbHZsKTtcbiAgICB0aGlzLnN0YXRlID0gXCJwbGF5XCI7IHRoaXMub3ZlcmxheSA9IG51bGw7XG4gICAgdGhpcy5hY2MgPSAwOyB0aGlzLnRpbWVTY2FsZSA9IDE7IHRoaXMucm90YXRlZCA9IDA7IHRoaXMudDAgPSAtMTtcbiAgICB0aGlzLmxheW91dCgpO1xuICAgIHRoaXMudWkuc2hvdyhudWxsKTsgdGhpcy51aS5odWQodHJ1ZSk7XG4gICAgdGhpcy51aS5zZXRIdWQoXCJcdTI2MDVcIiwgMCwgdGhpcy5zaW0ubHZsLmdlbXMubGVuZ3RoKTtcbiAgICB0aGlzLnVpLnR1dG9yaWFsT2ZmKCk7IHRoaXMudHV0S2luZCA9IG51bGw7XG4gICAgdGhpcy5zYXZlLnN0YXQucGxheXMrKztcbiAgICB0aGlzLnBsYXRmb3JtLmdhbWVwbGF5U3RhcnQoKTtcbiAgfVxuXG4gIHN0YXJ0TGV2ZWwoaSkge1xuICAgIHRoaXMuX2xvYWQoaSk7XG4gICAgdGhpcy5zdGF0ZSA9IFwicGxheVwiOyB0aGlzLm92ZXJsYXkgPSBudWxsO1xuICAgIHRoaXMuYWNjID0gMDsgdGhpcy50aW1lU2NhbGUgPSAxOyB0aGlzLnJvdGF0ZWQgPSAwOyB0aGlzLnQwID0gLTE7XG4gICAgdGhpcy5sYXlvdXQoKTtcbiAgICB0aGlzLnVpLnNob3cobnVsbCk7IHRoaXMudWkuaHVkKHRydWUpO1xuICAgIHRoaXMudWkuc2V0SHVkKGkgKyAxLCAwLCB0aGlzLnNpbS5sdmwuZ2Vtcy5sZW5ndGgpO1xuICAgIHRoaXMuX3R1dG9yaWFsKCk7XG4gICAgdGhpcy5zYXZlLnN0YXQucGxheXMrKztcbiAgICB0aGlzLnBsYXRmb3JtLmdhbWVwbGF5U3RhcnQoKTtcbiAgfVxuXG4gIHJlc3RhcnQoKSB7XG4gICAgaWYgKHRoaXMuc3RhdGUgIT09IFwicGxheVwiICYmIHRoaXMuc3RhdGUgIT09IFwiZHlpbmdcIikgcmV0dXJuO1xuICAgIHRoaXMuc2ltLnJlc2V0KCk7XG4gICAgY29uc3QgdiA9IHRoaXMudmlldztcbiAgICB2LmJhbGwudmlzaWJsZSA9IHRydWU7IHYuYmFsbFNoYWRvdy52aXNpYmxlID0gdHJ1ZTsgdi5iYWxsU2NhbGUgPSAxOyB2Lnpvb21UbyA9IDE7XG4gICAgdGhpcy5zdGF0ZSA9IFwicGxheVwiOyB0aGlzLmFjYyA9IDA7IHRoaXMudGltZVNjYWxlID0gMTsgdGhpcy50MCA9IC0xO1xuICAgIHRoaXMudWkuc2V0SHVkKHRoaXMuZGFpbHkgPyBcIlx1MjYwNVwiIDogdGhpcy5pbmRleCArIDEsIDAsIHRoaXMuc2ltLmx2bC5nZW1zLmxlbmd0aCk7XG4gIH1cblxuICAvKiogUmVzZXJ2ZSBzY3JlZW4gc3BhY2UgZm9yIHdoYXRldmVyIFVJIGlzIHNob3dpbmcsIGFuZCBmcmFtZSB0aGUgYXJlbmEgaW4gdGhlIHJlc3QuICovXG4gIGxheW91dCgpIHtcbiAgICBjb25zdCBzdCA9IHRoaXMudmlldy5zdGFnZSwgVyA9IHN0LmNsaWVudFdpZHRoLCBIID0gc3QuY2xpZW50SGVpZ2h0LCBsYW5kID0gVyA+IEggKiAxLjI7XG4gICAgaWYgKHRoaXMuc3RhdGUgPT09IFwiaG9tZVwiIHx8IHRoaXMuc3RhdGUgPT09IFwiYm9vdFwiKSB7XG4gICAgICB0aGlzLnZpZXcuaW5zZXRzID0gbGFuZCA/IHsgdG9wOiAxNCwgYm90dG9tOiAxNCwgbGVmdDogTWF0aC5taW4oVyAqIDAuNDYsIDQ3MCksIHJpZ2h0OiAxMCB9XG4gICAgICAgIDogeyB0b3A6IE1hdGgubWluKDE0MCwgSCAqIDAuMTkpLCBib3R0b206IE1hdGgubWluKDI1MCwgSCAqIDAuMzYpLCBsZWZ0OiAwLCByaWdodDogMCB9O1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnZpZXcuaW5zZXRzID0gbGFuZCA/IHsgdG9wOiA1NCwgYm90dG9tOiAxNCwgbGVmdDogMCwgcmlnaHQ6IDAgfSA6IHsgdG9wOiA2MCwgYm90dG9tOiA4OCwgbGVmdDogMCwgcmlnaHQ6IDAgfTtcbiAgICB9XG4gICAgdGhpcy52aWV3LnJlc2l6ZSgpO1xuICB9XG5cbiAgX3R1dG9yaWFsKCkge1xuICAgIGNvbnN0IGsgPSB0aGlzLnNpbS5sdmwudHV0LCB0ID0gKGtleSkgPT4gdGhpcy5pMThuLnQoa2V5KTtcbiAgICB0aGlzLnR1dEtpbmQgPSBudWxsO1xuICAgIGlmICghayB8fCB0aGlzLnNhdmUuc3RhcnNbdGhpcy5pbmRleF0pIHsgdGhpcy51aS50dXRvcmlhbE9mZigpOyByZXR1cm47IH1cbiAgICB0aGlzLnR1dEtpbmQgPSBrOyB0aGlzLnR1dFQgPSAwO1xuICAgIGlmIChrID09PSBcImRyYWdcIikgdGhpcy51aS50dXRvcmlhbChcInN3aXBlXCIsIHQoXCJ0dXREcmFnXCIpKTtcbiAgICBlbHNlIGlmIChrID09PSBcImJvdGhcIikgdGhpcy51aS50dXRvcmlhbChcInN3aXBlXCIsIHQoXCJ0dXRCb3RoXCIpKTtcbiAgICBlbHNlIGlmIChrID09PSBcImZsaXBcIikgdGhpcy51aS50dXRvcmlhbChcImZsaXBcIiwgdChcInR1dEZsaXBcIikpO1xuICAgIGVsc2UgaWYgKGsgPT09IFwic3Bpa2VzXCIpIHRoaXMudWkudHV0b3JpYWwoXCJub3RlXCIsIHQoXCJ0dXRTcGlrZXNcIikpO1xuICAgIGVsc2UgaWYgKGsgPT09IFwiZWRnZVwiKSB0aGlzLnVpLnR1dG9yaWFsKFwibm90ZVwiLCB0KFwidHV0RWRnZVwiKSk7XG4gICAgZWxzZSB7IGNvbnN0IGtleSA9IFwidHV0XCIgKyBrWzBdLnRvVXBwZXJDYXNlKCkgKyBrLnNsaWNlKDEpOyB0aGlzLnVpLnR1dG9yaWFsKFwibm90ZVwiLCB0KGtleSkpOyB9XG4gIH1cblxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gaW5wdXQgKGNhbGxlZCBieSBJbnB1dCAvIFVJKVxuICBnZXN0dXJlKCkgeyB0aGlzLmF1ZGlvLnVubG9jaygpOyB9XG4gIHJvdGF0ZShkKSB7XG4gICAgaWYgKHRoaXMuc3RhdGUgIT09IFwicGxheVwiIHx8IHRoaXMub3ZlcmxheSB8fCB0aGlzLnBhdXNlZCkgcmV0dXJuO1xuICAgIGNvbnN0IHMgPSB0aGlzLnNpbTtcbiAgICBsZXQgdCA9IHMudGFyZ2V0ICsgZDtcbiAgICAvLyBkb24ndCBsZXQgdGhlIGNvbW1hbmQgcnVuIGZhciBhaGVhZCBvZiB0aGUgd29ybGQsIG9yIGl0IGtlZXBzIHNwaW5uaW5nIGFmdGVyIHRoZSBmaW5nZXIgc3RvcHNcbiAgICBpZiAodCA+IHMuYW5nbGUgKyAxLjApIHQgPSBzLmFuZ2xlICsgMS4wOyBlbHNlIGlmICh0IDwgcy5hbmdsZSAtIDEuMCkgdCA9IHMuYW5nbGUgLSAxLjA7XG4gICAgdGhpcy5yb3RhdGVkICs9IE1hdGguYWJzKHQgLSBzLnRhcmdldCk7XG4gICAgcy50YXJnZXQgPSB0O1xuICAgIGlmICh0aGlzLnQwIDwgMCkgdGhpcy50MCA9IHMudGltZTsgICAgICAgICAgLy8gdGhlIGNsb2NrIGZvciB0aGUgdGltZSBzdGFyIHN0YXJ0cyB3aXRoIHRoZSBmaXJzdCBtb3ZlXG4gIH1cbiAgdGFwKCkgeyAvKiBmb3JtcyBhcnJpdmUgaW4gd29ybGQgMiAqLyB9XG5cbiAgLyoqIFNob3cgdGhlIHNvbHZlcidzIHJvdXRlLiBGcmVlOiBhIHN0dWNrIHBsYXllciBsZWF2ZXMsIGEgaGVscGVkIG9uZSBrZWVwcyBwbGF5aW5nLiAqL1xuICBoaW50KCkge1xuICAgIGlmICh0aGlzLnN0YXRlICE9PSBcInBsYXlcIiAmJiB0aGlzLnN0YXRlICE9PSBcImR5aW5nXCIpIHJldHVybjtcbiAgICB0aGlzLmhpbnRPbiA9IHRydWU7XG4gICAgdGhpcy52aWV3LnNob3dIaW50KHRoaXMuc2ltLmx2bC5oaW50KTtcbiAgICB0aGlzLl9hc3Npc3QoKTtcbiAgfVxuICAvKiogTW92ZSBvbiB3aXRob3V0IGZpbmlzaGluZyAob3B0LWluIHJld2FyZGVkIGFkIHdoZXJlIHRoZSBwbGF0Zm9ybSBoYXMgYWRzKS4gKi9cbiAgYXN5bmMgc2tpcCgpIHtcbiAgICBpZiAodGhpcy5idXN5IHx8IHRoaXMuZGFpbHkgfHwgdGhpcy5pbmRleCArIDEgPj0gTEVWRUxfQ09VTlQgfHwgKHRoaXMuc3RhdGUgIT09IFwicGxheVwiICYmIHRoaXMuc3RhdGUgIT09IFwiZHlpbmdcIikpIHJldHVybjtcbiAgICBpZiAodGhpcy5wbGF0Zm9ybS5jYXBzLmFkcykge1xuICAgICAgdGhpcy5idXN5ID0gdHJ1ZTtcbiAgICAgIGNvbnN0IG9rID0gYXdhaXQgdGhpcy5wbGF0Zm9ybS5yZXdhcmRlZChcInNraXAtbGV2ZWxcIik7XG4gICAgICB0aGlzLmJ1c3kgPSBmYWxzZTtcbiAgICAgIGlmICghb2spIHsgdGhpcy51aS50b2FzdCh0aGlzLmkxOG4udChcImFkRmFpbFwiKSk7IHJldHVybjsgfVxuICAgIH1cbiAgICB0aGlzLnNhdmUubWF4ID0gTWF0aC5tYXgodGhpcy5zYXZlLm1heCwgdGhpcy5pbmRleCArIDEpO1xuICAgIHRoaXMucGxhdGZvcm0uc2F2ZSh0aGlzLnNhdmUpO1xuICAgIHRoaXMuc3RhcnRMZXZlbCh0aGlzLmluZGV4ICsgMSk7XG4gIH1cbiAgX2Fzc2lzdCgpIHtcbiAgICBjb25zdCBoID0gIXRoaXMuaGludE9uICYmICEhdGhpcy5zaW0ubHZsLmhpbnQgJiYgKHRoaXMuZGVhdGhzSGVyZSA+PSBISU5UX0FGVEVSLmRlYXRocyB8fCB0aGlzLnBsYXlUID4gSElOVF9BRlRFUi5zZWMpO1xuICAgIGNvbnN0IHMgPSAhdGhpcy5kYWlseSAmJiB0aGlzLmluZGV4ICsgMSA8IExFVkVMX0NPVU5UICYmICh0aGlzLmRlYXRoc0hlcmUgPj0gU0tJUF9BRlRFUi5kZWF0aHMgfHwgdGhpcy5wbGF5VCA+IFNLSVBfQUZURVIuc2VjKTtcbiAgICBpZiAoaCA9PT0gdGhpcy5fYWggJiYgcyA9PT0gdGhpcy5fYXMpIHJldHVybjtcbiAgICB0aGlzLl9haCA9IGg7IHRoaXMuX2FzID0gcztcbiAgICB0aGlzLnVpLmFzc2lzdCh7IGhpbnQ6IGgsIHNraXA6IHMsIHNraXBBZDogdGhpcy5wbGF0Zm9ybS5jYXBzLmFkcyB9KTtcbiAgfVxuXG4gIG9wZW5TaG9wKCkgeyB0aGlzLm92ZXJsYXkgPSBcInNob3BcIjsgdGhpcy51aS5zaG9wKHsgb3duZWQ6IHRoaXMuc2F2ZS5za2lucywgY3VycmVudDogdGhpcy5zYXZlLnNraW4sIGdlbXM6IHRoaXMuc2F2ZS5nZW1zIH0pOyB9XG4gIHBpY2tTa2luKGlkKSB7XG4gICAgY29uc3Qgc2sgPSBza2luQnlJZChpZCksIHN2ID0gdGhpcy5zYXZlO1xuICAgIGlmIChzay5pZCAhPT0gaWQpIHJldHVybjtcbiAgICBpZiAoIXN2LnNraW5zLmluY2x1ZGVzKGlkKSkge1xuICAgICAgaWYgKHN2LmdlbXMgPCBzay5jb3N0KSB7IHRoaXMudWkudG9hc3QodGhpcy5pMThuLnQoXCJub3RFbm91Z2hcIikpOyB0aGlzLmF1ZGlvLmNsaWNrKCk7IHJldHVybjsgfVxuICAgICAgc3YuZ2VtcyAtPSBzay5jb3N0OyBzdi5za2lucy5wdXNoKGlkKTtcbiAgICAgIHRoaXMuYXVkaW8uc3RhcigyKTtcbiAgICB9IGVsc2UgdGhpcy5hdWRpby5jbGljaygpO1xuICAgIHN2LnNraW4gPSBpZDtcbiAgICB0aGlzLnZpZXcuc2V0U2tpbihpZCk7XG4gICAgdGhpcy5wbGF0Zm9ybS5zYXZlKHN2KTtcbiAgICB0aGlzLnVpLnNob3AoeyBvd25lZDogc3Yuc2tpbnMsIGN1cnJlbnQ6IHN2LnNraW4sIGdlbXM6IHN2LmdlbXMgfSk7XG4gIH1cbiAgYWN0aW9uKCkgeyBpZiAodGhpcy5vdmVybGF5KSByZXR1cm47IGlmICh0aGlzLnN0YXRlID09PSBcIndvblwiKSB0aGlzLm5leHQoKTsgZWxzZSBpZiAodGhpcy5zdGF0ZSA9PT0gXCJob21lXCIpIHRoaXMuc3RhcnRMZXZlbChNYXRoLm1pbih0aGlzLnNhdmUubWF4LCBMRVZFTF9DT1VOVCAtIDEpKTsgfVxuICByZXN0YXJ0S2V5KCkgeyBpZiAoIXRoaXMub3ZlcmxheSkgdGhpcy5yZXN0YXJ0KCk7IH1cbiAgZXNjYXBlKCkgeyBpZiAodGhpcy5vdmVybGF5KSB0aGlzLmNsb3NlT3ZlcmxheSgpOyB9XG4gIGFyZW5hQ2VudGVyKCkgeyByZXR1cm4gdGhpcy52aWV3LnRvU2NyZWVuKDAsIDAsIDApOyB9XG5cbiAgb3Blbk1hcCgpIHtcbiAgICBpZiAoKHRoaXMuc3RhdGUgPT09IFwicGxheVwiIHx8IHRoaXMuc3RhdGUgPT09IFwiZHlpbmdcIikgJiYgIXRoaXMub3ZlcmxheSkgdGhpcy5wbGF0Zm9ybS5nYW1lcGxheVN0b3AoXCJtZW51XCIpO1xuICAgIHRoaXMub3ZlcmxheSA9IFwibWFwXCI7XG4gICAgdGhpcy51aS5tYXAoeyBzdGFyczogdGhpcy5zYXZlLnN0YXJzLCBtYXg6IE1hdGgubWluKHRoaXMuc2F2ZS5tYXgsIExFVkVMX0NPVU5UIC0gMSksIGNvdW50OiBMRVZFTF9DT1VOVCwgd29ybGRzOiBXT1JMRFMubWFwKCh3KSA9PiAoeyBuOiB3LmRlZnMubGVuZ3RoLCBjb2xvcjogdGhlbWVPZih3LnRoZW1lKS53YWxsVG9wIH0pKSwgY3VycmVudDogdGhpcy5zdGF0ZSA9PT0gXCJwbGF5XCIgPyB0aGlzLmluZGV4IDogLTEgfSk7XG4gIH1cbiAgb3BlblNldHRpbmdzKCkgeyB0aGlzLm92ZXJsYXkgPSBcInNldHRpbmdzXCI7IHRoaXMudWkuc2V0dGluZ3ModGhpcy5zYXZlLnNldCk7IH1cbiAgY2xvc2VPdmVybGF5KCkge1xuICAgIHRoaXMub3ZlcmxheSA9IG51bGw7XG4gICAgaWYgKHRoaXMuc3RhdGUgPT09IFwicGxheVwiIHx8IHRoaXMuc3RhdGUgPT09IFwiZHlpbmdcIikgeyB0aGlzLnVpLnNob3cobnVsbCk7IHRoaXMucGxhdGZvcm0uZ2FtZXBsYXlTdGFydCh0cnVlKTsgfVxuICAgIGVsc2UgaWYgKHRoaXMuc3RhdGUgPT09IFwid29uXCIpIHRoaXMudWkuc2hvdyhcInNjcldpblwiKTtcbiAgICBlbHNlIGlmICh0aGlzLnN0YXRlID09PSBcImVuZFwiKSB0aGlzLnVpLnNob3coXCJzY3JFbmRcIik7XG4gICAgZWxzZSB0aGlzLmdvSG9tZSgpO1xuICB9XG4gIHNldE9wdChrZXksIHZhbHVlKSB7XG4gICAgdGhpcy5zYXZlLnNldFtrZXldID0gdmFsdWU7XG4gICAgaWYgKGtleSA9PT0gXCJtdXNpY1wiKSB0aGlzLmF1ZGlvLnNldE11c2ljKCEhdmFsdWUpO1xuICAgIGVsc2UgaWYgKGtleSA9PT0gXCJzZnhcIikgeyB0aGlzLmF1ZGlvLnNldFNmeCghIXZhbHVlKTsgaWYgKHZhbHVlKSB0aGlzLmF1ZGlvLmNsaWNrKCk7IH1cbiAgICBlbHNlIGlmIChrZXkgPT09IFwiY3RsXCIpIHRoaXMuaW5wdXQubW9kZSA9IHZhbHVlO1xuICAgIHRoaXMucGxhdGZvcm0uc2F2ZSh0aGlzLnNhdmUpO1xuICB9XG5cbiAgYXN5bmMgbmV4dCgpIHtcbiAgICBpZiAodGhpcy5idXN5IHx8IHRoaXMuc3RhdGUgIT09IFwid29uXCIpIHJldHVybjtcbiAgICB0aGlzLmJ1c3kgPSB0cnVlO1xuICAgIGlmICh0aGlzLmRhaWx5IHx8IHRoaXMuaW5kZXggPj0gRklSU1RfQURfQUZURVIpIGF3YWl0IHRoaXMucGxhdGZvcm0uaW50ZXJzdGl0aWFsKCk7ICAgLy8gbmF0dXJhbCBicmVhayBiZXR3ZWVuIHR3byBsZXZlbHNcbiAgICB0aGlzLmJ1c3kgPSBmYWxzZTtcbiAgICBpZiAodGhpcy5kYWlseSkgeyB0aGlzLnN0YXRlID0gXCJob21lXCI7IHRoaXMuaW5kZXggPSAtMTsgdGhpcy5nb0hvbWUoKTsgfVxuICAgIGVsc2UgaWYgKHRoaXMuaW5kZXggKyAxID49IExFVkVMX0NPVU5UKSB7IHRoaXMuc3RhdGUgPSBcImVuZFwiOyB0aGlzLnVpLmh1ZChmYWxzZSk7IHRoaXMudWkuc2hvdyhcInNjckVuZFwiKTsgfVxuICAgIGVsc2UgdGhpcy5zdGFydExldmVsKHRoaXMuaW5kZXggKyAxKTtcbiAgfVxuICByZXRyeSgpIHsgaWYgKHRoaXMuYnVzeSkgcmV0dXJuOyBpZiAodGhpcy5kYWlseSkgdGhpcy5zdGFydERhaWx5KCk7IGVsc2UgdGhpcy5zdGFydExldmVsKHRoaXMuaW5kZXgpOyB9XG5cbiAgYXN5bmMgZG91YmxlKCkge1xuICAgIGlmICh0aGlzLmJ1c3kgfHwgIXRoaXMucmVzdWx0IHx8IHRoaXMucmVzdWx0LmRvdWJsZWQpIHJldHVybjtcbiAgICB0aGlzLmJ1c3kgPSB0cnVlOyB0aGlzLnVpLmRvdWJsZUJ1c3kodHJ1ZSk7XG4gICAgY29uc3Qgb2sgPSBhd2FpdCB0aGlzLnBsYXRmb3JtLnJld2FyZGVkKFwiZG91YmxlLWdlbXNcIik7XG4gICAgdGhpcy5idXN5ID0gZmFsc2U7IHRoaXMudWkuZG91YmxlQnVzeShmYWxzZSk7XG4gICAgaWYgKCFvaykgeyB0aGlzLnVpLnRvYXN0KHRoaXMuaTE4bi50KFwiYWRGYWlsXCIpKTsgcmV0dXJuOyB9XG4gICAgdGhpcy5yZXN1bHQuZG91YmxlZCA9IHRydWU7XG4gICAgdGhpcy5zYXZlLmdlbXMgKz0gdGhpcy5yZXN1bHQuZ290OyB0aGlzLnNhdmUuZWFybmVkICs9IHRoaXMucmVzdWx0LmdvdDtcbiAgICB0aGlzLnBsYXRmb3JtLnNhdmUodGhpcy5zYXZlKTtcbiAgICB0aGlzLnVpLnNldFdpbkdlbXMoYCR7dGhpcy5yZXN1bHQuZ290fS8ke3RoaXMucmVzdWx0LnRvdGFsfSBcdTAwRDcyYCk7XG4gICAgdGhpcy51aS5kb3VibGVEb25lKCk7XG4gIH1cblxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gcGF1c2UgKGhvc3QtZHJpdmVuKVxuICBwYXVzZSgpIHtcbiAgICBpZiAodGhpcy5wYXVzZWQpIHJldHVybjtcbiAgICB0aGlzLnBhdXNlZCA9IHRydWU7XG4gICAgaWYgKHRoaXMucmFmKSB7IGNhbmNlbEFuaW1hdGlvbkZyYW1lKHRoaXMucmFmKTsgdGhpcy5yYWYgPSAwOyB9XG4gICAgdGhpcy5pbnB1dC5yZXNldCgpO1xuICAgIHRoaXMuYXVkaW8ucGF1c2UoKTtcbiAgICB0aGlzLnVpLnBhdXNlZCh0cnVlKTtcbiAgICB0aGlzLnBsYXRmb3JtLnNhdmUodGhpcy5zYXZlLCB0cnVlKTtcbiAgfVxuICByZXN1bWUoKSB7XG4gICAgaWYgKCF0aGlzLnBhdXNlZCkgcmV0dXJuO1xuICAgIHRoaXMucGF1c2VkID0gZmFsc2U7XG4gICAgdGhpcy51aS5wYXVzZWQoZmFsc2UpO1xuICAgIHRoaXMuYXVkaW8ucmVzdW1lKCk7XG4gICAgdGhpcy5sYXN0ID0gcGVyZm9ybWFuY2Uubm93KCk7XG4gICAgdGhpcy5fZnJhbWUodGhpcy5sYXN0KTtcbiAgfVxuXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBsb29wXG4gIF9mcmFtZShub3cpIHtcbiAgICB0aGlzLnJhZiA9IDA7XG4gICAgaWYgKHRoaXMucGF1c2VkIHx8IHRoaXMubWFudWFsKSByZXR1cm47XG4gICAgY29uc3QgZHQgPSBNYXRoLm1pbigwLjA1LCBNYXRoLm1heCgwLjAwMSwgKG5vdyAtIHRoaXMubGFzdCkgLyAxMDAwKSk7XG4gICAgdGhpcy5sYXN0ID0gbm93OyB0aGlzLnQgKz0gZHQ7XG4gICAgLy8gZnJhbWUtcmF0ZSB3YXRjaGRvZzogdGhyZWUgYmFkIHNlY29uZHMgaW4gYSByb3cgLT4gcmVuZGVyIGZld2VyIHBpeGVsc1xuICAgIHRoaXMuZnBzVCArPSBkdDsgdGhpcy5mcHNOKys7XG4gICAgaWYgKHRoaXMuZnBzVCA+PSAzKSB7IGlmICh0aGlzLmZwc04gLyB0aGlzLmZwc1QgPCA0MikgdGhpcy52aWV3LmRlZ3JhZGUoKTsgdGhpcy5mcHNUID0gMDsgdGhpcy5mcHNOID0gMDsgfVxuICAgIHRoaXMuX3VwZGF0ZShkdCk7XG4gICAgdGhpcy52aWV3LmRyYXcodGhpcy5zaW0sIHRoaXMudCwgZHQpO1xuICAgIHRoaXMucmFmID0gcmVxdWVzdEFuaW1hdGlvbkZyYW1lKHRoaXMuX2ZyYW1lKTtcbiAgfVxuXG4gIF91cGRhdGUoZHQpIHtcbiAgICBjb25zdCBzID0gdGhpcy5zaW07XG4gICAgaWYgKHRoaXMuc3RhdGUgPT09IFwiaG9tZVwiKSB7IHMuYW5nbGUgPSBNYXRoLnNpbih0aGlzLnQgKiAwLjUpICogMC4yOyByZXR1cm47IH1cbiAgICBpZiAodGhpcy5zdGF0ZSA9PT0gXCJwbGF5XCIpIHtcbiAgICAgIGlmICh0aGlzLm92ZXJsYXkpIHJldHVybjtcbiAgICAgIGlmICh0aGlzLmlucHV0LmtleURpcikgdGhpcy5yb3RhdGUoLXRoaXMuaW5wdXQua2V5RGlyICogV01BWCAqIDAuOTUgKiBkdCk7XG4gICAgICB0aGlzLmFjYyArPSBkdCAqIHRoaXMudGltZVNjYWxlO1xuICAgICAgbGV0IG4gPSAwO1xuICAgICAgY29uc3QgYm90ID0gdGhpcy5ib3Q7XG4gICAgICB3aGlsZSAodGhpcy5hY2MgPj0gRFQgJiYgbiA8IDEyKSB7IHMuc3RlcChib3QgPyBib3QudHJhY2tbKHMudGljayAvIGJvdC5LKSB8IDBdIHx8IDAgOiB1bmRlZmluZWQpOyB0aGlzLmFjYyAtPSBEVDsgbisrOyBpZiAoIXMuYWxpdmUgfHwgcy53b24pIGJyZWFrOyB9XG4gICAgICBpZiAobiA9PT0gMTIpIHRoaXMuYWNjID0gMDtcbiAgICAgIHRoaXMuX2V2ZW50cygpO1xuICAgICAgaWYgKHRoaXMuc3RhdGUgPT09IFwicGxheVwiKSB7XG4gICAgICAgIHRoaXMucGxheVQgKz0gZHQ7XG4gICAgICAgIHRoaXMuX2Fzc2lzdCgpO1xuICAgICAgICB0aGlzLl9kYW5nZXIoZHQpO1xuICAgICAgICB0aGlzLmF1ZGlvLnJvbGwoTWF0aC5oeXBvdChzLnZ4LCBzLnZ5KSwgcy5haXIgPCAzKTtcbiAgICAgICAgdGhpcy5fdHV0VGljayhkdCk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmICh0aGlzLnN0YXRlID09PSBcImR5aW5nXCIpIHtcbiAgICAgIHRoaXMudGltZXIgLT0gZHQ7XG4gICAgICBpZiAodGhpcy50aW1lciA8PSAwKSB0aGlzLnJlc3RhcnQoKTtcbiAgICB9IGVsc2UgaWYgKHRoaXMuc3RhdGUgPT09IFwid2lubmluZ1wiKSB7XG4gICAgICB0aGlzLnRpbWVyIC09IGR0O1xuICAgICAgdGhpcy52aWV3LmJhbGxTY2FsZSA9IE1hdGgubWF4KDAsIHRoaXMudGltZXIgLyAwLjQ1KTtcbiAgICAgIGlmICh0aGlzLnRpbWVyIDw9IDApIHsgdGhpcy5zdGF0ZSA9IFwid29uXCI7IHRoaXMudmlldy5iYWxsLnZpc2libGUgPSBmYWxzZTsgdGhpcy52aWV3LmJhbGxTaGFkb3cudmlzaWJsZSA9IGZhbHNlOyB0aGlzLl9zaG93V2luKCk7IH1cbiAgICB9XG4gIH1cblxuICBfZXZlbnRzKCkge1xuICAgIGNvbnN0IHMgPSB0aGlzLnNpbSwgdiA9IHRoaXMudmlldywgYSA9IHRoaXMuYXVkaW8sIGV2ID0gcy5ldmVudHM7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBldi5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgZSA9IGV2W2ldO1xuICAgICAgaWYgKGUudCA9PT0gXCJoaXRcIikgeyB2LmZ4SGl0KGUueCwgZS55LCBlLnYpOyBhLmhpdChlLnYpOyB9XG4gICAgICBlbHNlIGlmIChlLnQgPT09IFwiZ2VtXCIpIHsgdi5meEdlbShlLngsIGUueSk7IGEuZ2VtKHMuZ2VtQ291bnQgLSAxKTsgdGhpcy51aS5zZXRIdWQodGhpcy5kYWlseSA/IFwiXHUyNjA1XCIgOiB0aGlzLmluZGV4ICsgMSwgcy5nZW1Db3VudCwgcy5sdmwuZ2Vtcy5sZW5ndGgpOyB9XG4gICAgICBlbHNlIGlmIChlLnQgPT09IFwiYnVtcFwiKSB7IHYuZnhCdW1wKGUueCwgZS55KTsgYS5idW1wKCk7IH1cbiAgICAgIGVsc2UgaWYgKGUudCA9PT0gXCJwYWRcIikgeyB2LmZ4UGFkKGUueCwgZS55KTsgYS5wYWQoKTsgfVxuICAgICAgZWxzZSBpZiAoZS50ID09PSBcInNoYXR0ZXJcIikgeyB2LmZ4U2hhdHRlcihlLngsIGUueSk7IGEuc2hhdHRlcigpOyB9XG4gICAgICBlbHNlIGlmIChlLnQgPT09IFwia2V5XCIpIHsgdi5meEtleShlLngsIGUueSwgZS52KTsgYS5rZXkoZS52KTsgfVxuICAgICAgZWxzZSBpZiAoZS50ID09PSBcInBvcnRcIikgeyB2LmZ4UG9ydChlLngsIGUueSwgZS52KTsgYS5wb3J0KCk7IH1cbiAgICAgIGVsc2UgaWYgKGUudCA9PT0gXCJkaWVcIikgdGhpcy5fZGllKCk7XG4gICAgICBlbHNlIGlmIChlLnQgPT09IFwid2luXCIpIHRoaXMuX3dpbigpO1xuICAgIH1cbiAgICBldi5sZW5ndGggPSAwO1xuICB9XG5cbiAgLyoqIEJ1bGxldC10aW1lIHdoZW4gdGhlIGJhbGwgaXMgYWJvdXQgdG8gdG91Y2ggc29tZXRoaW5nIGRlYWRseS4gKi9cbiAgX2RhbmdlcihkdCkge1xuICAgIGNvbnN0IHMgPSB0aGlzLnNpbSwgTCA9IHMubHZsLCByID0gcy5mb3JtLnI7XG4gICAgbGV0IGQgPSAxZTk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBMLmtpbGxzLmxlbmd0aDsgaSsrKSB7IGNvbnN0IHEgPSBib3hEaXN0MihzLngsIHMueSwgTC5raWxsc1tpXSk7IGlmIChxIDwgZCkgZCA9IHE7IH1cbiAgICBkID0gTWF0aC5zcXJ0KGQpO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgTC5zYXdzLmxlbmd0aDsgaSsrKSB7IHBhdGhQb3MoTC5zYXdzW2ldLCBzLnRpbWUsIF9wKTsgY29uc3QgcSA9IE1hdGguaHlwb3Qocy54IC0gX3AueCwgcy55IC0gX3AueSkgLSBMLnNhd3NbaV0ucjsgaWYgKHEgPCBkKSBkID0gcTsgfVxuICAgIGNvbnN0IG5lYXIgPSBkIDwgciArIDE0ICYmIE1hdGguaHlwb3Qocy52eCwgcy52eSkgPiA3MDtcbiAgICB0aGlzLnRpbWVTY2FsZSArPSAoKG5lYXIgPyAwLjYgOiAxKSAtIHRoaXMudGltZVNjYWxlKSAqIE1hdGgubWluKDEsIGR0ICogMTApO1xuICB9XG5cbiAgX3R1dFRpY2soZHQpIHtcbiAgICBpZiAoIXRoaXMudHV0S2luZCkgcmV0dXJuO1xuICAgIHRoaXMudHV0VCArPSBkdDtcbiAgICBjb25zdCBrID0gdGhpcy50dXRLaW5kO1xuICAgIGNvbnN0IGRvbmUgPSAoayA9PT0gXCJkcmFnXCIgfHwgayA9PT0gXCJib3RoXCIpID8gdGhpcy5yb3RhdGVkID4gMC43IDogayA9PT0gXCJmbGlwXCIgPyBNYXRoLmFicyh0aGlzLnNpbS5hbmdsZSkgPiAyLjIgOiB0aGlzLnR1dFQgPiAzLjU7XG4gICAgaWYgKGRvbmUpIHsgdGhpcy50dXRLaW5kID0gbnVsbDsgdGhpcy51aS50dXRvcmlhbE9mZigpOyB9XG4gIH1cblxuICBfZGllKCkge1xuICAgIGNvbnN0IHMgPSB0aGlzLnNpbSwgdiA9IHRoaXMudmlldztcbiAgICB0aGlzLnN0YXRlID0gXCJkeWluZ1wiOyB0aGlzLnRpbWVyID0gMC42O1xuICAgIHYuYmFsbC52aXNpYmxlID0gZmFsc2U7IHYuYmFsbFNoYWRvdy52aXNpYmxlID0gZmFsc2U7XG4gICAgdi5meERpZShzLngsIHMueSk7XG4gICAgdGhpcy5hdWRpby5kaWUoKTsgdGhpcy5hdWRpby5yb2xsKDAsIGZhbHNlKTtcbiAgICB0aGlzLnNhdmUuc3RhdC5kZWF0aHMrKzsgdGhpcy5kZWF0aHNIZXJlKys7XG4gICAgdGhpcy5fYXNzaXN0KCk7XG4gIH1cblxuICBfd2luKCkge1xuICAgIGNvbnN0IHMgPSB0aGlzLnNpbSwgTCA9IHMubHZsLCBzdiA9IHRoaXMuc2F2ZSwgaSA9IHRoaXMuaW5kZXg7XG4gICAgdGhpcy5zdGF0ZSA9IFwid2lubmluZ1wiOyB0aGlzLnRpbWVyID0gMC40NTtcbiAgICB0aGlzLnZpZXcuZnhXaW4oTC5nb2FsLngsIEwuZ29hbC55KTtcbiAgICB0aGlzLmF1ZGlvLndpbigpOyB0aGlzLmF1ZGlvLnJvbGwoMCwgZmFsc2UpO1xuICAgIHRoaXMudWkudHV0b3JpYWxPZmYoKTtcbiAgICBjb25zdCB0b3RhbCA9IEwuZ2Vtcy5sZW5ndGgsIGdvdCA9IHMuZ2VtQ291bnQsIHRpbWUgPSBNYXRoLm1heCgwLjEsIHMudGltZSAtIE1hdGgubWF4KDAsIHRoaXMudDApKTtcbiAgICBjb25zdCBmYXN0ID0gdGltZSA8PSBMLnBhciwgYWxsID0gZ290ID09PSB0b3RhbDtcbiAgICBjb25zdCBzdGFycyA9IDEgKyAoYWxsIHx8IGZhc3QgPyAxIDogMCkgKyAoYWxsICYmIGZhc3QgPyAxIDogMCk7XG4gICAgbGV0IGJvbnVzID0gMDtcbiAgICBpZiAodGhpcy5kYWlseSkge1xuICAgICAgY29uc3QgdCA9IHRvZGF5KCksIGQgPSBzdi5kYWlseTtcbiAgICAgIGlmIChkLmRheSAhPT0gdCkgeyBkLnN0cmVhayA9IGQuZGF5ID09PSB0IC0gMSA/IGQuc3RyZWFrICsgMSA6IDE7IGQuZGF5ID0gdDsgZC5iZXN0ID0gTWF0aC5tYXgoZC5iZXN0LCBkLnN0cmVhayk7IGJvbnVzID0gREFJTFlfQk9OVVMgKyBNYXRoLm1pbihkLnN0cmVhaywgNSk7IH1cbiAgICB9IGVsc2Uge1xuICAgICAgc3Yuc3RhcnNbaV0gPSBNYXRoLm1heChzdi5zdGFyc1tpXSB8fCAwLCBzdGFycyk7XG4gICAgICBjb25zdCB0ZW50aHMgPSBNYXRoLnJvdW5kKHRpbWUgKiAxMCk7XG4gICAgICBzdi5iZXN0W2ldID0gc3YuYmVzdFtpXSA/IE1hdGgubWluKHN2LmJlc3RbaV0sIHRlbnRocykgOiB0ZW50aHM7XG4gICAgICBpZiAoaSArIDEgPCBMRVZFTF9DT1VOVCkgc3YubWF4ID0gTWF0aC5tYXgoc3YubWF4LCBpICsgMSk7XG4gICAgfVxuICAgIHN2LmdlbXMgKz0gZ290ICsgYm9udXM7IHN2LmVhcm5lZCArPSBnb3QgKyBib251czsgc3Yuc3RhdC53aW5zKys7XG4gICAgZm9yIChsZXQgayA9IDA7IGsgPCBzdi5zdGFycy5sZW5ndGg7IGsrKykgaWYgKHN2LnN0YXJzW2tdID09PSB1bmRlZmluZWQpIHN2LnN0YXJzW2tdID0gMDsgICAvLyBrZWVwIHRoZSBhcnJheSBkZW5zZSBmb3IgSlNPTlxuICAgIHRoaXMucmVzdWx0ID0geyBzdGFycywgdGltZSwgcGFyOiBMLnBhciwgZ290LCB0b3RhbCwgYm9udXMsIGRvdWJsZWQ6IGZhbHNlIH07XG4gICAgdGhpcy5wbGF0Zm9ybS5zYXZlKHN2KTtcbiAgICB0aGlzLnBsYXRmb3JtLnNjb3JlKHRvdGFsU3RhcnMoc3YpKTtcbiAgICBpZiAoc3RhcnMgPT09IDMpIHRoaXMucGxhdGZvcm0uaGFwcHkoKTsgICAgICAgIC8vIHBvcnRhbHMgd2FudCB0aGlzIHNwYXJpbmdseSwgbm90IG9uIGV2ZXJ5IHdpblxuICAgIHRoaXMucGxhdGZvcm0uZ2FtZXBsYXlTdG9wKFwid2luXCIpO1xuICB9XG5cbiAgX3Nob3dXaW4oKSB7XG4gICAgY29uc3QgciA9IHRoaXMucmVzdWx0O1xuICAgIHRoaXMudWkuaHVkKGZhbHNlKTtcbiAgICB0aGlzLnVpLndpbih7IC4uLnIsIGNhbkRvdWJsZTogdGhpcy5wbGF0Zm9ybS5jYXBzLmFkcyAmJiByLmdvdCA+IDAsIG9uU3RhcjogKGkpID0+IHRoaXMuYXVkaW8uc3RhcihpKSB9KTtcbiAgfVxuXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBkZXYgLyB0ZXN0IGhvb2tzIChzdHJpcHBlZCBmcm9tIHBsYXRmb3JtIGJ1aWxkcylcbiAgZGV2QXBpKCkge1xuICAgIGNvbnN0IGcgPSB0aGlzO1xuICAgIHJldHVybiB7XG4gICAgICBnYW1lOiBnLFxuICAgICAgc3RhcnQ6IChpKSA9PiBnLnN0YXJ0TGV2ZWwoaSksXG4gICAgICBkYWlseTogKCkgPT4gZy5zdGFydERhaWx5KCksXG4gICAgICBzdGF0ZTogKCkgPT4gKHsgc3RhdGU6IGcuc3RhdGUsIGluZGV4OiBnLmluZGV4LCBvdmVybGF5OiBnLm92ZXJsYXksIHBhdXNlZDogZy5wYXVzZWQsIHg6IGcuc2ltLngsIHk6IGcuc2ltLnksIGFuZ2xlOiBnLnNpbS5hbmdsZSwgZ2VtczogZy5zaW0uZ2VtQ291bnQsIGFsaXZlOiBnLnNpbS5hbGl2ZSwgd29uOiBnLnNpbS53b24sIHRpbWU6IGcuc2ltLnRpbWUsIHNhdmU6IGcuc2F2ZSwgaW5mbzogZy52aWV3LmluZm8oKSB9KSxcbiAgICAgIC8qKiBhZHZhbmNlIHRoZSBzaW0gbiB0aWNrcyB3aXRoIHNwaW4gY29tbWFuZCB1LCB0aGVuIGxldCB0aGUgZ2FtZSByZWFjdCAqL1xuICAgICAgc3RlcDogKG4sIHUgPSAwKSA9PiB7IGZvciAobGV0IGsgPSAwOyBrIDwgbiAmJiBnLnNpbS5hbGl2ZSAmJiAhZy5zaW0ud29uOyBrKyspIGcuc2ltLnN0ZXAodSk7IGcuX2V2ZW50cygpOyB9LFxuICAgICAgc2V0dGxlOiAoc2VjKSA9PiB7IGcuX3VwZGF0ZShzZWMpOyB9LFxuICAgICAgLyoqIHJlcGxheSBhIHNvbHZlciB0cmFjayBpbiByZWFsIHRpbWUgb24gdGhlIGN1cnJlbnQgbGV2ZWwgKi9cbiAgICAgIGJvdDogKHRyYWNrLCBLKSA9PiB7IGcuYm90ID0gdHJhY2sgPyB7IHRyYWNrLCBLIH0gOiBudWxsOyBnLnQwID0gMDsgfSxcbiAgICAgIC8qKiBmcmFtZS1ieS1mcmFtZSBtb2RlIGZvciB2aWRlbyBjYXB0dXJlOiBzdG9wIHRoZSByZWFsLXRpbWUgbG9vcCwgdGhlbiBhZHZhbmNlIHdpdGggZnJhbWUoZHQpICovXG4gICAgICBtYW51YWw6IChvbikgPT4geyBnLm1hbnVhbCA9IG9uOyBpZiAoIW9uKSB7IGcubGFzdCA9IHBlcmZvcm1hbmNlLm5vdygpOyBnLl9mcmFtZShnLmxhc3QpOyB9IH0sXG4gICAgICBmcmFtZTogKGR0KSA9PiB7IGcudCArPSBkdDsgZy5fdXBkYXRlKGR0KTsgZy52aWV3LmRyYXcoZy5zaW0sIGcudCwgZHQpOyB9LFxuICAgICAgbGV2ZWxDb3VudDogTEVWRUxfQ09VTlRcbiAgICB9O1xuICB9XG59XG4iLCAiLy8gRW50cnkgcG9pbnQuIEJvb3Qgb3JkZXIgbWF0dGVycyBvbiBZb3VUdWJlIFBsYXlhYmxlczpcbi8vICAgbG9hZGluZyBzY3JlZW4gdmlzaWJsZSAtPiBmaXJzdEZyYW1lUmVhZHkgLT4gbG9hZERhdGEgLT4gYnVpbGQgLT4gZ2FtZVJlYWR5IChpbnRlcmFjdGl2ZSlcbi8qIGdsb2JhbCBfX0RFVl9fICovXG5pbXBvcnQgcGxhdGZvcm0gZnJvbSBcIkBwbGF0Zm9ybVwiO1xuaW1wb3J0IHsgbWlncmF0ZSB9IGZyb20gXCIuL21ldGEvc2F2ZS5qc1wiO1xuaW1wb3J0IHsgSTE4biB9IGZyb20gXCIuL2kxOG4vc3RyaW5ncy5qc1wiO1xuaW1wb3J0IHsgVmlldywgZGV0ZWN0VGllciB9IGZyb20gXCIuL3JlbmRlci92aWV3LmpzXCI7XG5pbXBvcnQgeyBVSSB9IGZyb20gXCIuL3VpL3VpLmpzXCI7XG5pbXBvcnQgeyBHYW1lQXVkaW8gfSBmcm9tIFwiLi9hdWRpby9hdWRpby5qc1wiO1xuaW1wb3J0IHsgR2FtZSB9IGZyb20gXCIuL2dhbWUuanNcIjtcblxuYXN5bmMgZnVuY3Rpb24gYm9vdCgpIHtcbiAgcGxhdGZvcm0ubG9hZGluZ1Nob3duKCk7ICAgICAgICAgICAgICAgICAvLyB0aGUgbG9hZGluZyBzY3JlZW4gaXMgcGxhaW4gSFRNTCwgYWxyZWFkeSBvbiBzY3JlZW5cblxuICBjb25zdCBpMThuID0gbmV3IEkxOG4oKTtcbiAgbGV0IHJhdyA9IG51bGwsIGxhbmcgPSBcImVuXCI7XG4gIHRyeSB7IFtyYXcsIGxhbmddID0gYXdhaXQgUHJvbWlzZS5hbGwoW3BsYXRmb3JtLmxvYWQoKSwgcGxhdGZvcm0ubGFuZ3VhZ2UoKV0pOyB9IGNhdGNoIChfKSB7IC8qIHBsYXkgd2l0aCBkZWZhdWx0cyAqLyB9XG4gIGkxOG4uc2V0KGxhbmcpO1xuICBjb25zdCBzYXZlID0gbWlncmF0ZShyYXcpO1xuXG4gIGxldCBnYW1lID0gbnVsbDtcbiAgY29uc3QgZyA9IChuYW1lKSA9PiAoLi4uYSkgPT4geyBpZiAoZ2FtZSkgcmV0dXJuIGdhbWVbbmFtZV0oLi4uYSk7IH07XG4gIGNvbnN0IHVpID0gbmV3IFVJKGkxOG4sIHtcbiAgICBwbGF5OiBnKFwiYWN0aW9uXCIpLCBuZXh0OiBnKFwibmV4dFwiKSwgcmV0cnk6IGcoXCJyZXRyeVwiKSwgb3Blbk1hcDogZyhcIm9wZW5NYXBcIiksIHBpY2s6IGcoXCJzdGFydExldmVsXCIpLFxuICAgIG9wZW5TZXR0aW5nczogZyhcIm9wZW5TZXR0aW5nc1wiKSwgY2xvc2VPdmVybGF5OiBnKFwiY2xvc2VPdmVybGF5XCIpLCBkb3VibGU6IGcoXCJkb3VibGVcIiksIHJlc3RhcnQ6IGcoXCJyZXN0YXJ0XCIpLFxuICAgIHNldE9wdDogZyhcInNldE9wdFwiKSwgZ2VzdHVyZTogZyhcImdlc3R1cmVcIiksIG9wZW5TaG9wOiBnKFwib3BlblNob3BcIiksIHBpY2tTa2luOiBnKFwicGlja1NraW5cIiksIGhpbnQ6IGcoXCJoaW50XCIpLCBza2lwOiBnKFwic2tpcFwiKSwgaG9tZTogZyhcImdvSG9tZVwiKSwgZGFpbHk6IGcoXCJzdGFydERhaWx5XCIpXG4gIH0pO1xuXG4gIGNvbnN0IHN0YWdlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzdGFnZVwiKTtcbiAgbGV0IHRpZXIgPSBkZXRlY3RUaWVyKCksIHN0YXJ0QXQgPSAtMTtcbiAgaWYgKF9fREVWX18pIHtcbiAgICBjb25zdCBxcyA9IG5ldyBVUkxTZWFyY2hQYXJhbXMobG9jYXRpb24uc2VhcmNoKTtcbiAgICBpZiAocXMuaGFzKFwidGllclwiKSkgdGllciA9IE1hdGgubWF4KDAsIE1hdGgubWluKDIsIHFzLmdldChcInRpZXJcIikgfCAwKSk7XG4gICAgaWYgKHFzLmhhcyhcImxldmVsXCIpKSBzdGFydEF0ID0gKHFzLmdldChcImxldmVsXCIpIHwgMCkgLSAxO1xuICAgIGlmIChxcy5nZXQoXCJjdGxcIikgPT09IFwiZ3JhYlwiIHx8IHFzLmdldChcImN0bFwiKSA9PT0gXCJzd2lwZVwiKSBzYXZlLnNldC5jdGwgPSBxcy5nZXQoXCJjdGxcIik7XG4gIH1cblxuICBsZXQgdmlldztcbiAgdHJ5IHsgdmlldyA9IG5ldyBWaWV3KHN0YWdlLCB0aWVyKTsgfVxuICBjYXRjaCAoXykgeyB1aS5lcnJvcigpOyBwbGF0Zm9ybS5sb2dFcnJvcigpOyBwbGF0Zm9ybS5yZWFkeSgpOyByZXR1cm47IH1cblxuICBnYW1lID0gbmV3IEdhbWUoeyBwbGF0Zm9ybSwgdmlldywgdWksIGF1ZGlvOiBuZXcgR2FtZUF1ZGlvKCksIHNhdmUsIGkxOG4gfSk7XG5cbiAgLy8gaGFyZHdhcmUgQmFjayAoQW5kcm9pZCBzaGVsbCk6IGNsb3NlIGEgZGlhbG9nLCBvciBsZWF2ZSBhIGxldmVsIGZvciB0aGUgaG9tZSBzY3JlZW47IGZhbHNlID0gbGV0IHRoZSBhcHAgY2xvc2VcblxuICBpZiAocGxhdGZvcm0uaWQgPT09IFwibG9jYWxcIikgd2luZG93Ll9fZndCYWNrID0gKCkgPT4geyBpZiAoZ2FtZS5vdmVybGF5KSB7IGdhbWUuY2xvc2VPdmVybGF5KCk7IHJldHVybiB0cnVlOyB9IGlmIChnYW1lLnN0YXRlID09PSBcInBsYXlcIiB8fCBnYW1lLnN0YXRlID09PSBcImR5aW5nXCIgfHwgZ2FtZS5zdGF0ZSA9PT0gXCJ3b25cIikgeyBnYW1lLmdvSG9tZSgpOyByZXR1cm4gdHJ1ZTsgfSByZXR1cm4gZmFsc2U7IH07XG4gIGlmIChfX0RFVl9fKSBnYW1lLmRldlRoZW1lID0gbmV3IFVSTFNlYXJjaFBhcmFtcyhsb2NhdGlvbi5zZWFyY2gpLmdldChcInRoZW1lXCIpO1xuICBjb25zdCBmaXQgPSAoKSA9PiBnYW1lLmxheW91dCgpO1xuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcInJlc2l6ZVwiLCBmaXQpO1xuICBpZiAod2luZG93LlJlc2l6ZU9ic2VydmVyKSBuZXcgUmVzaXplT2JzZXJ2ZXIoZml0KS5vYnNlcnZlKHN0YWdlKTtcbiAgZ2FtZS5zdGFydCgpO1xuICBpZiAoX19ERVZfXykge1xuICAgIHdpbmRvdy5fX2Z3ID0gZ2FtZS5kZXZBcGkoKTtcbiAgICBpZiAoc3RhcnRBdCA+PSAwKSBnYW1lLnN0YXJ0TGV2ZWwoTWF0aC5taW4oc3RhcnRBdCwgd2luZG93Ll9fZncubGV2ZWxDb3VudCAtIDEpKTtcbiAgfVxuICBwbGF0Zm9ybS5yZWFkeSgpOyAgICAgICAgICAgICAgICAgICAgICAgIC8vIG1lbnVzIC8gZmlyc3QgbGV2ZWwgYXJlIGludGVyYWN0aXZlIG5vd1xufVxuXG5ib290KCk7XG4iXSwKICAibWFwcGluZ3MiOiAiOztBQUdBLE1BQU0sTUFBTTtBQUNaLE1BQU0sS0FBSyxJQUFJLGdCQUFnQixTQUFTLE1BQU07QUFDOUMsTUFBSSxVQUFVO0FBQWQsTUFBb0IsV0FBVztBQUUvQixXQUFTLE9BQU8sT0FBTyxJQUFJO0FBRXpCLFdBQU8sSUFBSSxRQUFRLENBQUMsWUFBWTtBQUM5QixVQUFJLFFBQVMsU0FBUTtBQUNyQixZQUFNLEtBQUssU0FBUyxjQUFjLEtBQUs7QUFDdkMsU0FBRyxZQUFZO0FBQVUsU0FBRyxjQUFjO0FBQzFDLGVBQVMsS0FBSyxZQUFZLEVBQUU7QUFDNUIsaUJBQVcsTUFBTTtBQUFFLFdBQUcsT0FBTztBQUFHLFlBQUksU0FBVSxVQUFTO0FBQUcsZ0JBQVEsSUFBSTtBQUFBLE1BQUcsR0FBRyxFQUFFO0FBQUEsSUFDaEYsQ0FBQztBQUFBLEVBQ0g7QUFFQSxNQUFPLGdCQUFRO0FBQUEsSUFDYixJQUFJO0FBQUEsSUFDSixNQUFNLEVBQUUsS0FBSyxHQUFHLElBQUksS0FBSyxNQUFNLEtBQUssY0FBYyxLQUFLO0FBQUEsSUFFdkQsZUFBZTtBQUFBLElBQUM7QUFBQSxJQUNoQixRQUFRO0FBQUEsSUFBQztBQUFBLElBRVQsTUFBTSxPQUFPO0FBQ1gsVUFBSSxHQUFHLElBQUksT0FBTyxNQUFNLEtBQUs7QUFBRSxZQUFJO0FBQUUsdUJBQWEsV0FBVyxHQUFHO0FBQUEsUUFBRyxTQUFTLEdBQUc7QUFBQSxRQUFhO0FBQUUsZUFBTztBQUFBLE1BQU07QUFDM0csVUFBSTtBQUFFLGNBQU0sTUFBTSxhQUFhLFFBQVEsR0FBRztBQUFHLGVBQU8sTUFBTSxLQUFLLE1BQU0sR0FBRyxJQUFJO0FBQUEsTUFBTSxTQUFTLEdBQUc7QUFBRSxlQUFPO0FBQUEsTUFBTTtBQUFBLElBQy9HO0FBQUEsSUFDQSxLQUFLLE1BQU07QUFBRSxVQUFJO0FBQUUscUJBQWEsUUFBUSxLQUFLLEtBQUssVUFBVSxJQUFJLENBQUM7QUFBQSxNQUFHLFNBQVMsR0FBRztBQUFBLE1BQXFCO0FBQUEsSUFBRTtBQUFBLElBRXZHLE1BQU0sV0FBVztBQUFFLGFBQU8sR0FBRyxJQUFJLE1BQU0sS0FBSyxVQUFVLFlBQVk7QUFBQSxJQUFNO0FBQUEsSUFFeEUsZUFBZTtBQUFFLGFBQU8sR0FBRyxJQUFJLE1BQU0sTUFBTTtBQUFBLElBQUs7QUFBQSxJQUNoRCxnQkFBZ0I7QUFBQSxJQUFDO0FBQUEsSUFDakIsUUFBUSxJQUFJO0FBQ1YsZ0JBQVU7QUFDVixlQUFTLGlCQUFpQixvQkFBb0IsTUFBTTtBQUFFLFlBQUksU0FBUyxRQUFRO0FBQUUsY0FBSSxRQUFTLFNBQVE7QUFBQSxRQUFHLFdBQVcsU0FBVSxVQUFTO0FBQUEsTUFBRyxDQUFDO0FBQUEsSUFDekk7QUFBQSxJQUNBLFNBQVMsSUFBSTtBQUFFLGlCQUFXO0FBQUEsSUFBSTtBQUFBLElBRTlCLE1BQU0sZUFBZTtBQUFFLGFBQU8sS0FBSyxLQUFLLE1BQU0sT0FBTyw4QkFBMkIsR0FBRyxJQUFJO0FBQUEsSUFBTztBQUFBLElBQzlGLE1BQU0sU0FBUyxJQUFJO0FBQUUsYUFBTyxLQUFLLEtBQUssTUFBTSxPQUFPLHVCQUFvQixLQUFLLFVBQVUsSUFBSSxJQUFJO0FBQUEsSUFBTztBQUFBLElBRXJHLFFBQVE7QUFBQSxJQUFDO0FBQUEsSUFBRyxXQUFXO0FBQUEsSUFBQztBQUFBLElBQ3hCLGdCQUFnQjtBQUFBLElBQUM7QUFBQSxJQUFHLGVBQWU7QUFBQSxJQUFDO0FBQUEsSUFBRyxRQUFRO0FBQUEsSUFBQztBQUFBLEVBQ2xEOzs7QUM1Q08sTUFBTSxlQUFlO0FBRXJCLFdBQVMsWUFBWTtBQUMxQixXQUFPO0FBQUEsTUFDTCxHQUFHO0FBQUEsTUFDSCxPQUFPLENBQUM7QUFBQTtBQUFBLE1BQ1IsTUFBTSxDQUFDO0FBQUE7QUFBQSxNQUNQLEtBQUs7QUFBQTtBQUFBLE1BQ0wsTUFBTTtBQUFBO0FBQUEsTUFDTixRQUFRO0FBQUE7QUFBQSxNQUNSLE9BQU8sQ0FBQyxTQUFTO0FBQUEsTUFBRyxNQUFNO0FBQUEsTUFDMUIsS0FBSyxFQUFFLE9BQU8sR0FBRyxLQUFLLEdBQUcsS0FBSyxTQUFTLFFBQVEsRUFBRTtBQUFBLE1BQ2pELEtBQUssQ0FBQztBQUFBO0FBQUEsTUFDTixNQUFNLEVBQUUsUUFBUSxHQUFHLE1BQU0sR0FBRyxPQUFPLEVBQUU7QUFBQSxNQUNyQyxPQUFPLEVBQUUsS0FBSyxHQUFHLFFBQVEsR0FBRyxNQUFNLEVBQUU7QUFBQSxJQUN0QztBQUFBLEVBQ0Y7QUFHTyxXQUFTLFFBQVEsS0FBSztBQUMzQixVQUFNLElBQUksVUFBVTtBQUNwQixRQUFJLENBQUMsT0FBTyxPQUFPLFFBQVEsU0FBVSxRQUFPO0FBQzVDLFFBQUk7QUFDRixVQUFJLElBQUksTUFBTSxLQUFLLElBQUksa0JBQWtCLFFBQVc7QUFFbEQsY0FBTSxLQUFLLElBQUksU0FBUyxDQUFDO0FBQ3pCLG1CQUFXLEtBQUssT0FBTyxLQUFLLEVBQUUsR0FBRztBQUFFLGdCQUFNLEtBQUssSUFBSSxLQUFLO0FBQUcsY0FBSSxLQUFLLEtBQUssSUFBSSxJQUFLLEdBQUUsTUFBTSxDQUFDLElBQUksU0FBUyxHQUFHLENBQUMsR0FBRyxHQUFHLENBQUM7QUFBQSxRQUFHO0FBQ3JILFVBQUUsTUFBTSxVQUFVLElBQUksZ0JBQWdCLEtBQUssR0FBRyxHQUFHLEdBQUc7QUFDcEQsVUFBRSxPQUFPLEVBQUUsU0FBUyxTQUFTLElBQUksV0FBVyxHQUFHLEdBQUc7QUFDbEQsZUFBTztBQUFBLE1BQ1Q7QUFDQSxVQUFJLE1BQU0sUUFBUSxJQUFJLEtBQUssRUFBRyxHQUFFLFFBQVEsSUFBSSxNQUFNLE1BQU0sR0FBRyxHQUFJLEVBQUUsSUFBSSxDQUFDLE1BQU0sU0FBUyxHQUFHLEdBQUcsQ0FBQyxDQUFDO0FBQzdGLFVBQUksTUFBTSxRQUFRLElBQUksSUFBSSxFQUFHLEdBQUUsT0FBTyxJQUFJLEtBQUssTUFBTSxHQUFHLEdBQUksRUFBRSxJQUFJLENBQUMsTUFBTSxTQUFTLEdBQUcsR0FBRyxHQUFHLENBQUM7QUFDNUYsUUFBRSxNQUFNLFNBQVMsSUFBSSxLQUFLLEdBQUcsR0FBSTtBQUNqQyxRQUFFLE9BQU8sU0FBUyxJQUFJLE1BQU0sR0FBRyxHQUFHO0FBQ2xDLFFBQUUsU0FBUyxTQUFTLElBQUksUUFBUSxFQUFFLE1BQU0sR0FBRztBQUMzQyxVQUFJLE1BQU0sUUFBUSxJQUFJLEtBQUssRUFBRyxHQUFFLFFBQVEsQ0FBQyxHQUFHLG9CQUFJLElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxNQUFNLE9BQU8sQ0FBQyxNQUFNLE9BQU8sTUFBTSxRQUFRLENBQUMsQ0FBQyxDQUFDLEVBQUUsTUFBTSxHQUFHLEdBQUc7QUFDakksVUFBSSxPQUFPLElBQUksU0FBUyxZQUFZLEVBQUUsTUFBTSxTQUFTLElBQUksSUFBSSxFQUFHLEdBQUUsT0FBTyxJQUFJO0FBQzdFLFVBQUksSUFBSSxPQUFPLE9BQU8sSUFBSSxRQUFRLFVBQVU7QUFDMUMsVUFBRSxJQUFJLFFBQVEsSUFBSSxJQUFJLFFBQVEsSUFBSTtBQUFHLFVBQUUsSUFBSSxNQUFNLElBQUksSUFBSSxNQUFNLElBQUk7QUFBRyxVQUFFLElBQUksU0FBUyxJQUFJLElBQUksU0FBUyxJQUFJO0FBQzFHLFVBQUUsSUFBSSxNQUFNLElBQUksSUFBSSxRQUFRLFNBQVMsU0FBUztBQUFBLE1BQ2hEO0FBQ0EsVUFBSSxJQUFJLE9BQU8sT0FBTyxJQUFJLFFBQVEsU0FBVSxZQUFXLEtBQUssT0FBTyxLQUFLLElBQUksR0FBRyxFQUFFLE1BQU0sR0FBRyxFQUFFLEVBQUcsR0FBRSxJQUFJLENBQUMsSUFBSTtBQUMxRyxVQUFJLElBQUksUUFBUSxPQUFPLElBQUksU0FBUyxVQUFVO0FBQUUsVUFBRSxLQUFLLFNBQVMsU0FBUyxJQUFJLEtBQUssUUFBUSxHQUFHLEdBQUc7QUFBRyxVQUFFLEtBQUssT0FBTyxTQUFTLElBQUksS0FBSyxNQUFNLEdBQUcsR0FBRztBQUFHLFVBQUUsS0FBSyxRQUFRLFNBQVMsSUFBSSxLQUFLLE9BQU8sR0FBRyxHQUFHO0FBQUEsTUFBRztBQUNuTSxVQUFJLElBQUksU0FBUyxPQUFPLElBQUksVUFBVSxVQUFVO0FBQUUsVUFBRSxNQUFNLE1BQU0sU0FBUyxJQUFJLE1BQU0sS0FBSyxHQUFHLEdBQUc7QUFBRyxVQUFFLE1BQU0sU0FBUyxTQUFTLElBQUksTUFBTSxRQUFRLEdBQUcsR0FBRztBQUFHLFVBQUUsTUFBTSxPQUFPLFNBQVMsSUFBSSxNQUFNLE1BQU0sR0FBRyxHQUFHO0FBQUEsTUFBRztBQUFBLElBQ3pNLFNBQVMsR0FBRztBQUFFLGFBQU8sVUFBVTtBQUFBLElBQUc7QUFDbEMsV0FBTztBQUFBLEVBQ1Q7QUFFQSxXQUFTLFNBQVMsR0FBRyxJQUFJLElBQUk7QUFBRSxRQUFJLE9BQU8sQ0FBQztBQUFHLFFBQUksQ0FBQyxTQUFTLENBQUMsRUFBRyxLQUFJO0FBQUksUUFBSSxLQUFLLE1BQU0sQ0FBQztBQUFHLFdBQU8sSUFBSSxLQUFLLEtBQUssSUFBSSxLQUFLLEtBQUs7QUFBQSxFQUFHO0FBb0IxSCxXQUFTLFdBQVcsR0FBRztBQUFFLFFBQUksSUFBSTtBQUFHLGFBQVMsSUFBSSxHQUFHLElBQUksRUFBRSxNQUFNLFFBQVEsSUFBSyxNQUFLLEVBQUUsTUFBTSxDQUFDLEtBQUs7QUFBRyxXQUFPO0FBQUEsRUFBRzs7O0FDckU3RyxNQUFNLE9BQU87QUFBQSxJQUNsQjtBQUFBLElBQVc7QUFBQSxJQUFTO0FBQUEsSUFBVTtBQUFBLElBQVE7QUFBQSxJQUFTO0FBQUEsSUFBWTtBQUFBLElBQVM7QUFBQSxJQUFPO0FBQUEsSUFBVztBQUFBLElBQVk7QUFBQSxJQUNsRztBQUFBLElBQVE7QUFBQSxJQUFRO0FBQUEsSUFBUTtBQUFBLElBQVU7QUFBQSxJQUFXO0FBQUEsSUFBVztBQUFBLElBQWE7QUFBQSxJQUFXO0FBQUEsSUFDaEY7QUFBQSxJQUFZO0FBQUEsSUFBVztBQUFBLElBQWM7QUFBQSxJQUFVO0FBQUEsSUFBVztBQUFBLElBQVM7QUFBQSxJQUFTO0FBQUEsSUFBUTtBQUFBLElBQVE7QUFBQSxJQUFhO0FBQUEsSUFDekc7QUFBQSxJQUFVO0FBQUEsSUFBWTtBQUFBLElBQVU7QUFBQSxJQUFVO0FBQUEsSUFBVztBQUFBLElBQVk7QUFBQSxJQUFVO0FBQUEsRUFDN0U7QUFFTyxNQUFNLE9BQU87QUFBQSxJQUNsQixJQUFJO0FBQUEsTUFBQztBQUFBLE1BQWE7QUFBQSxNQUFTO0FBQUEsTUFBVztBQUFBLE1BQWE7QUFBQSxNQUFjO0FBQUEsTUFBVztBQUFBLE1BQVU7QUFBQSxNQUFXO0FBQUEsTUFBYTtBQUFBLE1BQVk7QUFBQSxNQUN4SDtBQUFBLE1BQVU7QUFBQSxNQUFZO0FBQUEsTUFBYztBQUFBLE1BQVk7QUFBQSxNQUFtQztBQUFBLE1BQXlCO0FBQUEsTUFBc0I7QUFBQSxNQUFvQjtBQUFBLE1BQ3RKO0FBQUEsTUFBc0I7QUFBQSxNQUFpRjtBQUFBLE1BQWtCO0FBQUEsTUFBNkI7QUFBQSxNQUFrRDtBQUFBLE1BQVU7QUFBQSxNQUFTO0FBQUEsTUFBUztBQUFBLE1BQWdCO0FBQUEsTUFBZ0I7QUFBQSxNQUNwUTtBQUFBLE1BQWtDO0FBQUEsTUFBMEI7QUFBQSxNQUFxQjtBQUFBLE1BQTJCO0FBQUEsTUFBNkM7QUFBQSxNQUFtQztBQUFBLE1BQXNCO0FBQUEsSUFBK0I7QUFBQSxJQUNuUCxJQUFJO0FBQUEsTUFBQztBQUFBLE1BQWU7QUFBQSxNQUFTO0FBQUEsTUFBVTtBQUFBLE1BQVc7QUFBQSxNQUFXO0FBQUEsTUFBVztBQUFBLE1BQVU7QUFBQSxNQUFRO0FBQUEsTUFBYTtBQUFBLE1BQVk7QUFBQSxNQUNqSDtBQUFBLE1BQVE7QUFBQSxNQUFVO0FBQUEsTUFBYTtBQUFBLE1BQVc7QUFBQSxNQUFpQztBQUFBLE1BQThCO0FBQUEsTUFBcUI7QUFBQSxNQUE2QjtBQUFBLE1BQzNKO0FBQUEsTUFBbUI7QUFBQSxNQUE4RTtBQUFBLE1BQWdCO0FBQUEsTUFBd0I7QUFBQSxNQUF3QztBQUFBLE1BQVU7QUFBQSxNQUFTO0FBQUEsTUFBUTtBQUFBLE1BQWU7QUFBQSxNQUFnQjtBQUFBLE1BQzNPO0FBQUEsTUFBa0M7QUFBQSxNQUF1QjtBQUFBLE1BQW1CO0FBQUEsTUFBd0I7QUFBQSxNQUFtQztBQUFBLE1BQXlCO0FBQUEsTUFBcUI7QUFBQSxJQUF3QjtBQUFBLElBQy9NLElBQUk7QUFBQSxNQUFDO0FBQUEsTUFBUztBQUFBLE1BQVM7QUFBQSxNQUFTO0FBQUEsTUFBVTtBQUFBLE1BQVc7QUFBQSxNQUFpQjtBQUFBLE1BQVM7QUFBQSxNQUFnQjtBQUFBLE1BQWE7QUFBQSxNQUFXO0FBQUEsTUFDckg7QUFBQSxNQUFRO0FBQUEsTUFBVTtBQUFBLE1BQVk7QUFBQSxNQUFZO0FBQUEsTUFBaUM7QUFBQSxNQUE2QjtBQUFBLE1BQW9CO0FBQUEsTUFBMEI7QUFBQSxNQUN0SjtBQUFBLE1BQW1CO0FBQUEsTUFBZ0Y7QUFBQSxNQUFpQjtBQUFBLE1BQTJCO0FBQUEsTUFBK0M7QUFBQSxNQUFhO0FBQUEsTUFBUztBQUFBLE1BQVE7QUFBQSxNQUFzQjtBQUFBLE1BQXVCO0FBQUEsTUFDelE7QUFBQSxNQUFnQztBQUFBLE1BQTBCO0FBQUEsTUFBc0I7QUFBQSxNQUFnQztBQUFBLE1BQXlDO0FBQUEsTUFBZ0M7QUFBQSxNQUF1QjtBQUFBLElBQXdCO0FBQUEsSUFDMU8sSUFBSTtBQUFBLE1BQUM7QUFBQSxNQUFlO0FBQUEsTUFBVTtBQUFBLE1BQVc7QUFBQSxNQUFXO0FBQUEsTUFBVztBQUFBLE1BQVk7QUFBQSxNQUFXO0FBQUEsTUFBa0I7QUFBQSxNQUFhO0FBQUEsTUFBVztBQUFBLE1BQzlIO0FBQUEsTUFBVTtBQUFBLE1BQVc7QUFBQSxNQUFhO0FBQUEsTUFBWTtBQUFBLE1BQWlDO0FBQUEsTUFBMEI7QUFBQSxNQUEwQjtBQUFBLE1BQWU7QUFBQSxNQUNsSjtBQUFBLE1BQW1CO0FBQUEsTUFBNEY7QUFBQSxNQUFzQjtBQUFBLE1BQTZCO0FBQUEsTUFBNEM7QUFBQSxNQUFVO0FBQUEsTUFBVTtBQUFBLE1BQVU7QUFBQSxNQUFvQjtBQUFBLE1BQXVCO0FBQUEsTUFDdlI7QUFBQSxNQUFtQztBQUFBLE1BQTRCO0FBQUEsTUFBaUI7QUFBQSxNQUF5QjtBQUFBLE1BQXdDO0FBQUEsTUFBa0M7QUFBQSxNQUFvQjtBQUFBLElBQTBCO0FBQUEsSUFDbk8sSUFBSTtBQUFBLE1BQUM7QUFBQSxNQUFnQjtBQUFBLE1BQVc7QUFBQSxNQUFXO0FBQUEsTUFBVTtBQUFBLE1BQVc7QUFBQSxNQUFnQjtBQUFBLE1BQVU7QUFBQSxNQUFrQjtBQUFBLE1BQVc7QUFBQSxNQUFVO0FBQUEsTUFDL0g7QUFBQSxNQUFTO0FBQUEsTUFBVztBQUFBLE1BQWE7QUFBQSxNQUFZO0FBQUEsTUFBbUM7QUFBQSxNQUE4QjtBQUFBLE1BQXVCO0FBQUEsTUFBZTtBQUFBLE1BQ3BKO0FBQUEsTUFBcUI7QUFBQSxNQUFvRjtBQUFBLE1BQW1CO0FBQUEsTUFBdUI7QUFBQSxNQUFzRDtBQUFBLE1BQVU7QUFBQSxNQUFXO0FBQUEsTUFBUztBQUFBLE1BQWlCO0FBQUEsTUFBdUI7QUFBQSxNQUMvUTtBQUFBLE1BQWlDO0FBQUEsTUFBMEI7QUFBQSxNQUFpQjtBQUFBLE1BQTJCO0FBQUEsTUFBdUM7QUFBQSxNQUFrQztBQUFBLE1BQXlCO0FBQUEsSUFBMEI7QUFBQSxJQUNyTyxJQUFJO0FBQUEsTUFBQztBQUFBLE1BQVU7QUFBQSxNQUFPO0FBQUEsTUFBUztBQUFBLE1BQU07QUFBQSxNQUFRO0FBQUEsTUFBTTtBQUFBLE1BQU07QUFBQSxNQUFPO0FBQUEsTUFBTTtBQUFBLE1BQVE7QUFBQSxNQUM1RTtBQUFBLE1BQVE7QUFBQSxNQUFRO0FBQUEsTUFBVztBQUFBLE1BQVM7QUFBQSxNQUFpQjtBQUFBLE1BQWU7QUFBQSxNQUFTO0FBQUEsTUFBWTtBQUFBLE1BQ3pGO0FBQUEsTUFBWTtBQUFBLE1BQXFDO0FBQUEsTUFBUztBQUFBLE1BQWM7QUFBQSxNQUFxQjtBQUFBLE1BQU87QUFBQSxNQUFPO0FBQUEsTUFBTztBQUFBLE1BQVE7QUFBQSxNQUFhO0FBQUEsTUFDdkk7QUFBQSxNQUFlO0FBQUEsTUFBYztBQUFBLE1BQWE7QUFBQSxNQUFZO0FBQUEsTUFBYztBQUFBLE1BQWlCO0FBQUEsTUFBUztBQUFBLElBQWM7QUFBQSxJQUM5RyxJQUFJO0FBQUEsTUFBQztBQUFBLE1BQWU7QUFBQSxNQUFTO0FBQUEsTUFBWTtBQUFBLE1BQVM7QUFBQSxNQUFVO0FBQUEsTUFBVztBQUFBLE1BQVM7QUFBQSxNQUFpQjtBQUFBLE1BQWM7QUFBQSxNQUFVO0FBQUEsTUFDdkg7QUFBQSxNQUFVO0FBQUEsTUFBVztBQUFBLE1BQWE7QUFBQSxNQUFnQjtBQUFBLE1BQThCO0FBQUEsTUFBa0I7QUFBQSxNQUFzQjtBQUFBLE1BQW1CO0FBQUEsTUFDM0k7QUFBQSxNQUFxQjtBQUFBLE1BQXdFO0FBQUEsTUFBeUI7QUFBQSxNQUFvQjtBQUFBLE1BQW9DO0FBQUEsTUFBUztBQUFBLE1BQVU7QUFBQSxNQUFTO0FBQUEsTUFBYztBQUFBLE1BQXFCO0FBQUEsTUFDN087QUFBQSxNQUE2QjtBQUFBLE1BQXVCO0FBQUEsTUFBa0I7QUFBQSxNQUF1QjtBQUFBLE1BQThCO0FBQUEsTUFBMkI7QUFBQSxNQUFxQjtBQUFBLElBQTJCO0FBQUEsSUFDeE0sSUFBSTtBQUFBLE1BQUM7QUFBQSxNQUFXO0FBQUEsTUFBUztBQUFBLE1BQVM7QUFBQSxNQUFVO0FBQUEsTUFBVTtBQUFBLE1BQWM7QUFBQSxNQUFTO0FBQUEsTUFBYztBQUFBLE1BQVc7QUFBQSxNQUFTO0FBQUEsTUFDN0c7QUFBQSxNQUFVO0FBQUEsTUFBVTtBQUFBLE1BQWE7QUFBQSxNQUFVO0FBQUEsTUFBaUM7QUFBQSxNQUF5QjtBQUFBLE1BQXdCO0FBQUEsTUFBcUI7QUFBQSxNQUNsSjtBQUFBLE1BQWtCO0FBQUEsTUFBa0Y7QUFBQSxNQUFvQjtBQUFBLE1BQTRCO0FBQUEsTUFBbUQ7QUFBQSxNQUFTO0FBQUEsTUFBUTtBQUFBLE1BQVk7QUFBQSxNQUFnQjtBQUFBLE1BQWtCO0FBQUEsTUFDdFE7QUFBQSxNQUFpQztBQUFBLE1BQXdCO0FBQUEsTUFBbUI7QUFBQSxNQUF1QjtBQUFBLE1BQWlDO0FBQUEsTUFBeUI7QUFBQSxNQUFtQjtBQUFBLElBQXlCO0FBQUEsSUFDM00sSUFBSTtBQUFBLE1BQUM7QUFBQSxNQUFrQjtBQUFBLE1BQVE7QUFBQSxNQUFRO0FBQUEsTUFBTztBQUFBLE1BQVU7QUFBQSxNQUFZO0FBQUEsTUFBUztBQUFBLE1BQWdCO0FBQUEsTUFBVztBQUFBLE1BQVU7QUFBQSxNQUNoSDtBQUFBLE1BQVc7QUFBQSxNQUFXO0FBQUEsTUFBYTtBQUFBLE1BQVk7QUFBQSxNQUE4QjtBQUFBLE1BQW9CO0FBQUEsTUFBa0I7QUFBQSxNQUFtQjtBQUFBLE1BQ3RJO0FBQUEsTUFBZ0I7QUFBQSxNQUE4RTtBQUFBLE1BQW1CO0FBQUEsTUFBNEI7QUFBQSxNQUEyQztBQUFBLE1BQVk7QUFBQSxNQUFVO0FBQUEsTUFBUztBQUFBLE1BQWM7QUFBQSxNQUFlO0FBQUEsTUFDcFA7QUFBQSxNQUErQjtBQUFBLE1BQTZCO0FBQUEsTUFBYztBQUFBLE1BQTRCO0FBQUEsTUFBZ0M7QUFBQSxNQUE4QjtBQUFBLE1BQTBCO0FBQUEsSUFBMEI7QUFBQSxJQUMxTixJQUFJO0FBQUEsTUFBQztBQUFBLE1BQWE7QUFBQSxNQUFXO0FBQUEsTUFBVTtBQUFBLE1BQVU7QUFBQSxNQUFVO0FBQUEsTUFBYTtBQUFBLE1BQVU7QUFBQSxNQUFTO0FBQUEsTUFBYztBQUFBLE1BQVM7QUFBQSxNQUNoSDtBQUFBLE1BQVk7QUFBQSxNQUFZO0FBQUEsTUFBYTtBQUFBLE1BQVM7QUFBQSxNQUE2QjtBQUFBLE1BQTBCO0FBQUEsTUFBb0I7QUFBQSxNQUFpQjtBQUFBLE1BQzFJO0FBQUEsTUFBZ0I7QUFBQSxNQUF3RTtBQUFBLE1BQXFCO0FBQUEsTUFBc0I7QUFBQSxNQUE4QztBQUFBLE1BQVc7QUFBQSxNQUFRO0FBQUEsTUFBYTtBQUFBLE1BQWM7QUFBQSxNQUF5QjtBQUFBLE1BQ3hQO0FBQUEsTUFBNkI7QUFBQSxNQUEwQjtBQUFBLE1BQWlCO0FBQUEsTUFBd0I7QUFBQSxNQUFtQztBQUFBLE1BQWdDO0FBQUEsTUFBb0I7QUFBQSxJQUFpQjtBQUFBLElBQzFNLElBQUk7QUFBQSxNQUFDO0FBQUEsTUFBYTtBQUFBLE1BQU87QUFBQSxNQUFZO0FBQUEsTUFBUTtBQUFBLE1BQVk7QUFBQSxNQUFXO0FBQUEsTUFBUTtBQUFBLE1BQXFCO0FBQUEsTUFBYztBQUFBLE1BQVE7QUFBQSxNQUNySDtBQUFBLE1BQVk7QUFBQSxNQUFjO0FBQUEsTUFBYTtBQUFBLE1BQVk7QUFBQSxNQUEyQjtBQUFBLE1BQXVCO0FBQUEsTUFBdUI7QUFBQSxNQUFvQjtBQUFBLE1BQ2hKO0FBQUEsTUFBd0I7QUFBQSxNQUF3RTtBQUFBLE1BQWlCO0FBQUEsTUFBMEI7QUFBQSxNQUErQztBQUFBLE1BQVE7QUFBQSxNQUFRO0FBQUEsTUFBUztBQUFBLE1BQWM7QUFBQSxNQUFpQjtBQUFBLE1BQ2xQO0FBQUEsTUFBd0I7QUFBQSxNQUF1QjtBQUFBLE1BQWU7QUFBQSxNQUFvQjtBQUFBLE1BQThCO0FBQUEsTUFBcUI7QUFBQSxNQUFxQjtBQUFBLElBQXVCO0FBQUEsSUFDbkwsSUFBSTtBQUFBLE1BQUM7QUFBQSxNQUFjO0FBQUEsTUFBUTtBQUFBLE1BQWU7QUFBQSxNQUFTO0FBQUEsTUFBWTtBQUFBLE1BQVc7QUFBQSxNQUFRO0FBQUEsTUFBaUI7QUFBQSxNQUFhO0FBQUEsTUFBTztBQUFBLE1BQ3JIO0FBQUEsTUFBVTtBQUFBLE1BQVc7QUFBQSxNQUFlO0FBQUEsTUFBZ0I7QUFBQSxNQUFvQjtBQUFBLE1BQXNCO0FBQUEsTUFBbUI7QUFBQSxNQUFrQjtBQUFBLE1BQ25JO0FBQUEsTUFBbUI7QUFBQSxNQUE2RDtBQUFBLE1BQVc7QUFBQSxNQUF1QjtBQUFBLE1BQWtDO0FBQUEsTUFBTztBQUFBLE1BQVU7QUFBQSxNQUFTO0FBQUEsTUFBWTtBQUFBLE1BQWE7QUFBQSxNQUN2TTtBQUFBLE1BQXdCO0FBQUEsTUFBOEI7QUFBQSxNQUFlO0FBQUEsTUFBa0I7QUFBQSxNQUErQjtBQUFBLE1BQXVCO0FBQUEsTUFBZTtBQUFBLElBQXFCO0FBQUEsSUFDbkwsSUFBSTtBQUFBLE1BQUM7QUFBQSxNQUFnQjtBQUFBLE1BQVU7QUFBQSxNQUFXO0FBQUEsTUFBUztBQUFBLE1BQWU7QUFBQSxNQUFjO0FBQUEsTUFBVTtBQUFBLE1BQVU7QUFBQSxNQUFjO0FBQUEsTUFBZTtBQUFBLE1BQy9IO0FBQUEsTUFBVztBQUFBLE1BQWE7QUFBQSxNQUFhO0FBQUEsTUFBUztBQUFBLE1BQW9DO0FBQUEsTUFBNEI7QUFBQSxNQUEwQjtBQUFBLE1BQTRCO0FBQUEsTUFDcEs7QUFBQSxNQUFvQjtBQUFBLE1BQTZFO0FBQUEsTUFBbUI7QUFBQSxNQUE0QjtBQUFBLE1BQTJDO0FBQUEsTUFBVztBQUFBLE1BQVM7QUFBQSxNQUFjO0FBQUEsTUFBZ0I7QUFBQSxNQUFxQjtBQUFBLE1BQ2xRO0FBQUEsTUFBNEI7QUFBQSxNQUEwQjtBQUFBLE1BQWE7QUFBQSxNQUF1QjtBQUFBLE1BQXFDO0FBQUEsTUFBOEI7QUFBQSxNQUFvQjtBQUFBLElBQXNCO0FBQUEsRUFDM007OztBQzNETyxNQUFNLFVBQVU7QUFBQSxJQUNyQixJQUFJO0FBQUEsTUFDRixTQUFTO0FBQUEsTUFBWSxPQUFPO0FBQUEsTUFBUyxRQUFRO0FBQUEsTUFBVSxNQUFNO0FBQUEsTUFBUSxPQUFPO0FBQUEsTUFBUyxVQUFVO0FBQUEsTUFDL0YsT0FBTztBQUFBLE1BQVMsS0FBSztBQUFBLE1BQWlCLFNBQVM7QUFBQSxNQUFZLFVBQVU7QUFBQSxNQUFTLFNBQVM7QUFBQSxNQUN2RixNQUFNO0FBQUEsTUFBUyxNQUFNO0FBQUEsTUFBVSxNQUFNO0FBQUEsTUFBWSxRQUFRO0FBQUEsTUFDekQsU0FBUztBQUFBLE1BQTBCLFNBQVM7QUFBQSxNQUFrQixXQUFXO0FBQUEsTUFDekUsU0FBUztBQUFBLE1BQXVCLFNBQVM7QUFBQSxNQUN6QyxRQUFRO0FBQUEsTUFBMEIsVUFBVTtBQUFBLE1BQXlCLFFBQVE7QUFBQSxNQUFpQixRQUFRO0FBQUEsTUFDdEcsU0FBUztBQUFBLE1BQTJCLFVBQVU7QUFBQSxNQUFpQyxRQUFRO0FBQUEsTUFBd0IsU0FBUztBQUFBLE1BQ3hILFVBQVU7QUFBQSxNQUFtQixTQUFTO0FBQUEsTUFDdEMsWUFBWTtBQUFBLE1BQWUsUUFBUTtBQUFBLE1BQTZCLFNBQVM7QUFBQSxNQUN6RSxPQUFPO0FBQUEsTUFBUyxPQUFPO0FBQUEsTUFBUyxNQUFNO0FBQUEsTUFBUSxNQUFNO0FBQUEsTUFBYyxXQUFXO0FBQUEsTUFBbUIsVUFBVTtBQUFBLElBQzVHO0FBQUEsSUFDQSxJQUFJO0FBQUEsTUFDRixTQUFTO0FBQUEsTUFBaUIsT0FBTztBQUFBLE1BQVcsUUFBUTtBQUFBLE1BQWEsTUFBTTtBQUFBLE1BQVUsT0FBTztBQUFBLE1BQVMsVUFBVTtBQUFBLE1BQzNHLE9BQU87QUFBQSxNQUFZLEtBQUs7QUFBQSxNQUFvQixTQUFTO0FBQUEsTUFBVSxVQUFVO0FBQUEsTUFBTyxTQUFTO0FBQUEsTUFDekYsTUFBTTtBQUFBLE1BQVUsTUFBTTtBQUFBLE1BQVMsTUFBTTtBQUFBLE1BQVUsUUFBUTtBQUFBLE1BQ3ZELFNBQVM7QUFBQSxNQUFzQixTQUFTO0FBQUEsTUFBcUIsV0FBVztBQUFBLE1BQ3hFLFNBQVM7QUFBQSxNQUE2QixTQUFTO0FBQUEsTUFDL0MsUUFBUTtBQUFBLE1BQXlCLFVBQVU7QUFBQSxNQUF3QixRQUFRO0FBQUEsTUFBaUIsUUFBUTtBQUFBLE1BQ3BHLFNBQVM7QUFBQSxNQUErQixVQUFVO0FBQUEsTUFBMEIsUUFBUTtBQUFBLE1BQWdCLFNBQVM7QUFBQSxNQUM3RyxVQUFVO0FBQUEsTUFBaUIsU0FBUztBQUFBLE1BQ3BDLFlBQVk7QUFBQSxNQUFnQixRQUFRO0FBQUEsTUFBMkIsU0FBUztBQUFBLE1BQ3hFLE9BQU87QUFBQSxNQUFTLE9BQU87QUFBQSxNQUFVLE1BQU07QUFBQSxNQUFTLE1BQU07QUFBQSxNQUFpQixXQUFXO0FBQUEsTUFBbUIsVUFBVTtBQUFBLElBQ2pIO0FBQUEsRUFDRjtBQUdBLGFBQVcsQ0FBQyxNQUFNLEdBQUcsS0FBSyxPQUFPLFFBQVEsSUFBSSxHQUFHO0FBQzlDLFVBQU0sUUFBUSxDQUFDO0FBQ2YsU0FBSyxRQUFRLENBQUMsR0FBRyxNQUFNO0FBQUUsVUFBSSxJQUFJLENBQUMsTUFBTSxPQUFXLE9BQU0sQ0FBQyxJQUFJLElBQUksQ0FBQztBQUFBLElBQUcsQ0FBQztBQUN2RSxZQUFRLElBQUksSUFBSTtBQUFBLEVBQ2xCO0FBRUEsTUFBTSxNQUFNLENBQUMsTUFBTSxNQUFNLE1BQU0sSUFBSTtBQUU1QixXQUFTLFlBQVksS0FBSztBQUMvQixVQUFNLElBQUksT0FBTyxPQUFPLElBQUksRUFBRSxZQUFZO0FBQzFDLFFBQUksUUFBUSxDQUFDLEVBQUcsUUFBTztBQUN2QixVQUFNLElBQUksRUFBRSxNQUFNLE1BQU0sRUFBRSxDQUFDO0FBQzNCLFdBQU8sUUFBUSxDQUFDLElBQUksSUFBSTtBQUFBLEVBQzFCO0FBRU8sTUFBTSxPQUFOLE1BQVc7QUFBQSxJQUNoQixjQUFjO0FBQUUsV0FBSyxPQUFPO0FBQUEsSUFBTTtBQUFBLElBQ2xDLElBQUksS0FBSztBQUFFLFdBQUssT0FBTyxZQUFZLEdBQUc7QUFBQSxJQUFHO0FBQUEsSUFDekMsSUFBSSxNQUFNO0FBQUUsYUFBTyxJQUFJLFNBQVMsS0FBSyxJQUFJO0FBQUEsSUFBRztBQUFBLElBQzVDLEVBQUUsS0FBSztBQUFFLFlBQU0sSUFBSSxRQUFRLEtBQUssSUFBSSxFQUFFLEdBQUc7QUFBRyxhQUFPLE1BQU0sU0FBWSxJQUFJLFFBQVEsR0FBRyxHQUFHLE1BQU0sU0FBWSxRQUFRLEdBQUcsR0FBRyxJQUFJO0FBQUEsSUFBSztBQUFBLElBQ2hJLE1BQU0sTUFBTTtBQUNWLGVBQVMsZ0JBQWdCLE9BQU8sS0FBSztBQUNyQyxlQUFTLGdCQUFnQixNQUFNLEtBQUssTUFBTSxRQUFRO0FBQ2xELFdBQUssaUJBQWlCLGFBQWEsRUFBRSxRQUFRLENBQUMsTUFBTTtBQUFFLFVBQUUsY0FBYyxLQUFLLEVBQUUsRUFBRSxhQUFhLFdBQVcsQ0FBQztBQUFBLE1BQUcsQ0FBQztBQUFBLElBQzlHO0FBQUEsRUFDRjs7O0FDcERPLE1BQU0sUUFBUTtBQUFBLElBQ25CLE1BQVMsRUFBRSxJQUFJLFFBQVcsR0FBRyxNQUFNLEdBQUcsR0FBTSxHQUFHLE1BQU0sSUFBSSxNQUFNLE1BQU0sTUFBTSxRQUFRLEdBQUcsTUFBTSxFQUFFO0FBQUEsSUFDOUYsTUFBUyxFQUFFLElBQUksUUFBVyxHQUFHLElBQU0sR0FBRyxLQUFNLEdBQUcsTUFBTSxJQUFJLEtBQU0sTUFBTSxLQUFNLFFBQVEsR0FBRyxNQUFNLEtBQUs7QUFBQSxJQUNqRyxPQUFTLEVBQUUsSUFBSSxTQUFXLEdBQUcsS0FBTSxHQUFHLE1BQU0sR0FBRyxLQUFNLElBQUksTUFBTSxNQUFNLEtBQU0sUUFBUSxHQUFHLE1BQU0sRUFBRTtBQUFBLElBQzlGLFNBQVMsRUFBRSxJQUFJLFdBQVcsR0FBRyxJQUFNLEdBQUcsS0FBTSxHQUFHLEtBQU0sSUFBSSxNQUFNLE1BQU0sS0FBTSxRQUFRLEdBQUcsTUFBTSxFQUFFO0FBQUEsSUFDOUYsTUFBUyxFQUFFLElBQUksUUFBVyxHQUFHLElBQU0sR0FBRyxLQUFNLEdBQUcsTUFBTSxJQUFJLE1BQU0sTUFBTSxNQUFNLFFBQVEsR0FBRyxNQUFNLEVBQUU7QUFBQSxFQUNoRzs7O0FDSE8sTUFBTSxLQUFLLElBQUk7QUFDZixNQUFNLE9BQU87QUFDYixNQUFNLElBQUk7QUFDVixNQUFNLE9BQU87QUFDcEIsTUFBTSxLQUFLO0FBQ1gsTUFBTSxPQUFPO0FBQ2IsTUFBTSxPQUFPO0FBQ2IsTUFBTSxPQUFPO0FBQ2IsTUFBTSxZQUFZO0FBQ2xCLE1BQU0sZ0JBQWdCO0FBRWYsTUFBTSxTQUFTO0FBQ3RCLE1BQU0sYUFBYTtBQUdaLE1BQU0sUUFBUTtBQUFkLE1BQWlCLFdBQVc7QUFBNUIsTUFBK0IsWUFBWTtBQUczQyxXQUFTLFFBQVEsSUFBSSxHQUFHO0FBQzdCLFFBQUksQ0FBQyxHQUFHLE9BQVEsUUFBTztBQUN2QixRQUFJLEtBQUssSUFBSSxHQUFHLE1BQU0sR0FBRztBQUFRLFFBQUksSUFBSSxFQUFHLE1BQUssR0FBRztBQUNwRCxXQUFPLElBQUksR0FBRztBQUFBLEVBQ2hCO0FBR08sV0FBUyxRQUFRLEdBQUcsR0FBRyxLQUFLO0FBQ2pDLFVBQU0sSUFBSSxJQUFJLEVBQUUsTUFBTSxFQUFFO0FBQ3hCLFVBQU0sS0FBSyxLQUFLLElBQUksQ0FBQyxHQUFHLEtBQUssS0FBSyxJQUFJLENBQUM7QUFDdkMsUUFBSSxJQUFJLEVBQUUsS0FBSyxLQUFLLEVBQUU7QUFDdEIsUUFBSSxJQUFJLEVBQUUsS0FBSyxLQUFLLEVBQUU7QUFDdEIsUUFBSSxLQUFLLEtBQUssRUFBRSxNQUFNLEVBQUU7QUFDeEIsUUFBSSxLQUFLLENBQUMsS0FBSyxFQUFFLE1BQU0sRUFBRTtBQUN6QixXQUFPO0FBQUEsRUFDVDtBQUVBLE1BQU0sS0FBSyxFQUFFLEdBQUcsR0FBRyxHQUFHLEdBQUcsSUFBSSxHQUFHLElBQUksRUFBRTtBQUl0QyxXQUFTLFNBQVMsSUFBSSxJQUFJLEdBQUc7QUFDM0IsVUFBTSxLQUFLLEtBQUssRUFBRSxJQUFJLEtBQUssS0FBSyxFQUFFO0FBQ2xDLFVBQU0sS0FBSyxLQUFLLEVBQUUsSUFBSSxLQUFLLEVBQUUsR0FBRyxLQUFLLEtBQUssRUFBRSxJQUFJLEtBQUssRUFBRTtBQUN2RCxVQUFNLEtBQUssS0FBSyxDQUFDLEVBQUUsS0FBSyxLQUFLLEVBQUUsS0FBSyxLQUFLLEVBQUUsS0FBSyxLQUFLLEVBQUUsS0FBSztBQUM1RCxVQUFNLEtBQUssS0FBSyxDQUFDLEVBQUUsS0FBSyxLQUFLLEVBQUUsS0FBSyxLQUFLLEVBQUUsS0FBSyxLQUFLLEVBQUUsS0FBSztBQUM1RCxXQUFPLEtBQUssS0FBSyxLQUFLO0FBQUEsRUFDeEI7QUFFTyxNQUFNLE1BQU4sTUFBVTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsSUFLZixZQUFZLE9BQU8sT0FBTyxDQUFDLEdBQUc7QUFDNUIsV0FBSyxNQUFNO0FBQ1gsV0FBSyxNQUFNLEtBQUssV0FBVztBQUMzQixXQUFLLFNBQVMsQ0FBQztBQUNmLFdBQUssUUFBUSxLQUFLLFFBQVEsTUFBTTtBQUNoQyxXQUFLLE1BQU07QUFBQSxJQUNiO0FBQUEsSUFFQSxRQUFRLElBQUk7QUFDVixZQUFNLElBQUksTUFBTSxFQUFFLEtBQUssTUFBTTtBQUM3QixXQUFLLE9BQU87QUFDWixXQUFLLFNBQVMsRUFBRTtBQUNoQixXQUFLLFFBQVEsS0FBSyxJQUFJLENBQUMsRUFBRSxPQUFPLEVBQUU7QUFBQSxJQUNwQztBQUFBLElBRUEsUUFBUTtBQUNOLFlBQU0sSUFBSSxLQUFLO0FBQ2YsV0FBSyxPQUFPO0FBQ1osV0FBSyxRQUFRO0FBQUcsV0FBSyxRQUFRO0FBQUcsV0FBSyxTQUFTO0FBQzlDLFdBQUssSUFBSSxFQUFFLE1BQU07QUFBRyxXQUFLLElBQUksRUFBRSxNQUFNO0FBQUcsV0FBSyxLQUFLO0FBQUcsV0FBSyxLQUFLO0FBQy9ELFdBQUssT0FBTztBQUNaLFdBQUssT0FBTztBQUNaLFdBQUssT0FBTztBQUNaLFdBQUssTUFBTTtBQUNYLFdBQUssUUFBUTtBQUFNLFdBQUssTUFBTTtBQUFPLFdBQUssUUFBUTtBQUNsRCxXQUFLLEtBQUs7QUFBRyxXQUFLLEtBQUs7QUFDdkIsV0FBSyxRQUFRO0FBQ2IsV0FBSyxNQUFNO0FBQ1gsV0FBSyxTQUFTO0FBQ2QsV0FBSyxPQUFPLFNBQVM7QUFBQSxJQUN2QjtBQUFBLElBRUEsSUFBSSxPQUFPO0FBQUUsYUFBTyxLQUFLLE9BQU87QUFBQSxJQUFJO0FBQUEsSUFDcEMsSUFBSSxXQUFXO0FBQUUsVUFBSSxJQUFJLEdBQUcsSUFBSSxLQUFLO0FBQU0sYUFBTyxHQUFHO0FBQUUsYUFBSyxJQUFJO0FBQUcsZUFBTztBQUFBLE1BQUc7QUFBRSxhQUFPO0FBQUEsSUFBRztBQUFBLElBRXpGLE1BQU0sR0FBRyxHQUFHLEdBQUcsR0FBRztBQUFFLFVBQUksS0FBSyxJQUFLLE1BQUssT0FBTyxLQUFLLEVBQUUsR0FBRyxHQUFHLEdBQUcsRUFBRSxDQUFDO0FBQUEsSUFBRztBQUFBO0FBQUEsSUFHcEUsU0FBUyxJQUFJLElBQUksS0FBSyxLQUFLLEtBQUssTUFBTSxPQUFPLE1BQU07QUFDakQsV0FBSyxLQUFLLEtBQUs7QUFBSyxXQUFLLEtBQUssS0FBSztBQUNuQyxXQUFLLFFBQVE7QUFBTSxXQUFLLEtBQUs7QUFBSSxXQUFLLEtBQUs7QUFDM0MsVUFBSSxNQUFNLEtBQUssS0FBSyxLQUFLLE1BQU0sS0FBSyxLQUFLO0FBQ3pDLFlBQU0sS0FBSyxNQUFNLEtBQUssTUFBTTtBQUM1QixVQUFJLE1BQU0sRUFBRyxRQUFPO0FBQ3BCLFlBQU0sSUFBSSxLQUFLLE1BQU0sTUFBTSxDQUFDO0FBQzVCLFVBQUksSUFBSSxNQUFNLE9BQU8sRUFBRSxJQUFJLE9BQU87QUFDbEMsVUFBSSxJQUFJLEVBQUcsS0FBSTtBQUNmLFlBQU0sTUFBTSxJQUFJLEtBQUs7QUFDckIsYUFBTyxLQUFLO0FBQUksYUFBTyxLQUFLO0FBQzVCLFlBQU0sS0FBSyxDQUFDLElBQUksS0FBSztBQUNyQixZQUFNLEtBQUssTUFBTSxLQUFLLE1BQU07QUFDNUIsWUFBTSxPQUFPLEVBQUUsS0FBSyxRQUFRO0FBQzVCLFlBQU0sTUFBTSxLQUFLLE9BQU8sQ0FBQyxPQUFPLEtBQUssQ0FBQyxPQUFPLE9BQU8sQ0FBQztBQUNyRCxhQUFPLE1BQU07QUFBSSxhQUFPLE1BQU07QUFDOUIsVUFBSSxNQUFNO0FBQUUsZUFBTyxLQUFLO0FBQU0sZUFBTyxLQUFLO0FBQUEsTUFBTTtBQUNoRCxXQUFLLEtBQUssTUFBTTtBQUFLLFdBQUssS0FBSyxNQUFNO0FBQ3JDLFVBQUksTUFBTSxLQUFLLE9BQVEsTUFBSyxTQUFTO0FBQ3JDLGFBQU87QUFBQSxJQUNUO0FBQUE7QUFBQSxJQUdBLEtBQUssR0FBRyxHQUFHLEtBQUssS0FBSztBQUNuQixVQUFJLElBQUksSUFBSTtBQUNaLFVBQUksRUFBRSxNQUFNLE9BQU87QUFDakIsY0FBTSxLQUFLLEtBQUssSUFBSSxFQUFFLElBQUksS0FBSyxLQUFLLElBQUksRUFBRTtBQUMxQyxjQUFNLEtBQUssS0FBSyxFQUFFLElBQUksS0FBSyxFQUFFLEdBQUcsS0FBSyxLQUFLLEVBQUUsSUFBSSxLQUFLLEVBQUU7QUFDdkQsY0FBTSxLQUFLLEtBQUssQ0FBQyxFQUFFLEtBQUssQ0FBQyxFQUFFLEtBQUssS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLO0FBQ25ELGNBQU0sS0FBSyxLQUFLLENBQUMsRUFBRSxLQUFLLENBQUMsRUFBRSxLQUFLLEtBQUssRUFBRSxLQUFLLEVBQUUsS0FBSztBQUNuRCxjQUFNLEtBQUssS0FBSyxJQUFJLEtBQUssS0FBSyxJQUFJLEtBQUssS0FBSyxLQUFLLEtBQUs7QUFDdEQsWUFBSSxNQUFNLElBQUksRUFBRyxRQUFPO0FBQ3hCLFlBQUksS0FBSztBQUNULFlBQUksS0FBSyxNQUFNO0FBQ2IsZ0JBQU0sSUFBSSxLQUFLLEtBQUssRUFBRTtBQUFHLGdCQUFNLEtBQUs7QUFBRyxnQkFBTSxLQUFLO0FBQUcsZ0JBQU0sSUFBSTtBQUFBLFFBQ2pFLE9BQU87QUFFTCxnQkFBTSxLQUFLLEtBQUssRUFBRSxJQUFJLEtBQUssRUFBRSxLQUFLLElBQUksS0FBSyxLQUFLLEVBQUUsSUFBSSxLQUFLLEVBQUUsS0FBSztBQUNsRSxjQUFJLElBQUk7QUFBSSxnQkFBTTtBQUFJLGdCQUFNO0FBQzVCLGNBQUksS0FBSyxHQUFHO0FBQUUsZ0JBQUk7QUFBSSxrQkFBTTtBQUFHLGtCQUFNO0FBQUEsVUFBRztBQUN4QyxjQUFJLEtBQUssR0FBRztBQUFFLGdCQUFJO0FBQUksa0JBQU07QUFBRyxrQkFBTTtBQUFBLFVBQUk7QUFDekMsY0FBSSxLQUFLLEdBQUc7QUFBRSxnQkFBSTtBQUFJLGtCQUFNO0FBQUcsa0JBQU07QUFBQSxVQUFHO0FBQ3hDLGdCQUFNLElBQUk7QUFBQSxRQUNaO0FBQ0EsYUFBSyxNQUFNLEVBQUUsSUFBSSxNQUFNLEVBQUU7QUFBRyxhQUFLLE1BQU0sRUFBRSxJQUFJLE1BQU0sRUFBRTtBQUFBLE1BQ3ZELFdBQVcsRUFBRSxNQUFNLFVBQVU7QUFDM0IsY0FBTSxLQUFLLEtBQUssSUFBSSxFQUFFLElBQUksS0FBSyxLQUFLLElBQUksRUFBRSxJQUFJLEtBQUssSUFBSSxFQUFFO0FBQ3pELGNBQU0sS0FBSyxLQUFLLEtBQUssS0FBSztBQUMxQixZQUFJLE1BQU0sS0FBSyxHQUFJLFFBQU87QUFDMUIsY0FBTSxJQUFJLEtBQUssS0FBSyxFQUFFO0FBQ3RCLFlBQUksSUFBSSxNQUFNO0FBQUUsZUFBSyxLQUFLO0FBQUcsZUFBSyxLQUFLO0FBQUEsUUFBRyxPQUFPO0FBQUUsZUFBSztBQUFHLGVBQUs7QUFBQSxRQUFHO0FBQ25FLGNBQU0sS0FBSztBQUFBLE1BQ2IsT0FBTztBQUVMLGNBQU0sTUFBTSxFQUFFLEtBQUssRUFBRSxJQUFJLE1BQU0sRUFBRSxLQUFLLEVBQUU7QUFDeEMsWUFBSSxNQUFNLEtBQUssSUFBSSxFQUFFLE1BQU0sT0FBTyxLQUFLLElBQUksRUFBRSxNQUFNLFFBQVEsTUFBTSxNQUFNLE1BQU07QUFDN0UsWUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSTtBQUM1QixjQUFNLEtBQUssS0FBSyxLQUFLLEVBQUUsS0FBSyxNQUFNLElBQUksS0FBSyxLQUFLLEtBQUssRUFBRSxLQUFLLE1BQU0sSUFBSSxLQUFLLElBQUksRUFBRTtBQUNqRixjQUFNLEtBQUssS0FBSyxLQUFLLEtBQUs7QUFDMUIsWUFBSSxNQUFNLEtBQUssR0FBSSxRQUFPO0FBQzFCLGNBQU0sSUFBSSxLQUFLLEtBQUssRUFBRTtBQUN0QixZQUFJLElBQUksTUFBTTtBQUFFLGVBQUssS0FBSztBQUFHLGVBQUssS0FBSztBQUFBLFFBQUcsT0FBTztBQUFFLGVBQUssQ0FBQztBQUFLLGVBQUs7QUFBSyxnQkFBTSxJQUFJLEtBQUssTUFBTSxJQUFJLEVBQUUsS0FBSztBQUFHLGdCQUFNO0FBQUcsZ0JBQU07QUFBQSxRQUFHO0FBQzdILGNBQU0sS0FBSztBQUFBLE1BQ2I7QUFDQSxhQUFPLEtBQUssU0FBUyxJQUFJLElBQUksS0FBSyxLQUFLLEtBQUssRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLElBQUk7QUFBQSxJQUMvRDtBQUFBLElBRUEsS0FBSyxPQUFPO0FBQ1YsV0FBSyxRQUFRO0FBQU8sV0FBSyxRQUFRO0FBQ2pDLFdBQUssTUFBTSxPQUFPLEtBQUssR0FBRyxLQUFLLEdBQUcsQ0FBQztBQUFBLElBQ3JDO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxJQU1BLEtBQUssR0FBRztBQUNOLFVBQUksQ0FBQyxLQUFLLFNBQVMsS0FBSyxJQUFLO0FBQzdCLFlBQU0sSUFBSSxLQUFLLEtBQUssSUFBSSxLQUFLLE1BQU0sSUFBSSxFQUFFO0FBQ3pDLFdBQUs7QUFDTCxZQUFNLElBQUksS0FBSyxPQUFPO0FBR3RCLFVBQUksRUFBRyxNQUFLLFVBQVUsSUFBSSxPQUFPO0FBQ2pDLFVBQUksS0FBSyxLQUFLLFNBQVMsS0FBSyxTQUFTO0FBQ3JDLFVBQUksSUFBSSxLQUFNLEtBQUk7QUFBQSxlQUFlLElBQUksQ0FBQyxLQUFNLEtBQUksQ0FBQztBQUNqRCxVQUFJLEtBQUssSUFBSSxLQUFLO0FBQ2xCLFlBQU0sS0FBSyxPQUFPO0FBQ2xCLFVBQUksS0FBSyxHQUFJLE1BQUs7QUFBQSxlQUFhLEtBQUssQ0FBQyxHQUFJLE1BQUssQ0FBQztBQUMvQyxXQUFLLFNBQVM7QUFDZCxXQUFLLFNBQVMsS0FBSyxRQUFRO0FBRzNCLFlBQU0sSUFBSSxJQUFJLEVBQUU7QUFDaEIsV0FBSyxNQUFNLEtBQUssS0FBSyxLQUFLLElBQUksS0FBSyxLQUFLLElBQUksSUFBSSxNQUFNLEtBQUs7QUFDM0QsV0FBSyxNQUFNLEtBQUssS0FBSyxLQUFLLElBQUksS0FBSyxLQUFLLElBQUksSUFBSSxNQUFNLEtBQUs7QUFDM0QsVUFBSSxNQUFNLEtBQUssS0FBSyxLQUFLLEtBQUssS0FBSyxLQUFLLEtBQUs7QUFDN0MsVUFBSSxNQUFNLE9BQU8sTUFBTTtBQUFFLGNBQU0sSUFBSSxPQUFPLEtBQUssS0FBSyxHQUFHO0FBQUcsYUFBSyxNQUFNO0FBQUcsYUFBSyxNQUFNO0FBQUcsY0FBTSxPQUFPO0FBQUEsTUFBTTtBQUV6RyxZQUFNLE9BQU8sRUFBRTtBQUNmLGVBQVMsSUFBSSxHQUFHLElBQUksS0FBSyxRQUFRLEtBQUs7QUFDcEMsY0FBTSxLQUFLLEtBQUssQ0FBQztBQUNqQixZQUFJLFNBQVMsS0FBSyxHQUFHLEtBQUssR0FBRyxFQUFFLE1BQU0sR0FBRztBQUFFLGVBQUssTUFBTSxHQUFHLEtBQUssR0FBRyxRQUFRLEVBQUUsT0FBTztBQUFJLGVBQUssTUFBTSxHQUFHLEtBQUssR0FBRyxRQUFRLEVBQUUsT0FBTztBQUFBLFFBQUk7QUFBQSxNQUNsSTtBQUNBLFlBQU0sVUFBVSxLQUFLLEtBQUssR0FBRztBQUM3QixXQUFLLEtBQUssS0FBSyxLQUFLO0FBQUksV0FBSyxLQUFLLEtBQUssS0FBSztBQUc1QyxXQUFLLFNBQVM7QUFBRyxXQUFLLFFBQVE7QUFDOUIsWUFBTSxPQUFPLEVBQUUsTUFBTSxTQUFTLEVBQUUsUUFBUSxTQUFTLEVBQUUsUUFBUSxXQUFXLEVBQUU7QUFDeEUsZUFBUyxPQUFPLEdBQUcsT0FBTyxHQUFHLFFBQVE7QUFDbkMsWUFBSSxLQUFLLEtBQUssT0FBTyxLQUFLLElBQUksS0FBSyxPQUFPLEtBQUssSUFBSSxHQUFHLEtBQUssS0FBSyxPQUFPLEtBQUssSUFBSSxLQUFLLE9BQU8sS0FBSyxJQUFJO0FBQ3JHLGFBQUssS0FBSyxJQUFJLElBQUksTUFBTSxLQUFLLElBQUksS0FBSyxJQUFJLElBQUk7QUFDOUMsYUFBSyxLQUFLLElBQUksSUFBSSxNQUFNLEtBQUssSUFBSSxLQUFLLElBQUksSUFBSTtBQUM5QyxjQUFNLE9BQU8sS0FBSyxNQUFNLEtBQUssS0FBSyxJQUFJLEVBQUU7QUFDeEMsaUJBQVMsSUFBSSxHQUFHLElBQUksS0FBSyxRQUFRLEtBQUs7QUFDcEMsZ0JBQU0sSUFBSSxPQUFPLEtBQUssQ0FBQyxDQUFDO0FBQ3hCLGdCQUFNLE1BQU0sS0FBSyxLQUFLLEdBQUcsR0FBRyxHQUFHLENBQUM7QUFDaEMsY0FBSSxPQUFPLEtBQUssRUFBRSxRQUFRLFNBQVMsRUFBRyxNQUFLLE1BQU0sUUFBUSxFQUFFLElBQUksRUFBRSxJQUFJLEtBQUssQ0FBQyxDQUFDO0FBQUEsUUFDOUU7QUFDQSxpQkFBUyxJQUFJLEdBQUcsSUFBSSxPQUFPLFFBQVEsS0FBSztBQUN0QyxnQkFBTSxJQUFJLE9BQU8sQ0FBQztBQUNsQixrQkFBUSxHQUFHLEdBQUcsRUFBRTtBQUNoQixZQUFFLElBQUksS0FBSyxHQUFHO0FBQUcsWUFBRSxJQUFJLEtBQUssR0FBRztBQUMvQixlQUFLLEtBQUssRUFBRSxLQUFLLEdBQUcsR0FBRyxJQUFJLEdBQUcsRUFBRTtBQUFBLFFBQ2xDO0FBQ0EsaUJBQVMsSUFBSSxHQUFHLElBQUksU0FBUyxRQUFRLEtBQUs7QUFDeEMsY0FBSSxLQUFLLE9BQVEsS0FBSyxFQUFJO0FBQzFCLGdCQUFNLElBQUksU0FBUyxDQUFDO0FBQ3BCLGdCQUFNLE1BQU0sS0FBSyxLQUFLLEdBQUcsR0FBRyxHQUFHLENBQUM7QUFDaEMsY0FBSSxPQUFPLE1BQU0sRUFBRSxXQUFXLEtBQU0sRUFBRSxXQUFXLEtBQUssVUFBVSxnQkFBaUI7QUFDL0UsaUJBQUssUUFBUSxLQUFLO0FBQ2xCLGlCQUFLLE1BQU0sV0FBVyxFQUFFLElBQUksRUFBRSxJQUFJLENBQUM7QUFBQSxVQUNyQztBQUFBLFFBQ0Y7QUFBQSxNQUNGO0FBRUEsWUFBTSxRQUFRLEVBQUUsT0FBTyxRQUFRLEVBQUU7QUFDakMsVUFBSSxNQUFNLFVBQVUsS0FBSyxTQUFTLEVBQUUsUUFBUyxVQUFTLElBQUksR0FBRyxJQUFJLE1BQU0sUUFBUSxJQUFLLE1BQUssS0FBSyxNQUFNLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQztBQUMvRyxlQUFTLElBQUksR0FBRyxJQUFJLE1BQU0sUUFBUSxLQUFLO0FBQ3JDLGNBQU0sS0FBSyxNQUFNLENBQUM7QUFFbEIsY0FBTSxNQUFNLEtBQUssSUFBSSxHQUFHLE1BQU0sR0FBRyxNQUFNLEtBQUssSUFBSSxHQUFHLE1BQU0sR0FBRztBQUM1RCxZQUFJLE1BQU0sS0FBSyxNQUFNLEVBQUc7QUFDeEIsY0FBTSxNQUFNLEtBQUssS0FBSyxLQUFLLElBQUksR0FBRyxNQUFNLEdBQUcsTUFBTSxLQUFLLElBQUksR0FBRyxNQUFNLEdBQUcsRUFBRTtBQUN4RSxZQUFJLE1BQU0sR0FBRyxPQUFPLElBQUksSUFBSztBQUM3QixZQUFJLEtBQUssS0FBSyxHQUFHLEtBQUssS0FBSyxLQUFLLEdBQUcsTUFBTSxFQUFHO0FBQzVDLGFBQUssU0FBUyxHQUFHLElBQUksR0FBRyxJQUFJLElBQUksSUFBSSxHQUFHLEdBQUcsR0FBRyxHQUFHLENBQUM7QUFBQSxNQUNuRDtBQUNBLFVBQUksS0FBSyxNQUFPLE1BQUssTUFBTTtBQUFBLFVBQVEsTUFBSztBQUN4QyxVQUFJLEtBQUssU0FBUyxVQUFXLE1BQUssTUFBTSxPQUFPLEtBQUssSUFBSSxLQUFLLEtBQUssR0FBRyxLQUFLLElBQUksS0FBSyxLQUFLLEdBQUcsS0FBSyxNQUFNO0FBR3RHLFlBQU0sT0FBTyxFQUFFO0FBQ2YsZUFBUyxJQUFJLEdBQUcsSUFBSSxLQUFLLFFBQVEsS0FBSztBQUNwQyxjQUFNLElBQUksS0FBSyxDQUFDO0FBQ2hCLFlBQUksU0FBUyxLQUFLLEdBQUcsS0FBSyxHQUFHLENBQUMsSUFBSSxJQUFJLEdBQUc7QUFDdkMsZ0JBQU0sS0FBSyxLQUFLLEtBQUssRUFBRSxLQUFLLEtBQUssS0FBSyxFQUFFO0FBQ3hDLGNBQUksS0FBSyxFQUFFLFFBQVEsS0FBSztBQUN0QixpQkFBSyxPQUFPLEVBQUUsUUFBUSxNQUFNLEVBQUU7QUFBSSxpQkFBSyxPQUFPLEVBQUUsUUFBUSxNQUFNLEVBQUU7QUFDaEUsaUJBQUssTUFBTSxPQUFPLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQztBQUFBLFVBQ2pDO0FBQUEsUUFDRjtBQUFBLE1BQ0Y7QUFHQSxZQUFNLEtBQUssSUFBSSxLQUFLLFFBQVEsRUFBRTtBQUM5QixlQUFTLElBQUksR0FBRyxJQUFJLE1BQU0sUUFBUSxLQUFLO0FBQ3JDLFlBQUksU0FBUyxLQUFLLEdBQUcsS0FBSyxHQUFHLE1BQU0sQ0FBQyxDQUFDLElBQUksS0FBSyxJQUFJO0FBQUUsZUFBSyxLQUFLLE9BQU87QUFBRztBQUFBLFFBQVE7QUFBQSxNQUNsRjtBQUNBLFlBQU0sU0FBUyxFQUFFO0FBQ2pCLGVBQVMsSUFBSSxHQUFHLElBQUksT0FBTyxRQUFRLEtBQUs7QUFDdEMsY0FBTSxLQUFLLE9BQU8sQ0FBQztBQUNuQixZQUFJLFFBQVEsSUFBSSxDQUFDLEtBQUssU0FBUyxLQUFLLEdBQUcsS0FBSyxHQUFHLEVBQUUsSUFBSSxLQUFLLElBQUk7QUFBRSxlQUFLLEtBQUssT0FBTztBQUFHO0FBQUEsUUFBUTtBQUFBLE1BQzlGO0FBQ0EsWUFBTSxPQUFPLEVBQUU7QUFDZixlQUFTLElBQUksR0FBRyxJQUFJLEtBQUssUUFBUSxLQUFLO0FBQ3BDLGNBQU0sSUFBSSxLQUFLLENBQUM7QUFDaEIsZ0JBQVEsR0FBRyxHQUFHLEVBQUU7QUFDaEIsY0FBTSxLQUFLLEtBQUssSUFBSSxHQUFHLEdBQUcsS0FBSyxLQUFLLElBQUksR0FBRyxHQUFHLEtBQUssSUFBSSxPQUFPLEVBQUU7QUFDaEUsWUFBSSxLQUFLLEtBQUssS0FBSyxLQUFLLEtBQUssSUFBSTtBQUFFLGVBQUssS0FBSyxLQUFLO0FBQUc7QUFBQSxRQUFRO0FBQUEsTUFDL0Q7QUFDQSxZQUFNLE1BQU0sRUFBRSxPQUFPO0FBQ3JCLFVBQUksS0FBSyxJQUFJLE9BQU8sS0FBSyxJQUFJLENBQUMsT0FBTyxLQUFLLElBQUksT0FBTyxLQUFLLElBQUksQ0FBQyxLQUFLO0FBQUUsYUFBSyxLQUFLLE1BQU07QUFBRztBQUFBLE1BQVE7QUFHakcsWUFBTSxPQUFPLEVBQUU7QUFDZixlQUFTLElBQUksR0FBRyxJQUFJLEtBQUssUUFBUSxLQUFLO0FBQ3BDLFlBQUksS0FBSyxPQUFRLEtBQUssRUFBSTtBQUMxQixjQUFNLEtBQUssS0FBSyxJQUFJLEtBQUssQ0FBQyxFQUFFLEdBQUcsS0FBSyxLQUFLLElBQUksS0FBSyxDQUFDLEVBQUUsR0FBRyxLQUFLLElBQUk7QUFDakUsWUFBSSxLQUFLLEtBQUssS0FBSyxLQUFLLEtBQUssSUFBSTtBQUMvQixlQUFLLFFBQVEsS0FBSztBQUNsQixlQUFLLE1BQU0sT0FBTyxLQUFLLENBQUMsRUFBRSxHQUFHLEtBQUssQ0FBQyxFQUFFLEdBQUcsQ0FBQztBQUFBLFFBQzNDO0FBQUEsTUFDRjtBQUdBLFlBQU0sT0FBTyxFQUFFO0FBQ2YsZUFBUyxJQUFJLEdBQUcsSUFBSSxLQUFLLFFBQVEsS0FBSztBQUNwQyxZQUFJLEtBQUssT0FBUSxLQUFLLEVBQUk7QUFDMUIsY0FBTSxLQUFLLEtBQUssSUFBSSxLQUFLLENBQUMsRUFBRSxHQUFHLEtBQUssS0FBSyxJQUFJLEtBQUssQ0FBQyxFQUFFLEdBQUcsS0FBSyxJQUFJO0FBQ2pFLFlBQUksS0FBSyxLQUFLLEtBQUssS0FBSyxLQUFLLElBQUk7QUFDL0IsZUFBSyxRQUFRLEtBQUs7QUFDbEIsZUFBSyxNQUFNLE9BQU8sS0FBSyxDQUFDLEVBQUUsR0FBRyxLQUFLLENBQUMsRUFBRSxHQUFHLEtBQUssU0FBUyxFQUFFLFVBQVUsSUFBSSxDQUFDO0FBQUEsUUFDekU7QUFBQSxNQUNGO0FBR0EsWUFBTSxRQUFRLEVBQUU7QUFDaEIsVUFBSSxNQUFNLFFBQVE7QUFDaEIsWUFBSSxPQUFPLE9BQU8sTUFBTTtBQUN4QixpQkFBUyxJQUFJLEdBQUcsSUFBSSxNQUFNLFFBQVEsS0FBSztBQUNyQyxnQkFBTSxLQUFLLEtBQUssSUFBSSxNQUFNLENBQUMsRUFBRSxHQUFHLEtBQUssS0FBSyxJQUFJLE1BQU0sQ0FBQyxFQUFFLEdBQUcsS0FBSyxLQUFLLEtBQUssS0FBSztBQUM5RSxjQUFJLEtBQUssYUFBYSxXQUFZLFFBQU87QUFDekMsY0FBSSxLQUFLLFNBQVMsT0FBUSxPQUFNO0FBQUEsUUFDbEM7QUFDQSxZQUFJLENBQUMsS0FBTSxNQUFLLE1BQU07QUFBQSxpQkFDYixPQUFPLEtBQUssQ0FBQyxLQUFLLEtBQUs7QUFDOUIsZ0JBQU0sSUFBSSxNQUFNLEdBQUcsR0FBRyxJQUFJLE1BQU0sRUFBRSxFQUFFO0FBQ3BDLGVBQUssTUFBTSxRQUFRLEVBQUUsR0FBRyxFQUFFLEdBQUcsR0FBRztBQUNoQyxlQUFLLElBQUksRUFBRSxLQUFLLEtBQUssSUFBSSxFQUFFO0FBQUksZUFBSyxJQUFJLEVBQUUsS0FBSyxLQUFLLElBQUksRUFBRTtBQUMxRCxlQUFLLE1BQU07QUFDWCxlQUFLLE1BQU0sUUFBUSxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsRUFBRTtBQUFBLFFBQ25DO0FBQUEsTUFDRjtBQUdBLFlBQU0sS0FBSyxLQUFLLElBQUksRUFBRSxLQUFLLEdBQUcsS0FBSyxLQUFLLElBQUksRUFBRSxLQUFLO0FBQ25ELFVBQUksS0FBSyxLQUFLLEtBQUssS0FBSyxFQUFFLEtBQUssSUFBSSxFQUFFLEtBQUssR0FBRztBQUMzQyxhQUFLLE1BQU07QUFDWCxhQUFLLE1BQU0sT0FBTyxFQUFFLEtBQUssR0FBRyxFQUFFLEtBQUssR0FBRyxDQUFDO0FBQUEsTUFDekM7QUFBQSxJQUNGO0FBQUE7QUFBQSxJQUdBLEtBQUssR0FBRztBQUNOLFFBQUUsQ0FBQyxJQUFJLEtBQUs7QUFBRyxRQUFFLENBQUMsSUFBSSxLQUFLO0FBQUcsUUFBRSxDQUFDLElBQUksS0FBSztBQUFJLFFBQUUsQ0FBQyxJQUFJLEtBQUs7QUFDMUQsUUFBRSxDQUFDLElBQUksS0FBSztBQUFPLFFBQUUsQ0FBQyxJQUFJLEtBQUs7QUFBTyxRQUFFLENBQUMsSUFBSSxLQUFLO0FBQ2xELFFBQUUsQ0FBQyxJQUFJLEtBQUs7QUFBTSxRQUFFLENBQUMsSUFBSSxLQUFLO0FBQU0sUUFBRSxDQUFDLElBQUksS0FBSztBQUFNLFFBQUUsRUFBRSxJQUFJLEtBQUs7QUFDbkUsUUFBRSxFQUFFLElBQUksS0FBSztBQUFNLFFBQUUsRUFBRSxJQUFJLEtBQUs7QUFDaEMsYUFBTztBQUFBLElBQ1Q7QUFBQSxJQUNBLFFBQVEsR0FBRztBQUNULFdBQUssSUFBSSxFQUFFLENBQUM7QUFBRyxXQUFLLElBQUksRUFBRSxDQUFDO0FBQUcsV0FBSyxLQUFLLEVBQUUsQ0FBQztBQUFHLFdBQUssS0FBSyxFQUFFLENBQUM7QUFDM0QsV0FBSyxRQUFRLEVBQUUsQ0FBQztBQUFHLFdBQUssUUFBUSxFQUFFLENBQUM7QUFBRyxXQUFLLFNBQVMsRUFBRSxDQUFDO0FBQ3ZELFdBQUssT0FBTyxFQUFFLENBQUM7QUFBRyxXQUFLLE9BQU8sRUFBRSxDQUFDO0FBQUcsV0FBSyxPQUFPLEVBQUUsQ0FBQztBQUFHLFdBQUssTUFBTSxFQUFFLEVBQUU7QUFDckUsV0FBSyxPQUFPLEVBQUUsRUFBRTtBQUFHLFdBQUssTUFBTSxFQUFFLEVBQUU7QUFDbEMsV0FBSyxRQUFRO0FBQU0sV0FBSyxNQUFNO0FBQU8sV0FBSyxRQUFRO0FBQUEsSUFDcEQ7QUFBQSxFQUNGOzs7QUN4Vk8sTUFBTSxTQUFTO0FBQUEsSUFDcEIsUUFBUTtBQUFBLE1BQ04sTUFBTTtBQUFBLE1BQU8sSUFBSSxDQUFDLFdBQVcsU0FBUztBQUFBLE1BQ3RDLFFBQVE7QUFBQSxNQUFVLFFBQVE7QUFBQSxNQUFVLE9BQU87QUFBQSxNQUMzQyxTQUFTO0FBQUEsTUFBVSxVQUFVO0FBQUEsTUFBVSxXQUFXO0FBQUEsTUFDbEQsS0FBSztBQUFBLE1BQVUsS0FBSztBQUFBLE1BQVUsU0FBUztBQUFBLE1BQVUsUUFBUTtBQUFBLE1BQVUsWUFBWTtBQUFBLE1BQy9FLE9BQU87QUFBQSxNQUFVLFdBQVc7QUFBQSxNQUFVLFdBQVc7QUFBQSxNQUNqRCxLQUFLO0FBQUEsTUFBVSxNQUFNO0FBQUEsTUFBVSxVQUFVO0FBQUEsTUFDekMsT0FBTztBQUFBLE1BQVUsV0FBVztBQUFBLE1BQVUsU0FBUztBQUFBLE1BQVUsS0FBSztBQUFBLE1BQVUsVUFBVTtBQUFBLE1BQVUsS0FBSztBQUFBLE1BQVUsU0FBUztBQUFBLE1BQ3BILFFBQVE7QUFBQSxNQUFVLFNBQVM7QUFBQSxNQUFLLFNBQVM7QUFBQSxNQUFNLEtBQUs7QUFBQSxNQUFNLE9BQU87QUFBQSxJQUNuRTtBQUFBLElBQ0EsUUFBUTtBQUFBLE1BQ04sTUFBTTtBQUFBLE1BQU8sSUFBSSxDQUFDLFdBQVcsU0FBUztBQUFBLE1BQ3RDLFFBQVE7QUFBQSxNQUFVLFFBQVE7QUFBQSxNQUFVLE9BQU87QUFBQSxNQUMzQyxTQUFTO0FBQUEsTUFBVSxVQUFVO0FBQUEsTUFBVSxXQUFXO0FBQUEsTUFDbEQsS0FBSztBQUFBLE1BQVUsS0FBSztBQUFBLE1BQVUsU0FBUztBQUFBLE1BQVUsUUFBUTtBQUFBLE1BQVUsWUFBWTtBQUFBLE1BQy9FLE9BQU87QUFBQSxNQUFVLFdBQVc7QUFBQSxNQUFVLFdBQVc7QUFBQSxNQUNqRCxLQUFLO0FBQUEsTUFBVSxNQUFNO0FBQUEsTUFBVSxVQUFVO0FBQUEsTUFDekMsT0FBTztBQUFBLE1BQVUsV0FBVztBQUFBLE1BQVUsU0FBUztBQUFBLE1BQVUsS0FBSztBQUFBLE1BQVUsVUFBVTtBQUFBLE1BQVUsS0FBSztBQUFBLE1BQVUsU0FBUztBQUFBLE1BQ3BILFFBQVE7QUFBQSxNQUFVLFNBQVM7QUFBQSxNQUFLLFNBQVM7QUFBQSxNQUFNLEtBQUs7QUFBQSxNQUFNLE9BQU87QUFBQSxJQUNuRTtBQUFBLElBQ0EsS0FBSztBQUFBLE1BQ0gsTUFBTTtBQUFBLE1BQU8sSUFBSSxDQUFDLFdBQVcsU0FBUztBQUFBLE1BQ3RDLFFBQVE7QUFBQSxNQUFVLFFBQVE7QUFBQSxNQUFVLE9BQU87QUFBQSxNQUMzQyxTQUFTO0FBQUEsTUFBVSxVQUFVO0FBQUEsTUFBVSxXQUFXO0FBQUEsTUFDbEQsS0FBSztBQUFBLE1BQVUsS0FBSztBQUFBLE1BQVUsU0FBUztBQUFBLE1BQVUsUUFBUTtBQUFBLE1BQVUsWUFBWTtBQUFBLE1BQy9FLE9BQU87QUFBQSxNQUFVLFdBQVc7QUFBQSxNQUFVLFdBQVc7QUFBQSxNQUNqRCxLQUFLO0FBQUEsTUFBVSxNQUFNO0FBQUEsTUFBVSxVQUFVO0FBQUEsTUFDekMsT0FBTztBQUFBLE1BQVUsV0FBVztBQUFBLE1BQVUsU0FBUztBQUFBLE1BQVUsS0FBSztBQUFBLE1BQVUsVUFBVTtBQUFBLE1BQVUsS0FBSztBQUFBLE1BQVUsU0FBUztBQUFBLE1BQ3BILFFBQVE7QUFBQSxNQUFVLFNBQVM7QUFBQSxNQUFLLFNBQVM7QUFBQSxNQUFNLEtBQUs7QUFBQSxNQUFNLE9BQU87QUFBQSxJQUNuRTtBQUFBLElBQ0EsU0FBUztBQUFBLE1BQ1AsTUFBTTtBQUFBLE1BQU8sSUFBSSxDQUFDLFdBQVcsU0FBUztBQUFBLE1BQ3RDLFFBQVE7QUFBQSxNQUFVLFFBQVE7QUFBQSxNQUFVLE9BQU87QUFBQSxNQUMzQyxTQUFTO0FBQUEsTUFBVSxVQUFVO0FBQUEsTUFBVSxXQUFXO0FBQUEsTUFDbEQsS0FBSztBQUFBLE1BQVUsS0FBSztBQUFBLE1BQVUsU0FBUztBQUFBLE1BQVUsUUFBUTtBQUFBLE1BQVUsWUFBWTtBQUFBLE1BQy9FLE9BQU87QUFBQSxNQUFVLFdBQVc7QUFBQSxNQUFVLFdBQVc7QUFBQSxNQUNqRCxLQUFLO0FBQUEsTUFBVSxNQUFNO0FBQUEsTUFBVSxVQUFVO0FBQUEsTUFDekMsT0FBTztBQUFBLE1BQVUsV0FBVztBQUFBLE1BQVUsU0FBUztBQUFBLE1BQVUsS0FBSztBQUFBLE1BQVUsVUFBVTtBQUFBLE1BQVUsS0FBSztBQUFBLE1BQVUsU0FBUztBQUFBLE1BQ3BILFFBQVE7QUFBQSxNQUFVLFNBQVM7QUFBQSxNQUFNLFNBQVM7QUFBQSxNQUFNLEtBQUs7QUFBQSxNQUFNLE9BQU87QUFBQSxJQUNwRTtBQUFBLElBQ0EsTUFBTTtBQUFBLE1BQ0osTUFBTTtBQUFBLE1BQU0sSUFBSSxDQUFDLFdBQVcsU0FBUztBQUFBLE1BQ3JDLFFBQVE7QUFBQSxNQUFVLFFBQVE7QUFBQSxNQUFVLE9BQU87QUFBQSxNQUMzQyxTQUFTO0FBQUEsTUFBVSxVQUFVO0FBQUEsTUFBVSxXQUFXO0FBQUEsTUFDbEQsS0FBSztBQUFBLE1BQVUsS0FBSztBQUFBLE1BQVUsU0FBUztBQUFBLE1BQVUsUUFBUTtBQUFBLE1BQVUsWUFBWTtBQUFBLE1BQy9FLE9BQU87QUFBQSxNQUFVLFdBQVc7QUFBQSxNQUFVLFdBQVc7QUFBQSxNQUNqRCxLQUFLO0FBQUEsTUFBVSxNQUFNO0FBQUEsTUFBVSxVQUFVO0FBQUEsTUFDekMsT0FBTztBQUFBLE1BQVUsV0FBVztBQUFBLE1BQVUsU0FBUztBQUFBLE1BQVUsS0FBSztBQUFBLE1BQVUsVUFBVTtBQUFBLE1BQVUsS0FBSztBQUFBLE1BQVUsU0FBUztBQUFBLE1BQ3BILFFBQVE7QUFBQSxNQUFVLFNBQVM7QUFBQSxNQUFNLFNBQVM7QUFBQSxNQUFNLEtBQUs7QUFBQSxNQUFLLE9BQU87QUFBQSxJQUNuRTtBQUFBLEVBQ0Y7QUFFTyxXQUFTLFFBQVEsSUFBSTtBQUFFLFdBQU8sT0FBTyxFQUFFLEtBQUssT0FBTztBQUFBLEVBQVE7OztBQ25EM0QsV0FBUyxVQUFVLElBQUksSUFBSSxLQUFLLE1BQU0sR0FBRztBQUM5QyxVQUFNLEtBQUssSUFBSSxNQUFNLEtBQUssSUFBSSxLQUFLLElBQUksRUFBRSxDQUFDO0FBQzFDLFVBQU0sTUFBTSxDQUFDO0FBQ2IsVUFBTSxVQUFVLENBQUMsQ0FBQyxLQUFLLEtBQUssS0FBSyxLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUUsS0FBSyxNQUFNLEtBQUssS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFLEtBQUssTUFBTSxFQUFFLEtBQUssTUFBTSxDQUFDLEdBQUcsQ0FBQyxLQUFLLEtBQUssRUFBRSxLQUFLLE1BQU0sQ0FBQyxDQUFDO0FBQy9ILGVBQVcsQ0FBQyxJQUFJLElBQUksQ0FBQyxLQUFLLFNBQVM7QUFDakMsZUFBUyxJQUFJLEdBQUcsS0FBSyxLQUFLLEtBQUs7QUFDN0IsY0FBTSxLQUFLLElBQUksSUFBSSxPQUFPLEtBQUssS0FBSztBQUNwQyxZQUFJLEtBQUssQ0FBQyxLQUFLLEtBQUssSUFBSSxDQUFDLElBQUksS0FBSyxLQUFLLEtBQUssSUFBSSxDQUFDLElBQUksR0FBRyxDQUFDO0FBQUEsTUFDM0Q7QUFBQSxJQUNGO0FBQ0EsV0FBTztBQUFBLEVBQ1Q7QUFFTyxXQUFTLFVBQVUsR0FBRyxJQUFJLElBQUk7QUFDbkMsVUFBTSxNQUFNLENBQUM7QUFDYixhQUFTLElBQUksR0FBRyxJQUFJLEdBQUcsS0FBSztBQUFFLFlBQU0sSUFBSyxJQUFJLElBQUssS0FBSyxLQUFLO0FBQUcsVUFBSSxLQUFLLENBQUMsS0FBSyxJQUFJLENBQUMsSUFBSSxHQUFHLEtBQUssSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQUEsSUFBRztBQUM3RyxXQUFPO0FBQUEsRUFDVDtBQUVPLFdBQVMsUUFBUSxHQUFHLFFBQVEsSUFBSSxRQUFRLE1BQU07QUFDbkQsVUFBTSxNQUFNLENBQUM7QUFDYixhQUFTLElBQUksR0FBRyxJQUFJLFFBQVEsR0FBRyxLQUFLO0FBQUUsWUFBTSxJQUFLLEtBQUssUUFBUSxLQUFNLEtBQUssS0FBSyxHQUFHLEtBQUssSUFBSSxJQUFJLElBQUksUUFBUTtBQUFHLFVBQUksS0FBSyxDQUFDLEtBQUssSUFBSSxDQUFDLElBQUksSUFBSSxLQUFLLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztBQUFBLElBQUc7QUFDN0osV0FBTztBQUFBLEVBQ1Q7QUFFQSxNQUFNLE1BQU0sQ0FBQyxRQUFRLEVBQUcsT0FBTyxLQUFNLE9BQU8sTUFBTyxPQUFPLElBQUssT0FBTyxNQUFNLE1BQU0sT0FBTyxHQUFHO0FBRXJGLE1BQU0sYUFBTixNQUFpQjtBQUFBLElBQ3RCLGNBQWM7QUFBRSxXQUFLLElBQUksQ0FBQztBQUFHLFdBQUssSUFBSSxDQUFDO0FBQUcsV0FBSyxJQUFJLENBQUM7QUFBQSxJQUFHO0FBQUEsSUFDdkQsSUFBSSxRQUFRO0FBQUUsYUFBTyxLQUFLLEVBQUUsV0FBVztBQUFBLElBQUc7QUFBQSxJQUUxQyxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLEtBQUs7QUFFM0MsWUFBTSxLQUFLLEtBQUssSUFBSSxLQUFLLEtBQUssSUFBSSxLQUFLLEtBQUssSUFBSSxLQUFLLEtBQUssSUFBSSxLQUFLLEtBQUssSUFBSSxLQUFLLEtBQUs7QUFDdEYsVUFBSSxLQUFLLEtBQUssS0FBSyxLQUFLLElBQUksS0FBSyxLQUFLLEtBQUssS0FBSyxJQUFJLEtBQUssS0FBSyxLQUFLLEtBQUs7QUFDeEUsWUFBTSxJQUFJLEtBQUssTUFBTSxJQUFJLElBQUksRUFBRSxLQUFLO0FBQUcsWUFBTTtBQUFHLFlBQU07QUFBRyxZQUFNO0FBQy9ELFdBQUssRUFBRSxLQUFLLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxFQUFFO0FBQzlDLFdBQUssRUFBRSxLQUFLLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxFQUFFO0FBQzlDLFlBQU0sSUFBSSxPQUFPLFFBQVEsV0FBVyxJQUFJLEdBQUcsSUFBSTtBQUMvQyxXQUFLLEVBQUUsS0FBSyxFQUFFLENBQUMsR0FBRyxFQUFFLENBQUMsR0FBRyxFQUFFLENBQUMsR0FBRyxFQUFFLENBQUMsR0FBRyxFQUFFLENBQUMsR0FBRyxFQUFFLENBQUMsR0FBRyxFQUFFLENBQUMsR0FBRyxFQUFFLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQztBQUFBLElBQ2xFO0FBQUEsSUFDQSxLQUFLLEdBQUcsR0FBRyxHQUFHLEdBQUcsS0FBSztBQUNwQixXQUFLLElBQUksRUFBRSxDQUFDLEdBQUcsRUFBRSxDQUFDLEdBQUcsRUFBRSxDQUFDLEdBQUcsRUFBRSxDQUFDLEdBQUcsRUFBRSxDQUFDLEdBQUcsRUFBRSxDQUFDLEdBQUcsRUFBRSxDQUFDLEdBQUcsRUFBRSxDQUFDLEdBQUcsRUFBRSxDQUFDLEdBQUcsR0FBRztBQUNsRSxXQUFLLElBQUksRUFBRSxDQUFDLEdBQUcsRUFBRSxDQUFDLEdBQUcsRUFBRSxDQUFDLEdBQUcsRUFBRSxDQUFDLEdBQUcsRUFBRSxDQUFDLEdBQUcsRUFBRSxDQUFDLEdBQUcsRUFBRSxDQUFDLEdBQUcsRUFBRSxDQUFDLEdBQUcsRUFBRSxDQUFDLEdBQUcsR0FBRztBQUFBLElBQ3BFO0FBQUE7QUFBQSxJQUdBLEtBQUssS0FBSyxJQUFJLElBQUksSUFBSSxJQUFJLEdBQUcsS0FBSztBQUNoQyxZQUFNLElBQUksSUFBSTtBQUNkLGVBQVMsSUFBSSxHQUFHLElBQUksR0FBRyxLQUFLO0FBQzFCLGNBQU0sSUFBSSxJQUFJLENBQUMsR0FBRyxJQUFJLEtBQUssSUFBSSxLQUFLLENBQUM7QUFDckMsYUFBSyxJQUFJLElBQUksSUFBSSxHQUFHLEtBQUssRUFBRSxDQUFDLElBQUksS0FBSyxFQUFFLENBQUMsSUFBSSxJQUFJLEtBQUssRUFBRSxDQUFDLElBQUksS0FBSyxFQUFFLENBQUMsSUFBSSxJQUFJLEdBQUcsS0FBSyxFQUFFLENBQUMsSUFBSSxLQUFLLEVBQUUsQ0FBQyxJQUFJLElBQUksS0FBSyxFQUFFLENBQUMsSUFBSSxLQUFLLEVBQUUsQ0FBQyxJQUFJLElBQUksR0FBRyxHQUFHO0FBQUEsTUFDL0k7QUFBQSxJQUNGO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxJQU1BLE1BQU0sT0FBTyxPQUFPLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLE9BQU8sUUFBUSxTQUFTLFVBQVU7QUFDNUUsWUFBTSxJQUFJLE1BQU0sUUFBUSxLQUFLLEtBQUs7QUFDbEMsWUFBTSxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRSxDQUFDLElBQUksS0FBSyxFQUFFLENBQUMsSUFBSSxJQUFJLEtBQUssRUFBRSxDQUFDLElBQUksS0FBSyxFQUFFLENBQUMsSUFBSSxFQUFFO0FBQ3hFLGVBQVMsSUFBSSxHQUFHLElBQUksR0FBRyxLQUFLO0FBQzFCLGNBQU0sS0FBSyxJQUFJLEtBQUs7QUFDcEIsY0FBTSxLQUFLLEVBQUUsTUFBTSxDQUFDLENBQUMsR0FBRyxLQUFLLEVBQUUsTUFBTSxDQUFDLENBQUMsR0FBRyxLQUFLLEVBQUUsTUFBTSxDQUFDLENBQUMsR0FBRyxLQUFLLEVBQUUsTUFBTSxDQUFDLENBQUM7QUFDM0UsYUFBSyxJQUFJLElBQUksSUFBSSxJQUFJLEdBQUcsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxHQUFHLElBQUksR0FBRyxDQUFDLEdBQUcsR0FBRyxDQUFDLEdBQUcsSUFBSSxNQUFNO0FBQy9ELGFBQUssS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxHQUFHLEVBQUUsR0FBRyxRQUFRO0FBQ2xHLGFBQUssS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxHQUFHLEVBQUUsR0FBRyxPQUFPO0FBQUEsTUFDbkc7QUFBQSxJQUNGO0FBQUE7QUFBQSxJQUdBLE1BQU0sR0FBRyxHQUFHLEdBQUcsSUFBSSxJQUFJLElBQUksS0FBSyxHQUFHLEtBQUssU0FBUztBQUUvQyxVQUFJLElBQUksSUFBSTtBQUNaLFVBQUksS0FBSyxJQUFJLEVBQUUsSUFBSSxLQUFLO0FBQUUsYUFBSztBQUFHLGFBQUs7QUFBRyxhQUFLO0FBQUEsTUFBRyxPQUFPO0FBQUUsYUFBSyxDQUFDO0FBQUksYUFBSztBQUFJLGFBQUs7QUFBRyxjQUFNLElBQUksS0FBSyxNQUFNLElBQUksRUFBRSxLQUFLO0FBQUcsY0FBTTtBQUFHLGNBQU07QUFBQSxNQUFHO0FBQzNJLFlBQU0sS0FBSyxLQUFLLEtBQUssS0FBSyxJQUFJLEtBQUssS0FBSyxLQUFLLEtBQUssSUFBSSxLQUFLLEtBQUssS0FBSyxLQUFLO0FBQzFFLFlBQU0sS0FBSyxJQUFJLEtBQUssR0FBRyxLQUFLLElBQUksS0FBSyxHQUFHLEtBQUssSUFBSSxLQUFLO0FBQ3RELFlBQU0sUUFBUTtBQUNkLGVBQVMsSUFBSSxHQUFHLElBQUksT0FBTyxLQUFLO0FBQzlCLGNBQU0sS0FBTSxJQUFJLFFBQVMsS0FBSyxLQUFLLElBQUksS0FBSyxLQUFLLEdBQUcsTUFBTyxJQUFJLEtBQUssUUFBUyxLQUFLLEtBQUssSUFBSSxLQUFLLEtBQUs7QUFDckcsY0FBTSxLQUFLLENBQUMsS0FBSyxLQUFLLElBQUksRUFBRSxJQUFJLEtBQUssS0FBSyxJQUFJLEVBQUUsSUFBSSxNQUFNLEtBQUssS0FBSyxLQUFLLElBQUksRUFBRSxJQUFJLEtBQUssS0FBSyxJQUFJLEVBQUUsSUFBSSxNQUFNLEtBQUssS0FBSyxLQUFLLElBQUksRUFBRSxJQUFJLEtBQUssS0FBSyxJQUFJLEVBQUUsSUFBSSxNQUFNLEdBQUc7QUFDbkssY0FBTSxLQUFLLENBQUMsS0FBSyxLQUFLLElBQUksRUFBRSxJQUFJLEtBQUssS0FBSyxJQUFJLEVBQUUsSUFBSSxNQUFNLEtBQUssS0FBSyxLQUFLLElBQUksRUFBRSxJQUFJLEtBQUssS0FBSyxJQUFJLEVBQUUsSUFBSSxNQUFNLEtBQUssS0FBSyxLQUFLLElBQUksRUFBRSxJQUFJLEtBQUssS0FBSyxJQUFJLEVBQUUsSUFBSSxNQUFNLEdBQUc7QUFDbkssYUFBSyxJQUFJLEdBQUcsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxHQUFHLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxVQUFVLEdBQUc7QUFBQSxNQUN0RjtBQUFBLElBQ0Y7QUFBQSxJQUVBLFFBQVE7QUFDTixZQUFNLElBQUksSUFBSSxNQUFNLGVBQWU7QUFDbkMsUUFBRSxhQUFhLFlB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SSxJQUFJO0FBQUUsYUFBTyxLQUFLLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxHQUFHO0FBQUEsSUFBRztBQUFBLElBQy9ELE1BQU0sR0FBRyxHQUFHO0FBQUUsV0FBSyxHQUFHLFFBQVEsRUFBRSxHQUFHLEtBQUssRUFBRSxDQUFDLEdBQUcsR0FBRyxLQUFLLEVBQUUsQ0FBQyxFQUFFO0FBQUcsYUFBTztBQUFBLElBQU07QUFBQSxJQUMzRSxLQUFLLEdBQUcsR0FBRztBQUFFLFdBQUssR0FBRyxPQUFPLEVBQUUsR0FBRyxLQUFLLEVBQUUsQ0FBQyxHQUFHLEdBQUcsS0FBSyxFQUFFLENBQUMsRUFBRTtBQUFHLGFBQU87QUFBQSxJQUFNO0FBQUEsSUFDekUsSUFBSSxHQUFHLEdBQUc7QUFBRSxXQUFLLEdBQUcsS0FBSyxLQUFLLEVBQUUsR0FBRyxLQUFLLEVBQUUsQ0FBQyxHQUFHLEdBQUcsS0FBSyxFQUFFLENBQUMsRUFBRSxDQUFDO0FBQUcsYUFBTztBQUFBLElBQU07QUFBQTtBQUFBLElBRTVFLE1BQU0sR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFJLElBQUksTUFBTSxLQUFLLEtBQUssR0FBRztBQUMzQyxXQUFLLEtBQUssS0FBSyxFQUFFLEdBQUcsU0FBUyxJQUFJLEtBQUssRUFBRSxDQUFDLEdBQUcsSUFBSSxLQUFLLEVBQUUsQ0FBQyxHQUFHLElBQUssSUFBSSxLQUFLLE9BQVEsR0FBRyxJQUFLLElBQUksS0FBSyxPQUFRLEdBQUcsS0FBSyxLQUFLLFNBQVMsQ0FBQyxLQUFLLE1BQU0sS0FBSyxNQUFNLElBQUksS0FBSyxLQUFLLE1BQU0sS0FBSyxHQUFHLENBQUM7QUFDcEwsYUFBTztBQUFBLElBQ1Q7QUFBQSxJQUNBLElBQUksR0FBRyxHQUFHLEtBQUssSUFBSSxJQUFJLE1BQU0sS0FBSyxLQUFLLEdBQUc7QUFDeEMsV0FBSyxLQUFLLEtBQUssRUFBRSxHQUFHLE9BQU8sSUFBSSxLQUFLLEVBQUUsQ0FBQyxHQUFHLElBQUksS0FBSyxFQUFFLENBQUMsR0FBRyxHQUFHLEtBQUssS0FBSyxLQUFLLFNBQVMsQ0FBQyxLQUFLLE1BQU0sS0FBSyxNQUFNLElBQUksS0FBSyxLQUFLLE1BQU0sS0FBSyxHQUFHLENBQUM7QUFDeEksYUFBTztBQUFBLElBQ1Q7QUFBQSxJQUNBLElBQUksR0FBRyxHQUFHO0FBQUUsV0FBSyxHQUFHLEtBQUssS0FBSyxFQUFFLEdBQUcsS0FBSyxFQUFFLENBQUMsR0FBRyxHQUFHLEtBQUssRUFBRSxDQUFDLEVBQUUsQ0FBQztBQUFHLGFBQU87QUFBQSxJQUFNO0FBQUEsSUFDNUUsS0FBSyxJQUFJLElBQUksSUFBSSxJQUFJO0FBQUUsYUFBTyxLQUFLLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxHQUFHO0FBQUEsSUFBRztBQUFBLElBQzdELE1BQU0sSUFBSSxJQUFJLElBQUksSUFBSTtBQUNwQixVQUFJLElBQUksS0FBSyxJQUFJLElBQUksRUFBRSxHQUFHLElBQUksS0FBSyxJQUFJLElBQUksRUFBRTtBQUM3QyxZQUFNLElBQUksS0FBSyxJQUFJLElBQUksRUFBRSxHQUFHLElBQUksS0FBSyxJQUFJLElBQUksRUFBRTtBQUMvQyxVQUFJLEtBQUssUUFBUTtBQUFFLGNBQU0sSUFBSSxLQUFLLElBQUk7QUFBRyxTQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztBQUFBLE1BQUc7QUFDbEUsYUFBTyxFQUFFLElBQUksQ0FBQyxRQUFTLElBQUksSUFBSSxLQUFLLElBQUssS0FBSyxNQUFNLElBQUksUUFBUyxJQUFJLElBQUksS0FBSyxJQUFLLEtBQUssTUFBTSxLQUFNLElBQUksSUFBSSxLQUFLLEtBQUssT0FBUSxHQUFHLEtBQU0sSUFBSSxJQUFJLEtBQUssS0FBSyxPQUFRLEVBQUU7QUFBQSxJQUNySztBQUFBO0FBQUEsSUFFQSxLQUFLLElBQUksSUFBSSxJQUFJLElBQUksS0FBSztBQUFFLFdBQUssS0FBSyxLQUFLLEVBQUUsR0FBRyxRQUFRLEdBQUcsS0FBSyxNQUFNLElBQUksSUFBSSxJQUFJLEVBQUUsR0FBRyxLQUFLLEtBQUssS0FB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LEVBQUUsSUFBSSxJQUFJLEVBQUU7QUFDMUIsVUFBRSxPQUFPLEdBQUcsSUFBSSxHQUFHLEVBQUUsRUFBRSxPQUFPLElBQUksSUFBSSxJQUFJLEVBQUU7QUFDNUMsVUFBRSxJQUFJLEtBQUssSUFBSSxFQUFFLEVBQUUsSUFBSSxLQUFLLElBQUksRUFBRSxFQUFFLElBQUksS0FBSyxJQUFJLEVBQUU7QUFDbkQsVUFBRSxNQUFNLEdBQUcsSUFBSSxFQUFFLEtBQUssTUFBTSxJQUFJO0FBQ2hDLFVBQUUsSUFBSSxHQUFHLElBQUksRUFBRSxJQUFJLElBQUksSUFBSSxFQUFFLElBQUksR0FBRyxJQUFJO0FBQUEsTUFDMUM7QUFBQSxJQUNGO0FBQUEsSUFDQTtBQUFBO0FBQUEsTUFDRSxJQUFJO0FBQUEsTUFDSixNQUFNLEdBQUc7QUFDUCxVQUFFLE1BQU07QUFDUixVQUFFLElBQUksR0FBRyxJQUFJLEdBQUcsRUFBRSxFQUFFLElBQUksSUFBSSxJQUFJLElBQUksRUFBRTtBQUN0QyxVQUFFLE9BQU8sR0FBRyxJQUFJLElBQUksRUFBRTtBQUN0QixVQUFFLEVBQUUsSUFBSSxHQUFHLEVBQUUsRUFBRSxFQUFFLElBQUksSUFBSSxFQUFFO0FBQzNCLFVBQUUsT0FBTyxHQUFHLElBQUksSUFBSSxFQUFFLEVBQUUsT0FBTyxJQUFJLElBQUksSUFBSSxFQUFFO0FBQzdDLFVBQUUsSUFBSSxLQUFLLEdBQUcsRUFBRSxFQUFFLElBQUksS0FBSyxHQUFHLEVBQUU7QUFDaEMsVUFBRSxJQUFJLEtBQUssSUFBSSxFQUFFLEVBQUUsSUFBSSxLQUFLLElBQUksRUFBRSxFQUFFLElBQUksS0FBSyxJQUFJLEVBQUU7QUFDbkQsVUFBRSxNQUFNLEdBQUcsSUFBSSxFQUFFLEtBQUssS0FBSyxJQUFJO0FBQy9CLFVBQUUsSUFBSSxHQUFHLElBQUksRUFBRSxJQUFJLElBQUksRUFBRSxFQUFFLElBQUksSUFBSSxDQUFDO0FBQUEsTUFDdEM7QUFBQSxJQUNGO0FBQUEsSUFDQTtBQUFBO0FBQUEsTUFDRSxJQUFJO0FBQUEsTUFBTyxL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Q3RCLFVBQUUsSUFBSSxLQUFLLElBQUksRUFBRSxFQUFFLElBQUksS0FBSyxJQUFJLEVBQUU7QUFDbEMsU0FBQyxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxRQUFRLENBQUMsQ0FBQyxHQUFHLENBQUMsTUFBTSxFQUFFLElBQUksS0FBSyxHQUFHLENBQUMsQ0FBQztBQUNsRixTQUFDLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxRQUFRLENBQUMsQ0FBQyxHQUFHLENBQUMsTUFBTSxFQUFFLElBQUksS0FBSyxHQUFHLENBQUMsQ0FBQztBQUMzRSxVQUFFLE1BQU0sTUFBTSxJQUFJLEVBQUUsS0FBSyxLQUFLLEdBQUc7QUFDakMsVUFBRSxJQUFJLElBQUksRUFBRSxFQUFFLElBQUksR0FBRyxDQUFDLEVBQUUsSUFBSSxJQUFJLENBQUM7QUFBQSxNQUNuQztBQUFBLElBQ0Y7QUFBQSxJQUNBO0FBQUE7QUFBQSxNQUNFLElBQUk7QUFBQSxNQUNKLE1BQU0sR0FBRztBQUNQLFVBQUUsTUFBTTtBQUNSLFVBQUUsRUFBRSxHQUFHLElBQUksRUFBRTtBQUNiLFNBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLENBQUMsRUFBRSxRQUFRLENBQUMsQ0FBQyxHQUFHLENBQUMsTUFBTSxFQUFFLElBQUksS0FBSyxHQUFHLENBQUMsQ0FBQztBQUNoRSxTQUFDLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLElBQUksRUFBRSxHQUFHLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLFFBQVEsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUUsSUFBSSxLQUFLLEdBQUcsQ0FBQyxDQUFDO0FBQ3JGLFVBQUUsTUFBTSxJQUFJLElBQUksR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHO0FBQy9CLFVBQUUsT0FBTyxHQUFHLElBQUksSUFBSSxFQUFFO0FBQ3RCLFVBQUUsRUFBRSxJQUFJLElBQUksRUFBRTtBQUNkLFVBQUUsSUFBSSxJQUFJLElBQUksSUFBSSxHQUFHLEdBQUcsR0FBRztBQUMzQixVQUFFLElBQUksR0FBRyxJQUFJLElBQUksR0FBRyxHQUFHLEdBQUcsRUFBRSxJQUFJLElBQUksR0FBRyxJQUFJLEdBQUcsR0FBRyxLQUFLLENBQUM7QUFDdkQsVUFBRSxNQUFNLE1BQU0sR0FBRyxFQUFFLEtBQUssTUFBTSxJQUFJO0FBQ2xDLFVBQUUsSUFBSSxJQUFJLENBQUMsRUFBRSxJQUFJLEdBQUcsRUFBRSxFQUFFLElBQUksSUFBSSxFQUFFO0FBQUEsTUFDcEM7QUFBQSxJQUNGO0FBQUEsSUFDQTtBQUFBO0FBQUEsTUFDRSxJQUFJO0FBQUEsTUFDSixNQUFNLEdBQUc7QUFDUCxVQUFFLE1BQU07QUFDUixVQUFFLEVBQUUsR0FBRyxHQUFHLEVBQUUsRUFBRSxFQUFFLElBQUksR0FBRyxFQUFFLEVBQUUsRUFBRSxJQUFJLEdBQUcsRUFBRTtBQUN0QyxVQUFFLElBQUksSUFBSSxHQUFHLElBQUksR0FBRyxHQUFHLEdBQUc7QUFDMUIsVUFBRSxJQUFJLElBQUksSUFBSSxJQUFJLEdBQUcsR0FBRyxLQUFLLENBQUM7QUFDOUIsVUFBRSxJQUFJLElBQUksSUFBSSxJQUFJLEdBQUcsR0FBRyxLQUFLLENBQUM7QUFDOUIsVUFBRSxNQUFNLEdBQUcsR0FBRyxFQUFFLEtBQUssTUFBTSxJQUFJO0FBQy9CLFVBQUUsSUFBSSxHQUFHLEdBQUcsRUFBRSxJQUFJLElBQUksSUFBSSxFQUFFLElBQUksSUFBSSxJQUFJO0FBQUEsTUFDMUM7QUFBQSxJQUNGO0FBQUEsSUFDQTtBQUFBO0FBQUEsTUFDRSxJQUFJO0FBQUEsTUFDSixNQUFNLEdBQUc7QUFDUCxVQUFFLE1BQU07QUFDUixVQUFFLEVBQUUsSUFBSSxHQUFHLENBQUMsRUFBRSxFQUFFLElBQUksSUFBSSxFQUFFO0FBQzFCLFVBQUUsSUFBSSxJQUFJLElBQUksSUFBSSxLQUFLLEdBQUcsR0FBRztBQUM3QixVQUFFLElBQUksS0FBSyxJQUFJLEVBQUUsRUFBRSxJQUFJLEtBQUssSUFBSSxFQUFFLEVBQUUsSUFBSSxLQUFLLElBQUksRUFBRTtBQUNuRCxVQUFFLE1BQU0sR0FBRyxJQUFJLEVBQUUsS0FBSyxNQUFNLElBQUk7QUFDaEMsVUFBRSxJQUFJLEdBQUcsSUFBSSxFQUFFLElBQUksR0FBRyxJQUFJLEVBQUUsSUFBSSxJQUFJLElBQUk7QUFBQSxNQUMxQztBQUFBLElBQ0Y7QUFBQSxJQUNBO0FBQUE7QUFBQSxNQUNFLElBQUk7QUFBQSxNQUNKLE1BQU0sR0FBRztBQUNQLFVBQUUsTUFBTTtBQUNSLFVBQUUsRUFBRSxHQUFHLEdBQUcsQ0FBQztBQUNYLFNBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxJQUFJLElBQUksSUFBSSxFQUFFLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLEdBQUcsSUFBSSxJQUFJLEVBQUUsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsSUFBSSxJQUFJLElBQUksRUFBRSxDQUFDLENBQUMsRUFDM0UsUUFBUSxDQUFDLENBQUMsR0FBRyxJQUFJLE1BQU0sS0FBSyxRQUFRLENBQUMsTUFBTSxFQUFFLElBQUksS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDO0FBQy9ELFVBQUUsRUFBRSxJQUFJLElBQUksRUFBRSxFQUFFLEVBQUUsSUFBSSxJQUFJLEVBQUU7QUFDNUIsVUFBRSxPQUFPLEdBQUcsSUFBSSxJQUFJLEVBQUU7QUFDdEIsVUFBRSxNQUFNLE1BQU0sSUFBSSxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUc7QUFDakMsVUFBRSxNQUFNLEdBQUcsR0FBRyxFQUFFLEtBQUssTUFBTSxJQUFJO0FBQy9CLFVBQUUsSUFBSSxJQUFJLENBQUMsRUFBRSxJQUFJLEdBQUcsRUFBRSxF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QUFJLElBQUksRUFBRSxJQUFJLElBQUksSUFBSTtBQUFBLE1BQzdDO0FBQUEsSUFDRjtBQUFBLElBQ0E7QUFBQTtBQUFBLE1BQ0UsSUFBSTtBQUFBLE1BQ0osTUFBTSxHQUFHO0FBQ1AsVUFBRSxNQUFNO0FBQ1IsVUFBRSxJQUFJLEdBQUcsR0FBRyxJQUFJLEVBQUUsRUFBRSxPQUFPLElBQUksSUFBSSxJQUFJLEVBQUU7QUFDekMsVUFBRSxJQUFJLElBQUksR0FBRyxJQUFJLEVBQUUsRUFBRSxLQUFLLElBQUksSUFBSSxJQUFJLEVBQUU7QUFDeEMsVUFBRSxJQUFJLElBQUksR0FBRztBQUNiLFVBQUUsTUFBTSxHQUFHLElBQUksRUFBRSxLQUFLLE1BQU0sSUFBSTtBQUNoQyxVQUFFLElBQUksR0FBRyxHQUFHLEVBQUUsSUFBSSxJQUFJLElBQUksRUFBRSxJQUFJLEtBQUssRUFBRTtBQUFBLE1BQ3pDO0FBQUEsSUFDRjtBQUFBLElBQ0E7QUFBQTtBQUFBLE1BQ0UsSUFBSTtBQUFBLE1BQ0osTUFBTSxHQUFHO0FBQ1AsVUFBRSxNQUFNO0FBQ1IsVUFBRSxFQUFFLEdBQUcsR0FBRyxFQUFFLEVBQUUsS0FBSyxJQUFJLEdBQUcsSUFBSSxHQUFHLEdBQUc7QUFDcEMsVUFBRSxLQUFLLEdBQUcsSUFBSSxHQUFHLElBQUksR0FBRyxFQUFFLEVBQUUsSUFBSSxHQUFHLEVBQUU7QUFDckMsVUFBRSxFQUFFLElBQUksR0FBRyxFQUFFLEVBQUUsS0FBSyxJQUFJLElBQUksSUFBSSxJQUFJLEdBQUc7QUFDdkMsVUFBRSxNQUFNLEdBQUcsR0FBRyxFQUFFLEtBQUssS0FBSyxJQUFJO0FBQzlCLFVBQUUsSUFBSSxJQUFJLEdBQUcsRUFBRSxJQUFJLElBQUksSUFBSSxFQUFFLElBQUksR0FBRyxJQUFJO0FBQUEsTUFDMUM7QUFBQSxJQUNGO0FBQUEsSUFDQTtBQUFBO0FBQUEsTUFDRSxJQUFJO0FBQUEsTUFDSixNQUFNLEdBQUc7QUFDUCxVQUFFLE1BQU07QUFDUixVQUFFLEVBQUUsSUFBSSxHQUFHLENBQUMsRUFBRSxLQUFLLEdBQUcsSUFBSSxHQUFHLElBQUksR0FBRyxFQUFFLEVBQUUsSUFBSSxHQUFHLEVBQUU7QUFDakQsVUFBRSxJQUFJLEtBQUssR0FBRyxFQUFFO0FBQ2hCLFVBQUUsTUFBTSxHQUFHLElBQUksRUFBRSxLQUFLLE1BQU0sSUFBSTtBQUNoQyxVQUFFLElBQUksSUFBSSxJQUFJLEVBQUUsSUFBSSxJQUFJLElBQUksRUFBRSxJQUFJLE1BQU0sR0FBRztBQUFBLE1BQzdDO0FBQUEsSUFDRjtBQUFBLElBQ0E7QUFBQTtBQUFBLE1BQ0UsSUFBSTtBQUFBLE1BQ0osTUFBTSxHQUFHO0FBQ1AsVUFBRSxNQUFNO0FBQ1IsVUFBRSxFQUFFLElBQUksR0FBRyxFQUFFO0FBQ2IsVUFBRSxFQUFFLElBQUksSUFBSSxFQUFFLEVBQUUsRUFBRSxJQUFJLElBQUksRUFBRSxFQUFFLEtBQUssSUFBSSxJQUFJLElBQUksSUFBSSxHQUFHLEVBQUUsRUFBRSxJQUFJLElBQUksRUFBRSxFQUFFLEVBQUUsSUFBSSxJQUFJLEVBQUU7QUFDbEYsVUFBRSxFQUFFLElBQUksSUFBSSxFQUFFLEVBQUUsS0FBSyxJQUFJLElBQUksSUFBSSxFQUFFLEVBQUUsRUFBRSxJQUFJLElBQUksRUFBRTtBQUNqRCxVQUFFLElBQUksSUFBSSxJQUFJO0FBQ2QsVUFBRSxNQUFNLEdBQUcsSUFBSSxFQUFFLEtBQUssTUFBTSxJQUFJO0FBQ2hDLFVBQUUsSUFBSSxHQUFHLElBQUksRUFBRSxJQUFJLElBQUksSUFBSSxFQUFFLElBQUksSUFBSSxJQUFJO0FBQUEsTUFDM0M7QUFBQSxJQUNGO0FBQUEsSUFDQTtBQUFBO0FBQUEsTUFDRSxJQUFJO0FBQUEsTUFDSixNQUFNLEdBQUc7QUFDUCxVQUFFLE1BQU07QUFDUixVQUFFLElBQUksSUFBSSxHQUFHLElBQUksRUFBRTtBQUNuQixVQUFFLEVBQUUsSUFBSSxJQUFJLEVBQUUsRUFBRSxJQUFJLElBQUksSUFBSSxJQUFJLEVBQUU7QUFDbEMsVUFBRSxLQUFLLElBQUksSUFBSSxJQUFJLEVBQUU7QUFDckIsVUFBRSxJQUFJLEtBQUssR0FBRyxFQUFFLElBQUksTUFBTSxHQUFHO0FBQzdCLFVBQUUsTUFBTSxHQUFHLElBQUksRUFBRSxLQUFLLE1BQU0sSUFBSTtBQUNoQyxVQUFFLElBQUksR0FBRyxJQUFJLEVBQUUsSUFBSSxNQUFNLEdBQUcsRUFBRSxJQUFJLElBQUksSUFBSTtBQUFBLE1BQzVDO0FBQUEsSUFDRjtBQUFBLElBQ0E7QUFBQTtBQUFBLE1BQ0UsSUFBSTtBQUFBLE1BQ0osTUFBTSxHQUFHO0FBQ1AsVUFBRSxNQUFNO0FBQ1IsVUFBRSxLQUFLLEdBQUcsSUFBSSxHQUFHLEVBQUUsRUFBRSxFQUFFLElBQUksR0FBRyxFQUFFO0FBQ2hDLFVBQUUsSUFBSSxJQUFJLEdBQUcsSUFBSSxHQUFHLEdBQUcsR0FBRztBQUMxQixVQUFFLElBQUksSUFBSSxJQUFJO0FBQ2QsVUFBRSxNQUFNLEdBQUcsSUFBSSxFQUFFLEtBQUssS0FBSyxJQUFJO0FBQy9CLFVBQUUsSUFBSSxJQUFJLElBQUksRUFBRSxJQUFJLElBQUksR0FBRyxFQUFFLElBQUksR0FBRyxJQUFJO0FBQUEsTUFDMUM7QUFBQSxJQUNGO0FBQUEsSUFDQTtBQUFBO0FBQUEsTUFDRSxJQUFJO0FBQUEsTUFDSixNQUFNLEdBQUc7QUFDUCxVQUFFLE1BQU07QUFDUixVQUFFLEVBQUUsSUFBSSxHQUFHLEVBQUUsRUFBRSxLQUFLLElBQUksSUFBSSxJQUFJLElBQUksR0FBRztBQUN2QyxVQUFFLEVBQUUsSUFBSSxJQUFJLEVBQUUsRUFBRSxJQUFJLElBQUksSUFBSSxJQUFJLEVBQUUsRUFBRSxLQUFLLElBQUksSUFBSSxJQUFJLEVBQUU7QUFDdkQsVUFBRSxJQUFJLE1BQU0sR0FBRztBQUNmLFNBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxNQUFNLEVBQUUsR0FBRyxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxLQUFLLEVBQUUsR0FBRyxD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QUFFLEVBQUUsRUFBRSxJQUFJLEdBQUcsRUFBRTtBQUMxQixVQUFFLElBQUksSUFBSSxJQUFJLElBQUksRUFBRTtBQUNwQixVQUFFLEVBQUUsR0FBRyxHQUFHLEVBQUU7QUFDWixVQUFFLElBQUksSUFBSSxHQUFHLElBQUksSUFBSSxLQUFLLEdBQUc7QUFDN0IsVUFBRSxNQUFNLEdBQUcsSUFBSSxFQUFFLEtBQUssS0FBSyxHQUFHO0FBQzlCLFVBQUUsSUFBSSxHQUFHLElBQUksRUFBRSxJQUFJLE1BQU0sRUFBRSxFQUFFLElBQUksR0FBRyxHQUFHO0FBQUEsTUFDekM7QUFBQSxJQUNGO0FBQUEsSUFDQTtBQUFBO0FBQUEsTUFDRSxJQUFJO0FBQUEsTUFDSixNQUFNLEdBQUc7QUFDUCxVQUFFLE1BQU07QUFDUixVQUFFLEVBQUUsSUFBSSxHQUFHLEVBQUUsRUFBRSxFQUFFLElBQUksR0FBRyxFQUFFO0FBQzFCLFVBQUUsSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLEtBQUssR0FBRztBQUM5QixVQUFFLElBQUksR0FBRyxJQUFJLEdBQUcsSUFBSSxLQUFLLEdBQUc7QUFDNUIsVUFBRSxNQUFNLEdBQUcsSUFBSSxFQUFFLEtBQUssTUFBTSxHQUFHO0FBQy9CLFVBQUUsSUFBSSxJQUFJLElBQUksRUFBRSxJQUFJLElBQUksSUFBSSxFQUFFLElBQUksSUFBSSxHQUFHO0FBQUEsTUFDM0M7QUFBQSxJQUNGO0FBQUEsSUFDQTtBQUFBO0FBQUEsTUFDRSxJQUFJO0FBQUEsTUFDSixNQUFNLEdBQUc7QUFDUCxVQUFFLE1BQU07QUFDUixVQUFFLEVBQUUsSUFBSSxHQUFHLEVBQUUsRUFBRSxFQUFFLElBQUksR0FBRyxFQUFFO0FBQzFCLFVBQUUsRUFBRSxJQUFJLElBQUksRUFBRTtBQUNkLFVBQUUsTUFBTSxJQUFJLElBQUksSUFBSSxFQUFFO0FBQ3RCLFVBQUUsSUFBSSxHQUFHLElBQUksSUFBSSxJQUFJLEtBQUssR0FBRztBQUM3QixVQUFFLE1BQU0sTUFBTSxJQUFJLEVBQUUsS0FBSyxLQUFLLElBQUk7QUFD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QUEsTUFDRSxJQUFJO0FBQUEsTUFDSixNQUFNLEdBQUc7QUFDUCxVQUFFLE1BQU07QUFDUixVQUFFLEVBQUUsSUFBSSxHQUFHLENBQUMsRUFBRSxFQUFFLElBQUksR0FBRyxFQUFFLEVBQUUsRUFBRSxJQUFJLElBQUksRUFBRTtBQUN2QyxVQUFFLElBQUksR0FBRyxJQUFJLEdBQUcsSUFBSSxLQUFLLEdBQUc7QUFDNUIsVUFBRSxPQUFPLEdBQUcsR0FBRyxHQUFHLENBQUM7QUFDbkIsVUFBRSxNQUFNLElBQUksR0FBRyxJQUFJLElBQUksR0FBRyxLQUFLLENBQUM7QUFDaEMsVUFBRSxJQUFJLElBQUksSUFBSTtBQUNkLFVBQUUsS0FBSyxJQUFJLElBQUksSUFBSSxJQUFJLEdBQUc7QUFDMUIsVUFBRSxLQUFLLElBQUksSUFBSSxJQUFJLEVBQUU7QUFDckIsVUFBRSxNQUFNLElBQUksSUFBSSxJQUFJLElBQUksS0FBSyxLQUFLLEdBQUc7QUFDckMsVUFBRSxNQUFNLEdBQUcsSUFBSSxFQUFFLEtBQUssTUFBTSxJQUFJO0FBQ2hDLFVBQUUsSUFBSSxHQUFHLElBQUksRUFBRSxJQUFJLEtBQUssRUFBRSxFQUFFLElBQUksSUFBSSxJQUFJO0FBQUEsTUFDMUM7QUFBQSxJQUNGO0FBQUEsSUFDQTtBQUFBO0FBQUEsTUFDRSxJQUFJO0FBQUEsTUFDSixNQUFNLEdBQUc7QUFDUCxVQUFFLE1BQU07QUFDUixVQUFFLEVBQUUsR0FBRyxHQUFHLEVBQUUsRUFBRSxFQUFFLElBQUksR0FBRyxFQUFFLEVBQUUsRUFBRSxJQUFJLEdBQUcsRUFBRTtBQUN0QyxVQUFFLE1BQU0sR0FBRyxHQUFHLEdBQUcsR0FBRyxLQUFLLEtBQUssQ0FBQztBQUMvQixVQUFFLE1BQU0sSUFBSSxHQUFHLElBQUksR0FBRyxLQUFLLEtBQUssR0FBRztBQUNuQyxVQUFFLElBQUksSUFBSSxNQUFNLElBQUksR0FBRyxLQUFLLEtBQUssQ0FBQztBQUNsQyxVQUFFLElBQUksR0FBRyxNQUFNLElBQUksR0FBRyxLQUFLLEtBQUssR0FBRztBQUNuQyxVQUFFLElBQUksR0FBRyxHQUFHLElBQUksSUFBSSxLQUFLLEdBQUc7QUFDNUIsVUFBRSxJQUFJLEtBQUssSUFBSTtBQUNmLFVBQUUsTUFBTSxHQUFHLElBQUksR0FBRyxJQUFJLEtBQUssS0FBSyxHQUFHO0FBQ25DLFVBQUUsTUFBTSxJQUFJLElBQUksSUFBSSxJQUFJLEdBQUcsS0FBSyxHQUFHO0FBQ25DLFVBQUUsSUFBSSxHQUFHLElBQUksSUFBSSxJQUFJLEtBQUssR0FBRztBQUM3QixVQUFFLEtBQUssR0FBRyxJQUFJLEdBQUcsRUFBRTtBQUNuQixVQUFFLE1BQU0sSUFBSSxJQUFJLElBQUksSUFBSSxHQUFHLEtBQUssR0FBRztBQUNuQyxVQUFFLE1BQU0sR0FBRyxHQUFHLEVBQUUsS0FBSyxLQUFLLElBQUk7QUFDOUIsVUFBRSxJQUFJLE1BQU0sR0FBRyxFQUFFLElBQUksSUFBSSxJQUFJLEVBQUUsSUFBSSxJQUFJLElBQUk7QUFBQSxNQUM3QztBQUFBLElBQ0Y7QUFBQSxFQUNGOzs7QUMzUU8sTUFBTSxTQUFTO0FBQUEsSUFDcEI7QUFBQTtBQUFBLE1BQ0UsSUFBSTtBQUFBLE1BQU8sS0FBSztBQUFBLE1BQ2hCLE1BQU0sR0FBRztBQUNQLFVBQUUsTUFBTTtBQUNSLFVBQUUsSUFBSSxJQUFJLElBQUksSUFBSSxFQUFFO0FBQ3BCLFVBQUUsRUFBRSxJQUFJLElBQUksRUFBRTtBQUNkLFVBQUUsRUFBRSxHQUFHLEdBQUcsRUFBRTtBQUNaLFVBQUUsS0FBSyxHQUFHLE1BQU0sSUFBSSxJQUFJO0FBQ3hCLFVBQUUsTUFBTSxHQUFHLEdBQUcsRUFBRSxLQUFLLE1BQU0sSUFBSTtBQUMvQixVQUFFLElBQUksR0FBRyxHQUFHLEVBQUUsSUFBSSxJQUFJLElBQUksRUFBRSxJQUFJLElBQUksRUFBRTtBQUFBLE1BQ3hDO0FBQUEsSUFDRjtBQUFBLElBQ0E7QUFBQTtBQUFBLE1BQ0UsSUFBSTtBQUFBLE1BQ0osTUFBTSxHQUFHO0FBQ1AsVUFBRSxNQUFNO0FBQ1IsVUFBRSxFQUFFLElBQUksSUFBSSxFQUFFLEVBQUUsRUFBRSxJQUFJLElBQUksRUFBRTtBQUM1QixVQUFFLEVBQUUsR0FBRyxHQUFHLENBQUM7QUFDWCxVQUFFLEtBQUssR0FBRyxNQUFNLElBQUksRUFBRTtBQUN0QixVQUFFLE1BQU0sR0FBRyxHQUFHLEVBQUUsS0FBSyxNQUFNLElBQUk7QUFDL0IsVUFBRSxJQUFJLEdBQUcsSUFBSSxFQUFFLElBQUksSUFBSSxFQUFFLEVBQUUsSUFBSSxJQUFJLEVBQUU7QUFBQSxNQUN2QztBQUFBLElBQ0Y7QUFBQSxJQUNBO0FBQUE7QUFBQSxNQUNFLElBQUk7QUFBQSxNQUNKLE1BQU0sR0FBRztBQUNQLFVBQUUsTUFBTTtBQUNSLFVBQUUsRUFBRSxJQUFJLEdBQUcsRUFBRSxFQUFFLEVBQUUsR0FBRyxHQUFHLEVBQUU7QUFDekIsVUFBRSxLQUFLLElBQUksTUFBTSxHQUFHLElBQUk7QUFDeEIsVUFBRSxLQUFLLElBQUksTUFBTSxHQUFHLEdBQUc7QUFDdkIsVUFBRSxNQUFNLEdBQUcsSUFBSSxFQUFFLEtBQUssTUFBTSxHQUFHO0FBQy9CLFVBQUUsSUFBSSxJQUFJLElBQUksRUFBRSxJQUFJLElBQUksSUFBSSxFQUFFLElBQUksSUFBSSxHQUFHO0FBQUEsTUFDM0M7QUFBQSxJQUNGO0FBQUEsSUFDQTtBQUFBO0FBQUEsTUFDRSxJQUFJO0FBQUEsTUFDSixNQUFNLEdBQUc7QUFDUCxVQUFFLE1BQU07QUFDUixVQUFFLE9BQU8sR0FBRyxJQUFJLElBQUksRUFBRTtBQUN0QixVQUFFLElBQUksSUFBSSxJQUFJLElBQUksRUFBRTtBQUNwQixVQUFFLElBQUksS0FBSyxJQUFJLEVBQUUsRUFBRSxJQUFJLEtBQUssSUFBSSxFQUFFO0FBQ2xDLFVBQUUsRUFBRSxHQUFHLEdBQUcsQ0FBQztBQUNYLFVBQUUsSUFBSSxJQUFJLElBQUksSUFBSSxFQUFFO0FBQ3BCLFVBQUUsRUFBRSxJQUFJLElBQUksRUFBRTtBQUNkLFVBQUUsS0FBSyxJQUFJLE1BQU0sSUFBSSxJQUFJO0FBQ3pCLFVBQUUsTUFBTSxHQUFHLEdBQUcsRUFBRSxLQUFLLE1BQU0sSUFBSTtBQUMvQixVQUFFLElBQUksR0FBRyxHQUFHLEVBQUUsSUFBSSxJQUFJLEVBQUUsRUFBRSxJQUFJLElBQUksRUFBRTtBQUFBLE1BQ3RDO0FBQUEsSUFDRjtBQUFBLElBQ0E7QUFBQTtBQUFBLE1BQ0UsSUFBSTtBQUFBLE1BQ0osTUFBTSxHQUFHO0FBQ1AsVUFBRSxNQUFNO0FBQ1IsVUFBRSxNQUFNLEdBQUcsSUFBSSxJQUFJLEVBQUU7QUFDckIsVUFBRSxFQUFFLElBQUksR0FBRyxFQUFFLEVBQUUsRUFBRSxJQUFJLElBQUksRUFBRTtBQUMzQixVQUFFLEVBQUUsSUFBSSxHQUFHLEVBQUUsRUFBRSxFQUFFLElBQUksR0FBRyxFQUFFO0FBQzFCLFVBQUUsS0FBSyxHQUFHLE1BQU0sSUFBSSxJQUFJO0FBQ3hCLFVBQUUsTUFBTSxHQUFHLEdBQUcsRUFBRSxLQUFLLE1BQU0sSUFBSTtBQUMvQixVQUFFLElBQUksR0FBRyxJQUFJLEVBQUUsSUFBSSxJQUFJLElBQUksRUFBRSxJQUFJLElBQUksQ0FBQztBQUFBLE1BQ3hDO0FBQUEsSUFDRjtBQUFBLElBQ0E7QUFBQTtBQUFBLE1BQ0UsSUFBSTtBQUFBLE1BQ0osTUFBTSxHQUFHO0FBQ1AsVUFBRSxNQUFNO0FBQ1IsVUFBRSxLQUFLLEdBQUcsSUFBSSxJQUFJLEVBQUU7QUFDcEIsVUFBRSxJQUFJLElBQUksSUFBSSxJQUFJLEVBQUU7QUFDcEIsVUFBRSxJQUFJLElBQUksSUFBSSxJQUFJLEVBQUU7QUFDcEIsVUFBRSxPQUFPLElBQUksSUFBSSxJQUFJLEVBQUU7QUFDdkIsVUFBRSxFQUFFLElBQUksSUFBSSxFQUFFLEVBQUUsRUFBRSxJQUFJLElBQUksRUFBRTtBQUM1QixVQUFFLEtBQUssSUFBSSxNQUFNLElBQUksSUFBSTtBQUN6QixVQUFFLE1BQU0sR0FBRyxHQUFHLEVBQUUsS0FBSyxNQUFNLElBQUk7QUFDL0IsVUFBRSxJQUFJLEdBQUcsRUFBRSxFQUFFLElBQUksSUFBSSxFQUFFLEVBQUUsSUFBSSxJQUFJLEVB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QUFFLElBQUksS0FBSyxHQUFHLENBQUMsQ0FBQztBQUN0RCxTQUFDLEdBQUcsSUFBSSxFQUFFLEVBQUUsUUFBUSxDQUFDLE1BQU0sRUFBRSxJQUFJLEtBQUssR0FBRyxDQUFDLENBQUM7QUFDM0MsVUFBRSxJQUFJLEtBQUssR0FBRyxFQUFFLEVBQUUsSUFBSSxLQUFLLElBQUksRUFBRSxFQUFFLElBQUksS0FBSyxJQUFJLEVBQUU7QUFDbEQsU0FBQyxHQUFHLElBQUksSUFBSSxFQUFFLEVBQUUsUUFBUSxDQUFDLE1BQU0sRUFBRSxJQUFJLEtBQUssR0FBRyxFQUFFLENBQUM7QUFDaEQsVUFBRSxLQUFLLElBQUksSUFBSSxJQUFJLEVBQUU7QUFDckIsVUFBRSxPQUFPLEdBQUcsSUFBSSxJQUFJLEVBQUU7QUFDdEIsVUFBRSxLQUFLLElBQUksTUFBTSxJQUFJLElBQUk7QUFDekIsVUFBRSxNQUFNLEdBQUcsQ0FBQyxFQUFFLEtBQUssTUFBTSxJQUFJO0FBQzdCLFVBQUUsSUFBSSxJQUFJLENBQUMsRUFBRSxJQUFJLElBQUksRUFBRSxFQUFFLElBQUksSUFBSSxFQUFFO0FBQUEsTUFDckM7QUFBQSxJQUNGO0FBQUEsSUFDQTtBQUFBO0FBQUEsTUFDRSxJQUFJO0FBQUEsTUFDSixNQUFNLEdBQUc7QUFDUCxVQUFFLE1BQU07QUFDUixVQUFFLEVBQUUsR0FBRyxHQUFHLEVBQUUsRUFBRSxFQUFFLElBQUksR0FBRyxFQUFFLEVBQUUsRUFBRSxJQUFJLEdBQUcsRUFBRSxFQUFFLEVBQUUsR0FBRyxJQUFJLEVBQUU7QUFDbkQsVUFBRSxFQUFFLElBQUksR0FBRyxFQUFFLEVBQUUsRUFBRSxJQUFJLElBQUksRUFBRSxFQUFFLEVBQUUsSUFBSSxJQUFJLEVBQUUsRUFBRSxFQUFFLElBQUksSUFBSSxFQUFFLEVBQUUsRUFBRSxJQUFJLElBQUksRUFBRTtBQUNyRSxVQUFFLEVBQUUsSUFBSSxJQUFJLEVBQUU7QUFDZCxVQUFFLEtBQUssTUFBTSxNQUFNLE1BQU0sRUFBRTtBQUMzQixVQUFFLE1BQU0sR0FBRyxHQUFHLEVBQUUsS0FBSyxNQUFNLEVBQUU7QUFDN0IsVUFBRSxJQUFJLE1BQU0sRUFBRSxFQUFFLElBQUksS0FBSyxFQUFFLEVBQUUsSUFBSSxNQUFNLElBQUk7QUFBQSxNQUM3QztBQUFBLElBQ0Y7QUFBQSxJQUNBO0FBQUE7QUFBQSxNQUNFLElBQUk7QUFBQSxNQUNKLE1BQU0sR0FBRztBQUNQLFVBQUUsTUFBTTtBQUNSLFVBQUUsRUFBRSxJQUFJLEdBQUcsRUFBRTtBQUNiLFVBQUUsRUFBRSxJQUFJLEdBQUcsQ0FBQyxFQUFFLEVBQUUsR0FBRyxJQUFJLEVBQUU7QUFDekIsVUFBRSxJQUFJLEdBQUcsSUFBSSxHQUFHLEVBQUU7QUFDbEIsVUFBRSxLQUFLLEdBQUcsSUFBSSxHQUFHLEVBQUU7QUFDbkIsVUFBRSxJQUFJLEtBQUssSUFBSSxJQUFJLEdBQUcsR0FBSyxHQUFHO0FBQzlCLFVBQUUsT0FBTyxJQUFJLElBQUksSUFBSSxFQUFFO0FBQ3ZCLFVBQUUsS0FBSyxJQUFJLE1BQU0sTUFBTSxHQUFHO0FBQzFCLFVBQUUsSUFBSSxNQUFNLEdBQUc7QUFDZixVQUFFLE1BQU0sR0FBRyxHQUFHLEVBQUUsS0FBSyxLQUFLLElBQUk7QUFDOUIsVUFBRSxJQUFJLEdBQUcsSUFBSSxFQUFFLElBQUksSUFBSSxDQUFDLEVBQUUsSUFBSSxJQUFJLElBQUk7QUFBQSxNQUN4QztBQUFBLElBQ0Y7QUFBQSxJQUNBO0FBQUE7QUFBQSxNQUNFLElBQUk7QUFBQSxNQUNKLE1BQU0sR0FBRztBQUNQLFVBQUUsTUFBTTtBQUNSLFVBQUUsRUFBRSxJQUFJLEdBQUcsRUFBRSxFQUFFLEVBQUUsSUFBSSxJQUFJLEVBQUU7QUFDM0IsVUFBRSxJQUFJLElBQUksSUFBSSxJQUFJLEVBQUU7QUFDcEIsVUFBRSxJQUFJLEdBQUcsSUFBSSxJQUFJLElBQUksS0FBSyxHQUFJO0FBQzlCLFVBQUUsRUFBRSxJQUFJLEdBQUcsRUFBRTtBQUNiLFVBQUUsRUFBRSxHQUFHLElBQUksRUFBRTtBQUNiLFVBQUUsS0FBSyxLQUFLLE1BQU0sTUFBTSxH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QUFFLEdBQUUsQ0FBQyxNQUFLLEVBQUUsR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsSUFBRyxJQUFJLEdBQUUsQ0FBQyxLQUFJLElBQUksQ0FBQyxFQUFDO0FBQUEsSUFDM0ksT0FBTyxFQUFDLE9BQU0sSUFBRyxLQUFJLE1BQUssTUFBSyxNQUFLLEtBQUksTUFBSyxRQUFPLENBQUMsQ0FBQyxNQUFLLEdBQUcsR0FBRSxDQUFDLE1BQUssR0FBRyxHQUFFLENBQUMsTUFBSyxHQUFHLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLElBQUcsR0FBRyxHQUFFLENBQUMsS0FBSSxFQUFFLEdBQUUsQ0FBQyxJQUFHLENBQUMsR0FBRSxDQUFDLEtBQUksRUFBRSxHQUFFLENBQUMsTUFBSyxFQUFFLEdBQUUsQ0FBQyxNQUFLLEdBQUcsR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsSUFBRyxHQUFHLEdBQUUsQ0FBQyxLQUFJLElBQUksR0FBRSxDQUFDLEtBQUksSUFBSSxDQUFDLEdBQUUsS0FBSSxHQUFFLE1BQUssQ0FBQyxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLElBQUcsR0FBRyxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxNQUFLLEVBQUUsR0FBRSxDQUFDLEtBQUksQ0FBQyxHQUFFLENBQUMsSUFBRyxFQUFFLEdBQUUsQ0FBQyxLQUFJLEVBQUUsR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsSUFBRyxHQUFHLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLE1BQUssSUFBSSxHQUFFLENBQUMsTUFBSyxJQUFJLENBQUMsRUFBQztBQUFBLElBQ3RWLE9BQU8sRUFBQyxPQUFNLElBQUcsS0FBSSxNQUFLLE1BQUssS0FBSSxLQUFJLE1BQUssUUFBTyxDQUFDLENBQUMsS0FBSSxFQUFFLEdBQUUsQ0FBQyxLQUFJLEVBQUUsR0FBRSxDQUFDLEtBQUksRUFBRSxHQUFFLENBQUMsSUFBRyxFQUFFLEdBQUUsQ0FBQyxJQUFHLEdBQUcsR0FBRSxDQUFDLEtBQUksSUFBSSxHQUFFLENBQUMsS0FBSSxJQUFJLENBQUMsRUFBQztBQUFBLElBQ3RILE9BQU8sRUFBQyxPQUFNLElBQUcsS0FBSSxNQUFLLE1BQUssTUFBSyxLQUFJLE1BQUssUUFBTyxDQUFDLENBQUMsTUFBSyxJQUFJLEdBQUUsQ0FBQyxNQUFLLElBQUksR0FBRSxDQUFDLE1BQUssSUFBSSxHQUFFLENBQUMsTUFBSyxJQUFJLEdBQUUsQ0FBQyxNQUFLLElBQUksR0FBRSxDQUFDLEtBQUksSUFBSSxHQUFFLENBQUMsS0FBSSxJQUFJLEdBQUUsQ0FBQyxJQUFHLElBQUksR0FBRSxDQUFDLEtBQUksSUFBSSxHQUFFLENBQUMsS0FBSSxJQUFJLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLEtBQUksRUFBRSxHQUFFLENBQUMsSUFBRyxFQUFFLEdBQUUsQ0FBQyxJQUFHLEdBQUcsR0FBRSxDQUFDLElBQUcsR0FBRyxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxNQUFLLEdBQUcsR0FBRSxDQUFDLE1BQUssR0FBRyxHQUFFLENBQUMsTUFBSyxHQUFHLENBQUMsRUFBQztBQUFBLElBQy9QLE9BQU8sRUFBQyxPQUFNLElBQUcsS0FBSSxNQUFLLE1BQUssTUFBSyxLQUFJLE1BQUssUUFBTyxDQUFDLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLEtBQUksRUFBRSxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxJQUFHLEdBQUcsR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsS0FBSSxFQUFFLEdBQUUsQ0FBQyxJQUFHLEVBQUUsR0FBRSxDQUFDLEtBQUksR0FBRyxDQUFDLEdBQUUsS0FBSSxHQUFFLE1BQUssQ0FBQyxDQUFDLElBQUcsR0FBRyxHQUFFLENBQUMsSUFBRyxHQUFHLEdBQUUsQ0FBQyxJQUFHLEdBQUcsR0FBRSxDQUFDLElBQUcsR0FBRyxHQUFFLENBQUMsSUFBRyxHQUFHLEdBQUUsQ0FBQyxJQUFHLEVBQUUsR0FBRSxDQUFDLElBQUcsR0FBRyxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxNQUFLLEdBQUcsR0FBRSxDQUFDLE1BQUssRUFBRSxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxNQUFLLEdBQUcsQ0FBQyxFQUFDO0FBQUEsSUFDdlMsT0FBTyxFQUFDLE9BQU0sSUFBRyxLQUFJLE1BQUssTUFBSyxNQUFLLEtBQUksTUFBSyxRQUFPLENBQUMsQ0FBQyxNQUFLLEdBQUcsR0FBRSxDQUFDLE1BQUssR0FBRyxHQUFFLENBQUMsTUFBSyxHQUFHLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLElBQUcsRUFBRSxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxLQUFJLElBQUksR0FBRSxDQUFDLEtBQUksSUFBSSxDQUFDLEdBQUUsS0FBSSxHQUFFLE1BQUssQ0FBQyxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLElBQUcsR0FBRyxHQUFFLENBQUMsS0FBSSxFQUFFLEdBQUUsQ0FBQyxNQUFLLEdBQUcsR0FBRSxDQUFDLE1BQUssSUFBSSxHQUFFLENBQUMsTUFBSyxJQUFJLENBQUMsRUFBQztBQUFBLElBQ3hPLE9BQU8sRUFBQyxPQUFNLElBQUcsS0FBSSxNQUFLLE1BQUssTUFBSyxLQUFJLE1BQUssUUFBTyxDQUFDLENBQUMsTUFBSyxHQUFHLEdBQUUsQ0FBQyxNQUFLLEdBQUcsR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsSUFBRyxHQUFHLEdBQUUsQ0FBQyxJQUFHLEVBQUUsR0FBRSxDQUFDLEtBQUksRUFBRSxHQUFFLENBQUMsTUFBSyxHQUFHLEdBQUUsQ0FBQyxNQUFLLElBQUksQ0FBQyxHQUFFLEtBQUksR0FBRSxNQUFLLENBQUMsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsSUFBRyxHQUFHLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLEdBQUUsRUFBRSxHQUFFLENBQUMsSUFBRyxFQUFFLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLEtBQUksSUFBSSxDQUFDLEVBQUM7QUFBQSxJQUM5TixPQUFPLEVBQUMsT0FBTSxJQUFHLEtBQUksTUFBSyxNQUFLLE1BQUssS0FBSSxNQUFLLFFBQU8sQ0FBQyxDQUFDLE1BQUssSUFBSSxHQUFFLENBQUMsTUFBSyxJQUFJLEdBQUUsQ0FBQyxNQUFLLElBQUksR0FBRSxDQUFDLE1BQUssSUFBSSxHQUFFLENBQUMsTUFBSyxJQUFJLEdBQUUsQ0FBQyxLQUFJLElBQUksR0FBRSxDQUFDLEtBQUksSUFBSSxHQUFFLENBQUMsSUFBRyxJQUFJLEdBQUUsQ0FBQyxLQUFJLElBQUksR0FBRSxDQUFDLEtBQUksSUFBSSxDQUFDLEVBQUM7QUFBQSxJQUN2SyxRQUFRLEVBQUMsT0FBTSxJQUFHLEtBQUksTUFBSyxNQUFLLE1BQUssS0FBSSxNQUFLLFFBQU8sQ0FBQyxDQUFDLE1BQUssR0FBRyxHQUFFLENBQUMsTUFBSyxHQUFHLEdBQUUsQ0FBQyxNQUFLLEdBQUcsR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsSUFBRyxHQUFHLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLEtBQUksRUFBRSxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxLQUFJLElBQUksR0FBRSxDQUFDLElBQUcsSUFBSSxHQUFFLENBQUMsS0FBSSxJQUFJLEdBQUUsQ0FBQyxNQUFLLElBQUksR0FBRSxDQUFDLE1BQUssR0FBRyxHQUFFLENBQUMsTUFBSyxFQUFFLEdBQUUsQ0FBQyxNQUFLLEVBQUUsR0FBRSxDQUFDLEtBQUksRUFBRSxHQUFFLENBQUMsSUFBRyxFQUFFLEdBQUUsQ0FBQyxJQUFHLEVBQUUsR0FBRSxDQUFDLElBQUcsSUFBSSxHQUFFLENBQUMsR0FBRSxHQUFHLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLEtBQUksQ0FBQyxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxJQUFHLENBQUMsQ0FBQyxHQUFFLEtBQUksR0FBRSxNQUFLLENBQUMsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsSUFBRyxHQUFHLEdBQUUsQ0FBQyxJQUFHLEdBQUcsR0FBRSxDQUFDLElBQUcsR0FBRyxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLE1BQUssR0FBRyxHQUFFLENBQUMsTUFBSyxHQUFHLEdBQUUsQ0FBQyxNQUFLLEdBQUcsR0FBRSxDQUFDLE1BQUssRUFBRSxHQUFFLENBQUMsTUFBSyxFQUFFLEdBQUUsQ0FBQyxNQUFLLEdBQUcsR0FBRSxDQUFDLE1BQUssR0FBRyxHQUFFLENBQUMsTUFBSyxJQUFJLEdBQUUsQ0FBQyxNQUFLLElBQUksR0FBRSxDQUFDLEtBQUksSUFBSSxHQUFFLENBQUMsS0FBSSxJQUFJLEdBQUUsQ0FBQyxJQUFHLElBQUksR0FBRSxDQUFDLElBQUcsSUFBSSxHQUFFLENBQUMsS0FBSSxJQUFJLEdBQUUsQ0FBQyxLQUFJLElBQUksR0FBRSxDQUFDLEtBQUksSUFBSSxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLEtBQUksRUFBRSxHQUFFLENBQUMsS0FBSSxFQUFFLEdBQUUsQ0FBQyxJQUFHLEVBQUUsR0FBRSxDQUFDLElBQUcsRUFBRSxHQUFFLENBQUMsS0FBSSxFQUFFLEdBQUUsQ0FBQyxLQUFJLEVBQUUsR0FBRSxDQUFDLEtBQUksRUFBRSxHQUFFLENBQUMsS0FBSSxDQUFDLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLElBQUcsR0FBRyxHQUFFLENBQUMsSUFBRyxHQUFHLEdBQUUsQ0FBQyxJQUFHLEdBQUcsR0FBRSxDQUFDLElBQUcsRUFBRSxHQUFFLENBQUMsSUFBRyxHQUFHLEdBQUUsQ0FBQyxJQUFHLEdBQUcsR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsS0FBSSxHQUFHLENBQUMsRUFBQztBQUFBLElBQ3R3QixRQUFRLEVBQUMsT0FBTSxJQUFHLEtBQUksTUFBSyxNQUFLLE1BQUssS0FBSSxJQUFHLFFBQU8sQ0FBQyxDQUFDLE1BQUssR0FBRyxHQUFFLENBQUMsTUFBSyxHQUFHLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLElBQUcsR0FBRyxHQUFFLENBQUMsS0FBSSxFQUFFLEdBQUUsQ0FBQyxJQUFHLElBQUksR0FBRSxDQUFDLElBQUcsSUFBSSxDQUFDLEdBQUUsS0FBSSxHQUFFLE1BQUssQ0FBQyxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxJQUFHLEdBQUcsR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsTUFBSyxFQUFFLEdBQUUsQ0FBQyxLQUFJLElBQUksR0FBRSxDQUFDLEtBQUksSUFBSSxDQUFDLEVBQUM7QUFBQSxJQUM5TSxRQUFRLEVBQUMsT0FBTSxJQUFHLEtBQUksTUFBSyxNQUFLLE1BQUssS0FBSSxNQUFLLFFBQU8sQ0FBQyxDQUFDLE1BQUssSUFBSSxHQUFFLENBQUMsTUFBSyxJQUFJLEdBQUUsQ0FBQyxNQUFLLElBQUksR0FBRSxDQUFDLE1BQUssSUFBSSxHQUFFLENBQUMsTUFBSyxJQUFJLEdBQUUsQ0FBQyxLQUFJLElBQUksR0FBRSxDQUFDLEtBQUksSUFBSSxHQUFFLENBQUMsSUFBRyxJQUFJLEdBQUUsQ0FBQyxLQUFJLElBQUksR0FBRSxDQUFDLEtBQUksSUFBSSxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLElBQUcsR0FBRyxHQUFFLENBQUMsSUFBRyxHQUFHLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLEtBQUksR0FBRyxDQUFDLEdBQUUsS0FBSSxHQUFFLE1BQUssQ0FBQyxDQUFDLEtBQUksSUFBSSxHQUFFLENBQUMsS0FBSSxJQUFJLEdBQUUsQ0FBQyxJQUFHLElBQUksR0FBRSxDQUFDLEdBQUUsSUFBSSxHQUFFLENBQUMsR0FBRSxJQUFJLEdBQUUsQ0FBQyxJQUFHLElBQUksR0FBRSxDQUFDLEtBQUksSUFBSSxHQUFFLENBQUMsTUFBSyxJQUFJLEdBQUUsQ0FBQyxNQUFLLEdBQUcsR0FBRSxDQUFDLEdBQUUsR0FBRyxHQUFFLENBQUMsSUFBRyxFQUFFLENBQUMsRUFBQztBQUFBLElBQzdWLFFBQVEsRUFBQyxPQUFNLElBQUcsS0FBSSxNQUFLLE1BQUssTUFBSyxLQUFJLE1BQUssUUFBTyxDQUFDLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLElBQUcsR0FBRyxHQUFFLENBQUMsSUFBRyxHQUFHLEdBQUUsQ0FBQyxJQUFHLEVBQUUsR0FBRSxDQUFDLEtBQUksRUFBRSxHQUFFLENBQUMsS0FBSSxFQUFFLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLEtBQUksSUFBSSxHQUFFLENBQUMsS0FBSSxJQUFJLENBQUMsR0FBRSxLQUFJLEdBQUUsTUFBSyxDQUFDLENBQUMsSUFBRyxHQUFHLEdBQUUsQ0FBQyxJQUFHLEdBQUcsR0FBRSxDQUFDLEdBQUUsR0FBRyxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxLQUFJLEVBQUUsR0FBRSxDQUFDLE1BQUssRUFBRSxHQUFFLENBQUMsTUFBSyxFQUFFLEdBQUUsQ0FBQyxNQUFLLEdBQUcsR0FBRSxDQUFDLE1BQUssSUFBSSxHQUFFLENBQUMsTUFBSyxJQUFJLENBQUMsRUFBQztBQUFBLElBQ3ZRLFFBQVEsRUFBQyxPQUFNLElBQUcsS0FBSSxLQUFJLE1BQUssTUFBSyxLQUFJLElBQUcsUUFBTyxDQUFDLENBQUMsR0FBRSxHQUFHLEdBQUUsQ0FBQyxJQUFHLEdBQUcsR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxLQUFJLEVBQUUsR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsSUFBRyxJQUFJLENBQUMsR0FBRSxLQUFJLEdBQUUsTUFBSyxDQUFDLENBQUMsR0FBRSxHQUFHLEdBQUUsQ0FBQyxHQUFFLEdBQUcsR0FBRSxDQUFDLElBQUcsR0FBRyxHQUFFLENBQUMsSUFBRyxHQUFHLEdBQUUsQ0FBQyxJQUFHLEVBQUUsR0FBRSxDQUFDLElBQUcsR0FBRyxHQUFFLENBQUMsS0FBSSxJQUFJLEdBQUUsQ0FBQyxJQUFHLElBQUksQ0FBQyxFQUFDO0FBQUEsSUFDMU0sUUFBUSxFQUFDLE9BQU0sSUFBRyxLQUFJLE1BQUssTUFBSyxNQUFLLEtBQUksTUFBSyxRQUFPLENBQUMsQ0FBQyxNQUFLLEdBQUcsR0FBRSxDQUFDLE1BQUssR0FBRyxHQUFFLENBQUMsTUFBSyxFQUFFLEdBQUUsQ0FBQyxNQUFLLEdBQUcsR0FBRSxDQUFDLE1BQUssSUFBSSxHQUFFLENBQUMsS0FBSSxJQUFJLEdBQUUsQ0FBQyxLQUFJLENBQUMsR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsSUFBRyxHQUFHLEdBQUUsQ0FBQyxJQUFHLEVBQUUsR0FBRSxDQUFDLElBQUcsR0FBRyxHQUFFLENBQUMsS0FBSSxJQUFJLEdBQUUsQ0FBQyxLQUFJLElBQUksR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsS0FBSSxFQUFFLEdBQUUsQ0FBQyxLQUFJLEdBQUcsQ0FBQyxHQUFFLEtBQUksR0FBRSxNQUFLLENBQUMsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsS0FBSSxFQUFFLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLEtBQUksSUFBSSxHQUFFLENBQUMsSUFBRyxJQUFJLEdBQUUsQ0FBQyxJQUFHLENBQUMsR0FBRSxDQUFDLElBQUcsR0FBRyxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxLQUFJLEVBQUUsR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsTUFBSyxJQUFJLEdBQUUsQ0FBQyxNQUFLLElBQUksR0FBRSxDQUFDLE1BQUssR0FBRyxHQUFFLENBQUMsTUFBSyxFQUFFLEdBQUUsQ0FBQyxNQUFLLEdBQUcsQ0FBQyxFQUFDO0FBQUEsSUFDclksUUFBUSxFQUFDLE9BQU0sSUFBRyxLQUFJLE1BQUssTUFBSyxNQUFLLEtBQUksTUFBSyxRQUFPLENBQUMsQ0FBQyxNQUFLLElBQUksR0FBRSxDQUFDLE1BQUssSUFBSSxHQUFFLENBQUMsTUFBSyxJQUFJLEdBQUUsQ0FBQyxLQUFJLElBQUksR0FBRSxDQUFDLEtBQUksSUFBSSxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxLQUFJLENBQUMsR0FBRSxDQUFDLEtBQUksRUFBRSxHQUFFLENBQUMsSUFBRyxHQUFHLEdBQUUsQ0FBQyxJQUFHLEdBQUcsR0FBRSxDQUFDLElBQUcsR0FBRyxHQUFFLENBQUMsSUFBRyxHQUFHLEdBQUUsQ0FBQyxLQUFJLEVBQUUsR0FBRSxDQUFDLE1BQUssR0FBRyxHQUFFLENBQUMsTUFBSyxHQUFHLENBQUMsR0FBRSxLQUFJLEdBQUUsTUFBSyxDQUFDLENBQUMsS0FBSSxJQUFJLEdBQUUsQ0FBQyxLQUFJLElBQUksR0FBRSxDQUFDLEtBQUksSUFBSSxHQUFFLENBQUMsSUFBRyxJQUFJLEdBQUUsQ0FBQyxNQUFLLElBQUksR0FBRSxDQUFDLE1BQUssR0FBRyxHQUFFLENBQUMsTUFBSyxDQUFDLEdBQUUsQ0FBQyxNQUFLLEVBQUUsR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLEdBQUUsR0FBRyxHQUFFLENBQUMsSUFBRyxFQUFFLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLEtBQUksR0FBRyxDQUFDLEVBQUM7QUFBQSxJQUNsWCxRQUFRLEVBQUMsT0FBTSxJQUFHLEtBQUksS0FBSSxNQUFLLE1BQUssS0FBSSxNQUFLLFFBQU8sQ0FBQyxDQUFDLEdBQUUsRUFBRSxHQUFFLENBQUMsR0FBRSxFQUFFLEdBQUUsQ0FBQyxJQUFHLEVBQUUsR0FBRSxDQUFDLElBQUcsRUFBRSxHQUFFLENBQUMsS0FBSSxFQUFFLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLEtBQUksSUFBSSxDQUFDLEdBQUUsS0FBSSxHQUFFLE1BQUssQ0FBQyxDQUFDLEdBQUUsRUFBRSxHQUFFLENBQUMsR0FBRSxFQUFFLEdBQUUsQ0FBQyxJQUFHLEVBQUUsR0FBRSxDQUFDLEtBQUksRUFBRSxHQUFFLENBQUMsS0FBSSxFQUFFLEdBQUUsQ0FBQyxLQUFJLEVBQUUsR0FBRSxDQUFDLEtBQUksRUFBRSxHQUFFLENBQUMsTUFBSyxFQUFFLEdBQUUsQ0FBQyxNQUFLLEVBQUUsR0FBRSxDQUFDLE1BQUssR0FBRyxHQUFFLENBQUMsTUFBSyxHQUFHLEdBQUUsQ0FBQyxNQUFLLElBQUksR0FBRSxDQUFDLE1BQUssSUFBSSxDQUFDLEVBQUM7QUFBQSxJQUMxUCxRQUFRLEVBQUMsT0FBTSxJQUFHLEtBQUksTUFBSyxNQUFLLE1BQUssS0FBSSxNQUFLLFFBQU8sQ0FBQyxDQUFDLE1BQUssR0FBRyxHQUFFLENBQUMsTUFBSyxHQUFHLEdBQUUsQ0FBQyxNQUFLLEdBQUcsR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsSUFBRyxHQUFHLEdBQUUsQ0FBQyxLQUFJLEVBQUUsR0FBRSxDQUFDLEtBQUksRUFBRSxHQUFFLENBQUMsSUFBRyxHQUFHLEdBQUUsQ0FBQyxLQUFJLEVBQUUsR0FBRSxDQUFDLE1BQUssR0FBRyxHQUFFLENBQUMsTUFBSyxHQUFHLEdBQUUsQ0FBQyxLQUFJLElBQUksR0FBRSxDQUFDLElBQUcsSUFBSSxHQUFFLENBQUMsS0FBSSxJQUFJLENBQUMsR0FBRSxLQUFJLEdBQUUsTUFBSyxDQUFDLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsSUFBRyxHQUFHLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLE1BQUssRUFBRSxHQUFFLENBQUMsTUFBSyxFQUFFLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLElBQUcsRUFBRSxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLElBQUcsSUFBSSxHQUFFLENBQUMsS0FBSSxJQUFJLEdBQUUsQ0FBQyxNQUFLLElBQUksQ0FBQyxFQUFDO0FBQUEsSUFDN1YsUUFBUSxFQUFDLE9BQU0sSUFBRyxLQUFJLE1BQUssTUFBSyxNQUFLLEtBQUksTUFBSyxRQUFPLENBQUMsQ0FBQyxNQUFLLEdBQUcsR0FBRSxDQUFDLE1BQUssR0FBRyxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxJQUFHLEVBQUUsR0FBRSxDQUFDLEdBQUUsQ0FBQyxDQUFDLEdBQUUsS0FBSSxHQUFFLE1BQUssQ0FBQyxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLElBQUcsR0FBRyxHQUFFLENBQUMsSUFBRyxFQUFFLEdBQUUsQ0FBQyxJQUFHLEVBQUUsR0FBRSxDQUFDLEdBQUUsRUFBRSxDQUFDLEVBQUM7QUFBQSxJQUM3TSxRQUFRLEVBQUMsT0FBTSxJQUFHLEtBQUksTUFBSyxNQUFLLE1BQUssS0FBSSxNQUFLLFFBQU8sQ0FBQyxDQUFDLE1BQUssR0FBRyxHQUFFLENBQUMsTUFBSyxHQUFHLEdBQUUsQ0FBQyxNQUFLLEdBQUcsR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsSUFBRyxHQUFHLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLElBQUcsRUFBRSxHQUFFLENBQUMsSUFBRyxFQUFFLEdBQUUsQ0FBQyxNQUFLLEVBQUUsR0FBRSxDQUFDLE1BQUssQ0FBQyxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxJQUFHLElBQUksR0FBRSxDQUFDLEtBQUksSUFBSSxDQUFDLEdBQUUsS0FBSSxHQUFFLE1BQUssQ0FBQyxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLElBQUcsR0FBRyxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxNQUFLLEdBQUcsR0FBRSxDQUFDLEtBQUksRUFBRSxHQUFFLENBQUMsR0FBRSxFQUFFLEdBQUUsQ0FBQyxLQUFJLEVBQUUsR0FBRSxDQUFDLEtBQUksQ0FBQyxHQUFFLENBQUMsSUFBRyxHQUFHLEdBQUUsQ0FBQyxLQUFJLElBQUksR0FBRSxDQUFDLE1BQUssSUFBSSxDQUFDLEVBQUM7QUFBQSxJQUNoVSxPQUFPLEVBQUMsT0FBTSxJQUFHLEtBQUksTUFBSyxNQUFLLE1BQUssS0FBSSxJQUFHLFFBQU8sQ0FBQyxDQUFDLE1BQUssRUFBRSxHQUFFLENBQUMsTUFBSyxFQUFFLEdBQUUsQ0FBQyxLQUFJLENBQUMsR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsTUFBSyxHQUFHLEdBQUUsQ0FBQyxNQUFLLElBQUksR0FBRSxDQUFDLEtBQUksSUFBSSxHQUFFLENBQUMsS0FBSSxJQUFJLEdBQUUsQ0FBQyxLQUFJLElBQUksQ0FBQyxFQUFDO0FBQUEsSUFDakosT0FBTyxFQUFDLE9BQU0sR0FBRSxLQUFJLE1BQUssTUFBSyxNQUFLLEtBQUksTUFBSyxRQUFPLENBQUMsQ0FBQyxNQUFLLEVBQUUsR0FBRSxDQUFDLE1BQUssRUFBRSxHQUFFLENBQUMsTUFBSyxFQUFFLEdBQUUsQ0FBQyxNQUFLLEdBQUcsR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsSUFBRyxHQUFHLEdBQUUsQ0FBQyxLQUFJLEdBQUcsQ0FBQyxHQUFFLEtBQUksR0FBRSxNQUFLLENBQUMsQ0FBQyxLQUFJLEVBQUUsR0FBRSxDQUFDLEtBQUksRUFBRSxHQUFFLENBQUMsS0FBSSxFQUFFLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLElBQUcsR0FBRyxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxNQUFLLEdBQUcsQ0FBQyxFQUFDO0FBQUEsSUFDMU0sT0FBTyxFQUFDLE9BQU0sSUFBRyxLQUFJLE1BQUssTUFBSyxNQUFLLEtBQUksTUFBSyxRQUFPLENBQUMsQ0FBQyxNQUFLLEdBQUcsR0FBRSxDQUFDLE1BQUssRUFBRSxHQUFFLENBQUMsTUFBSyxFQUFFLEdBQUUsQ0FBQyxLQUFJLEVBQUUsR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxLQUFJLEVBQUUsR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsS0FBSSxJQUFJLENBQUMsR0FBRSxLQUFJLEdBQUUsTUFBSyxDQUFDLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxLQUFJLEVBQUUsR0FBRSxDQUFDLEtBQUksRUFBRSxHQUFFLENBQUMsSUFBRyxFQUFFLEdBQUUsQ0FBQyxNQUFLLEdBQUcsR0FBRSxDQUFDLE1BQUssR0FBRyxHQUFFLENBQUMsTUFBSyxFQUFFLEdBQUUsQ0FBQyxNQUFLLEdBQUcsR0FBRSxDQUFDLE1BQUssSUFBSSxDQUFDLEVBQUM7QUFBQSxJQUN2UCxPQUFPLEVBQUMsT0FBTSxJQUFHLEtBQUksTUFBSyxNQUFLLE1BQUssS0FBSSxNQUFLLFFBQU8sQ0FBQyxDQUFDLE1BQUssSUFBSSxHQUFFLENBQUMsTUFBSyxJQUFJLEdBQUUsQ0FBQyxNQUFLLElBQUksR0FBRSxDQUFDLEtBQUksSUFBSSxHQUFFLENBQUMsS0FBSSxJQUFJLEdBQUUsQ0FBQyxJQUFHLEdBQUcsR0FBRSxDQUFDLElBQUcsR0FBRyxHQUFFLENBQUMsS0FBSSxHQUFHLENBQUMsR0FBRSxLQUFJLEdBQUUsTUFBSyxDQUFDLENBQUMsS0FBSSxJQUFJLEdBQUUsQ0FBQyxLQUFJLElBQUksR0FBRSxDQUFDLEtBQUksSUFBSSxHQUFFLENBQUMsSUFBRyxJQUFJLEdBQUUsQ0FBQyxJQUFHLElBQUksR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxNQUFLLEdBQUcsQ0FBQyxFQUFDO0FBQUEsSUFDNU8sT0FBTyxFQUFDLE9BQU0sSUFBRyxLQUFJLE1BQUssTUFBSyxLQUFJLEtBQUksTUFBSyxRQUFPLENBQUMsQ0FBQyxNQUFLLElBQUksR0FBRSxDQUFDLE1BQUssSUFBSSxHQUFFLENBQUMsTUFBSyxJQUFJLEdBQUUsQ0FBQyxNQUFLLElBQUksR0FBRSxDQUFDLE1BQUssSUFBSSxHQUFFLENBQUMsS0FBSSxJQUFJLEdBQUUsQ0FBQyxLQUFJLElBQUksR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLElBQUcsR0FBRyxHQUFFLENBQUMsSUFBRyxHQUFHLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLEtBQUksQ0FBQyxHQUFFLENBQUMsS0FBSSxFQUFFLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLElBQUcsR0FBRyxHQUFFLENBQUMsSUFBRyxHQUFHLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLE1BQUssRUFBRSxHQUFFLENBQUMsTUFBSyxFQUFFLEdBQUUsQ0FBQyxNQUFLLEVBQUUsQ0FBQyxHQUFFLEtBQUksR0FBRSxNQUFLLENBQUMsQ0FBQyxLQUFJLElBQUksR0FBRSxDQUFDLEtBQUksSUFBSSxHQUFFLENBQUMsS0FBSSxJQUFJLEdBQUUsQ0FBQyxLQUFJLElBQUksR0FBRSxDQUFDLElBQUcsSUFBSSxHQUFFLENBQUMsSUFBRyxJQUFJLEdBQUUsQ0FBQyxJQUFHLEdBQUcsR0FBRSxDQUFDLEdBQUUsR0FBRyxHQUFFLENBQUMsSUFBRyxHQUFHLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsTUFBSyxHQUFHLEdBQUUsQ0FBQyxNQUFLLEdBQUcsR0FBRSxDQUFDLE1BQUssRUFBRSxHQUFFLENBQUMsTUFBSyxFQUFFLEdBQUUsQ0FBQyxLQUFJLEVBQUUsR0FBRSxDQUFDLEtBQUksRUFBRSxHQUFFLENBQUMsR0FBRSxFQUFFLEdBQUUsQ0FBQyxJQUFHLEVBQUUsR0FBRSxDQUFDLEtBQUksRUFBRSxHQUFFLENBQUMsS0FBSSxFQUFFLENBQUMsRUFBQztBQUFBLElBQzdlLE9BQU8sRUFBQyxPQUFNLEdBQUUsS0FBSSxNQUFLLE1BQUssTUFBSyxLQUFJLE1BQUssUUFBTyxDQUFDLENBQUMsTUFBSyxHQUFHLEdBQUUsQ0FBQyxNQUFLLEdBQUcsR0FBRSxDQUFDLE1BQUssR0FBRyxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLEtBQUksR0FBRyxDQUFDLEVBQUM7QUFBQSxJQUNuSCxPQUFPLEVBQUMsT0FBTSxJQUFHLEtBQUksTUFBSyxNQUFLLEtBQUksS0FBSSxNQUFLLFFBQU8sQ0FBQyxDQUFDLE1BQUssRUFBRSxHQUFFLENBQUMsTUFBSyxFQUFFLEdBQUUsQ0FBQyxNQUFLLEVBQUUsR0FBRSxDQUFDLE1BQUssRUFBRSxHQUFFLENBQUMsTUFBSyxFQUFFLEdBQUUsQ0FBQyxNQUFLLEVBQUUsR0FBRSxDQUFDLEtBQUksRUFBRSxHQUFFLENBQUMsS0FBSSxFQUFFLEdBQUUsQ0FBQyxLQUFJLEVBQUUsR0FBRSxDQUFDLEtBQUksRUFBRSxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsS0FBSSxJQUFJLEdBQUUsQ0FBQyxLQUFJLElBQUksR0FBRSxDQUFDLElBQUcsSUFBSSxHQUFFLENBQUMsSUFBRyxJQUFJLEdBQUUsQ0FBQyxJQUFHLElBQUksR0FBRSxDQUFDLEtBQUksSUFBSSxHQUFFLENBQUMsS0FBSSxJQUFJLEdBQUUsQ0FBQyxLQUFJLElBQUksQ0FBQyxHQUFFLEtBQUksR0FBRSxNQUFLLENBQUMsQ0FBQyxLQUFJLEVBQUUsR0FBRSxDQUFDLEtBQUksRUFBRSxHQUFFLENBQUMsS0FBSSxFQUFFLEdBQUUsQ0FBQyxJQUFHLEVBQUUsR0FBRSxDQUFDLElBQUcsRUFBRSxHQUFFLENBQUMsSUFBRyxHQUFHLEdBQUUsQ0FBQyxJQUFHLEdBQUcsR0FBRSxDQUFDLElBQUcsSUFBSSxHQUFFLENBQUMsS0FBSSxJQUFJLEdBQUUsQ0FBQyxNQUFLLElBQUksR0FBRSxDQUFDLE1BQUssSUFBSSxDQUFDLEVBQUM7QUFBQSxJQUM5WCxPQUFPLEVBQUMsT0FBTSxJQUFHLEtBQUksTUFBSyxNQUFLLE1BQUssS0FBSSxNQUFLLFFBQU8sQ0FBQyxDQUFDLE1BQUssSUFBSSxHQUFFLENBQUMsTUFBSyxJQUFJLEdBQUUsQ0FBQyxNQUFLLElBQUksR0FBRSxDQUFDLE1BQUssSUFBSSxHQUFFLENBQUMsS0FBSSxJQUFJLEdBQUUsQ0FBQyxLQUFJLElBQUksR0FBRSxDQUFDLEtBQUksSUFBSSxDQUFDLEVBQUM7QUFBQSxJQUN0SSxPQUFPLEVBQUMsT0FBTSxJQUFHLEtBQUksTUFBSyxNQUFLLE1BQUssS0FBSSxNQUFLLFFBQU8sQ0FBQyxDQUFDLEdBQUUsR0FBRyxHQUFFLENBQUMsSUFBRyxHQUFHLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLE1BQUssR0FBRyxHQUFFLENBQUMsTUFBSyxFQUFFLEdBQUUsQ0FBQyxNQUFLLEdBQUcsR0FBRSxDQUFDLE1BQUssSUFBSSxHQUFFLENBQUMsTUFBSyxJQUFJLENBQUMsR0FBRSxLQUFJLEdBQUUsTUFBSyxDQUFDLENBQUMsR0FBRSxHQUFHLEdBQUUsQ0FBQyxHQUFFLEdBQUcsR0FBRSxDQUFDLElBQUcsR0FBRyxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxLQUFJLEVBQUUsR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsS0FBSSxJQUFJLEdBQUUsQ0FBQyxLQUFJLElBQUksQ0FBQyxFQUFDO0FBQUEsSUFDak8sUUFBUSxFQUFDLE9BQU0sSUFBRyxLQUFJLE1BQUssTUFBSyxNQUFLLEtBQUksSUFBRyxRQUFPLENBQUMsQ0FBQyxLQUFJLElBQUksR0FBRSxDQUFDLEtBQUksSUFBSSxHQUFFLENBQUMsS0FBSSxJQUFJLEdBQUUsQ0FBQyxJQUFHLElBQUksR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsTUFBSyxDQUFDLEdBQUUsQ0FBQyxNQUFLLEVBQUUsR0FBRSxDQUFDLE1BQUssR0FBRyxHQUFFLENBQUMsTUFBSyxHQUFHLENBQUMsR0FBRSxLQUFJLEdBQUUsTUFBSyxDQUFDLENBQUMsTUFBSyxJQUFJLEdBQUUsQ0FBQyxNQUFLLElBQUksR0FBRSxDQUFDLE1BQUssSUFBSSxHQUFFLENBQUMsTUFBSyxJQUFJLEdBQUUsQ0FBQyxNQUFLLElBQUksR0FBRSxDQUFDLE1BQUssSUFBSSxHQUFFLENBQUMsS0FBSSxJQUFJLEdBQUUsQ0FBQyxJQUFHLElBQUksR0FBRSxDQUFDLElBQUcsR0FBRyxHQUFFLENBQUMsS0FBSSxFQUFFLEdBQUUsQ0FBQyxLQUFJLEVBQUUsR0FBRSxDQUFDLEtBQUksRUFBRSxHQUFFLENBQUMsS0FBSSxFQUFFLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLEtBQUksR0FBRyxDQUFDLEVBQUM7QUFBQSxJQUM3VCxRQUFRLEVBQUMsT0FBTSxJQUFHLEtBQUksTUFBSyxNQUFLLE1BQUssS0FBSSxNQUFLLFFBQU8sQ0FBQyxDQUFDLEdBQUUsR0FBRyxHQUFFLENBQUMsR0FBRSxHQUFHLEdBQUUsQ0FBQyxHQUFFLEdBQUcsR0FBRSxDQUFDLElBQUcsR0FBRyxHQUFFLENBQUMsSUFBRyxHQUFHLEdBQUUsQ0FBQyxJQUFHLEdBQUcsR0FBRSxDQUFDLElBQUcsR0FBRyxHQUFFLENBQUMsSUFBRyxHQUFHLEdBQUUsQ0FBQyxLQUFJLEVBQUUsR0FBRSxDQUFDLEtBQUksRUFBRSxHQUFFLENBQUMsS0FBSSxFQUFFLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLEtBQUksSUFBSSxHQUFFLENBQUMsS0FBSSxJQUFJLENBQUMsR0FBRSxLQUFJLEdBQUUsTUFBSyxDQUFDLENBQUMsR0FBRSxHQUFHLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsTUFBSyxFQUFFLEdBQUUsQ0FBQyxNQUFLLEdBQUcsR0FBRSxDQUFDLE1BQUssSUFBSSxDQUFDLEVBQUM7QUFBQSxJQUNoUSxRQUFRLEVBQUMsT0FBTSxJQUFHLEtBQUksTUFBSyxNQUFLLE1BQUssS0FBSSxNQUFLLFFBQU8sQ0FBQyxDQUFDLE1BQUssR0FBRyxHQUFFLENBQUMsTUFBSyxHQUFHLEdBQUUsQ0FBQyxNQUFLLEdBQUcsR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsSUFBRyxHQUFHLEdBQUUsQ0FBQyxLQUFJLEVBQUUsR0FBRSxDQUFDLEtBQUksQ0FBQyxHQUFFLENBQUMsSUFBRyxDQUFDLEdBQUUsQ0FBQyxJQUFHLEVBQUUsR0FBRSxDQUFDLE1BQUssRUFBRSxHQUFFLENBQUMsTUFBSyxHQUFHLEdBQUUsQ0FBQyxNQUFLLElBQUksR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsSUFBRyxJQUFJLEdBQUUsQ0FBQyxLQUFJLElBQUksR0FBRSxDQUFDLEtBQUksSUFBSSxDQUFDLEdBQUUsS0FBSSxHQUFFLE1BQUssQ0FBQyxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLElBQUcsR0FBRyxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxNQUFLLEVBQUUsR0FBRSxDQUFDLE1BQUssQ0FBQyxHQUFFLENBQUMsS0FBSSxDQUFDLEdBQUUsQ0FBQyxLQUFJLEVBQUUsR0FBRSxDQUFDLEtBQUksRUFBRSxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxLQUFJLElBQUksR0FBRSxDQUFDLElBQUcsR0FBRyxHQUFFLENBQUMsS0FBSSxJQUFJLEdBQUUsQ0FBQyxNQUFLLElBQUksR0FBRSxDQUFDLE1BQUssSUFBSSxDQUFDLEVBQUM7QUFBQSxJQUNqWSxRQUFRLEVBQUMsT0FBTSxJQUFHLEtBQUksTUFBSyxNQUFLLE1BQUssS0FBSSxNQUFLLFFBQU8sQ0FBQyxDQUFDLE1BQUssSUFBSSxHQUFFLENBQUMsTUFBSyxJQUFJLEdBQUUsQ0FBQyxNQUFLLElBQUksR0FBRSxDQUFDLEtBQUksSUFBSSxHQUFFLENBQUMsS0FBSSxJQUFJLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsS0FBSSxJQUFJLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLElBQUcsRUFBRSxHQUFFLENBQUMsSUFBRyxFQUFFLEdBQUUsQ0FBQyxLQUFJLENBQUMsR0FBRSxDQUFDLEtBQUksQ0FBQyxDQUFDLEdBQUUsS0FBSSxHQUFFLE1BQUssQ0FBQyxDQUFDLEtBQUksSUFBSSxHQUFFLENBQUMsS0FBSSxJQUFJLEdBQUUsQ0FBQyxLQUFJLElBQUksR0FBRSxDQUFDLElBQUcsSUFBSSxHQUFFLENBQUMsSUFBRyxJQUFJLEdBQUUsQ0FBQyxJQUFHLEdBQUcsR0FBRSxDQUFDLElBQUcsR0FBRyxHQUFFLENBQUMsSUFBRyxJQUFJLEdBQUUsQ0FBQyxJQUFHLEdBQUcsR0FBRSxDQUFDLEdBQUUsRUFBRSxHQUFFLENBQUMsS0FBSSxFQUFFLEdBQUUsQ0FBQyxNQUFLLEVBQUUsR0FBRSxDQUFDLE1BQUssQ0FBQyxDQUFDLEVBQUM7QUFBQSxJQUNuVSxRQUFRLEVBQUMsT0FBTSxJQUFHLEtBQUksTUFBSyxNQUFLLE1BQUssS0FBSSxNQUFLLFFBQU8sQ0FBQyxDQUFDLE1BQUssR0FBRyxHQUFFLENBQUMsTUFBSyxHQUFHLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLElBQUcsRUFBRSxHQUFFLENBQUMsSUFBRyxHQUFHLEdBQUUsQ0FBQyxJQUFHLElBQUksR0FBRSxDQUFDLElBQUcsSUFBSSxHQUFFLENBQUMsSUFBRyxJQUFJLENBQUMsR0FBRSxLQUFJLEdBQUUsTUFBSyxDQUFDLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsSUFBRyxHQUFHLEdBQUUsQ0FBQyxLQUFJLEVBQUUsR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsS0FBSSxJQUFJLENBQUMsRUFBQztBQUFBLElBQ3ZOLFFBQVEsRUFBQyxPQUFNLElBQUcsS0FBSSxNQUFLLE1BQUssTUFBSyxLQUFJLE1BQUssUUFBTyxDQUFDLENBQUMsTUFBSyxJQUFJLEdBQUUsQ0FBQyxNQUFLLElBQUksR0FBRSxDQUFDLE1BQUssSUFBSSxHQUFFLENBQUMsTUFBSyxJQUFJLEdBQUUsQ0FBQyxJQUFHLElBQUksR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsSUFBRyxHQUFHLEdBQUUsQ0FBQyxJQUFHLEdBQUcsR0FBRSxDQUFDLEtBQUksRUFBRSxHQUFFLENBQUMsS0FBSSxFQUFFLEdBQUUsQ0FBQyxNQUFLLEVBQUUsR0FBRSxDQUFDLE1BQUssRUFBRSxDQUFDLEdBQUUsS0FBSSxHQUFFLE1BQUssQ0FBQyxDQUFDLEtBQUksSUFBSSxHQUFFLENBQUMsS0FBSSxJQUFJLEdBQUUsQ0FBQyxLQUFJLElBQUksR0FBRSxDQUFDLEtBQUksSUFBSSxHQUFFLENBQUMsS0FBSSxJQUFJLEdBQUUsQ0FBQyxNQUFLLEdBQUcsR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsR0FBRSxHQUFHLEdBQUUsQ0FBQyxJQUFHLEVBQUUsR0FBRSxDQUFDLElBQUcsRUFBRSxHQUFFLENBQUMsS0FBSSxFQUFFLEdBQUUsQ0FBQyxLQUFJLEVBQUUsQ0FBQyxFQUFDO0FBQUEsSUFDclQsUUFBUSxFQUFDLE9BQU0sSUFBRyxLQUFJLE1BQUssTUFBSyxNQUFLLEtBQUksTUFBSyxRQUFPLENBQUMsQ0FBQyxNQUFLLElBQUksR0FBRSxDQUFDLE1BQUssSUFBSSxHQUFFLENBQUMsTUFBSyxJQUFJLEdBQUUsQ0FBQyxNQUFLLElBQUksR0FBRSxDQUFDLE1BQUssR0FBRyxHQUFFLENBQUMsTUFBSyxHQUFHLEdBQUUsQ0FBQyxNQUFLLEdBQUcsR0FBRSxDQUFDLE1BQUssSUFBSSxHQUFFLENBQUMsTUFBSyxHQUFHLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsS0FBSSxFQUFFLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLElBQUcsR0FBRyxHQUFFLENBQUMsS0FBSSxFQUFFLENBQUMsR0FBRSxLQUFJLEdBQUUsTUFBSyxDQUFDLENBQUMsS0FBSSxJQUFJLEdBQUUsQ0FBQyxLQUFJLElBQUksR0FBRSxDQUFDLEtBQUksSUFBSSxHQUFFLENBQUMsS0FBSSxJQUFJLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxLQUFJLElBQUksR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsSUFBRyxHQUFHLEdBQUUsQ0FBQyxJQUFHLEdBQUcsR0FBRSxDQUFDLElBQUcsRUFBRSxHQUFFLENBQUMsSUFBRyxHQUFHLEdBQUUsQ0FBQyxLQUFJLEVBQUUsR0FBRSxDQUFDLE1BQUssRUFBRSxDQUFDLEVBQUM7QUFBQSxJQUN6WCxRQUFRLEVBQUMsT0FBTSxJQUFHLEtBQUksTUFBSyxNQUFLLE1BQUssS0FBSSxNQUFLLFFBQU8sQ0FBQyxDQUFDLE1BQUssSUFBSSxHQUFFLENBQUMsTUFBSyxJQUFJLEdBQUUsQ0FBQyxNQUFLLElBQUksR0FBRSxDQUFDLE1BQUssSUFBSSxHQUFFLENBQUMsTUFBSyxJQUFJLEdBQUUsQ0FBQyxNQUFLLElBQUksR0FBRSxDQUFDLE1BQUssSUFBSSxHQUFFLENBQUMsTUFBSyxJQUFJLEdBQUUsQ0FBQyxNQUFLLElBQUksR0FBRSxDQUFDLE1BQUssSUFBSSxHQUFFLENBQUMsTUFBSyxJQUFJLEdBQUUsQ0FBQyxLQUFJLElBQUksR0FBRSxDQUFDLEtBQUksSUFBSSxHQUFFLENBQUMsS0FBSSxFQUFFLEdBQUUsQ0FBQyxJQUFHLEVBQUUsR0FBRSxDQUFDLEtBQUksRUFBRSxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxNQUFLLEVBQUUsR0FBRSxDQUFDLE1BQUssRUFBRSxHQUFFLENBQUMsTUFBSyxDQUFDLENBQUMsR0FBRSxLQUFJLEdBQUUsTUFBSyxDQUFDLENBQUMsS0FBSSxJQUFJLEdBQUUsQ0FBQyxLQUFJLElBQUksR0FBRSxDQUFDLEtBQUksSUFBSSxHQUFFLENBQUMsS0FBSSxJQUFJLEdBQUUsQ0FBQyxLQUFJLElBQUksR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsS0FBSSxJQUFJLEdBQUUsQ0FBQyxLQUFJLElBQUksR0FBRSxDQUFDLEdBQUUsSUFBSSxHQUFFLENBQUMsTUFBSyxHQUFHLEdBQUUsQ0FBQyxNQUFLLEdBQUcsR0FBRSxDQUFDLE1BQUssR0FBRyxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsS0FBSSxFQUFFLEdBQUUsQ0FBQyxLQUFJLEVBQUUsQ0FBQyxFQUFDO0FBQUEsSUFDL2MsUUFBUSxFQUFDLE9BQU0sSUFBRyxLQUFJLEtBQUksTUFBSyxLQUFJLEtBQUksTUFBSyxRQUFPLENBQUMsQ0FBQyxNQUFLLElBQUksR0FBRSxDQUFDLE1BQUssSUFBSSxHQUFFLENBQUMsTUFBSyxJQUFJLEdBQUUsQ0FBQyxNQUFLLElBQUksR0FBRSxDQUFDLEtBQUksSUFBSSxHQUFFLENBQUMsSUFBRyxHQUFHLEdBQUUsQ0FBQyxJQUFHLEdBQUcsR0FBRSxDQUFDLElBQUcsR0FBRyxHQUFFLENBQUMsSUFBRyxHQUFHLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsS0FBSSxFQUFFLEdBQUUsQ0FBQyxLQUFJLEVBQUUsQ0FBQyxHQUFFLEtBQUksR0FBRSxNQUFLLENBQUMsQ0FBQyxLQUFJLElBQUksR0FBRSxDQUFDLEtBQUksSUFBSSxHQUFFLENBQUMsS0FBSSxJQUFJLEdBQUUsQ0FBQyxLQUFJLElBQUksR0FBRSxDQUFDLElBQUcsSUFBSSxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxNQUFLLEdBQUcsR0FBRSxDQUFDLE1BQUssR0FBRyxHQUFFLENBQUMsTUFBSyxFQUFFLEdBQUUsQ0FBQyxNQUFLLEVBQUUsQ0FBQyxFQUFDO0FBQUEsSUFDOVUsUUFBUSxFQUFDLE9BQU0sSUFBRyxLQUFJLE1BQUssTUFBSyxNQUFLLEtBQUksTUFBSyxRQUFPLENBQUMsQ0FBQyxNQUFLLElBQUksR0FBRSxDQUFDLE1BQUssSUFBSSxHQUFFLENBQUMsS0FBSSxJQUFJLEdBQUUsQ0FBQyxLQUFJLElBQUksR0FBRSxDQUFDLEtBQUksSUFBSSxHQUFFLENBQUMsSUFBRyxHQUFHLEdBQUUsQ0FBQyxJQUFHLEdBQUcsR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsTUFBSyxDQUFDLEdBQUUsQ0FBQyxNQUFLLEdBQUcsR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsS0FBSSxFQUFFLEdBQUUsQ0FBQyxLQUFJLEVBQUUsQ0FBQyxHQUFFLEtBQUksR0FBRSxNQUFLLENBQUMsQ0FBQyxLQUFJLElBQUksR0FBRSxDQUFDLEtBQUksSUFBSSxHQUFFLENBQUMsSUFBRyxJQUFJLEdBQUUsQ0FBQyxNQUFLLElBQUksR0FBRSxDQUFDLE1BQUssSUFBSSxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLElBQUcsR0FBRyxHQUFFLENBQUMsS0FBSSxDQUFDLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLElBQUcsR0FBRyxHQUFFLENBQUMsTUFBSyxFQUFFLEdBQUUsQ0FBQyxNQUFLLEVBQUUsQ0FBQyxFQUFDO0FBQUEsSUFDNVUsUUFBUSxFQUFDLE9BQU0sSUFBRyxLQUFJLEtBQUksTUFBSyxLQUFJLEtBQUksTUFBSyxRQUFPLENBQUMsQ0FBQyxNQUFLLEdBQUcsR0FBRSxDQUFDLE1BQUssR0FBRyxHQUFFLENBQUMsTUFBSyxHQUFHLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLElBQUcsR0FBRyxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxLQUFJLEVBQUUsR0FBRSxDQUFDLElBQUcsRUFBRSxHQUFFLENBQUMsSUFBRyxFQUFFLEdBQUUsQ0FBQyxNQUFLLEVBQUUsR0FBRSxDQUFDLE1BQUssRUFBRSxHQUFFLENBQUMsTUFBSyxDQUFDLEdBQUUsQ0FBQyxNQUFLLEVBQUUsR0FBRSxDQUFDLE1BQUssR0FBRyxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxJQUFHLEdBQUcsR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsS0FBSSxJQUFJLEdBQUUsQ0FBQyxLQUFJLElBQUksQ0FBQyxHQUFFLEtBQUksR0FBRSxNQUFLLENBQUMsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxJQUFHLEdBQUcsR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsTUFBSyxHQUFHLEdBQUUsQ0FBQyxNQUFLLEVBQUUsR0FBRSxDQUFDLEtBQUksRUFBRSxHQUFFLENBQUMsR0FBRSxFQUFFLEdBQUUsQ0FBQyxLQUFJLEVBQUUsR0FBRSxDQUFDLEtBQUksRUFBRSxHQUFFLENBQUMsS0FBSSxDQUFDLEdBQUUsQ0FBQyxLQUFJLEVBQUUsR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsSUFBRyxHQUFHLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLE1BQUssR0FBRyxHQUFFLENBQUMsTUFBSyxJQUFJLEdBQUUsQ0FBQyxNQUFLLElBQUksQ0FBQyxFQUFDO0FBQUEsSUFDdGIsT0FBTyxFQUFDLE9BQU0sSUFBRyxLQUFJLE1BQUssTUFBSyxNQUFLLEtBQUksTUFBSyxRQUFPLENBQUMsQ0FBQyxNQUFLLEVBQUUsR0FBRSxDQUFDLE1BQUssRUFBRSxHQUFFLENBQUMsS0FBSSxFQUFFLEdBQUUsQ0FBQyxJQUFHLEVBQUUsR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsS0FBSSxJQUFJLEdBQUUsQ0FBQyxLQUFJLElBQUksQ0FBQyxFQUFDO0FBQUEsSUFDMUgsT0FBTyxFQUFDLE9BQU0sSUFBRyxLQUFJLE1BQUssTUFBSyxNQUFLLEtBQUksTUFBSyxRQUFPLENBQUMsQ0FBQyxNQUFLLElBQUksR0FBRSxDQUFDLE1BQUssSUFBSSxHQUFFLENBQUMsTUFBSyxJQUFJLEdBQUUsQ0FBQyxNQUFLLElBQUksR0FBRSxDQUFDLE1BQUssSUFBSSxHQUFFLENBQUMsTUFBSyxHQUFHLEdBQUUsQ0FBQyxNQUFLLEVBQUUsR0FBRSxDQUFDLE1BQUssR0FBRyxHQUFFLENBQUMsS0FBSSxFQUFFLEdBQUUsQ0FBQyxLQUFJLEVBQUUsR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsSUFBRyxJQUFJLEdBQUUsQ0FBQyxLQUFJLElBQUksR0FBRSxDQUFDLEtBQUksSUFBSSxDQUFDLEdBQUUsS0FBSSxHQUFFLE1BQUssQ0FBQyxDQUFDLEtBQUksSUFBSSxHQUFFLENBQUMsS0FBSSxJQUFJLEdBQUUsQ0FBQyxLQUFJLElBQUksR0FBRSxDQUFDLEtBQUksSUFBSSxHQUFFLENBQUMsS0FBSSxJQUFJLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLEtBQUksRUFBRSxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxJQUFHLEVBQUUsR0FBRSxDQUFDLElBQUcsRUFBRSxHQUFFLENBQUMsSUFBRyxHQUFHLEdBQUUsQ0FBQyxLQUFJLElBQUksR0FBRSxDQUFDLE1BQUssSUFBSSxHQUFFLENBQUMsTUFBSyxJQUFJLENBQUMsRUFBQztBQUFBLElBQzFXLE9BQU8sRUFBQyxPQUFNLElBQUcsS0FBSSxNQUFLLE1BQUssTUFBSyxLQUFJLE1BQUssUUFBTyxDQUFDLENBQUMsTUFBSyxHQUFHLEdBQUUsQ0FBQyxNQUFLLEdBQUcsR0FBRSxDQUFDLE1BQUssR0FBRyxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLEtBQUksR0FBRyxDQUFDLEVBQUM7QUFBQSxJQUNwSCxPQUFPLEVBQUMsT0FBTSxJQUFHLEtBQUksTUFBSyxNQUFLLE1BQUssS0FBSSxNQUFLLFFBQU8sQ0FBQyxDQUFDLE1BQUssRUFBRSxHQUFFLENBQUMsTUFBSyxFQUFFLEdBQUUsQ0FBQyxNQUFLLEVBQUUsR0FBRSxDQUFDLEtBQUksRUFBRSxHQUFFLENBQUMsSUFBRyxFQUFFLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLEtBQUksSUFBSSxDQUFDLEdBQUUsS0FBSSxHQUFFLE1BQUssQ0FBQyxDQUFDLEtBQUksRUFBRSxHQUFFLENBQUMsS0FBSSxFQUFFLEdBQUUsQ0FBQyxLQUFJLEVBQUUsR0FBRSxDQUFDLElBQUcsRUFBRSxHQUFFLENBQUMsS0FBSSxFQUFFLEdBQUUsQ0FBQyxNQUFLLEdBQUcsR0FBRSxDQUFDLE1BQUssSUFBSSxDQUFDLEVBQUM7QUFBQSxJQUN6TSxPQUFPLEVBQUMsT0FBTSxJQUFHLEtBQUksTUFBSyxNQUFLLE1BQUssS0FBSSxNQUFLLFFBQU8sQ0FBQyxDQUFDLE1BQUssSUFBSSxHQUFFLENBQUMsTUFBSyxJQUFJLEdBQUUsQ0FBQyxLQUFJLElBQUksR0FBRSxDQUFDLElBQUcsSUFBSSxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxJQUFHLElBQUksR0FBRSxDQUFDLEtBQUksSUFBSSxHQUFFLENBQUMsS0FBSSxJQUFJLENBQUMsR0FBRSxLQUFJLEdBQUUsTUFBSyxDQUFDLENBQUMsS0FBSSxJQUFJLEdBQUUsQ0FBQyxLQUFJLElBQUksR0FBRSxDQUFDLEtBQUksSUFBSSxHQUFFLENBQUMsSUFBRyxJQUFJLEdBQUUsQ0FBQyxLQUFJLElBQUksR0FBRSxDQUFDLElBQUcsR0FBRyxHQUFFLENBQUMsSUFBRyxFQUFFLEdBQUUsQ0FBQyxJQUFHLEdBQUcsR0FBRSxDQUFDLEtBQUksRUFBRSxHQUFFLENBQUMsS0FBSSxFQUFFLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLEtBQUksSUFBSSxHQUFFLENBQUMsTUFBSyxJQUFJLEdBQUUsQ0FBQyxNQUFLLElBQUksQ0FBQyxFQUFDO0FBQUEsSUFDdFUsT0FBTyxFQUFDLE9BQU0sSUFBRyxLQUFJLE1BQUssTUFBSyxNQUFLLEtBQUksTUFBSyxRQUFPLENBQUMsQ0FBQyxNQUFLLElBQUksR0FBRSxDQUFDLE1BQUssSUFBSSxHQUFFLENBQUMsTUFBSyxJQUFJLEdBQUUsQ0FBQyxLQUFJLElBQUksR0FBRSxDQUFDLEtBQUksSUFBSSxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxLQUFJLEVBQUUsR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxJQUFHLEdBQUcsR0FBRSxDQUFDLElBQUcsRUFBRSxHQUFFLENBQUMsSUFBRyxHQUFHLEdBQUUsQ0FBQyxLQUFJLElBQUksR0FBRSxDQUFDLEtBQUksSUFBSSxDQUFDLEdBQUUsS0FBSSxHQUFFLE1BQUssQ0FBQyxDQUFDLEtBQUksSUFBSSxHQUFFLENBQUMsS0FBSSxJQUFJLEdBQUUsQ0FBQyxLQUFJLElBQUksR0FBRSxDQUFDLElBQUcsSUFBSSxHQUFFLENBQUMsSUFBRyxJQUFJLEdBQUUsQ0FBQyxJQUFHLEdBQUcsR0FBRSxDQUFDLElBQUcsRUFBRSxHQUFFLENBQUMsSUFBRyxHQUFHLEdBQUUsQ0FBQyxJQUFHLEdBQUcsR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsS0FBSSxFQUFFLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLE1BQUssSUFBSSxHQUFFLENBQUMsTUFBSyxJQUFJLENBQUMsRUFBQztBQUFBLElBQ2hXLE9BQU8sRUFBQyxPQUFNLElBQUcsS0FBSSxNQUFLLE1BQUssTUFBSyxLQUFJLE1BQUssUUFBTyxDQUFDLENBQUMsTUFBSyxHQUFHLEdBQUUsQ0FBQyxNQUFLLEdBQUcsR0FBRSxDQUFDLE1BQUssR0FBRyxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxJQUFHLEdBQUcsR0FBRSxDQUFDLEtBQUksRUFBRSxHQUFFLENBQUMsSUFBRyxDQUFDLEdBQUUsQ0FBQyxLQUFJLEVBQUUsR0FBRSxDQUFDLE1BQUssRUFBRSxHQUFFLENBQUMsTUFBSyxHQUFHLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLElBQUcsR0FBRyxHQUFFLENBQUMsS0FBSSxJQUFJLEdBQUUsQ0FBQyxLQUFJLElBQUksR0FBRSxDQUFDLElBQUcsSUFBSSxHQUFFLENBQUMsTUFBSyxJQUFJLEdBQUUsQ0FBQyxNQUFLLElBQUksQ0FBQyxHQUFFLEtBQUksR0FBRSxNQUFLLENBQUMsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxJQUFHLEdBQUcsR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsTUFBSyxFQUFFLEdBQUUsQ0FBQyxLQUFJLENBQUMsR0FBRSxDQUFDLElBQUcsRUFBRSxHQUFFLENBQUMsS0FBSSxFQUFFLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLElBQUcsR0FBRyxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxNQUFLLElBQUksR0FBRSxDQUFDLE1BQUssSUFBSSxHQUFFLENBQUMsS0FBSSxJQUFJLEdBQUUsQ0FBQyxLQUFJLElBQUksR0FBRSxDQUFDLEtBQUksSUFBSSxDQUFDLEVBQUM7QUFBQSxJQUN6WixPQUFPLEVBQUMsT0FBTSxJQUFHLEtBQUksTUFBSyxNQUFLLEtBQUksS0FBSSxNQUFLLFFBQU8sQ0FBQyxDQUFDLE1BQUssSUFBSSxHQUFFLENBQUMsTUFBSyxJQUFJLEdBQUUsQ0FBQyxNQUFLLElBQUksR0FBRSxDQUFDLE1BQUssSUFBSSxHQUFFLENBQUMsTUFBSyxJQUFJLEdBQUUsQ0FBQyxNQUFLLEdBQUcsR0FBRSxDQUFDLE1BQUssR0FBRyxHQUFFLENBQUMsTUFBSyxFQUFFLEdBQUUsQ0FBQyxLQUFJLEVBQUUsR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsR0FBRSxHQUFHLEdBQUUsQ0FBQyxLQUFJLEVBQUUsR0FBRSxDQUFDLEtBQUksRUFBRSxDQUFDLEdBQUUsS0FBSSxHQUFFLE1BQUssQ0FBQyxDQUFDLEtBQUksSUFBSSxHQUFFLENBQUMsS0FBSSxJQUFJLEdBQUUsQ0FBQyxLQUFJLElBQUksR0FBRSxDQUFDLEtBQUksSUFBSSxHQUFFLENBQUMsS0FBSSxJQUFJLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsS0FBSSxFQUFFLEdBQUUsQ0FBQyxJQUFHLEVBQUUsR0FBRSxDQUFDLElBQUcsR0FBRyxHQUFFLENBQUMsSUFBRyxHQUFHLEdBQUUsQ0FBQyxNQUFLLEVBQUUsR0FBRSxDQUFDLE1BQUssRUFBRSxDQUFDLEVBQUM7QUFBQSxJQUM1VSxPQUFPLEVBQUMsT0FBTSxJQUFHLEtBQUksTUFBSyxNQUFLLE1BQUssS0FBSSxNQUFLLFFBQU8sQ0FBQyxDQUFDLE1BQUssR0FBRyxHQUFFLENBQUMsTUFBSyxHQUFHLEdBQUUsQ0FBQyxNQUFLLEdBQUcsR0FBRSxDQUFDLElBQUcsR0FBRyxHQUFFLENBQUMsSUFBRyxHQUFHLEdBQUUsQ0FBQyxJQUFHLEdBQUcsR0FBRSxDQUFDLEtBQUksSUFBSSxHQUFFLENBQUMsS0FBSSxJQUFJLENBQUMsR0FBRSxLQUFJLEdBQUUsTUFBSyxDQUFDLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsR0FBRSxHQUFHLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsTUFBSyxJQUFJLEdBQUUsQ0FBQyxNQUFLLElBQUksQ0FBQyxFQUFDO0FBQUEsSUFDdE8sUUFBUSxFQUFDLE9BQU0sSUFBRyxLQUFJLE1BQUssTUFBSyxNQUFLLEtBQUksTUFBSyxRQUFPLENBQUMsQ0FBQyxNQUFLLElBQUksR0FBRSxDQUFDLE1BQUssSUFBSSxHQUFFLENBQUMsTUFBSyxJQUFJLEdBQUUsQ0FBQyxNQUFLLElBQUksR0FBRSxDQUFDLE1BQUssSUFBSSxHQUFFLENBQUMsTUFBSyxHQUFHLEdBQUUsQ0FBQyxNQUFLLEVBQUUsR0FBRSxDQUFDLE1BQUssR0FBRyxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxJQUFHLEdBQUcsR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxLQUFJLEVBQUUsR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsS0FBSSxJQUFJLEdBQUUsQ0FBQyxLQUFJLElBQUksQ0FBQyxHQUFFLEtBQUksR0FBRSxNQUFLLENBQUMsQ0FBQyxLQUFJLElBQUksR0FBRSxDQUFDLEtBQUksSUFBSSxHQUFFLENBQUMsS0FBSSxJQUFJLEdBQUUsQ0FBQyxLQUFJLElBQUksR0FBRSxDQUFDLEtBQUksSUFBSSxHQUFFLENBQUMsS0FBSSxJQUFJLEdBQUUsQ0FBQyxLQUFJLElBQUksR0FBRSxDQUFDLEtBQUksSUFBSSxHQUFFLENBQUMsS0FBSSxJQUFJLEdBQUUsQ0FBQyxLQUFJLElBQUksR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsS0FBSSxFQUFFLEdBQUUsQ0FBQyxLQUFJLEVBQUUsR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLElBQUcsR0FBRyxHQUFFLENBQUMsR0FBRSxHQUFHLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLE1BQUssR0FBRyxHQUFFLENBQUMsTUFBSyxHQUFHLEdBQUUsQ0FBQyxNQUFLLEdBQUcsR0FBRSxDQUFDLE1BQUssR0FBRyxHQUFFLENBQUMsTUFBSyxFQUFFLEdBQUUsQ0FBQyxNQUFLLEVBQUUsR0FBRSxDQUFDLE1BQUssR0FBRyxHQUFFLENBQUMsTUFBSyxHQUFHLEdBQUUsQ0FBQyxNQUFLLElBQUksR0FBRSxDQUFDLE1BQUssSUFBSSxDQUFDLEVBQUM7QUFBQSxJQUNoaUIsUUFBUSxFQUFDLE9BQU0sSUFBRyxLQUFJLE1BQUssTUFBSyxLQUFJLEtBQUksTUFBSyxRQUFPLENBQUMsQ0FBQyxNQUFLLEVBQUUsR0FBRSxDQUFDLE1BQUssRUFBRSxHQUFFLENBQUMsTUFBSyxFQUFFLEdBQUUsQ0FBQyxNQUFLLEVBQUUsR0FBRSxDQUFDLE1BQUssRUFBRSxHQUFFLENBQUMsS0FBSSxFQUFFLEdBQUUsQ0FBQyxJQUFHLEVBQUUsR0FBRSxDQUFDLElBQUcsRUFBRSxHQUFFLENBQUMsS0FBSSxFQUFFLEdBQUUsQ0FBQyxLQUFJLEVBQUUsR0FBRSxDQUFDLEtBQUksRUFBRSxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxJQUFHLEdBQUcsR0FBRSxDQUFDLElBQUcsR0FBRyxHQUFFLENBQUMsSUFBRyxHQUFHLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsTUFBSyxHQUFHLEdBQUUsQ0FBQyxNQUFLLEVBQUUsR0FBRSxDQUFDLE1BQUssRUFBRSxHQUFFLENBQUMsTUFBSyxDQUFDLEdBQUUsQ0FBQyxNQUFLLEdBQUcsR0FBRSxDQUFDLE1BQUssSUFBSSxHQUFFLENBQUMsTUFBSyxJQUFJLENBQUMsR0FBRSxLQUFJLEdBQUUsTUFBSyxDQUFDLENBQUMsS0FBSSxFQUFFLEdBQUUsQ0FBQyxLQUFJLEVBQUUsR0FBRSxDQUFDLEtBQUksRUFBRSxHQUFFLENBQUMsR0FBRSxFQUFFLEdBQUUsQ0FBQyxNQUFLLEVBQUUsR0FBRSxDQUFDLE1BQUssRUFBRSxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLElBQUcsR0FBRyxHQUFFLENBQUMsS0FBSSxFQUFFLEdBQUUsQ0FBQyxLQUFJLEVBQUUsR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsS0FBSSxJQUFJLENBQUMsRUFBQztBQUFBLElBQ3RhLFFBQVEsRUFBQyxPQUFNLElBQUcsS0FBSSxNQUFLLE1BQUssTUFBSyxLQUFJLE1BQUssUUFBTyxDQUFDLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxNQUFLLEdBQUcsR0FBRSxDQUFDLEtBQUksRUFBRSxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxLQUFJLElBQUksR0FBRSxDQUFDLEtBQUksSUFBSSxHQUFFLENBQUMsSUFBRyxJQUFJLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLEtBQUksRUFBRSxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsS0FBSSxJQUFJLENBQUMsR0FBRSxLQUFJLEdBQUUsTUFBSyxDQUFDLENBQUMsSUFBRyxHQUFHLEdBQUUsQ0FBQyxJQUFHLEdBQUcsR0FBRSxDQUFDLElBQUcsR0FBRyxHQUFFLENBQUMsSUFBRyxFQUFFLEdBQUUsQ0FBQyxJQUFHLEVBQUUsR0FBRSxDQUFDLElBQUcsRUFBRSxHQUFFLENBQUMsSUFBRyxHQUFHLEdBQUUsQ0FBQyxJQUFHLElBQUksR0FBRSxDQUFDLEdBQUUsSUFBSSxHQUFFLENBQUMsS0FBSSxJQUFJLEdBQUUsQ0FBQyxLQUFJLElBQUksR0FBRSxDQUFDLEtBQUksSUFBSSxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLE1BQUssR0FBRyxHQUFFLENBQUMsTUFBSyxHQUFHLEdBQUUsQ0FBQyxNQUFLLEVBQUUsR0FBRSxDQUFDLE1BQUssRUFBRSxHQUFFLENBQUMsTUFBSyxHQUFHLEdBQUUsQ0FBQyxNQUFLLEdBQUcsR0FBRSxDQUFDLE1BQUssRUFBRSxHQUFFLENBQUMsTUFBSyxFQUFFLEdBQUUsQ0FBQyxNQUFLLEdBQUcsR0FBRSxDQUFDLE1BQUssSUFBSSxHQUFFLENBQUMsTUFBSyxJQUFJLENBQUMsRUFBQztBQUFBLElBQ2xjLFFBQVEsRUFBQyxPQUFNLElBQUcsS0FBSSxLQUFJLE1BQUssTUFBSyxLQUFJLE1BQUssUUFBTyxDQUFDLENBQUMsTUFBSyxJQUFJLEdBQUUsQ0FBQyxNQUFLLElBQUksR0FBRSxDQUFDLE1BQUssSUFBSSxHQUFFLENBQUMsTUFBSyxJQUFJLEdBQUUsQ0FBQyxNQUFLLEdBQUcsR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsSUFBRyxFQUFFLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLE1BQUssR0FBRyxHQUFFLENBQUMsTUFBSyxFQUFFLEdBQUUsQ0FBQyxNQUFLLEVBQUUsR0FBRSxDQUFDLE1BQUssRUFBRSxHQUFFLENBQUMsS0FBSSxFQUFFLEdBQUUsQ0FBQyxJQUFHLEVBQUUsR0FBRSxDQUFDLEtBQUksRUFBRSxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxLQUFJLElBQUksR0FBRSxDQUFDLEtBQUksSUFBSSxHQUFFLENBQUMsS0FBSSxJQUFJLENBQUMsR0FBRSxLQUFJLEdBQUUsTUFBSyxDQUFDLENBQUMsS0FBSSxJQUFJLEdBQUUsQ0FBQyxLQUFJLElBQUksR0FBRSxDQUFDLElBQUcsSUFBSSxHQUFFLENBQUMsSUFBRyxJQUFJLEdBQUUsQ0FBQyxJQUFHLElBQUksR0FBRSxDQUFDLElBQUcsSUFBSSxHQUFFLENBQUMsSUFBRyxHQUFHLEdBQUUsQ0FBQyxHQUFFLEVBQUUsR0FBRSxDQUFDLElBQUcsR0FBRyxHQUFFLENBQUMsS0FBSSxFQUFFLEdBQUUsQ0FBQyxLQUFJLEVBQUUsR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsSUFBRyxHQUFHLEdBQUUsQ0FBQyxJQUFHLEVBQUUsR0FBRSxDQUFDLElBQUcsRUFBRSxHQUFFLENBQUMsSUFBRyxHQUFHLEdBQUUsQ0FBQyxJQUFHLElBQUksR0FBRSxDQUFDLE1BQUssSUFBSSxHQUFFLENBQUMsTUFBSyxJQUFJLENBQUMsRUFBQztBQUFBLElBQzliLFFBQVEsRUFBQyxPQUFNLElBQUcsS0FBSSxNQUFLLE1BQUssS0FBSSxLQUFJLElBQUcsUUFBTyxDQUFDLENBQUMsTUFBSyxJQUFJLEdBQUUsQ0FBQyxNQUFLLElBQUksR0FBRSxDQUFDLE1BQUssSUFBSSxHQUFFLENBQUMsS0FBSSxJQUFJLEdBQUUsQ0FBQyxJQUFHLElBQUksR0FBRSxDQUFDLElBQUcsSUFBSSxHQUFFLENBQUMsSUFBRyxHQUFHLEdBQUUsQ0FBQyxJQUFHLEVBQUUsR0FBRSxDQUFDLEtBQUksRUFBRSxHQUFFLENBQUMsTUFBSyxFQUFFLEdBQUUsQ0FBQyxNQUFLLEVBQUUsR0FBRSxDQUFDLEtBQUksRUFBRSxHQUFFLENBQUMsSUFBRyxFQUFFLEdBQUUsQ0FBQyxJQUFHLEdBQUcsR0FBRSxDQUFDLElBQUcsSUFBSSxHQUFFLENBQUMsS0FBSSxJQUFJLENBQUMsR0FBRSxLQUFJLEdBQUUsTUFBSyxDQUFDLENBQUMsS0FBSSxJQUFJLEdBQUUsQ0FBQyxLQUFJLElBQUksR0FBRSxDQUFDLEtBQUksSUFBSSxHQUFFLENBQUMsSUFBRyxJQUFJLEdBQUUsQ0FBQyxLQUFJLElBQUksR0FBRSxDQUFDLEtBQUksSUFBSSxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxLQUFJLEVBQUUsR0FBRSxDQUFDLElBQUcsRUFBRSxHQUFFLENBQUMsS0FBSSxFQUFFLEdBQUUsQ0FBQyxLQUFJLEVBQUUsR0FBRSxDQUFDLElBQUcsRUFBRSxHQUFFLENBQUMsS0FBSSxFQUFFLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLEtBQUksSUFBSSxHQUFFLENBQUMsTUFBSyxJQUFJLENBQUMsRUFBQztBQUFBLElBQ2hZLFFBQVEsRUFBQyxPQUFNLElBQUcsS0FBSSxNQUFLLE1BQUssTUFBSyxLQUFJLE1BQUssUUFBTyxDQUFDLENBQUMsTUFBSyxFQUFFLEdBQUUsQ0FBQyxNQUFLLEVBQUUsR0FBRSxDQUFDLEtBQUksRUFBRSxHQUFFLENBQUMsS0FBSSxFQUFFLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLElBQUcsSUFBSSxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxLQUFJLEVBQUUsR0FBRSxDQUFDLElBQUcsRUFBRSxHQUFFLENBQUMsSUFBRyxHQUFHLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLEtBQUksRUFBRSxDQUFDLEdBQUUsS0FBSSxHQUFFLE1BQUssQ0FBQyxDQUFDLEtBQUksRUFBRSxHQUFFLENBQUMsS0FBSSxFQUFFLEdBQUUsQ0FBQyxJQUFHLEVBQUUsR0FBRSxDQUFDLElBQUcsRUFBRSxHQUFFLENBQUMsSUFBRyxHQUFHLEdBQUUsQ0FBQyxLQUFJLElBQUksR0FBRSxDQUFDLE1BQUssR0FBRyxHQUFFLENBQUMsTUFBSyxFQUFFLEdBQUUsQ0FBQyxLQUFJLEVBQUUsR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsTUFBSyxHQUFHLEdBQUUsQ0FBQyxNQUFLLEVBQUUsQ0FBQyxFQUFDO0FBQUEsSUFDdlMsUUFBUSxFQUFDLE9BQU0sSUFBRyxLQUFJLE1BQUssTUFBSyxNQUFLLEtBQUksTUFBSyxRQUFPLENBQUMsQ0FBQyxNQUFLLEdBQUcsR0FBRSxDQUFDLE1BQUssR0FBRyxHQUFFLENBQUMsTUFBSyxHQUFHLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLElBQUcsR0FBRyxHQUFFLENBQUMsS0FBSSxFQUFFLEdBQUUsQ0FBQyxLQUFJLEVBQUUsR0FBRSxDQUFDLElBQUcsRUFBRSxHQUFFLENBQUMsS0FBSSxFQUFFLEdBQUUsQ0FBQyxNQUFLLEVBQUUsR0FBRSxDQUFDLE1BQUssR0FBRyxHQUFFLENBQUMsTUFBSyxHQUFHLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLElBQUcsR0FBRyxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxLQUFJLElBQUksR0FBRSxDQUFDLEtBQUksSUFBSSxDQUFDLEdBQUUsS0FBSSxHQUFFLE1BQUssQ0FBQyxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLElBQUcsR0FBRyxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxNQUFLLEVBQUUsR0FBRSxDQUFDLE1BQUssRUFBRSxHQUFFLENBQUMsS0FBSSxFQUFFLEdBQUUsQ0FBQyxJQUFHLEVBQUUsR0FBRSxDQUFDLEtBQUksRUFBRSxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLElBQUcsR0FBRyxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxNQUFLLEdBQUcsR0FBRSxDQUFDLE1BQUssSUFBSSxHQUFFLENBQUMsTUFBSyxJQUFJLENBQUMsRUFBQztBQUFBLElBQ3RaLFFBQVEsRUFBQyxPQUFNLElBQUcsS0FBSSxNQUFLLE1BQUssTUFBSyxLQUFJLE1BQUssUUFBTyxDQUFDLENBQUMsTUFBSyxFQUFFLEdBQUUsQ0FBQyxNQUFLLEVBQUUsR0FBRSxDQUFDLE1BQUssRUFBRSxHQUFFLENBQUMsS0FBSSxFQUFFLEdBQUUsQ0FBQyxLQUFJLEVBQUUsR0FBRSxDQUFDLEtBQUksRUFBRSxHQUFFLENBQUMsSUFBRyxHQUFHLEdBQUUsQ0FBQyxLQUFJLElBQUksR0FBRSxDQUFDLE1BQUssSUFBSSxDQUFDLEdBQUUsS0FBSSxHQUFFLE1BQUssQ0FBQyxDQUFDLEtBQUksRUFBRSxHQUFFLENBQUMsS0FBSSxFQUFFLEdBQUUsQ0FBQyxLQUFJLEVBQUUsR0FBRSxDQUFDLElBQUcsRUFBRSxHQUFFLENBQUMsTUFBSyxFQUFFLEdBQUUsQ0FBQyxNQUFLLEVBQUUsR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsSUFBRyxJQUFJLEdBQUUsQ0FBQyxLQUFJLElBQUksQ0FBQyxFQUFDO0FBQUEsSUFDbFAsUUFBUSxFQUFDLE9BQU0sSUFBRyxLQUFJLE1BQUssTUFBSyxNQUFLLEtBQUksSUFBRyxRQUFPLENBQUMsQ0FBQyxNQUFLLEdBQUcsR0FBRSxDQUFDLE1BQUssR0FBRyxHQUFFLENBQUMsTUFBSyxFQUFFLEdBQUUsQ0FBQyxNQUFLLEdBQUcsR0FBRSxDQUFDLE1BQUssSUFBSSxHQUFFLENBQUMsS0FBSSxJQUFJLEdBQUUsQ0FBQyxLQUFJLElBQUksR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxLQUFJLEVBQUUsR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxJQUFHLEdBQUcsR0FBRSxDQUFDLEdBQUUsRUFBRSxHQUFFLENBQUMsSUFBRyxHQUFHLEdBQUUsQ0FBQyxLQUFJLEdBQUcsQ0FBQyxHQUFFLEtBQUksR0FBRSxNQUFLLENBQUMsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsS0FBSSxFQUFFLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLEtBQUksSUFBSSxHQUFFLENBQUMsSUFBRyxJQUFJLEdBQUUsQ0FBQyxNQUFLLElBQUksR0FBRSxDQUFDLE1BQUssR0FBRyxHQUFFLENBQUMsTUFBSyxHQUFHLEdBQUUsQ0FBQyxNQUFLLEVBQUUsR0FBRSxDQUFDLE1BQUssR0FBRyxHQUFFLENBQUMsTUFBSyxHQUFHLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLElBQUcsRUFBRSxHQUFFLENBQUMsR0FBRSxHQUFHLEdBQUUsQ0FBQyxJQUFHLEdBQUcsQ0FBQyxFQUFDO0FBQUEsSUFDblksUUFBUSxFQUFDLE9BQU0sSUFBRyxLQUFJLE1BQUssTUFBSyxNQUFLLEtBQUksTUFBSyxRQUFPLENBQUMsQ0FBQyxNQUFLLElBQUksR0FBRSxDQUFDLE1BQUssSUFBSSxHQUFFLENBQUMsTUFBSyxJQUFJLEdBQUUsQ0FBQyxNQUFLLElBQUksR0FBRSxDQUFDLE1BQUssR0FBRyxHQUFFLENBQUMsTUFBSyxFQUFFLEdBQUUsQ0FBQyxNQUFLLEdBQUcsR0FBRSxDQUFDLE1BQUssR0FBRyxHQUFFLENBQUMsS0FBSSxFQUFFLEdBQUUsQ0FBQyxHQUFFLEVBQUUsR0FBRSxDQUFDLEdBQUUsR0FBRyxHQUFFLENBQUMsSUFBRyxHQUFHLEdBQUUsQ0FBQyxLQUFJLElBQUksR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxLQUFJLEVBQUUsR0FBRSxDQUFDLEtBQUksR0FBRyxDQUFDLEdBQUUsS0FBSSxHQUFFLE1BQUssQ0FBQyxDQUFDLEtBQUksSUFBSSxHQUFFLENBQUMsS0FBSSxJQUFJLEdBQUUsQ0FBQyxLQUFJLElBQUksR0FBRSxDQUFDLEtBQUksSUFBSSxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxLQUFJLEVBQUUsR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxJQUFHLEVBQUUsR0FBRSxDQUFDLEdBQUUsRUFBRSxHQUFFLENBQUMsSUFBRyxHQUFHLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLE1BQUssSUFBSSxHQUFFLENBQUMsTUFBSyxHQUFHLEdBQUUsQ0FBQyxNQUFLLEdBQUcsR0FBRSxDQUFDLE1BQUssRUFBRSxHQUFFLENBQUMsTUFBSyxHQUFHLENBQUMsRUFBQztBQUFBLElBQzdaLFFBQVEsRUFBQyxPQUFNLElBQUcsS0FBSSxNQUFLLE1BQUssTUFBSyxLQUFJLE1BQUssUUFBTyxDQUFDLENBQUMsTUFBSyxJQUFJLEdBQUUsQ0FBQyxNQUFLLElBQUksR0FBRSxDQUFDLE1BQUssSUFBSSxHQUFFLENBQUMsTUFBSyxHQUFHLEdBQUUsQ0FBQyxNQUFLLElBQUksR0FBRSxDQUFDLE1BQUssSUFBSSxHQUFFLENBQUMsTUFBSyxHQUFHLEdBQUUsQ0FBQyxNQUFLLEdBQUcsR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsR0FBRSxHQUFHLEdBQUUsQ0FBQyxJQUFHLEdBQUcsR0FBRSxDQUFDLEtBQUksQ0FBQyxHQUFFLENBQUMsS0FBSSxFQUFFLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLEtBQUksRUFBRSxHQUFFLENBQUMsS0FBSSxFQUFFLEdBQUUsQ0FBQyxJQUFHLEdBQUcsR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsTUFBSyxFQUFFLENBQUMsR0FBRSxLQUFJLEdBQUUsTUFBSyxDQUFDLENBQUMsS0FBSSxJQUFJLEdBQUUsQ0FBQyxLQUFJLElBQUksR0FBRSxDQUFDLEtBQUksSUFBSSxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxLQUFJLElBQUksR0FBRSxDQUFDLEtBQUksSUFBSSxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLElBQUcsR0FBRyxHQUFFLENBQUMsSUFBRyxHQUFHLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLE1BQUssQ0FBQyxHQUFFLENBQUMsTUFBSyxFQUFFLEdBQUUsQ0FBQyxNQUFLLEdBQUcsR0FBRSxDQUFDLE1BQUssRUFBRSxHQUFFLENBQUMsTUFBSyxFQUFFLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsS0FBSSxFQUFFLENBQUMsRUFBQztBQUFBLElBQ3JjLE9BQU8sRUFBQyxPQUFNLElBQUcsS0FBSSxNQUFLLE1BQUssTUFBSyxLQUFJLE1BQUssUUFBTyxDQUFDLENBQUMsR0FBRSxJQUFJLEdBQUUsQ0FBQyxLQUFJLElBQUksR0FBRSxDQUFDLEtBQUksSUFBSSxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxNQUFLLEdBQUcsR0FBRSxDQUFDLE1BQUssR0FBRyxHQUFFLENBQUMsSUFBRyxHQUFHLEdBQUUsQ0FBQyxJQUFHLEVBQUUsR0FBRSxDQUFDLElBQUcsRUFBRSxHQUFFLENBQUMsS0FBSSxFQUFFLENBQUMsRUFBQztBQUFBLElBQ3RKLE9BQU8sRUFBQyxPQUFNLElBQUcsS0FBSSxNQUFLLE1BQUssTUFBSyxLQUFJLE1BQUssUUFBTyxDQUFDLENBQUMsTUFBSyxJQUFJLEdBQUUsQ0FBQyxNQUFLLElBQUksR0FBRSxDQUFDLE1BQUssSUFBSSxHQUFFLENBQUMsS0FBSSxJQUFJLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLE1BQUssR0FBRyxHQUFFLENBQUMsTUFBSyxHQUFHLENBQUMsR0FBRSxLQUFJLEdBQUUsTUFBSyxDQUFDLENBQUMsS0FBSSxJQUFJLEdBQUUsQ0FBQyxLQUFJLElBQUksR0FBRSxDQUFDLEtBQUksSUFBSSxHQUFFLENBQUMsSUFBRyxJQUFJLEdBQUUsQ0FBQyxJQUFHLEdBQUcsR0FBRSxDQUFDLElBQUcsR0FBRyxHQUFFLENBQUMsSUFBRyxHQUFHLEdBQUUsQ0FBQyxJQUFHLEdBQUcsR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsS0FBSSxHQUFHLENBQUMsRUFBQztBQUFBLElBQ2xSLE9BQU8sRUFBQyxPQUFNLElBQUcsS0FBSSxNQUFLLE1BQUssTUFBSyxLQUFJLE1BQUssUUFBTyxDQUFDLENBQUMsTUFBSyxJQUFJLEdBQUUsQ0FBQyxNQUFLLElBQUksR0FBRSxDQUFDLE1BQUssSUFBSSxHQUFFLENBQUMsS0FBSSxJQUFJLEdBQUUsQ0FBQyxLQUFJLElBQUksR0FBRSxDQUFDLEtBQUksRUFBRSxHQUFFLENBQUMsSUFBRyxHQUFHLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLE1BQUssQ0FBQyxHQUFFLENBQUMsTUFBSyxHQUFHLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLEtBQUksRUFBRSxHQUFFLENBQUMsS0FBSSxFQUFFLENBQUMsR0FBRSxLQUFJLEdBQUUsTUFBSyxDQUFDLENBQUMsS0FBSSxJQUFJLEdBQUUsQ0FBQyxLQUFJLElBQUksR0FBRSxDQUFDLEtBQUksSUFBSSxHQUFFLENBQUMsSUFBRyxJQUFJLEdBQUUsQ0FBQyxNQUFLLElBQUksR0FBRSxDQUFDLE1BQUssRUFBRSxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxJQUFHLEdBQUcsR0FBRSxDQUFDLEtBQUksQ0FBQyxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxJQUFHLEdBQUcsR0FBRSxDQUFDLE1BQUssRUFBRSxHQUFFLENBQUMsTUFBSyxFQUFFLENBQUMsRUFBQztBQUFBLElBQzNVLE9BQU8sRUFBQyxPQUFNLElBQUcsS0FBSSxLQUFJLE1BQUssTUFBSyxLQUFJLE1BQUssUUFBTyxDQUFDLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLEtBQUksSUFBSSxHQUFFLENBQUMsS0FBSSxJQUFJLEdBQUUsQ0FBQyxLQUFJLElBQUksR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsS0FBSSxDQUFDLEdBQUUsQ0FBQyxLQUFJLEVBQUUsR0FBRSxDQUFDLElBQUcsQ0FBQyxHQUFFLENBQUMsSUFBRyxFQUFFLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsTUFBSyxHQUFHLEdBQUUsQ0FBQyxNQUFLLEdBQUcsQ0FBQyxHQUFFLEtBQUksR0FBRSxNQUFLLENBQUMsQ0FBQyxNQUFLLEdBQUcsR0FBRSxDQUFDLE1BQUssR0FBRyxHQUFFLENBQUMsTUFBSyxJQUFJLEdBQUUsQ0FBQyxNQUFLLElBQUksR0FBRSxDQUFDLE1BQUssSUFBSSxHQUFFLENBQUMsTUFBSyxHQUFHLEdBQUUsQ0FBQyxNQUFLLENBQUMsR0FBRSxDQUFDLE1BQUssRUFBRSxHQUFFLENBQUMsS0FBSSxDQUFDLEdBQUUsQ0FBQyxLQUFJLEVBQUUsR0FBRSxDQUFDLElBQUcsR0FBRyxHQUFFLENBQUMsSUFBRyxHQUFHLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLEtBQUksR0FBRyxDQUFDLEVBQUM7QUFBQSxJQUN6VixPQUFPLEVBQUMsT0FBTSxJQUFHLEtBQUksTUFBSyxNQUFLLE1BQUssS0FBSSxNQUFLLFFBQU8sQ0FBQyxDQUFDLE1BQUssRUFBRSxHQUFFLENBQUMsTUFBSyxFQUFFLEdBQUUsQ0FBQyxNQUFLLEVBQUUsR0FBRSxDQUFDLElBQUcsRUFBRSxHQUFFLENBQUMsS0FBSSxFQUFFLEdBQUUsQ0FBQyxLQUFJLEVBQUUsR0FBRSxDQUFDLElBQUcsRUFBRSxHQUFFLENBQUMsSUFBRyxFQUFFLEdBQUUsQ0FBQyxJQUFHLENBQUMsR0FBRSxDQUFDLElBQUcsR0FBRyxHQUFFLENBQUMsS0FBSSxJQUFJLENBQUMsRUFBQztBQUFBLElBQ3hKLE9BQU8sRUFBQyxPQUFNLElBQUcsS0FBSSxNQUFLLE1BQUssTUFBSyxLQUFJLE1BQUssUUFBTyxDQUFDLENBQUMsTUFBSyxJQUFJLEdBQUUsQ0FBQyxNQUFLLElBQUksR0FBRSxDQUFDLE1BQUssSUFBSSxHQUFFLENBQUMsTUFBSyxJQUFJLEdBQUUsQ0FBQyxNQUFLLElBQUksR0FBRSxDQUFDLE1BQUssSUFBSSxHQUFFLENBQUMsTUFBSyxJQUFJLEdBQUUsQ0FBQyxNQUFLLElBQUksR0FBRSxDQUFDLE1BQUssSUFBSSxHQUFFLENBQUMsS0FBSSxJQUFJLEdBQUUsQ0FBQyxLQUFJLElBQUksR0FBRSxDQUFDLElBQUcsSUFBSSxHQUFFLENBQUMsS0FBSSxJQUFJLEdBQUUsQ0FBQyxLQUFJLElBQUksR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsS0FBSSxDQUFDLEdBQUUsQ0FBQyxJQUFHLEVBQUUsR0FBRSxDQUFDLElBQUcsRUFBRSxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxNQUFLLEdBQUcsR0FBRSxDQUFDLE1BQUssR0FBRyxDQUFDLEdBQUUsS0FBSSxHQUFFLE1BQUssQ0FBQyxDQUFDLEtBQUksSUFBSSxHQUFFLENBQUMsS0FBSSxJQUFJLEdBQUUsQ0FBQyxLQUFJLElBQUksR0FBRSxDQUFDLEtBQUksSUFBSSxHQUFFLENBQUMsS0FBSSxJQUFJLEdBQUUsQ0FBQyxJQUFHLElBQUksR0FBRSxDQUFDLE1BQUssSUFBSSxHQUFFLENBQUMsTUFBSyxHQUFHLEdBQUUsQ0FBQyxLQUFJLEVBQUUsR0FBRSxDQUFDLElBQUcsR0FBRyxHQUFFLENBQUMsS0FBSSxHQUFHLENBQUMsRUFBQztBQUFBLElBQzFaLE9BQU8sRUFBQyxPQUFNLElBQUcsS0FBSSxNQUFLLE1BQUssTUFBSyxLQUFJLE1BQUssUUFBTyxDQUFDLENBQUMsTUFBSyxJQUFJLEdBQUUsQ0FBQyxNQUFLLElBQUksR0FBRSxDQUFDLE1BQUssSUFBSSxHQUFFLENBQUMsS0FBSSxJQUFJLEdBQUUsQ0FBQyxJQUFHLElBQUksR0FBRSxDQUFDLElBQUcsR0FBRyxHQUFFLENBQUMsSUFBRyxHQUFHLEdBQUUsQ0FBQyxJQUFHLEVBQUUsR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsTUFBSyxHQUFHLEdBQUUsQ0FBQyxNQUFLLEdBQUcsQ0FBQyxHQUFFLEtBQUksR0FBRSxNQUFLLENBQUMsQ0FBQyxLQUFJLElBQUksR0FBRSxDQUFDLEtBQUksSUFBSSxHQUFFLENBQUMsS0FBSSxJQUFJLEdBQUUsQ0FBQyxJQUFHLElBQUksR0FBRSxDQUFDLEdBQUUsSUFBSSxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLEtBQUksRUFBRSxHQUFFLENBQUMsSUFBRyxHQUFHLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLEtBQUksR0FBRyxDQUFDLEVBQUM7QUFBQSxJQUNuUyxPQUFPLEVBQUMsT0FBTSxJQUFHLEtBQUksTUFBSyxNQUFLLE1BQUssS0FBSSxNQUFLLFFBQU8sQ0FBQyxDQUFDLE1BQUssSUFBSSxHQUFFLENBQUMsTUFBSyxJQUFJLEdBQUUsQ0FBQyxNQUFLLElBQUksR0FBRSxDQUFDLElBQUcsSUFBSSxHQUFFLENBQUMsS0FBSSxJQUFJLEdBQUUsQ0FBQyxLQUFJLElBQUksR0FBRSxDQUFDLElBQUcsR0FBRyxHQUFFLENBQUMsSUFBRyxHQUFHLEdBQUUsQ0FBQyxLQUFJLEVBQUUsR0FBRSxDQUFDLElBQUcsR0FBRyxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxLQUFJLEVBQUUsR0FBRSxDQUFDLEtBQUksRUFBRSxDQUFDLEdBQUUsS0FBSSxHQUFFLE1BQUssQ0FBQyxDQUFDLEtBQUksSUFBSSxHQUFFLENBQUMsS0FBSSxJQUFJLEdBQUUsQ0FBQyxLQUFJLElBQUksR0FBRSxDQUFDLEdBQUUsSUFBSSxHQUFFLENBQUMsTUFBSyxJQUFJLEdBQUUsQ0FBQyxNQUFLLElBQUksR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxJQUFHLEVBQUUsR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsTUFBSyxHQUFHLEdBQUUsQ0FBQyxNQUFLLEVBQUUsR0FBRSxDQUFDLE1BQUssRUFBRSxDQUFDLEVBQUM7QUFBQSxJQUM3VSxPQUFPLEVBQUMsT0FBTSxJQUFHLEtBQUksTUFBSyxNQUFLLE1BQUssS0FBSSxJQUFHLFFBQU8sQ0FBQyxDQUFDLE1BQUssSUFBSSxHQUFFLENBQUMsTUFBSyxJQUFJLEdBQUUsQ0FBQyxLQUFJLElBQUksR0FBRSxDQUFDLElBQUcsSUFBSSxHQUFFLENBQUMsSUFBRyxHQUFHLEdBQUUsQ0FBQyxJQUFHLEVBQUUsR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsTUFBSyxHQUFHLENBQUMsR0FBRSxLQUFJLEdBQUUsTUFBSyxDQUFDLENBQUMsS0FBSSxJQUFJLEdBQUUsQ0FBQyxLQUFJLElBQUksR0FBRSxDQUFDLEtBQUksSUFBSSxHQUFFLENBQUMsS0FBSSxJQUFJLEdBQUUsQ0FBQyxLQUFJLElBQUksR0FBRSxDQUFDLElBQUcsSUFBSSxHQUFFLENBQUMsSUFBRyxJQUFJLEdBQUUsQ0FBQyxJQUFHLElBQUksR0FBRSxDQUFDLEtBQUksSUFBSSxHQUFFLENBQUMsS0FBSSxJQUFJLEdBQUUsQ0FBQyxLQUFJLElBQUksR0FBRSxDQUFDLEtBQUksSUFBSSxHQUFFLENBQUMsSUFBRyxHQUFHLEdBQUUsQ0FBQyxJQUFHLEVBQUUsR0FBRSxDQUFDLElBQUcsR0FBRyxHQUFFLENBQUMsSUFBRyxHQUFHLEdBQUUsQ0FBQyxJQUFHLEdBQUcsR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxLQUFJLEdBQUcsQ0FBQyxFQUFDO0FBQUEsSUFDOVYsUUFBUSxFQUFDLE9BQU0sSUFBRyxLQUFJLE1BQUssTUFBSyxNQUFLLEtBQUksTUFBSyxRQUFPLENBQUMsQ0FBQyxNQUFLLElBQUksR0FBRSxDQUFDLE1BQUssSUFBSSxHQUFFLENBQUMsTUFBSyxJQUFJLEdBQUUsQ0FBQyxNQUFLLElBQUksR0FBRSxDQUFDLE1BQUssSUFBSSxHQUFFLENBQUMsS0FBSSxJQUFJLEdBQUUsQ0FBQyxLQUFJLElBQUksR0FBRSxDQUFDLEtBQUksSUFBSSxHQUFFLENBQUMsSUFBRyxJQUFJLEdBQUUsQ0FBQyxJQUFHLEdBQUcsR0FBRSxDQUFDLElBQUcsRUFBRSxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxNQUFLLEdBQUcsR0FBRSxDQUFDLE1BQUssR0FBRyxDQUFDLEdBQUUsS0FBSSxHQUFFLE1BQUssQ0FBQyxDQUFDLEtBQUksSUFBSSxHQUFFLENBQUMsS0FBSSxJQUFJLEdBQUUsQ0FBQyxLQUFJLElBQUksR0FBRSxDQUFDLEtBQUksSUFBSSxHQUFFLENBQUMsS0FBSSxJQUFJLEdBQUUsQ0FBQyxJQUFHLElBQUksR0FBRSxDQUFDLElBQUcsSUFBSSxHQUFFLENBQUMsR0FBRSxJQUFJLEdBQUUsQ0FBQyxLQUFJLElBQUksR0FBRSxDQUFDLEtBQUksSUFBSSxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsSUFBRyxFQUFFLEdBQUUsQ0FBQyxJQUFHLEVBQUUsR0FBRSxDQUFDLEtBQUksRUFBRSxHQUFFLENBQUMsS0FBSSxFQUFFLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLElBQUcsR0FBRyxHQUFFLENBQUMsSUFBRyxHQUFHLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLEtBQUksR0FBRyxDQUFDLEVBQUM7QUFBQSxJQUNyYixRQUFRLEVBQUMsT0FBTSxJQUFHLEtBQUksTUFBSyxNQUFLLE1BQUssS0FBSSxNQUFLLFFBQU8sQ0FBQyxDQUFDLE1BQUssRUFBRSxHQUFFLENBQUMsTUFBSyxFQUFFLEdBQUUsQ0FBQyxNQUFLLEVBQUUsR0FBRSxDQUFDLEtBQUksRUFBRSxHQUFFLENBQUMsSUFBRyxFQUFFLEdBQUUsQ0FBQyxLQUFJLEVBQUUsR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxHQUFFLElBQUksR0FBRSxDQUFDLE1BQUssSUFBSSxHQUFFLENBQUMsTUFBSyxJQUFJLENBQUMsR0FBRSxLQUFJLEdBQUUsTUFBSyxDQUFDLENBQUMsS0FBSSxFQUFFLEdBQUUsQ0FBQyxLQUFJLEVBQUUsR0FBRSxDQUFDLEtBQUksRUFBRSxHQUFFLENBQUMsSUFBRyxFQUFFLEdBQUUsQ0FBQyxLQUFJLEVBQUUsR0FBRSxDQUFDLE1BQUssRUFBRSxHQUFFLENBQUMsTUFBSyxHQUFHLEdBQUUsQ0FBQyxNQUFLLEdBQUcsR0FBRSxDQUFDLElBQUcsSUFBSSxHQUFFLENBQUMsS0FBSSxJQUFJLEdBQUUsQ0FBQyxLQUFJLElBQUksQ0FBQyxFQUFDO0FBQUEsSUFDNVIsUUFBUSxFQUFDLE9BQU0sSUFBRyxLQUFJLE1BQUssTUFBSyxNQUFLLEtBQUksTUFBSyxRQUFPLENBQUMsQ0FBQyxNQUFLLEVBQUUsR0FBRSxDQUFDLE1BQUssRUFBRSxHQUFFLENBQUMsTUFBSyxFQUFFLEdBQUUsQ0FBQyxNQUFLLEVBQUUsR0FBRSxDQUFDLE1BQUssRUFBRSxHQUFFLENBQUMsTUFBSyxFQUFFLEdBQUUsQ0FBQyxNQUFLLEVBQUUsR0FBRSxDQUFDLE1BQUssRUFBRSxHQUFFLENBQUMsTUFBSyxFQUFFLEdBQUUsQ0FBQyxLQUFJLEVBQUUsR0FBRSxDQUFDLElBQUcsRUFBRSxHQUFFLENBQUMsSUFBRyxFQUFFLEdBQUUsQ0FBQyxLQUFJLEVBQUUsR0FBRSxDQUFDLEtBQUksRUFBRSxDQUFDLEdBQUUsS0FBSSxHQUFFLE1BQUssQ0FBQyxDQUFDLEtBQUksRUFBRSxHQUFFLENBQUMsS0FBSSxFQUFFLEdBQUUsQ0FBQyxLQUFJLEVBQUUsR0FBRSxDQUFDLEtBQUksRUFBRSxHQUFFLENBQUMsS0FBSSxFQUFFLEdBQUUsQ0FBQyxHQUFFLEVBQUUsR0FBRSxDQUFDLE1BQUssRUFBRSxHQUFFLENBQUMsTUFBSyxFQUFFLENBQUMsRUFBQztBQUFBLElBQ2hSLFFBQVEsRUFBQyxPQUFNLElBQUcsS0FBSSxNQUFLLE1BQUssTUFBSyxLQUFJLE1BQUssUUFBTyxDQUFDLENBQUMsTUFBSyxJQUFJLEdBQUUsQ0FBQyxNQUFLLElBQUksR0FBRSxDQUFDLE1BQUssSUFBSSxHQUFFLENBQUMsTUFBSyxJQUFJLEdBQUUsQ0FBQyxNQUFLLElBQUksR0FBRSxDQUFDLE1BQUssSUFBSSxHQUFFLENBQUMsTUFBSyxJQUFJLEdBQUUsQ0FBQyxNQUFLLElBQUksR0FBRSxDQUFDLE1BQUssSUFBSSxHQUFFLENBQUMsTUFBSyxJQUFJLEdBQUUsQ0FBQyxNQUFLLElBQUksR0FBRSxDQUFDLE1BQUssSUFBSSxHQUFFLENBQUMsTUFBSyxJQUFJLEdBQUUsQ0FBQyxNQUFLLElBQUksR0FBRSxDQUFDLE1BQUssSUFBSSxHQUFFLENBQUMsS0FBSSxJQUFJLEdBQUUsQ0FBQyxLQUFJLElBQUksR0FBRSxDQUFDLEdBQUUsR0FBRyxHQUFFLENBQUMsSUFBRyxHQUFHLEdBQUUsQ0FBQyxJQUFHLEVBQUUsR0FBRSxDQUFDLElBQUcsRUFBRSxHQUFFLENBQUMsSUFBRyxFQUFFLEdBQUUsQ0FBQyxJQUFHLEVBQUUsR0FBRSxDQUFDLEtBQUksRUFBRSxHQUFFLENBQUMsS0FBSSxFQUFFLEdBQUUsQ0FBQyxLQUFJLEVBQUUsQ0FBQyxHQUFFLEtBQUksR0FBRSxNQUFLLENBQUMsQ0FBQyxLQUFJLElBQUksR0FBRSxDQUFDLEtBQUksSUFBSSxHQUFFLENBQUMsS0FBSSxJQUFJLEdBQUUsQ0FBQyxLQUFJLElBQUksR0FBRSxDQUFDLEtBQUksSUFBSSxHQUFFLENBQUMsS0FBSSxJQUFJLEdBQUUsQ0FBQyxLQUFJLElBQUksR0FBRSxDQUFDLEtBQUksSUFBSSxHQUFFLENBQUMsSUFBRyxJQUFJLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLEtBQUksRUFBRSxHQUFFLENBQUMsS0FBSSxFQUFFLEdBQUUsQ0FBQyxNQUFLLEVBQUUsR0FBRSxDQUFDLE1BQUssRUFBRSxDQUFDLEVBQUM7QUFBQSxJQUMzZSxRQUFRLEVBQUMsT0FBTSxJQUFHLEtBQUksTUFBSyxNQUFLLE1BQUssS0FBSSxNQUFLLFFBQU8sQ0FBQyxDQUFDLE1BQUssSUFBSSxHQUFFLENBQUMsTUFBSyxJQUFJLEdBQUUsQ0FBQyxNQUFLLElBQUksR0FBRSxDQUFDLE1BQUssSUFBSSxHQUFFLENBQUMsTUFBSyxJQUFJLEdBQUUsQ0FBQyxNQUFLLEdBQUcsR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsS0FBSSxFQUFFLEdBQUUsQ0FBQyxJQUFHLEVBQUUsR0FBRSxDQUFDLElBQUcsRUFBRSxHQUFFLENBQUMsS0FBSSxFQUFFLEdBQUUsQ0FBQyxLQUFJLEVBQUUsR0FBRSxDQUFDLEtBQUksRUFBRSxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLEtBQUksSUFBSSxHQUFFLENBQUMsS0FBSSxJQUFJLENBQUMsR0FBRSxLQUFJLEdBQUUsTUFBSyxDQUFDLENBQUMsS0FBSSxJQUFJLEdBQUUsQ0FBQyxLQUFJLElBQUksR0FBRSxDQUFDLEtBQUksSUFBSSxHQUFFLENBQUMsSUFBRyxDQUFDLEdBQUUsQ0FBQyxJQUFHLEVBQUUsR0FBRSxDQUFDLE1BQUssRUFBRSxHQUFFLENBQUMsTUFBSyxFQUFFLEdBQUUsQ0FBQyxNQUFLLEdBQUcsR0FBRSxDQUFDLE1BQUssSUFBSSxDQUFDLEVBQUM7QUFBQSxJQUM3VSxRQUFRLEVBQUMsT0FBTSxJQUFHLEtBQUksTUFBSyxNQUFLLE1BQUssS0FBSSxNQUFLLFFBQU8sQ0FBQyxDQUFDLE1BQUssR0FBRyxHQUFFLENBQUMsTUFBSyxHQUFHLEdBQUUsQ0FBQyxNQUFLLEdBQUcsR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxLQUFJLEVBQUUsR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsS0FBSSxJQUFJLEdBQUUsQ0FBQyxLQUFJLElBQUksR0FBRSxDQUFDLE1BQUssSUFBSSxHQUFFLENBQUMsTUFBSyxJQUFJLENBQUMsR0FBRSxLQUFJLEdBQUUsTUFBSyxDQUFDLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsSUFBRyxHQUFHLEdBQUUsQ0FBQyxJQUFHLEdBQUcsR0FBRSxDQUFDLElBQUcsRUFBRSxHQUFFLENBQUMsSUFBRyxHQUFHLEdBQUUsQ0FBQyxJQUFHLElBQUksR0FBRSxDQUFDLElBQUcsSUFBSSxHQUFFLENBQUMsS0FBSSxJQUFJLEdBQUUsQ0FBQyxLQUFJLElBQUksQ0FBQyxFQUFDO0FBQUEsSUFDcFMsUUFBUSxFQUFDLE9BQU0sSUFBRyxLQUFJLE1BQUssTUFBSyxNQUFLLEtBQUksTUFBSyxRQUFPLENBQUMsQ0FBQyxNQUFLLEdBQUcsR0FBRSxDQUFDLE1BQUssRUFBRSxHQUFFLENBQUMsTUFBSyxHQUFHLEdBQUUsQ0FBQyxNQUFLLElBQUksR0FBRSxDQUFDLE1BQUssSUFBSSxHQUFFLENBQUMsTUFBSyxJQUFJLEdBQUUsQ0FBQyxLQUFJLElBQUksR0FBRSxDQUFDLEtBQUksSUFBSSxHQUFFLENBQUMsSUFBRyxJQUFJLEdBQUUsQ0FBQyxJQUFHLElBQUksR0FBRSxDQUFDLElBQUcsSUFBSSxHQUFFLENBQUMsSUFBRyxJQUFJLEdBQUUsQ0FBQyxJQUFHLElBQUksR0FBRSxDQUFDLEtBQUksSUFBSSxHQUFFLENBQUMsS0FBSSxJQUFJLENBQUMsR0FBRSxLQUFJLEdBQUUsTUFBSyxDQUFDLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxLQUFJLEVBQUUsR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsS0FBSSxJQUFJLEdBQUUsQ0FBQyxLQUFJLElBQUksR0FBRSxDQUFDLEtBQUksSUFBSSxHQUFFLENBQUMsSUFBRyxJQUFJLEdBQUUsQ0FBQyxJQUFHLElBQUksR0FBRSxDQUFDLEdBQUUsSUFBSSxHQUFFLENBQUMsS0FBSSxJQUFJLEdBQUUsQ0FBQyxLQUFJLElBQUksR0FBRSxDQUFDLEtBQUksSUFBSSxHQUFFLENBQUMsS0FBSSxJQUFJLEdBQUUsQ0FBQyxNQUFLLElBQUksR0FBRSxDQUFDLE1BQUssSUFBSSxDQUFDLEVBQUM7QUFBQSxJQUNwWSxRQUFRLEVBQUMsT0FBTSxJQUFHLEtBQUksTUFBSyxNQUFLLE1BQUssS0FBSSxNQUFLLFFBQU8sQ0FBQyxDQUFDLE1BQUssRUFBRSxHQUFFLENBQUMsTUFBSyxFQUFFLEdBQUUsQ0FBQyxNQUFLLEVBQUUsR0FBRSxDQUFDLE1BQUssRUFBRSxHQUFFLENBQUMsTUFBSyxFQUFFLEdBQUUsQ0FBQyxNQUFLLEVBQUUsR0FBRSxDQUFDLE1BQUssRUFBRSxHQUFFLENBQUMsSUFBRyxFQUFFLEdBQUUsQ0FBQyxLQUFJLEVBQUUsR0FBRSxDQUFDLEtBQUksRUFBRSxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxJQUFHLEdBQUcsR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsTUFBSyxHQUFHLEdBQUUsQ0FBQyxLQUFJLElBQUksR0FBRSxDQUFDLElBQUcsSUFBSSxHQUFFLENBQUMsS0FBSSxJQUFJLENBQUMsR0FBRSxLQUFJLEdBQUUsTUFBSyxDQUFDLENBQUMsS0FBSSxFQUFFLEdBQUUsQ0FBQyxLQUFJLEVBQUUsR0FBRSxDQUFDLEtBQUksRUFBRSxHQUFFLENBQUMsS0FBSSxFQUFFLEdBQUUsQ0FBQyxLQUFJLEVBQUUsR0FBRSxDQUFDLEtBQUksRUFBRSxHQUFFLENBQUMsSUFBRyxFQUFFLEdBQUUsQ0FBQyxLQUFJLEVBQUUsR0FBRSxDQUFDLE1BQUssRUFBRSxHQUFFLENBQUMsTUFBSyxFQUFFLEdBQUUsQ0FBQyxNQUFLLEdBQUcsR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsSUFBRyxHQUFHLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLElBQUcsSUFBSSxHQUFFLENBQUMsS0FBSSxJQUFJLEdBQUUsQ0FBQyxNQUFLLElBQUksQ0FBQyxFQUFDO0FBQUEsSUFDL1ksUUFBUSxFQUFDLE9BQU0sSUFBRyxLQUFJLE1BQUssTUFBSyxNQUFLLEtBQUksTUFBSyxRQUFPLENBQUMsQ0FBQyxJQUFHLEdBQUcsR0FBRSxDQUFDLElBQUcsR0FBRyxHQUFFLENBQUMsSUFBRyxHQUFHLEdBQUUsQ0FBQyxJQUFHLEdBQUcsR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxNQUFLLEdBQUcsR0FBRSxDQUFDLE1BQUssRUFBRSxHQUFFLENBQUMsTUFBSyxFQUFFLEdBQUUsQ0FBQyxLQUFJLEVBQUUsR0FBRSxDQUFDLEtBQUksRUFBRSxHQUFFLENBQUMsTUFBSyxFQUFFLEdBQUUsQ0FBQyxNQUFLLEVBQUUsR0FBRSxDQUFDLE1BQUssRUFBRSxHQUFFLENBQUMsTUFBSyxFQUFFLEdBQUUsQ0FBQyxLQUFJLEVBQUUsR0FBRSxDQUFDLElBQUcsRUFBRSxHQUFFLENBQUMsS0FBSSxFQUFFLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLElBQUcsR0FBRyxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxNQUFLLEdBQUcsR0FBRSxDQUFDLE1BQUssSUFBSSxHQUFFLENBQUMsS0FBSSxJQUFJLEdBQUUsQ0FBQyxJQUFHLElBQUksR0FBRSxDQUFDLEtBQUksSUFBSSxDQUFDLEdBQUUsS0FBSSxHQUFFLE1BQUssQ0FBQyxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxHQUFFLEdBQUcsR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLElBQUcsR0FBRyxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLElBQUcsR0FBRyxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxLQUFJLEVBQUUsR0FBRSxDQUFDLElBQUcsRUFBRSxHQUFFLENBQUMsTUFBSyxFQUFFLEdBQUUsQ0FBQyxNQUFLLEdBQUcsR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxLQUFJLElBQUksR0FBRSxDQUFDLEtBQUksSUFBSSxHQUFFLENBQUMsTUFBSyxJQUFJLENBQUMsRUFBQztBQUFBLElBQ3hnQixRQUFRLEVBQUMsT0FBTSxJQUFHLEtBQUksTUFBSyxNQUFLLE1BQUssS0FBSSxNQUFLLFFBQU8sQ0FBQyxDQUFDLE1BQUssSUFBSSxHQUFFLENBQUMsTUFBSyxJQUFJLEdBQUUsQ0FBQyxNQUFLLElBQUksR0FBRSxDQUFDLE1BQUssSUFBSSxHQUFFLENBQUMsTUFBSyxJQUFJLEdBQUUsQ0FBQyxNQUFLLEdBQUcsR0FBRSxDQUFDLE1BQUssR0FBRyxHQUFFLENBQUMsTUFBSyxFQUFFLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLElBQUcsR0FBRyxHQUFFLENBQUMsS0FBSSxFQUFFLEdBQUUsQ0FBQyxLQUFJLEVBQUUsR0FBRSxDQUFDLElBQUcsRUFBRSxHQUFFLENBQUMsSUFBRyxFQUFFLEdBQUUsQ0FBQyxJQUFHLEVBQUUsR0FBRSxDQUFDLElBQUcsRUFBRSxHQUFFLENBQUMsSUFBRyxHQUFHLEdBQUUsQ0FBQyxLQUFJLElBQUksR0FBRSxDQUFDLEtBQUksSUFBSSxDQUFDLEdBQUUsS0FBSSxHQUFFLE1BQUssQ0FBQyxDQUFDLEtBQUksSUFBSSxHQUFFLENBQUMsS0FBSSxJQUFJLEdBQUUsQ0FBQyxLQUFJLElBQUksR0FBRSxDQUFDLEtBQUksSUFBSSxHQUFFLENBQUMsS0FBSSxJQUFJLEdBQUUsQ0FBQyxLQUFJLElBQUksR0FBRSxDQUFDLEtBQUksSUFBSSxHQUFFLENBQUMsS0FBSSxJQUFJLEdBQUUsQ0FBQyxLQUFJLElBQUksR0FBRSxDQUFDLEtBQUksSUFBSSxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLElBQUcsRUFBRSxHQUFFLENBQUMsSUFBRyxHQUFHLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsTUFBSyxHQUFHLEdBQUUsQ0FBQyxNQUFLLEVBQUUsR0FBRSxDQUFDLE1BQUssRUFBRSxHQUFFLENBQUMsTUFBSyxFQUFFLEdBQUUsQ0FBQyxNQUFLLEVBQUUsR0FBRSxDQUFDLE1BQUssRUFBRSxHQUFFLENBQUMsTUFBSyxFQUFFLEdBQUUsQ0FBQyxNQUFLLEVBQUUsR0FBRSxDQUFDLEtBQUksRUFBRSxHQUFFLENBQUMsS0FBSSxFQUFFLEdBQUUsQ0FBQyxHQUFFLENBQUMsR0FBRSxDQUFDLEdBQUUsRUFBRSxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsTUFBSyxJQUFJLEdBQUUsQ0FBQyxNQUFLLElBQUksQ0FBQyxFQUFDO0FBQUEsSUFDOW1CLFFBQVEsRUFBQyxPQUFNLElBQUcsS0FBSSxNQUFLLE1BQUssTUFBSyxLQUFJLE1BQUssUUFBTyxDQUFDLENBQUMsTUFBSyxHQUFHLEdBQUUsQ0FBQyxNQUFLLEdBQUcsR0FBRSxDQUFDLE1BQUssR0FBRyxHQUFFLENBQUMsTUFBSyxHQUFHLEdBQUUsQ0FBQyxNQUFLLEdBQUcsR0FBRSxDQUFDLE1BQUssR0FBRyxHQUFFLENBQUMsTUFBSyxHQUFHLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxHQUFFLEdBQUcsR0FBRSxDQUFDLElBQUcsR0FBRyxHQUFFLENBQUMsSUFBRyxHQUFHLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLElBQUcsR0FBRyxHQUFFLENBQUMsSUFBRyxHQUFHLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLEtBQUksRUFBRSxHQUFFLENBQUMsSUFBRyxFQUFFLEdBQUUsQ0FBQyxJQUFHLEVBQUUsR0FBRSxDQUFDLE1BQUssRUFBRSxHQUFFLENBQUMsTUFBSyxFQUFFLEdBQUUsQ0FBQyxNQUFLLEdBQUcsR0FBRSxDQUFDLEdBQUUsR0FBRyxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxLQUFJLElBQUksR0FBRSxDQUFDLElBQUcsSUFBSSxHQUFFLENBQUMsS0FBSSxJQUFJLEdBQUUsQ0FBQyxNQUFLLElBQUksQ0FBQyxHQUFFLEtBQUksR0FBRSxNQUFLLENBQUMsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLElBQUcsR0FBRyxHQUFFLENBQUMsSUFBRyxHQUFHLEdBQUUsQ0FBQyxJQUFHLEdBQUcsR0FBRSxDQUFDLEdBQUUsR0FBRyxHQUFFLENBQUMsSUFBRyxHQUFHLEdBQUUsQ0FBQyxJQUFHLEdBQUcsR0FBRSxDQUFDLElBQUcsR0FBRyxHQUFFLENBQUMsSUFBRyxHQUFHLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLE1BQUssR0FBRyxHQUFFLENBQUMsTUFBSyxFQUFFLEdBQUUsQ0FBQyxLQUFJLEVBQUUsR0FBRSxDQUFDLEtBQUksRUFBRSxHQUFFLENBQUMsSUFBRyxFQUFFLEdBQUUsQ0FBQyxLQUFJLENBQUMsR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsR0FBRSxHQUFHLEdBQUUsQ0FBQyxNQUFLLEdBQUcsR0FBRSxDQUFDLE1BQUssSUFBSSxHQUFFLENBQUMsS0FBSSxJQUFJLEdBQUUsQ0FBQyxJQUFHLElBQUksR0FBRSxDQUFDLEtBQUksSUFBSSxDQUFDLEVBQUM7QUFBQSxJQUMzbkIsT0FBTyxFQUFDLE9BQU0sSUFBRyxLQUFJLE1BQUssTUFBSyxNQUFLLEtBQUksTUFBSyxRQUFPLENBQUMsQ0FBQyxNQUFLLEVBQUUsR0FBRSxDQUFDLE1BQUssRUFBRSxHQUFFLENBQUMsS0FBSSxFQUFFLEdBQUUsQ0FBQyxJQUFHLEVBQUUsR0FBRSxDQUFDLElBQUcsQ0FBQyxHQUFFLENBQUMsTUFBSyxJQUFJLEdBQUUsQ0FBQyxNQUFLLElBQUksR0FBRSxDQUFDLEtBQUksSUFBSSxHQUFFLENBQUMsS0FBSSxJQUFJLENBQUMsRUFBQztBQUFBLElBQy9JLE9BQU8sRUFBQyxPQUFNLElBQUcsS0FBSSxNQUFLLE1BQUssTUFBSyxLQUFJLE1BQUssUUFBTyxDQUFDLENBQUMsTUFBSyxHQUFHLEdBQUUsQ0FBQyxNQUFLLEdBQUcsR0FBRSxDQUFDLEtBQUksRUFBRSxHQUFFLENBQUMsS0FBSSxFQUFFLEdBQUUsQ0FBQyxNQUFLLENBQUMsR0FBRSxDQUFDLE1BQUssSUFBSSxHQUFFLENBQUMsS0FBSSxJQUFJLEdBQUUsQ0FBQyxLQUFJLElBQUksQ0FBQyxHQUFFLEtBQUksR0FBRSxNQUFLLENBQUMsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsSUFBRyxFQUFFLEdBQUUsQ0FBQyxJQUFHLEVBQUUsR0FBRSxDQUFDLEtBQUksQ0FBQyxHQUFFLENBQUMsS0FBSSxJQUFJLEdBQUUsQ0FBQyxNQUFLLElBQUksR0FBRSxDQUFDLE1BQUssSUFBSSxDQUFDLEVBQUM7QUFBQSxJQUNwTyxPQUFPLEVBQUMsT0FBTSxJQUFHLEtBQUksTUFBSyxNQUFLLE1BQUssS0FBSSxJQUFHLFFBQU8sQ0FBQyxDQUFDLE1BQUssSUFBSSxHQUFFLENBQUMsTUFBSyxJQUFJLEdBQUUsQ0FBQyxNQUFLLElBQUksR0FBRSxDQUFDLElBQUcsSUFBSSxHQUFFLENBQUMsS0FBSSxJQUFJLEdBQUUsQ0FBQyxJQUFHLEdBQUcsR0FBRSxDQUFDLEtBQUksRUFBRSxHQUFFLENBQUMsS0FBSSxFQUFFLENBQUMsR0FBRSxLQUFJLEdBQUUsTUFBSyxDQUFDLENBQUMsS0FBSSxJQUFJLEdBQUUsQ0FBQyxLQUFJLElBQUksR0FBRSxDQUFDLEtBQUksSUFBSSxHQUFFLENBQUMsR0FBRSxJQUFJLEdBQUUsQ0FBQyxNQUFLLElBQUksR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsSUFBRyxFQUFFLEdBQUUsQ0FBQyxNQUFLLEVBQUUsQ0FBQyxFQUFDO0FBQUEsSUFDdE8sT0FBTyxFQUFDLE9BQU0sSUFBRyxLQUFJLE1BQUssTUFBSyxNQUFLLEtBQUksTUFBSyxRQUFPLENBQUMsQ0FBQyxNQUFLLEdBQUcsR0FBRSxDQUFDLE1BQUssR0FBRyxHQUFFLENBQUMsTUFBSyxHQUFHLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsS0FBSSxFQUFFLEdBQUUsQ0FBQyxJQUFHLEdBQUcsR0FBRSxDQUFDLEtBQUksR0FBRyxDQUFDLEdBQUUsS0FBSSxHQUFFLE1BQUssQ0FBQyxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLElBQUcsR0FBRyxHQUFFLENBQUMsSUFBRyxHQUFHLEdBQUUsQ0FBQyxJQUFHLEVBQUUsR0FBRSxDQUFDLEdBQUUsR0FBRyxHQUFFLENBQUMsTUFBSyxHQUFHLENBQUMsRUFBQztBQUFBLElBQzlOLE9BQU8sRUFBQyxPQUFNLElBQUcsS0FBSSxNQUFLLE1BQUssTUFBSyxLQUFJLE1BQUssUUFBTyxDQUFDLENBQUMsTUFBSyxHQUFHLEdBQUUsQ0FBQyxNQUFLLEVBQUUsR0FBRSxDQUFDLE1BQUssR0FBRyxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxLQUFJLEdBQUcsQ0FBQyxHQUFFLEtBQUksR0FBRSxNQUFLLENBQUMsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsS0FBSSxFQUFFLEdBQUUsQ0FBQyxNQUFLLElBQUksR0FBRSxDQUFDLE1BQUssR0FBRyxHQUFFLENBQUMsTUFBSyxHQUFHLENBQUMsRUFBQztBQUFBLElBQ3JMLE9BQU8sRUFBQyxPQUFNLEdBQUUsS0FBSSxNQUFLLE1BQUssTUFBSyxLQUFJLElBQUcsUUFBTyxDQUFDLENBQUMsTUFBSyxHQUFHLEdBQUUsQ0FBQyxNQUFLLEVBQUUsR0FBRSxDQUFDLE1BQUssRUFBRSxHQUFFLENBQUMsS0FBSSxJQUFJLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLEtBQUksR0FBRyxDQUFDLEdBQUUsS0FBSSxHQUFFLE1BQUssQ0FBQyxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsS0FBSSxFQUFFLEdBQUUsQ0FBQyxLQUFJLEVBQUUsR0FBRSxDQUFDLEtBQUksRUFBRSxHQUFFLENBQUMsS0FBSSxFQUFFLEdBQUUsQ0FBQyxJQUFHLEdBQUcsR0FBRSxDQUFDLElBQUcsSUFBSSxHQUFFLENBQUMsSUFBRyxJQUFJLEdBQUUsQ0FBQyxNQUFLLEdBQUcsR0FBRSxDQUFDLE1BQUssR0FBRyxDQUFDLEVBQUM7QUFBQSxJQUM5TixPQUFPLEVBQUMsT0FBTSxJQUFHLEtBQUksTUFBSyxNQUFLLE1BQUssS0FBSSxNQUFLLFFBQU8sQ0FBQyxDQUFDLE1BQUssSUFBSSxHQUFFLENBQUMsTUFBSyxJQUFJLEdBQUUsQ0FBQyxNQUFLLElBQUksR0FBRSxDQUFDLEtBQUksSUFBSSxHQUFFLENBQUMsSUFBRyxFQUFFLEdBQUUsQ0FBQyxLQUFJLEVBQUUsR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsS0FBSSxFQUFFLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLEtBQUksSUFBSSxDQUFDLEdBQUUsS0FBSSxHQUFFLE1BQUssQ0FBQyxDQUFDLEtBQUksSUFBSSxHQUFFLENBQUMsS0FBSSxJQUFJLEdBQUUsQ0FBQyxLQUFJLElBQUksR0FBRSxDQUFDLElBQUcsSUFBSSxHQUFFLENBQUMsS0FBSSxFQUFFLEdBQUUsQ0FBQyxNQUFLLEVBQUUsR0FBRSxDQUFDLE1BQUssR0FBRyxHQUFFLENBQUMsTUFBSyxFQUFFLEdBQUUsQ0FBQyxNQUFLLEdBQUcsR0FBRSxDQUFDLE1BQUssSUFBSSxDQUFDLEVBQUM7QUFBQSxJQUNwUixPQUFPLEVBQUMsT0FBTSxJQUFHLEtBQUksTUFBSyxNQUFLLEtBQUksS0FBSSxNQUFLLFFBQU8sQ0FBQyxDQUFDLE1BQUssR0FBRyxHQUFFLENBQUMsTUFBSyxHQUFHLEdBQUUsQ0FBQyxNQUFLLEVBQUUsR0FBRSxDQUFDLE1BQUssSUFBSSxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLEtBQUksRUFBRSxHQUFFLENBQUMsTUFBSyxJQUFJLEdBQUUsQ0FBQyxNQUFLLElBQUksR0FBRSxDQUFDLEtBQUksSUFBSSxHQUFFLENBQUMsR0FBRSxJQUFJLEdBQUUsQ0FBQyxLQUFJLElBQUksR0FBRSxDQUFDLEtBQUksSUFBSSxDQUFDLEdBQUUsS0FBSSxHQUFFLE1BQUssQ0FBQyxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxLQUFJLEVBQUUsR0FBRSxDQUFDLEtBQUksSUFBSSxHQUFFLENBQUMsTUFBSyxHQUFHLEdBQUUsQ0FBQyxNQUFLLEdBQUcsR0FBRSxDQUFDLE1BQUssRUFBRSxHQUFFLENBQUMsS0FBSSxJQUFJLEdBQUUsQ0FBQyxLQUFJLElBQUksR0FBRSxDQUFDLElBQUcsSUFBSSxHQUFFLENBQUMsR0FBRSxJQUFJLEdBQUUsQ0FBQyxNQUFLLElBQUksR0FBRSxDQUFDLE1BQUssSUFBSSxDQUFDLEVBQUM7QUFBQSxJQUNyVixPQUFPLEVBQUMsT0FBTSxJQUFHLEtBQUksTUFBSyxNQUFLLE1BQUssS0FBSSxNQUFLLFFBQU8sQ0FBQyxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsTUFBSyxHQUFHLEdBQUUsQ0FBQyxNQUFLLEdBQUcsR0FBRSxDQUFDLE1BQUssSUFBSSxHQUFFLENBQUMsTUFBSyxJQUFJLEdBQUUsQ0FBQyxNQUFLLElBQUksR0FBRSxDQUFDLE1BQUssSUFBSSxHQUFFLENBQUMsTUFBSyxJQUFJLEdBQUUsQ0FBQyxNQUFLLElBQUksR0FBRSxDQUFDLE1BQUssSUFBSSxHQUFFLENBQUMsTUFBSyxJQUFJLEdBQUUsQ0FBQyxNQUFLLElBQUksR0FBRSxDQUFDLE1BQUssSUFBSSxHQUFFLENBQUMsS0FBSSxJQUFJLEdBQUUsQ0FBQyxLQUFJLElBQUksR0FBRSxDQUFDLEtBQUksSUFBSSxDQUFDLEdBQUUsS0FBSSxHQUFFLE1BQUssQ0FBQyxDQUFDLElBQUcsR0FBRyxHQUFFLENBQUMsSUFBRyxHQUFHLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLEtBQUksSUFBSSxHQUFFLENBQUMsS0FBSSxJQUFJLEdBQUUsQ0FBQyxLQUFJLElBQUksR0FBRSxDQUFDLElBQUcsSUFBSSxHQUFFLENBQUMsTUFBSyxJQUFJLENBQUMsRUFBQztBQUFBLElBQzVXLFFBQVEsRUFBQyxPQUFNLElBQUcsS0FBSSxNQUFLLE1BQUssTUFBSyxLQUFJLE1BQUssUUFBTyxDQUFDLENBQUMsTUFBSyxHQUFHLEdBQUUsQ0FBQyxNQUFLLEdBQUcsR0FBRSxDQUFDLE1BQUssRUFBRSxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxLQUFJLElBQUksR0FBRSxDQUFDLEtBQUksSUFBSSxHQUFFLENBQUMsS0FBSSxJQUFJLEdBQUUsQ0FBQyxJQUFHLElBQUksR0FBRSxDQUFDLEtBQUksRUFBRSxDQUFDLEdBQUUsS0FBSSxHQUFFLE1BQUssQ0FBQyxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxLQUFJLEVBQUUsR0FBRSxDQUFDLElBQUcsR0FBRyxHQUFFLENBQUMsSUFBRyxJQUFJLEdBQUUsQ0FBQyxJQUFHLElBQUksR0FBRSxDQUFDLElBQUcsSUFBSSxHQUFFLENBQUMsS0FBSSxJQUFJLEdBQUUsQ0FBQyxNQUFLLEVBQUUsQ0FBQyxFQUFDO0FBQUEsSUFDMVAsUUFBUSxFQUFDLE9BQU0sSUFBRyxLQUFJLE1BQUssTUFBSyxNQUFLLEtBQUksTUFBSyxRQUFPLENBQUMsQ0FBQyxNQUFLLEdBQUcsR0FBRSxDQUFDLE1BQUssR0FBRyxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxJQUFHLEVBQUUsR0FBRSxDQUFDLElBQUcsR0FBRyxHQUFFLENBQUMsSUFBRyxJQUFJLEdBQUUsQ0FBQyxJQUFHLElBQUksR0FBRSxDQUFDLElBQUcsSUFBSSxHQUFFLENBQUMsS0FBSSxJQUFJLENBQUMsR0FBRSxLQUFJLEdBQUUsTUFBSyxDQUFDLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLElBQUcsR0FBRyxHQUFFLENBQUMsS0FBSSxFQUFFLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLEtBQUksSUFBSSxHQUFFLENBQUMsS0FBSSxJQUFJLEdBQUUsQ0FBQyxLQUFJLElBQUksR0FBRSxDQUFDLE1BQUssSUFBSSxDQUFDLEVBQUM7QUFBQSxJQUMxUCxRQUFRLEVBQUMsT0FBTSxJQUFHLEtBQUksTUFBSyxNQUFLLE1BQUssS0FBSSxNQUFLLFFBQU8sQ0FBQyxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxLQUFJLEVBQUUsR0FBRSxDQUFDLEtBQUksSUFBSSxHQUFFLENBQUMsTUFBSyxJQUFJLEdBQUUsQ0FBQyxNQUFLLElBQUksR0FBRSxDQUFDLE1BQUssSUFBSSxDQUFDLEdBQUUsS0FBSSxHQUFFLE1BQUssQ0FBQyxDQUFDLE1BQUssR0FBRyxHQUFFLENBQUMsTUFBSyxHQUFHLEdBQUUsQ0FBQyxNQUFLLEVBQUUsR0FBRSxDQUFDLE1BQUssSUFBSSxHQUFFLENBQUMsS0FBSSxJQUFJLEdBQUUsQ0FBQyxLQUFJLElBQUksR0FBRSxDQUFDLEtBQUksSUFBSSxDQUFDLEVBQUM7QUFBQSxJQUM1TixRQUFRLEVBQUMsT0FBTSxJQUFHLEtBQUksTUFBSyxNQUFLLE1BQUssS0FBSSxNQUFLLFFBQU8sQ0FBQyxDQUFDLE1BQUssR0FBRyxHQUFFLENBQUMsTUFBSyxHQUFHLEdBQUUsQ0FBQyxNQUFLLEdBQUcsR0FBRSxDQUFDLE1BQUssRUFBRSxHQUFFLENBQUMsTUFBSyxFQUFFLEdBQUUsQ0FBQyxNQUFLLEdBQUcsR0FBRSxDQUFDLE1BQUssSUFBSSxHQUFFLENBQUMsTUFBSyxJQUFJLEdBQUUsQ0FBQyxNQUFLLElBQUksR0FBRSxDQUFDLE1BQUssSUFBSSxHQUFFLENBQUMsTUFBSyxJQUFJLEdBQUUsQ0FBQyxLQUFJLElBQUksR0FBRSxDQUFDLEtBQUksSUFBSSxHQUFFLENBQUMsS0FBSSxJQUFJLENBQUMsR0FBRSxLQUFJLEdBQUUsTUFBSyxDQUFDLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxLQUFJLEVBQUUsR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsS0FBSSxJQUFJLEdBQUUsQ0FBQyxLQUFJLElBQUksR0FBRSxDQUFDLE1BQUssSUFBSSxDQUFDLEVBQUM7QUFBQSxJQUMvUixRQUFRLEVBQUMsT0FBTSxJQUFHLEtBQUksTUFBSyxNQUFLLE1BQUssS0FBSSxNQUFLLFFBQU8sQ0FBQyxDQUFDLE1BQUssR0FBRyxHQUFFLENBQUMsTUFBSyxHQUFHLEdBQUUsQ0FBQyxNQUFLLEVBQUUsR0FBRSxDQUFDLE1BQUssRUFBRSxHQUFFLENBQUMsS0FBSSxFQUFFLEdBQUUsQ0FBQyxHQUFFLEdBQUcsR0FBRSxDQUFDLElBQUcsR0FBRyxHQUFFLENBQUMsS0FBSSxJQUFJLEdBQUUsQ0FBQyxLQUFJLElBQUksQ0FBQyxHQUFFLEtBQUksR0FBRSxNQUFLLENBQUMsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsS0FBSSxFQUFFLEdBQUUsQ0FBQyxLQUFJLEVBQUUsR0FBRSxDQUFDLEtBQUksRUFBRSxHQUFFLENBQUMsSUFBRyxHQUFHLEdBQUUsQ0FBQyxNQUFLLEdBQUcsR0FBRSxDQUFDLE1BQUssR0FBRyxHQUFFLENBQUMsTUFBSyxJQUFJLEdBQUUsQ0FBQyxNQUFLLElBQUksQ0FBQyxFQUFDO0FBQUEsSUFDblEsUUFBUSxFQUFDLE9BQU0sSUFBRyxLQUFJLE1BQUssTUFBSyxNQUFLLEtBQUksTUFBSyxRQUFPLENBQUMsQ0FBQyxNQUFLLEdBQUcsR0FBRSxDQUFDLE1BQUssR0FBRyxHQUFFLENBQUMsTUFBSyxHQUFHLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxLQUFJLEVBQUUsR0FBRSxDQUFDLEtBQUksSUFBSSxHQUFFLENBQUMsS0FBSSxJQUFJLEdBQUUsQ0FBQyxJQUFHLElBQUksR0FBRSxDQUFDLE1BQUssSUFBSSxHQUFFLENBQUMsTUFBSyxJQUFJLEdBQUUsQ0FBQyxNQUFLLEdBQUcsR0FBRSxDQUFDLE1BQUssRUFBRSxHQUFFLENBQUMsTUFBSyxFQUFFLEdBQUUsQ0FBQyxHQUFFLEVBQUUsR0FBRSxDQUFDLEtBQUksRUFBRSxHQUFFLENBQUMsSUFBRyxDQUFDLEdBQUUsQ0FBQyxJQUFHLEdBQUcsR0FBRSxDQUFDLEdBQUUsR0FBRyxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxLQUFJLEVBQUUsR0FBRSxDQUFDLEdBQUUsR0FBRyxHQUFFLENBQUMsSUFBRyxFQUFFLENBQUMsR0FBRSxLQUFJLEdBQUUsTUFBSyxDQUFDLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsSUFBRyxHQUFHLEdBQUUsQ0FBQyxNQUFLLEdBQUcsR0FBRSxDQUFDLE1BQUssR0FBRyxHQUFFLENBQUMsTUFBSyxFQUFFLEdBQUUsQ0FBQyxNQUFLLElBQUksR0FBRSxDQUFDLE1BQUssSUFBSSxHQUFFLENBQUMsS0FBSSxJQUFJLEdBQUUsQ0FBQyxLQUFJLElBQUksR0FBRSxDQUFDLEtBQUksSUFBSSxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxLQUFJLEVBQUUsR0FBRSxDQUFDLEtBQUksRUFBRSxHQUFFLENBQUMsSUFBRyxFQUFFLEdBQUUsQ0FBQyxNQUFLLEVBQUUsR0FBRSxDQUFDLEtBQUksQ0FBQyxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxJQUFHLEdBQUcsR0FBRSxDQUFDLElBQUcsR0FBRyxHQUFFLENBQUMsSUFBRyxFQUFFLEdBQUUsQ0FBQyxJQUFHLEdBQUcsR0FBRSxDQUFDLEtBQUksR0FBRyxDQUFDLEVBQUM7QUFBQSxJQUMxaEIsUUFBUSxFQUFDLE9BQU0sSUFBRyxLQUFJLE1BQUssTUFBSyxNQUFLLEtBQUksTUFBSyxRQUFPLENBQUMsQ0FBQyxNQUFLLEdBQUcsR0FBRSxDQUFDLE1BQUssRUFBRSxHQUFFLENBQUMsTUFBSyxFQUFFLEdBQUUsQ0FBQyxLQUFJLEVBQUUsR0FBRSxDQUFDLEtBQUksRUFBRSxHQUFFLENBQUMsSUFBRyxFQUFFLEdBQUUsQ0FBQyxLQUFJLEVBQUUsR0FBRSxDQUFDLE1BQUssRUFBRSxHQUFFLENBQUMsTUFBSyxHQUFHLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsR0FBRSxJQUFJLEdBQUUsQ0FBQyxLQUFJLElBQUksR0FBRSxDQUFDLE1BQUssSUFBSSxHQUFFLENBQUMsTUFBSyxJQUFJLENBQUMsR0FBRSxLQUFJLEdBQUUsTUFBSyxDQUFDLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxLQUFJLEVBQUUsR0FBRSxDQUFDLEtBQUksRUFBRSxHQUFFLENBQUMsSUFBRyxFQUFFLEdBQUUsQ0FBQyxNQUFLLEVBQUUsR0FBRSxDQUFDLEtBQUksRUFBRSxHQUFFLENBQUMsSUFBRyxFQUFFLEdBQUUsQ0FBQyxLQUFJLEVBQUUsR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsSUFBRyxHQUFHLEdBQUUsQ0FBQyxJQUFHLEdBQUcsR0FBRSxDQUFDLElBQUcsSUFBSSxHQUFFLENBQUMsSUFBRyxJQUFJLEdBQUUsQ0FBQyxLQUFJLElBQUksR0FBRSxDQUFDLEtBQUksSUFBSSxDQUFDLEVBQUM7QUFBQSxJQUN4VyxRQUFRLEVBQUMsT0FBTSxJQUFHLEtBQUksTUFBSyxNQUFLLE1BQUssS0FBSSxNQUFLLFFBQU8sQ0FBQyxDQUFDLE1BQUssR0FBRyxHQUFFLENBQUMsTUFBSyxHQUFHLEdBQUUsQ0FBQyxNQUFLLEVBQUUsR0FBRSxDQUFDLEtBQUksRUFBRSxHQUFFLENBQUMsSUFBRyxFQUFFLEdBQUUsQ0FBQyxJQUFHLEVBQUUsR0FBRSxDQUFDLElBQUcsRUFBRSxHQUFFLENBQUMsSUFBRyxHQUFHLEdBQUUsQ0FBQyxLQUFJLElBQUksR0FBRSxDQUFDLEtBQUksSUFBSSxDQUFDLEdBQUUsS0FBSSxHQUFFLE1BQUssQ0FBQyxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxLQUFJLEVBQUUsR0FBRSxDQUFDLElBQUcsRUFBRSxHQUFFLENBQUMsS0FBSSxFQUFFLEdBQUUsQ0FBQyxLQUFJLEVBQUUsR0FBRSxDQUFDLEtBQUksRUFBRSxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxNQUFLLElBQUksR0FBRSxDQUFDLE1BQUssSUFBSSxDQUFDLEVBQUM7QUFBQSxJQUNyUSxRQUFRLEVBQUMsT0FBTSxJQUFHLEtBQUksTUFBSyxNQUFLLE1BQUssS0FBSSxNQUFLLFFBQU8sQ0FBQyxDQUFDLE1BQUssSUFBSSxHQUFFLENBQUMsTUFBSyxJQUFJLEdBQUUsQ0FBQyxNQUFLLElBQUksR0FBRSxDQUFDLE1BQUssSUFBSSxHQUFFLENBQUMsTUFBSyxJQUFJLEdBQUUsQ0FBQyxNQUFLLEdBQUcsR0FBRSxDQUFDLE1BQUssRUFBRSxHQUFFLENBQUMsS0FBSSxDQUFDLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxLQUFJLENBQUMsR0FBRSxDQUFDLEtBQUksRUFBRSxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxLQUFJLEdBQUcsQ0FBQyxHQUFFLEtBQUksR0FBRSxNQUFLLENBQUMsQ0FBQyxLQUFJLElBQUksR0FBRSxDQUFDLEtBQUksSUFBSSxHQUFFLENBQUMsS0FBSSxJQUFJLEdBQUUsQ0FBQyxLQUFJLElBQUksR0FBRSxDQUFDLEtBQUksSUFBSSxHQUFFLENBQUMsS0FBSSxJQUFJLEdBQUUsQ0FBQyxJQUFHLElBQUksR0FBRSxDQUFDLElBQUcsSUFBSSxHQUFFLENBQUMsSUFBRyxJQUFJLEdBQUUsQ0FBQyxJQUFHLElBQUksR0FBRSxDQUFDLEtBQUksSUFBSSxHQUFFLENBQUMsS0FBSSxJQUFJLEdBQUUsQ0FBQyxLQUFJLElBQUksR0FBRSxDQUFDLEtBQUksSUFBSSxHQUFFLENBQUMsS0FBSSxJQUFJLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLEtBQUksQ0FBQyxHQUFFLENBQUMsS0FBSSxFQUFFLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxNQUFLLEVBQUUsR0FBRSxDQUFDLE1BQUssQ0FBQyxHQUFFLENBQUMsTUFBSyxFQUFFLEdBQUUsQ0FBQyxNQUFLLEVBQUUsR0FBRSxDQUFDLE1BQUssR0FBRyxHQUFFLENBQUMsTUFBSyxHQUFHLENBQUMsRUFBQztBQUFBLElBQ3RmLFFBQVEsRUFBQyxPQUFNLElBQUcsS0FBSSxNQUFLLE1BQUssTUFBSyxLQUFJLElBQUcsUUFBTyxDQUFDLENBQUMsTUFBSyxJQUFJLEdBQUUsQ0FBQyxNQUFLLElBQUksR0FBRSxDQUFDLE1BQUssSUFBSSxHQUFFLENBQUMsTUFBSyxJQUFJLEdBQUUsQ0FBQyxNQUFLLElBQUksR0FBRSxDQUFDLE1BQUssSUFBSSxHQUFFLENBQUMsTUFBSyxJQUFJLEdBQUUsQ0FBQyxNQUFLLElBQUksR0FBRSxDQUFDLE1BQUssSUFBSSxHQUFFLENBQUMsS0FBSSxJQUFJLEdBQUUsQ0FBQyxJQUFHLElBQUksR0FBRSxDQUFDLEtBQUksSUFBSSxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxHQUFFLEdBQUcsR0FBRSxDQUFDLE1BQUssR0FBRyxHQUFFLENBQUMsTUFBSyxDQUFDLEdBQUUsQ0FBQyxLQUFJLEVBQUUsR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxLQUFJLEVBQUUsR0FBRSxDQUFDLEtBQUksRUFBRSxHQUFFLENBQUMsS0FBSSxFQUFFLENBQUMsR0FBRSxLQUFJLEdBQUUsTUFBSyxDQUFDLENBQUMsS0FBSSxJQUFJLEdBQUUsQ0FBQyxLQUFJLElBQUksR0FBRSxDQUFDLEtBQUksSUFBSSxHQUFFLENBQUMsS0FBSSxJQUFJLEdBQUUsQ0FBQyxLQUFJLElBQUksR0FBRSxDQUFDLEtBQUksSUFBSSxHQUFFLENBQUMsS0FBSSxJQUFJLEdBQUUsQ0FBQyxLQUFJLElBQUksR0FBRSxDQUFDLEtBQUksSUFBSSxHQUFFLENBQUMsSUFBRyxJQUFJLEdBQUUsQ0FBQyxLQUFJLElBQUksR0FBRSxDQUFDLE1BQUssSUFBSSxHQUFFLENBQUMsTUFBSyxHQUFHLEdBQUUsQ0FBQyxNQUFLLEdBQUcsR0FBRSxDQUFDLE1BQUssR0FBRyxHQUFFLENBQUMsTUFBSyxHQUFHLEdBQUUsQ0FBQyxJQUFHLEdBQUcsR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsS0FBSSxDQUFDLEdBQUUsQ0FBQyxJQUFHLEVBQUUsR0FBRSxDQUFDLElBQUcsR0FBRyxHQUFFLENBQUMsTUFBSyxHQUFHLEdBQUUsQ0FBQyxNQUFLLEVBQUUsR0FBRSxDQUFDLE1BQUssQ0FBQyxHQUFFLENBQUMsTUFBSyxHQUFHLENBQUMsRUFBQztBQUFBLElBQzlrQixRQUFRLEVBQUMsT0FBTSxJQUFHLEtBQUksTUFBSyxNQUFLLEtBQUksS0FBSSxNQUFLLFFBQU8sQ0FBQyxDQUFDLE1BQUssSUFBSSxHQUFFLENBQUMsTUFBSyxJQUFJLEdBQUUsQ0FBQyxNQUFLLElBQUksR0FBRSxDQUFDLE1BQUssSUFBSSxHQUFFLENBQUMsTUFBSyxJQUFJLEdBQUUsQ0FBQyxNQUFLLEdBQUcsR0FBRSxDQUFDLE1BQUssR0FBRyxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxJQUFHLEdBQUcsR0FBRSxDQUFDLEtBQUksSUFBSSxHQUFFLENBQUMsTUFBSyxHQUFHLEdBQUUsQ0FBQyxNQUFLLEdBQUcsR0FBRSxDQUFDLE1BQUssR0FBRyxHQUFFLENBQUMsTUFBSyxHQUFHLEdBQUUsQ0FBQyxNQUFLLEdBQUcsR0FBRSxDQUFDLE1BQUssRUFBRSxHQUFFLENBQUMsTUFBSyxFQUFFLEdBQUUsQ0FBQyxNQUFLLEVBQUUsR0FBRSxDQUFDLEtBQUksRUFBRSxHQUFFLENBQUMsSUFBRyxDQUFDLEdBQUUsQ0FBQyxLQUFJLEVBQUUsR0FBRSxDQUFDLElBQUcsR0FBRyxHQUFFLENBQUMsS0FBSSxHQUFHLENBQUMsR0FBRSxLQUFJLEdBQUUsTUFBSyxDQUFDLENBQUMsS0FBSSxJQUFJLEdBQUUsQ0FBQyxLQUFJLElBQUksR0FBRSxDQUFDLEtBQUksSUFBSSxHQUFFLENBQUMsS0FBSSxJQUFJLEdBQUUsQ0FBQyxLQUFJLElBQUksR0FBRSxDQUFDLEtBQUksSUFBSSxHQUFFLENBQUMsS0FBSSxJQUFJLEdBQUUsQ0FBQyxLQUFJLElBQUksR0FBRSxDQUFDLEtBQUksSUFBSSxHQUFFLENBQUMsS0FBSSxJQUFJLEdBQUUsQ0FBQyxLQUFJLElBQUksR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLElBQUcsR0FBRyxHQUFFLENBQUMsSUFBRyxHQUFHLEdBQUUsQ0FBQyxLQUFJLElBQUksR0FBRSxDQUFDLE1BQUssSUFBSSxHQUFFLENBQUMsTUFBSyxJQUFJLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsS0FBSSxHQUFHLEdBQUUsQ0FBQyxLQUFJLEdBQUcsR0FBRSxDQUFDLEtBQUksQ0FBQyxHQUFFLENBQUMsS0FBSSxFQUFFLEdBQUUsQ0FBQyxLQUFJLEVBQUUsR0FBRSxDQUFDLEtBQUksRUFBRSxHQUFFLENBQUMsS0FBSSxFQUFFLEdBQUUsQ0FBQyxLQUFJLEVBQUUsR0FBRSxDQUFDLElBQUcsRUFBRSxHQUFFLENBQUMsR0FBRSxFQUFFLEdBQUUsQ0FBQyxLQUFJLENBQUMsR0FBRSxDQUFDLE1BQUssR0FBRyxHQUFFLENBQUMsSUFBRyxFQUFFLEdBQUUsQ0FBQyxJQUFHLEdBQUcsR0FBRSxDQUFDLEtBQUksR0FBRyxHQUFFLENBQUMsTUFBSyxFQUFFLENBQUMsRUFBQztBQUFBLEVBQ2p1Qjs7O0FD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
