/* =========================================================
   JUNTOS HACIA DIOS - APP.JS LIMPIO
========================================================= */


/* =========================================================
   UTILIDADES GENERALES
========================================================= */

function getSupabase() {
  if (typeof supabaseClient === "undefined") {
    return null;
  }

  return supabaseClient;
}

function escapeHTML(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function safeText(value, fallback = "") {
  return value || fallback;
}

function getInitial(text) {
  if (!text) return "?";
  return String(text).charAt(0).toUpperCase();
}

function safeUrl(url) {
  const value = String(url || "").trim();

  if (!value) return "";

  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  return "";
}

function runWhenReady(callback) {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", callback);
  } else {
    callback();
  }
}


/* =========================================================
   MODO CLARO / OSCURO
========================================================= */

function initTheme() {
  const themeToggle = document.getElementById("themeToggle");

  if (!themeToggle) return;

  if (localStorage.getItem("theme") === "light") {
    document.body.classList.add("light-mode");
    themeToggle.textContent = "☀️";
  } else {
    themeToggle.textContent = "🌙";
  }

  themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("light-mode");

    if (document.body.classList.contains("light-mode")) {
      themeToggle.textContent = "☀️";
      localStorage.setItem("theme", "light");
    } else {
      themeToggle.textContent = "🌙";
      localStorage.setItem("theme", "dark");
    }
  });
}


/* =========================================================
   MENÚ HAMBURGUESA
========================================================= */

function initMobileMenu() {
  const menuToggle = document.getElementById("menuToggle");
  const navMenu = document.getElementById("navMenu");

  if (!menuToggle || !navMenu) return;

  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-controls", "navMenu");

  menuToggle.addEventListener("click", () => {
    navMenu.classList.toggle("show-menu");

    const isOpen = navMenu.classList.contains("show-menu");

    menuToggle.textContent = isOpen ? "✕ Cerrar" : "☰ Menú";
    menuToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
  });

  navMenu.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
      navMenu.classList.remove("show-menu");
      menuToggle.textContent = "☰ Menú";
      menuToggle.setAttribute("aria-expanded", "false");
    });
  });
}


/* =========================================================
   TRANSPOSICIÓN Y CIFRADO
========================================================= */

let originalLyrics = "";
let transposeAmount = 0;
let chordLanguage = localStorage.getItem("chordLanguage") || "english";

const notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

const flats = {
  Db: "C#",
  Eb: "D#",
  Gb: "F#",
  Ab: "G#",
  Bb: "A#"
};

const englishToSpanish = {
  C: "Do",
  "C#": "Do#",
  D: "Re",
  "D#": "Re#",
  E: "Mi",
  F: "Fa",
  "F#": "Fa#",
  G: "Sol",
  "G#": "Sol#",
  A: "La",
  "A#": "La#",
  B: "Si"
};

const chordPattern = "[A-G](?:#|b)?(?:m|maj7|maj9|m7|m9|7|9|11|13|6|sus4|sus2|dim|aug|add9)?(?:\\/[A-G](?:#|b)?)?";

function normalizeRoot(root) {
  return flats[root] || root;
}

function transposeRoot(root, steps) {
  const normalized = normalizeRoot(root);
  const index = notes.indexOf(normalized);

  if (index === -1) return root;

  const newIndex = (index + steps + notes.length) % notes.length;

  return notes[newIndex];
}

function formatRoot(root) {
  if (chordLanguage === "spanish") {
    return englishToSpanish[root] || root;
  }

  return root;
}

