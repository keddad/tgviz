telegramData = {}
sourceToMessage = {}

function parseBasicInfo() {
    const output = document.getElementById('basicInfo');
    output.innerHTML = "";

    nameElem = document.createElement("li");
    nameElem.textContent = `${telegramData["personal_information"]["first_name"]} ${telegramData["personal_information"]["last_name"]}`;
    output.appendChild(nameElem);

    nameElem = document.createElement("li");
    nameElem.textContent = `Contacts: ${Object.keys(telegramData["contacts"]).length}`;
    output.appendChild(nameElem);

    nameElem = document.createElement("li");
    nameElem.textContent = `Message sources: ${Object.keys(sourceToMessage).length}`;
    output.appendChild(nameElem);

    output.style = ["display"];
}

async function handleFileUpload(event) {
    const file = event.target.files.item(0)
    telegramData = JSON.parse(await file.text());
    sourceToMessage = {}

    for (chat in telegramData["chats"]["list"]) {
        for (message of (chat["messages"] || [])) {
            if ("from_id" in message) {
                source = message["from_id"]

                if (source in sourceToMessage) {
                    sourceToMessage[source] += [message]
                } else {
                    sourceToMessage[source] = [message]
                }
            }
        }
    }


    parseBasicInfo()
}