#!/usr/bin/env node
import { KeygenCommand } from './commands/keygen';
import { NetworksCommand } from './commands/networks';
import { Command } from 'commander';
import { InitConfigCommand } from './commands/init';

const bootstrap = async () => {
    console.log('Carmentis Node');
    // create the description of the binary
    const program = new Command("cmts-node");
    program.name('Carmentis Node CLI').description('CLI for Carmentis Node');


    // register additional commands
    new KeygenCommand().register(program);
    new NetworksCommand().register(program);
    new InitConfigCommand().register(program)

    program.parse(process.argv);
};

bootstrap();
