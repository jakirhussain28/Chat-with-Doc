from fastapi import APIRouter, HTTPException
from config import load_profile_config, save_profile_config
import config

router = APIRouter(prefix="/api/config", tags=["Configuration"])

@router.get("")
async def get_config():
    """Serves the LLM configuration to the frontend dynamically."""
    return load_profile_config()

@router.put("")
async def update_config(new_config: dict):
    """Updates the LLM configuration in profile_config.json."""
    try:
        save_profile_config(new_config)
        
        # Update in-memory configuration 
        config.app_config = load_profile_config()
        
        return {"success": True, "message": "Configuration updated"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))