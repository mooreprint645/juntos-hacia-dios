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
