async function kirimdata() {
    https
        .get("https://jsonplaceholder.typicode.com/users", (res) => {
            let data = [];
            const headerDate =
                res.headers && res.headers.date
                    ? res.headers.date
                    : "no response date";
            console.log("Status Code:", res.statusCode);
            console.log("Date in Response header:", headerDate);

            res.on("data", (chunk) => {
                data.push(chunk);
            });

            res.on("end", () => {
                console.log("Response ended: ");
                const users = JSON.parse(Buffer.concat(data).toString());
                let dataku = "";
                let mentions = [];
                // console.log(users);
                users.forEach((user) => {
                    dataku += `ID: ${user.id},\nName: ${user.name},\nEmail: ${user.email}\n\n`;
                });
                console.log(dataku);
                // for (user of users) {
                //   console.log(`Got user with id: ${user.id}, name: ${user.name}`);
                //   dataku = `ID: ${user.id}, Name: ${user.name}, Email: ${user.email}`;
                // }
                //   message.reply(dataku);
                // simulates typing in the chat
                chat.sendStateTyping();
                setTimeout(() => {
                    msg.react("👍");
                }, 3000);
                chat.sendStateTyping();
                setTimeout(() => {
                    client.sendMessage(
                        msg.from,
                        `Hai\n${dataku}\nBelum Kami temukan\nSystem masih dalam Development`
                    );
                }, 5000);
            });
        })
        .on("error", (err) => {
            console.log("Error: ", err.message);
        });
}

module.exports = {
    kirimdata,
    // Other exports can go here
};
