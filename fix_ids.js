const fs = require('fs');
let demo = fs.readFileSync('src/lib/demo-arg-eng.ts', 'utf8');

const idMap = {
  'arg-martinez': 'arg-emartinez',
  'arg-lisandromartinez': 'arg-martinez',
  'arg-lautaro': 'arg-lmartinez',
  'arg-macallister': 'arg-allister',
  'arg-depaul': 'arg-paul',
  'arg-enzo': 'arg-fernandez',
  'arg-locelso': 'arg-celso',
};

for (const [oldId, newId] of Object.entries(idMap)) {
  // Replace id: 'oldId'
  demo = demo.replace(new RegExp(`id:\\s*'${oldId}'`, 'g'), `id: '${newId}'`);
  // Replace playerId: 'oldId'
  demo = demo.replace(new RegExp(`playerId:\\s*'${oldId}'`, 'g'), `playerId: '${newId}'`);
}

fs.writeFileSync('src/lib/demo-arg-eng.ts', demo);
console.log('Fixed IDs in demo-arg-eng.ts');
