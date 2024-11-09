import sys
import struct
import json
import hashlib
import logging

# Set up logging to a file
logging.basicConfig(filename='native_app.log', level=logging.DEBUG, 
                    format='%(asctime)s %(levelname)s:%(message)s')

# Function to read the message from Chrome extension
def get_message():
    raw_length = sys.stdin.read(4)
    if not raw_length:
        return None
    message_length = struct.unpack('I', raw_length.encode('utf-8'))[0]
    message = sys.stdin.read(message_length)
    logging.debug(f"Received message: {message}")  # Log the received message
    return message

# Function to send a message back to the Chrome extension
def send_message(message):
    encoded_message = json.dumps(message).encode('utf-8')
    packed_length = struct.pack('I', len(encoded_message))
    sys.stdout.buffer.write(packed_length + encoded_message)
    sys.stdout.buffer.flush()

# Function to hash the first few bytes of a file
def hash_file(filepath, num_bytes=4096):
    try:
        logging.debug(f"Hashing file: {filepath}")  # Log the file path being hashed
        with open(filepath, 'rb') as f:
            data = f.read(num_bytes)
        return hashlib.sha256(data).hexdigest()
    except Exception as e:
        logging.error(f"Error while hashing file: {e}")  # Log the error
        return f"Error: {str(e)}"

# Main loop
if __name__ == "__main__":
    logging.debug("Native app started")
    while True:
        input_data = get_message()  # Get message from Chrome extension
        if input_data:
            try:
                data = json.loads(input_data)
                filepath = data.get('filePath', '').strip()
                file_hash = hash_file(filepath)
                send_message({"status": "success", "hash": file_hash})
            except json.JSONDecodeError as e:
                logging.error(f"JSON decoding error: {e}")
                send_message({"status": "error", "message": f"JSON decode error: {str(e)}"})
            except Exception as e:
                logging.error(f"Unexpected error: {e}")
                send_message({"status": "error", "message": str(e)})