function transposeChord(chord, steps) {
  const cleanChord = String(chord || "").trim();

  const match = cleanChord.match(/^([A-G])(#|b)?(.*?)(?:\/([A-G](?:#|b)?))?$/);

  if (!match) return cleanChord;

  const root = match[1] + (match[2] || "");
  const suffix = match[3] || "";
  const bass = match[4] || "";

  const newRoot = transposeRoot(root, steps);
  const newBass = bass ? transposeRoot(bass, steps) : "";

  return newRoot + suffix + (newBass ? "/" + newBass : "");
}

function formatChord(chord) {
  const cleanChord = String(chord || "").trim();

  const match = cleanChord.match(/^([A-G](?:#|b)?)(.*?)(?:\/([A-G](?:#|b)?))?$/);

  if (!match) return cleanChord;

  const root = normalizeRoot(match[1]);
  const suffix = match[2] || "";
  const bass = match[3] ? normalizeRoot(match[3]) : "";

  return formatRoot(root) + suffix + (bass ? "/" + formatRoot(bass) : "");
}

function transposeAndFormatChord(chord, steps) {
  const transposed = transposeChord(chord, steps);
  return formatChord(transposed);
}

function isChordOnlyLine(line) {
  const value = String(line || "").trim();

  if (!value) return false;

  const withoutParentheses = value.replace(
    new RegExp("\\((" + chordPattern + ")\\)", "g"),
    ""
  );

  const withoutChords = withoutParentheses.replace(
    new RegExp("\\b" + chordPattern + "\\b", "g"),
    ""
  );

  return withoutChords.replace(/[|\-–—.,/()\[\]\s]/g, "").length === 0;
}

function transposeText(text, steps) {
  return String(text || "")
    .split("\n")
    .map(line => {
      let updatedLine = line.replace(
        new RegExp("\\((" + chordPattern + ")\\)", "g"),
        function(match, chord) {
          return "(" + transposeAndFormatChord(chord, steps) + ")";
        }
      );

      if (isChordOnlyLine(line)) {
        updatedLine = updatedLine.replace(
          new RegExp("\\b" + chordPattern + "\\b", "g"),
          function(chord) {
            return transposeAndFormatChord(chord, steps);
          }
        );
      }

      return updatedLine;
    })
    .join("\n");
}

function transposeSong(steps) {
  transposeAmount += steps;
  showLyrics();
}

function resetTranspose() {
  transposeAmount = 0;
  showLyrics();
}

function setChordLanguage(language) {
  chordLanguage = language;
  localStorage.setItem("chordLanguage", language);
  showLyrics();
}


/* =========================================================
   RENDER DE LETRA TIPO APP
   [Verso 1] = apartado
   (G) = acorde
========================================================= */

function cleanSectionTitle(line) {
  return String(line || "")
    .trim()
    .replace(/^\[/, "")
    .replace(/\]$/, "")
    .replace(/:$/, "")
    .trim();
}

function normalizeSectionTitle(title) {
  return cleanSectionTitle(title)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function isSectionLine(line) {
  const raw = String(line || "").trim();

  return raw.startsWith("[") && raw.endsWith("]");
}

function getChipClass(title) {
  const t = normalizeSectionTitle(title);

  if (t.includes("intro") || t.includes("introduccion")) return "chip-intro";
  if (t.includes("verso")) return "chip-verso";
  if (t.includes("estrofa")) return "chip-estrofa";
  if (t.includes("pre coro") || t.includes("precoro")) return "chip-precoro";
  if (t.includes("coro")) return "chip-coro";
  if (t.includes("puente") || t.includes("bridge")) return "chip-puente";
  if (t.includes("interludio")) return "chip-interludio";
  if (t.includes("intermedio") || t.includes("instrumental") || t.includes("solo")) return "chip-intermedio";
  if (t.includes("final") || t.includes("outro")) return "chip-final";

  return "chip-default";
}

function getChipLabel(title) {
  const t = normalizeSectionTitle(title);

  const numMatch = t.match(/\d+/);
  const num = numMatch ? numMatch[0] : "";

  if (t.includes("intro") || t.includes("introduccion")) return num ? `I${num}` : "I";
  if (t.includes("verso")) return num ? `V${num}` : "V";
  if (t.includes("estrofa")) return num ? `E${num}` : "E";
  if (t.includes("pre coro") || t.includes("precoro")) return num ? `PC${num}` : "PC";
  if (t.includes("coro final")) return "CF";
  if (t.includes("coro")) return num ? `C${num}` : "C";
  if (t.includes("puente") || t.includes("bridge")) return "P";
  if (t.includes("interludio")) return "INT";
  if (t.includes("intermedio")) return "IM";
  if (t.includes("instrumental")) return "INS";
  if (t.includes("solo")) return "S";
  if (t.includes("final") || t.includes("outro")) return "F";

  return title.length > 10 ? title.substring(0, 10) : title;
}

function parseLyricsSections(text) {
  const lines = String(text || "").split("\n");
  const sections = [];
  let currentSection = null;

  lines.forEach(line => {
    const trimmed = line.trim();

    if (trimmed && isSectionLine(trimmed)) {
      if (currentSection) {
        sections.push(currentSection);
      }

      currentSection = {
        title: cleanSectionTitle(trimmed),
        lines: []
      };
    } else {
      if (!currentSection) {
        currentSection = {
          title: "Letra",
          lines: []
        };
      }

      currentSection.lines.push(line);
    }
  });

  if (currentSection) {
    sections.push(currentSection);
  }

  return sections.filter(section => {
    return section.title || section.lines.join("").trim();
  });
}

function renderChordLine(line) {
  const value = String(line || "");

  const regex = /(^|\s)([^\s()]*?)\(([^)]+)\)([^\s()]*)/g;

  let html = "";
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(value)) !== null) {
    const separator = match[1] || "";
    const prefix = match[2] || "";
    const chord = match[3] || "";
    const suffix = match[4] || "";

    html += escapeHTML(value.slice(lastIndex, match.index));
    html += escapeHTML(separator);

    if (prefix && suffix) {
      html += `
        <span class="chord-split-word">
          <span class="chord-token">${escapeHTML(chord)}</span>
          <span class="word-prefix">${escapeHTML(prefix)}</span>
          <span class="word-token">${escapeHTML(suffix)}</span>
        </span>
      `;
    } else if (suffix) {
      html += `
        <span class="chord-word">
          <span class="chord-token">${escapeHTML(chord)}</span>
          <span class="word-token">${escapeHTML(suffix)}</span>
        </span>
      `;
    } else {
      html += `<span class="chord-alone">${escapeHTML(chord)}</span>`;
    }

    lastIndex = regex.lastIndex;
  }

  html += escapeHTML(value.slice(lastIndex));

  return html;
}

function renderLyricsLines(lines) {
  return lines.map(line => {
    if (line.trim() === "") {
      return `<span class="lyrics-app-line lyrics-empty-line"></span>`;
    }

    return `<span class="lyrics-app-line">${renderChordLine(line)}</span>`;
  }).join("");
}

function renderLyricsHTML(text) {
  if (!text || !String(text).trim()) {
    return `
      <div class="lyrics-app-view">
        <div class="lyrics-app-section">
          <div class="lyrics-app-chip chip-default">TXT</div>
          <div class="lyrics-app-content">
            <span class="lyrics-app-line">No hay letra disponible todavía.</span>
          </div>
        </div>
      </div>
    `;
  }

  const sections = parseLyricsSections(text);

  return `
    <div class="lyrics-app-view">
      ${sections.map(section => {
        const chipClass = getChipClass(section.title);
        const chipLabel = getChipLabel(section.title);

        return `
          <div class="lyrics-app-section">
            <div class="lyrics-app-chip ${chipClass}" title="${escapeHTML(section.title)}">
              ${escapeHTML(chipLabel)}
            </div>

            <div class="lyrics-app-content">
              ${renderLyricsLines(section.lines)}
            </div>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

function showLyrics() {
  const lyricsBox = document.getElementById("songLyrics");

  if (lyricsBox) {
    const transposedText = transposeText(originalLyrics, transposeAmount);
    lyricsBox.innerHTML = renderLyricsHTML(transposedText);
  }

  const label = document.getElementById("chordLanguageLabel");

  if (label) {
    label.innerText = chordLanguage === "spanish"
      ? "Cifrado actual: Español"
      : "Cifrado actual: Inglés";
  }
}


/* =========================================================
   INICIO - CANCIONES RECIENTES
========================================================= */

async function loadHomeSongs() {
  const homeSongList = document.getElementById("homeSongList");

  if (!homeSongList) return;

  const client = getSupabase();

  if (!client) {
    homeSongList.innerHTML = `
      <div class="song-card">
        <h3>No se pudo conectar</h3>
        <p style="color:var(--secondary); margin-top:15px;">
          Intenta actualizar la página más tarde.
        </p>
      </div>
    `;
    return;
  }

  const { data, error } = await client
    .from("songs")
    .select("*, artists(name, slug), categories(name, slug)")
    .order("created_at", { ascending: false })
    .limit(6);

  if (error) {
    homeSongList.innerHTML = `
      <div class="song-card">
        <h3>Error cargando canciones</h3>
        <p style="color:var(--secondary); margin-top:15px;">
          Intenta actualizar la página más tarde.
        </p>
      </div>
    `;
    return;
  }

  if (!data || data.length === 0) {
    homeSongList.innerHTML = `
      <div class="song-card">
        <h3>No hay canciones todavía</h3>
        <p style="color:var(--secondary); margin-top:15px;">
          Muy pronto se agregarán cantos, letras y acordes.
        </p>
      </div>
    `;
    return;
  }

  homeSongList.innerHTML = "";

  data.forEach(song => {
    const title = song.title || "Sin título";
    const artistName = song.artists ? song.artists.name : "Sin artista";
    const categoryName = song.categories ? song.categories.name : "Sin categoría";

    homeSongList.innerHTML += `
      <article class="song-card" data-title="${escapeHTML(`${title} ${artistName} ${categoryName}`.toLowerCase())}">
        <h3>🎵 ${escapeHTML(title)}</h3>
        <p>👤 ${escapeHTML(artistName)}</p>
        <p>✝ ${escapeHTML(categoryName)}</p>
        <p>🎸 Tono: ${escapeHTML(safeText(song.tone, "No definido"))}</p>
        <p>⭐ ${escapeHTML(safeText(song.difficulty, "Sin dificultad"))}</p>
        <a class="song-btn" href="canto.html?id=${encodeURIComponent(song.slug)}">Ver canto</a>
      </article>
    `;
  });
}

function searchHomeSongs() {
  const input = document.getElementById("homeSearch");
  const cards = document.querySelectorAll("#homeSongList .song-card");
  const noResults = document.getElementById("noHomeResults");

  if (!input || cards.length === 0) return;

  const value = input.value.toLowerCase().trim();
  let found = 0;

  cards.forEach(card => {
    const title = card.dataset.title || "";

    if (title.includes(value)) {
      card.style.display = "block";
      found++;
    } else {
      card.style.display = "none";
    }
  });

  if (noResults) {
    noResults.style.display = found === 0 ? "block" : "none";
  }
}


/* =========================================================
   CANCIONES PÚBLICAS
========================================================= */

async function loadPublicSongs() {
  const songList = document.getElementById("songList");

  if (!songList) return;

  const client = getSupabase();

  if (!client) {
    songList.innerHTML = `
      <div class="song-card">
        <h3>No se pudo conectar</h3>
        <p style="color:var(--secondary); margin-top:15px;">
          Intenta actualizar la página más tarde.
        </p>
      </div>
    `;
    return;
  }

  const { data, error } = await client
    .from("songs")
    .select("*, artists(name, slug), categories(name, slug)")
    .order("title");

  if (error) {
    songList.innerHTML = `
      <div class="song-card">
        <h3>Error cargando canciones</h3>
        <p style="color:var(--secondary); margin-top:15px;">
          Intenta actualizar la página más tarde.
        </p>
      </div>
    `;
    return;
  }

  if (!data || data.length === 0) {
    songList.innerHTML = `
      <div class="song-card">
        <h3>No hay canciones todavía</h3>
        <p style="color:var(--secondary); margin-top:15px;">
          Muy pronto se agregarán cantos, letras y acordes.
        </p>
      </div>
    `;
    return;
  }

  songList.innerHTML = "";

  data.forEach(song => {
    const title = song.title || "Sin título";
    const artistName = song.artists ? song.artists.name : "Sin artista";
    const categoryName = song.categories ? song.categories.name : "Sin categoría";

    songList.innerHTML += `
      <article class="song-card"
        data-category="${escapeHTML(categoryName.toLowerCase())}"
        data-title="${escapeHTML(`${title} ${artistName} ${categoryName}`.toLowerCase())}">
        <h3>🎵 ${escapeHTML(title)}</h3>
        <p>👤 ${escapeHTML(artistName)}</p>
        <p>✝ ${escapeHTML(categoryName)}</p>
        <p>🎸 Tono: ${escapeHTML(safeText(song.tone, "No definido"))}</p>
        <p>⭐ ${escapeHTML(safeText(song.difficulty, "Sin dificultad"))}</p>
        <a class="song-btn" href="canto.html?id=${encodeURIComponent(song.slug)}">Ver canto</a>
      </article>
    `;
  });

  const songSearch = document.getElementById("songSearch");
  const initialQuery = new URLSearchParams(window.location.search).get("buscar");

  if (songSearch && initialQuery) {
    songSearch.value = initialQuery.toLowerCase();
    filterSongCards();
  }
}

function filterSongCards() {
  const songSearch = document.getElementById("songSearch");
  const cards = document.querySelectorAll("#songList .song-card");
  const noResults = document.getElementById("noResults");

  if (!songSearch) return;

  const value = songSearch.value.toLowerCase().trim();
  let found = 0;

  cards.forEach(card => {
    const title = card.dataset.title || "";

    if (title.includes(value)) {
      card.style.display = "block";
      found++;
    } else {
      card.style.display = "none";
    }
  });

  if (noResults) {
    noResults.style.display = found === 0 ? "block" : "none";
  }
}

function filterSongs(category) {
  const cards = document.querySelectorAll("#songList .song-card");
  const noResults = document.getElementById("noResults");

  let found = 0;

  cards.forEach(card => {
    const data = card.dataset.category || "";

    if (category === "todos" || data.includes(category)) {
      card.style.display = "block";
      found++;
    } else {
      card.style.display = "none";
    }
  });

  if (noResults) {
    noResults.style.display = found === 0 ? "block" : "none";
  }
}


/* =========================================================
   CANTO INDIVIDUAL
========================================================= */

async function loadSingleSong() {
  const songTitle = document.getElementById("songTitle");
  const songInfo = document.getElementById("songInfo");

  if (!songTitle || !songInfo) return;

  const client = getSupabase();

  if (!client) {
    songTitle.innerText = "No se pudo conectar";
    return;
  }

  const slug = new URLSearchParams(window.location.search).get("id");

  if (!slug) {
    songTitle.innerText = "Canto no encontrado";
    songInfo.innerText = "No se especificó ningún canto.";
    return;
  }

  const { data, error } = await client
    .from("songs")
    .select("*, artists(name, slug), categories(name, slug)")
    .eq("slug", slug)
    .single();

  if (error || !data) {
    songTitle.innerText = "Canto no encontrado";
    songInfo.innerText = "Este canto todavía no existe o fue eliminado.";
    return;
  }

  const artistName = data.artists ? data.artists.name : "Sin artista";
  const categoryName = data.categories ? data.categories.name : "Sin categoría";

  songTitle.innerText = data.title || "Sin título";
  songInfo.innerText = `${artistName} · ${categoryName} · Tono ${safeText(data.tone, "No definido")}`;

  originalLyrics = data.lyrics || "";
  transposeAmount = 0;
  showLyrics();

  const tutorialGuitar = document.getElementById("tutorialGuitar");
  const tutorialPiano = document.getElementById("tutorialPiano");

  if (tutorialGuitar) {
    const guitarUrl = safeUrl(data.tutorial_guitar);
    tutorialGuitar.href = guitarUrl || "#";
    tutorialGuitar.style.display = guitarUrl ? "inline-block" : "none";
  }

  if (tutorialPiano) {
    const pianoUrl = safeUrl(data.tutorial_piano);
    tutorialPiano.href = pianoUrl || "#";
    tutorialPiano.style.display = pianoUrl ? "inline-block" : "none";
  }
}


/* =========================================================
   ARTISTAS
========================================================= */

async function loadPublicArtists() {
  const artistList = document.getElementById("artistList");

  if (!artistList) return;

  const client = getSupabase();

  if (!client) {
    artistList.innerHTML = `
      <div class="song-card">
        <h3>No se pudo conectar</h3>
      </div>
    `;
    return;
  }

  const { data, error } = await client
    .from("artists")
    .select("*")
    .order("name");

  if (error) {
    artistList.innerHTML = `
      <div class="song-card">
        <h3>Error cargando artistas</h3>
      </div>
    `;
    return;
  }

  if (!data || data.length === 0) {
    artistList.innerHTML = `
      <div class="song-card">
        <h3>No hay artistas todavía</h3>
        <p style="color:var(--secondary); margin-top:15px;">
          Muy pronto se agregarán artistas y ministerios.
        </p>
      </div>
    `;
    return;
  }

  artistList.innerHTML = "";

  data.forEach(artist => {
    const name = artist.name || "Sin nombre";
    const avatar = safeUrl(artist.avatar_url);

    const avatarContent = avatar
      ? `<img src="${escapeHTML(avatar)}" alt="${escapeHTML(name)}" loading="lazy" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`
      : getInitial(name);

    artistList.innerHTML += `
      <article class="song-card artist-card" data-title="${escapeHTML(`${name} ${artist.description || ""}`.toLowerCase())}">
        <div class="artist-avatar">${avatarContent}</div>
        <h3>${escapeHTML(name)}</h3>
        <p>${escapeHTML(artist.description || "Sin descripción todavía.")}</p>
        <a class="song-btn" href="artista.html?id=${encodeURIComponent(artist.slug)}">Ver perfil</a>
      </article>
    `;
  });
}

async function loadArtistProfile() {
  const artistName = document.getElementById("artistName");
  const artistDescription = document.getElementById("artistDescription");
  const artistTags = document.getElementById("artistTags");
  const artistAvatar = document.getElementById("artistAvatar");
  const artistSongsList = document.getElementById("artistSongsList");

  if (!artistName || !artistSongsList) return;

  const client = getSupabase();

  if (!client) {
    artistName.innerText = "No se pudo conectar";
    return;
  }

  const slug = new URLSearchParams(window.location.search).get("id");

  if (!slug) {
    artistName.innerText = "Artista no encontrado";
    return;
  }

  const { data: artist, error } = await client
    .from("artists")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !artist) {
    artistName.innerText = "Artista no encontrado";
    artistDescription.innerText = "Este artista todavía no existe o fue eliminado.";
    return;
  }

  artistName.innerText = artist.name || "Sin nombre";
  artistDescription.innerText = artist.description || "Sin descripción todavía.";
  artistTags.innerText = "Artista / Ministerio";

  const avatar = safeUrl(artist.avatar_url);

  if (artistAvatar) {
    if (avatar) {
      artistAvatar.innerHTML = `<img src="${escapeHTML(avatar)}" alt="${escapeHTML(artist.name)}" loading="lazy" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`;
    } else {
      artistAvatar.innerText = getInitial(artist.name);
    }
  }

  const { data: songsData } = await client
    .from("songs")
    .select("*, categories(name)")
    .eq("artist_id", artist.id)
    .order("title");

  artistSongsList.innerHTML = "";

  if (!songsData || songsData.length === 0) {
    artistSongsList.innerHTML = `
      <div class="song-card">
        <h3>No hay canciones todavía</h3>
        <p style="color:var(--secondary); margin-top:15px;">
          Muy pronto se agregarán cantos para este artista.
        </p>
      </div>
    `;
    return;
  }

  songsData.forEach(song => {
    const categoryName = song.categories ? song.categories.name : "Sin categoría";

    artistSongsList.innerHTML += `
      <article class="song-card">
        <h3>🎵 ${escapeHTML(song.title || "Sin título")}</h3>
        <p>✝ ${escapeHTML(categoryName)}</p>
        <p>🎸 Tono: ${escapeHTML(safeText(song.tone, "No definido"))}</p>
        <p>⭐ ${escapeHTML(safeText(song.difficulty, "Sin dificultad"))}</p>
        <a class="song-btn" href="canto.html?id=${encodeURIComponent(song.slug)}">Ver canto</a>
      </article>
    `;
  });
}


/* =========================================================
   CATEGORÍAS
========================================================= */

async function loadPublicCategories() {
  const categoryList = document.getElementById("categoryList");

  if (!categoryList) return;

  const client = getSupabase();

  if (!client) {
    categoryList.innerHTML = `
      <div class="song-card">
        <h3>No se pudo conectar</h3>
      </div>
    `;
    return;
  }

  const { data, error } = await client
    .from("categories")
    .select("*")
    .order("name");

  if (error) {
    categoryList.innerHTML = `
      <div class="song-card">
        <h3>Error cargando categorías</h3>
      </div>
    `;
    return;
  }

  if (!data || data.length === 0) {
    categoryList.innerHTML = `
      <div class="song-card">
        <h3>No hay categorías todavía</h3>
        <p style="color:var(--secondary); margin-top:15px;">
          Muy pronto se agregarán categorías.
        </p>
      </div>
    `;
    return;
  }

  categoryList.innerHTML = "";

  data.forEach(category => {
    const name = category.name || "Sin nombre";

    categoryList.innerHTML += `
      <article class="song-card category-card" data-title="${escapeHTML(`${name} ${category.description || ""}`.toLowerCase())}">
        <div class="category-icon">🎵</div>
        <h3>${escapeHTML(name)}</h3>
        <p>${escapeHTML(category.description || "Sin descripción todavía.")}</p>
        <a class="song-btn" href="canciones.html?buscar=${encodeURIComponent(name)}">Ver cantos</a>
      </article>
    `;
  });
}


/* =========================================================
   DONACIONES PÚBLICAS
========================================================= */

function donationRow(label, value, canCopy = false) {
  const rawValue = String(value || "").trim();

  if (!rawValue) return "";

  const encoded = encodeURIComponent(rawValue);

  return `
    <div class="donation-row">
      <span class="donation-label">${escapeHTML(label)}</span>
      <span class="donation-value">${escapeHTML(rawValue)}</span>
      ${canCopy ? `<button class="copy-btn" onclick="copyDonationText(decodeURIComponent('${encoded}'))">Copiar</button>` : ""}
    </div>
  `;
}

async function copyDonationText(text) {
  try {
    await navigator.clipboard.writeText(text);
    alert("Dato copiado");
  } catch (error) {
    alert("No se pudo copiar. Selecciona el texto manualmente.");
  }
}

async function loadPublicDonationCards() {
  const donationCardsList = document.getElementById("donationCardsList");

  if (!donationCardsList) return;

  const client = getSupabase();

  if (!client) {
    donationCardsList.innerHTML = `
      <div class="song-card">
        <h3>No se pudo conectar</h3>
      </div>
    `;
    return;
  }

  const { data, error } = await client
    .from("donation_cards")
    .select("*")
    .eq("is_active", true)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    donationCardsList.innerHTML = `
      <div class="song-card">
        <h3>Error cargando donaciones</h3>
      </div>
    `;
    return;
  }

  if (!data || data.length === 0) {
    donationCardsList.innerHTML = `
      <div class="song-card">
        <h3>Muy pronto</h3>
        <p style="color:var(--secondary); margin-top:12px;">
          Próximamente se agregarán formas de apoyar este proyecto.
        </p>
      </div>
    `;
    return;
  }

  donationCardsList.innerHTML = "";

  data.forEach(card => {
    const link = safeUrl(card.link_url);

    donationCardsList.innerHTML += `
      <article class="song-card donation-card">
        <span class="donation-badge">${escapeHTML(card.payment_type || "Donación")}</span>

        <h3>${escapeHTML(card.title || "Donación")}</h3>

        ${card.description ? `<p>${escapeHTML(card.description)}</p>` : ""}

        <div class="donation-info">
          ${donationRow("Nombre", card.account_name)}
          ${donationRow("Banco", card.bank_name)}
          ${donationRow("Cuenta", card.account_number, true)}
          ${donationRow("CLABE", card.clabe, true)}
          ${donationRow("Tarjeta", card.card_number, true)}
          ${donationRow("Teléfono", card.phone, true)}
        </div>

        ${link ? `
          <div class="donation-link">
            <a class="song-btn" href="${escapeHTML(link)}" target="_blank" rel="noopener">
              Abrir enlace
            </a>
          </div>
        ` : ""}

        ${card.note ? `
          <div class="donation-note">
            ${escapeHTML(card.note)}
          </div>
        ` : ""}
      </article>
    `;
  });
}


/* =========================================================
   ADMIN - APARTADOS, ACORDES Y VISTA PREVIA
========================================================= */

function insertSongSection(sectionName) {
  const textarea = document.getElementById("songLyricsInput");

  if (!textarea) {
    alert("No se encontró el campo de letra.");
    return;
  }

  const start = textarea.selectionStart || 0;
  const end = textarea.selectionEnd || 0;
  const currentValue = textarea.value || "";

  const before = currentValue.substring(0, start);
  const after = currentValue.substring(end);

  const needsLineBefore = before.length > 0 && !before.endsWith("\n");
  const textToInsert = `${needsLineBefore ? "\n\n" : ""}[${sectionName}]\n`;

  textarea.value = before + textToInsert + after;
  textarea.focus();

  const newPosition = before.length + textToInsert.length;
  textarea.selectionStart = newPosition;
  textarea.selectionEnd = newPosition;

  updateLyricsPreview();
}

function insertSongTemplate() {
  const textarea = document.getElementById("songLyricsInput");

  if (!textarea) {
    alert("No se encontró el campo de letra.");
    return;
  }

  const template = `[Intro]


[Verso 1]


[Pre Coro]


[Coro]


[Verso 2]


[Puente]


[Coro Final]


[Final]

`;

  if (textarea.value.trim()) {
    textarea.value = textarea.value.trimEnd() + "\n\n" + template;
  } else {
    textarea.value = template;
  }

  textarea.focus();
  updateLyricsPreview();
}

function createLyricsToolbar() {
  const textarea = document.getElementById("songLyricsInput");

  if (!textarea) return;
  if (document.getElementById("jhdLyricsToolbar")) return;

  const toolbar = document.createElement("div");
  toolbar.id = "jhdLyricsToolbar";
  toolbar.className = "section-toolbar-box";

  toolbar.innerHTML = `
    <div class="section-toolbar-title">Apartados de la canción</div>

    <div class="section-toolbar">
      <button type="button" class="section-chip" onclick="insertSongSection('Intro')">Intro</button>
      <button type="button" class="section-chip" onclick="insertSongSection('Verso 1')">Verso 1</button>
      <button type="button" class="section-chip" onclick="insertSongSection('Pre Coro')">Pre Coro</button>
      <button type="button" class="section-chip" onclick="insertSongSection('Coro')">Coro</button>
      <button type="button" class="section-chip" onclick="insertSongSection('Verso 2')">Verso 2</button>
      <button type="button" class="section-chip" onclick="insertSongSection('Verso 3')">Verso 3</button>
      <button type="button" class="section-chip" onclick="insertSongSection('Puente')">Puente</button>
      <button type="button" class="section-chip" onclick="insertSongSection('Interludio')">Interludio</button>
      <button type="button" class="section-chip" onclick="insertSongSection('Coro Final')">Coro Final</button>
      <button type="button" class="section-chip" onclick="insertSongSection('Final')">Final</button>
      <button type="button" class="section-chip section-template-btn" onclick="insertSongTemplate()">Plantilla completa</button>
    </div>

    <p class="lyrics-helper">
      Usa [ ] para apartados y ( ) para acordes. Ejemplo: [Verso 1] y (G)María.
    </p>
  `;

  textarea.parentNode.insertBefore(toolbar, textarea);
}

function isValidChord(chord) {
  return /^[A-G](?:#|b)?(?:m|maj7|maj9|m7|m9|7|9|11|13|6|sus4|sus2|dim|aug|add9)?(?:\/[A-G](?:#|b)?)?$/.test(chord);
}

function insertChordAtCursor(chordValue) {
  const textarea = document.getElementById("songLyricsInput");

  if (!textarea) {
    alert("No se encontró el campo de letra.");
    return;
  }

  const chordInput = document.getElementById("jhdCustomChordInput");
  const chordRaw = String(chordValue || (chordInput ? chordInput.value : "") || "").trim();

  if (!chordRaw) {
    alert("Escribe o selecciona un acorde.");
    return;
  }

  const cleanChord = chordRaw.replace(/[()]/g, "").trim();

  if (!isValidChord(cleanChord)) {
    alert("Ese acorde no parece válido. Ejemplo: G, Bm, F#m, C/E");
    return;
  }

  const value = textarea.value || "";
  const cursor = textarea.selectionStart || 0;
  const insertText = `(${cleanChord})`;

  textarea.value = value.slice(0, cursor) + insertText + value.slice(cursor);
  textarea.focus();

  const newCursor = cursor + insertText.length;
  textarea.setSelectionRange(newCursor, newCursor);

  updateLyricsPreview();
}

function createChordHelper() {
  const textarea = document.getElementById("songLyricsInput");

  if (!textarea) return;
  if (document.getElementById("jhdChordHelperBox")) return;

  const box = document.createElement("div");
  box.id = "jhdChordHelperBox";
  box.className = "chord-helper-box";

  box.innerHTML = `
    <div class="chord-helper-title">Asistente de acordes</div>

    <div class="chord-helper-help">
      Coloca el cursor antes de la palabra o sílaba donde cambia el acorde y presiona un acorde.
      Se insertará como (G), (D), (Em), etc.
    </div>

    <div class="chord-helper-row">
      <button type="button" class="chord-helper-btn" onclick="insertChordAtCursor('G')">G</button>
      <button type="button" class="chord-helper-btn" onclick="insertChordAtCursor('D')">D</button>
      <button type="button" class="chord-helper-btn" onclick="insertChordAtCursor('Em')">Em</button>
      <button type="button" class="chord-helper-btn" onclick="insertChordAtCursor('C')">C</button>
      <button type="button" class="chord-helper-btn" onclick="insertChordAtCursor('Am')">Am</button>
      <button type="button" class="chord-helper-btn" onclick="insertChordAtCursor('F')">F</button>
      <button type="button" class="chord-helper-btn" onclick="insertChordAtCursor('Bm')">Bm</button>
      <button type="button" class="chord-helper-btn" onclick="insertChordAtCursor('A')">A</button>

      <input id="jhdCustomChordInput" class="chord-helper-input" type="text" placeholder="Otro: F#m">

      <button type="button" class="chord-helper-main-btn" onclick="insertChordAtCursor()">
        Insertar acorde
      </button>
    </div>
  `;

  const toolbar = document.getElementById("jhdLyricsToolbar");

  if (toolbar) {
    toolbar.parentNode.insertBefore(box, toolbar.nextSibling);
  } else {
    textarea.parentNode.insertBefore(box, textarea);
  }
}

function createLyricsPreview() {
  const textarea = document.getElementById("songLyricsInput");

  if (!textarea) return;
  if (document.getElementById("jhdLyricsPreviewWrapper")) return;

  const wrapper = document.createElement("div");
  wrapper.id = "jhdLyricsPreviewWrapper";

  wrapper.innerHTML = `
    <div class="lyrics-preview-tools">
      <button type="button" class="lyrics-preview-btn" onclick="showLyricsPreview()">
        Ver vista previa
      </button>

      <button type="button" class="lyrics-preview-btn secondary" onclick="updateLyricsPreview()">
        Actualizar vista previa
      </button>

      <button type="button" class="lyrics-preview-btn secondary" onclick="hideLyricsPreview()">
        Ocultar vista previa
      </button>
    </div>

    <div class="lyrics-preview-box" id="jhdLyricsPreviewBox" style="display:none;">
      <h4>Vista previa de la canción</h4>
      <div class="lyrics-preview-content" id="jhdLyricsPreviewContent">
        Aquí aparecerá la vista previa.
      </div>
    </div>
  `;

  textarea.parentNode.insertBefore(wrapper, textarea.nextSibling);

  textarea.addEventListener("input", () => {
    const previewBox = document.getElementById("jhdLyricsPreviewBox");

    if (previewBox && previewBox.classList.contains("show")) {
      updateLyricsPreview();
    }
  });
}

function updateLyricsPreview() {
  const textarea = document.getElementById("songLyricsInput");
  const previewContent = document.getElementById("jhdLyricsPreviewContent");

  if (!textarea || !previewContent) return;

  previewContent.innerHTML = renderLyricsHTML(textarea.value);
}

function showLyricsPreview() {
  const previewBox = document.getElementById("jhdLyricsPreviewBox");

  if (!previewBox) return;

  previewBox.classList.add("show");
  previewBox.style.display = "block";
  updateLyricsPreview();
}

function hideLyricsPreview() {
  const previewBox = document.getElementById("jhdLyricsPreviewBox");

  if (!previewBox) return;

  previewBox.classList.remove("show");
  previewBox.style.display = "none";
}

function initAdminLyricsTools() {
  createLyricsToolbar();
  createChordHelper();
  createLyricsPreview();

  setTimeout(createLyricsToolbar, 500);
  setTimeout(createChordHelper, 700);
  setTimeout(createLyricsPreview, 900);

  setTimeout(createLyricsToolbar, 1500);
  setTimeout(createChordHelper, 1700);
  setTimeout(createLyricsPreview, 1900);
}


/* =========================================================
   ADMIN - DONACIONES
========================================================= */

let editingDonationId = null;

function setupDonationAdminSection() {
  const adminPanel = document.getElementById("adminPanel");

  if (!adminPanel) return;
  if (document.getElementById("donationAdminSection")) return;

  const section = document.createElement("section");
  section.className = "section";
  section.id = "donationAdminSection";

  section.innerHTML = `
    <h2>Donaciones</h2>

    <div class="song-grid">
      <div class="song-card">
        <h3 id="donationFormTitle">Agregar tarjeta de donación</h3>

        <div class="donation-admin-form">
          <input id="donationTitleInput" type="text" placeholder="Título, ejemplo: Transferencia bancaria">

          <select id="donationTypeInput">
            <option value="Transferencia">Transferencia</option>
            <option value="Depósito">Depósito</option>
            <option value="Tarjeta">Tarjeta</option>
            <option value="Link externo">Link externo</option>
            <option value="Otro">Otro</option>
          </select>

          <input id="donationAccountNameInput" type="text" placeholder="Nombre del titular">
          <input id="donationBankInput" type="text" placeholder="Banco">

          <input id="donationAccountInput" type="text" placeholder="Número de cuenta">
          <input id="donationClabeInput" type="text" placeholder="CLABE">

          <input id="donationCardInput" type="text" placeholder="Número de tarjeta">
          <input id="donationPhoneInput" type="text" placeholder="Teléfono">

          <input id="donationOrderInput" type="number" placeholder="Orden, ejemplo: 1">

          <label class="donation-active-row">
            <input id="donationActiveInput" type="checkbox" checked>
            Mostrar esta tarjeta en la página pública
          </label>

          <input class="donation-admin-wide" id="donationLinkInput" type="url" placeholder="Link externo opcional">

          <textarea class="donation-admin-wide" id="donationDescriptionInput" placeholder="Descripción breve"></textarea>

          <textarea class="donation-admin-wide" id="donationNoteInput" placeholder="Nota opcional"></textarea>
        </div>

        <button class="song-btn" onclick="saveDonationCard()">Guardar tarjeta</button>
        <button class="song-btn secondary-btn" onclick="cancelDonationEdit()">Cancelar edición</button>
      </div>

      <div class="song-card">
        <h3>Tarjetas de donación guardadas</h3>
        <div id="adminDonationCardsList">
          <p style="color:var(--secondary); margin-top:12px;">Cargando...</p>
        </div>
      </div>
    </div>
  `;

  adminPanel.appendChild(section);
  loadAdminDonationCards();
}

function getDonationFormData() {
  return {
    title: String(document.getElementById("donationTitleInput").value || "").trim(),
    payment_type: String(document.getElementById("donationTypeInput").value || "").trim(),
    account_name: String(document.getElementById("donationAccountNameInput").value || "").trim(),
    bank_name: String(document.getElementById("donationBankInput").value || "").trim(),
    account_number: String(document.getElementById("donationAccountInput").value || "").trim(),
    clabe: String(document.getElementById("donationClabeInput").value || "").trim(),
    card_number: String(document.getElementById("donationCardInput").value || "").trim(),
    phone: String(document.getElementById("donationPhoneInput").value || "").trim(),
    link_url: String(document.getElementById("donationLinkInput").value || "").trim(),
    description: String(document.getElementById("donationDescriptionInput").value || "").trim(),
    note: String(document.getElementById("donationNoteInput").value || "").trim(),
    display_order: Number(document.getElementById("donationOrderInput").value || 0),
    is_active: document.getElementById("donationActiveInput").checked,
    updated_at: new Date().toISOString()
  };
}

function clearDonationForm() {
  editingDonationId = null;

  const title = document.getElementById("donationFormTitle");

  if (title) {
    title.innerText = "Agregar tarjeta de donación";
  }

  [
    "donationTitleInput",
    "donationAccountNameInput",
    "donationBankInput",
    "donationAccountInput",
    "donationClabeInput",
    "donationCardInput",
    "donationPhoneInput",
    "donationLinkInput",
    "donationDescriptionInput",
    "donationNoteInput",
    "donationOrderInput"
  ].forEach(id => {
    const input = document.getElementById(id);

    if (input) {
      input.value = "";
    }
  });

  const typeInput = document.getElementById("donationTypeInput");
  const activeInput = document.getElementById("donationActiveInput");

  if (typeInput) typeInput.value = "Transferencia";
  if (activeInput) activeInput.checked = true;
}

async function saveDonationCard() {
  const client = getSupabase();

  if (!client) {
    alert("No se pudo conectar con Supabase");
    return;
  }

  const payload = getDonationFormData();

  if (!payload.title) {
    alert("Escribe un título para la tarjeta de donación");
    return;
  }

  let result;

  if (editingDonationId) {
    result = await client
      .from("donation_cards")
      .update(payload)
      .eq("id", editingDonationId);
  } else {
    result = await client
      .from("donation_cards")
      .insert([payload]);
  }

  if (result.error) {
    alert("Error al guardar: " + result.error.message);
    return;
  }

  alert("Tarjeta guardada");
  clearDonationForm();
  loadAdminDonationCards();
  loadPublicDonationCards();
}

async function loadAdminDonationCards() {
  const list = document.getElementById("adminDonationCardsList");

  if (!list) return;

  const client = getSupabase();

  if (!client) {
    list.innerHTML = `<p style="color:var(--secondary);">No se pudo conectar.</p>`;
    return;
  }

  const { data, error } = await client
    .from("donation_cards")
    .select("*")
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    list.innerHTML = `
      <p style="color:var(--secondary);">
        Inicia sesión para administrar donaciones.
      </p>
    `;
    return;
  }

  if (!data || data.length === 0) {
    list.innerHTML = `<p style="color:var(--secondary);">No hay tarjetas todavía.</p>`;
    return;
  }

  list.innerHTML = "";

  data.forEach(card => {
    list.innerHTML += `
      <div class="admin-list-item">
        <div>
          <strong>${escapeHTML(card.title)}</strong>
          <p style="color:var(--secondary); margin-top:6px;">
            ${escapeHTML(card.payment_type || "Donación")} ·
            ${card.is_active ? "Visible" : "Oculta"} ·
            Orden: ${card.display_order || 0}
          </p>
        </div>

        <div>
          <button onclick="editDonationCard('${card.id}')">Editar</button>
          <button onclick="deleteDonationCard('${card.id}')">Eliminar</button>
        </div>
      </div>
    `;
  });
}

async function editDonationCard(id) {
  const client = getSupabase();

  if (!client) return;

  const { data, error } = await client
    .from("donation_cards")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    alert("No se pudo cargar la tarjeta");
    return;
  }

  editingDonationId = id;

  document.getElementById("donationFormTitle").innerText = "Editando tarjeta de donación";
  document.getElementById("donationTitleInput").value = data.title || "";
  document.getElementById("donationTypeInput").value = data.payment_type || "Transferencia";
  document.getElementById("donationAccountNameInput").value = data.account_name || "";
  document.getElementById("donationBankInput").value = data.bank_name || "";
  document.getElementById("donationAccountInput").value = data.account_number || "";
  document.getElementById("donationClabeInput").value = data.clabe || "";
  document.getElementById("donationCardInput").value = data.card_number || "";
  document.getElementById("donationPhoneInput").value = data.phone || "";
  document.getElementById("donationLinkInput").value = data.link_url || "";
  document.getElementById("donationDescriptionInput").value = data.description || "";
  document.getElementById("donationNoteInput").value = data.note || "";
  document.getElementById("donationOrderInput").value = data.display_order || 0;
  document.getElementById("donationActiveInput").checked = data.is_active;

  document.getElementById("donationTitleInput").scrollIntoView({
    behavior: "smooth",
    block: "center"
  });
}

function cancelDonationEdit() {
  clearDonationForm();
}

async function deleteDonationCard(id) {
  const confirmDelete = confirm("¿Eliminar esta tarjeta de donación?");

  if (!confirmDelete) return;

  const client = getSupabase();

  if (!client) return;

  const { error } = await client
    .from("donation_cards")
    .delete()
    .eq("id", id);

  if (error) {
    alert("Error al eliminar: " + error.message);
    return;
  }

  alert("Tarjeta eliminada");
  clearDonationForm();
  loadAdminDonationCards();
  loadPublicDonationCards();
}


/* =========================================================
   BUSCADORES
========================================================= */

function initSearchHandlers() {
  const homeSearch = document.getElementById("homeSearch");
  const songSearch = document.getElementById("songSearch");
  const artistSearch = document.getElementById("artistSearch");
  const categorySearch = document.getElementById("categorySearch");

  if (homeSearch) {
    homeSearch.addEventListener("keyup", searchHomeSongs);
  }

  if (songSearch) {
    songSearch.addEventListener("keyup", filterSongCards);
  }

  if (artistSearch) {
    artistSearch.addEventListener("keyup", () => {
      const value = artistSearch.value.toLowerCase().trim();
      const cards = document.querySelectorAll("#artistList .song-card");
      const noResults = document.getElementById("noArtistResults");
      let found = 0;

      cards.forEach(card => {
        const title = card.dataset.title || "";

        if (title.includes(value)) {
          card.style.display = "block";
          found++;
        } else {
          card.style.display = "none";
        }
      });

      if (noResults) {
        noResults.style.display = found === 0 ? "block" : "none";
      }
    });
  }

  if (categorySearch) {
    categorySearch.addEventListener("keyup", () => {
      const value = categorySearch.value.toLowerCase().trim();
      const cards = document.querySelectorAll("#categoryList .song-card");
      const noResults = document.getElementById("noCategoryResults");
      let found = 0;

      cards.forEach(card => {
        const title = card.dataset.title || "";

        if (title.includes(value)) {
          card.style.display = "block";
          found++;
        } else {
          card.style.display = "none";
        }
      });

      if (noResults) {
        noResults.style.display = found === 0 ? "block" : "none";
      }
    });
  }
}


/* =========================================================
   INICIALIZACIÓN
========================================================= */

function initDonationAuthListener() {
  const client = getSupabase();

  if (!client || !client.auth) return;

  client.auth.onAuthStateChange(() => {
    setupDonationAdminSection();
    loadAdminDonationCards();
    initAdminLyricsTools();
  });
}

function initApp() {
  initTheme();
  initMobileMenu();
  initSearchHandlers();

  loadHomeSongs();
  loadPublicSongs();
  loadSingleSong();
  loadPublicArtists();
  loadArtistProfile();
  loadPublicCategories();
  loadPublicDonationCards();

  initAdminLyricsTools();
  setupDonationAdminSection();
  initDonationAuthListener();
}

runWhenReady(initApp);


/* =========================================================
   FUNCIONES GLOBALES PARA BOTONES HTML
========================================================= */

window.transposeSong = transposeSong;
window.resetTranspose = resetTranspose;
window.setChordLanguage = setChordLanguage;

window.searchHomeSongs = searchHomeSongs;
window.filterSongCards = filterSongCards;
window.filterSongs = filterSongs;

window.insertSongSection = insertSongSection;
window.insertSongTemplate = insertSongTemplate;
window.insertChordAtCursor = insertChordAtCursor;

window.showLyricsPreview = showLyricsPreview;
window.hideLyricsPreview = hideLyricsPreview;
window.updateLyricsPreview = updateLyricsPreview;

window.copyDonationText = copyDonationText;
window.saveDonationCard = saveDonationCard;
window.editDonationCard = editDonationCard;
window.deleteDonationCard = deleteDonationCard;
window.cancelDonationEdit = cancelDonationEdit;
/* =========================================================
   MULTICATEGORÍAS POR CANCIÓN
   Usa tabla: song_categories
========================================================= */

function getSongCategories(song) {
  if (!song || !Array.isArray(song.song_categories)) {
    return [];
  }

  return song.song_categories
    .map(item => item.categories)
    .filter(Boolean);
}

function getSongCategoryNames(song) {
  const categories = getSongCategories(song);

  if (categories.length > 0) {
    return categories.map(category => category.name).join(", ");
  }

  if (song.categories && song.categories.name) {
    return song.categories.name;
  }

  return "Sin categoría";
}

function getSongCategorySearchText(song) {
  const categories = getSongCategories(song);

  if (categories.length > 0) {
    return categories.map(category => category.name).join(" ").toLowerCase();
  }

  if (song.categories && song.categories.name) {
    return song.categories.name.toLowerCase();
  }

  return "";
}

/* Inicio - canciones recientes con varias categorías */
async function loadHomeSongs() {
  const homeSongList = document.getElementById("homeSongList");

  if (!homeSongList) return;

  const client = getSupabase();

  if (!client) {
    homeSongList.innerHTML = `
      <div class="song-card">
        <h3>No se pudo conectar</h3>
      </div>
    `;
    return;
  }

  const { data, error } = await client
    .from("songs")
    .select(`
      *,
      artists(name, slug),
      categories(name, slug),
      song_categories(
        categories(id, name, slug)
      )
    `)
    .order("created_at", { ascending: false })
    .limit(6);

  if (error) {
    homeSongList.innerHTML = `
      <div class="song-card">
        <h3>Error cargando canciones</h3>
        <p style="color:var(--secondary); margin-top:15px;">${escapeHTML(error.message)}</p>
      </div>
    `;
    return;
  }

  if (!data || data.length === 0) {
    homeSongList.innerHTML = `
      <div class="song-card">
        <h3>No hay canciones todavía</h3>
        <p style="color:var(--secondary); margin-top:15px;">
          Muy pronto se agregarán cantos, letras y acordes.
        </p>
      </div>
    `;
    return;
  }

  homeSongList.innerHTML = "";

  data.forEach(song => {
    const title = song.title || "Sin título";
    const artistName = song.artists ? song.artists.name : "Sin artista";
    const categoryNames = getSongCategoryNames(song);

    homeSongList.innerHTML += `
      <article class="song-card" data-title="${escapeHTML(`${title} ${artistName} ${categoryNames}`.toLowerCase())}">
        <h3>🎵 ${escapeHTML(title)}</h3>
        <p>👤 ${escapeHTML(artistName)}</p>
        <p>✝ ${escapeHTML(categoryNames)}</p>
        <p>🎸 Tono: ${escapeHTML(safeText(song.tone, "No definido"))}</p>
        <p>⭐ ${escapeHTML(safeText(song.difficulty, "Sin dificultad"))}</p>
        <a class="song-btn" href="canto.html?id=${encodeURIComponent(song.slug)}">Ver canto</a>
      </article>
    `;
  });
}

/* Página canciones con varias categorías */
async function loadPublicSongs() {
  const songList = document.getElementById("songList");

  if (!songList) return;

  const client = getSupabase();

  if (!client) {
    songList.innerHTML = `
      <div class="song-card">
        <h3>No se pudo conectar</h3>
      </div>
    `;
    return;
  }

  const { data, error } = await client
    .from("songs")
    .select(`
      *,
      artists(name, slug),
      categories(name, slug),
      song_categories(
        categories(id, name, slug)
      )
    `)
    .order("title");

  if (error) {
    songList.innerHTML = `
      <div class="song-card">
        <h3>Error cargando canciones</h3>
        <p style="color:var(--secondary); margin-top:15px;">${escapeHTML(error.message)}</p>
      </div>
    `;
    return;
  }

  if (!data || data.length === 0) {
    songList.innerHTML = `
      <div class="song-card">
        <h3>No hay canciones todavía</h3>
      </div>
    `;
    return;
  }

  songList.innerHTML = "";

  data.forEach(song => {
    const title = song.title || "Sin título";
    const artistName = song.artists ? song.artists.name : "Sin artista";
    const categoryNames = getSongCategoryNames(song);
    const categorySearchText = getSongCategorySearchText(song);

    songList.innerHTML += `
      <article class="song-card"
        data-category="${escapeHTML(categorySearchText)}"
        data-title="${escapeHTML(`${title} ${artistName} ${categoryNames}`.toLowerCase())}">
        <h3>🎵 ${escapeHTML(title)}</h3>
        <p>👤 ${escapeHTML(artistName)}</p>
        <p>✝ ${escapeHTML(categoryNames)}</p>
        <p>🎸 Tono: ${escapeHTML(safeText(song.tone, "No definido"))}</p>
        <p>⭐ ${escapeHTML(safeText(song.difficulty, "Sin dificultad"))}</p>
        <a class="song-btn" href="canto.html?id=${encodeURIComponent(song.slug)}">Ver canto</a>
      </article>
    `;
  });

  const songSearch = document.getElementById("songSearch");
  const initialQuery = new URLSearchParams(window.location.search).get("buscar");

  if (songSearch && initialQuery) {
    songSearch.value = initialQuery.toLowerCase();
    filterSongCards();
  }
}

/* Página canto individual con varias categorías */
async function loadSingleSong() {
  const songTitle = document.getElementById("songTitle");
  const songInfo = document.getElementById("songInfo");

  if (!songTitle || !songInfo) return;

  const client = getSupabase();

  if (!client) {
    songTitle.innerText = "No se pudo conectar";
    return;
  }

  const slug = new URLSearchParams(window.location.search).get("id");

  if (!slug) {
    songTitle.innerText = "Canto no encontrado";
    songInfo.innerText = "No se especificó ningún canto.";
    return;
  }

  const { data, error } = await client
    .from("songs")
    .select(`
      *,
      artists(name, slug),
      categories(name, slug),
      song_categories(
        categories(id, name, slug)
      )
    `)
    .eq("slug", slug)
    .single();

  if (error || !data) {
    songTitle.innerText = "Canto no encontrado";
    songInfo.innerText = "Este canto todavía no existe o fue eliminado.";
    return;
  }

  const artistName = data.artists ? data.artists.name : "Sin artista";
  const categoryNames = getSongCategoryNames(data);

  songTitle.innerText = data.title || "Sin título";
  songInfo.innerText = `${artistName} · ${categoryNames} · Tono ${safeText(data.tone, "No definido")}`;

  originalLyrics = data.lyrics || "";
  transposeAmount = 0;
  showLyrics();

  const tutorialGuitar = document.getElementById("tutorialGuitar");
  const tutorialPiano = document.getElementById("tutorialPiano");

  if (tutorialGuitar) {
    const guitarUrl = safeUrl(data.tutorial_guitar);
    tutorialGuitar.href = guitarUrl || "#";
    tutorialGuitar.style.display = guitarUrl ? "inline-block" : "none";
  }

  if (tutorialPiano) {
    const pianoUrl = safeUrl(data.tutorial_piano);
    tutorialPiano.href = pianoUrl || "#";
    tutorialPiano.style.display = pianoUrl ? "inline-block" : "none";
  }
}

/* Perfil de artista con varias categorías */
async function loadArtistProfile() {
  const artistName = document.getElementById("artistName");
  const artistDescription = document.getElementById("artistDescription");
  const artistTags = document.getElementById("artistTags");
  const artistAvatar = document.getElementById("artistAvatar");
  const artistSongsList = document.getElementById("artistSongsList");

  if (!artistName || !artistSongsList) return;

  const client = getSupabase();

  if (!client) {
    artistName.innerText = "No se pudo conectar";
    return;
  }

  const slug = new URLSearchParams(window.location.search).get("id");

  if (!slug) {
    artistName.innerText = "Artista no encontrado";
    return;
  }

  const { data: artist, error } = await client
    .from("artists")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !artist) {
    artistName.innerText = "Artista no encontrado";
    artistDescription.innerText = "Este artista todavía no existe o fue eliminado.";
    return;
  }

  artistName.innerText = artist.name || "Sin nombre";
  artistDescription.innerText = artist.description || "Sin descripción todavía.";
  artistTags.innerText = "Artista / Ministerio";

  const avatar = safeUrl(artist.avatar_url);

  if (artistAvatar) {
    if (avatar) {
      artistAvatar.innerHTML = `<img src="${escapeHTML(avatar)}" alt="${escapeHTML(artist.name)}" loading="lazy" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`;
    } else {
      artistAvatar.innerText = getInitial(artist.name);
    }
  }

  const { data: songsData } = await client
    .from("songs")
    .select(`
      *,
      categories(name, slug),
      song_categories(
        categories(id, name, slug)
      )
    `)
    .eq("artist_id", artist.id)
    .order("title");

  artistSongsList.innerHTML = "";

  if (!songsData || songsData.length === 0) {
    artistSongsList.innerHTML = `
      <div class="song-card">
        <h3>No hay canciones todavía</h3>
      </div>
    `;
    return;
  }

  songsData.forEach(song => {
    const categoryNames = getSongCategoryNames(song);

    artistSongsList.innerHTML += `
      <article class="song-card">
        <h3>🎵 ${escapeHTML(song.title || "Sin título")}</h3>
        <p>✝ ${escapeHTML(categoryNames)}</p>
        <p>🎸 Tono: ${escapeHTML(safeText(song.tone, "No definido"))}</p>
        <p>⭐ ${escapeHTML(safeText(song.difficulty, "Sin dificultad"))}</p>
        <a class="song-btn" href="canto.html?id=${encodeURIComponent(song.slug)}">Ver canto</a>
      </article>
    `;
  });
}
/* =========================================================
   MULTICATEGORÍAS POR CANCIÓN
   Usa tabla: song_categories
========================================================= */

