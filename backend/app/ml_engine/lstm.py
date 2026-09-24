import torch
import torch.nn as nn

class CyberShieldLSTM(nn.Module):
    def __init__(self, input_size=79, hidden_size=64, num_layers=2, num_classes=5):
        """
        PyTorch LSTM for classifying known cyberattacks based on sequential network telemetry.
        input_size = 79 (Number of features in CICIDS2017)
        num_classes = 5 (Benign, DDoS, PortScan, BruteForce, Botnet)
        """
        super(CyberShieldLSTM, self).__init__()
        self.hidden_size = hidden_size
        self.num_layers = num_layers
        
        # The LSTM layer (Stage 1 of the architecture diagram)
        self.lstm = nn.LSTM(input_size, hidden_size, num_layers, batch_first=True, dropout=0.2)
        
        # Fully connected layer to map LSTM outputs to the 5 prediction classes
        self.fc = nn.Linear(hidden_size, num_classes)
        
    def forward(self, x):
        # Initialize hidden and cell states with zeros
        h0 = torch.zeros(self.num_layers, x.size(0), self.hidden_size).to(x.device)
        c0 = torch.zeros(self.num_layers, x.size(0), self.hidden_size).to(x.device)
        
        # Forward propagate LSTM
        out, _ = self.lstm(x, (h0, c0))
        
        # Decode the hidden state of the last time step
        # Assuming x is of shape (batch_size, sequence_length, input_size)
        out = self.fc(out[:, -1, :])
        return out
