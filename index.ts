#!/usr/bin/env node

import { createOAuthDeviceAuth } from "@octokit/auth-oauth-device";
import { Octokit } from "@octokit/rest";
import * as readline from "readline";
import clipboard from "clipboardy";

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});
rl.setPrompt(":");

let octokit: Octokit;
let content = "";
let newlines = 2;

const resetInput = () => {
    content = "";
    newlines = 2;
};

const question = (prompt: string) => {
    return new Promise<string>((resolve, reject) => {
        rl.question(prompt, resolve);
    });
};

const readLines = () => {
    rl.on("line", async (input) => {
        // line feeds can appear in copied code
        input = input.replace("\r", "");

        // Append the line to the code content
        content += input + "\n";

        if (input === "") {
            newlines--;
        } else {
            newlines = 2;
        }

        // Once 2 blank lines have been entered
        if (newlines === 0) {
            const fileName = await question("Filename: ");
            content = content.trim();

            if (!fileName) {
                // Clear the current content
                resetInput();
                prompt();
                return;
            }

            // Create a public gist
            const response = await octokit.rest.gists.create({
                public: true,
                files: {
                    [fileName]: {
                        content,
                    },
                },
            });

            // Output the link to the gist
            const url = response.data.html_url;

            console.log(url);

            if (url) {
                await clipboard.write(url ?? "");
                console.log("Copied to clipboard");
            }

            resetInput();
        }

        rl.prompt();
    });
};

const auth = createOAuthDeviceAuth({
    clientType: "oauth-app",
    clientId: "4bec01f9c58a6489e727",
    scopes: ["gist"],
    onVerification(verification) {
        console.log("Open %s", verification.verification_uri);
        console.log("Enter code: %s", verification.user_code);
    },
});

async function main() {
    const tokenAuthentication = await auth({
        type: "oauth",
    });
    console.log("Authenticated.");

    octokit = new Octokit({
        auth: tokenAuthentication.token,
    });

    rl.prompt();
    readLines();
}

main();

export default main;
