export declare class MemberList {
    #private;
    constructor(file: string);
    get list(): string[];
    get name(): string;
    add(rJid: string): void;
    pop(): string | undefined;
    rm(rJid: string): void;
    saveMembersList(): void;
    replace(file: string): void;
    copy(): MemberList;
}
//# sourceMappingURL=MemberList.d.ts.map