/* ============================================================================
   DAMIÁN · CRÓNICAS DEL RAYO
   RPG por turnos en pixel art - motor completo en JS puro (sin dependencias)
   ============================================================================ */

/* ============================================================================
   SECCIÓN 0 — CONFIGURACIÓN DE MÚSICA
   Para precargar tus propias canciones por código, escribí la ruta del archivo
   (relativa a este index.html) en cada slot. Si lo dejás en null, el jugador
   puede subir un MP3 desde el menú MÚSICA y el juego lo recuerda mientras la
   pestaña esté abierta.
   ============================================================================ */
const CONFIG = {
  musicLibrary: {
    title:    null,   // ej: "musica/titulo.mp3"
    worldmap: null,   // ej: "musica/mapa.mp3"
    battle:   null,   // ej: "musica/combate.mp3"
    boss:     null,   // ej: "musica/jefe.mp3"
    victory:  null,   // ej: "musica/victoria.mp3"
    infinite: null,   // ej: "musica/infinito.mp3"
  },
  defaultVolume: 0.6,
};

/* ============================================================================
   SECCIÓN 1 — PALETA DE COLORES PIXEL ART
   ============================================================================ */
const PAL = {
  skin:      '#e8b48a',
  skinDark:  '#c08860',
  skinLine:  '#7a4f30',
  blueBody:  '#3b6fe0',
  blueBodyDark:'#1f3d8c',
  blueHair:  '#2f5fd0',
  blueHairDark:'#16348c',
  greenHair: '#3fd17a',
  greenHairDark:'#1f7a45',
  redHair:   '#e0473b',
  redHairDark:'#8c1f1f',
  pinkBody:  '#ef7fb0',
  pinkBodyDark:'#a83d72',
  blackHair: '#241f33',
  blackHairDark:'#100d18',
  white:     '#f4f4f8',
  black:     '#0a0a0e',
  outline:   '#0a0a0e',
  eyeWhite:  '#f4f4f8',
  pupil:     '#15151f',
  boltYellow:'#fbe54a',
  boltWhite: '#ffffff',
};

/* ============================================================================
   SECCIÓN 2 — DEFINICIÓN DE SPRITES (pixel grids)
   Cada sprite es una matriz 16x16 (o 16x20) de códigos de color. '.' = transparente.
   Se renderiza a un canvas y se escala con nearest-neighbor para look retro.
   ============================================================================ */

// Plantilla base humanoide: usada para Damián y sus fases, Tomi y Domi
// Filas: 0 arriba (pelo) -> 19 abajo (pies)
function buildHumanoidSprite({hair, hairDark, body, bodyDark, hasLongHair=false, female=false}){
  const S=PAL.skin, SD=PAL.skinDark, SL=PAL.skinLine, O=PAL.outline, EW=PAL.eyeWhite, P=PAL.pupil, BD=bodyDark, B=body, H=hair, HD=hairDark;
  // grid 16 ancho x 20 alto
  const g = [];
  for(let i=0;i<20;i++) g.push(new Array(16).fill('.'));

  const set=(x,y,c)=>{ if(y>=0&&y<20&&x>=0&&x<16) g[y][x]=c; };
  const rect=(x0,y0,x1,y1,c)=>{ for(let y=y0;y<=y1;y++) for(let x=x0;x<=x1;x++) set(x,y,c); };

  // ---- pelo corto base (todas las fases tienen este corte salvo verde/rosa largos) ----
  rect(5,0,10,1,O);
  rect(4,1,11,2,H);
  rect(4,2,11,2,HD);
  rect(4,3,5,3,H); rect(10,3,11,3,H);

  if(hasLongHair){
    // mechones largos a los costados y atrás (verde y rosa)
    rect(2,3,4,10,H);
    rect(2,3,3,10,HD);
    rect(11,3,13,10,H);
    rect(12,3,13,10,HD);
    rect(3,10,5,13,H);
    rect(10,10,12,13,H);
  }

  // ---- cara ----
  rect(4,3,11,8,S);
  rect(4,3,4,8,SD); rect(11,3,11,8,SD);
  set(3,3,O); set(12,3,O);
  rect(3,4,3,8,O); rect(12,4,12,8,O);
  // ojos
  set(6,6,EW); set(6,7,P);
  set(9,6,EW); set(9,7,P);
  // boca pequeña
  rect(7,8,8,8,SL);

  // ---- cuello ----
  rect(6,9,9,9,S);

  // ---- torso / cuerpo ----
  rect(3,10,12,15,B);
  rect(3,10,3,15,BD); rect(12,10,12,15,BD);
  rect(3,9,12,9,O);
  rect(2,10,2,15,O); rect(13,10,13,15,O);
  // pecho con detalle (rayo simbólico)
  set(7,11,PAL.boltYellow); set(8,12,PAL.boltYellow); set(7,13,PAL.boltYellow);

  if(female){
    // silueta levemente más curva + falda corta
    rect(4,14,11,16,B);
    rect(4,14,4,16,BD); rect(11,14,11,16,BD);
  }

  // ---- brazos ----
  rect(1,10,2,14,B); rect(13,10,14,14,B);
  rect(1,10,1,14,BD); rect(14,10,14,14,BD);
  rect(1,15,2,16,S); rect(13,15,14,16,S); // manos

  // ---- piernas ----
  rect(4,16,7,19,BD);
  rect(8,16,11,19,B);
  rect(4,16,4,19,O); rect(11,16,11,19,O);
  // pies
  rect(3,19,7,19,O); rect(8,19,12,19,O);

  rect(0,9,15,9,'.'); // limpiar fila hombros extra si se pasó
  return g;
}

const SPRITES = {
  damian_blue:  buildHumanoidSprite({hair:PAL.blueHair, hairDark:PAL.blueHairDark, body:PAL.blueBody, bodyDark:PAL.blueBodyDark, hasLongHair:false}),
  damian_green: buildHumanoidSprite({hair:PAL.greenHair, hairDark:PAL.greenHairDark, body:PAL.blueBody, bodyDark:PAL.blueBodyDark, hasLongHair:true}),
  damian_red:   buildHumanoidSprite({hair:PAL.redHair, hairDark:PAL.redHairDark, body:PAL.blueBody, bodyDark:PAL.blueBodyDark, hasLongHair:false}),
  tomi:         buildHumanoidSprite({hair:PAL.greenHair, hairDark:PAL.greenHairDark, body:PAL.greenHair, bodyDark:PAL.greenHairDark, hasLongHair:false}),
  domi:         buildHumanoidSprite({hair:PAL.blackHair, hairDark:PAL.blackHairDark, body:PAL.pinkBody, bodyDark:PAL.pinkBodyDark, hasLongHair:true, female:true}),
};

// ---- Sprites de enemigos: formas geométricas variadas por mundo, generadas proceduralmente ----
function buildEnemySprite(seedShape, mainColor, darkColor, accent){
  const g=[]; for(let i=0;i<16;i++) g.push(new Array(16).fill('.'));
  const set=(x,y,c)=>{ if(y>=0&&y<16&&x>=0&&x<16) g[y][x]=c; };
  const rect=(x0,y0,x1,y1,c)=>{ for(let y=y0;y<=y1;y++) for(let x=x0;x<=x1;x++) set(x,y,c); };
  const M=mainColor, D=darkColor, A=accent, O=PAL.outline;

  switch(seedShape){
    case 'slime':
      rect(3,8,12,14,M); rect(3,8,3,14,D); rect(12,8,12,14,D);
      rect(2,14,13,14,O); rect(2,8,13,8,O);
      set(6,10,A); set(9,10,A); rect(2,9,2,13,O); rect(13,9,13,13,O);
      break;
    case 'bat':
      rect(1,6,4,9,M); rect(11,6,14,9,M);
      rect(5,5,10,11,M); rect(5,5,5,11,D); rect(10,5,10,11,D);
      set(6,8,A); set(9,8,A);
      rect(5,12,6,13,M); rect(9,12,10,13,M);
      rect(0,5,15,12,'.');
      rect(1,6,4,9,M); rect(11,6,14,9,M); rect(5,5,10,11,M);
      set(6,8,PAL.white); set(9,8,PAL.white); set(6,9,A); set(9,9,A);
      break;
    case 'golem':
      rect(2,4,13,5,D); rect(2,6,13,13,M);
      rect(2,6,3,13,D); rect(12,6,13,13,D);
      rect(0,7,1,10,M); rect(14,7,15,10,M);
      set(5,8,A); set(10,8,A);
      rect(4,13,6,15,D); rect(9,13,11,15,D);
      break;
    case 'wisp':
      rect(5,3,10,4,M); rect(3,5,12,10,M);
      rect(3,5,3,10,D); rect(12,5,12,10,D);
      set(6,7,A); set(9,7,A);
      rect(5,11,10,13,D);
      rect(7,13,8,15,A);
      break;
    case 'knight':
      rect(4,2,11,5,D); rect(5,3,10,4,M);
      rect(3,6,12,12,M); rect(3,6,3,12,D); rect(12,6,12,12,D);
      set(6,4,A); set(9,4,A);
      rect(1,7,2,11,D); rect(13,7,14,11,D);
      rect(4,13,7,15,D); rect(8,13,11,15,D);
      break;
    case 'serpent':
      rect(2,2,13,4,M); rect(1,2,1,4,D); rect(14,2,14,4,D);
      rect(4,5,11,7,M); rect(6,8,9,15,M);
      rect(6,8,6,15,D); rect(9,8,9,15,D);
      set(5,3,A); set(10,3,A);
      break;
    case 'phantom':
      rect(4,2,11,9,M); rect(4,2,4,9,D); rect(11,2,11,9,D);
      set(6,5,A); set(9,5,A);
      rect(3,10,5,15,M); rect(7,10,9,15,M); rect(11,10,13,15,M);
      break;
    case 'beast':
      rect(2,5,13,11,M); rect(2,5,2,11,D); rect(13,5,13,11,D);
      rect(1,3,4,5,M); rect(11,3,14,5,M);
      set(5,7,A); set(10,7,A);
      rect(2,12,5,15,D); rect(10,12,13,15,D);
      rect(0,8,1,9,M); rect(14,8,15,9,M);
      break;
    case 'mech':
      rect(3,3,12,12,D); rect(4,4,11,11,M);
      set(6,6,A); set(9,6,A);
      rect(1,6,2,9,M); rect(13,6,14,9,M);
      rect(5,13,7,15,D); rect(8,13,10,15,D);
      rect(7,1,8,3,A);
      break;
    case 'dragonkin':
      rect(3,4,12,10,M); rect(3,4,3,10,D); rect(12,4,12,10,D);
      rect(1,2,4,5,M); rect(11,2,14,5,M);
      set(6,6,A); set(9,6,A);
      rect(4,11,7,15,D); rect(8,11,11,15,D);
      rect(0,9,2,11,M); rect(13,9,15,11,M);
      break;
    case 'voidlord': // jefe final
      rect(2,1,13,2,D); rect(3,3,12,11,M);
      rect(3,3,3,11,D); rect(12,3,12,11,D);
      set(6,5,A); set(9,5,A); set(7,6,A); set(8,6,A);
      rect(0,4,1,9,M); rect(14,4,15,9,M);
      rect(3,12,7,15,D); rect(8,12,12,15,D);
      rect(5,0,10,1,D);
      break;
    default:
      rect(3,3,12,12,M); rect(3,3,3,12,D); rect(12,3,12,12,D);
      set(6,6,A); set(9,6,A);
  }
  return g;
}

/* ============================================================================
   SECCIÓN 3 — RENDERIZADO DE SPRITES EN CANVAS
   ============================================================================ */
