import { NextResponse } from 'next/server'
import OpenAI from 'openai'

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
  const openai = new OpenAI()

  try {
    const data = await req.json()
    console.log('Request data:', data); // Log request data

    const { messages = [], regenerate = false } = data

    let messagesToSend = [...messages]

    if (regenerate) {
      const previousQuestion = messages[messages.length - 1]?.content
      if (previousQuestion) {
        messagesToSend = messages.slice(0, -1)
        messagesToSend.push({ role: 'user', content: previousQuestion })
      }
    }

    const completion = await openai.chat.completions.create({
      messages: [{ role: 'system', content: systemPrompt }, ...messagesToSend],
      model: 'gpt-4o',
      stream: true,
    })

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder()
        try {
          for await (const chunk of completion) {
            const content = chunk.choices[0]?.delta?.content
            if (content) {
              const cleanedContent = content.replace(/###\s*|\*\*.*?\*\*/g, '')
              const text = encoder.encode(cleanedContent)
              controller.enqueue(text)
            }
          }
        } catch (err) {
          console.error('Stream error:', err)
          controller.error(err)
        } finally {
          controller.close()
        }
      },
    })

    return new NextResponse(stream)
  } catch (err) {
    console.error('Request handling error:', err)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
