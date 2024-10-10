import bodyParser from "body-parser";
import express from "express";
import { Container } from "typedi";
import SnapshotChannel from "../snapshot/snapshotChannel";
import axios from "axios";
import { triggerDaoNotifications } from "./checkDaoProposals";
import WallettrackerChannel from "./wallettrackerChannel";
const app = express();
const port = 444;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
const wtChannel = Container.get(WallettrackerChannel);
const ssChannel = Container.get(SnapshotChannel);
app.get("/apis/wt/notifications/status", (req, res) => {
  res
    .status(200)
    .send("<h1><strong>Wallet Tracker on port 444 is healthy</strong></h1>");
});

app.post("/apis/wt/notifications", async (req, res) => {
  let data = JSON.stringify(req.body);

  const payload = JSON.parse(data);
  console.log("--------WT Payload---------", payload);
  if (payload.event === "proposal/created") {
    triggerDaoNotifications(payload.id);
    ssChannel.sendSnapshotProposalNotification(payload);
    console.log("Payload Id", payload.id);
    res.sendStatus(200);
    return;
  }
});

app.listen(port, () =>
  console.log("SNS notification listening on port " + port + "!")
);
