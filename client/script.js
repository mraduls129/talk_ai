import bot from './assets/bot.svg'
import user from './assets/user.svg'

const form = document.querySelector('form')
const chatContainer = document.querySelector('#chat_container')
const connectBtn = document.querySelector(".connect");
const textareabox = document.querySelector('textarea');
let loadInterval
let  bulbCharacteristic;
let discoInterval;

function loader(element) {
    element.textContent = ''

    loadInterval = setInterval(() => {
        // Update the text content of the loading indicator
        element.textContent += '.';

        // If the loading indicator has reached three dots, reset it
        if (element.textContent === '....') {
            element.textContent = '';
        }
    }, 300);
}

function typeText(element, text) {
    let index = 0

    let interval = setInterval(() => {
        if (index < text.length) {
            element.innerHTML += text.charAt(index)
            index++
        } else {
            clearInterval(interval)
        }
    }, 20)
}

function generateUniqueId() {
    const timestamp = Date.now();
    const randomNumber = Math.random();
    const hexadecimalString = randomNumber.toString(16);

    return `id-${timestamp}-${hexadecimalString}`;
}

function chatStripe(isAi, value, uniqueId) {
    return (
        `
        <div class="wrapper ${isAi && 'ai'}">
            <div class="chat">
                <div class="profile">
                    <img 
                      src=${isAi ? bot : user} 
                      alt="${isAi ? 'bot' : 'user'}" 
                    />
                </div>
                <div class="message" id=${uniqueId}>${value}</div>
            </div>
        </div>
    `
    )
}

const handleSubmit = async (e) => {
    e.preventDefault()

    const data = new FormData(form)
    // user's chatstripe
    chatContainer.innerHTML += chatStripe(false, data.get('prompt'));

    // to clear the textarea input 
    form.reset()
    textareabox.innerHTML = ''
    // bot's chatstripe
    const uniqueId = generateUniqueId()
    chatContainer.innerHTML += chatStripe(true, " ", uniqueId)

    // to focus scroll to the bottom 
    chatContainer.scrollTop = chatContainer.scrollHeight;

    // specific message div 
    const messageDiv = document.getElementById(uniqueId)

    // messageDiv.innerHTML = "..."
    loader(messageDiv)

    const response = await fetch('https://chatgpt-js-codex.onrender.com/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            prompt: data.get('prompt')
        })
    })

    clearInterval(loadInterval)
    messageDiv.innerHTML = " "

    if (response.ok) {
        const data = await response.json();
        if (data.bot.trim().includes('turn on')) {
            setRandomColor();
        } else if (data.bot.trim().includes('turn off')) {
            powerOff();
        } else if (findColor(data.bot.trim())) {
           let obj = getRGB(findColor(data.bot.trim()));
           setColor(obj.r , obj.g, obj.b);
        } else if (data.bot.trim().includes('go party')) {
            DiscoEffect();
            //playAudio(partyAudio);
            var audio = new Audio('party.mp3');
            audio.play();
        } else {
            //setRandomColor();
            console.log('no mapping found!!!!');
        }
        const parsedData = data.bot.trim() // trims any trailing spaces/'\n' 

        typeText(messageDiv, parsedData)
    } else {
        const err = await response.text()

        messageDiv.innerHTML = "Something went wrong"
        alert(err)
    }
}

form.addEventListener('submit', handleSubmit)
form.addEventListener('keyup', (e) => {
    if (e.keyCode === 13) {
        handleSubmit(e)
    }
})


connectBtn.addEventListener("click",() => {
    connect(); 
});

function connect (){
    navigator.bluetooth.requestDevice({
      filters: [{ services: [0xffe5] }]
    })
    .then(device => {
      return device.gatt.connect();
    })
    .then(server => {
      return server.getPrimaryService(0xffe5);
    })
    .then(service => {
      return service.getCharacteristic(0xffe9);
    })
    .then(characteristic => {
      bulbCharacteristic =characteristic;
      setRandomColor();
    })
    .catch(error => {
       console.error('Connection failed!', error);
    });
  }

  function setColor(red, green, blue) {
    let data = new Uint8Array([0x56, red, green, blue, 0x00, 0xf0, 0xaa]);
    return bulbCharacteristic?.writeValue(data)
    .catch(err => console.log('Error when writing value! ', err));
}

function setRandomColor(){
    let r=Math.round(Math.random()*256);
    let g=Math.round(Math.random()*256);
    let b=Math.round(Math.random()*256);
    return setColor(r,g,b)
    .then(() => console.log("color is set to " +r , g , b));
}

function DiscoEffect(){
    discoInterval = setInterval(() => setRandomColor() , 10 );
   setTimeout(() => clearInterval(discoInterval),10000)
}

function powerOff() {
    let data = new Uint8Array([0x56, 0, 0, 0, 0x00, 0xf0, 0xaa]);
    return bulbCharacteristic?.writeValue(data)
        .catch(err => console.log('Error when switching off! ', err))
        .then(() => {console.log('turned of')});
}

function getRGB(colorName) {
    const colors = {
        'red': {r: 255, g: 0, b: 0},
        'orange': {r: 255, g: 128, b: 0},
        'yellow': {r: 255, g: 255, b: 0},
        'green': {r: 0, g: 255, b: 0},
        'blue': {r: 0, g: 0, b: 255},
        'indigo': {r: 75, g: 0, b: 130},
        'violet': {r: 238, g: 130, b: 238},
        'pink': { r:255 , g:192, b:203 }
    };

    return colors[colorName.toLowerCase()];
}

function findColor(str) {
    const colorNames = ['red', 'orange', 'yellow', 'green', 'blue', 'indigo', 'violet' , 'pink'];
    const regex = new RegExp('\\b(' + colorNames.join('|') + ')\\b', 'i');
    const match = str.match(regex);
    return match ? match[0] : null;
}


let isListening = false;
let recognition;
// let transcript = '';

// Check if the browser supports the Web Speech API
if (!('webkitSpeechRecognition' in window)) {
    alert('Your browser does not support the Web Speech API. Please try using Google Chrome.');
  } else {
     recognition = new webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
  
    recognition.onstart = function() {
      console.log('Speech recognition started');
      //document.getElementById('status').textContent = 'Microphone is on';

    };
  
    recognition.onresult = function(event) {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          transcript += event.results[i][0].transcript;
        }
      }
      console.log('You said: ', transcript);
      textareabox.innerHTML = transcript;
      // Here you can send 'transcript' to the ChatGPT API
    };
  
    recognition.onerror = function(event) {
      console.log('Speech recognition error: ', event.error);
    };
  
    recognition.onend = function() {
        console.log('Speech recognition ended, restarting...');
        if (isListening) {
          recognition.start();
        } else {
          //document.getElementById('status').textContent = 'Microphone is off';
        }
    };
  
    //recognition.start();
  }
  
  document.getElementById('toggle-mic').addEventListener('click', function() {
    isListening = !isListening;
    if (isListening) {
      recognition.start();
     // this.textContent = 'Turn off microphone';
    } else {
      recognition.stop();
     // this.textContent = 'Turn on microphone';
    }
  });

  let mic = document.querySelector('#toggle-mic');
  mic.addEventListener('click' , (function() {
    mic.classList.toggle("active");
  }));
  