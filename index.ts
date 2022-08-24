#!/usr/bin/env node

import { createOAuthDeviceAuth } from "@octokit/auth-oauth-device";
import { Octokit } from "@octokit/rest";
import * as readline from "readline";

const CODE_REGEX = /```(?:.+)?\n(?:\/\/|#)\s+(.+)\n((?:.|\n)+?)\n+```/;

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

let octokit: Octokit;
let markdown = "";
let newlines = 2;

const resetInput = () => {
    markdown = "";
    newlines = 2;
};

const readLines = () => {
    rl.on("line", async (input) => {
        input = input.trimEnd();
        markdown += input + "\n";

        if (input === "") {
            newlines--;
        }

        if (newlines === 0) {
            const parsedInput = parseMarkdown(markdown);

            if (!parsedInput) {
                resetInput();
                return;
            }

            const [fileName, content] = parsedInput;

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

const parseMarkdown = (markdown: string) => {
    let match = CODE_REGEX.exec(markdown);

    if (!match) {
        return;
    }

    const fileName = match[1];
    const content = match[2];
    return [fileName, content];
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
