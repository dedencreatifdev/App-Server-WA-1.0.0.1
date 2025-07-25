const { Client, Location, Poll, List, Buttons, LocalAuth } = require("./index");
var qrcode = require("qrcode-terminal");
const https = require("https");
const chromium = require("chromium");
require("dotenv").config();

const kirimdata = require("./ambildata");
const { env } = require("process");

const client = new Client({
    authStrategy: new LocalAuth({
        dataPath: "auth_session",
    }),
    // proxyAuthentication: { username: 'username', password: 'password' },
    puppeteer: {
        executablePath: chromium.path,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
        headless: true,
    },
});

// client initialize does not finish at ready now.
client.initialize();

client.on("loading_screen", (percent, message) => {
    console.log("LOADING SCREEN", percent, message, "\n\n");
});

// Pairing code only needs to be requested once
let pairingCodeRequested = false;
client.on("qr", async (qr) => {
    // NOTE: This event will not be fired if a session is specified.
    console.log("QR RECEIVED", qr);

    // paiuting code example
    const pairingCodeEnabled = false;
    if (pairingCodeEnabled && !pairingCodeRequested) {
        const pairingCode = await client.requestPairingCode("96170100100"); // enter the target phone number
        console.log("Pairing code enabled, code: " + pairingCode);
        pairingCodeRequested = true;
    }
    qrcode.generate(qr, { small: true, size: 10, magin: 2 }, function (qrcode) {
        console.log(qrcode);
    });
});

client.on("authenticated", () => {
    console.log("AUTHENTICATED");
});

client.on("auth_failure", (msg) => {
    // Fired if session restore was unsuccessful
    console.error("AUTHENTICATION FAILURE", msg);
});

client.on("ready", async () => {
    console.log("READY");
    const debugWWebVersion = await client.getWWebVersion();
    console.log(`WWebVersion = ${debugWWebVersion}`);

    client.pupPage.on("pageerror", function (err) {
        console.log("Page error: " + err.toString());
    });
    client.pupPage.on("error", function (err) {
        console.log("Page error: " + err.toString());
    });
});

