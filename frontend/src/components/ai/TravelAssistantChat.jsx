import React, { useState, useRef, useEffect } from 'react';
import { useFetchAllToursQuery } from '../../redux/apis/tourApi';
import './TravelAssistantChat.css';

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

const SYSTEM_PROMPT = `You are a helpful travel assistant. The user will tell you what kind of tour they are interested in. You will be given a list of available tours (with name, description, url, price, duration, and other details). Suggest the best 2-3 itineraries for the user, explaining why you chose them, and include the tour name, a short description, and the URL for each. If none are a good fit, say so. Format your response with clear tour names, short descriptions, and clickable URLs. Use a consistent format for each tour: Name, Description, Price, URL. Use markdown for links if you want.`;

function getTourUrl(tour) {
  return `${window.location.origin}/tours/${tour._id}`;
}

function formatToursForLLM(tours) {
  return tours.map(t => `Name: ${t.name}\nDescription: ${t.summary || t.description}\nDifficulty: ${t.difficulty}\nDuration: ${t.duration} days\nPrice: $${t.price}\nLocation: ${t.startLocation?.description}\nURL: ${getTourUrl(t)}`).join('\n---\n');
}

const FallbackTourList = ({ tours }) => (
  <div className="ai-fallback-list">
    <div>Here are some tours you can explore manually:</div>
    <ul>
      {tours.map(t => (
        <li key={t._id}>
          <a href={getTourUrl(t)} target="_blank" rel="noopener noreferrer">{t.name}</a> - {t.summary || t.description}
        </li>
      ))}
    </ul>
  </div>
);

// --- Casual query detection ---
function isCasualQuery(text) {
  const casualPatterns = [
    /^\s*hi\s*$/i,
    /^\s*hello\s*$/i,
    /^\s*hey\s*$/i,
    /^\s*yo\s*$/i,
    /^\s*good (morning|afternoon|evening|day)\s*$/i,
    /^\s*how are you\??\s*$/i,
    /^\s*what'?s up\??\s*$/i,
    /^\s*how'?s it going\??\s*$/i,
    /^\s*who are you\??\s*$/i,
    /^\s*thank(s| you)\s*$/i,
    /^\s*bye\s*$/i,
    /^\s*see you\s*$/i,
    /^\s*goodbye\s*$/i,
    /^\s*are you (there|real)\??\s*$/i,
    /^\s*help\s*$/i
  ];
  return casualPatterns.some((re) => re.test(text));
}

function getCasualResponse(text) {
  const t = text.trim().toLowerCase();
  if (/^hi$|^hello$|^hey$|^yo$/.test(t)) return "Hello! 👋 How can I help you plan your next adventure?";
  if (/good morning|good afternoon|good evening|good day/.test(t)) return "Good day! How can I assist with your travel plans?";
  if (/how are you/.test(t)) return "I'm great, thank you! How can I help you with your travel plans today?";
  if (/what'?s up|how'?s it going/.test(t)) return "I'm here to help you find the perfect tour! What are you interested in?";
  if (/who are you/.test(t)) return "I'm your AI Travel Assistant, here to help you discover amazing tours and itineraries.";
  if (/thank(s| you)/.test(t)) return "You're welcome! If you have more questions, just ask.";
  if (/bye|see you|goodbye/.test(t)) return "Goodbye! Have a wonderful journey ahead.";
  if (/are you (there|real)/.test(t)) return "I'm here and ready to help you with your travel needs!";
  if (/help/.test(t)) return "You can ask me about tours, destinations, or travel tips. What are you looking for?";
  return "How can I help you with your travel plans?";
}

