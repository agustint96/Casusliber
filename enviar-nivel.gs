/**
 * Casus Liber — recibe un nivel del editor y te lo manda por correo.
 *
 * ---------------------------------------------------------------------------
 * QUÉ HACE
 * ---------------------------------------------------------------------------
 * El editor del juego le manda a este script el archivo del nivel. El script
 * te escribe un mail a vos con:
 *   - el nivel adjunto como .txt  (Gmail NO deja adjuntar .js, ver abajo)
 *   - el mismo contenido escrito en el cuerpo, para copiar y pegar
 *   - si activás GUARDAR_EN_DRIVE, el .js de verdad guardado en tu Drive
 *
 * Por qué el adjunto va como .txt: Gmail bloquea los archivos .js y .mjs como
 * adjunto, incluso adentro de un .zip. La propia ayuda de Gmail recomienda
 * pasarlos por Drive. Por eso el mail te llega con "nivel19.js.txt" (lo
 * renombrás sacándole el .txt) y, si querés el archivo intacto, activás Drive.
 *
 * ---------------------------------------------------------------------------
 * CÓMO PUBLICARLO (una sola vez, ~10 minutos)
 * ---------------------------------------------------------------------------
 * 1. Entrá a https://script.google.com con tu cuenta de Google y creá un
 *    proyecto nuevo.
 * 2. Borrá lo que venga escrito y pegá TODO este archivo.
 * 3. Cambiá DESTINO por tu correo y elegí una CLAVE cualquiera.
 * 4. Guardá (el disquete o Ctrl+S).
 * 5. Botón "Implementar" (Deploy) → "Nueva implementación".
 *    - Tipo: "Aplicación web".
 *    - Ejecutar como: "Yo".
 *    - Quién tiene acceso: "Cualquier persona".
 * 6. Aceptá los permisos que pide (enviar correo en tu nombre).
 * 7. Copiá la URL que te da, la que termina en /exec.
 * 8. Pegala en index.html, en el bloque ENVIO:
 *       const ENVIO = {
 *         url: "https://script.google.com/macros/s/AKfy..../exec",
 *         correo: "vos@gmail.com",
 *         clave: "la-misma-clave-de-acá-abajo",
 *       };
 *
 * Si después cambiás algo de este script, acordate de volver a implementarlo
 * ("Implementar" → "Administrar implementaciones" → editar → versión nueva),
 * o la URL vieja va a seguir corriendo el código viejo.
 *
 * ---------------------------------------------------------------------------
 * LÍMITES
 * ---------------------------------------------------------------------------
 * Una cuenta de Gmail común puede mandar unos 100 correos por día desde Apps
 * Script. De sobra para esto, pero es un tope real si el juego se hace muy
 * popular.
 *
 * La clave no es seguridad de verdad: viaja en el index.html, así que
 * cualquiera que mire el código la puede leer. Solo sirve para que un robot
 * que encuentre la URL suelta no te llene la casilla. Si eso llega a pasar,
 * cambiá la clave (acá y en index.html) o borrá la implementación.
 */

// ---------------------------------------------------------------------------
// CONFIGURACIÓN
// ---------------------------------------------------------------------------
var DESTINO = 'TU_CORREO@gmail.com'; // a dónde te llegan los niveles
var CLAVE = 'casusliber'; // la misma que pongas en index.html
var MAX_CARACTERES = 200000; // tope de tamaño de un nivel
var GUARDAR_EN_DRIVE = true; // true = además guarda el .js en tu Drive
var CARPETA_DRIVE = 'Casus Liber - niveles recibidos';

// ---------------------------------------------------------------------------