function drawSprite(ctx, grid, scale=4, flip=false){
  const w = grid[0].length, h = grid.length;
  ctx.canvas.width = w*scale;
  ctx.canvas.height = h*scale;
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0,0,ctx.canvas.width, ctx.canvas.height);
  for(let y=0;y<h;y++){
    for(let x=0;x<w;x++){
      const c = grid[y][x];
      if(c==='.') continue;
      ctx.fillStyle = c;
      const drawX = flip ? (w-1-x) : x;
      ctx.fillRect(drawX*scale, y*scale, scale, scale);
    }
  }
}

function spriteToDataURL(grid, scale=4){
  const c = document.createElement('canvas');
  const ctx = c.getContext('2d');
  drawSprite(ctx, grid, scale);
  return c.toDataURL();
}

/* ============================================================================
   SECCIÓN 4 — FASES DE DAMIÁN
   ============================================================================ */
const PHASES = {
  blue: {
    id:'blue', name:'Fase Azul', color:'#3b6fe0', sprite:'damian_blue',
    desc:'Forma equilibrada. Sin penalizaciones, ideal para empezar.',
    mods:{atk:1.0, def:1.0, spd:1.0, maxHpMult:1.0, maxMpMult:1.0, fatiguePerTurn:0},
    pros:['Sin fatiga','Buen equilibrio general'],
    cons:['No destaca en ningún atributo'],
  },
  green: {
    id:'green', name:'Fase Verde', color:'#3fd17a', sprite:'damian_green',
    desc:'Pelo largo y veloz. Prioriza velocidad y evasión, resigna defensa.',
    mods:{atk:1.05, def:0.75, spd:1.45, maxHpMult:1.0, maxMpMult:1.15, fatiguePerTurn:0},
    pros:['Mucha velocidad (actúa primero)','Más maná máximo','Mejor evasión'],
    cons:['Defensa reducida'],
  },
  red: {
    id:'red', name:'Fase Roja', color:'#e0473b', sprite:'damian_red',
    desc:'Forma más poderosa. Furia descontrolada: pega muy fuerte pero se agota rápido.',
    mods:{atk:1.6, def:1.1, spd:0.85, maxHpMult:1.1, maxMpMult:0.7, fatiguePerTurn:8},
    pros:['Ataque devastador','Defensa también sube'],
    cons:['Se fatiga cada turno (pierde HP)','Maná máximo reducido','Más lento'],
  },
};
const PHASE_ORDER = ['blue','green','red'];

/* ============================================================================
   SECCIÓN 5 — HABILIDADES (rayos + análisis + las de Tomi/Domi)
   power: multiplicador de daño sobre ATK. cost: maná. type: 'damage'|'heal'|'buff'|'debuff'|'analyze'|'special'
   ============================================================================ */
const SKILLS_DB = {
  // ---- Damián: rayos ----
  rayo_basico:   {id:'rayo_basico', name:'Rayo Básico', cost:4, power:1.3, type:'damage', elem:'rayo', unlockLevel:1, desc:'Una descarga eléctrica simple.'},
  rayo_cadena:   {id:'rayo_cadena', name:'Rayo en Cadena', cost:9, power:1.7, type:'damage', elem:'rayo', unlockLevel:4, desc:'El rayo rebota y golpea dos veces.', hits:2},
  electroimpacto:{id:'electroimpacto', name:'Electroimpacto', cost:14, power:2.3, type:'damage', elem:'rayo', unlockLevel:8, desc:'Golpe eléctrico concentrado de alto daño.'},
  tormenta_voltaica:{id:'tormenta_voltaica', name:'Tormenta Voltaica', cost:22, power:3.0, type:'damage', elem:'rayo', unlockLevel:11, desc:'Una tormenta de rayos arrasa al enemigo.'},
  sobrecarga:    {id:'sobrecarga', name:'Sobrecarga', cost:12, power:0, type:'buff', elem:'rayo', unlockLevel:6, desc:'Aumenta tu ataque por 3 turnos.', buff:{stat:'atk', mult:1.4, turns:3}},
  paralisis:     {id:'paralisis', name:'Pulso Paralizante', cost:10, power:0.4, type:'debuff', elem:'rayo', unlockLevel:10, desc:'Daño leve y reduce la velocidad enemiga.', debuff:{stat:'spd', mult:0.6, turns:2}},
  analizar:      {id:'analizar', name:'Analizar', cost:3, power:0, type:'analyze', elem:'mente', unlockLevel:1, desc:'Revela debilidades, HP exacto y patrón del enemigo.'},

  // ---- Tomi: flechas + telequinesis ----
  flecha_simple:  {id:'flecha_simple', name:'Flecha Certera', cost:3, power:1.2, type:'damage', elem:'fisico', unlockLevel:1, desc:'Disparo preciso de flecha.'},
  lluvia_flechas: {id:'lluvia_flechas', name:'Lluvia de Flechas', cost:10, power:0.9, type:'damage', elem:'fisico', unlockLevel:5, desc:'Varias flechas caen sobre el objetivo.', hits:3},
  telequinesis:   {id:'telequinesis', name:'Telequinesis', cost:8, power:1.4, type:'damage', elem:'mente', unlockLevel:1, desc:'Lanza objetos con la mente contra el rival.'},
  empuje_mental:  {id:'empuje_mental', name:'Empuje Mental', cost:11, power:0, type:'debuff', elem:'mente', unlockLevel:7, desc:'Reduce el ataque enemigo manipulándolo psíquicamente.', debuff:{stat:'atk', mult:0.65, turns:2}},
  rey_galaxia:    {id:'rey_galaxia', name:'Rey de la Galaxia', cost:30, power:0, type:'special', elem:'cosmico', unlockLevel:12, desc:'Transformación: +daño y ataques cósmicos por 3 turnos.', transformTurns:3},

  // ---- Domi: soporte ----
  curacion:       {id:'curacion', name:'Aura Curativa', cost:10, power:0, type:'heal', elem:'soporte', unlockLevel:1, desc:'Restaura HP a un aliado.', healMult:1.8},
  escudo_rosa:    {id:'escudo_rosa', name:'Escudo Rosa', cost:9, power:0, type:'buff', elem:'soporte', unlockLevel:1, desc:'Aumenta la defensa de un aliado por 3 turnos.', buff:{stat:'def', mult:1.5, turns:3}},
  pulso_vital:    {id:'pulso_vital', name:'Pulso Vital', cost:16, power:0, type:'heal', elem:'soporte', unlockLevel:6, desc:'Cura a todo el equipo.', healMult:1.3, group:true},
  purificar:      {id:'purificar', name:'Purificar', cost:7, power:0, type:'cleanse', elem:'soporte', unlockLevel:9, desc:'Elimina debuffs de un aliado.'},
  golpe_psiquico: {id:'golpe_psiquico', name:'Golpe Psíquico', cost:13, power:1.6, type:'damage', elem:'mente', unlockLevel:11, desc:'Ataque ofensivo de emergencia.'},
};

/* ============================================================================
   SECCIÓN 6 — ITEMS
   ============================================================================ */
const ITEMS_DB = {
  poción_menor:  {id:'poción_menor', name:'Poción Menor', desc:'Restaura 30 HP.', type:'heal', value:30, buyPrice:15},
  poción_mayor:  {id:'poción_mayor', name:'Poción Mayor', desc:'Restaura 80 HP.', type:'heal', value:80, buyPrice:40},
  cristal_maná:  {id:'cristal_maná', name:'Cristal de Maná', desc:'Restaura 25 MP.', type:'mana', value:25, buyPrice:20},
  antidoto:      {id:'antidoto', name:'Antídoto Eléctrico', desc:'Elimina debuffs propios.', type:'cleanse', buyPrice:18},
  nucleo_furia:  {id:'nucleo_furia', name:'Núcleo de Furia', desc:'Sube el ataque un 25% por 3 turnos.', type:'buff', stat:'atk', mult:1.25, turns:3, buyPrice:35},
  fragmento_estelar:{id:'fragmento_estelar', name:'Fragmento Estelar', desc:'Material de mejora. Se usa para desbloquear habilidades especiales.', type:'material', buyPrice:0},
};

/* ============================================================================
   SECCIÓN 7 — ENEMIGOS POR MUNDO (5 normales + 1 jefe por mundo)
   stats escalan con nivel de mundo. weakness/resist afectan multiplicador de daño.
   ============================================================================ */
function makeEnemy(opts){
  return Object.assign({
    weakness:null, resist:null, isBoss:false,
    skills:['golpe'], dropItems:[], dropXp:0, dropGold:0,
  }, opts);
}

