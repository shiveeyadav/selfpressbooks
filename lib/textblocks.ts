/** Parses the simple content format into blocks (no HTML is ever injected). */
export type Block =
  | { kind: 'h2'; text: string }
  | { kind: 'p'; text: string }
  | { kind: 'ul'; items: string[] };

export function parseBlocks(text: string): Block[] {
  const blocks: Block[] = [];
  for (const chunk of text.replace(/\r\n/g, '\n').split(/\n{2,}/)) {
    const lines = chunk.split('\n').map((l) => l.trim()).filter(Boolean);
    let para: string[] = [];
    let list: string[] = [];
    const flush = () => {
      if (para.length) blocks.push({ kind: 'p', text: para.join(' ') });
      if (list.length) blocks.push({ kind: 'ul', items: list });
      para = [];
      list = [];
    };
    for (const line of lines) {
      if (line.startsWith('## ')) {
        flush();
        blocks.push({ kind: 'h2', text: line.slice(3) });
      } else if (line.startsWith('- ')) {
        if (para.length) { blocks.push({ kind: 'p', text: para.join(' ') }); para = []; }
        list.push(line.slice(2));
      } else {
        if (list.length) { blocks.push({ kind: 'ul', items: list }); list = []; }
        para.push(line);
      }
    }
    flush();
  }
  return blocks;
}
