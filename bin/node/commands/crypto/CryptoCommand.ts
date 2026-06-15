import commander from "commander";
import {GenCommand} from "./gen/GenCommand";
import {KeygenCommand} from "./KeygenCommand";

export class CryptoCommand {
    constructor() {
    }

    static register(program: commander.Command) {
        const crypto = program
            .command('crypto')
            .description('Crypto utility');

        GenCommand.register(crypto);
        KeygenCommand.register(crypto);
    }
}