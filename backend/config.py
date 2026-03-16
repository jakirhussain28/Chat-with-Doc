import os
import json

CONFIG_PATH = os.path.join(os.path.dirname(__file__), "profile_config.json")

def load_profile_config():
    """Loads the LLM configuration from the JSON file."""
    try:
        with open(CONFIG_PATH, "r") as f:
            return json.load(f)
    except FileNotFoundError:
        print("Warning: profile_config.json not found. Using defaults.")
        return {
            "mongodb_uri_local": "mongodb://localhost:27017",
            "ollama_url_local": "http://localhost:11434",
            "generation_llms": [],
            "embedding_llms": []
        }

def save_profile_config(new_config: dict):
    """Saves the configuration back to the JSON file."""
    with open(CONFIG_PATH, "w") as f:
        json.dump(new_config, f, indent=2)

# Global configuration state
app_config = load_profile_config()