const WORLDS = [
  {
    id:1, name:'Llanos de Circuito', theme:'Pradera tecnológica', levelRange:[1,5],
    bgGrad:['#1a3a2e','#0d1f17'],
    unlockPhase:'green', unlockAlly:'tomi',
    enemies:[
      makeEnemy({id:'w1_slime', name:'Limo Conductor', shape:'slime', color:'#5ad1c0', dark:'#1f8a78', accent:'#fff', hp:32, atk:6, def:2, spd:5, weakness:'rayo', dropXp:18, dropGold:8}),
      makeEnemy({id:'w1_bat', name:'Murciélago Estático', shape:'bat', color:'#7a5ad1', dark:'#3d2f8a', accent:'#fbe54a', hp:28, atk:7, def:2, spd:9, weakness:'rayo', dropXp:20, dropGold:10}),
      makeEnemy({id:'w1_golem', name:'Golem de Hojalata', shape:'golem', color:'#9a9aa0', dark:'#52525c', accent:'#e0473b', hp:48, atk:7, def:6, spd:3, resist:'rayo', dropXp:24, dropGold:14}),
      makeEnemy({id:'w1_wisp', name:'Fuego Fatuo', shape:'wisp', color:'#f5c542', dark:'#a3811f', accent:'#fff', hp:34, atk:8, def:2, spd:8, dropXp:24, dropGold:12}),
      makeEnemy({id:'w1_serpent', name:'Víbora de Cobre', shape:'serpent', color:'#c97a3d', dark:'#7a4520', accent:'#fbe54a', hp:40, atk:9, def:4, spd:7, dropXp:28, dropGold:16}),
    ],
    boss: makeEnemy({id:'w1_boss', name:'Centinela de Circuito', shape:'knight', color:'#3a8fd1', dark:'#1c4a8c', accent:'#fbe54a', hp:110, atk:11, def:7, spd:6, isBoss:true, resist:'rayo', dropXp:70, dropGold:60}),
  },
  {
    id:2, name:'Cavernas de Magma', theme:'Subsuelo volcánico', levelRange:[5,8],
    bgGrad:['#3a1a14','#1a0a08'],
    unlockPhase:'red', unlockAlly:null,
    enemies:[
      makeEnemy({id:'w2_beast', name:'Fenris de Ceniza', shape:'beast', color:'#8c3a2a', dark:'#4a1d15', accent:'#fbe54a', hp:60, atk:12, def:6, spd:8, dropXp:38, dropGold:22}),
      makeEnemy({id:'w2_phantom', name:'Espectro Ígneo', shape:'phantom', color:'#d1543f', dark:'#7a2a1f', accent:'#fff', hp:52, atk:14, def:4, spd:10, weakness:'rayo', dropXp:40, dropGold:24}),
      makeEnemy({id:'w2_golem', name:'Coloso de Lava', shape:'golem', color:'#e0673b', dark:'#8c2f1a', accent:'#fbe54a', hp:85, atk:13, def:10, spd:4, resist:'rayo', dropXp:46, dropGold:30}),
      makeEnemy({id:'w2_serpent', name:'Serpiente de Brasa', shape:'serpent', color:'#f57c3d', dark:'#a3441f', accent:'#241f33', hp:62, atk:15, def:5, spd:11, dropXp:44, dropGold:28}),
      makeEnemy({id:'w2_bat', name:'Murciélago Cinder', shape:'bat', color:'#a83d3d', dark:'#5c1f1f', accent:'#fbe54a', hp:54, atk:15, def:4, spd:13, weakness:'rayo', dropXp:42, dropGold:26}),
    ],
    boss: makeEnemy({id:'w2_boss', name:'Señor del Magma', shape:'dragonkin', color:'#e0473b', dark:'#7a1f1f', accent:'#fbe54a', hp:190, atk:18, def:11, spd:9, isBoss:true, dropXp:150, dropGold:110}),
  },
  {
    id:3, name:'Picos de Cristal', theme:'Montaña helada', levelRange:[8,12],
    bgGrad:['#14283a','#080f1a'],
    unlockPhase:null, unlockAlly:'domi',
    enemies:[
      makeEnemy({id:'w3_wisp', name:'Espíritu de Escarcha', shape:'wisp', color:'#7fd1f5', dark:'#2f6a8c', accent:'#fff', hp:85, atk:18, def:8, spd:14, weakness:'rayo', dropXp:60, dropGold:40}),
      makeEnemy({id:'w3_knight', name:'Guardián Helado', shape:'knight', color:'#5a7fd1', dark:'#2a3d7a', accent:'#fff', hp:115, atk:20, def:13, spd:8, dropXp:65, dropGold:46}),
      makeEnemy({id:'w3_beast', name:'Lobo de Cristal', shape:'beast', color:'#a8d1f5', dark:'#5c7a8c', accent:'#3a8fd1', hp:95, atk:22, def:9, spd:16, dropXp:64, dropGold:44}),
      makeEnemy({id:'w3_mech', name:'Autómata Glacial', shape:'mech', color:'#9aa8c0', dark:'#4a526a', accent:'#7fd1f5', hp:140, atk:21, def:15, spd:7, resist:'rayo', dropXp:70, dropGold:50}),
      makeEnemy({id:'w3_phantom', name:'Alma Congelada', shape:'phantom', color:'#c0e0f5', dark:'#6a8ca3', accent:'#241f33', hp:100, atk:23, def:10, spd:13, dropXp:68, dropGold:48}),
    ],
    boss: makeEnemy({id:'w3_boss', name:'Monarca de Hielo Eterno', shape:'dragonkin', color:'#5a9fd1', dark:'#1f3d6a', accent:'#fff', hp:280, atk:27, def:17, spd:11, isBoss:true, dropXp:260, dropGold:170}),
  },
  {
    id:4, name:'Abismo del Vacío', theme:'Dimensión corrupta', levelRange:[12,16],
    bgGrad:['#1a0a2e','#0a0414'],
    unlockPhase:null, unlockAlly:null,
    enemies:[
      makeEnemy({id:'w4_phantom', name:'Heraldo del Vacío', shape:'phantom', color:'#7a3da8', dark:'#3a1a52', accent:'#fbe54a', hp:150, atk:28, def:14, spd:15, dropXp:95, dropGold:70}),
      makeEnemy({id:'w4_dragonkin', name:'Wyrm Corrupto', shape:'dragonkin', color:'#52247a', dark:'#240f3d', accent:'#e0473b', hp:190, atk:31, def:17, spd:12, dropXp:105, dropGold:80}),
      makeEnemy({id:'w4_mech', name:'Centinela Anómalo', shape:'mech', color:'#3a3a52', dark:'#1a1a2a', accent:'#7a3da8', hp:170, atk:29, def:21, spd:10, resist:'rayo', dropXp:100, dropGold:75}),
      makeEnemy({id:'w4_voidlord', name:'Eco del Abismo', shape:'voidlord', color:'#241040', dark:'#100620', accent:'#e0473b', hp:210, atk:33, def:18, spd:14, dropXp:115, dropGold:90}),
      makeEnemy({id:'w4_beast', name:'Devorador Nulo', shape:'beast', color:'#100620', dark:'#000000', accent:'#7a3da8', hp:180, atk:32, def:16, spd:17, weakness:'rayo', dropXp:110, dropGold:85}),
    ],
    boss: makeEnemy({id:'w4_boss', name:'El Vacío Primigenio', shape:'voidlord', color:'#1a0a2e', dark:'#000000', accent:'#e0473b', hp:420, atk:34, def:22, spd:13, isBoss:true, dropXp:500, dropGold:300}),
  },
];

/* ============================================================================
   SECCIÓN 8 — ALIADOS
   ============================================================================ */
const ALLIES_DB = {
  tomi: {
    id:'tomi', name:'Tomi', sprite:'tomi', color:'#3fd17a',
    desc:'Versión verde de Damián. Usa flechas y telequinesis. Se transforma en el Rey de la Galaxia.',
    baseStats:{hp:70, mp:40, atk:11, def:6, spd:9},
    skills:['flecha_simple','telequinesis','lluvia_flechas','empuje_mental','rey_galaxia'],
    transform:{
      id:'rey_galaxia', name:'Rey de la Galaxia',
      mods:{atk:2.0, spd:1.3, def:1.2},
      desc:'Por 3 turnos, Tomi gana poder cósmico: ataque x2, más velocidad y defensa.',
    },
  },
  domi: {
    id:'domi', name:'Domi', sprite:'domi', color:'#ef7fb0',
    desc:'Soporte rosa de pelo negro largo. No se transforma, pero tiene habilidades únicas de curación y protección.',
    baseStats:{hp:60, mp:55, atk:7, def:7, spd:10},
    skills:['curacion','escudo_rosa','pulso_vital','purificar','golpe_psiquico'],
    transform:null,
  },
};

/* ============================================================================
   SECCIÓN 9 — TABLA DE EXPERIENCIA / NIVEL
   ============================================================================ */
function xpForLevel(level){
  return Math.floor(8 * Math.pow(level, 1.5));
}
function maxLevel(){ return 30; }

/* ============================================================================
   SECCIÓN 10 — ESTADO GLOBAL DEL JUEGO
   ============================================================================ */
const STORAGE_KEY = 'damian_rpg_save_v1';

function freshState(){
  return {
    player:{
      name:'Damián',
      level:1,
      xp:0,
      gold:50,
      currentPhase:'blue',
      unlockedPhases:['blue'],
      baseStats:{hp:60, mp:30, atk:10, def:6, spd:7},
      hp:60, mp:30, // valores actuales (se recalculan max segun nivel+fase)
      unlockedSkills:['rayo_basico','analizar'],
      learnedAt:{rayo_basico:1, analizar:1},
    },
    allies:{
      tomi:{ unlocked:false, level:1, xp:0, hp:0, mp:0, unlockedSkills:['flecha_simple','telequinesis'], inParty:true, transformTurnsLeft:0, transformActive:false },
      domi:{ unlocked:false, level:1, xp:0, hp:0, mp:0, unlockedSkills:['curacion','escudo_rosa'], inParty:true },
    },
    inventory:{
      'poción_menor':3, 'cristal_maná':2,
    },
    progress:{
      currentWorld:1,
      defeatedEnemies:{}, // {worldId: [enemyId,...]}
      worldCleared:{}, // {worldId: bool}
      bossDefeated:{},
    },
    settings:{
      volume: CONFIG.defaultVolume,
    },
    infiniteMode:{
      unlocked:false,
      bestWave:0,
    },
  };
}

let STATE = freshState();

function saveGame(){
  try{
    localStorage.setItem(STORAGE_KEY, JSON.stringify(STATE));
    return true;
  }catch(e){ console.warn('No se pudo guardar', e); return false; }
}
function loadGame(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(!raw) return false;
    STATE = JSON.parse(raw);
    return true;
  }catch(e){ console.warn('No se pudo cargar', e); return false; }
}
function hasSave(){
  return !!localStorage.getItem(STORAGE_KEY);
}

/* ============================================================================
   SECCIÓN 11 — CÁLCULO DE STATS EFECTIVOS
   ============================================================================ */
function levelMult(level){
  // crecimiento suave por nivel
  return 1 + (level-1)*0.12;
}

function getPlayerMaxStats(){
  const p = STATE.player;
  const phase = PHASES[p.currentPhase];
  const lvlM = levelMult(p.level);
  const maxHp = Math.floor(p.baseStats.hp * lvlM * phase.mods.maxHpMult);
  const maxMp = Math.floor(p.baseStats.mp * lvlM * phase.mods.maxMpMult);
  const atk = Math.floor(p.baseStats.atk * lvlM * phase.mods.atk);
  const def = Math.floor(p.baseStats.def * lvlM * phase.mods.def);
  const spd = Math.floor(p.baseStats.spd * lvlM * phase.mods.spd);
  return {maxHp, maxMp, atk, def, spd, fatiguePerTurn: phase.mods.fatiguePerTurn};
}

function getAllyMaxStats(allyId){
  const a = STATE.allies[allyId];
  const base = ALLIES_DB[allyId].baseStats;
  const lvlM = levelMult(a.level);
  let atkMult=1, defMult=1, spdMult=1;
  if(allyId==='tomi' && a.transformActive){
    const t = ALLIES_DB.tomi.transform.mods;
    atkMult = t.atk; defMult = t.def; spdMult = t.spd;
  }
  return {
    maxHp: Math.floor(base.hp*lvlM),
    maxMp: Math.floor(base.mp*lvlM),
    atk: Math.floor(base.atk*lvlM*atkMult),
    def: Math.floor(base.def*lvlM*defMult),
    spd: Math.floor(base.spd*lvlM*spdMult),
  };
}

/* ============================================================================
   SECCIÓN 12 — MOTOR DE COMBATE
   Sistema por turnos basado en velocidad. Cada combatiente puede tener buffs
   temporales (lista de {stat, mult, turns}).
   ============================================================================ */
class Combatant{
  constructor(opts){
    Object.assign(this, opts);
    this.buffs = []; // {stat, mult, turnsLeft}
    this.isDead = false;
  }
  effectiveStat(stat){
    let base = this[stat];
    let mult = 1;
    for(const b of this.buffs){ if(b.stat===stat) mult *= b.mult; }
    return Math.max(1, Math.floor(base*mult));
  }
  addBuff(stat, mult, turns){
    this.buffs.push({stat, mult, turnsLeft:turns});
  }
  tickBuffs(){
    this.buffs.forEach(b=>b.turnsLeft--);
    this.buffs = this.buffs.filter(b=>b.turnsLeft>0);
  }
  clearDebuffs(){
    this.buffs = this.buffs.filter(b=>b.mult>=1);
  }
}

let BATTLE = null; // estado de combate activo

function buildPlayerCombatant(){
  const max = getPlayerMaxStats();
  const p = STATE.player;
  return new Combatant({
    side:'player', key:'damian', name:'Damián', spriteKey:'damian_'+p.currentPhase,
    level:p.level, maxHp:max.maxHp, maxMp:max.maxMp,
    hp:Math.min(p.hp, max.maxHp), mp:Math.min(p.mp, max.maxMp),
    atk:max.atk, def:max.def, spd:max.spd,
    fatiguePerTurn:max.fatiguePerTurn,
    skills: p.unlockedSkills.slice(),
    phaseId: p.currentPhase,
    elem:'rayo',
  });
}

function buildAllyCombatant(allyId){
  const a = STATE.allies[allyId];
  const max = getAllyMaxStats(allyId);
  return new Combatant({
    side:'player', key:allyId, name:ALLIES_DB[allyId].name, spriteKey:allyId,
    level:a.level, maxHp:max.maxHp, maxMp:max.maxMp,
    hp:Math.min(a.hp||max.maxHp, max.maxHp), mp:Math.min(a.mp||max.maxMp, max.maxMp),
    atk:max.atk, def:max.def, spd:max.spd,
    fatiguePerTurn:0,
    skills: a.unlockedSkills.slice(),
    elem: allyId==='tomi' ? 'fisico' : 'soporte',
  });
}

