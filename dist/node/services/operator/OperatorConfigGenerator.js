"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OperatorConfigGenerator = void 0;
const path_1 = require("path");
const node_path_1 = __importDefault(require("node:path"));
const FileManager_1 = require("../../utils/FileManager");
const FileDownloader_1 = require("../../utils/FileDownloader");
const TomlExporter_1 = require("../../utils/TomlExporter");
const DotEnvExporter_1 = require("../../utils/DotEnvExporter");
class OperatorConfigGenerator {
    constructor(params) {
        this.params = params;
    }
    async generateConfig() {
        // we start by resolving the current path from which we deduce all relative paths
        const generationPath = node_path_1.default.resolve(this.params.generateAt);
        const dockerComposePath = (0, path_1.join)(generationPath, `docker-compose.yml`);
        const caddyFilePath = (0, path_1.join)(generationPath, `Caddyfile`);
        const dotEnvPath = (0, path_1.join)(generationPath, `.env`);
        const operatorConfigPath = (0, path_1.join)(generationPath, this.params.filenames.operatorConfigFilename);
        // we create the folder if not already exists and download the required files
        FileManager_1.FileManager.ensureDirExistsOrCreate(generationPath);
        if (this.params.shouldDownload.dockerCompose) {
            await FileDownloader_1.FileDownloader.downloadAt(this.dockerComposeEndpoint, dockerComposePath);
        }
        // we conditionally generate and update the caddyfile
        const { workspace: workspaceDomainName, operator: operatorDomainName } = this.params.domainNames;
        if (this.params.shouldDownload.caddyfile) {
            await FileDownloader_1.FileDownloader.downloadAt(this.caddyFileEndpoint, caddyFilePath);
            await FileManager_1.FileManager.replaceInFile(caddyFilePath, 'operator.your-domain-name', operatorDomainName);
            await FileManager_1.FileManager.replaceInFile(caddyFilePath, 'workspace.your-domain-name', workspaceDomainName);
        }
        // we generate the config.toml file
        await TomlExporter_1.TomlExporter.exportToFile({
            operator: {
                node_url: this.params.nodeUrl,
                paths: {
                    home: this.params.operatorHome,
                },
                database: {
                    encryption: {
                        allow_encryption_key_generation: this.params.allowEncryptionKeyGeneration,
                    },
                    postgresql: {
                        user: this.params.database.user,
                        password: this.params.database.password,
                        database: this.params.database.database,
                        url: this.params.database.url,
                        port: this.params.database.port,
                    },
                },
            },
        }, operatorConfigPath);
        // we generate the .env file
        await DotEnvExporter_1.DotEnvExporter.exportToFile({
            OPERATOR_URL: operatorDomainName,
            POSTGRES_USER: this.params.database.user,
            POSTGRES_DB: this.params.database.database,
            POSTGRES_PASSWORD: this.params.database.password
        }, dotEnvPath);
    }
    get dockerComposeEndpoint() {
        return this.params.downloadEndpoints.dockerCompose;
    }
    get caddyFileEndpoint() {
        return this.params.downloadEndpoints.caddyfile;
    }
}
exports.OperatorConfigGenerator = OperatorConfigGenerator;