function getSongCategories(song) {
  if (!song || !Array.isArray(song.song_categories)) {
    return [];
  }

  return song.song_categories
    .map(item => item.categories)
    .filter(Boolean);
}

function getSongCategoryNames(song) {
  const categories = getSongCategories(song);

  if (categories.length > 0) {
    return categories.map(category => category.name).join(", ");
  }

  if (song.categories && song.categories.name) {
    return song.categories.name;
  }

  return "Sin categoría";
}

function getSongCategorySearchText(song) {
  const categories = getSongCategories(song);

  if (categories.length > 0) {
    return categories.map(category => category.name).join(" ").toLowerCase();
  }

  if (song.categories && song.categories.name) {
    return song.categories.name.toLowerCase();
  }

  return "";
}

/* Inicio - canciones recientes con varias categorías */
async function loadHomeSongs() {
  const homeSongList = document.getElementById("homeSongList");

  if (!homeSongList) return;

  const client = getSupabase();

  if (!client) {
    homeSongList.innerHTML = `
      <div class="song-card">
        <h3>No se pudo conectar</h3>
      </div>
    `;
    return;
  }

  const { data, error } = await client
    .from("songs")
    .select(`
      *,
      artists(name, slug),
      categories(name, slug),
      song_categories(
        categories(id, name, slug)
      )
    `)
    .order("created_at", { ascending: false })
    .limit(6);

  if (error) {
    homeSongList.innerHTML = `
      <div class="song-card">
        <h3>Error cargando canciones</h3>
        <p style="color:var(--secondary); margin-top:15px;">${escapeHTML(error.message)}</p>
      </div>
    `;
    return;
  }

  if (!data || data.length === 0) {
    homeSongList.innerHTML = `
      <div class="song-card">
        <h3>No hay canciones todavía</h3>
        <p style="color:var(--secondary); margin-top:15px;">
          Muy pronto se agregarán cantos, letras y acordes.
        </p>
      </div>
    `;
    return;
  }

  homeSongList.innerHTML = "";

  data.forEach(song => {
    const title = song.title || "Sin título";
    const artistName = song.artists ? song.artists.name : "Sin artista";
    const categoryNames = getSongCategoryNames(song);

    homeSongList.innerHTML += `
      <article class="song-card" data-title="${escapeHTML(`${title} ${artistName} ${categoryNames}`.toLowerCase())}">
        <h3>🎵 ${escapeHTML(title)}</h3>
        <p>👤 ${escapeHTML(artistName)}</p>
        <p>✝ ${escapeHTML(categoryNames)}</p>
        <p>🎸 Tono: ${escapeHTML(safeText(song.tone, "No definido"))}</p>
        <p>⭐ ${escapeHTML(safeText(song.difficulty, "Sin dificultad"))}</p>
        <a class="song-btn" href="canto.html?id=${encodeURIComponent(song.slug)}">Ver canto</a>
      </article>
    `;
  });
}

