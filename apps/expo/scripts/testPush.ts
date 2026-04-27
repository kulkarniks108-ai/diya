import { sendSOS } from "../utils/notifications/sendPush";

async function test() {
  await sendSOS([
    "ExponentPushToken[sPc25RJ4qMHPYZVCwTt2Z5]", // 👈 paste your real token
  ]);

  console.log("Test notification sent");
}

test();