function buildEnemyCombatant(enemyDef, levelScale, world){
  // Escala SOLO si el jugador está por encima del rango base del mundo (premia
  // no grindear de más, pero evita que un jugador subido de nivel lo trivialice
  // completamente; tampoco penaliza si el jugador viene en el rango esperado).
  const baseLevel = world ? world.levelRange[0] : levelScale;
  const overLevel = Math.max(0, levelScale - baseLevel);
  const scale = 1 + overLevel*0.05;
  return new Combatant({
    side:'enemy', key:enemyDef.id, name:enemyDef.name, shape:enemyDef.shape,
    color:enemyDef.color, dark:enemyDef.dark, accent:enemyDef.accent,
    level: levelScale,
    maxHp: Math.floor(enemyDef.hp*scale), hp: Math.floor(enemyDef.hp*scale),
    maxMp: 999, mp: 999,
    atk: Math.floor(enemyDef.atk*scale), def: Math.floor(enemyDef.def*scale), spd: enemyDef.spd,
    weakness: enemyDef.weakness, resist: enemyDef.resist,
    isBoss: enemyDef.isBoss,
    dropXp: enemyDef.dropXp, dropGold: enemyDef.dropGold,
    analyzed:false,
  });
}

function damageFormula(attacker, defender, power, elem){
  const atk = attacker.effectiveStat('atk');
  const def = defender.effectiveStat('def');
  let raw = (atk*power) - (def*0.5);
  raw = Math.max(1, raw);
  // variación aleatoria leve
  raw *= (0.9 + Math.random()*0.2);
  // debilidad / resistencia (solo aplica a enemigos defendiendo, por elemento)
  if(elem && defender.weakness===elem) raw *= 1.5;
  if(elem && defender.resist===elem) raw *= 0.6;
  const isCrit = Math.random() < 0.08;
  if(isCrit) raw *= 1.8;
  return {dmg:Math.floor(raw), isCrit};
}


/* ============================================================================
   SECCIÓN 13 — LÓGICA DE BATALLA (turnos, acciones, IA enemiga)
   ============================================================================ */
function startBattle({worldId, enemyDef, isBoss=false, isInfinite=false, waveLevel=null}){
  const world = WORLDS.find(w=>w.id===worldId) || null;
  // Para campaña normal usamos el nivel ACTUAL del jugador (con piso del rango del mundo)
  // así un jugador que viene sobre-nivelado no encuentra enemigos de papel, y uno que
  // viene corto de nivel no encuentra una pared injusta.
  let levelScale;
  if(waveLevel){
    levelScale = waveLevel; // modo infinito: la oleada ya define el escalado
  } else if(world){
    levelScale = Math.max(world.levelRange[0], STATE.player.level);
  } else {
    levelScale = STATE.player.level;
  }

  const player = buildPlayerCombatant();
  const allies = [];
  if(STATE.allies.tomi.unlocked && STATE.allies.tomi.inParty) allies.push(buildAllyCombatant('tomi'));
  if(STATE.allies.domi.unlocked && STATE.allies.domi.inParty) allies.push(buildAllyCombatant('domi'));

  const enemy = buildEnemyCombatant(enemyDef, levelScale, world);

  BATTLE = {
    worldId, isBoss, isInfinite, waveLevel,
    party: [player, ...allies],
    enemy,
    turnQueue: [],
    turnIndex: 0,
    log: [],
    ended: false,
    analyzedEnemy: false,
    fleeAttempts:0,
  };
  buildTurnQueue();
  return BATTLE;
}

function buildTurnQueue(){
  const combatants = [...BATTLE.party.filter(c=>!c.isDead), BATTLE.enemy].filter(c=>!c.isDead);
  combatants.sort((a,b)=> b.effectiveStat('spd') - a.effectiveStat('spd'));
  BATTLE.turnQueue = combatants;
  BATTLE.turnIndex = 0;
}

function currentActor(){
  return BATTLE.turnQueue[BATTLE.turnIndex];
}

function logMsg(msg){
  BATTLE.log.push(msg);
  if(window.onBattleLog) window.onBattleLog(msg);
}

function applySkillEffect(actor, target, skill){
  const results = [];
  switch(skill.type){
    case 'damage': {
      const hits = skill.hits||1;
      for(let i=0;i<hits;i++){
        if(target.isDead) break;
        const {dmg, isCrit} = damageFormula(actor, target, skill.power/hits + skill.power*0.0, skill.elem);
        const finalDmg = Math.floor((actor.effectiveStat('atk')*skill.power) - target.effectiveStat('def')*0.5);
        const dmgCalc = damageFormula(actor, target, skill.power, skill.elem);
        target.hp = Math.max(0, target.hp - Math.floor(dmgCalc.dmg/hits));
        results.push({type:'damage', amount:Math.floor(dmgCalc.dmg/hits), crit:dmgCalc.isCrit, target});
      }
      break;
    }
    case 'heal': {
      const targets = skill.group ? BATTLE.party.filter(c=>!c.isDead) : [target];
      targets.forEach(t=>{
        const amount = Math.floor(actor.effectiveStat('atk')*0.6*skill.healMult + 12);
        t.hp = Math.min(t.maxHp, t.hp + amount);
        results.push({type:'heal', amount, target:t});
      });
      break;
    }
    case 'buff': {
      target.addBuff(skill.buff.stat, skill.buff.mult, skill.buff.turns);
      results.push({type:'buff', stat:skill.buff.stat, target});
      break;
    }
    case 'debuff': {
      target.addBuff(skill.debuff.stat, skill.debuff.mult, skill.debuff.turns);
      if(skill.power>0){
        const dmgCalc = damageFormula(actor, target, skill.power, skill.elem);
        target.hp = Math.max(0, target.hp - dmgCalc.dmg);
        results.push({type:'damage', amount:dmgCalc.dmg, crit:dmgCalc.isCrit, target});
      }
      results.push({type:'debuff', stat:skill.debuff.stat, target});
      break;
    }
    case 'cleanse': {
      target.clearDebuffs();
      results.push({type:'cleanse', target});
      break;
    }
    case 'analyze': {
      BATTLE.analyzedEnemy = true;
      target.analyzed = true;
      results.push({type:'analyze', target});
      break;
    }
    case 'special': {
      // Rey de la Galaxia: activa transformación de Tomi
      if(skill.id==='rey_galaxia'){
        STATE.allies.tomi.transformActive = true;
        actor.transformActive = true;
        const t = ALLIES_DB.tomi.transform.mods;
        actor.addBuff('atk', t.atk, skill.transformTurns+1);
        actor.addBuff('spd', t.spd, skill.transformTurns+1);
        actor.addBuff('def', t.def, skill.transformTurns+1);
        actor.transformTurnsLeft = skill.transformTurns;
        results.push({type:'transform', target:actor});
      }
      break;
    }
  }
  return results;
}

function playerUseAttack(){
  const actor = currentActor();
  const target = BATTLE.enemy;
  const dmgCalc = damageFormula(actor, target, 1.0, actor.elem);
  target.hp = Math.max(0, target.hp - dmgCalc.dmg);
  logMsg(`${actor.name} ataca a ${target.name} por ${dmgCalc.dmg} de daño${dmgCalc.isCrit?' ¡CRÍTICO!':''}.`);
  return {type:'attack', amount:dmgCalc.dmg, crit:dmgCalc.isCrit, target};
}

function playerUseSkill(skillId, targetOverride){
  const actor = currentActor();
  const skill = SKILLS_DB[skillId];
  if(actor.mp < skill.cost){ return {error:'mana'}; }
  actor.mp -= skill.cost;
  let target = targetOverride;
  if(!target){
    if(skill.type==='heal' || skill.type==='buff' || skill.type==='cleanse') target = actor;
    else target = BATTLE.enemy;
  }
  const results = applySkillEffect(actor, target, skill);
  logMsg(`${actor.name} usa ${skill.name}!`);
  return {type:'skill', skill, results};
}

function playerUseItem(itemId){
  const item = ITEMS_DB[itemId];
  const actor = currentActor();
  if(!STATE.inventory[itemId] || STATE.inventory[itemId]<=0) return {error:'noitem'};
  STATE.inventory[itemId]--;
  if(item.type==='heal'){ actor.hp = Math.min(actor.maxHp, actor.hp+item.value); }
  if(item.type==='mana'){ actor.mp = Math.min(actor.maxMp, actor.mp+item.value); }
  if(item.type==='cleanse'){ actor.clearDebuffs(); }
  if(item.type==='buff'){ actor.addBuff(item.stat, item.mult, item.turns); }
  logMsg(`${actor.name} usa ${item.name}.`);
  return {type:'item', item};
}

function enemyTakeTurn(){
  const enemy = BATTLE.enemy;
  const targets = BATTLE.party.filter(c=>!c.isDead);
  if(targets.length===0) return null;
  const target = targets[Math.floor(Math.random()*targets.length)];
  // IA simple: 75% ataque normal, 25% golpe fuerte si tiene suficiente HP
  const useStrong = Math.random()<0.25 && enemy.hp > enemy.maxHp*0.3;
  const power = useStrong ? 1.4 : 1.0;
  const dmgCalc = damageFormula(enemy, target, power, null);
  target.hp = Math.max(0, target.hp - dmgCalc.dmg);
  logMsg(`${enemy.name} ataca a ${target.name} por ${dmgCalc.dmg}${useStrong?' (¡golpe fuerte!)':''}.`);
  return {type:'enemy_attack', amount:dmgCalc.dmg, target, crit:dmgCalc.isCrit};
}

function applyFatigue(actor){
  if(actor.fatiguePerTurn && actor.fatiguePerTurn>0){
    actor.hp = Math.max(0, actor.hp - actor.fatiguePerTurn);
    logMsg(`${actor.name} sufre ${actor.fatiguePerTurn} de fatiga por la Fase Roja.`);
  }
}

function tickTransform(actor){
  if(actor.key==='tomi' && actor.transformActive){
    actor.transformTurnsLeft--;
    if(actor.transformTurnsLeft<=0){
      actor.transformActive = false;
      STATE.allies.tomi.transformActive = false;
      logMsg(`¡La transformación de Tomi ha terminado!`);
    }
  }
}

function checkBattleEnd(){
  if(BATTLE.enemy.hp<=0){
    BATTLE.enemy.isDead = true;
    BATTLE.ended = true;
    BATTLE.result = 'victory';
    return true;
  }
  const allDead = BATTLE.party.every(c=>c.hp<=0);
  if(allDead){
    BATTLE.ended = true;
    BATTLE.result = 'defeat';
    return true;
  }
  return false;
}

function advanceTurn(){
  BATTLE.turnIndex++;
  if(BATTLE.turnIndex >= BATTLE.turnQueue.length){
    // fin de ronda: tick buffs y fatiga
    BATTLE.turnQueue.forEach(c=>{
      c.tickBuffs();
      if(c.side==='player') applyFatigue(c);
      tickTransform(c);
    });
    buildTurnQueue();
  } else {
    // saltar muertos
    while(BATTLE.turnQueue[BATTLE.turnIndex] && BATTLE.turnQueue[BATTLE.turnIndex].hp<=0 && BATTLE.turnIndex<BATTLE.turnQueue.length){
      BATTLE.turnIndex++;
    }
    if(BATTLE.turnIndex >= BATTLE.turnQueue.length){
      buildTurnQueue();
    }
  }
}

function grantBattleRewards(){
  const enemy = BATTLE.enemy;
  const xp = enemy.dropXp;
  const gold = enemy.dropGold;
  STATE.player.xp += xp;
  STATE.player.gold += gold;
  let leveledUp = false;
  while(STATE.player.xp >= xpForLevel(STATE.player.level+1) && STATE.player.level < maxLevel()){
    STATE.player.xp -= xpForLevel(STATE.player.level+1);
    STATE.player.level++;
    leveledUp = true;
    checkSkillUnlocks();
  }
  // aliados ganan xp también si están en el equipo
  ['tomi','domi'].forEach(id=>{
    if(STATE.allies[id].unlocked && STATE.allies[id].inParty){
      STATE.allies[id].xp += Math.floor(xp*0.8);
      while(STATE.allies[id].xp >= xpForLevel(STATE.allies[id].level+1) && STATE.allies[id].level<maxLevel()){
        STATE.allies[id].xp -= xpForLevel(STATE.allies[id].level+1);
        STATE.allies[id].level++;
      }
    }
  });
  return {xp, gold, leveledUp};
}

