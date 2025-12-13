'use server';
/**
 * @fileOverview A Text-to-Speech (TTS) flow using Genkit.
 *
 * - generateSpeech - A function that converts text to speech for a given language.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import wav from 'wav';
import { googleAI } from '@genkit-ai/googleai';

const SpeechRequestSchema = z.object({
  text: z.string().describe('The text to be converted to speech.'),
  language: z.string().describe('The language code (e.g., "en", "hi", "ta").'),
});

const SpeechResponseSchema = z.object({
  audioDataUri: z.string().describe('The base64 encoded WAV audio data URI.'),
});

// A map to select a voice based on language. You can add more voices.
// See available voices here: https://cloud.google.com/text-to-speech/docs/voices
const languageToVoice = {
  en: 'en-US-Standard-C', // English (US), Female
  hi: 'hi-IN-Standard-A', // Hindi, Female
  ta: 'ta-IN-Standard-B', // Tamil, Male
  bn: 'bn-IN-Standard-A', // Bengali, Female
};

async function toWav(
  pcmData,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
) {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    const bufs = [];
    writer.on('error', reject);
    writer.on('data', (d) => bufs.push(d));
    writer.on('end', () => resolve(Buffer.concat(bufs).toString('base64')));

    writer.write(pcmData);
    writer.end();
  });
}

const generateSpeechFlow = ai.defineFlow(
  {
    name: 'generateSpeechFlow',
    inputSchema: SpeechRequestSchema,
    outputSchema: SpeechResponseSchema,
  },
  async ({ text, language }) => {
    const voiceName = languageToVoice[language] || languageToVoice['en'];
    
    const { media } = await ai.generate({
      model: googleAI.model('gemini-2.5-flash-preview-tts'),
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            customVoiceConfig: { voiceName },
          },
        },
      },
      prompt: text,
    });
    
    if (!media || !media.url) {
      throw new Error('No audio media was returned from the TTS model.');
    }

    const audioBuffer = Buffer.from(
      media.url.substring(media.url.indexOf(',') + 1),
      'base64'
    );
    
    const wavBase64 = await toWav(audioBuffer);

    return {
      audioDataUri: `data:audio/wav;base64,${wavBase64}`,
    };
  }
);


export async function generateSpeech(input) {
  return generateSpeechFlow(input);
}