/* Página canciones con varias categorías */
async function loadPublicSongs() {
  const songList = document.getElementById("songList");

  if (!songList) return;

  const client = getSupabase();

  if (!client) {
    songList.innerHTML = `
      <div class="song-card">
        <h3>No se pudo conectar</h3>
      </div>
    `;
    return;
  }

  const { data, error } = await client
    .from("songs")
    .select(`
      *,
      artists(name, slug),
      categories(name, slug),
      song_categories(
        categories(id, name, slug)
      )
    `)
    .order("title");

  if (error) {
    songList.innerHTML = `
      <div class="song-card">
        <h3>Error cargando canciones</h3>
        <p style="color:var(--secondary); margin-top:15px;">${escapeHTML(error.message)}</p>
      </div>
    `;
    return;
  }

  if (!data || data.length === 0) {
    songList.innerHTML = `
      <div class="song-card">
        <h3>No hay canciones todavía</h3>
      </div>
    `;
    return;
  }

  songList.innerHTML = "";

  data.forEach(song => {
    const title = song.title || "Sin título";
    const artistName = song.artists ? song.artists.name : "Sin artista";
    const categoryNames = getSongCategoryNames(song);
    const categorySearchText = getSongCategorySearchText(song);

    songList.innerHTML += `
      <article class="song-card"
        data-category="${escapeHTML(categorySearchText)}"
        data-title="${escapeHTML(`${title} ${artistName} ${categoryNames}`.toLowerCase())}">
        <h3>🎵 ${escapeHTML(title)}</h3>
        <p>👤 ${escapeHTML(artistName)}</p>
        <p>✝ ${escapeHTML(categoryNames)}</p>
        <p>🎸 Tono: ${escapeHTML(safeText(song.tone, "No definido"))}</p>
        <p>⭐ ${escapeHTML(safeText(song.difficulty, "Sin dificultad"))}</p>
        <a class="song-btn" href="canto.html?id=${encodeURIComponent(song.slug)}">Ver canto</a>
      </article>
    `;
  });

  const songSearch = document.getElementById("songSearch");
  const initialQuery = new URLSearchParams(window.location.search).get("buscar");

  if (songSearch && initialQuery) {
    songSearch.value = initialQuery.toLowerCase();
    filterSongCards();
  }
}

/* Página canto individual con varias categorías */
async function loadSingleSong() {
  const songTitle = document.getElementById("songTitle");
  const songInfo = document.getElementById("songInfo");

  if (!songTitle || !songInfo) return;

  const client = getSupabase();

  if (!client) {
    songTitle.innerText = "No se pudo conectar";
    return;
  }

  const slug = new URLSearchParams(window.location.search).get("id");

  if (!slug) {
    songTitle.innerText = "Canto no encontrado";
    songInfo.innerText = "No se especificó ningún canto.";
    return;
  }

  const { data, error } = await client
    .from("songs")
    .select(`
      *,
      artists(name, slug),
      categories(name, slug),
      song_categories(
        categories(id, name, slug)
      )
    `)
    .eq("slug", slug)
    .single();

  if (error || !data) {
    songTitle.innerText = "Canto no encontrado";
    songInfo.innerText = "Este canto todavía no existe o fue eliminado.";
    return;
  }

  const artistName = data.artists ? data.artists.name : "Sin artista";
  const categoryNames = getSongCategoryNames(data);

  songTitle.innerText = data.title || "Sin título";
  songInfo.innerText = `${artistName} · ${categoryNames} · Tono ${safeText(data.tone, "No definido")}`;

  originalLyrics = data.lyrics || "";
  transposeAmount = 0;
  showLyrics();

  const tutorialGuitar = document.getElementById("tutorialGuitar");
  const tutorialPiano = document.getElementById("tutorialPiano");

  if (tutorialGuitar) {
    const guitarUrl = safeUrl(data.tutorial_guitar);
    tutorialGuitar.href = guitarUrl || "#";
    tutorialGuitar.style.display = guitarUrl ? "inline-block" : "none";
  }

  if (tutorialPiano) {
    const pianoUrl = safeUrl(data.tutorial_piano);
    tutorialPiano.href = pianoUrl || "#";
    tutorialPiano.style.display = pianoUrl ? "inline-block" : "none";
  }
}

/* Perfil de artista con varias categorías */
async function loadArtistProfile() {
  const artistName = document.getElementById("artistName");
  const artistDescription = document.getElementById("artistDescription");
  const artistTags = document.getElementById("artistTags");
  const artistAvatar = document.getElementById("artistAvatar");
  const artistSongsList = document.getElementById("artistSongsList");

  if (!artistName || !artistSongsList) return;

  const client = getSupabase();

  if (!client) {
    artistName.innerText = "No se pudo conectar";
    return;
  }

  const slug = new URLSearchParams(window.location.search).get("id");

  if (!slug) {
    artistName.innerText = "Artista no encontrado";
    return;
  }

  const { data: artist, error } = await client
    .from("artists")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !artist) {
    artistName.innerText = "Artista no encontrado";
    artistDescription.innerText = "Este artista todavía no existe o fue eliminado.";
    return;
  }

  artistName.innerText = artist.name || "Sin nombre";
  artistDescription.innerText = artist.description || "Sin descripción todavía.";
  artistTags.innerText = "Artista / Ministerio";

  const avatar = safeUrl(artist.avatar_url);

  if (artistAvatar) {
    if (avatar) {
      artistAvatar.innerHTML = `<img src="${escapeHTML(avatar)}" alt="${escapeHTML(artist.name)}" loading="lazy" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`;
    } else {
      artistAvatar.innerText = getInitial(artist.name);
    }
  }

  const { data: songsData } = await client
    .from("songs")
    .select(`
      *,
      categories(name, slug),
      song_categories(
        categories(id, name, slug)
      )
    `)
    .eq("artist_id", artist.id)
    .order("title");

  artistSongsList.innerHTML = "";

  if (!songsData || songsData.length === 0) {
    artistSongsList.innerHTML = `
      <div class="song-card">
        <h3>No hay canciones todavía</h3>
      </div>
    `;
    return;
  }

  songsData.forEach(song => {
    const categoryNames = getSongCategoryNames(song);

    artistSongsList.innerHTML += `
      <article class="song-card">
        <h3>🎵 ${escapeHTML(song.title || "Sin título")}</h3>
        <p>✝ ${escapeHTML(categoryNames)}</p>
        <p>🎸 Tono: ${escapeHTML(safeText(song.tone, "No definido"))}</p>
        <p>⭐ ${escapeHTML(safeText(song.difficulty, "Sin dificultad"))}</p>
        <a class="song-btn" href="canto.html?id=${encodeURIComponent(song.slug)}">Ver canto</a>
      </article>
    `;
  });
}
/* =========================================================
   REFUERZO - DETECTAR SELECTOR DE CATEGORÍA EN ADMIN
========================================================= */

function jhdFindSongCategorySelect() {
  const possibleSelectors = [
    "#songCategoryInput",
    "#categoryInput",
    "#songCategorySelect",
    "#categorySelect",
    "#songCategory",
    "#category",
    "select[name='category_id']",
    "select[name='category']"
  ];

  for (const selector of possibleSelectors) {
    const found = document.querySelector(selector);
    if (found) return found;
  }

  const allSelects = Array.from(document.querySelectorAll("select"));

  const categorySelect = allSelects.find(select => {
    const text = select.innerText.toLowerCase();
    const placeholder = select.options && select.options[0]
      ? select.options[0].textContent.toLowerCase()
      : "";

    return text.includes("categoría") || placeholder.includes("categoría");
  });

  return categorySelect || null;
}

setTimeout(() => {
  if (typeof jhdInitMultiCategoryAdmin === "function") {
    jhdInitMultiCategoryAdmin();
  }
}, 500);

setTimeout(() => {
  if (typeof jhdInitMultiCategoryAdmin === "function") {
    jhdInitMultiCategoryAdmin();
  }
}, 1500);

setTimeout(() => {
  if (typeof jhdInitMultiCategoryAdmin === "function") {
    jhdInitMultiCategoryAdmin();
  }
}, 3000);
/* =========================================================
   DESACTIVAR ASISTENTE DE ACORDES
   Seguiremos usando acordes manuales con ( )
========================================================= */

function createChordHelper() {
  const oldBox = document.getElementById("jhdChordHelperBox");

  if (oldBox) {
    oldBox.remove();
  }
}

function insertChordAtCursor() {
  alert("El asistente de acordes fue desactivado. Escribe los acordes manualmente con paréntesis, ejemplo: (G)María o Mar(G)ía.");
}

setTimeout(() => {
  const oldBox = document.getElementById("jhdChordHelperBox");

  if (oldBox) {
    oldBox.remove();
  }
}, 500);

setTimeout(() => {
  const oldBox = document.getElementById("jhdChordHelperBox");

  if (oldBox) {
    oldBox.remove();
  }
}, 1500);
/* =========================================================
   EXPLORAR SIN "AMBOS"
   Católico / Cristiano / Todos con filtros de temas
========================================================= */

window.jhdActiveExploreFilter = "";

function jhdNormalizeSongType(value) {
  const text = String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (text.includes("catolico")) return "catolico";
  if (text.includes("cristiano")) return "cristiano";

  return "";
}

function jhdGetSongTypeLabel(type) {
  const value = jhdNormalizeSongType(type);

  if (value === "catolico") return "Católico";
  if (value === "cristiano") return "Cristiano";

  return "Sin tipo";
}

function jhdGetCurrentTypeFilter() {
  const params = new URLSearchParams(window.location.search);
  return jhdNormalizeSongType(params.get("tipo"));
}

function jhdApplyTypeFilter(query) {
  const type = jhdGetCurrentTypeFilter();

  if (type === "catolico") {
    return query.eq("song_type", "catolico");
  }

  if (type === "cristiano") {
    return query.eq("song_type", "cristiano");
  }

  return query;
}

function jhdUpdateSongPageTitle() {
  const type = jhdGetCurrentTypeFilter();

  const pageTitle =
    document.getElementById("pageTitle") ||
    document.querySelector(".section h2") ||
    document.querySelector("h1");

  if (!pageTitle) return;

  if (type === "catolico") {
    pageTitle.innerText = "Cantos Católicos";
  } else if (type === "cristiano") {
    pageTitle.innerText = "Cantos Cristianos";
  } else {
    pageTitle.innerText = "Explorar canciones";
  }
}

