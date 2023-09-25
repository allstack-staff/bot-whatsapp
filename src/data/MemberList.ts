import fs from 'fs';


/*
 *ATENÇÃO:
 * essa funcionalidade está em desenvolvimento e tem erros, por tanto, não é pra ser usada agora.
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
      if (err) throw err;
      this.#list = buf.split("\n").filter(x => /\d+\@s\.whatsapp\.net/.test(x));
    })
    this.#name = file;
  }
  
  get list() {
    return this.#list ? Array.from(this.#list) : null;
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
    fs.writeFileSync(this.#name, this.#list.join("\n")); 
  }
}
