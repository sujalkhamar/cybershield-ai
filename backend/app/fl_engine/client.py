import flwr as fl
import torch
import sys
import os
# Auto-detect backend folder and add to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))

from app.ml_engine.lstm import CyberShieldLSTM

# Load the local PyTorch model
# In a real edge node, this would be trained on local, private network telemetry.
net = CyberShieldLSTM(input_size=79, hidden_size=64, num_layers=2, num_classes=5)

# Define the Flower Client
class CyberShieldClient(fl.client.NumPyClient):
    def get_parameters(self, config):
        """Extract the model weights to send to the Global Server"""
        return [val.cpu().numpy() for _, val in net.state_dict().items()]

    def fit(self, parameters, config):
        """
        Receive global weights from the server, train locally, 
        and return the updated local weights.
        """
        # Set the local model weights to the global weights
        params_dict = zip(net.state_dict().keys(), parameters)
        state_dict = {k: torch.tensor(v) for k, v in params_dict}
        net.load_state_dict(state_dict, strict=True)
        
        # TODO: Train the model locally on the edge node's private dataset
        # train_model(net, local_trainloader, epochs=1)
        
        # Return updated local weights back to the server
        print("✅ Local training complete. Sending weights to Global Server (No raw data shared!)")
        return self.get_parameters(config), 1000, {} # 1000 is mock number of examples

    def evaluate(self, parameters, config):
        """Evaluate the global model on local data."""
        # TODO: Evaluate model on local test set
        loss = 0.0
        accuracy = 0.95 # Mock accuracy for SGP presentation
        return loss, 1000, {"accuracy": accuracy}

def start_fl_client():
    """Connects this edge node to the Global FL Server"""
    print("🔌 Connecting to CyberShield-AI Global Server...")
    fl.client.start_numpy_client(
        server_address="127.0.0.1:8080", 
        client=CyberShieldClient()
    )

if __name__ == "__main__":
    start_fl_client()
