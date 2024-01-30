# Use the Anaconda base image
FROM continuumio/anaconda3

# Set the working directory in the Docker image
WORKDIR /app

# Copy the Conda environment file
COPY environment.yml /app/environment.yml

# Create the Conda environment
RUN conda env create -f /app/environment.yml

# Make RUN commands use the new environment
SHELL ["conda", "run", "-n", "korcat", "/bin/bash", "-c"]

# Install FastAPI, Uvicorn, and Gunicorn
RUN pip install fastapi uvicorn gunicorn

# Copy the FastAPI app code to the container
COPY . /app

# Expose the port the app runs on
EXPOSE 8000

# The command to start the app using Gunicorn with Uvicorn workers
CMD ["conda", "run", "-n", "korcat", "gunicorn", "-k", "uvicorn.workers.UvicornWorker", "-w", "4", "-b", "0.0.0.0:8000", "main:app"]
