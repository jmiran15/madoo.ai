// 260 tokens
export const base_style_system =
  'You will receive a story text. Create a concise style guide for images that could illustrate this story. Focus on overall aesthetic elements, not specific examples.\n\nInclude:\n- Realism level\n- Artist style \n- Color scheme\n- Line and edge qualities\n- Lighting and mood\n- Historical accuracy\n- Camera effects\n\nThe guide should start with "in the style of..." or similar phrasing so it can be appended directly to image descriptions for Stable Diffusion. \n\nOutput ONLY the style guide paragraph.';

export const base_style_user = ({ query }: { query: string }) => `${query}`;

// 1,582 tokens
// need to shorten or fine-tune. Long because including examples from eleven labs docs. Needs some work to generate better transcripts, that show emotion, pauses, pacing, etc...
export const transcript_system =
  'You are a transcript generator for a television show. You are in charge of generating the transcript for the episodes. You will be given the following information:\nRAW_TEXT:\nSPECIFIC_EPISODE_TEXT:\nThe raw text is all of the information that will be used when generating the entire television show. Your task is to generate the transcript for the specific episode that you have been provided. \n\nYour transcript should be a continues stream of text. All text that should be said MUST be inside quotation marks. You can only include text inside your response IF it is to be said. You must make your transcript as realistic as possible, to do this, you must make use of the following things in your transcript:\n1. Pauses: There are a few ways to introduce a pause or break and influence the rhythm and cadence of the speaker. The most consistent way is programmatically using the syntax <break time="1.5s" />. This will create an exact and natural pause in the speech.\nAn example of this:\n"Give me one second to think about it." <break time="1.0s" /> "Yes, that would work."\nBreak time should be described in seconds, and pauses should be a MAX of 3 seconds.\n\n2. Pronunciation:\nIn certain instances, you may want the model to pronounce a word, name, or phrase in a specific way. Pronunciation can be specified using standardised pronunciation alphabets. Currently we support the International Phonetic Alphabet (IPA) and the CMU Arpabet. Pronunciations are specified by wrapping words using the Speech Synthesis Markup Language (SSML) phoneme tag.\n\nTo use this feature, you need to wrap the desired word or phrase in the <phoneme alphabet="ipa" ph="your-IPA-Pronunciation-here">word</phoneme> tag for IPA, or <phoneme alphabet="cmu-arpabet" ph="your-CMU-pronunciation-here">word</phoneme> tag for CMU Arpabet. Replace "your-IPA-Pronunciation-here" or "your-CMU-pronunciation-here" with the desired IPA or CMU Arpabet pronunciation.\n\nAn example for IPA:\n\n\n<phoneme alphabet="ipa" ph="ˈæktʃuəli">actually</phoneme>\nAn example for CMU Arpabet:\n\n\n<phoneme alphabet="cmu-arpabet" ph="AE K CH UW AH L IY">actually</phoneme>\nIt is important to note that this only works per word. Meaning that if you, for example, have a name with a first and last name that you want to be pronounced a certain way, you will have to create the pronunciation for each word individually.\n\nEnglish is a lexical stress language, which means that within multi-syllable words, some syllables are emphasized more than others. The relative salience of each syllable is crucial for proper pronunciation and meaning distinctions. So, it is very important to remember to include the lexical stress when writing both IPA and ARPAbet as otherwise, the outcome might not be optimal.\n\nTake the word “talon”, for example.\n\nIncorrect:\n\n\n<phoneme alphabet="cmu-arpabet" ph="T AE L AH N">talon</phoneme>\nCorrect:\n\n\n<phoneme alphabet="cmu-arpabet" ph="T AE1 L AH0 N">talon</phoneme>\nThe first example might switch between putting the primary emphasis on AE and AH, while the second example will always be pronounced reliably with the emphasis on AE and no stress on AH.\n\nIf you write it as:\n\n\n<phoneme alphabet="cmu-arpabet" ph="T AE0 L AH1 N">talon</phoneme>\nIt will always put emphasis on AH instead of AE.\n3. Emotion:\nIf you want the transcript to express a specific emotion, the best approach is to write in a style similar to that of a book. To find good prompts to use, you can flip through some books and identify words and phrases that convey the desired emotion.\n\n4. Pacing:\nBased on varying user feedback and test results, it’s been theorized that using a singular long sample for voice cloning has brought more success for some, compared to using multiple smaller samples. The current theory is that the AI stitches these samples together without any separation, causing pacing issues and faster speech. This is likely why some people have reported fast-talking clones.\n\nTo control the pacing of the speaker, you can use the same approach as in emotion, where you write in a style similar to that of a book. While it’s not a perfect solution, it can help improve the pacing and ensure that the AI generates a voiceover at the right speed. With this technique, you can create high-quality voiceovers that are both customized and easy to listen to.\n\n\n"I wish you were right, I truly do, but you\'re not," he said slowly.\n\n\nHere are some short examples highlighting some of the realism:\n\n1. Shouting example -> Rising anger, whispering to shouting, “No, you clearly don’t know who you’re talking to, so let me clue you in. I am not in danger, Skyler. I AM the danger. A guy opens his door and gets shot and you think that of me? No. I am the one who knocks!”\n2. Shouting example -> “I can’t believe this!” she said sadly, tears welling up in her eyes. “Is it really over?”\n3. Shouting example -> Screaming and in a low tone, “get the key your fool! We need to get our of here now!”\n4. Emotion example -> “Noooohuhuhu. I don’t want to!” she cried. “I want… to eat… my ice cream!” She sobbed uncontrollably.\n5. Whispering example ->“When you get to the gate, use the key! – and - make sure to not let… the.. demons… in!”\n6. Laughter example -> “Haha! That’s funny! I wish I would have thought of that. I guess it doesn’t make sense really. Hahahahha.” She giggled\n7. Accents example -> Oi, mate, I tell ya, I was down in Southend last weekend, right? Sun was shining, everyone was out, and you won’t believe who I bumped into – our old mate Gaz from Romford! Ain’t seen him in donkey’s years!\n8. Pauses example -> “If you want to introduce a pause ––- you can use dashes or … you can use an ellipsis”\n\nYour transcripts should be very engaging. That is your goal. To clearly convey the information in the provided chunk for that episode, while also being VERY engaging. This means your transcript should use all the features (or some) defined above to make it as engaging as possible. The spoken part of the content in the transcript must also be very engaging. The goal is to turn the raw chunk of text which may be boring into a narration for the episode that engages audience members. The narration does NOT need to include EVERYTHING in the chunk for the episode, ONLY the most important parts. This is very important to remember. The episode contents can contain some unnecessary information or dull information. You MUST not include this!\n';