function jhdSlugifyFilter(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function jhdGetCategoriesFromSong(song) {
  if (typeof getSongCategories === "function") {
    const multi = getSongCategories(song);

    if (multi.length > 0) {
      return multi;
    }
  }

  if (song.categories) {
    return [song.categories];
  }

  return [];
}

function jhdGetCategoryNamesFromSong(song) {
  const categories = jhdGetCategoriesFromSong(song);

  if (categories.length === 0) {
    return "Sin categoría";
  }

  return categories.map(category => category.name).join(", ");
}

function jhdGetCategorySlugTextFromSong(song) {
  const categories = jhdGetCategoriesFromSong(song);

  return categories
    .map(category => {
      return [
        category.name || "",
        category.slug || "",
        jhdSlugifyFilter(category.name || "")
      ].join(" ");
    })
    .join(" ")
    .toLowerCase();
}

function jhdBuildExploreFilterBar(songs) {
  const songList = document.getElementById("songList");

  if (!songList) return;

  let filterBox = document.getElementById("jhdExploreFilterBox");

  if (!filterBox) {
    filterBox = document.createElement("div");
    filterBox.id = "jhdExploreFilterBox";
    filterBox.className = "explore-filter-box";
    songList.parentNode.insertBefore(filterBox, songList);
  }

  const type = jhdGetCurrentTypeFilter();

  let help = "Filtra por tema o uso. Aquí se mezclan cantos católicos y cristianos.";

  if (type === "catolico") {
    help = "Filtra solo dentro de cantos católicos.";
  }

  if (type === "cristiano") {
    help = "Filtra solo dentro de cantos cristianos.";
  }

  const categoryMap = new Map();

  songs.forEach(song => {
    const categories = jhdGetCategoriesFromSong(song);

    categories.forEach(category => {
      if (!category || !category.name) return;

      const slug = category.slug || jhdSlugifyFilter(category.name);

      categoryMap.set(slug, {
        slug,
        name: category.name
      });
    });
  });

  const categories = Array.from(categoryMap.values())
    .sort((a, b) => a.name.localeCompare(b.name));

  filterBox.innerHTML = `
    <div class="explore-filter-title">Filtros</div>
    <div class="explore-filter-help">${escapeHTML(help)}</div>

    <div class="explore-filter-list">
      <button class="explore-filter-chip active" type="button" onclick="jhdSetExploreFilter('')">
        Todos
      </button>

      ${categories.map(category => `
        <button class="explore-filter-chip" type="button" onclick="jhdSetExploreFilter('${escapeHTML(category.slug)}')">
          ${escapeHTML(category.name)}
        </button>
      `).join("")}
    </div>
  `;
}

function jhdSetExploreFilter(filterValue) {
  window.jhdActiveExploreFilter = String(filterValue || "").toLowerCase();

  document.querySelectorAll(".explore-filter-chip").forEach(button => {
    button.classList.remove("active");
  });

  document.querySelectorAll(".explore-filter-chip").forEach(button => {
    const onclick = button.getAttribute("onclick") || "";

    if (!window.jhdActiveExploreFilter && onclick.includes("jhdSetExploreFilter('')")) {
      button.classList.add("active");
    }

    if (window.jhdActiveExploreFilter && onclick.includes(window.jhdActiveExploreFilter)) {
      button.classList.add("active");
    }
  });

  filterSongCards();
}

function filterSongCards() {
  const songSearch = document.getElementById("songSearch");
  const cards = document.querySelectorAll("#songList .song-card");
  const noResults = document.getElementById("noResults");

  const value = songSearch ? songSearch.value.toLowerCase().trim() : "";
  const activeFilter = String(window.jhdActiveExploreFilter || "").toLowerCase();

  let found = 0;

  cards.forEach(card => {
    const title = card.dataset.title || "";
    const category = card.dataset.category || "";

    const matchesSearch = !value || title.includes(value);
    const matchesCategory = !activeFilter || category.includes(activeFilter);

    if (matchesSearch && matchesCategory) {
      card.style.display = "block";
      found++;
    } else {
      card.style.display = "none";
    }
  });

  if (noResults) {
    noResults.style.display = found === 0 ? "block" : "none";
  }
}

/* Admin: selector solo Católico / Cristiano */
function jhdFindSongTitleInput() {
  return document.querySelector(
    "#songTitleInput, #titleInput, input[name='title'], input[placeholder*='Título']"
  );
}

function jhdFindSongSlugInput() {
  return document.querySelector(
    "#songSlugInput, #slugInput, input[name='slug']"
  );
}

function jhdSlugifyText(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function jhdGetCurrentSongSlug() {
  const slugInput = jhdFindSongSlugInput();

  if (slugInput && slugInput.value.trim()) {
    return slugInput.value.trim();
  }

  const titleInput = jhdFindSongTitleInput();

  if (titleInput && titleInput.value.trim()) {
    return jhdSlugifyText(titleInput.value.trim());
  }

  return "";
}

function jhdLoadSongTypeSelector() {
  const titleInput = jhdFindSongTitleInput();

  if (!titleInput) return;

  let box = document.getElementById("jhdSongTypeBox");

  if (!box) {
    box = document.createElement("div");
    box.id = "jhdSongTypeBox";
    box.className = "multi-category-box";
    titleInput.parentNode.insertBefore(box, titleInput.nextSibling);
  }

  box.innerHTML = `
    <div class="multi-category-title">Sección del canto</div>

    <div class="multi-category-help">
      Elige dónde aparecerá este canto.
    </div>

    <select id="jhdSongTypeInput">
      <option value="catolico">Católico</option>
      <option value="cristiano">Cristiano</option>
    </select>
  `;
}

function jhdGetSelectedSongType() {
  const input = document.getElementById("jhdSongTypeInput");

  if (!input) return "catolico";

  return jhdNormalizeSongType(input.value) || "catolico";
}

async function jhdSaveSongTypeBySlug() {
  const client = getSupabase();

  if (!client) return;

  const slug = jhdGetCurrentSongSlug();
  const songType = jhdGetSelectedSongType();

  if (!slug) return;

  const { error } = await client
    .from("songs")
    .update({ song_type: songType })
    .eq("slug", slug);

  if (error) {
    alert("La canción se guardó, pero hubo error guardando la sección del canto: " + error.message);
  }
}

async function jhdLoadSongTypeForSong(songIdOrSlug) {
  const client = getSupabase();

  if (!client || !songIdOrSlug) return;

  const input = document.getElementById("jhdSongTypeInput");

  if (!input) return;

  const value = String(songIdOrSlug);
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

  let query = client
    .from("songs")
    .select("song_type");

  if (isUuid) {
    query = query.eq("id", value);
  } else {
    query = query.eq("slug", value);
  }

  const { data, error } = await query.single();

  if (!error && data && data.song_type) {
    input.value = jhdNormalizeSongType(data.song_type) || "catolico";
  }
}

function jhdPatchSaveSongTypeNoAmbos() {
  if (window.jhdSongTypeNoAmbosPatched) return;
  window.jhdSongTypeNoAmbosPatched = true;

  if (typeof window.saveSong === "function") {
    const previousSaveSong = window.saveSong;

    window.saveSong = async function() {
      await previousSaveSong.apply(this, arguments);

      setTimeout(async () => {
        await jhdSaveSongTypeBySlug();
      }, 900);
    };
  }

  if (typeof window.editSong === "function") {
    const previousEditSong = window.editSong;

    window.editSong = async function(songId) {
      await previousEditSong.apply(this, arguments);

      setTimeout(async () => {
        jhdLoadSongTypeSelector();
        await jhdLoadSongTypeForSong(songId);
      }, 900);
    };
  }
}

function jhdInitSongTypeNoAmbos() {
  jhdLoadSongTypeSelector();
  jhdPatchSaveSongTypeNoAmbos();

  setTimeout(jhdLoadSongTypeSelector, 700);
  setTimeout(jhdPatchSaveSongTypeNoAmbos, 900);

  setTimeout(jhdLoadSongTypeSelector, 1600);
  setTimeout(jhdPatchSaveSongTypeNoAmbos, 1800);
}

/* Página canciones: todos o solo católico/cristiano */
async function loadPublicSongs() {
  const songList = document.getElementById("songList");

  if (!songList) return;

  const client = getSupabase();

  if (!client) {
    songList.innerHTML = `
      <div class="song-card">
        <h3>No se pudo conectar</h3>
      </div>
    `;
    return;
  }

  jhdUpdateSongPageTitle();

  let query = client
    .from("songs")
    .select(`
      *,
      artists(name, slug),
      categories(name, slug),
      song_categories(
        categories(id, name, slug)
      )
    `)
    .order("title");

  query = jhdApplyTypeFilter(query);

  const { data, error } = await query;

  if (error) {
    songList.innerHTML = `
      <div class="song-card">
        <h3>Error cargando canciones</h3>
        <p style="color:var(--secondary); margin-top:15px;">${escapeHTML(error.message)}</p>
      </div>
    `;
    return;
  }

  if (!data || data.length === 0) {
    songList.innerHTML = `
      <div class="song-card">
        <h3>No hay canciones todavía</h3>
        <p style="color:var(--secondary); margin-top:15px;">
          Todavía no hay cantos en esta sección.
        </p>
      </div>
    `;
    return;
  }

  jhdBuildExploreFilterBar(data);

  songList.innerHTML = "";

  data.forEach(song => {
    const title = song.title || "Sin título";
    const artistName = song.artists ? song.artists.name : "Sin artista";
    const categoryNames = jhdGetCategoryNamesFromSong(song);
    const categorySlugText = jhdGetCategorySlugTextFromSong(song);
    const typeLabel = jhdGetSongTypeLabel(song.song_type);

    songList.innerHTML += `
      <article class="song-card"
        data-category="${escapeHTML(categorySlugText)}"
        data-title="${escapeHTML(`${title} ${artistName} ${categoryNames} ${typeLabel}`.toLowerCase())}">
        <h3>🎵 ${escapeHTML(title)}</h3>
        <p>👤 ${escapeHTML(artistName)}</p>
        <p>🙏 ${escapeHTML(typeLabel)}</p>
        <p>✝ ${escapeHTML(categoryNames)}</p>
        <p>🎸 Tono: ${escapeHTML(safeText(song.tone, "No definido"))}</p>
        <p>⭐ ${escapeHTML(safeText(song.difficulty, "Sin dificultad"))}</p>
        <a class="song-btn" href="canto.html?id=${encodeURIComponent(song.slug)}">Ver canto</a>
      </article>
    `;
  });

  const songSearch = document.getElementById("songSearch");
  const initialQuery = new URLSearchParams(window.location.search).get("buscar");

  if (songSearch && initialQuery) {
    songSearch.value = initialQuery.toLowerCase();
  }

  filterSongCards();
}

/* Canto individual: mostrar sección */
async function loadSingleSong() {
  const songTitle = document.getElementById("songTitle");
  const songInfo = document.getElementById("songInfo");

  if (!songTitle || !songInfo) return;

  const client = getSupabase();

  if (!client) {
    songTitle.innerText = "No se pudo conectar";
    return;
  }

  const slug = new URLSearchParams(window.location.search).get("id");

  if (!slug) {
    songTitle.innerText = "Canto no encontrado";
    songInfo.innerText = "No se especificó ningún canto.";
    return;
  }

  const { data, error } = await client
    .from("songs")
    .select(`
      *,
      artists(name, slug),
      categories(name, slug),
      song_categories(
        categories(id, name, slug)
      )
    `)
    .eq("slug", slug)
    .single();

  if (error || !data) {
    songTitle.innerText = "Canto no encontrado";
    songInfo.innerText = "Este canto todavía no existe o fue eliminado.";
    return;
  }

  const artistName = data.artists ? data.artists.name : "Sin artista";
  const categoryNames = jhdGetCategoryNamesFromSong(data);
  const typeLabel = jhdGetSongTypeLabel(data.song_type);

  songTitle.innerText = data.title || "Sin título";
  songInfo.innerText = `${artistName} · ${typeLabel} · ${categoryNames} · Tono ${safeText(data.tone, "No definido")}`;

  originalLyrics = data.lyrics || "";
  transposeAmount = 0;
  showLyrics();

  const tutorialGuitar = document.getElementById("tutorialGuitar");
  const tutorialPiano = document.getElementById("tutorialPiano");

  if (tutorialGuitar) {
    const guitarUrl = safeUrl(data.tutorial_guitar);
    tutorialGuitar.href = guitarUrl || "#";
    tutorialGuitar.style.display = guitarUrl ? "inline-block" : "none";
  }

  if (tutorialPiano) {
    const pianoUrl = safeUrl(data.tutorial_piano);
    tutorialPiano.href = pianoUrl || "#";
    tutorialPiano.style.display = pianoUrl ? "inline-block" : "none";
  }
}

document.addEventListener("DOMContentLoaded", jhdInitSongTypeNoAmbos);
setTimeout(jhdInitSongTypeNoAmbos, 1200);
setTimeout(jhdInitSongTypeNoAmbos, 2500);

runWhenReady(() => {
  setTimeout(() => {
    loadPublicSongs();
    loadSingleSong();
  }, 500);
});

window.jhdSetExploreFilter = jhdSetExploreFilter;
/* =========================================================
   CORRECCIÓN ERROR RELACIÓN DUPLICADA SONGS / CATEGORIES
   Usar solo song_categories -> categories
========================================================= */

function jhdGetCategoriesFromSong(song) {
  if (song && Array.isArray(song.song_categories)) {
    const multi = song.song_categories
      .map(item => item.categories)
      .filter(Boolean);

    if (multi.length > 0) {
      return multi;
    }
  }

  return [];
}

function jhdGetCategoryNamesFromSong(song) {
  const categories = jhdGetCategoriesFromSong(song);

  if (categories.length === 0) {
    return "Sin categoría";
  }

  return categories.map(category => category.name).join(", ");
}

function jhdGetCategorySlugTextFromSong(song) {
  const categories = jhdGetCategoriesFromSong(song);

  return categories
    .map(category => {
      return [
        category.name || "",
        category.slug || "",
        jhdSlugifyFilter(category.name || "")
      ].join(" ");
    })
    .join(" ")
    .toLowerCase();
}

/* Inicio - canciones recientes */
async function loadHomeSongs() {
  const homeSongList = document.getElementById("homeSongList");

  if (!homeSongList) return;

  const client = getSupabase();

  if (!client) {
    homeSongList.innerHTML = `
      <div class="song-card">
        <h3>No se pudo conectar</h3>
      </div>
    `;
    return;
  }

  const { data, error } = await client
    .from("songs")
    .select(`
      *,
      artists(name, slug),
      song_categories(
        categories(id, name, slug)
      )
    `)
    .order("created_at", { ascending: false })
    .limit(6);

  if (error) {
    homeSongList.innerHTML = `
      <div class="song-card">
        <h3>Error cargando canciones</h3>
        <p style="color:var(--secondary); margin-top:15px;">${escapeHTML(error.message)}</p>
      </div>
    `;
    return;
  }

  if (!data || data.length === 0) {
    homeSongList.innerHTML = `
      <div class="song-card">
        <h3>No hay canciones todavía</h3>
        <p style="color:var(--secondary); margin-top:15px;">
          Muy pronto se agregarán cantos, letras y acordes.
        </p>
      </div>
    `;
    return;
  }

  homeSongList.innerHTML = "";

  data.forEach(song => {
    const title = song.title || "Sin título";
    const artistName = song.artists ? song.artists.name : "Sin artista";
    const categoryNames = jhdGetCategoryNamesFromSong(song);
    const typeLabel = jhdGetSongTypeLabel(song.song_type);

    homeSongList.innerHTML += `
      <article class="song-card" data-title="${escapeHTML(`${title} ${artistName} ${categoryNames} ${typeLabel}`.toLowerCase())}">
        <h3>🎵 ${escapeHTML(title)}</h3>
        <p>👤 ${escapeHTML(artistName)}</p>
        <p>🙏 ${escapeHTML(typeLabel)}</p>
        <p>✝ ${escapeHTML(categoryNames)}</p>
        <p>🎸 Tono: ${escapeHTML(safeText(song.tone, "No definido"))}</p>
        <p>⭐ ${escapeHTML(safeText(song.difficulty, "Sin dificultad"))}</p>
        <a class="song-btn" href="canto.html?id=${encodeURIComponent(song.slug)}">Ver canto</a>
      </article>
    `;
  });
}

/* Página canciones */
async function loadPublicSongs() {
  const songList = document.getElementById("songList");

  if (!songList) return;

  const client = getSupabase();

  if (!client) {
    songList.innerHTML = `
      <div class="song-card">
        <h3>No se pudo conectar</h3>
      </div>
    `;
    return;
  }

  jhdUpdateSongPageTitle();

  let query = client
    .from("songs")
    .select(`
      *,
      artists(name, slug),
      song_categories(
        categories(id, name, slug)
      )
    `)
    .order("title");

  query = jhdApplyTypeFilter(query);

  const { data, error } = await query;

  if (error) {
    songList.innerHTML = `
      <div class="song-card">
        <h3>Error cargando canciones</h3>
        <p style="color:var(--secondary); margin-top:15px;">${escapeHTML(error.message)}</p>
      </div>
    `;
    return;
  }

  if (!data || data.length === 0) {
    songList.innerHTML = `
      <div class="song-card">
        <h3>No hay canciones todavía</h3>
        <p style="color:var(--secondary); margin-top:15px;">
          Todavía no hay cantos en esta sección.
        </p>
      </div>
    `;
    return;
  }

  jhdBuildExploreFilterBar(data);

  songList.innerHTML = "";

  data.forEach(song => {
    const title = song.title || "Sin título";
    const artistName = song.artists ? song.artists.name : "Sin artista";
    const categoryNames = jhdGetCategoryNamesFromSong(song);
    const categorySlugText = jhdGetCategorySlugTextFromSong(song);
    const typeLabel = jhdGetSongTypeLabel(song.song_type);

    songList.innerHTML += `
      <article class="song-card"
        data-category="${escapeHTML(categorySlugText)}"
        data-title="${escapeHTML(`${title} ${artistName} ${categoryNames} ${typeLabel}`.toLowerCase())}">
        <h3>🎵 ${escapeHTML(title)}</h3>
        <p>👤 ${escapeHTML(artistName)}</p>
        <p>🙏 ${escapeHTML(typeLabel)}</p>
        <p>✝ ${escapeHTML(categoryNames)}</p>
        <p>🎸 Tono: ${escapeHTML(safeText(song.tone, "No definido"))}</p>
        <p>⭐ ${escapeHTML(safeText(song.difficulty, "Sin dificultad"))}</p>
        <a class="song-btn" href="canto.html?id=${encodeURIComponent(song.slug)}">Ver canto</a>
      </article>
    `;
  });

  const songSearch = document.getElementById("songSearch");
  const initialQuery = new URLSearchParams(window.location.search).get("buscar");

  if (songSearch && initialQuery) {
    songSearch.value = initialQuery.toLowerCase();
  }

  filterSongCards();
}

/* Canto individual */
async function loadSingleSong() {
  const songTitle = document.getElementById("songTitle");
  const songInfo = document.getElementById("songInfo");

  if (!songTitle || !songInfo) return;

  const client = getSupabase();

  if (!client) {
    songTitle.innerText = "No se pudo conectar";
    return;
  }

  const slug = new URLSearchParams(window.location.search).get("id");

  if (!slug) {
    songTitle.innerText = "Canto no encontrado";
    songInfo.innerText = "No se especificó ningún canto.";
    return;
  }

  const { data, error } = await client
    .from("songs")
    .select(`
      *,
      artists(name, slug),
      song_categories(
        categories(id, name, slug)
      )
    `)
    .eq("slug", slug)
    .single();

  if (error || !data) {
    songTitle.innerText = "Canto no encontrado";
    songInfo.innerText = "Este canto todavía no existe o fue eliminado.";
    return;
  }

  const artistName = data.artists ? data.artists.name : "Sin artista";
  const categoryNames = jhdGetCategoryNamesFromSong(data);
  const typeLabel = jhdGetSongTypeLabel(data.song_type);

  songTitle.innerText = data.title || "Sin título";
  songInfo.innerText = `${artistName} · ${typeLabel} · ${categoryNames} · Tono ${safeText(data.tone, "No definido")}`;

  originalLyrics = data.lyrics || "";
  transposeAmount = 0;
  showLyrics();

  const tutorialGuitar = document.getElementById("tutorialGuitar");
  const tutorialPiano = document.getElementById("tutorialPiano");

  if (tutorialGuitar) {
    const guitarUrl = safeUrl(data.tutorial_guitar);
    tutorialGuitar.href = guitarUrl || "#";
    tutorialGuitar.style.display = guitarUrl ? "inline-block" : "none";
  }

  if (tutorialPiano) {
    const pianoUrl = safeUrl(data.tutorial_piano);
    tutorialPiano.href = pianoUrl || "#";
    tutorialPiano.style.display = pianoUrl ? "inline-block" : "none";
  }
}

/* Perfil de artista */
async function loadArtistProfile() {
  const artistName = document.getElementById("artistName");
  const artistDescription = document.getElementById("artistDescription");
  const artistTags = document.getElementById("artistTags");
  const artistAvatar = document.getElementById("artistAvatar");
  const artistSongsList = document.getElementById("artistSongsList");

  if (!artistName || !artistSongsList) return;

  const client = getSupabase();

  if (!client) {
    artistName.innerText = "No se pudo conectar";
    return;
  }

  const slug = new URLSearchParams(window.location.search).get("id");

  if (!slug) {
    artistName.innerText = "Artista no encontrado";
    return;
  }

  const { data: artist, error } = await client
    .from("artists")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !artist) {
    artistName.innerText = "Artista no encontrado";
    artistDescription.innerText = "Este artista todavía no existe o fue eliminado.";
    return;
  }

  artistName.innerText = artist.name || "Sin nombre";
  artistDescription.innerText = artist.description || "Sin descripción todavía.";
  artistTags.innerText = "Artista / Ministerio";

  const avatar = safeUrl(artist.avatar_url);

  if (artistAvatar) {
    if (avatar) {
      artistAvatar.innerHTML = `<img src="${escapeHTML(avatar)}" alt="${escapeHTML(artist.name)}" loading="lazy" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`;
    } else {
      artistAvatar.innerText = getInitial(artist.name);
    }
  }

  const { data: songsData } = await client
    .from("songs")
    .select(`
      *,
      song_categories(
        categories(id, name, slug)
      )
    `)
    .eq("artist_id", artist.id)
    .order("title");

  artistSongsList.innerHTML = "";

  if (!songsData || songsData.length === 0) {
    artistSongsList.innerHTML = `
      <div class="song-card">
        <h3>No hay canciones todavía</h3>
      </div>
    `;
    return;
  }

  songsData.forEach(song => {
    const categoryNames = jhdGetCategoryNamesFromSong(song);
    const typeLabel = jhdGetSongTypeLabel(song.song_type);

    artistSongsList.innerHTML += `
      <article class="song-card">
        <h3>🎵 ${escapeHTML(song.title || "Sin título")}</h3>
        <p>🙏 ${escapeHTML(typeLabel)}</p>
        <p>✝ ${escapeHTML(categoryNames)}</p>
        <p>🎸 Tono: ${escapeHTML(safeText(song.tone, "No definido"))}</p>
        <p>⭐ ${escapeHTML(safeText(song.difficulty, "Sin dificultad"))}</p>
        <a class="song-btn" href="canto.html?id=${encodeURIComponent(song.slug)}">Ver canto</a>
      </article>
    `;
  });
}

/* Recargar con funciones corregidas */
runWhenReady(() => {
  setTimeout(() => {
    loadHomeSongs();
    loadPublicSongs();
    loadSingleSong();
    loadArtistProfile();
  }, 600);
});
/* =========================================================
   ARTISTAS SIN COPYRIGHT
   Usar iniciales y portada de color, no imágenes
========================================================= */

function jhdGetArtistInitials(name) {
  const clean = String(name || "")
    .trim()
    .replace(/\s+/g, " ");

  if (!clean) return "?";

  const words = clean.split(" ");

  if (words.length === 1) {
    return words[0].substring(0, 2).toUpperCase();
  }

  return words
    .slice(0, 3)
    .map(word => word.charAt(0))
    .join("")
    .toUpperCase();
}

/* Página artistas con iniciales */
async function loadPublicArtists() {
  const artistList = document.getElementById("artistList");

  if (!artistList) return;

  const client = getSupabase();

  if (!client) {
    artistList.innerHTML = `
      <div class="song-card">
        <h3>No se pudo conectar</h3>
      </div>
    `;
    return;
  }

  const { data, error } = await client
    .from("artists")
    .select("*")
    .order("name");

  if (error) {
    artistList.innerHTML = `
      <div class="song-card">
        <h3>Error cargando artistas</h3>
      </div>
    `;
    return;
  }

  if (!data || data.length === 0) {
    artistList.innerHTML = `
      <div class="song-card">
        <h3>No hay artistas todavía</h3>
        <p style="color:var(--secondary); margin-top:15px;">
          Muy pronto se agregarán artistas y ministerios.
        </p>
      </div>
    `;
    return;
  }

  artistList.innerHTML = "";

  data.forEach(artist => {
    const name = artist.name || "Sin nombre";
    const initials = jhdGetArtistInitials(name);

    artistList.innerHTML += `
      <article class="song-card artist-card" data-title="${escapeHTML(`${name} ${artist.description || ""}`.toLowerCase())}">
        <div class="artist-avatar">${escapeHTML(initials)}</div>
        <h3>${escapeHTML(name)}</h3>
        <p>${escapeHTML(artist.description || "Sin descripción todavía.")}</p>
        <a class="song-btn" href="artista.html?id=${encodeURIComponent(artist.slug)}">Ver perfil</a>
      </article>
    `;
  });
}

/* Perfil de artista con iniciales y portada de color */
async function loadArtistProfile() {
  const artistName = document.getElementById("artistName");
  const artistDescription = document.getElementById("artistDescription");
  const artistTags = document.getElementById("artistTags");
  const artistAvatar = document.getElementById("artistAvatar");
  const artistSongsList = document.getElementById("artistSongsList");
  const artistHero = document.querySelector(".artist-profile-hero");

  if (!artistName || !artistSongsList) return;

  const client = getSupabase();

  if (!client) {
    artistName.innerText = "No se pudo conectar";
    return;
  }

  const slug = new URLSearchParams(window.location.search).get("id");

  if (!slug) {
    artistName.innerText = "Artista no encontrado";
    return;
  }

  const { data: artist, error } = await client
    .from("artists")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !artist) {
    artistName.innerText = "Artista no encontrado";
    artistDescription.innerText = "Este artista todavía no existe o fue eliminado.";
    return;
  }

  artistName.innerText = artist.name || "Sin nombre";
  artistDescription.innerText = artist.description || "Sin descripción todavía.";
  artistTags.innerText = "ARTISTA / MINISTERIO";

  if (artistAvatar) {
    artistAvatar.innerHTML = escapeHTML(jhdGetArtistInitials(artist.name));
  }

  const { data: songsData } = await client
    .from("songs")
    .select(`
      *,
      song_categories(
        categories(id, name, slug)
      )
    `)
    .eq("artist_id", artist.id)
    .order("title");

  if (artistHero && songsData && songsData.length > 0) {
    const firstType = songsData[0].song_type;

    artistHero.classList.remove("profile-catolico", "profile-cristiano");

    if (firstType === "catolico") {
      artistHero.classList.add("profile-catolico");
    }

    if (firstType === "cristiano") {
      artistHero.classList.add("profile-cristiano");
    }
  }

  artistSongsList.innerHTML = "";

  if (!songsData || songsData.length === 0) {
    artistSongsList.innerHTML = `
      <div class="song-card">
        <h3>No hay canciones todavía</h3>
        <p style="color:var(--secondary); margin-top:15px;">
          Muy pronto se agregarán cantos para este artista.
        </p>
      </div>
    `;
    return;
  }

  songsData.forEach(song => {
    const categoryNames = typeof jhdGetCategoryNamesFromSong === "function"
      ? jhdGetCategoryNamesFromSong(song)
      : "Sin categoría";

    const typeLabel = typeof jhdGetSongTypeLabel === "function"
      ? jhdGetSongTypeLabel(song.song_type)
      : "Sin tipo";

    artistSongsList.innerHTML += `
      <article class="song-card">
        <h3>🎵 ${escapeHTML(song.title || "Sin título")}</h3>
        <p>🙏 ${escapeHTML(typeLabel)}</p>
        <p>✝ ${escapeHTML(categoryNames)}</p>
        <p>🎸 Tono: ${escapeHTML(safeText(song.tone, "No definido"))}</p>
        <p>⭐ ${escapeHTML(safeText(song.difficulty, "Sin dificultad"))}</p>
        <a class="song-btn" href="canto.html?id=${encodeURIComponent(song.slug)}">Ver canto</a>
      </article>
    `;
  });
}

