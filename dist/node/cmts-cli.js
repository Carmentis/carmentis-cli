#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const keygen_1 = require("./commands/keygen");
const networks_1 = require("./commands/networks");
const commander_1 = require("commander");
const node_1 = require("./commands/node");
const bootstrap = async () => {
    // create the description of the binary
    const program = new commander_1.Command("cmts");
    program.name('Carmentis CLI').description('CLI for Carmentis');
    // register top-level commands
    new node_1.NodeCommand().register(program);
    new keygen_1.KeygenCommand().register(program);
    new networks_1.NetworksCommand().register(program);
    program.parse(process.argv);
};
bootstrap();