function checkSkillUnlocks(){
  const lvl = STATE.player.level;
  Object.values(SKILLS_DB).forEach(sk=>{
    if(sk.id==='flecha_simple'||sk.id==='telequinesis'||sk.id==='lluvia_flechas'||sk.id==='empuje_mental'||sk.id==='rey_galaxia') return; // de Tomi
    if(sk.id==='curacion'||sk.id==='escudo_rosa'||sk.id==='pulso_vital'||sk.id==='purificar'||sk.id==='golpe_psiquico') return; // de Domi
    if(sk.unlockLevel<=lvl && !STATE.player.unlockedSkills.includes(sk.id)){
      STATE.player.unlockedSkills.push(sk.id);
      STATE.player.learnedAt[sk.id]=lvl;
      showToast(`¡Nueva habilidad: ${sk.name}!`);
    }
  });
  // aliados desbloquean sus propias habilidades por nivel
  ['tomi','domi'].forEach(allyId=>{
    const ally = STATE.allies[allyId];
    if(!ally.unlocked) return;
    ALLIES_DB[allyId].skills.forEach(skId=>{
      const sk = SKILLS_DB[skId];
      if(sk.unlockLevel<=ally.level && !ally.unlockedSkills.includes(skId)){
        ally.unlockedSkills.push(skId);
        showToast(`${ALLIES_DB[allyId].name} aprendió: ${sk.name}!`);
      }
    });
  });
}


/* ============================================================================
   SECCIÓN 14 — PROGRESIÓN DE MUNDOS
   ============================================================================ */
function getWorldNodes(worldId){
  const world = WORLDS.find(w=>w.id===worldId);
  const defeated = STATE.progress.defeatedEnemies[worldId] || [];
  const nodes = world.enemies.map((e,i)=>({
    type:'enemy', enemy:e, index:i,
    cleared: defeated.includes(e.id),
    locked: i>0 && !defeated.includes(world.enemies[i-1].id),
  }));
  const bossLocked = !world.enemies.every(e=>defeated.includes(e.id));
  nodes.push({
    type:'boss', enemy:world.boss,
    cleared: !!STATE.progress.bossDefeated[worldId],
    locked: bossLocked,
  });
  return nodes;
}

function isWorldCleared(worldId){
  return !!STATE.progress.worldCleared[worldId];
}

function isWorldUnlocked(worldId){
  if(worldId===1) return true;
  return isWorldCleared(worldId-1);
}

function onEnemyDefeated(worldId, enemyId){
  if(!STATE.progress.defeatedEnemies[worldId]) STATE.progress.defeatedEnemies[worldId]=[];
  if(!STATE.progress.defeatedEnemies[worldId].includes(enemyId)){
    STATE.progress.defeatedEnemies[worldId].push(enemyId);
  }
}

function onBossDefeated(worldId){
  STATE.progress.bossDefeated[worldId] = true;
  STATE.progress.worldCleared[worldId] = true;
  const world = WORLDS.find(w=>w.id===worldId);
  if(world.unlockPhase && !STATE.player.unlockedPhases.includes(world.unlockPhase)){
    STATE.player.unlockedPhases.push(world.unlockPhase);
    showToast(`¡Nueva fase desbloqueada: ${PHASES[world.unlockPhase].name}!`);
  }
  if(world.unlockAlly && !STATE.allies[world.unlockAlly].unlocked){
    STATE.allies[world.unlockAlly].unlocked = true;
    STATE.allies[world.unlockAlly].hp = getAllyMaxStats(world.unlockAlly).maxHp;
    STATE.allies[world.unlockAlly].mp = getAllyMaxStats(world.unlockAlly).maxMp;
    showToast(`¡${ALLIES_DB[world.unlockAlly].name} se une al equipo!`);
  }
  if(worldId === WORLDS.length){
    STATE.infiniteMode.unlocked = true;
    showToast('¡Modo Infinito desbloqueado!');
  }
}

/* ============================================================================
   SECCIÓN 15 — MODO INFINITO
   Genera enemigos infinitos combinando formas/colores con escalado de stats.
   Cada 5 oleadas aparece un "jefe" con estadísticas multiplicadas.
   ============================================================================ */
const INFINITE_SHAPES = ['slime','bat','golem','wisp','knight','serpent','phantom','beast','mech','dragonkin'];
const INFINITE_COLORS = [
  ['#5ad1c0','#1f8a78'],['#7a5ad1','#3d2f8a'],['#e0673b','#8c2f1a'],['#5a9fd1','#1f3d6a'],
  ['#a8d1f5','#5c7a8c'],['#7a3da8','#3a1a52'],['#f5c542','#a3811f'],['#d1543f','#7a2a1f'],
  ['#3fd17a','#1f7a45'],['#9a9aa0','#52525c'],
];

function generateInfiniteEnemy(wave){
  const isBoss = wave % 5 === 0;
  const shapeIdx = Math.floor(Math.random()*INFINITE_SHAPES.length);
  const colorIdx = Math.floor(Math.random()*INFINITE_COLORS.length);
  const shape = isBoss ? 'voidlord' : INFINITE_SHAPES[shapeIdx];
  const [color,dark] = INFINITE_COLORS[colorIdx];
  // La oleada 1 arranca a la altura del jefe final de la campaña (nivel ~13-16) y
  // crece de forma compuesta para que el modo sea un desafío sin techo real.
  const growth = Math.pow(1.14, wave-1);
  const bossScale = isBoss ? 1.7 : 1;
  return makeEnemy({
    id:`inf_${wave}`,
    name: isBoss ? `Aberración Infinita Ω${wave}` : `Espectro Salvaje #${wave}`,
    shape, color, dark, accent: Math.random()>0.5?PAL.boltYellow:PAL.white,
    hp: Math.floor(180*growth*bossScale),
    atk: Math.floor(30*growth*bossScale),
    def: Math.floor(15*growth*bossScale),
    spd: Math.floor(10 + wave*0.7),
    isBoss,
    weakness: Math.random()>0.6?'rayo':null,
    dropXp: Math.floor(90*growth*bossScale),
    dropGold: Math.floor(60*growth*bossScale),
  });
}

let INFINITE_RUN = null;
function startInfiniteRun(){
  INFINITE_RUN = {wave:1, active:true};
}


/* ============================================================================
   SECCIÓN 16 — UTILIDADES DE UI
   ============================================================================ */
function $(sel){ return document.querySelector(sel); }
function $all(sel){ return Array.from(document.querySelectorAll(sel)); }

function showScreen(id){
  $all('.screen').forEach(s=>s.classList.remove('active'));
  $('#'+id).classList.add('active');
}

function showToast(msg){
  const holder = $('#toast-holder');
  const t = document.createElement('div');
  t.className='toast';
  t.textContent = msg;
  holder.appendChild(t);
  setTimeout(()=>t.remove(), 2600);
}
window.showToast = showToast;

function barColorClass(ratio){
  if(ratio>0.5) return '';
  if(ratio>0.2) return 'low';
  return 'crit';
}

/* ============================================================================
   SECCIÓN 17 — SISTEMA DE MÚSICA
   ============================================================================ */
const MUSIC_SLOTS = ['title','worldmap','battle','boss','victory','infinite'];
const MUSIC_LABELS = {
  title:'Pantalla de título', worldmap:'Mapa del mundo', battle:'Combate normal',
  boss:'Combate contra jefe', victory:'Victoria', infinite:'Modo infinito',
};
let userMusicFiles = {}; // slot -> object URL

function getMusicSrc(slot){
  if(userMusicFiles[slot]) return userMusicFiles[slot];
  if(CONFIG.musicLibrary[slot]) return CONFIG.musicLibrary[slot];
  return null;
}

function playMusic(slot){
  const audio = $('#audio-player');
  const src = getMusicSrc(slot);
  if(!src){ audio.pause(); audio.removeAttribute('src'); return; }
  if(audio.dataset.currentSlot === slot && !audio.paused) return;
  audio.src = src;
  audio.dataset.currentSlot = slot;
  audio.volume = STATE.settings.volume;
  audio.play().catch(()=>{/* requiere interacción del usuario, se intentará de nuevo */});
}

function renderMusicSlots(container){
  container.innerHTML = '';
  MUSIC_SLOTS.forEach(slot=>{
    const div = document.createElement('div');
    div.className='track-slot';
    const src = getMusicSrc(slot);
    div.innerHTML = `
      <div>
        <div>${MUSIC_LABELS[slot]}</div>
        <div class="small-dim">${src ? (userMusicFiles[slot]?'archivo subido':'pista configurada') : 'sin pista (silencio)'}</div>
      </div>
      <div class="flex-row">
        <input type="file" accept="audio/*" data-slot="${slot}" style="max-width:120px;">
        ${src?`<button data-test-slot="${slot}">▶</button>`:''}
      </div>
    `;
    container.appendChild(div);
  });
  container.querySelectorAll('input[type=file]').forEach(inp=>{
    inp.addEventListener('change', (e)=>{
      const file = e.target.files[0];
      if(!file) return;
      const slot = e.target.dataset.slot;
      const url = URL.createObjectURL(file);
      userMusicFiles[slot] = url;
      showToast(`Pista cargada para: ${MUSIC_LABELS[slot]}`);
      renderMusicSlots(container);
    });
  });
  container.querySelectorAll('button[data-test-slot]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      playMusic(btn.dataset.testSlot);
    });
  });
}

/* ============================================================================
   SECCIÓN 18 — RENDER: TITLE SCREEN SPRITE
   ============================================================================ */
function renderTitleSprite(){
  const canvas = $('#title-sprite-box');
  const ctx = canvas.getContext('2d');
  drawSprite(ctx, SPRITES.damian_blue, 2);
}

/* ============================================================================
   SECCIÓN 19 — RENDER: WORLD MAP
   ============================================================================ */
function renderWorldMap(worldId){
  const world = WORLDS.find(w=>w.id===worldId);
  $('#wm-world-title').textContent = `MUNDO ${world.id} · ${world.name.toUpperCase()}`;
  const holder = $('#wm-canvas-holder');
  holder.innerHTML = '';
  holder.style.background = `linear-gradient(180deg, ${world.bgGrad[0]}, ${world.bgGrad[1]})`;

  const nodes = getWorldNodes(worldId);
  const positions = layoutNodePositions(nodes.length, holder.clientWidth||880, holder.clientHeight||440);

  // líneas conectoras
  for(let i=0;i<positions.length-1;i++){
    const a = positions[i], b = positions[i+1];
    const dx = b.x-a.x, dy = b.y-a.y;
    const len = Math.sqrt(dx*dx+dy*dy);
    const angle = Math.atan2(dy,dx)*180/Math.PI;
    const line = document.createElement('div');
    line.className='wm-line';
    line.style.left = (a.x+35)+'px';
    line.style.top = (a.y+35)+'px';
    line.style.width = len+'px';
    line.style.transform = `rotate(${angle}deg)`;
    holder.appendChild(line);
  }

  nodes.forEach((node,i)=>{
    const pos = positions[i];
    const div = document.createElement('div');
    div.className = 'wm-node' + (node.locked?' locked':'') + (node.cleared?' cleared':'') + (node.type==='boss'?' boss':'');
    div.style.left = pos.x+'px';
    div.style.top = pos.y+'px';
    const icon = node.type==='boss' ? '★' : '⚔';
    div.innerHTML = `<div class="wm-icon">${icon}</div><div>${node.enemy.name}</div>${node.cleared?'<div class="small-dim">vencido</div>':''}`;
    if(!node.locked){
      div.addEventListener('click', ()=>{
        enterBattleFromMap(worldId, node);
      });
    }
    holder.appendChild(div);
  });

  // botón para volver al hub de mundos si ya se completó este, o avanzar
  if(isWorldCleared(worldId) && worldId<WORLDS.length){
    const nextBtn = document.createElement('div');
    nextBtn.className='wm-node';
    nextBtn.style.left = (holder.clientWidth-100)+'px';
    nextBtn.style.top = '20px';
    nextBtn.style.borderColor = 'var(--gold)';
    nextBtn.innerHTML = `<div class="wm-icon">➜</div><div>Siguiente<br>Mundo</div>`;
    nextBtn.addEventListener('click', ()=>{
      STATE.progress.currentWorld = worldId+1;
      saveGame();
      renderWorldMap(worldId+1);
    });
    holder.appendChild(nextBtn);
  }
}

