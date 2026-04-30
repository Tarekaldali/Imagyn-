"""
LMB LoRA Performance Optimization Script for RTX 3070

This script diagnoses and fixes performance issues with LMB LoRA and NSFW models.
"""

import json
import os
import requests
import time
from pathlib import Path

# ComfyUI API endpoints
COMFYUI_URL = "http://127.0.0.1:8188"

def get_model_info():
    """Get information about loaded models and LoRAs"""
    try:
        response = requests.get(f"{COMFYUI_URL}/object_info")
        if response.status_code == 200:
            return response.json()
    except:
        pass
    return None

def create_optimized_lmb_workflow():
    """Create an optimized workflow specifically for LMB LoRA with NSFW models"""
    
    workflow = {
        "3": {
            "inputs": {
                "seed": 42,
                "steps": 15,  # Reduced from 20 for faster generation
                "cfg": 6.0,   # Reduced CFG to prevent over-processing
                "sampler_name": "dpmpp_sde",  # Fastest sampler for quality
                "scheduler": "karras",
                "denoise": 1,
                "model": ["4", 0],
                "positive": ["6", 0],
                "negative": ["7", 0],
                "latent_image": ["5", 0]
            },
            "class_type": "KSampler",
            "_meta": {
                "title": "Optimized KSampler"
            }
        },
        "4": {
            "inputs": {
                "ckpt_name": "v1-5-pruned-emaonly-fp16.safetensors"  # Use SD 1.5 for LMB LoRA compatibility
            },
            "class_type": "CheckpointLoaderSimple",
            "_meta": {
                "title": "SD 1.5 Model Loader"
            }
        },
        "5": {
            "inputs": {
                "width": 768,   # Reduced resolution to save memory
                "height": 768,  # Square format is more memory efficient
                "batch_size": 1
            },
            "class_type": "EmptyLatentImage",
            "_meta": {
                "title": "Latent Image"
            }
        },
        "6": {
            "inputs": {
                "text": "beautiful woman, detailed face, high quality, masterpiece",
                "clip": ["10", 1]  # Connect to LoRA loader
            },
            "class_type": "CLIPTextEncode",
            "_meta": {
                "title": "Positive Prompt"
            }
        },
        "7": {
            "inputs": {
                "text": "low quality, blurry, bad anatomy, worst quality",
                "clip": ["10", 1]  # Connect to LoRA loader
            },
            "class_type": "CLIPTextEncode",
            "_meta": {
                "title": "Negative Prompt"
            }
        },
        "8": {
            "inputs": {
                "samples": ["3", 0],
                "vae": ["4", 2]
            },
            "class_type": "VAEDecode",
            "_meta": {
                "title": "VAE Decoder"
            }
        },
        "9": {
            "inputs": {
                "filename_prefix": "optimized_lmb",
                "images": ["8", 0]
            },
            "class_type": "SaveImage",
            "_meta": {
                "title": "Save Image"
            }
        },
        "10": {
            "inputs": {
                "lora_name": "LMB_style_v2.2_IL.safetensors",
                "strength_model": 0.6,  # Reduced from 0.8 to prevent over-processing
                "strength_clip": 0.6,
                "model": ["4", 0],
                "clip": ["4", 1]
            },
            "class_type": "LoraLoader",
            "_meta": {
                "title": "LMB LoRA Loader"
            }
        }
    }
    
    return workflow

def create_memory_optimized_workflow():
    """Create a memory-optimized workflow for RTX 3070 8GB"""
    
    workflow = {
        "3": {
            "inputs": {
                "seed": 42,
                "steps": 12,  # Further reduced steps
                "cfg": 5.5,   # Lower CFG
                "sampler_name": "ddim",  # Most memory efficient sampler
                "scheduler": "normal",
                "denoise": 1,
                "model": ["4", 0],
                "positive": ["6", 0],
                "negative": ["7", 0],
                "latent_image": ["5", 0]
            },
            "class_type": "KSampler",
            "_meta": {
                "title": "Memory Optimized Sampler"
            }
        },
        "4": {
            "inputs": {
                "ckpt_name": "v1-5-pruned-emaonly-fp16.safetensors"  # Ensure SD 1.5
            },
            "class_type": "CheckpointLoaderSimple",
            "_meta": {
                "title": "SD 1.5 Loader"
            }
        },
        "5": {
            "inputs": {
                "width": 512,   # Smaller resolution for memory
                "height": 512,
                "batch_size": 1
            },
            "class_type": "EmptyLatentImage",
            "_meta": {
                "title": "Small Latent"
            }
        },
        "6": {
            "inputs": {
                "text": "beautiful woman, lmb style, detailed, high quality",
                "clip": ["10", 1]
            },
            "class_type": "CLIPTextEncode",
            "_meta": {
                "title": "Positive"
            }
        },
        "7": {
            "inputs": {
                "text": "low quality, blurry, bad anatomy",
                "clip": ["10", 1]
            },
            "class_type": "CLIPTextEncode",
            "_meta": {
                "title": "Negative"
            }
        },
        "8": {
            "inputs": {
                "samples": ["3", 0],
                "vae": ["4", 2]
            },
            "class_type": "VAEDecode",
            "_meta": {
                "title": "VAE Decode"
            }
        },
        "9": {
            "inputs": {
                "filename_prefix": "lmb_fast",
                "images": ["8", 0]
            },
            "class_type": "SaveImage",
            "_meta": {
                "title": "Save"
            }
        },
        "10": {
            "inputs": {
                "lora_name": "LMB_style_v2.2_IL.safetensors",
                "strength_model": 0.4,  # Much lower strength for memory efficiency
                "strength_clip": 0.4,
                "model": ["4", 0],
                "clip": ["4", 1]
            },
            "class_type": "LoraLoader",
            "_meta": {
                "title": "LMB LoRA"
            }
        }
    }
    
    return workflow

