use axum::{
    routing::get,
    Router,
    Json,
};
use tower_http::cors::CorsLayer;
use std::net::SocketAddr;

#[tokio::main]
async fn main() {
    let app = Router::new()
        // API routes
        .route("/api/hello", get(hello_handler))
        .layer(CorsLayer::permissive());

    let listener = tokio::net::TcpListener::bind("127.0.0.1:3000").await.unwrap();
    println!("Server running on http://localhost:3000");
    
    axum::serve(listener, app).await.unwrap();
}

async fn hello_handler() -> Json<serde_json::Value> {
    Json(serde_json::json!({"message": "Hello from Rust backend!"}))
}
