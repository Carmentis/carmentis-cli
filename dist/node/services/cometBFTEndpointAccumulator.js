"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CometBFTEndpointAccumulator = void 0;
const nodeInfo_1 = require("./nodeInfo");
/**
 * This class is used to accumulate a set of RPC/P2P endpoints to be used later to construct
 * a config.
 */
class CometBFTEndpointAccumulator {
    constructor() {
        this.rpcEndpoints = [];
        this.p2pEndpoints = [];
        this.nodeInfo = new nodeInfo_1.NodeInfoService();
    }
    async parseEndpoint(endpoint) {
        if (endpoint.startsWith("p2p:")) {
            this.p2pEndpoints.push(endpoint.replace("p2p:", ""));
        }
        else if (endpoint.startsWith("rpc:")) {
            this.rpcEndpoints.push(endpoint.replace("rpc:", ""));
        }
        else {
            const { rpcEndpoint: nextRpcEndpoint, p2pEndpoint } = await this.obtainRpcAndP2PEndpointFromRpcEndpint(endpoint);
            this.rpcEndpoints.push(nextRpcEndpoint);
            this.p2pEndpoints.push(p2pEndpoint);
        }
    }
    async addRpcEndpoint(endpoint) {
        this.rpcEndpoints.push(endpoint);
    }
    async addP2PEndpoint(endpoint) {
        this.p2pEndpoints.push(endpoint);
    }
    async obtainRpcAndP2PEndpointFromRpcEndpint(rpcEndpoint) {
        const nodeId = await this.nodeInfo.getNodeIdFromRpcEndpoint(rpcEndpoint);
        // we attempt to transform the rpcEndpoint into a p2p endpoint
        let p2pEndpoint = rpcEndpoint
            .replace('26657', '26656')
            .replace("https://", "")
            .replace("http://", "");
        // if the p2p endpoint does not end with !26656 (the default p2p port), add it
        if (!p2pEndpoint.endsWith(":26656")) {
            p2pEndpoint = p2pEndpoint + ":26656";
        }
        return {
            rpcEndpoint,
            p2pEndpoint: `${nodeId}@${p2pEndpoint}`,
        };
    }
    getP2PEndpoints() {
        return this.p2pEndpoints;
    }
    getRpcEndpoints() {
        return this.rpcEndpoints;
    }
}
exports.CometBFTEndpointAccumulator = CometBFTEndpointAccumulator;