runWhenReady(() => {
  setTimeout(() => {
    loadPublicArtists();
    loadArtistProfile();
  }, 700);
});
/* =========================================================
   ARTISTAS - COLORES Y DEGRADADOS EDITABLES
========================================================= */

function jhdGetArtistInitials(name) {
  const clean = String(name || "").trim().replace(/\s+/g, " ");

  if (!clean) return "?";

  const words = clean.split(" ");

  if (words.length === 1) {
    return words[0].substring(0, 2).toUpperCase();
  }

  return words.slice(0, 3).map(word => word.charAt(0)).join("").toUpperCase();
}

function jhdSafeColor(value, fallback) {
  const color = String(value || "").trim();

  if (/^#[0-9a-fA-F]{6}$/.test(color)) {
    return color;
  }

  return fallback;
}

function jhdSafeDirection(value) {
  const direction = String(value || "").trim();

  const allowed = ["90deg", "120deg", "135deg", "160deg", "180deg", "220deg", "270deg"];

  return allowed.includes(direction) ? direction : "135deg";
}

function jhdArtistColors(artist) {
  return {
    c1: jhdSafeColor(artist.gradient_color_1, "#0b1324"),
    c2: jhdSafeColor(artist.gradient_color_2, "#1d3557"),
    c3: jhdSafeColor(artist.gradient_color_3, "#111827"),
    angle: jhdSafeDirection(artist.gradient_direction)
  };
}

function jhdApplyArtistColorsToHero(artist) {
  const hero = document.querySelector(".artist-profile-hero");

  if (!hero) return;

  const colors = jhdArtistColors(artist);

  hero.style.setProperty("--artist-c1", colors.c1);
  hero.style.setProperty("--artist-c2", colors.c2);
  hero.style.setProperty("--artist-c3", colors.c3);
  hero.style.setProperty("--artist-angle", colors.angle);
}

function jhdArtistAvatarStyle(artist) {
  const colors = jhdArtistColors(artist);

  return `--artist-c1:${colors.c1}; --artist-c2:${colors.c2}; --artist-c3:${colors.c3};`;
}

/* Página artistas con iniciales y colores */
async function loadPublicArtists() {
  const artistList = document.getElementById("artistList");

  if (!artistList) return;

  const client = getSupabase();

  if (!client) {
    artistList.innerHTML = `<div class="song-card"><h3>No se pudo conectar</h3></div>`;
    return;
  }

  const { data, error } = await client
    .from("artists")
    .select("*")
    .order("name");

  if (error) {
    artistList.innerHTML = `<div class="song-card"><h3>Error cargando artistas</h3></div>`;
    return;
  }

  if (!data || data.length === 0) {
    artistList.innerHTML = `
      <div class="song-card">
        <h3>No hay artistas todavía</h3>
        <p style="color:var(--secondary); margin-top:15px;">
          Muy pronto se agregarán artistas y ministerios.
        </p>
      </div>
    `;
    return;
  }

  artistList.innerHTML = "";

  data.forEach(artist => {
    const name = artist.name || "Sin nombre";
    const initials = jhdGetArtistInitials(name);

    artistList.innerHTML += `
      <article class="song-card artist-card" data-title="${escapeHTML(`${name} ${artist.description || ""}`.toLowerCase())}">
        <div class="artist-avatar" style="${jhdArtistAvatarStyle(artist)}">${escapeHTML(initials)}</div>
        <h3>${escapeHTML(name)}</h3>
        <p>${escapeHTML(artist.description || "Sin descripción todavía.")}</p>
        <a class="song-btn" href="artista.html?id=${encodeURIComponent(artist.slug)}">Ver perfil</a>
      </article>
    `;
  });
}

/* Perfil de artista con degradado editable */
async function loadArtistProfile() {
  const artistName = document.getElementById("artistName");
  const artistDescription = document.getElementById("artistDescription");
  const artistTags = document.getElementById("artistTags");
  const artistAvatar = document.getElementById("artistAvatar");
  const artistSongsList = document.getElementById("artistSongsList");

  if (!artistName || !artistSongsList) return;

  const client = getSupabase();

  if (!client) {
    artistName.innerText = "No se pudo conectar";
    return;
  }

  const slug = new URLSearchParams(window.location.search).get("id");

  if (!slug) {
    artistName.innerText = "Artista no encontrado";
    return;
  }

  const { data: artist, error } = await client
    .from("artists")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !artist) {
    artistName.innerText = "Artista no encontrado";
    artistDescription.innerText = "Este artista todavía no existe o fue eliminado.";
    return;
  }

  jhdApplyArtistColorsToHero(artist);

  artistName.innerText = artist.name || "Sin nombre";
  artistDescription.innerText = artist.description || "Sin descripción todavía.";
  artistTags.innerText = "ARTISTA / MINISTERIO";

  if (artistAvatar) {
    artistAvatar.style.cssText += jhdArtistAvatarStyle(artist);
    artistAvatar.innerHTML = escapeHTML(jhdGetArtistInitials(artist.name));
  }

  const { data: songsData } = await client
    .from("songs")
    .select(`
      *,
      song_categories(
        categories(id, name, slug)
      )
    `)
    .eq("artist_id", artist.id)
    .order("title");

  artistSongsList.innerHTML = "";

  if (!songsData || songsData.length === 0) {
    artistSongsList.innerHTML = `
      <div class="song-card">
        <h3>No hay canciones todavía</h3>
        <p style="color:var(--secondary); margin-top:15px;">
          Muy pronto se agregarán cantos para este artista.
        </p>
      </div>
    `;
    return;
  }

  songsData.forEach(song => {
    const categoryNames = typeof jhdGetCategoryNamesFromSong === "function"
      ? jhdGetCategoryNamesFromSong(song)
      : "Sin categoría";

    const typeLabel = typeof jhdGetSongTypeLabel === "function"
      ? jhdGetSongTypeLabel(song.song_type)
      : "Sin tipo";

    artistSongsList.innerHTML += `
      <article class="song-card">
        <h3>🎵 ${escapeHTML(song.title || "Sin título")}</h3>
        <p>🙏 ${escapeHTML(typeLabel)}</p>
        <p>✝ ${escapeHTML(categoryNames)}</p>
        <p>🎸 Tono: ${escapeHTML(safeText(song.tone, "No definido"))}</p>
        <p>⭐ ${escapeHTML(safeText(song.difficulty, "Sin dificultad"))}</p>
        <a class="song-btn" href="canto.html?id=${encodeURIComponent(song.slug)}">Ver canto</a>
      </article>
    `;
  });
}

/* =========================================================
   ADMIN - EDITAR COLORES DEL ARTISTA
========================================================= */

function jhdFindArtistNameInput() {
  return document.querySelector(
    "#artistNameInput, #artistName, #newArtistName, input[name='artist_name'], input[placeholder*='Nombre del artista'], input[placeholder*='Nombre del ministerio']"
  );
}

function jhdFindArtistSlugInput() {
  return document.querySelector(
    "#artistSlugInput, #artistSlug, #newArtistSlug, input[name='artist_slug'], input[placeholder*='Slug del artista'], input[placeholder*='slug']"
  );
}

function jhdArtistSlugFromAdmin() {
  const slugInput = jhdFindArtistSlugInput();

  if (slugInput && slugInput.value.trim()) {
    return slugInput.value.trim();
  }

  const nameInput = jhdFindArtistNameInput();

  if (nameInput && nameInput.value.trim()) {
    return jhdSlugifyText(nameInput.value.trim());
  }

  return "";
}

function jhdUpdateGradientPreview() {
  const preview = document.getElementById("jhdArtistGradientPreview");
  const c1 = document.getElementById("jhdArtistColor1");
  const c2 = document.getElementById("jhdArtistColor2");
  const c3 = document.getElementById("jhdArtistColor3");
  const angle = document.getElementById("jhdArtistGradientDirection");

  if (!preview || !c1 || !c2 || !c3 || !angle) return;

  preview.style.background = `linear-gradient(${angle.value}, ${c1.value}, ${c2.value} 50%, ${c3.value})`;
}

function jhdLoadArtistGradientAdminBox() {
  const nameInput = jhdFindArtistNameInput();

  if (!nameInput) return;
  if (document.getElementById("jhdArtistGradientBox")) return;

  const box = document.createElement("div");
  box.id = "jhdArtistGradientBox";
  box.className = "artist-gradient-admin";

  box.innerHTML = `
    <div class="artist-gradient-admin-title">Colores del perfil</div>

    <div class="artist-gradient-admin-help">
      Elige los colores del degradado del artista. No necesitas imágenes ni portada.
    </div>

    <div class="artist-gradient-controls">
      <label>
        Color 1
        <input type="color" id="jhdArtistColor1" value="#0b1324" oninput="jhdUpdateGradientPreview()">
      </label>

      <label>
        Color 2
        <input type="color" id="jhdArtistColor2" value="#1d3557" oninput="jhdUpdateGradientPreview()">
      </label>

      <label>
        Color 3
        <input type="color" id="jhdArtistColor3" value="#111827" oninput="jhdUpdateGradientPreview()">
      </label>

      <label>
        Dirección
        <select id="jhdArtistGradientDirection" onchange="jhdUpdateGradientPreview()">
          <option value="90deg">Horizontal</option>
          <option value="135deg" selected>Diagonal</option>
          <option value="180deg">Vertical</option>
          <option value="220deg">Diagonal inversa</option>
          <option value="270deg">Horizontal inverso</option>
        </select>
      </label>
    </div>

    <div class="artist-gradient-preview" id="jhdArtistGradientPreview"></div>

    <button type="button" class="song-btn" style="margin-top:14px;" onclick="jhdSaveArtistGradientColors()">
      Guardar colores del artista
    </button>
  `;

  nameInput.parentNode.insertBefore(box, nameInput.nextSibling);

  jhdUpdateGradientPreview();
}

async function jhdSaveArtistGradientColors() {
  const client = getSupabase();

  if (!client) {
    alert("No se pudo conectar con Supabase");
    return;
  }

  const slug = jhdArtistSlugFromAdmin();

  if (!slug) {
    alert("Primero escribe el nombre o slug del artista.");
    return;
  }

  const c1 = document.getElementById("jhdArtistColor1").value;
  const c2 = document.getElementById("jhdArtistColor2").value;
  const c3 = document.getElementById("jhdArtistColor3").value;
  const angle = document.getElementById("jhdArtistGradientDirection").value;

  const { error } = await client
    .from("artists")
    .update({
      gradient_color_1: c1,
      gradient_color_2: c2,
      gradient_color_3: c3,
      gradient_direction: angle
    })
    .eq("slug", slug);

  if (error) {
    alert("No se pudieron guardar los colores: " + error.message);
    return;
  }

  alert("Colores guardados");
}

function jhdInitArtistGradientAdmin() {
  jhdLoadArtistGradientAdminBox();

  setTimeout(jhdLoadArtistGradientAdminBox, 800);
  setTimeout(jhdLoadArtistGradientAdminBox, 1800);
  setTimeout(jhdLoadArtistGradientAdminBox, 3000);
}

document.addEventListener("DOMContentLoaded", jhdInitArtistGradientAdmin);

runWhenReady(() => {
  setTimeout(() => {
    loadPublicArtists();
    loadArtistProfile();
    jhdInitArtistGradientAdmin();
  }, 800);
});

window.jhdUpdateGradientPreview = jhdUpdateGradientPreview;
window.jhdSaveArtistGradientColors = jhdSaveArtistGradientColors;
/* =========================================================
   ARTISTAS - DEGRADADO EDITABLE SOLO EN ADMIN
   Con colores, marcadores y ángulo libre
========================================================= */

function jhdIsAdminPage() {
  return window.location.pathname.includes("admin.html") ||
    !!document.getElementById("adminPanel");
}

function jhdRemovePublicGradientEditor() {
  if (!jhdIsAdminPage()) {
    const box = document.getElementById("jhdArtistGradientBox");
    if (box) box.remove();
  }
}

function jhdGetArtistInitials(name) {
  const clean = String(name || "").trim().replace(/\s+/g, " ");

  if (!clean) return "?";

  const words = clean.split(" ");

  if (words.length === 1) {
    return words[0].substring(0, 2).toUpperCase();
  }

  return words.slice(0, 3).map(word => word.charAt(0)).join("").toUpperCase();
}

function jhdSafeColor(value, fallback) {
  const color = String(value || "").trim();

  if (/^#[0-9a-fA-F]{6}$/.test(color)) {
    return color;
  }

  return fallback;
}

function jhdClampNumber(value, fallback, min, max) {
  const number = Number(value);

  if (Number.isFinite(number)) {
    return Math.min(max, Math.max(min, number));
  }

  return fallback;
}

function jhdArtistGradientData(artist) {
  return {
    c1: jhdSafeColor(artist.gradient_color_1, "#0b1324"),
    c2: jhdSafeColor(artist.gradient_color_2, "#1d3557"),
    c3: jhdSafeColor(artist.gradient_color_3, "#111827"),
    s1: jhdClampNumber(artist.gradient_stop_1, 0, 0, 100),
    s2: jhdClampNumber(artist.gradient_stop_2, 50, 0, 100),
    s3: jhdClampNumber(artist.gradient_stop_3, 100, 0, 100),
    angle: jhdClampNumber(artist.gradient_angle, 135, 0, 360)
  };
}

function jhdGradientString(data) {
  return `linear-gradient(${data.angle}deg, ${data.c1} ${data.s1}%, ${data.c2} ${data.s2}%, ${data.c3} ${data.s3}%)`;
}

function jhdApplyArtistGradientToHero(artist) {
  const hero = document.querySelector(".artist-profile-hero");

  if (!hero) return;

  const data = jhdArtistGradientData(artist);

  hero.style.setProperty("--artist-c1", data.c1);
  hero.style.setProperty("--artist-c2", data.c2);
  hero.style.setProperty("--artist-c3", data.c3);
  hero.style.setProperty("--artist-s1", `${data.s1}%`);
  hero.style.setProperty("--artist-s2", `${data.s2}%`);
  hero.style.setProperty("--artist-s3", `${data.s3}%`);
  hero.style.setProperty("--artist-angle", `${data.angle}deg`);
}

function jhdArtistInlineVars(artist) {
  const data = jhdArtistGradientData(artist);

  return `
    --artist-c1:${data.c1};
    --artist-c2:${data.c2};
    --artist-c3:${data.c3};
    --artist-s1:${data.s1}%;
    --artist-s2:${data.s2}%;
    --artist-s3:${data.s3}%;
    --artist-angle:${data.angle}deg;
  `;
}

