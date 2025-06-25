# Update main.py to include a function called handle_prompt

## Purpose
The goal is to expose a `/handle-prompt` endpoint in main.py so that the frontend can send a text prompt. This prompt will be passed to claude_api for processing, and the result will be routed into repair_agent for a final formatted response.

## Step 1: Import the needed modules

Make sure the following are at the top of `main.py`:

from fastapi import FastAPI, Request
from pydantic import BaseModel
from claude_api import process_prompt
from repair_agent import generate_response

## Step 2: Create a request body schema

Add this Pydantic model somewhere in main.py:

class PromptInput(BaseModel):
    prompt: str

## Step 3: Define the /handle-prompt endpoint

Add this function to main.py:

@app.post("/handle-prompt")
async def handle_prompt(input: PromptInput):
    try:
        # Step 1: Send prompt to Claude API
        claude_output = process_prompt(input.prompt)

        # Step 2: Pass Claude's output to repair agent logic
        response = generate_response(claude_output)

        return {
            "status": "success",
            "response": response
        }

    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }

## Step 4: Ensure CORS is enabled if you're calling from a browser

If not already present, make sure to add:

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Or specify your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

## Step 5: Make sure claude_api.py has a function called `process_prompt(prompt: str)` and repair_agent.py has a function called `generate_response(data: dict | str)`

If the data flow is more complex, modify handle_prompt accordingly.