client.on("message", async (msg) => {
    // console.log("MESSAGE RECEIVED", msg);

    if (msg.body.toLowerCase().startsWith("assalamualaikum" || "ass")) {
        const chat = await msg.getChat();
        chat.sendStateTyping();
        setTimeout(() => {
            msg.react("🙏🏻");
        }, 3000);
        console.log(msg._data.notifyName);

        chat.sendStateTyping();
        setTimeout(() => {
            // client.sendMessage(
            //     msg.from,
            //     `Hai\n${dataku}\nSystem masih dalam Development`
            // );
            msg.reply(`Wa'alaikumsalam,\n🙏🏻🙏🏻.\n\n.`);
        }, 10000);
    } else if (msg.body.toLowerCase().startsWith("ckp ")) {
        // Send a new message to the same chat
        const chat = await msg.getChat();
        let pesanMasuk = msg.body.slice(4);
        const debugWWebVersion = await client.getWWebVersion();

        const mysql = require("mysql");

        const connection = mysql.createConnection({
            // host: process.env.HOST,
            // user: process.env.USER,
            // password: process.env.PASSWORD,
            // database: process.env.DATABASE,
        });

        // Connect to the database
        connection.connect((err) => {
            if (err) {
                console.error("Error connecting to the database:", err.message);
                return;
            }
            console.log("Connected to the database!");
        });

        // Perform a query
        const query = `SELECT * FROM price_list WHERE KDBR like ? OR KETERANGAN LIKE ? limit 5`; // Replace with your SQL query
        connection.query(
            query,
            [`%${pesanMasuk}%`, `%${pesanMasuk}%`],
            (err, results) => {
                let dataku = "";
                if (err) {
                    console.error("Error executing query:", err.message);
                    return;
                }

                // Handle the query response
                // console.log("Query Results:", results);
                if (results.length === 0) {
                    dataku = `Maaf, data dengan kode *${pesanMasuk}* tidak ditemukan.`;
                    msg.reply(dataku);
                } else {
                    // Example: Loop through results
                    results.forEach((row) => {
                        const formattedCurrency = new Intl.NumberFormat(
                            "id-ID",
                            {
                                style: "currency",
                                currency: "IDN",
                            }
                        ).format(row.HRG_JUAL);
                        //
                        console.log(`Kode : ${row.KDBR}, Nama : ${row.NAMA}`);
                        dataku += `Kode : *${row.KDBR}*\nNama : ${row.NAMA}\nHarga : *${formattedCurrency}*\nGroup : ${row.KDGROUP}\nKeterangan : ${row.KETERANGAN}\n\n`;
                        tgl_update = row.updated_at;
                    });
                    chat.sendStateTyping();
                    setTimeout(() => {
                        msg.react("👍");
                    }, 3000);
                    chat.sendStateTyping();
                    setTimeout(() => {
                        // client.sendMessage(
                        //     msg.from,
                        //     `Hai\n${dataku}\nSystem masih dalam Development`
                        // );
                        msg.reply(
                            `Hai Kak *${
                                msg._data.notifyName
                            }*\n\n${dataku}\n*Notes:*\n_Maximal 5 Data yang kami kirimkan._\n_Mohon maaf, sistem masih dalam tahap pengembangan._\n\nVersi : _${debugWWebVersion}_\nUpdate Price list : ${tgl_update.toLocaleDateString(
                                "id-ID",
                                {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                }
                            )}`
                        );
                    }, 5000);
                }
            }
        );

        // Close the connection
        connection.end((err) => {
            if (err) {
                console.error("Error closing the connection:", err.message);
                return;
            }
            console.log("Database connection closed.");
        });

        // client.sendMessage(msg.from, "pong");
    } else if (msg.body === "btn") {
        let button = new Buttons(
            "Button body",
            [{ id: "btn1", body: "btn1" }],
            "title",
            "footer"
        );
        client.sendMessage(msg.from, button);
    }
});

client.on("message_create", async (msg) => {
    // Fired on all message creations, including your own
    if (msg.fromMe) {
        // do stuff here
    }

    // Unpins a message
    if (msg.fromMe && msg.body.startsWith("!unpin")) {
        const pinnedMsg = await msg.getQuotedMessage();
        if (pinnedMsg) {
            // Will unpin a message
            const result = await pinnedMsg.unpin();
            console.log(result); // True if the operation completed successfully, false otherwise
        }
    }
});

client.on("message_ciphertext", (msg) => {
    // Receiving new incoming messages that have been encrypted
    // msg.type === 'ciphertext'
    msg.body = "Waiting for this message. Check your phone.";

    // do stuff here
});

client.on("message_revoke_everyone", async (after, before) => {
    // Fired whenever a message is deleted by anyone (including you)
    console.log(after); // message after it was deleted.
    if (before) {
        console.log(before); // message before it was deleted.
    }
});

client.on("message_revoke_me", async (msg) => {
    // Fired whenever a message is only deleted in your own view.
    console.log(msg.body); // message before it was deleted.
});

client.on("message_ack", (msg, ack) => {
    /*
        == ACK VALUES ==
        ACK_ERROR: -1
        ACK_PENDING: 0
        ACK_SERVER: 1
        ACK_DEVICE: 2
        ACK_READ: 3
        ACK_PLAYED: 4
    */

    if (ack == 3) {
        // The message was read
    }
});

client.on("group_join", (notification) => {
    // User has joined or been added to the group.
    console.log("join", notification);
    notification.reply("User joined.");
});

client.on("group_leave", (notification) => {
    // User has left or been kicked from the group.
    console.log("leave", notification);
    notification.reply("User left.");
});

