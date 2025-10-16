"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NetworksStore = void 0;
const node_os_1 = __importDefault(require("node:os"));
const node_path_1 = __importDefault(require("node:path"));
const fs = __importStar(require("node:fs/promises"));
const NodeInfoFetcher_1 = require("./NodeInfoFetcher");
class NetworksStore {
    constructor(customPath) {
        const home = node_os_1.default.homedir();
        this.baseDir = customPath ? node_path_1.default.dirname(customPath) : node_path_1.default.join(home, '.cmts');
        this.filePath = customPath ?? node_path_1.default.join(this.baseDir, 'networks.json');
    }
    getPath() {
        return this.filePath;
    }
    async read() {
        try {
            const raw = await fs.readFile(this.filePath, 'utf8');
            const parsed = JSON.parse(raw);
            if (!parsed || typeof parsed !== 'object')
                return {};
            return parsed;
        }
        catch (e) {
            if (e && (e.code === 'ENOENT' || e.code === 'ENOTDIR')) {
                return {};
            }
            throw e;
        }
    }
    async write(data) {
        await fs.mkdir(this.baseDir, { recursive: true });
        const json = JSON.stringify(data, null, 2);
        await fs.writeFile(this.filePath, json, 'utf8');
    }
    async createNetwork(name) {
        const store = await this.read();
        if (store[name]) {
            throw new Error(`Network "${name}" already exists.`);
        }
        store[name] = { nodes: {} };
        await this.write(store);
    }
    async deleteNetwork(name) {
        const store = await this.read();
        if (!store[name])
            return false;
        delete store[name];
        await this.write(store);
        return true;
    }
    async addNode(network, hostname, rpcEndpoint, p2pEndpoint, trusted = true) {
        const store = await this.read();
        const n = store[network];
        if (!n)
            throw new Error(`Network "${network}" does not exist.`);
        if (n.nodes[hostname])
            throw new Error(`Node "${hostname}" already exists in network "${network}".`);
        // we now search for the node identifier
        const fetcher = new NodeInfoFetcher_1.NodeInfoFetcher(rpcEndpoint);
        try {
            const nodeId = await fetcher.extractNodeId();
            if (typeof nodeId === 'string') {
                n.nodes[hostname] = { hostname, rpcEndpoint, p2pEndpoint, trusted, nodeId };
            }
            else {
                throw new Error(`Unable to obtain the node identifier for ${hostname} (contacted ${rpcEndpoint})`);
            }
        }
        catch {
            throw new Error(`Handled error: Unable to obtain the node identifier for ${hostname} (contacted ${rpcEndpoint})`);
        }
        await this.write(store);
    }
    async setEndpoint(network, hostname, kind, url) {
        const store = await this.read();
        const n = store[network];
        if (!n)
            throw new Error(`Network "${network}" does not exist.`);
        const node = n.nodes[hostname];
        if (!node)
            throw new Error(`Node "${hostname}" does not exist in network "${network}".`);
        if (kind === 'p2p')
            node.p2pEndpoint = url;
        // if the user attemps to update the RPC endpoint, then we update the node id
        if (kind === 'rpc') {
            const fetcher = new NodeInfoFetcher_1.NodeInfoFetcher(url);
            const nodeId = await fetcher.extractNodeId();
            if (typeof nodeId === 'string') {
                node.rpcEndpoint = url;
                node.nodeId = nodeId;
            }
            else {
                throw new Error(`Cannot update RPC endpoint for ${hostname}: cannot recover the node identifier from ${url}`);
            }
        }
        await this.write(store);
    }
    async changeTrustOfNodes(network, hostnames, shouldTrust) {
        const store = await this.read();
        const n = store[network];
        if (!n)
            throw new Error(`Network "${network}" does not exist.`);
        for (const host of hostnames) {
            if (!host)
                continue;
            const node = n.nodes[host];
            if (!node)
                throw new Error(`Node "${host}" does not exist in network "${network}".`);
            node.trusted = shouldTrust;
        }
        await this.write(store);
    }
    async removeNodes(network, hosts) {
        const store = await this.read();
        const n = store[network];
        if (!n)
            throw new Error(`Network "${network}" does not exist.`);
        for (const host of hosts) {
            if (!host)
                continue;
            delete n.nodes[host];
        }
        await this.write(store);
    }
    async getNetworkNames() {
        const store = await this.read();
        return Object.keys(store);
    }
}
exports.NetworksStore = NetworksStore;
