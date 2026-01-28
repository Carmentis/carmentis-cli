#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const KeygenCommand_1 = require("./commands/KeygenCommand");
const NetworksCommand_1 = require("./commands/NetworksCommand");
const commander_1 = require("commander");
const NodeCommand_1 = require("./commands/node/NodeCommand");
const DockerCommand_1 = require("./commands/DockerCommand");
const OperatorCommand_1 = require("./commands/operator/OperatorCommand");
const ValidatorCommand_1 = require("./commands/validator/ValidatorCommand");
const CryptoCommand_1 = require("./commands/crypto/CryptoCommand");
const UnsafeBetaCommand_1 = require("./commands/unsafe-beta/UnsafeBetaCommand");
const bootstrap = async () => {
    // create the description of the binary
    const program = new commander_1.Command("cmts");
    program.name('Carmentis CLI').description('CLI for Carmentis');
    // register top-level commands
    NodeCommand_1.NodeCommand.register(program);
    ValidatorCommand_1.ValidatorCommand.register(program);
    OperatorCommand_1.OperatorCommand.register(program);
    KeygenCommand_1.KeygenCommand.register(program);
    new NetworksCommand_1.NetworksCommand().register(program);
    new DockerCommand_1.DockerCommand().register(program);
    CryptoCommand_1.CryptoCommand.register(program);
    UnsafeBetaCommand_1.UnsafeBetaCommand.register(program);
    program.parse(process.argv);
};
bootstrap();
