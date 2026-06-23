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