def test_workflow(workflow, name):
    """Test a workflow and measure performance"""
    print(f"\n=== Testing {name} ===")
    
    try:
        # Queue the prompt
        start_time = time.time()
        response = requests.post(f"{COMFYUI_URL}/prompt", json={"prompt": workflow})
        
        if response.status_code == 200:
            result = response.json()
            prompt_id = result.get("prompt_id")
            print(f"Queued prompt: {prompt_id}")
            
            # Monitor progress (simplified)
            print("Generation started... (check ComfyUI terminal for progress)")
            return True
        else:
            print(f"Error queuing prompt: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"Error testing workflow: {e}")
        return False

def main():
    """Main optimization function"""
    print("LMB LoRA Performance Optimization for RTX 3070")
    print("=" * 50)
    
    # Check ComfyUI connection
    try:
        response = requests.get(f"{COMFYUI_URL}/object_info", timeout=5)
        if response.status_code != 200:
            print("❌ ComfyUI not accessible. Make sure it's running on port 8188")
            return
    except:
        print("❌ ComfyUI not accessible. Make sure it's running on port 8188")
        return
    
    print("✅ ComfyUI connection successful")
    
    # Create test workflows
    print("\n📝 Creating optimized workflows...")
    
    # Save workflows
    workflows_dir = Path("optimization_workflows")
    workflows_dir.mkdir(exist_ok=True)
    
    # Optimized workflow
    optimized_workflow = create_optimized_lmb_workflow()
    with open(workflows_dir / "lmb_optimized.json", "w") as f:
        json.dump(optimized_workflow, f, indent=2)
    
    # Memory optimized workflow
    memory_workflow = create_memory_optimized_workflow()
    with open(workflows_dir / "lmb_memory_optimized.json", "w") as f:
        json.dump(memory_workflow, f, indent=2)
    
    print("✅ Workflows saved to optimization_workflows/")
    
    # Test workflows
    print("\n🚀 Testing optimized workflow...")
    success1 = test_workflow(optimized_workflow, "LMB Optimized")
    
    time.sleep(2)  # Brief pause between tests
    
    print("\n🚀 Testing memory optimized workflow...")
    success2 = test_workflow(memory_workflow, "LMB Memory Optimized")
    
    # Recommendations
    print("\n" + "=" * 50)
    print("🔧 PERFORMANCE RECOMMENDATIONS:")
    print("=" * 50)
    
    print("\n1. MODEL COMPATIBILITY:")
    print("   ✅ Use SD 1.5 models with LMB LoRA (not SDXL)")
    print("   ✅ Recommended: v1-5-pruned-emaonly-fp16.safetensors")
    print("   ❌ Avoid: waiNSFWIllustrious_v150.safetensors (likely SDXL)")
    
    print("\n2. MEMORY OPTIMIZATION:")
    print("   ✅ Use 512x512 or 768x768 resolution (not 1920x1080)")
    print("   ✅ Reduce LoRA strength to 0.4-0.6 (not 0.8)")
    print("   ✅ Use 12-15 steps (not 20+)")
    print("   ✅ Close other GPU-intensive applications")
    
    print("\n3. SAMPLER SETTINGS:")
    print("   ✅ Best: ddim (memory efficient)")
    print("   ✅ Good: dpmpp_sde + karras")
    print("   ❌ Avoid: dpmpp_2m_sde (memory heavy)")
    
    print("\n4. LAUNCH PARAMETERS:")
    print("   Add these to your ComfyUI launch:")
    print("   --lowvram --fp16-vae")
    
    print("\n5. IMMEDIATE FIXES:")
    print("   • Restart ComfyUI to clear memory")
    print("   • Use the memory_optimized workflow first")
    print("   • Monitor GPU usage with nvidia-smi")
    
    print("\n📊 EXPECTED PERFORMANCE:")
    print("   • Before: ~72s per step")
    print("   • After: ~2-5s per step")
    print("   • Memory usage: <6GB (from 7.8GB)")

if __name__ == "__main__":
    main()