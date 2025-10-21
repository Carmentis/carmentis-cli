import commander from "commander";


export class VersionSubCommand {
    static  register(program: commander.Command) {
        program
            .command("version")
            .action(() => {

            })
    }
}