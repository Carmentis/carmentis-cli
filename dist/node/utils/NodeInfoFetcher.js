"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodeInfoFetcher = void 0;
class NodeInfoFetcher {
    constructor(rpcEndpoint) {
        this.rpcEndpoint = rpcEndpoint;
    }
    async extractNodeId() {
        const status = await this.fetchStatus();
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
    async fetchStatus() {
        const url = this.rpcEndpoint.replace(/\/$/, '') + '/status';
        return this.fetch(url);
    }
    async fetchGenesis() {
        const url = this.rpcEndpoint.replace(/\/$/, '') + '/genesis';
        const result = await this.fetch(url);
        return result?.result?.genesis;
    }
    async fetchLastHeightAndHash() {
        const url = this.rpcEndpoint.replace(/\/$/, '') + '/status';
        const status = await this.fetch(url);
        if (status === undefined)
            return undefined;
        const syncInfo = status.result.sync_info;
        return {
            latest_block_hash: syncInfo.latest_block_hash,
            latest_block_height: syncInfo.latest_block_height,
        };
    }
    async fetchHashFromHeight(trustHeight) {
        const url = this.rpcEndpoint.replace(/\/$/, '') + `/block?height=${trustHeight}`;
        const status = await this.fetch(url);
        if (status === undefined)
            return undefined;
        return {
            block_hash: status.result.block_id.hash,
            block_height: trustHeight,
        };
    }
    async fetch(url) {
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), NodeInfoFetcher.FETCH_TIMEOUT);
            try {
                const res = await fetch(url, { signal: controller.signal });
                clearTimeout(timeout);
                if (!res.ok)
                    return undefined;
                const json = await res.json().catch(() => undefined);
                return json;
            }
            catch (e) {
                clearTimeout(timeout);
                return undefined;
            }
        }
        catch (e) {
            return undefined;
        }
    }
}
exports.NodeInfoFetcher = NodeInfoFetcher;
NodeInfoFetcher.FETCH_TIMEOUT = 60 * 60 * 1000;
