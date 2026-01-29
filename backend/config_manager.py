"""
Configuration Manager Module
Handles saving and loading of API keys and application settings
"""

import json
import os
from pathlib import Path
from typing import Optional, Dict, Any


class ConfigManager:
    """Manages application configuration including API keys"""
    
    def __init__(self, config_dir: str = "data"):
        """
        Initialize the configuration manager
        
        Args:
            config_dir: Directory to store configuration files
        """
        self.config_dir = Path(config_dir)
        self.config_file = self.config_dir / "config.json"
        self._ensure_config_dir()
    
    def _ensure_config_dir(self) -> None:
        """Create configuration directory if it doesn't exist"""
        self.config_dir.mkdir(parents=True, exist_ok=True)
    
    def save_api_key(self, api_key: str) -> bool:
        """
        Save the OpenAI API key to configuration
        
        Args:
            api_key: The OpenAI API key to save
            
        Returns:
            True if successful, False otherwise
        """
        try:
            config = self.load_config()
            config['openai_api_key'] = api_key
            
            with open(self.config_file, 'w', encoding='utf-8') as f:
                json.dump(config, f, indent=2, ensure_ascii=False)
            
            return True
        except Exception as e:
            print(f"Error saving API key: {e}")
            return False
    
    def get_api_key(self) -> Optional[str]:
        """
        Retrieve the stored OpenAI API key
        
        Returns:
            The API key if found, None otherwise
        """
        config = self.load_config()
        return config.get('openai_api_key')
    
    def load_config(self) -> Dict[str, Any]:
        """
        Load the complete configuration
        
        Returns:
            Dictionary containing configuration
        """
        if not self.config_file.exists():
            return {}
        
        try:
            with open(self.config_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading config: {e}")
            return {}
    
    def update_setting(self, key: str, value: Any) -> bool:
        """
        Update a specific configuration setting
        
        Args:
            key: Setting key
            value: Setting value
            
        Returns:
            True if successful, False otherwise
        """
        try:
            config = self.load_config()
            config[key] = value
            
            with open(self.config_file, 'w', encoding='utf-8') as f:
                json.dump(config, f, indent=2, ensure_ascii=False)
            
            return True
        except Exception as e:
            print(f"Error updating setting: {e}")
            return False
    
    def is_configured(self) -> bool:
        """
        Check if API key is configured
        
        Returns:
            True if API key exists, False otherwise
        """
        return self.get_api_key() is not None
    
    def validate_api_key(self, api_key: str) -> bool:
        """
        Validate API key format
        
        Args:
            api_key: The API key to validate
            
        Returns:
            True if format is valid, False otherwise
        """
        # Basic validation: Google API keys typically start with 'AIza'
        return api_key and api_key.startswith('AIza') and len(api_key) > 30
