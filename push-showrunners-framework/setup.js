const fs = require('fs');
const readline = require('readline');
// const chalk = require('chalk');
const { exec } = require('child_process');

// Path to Wallet Tracker Settings

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

  const privateKey = await promptInput("Please enter your Private Key: ");
  const providerUrl = await promptInput("Please enter Eth Sepolia Provider: ");
  const coindarApiKey = await promptInput("Please enter your Coindar API key: ");
  const etherscanApiKey = await promptInput("Please enter your Etherscan API Key: ");
  const covalentApiKey = await promptInput("Please enter your Covalent API Key: ");
  const alchemyApiKey = await promptInput("Please enter your Alchemy API Key: ");

  const updatedPrivateKey = `0x${privateKey}`;
  let updatedContent = sampleContentEnvSample.replace('your_private_key_here', updatedPrivateKey);
  updatedContent = updatedContent.replace('your_provider_url_here', providerUrl);
  updatedContent = updatedContent.replace('your_coindar_api_key_here', coindarApiKey);
  updatedContent = updatedContent.replace('your_etherscan_api_key_here', etherscanApiKey);
  updatedContent = updatedContent.replace('your_covalent_api_key_here', covalentApiKey);
  updatedContent = updatedContent.replace('your_alchemy_api_key_here', alchemyApiKey);

  try {
    // Task 1: Create the .env file with private key
    await writeEnvFile(updatedContent);
    console.log('\n.env file created successfully!');

    // Task 2: Run `yarn install`
    console.log('Running `yarn install`. Please wait...');
    await runYarnInstall();
    console.log('yarn install executed successfully!');
    
    console.log('\nOpen up a new terminal and run `docker-compose up`.');
    console.log('Run `yarn run dev` to fire up your channel');
    
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

        console.log('\nOpen up a new terminal and run `docker-compose up`.');
        console.log('Run `yarn run dev` to fire up your channel');
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