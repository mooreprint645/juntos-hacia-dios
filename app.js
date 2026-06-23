const songs = {
  maria: {
    title: "Quiero caminar contigo María",
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

let originalLyrics = "";
let transposeAmount = 0;
let chordLanguage = localStorage.getItem("chordLanguage") || "english";

const notes = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];

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

function transposeChord(chord, steps){
  const match = chord.match(/^([A-G])(#|b)?(.*)$/);
  if(!match) return chord;

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

  let index = notes.indexOf(root);
  if(index === -1) return chord;

  let newIndex = (index + steps + notes.length) % notes.length;
  return notes[newIndex] + suffix;
}

function formatChord(chord){
  const match = chord.match(/^([A-G])(#|b)?(.*)$/);
  if(!match) return chord;

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

  if(chordLanguage === "spanish"){
    return (englishToSpanish[root] || root) + suffix;
  }

  return root + suffix;
}

function transposeText(text, steps){
  return text.replace(/\b([A-G](#|b)?(m|maj7|m7|7|sus4|sus2|dim|aug|add9)?)(?=\s|$)/g, function(chord){
    const transposedChord = transposeChord(chord, steps);
    return formatChord(transposedChord);
  });
}

function showLyrics(){
  const lyricsBox = document.getElementById("songLyrics");

  if(lyricsBox){
    lyricsBox.innerText = transposeText(originalLyrics, transposeAmount);
  }

  const label = document.getElementById("chordLanguageLabel");

  if(label){
    if(chordLanguage === "spanish"){
      label.innerText = "Cifrado actual: Español";
    }else{
      label.innerText = "Cifrado actual: Inglés";
    }
  }
}

function transposeSong(steps){
  transposeAmount += steps;
  showLyrics();
}

function resetTranspose(){
  transposeAmount = 0;
  showLyrics();
}

function setChordLanguage(language){
  chordLanguage = language;
  localStorage.setItem("chordLanguage", language);
  showLyrics();
}

// MODO CLARO / OSCURO

const themeToggle = document.getElementById("themeToggle");

if(themeToggle){
  themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("light-mode");

    if(document.body.classList.contains("light-mode")){
      themeToggle.textContent = "☀️";
      localStorage.setItem("theme", "light");
    }else{
      themeToggle.textContent = "🌙";
      localStorage.setItem("theme", "dark");
    }
  });

  if(localStorage.getItem("theme") === "light"){
    document.body.classList.add("light-mode");
    themeToggle.textContent = "☀️";
  }
}

// CARGAR CANTO INDIVIDUAL

const params = new URLSearchParams(window.location.search);
const id = params.get("id");

if(id && songs[id]){
  const song = songs[id];

  const songTitle = document.getElementById("songTitle");
  const songInfo = document.getElementById("songInfo");
  const tutorialGuitar = document.getElementById("tutorialGuitar");
  const tutorialPiano = document.getElementById("tutorialPiano");

  if(songTitle) songTitle.innerText = song.title;
  if(songInfo) songInfo.innerText = song.info;

  originalLyrics = song.lyrics;
  showLyrics();

  if(tutorialGuitar) tutorialGuitar.href = song.tutorialGuitar;
  if(tutorialPiano) tutorialPiano.href = song.tutorialPiano;
}

// BUSCADOR

const search = document.getElementById("songSearch");

if(search){
  search.addEventListener("keyup", () => {
    const value = search.value.toLowerCase();

    document.querySelectorAll(".song-card").forEach(card => {
      const title = card.dataset.title;

      if(!title) return;

      card.style.display = title.includes(value) ? "block" : "none";
    });
  });
}

// FILTROS

function filterSongs(category){
  document.querySelectorAll(".song-card").forEach(card => {
    const data = card.dataset.category;

    if(!data) return;

    if(category === "todos"){
      card.style.display = "block";
    }else{
      card.style.display = data.includes(category) ? "block" : "none";
    }
  });
}
// BUSCADOR DESDE INICIO

function goToSearch(){
  const input = document.getElementById("homeSearch");

  if(!input){
    window.location.href = "canciones.html";
    return;
  }

  const query = input.value.trim();

  if(query === ""){
    window.location.href = "canciones.html";
  }else{
    window.location.href = "canciones.html?buscar=" + encodeURIComponent(query);
  }
}

const homeSearch = document.getElementById("homeSearch");

if(homeSearch){
  homeSearch.addEventListener("keydown", function(event){
    if(event.key === "Enter"){
      goToSearch();
    }
  });
}

// RECIBIR BUSQUEDA EN canciones.html

const initialQuery = new URLSearchParams(window.location.search).get("buscar");

if(search && initialQuery){
  search.value = initialQuery.toLowerCase();
  search.dispatchEvent(new Event("keyup"));
}
// BUSCADOR EN PÁGINA PRINCIPAL

function searchHomeSongs(){
  const input = document.getElementById("homeSearch");
  const cards = document.querySelectorAll("#homeSongList .song-card");
  const noResults = document.getElementById("noHomeResults");

  if(!input || cards.length === 0){
    return;
  }

  const value = input.value.toLowerCase().trim();
  let found = 0;

  cards.forEach(card => {
    const title = card.dataset.title || "";

    if(title.includes(value)){
      card.style.display = "block";
      found++;
    }else{
      card.style.display = "none";
    }
  });

  if(noResults){
    noResults.style.display = found === 0 ? "block" : "none";
  }
}

const mainSearchInput = document.getElementById("homeSearch");

if(mainSearchInput){
  mainSearchInput.addEventListener("keyup", function(event){
    searchHomeSongs();

    if(event.key === "Enter"){
      searchHomeSongs();
    }
  });
}
// BUSCADOR DE ARTISTAS

const artistSearch = document.getElementById("artistSearch");

if(artistSearch){
  artistSearch.addEventListener("keyup", () => {
    const value = artistSearch.value.toLowerCase().trim();
    const cards = document.querySelectorAll("#artistList .song-card");
    const noResults = document.getElementById("noArtistResults");

    let found = 0;

    cards.forEach(card => {
      const title = card.dataset.title || "";

      if(title.includes(value)){
        card.style.display = "block";
        found++;
      }else{
        card.style.display = "none";
      }
    });

    if(noResults){
      noResults.style.display = found === 0 ? "block" : "none";
    }
  });
}
// BUSCADOR DE ARTISTAS

const artistSearch = document.getElementById("artistSearch");

if(artistSearch){
  artistSearch.addEventListener("keyup", () => {
    const value = artistSearch.value.toLowerCase().trim();
    const cards = document.querySelectorAll("#artistList .song-card");
    const noResults = document.getElementById("noArtistResults");

    let found = 0;

    cards.forEach(card => {
      const title = card.dataset.title || "";

      if(title.includes(value)){
        card.style.display = "block";
        found++;
      }else{
        card.style.display = "none";
      }
    });

    if(noResults){
      noResults.style.display = found === 0 ? "block" : "none";
    }
  });
}


// PERFIL INDIVIDUAL DE ARTISTA

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
    description: "Cantos cristianos de adoración y oración.",
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

const artistName = document.getElementById("artistName");
const artistDescription = document.getElementById("artistDescription");
const artistTags = document.getElementById("artistTags");
const artistAvatar = document.getElementById("artistAvatar");
const artistSongsList = document.getElementById("artistSongsList");
const noArtistSongs = document.getElementById("noArtistSongs");

if(artistName && artistSongsList){
  const artistId = new URLSearchParams(window.location.search).get("id");
  const artist = artists[artistId];

  if(artist){
    artistName.innerText = artist.name;
    artistDescription.innerText = artist.description;
    artistTags.innerText = artist.tags;
    artistAvatar.innerText = artist.avatar;

    artistSongsList.innerHTML = "";

    artist.songs.forEach(songId => {
      const song = songs[songId];

      if(song){
        artistSongsList.innerHTML += `
          <article class="song-card">
            <h3>🎵 ${song.title}</h3>
            <p>${song.info}</p>
            <a class="song-btn" href="canto.html?id=${songId}">Ver canto</a>
          </article>
        `;
      }
    });

    if(artist.songs.length === 0 && noArtistSongs){
      noArtistSongs.style.display = "block";
    }

  }else{
    artistName.innerText = "Artista no encontrado";
    artistDescription.innerText = "Este artista todavía no existe o fue eliminado.";
    artistTags.innerText = "";
    artistAvatar.innerText = "?";

    if(noArtistSongs){
      noArtistSongs.style.display = "block";
    }
  }
}
