import fs from 'fs';


/*
 *ATENÇÃO:
 * essa funcionalidade está em desenvolvimento.
 *
 */


/*
 * Sistema de gestao de membros.
 *
 */
export class MemberList {
  #list!: string[];
  #name!: string;

  constructor(file: string) {
    
    fs.readFile(file, 'utf-8', (err, buf) => {
      setTimeout(() => {
      if (err) throw err;
      this.#list = buf.split("\n").filter(x => /\d+\@s\.whatsapp\.net/.test(x));
    }, 500)
    });
    this.#name = file;
  }
  
  get list() {
    return Array.from(this.#list)
  }

  get name() {
    return this.#name;
  }

  add(rJid: string): void {
    if (!this.#list) return;

    if (/\d+\@s\.whatsapp\.net/.test(rJid)) {
      this.#list.push(rJid);
    } else {
      throw new TypeError(`${rJid} is not a valid jid!`);
    }
  }

  pop(): string | undefined {
    return this.#list.pop();
  }

  saveList(): void {
    fs.writeFile(this.#name, this.#list.join("\n"), err => {
      if (err) throw err;

    }); 
  }

  replace(file: string): void {
    fs.readFile(file, 'utf-8', (err, buf) => {
      setTimeout(() => {
        if (err) throw err;

        this.#list = buf.split("\n").filter(x => /\d+\@s\.whatsapp\.net/.test(x));
      }, 500);
    })
    this.#name = file;
  }
}
