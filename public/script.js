// const Api_url = "/api/chat"; // points to your backend route
const Api_url = "http://localhost:3000/api/chat";

// DOM elements
const chatContainer = document.querySelector(".chat-container");
const promptInput = document.getElementById("prompt");
const submitBtn = document.getElementById("submit");
const imageBtn = document.getElementById("image");
const imagePreview = document.getElementById("imagePreview");
const fileInput = document.querySelector('input[type="file"]');

// User object to store message and file data
const user = {
    message: "",
    file: null
};

// Event listeners
submitBtn.addEventListener("click", handleSubmit);
promptInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        handleSubmit();
    }
});

imageBtn.addEventListener("click", () => {
    fileInput.click();
});

fileInput.addEventListener("change", handleFileUpload);

// Handle submit button click
async function handleSubmit() {
    const message = promptInput.value.trim();
    
    // Allow submission if there's either a message or a file
    if (!message && !user.file) {
        alert("Please enter a message or upload an image first!");
        return;
    }

    user.message = message;
    
    // Create user chat box
    createUserChatBox(message);
    
    // Clear input
    promptInput.value = "";
    
    // Create AI chat box
    const aiChatBox = createAIChatBox();
    
    // Generate AI response
    await generateResponse(aiChatBox);
}

// Handle file upload
function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    // Check file size (20MB limit)
    const maxSize = 20 * 1024 * 1024; // 20MB in bytes
    if (file.size > maxSize) {
        alert(`File too large! Maximum size is 20MB. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB`);
        return;
    }

    // Check if it's an image
    if (!file.type.startsWith('image/')) {
        alert('Please select an image file (JPEG, PNG, GIF, etc.)');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        const base64Data = e.target.result.split(',')[1];
        const mimeType = file.type;
        
        user.file = {
            mime_type: mimeType,
            data: base64Data
        };
        
        imagePreview.src = e.target.result;
        imagePreview.classList.add("choose");
        
        // Show file info
        console.log(`File uploaded: ${file.name} (${(file.size / (1024 * 1024)).toFixed(2)}MB)`);
    };
    
    reader.onerror = function() {
        alert('Error reading file. Please try again.');
    };
    
    reader.readAsDataURL(file);
}

// Create user chat box
function createUserChatBox(message) {
    const userChatBox = document.createElement("div");
    userChatBox.className = "user-chat-box";
    
    const userImg = document.createElement("img");
    userImg.src = "images/user_icon.png";
    userImg.alt = "User";
    userImg.id = "userImage";
    userImg.width = "50";
    
    const userChatArea = document.createElement("div");
    userChatArea.className = "user-chat-area";
    
    // If there's a file, show both image and text
    if (user.file && user.file.data) {
        // Create image element
        const uploadedImage = document.createElement("img");
        uploadedImage.src = `data:${user.file.mime_type};base64,${user.file.data}`;
        uploadedImage.alt = "Uploaded Image";
        uploadedImage.className = "uploaded-image";
        uploadedImage.style.maxWidth = "100%";
        uploadedImage.style.height = "auto";
        uploadedImage.style.borderRadius = "10px";
        uploadedImage.style.marginBottom = "10px";
        
        // Add image first
        userChatArea.appendChild(uploadedImage);
        
        // Add text below image (if any)
        if (message && message.trim()) {
            const messageText = document.createElement("div");
            messageText.textContent = message;
            messageText.style.marginTop = "10px";
            userChatArea.appendChild(messageText);
        }
    } else {
        // Just text message
        userChatArea.textContent = message;
    }
    
    userChatBox.appendChild(userImg);
    userChatBox.appendChild(userChatArea);
    chatContainer.appendChild(userChatBox);
    
    // Scroll to bottom
    chatContainer.scrollTo({
        top: chatContainer.scrollHeight,
        behavior: "smooth"
    });
}

// Create AI chat box
function createAIChatBox() {
    const aiChatBox = document.createElement("div");
    aiChatBox.className = "ai-chat-box";
    
    const aiImg = document.createElement("img");
    aiImg.src = "images/robot_icon.png";
    aiImg.alt = "AI";
    aiImg.id = "aiImage";
    aiImg.width = "13%";
    
    const aiChatArea = document.createElement("div");
    aiChatArea.className = "ai-chat-area";
    aiChatArea.innerHTML = '<div class="loading">Thinking...</div>';
    
    aiChatBox.appendChild(aiImg);
    aiChatBox.appendChild(aiChatArea);
    chatContainer.appendChild(aiChatBox);
    
    // Scroll to bottom
    chatContainer.scrollTo({
        top: chatContainer.scrollHeight,
        behavior: "smooth"
    });
    
    return aiChatBox;
}

// Generate AI response
async function generateResponse(aiChatBox) {
    let text = aiChatBox.querySelector(".ai-chat-area");

    try {
        let response = await fetch(Api_url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                message: user.message, // make sure `user.message` exists
                file: user.file || null
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        let data = await response.json();
        console.log("API Response:", data); // Debug log
        
        let apiResponse = "";
        
        // Handle different possible response formats
        if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
            apiResponse = data.candidates[0].content.parts[0].text;
        } else if (data.content && data.content.parts && data.content.parts[0]?.text) {
            apiResponse = data.content.parts[0].text;
        } else if (data.text) {
            apiResponse = data.text;
        } else if (data.message) {
            apiResponse = data.message;
        } else if (data.error) {
            throw new Error(data.error);
        } else {
            console.error("Unexpected API response format:", data);
            throw new Error("Unexpected response format from API");
        }

        apiResponse = apiResponse.replace(/\*\*(.*?)\*\*/g, "$1").trim();
        let htmlResponse = marked.parse(apiResponse);

        text.innerHTML = htmlResponse;
    } catch (err) {
        console.error("API Error:", err);
        text.innerHTML = `Sorry, I encountered an error: ${err.message}. Please try again.`;
    } finally {
        chatContainer.scrollTo({
            top: chatContainer.scrollHeight,
            behavior: "smooth"
        });
        imagePreview.src = `images/img.svg`;
        imagePreview.classList.remove("choose");
        user.file = null;
    }
}