export const transcript_user = ({ text }: { text: string }) => `TEXT:${text}`;

// 1,682 tokens
// long because including example.
export const image_insertion_system =
  'Create a series of time-stamped, highly detailed image descriptions based on the given transcript and consistent elements for a visually engaging and cohesive video episode.\n\nInput format:\n{\n"text": string;\n"chunks": [{"text": string; "timestamp": [number, number]}];\n"elements": [{"name": string; "description": string; "id": string}]\n}\n\nOutput format:\n[\n{"start": number; "end": number; "description": string}\n]\n\nIn the "description" field, reference the consistent elements using the format {elementId} where "elementId" is the id of the element provided in the input. The actual element descriptions will be inserted later.\n\nGuidelines:\n1. Maintain a consistent level of detail for characters, actions, settings, and emotions throughout the descriptions.\n2. Include specific details about time of day, weather, and other relevant environmental factors to enhance the visual narrative.\n3. Vividly convey characters\' emotions through facial expressions, body language, and other visual cues.\n4. Pace the images to align with the story\'s rhythm, focusing on key moments and maintaining a steady visual flow.\n5. Provide precise instructions for composition, layout, and framing of each image to minimize ambiguity for the artists.\n6. Seamlessly integrate the consistent elements into the descriptions using the {elementId} format.\n7. Ensure the first image starts at time 0 and the final image ends with the last narration chunk, maintaining continuous timestamps.\n\nRemember, your descriptions will directly guide the artists in creating visuals that enhance the storytelling and keep the audience engaged. Focus on crafting a rich, immersive visual narrative that maintains continuity and complements the narration.';

export const image_insertion_user = ({
  elements,
  text,
  chunks,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  elements: any;
  text: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  chunks: any;
}) =>
  `${JSON.stringify({
    text,
    chunks,
    elements,
  })}`;

// trying to generate consistant objects/characters

// should output JSON
export const consistancy_system =
  "Extract consistent elements from the provided text to ensure visual coherence across generated images for a video. Identify recurring objects, characters, settings, or other details.\n\nInput format:\n{\ntext: string;\n}\n\nOutput format:\n[\n{\nname: string;\ndescription: string;\n}\n]\n\nFor each element, provide a name for reference and an extremely detailed, unambiguous visual description. Be specific about colors, sizes, shapes, textures, and any other relevant attributes. Avoid subjective or interpretive terms, focusing instead on concrete, observable details.\n\nInclude precise measurements, dimensions, or quantities whenever possible, even if they are approximations based on the context provided. If a detail like color is not explicitly stated, make a reasonable suggestion based on the context.\n\nAim for descriptions that would yield nearly identical renderings from multiple artists without room for interpretation.";

// try to give it as much of the original text as possible
// give full raw in try catch, if catch, give just first sub raw.
export const user_consistancy = ({ query }: { query: string }) =>
  JSON.stringify({ text: query });

export const video_negative_prompt = `2D | | Low Quality | | text logos | | watermarks | | signatures | | out of frame | | jpeg artifacts | | ugly | | poorly drawn | | extra limbs | | extra hands | | extra feet | | backwards limbs | | extra fingers | | extra toes | | unrealistic, incorrect, bad anatomy | | cut off body pieces | | strange body positions | | impossible body positioning | | Mismatched eyes | | cross eyed | | crooked face | | crooked lips | | unclear | | undefined | | mutations | | deformities | | off center | | poor_composition | | duplicate faces, plastic, fake, tiny, negativity, blurry, blurred, doll, unclear`;

interface Element {
  name: string;
  description: string;
  id: string;
}

export function createStableDiffusionPrompt(
  elements: Element[],
  baseStyle: string,
  imageDescription: string,
): string {
  // Create a map of element IDs to their descriptions for faster lookup
  const elementMap = new Map<string, string>(
    elements.map((element) => [element.id, element.description]),
  );

  // Replace element names in the image description with their detailed descriptions
  const processedDescription = imageDescription.replace(
    /\{(\w+)\}/g,
    (_, elementId) => {
      const description = elementMap.get(elementId);
      return description ? description : `{${elementId}}`;
    },
  );

  // Combine the base style, processed image description, and additional details
  const prompt = `${baseStyle}. ${processedDescription}. Detailed, colorful, storybook illustration. Wide-angle shot, soft natural lighting, subtle texture.`;

  return prompt;
}
