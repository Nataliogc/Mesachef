(function (root) {
  'use strict';

  const NEXUS_TAG_RE = /\[Nexus\s+Groups\]/i;
  const NEXUS_STRUCTURED_RE = /\[Nexus\s+Groups\][^\r\n]*?\|[\t ]*Pax:[\t ]*\d+/gi;
  const NEXUS_FALLBACK_RE = /\[Nexus\s+Groups\][^\r\n]*/gi;

  /**
   * Elimina la etiqueta automática de metadatos `[Nexus Groups] ...` de una nota
   * de texto para su impresión, preservando las observaciones reales del evento.
   */
  function stripNexusGroupsMetadata(notes) {
    if (typeof notes !== 'string') return '';
    if (!NEXUS_TAG_RE.test(notes)) return notes.trim();

    const cleanedLines = notes
      .split(/\r?\n/)
      .map((line) => {
        if (!NEXUS_TAG_RE.test(line)) return line.trim();

        let cleaned = line
          .replace(NEXUS_STRUCTURED_RE, ' ')
          .replace(NEXUS_FALLBACK_RE, ' ');

        cleaned = cleaned
          .replace(/[ \t]{2,}/g, ' ')
          .replace(/[ \t]*[|·\-–—][ \t]*\|[ \t]*/g, ' | ')
          .replace(/\s*\|\s*(?:\|\s*)+/g, ' | ')
          .replace(/^[ \t|·\-–—]+|[ \t|·\-–—]+$/g, '')
          .trim();

        return cleaned;
      })
      .filter(Boolean);

    return cleanedLines.join('\n');
  }

  const api = { stripNexusGroupsMetadata };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.PrintNotes = api;
})(typeof window !== 'undefined' ? window : globalThis);
