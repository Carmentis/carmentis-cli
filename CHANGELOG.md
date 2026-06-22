# [1.16.0](https://github.com/Carmentis/carmentis-cli/compare/v1.15.7...v1.16.0) (2026-06-22)


### Features

* addition of default logs configuration for abci config generator ([b273e5e](https://github.com/Carmentis/carmentis-cli/commit/b273e5e8a1e130b03042422d43e92dfbb48c31f0))

## [1.15.7](https://github.com/Carmentis/carmentis-cli/compare/v1.15.6...v1.15.7) (2026-06-22)


### Bug Fixes

* remove protocol from rpc server format ([96333b6](https://github.com/Carmentis/carmentis-cli/commit/96333b6fda5bd5eb956a580a89d10d0b1d512fe9))

## [1.15.6](https://github.com/Carmentis/carmentis-cli/compare/v1.15.5...v1.15.6) (2026-06-22)


### Bug Fixes

* invalid state sync rpc servers format ([82c6dc6](https://github.com/Carmentis/carmentis-cli/commit/82c6dc6fd4d4631d8b22162ce42de254b51bfa0b))

## [1.15.5](https://github.com/Carmentis/carmentis-cli/compare/v1.15.4...v1.15.5) (2026-06-22)


### Bug Fixes

* invalid state sync rpc servers format ([29affce](https://github.com/Carmentis/carmentis-cli/commit/29affce80121475f8321c7c8c5a957dad18a6a5e))

## [1.15.4](https://github.com/Carmentis/carmentis-cli/compare/v1.15.3...v1.15.4) (2026-06-22)


### Bug Fixes

* invalid node id for node 2 ([c895a1e](https://github.com/Carmentis/carmentis-cli/commit/c895a1eb8395929f6b168e5cfc4df07e816557dd))

## [1.15.3](https://github.com/Carmentis/carmentis-cli/compare/v1.15.2...v1.15.3) (2026-06-22)


### Bug Fixes

* invalid p2p for node1 ([6f82553](https://github.com/Carmentis/carmentis-cli/commit/6f8255324f4d461ff621fe8d251d212331e4e07e))

## [1.15.2](https://github.com/Carmentis/carmentis-cli/compare/v1.15.1...v1.15.2) (2026-06-22)


### Bug Fixes

* re-enable `user` field in NodeConfigGenerator with previous caveat noted ([29451dd](https://github.com/Carmentis/carmentis-cli/commit/29451dd849986e6b5e7fc124d74c7787ac1d67d7))
* temporarily disable `user` field in NodeConfigGenerator due to unexpected behavior ([766125f](https://github.com/Carmentis/carmentis-cli/commit/766125f3553aa8efd6456cff29f5eb0598f5aabe))
* user in the docker compose and state-sync port adjustments ([51f2013](https://github.com/Carmentis/carmentis-cli/commit/51f2013d3e4fa07504236ec83e29119ce0eecf09))

## [1.15.1](https://github.com/Carmentis/carmentis-cli/compare/v1.15.0...v1.15.1) (2026-06-18)


### Bug Fixes

* enable CLI update notification logic by removing false condition ([394a018](https://github.com/Carmentis/carmentis-cli/commit/394a018924c7885ff7244eb9941601357af3b935))

# [1.15.0](https://github.com/Carmentis/carmentis-cli/compare/v1.14.0...v1.15.0) (2026-06-16)


### Features

* add CometBFT key management and signing/verification commands ([d1c1aff](https://github.com/Carmentis/carmentis-cli/commit/d1c1aff231bd34029f31ab6e282e5373fe9df18f))
* add KeygenCommand to CryptoCommand and update import path ([17df772](https://github.com/Carmentis/carmentis-cli/commit/17df7726bb7fc4b85b2449c59afe2eea5f66898a))
* add KeygenCommand to CryptoCommand and update import path ([1c5c400](https://github.com/Carmentis/carmentis-cli/commit/1c5c40046ebb4925a0f468979e0fcfaefc31b44e))

# [1.14.0](https://github.com/Carmentis/carmentis-cli/compare/v1.13.0...v1.14.0) (2026-06-15)


### Features

* add new devnet node "node3.server3.devnet.carmentis.io" to default networks configuration ([a9a52bd](https://github.com/Carmentis/carmentis-cli/commit/a9a52bdf4c9ac855b95f4e9fbcc720cf88691c5e))

# [1.13.0](https://github.com/Carmentis/carmentis-cli/compare/v1.12.1...v1.13.0) (2026-06-15)


### Bug Fixes

* correct typings and simplify node recovery logic ([36fb579](https://github.com/Carmentis/carmentis-cli/commit/36fb5790554786381be9fb7dbabd42463e4bd67b))
* typing and user uid/gid setting ([03d8b5a](https://github.com/Carmentis/carmentis-cli/commit/03d8b5a88409943d065d727470d865546d007a27))
* update NodeConfigGenerator to use correct cometbft config path ([842b6bf](https://github.com/Carmentis/carmentis-cli/commit/842b6bfd4eab675d0d1fcbfb9654cd4e3af79068))


### Features

* add CLI update notification check ([0b134d2](https://github.com/Carmentis/carmentis-cli/commit/0b134d2182bd471a8d03fd8b74a65a6228c4d223))
* enable JSON module resolution and add update-notifier dependency ([62ed84d](https://github.com/Carmentis/carmentis-cli/commit/62ed84d81478cae136afadac0896b1b8520fb879))
* enhance GenesisNodeConfigParamsResolver with network validation and ABCI label selection ([58dc51e](https://github.com/Carmentis/carmentis-cli/commit/58dc51e5bd88514fb8d66964ab6807068d0bba24))
* introduce ABCI configuration and enhanced network management ([7e3c2fd](https://github.com/Carmentis/carmentis-cli/commit/7e3c2fdf92d6b453d7c045f0a27a09539a040e58))

## [1.12.1](https://github.com/Carmentis/carmentis-cli/compare/v1.12.0...v1.12.1) (2026-03-04)


### Bug Fixes

* use dynamic UID in docker commands for NodeResetCommand and CometBFTBinary ([67e65d5](https://github.com/Carmentis/carmentis-cli/commit/67e65d58102a36155368592cfff61bb511dbd562))

# [1.12.0](https://github.com/Carmentis/carmentis-cli/compare/v1.11.1...v1.12.0) (2026-03-04)


### Features

* add network configuration to NodeConfigParamsResolver and NodeConfigGenerator ([6ffa132](https://github.com/Carmentis/carmentis-cli/commit/6ffa132c909a857fe0d8d97edb7330bab92ff461))

## [1.11.1](https://github.com/Carmentis/carmentis-cli/compare/v1.11.0...v1.11.1) (2026-03-04)


### Bug Fixes

* check stateSync.enabled before enabling RPC servers ([71db993](https://github.com/Carmentis/carmentis-cli/commit/71db993cac04a7eb8283ec847960d12685c940b3))

# [1.11.0](https://github.com/Carmentis/carmentis-cli/compare/v1.10.1...v1.11.0) (2026-02-16)


### Bug Fixes

* adjust snapshot configuration in AbciConfigGenerator ([1c8d4c0](https://github.com/Carmentis/carmentis-cli/commit/1c8d4c0d077f619974e2ee80fb9903693bb60c06))


### Features

* add minimum gas configuration for nodes ([231109b](https://github.com/Carmentis/carmentis-cli/commit/231109b6486d9f97d8fa46cad8b42ea8d3e22135))

## [1.10.1](https://github.com/Carmentis/carmentis-cli/compare/v1.10.0...v1.10.1) (2026-02-03)


### Bug Fixes

* update docker command in NodeResetCommand to specify user and correct image version ([7e0d3de](https://github.com/Carmentis/carmentis-cli/commit/7e0d3de6af71a7d2940f3af17ced27014e18dd11))

# [1.10.0](https://github.com/Carmentis/carmentis-cli/compare/v1.9.1...v1.10.0) (2026-02-03)


### Features

* support seed node configuration in networks module ([10da4d4](https://github.com/Carmentis/carmentis-cli/commit/10da4d442c03b3c4f65a65f626875e3687f3870f))

## [1.9.1](https://github.com/Carmentis/carmentis-cli/compare/v1.9.0...v1.9.1) (2026-02-03)


### Bug Fixes

* update container names in NodeInspectCommand for consistency ([63d5e14](https://github.com/Carmentis/carmentis-cli/commit/63d5e1495c05113789d5d40aa4c844213e4675a1))

# [1.9.0](https://github.com/Carmentis/carmentis-cli/compare/v1.8.0...v1.9.0) (2026-02-03)


### Features

* add inspect command to node module ([c0eaffa](https://github.com/Carmentis/carmentis-cli/commit/c0eaffae0aaac97974eda41d706e97856fe1d96c))

# [1.8.0](https://github.com/Carmentis/carmentis-cli/compare/v1.7.1...v1.8.0) (2026-02-03)


### Features

* default empty block creation interval to 30s ([57a56b5](https://github.com/Carmentis/carmentis-cli/commit/57a56b5180a65cb17420ee4429cae9202646e4d5))
* node reset and check-update ([8c0e3c5](https://github.com/Carmentis/carmentis-cli/commit/8c0e3c502033926c9f3d44c2ba58f52cded4062e))

## [1.7.1](https://github.com/Carmentis/carmentis-cli/compare/v1.7.0...v1.7.1) (2026-01-28)


### Bug Fixes

* specify argument type for filter option in networks export command ([2df3267](https://github.com/Carmentis/carmentis-cli/commit/2df32674c45c4f4e6d91e0057ba03ec5ac12f44d))

# [1.7.0](https://github.com/Carmentis/carmentis-cli/compare/v1.6.0...v1.7.0) (2026-01-28)


### Features

* add convert-token command and improve network management in CLI ([8e8b116](https://github.com/Carmentis/carmentis-cli/commit/8e8b11630fb29055c5e8e8767c8b177fabfc5142))

# [1.6.0](https://github.com/Carmentis/carmentis-cli/compare/v1.5.0...v1.6.0) (2026-01-28)


### Features

* add unsafe-beta commands for ABCI config and Docker Compose generation in the CLI ([a5cf733](https://github.com/Carmentis/carmentis-cli/commit/a5cf733a17049c5ca3108e9b4cefd1086bdb2eb6))

# [1.5.0](https://github.com/Carmentis/carmentis-cli/compare/v1.4.1...v1.5.0) (2026-01-28)


### Bug Fixes

* invalid cometbft docker image used to generate the config ([8bafc69](https://github.com/Carmentis/carmentis-cli/commit/8bafc692f0e2f65ce4de07e401796b1ea000e5c2))


### Features

* upgrade of the CLI to use CometBFT 0.38 + minor fixs to match SDK 1.18.1 ([4a7e37f](https://github.com/Carmentis/carmentis-cli/commit/4a7e37f0ba606687fb2e1dede6d639f23fffeffd))
* wallet crypto ([3c53815](https://github.com/Carmentis/carmentis-cli/commit/3c53815e2e1a5f7e2a4635ab903f7d9efafb7b09))

## [1.4.1](https://github.com/Carmentis/carmentis-cli/compare/v1.4.0...v1.4.1) (2025-10-21)


### Bug Fixes

* typos in the config creation success message ([da0a70c](https://github.com/Carmentis/carmentis-cli/commit/da0a70c10453fee0dfbc35d710f8adc53d1af751))

# [1.4.0](https://github.com/Carmentis/carmentis-cli/compare/v1.3.1...v1.4.0) (2025-10-21)


### Features

* validator (node+operator) supported by the CLI ([04b24d0](https://github.com/Carmentis/carmentis-cli/commit/04b24d0d7842522418f7e372c7e537800d36e879))

## [1.3.1](https://github.com/Carmentis/carmentis-cli/compare/v1.3.0...v1.3.1) (2025-10-20)


### Bug Fixes

* show deleted directory before to delete ([178c3b3](https://github.com/Carmentis/carmentis-cli/commit/178c3b32803d6851f8c8c25100b4bc89bc2dd3cb))

# [1.3.0](https://github.com/Carmentis/carmentis-cli/compare/v1.2.0...v1.3.0) (2025-10-20)


### Features

* addition of operator config generation ([4dfebdd](https://github.com/Carmentis/carmentis-cli/commit/4dfebdd8f833722f473e06ab6e1241ea69578cbe))

# [1.2.0](https://github.com/Carmentis/carmentis-cli/compare/v1.1.1...v1.2.0) (2025-10-16)


### Features

* execution do not require go and cometbft to be installed anymore ([3188bda](https://github.com/Carmentis/carmentis-cli/commit/3188bda335af078becdc6e8c12e70d9794605e8a))

## [1.1.1](https://github.com/Carmentis/carmentis-cli/compare/v1.1.0...v1.1.1) (2025-10-16)


### Bug Fixes

* remove built output from versioning ([118b6fa](https://github.com/Carmentis/carmentis-cli/commit/118b6fa90cb0665e71171e29ad9a779145bed953))

# [1.1.0](https://github.com/Carmentis/carmentis-cli/compare/v1.0.0...v1.1.0) (2025-10-16)


### Features

* general purpose CLI naming ([92aaf72](https://github.com/Carmentis/carmentis-cli/commit/92aaf72daba6d11281c7b7196c8df0d54e816c9f))

# 1.0.0 (2025-10-16)


### Bug Fixes

* invalid npm token env var ([1c98a52](https://github.com/Carmentis/carmentis-cli/commit/1c98a529c5ef832762e752ba7f3578a4c4848eb8))
* sync package.json and package-lock.json ([3ce0dc3](https://github.com/Carmentis/carmentis-cli/commit/3ce0dc39b0e1aa2e1118199d8ecd9fd0935caa44))


### Features

* initial commit ([8c54e48](https://github.com/Carmentis/carmentis-cli/commit/8c54e480bef3062db06244edf6cf1b2777a9b135))
