# END-END CI/CD Pipeline Setup for Angular JavaScript Project

## Overview
This document summarizes the steps taken to set up a complete CI/CD pipeline for an Angular JavaScript project using AWS Ubuntu server, Docker, Jenkins, SonarQube, Nexus, and GitHub Actions.

---

## Steps with Commands

### 1. Project Setup
- Create Angular project:
  
  UPLOAD YOUR CODE IN GITHUB
  
  Here i have created simple game using Angular javascript code 
  
  ```bash
  ng new my-angular-app
  cd my-angular-app
  git init
  git remote add origin <your-github-repo-url>
  git add .
  git commit -m "Initial commit"
  git push origin main
  ```

![](C:\Users\jagan\Downloads\DOCKERJS-SS\Screenshot 2025-11-16 100312.png)

### 2. AWS Ubuntu Server Setup

- Launch AWS Ubuntu instance and SSH:
  ```bash
  ssh -i "your-key.pem" ubuntu@<EC2-IP>
  ```
  
- Update packages:
  ```bash
  sudo apt update && sudo apt upgrade -y
  ```
  
  ![](C:\Users\jagan\Downloads\DOCKERJS-SS\Screenshot 2025-11-16 100257.png)
  
- Install Docker:
  
  ```bash
  sudo apt install docker.io -y
  sudo systemctl enable docker
  sudo systemctl start docker
  ```

​    CLONE YOUR CODE 

use `git clone <your URL>`

![](C:\Users\jagan\Downloads\DOCKERJS-SS\Screenshot 2025-11-16 100403.png)  

### 3. Docker Configuration

- Pull images:
  ```bash
  sudo docker pull sonarqube
  sudo docker pull sonatype/nexus3
  sudo docker pull jenkins/jenkins:lts
  ```
  
  ![](C:\Users\jagan\Downloads\DOCKERJS-SS\Screenshot 2025-11-16 100329.png)
  
- Run containers:
  
  ```bash
  sudo docker run -dt --name sonarqube -p 9000:9000 sonarqube
  sudo docker run -dt --name nexus -p 8081:8081 sonatype/nexus3
  sudo docker run -dt --name jenkins -p 8080:8080 -p 50000:50000 jenkins/jenkins:lts
  ```

​      ![](C:\Users\jagan\Downloads\DOCKERJS-SS\Screenshot 2025-11-16 101737.png)

### 4. Host Server Configuration

- Install Node.js, npm, Angular CLI:
  ```bash
  curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
  sudo apt install -y nodejs
  npm install -g @angular/cli
  ```

### 5. Dockerfile for Deployment

Example Dockerfile:
```dockerfile
# Dockerfile that downloads artifact (zip or tar.gz) from Nexus and serves it with nginx.
# Usage:
# docker build --build-arg NEXUS_URL=http://nexus.example:8081 --build-arg REPO_PATH=repository/js/puzzlegame-2048.zip --build-arg NEXUS_USER=admin --build-arg NEXUS_PASS=pass -f Dockerfile.nexus-download -t yourrepo/puzzlegame:latest .
# Then run: docker run -p 80:80 yourrepo/puzzlegame:latest
FROM nginx:stable-alpine
ARG NEXUS_URL
ARG REPO_PATH
ARG NEXUS_USER
ARG NEXUS_PASS
WORKDIR /tmp
# download artifact from nexus; supports basic auth if provided
RUN apk add --no-cache curl unzip bash
# If credentials provided, use them. Otherwise anonymous.
RUN if [ -n "$NEXUS_USER" ] && [ -n "$NEXUS_PASS" ]; then               curl -fSL -u "$NEXUS_USER:$NEXUS_PASS" "$NEXUS_URL/$REPO_PATH" -o /tmp/artifact.zip ;             else               curl -fSL "$NEXUS_URL/$REPO_PATH" -o /tmp/artifact.zip ;             fi
RUN unzip -o /tmp/artifact.zip -d /usr/share/nginx/html
# ensure nginx runs in foreground
CMD ["/usr/sbin/nginx","-g","daemon off;"]
```
![](C:\Users\jagan\Downloads\DOCKERJS-SS\Screenshot 2025-11-16 102501.png)

If you want to test your image and upload it to Dockerhub

Build and push:

```bash
docker build -t <dockerhub-username>/angular-app:latest .
docker push <dockerhub-username>/angular-app:latest
```

NOW I HAVE DONE MANUAL SETUP LETS AUTOMATE IT USING JENKINS 

### 6. Jenkins Setup

- Access Jenkins: `http://<EC2-IP>:8080`

- Add credentials:
  - Nexus username/password
  
  - SonarQube token
  
  - Docker Hub username/token
  
    ![](C:\Users\jagan\Downloads\DOCKERJS-SS\Screenshot 2025-11-16 102840.png)
  
- Install plugins:
  - GitHub, SCP, Artifact, NodeJS, Nexus, Docker, Deployer, SonarQube Scanner
  
    ![](C:\Users\jagan\Downloads\DOCKERJS-SS\Screenshot 2025-11-16 103142.png)
  
