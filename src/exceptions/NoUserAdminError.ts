export class NoUserAdminError extends Error {
  constructor(message: string) {
    super(message);
    this.name = `USUARIO_NAO_ADMIN`;
  }
}