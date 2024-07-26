# Wallet Tracker Channel

The Wallet Tracker Channel code utilizes Push Showrunners to operate the channel in the backend., and most of the code in this folder is related to Showrunners. You can skip this for now or if you want to read more about it, read [here](https://push.org/docs/notifications/showrunners-scaffold/get-started/). All logic code regarding the channel can be found in `src/showrunners/walletTracker`.

## Key Takeaways and Contribution Guidelines

When contributing to this repository, please note the following:

- **To write new logic:** Add your code to `walletTrackerChannel.ts`.
- **To change private keys:** Modify the `walletTrackerKeys.ts` file.
- **To test out features before going live:** Build your API in `walletTrackerRoutes.ts`.
- **To change when the code triggers itself:** Update the cron job in `walletTrackerJobs.ts`.
- **To change any other constants used throughout the folder:** Look into the `walletTrackerSettings.json` file.

## File Descriptions

### `walletTrackerChannel.ts`
This file contains all the logic functions of your channel. It can, for instance, have a way to poll all opted-in users of your channel and, based on certain conditions that are met, fire notifications out.

### `walletTrackerKeys.ts`
This file contains all your private keys that either belong to the channel you created or have authorized the wallets to send notifications on your channel's behalf.

### `walletTrackerRoutes.ts`
This file contains the routes that you will enable to ensure you can manually trigger notifications or any other logic points in your `walletTrackerChannel.ts`. You will ideally use the route of this file in Postman to trigger logic functions/test them out.

### `walletTrackerJobs.ts`
This file contains your cron jobs to trigger logic points in your `walletTrackerChannel.ts`. This file is based on node-schedule and can handle a wide variety of automated cron jobs to enable sending a wide array of notifications based on triggers.

### `walletTrackerModel.ts`
This file is used to declare the schema for the database.

### `walletTrackerSettings.json`
Contains some predetermined constants to act upon the logic.

---