function layoutNodePositions(count, w, h){
  const positions = [];
  const margin = 80;
  const usableW = w - margin*2;
  for(let i=0;i<count;i++){
    const t = count<=1 ? 0 : i/(count-1);
    const x = margin + t*usableW - 35;
    const y = h/2 + Math.sin(t*Math.PI*1.4)*90 - 35;
    positions.push({x:Math.max(10,x), y:Math.max(10,y)});
  }
  return positions;
}

function enterBattleFromMap(worldId, node){
  playMusic(node.type==='boss' ? 'boss' : 'battle');
  startBattle({worldId, enemyDef:node.enemy, isBoss:node.type==='boss'});
  renderBattleScreen();
  showScreen('screen-battle');
  processTurnsUntilPlayer();
}


/* ============================================================================
   SECCIÓN 20 — RENDER: BATTLE SCREEN
   ============================================================================ */
let battleUIBusy = false; // bloquea input mientras se anima

function renderBattleScreen(){
  $('#battle-title').textContent = BATTLE.isInfinite ? `MODO INFINITO · OLEADA ${BATTLE.waveLevel}` : (BATTLE.isBoss ? '¡COMBATE DE JEFE!' : 'COMBATE');
  renderFighters();
  renderTurnOrderStrip();
  renderHpTags();
  closeAllSubmenus();
  $('#analyze-panel').classList.remove('active');
  $('#battle-log').textContent = `¡${BATTLE.enemy.name} aparece!`;
  updateActionButtonsAvailability();
}

function renderFighters(){
  const playerZone = $('#player-zone');
  const enemyZone = $('#enemy-zone');
  // limpiar excepto hp-tag
  Array.from(playerZone.querySelectorAll('canvas, .ally-portrait')).forEach(e=>e.remove());
  Array.from(enemyZone.querySelectorAll('canvas')).forEach(e=>e.remove());

  // jugador principal (Damián)
  const damian = BATTLE.party.find(c=>c.key==='damian');
  const dCanvas = document.createElement('canvas');
  dCanvas.id='canvas-damian';
  dCanvas.className='fighter-sprite-canvas';
  dCanvas.style.width='128px'; dCanvas.style.height='160px';
  drawSprite(dCanvas.getContext('2d'), SPRITES[damian.spriteKey], 6);
  playerZone.appendChild(dCanvas);

  // aliados como portraits pequeños
  BATTLE.party.filter(c=>c.key!=='damian').forEach((ally,idx)=>{
    const portrait = document.createElement('div');
    portrait.className='ally-portrait';
    portrait.style.left = (14+idx*60)+'px';
    portrait.id = 'portrait-'+ally.key;
    const c = document.createElement('canvas');
    drawSprite(c.getContext('2d'), SPRITES[ally.spriteKey], 3);
    c.style.width='100%'; c.style.height='100%';
    portrait.appendChild(c);
    playerZone.appendChild(portrait);
  });

  // enemigo
  const eCanvas = document.createElement('canvas');
  eCanvas.id='canvas-enemy';
  eCanvas.className='fighter-sprite-canvas';
  const scale = BATTLE.enemy.isBoss ? 8 : 6;
  eCanvas.style.width=(16*scale)+'px'; eCanvas.style.height=(16*scale)+'px';
  drawSprite(eCanvas.getContext('2d'), buildEnemySprite(BATTLE.enemy.shape, BATTLE.enemy.color, BATTLE.enemy.dark, BATTLE.enemy.accent), scale, true);
  enemyZone.appendChild(eCanvas);
}

function renderTurnOrderStrip(){
  const strip = $('#turn-order-strip');
  strip.innerHTML = '';
  BATTLE.turnQueue.forEach((c,i)=>{
    const chip = document.createElement('div');
    chip.className = 'turn-chip'+(i===BATTLE.turnIndex?' current':'');
    chip.textContent = c.side==='player' ? (c.key==='damian'?'D':c.key[0].toUpperCase()) : 'E';
    chip.style.color = c.side==='player' ? '#fff' : 'var(--red-phase)';
    strip.appendChild(chip);
  });
}

function renderHpTags(){
  const damian = BATTLE.party.find(c=>c.key==='damian');
  const ptag = $('#player-hp-tag');
  let html = `<b>${damian.name}</b> <span class="phase-badge" style="color:${PHASES[damian.phaseId].color}">${PHASES[damian.phaseId].name}</span><br>
    Nv.${damian.level} HP ${damian.hp}/${damian.maxHp}
    <div class="bar-bg"><div class="bar-fill ${barColorClass(damian.hp/damian.maxHp)}" style="width:${100*damian.hp/damian.maxHp}%"></div></div>
    <div class="bar-bg"><div class="bar-fill mp" style="width:${100*damian.mp/damian.maxMp}%"></div></div>`;
  ptag.innerHTML = html;

  BATTLE.party.filter(c=>c.key!=='damian').forEach(ally=>{
    const portrait = $('#portrait-'+ally.key);
    if(portrait){
      let bar = portrait.querySelector('.mini-bar');
      if(!bar){
        bar = document.createElement('div');
        bar.className='mini-bar';
        bar.style.position='absolute'; bar.style.bottom='-6px'; bar.style.left='0'; bar.style.right='0';
        bar.style.height='4px'; bar.style.background='#000';
        portrait.appendChild(bar);
      }
      bar.innerHTML = `<div style="height:100%;background:${ally.hp/ally.maxHp>0.3?'#4ade80':'#f87171'};width:${100*Math.max(0,ally.hp)/ally.maxHp}%"></div>`;
    }
  });

  const etag = $('#enemy-hp-tag');
  const e = BATTLE.enemy;
  let ehtml = `<b>${e.name}</b>${e.isBoss?' 👑':''}<br>Nv.${e.level} `;
  if(e.analyzed){
    ehtml += `HP ${e.hp}/${e.maxHp}`;
  } else {
    ehtml += `HP ???`;
  }
  ehtml += `<div class="bar-bg"><div class="bar-fill ${barColorClass(e.hp/e.maxHp)}" style="width:${100*e.hp/e.maxHp}%"></div></div>`;
  etag.innerHTML = ehtml;

  // si el panel de análisis está abierto, mantenerlo sincronizado con el HP actual
  if($('#analyze-panel').classList.contains('active')){
    renderAnalyzePanel();
  }
}

function updateActionButtonsAvailability(){
  const actor = currentActor();
  const isPlayerTurn = actor && actor.side==='player';
  $all('#battle-controls-main .action-btn').forEach(b=>b.disabled = !isPlayerTurn || battleUIBusy);
  $('#act-ally').disabled = !isPlayerTurn || battleUIBusy || !actor || actor.key!=='damian';
}

function closeAllSubmenus(){
  $all('.submenu').forEach(s=>s.classList.remove('active'));
}

function flashHit(targetSide){
  const id = targetSide==='enemy' ? 'canvas-enemy' : 'canvas-damian';
  const el = document.getElementById(id);
  if(!el) return;
  el.classList.add('shake','flash-hit');
  setTimeout(()=>el.classList.remove('shake','flash-hit'), 260);
}

async function wait(ms){ return new Promise(r=>setTimeout(r,ms)); }

/* ---------- flujo de un turno completo ---------- */
async function runPlayerAction(actionResult){
  battleUIBusy = true;
  closeAllSubmenus();
  updateActionButtonsAvailability();

  if(actionResult.target === BATTLE.enemy || (actionResult.results && actionResult.results.some(r=>r.target===BATTLE.enemy))){
    flashHit('enemy');
  }
  renderHpTags();
  $('#battle-log').textContent = BATTLE.log[BATTLE.log.length-1] || '';
  await wait(550);

  if(checkBattleEnd()){ await resolveBattleEnd(); return; }

  advanceTurn();
  renderTurnOrderStrip();
  renderHpTags();
  battleUIBusy = false;
  await processTurnsUntilPlayer();
}

async function processTurnsUntilPlayer(){
  let guard = 0;
  while(BATTLE && !BATTLE.ended && guard<50){
    guard++;
    const actor = currentActor();
    if(!actor){ buildTurnQueue(); continue; }
    if(actor.side==='enemy'){
      battleUIBusy = true;
      updateActionButtonsAvailability();
      await wait(500);
      enemyTakeTurn();
      flashHit('player');
      renderHpTags();
      $('#battle-log').textContent = BATTLE.log[BATTLE.log.length-1] || '';
      await wait(550);
      if(checkBattleEnd()){ await resolveBattleEnd(); return; }
      advanceTurn();
      renderTurnOrderStrip();
      renderHpTags();
    } else if(actor.key!=='damian'){
      // turno de aliado: IA simple automática
      battleUIBusy = true;
      updateActionButtonsAvailability();
      await wait(450);
      allyAutoAction(actor);
      renderHpTags();
      $('#battle-log').textContent = BATTLE.log[BATTLE.log.length-1] || '';
      await wait(550);
      if(checkBattleEnd()){ await resolveBattleEnd(); return; }
      advanceTurn();
      renderTurnOrderStrip();
      renderHpTags();
    } else {
      // turno del jugador (Damián): esperar input
      battleUIBusy = false;
      updateActionButtonsAvailability();
      return;
    }
  }
}

function allyAutoAction(actor){
  // Cura si algún aliado/Damián está bajo de HP y tiene la habilidad
  if(actor.key==='domi'){
    const lowHpAlly = BATTLE.party.find(c=>!c.isDead && c.hp/c.maxHp<0.45 && c.hp>0);
    if(lowHpAlly && actor.mp>=SKILLS_DB.curacion.cost && actor.skills.includes('curacion')){
      actor.mp -= SKILLS_DB.curacion.cost;
      const results = applySkillEffect(actor, lowHpAlly, SKILLS_DB.curacion);
      logMsg(`${actor.name} usa Aura Curativa en ${lowHpAlly.name}!`);
      return;
    }
  }
  // si no, ataque básico o habilidad ofensiva aleatoria
  const offensiveSkills = actor.skills.filter(id=>SKILLS_DB[id].type==='damage' && actor.mp>=SKILLS_DB[id].cost);
  if(offensiveSkills.length && Math.random()<0.6){
    const skId = offensiveSkills[Math.floor(Math.random()*offensiveSkills.length)];
    const sk = SKILLS_DB[skId];
    actor.mp -= sk.cost;
    applySkillEffect(actor, BATTLE.enemy, sk);
    logMsg(`${actor.name} usa ${sk.name}!`);
  } else {
    const dmgCalc = damageFormula(actor, BATTLE.enemy, 1.0, actor.elem);
    BATTLE.enemy.hp = Math.max(0, BATTLE.enemy.hp - dmgCalc.dmg);
    logMsg(`${actor.name} ataca a ${BATTLE.enemy.name} por ${dmgCalc.dmg}.`);
  }
  flashHit('enemy');
}

