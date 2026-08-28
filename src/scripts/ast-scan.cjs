const {parse} = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const fs = require('fs');
const path = require('path');

function getFiles(dir) {
  const files = [];
  try {
    fs.readdirSync(dir, {withFileTypes:true}).forEach(f => {
      const full = path.join(dir, f.name);
      if (f.isDirectory() && !f.name.includes('node_modules') && !f.name.includes('backups'))
        files.push(...getFiles(full));
      else if (f.name.endsWith('.jsx') || f.name.endsWith('.js'))
        files.push(full);
    });
  } catch(e) {}
  return files;
}

const files = getFiles('src').filter(f =>
  !f.includes('i18n/') && !f.includes('.bak')
);

const bugs = [];
files.forEach(file => {
  try {
    const code = fs.readFileSync(file, 'utf8');
    if (!code.includes('t(')) return;
    const ast = parse(code, {
      sourceType:'module',
      plugins:['jsx','optionalChaining','nullishCoalescingOperator']
    });
    traverse(ast, {
      CallExpression(p) {
        const {callee} = p.node;
        if (callee.type==='Identifier' && callee.name==='t') {
          if (!p.scope.getBinding('t')) {
            bugs.push(file.replace(process.cwd()+'/','')+':'+p.node.loc.start.line);
          }
        }
      }
    });
  } catch(e) {}
});

if (bugs.length > 0) {
  console.error('\n❌ AST-SCAN FEHLER — t() ohne Binding gefunden:');
  bugs.forEach(b => console.error(' ', b));
  console.error('\nCommit abgebrochen. Bitte fixen bevor du pushst.\n');
  process.exit(1);
}

console.log('✅ AST-Scan: 0 Bugs — Commit erlaubt.');
process.exit(0);
