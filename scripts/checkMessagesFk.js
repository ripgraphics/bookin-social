const { Client } = require('pg');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

(async () => {
  const client = new Client({ connectionString: process.env.DIRECT_URL });
  await client.connect();
  
  const result = await client.query(`
    SELECT conname, pg_get_constraintdef(oid) 
    FROM pg_constraint 
    WHERE conrelid = 'public.messages'::regclass AND contype = 'f'
  `);
  
  console.log('Foreign keys on messages table:');
  console.log(JSON.stringify(result.rows, null, 2));
  
  await client.end();
})();

