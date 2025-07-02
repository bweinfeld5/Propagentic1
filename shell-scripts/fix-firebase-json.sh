#!/bin/bash

# Navigate to project root directory
cd "$(dirname "$0")/.."


cat > firebase.json << 'EOL'
{
  "hosting": {
    "public": "build",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }https://files.oaiusercontent.com/file-44MdBYN2KxBuZjMi12tacs?se=2025-03-31T15%3A47%3A59Z&sp=r&sv=2024-08-04&sr=b&rscc=max-age%3D299%2C%20immutable%2C%20private&rscd=attachment%3B%20filename%3DChatGPT%2520Image%2520Mar%252031%252C%25202025%252C%252011_42_01%2520AM.png&sig=lJOjwf96ck5RsOwW2WwStr4tfxXz1C/tyTjOmbIwNZk%3D
    ],
    "headers": [
      {
        "source": "**/*.js",
        "headers": [
          {
            "key": "Content-Type",
            "value": "application/javascript"
          },
          {
            "key": "Cache-Control",
            "value": "max-age=31536000"
          }
        ]
      },
      {
        "source": "**/*.css",
        "headers": [
          {
            "key": "Content-Type",
            "value": "text/css"
          },
          {
            "key": "Cache-Control",
            "value": "max-age=31536000"
          }
        ]
      },
      {
        "source": "**/*.html",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "no-cache"
          }
        ]
      }
    ]
  },
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "functions": {
    "ignore": [
      "node_modules",
      ".git",
      "firebase-debug.log",
      "firebase-debug.*.log"
    ],
    "predeploy": [
      "npm --prefix \"$RESOURCE_DIR\" install"
    ]
  }
}
EOL

echo "firebase.json has been fixed." 