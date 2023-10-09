export declare class MemberList {
    #private;
    constructor(file: string);
    get list(): string[];
    get name(): string;
    add(rJid: string): void;
    pop(): string | undefined;
    saveList(): void;
    replace(file: string): void;
}
//# sourceMappingURL=MemberList.d.ts.map