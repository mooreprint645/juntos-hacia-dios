/* =========================
   DATOS TEMPORALES
   Luego esto vendrá desde Supabase
========================= */

const songs = {
  maria: {
    title: "Quiero caminar contigo María",
    artist: "Athenas",
    category: "Católica · María",
    tone: "G",
    difficulty: "Fácil",
    info: "Athenas · Católica · María · Tono G",
    lyrics: `
      G
Quiero caminar contigo María

      Em
Por el sendero de la fe

      C
Quiero sentir tu compañía

      D
Y caminar hacia Dios
`,
    tutorialGuitar: "#",
    tutorialPiano: "#"
  },

  espiritu: {
    title: "Ven Espíritu Santo",
    artist: "Adoración",
    category: "Cristiana · Espíritu Santo",
    tone: "D",
    difficulty: "Fácil",
    info: "Adoración · Cristiana · Espíritu Santo · Tono D",
    lyrics: `
      D
Ven Espíritu Santo

      Bm
Llena mi vida

      G
Quiero adorarte

      A
Con todo mi ser
`,
    tutorialGuitar: "#",
    tutorialPiano: "#"
  },

  digno: {
    title: "Digno y Santo",
    artist: "Alabanza",
    category: "Cristiana · Alabanza",
    tone: "A",
    difficulty: "Medio",
    info: "Alabanza · Cristiana · Alabanza · Tono A",
    lyrics: `
      A
Digno y Santo

      E
El Cordero inmolado

      F#m
Te exaltamos Señor

      D
Rey de gloria
`,
    tutorialGuitar: "#",
    tutorialPiano: "#"
  }
};

const artists = {
  athenas: {
    name: "Athenas",
    avatar: "A",
    description: "Cantante católica de adoración y música espiritual.",
    tags: "Católica · María · Adoración",
    songs: ["maria"]
  },

  adoracion: {
    name: "Adoración",
    avatar: "AD",
    description: "Ministerio de cantos cristianos de adoración y oración.",
    tags: "Cristiana · Espíritu Santo · Adoración",
    songs: ["espiritu"]
  },

  alabanza: {
    name: "Alabanza",
    avatar: "AL",
    description: "Cantos cristianos de alabanza congregacional.",
    tags: "Cristiana · Alabanza",
    songs: ["digno"]
  }
};


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
   CANTO INDIVIDUAL
========================= */

const params = new URLSearchParams(window.location.search);
const id = params.get("id");

const songTitle = document.getElementById("songTitle");
const songInfo = document.getElementById("songInfo");

if (songTitle && songInfo) {
  if (id && songs[id]) {
    const song = songs[id];

    songTitle.innerText = song.title;
    songInfo.innerText = song.info;

    originalLyrics = song.lyrics;
    showLyrics();

    const tutorialGuitar = document.getElementById("tutorialGuitar");
    const tutorialPiano = document.getElementById("tutorialPiano");

    if (tutorialGuitar) tutorialGuitar.href = song.tutorialGuitar;
    if (tutorialPiano) tutorialPiano.href = song.tutorialPiano;

  } else {
    songTitle.innerText = "Canto no encontrado";
    songInfo.innerText = "Este canto todavía no existe o fue eliminado.";
  }
}


/* =========================
   BUSCADOR EN PÁGINA PRINCIPAL
========================= */

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
   BUSCADOR DE CANCIONES
========================= */

const songSearch = document.getElementById("songSearch");

if (songSearch) {
  songSearch.addEventListener("keyup", () => {
    const value = songSearch.value.toLowerCase().trim();
    const cards = document.querySelectorAll("#songList .song-card");
    const noResults = document.getElementById("noResults");

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

  const initialQuery = new URLSearchParams(window.location.search).get("buscar");

  if (initialQuery) {
    songSearch.value = initialQuery.toLowerCase();
    songSearch.dispatchEvent(new Event("keyup"));
  }
}


/* =========================
   FILTROS DE CANCIONES
========================= */

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
   BUSCADOR DE ARTISTAS
========================= */

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
   PERFIL INDIVIDUAL DE ARTISTA
========================= */

const artistName = document.getElementById("artistName");
const artistDescription = document.getElementById("artistDescription");
const artistTags = document.getElementById("artistTags");
const artistAvatar = document.getElementById("artistAvatar");
const artistSongsList = document.getElementById("artistSongsList");
const noArtistSongs = document.getElementById("noArtistSongs");

if (artistName && artistSongsList) {
  const artistId = new URLSearchParams(window.location.search).get("id");
  const artist = artists[artistId];

  if (artist) {
    artistName.innerText = artist.name;
    artistDescription.innerText = artist.description;
    artistTags.innerText = artist.tags;
    artistAvatar.innerText = artist.avatar;

    artistSongsList.innerHTML = "";

    artist.songs.forEach(songId => {
      const song = songs[songId];

      if (song) {
        artistSongsList.innerHTML += `
          <article class="song-card">
            <h3>🎵 ${song.title}</h3>
            <p>👤 ${song.artist}</p>
            <p>✝ ${song.category}</p>
            <p>🎸 Tono: ${song.tone}</p>
            <p>⭐ ${song.difficulty}</p>
            <a class="song-btn" href="canto.html?id=${songId}">Ver canto</a>
          </article>
        `;
      }
    });

    if (artist.songs.length === 0 && noArtistSongs) {
      noArtistSongs.style.display = "block";
    }

  } else {
    artistName.innerText = "Artista no encontrado";
    artistDescription.innerText = "Este artista todavía no existe o fue eliminado.";
    artistTags.innerText = "";
    artistAvatar.innerText = "?";

    if (noArtistSongs) {
      noArtistSongs.style.display = "block";
    }
  }
}
/* =========================
   BUSCADOR DE CATEGORIAS
========================= */

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
   ARTISTAS DESDE SUPABASE
========================= */

async function loadPublicArtists(){
  const artistList = document.getElementById("artistList");

  if(!artistList){
    return;
  }

  if(typeof supabaseClient === "undefined"){
    artistList.innerHTML = "<p>No se pudo conectar con Supabase.</p>";
    return;
  }

  const { data: artistsData, error } = await supabaseClient
    .from("artists")
    .select("*")
    .order("name");

  if(error){
    artistList.innerHTML = "<p>Error cargando artistas.</p>";
    return;
  }

  artistList.innerHTML = "";

  if(!artistsData || artistsData.length === 0){
    artistList.innerHTML = `
      <div class="song-card">
        <h3>No hay artistas todavía</h3>
        <p style="color:var(--secondary); margin-top:15px;">
          Agrega artistas desde el panel de administración.
        </p>
      </div>
    `;
    return;
  }

  artistsData.forEach(artist => {
    const avatarContent = artist.avatar_url
      ? `<img src="${artist.avatar_url}" alt="${artist.name}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`
      : artist.name.charAt(0).toUpperCase();

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

loadPublicArtists();
