const fs = require('fs');

function splitSqlRespectingDollar(sql) {
  const statements = [];
  let current = '';
  let inDollar = false;
  let i = 0;
  while (i < sql.length) {
    if (sql[i] === '$' && sql[i + 1] === '$') {
      inDollar = !inDollar;
      current += '$$';
      i += 2;
      continue;
    }
    const ch = sql[i];
    if (ch === ';' && !inDollar) {
      const stmt = current.trim();
      if (stmt && !stmt.startsWith('--')) {
        statements.push(stmt);
      }
      current = '';
      i++;
      continue;
    }
    current += ch;
    i++;
  }
  const tail = current.trim();
  if (tail) statements.push(tail);
  return statements;
}

const sql = fs.readFileSync('supabase/migrations/0029_optimize_permissions_rpc.sql', 'utf8');
const stmts = splitSqlRespectingDollar(sql);
console.log('Total statements:', stmts.length);
stmts.forEach((s, i) => {
  console.log(`\n${i+1}. ${s.substring(0, 100).replace(/\n/g, ' ')}...`);
});