client.on("group_update", (notification) => {
    // Group picture, subject or description has been updated.
    console.log("update", notification);
});

client.on("change_state", (state) => {
    console.log("CHANGE STATE", state);
});

// Change to false if you don't want to reject incoming calls
let rejectCalls = true;

client.on("call", async (call, msg) => {
    console.log("Call received, rejecting. GOTO Line 261 to disable", call);
    if (rejectCalls) await call.reject();
    // console.log(msg);

    await client.sendMessage(
        call.from,
        `Mohon maaf, saya tidak bisa menerima panggilan saat ini. Silakan hubungi saya melalui pesan.\nTerima kasih.`
    );
});

client.on("disconnected", (reason) => {
    console.log("Client was logged out", reason);
});

client.on("contact_changed", async (message, oldId, newId, isContact) => {
    /** The time the event occurred. */
    const eventTime = new Date(message.timestamp * 1000).toLocaleString();

    console.log(
        `The contact id ${oldId.slice(0, -5)}` +
            `${
                !isContact
                    ? " that participates in group " +
                      `${
                          (await client.getChatById(message.to ?? message.from))
                              .name
                      } `
                    : " "
            }` +
            `changed their phone number\nat ${eventTime}.\n` +
            `Their new phone number is ${newId.slice(0, -5)}.\n`
    );

    /**
     * Information about the @param {message}:
     *
     * 1. If a notification was emitted due to a group participant changing their phone number:
     * @param {message.author} is a participant's id before the change.
     * @param {message.recipients[0]} is a participant's id after the change (a new one).
     *
     * 1.1 If the contact who changed their number WAS in the current user's contact list at the time of the change:
     * @param {message.to} is a group chat id the event was emitted in.
     * @param {message.from} is a current user's id that got an notification message in the group.
     * Also the @param {message.fromMe} is TRUE.
     *
     * 1.2 Otherwise:
     * @param {message.from} is a group chat id the event was emitted in.
     * @param {message.to} is @type {undefined}.
     * Also @param {message.fromMe} is FALSE.
     *
     * 2. If a notification was emitted due to a contact changing their phone number:
     * @param {message.templateParams} is an array of two user's ids:
     * the old (before the change) and a new one, stored in alphabetical order.
     * @param {message.from} is a current user's id that has a chat with a user,
     * whos phone number was changed.
     * @param {message.to} is a user's id (after the change), the current user has a chat with.
     */
});

client.on("group_admin_changed", (notification) => {
    if (notification.type === "promote") {
        /**
         * Emitted when a current user is promoted to an admin.
         * {@link notification.author} is a user who performs the action of promoting/demoting the current user.
         */
        console.log(`You were promoted by ${notification.author}`);
    } else if (notification.type === "demote")
        /** Emitted when a current user is demoted to a regular user. */
        console.log(`You were demoted by ${notification.author}`);
});

client.on("group_membership_request", async (notification) => {
    /**
     * The example of the {@link notification} output:
     * {
     *     id: {
     *         fromMe: false,
     *         remote: 'groupId@g.us',
     *         id: '123123123132132132',
     *         participant: 'number@c.us',
     *         _serialized: 'false_groupId@g.us_123123123132132132_number@c.us'
     *     },
     *     body: '',
     *     type: 'created_membership_requests',
     *     timestamp: 1694456538,
     *     chatId: 'groupId@g.us',
     *     author: 'number@c.us',
     *     recipientIds: []
     * }
     *
     */
    console.log(notification);
    /** You can approve or reject the newly appeared membership request: */
    await client.approveGroupMembershipRequestss(
        notification.chatId,
        notification.author
    );
    await client.rejectGroupMembershipRequests(
        notification.chatId,
        notification.author
    );
});

client.on("message_reaction", async (reaction) => {
    // console.log("REACTION RECEIVED", reaction);
});

client.on("vote_update", (vote) => {
    /** The vote that was affected: */
    console.log(vote);
});
