"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlreadyConfiguredError = void 0;
class AlreadyConfiguredError extends Error {
    constructor(message) {
        super(message);
        this.name = "AlreadyConfigured";
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, AlreadyConfiguredError);
        }
    }
}
exports.AlreadyConfiguredError = AlreadyConfiguredError;
