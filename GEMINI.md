# Reglas de Desarrollo del Proyecto MesaChef

## Control de Versión Única Global
Existe **una sola versión global para todo el sistema MesaChef**, no versiones independientes por módulo.

Cada vez que se realice cualquier modificación en cualquier módulo, archivo o componente del sistema (HTML, JS, CSS, backend o interfaz):
1. **Incrementar la versión global del sistema** según el tipo de cambio:
   - *Patch* (`10.0.X`): Correcciones de errores o ajustes menores.
   - *Minor* (`10.X.0`): Nuevas funcionalidades o mejoras operativas.
   - *Major* (`X.0.0`): Cambios estructurales o disruptivos.
2. **Actualizar la fecha** a la fecha actual (DD/MM/AAAA).
3. **Actualizar el archivo [REGISTRO_VERSIONES.md](REGISTRO_VERSIONES.md)** con:
   - La nueva versión global.
   - La fecha de actualización.
   - El módulo o módulos intervenidos.
   - El resumen detallado de lo modificado en el historial.
4. **Sincronizar la versión** en `package.json` y en las etiquetas de versión visibles de la interfaz HTML (por ejemplo `Matrix vX.Y.Z`).
