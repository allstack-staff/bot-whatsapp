export class SendMessageError extends Error {
  constructor(message: string, FILE: string) {
    super(message);
    this.name = `ERROR_WHEN_TRYING_TO_SEND_THE_MESSAGE \n ${FILE}`;
  }
}