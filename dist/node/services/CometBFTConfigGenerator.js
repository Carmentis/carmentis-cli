"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CometBFTConfigGenerator = void 0;
const cometbftBinary_1 = require("./cometbftBinary");
const path_1 = require("path");
const TomlEditor_1 = require("./TomlEditor");
const NodeInfoFetcher_1 = require("./NodeInfoFetcher");
const JsonEditor_1 = require("./JsonEditor");
const JsonExporter_1 = require("./JsonExporter");
class CometBFTConfigGenerator {
    constructor(params) {
        this.params = params;
        this.trustHeight = 'last';
        this.configTomlEditor = new TomlEditor_1.TomlEditor(this.configFilePath);
        this.genesisEditor = new JsonEditor_1.JsonEditor(this.genesisPath);
    }
    /**
     * Indicates the method to use to recover the trust height and hash.
     * @param method
     */
    setStateSyncTrustHeight(method) {
        this.trustHeight = method;
    }
    async generateConfig() {
        // execute cometbft init
        cometbftBinary_1.CometbftBinary.executeInit(this.cometbftHome);
        this.writeMoniker(this.moniker);
        // update proxy app
        this.configTomlEditor.write("proxy_app", this.params.proxyApp);
        this.configTomlEditor.write("laddr", this.params.rpc.laddr, "rpc");
        // update persistent peers
        const p2pEndpoints = this.endpoints.getP2PEndpoints();
        if (p2pEndpoints.length > 0) {
            const persistentPeers = this.endpoints.getP2PEndpoints().join(',');
            this.configTomlEditor.write("persistent_peers", persistentPeers, "p2p");
        }
        else {
            console.warn("No p2p endpoints found: skipping persistent peers");
        }
        if (this.params.genesis.overrideWith) {
            JsonExporter_1.JsonExporter.exportAt(this.params.genesis.overrideWith, this.genesisPath);
        }
        else if (this.params.genesis.networkName) {
            console.log("network name: " + this.params.genesis.networkName);
            this.genesisEditor.write(['chain_id'], this.params.genesis.networkName);
        }
        // update rpc servers
        const rpcServers = this.endpoints.getRpcEndpoints();
        this.writeCors(this.params.cors.allowedOrigins);
        if (rpcServers.length >= 2) {
            // if the provided trust height is 'last', use the first servers
            const chosenRpcServer = rpcServers[0];
            const fetcher = new NodeInfoFetcher_1.NodeInfoFetcher(chosenRpcServer);
            let trustHeight, trustHash;
            if (this.trustHeight === 'last') {
                const response = await fetcher.fetchLastHeightAndHash();
                if (response !== undefined) {
                    const { latest_block_hash, latest_block_height } = response;
                    trustHeight = latest_block_height;
                    trustHash = latest_block_hash;
                }
            }
            else {
                const response = await fetcher.fetchHashFromHeight(this.trustHeight);
                if (response !== undefined) {
                    const { block_height, block_hash } = response;
                    trustHash = block_hash;
                    trustHeight = block_height;
                }
            }
            if (trustHeight !== undefined && trustHash !== undefined) {
                this.enableRpcServers(rpcServers, trustHeight, trustHash);
            }
            else {
                throw new Error("Undefined trust height");
            }
        }
        else {
            console.warn(`No sufficient RPC servers provided (${rpcServers.length} provided), cannot enable fastsync`);
        }
    }
    writeCors(allowedOrigins) {
        this.configTomlEditor.write("cors_allowed_origins", allowedOrigins, "rpc");
    }
    enableRpcServers(rpcServers, trustHeight, trustHash) {
        const enableStateSync = typeof this.params.stateSync.enabled === 'boolean' && this.params.stateSync.enabled;
        if (enableStateSync) {
            const rpcServersConfig = rpcServers.join(",");
            this.configTomlEditor.write("enable", enableStateSync, "statesync");
            this.configTomlEditor.write("rpc_servers", rpcServersConfig, 'statesync');
            this.configTomlEditor.write("trust_height", trustHeight, 'statesync');
            this.configTomlEditor.write("trust_hash", trustHash, 'statesync');
        }
    }
    writeMoniker(moniker) {
        this.configTomlEditor.write("moniker", this.moniker);
    }
    get moniker() {
        return this.params.moniker;
    }
    get endpoints() {
        return this.params.endpoints;
    }
    get cometbftHome() {
        return this.params.home;
    }
    get genesisPath() {
        return (0, path_1.join)(this.cometbftHome, 'config', 'genesis.json');
    }
    get configFilePath() {
        return (0, path_1.join)(this.cometbftHome, 'config', 'config.toml');
    }
}
exports.CometBFTConfigGenerator = CometBFTConfigGenerator;
