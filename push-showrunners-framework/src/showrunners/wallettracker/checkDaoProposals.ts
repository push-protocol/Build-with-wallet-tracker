import { ethers } from "ethers";
import { CovalentClient } from "@covalenthq/client-sdk";
import { CONSTANTS, PushAPI } from "@pushprotocol/restapi";
import { keys } from "./wallettrackerKeys";
import { settings } from "./wallettrackerSettings";
import wtChannel from "./wallettrackerChannel";
import { Container } from "typedi";
import { daoDataModel } from "./wallettrackerModel";
import axios from "axios";
const channelAddress = settings.channelAddress;

//Update Data
let channel;
try {
  channel = Container.get(wtChannel);
} catch (error) {
  console.log("Error: ", error);
}

export async function checkDaoProposals() {
  try {
    const channel = Container.get(wtChannel);
    const client = new CovalentClient(settings.covalentApiKey);
    //  channel.logInfo("Key:",settings.covalentApiKey);
    const title = `DAO Proposals`;
    const message = `Here are some active dao Proposals that you can vote on !`;
    let cta;
    channel.logInfo("5---Fetching Dao Proposals----5");
    // Initializing userAlice
    const provider = new ethers.providers.JsonRpcProvider(settings.providerUrl);

    const signer = new ethers.Wallet(
      keys.PRIVATE_KEY_NEW_STANDARD.PK,
      provider
    );
    const userAlice = await PushAPI.initialize(signer, {
      env: CONSTANTS.ENV[process.env.SHOWRUNNERS_ENV],
    });
    let hasMoreSubscribers = true;
    let page = 1;
    let daoData = await daoDataModel.find({ _id: "Dao" });

    //  console.log("Data before addition : ",daoData);
    while (hasMoreSubscribers) {
      const userData: any = await userAlice.channel.subscribers({
        page: page,
        limit: 30,
        setting: true,
        channel: settings.channelAddress,
      });
      if (userData.itemcount > 0) {
        const subscribers = userData.subscribers;
        // console.log(subscribers);
        for (let j = 0; j < subscribers.length; j++) {
          if (subscribers[j].settings !== null) {
            const chSettings = JSON.parse(subscribers[j].settings)[3];
            if (chSettings.user === true) {
              let currentTokens = [];
              let userToCheck = subscribers[j].subscriber;
              const resp =
                await client.BalanceService.getTokenBalancesForWalletAddress(
                  "eth-mainnet",
                  userToCheck
                );

              let amount = 0;
              let payloadMsg = "";
              let items;
              if (!resp.error) {
                items = resp.data.items;
                items.map(async (item: any) => {
                  let tokenBalance = Number(
                    ethers.utils.formatUnits(
                      item.balance,
                      item.contract_decimals
                    )
                  ).toFixed(4);
                  amount = Number(
                    amount + item.quote_rate * Number(tokenBalance)
                  );
                  if (item.quote_rate * Number(tokenBalance) > 0.5) {
                    tokenBalance = tokenBalance.replace(/\.?0+$/, "");
                    //Do comparision here and then add tokens
                    currentTokens.push(item.contract_ticker_symbol);
                    addKeyValueToDocument(
                      item.contract_ticker_symbol,
                      userToCheck
                    );
                  }
                });
                removeExtraTokens(currentTokens, userToCheck);
              }
            }
          }
        }
        page++; // Increment the page number
      } else {
        hasMoreSubscribers = false; // Exit the loop when there are no more subscribers
      }
    }
  } catch (error) {
    channel.logInfo(`Error in FetchBalanceMain : ${error}`);
  }
}

