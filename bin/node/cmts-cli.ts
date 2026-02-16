#!/usr/bin/env node
import { KeygenCommand } from './commands/KeygenCommand';
import { NetworksCommand } from './commands/NetworksCommand';
import { Command } from 'commander';
import {NodeCommand} from "./commands/node/NodeCommand";
import {DockerCommand} from "./commands/DockerCommand";
import {OperatorInitCommand} from "./commands/operator/OperatorInitConfigCommand";
import {OperatorCommand} from "./commands/operator/OperatorCommand";
import {CryptoCommand} from "./commands/crypto/CryptoCommand";
import {UnsafeBetaCommand} from "./commands/unsafe-beta/UnsafeBetaCommand";

const bootstrap = async () => {
    // create the description of the binary
    const program = new Command("cmts");
    program.name('Carmentis CLI').description('CLI for Carmentis');

    // register top-level commands
    NodeCommand.register(program);
    OperatorCommand.register(program);
    KeygenCommand.register(program);
    new NetworksCommand().register(program);
    new DockerCommand().register(program);
    CryptoCommand.register(program);
    UnsafeBetaCommand.register(program);

    program.parse(process.argv);
};

bootstrap();
