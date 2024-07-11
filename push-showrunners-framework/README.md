# Wallet Tracker Channel

The Wallet Tracker Channel code utilizes Push Showrunners to operate the channel in the backend. The Showrunners framework is a scaffold that developers can use to build out notifications for their use cases. This framework provides the tools and helpers required for constructing the payload and sending the notification using the Push protocol infrastructure. Learn more [here](https://push.org/docs/notifications/showrunners-scaffold/).

## Setting Up the Project Locally

### Prerequisites

Before setting up the project locally, you need to:

- Create a channel. Head over to the [Staging Push Dapp Channel Creation](https://staging.push.org/dashboard). If you need help setting up the channel, follow this [tutorial](https://push.org/docs/notifications/tutorials/create-your-channel/).
- **Install Docker:** You can get Docker from the [official Docker guide](https://docs.docker.com/get-docker/).


### Steps to Set Up

1. **Clone the repository:** 
    ```
    git clone https://github.com/push-protocol/Build-with-wallet-tracker.git
    ```

2. **Navigate to the `push-showrunner-framework` folder:**
    ```
    cd push-showrunner-framework/
    ```
3. **Initialize Docker:**
    For local ease of development, we use Docker. Make sure you have it installed. You can get Docker [here](https://docs.docker.com/get-docker/).
    ```
    docker-compose up
    ```

4. **Install packages and set up environment variables:**
    We have simplified this process for you. Use the `setup.js` script to complete the setup. Before that make sure you open up a new terminal and point to same folder i.e push-showrunner-framwork
    ```
    node setup.js
    ```
    Make sure to enter the correct details. If anything goes sideways, check the newly created `.env` file.



5. **Start the project:**
    ```
    yarn start
    ```

You should now have the notification sending.

## Contributing Guidelines

Build with Wallet Tracker is an open-source project. We firmly believe in a completely transparent development process and value any contributions. We would love to have you as a member of the community, whether you are assisting us in bug fixes, suggesting new features, enhancing our documentation, or simply spreading the word.

- **Bug Report:** Please create a bug report if you encounter any errors or problems while utilizing the Push Protocol.
- **Feature Request:** Please submit a feature request if you have an idea or discover a capability that would make development simpler and more reliable.
- **Documentation Request:** If you're reading the Push documentation and believe that we're missing something, please create a docs request.

Not sure where to start? Join our Discord, and we will help you get started!

<a href="https://discord.gg/pushprotocol" title="Join Our Community"><img src="https://www.freepnglogos.com/uploads/discord-logo-png/playerunknown-battlegrounds-bgparty-15.png" width="200" alt="Discord" /></a>

### How to Contribute

1. **Fork the repository:** Create your own copy of it.
2. **Clone your personal copy onto your personal machine:**
    ```
    git clone https://github.com/YOUR_USERNAME/Build-with-wallet-tracker.git
    ```
3. **Raise an issue on GitHub repo:** Briefly describe the issue or feature.
4. **Create a branch on your local machine:** Name the branch as the issue name.
    ```
    git checkout -b issue-name
    ```
5. **Make your changes:** After making changes, commit them.
6. **Raise a PR in the main repo:** Submit your pull request.
7. **Link the issue with PR:** In the PR comment section, link the issue with `closes #Issue_number`.

Congratulations, you have successfully contributed to an open-source project. Sit back, relax, and watch your PR get merged. Cheers!

