"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SafeCommandRunner = void 0;
class SafeCommandRunner {
    static async safeRun(runner) {
        const safeRunner = new SafeCommandRunner(runner);
        await safeRunner.run();
    }
    constructor(runner) {
        this.runner = runner;
    }
    async run() {
        try {
            await this.runner();
        }
        catch (error) {
            console.error(error);
            if (error instanceof Error) {
                console.error(error.message);
            }
            else {
                console.error(error);
            }
        }
    }
}
exports.SafeCommandRunner = SafeCommandRunner;
