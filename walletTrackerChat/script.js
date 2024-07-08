// script.js

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Function to execute a shell command
const executeCommand = (command) => {
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error executing ${command}: ${error}`);
                reject(error);
            } else {
                console.log(`Executed: ${command}`);
                resolve(stdout ? stdout : stderr);
            }
        });
    });
};

// Function to check if a file exists
const fileExists = (filePath) => {
    try {
        return fs.existsSync(filePath);
    } catch (err) {
        console.error(`Error checking ${filePath} existence: ${err}`);
        return false;
    }
};

// List of commands to execute
const commands = [];

// Example: Check if .env.example exists before attempting to copy
const envExamplePath = './.env.example';
const envPath = './.env';

if (fileExists(envExamplePath)) {
    commands.push(`cp ${envExamplePath} ${envPath}`);
} else {
    console.error(`File ${envExamplePath} does not exist.`);
}

// Example commands: npm install and npm start
commands.push('npm install');
commands.push('npm start');

// Execute each command sequentially
const executeCommands = async () => {
    for (let command of commands) {
        try {
            await executeCommand(command);
        } catch (error) {
            console.error(`Failed to execute ${command}: ${error}`);
            process.exit(1);  // Exit with error
        }
    }
    console.log('All commands executed successfully!');
};

executeCommands();
