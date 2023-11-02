export class ChatGptRequestError extends Error {
  code: string | number;
  constructor(message: string, code: string | number = 'CHATGPT_REQUEST_ERROR') {
    super(message);
    this.name = 'ChatGptRequestError';
    this.code = code;
  }
}