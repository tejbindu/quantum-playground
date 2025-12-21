# Quantum Playground

An interactive web application for simulating quantum circuits, visualizing stabilizer tableau operations, and demonstrating quantum error correction.

## Features

### 1. Quantum Circuit Simulation
- Visual circuit builder with drag-and-drop gates
- Support for single-qubit gates (H, X, Y, Z, Phase, T)
- Two-qubit gates (CNOT, SWAP, CPhase)
- Real-time probability distribution visualization
- Measurement outcomes display

### 2. Stabilizer Tableau Operations
- Custom stabilizer generator input
- Clifford gate operations (H, X, Y, Z, CNOT, SWAP)
- Step-by-step evolution visualization
- Phase tracking (+1, -1, +i, -i)
- Horizontal flow display with gate icons

### 3. Quantum Error Correction
- Pre-built QEC codes:
  - 3-qubit bit-flip code
  - 3-qubit phase-flip code
  - Steane 7-qubit code
- Error injection (X, Y, Z errors)
- Syndrome measurement
- Automatic error detection and correction
- Recovery operation visualization

## Tech Stack

**Backend:**
- Rust with Axum web framework
- qcomp library for quantum computations
- Stabilizer formalism implementation

**Frontend:**
- React + TypeScript
- React Flow for circuit visualization
- Vite for build tooling

## Installation

### Prerequisites
- Rust (latest stable)
- Node.js (v18+)
- npm or yarn

### Setup

1. **Clone the repository:**
```bash
git clone <repository-url>
cd quantum-playground
```

2. **Build the frontend:**
```bash
cd frontend
npm install
npm run build
cd ..
```

3. **Run the backend:**
```bash
cargo run
```

4. **Access the application:**
Open your browser to `http://localhost:3000`

## Development Mode

For frontend development with hot reload:

1. **Terminal 1 - Backend:**
```bash
cargo run
```

2. **Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

Access at `http://localhost:5173` (Vite dev server with proxy to backend)

## Project Structure

```
quantum-playground/
├── src/
│   ├── main.rs              # Backend server and API endpoints
│   └── circuit/             # Circuit simulation logic
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── circuit-sim/           # Quantum circuit simulator
│   │   │   ├── stabilizer-evolution/  # Stabilizer operations
│   │   │   └── qec/                   # Error correction
│   │   ├── App.tsx          # Main application
│   │   └── main.tsx         # Entry point
│   └── package.json
├── Cargo.toml
└── README.md
```

## API Endpoints

### POST /quantum/circuit/simulate
Simulates a quantum circuit and returns probability distribution.

**Request:**
```json
{
  "qubitNodes": [{"id": "q0", "value": 0}],
  "operations": [{"operation": "hadamard", "inputs": [0]}]
}
```

**Response:**
```json
{
  "probabilities": [0.5, 0.5]
}
```

### POST /quantum/stabilizer/simulate
Simulates stabilizer evolution through Clifford operations.

**Request:**
```json
{
  "numQubits": 3,
  "initialTableau": [...],
  "operations": [{"operation": "hadamard", "inputs": [0]}]
}
```

**Response:**
```json
{
  "numQubits": 3,
  "x": [[...]],
  "z": [[...]],
  "r": [...],
  "evolution": [...]
}
```

### POST /quantum/qec/simulate
Simulates quantum error correction with syndrome measurement and recovery.

**Request:**
```json
{
  "codeType": "bit_flip",
  "errors": [{"type": "X", "qubit": 0}]
}
```

**Response:**
```json
{
  "initial": {...},
  "afterErrors": {...},
  "afterRecovery": {...},
  "recovery": {"type": "X", "qubit": 0},
  "hasError": true
}
```

## Usage Examples

### Circuit Simulation
1. Navigate to "Quantum Circuit Simulation" tab
2. Drag qubit nodes from palette to canvas
3. Add gates between qubits
4. Connect gates with wires
5. Click "Compile Circuit and Run"
6. View probability distribution

### Stabilizer Operations
1. Navigate to "Stabilizer Tableau Operations" tab
2. Set number of qubits and define initial stabilizers
3. Add Clifford gates to the circuit
4. Click "Compile Circuit and Run"
5. View step-by-step stabilizer evolution

### Error Correction
1. Navigate to "Quantum Error Correction" tab
2. Select a QEC code from dropdown
3. Inject errors on specific qubits
4. Click "Measure Syndrome & Correct"
5. View syndrome, recovery operation, and corrected state

## Docker Deployment

```bash
docker build -t quantum-playground .
docker run -p 3000:3000 quantum-playground
```

## Contributing

Contributions are welcome! Please feel free to submit pull requests.

## License

[Add your license here]

## Acknowledgments

Built using the qcomp quantum computing library for stabilizer formalism and state vector simulations.
