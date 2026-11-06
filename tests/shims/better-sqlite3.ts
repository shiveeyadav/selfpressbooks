// TEST-ONLY stand-in for better-sqlite3 built on Node's built-in node:sqlite,
// so the data layer can be exercised where npm packages cannot be installed.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { DatabaseSync } = require('node:sqlite');

class Db {
  private db: any;
  private depth = 0;
  constructor(path: string) { this.db = new DatabaseSync(path); }
  prepare(sql: string) {
    const st = this.db.prepare(sql);
    const fix = (a: any[]) => a;
    return {
      run: (...a: any[]) => st.run(...fix(a)),
      get: (...a: any[]) => st.get(...fix(a)),
      all: (...a: any[]) => st.all(...fix(a)),
    };
  }
  exec(sql: string) { this.db.exec(sql); }
  pragma(s: string) { return this.db.prepare(`PRAGMA ${s}`).all(); }
  transaction<T extends (...a: any[]) => any>(fn: T): T {
    return ((...args: any[]) => {
      const sp = `sp${this.depth++}`;
      this.db.exec(`SAVEPOINT ${sp}`);
      try {
        const r = fn(...args);
        this.db.exec(`RELEASE ${sp}`);
        return r;
      } catch (e) {
        this.db.exec(`ROLLBACK TO ${sp}`);
        this.db.exec(`RELEASE ${sp}`);
        throw e;
      } finally {
        this.depth--;
      }
    }) as T;
  }
  close() { this.db.close(); }
}
export default Db;
