const fs = require('fs');
const readline = require('readline');
const path = require('path');
// const chalk = require('chalk');
const { exec } = require('child_process');

// Path to Wallet Tracker Settings
const WALLET_TRACKER_SETTINGS_PATH = 'src/showrunners/walletTracker/walletTrackerSettings.json';

// Function to prompt user for input
const promptInput = (question) => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
};

// Function to read the .env.sample file
const readSampleFile = (file) => {
  return new Promise((resolve, reject) => {
    fs.readFile(file, 'utf8', (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
};

// Function to write the .env file
const writeEnvFile = (content) => {
  return new Promise((resolve, reject) => {
    fs.writeFile('.env', content, 'utf8', (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

// Function to run 'yarn install'
const runYarnInstall = () => {
  return new Promise((resolve, reject) => {
    exec('yarn install', (err, stdout, stderr) => {
      if (err) {
        reject(err);
      } else {
        console.log(stdout);
        console.error(stderr);
        resolve();
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

const banner = () => {
  console.log('\n**********************************************************');
    console.log('///////////////// WALLET TRACKER CHANNEL SETUP /////////////');
    console.log('**********************************************************\n');
};

const run = async () => {
  const sampleContentEnvSample = await readSampleFile('.env.sample');
  const sampleContentSettings = await readSampleFile(WALLET_TRACKER_SETTINGS_PATH);
  const settings = JSON.parse(sampleContentSettings)

  const privateKey = await promptInput("Please enter your Private Key: ");
  settings.providerUrl = await promptInput("Please enter Eth Sepolia Provider: ");
  settings.coindarApiKey = await promptInput("Please enter your Coindar API key: ");
  settings.etherscanApiKey = await promptInput("Please enter your Etherscan API Key: ");
  settings.covalentApiKey = await promptInput("Please enter your Covalent API Key: ");
  settings.alchemyApiKey = await promptInput("Please enter your Alchemy API Key: ");

  const updatedPrivateKey = `0x${privateKey}`;
  const updatedContent = sampleContentEnvSample.replace('your_private_key_here', updatedPrivateKey);

  try {
    // Task 1: Create the .env file with private key
    await writeEnvFile(updatedContent);
    console.log('\n.env file created successfully!');

    // Task 2: Update walletTrackerSettings.json with API Keys
    fs.writeFileSync(WALLET_TRACKER_SETTINGS_PATH, JSON.stringify(settings, null, 2), 'utf8');
    console.log('walletTrackerSettings.json file updated successfully!');

    // Task 3: Run `yarn install`
    await runYarnInstall();
    console.log('yarn install executed successfully!');
    
    // Run docker compose up here
     
    // --------------------------
    console.log('\nRun `yarn run dev` to fire up your channel');
    
  } catch (error) {
    console.error('Error writing files:', error);
  }
}

// Main function to execute the script
const main = async () => {
  try {
    // Display Banner
    banner();

    if (fileExists("./.env")) {
      console.log("You already have `.env` file present!");
      const overwrite = await promptInput(
        "\nDo you want to overwrite [Y]/[N] ? "
      );

      if (overwrite.charAt(0).toUpperCase() == "Y") {
        console.log("\nOverwriting existing files...");

        // Run entire setup
        await run();
      }

      if (overwrite.charAt(0).toUpperCase() == "N") {
        console.log("\nExecuting `yarn install`. Please wait...");

        // Task 4: Run `yarn install`
        await runYarnInstall();
        console.log('yarn install executed successfully!');

        console.log('\nRun `yarn run dev` to fire up your channel');
      }

    } else {
      // Run entire setup
      await run();
    }
  } catch (readErr) {
    console.error('Error reading .env.sample file:', readErr);
  }
};

// Execute the main function
main();