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
use qcomp::stabilizer::stabilizer_tableau::StabilizerTableau;
use qcomp::stabilizer::clifford_operation::CliffordOperation;
use qcomp::stabilizer::error_correction::PauliError;
use tower_http::{cors::CorsLayer, services::ServeDir};

mod circuit;

#[tokio::main]
async fn main() {
    let app = Router::new()
        // API routes
        .route("/quantum/circuit/simulate", post(circuit_simulation_handler))
        .route("/quantum/stabilizer/simulate", post(stabilizer_simulation_handler))
        .route("/quantum/qec/simulate", post(qec_simulation_handler))
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

    let probabilities: Vec<f64> = state.get_amplitudes().as_slice().iter().map(|amplitude| amplitude.norm()).collect();

    Json(serde_json::json!({"probabilities": probabilities}))
}

async fn stabilizer_simulation_handler(Json(payload): Json<serde_json::Value>) -> Json<serde_json::Value> {
    let num_qubits = payload["numQubits"].as_u64().unwrap_or(0) as usize;
    let operations = payload["operations"].as_array().unwrap_or(&Vec::new()).clone();
    let initial_tableau = payload["initialTableau"].as_array();

    if num_qubits == 0 {
        return Json(serde_json::json!({"error": "Invalid number of qubits"}));
    }

    let mut tableau = StabilizerTableau::identity(num_qubits);

    // Set initial tableau from user input if provided
    if let Some(generators) = initial_tableau {
        for (i, generator) in generators.iter().enumerate() {
            if i >= num_qubits { break; }
            
            let paulis_array = generator["paulis"].as_array();
            if paulis_array.is_none() { continue; }
            
            let paulis = paulis_array.unwrap();
            let phase = generator["phase"].as_u64().unwrap_or(0) as u8;
            
            for (j, pauli) in paulis.iter().enumerate() {
                if j >= num_qubits { break; }
                let p = pauli.as_str().unwrap_or("I");
                match p {
                    "X" => { tableau.get_x_mut()[(i, j)] = 1; tableau.get_z_mut()[(i, j)] = 0; },
                    "Y" => { tableau.get_x_mut()[(i, j)] = 1; tableau.get_z_mut()[(i, j)] = 1; },
                    "Z" => { tableau.get_x_mut()[(i, j)] = 0; tableau.get_z_mut()[(i, j)] = 1; },
                    _ => { tableau.get_x_mut()[(i, j)] = 0; tableau.get_z_mut()[(i, j)] = 0; }
                }
            }
            tableau.get_r_mut()[i] = phase;
        }
    }

    let mut evolution_steps = Vec::new();
    
    // Capture initial state
    let n = tableau.get_n();
    evolution_steps.push(serde_json::json!({
        "operation": "Initial",
        "x": (0..(2*n)).map(|i| (0..n).map(|j| tableau.get_x()[(i, j)]).collect::<Vec<_>>()).collect::<Vec<_>>(),
        "z": (0..(2*n)).map(|i| (0..n).map(|j| tableau.get_z()[(i, j)]).collect::<Vec<_>>()).collect::<Vec<_>>(),
        "r": (0..(2*n)).map(|i| tableau.get_r()[i]).collect::<Vec<_>>()
    }));

    for operation in &operations {
        let op_name = operation["operation"].as_str().unwrap_or("");
        let inputs_array = operation["inputs"].as_array();

        if inputs_array.is_none() || inputs_array.unwrap().is_empty() {
            continue;
        }

        let inputs = inputs_array.unwrap();
        let target = inputs[0].as_u64().unwrap_or(0) as usize;

        match op_name {
            "hadamard" => tableau.apply_clifford(CliffordOperation::HADAMARD, target, None),
            "pauli_x" => tableau.apply_clifford(CliffordOperation::PAULI_X, target, None),
            "pauli_y" => tableau.apply_clifford(CliffordOperation::PAULI_Y, target, None),
            "pauli_z" => tableau.apply_clifford(CliffordOperation::PAULI_Z, target, None),
            "cnot" => {
                if inputs.len() >= 2 {
                    let control = inputs[0].as_u64().unwrap_or(0) as usize;
                    let target = inputs[1].as_u64().unwrap_or(0) as usize;
                    tableau.apply_clifford(CliffordOperation::CNOT, target, Some(control));
                }
            },
            "swap" => {
                if inputs.len() >= 2 {
                    let q1 = inputs[0].as_u64().unwrap_or(0) as usize;
                    let q2 = inputs[1].as_u64().unwrap_or(0) as usize;
                    tableau.apply_clifford(CliffordOperation::CNOT, q2, Some(q1));
                    tableau.apply_clifford(CliffordOperation::CNOT, q1, Some(q2));
                    tableau.apply_clifford(CliffordOperation::CNOT, q2, Some(q1));
                }
            },
            _ => {}
        }
        
        // Capture state after this operation
        evolution_steps.push(serde_json::json!({
            "operation": op_name,
            "x": (0..(2*n)).map(|i| (0..n).map(|j| tableau.get_x()[(i, j)]).collect::<Vec<_>>()).collect::<Vec<_>>(),
            "z": (0..(2*n)).map(|i| (0..n).map(|j| tableau.get_z()[(i, j)]).collect::<Vec<_>>()).collect::<Vec<_>>(),
            "r": (0..(2*n)).map(|i| tableau.get_r()[i]).collect::<Vec<_>>()
        }));
    }

    let n = tableau.get_n();
    let x_matrix: Vec<Vec<u8>> = (0..(2*n)).map(|i| 
        (0..n).map(|j| tableau.get_x()[(i, j)]).collect()
    ).collect();
    let z_matrix: Vec<Vec<u8>> = (0..(2*n)).map(|i|
        (0..n).map(|j| tableau.get_z()[(i, j)]).collect()
    ).collect();
    let r_vector: Vec<u8> = (0..(2*n)).map(|i| tableau.get_r()[i]).collect();

    Json(serde_json::json!({
        "numQubits": n,
        "x": x_matrix,
        "z": z_matrix,
        "r": r_vector,
        "evolution": evolution_steps
    }))
}

