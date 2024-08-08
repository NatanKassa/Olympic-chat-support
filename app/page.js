'use client'

import { useState } from 'react'
import { Box, Button, Stack, TextField, Typography } from '@mui/material';

export default function Home() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! I'm the Olympics support assistant. How can I help you today?",
    },
  ]);
  const [message, setMessage] = useState('');
  const [regenerateIndex, setRegenerateIndex] = useState(null);
  const [isRegenerating, setIsRegenerating] = useState(false); // New state to track regeneration

  const sendMessage = async (regenerate = false) => {
    const messageToSend = regenerate ? messages[regenerateIndex]?.content : message;

    if (!messageToSend?.trim()) return;

    console.log('Sending message:', messageToSend);
    console.log('Regenerate flag:', regenerate);

    // Clear message input if not regenerating
    if (!regenerate) setMessage('');

    // Prepare new messages array
    const newMessages = [...messages];
    if (regenerate) {
      // Replace the content of the message at regenerateIndex
      newMessages[messages.length - 1] = { ...newMessages[regenerateIndex], content: '' };
    } else {
      // Add user message to messages array
      newMessages.push({ role: 'user', content: messageToSend });
      newMessages.push({ role: 'assistant', content: '' });
    }

    // Update messages array with the new messages
    setMessages(newMessages);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: newMessages, regenerate }),
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

        setMessages((prevMessages) => {
          const updatedMessages = [...prevMessages];
          if (regenerate) {
            // Replace the content of the message at regenerateIndex with new content
            updatedMessages[updatedMessages.length - 1] = { ...updatedMessages[regenerateIndex], content: newContent };
          } else {
            // Update the latest assistant message with new content
            updatedMessages[updatedMessages.length - 1] = { role: 'assistant', content: newContent };
          }
          return updatedMessages;
        });
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages((prevMessages) => [
        ...prevMessages,
        { role: 'assistant', content: "I'm sorry, but I encountered an error. Please try again later." },
      ]);
    } finally {
      // Reset the regeneration state
      setIsRegenerating(false);
    }
  };

  const handleDislike = (index) => {
    console.log('Dislike clicked for message index:', index);
    setRegenerateIndex(index);
    setIsRegenerating(true); // Set regeneration state to true
    sendMessage(true); // Call sendMessage with regenerate flag
  };

  const handleSendMessage = () => {
    if (message.trim()) {
      if (isRegenerating) {
        // If currently regenerating, wait until the regeneration is done before sending a new message
        setIsRegenerating(false);
      }
      sendMessage(); // Send the current message
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
            Chat with Olympics Assistant
          </Typography>
        </Box>

        {/* Messages Section */}
        <Stack
          direction="column"
          flexGrow={1}
          overflow="auto"
          p={2}
          bgcolor="#fafafa"
        >
          {messages.map((msg, index) => (
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
              {msg.role === 'assistant' && index === messages.length - 1 && (
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
                    Dislike
                  </Button>
                </Box>
              )}
            </Box>
          ))}
        </Stack>

        {/* Input Section */}
        <Stack direction="row" spacing={1} p={1} alignItems="center">
          <TextField
            label="Ask your question..."
            fullWidth
            variant="outlined"
            size="small"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSendMessage(); // Use handleSendMessage instead
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
            onClick={handleSendMessage} // Use handleSendMessage instead
            sx={{
              bgcolor: '#FCB131',
              color: 'black',
              '&:hover': {
                bgcolor: '#f9a825',
              },
            }}
          >
            Send
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
