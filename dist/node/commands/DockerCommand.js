"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DockerCommand = void 0;
const safeCommandRunner_1 = require("./safeCommandRunner");
const dockerBinary_1 = require("../utils/dockerBinary");
class DockerCommand {
    constructor() {
    }
    register(program) {
        const docker = program
            .command('docker')
            .description('Docker utility');
        docker.command("down")
            .action(async () => {
            await safeCommandRunner_1.SafeCommandRunner.safeRun(async () => await dockerBinary_1.DockerBinary.runComposeDown());
        });
        docker.command("up")
            .action(async () => {
            await safeCommandRunner_1.SafeCommandRunner.safeRun(async () => await dockerBinary_1.DockerBinary.runComposeUp());
        });
        docker.command("logs")
            .action(async () => {
            await safeCommandRunner_1.SafeCommandRunner.safeRun(async () => await dockerBinary_1.DockerBinary.runComposeLogs());
        });
    }
}
exports.DockerCommand = DockerCommand;
