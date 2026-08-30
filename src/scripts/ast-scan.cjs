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


// ═══ NEU: t={t} als Prop erkennen (REGEL ab 2026-08-30) ═══
// Jede Komponente die t() nutzt muss eigenen useTranslation() Hook haben.
// t als Prop weiterzureichen ist VERBOTEN — führt zu undefined-t-Crashes.
const propBugs = [];
files.forEach(file => {
  try {
    const code = fs.readFileSync(file, 'utf8');
    // Skip .map(t => ...) patterns — das sind Talent/Toast Variablen, nicht Translation
    if (!code.includes('t={t}') && !code.includes('t={t ')) return;
    const ast = parse(code, {
      sourceType:'module',
      plugins:['jsx','optionalChaining','nullishCoalescingOperator']
    });
    traverse(ast, {
      JSXAttribute(p) {
        if (p.node.name.name === 't' && p.node.value) {
          // Prüfe ob value ein {Identifier t} Expression ist
          const val = p.node.value;
          if (val.type === 'JSXExpressionContainer' &&
              val.expression.type === 'Identifier' &&
              val.expression.name === 't') {
            // Prüfe ob Parent ein .map((t,...) => ...) ist — dann ist t ein Loop-Item
            let isInMap = false;
            let parent = p.parentPath;
            while (parent) {
              if (parent.isArrowFunctionExpression() || parent.isFunctionExpression()) {
                const params = parent.node.params;
                if (params && params.length > 0) {
                  for (const param of params) {
                    if (param.type === 'Identifier' && param.name === 't') {
                      isInMap = true;
                      break;
                    }
                  }
                }
                if (isInMap) break;
              }
              parent = parent.parentPath;
            }
            if (!isInMap) {
              propBugs.push(file.replace(process.cwd()+'/','')+':'+p.node.loc.start.line);
            }
          }
        }
      }
    });
  } catch(e) {}
});

if (propBugs.length > 0) {
  console.error('\n❌ AST-SCAN FEHLER — t als Prop weitergereicht (verboten seit 2026-08-30):');
  console.error('   Regel: Jede Komponente die t() nutzt braucht eigenen useTranslation() Hook.');
  console.error('   FALSCH: <ChildComp t={t} />');
  console.error('   RICHTIG: function ChildComp() { const { t } = useTranslation(); ... }');
  propBugs.forEach(b => console.error(' ', b));
  console.error('\nCommit abgebrochen. Bitte fixen bevor du pushst.\n');
  process.exit(1);
}

console.log('✅ AST-Scan: 0 Bugs — Commit erlaubt.');
process.exit(0);
