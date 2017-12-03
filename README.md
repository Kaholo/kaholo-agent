# production-map-base-agent
production map base agent



## Docker installation
Build the docker image:
```
cd production-map-base-agent
docker build -t agent .
```
Now, run the image
```
cd production-map-base-agent
docker run -p 8090:8090 -e SERVER_URL="<your server url>" -e SERVER_PORT="<your server port>" agent
```
