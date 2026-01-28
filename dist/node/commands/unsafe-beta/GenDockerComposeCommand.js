"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GenDockerComposeCommand = void 0;
const safeCommandRunner_1 = require("../safeCommandRunner");
const FileDownloader_1 = require("../../utils/FileDownloader");
const node_path_1 = __importDefault(require("node:path"));
class GenDockerComposeCommand {
    static register(program) {
        program
            .command('gen-docker-compose')
            .description('Download the docker-compose file for the node')
            .action(async () => {
            await safeCommandRunner_1.SafeCommandRunner.safeRun(async () => {
                const dockerComposePath = node_path_1.default.resolve('.', 'docker-compose.yml');
                await FileDownloader_1.FileDownloader.downloadAt("https://raw.githubusercontent.com/Carmentis/architectures/refs/heads/main/node/docker-compose-with-caddy.yml", dockerComposePath);
                console.log('Docker-compose file downloaded successfully at docker-compose.yml');
            });
        });
    }
}
exports.GenDockerComposeCommand = GenDockerComposeCommand;
