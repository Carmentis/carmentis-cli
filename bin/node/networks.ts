import {NetworksFile} from "./types/NetworksFile";

const networks: NetworksFile = {
    "devnet": {
        abciDockerImageLabel: 'devnet',
        "nodes": {
            "node1.server1.devnet.carmentis.io": {
                "hostname": "node1.server1.devnet.carmentis.io",
                "rpcEndpoint": "https://node1.server1.devnet.carmentis.io",
                "p2pEndpoint": "http://server1.devnet.carmentis.io:26656",
                "isGenesis": true,
                "nodeId": "82958a461e6b85405a83fd1958d21a69c2dceaed"
            },
            "node2.server2.devnet.carmentis.io": {
                "hostname": "node2.server2.devnet.carmentis.io",
                "rpcEndpoint": "https://node2.server2.devnet.carmentis.io",
                "p2pEndpoint": "node2.server2.devnet.carmentis.io:26656",
                "isGenesis": false,
                "nodeId": "8a322c84cea1d33e6f0efb674a2967dcf7955b4a"
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
}

export function getDefaultNetworks() {
    return networks;
}
