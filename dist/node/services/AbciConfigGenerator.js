"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AbciConfigGenerator = void 0;
const TomlExporter_1 = require("../utils/TomlExporter");
const path_1 = require("path");
class AbciConfigGenerator {
    constructor(params) {
        this.params = params;
    }
    async generateConfig() {
        let config = {
            cometbft: {
                exposed_rpc_endpoint: this.exposedRpcEndpoint,
            },
            abci: {
                grpc: {
                    port: 26658
                },
                rest: {
                    query: {
                        port: 26659
                    }
                }
            },
            paths: {
                cometbft_home: '/cometbft',
                storage: '/abci',
            },
            snapshots: {
                snapshot_block_period: 1,
                block_history_before_snapshot: 0,
                max_snapshots: 3,
            }
        };
        if (this.params.genesis_snapshot) {
            config = {
                ...config,
                genesis_snapshot: {
                    rpc_endpoint: this.params.genesis_snapshot.fromRpcEndpoint
                }
            };
        }
        if (this.params.genesis) {
            config = {
                ...config,
                genesis: {
                    private_key: {
                        sk: this.params.genesis.sk,
                    },
                }
            };
        }
        // export the config
        const configFilePath = (0, path_1.join)(this.home, this.params.nodeConfigFilename);
        await TomlExporter_1.TomlExporter.exportToFile(config, configFilePath);
    }
    get exposedRpcEndpoint() {
        return this.params.exposedRpcEndpoint;
    }
    get home() {
        return this.params.home;
    }
}
exports.AbciConfigGenerator = AbciConfigGenerator;
