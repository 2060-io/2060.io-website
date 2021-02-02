# 2060.io-website

[2060.io](https://github.com/2060-io/2060.io-website) is the 2060.io website based on Docsy, an Hugo theme for technical documentation sites, providing easy site navigation, structure, and more. This **2060.io-website** uses the Docsy theme

## Using the 2060.io website as a template

You can use this project as a template, which gives you a site project that is set up and ready to use. To do this: 

1. Click **Use this template**.

2. Select a name for your new project and click **Create repository from template**.

3. Make your own local working copy of your new repo using git clone, replacing https://github.com/my/example.git with your repo’s web URL:

```bash
git clone --recurse-submodules --depth 1 https://github.com/my/example.git
```

You can now edit your local versions of the site’s source files.

If you want to do SCSS edits and want to publish these, you need to install `PostCSS`

```bash
npm install
```

## Running the website locally

Once you've cloned or copied the site repo, from the repo root folder, run:

```
hugo server
```

## Running a container locally

You can run docsy-example inside a [Docker](ihttps://docs.docker.com/)
container, the container runs with a volume bound to the `docsy-example`
folder. This approach doesn't require you to install any dependencies other
than Docker.

1. Build the docker image 

```bash
docker build -f dev.Dockerfile -t docsy-example-dev:latest .
```

1. Run the built image

```bash
docker run --publish 1313:1313 --detach --mount src="$(pwd)",target=/home/docsy/app,type=bind docsy-example-dev:latest
```

Open your web browser and type `http://localhost:1313` in your navigation bar,
This opens a local instance of the docsy-example homepage. You can now make
changes to the docsy example and those changes will immediately show up in your
browser after you save.

To stop the container, first identify the container ID with:

```bash
docker container ls
```

Take note of the hexadecimal string below the `CONTAINER ID` column, then stop
the container:

```bash
docker stop [container_id]
```

To delete the container run:

```
docker container rm [container_id]
```
