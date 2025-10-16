#!/usr/bin/env node
import { KeygenCommand } from './commands/keygen';
import { NetworksCommand } from './commands/networks';
import { Command } from 'commander';
import {NodeCommand} from "./commands/node";
import {DockerCommand} from "./commands/docker";

const bootstrap = async () => {
    // create the description of the binary
    const program = new Command("cmts");
    program.name('Carmentis CLI').description('CLI for Carmentis');

    // register top-level commands
    new NodeCommand().register(program);
    new KeygenCommand().register(program);
    new NetworksCommand().register(program);
    new DockerCommand().register(program);

    program.parse(process.argv);
};

bootstrap();
