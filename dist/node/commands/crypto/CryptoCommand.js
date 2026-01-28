"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CryptoCommand = void 0;
const GenCommand_1 = require("./gen/GenCommand");
class CryptoCommand {
    constructor() {
    }
    static register(program) {
        const crypto = program
            .command('crypto')
            .description('Crypto utility');
        GenCommand_1.GenCommand.register(crypto);
    }
}
exports.CryptoCommand = CryptoCommand;
