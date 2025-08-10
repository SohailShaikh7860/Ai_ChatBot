

let prompt = document.querySelector("#prompt");
let chatContainer = document.querySelector(".chat-container");

const apiKey = "AIzaSyDPbeml2DJa0cH0WF6TJSG6k0c_rANn1ZI";
const Api_url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

let user ={
    data:null,
}

function handleChatResponse(message){
    user.data = message;
   let html = `  <img src="images/user_icon.png" alt="" id="userImage" width="50">
             <div class="user-chat-area">
                ${user.data}
               </div>`
               prompt.value = "";

             let userChatBox = createChatBox(html, "user-chat-box")
             chatContainer.append(userChatBox);

             setTimeout(()=>{
                  let AiHtml = ` <img src="images/robot_icon.png" alt="" id="aiImage" width="50">
             <div class="ai-chat-area">
                 <img src="images/Youtube_loading_symbol_1_(wobbly).gif" alt="" class="loading" width="50px">
             </div>
             
             `

             let aiChatBox = createChatBox(AiHtml,"ai-chat-box")
             chatContainer.append(aiChatBox);
             generateResponse(aiChatBox);
             },600)
}

function createChatBox(html,classes){
    let div = document.createElement("div");
    div.innerHTML = html;
    div.classList.add(classes);
    return div;
}

async function generateResponse(aiChatBox){

  let text = aiChatBox.querySelector(".ai-chat-area")

   let requestOption = {
        method:"POST",
        headers:{'Content-Type': 'application/json'},
        body:JSON.stringify({
            "contents": [
          {
        "parts": [
          {
            "text": user.data
          }
        ]
      }
     ]
        })
    }

    try{
        let response = await fetch(Api_url, requestOption);
        let data = await response.json();
        let apiResponse = data.candidates[0].content.parts[0].text.replace(/\*\*(.*?)\*\*/g,"$1").trim();
        text.innerHTML = apiResponse;
        // console.log(apiResponse);
        
    }catch(err){
         console.log("There was an error: ",err);
         
    }
}

prompt.addEventListener("keydown",(e)=>{
    if(e.key == "Enter"){
        handleChatResponse(prompt.value);

    }
    console.log(e);
    
})