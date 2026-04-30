#!/usr/bin/env python3
"""
GPU Test Script for ComfyUI
"""

import torch
import sys

def test_gpu():
    print("🔧 GPU Test Results:")
    print("="*50)
    
    # Basic PyTorch info
    print(f"PyTorch Version: {torch.__version__}")
    print(f"CUDA Available: {torch.cuda.is_available()}")
    
    if torch.cuda.is_available():
        print(f"CUDA Version: {torch.version.cuda}")
        print(f"Number of GPUs: {torch.cuda.device_count()}")
        print(f"Current GPU: {torch.cuda.current_device()}")
        print(f"GPU Name: {torch.cuda.get_device_name(0)}")
        print(f"GPU Memory: {torch.cuda.get_device_properties(0).total_memory / 1024**3:.1f} GB")
        
        # Test GPU computation
        print("\n🧪 Testing GPU computation...")
        device = torch.device('cuda:0')
        x = torch.randn(1000, 1000, device=device)
        y = torch.randn(1000, 1000, device=device)
        z = torch.mm(x, y)
        print(f"✅ GPU computation test passed! Result shape: {z.shape}")
        print(f"✅ Result device: {z.device}")
        
        # Memory usage
        print(f"\n📊 GPU Memory Usage:")
        print(f"Allocated: {torch.cuda.memory_allocated(0) / 1024**2:.1f} MB")
        print(f"Reserved: {torch.cuda.memory_reserved(0) / 1024**2:.1f} MB")
    else:
        print("❌ CUDA is not available. Running on CPU.")
    
    print("="*50)

if __name__ == "__main__":
    test_gpu()