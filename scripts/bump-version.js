/**
 * MesaChef Version Bumper
 * Actualiza automáticamente la versión en:
 * - package.json
 * - REGISTRO_VERSIONES.md
 * - Todas las interfaces HTML con badges 'Matrix vX.Y.Z'
 * - MANUAL_USUARIO.md
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const pkgPath = path.join(rootDir, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

const type = process.argv[2] || 'patch'; // patch, minor, major
const description = process.argv[3] || 'Mejora general del sistema';
const modules = process.argv[4] || 'Varios módulos';

// Calcular nueva versión
const parts = pkg.version.split('.').map(Number);
if (type === 'major') {
    parts[0] += 1;
    parts[1] = 0;
    parts[2] = 0;
} else if (type === 'minor') {
    parts[1] += 1;
    parts[2] = 0;
} else {
    parts[2] += 1;
}

const oldVersion = pkg.version;
const newVersion = parts.join('.');
const today = new Date();
const dateStr = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;

console.log(`Actualizando versión: ${oldVersion} -> ${newVersion} (${dateStr})`);

// 1. Actualizar package.json
pkg.version = newVersion;
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 4) + '\n', 'utf8');

// 2. Archivos HTML a sincronizar
const htmlFiles = [
    'admin.html',
    'restaurante.html',
    'salones.html',
    'grandes-eventos.html',
    'presupuestos.html',
    'index.html',
    'ayuda.html'
];

htmlFiles.forEach(file => {
    const fullPath = path.join(rootDir, file);
    if (!fs.existsSync(fullPath)) return;
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Reemplazos genéricos
    content = content.replace(new RegExp(`Matrix v${oldVersion}`, 'g'), `Matrix v${newVersion}`);
    content = content.replace(new RegExp(`v${oldVersion} MesaChef Matrix`, 'g'), `v${newVersion} MesaChef Matrix`);
    content = content.replace(new RegExp(`Versión Interna v${oldVersion}`, 'g'), `Versión Interna v${newVersion}`);
    content = content.replace(new RegExp(`version-pill">v${oldVersion}`, 'g'), `version-pill">v${newVersion}`);
    
    fs.writeFileSync(fullPath, content, 'utf8');
});

// 3. MANUAL_USUARIO.md
const manualPath = path.join(rootDir, 'MANUAL_USUARIO.md');
if (fs.existsSync(manualPath)) {
    let manual = fs.readFileSync(manualPath, 'utf8');
    manual = manual.replace(new RegExp(`Matrix v${oldVersion}`, 'g'), `Matrix v${newVersion}`);
    manual = manual.replace(new RegExp(`Documento:\\*\\* ${oldVersion}`, 'g'), `Documento:** ${newVersion}`);
    fs.writeFileSync(manualPath, manual, 'utf8');
}

// 4. REGISTRO_VERSIONES.md
const regPath = path.join(rootDir, 'REGISTRO_VERSIONES.md');
if (fs.existsSync(regPath)) {
    let reg = fs.readFileSync(regPath, 'utf8');
    
    // Actualizar bloque de versión actual
    reg = reg.replace(/- \*\*Versión:\*\* `v[^`]+`/, '- **Versión:** `v' + newVersion + '`');
    reg = reg.replace(/- \*\*Última Actualización:\*\* [^\r\n]+/, '- **Última Actualización:** ' + dateStr);
    
    // Entrada de historial
    const newEntry = `### [v${newVersion}] - ${dateStr}\n- **Módulos:** ${modules}\n- **Tipo de cambio:** ${type.toUpperCase()}\n- **Descripción:**\n  - ${description}\n\n`;
    
    reg = reg.replace('## 📝 Historial de Versiones\n\n', `## 📝 Historial de Versiones\n\n${newEntry}`);
    fs.writeFileSync(regPath, reg, 'utf8');
}

console.log(`¡Versión v${newVersion} actualizada correctamente en todo el sistema!`);
