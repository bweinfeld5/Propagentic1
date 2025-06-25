#!/usr/bin/env python3
"""
Simplified Claude API integration for customer service requests.
Combines customer information with YAML prompts and gets Claude responses.
"""

import os
import requests
import logging
import yaml
import json
from pathlib import Path
from typing import Optional, Dict
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables from .env file in the same directory as this script
script_dir = Path(__file__).parent
env_file = script_dir / ".env"
load_dotenv(env_file)

logger = logging.getLogger(__name__)

# Claude API configuration
CLAUDE_API_URL = "https://api.anthropic.com/v1/messages"
CLAUDE_MODEL = "claude-3-5-sonnet-20241022"
PROMPTING_YAML_FILE = "prompting.yaml"


def load_prompts_from_yaml() -> Dict:
    """
    Load prompts from the YAML configuration file.
    
    Returns:
        Dict: Dictionary containing all prompts from YAML file
    """
    try:
        yaml_path = Path(PROMPTING_YAML_FILE)
        if not yaml_path.exists():
            raise FileNotFoundError(f"Prompting YAML file not found: {PROMPTING_YAML_FILE}")
            
        with open(yaml_path, 'r', encoding='utf-8') as f:
            prompts_data = yaml.safe_load(f)
            
        if not prompts_data or 'prompts' not in prompts_data:
            raise ValueError("Invalid YAML structure: 'prompts' key not found")
            
        logger.info(f"Successfully loaded {len(prompts_data['prompts'])} prompts from {PROMPTING_YAML_FILE}")
        return prompts_data['prompts']
        
    except Exception as e:
        logger.error(f"Error loading prompts from YAML: {str(e)}")
        raise


def get_prompt_content(prompt_key: str) -> str:
    """
    Get prompt content from YAML configuration.
    
    Args:
        prompt_key: Key of the prompt to retrieve
        
    Returns:
        str: Prompt content
    """
    try:
        prompts = load_prompts_from_yaml()
        
        if prompt_key not in prompts:
            raise KeyError(f"Prompt key '{prompt_key}' not found in YAML configuration")
            
        content = prompts[prompt_key].get('content', '')
        
        if not content:
            raise ValueError(f"Empty content for prompt key '{prompt_key}'")
            
        logger.debug(f"Retrieved prompt '{prompt_key}': {len(content)} characters")
        return content
        
    except Exception as e:
        logger.error(f"Error getting prompt content for '{prompt_key}': {str(e)}")
        raise


def get_claude_api_key() -> str:
    """
    Get Claude API key from environment variables.
    
    Returns:
        str: API key
    """
    api_key = os.getenv('CLAUDE_API_KEY')
    if not api_key:
        raise ValueError("CLAUDE_API_KEY environment variable not set. Please check your .env file.")
    return api_key


def send_claude_request(payload: dict) -> Optional[str]:
    """
    Send request to Claude API and get response text.
    
    Args:
        payload: Request payload
        
    Returns:
        Optional[str]: Response text from Claude or None if failed
    """
    try:
        api_key = get_claude_api_key()
        
        headers = {
            "Content-Type": "application/json",
            "x-api-key": api_key,
            "anthropic-version": "2023-06-01"
        }
        
        logger.debug("Sending request to Claude API...")
        response = requests.post(
            CLAUDE_API_URL,
            json=payload,
            headers=headers,
            timeout=120
        )
        
        if response.status_code == 200:
            response_data = response.json()
            content = response_data.get('content', [])
            
            if content and isinstance(content, list) and len(content) > 0:
                return content[0].get('text', '')
            else:
                logger.error("Unexpected response format from Claude API")
                return None
        else:
            logger.error(f"Claude API request failed with status {response.status_code}: {response.text}")
            return None
            
    except requests.exceptions.RequestException as e:
        logger.error(f"Network error when calling Claude API: {str(e)}")
        return None
    except Exception as e:
        logger.error(f"Unexpected error when calling Claude API: {str(e)}")
        return None


def analyze_customer_request(customer_info: str, customer_prompt: str, yaml_prompt_key: str = "repair_analysis") -> Optional[str]:
    """
    Analyze a customer request by combining their information with a YAML prompt and sending to Claude.
    
    Args:
        customer_info: Customer's information (name, property details, etc.)
        customer_prompt: Customer's specific request/prompt
        yaml_prompt_key: Key of the prompt to use from YAML file (default: "repair_analysis")
        
    Returns:
        Optional[str]: Claude's response or None if failed
    """
    try:
        # Get the base prompt from YAML
        base_prompt = get_prompt_content(yaml_prompt_key)
        
        # Combine customer information and prompt with the YAML prompt
        combined_prompt = f"""{base_prompt}

            Customer Information:
            {customer_info}

            Customer Request:
            {customer_prompt}"""

        # Prepare the request payload
        payload = {
            "model": CLAUDE_MODEL,
            "max_tokens": 2048,
            "messages": [
                {
                    "role": "user",
                    "content": combined_prompt
                }
            ]
        }
        
        logger.info(f"Sending customer request to Claude using prompt key: {yaml_prompt_key}")
        logger.debug(f"Combined prompt length: {len(combined_prompt)} characters")
        
        # Send to Claude and get response
        response = send_claude_request(payload)
        
        if response:
            logger.info(f"Successfully received Claude response: {len(response)} characters")
            return response
        else:
            logger.error("Failed to get response from Claude")
            return None
            
    except Exception as e:
        logger.error(f"Error analyzing customer request: {str(e)}")
        return None


def process_prompt(prompt: str, customer_info: str = "", yaml_prompt_key: str = "repair_analysis") -> Optional[str]:
    """
    Process a prompt by sending it to Claude API with YAML prompt integration.
    This is a wrapper function for the main analyze_customer_request function.
    
    Args:
        prompt: The customer's prompt/request
        customer_info: Optional customer information (defaults to empty)
        yaml_prompt_key: Key of the prompt to use from YAML file (default: "repair_analysis")
        
    Returns:
        Optional[str]: Claude's response or None if failed
    """
    return analyze_customer_request(customer_info, prompt, yaml_prompt_key)


def get_available_prompts() -> list:
    """
    Get list of available prompt keys from YAML file.
    
    Returns:
        list: List of available prompt keys
    """
    try:
        prompts = load_prompts_from_yaml()
        return list(prompts.keys())
    except Exception as e:
        logger.error(f"Error getting available prompts: {str(e)}")
        return [] 