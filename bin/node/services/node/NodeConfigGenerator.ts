import {CometBFTConfigGenerator} from '../CometBFTConfigGenerator';
import {join} from 'path';
import {AbciConfigGenerator} from '../AbciConfigGenerator';
import {EndpointTransformer} from '../../utils/EndpointTransformer';
import {FileDownloader} from '../../utils/FileDownloader';
import {FileManager} from "../../utils/FileManager";
import {AbciConfigGenParams} from "../../types/NodeConfigGenParams";
import {DockerComposeGenerator} from "../DockerComposeGenerator";
import {Network} from "../../types/NetworksFile";
import * as os from 'os';
import * as v from 'valibot';
import {CometBFTConfig, CometBFTConfigSchema, CometBFTStateSyncPartial} from "../../types/CometbftConfig";

export type NodeConfigGenerationParams = {
    home: string;
    shouldDownload: {
        caddyFile: boolean,
    };
    networkName: string;
    choseNetwork: Network,
    genesisJson: object | undefined,
    cometbftConfig: CometBFTConfig,
    abciConfig: AbciConfigGenParams,
};

export class NodeConfigGenerator {
    private readonly cometbftConfig: CometBFTConfig;
    constructor(private readonly params: NodeConfigGenerationParams) {
        this.cometbftConfig = v.parse(CometBFTConfigSchema, this.params.cometbftConfig);
    }


    async generateConfig() {
        // generate the cometbft config
        const cometBFTConfigGenerator = new CometBFTConfigGenerator(
            join(this.params.home, 'cometbft'),
            this.params.networkName,
            this.cometbftConfig,
            { genesisJson: this.params.genesisJson }
        );
        const abciConfigGenerator = new AbciConfigGenerator(this.params.abciConfig);
        await cometBFTConfigGenerator.generateConfig();
        await abciConfigGenerator.generateConfig();

        // get the chosen network
        const network = this.params.choseNetwork;
        const abciDockerImageLabel = network.abciDockerImageLabel;

        // define the uid and gid
        const userInfo = os.userInfo();
        const uid = userInfo.uid;
        const gid = userInfo.gid;

        // define the ports to use


        // create the Docker-compose
            const dockerComposePath = join(this.params.home, 'docker-compose.yml');
            await DockerComposeGenerator.generate(
                dockerComposePath,
                {
                    networks: {
                        'carmentis-network': {
                            driver: 'bridge',
                        },
                    },
                    volumes: {
                        caddy_data: {},
                        caddy_config: {},
                    },
                    services: {
                        caddy: {
                            image: 'caddy:2',
                            container_name: 'caddy',
                            restart: 'unless-stopped',
                            ports: [
                                '80:80',
                                '443:443',
                            ],
                            volumes: [
                                './Caddyfile:/etc/caddy/Caddyfile:ro',
                                'caddy_data:/data',
                                'caddy_config:/config',
                            ],
                            networks: [
                                'carmentis-network',
                            ],
                            depends_on: [
                                'node-cometbft',
                                'node-abci',
                            ],
                        },

                        'node-abci': {
                            container_name: 'node-abci',
                            image: `ghcr.io/carmentis/node/abci:${abciDockerImageLabel}`,
                            expose: [
                                '26658',
                            ],
                            //user: `${uid}:${gid}`, // the user field does not work as expected.
                            volumes: [
                                './cometbft:/cometbft',
                                './abci:/abci',
                                './config.toml:/app/config.toml',
                            ],
                            networks: [
                                'carmentis-network',
                            ],
                        },

                        'node-cometbft': {
                            container_name: 'node-cometbft',
                            image: 'cometbft/cometbft:v0.38.x',
                            command: [
                                'start',
                                '--abci',
                                'grpc',
                                '--proxy_app',
                                'node-abci:26658',
                                '--rpc.laddr',
                                'tcp://0.0.0.0:26657',
                            ],
                            depends_on: [
                                'node-abci',
                            ],
                            ports: [
                                '26656:26656',
                                '26657:26657',
                            ],
                            user: `${uid}:${gid}`,
                            volumes: [
                                './cometbft:/cometbft',
                            ],
                            networks: [
                                'carmentis-network',
                            ],
                        },
                    },
                },
            );
            //await FileDownloader.downloadAt("https://raw.githubusercontent.com/Carmentis/architectures/refs/heads/main/node/docker-compose-with-caddy.yml", dockerComposePath);
            //await FileManager.replaceInFile(dockerComposePath, "ghcr.io/carmentis/node/abci:TAG", `ghcr.io/carmentis/node/abci:${this.params.network}`);


        // download the Caddyfile
        const shouldDownloadCaddyfile = this.params.shouldDownload.caddyFile;
        if (shouldDownloadCaddyfile) {
            const caddyfilePath = join(this.params.home, 'Caddyfile');
            await FileDownloader.downloadAt("https://raw.githubusercontent.com/Carmentis/architectures/refs/heads/main/node/Caddyfile", caddyfilePath);
            await FileManager.replaceInFile(caddyfilePath, "node.your-domain-name", this.params.abciConfig.exposedRpcDomainName)
        }

    }
}
