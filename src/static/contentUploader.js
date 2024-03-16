telegramData = {}
sourceToMessage = {}
nameToSource = {}

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
}

async function removeTextInput() {
    const inputDiv = document.getElementById("user-select-textinputs");
    
    if (inputDiv.children.length != 0) {
        inputDiv.children[inputDiv.children.length - 1].remove();
    }
}

async function addTextInput() {
    const inputDiv = document.getElementById("user-select-textinputs");

    const newTextElem = document.createElement("input");
    newTextElem.setAttribute("list", "user-names");

    inputDiv.appendChild(newTextElem);
}

async function handleFileUpload(event) {
    const file = event.target.files.item(0)
    telegramData = JSON.parse(await file.text());
    sourceToMessage = {}

    for (chat of telegramData["chats"]["list"]) {
        for (message of (chat["messages"] || [])) {
            if ("from_id" in message) {
                source = message["from_id"];

                if (source in sourceToMessage) {
                    sourceToMessage[source] += [message];
                } else {
                    sourceToMessage[source] = [message];
                }

                source_name = message["from"];

                if (!(source_name in nameToSource)) {
                    nameToSource[source_name] = source;
                }
            }
        }
    }

    const datalist = document.getElementById("user-names")
    datalist.innerHTML = "";

    for (source of Object.keys(nameToSource)) {
        option = document.createElement("option");
        option.value = source;

        datalist.appendChild(option);
    }

    parseBasicInfo()

    const analyzeDiv = document.getElementById("user-select");
    analyzeDiv.style = "";
}