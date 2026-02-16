import * as TOML from '@iarna/toml';
import { TomlExporter } from '../utils/TomlExporter';
import { join } from 'path';
import {input} from '@inquirer/prompts';
import {CMTSToken} from "@cmts-dev/carmentis-sdk/server";

export interface AbciConfigParams {
    home: string,
    exposedRpcEndpoint: string,
    exposedRpcDomainName: string,
    genesis?: {
        sk: string,
    },
    genesis_snapshot?: {
        fromRpcEndpoint: string,
    },
    nodeConfigFilename: string;
    min_microblock_gas_in_atomic_accepted: number;
}
export class AbciConfigGenerator {

    constructor(private readonly params: AbciConfigParams) {}

    async generateConfig() {
        let config: any = {
            cometbft: {
                exposed_rpc_endpoint: this.exposedRpcEndpoint,
            },
            abci: {
                grpc: {
                    port: 26_658
                },
                rest: {
                    query: {
                        port: 26_659
                    }
                },
                min_microblock_gas_in_atomic_accepted: this.params.min_microblock_gas_in_atomic_accepted,
            },
            paths: {
                cometbft_home: '/cometbft',
                storage: '/abci',
            },
            snapshots:  {
                snapshot_block_period: 50,
                block_history_before_snapshot: 0,
                max_snapshots: 10,
            },
        };

        if (this.params.genesis_snapshot) {
            config = {
                ...config,
                genesis_snapshot: {
                    rpc_endpoint: this.params.genesis_snapshot.fromRpcEndpoint
                }
            }
        }

        if (this.params.genesis) {
            config = {
                ...config,
                genesis: {
                    private_key: {
                        sk: this.params.genesis.sk,
                    },
                }
            }
        }

        // export the config
        const configFilePath = join(this.home, this.params.nodeConfigFilename);
        await TomlExporter.exportToFile(config, configFilePath);
    }

    private get exposedRpcEndpoint() {
        return this.params.exposedRpcEndpoint;
    }

    private get home() {
        return this.params.home;
    }
}