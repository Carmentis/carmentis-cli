"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VersionSubCommand = void 0;
class VersionSubCommand {
    static register(program) {
        program
            .command("version")
            .action(() => {
        });
    }
}
exports.VersionSubCommand = VersionSubCommand;