/* Página pública de artistas: iniciales y color */
async function loadPublicArtists() {
  const artistList = document.getElementById("artistList");

  if (!artistList) return;

  const client = getSupabase();

  if (!client) {
    artistList.innerHTML = `<div class="song-card"><h3>No se pudo conectar</h3></div>`;
    return;
  }

  const { data, error } = await client
    .from("artists")
    .select("*")
    .order("name");

  if (error) {
    artistList.innerHTML = `<div class="song-card"><h3>Error cargando artistas</h3></div>`;
    return;
  }

  if (!data || data.length === 0) {
    artistList.innerHTML = `
      <div class="song-card">
        <h3>No hay artistas todavía</h3>
      </div>
    `;
    return;
  }

  artistList.innerHTML = "";

  data.forEach(artist => {
    const name = artist.name || "Sin nombre";
    const initials = jhdGetArtistInitials(name);

    artistList.innerHTML += `
      <article class="song-card artist-card" data-title="${escapeHTML(`${name} ${artist.description || ""}`.toLowerCase())}">
        <div class="artist-avatar" style="${jhdArtistInlineVars(artist)}">
          ${escapeHTML(initials)}
        </div>
        <h3>${escapeHTML(name)}</h3>
        <p>${escapeHTML(artist.description || "Sin descripción todavía.")}</p>
        <a class="song-btn" href="artista.html?id=${encodeURIComponent(artist.slug)}">Ver perfil</a>
      </article>
    `;
  });
}

/* Perfil público de artista: degradado del artista */
async function loadArtistProfile() {
  const artistName = document.getElementById("artistName");
  const artistDescription = document.getElementById("artistDescription");
  const artistTags = document.getElementById("artistTags");
  const artistAvatar = document.getElementById("artistAvatar");
  const artistSongsList = document.getElementById("artistSongsList");

  if (!artistName || !artistSongsList) return;

  const client = getSupabase();

  if (!client) {
    artistName.innerText = "No se pudo conectar";
    return;
  }

  const slug = new URLSearchParams(window.location.search).get("id");

  if (!slug) {
    artistName.innerText = "Artista no encontrado";
    return;
  }

  const { data: artist, error } = await client
    .from("artists")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !artist) {
    artistName.innerText = "Artista no encontrado";
    artistDescription.innerText = "Este artista todavía no existe o fue eliminado.";
    return;
  }

  jhdApplyArtistGradientToHero(artist);

  artistName.innerText = artist.name || "Sin nombre";
  artistDescription.innerText = artist.description || "Sin descripción todavía.";
  artistTags.innerText = "ARTISTA / MINISTERIO";

  if (artistAvatar) {
    artistAvatar.style.cssText += jhdArtistInlineVars(artist);
    artistAvatar.innerHTML = escapeHTML(jhdGetArtistInitials(artist.name));
  }

  const { data: songsData } = await client
    .from("songs")
    .select(`
      *,
      song_categories(
        categories(id, name, slug)
      )
    `)
    .eq("artist_id", artist.id)
    .order("title");

  artistSongsList.innerHTML = "";

  if (!songsData || songsData.length === 0) {
    artistSongsList.innerHTML = `
      <div class="song-card">
        <h3>No hay canciones todavía</h3>
      </div>
    `;
    return;
  }

  songsData.forEach(song => {
    const categoryNames = typeof jhdGetCategoryNamesFromSong === "function"
      ? jhdGetCategoryNamesFromSong(song)
      : "Sin categoría";

    const typeLabel = typeof jhdGetSongTypeLabel === "function"
      ? jhdGetSongTypeLabel(song.song_type)
      : "Sin tipo";

    artistSongsList.innerHTML += `
      <article class="song-card">
        <h3>🎵 ${escapeHTML(song.title || "Sin título")}</h3>
        <p>🙏 ${escapeHTML(typeLabel)}</p>
        <p>✝ ${escapeHTML(categoryNames)}</p>
        <p>🎸 Tono: ${escapeHTML(safeText(song.tone, "No definido"))}</p>
        <p>⭐ ${escapeHTML(safeText(song.difficulty, "Sin dificultad"))}</p>
        <a class="song-btn" href="canto.html?id=${encodeURIComponent(song.slug)}">Ver canto</a>
      </article>
    `;
  });
}

/* Buscar inputs reales del formulario de artista */
function jhdFindArtistNameInput() {
  return document.querySelector(
    "input#artistNameInput, input#newArtistName, input[name='artist_name'], input[placeholder*='Nombre del artista'], input[placeholder*='Nombre del ministerio']"
  );
}

function jhdFindArtistSlugInput() {
  return document.querySelector(
    "input#artistSlugInput, input#newArtistSlug, input[name='artist_slug'], input[placeholder*='Slug del artista'], input[placeholder*='slug']"
  );
}

function jhdArtistSlugFromAdmin() {
  const slugInput = jhdFindArtistSlugInput();

  if (slugInput && slugInput.value.trim()) {
    return slugInput.value.trim();
  }

  const nameInput = jhdFindArtistNameInput();

  if (nameInput && nameInput.value.trim()) {
    return jhdSlugifyText(nameInput.value.trim());
  }

  return "";
}

function jhdReadGradientAdminValues() {
  return {
    c1: document.getElementById("jhdArtistColor1").value,
    c2: document.getElementById("jhdArtistColor2").value,
    c3: document.getElementById("jhdArtistColor3").value,
    s1: Number(document.getElementById("jhdArtistStop1").value),
    s2: Number(document.getElementById("jhdArtistStop2").value),
    s3: Number(document.getElementById("jhdArtistStop3").value),
    angle: Number(document.getElementById("jhdArtistAngle").value)
  };
}

function jhdUpdateGradientPreview() {
  const preview = document.getElementById("jhdArtistGradientPreview");

  if (!preview) return;

  const data = jhdReadGradientAdminValues();

  document.getElementById("jhdArtistStop1Label").innerText = `${data.s1}%`;
  document.getElementById("jhdArtistStop2Label").innerText = `${data.s2}%`;
  document.getElementById("jhdArtistStop3Label").innerText = `${data.s3}%`;
  document.getElementById("jhdArtistAngleLabel").innerText = `${data.angle}°`;

  preview.style.background = jhdGradientString(data);
}

function jhdLoadArtistGradientAdminBox() {
  if (!jhdIsAdminPage()) {
    jhdRemovePublicGradientEditor();
    return;
  }

  const nameInput = jhdFindArtistNameInput();

  if (!nameInput) return;

  let box = document.getElementById("jhdArtistGradientBox");

  if (!box) {
    box = document.createElement("div");
    box.id = "jhdArtistGradientBox";
    nameInput.parentNode.insertBefore(box, nameInput.nextSibling);
  }

  box.innerHTML = `
    <div class="artist-gradient-admin-title">Colores del perfil</div>

    <div class="artist-gradient-admin-help">
      Elige colores y mueve los marcadores para decidir dónde empieza y termina cada tono del degradado.
    </div>

    <div class="artist-gradient-controls">
      <div class="artist-gradient-control">
        <label>Color 1</label>
        <input type="color" id="jhdArtistColor1" value="#0b1324" oninput="jhdUpdateGradientPreview()">
        <label>Posición <span id="jhdArtistStop1Label">0%</span></label>
        <input type="range" id="jhdArtistStop1" min="0" max="100" value="0" oninput="jhdUpdateGradientPreview()">
      </div>

      <div class="artist-gradient-control">
        <label>Color 2</label>
        <input type="color" id="jhdArtistColor2" value="#1d3557" oninput="jhdUpdateGradientPreview()">
        <label>Posición <span id="jhdArtistStop2Label">50%</span></label>
        <input type="range" id="jhdArtistStop2" min="0" max="100" value="50" oninput="jhdUpdateGradientPreview()">
      </div>

      <div class="artist-gradient-control">
        <label>Color 3</label>
        <input type="color" id="jhdArtistColor3" value="#111827" oninput="jhdUpdateGradientPreview()">
        <label>Posición <span id="jhdArtistStop3Label">100%</span></label>
        <input type="range" id="jhdArtistStop3" min="0" max="100" value="100" oninput="jhdUpdateGradientPreview()">
      </div>
    </div>

    <div class="artist-gradient-angle">
      <label>Ángulo del degradado <span id="jhdArtistAngleLabel">135°</span></label>
      <input type="range" id="jhdArtistAngle" min="0" max="360" value="135" oninput="jhdUpdateGradientPreview()">
    </div>

    <div class="artist-gradient-preview" id="jhdArtistGradientPreview"></div>

    <button type="button" class="song-btn" style="margin-top:14px;" onclick="jhdSaveArtistGradientColors()">
      Guardar colores del artista
    </button>
  `;

  jhdUpdateGradientPreview();
}

async function jhdSaveArtistGradientColors() {
  const client = getSupabase();

  if (!client) {
    alert("No se pudo conectar con Supabase");
    return;
  }

  const slug = jhdArtistSlugFromAdmin();

  if (!slug) {
    alert("Primero escribe el nombre o slug del artista.");
    return;
  }

  const data = jhdReadGradientAdminValues();

  const { error } = await client
    .from("artists")
    .update({
      gradient_color_1: data.c1,
      gradient_color_2: data.c2,
      gradient_color_3: data.c3,
      gradient_stop_1: data.s1,
      gradient_stop_2: data.s2,
      gradient_stop_3: data.s3,
      gradient_angle: data.angle
    })
    .eq("slug", slug);

  if (error) {
    alert("No se pudieron guardar los colores: " + error.message);
    return;
  }

  alert("Colores guardados");
}

function jhdInitArtistGradientAdmin() {
  jhdRemovePublicGradientEditor();

  if (!jhdIsAdminPage()) return;

  jhdLoadArtistGradientAdminBox();

  setTimeout(jhdLoadArtistGradientAdminBox, 800);
  setTimeout(jhdLoadArtistGradientAdminBox, 1800);
  setTimeout(jhdLoadArtistGradientAdminBox, 3000);
}

document.addEventListener("DOMContentLoaded", jhdInitArtistGradientAdmin);

runWhenReady(() => {
  setTimeout(() => {
    jhdRemovePublicGradientEditor();
    jhdInitArtistGradientAdmin();
    loadPublicArtists();
    loadArtistProfile();
  }, 800);
});

window.jhdUpdateGradientPreview = jhdUpdateGradientPreview;
window.jhdSaveArtistGradientColors = jhdSaveArtistGradientColors;
/* =========================================================
   ARTISTAS - DEGRADADO EDITABLE SOLO EN ADMIN
========================================================= */

function jhdIsAdminPage() {
  return window.location.pathname.includes("admin.html") ||
    !!document.getElementById("adminPanel");
}

function jhdRemovePublicGradientEditor() {
  if (!jhdIsAdminPage()) {
    const box = document.getElementById("jhdArtistGradientBox");
    if (box) box.remove();
  }
}

function jhdGetArtistInitials(name) {
  const clean = String(name || "").trim().replace(/\s+/g, " ");
  if (!clean) return "?";

  const words = clean.split(" ");

  if (words.length === 1) {
    return words[0].substring(0, 2).toUpperCase();
  }

  return words.slice(0, 3).map(word => word.charAt(0)).join("").toUpperCase();
}

function jhdSafeColor(value, fallback) {
  const color = String(value || "").trim();

  if (/^#[0-9a-fA-F]{6}$/.test(color)) {
    return color;
  }

  return fallback;
}

function jhdClampNumber(value, fallback, min, max) {
  const number = Number(value);

  if (Number.isFinite(number)) {
    return Math.min(max, Math.max(min, number));
  }

  return fallback;
}

function jhdArtistGradientData(artist) {
  return {
    c1: jhdSafeColor(artist.gradient_color_1, "#0b1324"),
    c2: jhdSafeColor(artist.gradient_color_2, "#1d3557"),
    c3: jhdSafeColor(artist.gradient_color_3, "#111827"),
    s1: jhdClampNumber(artist.gradient_stop_1, 0, 0, 100),
    s2: jhdClampNumber(artist.gradient_stop_2, 50, 0, 100),
    s3: jhdClampNumber(artist.gradient_stop_3, 100, 0, 100),
    angle: jhdClampNumber(artist.gradient_angle, 135, 0, 360)
  };
}

function jhdGradientString(data) {
  return `linear-gradient(${data.angle}deg, ${data.c1} ${data.s1}%, ${data.c2} ${data.s2}%, ${data.c3} ${data.s3}%)`;
}

function jhdApplyArtistGradientToHero(artist) {
  const hero = document.querySelector(".artist-profile-hero");
  if (!hero) return;

  const data = jhdArtistGradientData(artist);

  hero.style.setProperty("--artist-c1", data.c1);
  hero.style.setProperty("--artist-c2", data.c2);
  hero.style.setProperty("--artist-c3", data.c3);
  hero.style.setProperty("--artist-s1", `${data.s1}%`);
  hero.style.setProperty("--artist-s2", `${data.s2}%`);
  hero.style.setProperty("--artist-s3", `${data.s3}%`);
  hero.style.setProperty("--artist-angle", `${data.angle}deg`);
}

function jhdArtistInlineVars(artist) {
  const data = jhdArtistGradientData(artist);

  return `
    --artist-c1:${data.c1};
    --artist-c2:${data.c2};
    --artist-c3:${data.c3};
    --artist-s1:${data.s1}%;
    --artist-s2:${data.s2}%;
    --artist-s3:${data.s3}%;
    --artist-angle:${data.angle}deg;
  `;
}

/* Página pública de artistas: iniciales */
async function loadPublicArtists() {
  const artistList = document.getElementById("artistList");

  if (!artistList) return;

  const client = getSupabase();

  if (!client) {
    artistList.innerHTML = `<div class="song-card"><h3>No se pudo conectar</h3></div>`;
    return;
  }

  const { data, error } = await client
    .from("artists")
    .select("*")
    .order("name");

  if (error) {
    artistList.innerHTML = `<div class="song-card"><h3>Error cargando artistas</h3></div>`;
    return;
  }

  if (!data || data.length === 0) {
    artistList.innerHTML = `
      <div class="song-card">
        <h3>No hay artistas todavía</h3>
      </div>
    `;
    return;
  }

  artistList.innerHTML = "";

  data.forEach(artist => {
    const name = artist.name || "Sin nombre";
    const initials = jhdGetArtistInitials(name);

    artistList.innerHTML += `
      <article class="song-card artist-card" data-title="${escapeHTML(`${name} ${artist.description || ""}`.toLowerCase())}">
        <div class="artist-avatar" style="${jhdArtistInlineVars(artist)}">
          ${escapeHTML(initials)}
        </div>
        <h3>${escapeHTML(name)}</h3>
        <p>${escapeHTML(artist.description || "Sin descripción todavía.")}</p>
        <a class="song-btn" href="artista.html?id=${encodeURIComponent(artist.slug)}">Ver perfil</a>
      </article>
    `;
  });
}

/* Perfil público de artista */
async function loadArtistProfile() {
  const artistName = document.getElementById("artistName");
  const artistDescription = document.getElementById("artistDescription");
  const artistTags = document.getElementById("artistTags");
  const artistAvatar = document.getElementById("artistAvatar");
  const artistSongsList = document.getElementById("artistSongsList");

  if (!artistName || !artistSongsList) return;

  const client = getSupabase();

  if (!client) {
    artistName.innerText = "No se pudo conectar";
    return;
  }

  const slug = new URLSearchParams(window.location.search).get("id");

  if (!slug) {
    artistName.innerText = "Artista no encontrado";
    return;
  }

  const { data: artist, error } = await client
    .from("artists")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !artist) {
    artistName.innerText = "Artista no encontrado";
    artistDescription.innerText = "Este artista todavía no existe o fue eliminado.";
    return;
  }

  jhdApplyArtistGradientToHero(artist);

  artistName.innerText = artist.name || "Sin nombre";
  artistDescription.innerText = artist.description || "Sin descripción todavía.";
  artistTags.innerText = "ARTISTA / MINISTERIO";

  if (artistAvatar) {
    artistAvatar.style.cssText += jhdArtistInlineVars(artist);
    artistAvatar.innerHTML = escapeHTML(jhdGetArtistInitials(artist.name));
  }

  const { data: songsData } = await client
    .from("songs")
    .select(`
      *,
      song_categories(
        categories(id, name, slug)
      )
    `)
    .eq("artist_id", artist.id)
    .order("title");

  artistSongsList.innerHTML = "";

  if (!songsData || songsData.length === 0) {
    artistSongsList.innerHTML = `
      <div class="song-card">
        <h3>No hay canciones todavía</h3>
      </div>
    `;
    return;
  }

  songsData.forEach(song => {
    const categoryNames = typeof jhdGetCategoryNamesFromSong === "function"
      ? jhdGetCategoryNamesFromSong(song)
      : "Sin categoría";

    const typeLabel = typeof jhdGetSongTypeLabel === "function"
      ? jhdGetSongTypeLabel(song.song_type)
      : "Sin tipo";

    artistSongsList.innerHTML += `
      <article class="song-card">
        <h3>🎵 ${escapeHTML(song.title || "Sin título")}</h3>
        <p>🙏 ${escapeHTML(typeLabel)}</p>
        <p>✝ ${escapeHTML(categoryNames)}</p>
        <p>🎸 Tono: ${escapeHTML(safeText(song.tone, "No definido"))}</p>
        <p>⭐ ${escapeHTML(safeText(song.difficulty, "Sin dificultad"))}</p>
        <a class="song-btn" href="canto.html?id=${encodeURIComponent(song.slug)}">Ver canto</a>
      </article>
    `;
  });
}

/* Buscar inputs del formulario de artista SOLO en admin */
function jhdFindArtistNameInput() {
  if (!jhdIsAdminPage()) return null;

  return document.querySelector(
    "input#artistNameInput, input#newArtistName, input[name='artist_name'], input[placeholder*='Nombre del artista'], input[placeholder*='Nombre del ministerio']"
  );
}

function jhdFindArtistSlugInput() {
  if (!jhdIsAdminPage()) return null;

  return document.querySelector(
    "input#artistSlugInput, input#newArtistSlug, input[name='artist_slug'], input[placeholder*='Slug del artista'], input[placeholder*='slug']"
  );
}

function jhdArtistSlugFromAdmin() {
  const slugInput = jhdFindArtistSlugInput();

  if (slugInput && slugInput.value.trim()) {
    return slugInput.value.trim();
  }

  const nameInput = jhdFindArtistNameInput();

  if (nameInput && nameInput.value.trim()) {
    return jhdSlugifyText(nameInput.value.trim());
  }

  return "";
}

function jhdReadGradientAdminValues() {
  return {
    c1: document.getElementById("jhdArtistColor1").value,
    c2: document.getElementById("jhdArtistColor2").value,
    c3: document.getElementById("jhdArtistColor3").value,
    s1: Number(document.getElementById("jhdArtistStop1").value),
    s2: Number(document.getElementById("jhdArtistStop2").value),
    s3: Number(document.getElementById("jhdArtistStop3").value),
    angle: Number(document.getElementById("jhdArtistAngle").value)
  };
}

