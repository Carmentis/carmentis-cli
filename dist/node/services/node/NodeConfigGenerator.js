"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodeConfigGenerator = void 0;
const CometBFTConfigGenerator_1 = require("../CometBFTConfigGenerator");
const path_1 = require("path");
const AbciConfigGenerator_1 = require("../AbciConfigGenerator");
const FileDownloader_1 = require("../../utils/FileDownloader");
const FileManager_1 = require("../../utils/FileManager");
class NodeConfigGenerator {
    constructor(params) {
        this.params = params;
    }
    async generateConfig() {
        // generate the cometbft config
        const cometBFTConfigGenerator = new CometBFTConfigGenerator_1.CometBFTConfigGenerator(this.params.cometbftConfig);
        const abciConfigGenerator = new AbciConfigGenerator_1.AbciConfigGenerator(this.params.abciConfig);
        await cometBFTConfigGenerator.generateConfig();
        await abciConfigGenerator.generateConfig();
        // download the Docker-compose
        if (this.params.shouldDownload.dockerCompose) {
            const dockerComposePath = (0, path_1.join)(this.params.home, 'docker-compose.yml');
            await FileDownloader_1.FileDownloader.downloadAt("https://raw.githubusercontent.com/Carmentis/architectures/refs/heads/main/node/docker-compose-with-caddy.yml", dockerComposePath);
        }
        // download the Caddyfile
        const shouldDownloadCaddyfile = this.params.shouldDownload.caddyFile;
        if (shouldDownloadCaddyfile) {
            const caddyfilePath = (0, path_1.join)(this.params.home, 'Caddyfile');
            await FileDownloader_1.FileDownloader.downloadAt("https://raw.githubusercontent.com/Carmentis/architectures/refs/heads/main/node/Caddyfile", caddyfilePath);
            await FileManager_1.FileManager.replaceInFile(caddyfilePath, "node.your-domain-name", this.params.abciConfig.exposedRpcDomainName);
        }
    }
}
exports.NodeConfigGenerator = NodeConfigGenerator;
