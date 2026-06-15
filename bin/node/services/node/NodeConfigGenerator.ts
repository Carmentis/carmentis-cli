import {CometbftConfig, CometBFTConfigGenerator} from '../CometBFTConfigGenerator';
import {join} from 'path';
import {AbciConfigGenerator} from '../AbciConfigGenerator';
import {EndpointTransformer} from '../../utils/EndpointTransformer';
import {FileDownloader} from '../../utils/FileDownloader';
import {FileManager} from "../../utils/FileManager";
import {AbciConfigGenParams} from "../../types/NodeConfigGenParams";


export type NodeConfigGenerationParams = {
    home: string;
    shouldDownload: {
        caddyFile: boolean,
        dockerCompose: boolean,
    };
    network: string;
    cometbftConfig: CometbftConfig,
    abciConfig: AbciConfigGenParams,
};

export class NodeConfigGenerator {
    constructor(private readonly params: NodeConfigGenerationParams) {}

    async generateConfig() {

        // generate the cometbft config
        const cometBFTConfigGenerator = new CometBFTConfigGenerator(this.params.cometbftConfig);
        const abciConfigGenerator = new AbciConfigGenerator(this.params.abciConfig);
        await cometBFTConfigGenerator.generateConfig();
        await abciConfigGenerator.generateConfig();

        // download the Docker-compose
        if (this.params.shouldDownload.dockerCompose) {
            const dockerComposePath = join(this.params.home, 'docker-compose.yml');
            await FileDownloader.downloadAt("https://raw.githubusercontent.com/Carmentis/architectures/refs/heads/main/node/docker-compose-with-caddy.yml", dockerComposePath);
            await FileManager.replaceInFile(dockerComposePath, "ghcr.io/carmentis/node/abci:TAG", `ghcr.io/carmentis/node/abci:${this.params.network}`);
        }

        // download the Caddyfile
        const shouldDownloadCaddyfile = this.params.shouldDownload.caddyFile;
        if (shouldDownloadCaddyfile) {
            const caddyfilePath = join(this.params.home, 'Caddyfile');
            await FileDownloader.downloadAt("https://raw.githubusercontent.com/Carmentis/architectures/refs/heads/main/node/Caddyfile", caddyfilePath);
            await FileManager.replaceInFile(caddyfilePath, "node.your-domain-name", this.params.abciConfig.exposedRpcDomainName)
        }

    }
}
