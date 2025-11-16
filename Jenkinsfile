pipeline {
  agent any
  environment {
    DOCKERHUB_REPO = 'YOUR_DOCKERHUB_USER/puzzlegame'
    NEXUS_URL = 'http://nexus.example:8081'
    NEXUS_REPO_PATH = 'repository/js/puzzlegame-2048.zip'
    NEXUS_USER = credentials('nexus-user') // configure in Jenkins
    NEXUS_PASS = credentials('nexus-pass')
    SONAR_HOST = 'http://sonarqube:9000'
    SONAR_TOKEN = credentials('sonar-token')
  }
  stages {
    stage('Checkout') {
      steps { checkout scm }
    }
    stage('Install') {
      steps {
        sh 'node --version || true'
        sh 'npm --version || true'
        // No heavy install — assume host or agent has node/npm.
        sh 'npm ci || true'
      }
    }
    stage('Build') {
      steps {
        sh 'npm run build'
        sh 'ls -la dist'
      }
    }
    stage('SonarQube Scan') {
      steps {
        echo 'Running Sonar scan using sonar-scanner docker image'
        sh '''
          docker run --rm                     -e SONAR_HOST_URL=${SONAR_HOST}                     -e SONAR_LOGIN=${SONAR_TOKEN}                     -v "$(pwd)":/usr/src                     -w /usr/src                     sonarsource/sonar-scanner-cli                     -Dsonar.projectKey=puzzlegame -Dsonar.sources=. -Dsonar.login=${SONAR_TOKEN}
        '''
      }
    }
    stage('Package Artifact') {
      steps {
        sh 'rm -f puzzlegame-2048.zip || true'
        sh 'zip -r puzzlegame-2048.zip dist/*'
        sh 'ls -l puzzlegame-2048.zip'
      }
    }
    stage('Upload to Nexus') {
      steps {
        sh '''
          # Upload using curl; replace with your repo path
          curl -v -u ${NEXUS_USER}:${NEXUS_PASS} --upload-file puzzlegame-2048.zip "${NEXUS_URL}/${NEXUS_REPO_PATH}"
        '''
      }
    }
    stage('Build Docker Image & Push') {
      steps {
        sh '''
          docker build --build-arg NEXUS_URL=${NEXUS_URL} --build-arg REPO_PATH=${NEXUS_REPO_PATH} --build-arg NEXUS_USER=${NEXUS_USER} --build-arg NEXUS_PASS=${NEXUS_PASS} -f Dockerfile.nexus-download -t ${DOCKERHUB_REPO}:${BUILD_NUMBER} .
          echo $DOCKERHUB_PASS | docker login -u $DOCKERHUB_USER --password-stdin
          docker push ${DOCKERHUB_REPO}:${BUILD_NUMBER}
        '''
      }
    }
  }
  post {
    always {
      archiveArtifacts artifacts: 'puzzlegame-2048.zip', fingerprint: true
    }
  }
}
