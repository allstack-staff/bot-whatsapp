export class NoLogFileFromUserID extends Error {
  constructor(message: string){
    super(message)
    this.message,
    this.name = 'NoLogFileFromUserID'
  }
}