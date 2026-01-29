"""
Cache Manager Module
Handles caching of scraped documentation to minimize network requests
"""

import json
import hashlib
from pathlib import Path
from datetime import datetime, timedelta
from typing import Optional, Dict, Any


class CacheManager:
    """Manages caching of scraped content"""
    
    def __init__(self, cache_dir: str = "data/cache", ttl_hours: int = 24):
        """
        Initialize the cache manager
        
        Args:
            cache_dir: Directory to store cached files
            ttl_hours: Time to live for cached items in hours
        """
        self.cache_dir = Path(cache_dir)
        self.ttl = timedelta(hours=ttl_hours)
        self._ensure_cache_dir()
    
    def _ensure_cache_dir(self) -> None:
        """Create cache directory if it doesn't exist"""
        self.cache_dir.mkdir(parents=True, exist_ok=True)
    
    def _get_cache_key(self, url: str) -> str:
        """
        Generate a cache key from URL
        
        Args:
            url: The URL to generate key for
            
        Returns:
            Hash-based cache key
        """
        return hashlib.md5(url.encode()).hexdigest()
    
    def _get_cache_path(self, cache_key: str) -> Path:
        """
        Get the file path for a cache key
        
        Args:
            cache_key: The cache key
            
        Returns:
            Path to cache file
        """
        return self.cache_dir / f"{cache_key}.json"
    
    def get(self, url: str) -> Optional[str]:
        """
        Retrieve cached content for a URL
        
        Args:
            url: The URL to retrieve cached content for
            
        Returns:
            Cached content if valid and not expired, None otherwise
        """
        cache_key = self._get_cache_key(url)
        cache_path = self._get_cache_path(cache_key)
        
        if not cache_path.exists():
            return None
        
        try:
            with open(cache_path, 'r', encoding='utf-8') as f:
                cache_data = json.load(f)
            
            # Check if cache has expired
            cached_time = datetime.fromisoformat(cache_data['timestamp'])
            if datetime.now() - cached_time > self.ttl:
                # Cache expired, remove it
                cache_path.unlink()
                return None
            
            return cache_data['content']
        
        except Exception as e:
            print(f"Error reading cache for {url}: {e}")
            return None
    
    def set(self, url: str, content: str) -> bool:
        """
        Store content in cache
        
        Args:
            url: The URL being cached
            content: The content to cache
            
        Returns:
            True if successful, False otherwise
        """
        cache_key = self._get_cache_key(url)
        cache_path = self._get_cache_path(cache_key)
        
        try:
            cache_data = {
                'url': url,
                'content': content,
                'timestamp': datetime.now().isoformat()
            }
            
            with open(cache_path, 'w', encoding='utf-8') as f:
                json.dump(cache_data, f, ensure_ascii=False, indent=2)
            
            return True
        
        except Exception as e:
            print(f"Error writing cache for {url}: {e}")
            return False
    
    def invalidate(self, url: str) -> bool:
        """
        Invalidate (delete) cached content for a URL
        
        Args:
            url: The URL to invalidate cache for
            
        Returns:
            True if successful, False otherwise
        """
        cache_key = self._get_cache_key(url)
        cache_path = self._get_cache_path(cache_key)
        
        try:
            if cache_path.exists():
                cache_path.unlink()
            return True
        except Exception as e:
            print(f"Error invalidating cache for {url}: {e}")
            return False
    
    def clear_all(self) -> bool:
        """
        Clear all cached items
        
        Returns:
            True if successful, False otherwise
        """
        try:
            for cache_file in self.cache_dir.glob("*.json"):
                cache_file.unlink()
            return True
        except Exception as e:
            print(f"Error clearing cache: {e}")
            return False
    
    def get_cache_stats(self) -> Dict[str, Any]:
        """
        Get cache statistics
        
        Returns:
            Dictionary with cache statistics
        """
        cache_files = list(self.cache_dir.glob("*.json"))
        total_size = sum(f.stat().st_size for f in cache_files)
        
        return {
            'total_items': len(cache_files),
            'total_size_bytes': total_size,
            'total_size_mb': round(total_size / (1024 * 1024), 2)
        }