function doPost(e) {
  try {
    var d = leerDatos_(e);

    if (String(d.clave || '') !== CLAVE) {
      return responder_({ ok: false, error: 'clave incorrecta' });
    }

    var contenido = String(d.contenido || '');
    if (!contenido.trim()) {
      return responder_({ ok: false, error: 'el nivel llegó vacío' });
    }
    if (contenido.length > MAX_CARACTERES) {
      return responder_({ ok: false, error: 'el nivel es demasiado grande' });
    }

    // el nombre del archivo viene de afuera: se limpia antes de usarlo
    var archivo = String(d.archivo || 'nivel.js').replace(/[^A-Za-z0-9._-]/g, '');
    if (!/\.js$/.test(archivo)) archivo += '.js';

    var autor = recortar_(d.nombre, 80) || 'anónimo';
    var nota = recortar_(d.mensaje, 800);
    var titulo = recortar_(d.titulo, 120);

    var enlaceDrive = '';
    if (GUARDAR_EN_DRIVE) {
      try {
        enlaceDrive = guardarEnDrive_(archivo, contenido, autor);
      } catch (errDrive) {
        enlaceDrive = '(no se pudo guardar en Drive: ' + errDrive + ')';
      }
    }

    var cuerpo =
      'Te mandaron un nivel para Casus Liber.\n\n' +
      'Autor: ' + autor + '\n' +
      'Título: ' + (titulo || '(sin título)') + '\n' +
      'Archivo: ' + archivo + '\n' +
      (enlaceDrive ? 'En tu Drive: ' + enlaceDrive + '\n' : '') +
      (nota ? '\nMensaje del autor:\n' + nota + '\n' : '') +
      '\nPara instalarlo:\n' +
      '  1. Guardá el adjunto en la carpeta niveles/ del juego.\n' +
      '  2. Sacale el ".txt" del final del nombre, así queda ' + archivo + '.\n' +
      '  3. Si es un nivel numerado nuevo, subí window.LEVEL_COUNT en index.html.\n\n' +
      '(El adjunto va como .txt porque Gmail no deja adjuntar archivos .js.)\n\n' +
      '----- contenido del nivel -----\n\n' +
      contenido;

    MailApp.sendEmail({
      to: DESTINO,
      subject: 'Casus Liber — nivel nuevo: ' + archivo + ' (' + autor + ')',
      body: cuerpo,
      attachments: [
        Utilities.newBlob(contenido, 'text/plain', archivo + '.txt')
      ]
    });

    return responder_({ ok: true });
  } catch (err) {
    return responder_({ ok: false, error: String(err) });
  }
}

/**
 * Abrir la URL en el navegador cae acá. Sirve para comprobar de un vistazo
 * que el script quedó publicado.
 */
function doGet() {
  return responder_({
    ok: true,
    mensaje: 'Casus Liber: este script recibe niveles por POST.'
  });
}

/**
 * El editor manda los datos de dos maneras según lo que permita el navegador:
 * como JSON en el cuerpo, o como un formulario común. Se aceptan las dos.
 */
function leerDatos_(e) {
  if (e && e.postData && e.postData.contents) {
    try {
      var j = JSON.parse(e.postData.contents);
      if (j && typeof j === 'object') return j;
    } catch (err) {
      // no era JSON: sigue de largo y usa los parámetros del formulario
    }
  }
  return (e && e.parameter) || {};
}

function guardarEnDrive_(archivo, contenido, autor) {
  var carpetas = DriveApp.getFoldersByName(CARPETA_DRIVE);
  var carpeta = carpetas.hasNext()
    ? carpetas.next()
    : DriveApp.createFolder(CARPETA_DRIVE);
  var sello = Utilities.formatDate(
    new Date(),
    Session.getScriptTimeZone(),
    'yyyy-MM-dd HH.mm'
  );
  var nombre = sello + ' - ' + autor + ' - ' + archivo;
  var file = carpeta.createFile(
    Utilities.newBlob(contenido, 'text/javascript', nombre)
  );
  return file.getUrl();
}

function recortar_(v, n) {
  return String(v == null ? '' : v).slice(0, n).trim();
}

function responder_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}

/**
 * Corré esta función a mano desde el editor de Apps Script (elegila en el
 * desplegable de arriba y apretá "Ejecutar") para probar que el mail sale
 * bien, sin tener que pasar por el juego.
 */
function probar() {
  var r = doPost({
    postData: {
      contents: JSON.stringify({
        clave: CLAVE,
        archivo: 'nivel99.js',
        titulo: 'Prueba',
        nombre: 'prueba desde Apps Script',
        mensaje: 'Si te llegó esto, el script anda.',
        contenido:
          '// Nivel de prueba\nwindow.LEVELS[98] = [\n  "hola",\n];\n'
      })
    }
  });
  Logger.log(r.getContent());
}
