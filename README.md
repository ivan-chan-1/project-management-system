[![Open in Visual Studio Code](https://classroom.github.com/assets/open-in-vscode-2e0aaae1b6195c2367325f4f02e2d04e9abb55f0b24a779b69b11b9e10269abc.svg)](https://classroom.github.com/online_ide?assignment_repo_id=18281454&assignment_repo_type=AssignmentRepo)

TO RUN WITH DOCKER:
run:
```
docker-compose build --no-cache
```
and then:
```
docker-compose up
```

If your docker is making your device run out of space, try:
```
docker system prune -a --volumes
```
and:
```
docker-compose down -v
```

TO DEPLOY THE BACKEND:

Run:
```
docker buildx build \
  --platform linux/amd64 \
  -t australia-southeast1-docker.pkg.dev/dragonfruit-3900/capstone-management/backend:latest \
  --push .
```
And then:
```
gcloud run deploy backend \
  --image australia-southeast1-docker.pkg.dev/dragonfruit-3900/capstone-management/backend:latest \
  --platform managed \
  --region australia-southeast1
```

If the container fails to become healthy, check the logs for errors:
```
gcloud run logs read backend
```

TO DEPLOY THE FRONTEND:

Change the API_URL in apiUtil.ts (find documentation in the file)

Run:
```
docker buildx build \
  --platform linux/amd64 \
  -t australia-southeast1-docker.pkg.dev/dragonfruit-3900/capstone-management/frontend:latest \
  --push .
```
And then:
```
gcloud run deploy frontend \
  --image australia-southeast1-docker.pkg.dev/dragonfruit-3900/capstone-management/frontend:latest \
  --platform managed \
  --region australia-southeast1 \
  --allow-unauthenticated
```