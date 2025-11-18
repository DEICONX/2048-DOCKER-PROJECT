2048 Puzzle Game - Simple JavaScript App
=======================================
What you get:
- A plain HTML/JS/CSS implementation of the 2048 game (playable in browser).
- package.json with build script that copies files into /dist
- Dockerfile that downloads artifact from Nexus during docker build (uses build args)
- Jenkinsfile (declarative pipeline) for full CI/CD: build, sonar scan, upload artifact to Nexus, build Docker image, push to Docker Hub
- Instructions below to run on an Ubuntu EC2 host.

Quick start (locally):
1. unzip and open index.html in a browser OR
2. npm install then run: npm run build -> ./dist contains production files.

Replace any placeholder values (NEXUS URL, credentials, DOCKERHUB repo, SONAR tokens) before using in CI.
