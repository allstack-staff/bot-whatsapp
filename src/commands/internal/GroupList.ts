import fs from 'fs';
import path from 'path';

export class GroupList {
    #list: string[] = [];
    #name: string;

    constructor(file: string) {
        this.#name = file;
        this.#mount(file);
    }

    #mount(file: string): void {
        const filePath = path.join(__dirname, 'groupwhitelist.txt');
        if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, '');
        }
        const raw = fs.readFileSync(file, 'utf8');
        const entries = raw.split('\n').filter(x => /\d+@g\.us/.test(x));
        this.#list = entries.filter((x, idx) => entries.indexOf(x) === idx);
    }

    get list(): string[] {
        return Array.from(this.#list);
    }

    get isEmpty(): boolean {
        return this.#list.length === 0;
    }

    has(jid: string): boolean {
        return this.#list.includes(jid);
    }

    add(jid: string): void {
        if (/\d+@g\.us/.test(jid) && !this.#list.includes(jid)) {
            this.#list.push(jid);
        }
    }

    remove(jid: string): void {
        this.#list = this.#list.filter(x => x !== jid);
    }

    save(): void {
        fs.writeFileSync(this.#name, this.#list.join('\n'));
    }
}
