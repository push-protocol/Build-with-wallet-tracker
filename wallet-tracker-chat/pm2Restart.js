import pm2 from "pm2";

// Replace 'your-process-name-or-id' with the name or id of your process
const processNameOrId = "0";

export const pm2Automation = () => {
  pm2.connect((err) => {
    if (err) {
      console.error(err);
      process.exit(2);
    }

    console.log(`Restarting process: ${processNameOrId}`);

    // Restart 0
    pm2.restart(processNameOrId, (stopErr) => {
      if (stopErr) {
        console.error(`Error stopping process: ${stopErr}`);
        pm2.disconnect();
        return;
      }

      console.log(`Process stopped: ${processNameOrId}`);
      pm2.disconnect();
    });

  });
};