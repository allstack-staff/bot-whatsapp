import fs from "fs";

/*
 *ATENÇÃO:
 * essa funcionalidade está em testes.
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
    this.#name = file;
    this.#mount(file);
  }

  #mount(file: string): void {
    this.#list = fs.readFileSync(file, 'utf8').split("\n").filter(x => /\d+\@s\.whatsapp\.net/.test(x));
    this.#list = this.#list.filter((x, idx) => this.#list.indexOf(x) === idx)
  }
  get list() {
    return Array.from(this.#list);
  }

  get name() {
    return this.#name;
  }

  add(rJid: string): void {
    if (!this.#list) return;

    if (/\d+\@s\.whatsapp\.net/.test(rJid)) {
      if (!(this.#list.includes(rJid)))
        this.#list.push(rJid);
    }
  }

  pop(): string | undefined {
    return this.#list.pop();
  }

  rm(rJid: string): void {
    if (/\d+\@s\.whatsapp\.net/.test(rJid)) {
        const index = this.#list.indexOf(rJid);
        if (index === -1) {
          throw new RangeError("indice invalido!");
        }

        this.#list.splice(index);
    } 
  }

  saveMembersList(): void {
    fs.writeFileSync(this.#name, this.#list.join("\n"));
  }

  replace(file: string): void {
    this.#mount(file);
    this.#name = file;
  }

  copy(): MemberList {
    return new MemberList(this.#name);
  }
}
