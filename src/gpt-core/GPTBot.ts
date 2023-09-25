


export interface GPTBot {  
  send(text: string): Promise<{role: string, content: string}>;
}
