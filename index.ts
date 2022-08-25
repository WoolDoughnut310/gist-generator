#!/usr/bin/env node

import { createOAuthDeviceAuth } from "@octokit/auth-oauth-device";
import { Octokit } from "@octokit/rest";
import * as readline from "readline";

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});
rl.setPrompt(":");

let octokit: Octokit;
let markdown = "";
let newlines = 2;

const resetInput = () => {
    markdown = "";
    newlines = 2;
};

const question = (prompt: string) => {
    return new Promise<string>((resolve, reject) => {
        rl.question(prompt, resolve);
    });
};

const readLines = () => {
    rl.on("line", async (input) => {
        input = input.trimEnd();
        markdown += input + "\n";

        if (input === "") {
            newlines--;
        } else {
            newlines = 2;
        }

        if (newlines === 0) {
            const fileName = await question("Filename: ");
            const content = markdown.trim();

            if (!fileName) {
                resetInput();
                prompt();
                return;
            }

            const response = await octokit.rest.gists.create({
                public: true,
                files: {
                    [fileName]: {
                        content,
                    },
                },
            });

            console.log(response.data.html_url);

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
