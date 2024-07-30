import { ChatCompletionMessageParam } from "groq-sdk/resources/chat/completions";

import Groq from "groq-sdk";

const beginSentence = "BEGIN_SENTENCE";

const agentPrompt = `YOUR_SYSTEM_PROMPT`;

export class GrokLlmClient {
  private client: Groq;
  private conversationHistory: ChatCompletionMessageParam[] = [];

  constructor() {
    this.client = new Groq({
      apiKey: "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",
      dangerouslyAllowBrowser: true,
    });
  }

  beginConversation(): string {
    this.conversationHistory = [
      {
        role: "system",
        content: agentPrompt,
      },
      {
        role: "assistant",
        content: beginSentence,
      },
    ];
    return beginSentence;
  }

  async DraftResponse(transcript: string): Promise<string> {
    if (this.conversationHistory.length === 0) {
      this.conversationHistory = [
        {
          role: "system",
          content: agentPrompt,
        },
        {
          role: "assistant",
          content: beginSentence,
        },
      ];
    } else {
      this.conversationHistory.push({
        role: "user",
        content: transcript,
      });
    }

    console.log(this.conversationHistory);

    const requestMessages = [...this.conversationHistory];

    try {
      let events = await this.getGroqChatStream(requestMessages);

      let fullResponse = "";
      for await (const event of events) {
        if (event.choices.length >= 1) {
          let delta = event.choices[0].delta;
          if (!delta || !delta.content) continue;
          fullResponse += delta.content;
          console.log(delta.content);
        }
      }

      this.conversationHistory.push({
        role: "assistant",
        content: fullResponse,
      });

      return fullResponse;
    } catch (err) {
      console.error("Error in gpt stream: ", err);
      throw err; // Re-throw the error to be handled by the caller
    }
  }

  private async getGroqChatStream(
    requestMessages: Array<ChatCompletionMessageParam>
  ) {
    return this.client.chat.completions.create({
      messages: requestMessages,
      model: "llama-3.1-8b-instant",
      temperature: 0.5,
      max_tokens: 1024,
      top_p: 1,
      stop: null,
      stream: true,
    });
  }
}
