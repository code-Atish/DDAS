# Duplicate Downloads Detector

**Duplicate Downloads Detector** is a lightweight Chrome extension designed to prevent multiple downloads of the same file. It alerts users when they attempt to download a file already present in the download history, saving time and avoiding redundancy.

## Features
- **Real-time detection**: Automatically checks download history for duplicate files.
- **Customizable behavior**: Allows users to override or block duplicate downloads.
- **Native Messaging Integration**: Facilitates interaction between the extension and local storage for enhanced functionality.
- **Simple and intuitive UI**: Easy-to-use interface for enabling/disabling the extension.
- **Lightweight**: Minimal performance impact on your browser.

## Installation

1. Clone or download the repository:  
   ``` 
    git clone https://github.com/code-Atish/DDAS.git
    ```

2. Open Chrome and navigate to  
    ``` 
    chrome://extensions/
    ```

3. Enable **Developer mode** in the top right corner.

4. Click **Load unpacked** and select the extension folder.

5. Follow the instructions in the **Setting Up Native Messaging** section to enable native messaging.

## Setting Up Native Messaging

The extension uses Chrome's **Native Messaging** feature to enable interaction between the extension and the local machine. Here's how to set it up:

### 1. Create the Native Host Script
Use the script  (`native_messaging_app.py`) to handle communication between the extension and the local storage.

### 2. Register the Native Host
Use the JSON manifest file ( `com.example.native_messaging.json` ) with the following structure:

```
{
    "name": "com.example.native_messaging_host",
    "description": "Native messaging host for Duplicate Downloads Detector",
    "path": "/absolute/path/to/native_messaging_host.py",
    "type": "stdio",
    "allowed_origins": ["chrome-extension://<extension-id>/"]
}
```


Replace `<extension-id>` with your extension's ID.

### 3. Install the Native Host
Copy the manifest file to the appropriate directory based on your operating system:  
- **Linux**: `~/.config/google-chrome/NativeMessagingHosts/`  
- **Windows**: `HKEY_CURRENT_USER\Software\Google\Chrome\NativeMessagingHosts\`  
- **Mac**: `~/Library/Application Support/Google/Chrome/NativeMessagingHosts/`



## Usage

1. Enable the extension by clicking its icon in the Chrome toolbar.  
2. Download a file as usual.  
3. If the file is a duplicate, the extension will notify you with an alert.



## How It Works

1. The extension listens for new downloads using the Chrome `downloads` API.  
2. On every download event, it checks the filename and file hash against the download history.  
3. Native messaging allows the extension to interact with the local system for advanced storage checks.  
4. If a match is found, it notifies the user about the duplicate.

## Technologies Used

- **Chrome Extensions API**  
- **Native Messaging**  
- **JavaScript**, **Python** for the native host  
- **HTML & CSS** for user interface  

## Contributing

1. Fork the repository.  
2. Create a new branch:  
   `git checkout -b feature-name`  

3. Make your changes and commit them:  
   `git commit -m "Add feature description"`  

4. Push to the branch:  
   `git push origin feature-name`  

5. Create a Pull Request.



## Contact

If you have any questions or suggestions, feel free to reach out:  
- **Email**: atishsuslade@gmail.com  
- **GitHub**: [code-Atish](https://github.com/code-Atish)



