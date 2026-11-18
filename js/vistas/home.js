// Página de inicio: presentación, guías de uso y licencias
import { h } from '../ui.js';
import { estado } from '../almacen.js';

const guia = (icono, titulo, ...contenido) => h('details.guia', {},
  h('summary', {}, h('span.guia-icono', {}, icono), h('span', {}, titulo)),
  h('div.guia-cuerpo', {}, ...contenido));
const p = (...t) => h('p', {}, ...t);
const pasos = (...items) => h('ol.pasos-guia', {}, items.map((x) => h('li', {}, x)));
const lista = (...items) => h('ul', {}, items.map((x) => h('li', {}, x)));
const b = (t) => h('b', {}, t);

export function vistaHome(cont, irA) {
  const nPj = Object.keys(estado.personajes || {}).length;
  cont.replaceChildren(h('section.home', {},
    h('div.home-portada', {},
      h('img', { src: 'img/emblema.svg', alt: '', width: 84, height: 84 }),
      h('h1', {}, h('small', {}, 'Bienvenido a'), 'La Senda del Errante'),
      h('p.lema', {}, 'Tu compañero de mesa para la quinta edición del juego de rol de fantasía más famoso, con las reglas de 2024 y en español.'),
      h('p.gratis', {}, '✦ Gratis, sin anuncios y sin necesidad de registrarte ✦'),
      h('div.acciones.centradas', {},
        h('button.btn.rojo.grande', { onclick: () => irA(nPj ? '#/personajes' : '#/crear') }, nPj ? '⚔ Mis personajes' : '✦ Crear mi primer personaje'),
        h('button.btn.grande', { onclick: () => irA('#/partidas') }, '⚑ Partidas')),
    ),

    h('h2', {}, '¿Qué es y para qué sirve?'),
    p('La Senda del Errante reúne en el móvil todo lo que necesitas alrededor de la mesa:'),
    lista(
      [b('Crear personajes'), ' paso a paso con las reglas, o introducir la hoja que ya tienes en papel y comprobar que las cumple.'],
      [b('Llevar la hoja durante la partida'), ': puntos de golpe, estados, recursos, conjuros, descansos, subidas de nivel… con tiradas de dados incluidas.'],
      [b('Jugar en grupo'), ': el DM crea una partida, ve las hojas de todos en tiempo real, decide las reglas de la mesa, lleva la iniciativa y escribís juntos la crónica.'],
      [b('Consultar reglas'), ' rápidamente: estados, clases, especies, dotes, equipo y más de 300 conjuros con buscador.'],
    ),
    p('Es ', b('gratis'), ': no tiene anuncios, no cobra nada y puedes usarla sin cuenta. Solo necesitas entrar con Google si quieres compartir partidas con tu grupo.'),

    h('h2', {}, 'Guías de uso'),
    p('Toca cada apartado para desplegar la explicación.'),

    guia('📲', 'Instalar la app en el móvil',
      p('No hace falta tienda de aplicaciones. Abre la web en Chrome (Android) o Safari (iPhone):'),
      pasos(
        ['En Android: menú ⋮ → ', b('Instalar aplicación'), ' o «Añadir a pantalla de inicio».'],
        ['En iPhone: botón Compartir → ', b('Añadir a pantalla de inicio'), '.'],
        'Se abrirá como una app más y funciona sin conexión (salvo las partidas compartidas, que necesitan internet para sincronizarse).',
      ),
      p('Cuando haya una versión nueva saldrá arriba el aviso «Hay una versión nueva de la app». Pulsa ', b('Actualizar'), '.'),
    ),

    guia('✦', 'Crear un personaje',
      pasos(
        ['En ', b('Personajes'), ' pulsa «Nuevo personaje». Elige nombre (el botón 🎲 te propone nombres), nivel y alineamiento.'],
        [b('Clase'), ': toca una tarjeta para ver sus rasgos. Algunas piden una elección (Orden divina, Estilo de combate…).'],
        [b('Trasfondo'), ': te da aumentos de característica, una dote de origen, dos habilidades y equipo.'],
        [b('Especie'), ': elige linaje o ancestro si lo tiene.'],
        [b('Características'), ': conjunto estándar, compra de puntos o tirar dados, y reparte los aumentos del trasfondo (+2/+1 o +1/+1/+1).'],
        [b('Habilidades e idiomas'), ': la app te indica cuántas te tocan y de dónde vienen. Toca dos veces para marcar pericia si tu clase la tiene.'],
        [b('Equipo'), ': la opción A o B de la clase y del trasfondo.'],
        ['Si empiezas por encima de nivel 1: ', b('PG y mejoras'), ' de los niveles extra.'],
        ['Si lanzas conjuros: ', b('trucos y conjuros'), ' de tu lista, con su descripción.'],
        [b('Resumen'), ': la app revisa las reglas y te dice si falta o sobra algo. Pulsa «Crear personaje».'],
      ),
    ),

    guia('✎', 'Introducir una hoja que ya tienes',
      p('En el primer paso del creador elige ', b('«Introducir hoja existente»'), '. Así puedes escribir tus puntuaciones tal cual y saltarte el equipo.'),
      p('Después, en la hoja, la pestaña ', b('«⚙ Editar y revisar»'), ' te deja cambiar cualquier cosa (nivel, características, habilidades, dotes, PG y CA anotados…) y muestra la ', b('comprobación de reglas'), ': ✗ errores, ⚠ avisos y ✓ lo que está bien.'),
    ),

    guia('⚔', 'Usar la hoja durante la partida',
      lista(
        [b('Toca para tirar'), ': características, salvaciones, habilidades, iniciativa y ataques (botón rojo 🎯 para impactar, dorado ⚔ para el daño). Elige ventaja o desventaja con el selector.'],
        [b('PG'), ': «− Daño» y «+ Curar» (también PG temporales). Si llegas a 0 aparecen las salvaciones contra muerte.'],
        [b('Estados y agotamiento'), ': toca un estado para activarlo y ver qué hace.'],
        [b('Recursos'), ' (furia, canalizar divinidad, puntos de hechicería…) y ', b('dados de golpe'), '.'],
        [b('Descanso corto y largo'), ': recuperan lo que corresponde automáticamente.'],
        [b('Subir nivel'), ': un asistente te muestra solo lo que toca elegir en ese nivel.'],
        [b('Deshacer'), ': si te equivocas, pulsa «↶ Deshacer» o vuelve a cualquier punto en el Historial de «Editar y revisar».'],
        [b('Equipo'), ': marca lo que llevas puesto (la CA se calcula sola), cantidades, monedas y peso.'],
      ),
    ),

    guia('✧', 'Conjuros: preparar y lanzar',
      lista(
        ['En la pestaña ', b('✧ Conjuros'), ' ves tu CD, tu ataque de conjuro y tus espacios.'],
        [b('Añadir del grimorio'), ' muestra los conjuros de tu clase hasta el nivel que puedes lanzar.'],
        [b('Preparados'), ': la casilla de cada conjuro. Quedan fijados hasta tu próximo descanso largo (o hasta subir de nivel, según tu clase); entonces la app te pide prepararlos.'],
        [b('Lanzar'), ': primero ves qué hace y eliges el espacio; luego la app te dice si hay que tirar para impactar o qué salvación hace el objetivo, y qué dados tirar de daño o curación.'],
        [b('Concentración'), ': la app recuerda en qué te concentras y te hace tirar la salvación al recibir daño.'],
      ),
    ),

    guia('⚑', 'Crear una partida o unirse a una',
      pasos(
        ['Ve a ', b('Partidas'), ' y entra con tu cuenta de Google.'],
        [b('DM'), ': pulsa «Crear partida», ponle nombre y elige las reglas de la mesa. Comparte el ', b('código de 6 letras'), ' con tus jugadores.'],
        [b('Jugadores'), ': «Unirme con código» y después unen su personaje a la partida (botón en la mesa o en «Editar y revisar»).'],
        'Si tenías personajes guardados solo en el móvil, al entrar la app te ofrece subirlos a tu cuenta.',
      ),
    ),

    guia('♛', 'Panel del DM',
      lista(
        [b('Mesa'), ': las hojas de todos los jugadores en tiempo real y una tabla rápida con PG, CA, percepción pasiva, velocidad y estados.'],
        [b('Reglas de la mesa'), ': dados virtuales o físicos, peso y carga, munición, métodos de características permitidos, PG al subir de nivel, PX o hitos, duración de los descansos, pociones como acción adicional y dotes.'],
        [b('Dados físicos'), ': la app no tira; solo indica qué tirar y pide el resultado cuando lo necesita.'],
        [b('Corregir como DM'), ': dentro de la hoja de un jugador puedes corregirla o deshacer cambios (sin poder borrarla ni cambiar su dueño).'],
        [b('Permisos'), ': decides qué jugadores pueden escribir la crónica y llevar la iniciativa.'],
      ),
    ),

    guia('✒', 'Crónica de la partida',
      p('Pestaña ', b('Crónica'), ' de la partida. El DM y los jugadores que él marque escriben la historia; los demás la ven ', b('mientras se escribe'), '. «Publicar» la deja fija, «Nueva sesión» añade un separador con la fecha y puedes descargarla entera.'),
    ),

    guia('⚔', 'Iniciativa y combates',
      pasos(
        'Los personajes de la mesa aparecen solos. Cada jugador tira (o anota) su iniciativa, o el DM pulsa «Tirar las que faltan».',
        ['Añade enemigos o aliados (con 🎲 para el nombre, cantidad, PG y CA). Se guardan para ', b('reutilizarlos'), ' en otros combates.'],
        ['«Empezar combate»: el orden se calcula solo. «Siguiente turno» avanza y al jugador al que le toca le salta ', b('«¡Es tu turno!»'), '.'],
        'Lleva los PG de los enemigos (los caídos se saltan) y oculta los que no quieras mostrar.',
        '«Terminar y limpiar» quita enemigos y aliados y deja a los personajes listos para el siguiente combate.',
      ),
    ),

    guia('📖', 'Añadir contenido de tu libro',
      p('El reglamento gratuito (SRD 5.2) no incluye todo el Manual del Jugador de 2024: trae 9 especies, 4 trasfondos y parte de las dotes.'),
      p('En ', b('Personajes → «📖 Contenido de mi libro»'), ' (o en la pestaña ', b('Libro'), ' de una partida, si eres DM) puedes añadir trasfondos, especies y dotes de tu libro. Aparecen en el creador marcados con 📖 y el comprobador de reglas los tiene en cuenta. Si los añade el DM en la partida, los tiene toda la mesa.'),
    ),

    guia('❦', 'Compendio, dados y más',
      lista(
        [b('Compendio'), ': buscador de reglas, estados, clases, especies, trasfondos, dotes, armas, armaduras y conjuros (con filtros por nivel, clase, escuela, concentración y ritual).'],
        [b('Dados'), ': bandeja con todos los dados, ventaja/desventaja y expresiones como 2d6+3.'],
        [b('Generador de nombres'), ': botón 🎲 junto a los nombres, por pueblo o tipo de criatura.'],
        [b('Almanaque'), ': la cinta bajo la cabecera muestra la estación y la fecha de hoy en el calendario de Harptos. Tócala para ver más.'],
        [b('Unidades'), ': junto a metros, kilos y kilómetros verás pies, libras y millas.'],
      ),
    ),

    guia('💾', 'Copias de seguridad y privacidad',
      lista(
        ['Sin cuenta, tus personajes se guardan ', b('solo en este dispositivo'), '. Haz copia con «⬇ Exportar todos» en Personajes (o «⬇ Exportar» en la cabecera de cada hoja) y recupérala con «⬆ Importar JSON».'],
        ['Con cuenta de Google se guardan en la nube (Firebase) y los ves en cualquier móvil. Solo tú y el DM de tu partida podéis verlos.'],
        'La app no tiene anuncios ni rastreadores, y no vende ni comparte tus datos.',
      ),
    ),

    guia('?', 'Preguntas frecuentes',
      lista(
        [b('¿Por qué no está mi especie o trasfondo?'), ' Porque solo podemos incluir el reglamento gratuito. Añádelo desde «Contenido de mi libro».'],
        [b('¿Por qué no me deja preparar un conjuro?'), ' Tus preparados están fijados hasta el próximo descanso largo (o subida de nivel). Si el DM lo permite, usa «🔓 Desbloquear».'],
        [b('He hecho algo sin querer.'), ' Pulsa «↶ Deshacer» o vuelve atrás desde el Historial.'],
        [b('No veo los cambios nuevos.'), ' Pulsa «Actualizar» en el aviso o «⟳ Recargar la app» en la página ⓘ.'],
      ),
    ),

    h('h2', {}, 'Cómo está hecha'),
    p('Es una aplicación web progresiva (PWA) escrita en HTML, CSS y JavaScript, sin dependencias, alojada gratis en GitHub Pages. Las partidas compartidas usan Firebase (Google) para sincronizar en tiempo real. Todo el contenido de reglas está traducido y resumido al español.'),

    h('h2', {}, 'Licencias'),
    lista(
      ['Esta obra incluye material del ', b('System Reference Document 5.2'), ' («SRD 5.2») de Wizards of the Coast LLC, disponible en https://www.dndbeyond.com/srd. El SRD 5.2 se publica bajo la licencia ', b('Creative Commons Atribución 4.0 Internacional'), ' (https://creativecommons.org/licenses/by/4.0/legalcode). Los textos son traducciones y resúmenes propios.'],
      'La app no está afiliada ni respaldada por Wizards of the Coast. Dungeons & Dragons es una marca registrada de Wizards of the Coast LLC.',
      ['Conversión al calendario de Harptos basada en el método de ', b('faerun-date'), ' (Cantilux, licencia MIT).'],
      ['Tipografías Cinzel y Alegreya (Google Fonts, licencia SIL Open Font).'],
      'El emblema, el diseño y el código de la app son propios.',
    ),
    h('div.acciones.centradas', {}, h('button.btn', { onclick: () => irA('#/acerca') }, 'ⓘ Versión y actualizaciones')),
    h('p.firma', {}, 'Hecho con cariño por JDev'),
  ));
}