//checked
export async function triggerDaoNotifications(proposalId: string) {
  const channel = Container.get(wtChannel);
  proposalId = proposalId.split("/")[1];
  channel.logInfo(`Got dao proposal with id : ${proposalId}`);

  const query = `
  query proposal {
proposals(
  where: {id: "${proposalId}" , state:"active",space_verified:true},
)

  {
    title
    id
    space{
      name
    }
    end
    state
    link
    symbol
  }
}
`;
  try {
    const response = await axios.post(
      "https://hub.snapshot.org/graphql",
      { query }, // Request body containing the query
      { headers: { "Content-Type": "application/json" } } // Set the content type
    );
    let proposal = response.data.data.proposals[0];
    if (proposal) {
      let title = proposal.title;
      let link = proposal.link;
      let daoName = proposal.space.name;
      let tokenSymbol = proposal.symbol;
      let endDateTime = proposal.end;

      const endDate = new Date(endDateTime * 1000);

      let date = endDate.getDate();
      let month = endDate.getMonth() + 1;
      let year = endDate.getFullYear();

      const currentDate = new Date(Date.now());
      let currenttDate = currentDate.getDate();
      let currentMonth = currentDate.getMonth() + 1;
      let currentYear = currentDate.getFullYear();

      let daysLeft = date - currenttDate;
      let monthsLeft = month - currentMonth;
      let yearsLeft = year - currentYear;
      let payload = "";

      if (daysLeft > 0 && monthsLeft == 0 && yearsLeft == 0) {
        payload = `There is a new proposal in <span color="primary">${daoName}</span> regarding <span color="#F05A7E">${title}</span>  which you can vote with <span color="primary">${tokenSymbol}</span>.
        \n The voting will end in **${daysLeft} days**. \n
        [timestamp: ${Math.floor(Date.now() / 1000)}]`;
      } else if (monthsLeft > 0) {
        if (yearsLeft == 0) {
          payload = `There is a new proposal in <span color="primary">${daoName}</span> regarding <span color="#F05A7E">${title}</span>  which you can vote with <span color="primary">${tokenSymbol}</span>.
  \n The voting will end in **${daysLeft} days** and **${monthsLeft} months**. \n
  [timestamp: ${Math.floor(Date.now() / 1000)}]`;
        } else {
          payload = `There is a new proposal in <span color="primary">${daoName}</span> regarding <span color="#F05A7E">${title}</span>  which you can vote with <span color="primary">${tokenSymbol}</span>.
    \n The voting will end in **${daysLeft} days** , **${monthsLeft} months** and **${yearsLeft} years**. \n
    [timestamp: ${Math.floor(Date.now() / 1000)}]`;
        }
      } else if (yearsLeft > 0) {
        if (monthsLeft <= 0) {
          payload = `There is a new proposal in <span color="primary">${daoName}</span> regarding <span color="#F05A7E">${title}</span>  which you can vote with <span color="primary">${tokenSymbol}</span>.
  \n The voting will end in **${daysLeft} days** and **${yearsLeft} years**. \n
  [timestamp: ${Math.floor(Date.now() / 1000)}]`;
        } else {
          payload = `There is a new proposal in <span color="primary">${daoName}</span> regarding <span color="#F05A7E">${title}</span>  which you can vote with <span color="primary">${tokenSymbol}</span>.
    \n The voting will end in **${daysLeft} days** , **${monthsLeft} months** and **${yearsLeft} years**. \n
    [timestamp: ${Math.floor(Date.now() / 1000)}]`;
        }
      }

      let cta = link;
      let subscribers = await getDaoSubscribers(tokenSymbol);
      if (subscribers) {
        for (let i = 0; i < subscribers.length; i++) {
          let recipient = subscribers[i];
          console.log("Recipient : ", recipient);
          const provider = new ethers.providers.JsonRpcProvider(
            settings.providerUrl
          );
          const signer = new ethers.Wallet(
            keys.PRIVATE_KEY_NEW_STANDARD.PK,
            provider
          );
          const userAlice = await PushAPI.initialize(signer, {
            env: CONSTANTS.ENV[process.env.SHOWRUNNERS_ENV],
          });
          await userAlice.channel.send([`${recipient}`], {
            notification: {
              title: "New Dao Proposal Alert",
              body: "DAO Proposal Alert",
            },
            payload: {
              title: `New Proposal Alert for ${title}`,
              body: payload,
              cta: cta,
            },
            channel: channelAddress,
          });
        }
      }
    }
  } catch (error) {
    console.error("Error fetching data:", error);
  }
}

//checked
async function addKeyValueToDocument(key, value) {
  const channel = Container.get(wtChannel);
  let collection = daoDataModel;
  let userId = "Dao";
  // Using $addToSet to ensure the value is unique before appending it to the array
  const updateObj = {
    $addToSet: { [`data.${key}`]: value }, // Appends the value only if it's not already present
  };

  // Update the document by appending the unique value to the key
  const result = await collection.updateOne(
    { _id: userId }, // Query by user ID or any identifier
    updateObj,
    { upsert: true } // If the document doesn't exist, create it
  );

  if (result?.upsertedCount > 0) {
    channel.logInfo(`Inserted a new document with _id: ${result?.upsertedId}`);
  } else {
    // channel.logInfo(`Updated existing document with _id: ${userId}`);
  }
}

//checked
async function removeKeyValueFromDocument(key: string, value: string) {
  let collection = daoDataModel;
  let userId = "Dao";

  // Using $pull to remove the specified value from the array at the dynamic key
  const updateObj = {
    $pull: { [`data.${key}`]: value }, // Removes the value from the array at the specified key
  };

  // Update the document by removing the value from the array
  const result = await collection.updateOne(
    { _id: userId }, // Query by user ID or any identifier
    updateObj,
    { upsert: false } // Do not create a new document if it doesn't exist
  );
  /* if (result?.nModified > 0) {
    console.log(`Removed value: ${value} from key: ${key}`);
  } else {
    console.log(`No update made`);
  } */
}

//checked
async function getDaoSubscribers(key) {
  let userId = "Dao";
  try {
    // Find the user by ID and project only the key you need from the `data` field
    const user = await daoDataModel.findOne(
      { _id: userId },
      { [`data.${key}`]: 1 } // Dynamically retrieve the key
    );
    // console.log("User Data : ",typeof());
    const dataMap = new Map(user?.data);

    if (dataMap.get(key)) {
      //  console.log(`Data for key "${key}":`, dataMap.get(key));
      return dataMap.get(key); // Return the array of values for the key
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error fetching value for key:", error);
    return null;
  }
}

//checked
async function removeExtraTokens(newTokens: string[], userToCheck: string) {
  if (newTokens.length > 0) {
    const dbTokens: string[] = await getAllKeys();
    for (let i = 0; i < dbTokens.length; i++) {
      if (!newTokens.includes(dbTokens[i])) {
        removeKeyValueFromDocument(dbTokens[i], userToCheck);
      }
    }
  }
}
//checked
async function getAllKeys(): Promise<string[]> {
  let userId = "Dao";
  // Fetch the document for the given userId
  const userDoc = await daoDataModel.findOne({ _id: userId });

  if (!userDoc) {
    console.log(`No document found for userId: ${userId}`);
    return [];
  }

  // Extract the keys from the data field
  const keys = userDoc.data ? Array.from(userDoc.data.keys()) : [];

  return keys;
}
