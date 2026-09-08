const WebSocket = require("ws");
const readline = require("readline");

const GATEWAY =
  "wss://gateway.discord.gg/?v=10&encoding=json";

const API =
  "https://discord.com/api/v9";

// Matches:
// discord.gift/CODE
// https://discord.gift/CODE
// discord.com/gifts/CODE
// https://discord.com/gifts/CODE
const giftRegex =
  /(?:https?:\/\/)?(?:www\.)?(?:discord\.gift|discord\.com\/gifts)\/([A-Za-z0-9_-]+)/gi;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(question) {
  return new Promise(resolve => {
    rl.question(question, answer => {
      resolve(answer.trim());
    });
  });
}

let ws = null;
let heartbeat = null;
let sequence = null;
let token = "";
let reconnectTimer = null;
let shuttingDown = false;

/*
 * Discord HTTP API helper.
 *
 * This authenticates as the bot.
 * It can be used for legitimate Discord bot API requests.
 */
async function discord(route, options = {}) {
  if (!token) {
    throw Object.assign(
      new Error("Bot token is not configured."),
      { status: 503 }
    );
  }

  const response = await fetch(
    `${API}${route}`,
    {
      ...options,

      headers: {
        ...(options.headers || {}),
        Authorization: `${token}`,
        "Content-Type": "application/json"
      }
    }
  );

  let data;

  try {
    data = await response.json();
  } catch {
    data = await response.text();
  }

  return {
    response,
    data
  };
}

function log(message) {
  console.log(
    `[${new Date().toLocaleTimeString()}] ${message}`
  );
}

function connect() {
  if (shuttingDown) {
    return;
  }

  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }

  log("Connecting to Discord Gateway...");

  ws = new WebSocket(GATEWAY);

  ws.on("open", () => {
    log("Gateway connected.");
  });

  ws.on("message", raw => {
    try {
      const packet = JSON.parse(raw.toString());

      handlePacket(packet);
    } catch (err) {
      console.error(
        "[ERROR] Invalid Gateway packet:",
        err.message
      );
    }
  });

  ws.on("close", () => {
    log("Gateway disconnected.");

    if (heartbeat) {
      clearInterval(heartbeat);
      heartbeat = null;
    }

    if (!shuttingDown && token) {
      log("Reconnecting in 5 seconds...");

      reconnectTimer = setTimeout(() => {
        reconnectTimer = null;
        connect();
      }, 5000);
    }
  });

  ws.on("error", err => {
    console.error(
      "[Gateway Error]",
      err.message
    );
  });
}

function handlePacket(packet) {
  if (
    packet.s !== null &&
    packet.s !== undefined
  ) {
    sequence = packet.s;
  }

  switch (packet.op) {
    case 10:
      if (
        packet.d &&
        typeof packet.d.heartbeat_interval === "number"
      ) {
        startHeartbeat(
          packet.d.heartbeat_interval
        );
      }

      identify();
      break;

    case 0:
      handleEvent(
        packet.t,
        packet.d
      );
      break;

    case 1:
      sendHeartbeat();
      break;

    case 7:
      log(
        "Discord requested reconnect."
      );

      if (ws) {
        ws.close();
      }

      break;

    case 9:
      console.error(
        "[ERROR] Discord invalidated the session."
      );

      if (heartbeat) {
        clearInterval(heartbeat);
        heartbeat = null;
      }

      process.exit(1);
      break;

    case 11:
      // Heartbeat ACK
      break;

    default:
      break;
  }
}

function startHeartbeat(interval) {
  if (heartbeat) {
    clearInterval(heartbeat);
  }

  heartbeat = setInterval(() => {
    sendHeartbeat();
  }, interval);

  sendHeartbeat();
}

function sendHeartbeat() {
  if (
    !ws ||
    ws.readyState !== WebSocket.OPEN
  ) {
    return;
  }

  ws.send(
    JSON.stringify({
      op: 1,
      d: sequence
    })
  );
}

function identify() {
  if (
    !ws ||
    ws.readyState !== WebSocket.OPEN
  ) {
    return;
  }

  ws.send(
    JSON.stringify({
      op: 2,

      d: {
        token: token,

        /*
         * GUILDS
         * GUILD_MESSAGES
         * MESSAGE_CONTENT
         */
        intents:
          (1 << 0) |
          (1 << 9) |
          (1 << 15),

        properties: {
          os: "windows",
          browser: "discord-code-monitor",
          device: "discord-code-monitor"
        }
      }
    })
  );

  log(
    "Bot identified with Discord Gateway."
  );
}

function handleEvent(event, data) {
  if (event === "READY") {

    console.clear();

    console.log(
      "       DISCORD CODE MONITOR"
    );


    console.log("");

    log(
      `Logged in as ${data.user?.username || "Unknown"}
      Bot ID: ${data.user?.id || "Unknown"}
    
    `);


    console.log(
      "Waiting for Discord gift links..."
    );

    return;
  }

  if (event === "MESSAGE_CREATE") {
    scanMessage(data);
  }
}

function scanMessage(message) {
  if (!message) {
    return;
  }

  const content =
    String(message.content || "");

  if (!content) {
    return;
  }

  const matches = [
    ...content.matchAll(giftRegex)
  ];

  if (matches.length === 0) {
    return;
  }

  for (const match of matches) {
    const code = match[1];

    if (!code) {
      continue;
    }

    showDetectedCode(code, message);
  }
}

async function showDetectedCode(code, message) {

  console.log(
    "       GIFT CODE DETECTED"
  );


  console.log(`
     Code:    ${code}
     Author:  ${message.author?.username || "Unknown"} 
     Channel: ${message.channel_id ||"Unknown"} 
    `);


  if (message.guild_id) {


const response = await discord(`/entitlements/gift-codes/${code}/redeem`,{
    method: "POST",
    headers: {
      'Authorization': token,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      // request data
    })
  });

console.log(`
Status ${response.response.status}
Data ${response.data}
Server:  ${message.guild_id}
Gift URL: https://discord.gift/${code}
`);

}

  console.log(
    "================================="
  );

}

async function main() {

  console.log(`
      DISCORD CODE MONITOR

     The token is entered at runtime and is not saved
  `);

  token = await ask(
    "Enter bot token: "
  );

  if (!token) {
    console.error(
      "[ERROR] No token entered."
    );

    rl.close();

    process.exit(1);
  }

  token = token.trim();

  console.log("");

  connect();
}

//
main().catch(err => {
  console.error(
    "[ERROR]",
    err.message
  );

  rl.close();

  process.exit(1);
});

process.on("SIGINT", () => {
  shuttingDown = true;

  console.log(
    "\nStopping..."
  );

  if (heartbeat) {
    clearInterval(heartbeat);
    heartbeat = null;
  }

  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }

  if (ws) {
    ws.close();
    ws = null;
  }

  rl.close();

  process.exit(0);
});
