/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";

export interface AppointmentData {
  patientName: string;
  issue: string;
  preferredDate: string;
  preferredTime: string;
  email: string;
}

export class GeminiLiveService {
  private ai: GoogleGenAI;
  private session: any = null;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined");
    }
    this.ai = new GoogleGenAI({ apiKey });
  }

  async connect(callbacks: {
    onAudioOutput: (base64Data: string) => void;
    onInterrupted: () => void;
    onClose: () => void;
    onOpen: () => void;
    onShowForm: (data: AppointmentData) => void;
  }) {
    const systemInstruction = `
      You are "AI Agent", a receptionist at "Ziva's Dental Care".
      Your goal is to help patients book dental appointments in a friendly, super-human way.
      
      CRITICAL GUIDELINES:
      1. Speak like a normal human being, NOT a robot. Use "hmm", "okay", "I see" etc.
      2. Start by greeting and asking for their name.
      3. Ask "what happened" or "what brings you in today".
      4. Suggest taking an appointment and ask for preferred DATE and TIME.
      5. REPEAT and CONFIRM the details (Name, Issue, Date, and Time).
      6. Ask for their Gmail address.
      7. ONCE YOU HAVE ALL INFORMATION (Name, Issue, Date, Time, and Email), CALL THE 'showBookingForm' function.
      8. Tell them: "Great! I've prepared a booking form with your details including your email [Email]. Please check your screen, confirm everything is correct, and hit 'Finalize Booking' to receive your confirmation email."
      
      Be empathetic, concise, and professional.
    `;

    const config: any = {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: "Charon" } }, 
      },
      systemInstruction,
      tools: [
        {
          functionDeclarations: [
            {
              name: "showBookingForm",
              description: "Shows the appointment booking form with gathered details for user confirmation.",
              parameters: {
                type: "object",
                properties: {
                  patientName: { type: "string" },
                  issue: { type: "string" },
                  preferredDate: { type: "string" },
                  preferredTime: { type: "string" },
                  email: { type: "string" }
                },
                required: ["patientName", "issue", "preferredDate", "preferredTime", "email"]
              }
            }
          ]
        }
      ]
    };

    this.session = await this.ai.live.connect({
      model: "gemini-3.1-flash-live-preview",
      callbacks: {
        onopen: callbacks.onOpen,
        onmessage: async (message: LiveServerMessage) => {
          if (message.serverContent?.modelTurn?.parts) {
            for (const part of message.serverContent.modelTurn.parts) {
              if (part.inlineData?.data) {
                callbacks.onAudioOutput(part.inlineData.data);
              }
            }
          }

          if (message.toolCall) {
            console.log("Received tool call:", message.toolCall);
            for (const call of message.toolCall.functionCalls) {
              if (call.name === "showBookingForm") {
                callbacks.onShowForm(call.args as any);
                
                // Ensure we are sending a valid tool response
                if (this.session) {
                  try {
                    // Try multiple possible formats for the tool response to be safe
                    const payloads = [
                      {
                        toolResponse: {
                          functionResponses: [{
                            id: call.id,
                            response: { result: "Booking form displayed to user." }
                          }]
                        }
                      },
                      {
                        tool_response: {
                          function_responses: [{
                            id: call.id,
                            response: { result: "Booking form displayed to user." }
                          }]
                        }
                      }
                    ];
                    
                    for (const payload of payloads) {
                      try {
                        if (typeof this.session.send === 'function') {
                          this.session.send(payload);
                        } else if (typeof this.session.sendToolResponse === 'function') {
                          this.session.sendToolResponse((payload as any).toolResponse || (payload as any).tool_response);
                        }
                      } catch (e) {
                        console.warn("Attempt failed to send tool response payload", e);
                      }
                    }
                    console.log("Sent tool response for:", call.id);
                  } catch (err) {
                    console.error("Failed to send tool response:", err);
                  }
                }
              }
            }
          }

          if (message.serverContent?.interrupted) {
            callbacks.onInterrupted();
          }
        },
        onclose: callbacks.onClose,
        onerror: (error: any) => console.error("Gemini Live Error:", error),
      },
      config,
    });

    return this.session;
  }

  sendAudio(base64Data: string) {
    if (this.session) {
      this.session.sendRealtimeInput({
        audio: { data: base64Data, mimeType: "audio/pcm;rate=16000" },
      });
    }
  }

  disconnect() {
    if (this.session) {
      this.session.close();
      this.session = null;
    }
  }
}
