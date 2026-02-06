pipeline {
    agent any

    stages {

        stage('Install Backend Deps') {
            steps {
                sh '''
                cd backend_django
                python3 -m venv venv
                . venv/bin/activate
                pip install -r requirements.txt
                '''
            }
        }

        stage('Django Check') {
            steps {
                sh '''
                cd backend_django
                . venv/bin/activate
                python manage.py check
                '''
            }
        }

        stage('Build') {
            steps {
                echo 'Build successful'
            }
        }
    }

    post {
        failure {
            sh '''
            curl -X POST https://webhook.site/YOUR-WEBHOOK-URL \
            -H "Content-Type: application/json" \
            -d '{"source":"jenkins","status":"failed"}'
            '''
        }
    }
}
