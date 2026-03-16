from motor.motor_asyncio import AsyncIOMotorClient
from config import app_config

# Uses config file first, falls back to default if config key is missing
MONGO_URI = app_config.get("mongodb_uri_local", "mongodb://localhost:27017")
client = AsyncIOMotorClient(MONGO_URI)
db = client["chatdox_db"]
conversations_col = db["conversations"]