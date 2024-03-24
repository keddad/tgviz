class Graph {
    chatIdToName = {};
    chatNameToId = {};

    actorIdToName = {};
    actorNameToId = {};

    chatIdToMessages = {}; // Messages sent
    actorIdToMessages = {};

    actorToChatMapping = {}; // User writing something in chat. [user_id][chat_id] = [messages]
    actorToActorMapping = {}; // User mentioning another user. [user_a_id][user_b_id] = [messages]

    chatCategories = {};
}

function calculateGraph(telegramData) {
    const graph = new Graph();

    for (chat of telegramData["chats"]["list"]) {
        chat_id = chat["id"];
        chat_name = chat["name"];

        if (chat_name in graph.chatNameToId && graph.chatNameToId[chat_name] != chat_id) {
            chat_name += ("_" + chat_id);
        }

        graph.chatIdToName[chat_id] = chat_name;
        graph.chatNameToId[chat_name] = chat_id;

        graph.chatCategories[chat_id] = chat.type;

        for (message of (chat["messages"] || [])) {
            if ("from_id" in message) { // Skip technical messages, like groupadd
                actor_id = message["from_id"];
                actor_name = message["from"];

                

                if (actor_name in graph.actorNameToId && graph.actorNameToId[actor_name] != actor_id) {
                    actor_name += ("_" + actor_id); // Handle visible name conflicts
                }

                

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

            if (Object.prototype.toString.call(message_text) === '[object Array]') {
                message_text = message_text.map(it => (it.text || "")).reduce((partialSum, a) => partialSum + a, "");
            }

            // TODO Support forwards
            
            for (const [s_name, s_actor_id] of Object.entries(graph.actorNameToId)) {
                if (message_text.toLowerCase().includes(s_name.toLowerCase())) {
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
    routedMessages = {};

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
                    if (!(node_a in routedMessages)) {
                        routedMessages[node_a] = {};
                    }

                    if (!(node_b in routedMessages[node_a])) {
                        routedMessages[node_a][node_b] = [];
                    }

                    routedMessages[node_a][node_b].push(msg);
                }
            }

            if (node_a in graph.actorToActorMapping) {
                if (node_b in graph.actorToActorMapping[node_a]) {
                    for (msg of graph.actorToActorMapping[node_a][node_b]) {
                        if (!(node_a in routedMessages)) {
                            routedMessages[node_a] = {};
                        }
    
                        if (!(node_b in routedMessages[node_a])) {
                            routedMessages[node_a][node_b] = [];
                        }
    
                        routedMessages[node_a][node_b].push(msg);
                    }
                }
            }
        }
    }


    return {
        nodes: nodes,
        routedMessages: routedMessages,
    };
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

function _enrichCategory(name) {
    CategoryShapes = ['circle', 'rect', 'roundRect', 'triangle', 'diamond'];
    CategoryColors = ['#484f4f', '#8ca3a3', '#563f46', '#c8c3cc', '#625750', '#96897f', '#cab577', '#7e4a35'];

    cat = {}; // meow
    cat.name = name;

    charCodeSum = [...name].map(x => x.charCodeAt()).reduce((a,b)=>a+b); // js is horrifying

    symbol = CategoryShapes[charCodeSum % CategoryShapes.length];
    color = CategoryColors[charCodeSum % CategoryColors.length];

    cat.symbol = symbol;
    cat.itemStyle = {
        color: color
    };
    cat.label = {
        fontSize: 16,
        position: name == "user" ? "top" : "bottom"
    };

    return cat;
}

function _getGraphName(graph, it) {
    actorName = graph.actorIdToName[it] || graph.chatIdToName[it]

    if (actorName.endsWith(it)) {
        actorName = actorName.slice(0, actorName.length-it.length-1);
    } 

    return actorName + "\n" + it;
}

function drawGraph(graph, targetUsers, additionalSearch, targetElem) {
    option = {
        title: {
          text: ''
        },
        tooltip: {},
        legend: {
            data: [],
            type: "scroll",
        },
        animationDurationUpdate: 1500,
        animationEasingUpdate: 'quinticInOut',
        series: [
          {
            type: 'graph',
            layout: 'none',
            roam: true,
            draggable: true,
            label: {
              show: true
            },
            categories: [],
            edgeSymbol: ['circle', 'arrow'],
            edgeSymbolSize: 8,
            edgeLabel: {
              fontSize: 10
            },
            data: [],
            links: [],
            lineStyle: {
                color: 'target',
                curveness: 0.1,
                width: 2,

            },
            scaleLimit: {
                min: 0.4,
                max: 2
            },
          }
        ]
      };


    targetIds = targetUsers.map(x => (graph.actorNameToId[x] || graph.chatNameToId[x])).filter(it => it);
    linkInformation = _extractConnections(graph, targetIds, additionalSearch);

    categories_names = [...new Set(Object.values(linkInformation.nodes.map(it => graph.chatCategories[it] || "user")))];

    option.legend.data = categories_names;
    option.series[0].categories = categories_names.map(_enrichCategory);

    metUsers = 0;
    metChats = 0;

    edgeCounter = {}

    for (node_a of Object.keys(linkInformation.routedMessages)) {
        for (node_b of Object.keys(linkInformation.routedMessages[node_a])) {
            link = {
                source: linkInformation.nodes.indexOf(node_a),
                target: linkInformation.nodes.indexOf(node_b),
            }

            option.series[0].links.push(link);

            edgeCounter[node_a] = (edgeCounter[node_a] ?? 0) + 1
            edgeCounter[node_b] = (edgeCounter[node_b] ?? 0) + 1
        }
    }

    userCount = linkInformation.nodes.filter(it => it.includes("user")).length;
    chatCount = linkInformation.nodes.filter(it => !it.includes("user")).length;

    userNodeBudget = (Math.max(userCount, chatCount) * 100) / userCount;
    chatNodeBudget = (Math.max(userCount, chatCount) * 100) / chatCount;

    option.series[0].data = linkInformation.nodes.map(
        (it) => (
            {
                // Echarts for some reason can't handle duplicate visible names
                // This is not documented anywhere except for random SO question
                name: _getGraphName(graph, it),
                symbolSize: Math.max(2, Math.min(edgeCounter[it], 20)) * 5,
                value: edgeCounter[it],
                x: (it.includes("user") ? userNodeBudget : chatNodeBudget) * (it.includes("user") ? metUsers++ : metChats++), // My sanity leaves my body with each line
                y: it.includes("user") ? 0 : 100,
                category: categories_names.indexOf(graph.chatCategories[it] || "user"),
            }
        )
    );

    chart = echarts.init(targetElem);
    chart.setOption(option)
}