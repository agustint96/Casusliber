// Nivel FINAL — siempre es el último nivel del juego.
// Se carga aparte (después de todos los nivelN.js numerados) y usa
// window.LEVEL_COUNT como su índice, así queda siempre "un lugar
// después" del último nivel numerado, sin importar cuántos niveles
// numerados haya. index.html se encarga de cargarlo siempre al final
// y de reiniciar el juego (fundido a blanco) cuando se toca la
// flecha derecha en este nivel.
window.LEVELS[window.LEVEL_COUNT] = [
  "_",
  "  Desarrollado por:",
  "                     Agustín Tardella",
  "",
  "                     ",
  "",
  "              ",
];
window.LEVEL_TITLES[window.LEVEL_COUNT] = "                 Casus Liber";
window.FINAL_LEVEL_INDEX = window.LEVEL_COUNT;
