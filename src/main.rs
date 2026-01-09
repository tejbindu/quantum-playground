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
// use qcomp::stabilizer::stabilizer_tableau::StabilizerTableau;
// use qcomp::stabilizer::clifford_operation::CliffordOperation;
// use qcomp::stabilizer::error_correction::PauliError;
use tower_http::{cors::CorsLayer, services::ServeDir};

#[tokio::main]
async fn main() {
    let app = Router::new()
        // API routes
        .route("/quantum/circuit/simulate", post(circuit_simulation_handler))
        // .route("/quantum/stabilizer/simulate", post(stabilizer_simulation_handler))
        // .route("/quantum/qec/simulate", post(qec_simulation_handler))
        // Serve static files as fallback
        .fallback_service(ServeDir::new("frontend/dist"))
        .layer(CorsLayer::permissive());

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    println!("Server running on http://0.0.0.0:3000");
    
    axum::serve(listener, app).await.unwrap();
}

async fn circuit_simulation_handler(Json(payload): Json<serde_json::Value>) -> Json<serde_json::Value> {

    let nodes = payload["qubitNodes"].as_array().unwrap_or(&Vec::new()).clone();
    let operations = payload["operations"].as_array().unwrap_or(&Vec::new()).clone();
    let mut qubits: HashMap<&str, usize> = HashMap::new();
    let num_qubits = nodes.len();

    if num_qubits == 0 {
        return Json(serde_json::json!({"probabilities": []}));
    }

    for i in 0..num_qubits {
        qubits.insert(nodes[i]["id"].as_str().unwrap_or("-1"), i+1);
    }

    let mut state = if nodes[0]["value"].as_i64().unwrap_or(0) == 0 { PureState::qubit0() } else { PureState::qubit1() };

    for i in 1..num_qubits {
        let qubit =  if nodes[i]["value"].as_i64().unwrap_or(0) == 0 { PureState::qubit0() } else { PureState::qubit1() };

        state = state.product(&qubit);
    }

    for operration in operations {
        let operation_name = operration["operation"].as_str().unwrap_or("identity");
        let inputs = operration["inputs"].as_array().unwrap_or(&Vec::new()).clone();

        let mut unitary = Unitary::identity(num_qubits, 1);
        let principal_qubit = qubits.get(inputs[0].as_str().unwrap()).unwrap().clone();

        match operation_name {
            "hadamard" => unitary = Unitary::hadamard(num_qubits, principal_qubit),
            "pauli_x" => unitary = Unitary::pauli_x(num_qubits, principal_qubit),
            "pauli_y" => unitary = Unitary::pauli_y(num_qubits, principal_qubit),
            "pauli_z" => unitary = Unitary::pauli_z(num_qubits, principal_qubit),
            "phase" => unitary = Unitary::phase(num_qubits, principal_qubit),
            "t" => unitary = Unitary::t_gate(num_qubits, principal_qubit),
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

        let result = state.apply(unitary);

        match result {
            Ok(()) => {  },
            Err(message) => { return Json(serde_json::json!({"message": message})); }
        }
    }

    let probabilities: Vec<f64> = state.get_amplitudes().as_slice().iter().map(|amplitude| amplitude.norm().powf(2.0)).collect();

    Json(serde_json::json!({"probabilities": probabilities}))
}
