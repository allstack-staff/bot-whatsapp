
export class AlreadyConfiguredError extends Error {
  constructor(message: string) {
    super(message);

    this.name = "AlreadyConfigured";

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AlreadyConfiguredError);
    }
   }
}
