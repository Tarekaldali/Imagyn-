#!/usr/bin/env python3
from flask import Flask, request, jsonify, send_from_directory, send_file, make_response
from flask_cors import CORS
import requests
import json
import time
import os
import time
import random
from pathlib import Path
from werkzeug.utils import secure_filename
import uuid

# Import R2 uploader
try:
    from r2_uploader import upload_image_to_r2
    R2_ENABLED = True
    print("[R2] R2 uploader enabled")
except Exception as e:
    R2_ENABLED = False
    print(f"[R2] R2 uploader disabled: {e}")

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*", "methods": ["GET", "POST", "OPTIONS"], "allow_headers": ["Content-Type"]}})

COMFYUI_URL = os.environ.get("COMFYUI_URL", "http://localhost:8189")
FRONTEND_DIR = Path(__file__).parent / "frontend"
OUTPUT_DIR = Path(__file__).parent.parent / "output"
# Ensure output directory exists
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
UPLOAD_DIR = Path(__file__).parent.parent / "input"
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'}

# Ensure upload directory exists
UPLOAD_DIR.mkdir(exist_ok=True)

# Add CORS headers to all responses
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

VALID_SAMPLERS = [
    "euler", "euler_cfg_pp", "euler_ancestral", "euler_ancestral_cfg_pp",
    "heun", "heunpp2", "dpm_2", "dpm_2_ancestral", "lms",
    "dpm_fast", "dpm_adaptive", "dpmpp_2s_ancestral", "dpmpp_2s_ancestral_cfg_pp",
    "dpmpp_sde", "dpmpp_sde_gpu", "dpmpp_2m", "dpmpp_2m_cfg_pp", "dpmpp_2m_sde",
    "dpmpp_2m_sde_gpu", "dpmpp_2m_sde_heun", "dpmpp_2m_sde_heun_gpu",
    "dpmpp_3m_sde", "dpmpp_3m_sde_gpu", "ddpm", "lcm", "ipndm", "ipndm_v",
    "deis", "res_multistep", "res_multistep_cfg_pp", "res_multistep_ancestral",
    "res_multistep_ancestral_cfg_pp", "gradient_estimation", "gradient_estimation_cfg_pp",
    "er_sde", "seeds_2", "seeds_3", "sa_solver", "sa_solver_pece",
    "ddim", "uni_pc", "uni_pc_bh2"
]

VALID_SCHEDULERS = [
    "simple", "sgm_uniform", "karras", "exponential", "ddim_uniform",
    "beta", "normal", "linear_quadratic", "kl_optimal"
]

SCHEDULER_ALIASES = {
    "linear": "linear_quadratic",
    "cosine": "sgm_uniform",
    "ays": "sgm_uniform",
    "gits": "normal",
    "polyexponential": "exponential",
    "vp": "linear_quadratic",
    "laplace": "linear_quadratic"
}


def normalize_sampling_params(sampler_value: str | None, scheduler_value: str | None):
    sampler = sampler_value or "dpmpp_2m"
    scheduler = scheduler_value or "normal"

    if sampler not in VALID_SAMPLERS:
        for sched in VALID_SCHEDULERS:
            suffix = f"_{sched}"
            if sampler.endswith(suffix):
                candidate = sampler[: -len(suffix)]
                if candidate in VALID_SAMPLERS:
                    sampler = candidate
                    scheduler = sched
                    break
        else:
            sampler = "dpmpp_2m"

    scheduler = SCHEDULER_ALIASES.get(scheduler, scheduler)
    if scheduler not in VALID_SCHEDULERS:
        scheduler = "normal"

    return sampler, scheduler

@app.route('/')
def index():
    response = make_response(send_from_directory(FRONTEND_DIR, 'index.html'))
    response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'
    return response

@app.route('/models')
def get_models():
    try:
        response = requests.get(f"{COMFYUI_URL}/object_info/CheckpointLoaderSimple", timeout=5)
        if response.status_code == 200:
            data = response.json()
            models = data['CheckpointLoaderSimple']['input']['required']['ckpt_name'][0]
            print(f"[Info] Loaded {len(models)} models")
            return jsonify({'models': models})
    except Exception as e:
        print(f"Error loading models: {e}")
    return jsonify({'models': ['v1-5-pruned-emaonly-fp16.safetensors']})

