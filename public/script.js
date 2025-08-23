const Api_url = "http://localhost:3000/api/chat";

const chatContainer = document.querySelector(".chat-container");
const promptInput = document.getElementById("prompt");
const submitBtn = document.getElementById("submit");
const imageBtn = document.getElementById("image");
const imagePreview = document.getElementById("imagePreview");
const fileInput = document.querySelector('input[type="file"]');


const user = {
    message: "",
    file: null
};


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


async function handleSubmit() {
    const message = promptInput.value.trim();
    
   
    if (!message && !user.file) {
        alert("Please enter a message or upload an image first!");
        return;
    }

    user.message = message;
    
    createUserChatBox(message);
    
    promptInput.value = "";
    
    const aiChatBox = createAIChatBox();
    
    await generateResponse(aiChatBox);
}


function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const maxSize = 20 * 1024 * 1024;
    if (file.size > maxSize) {
        alert(`File too large! Maximum size is 20MB. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB`);
        return;
    }

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
        
        console.log(`File uploaded: ${file.name} (${(file.size / (1024 * 1024)).toFixed(2)}MB)`);
    };
    
    reader.onerror = function() {
        alert('Error reading file. Please try again.');
    };
    
    reader.readAsDataURL(file);
}


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

    if (user.file && user.file.data) {
        const uploadedImage = document.createElement("img");
        uploadedImage.src = `data:${user.file.mime_type};base64,${user.file.data}`;
        uploadedImage.alt = "Uploaded Image";
        uploadedImage.className = "uploaded-image";
        uploadedImage.style.maxWidth = "100%";
        uploadedImage.style.height = "auto";
        uploadedImage.style.borderRadius = "10px";
        uploadedImage.style.marginBottom = "10px";
        
        userChatArea.appendChild(uploadedImage);
        
        if (message && message.trim()) {
            const messageText = document.createElement("div");
            messageText.textContent = message;
            messageText.style.marginTop = "10px";
            userChatArea.appendChild(messageText);
        }
    } else {
        userChatArea.textContent = message;
    }
    
    userChatBox.appendChild(userImg);
    userChatBox.appendChild(userChatArea);
    chatContainer.appendChild(userChatBox);
    
    chatContainer.scrollTo({
        top: chatContainer.scrollHeight,
        behavior: "smooth"
    });
}


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
    
    chatContainer.scrollTo({
        top: chatContainer.scrollHeight,
        behavior: "smooth"
    });
    
    return aiChatBox;
}


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
        console.log("API Response:", data);
        
        let apiResponse = "";
        
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
