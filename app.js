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

const notes = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];

const chordDiagrams = {
  C: "e|--0--\nB|--1--\nG|--0--\nD|--2--\nA|--3--\nE|--x--",
  D: "e|--2--\nB|--3--\nG|--2--\nD|--0--\nA|--x--\nE|--x--",
  E: "e|--0--\nB|--0--\nG|--1--\nD|--2--\nA|--2--\nE|--0--",
  F: "e|--1--\nB|--1--\nG|--2--\nD|--3--\nA|--3--\nE|--1--",
  G: "e|--3--\nB|--3--\nG|--0--\nD|--0--\nA|--2--\nE|--3--",
  A: "e|--0--\nB|--2--\nG|--2--\nD|--2--\nA|--0--\nE|--x--",
  B: "e|--2--\nB|--4--\nG|--4--\nD|--4--\nA|--2--\nE|--x--",

  Em: "e|--0--\nB|--0--\nG|--0--\nD|--2--\nA|--2--\nE|--0--",
  Am: "e|--0--\nB|--1--\nG|--2--\nD|--2--\nA|--0--\nE|--x--",
  Dm: "e|--1--\nB|--3--\nG|--2--\nD|--0--\nA|--x--\nE|--x--",
  Bm: "e|--2--\nB|--3--\nG|--4--\nD|--4--\nA|--2--\nE|--x--",
  "F#m": "e|--2--\nB|--2--\nG|--2--\nD|--4--\nA|--4--\nE|--2--"
};

function transposeChord(chord, steps){
  const match = chord.match(/^([A-G])(#|b)?(.*)$/);
  if(!match) return chord;

  let root = match[1] + (match[2] || "");
  const suffix = match[3] || "";

  const flats = {
    Db:"C#",
    Eb:"D#",
    Gb:"F#",
    Ab:"G#",
    Bb:"A#"
  };

  root = flats[root] || root;

  let index = notes.indexOf(root);
  if(index === -1) return chord;

  let newIndex = (index + steps + notes.length) % notes.length;
  return notes[newIndex] + suffix;
}

function transposeText(text, steps){
  return text.replace(/\b([A-G](#|b)?(m|maj7|m7|7|sus4|sus2|dim|aug|add9)?)(?=\s|$)/g, function(chord){
    return transposeChord(chord, steps);
  });
}

function makeChordsClickable(text){
  return text.replace(/\b([A-G](#|b)?(m|maj7|m7|7|sus4|sus2|dim|aug|add9)?)(?=\s|$)/g, function(chord){
    return `<span class="chord" onclick="showChord('${chord}')">${chord}</span>`;
  });
}

function showLyrics(){
  const lyricsBox = document.getElementById("songLyrics");

  if(lyricsBox){
    const transposed = transposeText(originalLyrics, transposeAmount);
    lyricsBox.innerHTML = makeChordsClickable(transposed);
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

function showChord(chord){
  const chordBox = document.getElementById("chordBox");

  if(!chordBox){
    return;
  }

  if(chordDiagrams[chord]){
    chordBox.innerHTML = `
      <h3>${chord}</h3>
      <pre>${chordDiagrams[chord]}</pre>
    `;
  }else{
    chordBox.innerHTML = `
      <h3>${chord}</h3>
      <p>Diagrama pendiente por agregar.</p>
    `;
  }
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
