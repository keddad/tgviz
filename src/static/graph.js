class Graph {
    chatIdToName = {};
    chatNameToId = {}; // TODO Non-unique mapping, add hash

    actorIdToName = {};
    actorNameToId = {}; // TODO Non-unique mapping, add hash

    chatIdToMessages = {};
    actorIdToMessages = {};

    actorToChatMapping = {}; // User writing something in chat. [user_id][chat_id] = [messages]
    actorToActorMapping = {}; // User mentioning another user. [user_a_id][user_b_id] = [messages]
}

function calculateGraph(telegramData) {
    const graph = new Graph();

    for (chat of telegramData["chats"]["list"]) {
        for (message of (chat["messages"] || [])) {
            if ("from_id" in message) { // Skip technical messages, like groupadd
                actor_id = message["from_id"];
                actor_name = message["from"];

                chat_id = chat["id"];
                chat_name = chat["name"];

                graph.chatIdToName[chat_id] = chat_name;
                graph.chatNameToId[chat_name] = chat_id;

                graph.actorIdToName[actor_id] = actor_name;
                graph.actorNameToId[actor_name] = actor_id;

                message.chat_id = chat_id;

                if (!(chat_id in graph.chatIdToMessages)) {
                    graph.chatIdToMessages[chat_id] = [];
                }

                graph.chatIdToMessages[chat_id].push(message);

                if (!(actor_id in graph.actorIdToMessages)) {
                    graph.actorIdToMessages[actor_id] = [];
                }

                graph.actorIdToMessages[actor_id].push(message);
            }
        }
    }

    for (const [chat_id, message_list] of Object.entries(graph.chatIdToMessages)) {
        for (const message of message_list) {
            actor_id = message["from_id"];

            if (!(actor_id in graph.actorToChatMapping)) {
                graph.actorToChatMapping[actor_id] = {};
            }

            if (!(chat_id in graph.actorToChatMapping[actor_id])) {
                graph.actorToChatMapping[actor_id][chat_id] = [];
            }

            graph.actorToChatMapping[actor_id][chat_id].push(message);

            message_text = message["text"] || "";

            for (const [s_name, s_actor_id] of Object.entries(graph.actorNameToId)) {
                if (message_text.includes(s_name)) {
                    if (!(actor_id in graph.actorToActorMapping)) {
                        graph.actorToActorMapping[actor_id] = {};
                    }

                    if (!(s_actor_id in graph.actorToActorMapping[actor_id])) {
                        graph.actorToActorMapping[actor_id][s_actor_id] = [];
                    }

                    graph.actorToActorMapping[actor_id][s_actor_id].push(message);
                }
            }
        }
    }


    return graph;
}

function drawGraph(graph, targetUsers, additionalSearch, targetElem) {
    alert(targetUsers)
}