# Wallet Tracker Chat

The Wallet Tracker Chat code operates independently and does not require Push Showrunners. All logic code regarding the chat can be found in `src/walletTrackerChat`.

## Key Takeaways and Contribution Guidelines

- **To add new API integrations:** Add your code to the `apis` directory.
- **To create new commands:** Add your code to the `commands` directory.
- **To manage control flow and logic:** Add your code to the `controller` directory.
- **To add utility functions:** Add your code to the `utils` directory.
- **To handle the main entry point and conditional logic for commands:** Update the `index.js` file.

## File Descriptions

### `apis/`
This directory contains all the API integrations for the Wallet Tracker Chat. Each API should have its own file or folder containing all related functions and configurations.

### `commands/`
This directory contains all the command logic for the Wallet Tracker Chat. Each command should be defined in its own file, ensuring modular and maintainable code.

### `controller/`
This directory contains the control flow and logic management for the Wallet Tracker Chat.

### `utils/`
This directory contains utility functions that are used throughout the Wallet Tracker Chat application. Group related utility functions into a single file when possible.

### `index.js`
This file contains the main entry point for the Wallet Tracker Chat application. Ensure that conditional formatting is added to execute the correct slash operations based on the incoming commands.



