'use client'

import { useState } from 'react'
import { Box, Button, Stack, TextField, Typography } from '@mui/material';

export default function Home() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! I'm the Olympics support assistant. How can I help you today?",
    },
  ])
  const [message, setMessage] = useState('')

  const sendMessage = async () => {
    if (!message.trim()) return;  // Don't send empty messages
  
    setMessage('')
    setMessages((messages) => [
      ...messages,
      { role: 'user', content: message },
      { role: 'assistant', content: '' },
    ])
  
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([...messages, { role: 'user', content: message }]),
      })
  
      if (!response.ok) {
        throw new Error('Network response was not ok')
      }
  
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
  
      let newContent = '';
  
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const text = decoder.decode(value, { stream: true })
  
        // Process and clean up the response text
        newContent += text.replace(/###\s*|\*\*.*?\*\*|\*\*/g, ''); // Remove markdown like ###, **Bold Text**, and ** alone

  
        setMessages((messages) => {
          let lastMessage = messages[messages.length - 1]
          let otherMessages = messages.slice(0, messages.length - 1)
          return [
            ...otherMessages,
            { ...lastMessage, content: newContent },
          ]
        })
      }
    } catch (error) {
      console.error('Error:', error)
      setMessages((messages) => [
        ...messages,
        { role: 'assistant', content: "I'm sorry, but I encountered an error. Please try again later." },
      ])
    }
  }
  

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
          display="flex"  // Enable flexbox
          justifyContent="center"  // Center horizontally
          alignItems="center"  // Center vertically (if necessary)
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
          {messages.map((message, index) => (
            <Box
              key={index}
              display="flex"
              justifyContent={
                message.role === 'assistant' ? 'flex-start' : 'flex-end'
              }
              p={1}
            >
              <Box
                bgcolor={
                  message.role === 'assistant'
                    ? '#009147'
                    : '#37ad70'
                }
                color="white"
                borderRadius={6}
                p={2}
                maxWidth="80%"
                sx={{ wordBreak: 'break-word' }}
              >
                {message.content}
              </Box>
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
                e.preventDefault();  // Prevent default behavior (like form submission)
                sendMessage();
              }
            }}
            sx={{
              '& .MuiInputLabel-root': {
                color: 'black',  // Label color
              },
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: 'black',  // Border color when not focused
                },
                '&:hover fieldset': {
                  borderColor: 'black',  // Border color on hover
                },
                '&.Mui-focused fieldset': {
                  borderColor: 'black',  // Border color when focused
                },
              },
            }}
          />
          <Button
            variant="contained"
            onClick={sendMessage}
            sx={{
              bgcolor: '#FCB131',  // Background color
              color: 'black',  // Text color
              '&:hover': {
                bgcolor: '#f9a825',  // Hover background color (optional)
              },
            }}
          >
            Send
          </Button>
        </Stack>
      </Stack>
    </Box>
  )
}
