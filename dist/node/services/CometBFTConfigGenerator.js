"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CometBFTConfigGenerator = void 0;
const CometBFTBinary_1 = require("./CometBFTBinary");
const path_1 = require("path");
const TomlEditor_1 = require("../utils/TomlEditor");
const JsonEditor_1 = require("../utils/JsonEditor");
const JsonExporter_1 = require("../utils/JsonExporter");
class CometBFTConfigGenerator {
    constructor(params) {
        this.params = params;
        this.configTomlEditor = new TomlEditor_1.TomlEditor(this.configFilePath);
        this.genesisEditor = new JsonEditor_1.JsonEditor(this.genesisPath);
    }
    async generateConfig() {
        // execute cometbft init
        CometBFTBinary_1.CometBFTBinary.executeInit(this.cometbftHome);
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
        const hasEnoughRPCServers = rpcServers.length >= 2;
        const isStateSyncEnabled = this.params.stateSync !== undefined && this.params.stateSync.enabled;
        if (hasEnoughRPCServers && isStateSyncEnabled && this.params.stateSync !== undefined) {
            const { trustHeight, trustHash } = this.params.stateSync;
            this.enableRpcServers(rpcServers, trustHeight, trustHash);
        }
        else {
            console.warn(`No sufficient RPC servers provided (${rpcServers.length} provided) or state sync not enabled: state sync disabled`);
        }
    }
    writeCors(allowedOrigins) {
        this.configTomlEditor.write("cors_allowed_origins", allowedOrigins, "rpc");
    }
    enableRpcServers(rpcServers, trustHeight, trustHash) {
        const rpcServersConfig = rpcServers.join(",");
        this.configTomlEditor.write("enable", true, "statesync");
        this.configTomlEditor.write("rpc_servers", rpcServersConfig, 'statesync');
        this.configTomlEditor.write("trust_height", trustHeight, 'statesync');
        this.configTomlEditor.write("trust_hash", trustHash, 'statesync');
    }
    writeMoniker(moniker) {
        this.configTomlEditor.write("moniker", moniker);
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
