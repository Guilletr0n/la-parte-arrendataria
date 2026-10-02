import { marked } from 'marked';

/**
 * Renderizador editorial para artículos de "La Parte Arrendataria".
 * Soporta Markdown estándar y bloques de despiece / aside flotantes:
 *
 * Ejemplo de sintaxis en Markdown:
 *
 * > [!DESTACADO] TITULAR DEL DESTACADO
 * > Texto del aviso o recordatorio legal para las inquilinas.
 * > Segunda línea de contenido.
 */
export function renderArticleMarkdown(rawContent: string): string {
  if (!rawContent) return '';

  // 1. Normalizar saltos de línea (CRLF y CR a LF)
  const content = rawContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // 2. Procesar callouts de tipo [!DESTACADO], [!AVISO], [!ASIDE], [!ALERTA], [!NOTA]
  // Funciona con "> [!DESTACADO]", "[!DESTACADO]", con o sin ">" en las líneas de texto,
  // con o sin titular, y admite múltiples destacados independientes en el mismo artículo.
  const lines = content.split('\n');
  const output: string[] = [];
  let inAside = false;
  let asideTag = '';
  let asideTitle = '';
  let asideLines: string[] = [];

  function flushAside() {
    if (!inAside) return;
    // El usuario requiere sólo el texto del destacado, sin titular ni badge
    let linesToRender = asideLines.map(l => l.replace(/^[ \t]*>[ \t]?/, ''));
    if (linesToRender.length === 0 && asideTitle.trim()) {
      linesToRender = [asideTitle.trim().replace(/^[ \t]*>[ \t]?/, '')];
    }
    const cleanBody = linesToRender.join('\n').trim();
    if (cleanBody) {
      const renderedBody = marked.parse(cleanBody);
      output.push(`<aside class="editorial-aside">
  <div class="editorial-aside-content">
    ${renderedBody}
  </div>
</aside>\n`);
    }
    inAside = false;
    asideTag = '';
    asideTitle = '';
    asideLines = [];
  }

  const calloutStartRegex = /^[ \t]*>?[ \t]*(?:#+[ \t]*)?(?:\*{1,2}|_{1,2})?\[!(DESTACADO|AVISO|ASIDE|ALERTA|NOTA)\](?:\*{1,2}|_{1,2})?[: \t]*(.*)$/i;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(calloutStartRegex);

    if (match) {
      if (inAside) flushAside();
      inAside = true;
      asideTag = match[1];
      asideTitle = match[2];
      continue;
    }

    if (inAside) {
      if (line.match(/^[ \t]*>/)) {
        asideLines.push(line.replace(/^[ \t]*>[ \t]?/, ''));
      } else if (line.trim() === '') {
        // Línea en blanco: verificar si la siguiente línea continúa con ">"
        if (i + 1 < lines.length && lines[i + 1].match(/^[ \t]*>/)) {
          asideLines.push('');
        } else {
          // Fin del bloque destacado
          flushAside();
          output.push(line);
        }
      } else {
        // Línea de texto dentro del bloque destacado
        asideLines.push(line);
      }
    } else {
      output.push(line);
    }
  }

  if (inAside) flushAside();

  return marked.parse(output.join('\n')) as string;
}