async function resolveBattleEnd(){
  battleUIBusy = true;
  await wait(400);
  const overlay = $('#result-overlay');
  const box = $('#result-box');
  if(BATTLE.result==='victory'){
    playMusic('victory');
    onEnemyDefeated(BATTLE.worldId, BATTLE.enemy.key);
    if(BATTLE.isBoss) onBossDefeated(BATTLE.worldId);
    const rewards = grantBattleRewards();
    // sincronizar hp/mp actuales de damian y aliados de vuelta al estado persistente
    const damian = BATTLE.party.find(c=>c.key==='damian');
    STATE.player.hp = damian.hp; STATE.player.mp = damian.mp;
    BATTLE.party.filter(c=>c.key!=='damian').forEach(a=>{
      STATE.allies[a.key].hp = a.hp; STATE.allies[a.key].mp = a.mp;
    });
    saveGame();
    box.innerHTML = `<h2>¡VICTORIA!</h2>
      <div>Ganaste ${rewards.xp} EXP y ${rewards.gold} de oro.</div>
      ${rewards.leveledUp?`<div style="color:var(--gold)">¡DAMIÁN SUBIÓ DE NIVEL! Ahora es Nv.${STATE.player.level}</div>`:''}
      <button class="menu-btn" id="btn-result-continue" style="margin-top:14px;">CONTINUAR</button>`;
    overlay.classList.add('active');
    $('#btn-result-continue').addEventListener('click', ()=>{
      overlay.classList.remove('active');
      if(BATTLE.isInfinite){
        continueInfiniteRun();
      } else {
        playMusic('worldmap');
        showScreen('screen-worldmap');
        renderWorldMap(BATTLE.worldId);
      }
    });
  } else {
    box.innerHTML = `<h2>DERROTA...</h2>
      <div>El equipo ha sido vencido.</div>
      <div class="small-dim" style="margin-top:6px;">Volverás al mapa con HP restaurado parcialmente.</div>
      <button class="menu-btn" id="btn-result-continue" style="margin-top:14px;">VOLVER</button>`;
    overlay.classList.add('active');
    // recuperación parcial para no trabar el progreso
    STATE.player.hp = Math.floor(getPlayerMaxStats().maxHp*0.4);
    STATE.player.mp = Math.floor(getPlayerMaxStats().maxMp*0.4);
    saveGame();
    $('#btn-result-continue').addEventListener('click', ()=>{
      overlay.classList.remove('active');
      if(BATTLE.isInfinite){
        INFINITE_RUN = null;
        showScreen('screen-title');
        playMusic('title');
      } else {
        playMusic('worldmap');
        showScreen('screen-worldmap');
        renderWorldMap(BATTLE.worldId);
      }
    });
  }
  battleUIBusy = false;
}


/* ============================================================================
   SECCIÓN 21 — LISTENERS DE ACCIONES DE BATALLA
   ============================================================================ */
function setupBattleActionListeners(){
  $('#act-attack').addEventListener('click', async ()=>{
    if(battleUIBusy) return;
    const res = playerUseAttack();
    await runPlayerAction(res);
  });

  $('#act-skills').addEventListener('click', ()=>{
    if(battleUIBusy) return;
    openSkillsSubmenu();
  });
  $('#act-phase').addEventListener('click', ()=>{
    if(battleUIBusy) return;
    openPhaseSubmenu();
  });
  $('#act-items').addEventListener('click', ()=>{
    if(battleUIBusy) return;
    openItemsSubmenu();
  });
  $('#act-ally').addEventListener('click', ()=>{
    if(battleUIBusy) return;
    openAllySubmenu();
  });
  $('#act-analyze').addEventListener('click', async ()=>{
    if(battleUIBusy) return;
    const res = playerUseSkill('analizar');
    if(res.error){ showToast('No tenés suficiente maná.'); return; }
    renderAnalyzePanel();
    await runPlayerAction(res);
  });

  $all('[data-close-submenu]').forEach(b=>b.addEventListener('click', closeAllSubmenus));

  $('#btn-flee').addEventListener('click', ()=>{
    if(battleUIBusy) return;
    if(BATTLE.isBoss){ showToast('¡No podés huir de un jefe!'); return; }
    BATTLE.fleeAttempts++;
    if(Math.random()<0.65){
      showToast('Escapaste del combate.');
      BATTLE = null;
      playMusic('worldmap');
      showScreen('screen-worldmap');
      renderWorldMap(STATE.progress.currentWorld);
    } else {
      showToast('¡No pudiste huir!');
      processTurnsUntilPlayer();
    }
  });
}

function renderAnalyzePanel(){
  const e = BATTLE.enemy;
  const panel = $('#analyze-panel');
  panel.innerHTML = `
    <b>${e.name}</b><br>
    HP: ${e.hp}/${e.maxHp}<br>
    ATK: ${e.atk} · DEF: ${e.def} · SPD: ${e.spd}<br>
    Debilidad: ${e.weakness ? e.weakness.toUpperCase() : 'ninguna'}<br>
    Resistencia: ${e.resist ? e.resist.toUpperCase() : 'ninguna'}
  `;
  panel.classList.add('active');
}

function openSkillsSubmenu(){
  closeAllSubmenus();
  const actor = currentActor();
  const list = $('#skills-list');
  list.innerHTML = '';
  actor.skills.forEach(skId=>{
    const sk = SKILLS_DB[skId];
    const div = document.createElement('div');
    div.className='submenu-item'+(actor.mp<sk.cost?' disabled':'');
    div.innerHTML = `<span>${sk.name}<br><span class="small-dim">${sk.desc}</span></span><span class="cost-tag">${sk.cost} MP</span>`;
    if(actor.mp>=sk.cost){
      div.addEventListener('click', async ()=>{
        let target;
        if(sk.id==='curacion'||sk.id==='escudo_rosa'||sk.id==='purificar'){
          target = pickHealTarget();
        }
        const res = playerUseSkill(skId, target);
        renderHpTags();
        await runPlayerAction(res);
      });
    }
    list.appendChild(div);
  });
  $('#submenu-skills').classList.add('active');
}

function pickHealTarget(){
  // cura al más herido del equipo (incluye Damián)
  const alive = BATTLE.party.filter(c=>c.hp>0);
  return alive.reduce((min,c)=> (c.hp/c.maxHp < min.hp/min.maxHp ? c : min), alive[0]);
}

function openPhaseSubmenu(){
  closeAllSubmenus();
  const list = $('#phase-list');
  list.innerHTML = '';
  PHASE_ORDER.forEach(pid=>{
    const phase = PHASES[pid];
    const unlocked = STATE.player.unlockedPhases.includes(pid);
    const div = document.createElement('div');
    div.className='submenu-item'+(!unlocked?' disabled':'');
    div.style.borderColor = phase.color;
    div.innerHTML = `<span>${phase.name}${STATE.player.currentPhase===pid?' (activa)':''}<br><span class="small-dim">${phase.desc}</span></span>`;
    if(unlocked && STATE.player.currentPhase!==pid){
      div.addEventListener('click', ()=>{
        STATE.player.currentPhase = pid;
        const damian = BATTLE.party.find(c=>c.key==='damian');
        const max = getPlayerMaxStats();
        const hpRatio = damian.hp/damian.maxHp;
        const mpRatio = damian.mp/damian.maxMp;
        damian.maxHp = max.maxHp; damian.maxMp = max.maxMp;
        damian.hp = Math.floor(max.maxHp*hpRatio); damian.mp = Math.floor(max.maxMp*mpRatio);
        damian.atk = max.atk; damian.def = max.def; damian.spd = max.spd;
        damian.fatiguePerTurn = max.fatiguePerTurn;
        damian.phaseId = pid;
        damian.spriteKey = 'damian_'+pid;
        logMsg(`¡Damián cambia a ${phase.name}!`);
        closeAllSubmenus();
        renderFighters();
        renderHpTags();
        showToast(`Cambiaste a ${phase.name}`);
      });
    }
    list.appendChild(div);
  });
  $('#submenu-phase').classList.add('active');
}

function openItemsSubmenu(){
  closeAllSubmenus();
  const list = $('#items-list');
  list.innerHTML = '';
  const owned = Object.entries(STATE.inventory).filter(([id,qty])=>qty>0 && ITEMS_DB[id].type!=='material');
  if(owned.length===0){
    list.innerHTML = '<div class="small-dim">No tenés items utilizables.</div>';
  }
  owned.forEach(([id,qty])=>{
    const item = ITEMS_DB[id];
    const div = document.createElement('div');
    div.className='submenu-item';
    div.innerHTML = `<span>${item.name} x${qty}<br><span class="small-dim">${item.desc}</span></span>`;
    div.addEventListener('click', async ()=>{
      const res = playerUseItem(id);
      if(res.error) return;
      renderHpTags();
      await runPlayerAction(res);
    });
    list.appendChild(div);
  });
  $('#submenu-items').classList.add('active');
}

function openAllySubmenu(){
  closeAllSubmenus();
  const list = $('#ally-list');
  list.innerHTML = '';
  const allies = BATTLE.party.filter(c=>c.key!=='damian' && c.hp>0);
  if(allies.length===0){
    list.innerHTML = '<div class="small-dim">No tenés aliados disponibles en este combate.</div>';
  }
  allies.forEach(ally=>{
    const div = document.createElement('div');
    div.className='submenu-item';
    div.innerHTML = `<span><b>${ally.name}</b> — HP ${ally.hp}/${ally.maxHp} MP ${ally.mp}/${ally.maxMp}<br>
      <span class="small-dim">Su turno llegará automáticamente en la cola.</span></span>`;
    list.appendChild(div);
  });
  $('#submenu-ally').classList.add('active');
}


/* ============================================================================
   SECCIÓN 22 — FLUJO DEL MODO INFINITO
   ============================================================================ */
function launchInfiniteMode(){
  startInfiniteRun();
  // restaurar HP/MP completo para que sea justo
  STATE.player.hp = getPlayerMaxStats().maxHp;
  STATE.player.mp = getPlayerMaxStats().maxMp;
  ['tomi','domi'].forEach(id=>{
    if(STATE.allies[id].unlocked){
      STATE.allies[id].hp = getAllyMaxStats(id).maxHp;
      STATE.allies[id].mp = getAllyMaxStats(id).maxMp;
    }
  });
  playMusic('infinite');
  launchInfiniteWave();
}

function launchInfiniteWave(){
  const wave = INFINITE_RUN.wave;
  const enemyDef = generateInfiniteEnemy(wave);
  const isBoss = wave % 5 === 0;
  startBattle({worldId:null, enemyDef, isBoss, isInfinite:true, waveLevel:wave});
  if(isBoss) playMusic('boss'); else playMusic('infinite');
  renderBattleScreen();
  showScreen('screen-battle');
  processTurnsUntilPlayer();
}

function continueInfiniteRun(){
  if(INFINITE_RUN.wave > STATE.infiniteMode.bestWave){
    STATE.infiniteMode.bestWave = INFINITE_RUN.wave;
  }
  INFINITE_RUN.wave++;
  saveGame();
  // recuperación parcial entre oleadas (no completa, para que sea desafiante)
  const damian = STATE.player;
  const maxP = getPlayerMaxStats();
  damian.hp = Math.min(maxP.maxHp, damian.hp + Math.floor(maxP.maxHp*0.15));
  damian.mp = Math.min(maxP.maxMp, damian.mp + Math.floor(maxP.maxMp*0.2));
  launchInfiniteWave();
}

/* ============================================================================
   SECCIÓN 23 — PANTALLA DE MENÚ (estado, fases, habilidades, items, aliados, música)
   ============================================================================ */
