# Tesserae

[Read in English](README.md)

Un juego de cartas coleccionables libre y de código abierto que funciona en el navegador. Dioses,
héroes y monstruos de las mitologías antiguas comparten un mismo cielo nocturno: colecciónalos como
cartas, hazlos crecer y llévalos a combates automáticos por turnos.

- Gratis. Todo se gana jugando. No hay compras de ningún tipo.
- Sin conexión. Sin servidor, sin analíticas, sin cookies, sin peticiones de red. Tu progreso vive
  en tu navegador y puedes exportarlo a un archivo.
- Abierto. Código bajo licencia MIT. El contenido de las cartas se basa en mitos de dominio
  público, contados con palabras propias y con la fuente clásica citada en cada carta.
- Disponible en inglés y español. Se pueden añadir más idiomas solo con archivos de traducción.

Juega en <https://3vynia.github.io/tesserae/>.

## Estado

Jugable: colección, invocación con probabilidades visibles, misiones diarias y combates
automáticos con campaña, torre y jefes. Consulta [ROADMAP.md](ROADMAP.md) para ver lo hecho y lo pendiente, y
[docs/decisions.md](docs/decisions.md) para las razones detrás de las decisiones técnicas y de
contenido (en inglés).

## Desarrollo

Requiere Node.js 22.18 o superior.

```sh
npm install
npm run dev          # servidor de desarrollo
npm run verify       # lint, tipos, traducciones, tests unitarios y build
npm run test:e2e     # prueba de humo con Playwright (ejecuta `npx playwright install chromium` una vez)
```

## Traducciones

El inglés (`src/locales/en`) es la fuente de verdad. Para añadir un idioma, copia esa carpeta a
`src/locales/<código>` y traduce los valores. `npm run i18n:check` falla si faltan claves, si hay
claves huérfanas, sintaxis ICU rota o marcadores que no coinciden. Más detalles en
[CONTRIBUTING.md](CONTRIBUTING.md).

## Apoyo

El juego es y seguirá siendo gratis. Si en el futuro se añade un enlace de donación aparecerá aquí,
y nunca desbloqueará nada dentro del juego.

## Licencia

Código: [MIT](LICENSE). Los mitos son de dominio público; los textos de las cartas de este
repositorio son resúmenes originales publicados bajo la misma licencia.
