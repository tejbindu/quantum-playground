export function transform_graph_to_circuit(nodes, edges) {

    const graph = {}

    for (const node of nodes) {
	graph[node.id] = []
    }

    for (const edge of edges) {
	graph[edge.source].push(edge.target)
	graph[edge.target].push(edge.source)
    }

    console.log(graph)

    return validate_circuit_graph(nodes, edges, graph)

}

export function validate_circuit_graph(nodes, edges, graph) {


    for (const node of nodes) {
	if (node.type === 'qubitNode' && graph[node.id].length != 1) {
	    return false
	} else if (node.type === 'measurementNode' && graph[node.id].length != 1) {
	    return false
	} else if (node.type === 'singleQubitGateNode' && graph[node.id].length != 2) {
	    return false
	}
    }

    return true
}
