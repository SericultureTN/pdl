/** Adapts PostgreSQL query() to the sqlite-like interface used by MIS services. */
function toPgSql(sql, params = []) {
  let index = 0;
  const text = sql.replace(/\?/g, () => `$${++index}`);
  return { text, values: params };
}

export function createPgAdapter(queryFn) {
  return {
    async get(sql, params = []) {
      const { text, values } = toPgSql(sql, params);
      const result = await queryFn(text, values);
      return result.rows[0];
    },

    async all(sql, params = []) {
      const { text, values } = toPgSql(sql, params);
      const result = await queryFn(text, values);
      return result.rows;
    },

    async run(sql, params = []) {
      let { text, values } = toPgSql(sql, params);
      if (/^\s*INSERT\b/i.test(text) && !/\bRETURNING\b/i.test(text)) {
        text += ' RETURNING id';
      }
      const result = await queryFn(text, values);
      return {
        lastID: result.rows[0]?.id,
        changes: result.rowCount,
      };
    },

    async exec(sql) {
      await queryFn(sql);
    },
  };
}