function renderMenuTab(tab){
  const body = $('#menu-body');
  body.innerHTML = '';

  if(tab==='status'){
    const max = getPlayerMaxStats();
    const card = document.createElement('div');
    card.className='stat-card';
    card.innerHTML = `
      <div class="stat-row"><b>Damián</b><span>Nv. ${STATE.player.level}</span></div>
      <div class="stat-row"><span>EXP</span><span>${STATE.player.xp} / ${xpForLevel(STATE.player.level+1)}</span></div>
      <div class="stat-row"><span>Oro</span><span>${STATE.player.gold} 🪙</span></div>
      <div class="stat-row"><span>Fase actual</span><span style="color:${PHASES[STATE.player.currentPhase].color}">${PHASES[STATE.player.currentPhase].name}</span></div>
      <div class="stat-row"><span>HP</span><span>${STATE.player.hp} / ${max.maxHp}</span></div>
      <div class="stat-row"><span>MP</span><span>${STATE.player.mp} / ${max.maxMp}</span></div>
      <div class="stat-row"><span>ATK</span><span>${max.atk}</span></div>
      <div class="stat-row"><span>DEF</span><span>${max.def}</span></div>
      <div class="stat-row"><span>SPD</span><span>${max.spd}</span></div>
      <div class="stat-row"><span>Mundo actual</span><span>${STATE.progress.currentWorld} / ${WORLDS.length}</span></div>
    `;
    body.appendChild(card);

    if(STATE.infiniteMode.bestWave>0){
      const inf = document.createElement('div');
      inf.className='stat-card';
      inf.innerHTML = `<b>Modo Infinito</b><div class="stat-row"><span>Mejor oleada alcanzada</span><span>${STATE.infiniteMode.bestWave}</span></div>`;
      body.appendChild(inf);
    }
  }

  if(tab==='phases'){
    PHASE_ORDER.forEach(pid=>{
      const phase = PHASES[pid];
      const unlocked = STATE.player.unlockedPhases.includes(pid);
      const card = document.createElement('div');
      card.className='stat-card';
      card.style.borderColor = phase.color;
      card.innerHTML = `
        <div class="stat-row"><b style="color:${phase.color}">${phase.name}</b><span>${unlocked?'Desbloqueada':'🔒 Bloqueada'}</span></div>
        <div>${phase.desc}</div>
        <div style="margin-top:6px;color:var(--hp-green)">Pros: ${phase.pros.join(', ')}</div>
        <div style="color:var(--hp-red)">Contras: ${phase.cons.join(', ')}</div>
      `;
      body.appendChild(card);
    });
  }

  if(tab==='skills'){
    const list = document.createElement('div');
    list.className='skill-tree-list';
    const ownerIsDamianIds = ['rayo_basico','rayo_cadena','electroimpacto','tormenta_voltaica','sobrecarga','paralisis','analizar'];
    ownerIsDamianIds.forEach(skId=>{
      const sk = SKILLS_DB[skId];
      const unlocked = STATE.player.unlockedSkills.includes(sk.id);
      const row = document.createElement('div');
      row.className='skill-row'+(unlocked?'':' locked');
      row.innerHTML = `<span><b>${sk.name}</b> — ${sk.desc}</span><span>${unlocked?`${sk.cost} MP`:`Nv.${sk.unlockLevel} 🔒`}</span>`;
      list.appendChild(row);
    });
    body.appendChild(list);
  }

  if(tab==='items'){
    const grid = document.createElement('div');
    grid.className='item-grid';
    const owned = Object.entries(STATE.inventory).filter(([id,qty])=>qty>0);
    if(owned.length===0) grid.innerHTML='<div class="small-dim">Inventario vacío.</div>';
    owned.forEach(([id,qty])=>{
      const item = ITEMS_DB[id];
      const card = document.createElement('div');
      card.className='item-card';
      card.innerHTML = `<div class="item-name">${item.name} x${qty}</div><div>${item.desc}</div>`;
      grid.appendChild(card);
    });
    body.appendChild(grid);
  }

  if(tab==='allies'){
    ['tomi','domi'].forEach(id=>{
      const ally = STATE.allies[id];
      const def = ALLIES_DB[id];
      const card = document.createElement('div');
      card.className='stat-card';
      card.style.borderColor = def.color;
      if(!ally.unlocked){
        card.innerHTML = `<b style="color:${def.color}">${def.name}</b> — 🔒 Aún no desbloqueado.`;
      } else {
        const max = getAllyMaxStats(id);
        card.innerHTML = `
          <div class="stat-row"><b style="color:${def.color}">${def.name}</b><span>Nv. ${ally.level}</span></div>
          <div>${def.desc}</div>
          <div class="stat-row"><span>HP</span><span>${max.maxHp}</span></div>
          <div class="stat-row"><span>MP</span><span>${max.maxMp}</span></div>
          <div class="stat-row"><span>ATK/DEF/SPD</span><span>${max.atk}/${max.def}/${max.spd}</span></div>
          <label class="small-dim"><input type="checkbox" ${ally.inParty?'checked':''} data-toggle-party="${id}"> En el equipo de combate</label>
        `;
      }
      body.appendChild(card);
    });
    body.querySelectorAll('[data-toggle-party]').forEach(cb=>{
      cb.addEventListener('change', (e)=>{
        const allyId = e.target.getAttribute('data-toggle-party');
        STATE.allies[allyId].inParty = e.target.checked;
        saveGame();
      });
    });
  }

  if(tab==='music'){
    const panel = document.createElement('div');
    panel.className='music-panel';
    panel.innerHTML = `<p class="small-dim" style="margin-bottom:8px;">Subí tus MP3 para cada momento del juego.</p><div id="menu-music-slots"></div>
      <div class="vol-row"><label class="small-dim">VOLUMEN</label><input type="range" id="menu-vol-slider" min="0" max="100" value="${Math.floor(STATE.settings.volume*100)}"></div>`;
    body.appendChild(panel);
    renderMusicSlots(panel.querySelector('#menu-music-slots'));
    panel.querySelector('#menu-vol-slider').addEventListener('input', (e)=>{
      STATE.settings.volume = e.target.value/100;
      $('#audio-player').volume = STATE.settings.volume;
      saveGame();
    });
  }
}

function setupMenuListeners(){
  $all('.menu-tab').forEach(tab=>{
    tab.addEventListener('click', ()=>{
      $all('.menu-tab').forEach(t=>t.classList.remove('active'));
      tab.classList.add('active');
      renderMenuTab(tab.dataset.tab);
    });
  });
}


/* ============================================================================
   SECCIÓN 24 — DIÁLOGOS NARRATIVOS SIMPLES (usados al entrar a un mundo nuevo)
   ============================================================================ */
const WORLD_INTRO_LINES = {
  1: [
    {name:'Damián', text:'Mi nombre es Damián. Algo despertó el poder del rayo dentro de mí... y debo entender por qué.'},
    {name:'???', text:'¡Eh, tú! ¡Sí, el de pelo azul! ¿También sentiste el llamado de los Llanos de Circuito?'},
    {name:'Damián', text:'¿Quién eres?'},
    {name:'Tomi', text:'Soy Tomi. Parezco tu reflejo, pero verde. Flechas, telequinesis... y algo más, cuando la galaxia lo permite.'},
  ],
  2: [
    {name:'Damián', text:'Las Cavernas de Magma arden incluso en la entrada. Voy a necesitar algo más que velocidad aquí.'},
    {name:'Tomi', text:'Sentí una energía roja en tu interior, Damián. Tal vez sea momento de dejarla salir.'},
  ],
  3: [
    {name:'Damián', text:'Los Picos de Cristal... el frío corta como cuchillas. Pero no estamos solos.'},
    {name:'Domi', text:'Llevo tiempo observándolos desde las cumbres. Mi nombre es Domi. No peleo con fuerza bruta, pero puedo mantenerlos con vida.'},
    {name:'Damián', text:'Bienvenida al equipo, Domi.'},
  ],
  4: [
    {name:'Damián', text:'El Abismo del Vacío... aquí termina todo lo que empezó con un simple rayo.'},
    {name:'Domi', text:'Sea lo que sea que nos espere ahí abajo, lo enfrentaremos juntos.'},
  ],
};

let dialogueQueue = [];
function showDialogueQueue(lines, onComplete){
  dialogueQueue = lines.slice();
  const box = $('#dialogue-box');
  box.classList.add('active');
  advanceDialogue(onComplete);
}
function advanceDialogue(onComplete){
  const box = $('#dialogue-box');
  if(dialogueQueue.length===0){
    box.classList.remove('active');
    box.onclick = null;
    if(onComplete) onComplete();
    return;
  }
  const line = dialogueQueue.shift();
  $('#dialogue-name').textContent = line.name;
  $('#dialogue-text').textContent = line.text;
  box.onclick = ()=>advanceDialogue(onComplete);
}

/* ============================================================================
   SECCIÓN 25 — NAVEGACIÓN PRINCIPAL Y BOOT
   ============================================================================ */
function goToWorldMap(worldId){
  STATE.progress.currentWorld = worldId;
  playMusic('worldmap');
  showScreen('screen-worldmap');
  renderWorldMap(worldId);
}

function startNewGame(){
  STATE = freshState();
  saveGame();
  showDialogueQueue(WORLD_INTRO_LINES[1], ()=>{
    goToWorldMap(1);
  });
}

function continueGame(){
  if(!loadGame()){ showToast('No hay partida guardada.'); return; }
  $('#audio-player').volume = STATE.settings.volume;
  goToWorldMap(STATE.progress.currentWorld);
}

function maybeShowWorldIntro(worldId){
  // Solo se muestra la primera vez que se entra al mundo (heurística simple: si no hay enemigos derrotados aún)
  const defeated = STATE.progress.defeatedEnemies[worldId];
  if(!defeated || defeated.length===0){
    if(WORLD_INTRO_LINES[worldId]){
      showDialogueQueue(WORLD_INTRO_LINES[worldId], ()=>{});
    }
  }
}

function setupTitleScreenListeners(){
  $('#btn-new-game').addEventListener('click', ()=>{
    startNewGame();
  });
  $('#btn-continue').addEventListener('click', ()=>{
    if(!hasSave()){ showToast('No hay partida guardada todavía.'); return; }
    continueGame();
  });
  $('#btn-continue').disabled = !hasSave();

  $('#btn-infinite').addEventListener('click', ()=>{
    if(!hasSave() && !STATE.infiniteMode.unlocked){
      showToast('Completá la campaña al menos una vez para desbloquear el Modo Infinito.');
      return;
    }
    if(hasSave()) loadGame();
    if(!STATE.infiniteMode.unlocked){
      showToast('Modo Infinito bloqueado: derrotá al jefe del Mundo 4 primero.');
      return;
    }
    launchInfiniteMode();
  });

  $('#btn-music-setup').addEventListener('click', ()=>{
    showScreen('screen-music');
    renderMusicSlots($('#music-slots'));
    $('#vol-slider').value = Math.floor((STATE.settings.volume)*100);
  });
  $('#btn-music-back').addEventListener('click', ()=>{
    showScreen('screen-title');
  });
  $('#vol-slider').addEventListener('input', (e)=>{
    STATE.settings.volume = e.target.value/100;
    $('#audio-player').volume = STATE.settings.volume;
  });

  $('#btn-credits').addEventListener('click', ()=>{
    showDialogueQueue([
      {name:'Créditos', text:'DAMIÁN · Crónicas del Rayo — un RPG pixel art hecho para ser rejugado.'},
      {name:'Créditos', text:'Diseño y programación: vos y Claude. Música: la que le sumes en el menú MÚSICA.'},
      {name:'Créditos', text:'¡Gracias por jugar!'},
    ], ()=>{});
  });
}

function setupWorldMapListeners(){
  $('#btn-open-menu').addEventListener('click', ()=>{
    showScreen('screen-menu');
    $all('.menu-tab').forEach(t=>t.classList.remove('active'));
    $('.menu-tab[data-tab="status"]').classList.add('active');
    renderMenuTab('status');
  });
  $('#btn-wm-title').addEventListener('click', ()=>{
    saveGame();
    showScreen('screen-title');
    $('#btn-continue').disabled = !hasSave();
    playMusic('title');
  });
  $('#btn-menu-back').addEventListener('click', ()=>{
    showScreen('screen-worldmap');
    saveGame();
  });
}

function bootGame(){
  renderTitleSprite();
  setupTitleScreenListeners();
  setupWorldMapListeners();
  setupBattleActionListeners();
  setupMenuListeners();
  playMusic('title');
}

window.addEventListener('DOMContentLoaded', bootGame);