- Configure tools:
  - NodeJS and JDK paths
  - manage jenkins-->tools
  - Add your sonarqube URL and token in manage jenkins-->systemconfiguration    

BEFORE CREATING NEW ITEM MAKE SURE THAT

nodejs,docker,sonar-scanner is installed in jenkins container

USE THE BELOW COMMANDS:

`docker exec -it --user root JENKINS /bin/bash`

Update and install Docker Using:

`apt update && apt install docker.io`

To install Nodejs:
`apt install -y nodejs`

Install zip/unzip :

`apt install zip && apt  install unzip`

To install sonar-scanner:

`sudo wget https://binaries.sonarsource.com/Distribution/sonar-scanner-cli/sonar-scanner-cli-5.0.1.3006-linux.zip`

`unzip sonar-scanner-cli-5.0.1.3006-linux.zip`

`mv sonar-scanner-5.0.1.3006-linux sonar-scanner`

![](C:\Users\jagan\Downloads\DOCKERJS-SS\Screenshot 2025-11-16 112137.png)

### 7. Jenkins Pipeline Script

Create a New item 

![](C:\Users\jagan\Downloads\DOCKERJS-SS\Screenshot 2025-11-16 104123.png)

Write Your Pipeline code:

Example:
```groovy
pipeline {
    agent any
    environment {
        SONAR_TOKEN = credentials('SONAR-TOKEN')
        NEXUS_CRED = credentials('NEXUS-CRED')
        DOCKER_HUB = credentials('DOCKER-HUB')
    }
    stages {
        stage('Checkout') {
            steps {
                git branch: 'main', url: 'https://github.com/DEICONX/2048-DOCKER-PROJECT.git'
            }
        }

        stage('Install & Build App') {
            steps {
                sh '''
                    apt-get update && apt-get install -y zip
                    npm install
                    npm run build || echo "No build script found, skipping..."
                    zip -r artifact.zip Dockerfile.nexus-download Jenkinsfile README.md ci_instructions.txt dist index.html main.js package-lock.json package.json styles.css
                '''
            }
        }

        stage('SonarQube Analysis') {
            steps {
                withSonarQubeEnv('SONAR') {
                    sh '''
                        export PATH=$PATH:/opt/sonar-scanner/bin
                        sonar-scanner \
                        -Dsonar.projectKey=2048-DOCKER \
                        -Dsonar.sources=. \
                        -Dsonar.host.url=http://98.95.253.231:9000 \
                        -Dsonar.login=$SONAR_TOKEN
                    '''
                }
            }
        }

        stage('Upload Artifact to Nexus') {
            steps {
                sh '''
                    curl -u $NEXUS_CRED_USR:$NEXUS_CRED_PSW \
                    --upload-file artifact.zip \
                    http://98.95.253.231:8081/repository/js/artifact.zip
                '''
            }
        }

        stage('Build Docker Image') {
            steps {
                sh '''
                    docker build \
                    --build-arg NEXUS_URL=http://98.95.253.231:8081 \
                    --build-arg REPO_PATH=repository/js/artifact.zip \
                    --build-arg NEXUS_USER=$NEXUS_CRED_USR \
                    --build-arg NEXUS_PASS=$NEXUS_CRED_PSW \
                    -f Dockerfile.nexus-download -t deiconx/2048-game:latest .
                '''
            }
        }

        stage('Push to Docker Hub') {
            steps {
                sh '''
                    echo $DOCKER_HUB_PSW | docker login -u $DOCKER_HUB_USR --password-stdin
                    docker push deiconx/2048-game:latest
                '''
            }
        }

        stage('Deploy Container') {
            steps {
                sh '''
                    docker rm -f 2048-game || true
                    docker run -d --name 2048-game -p 80:80 deiconx/2048-game:latest
                '''
            }
        }
    }
    post {
        always {
            echo 'Pipeline finished!'
        }
    }
}
```

SAVE AND BUILD

![](C:\Users\jagan\Downloads\DOCKERJS-SS\Screenshot 2025-11-16 104158.png)

------

Pipeline Executed Successfully!!!!!

![](C:\Users\jagan\Downloads\DOCKERJS-SS\Screenshot 2025-11-16 123743.png)

--------

Lets Now see the outputs:

SONARQUBE OUTPUT:

![](C:\Users\jagan\Downloads\DOCKERJS-SS\Screenshot 2025-11-16 123800.png)

-------

NEXUS OUTPUT:

![](C:\Users\jagan\Downloads\DOCKERJS-SS\Screenshot 2025-11-16 123811.png)

-----------

DOCKER HUB OUTPUT:

In cli our image is created

![](C:\Users\jagan\Downloads\DOCKERJS-SS\Screenshot 2025-11-16 123834.png)

Our image is uploaded to Docker Hub

