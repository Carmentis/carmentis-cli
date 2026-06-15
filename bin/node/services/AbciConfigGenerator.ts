import * as TOML from '@iarna/toml';
import { TomlExporter } from '../utils/TomlExporter';
import { join } from 'path';
import {input} from '@inquirer/prompts';
import {CMTSToken} from "@cmts-dev/carmentis-sdk/server";
import * as v from 'valibot';
import {AbciConfigGenParams} from "../types/NodeConfigGenParams";
import {AbciConfigSchema} from "../types/AbciConfig";




// The final ABCI config type


export class AbciConfigGenerator {

    constructor(private readonly params: AbciConfigGenParams) {}

    async generateConfig() {
        let config = v.parse(AbciConfigSchema, {
            cometbft: {
                exposed_rpc_endpoint: this.exposedRpcEndpoint,
            },
            abci: {
                grpc: {
                    port: 26_658
                },
                min_microblock_gas_price_in_atomics: this.params.min_microblock_gas_price_in_atomics,
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

            // only for genesis nodes
            genesis: this.params.genesis ? ({
                private_key: {
                    sk: this.params.genesis.sk,
                },
            }) : undefined,

            // only for joining nodes
            genesis_snapshot: this.params.genesis_snapshot ? ({
                rpc_endpoint: this.params.genesis_snapshot.fromRpcEndpoint
            }) : undefined
        });
        const configFilePath = join(this.home, this.params.abciConfigFilename);
        await TomlExporter.exportToFile(config, configFilePath);
    }

    private get exposedRpcEndpoint() {
        return this.params.exposedRpcEndpoint;
    }

    private get home() {
        return this.params.home;
    }
}