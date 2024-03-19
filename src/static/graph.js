class Graph {
    chatIdToName = {};
    chatNameToId = {};

    actorIdToName = {};
    actorNameToId = {};

    chatIdToMessages = {}; // Messages sent
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

                if (actor_name in graph.actorNameToId && graph.actorNameToId[actor_name] != actor_id) {
                    actor_name += ("_" + actor_id); // Handle visible name conflicts
                }

                if (chat_name in graph.chatNameToId && graph.chatNameToId[chat_name] != chat_id) {
                    chat_name += ("_" + chat_id);
                }

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

            // TODO Support forwards
            
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

function _enrichConnections(graph, connections) {
    nodes = [];
    routed_messages = [];

    for ([node_a, child_nodes] of Object.entries(connections)) {
        if (!nodes.includes(node_a)) {
            nodes.push(node_a);
        } 

        for (node_b of child_nodes) {
            if (!nodes.includes(node_b)) {
                nodes.push(node_b);
            } 

            for (msg of (graph.chatIdToMessages[node_a] || []).concat(graph.actorIdToMessages[node_a] || [])) {
                if (msg.chat_id == node_b) {
                    routed_messages.push([node_a, node_b, msg]);
                }
            }

            if (node_a in graph.actorToActorMapping) {
                if (node_b in graph.actorToActorMapping[node_a]) {
                    for (msg of graph.actorToActorMapping[node_a][node_b]) {
                        routed_messages.push([node_a, node_b, msg]);
                    }
                }
            }
        }
    }


    return [nodes, routed_messages];
}

function _extractConnections(graph, targetIds, additionalSearch) {
    connections = Object.fromEntries(targetIds.map(x => [x, []]));

    for (user_a of targetIds) {
        for (user_b of targetIds) {
            if (user_a == user_b) {
                continue;
            }

            a_chats = Object.keys(graph.actorToChatMapping[user_a] || {});
            b_chats = Object.keys(graph.actorToChatMapping[user_b] || {});

            common_chats = a_chats.filter(x => b_chats.includes(x));

            for (ch of common_chats) {
                if (!connections[user_a].includes(ch)) {
                    connections[user_a].push(ch);
                }

                if (!connections[user_b].includes(ch)) {
                    connections[user_b].push(ch);
                }
            }

            if (additionalSearch && (user_a in graph.actorToActorMapping)) {
                if (user_b in graph.actorToActorMapping[user_a]) {
                    if (!connections[user_a].includes(user_b) && !connections[user_b].includes(user_a)) {
                        connections[user_a].push(user_b);
                    }
                }
            }
        }
    }

    return _enrichConnections(graph, connections);
}

function drawGraph(graph, targetUsers, additionalSearch, targetElem) {
    option = {
        title: {
          text: 'Connection Graph'
        },
        tooltip: {},
        animationDurationUpdate: 1500,
        animationEasingUpdate: 'quinticInOut',
        series: [
          {
            type: 'graph',
            layout: 'none',
            symbolSize: 50,
            roam: true,
            label: {
              show: true
            },
            edgeSymbol: ['circle', 'arrow'],
            edgeSymbolSize: [4, 10],
            edgeLabel: {
              fontSize: 20
            },
            data: [],
            links: [],
            lineStyle: {
              opacity: 0.9,
              width: 2,
              curveness: 0
            }
          }
        ]
      };

      targetIds = targetUsers.map(x => (graph.actorNameToId[x] || graph.chatNameToId[x])).filter(it => it);
      linkInformation = _extractConnections(graph, targetIds, additionalSearch);

      chart = echarts.init(targetElem);
      chart.setOption(option)
}