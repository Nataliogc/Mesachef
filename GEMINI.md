# Reglas de Desarrollo del Proyecto MesaChef

## Control de Versiones por Módulo
Cada vez que se realice una modificación en cualquier módulo del sistema (código fuente, HTML, JS, CSS o interfaz):
1. **Incrementar la versión** del módulo afectado según el tipo de cambio (patch para correcciones, minor para nuevas funciones, major para cambios disruptivos).
2. **Actualizar la fecha de modificación** a la fecha actual.
3. **Actualizar el archivo [REGISTRO_VERSIONES.md](REGISTRO_VERSIONES.md)** reflejando la nueva versión, la fecha y el resumen de lo modificado en el historial.
4. Si el archivo HTML del módulo muestra una etiqueta de versión en pantalla (por ejemplo `Matrix vX.Y`), reflejar el cambio también en la interfaz visual.
