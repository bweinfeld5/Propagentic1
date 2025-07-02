#!/bin/bash

# Navigate to project root directory
cd "$(dirname "$0")/.."

firebase deploy --only functions:deleteUser