@app.route('/loras')
def get_loras():
    try:
        response = requests.get(f"{COMFYUI_URL}/object_info/LoraLoader", timeout=5)
        if response.status_code == 200:
            data = response.json()
            loras = data['LoraLoader']['input']['required']['lora_name'][0]
            return jsonify({'loras': ['None'] + loras})
    except:
        pass
    return jsonify({'loras': ['None']})

@app.route('/upload-image', methods=['POST'])
def upload_image():
    """Handle image upload for image-to-image workflow"""
    try:
        print("[Upload] Image upload request received")
        print(f"[Upload] Request method: {request.method}")
        print(f"[Upload] Request files: {list(request.files.keys())}")
        
        if 'image' not in request.files:
            print("[Upload] No image file in request")
            return jsonify({'success': False, 'error': 'No image file provided'}), 400
        
        file = request.files['image']
        if file.filename == '':
            print("[Upload] Empty filename")
            return jsonify({'success': False, 'error': 'No file selected'}), 400
        
        if file and allowed_file(file.filename):
            # Generate unique filename
            file_extension = file.filename.rsplit('.', 1)[1].lower()
            unique_filename = f"input_{uuid.uuid4().hex}.{file_extension}"
            file_path = UPLOAD_DIR / unique_filename
            
            # Save the file
            file.save(str(file_path))
            print(f"[Upload] Image saved: {unique_filename}")
            
            return jsonify({
                'success': True,
                'filename': unique_filename,
                'message': 'Image uploaded successfully'
            })
        else:
            print(f"[Upload] Invalid file type: {file.filename}")
            return jsonify({'success': False, 'error': 'Invalid file type'}), 400
            
    except Exception as e:
        print(f"[Upload] Error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/output/<path:filename>')
def serve_image(filename):
    return send_from_directory(OUTPUT_DIR, filename)

@app.route('/queue/status')
def queue_status():
    try:
        response = requests.get(f"{COMFYUI_URL}/queue", timeout=2)
        if response.status_code == 200:
            return response.json()
    except:
        pass
    return jsonify({'queue_running': [], 'queue_pending': []})

@app.route('/prompt/status/<prompt_id>')
def prompt_status(prompt_id):
    """Check if a specific prompt has completed by checking ComfyUI history"""
    try:
        response = requests.get(f"{COMFYUI_URL}/history", timeout=2)
        if response.status_code == 200:
            history = response.json()
            if prompt_id in history:
                prompt_data = history[prompt_id]
                status = prompt_data.get('status', {})
                return jsonify({
                    'success': True,
                    'completed': status.get('completed', False),
                    'status_str': status.get('status_str', 'unknown'),
                    'outputs': prompt_data.get('outputs', {})
                })
            else:
                # Prompt not in history yet - still processing or pending
                return jsonify({
                    'success': True,
                    'completed': False,
                    'status_str': 'processing',
                    'outputs': {}
                })
    except Exception as e:
        print(f"[Prompt Status] Error checking prompt {prompt_id}: {e}")
        return jsonify({'success': False, 'error': str(e)})
    
    return jsonify({'success': False, 'error': 'Failed to check prompt status'})

@app.route('/test-route')
def test_route():
    """Simple test route to verify Flask routing is working"""
    print("[TEST] Test route called successfully")
    return jsonify({'status': 'test route working', 'timestamp': time.time()})

@app.route('/debug/routes')
def list_routes():
    """List all registered routes for debugging"""
    routes = []
    for rule in app.url_map.iter_rules():
        routes.append({
            'endpoint': rule.endpoint,
            'methods': list(rule.methods),
            'rule': str(rule)
        })
    return jsonify({'routes': routes})

# Store queue item to image mapping and image assignment tracking
queue_image_mapping = {}
assigned_images = set()  # Track which images have been assigned
baseline_image_count = 0

@app.route('/latest-image')
def get_latest_image():
    """Get the most recently generated image for a specific prompt_id"""
    try:
        import os
        import glob
        
        # Convert Path object to string for glob
        output_path = str(OUTPUT_DIR)
        prompt_id = request.args.get('prompt_id', '')
        
        print(f"[Latest Image] Checking path: {output_path}, prompt_id: {prompt_id}")
        
        if os.path.exists(output_path):
            # Get all image files
            image_patterns = ['*.png', '*.jpg', '*.jpeg']
            all_images = []
            
            for pattern in image_patterns:
                pattern_path = os.path.join(output_path, pattern)
                found_files = glob.glob(pattern_path)
                all_images.extend(found_files)
                print(f"[Latest Image] Pattern {pattern}: found {len(found_files)} files")
            
            if all_images:
                # If we have a specific prompt_id, check if we already mapped an image to it
                if prompt_id and prompt_id in queue_image_mapping:
                    mapped_filename = queue_image_mapping[prompt_id]
                    mapped_path = os.path.join(output_path, mapped_filename)
                    if os.path.exists(mapped_path):
                        print(f"[Latest Image] Using mapped image for {prompt_id}: {mapped_filename}")
                        return jsonify({
                            'success': True,
                            'filename': mapped_filename,
                            'url': f'/output/{mapped_filename}'
                        })
                
                # Sort by modification time, newest first
                all_images_sorted = sorted(all_images, key=os.path.getmtime, reverse=True)
                
                # If we have a prompt_id, find the newest unassigned recent image
                if prompt_id:
                    import time
                    
                    for image_path in all_images_sorted:
                        filename = os.path.basename(image_path)
                        
                        # Check if this image was created recently (within last 60 seconds)
                        image_age = time.time() - os.path.getmtime(image_path)
                        is_recent = image_age < 60  # Increased to 60 seconds for better detection
                        
                        # Only assign if it's recent and hasn't been assigned yet
                        if is_recent and filename not in assigned_images:
                            queue_image_mapping[prompt_id] = filename
                            assigned_images.add(filename)
                            print(f"[Latest Image] Mapped NEW unassigned image {filename} to prompt_id {prompt_id} (age: {image_age:.1f}s)")
                            
                            # Upload to R2 if enabled
                            r2_url = None
                            if R2_ENABLED:
                                try:
                                    user_id = request.args.get('user_id', 'anonymous')
                                    metadata = {
                                        'prompt_id': prompt_id,
                                        'generated_at': str(time.time())
                                    }
                                    r2_result = upload_image_to_r2(image_path, user_id=user_id, metadata=metadata)
                                    if r2_result['success']:
                                        r2_url = r2_result['url']
                                        print(f"[Latest Image] Uploaded to R2: {r2_url}")
                                    else:
                                        print(f"[Latest Image] R2 upload failed: {r2_result.get('error')}")
                                except Exception as e:
                                    print(f"[Latest Image] R2 upload exception: {e}")
                            
                            return jsonify({
                                'success': True,
                                'filename': filename,
                                'url': f'/output/{filename}',
                                'r2_url': r2_url  # Include R2 URL if available
                            })
                        elif filename in assigned_images:
                            print(f"[Latest Image] Image {filename} already assigned to another prompt_id")
                        elif not is_recent:
                            print(f"[Latest Image] Image {filename} is too old ({image_age:.1f}s)")
                    
                    print(f"[Latest Image] No recent unassigned images found for {prompt_id}")
                    return jsonify({'success': False, 'error': 'No recent unassigned images found'})
                else:
                    # No prompt_id, just return latest
                    latest_image = all_images_sorted[0]
                    filename = os.path.basename(latest_image)
                    print(f"[Latest Image] Found (no prompt_id): {filename}")
                    return jsonify({
                        'success': True,
                        'filename': filename,
                        'url': f'/output/{filename}'
                    })
        
        print(f"[Latest Image] No images found in {output_path}")
        return jsonify({'success': False, 'error': 'No images found'})
        
    except Exception as e:
        print(f"[Latest Image] Error: {e}")
        return jsonify({'success': False, 'error': str(e)})

@app.route('/queue', methods=['POST'])
def add_to_queue():
    print("=== QUEUE FUNCTION CALLED ===")
    try:
        data = request.json
        print(f"\n[Queue DEBUG] Raw request data: {data}")
        print(f"[Queue DEBUG] Request type: {type(data)}")
        print(f"[Queue DEBUG] Request keys: {list(data.keys()) if isinstance(data, dict) else 'Not a dict'}")
        
        # Validate required fields
        if not data.get('prompt'):
            print("[ERROR] Missing prompt")
            return jsonify({'success': False, 'error': 'Prompt is required'}), 400
            
        # Use default model if none provided
        model_name = data.get('model')
        if not model_name:
            print("[WARNING] No model provided, using default")
            model_name = 'v1-5-pruned-emaonly-fp16.safetensors'  # Default model
        
        print(f"[Queue] Using model: {model_name}")

        # Normalize sampling parameters
        sampler_name, scheduler_name = normalize_sampling_params(
            data.get('sampler'),
            data.get('scheduler')
        )

        try:
            seed_value = int(data.get('seed')) if data.get('seed') not in (None, "") else -1
        except (TypeError, ValueError):
            seed_value = -1

        if seed_value < 0:
            seed_value = random.randint(0, 2**31 - 1)

        try:
            steps_value = int(data.get('steps', 25))
        except (TypeError, ValueError):
            steps_value = 25

        try:
            cfg_value = float(data.get('cfg_scale', 7.0))
        except (TypeError, ValueError):
            cfg_value = 7.0
        
        print(f"[Queue] sampler={sampler_name} scheduler={scheduler_name} seed={seed_value} steps={steps_value} cfg={cfg_value}")

        # Handle LoRAs
        loras = data.get('loras', [])
        print(f"[Queue] LoRAs requested: {loras}")

        # Check if this is an img2img workflow
        workflow_type = data.get('workflow_type', 'text2img')
        input_image = data.get('input_image')
        denoise_strength = data.get('denoise_strength', 0.75)
        
        print(f"[Queue] Workflow type: {workflow_type}")
        if workflow_type == 'img2img':
            print(f"[Queue] Image-to-Image workflow - input: {input_image}, denoise: {denoise_strength}")

        # Build base ComfyUI workflow
        if workflow_type == 'img2img' and input_image:
            # Image-to-image workflow
            workflow = {
                "3": {
                    "class_type": "KSampler",
                    "inputs": {
                        "seed": seed_value,
                        "steps": steps_value,
                        "cfg": cfg_value,
                        "sampler_name": sampler_name,
                        "scheduler": scheduler_name,
                        "denoise": float(denoise_strength),  # Use denoise strength from frontend
                        "model": ["4", 0],
                        "positive": ["6", 0],
                        "negative": ["7", 0],
                        "latent_image": ["11", 0]  # From VAEEncode node
                    }
                },
                "4": {
                    "class_type": "CheckpointLoaderSimple",
                    "inputs": {"ckpt_name": model_name}
                },
                "6": {
                    "class_type": "CLIPTextEncode",
                    "inputs": {
                        "text": data.get('prompt', 'beautiful scene'),
                        "clip": ["4", 1]
                    }
                },
                "7": {
                    "class_type": "CLIPTextEncode",
                    "inputs": {
                        "text": data.get('negative_prompt', 'low quality'),
                        "clip": ["4", 1]
                    }
                },
                "8": {
                    "class_type": "VAEDecode",
                    "inputs": {
                        "samples": ["3", 0],
                        "vae": ["4", 2]
                    }
                },
                "9": {
                    "class_type": "SaveImage",
                    "inputs": {
                        "filename_prefix": "ComfyUI",
                        "images": ["8", 0]
                    }
                },
                "10": {
                    "class_type": "LoadImage",
                    "inputs": {
                        "image": input_image
                    }
                },
                "11": {
                    "class_type": "VAEEncode",
                    "inputs": {
                        "pixels": ["10", 0],
                        "vae": ["4", 2]
                    }
                }
            }
        else:
            # Text-to-image workflow
            workflow = {
                "3": {
                    "class_type": "KSampler",
                    "inputs": {
                        "seed": seed_value,
                        "steps": steps_value,
                        "cfg": cfg_value,
                        "sampler_name": sampler_name,
                        "scheduler": scheduler_name,
                        "denoise": 1,
                        "model": ["4", 0],  # Will be updated if LoRAs are used
                        "positive": ["6", 0],  # Will be updated if LoRAs are used
                        "negative": ["7", 0],  # Will be updated if LoRAs are used
                        "latent_image": ["5", 0]
                    }
                },
                "4": {
                    "class_type": "CheckpointLoaderSimple",
                    "inputs": {"ckpt_name": model_name}
                },
                "5": {
                    "class_type": "EmptyLatentImage",
                    "inputs": {
                        "width": int(data.get('width', 768)),
                        "height": int(data.get('height', 768)),
                        "batch_size": 1
                    }
                },
                "6": {
                    "class_type": "CLIPTextEncode",
                    "inputs": {
                        "text": data.get('prompt', 'beautiful scene'),
                        "clip": ["4", 1]  # Will be updated if LoRAs are used
                    }
                },
                "7": {
                    "class_type": "CLIPTextEncode",
                    "inputs": {
                        "text": data.get('negative_prompt', 'low quality'),
                        "clip": ["4", 1]  # Will be updated if LoRAs are used
                    }
                },
                "8": {
                    "class_type": "VAEDecode",
                    "inputs": {
                        "samples": ["3", 0],
                        "vae": ["4", 2]
                    }
                },
                "9": {
                    "class_type": "SaveImage",
                    "inputs": {
                        "filename_prefix": "ComfyUI",
                        "images": ["8", 0]
                    }
                }
            }

        # Add LoRA nodes if LoRAs are specified
        if loras and len(loras) > 0:
            # For img2img workflows, nodes 10 and 11 are already used for LoadImage and VAEEncode
            # So start LoRA nodes from 12
            node_id = 12 if workflow_type == 'img2img' else 10
            last_model_output = ["4", 0]  # Start with base model
            last_clip_output = ["4", 1]   # Start with base CLIP

            for i, lora in enumerate(loras):
                if lora.get('model') and lora.get('model') != 'None':
                    # Add LoRA loader node
                    workflow[str(node_id)] = {
                        "class_type": "LoraLoader",
                        "inputs": {
                            "model": last_model_output,
                            "clip": last_clip_output,
                            "lora_name": lora['model'],
                            "strength_model": float(lora.get('strength', 0.8)),
                            "strength_clip": float(lora.get('strength', 0.8))
                        }
                    }
                    
                    # Update references for the next LoRA or final connections
                    last_model_output = [str(node_id), 0]
                    last_clip_output = [str(node_id), 1]
                    
                    print(f"[Queue] Added LoRA {i+1}: {lora['model']} (strength: {lora['strength']})")
                    node_id += 1

            # Update the KSampler and text encoders to use the final LoRA outputs
            workflow["3"]["inputs"]["model"] = last_model_output
            workflow["6"]["inputs"]["clip"] = last_clip_output
            workflow["7"]["inputs"]["clip"] = last_clip_output
        
        print(f"[Queue DEBUG] Sending workflow to ComfyUI with {len(workflow)} nodes")
        
        # Send to ComfyUI
        response = requests.post(f"{COMFYUI_URL}/prompt", json={"prompt": workflow}, timeout=10)
        
        print(f"[Queue DEBUG] ComfyUI response status: {response.status_code}")
        print(f"[Queue DEBUG] ComfyUI response text: {response.text}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"[Queue DEBUG] ComfyUI response JSON: {result}")
            print(f"[Queue DEBUG] Response type: {type(result)}")
            print(f"[Queue DEBUG] Response keys: {list(result.keys()) if isinstance(result, dict) else 'Not a dict'}")
            
            prompt_id = result.get('prompt_id')
            print(f"[Queue] Successfully added to queue with prompt_id: {prompt_id}")
            
            # Return a properly structured response for the frontend
            return jsonify({
                'success': True,
                'prompt_id': prompt_id,
                'queue_number': result.get('number', 0),
                'raw_response': result
            })
        else:
            print(f"[Queue] Error {response.status_code}: {response.text}")
            return jsonify({'success': False, 'error': f'ComfyUI error: {response.status_code}'}), response.status_code
            
    except requests.RequestException as e:
        print(f"[Queue] Request exception: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Cannot connect to ComfyUI: {e}'}), 503
    except Exception as e:
        print(f"[Queue] Unexpected exception: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Server error: {e}'}), 500

@app.route('/generate', methods=['POST'])
def generate():
    try:
        data = request.json
        print(f"\n[DEBUG] Raw request data: {data}")
        print(f"[Generate] Model={data.get('model', 'NONE')}")
        
        # Validate required fields
        if not data.get('prompt'):
            print("[ERROR] Missing prompt")
            return jsonify({'success': False, 'error': 'Prompt is required'}), 400
            
        if not data.get('model'):
            print("[ERROR] Missing model")
            return jsonify({'success': False, 'error': 'Model is required'}), 400

        sampler_name, scheduler_name = normalize_sampling_params(
            data.get('sampler'),
            data.get('scheduler')
        )

        try:
            seed_value = int(data.get('seed')) if data.get('seed') not in (None, "") else -1
        except (TypeError, ValueError):
            seed_value = -1

        if seed_value < 0:
            seed_value = random.randint(0, 2**31 - 1)

        try:
            steps_value = int(data.get('steps', 25))
        except (TypeError, ValueError):
            steps_value = 25

        try:
            cfg_value = float(data.get('cfg_scale', 7.0))
        except (TypeError, ValueError):
            cfg_value = 7.0
        
        print(f"[Generate] sampler={sampler_name} scheduler={scheduler_name} seed={seed_value} steps={steps_value} cfg={cfg_value}")

        workflow = {
            "3": {
                "class_type": "KSampler",
                "inputs": {
                    "seed": seed_value,
                    "steps": steps_value,
                    "cfg": cfg_value,
                    "sampler_name": sampler_name,
                    "scheduler": scheduler_name,
                    "denoise": 1,
                    "model": ["4", 0],
                    "positive": ["6", 0],
                    "negative": ["7", 0],
                    "latent_image": ["5", 0]
                }
            },
            "4": {
                "class_type": "CheckpointLoaderSimple",
                "inputs": {"ckpt_name": data.get('model', 'v1-5-pruned-emaonly-fp16.safetensors')}
            },
            "5": {
                "class_type": "EmptyLatentImage",
                "inputs": {
                    "width": int(data.get('width', 768)),
                    "height": int(data.get('height', 768)),
                    "batch_size": 1
                }
            },
            "6": {
                "class_type": "CLIPTextEncode",
                "inputs": {
                    "text": data.get('prompt', 'beautiful scene'),
                    "clip": ["4", 1]
                }
            },
            "7": {
                "class_type": "CLIPTextEncode",
                "inputs": {
                    "text": data.get('negative_prompt', 'low quality'),
                    "clip": ["4", 1]
                }
            },
            "8": {
                "class_type": "VAEDecode",
                "inputs": {
                    "samples": ["3", 0],
                    "vae": ["4", 2]
                }
            },
            "9": {
                "class_type": "SaveImage",
                "inputs": {
                    "filename_prefix": "ComfyUI",
                    "images": ["8", 0]
                }
            }
        }
        
        # First check if ComfyUI is available
        print(f"[DEBUG] Checking ComfyUI health at {COMFYUI_URL}")
        try:
            health_check = requests.get(f"{COMFYUI_URL}/queue", timeout=5)
            print(f"[DEBUG] Health check status: {health_check.status_code}")
            if health_check.status_code != 200:
                print(f"[ERROR] ComfyUI server not responding: {health_check.status_code}")
                return jsonify({'success': False, 'error': f'ComfyUI server not available (HTTP {health_check.status_code})'}), 503
        except Exception as health_error:
            print(f"[ERROR] ComfyUI health check failed: {health_error}")
            return jsonify({'success': False, 'error': f'Cannot connect to ComfyUI: {health_error}'}), 503
        
        print(f"[DEBUG] Sending workflow to ComfyUI with {len(workflow)} nodes")
        comfyui_response = requests.post(f"{COMFYUI_URL}/prompt", json={"prompt": workflow}, timeout=15)
        
        print(f"[DEBUG] ComfyUI response status: {comfyui_response.status_code}")
        print(f"[DEBUG] ComfyUI response headers: {dict(comfyui_response.headers)}")
        
        if comfyui_response.status_code == 200:
            result = comfyui_response.json()
            print(f"[DEBUG] ComfyUI response body: {result}")
            
            if 'prompt_id' not in result:
                print(f"[ERROR] Missing prompt_id in ComfyUI response: {result}")
                return jsonify({'success': False, 'error': 'ComfyUI did not return prompt_id'}), 500
                
            prompt_id = result['prompt_id']
            print(f"[SUCCESS] Submitted prompt: {prompt_id}")
            
            # Wait for image with shorter timeout
            for i in range(30):
                try:
                    hist_response = requests.get(f"{COMFYUI_URL}/history/{prompt_id}", timeout=2)
                    if hist_response.status_code == 200:
                        history = hist_response.json()
                        if prompt_id in history:
                            outputs = history[prompt_id].get('outputs', {})
                            for node_output in outputs.values():
                                if 'images' in node_output:
                                    filename = node_output['images'][0]['filename']
                                    print(f"[SUCCESS] Generated image: {filename}")
                                    return jsonify({'success': True, 'image_url': f'/output/{filename}'})
                    time.sleep(1)
                except requests.RequestException:
                    time.sleep(1)
            
            return jsonify({'success': False, 'error': 'Generation timeout'})
        else:
            print(f"[ERROR] ComfyUI error {comfyui_response.status_code}: {comfyui_response.text}")
            return jsonify({'success': False, 'error': f'ComfyUI error: {comfyui_response.status_code}'})
            
    except requests.RequestException as e:
        print(f"[ERROR] Request exception: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': f'Cannot connect to ComfyUI server: {e}'}), 503
    except Exception as e:
        print(f"[ERROR] Unexpected exception: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': f'Server error: {e}'}), 500

@app.route('/models/lora')
def get_lora_models():
    """Get available LoRA models from ComfyUI"""
    try:
        # Try to get LoRA models from ComfyUI object_info endpoint
        response = requests.get(f"{COMFYUI_URL}/object_info", timeout=5)
        if response.status_code == 200:
            object_info = response.json()
            
            # Extract LoRA models from LoraLoader node info
            lora_loader_info = object_info.get('LoraLoader', {})
            
            if lora_loader_info:
                input_info = lora_loader_info.get('input', {})
                
                # Get the required section which contains lora_name
                required_info = input_info.get('required', {})
                lora_name_info = required_info.get('lora_name', [])
                
                # LoRA models are in the first element of the lora_name array
                if lora_name_info and isinstance(lora_name_info, list) and len(lora_name_info) > 0:
                    lora_models = lora_name_info[0]  # First element contains the list of models
                    print(f"[LoRA Models] Successfully loaded {len(lora_models)} LoRA models from ComfyUI")
                else:
                    lora_models = []
                    print(f"[LoRA Models] No LoRA models found in ComfyUI object_info")
            else:
                print("[DEBUG] LoraLoader not found in object_info")
                lora_models = []
            
            if lora_models:
                return jsonify({'success': True, 'models': ['None'] + lora_models})
            else:
                print("[LoRA Models] No LoRA models found in object_info")
        else:
            print(f"[LoRA Models] Failed to get object_info: {response.status_code}")
            
    except Exception as e:
        print(f"[LoRA Models] Error getting LoRA models: {e}")
        import traceback
        traceback.print_exc()
    
    # Fallback to default list
    print("[LoRA Models] Using fallback LoRA list - ComfyUI may not be available")
    default_loras = [
        'None',
        'add_detail.safetensors',
        'realistic_vision.safetensors', 
        'anime_style.safetensors',
        'portrait_enhance.safetensors'
    ]
    return jsonify({'success': True, 'models': default_loras})

# Debug endpoint to test Flask routing
@app.route('/test-debug', methods=['GET', 'POST'])
def test_debug():
    print("=== TEST DEBUG ENDPOINT CALLED ===")
    print(f"Method: {request.method}")
    print(f"Headers: {dict(request.headers)}")
    if request.method == 'POST':
        print(f"JSON data: {request.json}")
    return jsonify({'status': 'debug endpoint working', 'method': request.method})

# Catch-all route for static files (must be last!)
@app.route('/<path:filename>')
def serve_static(filename):
    try:
        return send_from_directory(FRONTEND_DIR, filename)
    except:
        return "File not found", 404

if __name__ == '__main__':
    print("\nFlask API Bridge Starting...")
    print("Server: http://localhost:8890")
    print("Ready!\n")
    app.run(host='127.0.0.1', port=8890, debug=False, use_reloader=False)