function jhdUpdateGradientPreview() {
  const preview = document.getElementById("jhdArtistGradientPreview");
  if (!preview) return;

  const data = jhdReadGradientAdminValues();

  document.getElementById("jhdArtistStop1Label").innerText = `${data.s1}%`;
  document.getElementById("jhdArtistStop2Label").innerText = `${data.s2}%`;
  document.getElementById("jhdArtistStop3Label").innerText = `${data.s3}%`;
  document.getElementById("jhdArtistAngleLabel").innerText = `${data.angle}°`;

  preview.style.background = jhdGradientString(data);
}

function jhdLoadArtistGradientAdminBox() {
  if (!jhdIsAdminPage()) {
    jhdRemovePublicGradientEditor();
    return;
  }

  const nameInput = jhdFindArtistNameInput();

  if (!nameInput) return;

  let box = document.getElementById("jhdArtistGradientBox");

  if (!box) {
    box = document.createElement("div");
    box.id = "jhdArtistGradientBox";
    nameInput.parentNode.insertBefore(box, nameInput.nextSibling);
  }

  box.innerHTML = `
    <div class="artist-gradient-admin-title">Colores del perfil</div>

    <div class="artist-gradient-admin-help">
      Elige colores y mueve los marcadores para decidir dónde empieza y termina cada tono del degradado.
    </div>

    <div class="artist-gradient-controls">
      <div class="artist-gradient-control">
        <label>Color 1</label>
        <input type="color" id="jhdArtistColor1" value="#0b1324" oninput="jhdUpdateGradientPreview()">
        <label>Posición <span id="jhdArtistStop1Label">0%</span></label>
        <input type="range" id="jhdArtistStop1" min="0" max="100" value="0" oninput="jhdUpdateGradientPreview()">
      </div>

      <div class="artist-gradient-control">
        <label>Color 2</label>
        <input type="color" id="jhdArtistColor2" value="#1d3557" oninput="jhdUpdateGradientPreview()">
        <label>Posición <span id="jhdArtistStop2Label">50%</span></label>
        <input type="range" id="jhdArtistStop2" min="0" max="100" value="50" oninput="jhdUpdateGradientPreview()">
      </div>

      <div class="artist-gradient-control">
        <label>Color 3</label>
        <input type="color" id="jhdArtistColor3" value="#111827" oninput="jhdUpdateGradientPreview()">
        <label>Posición <span id="jhdArtistStop3Label">100%</span></label>
        <input type="range" id="jhdArtistStop3" min="0" max="100" value="100" oninput="jhdUpdateGradientPreview()">
      </div>
    </div>

    <div class="artist-gradient-angle">
      <label>Ángulo del degradado <span id="jhdArtistAngleLabel">135°</span></label>
      <input type="range" id="jhdArtistAngle" min="0" max="360" value="135" oninput="jhdUpdateGradientPreview()">
    </div>

    <div class="artist-gradient-preview" id="jhdArtistGradientPreview"></div>

    <button type="button" class="song-btn" style="margin-top:14px;" onclick="jhdSaveArtistGradientColors()">
      Guardar colores del artista
    </button>
  `;

  jhdUpdateGradientPreview();
}

async function jhdSaveArtistGradientColors() {
  const client = getSupabase();

  if (!client) {
    alert("No se pudo conectar con Supabase");
    return;
  }

  const slug = jhdArtistSlugFromAdmin();

  if (!slug) {
    alert("Primero escribe el nombre o slug del artista.");
    return;
  }

  const data = jhdReadGradientAdminValues();

  const { error } = await client
    .from("artists")
    .update({
      gradient_color_1: data.c1,
      gradient_color_2: data.c2,
      gradient_color_3: data.c3,
      gradient_stop_1: data.s1,
      gradient_stop_2: data.s2,
      gradient_stop_3: data.s3,
      gradient_angle: data.angle
    })
    .eq("slug", slug);

  if (error) {
    alert("No se pudieron guardar los colores: " + error.message);
    return;
  }

  alert("Colores guardados");
}

function jhdInitArtistGradientAdmin() {
  jhdRemovePublicGradientEditor();

  if (!jhdIsAdminPage()) return;

  jhdLoadArtistGradientAdminBox();

  setTimeout(jhdLoadArtistGradientAdminBox, 800);
  setTimeout(jhdLoadArtistGradientAdminBox, 1800);
  setTimeout(jhdLoadArtistGradientAdminBox, 3000);
}

document.addEventListener("DOMContentLoaded", jhdInitArtistGradientAdmin);

runWhenReady(() => {
  setTimeout(() => {
    jhdRemovePublicGradientEditor();
    jhdInitArtistGradientAdmin();
    loadPublicArtists();
    loadArtistProfile();
  }, 800);
});

window.jhdUpdateGradientPreview = jhdUpdateGradientPreview;
window.jhdSaveArtistGradientColors = jhdSaveArtistGradientColors;
/* =========================================================
   FIX FINAL - EDITOR DE DEGRADADO SOLO EN ADMIN
========================================================= */

function jhdIsAdminPage() {
  return window.location.pathname.includes("admin.html") ||
    !!document.getElementById("adminPanel");
}

function jhdMarkAdminBody() {
  if (jhdIsAdminPage()) {
    document.body.classList.add("admin-page");
  }
}

function jhdRemovePublicGradientEditor() {
  if (!jhdIsAdminPage()) {
    const box = document.getElementById("jhdArtistGradientBox");
    if (box) box.remove();
  }
}

function jhdGetArtistInitials(name) {
  const clean = String(name || "").trim().replace(/\s+/g, " ");

  if (!clean) return "?";

  const words = clean.split(" ");

  if (words.length === 1) {
    return words[0].substring(0, 2).toUpperCase();
  }

  return words
    .slice(0, 3)
    .map(word => word.charAt(0))
    .join("")
    .toUpperCase();
}

function jhdSafeColor(value, fallback) {
  const color = String(value || "").trim();

  if (/^#[0-9a-fA-F]{6}$/.test(color)) {
    return color;
  }

  return fallback;
}

function jhdClampNumber(value, fallback, min, max) {
  const number = Number(value);

  if (Number.isFinite(number)) {
    return Math.min(max, Math.max(min, number));
  }

  return fallback;
}

function jhdArtistGradientData(artist) {
  return {
    c1: jhdSafeColor(artist.gradient_color_1 || artist.color_start, "#0b1324"),
    c2: jhdSafeColor(artist.gradient_color_2, "#1d3557"),
    c3: jhdSafeColor(artist.gradient_color_3 || artist.color_end, "#111827"),
    s1: jhdClampNumber(artist.gradient_stop_1, 0, 0, 100),
    s2: jhdClampNumber(artist.gradient_stop_2, 50, 0, 100),
    s3: jhdClampNumber(artist.gradient_stop_3, 100, 0, 100),
    angle: jhdClampNumber(artist.gradient_angle, 135, 0, 360)
  };
}

function jhdGradientString(data) {
  return `linear-gradient(${data.angle}deg, ${data.c1} ${data.s1}%, ${data.c2} ${data.s2}%, ${data.c3} ${data.s3}%)`;
}

function jhdApplyArtistGradientToHero(artist) {
  const hero = document.querySelector(".artist-profile-hero");

  if (!hero) return;

  const data = jhdArtistGradientData(artist);

  hero.style.setProperty("--artist-c1", data.c1);
  hero.style.setProperty("--artist-c2", data.c2);
  hero.style.setProperty("--artist-c3", data.c3);
  hero.style.setProperty("--artist-s1", `${data.s1}%`);
  hero.style.setProperty("--artist-s2", `${data.s2}%`);
  hero.style.setProperty("--artist-s3", `${data.s3}%`);
  hero.style.setProperty("--artist-angle", `${data.angle}deg`);
}

function jhdArtistInlineVars(artist) {
  const data = jhdArtistGradientData(artist);

  return `
    --artist-c1:${data.c1};
    --artist-c2:${data.c2};
    --artist-c3:${data.c3};
    --artist-s1:${data.s1}%;
    --artist-s2:${data.s2}%;
    --artist-s3:${data.s3}%;
    --artist-angle:${data.angle}deg;
  `;
}

/* Encuentra la tarjeta real de editar/agregar artista */
function jhdFindArtistFormCard() {
  if (!jhdIsAdminPage()) return null;

  const headings = Array.from(document.querySelectorAll("h2, h3"));

  const artistHeading = headings.find(h => {
    const text = h.innerText.toLowerCase();
    return text.includes("agregar artista") || text.includes("editar artista");
  });

  if (!artistHeading) return null;

  return artistHeading.closest(".song-card") || artistHeading.parentElement;
}

function jhdFindArtistNameInput() {
  const card = jhdFindArtistFormCard();

  if (!card) return null;

  const inputs = Array.from(card.querySelectorAll("input"));

  return inputs.find(input => {
    const ph = String(input.placeholder || "").toLowerCase();
    const type = String(input.type || "").toLowerCase();

    return type !== "color" &&
      !ph.includes("url") &&
      !ph.includes("foto") &&
      !ph.includes("portada") &&
      !ph.includes("imagen");
  }) || null;
}

function jhdFindArtistSlugInput() {
  const card = jhdFindArtistFormCard();

  if (!card) return null;

  return card.querySelector("input[name='slug'], input#artistSlugInput, input#newArtistSlug");
}

function jhdArtistSlugFromAdmin() {
  const slugInput = jhdFindArtistSlugInput();

  if (slugInput && slugInput.value.trim()) {
    return slugInput.value.trim();
  }

  const nameInput = jhdFindArtistNameInput();

  if (nameInput && nameInput.value.trim()) {
    return jhdSlugifyText(nameInput.value.trim());
  }

  return "";
}

function jhdReadGradientAdminValues() {
  return {
    c1: document.getElementById("jhdArtistColor1").value,
    c2: document.getElementById("jhdArtistColor2").value,
    c3: document.getElementById("jhdArtistColor3").value,
    s1: Number(document.getElementById("jhdArtistStop1").value),
    s2: Number(document.getElementById("jhdArtistStop2").value),
    s3: Number(document.getElementById("jhdArtistStop3").value),
    angle: Number(document.getElementById("jhdArtistAngle").value)
  };
}

function jhdUpdateGradientPreview() {
  const preview = document.getElementById("jhdArtistGradientPreview");

  if (!preview) return;

  const data = jhdReadGradientAdminValues();

  document.getElementById("jhdArtistStop1Label").innerText = `${data.s1}%`;
  document.getElementById("jhdArtistStop2Label").innerText = `${data.s2}%`;
  document.getElementById("jhdArtistStop3Label").innerText = `${data.s3}%`;
  document.getElementById("jhdArtistAngleLabel").innerText = `${data.angle}°`;

  preview.style.background = jhdGradientString(data);
}

function jhdLoadArtistGradientAdminBox() {
  if (!jhdIsAdminPage()) {
    jhdRemovePublicGradientEditor();
    return;
  }

  const card = jhdFindArtistFormCard();

  if (!card) return;

  let box = document.getElementById("jhdArtistGradientBox");

  if (!box) {
    box = document.createElement("div");
    box.id = "jhdArtistGradientBox";

    const buttons = Array.from(card.querySelectorAll("button"));
    const firstButton = buttons[0];

    if (firstButton) {
      card.insertBefore(box, firstButton);
    } else {
      card.appendChild(box);
    }
  }

  box.innerHTML = `
    <div class="artist-gradient-admin-title">Colores del perfil</div>

    <div class="artist-gradient-admin-help">
      Elige colores y mueve los marcadores para decidir cómo se mezclan en el perfil del artista.
    </div>

    <div class="artist-gradient-controls">
      <div class="artist-gradient-control">
        <label>Color 1</label>
        <input type="color" id="jhdArtistColor1" value="#0b1324" oninput="jhdUpdateGradientPreview()">
        <label>Marcador <span id="jhdArtistStop1Label">0%</span></label>
        <input type="range" id="jhdArtistStop1" min="0" max="100" value="0" oninput="jhdUpdateGradientPreview()">
      </div>

      <div class="artist-gradient-control">
        <label>Color 2</label>
        <input type="color" id="jhdArtistColor2" value="#1d3557" oninput="jhdUpdateGradientPreview()">
        <label>Marcador <span id="jhdArtistStop2Label">50%</span></label>
        <input type="range" id="jhdArtistStop2" min="0" max="100" value="50" oninput="jhdUpdateGradientPreview()">
      </div>

      <div class="artist-gradient-control">
        <label>Color 3</label>
        <input type="color" id="jhdArtistColor3" value="#111827" oninput="jhdUpdateGradientPreview()">
        <label>Marcador <span id="jhdArtistStop3Label">100%</span></label>
        <input type="range" id="jhdArtistStop3" min="0" max="100" value="100" oninput="jhdUpdateGradientPreview()">
      </div>
    </div>

    <div class="artist-gradient-angle">
      <label>Ángulo del degradado <span id="jhdArtistAngleLabel">135°</span></label>
      <input type="range" id="jhdArtistAngle" min="0" max="360" value="135" oninput="jhdUpdateGradientPreview()">
    </div>

    <div class="artist-gradient-preview" id="jhdArtistGradientPreview"></div>

    <button type="button" class="song-btn artist-gradient-save-btn" onclick="jhdSaveArtistGradientColors()">
      Guardar colores del artista
    </button>
  `;

  jhdUpdateGradientPreview();
}

async function jhdSaveArtistGradientColors() {
  const client = getSupabase();

  if (!client) {
    alert("No se pudo conectar con Supabase");
    return;
  }

  const slug = jhdArtistSlugFromAdmin();

  if (!slug) {
    alert("Primero escribe el nombre del artista.");
    return;
  }

  const data = jhdReadGradientAdminValues();

  const { error } = await client
    .from("artists")
    .update({
      gradient_color_1: data.c1,
      gradient_color_2: data.c2,
      gradient_color_3: data.c3,
      gradient_stop_1: data.s1,
      gradient_stop_2: data.s2,
      gradient_stop_3: data.s3,
      gradient_angle: data.angle,
      color_start: data.c1,
      color_end: data.c3
    })
    .eq("slug", slug);

  if (error) {
    alert("No se pudieron guardar los colores: " + error.message);
    return;
  }

  alert("Colores guardados");
}

/* Página pública artistas */
async function loadPublicArtists() {
  const artistList = document.getElementById("artistList");

  if (!artistList) return;

  const client = getSupabase();

  if (!client) {
    artistList.innerHTML = `<div class="song-card"><h3>No se pudo conectar</h3></div>`;
    return;
  }

  const { data, error } = await client
    .from("artists")
    .select("*")
    .order("name");

  if (error) {
    artistList.innerHTML = `<div class="song-card"><h3>Error cargando artistas</h3></div>`;
    return;
  }

  artistList.innerHTML = "";

  data.forEach(artist => {
    const name = artist.name || "Sin nombre";

    artistList.innerHTML += `
      <article class="song-card artist-card" data-title="${escapeHTML(`${name} ${artist.description || ""}`.toLowerCase())}">
        <div class="artist-avatar" style="${jhdArtistInlineVars(artist)}">
          ${escapeHTML(jhdGetArtistInitials(name))}
        </div>
        <h3>${escapeHTML(name)}</h3>
        <p>${escapeHTML(artist.description || "Sin descripción todavía.")}</p>
        <a class="song-btn" href="artista.html?id=${encodeURIComponent(artist.slug)}">Ver perfil</a>
      </article>
    `;
  });
}

/* Perfil público artista */
async function loadArtistProfile() {
  const artistName = document.getElementById("artistName");
  const artistDescription = document.getElementById("artistDescription");
  const artistTags = document.getElementById("artistTags");
  const artistAvatar = document.getElementById("artistAvatar");
  const artistSongsList = document.getElementById("artistSongsList");

  if (!artistName || !artistSongsList) return;

  const client = getSupabase();

  if (!client) {
    artistName.innerText = "No se pudo conectar";
    return;
  }

  const slug = new URLSearchParams(window.location.search).get("id");

  if (!slug) {
    artistName.innerText = "Artista no encontrado";
    return;
  }

  const { data: artist, error } = await client
    .from("artists")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !artist) {
    artistName.innerText = "Artista no encontrado";
    artistDescription.innerText = "Este artista todavía no existe o fue eliminado.";
    return;
  }

  jhdApplyArtistGradientToHero(artist);

  artistName.innerText = artist.name || "Sin nombre";
  artistDescription.innerText = artist.description || "Sin descripción todavía.";
  artistTags.innerText = "ARTISTA / MINISTERIO";

  if (artistAvatar) {
    artistAvatar.style.cssText += jhdArtistInlineVars(artist);
    artistAvatar.innerHTML = escapeHTML(jhdGetArtistInitials(artist.name));
  }

  const { data: songsData } = await client
    .from("songs")
    .select(`
      *,
      song_categories(
        categories(id, name, slug)
      )
    `)
    .eq("artist_id", artist.id)
    .order("title");

  artistSongsList.innerHTML = "";

  if (!songsData || songsData.length === 0) {
    artistSongsList.innerHTML = `
      <div class="song-card">
        <h3>No hay canciones todavía</h3>
      </div>
    `;
    return;
  }

  songsData.forEach(song => {
    const categoryNames = typeof jhdGetCategoryNamesFromSong === "function"
      ? jhdGetCategoryNamesFromSong(song)
      : "Sin categoría";

    const typeLabel = typeof jhdGetSongTypeLabel === "function"
      ? jhdGetSongTypeLabel(song.song_type)
      : "Sin tipo";

    artistSongsList.innerHTML += `
      <article class="song-card">
        <h3>🎵 ${escapeHTML(song.title || "Sin título")}</h3>
        <p>🙏 ${escapeHTML(typeLabel)}</p>
        <p>✝ ${escapeHTML(categoryNames)}</p>
        <p>🎸 Tono: ${escapeHTML(safeText(song.tone, "No definido"))}</p>
        <p>⭐ ${escapeHTML(safeText(song.difficulty, "Sin dificultad"))}</p>
        <a class="song-btn" href="canto.html?id=${encodeURIComponent(song.slug)}">Ver canto</a>
      </article>
    `;
  });
}

function jhdInitArtistGradientAdmin() {
  jhdMarkAdminBody();
  jhdRemovePublicGradientEditor();

  if (!jhdIsAdminPage()) return;

  jhdLoadArtistGradientAdminBox();

  setTimeout(jhdLoadArtistGradientAdminBox, 800);
  setTimeout(jhdLoadArtistGradientAdminBox, 1800);
  setTimeout(jhdLoadArtistGradientAdminBox, 3000);
}

document.addEventListener("DOMContentLoaded", jhdInitArtistGradientAdmin);

runWhenReady(() => {
  setTimeout(() => {
    jhdMarkAdminBody();
    jhdRemovePublicGradientEditor();
    jhdInitArtistGradientAdmin();
    loadPublicArtists();
    loadArtistProfile();
  }, 900);
});

window.jhdUpdateGradientPreview = jhdUpdateGradientPreview;
window.jhdSaveArtistGradientColors = jhdSaveArtistGradientColors;