// --- TourCardRenderer: renders tour suggestions as cards ---
function TourCardRenderer({ tours }) {
  return (
    <div className="ai-tour-cards">
      {tours.map((tour, idx) => (
        <div className="ai-tour-card" key={idx}>
          <div className="ai-tour-card-title">{tour.name}</div>
          {tour.description && <div className="ai-tour-card-desc">{tour.description}</div>}
          <div className="ai-tour-card-meta">
            {tour.price && <span className="ai-tour-card-price">${tour.price}</span>}
            {tour.url && (
              <a href={tour.url} target="_blank" rel="noopener noreferrer" className="ai-tour-card-link">View Details</a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// --- MessageRenderer: formats AI response attractively ---
function MessageRenderer({ text }) {
  // Remove leading/trailing ---
  let cleanText = text.trim().replace(/^[-]+|[-]+$/g, '').trim();

  // Split into blocks by double newlines or by markdown link pattern
  let blocks = cleanText.split(/\n\s*\n/).filter(Boolean);

  // Try to extract tours from markdown or plain formats
  const tours = [];
  let summary = '';
  for (let block of blocks) {
    // Remove asterisks and extra whitespace
    block = block.replace(/\*\*/g, '').replace(/^\*+|\*+$/g, '').trim();
    // Try markdown link
    const urlMatch = block.match(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/);
    // Try plain URL
    const urlPlainMatch = block.match(/URL:\s*(https?:\/\/[^\s)]+)/i);
    // Name
    let name = block.match(/^(?:Name:)?\s*([A-Z][A-Za-z0-9\s\-']{3,})/i)?.[1]?.trim();
    // Description
    let description = block.match(/Description:\s*([\s\S]*?)(?=Price:|URL:|\[|$)/i)?.[1]?.replace(/\*\*/g, '').trim();
    // Price
    let price = block.match(/Price:\s*\$?(\d+[\d,.]*)/i)?.[1]?.trim();
    // URL
    let url = urlMatch ? urlMatch[2] : (urlPlainMatch ? urlPlainMatch[1] : null);
    // If block contains a tour
    if (name && url) {
      tours.push({ name, description, price, url });
    } else if (block && !block.toLowerCase().startsWith('name:')) {
      // If not a tour, treat as summary/conclusion
      summary += block + '\n\n';
    }
  }
  summary = summary.trim();

  // If we have at least one valid tour, render as cards with summary below
  if (tours.length > 0) {
    return (
      <>
        <TourCardRenderer tours={tours} />
        {summary && <div className="ai-message-summary">{summary}</div>}
      </>
    );
  }

  // Otherwise, fallback to markdown-like rendering
  const lines = text.split(/\r?\n/);
  const urlRegex = /(https?:\/\/[^\s)]+)/g;
  const tourNameRegex = /^\s*(\d+\.|[-*])?\s*([A-Z][A-Za-z0-9\s\-']{3,}):/;

  return (
    <div className="ai-message-rendered">
      {lines.map((line, idx) => {
        // Render lists
        if (/^\s*[-*]\s+/.test(line)) {
          return (
            <li key={idx} className="ai-message-list-item">
              {renderLine(line.replace(/^\s*[-*]\s+/, ''))}
            </li>
          );
        }
        // Render numbered lists
        if (/^\s*\d+\.\s+/.test(line)) {
          return (
            <li key={idx} className="ai-message-list-item">
              {renderLine(line.replace(/^\s*\d+\.\s+/, ''))}
            </li>
          );
        }
        // Render tour name as bold if matches
        const nameMatch = line.match(tourNameRegex);
        if (nameMatch) {
          return (
            <div key={idx} className="ai-message-tour-name">
              <strong>{nameMatch[2]}</strong>{line.slice(nameMatch[0].length - 1)}
            </div>
          );
        }
        // Render normal line
        return <div key={idx}>{renderLine(line)}</div>;
      })}
    </div>
  );

  // Helper to render URLs as clickable links
  function renderLine(line) {
    const parts = [];
    let lastIdx = 0;
    let match;
    let idx = 0;
    while ((match = urlRegex.exec(line)) !== null) {
      if (match.index > lastIdx) {
        parts.push(line.slice(lastIdx, match.index));
      }
      parts.push(
        <a
          key={`url-${idx}`}
          href={match[0]}
          target="_blank"
          rel="noopener noreferrer"
          className="ai-message-link"
        >
          {match[0]}
        </a>
      );
      lastIdx = match.index + match[0].length;
      idx++;
    }
    if (lastIdx < line.length) {
      parts.push(line.slice(lastIdx));
    }
    return parts;
  }
}

const TravelAssistantChat = () => {
  const [messages, setMessages] = useState([
    { sender: 'ai', text: 'Hi! I am your AI Travel Assistant. What type of tour are you interested in?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showFallback, setShowFallback] = useState(false);
  const messagesEndRef = useRef(null);

  // Fetch all tours once user asks a question
  const { data: toursData, isLoading: toursLoading, error: toursError } = useFetchAllToursQuery();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    setMessages(msgs => [...msgs, { sender: 'user', text: input }]);
    setInput('');
    setError(null);
    setShowFallback(false);

    // Handle casual queries instantly
    if (isCasualQuery(input)) {
      setMessages(msgs => [...msgs, { sender: 'ai', text: getCasualResponse(input) }]);
      return;
    }

    // Wait for tours to load
    if (toursLoading) {
      setMessages(msgs => [...msgs, { sender: 'ai', text: 'Loading available itineraries...' }]);
      return;
    }
    if (toursError || !toursData?.data?.tours) {
      setMessages(msgs => [...msgs, { sender: 'ai', text: 'Sorry, I could not fetch the available tours right now.' }]);
      return;
    }

    setLoading(true);
    try {
      const tours = toursData.data.tours;
      const userQuery = input;
      const llmPrompt = [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `User query: ${userQuery}\n\nAvailable tours:\n${formatToursForLLM(tours)}` }
      ];
      const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: llmPrompt,
          max_tokens: 500,
          temperature: 0.7,
        }),
      });
      if (!response.ok) throw new Error('OpenAI API error');
      const data = await response.json();
      const llmText = data.choices?.[0]?.message?.content?.trim();
      if (!llmText || llmText.toLowerCase().includes('not sure') || llmText.length < 20) {
        setShowFallback(true);
        setMessages(msgs => [...msgs, { sender: 'ai', text: 'I could not confidently suggest a tour. Please browse our itineraries below.' }]);
      } else {
        setMessages(msgs => [...msgs, { sender: 'ai', text: llmText }]);
      }
    } catch (err) {
      setError('Sorry, there was a problem contacting the AI assistant.');
      setShowFallback(true);
      setMessages(msgs => [...msgs, { sender: 'ai', text: 'Sorry, there was a problem contacting the AI assistant. Please browse our itineraries below.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ai-chat-widget">
      <div className="ai-chat-header">AI Travel Assistant</div>
      <div className="ai-chat-messages">
        {messages.map((msg, idx) => (
          <div key={idx} className={`ai-chat-message ${msg.sender}`}>
            {msg.sender === 'ai' ? <MessageRenderer text={msg.text} /> : msg.text}
          </div>
        ))}
        {loading && <div className="ai-chat-message ai">Thinking...</div>}
        {showFallback && toursData?.data?.tours && (
          <FallbackTourList tours={toursData.data.tours} />
        )}
        <div ref={messagesEndRef} />
      </div>
      <form className="ai-chat-input-row" onSubmit={handleSend}>
        <input
          type="text"
          placeholder="Describe your ideal tour..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
        />
        <button type="submit" disabled={loading || toursLoading}>Send</button>
      </form>
      {error && <div className="ai-chat-error">{error}</div>}
    </div>
  );
};

export default TravelAssistantChat; 