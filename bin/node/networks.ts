import {NetworksFile} from "./types/NetworksFile";

const networks: NetworksFile = {
    "devnet": {
        abciDockerImageLabel: 'devnet',
        "nodes": {
            "node1.server1.devnet.carmentis.io": {
                "hostname": "node1.server1.devnet.carmentis.io",
                "rpcEndpoint": "https://node1.server1.devnet.carmentis.io",
                "p2pEndpoint": "node1.devnet.carmentis.io:26656",
                "isGenesis": true,
                "nodeId": "82958a461e6b85405a83fd1958d21a69c2dceaed"
            },
            "node2.server2.devnet.carmentis.io": {
                "hostname": "node2.server2.devnet.carmentis.io",
                "rpcEndpoint": "https://node2.server2.devnet.carmentis.io",
                "p2pEndpoint": "node2.server2.devnet.carmentis.io:26656",
                "isGenesis": false,
                "nodeId": "a1cc9ece24d93515df8b3b44c95d3474893648b1"
            },
            "node3.server3.devnet.carmentis.io": {
                "hostname": "node3.server3.devnet.carmentis.io",
                "rpcEndpoint": "https://node3.server3.devnet.carmentis.io",
                "p2pEndpoint": "node3.server3.devnet.carmentis.io:26656",
                "isGenesis": false,
                "nodeId": "8265be99b4d44c050a3e36b2da220a64cc6b78df"
            }
        }
    },
    "testnet": {
        abciDockerImageLabel: 'testnet',
        "nodes": {}
    },
    "mainnet": {
        abciDockerImageLabel: 'mainnet',
        "nodes": {
            "carmenta.carmentis.io": {
                "hostname": "carmenta.carmentis.io",
                "rpcEndpoint": "https://carmenta.carmentis.io",
                "p2pEndpoint": "carmenta.carmentis.io:26656",
                isGenesis: true,
                nodeId: "03bda55a1304b3e6535fcbee27fd3210d55f6bc40"
            },
            "mercurius.carmentis.io": {
                "hostname": "mercurius.carmentis.io",
                "rpcEndpoint": "https://mercurius.carmentis.io",
                "p2pEndpoint": "mercurius.carmentis.io:26656",
                isGenesis: false,
                nodeId: "7e773f858d2a6be3a9a51e05262c73f82a944a4e"
            },
            "antevorta.carmentis.io": {
                "hostname": "antevorta.carmentis.io",
                "rpcEndpoint": "https://antevorta.carmentis.io",
                "p2pEndpoint": "antevorta.carmentis.io:26656",
                isGenesis: false,
                nodeId: "d179e8aaccf8d46c588470ccdc6be3646dc389ed"
            },
            "postvorta.carmentis.io": {
                "hostname": "postvorta.carmentis.io",
                "rpcEndpoint": "https://postvorta.carmentis.io",
                "p2pEndpoint": "postvorta.carmentis.io:26656",
                isGenesis: false,
                nodeId: "fd0fd7c61e3c610defab02989720d13e45eee7b2"
            }
        }
    }
}

export function getDefaultNetworks() {
    return networks;
}
