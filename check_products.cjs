const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/postgres' });
pool.query("SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='products'").then(r => { console.log(r.rows.map(x => x.column_name)); pool.end(); }).catch(e => { console.error(e); pool.end(); });
