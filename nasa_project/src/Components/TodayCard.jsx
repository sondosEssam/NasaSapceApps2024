import React, { useState, useEffect } from 'react';

const TodaysCard = ({ isOpen, onClose }) => {
  const [fact, setFact] = useState('');
  const [loading, setLoading] = useState(false);
  const [cachedResponse, setCachedResponse] = useState(null);
  const [lastFetchTime, setLastFetchTime] = useState(null);

  const CACHE_DURATION = 1000 * 60 * 60; // 1 hour cache

  // Initialize Google Generative AI instance and model
  const initializeGemini = () => {
    // Assuming `GoogleGenerativeAI` is available globally, e.g., through a script tag
    const genAI = new window.GoogleGenerativeAI('AIzaSyBu2db11cF-XkV7QbRDsfgqyXqpQTwDe_M');
    return genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 100,
      },
    });
  };

  // Function to fetch fact using Gemini model
  const fetchFact = async () => {
    if (cachedResponse && lastFetchTime && (Date.now() - lastFetchTime < CACHE_DURATION)) {
      setFact(cachedResponse);
      return;
    }

    setLoading(true);

    try {
      const model = initializeGemini();
      const result = await model.generateContent([
        "Give me a brief, interesting paragraph about daily updated information about space events or current astronomical phenomena or interesting space facts. Keep it under 100 words and make it engaging."
      ]);

      const newFact = result.response.text(); // Assuming API returns `text()` method with the fact

      setFact(newFact);
      setCachedResponse(newFact);
      setLastFetchTime(Date.now());
    } catch (error) {
      console.error('Error fetching fact:', error);
      setFact('Unable to fetch space fact. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch the fact when the modal opens
  useEffect(() => {
    if (isOpen) {
      fetchFact();
    }
  }, [isOpen]);

  // Return null if the modal is not open
  if (!isOpen) {
    return null;
  }

  return (
    <>
      <div className={`modal-overlay ${isOpen ? 'active' : ''}`} onClick={onClose}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <button className="modal-close" onClick={onClose}>&times;</button>
          <h2>Today's Space Insight</h2>
          <div className="card-content">
            {loading ? (
              <div id="loadingSpinner" className="loading-spinner">Loading...</div>
            ) : (
              <p id="factText" className="fact-text">{fact}</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default TodaysCard;
