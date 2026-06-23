const songs = {

maria:{

title:"Quiero caminar contigo María",

info:"Athenas · Católica · Tono G",

lyrics:`

      G
Quiero caminar contigo María

      Em
Por el sendero de la fe

      C
Quiero sentir tu compañía

      D
Y caminar hacia Dios

`,

tutorialGuitar:"#",

tutorialPiano:"#",

tutorialKaraoke:"#"

},

espiritu:{

title:"Ven Espíritu Santo",

info:"Adoración · Cristiana · Tono D",

lyrics:`

      D
Ven Espíritu Santo

      Bm
Llena mi vida

      G
Quiero adorarte

      A
Con todo mi ser

`,

tutorialGuitar:"#",

tutorialPiano:"#",

tutorialKaraoke:"#"

},

digno:{

title:"Digno y Santo",

info:"Alabanza · Cristiana · Tono A",

lyrics:`

      A
Digno y Santo

      E
El Cordero inmolado

      F#m
Te exaltamos Señor

      D
Rey de gloria

`,

tutorialGuitar:"#",

tutorialPiano:"#",

tutorialKaraoke:"#"

}

};


// MODO NOCHE

const themeToggle=document.getElementById("themeToggle");

if(themeToggle){

themeToggle.addEventListener("click",()=>{

document.body.classList.toggle("light-mode");

if(document.body.classList.contains("light-mode")){

themeToggle.textContent="☀️";

localStorage.setItem("theme","light");

}else{

themeToggle.textContent="🌙";

localStorage.setItem("theme","dark");

}

});

if(localStorage.getItem("theme")==="light"){

document.body.classList.add("light-mode");

themeToggle.textContent="☀️";

}

}


// CARGAR CANTO

const params=new URLSearchParams(window.location.search);

const id=params.get("id");

if(id && songs[id]){

document.getElementById("songTitle").innerText=songs[id].title;

document.getElementById("songInfo").innerText=songs[id].info;

document.getElementById("songLyrics").innerText=songs[id].lyrics;

document.getElementById("tutorialGuitar").href=songs[id].tutorialGuitar;

document.getElementById("tutorialPiano").href=songs[id].tutorialPiano;

document.getElementById("tutorialKaraoke").href=songs[id].tutorialKaraoke;

}


// BUSCADOR

const search=document.getElementById("songSearch");

if(search){

search.addEventListener("keyup",()=>{

const value=search.value.toLowerCase();

document.querySelectorAll(".song-card").forEach(card=>{

const title=card.dataset.title;

if(!title){

return;

}

card.style.display=title.includes(value)?"block":"none";

});

});

}


// FILTROS

function filterSongs(category){

document.querySelectorAll(".song-card").forEach(card=>{

const data=card.dataset.category;

if(!data){

return;

}

if(category==="todos"){

card.style.display="block";

}else{

card.style.display=data.includes(category)?"block":"none";

}

});

}
