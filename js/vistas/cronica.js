// Crónica de la partida: escritura compartida en tiempo real
import { h, toast, confirmar, descargar, alSalir } from '../ui.js';
import { estado, escucharSub, crearEnSub, escribirEnSub, borrarEnSub, actualizarPartida, nombreDe, soyDMDe, puedeEscribirCronica } from '../almacen.js';

const fecha = (t) => new Date(t).toLocaleString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

export function vistaCronica(cont, p) {
  const uid = estado.usuario.uid;
  const dm = soyDMDe(p);
  let entradas = [];
  let borradorId = null; let temporizador = null;
  let editando = null; // id de entrada propia que se edita

  const lista = h('div.cronica-lista');
  const zonaEscribir = h('div.cronica-escribir');

  const pintarLista = () => {
    const orden = [...entradas].sort((a, b) => a.creada - b.creada);
    lista.replaceChildren(...(orden.length ? orden.map((e) => {
      const mia = e.autor === uid;
      if (e.tipo === 'sesion') return h('div.cr-sesion', {}, h('span', {}, e.texto), (mia || dm) && h('button.x', { onclick: () => borrar(e) }, '×'));
      if (e.borrador && mia) return null; // el propio borrador está en el editor
      if (editando === e.id) return editorEntrada(e);
      return h('article.cr-entrada' + (e.borrador ? '.borrador' : ''), {},
        h('header', {}, h('b', {}, nombreDe(p, e.autor)), h('small', {}, ` · ${fecha(e.creada)}${e.editada ? ' · editado' : ''}`), e.borrador ? h('span.escribiendo', {}, ' ✎ escribiendo…') : null),
        h('div.cr-texto', {}, e.texto || '…'),
        !e.borrador && (mia || dm) && h('div.cr-acciones', {},
          mia && h('button.btn.peq', { onclick: () => { editando = e.id; pintarLista(); } }, 'Editar'),
          h('button.btn.peq', { onclick: () => borrar(e) }, 'Borrar')),
      );
    }) : [h('p.vacio', {}, 'La historia aún no ha comenzado. ¡Escribe la primera página!')]).filter(Boolean));
  };

  function editorEntrada(e) {
    const ta = h('textarea', { rows: 5, value: e.texto });
    return h('article.cr-entrada.editando', {}, ta, h('div.cr-acciones', {},
      h('button.btn.peq', { onclick: () => { editando = null; pintarLista(); } }, 'Cancelar'),
      h('button.btn.peq.rojo', { onclick: async () => { await escribirEnSub(p.id, 'cronica', e.id, { texto: ta.value, editada: Date.now() }); editando = null; } }, 'Guardar')));
  }

  async function borrar(e) {
    if (await confirmar('Borrar', '¿Borrar esta entrada de la crónica?', 'Borrar')) await borrarEnSub(p.id, 'cronica', e.id);
  }

  const pintarEscribir = () => {
    if (!puedeEscribirCronica(p)) { zonaEscribir.replaceChildren(h('p.ayuda', {}, 'Solo el DM y los jugadores que él elija pueden escribir la crónica. Tú la ves en directo.')); return; }
    const propio = entradas.find((e) => e.id === borradorId) || entradas.find((e) => e.autor === uid && e.borrador);
    if (propio) borradorId = propio.id;
    const ta = h('textarea', { rows: 5, placeholder: 'Escribe lo que ha pasado… Los demás lo verán mientras escribes.', value: propio?.texto || '',
      oninput: () => {
        clearTimeout(temporizador);
        temporizador = setTimeout(async () => {
          const texto = ta.value;
          if (!borradorId) { if (!texto.trim()) return; borradorId = await crearEnSub(p.id, 'cronica', { autor: uid, texto, creada: Date.now(), borrador: true }); }
          else await escribirEnSub(p.id, 'cronica', borradorId, { texto });
        }, 600);
      } });
    zonaEscribir.replaceChildren(
      ta,
      h('div.acciones', {},
        h('button.btn.rojo', { onclick: async () => {
          clearTimeout(temporizador);
          if (!ta.value.trim()) return toast('Escribe algo primero.');
          if (borradorId) await escribirEnSub(p.id, 'cronica', borradorId, { texto: ta.value, borrador: false, creada: Date.now() });
          else await crearEnSub(p.id, 'cronica', { autor: uid, texto: ta.value, creada: Date.now(), borrador: false });
          borradorId = null; ta.value = '';
        } }, '✒ Publicar'),
        borradorId && h('button.btn', { onclick: async () => { clearTimeout(temporizador); await borrarEnSub(p.id, 'cronica', borradorId); borradorId = null; ta.value = ''; } }, 'Descartar'),
        h('button.btn', { onclick: async () => {
          const n = entradas.filter((e) => e.tipo === 'sesion').length + 1;
          await crearEnSub(p.id, 'cronica', { autor: uid, tipo: 'sesion', texto: `Sesión ${n} — ${new Date().toLocaleDateString('es-ES', { dateStyle: 'long' })}`, creada: Date.now() });
        } }, '❧ Nueva sesión'),
      ),
    );
    setTimeout(() => { if (document.activeElement === document.body) { /* no forzar el teclado en el móvil */ } }, 0);
  };

  const permisos = dm ? h('details.panel-reglas', {}, h('summary', {}, h('h3', {}, 'Quién puede escribir'), h('small', {}, 'Tú siempre puedes. Marca a los jugadores que también pueden.')),
    h('div.chips', {}, p.miembros.filter((m) => m !== p.dm).map((m) => {
      const on = (p.escritores || []).includes(m);
      return h('button.chip' + (on ? '.sel' : ''), { onclick: async () => {
        await actualizarPartida(p.id, { escritores: on ? (p.escritores || []).filter((x) => x !== m) : [...(p.escritores || []), m] });
      } }, nombreDe(p, m));
    })), p.miembros.length < 2 ? h('p.peq', {}, 'Aún no se ha unido ningún jugador.') : null) : null;

  cont.replaceChildren(h('section.cronica', {},
    permisos,
    lista,
    zonaEscribir,
    h('button.btn.peq', { onclick: () => {
      const txt = [...entradas].filter((e) => !e.borrador).sort((a, b) => a.creada - b.creada)
        .map((e) => (e.tipo === 'sesion' ? `\n## ${e.texto}\n` : `**${nombreDe(p, e.autor)}** (${fecha(e.creada)}):\n${e.texto}\n`)).join('\n');
      descargar(`Cronica - ${p.nombre}.md`, `# ${p.nombre}\n${txt}`, 'text/markdown');
    } }, '⬇ Descargar la crónica'),
  ));

  let primera = true;
  const fin = escucharSub(p.id, 'cronica', (docs, error) => {
    if (error) { lista.replaceChildren(h('p.ayuda.mal', {}, 'No se puede leer la crónica. ¿Has publicado las reglas nuevas de Firestore?')); return; }
    entradas = docs || [];
    pintarLista();
    if (primera) { pintarEscribir(); primera = false; }
    else if (!zonaEscribir.contains(document.activeElement)) pintarEscribir();
  });
  alSalir(() => { fin(); clearTimeout(temporizador); });
}
