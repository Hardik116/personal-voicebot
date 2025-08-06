class ClaudeVoiceBot {
  constructor() {
    this.synthesis = window.speechSynthesis;
    this.apiBaseUrl = window.location.origin;

    this.initElements();
    this.initEventListeners();
  }

  initElements() {
    this.clearBtn = document.getElementById('clearBtn');
    this.sendBtn = document.getElementById('sendBtn');
    this.stopVoiceBtn = document.getElementById('stopVoiceBtn');
    this.status = document.getElementById('status');
    this.chatArea = document.getElementById('chatArea');
    this.textInput = document.getElementById('textInput');
  }

  initEventListeners() {
    this.clearBtn.addEventListener('click', () => this.clearChat());
    this.sendBtn.addEventListener('click', () => this.sendTextMessage());
    this.stopVoiceBtn.addEventListener('click', () => this.synthesis.cancel());

    this.textInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.sendTextMessage();
      }
    });
  }

  sendTextMessage() {
    const message = this.textInput.value.trim();
    if (message) {
      this.addMessage(message, 'user');
      this.processQuery(message);
      this.textInput.value = '';
    }
  }

  clearChat() {
    this.chatArea.innerHTML = `
      <div class="message bot-message">
        Hi! I'm Hardik, feel free to ask anyting about me.
      </div>
    `;
  }

  updateStatus(message, type) {
    this.status.textContent = message;
    this.status.className = `status ${type}`;
  }

  addMessage(text, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    messageDiv.textContent = text;
    this.chatArea.appendChild(messageDiv);
    this.chatArea.scrollTop = this.chatArea.scrollHeight;
  }

  async processQuery(query) {
    this.updateStatus('🤔 Processing your question...', 'processing');

    try {
      const response = await fetch(`${this.apiBaseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });

      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      this.addMessage(data.response, 'bot');
      this.speakResponse(data.response);
      this.updateStatus('✅ Response ready! Ask another question.', 'ready');
    } catch (error) {
      console.error('Error processing query:', error);
      const errorResponse = "Sorry, I'm having trouble responding right now.";
      this.addMessage(errorResponse, 'bot');
      this.speakResponse(errorResponse);
      this.updateStatus('⚠️ Error occurred. Please try again.', 'error');
    }
  }

  speakResponse(text) {
    this.synthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;

    // Load voices (may be empty initially)
    let voices = this.synthesis.getVoices();

    // Prefer Male English voices
    const preferredVoice = voices.find(v =>
        v.name.toLowerCase().includes('google us english male')
    ) || voices.find(v =>
        v.name.toLowerCase().includes('google uk english male')
    ) || voices.find(v =>
        v.lang === 'en-US' && v.name.toLowerCase().includes('male')
    ) || voices.find(v =>
        v.lang === 'en-US'
    ) || voices.find(v =>
        v.lang.startsWith('en')
    ) || voices[0]; // fallback

    if (preferredVoice) {
        utterance.voice = preferredVoice;
        console.log("Using voice:", preferredVoice.name);
    } else {
        console.warn("No preferred voice found, using default.");
    }

    this.synthesis.speak(utterance);
}

}

let voiceBot;
window.addEventListener('load', () => {
  voiceBot = new ClaudeVoiceBot();
});

function askQuestion(question) {
  if (voiceBot) {
    voiceBot.addMessage(question, 'user');
    voiceBot.processQuery(question);
  }
}

if (speechSynthesis.onvoiceschanged !== undefined) {
  speechSynthesis.onvoiceschanged = () => {
    console.log('Voices loaded:', speechSynthesis.getVoices().length);
  };
}
