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
