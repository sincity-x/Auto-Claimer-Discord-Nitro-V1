# Discord Code Monitor — Selfbot

A Node.js command-line project for connecting to Discord through a **user account session**, monitoring incoming messages, detecting Discord gift-code URLs, and displaying information about detected codes.

> ⚠️ **Disclaimer:** This project automates a Discord user account rather than a Discord bot account. User-account automation/selfbots are not an officially supported Discord API use case and may violate Discord's Terms of Service. Use only for research, testing, or accounts/environments where you have authorization.

## Features

* 🔌 WebSocket-based Discord Gateway connection
* 👤 User-account session authentication
* 💓 Gateway heartbeat handling
* 🔄 Automatic reconnection
* 💬 Message event monitoring
* 🔎 Discord gift-link detection
* 🧩 Automatic extraction of gift codes
* 👤 Displays message author information
* 📺 Displays channel information
* 🏠 Displays server information when available
* 🖥️ Simple command-line interface
* 🛑 Graceful shutdown with `Ctrl+C`
* 🔐 Session token is entered at runtime rather than stored in the source

## Detected Link Formats

The monitor recognizes the following formats:

```text
discord.gift/CODE
https://discord.gift/CODE
discord.com/gifts/CODE
https://discord.com/gifts/CODE
```

The matching code is extracted using a regular expression:

```javascript
const giftRegex =
  /(?:https?:\/\/)?(?:www\.)?(?:discord\.gift|discord\.com\/gifts)\/([A-Za-z0-9_-]+)/gi;
```

## Requirements

* Node.js 18+
* Internet connection
* A Discord account/session

Install the project dependencies with:

```bash
npm install
```

The project uses [`ws`](https://www.npmjs.com/package/ws) for WebSocket communication.

If necessary:

```bash
npm install ws
```

## Running

Start the application:

```bash
node index.js
```

The program prompts for the session token at runtime:

```text
=================================
       DISCORD CODE MONITOR
=================================

Enter token:
```

Once connected, the application displays the account information and begins monitoring events.

## How It Works

```text
Start
  │
  ▼
Enter session token
  │
  ▼
Connect to Discord Gateway
  │
  ▼
Receive Gateway HELLO
  │
  ▼
Start heartbeat
  │
  ▼
Authenticate session
  │
  ▼
Receive Gateway events
  │
  ▼
Process message events
  │
  ▼
Search message content
  │
  ▼
Detect Discord gift URL
  │
  ▼
Extract code
  │
  ▼
Display detection information
```

## Detection Output

When a matching URL is encountered, the application prints information similar to:

```text
=================================
       GIFT CODE DETECTED
=================================

Code:    exampleCode123
Author:  ExampleUser
Channel: 123456789012345678
Server:  987654321098765432

Gift URL: https://discord.gift/exampleCode123

=================================
```

## Gateway Handling

The application implements basic Gateway functionality, including:

* Gateway connection
* `HELLO`
* `DISPATCH`
* `HEARTBEAT`
* `HEARTBEAT_ACK`
* `RECONNECT`
* `INVALID_SESSION`
* Sequence-number tracking

Heartbeat packets use the latest Gateway sequence number received by the client.

## Reconnection

If the WebSocket connection closes, the application attempts to reconnect after five seconds.

```text
Gateway disconnected.
Reconnecting in 5 seconds...
```

This behavior is controlled by the internal reconnect timer.

## Session Token Security

The session token is supplied interactively at runtime.

**Never commit a real Discord session token to GitHub.**

Do not place credentials directly inside source code:

```javascript
const token = "YOUR_TOKEN";
```

If a session credential is accidentally exposed, invalidate it immediately.

You should also avoid storing session credentials in logs, screenshots, issues, or commits.

## Project Structure

```text
discord-code-monitor/
├── index.js
├── package.json
├── package-lock.json
├── .gitignore
└── README.md
```

### `index.js`

Contains the WebSocket connection, Gateway event handling, heartbeat implementation, message scanning, and terminal interface.

### `package.json`

Contains project metadata and Node.js dependencies.

### `README.md`

Project documentation.

## Configuration

The Gateway and API endpoints are defined near the beginning of `index.js`:

```javascript
const GATEWAY =
  "wss://gateway.discord.gg/?v=10&encoding=json";

const API =
  "https://discord.com/api/v9";
```

The application currently does not require a separate configuration file.

## Stopping

Press:

```text
Ctrl+C
```

The application will:

1. Stop the heartbeat timer.
2. Cancel pending reconnect attempts.
3. Close the WebSocket connection.
4. Close the terminal input interface.
5. Exit the process.

## Important Limitations

This project is **not a Discord bot**.

It is designed around a Discord **user-account session**, commonly referred to as a "selfbot."

Discord does not provide an officially supported selfbot API. Consequently:

* Behavior may change when Discord changes its Gateway/API.
* Connections may be rejected.
* Endpoints may change or become unavailable.
* Account restrictions may occur.
* The project may stop functioning without code changes.

## Gift-Code Redemption

The source contains an API request targeting a gift-code redemption endpoint.

This functionality should only be used for **codes you are authorized to redeem** and where the operation is permitted by the applicable Discord API rules.

The monitoring/detection portion of the project does not require redemption functionality.

For a safer monitoring-only implementation, remove the redemption request and retain the code-detection functionality.

## Troubleshooting

### The connection immediately closes

Check:

* The session credential is valid.
* The Gateway endpoint is reachable.
* Discord has not changed the relevant Gateway behavior.
* Your account/session has not been restricted.

### No messages are detected

Check that the account is actually receiving the relevant message events and that the Gateway behavior expected by the project has not changed.

### `401 Unauthorized`

The supplied credential was rejected by the API.

Do not publish the credential. If necessary, invalidate the exposed credential and authenticate again.

### The application stops after `INVALID_SESSION`

The Gateway has rejected the session. Restarting the application may not resolve the issue if the underlying authentication/session is no longer accepted.

## Legal & Account Disclaimer

This repository is provided for educational and research purposes.

Using automation against a Discord user account may violate Discord's Terms of Service or other applicable policies. You are responsible for how you use this software and for complying with the rules applicable to your account and environment.

**Do not use this project to compromise accounts, steal credentials, spam users, evade platform protections, or access data you are not authorized to access.**

## License

If you want this project to be open source, you can release it under a license such as MIT:

```text
MIT License
```

---

## Author

**Discord Code Monitor**

A Node.js Gateway-based user-account automation research project.

⭐ Star the repository if you find the project useful.
