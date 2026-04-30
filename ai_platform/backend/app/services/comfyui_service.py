"""
ComfyUI Service - Handles image generation via ComfyUI backend
"""

import requests
import time
import uuid
import random
import os
from typing import Dict, Any, Optional, List
from app.config import settings
import logging
import asyncio
import aiohttp

logger = logging.getLogger(__name__)


class ComfyUIService:
    """Service for interacting with ComfyUI backend"""
    
    def __init__(self):
        self.base_url = settings.COMFYUI_URL.rstrip('/')
        self.timeout = settings.COMFYUI_TIMEOUT
        logger.info(f"ComfyUI Service initialized with base URL: {self.base_url}")
    
    async def generate_image(
        self,
        prompt: str,
        negative_prompt: str = "",
        model_name: str = None,
        width: int = 768,
        height: int = 768,
        steps: int = 25,
        cfg_scale: float = 7.0,
        sampler: str = "dpmpp_2m",
        scheduler: str = "karras",
        seed: int = -1
    ) -> Dict[str, Any]:
        """
        Generate image using ComfyUI
        
        Args:
            prompt: Positive prompt for image generation
            negative_prompt: Negative prompt (what to avoid)
            model_name: Checkpoint model to use
            width: Image width
            height: Image height
            steps: Number of sampling steps
            cfg_scale: Classifier-free guidance scale
            sampler: Sampler name (dpmpp_2m, euler, etc.)
            scheduler: Scheduler name (karras, normal, etc.)
            seed: Random seed (-1 for random)
        
        Returns:
            dict: {
                'success': bool,
                'image_path': str,  # Local path to downloaded image
                'prompt_id': str,
                'generation_time': float,
                'error': str (if failed)
            }
        """
        start_time = time.time()
        
        try:
            # Use default model if not specified
            model_name = model_name or settings.DEFAULT_MODEL
            
            # Generate random seed if needed
            if seed == -1:
                seed = random.randint(1, 2**31 - 1)
            
            logger.info(f"Starting image generation - Model: {model_name}, Size: {width}x{height}, Steps: {steps}")
            
            # 1. Build workflow
            workflow = self._build_workflow(
                prompt=prompt,
                negative_prompt=negative_prompt,
                model_name=model_name,
                width=width,
                height=height,
                steps=steps,
                cfg_scale=cfg_scale,
                sampler=sampler,
                scheduler=scheduler,
                seed=seed
            )
            
            # 2. Queue prompt
            logger.info(f"Queuing prompt to ComfyUI: {self.base_url}/prompt")
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{self.base_url}/prompt",
                    json={"prompt": workflow},
                    timeout=aiohttp.ClientTimeout(total=30)
                ) as response:
                    if response.status != 200:
                        error_text = await response.text()
                        raise Exception(f"ComfyUI returned status {response.status}: {error_text}")
                    
                    result = await response.json()
                    prompt_id = result.get("prompt_id")
                    
                    if not prompt_id:
                        raise Exception(f"No prompt_id in response: {result}")
                    
                    logger.info(f"Prompt queued successfully. Prompt ID: {prompt_id}")
            
            # 3. Poll for completion
            image_path = await self._poll_for_completion(prompt_id)
            
            if not image_path:
                raise Exception("Image generation failed or timed out")
            
            generation_time = time.time() - start_time
            logger.info(f"Image generation completed in {generation_time:.2f}s")
            
            return {
                'success': True,
                'image_path': image_path,
                'prompt_id': prompt_id,
                'generation_time': generation_time
            }
            
        except Exception as e:
            generation_time = time.time() - start_time
            logger.error(f"ComfyUI generation failed after {generation_time:.2f}s: {str(e)}", exc_info=True)
            return {
                'success': False,
                'error': str(e),
                'generation_time': generation_time
            }
    
    def _build_workflow(
        self,
        prompt: str,
        negative_prompt: str,
        model_name: str,
        width: int,
        height: int,
        steps: int,
        cfg_scale: float,
        sampler: str,
        scheduler: str,
        seed: int
    ) -> Dict[str, Any]:
        """
        Build ComfyUI workflow JSON for text-to-image generation
        
        This workflow structure matches the working flask_server.py implementation
        """
        workflow = {
            "3": {  # KSampler node
                "class_type": "KSampler",
                "inputs": {
                    "seed": seed,
                    "steps": steps,
                    "cfg": cfg_scale,
                    "sampler_name": sampler,
                    "scheduler": scheduler,
                    "denoise": 1.0,
                    "model": ["4", 0],  # From CheckpointLoaderSimple
                    "positive": ["6", 0],  # From CLIPTextEncode (positive)
                    "negative": ["7", 0],  # From CLIPTextEncode (negative)
                    "latent_image": ["5", 0]  # From EmptyLatentImage
                }
            },
            "4": {  # CheckpointLoaderSimple
                "class_type": "CheckpointLoaderSimple",
                "inputs": {
                    "ckpt_name": model_name
                }
            },
            "5": {  # EmptyLatentImage
                "class_type": "EmptyLatentImage",
                "inputs": {
                    "width": width,
                    "height": height,
                    "batch_size": 1
                }
            },
            "6": {  # CLIPTextEncode (positive prompt)
                "class_type": "CLIPTextEncode",
                "inputs": {
                    "text": prompt,
                    "clip": ["4", 1]  # CLIP from CheckpointLoaderSimple
                }
            },
            "7": {  # CLIPTextEncode (negative prompt)
                "class_type": "CLIPTextEncode",
                "inputs": {
                    "text": negative_prompt,
                    "clip": ["4", 1]  # CLIP from CheckpointLoaderSimple
                }
            },
            "8": {  # VAEDecode
                "class_type": "VAEDecode",
                "inputs": {
                    "samples": ["3", 0],  # Latent from KSampler
                    "vae": ["4", 2]  # VAE from CheckpointLoaderSimple
                }
            },
            "9": {  # SaveImage
                "class_type": "SaveImage",
                "inputs": {
                    "filename_prefix": "ComfyUI",
                    "images": ["8", 0]  # Decoded image from VAEDecode
                }
            }
        }
        
        logger.debug(f"Built workflow with {len(workflow)} nodes")
        return workflow
    
    async def _poll_for_completion(self, prompt_id: str, timeout: int = None) -> Optional[str]:
        """
        Poll ComfyUI until generation is complete
        
        Args:
            prompt_id: The prompt ID to check
            timeout: Maximum time to wait in seconds
        
        Returns:
            str: Path to downloaded image file, or None if failed
        """
        timeout = timeout or self.timeout
        start_time = time.time()
        poll_interval = 1.0  # Poll every second
        
        logger.info(f"Polling for completion of prompt {prompt_id} (timeout: {timeout}s)")
        
        while time.time() - start_time < timeout:
            try:
                # Check history
                async with aiohttp.ClientSession() as session:
                    async with session.get(
                        f"{self.base_url}/history/{prompt_id}",
                        timeout=aiohttp.ClientTimeout(total=10)
                    ) as response:
                        if response.status != 200:
                            logger.warning(f"History check returned status {response.status}")
                            await asyncio.sleep(poll_interval)
                            continue
                        
                        history = await response.json()
                
                if prompt_id in history:
                    logger.info(f"Generation completed for prompt {prompt_id}")
                    
                    # Generation complete, get image
                    outputs = history[prompt_id].get("outputs", {})
                    
                    for node_id, node_output in outputs.items():
                        if "images" in node_output and len(node_output["images"]) > 0:
                            image_info = node_output["images"][0]
                            
                            logger.info(f"Found image: {image_info}")
                            
                            # Download image
                            image_url = f"{self.base_url}/view"
                            params = {
                                "filename": image_info["filename"],
                                "subfolder": image_info.get("subfolder", ""),
                                "type": image_info.get("type", "output")
                            }
                            
                            async with aiohttp.ClientSession() as session:
                                async with session.get(
                                    image_url,
                                    params=params,
                                    timeout=aiohttp.ClientTimeout(total=30)
                                ) as img_response:
                                    if img_response.status != 200:
                                        raise Exception(f"Failed to download image: {img_response.status}")
                                    
                                    image_data = await img_response.read()
                            
                            # Save to temp file
                            temp_filename = f"temp_{uuid.uuid4()}.png"
                            temp_dir = os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "temp")
                            os.makedirs(temp_dir, exist_ok=True)
                            temp_path = os.path.join(temp_dir, temp_filename)
                            
                            with open(temp_path, 'wb') as f:
                                f.write(image_data)
                            
                            logger.info(f"Image saved to: {temp_path}")
                            return temp_path
                    
                    # If we get here, no image was found in outputs
                    logger.error(f"No image found in outputs for prompt {prompt_id}")
                    return None
                
                # Not ready yet, wait and try again
                elapsed = time.time() - start_time
                logger.debug(f"Generation not ready yet ({elapsed:.1f}s elapsed)")
                await asyncio.sleep(poll_interval)
                
            except Exception as e:
                logger.error(f"Error polling ComfyUI: {str(e)}")
                await asyncio.sleep(poll_interval)
        
        logger.error(f"Timeout waiting for generation {prompt_id} after {timeout}s")
        return None
    
    async def get_available_models(self) -> List[str]:
        """
        Get list of available checkpoint models from ComfyUI
        
        Returns:
            List of model filenames
        """
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    f"{self.base_url}/object_info",
                    timeout=aiohttp.ClientTimeout(total=10)
                ) as response:
                    if response.status != 200:
                        logger.error(f"Failed to get models: {response.status}")
                        return []
                    
                    object_info = await response.json()
                    
                    # Extract checkpoint models
                    checkpoint_info = object_info.get("CheckpointLoaderSimple", {})
                    models = checkpoint_info.get("input", {}).get("required", {}).get("ckpt_name", [[]])[0]
                    
                    logger.info(f"Found {len(models)} available models")
                    return models
                    
        except Exception as e:
            logger.error(f"Error getting available models: {str(e)}")
            return []
    
    async def health_check(self) -> bool:
        """
        Check if ComfyUI backend is available
        
        Returns:
            bool: True if ComfyUI is responding
        """
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    f"{self.base_url}/system_stats",
                    timeout=aiohttp.ClientTimeout(total=5)
                ) as response:
                    return response.status == 200
        except Exception as e:
            logger.error(f"ComfyUI health check failed: {str(e)}")
            return False


# Global instance
_comfyui_service = None


def get_comfyui_service() -> ComfyUIService:
    """Get or create global ComfyUI service instance"""
    global _comfyui_service
    if _comfyui_service is None:
        _comfyui_service = ComfyUIService()
    return _comfyui_service