async fn qec_simulation_handler(Json(payload): Json<serde_json::Value>) -> Json<serde_json::Value> {
    let code_type = payload["codeType"].as_str();
    let errors = payload["errors"].as_array();

    let mut tableau = if let Some(code) = code_type {
        match code {
            "bit_flip" => StabilizerTableau::three_qubit_bit_flip(),
            "phase_flip" => StabilizerTableau::three_qubit_phase_flip(),
            "steane" => StabilizerTableau::steane_code(),
            _ => return Json(serde_json::json!({"error": "Unknown code type"}))
        }
    } else {
        // Use custom tableau if provided
        let num_qubits = payload["numQubits"].as_u64().unwrap_or(0) as usize;
        let initial_tableau = payload["initialTableau"].as_array();
        
        if num_qubits == 0 {
            return Json(serde_json::json!({"error": "Invalid number of qubits"}));
        }

        let mut tableau = StabilizerTableau::identity(num_qubits);

        if let Some(generators) = initial_tableau {
            for (i, generator) in generators.iter().enumerate() {
                if i >= num_qubits { break; }
                
                let paulis_array = generator["paulis"].as_array();
                if paulis_array.is_none() { continue; }
                
                let paulis = paulis_array.unwrap();
                let phase = generator["phase"].as_u64().unwrap_or(0) as u8;
                
                for (j, pauli) in paulis.iter().enumerate() {
                    if j >= num_qubits { break; }
                    let p = pauli.as_str().unwrap_or("I");
                    match p {
                        "X" => { tableau.get_x_mut()[(i, j)] = 1; tableau.get_z_mut()[(i, j)] = 0; },
                        "Y" => { tableau.get_x_mut()[(i, j)] = 1; tableau.get_z_mut()[(i, j)] = 1; },
                        "Z" => { tableau.get_x_mut()[(i, j)] = 0; tableau.get_z_mut()[(i, j)] = 1; },
                        _ => { tableau.get_x_mut()[(i, j)] = 0; tableau.get_z_mut()[(i, j)] = 0; }
                    }
                }
                tableau.get_r_mut()[i] = phase;
            }
        }
        tableau
    };

    let n = tableau.get_n();
    
    // Capture state before errors
    let initial_state = serde_json::json!({
        "x": (0..(2*n)).map(|i| (0..n).map(|j| tableau.get_x()[(i, j)]).collect::<Vec<_>>()).collect::<Vec<_>>(),
        "z": (0..(2*n)).map(|i| (0..n).map(|j| tableau.get_z()[(i, j)]).collect::<Vec<_>>()).collect::<Vec<_>>(),
        "r": (0..(2*n)).map(|i| tableau.get_r()[i]).collect::<Vec<_>>(),
        "syndrome": tableau.measure_syndrome()
    });

    // Apply errors
    if let Some(error_list) = errors {
        for error in error_list {
            let error_type = error["type"].as_str().unwrap_or("I");
            let qubit = error["qubit"].as_u64().unwrap_or(0) as usize;
            
            let pauli_error = match error_type {
                "X" => PauliError::X,
                "Y" => PauliError::Y,
                "Z" => PauliError::Z,
                _ => PauliError::I,
            };
            
            tableau.apply_error(pauli_error, qubit);
        }
    }

    // Capture state after errors
    let after_errors = serde_json::json!({
        "x": (0..(2*n)).map(|i| (0..n).map(|j| tableau.get_x()[(i, j)]).collect::<Vec<_>>()).collect::<Vec<_>>(),
        "z": (0..(2*n)).map(|i| (0..n).map(|j| tableau.get_z()[(i, j)]).collect::<Vec<_>>()).collect::<Vec<_>>(),
        "r": (0..(2*n)).map(|i| tableau.get_r()[i]).collect::<Vec<_>>(),
        "syndrome": tableau.measure_syndrome()
    });

    // Decode syndrome and apply recovery
    let recovery = tableau.decode_syndrome();
    let mut after_recovery = None;
    let mut recovery_operation = None;

    if let Some((error_type, qubit)) = recovery {
        let error_str = match error_type {
            PauliError::X => "X",
            PauliError::Y => "Y",
            PauliError::Z => "Z",
            PauliError::I => "I",
        };
        recovery_operation = Some(serde_json::json!({
            "type": error_str,
            "qubit": qubit
        }));

        // Apply recovery
        tableau.apply_error(error_type, qubit);
        
        after_recovery = Some(serde_json::json!({
            "x": (0..(2*n)).map(|i| (0..n).map(|j| tableau.get_x()[(i, j)]).collect::<Vec<_>>()).collect::<Vec<_>>(),
            "z": (0..(2*n)).map(|i| (0..n).map(|j| tableau.get_z()[(i, j)]).collect::<Vec<_>>()).collect::<Vec<_>>(),
            "r": (0..(2*n)).map(|i| tableau.get_r()[i]).collect::<Vec<_>>(),
            "syndrome": tableau.measure_syndrome()
        }));
    }

    Json(serde_json::json!({
        "numQubits": n,
        "initial": initial_state,
        "afterErrors": after_errors,
        "afterRecovery": after_recovery,
        "recovery": recovery_operation,
        "hasError": after_errors["syndrome"].as_array().unwrap().iter().any(|s| s.as_u64().unwrap() != 0)
    }))
}
