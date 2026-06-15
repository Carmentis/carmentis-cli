import {NetworksFile} from "./types/NetworksFile";

const networks: NetworksFile = {
    "devnet": {
        abciDockerImageLabel: 'devnet',
        "nodes": {
            "node1.server1.devnet.carmentis.io": {
                "hostname": "node1.server1.devnet.carmentis.io",
                "rpcEndpoint": "https://node1.server1.devnet.carmentis.io",
                "p2pEndpoint": "http://server1.devnet.carmentis.io:26656",
                "trusted": true,
                "nodeId": "82958a461e6b85405a83fd1958d21a69c2dceaed"
            },
            "node2.server2.devnet.carmentis.io": {
                "hostname": "node2.server2.devnet.carmentis.io",
                "rpcEndpoint": "https://node2.server2.devnet.carmentis.io",
                "p2pEndpoint": "node2.server2.devnet.carmentis.io:26656",
                "trusted": true,
                "nodeId": "8a322c84cea1d33e6f0efb674a2967dcf7955b4a"
            }
        }
    },
    "testnet": {
        abciDockerImageLabel: 'testnet',
        "nodes": {
            "ares.testnet.carmentis.io": {
                "hostname": "ares.testnet.carmentis.io",
                "rpcEndpoint": "https://ares.testnet.carmentis.io",
                "p2pEndpoint": "ares.testnet.carmentis.io:26656",
                "trusted": true,
                "isSeed": false,
                "nodeId": "5241ff36fcb6a787889cf2009a3683a40bfe3cac"
            },
            "athena.testnet.opkods.com": {
                "hostname": "athena.testnet.opkods.com",
                "rpcEndpoint": "https://athena.testnet.opkods.com",
                "p2pEndpoint": "athena.testnet.opkods.com:26656",
                "trusted": true,
                "isSeed": false,
                "nodeId": "461958f6f2f2bed0809369a851ac15480b150834"
            }
        }
    }
}

export function getDefaultNetworks() {
    return networks;
}
