import {NextResponse} from 'next/server' // Import NextResponse from Next.js for handling responses
import OpenAI from 'openai' // Import OpenAI library for interacting with the OpenAI API

// System prompt for the AI, providing guidelines on how to respond to users
const systemPrompt = `
Welcome to the Olympic Games Knowledge Hub! 🌍🏅

You have access to a wealth of information about the Olympic Games, from their rich history to the latest updates. Whether you’re interested in the Summer or Winter Olympics, past or future events, we’ve got you covered.

Please select from the following options:

History of the Olympics: Explore the origins of the Olympic Games, including key milestones, historical highlights, and the evolution of the Games over time.
Upcoming Olympic Events: Find information about the next Olympic Games, including host cities, event schedules, and key details.
Past Olympics: Delve into the details of past Olympic Games, including host cities, notable moments, and results from previous years.
Athletes and Records: Learn about legendary athletes, record-breaking performances, and notable achievements across all Olympic Games.
Venue Information: Discover the venues used in the Olympic Games, including historical and current locations, and their significance.
Event Schedules: Access the schedules for past and upcoming Olympic events, including opening and closing ceremonies, competitions, and more.
Medal Counts: View medal counts and rankings by country for all Olympic Games, highlighting top-performing nations and athletes.
Olympic Sports: Get detailed information on the various sports included in the Olympics, their history, rules, and notable events.
FAQs: Find answers to frequently asked questions about the Olympic Games, including general information and specific queries.
Let us assist you in exploring the incredible world of the Olympics and uncovering the stories and facts that make the Games so special.

Enjoy your journey through Olympic history and current events!
`;

export async function POST(req) {
  const openai = new OpenAI() // Create a new instance of the OpenAI client
  const data = await req.json() // Parse the JSON body of the incoming request

  // Create a chat completion request to the OpenAI API
  const completion = await openai.chat.completions.create({
    messages: [{ role: 'system', content: systemPrompt }, ...data], // Include the system prompt and user messages
    model: 'gpt-4o', // Specify the model to use
    stream: true, // Enable streaming responses
  })

  // Create a ReadableStream to handle the streaming response
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder() // Create a TextEncoder to convert strings to Uint8Array
      try {
        // Iterate over the streamed chunks of the response
        for await (const chunk of completion) {
          const content = chunk.choices[0]?.delta?.content // Extract the content from the chunk
          if (content) {
            const cleanedContent = content.replace(/###\s*|\*\*.*?\*\*/g, ''); // Clean markdown from the content
            const text = encoder.encode(cleanedContent) // Encode the content to Uint8Array
            controller.enqueue(text) // Enqueue the encoded text to the stream
          }
        }
      } catch (err) {
        controller.error(err) // Handle any errors that occur during streaming
      } finally {
        controller.close() // Close the stream when done
      }
    },
  })

  return new NextResponse(stream) // Return the stream as the response
}
