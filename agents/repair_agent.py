import json
import logging
from typing import Dict, Any, Optional

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def handle_claude_response(response: Dict[str, Any]) -> str:
    """
    Process a JSON response from Claude and decide how to proceed based on its contents.
    
    Args:
        response: Dictionary containing Claude's parsed JSON response
        
    Returns:
        str: The message/action to present to the user
        
    Raises:
        ValueError: If required fields are missing from the response
    """
    try:
        logger.info("Processing Claude response for decision logic")
        
        # Validate required fields
        required_fields = ['parts_needed', 'complexity_level', 'further_inquiry']
        missing_fields = []
        
        for field in required_fields:
            if field not in response:
                missing_fields.append(field)
        
        if missing_fields:
            error_msg = f"Missing required fields in Claude response: {missing_fields}"
            logger.error(error_msg)
            raise ValueError(error_msg)
        
        # Extract fields from response
        parts_needed = response.get('parts_needed')
        complexity_level = response.get('complexity_level', '').lower()
        further_inquiry = response.get('further_inquiry')
        further_questions = response.get('further_questions', '')
        instructions = response.get('instructions', '')
        
        logger.info(f"Response analysis - Parts needed: {parts_needed}, "
                   f"Complexity: {complexity_level}, Further inquiry: {further_inquiry}")
        
        # Decision Logic Implementation
        
        # Rule 1: If parts needed OR high complexity → suggest contractor
        if parts_needed is True or complexity_level == "high":
            message = "It seems your issue is rather complex, would you like for me to dispatch a contractor to your address?"
            logger.info("Decision: Suggest contractor dispatch (complex issue)")
            return message
        
        # Rule 2: If parts NOT needed AND complexity is medium/low
        elif parts_needed is False and complexity_level in ["medium", "low"]:
            
            # Sub-rule 2a: If further inquiry needed → ask questions
            if further_inquiry is True:
                if not further_questions:
                    logger.warning("Further inquiry requested but no questions provided")
                    message = "I need more information to help you, but no specific questions were provided."
                else:
                    message = further_questions
                    logger.info("Decision: Ask follow-up questions for more information")
                return message
            
            # Sub-rule 2b: If no further inquiry needed → provide instructions
            elif further_inquiry is False:
                if not instructions:
                    logger.warning("Instructions requested but none provided")
                    message = "I should provide repair instructions, but none were generated."
                else:
                    message = instructions
                    logger.info("Decision: Provide repair instructions")
                return message
            
            else:
                # further_inquiry is neither True nor False
                logger.error(f"Invalid value for further_inquiry: {further_inquiry}")
                return "Unable to determine next steps due to unclear inquiry status."
        
        else:
            # Fallback for unexpected combinations
            logger.warning(f"Unexpected combination - Parts: {parts_needed}, "
                          f"Complexity: {complexity_level}")
            return "Unable to determine the appropriate next steps for this repair situation."
    
    except Exception as e:
        logger.error(f"Error processing Claude response: {str(e)}")
        return f"Error processing repair analysis: {str(e)}"
    
def validate_claude_response_structure(response: Dict[str, Any]) -> bool:
    """
    Validate that a Claude response has the expected structure.
    
    Args:
        response: Dictionary to validate
        
    Returns:
        bool: True if structure is valid, False otherwise
    """
    required_fields = {
        'parts_needed': bool,
        'complexity_level': str,
        'further_inquiry': bool
    }
    
    optional_fields = {
        'further_questions': str,
        'instructions': str,
        'description_of_issue': str
    }
    
    # Check required fields
    for field, expected_type in required_fields.items():
        if field not in response:
            logger.warning(f"Missing required field: {field}")
            return False
        if not isinstance(response[field], expected_type):
            logger.warning(f"Field {field} has wrong type: expected {expected_type}, got {type(response[field])}")
            return False
    
    # Check complexity level values
    valid_complexity = ['low', 'medium', 'high']
    if response['complexity_level'].lower() not in valid_complexity:
        logger.warning(f"Invalid complexity_level: {response['complexity_level']}")
        return False
    
    logger.info("Claude response structure validation passed")
    return True


def generate_response(data) -> str:
    """
    Generate a response based on Claude's output.
    This function handles both dict and string inputs from Claude.
    
    Args:
        data: Either a dictionary (parsed JSON) or string response from Claude
        
    Returns:
        str: Formatted response for the user
    """
    try:
        logger.info("Generating response from Claude output")
        
        # If data is a string, try to parse it as JSON
        if isinstance(data, str):
            try:
                # Try to parse as JSON first
                import json
                parsed_data = json.loads(data)
                logger.info("Successfully parsed string data as JSON: \n{parsed_data}")
                return handle_claude_response(parsed_data)
            except (json.JSONDecodeError, ValueError):
                # If parsing fails, return the raw string
                logger.info("Could not parse as JSON, returning raw response")
                return data
        
        # If data is already a dict, use it directly
        elif isinstance(data, dict):
            logger.info("Processing dictionary data through repair agent logic")
            return handle_claude_response(data)
        
        # Handle other data types
        else:
            logger.warning(f"Unexpected data type: {type(data)}")
            return str(data)
            
    except Exception as e:
        logger.error(f"Error generating response: {str(e)}")
        return f"Error processing repair analysis: {str(e)}"