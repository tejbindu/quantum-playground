use std::collections::HashMap;

use axum::{
    routing::get,
    routing::post,
    Router,
    Json,
};

use nalgebra::dvector;
use nalgebra::Complex;


use qcomp::primitive::pure_state::PureState;
use qcomp::primitive::unitary;
use qcomp::primitive::unitary::Unitary;
use tower_http::{cors::CorsLayer, services::ServeDir};

mod circuit;

#[tokio::main]
async fn main() {
    let app = Router::new()
        // API routes
        .route("/circuit/simulate", post(circuit_simulation_handler))
        // Serve static files as fallback
        .fallback_service(ServeDir::new("frontend/dist"))
        .layer(CorsLayer::permissive());

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    println!("Server running on http://0.0.0.0:3000");
    
    axum::serve(listener, app).await.unwrap();
}

async fn circuit_simulation_handler(Json(payload): Json<serde_json::Value>) -> Json<serde_json::Value> {
    println!("Logging in backend!");
    let nodes = payload["qubitNodes"].as_array().unwrap_or(&Vec::new()).clone();
    let operations = payload["operations"].as_array().unwrap_or(&Vec::new()).clone();
    let mut qubits: HashMap<&str, usize> = HashMap::new();
    let num_qubits = nodes.len();

    for i in 0..num_qubits {
        qubits.insert(nodes[i]["id"].as_str().unwrap_or("-1"), i+1);
    }

    let mut state = if nodes[0]["value"].as_i64().unwrap_or(0) == 0 { PureState::qubit0() } else { PureState::qubit1() };

    for i in 1..num_qubits {
        let qubit =  if nodes[i]["value"].as_i64().unwrap_or(0) == 0 { PureState::qubit0() } else { PureState::qubit1() };

        state = state.product(&qubit);
    }

    println!("{}", state.get_amplitudes());

    for operration in operations {
        let operation_name = operration["operation"].as_str().unwrap_or("identity");
        let inputs = operration["inputs"].as_array().unwrap_or(&Vec::new()).clone();

        let mut unitary = Unitary::identity(num_qubits, 1);
        let principal_qubit = qubits.get(inputs[0].as_str().unwrap()).unwrap().clone();

        println!("{} {}", operation_name, principal_qubit);

        match operation_name {
            "hadamard" => unitary = Unitary::hadamard(num_qubits, principal_qubit),
            "pauli_x" => unitary = Unitary::pauli_x(num_qubits, principal_qubit),
            "pauli_y" => unitary = Unitary::pauli_y(num_qubits, principal_qubit),
            "pauli_z" => unitary = Unitary::pauli_z(num_qubits, principal_qubit),
            "cnot" => {
                let second_qubit = qubits.get(inputs[1].as_str().unwrap()).unwrap().clone();
                unitary = Unitary::cnot(num_qubits, principal_qubit, second_qubit)

            },
            "swap" => {
                let second_qubit = qubits.get(inputs[1].as_str().unwrap()).unwrap().clone();
                unitary = Unitary::swap(num_qubits, principal_qubit, second_qubit)

            },
            "measurement" => continue,
            _ => {},
        };

        println!("{}", unitary.get_matrix());


        let result = state.apply(unitary);

        println!("{}", state.get_amplitudes());

        match result {
            Ok(()) => {  },
            Err(message) => { return Json(serde_json::json!({"message": message})); }
        }
    }

    let probabilities: Vec<f64> = state.get_amplitudes().as_slice().iter().map(|amplitude| amplitude.norm()).collect();

    Json(serde_json::json!({"probabilities": probabilities}))
}
