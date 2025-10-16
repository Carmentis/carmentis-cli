#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const keygen_1 = require("./commands/keygen");
const networks_1 = require("./commands/networks");
const commander_1 = require("commander");
const init_1 = require("./commands/init");
const bootstrap = async () => {
    console.log('Carmentis Node');
    // create the description of the binary
    const program = new commander_1.Command("cmts-node");
    program.name('Carmentis Node CLI').description('CLI for Carmentis Node');
    // register additional commands
    new keygen_1.KeygenCommand().register(program);
    new networks_1.NetworksCommand().register(program);
    new init_1.InitConfigCommand().register(program);
    program.parse(process.argv);
};
bootstrap();
