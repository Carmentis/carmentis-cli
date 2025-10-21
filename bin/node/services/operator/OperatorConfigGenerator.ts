import { join, resolve } from 'path';
import path from "node:path";
import {FileManager} from "../../utils/FileManager";
import {FileDownloader} from "../../utils/FileDownloader";
import {TomlExporter} from "../../utils/TomlExporter";
import {DotEnvExporter} from "../../utils/DotEnvExporter";

export interface OperatorConfigGenerationParams {
    generateAt: string,
    operatorHome: string,
    nodeUrl: string,
    downloadEndpoints:  {
        dockerCompose: string,
        caddyfile: string,
    }
    domainNames: {
        workspace: string,
        operator: string,
    }
    allowEncryptionKeyGeneration: boolean,
    database: {
        type: 'postgresql',
        user: string,
        port: number,
        database: string,
        url: string,
        password: string,
        useDockerSecret: boolean,
    },
    filenames: {
        operatorConfigFilename: string,
    },
    shouldDownload: {
        dockerCompose: boolean,
        caddyfile: boolean,
    }

}

export class OperatorConfigGenerator {
    constructor(private readonly params: OperatorConfigGenerationParams) {}

    async generateConfig() {
        // we start by resolving the current path from which we deduce all relative paths
        const generationPath = path.resolve(this.params.generateAt);
        const dockerComposePath = join(generationPath, `docker-compose.yml`);
        const caddyFilePath = join(generationPath, `Caddyfile`);
        const dotEnvPath = join(generationPath, `.env`);
        const operatorConfigPath = join(generationPath, this.params.filenames.operatorConfigFilename);


        // we create the folder if not already exists and download the required files
        FileManager.ensureDirExistsOrCreate(generationPath);
        if (this.params.shouldDownload.dockerCompose) {
            await FileDownloader.downloadAt( this.dockerComposeEndpoint, dockerComposePath );
        }

        // we conditionally generate and update the caddyfile
        const { workspace: workspaceDomainName, operator: operatorDomainName } = this.params.domainNames;
        if (this.params.shouldDownload.caddyfile) {
            await FileDownloader.downloadAt( this.caddyFileEndpoint, caddyFilePath );
            await FileManager.replaceInFile(caddyFilePath, 'operator.your-domain-name', operatorDomainName);
            await FileManager.replaceInFile(caddyFilePath, 'workspace.your-domain-name', workspaceDomainName);
        }

        // we generate the config.toml file
        await TomlExporter.exportToFile({
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
        }, operatorConfigPath)

        // we generate the .env file
        await DotEnvExporter.exportToFile({
            OPERATOR_URL: operatorDomainName,
            POSTGRES_USER: this.params.database.user,
            POSTGRES_DB: this.params.database.database,
            POSTGRES_PASSWORD: this.params.database.password
        }, dotEnvPath)



    }

    private get dockerComposeEndpoint() {
        return this.params.downloadEndpoints.dockerCompose
    }

    private get caddyFileEndpoint() {
        return this.params.downloadEndpoints.caddyfile
    }
}