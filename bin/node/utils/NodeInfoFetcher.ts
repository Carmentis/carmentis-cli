export class NodeInfoFetcher {
    private static FETCH_TIMEOUT = 60 * 60 * 1000;
    constructor(private readonly rpcEndpoint: string) {}

    async extractNodeId(): Promise<string | undefined> {
        const status = await this.fetchStatus();
        // Tendermint/CometBFT variants
        // Possible paths: result.node_info.id or node_info.id
        if (!status) return undefined;
        if (status.result?.node_info?.id) return String(status.result.node_info.id);
        if (status.node_info?.id) return String(status.node_info.id);
        return undefined;
    }

    private async fetchStatus(): Promise<any> {
        const url = this.rpcEndpoint.replace(/\/$/, '') + '/status';
        return this.fetch<any>(url);
    }

    async fetchGenesis() {
        const url = this.rpcEndpoint.replace(/\/$/, '') + '/genesis';
        const result = await this.fetch<{ result: { genesis: object } }>(url);
        return result?.result?.genesis;
    }


    async fetchLastHeightAndHash() {
        const url = this.rpcEndpoint.replace(/\/$/, '') + '/status';
        const status = await this.fetch<{ result: { sync_info: { latest_block_height: number, latest_block_hash: string } } }>(url);
        if (status === undefined) return undefined;
        const syncInfo = status.result.sync_info;
        return {
            latest_block_hash: syncInfo.latest_block_hash,
            latest_block_height: syncInfo.latest_block_height,
        };
    }

    async fetchHashFromHeight(trustHeight: number) {
        const url = this.rpcEndpoint.replace(/\/$/, '') + `/block?height=${trustHeight}`;
        const status = await this.fetch<{ result: { block_id: { hash: string } } }>(url);
        if (status === undefined) return undefined;
        return {
            block_hash: status.result.block_id.hash,
            block_height: trustHeight,
        };
    }


    private async fetch<T>(url: string): Promise<T | undefined> {
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), NodeInfoFetcher.FETCH_TIMEOUT);
            try {
                const res = await fetch(url, { signal: controller.signal });
                clearTimeout(timeout);
                if (!res.ok) return undefined;
                const json = await res.json().catch(() => undefined);
                return json as T;
            } catch (e) {
                clearTimeout(timeout);
                return undefined;
            }
        } catch (e) {
            return undefined;
        }
    }


}