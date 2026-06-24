/* =========================
   MODO CLARO / OSCURO
========================= */

const themeToggle = document.getElementById("themeToggle");

if (themeToggle) {
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

  if (localStorage.getItem("theme") === "light") {
    document.body.classList.add("light-mode");
    themeToggle.textContent = "☀️";
  }
}


/* =========================
   TRANSPOSICIÓN Y CIFRADO
========================= */

let originalLyrics = "";
let transposeAmount = 0;
let chordLanguage = localStorage.getItem("chordLanguage") || "english";

const notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

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

function transposeChord(chord, steps) {
  const match = chord.match(/^([A-G])(#|b)?(.*)$/);
  if (!match) return chord;

  let root = match[1] + (match[2] || "");
  const suffix = match[3] || "";

  const flats = {
    Db: "C#",
    Eb: "D#",
    Gb: "F#",
    Ab: "G#",
    Bb: "A#"
  };

  root = flats[root] || root;

  const index = notes.indexOf(root);
  if (index === -1) return chord;

  const newIndex = (index + steps + notes.length) % notes.length;
  return notes[newIndex] + suffix;
}

function formatChord(chord) {
  const match = chord.match(/^([A-G])(#|b)?(.*)$/);
  if (!match) return chord;

  let root = match[1] + (match[2] || "");
  const suffix = match[3] || "";

  const flats = {
    Db: "C#",
    Eb: "D#",
    Gb: "F#",
    Ab: "G#",
    Bb: "A#"
  };

  root = flats[root] || root;

  if (chordLanguage === "spanish") {
    return (englishToSpanish[root] || root) + suffix;
  }

  return root + suffix;
}

function transposeText(text, steps) {
  return text.replace(/\b([A-G](#|b)?(m|maj7|m7|7|sus4|sus2|dim|aug|add9)?)(?=\s|$)/g, function(chord) {
    const transposedChord = transposeChord(chord, steps);
    return formatChord(transposedChord);
  });
}

function showLyrics() {
  const lyricsBox = document.getElementById("songLyrics");

  if (lyricsBox) {
    lyricsBox.innerText = transposeText(originalLyrics, transposeAmount);
  }

  const label = document.getElementById("chordLanguageLabel");

  if (label) {
    label.innerText = chordLanguage === "spanish"
      ? "Cifrado actual: Español"
      : "Cifrado actual: Inglés";
  }
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


/* =========================
   FUNCIONES AUXILIARES
========================= */

function getSupabase() {
  if (typeof supabaseClient === "undefined") {
    return null;
  }

  return supabaseClient;
}

function getInitial(text) {
  if (!text) return "?";
  return text.charAt(0).toUpperCase();
}

function safeText(text, fallback = "") {
  return text || fallback;
}


/* =========================
   INICIO: CANCIONES RECIENTES
========================= */

async function loadHomeSongs() {
  const homeSongList = document.getElementById("homeSongList");

  if (!homeSongList) return;

  const client = getSupabase();

  if (!client) {
    homeSongList.innerHTML = `
      <div class="song-card">
        <h3>No se pudo conectar con Supabase</h3>
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

  homeSongList.innerHTML = "";

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

  data.forEach(song => {
    const artistName = song.artists ? song.artists.name : "Sin artista";
    const categoryName = song.categories ? song.categories.name : "Sin categoría";

    homeSongList.innerHTML += `
      <article class="song-card" data-title="${song.title.toLowerCase()} ${artistName.toLowerCase()} ${categoryName.toLowerCase()}">
        <h3>🎵 ${song.title}</h3>
        <p>👤 ${artistName}</p>
        <p>✝ ${categoryName}</p>
        <p>🎸 Tono: ${safeText(song.tone, "No definido")}</p>
        <p>⭐ ${safeText(song.difficulty, "Sin dificultad")}</p>
        <a class="song-btn" href="canto.html?id=${song.slug}">Ver canto</a>
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

const homeSearch = document.getElementById("homeSearch");

if (homeSearch) {
  homeSearch.addEventListener("keyup", function() {
    searchHomeSongs();
  });
}


/* =========================
   CANCIONES DESDE SUPABASE
========================= */

async function loadPublicSongs() {
  const songList = document.getElementById("songList");

  if (!songList) return;

  const client = getSupabase();

  if (!client) {
    songList.innerHTML = `
      <div class="song-card">
        <h3>No se pudo conectar con Supabase</h3>
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

  songList.innerHTML = "";

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

  data.forEach(song => {
    const artistName = song.artists ? song.artists.name : "Sin artista";
    const categoryName = song.categories ? song.categories.name : "Sin categoría";

    songList.innerHTML += `
      <article class="song-card"
        data-category="${categoryName.toLowerCase()}"
        data-title="${song.title.toLowerCase()} ${artistName.toLowerCase()} ${categoryName.toLowerCase()}">
        <h3>🎵 ${song.title}</h3>
        <p>👤 ${artistName}</p>
        <p>✝ ${categoryName}</p>
        <p>🎸 Tono: ${safeText(song.tone, "No definido")}</p>
        <p>⭐ ${safeText(song.difficulty, "Sin dificultad")}</p>
        <a class="song-btn" href="canto.html?id=${song.slug}">Ver canto</a>
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

const songSearch = document.getElementById("songSearch");

if (songSearch) {
  songSearch.addEventListener("keyup", filterSongCards);
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


/* =========================
   CANTO INDIVIDUAL DESDE SUPABASE
========================= */

async function loadSingleSong() {
  const songTitle = document.getElementById("songTitle");
  const songInfo = document.getElementById("songInfo");

  if (!songTitle || !songInfo) return;

  const client = getSupabase();

  if (!client) {
    songTitle.innerText = "No se pudo conectar con Supabase";
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

  songTitle.innerText = data.title;
  songInfo.innerText = `${artistName} · ${categoryName} · Tono ${safeText(data.tone, "No definido")}`;

  originalLyrics = data.lyrics || "";
  transposeAmount = 0;
  showLyrics();

  const tutorialGuitar = document.getElementById("tutorialGuitar");
  const tutorialPiano = document.getElementById("tutorialPiano");

  if (tutorialGuitar) tutorialGuitar.href = data.tutorial_guitar || "#";
  if (tutorialPiano) tutorialPiano.href = data.tutorial_piano || "#";
}


/* =========================
   ARTISTAS DESDE SUPABASE
========================= */

async function loadPublicArtists() {
  const artistList = document.getElementById("artistList");

  if (!artistList) return;

  const client = getSupabase();

  if (!client) {
    artistList.innerHTML = `
      <div class="song-card">
        <h3>No se pudo conectar con Supabase</h3>
        <p style="color:var(--secondary); margin-top:15px;">
          Intenta actualizar la página más tarde.
        </p>
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
        <p style="color:var(--secondary); margin-top:15px;">
          Intenta actualizar la página más tarde.
        </p>
      </div>
    `;
    return;
  }

  artistList.innerHTML = "";

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

  data.forEach(artist => {
    const avatarContent = artist.avatar_url
      ? `<img src="${artist.avatar_url}" alt="${artist.name}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`
      : getInitial(artist.name);

    artistList.innerHTML += `
      <article class="song-card artist-card" data-title="${artist.name.toLowerCase()} ${(artist.description || "").toLowerCase()}">
        <div class="artist-avatar">${avatarContent}</div>
        <h3>${artist.name}</h3>
        <p>${artist.description || "Sin descripción todavía."}</p>
        <a class="song-btn" href="artista.html?id=${artist.slug}">Ver perfil</a>
      </article>
    `;
  });
}

const artistSearch = document.getElementById("artistSearch");

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


/* =========================
   PERFIL DE ARTISTA DESDE SUPABASE
========================= */

async function loadArtistProfile() {
  const artistName = document.getElementById("artistName");
  const artistDescription = document.getElementById("artistDescription");
  const artistTags = document.getElementById("artistTags");
  const artistAvatar = document.getElementById("artistAvatar");
  const artistSongsList = document.getElementById("artistSongsList");

  if (!artistName || !artistSongsList) return;

  const client = getSupabase();

  if (!client) {
    artistName.innerText = "No se pudo conectar con Supabase";
    return;
  }

  const slug = new URLSearchParams(window.location.search).get("id");

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

  artistName.innerText = artist.name;
  artistDescription.innerText = artist.description || "Sin descripción todavía.";
  artistTags.innerText = "Artista / Ministerio";

  if (artist.avatar_url) {
    artistAvatar.innerHTML = `<img src="${artist.avatar_url}" alt="${artist.name}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`;
  } else {
    artistAvatar.innerText = getInitial(artist.name);
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
        <h3>🎵 ${song.title}</h3>
        <p>✝ ${categoryName}</p>
        <p>🎸 Tono: ${safeText(song.tone, "No definido")}</p>
        <p>⭐ ${safeText(song.difficulty, "Sin dificultad")}</p>
        <a class="song-btn" href="canto.html?id=${song.slug}">Ver canto</a>
      </article>
    `;
  });
}


/* =========================
   CATEGORÍAS DESDE SUPABASE
========================= */

async function loadPublicCategories() {
  const categoryList = document.getElementById("categoryList");

  if (!categoryList) return;

  const client = getSupabase();

  if (!client) {
    categoryList.innerHTML = `
      <div class="song-card">
        <h3>No se pudo conectar con Supabase</h3>
        <p style="color:var(--secondary); margin-top:15px;">
          Intenta actualizar la página más tarde.
        </p>
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
        <p style="color:var(--secondary); margin-top:15px;">
          Intenta actualizar la página más tarde.
        </p>
      </div>
    `;
    return;
  }

  categoryList.innerHTML = "";

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

  data.forEach(category => {
    categoryList.innerHTML += `
      <article class="song-card category-card" data-title="${category.name.toLowerCase()} ${(category.description || "").toLowerCase()}">
        <div class="category-icon">🎵</div>
        <h3>${category.name}</h3>
        <p>${category.description || "Sin descripción todavía."}</p>
        <a class="song-btn" href="canciones.html?buscar=${encodeURIComponent(category.name)}">Ver cantos</a>
      </article>
    `;
  });
}

const categorySearch = document.getElementById("categorySearch");

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


/* =========================
   CARGAR SEGÚN LA PÁGINA
========================= */

loadHomeSongs();
loadPublicSongs();
loadSingleSong();
loadPublicArtists();
loadArtistProfile();
loadPublicCategories();
/* =========================
   MENÚ HAMBURGUESA MÓVIL
========================= */

const menuToggle = document.getElementById("menuToggle");
const navMenu = document.getElementById("navMenu");

if (menuToggle && navMenu) {
  menuToggle.addEventListener("click", () => {
    navMenu.classList.toggle("show-menu");

    if (navMenu.classList.contains("show-menu")) {
      menuToggle.textContent = "✕ Cerrar";
    } else {
      menuToggle.textContent = "☰ Menú";
    }
  });

  const navLinks = navMenu.querySelectorAll("a");

  navLinks.forEach(link => {
    link.addEventListener("click", () => {
      navMenu.classList.remove("show-menu");
      menuToggle.textContent = "☰ Menú";
    });
  });
}
/* =========================
   DONACIONES PÚBLICAS + ADMIN
========================= */

let editingDonationId = null;

function donationSafe(value) {
  return String(value || "").trim();
}

function donationEscape(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function donationRow(label, value, canCopy = false) {
  if (!donationSafe(value)) return "";

  const cleanValue = donationEscape(value);

  return `
    <div class="donation-row">
      <span class="donation-label">${donationEscape(label)}</span>
      <span class="donation-value">${cleanValue}</span>
      ${canCopy ? `<button class="copy-btn" onclick="copyDonationText('${cleanValue}')">Copiar</button>` : ""}
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
        <p style="color:var(--secondary); margin-top:12px;">
          Intenta actualizar la página más tarde.
        </p>
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
        <p style="color:var(--secondary); margin-top:12px;">
          Intenta actualizar la página más tarde.
        </p>
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
    donationCardsList.innerHTML += `
      <article class="song-card donation-card">
        <span class="donation-badge">${donationEscape(card.payment_type || "Donación")}</span>

        <h3>${donationEscape(card.title)}</h3>

        ${card.description ? `<p>${donationEscape(card.description)}</p>` : ""}

        <div class="donation-info">
          ${donationRow("Nombre", card.account_name)}
          ${donationRow("Banco", card.bank_name)}
          ${donationRow("Cuenta", card.account_number, true)}
          ${donationRow("CLABE", card.clabe, true)}
          ${donationRow("Tarjeta", card.card_number, true)}
          ${donationRow("Teléfono", card.phone, true)}
        </div>

        ${card.link_url ? `
          <div class="donation-link">
            <a class="song-btn" href="${donationEscape(card.link_url)}" target="_blank" rel="noopener">
              Abrir enlace
            </a>
          </div>
        ` : ""}

        ${card.note ? `
          <div class="donation-note">
            ${donationEscape(card.note)}
          </div>
        ` : ""}
      </article>
    `;
  });
}

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
    title: donationSafe(document.getElementById("donationTitleInput").value),
    payment_type: donationSafe(document.getElementById("donationTypeInput").value),
    account_name: donationSafe(document.getElementById("donationAccountNameInput").value),
    bank_name: donationSafe(document.getElementById("donationBankInput").value),
    account_number: donationSafe(document.getElementById("donationAccountInput").value),
    clabe: donationSafe(document.getElementById("donationClabeInput").value),
    card_number: donationSafe(document.getElementById("donationCardInput").value),
    phone: donationSafe(document.getElementById("donationPhoneInput").value),
    link_url: donationSafe(document.getElementById("donationLinkInput").value),
    description: donationSafe(document.getElementById("donationDescriptionInput").value),
    note: donationSafe(document.getElementById("donationNoteInput").value),
    display_order: Number(document.getElementById("donationOrderInput").value || 0),
    is_active: document.getElementById("donationActiveInput").checked,
    updated_at: new Date().toISOString()
  };
}

function clearDonationForm() {
  editingDonationId = null;

  const title = document.getElementById("donationFormTitle");
  if (title) title.innerText = "Agregar tarjeta de donación";

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
    if (input) input.value = "";
  });

  const typeInput = document.getElementById("donationTypeInput");
  if (typeInput) typeInput.value = "Transferencia";

  const activeInput = document.getElementById("donationActiveInput");
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
          <strong>${donationEscape(card.title)}</strong>
          <p style="color:var(--secondary); margin-top:6px;">
            ${donationEscape(card.payment_type || "Donación")} · 
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

  document.getElementById("donationTitleInput").scrollIntoView({ behavior: "smooth", block: "center" });
}

function cancelDonationEdit() {
  clearDonationForm();
}

async function deleteDonationCard(id) {
  const confirmDelete = confirm("¿Eliminar esta tarjeta de donación?");

  if (!confirmDelete) return;

  const client = getSupabase();

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

loadPublicDonationCards();
setupDonationAdminSection();

if (typeof supabaseClient !== "undefined") {
  supabaseClient.auth.onAuthStateChange(() => {
    setupDonationAdminSection();
    loadAdminDonationCards();
  });
}
/* =========================
   BOTONES DE APARTADOS EN ADMIN
   Intro / Verso / Coro / Puente
========================= */

function jhdInsertSongSection(sectionName) {
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
}

function jhdInsertSongTemplate() {
  const textarea = document.getElementById("songLyricsInput");

  if (!textarea) {
    alert("No se encontró el campo de letra.");
    return;
  }

  const template = `[Intro]
G   D   Em   C

[Verso 1]


[Pre Coro]


[Coro]


[Verso 2]


[Puente]


[Coro]


[Final]

`;

  if (textarea.value.trim()) {
    textarea.value = textarea.value.trimEnd() + "\n\n" + template;
  } else {
    textarea.value = template;
  }

  textarea.focus();
}

function jhdCreateLyricsToolbar() {
  const textarea = document.getElementById("songLyricsInput");

  if (!textarea) return;

  if (document.getElementById("jhdLyricsToolbar")) return;

  const toolbar = document.createElement("div");
  toolbar.id = "jhdLyricsToolbar";
  toolbar.className = "section-toolbar-box";

  toolbar.innerHTML = `
    <div class="section-toolbar-title">Apartados de la canción</div>

    <div class="section-toolbar">
      <button type="button" class="section-chip" onclick="jhdInsertSongSection('Intro')">Intro</button>
      <button type="button" class="section-chip" onclick="jhdInsertSongSection('Verso 1')">Verso 1</button>
      <button type="button" class="section-chip" onclick="jhdInsertSongSection('Pre Coro')">Pre Coro</button>
      <button type="button" class="section-chip" onclick="jhdInsertSongSection('Coro')">Coro</button>
      <button type="button" class="section-chip" onclick="jhdInsertSongSection('Verso 2')">Verso 2</button>
      <button type="button" class="section-chip" onclick="jhdInsertSongSection('Puente')">Puente</button>
      <button type="button" class="section-chip" onclick="jhdInsertSongSection('Interludio')">Interludio</button>
      <button type="button" class="section-chip" onclick="jhdInsertSongSection('Final')">Final</button>
      <button type="button" class="section-chip section-template-btn" onclick="jhdInsertSongTemplate()">Plantilla completa</button>
    </div>

    <p class="lyrics-helper">
      Presiona un apartado y se insertará en la letra. Puedes escribir los acordes debajo de cada sección.
    </p>
  `;

  textarea.parentNode.insertBefore(toolbar, textarea);
}

jhdCreateLyricsToolbar();

document.addEventListener("DOMContentLoaded", jhdCreateLyricsToolbar);

setTimeout(jhdCreateLyricsToolbar, 500);
setTimeout(jhdCreateLyricsToolbar, 1500);
setTimeout(jhdCreateLyricsToolbar, 3000);
/* =========================
   VISTA PREVIA DE LETRA EN ADMIN
========================= */

function jhdPreviewEscape(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function jhdPreviewNormalizeTitle(line) {
  return String(line || "")
    .trim()
    .replace(/^\[/, "")
    .replace(/\]$/, "")
    .replace(/:$/, "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function jhdPreviewCleanTitle(line) {
  return String(line || "")
    .trim()
    .replace(/^\[/, "")
    .replace(/\]$/, "")
    .replace(/:$/, "")
    .trim();
}

function jhdPreviewIsSectionTitle(line) {
  const title = jhdPreviewNormalizeTitle(line);

  const patterns = [
    /^intro$/,
    /^introduccion$/,
    /^verso\s*\d*$/,
    /^estrofa\s*\d*$/,
    /^pre\s*coro\s*\d*$/,
    /^precoro\s*\d*$/,
    /^coro\s*\d*$/,
    /^intermedio$/,
    /^interludio$/,
    /^instrumental$/,
    /^puente$/,
    /^bridge$/,
    /^solo$/,
    /^tag$/,
    /^final$/,
    /^outro$/,
    /^coro\s*final$/,
    /^repetir\s*coro$/
  ];

  return patterns.some(pattern => pattern.test(title));
}

function jhdPreviewRenderLyrics(text) {
  if (!text || !text.trim()) {
    return `<span class="preview-line">Aquí aparecerá la vista previa de la letra con acordes.</span>`;
  }

  return text.split("\n").map(line => {
    const trimmedLine = line.trim();

    if (trimmedLine === "") {
      return "";
    }

    if (jhdPreviewIsSectionTitle(trimmedLine)) {
      return `<span class="preview-section-title">${jhdPreviewEscape(jhdPreviewCleanTitle(trimmedLine))}</span>`;
    }

    return `<span class="preview-line">${jhdPreviewEscape(line)}</span>`;
  }).join("\n");
}

function jhdUpdateLyricsPreview() {
  const textarea = document.getElementById("songLyricsInput");
  const previewContent = document.getElementById("jhdLyricsPreviewContent");

  if (!textarea || !previewContent) return;

  previewContent.innerHTML = jhdPreviewRenderLyrics(textarea.value);
}

function jhdShowLyricsPreview() {
  const previewBox = document.getElementById("jhdLyricsPreviewBox");

  if (!previewBox) return;

  previewBox.classList.add("show");
  jhdUpdateLyricsPreview();
}

function jhdHideLyricsPreview() {
  const previewBox = document.getElementById("jhdLyricsPreviewBox");

  if (!previewBox) return;

  previewBox.classList.remove("show");
}

function jhdCreateLyricsPreview() {
  const textarea = document.getElementById("songLyricsInput");

  if (!textarea) return;

  if (document.getElementById("jhdLyricsPreviewWrapper")) return;

  const wrapper = document.createElement("div");
  wrapper.id = "jhdLyricsPreviewWrapper";

  wrapper.innerHTML = `
    <div class="lyrics-preview-tools">
      <button type="button" class="lyrics-preview-btn" onclick="jhdShowLyricsPreview()">
        Ver vista previa
      </button>

      <button type="button" class="lyrics-preview-btn secondary" onclick="jhdUpdateLyricsPreview()">
        Actualizar vista previa
      </button>

      <button type="button" class="lyrics-preview-btn secondary" onclick="jhdHideLyricsPreview()">
        Ocultar vista previa
      </button>
    </div>

    <div class="lyrics-preview-box" id="jhdLyricsPreviewBox">
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
      jhdUpdateLyricsPreview();
    }
  });
}

jhdCreateLyricsPreview();

document.addEventListener("DOMContentLoaded", jhdCreateLyricsPreview);

setTimeout(jhdCreateLyricsPreview, 500);
setTimeout(jhdCreateLyricsPreview, 1500);
setTimeout(jhdCreateLyricsPreview, 3000);
/* =========================
   CORRECCIÓN FINAL VISTA PREVIA
========================= */

function jhdForceShowLyricsPreview() {
  const previewBoxes = document.querySelectorAll("#jhdLyricsPreviewBox, .lyrics-preview-box");

  previewBoxes.forEach(box => {
    box.classList.add("show");
    box.style.display = "block";
  });

  if (typeof jhdUpdateLyricsPreview === "function") {
    jhdUpdateLyricsPreview();
  }
}

function jhdForceHideLyricsPreview() {
  const previewBoxes = document.querySelectorAll("#jhdLyricsPreviewBox, .lyrics-preview-box");

  previewBoxes.forEach(box => {
    box.classList.remove("show");
    box.style.display = "none";
  });
}

/* Reemplaza el comportamiento anterior */
function jhdShowLyricsPreview() {
  jhdForceShowLyricsPreview();
}

function jhdHideLyricsPreview() {
  jhdForceHideLyricsPreview();
}

/* Ocultar automáticamente al cargar */
setTimeout(jhdForceHideLyricsPreview, 300);
setTimeout(jhdForceHideLyricsPreview, 1000);
setTimeout(jhdForceHideLyricsPreview, 2000);
/* =========================
   CAJAS POR APARTADO
   Vista pública + Admin
========================= */

function jhdBoxEscape(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function jhdBoxCleanTitle(line) {
  return String(line || "")
    .trim()
    .replace(/^\[/, "")
    .replace(/\]$/, "")
    .replace(/:$/, "")
    .trim();
}

function jhdBoxNormalizeTitle(line) {
  return jhdBoxCleanTitle(line)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function jhdBoxIsSectionTitle(line) {
  const raw = String(line || "").trim();
  const title = jhdBoxNormalizeTitle(raw);

  const isBracketTitle = raw.startsWith("[") && raw.endsWith("]");

  const patterns = [
    /^intro$/,
    /^introduccion$/,
    /^verso\s*\d*$/,
    /^estrofa\s*\d*$/,
    /^pre\s*coro\s*\d*$/,
    /^precoro\s*\d*$/,
    /^coro\s*\d*$/,
    /^coro\s*final$/,
    /^repetir\s*coro$/,
    /^intermedio$/,
    /^interludio$/,
    /^instrumental$/,
    /^puente$/,
    /^bridge$/,
    /^solo$/,
    /^tag$/,
    /^final$/,
    /^outro$/
  ];

  return isBracketTitle || patterns.some(pattern => pattern.test(title));
}

function jhdBoxParseLyrics(text) {
  const value = String(text || "");
  const lines = value.split("\n");

  const blocks = [];
  let currentBlock = null;
  let position = 0;

  lines.forEach(line => {
    const lineStartPosition = position;
    const trimmedLine = line.trim();

    if (trimmedLine && jhdBoxIsSectionTitle(trimmedLine)) {
      if (currentBlock) {
        blocks.push(currentBlock);
      }

      currentBlock = {
        title: jhdBoxCleanTitle(trimmedLine),
        lines: [],
        position: lineStartPosition
      };
    } else {
      if (!currentBlock) {
        currentBlock = {
          title: "Sin apartado",
          lines: [],
          position: 0
        };
      }

      currentBlock.lines.push(line);
    }

    position += line.length + 1;
  });

  if (currentBlock) {
    blocks.push(currentBlock);
  }

  return blocks.filter(block => {
    const hasTitle = block.title && block.title !== "Sin apartado";
    const hasContent = block.lines.join("").trim().length > 0;
    return hasTitle || hasContent;
  });
}

/* Reemplaza la vista pública anterior por cajas */
function renderLyricsHTML(text) {
  if (!text || !text.trim()) {
    return `
      <span class="lyrics-boxed">
        <span class="lyrics-section-box">
          <span class="lyrics-section-box-title">Letra</span>
          <span class="lyrics-section-box-content">No hay letra disponible todavía.</span>
        </span>
      </span>
    `;
  }

  const blocks = jhdBoxParseLyrics(text);

  return `
    <span class="lyrics-boxed">
      ${blocks.map(block => `
        <span class="lyrics-section-box">
          <span class="lyrics-section-box-title">${jhdBoxEscape(block.title)}</span>
          <span class="lyrics-section-box-content">${jhdBoxEscape(block.lines.join("\n").trim() || "Sin contenido todavía.")}</span>
        </span>
      `).join("")}
    </span>
  `;
}

/* Reforzar showLyrics para usar las cajas */
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

/* Vista previa también en cajas */
function jhdPreviewRenderLyrics(text) {
  return renderLyricsHTML(text)
    .replaceAll("lyrics-section-box", "lyrics-section-box")
    .replaceAll("lyrics-section-box-title", "lyrics-section-box-title")
    .replaceAll("lyrics-section-box-content", "lyrics-section-box-content");
}

function jhdUpdateLyricsPreview() {
  const textarea = document.getElementById("songLyricsInput");
  const previewContent = document.getElementById("jhdLyricsPreviewContent");

  if (!textarea || !previewContent) return;

  previewContent.innerHTML = renderLyricsHTML(textarea.value);
}

/* Mapa visual de secciones en el editor */
function jhdCreateEditorSectionMap() {
  const textarea = document.getElementById("songLyricsInput");

  if (!textarea) return;

  if (document.getElementById("jhdEditorSectionMap")) return;

  const map = document.createElement("div");
  map.id = "jhdEditorSectionMap";
  map.className = "editor-section-map";

  map.innerHTML = `
    <div class="editor-section-map-title">Mapa visual de secciones</div>
    <div class="editor-section-map-help">
      Estas cajas te ayudan a revisar dónde empieza cada parte. Toca una caja para ir a esa sección dentro del editor.
    </div>
    <div class="editor-section-blocks" id="jhdEditorSectionBlocks">
      <div class="editor-section-empty">Escribe apartados como [Intro], [Verso 1], [Coro] para verlos aquí.</div>
    </div>
  `;

  const previewWrapper = document.getElementById("jhdLyricsPreviewWrapper");

  if (previewWrapper) {
    textarea.parentNode.insertBefore(map, previewWrapper);
  } else {
    textarea.parentNode.insertBefore(map, textarea.nextSibling);
  }

  textarea.addEventListener("input", jhdUpdateEditorSectionMap);
  textarea.addEventListener("keyup", jhdUpdateEditorSectionMap);
  textarea.addEventListener("change", jhdUpdateEditorSectionMap);

  jhdUpdateEditorSectionMap();
}

function jhdUpdateEditorSectionMap() {
  const textarea = document.getElementById("songLyricsInput");
  const blocksContainer = document.getElementById("jhdEditorSectionBlocks");

  if (!textarea || !blocksContainer) return;

  const blocks = jhdBoxParseLyrics(textarea.value);

  if (!blocks || blocks.length === 0) {
    blocksContainer.innerHTML = `
      <div class="editor-section-empty">
        Escribe apartados como [Intro], [Verso 1], [Coro] para verlos aquí.
      </div>
    `;
    return;
  }

  blocksContainer.innerHTML = blocks.map((block, index) => {
    const preview = block.lines
      .join("\n")
      .trim()
      .split("\n")
      .slice(0, 5)
      .join("\n");

    return `
      <button type="button" class="editor-section-block" onclick="jhdGoToEditorSection(${block.position})">
        <strong>${jhdBoxEscape(block.title)}</strong>
        <span class="editor-section-preview">${jhdBoxEscape(preview || "Sin contenido todavía.")}</span>
      </button>
    `;
  }).join("");
}

function jhdGoToEditorSection(position) {
  const textarea = document.getElementById("songLyricsInput");

  if (!textarea) return;

  textarea.focus();
  textarea.selectionStart = position;
  textarea.selectionEnd = position;

  textarea.scrollTop = Math.max(0, position * 0.55);
}

/* Rehacer botones de apartados para que también actualicen el mapa */
function jhdInsertSongSection(sectionName) {
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

  jhdUpdateEditorSectionMap();

  if (typeof jhdUpdateLyricsPreview === "function") {
    jhdUpdateLyricsPreview();
  }
}

function jhdInsertSongTemplate() {
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

  jhdUpdateEditorSectionMap();

  if (typeof jhdUpdateLyricsPreview === "function") {
    jhdUpdateLyricsPreview();
  }
}

jhdCreateEditorSectionMap();

document.addEventListener("DOMContentLoaded", jhdCreateEditorSectionMap);

setTimeout(jhdCreateEditorSectionMap, 500);
setTimeout(jhdCreateEditorSectionMap, 1500);
setTimeout(jhdCreateEditorSectionMap, 3000);

setTimeout(jhdUpdateEditorSectionMap, 800);
setTimeout(jhdUpdateEditorSectionMap, 2000);
setTimeout(jhdUpdateEditorSectionMap, 3500);
/* =========================
   LETRA COLOREADA SIN CAJAS
   Vista pública + vista previa admin
========================= */

function jhdColorEscape(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function jhdColorCleanSection(line) {
  return String(line || "")
    .trim()
    .replace(/^\[/, "")
    .replace(/\]$/, "")
    .replace(/:$/, "")
    .trim();
}

function jhdColorNormalize(value) {
  return jhdColorCleanSection(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function jhdColorIsSection(line) {
  const raw = String(line || "").trim();
  const title = jhdColorNormalize(raw);

  if (raw.startsWith("[") && raw.endsWith("]")) {
    return true;
  }

  const patterns = [
    /^intro$/,
    /^introduccion$/,
    /^verso\s*\d*$/,
    /^estrofa\s*\d*$/,
    /^pre\s*coro\s*\d*$/,
    /^precoro\s*\d*$/,
    /^coro\s*\d*$/,
    /^coro\s*final$/,
    /^repetir\s*coro$/,
    /^puente$/,
    /^intermedio$/,
    /^interludio$/,
    /^instrumental$/,
    /^solo$/,
    /^final$/,
    /^outro$/
  ];

  return patterns.some(pattern => pattern.test(title));
}

function jhdColorSectionClass(line) {
  const title = jhdColorNormalize(line);

  if (title.includes("intro") || title.includes("introduccion")) return "section-intro";
  if (title.includes("verso")) return "section-verso";
  if (title.includes("estrofa")) return "section-estrofa";
  if (title.includes("pre coro") || title.includes("precoro")) return "section-precoro";
  if (title.includes("coro")) return "section-coro";
  if (title.includes("puente") || title.includes("bridge")) return "section-puente";
  if (title.includes("interludio")) return "section-interludio";
  if (title.includes("intermedio") || title.includes("instrumental") || title.includes("solo")) return "section-intermedio";
  if (title.includes("final") || title.includes("outro")) return "section-final";

  return "section-default";
}

function jhdColorHighlightChords(line) {
  const escaped = jhdColorEscape(line);

  return escaped.replace(
    /(^|[\s(\[])([A-G](?:#|b)?(?:m|maj7|maj9|m7|m9|7|9|11|13|6|sus4|sus2|dim|aug|add9)?(?:\/[A-G](?:#|b)?)?)(?=\s|$|[)\],])/g,
    function(match, before, chord) {
      return `${before}<span class="chord-token">${chord}</span>`;
    }
  );
}

function jhdColorIsChordLine(line) {
  const clean = String(line || "").trim();

  if (!clean) return false;

  const withoutChords = clean.replace(
    /\b[A-G](?:#|b)?(?:m|maj7|maj9|m7|m9|7|9|11|13|6|sus4|sus2|dim|aug|add9)?(?:\/[A-G](?:#|b)?)?\b/g,
    ""
  );

  return withoutChords.replace(/[|\-–—.,/()\[\]\s]/g, "").length === 0;
}

function renderLyricsHTML(text) {
  if (!text || !String(text).trim()) {
    return `
      <span class="lyrics-colored-view">
        <span class="lyrics-colored-line">No hay letra disponible todavía.</span>
      </span>
    `;
  }

  const lines = String(text).split("\n");

  const html = lines.map(line => {
    const trimmed = line.trim();

    if (trimmed === "") {
      return `<span class="lyrics-colored-line"></span>`;
    }

    if (jhdColorIsSection(trimmed)) {
      const sectionName = jhdColorCleanSection(trimmed);
      const sectionClass = jhdColorSectionClass(trimmed);

      return `<span class="lyrics-colored-section ${sectionClass}">${jhdColorEscape(sectionName)}</span>`;
    }

    const chordLineClass = jhdColorIsChordLine(line) ? " lyrics-chord-line" : "";

    return `<span class="lyrics-colored-line${chordLineClass}">${jhdColorHighlightChords(line)}</span>`;
  }).join("\n");

  return `<span class="lyrics-colored-view">${html}</span>`;
}

/* Vista pública del canto con colores */
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

/* Vista previa del admin con los mismos colores */
function jhdPreviewRenderLyrics(text) {
  return renderLyricsHTML(text);
}

function jhdUpdateLyricsPreview() {
  const textarea = document.getElementById("songLyricsInput");
  const previewContent = document.getElementById("jhdLyricsPreviewContent");

  if (!textarea || !previewContent) return;

  previewContent.innerHTML = renderLyricsHTML(textarea.value);
}

/* Ocultar mapa de cajas anterior si existe */
function jhdHideOldSectionMap() {
  const oldMap = document.getElementById("jhdEditorSectionMap");

  if (oldMap) {
    oldMap.style.display = "none";
  }
}

jhdHideOldSectionMap();
setTimeout(jhdHideOldSectionMap, 500);
setTimeout(jhdHideOldSectionMap, 1500);
setTimeout(jhdHideOldSectionMap, 3000);
/* =========================================================
   RENDER DE LETRA EN CAJAS DE COLORES POR APARTADO
========================================================= */

function jhdBoxColorEscape(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function jhdBoxColorCleanSection(line) {
  return String(line || "")
    .trim()
    .replace(/^\[/, "")
    .replace(/\]$/, "")
    .replace(/:$/, "")
    .trim();
}

function jhdBoxColorNormalize(value) {
  return jhdBoxColorCleanSection(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function jhdBoxColorSectionClass(title) {
  const t = jhdBoxColorNormalize(title);

  if (t.includes("intro") || t.includes("introduccion")) return "section-card-intro";
  if (t.includes("verso")) return "section-card-verso";
  if (t.includes("estrofa")) return "section-card-estrofa";
  if (t.includes("pre coro") || t.includes("precoro")) return "section-card-precoro";
  if (t.includes("coro")) return "section-card-coro";
  if (t.includes("puente") || t.includes("bridge")) return "section-card-puente";
  if (t.includes("interludio")) return "section-card-interludio";
  if (t.includes("intermedio") || t.includes("instrumental") || t.includes("solo")) return "section-card-intermedio";
  if (t.includes("final") || t.includes("outro")) return "section-card-final";

  return "section-card-default";
}

function jhdBoxColorIsSection(line) {
  const raw = String(line || "").trim();
  const title = jhdBoxColorNormalize(raw);

  if (raw.startsWith("[") && raw.endsWith("]")) return true;

  const patterns = [
    /^intro$/,
    /^introduccion$/,
    /^verso\s*\d*$/,
    /^estrofa\s*\d*$/,
    /^pre\s*coro\s*\d*$/,
    /^precoro\s*\d*$/,
    /^coro\s*\d*$/,
    /^coro\s*final$/,
    /^repetir\s*coro$/,
    /^puente$/,
    /^intermedio$/,
    /^interludio$/,
    /^instrumental$/,
    /^solo$/,
    /^final$/,
    /^outro$/
  ];

  return patterns.some(pattern => pattern.test(title));
}

function jhdBoxColorHighlightChords(line) {
  const escaped = jhdBoxColorEscape(line);

  return escaped.replace(
    /(^|[\s(\[])([A-G](?:#|b)?(?:m|maj7|maj9|m7|m9|7|9|11|13|6|sus4|sus2|dim|aug|add9)?(?:\/[A-G](?:#|b)?)?)(?=\s|$|[)\],])/g,
    function(match, before, chord) {
      return `${before}<span class="chord-token">${chord}</span>`;
    }
  );
}

function jhdBoxColorParseLyrics(text) {
  const lines = String(text || "").split("\n");
  const sections = [];
  let currentSection = null;

  lines.forEach(line => {
    const trimmed = line.trim();

    if (trimmed && jhdBoxColorIsSection(trimmed)) {
      if (currentSection) {
        sections.push(currentSection);
      }

      currentSection = {
        title: jhdBoxColorCleanSection(trimmed),
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

function renderLyricsHTML(text) {
  if (!text || !String(text).trim()) {
    return `
      <div class="lyrics-grouped-view">
        <div class="lyrics-section-card section-card-default">
          <div class="lyrics-section-title">Letra</div>
          <div class="lyrics-section-content">No hay letra disponible todavía.</div>
        </div>
      </div>
    `;
  }

  const sections = jhdBoxColorParseLyrics(text);

  return `
    <div class="lyrics-grouped-view">
      ${sections.map(section => {
        const sectionClass = jhdBoxColorSectionClass(section.title);
        const content = section.lines.map(line => jhdBoxColorHighlightChords(line)).join("\n").trim();

        return `
          <div class="lyrics-section-card ${sectionClass}">
            <div class="lyrics-section-title">${jhdBoxColorEscape(section.title)}</div>
            <div class="lyrics-section-content">${content || "Sin contenido todavía."}</div>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

/* Vista pública del canto */
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

/* Vista previa del admin */
function jhdPreviewRenderLyrics(text) {
  return renderLyricsHTML(text);
}

function jhdUpdateLyricsPreview() {
  const textarea = document.getElementById("songLyricsInput");
  const previewContent = document.getElementById("jhdLyricsPreviewContent");

  if (!textarea || !previewContent) return;

  previewContent.innerHTML = renderLyricsHTML(textarea.value);
}
/* =========================================================
   RENDER TIPO APP
   Tarjetas oscuras + chip pequeño arriba
========================================================= */

function jhdAppEscape(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function jhdAppCleanSection(line) {
  return String(line || "")
    .trim()
    .replace(/^\[/, "")
    .replace(/\]$/, "")
    .replace(/:$/, "")
    .trim();
}

function jhdAppNormalize(value) {
  return jhdAppCleanSection(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function jhdAppIsSection(line) {
  const raw = String(line || "").trim();
  const title = jhdAppNormalize(raw);

  if (raw.startsWith("[") && raw.endsWith("]")) return true;

  const patterns = [
    /^intro$/,
    /^introduccion$/,
    /^verso\s*\d*$/,
    /^estrofa\s*\d*$/,
    /^pre\s*coro\s*\d*$/,
    /^precoro\s*\d*$/,
    /^coro\s*\d*$/,
    /^coro\s*final$/,
    /^repetir\s*coro$/,
    /^puente$/,
    /^intermedio$/,
    /^interludio$/,
    /^instrumental$/,
    /^solo$/,
    /^final$/,
    /^outro$/
  ];

  return patterns.some(pattern => pattern.test(title));
}

function jhdAppChipClass(title) {
  const t = jhdAppNormalize(title);

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

function jhdAppChipLabel(title) {
  const t = jhdAppNormalize(title);

  const numMatch = t.match(/\d+/);
  const num = numMatch ? numMatch[0] : "";

  if (t.includes("intro") || t.includes("introduccion")) return "I";
  if (t.includes("verso")) return num ? `V${num}` : "V";
  if (t.includes("estrofa")) return num ? `E${num}` : "E";
  if (t.includes("pre coro") || t.includes("precoro")) return num ? `PC ${num}` : "PC";
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

function jhdAppHighlightChords(line) {
  const escaped = jhdAppEscape(line);

  return escaped.replace(
    /(^|[\s(\[])([A-G](?:#|b)?(?:m|maj7|maj9|m7|m9|7|9|11|13|6|sus4|sus2|dim|aug|add9)?(?:\/[A-G](?:#|b)?)?)(?=\s|$|[)\],])/g,
    function(match, before, chord) {
      return `${before}<span class="chord-token">${chord}</span>`;
    }
  );
}

function jhdAppParseLyrics(text) {
  const lines = String(text || "").split("\n");
  const sections = [];
  let currentSection = null;

  lines.forEach(line => {
    const trimmed = line.trim();

    if (trimmed && jhdAppIsSection(trimmed)) {
      if (currentSection) sections.push(currentSection);

      currentSection = {
        title: jhdAppCleanSection(trimmed),
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

  if (currentSection) sections.push(currentSection);

  return sections.filter(section => section.title || section.lines.join("").trim());
}

function jhdAppRenderLines(lines) {
  return lines.map(line => {
    return `<span class="lyrics-app-line">${jhdAppHighlightChords(line)}</span>`;
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

  const sections = jhdAppParseLyrics(text);

  return `
    <div class="lyrics-app-view">
      ${sections.map(section => {
        const chipClass = jhdAppChipClass(section.title);
        const chipLabel = jhdAppChipLabel(section.title);

        return `
          <div class="lyrics-app-section">
            <div class="lyrics-app-chip ${chipClass}" title="${jhdAppEscape(section.title)}">
              ${jhdAppEscape(chipLabel)}
            </div>

            <div class="lyrics-app-content">
              ${jhdAppRenderLines(section.lines)}
            </div>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

/* Vista pública */
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

/* Vista previa admin */
function jhdPreviewRenderLyrics(text) {
  return renderLyricsHTML(text);
}

function jhdUpdateLyricsPreview() {
  const textarea = document.getElementById("songLyricsInput");
  const previewContent = document.getElementById("jhdLyricsPreviewContent");

  if (!textarea || !previewContent) return;

  previewContent.innerHTML = renderLyricsHTML(textarea.value);
}