![](C:\Users\jagan\Downloads\DOCKERJS-SS\Screenshot 2025-11-16 123906.png)

--------

NGINX OUTPUT:

our application deployed successfully!!!!!

![](C:\Users\jagan\Downloads\DOCKERJS-SS\Screenshot 2025-11-16 123931.png)

-------

### 8. GitHub Actions Workflow

Lets Now Build a pipeline and deploy our application Using GITHUB actions

CONFIGURE YOUR CREDENTIALS:

Your repo settings-->secrets and variables-->Actions-->new repository secret

![](C:\Users\jagan\Downloads\DOCKERJS-SS\Screenshot 2025-11-16 125114.png)

-----

Now create a workflow .github/workflows/ci-cd.yml to write your yamel file

My `.github/workflows/ci-cd.yml`: 

```yaml
name: CI/CD Pipeline

on:
  push:
    branches:
      - main

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    env:
      SONAR_HOST_URL: http://98.95.253.231:9000
      SONAR_PROJECT_KEY: 2048-DOCKER
      NEXUS_URL: http://98.95.253.231:8081
      NEXUS_REPO_PATH: repository/js/artifact.zip
      IMAGE_NAME: deiconx/2048-game:latest

    steps:
      - name: Checkout Code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install Dependencies & Build
        run: |
          sudo apt-get update && sudo apt-get install -y zip curl
          npm install
          npm run build || echo "No build script found"
          zip -r artifact.zip Dockerfile.nexus-download README.md dist index.html main.js package-lock.json package.json styles.css

      - name: SonarQube Analysis
        run: |
          curl -sSLo sonar-scanner.zip https://binaries.sonarsource.com/Distribution/sonar-scanner-cli/sonar-scanner-cli-5.0.1.3006-linux.zip
          unzip sonar-scanner.zip -d $HOME
          export PATH=$PATH:$HOME/sonar-scanner-5.0.1.3006-linux/bin
          sonar-scanner \
            -Dsonar.projectKey=$SONAR_PROJECT_KEY \
            -Dsonar.sources=. \
            -Dsonar.host.url=$SONAR_HOST_URL \
            -Dsonar.login=${{ secrets.SONAR_TOKEN }}

      - name: Upload Artifact to Nexus
        run: |
          curl -u ${{ secrets.NEXUS_USERNAME }}:${{ secrets.NEXUS_PASSWORD }} \
          --upload-file artifact.zip \
          $NEXUS_URL/$NEXUS_REPO_PATH

      - name: Build Docker Image
        run: |
          docker build \
          --build-arg NEXUS_URL=$NEXUS_URL \
          --build-arg REPO_PATH=$NEXUS_REPO_PATH \
          --build-arg NEXUS_USER=${{ secrets.NEXUS_USERNAME }} \
          --build-arg NEXUS_PASS=${{ secrets.NEXUS_PASSWORD }} \
          -f Dockerfile.nexus-download -t $IMAGE_NAME .

      - name: Login to Docker Hub
        run: echo "${{ secrets.DOCKER_HUB_PASSWORD }}" | docker login -u "${{ secrets.DOCKER_HUB_USERNAME }}" --password-stdin

      - name: Push Docker Image
        run: docker push $IMAGE_NAME

      - name: Deploy to Remote Server
        uses: appleboy/ssh-action@v0.1.10
        with:
          host: 98.95.253.231
          username: ubuntu
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            set -e
            echo "Removing old container..."
            docker rm -f 2048-game || true
            echo "Pulling latest image..."
            docker pull deiconx/2048-game:latest
            echo "Starting new container..."
            docker run -d --name 2048-game -p 80:80 deiconx/2048-game:latest
            echo "Checking container status..."
            docker ps
            echo "Health check..."
            curl -f http://localhost || { echo "Health check failed"; exit 1;}
```

![](C:\Users\jagan\Downloads\DOCKERJS-SS\Screenshot 2025-11-16 125219.png)

-------------------

COMMIT and visit Actions 

Our Pipeline is build successfully!!!!

![](C:\Users\jagan\Downloads\DOCKERJS-SS\Screenshot 2025-11-16 130303.png)

------------------

SONARQUBE OUTPUT:

![](C:\Users\jagan\Downloads\DOCKERJS-SS\Screenshot 2025-11-16 130321.png)

-----------------

NEXUS OUTPUT:

![](C:\Users\jagan\Downloads\DOCKERJS-SS\Screenshot 2025-11-16 130337.png)

-------------------

DOCKERHUB OUTPUT:

![](C:\Users\jagan\Downloads\DOCKERJS-SS\Screenshot 2025-11-16 130706.png)

----------------

NGINX OUTPUT:

Our application deployed successfully:

![](C:\Users\jagan\Downloads\DOCKERJS-SS\Screenshot 2025-11-16 130350.png)

## Results
- Complete CI/CD pipeline implemented.
- Automated build, test, and deployment process.
- Integration with SonarQube, Nexus, Jenkins, Docker Hub, and GitHub Actions achieved.

