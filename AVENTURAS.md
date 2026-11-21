# Aventuras para el DM

En **Partidas → 📜 Mis aventuras** (o en la pestaña **📜 Aventura** de una partida, solo para el DM) se importa el guion de una aventura: un archivo `.json` con escenas, secretos, personajes, pistas, combates, reloj y mapas.

Las aventuras se guardan **solo en el dispositivo del DM** (IndexedDB) y nunca se suben a la partida, así que los jugadores no pueden ver los secretos. El progreso (escena actual, pistas encontradas y estado del reloj) también se guarda en el dispositivo. Desde el menú **⋯** se puede exportar la aventura como copia de seguridad o reiniciar el progreso.

## Formato

```json
{
  "formato": "senda-aventura",
  "v": 1,
  "id": "mi-aventura",
  "titulo": "Título",
  "subtitulo": "Una línea de presentación",
  "nivel": "4",
  "jugadores": "4–5",
  "duracion": "3–4 horas",
  "reglas": "D&D 2024",
  "escenas": [],
  "secretos": [],
  "pnj": [],
  "pistas": [],
  "enemigos": [],
  "combates": [],
  "reloj": null,
  "mapas": []
}
```

Solo son obligatorios `formato`, `titulo` y al menos una escena. Si dos archivos tienen el mismo `id`, el segundo reemplaza al primero (útil para actualizar una aventura sin perder el progreso).

### Escenas y secretos

```json
{ "id": "E1", "codigo": "E1", "titulo": "La subida", "duracion": "20 min", "resumen": "Qué pasa y para qué sirve la escena.", "bloques": [] }
```

Los secretos tienen la misma forma (`codigo` como `DM-1`, `titulo` y `bloques`).

### Bloques

| `t` | Campos | Se ve como |
| --- | --- | --- |
| `h` | `texto` | Subtítulo |
| `p` | `texto` | Párrafo |
| `leer` | `texto` | Texto para leer en voz alta (con botón «✒ A la crónica» dentro de una partida) |
| `si` | `cond`, `texto` | Opción: «SI cond…» |
| `dialogo` | `quien`, `texto` | Lo que dice un personaje |
| `nota` | `texto` | Consejo para el DM |
| `lista` | `items`, `num` | Lista (numerada si `num` es `true`) |
| `tabla` | `cab`, `filas` | Tabla |
| `pista` | `codigo`, `n`, `prueba`, `leer`, `texto` | Pista con casilla «encontrada» |
| `reloj` | `delta`, `texto` | Aviso para cambiar el reloj (p. ej. `-1`) |
| `combate` | `ref` | Resumen de un combate con botón para abrirlo |
| `mapa` | `ref` | Miniatura de un mapa |
| `ir` | `a`, `texto` | Botón para ir a otra escena |

En cualquier `texto` se puede usar `**negrita**`, `*cursiva*`, saltos de línea (`\n`; dos seguidos separan párrafos) y enlaces:

- `[[E3]]` → escena con ese código
- `[[DM-4]]` → secreto con ese código
- `[[P7]]` → pista (abre su ficha y permite marcarla)
- `[[PNJ:Bastián]]` → ficha de un personaje (por `id` o por nombre)
- `[[C:refugio]]` → combate
- `[[M:aldea]]` → mapa

### Personajes (`pnj`)

```json
{
  "id": "bastian", "n": "Bastián Querol", "rol": "Semielfo, agrimensor",
  "aspecto": "…", "voz": "…", "quiere": "…", "oculta": "…", "cuenta": "…", "frase": "…",
  "estad": {
    "ca": 14, "pg": 45, "vel": "9 m", "ini": "+2", "vd": "2 (450 PX)",
    "car": { "FUE": "12 (+1)", "DES": "15 (+2)" },
    "lineas": ["Habilidades: Engaño +7…"],
    "acciones": ["**Jalón.** +5 al ataque, 1d8 + 3 contundente."]
  },
  "texto": "Notas libres"
}
```

### Pistas

```json
{ "codigo": "P7", "n": "Nota «Preguntar al Medidor»", "donde": "E2, cofre", "demuestra": "…", "siFallan": "…" }
```

### Enemigos y combates

Los `enemigos` son el catálogo que se manda a la iniciativa de la partida (`bon` es el bonificador de iniciativa; `oculto` los esconde a los jugadores; `ficha` enlaza con un `pnj`):

```json
{ "id": "hombre_grajo", "n": "Hombre del Grajo", "tipo": "enemigo", "bon": 2, "pg": 22, "ca": 13, "notas": "Espada corta +4 (1d6+2)", "oculto": false, "ficha": "hombre_grajo" }
```

Cada combate indica qué enemigos entran y cuántos. Dentro de una partida, el DM (o quien gestione la iniciativa) puede pulsar «⚔ Añadir a la iniciativa» o «💾 Guardar en la partida».

```json
{ "id": "refugio", "n": "El refugio del Collado", "escena": "E5", "px": 850, "dificultad": "Baja-moderada", "enemigos": [{ "ref": "la_rossa", "c": 1 }, { "ref": "contrabandista", "c": 4 }], "notas": "…", "bloques": [] }
```

### Reloj

Un contador de algo que se agota durante la aventura (antorchas, días, lumbres…). `umbral` marca el número a partir del cual pasa algo grave.

```json
{ "n": "Lumbres", "umbral": 6, "texto": "Explicación", "items": [{ "n": "Casa Sansó", "on": false }, { "n": "Casa Garrocha", "on": true }] }
```

### Mapas

`img` puede ser una imagen incrustada (`data:image/jpeg;base64,…`) o una dirección web. `soloDM` indica si el mapa tiene información que los jugadores no deben ver.

```json
{ "id": "aldea", "n": "La aldea", "img": "data:image/jpeg;base64,…", "soloDM": false, "nota": "Úsalo en E1 y E3" }
```
