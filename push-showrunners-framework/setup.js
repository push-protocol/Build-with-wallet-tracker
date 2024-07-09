const fs = require('fs');
const readline = require('readline');
const path = require('path');
// const chalk = require('chalk');
const { exec } = require('child_process');

// Create an interface for reading input from the terminal
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Function to read the .env.sample file
const readSampleFile = () => {
  return new Promise((resolve, reject) => {
    fs.readFile('.env.sample', 'utf8', (err, data) => {
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

// Function to write the walletTrackerKeys.json file
const writeWalletTrackerKeysFile = (privateKey) => {
  const walletTrackerKeysContent = {
    PRIVATE_KEY_NEW_STANDARD: {
      PK: `0x${privateKey}`,
      CHAIN_ID: 'eip155:11155111',
    },
    PRIVATE_KEY_OLD_STANDARD: `0x${privateKey}`,
  };

  const walletTrackerKeysPath = path.join('src', 'sample_showrunners', 'walletTracker', 'walletTrackerKeys.json');
  const walletTrackerKeysDir = path.dirname(walletTrackerKeysPath);

  // Ensure the directory exists
  fs.mkdirSync(walletTrackerKeysDir, { recursive: true });

  return new Promise((resolve, reject) => {
    fs.writeFile(walletTrackerKeysPath, JSON.stringify(walletTrackerKeysContent, null, 2), 'utf8', (err) => {
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

// Function to move the walletTracker folder
const moveWalletTrackerFolder = () => {
  const srcPath = path.join('src', 'sample_showrunners', 'walletTracker');
  const destPath = path.join('src', 'showrunners', 'walletTracker');

  return new Promise((resolve, reject) => {
    fs.rename(srcPath, destPath, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

// Main function to execute the script
const main = async () => {
  try {
    // console.log(chalk.yellow("\n**********************************************************"))
    // console.log(chalk.yellow("///////////////// WALLET TRACKER CHANNEL SETUP /////////////"))
    // console.log(chalk.yellow("**********************************************************\n"))
    console.log('\n**********************************************************');
    console.log('///////////////// WALLET TRACKER CHANNEL SETUP /////////////');
    console.log('**********************************************************\n');

    const sampleContent = await readSampleFile();

    rl.question('Please enter your private key: ', async (privateKey) => {
      const updatedPrivateKey = `0x${privateKey}`;
      const updatedContent = sampleContent.replace('your_private_key_here', updatedPrivateKey);

      try {
        await writeEnvFile(updatedContent);
        console.log('\n.env file created successfully!');

        await writeWalletTrackerKeysFile(privateKey);
        console.log('walletTrackerKeys.json file created successfully!');

        await moveWalletTrackerFolder();
        console.log('walletTracker folder moved successfully!');

        await runYarnInstall();
        console.log('yarn install executed successfully!');

        console.log('\nRun `yarn start` to fire up your channel');
      } catch (err) {
        console.error('Error writing files:', err);
      } finally {
        rl.close();
      }
    });
  } catch (readErr) {
    console.error('Error reading .env.sample file:', readErr);
  }
};

// Execute the main function
main();
