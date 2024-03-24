telegramData = {}
graph = null

function parseBasicInfo() {
    const output = document.getElementById('basicInfo');
    output.innerHTML = "";

    nameElem = document.createElement("li");
    nameElem.textContent = `${telegramData["personal_information"]["first_name"] || "Unknown Firstname"} ${telegramData["personal_information"]["last_name"] || "Unknown Lastname"}`;
    output.appendChild(nameElem);

    nameElem = document.createElement("li");
    nameElem.textContent = `Contacts: ${(telegramData["contacts"] || {list: []})["list"].length}`;
    output.appendChild(nameElem);

    nameElem = document.createElement("li");
    nameElem.textContent = `Message sources: ${Object.keys(graph.actorIdToName).length}`;
    output.appendChild(nameElem);
}

async function invokePlotter() {
    const targetElem = document.getElementById("echart");
    const additionalSearch = document.getElementById("mentionsButton").checked;

    users = Array.from(
        document.getElementById("user-select-textinputs").children
    ).map((it) => it.value)

    drawGraph(graph, users, additionalSearch, targetElem);
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
    const loadingDiv = document.getElementById('loading');
    loadingDiv.style.visibility = 'visible';

    const file = event.target.files.item(0);
    telegramData = JSON.parse(await file.text());
    
    graph = calculateGraph(telegramData)

    const datalist = document.getElementById("user-names")
    datalist.innerHTML = "";

    for (source of Object.keys(graph.actorNameToId)) {
        const option = document.createElement("option");
        option.value = source;

        datalist.appendChild(option);
    }

    parseBasicInfo()

    sortedUsers = Object.keys(graph.actorIdToMessages).sort((a, b) => graph.actorIdToMessages[a].length - graph.actorIdToMessages[b].length).reverse();
    graphUsers = sortedUsers.slice(0, Math.min(5, sortedUsers.length));

    inputDiv = document.getElementById("user-select-textinputs");

    for (user of graphUsers) {
        const input = document.createElement("input");
        input.list = "user-names";
        input.value = graph.actorIdToName[user];

        inputDiv.appendChild(input);
    }

    invokePlotter();

    loadingDiv.style.visibility = 'hidden';

    const analyzeDiv = document.getElementById("user-select");
    analyzeDiv.style = "";
}