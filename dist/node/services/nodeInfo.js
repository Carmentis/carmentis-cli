"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodeInfoService = void 0;
function withDefaultEndpoints(hostname, node) {
    const rpcEndpoint = node.rpcEndpoint ?? `http://${hostname}:26657`;
    const p2PEndpoint = node.p2pEndpoint ?? `${hostname}:26656`;
    return { rpcEndpoint, p2PEndpoint };
}
class NodeInfoService {
    constructor(fetchTimeoutMs = 1500) {
        this.fetchTimeoutMs = fetchTimeoutMs;
    }
    async list(store) {
        const items = [];
        for (const [network, data] of Object.entries(store)) {
            for (const [hostname, node] of Object.entries(data.nodes ?? {})) {
                const { rpcEndpoint, p2PEndpoint } = withDefaultEndpoints(hostname, node);
                items.push({
                    network,
                    hostname,
                    rpcEndpoint,
                    p2pEndpoint: p2PEndpoint,
                    trusted: Boolean(node.trusted),
                    online: false,
                });
            }
        }
        // Probe online status and node-id concurrently with timeouts
        await Promise.all(items.map(async (it) => {
            const result = await this.fetchStatus(it.rpcEndpoint).catch(() => undefined);
            it.online = Boolean(result);
            if (result) {
                const id = this.extractNodeId(result);
                if (id)
                    it.nodeId = id;
            }
        }));
        return items;
    }
    async listNodesInNetwork(store, networkName) {
        const nodes = await store.read();
        const items = [];
        const data = nodes[networkName];
        for (const [hostname, node] of Object.entries(data.nodes ?? {})) {
            const { rpcEndpoint, p2PEndpoint } = withDefaultEndpoints(hostname, node);
            items.push({
                network: networkName,
                hostname,
                rpcEndpoint,
                p2pEndpoint: p2PEndpoint,
                trusted: Boolean(node.trusted),
                online: false,
            });
        }
        // Probe online status and node-id concurrently with timeouts
        await Promise.all(items.map(async (it) => {
            const result = await this.fetchStatus(it.rpcEndpoint).catch(() => undefined);
            it.online = Boolean(result);
            if (result) {
                const id = this.extractNodeId(result);
                if (id)
                    it.nodeId = id;
            }
        }));
        return items;
    }
    async getNodeIdFromRpcEndpoint(rpcEndpoint) {
        const status = await this.fetchStatus(rpcEndpoint);
        return this.extractNodeId(status);
    }
    async fetchStatus(baseUrl) {
        try {
            const url = baseUrl.replace(/\/$/, '') + '/status';
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), this.fetchTimeoutMs);
            try {
                const res = await fetch(url, { signal: controller.signal });
                clearTimeout(timeout);
                if (!res.ok)
                    return undefined;
                const json = await res.json().catch(() => undefined);
                return json;
            }
            catch {
                clearTimeout(timeout);
                return undefined;
            }
        }
        catch {
            return undefined;
        }
    }
    extractNodeId(status) {
        // Tendermint/CometBFT variants
        // Possible paths: result.node_info.id or node_info.id
        if (!status)
            return undefined;
        if (status.result?.node_info?.id)
            return String(status.result.node_info.id);
        if (status.node_info?.id)
            return String(status.node_info.id);
        return undefined;
    }
}
exports.NodeInfoService = NodeInfoService;
