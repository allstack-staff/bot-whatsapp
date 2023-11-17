export class SendDalleGenerateImage extends Error {
  constructor(message: string) {
    super(message)
    this.message
    this.name = "SendDalleGenerateImage"
  }
}