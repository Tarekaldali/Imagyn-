#!/usr/bin/env python3
"""
Startup script for ComfyUI with Python 3.13 compatibility workarounds
"""

# Set environment variable to disable torchvision video features
import os
os.environ['TORCHVISION_DISABLE_VIDEO_BACKEND'] = '1'

# Import the mock av module before torchvision loads
import av

# Now run the main ComfyUI
if __name__ == "__main__":
    import sys
    import os
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    import main