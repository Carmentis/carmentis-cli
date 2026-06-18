#!/usr/bin/env node
import { KeygenCommand } from './commands/crypto/KeygenCommand';
import { NetworksCommand } from './commands/NetworksCommand';
import { Command } from 'commander';
import {NodeCommand} from "./commands/node/NodeCommand";
import {DockerCommand} from "./commands/DockerCommand";
import {OperatorInitCommand} from "./commands/operator/OperatorInitConfigCommand";
import {OperatorCommand} from "./commands/operator/OperatorCommand";
import {CryptoCommand} from "./commands/crypto/CryptoCommand";
import {UnsafeBetaCommand} from "./commands/unsafe-beta/UnsafeBetaCommand";
import updateNotifier from 'update-notifier';
import packageJson from '../../package.json';
import {CometBFTCommand} from "./commands/CometBFTCommand";


// Checks for available update and returns an instance
const notifier = updateNotifier({
    pkg: packageJson,
    updateCheckInterval: 0,
});

// Notify using the built-in convenience method




const bootstrap = async () => {
    // `notifier.update` contains some useful info about the update
    const updateInfo = await notifier.fetchInfo();

    if (updateInfo.current !== updateInfo.latest && false) {
        console.log(`Please, update the CLI to the latest version: ${updateInfo.current} - ${updateInfo.latest}`);
        console.log(`You can update the CLI by running: npm i -g @cmts-dev/carmentis-cli`);
    } else {
        // create the description of the binary
        const program = new Command("cmts");
        program.name('Carmentis CLI').description('CLI for Carmentis');

        // register top-level commands
        CometBFTCommand.register(program);
        NodeCommand.register(program);
        OperatorCommand.register(program);
        new NetworksCommand().register(program);
        new DockerCommand().register(program);
        CryptoCommand.register(program);
        UnsafeBetaCommand.register(program);

        program.parse(process.argv);
    }


};

bootstrap();
