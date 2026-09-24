import flwr as fl
import sys

def start_fl_server(num_rounds: int = 3, min_clients: int = 2):
    """
    Starts the Flower Federated Learning Server using the FedAvg strategy.
    This server will wait for remote client nodes (like banks or hospitals) 
    to connect and send their local model weights without sharing raw data!
    """
    print(f"🚀 Starting CyberShield-AI Federated Server (Expecting {min_clients} clients)...")
    
    # Define the FedAvg strategy
    strategy = fl.server.strategy.FedAvg(
        fraction_fit=1.0,  # Sample 100% of available clients for training
        fraction_evaluate=1.0,  # Sample 100% of available clients for evaluation
        min_fit_clients=min_clients,  # Never start training until this many clients connect
        min_evaluate_clients=min_clients, 
        min_available_clients=min_clients,
    )
    
    # Start the gRPC server on port 8080
    fl.server.start_server(
        server_address="0.0.0.0:8080",
        config=fl.server.ServerConfig(num_rounds=num_rounds),
        strategy=strategy,
    )

if __name__ == "__main__":
    start_fl_server()
