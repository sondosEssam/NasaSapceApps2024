// todaysCard.js
import { GoogleGenerativeAI } from "@google/generative-ai";

class TodaysCard {
  constructor() {
    this.setupModal();
    this.setupEventListeners();
    this.cachedResponse = null;
    this.lastFetchTime = null;
    this.CACHE_DURATION = 1000 * 60 * 60; // 1 hour cache
    
    // Initialize Gemini
    this.genAI = new GoogleGenerativeAI('AIzaSyBu2db11cF-XkV7QbRDsfgqyXqpQTwDe_M');
    this.model = this.genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 100,
      }
    });
  }

  setupModal() {
    const modalHTML = `
      <div class="modal-overlay" id="cardModal">
        <div class="modal">
          <button class="modal-close" id="closeModal">&times;</button>
          <h2>Today's Space Insight</h2>
          <div class="card-content">
            <div id="loadingSpinner" class="loading-spinner"></div>
            <p id="factText" class="fact-text"></p>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
  }

  setupEventListeners() {
    const todaysCardLink = document.querySelector('a[href="todaysCard"]');
    const modal = document.getElementById('cardModal');
    const closeButton = document.getElementById('closeModal');

    todaysCardLink.addEventListener('click', (e) => {
      e.preventDefault();
      this.showModal();
      this.getFact();
    });

    closeButton.addEventListener('click', () => {
      this.hideModal();
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.hideModal();
      }
    });
  }

  showModal() {
    const modal = document.getElementById('cardModal');
    modal.style.display = 'flex';
  }

  hideModal() {
    const modal = document.getElementById('cardModal');
    modal.style.display = 'none';
  }

  async getFact() {
    if (this.shouldUseCachedResponse()) {
      this.displayFact(this.cachedResponse);
      return;
    }

    const loadingSpinner = document.getElementById('loadingSpinner');
    const factText = document.getElementById('factText');
    
    loadingSpinner.style.display = 'block';
    factText.style.display = 'none';

    try {
      const result = await this.model.generateContent([
        "Give me a brief, interesting paragraph about daily updated information about space events or Current astronomical phenomena or Interesting space facts. Keep it under 100 words and make it engaging. Don't include any introductory phrases like 'Did you know' or 'Here's a fact'."
      ]);

      const fact = result.response.text();
      
      this.cachedResponse = fact;
      this.lastFetchTime = Date.now();
      this.displayFact(fact);
    } catch (error) {
      console.error('Error fetching fact:', error);
      this.displayFact('Unable to fetch space fact. Please try again later.');
    } finally {
      loadingSpinner.style.display = 'none';
      factText.style.display = 'block';
    }
  }

  shouldUseCachedResponse() {
    return this.cachedResponse && 
           this.lastFetchTime && 
           (Date.now() - this.lastFetchTime < this.CACHE_DURATION);
  }

  displayFact(fact) {
    const factText = document.getElementById('factText');
    factText.textContent = fact;
  }
}

export default TodaysCard;
