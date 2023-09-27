import fs from "fs";

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
    this.#name = file;
    this.#mount(file);
  }

  #mount(file: string): void {
    this.#list = fs.readFileSync(file, 'utf8').split("\n").filter(x => /\d+\@s\.whatsapp\.net/.test(x));
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
      this.#list.push(rJid);
    } else {
      throw new TypeError(`${rJid} is not a valid jid!`);
    }
  }

  pop(): string | undefined {
    return this.#list.pop();
  }

  saveMembersList(): void {
    fs.writeFileSync(this.#name, this.#list.join("\n"));
  }

  replace(file: string): void {
    this.#mount(file);
    this.#name = file;
  }
}
