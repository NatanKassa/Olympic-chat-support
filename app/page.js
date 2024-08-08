'use client'

import { useState } from 'react';
import { Box, Button, Stack, TextField, Typography } from '@mui/material';

const translations = {
  en: {
    header: "Chat with Olympics Assistant",
    selectLanguage: "Select Language:",
    placeholder: "Ask your question...",
    sendButton: "Send",
    error: "I'm sorry, but I encountered an error. Please try again later.",
    dislikeButton: "Dislike",
  },
  fr: {
    header: "Discutez avec l'assistant des Jeux Olympiques",
    selectLanguage: "Choisissez la langue :",
    placeholder: "Posez votre question...",
    sendButton: "Envoyer",
    error: "Je suis désolé, mais j'ai rencontré une erreur. Veuillez réessayer plus tard.",
    dislikeButton: "Je n'aime pas",
  },
  es: {
    header: "Chatea con el asistente de los Juegos Olímpicos",
    selectLanguage: "Selecciona el idioma:",
    placeholder: "Haz tu pregunta...",
    sendButton: "Enviar",
    error: "Lo siento, pero encontré un error. Por favor, inténtalo de nuevo más tarde.",
    dislikeButton: "No me gusta",
  }
};

export default function Home() {
  // States for each language's messages
  const [messagesEn, setMessagesEn] = useState([
    {
      role: 'assistant',
      content: translations.en.error,
    },
  ]);
  const [messagesFr, setMessagesFr] = useState([
    {
      role: 'assistant',
      content: translations.fr.error,
    },
  ]);
  const [messagesEs, setMessagesEs] = useState([
    {
      role: 'assistant',
      content: translations.es.error,
    },
  ]);

  const [message, setMessage] = useState('');
  const [regenerateIndex, setRegenerateIndex] = useState(null);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [language, setLanguage] = useState('en');

  const sendMessage = async (regenerate = false) => {
    const messageToSend = regenerate
      ? getMessages().find((_, index) => index === regenerateIndex)?.content
      : message;

    if (!messageToSend?.trim()) return;

    const newMessages = [...getMessages()];
    if (regenerate) {
      newMessages[messagesEn.length - 1] = { ...newMessages[regenerateIndex], content: '' };
    } else {
      newMessages.push({ role: 'user', content: messageToSend });
      newMessages.push({ role: 'assistant', content: '' });
    }

    updateMessages(newMessages);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: newMessages, regenerate, language }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let newContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value, { stream: true });
        newContent += text.replace(/###\s*|\*\*.*?\*\*|\*\*/g, '');

        updateMessages((prevMessages) => {
          const updatedMessages = [...prevMessages];
          if (regenerate) {
            updatedMessages[updatedMessages.length - 1] = { ...updatedMessages[regenerateIndex], content: newContent };
          } else {
            updatedMessages[updatedMessages.length - 1] = { role: 'assistant', content: newContent };
          }
          return updatedMessages;
        });
      }
    } catch (error) {
      console.error('Error:', error);
      updateMessages((prevMessages) => [
        ...prevMessages,
        { role: 'assistant', content: translations[language].error },
      ]);
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleDislike = (index) => {
    setRegenerateIndex(index);
    setIsRegenerating(true);
    sendMessage(true);
  };

  const handleSendMessage = () => {
    if (message.trim()) {
      if (isRegenerating) {
        setIsRegenerating(false);
      }
      sendMessage();
      setMessage('');
    }
  };

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    // Reset messages when changing language
    switch (lang) {
      case 'fr': setMessagesFr([...messagesFr]); break;
      case 'es': setMessagesEs([...messagesEs]); break;
      default: setMessagesEn([...messagesEn]); break;
    }
  };

  const getMessages = () => {
    switch (language) {
      case 'fr': return messagesFr;
      case 'es': return messagesEs;
      default: return messagesEn;
    }
  };

  const updateMessages = (newMessages) => {
    switch (language) {
      case 'fr': setMessagesFr(newMessages); break;
      case 'es': setMessagesEs(newMessages); break;
      default: setMessagesEn(newMessages); break;
    }
  };

  return (
    <Box
      width="100vw"
      height="100vh"
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      bgcolor="#0081C8"
      p={3}
    >
      <Box
        width="100%"
        display="flex"
        justifyContent="center"
        p={2}
      >
        <Box
          component="img"
          src="/olympics.png"
          alt="Olympics"
          sx={{
            maxWidth: { xs: '100px', sm: '150px', md: '200px' }, // Adjust sizes as needed
            maxHeight: { xs: '100px', sm: '150px', md: '200px' },
            width: 'auto',
            height: 'auto',
          }}
        />
      </Box>
      <Stack
        direction="column"
        width={{ xs: '95vw', sm: '85vw', md: '70vw' }}
        height="80vh"
        borderRadius={3}
        boxShadow={6}
        overflow="hidden"
        bgcolor="white"
      >
        {/* Header Section */}
        <Box
          bgcolor="#EE334E"
          p={2}
          borderBottom="1px solid #ccc"
          display="flex"
          justifyContent="center"
          alignItems="center"
        >
          <Typography variant="h5" fontWeight="bold" color="#333">
            {translations[language].header}
          </Typography>
        </Box>

        {/* Language Selector */}
        <Box p={2} bgcolor="#f5f5f5" borderBottom="1px solid #ccc">
          <Typography variant="body1" fontWeight="bold">{translations[language].selectLanguage}</Typography>
          <Stack direction="row" spacing={1}>
            <Button
              variant={language === 'en' ? 'contained' : 'outlined'}
              onClick={() => handleLanguageChange('en')}
              sx={{ bgcolor: language === 'en' ? '#FCB131' : 'transparent', color: language === 'en' ? 'black' : '#FCB131' }}
            >
              English
            </Button>
            <Button
              variant={language === 'fr' ? 'contained' : 'outlined'}
              onClick={() => handleLanguageChange('fr')}
              sx={{ bgcolor: language === 'fr' ? '#FCB131' : 'transparent', color: language === 'fr' ? 'black' : '#FCB131' }}
            >
              French
            </Button>
            <Button
              variant={language === 'es' ? 'contained' : 'outlined'}
              onClick={() => handleLanguageChange('es')}
              sx={{ bgcolor: language === 'es' ? '#FCB131' : 'transparent', color: language === 'es' ? 'black' : '#FCB131' }}
            >
              Spanish
            </Button>
          </Stack>
        </Box>

        {/* Messages Section */}
        <Stack
          direction="column"
          flexGrow={1}
          overflow="auto"
          p={2}
          bgcolor="#fafafa"
        >
          {getMessages().map((msg, index) => (
            <Box
              key={index}
              display="flex"
              flexDirection="column"
              alignItems={msg.role === 'assistant' ? 'flex-start' : 'flex-end'}
              p={1}
            >
              <Box
                bgcolor={msg.role === 'assistant' ? '#009147' : '#37ad70'}
                color="white"
                borderRadius={6}
                p={2}
                maxWidth="80%"
                sx={{ wordBreak: 'break-word' }}
              >
                {msg.content}
              </Box>
              {msg.role === 'assistant' && index === getMessages().length - 1 && (
                <Box mt={1} display="flex" justifyContent="center">
                  <Button
                    variant="outlined"
                    onClick={() => handleDislike(index)}
                    sx={{
                      borderColor: '#FCB131',
                      color: '#FCB131',
                      '&:hover': {
                        borderColor: '#f9a825',
                        color: '#f9a825',
                      },
                    }}
                  >
                    {translations[language].dislikeButton}
                  </Button>
                </Box>
              )}
            </Box>
          ))}
        </Stack>
        {/* Input Section */}
        <Stack direction="row" spacing={1} p={1} alignItems="center">
          <TextField
            label={translations[language].placeholder}
            fullWidth
            variant="outlined"
            size="small"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            sx={{
              '& .MuiInputLabel-root': {
                color: 'black',
              },
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: 'black',
                },
                '&:hover fieldset': {
                  borderColor: 'black',
                },
                '&.Mui-focused fieldset': {
                  borderColor: 'black',
                },
              },
            }}
          />
          <Button
            variant="contained"
            onClick={handleSendMessage}
            sx={{
              bgcolor: '#FCB131',
              color: 'black',
              '&:hover': {
                bgcolor: '#f9a825',
              },
            }}
          >
            {translations[language].sendButton}
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}

