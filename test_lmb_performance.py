"""
LMB LoRA Performance Test Script for RTX 3070

This script runs performance tests with the optimized settings to measure improvement.
"""

import requests
import json
import time
from datetime import datetime

COMFYUI_URL = "http://127.0.0.1:8188"
WEB_APP_URL = "http://127.0.0.1:8003"

def test_lmb_performance():
    """Test LMB LoRA performance with optimized settings"""
    
    print("🔬 LMB LoRA Performance Test for RTX 3070")
    print("=" * 50)
    
    # Test data for different configurations
    test_configs = [
        {
            "name": "Memory Optimized (512x512, 12 steps, LMB 0.4)",
            "data": {
                "prompt": "beautiful woman, lmb style, detailed face, masterpiece",
                "model": "v1-5-pruned-emaonly-fp16.safetensors",
                "lora": "LMB_style_v2.2_IL",
                "lora_strength": 0.4,
                "width": 512,
                "height": 512,
                "steps": 12,
                "cfg_scale": 6.0
            }
        },
        {
            "name": "Balanced Quality (768x768, 15 steps, LMB 0.4)",
            "data": {
                "prompt": "beautiful woman, lmb style, detailed face, high quality",
                "model": "v1-5-pruned-emaonly-fp16.safetensors", 
                "lora": "LMB_style_v2.2_IL",
                "lora_strength": 0.4,
                "width": 768,
                "height": 768,
                "steps": 15,
                "cfg_scale": 7.0
            }
        },
        {
            "name": "No LoRA Baseline (768x768, 15 steps)",
            "data": {
                "prompt": "beautiful woman, detailed face, high quality",
                "model": "v1-5-pruned-emaonly-fp16.safetensors",
                "width": 768,
                "height": 768,
                "steps": 15,
                "cfg_scale": 7.0
            }
        }
    ]
    
    results = []
    
    for i, config in enumerate(test_configs, 1):
        print(f"\n📊 Test {i}/3: {config['name']}")
        print("-" * 40)
        
        try:
            # Record start time
            start_time = time.time()
            
            # Send request to web app
            response = requests.post(
                f"{WEB_APP_URL}/generate",
                json=config["data"],
                timeout=300  # 5 minute timeout
            )
            
            end_time = time.time()
            duration = end_time - start_time
            
            if response.status_code == 200:
                result_data = response.json()
                print(f"✅ Success: {duration:.1f}s")
                print(f"   Image: {result_data.get('image_url', 'N/A')}")
                
                results.append({
                    "config": config["name"],
                    "duration": duration,
                    "success": True,
                    "details": config["data"]
                })
            else:
                print(f"❌ Failed: HTTP {response.status_code}")
                print(f"   Error: {response.text}")
                
                results.append({
                    "config": config["name"],
                    "duration": duration,
                    "success": False,
                    "error": f"HTTP {response.status_code}"
                })
                
        except requests.exceptions.Timeout:
            print(f"⏰ Timeout: >300s (test cancelled)")
            results.append({
                "config": config["name"],
                "duration": 300,
                "success": False,
                "error": "Timeout"
            })
            
        except Exception as e:
            print(f"💥 Error: {e}")
            results.append({
                "config": config["name"],
                "duration": 0,
                "success": False,
                "error": str(e)
            })
        
        # Wait between tests
        if i < len(test_configs):
            print("   Waiting 5s before next test...")
            time.sleep(5)
    
    # Print summary
    print("\n" + "=" * 50)
    print("📊 PERFORMANCE SUMMARY")
    print("=" * 50)
    
    for result in results:
        status = "✅ SUCCESS" if result["success"] else "❌ FAILED"
        duration_str = f"{result['duration']:.1f}s" if result["success"] else result.get("error", "Unknown")
        print(f"{result['config']:<50} {status} ({duration_str})")
    
    # Performance analysis
    successful_tests = [r for r in results if r["success"]]
    if successful_tests:
        fastest = min(successful_tests, key=lambda x: x["duration"])
        slowest = max(successful_tests, key=lambda x: x["duration"])
        
        print(f"\n🏆 Fastest: {fastest['config']} ({fastest['duration']:.1f}s)")
        print(f"🐌 Slowest: {slowest['config']} ({slowest['duration']:.1f}s)")
        
        lmb_tests = [r for r in successful_tests if "LMB" in r["config"]]
        baseline_tests = [r for r in successful_tests if "No LoRA" in r["config"]]
        
        if lmb_tests and baseline_tests:
            lmb_avg = sum(t["duration"] for t in lmb_tests) / len(lmb_tests)
            baseline_avg = sum(t["duration"] for t in baseline_tests) / len(baseline_tests)
            overhead = lmb_avg - baseline_avg
            
            print(f"\n📈 Performance Impact:")
            print(f"   Baseline (no LoRA): {baseline_avg:.1f}s")
            print(f"   LMB LoRA average: {lmb_avg:.1f}s")
            print(f"   LoRA overhead: +{overhead:.1f}s ({(overhead/baseline_avg)*100:.1f}%)")
    
    # Save results
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    results_file = f"lmb_performance_test_{timestamp}.json"
    
    with open(results_file, 'w') as f:
        json.dump({
            "timestamp": timestamp,
            "test_configs": test_configs,
            "results": results
        }, f, indent=2)
    
    print(f"\n💾 Results saved to: {results_file}")
    return results

def check_gpu_status():
    """Check GPU memory usage"""
    try:
        import subprocess
        result = subprocess.run(['nvidia-smi', '--query-gpu=memory.used,memory.total,utilization.gpu', '--format=csv,noheader,nounits'], 
                              capture_output=True, text=True)
        if result.returncode == 0:
            memory_used, memory_total, gpu_util = result.stdout.strip().split(', ')
            memory_percent = (int(memory_used) / int(memory_total)) * 100
            
            print(f"🖥️  GPU Status:")
            print(f"   Memory: {memory_used}MB / {memory_total}MB ({memory_percent:.1f}%)")
            print(f"   Utilization: {gpu_util}%")
            
            if memory_percent > 90:
                print("   ⚠️  WARNING: High memory usage detected!")
            elif memory_percent > 80:
                print("   🟡 Moderate memory usage")
            else:
                print("   ✅ Good memory usage")
                
    except Exception as e:
        print(f"Could not check GPU status: {e}")

def main():
    """Main test function"""
    print("Starting LMB LoRA performance optimization test...")
    
    # Check services
    try:
        response = requests.get(f"{WEB_APP_URL}/models", timeout=5)
        if response.status_code != 200:
            print("❌ Web app not accessible. Start it with: python -m web_wrapper.web_app")
            return
    except:
        print("❌ Web app not accessible. Start it with: python -m web_wrapper.web_app")
        return
    
    try:
        response = requests.get(f"{COMFYUI_URL}/object_info", timeout=5)
        if response.status_code != 200:
            print("❌ ComfyUI not accessible. Start it with optimized settings.")
            return
    except:
        print("❌ ComfyUI not accessible. Use restart_optimized_comfyui.bat")
        return
    
    print("✅ All services accessible")
    
    # Check GPU before testing
    check_gpu_status()
    
    # Run performance tests
    results = test_lmb_performance()
    
    # Final GPU check
    print(f"\n{'-'*50}")
    check_gpu_status()

if __name__ == "__main__":
    main()