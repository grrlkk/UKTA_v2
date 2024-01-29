# Base image for the backend
FROM tiangolo/uvicorn-gunicorn-fastapi:python3.9

# Set the working directory
WORKDIR /app

# Copy the backend code to the container
COPY . /app

# Install the required Python packages
RUN pip install --no-cache-dir -r requirements.txt

# Expose the backend port
EXPOSE 8000

# Start the backend server
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
